# Math & Civilization: The Road to Sekigahara
# v0.3 — Gameplay and implementation proposal

**Date:** 14 September 2026  
**Status:** Proposed design, ready for review. No game changes are included in this document.  
**Baseline:** The delivered, repaired v0.2.0 prototype and its completed math audit.  
**Purpose:** Make preparation rewarding, give battles enough room to develop, and eliminate accidental rounding requirements while preserving the small, offline SNES-style game.

## 1. Recommendation

Build v0.3 around three player experiences: **I understand what the question asks; my preparation gives me useful options; I have time to use them.**

The strongest next version adds an early convoy encounter, three campaign-earned tactical plans, and a longer Sekigahara finale. It also corrects the audited mathematics and makes resources, battle intentions, and consequences easier to read. This is a focused improvement to the existing campaign, with the existing historical setting, menus, art style, economy, and endings.

The proposed numbers below are starting balance values, not validated playtest results. Rules marked as requirements should survive tuning; costs, rewards, damage coefficients, and duration targets can be adjusted during the specified milestones, with changes recorded.

| Priority | v0.3 decision | Player benefit |
|---|---|---|
| Required: fair mathematics | Exact answers by default; two supply questions use issued-ration tables; one explicitly taught rounding lesson remains | Students do not lose rewards for reasonable interpretations of incomplete instructions. |
| Required: battle duration | Remove the forced five-round finish; offer an optional outcome review after round 12 | Players can finish a developing attack instead of losing to an unexpected cutoff. |
| Required: sustainable logistics | Rebalance battle rations and ammunition for a longer fight; preserve correctly calculated supply quantities | More time is usable, rather than several additional rounds of starvation. |
| Required: meaningful rewards | Retain diminishing rewards; distinguish resource-producing orders from purchases and provisioning | Correct mathematics produces visible advantages without silently deleting purchased supplies. |
| Required: earlier engagement | Add one short convoy encounter during Chapter 1 | Students use the tactical game before completing most of the campaign. |
| Required: strategic variety | Add Flanking March, Engineer Corps, and Fire Discipline; choose one | Campaign investments change battlefield possibilities. |
| Required: clarity and recovery | Show action consequences, camp-capture progress, enemy intentions, and supply; allow saves during battle | Students can form plans, recover from setbacks, and resume later. |
| Required: presentation | Add a compact set of sprites, animation, sound, and reward feedback | The improvement feels like a game update, with visible and audible consequences. |

**Success hypothesis:** Students will become more interested when they can see and use the consequences of their mathematics sooner. We should test that hypothesis with a playable 10–15-minute segment before completing presentation polish. Pixel art and additional content alone cannot establish that the game is enjoyable.

## 2. Evidence and scope

### What the feedback and audit establish

- The player reports that the final battle ends before there is enough **time** to finish. The implemented battle has a separate five-round score cutoff.
- Provision the Aizu March and Establish Forward Granaries secretly round each formation's supply requirement up. Their questions do not disclose the required grouping or packing rule.
- For the screenshot's 3,550, 3,750, and 3,290 troops, the displayed rate calculation gives 317.7 Rice for three rounds. The coded per-formation packing calculation gives 321. The difference is an instructional defect, not evidence that the student misunderstood the displayed arithmetic.
- Final battle provisioning intentionally assesses rounding, but “next 100” needs a precise boundary rule.
- The other 21 question types need no rounding with the current operands. Road supplies and trading lots need guards against future unintended rounding or remainder requirements.
- Equivalent decimal notation is rejected, while malformed comma placement can be accepted. A format rejection does **not** currently spend an attempt; a mathematically graded wrong answer does.
- A three-round plan can become one supplied round despite a “65% benefit” label. Integer conversion makes the advertised reward misleading.
- The audit checked all 24 templates, all 48 stored variants, dynamic inputs, and submission/reward behavior. Passing stored answer keys did not catch the live wording defect.

A further source review for this proposal found that the current combat calculation applies attacker casualties even when the defender cannot reach the attacker. Section 6 proposes a readable retaliation rule. This is a gameplay review observation, separate from the completed math audit; it has not been validated in a revised build.

### What stays

- Japan, Tokugawa Ieyasu, and the lead-up to Sekigahara; future leaders still mean different historical campaigns.
- Four strategic chapters, three Command Seals per chapter, 17 orders, and the existing policy and world phases.
- Rice, Treasury, Materials, and Authority as the four visible resources; existing city, army, and diplomacy statistics.
- All 24 question templates with two authored variants each. Changed operands require updated keys and validation; no template is removed to avoid fixing it.
- Three attempts in every assistance mode. Modes change help, not the number of chances.
- Five crisis types: famine, rebellion, flood, plague, and raid; at most one major crisis per chapter.
- The compact orthogonal tactical grid, core formation identities, terrain, deployment, army preparation, practice battle mode, and Good/Normal/Bad endings.
- Local, deterministic game AI. No model calls, API dependency, backend, account, analytics service, or externally hosted runtime assets.
- Windows and landscape iPad support from the existing TypeScript/Phaser project and offline delivery paths.

### Explicit changes to earlier specifications

If accepted for implementation, this proposal supersedes the earlier five-round limit, one-check camp capture, round-three Kobayakawa arrival, battle food/ammunition rates, supply-duration penalties, one-use Rally, and safe-save restrictions. It adds the convoy and tactical plans described here. Other baseline requirements remain in force. Implementers must not treat an older “locked” value as a reason to retain one of these superseded rules, or use this proposal to remove unrelated systems.

### Deliberately outside v0.3

No new nation or leader campaign, real-time combat, larger strategic map, multiplayer, generated dialogue, new technology tree, collectible card system, inventory grind, separate currencies, online infrastructure, or wholesale engine rewrite. Broader market research and a commercial release plan are separate tasks.

## 3. Campaign rhythm and the first 15 minutes

The four-chapter campaign remains the organizing structure. The new encounter interrupts Chapter 1 once, after two completed orders, then returns the player to the same chapter with the remaining Command Seal.

| Segment | Player experience | New v0.3 feedback |
|---|---|---|
| Opening and first order | Establish priorities and solve one consequential problem | Show the resource receipt and a concrete future use for the benefit. |
| Second order | Make a different governing choice | Preview one relevant tactical-plan prerequisite and announce the departing convoy. |
| The Granary Convoy | Escort supplies across a small battlefield | Use movement, attack range, protection, and a limited ammunition supply immediately. |
| Return to Chapter 1 | Receive cargo and use the third order | Explain exactly what arrived and what the escort consumed. |
| Chapters 2–3 | Prepare the army, economy, route, and coalition | Persistent plan cards show which battlefield options these investments enable. |
| Chapter 4 | Choose among diplomacy, fortifications, supplies, and intelligence | Preview the competing benefits without promising that every option can be obtained. |
| Final preparation | Fund supplies and equipment; select one eligible tactical plan | Show the complete loadout and its concrete battlefield effects. |
| Sekigahara | Maneuver, respond to the coalition decision, and pursue victory | Supply counters, readable intentions, two-stage camp capture, and optional continuation. |
| Ending | See the realm, battle, and mathematics together | Attribute important outcomes to actual orders and decisions. |

Provisional pacing targets are first tactical play within 10–15 minutes, a 4–7-minute convoy, a 15–25-minute final battle, and a 45–65-minute campaign. These are observation targets, not countdowns. Students may read, calculate, or inspect for as long as they need. The game must save progress so a longer session can be divided naturally.

## 4. New encounter: The Granary Convoy

### Role and historical framing

This is a short, fictionalized supply incident near Edo, openly labeled as a dramatized encounter within the historical campaign. It teaches the existing battle controls and gives successful preparation an immediate use. It does not claim to recreate a documented engagement or change the main Sekigahara roster.

### Trigger and return

- Trigger once after the second resolved Chapter 1 order, after its result and any pending reward are collected.
- Present a briefing and loadout before spending resources. Announce the upcoming escort from the opening council so its costs are foreseeable.
- The encounter uses no additional Command Seal and adds no graded mathematics checkpoint.
- On completion, return to the exact suspended Chapter 1 orders state. Preserve the remaining Seal, used orders, decisions, attempts, and resources, applying only the explicit encounter transactions.
- Never run a second chapter production, crisis roll, Western world phase, or ending calculation when returning.
- A defeat continues the campaign. Repeat campaigns may skip the encounter from its briefing, receiving no cargo reward or combat result bonus. An unaffordable legacy state can also skip safely; it must not be trapped at the briefing.

### Board and forces

The board is 8 columns by 6 rows. Coordinates in this subsection are **one-based, column then row**, for content authors.

| Element | Definition |
|---|---|
| Road | Row 3, columns 1–8 |
| Stream | Column 5, with a permanent bridge at (5, 3) |
| Wagon | Starts at (2, 3); exits at (8, 3); integrity 3 |
| Escort spears | 400 troops, start (2, 2) |
| Escort arquebusiers | 300 troops, start (2, 4) |
| Raiders | Two fictional 250-troop spear formations, start (6, 2) and (6, 4) |
| Other tiles | Passable plain unless the authored map explicitly marks decorative, nonblocking terrain |

The escorts are temporary scenario formations. Their casualties do not secretly remove troops from the three main campaign formations. Raiders are scenario opposition, not a free reinforcement grant to the Western army. All positions, passability, reach, and attacks use the shared battle engine.

### Objectives and costs

- At each round end, the wagon advances one empty road tile if no hostile formation is orthogonally adjacent to its current or destination tile. It cannot stack with another unit.
- A raider may attack an adjacent wagon once per activation for 1 AP, removing one integrity. Use this explicit integrity rule, not the army percentage-casualty formula.
- Win by escorting the wagon to its exit. If both raiders are routed or defeated, resolve the remaining unobstructed delivery without empty turns.
- Lose the cargo if integrity reaches zero or the player withdraws. There is no forced round-limit failure.
- The standard escort packs 10 rounds: 3 Rice per round, costing **30 Rice**, plus two ammunition charges costing **20 Materials**. These are real campaign expenses, shown before dispatch.
- If either of the first two orders was correct on the first attempt, add **one earned bonus ammunition charge**, once. The message identifies its source: “Accurate planning preserved an extra charge for the escort.” This charge cannot be sold or refunded into Materials.
- The escort's gunners can demonstrate Suppress using a scenario-specific trained-escort flag. State that the final army needs Fire Discipline to use that command; introductory access does not unlock the final plan.

| Cargo result | Campaign reward |
|---|---|
| Delivered with integrity 3 | 60 Rice and 4 Authority |
| Delivered with integrity 1–2 | 30 Rice and 2 Authority |
| Lost, withdrawn, or skipped | No cargo reward; no additional arbitrary fine |

Return unused paid full-round rations once under the same supply ledger rules as the finale. The pre-encounter receipt, battle supply counter, and post-encounter receipt must reconcile. Tutorial instructions are free and never affect math attempts.

## 5. Three campaign-earned tactical plans

Choose **one** plan after the war chest is resolved and before deployment. Standard Deployment is always available. Plan cards appear earlier in the campaign with exact prerequisites and a short explanation of what they enable. No extra plan points, skill tree, or currency is introduced.

| Plan | Prerequisite | Battlefield ability | Trade-off |
|---|---|---|---|
| Flanking March | Restored/prepared road and Gifu secured | Hold one core formation in reserve; enter from a forward flank at round 3 | Only two core formations deploy initially. |
| Engineer Corps | Fieldwork tier at least 1 | Exchange the existing fieldwork placement for one pontoon crew | Forgo the defensive fieldworks; either side can use the completed crossing. |
| Fire Discipline | Arquebusiers have at least one funded equipment point | Unlock Suppress | Spend a normal attack and ammunition for control instead of full damage. |

### Flanking March

Select any one of the three core formations and a north or south entry. On round 3 it arrives on its side of the stream, then receives its normal activation through the round's initiative queue. It gains no bonus attack or movement.

Implementation coordinates are zero-based: Eastern entry (3, 0) or (3, 7); Western mirrored entry (6, 0) or (6, 7). If blocked, use a deterministic nearest-free passable entry on the same side of the stream, with Up/Left/Right/Down tie order. If none is available, defer and explain the delay. Never displace a unit or materialize it in the enemy camp.

Supply planning includes the reserve from the start. A pending reserve counts as an undefeated core formation: defeating the two deployed units cannot prematurely trigger the “all cores defeated” result. Camp-capture victory remains possible while a reserve is pending.

### Engineer Corps

Before deployment, choose the existing tier-based fortification placement **or** one pontoon crew attached to a spear formation. This is a use of the funded engineering project, not an extra hidden Materials charge.

The crew may spend 1 AP while adjacent to build one bridge at stream tile (5, 4) or (5, 5), zero-based. The target must be empty water. The bridge persists for the battle, uses normal bridge terrain rules, and can be crossed by either army. Building does not move the engineer, grant an attack, or create a second bridge. The selected crew cannot also receive the sacrificed fieldwork tiles.

### Fire Discipline

Suppress costs 1 AP and 1 ammunition charge, and uses the formation's attack for that activation. Apply the normal Volley's range and line-of-sight rules. Primary casualties are half the corresponding normal Volley result, using the displayed game-accounting rounding rule.

On a surviving, unrouted target, Suppress sets its movement allowance to at most one tile and prevents Charge during its next activation. It also prevents that target's unused retaliation for the current round, including retaliation to the suppressing shot. The status does not stack, and expires at the end of the target's next activation. A second suppression may refresh the next-activation status but cannot reduce movement below one. Normal Volley remains available when damage matters more than control.

Show the status and expiry on the unit card. At reduced range against an adjacent enemy, normal Volley penalties still apply. An empty ammunition stock disables both Volley and Suppress with an explicit reason.

### AI access and intelligence

The Western army may select at most one eligible plan using its funded campaign state. Flanking requires an intact route and Western-held Gifu; engineering requires a funded fortification order; Fire Discipline requires purchased gunner equipment. Store these prerequisites explicitly. Do not manufacture a free project to make the AI use a new ability.

Weather scouting retains its existing opening-rain benefit and additionally reveals more precise enemy intentions. It does not become a fourth tactical plan. Existing standard commands remain available without a plan.

## 6. A final battle with time to develop

### Duration and victory

The final board remains 10 × 8 with three core formations per side and conditional Kobayakawa participation. Keep 2 AP per activation and one primary attack per formation per activation.

1. **Delete the automatic five-round result.** Round 5 becomes a turning point, not the end of the battle.
2. **Keep earned objective victories.** Win by defeating/routing all three opposing core formations, including any scheduled reserve, or by holding the enemy camp uncontested at two consecutive round-end checks.
3. An uncontested camp has an occupying friendly formation and no orthogonally adjacent enemy. Show “Camp secured: 1 of 2 checks.” Vacating or contesting the camp resets that side's streak. Resolve simultaneous qualifying camp results as a draw; do not let iteration order decide the winner.
4. **After unresolved round 12, offer a Battle Council:** Continue fighting; Accept current outcome; or Withdraw. Continue never forces a draw. The player can reopen the council from the pause menu afterward; do not interrupt every subsequent round.
5. Accept current outcome uses the existing score: 40 for camp control, 15 per defeated opposing core, and up to 15 for surviving strength; a difference of at least 10 means victory or defeat, otherwise draw. Display both component totals before confirmation. An accepted score result is a settled outcome, distinct in the report from taking the camp.
6. Withdrawal remains available through the existing withdrawal rules. The normal battle has no wall-clock timer and no hidden later round cap.

The intended decisive range is approximately 8–12 rounds for balanced test states. A well-executed early victory is valid; increasing minimum mandatory turns would create another frustration. If battles last too long, tune damage, movement, AI objectives, or deployment before adding a forced ending.

### Opening, reinforcement, and recovery

| Timing | Expected development |
|---|---|
| Rounds 1–2 | Read the terrain, contest routes, preserve ammunition, and establish the front. |
| Round 3 | A selected flanking reserve enters; the smaller initial deployment becomes an active tactical choice. |
| Round 4 | Give a clear dispatch that Kobayakawa's decision is approaching. |
| Round 5 | Resolve Kobayakawa's allegiance with a portrait, banner, and short battlefield animation. |
| Rounds 6–12 | Exploit or respond to that decision; recover morale, resupply, and complete an objective. |

Kobayakawa's thresholds remain 0–39 Western, 40–69 inactive, and 70–100 Eastern. The existing auxiliary-entry fallback remains deterministic. The auxiliary arrives with its own scenario-provided supplies, explicitly described in the dispatch; its arrival must not silently increase the player's paid ration quota. It receives no unannounced free ammunition for core gunners.

Do not repeat a five-row weather array indefinitely or access undefined entries. The authored opening weather is explicit; after the last authored round, use a declared clear-weather fallback. The opening rain penalty applies only where authored, rather than returning every five rounds.

### Recovery rules

- Rally costs 1 AP and 10 Authority for +15 morale to an eligible living friendly formation. Permit at most three uses per army per battle, with two rounds between uses: a round-1 Rally is next available in round 3. An active, unrouted formation must issue it. Existing recovery from rout at morale 25 remains; shattered or exited units cannot return.
- Both armies pay from their own Authority. Show remaining uses and the next available round.
- Defend retains +4 morale, but may grant that gain only once per activation.
- Starting balance proposal: unsupplied combat effectiveness becomes 85% instead of 70%, and unsupplied round-end morale loss becomes 4 instead of 8. Charge and Forced Step still require supply. Food remains important, while one shortage need not end a developing battle immediately.

### Retaliation and damage clarity

A defender may inflict retaliation casualties only if it survives the primary hit, remains able to fight, and can legally reach the attacker with its own weapon and line of sight. Gun retaliation consumes ammunition. A formation can retaliate at most once per round; it spends no AP for that response.

Use the existing attacker-loss coefficients as the initial retaliation calculation, gated by those conditions. No eligible retaliation means zero return casualties and zero return-fire morale loss to the attacker; a Charge still pays its explicit morale cost. Suppress prevents the affected return fire as defined above. This removes invisible melee retaliation against a ranged shot without introducing a second combat subsystem.

Preview primary casualties and eligible retaliation as ranges derived from the actual seeded variance bounds and modifiers. The same legal-target and combat functions must drive preview, resolution, and AI evaluation. Hovering or selecting a target must not advance the random generator. Resolve the primary hit before checking defender survival and retaliation, and keep this order identical after loading a save.

### Readable enemy intentions

Show an upcoming-activation queue and a broad goal icon such as advance, defend camp, target gunners, or rally. With scouting, reveal the committed destination or target where that information exists. An intention is conditional on the board remaining legal: if a bridge is occupied or a target moves, log the reason for a changed plan.

Do not simulate an entire hidden enemy turn whenever a player hovers. Compute and store intentions at defined decision boundaries with deterministic tie-breaking. Keep scouting useful without promising knowledge of every future random outcome.

## 7. Logistics and diminishing rewards

### Rebalance the time scale

A campaign march period and a tactical battle round are different durations. Name both in the interface and use separate, data-defined rates:

| Quantity | v0.2 | Proposed v0.3 |
|---|---:|---:|
| Campaign ration capacity | 100 troops per Rice per period | 100, retained |
| Battle ration capacity | 100 troops per Rice per round | 300 |
| Final provision selector | 1–5 rounds | 1–12 rounds |
| Granary template durations | 3 or 4 rounds | 8 or 10 rounds |
| Ammunition | 30 Materials per charge; maximum 6 | 10 Materials per charge; maximum 12 |
| Equipment | 80 Treasury per point; maximum 2 per formation | Retained |
| Rally | Once per battle | Three paid uses, with spacing |
| Optional resupply | None | One paid delivery per army, 1–4 rounds |

The rates are abstractions for this game's economy, not historical claims about actual rice consumption.

For a core formation with T troops, its issued battle rations per round are ceil(T / 300). The army quota P is the sum of the three issued amounts. For n rounds, the packed requirement is exactly P × n.

| Army at packing | Issued rations per formation | Per round | For 12 rounds |
|---|---|---:|---:|
| 3,200 / 3,400 / 3,000 | 11 / 12 / 10 | 33 Rice | 396 Rice |
| 3,550 / 3,750 / 3,290 | 12 / 13 / 11 | 36 Rice | 432 Rice |

Freeze this quota from the battle-start core strengths after the existing strength caps. It includes a scheduled flanking reserve. Casualties do not change the purchased plan mid-fight; the ledger describes standardized issued rations, including wastage and support. This avoids recalculating a previously graded budget after every attack.

Use the same per-formation packing helper for campaign march reserves and the base field-army upkeep where they describe the same ration issue. This changes the screenshot army's base campaign quota from pooled 106 to issued 107 Rice before route modifiers. Display route surcharges separately as game accounting. Civilian and garrison requirements remain their own labeled quantities.

The final selector defaults to the greatest affordable coverage up to 10 rounds, counting protected Rice. Players can choose 11–12 if affordable. If no full round is affordable, explain the shortage and allow the existing deliberate unsupplied departure path. Do not award free mastery for a zero-quantity exercise.

Kobayakawa's auxiliary brings 12 rounds of its own rations from its arrival, tracked separately. If the battle continues beyond that allowance, apply normal unsupplied effects to the auxiliary without debiting core supplies. The convoy raiders similarly have a declared scenario allowance; neither becomes a source of invisible campaign-resource transfers.

### Preserve what the student correctly budgets

Ordinary development, recruitment, and diplomacy retain the existing benefit curve. Provisioning and purchases receive a separate, clearly labeled reward contract: **a completed correct or adviser plan delivers the full funded quantity; mathematical performance determines the earned dividend.**

| Completion | Ordinary scalable benefit | Supply/purchase dividend | Math mastery |
|---|---:|---:|---:|
| First correct | Existing full benefit plus its authored first-attempt bonus | 10% of the stated base commitment | 100 |
| Second correct | 85% | 5% | 75 |
| Third correct | 65% | 2% | 50 |
| Adviser completion | 50% | 0% | 25 |
| Unchecked plan / abandon | Existing applicable consequences | None | 0 |

The dividend contract applies to Provision the Aizu March, Establish Forward Granaries, final army provisioning, and Balance the War Chest. Existing first-attempt refunds for these transactions become this single dividend rule; they must not be applied a second time by an old effect handler. For the war chest, calculate the dividend on the Treasury cost of equipment actually purchased, not on unspent Treasury or Materials ammunition. Equipment and ammunition quantities do not disappear after a correct later answer.

This explicitly replaces the current supply-duration penalty. A student who correctly funds 12 rounds on the third attempt receives 12 rounds, with a smaller earned resource return. Difficulty and mastery consequences still distinguish the attempts.

Compute the dividend as half-up rounding of base commitment × rate to a whole game resource. This is automatic game accounting, shown in the receipt; the student is never asked to infer or calculate that rounding unless it is a declared skill.

For a 432-Rice plan funded entirely from available Rice:

| Completion | Rice packed | Earned Rice dividend | Net Rice spent | Supply delivered |
|---|---:|---:|---:|---:|
| First correct | 432 | 43 | 389 | 12 rounds |
| Second correct | 432 | 22 | 410 | 12 rounds |
| Third correct | 432 | 9 | 423 | 12 rounds |
| Adviser | 432 | 0 | 432 | 12 rounds |

Label the return as an **earned planning dividend**, not as proof that fewer physical rations feed the same troops. Require the full base commitment to be affordable before awarding it. Do not borrow against a future bonus.

Protected granary Rice is a previously paid pool. Redeem it first during final provisioning and charge only the remainder to available Rice. The final question can earn its own one-time planning dividend on the complete funded plan, including protected Rice: two different completed challenges may intentionally earn two rewards. Transferring Rice between pools, retrying a screen, loading a save, resupplying, or returning unused stores must never award another dividend. Persist a unique reward-issued marker per challenge.

For example, 360 protected Rice plus 72 newly committed Rice packs the 432-Rice plan. A first-correct final answer earns 43 Rice once. The receipt separates the 360 already paid, 72 newly paid, 43 earned, and 12 delivered rounds. It must not debit another 432 Rice.

For ordinary indivisible effects, show actual troops, tiles, or other whole units after the existing conversion. A generic percentage alone is insufficient when thresholds make the realized effect different. Locked tactical-plan prerequisites must be visible before an order, so a later-attempt result does not hide an important lost unlock.

### Spend, supply, and return exactly once

- Maintain separate available Rice, campaign reserve Rice, protected battle Rice, and packed battle Rice balances. Their transfers belong in a shared transaction ledger.
- At round start, move one paid pack from the unallocated pool to the current-round allocation and mark the side supplied. The untouched future-pack count decreases at this point. At round end, consume and clear that allocation; do not decrement the future pool again. At finalization, consume any current-round allocation once and return only untouched future packs. An incomplete final round does not create a free round of food.
- Display both “supplied this round” and “full rounds after this one” so zero remaining future rounds is not mistaken for current starvation.
- Once per army per battle, an active unit on its own camp may spend 1 AP to call a **Resupply** delivery of 1–4 rounds at P Rice per round, paid from uncommitted Rice. It arrives immediately for subsequent round allocation. It does not retroactively remove this round's shortage, add a math question, or grant a dividend.
- At battle completion, return unused paid future packs and uncommitted protected Rice once. Used ammunition remains spent; unused ammunition is not sold back in v0.3. Apply these returns before the realm ending score so the score uses the actual closing ledger.
- Western provisioning and ammunition purchases use the same rates and its actual remaining resources. Target 10 rounds initially, up to 12; ration, ammo, equipment, Rally, and resupply costs must be paid. Campaign AI reserves supplies when planning a longer battle instead of consuming every resource beforehand.
- A result preview, repeated completion command, resumed animation, or save reload must never spend or return a transaction twice. Receipts report the amount actually credited under the existing resource caps and identify any capacity-limited overflow.

This is a balance change to both armies, not a guarantee that every poorly prepared campaign can buy 12 rounds. The test gate is that an ordinary viable campaign can afford a useful longer fight without perfect answers or a single mandatory order sequence.

## 8. Exact mathematics as a content contract

### Default policy

Every template declares its assessed skill, units, allowed literal answer forms, and answer policy. The default is **exact value**. The simulation's use of integer Rice or integer casualties does not silently change the mathematical answer to a displayed question.

An intentional rounding task must state all of the following before the first attempt: why a whole unit is needed; rounding direction; unit or precision; whether grouping is per formation or pooled; the order of operations; and what happens to an already exact value. An estimation task additionally needs a stated target and acceptance range. v0.3 adds no incidental estimation exercises.

Rules, units, packing definitions, and examples that explain the question are free. They cannot be hidden in a penalized hint. Worked-solution assistance may retain its disclosed reward limit, but a student must be able to understand the complete problem without requesting it.

### Replace the two ambiguous prompts

**Aizu March, ordinary exact unit-rate task:**

> The quartermaster issues 36, 38, and 33 Rice to the three formations for each march period. How much Rice must be packed for 2 periods?

The answer is (36 + 38 + 33) × 2 = **214 Rice**, exactly. Troop counts may appear in the context table, but the question explicitly asks about the issued-ration schedule. It must not invite a second raw-troop rate calculation with a conflicting interpretation.

**Forward Granaries, ordinary exact unit-rate task under the new battle rate:**

> The three formations are issued 12, 13, and 11 Rice for each battle round. How much Rice must the granaries reserve for 8 rounds?

The answer is (12 + 13 + 11) × 8 = **288 Rice**, exactly. The other duration variant uses 10 rounds. Actual issued values come from the live army and the same packing function used by the transaction.

**Final provisioning, the deliberate rounding lesson:**

> One whole Rice ration supports up to 300 soldiers for one battle round. Rations cannot be shared between formations. For each formation, divide its soldiers by 300 and round up to a whole ration; keep an exact whole-number result unchanged. Add the formations' rations, then multiply by the number of rounds you selected.

Show a free example using different numbers: **750 soldiers need 3 rations; 900 soldiers also need 3.** Mark the skill as rounding up to complete ration packs. Interpolate the actual capacity from balance data; never hard-code an obsolete 100 into the prompt or adviser explanation.

Do not display the answer being assessed in a pre-answer cost forecast. Before grading, show the operands, selected duration, complete rules, and dividend schedule. After grading, reveal the exact requirement and itemized receipt. Affordability checks must not reject an incorrect answer by comparing that answer with the purse; grade mathematics independently of the transaction.

### Answer entry and grading

Accept equivalent literal values when notation is not the assessed skill. Examples for an exact answer of 321 are 321, 321.0, +321, and 642/2. Accept ordinary decimals and simple integer fractions using exact rational comparison. No general expression evaluator, executable input, or floating-point tolerance guess is needed.

| Entry situation | Required behavior |
|---|---|
| Valid equivalent integer, decimal, or fraction | Grade by exact value, not string spelling. |
| Correctly grouped thousands, such as 1,234 or 1,234.5 | Parse as the stated value. |
| Malformed grouping, such as 3,21 | Explain the separator problem; do not strip it into 321. |
| Empty input, invalid characters, or denominator zero | Format feedback; no attempt, Seal, payment, or reward loss. |
| Well-formed but numerically wrong value | Use an attempt and provide the appropriate mathematical feedback. |
| Negative value in a positive-quantity question | Treat as a mathematical answer, then grade its value; do not debit it as a resource. |
| Requested representation is itself the skill | State that requirement first and grade it explicitly. |

For v0.3, the literal grammar includes signed integers, decimal literals, and simple integer-numerator/positive-integer-denominator fractions. Mixed-number notation, scientific notation, and arbitrary expressions are not required; the field explains which supported format to use without evaluating the unsupported expression. Bound input length and rational-component size without silently rounding a large value.

Provide touch-accessible decimal and fraction entry. A numeric keyboard that hides the required separator cannot be the only input path. Keep a visible units label outside the input; students should not have to type “Rice.”

### Separate mathematical answers from resource transactions

The current source can use a raw entered supply answer in payment handling. Expanding the parser without changing this path would risk fractional or excessive debits. v0.3 must separate these concerns:

1. Validate notation without mutation.
2. Grade a well-formed answer against the frozen exact problem.
3. Record the appropriate attempt and assistance state.
4. Execute a funded order only through its validated transaction contract.

For fixed activation-cost orders, retain the existing first-valid-submission cost behavior. For quantity-based Aizu/granary supply orders, spend the Command Seal on the first valid submission but transfer Rice only when a correct plan, adviser plan, or explicitly confirmed unchecked plan executes. A wrong numeric entry never becomes a debit. Keep the modal exclusive so another action cannot consume its funding between grading and execution.

Before starting, check that the intended plan is fundable without exposing the asked-for total. If a deliberately changed plan becomes unaffordable before the first submission, regenerate or return to planning without an attempt penalty. After the first submission, freeze operands, attempt history, and plan selection.

Rename a non-assessed “Proceed with estimate” escape option to **Use an unchecked plan**. State that it earns no mastery or dividend. If its proposed spend is fractional but the resource must be whole, require the player to enter an explicit affordable whole spend; do not round it on their behalf. Determine funded full packs from that spend, show the result before confirmation, and return any unused remainder. This is an administrative consequence, not an undisclosed rounding answer key.

Cancellation returns only amounts actually paid under the applicable rule; it does not invent a refund for a deferred payment. Preserve the existing loss of a spent Seal. Final preparation uses its existing no-Seal context and the same separation of grading from payment.

### Resolve every audited template

This table is an implementation checklist. All 48 authored variants must remain represented and revalidated after edits; the audit's old answers are baseline evidence, not replacement keys for changed v0.3 operands.

| Template | Required v0.3 treatment |
|---|---|
| math_c1_labor | Retain exact ratio allocation; validate each whole-person result and the total. |
| math_c1_tax | Retain exact percentage calculation; validate integral authored results. |
| math_c1_road | Require area exactly divisible by coverage; remove silent ceiling from the exact answer path. |
| math_c1_letters | Retain exact ratio allocation and total conservation. |
| math_c2_provisions | Replace raw troop conversion with given issued rations; exact addition and multiplication. |
| math_c2_perimeter | Retain exact perimeter; validate dimensions and units. |
| math_c2_muster | Retain exact percentage; test the live troop counts created by every reward tier. |
| math_c2_allies | Teach exact fraction comparison/cross multiplication, or authored terminating rates; no assumed decimal rounding. |
| math_c3_march | Retain exact elapsed time; require divisible/representable generated operands. |
| math_c3_stores | Require whole-lot divisibility unless remainder reasoning is explicitly taught. |
| math_c3_gifu | Retain exact ratio allocation and total conservation. |
| math_c3_relief | Retain exact percentage and complement; validate their sum. |
| math_c4_kobayakawa | Retain exact ratio allocation; show actual commitment gain after game conversion. |
| math_c4_granaries | Give issued battle rations at the new rate; use 8/10-round variants; preserve full funded reserves. |
| math_c4_fieldworks | Retain exact area × rate; preview the actual fieldwork tier and plan eligibility. |
| math_c4_weather | Retain exact probability-product comparison; avoid approximated intermediates. |
| math_audit_stores | Retain exact ledger arithmetic; display resource categories consistently. |
| math_crisis_famine | Retain exact relief ratios; validate allocation conservation. |
| math_crisis_rebellion | Retain exact percentage. |
| math_crisis_flood | Retain exact area × rate. |
| math_crisis_plague | Retain exact percentage; separately validate subsequent labor reallocation. |
| math_crisis_raid | Retain exact perimeter. |
| math_battle_provision | Keep the intentional rounding tag; teach complete 300-troop packs, grouping, boundaries, and periods explicitly. |
| math_battle_warchest | Retain exact remaining-Treasury subtraction; bind to actual equipment cost and new dividend handling. |

Validate after live campaign state replaces fixture operands, before presentation. A failed content invariant is a content error with no student penalty. The release should prevent these states; runtime handling must preserve the order and resources rather than quietly rounding an answer to make the question fit.

## 9. Campaign feedback, crises, and endings

### Make preparation visible

Each order result should answer three questions in a short receipt: what changed, what it enables, and what remains constrained. Use actual values and a small visual change, not a generic success paragraph.

Examples:

- “Road restored. Flanking March now needs Gifu.” Show the repaired road on the map and update the plan card.
- “Fieldworks funded. Choose defensive positions or a pontoon crew before battle.” Show the engineering icon on the army card.
- “Gunners equipped. Fire Discipline available.” Show the equipment marker and the Suppress command preview.
- “288 Rice reserved; 29 Rice earned; 8 battle rounds protected.” Show the resource transfer and wagon animation once.
- “Kobayakawa commitment: 68 → 74. Expected allegiance: Eastern.” Show the actual threshold crossing, without claiming that every historical outcome is predetermined.

Store the originating challenge/order ID with these effects. The ending can then say what a particular successful calculation enabled. A player should be able to identify a causal chain from order to resource or capability to battlefield event.

Do not show the answer to a pending math question in a side panel, affordability tooltip, accessible label, or live receipt. Pre-answer previews can show possible benefits and prerequisites; final numeric transaction receipts follow grading.

### Crises remain consequential and understandable

Retain the current five crisis types, existing risk calculation, response choices, and one-major-crisis-per-chapter limit. Lower Rice, Treasury, Authority, public order, and infrastructure continue to affect exposure or the ability to respond through the existing rules.

Add a compact council risk explanation naming the largest current contributors, for example “Low food reserve; unpaid wages.” Show the modeled chance band if the interface gives a probability, and state that a chance is not a certainty. Do not invent a separate punishment roll merely because an answer was wrong.

Before a crisis response, show its actual affordable cost and expected mitigation. Preserve the existing once-per-campaign emergency substitution: 10 Authority can cover up to 60 missing Treasury or Materials, not Rice. Essential mathematical conditions remain free here too.

A weak answer can leave fewer resources, a narrower choice, or a less effective response. Avoid a new cascading disaster system in this version. First establish that the existing system remains survivable under mixed mathematical performance and the longer battle economy.

### Good, Normal, and Bad endings

Retain the existing tier function so the proposal does not silently redefine success while rebalancing combat:

| Tier | Existing rule retained |
|---|---|
| Good | Battle victory; math mastery at least 75; Realm Score at least 70; no collapse; at most one unmitigated crisis. |
| Bad | Collapse; or defeat with Realm Score below 60; or mastery below 35 and Realm Score below 50; or disordered withdrawal with Authority below 25. |
| Normal | All other outcomes. |

Keep the current mastery aggregation and realm components. Update their battle inputs for longer duration, returned unused stores, reserves, and the finalized result. Introductory combat is not a math checkpoint and does not add mastery points or count as the final battle result. Its real resource consequences may affect the realm naturally.

Add short authored clauses for convoy delivery, the selected plan and whether it mattered, the coalition decision, and whether victory came from camp capture, defeating formations, or accepting the battle council's score. Reuse the existing three ending illustrations; add a compact campaign timeline and the strongest two or three causal observations.

Examples of the intended specificity are “Your engineering investment opened the southern crossing” and “The relief convoy arrived damaged, but its grain sustained the realm.” Do not credit an unused ability or claim that one wrong answer caused a defeat when the event record does not establish that connection. All ending text is authored and assembled locally.

## 10. SNES presentation, touch, and sound

Keep the existing art direction, compact portraits, palette, pixel scale, map style, and reference layout. Continue to use a 640 × 480 logical interface with crisp low-resolution assets where the existing rendering pipeline supports them. Preserve the final 10 × 8 board; scenario dimensions are data rather than a new visual style.

### Required visual behavior

- Distinguish cavalry, spears, and arquebusiers by silhouette and icon as well as color. Formation flags and commander identity remain visible.
- Clearly separate the active unit, an inspected unit, reachable tiles, legal targets, and a proposed destination. Selecting a target is not itself a commitment.
- Show primary damage, retaliation, ammunition cost, relevant terrain, and status changes before a committed attack. Blocked actions explain why.
- Keep the activation queue compact. Show camp-hold progress, present-round supply, future coverage, and ammunition without covering the grid.
- Give movement, Volley, impact, routing, reinforcement arrival, and resource awards brief, distinct animation and sound. Use approximately 150–400 ms action effects, with fast/skip and reduced-motion options. No animation should delay the next meaningful input unnecessarily.
- Use a prominent round-5 coalition dispatch, then return promptly to the board. The tactical state determines the event; the animation does not.
- Offer persistent volume controls and an immediate mute. Start audio only after a valid user interaction on touch devices.
- Preserve large touch targets, readable text, keyboard access, and visible focus. No hover-only instruction, drag-only essential command, color-only status, or precision tap on a tiny sprite.

### Bounded art and audio work

| Asset | Proposed scope |
|---|---|
| Convoy scene | One small landscape illustration, approximately 320 × 180, using the existing palette |
| Wagon | One 24–32-pixel sprite with three readable damage states |
| Formation motion | Reuse existing units; add a few movement/attack/route frames, packed into small atlases |
| Tactical symbols | Approximately six small icons for reserve, engineer, suppression, supply, intent, and capture progress |
| Pontoon | One bridge tile/overlay consistent with the existing terrain |
| Battle feedback | Small hit, smoke, muzzle-flash, and reinforcement effects; no full-screen particle system |
| Audio | One short convoy loop or variation of an existing theme, a final-battle phase variation, and a small set of distinct effects |
| Endings | Reuse three tier illustrations; add text and timeline presentation |

Prefer reused assets and code-drawn grid overlays. Target no more than 3 MiB of added runtime art/audio and retain the existing approximately 35 MiB runtime-package target. Measure the actual baseline and output; a source archive with design materials is not the same as the installed runtime size. Do not solve readability by shipping large upscaled images or adding runtime asset downloads.

## 11. Technical design and compatibility

### Extend the existing project

Retain the installed TypeScript, Phaser, Vite, local persistence, content validation, and existing Windows/web packaging architecture. Do not upgrade libraries or rebuild the UI framework simply to implement this proposal. Framework versions and device support are to be verified from the working project during implementation.

| Area | Required change |
|---|---|
| Content and balance | Add explicit ruleset version, scenario definitions, per-context ration capacities, reward contracts, plan prerequisites, and round-review rules. |
| Math engine | Exact literal parsing/comparison, answer-policy validation, issued-ration operands, deliberate packing lesson, and dynamic-input guards. |
| Order reducer/effects | Separate grading from payment; preserve full funded quantities; issue each dividend once; provide reconcilable receipts. |
| Battle engine | Scenario dimensions, wagon objective, two-check camp capture, reserves, plan actions, retaliation eligibility, recovery, and optional continuation. |
| AI | Paid longer-range provisioning, plan eligibility, lawful new commands, reserve/camp awareness, and deterministic intentions. |
| UI | Exact instructions and touch entry; plan cards; early encounter; action previews; duration choice; supply/status/intent display. |
| Persistence | New schema and migration; safe mid-battle boundaries; complete reproducible state. |
| Reports | Keep intro and finale results separate; attribute benefits to orders; update duration-dependent statistics. |
| Practice mode | Support the new battle rules and plans while keeping practice state isolated from the campaign. |
| Packaging | Rebuild each existing delivery path and verify downloadable artifacts, including ZIP compatibility. |

Use a battle scenario ID and a return context rather than pretending the convoy is the finale. Keep a distinct intro encounter record and final battle result. Share movement, turn order, attack legality, resource accounting, and rendering wherever the rules are the same; scenario-specific objectives belong in small explicit handlers.

### State that must be explicit

Store the ruleset/scenario IDs, current round, queue and active index, AP and attack/retaliation flags, current-round supply allocation, untouched future packs, frozen ration quotas, ammunition, plan selection, pending reserve entry, camp-hold streaks, suppression expiry, Rally uses/cooldown, resupply-used flag, auxiliary allowance, committed intentions, random seed/step, and whether the optional council has been offered.

For the convoy also store wagon location/integrity, paid loadout, earned charge provenance, reward-issued flag, and exact suspended campaign context. For mathematics, store frozen operands, exact answer policy, submitted attempts, assistance, paid amounts, and dividend-issued identity. Avoid deriving consumed resources again from an animation or UI message.

### Remove every assumption that a battle ends at five

Search and update balance data, battle constructors, round checks, save schemas, runtime invariants, weather lookup, supply selectors, AI provisioning, UI labels, report denominators, practice-mode controls, tests, and documentation. Extending one constant is insufficient: the current save validation itself limits the battle round to five.

Round number is a positive bounded storage integer, not a gameplay deadline. Every authored per-round lookup has a fallback. Longer battles must not create infinite event-log growth inside a single command, an unbounded AI search, or a blocked interface.

### Save and resume during battle

Enable manual and automatic saves after a complete tactical command and at round boundaries, including during the convoy. Do not serialize half an attack, half a transfer, or a partially applied AI action. Pause new commands while committing a save snapshot; visual effects may complete or be skipped without changing simulation state.

On load, preserve the same future random outcomes and legal options. Replaying a queued animation must not repeat damage, cost, mastery, resource dividends, delivery rewards, or world-phase effects. A battle that can last 25 minutes is incomplete as a product feature if students cannot resume it reliably.

### v0.2 save migration

Introduce a new save schema/ruleset version. Keep a recoverable copy of the original save before writing a migration; never overwrite the only copy. Validate both source and destination checksums/structure.

| Legacy situation | Migration behavior |
|---|---|
| Completed campaign | Preserve existing answers, scores, endings, and reports. Do not retroactively regrade or rebalance it. |
| Unstarted/new ordinary question | Generate using v0.3 wording, policies, and live data. |
| Unresolved ambiguous Aizu/granary question | Reset that affected challenge once, refund its recorded paid Rice and spent Seal as applicable, remove only its unresolved commitment, and present the corrected version. Record the repair so reload cannot repeat it. |
| Other in-progress question | Preserve attempts, frozen operands, payments, and help state; migrate its declared answer format without granting a new first attempt. |
| Chapter 1 before encounter trigger | Schedule the convoy normally. |
| Chapter 1 past trigger, or Chapter 2 onward | Mark the introduction skipped for a legacy run; do not unexpectedly insert it or issue cargo rewards. |
| Completed granary/march purchase | Preserve the actual existing Rice reserve; do not award retroactive v0.3 dividends. |
| Final battle prepared but not started | Convert already packed supply by actual remaining Rice value, then use the v0.3 rules; preserve completed prep grades and equipment purchases. |
| Active legacy battle, if present in an imported/exported save | Preserve positions, troops, AP, active queue, RNG, and already resolved coalition allegiance; convert remaining packed Rice as below. Default new plan to Standard and new counters to unused/zero. |

For legacy battle supply, calculate remaining paid Rice from its old remaining pack count and its old frozen quota at 100 troops per Rice. Convert that value to the maximum whole packs under the new quota at 300 troops per Rice, returning only the remainder to available Rice. If a round is in progress and the legacy side was supplied, allocate one converted pack to that round and retain the rest for future rounds. Carry no more current-round charges than the old state legitimately owed. This conversion conserves the outstanding physical Rice value; it does not simply multiply a displayed counter without accounting.

Already resolved Kobayakawa decisions stay resolved, including inactivity. Move only a pending decision to round 5; if the imported state is already beyond its new trigger, resolve it once at the next safe boundary. A legacy used Rally consumes one of the new three uses, and its last-use round is retained where known or conservatively set to the current round. Do not reset a used recovery ability to three fresh uses.

If a legacy save lacks enough information to reconstruct paid supply or a deferred payment safely, preserve the original and explain the specific unsupported state. Do not invent a resource balance or corrupt the file to make migration appear successful. Implement and test the reachable legacy formats before claiming general compatibility.

### Offline and platform behavior

No runtime network dependency is added. Include all art, fonts, sound, game data, and code in the offline bundle. Preserve local save export/import so work can be moved or backed up without an account.

The Windows standalone HTML edition must still launch without unzipping the source package. Retain the native Windows build target and report its actual build/validation status. For the iPad web-app path, document initial installation/cache preparation separately from subsequent offline play; do not claim that opening an arbitrary ZIP in Files installs an offline PWA. Test the complete installed game with network access disabled and an existing local save.

## 12. Implementation milestones and review gates

Each milestone extends the same playable project. Keep a brief change log of tuned values and their reason. Do not drop required systems when one milestone is more difficult than expected.

| Milestone | Work product | Gate before proceeding |
|---|---|---|
| M1 — Mathematical fairness | Corrected prompts, exact answer policies/parser, dynamic guards, transaction separation, concrete reward contracts | All 48 variants and live boundary cases pass independent exact checks; no ambiguous supply grading or input-driven payment. |
| M2 — Longer viable finale | Optional continuation, capture streaks, food/ammo rebalance, retaliation, recovery, ledger and mid-battle saves | Round 5 continues; round 12 offers a real choice; extended play, costs, resumption, and AI legality work together. |
| M3 — Playable engagement segment | Convoy, three plans, prerequisites, source-attributed rewards, initial enemy intentions | Play the opening through convoy and receipt, and each plan in practice; observe whether students understand and use the choices. |
| M4 — Presentation and campaign payoff | New compact assets, animation/audio, touch polish, crisis explanations, ending clauses/timeline | Effects make state clearer; all four chapters and three ending tiers remain reachable; no answer leaks. |
| M5 — Whole-game validation | Migration, deterministic saves, campaign balance, real-device/offline tests, accessibility checks | Required technical acceptance cases pass; unresolved gameplay/device limitations are documented accurately. |
| M6 — Delivery | Versioned standalone HTML, offline web package, full source/spec package, release notes and verification record | Downloaded files match recorded sizes/hashes and extract/run correctly; platform claims match testing. |

At M3, test a genuine 10–15-minute opening segment with target students before spending most of the remaining effort on polish. If the segment is confusing or dull, change the timing, clarity, encounter pressure, or rewards within this scope. Do not respond by adding another civilization, dozens of questions, or more menus.

Use practice mode to compare the three plans under matched starting resources. The full campaign must also prove that each plan can be reached through normal legal orders; a developer-only toggle is not implementation of a campaign unlock.

## 13. Acceptance and playtest matrix

### Technical release requirements

| Area | Required evidence |
|---|---|
| All math | Each of the 24 templates and both variants has a declared policy; exact independent calculations agree with generated keys. |
| Live supply | Test 3,550/3,750/3,290, exact capacity multiples, several partial formations, all reward tiers, recruitment, and losses. Exercise residue boundaries for both 100- and 300-troop capacities. |
| Rounding lesson | Exact multiples remain unchanged; per-formation packing differs correctly from pooled packing; instruction, example, solver, and receipt agree. |
| Notation | Equivalent decimals/fractions pass; malformed commas and denominator zero give harmless format feedback; valid wrong values consume only the intended attempt. |
| Hidden future rounding | Non-divisible road/lot fixtures fail the exact-content guard; ratio, percentage, and elapsed-time guards run after live binding. |
| Exact comparisons | Both ally and weather variants have a unique exact winner; no rounded-intermediate comparison changes it. |
| Payment safety | Wrong decimal/negative/large answers cannot debit resources; deferred quantity costs, cancellation, dividends, and protected-pool transfers reconcile. |
| Reward promises | A correct later answer delivers the full purchased supply; actual whole-unit results are shown for other orders; one challenge cannot issue a dividend twice. |
| Battle duration | An unresolved round 5 advances; round 12 offers Continue/Accept/Withdraw; continuing past 12 and past the old weather data does not end or crash the battle. |
| Objectives | Camp capture requires two consecutive checks; contest resets; simultaneous results are defined; a pending reserve prevents premature all-core defeat. |
| Plans | Prerequisites arise from normal play; one plan only; reserve entry is legal; bridge works for both sides; Suppress expires/refreshes as specified and costs real ammunition. |
| Combat | Melee cannot retaliate at illegal range; gun return fire costs ammo; one retaliation per round; preview bounds cover real results without consuming RNG. |
| Logistics | 396/432-Rice 12-round examples reconcile; current versus future packs are clear; resupply is paid and once-only; unfinished-round and end refunds cannot duplicate. |
| AI fairness | AI pays the same prices, obeys the same action legality/cooldowns, uses only earned prerequisites, and replans invalid intentions visibly. |
| Convoy | Win, damaged delivery, loss, withdrawal, and skip all return correctly; reward and first-correct ammunition issue once; no extra Seal, math grade, crisis, or final ending. |
| Saves | Resume after player and AI commands, round boundaries, reserve arrival, suppression, Rally, resupply, camp streak, and convoy completion without duplicated events or altered RNG. |
| Migration | Original remains recoverable; affected ambiguous orders repair once; prior completed records remain unchanged; remaining paid supply conversion conserves value. |
| Endings | Good/Normal/Bad retain their stated conditions; intro combat is excluded from mastery/final result; closing resources include legitimate returned stores. |
| Practice mode | New features use the production battle engine; exiting restores the untouched paused campaign and its RNG/resources. |
| Windows and iPad | Play opening, numeric/fraction entry, convoy, full finale, save/load, mute, and reduced motion on actual target devices/browsers, including landscape touch. |
| Offline | An installed/cached build completes a campaign with networking disabled; no missing font, sound, art, or save dependency. |
| Packaging | Use a conventional ZIP method compatible with WinRAR; verify CRCs and extraction, then verify the retrieved download's size/hash against the published artifact. Provide the standalone HTML separately. |

Re-run existing required gates and add tests for these actual risks. Do not interpret the previous build's passing test count as evidence that new rules work. Separate automated results, desktop browser observations, real-device checks, and student playtest findings in the verification record.

### Balance scenarios

Use recorded deterministic seeds and representative legal campaign routes:

- Strong mathematics with distinct spending priorities: economic, engineering, military, and diplomatic routes should produce visibly different final opportunities.
- Mixed first-, second-, and third-attempt success: an ordinary well-managed campaign should reach a viable battle, with an achievable Normal ending and a possible Good ending when the existing thresholds are met.
- Weak mathematics with adviser help: the player should still have comprehensible choices and a route to continued play; strong tactics should matter even when a Good ending is no longer mathematically possible.
- Strong mathematics with poor positioning: resource advantage should help, but should not automatically beat reckless play.
- Low supply and a prolonged fight: shortage, Rally, resupply, withdrawal, and accepting an outcome should all remain legal and understandable without an infinite forced wait.
- Each plan versus matched opposition, plus Standard Deployment: no plan should be mandatory for victory, and the new mechanics should not produce a dominant repeatable lock without meaningful cost.

Check viable budgets across the whole campaign before tuning only the final battle. A 12-round food price is not affordable merely because a developer can inject enough Rice in practice mode.

### Student playtest

Start with approximately six students spanning mathematical confidence and familiarity with strategy games. This is a small qualitative test, not proof of broad market appeal. Observe the first session without explaining an undisclosed rule for the game.

| Observation | Initial success target |
|---|---|
| Entry into play | Tactical interaction normally begins within 10–15 minutes. |
| Fairness | No student loses a graded attempt because a required rounding/estimation rule was missing. |
| Cause and effect | At least five of six can explain one way their preparation changed a battlefield option or outcome. |
| Strategy | Students voluntarily inspect terrain, supply, intentions, or a different action rather than only hunting the next answer field. |
| Replay interest | At least four of six voluntarily want to try another plan or improve a decision; ask after observation, not through a leading prompt. |
| Pacing | Balanced finales often resolve around 8–12 rounds, without a complaint that the game forcibly stopped an unfinished plan. |
| Recovery | A setback leads to a considered response at least some of the time, rather than immediate abandonment. |

Record where attention drops, where students need help, which choices they notice, and whether animations clarify or slow play. Keep reading/calculation time separate from tactical decision time. A short tactical battle can still be successful if the objective was earned; a long battle can still be boring if the player has no useful decisions.

## 14. Main risks and tuning boundaries

| Risk | Response within this proposal |
|---|---|
| A longer battle becomes repetitive | Use objectives, reserves, readable enemy pressure, and the optional outcome council. Tune movement/damage before expanding the map. |
| Softer supply penalties remove all challenge | Test mixed-performance routes; tune dividends, ammunition, and shortage modifiers while retaining full correctly purchased quantities. |
| New abilities overwhelm beginners | Introduce only one in the convoy, choose one final plan, show contextual commands, and retain Standard Deployment. |
| Suppress or repeated defense creates a stall | Enforce ammo/attack costs, status limits, once-per-activation morale gain, and paid limited Rally; test control loops explicitly. |
| Protected supplies create accounting exploits | Use explicit pools, challenge reward identity, immutable receipts, and idempotent end-of-battle returns. |
| Forecasts give away math answers | Audit the visible UI and accessible labels; reveal the asked-for total only after grading. |
| Smaller resource rewards feel trivial | Emphasize actual capabilities and threshold changes; adjust bounded dividends after observation rather than adding a new progression system. |
| Intro battle makes the campaign too long | Keep two escorts, two raiders, one objective, fast delivery after resistance ends, and repeat-run skip. |
| New save fields damage existing campaigns | Backup, deterministic migration, and reachable legacy fixtures before promising compatibility. |
| Art or sound breaks the lightweight target | Reuse existing assets, pack atlases, compress short audio, and measure the real runtime bundle. |

The version is ready for a further build only when its documented mandatory systems are present and its unresolved limits are explicit. A functioning build and a positive student response are separate claims; the release record must distinguish them.

## 15. Handoff and source basis

The next implementation request should use the original ASTRA_BUILD_PROMPT.md and package as the baseline, then apply this document's explicit v0.3 overrides and milestones. Preserve the existing implementation, required systems, and feedback decisions. Complete M1–M6 in order, recording actual tests and tuned values. Do not treat this proposal as authorization to silently publish an online service or redesign the project.

This proposal was developed from the following project materials:

- Sekigahara_0.2.0_Repaired.zip, verified delivered source; SHA-256 12d3196b6606fe745c2eda4c93cd3006d156408bbf111cffb45eac01243a5846.
- Sekigahara_Math_Rounding_Audit_0.2.0.md, completed 14 September 2026: all templates, fixtures, dynamic values, parser, and reward paths.
- Sekigahara_Feedback_2026-09-14.md and the supplied granary screenshot, including the correction that the battle complaint concerns time.
- Existing implementation decisions, balance and battle data, math/order reducers, combat, scoring, battle UI/practice mode, and save repository/schema behavior.
- The latest design discussion: earlier tactical play, campaign investments that unlock different tactics, more room for a battle reversal, and a small student-facing test of engagement.

No v0.3 playtest results, performance measurements, migrated saves, artwork, or executable build are represented as complete by this document.
