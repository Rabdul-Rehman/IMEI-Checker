# Manual Image Verification Queue

Generated from the current production image index after safe canonicalization and low-risk conflict resolution.

## Status

- Remaining ambiguous canonical families: **103**
- These are intentionally **not auto-selected**.
- Production should prefer a reviewed canonical mapping when one exists; otherwise existing exact/database fallback behavior remains.
- Never resolve these by fuzzy model-name similarity.

## Queue by brand

Samsung 18; Xiaomi 13; Oppo 12; Motorola 11; Nokia 11; ZTE 9; Infinix 8; OnePlus 7; Realme 4; Lava 2; LG 2; Vivo 2; Caterpillar 1; Nothing 1; Sico 1; Tecno 1.

## Verification workflow

For each family, visually compare every candidate local asset against a reliable product reference. Record only an exact physical-model match. Regional, storage, RAM, carrier and TAC variants may reuse the canonical physical-model image; sibling variants (Pro/Max/Plus/Ultra/Mini/Lite/FE/Fold/Flip) must remain separate.

Do not publish a choice when evidence is inconclusive.
