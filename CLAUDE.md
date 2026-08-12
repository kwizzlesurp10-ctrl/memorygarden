# CLAUDE.md

[content-to-enhance id="claude-commands"]
This file guides Claude Code ([claude.ai/code](https://claude.ai/code)) when editing this repository.

## Commands

```bash
npm run dev          # Vite dev server (see vite.config for port; often 5173)
npm run build        # Production bundle → dist/ (Vite; no separate tsc step in npm script)
npm run lint         # ESLint across the project
npm run test         # Vitest single run
npm run test:watch   # Vitest watch mode
npm run test:coverage # Vitest with coverage (v8)
npm run preview      # Serve dist/ locally after build
npm run kill         # Free port 5000 via fuser (script helper)
```

Prefer **`npm install --legacy-peer-deps`** if plain `npm install` fails on peer ranges (mirrors `.npmrc`).
[/content-to-enhance]

[content-to-enhance id="claude-architecture"]

## Architecture

**Persistence**: Import **`useKV`** from **`@/lib/storage`**. It resolves to **`useLocalKV`** — namespaced **localStorage** keys under the `memorygarden` prefix, scoped per **`LocalUser`** id. Direct helpers **`readRaw` / `writeRaw`** exist for non-React code. Large binary payloads belong in **IndexedDB** helpers elsewhere in the stack; do not stuff big Base64 blobs only into localStorage.

**LLM access**: Use **`getLLMProvider()`** from **`src/lib/llm-client.ts`**. Resolution order: HTTP **`fetch('/api/llm')`** (Vercel Edge → Anthropic when `ANTHROPIC_API_KEY` is set) → optional **`window.spark`** SDK if present → static empty fallback. Never assume `window.spark` exists.

**State**: **`App.tsx`** owns top-level state, composes **`useKV`** / memory hooks, and passes callbacks down. No external global store.

**Core types** (`src/lib/types.ts`):

- **`Memory`** — `id`, `photoUrl`, `text`, `emotionalTone`, `plantStage`, `position`, `visitCount`, `reflections[]`, etc.
- **`PlantStage`** — `seed → sprout → bud → bloom → mature → evergreen` via **`getPlantStage()`** and visit/age signals.
- **`EmotionalTone`** — `happy | reflective | bittersweet | peaceful | nostalgic` (from classification).

**Key UI**:

- **`GardenCanvas.tsx`** — Infinite canvas; primary garden view.
- **`PlantMemoryModal.tsx`** — Create memory (photo → Base64, text, date, optional location/audio).
- **`MemoryCard.tsx`** — Detail, reflect, AI prompts.
- **`MemoryClusters.tsx`** — Clustered browsing.
- **`Onboarding.tsx`** — First-run tour.

**Helpers** (`src/lib/garden-helpers.ts`): Growth math, OKLCH palettes, seasonal gradients, and LLM call sites should **`try/catch`** and fall back per conventions below.
[/content-to-enhance]

[content-to-enhance id="claude-conventions"]

## Conventions

- **Colors**: Only **OKLCH** as established in `garden-helpers.ts` and `src/styles/theme.css` — avoid introducing raw hex/RGB in new UI.
- **Motion**: **Framer Motion** for transitions; prefer springs over linear snaps.
- **UI**: Compose **Radix** primitives from `src/components/ui/` instead of bespoke inaccessible controls.
- **Icons**: **Phosphor** (`@phosphor-icons/react`) for product chrome; **Lucide** where shadcn patterns expect it.
- **Tone**: Keep the garden metaphor warm and unhurried—avoid sterile dashboard language.
- **AI failures**: Wrap **`getLLMProvider().complete(...)`** (and related paths) in **`try/catch`**; default tone **`peaceful`** or static copy when the provider throws or returns empty.
- **Photos**: Stored as **Base64 data URLs** inside memory records where applicable; prefer IndexedDB for weight to respect storage quotas.
[/content-to-enhance]
