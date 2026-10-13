# Post-audit balance (current)

40 tactical bot runs per class/difficulty (800 runs), seed prefix `tune`, after the audit fixes
(bargain stacking, milestone cards returned to the pool, level 4+ earlier rage). Zero stalls.
Reasons and targets: `DESIGN-DECISIONS.md` §2.3–2.4.

| Class | 1 | 2 | 3 | 4 | 5 |
|---|---:|---:|---:|---:|---:|
| warrior | 100% | 88% | 85% | 60% | 35% |
| shaman | 95% | 85% | 75% | 57% | 30% |
| nun | 100% | 95% | 68% | 65% | 45% |
| medium | 90% | 73% | 83% | 70% | 35% |
| **all** | **96%** | **85%** | **78%** | **63%** | **36%** |

Medium 2 vs 3 is sampling noise: a 60-run recheck (seed `check`) gave 78% / 78%.

```sh
npm run balance -- --runs 40 --difficulty 1,2,3,4,5 --seed tune
```

---

## Earlier Phase 7 comparison (before the audit, 20 runs per cell)


20 tactical bot runs per class/difficulty; 400 runs in each version. Same seed prefix `balance`. The Phase 7 event, resource and pre-equip choices change RNG consumption and strategy. These percentages do not isolate an individual change and do not predict human win rates or play duration.

| Class | Difficulty | Phase 6 | Phase 7 | Stalls (Phase 7) |
|---|---:|---:|---:|---:|
| warrior | 1 | 100% | 95% | 0 |
| warrior | 2 | 95% | 85% | 0 |
| warrior | 3 | 85% | 65% | 0 |
| warrior | 4 | 70% | 75% | 0 |
| warrior | 5 | 10% | 35% | 0 |
| shaman | 1 | 90% | 95% | 0 |
| shaman | 2 | 65% | 80% | 0 |
| shaman | 3 | 60% | 80% | 0 |
| shaman | 4 | 55% | 85% | 0 |
| shaman | 5 | 15% | 55% | 0 |
| nun | 1 | 90% | 95% | 0 |
| nun | 2 | 70% | 90% | 0 |
| nun | 3 | 75% | 70% | 0 |
| nun | 4 | 75% | 85% | 0 |
| nun | 5 | 20% | 60% | 0 |
| medium | 1 | 70% | 100% | 0 |
| medium | 2 | 40% | 65% | 0 |
| medium | 3 | 40% | 90% | 0 |
| medium | 4 | 50% | 75% | 0 |
| medium | 5 | 5% | 55% | 0 |

Level 5: baseline 10/80 (12.5%), Phase 7 41/80 (51.25%).
Warrior no longer leads every other class at difficulty 3. Medium is no longer the lowest level-5 class in this sample.

Additional matrix: 96 runs covering 4 classes × difficulties 1/5 × blessing tiers 0/6 × milestone levels 0/4 × courage/merit/even alignments, veteran enabled. Zero stalls. All use the actual reward/shop rarity and unlock pools.

Raw JSON from these runs was removed from the repo after the audit (≈280k lines); regenerate with the commands in `HANDOFF.md`.
