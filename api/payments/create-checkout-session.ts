import Stripe from 'stripe'
import { z } from 'zod'
import {
  isPaymentSkuId,
  PAYMENT_SKUS,
  resolveStripePriceId,
  type PaymentSkuId,
} from '../../src/lib/payments/catalog.ts'

export const config = { runtime: 'edge' }

const bodySchema = z.object({
  userId: z.string().regex(/^[a-zA-Z0-9-]{8,64}$/),
  sku: z.string().refine(isPaymentSkuId, 'Invalid sku'),
  memoryId: z.string().min(8).max(128).optional(),
  returnPath: z.string().max(256).optional(),
})

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

function getStripe(): Stripe | null {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return null
  return new Stripe(secret, { httpClient: Stripe.createFetchHttpClient() })
}

function resolveOrigin(req: Request): string {
  if (process.env.PUBLIC_APP_URL) {
    return process.env.PUBLIC_APP_URL.replace(/\/$/, '')
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  }
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  if (host) return `${proto}://${host}`
  return 'http://localhost:5173'
}

function sanitizeReturnPath(returnPath: string | undefined): string {
  if (!returnPath || !returnPath.startsWith('/') || returnPath.startsWith('//')) {
    return '/'
  }
  return returnPath.split('?')[0] ?? '/'
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  const stripe = getStripe()
  if (!stripe) {
    return jsonResponse(503, { error: 'Stripe is not configured' })
  }

  let parsed: z.infer<typeof bodySchema>
  try {
    const json = (await req.json()) as unknown
    parsed = bodySchema.parse(json)
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : 'Invalid body'
    return jsonResponse(400, { error: message ?? 'Invalid body' })
  }

  const skuDef = PAYMENT_SKUS[parsed.sku as PaymentSkuId]
  if (skuDef.kind === 'fertilizer' && !parsed.memoryId) {
    return jsonResponse(400, { error: 'memoryId is required for fertilizer purchases' })
  }

  const priceId = resolveStripePriceId(skuDef)
  if (!priceId) {
    return jsonResponse(503, { error: `Price not configured for ${parsed.sku}` })
  }

  const origin = resolveOrigin(req)
  const returnPath = sanitizeReturnPath(parsed.returnPath)
  const successUrl = `${origin}${returnPath}?checkout=success&session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${origin}${returnPath}?checkout=cancelled`

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: parsed.userId,
      metadata: {
        userId: parsed.userId,
        sku: parsed.sku,
        memoryId: parsed.memoryId ?? '',
      },
    })

    if (!session.url || !session.id) {
      return jsonResponse(500, { error: 'Stripe did not return a checkout URL' })
    }

    return jsonResponse(200, { url: session.url, sessionId: session.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed'
    return jsonResponse(500, { error: message })
  }
}
