/* eslint-disable no-console -- CLI output for operator */
/**
 * Idempotently create MemoryGarden Stripe products/prices in LIVE mode.
 *
 * DO NOT run in CI. Keith runs locally with a live secret key, e.g.:
 *   STRIPE_SECRET_KEY=sk_live_... node --experimental-strip-types scripts/stripe-setup-live.ts
 *
 * Prints Vercel env var names/values to copy. Does not modify this repo or Vercel.
 */

import Stripe from 'stripe'

const PRODUCTS = [
  {
    sku: 'fertilizer-premium',
    name: 'Premium Fertilizer',
    description: 'One-time growth boost for a single memory (MemoryGarden).',
    amountCents: 299,
    envKey: 'STRIPE_PRICE_FERTILIZER_PREMIUM',
    lookupKey: 'memorygarden_fertilizer_premium',
  },
  {
    sku: 'fertilizer-legendary',
    name: 'Legendary Elixir',
    description: 'Maximum growth boost for a single memory (MemoryGarden).',
    amountCents: 499,
    envKey: 'STRIPE_PRICE_FERTILIZER_LEGENDARY',
    lookupKey: 'memorygarden_fertilizer_legendary',
  },
  {
    sku: 'cosmetic-starlight-pack',
    name: 'Starlight Collection',
    description: 'Cosmetic palette/pattern/adornment pack (MemoryGarden).',
    amountCents: 399,
    envKey: 'STRIPE_PRICE_COSMETIC_STARLIGHT_PACK',
    lookupKey: 'memorygarden_cosmetic_starlight',
  },
] as const

function requireLiveKey(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secret) {
    console.error('Set STRIPE_SECRET_KEY to your sk_live_... key before running.')
    process.exit(1)
  }
  if (!secret.startsWith('sk_live_')) {
    console.error('Refusing to run: STRIPE_SECRET_KEY must be a live key (sk_live_...).')
    process.exit(1)
  }
  return new Stripe(secret)
}

async function findOrCreatePrice(
  stripe: Stripe,
  def: (typeof PRODUCTS)[number],
): Promise<{ priceId: string; productId: string }> {
  const existing = await stripe.prices.list({
    lookup_keys: [def.lookupKey],
    active: true,
    limit: 1,
  })
  if (existing.data[0]) {
    const price = existing.data[0]
    const productId = typeof price.product === 'string' ? price.product : price.product.id
    return { priceId: price.id, productId }
  }

  const product = await stripe.products.create({
    name: def.name,
    description: def.description,
    metadata: { memorygarden_sku: def.sku },
  })
  const price = await stripe.prices.create({
    product: product.id,
    currency: 'usd',
    unit_amount: def.amountCents,
    lookup_key: def.lookupKey,
    transfer_lookup_key: true,
  })
  return { priceId: price.id, productId: product.id }
}

async function main(): Promise<void> {
  const stripe = requireLiveKey()
  console.log('MemoryGarden — live Stripe catalog setup (idempotent)\n')

  for (const def of PRODUCTS) {
    const { priceId, productId } = await findOrCreatePrice(stripe, def)
    console.log(`${def.envKey}=${priceId}  # ${def.name} (product ${productId})`)
  }

  console.log('\nAlso set in Vercel (not printed here):')
  console.log('- STRIPE_SECRET_KEY=sk_live_...')
  console.log('- STRIPE_WEBHOOK_SECRET=whsec_... (from Dashboard webhook)')
  console.log('- PUBLIC_APP_URL=https://memorygarden.vercel.app')
  console.log('\nWebhook URL: https://memorygarden.vercel.app/api/payments/webhook')
  console.log('Events: checkout.session.completed, checkout.session.async_payment_succeeded, charge.refunded')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})