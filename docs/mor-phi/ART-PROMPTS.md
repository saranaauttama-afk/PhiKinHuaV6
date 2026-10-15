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

## การ์ดใหม่ (0 ใบ)

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
