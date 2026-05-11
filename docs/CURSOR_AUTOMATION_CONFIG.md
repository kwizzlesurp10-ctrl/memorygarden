# Cursor automation — MemoryGarden

Copy the block below into your Cursor automation prompt on first run. Paths match this repository: narrative lives in `README.md`; extend **Target files** if you add more labeled docs under `docs/`.

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

- Every `id="..."` in README matches one entry in **Initial section order**, same spelling.
- Automation walks IDs in the numbered order; reorder the list if your workflow priority changes.
- If you split docs across multiple files, duplicate the marker pattern and list those paths under **Target files**.
