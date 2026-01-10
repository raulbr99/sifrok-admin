import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    })
  }
  return stripeInstance
}


/**
 * Calcular comision de Stripe
 * Stripe cobra 2.9% + 0.30 EUR por transaccion
 */
export function calculateStripeFee(amount: number): number {
  return amount * 0.029 + 0.30
}

/**
 * Crear reembolso en Stripe
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number
): Promise<Stripe.Refund> {
  const refundData: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  }

  if (amount) {
    refundData.amount = Math.round(amount * 100) // Stripe usa centavos
  }

  return getStripe().refunds.create(refundData)
}

/**
 * Obtener detalles de un PaymentIntent
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return getStripe().paymentIntents.retrieve(paymentIntentId)
}

/**
 * Obtener detalles de una Checkout Session
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'payment_intent'],
  })
}

/**
 * Verificar firma de webhook
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return getStripe().webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}
