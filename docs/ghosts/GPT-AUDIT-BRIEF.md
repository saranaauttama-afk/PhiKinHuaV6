# Brief for an outside audit + balance pass (GPT / Codex) — 15 Oct 2026

Owner's intent: get a second pair of eyes on the ghost rebuild and help tune balance. You may change
**numbers and card data**; game-rule or design changes must be proposed to the owner first (repo rule,
`docs/phase7/DESIGN-DECISIONS.md` §0). Write the reason for every change into the docs.

## Where things are
- Branch: `work/ghosts-night1` (PR #21, stacked on PR #20 `work/nak-muay`). Base for a ghost-only diff: `work/nak-muay`.
- Read first: `CLAUDE.md` → `docs/ghosts/HANDOFF.md` → `docs/ghosts/NIGHT1-DESIGN.md` and `docs/ghosts/NIGHT23-DESIGN.md`
  (each has a "ลงโค้ดแล้ว" section listing deviations and reasons) → `docs/phase7/DESIGN-DECISIONS.md` §2.4 (targets).
- Classes open to players: **นักมวยคาดเชือก** (`warrior`) and, since 15 Oct 2026, **หมอผี** (`shaman`, น้ำมนต์ — `docs/mor-phi/DESIGN.md`, branch `work/mor-phi-nam-mon`). The other two are locked; their sim numbers are informational.

## Balance target (tactical bot, `docs/phase7/DESIGN-DECISIONS.md` §2.4)
| level | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| target | ≥90% | ~80% | ~70% | ~55% | ~25–35% |
| นักมวย now, 120 runs | 82% | 73% | 59% | 46% | 35% |
| หมอผี now, 120 runs | 81% | 73% | 69% | 53% | 18% |

The owner asked for the early game to be **harder** than before (it was 98% at level 1 and felt like skills were never needed),
so landing a little under target at levels 1–2 is in the intended direction. Use ≥100 runs per cell when judging;
40-run cells move ±7–10 points.

## How to run
```
npm ci
npx tsc --noEmit && npx vitest run
npm run balance -- --runs 120 --difficulty 1,2,3,4,5 --classes warrior --seed tune --out /tmp/bal.json
```
`--out` JSON has per-run fights (`night`, `enemyId`, `kind`, `turns`, `hpBefore/After`, `won`) — group by `enemyId` to find walls.

## Where the numbers live (change these, not code)
| What | File |
|---|---|
| Ghost cards (dmg, charge, riposte, steal…) | `src/data/packs/base/enemy_cards.json` |
| Ghost decks (which cards, how many copies) | `src/core/campaign/enemyDecks.ts` (`NIGHT_ENEMY_DECKS`) |
| Opening rules, boss phase 2 (`phase2`) | `src/data/packs/base/ghost_rules.json` |
| Boss relics (durability, rule) | `src/data/packs/base/boss_rules.json` |
| Minions (HP, taunt, act, chargeBoost) | `src/data/packs/base/minions.json` |
| HP by night / depth / difficulty, charge max, stun, level-up heal | `src/core/balance/notfm.ts` (`ENEMY_HP`, `ENEMY_DEPTH`, `DIFFICULTY`, `GHOST_MECHANICS`, `LEVEL_UP.healPct`) |
| นักมวย cards | `src/data/packs/base/class_cards.json` |
| หมอผี cards (edit the list, then run it) | `scripts/mor-phi-data.py` → `class_cards.json` · rules `WATER_RULES` in `notfm.ts` |
| Sim bot (reads only what a player sees) | `scripts/pilot.ts` |

## Known walls and open questions (from the latest sims)
1. **Night 1 at levels 3–5:** most losses are to the night-1 boss กระหังหนองร้าง (rage starts on night 1 from level 3). Levers: `ENEMY_HP.bossNight[0]`, หัวในกระด้ง HP, ฉวยหัว numbers.
2. **ผีตายโหงชายทุ่ง (kuman-thong)** appears often among killers at levels 3–5 (two ash minions that hit / poison every turn).
3. **Night 2 at levels 1–2:** เปรตวัดร้าง is the wall even after softening (deck + HP ×1.4).
4. Level 4 sometimes comes out easier than level 3 at 40 runs — check at 120+ before acting.
5. **หมอผี level 5 (18%)** is under target; walls are the same bosses. Levers: `WATER_RULES.perTurn`/`bowlMax`, สาด per water, starter numbers.
6. Bot weaknesses (affect numbers, not the game): it does not plan to kill minions first or to hold cards for combos.

## Audit focus
- Mechanics added this round: ชาร์จ (held-card age), ghost สวน (whole-side HP rule), มึน on the player, จังหวะรำ, ดูดเลือด, ซ้ำแผล, boss `phase2` (incl. `afterRevive`), ผีขโมยการ์ด (`steal`, one returned per bleeding hit), ghost `breakBlock`, minion `chargeBoost`. Code: `src/core/combat/ghostMechanics.ts`, `enemyPlan.ts` (AI), `enemyHand.ts`, `enemyCardEffects.ts`, `cards/fx.ts`, `combat/damage.ts`.
- A previous independent audit's findings were fixed (non-stacking statuses read as 1 in the AI, borrowed drain heals, card text, phase-before-relic order); see `docs/ghosts/HANDOFF.md`.
- Report findings with file:line and a repro; separate confirmed bugs from suspicions.
