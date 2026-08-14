# คำสั่งสร้างรูป

สร้างจาก `src/art/catalog.ts` — อย่าแก้ไฟล์นี้ตรงๆ แก้ที่ catalog แล้วรัน `npm run art:prompts`

ตอนนี้มีรูปแล้ว **7/94** ช่อง

## ⚠️ ต้องเขียนคำบรรยายเอง

ตารางแปลไม่รู้จักคำในชื่อ/โจทย์ของช่องพวกนี้ คำสั่งข้างล่างจึงมีแต่ท่อนสไตล์
กับองค์ประกอบภาพ ไม่มีคำบรรยายว่าเป็นตัวอะไร — เติมเองก่อนใช้

แก้ถาวรได้โดยเพิ่มคำลงใน `GLOSSARY` ที่ `scripts/art-prompts.ts`

- **หน้าเริ่มเกม** `scene/start`
- **ฉากหนองน้ำ** `scene/swamp`
- **เทพอักษร** `monster/thep-aksorn`
- **พรบรรพบุรุษ** `blessing/ancestral_blessing`
- **พลังวิญญาณ** `blessing/spirit_energy`
- **ผีป้องกัน** `blessing/ghost_protection`
- **สมาธิสงบ** `blessing/meditation_peace`
- **ปัญญาสมุนไพร** `blessing/herbal_wisdom`
- **ผ้าศักดิ์สิทธิ์** `blessing/sacred_cloth`
- **ดูดพลังชีวิต** `blessing/life_steal_spirit`
- **พลังปาไผ่** `blessing/bamboo_dart_power`
- **โล่พิธีกรรม** `blessing/ritual_shield`
- **พลังการ์ดฟรี** `blessing/free_card_energy`
- **เครื่องรางหลวงปู่** `blessing/luang_pu_protection`
- **งานศพกลางดึก** `event/night_funeral`
- **ทางแยกในหมอก** `event/fork_in_mist`
- **คนแจวเรือจ้าง** `event/boatman`
- **บท: คืนที่ออกเดินทาง (nun)** `chapter/prologue_nun`
- **บท: ครึ่งทาง** `chapter/after_mid_boss`
- **บท: ปลายทาง** `chapter/before_final_boss`
- **บท: ยังไม่จบ** `chapter/secret_unlocked`
- **บท: เช้าที่กลับมา** `chapter/ending_win`
- **บท: สิ่งที่แลกไป** `chapter/ending_secret`
- **บท: คืนที่ไม่ได้กลับ** `chapter/ending_lose`
- **บ่อน้ำลึกลับ** `encounter/well`
- **หีบสมบัติ** `encounter/treasure`
- **สมบัติชิ้นเดียว** `encounter/treasure_single`
- **ทางไปต่อ** `encounter/next_event`
- **ไอคอนโหนดบอส** `node/boss`

## วิธีใช้

1. ก๊อปคำสั่งของช่องที่ต้องการไปวางในเครื่องมือสร้างภาพ
2. ได้รูปมาแล้ว บันทึกตามชื่อไฟล์ที่ระบุ ลงในโฟลเดอร์ `assets/`
3. เพิ่มหนึ่งบรรทัดใน `ART_SOURCES` ที่ `app/components/Art.tsx`
4. `npx vitest run test/art.test.ts` จะบอกเองถ้าลืมต่อสายหรือวางผิดที่

## คำสั่งกันภาพหลุดแนว (negative prompt)

ใส่ชุดนี้กับทุกภาพ:

```
european fairytale, gothic castle, anime, chibi, 3d render, photorealistic, glossy plastic, neon colors, text, watermark, logo, signature, frame border
```

## แกนสไตล์

ทุกคำสั่งข้างล่างมีท่อนนี้ต่อท้ายอยู่แล้ว — ถ้าสร้างภาพเพิ่มเองนอกลิสต์ ให้ใส่ด้วย

```
hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature
```

## ฉากพื้นหลัง (6)

### ✅ หน้าเริ่มเกม

`assets/scence/startPage.png` · 1080×1920px

```
full-bleed vertical background, subject small in frame, empty space in the middle third for UI. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 9:16
```

> โจทย์เดิม: ปกเกม — ตัวเอกยืนหันหลังมองทางเข้าป่า/หมู่บ้านยามค่ำ

### ✅ ฉากหนองน้ำ

`assets/scence/swamp.png` · 1080×1920px

```
full-bleed vertical background, subject small in frame, empty space in the middle third for UI. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 9:16
```

> โจทย์เดิม: หนองน้ำยามค่ำ หมอกลอย ใช้เป็นพื้นหลังหน้าแผนที่

### ✅ ฉากกระท่อมร้าง

`assets/scence/abandonedHut.png` · 1080×1920px

```
a stilted Thai wooden hut, full-bleed vertical background, subject small in frame, empty space in the middle third for UI. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 9:16
```

> โจทย์เดิม: กระท่อมไม้ร้างกลางทุ่ง ใช้เป็นพื้นหลังหน้าเหตุการณ์

### ✅ ฉากต่อสู้

`assets/scence/battleScence1.png` · 1080×1920px

```
an abandoned Thai temple hall with a tiered roof, full-bleed vertical background, subject small in frame, empty space in the middle third for UI. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 9:16
```

> โจทย์เดิม: ลานดินหน้าวัด/ดงไม้ ใช้เป็นพื้นหลังหน้าต่อสู้

### ⬜ ฉากจุดพัก

`assets/scence/rest.png` · 1080×1920px

```
a small open roadside pavilion, full-bleed vertical background, subject small in frame, empty space in the middle third for UI. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 9:16
```

> โจทย์เดิม: ศาลาริมทาง กองไฟ ใช้เป็นพื้นหลังโหนดพักบนเส้นทาง

### ⬜ ฉากศึกบอส

`assets/scence/boss.png` · 1080×1920px

```
an abandoned Thai temple hall with a tiered roof, full-bleed vertical background, subject small in frame, empty space in the middle third for UI. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 9:16
```

> โจทย์เดิม: โบสถ์ร้าง/ต้นไม้ใหญ่ตอนพระจันทร์เต็มดวง ใช้เฉพาะไฟต์บอส

## ตัวละครผู้เล่น (4)

### ⬜ หมอผี

`assets/classes/shaman.png` · 512×768px

```
a Thai village exorcist in dark cloth with sacred tattoos and a staff; a spirit exhaling green poison vapour, single character, waist-up, facing viewer, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 2:3
```

> โจทย์เดิม: ใช้คาถา พิษ และของขลัง บั่นทอนศัตรูทีละน้อยจนหมดแรง — เต็มตัว ยืนนิ่ง พื้นหลังโปร่ง ใช้ในหน้าเลือกผู้เดินทาง

### ⬜ นักรบวัด

`assets/classes/warrior.png` · 512×768px

```
an abandoned Thai temple hall with a tiered roof, single character, waist-up, facing viewer, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 2:3
```

> โจทย์เดิม: เลือดหนา ตั้งการ์ดแน่น สวนกลับหนัก เหมาะกับคนที่ชอบปะทะตรงๆ — เต็มตัว ยืนนิ่ง พื้นหลังโปร่ง ใช้ในหน้าเลือกผู้เดินทาง

### ⬜ แม่ชี

`assets/classes/nun.png` · 512×768px

```
a Thai Buddhist nun in white robes with a shaved head, single character, waist-up, facing viewer, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 2:3
```

> โจทย์เดิม: ดาเมจไม่สูง แต่ยืนระยะยาวได้ดีที่สุด ฟื้นเลือดข้ามไฟต์ — เต็มตัว ยืนนิ่ง พื้นหลังโปร่ง ใช้ในหน้าเลือกผู้เดินทาง

### ⬜ คนทรง

`assets/classes/medium.png` · 512×768px

```
a Thai spirit medium mid-trance, eyes rolled back, single character, waist-up, facing viewer, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 2:3
```

> โจทย์เดิม: สู้ด้วยผีคู่กาย ยิ่งเรียกมาก ยิ่งได้เปรียบ แต่ตัวเองบอบบาง — เต็มตัว ยืนนิ่ง พื้นหลังโปร่ง ใช้ในหน้าเลือกผู้เดินทาง

## ผี (23)

### ✅ ผีกระสือ

`assets/monsters/phi-krasue.png` · 512×512px

```
Krasue — a detached floating female head trailing glowing entrails, hovering low over rice paddies at night, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ผีหัวลอยที่เหาะไปมา มักปรากฏตัวในยามค่ำคืน — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ ผีปอบ

`assets/monsters/phi-pop.png` · 512×512px

```
Phi Pop — a gaunt villager possessed by an organ-eating spirit, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ผีที่เข้าสิงในคนเพื่อกินของสกปรก มีแรงเร้นกินเลือด — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ นางตานี

`assets/monsters/nang-tanee.png` · 512×512px

```
Nang Tani — a pale woman in traditional green Thai silk haunting a wild banana grove; a wild banana grove, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ผีหญิงสวยที่อยู่ในต้นกล้วย มักหลอกลวงคนให้หลงใหล — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ ผีนางรำ

`assets/monsters/phi-nang-ram.png` · 512×512px

```
the ghost of a Thai classical dancer in full costume and headdress, mid-pose, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: วิญญาณนักรำโบราณที่ยังคงเต้นรำในความมืด — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ ผีโป่งค่าง

`assets/monsters/phi-pong-kang.png` · 512×512px

```
a large ape-like forest spirit with long matted black hair, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ผีที่มีรูปร่างแปลกประหลาด เป็นลูกผสมระหว่างคนและสัตว์ — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ งูผีสาง

`assets/monsters/ngu-phi-sang.png` · 512×512px

```
a spectral serpent coiled in the dark; a spirit exhaling green poison vapour, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: งูยักษ์ที่กลายเป็นผี มีพิษร้ายที่สามารถฆ่าคนได้ — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ ผีเปรต

`assets/monsters/phi-pret.png` · 512×512px

```
Preta — a towering emaciated hungry ghost with a needle-thin neck and swollen belly, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ผีที่มีปากเล็กท้องใหญ่ อดอยากตลอดกาล — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ กะหัง

`assets/monsters/krahang.png` · 512×512px

```
Krahang — a shirtless man flying with two large woven rice baskets as wings, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ผีชายที่บินได้ มักลักพาตัวสาวๆ ในยามค่ำคืน — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ กุมารทอง

`assets/monsters/kuman-thong.png` · 512×512px

```
Kuman Thong — a small golden child spirit statue with a topknot; a guardian forest deity seated among roots, draped in votive cloth; the small pale ghost of a child, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: วิญญาณเด็กที่ถูกเสกให้กลายเป็นเทพารักษ์ — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ ผีตายทั้งกลม

`assets/monsters/phi-tai-hong.png` · 512×512px

```
the ghost of a woman who died in childbirth, still holding a bundle, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ผีของผู้ที่เสียชีวิตอย่างอนาถ มีความแค้นฝังลึก — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ ผีป่า

`assets/monsters/phi-pa.png` · 512×512px

```
a wild forest spirit made of bark, moss and antlers, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ผีที่อาศัยอยู่ในป่าลึก พ่อมดแม่มดของธรรมชาติ — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ แม่นาค

`assets/monsters/mae-nak.png` · 512×512px

```
Mae Nak — a young woman in old Thai dress with an unnaturally long reaching arm, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ผีหญิงในตำนานที่รักสามีจนไม่ยอมไปเกิด — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ ปอบใหญ่

`assets/monsters/pop-yai.png` · 512×512px

```
Phi Pop — a gaunt villager possessed by an organ-eating spirit, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ปอบที่มีพลังมากกว่าปกติ กินได้ทั้งของเน่าและเลือดสด — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ ผีห่าราตรี

`assets/monsters/phi-ha-ratri.png` · 512×512px

```
a plague spirit trailing sickly grey mist, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ผีที่ปรากฏในเวลาบ่ายโมง นำความตายมาสู่ผู้พบเห็น — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ อสุรกาย

`assets/monsters/asuragaya.png` · 512×512px

```
an Asura — a horned demon in ornate Thai temple-guardian armour, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ปีศาจร้ายที่มีพลังแห่งความมืด ศัตรูของสวรรค์ — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ ยักษ์วัดแจ้ง

`assets/monsters/yak-wat-jaeng.png` · 512×512px

```
an abandoned Thai temple hall with a tiered roof, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ยักษ์ผู้พิทักษ์วัด แต่กลายเป็นปีศาจเมื่อโกรธ — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ ผีพราย

`assets/monsters/phi-phrai.png` · 512×512px

```
Phrai — a drowned water spirit rising from a canal, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ผีที่ถูกสร้างด้วยเวทมนตร์ร้าย มีพลังที่น่ากลัว — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ วิญญาณเร่ร่อน

`assets/monsters/winyan-rerorn.png` · 512×512px

```
a drifting faceless wandering spirit in tattered cloth, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: วิญญาณที่หลงทางไม่สามารถไปสุคติได้ — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ ปีศาจไฟ

`assets/monsters/pisaj-fai.png` · 512×512px

```
a spirit made of drifting ember light, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ปีศาจที่ควบคุมไฟได้ เผาผลาญทุกสิ่งในทางของมัน — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ เจ้าพ่อป่า

`assets/monsters/jao-por-pa.png` · 512×512px

```
a guardian forest deity seated among roots, draped in votive cloth, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: เทพารักษ์ป่าที่กลายเป็นปีศาจเมื่อป่าถูกทำลาย — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ ผีนางใหญ่

`assets/monsters/phi-nang-yai.png` · 512×512px

```
an enormous towering female spirit seen from below, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ผีหญิงที่มีอำนาจเหนือผีอื่นๆ นางผีแห่งความมืด — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ วิญญาณเด็ก

`assets/monsters/winyan-dek.png` · 512×512px

```
the small pale ghost of a child, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: วิญญาณเด็กที่เสียชีวิตอย่างน่าสงสาร มีความแค้นฝังลึก — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ ยักษ์ดำ

`assets/monsters/yak-dam.png` · 512×512px

```
a Thai spirit house on a post, single creature, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ยักษ์ที่มีผิวดำสนิท มีกำลังมหาศาลและความโกรธเกรี้ยว — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

## บอส (5)

### ⬜ ผีแม่ม่าย

`assets/monsters/phi-mae-mai.png` · 768×768px

```
a widow ghost in dark mourning cloth, single imposing creature, full body, dramatic low angle, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ผีหญิงที่เสียสามีไป เต็มไปด้วยความเศร้าโศกและความแค้น — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ พระอุปคุต

`assets/monsters/phra-upakut.png` · 768×768px

```
Phra Upakut — a seated monk half-submerged in dark water, holding an alms bowl, single imposing creature, full body, dramatic low angle, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: เณรที่กลายเป็นปีศาจ ทรงพลังแห่งเวทมนตร์โบราณ — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ พญานาค

`assets/monsters/phaya-nak.png` · 768×768px

```
Mae Nak — a young woman in old Thai dress with an unnaturally long reaching arm; a spectral serpent coiled in the dark, single imposing creature, full body, dramatic low angle, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ราชาแห่งงูทั้งหลาย ผู้ครองน้ำและสายฟ้า — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ เทพอักษร

`assets/monsters/thep-aksorn.png` · 768×768px

```
single imposing creature, full body, dramatic low angle, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: เทพแห่งภาษาและคำสาป ผู้ควบคุมพลังแห่งคำ — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

### ⬜ พระยามัจจุราช

`assets/monsters/phraya-maccurat.png` · 768×768px

```
Phraya Maccurat, the Thai lord of death — a crowned skeletal figure in dark royal robes, single imposing creature, full body, dramatic low angle, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: เทพแห่งความตาย ผู้ปกครองอำนาจแห่งความมืดมิด — ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน

## พรติดตัว (12)

### ⬜ พรบรรพบุรุษ

`assets/imgBlessing/ancestral_blessing.png` · 256×256px

```
a single small object on plain dark ground, centred, icon-like, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ฟื้นฟู 1 HP ท้ายเทิร์น (วิญญาณบรรพบุรุษคุ้มครอง) — ไอคอนวัตถุมงคลชิ้นเดียว พื้นหลังโปร่ง

### ⬜ พลังวิญญาณ

`assets/imgBlessing/spirit_energy.png` · 256×256px

```
a single small object on plain dark ground, centred, icon-like, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: การ์ดใบแรกแต่ละเทิร์น ได้ +1 Energy (ผีช่วยเสริมพลัง) — ไอคอนวัตถุมงคลชิ้นเดียว พื้นหลังโปร่ง

### ⬜ ผีป้องกัน

`assets/imgBlessing/ghost_protection.png` · 256×256px

```
a single small object on plain dark ground, centred, icon-like, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: เมื่อเล่นการ์ดโจมตี ได้ Block 2 (ผีช่วยป้องกัน) — ไอคอนวัตถุมงคลชิ้นเดียว พื้นหลังโปร่ง

### ⬜ สมาธิสงบ

`assets/imgBlessing/meditation_peace.png` · 256×256px

```
a single small object on plain dark ground, centred, icon-like, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ต้นเทิร์น ได้ Block 3 (จิตใจสงบ ผีไม่รบกวน) — ไอคอนวัตถุมงคลชิ้นเดียว พื้นหลังโปร่ง

### ⬜ ปัญญาสมุนไพร

`assets/imgBlessing/herbal_wisdom.png` · 256×256px

```
a single small object on plain dark ground, centred, icon-like, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: การ์ด Skill ใบแรกแต่ละเทิร์น ได้ +1 Energy — ไอคอนวัตถุมงคลชิ้นเดียว พื้นหลังโปร่ง

### ⬜ ผ้าศักดิ์สิทธิ์

`assets/imgBlessing/sacred_cloth.png` · 256×256px

```
a single small object on plain dark ground, centred, icon-like, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ท้ายเทิร์น ได้ Block 1 (ผ้าเย็นป้องกัน) — ไอคอนวัตถุมงคลชิ้นเดียว พื้นหลังโปร่ง

### ⬜ ดูดพลังชีวิต

`assets/imgBlessing/life_steal_spirit.png` · 256×256px

```
a single small object on plain dark ground, centred, icon-like, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: เมื่อเล่นการ์ดโจมตี ฟื้นฟู 1 HP (ดูดวิญญาณศัตรู) — ไอคอนวัตถุมงคลชิ้นเดียว พื้นหลังโปร่ง

### ⬜ พลังปาไผ่

`assets/imgBlessing/bamboo_dart_power.png` · 256×256px

```
a single small object on plain dark ground, centred, icon-like, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: การ์ดโจมตีใบแรกแต่ละเทิร์น ได้ +1 Energy — ไอคอนวัตถุมงคลชิ้นเดียว พื้นหลังโปร่ง

### ⬜ โล่พิธีกรรม

`assets/imgBlessing/ritual_shield.png` · 256×256px

```
a single small object on plain dark ground, centred, icon-like, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: เมื่อเล่นการ์ด Skill ได้ Block 1 (พิธีกรรมป้องกัน) — ไอคอนวัตถุมงคลชิ้นเดียว พื้นหลังโปร่ง

### ⬜ พลังการ์ดฟรี

`assets/imgBlessing/free_card_energy.png` · 256×256px

```
a single small object on plain dark ground, centred, icon-like, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: การ์ดฟรี (0 cost) ใบแรกแต่ละเทิร์น คืน +1 Energy — ไอคอนวัตถุมงคลชิ้นเดียว พื้นหลังโปร่ง

### ⬜ เครื่องรางหลวงปู่

`assets/imgBlessing/luang_pu_protection.png` · 256×256px

```
a single small object on plain dark ground, centred, icon-like, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ลดดาเมจที่รับ 1 แต้ม (เครื่องรางศักดิ์สิทธิ์) — ไอคอนวัตถุมงคลชิ้นเดียว พื้นหลังโปร่ง

### ⬜ พรพญานาค

`assets/imgBlessing/naga_blessing.png` · 256×256px

```
Mae Nak — a young woman in old Thai dress with an unnaturally long reaching arm, a single small object on plain dark ground, centred, icon-like, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ต้นเทิร์น จั่วการ์ด 1 ใบ และได้ Energy +1 (พรจากพญานาค) — ไอคอนวัตถุมงคลชิ้นเดียว พื้นหลังโปร่ง

## ภาพประกอบเหตุการณ์ (12)

### ⬜ ศาลริมทาง

`assets/events/roadside_shrine.png` · 768×512px

```
a Thai spirit house on a post; coloured votive silk ribbons, wide establishing shot of a place, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 3:2
```

> โจทย์เดิม: ศาลไม้เล็กๆ ตั้งอยู่ตรงทางแยก ผ้าแพรสีซีดจนบอกไม่ได้ว่าเคยเป็นสีอะไร ในถาดมีกล้วยแห้งกับเห… — ภาพฉากแนวนอน ไม่ต้องมีตัวเอกในภาพ

### ⬜ ยายขอข้าว

`assets/events/old_woman_rice.png` · 768×512px

```
a featureless shadow double of a person, wide establishing shot of a place, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 3:2
```

> โจทย์เดิม: หญิงชราหลังค่อมนั่งอยู่ริมคันนา ยื่นชามเปล่าออกมาโดยไม่เงยหน้า “ข้าวสักคำเถอะลูก” เงาของแก… — ภาพฉากแนวนอน ไม่ต้องมีตัวเอกในภาพ

### ⬜ ดงกล้วยตานี

`assets/events/tanee_grove.png` · 768×512px

```
a wild banana grove, wide establishing shot of a place, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 3:2
```

> โจทย์เดิม: กล้วยตานีขึ้นเป็นดงหนา ใบซ้อนกันจนแสงจันทร์ลอดลงมาเป็นทาง เครือหนึ่งสุกงอมห้อยต่ำ ลูกเรียง… — ภาพฉากแนวนอน ไม่ต้องมีตัวเอกในภาพ

### ⬜ หมอผีเร่ร่อน

`assets/events/wandering_shaman.png` · 768×512px

```
a Thai village exorcist in dark cloth with sacred tattoos and a staff; a rolled metal Thai amulet tube on cord; a drifting faceless wandering spirit in tattered cloth, wide establishing shot of a place, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 3:2
```

> โจทย์เดิม: ชายชราตัวดำเกรียมนั่งผิงไฟอยู่คนเดียว รอบตัวมีตะกรุดกองอยู่เป็นพะเนิน แกเงยหน้ามองสำรับในม… — ภาพฉากแนวนอน ไม่ต้องมีตัวเอกในภาพ

### ⬜ เสียงเด็กกลางทุ่ง

`assets/events/crying_child.png` · 768×512px

```
flooded rice paddies; the small pale ghost of a child, wide establishing shot of a place, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 3:2
```

> โจทย์เดิม: เสียงเด็กร้องไห้ลอยมาจากกลางทุ่งนา ไม่มีบ้านอยู่แถวนั้นสักหลัง เสียงไม่ได้ขยับเข้ามาใกล้ แ… — ภาพฉากแนวนอน ไม่ต้องมีตัวเอกในภาพ

### ⬜ บ่อน้ำร้าง

`assets/events/old_well.png` · 768×512px

```
a featureless shadow double of a person, wide establishing shot of a place, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 3:2
```

> โจทย์เดิม: บ่อน้ำหินเก่าปากกว้าง ขอบบ่อสึกเป็นรอยเชือกลึกหลายร่อง ก้มลงมองแล้วเห็นเงาตัวเองอยู่ลึกกว่… — ภาพฉากแนวนอน ไม่ต้องมีตัวเอกในภาพ

### ⬜ งานศพกลางดึก

`assets/events/night_funeral.png` · 768×512px

```
wide establishing shot of a place, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 3:2
```

> โจทย์เดิม: ไกลออกไปมีแสงตะเกียงกับเสียงปี่พาทย์ คนนั่งล้อมโลงกันเต็มลาน ทั้งที่ตีสามแล้ว ไม่มีใครหันม… — ภาพฉากแนวนอน ไม่ต้องมีตัวเอกในภาพ

### ⬜ ผ้าแพรบนต้นไม้

`assets/events/silk_on_tree.png` · 768×512px

```
coloured votive silk ribbons, wide establishing shot of a place, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 3:2
```

> โจทย์เดิม: ต้นไม้ใหญ่กลางทางมีผ้าแพรพันรอบลำต้นนับไม่ถ้วน สีสดจนเหมือนเพิ่งผูกเมื่อวาน ทั้งที่บางผืนเ… — ภาพฉากแนวนอน ไม่ต้องมีตัวเอกในภาพ

### ⬜ ทางแยกในหมอก

`assets/events/fork_in_mist.png` · 768×512px

```
wide establishing shot of a place, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 3:2
```

> โจทย์เดิม: หมอกลงหนาจนมองไม่เห็นปลายเท้า ข้างหน้าแยกเป็นสองทาง ทางหนึ่งมีรอยเท้าคนเดินไว้ใหม่ๆ อีกทาง… — ภาพฉากแนวนอน ไม่ต้องมีตัวเอกในภาพ

### ⬜ ระฆังวัดร้าง

`assets/events/temple_bell.png` · 768×512px

```
an abandoned Thai temple hall with a tiered roof, wide establishing shot of a place, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 3:2
```

> โจทย์เดิม: วัดร้างกลางป่า หลังคาพังลงมาแล้วครึ่งหนึ่ง แต่ระฆังยังแขวนอยู่ครบ ไม่มีลมสักนิด กระนั้นระฆ… — ภาพฉากแนวนอน ไม่ต้องมีตัวเอกในภาพ

### ⬜ คนแจวเรือจ้าง

`assets/events/boatman.png` · 768×512px

```
wide establishing shot of a place, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 3:2
```

> โจทย์เดิม: ท่าน้ำเก่ามีเรือลำหนึ่งจอดรออยู่ คนแจวสวมงอบคลุมหน้าจนมิด “ข้ามไหมล่ะ” เสียงลอดออกมาจากใต้… — ภาพฉากแนวนอน ไม่ต้องมีตัวเอกในภาพ

### ⬜ ร่างทรงกลางลาน

`assets/events/spirit_medium_trance.png` · 768×512px

```
a Thai spirit medium mid-trance, eyes rolled back, wide establishing shot of a place, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 3:2
```

> โจทย์เดิม: หญิงสาวนั่งตัวสั่นอยู่กลางลานดิน รอบตัวมีคนล้อมดูเงียบกริบ พอเราเดินเข้าไป เธอเงยหน้าขึ้นท… — ภาพฉากแนวนอน ไม่ต้องมีตัวเอกในภาพ

## ภาพประกอบบทคั่น (10)

### ⬜ บท: คืนที่ออกเดินทาง (shaman)

`assets/chapters/prologue_shaman.png` · 1024×576px

```
a rolled metal Thai amulet tube on cord, wide cinematic establishing shot, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 16:9
```

> โจทย์เดิม: ครูตายไปเมื่อสามวันก่อน ทิ้งไว้แต่ตะกรุดหนึ่งพวงกับใบลานที่เขียนไม่จบ… — ภาพฉากแนวนอน บรรยากาศนำก่อนข้อความ

### ⬜ บท: คืนที่ออกเดินทาง (warrior)

`assets/chapters/prologue_warrior.png` · 1024×576px

```
an abandoned Thai temple hall with a tiered roof, wide cinematic establishing shot, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 16:9
```

> โจทย์เดิม: วัดร้างมาสิบปีแล้ว แต่เรายังกวาดลานทุกเช้าเหมือนที่หลวงพ่อเคยสั่งไว้… — ภาพฉากแนวนอน บรรยากาศนำก่อนข้อความ

### ⬜ บท: คืนที่ออกเดินทาง (nun)

`assets/chapters/prologue_nun.png` · 1024×576px

```
wide cinematic establishing shot, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 16:9
```

> โจทย์เดิม: สวดมนต์ให้คนตายมาทั้งชีวิต จนจำเสียงตัวเองตอนสวดได้ดีกว่าเสียงตอนพูด… — ภาพฉากแนวนอน บรรยากาศนำก่อนข้อความ

### ⬜ บท: คืนที่ออกเดินทาง (medium)

`assets/chapters/prologue_medium.png` · 1024×576px

```
the small pale ghost of a child, wide cinematic establishing shot, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 16:9
```

> โจทย์เดิม: ตั้งแต่เด็ก มีคนเดินตามเราอยู่ข้างหลังเสมอหนึ่งคน ไม่เคยเห็นหน้า แต่ไม่เคยหายไปไหน… — ภาพฉากแนวนอน บรรยากาศนำก่อนข้อความ

### ⬜ บท: ครึ่งทาง

`assets/chapters/after_mid_boss.png` · 1024×576px

```
wide cinematic establishing shot, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 16:9
```

> โจทย์เดิม: สิ่งที่นอนอยู่ตรงหน้าเคยเป็นคนมาก่อน — เห็นได้จากรอยสักที่แขนซึ่งยังไม่จางไปกับเนื้อ… — ภาพฉากแนวนอน บรรยากาศนำก่อนข้อความ

### ⬜ บท: ปลายทาง

`assets/chapters/before_final_boss.png` · 1024×576px

```
wide cinematic establishing shot, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 16:9
```

> โจทย์เดิม: หมอกลงหนาจนไม่เห็นแม้แต่มือตัวเอง แต่ทางเดินยังชัดอยู่ใต้ฝ่าเท้า เหมือนมีคนเดินนำไปก่อนแล้… — ภาพฉากแนวนอน บรรยากาศนำก่อนข้อความ

### ⬜ บท: ยังไม่จบ

`assets/chapters/secret_unlocked.png` · 1024×576px

```
wide cinematic establishing shot, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 16:9
```

> โจทย์เดิม: ศพของมันสลายไปกับหมอกโดยไม่ทิ้งอะไรไว้เลย แม้แต่รอยบนพื้น… — ภาพฉากแนวนอน บรรยากาศนำก่อนข้อความ

### ⬜ บท: เช้าที่กลับมา

`assets/chapters/ending_win.png` · 1024×576px

```
wide cinematic establishing shot, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 16:9
```

> โจทย์เดิม: ฟ้าสางตอนที่เดินพ้นดงไม้สุดท้าย หมาที่หอนกันทั้งคืนเงียบไปพร้อมกันหมด… — ภาพฉากแนวนอน บรรยากาศนำก่อนข้อความ

### ⬜ บท: สิ่งที่แลกไป

`assets/chapters/ending_secret.png` · 1024×576px

```
wide cinematic establishing shot, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 16:9
```

> โจทย์เดิม: แม้แต่เจ้าแห่งความตายก็ยังต้องถอย — แต่การถอยของมันไม่เหมือนการแพ้เท่าไหร่… — ภาพฉากแนวนอน บรรยากาศนำก่อนข้อความ

### ⬜ บท: คืนที่ไม่ได้กลับ

`assets/chapters/ending_lose.png` · 1024×576px

```
wide cinematic establishing shot, no main character in frame. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 16:9
```

> โจทย์เดิม: แรงหมดตรงกลางทาง ดินเย็นกว่าที่คิด และไม่เจ็บอย่างที่กลัวไว้เลย… — ภาพฉากแนวนอน บรรยากาศนำก่อนข้อความ

## ไอคอนบนเส้นทาง (3)

### ⬜ ไอคอนโหนดสู้

`assets/nodes/fight.png` · 96×96px

```
a rolled metal Thai amulet tube on cord, flat symbolic icon, high contrast, centred in a circle, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: สัญลักษณ์การต่อสู้ — มีดหมอ/ตะกรุด บนวงกลมโปร่ง

### ⬜ ไอคอนโหนดบอส

`assets/nodes/boss.png` · 96×96px

```
flat symbolic icon, high contrast, centred in a circle, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: สัญลักษณ์บอส — กะโหลก/มงกุฎผี บนวงกลมโปร่ง

### ⬜ ไอคอนโหนดพัก

`assets/nodes/rest.png` · 96×96px

```
a small open roadside pavilion, flat symbolic icon, high contrast, centred in a circle, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: สัญลักษณ์จุดพัก — ศาลา/กองไฟ บนวงกลมโปร่ง

## การ์ดจุดแวะ (10)

### ✅ ร้านค้าการ์ด

`assets/encounters/enShopCardMini.png` · 200×200px

```
a Thai sacred yantra cloth with geometric Khom script, a single place or object seen from a short distance, square composition. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: แผงขายของริมทาง มีม้วนคาถา/ยันต์วางขาย

### ⬜ ร้านเครื่องราง

`assets/encounters/enShopEquipMini.png` · 200×200px

```
a rolled metal Thai amulet tube on cord; Buddhist prayer beads, a single place or object seen from a short distance, square composition. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: แผงขายเครื่องราง ตะกรุด ลูกประคำ

### ⬜ สละการ์ด

`assets/encounters/enRemoveMini.png` · 200×200px

```
a Thai sacred yantra cloth with geometric Khom script, a single place or object seen from a short distance, square composition. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: กองไฟเผากระดาษยันต์ สื่อถึงการทิ้งการ์ด

### ⬜ ปลุกเสกการ์ด

`assets/encounters/enUpgradeMini.png` · 200×200px

```
burning incense sticks, a single place or object seen from a short distance, square composition. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: โต๊ะพิธี ธูปเทียน สื่อถึงการปลุกเสก

### ⬜ บ่อน้ำลึกลับ

`assets/encounters/enWellMini.png` · 200×200px

```
a single place or object seen from a short distance, square composition. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: บ่อน้ำหินเก่า มีแสงเรืองจากก้นบ่อ

### ⬜ ศาลพักใจ

`assets/encounters/enShrineMini.png` · 200×200px

```
burning incense sticks; a Thai spirit house on a post; coloured votive silk ribbons, a single place or object seen from a short distance, square composition. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ศาลพระภูมิเล็กๆ มีผ้าแพรและธูปจุดค้างอยู่

### ✅ หีบสมบัติ

`assets/encounters/enTreasureOpenMini.png` · 200×200px

```
a single place or object seen from a short distance, square composition. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: หีบไม้เก่าเปิดอยู่ มีแสงลอดออกมา

### ⬜ สมบัติชิ้นเดียว

`assets/encounters/enTreasure1Mini.png` · 200×200px

```
a single place or object seen from a short distance, square composition. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ห่อผ้าเล็กๆ วางบนตอไม้ มีของชิ้นเดียวข้างใน

### ⬜ ทางไปต่อ

`assets/encounters/enNextMini.png` · 200×200px

```
a single place or object seen from a short distance, square composition. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ทางเดินลึกเข้าไปในความมืด มีรอยเท้าบนดินเปียก

### ⬜ แท่นผสาน

`assets/encounters/enFusionMini.png` · 200×200px

```
a Thai sacred yantra cloth with geometric Khom script, a single place or object seen from a short distance, square composition. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: แท่นหินกลางป่า มีรอยยันต์เรืองแสง ใช้รวมการ์ดสองใบเป็นใบเดียว

## ผีที่เรียกมาช่วย (9)

### ⬜ วิญญาณเพื่อน

`assets/minions/ghost_ally.png` · 256×256px

```
a small friendly spirit companion hovering at shoulder height, a small spirit companion, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: โจมตีด้วยพลังวิญญาณทะลุการป้องกัน — ตัวเล็กครึ่งตัว **PNG พื้นโปร่ง** อ่านออกตอนย่อเหลือ 34px

### ⬜ ปีศาจสหาย

`assets/minions/demon_minion.png` · 256×256px

```
a small friendly spirit companion hovering at shoulder height, a small spirit companion, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: กรงเล็บปีศาจฉีกเป็นแผล — ตัวเล็กครึ่งตัว **PNG พื้นโปร่ง** อ่านออกตอนย่อเหลือ 34px

### ⬜ กุมารทอง

`assets/minions/kuman_spirit.png` · 256×256px

```
Kuman Thong — a small golden child spirit statue with a topknot, a small spirit companion, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ส่งพลังบุญบันดาลให้เจ้าของ — ตัวเล็กครึ่งตัว **PNG พื้นโปร่ง** อ่านออกตอนย่อเหลือ 34px

### ⬜ วิญญาณพิษ

`assets/minions/poison_spirit.png` · 256×256px

```
a spirit exhaling green poison vapour, a small spirit companion, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: พ่นพิษลึกลับรบกวนศัตรู (1 ชั้น, 2 เทิร์น) — ตัวเล็กครึ่งตัว **PNG พื้นโปร่ง** อ่านออกตอนย่อเหลือ 34px

### ⬜ โคลนเงา

`assets/minions/shadow_clone.png` · 256×256px

```
a featureless shadow double of a person, a small spirit companion, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: โคลนเงาจู่โจมด้วยพลังความมืด — ตัวเล็กครึ่งตัว **PNG พื้นโปร่ง** อ่านออกตอนย่อเหลือ 34px

### ⬜ ผู้พิทักษ์ต้นไม้

`assets/minions/tree_guardian.png` · 256×256px

```
a tree guardian spirit with a bark face emerging from a trunk, a small spirit companion, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: สร้างโล่ธรรมชาติป้องกันเจ้าของ · พันด้วยรากไม้ ทำให้ไม่สามารถใช้ไพ่โจมตีได้ — ตัวเล็กครึ่งตัว **PNG พื้นโปร่ง** อ่านออกตอนย่อเหลือ 34px

### ⬜ วิญญาณนักสู้โบราณ

`assets/minions/ancient_warrior_spirit.png` · 256×256px

```
the armoured ghost of an ancient Thai warrior with a curved sword, a small spirit companion, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ใช้ประสบการณ์การรบป้องกันเจ้าของ (+3 block) · แบ่งปันพลังรบโบราณ (+1 พลังงาน) — ตัวเล็กครึ่งตัว **PNG พื้นโปร่ง** อ่านออกตอนย่อเหลือ 34px

### ⬜ หอยทากผี

`assets/minions/spirit_snail.png` · 256×256px

```
a translucent glowing ghost snail, a small spirit companion, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: ส่งพลังงานลึกลับให้เจ้าของ — ตัวเล็กครึ่งตัว **PNG พื้นโปร่ง** อ่านออกตอนย่อเหลือ 34px

### ⬜ ปีศาจป่า

`assets/minions/forest_demon.png` · 256×256px

```
a wild forest spirit made of bark, moss and antlers, a small spirit companion, full body, plain dark background, transparent background. hand-painted storybook illustration, Thai rural folk-horror, muted desaturated palette of umber, olive and deep ink, single warm light source (moonlight or oil lamp), soft painterly edges, visible brush texture, no text, no watermark, no signature. --ar 1:1
```

> โจทย์เดิม: สาปให้ผู้เล่นอ่อนแอลง (1 เทิร์น) — ตัวเล็กครึ่งตัว **PNG พื้นโปร่ง** อ่านออกตอนย่อเหลือ 34px
