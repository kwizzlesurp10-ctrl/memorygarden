# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter. Plant each memory like a seed on an infinite canvas, return to water and reflect, and watch it grow through living stages—from seed to elder—while the garden around it breathes with the seasons, time of day, and how you feel. No feeds, no pressure: just your memories, tended at your own pace, always yours.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Each memory advances through eight stages (`seed → sprout → seedling → young → bud → bloom → mature → elder`) driven by visits and reflections. Care accelerates growth; long absences leave visible traces on the plant.
- **Reflect emotions** — Text is classified into tones (happy, reflective, bittersweet, peaceful, nostalgic) that steer plant variety, OKLCH palette, and garden mood.
- **Encourage reflection** — Add reflections when you revisit; ask Garden AI for gentle, poetic prompts that connect nearby memories without drowning out your voice.
- **Create connections** — Spatial layout, cluster paths, and thematic groupings help you notice patterns across seasons of your life.
- **Adapt to seasons** — Day/night lighting, seasonal gradients, ambient weather, and optional soundscapes tie the garden to real time and the world outside the screen.
- **Reward tending** — Earn dew, sunlight, pollen, and starlight to unlock palettes, patterns, adornments, and rare plant varieties as you plant, revisit, and cluster-tend.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting** — Upload a photo (stored in IndexedDB), write about the moment, set a date, and place your memory on the infinite canvas.
- **Tending** — Revisit memories to water them, add reflections, and advance growth; each return deepens the story.
- **14 plant varieties** — From wildflowers and ferns to rare unlockables like Eternal Rose and Starlight Succulent, chosen from emotional tone and genetics.
- **Cosmetics & traits** — Unlock and apply palettes, patterns, adornments (dew, fireflies, sparkles), accents, and auras per plant.
- **Fertilizer Boost** — Three tiers (Garden Boost, Premium, Legendary) accelerate growth with distinct particle effects.
- **Dream-a-Plant** — Cross-pollinate ideas into fantastical hybrid genomes via the Storage Shed; plant AI-designed hybrids on the canvas.
- **Remembrance candles** — Light candles in the shed to mark moments you want to hold close.

### ✨ AI-Powered Insights
- **Emotional tone** — Fast classification (`claude-haiku`) steers variety, color, and growth character.
- **Garden AI** — Richer reflections (`claude-sonnet`) weave nearby memory context into gentle prompts.
- **Memory Clusters** — AI-suggested thematic or temporal groupings; tend a cluster to earn unlock currency.
- **Dream engine** — Describe an idea; the LLM returns a structured hybrid genome (name, palette, SVG motif) ready to plant.

### 🎨 Beautiful Views
- **Garden** — Infinite pan-and-zoom canvas with SVG plants, cluster paths, ambient layers, and growth ceremonies.
- **Timeline** — Chronological path through every planted moment.
- **Clusters** — Grouped cards for thematic exploration and cluster-tending rewards.
- **Bloom Wall** — Masonry gallery spotlighting memories at bloom stage and beyond.
- **Explore** — Browse public community gardens when the server API is configured.

### 👥 Collaboration & Sharing
- **Collaborative gardens** — Create or join shared gardens with invite tokens; activity feed and contributor leaderboard track joint tending.
- **Community gardens** — Public gardens backed by `/api/gardens` (Neon Postgres) when `DATABASE_URL` is set.
- **Private sharing** — Share individual memories via link-based access you control.
- **Reactions** — Sprout, water, bloom, heart, and sparkle reactions on shared memories.

### 🌓 Living Atmosphere
- **Day / night** — Background, lighting, and plant rendering follow local time of day.
- **Seasonal mood** — Gradients, weather indicators, and garden mood shift with the current season.
- **Ambient sound** — Optional audio engine keyed to time of day and season (toggle in header).

### 🎮 Progression & Unlocks
- **Currency** — Earn dew, sunlight, pollen, and starlight through planting, reflecting, revisiting, and cluster-tending.
- **Achievements** — Milestones for night visits, elder-stage plants, seasonal plantings, and more.
- **Unlock catalog** — Palettes, patterns, adornments, frames, and legendary varieties gated by tending habits.

### ⌨️ Power User Affordances
- **Keyboard shortcuts** — Fast navigation and actions (`?` opens the cheat sheet).
- **Search & filters** — Filter by tone, stage, date range, and text; full-text memory search.
- **Export** — Full-garden export from settings for a portable archive.
- **Protocol handlers** — Deep links such as `web+memorygarden://` when installed as a PWA.
- **PWA** — Install for an app-like shell with optional protocol registration.
- **Cloud sync** — Optional metadata sync to Vercel KV; photos stay on-device.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy React app tuned for smooth, organic motion and local-first data.

### Frontend stack
- **React 19 + TypeScript** — UI and state owned in `App.tsx`; no external global store.
- **Vite 8** — Dev server (port 5173) and production bundle to `dist/`.
- **Tailwind CSS 4** — Layout and responsive styling; OKLCH color tokens in `theme.css`.
- **Framer Motion** — Springs and transitions for modals, ceremonies, and ambient layers.
- **Radix UI** — Accessible primitives (dialogs, tabs, dropdowns) from `src/components/ui/`.
- **SVG plants** — Seeded procedural builders (`SeededPlantSvg`, variety-specific components) render growth stages on canvas and in the Bloom Wall.

### Data & persistence
- **`useKV`** (`@/lib/storage`) — Namespaced **localStorage** keys scoped per `LocalUser` id (`memorygarden:<userId>:…`).
- **`useMemoriesKV`** — Memory list hook with IndexedDB offload for large photo blobs via `@/lib/blob-store`.
- **Legacy migration** — One-time promotion of pre-scoped keys so older gardens are not lost on upgrade.
- **Storage Shed** — Hybrid seeds, planted hybrids, and remembrance candles persisted per user in localStorage.

### AI layer
- **`getLLMProvider()`** (`@/lib/llm-client.ts`) — Unified abstraction; production calls `POST /api/llm`.
- **Edge route** (`api/llm.ts`) — Proxies to Anthropic: Haiku for classification, Sonnet for reflections. Returns `503` when `ANTHROPIC_API_KEY` is absent; client disables further calls for the session.
- **Spark fallback** — Optional `window.spark.llm` in GitHub Spark environments when the HTTP route is unavailable.

### Edge API routes (Vercel)
| Route | Purpose | Required env vars |
|-------|---------|-------------------|
| `/api/llm` | Tone classification & Garden AI reflections | `ANTHROPIC_API_KEY` |
| `/api/sync` | Per-user metadata sync (last-write-wins) | `KV_REST_API_URL`, `KV_REST_API_TOKEN` |
| `/api/gardens` | Public community gardens (list, join, plant, water) | `DATABASE_URL` (Neon) |

Photos and audio **never** sync to KV or Postgres—they remain in each device's IndexedDB.

### Key modules
- `garden-helpers.ts` — Growth math, tone classification wrappers, seasonal gradients, cluster logic.
- `unlock-system.ts` / `trait-system.ts` — Currency, achievements, cosmetics, and plant genetics.
- `GardenCanvas.tsx` — Infinite pannable/zoomable canvas (primary view).
- Lazy-loaded secondary views — Clusters, Bloom Wall, Explore, export, and collaboration dialogs.

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/`) — Standalone Python agent example (CoinGecko); run separately from the Vite app. CI exercises it from its own directory.
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
   This matches the repo's `.npmrc` and avoids common peer-resolution issues with Vite 8.

### Development
```bash
npm run dev
```
Opens the Vite dev server (default port **5173**). The garden works fully offline with local storage; AI, sync, and community features need their Edge routes (see [Deployment](#deployment)).

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

### Optional: enable AI locally
For classification and Garden AI during development, deploy or proxy the `/api/llm` Edge function with `ANTHROPIC_API_KEY` set, or run inside a GitHub Spark environment where `window.spark` is available.

## Testing

Vitest drives automated checks for garden logic, storage edge cases, LLM client wiring, and more.

### Commands
- **One-off run**: `npm test`
- **Watch**: `npm run test:watch`
- **Coverage**: `npm run test:coverage`

Typical areas covered include growth and stage logic, unlock/currency paths, trait helpers, local user migration, cluster geometry, bloom-wall layout, and HTTP LLM behavior.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The production story on **Vercel** is a static SPA plus three optional Edge routes:

| Variable | Route | Effect when missing |
|----------|-------|---------------------|
| `ANTHROPIC_API_KEY` | `/api/llm` | AI features degrade; garden works locally |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | `/api/sync` | Cloud sync returns `503`; local-only mode |
| `DATABASE_URL` | `/api/gardens` | Explore/community gardens unavailable |

1. **`/api/llm`** — Proxies classification (`kind: classify`, Haiku) and reflection (`kind: reflect`, Sonnet) prompts to Anthropic. Prompts are capped at 4 000 characters server-side.
2. **`/api/sync`** — Stores a JSON document per user (`mg:user:<id>`) in Vercel KV / Upstash. Syncs memories (minus photo blobs), preferences, and `updatedAt`. Last-write-wins merge on pull.
3. **`/api/gardens`** — Community garden CRUD backed by Neon Postgres: list public gardens, join/leave, plant, water, and reflect in shared spaces.

Pushes to **`main`** trigger `npm install` and `npm run build`. **`legacy-peer-deps`** in `.npmrc` keeps Vite 8 and `@vitejs/plugin-react-swc` compatible. `vercel.json` rewrites all paths to `index.html` (SPA) and sets a Content-Security-Policy header.

The header **Sync to cloud** toggle reflects real status (`disabled` → `unavailable` → `syncing` → `idle` / `error`) and stops retrying when the API returns **`503`**, so users are never misled about what is actually syncing.

## Privacy & Data

- **Local-first** — Memories and media default to the browser (localStorage-scoped keys + IndexedDB for blobs). Nothing leaves the device except what you explicitly sync or share.
- **AI payloads** — Classification uses truncated memory text; reflections may include short snippets from nearby memories—never photos, audio, or account profiles.
- **Sync scope** — Only structured fields (text, position, traits, reflections, preferences) sync to KV. Photos stay on each device.
- **Export** — Full-garden export from settings when you want a portable archive.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Richer plant visuals** — Deeper SVG detail, variety-specific growth animations, and polish for hybrid/dream plants.
- **Collaboration** — Real-time presence, conflict-safe merges for joint tending, and smoother invite flows across devices.
- **Export & print** — Higher-fidelity PDF and poster layouts from the Bloom Wall and timeline.
- **Accessibility & i18n** — Audit canvas, modals, and keyboard flows; extract copy for translation; respect `prefers-reduced-motion`.
- **Performance at scale** — Canvas virtualization, lazy plant rendering, and asset prioritization for very large gardens (500+ plants).
- **Offline PWA** — Service-worker caching so the garden shell and last-synced metadata work without a network.
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on your device: scoped localStorage for structured data and IndexedDB for photos and audio. Cloud sync of metadata is optional and only active when KV credentials are configured on the server.

**Are photos sent to the AI?**  
No. AI calls operate on text (and brief neighboring context for reflections), not image or audio bytes.

**Which LLM runs in production?**  
Deployed apps use **`/api/llm`** → Anthropic (`claude-haiku-4-5` for classification, `claude-sonnet-4-6` for reflections). GitHub Spark environments may still expose `window.spark.llm` as a fallback in client code.

**What happens if I clear browser data?**  
Local memories and photos are removed unless you previously exported or synced metadata to KV. Re-syncing restores text and structure but not photos from another device.

**How do unlocks work?**  
Tending habits earn currency (dew, sunlight, pollen, starlight). Spend it in the unlock catalog or earn items automatically when milestones are met (e.g., night visits, elder-stage plants).

**Can I use MemoryGarden without an account?**  
Yes. A local user profile is created automatically in the browser. No sign-in is required for the core garden experience.

**How do I contribute or report an issue?**  
Open a GitHub issue or pull request on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
