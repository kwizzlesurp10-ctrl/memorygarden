# Cursor automation — MemoryGarden

Copy the block below into your Cursor automation prompt on first run. Paths match this repository.

```
=== CONFIGURATION (USER MUST SET ON FIRST RUN) ===

- Target files:
      README.md
      PRD.md
      CLAUDE.md
      (Optional: `docs/**/*.md` for additional labeled docs — exclude this file unless you add markers here.)

- Section markers (use these exact delimiters):
      [content-to-enhance id="section-id"]
      [/content-to-enhance]
      (Replace "section-id" with lowercase-kebab-case names from the order list below.)

- Initial section order (single pass: README → PRD → CLAUDE; every id exists in exactly one file):
  1. introduction                    (README.md)
  2. memory-garden-concept           (README.md)
  3. core-features                   (README.md)
  4. how-it-works                    (README.md)
  5. usage                           (README.md)
  6. configuration                   (README.md)
  7. roadmap                         (README.md)
  8. faq                             (README.md)
  9. prd-overview                   (PRD.md)
  10. prd-essential-features        (PRD.md)
  11. prd-edge-cases                (PRD.md)
  12. prd-design-direction          (PRD.md)
  13. prd-color-selection           (PRD.md)
  14. prd-font-selection            (PRD.md)
  15. prd-animations                (PRD.md)
  16. prd-component-selection       (PRD.md)
  17. prd-testing-qa                (PRD.md)
  18. claude-commands              (CLAUDE.md)
  19. claude-architecture          (CLAUDE.md)
  20. claude-conventions           (CLAUDE.md)

=== REPO LAYOUT (reference) ===

- README.md — product narrative (ids 1–8).
- PRD.md — product requirements (ids 9–17).
- CLAUDE.md — agent/developer guidance (ids 18–20).
- Instructions only (no enhancement markers in body): docs/CURSOR_AUTOMATION_CONFIG.md — omit from Target files unless you label this file intentionally.
```

## Checklist

- Every `id="..."` in the three target files matches **Initial section order** spelling and appears exactly once.
- Reorder the numbered list if your automation priority changes; keep IDs and files in sync.
- After enhancing CLAUDE.md, reconcile any drift with `.cursor/rules` / README “Technical Architecture” if your stack docs diverge.
