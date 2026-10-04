# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter: plant each memory like a seed, return to tend it, and watch it grow on an infinite canvas—never rushed, never noisy, always yours.

There is **no account signup**. A **`LocalUser`** id is created in the browser on first visit (`getLocalUser()` in `src/lib/local-user.ts`), and all garden data is namespaced to that id. Memories flow through **`useMemoriesKV`** (`src/hooks/use-memories-kv.ts`), which keeps structured fields in **localStorage** and moves heavy **photo/audio** payloads to **IndexedDB** (`src/lib/blob-store.ts`) so you stay under typical quotas.

Plants advance through **eight stages** (`seed → sprout → seedling → young → bud → bloom → mature → elder`). Optional **cloud metadata sync** (`/api/sync`) and **community gardens** (`/api/gardens` + Neon) activate only when those server env vars are configured; the garden remains fully usable offline without them.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Eight stages from **seed** to **elder** (`PlantStage` in `src/lib/types.ts`). Visits, reflections, and age drive growth; neglect and care both leave traces you can feel.
- **Reflect emotions** — Five **emotional tones** (`happy`, `reflective`, `bittersweet`, `peaceful`, `nostalgic`) steer variety, OKLCH palette, and atmosphere via `classifyEmotionalTone()` and garden helpers.
- **Living weather** — **`GardenMood`** aggregates your garden into one of six **weather types** (`sunny`, `mist`, `rain`, `rain-sun`, `golden-haze`, `partly-cloudy`) plus a dominant emotion for sky and ambient layers.
- **Earn & customize** — Four soft currencies (**dew**, **sunlight**, **pollen**, **starlight**) and **five trait slots** per plant (`palette`, `pattern`, `adornment`, `accent`, `aura`). **18** catalog unlocks and **7** achievements reward tending habits (`src/lib/unlock-system.ts`).
- **Hybrid creativity** — **Cross-pollinate** memories, **Dream-a-Plant** (LLM-assisted hybrid genomes), and the canvas **Storage Shed** for dreamt seeds and planted hybrids.
- **Encourage reflection** — Add notes when you revisit; **Garden AI** offers gentle, poetic insights when you ask (text-only—never photos).
- **Create connections** — Spatial proximity, **Memory Clusters**, and timeline browsing help you notice themes across seasons of your life.
- **Adapt to seasons** — Day/night, season, and computed garden mood tie the canvas to real time and how your memories feel today.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo (validated up to **10 MB**), write up to **2,000** characters, optional location (**200** chars) and up to **5** audio clips (**300 s** each)—see `src/lib/validation.ts`.
- **Tending**: Open memories to advance stages; reflections (up to **1,000** chars) deepen the story each time you return.
- **Fertilizer Boost**: Three tiers (**Garden Boost**, **Premium**, **Legendary**) accelerate growth with distinct particle effects.

### ✨ AI-Powered Insights
- **Emotional tone**: Haiku-class model via **`getLLMProvider()`** → **`POST /api/llm`** (`kind: classify`); keyword fallback when AI is unavailable.
- **Garden AI**: Sonnet-class reflections (`kind: reflect`) with graceful empty fallback.
- **Memory Clusters**: Thematic groupings (including tone-based paths in `memory-cluster-groups.ts`).

### 🎨 Views (five modes)
| View | Role |
|------|------|
| **Garden** | Infinite pan/zoom canvas with animated plants and ambient layers |
| **Timeline** | Chronological path through every planted moment |
| **Clusters** | Grouped cards for thematic exploration |
| **Bloom Wall** | Gallery spotlight for memories in full bloom |
| **Explore** | Discovery-oriented browsing (lazy-loaded with other secondary views) |

### 👥 Collaboration & Sharing
- **Collaborative gardens**: Create shared spaces, invite members, and track activity when enabled locally.
- **Community gardens API**: **`/api/gardens`** (Neon **`DATABASE_URL`**) lists public gardens and supports join/plant/water/reflect—returns **`503`** when the database is not configured.
- **Private sharing**: Link-based shared memory cards you control.

### 🌓 Living Atmosphere
- **Day / night** and **season** drive backgrounds and plant modifiers.
- **Garden mood / weather** computed from your memory collection.
- **Ambient sound** optional via `GardenAmbientLayer`.

### ⌨️ Power user affordances
- **Keyboard shortcuts**: Fast navigation (`?` opens the cheat sheet; see `src/lib/keyboard-shortcuts.ts`).
- **cmdk** command palette primitives in `src/components/ui/command.tsx` (compose into global search as the UX matures).
- **PWA**: `public/manifest.json` — standalone install, **share target**, and **`web+memorygarden`** / related protocol handlers. **No service worker yet** (offline caching is a roadmap item).
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy React app tuned for smooth, organic motion and local-first data.

### Frontend stack
| Layer | Choice |
|-------|--------|
| UI | **React 19.2** + **TypeScript ~6** |
| Bundler | **Vite 8** |
| Styling | **Tailwind CSS 4** + OKLCH theme tokens |
| Motion | **Framer Motion 12** |
| Components | **Radix UI** + shadcn-style primitives under `src/components/ui/` |
| Icons | **Phosphor** (product) · **Lucide** (UI kit) |
| Validation | **Zod**-backed helpers in `validation.ts` |
| Tests | **Vitest 4** — **578** tests across **22** files (`npm test`) |

### Persistence & AI
- **`useKV`** (`@/lib/storage`) → **`useLocalKV`**: keys prefixed `memorygarden:` per **`LocalUser`** id.
- **`useMemoriesKV`**: hydrates memories and offloads blobs to **IndexedDB** (`idb://` refs).
- **`getLLMProvider()`** (`src/lib/llm-client.ts`): **`fetch('/api/llm')`** first → optional **`window.spark`** in Spark hosts → static no-network fallback.

### Edge routes (Vercel)
| Route | Purpose | Required env |
|-------|---------|----------------|
| **`POST /api/llm`** | Anthropic proxy (Haiku classify / Sonnet reflect) | **`ANTHROPIC_API_KEY`** |
| **`GET/POST /api/sync`** | Per-user JSON doc in KV (LWW, **1 MB** max → **413**) | **`KV_REST_API_URL`**, **`KV_REST_API_TOKEN`** |
| **`/api/gardens`** | Community gardens (Neon Postgres) | **`DATABASE_URL`** |

Photos/audio **do not** sync to KV—only structured metadata; blobs stay on-device.

### Self-hosted & agents
- **Docker**: Multi-stage **Node 22 → nginx 1.27** on **`:8080`**, health check **`/healthz`** (`Dockerfile`, `docker-compose.yml`). Static image does **not** bundle Edge APIs—AI/sync fall back locally.
- **Compose profiles**: `dev` (Vite on **5173**), `agents` (**Micro-Forge** Python scanner via `agents/micro_forge/`).
- **Volatility Sentinel** (`volatility-sentinel/`): Standalone Python example (CoinGecko); CI runs its pytest job separately.
- **Security headers**: `vercel.json` sets a strict **Content-Security-Policy** for production deploys.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js 20+** (22 recommended for Docker parity)
- **npm** (ships with Node)

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
   Matches `.npmrc` peer-resolution settings for Vite 8.

### Development
```bash
npm run dev
```
Vite dev server (default **5173**).

### Production build & preview
```bash
npm run build    # → dist/
npm run preview  # serve dist/ locally
```

### Quality checks
```bash
npm run lint
npm test              # 578 tests
npm run test:watch
npm run test:coverage
```

### Docker
```bash
docker compose up --build              # nginx SPA → http://localhost:8080
docker compose --profile dev up dev    # Vite → http://localhost:5173
docker compose --profile agents run --rm micro-forge
```

### Environment variables (local vs Vercel)
| Variable | Local dev | Vercel production |
|----------|-----------|-------------------|
| **`ANTHROPIC_API_KEY`** | Optional; without it `/api/llm` → **503**, app uses fallbacks | Set in project env for Garden AI |
| **`KV_REST_API_URL`** / **`KV_REST_API_TOKEN`** | Optional; sync UI backs off on **503** | Enables **Sync to cloud** |
| **`DATABASE_URL`** | Optional | Enables **`/api/gardens`** community features |

For Vercel, configure vars in the dashboard or run **`vercel env pull`** for linked local previews.

### CI (`.github/workflows/ci.yml`)
On **`main`** PRs/pushes: **typecheck** (`tsc --noEmit`), **lint**, **test** + coverage artifact, **build**, **npm audit** (high+), **bundle size** budget (400 KB/chunk), **pnpm lockfile** drift check, and **volatility-sentinel** pytest.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
### Vercel (recommended)
1. Connect the GitHub repo; build command **`npm run build`**, output **`dist/`**.
2. Set **`ANTHROPIC_API_KEY`** for AI routes; optionally KV and Neon vars above.
3. SPA routing + CSP: `vercel.json` rewrites all paths to **`index.html`** and applies security headers.

Pushes to **`main`** run CI then deploy. **`.npmrc`** **`legacy-peer-deps`** keeps Vite 8 and `@vitejs/plugin-react-swc` compatible.

### Cloud sync behavior
- **Last-write-wins** per `LocalUser` id (`mg:user:<id>` in KV).
- Payload cap **1,000,000** bytes serialized JSON (**413** if exceeded)—keep photos in IndexedDB, not in sync docs.
- Header **Sync to cloud** reflects probe status and stops retrying when the API returns **503**.

### Self-hosted static
Serve **`dist/`** (or the Docker image) behind any static host. Without a reverse proxy to Edge handlers, **`/api/llm`**, **`/api/sync`**, and **`/api/gardens`** are unavailable—expected; the client degrades to local-only + keyword tone classification.

## Privacy & Data
- **Local-first**: Memories and media default to the browser (`memorygarden:*` keys + IndexedDB blobs).
- **AI payloads**: Truncated memory text for classify; reflections may include short neighboring text—never image bytes or GitHub profile data in those calls.
- **Export**: Full-garden export from settings (`ExportGarden`) when you want a portable archive.
- **Reset**: Clear site data / localStorage for the origin to remove a local garden (no server-side account to delete).
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Community UX** — Richer discovery, moderation, and onboarding for **`/api/gardens`** when Neon is enabled.
- **Offline PWA** — Service worker + asset caching so installed clients survive flaky networks (manifest already ships).
- **Command palette** — Wire **cmdk** to global navigation (memories, views, settings) with **`Ctrl+K` / `⌘K`**.
- **Collaboration** — Conflict-safe merges for shared gardens, presence, and invite flows beyond today’s local KV model.
- **Export & print** — Higher-fidelity PDF/poster layouts from Bloom Wall and timeline.
- **Accessibility & i18n** — Canvas, modals, and keyboard paths audited; extract copy for translation.
- **Performance at scale** — Continue canvas virtualization and prioritization for **500+** plants.
- **AI imagery** — Optional generated plant art with strict on-device storage and opt-in only.
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on your device: **`LocalUser`**-scoped **localStorage** plus **IndexedDB** for photos/audio. Optional **`/api/sync`** stores a metadata JSON document in KV (not blobs). Community garden rows live in Neon only when **`DATABASE_URL`** is set.

**Do I need to sign up?**  
No. A random local id is created automatically; you can personalize display name/avatar in-app.

**Are photos sent to the AI?**  
No. **`/api/llm`** receives text prompts only (plus brief text context for reflections).

**Which models run in production?**  
`api/llm.ts` uses **`claude-haiku-4-5-20251001`** for classification and **`claude-sonnet-4-6`** for reflections. Legacy Spark hosts may still expose **`window.spark.llm`** as a fallback in client code.

**Why does sync fail or show disabled?**  
**503** means KV env vars are missing on the host. **413** means the metadata document exceeded **1 MB**—export old memories or trim synced fields; keep media in IndexedDB.

**What about Docker vs Vercel?**  
Docker serves the static SPA only. Edge routes require Vercel (or your own Edge-compatible deployment).

**How do I run tests?**  
`npm test` runs **578** Vitest cases across **22** files; CI also enforces typecheck, lint, coverage upload, and bundle size limits.

**How do I contribute?**  
Open issues and pull requests at [github.com/kwizzlesurp10-ctrl/memorygarden](https://github.com/kwizzlesurp10-ctrl/memorygarden).
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
