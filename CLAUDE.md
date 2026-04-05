# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Type-check (noCheck) + Vite build
npm run lint      # ESLint
npm run preview   # Preview production build locally
npm run kill      # Kill process on port 5000
```

No test suite is configured.

## Architecture

**Platform**: This is a GitHub Spark app. The `@github/spark` SDK provides:
- `useKV(key, default)` — persistent key-value storage per user (replaces a database)
- `window.spark.user()` — GitHub-authenticated user info
- `window.spark.llm(prompt, model)` — LLM calls (use `gpt-4o-mini` for classification, `gpt-4o` for generation)

All memory data (including photos as Base64 Data URLs) is stored in the KV store. There is no backend or external API.

**State flow**: `App.tsx` owns all state. It reads/writes `memories` and `preferences` via `useKV`, passes handlers down to child components. No external state library is used.

**Core data model** (`src/lib/types.ts`):
- `Memory` — the primary entity with `id`, `photoUrl` (Base64), `text`, `emotionalTone`, `plantStage`, `position` (x/y on canvas), `visitCount`, and `reflections[]`
- `PlantStage`: `seed → sprout → bud → bloom → mature → evergreen` (computed from age + visit count in `getPlantStage()`)
- `EmotionalTone`: `happy | reflective | bittersweet | peaceful | nostalgic` (classified by LLM on plant creation)

**Key components**:
- `GardenCanvas.tsx` — infinite pannable/zoomable HTML5 Canvas; primary view
- `PlantMemoryModal.tsx` — creation flow (photo upload → Base64, text, date, optional location + audio)
- `MemoryCard.tsx` — detail/tending view; "Water & Reflect" adds a reflection and advances plant stage; "Ask Garden AI" calls the LLM
- `MemoryClusters.tsx` — AI-suggested groupings (secondary view)
- `Onboarding.tsx` — 4-step first-run tour

**Helpers** (`src/lib/garden-helpers.ts`): All growth logic, color mappings (OKLCH), seasonal/day-period background gradients, and AI call wrappers live here.

## Conventions

- **Colors**: Use OKLCH color values as defined in `garden-helpers.ts` and `src/styles/theme.css`. Do not introduce hex/RGB colors.
- **Animations**: Use Framer Motion for all transitions. Spring physics preferred — avoid abrupt or corporate-feeling motion.
- **UI components**: Radix UI primitives wrapped in `src/components/ui/`. Use these; don't add raw HTML equivalents.
- **Icons**: Phosphor Icons (`@phosphor-icons/react`) for app icons, Lucide for shadcn/ui components.
- **Metaphor**: Every feature should feel organic and peaceful. The garden metaphor is load-bearing — avoid anything that feels sterile or transactional.
- **AI fallbacks**: `window.spark.llm` calls must have try/catch with a graceful fallback (default tone `'peaceful'`, or a static reflection string).
- **Photos**: Stored as Base64 Data URLs inside the KV memory objects — no external file storage.
