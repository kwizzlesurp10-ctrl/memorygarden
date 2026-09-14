# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, local-first space for the moments that matter. Plant each memory like a seed on an infinite canvas, return to tend it, and watch it grow through eight stages—from **seed** to **elder**—without accounts, ads, or a server holding your photos. Your garden lives in the browser: structured data in scoped **localStorage**, heavy photos and audio in **IndexedDB**, and an optional anonymous **LocalUser** profile (e.g. *GentleGardener*) so your keys stay yours. AI tone hints and poetic reflections arrive through a server proxy when configured; the garden keeps working when they are not. Never rushed, never noisy—always yours.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Eight stages (**seed → sprout → seedling → young → bud → bloom → mature → elder**) driven by visits, reflections, vitality, and age. Neglect and care both leave traces you can feel.
- **Reflect emotions** — Five tones (**happy, reflective, bittersweet, peaceful, nostalgic**) steer plant variety, OKLCH palette, and growth character. AI classification runs when `/api/llm` is available; otherwise the garden defaults to **peaceful**.
- **Living atmosphere** — Six weather moods (**sunny, mist, rain, rain-sun, golden-haze, partly-cloudy**) follow the dominant emotional mix. Day/night lighting and seasonal gradients tie the canvas to real time.
- **Encourage reflection** — Add notes when you revisit; ask Garden AI for gentle, poetic insights that weave nearby memories without drowning your voice.
- **Create connections** — **Cross-pollinate** two memories into a hybrid seed; **Dream-a-Plant** invents new genomes with the LLM (offline fallback when needed). Clustering and spatial proximity surface themes across seasons.
- **Earn and spend** — Four currencies (**dew, sunlight, pollen, starlight**) unlock palettes, patterns, adornments, and frames; seven achievements reward long-term tending.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo (stored in IndexedDB when large), write about the moment, and sprout on the canvas.
- **Tending**: Visits and reflections advance vitality; five trait slots unlock by stage (palette, pattern, adornment, accent, aura).
- **Fertilizer Boost**: Three tiers (Garden Boost, Premium, Legendary) add visit credit with distinct particle effects.
- **Cross-pollination**: Select two parent memories to breed a hybrid with blended traits and `hybridGenome` metadata.
- **Dream-a-Plant**: LLM-generated genomes you can plant directly or stash as seeds in the **Storage Shed** (antique, storybook, glass, or modern styles) alongside remembrance candles.

### ✨ AI-Powered Insights
- **Emotional tone**: Classifies text to steer variety among 13 plant types (from wildflowers to legendary ancient oaks).
- **Garden AI**: Poetic reflections using nearby memory snippets—never photo bytes.
- **Memory Clusters**: Thematic or temporal groupings for mood-first browsing.

### 🎨 Five Views
| View | What you get |
|------|----------------|
| **Garden** | Infinite pan/zoom canvas, weather overlays, shed, dream panel |
| **Timeline** | Chronological list sorted by memory date |
| **Clusters** | AI-suggested groupings |
| **Bloom Wall** | Masonry gallery with tile size weighted by growth stage |
| **Explore** | Three demo community gardens (client-side mock; server API ready but not wired) |

### 🏆 Unlocks & Achievements
- **18 cosmetic unlocks** across palettes, patterns, and adornments (common → legendary).
- **7 achievements** (First Reflection, Green Thumb, Master Gardener, Night Owl, Memory Keeper, Time Traveler, Elder Grove) award starlight.
- **Genetics re-roll** costs 5 dew. Debug mode can unlock everything instantly for QA.

### 👥 Collaboration & Sharing (honest status)
- **Private share links** (`?share=<id>`) — implemented; read-only shared memory view.
- **Collaborative gardens** — local invite URLs with 7-day tokens and owner/collaborator/viewer roles; data stays in your browser KV.
- **Community gardens** — Explore tab is a polished demo; `/api/gardens` (Neon Postgres) exists on Vercel but the UI does not call it yet.

### 🌓 Living Atmosphere
- **Day / night** and **seasonal** gradients on the canvas.
- **Weather effects** driven by garden mood (six types).
- **Ambient audio engine** — optional soundscape keyed to weather, season, and time of day.

### ⌨️ Power User Affordances
- **Keyboard shortcuts**: `1`–`4` switch views, `Ctrl/Cmd+N` plant, `Ctrl/Cmd+Shift+E` export, `?` cheat sheet.
- **Search & filters**: Tone, stage, date range, and location (UI present; `Ctrl/Cmd+K` descriptor exists but is not wired yet).
- **Protocol handlers**: `web+memorygarden://`, `web+plantmemory://`, `web+viewmemory://` via manifest.
- **PWA shell**: Standalone manifest, icons, and Share Target API—no service worker yet, so offline cache is a roadmap item.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy React app tuned for smooth, organic motion and local-first data.

### Frontend stack

| Layer | Choice |
|-------|--------|
| UI | React **19.2**, TypeScript **6.0**, Vite **8** |
| Styling | Tailwind CSS **4.1**, OKLCH tokens in `theme.css` |
| Motion | Framer Motion **12** (spring physics) |
| Components | Radix UI primitives + shadcn patterns |
| Icons | Phosphor (product), Lucide (shadcn) |
| Validation | Zod **4** for external input |

### Persistence & identity
- **`useKV`** (`@/lib/storage`) — namespaced `localStorage` keys per **LocalUser** id (`memorygarden:{userId}:memories`, etc.).
- **`useMemoriesKV`** — transparent IndexedDB offload for photos/audio >32 KB (`idb://` references).
- **`readRaw` / `writeRaw`** — non-React helpers for shed seeds, shared copies, and collaborative gardens.

### AI client chain
`getLLMProvider()` in `src/lib/llm-client.ts` resolves in order:
1. `POST /api/llm` (Vercel Edge → Anthropic; key never in browser)
2. `window.spark.llm` when running inside GitHub Spark
3. Static empty fallback (tone → **peaceful**, reflections → canned copy)

### Vercel Edge routes

| Route | Env vars | Purpose |
|-------|----------|---------|
| `/api/llm` | `ANTHROPIC_API_KEY` | Classify (`claude-haiku-4-5-20251001`) & reflect (`claude-sonnet-4-6`) |
| `/api/sync` | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Last-write-wins metadata sync (1 MB cap; no blobs) |
| `/api/gardens` | `DATABASE_URL` (Neon) | Community gardens CRUD — backend ready, Explore UI still mock |

All three return **503** when credentials are missing; the SPA degrades gracefully.

### Quality gate
**578 Vitest cases** across 22 files (growth, unlocks, traits, storage, LLM client, protocol router, integration). CI also runs `tsc --noEmit`, ESLint, coverage, and a bundle-size budget.

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/`) — standalone Python agent (CoinGecko); CI pytest from its own directory.
- **Micro-Forge** (`agents/micro_forge/`) — repo scan agent; runnable via `docker compose --profile agents`.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js 20+** (LTS recommended; CI uses 20)
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
   Matches `.npmrc` — avoids peer-resolution friction with Vite 8 and `@vitejs/plugin-react-swc`.

### Development
```bash
npm run dev          # Vite on http://localhost:5173
```

### Production build & preview
```bash
npm run build        # → dist/
npm run preview      # serve dist/ locally
```

### Quality checks
```bash
npm run lint         # ESLint
npx tsc --noEmit     # typecheck (also in CI)
npm test             # 578 Vitest cases
npm run test:coverage
```

### Docker
```bash
docker compose up --build              # nginx SPA → http://localhost:8080  (/healthz)
docker compose --profile dev up dev    # Vite dev server in container
docker compose --profile agents run --rm micro-forge   # Python repo scan
```
The static image does **not** include Edge API routes — deploy to Vercel (or proxy separately) for AI, sync, and community gardens.

### Testing

Vitest covers growth/stage math, unlock currencies, trait slots, IndexedDB blob paths, local-user migration, LLM client fallbacks, and protocol routing.

| Command | Purpose |
|---------|---------|
| `npm test` | Single run (578 tests) |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | v8 coverage report |
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
### Vercel deployment

Static SPA (`dist/`) plus three Edge routes. Pushes to **`main`** run typecheck, lint, **578 tests**, coverage, build, and bundle-size gate.

| Route | Required env | Behavior without it |
|-------|--------------|----------------------|
| `/api/llm` | `ANTHROPIC_API_KEY` | Tone → peaceful; reflections use fallback copy |
| `/api/sync` | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Header toggle shows unavailable; local-only |
| `/api/gardens` | `DATABASE_URL` (Neon Postgres) | 503; Explore tab stays on mock data |

**Sync semantics**: opt-in via preferences; debounced push (~1.5 s); **last-write-wins**; **1 MB** document cap; photos/audio never leave IndexedDB.

**Local identity**: no sign-up — a **LocalUser** UUID and display name are created on first visit and stored at `memorygarden:user`. Clearing site data resets the garden.

### Privacy & data
- **Local-first** — structured fields in scoped localStorage; blobs in IndexedDB.
- **AI payloads** — truncated text only (≤4 000 chars per request); reflections may quote short neighbor snippets.
- **Export** — full-garden JSON from settings (`Ctrl/Cmd+Shift+E` shortcut).
- **Share links** — generate read-only copies in KV; collaborative invites expire after seven days.

### Docker static hosting
`docker compose up --build` serves the SPA on **port 8080** with gzip and `/healthz`. Edge routes are **not** in the image — point users at a Vercel deployment for AI/sync/community features.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Wire `/api/gardens`** — Replace Explore mock gardens with Neon-backed community spaces (join, water, reflect).
- **Server-backed sharing** — Move share links and collaborative gardens off pure local KV for multi-device access.
- **Offline PWA** — Add a service worker for install lifecycle and cached shell (manifest and protocol handlers already ship).
- **AI plant imagery** — Generate art from the six style presets (watercolor, botanical, pixel, oil, studio-ghibli, photorealistic).
- **Keyboard search** — Register `Ctrl/Cmd+K` (descriptor exists; handler not wired).
- **Export & print** — Higher-fidelity PDF and poster layouts from Bloom Wall and timeline.
- **Accessibility & i18n** — Audit canvas, modals, and keyboard flows; extract copy for translation.
- **Performance at scale** — Canvas virtualization and asset prioritization for 500+ plants.
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Do I need an account?**  
No. A **LocalUser** profile is created automatically in your browser. GitHub Spark environments may expose `window.spark.user()`, but core flows work offline and anonymously.

**Where does my data live?**  
Scoped **localStorage** for structured fields and **IndexedDB** for photos/audio. Optional cloud sync pushes metadata only (when KV is configured). Clearing site data removes everything locally.

**Are photos sent to the AI?**  
No. `/api/llm` receives text prompts only (max 4 000 characters). Reflections may include short snippets from nearby memories.

**Which models run in production?**  
`/api/llm` → **Anthropic**: `claude-haiku-4-5-20251001` for classification, `claude-sonnet-4-6` for reflections. Missing `ANTHROPIC_API_KEY` returns 503 and the client falls back gracefully.

**What are the unlock currencies?**  
**Dew** (plant + reflect), **sunlight** (revisit old memories), **pollen** (cluster tending), **starlight** (achievements). Spend dew to re-roll plant genetics (5 dew per roll).

**Does it work offline?**  
Planting, tending, and browsing work offline. AI, sync, and community APIs need network. There is no service worker yet, so reinstalling the PWA does not cache the app shell.

**How do I reset or export?**  
Export from settings (or `Ctrl/Cmd+Shift+E`). To start fresh, clear site data for the origin in your browser.

**How do I contribute?**  
GitHub issues and pull requests on this repository. Run `npm test` (578 cases) and `npx tsc --noEmit` before opening a PR.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
