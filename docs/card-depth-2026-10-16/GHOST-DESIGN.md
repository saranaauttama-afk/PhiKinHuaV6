# Ghost card depth — 16 October 2026

Implemented against main `0df3561`; owner authorized all 34 ghosts, alongside both playable classes. This supersedes the old 8–10-card deck limit, not the charge, riposte, phase, minion, or holy-water rules. No new engine primitive, art, status, summon, stun, steal or curse-card generator is introduced. Existing ghost artwork remains the card art.

## Design and exposure

The research recommends distinct decisions, readable enemy identities and individually usable cards, not copying NOTFM's raw card count. Night-one ghosts still teach one main rule. Later ghosts combine their established two rules. New cards provide modest guard/attack hybrids, bounded armor pressure, conditional follow-ups and low-HP fallback defenses. They do not give every ghost every mechanic.

Every tier retains a base draw of two cards per turn. The final selection adds one card every third actual ghost turn for elites/bosses in nights 2–3, capped by free hand slots; see BALANCE.md. The following base-draw exposure bounds intentionally omit that bounded bonus. A full first pass takes ceil(N/2) draw opportunities: 6 for 11–12 cards, 7–8 for 14–16, 9–10 for 18–20. Held cards can slow this; these are exposure bounds, not promises about fight duration. For a uniformly shuffled N-card deck with K thematic cards, probability of seeing at least one in d distinct draws is 1 − C(N−K,d)/C(N,d). Six distinct draws is a conservative three-draw-window lens, not a claim that every encounter lasts three turns. We retain original signature copies and reinforce each identity with different themed roles instead of padding basic strikes.

Boss phase one grows to 18–20 cards, but phase two is 14–16 because it has only the remaining HP (or revived HP) to work with. Its original phase-only attacks remain at 2–3 copies, with six or seven support cards inherited from phase one. This keeps the transition recognisable while avoiding the old eight-card loop. The head collector keeps one heavy ฉวยหัว and gains one lighter ขอบกระด้งฟาด (3 damage + 3 block, charge +2 damage). The prior nine-card deck clogged with two heavy charges; two distinct charge roles in eighteen cards preserve its former charge density without doubling the lethal payoff. Existing phase triggers, relic breaks, and revival are unchanged. The ultimate boss's phase-two stun falls from two copies to one to prevent an AP-denial loop.

Summon counts do not increase; no new theft or stun sources exist. New sweep cards are restricted to area-themed attacks and bosses and hit for only 2–3 base damage. Conditional cards always do something useful without their condition. Low-HP healing is deliberately small and conditional; it is not repeatable full healing. No new indefinite strength, poison scaling, or counter loops are added. The one new charge definition uses the existing capped charge and holy-water interruption rules.

## Size budget

Definitions: **267 → 421** (+154). Phase-one physical copies across the roster: **327 → 508**; sum of per-deck unique choices: **254 → 408**. The difference from total definitions is phase-exclusive cards.

| Encounter band | Ghosts | Physical cards per deck | Unique choices |
|---|---:|---:|---:|
| Early night one (T1–T2) | 6 | 11 | 9–10 |
| Later night one (T3) | 5 | 12 | 9–10 |
| Early middle roster | 6 | 14 | 11–13 |
| Later middle roster | 8 | 16 | 12–13 |
| Late elite roster | 3 | 18 | 14 |
| Night-one/two boss | 2 | 18 | 14 |
| Final/secret boss | 4 | 20 | 14–15 |

New IDs are `<owner_with_underscores>_depth_1..3` for early and late elite ghosts, `_depth_1..5` for middle ghosts, and `_depth_1..7` for bosses. Each is checked for a distinct mechanical fingerprint against all other cards belonging to that ghost. Numerically identical renamed attacks/guards were caught and replaced by poison-conditioned follow-ups, a guard/attack hybrid, or situational defenses.

## Roster inventory

Counts are **unique definitions / physical copies**, read from current source, not dated research. Every listed addition is a new distinct definition.

| Ghost ID | Before | After | Role | Player counterplay | Added cards |
|---|---:|---:|---|---|---|
| `phi-krasue` | 7/8 | 10/11 | หลบแล้วฉวยเลือด | ใช้หมัดเบาเปิดหลบ เก็บเกราะรับดูดเลือด | ไส้เกี่ยวชายคา · เลียแผลสด · ซุกหัวใต้ถุน |
| `phi-pop` | 7/8 | 10/11 | รอจังหวะกลืนกิน | อ่านชาร์จแล้วเก็บเกราะ อย่าปล่อยเลือดต่ำค้าง | เล็บควักชายโครง · งับคอคนอ่อนแรง · ซ่อนท้องอิ่ม |
| `nang-tanee` | 7/8 | 10/11 | คุ้มกอแล้วสวนกลับ | เจาะเกราะด้วยหมัดหนักหรือสาดน้ำก่อนหมัดเล็ก | ฟาดก้านกล้วย · ยางกล้วยติดมือ · ห่มใบแห้ง |
| `phi-nang-ram` | 7/8 | 10/11 | รำต่อเนื่องสลับตั้งหลัก | รับชุดรำด้วยเกราะและตัดจังหวะด้วยมึน | ส้นเท้ากระทบโรง · คลี่ชายสไบ · จีบหักข้อมือ |
| `phi-pong-kang` | 6/8 | 9/11 | ลิงคุ้มร่างดินโป่ง | กวาดลิงออกก่อน เก็บหมัดหนักเจาะดิน | ดินเค็มแตกกระเซ็น · ถล่มดินพอก · ฝุ่นโป่งเข้าตา |
| `ngu-phi-sang` | 7/8 | 10/11 | แสงหลอกกับไฟพิษ | ชำระพิษก่อนโดนซ้ำ เก็บแต้มเผื่อมึน | ไฟกัดรอยไหม้ · สะบัดหางไฟ · ควันพรางร่าง |
| `phi-pret` | 7/9 | 10/12 | แผลเปิดล่อปากเข็ม | ชำระเปราะบางและรับการซ้ำแผล | เล็บขูดแนวเกราะ · กอดท้องแห้ง · ก้มเลียรอยกรีด |
| `krahang` | 7/8 | 10/12 | โฉบชาร์จจากกระด้ง | เปิดหลบก่อนบุก เตรียมรับชาร์จ | สากเกี่ยวโล่ · โฉบเฉียดดิน · พับปีกลงนา |
| `kuman-thong` | 7/8 | 10/12 | เถ้ากระดูกคุ้มร่าง | กวาดสมุนก่อนเถ้าสะสม ชำระคำสาป | เถ้าลวกมือ · กระดูกทิ่มรอยสาป · รวบเถ้าคลุมอก |
| `phi-tai-hong` | 7/9 | 10/12 | แค้นเมื่อถูกทำร้าย | หลีกสวนด้วยการเจาะเกราะ เลือกจังหวะบุกให้จบ | เลือดคั่ง · รอยแผลไม่ปิด · ซ่อนศพใต้เสื่อ |
| `phi-pa` | 6/8 | 9/12 | เงาป่าพรางแรงลม | กวาดเงาออก อย่าเสียแต้มทั้งหมดก่อนมึน | หนามหวายฟาด · กิ่งไม้จากเงามืด · ใบไม้กลบรอย |
| `mae-nak` | 8/9 | 13/14 | รอผัว สวน และทวงของ | เจาะเกราะเพื่อคืนการ์ด ฆ่าลูกแดงก่อนบุกหนัก | เล็บขูดฝาเรือน · มือเอื้อมพ้นชาน · เงาทาบท่าน้ำ · กล่อมเรือนเงียบ · กอดผ้าห่มเก่า |
| `pop-yai` | 8/9 | 13/14 | ปากชาร์จและกินตับ | รับดูดเลือดด้วยเกราะ หยุดชาร์จเมื่ออันตราย | กัดทะลุชายเกราะ · ลิ้นเลียเลือด · ตะปบสองมือ · หนังท้องตึง · หมอบซ่อนเครื่องใน |
| `phi-ha-ratri` | 7/8 | 12/14 | ไฟโขมดเผาพิษ | ชำระพิษทำให้ไฟเบาลง เตรียมแต้มรับมึน | สะเก็ดไฟปลายหญ้า · เขม่าดำติดแขน · ถ่านแดงซ้ำแผล · ม่านควันดำ · ดับแสงหลบลม |
| `asuragaya` | 7/8 | 12/14 | กระโดดหนีแล้วชาร์จ | เปิดหลบด้วยการตีเบา อย่าทุ่มเกราะตอนผียังรอ | ส้นเท้าตอกพื้น · ตวัดเท้าสองจังหวะ · กระโจนข้ามโล่ · ยันขากับโคนไม้ · ซ่อนขาในพุ่มหนาม |
| `yak-wat-jaeng` | 6/8 | 11/14 | ขอส่วนบุญแล้วซ้ำแผล | ชำระเปราะบางก่อนรับปากเข็ม ลบคำสาปหลังไฟต์ | เล็บครูดบาตร · ดูดแผลคนลืมบุญ · คว่ำบาตรบังอก · แขนยาวพาดกำแพง · เสียงท้องร้อง |
| `phi-phrai` | 8/9 | 13/14 | น้ำพิษกับพรายรับหมัด | ชำระพิษและกวาดพราย อย่าปล่อยพิษสะสม | สาหร่ายบาดขา · น้ำวนใต้แผล · ฟองน้ำคุ้มร่าง · หินใต้น้ำกระแทก · ซ่อนในกอบัว |
| `winyan-rerorn` | 8/10 | 13/16 | แค้นตามติดและคำกระซิบ | หมัดหนักผ่านสวน รับชุดตีด้วยเกราะ | เงาตามรอยเลือด · เล็บครูดกำแพง · ลากเท้าผ่านฝุ่น · เสียงสะอื้นข้างหู · หลบใต้ชายคาร้าง |
| `pisaj-fai` | 8/10 | 13/16 | สุมไฟชาร์จและไฟรัว | อ่านไฟชาร์จ เกราะก้อนใหญ่รับไฟรัว | ถ่านพุ่งแตก · เถ้าร้อนเกาะโล่ · เปลวไฟเลียเกราะ · กำแพงควัน · หรี่ไฟซ่อนแกน |
| `jao-por-pa` | 7/10 | 12/16 | เสือและเถาวัลย์คุมดง | กวาดสมุนก่อนโจมตีผี เก็บการเจาะเกราะไว้ | หวายสะบัด · ตอไม้ถล่ม · ใบมีดจากพงไพร · ร่มเงาไม้ใหญ่ · ยางไม้สมานร่าง |
| `phi-nang-yai` | 7/10 | 12/16 | รำเปิดแผลแล้วกอดตาย | ชำระเปราะบาง ตัดจังหวะรำก่อนชุดเล็บ | ส้นเท้าสามจังหวะ · ชายสไบบังอก · เล็บจิกชายโครง · ตวัดแขนหลบเสา · เสียงครางใต้ถุน |
| `winyan-dek` | 7/10 | 12/16 | ดำน้ำหลบและดูดแรง | เปิดหลบก่อนกวาด เกราะหยุดการฟื้นจากดูดเลือด | ฟองน้ำกัดผิว · กระชากชายเสื้อ · เท้าเย็นเกาะหลัง · โคลนก้นบ่อ · นอนใต้ใบบัว |
| `yak-dam` | 8/10 | 13/16 | ปีกสวนคุ้มสากชาร์จ | อ่านสากชาร์จ หมัดหนักผ่านสวนปีก | กระด้งเฉือนขอบโล่ · สากไถลตามปีก · ปัดปีกสองข้าง · หุบปีกคุ้มอก · พักสากในเงา |
| `phi-mae-mai` | 7/10 | 12/16 | จุมพิตดูดแรงหลังฝัน | กันดูดเลือดด้วยเกราะ เร่งจบก่อนแรงไว้ทุกข์สะสม | เล็บแม่ม่ายกรีด · กอดคนอ่อนแรง · ลมหายใจเย็น · ม่านดำคลุมเรือน · กอดหมอนเปล่า |
| `phra-upakut` | 7/10 | 12/16 | เล็บเปิดแผลกับชาร์จฟื้น | ชำระแผล เร่งบุกก่อนฟื้นชาร์จเต็ม | ตะกุยรอยเกราะ · ลิ้นแตะแผล · เล็บสั้นสับซ้ำ · หนังหุ้มกระดูก · ท้องร้องก้องดง |
| `phaya-nak` | 11/15 | 14/18 | น้ำพิษกัดซ้ำใต้เกราะ | ชำระพิษก่อนระลอกใหญ่ ใช้เกราะรับแทนการฟื้น | สายน้ำเซาะเกราะ · ระลอกพิษคู่ · เกล็ดพรางแอ่งน้ำ |
| `thep-aksorn` | 11/15 | 14/18 | คำสาปผู้เฒ่าเปิดแผล | ชำระเปราะบาง เลี่ยงยืดไฟต์จนคำสาปเต็มสำรับ | ปลายไม้ขีดอาคม · อ่านรอยเลือด · เผากระดาษคุ้มร่าง |
| `phraya-maccurat` | 11/15 | 14/18 | ปอบดงดูดแรงบีบมือ | เกราะหยุดการดูดเลือด เก็บไพ่สำคัญผ่านมือหด | งับข้อมือ · กลืนแรงคนเจ็บ · ห่อร่างในหนังแห้ง |
| `night-head-collector` | 7/9 | 14/18 | กระด้งเก็บหัวและฉวยชาร์จ | ทำลายหัวในกระด้งก่อนชาร์จเต็ม เจาะสวนช่วงสอง | สากครูดขอบเกราะ · กระด้งตวัดวน · เงากระด้งคลุมบึง · โฉบซ้ำรอยหวั่น · ขอบกระด้งฟาด · ซุกหัวใต้กระด้ง · สากกวาดริมนา |
| `night-bell-keeper` | 7/11 | 14/18 | บาตร ระฆัง และเปรตบริวาร | กวาดบริวารก่อนบุก ช่วงสองเก็บเกราะรับระฆังใหญ่ | ไม้ระฆังเคาะเกราะ · เสียงก้องรอยแผล · ขอบบาตรบาดมือ · ชายจีวรบังบาตร · เคาะระฆังสั้น · บาตรหนักตกใส่ · เก็บเศษบาตร |
| `night-root-lord` | 7/10 | 14/20 | รากคุ้มไทรก่อนกิ่งสวน | กวาดราก เจาะเกราะก่อนตีเพื่อหลีกสวน | รากเซาะขอบโล่ · กิ่งแตกจากเปลือก · ใบไทรบดบัง · เมล็ดไทรกระหน่ำ · ยางไทรสมานรอย · เถาไทรกวาดพื้น · กิ่งต่ำค้ำร่าง |
| `night-cave-mother` | 7/10 | 14/20 | พรายน้ำ พิษ และคลื่นถ้ำ | ชำระพิษและกวาดพราย รับคลื่นหลังเปลี่ยนช่วง | หินงอกบาดเท้า · น้ำวนใต้หมอก · คลื่นเซาะโล่ · ผลึกถ้ำกำบัง · หยดน้ำกระหน่ำ · ไอเย็นหุ้มร่าง · น้ำซัดชายถ้ำ |
| `night-headless-king` | 8/10 | 15/20 | อาคมชาร์จก่อนคืนชีพรำรัว | รับชาร์จในช่วงแรก เก็บเกราะรับฟันรัวหลังคืนชีพ | คมมีดขูดอักขระ · ควันยากัดคอ · แทงตามควันยา · ผ้ายันต์พันอก · ยาเคลือบกระดูก · มีดหมอสะบัดคู่ · เถ้าหม้อกวาดลาน |
| `phi-kin-hua` | 7/11 | 14/20 | หัวลอยคุ้มการกลืนก่อนคลั่ง | กวาดหัวลอยเพื่อคืนไพ่ เจาะเกราะสวน รับดูดเลือดช่วงคลั่ง | เขี้ยวขูดขอบเกราะ · กัดซ้ำคนไร้แรง · ลมหายใจจากหัวที่หาย · ขากรรไกรทับเงา · เงาหัวลอยบังอก · ผมยาวกวาดพื้น · ซ่อนคอในความมืด |

## Phase-two continuity

| Boss | Before | After | Preserved centrepiece |
|---|---:|---:|---|
| `night-head-collector` | 6/8 | 11/14 | ตั้งกระด้งรับ · โฉบหนอง |
| `night-bell-keeper` | 7/9 | 12/15 | เคาะระฆังใหญ่ · จีวรขาด |
| `night-root-lord` | 6/9 | 12/15 | ไทรโอบ · กิ่งฟาด |
| `night-cave-mother` | 7/8 | 13/15 | คลื่นถ้ำ · เสียงก้อง |
| `night-headless-king` | 5/8 | 11/15 | ร่ายเวทเร็ว · ฟันอาคม |
| `phi-kin-hua` | 6/9 | 12/14 | กินหัวคำสุดท้าย · เรียกชื่อเจ้าของหัว |

## Validation scope

`test/card-depth-ghosts.test.ts` covers roster growth/ownership, meaningful mechanic diversity, bounded disruption, reachable setup/payoff pairs, phase continuity and signature sampling probability. It also exercises every new card through the real enemy planner on several public board states, and draw/retain/charge cycling without changing RNG rules. Existing charge/riposte/holy-water/minion tests remain authoritative for shared mechanics. Campaign simulations and human mobile play are required before interpreting this as a balance improvement; larger decks also change seeded shuffle consumption.

### Verification on this pass

- `npx tsc --noEmit`: passed.
- `npx vitest run test/card-depth-ghosts.test.ts`: all 9 passed.
- Combined with `test/ghosts-night1.test.ts`: 49 passed; only the obsolete night-one “≤10 cards” assertion failed. Coordinator owns updating that pre-expansion bound; all 40 existing mechanical ghost tests passed.
- `git diff --check` on changed ghost data/code: clean.
- The six-draw nonbaseline-card exposure test is a **theme/variation check**, not a guarantee of drawing one specific signature. A singleton summon or theft card intentionally stays rarer in the larger deck to keep its counterplay useful. Old heavy signature copies remain intact; a boss phase still has repeated exclusive centrepieces. Final paired simulations are owned by the coordinator and should be reported separately from these structural checks.

## Narrow balance pass after 120 runs per cell

The untuned expanded roster produced warrior **88/80/68/58/43%** and shaman **89/88/87/83/46%** on difficulties 1–5. This is a joint class/deck/AI result, not an isolated measurement of ghost data. Warrior difficulties 3–4 already met the intended range, so no general tier-three damage or HP increase was applied. Shaman pool ablation remains a separate investigation.

Two head-collector cards were reprofiled: **สากครูดขอบเกราะ** changes 5×1 to **3×2**, with its existing breakBlock 4 unchanged; **กระด้งตวัดวน** changes 3×2 to **2×3**, retaining total base damage 6. The latter name replaces กระด้งตวัดคู่ because it now has three hits. Their additional hits make the existing night-one difficulty-3+ rage and earlier difficulty-4+ rage matter more, while low-difficulty base damage rises by only one on the first card and stays identical on the second. This uses the existing rage rules and preserves readable block/minion counterplay.

Four phase-two decks replace their one generic `v29_strike` with a third existing signature: collector **ตั้งกระด้งรับ**, bell keeper **เคาะระฆังใหญ่**, cave mother **คลื่นถ้ำ**, and headless king **ร่ายเวทเร็ว**. Sizes stay 14/15/15/15; no new definition or distinctive support card is removed. These generic strikes remain in phase one, so all roster definitions stay reachable. Phase-two unique counts decrease by one apiece because the intended change is signature density. Summon, stun, steal and curse-generator counts are unchanged, and charge/duplicate bounds remain at three. The final head-eater is unchanged to avoid restoring its former disproportionate shaman wall.

This pass intentionally leaves HP, tier-three normals, phase triggers, minion rules, new class cards, and the corrected krahang conditional-hit semantics untouched. Validation below checks the existing ghost mechanics and data/phase bounds; further win-rate claims require the next simulation snapshot.

### Phase-two exposure caveat and isolated draw ablation

Unlike phase one, `checkGhostPhase` does **not** shuffle. It resets the hand, rotates the data-ordered phase-two deck by `ghostTurns`, and begins drawing from that rotation. Therefore the hypergeometric first-pass illustration above is not a probability model for phase two. A two- or three-turn phase can repeatedly miss support definitions near the end of that rotated order; actual cards drawn/played and charge maturity matter more than deck size alone.

An isolated scratch diagnostic tests elite/boss draw **3** (normal draw stays 2; hand 5, retain 3 and AP 3 unchanged), with production rules unchanged. With three retained cards, the hand cap still allows only two new draws. With two or fewer retained, the extra draw increases both exposure and free-attack throughput, so it is a real difficulty change rather than a cosmetic variety improvement. Its 60-run cells on difficulties 3–5 must be compared with the matching retune-a cohort before adopting it. No cleanse cards are included in this ablation.

### Universal draw-three result: rejected

The isolated 60-run cells used the same `tune` seeds and retune-a snapshot. Normal enemies still drew two cards. Elite/boss draw three overcorrected difficulty, despite almost unchanged encounter lengths:

| Class | Retune-a win%, d3/d4/d5 | Universal draw3 win%, d3/d4/d5 |
|---|---|---|
| Warrior | 77 / 68 / 40 | 42 / 30 / 17 |
| Shaman | 87 / 78 / 33 | 42 / 33 / 5 |

The following aggregates combine difficulties 3–5 (180 runs per class); later encounter samples are survivor-selected. HP loss is net before/after encounter and includes any healing; it is not a damage-event sum.

| Snapshot | Class | Kind | Fights reached | Mean turns | Deaths | Mean net HP loss |
|---|---|---|---:|---:|---:|---:|
| retune-a | warrior | normal | 3195 | 3.82 | 39 | -0.19 |
| retune-a | warrior | elite | 341 | 4.12 | 6 | -5.67 |
| retune-a | warrior | boss | 402 | 5.82 | 24 | 19.18 |
| retune-a | shaman | normal | 3800 | 3.19 | 15 | -0.72 |
| retune-a | shaman | elite | 431 | 4.07 | 4 | -5.15 |
| retune-a | shaman | boss | 495 | 6.20 | 42 | 26.04 |
| draw3 | warrior | normal | 2296 | 3.75 | 32 | -0.41 |
| draw3 | warrior | elite | 182 | 4.02 | 5 | 3.87 |
| draw3 | warrior | boss | 287 | 5.53 | 90 | 38.91 |
| draw3 | shaman | normal | 2977 | 3.09 | 10 | -1.48 |
| draw3 | shaman | elite | 272 | 4.13 | 21 | 8.61 |
| draw3 | shaman | boss | 361 | 5.81 | 101 | 44.32 |

The first-night warrior wall is especially clear: collector deaths at d3/d4/d5 change **4/56 → 24/56**, **4/53 → 25/53**, and **14/45 → 27/45**, with exactly matching reach counts. The shaman also suffers later: bell-keeper deaths change **1/55 → 15/47**, **2/54 → 10/38**, and **11/45 → 15/28**. Thus this is not just counterpressure against sealing; it raises damage throughput too far for both classes. Do not adopt universal draw three.

A follow-up scratch-only ablation preserves first-night draw two and uses draw three only when `(campaign.night ?? 1) >= 2` and `enemyKind(state) !== 'normal'`, set in `buildAndShuffleEnemyDeck` immediately before hand initialization. Missing campaign defaults to night one. The setting persists through the existing phase-two hand reset. The diagnostic snapshot SHA256 over sorted `src`/`scripts` path+NUL+contents, followed by package/tsconfig/vitest config, is `d73bed064d3e3d3f250b93ee71aafe4cbc852d4b5924d50ce9111e9a8cadf3ee`; changed handler SHA256 is `3f0717bba43383f9fe36ea3b395b19562121f76f20e29b87a073c23265dcb096`. This rejected diagnostic kept production base draw two; the final bounded cadence decision is documented in BALANCE.md.

### Night-two-plus draw-three result: also rejected at current card numbers

All **360 first-night per-seed fight records** exactly match retune-a, confirming that the gate preserved early combat. Later throughput still overshoots the intended difficulty:

| Class | Retune-a win%, d3/d4/d5 | Night2+ draw3 win%, d3/d4/d5 |
|---|---|---|
| Warrior | 77 / 68 / 40 | 60 / 38 / 20 |
| Shaman | 87 / 78 / 33 | 43 / 40 / 5 |

| Class | Kind | Fights reached, d3–5 | Mean turns | Deaths | Mean net HP loss |
|---|---|---:|---:|---:|---:|
| warrior | normal | 2933 | 3.85 | 39 | -0.27 |
| warrior | elite | 276 | 4.27 | 16 | 6.42 |
| warrior | boss | 350 | 5.80 | 54 | 30.00 |
| shaman | normal | 3326 | 3.16 | 14 | -0.84 |
| shaman | elite | 318 | 4.12 | 28 | 8.75 |
| shaman | boss | 392 | 5.74 | 85 | 36.63 |

The bell keeper becomes the new wall: warrior deaths by d3/d4/d5 change **0/46 → 8/45**, **1/42 → 12/37**, **1/25 → 7/24**; shaman **1/55 → 19/52**, **2/54 → 16/49**, **11/45 → 20/36**. Shaman elite deaths also rise from **0/3/1 to 7/10/11** across the three cells. Mean fight lengths barely change: increased card throughput raises incoming damage, rather than merely making a longer visible sequence of choices.

Recommendation: keep production draw **2**. The data rejects both universal and night-two-plus every-turn draw three without a much broader damage rebalance. A future exposure experiment should use a bounded extra draw (for example, one extra card only on phase entry) or interleave phase-two supports with signatures, with actual phase card exposure measured. These are proposals, not implemented behavior. Sparse cleanse cards remain a separate themed design choice and should not be used as a substitute for this failed cadence change.

Diagnostic files: `card-depth-draw3.json/.log` and `card-depth-draw3-late.json/.log` in the scratch workspace; exact gate/snapshot hashes are above. No production draw rule was modified during either experiment.

## Final phase-two rotation correction

The actual-rotation audit found that every expanded phase had entry offsets whose first six draws contained **zero** phase-exclusive cards. The earlier hypergeometric assertion was inappropriate for `checkGhostPhase`'s deterministic rotation. The long inherited-support tails were a real variety failure.

Phase-two cards are now **reordered only**: exclusive attacks are evenly spaced around the circular deck, other exclusive cards divide remaining long gaps, and inherited supports fill the open slots in their previous relative order. Every physical-card multiset, definition, number, phase threshold, and relic/revival behavior is unchanged. This preserves the separately chosen production draw cadence (one extra card every third late elite/boss turn); this correction does not alter drawing rules.

| Boss | Cards | Largest gap without any exclusive | Largest gap without exclusive attack | Guaranteed exclusive attack within first N draws |
|---|---:|---:|---:|---:|
| `night-head-collector` | 14 | 3 | 6 | 7 |
| `night-bell-keeper` | 15 | 3 | 3 | 4 |
| `night-root-lord` | 15 | 4 | 4 | 5 |
| `night-cave-mother` | 15 | 4 | 4 | 5 |
| `night-headless-king` | 15 | 2 | 4 | 5 |
| `phi-kin-hua` | 14 | 4 | 4 | 5 |

For every possible rotation, the first six draws now contain a phase-exclusive card. Exclusive attacks achieve the smallest possible maximum circular gap for their copy count. The collector has only two exclusive attacks in fourteen cards, so no ordering can guarantee an exclusive attack in every six-card window: its honest bound is **seven draws** (at most four two-card draw windows). Other bosses meet a four- or five-draw exclusive-attack bound. The bell keeper's attack set includes its old `v29_signature`, which is absent from phase one; its named big-bell card remains a separate charge threat.

The phase test now calls the real `checkGhostPhase` and `drawEnemyHand` at **every rotation offset**, verifies the resulting rotated order, checks exclusive exposure within six cards, and checks the optimal per-deck exclusive-attack bound. It intentionally does not claim a charged attack must be played within that window: retained charge maturity, sealing, and combat ending still affect execution.


## Final selected cadence

Base draw remains two. `ENEMY_DRAW_CADENCE` adds one draw only on ghost turns 3, 6, 9… for elite/boss encounters in campaign nights 2–3. It never adds hand slots, retention, AP or an opening draw, and preserves saved base-draw values. The hand detail explains the rule. This replaces neither phase-two rotation nor the reorder-only interleaving above. The every-second-turn diagnostic and less frequent every-third-turn comparison are preserved in BALANCE.md; final matrix validation includes the interleaved decks.
