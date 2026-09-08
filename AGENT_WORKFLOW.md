# AGENT_WORKFLOW.md — MemoryGarden AI Coding Agent Protocol

**Version**: 2026-05-21 | **Status**: Active | **Owner**: Local AI Integrations + Maintainer

This document is the single source of truth for how AI coding agents (GitHub Copilot Coding Agent, Claude via Cursor/CLI, Gemini, or custom via mcp/iflow) must operate on this repository. It turns GitHub into a semi-autonomous maintenance and evolution system for the calm, local-first emotional memory garden.

## Core Principles (Non-Negotiable)
- **Calm & Local-First First**: Every change must preserve the serene UX, localStorage/IndexedDB primacy, optional live pair, and optional Vercel KV. No breaking changes to planting/tending flow without explicit evolution request.
- **Evidence-Driven**: Agent must read and cite CLAUDE.md, GEMINI.md, PRD.md, TEST_COVERAGE_SUMMARY.md, EDGE_CASE_VERIFICATION.md, and current test reports before acting.
- **Draft PRs Only**: All code changes via draft PRs. Human review required before merge. Never force-push main.
- **Test & Verify**: Run `npm test`, `npm run test:coverage`, lint, typecheck, and bundle-size checks. Add or update tests for changed logic (especially growth, storage, LLM fallback).
- **Vercel Compatibility**: Changes must not introduce new runtime deps that break the Vite build, Edge functions, or AI SDK `/api/llm` fallback.
- **Transparency**: Every PR description must include: 1) Problem/Goal, 2) Agent reasoning trace (high-level), 3) Risks & second-order effects, 4) How to test.

## Bug Handling Workflow (Issue → Draft PR)

1. **Triage Trigger**:
   - New issue labeled `bug` (or created via bug_report.yml template).
   - Recommended: Assign to `@copilot` (enables GitHub Copilot Coding Agent — runs in GitHub Actions, produces draft PR).
   - Alternative: Comment `/copilot investigate and fix` or use Claude in Cursor with this repo open.

2. **Agent Actions** (mandatory order):
   - Read the full issue + linked comments.
   - Read relevant sections of CLAUDE.md (tone, constraints), PRD.md (core loops), and test reports.
   - Use code search / grep to localize (focus on src/ for garden logic, api/ for LLM, lib/storage*).
   - Reproduce mentally or via test commands.
   - Propose minimal, surgical fix.
   - Write/update tests (Vitest) that would have caught it.
   - Run full CI-equivalent locally or note expected CI outcome.
   - Open **draft PR** with title `[AGENT] Fix: ...` and detailed body per principles.

3. **Human Gate**: Maintainer reviews, tests in preview, merges or requests changes. Agent may be re-assigned for iterations.

4. **Post-Merge**: Agent (or workflow) may comment on original issue with resolution summary and link to PR.

**Failure Mode Handling**: If agent cannot reproduce or fix is high-risk, it must comment on issue with findings + request human clarification instead of forcing a bad PR.

## Evolution Workflow (Proactive Improvement)

1. **Trigger**:
   - Scheduled Evolution Sentinel (see below) or manual issue created via evolution_request.yml.
   - Labeled `evolution` + priority.
   - Or maintainer comment: "@copilot propose evolution for [goal from PRD]".

2. **Agent Mandate**:
   - Align to PRD.md roadmap, MASTER_SOCIAL_ROADMAP.md, and current metrics (bundle size, coverage gaps, edge case reports).
   - Prioritize: low-risk refactors, test hardening, accessibility, performance (canvas virtualization), seasonal/3D enhancements that feel alive, without new heavy deps.
   - Produce **incremental, reviewable** draft PR(s) — one focused change per PR preferred.
   - For larger evolutions: break into phases and open tracking issue + linked draft PRs.

3. **Scheduled Evolution Sentinel** (GitHub Action supported):
   - Weekly or on main merge: Agent (or human + agent pair) reviews recent coverage, bundle reports, TODOs/FIXMEs, and PRD gaps.
   - Creates or updates a pinned "Evolution Backlog" issue with prioritized proposals.
   - Agent can be prompted to tackle top item.

4. **Success Metrics for Evolution**:
   - Improved test coverage or reduced tech debt without UX regression.
   - Measurable calm/ delight (qualitative) or perf (quantitative).
   - Preserves Spark template compatibility and Vercel deploy speed.

## Tooling & Context the Agent Must Use

- **Primary Context Files** (read first):
  - `CLAUDE.md` — Core voice, constraints, coding style for Claude-class models.
  - `GEMINI.md` — Gemini-specific adaptations.
  - `PRD.md` — Product requirements, core loops, non-negotiables.
  - `TEST_*` and `EDGE_CASE_*` reports — Known fragile areas.
  - `package.json`, `vite.config.ts`, `vercel.json` — Dependency and deploy reality.

- **Runtime Verification**: `npm run lint && npm run test && npm run build` (or equivalent in agent env).

- **Git Hygiene**: Create feature branch from main, commit with clear messages, push, open draft PR. Never commit directly to main.

- **For Custom/Local Agents** (Cursor, Aider, Claude Code, SWE-agent style): Use the above files + this protocol. Prefer tools that edit via search/replace or structured diffs.

## GitHub Copilot Coding Agent Specifics (Recommended Default)

- Enable in repo settings if not already.
 - Assign issue → Copilot spins up Actions runner, explores codebase with semantic search, iterates, opens draft PR.
- Works best on well-scoped, tested areas (this repo's test suite + reports make it strong).
- Cost: Premium requests per session (monitor usage).
- Best for: Bug fixes, small refactors, test addition, doc updates.

## Custom Agent / MCP / Local Orchestration

This repo's `agents/` directory and volatility-sentinel example show patterns for custom Python/ agentic tools. For advanced evolution, integrate via GitHub Actions (with secrets for LLM keys) or local Cursor + Claude 4 / GPT-5.5 class models following this protocol exactly.

## Metrics & Continuous Improvement

- Track: % of bugs closed via agent PRs, time-to-first-draft-PR, merge rate, post-merge regressions (rare by design).
- Evolution velocity: Number of roadmap items advanced per month.
- Feedback loop: After merge, update this file or CLAUDE.md if new patterns emerge.

## Risks & Mitigations

- **Over-automation / Hallucinated fixes**: Strict draft + human review + test gates.
- **Cost creep**: Scope tasks; use cheaper models for triage, premium for implementation.
- **Context drift**: Re-read core docs every major task.
- **Spark/Vercel breakage**: Explicit compatibility check in every PR description.

**This protocol turns MemoryGarden into a living, agent-augmented system that stays true to its calm, memory-tending soul while evolving rigorously.**

— Profundus Research + Maintainer Team