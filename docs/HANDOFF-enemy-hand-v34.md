# PhiKinHua v34 — Enemy Hand Strategy

Baseline: `work/hand-balance-v33` at `3d76e9ed3cd557a57392abe12e32a197efac1268`. Release branch: `work/enemy-hand-v34`. No merge into main. No Paper Diorama, Pages, battle layout, artwork or player-card edits. Only application version metadata and a dedicated test-build workflow accompany enemy changes.

## Rules and execution

| Encounter | Deck copies | Maximum hand | Draw/turn | Maximum retained | Energy |
|---|---:|---:|---:|---:|---:|
| Normal | 10 | 4 | 2 | 2 | 2 |
| Elite | 12 | 6 | 3 | 3 | 3 |
| Boss | 15 | 7 | 3 | 4 | 3; difficulty 5 awakened: 4 |

Hand Size is a hard capacity including held cards; Max Retained limits end-turn holdings. Drawing is a fixed count into free slots. Card definitions, physical deck copies and cards played per turn are separate quantities. Boss identities used as route monsters keep their 15-card identity deck but use route Normal/Elite hand and energy policy. The roster classification below is the authored monster classification; route promotions/downgrades override encounter policy.

The live turn draws only when the enemy acts. It searches affordable ordered subsets of its real hand against a scratch public board (HP, Block, statuses, minions and visible blessings), with no access to player hand/draw/discard, future RNG or hidden traps. Strength, Poison, Vulnerable, defense, healing and minions use ordinary mechanics. A fresh multi-hit may wait for a held Strength card; recovery cards wait at full HP. Useful low-HP healing takes priority. Per-copy hand ages and bounded retention release stale cards after three enemy decisions. These are discard safeguards, not a card-sequence or combo system.

Consumed cards leave the actual hand once, deduct energy once and enter discard before reveal/traps/effects. Duplicate card definitions remain separate physical positions. Unplayed retained cards remain in hand, stay hidden and never enter the reveal queue. The existing event timeline still plays each reveal before its effects and before the next card. No battle view code was changed.

Save version remains 2. v33 snapshots initialize missing draw/retention/age fields; exact valid piles, current energy, progression and per-copy ages persist. Partial pile arrays normalize safely. Over-cap legacy hands move overflow into discard without deleting copies. New combats reset ages and retention settings.

The approved enemy card presentation already draws the existing owner artwork from `monster/{ownerId}`. All new cards reuse it. Existing ghost names are preserved, including `kuman-thong` whose current established name is ผีตายโหงชายทุ่ง.

## Full enemy audit

The numbers describe difficulty 1 / chapter 1, freshly initialized live campaign decks. Attack is base damage per card, showing hit count; statuses, Strength and conditional payoffs can alter resolved damage. Full card definitions/copy counts/costs and normal/awakened identities: [v34-enemy-audit.json](v34-enemy-audit.json). Baseline: [v34-baseline-enemy-audit.json](v34-baseline-enemy-audit.json).

| Ghost / ID | Type | Definitions | Deck copies v33→v34 | Unique v33→v34 | Hand / draw / retain / energy | Attacks | Block / Heal max | Status and special abilities |
|---|---|---:|---:|---:|---|---|---|---|
| ผีกระสือ `phi-krasue` | normal | 13 | 18→10 | 8→9 | 4 / 2 / 2 / 2 | 1×1, 2×2, 3×1, 4×1 | 4 / 0 | dodge, poison, strength, vulnerable, player_poison |
| ผีปอบ `phi-pop` | normal | 9 | 18→10 | 8→9 | 4 / 2 / 2 / 2 | 2×1, 2×2, 3×1, 4×1, 5×1 | 4 / 6 | strength, vulnerable |
| นางตานี `nang-tanee` | normal | 9 | 18→10 | 8→9 | 4 / 2 / 2 / 2 | 2×2, 3×1, 4×1 | 4 / 0 | strength, thorns, vulnerable, weakness, enemy_block |
| ผีตายโหงนางรำ `phi-nang-ram` | normal | 9 | 18→10 | 8→9 | 4 / 2 / 2 / 2 | 2×1, 2×2, 3×1, 4×1 | 4 / 0 | fear, regeneration, strength, vulnerable, weakness |
| ผีป่าโป่งร้าง `phi-pong-kang` | normal | 9 | 18→10 | 8→9 | 4 / 2 / 2 / 2 | 2×2, 2×3, 3×1, 4×1 | 4 / 0 | dodge, strength, vulnerable, weakness |
| ผีโพงท้ายทุ่ง `ngu-phi-sang` | normal | 13 | 18→10 | 8→9 | 4 / 2 / 2 / 2 | 1×1, 2×2, 3×1, 4×1 | 4 / 0 | dodge, poison, strength, vulnerable, player_poison |
| ผีเปรต `phi-pret` | normal | 13 | 18→10 | 8→9 | 4 / 2 / 2 / 2 | 2×1, 2×2, 3×1, 4×1, 5×1 | 4 / 4 | draw_reduction, regeneration, strength, vulnerable |
| กระหัง `krahang` | normal | 13 | 18→10 | 8→9 | 4 / 2 / 2 / 2 | 2×2, 2×3, 3×1, 4×1 | 4 / 0 | dodge, strength, vulnerable, weakness |
| ผีตายโหงชายทุ่ง `kuman-thong` | normal | 13 | 18→10 | 8→9 | 4 / 2 / 2 / 2 | 2×1, 2×2, 3×1, 4×1 | 4 / 0 | draw_reduction, regeneration, strength, vulnerable, curse_dread, kuman_spirit |
| ผีตายโหง `phi-tai-hong` | normal | 13 | 18→10 | 8→9 | 4 / 2 / 2 / 2 | 2×2, 3×1, 4×1, 5×1 | 4 / 0 | regeneration, strength, vulnerable, player_vulnerable |
| ผีป่า `phi-pa` | normal | 13 | 18→10 | 8→9 | 4 / 2 / 2 / 2 | 2×2, 2×3, 3×1, 4×1 | 5 / 0 | strength, vulnerable, forest_demon, kuman_spirit |
| แม่นาค `mae-nak` | normal | 13 | 18→10 | 8→9 | 4 / 2 / 2 / 2 | 2×2, 2×3, 3×1, 4×1 | 4 / 0 | strength, thorns, vulnerable, weakness, enemy_block |
| ปอบใหญ่ `pop-yai` | normal | 13 | 18→10 | 8→9 | 4 / 2 / 2 / 2 | 2×1, 2×2, 3×1, 4×1, 5×1 | 4 / 6 | strength, vulnerable |
| ผีโขมด `phi-ha-ratri` | normal | 13 | 18→10 | 8→9 | 4 / 2 / 2 / 2 | 2×1, 2×2, 3×1, 4×1 | 4 / 0 | fear, regeneration, strength, vulnerable, weakness |
| ผีกองกอย `asuragaya` | normal | 13 | 18→10 | 8→9 | 4 / 2 / 2 / 2 | 2×1, 2×2, 3×1, 4×1 | 7 / 0 | strength, vulnerable, weakness, enemy_block |
| เปรตลานวัด `yak-wat-jaeng` | normal | 13 | 18→10 | 8→9 | 4 / 2 / 2 / 2 | 2×1, 2×2, 3×1, 4×1 | 7 / 0 | strength, vulnerable, weakness, enemy_block |
| ผีพราย `phi-phrai` | normal | 13 | 18→10 | 8→9 | 4 / 2 / 2 / 2 | 1×1, 2×2, 3×1, 4×1 | 4 / 0 | dodge, poison, strength, vulnerable, player_poison |
| ผีตายโหงเร่ร่อน `winyan-rerorn` | elite | 15 | 22→12 | 10→11 | 6 / 3 / 3 / 3 | 2×1, 3×1, 3×2, 4×1, 5×1 | 5 / 5 | regeneration, strength, vulnerable, weakness, curse_dread, player_vulnerable |
| โขมดดง `pisaj-fai` | elite | 15 | 22→12 | 10→11 | 6 / 3 / 3 / 3 | 3×2, 4×1, 5×1, 6×1 | 5 / 5 | regeneration, strength, vulnerable, weakness, player_vulnerable |
| ผีป่าดงลึก `jao-por-pa` | elite | 15 | 22→12 | 10→11 | 6 / 3 / 3 / 3 | 2×2, 3×2, 4×1, 5×1 | 5 / 5 | strength, thorns, vulnerable, weakness, enemy_block |
| ผีตายโหงเรือนร้าง `phi-nang-yai` | elite | 15 | 22→12 | 10→11 | 6 / 3 / 3 / 3 | 2×1, 3×1, 3×2, 4×1, 5×1 | 5 / 5 | regeneration, strength, vulnerable, weakness, curse_dread, player_vulnerable |
| ผีตายโหงริมคลอง `winyan-dek` | elite | 15 | 22→12 | 10→11 | 6 / 3 / 3 / 3 | 3×1, 3×2, 4×1, 5×1 | 5 / 5 | fear, regeneration, strength, vulnerable, weakness |
| กระหังครูอาคม `yak-dam` | elite | 15 | 22→12 | 10→11 | 6 / 3 / 3 / 3 | 3×2, 4×1, 5×1, 6×1 | 5 / 5 | regeneration, strength, vulnerable, weakness, player_vulnerable |
| ผีแม่ม่าย `phi-mae-mai` | boss | 15 | 22→15 | 10→11 | 7 / 3 / 4 / 3 | 3×1, 3×2, 4×1, 5×1 | 5 / 5 | draw_reduction, regeneration, strength, vulnerable, weakness |
| เปรตหิวโหย `phra-upakut` | boss | 15 | 22→15 | 10→11 | 7 / 3 / 4 / 3 | 2×2, 3×1, 3×2, 4×1, 5×1 | 8 / 5 | strength, vulnerable, weakness, enemy_block |
| กระหังหนองร้าง `night-head-collector` | boss | 19 | 28→15 | 12→13 | 7 / 3 / 4 / 3 | 2×2, 3×3, 4×2, 5×1, 6×1, 6×2 | 6 / 5 | dodge, strength, vulnerable, weakness |
| เปรตวัดร้าง `night-bell-keeper` | boss | 19 | 28→15 | 12→13 | 7 / 3 / 4 / 3 | 3×1, 4×1, 4×2, 5×1, 6×1, 6×2 | 6 / 5 | fear, regeneration, strength, vulnerable, weakness |
| ผีป่าไทรพันราก `night-root-lord` | boss | 19 | 28→15 | 12→13 | 7 / 3 / 4 / 3 | 2×2, 4×2, 5×1, 6×1, 6×2 | 6 / 5 | strength, thorns, vulnerable, weakness, enemy_block |
| พรายแอ่งถ้ำ `night-cave-mother` | boss | 19 | 28→15 | 12→13 | 7 / 3 / 4 / 3 | 2×1, 4×1, 4×2, 5×1, 6×1, 6×2 | 6 / 5 | regeneration, strength, vulnerable, weakness, curse_dread, player_vulnerable |
| ปอบครูอาคม `night-headless-king` | boss | 19 | 28→15 | 12→13 | 7 / 3 / 4 / 3 | 4×1, 4×2, 5×1, 6×1, 6×2, 7×1 | 6 / 5 | regeneration, strength, vulnerable, weakness, player_vulnerable |
| พรายวังน้ำ `phaya-nak` | boss | 15 | 22→15 | 10→11 | 7 / 3 / 4 / 3 | 2×1, 3×2, 4×1, 5×1 | 5 / 5 | dodge, poison, strength, vulnerable, weakness, player_poison |
| ปอบผู้เฒ่า `thep-aksorn` | boss | 15 | 22→15 | 10→11 | 7 / 3 / 4 / 3 | 2×1, 3×1, 3×2, 4×1, 5×1 | 5 / 5 | regeneration, strength, vulnerable, weakness, curse_dread, player_vulnerable |
| ผีกินหัว `phi-kin-hua` | boss | 19 | 28→15 | 12→13 | 7 / 3 / 4 / 3 | 4×1, 4×2, 5×1, 6×1, 6×2 | 6 / 6 | strength, vulnerable, weakness |
| ปอบดงร้าง `phraya-maccurat` | boss | 15 | 22→15 | 10→11 | 7 / 3 / 4 / 3 | 3×1, 3×2, 4×1, 5×1 | 5 / 5 | draw_reduction, regeneration, strength, vulnerable, weakness |

All 34 identities have owned decks; shared card IDs in these live curated decks: 0. Invalid active deck effects: 0. Data pack contains 520 definitions, including unused legacy/global definitions. Do not mistake that pack total for a live deck size.

## Card changes

34 targeted payoff/support moves (one per authored identity), keeping every existing unique move and reducing redundant physical copies. The full [card change list](v34-card-changes.json) includes exact values and unchanged owner-art references. New cards use existing attack, healing, status, minion and board-state conditional mechanics.

| Identity family | Change |
|---|---|
| Phi Pop / Pop Yai / drain ghosts | Attack plus healing; retain recovery until HP is missing |
| Krasue / poison ghosts | Poison payoff adds 3 attack damage when the player is poisoned |
| Krahang / rush ghosts | Strength-aware multi-hit; three hits for normal rush identities, two for boss rush payoff |
| kuman-thong | Draw reduction on existing support; new summon of the existing healing Kuman spirit |
| Phi Tai Hong / rage ghosts | +3 damage against visible Vulnerable |
| Phi Pa | Actual forest summon, healing minion support and stronger authored guard |
| Mae Nak / counter ghosts | Block enables a multi-hit payoff; Mae Nak has three hits |
| Guard ghosts | Block enables two-hit attack payoff |
| Fear ghosts | Attack plus Weakness for sustained pressure |
| Curse ghosts | Affordable attack gains damage against visible Vulnerable; working curse cards remain in decks |

Fixed all five active `curse_burden` references to existing `curse_dread`; invalid legacy copies using the same reference are repaired too. Their damage and names remain intact. Modified existing identity cards: `kuman_thong_v29_signature_support`, `phi_pa_v29_defense`, `phi_pa_v29_signature_support`.

## Paired balance simulations

160 baseline full three-night runs plus 160 final runs: four classes × five difficulties × eight identical seeds per cell. Existing public-board player pilot, real rewards/rest/level-ups, QA instant-win card disabled. Turn duration is measured in turns, not elapsed minutes. Pilot win rates describe this fixed automated policy, not expected human win rates. Damage counts HP loss in the enemy-turn batch including player end-turn effects, before subtracting later healing.

| Class | Difficulty | v33 wins /8 | v34 wins /8 | Combat turns mean | HP loss / enemy turn | Cards / turn | Retained / turn | Idle turns | Boss fights won / encountered | Peak HP loss |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|
| warrior | 1 | 3 | 5 | 3.46 | 1.45 | 1.55 | 1.51 | 0 | 16 / 19 | 28 |
| warrior | 2 | 3 | 2 | 3.48 | 2.4 | 1.53 | 1.49 | 0 | 6 / 12 | 26 |
| warrior | 3 | 2 | 2 | 3.65 | 1.84 | 1.52 | 1.54 | 0 | 6 / 10 | 27 |
| warrior | 4 | 1 | 2 | 3.56 | 2.04 | 1.53 | 1.5 | 0 | 6 / 10 | 31 |
| warrior | 5 | 0 | 0 | 4.00 | 3.49 | 1.6 | 1.61 | 0 | 1 / 5 | 26 |
| shaman | 1 | 0 | 3 | 3.80 | 2.08 | 1.44 | 1.59 | 0 | 9 / 14 | 22 |
| shaman | 2 | 0 | 1 | 3.62 | 2.74 | 1.47 | 1.5 | 0 | 3 / 8 | 27 |
| shaman | 3 | 0 | 1 | 4.25 | 3.07 | 1.5 | 1.55 | 0 | 3 / 6 | 21 |
| shaman | 4 | 0 | 1 | 4.60 | 3.04 | 1.52 | 1.58 | 0 | 3 / 5 | 28 |
| shaman | 5 | 0 | 0 | 4.69 | 3.35 | 1.47 | 1.59 | 0 | 0 / 1 | 17 |
| nun | 1 | 1 | 3 | 8.43 | 2.41 | 1.49 | 1.77 | 0 | 9 / 12 | 26 |
| nun | 2 | 0 | 4 | 6.74 | 2.7 | 1.5 | 1.72 | 0 | 12 / 13 | 28 |
| nun | 3 | 0 | 0 | 11.04 | 4.21 | 1.44 | 1.81 | 0 | 0 / 4 | 27 |
| nun | 4 | 0 | 0 | 12.97 | 4.38 | 1.39 | 1.8 | 0 | 0 / 2 | 38 |
| nun | 5 | 0 | 0 | 9.83 | 4.62 | 1.43 | 1.78 | 0 | 0 / 1 | 35 |
| medium | 1 | 0 | 4 | 3.15 | 1.7 | 1.44 | 1.43 | 0 | 12 / 15 | 19 |
| medium | 2 | 0 | 1 | 3.10 | 2.41 | 1.49 | 1.39 | 0 | 5 / 10 | 27 |
| medium | 3 | 1 | 0 | 3.64 | 2.56 | 1.48 | 1.33 | 0 | 0 / 3 | 27 |
| medium | 4 | 0 | 0 | 3.92 | 2.28 | 1.5 | 1.34 | 0 | 0 / 3 | 27 |
| medium | 5 | 0 | 0 | 3.86 | 2.37 | 1.35 | 1.42 | 0 | 0 / 1 | 14 |

Full run/combat/boss metrics, damage spikes with enemy ID, chapter, turn, cards and visible Strength: [v34-balance-results.json](v34-balance-results.json). Before tuning: [v34-balance-before-tuning.json](v34-balance-before-tuning.json). Baseline: [v34-baseline-balance.json](v34-baseline-balance.json).

Tuning: the initial v34 pilot found 31–40 HP first-boss bursts. Bosses now begin with 3 Energy at all difficulties (4 only after difficulty-5 awakening); the new boss rush payoff has two hits instead of three. Player cards and stats were not changed. Higher difficulties remain difficult for the pilot; human APK playtests are still needed, particularly class progression and late Strength escalation.

## Verification and build

- TypeScript: `npx tsc --noEmit` passed.
- Vitest: 952 tests across 49 files passed, including 57 v34 cases and existing v33 hand/removal regressions.
- Live enemy audit: 34 identities, zero invalid active deck effects.
- Web production export passed. No approved art regenerated; no battle layout or Pages changes.
- Python native smoke syntax passed; Android installation/launch/cold-reopen results are produced by the dedicated v34 workflow.
- Build: `android-v34.yml` produces one release APK using the existing Expo Android test signing configuration. It verifies APK signature, package/version and 16 KB ZIP alignment. This is a test certificate, not Play Store publishing.
- APK version `1.0.34`, versionCode `35`, package `com.phikinhua.episode`. The QA instant-win card is disabled in the APK. Native smoke tests installation, initial launch and cold reopen; all-class battle coverage comes from engine tests and simulations.

Regression coverage: physical retention, capacity, fixed draw, played-copy removal, deterministic pile recycling, energy reset/payment, later card use, bounded waiting, Strength/Poison/Block synergies, sequential reveal/effect frames, cold save/load and migration, all new effects, v33 player hand balance and explicit combo removal.

## Reproduce

```sh
npm ci
npx tsc --noEmit
npm test -- --maxWorkers=2 --testTimeout=60000
npx vite-node --config vitest.config.ts scripts/v34-enemy-audit.ts
V34_REPORT=docs/v34-balance-results.json npx vite-node --config vitest.config.ts scripts/v34-balance.ts
CI=1 npx expo export --platform web --output-dir /tmp/v34-web
```
