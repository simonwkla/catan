# Catan texture pack

This asset set recreates the terrain art used by the English-language fifth edition of Catan. The base-game terrain comes from the 2015 Mayfair printing; sea and gold-field artwork comes from the matching fifth-edition Seafarers set. The runtime pack is registered as `catan` and shown as **Catan**.

## Contents

The pack contains 22 distinct illustrations across all eight terrain types:

- 1 water
- 1 desert
- 4 pasture (sheep)
- 4 forest
- 4 fields (grain)
- 3 mountains (ore)
- 3 hills (clay)
- 2 gold fields

`source/` preserves the reference scans unchanged. `enhanced/` contains faithful high-resolution digital remasters which remove photographed lighting and surface artifacts while preserving each illustration's composition. `tiles/` contains the 384 × 444 RGBA PNG masters. Compact WebP runtime files live in `artifact/catan/public/textures/catan-fifth-edition/tiles/`.

All runtime tiles are genuinely point-up, use transparent corners, and need no CSS rotation. A radial hex remap changes the complete flat-top geometry—including all six edges and the land rim—into point-up geometry without tilting the scene inside. The sea artwork intentionally runs to every hex edge and has no beige or brown land border.

## Rebuild and validation

From the repository root:

```sh
python3 assets/catan-fifth-edition/prepare_texture_pack.py
python3 assets/catan-fifth-edition/prepare_texture_pack.py --check
```

The deterministic build validates source hashes, creates the PNG and WebP outputs, and regenerates the light and dark QA contact sheets. Source provenance, transformations, dimensions, and output hashes are recorded in `source-manifest.json` and `manifest.json`. The reproducible image-generation direction is retained in `prompts/faithful-remaster.md`.
