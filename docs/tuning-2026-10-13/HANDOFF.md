# Tuning before store — 13 October 2026

Base: PR #15 `work/notfm-phase7-research` @ `2ed1e59` (APK 1.0.42/code43). Branch: `work/tuning-before-store`.
Owner agreed the direction in chat and approved the code change. Goal: make the existing systems fun and challenging, then ship to the store. **No new systems**; card-system expansion and a 4th equipment slot are deferred until after launch.

Design intent and reasons for every change: `docs/phase7/DESIGN-DECISIONS.md` §2.4 and §2.6.

## What changed

| # | Rule | Where |
|---|---|---|
| T1 | Max hand 2 / draw per turn 2 kept as two stats (unchanged) | `CARD_RULES.retain`, `drawPerTurn` |
| T2 | Opening hand = max hand + 1 | `CARD_RULES.openingBonus`, `cards/hand.ts` `openingHandSize()` |
| T3 | +1 hand / +1 draw instead of a card only after the **night-2** boss (was nights 1–2); caps hand 4, **draw 3** (was 4) | `LEVEL_UP.growthNight`, `LEVEL_UP.caps`, `cards/reward.ts` |
| T4 | Difficulty 5: no opening bonus. Replaces "night 3 draw −1", which had no effect once draw started at its floor of 2 | `DIFFICULTY.noOpeningBonusFrom`; removed `drawCutFrom`/`drawFloor` and the night-3 code in `map_pages.ts` |
| T5 | Night shop sells 3 items (2 cards + 1 equipment, was 4 + 1) | `ECONOMY.shopStock` |
| T6 | Shop rarity by night: night 1 Common/Uncommon only, Rare from night 2, Legendary night 3. `rollShopStock` now receives the current night (its `act` argument was always 1) and falls back only to rarities allowed that night | `ECONOMY.shopRarity`, `shop.ts`, `shops_events.ts` `stockFor()` |
| T7 | Card, blessing and equipment effects draw at most 2 cards per player turn. Turn draw, opening draw and class skills are not counted. The allowance counts what was asked for and resets each player turn and each fight | `CARD_RULES.fxDrawPerTurn`, `cards/fx.ts` `fxDrawAllowance()`, `FightState.fxDrawTurn/fxDrawn` |
| T8 | Ghost HP: night ×0.9/1.45/2.4 (was 1/1.8/2.6), night bosses ×0.75/1.6/2.7 (was .85/2/2.9); difficulty 2+ HP +15% (was +20%) | `ENEMY_HP`, `DIFFICULTY.hpPct` |

On-screen difficulty text (`campaign/threeNight.ts` `DIFFICULTY_RULES`) updated for levels 2 and 5.

## Simulation (bot, tactical policy, seed `tune`)

Win % at difficulty 1/2/3/4/5. Full numbers per class and losses by night: `balance-steps.json`.

| Step | Runs/cell | d1 | d2 | d3 | d4 | d5 |
|---|---|---|---|---|---|---|
| Before tuning (`2ed1e59`) | 20 | 98 | 89 | 48 | 41 | 13 |
| T2–T7 | 20 | 79 | 60 | 44 | 29 | 9 |
| T2–T7 without shop changes (T5/T6) | 20 | 83 | 65 | 51 | 36 | 15 |
| T2–T7 without draw limit (T7) | 20 | 85 | 74 | 53 | 39 | 19 |
| **Final T1–T8** | **40** | **93** | **83** | **72** | **56** | **35** |
| Target ("challenging") | | ≥90 | ~80 | ~70 | ~55 | ~25–35 |

Zero stalls in every run. Reading:
- Before tuning, night 1 was the wall at d3–5 (45–56% of all runs lost on night 1).
- T2 eases night 1, but moving growth to the night-2 boss plus smaller shops and the draw limit made **night 2** the new wall at every difficulty. Each of T5/T6 and T7 alone costs roughly 5–10 points.
- T8 compensates on the ghost side (most in nights 1–2) instead of giving power back to the player.

Open items (need human play on a phone):
- d4: shaman 43% vs medium 70% (spread > 20 points). d5: shaman 25%, nun 45%.
- Night 1 is still where most d4–5 losses happen (rage from night 1 is the d3 rule) — intended pressure, confirm it feels fair.
- d5 at 35% is the top of the band; if humans find it easy, the next lever is `bossNight[2]`.

Reproduce: `npm run balance -- --runs 40 --difficulty 1,2,3,4,5 --seed tune`.

## Verification

`npx tsc --noEmit` clean; `npx vitest run` 40 files / 548 tests pass. New: `test/tuning-before-store.test.ts`. Updated for the new opening hand / growth night / level-5 rule: `backlog-v32`, `notfm-play`, `phase7`, `playtest-backlog`, `notfm-economy`. `card-reward` "skip every card" tolerance 3 → 4: the extra card comes from story events (each can give a card and a curse), not from fight rewards.

Not done here: browser/native smoke and APK build (run by CI on push), physical-device play.
