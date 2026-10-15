# Player card depth — 16 October 2026

Authorized scope: extend นักมวย and หมอผี alongside ghost roster expansion; preserve class rules, existing art and global economy. Each class now has 60 cards (59 ordinary pool + existing locked book reward), up from 53. Seven focused additions per class; no existing card numbers or starter quantities changed. This expands decisions rather than raising the baseline damage floor. Numeric effects remain in the card data, with existing engine constants controlling rhythm, bruises, seal, bowl, and blood rules.

## Why these additions

The existing sets already have coherent engines. Warrior's attack routes were well supplied, but camp had no class healing tool and defensive turns offered few ways to maintain move sequencing. Shaman already had three recognizable engines, but full-bowl and yant tended to compete, while familiar support often consumed a draw without helping when the familiar was absent. The additions connect those routes with useful, deliberately modest fallback effects.

Research basis: `docs/research/notfm/NOTFM_System_Research_2026-10-13.md` and its Phase6 gap analysis prioritize distinct resource loops, retaining/setup decisions, and meaningful equipment/counter choices. No copied NOTFM card values, restored combo tracking, fusion, or extra equipment slots.

## Early and late build recipes

These are draft packages, not a requirement to collect every listed card. Starter decks remain ten cards and function before any reward. All new Common/Uncommon pieces appear in the milestone-zero class pool; no unlock is needed. Rare cards are optional late payoffs under the existing night-weighted reward economy, not new milestone gates. Existing locked rewards stay locked.

| Route | Early package | Transition / payoff | Decisions and limits |
|---|---|---|---|
| Warrior rhythm / multiple hits | Starter four moves + guarding_elbow, checking_knee | measured_breath, triple_knee; shadow_flurry optional | Defensive attacks preserve attack cadence; breathing costs AP and only replaces itself at rhythm 3. Alternate moves rather than spam one type. |
| Warrior bruise / heavy | jab, checking_knee, stare_down, starter slant_elbow | bruise_guard, clinch_knee, last_bell_elbow; glass_wraps optional | Keep bruises for stronger guard/multi-hit or spend them with heavy; round-three elbow rewards retaining a finisher. |
| Warrior block / riposte | gate_watch, guarding_elbow, parry_bait | bruise_guard, stand_firm, yantra_shorts | Block must cover the next attack completely. Marks can support defense before the heavy cashout. Does not negate debuffs or every hit in an enemy turn. |
| Warrior camp / rounds | call_pupil, corner_towel, existing starter moves | call_corner/call_pi, temple_ring_sweep; call_senior optional | Towel keeps surviving camp members alive, cannot resurrect them, and competes with summoning for AP. Round timing adds guard rather than free player healing. |
| Shaman bowl / overflow | meditation, fill_bowl or yant_ladle, starter splash | full_bowl, brimming_yant, bronze_bowl; overflow_trough optional | Keeping water enables yant control instead of immediately cashing out splash. Seal's native two-water refund can overflow, but each bridge consumes a card and AP. |
| Shaman yant / control | cursed_needle, paper_yant, yant_ladle | brimming_yant, sai_sin, yant_burst/ward; sealed_bowl_rite optional | Wake existing marks for immediate effects or save to five and remove the highest-charge held ghost card. Threaded needle specifically rewards reading charge. |
| Shaman blood / familiar | blood_offering, ghost_debt, familiar_ward + hun_payon_call or rak_yom_call | blood_thread, direct_poison_spell, spirit_rice_scatter; bone_rosary/hong_phrai optional | Blood thread offers defense when dry, but really spends HP and never heals it back. Familiar ward works weakly alone; summoning first earns its full value. |

## Added warrior cards

All attack cards are free as required by class rules; AP actions compete with guard/summoning. Existing rhythm adds per-hit damage, so additions avoid extra hits and unconditional draw on attacks.

| ID / Thai name | Rarity / cost | Effect and reason |
|---|---|---|
| guarding_elbow / ศอกบังหน้า | Common / free | 3 damage, 3 block; after punch +3 block. Early defensive elbow that forgoes a heavy cashout. |
| checking_knee / เข่าสกัดวงใน | Common / free | 4 damage, bruise 1; after kick +4 block. Makes kick→knee a setup route instead of another large finisher. |
| corner_towel / ผ้าขาวม้ามุมเวที | Common / 1 AP | 4 block, heal each camp member 4; last turn of round +4 block. Camp repair with fallback guard, no player healing. |
| measured_breath / หายใจตามกลอง | Uncommon / 1 AP | 5 block, keep rhythm; at rhythm 3 draw 1. Retention bridge that pays AP, neither generates attacks nor refunds AP. |
| bruise_guard / ปิดรอยช้ำรอสวน | Uncommon / 1 AP | 7 block, arm riposte 5; at bruise 3 +5 block. Makes keeping marks a defensive choice. |
| temple_ring_sweep / เตะเปิดวงค่าย | Uncommon / free | 4 sweep damage; living camp member +3 damage. Camp-to-rhythm bridge that is weaker than sweep_kick when alone. |
| last_bell_elbow / ศอกส่งท้ายยก | Rare / free | 7 heavy damage; last turn of round +10 block. A timing-dependent alternative to pure heavy burst; consumes all bruises as usual. |

## Added shaman cards

| ID / Thai name | Rarity / cost | Effect and reason |
|---|---|---|
| yant_ladle / กระบวยลงยันต์ | Common / 1 AP | Water +2, yant 1. Trades fill_bowl's block for control setup; never draws. |
| threaded_needle / เข็มร้อยสายสิญจน์ | Common / free | 4 damage; ghost charging grants yant 2. Weaker than starter needle without the charge cue. |
| familiar_ward / สายสิญจน์คล้องของเลี้ยง | Common / 1 water | 5 block, heal familiars 3; living familiar +4 block. Cheap recovery against sweep pressure, reasonable fallback if drawn before the familiar. |
| brimming_yant / ยันต์ชุบน้ำเต็มขัน | Uncommon / 1 AP | 5 block, yant 1; water at least 8 adds yant 2. Bowl conservation feeds seal without spending water. |
| blood_thread / ด้ายแดงผูกเงา | Uncommon / 2 water, blood | 6 block, yant 1; below half HP +3 block and yant 1. Blood-to-control bridge with real HP risk; low-HP condition is evaluated after payment. |
| spirit_rice_scatter / ข้าวเสกเลี้ยงบริวาร | Uncommon / 2 water | 4 sweep damage, heal familiars 3; living familiar +4 damage. Offensive familiar support; no unconditional healing to player. |
| sealed_bowl_rite / พิธีปิดขันกักเงา | Rare / 2 AP | 7 block; water at least 8 applies yant 4. Requires an existing mark for immediate seal; expensive AP payoff for conservation. Does not directly seal a clean target. |

## Expanded-ghost answers and vulnerabilities

- Charged heavy attacks: threaded needle adds marks, sai_sin removes charge, seal discards the highest-charge card. A seal refunds two water under existing rules. One card is removed, not the entire ghost hand.
- Minion swarms and guarded ghosts: temple_ring_sweep and spirit_rice_scatter supplement existing sweep tools. Familiar/camp condition rewards board setup; hostile sweep can remove that advantage.
- Enemy riposte / armor: small defensive warrior attacks can be a poor choice into thick armor because they may not hurt the ghost. Existing push_kick/heavy setup remain the answer; no new universal bypass.
- Damage-over-time and curse pressure: repair only affects friendly summons, never cleanses player statuses. Existing cleansing_bath/holy_water_spray still matter. Block alone cannot solve poison or corruption.
- Burst / phase shifts: bruise_guard and timed elbow can soften an attack but require setup; blood builds remain exposed when HP is low. Rare bowl rite consumes most early AP, so cannot also freely summon and guard.

## Engine and exploit audit

Uses only supported primitives. `addFx` currently merges damage/hits/block/heal/draw/mana/AP/borrow/status/cleanse, not arbitrary newer effect fields; no new conditional healMinions/seal effect relies on that unsupported behavior. Water threshold actions have zero water cost, avoiding the current post-payment condition evaluation ambiguity. No added card refunds AP. The only added draw is one card behind 1 AP and rhythm 3; corruption increases its cost normally. Free attacks add neither draw nor AP/water. Blood thread cannot self-heal; seal refunds can supply water but each mark card must be drawn/played and AP bridges remain bounded. Native equipment/minion triggers continue to use their existing limits.

## Validation and art

`test/card-depth-players.test.ts` exercises actual card plays: move sequencing, bruises into heavy and riposte, camp repair, paid conditional draw, water conservation into seal and its refund, charging vs uncharged hands, familiar-dependent defense, blood payment, rare payoff threshold, and class-pool obtainability. Existing class/art suites are retained; only their old exact-card-count assertions need the new 59-unlocked count.

All 14 new illustrations are generated and wired in both maps in `app/cardArt.ts`; no glyph-only additions remain. Each image was generated independently using the built-in image generator with real alpha. The generator returned 1254×1254; sources were normalized to transparent 1024×1024 PNG before resizing to 384×384 WebP. `generated-art.json` records full prompts, dimensions and SHA-256. Alpha bounds, dimensions, distinct hashes and readability at 80 px were checked. Existing complete entries and image files are unchanged. Shaman data and art manifests reproduce via `python3 scripts/mor-phi-data.py` and `python3 scripts/mor-phi-art.py`; warrior card data is directly maintained in class_cards.json as before.

Balance acceptance requires root's paired baseline/post-change simulations and phone play; these focused tests establish mechanics, not human build win rates. No global rarity/power inflation is included in this patch.
