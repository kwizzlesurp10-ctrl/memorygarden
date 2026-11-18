# MemoryGarden — Stripe live go-live checklist

**Do not run live setup from CI or cloud agents.** Keith performs these steps with live Stripe credentials.

## 1. Counsel review

- [ ] Review draft pages: `/privacy`, `/terms`, `/refunds` (marked draft in UI).
- [ ] Replace placeholder operator contact text after approval.

## 2. Neon Auth (production)

- [ ] `NEON_AUTH_BASE_URL` on Vercel (server / Edge).
- [ ] `VITE_NEON_AUTH_URL` on Vercel (build-time; same Auth URL).
- [ ] Trusted domains include `https://memorygarden.vercel.app` and preview URLs.
- [ ] Run `db/migrations/001_mg_neon_account_linking.sql` on production Neon branch.

When `NEON_AUTH_BASE_URL` is set, **sync and payments require a verified session**. Local-only gardening works without sign-in.

## 3. Create live products (Keith’s machine)

```bash
STRIPE_SECRET_KEY=sk_live_... pnpm exec node --experimental-strip-types scripts/stripe-setup-live.ts
```

Copy the printed `STRIPE_PRICE_*` values into Vercel. The script is idempotent (uses Stripe `lookup_key`s).

## 4. Vercel environment variables

| Variable | Notes |
|----------|--------|
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | From live webhook endpoint |
| `STRIPE_PRICE_FERTILIZER_PREMIUM` | `price_...` from setup script |
| `STRIPE_PRICE_FERTILIZER_LEGENDARY` | `price_...` |
| `STRIPE_PRICE_COSMETIC_STARLIGHT_PACK` | `price_...` |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Entitlements + sync |
| `PUBLIC_APP_URL` | `https://memorygarden.vercel.app` |
| `DATABASE_URL` | Account linking + community (if used) |
| `NEON_AUTH_BASE_URL` | Required for production auth cutover |
| `VITE_NEON_AUTH_URL` | Client Neon Auth URL |

Redeploy after env changes.

## 5. Stripe webhook (live mode)

- **URL:** `https://memorygarden.vercel.app/api/payments/webhook`
- **Events:** `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`
- Copy signing secret → `STRIPE_WEBHOOK_SECRET`

## 6. Smoke test (real money)

1. Sign in on production → **Link this browser & restore purchases**.
2. Buy cheapest SKU (Premium Fertilizer $2.99) with a real card.
3. Confirm webhook in Stripe Dashboard → entitlement appears after redirect.
4. **Refund** the charge in Stripe Dashboard; confirm entitlement removed server-side.
5. Confirm Garden Boost (free) still works signed out in a fresh browser profile.

## 7. Left for operator

- Tax/VAT in Stripe Checkout (Dashboard settings).
- Support email on legal pages.
- Analytics / MRR reporting outside this repo.

See also [PAYMENTS.md](../PAYMENTS.md) and [SALE_READINESS.md](../SALE_READINESS.md).