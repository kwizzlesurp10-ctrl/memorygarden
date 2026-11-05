import Stripe from 'stripe'
import { createEmptyEntitlementList, parseEntitlementList } from './lib/entitlements'
import {
  fulfillCheckoutIntoEntitlements,
  parseCheckoutSessionMetadata,
  shouldFulfillCheckoutSession,
} from './lib/stripe-fulfillment'
import {
  getKvEnv,
  hasProcessedStripeEvent,
  markStripeEventProcessed,
  readEntitlementsRaw,
  writeEntitlementsRaw,
} from './lib/kv'

export const config = { runtime: 'edge' }

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function getStripe(): Stripe | null {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return null
  return new Stripe(secret, { httpClient: Stripe.createFetchHttpClient() })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const kv = getKvEnv()

  if (!stripe || !webhookSecret) {
    return jsonResponse(503, { error: 'Stripe webhook is not configured' })
  }
  if (!kv) {
    return jsonResponse(503, { error: 'Entitlement storage is not configured' })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return jsonResponse(400, { error: 'Missing stripe-signature header' })
  }

  const rawBody = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return jsonResponse(400, { error: message })
  }

  if (await hasProcessedStripeEvent(kv, event.id)) {
    return jsonResponse(200, { received: true, duplicate: true })
  }

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  ) {
    const session = event.data.object as Stripe.Checkout.Session
    if (!shouldFulfillCheckoutSession(event.type, session.payment_status)) {
      await markStripeEventProcessed(kv, event.id)
      return jsonResponse(200, { received: true, skipped: 'payment_not_paid' })
    }

    const metadata = parseCheckoutSessionMetadata(session.metadata ?? undefined)
    if (!metadata) {
      await markStripeEventProcessed(kv, event.id)
      return jsonResponse(200, { received: true, skipped: 'invalid_metadata' })
    }

    const existingRaw = await readEntitlementsRaw(kv, metadata.userId)
    const list = existingRaw
      ? parseEntitlementList(JSON.parse(existingRaw))
      : createEmptyEntitlementList()

    const updated = fulfillCheckoutIntoEntitlements(list, session.id, metadata)
    const saved = await writeEntitlementsRaw(kv, metadata.userId, JSON.stringify(updated))
    if (!saved) {
      return jsonResponse(500, { error: 'Failed to persist entitlement' })
    }
  }

  await markStripeEventProcessed(kv, event.id)
  return jsonResponse(200, { received: true })
}
