import type { AdornmentId, PaletteId, PatternId } from '../types'

export type PaymentSkuId =
  | 'fertilizer-premium'
  | 'fertilizer-legendary'
  | 'cosmetic-starlight-pack'

export type FertilizerBoostLevel = 'premium' | 'legendary'

export interface CosmeticPackDefinition {
  id: string
  name: string
  description: string
  displayPrice: string
  palettes: PaletteId[]
  patterns: PatternId[]
  adornments: AdornmentId[]
}

export interface PaymentSkuDefinition {
  id: PaymentSkuId
  name: string
  description: string
  displayPrice: string
  /** Vercel env var holding the Stripe Price ID (price_...) */
  stripePriceEnvKey: string
  kind: 'fertilizer' | 'cosmetic_pack'
  boostLevel?: FertilizerBoostLevel
  cosmeticPackId?: string
}

export const COSMETIC_PACKS: Record<string, CosmeticPackDefinition> = {
  starlight: {
    id: 'starlight',
    name: 'Starlight Collection',
    description:
      'Midnight palette, gradient pattern, fireflies & sparkles adornments — cosmetic only, supports the garden.',
    displayPrice: '$3.99',
    palettes: ['midnight'],
    patterns: ['gradient'],
    adornments: ['fireflies', 'sparkles'],
  },
}

export const PAYMENT_SKUS: Record<PaymentSkuId, PaymentSkuDefinition> = {
  'fertilizer-premium': {
    id: 'fertilizer-premium',
    name: 'Premium Fertilizer',
    description: 'One-time growth boost for a single memory.',
    displayPrice: '$2.99',
    stripePriceEnvKey: 'STRIPE_PRICE_FERTILIZER_PREMIUM',
    kind: 'fertilizer',
    boostLevel: 'premium',
  },
  'fertilizer-legendary': {
    id: 'fertilizer-legendary',
    name: 'Legendary Elixir',
    description: 'Maximum growth boost for a single memory.',
    displayPrice: '$4.99',
    stripePriceEnvKey: 'STRIPE_PRICE_FERTILIZER_LEGENDARY',
    kind: 'fertilizer',
    boostLevel: 'legendary',
  },
  'cosmetic-starlight-pack': {
    id: 'cosmetic-starlight-pack',
    name: 'Starlight Collection',
    description: COSMETIC_PACKS.starlight.description,
    displayPrice: COSMETIC_PACKS.starlight.displayPrice,
    stripePriceEnvKey: 'STRIPE_PRICE_COSMETIC_STARLIGHT_PACK',
    kind: 'cosmetic_pack',
    cosmeticPackId: 'starlight',
  },
}

export function isPaidFertilizerLevel(
  level: 'standard' | 'premium' | 'legendary',
): level is FertilizerBoostLevel {
  return level === 'premium' || level === 'legendary'
}

export function skuForFertilizerLevel(level: FertilizerBoostLevel): PaymentSkuId {
  return level === 'premium' ? 'fertilizer-premium' : 'fertilizer-legendary'
}

export function isPaymentSkuId(value: string): value is PaymentSkuId {
  return value in PAYMENT_SKUS
}

export function resolveStripePriceId(sku: PaymentSkuDefinition): string | null {
  const fromProcess =
    typeof process !== 'undefined' && process.env
      ? process.env[sku.stripePriceEnvKey]
      : undefined
  if (fromProcess && fromProcess.length > 0) return fromProcess
  return null
}
