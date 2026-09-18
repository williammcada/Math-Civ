# Project Brief — Math Civ — Sekigahara

**Brief version:** 0.3 — source-baseline normalization  
**Owner:** William McAda · **Credit:** A WILLIAM MCADA PRODUCT  
**Status:** Canonical source identity reconciled; release, functional and deployment verification remain separately stated.  
**Repository:** `williammcada/Math-Civ`, branch `main`.  
**Current running version:** Not independently verified. Exact committed v0.3.1 source identity and byte preservation are established.  
**Source/baseline:** Canonical preserved source: `PLAY-SEKIGAHARA-0.3.1.html`, Git blob `ccffe181677be2334d6ff16678f696c5f85a3e66`, at source checkpoint `b4095e8be208de5aae95706ec4e4c62c08ef753e`. This is a preserved v0.3.1 implementation source, not a verified release claim.  
**Next work:** Use the committed v0.3.1 source as the baseline; verify proposal coverage, math fixes, battle flow and iPhone-wrapper compatibility before release.  

## 1. Purpose, audience and detailed scope

- Offline turn-based historical strategy/mathematics game, Japan/Tokugawa leading to Sekigahara. Preserve TypeScript/Phaser source architecture, Windows and landscape iPad targets; iPhone HTML-wrapper support is a separate unresolved request.
- Four chapters, three Command Seals per chapter, 17 orders, policy/world phases; Rice, Treasury, Materials, Authority plus city/army/diplomacy statistics.
- Retain 24 question templates/two authored variants each, three attempts in every assistance mode (help changes, attempts do not), diminishing rewards and visible math-resource consequences.
- Preserve five crisis types (famine, rebellion, flood, plague, raid), at most one major crisis per chapter, tactical grid/formations/terrain/deployment/practice and Good/Normal/Bad endings.
- Accepted v0.3 removes forced five-round battle finish; two consecutive uncontested camp checks or all opposing cores defeated/routed earn victory. Round 12 offers optional council, not a mandatory ending.
- Add Chapter-1 Granary Convoy after second resolved order without spending another Seal or replaying world/production phases; loss continues campaign. Select one earned tactical plan: Flanking March, Engineer Corps, Fire Discipline; Standard Deployment remains available.
- Rebalance sustainable rations/ammunition, explicit supply ledger, battle saves, readable enemy intent/capture progress and Kobayakawa decision timing. Exact values and supersessions belong to SEKIGAHARA_V0.3_PROPOSAL.md.
- Math audit: two supply questions need explicit issued-ration tables; deliberate final provisioning rounding must state boundary rule. Accept equivalent decimals; reject malformed numeric forms. Preserve correctly purchased supplies rather than applying misleading percentage losses.
- Local deterministic AI; no model API/backend/accounts/telemetry or external runtime assets. No new nation, leader campaign, multiplayer, larger map or wholesale engine rewrite in v0.3.

## 2. This task and boundaries

This normalization establishes the exact repository source path, Git object identity and source-preservation checkpoint; creates the linked migration baseline; and retires stale pre-upload source-status wording. It does not change application behavior, approve new features, rerun product tests or convert source preservation into a release claim.

## 3. Standards and adoption

[Canonical handbook](https://github.com/williammcada/mcada-project-handbook). File blob revisions consulted: AI-START-HERE.md 6557a45aaa6d29d7d1abde808e6d0ac248b08820; UNIVERSAL-RULES.md aed6fe311aa2e88983f862a30a2d8f05d2ffc04d; CONDITIONAL-STANDARDS.md dad2d3a05ca0f18260196ea51ac6351bffffdc1c; PROJECT-TEMPLATE.md 574f4c6fcf19ecc2f9e27582fd856fb08123e8da. These are file blobs, not repository commit SHAs.

Relevant rules: U-01 identity, U-02 help, U-03 input validation, U-04 unambiguous math/text where applicable, U-05 reader/device, U-06 preservation, U-07 verification, U-08 local scope. Conditional selection: S-02, S-03, S-04.
Baseline adoption: selected for this documentation task within existing user instructions. Handbook still labels shared scope/modules seeded/draft; no new global rule ratification is inferred. Project-specific approved decisions control their own scope.

## 4. Must-retain behavior

The detailed scope above is the feature-preservation inventory. Preserve existing settings, data, accepted content, assets, exports and compatibility confirmed in source. Distinguish implemented behavior, accepted pending changes and historical requests during intake. A missing entry in this brief is not authorization to remove working behavior. Preserve valid user work during migrations and failures.

## 5. Source, release and deployment discipline

Canonical preserved source: `PLAY-SEKIGAHARA-0.3.1.html`, Git blob `ccffe181677be2334d6ff16678f696c5f85a3e66`, at source checkpoint `b4095e8be208de5aae95706ec4e4c62c08ef753e`. This is a preserved v0.3.1 implementation source, not a verified release claim.

See [`MIGRATION-BASELINE.md`](MIGRATION-BASELINE.md) for the authoritative source manifest and the checks actually performed.

DESIGN → CHANGE SPEC → IMPLEMENT → CHECKPOINT → VERIFY → VERIFIED CHECKPOINT → RELEASE → DEPLOY.

Use “implementation checkpoint” or “release candidate” before verification. Preserve candidate bytes and logs before packaging; recover that checkpoint after a ZIP/upload failure. Do not rebuild a verified implementation to fix delivery. Repository upload and website deployment are different operations.

## 6. Known issues, conflicts and open evidence

Known feedback: Submit Revision after wrong answer, troop movement/deployment ambiguity, battle too short, hidden rounding, iPhone HTML-app failure. Resolve against checkpoint rather than assuming every historical defect persists.

| Conflict or risk | Required handling |
| --- | --- |
| Historical claim versus current source | Inspect exact source; keep historical claim labeled until verified. |
| Proposed next scope versus working baseline | Use the approved version-specific specification; do not silently promote proposals. |
| Other project rules | Do not import AAC quotas, other-game retry counts, or a shared backend without explicit scope. |
| Handbook proposals | No additional exception or proposal is adopted by this brief. |

## 7. Verification contract

Check all templates/variants plus dynamic inputs, three-attempt flow, supply receipts, convoy return/save, all tactical plans, camp checks/council/endings; document iPad and iPhone wrapper separately.

| Evidence required | Result in this task |
| --- | --- |
| Exact source candidate/commit identified and preserved | Passed — canonical path and source checkpoint recorded in `docs/MIGRATION-BASELINE.md`; no functional verification inferred |
| Project-specific checks above, with inputs and expected/actual results | Not run |
| Save/import/export and malformed-input regression | Not run |
| Intended devices and real deployment path, where applicable | Not run |
| Version, release notes and delivered bytes agree | Not run |

The next build report must name the candidate, environment and test results; historical reports of passing tests do not transfer to a changed candidate.

## 8. Handoff and provenance

Current source identity is recorded in [`MIGRATION-BASELINE.md`](MIGRATION-BASELINE.md). That manifest supersedes earlier unknown-source or pre-upload statements while preserving the original migration note as history.

Required project records: SEKIGAHARA_V0.3_PROPOSAL.md (read for this revision); SEKIGAHARA_V03_WORKING_CHECKPOINT.zip; math audit and feedback.

Provenance: previous migration brief and project-history audit in this conversation; directly read dossier/proposal where explicitly stated above. Records not explicitly marked read here are retrieval targets, not claims of fresh inspection. No current app code was tested for this brief.

Before substantive implementation retrieve these records, the current source, approved change spec and applicable handbook. If an indispensable spec is inaccessible, report the gap instead of filling it with invented details. Do not delete unique historical chats/assets until their contents are independently preserved.

## 9. Ecosystem boundary

Shared principles do not establish shared code, accounts or interfaces. MathQuest is engagement, TestForge assessment design, GradePal learner-level evidence, and DataDiver institutional analytics. Integration remains separately specified unless confirmed in source. Other projects remain independent unless their brief explicitly says otherwise.

