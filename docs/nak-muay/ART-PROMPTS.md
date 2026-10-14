# ภาพการ์ดนักมวยคาดเชือก — prompt ให้ GPT

สร้างจาก `docs/nak-muay/art-prompts.json` (ไฟล์ JSON คือของจริง ไฟล์นี้ไว้อ่าน)

## วิธีใช้
1. ให้ GPT สร้างภาพจาก prompt ทีละใบ พื้นหลังโปร่งใส 1024×1024
2. ย่อเป็น 384×384 แล้วเซฟเป็น `.webp` ตาม path
3. เพิ่มบรรทัดใน `app/cardArt.ts` แล้วลบ id ออกจาก `cards` ใน JSON (เทสต์จะบังคับให้มีภาพทันที)

สถานะ `new` = ยังไม่มีภาพ (การ์ดแสดงไอคอนแทน) · `redo` = มีภาพเดิมที่ไม่เข้าธีม (ดาบ/โล่/ประตูวัด) ใช้ไปก่อนได้

## สไตล์ (ใส่ทุกใบ)

Thai one-baht horror pulp comic card illustration, matching the existing ผีกินหัว card set: rough confident black ink outlines with coarse cross-hatching, muted vintage print colours (ochre, olive, brick red, faded indigo, warm skin tones), one clear subject or a tight two-figure action, dynamic readable silhouette that still reads at 80 px, transparent background (real alpha), square 1:1 canvas, subject fills about 85%, small clean margin. Fighter look: lean rural Thai Muay Boran fighter, bare chest, hands wrapped in raw hemp rope (คาดเชือก), red cloth headband (มงคล) and red arm band (ประเจียด), loincloth/pha khao ma wrapped as shorts, barefoot. Night-of-ghosts mood without gore close-ups. No text, letters, numbers, logos, card frame, border, parchment, gradient background, 3D render or glow effects. Not Chinese/Japanese martial-arts styling.

## การ์ด (41 ใบ)

### หมัดแย็บ · `jab` · new
`assets/cards/thai-v24/jab.webp`

The fighter snapping a quick left jab into a pale Thai ghost (sickly grey-green skin, hollow dark eyes, ragged white cloth)'s cheek, small purple-blue bruise mark blooming where it lands, short speed lines

### เตะตัดขา · `low_kick` · new
`assets/cards/thai-v24/low_kick.webp`

Side view: the fighter swinging a low roundhouse kick into the thigh of a pale Thai ghost (sickly grey-green skin, hollow dark eyes, ragged white cloth), the ghost's leg buckling

### เข่าตรง · `straight_knee` · new
`assets/cards/thai-v24/straight_knee.webp`

The fighter driving a straight knee into the stomach of a pale Thai ghost (sickly grey-green skin, hollow dark eyes, ragged white cloth), both hands pulling the ghost down by the shoulders

### ศอกเฉียง · `slant_elbow` · new
`assets/cards/thai-v24/slant_elbow.webp`

The fighter slashing a diagonal elbow across the face of a pale Thai ghost (sickly grey-green skin, hollow dark eyes, ragged white cloth), earlier bruise marks on the ghost bursting like ink splashes

### หมัดตรง · `straight_punch` · new
`assets/cards/thai-v24/straight_punch.webp`

The fighter throwing a full straight right punch toward the viewer, rope-wrapped fist large in the foreground, strong perspective

### หมัดเหวี่ยงสั้น · `short_hook` · new
`assets/cards/thai-v24/short_hook.webp`

Tight short hook to a pale Thai ghost (sickly grey-green skin, hollow dark eyes, ragged white cloth)'s jaw, the fighter's back foot still turning from a kick, two bruise marks on the ghost

### ถีบจิก · `push_kick` · new
`assets/cards/thai-v24/push_kick.webp`

The fighter's straight push kick (teep) smashing through a ghostly bone-and-cloth shield held by a pale Thai ghost (sickly grey-green skin, hollow dark eyes, ragged white cloth), shield pieces flying

### เตะก้านคอ · `neck_kick` · new
`assets/cards/thai-v24/neck_kick.webp`

High roundhouse kick slamming the side of a pale Thai ghost (sickly grey-green skin, hollow dark eyes, ragged white cloth)'s neck, heavy impact burst, ghost's head snapping sideways

### หมัดฮุกคู่ · `double_hook` · new
`assets/cards/thai-v24/double_hook.webp`

Left and right hooks shown as two overlapping motion arcs landing on a pale Thai ghost (sickly grey-green skin, hollow dark eyes, ragged white cloth), two bruise marks

### หมัดอัปเปอร์ · `uppercut` · new
`assets/cards/thai-v24/uppercut.webp`

Low angle: rising uppercut lifting a pale Thai ghost (sickly grey-green skin, hollow dark eyes, ragged white cloth) off its feet, fighter crouched and exploding upward

### เตะกลับหลัง · `spin_back_kick` · new
`assets/cards/thai-v24/spin_back_kick.webp`

The fighter mid spinning back kick, body twisted, heel leading, circular motion line around him

### เตะกวาด · `sweep_kick` · new
`assets/cards/thai-v24/sweep_kick.webp`

Low spinning sweep kick knocking over a ghost and two small ghost minions (child spirits) at once, wide arc

### จับคอขย่มเข่า · `clinch_knee` · new
`assets/cards/thai-v24/clinch_knee.webp`

Thai clinch: the fighter's hands locked behind a pale Thai ghost (sickly grey-green skin, hollow dark eyes, ragged white cloth)'s neck, knee rising repeatedly (three faint knee echoes), bruises on the ghost

### ศอกกลับลังกา · `reverse_elbow` · new
`assets/cards/thai-v24/reverse_elbow.webp`

The fighter spinning in a reverse elbow, whole body coiled, swirl of rhythm energy (faint red wind lines) pouring into the elbow

### เตะเสยคาง · `chin_kick` · new
`assets/cards/thai-v24/chin_kick.webp`

Vertical kick under the chin of a pale Thai ghost (sickly grey-green skin, hollow dark eyes, ragged white cloth), ghost's eyes spinning dizzy with little stars/sparks, stunned

### หนุมานถวายแหวน · `hanuman_ring` · new
`assets/cards/thai-v24/hanuman_ring.webp`

Muay Boran technique 'Hanuman presents the ring': the fighter leaping with both fists together in a double uppercut, faint shadow of the monkey god Hanuman behind him in red ink

### จระเข้ฟาดหาง · `crocodile_tail` · new
`assets/cards/thai-v24/crocodile_tail.webp`

Muay Boran technique 'crocodile whips its tail': a full spinning back kick, faint shadow of a crocodile tail in the motion arc

### ไหว้ครูร่ายรำ · `wai_khru` · new
`assets/cards/thai-v24/wai_khru.webp`

The fighter kneeling and bowing in the Wai Khru ritual dance, hands pressed together, mongkol headband, small candle and incense before him, calm and sacred

### จ้องตาคู่ชก · `stare_down` · new
`assets/cards/thai-v24/stare_down.webp`

Face-off close-up: the fighter and a pale Thai ghost (sickly grey-green skin, hollow dark eyes, ragged white cloth) forehead to forehead, the fighter's fierce stare making the ghost flinch

### อมน้ำมนต์พ่น · `holy_water_spray` · new
`assets/cards/thai-v24/holy_water_spray.webp`

A corner man spraying a mouthful of holy water mist over the seated fighter's face between rounds, small clay water bowl

### คาดเชือกใหม่ · `rewrap` · new
`assets/cards/thai-v24/rewrap.webp`

Close-up of two hands tightly winding raw hemp rope around a fist, rope end held in the teeth

### ลูกศิษย์ตัวน้อย · `call_pupil` · new
`assets/cards/thai-v24/call_pupil.webp`

A small temple boy (about 9 years old) in a red headband copying the fighter's guard stance, brave but tiny

### พี่เลี้ยงมุมเวที · `call_corner` · new
`assets/cards/thai-v24/call_corner.webp`

An older corner man with a towel over his shoulder and a clay water jar, fanning with a towel, kind weathered face

### คนเป่าปี่ชวา · `call_pi` · new
`assets/cards/thai-v24/call_pi.webp`

An old musician playing the Javanese oboe (ปี่ชวา) with puffed cheeks, sitting cross-legged

### มือกลองแขก · `call_drummer` · new
`assets/cards/thai-v24/call_drummer.webp`

A musician beating a pair of long Thai 'klong khaek' drums with bare hands, motion lines on the drumheads

### นักมวยรุ่นพี่ · `call_senior` · new
`assets/cards/thai-v24/call_senior.webp`

A big senior fighter stepping in front, arms raised in a high guard, taking a ghost's claw strike for someone behind him

### ครูมวยเฒ่า · `call_old_master` · new
`assets/cards/thai-v24/call_old_master.webp`

An elderly Muay Boran master with white hair and a long sacred cord, mirroring a strike with surprising speed, faint glow-free ink aura

### ปัดล่อ · `parry_bait` · new
`assets/cards/thai-v24/parry_bait.webp`

The fighter slapping aside a pale Thai ghost (sickly grey-green skin, hollow dark eyes, ragged white cloth)'s claw strike with an open palm, bruise mark left on the ghost's wrist

### ถีบสกัด · `stop_kick` · new
`assets/cards/thai-v24/stop_kick.webp`

Teep stop-kick to the chest of a pale Thai ghost (sickly grey-green skin, hollow dark eyes, ragged white cloth) that is just starting a curse gesture, interrupting it

### จับล็อกคอ · `neck_lock` · new
`assets/cards/thai-v24/neck_lock.webp`

The fighter locking a pale Thai ghost (sickly grey-green skin, hollow dark eyes, ragged white cloth) in a tight neck clinch from behind, the ghost's chanting mouth smothered, spell smoke fizzling out

### เชือกคาดชุบน้ำมันงา · `oiled_wraps` · new
`assets/cards/thai-v24/oiled_wraps.webp`

Item: a coil of raw hemp hand-wrapping rope glistening with sesame oil, small oil cup beside it

### มงคลสวมหัว · `mongkhon` · new
`assets/cards/thai-v24/mongkhon.webp`

Item: a sacred Muay Thai mongkol headband (braided cord ring with a tail), red and white, resting on a small offering tray

### ประเจียดแขน · `arm_prajiad` · new
`assets/cards/thai-v24/arm_prajiad.webp`

Item: a red prajiad arm band with faint abstract yantra marks (no readable script), knotted, with a small Buddhist tassel

### กางเกงมวยลงยันต์ · `yantra_shorts` · new
`assets/cards/thai-v24/yantra_shorts.webp`

Item: old-style fighter's loincloth shorts painted with abstract yantra geometry (no readable script), folded

### เชือกคาดเศษแก้ว · `glass_wraps` · new
`assets/cards/thai-v24/glass_wraps.webp`

Item: rope hand-wraps crusted with dried glue and glittering crushed glass shards, menacing

### ตะกรุดโทน · `takrut` · new
`assets/cards/thai-v24/takrut.webp`

Item: a single rolled-metal takrut amulet on a red cord, hanging, small and powerful

### ผ้าประเจียดครูให้ · `master_cloth` · new
`assets/cards/thai-v24/master_cloth.webp`

Item: an old faded red prajiad cloth being tied around a young wrist by an elder's wrinkled hands

### ยันต์รับแล้วสวน · `ward_riposte` · redo
`assets/cards/thai-v24/ward_riposte.webp`

The fighter blocking a ghost claw with crossed rope-wrapped forearms (red sacred thread around them) and instantly countering with an elbow; NO weapons

### ตั้งการ์ดสวนหมัด · `gate_watch` · redo
`assets/cards/thai-v24/gate_watch.webp`

The fighter in a tight high guard, eyes narrowed, waiting; a ghost's fist about to land on his forearms; ready-to-counter tension; NO temple gate

### ศอกตัดกรรม · `karma_cut` · redo
`assets/cards/thai-v24/karma_cut.webp`

One devastating downward elbow strike splitting a black cloud of curse around a pale Thai ghost (sickly grey-green skin, hollow dark eyes, ragged white cloth), ink splash; NO sword

### แม่ไม้ครูห้าคืน · `night_guardian_cut` · redo
`assets/cards/thai-v24/night_guardian_cut.webp`

The fighter throwing a double punch combination under a full moon, five small candle flames around (the five nights); NO weapons

## ศิษย์ค่ายบนสนาม (6 ตัว)

### ลูกศิษย์ตัวน้อย · `camp_pupil`
`assets/minions/camp_pupil.webp`

The small temple boy fighter standing in guard, full body, facing right

### พี่เลี้ยงมุมเวที · `corner_man`
`assets/minions/corner_man.webp`

The corner man with towel and water jar, full body, facing right

### คนเป่าปี่ชวา · `pi_player`
`assets/minions/pi_player.webp`

The oboe player seated, full body, facing right

### มือกลองแขก · `drummer`
`assets/minions/drummer.webp`

The drummer with his klong khaek drums, full body, facing right

### นักมวยรุ่นพี่ · `senior_boxer`
`assets/minions/senior_boxer.webp`

The big senior fighter in high guard, full body, facing right

### ครูมวยเฒ่า · `old_master`
`assets/minions/old_master.webp`

The elderly master in a fighting stance, full body, facing right
