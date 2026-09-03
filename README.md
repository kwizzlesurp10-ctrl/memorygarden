# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter. Plant each memory like a seed, return to tend it, and watch it grow through eight organic stages on an infinite canvas—never rushed, never noisy, always yours.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Plants advance through eight stages (`seed → sprout → seedling → young → bud → bloom → mature → elder`) as you visit and reflect; neglect and care both leave traces you can feel.
- **Reflect emotions** — AI-assisted tone classification shapes variety, palette, and growth character so the garden mirrors how each memory feels.
- **Encourage reflection** — Add notes when you revisit; invite gentle, poetic insights when you ask the Garden AI.
- **Create connections** — Spatial proximity, hybrid cross-pollination, and clustering help you notice themes across seasons of your life.
- **Adapt to seasons** — Light, mood, and atmosphere follow real time and season so the garden stays tied to the world outside the screen.
- **Earn as you tend** — Pollen, cosmetic traits, and achievements unlock as you plant, reflect, and revisit—rewards for showing up, not grinding.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo, write about the moment, and watch your memory sprout on the canvas.
- **Tending**: Open memories often to see them bloom and mature; reflections deepen the story each time you return.
- **Hybrid cross-pollination**: Combine two plant varieties in the garden shed to create unique hybrids with custom genomes and motifs.
- **Fertilizer Boost**: Three tiers (Garden Boost, Premium, Legendary) accelerate growth with distinct particle effects (visual demo—no live payment integration).
- **Unlocks & cosmetics**: Earn pollen and unlock palettes, patterns, adornments, and auras as you tend your garden.

### ✨ AI-Powered Insights

- **Emotional tone**: Text is classified (Claude Haiku) to steer plant variety, palette, and growth character.
- **Garden AI**: Poetic reflections and prompts (Claude Sonnet) that connect nearby memories without overwhelming the original voice.
- **Memory Clusters**: Thematic or temporal groupings so you can browse by mood as well as by place.

### 🎨 Beautiful Views
- **Garden**: Infinite pan-and-zoom canvas with animated plants and layered backgrounds.
- **Timeline**: Chronological path through every planted moment.
- **Clusters**: Grouped cards for thematic exploration.
- **Bloom Wall**: A growth-weighted collage—tile size scales with plant stage so your most-tended memories stand out.
- **Explore**: Browse community gardens (demo UI today; server API ready for wiring).

### 👥 Collaboration & Sharing
- **Collaborative gardens**: Local-first shared spaces with invite links (`?invite=…&token=…`) stored in your browser.
- **Private sharing**: Share specific memories via `?share=…` links (resolves on the device that created them unless cloud sync is active).
- **Export**: Image, PDF, or garden-view exports from settings for a portable archive.

### 🌓 Living Atmosphere
- **Day / night**: Background and lighting follow local time.
- **Seasonal mood**: Subtle shifts for the current season and overall garden “weather.”
- **Ambient sound**: Optional Web Audio that tracks time of day and season.

### ⌨️ Power user affordances
- **Keyboard shortcuts**: Fast navigation and actions (`?` opens the cheat sheet; `1`–`4` switch views).
- **Protocol handlers**: Three deep-link schemes when installed as a PWA—`web+memorygarden://`, `web+plantmemory://`, `web+viewmemory://`.
- **Share target**: Receive photos from other apps directly into MemoryGarden via the PWA share sheet.
- **PWA**: Install for an app-like shell (manifest + protocol handlers; no service worker yet—offline caching is on the roadmap).
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy React app tuned for smooth, organic motion and local-first data.

### Frontend stack
- **React 19 + TypeScript** — UI and state.
- **Vite 8** — Dev server (port 5173) and production bundle.
- **Tailwind CSS v4** — Layout and responsive styling via `@tailwindcss/vite`.
- **Framer Motion** — Springs and transitions that feel alive.
- **Radix UI** — Accessible primitives (dialogs, tabs, etc.).
- **Persistence** — `useKV` from `@/lib/storage` scopes data per local user in **localStorage** (`memorygarden:` prefix); large photo payloads use **IndexedDB** (`idb://` refs) so you stay under typical string quotas.
- **AI** — `POST` to **`/api/llm`** (Vercel Edge): prompts go to **Anthropic** (`claude-haiku-4-5` for classification, `claude-sonnet-4-6` for reflections) with `ANTHROPIC_API_KEY` on the server. The browser never sees the key. If the route is missing or returns `503`, the app falls back gracefully (including optional **GitHub Spark** `window.spark` where present).

### Edge API routes (Vercel)
1. **`/api/llm`** — Anthropic proxy for tone classification and Garden AI reflections.
2. **`/api/sync`** — Optional metadata sync to **Vercel KV / Upstash** (`KV_REST_API_URL`, `KV_REST_API_TOKEN`).
3. **`/api/gardens`** — Community gardens backed by **Neon Postgres** (`DATABASE_URL`); API is live, Explore UI still uses demo data.

### Deployment options
- **Vercel** (recommended) — Static SPA + Edge routes; pushes to `main` run CI (typecheck, lint, test, build).
- **Docker** — `docker compose up --build` serves the static build via nginx on port 8080 (no Edge routes in the container).

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/`) — Standalone Python agent (CoinGecko, SQLite, Discord webhooks) you run separately from the Vite app; CI exercises it from its own directory.
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
   This matches the repo’s `.npmrc` (`legacy-peer-deps=true`) and avoids common peer-resolution issues with Vite 8.

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

### Docker (static only)
```bash
docker compose up --build
```
Serves the production build via nginx on port **8080**. Edge API routes (`/api/llm`, `/api/sync`, `/api/gardens`) require Vercel or a separate proxy.

## Testing

Vitest drives automated checks for garden logic, storage edge cases, LLM client wiring, and more.

### Commands
- **One-off run**: `npm test`
- **Watch**: `npm run test:watch`
- **Coverage**: `npm run test:coverage`

Typical areas covered include growth and stage logic, unlock/currency paths, trait helpers, local user migration, and HTTP LLM behavior.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The production story on **Vercel** is a static SPA plus three Edge routes:

1. **`/api/llm`** — Proxies classification and reflection prompts to Anthropic. Set **`ANTHROPIC_API_KEY`** in the project. Without it, AI features degrade cleanly while the garden keeps working.
2. **`/api/sync`** — Optional metadata sync to **Vercel KV / Upstash** using **`KV_REST_API_URL`** and **`KV_REST_API_TOKEN`**. Photos and audio stay on-device (IndexedDB); only structured fields participate when sync is on.
3. **`/api/gardens`** — Community gardens backed by **Neon Postgres** via **`DATABASE_URL`**. The API is deployed; the Explore view still uses demo data until wired.

Pushes to **`main`** trigger CI (`npm ci`, typecheck, lint, test, build). **`.npmrc`** sets `legacy-peer-deps=true` so Vite 8 and `@vitejs/plugin-react-swc` resolve cleanly.

The header **Sync to cloud** control reflects real status and backs off when the API returns **`503`** (no KV), so users are never misled about what is actually syncing.

### Docker alternative
`docker compose up --build` serves the static SPA on port **8080** via nginx. Edge routes are not included—use Vercel for full API support.

## Privacy & Data

- **Local-first**: Memories and media default to the browser (localStorage-scoped keys + IndexedDB for blobs). Nothing leaves the device except what you explicitly sync or share.
- **AI payloads**: Classification uses truncated memory text; reflections may include short snippets from nearby memories—never photos or account profiles in those paths.
- **Share links**: `?share=…` and `?invite=…` URLs resolve against local storage on the creating device unless cloud sync bridges them.
- **Export**: Full-garden export (image, PDF, garden-view) from settings when you want a portable archive.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Community gardens** — Wire the Explore view to `/api/gardens` (Neon Postgres) for real multi-user tending instead of demo data.
- **Cross-device sharing** — Server-backed share and invite links so memories travel beyond a single browser.
- **Offline PWA** — Service worker and asset caching for installable, offline-capable gardens.
- **Plant visuals** — Richer SVG plant designs with more variety, detail, and stage-specific animation.
- **Export & print** — Higher-fidelity PDF and poster layouts from the Bloom Wall and timeline.
- **Accessibility & i18n** — Audit across canvas, modals, and keyboard flows; extract copy for translation.
- **Performance at scale** — Continue canvas virtualization and asset prioritization for very large gardens (500+ plants).
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on your device: scoped localStorage for structured data and IndexedDB for heavy blobs. Cloud sync of metadata is optional and only active when KV credentials are configured.

**Are photos sent to the AI?**  
No. AI calls operate on text (and brief neighboring context for reflections), not image bytes.

**Which LLM runs in production?**  
Deployed apps use **`/api/llm`** → Anthropic (`claude-haiku-4-5` for classification, `claude-sonnet-4-6` for reflections). Spark environments may still expose `window.spark.llm` as a fallback path in client code.

**What are the plant growth stages?**  
Eight stages: `seed → sprout → seedling → young → bud → bloom → mature → elder`. Visits, reflections, and time all contribute to advancement.

**Do share links work on other devices?**  
Not yet by default. `?share=…` and `?invite=…` URLs resolve against local storage on the device that created them. Cloud sync or future server-backed sharing will bridge devices.

**How do I contribute or report an issue?**  
Use GitHub issues and pull requests on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
