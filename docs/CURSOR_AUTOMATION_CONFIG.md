# Cursor automation — MemoryGarden

Copy the block below into your Cursor automation prompt on first run. Paths match this repository.

```
=== CONFIGURATION (USER MUST SET ON FIRST RUN) ===

- Target files:
      README.md
      (Optional later: `docs/**/*.md` once those files contain `[content-to-enhance]` blocks — avoid globbing the whole tree until then.)

- Section markers (use these exact delimiters):
      [content-to-enhance id="section-id"]
      [/content-to-enhance]
      (Replace "section-id" with lowercase-kebab-case names from the order list below.)

- Initial section order (exact processing sequence; every id below appears in README.md):
  1. introduction
  2. memory-garden-concept
  3. core-features
  4. how-it-works
  5. usage
  6. configuration
  7. roadmap
  8. faq

=== REPO LAYOUT (reference) ===

- Primary narrative: README.md (all eight sections above).
- Instructions only (no enhancement markers): docs/CURSOR_AUTOMATION_CONFIG.md — do not add this path to Target files unless you intentionally label sections here.
```

## Checklist

- **README markers (automated)**: Run `npm run verify:readme-content-markers` — exits **0** only when open/close counts and `id` order match the list below.
- **README markers (manual)**: `rg '\[content-to-enhance id=' README.md` must list exactly **eight** lines, in this order: `introduction`, `memory-garden-concept`, `core-features`, `how-it-works`, `usage`, `configuration`, `roadmap`, `faq`.
- **Closing tags**: `rg '\[/content-to-enhance\]' README.md` must list exactly **eight** lines (one per open block).
- Every `id="..."` in **README.md** matches **Initial section order** spelling and appears exactly once.
- Reorder the numbered list if your automation priority changes; keep IDs and file sections in sync.
- **PRD.md** and **CLAUDE.md** still carry optional `[content-to-enhance]` blocks for manual or extended runs; add them to Target files only when you want those paths processed.
- After enhancing docs, reconcile any drift with `.cursor/rules` / README “Technical Architecture” if stack docs diverge.
