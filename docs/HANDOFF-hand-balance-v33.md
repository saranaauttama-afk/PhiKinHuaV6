# v33 — independent hand balance and explicit combo removal

Work branch: `work/hand-balance-v33`. Base application tree is the audited v32 tree (`067b4fe`), identical to main merge `98bda80839e10e6428ab83d3de37657fc890e234`. No APK build or main merge is authorized for this task.

## Behavior

- Fresh three-night runs start with two energy, two opening cards, two cards drawn each subsequent turn, and two retained normal cards at turn end. Draw effects may temporarily exceed retention. All excess normal cards must be selected and discarded before the enemy can act; both engine end-turn paths enforce this for v33 runs.
- QA พระประธาน is an extra card, consumes no retention slot, cannot be selected for discard, and never increases the cap.
- After the first guardian and ordinary rewards, a mandatory choice independently raises opening/per-turn draw from two to three **or** retained hand size from two to three. Later level choices can improve the other side, with base values capped at three in this initial balance pilot. Night-one level rewards do not increase either stat.
- No explicit sequence/progress/completion tracking, extra chain rewards, free-card quota, damage modifier, debuff immunity, HUD/book/notice/overlay or QA commands remain. Run and journal views no longer show combo totals. No replacement meter exists.
- Normal block/strength/poison/status conditions, minions, card/gear/blessing draw, energy, healing, held effects and per-turn card cost rules remain. Minion draw is additive, like other draw effects, independently of the retention cap.
- All four classes, v32 battle geometry and artwork, the continuous three-night campaign, 30/31 fight gates and five difficulty tiers remain. No asset files were changed.

## Card and blessing audit

All 38 former sequence-member cards retain their IDs, names and artwork, and have independent runtime effects. The audit list is `docs/v33-former-chain-cards.json`; every entry has a regression exercising real PlayCard.

Nine existing shaman cards had unsupported advertised effects, missing useful effects, or misleading descriptions. Existing images/names are retained:

| Card | v33 normal effect |
| --- | --- |
| วิญญาณบรรพบุรุษ | Draw 2, gain 1 energy; exhaust |
| อาถรรพ์ดำ | Damage 40; exhaust |
| เทพารักษ์ | Heal 50, block 12, cleanse debuffs; exhaust |
| ยาชาววัง | Heal 8, block 4; exhaust |
| พิธีบวงสรวง | Draw 3; exhaust |
| ทรงผี | Draw 2, gain 1 energy |
| เสียงระฆัง | Block 6 and weakness for one turn |
| ผงเจ้าพ่อ | Block 4; corrected description |
| ดูดวิญญาณ | Damage 5 and heal 5 |

Eight build blessings retain their broad normal triggers: ครูยันต์สวน, ครูเข่ามวย, ครูสายอาถรรพ์, ครูเลี้ยงกุมาร, อานิสงส์คืนวิชา, ครูธรรมจักร, ครูเชิญคู่กาย and ครูซ้ำรอยพิษ. Regression uncovered and fixed `build_hex` calling the shared damage function with an obsolete signature; it now deals its stated three damage. Existing equipment regression coverage remains.

## Compatibility

Save version remains 2. Map/adventure/battle saves and old journals remove obsolete combo state, modifiers, adaptation fields and metrics. Legacy earned achievement IDs are retained as history but no longer displayed or awarded. Money, class/difficulty progression, discovery records, deck/card upgrades, equipment and unrelated unlocks are retained. v32 runs keep their old hand/draw values; start a fresh run for v33 balance. Converted saved cards receive normal effects once, retaining card identity, cost reductions and existing numeric upgrade increments. Repeated load/save is idempotent.

## Verification

Local TypeScript and unit regressions pass. Web export passes. The web-only workflow `.github/workflows/v33-web-verification.yml` exercises both mobile viewports, all existing mobile interaction suites, cold v32 saves, exact multi-card discard, QA exclusion, no combo UI and both dawn choices. It also runs 320 seeded normal-card simulations (four classes × five tiers × two policies × eight seeds). Final results will be recorded after the workflow completes. It contains no Android build/deploy steps, and the existing APK workflows do not target this branch.

Balance is provisional: removing large sequence bonuses reduces burst power and the new small retained hand reduces options. Converted rare/legendary shaman cards and draw/energy engines warrant real-player pacing checks. Simulated policies do not establish fun or human win rates. No APK or main merge was performed.
