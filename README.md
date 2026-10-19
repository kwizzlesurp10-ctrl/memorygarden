# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter. Plant each memory like a seed on an infinite canvas, return to tend it with reflections, and watch it advance through organic growth stages—never rushed, never noisy, always yours on the device first.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Stages run from seed through sprout, bud, bloom, mature, and evergreen as visits, age, and care accumulate.
- **Reflect emotions** — Classification steers plant variety, OKLCH palette, and growth character so the canvas mirrors how each memory feels.
- **Encourage reflection** — Add notes when you revisit; optional Garden AI offers gentle, poetic prompts without replacing your voice.
- **Create connections** — Spatial layout, memory search, and AI-suggested clusters help you notice themes across seasons of your life.
- **Adapt to seasons** — Day/night, seasonal gradients, and ambient mood tie the garden to real time and the world outside the screen.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo, write about the moment, and watch your memory sprout on the canvas.
- **Tending**: Open memories often to see them bloom and mature; reflections deepen the story each time you return.
- **Hybrid seeds**: Cross-pollinate two parent memories to plant offspring with blended traits and genetics (`generateHybridTraits`, shed planting on the canvas).
- **Fertilizer Boost**: Three tiers (Garden Boost, Premium, Legendary) accelerate growth with distinct particle effects.

### ✨ AI-Powered Insights

- **Emotional tone**: Text is classified to steer plant variety, palette, and growth character.
- **Garden AI**: Poetic reflections and prompts that connect nearby memories without overwhelming the original voice.
- **Memory Clusters**: Thematic or temporal groupings so you can browse by mood as well as by place.

### 🔍 The Lens
- **Magnifying loupe** on the garden canvas: follow the cursor over plants without scaling the whole scene (`computeLoupeLayout` in `src/lib/garden/lens.ts`).
- **Zoom** from **1.6× to 4×** (step **0.2**, default **2.4**); wheel or on-screen controls adjust magnification while the loupe is active.
- **GardenLensDetail** opens a focused detail view from the loupe for tending without losing your place on the canvas.

### 🎨 Beautiful Views
- **Garden**: Infinite pan-and-zoom canvas with animated plants and layered backgrounds; per-section error boundaries keep one broken panel from blanking the app.
- **Timeline**: Chronological path through every planted moment.
- **Clusters**: Grouped cards for thematic exploration.
- **Bloom Wall**: A gallery spotlight for memories that have reached full bloom.
- **Community & explore**: Browse and join public gardens when the Neon-backed API is configured.

### 👥 Collaboration & Sharing
- **Collaborative gardens**: Shared spaces to grow memories together when that mode is enabled.
- **Private sharing**: Share specific memories with link-based access you control.

### 🌓 Living Atmosphere
- **Day / night**: Background and lighting follow local time.
- **Seasonal mood**: Subtle shifts for the current season and overall garden “weather.”
- **Ambient sound**: Optional audio that tracks time of day and season.

### ⌨️ Power user affordances
- **Keyboard shortcuts**: Fast navigation and actions (`?` opens the cheat sheet).
- **Protocol handlers**: Deep links such as `web+memorygarden://` when installed as a PWA.
- **PWA**: Install for an app-like shell and optional protocol registration.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy React app tuned for smooth, organic motion and local-first data. `App.tsx` owns garden state; views such as `GardenCanvas`, modals, and clusters receive handlers via props—no global store.

### Frontend stack
- **React 19 + TypeScript** — UI and state.
- **Vite** — Dev server and production bundle.
- **Tailwind CSS** — Layout and responsive styling; **OKLCH** tokens in `src/styles/theme.css` and `garden-helpers.ts`.
- **Framer Motion** — Springs and transitions that feel alive.
- **Radix UI** — Accessible primitives (dialogs, tabs, etc.).
- **Persistence** — `useKV` from `@/lib/storage` scopes structured data per local user in **localStorage**; photos and heavy blobs use **IndexedDB**.
- **Validation** — `ValidationResult<T>` in `src/lib/validation.ts` (discriminated union) guards memories, preferences, search filters, and garden payloads before they hit storage or sync.
- **AI client** — `getLLMProvider()` in `src/lib/llm-client.ts` prefers `POST /api/llm`, then optional **GitHub Spark** `window.spark.llm`, then a static no-network fallback.

### Vercel Edge routes (browser → server)

| Route | Purpose | Required env | If unconfigured |
|-------|---------|--------------|-------------------|
| `POST /api/llm` | Tone classification & reflections via Anthropic | `ANTHROPIC_API_KEY` | **503** — AI features degrade; garden still works |
| `GET`/`POST /api/sync` | Per-user metadata blob in KV (last-write-wins) | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | **503** — local-only mode |
| `GET`/`POST /api/gardens` | Public community gardens (list, join, plant, water, reflect) | `DATABASE_URL` (Neon) | **503** — community features hidden |

Models in `api/llm.ts`: **Haiku** (`claude-haiku-4-5-20251001`) for classify, **Sonnet** (`claude-sonnet-4-6`) for reflect.

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/`) — Standalone Python agent example (CoinGecko); run separately from the Vite app; CI exercises it from its own directory.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js** (current LTS recommended)
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
   This matches the repo’s `.npmrc` and avoids common peer-resolution issues with Vite 8.

### Development
```bash
npm run dev
```
Opens the Vite dev server (default port **5173** unless configured otherwise).

### Production build
```bash
npm run build
```
Output is written to **`dist/`** for static hosting.

### Quality checks
```bash
npm run lint
npm test
```

### Preview the production bundle
```bash
npm run preview
```
Serves **`dist/`** locally (Vite preview server).

## Testing

Vitest drives automated checks for garden logic, storage edge cases, LLM client wiring, and more.

### Commands
- **One-off run**: `npm test`
- **Watch**: `npm run test:watch`
- **Coverage**: `npm run test:coverage`

As of the latest cron run: **578** tests across **22** files (**576** passing). The two failures are in `app-garden-jsx.test.ts` (Vite `transformWithOxc` on shipped `App.tsx` / `GardenCanvas.tsx`) when the garden import block at the top of `App.tsx` is truncated—fix that import and the guard suite goes green again. Coverage otherwise includes growth and stage logic, lens geometry, hybrid traits, unlock/currency paths, validation, local user migration, protocol routing, and HTTP LLM client behavior.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The production story on **Vercel** is a static SPA plus three Edge routes:

1. **`/api/llm`** — Proxies classification and reflection prompts to Anthropic. Set **`ANTHROPIC_API_KEY`**. Without it, the route returns **503** and the client stops retrying for the session while the garden keeps working offline.
2. **`/api/sync`** — Optional per-user metadata sync to **Vercel KV / Upstash** via **`KV_REST_API_URL`** and **`KV_REST_API_TOKEN`**. Photos and audio stay on-device (IndexedDB); reflections, text, positions, traits, and preferences sync when enabled.
3. **`/api/gardens`** — Optional **Neon Postgres** community gardens via **`DATABASE_URL`**. List public gardens, join/leave, plant, water, and reflect in shared spaces; returns **503** when the database is not wired.

Pushes to **`main`** trigger `npm install` and `npm run build`. **`legacy-peer-deps`** in `.npmrc` keeps Vite 8 and `@vitejs/plugin-react-swc` compatible.

The header **Sync to cloud** control reflects real status and backs off on **503** (missing KV), matching the same fail-soft pattern as LLM and community routes.

## Privacy & Data

- **Local-first**: Memories and media default to the browser (localStorage-scoped keys + IndexedDB for blobs). Nothing leaves the device except what you explicitly sync or share.
- **AI payloads**: Classification uses truncated memory text; reflections may include short snippets from nearby memories—never photos or account profiles in those paths.
- **Export**: Full-garden export from settings when you want a portable archive.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Community gardens** — Harden `/api/gardens` auth, moderation, and merge semantics on top of the Neon schema already in the repo.
- **Collaboration** — Richer invitations, presence, and conflict-safe sync when multiple tenders share a space.
- **Export & print** — Higher-fidelity PDF and poster layouts from the Bloom Wall and timeline.
- **Accessibility & i18n** — Full pass on canvas, The Lens loupe, modals, and keyboard shortcuts (`?` cheat sheet); extract copy for translation.
- **Performance at scale** — Canvas virtualization and asset prioritization for very large gardens (500+ plants).
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on your device: scoped localStorage for structured data and IndexedDB for photos/audio. Optional **`/api/sync`** copies metadata to KV when env vars are set; community garden rows live in Neon only when **`DATABASE_URL`** is configured.

**Are photos sent to the AI?**  
No. AI calls operate on truncated text (and short neighboring snippets for reflections), never image bytes.

**Which LLM runs in production?**  
Deployed apps use **`/api/llm`** → Anthropic: **Haiku** for emotional tone classification, **Sonnet** for reflections (`api/llm.ts`). Local/dev may fall back to **GitHub Spark** `window.spark.llm` when the Edge route is unavailable.

**What does HTTP 503 mean?**  
The matching backend is not configured: no API key (LLM), no KV (sync), or no database URL (community gardens). The UI degrades gracefully and avoids retry storms after the first failure.

**How does The Lens zoom work?**  
On the garden canvas, enable the magnifying loupe and scroll or use +/- controls. Zoom is clamped between **1.6×** and **4×** (default **2.4×**); see `src/lib/garden/lens.ts`.

**How do I contribute or report an issue?**  
Use GitHub issues and pull requests on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
