# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, browser-based garden for the moments that matter. Plant a memory with a photo and a few words, return to water and reflect, and watch it grow through eight organic stages on an infinite canvas—no account signup, no feed, no rush. A **LocalUser** identity (`getLocalUser()` in `src/lib/local-user.ts`) is created on first visit and scopes all data to your device. Memories persist via **`useMemoriesKV`** (`src/hooks/use-memories-kv.ts`): structured fields in namespaced **localStorage**, with photos and audio stored in **IndexedDB** so large blobs never blow string quotas.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Eight stages (`seed → sprout → seedling → young → bud → bloom → mature → elder`) advance with visits, reflections, and time; growth logic lives in `src/lib/growth-logic.ts` and `src/lib/garden/stage.ts`.
- **Reflect emotions** — Five **EmotionalTone** values (`happy`, `reflective`, `bittersweet`, `peaceful`, `nostalgic`) steer variety, OKLCH palettes, and ambient **weather** (six moods: sunny, mist, rain, rain-sun, golden-haze, partly-cloudy).
- **Earn and spend** — Four garden currencies (**dew**, **sunlight**, **pollen**, **starlight**) from planting, revisiting, reflecting, and achievements; spend starlight on cosmetic rerolls and unlock **18** trait items across **five slots** (palette, pattern, adornment, accent, aura).
- **Encourage reflection** — “Water & Reflect” deepens each plant; **Garden AI** offers brief, poetic prompts when `/api/llm` is configured.
- **Create connections** — **Cross-pollinate** links two memories on the canvas; **Memory Clusters** and spatial proximity surface themes; **Dream-a-Plant** and the **Storage Shed** (`src/lib/garden/shed-storage.ts`) let you sketch hybrid genomes and plant them later.
- **Celebrate milestones** — **7 achievements** (First Reflection through Elder Grove) award bonus starlight as your tending habits compound.
- **Adapt to seasons** — Day/night, season, and derived garden weather shift light, particles, and optional ambient audio (`GardenAmbientLayer`, `ambient-garden-engine`).
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
| View | Role |
|------|------|
| **Garden** | Infinite pan/zoom canvas (`GardenCanvas`) — primary tending surface |
| **Timeline** | Chronological path through every planted moment |
| **Clusters** | AI- and rule-assisted thematic groupings (`MemoryClusters`) |
| **Explore** | Discovery-oriented browse (`ExploreView`) |
| **Bloom Wall** | Gallery spotlight for memories at bloom and beyond |

### 🌿 Plant & Tend Memories
- **Planting** — Photo (validated ≤ **10 MB**), text (≤ **2,000** chars), date, optional location (≤ **200** chars) and audio (`PlantMemoryModal`, `src/lib/validation.ts`).
- **Tending** — Revisits and reflections increase visit counts and advance stages; **Fertilizer Boost** offers three tiers (Garden Boost, Premium, Legendary) with distinct particle effects.
- **Cross-pollinate** — Link two memories from the garden or memory card for shared thematic threads.

### ✨ AI-Powered Insights
- **Emotional tone** — Classification via `getLLMProvider()` → `POST /api/llm` (`kind: classify`, Haiku) with graceful fallback when AI is off.
- **Garden AI** — Reflections and neighbor-aware prompts (`kind: reflect`, Sonnet); never sends image bytes.
- **Memory Clusters** — Group cards by mood, time, or proximity for alternate browsing.

### 🎨 Cosmetics & Unlocks
- **Trait unlocks** — Palettes, patterns, adornments, accents, and auras earned through play (`unlock-system.ts`, `GardenUnlocks`).
- **Plant genetics** — Deterministic visual variation per memory seed (`generatePlantGenetics`).
- **Dream-a-Plant / Storage Shed** — Hybrid genomes saved as shed seeds and planted on the canvas when ready.

### 👥 Collaboration & Sharing
- **Community gardens** — Optional **`/api/gardens`** Edge routes backed by **Neon Postgres** when `DATABASE_URL` is set; otherwise community UI degrades cleanly.
- **Private sharing** — Link-based shared memory views and invite flows when enabled in settings.

### 🌓 Living Atmosphere
- **Day / night** — Canvas and UI follow local time (`day-night.ts`).
- **Seasonal mood** — Season-aware gradients and scenery.
- **Ambient sound** — Web Audio engine keyed to season, time, and weather (respects reduced-motion preferences).

### ⌨️ Power user affordances
- **Keyboard shortcuts** — `?` opens the cheat sheet (`KeyboardShortcutsPanel`); **`cmdk`** powers a command palette component (wired for quick actions).
- **Protocol handlers** — PWA manifest registers `web+memorygarden`, `web+plantmemory`, and `web+viewmemory` deep links.
- **PWA shell** — `public/manifest.json` supports install, share target, and protocol handlers; **no service worker yet** (offline cache is on the roadmap).
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy React SPA tuned for organic motion and local-first persistence.

### Frontend stack
| Layer | Choice |
|-------|--------|
| UI | **React 19.2** + **TypeScript ~6** |
| Bundler | **Vite 8** (`@vitejs/plugin-react-swc`) |
| Styling | **Tailwind CSS 4** + OKLCH theme tokens |
| Motion | **Framer Motion 12** |
| Components | **Radix UI** primitives under `src/components/ui/` |
| Commands | **cmdk** (shadcn `Command` wrapper) |
| Charts / 3D | **recharts**, **three** (select features) |

### Persistence & sync
- **`useKV` / `readRaw` / `writeRaw`** (`src/lib/storage.ts`) — per-LocalUser keys in localStorage.
- **`useMemoriesKV`** — transparent **IndexedDB** blob store (`idb://` refs) for photos and audio.
- **Cloud sync** — Optional `GET/POST /api/sync` to Vercel KV / Upstash (`KV_REST_API_*`); **last-write-wins**, **1 MB** document cap (**413** if exceeded); photos stay on-device.

### AI client chain
`getLLMProvider()` (`src/lib/llm-client.ts`) resolves in order:
1. HTTP **`fetch('/api/llm')`** → Vercel Edge → **Anthropic** (`ANTHROPIC_API_KEY` server-side only).
2. Legacy **`window.spark.llm`** when the GitHub Spark SDK is present.
3. Static empty fallback so the garden never crashes when AI is unavailable.

Models in `api/llm.ts`: **`claude-haiku-4-5-20251001`** (classify), **`claude-sonnet-4-6`** (reflect).

### Edge API routes (Vercel)
| Route | Purpose | Required env |
|-------|---------|--------------|
| `/api/llm` | Anthropic proxy | `ANTHROPIC_API_KEY` |
| `/api/sync` | Per-user JSON document | `KV_REST_API_URL`, `KV_REST_API_TOKEN` |
| `/api/gardens` | Community garden CRUD | `DATABASE_URL` (Neon) |

### Sub-projects & agents
- **Volatility Sentinel** (`volatility-sentinel/`) — Standalone Python CoinGecko agent; CI runs `pytest` separately from the Vite app.
- **Swarm Micro-Forge** (`agents/micro_forge/`) — Python micro-agents for roadmap/guardian scans; `docker compose --profile agents run --rm micro-forge` or GitHub **agent-evolution** workflow.

### Containerized static hosting
- **Dockerfile** — Node 22 build → **nginx 1.27** on **:8080** with **`/healthz`** healthcheck.
- **`docker compose`** — Production SPA, optional **dev** profile (Vite on **5173**), **agents** profile for Micro-Forge.
- Static images **do not** bundle Edge functions; self-hosted deploys need separate API hosting or accept AI/sync/community fallbacks.

### Quality gate
**578** Vitest assertions across **22** test files (growth, storage, LLM client, unlocks, validation, protocol router, and more). CI on `main`: typecheck, lint, test + coverage, build, security audit, bundle-size budget (400 KB/chunk), pnpm lockfile drift, Volatility Sentinel.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js 20+** (CI uses 20; Docker build uses 22)
- **npm** (repo ships `package-lock.json`; `pnpm-lock.yaml` validated in CI)

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
Vite dev server — default **http://localhost:5173**.

For AI locally, run on **Vercel** (`vercel dev`) or proxy `/api/llm` yourself; plain Vite has no Edge routes.

### Production build & preview
```bash
npm run build    # → dist/
npm run preview  # serve dist/ locally
```

### Quality checks
```bash
npm run lint
npm test              # vitest run — 578 tests
npm run test:watch
npm run test:coverage
```

### Docker workflows
```bash
docker compose up --build                    # nginx SPA → :8080, health /healthz
docker compose --profile dev up dev          # Vite in container → :5173
docker compose --profile agents run --rm micro-forge   # Micro-Forge report
```

### Environment variables (local / Vercel)
| Variable | Where | Effect |
|----------|-------|--------|
| `ANTHROPIC_API_KEY` | Server (Vercel) | Enables `/api/llm` |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Server | Enables `/api/sync` |
| `DATABASE_URL` | Server | Enables `/api/gardens` (Neon) |
| `MEMORYGARDEN_PORT`, `VITE_PORT` | Docker Compose | Host port overrides |

Pushes to **`main`** run the full CI pipeline (`npm ci`, typecheck, lint, test, build).
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
### Vercel (recommended)
1. Connect the GitHub repo; build command **`npm run build`**, output **`dist/`**.
2. Set server env vars above; redeploy after changes.
3. **`vercel.json`** — SPA rewrite to `index.html` plus CSP headers for scripts, fonts, and GitHub API connect-src.

Without keys, Edge routes return **503** and the client stays in **local-only** mode with honest UI (e.g. sync control backs off instead of pretending).

### Cloud sync semantics
- One JSON document per LocalUser id (`mg:user:<id>`).
- **LWW** on `updatedAt`; structured memory fields sync; **`photoUrl` / audio** remain IndexedDB-only on each device.
- Payload **> 1,000,000** characters → **413 Document too large** — trim reflections or export/archive older entries.

### Self-hosted static
- Use the **Docker/nginx** path or any static host of `dist/`.
- Edge APIs must be deployed separately (Vercel functions, custom proxy, or omitted).
- **Do not** commit secrets; browser bundle never includes API keys.

### Privacy controls
- **Export garden** — Full portable archive from settings (`ExportGarden`).
- **Reset local data** — Clears scoped storage and IndexedDB blobs for the current LocalUser.
- **AI** — Prompts use truncated text; reflections may include short neighbor snippets — not photos or PII beyond what you typed.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Near-term directions aligned with the codebase and open issues:

- **Community gardens** — Richer invites, presence, and conflict-safe merges when Neon-backed `/api/gardens` is live everywhere users expect it.
- **Offline & PWA** — Service worker + cache strategy (manifest and share target exist today without offline sync).
- **Command palette** — Promote **cmdk** to a global **Ctrl/Cmd+K** launcher across views and settings.
- **Export & print** — Higher-fidelity PDF/poster flows from Bloom Wall and Timeline.
- **Accessibility & i18n** — Canvas focus rings, screen-reader paths for modals, keyboard-only tending; extract copy for translation.
- **Performance at scale** — Continue canvas virtualization and asset prioritization for **500+** plants.
- **AI imagery** — Optional generative plant art (`AIPlantRenderer` experiments) behind explicit opt-in and cost guards.
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Do I need an account?**  
No. A random **LocalUser** (friendly name + UUID) is stored in `localStorage`. Cloud sync keys off that same id when KV is configured.

**Where do photos live?**  
IndexedDB via `useMemoriesKV`; only `idb://` references sit in the synced JSON document.

**What are dew, sunlight, pollen, and starlight?**  
In-garden currencies from tending actions and achievements (`unlock-system.ts`). Starlight pays for cosmetic rerolls and marks milestone progress.

**Why does sync say unavailable?**  
`/api/sync` returns **503** without `KV_REST_API_*`, or **413** if your metadata document exceeds **1 MB**. Photos are not the usual culprit — long text/reflection history is.

**Which models run in production?**  
`/api/llm` uses **claude-haiku-4-5-20251001** for classification and **claude-sonnet-4-6** for reflections. Spark dev environments may still use `window.spark.llm` as a fallback.

**Are photos sent to the AI?**  
No. Only text (and brief neighbor context for reflections).

**How tested is the app?**  
**578** tests in **22** files (`npm test`), plus Python tests for Volatility Sentinel and Micro-Forge in CI.

**How do I contribute?**  
Open issues and pull requests on [github.com/kwizzlesurp10-ctrl/memorygarden](https://github.com/kwizzlesurp10-ctrl/memorygarden).
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
