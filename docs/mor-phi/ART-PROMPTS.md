# ภาพการ์ดหมอผี (น้ำมนต์) — prompt ให้ GPT

ที่มา: `docs/mor-phi/DESIGN.md` (15 ต.ค. 2026) · ไฟล์นี้สร้างจาก `scripts/mor-phi-art.py` (แก้ที่สคริปต์แล้วรันใหม่)

## วิธีใช้
1. ให้ GPT สร้างภาพจาก prompt ทีละใบ พื้นหลังโปร่งใส 1024×1024
2. ย่อเป็น 384×384 เซฟเป็น `.webp` ตาม path
3. การ์ด: เพิ่มบรรทัดใน `app/cardArt.ts` (ทั้งสองแผนที่) แล้วรัน `python3 scripts/mor-phi-art.py` ใหม่ เทสต์จะเริ่มบังคับให้มีภาพ
4. ของเลี้ยง/ไอคอน: เพิ่ม id ใน `STATUS_ART` (`app/components/battle/StatusArt.tsx`)
ระหว่างยังไม่มีภาพ การ์ดแสดงสัญลักษณ์แทน เล่นได้ปกติ

การ์ดหมอผีเดิม 20 ใบมีภาพแล้ว (ใช้ id เดิม) ไม่ต้องทำใหม่

## สไตล์ (ใส่ทุกใบ)

Thai one-baht horror pulp comic card illustration, matching the existing ผีกินหัว card set: rough confident black ink outlines with coarse cross-hatching, muted vintage print colours (ochre, olive, brick red, faded indigo, warm skin tones, dull bronze), one clear subject or a tight two-figure action, dynamic readable silhouette that still reads at 80 px, transparent background (real alpha), square 1:1 canvas, subject fills about 85%, small clean margin. Shaman look: lean rural Thai village shaman (หมอผี), middle-aged, faded indigo or white collarless shirt, pha khao ma sash, sak yant tattoo lines on the forearms, white sacred cotton thread (สายสิญจน์) around the wrist, often holding a dull bronze holy-water bowl (ขันน้ำมนต์) and a sprig of leaves. Night-of-ghosts mood without gore close-ups. No text, letters, numbers, logos, card frame, border, parchment, gradient background, 3D render or glow effects. Not Chinese/Japanese exorcist styling, not Western witch styling.

## การ์ดใหม่ (33 ใบ)

### แปะยันต์กระดาษ · `paper_yant`
`assets/cards/thai-v24/paper_yant.webp`

Subject: The shaman slapping two small square paper yant talismans covered in ink script onto a shadowy ghost's shoulder, paper fluttering

### ตอกตะปูโลงผี · `nail_coffin`
`assets/cards/thai-v24/nail_coffin.webp`

Subject: A hand hammering a long old iron nail into a cracked wooden coffin lid marked with a yant square, a ghostly hand recoiling from inside

### เสกข้าวสารซัด · `rice_throw`
`assets/cards/thai-v24/rice_throw.webp`

Subject: The shaman flinging a fistful of blessed raw rice grains in a wide arc, the grains spraying outward like buckshot

### ดอกบัวจุ่มน้ำมนต์ · `lotus_dip`
`assets/cards/thai-v24/lotus_dip.webp`

Subject: A closed pink lotus bud dipped in a bronze bowl and swung like a whip, droplets flying off the petals

### ทวงหนี้ผี · `ghost_debt`
`assets/cards/thai-v24/ghost_debt.webp`

Subject: The wounded shaman, bandaged arm, pointing an accusing finger and striking a ghost with a rolled-up palm-leaf manuscript

### กรีดเลือดเซ่น · `blood_offering`
`assets/cards/thai-v24/blood_offering.webp`

Subject: A small ritual knife over a clay offering cup, a single drop of blood falling into it, incense smoke curling; no wound close-up

### สาดน้ำมนต์ · `holy_water_splash`
`assets/cards/thai-v24/holy_water_splash.webp`

Subject: The shaman swinging a whole bronze bowl forward, a big arc of holy water splashing out toward the viewer

### ประพรมน้ำมนต์ · `sprinkle`
`assets/cards/thai-v24/sprinkle.webp`

Subject: A sprig of mayom leaves flicking light drops of holy water in a gentle circle around the shaman

### น้ำมนต์เดือด · `boil_water`
`assets/cards/thai-v24/boil_water.webp`

Subject: A clay pot of holy water boiling over a small fire, steam and bubbling water spilling out in a scalding wave

### ม่านน้ำมนต์ · `water_curtain`
`assets/cards/thai-v24/water_curtain.webp`

Subject: A sheet of thrown holy water hanging in the air like a curtain between the shaman and a clawed ghost hand

### พ่นน้ำมนต์ใส่หน้า · `mouth_spray`
`assets/cards/thai-v24/mouth_spray.webp`

Subject: The shaman with puffed cheeks spraying a mist of holy water from his mouth straight at a ghost's face

### อาบน้ำมนต์ล้างอาถรรพ์ · `cleansing_bath`
`assets/cards/thai-v24/cleansing_bath.webp`

Subject: Holy water poured from a bronze bowl over a kneeling villager's head, dark smudges of curse washing away

### ปลุกยันต์ลุกไฟ · `yant_burst`
`assets/cards/thai-v24/yant_burst.webp`

Subject: Several paper yant talismans stuck on a ghost's body all bursting into flame at once

### ยันต์คุ้มกาย · `yant_ward`
`assets/cards/thai-v24/yant_ward.webp`

Subject: Yant talismans peeling off a ghost and flying back to wrap around the shaman's forearm like a bracer

### สายสิญจน์มัดมือ · `sai_sin_bind`
`assets/cards/thai-v24/sai_sin_bind.webp`

Subject: White sacred cotton thread whipping around a ghost's raised wrists, binding them mid-swing

### หม้อดินกักผี · `seal_jar`
`assets/cards/thai-v24/seal_jar.webp`

Subject: A small black clay pot with its mouth covered by white cloth tied with sacred thread, a ghostly wisp being sucked inside

### เลี้ยงโหงพราย · `hong_phrai_call`
`assets/cards/thai-v24/hong_phrai_call.webp`

Subject: A tiny shrine with an oil lamp and a small pale female spirit figure rising from the smoke, eerie but not gory

### ตักน้ำใส่ขัน · `fill_bowl`
`assets/cards/thai-v24/fill_bowl.webp`

Subject: The shaman scooping water from an old temple well into a bronze bowl with a coconut-shell ladle

### ขันเต็มเปี่ยม · `full_bowl`
`assets/cards/thai-v24/full_bowl.webp`

Subject: A bronze holy-water bowl filled to the brim, the water surface trembling with power, a faint ripple ring

### ล้อมสายสิญจน์ · `sai_sin`
`assets/cards/thai-v24/sai_sin.webp`

Subject: A ring of white sacred thread on the ground around the seated shaman, a ghost's claw stopped at the line

### ดูฤกษ์ยาม · `read_omen`
`assets/cards/thai-v24/read_omen.webp`

Subject: The shaman reading an old folding palm-leaf almanac by candlelight, finger on a star chart

### ปลุกหุ่นพยนต์ · `hun_payon_call`
`assets/cards/thai-v24/hun_payon_call.webp`

Subject: A straw effigy figure bound with sacred thread rising to its feet, yant script on its chest

### เลี้ยงกุมารทอง · `golden_child_call`
`assets/cards/thai-v24/golden_child_call.webp`

Subject: A small gilded child-spirit statue on a shelf with a tiny glass of red soda and sweets offered before it

### ปลุกควายธนู · `khwai_thanu_call`
`assets/cards/thai-v24/khwai_thanu_call.webp`

Subject: A small bronze water-buffalo amulet charging forward, growing into a spirit buffalo with lowered horns

### บูชารักยม · `rak_yom_call`
`assets/cards/thai-v24/rak_yom_call.webp`

Subject: Two tiny twin child spirits floating out of a small glass vial of oil, holding hands

### ข้าวปลาเลี้ยงผี · `spirit_feast`
`assets/cards/thai-v24/spirit_feast.webp`

Subject: A banana-leaf tray of rice, boiled egg and fish set out as an offering, small spirit hands reaching in

### พิธีขอฝน · `rain_rite`
`assets/cards/thai-v24/rain_rite.webp`

Subject: The shaman with arms raised under a dark rain cloud, rain pouring straight into a bronze bowl at his feet

### วงปูนเสก · `chalk_circle`
`assets/cards/thai-v24/chalk_circle.webp`

Subject: A circle of white lime-chalk drawn on a dirt floor with yant script, a ghost's foot recoiling at the edge

### บาตรน้ำมนต์รับหมัด · `water_bowl_guard`
`assets/cards/thai-v24/water_bowl_guard.webp`

Subject: The shaman raising a bronze bowl like a shield to catch a ghost's claw, water sloshing up

### ขันน้ำมนต์สำริด · `bronze_bowl`
`assets/cards/thai-v24/bronze_bowl.webp`

Subject: A large old bronze holy-water bowl with engraved rim and a sprig of leaves resting in it, object only

### รางน้ำมนต์ · `overflow_trough`
`assets/cards/thai-v24/overflow_trough.webp`

Subject: A split-bamboo trough carrying overflowing holy water down toward a ghost, water splashing at the end

### ประคำกระดูก · `bone_rosary`
`assets/cards/thai-v24/bone_rosary.webp`

Subject: A rosary of small carved bone beads wrapped around a fist, the beads glowing faintly warm, object focus

### ผ้ายันต์แดงประจำตัว · `red_yant_cloth`
`assets/cards/thai-v24/red_yant_cloth.webp`

Subject: A square red cloth talisman covered in dense yant script and a central deity figure, folded at the corners

## ของเลี้ยง (5 ตัว) — ยืนข้างเรา หันขวา

Same style, one full-body figure standing on nothing (no ground block), facing RIGHT (it stands left of the player and faces the ghost), readable at 60 px.

### หุ่นพยนต์ฟาง · `hun_payon`
`assets/minions/hun_payon.webp`

Subject: A man-sized straw effigy bound with white sacred thread, yant script painted on its chest, arms raised to shield

### กุมารทอง · `golden_child`
`assets/minions/golden_child.webp`

Subject: A small gilded child spirit with a topknot, sitting cross-legged and floating, holding a tiny ladle of water; eerie but cute

### ควายธนู · `khwai_thanu`
`assets/minions/khwai_thanu.webp`

Subject: A spirit water buffalo made of dull bronze with ink-swirl markings, head lowered to charge

### รักยม · `rak_yom`
`assets/minions/rak_yom.webp`

Subject: Two tiny twin child spirits back to back, one fierce one smiling, wisps of oil smoke around them

### โหงพราย · `hong_phrai`
`assets/minions/hong_phrai.webp`

Subject: A pale female spirit in a faded sabai cloth with long loose hair, holding a small oil lamp, floating; eerie, not gory

## ไอคอน

Small status icon for a mobile card game, same ink-and-muted-colour Thai pulp comic style as the cards, single bold object, very simple silhouette that reads at 24–32 px, thick outline, transparent background, square 1:1, no text or numbers.

### สถานะ: ยันต์ · `status_yant`
`assets/status/status_yant.webp`

Subject: a small square paper talisman with three lines of ink script and a red seal mark

### ไอคอนน้ำมนต์ (HUD) · `ui_water_bowl`
`assets/ui/water_bowl.webp`

Subject: a bronze holy-water bowl seen from the side, water level visible, a sprig of leaves

ใส่ภาพยันต์แล้ว: เพิ่ม `yant:require('../../../assets/status/status_yant.webp'),` ใน `STATUS_ART`
