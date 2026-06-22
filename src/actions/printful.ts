'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import {
  printfulApi,
  createPrintfulOrder,
  type PrintfulOrderItem,
  type PrintfulOrderRecipient,
} from '@/lib/printful'

// ---------------------------------------------------------------------------
// Capa de pedidos Printful — proveedor POD único.
//
// El webhook de Stripe llama a createPrintfulOrderFromStripe automáticamente.
// Printful imprime desde un `sync_variant_id` ya sincronizado
// (ProductMapping.printfulSyncVariantId), no desde una URL de imagen al vuelo:
// un producto sin variante sincronizada se omite del pedido.
// ---------------------------------------------------------------------------

/**
 * Crear orden en Printful desde una sesión de Stripe.
 */
export async function createPrintfulOrderFromStripe(stripeSessionId: string) {
  // Se llama desde el webhook de Stripe (server-trusted, verificado por firma):
  // no requiere sesión de usuario. El resto de acciones Printful sí exigen admin.
  const order = await prisma.order.findUnique({
    where: { stripeSessionId },
    include: { orderItems: true },
  })

  if (!order) throw new Error('Orden no encontrada')

  if (order.printfulOrderId) {
    throw new Error('Esta orden ya fue enviada a Printful')
  }

  // Mapear items a formato Printful (sync_variant_id).
  const printfulItems: PrintfulOrderItem[] = []

  for (const item of order.orderItems) {
    const mapping = await prisma.productMapping.findUnique({
      where: { localProductId: item.productId },
    })

    if (!mapping) {
      console.warn(`Mapping no encontrado para producto ${item.productId}`)
      continue
    }
    if (mapping.printfulSyncVariantId == null) {
      console.warn(
        `Producto ${item.productId} sin printfulSyncVariantId (no sincronizado en Printful)`,
      )
      continue
    }

    printfulItems.push({
      sync_variant_id: mapping.printfulSyncVariantId,
      quantity: item.quantity,
      retail_price: item.price.toFixed(2),
    })
  }

  if (printfulItems.length === 0) {
    const msg = 'No hay items con variante de Printful sincronizada para enviar'
    await prisma.order.update({ where: { id: order.id }, data: { fulfillmentError: msg } }).catch(() => {})
    throw new Error(msg)
  }

  // Destinatario (forma Printful: name / address1 / zip / country_code).
  const recipient: PrintfulOrderRecipient = {
    name: order.shippingName || '',
    address1: order.shippingAddress || '',
    city: order.shippingCity || '',
    country_code: order.shippingCountry || 'ES',
    zip: order.shippingZipCode || '',
    email: order.shippingEmail || '',
  }

  try {
    const result: any = await createPrintfulOrder({
      recipient,
      items: printfulItems,
      external_id: order.id,
    })

    await prisma.order.update({
      where: { id: order.id },
      data: {
        printfulOrderId: String(result.id),
        printfulStatus: result.status || 'draft',
        status: 'PROCESSING',
        fulfillmentError: null,
      },
    })

    await prisma.webhookLog.create({
      data: {
        source: 'printful',
        eventType: 'order_created',
        payload: JSON.stringify(result),
        processed: true,
      },
    })

    revalidatePath('/admin/orders')

    return result
  } catch (error: any) {
    console.error('Error creando orden en Printful:', error.response?.data || error.message)

    await prisma.webhookLog.create({
      data: {
        source: 'printful',
        eventType: 'order_creation_failed',
        payload: JSON.stringify({
          orderId: order.id,
          error: error.response?.data || error.message,
        }),
        processed: false,
        error: error.message,
      },
    })

    await prisma.order
      .update({
        where: { id: order.id },
        data: { fulfillmentError: String(error.message || 'Error desconocido').slice(0, 500) },
      })
      .catch(() => {})

    throw new Error(`Error al crear orden en Printful: ${error.message}`)
  }
}

/**
 * Reintentar el envío a Printful de una orden que falló (admin).
 * Reutiliza createPrintfulOrderFromStripe; este escribe/limpia fulfillmentError.
 */
export async function retryPrintfulFulfillment(
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw new Error('Orden no encontrada')
  if (order.printfulOrderId) {
    return { success: false, error: 'La orden ya fue enviada a Printful.' }
  }

  try {
    await createPrintfulOrderFromStripe(order.stripeSessionId)
    revalidatePath('/admin/orders')
    return { success: true }
  } catch (error: any) {
    revalidatePath('/admin/orders')
    return { success: false, error: error.message }
  }
}

/**
 * Obtener estado de una orden en Printful.
 */
export async function getPrintfulOrderStatus(printfulOrderId: string): Promise<string> {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  try {
    const response = await printfulApi.get(`/orders/${printfulOrderId}`)
    return response.data.result.status
  } catch (error: any) {
    console.error('Error obteniendo estado de Printful:', error.response?.data || error.message)
    throw new Error('Error al consultar estado en Printful')
  }
}

/**
 * Cancelar orden en Printful.
 */
export async function cancelPrintfulOrder(orderId: string): Promise<boolean> {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  })

  if (!order?.printfulOrderId) {
    throw new Error('Orden no tiene ID de Printful')
  }

  try {
    await printfulApi.delete(`/orders/${order.printfulOrderId}`)

    await prisma.order.update({
      where: { id: orderId },
      data: {
        printfulStatus: 'canceled',
        status: 'CANCELLED',
      },
    })

    revalidatePath('/admin/orders')
    return true
  } catch (error: any) {
    console.error('Error cancelando orden en Printful:', error.response?.data || error.message)
    throw new Error('Error al cancelar orden en Printful')
  }
}

/**
 * Sincronizar estado de orden desde Printful (tracking incluido).
 *
 * Estados Printful: draft, pending, failed, canceled, onhold, inprocess,
 * partial, fulfilled. (No hay "delivered": fulfilled es el estado terminal.)
 */
export async function syncPrintfulOrderStatus(orderId: string) {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  })

  if (!order?.printfulOrderId) {
    throw new Error('Orden no tiene ID de Printful')
  }

  try {
    const response = await printfulApi.get(`/orders/${order.printfulOrderId}`)
    const data = response.data.result

    const updateData: any = {
      printfulStatus: data.status,
    }

    // Tracking desde el primer envío.
    if (data.shipments?.length > 0) {
      const shipment = data.shipments[0]
      updateData.trackingNumber = shipment.tracking_number
      updateData.trackingUrl = shipment.tracking_url
      updateData.carrier = shipment.carrier
      const ts = shipment.ship_date || shipment.shipped_at || shipment.created
      if (ts) {
        // ship_date puede venir como epoch (s) o como fecha ISO.
        updateData.shippedAt = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts)
        updateData.status = 'SHIPPED'
      }
    }

    // Mapear estado de Printful a OrderStatus.
    if (data.status === 'fulfilled') {
      updateData.status = 'DELIVERED'
    } else if (data.status === 'canceled' || data.status === 'failed') {
      updateData.status = 'CANCELLED'
    }

    await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    })

    revalidatePath('/admin/orders')

    return updateData
  } catch (error: any) {
    console.error('Error sincronizando estado Printful:', error.response?.data || error.message)
    throw new Error('Error al sincronizar estado desde Printful')
  }
}
