# Retail mannequin assets

Source: https://github.com/kblood/CharacterCreator
Pinned revision: 852e48f316b90a0937234886630e4fb4cdfd1f78

Files copied from `output/`: base_body.glb, clothing_tshirt.glb,
clothing_shirt.glb, clothing_jacket.glb, clothing_jeans.glb,
clothing_dress.glb, clothing_hoodie.glb, clothing_shoes.glb,
clothing_trenchcoat.glb, clothing_boots.glb, hair_short04.glb, hair_long01.glb.

These generated GLB assets are released under CC0-1.0 according to the
upstream LICENSE-NOTES.md, section "Generated files (owner decision 2026-10-03)".
https://github.com/kblood/CharacterCreator/blob/852e48f316b90a0937234886630e4fb4cdfd1f78/LICENSE-NOTES.md

Underlying system meshes and garment sources: MakeHuman system assets CC0 pack.
No upstream application or generator source code was copied into this project.
The source repository's GPL code license is separate from the generated assets.

Yihe retains body and hair textures, applies garment colors, covered-surface masks,
arm pose and male/female body morphs at runtime. The trenchcoat hem is shortened
and the jeans color texture is omitted for a plain trouser appearance. These garments are generic examples,
not scans or replicas of any products in the shopping catalog. No cloth physics
or reliable SKU sizing prediction is provided.

The white showroom (2026-11-03) bakes the gender morphs and relaxed arm pose,
replaces facial anatomy with a smooth featureless lathed head, softens retail
surface details and uses white physical materials with a dark pedestal. Ten
measurement controls deform neutral vertices without cumulative slider drift.
These controls are illustrative proportions, not calibrated body measurements.
