# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, local-first garden for the moments that matter. Plant a memory with a photo and a few words, return to water and reflect, and watch it grow through eight organic stages on an infinite canvas—no account required. A stable **LocalUser** id from `getLocalUser()` scopes your data in the browser; optional cloud sync and community gardens layer on only when you choose them.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden treats memories as living plants instead of static album tiles. The loop is simple and intentional: **plant → tend → grow → revisit**.

- **Eight growth stages** — `seed` through `elder`, driven by visits, reflections, age, and growth metrics (`getPlantStage()` in `garden-helpers.ts`).
- **Five emotional tones** — `happy`, `reflective`, `bittersweet`, `peaceful`, `nostalgic`; classification steers variety, palette, and atmosphere.
- **Living weather** — Six moods (`sunny`, `mist`, `rain`, `rain-sun`, `golden-haze`, `partly-cloudy`) plus day/night and seasonal gradients tied to real time.
- **Playful progression** — Four currencies (dew, sunlight, pollen, starlight), **18** cosmetic unlocks, **7** achievements, and **five** per-plant trait slots that open as stages advance.
- **Deeper tending** — Cross-pollinate two memories, **Dream-a-Plant** hybrids via the Storage Shed, voice notes, and gentle **Garden AI** reflections when `/api/llm` is configured.
- **Your data stays close** — `useMemoriesKV` keeps photos and audio in **IndexedDB** (`idb://` refs in localStorage); only structured fields participate in optional KV sync.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### Navigation (five primary views)

| View | What you do there |
|------|-------------------|
| **Garden** | Pan/zoom canvas, drag plants, ambient weather, Storage Shed, cross-pollinate mode |
| **Timeline** | Chronological path through every planted moment |
| **Clusters** | AI-assisted thematic groupings for mood-first browsing |
| **Explore** | Discover community gardens (live `/api/gardens` when `DATABASE_URL` is set; curated samples offline) |
| **Bloom Wall** | Gallery spotlight for memories at full bloom |

### Plant & tend
- **Planting** — Photo (≤10 MB), text (≤2 000 chars), date, optional location (≤200 chars), up to **5** voice notes (≤5 min each).
- **Tending** — Visits and reflections advance stages; trait unlocks and currencies accrue from real play patterns.
- **Fertilizer** — Three tiers with distinct particles: **Garden Boost** (`standard`), **Premium**, **Legendary** (`applyPremiumFertilizer`).

### AI (graceful degradation)
- **Tone classification** — Fast path via `getLLMProvider()` → `POST /api/llm` (`kind: classify`, Haiku).
- **Garden AI & Dream-a-Plant** — Richer completions (`kind: reflect`, Sonnet) with `try/catch` fallbacks and optional legacy `window.spark` where present.
- **No image bytes to the model** — Prompts use text and short neighbor context only.

### Atmosphere & installability
- Day/night canvas lighting, seasonal mood, optional ambient audio.
- **PWA** — `public/manifest.json` (standalone, share target, `web+memorygarden` / `web+plantmemory` / `web+viewmemory` protocol handlers). No service worker yet—offline cache is a roadmap item.

### Power affordances
- Keyboard shortcuts (`?` cheat sheet); **cmdk**-based command palette primitives in `src/components/ui/command.tsx`.
- Full-garden export and reset from settings; sync status in the header with honest **503** handling when backends are absent.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a **Vite-built React SPA** with Edge API routes on Vercel and local-first persistence in the browser.

### Stack (current `package.json`)

| Layer | Choice |
|-------|--------|
| UI | React **19.2**, TypeScript **~6.0** |
| Tooling | Vite **8**, `@vitejs/plugin-react-swc` |
| Styling | Tailwind **4**, OKLCH theme tokens in `src/styles/theme.css` |
| Motion & a11y | Framer Motion **12**, Radix UI primitives |
| Validation | Zod-backed limits in `src/lib/validation.ts` |
| Tests | Vitest **4** — **578** tests across **22** files (`npm test`) |

### Persistence & blobs
- **`useKV` / `readRaw`** — Namespaced localStorage under `memorygarden`, scoped per `LocalUser.id`.
- **`useMemoriesKV`** — Memory arrays in KV; photos/audio in **IndexedDB** via `blob-store`.
- **Cloud sync** — Optional `GET/POST /api/sync` → Vercel KV / Upstash (`KV_REST_*`). Last-write-wins JSON doc per user; **photos not synced**.

### LLM resolution (`getLLMProvider()`)
1. HTTP **`fetch('/api/llm')`** → Anthropic (`ANTHROPIC_API_KEY` on the server).
2. Optional **`window.spark.llm`** when the Spark SDK is present.
3. Static no-op provider so the UI never hard-crashes.

**Models** (see `api/llm.ts`): `claude-haiku-4-5-20251001` (classify), `claude-sonnet-4-6` (reflect).

### Edge routes

| Route | Purpose | Required env |
|-------|---------|----------------|
| `/api/llm` | Anthropic proxy | `ANTHROPIC_API_KEY` |
| `/api/sync` | Per-user metadata sync | `KV_REST_API_URL`, `KV_REST_API_TOKEN` |
| `/api/gardens` | Community gardens CRUD | `DATABASE_URL` (Neon) |

`vercel.json` serves the SPA with a strict **Content-Security-Policy**; static Docker/nginx images do **not** bundle these routes—AI and sync fall back locally.

### Repo satellites
- **`agents/micro_forge/`** — Python maintenance agents (`docker compose --profile agents run micro-forge`).
- **`volatility-sentinel/`** — Standalone Python sample (CoinGecko); exercised in CI separately from the Vite app.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js** 20+ (matches CI)
- **npm** (use **`npm install --legacy-peer-deps`** — enforced via `.npmrc` for Vite 8 peer ranges)

### Clone & install
```bash
git clone https://github.com/kwizzlesurp10-ctrl/memorygarden.git
cd memorygarden
npm install --legacy-peer-deps
```

### Local development
```bash
npm run dev
```
Vite on **5173** by default. Garden AI needs a deployed or proxied `/api/llm`, or Spark fallback—pure static preview has no Edge functions.

### Quality gate (same as CI)
```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
npm run preview    # serve dist/
```

### Docker
```bash
docker compose up --build          # nginx SPA → http://localhost:8080  (/healthz)
docker compose --profile dev up dev  # Vite in container → :5173
```

### Environment variables (typical)

| Variable | Where | Effect |
|----------|--------|--------|
| `ANTHROPIC_API_KEY` | Vercel / local Edge | Enables `/api/llm` |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Vercel | Enables `/api/sync` |
| `DATABASE_URL` | Vercel | Enables live `/api/gardens` |
| *(none required)* | Browser | Full offline garden via LocalUser + IndexedDB |

For Vercel previews: `vercel env pull` then deploy; missing keys return **503** and the client stays local-only.

### CI (`.github/workflows/ci.yml`)
Jobs on every PR to `main`: **typecheck**, **lint**, **unit tests + coverage artifact**, **production build**, **npm audit** (high+), **volatility-sentinel** Python tests.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
### Vercel (recommended)
- **Build**: `npm install` + `npm run build` → static `dist/` + Edge handlers in `api/`.
- **AI**: Set `ANTHROPIC_API_KEY`. Without it, `/api/llm` returns **503**; classification defaults to peaceful tone and copy fallbacks.
- **Sync**: Set `KV_REST_API_URL` and `KV_REST_API_TOKEN`. Payload cap **1 MB** serialized JSON—oversize documents return **413** (`Document too large`). Photos remain on-device; sync is metadata + positions + reflections + traits.
- **Community**: Set `DATABASE_URL` (Neon). Explore falls back to seeded sample gardens when the API is unavailable.

The header **Sync to cloud** control reflects probe results and backs off after **503**, so users are never told data is syncing when KV is missing.

### Self-hosted static
- **Docker** image serves `dist/` on **8080** with `/healthz`; mount nothing sensitive—filesystem is ephemeral per container.
- Bring your own reverse proxy and optionally forward `/api/*` to Vercel or reimplement Edge routes.

### Privacy defaults
- **Local-first** — Memories and media default to the browser; export from settings for portability.
- **AI payloads** — Truncated memory text only; reflections may include short neighbor snippets—never photos or profile secrets.
- **Reset** — Settings can wipe local KV + IndexedDB for a clean slate.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Near-term directions aligned with the codebase and open gaps:

- **Community gardens** — Richer join/leave UX, live presence, and safer merges when `DATABASE_URL` is enabled (today: API + Explore samples).
- **Offline PWA** — Service worker + asset caching; manifest and protocol handlers already ship without SW.
- **Command palette** — Wire global **Ctrl+K** navigation atop existing cmdk primitives.
- **Collaboration** — Shared tending sessions and conflict-safe sync beyond last-write-wins KV.
- **Export & print** — Higher-fidelity Bloom Wall / timeline PDFs and poster layouts.
- **Accessibility & i18n** — Canvas focus rings, modal traps, reduced-motion paths, extractable copy.
- **Scale** — Continue canvas virtualization and blob prioritization for **500+** plants.
- **On-device imagery** — Optional generative plant art hooks already stubbed in `garden-helpers.ts` without sending user photos upstream.
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
On your device by default: `getLocalUser()` id scopes localStorage keys; `useMemoriesKV` stores heavy blobs in IndexedDB. Optional `/api/sync` mirrors structured fields to KV when credentials exist.

**Do I need an account?**  
No. A stable anonymous **LocalUser** is created on first visit. Community features use that id against `/api/gardens` when the server is configured.

**Are photos sent to the AI?**  
No. `/api/llm` and Spark fallbacks receive text prompts only (classification uses memory text; reflections may reference short nearby excerpts).

**Which models run in production?**  
`claude-haiku-4-5-20251001` for fast classification, `claude-sonnet-4-6` for richer reflections—selected in `api/llm.ts` from the `kind` field.

**What are dew / sunlight / pollen / starlight?**  
In-game currencies earned from tending (reflections, visits, achievements). They gate cosmetic unlocks in `unlock-system.ts`, not real-money purchases.

**Why does sync fail with 413 or 503?**  
**503** — KV env vars missing or Edge route unavailable (stay local-only). **413** — Sync document exceeded **1 MB**; prune old reflections or disable sync until under the cap.

**How do I verify the app?**  
`npm test` runs **578** Vitest cases. CI also typechecks, lints, builds, and runs `volatility-sentinel` Python tests.

**How do I contribute?**  
Open issues and pull requests on [github.com/kwizzlesurp10-ctrl/memorygarden](https://github.com/kwizzlesurp10-ctrl/memorygarden). See `AGENT_WORKFLOW.md` for agent/maintainer conventions.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
