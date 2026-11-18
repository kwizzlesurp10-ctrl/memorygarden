export const LEGAL_DRAFT_BANNER =
  'DRAFT — for Keith / counsel review before relying on this text in production.'

export type LegalPageId = 'privacy' | 'terms' | 'refunds'

export interface LegalSection {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export interface LegalPageContent {
  id: LegalPageId
  title: string
  lastUpdated: string
  intro: string[]
  sections: LegalSection[]
}

const sharedIntro =
  'MemoryGarden is a browser-based memory garden. By default your photos and garden data stay on your device. Optional cloud sync, sign-in, AI features, and paid boosts are described below as implemented in this codebase — not legal advice.'

export const LEGAL_PAGES: Record<LegalPageId, LegalPageContent> = {
  privacy: {
    id: 'privacy',
    title: 'Privacy Policy',
    lastUpdated: 'November 18, 2026',
    intro: [sharedIntro],
    sections: [
      {
        heading: 'Data on your device',
        paragraphs: [
          'Memories, photos (stored as files in IndexedDB), audio, reflections, preferences, and an anonymous local profile id live in your browser (localStorage and IndexedDB) unless you export, sync, or share.',
        ],
      },
      {
        heading: 'Optional cloud sync',
        paragraphs: [
          'If you sign in and enable cloud sync, the app uploads a JSON document to our server (Vercel KV). That document includes memory text, positions, traits, and preferences. Photos and audio are not included in sync payloads.',
          'Sync is last-write-wins per linked account. A verified Neon Auth session is required to read or write sync data in production.',
        ],
      },
      {
        heading: 'Optional account (Neon Auth)',
        paragraphs: [
          'If enabled, you may create an account with email/password managed by Neon Auth. We store a link between your Neon user id and your browser’s local profile id so purchases and sync can follow you across devices after you link this browser.',
        ],
      },
      {
        heading: 'AI features',
        paragraphs: [
          'When configured, classification and “Garden AI” reflections send text you submit (and short neighbor context for reflections) to an LLM provider via our Edge API (`/api/llm`, typically Anthropic). Images are not sent to the AI in these flows.',
        ],
      },
      {
        heading: 'Payments',
        paragraphs: [
          'Paid fertilizer boosts and cosmetic packs use Stripe Checkout. Stripe processes payment card data; we store entitlement records (SKU, checkout session id, status) keyed to your linked local profile id — not full card numbers.',
        ],
      },
      {
        heading: 'Community gardens',
        paragraphs: [
          'If you join public collaborative gardens, contributor display names and shared memory content may be stored in Neon Postgres when that feature is enabled.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'For privacy questions about the production deployment at memorygarden.vercel.app, contact the site operator (Keith) using the support channel listed on the site once counsel approves contact details.',
        ],
      },
    ],
  },
  terms: {
    id: 'terms',
    title: 'Terms of Service',
    lastUpdated: 'November 18, 2026',
    intro: [
      sharedIntro,
      'These draft terms govern use of the MemoryGarden web app. If you do not agree, use the free local-only features without signing in or purchasing.',
    ],
    sections: [
      {
        heading: 'The service',
        paragraphs: [
          'MemoryGarden lets you plant and tend digital memories in a personal garden. Core use is free. Optional paid items (Premium Fertilizer, Legendary Elixir, Starlight Collection) grant in-app boosts or cosmetics after Stripe confirms payment.',
        ],
      },
      {
        heading: 'Accounts and eligibility',
        paragraphs: [
          'You must be old enough to form a binding contract in your jurisdiction. Sign-in is required for cloud sync and purchases when Neon Auth is enabled on the deployment you use.',
        ],
      },
      {
        heading: 'Your content',
        paragraphs: [
          'You retain ownership of memories and media you create. You grant us a limited license to host, process, and sync content only as needed to operate features you turn on (sync, AI, community gardens, sharing links).',
        ],
      },
      {
        heading: 'Acceptable use',
        bullets: [
          'Do not attempt to access another user’s sync data or entitlements.',
          'Do not abuse AI or community endpoints to generate spam or unlawful content.',
          'Do not reverse-engineer payment flows to obtain paid items without paying.',
        ],
        paragraphs: [],
      },
      {
        heading: 'Paid features',
        paragraphs: [
          'Prices are shown before Stripe Checkout. Entitlements are granted after webhook-verified payment, not merely after redirecting back from Stripe. Garden Boost (standard) remains free.',
        ],
      },
      {
        heading: 'Disclaimers',
        paragraphs: [
          'The app is provided “as is.” MemoryGarden is not therapy, medical care, or a guaranteed backup service. Maintain your own backups via in-app export when memories matter to you.',
        ],
      },
      {
        heading: 'Changes',
        paragraphs: [
          'We may update these terms. Material changes should be posted on this page with a new “Last updated” date before they apply to new purchases.',
        ],
      },
    ],
  },
  refunds: {
    id: 'refunds',
    title: 'Refund Policy',
    lastUpdated: 'November 18, 2026',
    intro: [
      'One-time digital purchases: Premium Fertilizer ($2.99), Legendary Elixir ($4.99), and Starlight Collection ($3.99). Garden Boost remains free.',
    ],
    sections: [
      {
        heading: 'How purchases work',
        paragraphs: [
          'After Stripe confirms payment, a webhook grants an entitlement in our system. Your browser applies the boost or cosmetic pack and marks the entitlement consumed. Refunds remove the server-side entitlement for that checkout session.',
        ],
      },
      {
        heading: 'Refund requests',
        paragraphs: [
          'Contact the site operator within 14 days of purchase if a paid item did not apply after successful payment, or if you purchased by mistake before consuming the entitlement.',
          'Once a boost or pack is consumed in-app, refunds may be declined because the digital benefit was delivered.',
        ],
      },
      {
        heading: 'Stripe and chargebacks',
        paragraphs: [
          'Approved refunds are processed through Stripe to your original payment method. Chargebacks are handled under Stripe and card-network rules; we may revoke entitlements tied to refunded charges.',
        ],
      },
      {
        heading: 'Taxes',
        paragraphs: [
          'Displayed prices may not include sales tax or VAT. Stripe Checkout may calculate tax when configured in the live Stripe account — configure tax in Stripe Dashboard before go-live.',
        ],
      },
    ],
  },
}

export function normalizeLegalPath(pathname: string): LegalPageId | null {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  if (normalized === '/privacy') return 'privacy'
  if (normalized === '/terms') return 'terms'
  if (normalized === '/refunds') return 'refunds'
  return null
}