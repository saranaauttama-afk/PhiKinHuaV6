# Art direction — ผีกินหัว

ยึดการ์ตูนผีเล่มละบาทยุค 1980–1990: เส้นหมึกดำหนาและไม่สม่ำเสมอ สีหม่น 4–5 สีต่อภาพ เงาเป็นปื้น รอยเม็ดพิมพ์และสีเหลื่อมเล็กน้อย เสื้อผ้าชาวบ้านเรียบ รูปทรงชัดเมื่อย่อบนมือถือ

- ตัวละคร ผี บอส และไอคอนต้องเป็น PNG พื้นโปร่งจริง ไม่มีฉากหลังหรือวงแสง
- ฉากหลังเป็นภาพเต็มจอตามสัดส่วนของ catalog และเว้นพื้นที่วาง UI
- แต่ละ class ต้องจำได้จากรูปทรง: หมอผีเสื้อครามกับถุงสมุนไพร, นักรบวัดท่ากว้างกับไม้เรียบ, แม่ชีชุดขาวเรียบ, คนทรงเสื้อสีม่วงหม่น
- Reference ภาพใช้คุมวิธีลงหมึกและสีเท่านั้น อย่าคัดลอกหน้า เสื้อผ้า ท่า หรืออุปกรณ์ไปทุกตัว
- ตัดภาพแนว concept art, แสง cinematic, เครื่องรางเกินจำเป็น และ costume หรูออก

## รอบแรก

เพิ่ม `assets/monsters/{phi-pop,nang-tanee,phi-nang-ram,phi-pong-kang}.png`, `assets/classes/{shaman,warrior,nun,medium}.png` และ `assets/scence/{rest,boss}.jpg` แล้วผูกไว้ใน `ART_SOURCES`. ภาพสร้างด้วย built-in imagegen; ตรวจ alpha และย่อเป็นขนาดตาม catalog ก่อนนำเข้า

## Prompt หลัก

rough hand-drawn Thai one-baht horror comic print from the late 1980s to 1990s, expressive heavy uneven black ink outlines, flat fills in 4 to 5 faded colors, visible coarse halftone dots and slight print misregistration, simple local clothing and readable silhouettes, no cinematic lighting, no ornate fantasy details, no text, no watermark, no signature. For isolated sprites: genuinely transparent PNG, no background or halo. For each subject: name a distinct simple silhouette and outfit, avoid repeating visual details from the reference. Avoid painterly concept art, cinematic lighting, ornate fantasy costume, smooth gradients, text, watermark.

คำสั่งแยกรายช่องสร้างได้ด้วย `npm run art:prompts`; ให้เติมคำบรรยายเฉพาะตัวในช่องที่ glossary ยังไม่รู้จักก่อนสร้าง.
