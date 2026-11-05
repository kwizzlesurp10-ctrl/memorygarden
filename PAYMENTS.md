# Stripe payments (Memory Garden)

One-time purchases use **Stripe Checkout** (hosted page). Fulfillment runs on the server via webhooks — the success redirect alone does not grant boosts or cosmetics.

## What you can buy

| SKU | Product | Suggested price | Env var for Price ID |
|-----|---------|-----------------|----------------------|
| `fertilizer-premium` | Premium Fertilizer (one memory) | $2.99 | `STRIPE_PRICE_FERTILIZER_PREMIUM` |
| `fertilizer-legendary` | Legendary Elixir (one memory) | $4.99 | `STRIPE_PRICE_FERTILIZER_LEGENDARY` |
| `cosmetic-starlight-pack` | Starlight Collection (cosmetic unlocks) | $3.99 | `STRIPE_PRICE_COSMETIC_STARLIGHT_PACK` |

**Garden Boost (standard)** stays free — no Stripe product.

### Starlight Collection unlocks (cosmetic only)

- Palette: `midnight`
- Pattern: `gradient`
- Adornments: `fireflies`, `sparkles`

## Stripe Dashboard setup (test mode)

1. Create three **Products** (or one product with three **Prices**) matching the table above.
2. Copy each **Price ID** (`price_...`) into the matching Vercel env var.
3. Developers → **Webhooks** → Add endpoint:
   - **URL:** `https://memorygarden.vercel.app/api/payments/webhook` (or your preview URL)
   - **Events:** `checkout.session.completed`, `checkout.session.async_payment_succeeded`
4. Copy the webhook **Signing secret** into `STRIPE_WEBHOOK_SECRET`.

Use the Stripe CLI locally to forward webhooks:

```bash
stripe listen --forward-to localhost:5173/api/payments/webhook
```

## Vercel environment variables

| Variable | Required | Notes |
|----------|----------|--------|
| `STRIPE_SECRET_KEY` | Yes | `sk_test_...` or live secret |
| `STRIPE_WEBHOOK_SECRET` | Yes | `whsec_...` from Dashboard or CLI |
| `STRIPE_PRICE_FERTILIZER_PREMIUM` | Yes | Price ID for premium fertilizer |
| `STRIPE_PRICE_FERTILIZER_LEGENDARY` | Yes | Price ID for legendary elixir |
| `STRIPE_PRICE_COSMETIC_STARLIGHT_PACK` | Yes | Price ID for Starlight pack |
| `KV_REST_API_URL` | Yes | Same Upstash/Vercel KV as `/api/sync` — stores entitlements per client id |
| `KV_REST_API_TOKEN` | Yes | KV REST token |
| `PUBLIC_APP_URL` | Recommended | e.g. `https://memorygarden.vercel.app` — used for Checkout return URLs |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Optional | Not required for redirect-only Checkout |

**Do not commit secrets.** Set all keys in the Vercel project settings.

## Client identity

Purchases are keyed to the local profile id from `getLocalUser()` (`memorygarden:user` in localStorage). Entitlements are stored server-side under `mg:entitlements:<userId>`. When real auth ships, map the authenticated user id to the same KV key (or migrate records).

## API routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/payments/create-checkout-session` | Creates Checkout Session, returns `{ url, sessionId }` |
| POST | `/api/payments/webhook` | Stripe webhook — grants entitlements when `payment_status === paid` |
| GET | `/api/payments/entitlements?userId=&sessionId=` | Poll entitlements after return |
| POST | `/api/payments/consume` | Marks an entitlement consumed after the client applies it |

## Test flow

1. Set env vars (Vercel preview or local with `vercel dev`).
2. Open the garden → boost a memory → choose **Premium** or **Legendary** → **Continue to secure checkout**.
3. Pay with Stripe test card `4242 4242 4242 4242`.
4. After redirect, the app polls entitlements, applies the boost or pack, then calls **consume**.
5. Confirm webhook delivery in Stripe Dashboard → Webhooks → event log.

## Implementation notes

- Checkout Sessions omit `payment_method_types` so Stripe uses current defaults.
- Server uses a per-request `Stripe` client with `Stripe.createFetchHttpClient()` for Edge compatibility.
- Webhook idempotency: processed event ids stored under `mg:stripe:event:<id>` in KV.
