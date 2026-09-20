# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, local-first garden for the moments that matter. Plant a memory with a photo and a few words, return to water and reflect, and watch it grow through eight life stages on an infinite canvas—no account signup, no feed, no rush. A **LocalUser** identity (`getLocalUser()` in `src/lib/local-user.ts`) is created in your browser on first visit; memories load through **`useMemoriesKV`** so heavy photos live in **IndexedDB** while structured fields stay in namespaced **localStorage**. Optional cloud sync and community gardens layer on only when you configure the Edge APIs.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden treats each moment as a living plant rather than a static album tile:

- **Eight growth stages** — `seed → sprout → seedling → young → bud → bloom → mature → elder`, driven by visits, reflections, and time (`PlantStage` in `src/lib/types.ts`).
- **Five emotional tones** — happy, reflective, bittersweet, peaceful, nostalgic; classification steers variety, palette, and garden “weather.”
- **Six weather moods** — sunny, mist, rain, rain-sun, golden-haze, partly-cloudy; derived from the emotional mix on the canvas and tied to ambient audio.
- **Four garden currencies** — dew, sunlight, pollen, and starlight in your wallet; earn them by planting, revisiting, clustering, and achievements, then spend on rerolls and unlocks.
- **Cosmetic depth** — five trait slots (palette, pattern, adornment, accent, aura), **18** catalog unlocks and **7** achievements in `unlock-system.ts`, plus fertilizer tiers that accelerate growth with distinct particle flair.
- **Playful side paths** — **cross-pollinate** two memories into a hybrid, **Dream-a-Plant** in the Storage Shed, and tend candle-lit hybrids without leaving the main canvas metaphor.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting** — Photo (Base64 in IndexedDB), text, date, optional location and voice note; AI classifies tone when `/api/llm` is available.
- **Tending** — Revisits and reflections advance stage and unlock traits; “Water & Reflect” and Garden AI stay text-only (never image bytes).
- **Fertilizer** — Standard, premium, and legendary boosts (`applyPremiumFertilizer`) with escalating growth and VFX.

### ✨ AI-Powered Insights
- **Tone classification** — `getLLMProvider()` → `POST /api/llm` with `kind: 'classify'` (Haiku-class model on the server).
- **Garden AI** — Reflective prompts with `kind: 'reflect'` (Sonnet-class model); graceful static fallbacks when the route returns **503** or Spark `window.spark` is absent.
- **Memory Clusters** — Thematic groupings for browsing by mood and season, not only by position.

### 🎨 Five primary views
| View | Role |
|------|------|
| **Garden** | Infinite pan/zoom canvas, Storage Shed, Dream-a-Plant, cross-pollinate mode |
| **Timeline** | Chronological path through planted moments |
| **Clusters** | AI-suggested and manual groupings |
| **Explore** | Curated community garden cards (demo seed data; live Neon API when `DATABASE_URL` is set) |
| **Bloom Wall** | Gallery spotlight for memories in full bloom |

### 👥 Collaboration & Sharing
- **Community gardens** — `GET/POST /api/gardens` (Neon Postgres) for public gardens, join/plant/water/reflect when `DATABASE_URL` is configured; otherwise Explore uses seeded showcases and returns **503** for live mutations.
- **Private sharing** — Link-based memory sharing you control from the detail card.
- **PWA** — `public/manifest.json` with `web+memorygarden` / `web+plantmemory` / `web+viewmemory` protocol handlers and share target; **no service worker** yet (offline cache is roadmap).

### 🌓 Living Atmosphere
- Day/night lighting, seasonal gradients (OKLCH-only palettes), and ambient audio driven by season, time, and weather type.
- **Command palette** — `cmdk`-based quick actions (see keyboard shortcuts; `?` opens the cheat sheet).

### ⌨️ Power user affordances
- Keyboard shortcuts across views and modals.
- Full-garden export from settings; LocalUser reset clears scoped keys and IndexedDB blobs for a fresh start.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy **React 19.2** + **TypeScript 6** app on **Vite 8** and **Tailwind CSS 4**, with motion from **Framer Motion** and accessible primitives from **Radix UI**.

| Layer | Details |
|-------|---------|
| **State** | `App.tsx` owns memories and preferences; `useMemoriesKV` mirrors `useKV` but offloads photo payloads to IndexedDB |
| **Identity** | `getLocalUser()` — persisted gardener id + display name; no GitHub login required for the solo garden |
| **LLM** | `getLLMProvider()` in `src/lib/llm-client.ts`: HTTP `fetch('/api/llm')` first, optional Spark SDK second, static no-op last |
| **Tests** | **578** Vitest assertions across **22** files (growth, storage, LLM client, unlocks, edge cases) |

### Vercel Edge routes (production)
| Route | Env vars | Behavior |
|-------|----------|----------|
| **`/api/llm`** | `ANTHROPIC_API_KEY` | Proxies to Anthropic (`claude-haiku-4-5-20251001` classify, `claude-sonnet-4-6` reflect) |
| **`/api/sync`** | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Per-user JSON blob in Upstash-compatible KV; **1 MB** cap (**413** if exceeded); LWW; photos stay on-device |
| **`/api/gardens`** | `DATABASE_URL` (Neon) | Community garden CRUD + social water/reflect |

Static hosting uses `vercel.json` SPA rewrites and a strict CSP. **Docker** (`Dockerfile` + `docker-compose.yml`) serves `dist/` on **nginx :8080** with `/healthz`; the static image does not embed Edge routes—AI and sync need Vercel or your own proxy.

### Sub-projects
- **`volatility-sentinel/`** — Standalone Python CoinGecko agent; CI runs `pytest` from that directory.
- **`agents/micro-forge/`** — Optional `docker compose --profile agents run micro-forge` repo scan (stdout report).
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js 20+** (matches CI)
- **npm** with `legacy-peer-deps` (see `.npmrc`)

### Installation
```bash
git clone https://github.com/kwizzlesurp10-ctrl/memorygarden.git
cd memorygarden
npm install --legacy-peer-deps
```

### Development
```bash
npm run dev
```
Vite dev server — default **http://localhost:5173**.

### Production build & preview
```bash
npm run build    # → dist/
npm run preview  # serve dist locally
```

### Quality checks (local)
```bash
npm run lint
npm test              # 578 tests
npm run test:coverage
npx tsc --noEmit      # same as CI typecheck job
```

### Docker
```bash
docker compose up --build              # nginx SPA → :8080, health /healthz
docker compose --profile dev up dev    # Vite in container → :5173
```

### CI (`.github/workflows/ci.yml`)
On every push/PR to `main`: **typecheck**, **lint**, **unit tests + coverage artifact**, **build**, **npm audit (high+)**, **volatility-sentinel pytest**, **bundle-size** gate (**400 KB** per JS chunk), and **pnpm-lock.yaml** frozen sync check.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
### Vercel (recommended)
| Variable | Required for | Notes |
|----------|----------------|-------|
| `ANTHROPIC_API_KEY` | Garden AI + tone | Missing → `/api/llm` **503**, client fallbacks |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | Cloud sync | Missing → `/api/sync` **503**; header shows honest status |
| `DATABASE_URL` | Live community gardens | Neon serverless driver in `api/gardens.ts` |

Pushes to **`main`** run `npm ci` + `npm run build`. The **Sync to cloud** control backs off on **503** and surfaces **413** when metadata exceeds **1 MB**.

### Privacy & data
- **Local-first** — Memories and media default to the browser (`memorygarden:*` keys + IndexedDB). Only structured fields sync when KV is configured.
- **AI payloads** — Truncated text for classification; reflections may include short neighbor snippets—never photos or profile data.
- **Reset** — Clear LocalUser / storage from settings or devtools to wipe the scoped garden.

### Self-hosted static
Use the Docker image or any static host for `dist/`; terminate TLS at your edge and reverse-proxy `/api/*` to Vercel Edge handlers or reimplement the three routes with the same env contract.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Near-term directions aligned with the codebase and open gaps:

- **Community gardens** — Richer Neon-backed join flows, presence, and conflict-safe merges when `DATABASE_URL` is live (today: seeded Explore + partial API).
- **Offline PWA** — Service worker and asset caching; manifest and protocol handlers already ship without SW.
- **Command discovery** — Surface `cmdk` palette more prominently (e.g. **Ctrl/Cmd+K**) alongside the `?` shortcut sheet.
- **Export & print** — Higher-fidelity PDF / poster layouts from Bloom Wall and timeline.
- **Accessibility & i18n** — Canvas, modals, and keyboard paths; extract copy for translation.
- **Performance at scale** — Continue canvas virtualization and prioritization for **500+** plants.
- **AI imagery** — Optional illustration passes that still keep photos local-first.
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
On your device by default: `getLocalUser().id` scopes localStorage; `useMemoriesKV` stores photo blobs in IndexedDB. Optional `/api/sync` uploads a JSON document (no image bytes) when KV env vars are set.

**Are photos sent to the AI?**  
No. `/api/llm` and client fallbacks only see text (and brief reflection context), never Base64 photos.

**Which models run in production?**  
`api/llm.ts` maps classify → `claude-haiku-4-5-20251001`, reflect → `claude-sonnet-4-6`. Spark environments may still expose `window.spark.llm` as a secondary path.

**What are dew, sunlight, pollen, and starlight?**  
In-game currencies in `CurrencyWallet`; earn through tending and achievements, spend on cosmetic rerolls and unlocks.

**Why does sync fail with 413?**  
The KV document exceeded **1 MB**—trim reflections or export/archive older metadata.

**Why do community actions return 503?**  
`DATABASE_URL` is unset or Neon is unreachable; Explore still shows demo gardens.

**How do I reset or export?**  
Settings → export full garden JSON; reset clears LocalUser-scoped storage and IndexedDB for a fresh garden.

**How do I contribute?**  
GitHub issues and pull requests on this repo; CI expects lint, **578** tests, typecheck, and bundle budget to pass.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
