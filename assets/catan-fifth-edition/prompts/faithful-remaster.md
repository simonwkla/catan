# Faithful fifth-edition remaster prompt

The enhanced masters in `../enhanced/` were produced with the built-in OpenAI image-generation workflow, one image-to-image edit per official tile scan. Each edit used the common prompt below, with only the terrain name, palette, and source-specific landmark list changed.

```text
Use case: precise-object-edit
Asset type: high-resolution digital board-game terrain texture master
Input images: Image 1 is the edit target and exact composition reference.
Primary request: Faithfully remaster this exact fifth-edition CATAN {TERRAIN} terrain hex as a clean high-resolution digital painting. Preserve one-for-one the same {SOURCE-SPECIFIC LANDMARKS}, their relative placements, crop framing, {PALETTE} palette, beige printed bevel/rim, and expressive hand-painted brushwork.
Composition/framing: one centered complete flat-top regular hex, fully visible, same orientation and geometry as the reference.
Lighting/mood: neutral even digital-asset lighting. Remove photographic glare, uneven illumination, cast shadows, scan blur, JPEG noise, and lens softness.
Materials/textures: retain organic gouache/oil-like brush texture and fine illustrative detail; sharpen naturally without becoming photorealistic, glossy, 3D, or vector-flat.
Constraints: change only reproduction quality and exterior background; do not redesign, add, remove, move, mirror, crop, or rotate scene elements; preserve the tile border; use a genuinely transparent exterior if supported, otherwise a solid pure-white exterior; never render a checkerboard pattern; crisp antialiased edge; no halo; remove any scan/archive mark outside the terrain painting; no text; no logo; no watermark; no number token.
```

## Source-specific landmark notes

| ID | Terrain | Landmarks preserved |
|---|---|---|
| `clay-hills-01` | Hills | Rust-red excavation pit, dark mine entrance, timber hoists, ladder, rail cart, workers, exposed strata |
| `clay-hills-02` | Hills | Two quarry pits, timber hoists and scaffolds, rail cart, workers, exposed strata |
| `clay-hills-03` | Hills | Deep excavation, central ridge and track, timber mining structures, cart, workers, exposed strata |
| `desert-01` | Desert | Windswept dune ridges, sparse dead trees, stones, subdued sandy tonal variations |
| `field-fields-01` | Fields | Field shapes, paths, tree, haystack, tiny workers and poses |
| `field-fields-02` | Fields | Field shapes, paths, haystacks, tiny workers and tools |
| `field-fields-03` | Fields | Field shapes, harvested center, haystack, tiny workers and tools |
| `field-fields-04` | Fields | Field shapes, dark farm track, haystacks, workers, distant cattle and shrubs |
| `forest-01` | Forest | Dense mixed canopy, individual tree crowns, trunks, clearings and shadows |
| `forest-02` | Forest | Central path, mixed tree crowns, orange tree, tiny figures and shadows |
| `forest-03` | Forest | Dense canopy, dark foreground trunks, orange foliage, clearings and shadows |
| `forest-04` | Forest | Dense mixed canopy, central opening, individual conifers, trunks and shadows |
| `mountain-01` | Mountains | Jagged ring, dark central basin, pale rock faces, paths, tiny miners and ridge silhouettes |
| `mountain-02` | Mountains | Central massif, misty gorge, narrow waterfall, crags, paths and tiny miners |
| `mountain-03` | Mountains | Dark central face, pale upper cliffs, left ridge path, boulders and tiny miners |
| `sheep-pasture-01` | Pasture | Rolling pasture, upper and lower flocks, rocks, pond and tiny shepherds |
| `sheep-pasture-02` | Pasture | Rolling pasture, right flock, scattered sheep and rocks, darker left slope and shepherds |
| `sheep-pasture-03` | Pasture | Bright pasture, two flocks, diagonal rocky outcrops, open right meadow and shepherds |
| `sheep-pasture-04` | Pasture | Rolling pasture, three sheep groups, central rock, dark upper shrub/tree and shepherds |
| `water-01` | Sea | Open ocean, diagonal wave bands, turquoise highlights and tiny distant ship silhouette |
| `gold-field-01` | Gold field | High waterfall, narrow river, dark left gorge, bright right cliffs, mossy banks and exact bends |
| `gold-field-02` | Gold field | High waterfall, broad river, central rocky island, dark left gorge, bright right cliffs, mossy banks and exact bends |

The occasional white or generated checkerboard exterior is intentionally ignored by the deterministic geometric mask in `../prepare_texture_pack.py`; it never reaches the PNG masters or runtime WebPs.

The sea tile received one targeted follow-up edit: remove only the generated beige rim, extend the existing ocean painting to every hex edge, and keep the waves, palette, geometry, and tiny ship unchanged. This restores the edge-to-edge water treatment visible in the fifth-edition Seafarers reference.
