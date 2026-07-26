# Redesign Context — PhiKinHuaV6 → "Night of the Full Moon" style

Living doc for the redesign conversation between the dev (saranaauttama-afk) and Claude. Update this as decisions get made — treat it as the source of truth for "what we agreed on," separate from `CLAUDE.md` (which is pure technical orientation).

Started: 2026-07-25

---

## 1. Where the project actually is right now

- Full mechanical loop already implemented: seeded-RNG map generation (15 fixed fights across 2 parts + optional secret boss), card combat, status effects, equipment, "blessing" (relic) system, shop with persistence/respawn, save slots. See `gameRule/gameSpec.txt` for the full original spec — it already explicitly names Night of the Full Moon as the reference, so this isn't a new direction, it's finishing a direction that was set from the start but never executed visually.
- Theme: Thai folklore ghosts (ผีกระสือ, ปอบ, กุมารทอง, แม่นาค, พญานาค, ...) as the monster roster, 31 monsters across tiers T1–T5 + Elite + 2 Boss tiers + Secret Boss.
- Visually: functional gray-box. UI chrome (frames, HUD icons, buttons) exists; almost no character/monster illustration exists yet (one monster image total). A few background scenes exist (`abandonedHut`, `swamp`, `battleScence1`, `startPage`).
- Latest engineering work (branch `animationComplete`/`updateBattle`) focused on battle feedback/timing, not visuals.

**Read `CLAUDE.md` for the technical map of the codebase** (file locations, state pattern, known issues). This doc is for design/direction, not code structure.

## 2. What "Night of the Full Moon" style means (reference points to align on)

Night of the Full Moon (月圆之夜) is known for a specific combination — worth being explicit about *which parts* we're borrowing, since "redesign in that style" could mean any subset of these:

1. **Hand-painted, storybook illustration** — soft painterly brushwork, not flat vector/anime-cel art. Characters and monsters read as illustrations out of a dark fairytale book, not game sprites.
2. **Framing as a physical book/artifact** — UI chrome styled like parchment, leather, wax seals, torn paper edges, candlelight vignettes — the interface itself is part of the fiction (you're paging through a cursed storybook), not a neutral HUD overlay.
3. **Restrained "living illustration" animation** — mostly-static painted scenes with small looping motion (candle flicker, mist drift, cloth sway, breathing) rather than full sprite animation. Combat impact is sold through screen effects/lighting/card motion more than character animation frames.
4. **Muted, moody, warm-vs-cold palette** — desaturated backgrounds with a few warm light sources (candle, lantern, moon) pulling focus; horror through atmosphere and silhouette rather than gore or bright FX.
5. **Narrative-first event/encounter cards** — encounters read like short illustrated story beats with a few choices, not just "here's a monster, fight it." Text and art share equal weight.
6. **Typography** — a refined serif/display font for narrative/flavor text vs. a cleaner face for numbers/UI, both evoking old-world print rather than a modern game HUD font.

Question to resolve with the dev: **which of these 6 are actually the goal**, vs. which parts of the *current* Thai-ghost identity should stay distinct rather than just copying NotFM's look wholesale (e.g., Thai temple/jungle/rural-horror visual vocabulary instead of NotFM's European fairytale one, even if the *technique* — painterly, book-framed, muted-palette — is shared).

## 3. Redesign scope — open question

Not yet decided how big this redesign is. Rough tiers, cheapest to most expensive:

- **A. Visual direction only**: art style guide + UI chrome restyle (frames, fonts, colors, card layout) applied to existing screens/flow, existing mechanics untouched.
- **B. A + UI/UX flow changes**: e.g., encounter/event presentation becomes more narrative-card-like, map presentation changes, combat screen layout rework — still same mechanical rules underneath.
- **C. B + content**: new/rewritten event text, monster flavor, blessing flavor to match tone; possibly new art asset pipeline (commissioned/AI-assisted illustration, sourcing plan).
- **D. B/C + mechanical changes**: if "Night of the Full Moon" is meant as a mechanical reference too (its choice-driven story encounters were as important to that game as its art), might mean encounter design changes, not just skin.

## 4. Decision log

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-25 | Redesign targets **all 6** NotFM style elements (§2): painterly storybook illustration, book/parchment UI framing, restrained living-illustration animation, muted-palette-with-warm-light, narrative-first event cards, old-print typography. | Dev wants the full aesthetic system, not a partial skin — confirmed explicitly over "art style only" or "UI framing only" options. This is Scope tier **B** (§3) at minimum: visual direction + UI/UX flow together, since book-framing and narrative-first event cards both require flow/layout changes, not just re-skinned assets. |
| 2026-07-25 | Keep the **Thai ghost / rural Thai identity clearly dominant** — technique borrowed from NotFM (painterly, book-framed, muted+warm), but subject matter, palette cues, and motifs stay Thai (rice fields, jungle, temples, cloth offerings, incense, banana groves), not a re-skin toward NotFM's European fairytale imagery. | Explicit choice over "blend" or "lean euro-fairytale" options. This is the identity anchor for every subsequent art/UI decision — when in doubt, pull toward Thai folk-horror reference (Thai ghost films, rural temple art, traditional Thai painting/mural style) over NotFM's own screenshots. |
| 2026-07-25 | Art pipeline: **AI-generated, then refined/composited** (not commissioned illustration, not placeholder-forever). | Fastest path to actually filling the asset gap (currently ~1 monster illustration total across 31 monsters + UI chrome). Implies we'll need a prompt/style-reference system to keep 31 monsters + UI frames + backgrounds visually consistent — that consistency system is itself a design task, see Working Notes. |
| 2026-07-25 | Scope is **B+C together** (§3): visual/UI redesign *and* content rewrite (event text, card/blessing flavor text, encounter framing) happen in the same pass, not visual-first-then-content-later. Mechanical rule changes (tier D — encounter design logic itself) stay out of scope unless raised separately. | Dev chose "ทำควบคู่กันเลย" over doing art/UI first and content later — text tone and visual tone need to land together for the storybook framing to actually read as one voice, not a reskin bolted onto old copy. |
| 2026-07-25 | Redesign work happens on a **new branch cut from `animationComplete`** (not `main`). | `animationComplete`/`updateBattle` is the latest engineering work (battle feedback/timing); branching from it keeps the redesign on top of current mechanics instead of reintroducing the gap vs. `main`. Branch name: `redesign-notfm-style`. |

## 5. Open questions to resolve with the dev

- [x] Which of the 6 NotFM style elements (§2) are the actual target? → all 6
- [x] Keep the Thai-ghost visual/cultural vocabulary distinct, or lean closer to NotFM's own European-fairytale look-and-feel? → stay clearly Thai
- [x] Art pipeline → AI-generated + refine/composite
- [x] Redesign scope → **B+C together**: visual/UI + content (event/card/blessing text) in the same pass. Mechanical encounter-design changes (tier D) stay out unless raised separately.
- [x] Branch → new branch `redesign-notfm-style` cut from `animationComplete`
- [ ] Platform/perf constraints: Expo/React Native — heavy painterly full-screen art + reanimated effects need to stay performant on mid-range Android (presumably the primary target for a Thai mobile audience). Worth confirming target devices before locking asset resolution/format/animation budget.
- [ ] Any existing reference boards / mockups / specific Thai-horror references the dev already has in mind (specific films, temple mural styles, illustrators) beyond "like Night of the Full Moon but Thai"?
- [ ] AI art pipeline specifics: which tool(s), how style consistency gets locked across 31 monsters + UI frames + backgrounds (style reference image? fixed prompt template? LoRA/character sheet approach?), and who does the refine/composite pass.

## 6. Working notes

*(running scratch space for ideas raised mid-conversation before they're firm enough for the decision log)*

## 7. NotFM mechanical gap (opened 2026-07-25)

Raised by the dev before starting the art pass: *"ระบบเกมส์เราเหมือน notfm ยัง หรือคุณทำตามแค่สเปกเดิม"*

Honest answer at the time: the engine had been built to the **existing `gameSpec.txt`**, which is
Slay-the-Spire-shaped, not NotFM-shaped. Five gaps were identified; the dev chose to close 1–4.

| # | Gap | Status |
|---|---|---|
| 1 | Enemy intent — declare next turn's action, so combat is planning not guessing | ✅ done |
| 2 | Character classes — per-class deck/stats/passives, the core of NotFM's replay value | ✅ done |
| 3 | Journey map — a visible path you walk, replacing the 3-slot rotating tray | ✅ done |
| 4 | Card fusion | pending |
| 5 | Narrative event encounters (story choices, not just shops) | not in scope yet |

### Decision: journey map replaces Dynamic Refresh (2026-07-25)

The old map was three slots that **re-rolled themselves the moment you cleared one**
(`Dynamic Refresh`, documented in `GAME_RULES_DEVELOPER.md`). Consequences:

- the player never saw what was ahead, and had no sense of distance travelled
- `pages.pageIndex` stayed `0` for an entire run, because pages never actually turned —
  which is what silently broke boss selection and monster tier progression before
- a "Proceed" button existed purely to escape a tray that would otherwise refill forever

Replaced with `src/core/map/journey.ts`: a layered DAG built **once at run start** and
visible end to end. Boss rows are one node wide (unavoidable), fight rows two, rest rows
two or three. A rest row always precedes a boss.

**The deliberately conservative part:** `ChooseOffer` / `CompleteNode` and every shop/event
handler were left untouched. `src/core/map/journeySync.ts` writes the reachable nodes into
`pages.current.offers`, so the change is *where the choices come from*, not how they resolve.

Notable consequences, all covered by tests:
- the secret boss row is **appended when unlocked**, not built up-front — otherwise the
  player would see it waiting on the map before earning it
- monster picking is now **predecessor-aware**: no path through the graph can put the same
  ghost in two consecutive fights (the previous per-page dedupe couldn't see across paths)
- fight rows are fixed at width 2 because T2/T4/T5 pools hold only 3 ghosts each — a 3-wide
  fight row can drain a pool and force a repeat on the row after it
- the Elite pool (HP 85–110) is now sliced by fight index; elites could previously appear
  from fight 3 at full strength, which the starter deck cannot beat

## 8. ระบบ placeholder ของอาร์ต (2026-07-26)

**การตัดสินใจ:** ทำ UI ต่อได้เลยโดยไม่ต้องรอรูปครบ ช่องไหนยังไม่มีรูปให้วาดกรอบ
placeholder ที่บอก **ชื่อ · ขนาด · ชื่อไฟล์ที่ต้องวาง · ภาพควรเป็นอะไร** แทน

โครงสร้างแยกสองชั้นโดยตั้งใจ:

| ไฟล์ | หน้าที่ | แก้เมื่อไหร่ |
|---|---|---|
| `src/art/catalog.ts` | เกม **ต้องการ** รูปอะไรบ้าง (ข้อมูลล้วน ไม่มี `require`) | generate จากข้อมูลเกม — เพิ่มผี/คลาส/พรใหม่แล้วช่องรูปโผล่เอง |
| `app/components/Art.tsx` | รูปที่ **มีอยู่จริง** ผูกกับ slot ไหน | วางไฟล์แล้วเพิ่มหนึ่งบรรทัด |
| `docs/art-checklist.md` | ลิสต์ของที่ยังขาด | `npm run art:checklist` |

ที่ต้องแยกเพราะ React Native / Metro บังคับว่า `require()` เป็น path คงที่ตอน build
สแกนโฟลเดอร์อัตโนมัติไม่ได้ — ความเสี่ยงคือ *วางไฟล์แล้วลืมต่อสาย* แล้วเกมยังโชว์
placeholder อยู่ทั้งที่รูปมาแล้ว `test/art.test.ts` ดักเคสนั้นไว้ (ยืนยันแล้วว่าเทสต์
แดงจริงเมื่อเจอเคสนี้ ไม่ใช่เทสต์ที่ผ่านตลอด)

**สถานะตอนตั้งระบบ: มีรูป 7 จาก 61 ช่อง** — ผี 1/23, บอส 0/5, คลาส 0/4, พร 2/12,
ฉาก 4/6, ภาพบนการ์ดโหนด 2/8, ไอคอนเส้นทาง 0/3

ลบไฟล์ตายที่เจอระหว่างทาง: `BlessingDialog.tsx` `EncounterDialog.tsx` `EncounterCard.tsx`
ทั้งสามเป็น mock ที่ไม่มีใครเรียกแล้ว และเป็นสามในสี่จุดที่ `require` รูปผีกระสือซ้ำกัน
`BlessingDialog` ยังอ้าง id พรที่ไม่มีจริงใน `blessings.json` (`regen_1`, `start_block_3`)
ซึ่งเป็นที่มาของชื่อไฟล์รูปพรสองไฟล์ที่มีอยู่ — ตอนนี้แม็ปตามความหมายภาพแล้ว

## 9. ระบบผสานการ์ด (NotFM 4) — 2026-07-26

**หลักคิด:** ผสาน ≠ ปลุกเสก

`shop_upgrade` ทำให้การ์ดใบเดิมแรงขึ้นเฉยๆ — สำรับเท่าเดิม
การผสานเอาสองใบมารวมเป็นใบเดียว → **สำรับบางลงหนึ่งใบ** จ่ายพลังงานครั้งเดียว
ได้ผลของทั้งสองใบ แลกกับความยืดหยุ่นที่หายไป (เดิมเลือกเล่นทีละใบตามสถานการณ์ได้
พอผสานแล้วต้องเล่นทั้งสองอย่างพร้อมกันเสมอ)

นี่คือเหตุผลที่มันน่าสนใจ: เด็คดีขึ้นเพราะ **เล็กลงและแน่นขึ้น** ไม่ใช่เพราะใหญ่ขึ้น

### กติกา

| ข้อ | เหตุผล |
|---|---|
| ค่าร่ายรวมกัน ≤ 3 | ไม่งั้นเอาระเบิดสองลูกมารวมเป็นลูกเดียวได้ |
| ค่าร่ายผลลัพธ์ = ใบที่แพงกว่า (ไม่บวกกัน) | นี่คือ "กำไร" ของการผสาน |
| การ์ดที่ผสานแล้วผสานซ้ำไม่ได้ | กันสโนว์บอล — ผสานได้ชั้นเดียว |
| ใบไหน exhaust ผลลัพธ์ก็ exhaust | ข้อเสียต้องไม่หายไปกับการผสาน |
| การ์ดเรียกผีสองใบผสานกันไม่ได้ | runtime เรียกได้ใบละตัว อีกใบจะหายเงียบๆ |
| เครื่องรางผสานไม่ได้ | ไม่ได้อยู่ในสำรับตอนสู้ |
| ผสานได้ครั้งเดียวต่อแท่น | ให้การเลือกมีน้ำหนัก |

**ข้อควรระวังที่เจอตอนออกแบบ:** ผลจริงของการ์ดหลายใบไม่ได้อยู่ที่ `dmg`/`block`
แต่อยู่ที่ `summonMinion` กับ `exhaust` — ถ้าบวกแต่ตัวเลข เอฟเฟกต์พวกนี้จะหายเงียบ
`fuseCards` จึงยกมาทั้งหมด และ `canFuse` ปฏิเสธเคสที่ยกมาครบไม่ได้ แทนที่จะยอมทิ้ง

(แท็กอย่าง `burn` / `curse` / `weaken` บนการ์ดยัง**ไม่มีโค้ดอ่าน**อยู่แล้วตั้งแต่ก่อนหน้านี้
คำอธิบายการ์ดสัญญาไว้แต่ระบบยังไม่ทำ — เป็นช่องว่างเดิม ไม่ได้เกิดจากการผสาน)

### โครงสร้าง

- `src/core/cards/fusion.ts` — กติกาและการแปลงข้อมูลล้วน ทดสอบง่าย
- `src/data/packs/base/fusion_recipes.json` — สูตรที่ออกแบบชื่อ/คำบรรยายไว้ 12 สูตร
  คู่ที่ไม่มีสูตรยังผสานได้ ใช้ชื่อที่ต่อกันอัตโนมัติ — **อยากให้รู้สึกว่ามีคนออกแบบ
  ก็เพิ่มสูตรในไฟล์นี้** ไม่ต้องแตะโค้ด
- โหนด `fusion_altar` บนชั้นพักของเส้นทาง → `shopKind: 'fusion'`
- `app/components/FusionAltarView.tsx` — เลือกสองใบ **เห็นผลลัพธ์ก่อนยืนยัน**
  โดยเรียก `fuseCards` ตัวเดียวกับ engine ตัวเลขที่เห็นจึงตรงกับการ์ดที่ได้เสมอ

**บั๊กเดิมที่เจอระหว่างทาง:** เงื่อนไข "โหนดไหนข้ามได้" ถูกเขียนซ้ำคนละแบบใน
`isShopLike` (UI) กับ `deleteShopFromMap` (engine) จน `treasure_single` เป็นข้ามได้
ฝั่ง UI แต่ engine ปฏิเสธ — ปุ่มข้ามกดแล้วเงียบ ตอนนี้รวมเป็น `isRestOfferKind` ที่เดียว

## 10. เหตุการณ์เล่าเรื่อง (NotFM 5) — 2026-07-26

ชั้นพักเดิมมีแต่ ร้าน / บ่อน้ำ / หีบ / แท่นผสาน ซึ่งเป็น **ฟังก์ชัน** ทั้งหมด —
เดินไปกดใช้แล้วเดินต่อ ไม่มีจังหวะไหนที่ต้องตัดสินใจอะไรที่มีน้ำหนัก

ตอนนี้โหนดพักมีโอกาสเป็น **เหตุการณ์**: มาถึงฉากหนึ่ง อ่านสิ่งที่เห็น เลือกว่าจะทำอะไร
แล้วอ่านว่าเกิดอะไรขึ้น เหตุการณ์ได้น้ำหนักสูงสุดในตารางโหนดพัก (8 จาก 25)

### สิ่งที่ทางเลือกทำได้

`hp` · `maxHp` · `gold` · `card` (ใบที่ระบุ) · `randomCard` · `removeRandomCard` · `blessing`

ทางเลือกล็อกได้ด้วย **ทองขั้นต่ำ · คลาส · สัดส่วนเลือด** — ทางที่ล็อกยังแสดงอยู่
พร้อมเหตุผลว่าทำไมกดไม่ได้ (ทางเทาที่ไม่บอกอะไรคือทางที่กวนใจเปล่าๆ)
และทางเลือกบางทางเป็นแบบ **เสี่ยงดวง** — ทอยกิ่งตามน้ำหนักตอนกด ไม่ใช่ตอนสร้างแผนที่
ผู้เล่นจะได้รู้สึกว่ากำลังเสี่ยงจริง แต่ยังใช้ rng ที่ร้อยมา รันจึงยังซ้ำได้ตาม seed

### ที่จงใจไม่ทำในรอบนี้

**เหตุการณ์ที่จบด้วยการต่อสู้** (ซุ่มโจมตี) — เข้ากับแนวมาก แต่ `fightCount` เพิ่มทุกครั้ง
ที่ชนะ ถ้าเหตุการณ์พาไปสู้ ลำดับไฟต์จะเลื่อนจนโครง 15 ไฟต์ตาม gameSpec เพี้ยน
ต้องแยกตัวนับ "ไฟต์ตามเส้นทาง" ออกจาก "ไฟต์ที่ชนะทั้งหมด" ก่อน ถึงจะเปิดได้อย่างปลอดภัย

### เนื้อหา

12 เหตุการณ์ ธีมผีไทยชนบทตาม §4 — ศาลริมทาง ยายขอข้าว ดงกล้วยตานี หมอผีเร่ร่อน
เสียงเด็กกลางทุ่ง บ่อน้ำร้าง งานศพกลางดึก ผ้าแพรบนต้นไม้ ทางแยกในหมอก ระฆังวัดร้าง
คนแจวเรือจ้าง ร่างทรงกลางลาน

ทุกคลาสมีจังหวะเฉพาะตัวอย่างน้อยหนึ่งเหตุการณ์ (มีเทสต์บังคับ) — แม่ชีสวดส่งวิญญาณ
นักรบวัดจับระฆัง หมอผีคุยกับหมอผีด้วยกัน คนทรงรับร่างต่อ

**ข้อบังคับที่มีเทสต์คุม:** ทุกเหตุการณ์ต้องมีทางที่ไม่มีเงื่อนไขอย่างน้อยหนึ่งทาง
ถ้าล็อกทุกทาง ผู้เล่นที่ไม่ผ่านเงื่อนไขจะติดค้างถาวร เพราะปิดโหนดไม่ได้ถ้ายังไม่ได้เลือก
