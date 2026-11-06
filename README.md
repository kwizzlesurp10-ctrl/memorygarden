# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter. Plant each memory like a seed, return to tend it, and watch it grow into something alive on the canvas—never rushed, never noisy, always yours.

It is built for people who want a **private, sensory journal** without the performative pressure of a feed: one place where photos, words, and gentle motion add up to a garden you can **walk**, **pan across**, and **return to** on hard days and quiet ones alike.

**You might reach for MemoryGarden when you want to** capture a milestone, keep a light daily ritual, or preserve stories you do not want to lose to a camera roll buried three years deep.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as **plants** in a garden that responds to you: distance on the canvas becomes emotional geography, and returning becomes a small ritual instead of a chore.

- **Grow over time** — Plants advance through stages as you visit and reflect; neglect and care both leave traces you can feel when you come back.
- **Reflect emotions** — AI-assisted tone hints help steer variety and color so the garden mirrors how a memory *felt*, not just what it looked like.
- **Encourage reflection** — Add notes when you revisit; when you ask the Garden AI, the writing stays **brief and companion-like**—it is there to deepen your voice, not replace it.
- **Create connections** — Spatial proximity and clustering help you notice themes across seasons of your life without forcing everything into folders.
- **Adapt to seasons** — Light, mood, and atmosphere follow real time and season so the garden stays subtly tied to the world outside the screen.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & tend memories
- **Planting** — Upload a photo, write about the moment, set a date, and watch the memory sprout on the canvas with a plant silhouette that matches its tone.
- **Tending** — Open memories often to see them bloom and mature; each visit can add a short reflection so the story thickens the way real recall does.
- **Fertilizer boost** — **Garden Boost (standard)** is free. **Premium** and **Legendary** fertilizer are one-time Stripe Checkout purchases; entitlements apply **only after webhook-verified fulfillment** (never trust the success redirect alone).

### ✨ AI-powered insights
- **Emotional tone** — The app classifies your text to steer plant variety, palette accents, and growth character.
- **Garden AI** — Optional poetic reflections and light prompts; when it runs, it uses **text only** (see FAQ)—never your photo bytes.
- **Memory clusters** — Thematic or temporal groupings so you can browse by mood and season, not just chronology.

### 🎨 Beautiful views
- **Garden** — Illustrated pan-and-zoom canvas with animated plants and layered background “weather.”
- **Walk** — First-person open world: cross the gate and move among memories as if they were planted in a place.
- **Timeline** — A chronological path through every planted moment when you want speed over scenery.
- **Clusters** — Card-based exploration for thematic rabbit holes.
- **Bloom wall** — A gallery spotlight for memories that have reached **full bloom**—a celebratory wall without turning your journal into a leaderboard.

### 👥 Collaboration & sharing
- **Collaborative gardens** — Shared spaces for planting and tending together when that mode is enabled in the UI.
- **Private sharing** — Share specific memories with **link-style access you control** instead of broadcasting a whole album.

### 🌓 Living atmosphere
- **Day / night** — Background and lighting follow **local** time so “golden hour” in the app can match your window.
- **Seasonal mood** — Subtle shifts for the current season and overall garden “weather.”
- **Ambient sound** — Optional audio that tracks time of day and season; mute anytime.

### ⌨️ Power-user affordances
- **Keyboard shortcuts** — Faster navigation and actions; press **`?`** for the cheat sheet.
- **Protocol handlers** — Deep links such as `web+memorygarden://` when installed as a **PWA** (see `PROTOCOL_HANDLERS.md` for registration details).
- **PWA** — Install for an app-like shell, offline-friendly static assets, and optional protocol registration where the browser allows it.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a **client-heavy** React app tuned for smooth, organic motion and **local-first** data. The browser owns your memories by default; cloud pieces are optional adapters that never strip you of an offline-shaped mental model.

### App shape
- **`App.tsx` owns state** — Memories, preferences, and cross-surface UI composition bubble out from here (no separate global store).
- **Canvas + open world** — `GardenCanvas.tsx` is the illustrated infinite view; `OpenWorldGarden`/`engine` power the first-person walk when you want embodiment over overview.
- **Modals & flows** — Creation and detail live in components like `PlantMemoryModal.tsx` and `MemoryCard.tsx` (reflect, boost entitlements, optional AI prompts).

### Frontend stack
- **React 19 + TypeScript** — UI, hooks, and typed domain models (`src/lib/types.ts`).
- **Vite 8** — Dev server and production bundle to **`dist/`**; `@vitejs/plugin-react-swc` keeps Fast Refresh snappy.
- **Tailwind CSS v4** — Layout and responsive styling (`@tailwindcss/vite`).
- **Framer Motion** — Springs and transitions that avoid “slider UI” abruptness.
- **Radix UI** — Accessible primitives composed under `src/components/ui/`.

### Persistence & sync layering
- **`useKV` (`@/lib/storage`)** — Resolves to **`useLocalKV`**: namespaced **localStorage** keys under a `memorygarden` prefix, **scoped per local user id** (plus direct `readRaw` / `writeRaw` helpers for non-React code).
- **IndexedDB helpers** — Heavy blobs (notably **photos**) stay out of localStorage so you remain under typical string quotas.
- **`/api/sync` (Edge)** — Optional **Vercel KV / Upstash** document per user. **Photos are not synced**; structured memory fields (text, traits, position, reflections, etc.) can sync when KV env vars are present. On **`503`**, the client stays honest about “cloud off.”

### AI wiring
- **Client** — `getLLMProvider()` in `src/lib/llm-client.ts` tries **`fetch('/api/llm')` first**, then an optional **Spark** `window.spark` bridge in legacy environments, then a **static empty** provider so the UI never hard-crashes on missing AI.
- **Server** — `api/llm.ts` is a **Vercel Edge** handler: with `ANTHROPIC_API_KEY`, it calls Anthropic’s Messages API using **Haiku** for classification (`kind: 'classify'`) and **Sonnet** for richer reflections (`kind: 'reflect'`). **404/503** disables further HTTP attempts for that session so we do not spam a missing route.

### Payments (high level)
- **Stripe Checkout + webhooks** under `api/payments/*` record **entitlements in KV** after verified events—see **`PAYMENTS.md`** for the exact env var matrix and webhook list.

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/`) — A standalone Python agent example (CoinGecko) you run **separately** from the Vite app; CI can exercise it from its own directory without coupling to the garden runtime.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js** — Current **LTS** is the comfortable choice (this repo tracks a recent toolchain; see `package.json` engines if we add them later).
- **npm** — Ships with Node and matches the lockfile in this repository.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/kwizzlesurp10-ctrl/memorygarden.git
   cd memorygarden
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
   This mirrors **`.npmrc`** and sidesteps common peer-resolution friction between **Vite 8** and **`@vitejs/plugin-react-swc`**.

### Development
```bash
npm run dev
```
Starts **Vite** (also aliased as `npm start`). Default port is **5173** unless something else is already bound or you override `server.port` in `vite.config.ts`.

### Production build
```bash
npm run build
```
Runs **`vite build`** and writes a static site to **`dist/`** (Typecheck-on-save still happens in your editor; the npm script itself is **build-only**—run tests or `tsc` separately if you want an extra gate).

### Quality checks
```bash
npm run lint
npm test
```

### Preview the production bundle
```bash
npm run preview
```
Serves **`dist/`** through Vite’s preview server—use this after `npm run build` to catch last-mile routing or asset issues.

## Testing

Vitest drives automated checks for garden logic, storage edge cases, LLM client wiring, open-world locomotion, payments entitlements, and more.

### Commands
- **One-off run** — `npm test` (alias of `vitest run`)
- **Watch** — `npm run test:watch` (plain `vitest` for TDD loops)
- **Coverage** — `npm run test:coverage` (v8 provider)

Typical suites cover **growth/stage math**, **unlock & fertilizer entitlements**, **traits**, **local user migration**, **sanitize/validation**, **LLM HTTP provider behavior**, and **open-world** input/layout edge cases under `src/lib/__tests__/`.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The production story on **Vercel** is a **static SPA** (see `vercel.json` rewrites to `index.html`) plus a handful of **Edge** routes that add AI, optional sync, and payments without turning the client into a secrets backpack.

### Serverless / Edge routes
1. **`/api/llm`** — Proxies **classification** (`kind: 'classify'`) and **reflection** (`kind: 'reflect'`) prompts to **Anthropic** via `ANTHROPIC_API_KEY` (never shipped to browsers). If the key is absent, the function returns **`503`** and the UI gracefully falls back.
2. **`/api/sync`** — Optional **metadata sync** to **Vercel KV / Upstash** using **`KV_REST_API_URL`** + **`KV_REST_API_TOKEN`**. The payload is a **single JSON document per user** (`GET`/`POST`); **`Memory.photoUrl` is explicitly not synced**—photos stay on-device in IndexedDB while text/traits/positions/reflections can travel when KV is configured.
3. **`/api/gardens`** — **Community gardens** API backed by **Neon Postgres** when **`DATABASE_URL`** is configured (public listings, join/leave, plant/water/reflect over HTTP). This path is **separate from `/api/sync`**: it powers shared spaces, not your private IndexedDB archive.
4. **`/api/payments/*`** — Stripe **Checkout** session creation, webhook fulfillment, entitlement reads, and optional consume flows. Fertilizer boosts (**Premium / Legendary**) and the **Starlight** cosmetic pack are configured through env-backed Price IDs. Read **[PAYMENTS.md](./PAYMENTS.md)** for the authoritative table (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price vars, and KV namespaces for entitlements).

### Build & hosting notes
- **Install on CI** — `npm install --legacy-peer-deps` (or rely on `.npmrc`) so Vite 8 and the SWC React plugin resolve cleanly.
- **Build** — `npm run build` emits **`dist/`**; Vercel serves it as a static asset tree with SPA rewrites.
- **`vercel.json` headers** — A strict **Content-Security-Policy** is already declared for production; keep Stripe frames and `connect-src` allowances in mind when you add new third-party scripts.

### In-app honesty
The header **Sync to cloud** control reflects real status and backs off on **`503`** (missing KV), and the LLM client stops hammering **`/api/llm`** after **`404`/`503`**, so users are not misled about what is actually live.

## Privacy & data

- **Local-first** — Memories and media default to the browser (**`useKV` → localStorage** for structured state, **IndexedDB** for blobs). Nothing leaves the device except what you explicitly sync, share, or route through Stripe-hosted Checkout.
- **AI payloads** — Classification consumes **truncated text**; reflections may weave in **short neighboring textual context**. **Photos and profile objects are not part of those requests** in `api/llm.ts`.
- **Export** — Use **full-garden export** from settings when you want a portable archive you can hold outside the app.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Collaboration** — Richer shared-garden invitations, presence, and conflict-safe merges for joint tending without turning every memory into a Google Doc comment thread.
- **Export & print** — Higher-fidelity **PDF / poster** layouts from the Bloom Wall and timeline—beautiful offline artifacts, not just JSON dumps.
- **Accessibility & i18n** — Deep audit across **canvas**, **open world**, and **dialog** surfaces; extract marketing + UI copy for translation.
- **Performance at scale** — Continue **canvas virtualization**, mesh/texture budgeting in the walk mode, and asset prioritization for **very large gardens (500+ plants)** without shipping a fan-noise simulator.
- **Trust & safety** — Clearer disclosure surfaces for AI, sync, and payments so the emotional core stays legible behind the feature stack.
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on **your device**: `useKV` stores structured fields in **namespaced localStorage**, while **photos** land in **IndexedDB** to dodge storage quotas. **Optional `/api/sync`** mirrors metadata to **Vercel KV** when **`KV_REST_API_URL`** and **`KV_REST_API_TOKEN`** are set; even then, **photo blobs stay local** per `api/sync.ts`.

**Are photos sent to the AI?**  
**No.** `/api/llm` only sees **strings** you (or the client) put in the `prompt` field—never raw image bytes.

**Which LLM runs in production?**  
Production builds should hit **`/api/llm`**, which selects **Claude Haiku** for fast classification and **Claude Sonnet** for richer reflections (`api/llm.ts`). If that route is missing or unconfigured, `getLLMProvider()` can still pick up a legacy **`window.spark.llm`** bridge, then finally a **no-network** stub so the UI keeps rendering.

**Do I need Stripe or KV for a local dev session?**  
**No.** Skip those env vars and you still get a fully local garden—AI simply falls back until you add `ANTHROPIC_API_KEY`, and sync toggles show the honest disconnected state.

**How do I contribute or report an issue?**  
Use **GitHub issues and pull requests** on this repository; include repro steps, browser/OS, and whether you had AI, sync, or payments enabled so we can narrow logs quickly.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
