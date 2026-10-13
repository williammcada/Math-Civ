# Math Civ v0.4 — Art Handoff Packet for ChatGPT

**Prepared:** 13 Oct 2026 · **For:** ChatGPT image generation · **Owner:** William McAda
**Governing spec:** [`docs/change-specs/v0.4.md`](../../change-specs/v0.4.md), §3.1 and §6.4
**Source baseline:** `williammcada/Math-Civ @ f2600f8`, `PLAY-SEKIGAHARA-0.3.1.html`

## What ChatGPT is making

28 painted pixel-art images for the v0.4 story scenes. They must match the game's existing art: title screen, council plate, convoy, endings and the eight portraits.

| Group | Images | Priority |
| --- | --- | --- |
| Chapter scenes (Ch 1–4) | 13 | P0 |
| Battle scenes | 7 | P0 (Kobayakawa, Dawn) / P1 (rest) |
| Crisis plates (replacing placeholders) | 5 | P1 |
| New portraits | 3 | P0 (Ukita) / P2 (Torii, Uesugi) |

**Not in this packet:** the campaign map. William approved the code-drawn map on 13 Oct 2026, and Claude builds it in code. `references/MAP-approved-code-drawn.png` is included only so ChatGPT knows the geography the scenes must agree with.

**Placeholders this replaces:** in v0.3.1, the Chapter 2, 3 and 4 plates and all five crisis plates are the same placeholder image with a label stamped on it. Only the Chapter 1 council plate, the convoy, the title, the council strip, the endings and the portraits are finished art.

## Files in this packet

| File | Use |
| --- | --- |
| `STYLE-GUIDE.md` | The style rules and the **style anchor** text pasted with every request |
| `SHOT-LIST.md` | One ready-to-paste prompt per image, with file name, history notes and checks |
| `shots.json` | The same list in machine-readable form, used by Claude when wiring scenes |
| `references/REF-01…REF-08` | Existing game art, upscaled without smoothing, as style references |
| `references/PORTRAIT_*.png` | The eight existing portraits, for character likeness |
| `references/MAP-approved-code-drawn.png` | Geography reference only (not to be painted) |

## How to run it in ChatGPT (step by step)

1. **Start a new ChatGPT conversation.** Use one conversation per group (Chapter 1, Chapter 2 … Battle, Crises, Portraits), so the style stays fresh and each thread stays short.
2. **Attach these reference images** at the start of every conversation:
   - `REF-01_title-war-council.png`
   - `REF-03_tokaido-convoy.png`
   - `REF-05_ending-bad.png`
   - plus `REF-02_council-interior.png` for interior scenes, or `REF-08_portrait-sheet.png` for portraits and any shot with a named character.
3. **Paste the "Opening message" block** from `STYLE-GUIDE.md` and send it. Wait for ChatGPT to confirm the style.
4. **Paste one shot prompt at a time** from `SHOT-LIST.md`, for example the block under `CH3-P2`. Generate one image per message.
5. **Check the image** against that shot's "Accept if" line and the style checklist in `STYLE-GUIDE.md`. If it fails, reply with the matching fix line from the style guide's "Common fixes" (for example "Remove all text and lettering"), and regenerate.
6. **Download the accepted image** at full size (PNG). Rename it to the shot's file name exactly, e.g. `CH3-P2_fushimi-burning.png`.
7. **Return the files** by uploading them to the repository folder `art-source/v0.4/` in GitHub (instructions below), or attach them in a chat with Claude.

### Uploading the finished images to GitHub (web interface)

1. On your computer, make a folder named `art-source`, and inside it a folder named `v0.4`. Put the renamed PNGs in `v0.4`.
2. Open `https://github.com/williammcada/Math-Civ` in Chrome or Edge.
3. Click **Add file → Upload files**.
4. Drag the whole `art-source` folder onto the page. GitHub keeps the folder structure, so the files land in `art-source/v0.4/`.
5. In the commit box, write `Add Math Civ v0.4 scene art (batch N)`, choose **Commit directly to the main branch**, and click **Commit changes**.

If that is awkward, attach the PNGs in a chat with Claude instead; Claude will place and commit them.

## Delivery rules

- **Format:** PNG, landscape **3:2 (1536×1024)** for scenes and plates; square **1024×1024** for portraits. Do not resize or compress; Claude does the final processing.
- **No text anywhere:** no letters, kanji, captions, signatures, watermarks, borders, frames or UI.
- **Keep the subject inside the central safe area** (see `STYLE-GUIDE.md`): the game crops 3:2 to 16:9 and slowly pans and zooms.
- **One image per file name.** For a retake, keep the same name and replace the file.

## What Claude does after delivery

1. Crops each scene to 16:9, reduces it to the game's pixel scale (640×360), quantizes the palette lightly to sit with the existing art, and saves WebP (target ≤ 60 KB each).
2. Crops portraits to the 96×96 bust format with the same dark ground.
3. Checks each image against its shot's history notes and the style checklist, and lists any retakes needed.
4. Wires the images into the scene player per `shots.json`, and records the art in the v0.4 implementation checkpoint.
