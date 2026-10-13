# Source Checkpoint Record — Math Civ (Sekigahara)

**Recorded:** 13 Oct 2026 · **Recorded by:** Claude, at William McAda's request
**Status:** Preserved as received (commit `57797ca`), then reconciled to v0.3.1 (see the Reconciliation section).

## What was received

William located `SEKIGAHARA_V03_WORKING_CHECKPOINT.zip` in his ChatGPT library on 13 Oct 2026 and uploaded it.

| Field | Value |
| --- | --- |
| Original file | `archive/SEKIGAHARA_V03_WORKING_CHECKPOINT.zip` (byte-for-byte copy) |
| Size | 216,521 bytes |
| SHA-256 | `996296155054ba5b255e05de002f673b633329a41071bb3784520eb5c685bab2` |
| Entries | 81 (65 files plus directories, `package.json`, `package-lock.json`) |
| Extracted to | Repository root: `src/`, `tests/`, `scripts/`, `public/`, `source-spec/`, `package.json`, `package-lock.json` |
| Extracted changes | None. Files are exactly as in the zip. |

The previously missing proposal `SEKIGAHARA_V0.3_PROPOSAL.md` is included at `source-spec/SEKIGAHARA_V0.3_PROPOSAL.md`.

## How it compares with the shipped v0.3.1 file

Comparison with `PLAY-SEKIGAHARA-0.3.1.html` (Git blob `ccffe181`):

- **Older than v0.3.1.** `src/core/version.ts` says `BUILD_VERSION='0.3.0'`. The 0.3.1 HTML reports `0.3.1`.
- **v0.3.1 features absent from this source** (present in the HTML):
  - storage fallback for viewers without IndexedDB (`mc-save-fallback-v1`, session-only warning);
  - export dialog with "Save / Share file" and copyable text, plus pasted-save import;
  - phone layout (`phone-layout`, battlefield/command jump buttons);
  - boot status and error message script (`boot-status`, `SEKIGAHARA_READY`);
  - `viewport-fit=cover` in the standalone page.
- **Build files missing from the zip:** `index.html`, `vite.config.ts`, `vite.local.config.ts`, `tsconfig.json`, Tauri configuration, and almost all of `public/` (only `public/art/EVENT_CONVOY.webp` is included; the other art, fonts and audio are embedded in the v0.3.1 HTML and can be extracted from it).
- **`package.json` version** says `0.2.0`; it was not updated for v0.3.

## Reconciliation to v0.3.1 (13 Oct 2026)

The extracted checkpoint was brought up to the shipped v0.3.1 behaviour, using `PLAY-SEKIGAHARA-0.3.1.html` as the reference. The original zip stays unchanged in `archive/`.

**Ported from the v0.3.1 build into `src/`:**

| Area | Change |
| --- | --- |
| Rules engine | Event detail on resource changes (`requested`, `overflow`); `FORMATION_STRENGTH_CHANGED` and `FIELDWORKS_PREPARED` events; `answerPolicy` in challenge records; legacy provision/ammo-price migration paths; Western ration packs up to 12; flanking reserve north/south entry and `RESERVE_DELAYED`; suppress damage rounding and suppress-on-broken-target rule; camp-check reset after each action; council score counting auxiliaries and routed-but-present units |
| Saves | Save-structure checks for schema 2 battles; migration keeps unopened order variants and sets reserve entries; IndexedDB timeout, localStorage and session-only fallback with on-screen notices; export dialog (share, select-all text) and pasted-save import; per-file export of preserved originals |
| Interface | Phone layout (battlefield/commands jump, scrollable battlefield, swipe hint); rally status in the unit panel; reserve-entry picker; plan guide; readable scouted intents; legacy-import rounding note; ledger overflow notes and troop/fieldwork lines; animated moves, hits and dispatch labels on the board; save-busy guard; settings and fullscreen fallbacks; storage information; v0.3.1 stylesheet |
| Start-up | `boot-status` script (`src/app/boot-status.js`), `structuredClone` fallback, visual-viewport sizing |

**Rebuilt (not in the zip):** `public/` assets (extracted byte-for-byte from the v0.3.1 HTML), `index.html`, `vite.config.ts`, `vite.local.config.ts`, `tsconfig.json`, `src/vite-env.d.ts`.

**Offline tooling (the npm registry is unreachable from the build environment):**

- `vendor/phaser/phaser.min.cjs`: Phaser 3.90.0 recovered unchanged from the v0.3.1 HTML, with `phaser.d.ts` as a minimal type stub.
- `scripts/build-offline.mjs` (`npm run build:offline`): esbuild single-file build to `release/PLAY-SEKIGAHARA-<version>.html`.
- `scripts/offline-test/` (`npm run test:offline`): runs `tests/unit` through a small vitest stand-in.
- `tools/parity/`: compares the source engine with the shipped engine.

### Evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Source typechecks (`src/`) | Passed | TypeScript 6.0.3 `--noEmit`, no errors. Tests and `scripts/validate-content.ts` need vitest, @types/node and ajv 8, which could not be installed. |
| Unit tests | Passed | `tests/unit`: 141 passed, 0 failed (vitest stand-in). |
| Integration tests | Not run | Need happy-dom and fake-indexeddb. |
| Engine parity: scripted campaigns | Passed | 24 full bot campaigns, 24,855 commands, full-state comparison after every command: 0 differences. |
| Engine parity: random walk | Passed | 24 random-walk campaigns (`tools/parity/fuzz.cjs`, seeds 13–36), 27,401 commands of which 3,469 were legal moves, 14 reaching the campaign report: 0 differences in state or in rule-violation messages. |
| Content self-check | Passed | 4 chapters, 17 orders, 24 templates, 48 variants, 5 crises, 7 formations. |
| Interface parity | Passed | Rebuilt HTML vs shipped HTML, 10 screens × 2 sizes (1180×820, 390×844), headless Chromium: pixel-identical except a save timestamp. No console errors. |
| Storage fallback parity | Passed | With IndexedDB and localStorage blocked, both builds show the same session-only notices. |
| Physical iPad/iPhone | Not run | |

The rebuilt file is not byte-identical to the shipped file (different bundler and minifier), and it is not committed. `PLAY-SEKIGAHARA-0.3.1.html` remains the v0.3.1 release artifact.

## Next step

v0.4 work starts from this reconciled source, per `docs/change-specs/v0.4.md`.
