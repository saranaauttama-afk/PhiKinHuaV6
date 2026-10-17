# Battle juice — ส่งต่องาน

วันที่: 16 ตุลาคม 2026

ฐานงาน: `work/deck-progression-v1` ที่ `f6826cb` (fetch และ fast-forward ก่อนแตก branch)

Branch ส่งมอบ: `work/battle-juice` → PR เข้า `work/deck-progression-v1` เท่านั้น ไม่ merge และไม่แตะ `main`

## ขอบเขตและสิ่งที่รักษาไว้

ทำ J1 → J10 ตามลำดับ ข้อละหนึ่ง commit ตามรายการด้านล่าง แล้วแยก commit ภาพและ commit เอกสาร/เทสต์เพิ่มเติม ไม่มีการแก้ไฟล์ใน `src/core/**`, ตัวเลขบาลานซ์, RNG หรือลำดับ combat event และไม่มี dependency ใหม่

`die()` / `defeat()` เก็บ choreography เดิมไว้ใน `GhostFigure` ซึ่งเป็นตัววาดผีแต่ละตัวภายใน `MonsterArea` การแยก shared values ต่อรูปทำให้ผีที่ยังอยู่ไม่จมหายตามตัวที่ตาย ไม่ได้เปลี่ยนกฎการตายหรือการฟื้น ส่วน `SceneArrival`, `PageFade`, round glow, `DeltaPopup`, popup ดาเมจ/ค่าสถานะ และท่า lunge ของลูกสมุนยังใช้ของเดิม

เอฟเฟกต์ใหม่อ่าน `useGameSettings(s => s.reducedMotion)` ทั้งหมด ส่วนลูกสมุนใช้ค่าจาก Reanimated ประกอบด้วย เมื่อเปิดลดการเคลื่อนไหว: ไม่มีสั่น/particle/การเลื่อนระยะไกล ข้อมูลและปุ่มยังใช้ได้ เอฟเฟกต์ตกแต่งไม่รับ touch และใช้ token `layer` เมื่อต้องกำหนดลำดับซ้อน

อนิเมชั่นไม่ dispatch หรือรอเปลี่ยน phase เกม ข้อยกเว้นเดียวคือ J8 ที่หน่วง callback ซึ่งยังไม่ถูก dispatch เป็นเวลา 600 ms ปุ่มรับรางวัลไม่รออนิเมชั่น

## งานและเหตุผล

| ข้อ / commit | ไฟล์หลัก | สิ่งที่ทำ เหตุผล และเวลา (ms เว้นแต่ระบุอย่างอื่น) |
|---|---|---|
| J1 `f2c37c2` | `app/components/GhostArt.tsx`, `app/components/battle/MonsterArea.tsx`, `MinionRow.tsx`, `hitFeedback.ts`, `app/battle.tsx`, `app/theme.ts` | เพิ่ม tint silhouette แดงที่ลอย/สั่นไปพร้อมรูปเดิม ขึ้นถึง opacity .85 ใน 40 แล้วจาง 180 ลูกสมุนเล่นเมื่อ HP ลด ใช้ token `combatUiColors.hitFlash` และ helper แยก HP loss จริงจากการโดนเกราะ ลด motion แล้วไม่สั่นหรือแฟลช |
| J2 `898cf4b` | `app/components/HealthBar.tsx`, `app/theme.ts` | แถบแดง 150; chip สีขี้เถ้ารอ 350 แล้วตาม 400 เพื่ออ่านปริมาณ HP ที่เพิ่งเสีย ตอนฮีลทั้งสองแถบขึ้น 150 ตัวเลขและ `accessibilityValue.now` เป็นค่าจริงทันที วัดความกว้างด้วย onLayout ใช้ร่วมทั้งสอง HUD |
| J3 `076b2ab` | `app/components/Card.tsx`, `app/components/battle/PlayerHand.tsx` | ส่ง `ready={enabled}` จากมือผู้เล่น เรืองเฉพาะใบที่ลงได้ opacity .35↔.7 ช่วงละ 800 (รอบ 1.6 วินาที) ลด motion เป็น .5 นิ่ง ใบ selected ใช้ CandleSelection เดิม ใบที่มี round glow แสดง round glow อย่างเดียว หลัง commit ภาพเปลี่ยน ready sprite จาก candle-selection เป็น card-ready-glow |
| J4 `bc76669` | `app/components/battle/MonsterArea.tsx`, `MinionRow.tsx`, `AshPuff.tsx`, `fxArt.tsx` | ต่อ flash 40+180 และควัน 3 ก้อน + ขี้เถ้า 8 จุด ยาว 1000 หลังเริ่ม die เดิมยังสั่น 300 แล้วจม 70px/จาง 650 (จบที่ 950) `DURATION.Died` ยัง 1100; defeat เดิมสั่น 200 แล้วทรุด 14px/หรี่ .6 อีก 500 โดยไม่มีควัน ตายซ้ำไม่สร้าง burst ซ้ำ ส่ง die เฉพาะ actor HP≤0 และรักษา guard ฟื้นตอนจบ batch ใน battle ลูกสมุนผีใช้ fade 450 + ควัน 1 ก้อน/500 |
| J5 `6163302` | `app/components/battle/VictoryOverlay.tsx` | ป้ายลงจาก -90px ใน 420 ด้วย back(1.6); ตราหัวเรื่องเอียง -3°/+2°/0 รวม 150 หลังป้ายลง EXP 700 จากค่าเดิมที่อนุมานได้; ถ้าข้ามเลเวลเริ่ม 0 จึงไม่วิ่งถอยหลัง เบี้ยนับ ~600 (อัปเดตทุก 32) รัศมีหมุนหนึ่งรอบ 120 วินาที ควัน 2 ก้อน/1000 ปุ่มรับรางวัลกดได้ทันทีและยุติเอฟเฟกต์ที่เหลือ |
| J6 `6f7f1e8` | `app/components/battle/TurnBanner.tsx`, `app/battle.tsx` | ป้ายตาเรา/ตาผีที่ hudTop−70 เลื่อน 24px/180 ค้าง 700 แล้วจาง 160 รวม 1040 ตาผีใช้แดงคล้ำ ลด motion ไม่มีเลื่อน ค้าง 700/จาง 160 ป้าย roundBanner มีสิทธิ์แสดงก่อนเสมอ |
| J7 `8e6e73a` | `app/components/battle/BattleAtmosphere.tsx`, `BattleBackdrop.tsx` | หมอกหน้า 40 วินาที/.28 และหลัง 70 วินาที/.18 ต่อรอบ วางระหว่างภาพเดิมกับ gradient ลำดับ tile original/mirror/original ทำให้รอยต่อขอบและจุดวนตรงกัน หิ่งห้อย 8 จุดใช้ตำแหน่งคงที่ วน 6.5–11.61 วินาทีด้วย transform/opacity บน UI thread ไม่ใช้ RNG เกม ลด motion เหลือหมอกนิ่ง |
| J8 `7638b4b` | `app/components/AdventureChoices.tsx`, `app/components/battle/PageBurn.tsx`, `pageChoice.ts` | Clip กระดาษขึ้นด้านบนพร้อมขอบไหม้และขี้เถ้า 8 จุด/600 ก่อน onEnter หรือ onDestroy ใบอื่น opacity .65 ไม่มีการเปลี่ยน testID หรือ PageFade เดิม ป้องกัน callback ซ้ำ ยกเลิกเมื่อ unmount/slot เปลี่ยน เปิดลด motion ระหว่างไหม้แล้วเรียกทันทีหนึ่งครั้ง |
| J9 `cf009e7` | `app/battle.tsx`, `app/components/QuietPlayerHud.tsx`, `app/components/battle/PlayerHUD.tsx`, `BloodBurst.tsx`, `ScreenFlash.tsx`, `hitFeedback.ts` | HUD สั่น +6/−6/+3/0 รวม 200 พร้อมหมึกแดง 5 จุด/450 เฉพาะ Damage ที่ HP ลดจริง HeavyHit ที่ตามด้วยแผลฝั่งผู้เล่น หรือ HP loss≥25% maxHP ทำให้ทั้งฉากสั่น +4/−4/0 รวม 170 เกราะกันหมดไม่มีแผล ไม่มีสั่น ไม่มีแฟลช ลบการผูก onAttackPeak กับแฟลช และให้จุดเรียกหลักอยู่หลัง guard Damage ลด motion แล้วแฟลช/หมึก/สั่นไม่เล่น |
| J10 `2556c64` | `src/ui/gameSettings.ts`, `app/components/Settings.tsx`, `app/battle.tsx`, `app/components/battle/useCombatTimeline.ts`, `EnemyHandCard.tsx` | บันทึก enemySpeed 1/1.5/2 (เริ่ม 1) คู่กับ reducedMotion ใน storage เดิม มีปุ่มในตั้งค่า ส่ง speed เข้า timeline และใช้ speed ชุดเดียวกันกับทุก phase/timer ของการ์ด ไม่แก้ค่าคงที่ PHASE_* ตรึง speed ตลอด batch ปัจจุบัน ถ้าเปลี่ยนกลาง batch ใช้ค่าที่เลือกใน batch ถัดไป เพื่อไม่ให้การ์ดกับ timeline เหลื่อมกัน ท่าตาย/ควันใน timeline หารด้วย speed เดียวกัน (การตายนอก timeline ยังใช้จังหวะเดิม) |

J4/J5/J8/J9 ใช้ตัวแบ่ง budget ใน `fxArt.tsx`: burst รวมไม่เกิน 12 particle; หิ่งห้อยฉากหลังหยุดแสดงชั่วคราวระหว่าง burst แล้วกลับมาเมื่อจบ หมอกและรัศมีเป็นแผ่นตกแต่ง ไม่มีการสร้างอนุภาคเพิ่มต่อเฟรม

J10 ส่วน `expo-haptics` **ไม่ได้ทำ** ตามขอบเขตตัวเลือก จึงไม่มี setting haptics หรือการติดตั้งแพ็กเกจดังกล่าว

## ภาพที่สร้างและผูกโค้ด

สร้างครบ 8 ภาพด้วย **built-in image_gen** แยกคำขอต่อภาพ ใส่ข้อความสไตล์หัวตารางของ TASK ทุก prompt ขอ transparent background และรักษา alpha ของต้นฉบับ ไม่ใช้พื้นขาวแทน alpha

| id | path | ขนาด RGBA WebP |
|---|---|---|
| incense_smoke | `assets/fx/incense-smoke.webp` | 384×384 |
| ash_fleck | `assets/fx/ash-fleck.webp` | 128×128 |
| victory_rays | `assets/fx/victory-rays.webp` | 768×768 |
| battle_mist | `assets/fx/battle-mist.webp` | 1024×256 |
| firefly | `assets/fx/firefly.webp` | 64×64 |
| ink_blood_drop | `assets/fx/ink-blood-drop.webp` | 128×128 |
| page_burn_edge | `assets/fx/page-burn-edge.webp` | 512×256 |
| card_ready_glow | `assets/ui/card-ready-glow.webp` | 384×512 |

บันทึก prompt เต็ม, sourceSize จริง, normalizedSize, ขนาดปลายทาง, alpha extrema และ SHA-256 ของไฟล์ WebP สุดท้ายไว้ใน `docs/battle-juice/generated-art.json` เครื่องมือส่งต้นฉบับสี่เหลี่ยมมา 1254×1254 และ panorama 2172×724 จึง normalize ตามขนาดที่ขอ ก่อนย่อและบันทึก lossless WebP สำหรับหมอกตัดแถบล่างเป็น 4:1; glow ครอปกึ่งกลางให้สัดส่วนกรอบตรงกับการ์ด รายละเอียด crop อยู่ใน manifest

ตรวจด้วย Pillow ว่าทั้ง 8 ไฟล์เปิดเป็น RGBA มี alpha ต่ำสุด 0 / สูงสุด 255 และมีเนื้อภาพจริง ตรวจภาพต้นฉบับด้วยตาแล้ว ภาพประกอบส่วนใหญ่ใช้ `FxSprite` / `FX_ART` ใน `fxArt.tsx` และมี View fallback จาก token theme ระหว่างช่วงที่ภาพยังไม่เสร็จ Card require ready glow โดยตรงเมื่อเพิ่มไฟล์แล้ว ไม่เปลี่ยน `app/cardArt.ts`

## การตรวจสอบ

- `npx tsc --noEmit`: ผ่าน
- `npx vitest run`: **54 ไฟล์ / 731 เทสต์ ผ่านทั้งหมด** (เพิ่ม 26 เทสต์ใน 2 ไฟล์)
- `test/battle-juice.test.ts`: ทดสอบ production hook/handler ด้วย host-free renderer และ fake timers: setting 1/1.5/2 → ระยะ DURATION/speed จริง, batch speed/skip, storage hydrate, accessibility HP ขณะที่ chip ยังรอ, reduced-motion Enter/Destroy ทันที, หน่วง 600 ปกติ, callback ซ้ำ/ยกเลิก/เปลี่ยนเพจ/เปลี่ยน reducedMotion, และ hpLoss 0 ทั้งสองฝั่งไม่เกิด wound feedback
- `test/battle-juice-art.test.ts`: 8 id ครบไม่ซ้ำ, SHA-256 ตรง, อ่าน header WebP VP8L ตรวจขนาดและ alpha-used bit ของไฟล์จริง
- `npx expo export --platform web`: ผ่าน
- `npx expo export --platform android`: ผ่าน (Hermes bundle และ asset resolution; ไม่ได้ติดตั้งรันบนมือถือ)
- `git diff --check`: ผ่าน; diff จากฐานไม่มีไฟล์ใน `src/core/**` และไม่เปลี่ยน package.json/package-lock.json

## ยังไม่ได้ทดสอบบนเครื่องจริง

ทุกข้อ J1–J10 ยังไม่มีการทดสอบบนมือถือจริงในงานนี้ การผ่าน unit tests / export ยืนยัน logic ฝั่ง view และการ bundle แต่ไม่ยืนยันภาพที่เห็นหรือ frame rate บนอุปกรณ์

| ข้อ | สิ่งที่ต้องลองบนมือถือ |
|---|---|
| J1/J2/J9 | ตีเข้า HP เทียบกับเกราะกันหมดทั้งสองฝั่ง; หลาย hit ต่อเนื่อง; chip ขณะฮีลแทรก; หมึกออกจากตำแหน่งรูปจริง; heavy shake; screen reader อ่านค่าจริง |
| J3 | การ์ดที่ลงได้/ลงไม่ได้เมื่อแต้มเปลี่ยน; selected และ round glow ไม่ซ้อน; ความสว่างพอดีกับหนังการ์ด |
| J4 | ตายตัวเดียวในหลาย actor; revive ใน batch ไม่เกิดควัน; ผีที่ยังคุยต่อไม่มีควัน; ลูกสมุนตัวสุดท้าย; จังหวะตายที่ 1×/1.5×/2× ก่อนหน้าชนะ |
| J5 | EXP ข้ามเลเวล; กดรับรางวัลทันทีและกดระหว่างนับ; ควันกับรัศมีบนจอจริง |
| J6 | ป้ายตาผีระหว่างเล่นหลายใบ; ทับกับพักยกแล้วพักยกชนะ; ไม่บังการ์ด |
| J7 | รอยต่อหมอกบน GPU จริง; วนต่อเนื่อง; burst พร้อมลูกสมุนหลายตัว; frame rate/แบตเตอรี่เครื่องระดับกลาง |
| J8 | Enter/Destroy ระหว่างหมุนจอ/เปลี่ยนเพจ/ออกหน้าจอ; ลด motion แล้ว callback ทันที; ขอบไหม้ตรงขอบ mask |
| J10 | ความอ่านง่ายที่ 1.5×/2×; เปลี่ยนค่ากลางตาผีแล้ว batch ถัดไปใช้ค่าใหม่; ปิดเปิดแอปแล้วค่าคงอยู่ |

ให้ลอง reducedMotion ทั้งเปิดก่อนเข้าไฟต์และเปิดกลางเอฟเฟกต์ รวมถึงจอ portrait ขนาดเล็ก (320×568, 360×640) และจอ 390×844 ก่อนรับงานภาพขั้นสุดท้าย ไม่มีการอ้างว่าทดสอบ hardware haptics เพราะไม่ได้เพิ่มส่วนนี้

## แก้หลัง merge (Claude, 16 ต.ค. 2026)
- **J8 ทำแอป Android ปิดตัว** ทันทีที่กดเลือกเพจบนแผนที่ (เทสต์ emulator 1.0.64 เห็นหน้า home ของเครื่องแทน "จบเทิร์น")
  หาด้วยการรันเทสต์ Android แยกทีละ commit: J1–J7 ผ่าน, เริ่มพังที่ `7638b4b` (J8) · web ผ่านตลอด
- crash log จริง (ดึงผ่าน annotation ของ CI): `IllegalStateException: addViewAt: failed to insert view [..] into parent [..] at index 1` (Fabric `SurfaceMountingManager`)
- สาเหตุ: ตอนเริ่มไหม้ `PageBurn` แทรกขอบไหม้/ขี้เถ้าเป็นลูกใหม่เข้าไปใน container ที่ Fabric "flatten" ทิ้งไปแล้ว (และรอบแก้แรกยังสลับชนิดวิว View↔Animated.View อีก) — เป็นบั๊กที่รู้กันของ React Native New Architecture บน Android ไม่เกิดบน web
- แก้: `PageBurn` โครงไม่เปลี่ยนรูปเลย (container ทุกชั้น `collapsable={false}`, ตัวตัดกระดาษเป็น Animated.View ตัวเดิมตลอด, ชั้นเอฟเฟกต์มีอยู่เสมอ) + ใส่ `collapsable={false}` ให้ container ของเอฟเฟกต์ที่โผล่/หายระหว่างเล่น: `AshPuff`, `BloodBurst`, ผีใน `MonsterArea` (ควันตอนตาย), `DepartingFigure`, รัศมีหน้าชนะ, HUD ที่สั่น
- บทเรียน (ส่งต่อ AI ตัวอื่น): **ทุก View ที่จะมีลูกโผล่/หายตามเงื่อนไขระหว่างเล่น ให้ใส่ `collapsable={false}`** และอย่าสลับชนิดวิวของ wrapper; เทสต์ web ไม่เจอบั๊กนี้ ต้องดู native smoke

## เพลย์เทสต์เจ้าของ 17 ต.ค. 2026 (1.0.64) → แก้ใน 1.0.65
- **ป้าย "ตาผี" ไม่เข้า (ทับเท้าผี) → เอาออก** เหลือป้าย "ตาเรา" (`TurnBanner` แสดงเฉพาะ `phase==='player'`)
- **ตัวเลขทุกตัวเด้งจากค่าของมันเอง** (เดิม +เกราะ/+มานาเด้งกลางจอ ตัวเลขเลือดเราเด้งลอยเหนือ HUD):
  เกราะได้/เสีย → ไอคอนเกราะของฝั่งนั้น (เราและผี), มานา/น้ำมนต์ได้ → ไอคอนมานา (`DeltaPopup`), เลือดเราหาย → บนหลอดเลือดเรา (`QuietPlayerHud hpPopup`), เลือดผีหาย → บนตัวผี (เดิม) · เลิกใช้ `StatGainPopup` ในฉากสู้
- **เพจผีถูกเผาตั้งแต่กดเลือก → เพจไหม้ตอน "ใช้หมด" เท่านั้น:** กดเข้าไม่ไหม้ (เข้าทันที); กากบาท ✕ ทำลาย = ไหม้ 600 ms (เดิม);
  เพจที่ใช้หมดแล้ว (ชนะผี, รับสมบัติ, ฯลฯ) ไหม้ตอนกลับมาที่แผนที่ — engine เติมเพจใหม่ทันทีที่ช่องว่าง จึงจำกระดานที่ผู้เล่นเห็นล่าสุด (`lastBoard`) แล้วเผาเพจเก่าที่อยู่ใน `resolvedIds` ครั้งเดียว ก่อนเพจใหม่ค่อยโผล่ · ร้านที่ "ใช้แล้ว · กลับเข้าได้" ไม่ไหม้
- **ควันขึ้น 2 รอบ (ตอนผีตาย + หน้าชนะ) → เอาควันในหน้าชนะออก**
- มินเนียนเราอยู่แถวเหนือ HUD เราแล้วตั้งแต่ 1.0.63 (ตรวจโค้ดแล้ว ไม่ได้ย้ายกลับ)
