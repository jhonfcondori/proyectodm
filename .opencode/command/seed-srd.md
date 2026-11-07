---
description: Import and normalize SRD data with attribution and validation.
agent: dnd-data
---

SRD data: $ARGUMENTS

1. Confirm the source is SRD 5.1 or 5.2 (CC BY 4.0).
2. Update `NOTICE-SRD.md` with source, edition and attribution.
3. Add normalized JSON under `data/srd/`.
4. Validate with the JSON schema and add fixtures/tests.
5. Keep names in English; localization lives in the UI.
6. Report files added, counts and tests run.
