# scripts/mor-phi-art.py — art prompts for the หมอผี (น้ำมนต์) set.
# Writes docs/mor-phi/art-prompts.json (read by test/folklore-art.test.ts: status "new" = no art yet)
# and docs/mor-phi/ART-PROMPTS.md (for the owner / GPT).   python3 scripts/mor-phi-art.py
import json, os

ROOT = os.path.join(os.path.dirname(__file__), '..')

STYLE = ("Thai one-baht horror pulp comic card illustration, matching the existing ผีกินหัว card set: rough confident black ink "
 "outlines with coarse cross-hatching, muted vintage print colours (ochre, olive, brick red, faded indigo, warm skin tones, "
 "dull bronze), one clear subject or a tight two-figure action, dynamic readable silhouette that still reads at 80 px, "
 "transparent background (real alpha), square 1:1 canvas, subject fills about 85%, small clean margin. "
 "Shaman look: lean rural Thai village shaman (หมอผี), middle-aged, faded indigo or white collarless shirt, pha khao ma "
 "sash, sak yant tattoo lines on the forearms, white sacred cotton thread (สายสิญจน์) around the wrist, often holding a "
 "dull bronze holy-water bowl (ขันน้ำมนต์) and a sprig of leaves. Night-of-ghosts mood without gore close-ups. No text, "
 "letters, numbers, logos, card frame, border, parchment, gradient background, 3D render or glow effects. "
 "Not Chinese/Japanese exorcist styling, not Western witch styling.")
MINION_STYLE = ("Same style, one full-body figure standing on nothing (no ground block), facing RIGHT (it stands left of "
 "the player and faces the ghost), readable at 60 px.")
ICON_STYLE = ("Small status icon for a mobile card game, same ink-and-muted-colour Thai pulp comic style as the cards, single "
 "bold object, very simple silhouette that reads at 24–32 px, thick outline, transparent background, square 1:1, no text or numbers.")

CARDS = [
 ('yant_ladle', 'กระบวยลงยันต์', 'A coconut-shell ladle dipping into a bronze water bowl, one paper talisman tied to its wooden handle'),
 ('threaded_needle', 'เข็มร้อยสายสิญจน์', 'A ritual needle trailing white sacred cotton thread, taut against the wrist of a ghost raising its claw'),
 ('familiar_ward', 'สายสิญจน์คล้องของเลี้ยง', 'The shaman looping white protective thread around a small straw effigy and his own wrist'),
 ('brimming_yant', 'ยันต์ชุบน้ำเต็มขัน', 'Three folded paper talismans dipping into a bronze bowl filled to the rim'),
 ('blood_thread', 'ด้ายแดงผูกเงา', 'A red ritual thread tied around a paper talisman and a dark ghost silhouette, a small offering cup below, no gore'),
 ('spirit_rice_scatter', 'ข้าวเสกเลี้ยงบริวาร', 'Blessed rice scattered between a friendly straw effigy and hostile ghost wisps, the effigy catching grains'),
 ('sealed_bowl_rite', 'พิธีปิดขันกักเงา', 'The shaman pouring a brimming bronze bowl into a clay spirit jar while drawing a white cloth over its mouth'),

 ("paper_yant", "แปะยันต์กระดาษ", "The shaman slapping two small square paper yant talismans covered in ink script onto a shadowy ghost's shoulder, paper fluttering"),
 ("nail_coffin", "ตอกตะปูโลงผี", "A hand hammering a long old iron nail into a cracked wooden coffin lid marked with a yant square, a ghostly hand recoiling from inside"),
 ("rice_throw", "เสกข้าวสารซัด", "The shaman flinging a fistful of blessed raw rice grains in a wide arc, the grains spraying outward like buckshot"),
 ("lotus_dip", "ดอกบัวจุ่มน้ำมนต์", "A closed pink lotus bud dipped in a bronze bowl and swung like a whip, droplets flying off the petals"),
 ("ghost_debt", "ทวงหนี้ผี", "The wounded shaman, bandaged arm, pointing an accusing finger and striking a ghost with a rolled-up palm-leaf manuscript"),
 ("blood_offering", "กรีดเลือดเซ่น", "A small ritual knife over a clay offering cup, a single drop of blood falling into it, incense smoke curling; no wound close-up"),
 ("holy_water_splash", "สาดน้ำมนต์", "The shaman swinging a whole bronze bowl forward, a big arc of holy water splashing out toward the viewer"),
 ("sprinkle", "ประพรมน้ำมนต์", "A sprig of mayom leaves flicking light drops of holy water in a gentle circle around the shaman"),
 ("boil_water", "น้ำมนต์เดือด", "A clay pot of holy water boiling over a small fire, steam and bubbling water spilling out in a scalding wave"),
 ("water_curtain", "ม่านน้ำมนต์", "A sheet of thrown holy water hanging in the air like a curtain between the shaman and a clawed ghost hand"),
 ("mouth_spray", "พ่นน้ำมนต์ใส่หน้า", "The shaman with puffed cheeks spraying a mist of holy water from his mouth straight at a ghost's face"),
 ("cleansing_bath", "อาบน้ำมนต์ล้างอาถรรพ์", "Holy water poured from a bronze bowl over a kneeling villager's head, dark smudges of curse washing away"),
 ("yant_burst", "ปลุกยันต์ลุกไฟ", "Several paper yant talismans stuck on a ghost's body all bursting into flame at once"),
 ("yant_ward", "ยันต์คุ้มกาย", "Yant talismans peeling off a ghost and flying back to wrap around the shaman's forearm like a bracer"),
 ("sai_sin_bind", "สายสิญจน์มัดมือ", "White sacred cotton thread whipping around a ghost's raised wrists, binding them mid-swing"),
 ("seal_jar", "หม้อดินกักผี", "A small black clay pot with its mouth covered by white cloth tied with sacred thread, a ghostly wisp being sucked inside"),
 ("hong_phrai_call", "เลี้ยงโหงพราย", "A tiny shrine with an oil lamp and a small pale female spirit figure rising from the smoke, eerie but not gory"),
 ("fill_bowl", "ตักน้ำใส่ขัน", "The shaman scooping water from an old temple well into a bronze bowl with a coconut-shell ladle"),
 ("full_bowl", "ขันเต็มเปี่ยม", "A bronze holy-water bowl filled to the brim, the water surface trembling with power, a faint ripple ring"),
 ("sai_sin", "ล้อมสายสิญจน์", "A ring of white sacred thread on the ground around the seated shaman, a ghost's claw stopped at the line"),
 ("read_omen", "ดูฤกษ์ยาม", "The shaman reading an old folding palm-leaf almanac by candlelight, finger on a star chart"),
 ("hun_payon_call", "ปลุกหุ่นพยนต์", "A straw effigy figure bound with sacred thread rising to its feet, yant script on its chest"),
 ("golden_child_call", "เลี้ยงกุมารทอง", "A small gilded child-spirit statue on a shelf with a tiny glass of red soda and sweets offered before it"),
 ("khwai_thanu_call", "ปลุกควายธนู", "A small bronze water-buffalo amulet charging forward, growing into a spirit buffalo with lowered horns"),
 ("rak_yom_call", "บูชารักยม", "Two tiny twin child spirits floating out of a small glass vial of oil, holding hands"),
 ("spirit_feast", "ข้าวปลาเลี้ยงผี", "A banana-leaf tray of rice, boiled egg and fish set out as an offering, small spirit hands reaching in"),
 ("rain_rite", "พิธีขอฝน", "The shaman with arms raised under a dark rain cloud, rain pouring straight into a bronze bowl at his feet"),
 ("chalk_circle", "วงปูนเสก", "A circle of white lime-chalk drawn on a dirt floor with yant script, a ghost's foot recoiling at the edge"),
 ("water_bowl_guard", "บาตรน้ำมนต์รับหมัด", "The shaman raising a bronze bowl like a shield to catch a ghost's claw, water sloshing up"),
 ("bronze_bowl", "ขันน้ำมนต์สำริด", "A large old bronze holy-water bowl with engraved rim and a sprig of leaves resting in it, object only"),
 ("overflow_trough", "รางน้ำมนต์", "A split-bamboo trough carrying overflowing holy water down toward a ghost, water splashing at the end"),
 ("bone_rosary", "ประคำกระดูก", "A rosary of small carved bone beads wrapped around a fist, the beads glowing faintly warm, object focus"),
 ("red_yant_cloth", "ผ้ายันต์แดงประจำตัว", "A square red cloth talisman covered in dense yant script and a central deity figure, folded at the corners"),
]
MINIONS = [
 ("hun_payon", "หุ่นพยนต์ฟาง", "A man-sized straw effigy bound with white sacred thread, yant script painted on its chest, arms raised to shield"),
 ("golden_child", "กุมารทอง", "A small gilded child spirit with a topknot, sitting cross-legged and floating, holding a tiny ladle of water; eerie but cute"),
 ("khwai_thanu", "ควายธนู", "A spirit water buffalo made of dull bronze with ink-swirl markings, head lowered to charge"),
 ("rak_yom", "รักยม", "Two tiny twin child spirits back to back, one fierce one smiling, wisps of oil smoke around them"),
 ("hong_phrai", "โหงพราย", "A pale female spirit in a faded sabai cloth with long loose hair, holding a small oil lamp, floating; eerie, not gory"),
]
ICONS = [
 ("status_yant", "สถานะ: ยันต์", "assets/status/status_yant.webp", "a small square paper talisman with three lines of ink script and a red seal mark"),
 ("ui_water_bowl", "ไอคอนน้ำมนต์ (HUD)", "assets/ui/water_bowl.webp", "a bronze holy-water bowl seen from the side, water level visible, a sprig of leaves"),
]

def main():
    have = open(os.path.join(ROOT, 'app/cardArt.ts'), encoding='utf-8').read()
    status_art = open(os.path.join(ROOT, 'app/components/battle/StatusArt.tsx'), encoding='utf-8').read()
    def status_done(key, asset):
        return f"{key}:require('../../../{asset}')" in status_art and os.path.isfile(os.path.join(ROOT, asset))
    cards = [{"id": i, "name": n, "status": "done" if f"'{i}'" in have else "new", "path": f"assets/cards/thai-v24/{i}.webp",
              "prompt": f"{STYLE} Subject: {s}"} for i, n, s in CARDS]
    minions = [{"id": i, "name": n, "status": "done" if status_done(i, f"assets/minions/{i}.webp") else "new", "path": f"assets/minions/{i}.webp",
                "prompt": f"{STYLE} {MINION_STYLE} Subject: {s}"} for i, n, s in MINIONS]
    ui_keys = {"status_yant": "yant", "ui_water_bowl": "water_bowl"}
    ui = [{"id": i, "name": n, "status": "done" if status_done(ui_keys[i], p) else "new", "path": p, "prompt": f"{ICON_STYLE} Subject: {s}"} for i, n, p, s in ICONS]
    out = {"style": STYLE, "output": {
        "cards": "assets/cards/thai-v24/<id>.webp", "minions": "assets/minions/<id>.webp",
        "size": "384×384 RGBA webp (generate at 1024×1024 transparent PNG, then downscale)",
        "wire": "cards: add `'<id>': require('../assets/cards/thai-v24/<id>.webp')` to app/cardArt.ts (both maps), then set status done here (re-run this script) · minions/status icon: add the id to STATUS_ART in app/components/battle/StatusArt.tsx"},
        "cards": cards, "minions": minions, "ui": ui}
    os.makedirs(os.path.join(ROOT, 'docs/mor-phi'), exist_ok=True)
    json.dump(out, open(os.path.join(ROOT, 'docs/mor-phi/art-prompts.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    md = ["# ภาพการ์ดหมอผี (น้ำมนต์) — prompt ให้ GPT", "",
          "ที่มา: `docs/mor-phi/DESIGN.md` (15 ต.ค. 2026) · ไฟล์นี้สร้างจาก `scripts/mor-phi-art.py` (แก้ที่สคริปต์แล้วรันใหม่)", "",
          "## วิธีใช้", "1. ให้ GPT สร้างภาพจาก prompt ทีละใบ พื้นหลังโปร่งใส 1024×1024",
          "2. ย่อเป็น 384×384 เซฟเป็น `.webp` ตาม path",
          "3. การ์ด: เพิ่มบรรทัดใน `app/cardArt.ts` (ทั้งสองแผนที่) แล้วรัน `python3 scripts/mor-phi-art.py` ใหม่ เทสต์จะเริ่มบังคับให้มีภาพ",
          "4. ของเลี้ยง/ไอคอน: เพิ่ม id ใน `STATUS_ART` (`app/components/battle/StatusArt.tsx`)",
          "ระหว่างยังไม่มีภาพ การ์ดแสดงสัญลักษณ์แทน เล่นได้ปกติ", "",
          "การ์ดหมอผีเดิม 20 ใบมีภาพแล้ว (ใช้ id เดิม) ไม่ต้องทำใหม่", "",
          "## สไตล์ (ใส่ทุกใบ)", "", STYLE, "",
          f"## การ์ดใหม่ ({sum(c['status'] == 'new' for c in cards)} ใบ)", ""]
    for c in cards:
        if c["status"] != "new": continue
        md += [f"### {c['name']} · `{c['id']}`", f"`{c['path']}`", "", c["prompt"].replace(STYLE + ' ', ''), ""]
    md += [f"## ของเลี้ยง ({len(minions)} ตัว) — ยืนข้างเรา หันขวา", "", MINION_STYLE, ""]
    for m in minions:
        md += [f"### {m['name']} · `{m['id']}`", f"`{m['path']}`", "", m["prompt"].replace(STYLE + ' ' + MINION_STYLE + ' ', ''), ""]
    md += ["## ไอคอน", "", ICON_STYLE, ""]
    for u in ui:
        md += [f"### {u['name']} · `{u['id']}`", f"`{u['path']}`", "", u["prompt"].replace(ICON_STYLE + ' ', ''), ""]
    md += ["ใส่ภาพยันต์แล้ว: เพิ่ม `yant:require('../../../assets/status/status_yant.webp'),` ใน `STATUS_ART`"]
    open(os.path.join(ROOT, 'docs/mor-phi/ART-PROMPTS.md'), 'w', encoding='utf-8').write('\n'.join(md) + '\n')
    print(f"{sum(c['status']=='new' for c in cards)} new card prompts, {len(minions)} minions, {len(ui)} icons")

if __name__ == '__main__':
    main()
