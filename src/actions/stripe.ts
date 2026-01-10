'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createRefund, getPaymentIntent, calculateStripeFee } from '@/lib/stripe'
import { revalidatePath } from 'next/cache'

export interface RefundResult {
  success: boolean
  refundId?: string
  amount?: number
  error?: string
}

/**
 * Procesar reembolso de una orden
 */
export async function processRefund(
  orderId: string,
  amount?: number
): Promise<RefundResult> {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  })

  if (!order) {
    return { success: false, error: 'Orden no encontrada' }
  }

  if (!order.stripePaymentId) {
    return { success: false, error: 'Orden no tiene ID de pago de Stripe' }
  }

  if (order.status === 'CANCELLED') {
    return { success: false, error: 'La orden ya esta cancelada' }
  }

  try {
    const refund = await createRefund(order.stripePaymentId, amount)

    // Actualizar orden en Prisma
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
      },
    })

    // Loggear el reembolso
    await prisma.webhookLog.create({
      data: {
        source: 'stripe',
        eventType: 'refund_created',
        payload: JSON.stringify({
          orderId,
          refundId: refund.id,
          amount: refund.amount,
          userId: session.user?.id,
        }),
        processed: true,
      },
    })

    revalidatePath('/admin/orders')

    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount / 100, // Convertir de centavos a euros
    }
  } catch (error: any) {
    console.error('Error procesando reembolso:', error.message)

    // Loggear error
    await prisma.webhookLog.create({
      data: {
        source: 'stripe',
        eventType: 'refund_failed',
        payload: JSON.stringify({
          orderId,
          error: error.message,
          userId: session.user?.id,
        }),
        processed: false,
        error: error.message,
      },
    })

    return { success: false, error: error.message }
  }
}

/**
 * Obtener detalles de pago de una orden
 */
export async function getOrderPaymentDetails(orderId: string) {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  })

  if (!order?.stripePaymentId) {
    return null
  }

  try {
    const paymentIntent = await getPaymentIntent(order.stripePaymentId)

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      created: new Date(paymentIntent.created * 1000),
      paymentMethod: paymentIntent.payment_method_types?.[0],
      fee: calculateStripeFee(paymentIntent.amount / 100),
    }
  } catch (error: any) {
    console.error('Error obteniendo detalles de pago:', error.message)
    return null
  }
}

/**
 * Verificar estado de pago en Stripe
 */
export async function verifyStripePayment(orderId: string): Promise<boolean> {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  })

  if (!order?.stripePaymentId) {
    return false
  }

  try {
    const paymentIntent = await getPaymentIntent(order.stripePaymentId)
    return paymentIntent.status === 'succeeded'
  } catch {
    return false
  }
}
