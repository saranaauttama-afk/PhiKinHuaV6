# ภาพลูกสมุนผีคืน 1 — prompt ให้ GPT

ที่มา: `docs/ghosts/NIGHT1-DESIGN.md` (ตกลง 15 ต.ค. 2026) · แบบเดียวกับ `docs/nak-muay/ART-PROMPTS.md`

## วิธีใช้
1. ให้ GPT สร้างภาพจาก prompt ทีละตัว พื้นหลังโปร่งใส 1024×1024
2. ย่อเป็น 384×384 แล้วเซฟเป็น `.webp` ตาม path
3. เพิ่มบรรทัดใน `app/components/battle/StatusArt.tsx` (`STATUS_ART`) ด้วย id ของลูกสมุน เช่น
   `pong_monkey:require('../../../assets/minions/pong_monkey.webp'),`
   ระหว่างยังไม่มีภาพ ลูกสมุนผีแสดงเงาผี (`assets/ui/trail-ghost.png`) แทน — เล่นได้ปกติ

ลูกสมุนผียืน**ทางขวาของผี หันหน้าไปทางซ้าย** (เข้าหาเรา) ตรงข้ามกับศิษย์ค่ายของเราที่ยืนทางซ้ายหันขวา
ขนาดบนจอราว 60 px — รูปร่างต้องอ่านออกที่ขนาดนี้

## สไตล์ (ใส่ทุกตัว)

Thai one-baht horror pulp comic illustration, matching the existing ผีกินหัว card set and the camp-fighter minion figures: rough confident black ink outlines with coarse cross-hatching, muted vintage print colours (ochre, olive, brick red, faded indigo, sickly grey-green), one full-body figure, dynamic readable silhouette that still reads at 60 px, facing LEFT, standing on nothing (no ground shadow block), transparent background (real alpha), square 1:1 canvas, subject fills about 85%, small clean margin. Night-of-ghosts mood without gore close-ups. No text, letters, numbers, logos, frame, border, parchment, gradient background, 3D render or glow effects. Not Chinese/Japanese ghost styling, not Western zombie styling.

## ลูกสมุน (4 ภาพ · 5 ตัว)

### ลิงโป่ง · `pong_monkey`
`assets/minions/pong_monkey.webp` · เรียกโดย ผีป่าโป่งร้าง (กฎเปิดไฟต์ + การ์ด เรียกลิงโป่ง) · เลือด 8 · รับหมัดแทนผี

A gaunt ghost monkey of an abandoned salt-lick clearing (ดินโป่ง) in the Thai forest: patchy grey fur caked with cracked pale mud, hollow glowing-less dark eyes, long thin arms raised to shield its master, hunched protective crouch, a few crumbs of salty earth falling from its body, full body, facing left

### เงาป่า · `forest_shade`
`assets/minions/forest_shade.webp` · เรียกโดย ผีป่า (การ์ด เรียกเงาป่า) · เลือด 8 · รับหมัดแทนผี

A tall faceless shadow spirit of the deep Thai jungle made of tangled dark vines, leaves and smoke-like ink strokes, roughly human shaped, arms spread wide like branches to block blows, two pale hollow eye-holes, feet dissolving into roots, full body, facing left

### เถ้ากระดูก · `ash_bones` (ใช้ภาพเดียวกันกับ `ash_crawler`)
`assets/minions/ash_bones.webp` · เรียกโดย ผีตายโหงชายทุ่ง (การ์ด เถ้ากระดูกลุก / เถ้ากระดูกคลาน) · เลือด 5 · ตีหรือแปะพิษท้ายเทิร์นผี

A small crouching skeleton figure rising out of a heap of grey cremation ash and broken funeral-urn shards from a rice-field cremation ground, bones stained ochre, ash drifting off it like smoke, one bony hand reaching forward to claw, full body, facing left

หลังได้ภาพ ใส่ทั้งสอง id ใน `STATUS_ART`:
`ash_bones:require('../../../assets/minions/ash_bones.webp'),`
`ash_crawler:require('../../../assets/minions/ash_bones.webp'),`

### หัวในกระด้ง · `basket_head`
`assets/minions/basket_head.webp` · เรียกโดย บอสกระหังหนองร้าง (กฎเปิดไฟต์ + การ์ด เรียกหัวในกระด้ง) · เลือด 10 · รับหมัดแทนบอส

A woven bamboo winnowing tray (กระด้ง) floating upright like a shield, with a pale severed human head resting in it, long wet black hair hanging over the rim, eyes half open, swamp water dripping, the tray tilted to block blows aimed at its master, no gore close-up, facing left

## ไอคอนใหม่ (1 ชิ้น)

ตอนนี้ป้าย "ชาร์จ" บนแถบสถานะผียืมไอคอนนับลูกประคำ (`spell_charging`) ส่วน "ผีรอสวน" ใช้ไอคอนสวนของเรา (`status_riposte`) ซึ่งตั้งใจให้เหมือนกัน — กลไกเดียวกันทั้งสองฝั่ง

สไตล์ไอคอน: Small status icon for a mobile card game, same ink-and-muted-colour Thai pulp comic style as the cards, single bold object, very simple silhouette that reads at 24–32 px, thick outline, transparent background, square 1:1, no text or numbers.

### สถานะ: ชาร์จ (ผีเก็บแรง) · `status_charge`
`assets/status/status_charge.webp`

A pale clawed ghost hand clenched into a fist, with three short curved ink strokes coiling around it like gathering wind, tension before a strike

ใส่ภาพแล้ว: เพิ่ม `charge:require('../../../assets/status/status_charge.webp'),` ใน `STATUS_ART` แล้วเปลี่ยน `symbol:'spell_charging'` เป็น `symbol:'charge'` ใน `ghostMechanicBadges` (`src/core/combat/fightBadges.ts`)

## ลูกสมุนคืน 2–3 (7 ภาพ) — 15 ต.ค. 2026

ที่มา: `docs/ghosts/NIGHT23-DESIGN.md` · สไตล์เดียวกับข้างบน (ยืนขวาของผี หันซ้าย อ่านออกที่ 60 px) · ใส่ภาพแล้วเพิ่ม id ใน `STATUS_ART`

### ลูกแดง · `luk_daeng`
`assets/minions/luk_daeng.webp` · แม่นาค · เลือด 6 · ฟื้นแม่นาค 3
A pale ghost infant wrapped in a faded red cloth, floating at waist height, tiny reaching hands, big dark eyes, a faint river-water drip from the cloth; eerie but not gory, full body, facing left

### พรายน้ำ · `phrai_nam`
`assets/minions/phrai_nam.webp` · ผีพราย / พรายแอ่งถ้ำ · เลือด 6 · เราติดพิษ 1
A small drowned water spirit rising out of a dark puddle, long wet hair covering most of the face, greenish pale skin, dripping waterweed, one arm stretched forward, full body, facing left

### เสือสมิง · `suea_saming`
`assets/minions/suea_saming.webp` · ผีป่าดงลึก · เลือด 10 · ตะปบ 4
A gaunt were-tiger of Thai forest folklore: half-tiger half-human figure crouched on all fours, striped hide hanging loosely like a cloak, human eyes in a tiger face, claws out, full body, facing left

### เถาวัลย์ · `thaowan`
`assets/minions/thaowan.webp` · ผีป่าดงลึก · เลือด 8 · ให้ผีเกราะ 4
A writhing knot of jungle vines and creepers shaped like a coiled serpent rearing up to shield someone, a few pale leaves, thorny tips, full body, facing left

### เปรตบริวาร · `pret_borivan`
`assets/minions/pret_borivan.webp` · เปรตวัดร้าง (บอสคืน 2) · เลือด 8 · ตี 3
A small skinny preta servant with an absurdly long thin neck and a tiny needle mouth, holding a cracked alms bowl, ribs showing, temple-ground dust around its feet, full body, facing left

### รากไทร · `rak_sai`
`assets/minions/rak_sai.webp` · ผีป่าไทรพันราก (บอสคืน 3) · เลือด 12 · ให้ผีเกราะ 5
A thick twisted banyan root rising from the ground like an arm, wrapped with faded colourful shrine cloths (ผ้าสามสี), bark textured with a hint of a face, full body, facing left

### หัวลอย · `hua_loi`
`assets/minions/hua_loi.webp` · ผีกินหัว (บอสลับ) · เลือด 10 · คาบการ์ดเราไป 1 ใบ
A severed floating head with long tangled hair and a wide toothy grin, holding a playing card in its teeth, a few loose strands trailing like a tail, no gore close-up, facing left
