# First chapter builds — v1.0.15 / Android code 16

## Scope and behavior

This is the first gameplay pass after the UI work: warrior and medium builds, first-chapter ghost identities, original illustrations. It is a pilot for playtesting, not a claim that every class/card or the 15-fight mode is finally balanced.

Warrior supports block-then-counter and strength with multiple hits. Medium supports allied spirits and poison followups. Chapter victory rewards for these classes offer one offensive, one defensive/setup and one engine card, sampled deterministically from distinct class-only lanes. Some uncommon build pieces are intentionally reachable during this short chapter; the full-run rarity progression remains in place.

| New card | Energy | Actual effect / tradeoff |
| --- | --- | --- |
| ยันต์รับแล้วสวน | 1 | Attack 5; attack 14 with at least 10 block. Setup must come first. |
| ดาบสุดแรง | 2 | Attack 10; attack 24 below 50% HP. Low HP remains dangerous. |
| เข่าครูมวย | 2 | Three attacks of 3; then strength +1 for the fight. Existing strength affects every hit. |
| สัญญาคู่กาย | 1 | Draw 1; gain 2 energy with a living allied spirit. Exhaust. |
| พรายซ้ำพิษ | 1 | Attack 6; draw 2 and gain 5 block if enemy already poisoned. |
| วงบรรพชน | 2 | Block 6; block 12 and draw 2 with two living allied spirits. Exhaust. |

Changed starter/economy outliers: temple blade 8→7; muay stance block 9→8; medium energy 4→3; whisper cost 0→1 and attack 4→5 (draw 1 retained). Fighter breath and lean deck exhaust. Offering tray no longer refunds its energy. Triple knee costs 2; counter punch adds one hit; war momentum is 5×3. Spirit lamp heals 4 and regenerates 2 for 3 turns (held effect retained).

| Ghost | Signature |
| --- | --- |
| ผีปอบ | Attack 6 and heal 2. |
| นางตานี | Block 7 and weakness for 2 turns (25% damage reduction). |
| กระสือ | Attack 5 and poison 2 for 2 turns; poison ignores block. |
| นางรำ | Two separate attacks of 4. |
| โป่งค่าง | Block 6 and strength +1 for the fight. |

First-chapter HP 42 / 50 / 68. Finale draws 3 and has 3 energy. Five ghosts use authored 15-card multisets, shuffled by the existing seeded RNG, avoiding randomly generated all-guard decks. Finale guard density was reduced during tuning to avoid endless heal/guard loops. Other ghosts retain their existing pool decks. Enemy effects resolve through one shared function, so legacy and current turn handlers agree. Trap negation still happens before an effect; lethal hits stop further hits. Revealed enemy cards show the new art, Thai name, multiple-hit count and effect description. No new enemy intent UI was added.

Monster descriptions now explain their actual signature. Class descriptions explain the two pilot build directions. Existing saves keep their stored cards/stats; start a **new run** to evaluate the complete new starter balance.

## Art

16 original alpha WebP assets under `assets/cards/`: six new player cards, five medium starter cards and five enemy signatures. Six player assets use `<id>.webp`; medium/enemy assets use `<id>-v2.webp`. `app/cardArt.ts` is the central identity map used by hand, preview, deck, reward, upgrades and revealed enemy cards. Upgrades retain the same art identity. Existing cards retain their earlier art.

Built-in image_gen; final prompts and paths in `docs/card-art-prompts-v15.json`. Flat black ink, faded ochre and blood red, Thai one-baht horror comic style, no printed UI text or card frames. Revised set uses `assets/ui/card-sword.png` as a style-only reference. Rejected photoreal drafts are not shipped. Images resized to at most 512px and encoded with alpha preserved.

## Save / visibility fixes found during verification

The remaining balanced-style AI `Math.random()` was replaced by the state-owned seeded RNG. This fixes different subsequent AI state/logs after suspend/reload. The real save/resume continuation test exposed this after changing the starter costs.

v1.0.14 APK/audit succeeded, but native smoke run 37652373221 failed when comparing the initial hand with the restored hand. Native screenshots show an invisible initial second card, with the same five cards visible after restore. Dealt cards now mount visibly at their real bounds instead of starting 200px offscreen and transparent; played-card animation is retained. Native smoke requires all five initial card labels before capturing the baseline, still compares them exactly after force-stop/relaunch, and checks the new 42→38 real helper damage.

## Validation

563 tests passed; TypeScript and clean web export passed with the temporary QA route removed. Mobile web at 393×852 and 360×640 verified all five dealt cards, illustrated preview/play callbacks and reward selection with readable conditional details. All 16 art assets were visually inspected and alpha/512px bounds checked (1,535,074 bytes total). Enemy reveal art and actual effect description were inspected. Production web flow also verified medium selection, prologue/blessing, live 42-HP encounter, all five initial cards and exact saved hand after restarting from the app root. Reloading an existing `/battle?monsterId=...` developer URL uses its existing direct-combat fallback rather than the app-root resume flow; the cold-root test mirrors native launcher behavior. Post-battle viewport now clips its background to avoid the source image extending the web document to 900px.

Source commit `4ce638941e80f6d4ffd0199e4fcebbca64ecdd5e`. APK/audit/API 36 smoke: https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37658871240 . Build in progress; no native pass claimed yet.

Seeded pilot: 40 seeds × two classes × two policies = 160 real-card chapter runs, no synthetic damage/HP or hidden enemy-intent knowledge. Both policies take reward index 0, skip level-ups, take the rest/event recovery and choose alternating routes. The board policy evaluates conditions, helper setup, status/energy/draw and a bounded defense budget. It is a heuristic, not an optimal player or human win-rate estimate.

| Class / policy | Wins / 40 | Mean final HP (including losses) | Mean enemy turns across chapter |
| --- | --- | --- | --- |
| Warrior / first affordable | 40 | 33.4 | 20.9 |
| Warrior / board policy | 40 | 28.3 | 9.9 |
| Medium / first affordable | 37 | 18.5 | 11.0 |
| Medium / board policy | 34 | 12.8 | 7.5 |

Baseline v1.0.14's eight-seed policy won 8/8 for every class, with most runs ending at full HP. The larger pilot now has meaningful HP pressure and some medium losses. Pilot policies/seeds differ from the old baseline; do not interpret the table as a controlled before/after human win-rate comparison. The all-class regression policy now reads actual conditional effects and helper fields rather than the nonexistent `summon` tag, retaining its minimum 6/8 completion requirement.

Next playtest: use both pilot classes on new runs; record chosen build cards, deaths, and fights that feel too long. Medium summon rush is fast but can leave too little defense. Nun sustain and the other classes' full card/mechanic passes remain later work; do not increase all damage globally to compensate for one strong class.
