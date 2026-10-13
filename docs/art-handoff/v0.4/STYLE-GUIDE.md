# Math Civ v0.4 — Style Guide for ChatGPT

The new art must be indistinguishable in style from the existing game art in `references/`. When this guide and a reference image disagree, **the reference image wins**.

## Opening message (paste once at the start of each ChatGPT conversation, with the reference images attached)

```text
You are producing illustrations for "Math Civ: The Road to Sekigahara", an
educational strategy game set in Japan, 1598–1600 (late Sengoku period).
The attached images are existing art from the game. Every new image must
match their style exactly:

STYLE ANCHOR
- Detailed, painterly pixel art, like a late-1990s Japanese historical
  strategy game cutscene. Visible pixel clusters and dithering; no smooth
  digital painting, no vector look, no anime.
- Muted, atmospheric palette: deep indigo and slate blues, wet greys, moss
  and rice-field olive greens, rust and autumn reds, ochre; warm amber
  lantern or fire light as the only strong highlight.
- Weather and atmosphere carry the mood: rain, mist, fog, low cloud, wet
  reflections. Late-day or night light unless the shot says otherwise.
- Realistic proportions. Armored samurai in historically plausible
  1600-era armor; ashigaru foot soldiers in jingasa hats; tall nobori
  banners.
- Eastern (Tokugawa) side: dark navy or blue-black banners with a simple
  white round crest. Western side: crimson-red banners with a simple dark
  round crest. Kobayakawa's men (until they choose a side): ochre-yellow
  banners with a black crest.
- Cinematic composition with a clear focal point, depth from foreground to
  background, readable silhouettes at small size.

ALWAYS
- Landscape 3:2 (1536×1024) unless I ask for a portrait.
- Keep the main subject inside the central area (leave about 12% margin on
  all sides); the game crops to 16:9 and slowly pans.

NEVER
- No text of any kind: no letters, kanji, numbers, captions, signatures,
  watermarks. Crests are simple shapes, never characters.
- No borders, frames, vignettes drawn as frames, UI, or split panels.
- No modern objects, no fantasy creatures, no magic effects, no gore.

Reply "Style locked" and wait for my first shot.
```

## Style checklist (check every image before accepting)

| Check | Look for |
| --- | --- |
| Pixel art | Visible pixel clusters and dithering at 100% zoom; not a smooth painting |
| Palette | Muted blues, greys, olives, rust; one warm light source; no neon or saturated purple |
| Atmosphere | Rain, mist or fog present unless the shot specifies clear weather |
| Side colours | East = navy with white crest; West = crimson with dark crest; Kobayakawa = ochre with black crest |
| No text | No letters or kanji anywhere, including banners and scrolls |
| No frame | Image runs edge to edge; nothing like the old placeholder's lacquer frame or lantern border |
| Safe area | The subject survives a crop to 16:9 and a 7% zoom |
| History | Matches the shot's history notes (no later-era castles, no wrong season) |

## Common fixes (paste as a follow-up when an image fails)

- `Remove all text, letters and kanji, including on banners. Keep crests as simple shapes.`
- `Make it pixel art: visible pixel clusters and dithering like the attached references, not a smooth painting.`
- `Mute the colours to match the references: slate blues, wet greys, olive, rust, one warm light.`
- `Remove the border/frame; the image must run edge to edge.`
- `Move the main subject toward the centre; keep 12% empty margin at every edge.`
- `Add rain and low mist like the attached ending image.`
- `Swap banner colours: Eastern banners navy with a white round crest, Western banners crimson with a dark round crest.`

## Character continuity

Use `REF-08_portrait-sheet.png` (left to right, top row then bottom row). When a named character appears in a scene, keep their helmet and colours:

| Character | Side | Recognizable by |
| --- | --- | --- |
| Tokugawa Ieyasu | East | Older, grey beard; black helmet with gold round crest; black lacquered armor |
| Honda Tadakatsu | East | Black helmet with large gold antler crest; moustache |
| Ii Naomasa | East | All-red armor and helmet with gold horns ("Red Devils") |
| Fukushima Masanori | East | Black helmet with wide gold crescent; heavy moustache |
| Kuroda Nagamasa | East | Tall pointed dark helmet; younger, clean-shaven |
| Ishida Mitsunari | West | White feather plume on helmet; younger, clean-shaven, stern |
| Ōtani Yoshitsugu | West | White hood covering head and lower face |
| Kobayakawa Hideaki | Undecided | Young; plain dark helmet; uncertain expression |

## Safe area and cropping

- Scenes are delivered at 3:2 (1536×1024) and cropped to 16:9 (1536×864) by removing up to 80 px from the top and bottom.
- The scene player slowly zooms to 107% and pans, so keep faces, the main action and any castle or banner the caption mentions inside the central **1150×650** area.
- Portraits: head and shoulders, head centred, helmet fully inside the frame, on a plain near-black background (#0b0a08), 3/4 view like the existing portraits.

## Sizes Claude will produce from your files

| Type | Delivered by ChatGPT | Final in game |
| --- | --- | --- |
| Scene pane | 1536×1024 PNG | 640×360 WebP, about 40–60 KB |
| Crisis plate | 1536×1024 PNG | 640×360 WebP |
| Portrait | 1024×1024 PNG | 96×96 WebP |
