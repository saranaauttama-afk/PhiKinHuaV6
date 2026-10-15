# Ghost decision improvements — 16 October 2026

Owner authorization: expand card depth on both sides and implement the reviewed redesign from main. This is a bounded refinement of the existing public-board planner, not a new difficulty rule, hidden-information advantage, or full combat search.

## Confirmed problems and changes

| Before | Now | Reason |
|---|---|---|
| Scratch board omitted minions, equipped cards and class | Copies their visible board state | Guard, sweep and passive armor matter when choosing an attack |
| Attack score treated all hits as damage to the player | Applies hits individually to the first available guard, then block/HP; sweep also damages each surviving player minion | A guarded charge must not claim a player kill; removing support minions is useful |
| Hand position chose which ordinary attack hit a guard | Lower raw total damage comes first within the ordinary attack phase when a guard is available | The ghost can spend a small hit to open the large one, without enumerating permutations |
| Drain provided no healing value | Adds only actual estimated player HP loss, capped by missing enemy HP | Guard damage and block damage cannot heal the ghost |
| Charged equipment ignored when checking charge lethal exception | Applies visible damage cap before dodge/block, death save after lethal damage, and carries charge exhaustion through hits/cards | Prevents false lethal releases and premature line termination |
| Dodge ignored when checking charge lethal exception | Consumes visible dodge per hit in the scratch board | A dodged hit cannot justify prematurely releasing a charge |
| Entangled attack could still score its heal/status | Rejects the whole attack card | Matches `resolveEnemyCard`, which cancels all its effects |
| Block always followed attacks | Non-damaging block precedes attacks when the hand contains a self-block conditional payoff | New and existing block/payoff packages can actually work in one turn |
| Each summon valued an original-state empty slot; at capacity still received positive flat value | Updates scratch minion slots; values new minion minus the oldest minion displaced at capacity | Stops redundant replacement of a healthy identical summon and overcounted vacancies; wounded replacements remain possible |
| Retention recognized payoff, but not its setup or summon cards | Both halves receive pairing priority; summon cards receive their positive marginal board value | Wider decks need useful held cards, without changing capacity, age or draw rules |

The minion estimate combines remaining taunt HP, at most two turns of printed act value, and charge support when a charge card is held. These are AI utility weights only: they do not change combat values, minion lifespan or difficulty multipliers. Identical healthy replacement has zero marginal value. A newly summoned minion is inserted into the scratch queue, so later summons see the correct oldest occupant.

## Guarantees and limits

- Same deterministic fixed-phase subset search: at hand four, at most 15 nonempty subsets; at hand five, at most 31. No turn tree, opponent prediction or draw sampling. Minion hit work is bounded by the existing slot limits and printed hit counts. Stops extending a lethal line.
- Reads own held card definitions/ages and public combat state. Does not access player piles, master deck, counters or RNG. It does not infer future draws from enemy piles either.
- AP checks, physical hand indices, duplicate-copy ages, charge-full waiting and emergency-heal exception, status setup-before-payoff, armed-riposte block rule, maximum waiting and idle tracking remain in place.
- Cross-turn behavior is retention plus a short **heuristic** valuation of persistent summons. There is no deep strategic search. Guard ordering is one deterministic heuristic, not an exhaustive ordering solver.
- This is still a partial scratch model. It does not replay reflected thorns, counter reactions, all passive triggers, exact status stack rules, or end-turn effects. Visible equipment's passive armor is included via the existing damage calculation. Damage-cap and death-save equipment use the runtime lookup, thresholds, charge defaults and first-matching-item semantics; spent scratch items leave the equipped list without accessing player piles. Sweep and guard damage bypass these player equipment activations exactly as in resolution. Defense danger and status values remain estimates. Riposte gating retains its existing strict block comparison; it does not fully evaluate every guard/dodge/riposte interaction.
- Sum-of-positive-step utility pruning remains: a zero-value immediate setup is not explored merely for speculative later benefits. Card order can therefore be suboptimal in unusual mixed-effect hands. No claim of optimal combat play.

## Verification

`test/card-depth-strategy.test.ts` uses temporary restored card definitions so the assertions test behavior, not unstable tuned card numbers. Twelve cases cover block-before-payoff resolution; guard ordering; false lethal charge into guard/dodge; wounded drain versus guard; sweep against support minions; entangle cancellation; healthy/wounded replacement; in-sequence summon capacity; setup and summon retention; no mutation, hidden-data access traps, AP bound and repeated deterministic hand-five choices.

Initial focused run: 12/12 passed, 145 ms total; 100 repeated five-card choices comfortably within the 3-second regression ceiling. Existing `enemy-hand-v34` and `ghosts-night1` behavior tests also passed; their two old deck-size assertions were obsolete while the expanded data was landing. Root coordination owns updating those data contracts and full-suite / paired 120-run balance validation. Bot results remain a balance diagnostic; physical-device play still decides whether fights read well.

### Independent-review follow-up

The reviewer reproduced a false charge-lethal exception: player HP 5, equipped `arm_prajiad` with three charges, and an unfinished charge dealing 9. Real resolution caps it to 4, leaving HP 1. The scratch model now retains that charge; it also respects `takrut` death save and continues searching after the save instead of prematurely declaring lethal. Charge consumption is carried across both hits and cards. Five regression tests compare planner choice with real resolution, including cap-before-dodge ordering, exhausted equipment, saved HP/block, and uncapped sweep damage. Focused suite: 17/17 passing (111 ms).

Ghost-card data currently contains no `cleanse` effects (base, conditional or charge); no speculative cleanse scoring was added. If introduced later, cleanse needs both debuff-aware utility and scratch removal before later attacks, rather than a flat bonus.


### Final bounded draw cadence

After the planner changes, separate simulations tested increased exposure. The selected `ENEMY_DRAW_CADENCE` is +1 draw every third actual ghost turn, only for night-two-plus elites/bosses. `enemyDrawCadence` is shared by resolution and the Thai hand-detail explanation. Base draw, saved custom draw, AP, retain and hand cap remain unchanged. Parameterized tests cover nights 1–3, all three encounter kinds, turns 0–9 and four occupied-hand cases; an additional JSON-roundtrip case preserves a custom base draw of one. All paired first-night records stayed identical during the isolated cadence comparisons. Final results, including phase-two interleaving, are in BALANCE.md.
