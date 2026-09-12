# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter: plant each memory like a seed, return to tend it, and watch it grow through eight stages—from **seed** to **elder**—on an infinite canvas. No account required: a **LocalUser** identity is created in your browser on first visit. Earn **dew**, **sunlight**, **pollen**, and **starlight** as you reflect and revisit; unlock palettes and adornments as your garden matures. **Cross-pollinate** two memories into a hybrid plant, or **Dream-a-Plant** from a single idea. The garden’s **weather mood** shifts with the emotional tone of your collection—never rushed, never noisy, always yours.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Eight-stage growth** — `seed → sprout → seedling → young → bud → bloom → mature → elder`, driven by visits, reflections, and time since planting.
- **Five emotional tones** — `happy`, `reflective`, `bittersweet`, `peaceful`, and `nostalgic` steer plant variety, palette, and growth character.
- **Six weather moods** — `sunny`, `mist`, `rain`, `rain-sun`, `golden-haze`, and `partly-cloudy`, derived from the dominant tone across your garden.
- **Four currencies** — **dew** (reflections), **sunlight** (revisiting old memories), **pollen** (cluster tending), and **starlight** (achievements) feed the unlock system.
- **Cross-pollination** — Combine two parent memories into a hybrid plant with blended traits and genetics.
- **Dream-a-Plant** — Describe an idea; the Garden AI (or a local fallback) generates a fantastical hybrid genome with a custom SVG motif.
- **Encourage reflection** — Add notes when you revisit; invite gentle, poetic insights when you ask the Garden AI.
- **Adapt to seasons** — Day/night periods, seasonal gradients, and ambient Web Audio follow real time so the garden stays tied to the world outside the screen.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo (stored as Base64 or IndexedDB `idb://` refs), write about the moment, and watch your memory sprout on the canvas.
- **Tending**: Open memories often to see them advance through eight stages; reflections deepen the story each time you return.
- **Fertilizer Boost**: Three tiers (Garden Boost, Premium, Legendary) accelerate growth with distinct particle effects.
- **Cross-pollination**: Fuse two memories into a hybrid with blended traits, genetics, and a unique plant variety.
- **Dream-a-Plant & Storage Shed**: Generate hybrid genomes from ideas, save seeds, and plant them from the garden shed panel.

### ✨ AI-Powered Insights
- **Emotional tone**: Text is classified (`claude-haiku-4-5`) to steer plant variety, palette, and growth character.
- **Garden AI**: Poetic reflections (`claude-sonnet-4-6`) that connect nearby memories without overwhelming the original voice.
- **Memory Clusters**: Emotional groupings with curved path geometry so you can browse by mood as well as by place.

### 🎨 Five Views
- **Garden**: Infinite pan-and-zoom canvas with animated plants, weather effects, and layered backgrounds.
- **Timeline**: Chronological path through every planted moment.
- **Clusters**: Grouped cards for thematic exploration.
- **Explore**: Browse sample community gardens (UI seeded; server API ready).
- **Bloom Wall**: Masonry gallery spotlight for memories at bloom stage and beyond.

### 🏆 Unlock System
- **18 unlockable items** — palettes, patterns, and adornments earned through tending milestones.
- **7 achievements** — from First Reflection to Elder Grove, each awarding starlight currency.
- **Plant cosmetics** — per-plant trait slots (palette, pattern, adornment, accent, aura) and deterministic genetics.

### 👥 Collaboration & Sharing
- **Community gardens API** (`/api/gardens`) — Neon Postgres backend for public gardens (client wiring in progress).
- **Private sharing**: Share specific memories with link-based access you control.
- **PWA share target**: Receive photos from other apps directly into the planting flow.

### 🌓 Living Atmosphere
- **Day / night**: Four periods (dawn, day, dusk, night) with OKLCH seasonal gradients.
- **Garden weather**: Six mood-driven weather types with particle overlays (rain, mist, sunbeams, golden haze).
- **Ambient Web Audio**: Procedural soundscape driven by season, time, weather, and garden aliveness.

### ⌨️ Power User Affordances
- **Keyboard shortcuts**: Fast navigation and actions (`?` opens the cheat sheet; `E` opens export).
- **Search & filters**: Text search with emotional tone, stage, and date filters on the garden view.
- **Protocol handlers**: Three deep-link schemes — `web+memorygarden://`, `web+plantmemory://`, `web+viewmemory://` — when installed as a PWA.
- **Export**: PNG snapshot, garden-view capture, or multi-page PDF booklet from settings.
- **PWA**: Installable shell with protocol registration (no service worker yet — offline cache is a roadmap item).
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy React app tuned for smooth, organic motion and local-first data.

### Frontend stack
| Layer | Technology |
|-------|------------|
| UI | React 19 + TypeScript 6 |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 (OKLCH palette) |
| Motion | Framer Motion 12 |
| Components | Radix UI + shadcn/ui |
| State | `App.tsx` owns top-level state; no external store |

### Persistence
- **`useKV`** (`@/lib/storage`) — namespaced **localStorage** keys scoped per **LocalUser** id.
- **`useMemoriesKV`** — drop-in hook that offloads photo/audio blobs to **IndexedDB** (`idb://<id>` refs) so large gardens stay under the ~5 MB localStorage quota.
- **Cloud sync** (opt-in) — structured fields only; blobs remain on-device.

### AI provider chain
`getLLMProvider()` resolves in order:
1. **HTTP** — `POST /api/llm` (Vercel Edge → Anthropic; key never reaches the browser).
2. **Spark fallback** — `window.spark.llm` when running inside GitHub Spark.
3. **Static fallback** — empty string so the UI never crashes.

### Edge API routes
| Route | Env vars | Purpose |
|-------|----------|---------|
| `/api/llm` | `ANTHROPIC_API_KEY` | Classification (`haiku`) and reflection (`sonnet`) |
| `/api/sync` | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Per-user metadata sync (last-write-wins, 1 MB cap) |
| `/api/gardens` | `DATABASE_URL` | Community gardens CRUD via Neon Postgres |

All three return **503** when unconfigured; the client degrades gracefully.

### Quality
- **578 Vitest cases** across 22 test files covering growth logic, storage, LLM client, unlock system, and more.
- **CI** — `tsc --noEmit`, ESLint, test + coverage, production build, bundle-size gate (400 KB per JS chunk).

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/`) — Standalone Python agent (CoinGecko); CI runs its pytest suite separately from the Vite app.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js** 20+ (matches CI)
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
   This matches the repo’s `.npmrc` and avoids peer-resolution issues with Vite 8.

### Development
```bash
npm run dev
```
Opens the Vite dev server on port **5173** (configurable in `vite.config.ts`).

### Docker (optional)
```bash
# Production SPA via nginx → http://localhost:8080
docker compose up --build

# Vite dev server with hot reload → http://localhost:5173
docker compose --profile dev up dev

# Micro-Forge agent scan (stdout / CI-style)
docker compose --profile agents run --rm micro-forge
```
Note: Edge routes (`/api/llm`, `/api/sync`, `/api/gardens`) are Vercel-only — the static Docker image has no AI or sync backend.

### Production build
```bash
npm run build
```
Output is written to **`dist/`** for static hosting (Vercel, nginx, etc.).

### Quality checks
```bash
npm run lint          # ESLint
npx tsc --noEmit      # TypeScript (also run in CI)
npm test              # 578 Vitest cases
npm run test:coverage # Coverage report
```

### Preview the production bundle
```bash
npm run preview
```
Serves **`dist/`** locally via the Vite preview server.

### Test coverage highlights
Growth and stage logic, unlock/currency paths, trait genetics, local user identity, IndexedDB blob storage, LLM client provider chain, protocol-router deep links, ambient audio params, and cloud-sync payload stripping.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The production story on **Vercel** is a static SPA plus three Edge routes:

| Route | Required env vars | Behavior when missing |
|-------|-------------------|----------------------|
| `/api/llm` | `ANTHROPIC_API_KEY` | Returns 503; client uses Spark or static fallback |
| `/api/sync` | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Returns 503; sync toggle hidden/disabled |
| `/api/gardens` | `DATABASE_URL` (Neon Postgres) | Returns 503; Explore view shows seeded samples |

### Sync details
- **Opt-in** from the header dropdown; probes `/api/sync` once per session.
- **Last-write-wins** per LocalUser id (`mg:user:<id>` key in KV).
- **1 MB document cap** — photos and audio are stripped before upload; blobs stay in IndexedDB on each device.
- **Debounced push** on memory/preference changes; pull on app load when sync is enabled.

### Identity
No sign-up flow. `getLocalUser()` creates an anonymous **LocalUser** (`id`, generated display name like "GentleGardener") stored in `memorygarden:user`. The same id drives sync and garden membership.

### Deploy
Pushes to **`main`** trigger `npm ci` and `npm run build`. **`legacy-peer-deps`** in `.npmrc` keeps Vite 8 and `@vitejs/plugin-react-swc` compatible. CI also enforces a **400 KB per-chunk** bundle budget.

## Privacy & Data

- **Local-first**: Memories and media default to the browser (localStorage-scoped keys + IndexedDB for blobs). Nothing leaves the device except what you explicitly sync or share.
- **AI payloads**: Classification uses truncated memory text (≤ 4 000 chars); reflections may include short snippets from nearby memories — never photos or account profiles.
- **Export**: PNG snapshot, garden-view capture, or PDF booklet from the Export Garden modal.
- **Clearing data**: Remove site data for the origin in browser settings to wipe localStorage and IndexedDB; cloud sync documents persist in KV until overwritten.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Wire `/api/gardens`** — Replace hardcoded Explore samples with live Neon-backed community gardens (join, plant, water, reflect).
- **Server-backed shares** — Persist share links and visit analytics instead of client-only URL generation.
- **Offline PWA** — Add a service worker and cache strategy so the garden shell works without network.
- **AI plant imagery** — Connect `AIPlantRenderer` / `generatePlantImagePrompt` to an image-generation endpoint for unique plant art.
- **Global search (Ctrl+K)** — Surface the ranked `memory-search` module as a command palette over the full collection.
- **Accessibility & i18n** — Audit canvas, modals, and keyboard flows; extract copy for translation.
- **Performance at scale** — Canvas virtualization and asset prioritization for very large gardens (500+ plants).
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Do I need an account?**  
No. MemoryGarden creates a **LocalUser** in your browser on first visit (random display name + UUID). No email, password, or OAuth required.

**Where does my data live?**  
By default on your device: scoped localStorage for structured data and IndexedDB (`idb://` refs) for photos and audio. Cloud sync of metadata is optional and only active when KV credentials are configured on the server.

**Are photos sent to the AI?**  
No. AI calls operate on text (and brief neighboring context for reflections), not image bytes.

**Which LLM runs in production?**  
`/api/llm` → Anthropic: **`claude-haiku-4-5-20251001`** for classification, **`claude-sonnet-4-6`** for reflections. Spark environments may expose `window.spark.llm` as a secondary fallback.

**What are the unlock currencies?**  
- **Dew** — reflections and planting  
- **Sunlight** — revisiting memories older than 30 days  
- **Pollen** — tending memories near each other  
- **Starlight** — earning achievements (7 available)

**Does it work offline?**  
The garden UI and all local data work offline. AI, cloud sync, and community gardens require network. A service worker for offline shell caching is on the roadmap.

**How do I clear my data?**  
Clear site data for the origin in your browser (localStorage + IndexedDB). Cloud sync documents in KV are not automatically deleted.

**How do I contribute or report an issue?**  
Use GitHub issues and pull requests on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
