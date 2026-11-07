# MemoryGarden — Privacy overview

**Not legal advice.** Owners should have counsel review before marketplace listing.

## What stays on the device

By default, memories, reflections, photos, audio, unlock progress, and the anonymous local gardener profile remain in the browser (localStorage + IndexedDB). Clearing site data or switching browsers without a backup removes access to that garden unless cloud sync or a JSON backup was used.

## Optional cloud sync

When enabled, the client posts a JSON document to `/api/sync` containing memory text, positions, traits, and preferences. **Photos and audio are excluded** (`src/lib/garden-cloud-sync.ts`). The server stores one document per local user id in Vercel KV. There is no server-side encryption layer documented in code.

## Optional AI

Classification and reflection features call `/api/llm`, which forwards prompts to Anthropic when `ANTHROPIC_API_KEY` is configured. Prompts may include memory text the user submits. Disable the key in Vercel to force offline fallbacks.

## Community gardens

Public/collaborative gardens store contributor names, memory text, and photos in Neon when `DATABASE_URL` is set. Private memories use a `visibility` column; the API redacts content for non-owners (`api/gardens/lib/community-memory-privacy.ts`).

## Payments

Stripe Checkout handles card data. MemoryGarden stores purchase entitlements (SKU, session id) in KV — not full card numbers.

## Sharing

Share links expose individual memories according to share-id routes implemented in the client; review `ShareMemoryDialog` and shared-memory flows before enabling in regulated contexts.

## Deletion & recovery

- Local data: user clears browser storage or uses in-app clear flows where provided.
- Cloud KV: operator must delete keys in Vercel KV / migrate project.
- Community DB: operator must run SQL deletes in Neon.
- **Backup:** Menu → **Backup & restore** downloads versioned JSON; import merges without overwriting existing memory ids.

## Third-party services (when configured)

Anthropic, Stripe, Vercel (hosting + KV), Neon (Postgres), and the browser’s own storage APIs.
