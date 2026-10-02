# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, local-first web app for the moments that matter: plant each memory like a seed on an infinite canvas, return to tend it through reflections and visits, and watch it advance through **eight growth stages**—never rushed, never noisy, always yours. There is **no account signup**: a stable **`LocalUser`** identity is created in the browser (`getLocalUser()`), and memories persist via **`useMemoriesKV`** with photos and audio in **IndexedDB** (structured fields in namespaced **localStorage**). Optional cloud sync and community gardens are additive; the default experience works entirely offline in the tab.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — **Eight stages** (`seed → sprout → seedling → young → bud → bloom → mature → elder`) driven by visits, age, and care; fertilizer boosts can accelerate growth with visible particle effects.
- **Reflect emotions** — **Five tones** (`happy`, `reflective`, `bittersweet`, `peaceful`, `nostalgic`) steer variety, OKLCH palettes, and **six weather moods** (`sunny`, `mist`, `rain`, `rain-sun`, `golden-haze`, `partly-cloudy`) across the canvas.
- **Earn and customize** — Tending earns **four currencies** (dew, sunlight, pollen, starlight), unlocks **18 cosmetic items** (palettes, patterns, adornments), and **seven achievements**; per-plant **trait slots** (palette, pattern, adornment, accent, aura) deepen individuality.
- **Create connections** — **Cross-pollinate** two memories for hybrid genetics, **Dream-a-Plant** from a text idea, and stash hybrid seeds in the **Storage Shed**; clusters and spatial layout surface themes across seasons.
- **Adapt to seasons** — Day/night, seasonal gradients, and ambient audio follow real time so the garden stays tied to the world outside the screen.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Photo (validated up to **10 MB**), text (up to **2 000** chars), date, optional location (**200** chars), and up to **5** audio clips (**300 s** each, blobs in IndexedDB).
- **Tending**: Visits and reflections advance stages; unlock and wallet state persist with preferences.
- **Fertilizer Boost**: **Garden Boost**, **Premium Fertilizer**, and **Legendary Elixir** tiers apply stacked growth multipliers with distinct visuals.

### ✨ AI-Powered Insights
- **Emotional tone**: Classification via `getLLMProvider()` → **`POST /api/llm`** (Haiku for classify, Sonnet for reflect when configured).
- **Garden AI**: Poetic reflections with graceful fallback when the Edge route returns **503** or Spark `window.spark` is absent.
- **Memory Clusters**: Thematic/temporal groups with path geometry for browsing by mood and time.

### 🎨 Views (five modes)
| View | Purpose |
|------|---------|
| **Garden** | Infinite pan/zoom canvas, plants, cross-pollinate, Dream-a-Plant, Storage Shed |
| **Timeline** | Chronological path through planted moments |
| **Clusters** | Grouped exploration with filters |
| **Explore** | Discovery-oriented layout |
| **Bloom Wall** | Gallery for memories at bloom and beyond |

### 👥 Collaboration & Sharing
- **Community gardens**: **`/api/gardens`** (Vercel Edge + **Neon** `DATABASE_URL`) for public gardens, join/plant/water/reflect—returns **503** when the database is not configured.
- **Private sharing**: Link-based memory sharing you control from the app.

### 🌓 Living Atmosphere & PWA
- **Day/night**, **season**, and **garden weather** drive backgrounds and optional ambient audio.
- **`public/manifest.json`**: standalone display, **three** protocol handlers (`web+memorygarden`, `web+plantmemory`, `web+viewmemory`), and Web Share Target—**no service worker** yet (offline cache is a roadmap item).

### ⌨️ Power-user affordances
- **Keyboard shortcuts** (`?` cheat sheet), **cmdk**-based command UI primitives in `src/components/ui/command.tsx`.
- Install as a PWA for protocol registration and share-target intake.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy React SPA tuned for organic motion and local-first data.

### Frontend stack
| Layer | Choice |
|-------|--------|
| UI | **React 19.2**, **TypeScript ~6**, **Vite 8**, **Tailwind CSS 4** |
| Motion & a11y | **Framer Motion 12**, **Radix UI**, **Phosphor** + Lucide icons |
| State | `App.tsx` + **`useKV`** / **`useMemoriesKV`** (no global store) |
| Validation | **`src/lib/validation.ts`** — `ValidationResult<T>` + zod-friendly limits |
| Tests | **Vitest 4** — **578** tests across **22** files (`npm test`) |

### Persistence & LLM
- **`useMemoriesKV`**: memory arrays in localStorage with **`idb://`** refs resolved from **IndexedDB** (`blob-store`).
- **`getLLMProvider()`**: HTTP **`/api/llm`** first → optional **`window.spark`** → static no-op provider so the UI never hard-crashes.

### Vercel Edge routes (`api/`)
| Route | Env vars | Behavior |
|-------|----------|----------|
| **`/api/llm`** | `ANTHROPIC_API_KEY` | Proxies to **`claude-haiku-4-5-20251001`** (classify) / **`claude-sonnet-4-6`** (reflect) |
| **`/api/sync`** | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Per-user JSON doc, **LWW**, **1 MB** cap → **413** if exceeded; photos not synced |
| **`/api/gardens`** | `DATABASE_URL` (Neon) | Community garden CRUD; **503** without DB |

### Containers & agents
- **Docker**: `docker compose up --build` → nginx on **:8080**, **`/healthz`**; `--profile dev` for Vite **:5173**; `--profile agents` for **Micro-Forge** (`agents/micro_forge/`).
- **Volatility Sentinel** (`volatility-sentinel/`) — separate Python CoinGecko example; **pytest** in CI.

Static hosting uses **`vercel.json`** SPA rewrites and a strict **CSP** header on deploy.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js 20+** (matches CI)
- **npm** with **`legacy-peer-deps`** (see `.npmrc`)

### Installation
```bash
git clone https://github.com/kwizzlesurp10-ctrl/memorygarden.git
cd memorygarden
npm install --legacy-peer-deps
```

### Local development
```bash
npm run dev          # Vite → http://localhost:5173
npm run build        # Production bundle → dist/
npm run preview      # Serve dist/ locally
npm run lint
npm test             # 578 Vitest assertions
npm run test:watch
npm run test:coverage
```

### Docker
```bash
docker compose up --build                    # Production SPA → :8080, health /healthz
docker compose --profile dev up dev          # Vite in container → :5173
docker compose --profile agents run --rm micro-forge
```
The static image does **not** include Edge functions—run on **Vercel** (or proxy `/api/*`) for LLM, sync, and gardens.

### CI (`.github/workflows/ci.yml`)
Jobs on every push/PR to **`main`**: **typecheck** (`tsc --noEmit`), **lint**, **test** + coverage artifact, **build**, **npm audit** (high+), **volatility-sentinel** pytest, and additional build/security steps as defined in the workflow.

### Environment variables (typical)
| Context | Variables |
|---------|-----------|
| **Vercel production** | `ANTHROPIC_API_KEY`, optional `KV_REST_API_*`, optional `DATABASE_URL` |
| **Local Vite only** | None required; AI/sync/community features degrade cleanly |

Pull env for Vercel: `npx vercel env pull` when linked to a project.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
### Vercel deployment
1. Connect the repo; build command **`npm run build`**, output **`dist/`**.
2. Configure Edge env vars (see table in **how-it-works**). Missing keys yield **503** on the affected route—the client treats that as local-only for sync/AI and hides misleading “synced” states.
3. **`/api/sync`**: documents are **last-write-wins** per `mg:user:<id>`; serialized payload must stay under **1 000 000** bytes or the server returns **413** (`Document too large`). **Photo/audio blobs are never uploaded**—only metadata and `idb://` references sync; each device rehydrates media locally.
4. **`/api/gardens`**: requires **Neon** `DATABASE_URL`; without it, community features are unavailable but the private garden still works.

### Self-hosted static
Serve **`dist/`** behind any static host (Docker nginx on **8080** included). You must route **`/api/llm`**, **`/api/sync`**, and **`/api/gardens`** to compatible handlers or accept degraded AI/sync/community behavior.

### Privacy & data controls
- **Local-first** storage under the `memorygarden` key prefix per **LocalUser** id.
- **AI** sends text prompts only—no image bytes to Anthropic via `/api/llm`.
- **Export / reset** from in-app settings for portable backup or wiping local state (does not delete remote KV/Neon data unless you manage those consoles separately).
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Community UX** — Invites, presence, and safer merges on **`/api/gardens`** without clobbering local IndexedDB media.
- **Offline PWA** — Service worker + cache strategy for shell and static assets (manifest and share target already ship).
- **Command palette** — Wire **cmdk** / **Ctrl+K** globally for view switches, plant search, and settings.
- **Collaboration** — Real-time or CRDT-style sync for shared gardens beyond current LWW metadata sync.
- **Export & print** — PDF/poster flows from Bloom Wall and timeline.
- **Accessibility & i18n** — Canvas focus order, reduced-motion parity, translatable strings.
- **Scale** — Canvas virtualization and LOD for **500+** plants.
- **AI imagery** — Optional on-device or server-assisted plant art (text-only AI today).
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Do I need an account?**  
No. A **`LocalUser`** (random friendly name + UUID) is created in your browser and reused on return visits.

**Where does my data live?**  
**localStorage** + **IndexedDB** on your device by default. Optional **`/api/sync`** copies metadata to Vercel KV when configured; photos stay local per device.

**Are photos sent to the AI?**  
No. `/api/llm` receives text prompts only (`claude-haiku-4-5-20251001` / `claude-sonnet-4-6`).

**Why does sync say unavailable?**  
The client calls **`/api/sync`**; without **`KV_REST_API_URL`** / **`KV_REST_API_TOKEN`** you get **503**. Oversized documents return **413**—trim gardens or rely on local-only mode.

**What are dew, sunlight, pollen, and starlight?**  
In-app currencies earned by tending; spend/unlock cosmetics via **`unlock-system.ts`** (18 items, 7 achievements).

**How do I run tests?**  
`npm test` — **578** passing tests in **22** files as of the current tree.

**How do I contribute?**  
Open issues or PRs at [github.com/kwizzlesurp10-ctrl/memorygarden](https://github.com/kwizzlesurp10-ctrl/memorygarden).
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
