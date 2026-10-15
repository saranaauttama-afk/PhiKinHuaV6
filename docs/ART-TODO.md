# ภาพที่ยังขาดทั้งหมด (15 ต.ค. 2026) — ส่งให้ GPT ทีเดียว

Branch: `work/mor-phi-nam-mon` · ตรวจแล้ว: ผีทุกตัวมีภาพเหมือนแล้ว · การ์ดนักมวยครบแล้ว · ฉาก/เหตุการณ์/บท/พรต่อสายภาพไว้แล้วใน `app/components/Art.tsx`
(`docs/art-checklist.md` ยังขึ้น ⬜ หลายช่อง แต่เป็นชื่อไฟล์ .png รุ่นเก่า — ช่องพวกนั้นใช้ภาพ thai-v24 อยู่แล้ว ไม่ต้องทำ)

| กลุ่ม | จำนวน | prompt อยู่ที่ | บันทึกที่ |
|---|---|---|---|
| การ์ดหมอผีใหม่ | 33 | `docs/mor-phi/ART-PROMPTS.md` | `assets/cards/thai-v24/<id>.webp` |
| ของเลี้ยงหมอผี (มินเนียนเรา) | 5 | `docs/mor-phi/ART-PROMPTS.md` | `assets/minions/<id>.webp` |
| ไอคอนยันต์ + ไอคอนขันน้ำมนต์ | 2 | `docs/mor-phi/ART-PROMPTS.md` | `assets/status/status_yant.webp`, `assets/ui/water_bowl.webp` |
| ลูกสมุนผีคืน 1 (ลิงโป่ง เงาป่า เถ้ากระดูก หัวในกระด้ง) | 4 | `docs/ghosts/ART-PROMPTS.md` | `assets/minions/<id>.webp` |
| ลูกสมุนผีคืน 2–3 (ลูกแดง พรายน้ำ เสือสมิง เถาวัลย์ เปรตบริวาร รากไทร หัวลอย) | 7 | `docs/ghosts/ART-PROMPTS.md` | `assets/minions/<id>.webp` |
| ไอคอนชาร์จของผี | 1 | `docs/ghosts/ART-PROMPTS.md` | `assets/status/status_charge.webp` |
| **รวม** | **52** | | |

ระหว่างยังไม่มีภาพ เกมเล่นได้ปกติ (การ์ดแสดงสัญลักษณ์ ลูกสมุนแสดงเงาผี ไอคอนยืมภาพอื่น)

## ข้อความส่งให้ GPT
> ทำงานบน branch `work/mor-phi-nam-mon` แตก branch ใหม่ `art/mor-phi-ghosts` สร้างภาพทุกภาพใน `docs/ART-TODO.md` ตาม prompt ในไฟล์ที่ระบุ (สไตล์อยู่หัวไฟล์ ใส่ทุกภาพ) สร้าง 1024×1024 พื้นหลังโปร่งใส ย่อเป็น 384×384 `.webp` (ไอคอนก็ใช้ขนาดเดียวกัน) เซฟตาม path แล้วต่อสาย: การ์ด → `app/cardArt.ts` ทั้งสองแผนที่, ลูกสมุน/ของเลี้ยง/ไอคอน → `STATUS_ART` ใน `app/components/battle/StatusArt.tsx` (ไอคอนยันต์ให้แทนบรรทัด `yant:` เดิม, ไอคอนชาร์จทำตามท้าย `docs/ghosts/ART-PROMPTS.md`) จากนั้นรัน `python3 scripts/mor-phi-art.py`, `npx tsc --noEmit`, `npx vitest run` ให้ผ่าน แล้ว push ห้าม merge เข้า main
