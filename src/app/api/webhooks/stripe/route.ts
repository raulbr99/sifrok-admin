import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent, calculateStripeFee } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { createGelatoOrderFromStripe } from '@/actions/gelato'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    console.error('Webhook: Missing stripe-signature header')
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = constructWebhookEvent(body, signature)
  } catch (error: any) {
    console.error('Webhook: Error verificando firma:', error.message)
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${error.message}` },
      { status: 400 }
    )
  }

  // Loggear evento recibido
  await prisma.webhookLog.create({
    data: {
      source: 'stripe',
      eventType: event.type,
      payload: JSON.stringify(event.data.object),
      processed: false,
    },
  })

  console.log(`Webhook: Evento recibido - ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      default:
        console.log(`Webhook: Evento no manejado - ${event.type}`)
    }

    // Marcar como procesado
    await prisma.webhookLog.updateMany({
      where: {
        eventType: event.type,
        processed: false,
      },
      data: { processed: true },
    })

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook: Error procesando evento:', error.message)

    // Loggear error
    await prisma.webhookLog.updateMany({
      where: {
        eventType: event.type,
        processed: false,
      },
      data: {
        processed: false,
        error: error.message,
      },
    })

    return NextResponse.json(
      { error: `Error procesando webhook: ${error.message}` },
      { status: 500 }
    )
  }
}

/**
 * Manejar checkout completado
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Webhook: Procesando checkout.session.completed')
  console.log('Session ID:', session.id)

  // Buscar o crear orden en Prisma
  let order = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
  })

  if (!order) {
    // Crear orden si no existe
    console.log('Webhook: Creando nueva orden')

    const customerDetails = session.customer_details
    // shipping_details puede no existir en todos los tipos de sesion
    const shippingDetails = (session as any).shipping_details as { name?: string; address?: { line1?: string; city?: string; postal_code?: string; country?: string } } | null

    order = await prisma.order.create({
      data: {
        stripeSessionId: session.id,
        stripePaymentId: session.payment_intent as string,
        userId: (session.metadata?.userId || session.client_reference_id) as string,
        total: (session.amount_total || 0) / 100,
        currency: session.currency || 'eur',
        status: 'PAID',
        shippingName: shippingDetails?.name || customerDetails?.name || '',
        shippingEmail: customerDetails?.email || '',
        shippingAddress: shippingDetails?.address?.line1 || '',
        shippingCity: shippingDetails?.address?.city || '',
        shippingZipCode: shippingDetails?.address?.postal_code || '',
        shippingCountry: shippingDetails?.address?.country || 'ES',
        stripeFee: calculateStripeFee((session.amount_total || 0) / 100),
      },
    })

    // Crear order items desde metadata si existe
    if (session.metadata?.items) {
      try {
        const items = JSON.parse(session.metadata.items)
        for (const item of items) {
          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              productName: item.name,
              variantId: item.variantId,
              variantName: item.variantName,
              quantity: item.quantity,
              price: item.price,
              image: item.image,
            },
          })
        }
      } catch (e) {
        console.error('Webhook: Error parseando items:', e)
      }
    }
  } else {
    // Actualizar orden existente
    console.log('Webhook: Actualizando orden existente')
    order = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        stripePaymentId: session.payment_intent as string,
        stripeFee: calculateStripeFee(order.total),
      },
    })
  }

  // Enviar orden a Gelato automaticamente
  try {
    console.log('Webhook: Enviando orden a Gelato')
    await createGelatoOrderFromStripe(session.id)
    console.log('Webhook: Orden enviada a Gelato exitosamente')
  } catch (error: any) {
    console.error('Webhook: Error enviando a Gelato:', error.message)
    // No fallar el webhook, la orden se puede enviar manualmente
  }
}

/**
 * Manejar pago exitoso
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Webhook: Procesando payment_intent.succeeded')
  console.log('PaymentIntent ID:', paymentIntent.id)

  // Actualizar orden si existe
  const order = await prisma.order.findFirst({
    where: { stripePaymentId: paymentIntent.id },
  })

  if (order) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'PAID' },
    })
  }
}

/**
 * Manejar reembolso
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('Webhook: Procesando charge.refunded')
  console.log('Charge ID:', charge.id)

  // Buscar orden por payment_intent
  const order = await prisma.order.findFirst({
    where: { stripePaymentId: charge.payment_intent as string },
  })

  if (order) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
    })
  }
}
