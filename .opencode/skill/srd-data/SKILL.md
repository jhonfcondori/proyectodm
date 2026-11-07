---
name: srd-data
description: Use when importing, normalizing or validating SRD monsters, spells, items, classes or rules data into data/srd.
---

# SRD data

- Only use SRD 5.1 (CC BY 4.0) or SRD 5.2 (CC BY 4.0). Never bundle proprietary content.
- Record source, edition, license and attribution in `NOTICE-SRD.md`.
- Normalize to stable JSON with deterministic key order.
- Keep one file per entity type; avoid one giant JSON.
- Include a schema and validate on import.
- Names in English; localized labels live in UI translation files, not in the data.
- Add fixtures and tests for parsing and normalization.
- Do not scrape sites that host non-SRD content.
