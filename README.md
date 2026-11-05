# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter: plant each memory like a seed, return to tend it, and watch it grow into something alive on the canvas—never rushed, never noisy, always yours.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Plants advance through stages as you visit and reflect; neglect and care both leave traces you can feel.
- **Reflect emotions** — AI-assisted tone hints shape variety and color so the garden mirrors how each memory feels.
- **Encourage reflection** — Add notes when you revisit; invite gentle, poetic insights when you ask the Garden AI.
- **Create connections** — Spatial proximity and clustering help you notice themes across seasons of your life.
- **Adapt to seasons** — Light, mood, and atmosphere follow real time and season so the garden stays tied to the world outside the screen.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo, write about the moment, and watch your memory sprout on the canvas.
- **Tending**: Open memories often to see them bloom and mature; reflections deepen the story each time you return.
- **Fertilizer Boost**: Garden Boost is free; Premium and Legendary use Stripe Checkout. Growth applies only after webhook-verified payment.

### ✨ AI-Powered Insights

- **Emotional tone**: Text is classified to steer plant variety, palette, and growth character.
- **Garden AI**: Poetic reflections and prompts that connect nearby memories without overwhelming the original voice.
- **Memory Clusters**: Thematic or temporal groupings so you can browse by mood as well as by place.

### 🎨 Beautiful Views
- **Garden**: Illustrated pan-and-zoom canvas with animated plants and layered backgrounds.
- **Walk**: First-person open world — enter the garden gate and walk among your memories.
- **Timeline**: Chronological path through every planted moment.
- **Clusters**: Grouped cards for thematic exploration.
- **Bloom Wall**: A gallery spotlight for memories that have reached full bloom.

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
- **React 19 + TypeScript** — UI and state.
- **Vite** — Dev server and production bundle.
- **Tailwind CSS** — Layout and responsive styling.
- **Framer Motion** — Springs and transitions that feel alive.
- **Radix UI** — Accessible primitives (dialogs, tabs, etc.).
- **Persistence** — `useKV` from `@/lib/storage` scopes data per local user in **localStorage**; large photo payloads use **IndexedDB** so you stay under typical string quotas.
- **AI** — `POST` to **`/api/llm`** (Vercel Edge): prompts go to **Anthropic** with `ANTHROPIC_API_KEY` on the server. The browser never sees the key. If the route is missing or returns `503`, the app falls back gracefully (including optional **GitHub Spark** `window.spark` where present).

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/` in the repo) — Standalone Python agent example (CoinGecko) you run separately from the Vite app; CI exercises it from its own directory.
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

Typical areas covered include growth and stage logic, unlock/currency paths, trait helpers, local user migration, and HTTP LLM behavior.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The production story on **Vercel** is a static SPA plus two Edge routes:

1. **`/api/llm`** — Proxies classification and reflection prompts to Anthropic. Set **`ANTHROPIC_API_KEY`** in the project. Without it, AI features degrade cleanly while the garden keeps working.
2. **`/api/sync`** — Optional metadata sync to **Vercel KV / Upstash** using **`KV_REST_API_URL`** and **`KV_REST_API_TOKEN`**. Photos and audio stay on-device (IndexedDB); only structured fields participate when sync is on.
3. **Stripe one-time purchases** — Fertilizer boosts (Premium / Legendary) and the optional Starlight cosmetic pack use **`/api/payments/*`** (Checkout + webhook fulfillment). See **[PAYMENTS.md](./PAYMENTS.md)** for Price IDs, webhook events, and all required env vars (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price env vars, plus KV for entitlements).

Pushes to **`main`** trigger `npm install` and `npm run build`. **`legacy-peer-deps`** in `.npmrc` keeps Vite 8 and `@vitejs/plugin-react-swc` compatible.

The header **Sync to cloud** control reflects real status and backs off when the API returns **`503`** (no KV), so users are never misled about what is actually syncing.

## Privacy & Data

- **Local-first**: Memories and media default to the browser (localStorage-scoped keys + IndexedDB for blobs). Nothing leaves the device except what you explicitly sync or share.
- **AI payloads**: Classification uses truncated memory text; reflections may include short snippets from nearby memories—never photos or account profiles in those paths.
- **Export**: Full-garden export from settings when you want a portable archive.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Collaboration** — Richer shared-garden invitations, presence, and conflict-safe merges for joint tending.
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
Deployed apps use **`/api/llm`** → Anthropic (see `api/llm.ts`). Spark environments may still expose `window.spark.llm` as a fallback path in client code.

**How do I contribute or report an issue?**  
Use GitHub issues and pull requests on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
