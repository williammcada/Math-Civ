# Migration Baseline — Math Civ — Sekigahara

**Recorded:** 18 September 2026  
**Repository:** `williammcada/Math-Civ`  
**Branch:** `main`  
**Source-preservation checkpoint:** `b4095e8be208de5aae95706ec4e4c62c08ef753e`  
**Record status:** Current source identity. This is not by itself a functional-test, release, or deployment claim.

## Canonical source identity

| Field | Value |
| --- | --- |
| Canonical source path | `PLAY-SEKIGAHARA-0.3.1.html` |
| Git blob SHA | `ccffe181677be2334d6ff16678f696c5f85a3e66` |
| Version represented | v0.3.1 preserved implementation source; verification remains open |
| Repository source checkpoint | `b4095e8be208de5aae95706ec4e4c62c08ef753e` |

The checkpoint above identifies the application/planning source immediately before this normalization record was committed. Later documentation-only commits do not change the preserved application bytes.

## Verification status

| Check | Result | Evidence / limitation |
| --- | --- | --- |
| Source exists in the default branch | Passed | Repository paths and Git object identities were read directly on 18 September 2026. |
| Byte-preservation comparison | Passed | Passed — the Git blob matched the preserved Library source during the 18 September 2026 audit. |
| Functional workflow | Not run | Source preservation does not establish that imports, gameplay, reports, storage or exports work. |
| Hosted/running application | Not run | Not verified; the standalone HTML file was not functionally tested in this normalization. |

## Documentation authority

- [`PROJECT-BRIEF.md`](PROJECT-BRIEF.md) records purpose, scope, must-retain behavior and verification requirements.
- [`change-specs/INDEX.md`](change-specs/INDEX.md) identifies approved or directional change records.
- [`MIGRATION-NOTE.md`](MIGRATION-NOTE.md) is retained as historical migration context but its pre-upload source-status language is superseded by this baseline.
- This file controls current source identity when an older brief or note says the source was unknown or “TO ESTABLISH.”

## Next gate

Use the committed v0.3.1 source as the baseline; verify proposal coverage, math fixes, battle flow and iPhone-wrapper compatibility before release.

Do not label a future commit a verified release until the exact candidate has passed the project brief’s required verification and that evidence is preserved.
