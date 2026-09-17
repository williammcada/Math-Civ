# Project Brief — Math Civ

**Brief status:** Migration baseline / requires source verification where noted  
**Brief version:** 0.1  
**Last updated:** 18 September 2026  
**Owner:** William McAda  
**Product credit:** A WILLIAM MCADA PRODUCT  
**Handbook repository:** `williammcada/mcada-project-handbook`  
**Handbook baseline:** `6557a45aaa6d29d7d1abde808e6d0ac248b08820 (AI-START-HERE.md); UNIVERSAL-RULES.md @ aed6fe311aa2e88983f862a30a2d8f05d2ffc04d`  
**Repository:** `williammcada/Math-Civ`  
**Canonical source status:** Latest discussed development target/build is v0.3; exact latest known-good source artifact is TO ESTABLISH from the local project files.  
**Current project state:** Playable foundational prototype with ongoing battle-length, gameplay-engagement, rounding/estimation, and mobile-compatibility revisions.

## 1. Purpose and audience

Math Civ is a retro turn-based mathematics-and-civilization strategy game combining contextualized resource mathematics, city/economic decisions, tactical battle, and branching campaign outcomes.

**Primary audience / operator:** Student player using desktop or supported touch/mobile browser.

## 2. Standards selection

**Universal baseline:** U-01 through U-08 where applicable.

**Conditional modules:** S-02 Curriculum/Assessment/Evidence; S-03 Live Classroom and Educational Games; S-04 Distribution/Deployment

Apply only the selected modules and project-local requirements. Do not import restrictions from unrelated projects.

## 3. Project-specific requirements

- Do not require rounding or estimation unless the prompt intentionally teaches or specifies it.
- Resource calculations, displayed adviser solutions, and scoring must agree.
- Battles must provide enough tactical duration to feel meaningful.
- Math success/failure should affect resources without collapsing the game into a worksheet wrapper.
- Preserve the SNES/ROTK/Civ-inspired strategic identity without copying protected game assets.
- Target browser/device support must be tested rather than assumed.

## 4. Preserve from the current accepted project

- Turn-based civilization/resource layer.
- Math success → resource consequences and diminishing returns on failures.
- Chaotic/strategic consequences of resource pressure.
- Branching Good/Normal/Bad-style outcomes where retained in the current design.
- Tactical-grid battle concept.
- Initial Japan/Tokugawa/Sekigahara campaign identity.

## 5. Relationship to other projects

- Independent educational strategy game; not a MathQuest cartridge.
- Future ROTK-math remake work should not silently overwrite this source without an explicit migration plan.

A conceptual relationship is not proof of an implemented integration. Do not invent a shared API, data schema, identity layer, or deployment dependency without an explicit integration task.

## 6. Source and version discipline

The exact current source artifact or repository commit must be identified before a substantive build. If the field above says the source is not yet established, first locate the latest known-good local file/ZIP or existing repository state and record its exact identity here.

For substantial revisions use:

**DESIGN → CHANGE SPEC → IMPLEMENT → CHECKPOINT → VERIFY → VERIFIED CHECKPOINT → RELEASE → DEPLOY (when applicable)**

A packaging/export/deployment failure must not force reconstruction of an already verified build.

## 7. Definition of done

| # | Requirement / check | Result | Evidence / limitation |
| ---: | --- | --- | --- |
| 1 | Representative mathematics contains no unintended rounding ambiguity. | Not run | |
| 2 | Resource calculations reproduce independently. | Not run | |
| 3 | Battle pacing is long enough under the approved design. | Not run | |
| 4 | Failure paths remain playable and strategically meaningful. | Not run | |
| 5 | Target desktop/touch/iPhone behavior is verified where claimed. | Not run | |

Allowed results: **Passed / Failed / Not run / Not applicable**. A "Passed" result requires an actual check against the identified candidate.

## 8. Known issues and migration notes

The next migration step is to identify the exact v0.3 local source package and place it beside these docs before retiring the long Math Civ chat.

## 9. Handoff files

A substantive AI implementation task should retrieve or receive:

1. `AI-START-HERE.md`;
2. `UNIVERSAL-RULES.md`;
3. the relevant sections of `CONDITIONAL-STANDARDS.md`;
4. this project brief;
5. the exact current source artifact/commit;
6. the approved version-specific change specification;
7. applicable assets and deployment configuration.

Do not reconstruct the current implementation from a historical chat summary when the actual source should be available.

## 10. Ownership

**William McAda**  
**A WILLIAM MCADA PRODUCT**
