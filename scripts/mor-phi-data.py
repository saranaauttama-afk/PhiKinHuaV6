# scripts/mor-phi-data.py — writes the หมอผี (shaman) card set into class_cards.json.
# Design: docs/mor-phi/DESIGN.md. Re-run after editing the list:  python3 scripts/mor-phi-data.py
# Card ids that already have art (app/cardArt.ts) are kept; their effects follow the น้ำมนต์ rules.
import json, os

ROOT = os.path.join(os.path.dirname(__file__), '..')
PATH = os.path.join(ROOT, 'src/data/packs/base/class_cards.json')

def yant(n): return {"id": "yant", "stacks": n, "turns": 99, "to": "enemy"}
def st(i, n, turns, to="enemy"): return {"id": i, "stacks": n, "turns": turns, "to": to}

def card(id, name, type, rarity, fx, flavor, **kw):
    c = {"id": id, "name": name, "type": type, "rarity": rarity, "class": "shaman", "fx": fx}
    c.update(kw)
    c["flavor"] = flavor
    return c

C = [
  # ── การ์ดโจมตี (ฟรี) ─────────────────────────────────────────
  card("bamboo_dart", "ปาไผ่เผา", "attack", "Common", {"dmg": 6}, "ไผ่เผาไฟปลายแหลม", starter=1),
  card("bamboo_volley", "ปาไผ่รัว", "attack", "Common", {"dmg": 2, "hits": 4}, "ขว้างไผ่ทีละดุ้น"),
  card("cursed_needle", "เสกเข็มปัก", "attack", "Common", {"dmg": 5, "status": [yant(1)]}, "เข็มเสกปักลงเงาผี ทิ้งรอยยันต์ไว้", starter=2),
  card("paper_yant", "แปะยันต์กระดาษ", "attack", "Common", {"dmg": 2, "status": [yant(2)]}, "ยันต์กระดาษสาตัวเล็ก แปะได้ทีละแผ่นสองแผ่น"),
  card("nail_coffin", "ตอกตะปูโลงผี", "attack", "Uncommon", {"dmg": 6},
       "ตะปูสังฆวานรตอกลงตรงรอยยันต์", conditional={"when": {"kind": "enemy_status_at_least", "statusId": "yant", "value": 3}, "bonus": {"dmg": 7}}),
  card("rice_throw", "เสกข้าวสารซัด", "attack", "Common", {"dmg": 2, "hits": 3, "sweep": True}, "ข้าวสารเสกซัดไปทั้งวง ผีตัวไหนก็โดน"),
  card("lotus_dip", "ดอกบัวจุ่มน้ำมนต์", "attack", "Common", {"dmg": 4, "mana": 1}, "ฟาดด้วยดอกบัว น้ำมนต์ที่ปลายกลีบหยดกลับลงขัน"),
  card("all_or_nothing", "หมดหน้าตัก", "attack", "Rare", {"dmg": 8}, "ทุ่มทุกอย่างที่มีในมือ",
       limit="turn", conditional={"when": {"kind": "hand_empty"}, "bonus": {"dmg": 14, "draw": 2}}),
  card("ghost_debt", "ทวงหนี้ผี", "attack", "Common", {"dmg": 6}, "เลือดที่เสียไปต้องได้คืน",
       conditional={"when": {"kind": "player_hp_below", "value": 50}, "bonus": {"dmg": 6, "heal": 3}}),

  # ── ปลุกเสก (ฟรี: ได้น้ำมนต์) ─────────────────────────────────
  card("meditation", "นั่งสมาธิปลุกเสก", "mana", "Common", {"mana": 3, "draw": 1}, "ใจนิ่ง น้ำในขันก็ขลัง", limit="turn", starter=2),
  card("ghost_possession", "ทรงผี", "mana", "Uncommon", {"mana": 4, "draw": 1}, "ผีเข้าร่างพาของขลังมาด้วย", limit="turn"),
  card("blood_offering", "กรีดเลือดเซ่น", "mana", "Common", {"selfDamage": 3, "mana": 4}, "ของต่ำกินเลือดก่อนจะยอมทำงานให้"),

  # ── คาถา: น้ำมนต์ ───────────────────────────────────────────
  card("holy_water_splash", "สาดน้ำมนต์", "spell", "Common", {}, "สาดทั้งขัน ไม่เหลือสักหยด", mana=0, splash={"dmg": 5}, starter=1),
  card("sprinkle", "ประพรมน้ำมนต์", "spell", "Common", {"block": 7, "heal": 2}, "ใบมะยมจุ่มน้ำมนต์ประพรมรอบตัว", mana=1, starter=1),
  card("boil_water", "น้ำมนต์เดือด", "spell", "Uncommon", {}, "น้ำมนต์ต้มจนเดือด ลวกทั้งผีทั้งบริวาร", mana=0, splash={"dmg": 3, "sweep": True}),
  card("water_curtain", "ม่านน้ำมนต์", "spell", "Uncommon", {}, "สาดเป็นม่านกั้นระหว่างเรากับผี", mana=0, splash={"block": 3}),
  card("mouth_spray", "พ่นน้ำมนต์ใส่หน้า", "spell", "Common", {"dmg": 5, "hits": 2}, "อมไว้ใต้ลิ้น เสกแล้วพ่นใส่หน้าผี", mana=2),
  card("flowing_chant", "คาถาไหลลื่น", "spell", "Uncommon", {"dmg": 18}, "คาถาไหลออกมาไม่ขาดสายเหมือนน้ำ", mana=4),
  card("cleansing_bath", "อาบน้ำมนต์ล้างอาถรรพ์", "spell", "Uncommon", {"cleanse": True, "block": 6}, "รดหัวล้างทุกสิ่งที่ผีแปะไว้", mana=2),
  card("black_magic", "อาถรรพ์ดำ", "spell", "Legendary", {"dmg": 30}, "ของต้องห้าม ถ้าน้ำไม่พอ มันขอเลือดแทน", mana=6, blood=True, exhaust=True),

  # ── คาถา: ยันต์ / ผนึก ──────────────────────────────────────
  card("yant_burst", "ปลุกยันต์ลุกไฟ", "spell", "Uncommon", {}, "ยันต์ทุกแผ่นบนตัวผีลุกเป็นไฟพร้อมกัน", mana=2, wakeYant={"dmg": 6}),
  card("yant_ward", "ยันต์คุ้มกาย", "spell", "Common", {"block": 3}, "ดึงยันต์จากตัวผีมาห่อตัวเราแทน", mana=1, wakeYant={"block": 4}),
  card("sai_sin_bind", "สายสิญจน์มัดมือ", "spell", "Uncommon", {"status": [st("weakness", 1, 2), yant(1)]},
       "มัดมือผีตอนมันกำลังง้าง", mana=2, conditional={"when": {"kind": "ghost_charging"}, "bonus": {"status": [yant(2)]}}),
  card("seal_jar", "หม้อดินกักผี", "spell", "Rare", {"seal": 1, "dmg": 6}, "ดึงผีลงหม้อ ปิดผ้าขาว ผูกสายสิญจน์", mana=4),
  card("night_hex_knot", "เงื่อนคาถาห้าคืน", "spell", "Rare", {"dmg": 5, "status": [yant(2)]}, "เงื่อนคาถาที่ผูกไว้ห้าคืน",
       mana=2, locked=True, conditional={"when": {"kind": "enemy_status_at_least", "statusId": "yant", "value": 3}, "bonus": {"dmg": 7}}),

  # ── คาถา: ของต่ำ / สาป ───────────────────────────────────────
  card("curse_chant", "เสกคาถาสาป", "spell", "Common", {"dmg": 7, "status": [st("curse", 2, 3)]}, "คำสาปทำให้ผีเจ็บทุกครั้งที่โดน", mana=2, starter=1),
  card("direct_poison_spell", "เสกพิษตรง", "spell", "Common", {"status": [st("poison", 3, 4)]}, "คาถาพิษเข้าเลือดโดยตรง", mana=2, blood=True),
  card("withering_hex", "คาถาเหี่ยวแห้ง", "spell", "Uncommon", {"status": [st("weakness", 1, 2), st("vulnerable", 1, 2)]}, "ผีอ่อนแรงและเปราะบางพร้อมกัน", mana=3, blood=True),
  card("phi_tai_hong", "ผีตายโหง", "spell", "Rare", {"dmg": 12}, "เรียกผีตายโหงมาแก้แค้นแทน",
       mana=4, blood=True, conditional={"when": {"kind": "player_hp_below", "value": 50}, "bonus": {"dmg": 12}}),
  card("herbal_ritual", "พิธีสมุนไพรเก้าทัพ", "spell", "Legendary", {"heal": 12, "status": [st("regeneration", 3, 4, "self")]}, "สมุนไพรเก้าชนิดต้มในหม้อดิน", mana=4, exhaust=True),
  card("salt_hex", "เกลือเสกคาถา", "spell", "Uncommon", {"block": 8, "status": [st("curse", 1, 3)]}, "เกลือเสกกันตัวและสาปผีไปพร้อมกัน", mana=2),
  card("hong_phrai_call", "เลี้ยงโหงพราย", "spell", "Rare", {"summon": "hong_phrai"}, "ผีพรายตายทั้งกลมที่ขอเลือดเลี้ยงทุกคืน", mana=3, blood=True),

  # ── วิชา (ใช้แต้ม) ───────────────────────────────────────────
  card("cooling_cloth", "ผ้าเย็น", "action", "Common", {"block": 7}, "ตั้งรับด้วยผ้าชุบน้ำมนต์", ap=1, starter=2),
  card("fill_bowl", "ตักน้ำใส่ขัน", "action", "Common", {"mana": 2, "block": 4}, "ตักน้ำบ่อวัดใส่ขันแล้วเสกต่อ", ap=1),
  card("full_bowl", "ขันเต็มเปี่ยม", "action", "Uncommon", {"block": 5}, "ขันที่เต็มจนปริ่มมีแรงในตัวเอง",
       ap=1, conditional={"when": {"kind": "water_at_least", "value": 8}, "bonus": {"dmg": 16}}),
  card("yantra_in_hand", "ยันต์ในมือ", "action", "Common", {"block": 8, "status": [yant(1)]}, "ปล่อยได้กันเต็ม ถือไว้ก็ยังกันให้", ap=1, whileHeld={"block": 3}),
  card("sai_sin", "ล้อมสายสิญจน์", "action", "Uncommon", {"unCharge": True, "block": 5}, "วงด้ายขาวรอบตัว ผีที่กำลังง้างต้องเริ่มใหม่", ap=1),
  card("read_omen", "ดูฤกษ์ยาม", "action", "Common", {"draw": 2, "mana": 1}, "ดูตำราว่าคืนนี้อะไรจะมา", ap=1),
  card("hun_payon_call", "ปลุกหุ่นพยนต์", "action", "Uncommon", {"summon": "hun_payon"}, "หุ่นฟางเสกให้ลุกขึ้นยืนรับหมัดแทน", ap=1),
  card("golden_child_call", "เลี้ยงกุมารทอง", "action", "Rare", {"summon": "golden_child"}, "ป้อนน้ำแดงขนม แล้วกุมารทองจะตักน้ำให้", ap=1),
  card("khwai_thanu_call", "ปลุกควายธนู", "action", "Uncommon", {"summon": "khwai_thanu"}, "ควายทองเหลืองตัวน้อยเสกให้ขวิดผี", ap=1),
  card("rak_yom_call", "บูชารักยม", "action", "Uncommon", {"summon": "rak_yom"}, "กุมารพี่น้องในขวดน้ำมันคอยช่วยร่าย", ap=1),
  card("spirit_feast", "ข้าวปลาเลี้ยงผี", "action", "Common", {"healMinions": 6, "block": 5}, "เลี้ยงของเลี้ยงให้อิ่ม มันจะอยู่กับเราไปนาน ๆ", ap=1),

  # ── บทสวด ─────────────────────────────────────────────────
  card("rain_rite", "พิธีขอฝน", "prayer", "Uncommon", {"mana": 3, "block": 4}, "ยิ่งสวดนาน ฝนยิ่งเทลงขัน", ap=1),

  # ── สวนกลับ ───────────────────────────────────────────────
  card("yantra_snare", "ยันต์ดัก", "counter", "Common", {"dmg": 5, "status": [yant(2)]}, "ยันต์ลุกเป็นไฟเมื่อผีเข้ามาตี", counter={"trigger": "enemy_attack"}),
  card("chalk_circle", "วงปูนเสก", "counter", "Rare", {"status": [yant(1)]}, "ผีก้าวข้ามวงปูนไม่ได้ ร่ายอะไรก็ไม่ออก", counter={"trigger": "enemy_skill", "negate": True}),
  card("water_bowl_guard", "บาตรน้ำมนต์รับหมัด", "counter", "Uncommon", {"block": 8, "mana": 2}, "ยกบาตรรับไว้ น้ำกระฉอกกลับลงขัน", counter={"trigger": "enemy_attack"}),

  # ── ของขลัง ───────────────────────────────────────────────
  card("equipment_shaman_staff", "ไม้เท้าหมอผี", "equipment", "Uncommon", {}, "คาถาใบแรกแต่ละเทิร์นคืนน้ำมนต์",
       equip={"triggers": [{"on": "play", "type": "spell", "once": "turn", "fx": {"mana": 1}}]}),
  card("equipment_nang_tani_skull", "กะโหลกนางตานี", "equipment", "Rare", {}, "นางตานีหัวเราะทุกครั้งที่ผีตนอื่นถูกขัง",
       equip={"triggers": [{"on": "seal", "fx": {"dmg": 8, "heal": 3}}]}),
  card("bronze_bowl", "ขันน้ำมนต์สำริด", "equipment", "Uncommon", {}, "ขันใบใหญ่ของหลวงตา จุได้มากกว่าขันของเรา",
       equip={"triggers": [{"on": "equip", "fx": {"mana": 2}}], "bowlBonus": 5}),
  card("overflow_trough", "รางน้ำมนต์", "equipment", "Rare", {}, "น้ำที่ล้นขันไหลตามรางไปลวกผี", equip={"triggers": [], "overflowDmg": 3}),
  card("bone_rosary", "ประคำกระดูก", "equipment", "Rare", {}, "ยิ่งเจ็บ ลูกประคำยิ่งร้อน",
       equip={"triggers": [{"on": "play", "type": "spell", "when": {"kind": "player_hp_below", "value": 50}, "fx": {"dmg": 5}}]}),
  card("red_yant_cloth", "ผ้ายันต์แดงประจำตัว", "equipment", "Legendary", {}, "ผ้ายันต์ที่ครูลงอักขระให้ตั้งแต่บวชเณร",
       equip={"triggers": [{"on": "turnStart", "fx": {"status": [yant(1)]}}]}),
]

if __name__ == '__main__':
    ids = [c["id"] for c in C]
    assert len(ids) == len(set(ids)), 'duplicate id'
    t = open(PATH, encoding='utf-8').read()
    L = json.loads(t)
    rest = [c for c in L if c.get("class") != "shaman"]
    first = next((i for i, c in enumerate(L) if c.get("class") == "shaman"), 0)
    out = rest[:first] + C + rest[first:]
    open(PATH, 'w', encoding='utf-8').write(json.dumps(out, ensure_ascii=False, indent=1))
    print(f'{len(C)} shaman cards written ({sum(c.get("starter", 0) for c in C)} in the starter deck)')
