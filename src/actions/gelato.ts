'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import axios from 'axios'

const GELATO_API_URL = 'https://order.gelatoapis.com/v4'

const gelatoApi = axios.create({
  baseURL: GELATO_API_URL,
  headers: {
    'X-API-KEY': process.env.GELATO_API_KEY || '',
    'Content-Type': 'application/json',
  },
})

interface ShippingAddress {
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2?: string
  city: string
  postCode: string
  country: string
  email: string
  phone?: string
}

interface GelatoOrderItem {
  itemReferenceId: string
  productUid: string
  quantity: number
  files?: Array<{
    type: string
    url: string
  }>
}

/**
 * Crear orden en Gelato desde una sesion de Stripe
 */
export async function createGelatoOrderFromStripe(stripeSessionId: string) {
  const session = await auth()
  if (!session) {
    throw new Error('No autenticado')
  }

  // Obtener orden de Prisma
  const order = await prisma.order.findUnique({
    where: { stripeSessionId },
    include: { orderItems: true },
  })

  if (!order) throw new Error('Orden no encontrada')

  if (order.gelatoOrderId) {
    throw new Error('Esta orden ya fue enviada a Gelato')
  }

  // Mapear items a formato Gelato
  const gelatoItems: GelatoOrderItem[] = []

  for (const item of order.orderItems) {
    const mapping = await prisma.productMapping.findUnique({
      where: { localProductId: item.productId },
    })

    if (!mapping) {
      console.warn(`Mapping no encontrado para producto ${item.productId}`)
      continue
    }

    gelatoItems.push({
      itemReferenceId: item.id,
      productUid: mapping.gelatoProductUid,
      quantity: item.quantity,
      files: item.image
        ? [{ type: 'default', url: item.image }]
        : undefined,
    })
  }

  if (gelatoItems.length === 0) {
    throw new Error('No hay items mapeados para enviar a Gelato')
  }

  // Preparar direccion de envio
  const nameParts = (order.shippingName || '').split(' ')
  const shippingAddress: ShippingAddress = {
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    addressLine1: order.shippingAddress || '',
    city: order.shippingCity || '',
    country: order.shippingCountry || 'ES',
    postCode: order.shippingZipCode || '',
    email: order.shippingEmail || '',
  }

  // Crear orden en Gelato
  try {
    const response = await gelatoApi.post('/orders', {
      orderType: 'order',
      orderReferenceId: order.id,
      customerReferenceId: order.userId,
      currency: order.currency.toUpperCase(),
      items: gelatoItems,
      shippingAddress,
    })

    const gelatoOrder = response.data

    // Actualizar orden en Prisma
    await prisma.order.update({
      where: { id: order.id },
      data: {
        gelatoOrderId: gelatoOrder.id,
        gelatoStatus: 'created',
        status: 'PROCESSING',
      },
    })

    // Loggear en WebhookLog
    await prisma.webhookLog.create({
      data: {
        source: 'gelato',
        eventType: 'order_created',
        payload: JSON.stringify(gelatoOrder),
        processed: true,
      },
    })

    revalidatePath('/admin/orders')

    return gelatoOrder
  } catch (error: any) {
    console.error('Error creando orden en Gelato:', error.response?.data || error.message)

    // Loggear error
    await prisma.webhookLog.create({
      data: {
        source: 'gelato',
        eventType: 'order_creation_failed',
        payload: JSON.stringify({
          orderId: order.id,
          error: error.response?.data || error.message,
        }),
        processed: false,
        error: error.message,
      },
    })

    throw new Error(`Error al crear orden en Gelato: ${error.message}`)
  }
}

/**
 * Obtener estado de una orden en Gelato
 */
export async function getGelatoOrderStatus(gelatoOrderId: string): Promise<string> {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  try {
    const response = await gelatoApi.get(`/orders/${gelatoOrderId}`)
    return response.data.fulfillmentStatus || response.data.status
  } catch (error: any) {
    console.error('Error obteniendo estado de Gelato:', error.response?.data || error.message)
    throw new Error('Error al consultar estado en Gelato')
  }
}

/**
 * Cancelar orden en Gelato
 */
export async function cancelGelatoOrder(orderId: string): Promise<boolean> {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  })

  if (!order?.gelatoOrderId) {
    throw new Error('Orden no tiene ID de Gelato')
  }

  try {
    await gelatoApi.delete(`/orders/${order.gelatoOrderId}`)

    await prisma.order.update({
      where: { id: orderId },
      data: {
        gelatoStatus: 'cancelled',
        status: 'CANCELLED',
      },
    })

    revalidatePath('/admin/orders')
    return true
  } catch (error: any) {
    console.error('Error cancelando orden en Gelato:', error.response?.data || error.message)
    throw new Error('Error al cancelar orden en Gelato')
  }
}

/**
 * Sincronizar estado de orden desde Gelato
 */
export async function syncGelatoOrderStatus(orderId: string) {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  })

  if (!order?.gelatoOrderId) {
    throw new Error('Orden no tiene ID de Gelato')
  }

  try {
    const response = await gelatoApi.get(`/orders/${order.gelatoOrderId}`)
    const gelatoData = response.data

    const updateData: any = {
      gelatoStatus: gelatoData.fulfillmentStatus || gelatoData.status,
    }

    // Actualizar tracking si existe
    if (gelatoData.shipments?.length > 0) {
      const shipment = gelatoData.shipments[0]
      updateData.gelatoTrackingUrl = shipment.trackingUrl
      updateData.trackingNumber = shipment.trackingCode
      updateData.carrier = shipment.carrierName

      if (shipment.shippedDate) {
        updateData.shippedAt = new Date(shipment.shippedDate)
        updateData.status = 'SHIPPED'
      }
    }

    // Mapear estado de Gelato a OrderStatus
    if (gelatoData.fulfillmentStatus === 'delivered') {
      updateData.status = 'DELIVERED'
    } else if (gelatoData.fulfillmentStatus === 'shipped') {
      updateData.status = 'SHIPPED'
    } else if (gelatoData.fulfillmentStatus === 'cancelled') {
      updateData.status = 'CANCELLED'
    }

    await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    })

    revalidatePath('/admin/orders')

    return updateData
  } catch (error: any) {
    console.error('Error sincronizando estado:', error.response?.data || error.message)
    throw new Error('Error al sincronizar estado desde Gelato')
  }
}
