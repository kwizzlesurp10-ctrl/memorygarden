# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter. Plant each memory like a seed, return to tend it, and watch it grow on an infinite canvas—pan, zoom, or use **The Lens** to magnify a single spot without disturbing the rest of the garden. Nothing is rushed or noisy; the pace is yours.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Plants advance from seed through sprout, bud, bloom, mature, and evergreen as you visit and reflect; care and absence both show up in growth.
- **Reflect emotions** — AI-assisted tone classification steers plant variety, palette, and character so the canvas mirrors how each memory feels.
- **Encourage reflection** — Add notes when you revisit; ask Garden AI for gentle, poetic prompts that respect your voice.
- **Create connections** — Spatial layout, proximity, and AI-suggested clusters help you notice themes across seasons of your life.
- **Adapt to seasons** — Day/night, weather, and seasonal mood tie the garden to real time without breaking the calm.
- **Look closer** — **The Lens** is a circular magnifying loupe: the scene stays at 1× while you inspect fine detail under the cursor (see `src/lib/garden/lens.ts`).
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo, write about the moment, and watch your memory sprout on the canvas.
- **Tending**: Open memories often to see them bloom and mature; reflections deepen the story each time you return.
- **Fertilizer Boost**: Three tiers (Garden Boost, Premium, Legendary) accelerate growth with distinct particle effects.

### ✨ AI-Powered Insights

- **Emotional tone**: Text is classified to steer plant variety, palette, and growth character.
- **Garden AI**: Poetic reflections and prompts that connect nearby memories without overwhelming the original voice.
- **Memory Clusters**: Thematic or temporal groupings so you can browse by mood as well as by place.

### 🎨 Beautiful Views
- **Garden**: Infinite pan-and-zoom canvas with animated plants, parallax (when motion is on), and layered backgrounds.
- **The Lens**: Toggle a magnifying loupe on the garden toolbar—adjust zoom (≈1.6×–4×) and move the glass over the canvas; geometry comes from `computeLoupeLayout` in `src/lib/garden/lens.ts` so only the overlay magnifies, never the whole scene.
- **Timeline**: Chronological path through every planted moment.
- **Clusters**: Grouped cards for thematic exploration.
- **Bloom Wall**: A gallery spotlight for memories that have reached full bloom.
- **Explore / Community**: Browse public gardens when the optional server API is configured (see Deployment).

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
MemoryGarden is a client-heavy React app tuned for smooth, organic motion and local-first data.

### Frontend stack
- **React 19 + TypeScript** — UI and state owned in `App.tsx`; views compose canvas, modals, and lazy-loaded panels.
- **Vite** — Dev server and production bundle (`dist/`).
- **Tailwind CSS + OKLCH theme** — Layout and palettes in `src/styles/theme.css` and garden helpers (no raw hex in new UI).
- **Framer Motion** — Springs and transitions; parallax pauses while **The Lens** is active so pointer mapping stays stable.
- **Radix UI** — Accessible primitives (dialogs, tabs, etc.).
- **Persistence** — `useKV` from `@/lib/storage` scopes structured data per local user in **localStorage**; photos and heavy blobs use **IndexedDB**.
- **Validation** — `src/lib/validation.ts` exposes `ValidationResult<T>` (ok/value vs errors[]) for memory payloads, preferences, and collaborative garden input—no runtime schema library; callers branch on `ok`.
- **Garden rendering** — `GardenCanvas.tsx` paints plants; loupe layout is pure math in `src/lib/garden/lens.ts` (`computeLoupeLayout`, `clampLensZoom`, `stepLensZoom`).
- **AI** — `getLLMProvider()` in `src/lib/llm-client.ts` prefers `POST` **`/api/llm`** (Vercel Edge → **Anthropic** with `ANTHROPIC_API_KEY`). The browser never sees the key. Missing routes or `503` responses degrade to static copy; optional **GitHub Spark** `window.spark.llm` remains a fallback when present.

### Edge APIs (Vercel)
| Route | Purpose | Env vars |
|-------|---------|----------|
| `/api/llm` | Classification & reflection prompts | `ANTHROPIC_API_KEY` |
| `/api/sync` | Optional metadata sync (KV / Upstash) | `KV_REST_API_URL`, `KV_REST_API_TOKEN` |
| `/api/gardens` | Optional community gardens (Neon Postgres) | `DATABASE_URL` |

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
Opens the Vite dev server (default port **5173** unless configured otherwise). On the garden view, use the magnifying-glass control to try **The Lens**; zoom steppers appear while it is enabled.

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

Typical areas covered include growth and stage logic, loupe geometry (`lens.test.ts`), unlock/currency paths, trait helpers, local user migration, protocol URLs, and HTTP LLM behavior. Current suite: **578** tests across **22** files (`npm test`).
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The production story on **Vercel** is a static SPA plus Edge handlers under `api/`:

1. **`/api/llm`** — Proxies classification and reflection prompts to Anthropic. Set **`ANTHROPIC_API_KEY`**. Without it, AI features degrade cleanly while the garden keeps working.
2. **`/api/sync`** — Optional per-user metadata sync to **Vercel KV / Upstash** via **`KV_REST_API_URL`** and **`KV_REST_API_TOKEN`**. Photos and audio stay on-device (IndexedDB); reflections, text, positions, traits, etc. sync when enabled.
3. **`/api/gardens`** — Optional **Community Gardens** backend on **Neon** (`DATABASE_URL`). List/join/plant/water/reflect on shared public gardens; the client falls back to local-only collaborative state when the database is unavailable.

Pushes to **`main`** trigger `npm install` and `npm run build`. **`legacy-peer-deps`** in `.npmrc` keeps Vite 8 and `@vitejs/plugin-react-swc` compatible.

The header **Sync to cloud** control reflects real status and backs off when sync returns **`503`** (no KV), so users are not misled about what is actually syncing.

## Privacy & Data

- **Local-first**: Memories and media default to the browser (localStorage-scoped keys + IndexedDB for blobs). Nothing leaves the device except what you explicitly sync or share.
- **AI payloads**: Classification uses truncated memory text; reflections may include short snippets from nearby memories—never photos or account profiles in those paths.
- **Export**: Full-garden export from settings when you want a portable archive.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Collaboration** — Richer shared-garden invitations, presence, and conflict-safe merges between local KV state and `/api/gardens`.
- **Export & print** — Higher-fidelity PDF and poster layouts from the Bloom Wall and timeline.
- **Accessibility & i18n** — Audit canvas, **The Lens** controls, modals, and keyboard flows (`?` cheat sheet); extract copy for translation.
- **Performance at scale** — Continue canvas virtualization and asset prioritization for very large gardens (500+ plants).
- **Lens polish** — Optional keyboard shortcut and reduced-motion path for loupe tracking on low-power devices.
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on your device: scoped localStorage for structured data and IndexedDB for heavy blobs. Optional **`/api/sync`** copies metadata (not photos) when KV is configured.

**Are photos sent to the AI?**  
No. AI calls operate on text (and brief neighboring context for reflections), not image bytes.

**What is The Lens?**  
A circular magnifying loupe on the garden canvas. The base scene stays at 1×; only the overlay zooms. Implementation: `src/lib/garden/lens.ts` and tests in `src/lib/__tests__/lens.test.ts`.

**Do I need a database?**  
No for solo use. **`DATABASE_URL`** is only required if you enable Community Gardens via **`/api/gardens`**.

**Which LLM runs in production?**  
Deployed apps use **`/api/llm`** → Anthropic (see `api/llm.ts`). Spark environments may still expose `window.spark.llm` as a fallback in `src/lib/llm-client.ts`.

**How do I contribute or report an issue?**  
Use GitHub issues and pull requests on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
