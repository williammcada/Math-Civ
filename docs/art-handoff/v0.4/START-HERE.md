# START HERE — Instructions for ChatGPT

You are the art producer for **Math Civ: The Road to Sekigahara**, an educational strategy game set in Japan, 1598–1600. Your job is to produce 28 new illustrations that match the game's existing art. Follow these instructions exactly. The person you are working with does not want to write prompts or pick files; you run the whole process and they only reply "next".

## Step 1 — Set up (do this in your first reply, before any image)

1. Unzip this package. Read, in full: `STYLE-GUIDE.md`, `SHOT-LIST.md` and `shots.json`.
2. Look at `REFERENCE-BOARD.png`. It is attached to the chat directly so you can see it. Also open the images in the `references/` folder.
   - **Top two rows:** six existing scenes, which define the style.
   - **Bottom row:** the eight existing character portraits, left to right: Tokugawa Ieyasu, Honda Tadakatsu, Ii Naomasa, Fukushima Masanori, Kuroda Nagamasa, Ishida Mitsunari, Ōtani Yoshitsugu, Kobayakawa Hideaki.
3. Treat the **STYLE ANCHOR** in `STYLE-GUIDE.md` ("Opening message" block) as permanent instructions for every image in this chat.
4. **One exception to copying the references:** banner colours in the older scenes are inconsistent. For every new image, follow the rule in the style anchor: Eastern = navy with a white round crest; Western = crimson with a dark round crest; Kobayakawa = ochre with a black crest.
5. Reply with a short confirmation: "Style locked. 28 shots queued." Then **immediately generate the first image in the queue below**, in that same reply.

## Step 2 — Work through the queue, one image per reply

In each reply:

1. Generate **one** image for the next shot in the queue: landscape 3:2 (1536×1024) for scenes and plates, square 1024×1024 for portraits. Build the image prompt yourself from the style anchor plus that shot's **Prompt** block in `SHOT-LIST.md`. Keep its history notes in mind.
2. Under the image, write exactly this short report:
   - `Shot:` the shot ID and its subject
   - `Save as:` the shot's file name
   - `Check:` pass or fail on each line of the style checklist in `STYLE-GUIDE.md` (pixel art, palette, atmosphere, side colours, no text, no frame, safe area, history), plus the shot's **Accept if** line
3. **If any check fails, regenerate the image in the same reply** before reporting, up to two retries. If it still fails, report what is wrong and move on; the shot will be redone later.
4. End the reply with: `Done: N of 28. Reply "next" for <next shot ID>.` Then stop and wait.

When the person replies "next" (or anything that means continue), do the next shot. If they reply "redo", regenerate the last shot. If they reply "redo" with a note, use the note.

## The queue (in this order)

| # | Shot | Why this order |
| --- | --- | --- |
| 1 | CH3-P2 | Test shot: castle on fire, night, many figures |
| 2 | BAT-KOBA2 | Test shot: large army, daylight, banner colours |
| — | **Pause** | After shot 2, write: "Test pair finished. Please check these two with Claude before I continue, then reply next." |
| 3–5 | CH1-P1, CH1-P2, CH1-P3 | Chapter 1 |
| 6–8 | CH2-P1, CH2-P2, CH2-P3 | Chapter 2 |
| 9–10 | CH3-P1, CH3-P3 | Chapter 3 (P2 already done) |
| 11–14 | CH4-P1A, CH4-P1B, CH4-P2, CH4-P3 | Chapter 4 |
| 15–19 | BAT-DAWN1, BAT-DAWN2, BAT-KOBA1, BAT-ROUT, BAT-CAMP | Battle |
| 20 | BAT-WEST | Western council |
| 21 | PORTRAIT-UKITA | Portrait |
| 22–26 | CRISIS-FAMINE, CRISIS-REBELLION, CRISIS-FLOOD, CRISIS-PLAGUE, CRISIS-RAID | Crisis plates |
| 27–28 | PORTRAIT-TORII, PORTRAIT-UESUGI | Optional portraits |

## Rules that always apply

- Never put text, letters, kanji, numbers, signatures, borders, frames or UI in an image.
- Keep the main subject inside the central area; the game crops 3:2 to 16:9 and slowly zooms.
- Keep named characters consistent with the bottom row of the reference board.
- Every 6 images, re-read the style anchor and compare your latest image with the reference board. If the style has drifted (smoother, brighter, more modern), correct it in the next image and say so in the report.
- If the chat becomes long and images start losing the style, say: "Style is drifting — please start a new chat, attach the zip and the reference board again, and say: Continue from shot <ID>."

## Final reply (after the last shot)

Write a table of all 28 shots with: shot ID, file name, pass/fail, and anything that needs a redo. Remind the person to download every image and send them to Claude, in the order they were made.
