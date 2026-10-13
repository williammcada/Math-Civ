# Source Checkpoint Record — Math Civ (Sekigahara)

**Recorded:** 13 Oct 2026 · **Recorded by:** Claude, at William McAda's request
**Status:** Preserved as received. Not yet reconciled with the v0.3.1 HTML build.

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

## Next step (v0.4 work)

1. Rebuild the missing build files and `public/` assets so this source builds.
2. Port the v0.3.1 changes listed above from the shipped HTML into the source.
3. Confirm parity: the rules engine built from source gives the same results as the v0.3.1 HTML on the audit harness (all math variants, campaign and battle sweeps).
4. Commit that as "Recover Math Civ v0.3.1 source baseline". v0.4 changes are made on top of it.

Until step 3 passes, `PLAY-SEKIGAHARA-0.3.1.html` remains the reference for v0.3.1 behaviour.
