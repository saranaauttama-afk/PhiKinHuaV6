# Balance evidence — card depth, 16 October 2026

## Method and evidence limits

Baseline is main `0df356181a654c2aa3bd8d6d028f1f06d0c9c5d7`. The same `scripts/balance.ts` tactical pilot, seed naming, default blessing tier 0, milestone level 0, automatic alignment, and non-veteran starts are used throughout. Cell = one class × one difficulty. `tune` seed names permit paired comparisons, but added cards change reward pools and subsequent decisions/RNG consumption: identical seed names alone do not isolate one cause. The old-pool and cadence experiments below isolate specific changes more closely.

These are bot campaign win rates, not human win rates or proof of fun. A 120-run cell near 50% has an approximate 95% uncertainty of ±9 percentage points; a 60-run tuning cell approximately ±13. The final tuning-seed cohort includes the exploratory seeds, so an independent seed prefix is also checked. Target bands in DESIGN-DECISIONS §2.4 remain a guide: d1 ≥90, d2 80–90, d3 70–85, d4 55–70, d5 25–40%. Baseline already misses several bands. Report misses rather than silently changing the target.

`balance-evidence.json` preserves row summaries, exact win counts, per-night/per-kind encounter/death/turn/HP aggregates, run counts, and SHA-256 of raw outputs. Raw run records are intentionally not committed, following the existing repository convention. Net HP loss includes healing, level-up healing and maximum-HP changes; negative values do not mean negative incoming damage. Later-night encounter averages are conditioned on surviving there.

## Experiments and decisions

| Experiment | Runs/cell | Warrior win%, d3 / d4 / d5 | Shaman win%, d3 / d4 / d5 | Decision |
|---|---:|---|---|---|
| Original main | 120 | 59 / 46 / 35 | 69 / 53 / 17 | Baseline |
| Expanded decks, initial AI | 120 | 68 / 58 / 43 | 87 / 83 / 46 | Too much dilution/recovery against shaman; content size alone is insufficient |
| Retune A | 60 | 77 / 68 / 40 | 87 / 78 / 33 | Preserve first-night curve; later shaman still too easy |
| Elite/boss draw 3 every turn | 60 | 42 / 30 / 17 | 42 / 33 / 5 | Reject: first-night collector wall and large later damage increase |
| Elite/boss draw 3 every turn, nights 2–3 only | 60 | 60 / 38 / 20 | 43 / 40 / 5 | Reject: early gate works, bell keeper/elites become too punishing |
| +1 draw every second ghost turn, elite/boss nights 2–3 | 60 | 67 / 62 / 32 | 73 / 62 / 17 | Useful bounded pressure, but compare a less frequent cadence before selection |
| +1 draw every third ghost turn, elite/boss nights 2–3 | 60 | 72 / 63 / 33 | 78 / 67 / 22 | Selected cadence, then verify with final phase-two interleaving |

Retune A keeps the enlarged sizes and existing denial limits. The collector's two new ordinary hits become 3×2 and 2×3 rather than single/dual burst (raw totals 6/6); phase-two decks for collector, bell keeper, cave mother and headless king replace a generic strike with another existing phase signature. It also includes the AI equipment-charge correction. Those changes were tested together, so do not attribute the whole difference to a single tweak.

The shaman old-pool ablation restores only the old 53-card shaman pool while keeping the expanded ghosts/AI: wins **52/60, 50/60, 27/60** at d3/4/5, versus **52/60, 50/60, 26/60** with the new pool in a separate matched copy. The two diagnostic copies differ only in the seven added shaman cards: all enemy data, planner, equipment fix, draw rules, pilot and other classes match. This is the pre-retune-A snapshot. The new-pool output independently reproduces every run record in the first 60 expanded-untuned runs, but that older output is only a cross-check, not the controlled comparator. The seven new shaman cards do not explain the large aggregate easing. We retain them and address enemy exposure instead of broadly weakening holy water, seal or starter cards.

All late-only draw/cadence tests preserve all **360 first-night fight histories** exactly relative to retune A in their matching d3–5 runs. Additional draw is limited by free hand slots; it does not expand hand size, retention or AP. The every-turn experiments approximately double boss net HP loss without materially extending fights. Details and source hashes for those isolated experiments are in GHOST-DESIGN.

## Final phase-two exposure correction

A direct audit over every deterministic rotation found that all six initial expanded phase-two decks had offsets with no phase-exclusive card in the first six draws. The idealized hypergeometric assertion did not establish actual runtime exposure. Reorder-only interleaving now preserves every card copy, number and trigger while guaranteeing a phase-exclusive card within six draws at every offset. The exclusive attack bounds are seven draws for the collector, four for bell keeper, and five for each other boss. Seven is mathematically necessary for the collector's two exclusive attacks in fourteen cards; we do not claim every three-turn window contains an attack.

Tests execute the actual `checkGhostPhase` transition and `drawEnemyHand` at every offset, verify the real rotated order, and check those bounds. The final win-rate matrix below includes this ordering change; exploratory cadence results above predate it.

## Reproduction

```sh
npm run balance -- --runs 120 --difficulty 1,2,3,4,5 --classes warrior,shaman --seed tune --out /tmp/card-depth-final.json
npm run balance -- --runs 60 --difficulty 3,4,5 --classes warrior,shaman --seed depth-holdout --out /tmp/card-depth-holdout.json
npm test -- --maxWorkers=2 --testTimeout=60000 --silent
npx tsc --noEmit
CI=1 EXPO_PUBLIC_UI_REVIEW=1 npx expo export --platform web --output-dir /tmp/card-depth-web
```

To reproduce the baseline, run the first command in a clean worktree at the base commit. Diagnostic variants alter only the named field/rule relative to retune A; they are rejected experiment records, not additional game modes. Save raw output outside the repository or as CI artifacts. Use the committed JSON aggregates when discussing historical results; rerun after any card, AI, pilot or reward change.


## Final validation

Final source includes all content, equipment-aware AI, cadence 3 and phase-two interleaving. **1,200 runs** at 120 per class/difficulty, seed prefix `tune`; no stalls.

| Class / source | d1 | d2 | d3 | d4 | d5 |
|---|---:|---:|---:|---:|---:|
| warrior main | 82% | 73% | 59% | 46% | 35% |
| warrior final | 87% | 74% | 63% | 54% | 33% |
| shaman main | 81% | 73% | 69% | 53% | 17% |
| shaman final | 87% | 82% | 77% | 70% | 20% |

Independent `depth-holdout`: **360 runs**, 60 per class/difficulty at d3–5, no stalls. These seeds were not used to select card numbers or cadence.

| Class | d3 | d4 | d5 |
|---|---:|---:|---:|
| warrior | 60% | 37% | 18% |
| shaman | 72% | 57% | 18% |

The independent cohort exposes a material warrior opening bottleneck and target-band misses; it is not grounds for claiming every difficulty is fully balanced. Warrior night-one deaths are 14/60, 23/60 and 37/60 in d3–5; late draw cadence cannot cause these because it starts in night two. Shaman d5 remains below the historical 25–40% target in both cohorts (20% / 18%). Do not broadly buff one class or nerf all ghosts based on one cohort. Player build choice, early rewards and collector pressure need phone play and more targeted evidence.

Checks completed: **49 test files / 681 tests**, TypeScript, Web export, reproducible shaman generators, data audit (14 new player +154 new ghost definitions; zero existing definitions changed/removed), all fourteen distinct RGBA384 images/SHA-256/both art maps, and publication scan. The phase-two test checks every actual rotation. The draw-cadence grid checks all nights/kinds/turn0–9/free-slot combinations plus a saved custom draw round-trip.

Local mobile-browser smoke could not run: Chromium was absent and its download repeatedly returned an invalid/truncated archive. UI fixture generation and Web export succeeded; do not label the local mobile smoke as passed. Existing GitHub PR verification runs the browser and Android checks in its configured environment. No new APK version is claimed by this branch.

## Independent matched baseline follow-up

The independent cohort was also run against the exact main snapshot after the final candidate was frozen. No additional numbers were tuned to these results.

| Class / source, 60 runs each | d3 | d4 | d5 |
|---|---:|---:|---:|
| Warrior main | 60% | 33% | 17% |
| Warrior final | 60% | 37% | 18% |
| Shaman main | 68% | 50% | 15% |
| Shaman final | 72% | 57% | 18% |

No stalls in either cohort. Warrior first-night deaths improve from **21/35/41** on main to **14/23/37** on final; collector deaths from **12/17/16** to **8/13/16**. Thus the final candidate does not show an aggregate win-rate regression in these matched cells; the independent opening bottleneck already existed. The small increases are descriptive sample results, not proof of statistical superiority. The 37% warrior d4 holdout and shaman d5 misses remain material limits, not something to dismiss as random noise. Human opening/reward choices and collector counterplay are the next focused playtest topics.

Preserved matrix evidence totals **6,600 runs**, including baseline, controlled diagnostics, final 1,200-run matrix and 360-run independent final/baseline cohorts. Intermediate abandoned smoke runs are not used as acceptance evidence. Every preserved variant has zero stalls. `source-evidence.json` fingerprints the final simulated/published inputs; `balance-evidence.json` preserves exact row counts and aggregates.
