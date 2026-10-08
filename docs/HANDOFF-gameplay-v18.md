# v1.0.18 / Android 19 — tactical first chapter

Branch: work/occupation-table. Base: 5507a7660775da82758e58b86ba43981cf6a8808.

## Gameplay

All five authored ghosts in the first chapter use a small-hand budget search. They draw 4/4/5 and spend 3/3/4 energy across the three fights, choosing useful attacks, guard, healing and their existing poison/weakness/multi-hit/strength signatures. Planning never reads player hand or future draw order. Episode plans remain committed before player actions; the UI retains hidden enemy hands/intents. Strength setup comes after attacks and is visible for the following round. Every third enemy round adds 2 permanent strength after resolving attacks; a tappable red rule seal explains this from the start. Long defensive stalls now have a cost.

Four starting builds include a same-turn ordered chain: warrior stance then ward counter; shaman curse then needle; nun chant then dharma wheel; medium phrai oil then poison echo. Conditional damage rewards setup independently of the once-per-fight combo bonus. Card previews list ordered combinations, HUD seals track progress/completion, and a short banner announces success. Playing the reverse order does not complete ordered chains. Other cards may be interleaved. Setup expires at the next player turn. Existing longer unordered combinations retain their rules, except nun merit/cleansing/shield rituals now require listed order in one turn.

All classes have three deterministic class-specific reward lanes (attack / defense / engine). Shaman basic attacks/guards now cost one instead of zero; meditation/altar and nun regeneration are once per fight. Nun healing competes for energy and her opening deck does not grant the advanced merit-shield chain automatically. Episode level choices cap max energy at four. Full-run level choices retain their existing range, while shared card values and core fixes apply to both modes.

## Engine fixes

Live StartPlayerTurn increments the turn counter instead of resetting it in enemy resolution. Enemy start/end statuses now process, so poison ticks and weakness/strength expire. Duration 99 remains a combat-long effect. Conditional draws resolve actual bonus draw after moving the card. Free-card combos waive cost before payment, consume exactly one charge, and match displayed costs. Corruption cost and entangle attack restrictions match the hand UI. Dispel now genuinely removes negative statuses. Enemy history records only revealed cards, stopping on death or insufficient energy.

Existing saved card instances are retained; start a NEW run to exercise the full new starter/card balance. No art changes or new assets.

## Validation

TypeScript, 574 tests in 36 files, production web export. Added live-command regression tests for ordered chains, expiry, free-card cost, attack denial, conditional draw, enemy poison/expiry/escalation and episode energy cap. Existing episode acceptance tests now use only public-board tactics rather than hidden intent damage. Android smoke deck-count assertions updated to the actual 3 starting temple blades. APK version and workflow filenames/audit expectations advance together.

Controlled pilot: 40 development seeds plus 40 held-out seeds per class, both random-affordable and public-board policies, identical route/rewards/rest/upgrades within each pair: 640 chapters total. Uses real reducer commands with no synthetic combat damage or HP, and a separate decision RNG. Tactical policy never reads hidden intent/hand/draw. Random policy still uses the same preparation and discard rule, so it is a stronger baseline than completely random tapping.

| Class | Random completion (development / held-out) | Tactical completion (development / held-out) |
| --- | --- | --- |
| Warrior | 22/40 · 19/40 | 39/40 · 38/40 |
| Shaman | 18/40 · 23/40 | 30/40 · 31/40 |
| Nun | 12/40 · 8/40 | 39/40 · 40/40 |
| Medium | 27/40 · 27/40 | 40/40 · 39/40 |

Enemies reveal approximately 2.8–2.94 cards per completed enemy turn. Raw results: gameplay-v18-pilot.json. Reproduce with `npx vite-node --config vitest.config.ts scripts/gameplay-pilot.ts --report`; held-out set uses `PILOT_SEED_PREFIX=holdout`. These are policy simulations, not human win rates or evidence of being more enjoyable than another game. Shaman remains the least forgiving tactical opening; medium is the most forgiving. Human playtesting should check clarity, pacing and perceived fairness before further tuning.

APK build/audit and Android emulator smoke are pending GitHub Actions results at source delivery. Do not describe native validation as passed until that workflow completes.
