# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter. Plant each memory like a seed on an infinite canvas, return to tend it, and watch it grow through eight living stages—from seed to elder—as you reflect, cross-pollinate, and dream new hybrids. No accounts required: your garden lives locally in the browser, with optional cloud sync for metadata when you choose. The atmosphere follows real seasons and time of day; gentle AI helps classify tone and offer poetic reflections without ever seeing your photos. Take your time. Be gentle with yourself. Let your memories grow.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Eight stages (`seed → sprout → seedling → young → bud → bloom → mature → elder`) advance as you visit and reflect; neglect and care both leave traces you can feel.
- **Reflect emotions** — Five tones (`happy`, `reflective`, `bittersweet`, `peaceful`, `nostalgic`) steer plant variety, OKLCH palette, and garden weather.
- **Encourage reflection** — Add notes when you revisit; ask Garden AI for gentle, poetic insights that connect nearby memories without overwriting your voice.
- **Create connections** — Spatial proximity, emotional clusters, and cross-pollination let you blend two memories into a hybrid plant with inherited traits.
- **Dream new life** — Dream-a-Plant uses AI to imagine procedural hybrid genomes and SVG motifs from a mood prompt alone.
- **Adapt to seasons** — Light, mood, and ambient sound follow local time, season, and computed garden weather so the canvas stays tied to the world outside the screen.
- **Earn as you tend** — Four garden currencies (dew, sunlight, pollen, starlight) unlock palettes, patterns, adornments, and frames as you plant, reflect, and revisit.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo (stored in IndexedDB), write about the moment, optionally add location or voice notes, and watch your memory sprout on the canvas.
- **Tending**: Open memories often to see them bloom and mature; each reflection deepens the story and awards dew.
- **Cross-pollination**: Select two parent memories to spawn a hybrid with spliced genetics, combined traits, and rare mutation chances.
- **Dream-a-Plant**: Describe a mood or scene; AI returns a hybrid genome with procedural SVG art when the LLM route is available.
- **Fertilizer Boost**: Three tiers (Garden Boost, Premium, Legendary) accelerate growth with distinct particle effects.

### ✨ AI-Powered Insights
- **Emotional tone**: Text is classified via `/api/llm` (Anthropic Haiku) with keyword fallback and a 500-entry cache.
- **Garden AI**: Poetic reflections (Sonnet) and prompts that weave in short snippets from nearby memories—never photos.
- **Memory Clusters**: Thematic or temporal groupings computed from emotional tone so you can browse by mood as well as by place.

### 🎨 Beautiful Views
- **Garden**: Infinite pan-and-zoom canvas with animated plants, weather, and layered seasonal backgrounds.
- **Timeline**: Chronological path through every planted moment.
- **Clusters**: Grouped cards for thematic exploration.
- **Bloom Wall**: Masonry gallery spotlighting memories that have reached bloom and beyond; tile size scales with stage.
- **Explore**: Browse public community gardens (mock data today; server API ready for wiring).

### 👥 Collaboration & Sharing
- **Collaborative gardens**: Local shared spaces with invite tokens and member panels—grow memories together on one device or via exported sync.
- **Private sharing**: Share specific memories with link-based access (`?share=<id>`) you control.
- **Community gardens**: Explore view previews public gardens; `/api/gardens` (Neon Postgres) is implemented server-side for future live discovery.

### 🌓 Living Atmosphere
- **Day / night**: Four periods (dawn, day, dusk, night) drive background and lighting.
- **Seasonal mood**: Spring, summer, autumn, and winter shift sky, ground, and ambient parameters.
- **Garden weather**: Six computed moods (sunny, mist, rain, rain-sun, golden-haze, partly-cloudy) derived from your memories' emotional mix.
- **Ambient sound**: Optional Web Audio soundscape (brown noise + soft oscillators) tracks time, season, weather, and garden size.

### ⌨️ Power User Affordances
- **Keyboard shortcuts**: `Ctrl/Cmd+N` plant, `Ctrl/Cmd+K` search, `1`–`4` switch views, `?` opens the cheat sheet, `Ctrl/Cmd+Shift+E` export.
- **Protocol handlers**: Three deep-link schemes (`web+memorygarden://`, `web+plantmemory://`, `web+viewmemory://`) when installed as a PWA.
- **PWA**: Standalone manifest, Share Target API (`POST /share`), and theme colors—no service worker yet, so offline caching is roadmap.
- **Export**: Full-garden export from settings (image, PDF, garden-view layouts).
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy React app tuned for smooth, organic motion and local-first data.

### Frontend stack
- **React 19 + TypeScript 6** — UI and state; no external global store.
- **Vite 8** — Dev server (port 5173) and production bundle to `dist/`.
- **Tailwind CSS 4** — Layout and responsive styling via `@tailwindcss/vite`.
- **Framer Motion 12** — Springs and transitions that feel alive.
- **Radix UI** — Accessible primitives (dialogs, tabs, etc.) from `src/components/ui/`.
- **Persistence** — `useKV` from `@/lib/storage` scopes structured data per anonymous `LocalUser` in **localStorage** (`memorygarden:` prefix). Photos and audio over 32 KB spill to **IndexedDB** (`idb://` refs) via `useMemoriesKV` and `blob-store.ts`.
- **AI** — `getLLMProvider()` in `src/lib/llm-client.ts` resolves: HTTP **`POST /api/llm`** (Vercel Edge → Anthropic) → optional **`window.spark`** SDK → static empty fallback. The browser never sees `ANTHROPIC_API_KEY`; session disables HTTP after first 503/404.

### Edge API routes (Vercel)
| Route | Purpose | Required env |
|-------|---------|--------------|
| `/api/llm` | Tone classification + poetic reflections | `ANTHROPIC_API_KEY` |
| `/api/sync` | Optional metadata sync (last-write-wins) | `KV_REST_API_URL`, `KV_REST_API_TOKEN` |
| `/api/gardens` | Public community gardens (Neon Postgres) | `DATABASE_URL` |

Photos and audio never traverse sync or LLM routes—only structured fields and truncated text.

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/`) — Standalone Python agent example (CoinGecko); CI exercises it separately from the Vite app.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js** (current LTS recommended; Docker images use Node 22)
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
   This matches the repo's `.npmrc` and avoids peer-resolution issues with Vite 8 and `@vitejs/plugin-react-swc`.

### Development
```bash
npm run dev
```
Opens the Vite dev server on **5173** by default.

Alternatively, use Docker:
```bash
docker compose --profile dev up dev    # Vite on 5173
docker compose up --build              # nginx production image on 8080
```

### Production build
```bash
npm run build
```
Output is written to **`dist/`** for static hosting. Note: the static Docker/nginx image serves the SPA only—`/api/llm` is not bundled; AI features degrade gracefully without a Vercel Edge deployment.

### Quality checks
```bash
npm run lint          # ESLint
npm test              # Vitest single run (~580 cases across 22 suites)
npm run test:watch    # Watch mode
npm run test:coverage # v8 coverage for src/lib/**
```
CI also runs `tsc --noEmit`, security audit, and a bundle-size gate (400 KB/chunk limit).

### Preview the production bundle
```bash
npm run preview
```
Serves **`dist/`** locally via Vite preview.

## Testing

Vitest (jsdom) drives automated checks for garden logic, storage edge cases, LLM client wiring, protocol routing, validation (85 cases), unlock/trait systems, bloom-wall layout, ambient params, and more. Typical areas: `getPlantStage()`, cross-pollination genetics, local user migration, and HTTP LLM 503 backoff.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The production story on **Vercel** is a static SPA plus three Edge routes:

1. **`/api/llm`** — Proxies classification (`claude-haiku-4-5-20251001`) and reflection (`claude-sonnet-4-6`) prompts to Anthropic. Set **`ANTHROPIC_API_KEY`**. Without it, AI features degrade cleanly while the garden keeps working.
2. **`/api/sync`** — Optional metadata sync to **Vercel KV / Upstash** using **`KV_REST_API_URL`** and **`KV_REST_API_TOKEN`**. Photos and audio stay on-device (IndexedDB); only structured fields participate when sync is on. Last-write-wins; ~1 MB cap per document.
3. **`/api/gardens`** — Public community gardens backed by **Neon Postgres** via **`DATABASE_URL`**. Backend routes (list, join, plant, water, reflect) are live; the Explore UI still uses mock data until wired.

Pushes to **`main`** trigger `npm install --legacy-peer-deps` and `npm run build`. **`legacy-peer-deps`** in `.npmrc` keeps Vite 8 and `@vitejs/plugin-react-swc` compatible.

### Docker Compose profiles
| Profile | Service | Port | Notes |
|---------|---------|------|-------|
| default | `memorygarden` (nginx) | 8080 | Static `dist/`; no Edge APIs |
| `dev` | Vite dev server | 5173 | Hot reload |
| `agents` | `micro-forge` | — | Agent tooling sidecar |

Health check: **`/healthz`** on the nginx image.

### Privacy & identity
- **Anonymous by default**: A generated `LocalUser` (UUID + display name) scopes all KV keys—no sign-in required.
- **Local-first**: Memories and media default to the browser. Nothing leaves the device except what you explicitly sync or share.
- **AI payloads**: Classification uses truncated memory text; reflections may include short snippets from nearby memories—never photos or profiles.
- **Export**: Full-garden export from settings when you want a portable archive.

The header **Sync to cloud** control reflects real status and backs off when the API returns **`503`** (no KV), so users are never misled about what is actually syncing.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Wire Explore to `/api/gardens`** — Replace mock community data with live Neon-backed discovery, join, and tending flows.
- **Collaboration** — Server-backed shared gardens with presence, invite links, and conflict-safe merges beyond last-write-wins sync.
- **Offline PWA** — Service worker, cache strategy, and Share Target handling without network.
- **Export & print** — Higher-fidelity PDF and poster layouts from the Bloom Wall and timeline.
- **AI plant imagery** — Richer procedural SVG and optional generated visuals for Dream-a-Plant hybrids.
- **Accessibility & i18n** — Audit across canvas, modals, and keyboard flows; extract copy for translation.
- **Performance at scale** — Continue canvas virtualization and asset prioritization for very large gardens (500+ plants).
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Do I need an account?**  
No. MemoryGarden creates an anonymous local user on first visit. All data stays scoped to your browser unless you opt into cloud sync.

**Where does my data live?**  
By default on your device: scoped localStorage for structured data and IndexedDB for photos/audio over 32 KB. Cloud sync of metadata is optional and only active when KV credentials are configured.

**Are photos sent to the AI?**  
No. AI calls operate on text (and brief neighboring context for reflections), not image bytes.

**Which LLM runs in production?**  
Deployed apps use **`POST /api/llm`** → Anthropic (`claude-haiku-4-5-20251001` for classification, `claude-sonnet-4-6` for reflections). GitHub Spark environments may still expose `window.spark.llm` as a fallback path in client code.

**What are the unlock currencies?**  
Four garden currencies—**dew**, **sunlight**, **pollen**, and **starlight**—earned by planting, reflecting, revisiting old memories, and tending clusters. Spend them in Garden Unlocks for palettes, patterns, adornments, and frames.

**Does it work offline?**  
The garden runs fully offline for local planting and tending. AI features need `/api/llm`; sync needs KV. There is no service worker yet, so reinstalling or clearing site data removes local storage.

**How do I clear my data?**  
Use browser site-data controls or the in-app settings export/reset paths. IndexedDB blobs and localStorage keys under the `memorygarden:` prefix hold your garden.

**How do I contribute or report an issue?**  
Use GitHub issues and pull requests on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
