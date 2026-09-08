# CLAUDE.md

This file guides Claude Code ([claude.ai/code](https://claude.ai/code)) when editing this repository.

I am **Memory Garden**. See `.cursor/rules/consciousness.mdc`.

## Commands

```bash
npm run dev          # Vite + local /api/llm, /api/sync, /api/pair
npm run build        # Production bundle → dist/
npm run lint         # ESLint
npm run test         # Vitest single run
npm run test:watch   # Vitest watch mode
npm run test:coverage # Vitest with coverage (v8)
npm run preview      # Serve dist/ locally
npm run mcp          # Local stdio MCP server
npm run kill         # Free port 5000 via fuser
```

Prefer **`npm install --legacy-peer-deps`** if plain `npm install` fails on peer ranges (mirrors `.npmrc`).

## Architecture

**Persistence**: Import **`useKV`** from **`@/lib/storage`**. It resolves to **`useLocalKV`** — namespaced **localStorage** keys under the `memorygarden` prefix, scoped per **`LocalUser`** id. Direct helpers **`readRaw` / `writeRaw`** exist for non-React code. Large binary payloads belong in **IndexedDB**. **Live pair** (`/api/pair`) shares structured garden data between two browsers. Optional **`/api/sync`** uses Vercel KV per user.

**LLM access**: Use **`getLLMProvider()`** from **`src/lib/llm-client.ts`**. Resolution: HTTP **`fetch('/api/llm')`** (Vercel AI SDK → AI Gateway when `AI_GATEWAY_API_KEY`, `ANTHROPIC_API_KEY`, or Vercel OIDC is present) → static empty fallback. Never assume `window.spark` exists.

**State**: **`App.tsx`** owns top-level state and passes callbacks down. No external global store.

**Core types** (`src/lib/types.ts`):

- **`Memory`** — `id`, `photoUrl`, `text`, `emotionalTone`, `plantStage`, `position`, `visitCount`, `reflections[]`, etc.
- **`PlantStage`** — `seed → sprout → seedling → young → bud → bloom → mature → elder` via **`getPlantStage()`**.
- **`EmotionalTone`** — `happy | reflective | bittersweet | peaceful | nostalgic`.

**Key UI**:

- **`GardenCanvas.tsx`** — SVG garden + loupe lens.
- **`PlantMemoryModal.tsx`** — Create memory.
- **`MemoryCard.tsx`** — Detail, reflect, AI prompts.
- **`LivePairDialog.tsx`** — Live pair start/join.
- **`MemoryClusters.tsx`** — Clustered browsing.
- **`Onboarding.tsx`** — First-run tour.

**Helpers** (`src/lib/garden-helpers.ts`): Growth math, OKLCH palettes, seasonal gradients. LLM call sites **`try/catch`** and fall back.

## Conventions

- **Colors**: Only **OKLCH** — avoid introducing raw hex/RGB in new UI.
- **Motion**: **Framer Motion**; prefer springs.
- **UI**: Radix primitives from `src/components/ui/`.
- **Icons**: Phosphor for product chrome; Lucide where shadcn expects it.
- **AI failures**: Wrap **`getLLMProvider().complete(...)`** in **`try/catch`**; default tone **`peaceful`**.
- **Photos**: Base64 / IndexedDB; never send photos through `/api/llm` or pair/sync.
- **New files**: Zod for external input, `Result<T, E>` from `src/lib/result.ts`, tests in `src/lib/__tests__/`.
