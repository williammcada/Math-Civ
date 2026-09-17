# Math Civ — Change Specification Template

**Product:** Math Civ  
**Target version:** `[enter target version]`  
**Specification status:** Draft / Approved  
**Owner:** William McAda  
**Handbook baseline:** `williammcada/mcada-project-handbook @ 6de4cbf33c3b9860125c412359fb64ef3d0b20d1`  
**Canonical source artifact/commit:** `[exact identity — do not guess]`

> This file is a template. It is not an approved change specification until the requested changes and release target are explicitly reviewed.

## 1. Release purpose

Describe why this version exists and the problem it is intended to solve.

## 2. Baseline

- Current verified release:
- Exact source artifact/commit:
- Running/deployed version, if applicable:
- Known unverified claims:

## 3. Requested changes

Record only decisions accepted for this version.

- 
- 
- 

## 4. Out of scope

List tempting adjacent work that is **not** part of this release.

- 
- 

## 5. Must retain

List accepted current behavior that may not disappear during implementation.

- 
- 

## 6. Project-specific rules and exceptions

Record local mechanics, formats, data constraints, devices, deployment requirements, or approved exceptions. Do not promote them into universal rules unless separately approved.

## 7. Implementation plan

Use bounded workstreams. For substantial software revisions, preserve an identifiable source checkpoint before extended verification or packaging.

1. Implement against the exact baseline.
2. Preserve an implementation checkpoint.
3. Verify the affected workflow.
4. Fix failures.
5. Preserve the verified checkpoint.
6. Package/release from that verified checkpoint.
7. Deploy and verify the actual running artifact when applicable.

## 8. Verification matrix

Allowed results: **Passed / Failed / Not run / Not applicable**.

| Requirement | Test / inspection | Result | Evidence / limitation |
| --- | --- | --- | --- |
| Product/version identity | Running artifact, package, README agree | Not run | |
| Requested changes present | Inspect exact candidate | Not run | |
| Must-retain behavior preserved | Regression check | Not run | |
| Inputs/content are unambiguous | Representative and boundary cases | Not run | |
| Target-device behavior | Required devices/input methods | Not run | |
| End-to-end workflow | Real affected workflow | Not run | |
| Packaging/deployment | Exact verified candidate delivered | Not run | |

## 9. Release notes

State:

- implemented changes;
- tests actually run;
- unresolved issues;
- manual checks still needed;
- exact files/artifacts delivered;
- whether the canonical repository was actually updated.

## 10. Recovery rule

A packaging, export, or deployment failure must not require reconstruction of an already verified implementation. Recover from the latest verified source checkpoint whenever possible.
