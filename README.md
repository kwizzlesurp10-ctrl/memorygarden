# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, local-first space for the moments that matter. Plant each memory like a seed on an infinite garden canvas, return to water and reflect, and watch it grow through eight life stages—from seed to elder—without accounts, ads, or noise. Your garden lives in the browser; optional cloud sync keeps metadata portable while photos stay on your device.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as hand-crafted SVG plants in a living garden that responds to you:

- **Grow over time** — Plants advance through eight stages (`seed → sprout → seedling → young → bud → bloom → mature → elder`) as you visit and reflect; neglect and care both leave traces you can feel.
- **Reflect emotions** — AI-assisted tone classification steers plant variety, palette, and growth character so the garden mirrors how each memory feels.
- **Encourage reflection** — Add notes when you revisit; invite gentle, poetic insights when you ask the Garden AI.
- **Create connections** — Cross-pollinate two memories into a hybrid plant, dream new varieties in the Storage Shed, and let emotional-tone clustering reveal themes across seasons of your life.
- **Adapt to seasons** — Day/night lighting, seasonal mood, and optional ambient sound tie the garden to real time and the world outside the screen.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo (stored in IndexedDB), write about the moment, and watch your memory sprout on the SVG garden scene.
- **Tending**: Open memories often to see them bloom and mature; reflections deepen the story each time you return.
- **Eight growth stages**: `seed → sprout → seedling → young → bud → bloom → mature → elder`, driven by visits, age, and reflections.
- **Fertilizer Boost**: Three tiers (Garden Boost, Premium, Legendary) accelerate growth with distinct particle effects.

### 🧬 Hybrids & Creative Play
- **Dream-a-Plant**: Describe an idea and the Garden AI (or a local fallback) generates a hybrid genome you can plant from the Storage Shed.
- **Storage Shed**: Save hybrid seeds, choose shed styles, and place dream-plants on the canvas.
- **Cross-Pollination**: Select two memories to merge into a shared hybrid offspring.
- **Remembrance Candles**: Light candles on the garden scene for quiet moments of reflection.

### 🎖️ Unlocks & Cosmetics
- **Garden currency**: Earn dew, sunlight, pollen, and starlight through tending, reflections, and milestones.
- **Trait unlocks**: Palettes, patterns, adornments, accents, and auras unlock per plant based on visit history, reflections, shares, and elder status.
- **Garden Unlocks panel**: Spend currency on global cosmetics and track achievements.

### ✨ AI-Powered Insights
- **Emotional tone**: Text is classified (`happy`, `reflective`, `bittersweet`, `peaceful`, `nostalgic`) to steer plant variety, palette, and growth character.
- **Garden AI**: Poetic reflections and prompts that connect nearby memories without overwhelming the original voice.
- **Memory Clusters**: Grouped by emotional tone (heuristic, not LLM)—browse by mood as well as by place.

### 🎨 Five View Modes
- **Garden**: Infinite pan-and-zoom SVG scene with animated plants, cluster paths, lens detail, and layered backgrounds.
- **Timeline**: Chronological path through every planted moment.
- **Clusters**: Grouped cards for thematic exploration by emotional tone.
- **Explore**: Browse and visit community gardens when the server API is configured.
- **Bloom Wall**: A gallery spotlight for memories that have reached full bloom.

### 👥 Collaboration & Sharing
- **Collaborative gardens**: Local-first shared spaces stored in your browser; invite others when that mode is enabled.
- **Community gardens**: Public gardens via `/api/gardens` when `DATABASE_URL` is set (Neon Postgres).
- **Private sharing**: Share specific memories with link-based access you control.

### 🌓 Living Atmosphere
- **Day / night**: Background and lighting follow local time.
- **Seasonal mood**: Subtle shifts for the current season and overall garden "weather."
- **Ambient sound**: Optional audio that tracks time of day and season.

### ⌨️ Power User Affordances
- **Keyboard shortcuts**: Fast navigation and actions (`?` opens the cheat sheet).
- **Protocol handlers**: Deep links such as `web+memorygarden://` when installed as a PWA.
- **PWA**: Install for an app-like shell and optional protocol registration.
- **Export**: Full-garden export from settings for a portable archive.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy React app tuned for smooth, organic motion and local-first data.

### Frontend stack
- **React 19 + TypeScript** — UI and state owned by `App.tsx`; no external global store.
- **Vite 8** — Dev server (port 5173) and production bundle to `dist/`.
- **Tailwind CSS 4** — Layout and responsive styling; OKLCH color tokens in `theme.css`.
- **Framer Motion** — Springs and transitions that feel alive.
- **Radix UI** — Accessible primitives (dialogs, tabs, etc.) from `src/components/ui/`.
- **SVG garden scene** — `GardenCanvas` renders an infinite pan/zoom garden using `GardenSceneSvg`, `SeededPlantSvg`, and hybrid builders (not an HTML5 `<canvas>`).
- **Persistence** — `useKV` from `@/lib/storage` scopes structured data per local user in **localStorage**; photos and heavy blobs use **IndexedDB** via `@/lib/blob-store` to stay under typical string quotas.
- **Local user** — A generated profile (`getLocalUser()`) provides a stable `userId` with no sign-in required.
- **AI** — `getLLMProvider()` from `@/lib/llm-client` posts to **`/api/llm`** (Vercel Edge → Anthropic). The browser never sees the API key. Missing routes or `503` responses fall back gracefully (including optional **GitHub Spark** `window.spark` where present).

### Edge API routes (Vercel)
| Route | Purpose | Required env vars |
|-------|---------|-------------------|
| `/api/llm` | Emotional classification & Garden AI reflections | `ANTHROPIC_API_KEY` |
| `/api/sync` | Optional metadata sync (last-write-wins) | `KV_REST_API_URL`, `KV_REST_API_TOKEN` |
| `/api/gardens` | Community gardens (list, join, plant, water) | `DATABASE_URL` (Neon Postgres) |

Photos and audio are **not** uploaded to any API—only structured fields sync when enabled.

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/`) — Standalone Python agent example (CoinGecko); run separately from the Vite app. CI exercises it from its own directory.
- **Micro-Forge agents** (`agents/micro_forge/`) — Optional Python scan/report tooling (`docker compose --profile agents run --rm micro-forge`).
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js** 20+ (current LTS recommended; CI uses Node 20)
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
   This matches the repo's `.npmrc` and avoids common peer-resolution issues with Vite 8.

### Development
```bash
npm run dev
```
Opens the Vite dev server at **http://localhost:5173** (unless configured otherwise).

### Production build
```bash
npm run build
```
Output is written to **`dist/`** for static hosting.

### Quality checks
```bash
npm run lint      # ESLint
npm test          # Vitest single run
npm run test:watch
npm run test:coverage
```
CI on every push/PR runs typecheck (`tsc --noEmit`), lint, unit tests, and edge-route tests.

### Preview the production bundle
```bash
npm run preview
```
Serves **`dist/`** locally via the Vite preview server.

### Docker (optional)
```bash
# Production SPA behind nginx → http://localhost:8080
docker compose up --build

# Vite dev server in a container → http://localhost:5173
docker compose --profile dev up dev
```
Note: `/api/llm`, `/api/sync`, and `/api/gardens` are Vercel Edge routes—not bundled in the static Docker image. AI and sync degrade gracefully when those endpoints are unavailable.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The production story on **Vercel** is a static SPA plus three Edge routes:

| Env var | Route | Behavior when missing |
|---------|-------|----------------------|
| `ANTHROPIC_API_KEY` | `/api/llm` | Returns `503`; classification defaults to `peaceful`, reflections use static copy |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | `/api/sync` | Returns `503`; app stays local-only |
| `DATABASE_URL` | `/api/gardens` | Returns `503`; Explore view shows unavailable state |

Pushes to **`main`** trigger `npm install` and `npm run build`. **`legacy-peer-deps`** in `.npmrc` keeps Vite 8 and `@vitejs/plugin-react-swc` compatible.

The header **Sync to cloud** control reflects real status and backs off when the API returns **`503`** (no KV), so users are never misled about what is actually syncing.

## Privacy & Data

- **Local-first**: Memories and media default to the browser (localStorage-scoped keys + IndexedDB for blobs). Nothing leaves the device except what you explicitly sync or share.
- **No account required**: A generated local profile (`memorygarden:user`) provides a stable ID; no OAuth or email sign-up.
- **AI payloads**: Classification uses truncated memory text; reflections may include short snippets from nearby memories—never photos or account profiles in those paths.
- **Export & clear**: Full-garden export from settings; clearing site data removes all local memories and IndexedDB blobs.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Community gardens** — Wire the Explore view fully to `/api/gardens` (plant-in-garden, richer presence, conflict-safe merges).
- **Server-backed shares** — Durable share links with optional expiry instead of purely client-generated tokens.
- **AI plant imagery** — Optional generated thumbnails for Dream-a-Plant hybrids beyond SVG motifs.
- **Collaboration depth** — Real-time co-tending and invitation flows for local collaborative gardens.
- **Export & print** — Higher-fidelity PDF and poster layouts from the Bloom Wall and timeline.
- **Accessibility & i18n** — Audit across canvas, modals, and keyboard flows; extract copy for translation.
- **Performance at scale** — Continue canvas virtualization and asset prioritization for very large gardens (500+ plants).
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on your device: scoped localStorage for structured data and IndexedDB for photos/audio. Cloud sync of metadata is optional and only active when KV credentials are configured on the server.

**Do I need an account?**  
No. MemoryGarden creates a local profile automatically (`GentleGardener`-style names). Your `userId` scopes all KV keys and sync documents.

**Are photos sent to the AI?**  
No. AI calls operate on text (and brief neighboring context for reflections), not image bytes. Dream-a-Plant sends your idea text, not photos.

**Which LLM runs in production?**  
Deployed apps use **`/api/llm`** → Anthropic (`claude-haiku-4-5` for classification, `claude-sonnet-4-6` for reflections). Spark environments may still expose `window.spark.llm` as a fallback path in client code.

**How do unlocks and currency work?**  
Tending actions earn dew, sunlight, pollen, and starlight. Milestones (reflections, night visits, elder plants, etc.) unlock global palettes, patterns, and adornments. Individual plants also earn per-trait unlocks based on their own history.

**Does it work offline?**  
Yes. The garden is fully usable offline; AI features and cloud sync require network access to their respective Edge routes.

**How do I clear all my data?**  
Use your browser's "clear site data" for this origin, or export first via Settings → Export Garden. This removes localStorage keys and IndexedDB blobs.

**How do I contribute or report an issue?**  
Use GitHub issues and pull requests on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
