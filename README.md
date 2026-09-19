# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, local-first garden for the moments that matter: plant a memory, return to tend it, and watch it grow through eight stages from **seed** to **elder** on an infinite canvas. A stable **`LocalUser`** identity is created in your browser via **`getLocalUser()`**—no account signup—so your garden stays yours from the first visit. Memories load through **`useMemoriesKV`**, which keeps structured fields in scoped **localStorage** and heavy photo blobs in **IndexedDB**, so large gardens stay within typical browser quotas.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants that respond to care, time, and reflection:

- **Eight growth stages** — `seed → sprout → seedling → young → bud → bloom → mature → elder`, driven by visits, reflections, and optional fertilizer boosts.
- **Five emotional tones** — `happy`, `reflective`, `bittersweet`, `peaceful`, and `nostalgic`; classification steers variety, palette, and garden weather.
- **Six weather moods** — From **sunny** and **golden-haze** to **mist** and **rain**, the canvas atmosphere follows the dominant tone of nearby plants.
- **Four currencies** — Earn **dew**, **sunlight**, **pollen**, and **starlight** by planting, reflecting, revisiting, and clustering; spend starlight on trait rerolls and unlocks.
- **Cross-pollinate** — Link two memories to blend genetics and hybrid traits on the canvas.
- **Dream-a-Plant** — Describe an idea; the dream-engine (when AI is available) returns a hybrid genome you can plant from the garden HUD.
- **Storage Shed** — Every dreamt seed is kept automatically so you can revisit and plant hybrids later.
- **Progression** — **18** unlockable palettes, patterns, and adornments plus **7** achievements that award bonus starlight as you tend over weeks and seasons.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting** — Photo (Base64 in IndexedDB), text, date, optional location/audio; new sprouts appear on the pannable canvas.
- **Tending** — Revisits and reflections advance growth; **Water & Reflect** deepens the story on each return.
- **Fertilizer** — Three tiers (**Garden Boost**, **Premium Fertilizer**, **Legendary**) with distinct particle effects via `applyPremiumFertilizer`.
- **Cosmetics** — Per-plant palette, pattern, and adornment slots (unlock-gated) plus **trait** slots (`palette` / `pattern` / `adornment`) from the trait catalog.

### ✨ AI-Powered Insights
- **Emotional tone** — `getLLMProvider()` → **`POST /api/llm`** with `kind: 'classify'` (Haiku) for fast labeling; falls back to peaceful defaults when AI is off.
- **Garden AI** — Reflective prompts with `kind: 'reflect'` (Sonnet); never sends photo bytes.
- **Dream-a-Plant** — JSON-mode hybrid generation when the LLM route is configured.
- **Memory Clusters** — Thematic and temporal groupings for browsing by mood as well as place.

### 🎨 Five primary views

| View | What you get |
|------|----------------|
| **Garden** | Infinite canvas, animated plants, day/night and seasonal backdrops |
| **Timeline** | Chronological path through every planted moment |
| **Clusters** | Grouped cards and paths for thematic exploration |
| **Explore** | Discover community gardens (Neon-backed when `DATABASE_URL` is set; graceful empty state when not) |
| **Bloom Wall** | Masonry gallery; elder and bloom stages claim larger tiles |

### 👥 Collaboration & Sharing
- **Collaborative gardens** — Local multi-garden selector plus **Community Gardens** via **`/api/gardens`** (join, plant, water, reflect) when Postgres is configured.
- **Private sharing** — Link-based memory sharing you control from the memory card.
- **Export** — Full-garden export (including quality options) from settings.

### 🌓 Living Atmosphere
- **Day / night** — Canvas palette follows local time of day.
- **Seasonal mood** — Subtle shifts for the current season.
- **Ambient garden engine** — Optional generative audio tied to season and weather type.

### ⌨️ Power user affordances
- **Keyboard shortcuts** — `?` opens the cheat sheet; **cmdk** command palette components are wired for quick navigation (expand with **Ctrl+K** / **⌘K** as the UI matures).
- **Protocol handlers** — `web+memorygarden://`, `web+plantmemory://`, and `web+viewmemory://` in **`public/manifest.json`** when installed as a PWA.
- **PWA** — Installable shell with share-target and protocol registration; **no service worker yet** (offline cache remains on the roadmap).
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy **React 19** SPA with organic motion, local-first persistence, and optional Vercel Edge backends.

### Stack (pinned in `package.json`)

| Layer | Choice |
|-------|--------|
| UI | React **19.2** + TypeScript **~6** |
| Bundler | Vite **8** + `@vitejs/plugin-react-swc` |
| Styling | Tailwind CSS **4** + OKLCH theme tokens |
| Motion | Framer Motion **12** |
| Primitives | Radix UI (shadcn-style components under `src/components/ui/`) |
| Validation | Zod **4** on external-shaped payloads |
| Tests | Vitest **4** — **578** tests across **22** files |

### Persistence & identity
- **`getLocalUser()`** — Stable per-browser user id and display name (`src/lib/local-user.ts`).
- **`useMemoriesKV`** — Memories array in KV; photos resolved through IndexedDB helpers in `src/hooks/use-memories-kv.ts`.
- **`useKV`** — Preferences, unlock state, collaborative garden metadata, all namespaced by `LocalUser.id`.

### LLM resolution (`src/lib/llm-client.ts`)
1. HTTP **`fetch('/api/llm')`** → Anthropic via Edge (`api/llm.ts`).
2. Optional **`window.spark.llm`** when the GitHub Spark SDK is present.
3. Static no-network fallback so the UI never hard-crashes.

**Models on the server:** `claude-haiku-4-5-20251001` (classify), `claude-sonnet-4-6` (reflect / JSON dreams).

### Vercel Edge routes

| Route | Purpose | Required env |
|-------|---------|----------------|
| **`/api/llm`** | Classification, reflections, dream JSON | `ANTHROPIC_API_KEY` |
| **`/api/sync`** | Per-user metadata blob (LWW, **1 MB** cap, **413** if over) | `KV_REST_API_URL`, `KV_REST_API_TOKEN` |
| **`/api/gardens`** | Community gardens CRUD + social tending | `DATABASE_URL` (Neon) |

Static Docker/nginx images serve only the SPA — Edge routes are **not** bundled; AI and sync fall back cleanly on self-hosted builds.

### Sub-projects & agents
- **`volatility-sentinel/`** — Standalone Python CoinGecko agent; CI runs **pytest** from that directory.
- **`agents/micro_forge/`** — Python multi-agent scanner (`docker compose --profile agents run --rm micro-forge`).
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js 20+** (CI uses 20; Docker build uses 22)
- **npm** (lockfile: `package-lock.json`; CI also verifies **`pnpm-lock.yaml`** stays in sync)

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
   Matches `.npmrc` (`legacy-peer-deps=true`) for Vite 8 peer ranges.

### Development
```bash
npm run dev
```
Vite dev server — default **http://localhost:5173**.

### Production build
```bash
npm run build
```
Output → **`dist/`** for static hosting (Vercel, nginx, etc.).

### Quality checks
```bash
npm run lint      # ESLint
npm test          # Vitest single run (578 tests)
npm run test:watch
npm run test:coverage
npx tsc --noEmit  # CI typecheck
```

### Preview production bundle
```bash
npm run preview
```

### Docker
| Command | Result |
|---------|--------|
| `docker compose up --build` | nginx SPA on **http://localhost:8080** (`/healthz`) |
| `docker compose --profile dev up dev` | Vite on **5173** with mounted source |
| `docker compose --profile agents run --rm micro-forge` | Micro-Forge agent report |

### CI (`.github/workflows/ci.yml`)
Jobs on every push/PR to **`main`**: **typecheck**, **lint**, **unit tests + coverage**, **build**, **npm audit** (high+), **volatility-sentinel pytest**, **bundle size** (fail if any JS chunk **> 400 KB**), **pnpm lockfile** frozen check.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
### Vercel (recommended)
Static SPA from **`npm run build`** plus Edge functions in **`api/`**.

| Variable | Route / behavior |
|----------|------------------|
| **`ANTHROPIC_API_KEY`** | `/api/llm` — without it, returns **503** and the client disables AI for the session |
| **`KV_REST_API_URL`** + **`KV_REST_API_TOKEN`** | `/api/sync` — metadata only; photos stay in IndexedDB per device |
| **`DATABASE_URL`** | `/api/gardens` — community gardens; **503** when unset |

**Sync semantics:** Last-write-wins per `mg:user:<id>`; POST body must stay under **1,000,000** characters or the API returns **413**. The header **Sync to cloud** control reflects real status and backs off on **503**.

### Local identity & reset
- **`getLocalUser()`** persists under the `memorygarden` localStorage prefix; clearing site data or using in-app reset creates a fresh garden id.
- **Export** from settings produces a portable archive before you reset or migrate browsers.

### Self-hosted Docker
Production image: Node build → **nginx** on port **8080** with **`/healthz`**. No Edge secrets in the image — configure a reverse proxy to Vercel functions or run garden-only without cloud AI/sync/community.

## Privacy & Data

- **Local-first** — Memories and media default to the browser (scoped KV + IndexedDB). Nothing leaves the device except optional sync metadata, community actions you take, or explicit shares.
- **AI payloads** — Truncated text (prompt max **4000** chars on `/api/llm`); reflections may include short neighbor context — never image bytes or OAuth tokens.
- **Export** — Full-garden export when you want an offline backup.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Near-term directions aligned with the current codebase:

- **Community gardens UX** — Richer invitations, presence, and conflict-safe merges when Neon is enabled.
- **Offline PWA** — Service worker + cache strategy (manifest and share-target already ship; SW does not).
- **Command palette** — Promote existing **cmdk** wiring to a global **Ctrl+K** / **⌘K** launcher for views, plant, and settings.
- **Export & print** — Higher-fidelity PDF / poster flows from Bloom Wall and timeline.
- **Accessibility & i18n** — Canvas, modals, and keyboard paths; extract copy for translation.
- **Performance at scale** — Continue virtualization and asset prioritization for **500+** plants.
- **On-device AI imagery** — Optional local or edge image helpers without uploading user photos to third parties.
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on your device: **`getLocalUser()`** scopes **localStorage** keys; **`useMemoriesKV`** stores photo blobs in **IndexedDB**. Optional **`/api/sync`** uploads a JSON metadata document (not images) when KV env vars are set.

**Are photos sent to the AI?**  
No. `/api/llm` accepts text prompts only. Dream-a-Plant and tone classification never include `photoUrl` bytes.

**What are dew, sunlight, pollen, and starlight?**  
In-app currencies from `unlock-system.ts` — earned by tending and spent on cosmetics rerolls and progression. Achievements grant bonus **starlight**.

**Which models run in production?**  
`claude-haiku-4-5-20251001` for classification, `claude-sonnet-4-6` for reflections and JSON dream output (`api/llm.ts`). Spark dev environments may still use `window.spark.llm` as a fallback.

**Why does sync or community show unavailable?**  
**503** means the Edge route is missing env configuration (KV or `DATABASE_URL`). The app continues in local-only mode; sync posts larger than **1 MB** return **413**.

**How do I reset or move gardens?**  
Export from settings, then clear site data or use the in-app reset flow to mint a new **LocalUser** id.

**How do I contribute?**  
GitHub issues and pull requests on this repository. CI expects **578** Vitest tests, ESLint, `tsc --noEmit`, and the bundle size budget to pass.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
