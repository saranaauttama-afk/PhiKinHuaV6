# ผีกินหัว — Astra: Starter และ Deck Progression v1

16 ตุลาคม 2026 · ข้อกำหนดต้นแบบสำหรับการลงโค้ดบน `work/deck-progression-v1`

**คำสั่งล่าสุดของเจ้าของเกม:** เริ่มแก้โค้ดได้ และไม่ต้องรักษาเซฟเกมเก่า จึงไม่ทำ migration หรือ legacy profile ในงานนี้ เซฟรันเดิมอาจเล่นต่อด้วยกติกาชุดใหม่ไม่ได้ ให้เริ่มรันใหม่หลังอัปเดต

**สถานะหลังลงโค้ด:** ตารางต่อไปเป็น draft baseline ของ Astra; การจูนที่ลงจริงและผลตรวจอยู่ใน `IMPLEMENTATION.md` (HP คืนแรกและสมาธิต่างจากตารางด้านล่าง). อย่าใช้ตัวเลขใน draft เป็นผลวัดหรืออ้างว่า acceptance ผ่านแล้ว

ข้อกำหนดตัวเลขในเอกสารนี้คือ **prototype v1 ที่เลือกแล้ว** ไม่ใช่รายการทางเลือก และยังไม่ผ่าน simulation/playtest ของชุดใหม่นี้ ถ้าผลไม่ผ่านเกณฑ์ท้ายเอกสาร ให้แก้พารามิเตอร์ตามหลักฐานก่อนปล่อยจริง ห้ามเขียนว่า balance ผ่านแล้วจากการอ่านโค้ดหรือคำนวณตัวอย่าง

ฐานที่ตรวจ: `main` commit `358bab97edf5a7364437e6bc1a1657f7cd830b3e` ของ `saranaauttama-afk/PhiKinHuaV6` ซึ่งรวม PR24 แล้ว ทีมหลักตรวจว่า source 122 ไฟล์ในสำเนา `research-source` ตรงกับ Git blob บน main นี้เมื่อไม่นับ newline ท้ายไฟล์ที่เพิ่มตอนดึงข้อมูล งานนี้ต่อยอดสองรายงานวันที่เดียวกัน แต่ใช้ source ปัจจุบันเป็นหลัก ไม่ใช่คำอธิบายเก่าที่ค้างใน comment

## 1. ผลที่ต้องการและขอบเขต

ไฟต์ทั่วไปสองไฟต์แรกของ difficulty 1 ควรจบโดยมากใน 2–3 **ตาผู้เล่น** ด้วยการตีพื้นฐานที่เล็กและผี HP ต่ำ ช่วงกลางให้รู้สึกชัดว่าจั่วไพ่พื้นฐานอีกใบเสียโอกาสเจอไพ่ที่ทำงานเข้ากัน ช่วงท้ายให้ชนะด้วยสิ่งที่เลือกซื้อ/รับ/ลบระหว่างรัน การอัป starter ทั้งชุดจน 3 ดาวต้องช่วยประคองได้ แต่ไม่ทดแทนการสร้างเด็ค

บาง starter ยังควรเก็บ: ใบป้อนสถานะหนึ่งใบ ใบประคองทรัพยากร ใบรักษาจังหวะ หรือไหว้ครู ไม่กำหนดว่าต้องลบทุกใบ และไม่บังคับเลือก build จากเมนูก่อนเล่น

ล็อกขอบเขตดังนี้:

- `warrior` คือ **นักมวยคาดเชือก**; `shaman` คือ **หมอผีผู้ถือขันน้ำมนต์** ใช้ ID เดิมทั้งหมด
- คงน้ำเริ่มหมอผี 2, น้ำต้นตาตั้งแต่ตา 2 = 3, ขันฐาน 12, ล้นน้ำเป็นเกราะ 2/หน่วย, ยันต์ครบ 5 แล้วผนึกและคืนน้ำ 2
- คงจังหวะสูงสุด 8 และกฎเปลี่ยนท่าที่มีอยู่ ไม่สร้าง “Combo System” เพิ่ม
- คงมือ/จั่ว/AP/retain/เพดานจั่วเอฟเฟกต์ของทั้งสองฝ่าย และกติกาการเติบโตหลังบอสคืน 2 ตาม main
- คงสมุน **ออกผลเมื่อมาถึง + ออกผลตามเวลาปกติ** ของ PR24 ไม่ย้อนกลับไปใช้สมุนรอตาหน้า
- คง damage, deck, rage, strength ตาม depth, phase, summon และ AI ของผีในรอบ progression นี้; ปรับ HP ตามส่วน 7 เท่านั้น
- ใช้ progression ใหม่เฉพาะ NewRun ของ `warrior`/`shaman`; แม่ชี/คนทรงและโหมดที่อยู่นอกสามคืนยังใช้ profile0 รวมราคา/HP/ร้านเดิม แม้เป็นงานทดสอบหรือเซฟเก่า ห้ามแก้ global constants แล้วกระทบสองคลาสนั้นเงียบๆ
- ไม่ทำ Diorama; ไม่เปิดแม่ชี/คนทรง; ไม่แตะจำนวนไฟต์: 7/10/10 route fights + บอสคืนละ 1 = 30 ไฟต์, difficulty 5 มีผีกินหัวต่ออีก 1

## 2. Starter นักมวย: 10 ใบแน่นอน

ทุกแถวเริ่ม 1 ดาว; รูปแบบ `a/b/c` หมายถึงผล 1/2/3 ดาว ไม่ใช่เพิ่มอีก 3 ครั้ง — ระบบมี **อัปได้ 2 ขั้น** เท่านั้น ค่า AP/น้ำคงที่ทั้งสามดาว ยกเว้นสถานะ corruption หรือกฎ runtime ที่มีอยู่

| ID / ชื่อ | สำเนา | Type; AP/น้ำ | ผล 1 → 2 → 3 ดาว | บทบาทและข้อกำหนด |
|---|---:|---|---|---|
| `jab` หมัดแย็บ | 2 | attack; 0/0 | ตี 3/4/5 | punch; **ลบช้ำออก** ทั้งสามดาว; `rhythmDamageCap:2` |
| `low_kick` เตะตัดขา | 1 | attack; 0/0 | ตี 4/5/6 | kick; **ลบ after/weakness เดิม**; `rhythmDamageCap:2` |
| `straight_knee` เข่าตรง | 1 | attack; 0/0 | ตี 4/5/6 + ช้ำ 1 คงที่ | knee; `rhythmDamageCap:2`; เป็นใบเชื่อม ไม่ใช่แหล่งช้ำเร็ว |
| `slant_elbow` ศอกเฉียง | 1 | attack; 0/0 | ตี 4/5/6 | elbow, heavy; `rhythmDamageCap:2`; `starterHeavy:{maxStacks:2,perStack:2}` |
| `muay_stance` ตั้งการ์ด | 3 | action; 1/0 | เกราะ 4/5/6 | ใบตั้งรับพื้นฐานที่เปลี่ยนเป็นเครื่องมือเฉพาะทางได้ |
| `shin_block` ก้าวสลับฟันปลา | 1 | action; 1/0 | เกราะ 3/4/5 + keepRhythm | คงจังหวะตามกฎเดิม เหตุผลเก็บเมื่อมีเครื่องยนต์จังหวะ |
| `wai_khru` ไหว้ครูร่ายรำ | 1 | action; 1/0 | เกราะ 2/3/4 + จังหวะ 1 คงที่ | innate + exhaust; ยังติดมือและออกจากวงจรหลังใช้ |

รวม 5 attack + 5 action = 10 ใบ ปรับ `starter` counts ที่ data เท่านั้น ไม่มีการแยกว่าต้นรันกับร้านเป็นคนละนิยามของ ID เดียวกัน ไพ่ ID เหล่านี้ทุกสำเนาภายใต้ ruleset ใหม่ใช้กฎเดียวกัน

**วิธีเขียนดาว:** ลง `fx` 1 ดาว และ `stars:[Fx2,Fx3]` ของทุกแถวโดยใส่สถานะและผลคงที่ที่จำเป็นให้ครบ เช่น `straight_knee` ทุกดาวมี status ช้ำ1, `wai_khru` ทุกดาว rhythm1 อย่าปล่อยให้ `statusBonus` ทั่วไปเพิ่มช้ำเป็น 2/3 เอง การลบ `jab.fx.status` และ `low_kick.after` ต้องลบจากนิยามจริง ไม่ใช่แค่ลบข้อความหน้าไพ่

**เหตุผลที่ไม่แก้จังหวะทั้งอาชีพ:** starter ยังสลับท่าสร้างจังหวะ 8 ให้ใบใหม่ได้ แต่ตัวเองรับโบนัสจังหวะสูงสุด +2 ต่อ hit ไพ่ขั้นสูงรับเต็มตามเดิม เมื่อจังหวะ8 หมัดแย็บ3ดาวจึงมีดิบ 5+2=7 ก่อนพร/อุปกรณ์/สถานะ ส่วน `triple_knee` 1ดาวเป็น (4+8)×3=36 ก่อน modifier อื่น การเข้าถึงท่าที่ใช้จังหวะคุ้มจึงเป็นการเติบโตที่มองเห็นได้

## 3. Starter หมอผี: 10 ใบแน่นอน

| ID / ชื่อ | สำเนา | Type; AP/น้ำ | ผล 1 → 2 → 3 ดาว | บทบาทและข้อกำหนด |
|---|---:|---|---|---|
| `bamboo_dart` ปาไผ่เผา | 3 | attack; 0/0 | ตี 3/4/5 | ไพ่อ่อนที่ตัดก่อนเมื่อได้คาถาหรือชุดใหม่ |
| `cursed_needle` เสกเข็มปัก | 1 | attack; 0/0 | ตี 3/4/5 + ยันต์1 คงที่ | ลดจาก 2 เหลือ 1 สำเนา; ไม่เพิ่มยันต์ตามดาว |
| `meditation` นั่งสมาธิปลุกเสก | 1 | mana; 0/0 | น้ำ 2/3/4 | **ไม่มี draw ทุกดาว**; คง `limit:'turn'` ต่อ ID |
| `holy_water_splash` สาดน้ำมนต์ | 1 | spell; 0/0 | 3×น้ำที่ใช้ + ดาเมจเพิ่ม 0/2/4 | `splash:{dmg:3}`, `splashWaterCap:3`; ใช้น้ำสูงสุด3และเหลือน้ำส่วนเกิน |
| `sprinkle` ประพรมน้ำมนต์ | 1 | spell; 0/1 | เกราะ 4/5/6 + heal1 คงที่ | ป้องกันเบาและมีเหตุผลเก็บ ไม่ใช่เครื่องฮีลฟรี |
| `cooling_cloth` ผ้าเย็น | 2 | action; 1/0 | เกราะ 4/5/6 | ป้องกันพื้นฐาน |
| `fill_bowl` ตักน้ำใส่ขัน | 1 | action; 1/0 | น้ำ2คงที่ + เกราะ 2/3/4 | starter ใหม่โดยใช้ ID ที่มีอยู่; ดึงต้นทุน AP มาให้เห็น |

รวม 4 attack + 1 mana + 2 spell + 3 action = 10 ใบ `curse_chant` ไม่เป็น starter อีกต่อไป แต่ยังเป็นการ์ดซื้อ/รางวัลได้ในฐานะเครื่องมือโจมตีขั้นต่อไป; จำนวนนั่งสมาธิเดิม2ลดเหลือ1

สาดระดับใหม่มี `fx:{dmg:0}`, `stars:[{dmg:2},{dmg:4}]` ซึ่งเป็น **ดาเมจคงที่เพิ่มต่อการใช้หนึ่งครั้ง** ไม่ใช่เพิ่ม damage/น้ำ ไม่ต้องสร้าง top-level star schema ใหม่ เมื่อใช้3น้ำ ดิบจึงเป็น9/11/13; ถ้าใช้1น้ำเป็น3/5/7 สาดไม่ได้เมื่อน้ำเหลือ0ตาม playBlock เดิม ขันที่ใหญ่ขึ้นไม่ขยายปริมาณน้ำที่ starter ใช้ต่อครั้ง

ตัวอย่างเปิดเกมน้ำ2 + นั่งสมาธิ1ดาวน้ำ2 = 4: สาดใช้3 ตี9 เหลือน้ำ1 ไม่ใช่ตี20หรือกิน4น้ำ; การใช้สกิลเพิ่มพลังคาถาที่มีอยู่ยังคูณผลได้ตามเดิม เพราะผู้เล่นลงทุนทรัพยากรเพิ่มแล้ว ข้อจำกัดนี้ไม่ใช่ hard cap ดาเมจสุดท้าย

## 4. Field ใหม่และลำดับคำนวณ: ให้ engine/UI/pilot ตรงกัน

เพิ่มเพียงสาม field เชิงกลไกใน `CardData` และ metadata สองชนิดสำหรับ progression; ไม่มีระบบสถานะใหม่

| Field | ความหมายที่ต้องใช้ตรงกัน |
|---|---|
| `rhythmDamageCap?: number` | จำกัด **เฉพาะส่วน damage จาก rhythm** ต่อ hit ของการ์ดใบนี้ ไม่ลด rhythm ที่มี ไม่จำกัด gain และไม่จำกัด moveBonus/attackBonus/strength; undefined = กฎเดิม |
| `starterHeavy?: {maxStacks:number;perStack:number}` | ใช้ได้เมื่อ heavy=true; กิน `min(bruise,maxStacks)` ชั้น จ่ายโบนัส `consumed×perStack` เฉพาะ hit แรกครั้งแรก; ค่าสัมประสิทธิ์นี้แทน heavyPerBruise ของ passive เฉพาะใบนี้; ช้ำส่วนเกินยังอยู่; undefined = กินช้ำทั้งหมดด้วยกฎเดิม |
| `splashWaterCap?: number` | หลังจ่าย fixed mana cost แล้ว ใช้ `min(waterRemaining,cap)` หน่วย; ลดน้ำตามที่ใช้จริงและเก็บส่วนเกินไว้; undefined = สาดหมดขันแบบเดิม |
| `progressionRole` | ค่าเดียว `basic` หรือ `bridge` สำหรับ starter เพื่อบอก UI/กรอง pool; ไม่มีผล damage; ให้ทุก starter ในตารางมีค่า โดย basic = jab/low_kick/slant_elbow/muay_stance/bamboo_dart/cooling_cloth; ที่เหลือ bridge |
| build catalog | ตาราง ID ของแต่ละ build/slot ในส่วน5–6 อยู่ในไฟล์ balance/catalog กลาง; เป็นข้อมูลจัดร้าน ไม่มี passive ไม่มีสัญญาว่าระบบรู้ build ผู้เล่นแน่นอน |

ตรวจ field เป็นจำนวนจำกัด ไม่ติดลบ และใช้จำนวนเต็ม; ไม่ตีความ 0 ว่า undefined สำหรับ cap (cap0 จึงสาดไม่ได้) ค่าที่ไม่ถูกต้องให้ validator ปฏิเสธ data ใหม่ตั้งแต่โหลด pack

ลำดับนักมวย: จ่าย cost → `onAttackStart` สร้าง rhythm → `attackFx` ต่อจาก/ใช้จังหวะ → consume bruises ตามใบ → คำนวณ damage จาก rhythm หลัง spend แล้ว → applyFx แต่ละ hit → echo/repeat ตามกฎเดิม → `onAttackEnd` เพิ่มช้ำจากอุปกรณ์ตาม move. `doubleNext`/echo/repeat **ไม่กินช้ำรอบสอง** และยังต้องพก rhythmDamageCap ของต้นฉบับทุกครั้ง สำเนา borrowed/copied ต้องรักษา field เช่นเดียวกับ star

ให้ส่ง caps หรือ card definition ผ่าน `FxContext` อย่างชัดเจน อย่า lookup แค่ ID จนข้อมูลสำเนา/ไพ่ผสานหาย; `fighterAttackBonus` แยก `rhythmApplied` และ `moveBonus` ให้ UI/log ไม่คำนวณ `fighterBonus−rhythmRaw` เป็นค่าติดลบ หน้าไพ่ควรแสดง “จังหวะเพิ่มดาเมจได้สูงสุด2” และ “ใช้ช้ำสูงสุด2 ชั้น ชั้นละ2” พร้อม preview ผลจริง ไม่มีโบนัสหายเงียบ

หมอผี: `playBlock` ตรวจ available water → หัก fixed cost → `waterFx` ใช้น้ำตาม cap → รวม perStack กับ `starFx` → spell multiplier/เอฟเฟกต์อื่นตามเดิม `moveHint` ต้องแสดงน้ำที่จะใช้จริง (`min`) ไม่แสดงน้ำทั้งขัน รายการดาเมจอธิบายทั้งส่วน3×น้ำและโบนัสคงที่ตามดาว

ข้อสำคัญที่ยังอยู่: ยันต์ครบ5ถูกใช้ผนึกทันที จึงไม่อ้างว่า `yant_burst` จะได้สะสม10ชั้นตามปกติ; เมื่อมี4ชั้นมันทำดิบ24ก่อน modifier และต้องเลือกใช้ก่อนใบที่ทำให้ครบ5 การผนึกคืน2น้ำอาจช่วยคาถา แต่ starter needle1ชั้นไม่ได้เปิดเครื่องผนึกด้วยตัวเองอย่างเร็วอีกแล้ว

**อัปเกรดที่ไม่เปลี่ยนผล:** starterทุกใบในตารางมีผลเพิ่มจริง `canUpgrade` ของไพ่ที่ไม่ได้แก้ใน v1 ต้องเปรียบเทียบนิยามที่ resolve ตามดาวก่อน/หลัง โดยครอบคลุม effect, riposte, conditional, trigger และพารามิเตอร์ที่ engine รองรับจริง ไม่ใช่ผลจาก state ปัจจุบัน (ฮีลตอนเลือดเต็มหรือเกราะตอนยังไม่มีผีต้องไม่ทำให้ปิดการอัปที่เพิ่มผลได้จริง) ถ้าไม่เปลี่ยน ให้ปิดการอัปพร้อม “ใบนี้ไม่เพิ่มผลด้วยดาว” ห้ามเก็บเงินหรือกินหนึ่งสิทธิ์อัป เช่นอุปกรณ์ fxว่างและสาดขั้นสูงที่ไม่มี scaling ที่ใช้งานจริง ยังไม่สร้าง scaling ให้ทุกใบในงานนี้

## 5. หกเส้นทางที่ใช้ Common/Uncommon ได้จริง

นี่คือ **หกเส้นทางออกแบบที่ต้องพิสูจน์ viability** ด้วยการทดลอง ไม่ใช่ผลยืนยันว่าชนะแล้ว เลือกแกนขั้นต่ำสองใบที่ราคา20+20 หรือ20+35ได้จากร้านหนึ่งจุด; Rare/Legendary เป็นส่วนเสริม ไม่เป็นเงื่อนไขทำงาน ไม่ต้องมีครบทุกชื่อในแถว

| สาย | แกนขั้นต่ำที่หาซื้อได้ | สิ่งต่อยอดและวิธีชนะ | Starter ที่มีเหตุผลเก็บ / ตัวตัดก่อน |
|---|---|---|---|
| นักมวย: จังหวะหลายhit | `war_cry` + `threefold_strike` (40g) หรือ `triple_knee` แทนใบหลัง (55g) | เพิ่ม `double_hook`, `uppercut`, `spin_back_kick`; สร้างจังหวะด้วยท่าสลับแล้วให้หลายhitรับโบนัสเต็ม; `mongkhon` หรือ `call_pi` ช่วยคงจังหวะ; `shadow_flurry` เป็นโบนัสปลาย | เก็บ wai_khru/shin_block และท่าหนึ่งที่ขาด; ตัด jabหนึ่งใบและ muay_stanceส่วนเกิน |
| นักมวย: ช้ำแล้วปิด | `checking_knee` + `neck_kick` (40g) | `stare_down`, `double_hook` ป้อนช้ำ; `flying_knee` หรือ `clinch_knee` ต่อ; `glass_wraps` เพิ่มได้แต่ไม่จำเป็น; มี bruise≥3 แล้วเลือกคลุกวงในก่อนกินช้ำ | เก็บ straight_knee1; สลับ slant_elbow ออกเมื่อได้ heavyที่กินทั้งหมด; ตัด jab |
| นักมวย: รับแล้วสวน/ศิษย์ค่าย | `call_pupil` + `gate_watch` (40g) | `ward_riposte`, `bruise_guard`, `stand_firm`, `corner_towel`/`call_corner`; สมุนตีเมื่อมาถึงและท้ายตา สวนหลังรับ attackทั้งใบโดย HPไม่ลด; `yantra_shorts` ช่วยแต่ไม่จำเป็น | เก็บตั้งการ์ด1–2จนเครื่องตั้งรับพอ; ตัด jab/low_kick บางใบ; อย่าลงสมุนหวังรับแทนแล้วนับ riposte ว่าจะสำเร็จเสมอ |
| หมอผี: เติมน้ำ/สาดขั้นสูง | `lotus_dip` + `mouth_spray` (40g); สาดทั้งสนามใช้ `boil_water` แทนใบหลัง (55g) | `ghost_possession`, `flowing_chant`, `bronze_bowl`, `water_curtain`; บริหารน้ำระหว่างป้องกันกับปล่อยคาถา; `boil_water`12น้ำ = ดิบ36แบบsweep; `overflow_trough` เป็นปลายทางทางเลือก | เก็บ meditationหรือfill_bowl1–2รวมกันและ sprinkle; ตัด bambooและเปลี่ยน holy_water_splashเมื่อมีspenderดีแล้ว |
| หมอผี: ยันต์/ผนึก | `paper_yant` + `nail_coffin` หรือ `yant_burst` (55g) | `yant_ladle`, `threaded_needle`, `yantra_in_hand`, `sai_sin_bind`; สลับผนึกเพื่อหยุดไพ่กับใช้ยันต์3–4เพื่อโจมตี; `equipment_nang_tani_skull` เสริมได้ | เก็บ cursed_needle1และแหล่งน้ำ1; ตัด bambooก่อน; ไม่ตีความว่า seal=stunเสมอ เพราะมีไพ่ให้ผนึกจะทิ้งไพ่นั้น |
| หมอผี: ของเลี้ยงคุมสนาม | `spirit_feast` + `khwai_thanu_call` (55g) | `hun_payon_call`, `rak_yom_call`, `familiar_ward`, `spirit_rice_scatter`; สมุน2ช่องเป็นเครื่องดาเมจ/ป้องกันระหว่างเตรียมน้ำ; `golden_child_call` หรือ `hong_phrai_call` เพิ่มทีหลังได้ | เก็บfill_bowl/sprinkle; ตัดbambooและผ้าเย็นส่วนเกินเมื่อมี ward; ค่าarrivalต้องนับในตาที่ลงเสมอ |

ตัวอย่างคุ้มกว่าการอัป starter ไม่ใช่ตาราง DPS ที่ทดสอบแล้ว: `neck_kick`1ดาวดิบ8+rhythmเต็ม+ช้ำทั้งหมด ต่างจากศอกเริ่มที่กินได้2; `paper_yant`ป้อนยันต์2ตั้งแต่1ดาว ต่างจากneedle3ดาวที่ยัง1; `gate_watch`มีทั้งตั้งรับและสวนแทนเกราะอย่างเดียว ส่วน `flowing_chant`น้ำ4ตี18ให้จ่ายทรัพยากรที่มีค่า ไม่แจกฟรี

ตัวเสริมยังทำให้ starterบางใบดีขึ้นได้ เช่นเชือกชุบน้ำมันเพิ่มหมัด2 หรือglass_wrapsป้อนช้ำผ่านหมัด กฎ v1 ไม่ห้ามสิ่งนี้ เพราะการซื้อเสริมเพื่อเก็บ starter เป็นการสร้างเด็คเช่นกัน แต่ท่าหนักเริ่มไม่รับ heavyPerBruise3จากglass_wraps ข้อจำกัดต้องปรากฏบนใบ

## 6. ร้าน รางวัล การลบ และเงิน: สัญญาการเข้าถึง

### 6.1 ราคาและสิทธิ์ที่เลือกใช้

| รายการ | v1 ก่อน markup | หมายเหตุ |
|---|---:|---|
| Common / Uncommon / Rare / Legendary | 20 / 35 / 60 / 90 | ทุกการ์ดรวมอุปกรณ์; D4–5 ใช้ ceil(×1.25) =25/44/75/113 |
| สุ่มใหม่ร้าน | 10 | ได้1ครั้งต่อร้าน; เฉพาะช่องที่ยังไม่ซื้อ; ไม่เปลี่ยน focus build |
| ลบ ณ จุดลบหนึ่งแห่ง | ครั้งที่1ฟรี, ครั้งที่2=20, ครั้งที่3=35 | สูงสุด3ครั้งต่อ shopId; D4–5=0/25/44 |
| อัป ณ จุดอัปหนึ่งแห่ง | ครั้งที่1ฟรี, ครั้งที่2=30 | สูงสุด2ครั้งต่อ shopId; D4–5=0/38; ราคาไม่ขึ้นกับดาวเป้าหมาย |
| เลเวลอัป | คงการเลือกและอัปได้2ขั้นรวมตามเดิม | ไม่ต้องเลือกไพ่คนละใบถ้ากฎเดิมไม่บังคับ; ไม่ทำให้ดาวเกิน3; removeยังเป็น1ใบ |
| เงิน/ฮีล/พร | คง main | ไม่เพิ่มรายได้เพื่อชดเชยค่าร้านแบบมองไม่เห็น |

current source รายได้จริง: เริ่ม50; normal = `Math.round(GOLD_BY_TIER×0.5)` จึง T1/T2/T3/T4/T5 =5/6/8/10/13; elite25; boss40 ไม่ใช่ normal10–25 และไม่ใช่ boss100 คงรายการนี้ใน v1

งบ conservative ตลอดรัน D1: เริ่ม50 + คืน1 normal7×อย่างต่ำ5 + boss40 + คืน2 normal9×อย่างต่ำ6 + elite25 + boss40 + คืน3 normal8×อย่างต่ำ8 + elite2×25 + boss40 = **498g** โดยยังไม่นับโบนัสสนทนา/เหตุการณ์/skipเลเวล และยังไม่หักบริการ; ที่ใช้ได้ก่อนfinalbossต้องไม่รวมรางวัลboss40สุดท้าย จึง458gในสมมติฐานต่ำนี้. ไม่รับประกันรายได้จากtierในทุก routefallback; ให้ ledgerจริงเป็นตัวตัดสินการซื้อ

ตัวอย่างก่อนร้านแรกหลังชนะ T1 =55g: D1 ซื้อCommon+Uncommon=55ได้ หรือCommon2ใบ=40แล้วเหลือ15; D4–5 ซื้อCommon2ใบ=50ได้และเหลือ5 จึงไม่กำหนดให้ starterสองสายต้องซื้อ U จึงจะออกจากคืน1ได้ รันที่เลือกฮีล/พร/อัปมากอาจซื้อได้ลดลง เป็น trade-off ที่ตั้งใจ

ตัวอย่างงบสร้างเด็คทั้งรัน: ซื้อC3ใบ+U3ใบ=165, อุปกรณ์U1=35, ลบแบบเสียเงิน2ครั้งระดับ20=40, อัปเสียเงิน1ครั้ง30, ฮีล25+35=60 รวม330gก่อนmarkup เหลืองบแต่ไม่ได้หมายความว่าซื้อทั้งหมดได้ตั้งแต่ร้านแรก D4ชุดเดียวกันราคารวม415gและฮีลให้ผลน้อยลง; ไม่ใช้ชุดนี้เป็นสิ่งที่ผู้เล่นต้องทำทุกครั้ง

เป้าหมายสำรับท้ายรันที่พบได้ตามธรรมชาติ: รับ/ซื้อใหม่รวม6–9ใบ ลบ3–5ใบ เหลือประมาณ11–16ใบ; starterเชื่อมเหลือ2–4ใบได้ นี่เป็นช่วงสังเกต ไม่ใช่โควตา ระบบไม่เติม/ลบไพ่ให้ครบอัตโนมัติ

### 6.2 ร้านคืนละหนึ่งแห่ง: 4 ช่องคงบทบาท

ตัดสินใจปรับละเอียดจากร่างก่อน: ไม่ล็อกเป็น class3+equipment1 เพราะไม่ควรยัดอุปกรณ์ให้ทุก build; เปลี่ยน stockของmainจาก class2+equipment1 เป็น4ช่อง: **replacement, engine, payoff, support** ช่องขายไพ่ไม่ซ้ำIDภายในร้าน ไม่มีการบังคับให้ช่องsupportเป็นอุปกรณ์ทุกครั้ง (ช่องอุปกรณ์ฐานมีเพียง1, ไม่ควรถมทุกคืน)

ก่อนสุ่มทุกช่อง ใช้ `poolFor(classId,milestoneLevel)` จริง กรอง locked, unlockAt, curse, borrowed, และ starterที่มีprogressionRoleออก; สร้างการ์ด1ดาว ไม่ใช้บทบาทไปปลดล็อกใบพิเศษ

- replacement: C/Uที่ไม่เป็นequipment, ให้Commonก่อนด้วยน้ำหนัก C80/U20; คืน1–3เหมือนกัน; เป็นตัวแทนโจมตี/ป้องกันที่ดีกว่าstarterทันที
- engine: จากengine listของfocus build; ต้องมีหนึ่งCommonที่ถูกกฎหมายถ้ามีในcatalog เลือกCommonเท่านั้นก่อน จากนั้นค่อยfallbackตามขั้นข้างล่าง จึงมีตัวปูทางราคา20ทุกคืน
- payoff: payoff listเดียวกับengine; C/Uเท่านั้น คืน1น้ำหนักC60/U40, คืน2–3 C35/U65; ตั้งใจให้แกนหลักไม่ถูกrareแย่งช่อง
- support: support listของfocus ก่อน แล้วกลุ่มอื่นของคลาสได้; rarity weightsคืน1 C65/U35/R0/L0, คืน2 C35/U45/R20/L0, คืน3 C25/U45/R25/L5

**Focus ไม่ใช่ build lock:** ร้านแรกสุ่ม1ใน3สายของคลาสเท่ากันด้วยseedร้าน ร้านคืนถัดไปนับdistinct IDที่ผู้เล่นมีจากengine/payoff catalogของแต่ละสาย โดยstarterไม่นับและซ้ำสำเนาไม่นับเพิ่ม; หากคะแนนสูงสุด>0 เลือกสายคะแนนสูงสุด โอกาสเสมอใช้seed; หากไม่มีคะแนน เลือกสายที่ยังไม่เคยfocusก่อนหรือสุ่มถ้าครบแล้ว ช่องreplacementยังเปิดทางอื่นเสมอ ไม่ใส่ปุ่มเลือกสายเพิ่มในv1

Catalog ที่ต้องใส่ (IDในลิสต์ไม่ต้องสร้างใหม่):

| สาย | engine | payoff | support |
|---|---|---|---|
| warrior rhythm | `war_cry`, `measured_breath`, `iron_will` | `threefold_strike`, `double_hook`, `triple_knee`, `uppercut` | `mongkhon`, `call_pi`, `oiled_wraps`, `guarding_elbow`, `shadow_flurry` |
| warrior bruise | `checking_knee`, `short_hook`, `stare_down`, `double_hook` | `neck_kick`, `flying_knee`, `clinch_knee`, `reverse_elbow` | `parry_bait`, `bruise_guard`, `glass_wraps`, `last_bell_elbow` |
| warrior guard | `call_pupil`, `corner_towel`, `call_corner` | `gate_watch`, `ward_riposte`, `bruise_guard`, `stand_firm` | `yantra_shorts`, `arm_prajiad`, `holy_water_spray`, `call_senior`, `call_old_master` |
| shaman water | `lotus_dip`, `yant_ladle`, `ghost_possession` | `mouth_spray`, `boil_water`, `flowing_chant`, `full_bowl` | `bronze_bowl`, `water_curtain`, `equipment_shaman_staff`, `cleansing_bath`, `overflow_trough` |
| shaman yant | `paper_yant`, `yant_ladle`, `threaded_needle` | `nail_coffin`, `yant_burst`, `yantra_snare` | `yantra_in_hand`, `sai_sin_bind`, `sai_sin`, `equipment_nang_tani_skull`, `red_yant_cloth` |
| shaman familiar | `spirit_feast`, `familiar_ward`, `read_omen` | `khwai_thanu_call`, `hun_payon_call`, `rak_yom_call` | `spirit_rice_scatter`, `water_bowl_guard`, `golden_child_call`, `hong_phrai_call`, `bone_rosary` |

replacement allowlist: warrior=`straight_punch,push_kick,guarding_elbow,checking_knee,neck_kick,gate_watch,ward_riposte,corner_towel`; shaman=`lotus_dip,bamboo_volley,rice_throw,ghost_debt,mouth_spray,yantra_in_hand,familiar_ward,curse_chant` ทั้งหมดตรวจผ่านpoolจริงอีกครั้ง ชื่อที่อยู่ทั้งengine/payoffกับreplacementยังห้ามซ้ำภายในร้าน ให้สุ่ม engine→payoff→replacement→support เพื่อรักษาคู่แกนก่อน แล้วแสดงตามลำดับช่องปกติ

Fallbackทุกครั้งต้อง deterministic และไม่เปิดrarityที่ช่องห้าม: (1) legalตามrole+focus+rarityที่สุ่ม (2) legalตามrole+focusในrarityอื่นที่ช่องเปิด เรียงC,U,R,L (3) roleเดียวกันทุกสายของคลาส (4) replacementallowlistที่ถูกกฎหมายและยังไม่ซ้ำ (5) poolคลาสที่ไม่ใช่starterและผ่านrarity/typeของช่อง (6) ปล่อยช่องว่างและtelemetry `shop_pool_exhausted`. ไม่เอาlockedหรือstarterมาเติมเงียบ เมื่อ fallbackข้ามrole ให้ UIไม่เรียกมันว่าเป็นpayoffที่รับประกัน และlogเหตุผล; production dataปัจจุบันควรมีครบ4ช่อง100%ของseedที่ทดสอบ

น้ำหนักให้ใช้เฉพาะrarityที่มีcandidateจริง ไม่สุ่มrarityที่ว่างแล้ววนไม่จบ การสุ่มทุกครั้งต้อง advance RNG อย่างกำหนดได้ ไม่ใช้Math.random. ห้าม rerollfocusหรือstockตอนเปิดร้านซ้ำ ให้บันทึกfocus+offerIDs+ราคา+soldSlots+rerollUsed เมื่อเข้าร้านครั้งแรกและใช้snapshotเดิมต่อ

### 6.3 ช่วงที่บริการพร้อมใช้

ต้องเปลี่ยนจากการเฉลี่ยตำแหน่งในลิสต์servicesตามลำดับเดิม เป็น `availableAfterWins` ต่อคืน; count = monster route winsรวมelite ไม่รวมboss. การเข้าร้าน/กดข้ามไม่เปลี่ยนcount

| บริการ | คืน1 | คืน2/3 |
|---|---:|---:|
| ร้านไพ่ | หลังชนะ1 | เริ่มคืน (0) |
| พร | 2 | 2 |
| ลบ | 3 | 3 |
| อัป | 4 | 5 |
| น้ำ/ฮีล | 5 | 6 |
| storyบังคับ | 6 | 7 |
| chestถ้าสุ่มมี | 6 หลังstoryเข้าคิว | 8 |

รักษาboard3ช่องและshopIdถาวรของคืน เมื่อปิดfightที่ถึงเกณฑ์ ให้บริการที่เพิ่งถึงเกณฑ์เข้าช่องที่ว่างนั้นก่อนmonsterถัดไป ถ้ามีหลายบริการถึงพร้อมกัน ใช้ลำดับในตารางเข้าคิว; ไม่ทับบริการที่ผู้เล่นเก็บไว้ ไม่ลบร้านเพราะจบไฟต์ถัดไป และไม่บังคับให้ใช้บริการ. ตอนเริ่มคืน2/3ใส่ร้านหนึ่งช่องและmonsterสองช่อง. บริการที่ยังไม่ถึงเกณฑ์ต้องไม่ถูกfillSlotดึงมาก่อน; pending serviceคิวแรกถูกเปิดเมื่อมีช่องว่างถัดไป

คำว่า “รับประกันร้าน” จึงหมายถึง**มีโอกาสเข้าถึง**ตามthreshold ไม่ใช่รับประกันผู้เล่นเข้าซื้อหรือมีเงินพอ; ผู้เล่นยังปิด/ข้ามได้. คงboss gateให้storyผ่านและfightquotaครบ; การจัดคิวต้องไม่ทำให้ติดสามบริการที่ปิดไม่ได้. ปุ่มออกจากร้านกลับแผนที่ยังเก็บของไว้ ส่วนการdismissจุดบริการคือยอมทิ้งสิทธิ์ที่เหลืออย่างชัดเจนตามUIเดิม

### 6.4 รางวัลและการกันลูป

คงโครงlane/ความถี่elite,boss,levelrewardเดิม แต่ใช้ตัวกรองstarterเช่นร้านกับรางวัลการ์ดทั่วไป เพื่อไม่ขายความคืบหน้าด้วยการยัดไพ่พื้นฐานกลับมา Rare/Legendaryของรางวัลยังตามน้ำหนักเดิมได้; ร้านมีหน้าที่เสนอสองชิ้นที่เข้ากันและซื้อเมื่อพร้อม ไม่บังคับย้ายไพ่ดีทั้งหมดเข้าร้าน

ทุกการซื้อ/ลบ/อัปต้องเป็นtransactionที่ตรวจ phase, shopId, instanceId,จำนวนใช้,เงินและtargetก่อนหักเงิน; successแล้วบันทึกcounterและsnapshotพร้อมกัน. `shopBoughtItems.length` อย่างเดียวไม่เป็นแหล่งความจริงสำหรับบริการฟรี ให้ใช้ `serviceStates[shopId]` ที่persist `removeUsed,upgradeUsed,rerollUsed,soldSlots` ชัดเจน; leave/reenter/load ไม่reset. rerollเปลี่ยนเฉพาะช่องที่ยังไม่ซื้อและได้ครั้งเดียว ไม่เติมช่องที่ขายแล้วเพื่อวนซื้อไม่จำกัด

คงการลบขั้นต่ำแบบเดิม (`deckSize>1`, ห้ามunremovable/qa card) ไม่ตั้งminimumdeckสูงเพื่อกลบปัญหาลูป เลเวลลบยังต้องใช้validatorเดียวกับร้าน ไม่มีrefundจากลบ ไม่มีsellback. `limit:'turn'` ของmeditationบังคับต่อIDรวมทุกสำเนาและcopied; คงfxDrawPerTurn2; echoไม่echoตนเอง; copyไม่copycopy; สาดไม่มีdrawและmeditationไม่มีdrawในv1. บางเด็คเล็กวนจั่วได้คือผลของการลงทุนลบ แต่ทุกตาต้องมีขอบเขตการจั่ว/การกระทำสิ้นสุด ไม่มีแหล่งคืนdraw+APไม่จำกัด

## 7. HP: ต่ำตอนต้น มีแรงกดดันกลาง/ท้ายโดยไม่ทำทุกไฟต์ยืด

ค่าต่อไปนี้ **แทน**สูตร HPปัจจุบันใน `configureNightEnemy` สำหรับrulesetใหม่ ไม่คูณ `ENEMY_HP.night` หรือ `ENEMY_DEPTH.hpPct` เดิมซ้ำ หลังคำนวณให้ตั้งhp=maxHpครั้งเดียวก่อนbattle rulesที่ไม่เปลี่ยนHP; ถ้ามีphaseหรือhealภายหลังให้เป็นกลไกเดิมและบันทึกแยก

ให้ `d = min(fightsWon, routeFightQuota−1)` เป็นdepthขณะเริ่มfight, `t = clamp(parseRosterTier,1,5)` สำหรับnormal (roster Elite/Bossที่ถูกจัดเป็นnormalใช้t=5); encounter normal/elite/bossใช้ **offer** ไม่ใช่ชื่อtierในfolklore. `M=1`เมื่อdifficulty1, `M=1.15`เมื่อdifficulty2–5; ไม่เพิ่ม15%ซ้ำทุกระดับ. RoundแบบJavaScript Math.roundเมื่อสุดท้ายเท่านั้น

| Encounter | สูตรHPก่อนM |
|---|---|
| normal คืน1 | `14 + 2×(t−1) + 2×d` |
| normal คืน2 | `35 + 2×(t−2) + 2×d` |
| normal คืน3 | `58 + 3×(t−3) + 3×d` |
| elite คืน1 (สำรอง; routeปัจจุบันไม่มี) | `32 + 2×d` |
| elite คืน2 | `62 + 2×d` |
| elite คืน3 | `90 + 2×d` |
| boss คืน1 `night-head-collector` | 48 |
| boss คืน2 `night-bell-keeper` | 100 |
| bossคืน3ตามalignmentทุกID | 180 |
| `phi-kin-hua` ในencounterboss/ultimate | 240 |

ตัวอย่างเทียบHPจริงบนD1 (HPnominal ไม่ใช่effectiveHP):

| จุดอ้างอิง | mainเดิม | v1 D1 | v1 D2–5 |
|---|---:|---:|---:|
| N1 normal T1,d0 | 23 | 14 | 16 |
| N1 normal T1,d1 | 24 | 16 | 18 |
| N1 normal T3,d6 | 38 | 30 | 35 |
| N2 normal T2,d0 | 35 | 35 | 40 |
| N2 normal T4,d7 | 62 | 53 | 61 |
| N2 elite,d9 | 79 | 80 | 92 |
| N3 normal T3,d0 | 61 | 58 | 67 |
| N3 normal T5,d7 | 107 | 85 | 98 |
| N3 elite,d8 / d9 | 124 / 130 | 106 / 108 | 122 / 124 |
| N1 boss | 54 | 48 | 55 |
| N2 boss | 101 | 100 | 115 |
| N3 bossไม่ใช่ผีกินหัว | 194 | 180 | 207 |
| ผีกินหัว | 284 | 240 | 276 |

นี่ไม่ใช่สูตรลดHPทุกตัวให้ชดเชยการตีอ่อนลงตลอดรัน: ช่องว่างพลังระหว่างstarterกับเด็คที่สร้างใหม่ต้องมาจากการ์ดที่รับระบบอาชีพได้คุ้มขึ้น ขณะที่HPกลาง/ท้ายยังบังคับให้ใช้ระบบนั้น การเพิ่มHPท้ายสูงกว่านี้ก่อนตรวจdraw2มีความเสี่ยงทำ30ไฟต์เกินหนึ่งชั่วโมง

**effectiveHP** ให้เก็บ HPที่ผีฟื้นจริง, blockที่ผู้เล่นต้องเจาะ,ดาเมจที่สมุนtauntรับแทน, phase shield/negation และinvulnerability time แยกจากHPตาราง ไม่บวกHPสมุนทุกตัวเป็นHPบอสตรงๆ เพราะsweepโดนหลายเป้าหมายพร้อมกัน. ถ้าบอสคืน2ยืดจากคำสาป/บริวารต้องแก้ตัวก่อปัญหาหลังการทดลอง ไม่ลดหรือเพิ่มทั้งrosterจากค่าเฉลี่ยรวม

## 8. เซฟในต้นแบบนี้

เกมไม่รองรับการต่อรันจากเซฟก่อนเปลี่ยนบาลานซ์ตามคำสั่งเจ้าของเกม ไม่เพิ่ม `progressionVersion`, ไม่ normalize ไพ่ที่ผู้เล่นถืออยู่ และไม่ทำ migration เมื่อโหลดข้อมูลเก่า ให้ผู้เล่นเริ่มรันใหม่บนชุดการ์ดนี้ การตั้งค่าและข้อมูลปลดล็อกถาวรยังคงอยู่ตามระบบเดิม

## 9. การพิสูจน์: แยก progression จาก AI และจากเงินที่เพิ่มเอง

### 9.1 เงื่อนไขการทดลอง

ใช้snapshotmainข้างต้นเป็นcontrol และcandidate; enemyAI/decks/damage/hand/draw/APเหมือนกันทั้งสองฝั่ง. ก่อนวัดให้ทำpilotเข้าใจstartercaps,น้ำที่เหลือ,bruiseที่เหลือ,shopbudgetและการซื้อแกน มิฉะนั้นจะวัดความไม่รู้ของpilotแทนคุณภาพระบบ. รายงานผลจากpilotแยกผู้เล่นจริง ไม่อ้างเท่ากัน

ชุดtuningขั้นต่ำ 100seedsต่อclass×difficulty1/3/5; holdoutอีก100seedsที่ไม่เคยใช้จูน. รอบfinal gate100seedsต่อclass×difficulty1–5. ใช้ seedlists ที่commitพร้อมreport. RNGเส้นทาง/ร้าน/ต่อสู้ควรแยกstreamที่labelด้วยrunseed,night,encounterIdเพื่อไม่ให้การเพิ่มการสุ่มร้านเลื่อนผีทั้งรัน; ถ้ายังใช้streamเดียว ให้record/replayencounterIDs+orderและinitialbattleRNGสำหรับlocal paired fightก่อน ห้ามเรียกคู่รันที่เส้นทางต่างกันว่าcontrolledpaired

ทำ4policyในcandidateบนseed/encounterเดียวกัน:

1. **Build**: ซื้อ/รับแกนเข้ากันและใช้สิทธิ์ลบตามงบจริง
2. **Starter-only**: ไม่รับการ์ดใหม่แต่ใช้ฟรี/เงินอัปstarter; งบและทรัพยากรอื่นตามledgerจริง ไม่อัป3ดาวทุกใบฟรี
3. **Build-no-remove**: acquisitionsเดียวกับBuildแต่ไม่ลบ บันทึกเงินที่เหลือ ไม่ใช้ไปซื้อเพิ่มในการทดลองแยกผลdraw
4. **Local fully-upgraded starter**: สถานะทดสอบเฉพาะไฟต์ จัดstarter10ใบทุกใบ3ดาวเพื่อดูเพดาน; labelว่าsyntheticไม่ใช่รันที่ซื้อได้จริง; เทียบเด็คbuildที่เข้าถึงได้จริง ณ checkpointกับHP/maxAP/blessings/equipmentและbattleRNGเดียวกัน

แยก paired effects: starter+HPก่อนร้านที่ต้นรัน; shop/คัดไพ่ที่checkpointกลาง; removalโดยfix acquisitions; AIภายหลังคนละbranch/flag. Full-runเปรียบเทียบยังรายงาน death/progressionเสียก่อนnight3ด้วย ไม่ดูเฉพาะsurvivorsแล้วสรุปว่าlateเร็วขึ้น

### 9.2 เกณฑ์รับ prototype ก่อนจูนต่อ

ตัวเลขนี้เป็น **acceptance targets** ไม่ใช่ผลทดลองที่ผ่านมา

| ประเด็น | เกณฑ์ candidate D1 / วิธีวัด |
|---|---|
| ไฟต์1–2 | แต่ละคลาสmedian playerturns-to-kill2–3, ≥65%จบใน2–3ตา, p90≤4; ชนะ≥95%; one-turn≤20% |
| Normalหลังจากนั้น | N1median≤4; N2median3–4,p90≤6; N3median3–5,p90≤7 สำหรับBuildpolicy; รายงานแยกID |
| Elite/boss | elitemedian≤6; bossmedian4–7,p90≤9; เกิน10ตาให้ดูrage,taunt,healก่อนปรับHPรวม |
| Starterไม่ใช่แผนท้ายที่เท่ากัน | synthetic3-starstarterที่checkpointN3มีmedianTTKอย่างน้อย1.5×Buildหรือfailureเพิ่ม≥20จุดเปอร์เซ็นต์; Buildต้องผ่านจังหวะไฟต์ข้างบนเองด้วย ไม่ใช้ทั้งคู่แพ้เป็นหลักฐานสำเร็จ |
| Buildไม่ต้องrare | C/U-onlyของทั้ง6สายต้องผ่านN2boss≥70%,จบรันD1≥50%บนholdoutตามงบจริง; ไม่มีrare/legendary/speciallockedในpolicyนี้; ถ้าไม่ถึงต้องจูนcoreก่อนบอกviable |
| Removalมีผล | BuildเทียบBuild-no-removeโดยfixการ์ดที่รับ: จำนวนใบที่เข้าถึงก่อนเจอแกนแรก medianลด≥15%ในN2–3 และอย่างน้อยหนึ่งในTTK/HP lossดีขึ้น; รายงานdecksizeและvariance ไม่ตีความเลข%นี้ว่าความน่าจะเป็นจั่วสูตรเดิมทุกสถานการณ์ |
| ร้านทำงาน | legal4ช่องครบ100%ในcatalogปัจจุบัน; engine+payoffสายเดียวกัน≥95%หลังunlockfilter; D1ร้านแรกมีคู่C/Uรวม≤55อย่างน้อยหนึ่งคู่ใน≥95%seeds; D4ร้านแรกมีCommonพร้อมซื้ออย่างน้อย1ใบ100% |
| ไม่เสี่ยงดวงrare | หกสายทดสอบผ่านด้วยstarter+common/uncommonที่ระบุ; ไม่มีseedที่ระบบบังคับซื้อrareเพื่อออกจากคืน1 |
| การไต่difficulty | แสดงclass×Dทั้งหมด; ไม่บังคับD5ต้นเกม2–3ตาเพราะไม่มีopeningbonus; winrateควรลดโดยรวมตามระดับพร้อมCI; ความสลับเล็กน้อยในsampleไม่ใช่เหตุให้รีบเพิ่มdamageทุกตัว |
| ความยาวรัน | playtestD1ของผู้เล่นเข้าใจกฎ median45–65นาที, p90≤80 ไม่รวมพัก/อ่านสมุด; แยกcombatเวลา/เลือกการ์ด/ร้าน; เป้า60นาทีไม่อนุมานจากจำนวนturnsอย่างเดียว |

ความเสี่ยงที่ต้องแสดงตรงๆ: นักมวยเปิด3ใบมีwai_khruบังคับ1ใบ อีก2ใบมีโอกาสไม่มีattack = C(4,2)/C(9,2)=16.7%ก่อนเอฟเฟกต์อื่น; D5เปิดเหลือ2ใบจึงเป็น4/9=44.4%. นี่คือ **ไม่มีattackตอนเปิด** ไม่ใช่ไม่มีใบเล่นหรือdeadturnแน่นอน. หมอผีมีattack4+splash1 แต่splashต้องมีน้ำ; ให้เก็บ usableoffense ณ stateจริงด้วย. ห้ามลดHPต่ำจนแก้medianแล้วดีลเปิดสวยฆ่าผีหมดในตา1; ถ้าไม่ผ่านให้ตรวจการกระจายstarter/innateเป็นงานจูนเฉพาะถัดไป ไม่เพิ่มglobaldraw/APทันที

Telemetryขั้นต่ำ: turnsผู้เล่น/ผีจริง, damageดิบ→modifier→block→HPlossแยกcard/minion/status/reflect,overkill,healระหว่างไฟต์แยกหลังไฟต์/levelheal,HPtauntที่รับแทน,พฤติกรรมphase,drawจำนวน/FXcapที่ชน,AP/น้ำใช้และเหลือ,seal/stunจากseal,จังหวะจริงและโบนัสที่apply,bruiseก่อน/ใช้/เหลือ,card acquisition/removal/upgradeและcost,สิทธิ์บริการ,decksizeและต้นกำเนิดinstance,hold/discardและreason. รายงานaverage/median/p90/winrateพร้อมจำนวนตัวอย่างและ95%CI; อย่าซ่อนtimeoutหรือdeathในค่าTTK

Meaningful regression testsที่จำเป็น: capsในhit/echo/copy,staroverrideคงstatus,watercapหักจริง+display,eligibilitylocked,shopreentry/load,transactionซ้ำ,rerollไม่เติมsoldslot,removeเงินไม่พอ/ใบหาย,sharedlimitต่อID,drawcapและหนึ่งตาสิ้นสุด. ไม่ต้องเขียนtestที่แค่snapshotข้อความทั้งเอกสาร

## 10. AI/retention เป็นงานถัดไปหลัง progressionนิ่ง

ยังไม่เพิ่มmaxhand/draw/APในงานนี้ งานAIเริ่มเมื่อcandidateprogressionผ่านเกณฑ์ต้นเกม/ร้าน/กลไกแล้ว ใช้เด็ค/HP/ราคาชุดเดียวกันทั้งฝั่งAIเดิมและAIใหม่

1. เพิ่มreasoncodeในenemyPlanว่าเล่นตอนนี้/เก็บชาร์จ/รอsetup/รอทรัพยากร/ป้องกันไม่คุ้ม/ไม่มีtarget และมองเฉพาะข้อมูลที่ศัตรูมีสิทธิ์รู้ ไม่อ่านลำดับจั่วลับของผู้เล่น
2. ใช้ผี3ตัวแทนจากrosterจริง: ผีต้นเกมตีเร็ว1ตัว,ตัวcharge/setup1ตัว,`night-bell-keeper`ตัวcurse/minion1ตัว เลือกIDต้นเกมหลังดูtelemetryที่ได้จริง ไม่เพิ่มไพ่ทุกตัวพร้อมกัน
3. ประเมินเล่นทันทีเทียบเก็บหนึ่งตาโดยคำนึงถึงความเสี่ยงตายก่อนใช้,handcap,chargecap3,มีsetupจริงหรือไม่,taunt/minionช่องเต็ม,การป้องกัน/ฮีลเกินจำเป็น. ไม่ตั้งquotaว่าแต่ละผีต้องhold1ใบ
4. ตาเก็บต้องมีสัญญาณที่ผู้เล่นอ่านได้จากcardback/chargeเดิม; ถ้าปล่อยในตาถัดไปแล้วเกิดburstเกินเกณฑ์ให้แก้การเลือก/ไพ่เฉพาะก่อนเพิ่มเครื่องป้องกันให้ทุกเด็ค
5. Gate: paired seedsบนstateเดียวกันต้องเพิ่มอัตราchargeที่เก็บแล้วได้ใช้มีผลจริง ลดheal/blockที่สูญเปล่า โดยTTKnormalไม่เกินbudgetส่วน9 และp95incomingburstไม่เพิ่มเกิน20%โดยไม่มีcounterplay; winrateลดจากAIมากกว่า10จุดให้หยุดทบทวนเฉพาะผีก่อนขยาย. รายงานholdingทั้งจำนวนครั้งและผลลัพธ์ ไม่ใช้จำนวนholdเป็นคะแนนความฉลาด

ถ้าหมายถึงretentionผู้เล่นระยะยาว ให้เก็บเหตุผลตาย,สัดส่วนซื้อไพ่,ไพ่ที่ลบบ่อย,buildที่จบรัน,เวลารัน และอัตรากลับมาเริ่มรันใหม่หลังจบก่อนเพิ่มระบบmetaใหม่. งานนี้ยังไม่เพิ่มรางวัลรายวันหรือความก้าวหน้าถาวรที่บังคับgrind

## 11. Handoffให้ Sol: ลำดับงานและไฟล์

| ลำดับ | ขอบเขตที่ทำ | ไฟล์หลักและเงื่อนไขจบ |
|---|---|---|
| 0 | ตรึง main และเริ่มรันใหม่ | สร้าง branch จาก main, ตรวจ class starter 10 ใบต่ออาชีพ; ไม่ทำ migration เซฟรันเก่า |
| 1 | กลไกcap+starter+ข้อความ | `src/data/packs/base/class_cards.json`, `src/core/classes.ts`, `src/core/cards/model.ts`, `fighter.ts`, `water.ts`, `play.ts`, `fx.ts`, `describe.ts`, `src/core/engine/shared.ts`; preview/engine/pilotอ่านresolverเดียว; 10ใบจริงต่อคลาส |
| 2 | ร้าน/บริการ/ledgerและรางวัล | `src/core/shop.ts`, `src/core/pack.ts`, `src/core/balance/economy.ts`, `src/core/engine/handlers/shops_events.ts`, `map_pages.ts`, `src/core/map/adventure.ts`, `src/core/shopRegistry.ts`, `src/core/campaign/rewards.ts`, `src/core/reward.ts`; เพิ่มcatalogใหม่เช่น`src/core/balance/deckProgression.ts`; UIร้านอ้างราคา/จำนวนใช้จากengine |
| 3 | HPกติกาใหม่และtelemetry | `src/core/campaign/nights.ts`, `src/core/balance/notfm.ts`, `src/core/campaign/metrics.ts`, `src/core/combat/damage.ts`; formulaใหม่ไม่คูณเก่า; สมุนarrival/AIคงเดิม |
| 4 | Pairedrun+ปรับเฉพาะที่ไม่ผ่าน | `scripts/pilot.ts`, `scripts/balance.ts`, testsและreportใน`docs/`; บันทึกseed/config/hash,งบเงินจริง,ทั้ง6สาย; ไม่เรียกผลนี้ผลAI |
| 5 | มือถือและreleasegate | ตรวจหน้าstarter/shop/upgrade/removal,อ่านcapชัด,เริ่มรันใหม่,ความยาวรันจริง; ทำbuildเมื่อเจ้าของสั่งimplementation/release ไม่ใช่ในงานdesignนี้ |
| 6 | งานAIแยก | `src/core/combat/enemyPlan.ts`, `enemyHand.ts`, `ghostMechanics.ts`, `enemyCardEffects.ts`, `src/core/campaign/enemyDecks.ts`, `src/data/packs/base/enemy_cards.json`; ตรึงprogressionและแยกflag/report |

ห้ามสรุปงานด้วย “ปรับstarterเบาลงและเพิ่มHPแล้ว” โดยข้ามร้านกับงบ เพราะแกนงานนี้คือการเปลี่ยนเด็คที่เกิดขึ้นได้จริงระหว่างรัน. ค่าที่ล็อกในเอกสารนี้เพียงพอให้สร้างprototype1ได้โดยไม่ต้องถามเลือกระหว่างหลายแบบอีก แต่การรับรองว่าบาลานซ์ดีต้องรอผลส่วน9และการเล่นจริง
