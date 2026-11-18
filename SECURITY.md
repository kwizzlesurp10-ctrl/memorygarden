# MemoryGarden — Security

MemoryGarden is a client-first journaling app with optional Vercel Edge APIs (cloud sync, community gardens, LLM proxy, Stripe webhooks). This document describes the current threat model for operators and buyers — not a certification.

## Data locations

| Data | Where it lives |
|------|----------------|
| Memories, preferences, local profile | Browser `localStorage` (per-device), namespaced by local user id |
| Photos / audio (large) | Browser IndexedDB (`memorygarden-photos`) with `idb://` references in memory records |
| Optional cloud sync payload | Vercel KV key `mg:user:<userId>` — **text/metadata only**; photos/audio are stripped client-side |
| Community garden content | Neon Postgres (when `DATABASE_URL` is set) |
| Purchase entitlements | Vercel KV key `mg:entitlements:<userId>` |
| Stripe secrets / Anthropic key | Vercel environment variables only |

## Identity model (important)

**Default (unchanged):** each browser keeps a **local gardener profile** (`src/lib/local-user.ts`) in `localStorage`. Memories, photos, and unlock state stay on-device unless the user opts into cloud sync or signs in.

**Optional Neon Auth (Managed Better Auth):** when `VITE_NEON_AUTH_URL` and server `NEON_AUTH_BASE_URL` are configured, users may sign in with email/password (and enabled social providers in Neon). Signed-in API calls carry `Authorization: Bearer <JWT>` (15‑minute EdDSA token from `authClient.getSession()`). The Edge API verifies JWTs via Neon JWKS (`api/lib/neon-jwt.ts`) and checks that the requested **local user id** is linked to that Neon account in `mg_local_identity_link` (`db/migrations/001_mg_neon_account_linking.sql`).

**Production cutover:** when `NEON_AUTH_BASE_URL` is set, `/api/sync` and `/api/payments/*` require a verified JWT. The server derives the KV `userId` from the linked account (`api/lib/session-user-id.ts`); spoofed client ids return **401/403**. Local-only gardening without sign-in is unchanged.

**Local dev without Neon Auth:** legacy format-only `userId` checks remain for developers who omit `NEON_AUTH_BASE_URL`.

**Account linking:** `POST /api/auth/link-local` attaches the current browser’s local id to the signed-in Neon user. A local id already linked to a **different** Neon account returns **409** (no silent merge). Multiple devices can link different local ids to one Neon account; sync KV keys remain per local id (no garden overwrite on link).

## API notes

- **`/api/sync`** — Last-write-wins per linked local `userId`. Verified JWT required in production cutover (`api/sync.ts`, `api/lib/session-user-id.ts`).
- **`/api/gardens`** — GET validates UUID garden ids and optional `viewerId`. POST routes enforce **caller id format** via shared parsers (`api/gardens/lib/garden-access.ts`). **Membership authorization** is not enforced server-side yet (owner decision); collaborative invite UI is local-first today.
- **`/api/llm`** — Proxies to Anthropic; optional KV rate limit (~60 requests/hour/IP when KV is configured). No end-user auth (`api/llm.ts`, `api/llm-rate-limit.ts`).
- **`/api/payments/webhook`** — Stripe signature verification, idempotent fulfillment, `charge.refunded` revocation (`api/payments/webhook.ts`). Checkout metadata `userId` is set server-side at session creation.
- **`GET /api/payments/entitlements`** — Session-derived `userId`; optional `sessionId` filter.
- **`POST /api/payments/consume`** / **`create-checkout-session`** — Verified JWT in production cutover; `userId` derived from session.
- **`GET /api/auth/restore-entitlements`** — Signed-in only; merges KV entitlements across **all** linked local ids for purchase restore on a new device.
- **`POST /api/auth/link-local`** — Links local profile to Neon user (requires DB migration).

## Dependency audit

Run `pnpm audit` in CI or before releases. As of the server-hardening branch: direct bumps to **Vite 8.3.6** and **Vitest 4.1.12**, plus a pnpm **undici** override, reduced reported issues versus main; remaining findings are mostly transitive (dev tooling chains). See `SALE_READINESS.md` for counts and residual packages.

## Reporting issues

For production deployments you control, route reports to your support contact. This repository inherited a generic GitHub template license header; maintainers should publish a **product-specific** contact before a sale.

## Safe handling

- Never commit `.env`, Stripe keys, or webhook secrets.
- Use Stripe test mode and CLI forwarding for payment testing (`PAYMENTS.md`).
- Do not copy real user journals into tests, fixtures, or logs.
