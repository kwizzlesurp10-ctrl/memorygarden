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

- Every README `id="..."` matches **Initial section order** spelling and appears exactly once.
- Keep Target files scoped to `README.md` until additional docs intentionally receive matching enhancement markers.
- Reorder the numbered list only if the automation priority changes; keep IDs and files in sync.
