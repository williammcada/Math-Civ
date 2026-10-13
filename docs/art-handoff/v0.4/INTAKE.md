# Art Intake Record — v0.4 painted illustrations

**Received:** 13 Oct 2026 from William McAda (produced by ChatGPT from this handoff packet)

| Field | Value |
| --- | --- |
| Original upload | `MathCiv-28-Illustrations.zip` (75,659,427 bytes) |
| SHA-256 | `dae804a9f4fbbc4ae935bafcaf181bcd533e0c97e848c59f9d9f7c081185ffe0` |
| Files | 28 PNG, one per shot in `shots.json` (none missing, none extra) |
| Originals stored at | `art-source/v0.4/` (unchanged) |
| Scene size | 1536×1024 (as requested) |
| Portrait size | 1254×1254 (requested 1024×1024; accepted, because they are downscaled anyway) |

## Conversion for the game

- Scenes: centre-cropped from 3:2 to 16:9, resized to 640×360, WebP quality 80 → `public/art/scenes/<SHOT-ID>.webp` (25 files, about 1.6 MB in total).
- Portraits: resized to 96×96, WebP quality 80 → `public/art/PORTRAIT_TORII.webp`, `PORTRAIT_UESUGI.webp`, `PORTRAIT_UKITA.webp`.

## Acceptance review (Claude, contact sheet at full and game size)

| Check | Result |
| --- | --- |
| Matches the painted pixel-art style of v0.3.1 art | Pass: same palette, dithering, rain and lantern treatment |
| Side colours (East navy/white crest, West crimson, Kobayakawa ochre) | Pass |
| No readable text or invented writing in the images | Pass on visual review |
| 16:9 crop keeps the focal subject | Pass for all 25 scenes |
| Portraits read at 96×96 and sit beside existing portraits | Pass |

William's own approval of the art is still to be given when he sees it in the game.
