# Deck progression v1 — implementation and validation

Base: `main` at `358bab97edf5a7364437e6bc1a1657f7cd830b3e`; branch: `work/deck-progression-v1`.

## Implemented

- Warrior and shaman retain ten starter cards each, with fixed star overrides. Starter-specific rhythm, bruise, and water ceilings are enforced by the combat resolver and shown in card descriptions and previews. Newly acquired cards retain their full effects.
- The nightly card stop sells four distinct class-legal roles: replacement, engine, payoff, support. Focus can follow acquired cards in later nights. It keeps sold slots empty on its one paid reroll and persists inventory, focus, and reroll state across leaving and saving.
- First shop opens after one fight in night 1, or immediately in nights 2–3; other services unlock by wins. Removal is free/20/35 (three uses) and upgrading is free/30 (two uses) at each stop. Prices are 20/35/60/90; reroll costs 10, before difficulty markup. Rewards omit starter IDs.
- The four-class game retains the old economy, shop stock, and route schedule for nun and medium. Their enemy HP remains on the previous formula.
- Existing in-progress run saves are rejected by save format version 4, as requested. Permanent journal and archive storage use their existing independent formats.

## Tuned since the design draft

The initial pilot showed poor early survival and long fights on the reduced starter set. The current candidate uses night-1 normal HP `12 + 2×(tier−1) + round(1.5×depth)` and night-1 boss HP 36 for warrior/shaman, below the draft's 14-base and 48-boss values. Meditation restores 2/3/4 water and draws one card at every star; this is an experimental change from the draft's no-draw row. All three adjustments require further playtesting before a balance sign-off.

## Verification

`npx tsc --noEmit` passed. `npx vitest run --reporter=dot --silent` passed 698 tests in 51 files. New regression coverage includes per-card combat caps, ten-card starters, no-op upgrades, 100-seed legal shop stock, a genuine first-fight shop gate, sold-slot reroll, and save/reentry. The existing suite was updated for the intentional starter and economy changes.

The tactical pilot reads the public board and records losses. It is a useful regression signal, not a human playtest, not a paired comparison to `main`, and not evidence that all six build paths meet the acceptance targets in `DESIGN.md`.

Command: `npm run balance -- --runs 100 --classes warrior,shaman --difficulty 1,3,5 --out pilot-100x6.json`. The run seed is `balance-{class}-{difficulty}-{0..99}`, policy `tactical`, blessing tier and milestone level 0. The summary below includes deaths; no run stalled. The raw JSON is reproducible with that command, but is not needed in the repository.

| Class | Difficulty | Wins / 100 | Deaths N1/N2/N3 | Normal / elite / boss mean turns | Most frequent killer |
|---|---:|---:|---:|---|---|
| Warrior | 1 | 51 | 16 / 32 / 1 | 3.6 / 4.2 / 6.1 | `night-head-collector` 11 |
| Warrior | 3 | 24 | 59 / 17 / 0 | 3.9 / 4.7 / 6.2 | `night-head-collector` 20 |
| Warrior | 5 | 3 | 87 / 10 / 0 | 4.2 / 4.3 / 5.6 | `night-head-collector` 20 |
| Shaman | 1 | 22 | 34 / 39 / 5 | 4.2 / 4.8 / 7.8 | `night-head-collector` 20 |
| Shaman | 3 | 9 | 72 / 18 / 1 | 4.4 / 4.3 / 7.0 | `night-head-collector` 19 |
| Shaman | 5 | 1 | 97 / 2 / 0 | 5.1 / 4.5 / 4.9 | `phi-krasue` 32 |

On difficulty 1, the first two fights were won in all 200 samples per class. Their median turns were 3 for both, but only 50% of warrior and 45% of shaman fights ended in 2–3 turns; p90 was 5 and 8 respectively, against the draft's ≥65% and p90 ≤4 targets. The shaman's early `phi-pong-kang` matchups averaged 7.1 turns over 43 samples (p90 12), versus 2.2–4.4 on the other first-two ghost IDs. Its minion and taunt cost need a local effective-HP audit before lowering every ghost's printed HP. The night-1 boss killed 11 warrior and 20 shaman runs at D1 despite its already reduced 36 printed HP.

**Balance acceptance is open.** The current prototype establishes the rules, access path, and testable evidence, but does not meet the opening pacing or shaman full-run targets. Do not merge as a balance release on the strength of these test results alone.

## Remaining balance gates

- Holdout seeds and difficulty 2/4, separate policies for six Common/Uncommon builds, starter-only and fixed-acquisition removal comparisons, and paired local battles at a shared checkpoint.
- Telemetry for opening turns, effective HP, incoming burst, water/bruise cap hits, money spent and card provenance; a manual mobile playthrough to judge clarity and pacing.
- Retune specific early ghosts, boss defenses, and core build access if the full-run pilot remains far below the draft's thresholds. Do not raise global AP/draw or change enemy AI in this branch to mask progression failures.

## Route card access (16 Oct 2026, owner: "NOTFM มีร้านและหีบเยอะ")

Cause found: v1 night 1 offered one card shop and a 50% chest before the first card reward (the night-1 boss), so the reduced starter fought seven fights with one or two new cards. `PROGRESSION_ROUTE` in `balance/deckProgression.ts` now gives warrior/shaman **2 guaranteed chests every night** (free pick 1 of 2) and **2 card shops on night 1**; nun/medium keep the old route.

Bot `tactical`, seed `claude-audit`, 60 runs/cell. "main" is `358bab9`.

| Class | d1 | d2 | d3 | d4 | d5 |
|---|---|---|---|---|---|
| Warrior main | 85% | 72% | 70% | 45% | 23% |
| Warrior v1 | 43% | 43% | 25% | 12% | 2% |
| Warrior v1 + route | 52% | 38% | 50% | 15% | 8% |
| Shaman main | 82% | 65% | 78% | 60% | 17% |
| Shaman v1 | 33% | 18% | 2% | 8% | 0% |
| Shaman v1 + route | 35% | 15% | 17% | 5% | 0% |

Decks end 2–3 cards larger. Survival improves (warrior d3 night-1 deaths 28 → 19 of 60) but remains far below main; most low-difficulty losses are now on night 2, whose ghost HP was not lowered for the new starters. The bot buys by generic card value and does not build toward one of the six paths, so it understates a deliberate player more for this design than for main. Balance acceptance is still open.
