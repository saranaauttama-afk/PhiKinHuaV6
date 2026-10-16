# งาน: อนิเมชั่นเล็กๆ ให้ฉากต่อสู้มีชีวิต (battle juice) — ส่งให้ GPT

> เขียน 16 ต.ค. 2026 · อ้างอิง `main` ที่ `358bab9` (merge PR #24 minion-arrival)
> ที่มา: เจ้าของเกมดูคลิป Night of the Full Moon ตั้งแต่เข้าไฟต์จนรับรางวัล แล้วอยากให้ผีกินหัว "วืบวาบ มีชีวิต" แบบนั้น
> เราเทียบกับโค้ดปัจจุบันแล้ว รายการด้านล่างคือ **สิ่งที่ยังขาด** เท่านั้น ของที่มีอยู่แล้วห้ามรื้อ

## ข้อความส่งให้ GPT (คัดลอกไปวางได้เลย)

> แตก branch ใหม่ `work/battle-juice` จาก `main` ทำตาม `docs/battle-juice/TASK.md` (คือไฟล์นี้ — คัดลอกไปไว้ที่ path นั้นก่อน) ทีละข้อตามลำดับ J1→J10 แล้วทำภาพในหัวข้อ "ภาพที่ต้องสร้าง" ด้วย built-in image_gen
> ทุกข้อเป็นงานภาพอย่างเดียว ห้ามแตะกฎเกม ห้ามแก้ `src/core/**` นอกจากที่ข้อนั้นบอกไว้
> ทุกอนิเมชั่นใหม่ต้องเคารพ `useGameSettings(s=>s.reducedMotion)` (และ/หรือ `useReducedMotion()` ของ Reanimated แบบที่ `MinionRow` ทำ)
> จบแต่ละข้อให้ commit แยก · จบทั้งหมดรัน `npx tsc --noEmit` และ `npx vitest run` ให้ผ่าน · เขียน `docs/battle-juice/HANDOFF.md` บอกว่าทำอะไร ไฟล์ไหน ค่าเวลาเท่าไร และเหตุผล · push branch แล้วเปิด PR เข้า `main` **ห้าม merge เอง**

---

## กติการ่วม (ทุกข้อ)

1. **ภาพไม่ใช่กฎ** — `useCombatTimeline.ts` อธิบายไว้แล้ว: ตอนเล่นอนิเมชั่น state เกมคำนวณจบแล้ว ห้ามให้อนิเมชั่นไปยิง `dispatch` หรือหน่วงการเปลี่ยน phase ของเกม ถ้าต้องรอให้อนิเมชั่นจบก่อนโชว์ overlay ให้รอฝั่ง view (เช่น `timeline.isPlaying`, state ใน `battle.tsx`) เหมือน `victoryIntro` ทำอยู่
2. **ใช้ของที่มี** — `react-native-reanimated ~4.1` + `moti` มีแล้ว ไม่ต้องลงไลบรารีใหม่ ยกเว้น J10 (ไม่บังคับ) ห้ามลง Skia/Lottie รอบนี้
3. **reducedMotion** — เปิดแล้ว: ไม่มีสั่น ไม่มี particle ไม่มีการเลื่อนไกล เหลือแค่เปลี่ยนค่า/จางสั้นๆ ข้อมูลต้องยังอ่านได้ครบ
4. **ไม่บังปุ่ม** — overlay/particle ทุกชิ้นใส่ `pointerEvents="none"` และใช้ `layer` จาก `app/theme` ไม่ตั้ง zIndex เป็นเลขลอยๆ
5. **ประสิทธิภาพ** — อนิเมชั่นวนตลอด (ฉากหลัง) ใช้ transform/opacity บน UI thread เท่านั้น จำนวน particle บนจอพร้อมกันไม่เกิน ~12 ชิ้น
6. **โทน** — ผีไทยหนังสือการ์ตูนเล่มละบาท หลอนจริงจัง ไม่ใช่การ์ตูนน่ารัก: ใช้ควันธูป ขี้เถ้า หมอก หิ่งห้อย แทนหิมะ/ไฟประกาย/ดาว

---

## J1 · ผีกระพริบแดงตอนโดนตี
**ตอนนี้:** ผีโดนตีแค่สั่น (`MonsterArea` → `shake()`)
**ให้เป็น:** ตอน `shake()` ถูกเรียก ให้ภาพผีซ้อนอีกชั้นที่ย้อมแดงทั้งตัว (silhouette แดง) ขึ้นมา opacity ~0.85 ใน 40ms แล้วจางลงใน ~180ms พร้อมกับสั่นเดิม
**วิธี:** `GhostArt` รับ `silhouette` + `tintColor` อยู่แล้ว เพิ่ม prop สี (เช่น `tint?:string`) แล้วซ้อน `GhostArt` อีกชั้นใน `Animated.View` เดียวกับ `floatStyle` ใน `MonsterArea` (ต้องลอยไปพร้อมกัน) สีใช้ token แดงจาก theme (เพิ่ม `combatUiColors.hitFlash` ถ้ายังไม่มี) ใช้กับลูกสมุนใน `MinionRow.Figure` ด้วย (ตอน hp ลด)
**เหตุผล:** ใน NOTFM ทุกหมัดที่เข้าเนื้อ ศัตรูกลายเป็นเงาแดง 1 จังหวะ ทำให้รู้ทันทีว่า "โดน" ต่างจากโดนเกราะกันไว้ (ตอนนี้สั่นเหมือนกันทั้งสองแบบ)
**ตรวจ:** โดนเกราะหมด (hpLoss 0) ต้องไม่กระพริบแดง

## J2 · หลอดเลือดลดแบบมีแถบตามหลัง
**ตอนนี้:** `HealthBar.tsx` เป็น View นิ่ง ความกว้างกระโดดทันที
**ให้เป็น:** แถบแดงเลื่อนลงเร็ว (~150ms) แล้วมีแถบสีเหลืองซีด/ขี้เถ้า (token ใหม่ `healthBarColors.chip`) ค้างอยู่ใต้แดง ~350ms แล้วไหลตามลง ~400ms · ตอนเลือดเพิ่ม (ฮีล) แถบเขียวอ่อนขึ้นนำก่อนแล้วแดงตามขึ้น (หรือแค่แดงเลื่อนขึ้นนุ่มๆ ก็พอ)
**วิธี:** Reanimated shared value เก็บ fraction, ใช้ `onLayout` เอาความกว้างจริงแล้ว animate `width` หรือ `scaleX` (origin ซ้าย) · ตัวเลข `hp/maxHp` ตรงกลางเปลี่ยนทันที ไม่ต้องนับ
ใช้กับทั้ง `MonsterArea` และ `QuietPlayerHud` (ใช้ `HealthBar` ตัวเดียวกันอยู่แล้ว)
**เหตุผล:** ผู้เล่นเห็นว่า "หมัดนี้กินไปเท่าไร" จากแถบที่ค้าง ไม่ต้องจำตัวเลข
**ตรวจ:** `accessibilityValue` ยังเป็นค่าจริงทันที · เทสต์เดิมที่อ่าน HealthBar ยังผ่าน

## J3 · การ์ดที่ลงได้มีขอบเรือง
**ตอนนี้:** การ์ดที่ลงไม่ได้เป็นสีเทา (`hideGray`) แต่การ์ดที่ลงได้นิ่งเหมือนกันหมด
**ให้เป็น:** การ์ดในมือที่ `!disabled` มีขอบเรืองสีเทียน/ทองซีดรอบการ์ด เต้นช้าๆ (opacity 0.35↔0.7 รอบละ ~1.6s) เฉพาะตอนเป็นตาเรา (`enabled` ใน `PlayerHand`)
**วิธี:** ใน `Card.tsx` ใช้ภาพ `assets/ui/candle-selection.webp` ที่มีอยู่แล้ว (ตัวเดียวกับ `AdventureChoices`) หรือภาพใหม่ `card-ready-glow.webp` (ดูหัวข้อภาพ) วางใต้การ์ดขยายออก ~8% · การ์ดที่ `selected` อยู่แล้วใช้ `CandleSelection` เดิม ห้ามซ้อนสองชั้น
**เหตุผล:** NOTFM ใช้ขอบเรืองบอกว่าใบไหนลงได้ อ่านมือได้ในพริบตา โดยเฉพาะตอนแต้มเหลือน้อย
**ตรวจ:** reducedMotion = เรืองนิ่ง ไม่เต้น

## J4 · ผีตายแล้วสลายเป็นควันธูป
**ตอนนี้:** event `Died` (target `enemy`) เล่นแค่เสียง แล้วตัดไป `VictoryOverlay` ทันที
**ให้เป็น:** ตอน `Died` ของผี: (1) ผีกระพริบขาว/แดงครั้งเดียว (2) ภาพผีค่อยๆ จาง + ลอยขึ้นเล็กน้อย + scaleY ลด ~900ms (3) ควันธูป sprite 2–3 ก้อนลอยขึ้นจากตัวผี + ขี้เถ้า 8–10 จุดลอยขึ้นแล้วจาง (4) จากนั้นค่อยเปิด `VictoryOverlay`
ลูกสมุนผีที่ hp เหลือ 0 ใช้แบบย่อ (จาง + ควัน 1 ก้อน)
**วิธี:** เพิ่ม `dissolve()` ใน `MonsterAreaHandle` เรียกจาก `battle.tsx` ตอน `currentEvent.t==='Died' && who==='enemy'` · ขยาย `DURATION.Died` ใน `useCombatTimeline.ts` จาก 500 → ~1100 (เป็นค่าภาพล้วน ไม่กระทบกฎ) เพื่อให้ `victoryIntro` รอจนสลายจบ · ทำ component `AshPuff.tsx` (ควัน+ขี้เถ้า) ไว้ใน `app/components/battle/` ให้ J5/J8 ใช้ซ้ำ
**เหตุผล:** ตอนนี้ตอนชนะเป็นจังหวะที่ "แบน" ที่สุดในเกม ใน NOTFM ศัตรูไหม้หายแล้วการ์ดรางวัลลอยออกมา — เราเปลี่ยนเป็นควันธูป/ขี้เถ้าให้เข้าธีมผีไทย (ส่งวิญญาณ)
**ตรวจ:** ไฟต์ผีหลายตัว (`enemies.length>1`) สลายเฉพาะตัวที่ตาย · reducedMotion = จางอย่างเดียว ไม่มีควัน

## J5 · หน้าชนะศึกมีจังหวะ
**ตอนนี้:** `VictoryOverlay.tsx` นิ่งทั้งหน้า
**ให้เป็น:** (1) แผ่นป้ายตกลงมาจากด้านบน + เด้ง (`Easing.out(Easing.back(1.6))` ~420ms) (2) หัว "ชนะศึก" สั่นตราประทับเล็กน้อยตอนลงถึง (แบบ `BattleSeal`) (3) แถบ EXP วิ่งจากค่าเดิมไปค่าใหม่ ~700ms (4) "เบี้ย +N" นับขึ้นจาก 0 ~600ms (5) ด้านหลังรูปตัวละครมีแสงรัศมีหมุนช้ามาก (ภาพ `victory-rays.webp`) และควันธูปจาง 1–2 ก้อน (ใช้ `AshPuff`)
ปุ่ม "รับรางวัล" กดได้ทันทีตั้งแต่แรก (ห้ามล็อกรออนิเมชั่น) — กดแล้วข้ามอนิเมชั่นที่เหลือ
**ตรวจ:** EXP ข้ามเลเวล (ค่าใหม่ < ค่าเดิม) ให้วิ่งเต็มแล้วเริ่มจาก 0 หรือแค่ไปค่าใหม่ตรงๆ ก็ได้ แต่ห้ามวิ่งถอยหลัง

## J6 · ป้าย "ตาเรา / ตาผี"
**ตอนนี้:** บอกแค่ใน `turnLabel` ตัวเล็ก
**ให้เป็น:** ต้นเทิร์นเรา/ต้นเทิร์นผี มีป้ายผ้า/กระดาษ (สไตล์เดียวกับ `roundBanner` ที่มีอยู่) ตกลงมากลางจอ ค้าง ~700ms แล้วจาง · ข้อความ "ตาเรา" / "ตาผี" · ป้ายตาผีโทนแดงคล้ำ
**วิธี:** ใช้ state/การวาดแบบ `roundBanner` ใน `battle.tsx` · ห้ามบังการ์ดในมือ (วางที่ `battleLayout.hudTop - 70` แบบเดิม) · ถ้า `roundBanner` ขึ้นพร้อมกัน ให้ `roundBanner` ชนะ
**เหตุผล:** ผู้เล่นใหม่ไม่รู้ว่าตอนนี้ตาใคร ตอนผีเล่นการ์ดยาวๆ

## J7 · ฉากหลังไม่นิ่ง
**ตอนนี้:** `BattleBackdrop.tsx` เป็นภาพนิ่ง + gradient
**ให้เป็น:** (1) แถบหมอก `battle-mist.webp` สองชั้นเลื่อนแนวนอนช้ามาก (ชั้นหน้า ~40s/รอบ ชั้นหลัง ~70s/รอบ, opacity 0.18–0.3) วนต่อกันแบบไร้รอยต่อ ใกล้พื้น (ครึ่งล่างของโซนผี) (2) หิ่งห้อย/ฝุ่น 6–8 จุดลอยขึ้นช้าๆ สุ่มตำแหน่ง แต่ละจุดกะพริบจาง วนใหม่เมื่อหาย
**วิธี:** ใส่ใน `BattleBackdrop` ระหว่างภาพกับ gradient · seed ตำแหน่งด้วยค่าคงที่ (ไม่ใช้ RNG ของเกม)
**เหตุผล:** ใน NOTFM หิมะกับหมอกขยับตลอด ฉากเลยไม่ตาย — เราเปลี่ยนเป็นหมอกป่า/หิ่งห้อยให้เข้าธีม
**ตรวจ:** reducedMotion = ไม่มีหิ่งห้อย หมอกนิ่ง

## J8 · การ์ดทางบนแผนที่ไหม้หายตอนเลือก
**ตอนนี้:** `AdventureChoices` มี `PageFade` ตอนการ์ดโผล่ (มีแสงเทียนแล้ว ดีอยู่) แต่ตอนเลือกแล้ว/ใช้แล้ว การ์ดหายไปเฉยๆ
**ให้เป็น:** ตอนกด `onEnter` (และตอน `onDestroy`) การ์ดใบนั้นมีขอบไหม้ลามจากล่างขึ้นบน (mask ด้วยภาพ `page-burn-edge.webp` เลื่อนขึ้น) + ขี้เถ้าลอย (`AshPuff`) ~600ms ก่อนเรียก callback · ใบอื่นจางลงเล็กน้อย
**วิธี:** อนิเมชั่นนี้รอได้เพราะยังไม่ได้ dispatch — แต่ถ้า reducedMotion ให้เรียก callback ทันที · ไฟล์นี้ใช้ RN `Animated` อยู่ ทำต่อด้วย `Animated` เดิมหรือย้ายไป Reanimated ก็ได้ แต่ห้ามเปลี่ยน testID เดิม
**เหตุผล:** NOTFM ทำให้ "การเลือก" มีน้ำหนัก — ทางที่ไม่ได้เลือกก็หายไปจริงๆ

## J9 · ผีตีเรา: ตัวเราสั่น + เลือดกระเด็น
**ตอนนี้:** ผีตีเราแค่จอแฟลชแดง (`ScreenFlash`)
**ให้เป็น:** ตอน `Damage` target `player` และ `hpLoss>0`: (1) แผงรูปตัวเรา/HP ใน `QuietPlayerHud` สั่น (แบบเดียวกับ `shake()` ของผี แต่เบากว่า ±6px) (2) หยดหมึกแดง 4–6 จุดกระเด็นออกจากรูปตัวเรา (ภาพ `ink-blood-drop.webp`) (3) โดนแรง (`HeavyHit` หรือ hpLoss ≥ 25% maxHp) จอทั้งจอสั่นเบาๆ ±4px 1 ครั้ง
**ตรวจ:** เกราะกันหมด → ไม่มีเลือด ไม่มีสั่น (แฟลชเดิมก็ไม่ควรขึ้น — ตรวจด้วยว่าตอนนี้เป็นแบบนั้นแล้ว)

## J10 · ปุ่มความเร็วตาผี (+ สั่นมือถือ ไม่บังคับ)
**ตอนนี้:** `useCombatTimeline({speed})` รองรับอยู่แล้วแต่ไม่มีใครส่งค่า · การ์ดผีหนึ่งใบใช้ ~2.1s
**ให้เป็น:** เพิ่ม setting ใน `useGameSettings`: `enemySpeed: 1 | 1.5 | 2` (ค่าเริ่ม 1) แสดงในหน้าตั้งค่าเดิม · ส่งเข้า `useCombatTimeline` ใน `battle.tsx` · ห้ามแตะ `PHASE_*` ใน `EnemyHandCard` ตรงๆ ให้หารด้วย speed เท่ากัน
**ไม่บังคับ:** ลง `expo-haptics` (`npx expo install expo-haptics`) เพิ่ม setting `haptics` (ค่าเริ่ม เปิด) สั่น `Light` ตอนตีโดนผี, `Medium` ตอนผีตีเราเข้าเนื้อ, `Heavy` ตอนผีตาย — ถ้าทำ ให้เขียนในงาน HANDOFF ว่าทดสอบบนเครื่องจริงหรือยัง

---

## ภาพที่ต้องสร้าง (built-in image_gen)

**สไตล์ (ใส่ทุกภาพ):** Thai one-baht horror pulp comic effect sprite, matching the existing ผีกินหัว card art: rough black ink linework with coarse cross-hatching where it fits, muted vintage print colours (bone white, ash grey, faded ochre, brick/blood red), hand-drawn feel, transparent background (real alpha), no text, no letters, no logos, no frame, no border, no gradient background, no 3D render, no lens flare, not cute, not anime.

ขั้นตอน: สร้าง 1024×1024 (หรือตามที่ระบุ) พื้นหลังโปร่งใส → ตรวจว่า alpha จริงไม่มีพื้นขาว → ย่อตามขนาดในตาราง → เซฟ `.webp` RGBA ตาม path → บันทึก prompt + SHA-256 ลง `docs/battle-juice/generated-art.json` แบบเดียวกับ `docs/mor-phi/generated-art.json`

| id | path | ขนาดสุดท้าย | ใช้ที่ | Subject |
|---|---|---|---|---|
| incense_smoke | `assets/fx/incense-smoke.webp` | 384×384 | J4, J5 | A single soft curling plume of pale grey incense smoke rising upward, wispy ink-wash edges, fading out at the top, centred, nothing else |
| ash_fleck | `assets/fx/ash-fleck.webp` | 128×128 | J4, J8 | One tiny irregular flake of burnt paper ash, grey-black with a faint glowing ember-orange edge, centred, lots of empty space |
| victory_rays | `assets/fx/victory-rays.webp` | 768×768 | J5 | Radiating sun-ray burst drawn as thick hand-inked wedges in faded ochre on transparent, like old Thai temple-mural halo rays, symmetric around the centre, outer ends fading out |
| battle_mist | `assets/fx/battle-mist.webp` | 1024×256 (สร้าง 1536×384 หรือใกล้เคียงแล้วตัด) | J7 | A long horizontal band of low ground mist, soft pale blue-grey ink-wash wisps, **seamlessly tileable left-to-right**, densest along the bottom edge and fading to nothing at the top |
| firefly | `assets/fx/firefly.webp` | 64×64 | J7 | A single tiny soft glowing firefly dot, pale yellow-green core with a faint halo, no insect body detail, centred |
| ink_blood_drop | `assets/fx/ink-blood-drop.webp` | 128×128 | J9 | One small splattered drop of dark blood-red ink with a couple of tiny satellite specks, flat printed look, no gore |
| page_burn_edge | `assets/fx/page-burn-edge.webp` | 512×256 | J8 | A horizontal ragged burning edge of old paper: charred black wavy line with a thin glowing ember-orange rim along the top, transparent above and below, tileable left-to-right |
| card_ready_glow | `assets/ui/card-ready-glow.webp` | 384×512 | J3 (ถ้าไม่ใช้ `candle-selection.webp`) | A soft warm candle-light glow outline shaped like a rounded portrait card frame, hollow transparent centre, faded gold, glow strongest at the edges and fading outward |

ภาพทั้งหมดเป็น effect ไม่ใช่ภาพการ์ด จึงไม่ต้องต่อสายใน `app/cardArt.ts` · ให้ require ตรงจาก component ที่ใช้ หรือรวมไว้ใน `app/components/battle/fxArt.ts` ไฟล์เดียว
ระหว่างภาพยังไม่เสร็จ โค้ดต้องยังทำงานได้ (fallback เป็น View วงกลมสีจาก theme)

---

## ทดสอบที่ต้องเพิ่ม (vitest)
- `useCombatTimeline` ใช้ `speed` จาก setting จริง (DURATION / speed)
- `HealthBar` ส่ง `accessibilityValue.now` เป็นค่าจริงทันทีแม้แถบยังวิ่งอยู่
- `AdventureChoices` ตอน reducedMotion เรียก `onEnter` ทันที (ไม่รอ 600ms)
- J1/J9: hpLoss 0 ไม่เรียก hit flash (เทสต์ระดับ helper ที่ตัดสินว่าจะเล่นอะไร ถ้าแยกออกมาได้)

## สิ่งที่ห้ามทำ
- ห้ามเปลี่ยนตัวเลขเกม การ์ด ผี หรือลำดับ event ใน `src/core/**`
- ห้ามล็อกปุ่มเพื่อรออนิเมชั่น (ยกเว้น J8 ที่รอ ≤600ms ก่อน callback)
- ห้ามรื้อ `SceneArrival`, `EnemyHandCard`, `PageFade`, `DamagePopup`, `StatGainPopup` — แค่ต่อเพิ่ม
- ห้าม merge เข้า `main`
