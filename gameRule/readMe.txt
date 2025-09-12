TL;DR (สำหรับ AI ตัวต่อไป)

เกม 1 รอบ = 2 พาร์ต (Part 1/Part 2)

จบ Part 1 ด้วย Mid Boss

จบ Part 2 ด้วย Final Boss

Secret Boss = โอกาสพิเศษ (ไม่แทนที่ Mid/Final) ตามเงื่อนไข

แผนที่ใช้ระบบ Page (หน้าละ 3 ช่อง)

เคลียร์ 1 ช่อง (ไม่ใช่ boss/next_event) → สุ่ม Encounter ใหม่ ทันทีในช่องเดิม (Dynamic Refresh)

เคลียร์สะสมถึงเพดาน → ยัด next_event บังคับไปหน้าใหม่ (Force Split)

ร้านการ์ดแสดง 3 ใบ ต่อครั้ง, ร้านคงอยู่ หากออกโดยไม่ซื้อ, ลบได้/หมดสต็อกแล้วหาย, มีโอกาส กลับมา (carry-over)

EXP/Gold/ค่าใช้จ่ายร้าน ปรับผ่าน config ได้

คำจำกัดความ (Definitions)

Part: ช่วงของเกมที่มีหลายหน้า (Pages) ต่อกันและจบด้วยบอส

Part 1 → ปิดด้วย Mid Boss

Part 2 → ปิดด้วย Final Boss

(ออปชัน) Secret Boss: เกิดจากเงื่อนไขพิเศษระหว่างทาง หรือหลัง Final (ตามที่กำหนด)

Page: หนึ่งหน้ามี 3 Slots (ข้อเสนอ Encounter 3 แบบ/อัน)

EncounterKinds: normal | elite | event | shop | next_event | boss | secret_boss

next_event: จุดเปลี่ยนหน้า (path split / ไปหน้าถัดไป)

Shop: ร้านแบบ persistent (คงอยู่ได้ข้ามหน้า) พร้อมคลังสินค้า (stock)

กฎการไหลของเกม (Game Flow Rules)
1) โครงสร้าง 2 พาร์ต

เริ่มที่ Part 1 → เล่นผ่านหลาย Pages → Mid Boss

ต่อ Part 2 → เล่นผ่านหลาย Pages → Final Boss

Secret Boss: ไม่บังคับเกิด; เงื่อนไขปรับได้ (เช่น แต้ม/จำนวน encounter/เหตุการณ์)

2) Page Flow (3 Slots + Refresh + Force Split)

หนึ่งหน้าเริ่มด้วย 3 Encounters (สุ่มตามน้ำหนัก + carry-over ร้าน)

เมื่อผู้เล่นจบ encounter ใด ๆ ที่ ไม่ใช่ boss/next_event:

Dynamic Refresh: สุ่ม encounter ใหม่ใส่ ช่องเดิม ทันที

เพิ่มตัวนับ ResolvedOnPage

Force Split: ถ้า ResolvedOnPage แตะเพดาน → แทนที่ช่องนั้นด้วย next_event เพื่อเปลี่ยนหน้า

เปิดหน้าใหม่แล้วรีเซ็ต ResolvedOnPage = 0

ค่าควบคุมเริ่มต้น (ปรับได้)

PAGE_MIN_BEFORE_SPLIT = 3 (แนวชี้นำ—เล่นขั้นต่ำก่อนพบทางแยก)

PAGE_FORCE_SPLIT_AT = 7 (เพดาน—ครบแล้วต้องย้ายหน้า)

3) ร้าน (Shop)

Card Shop: แสดง 3 ใบ ต่อครั้ง (SHOP_STOCK_SIZE = 3)

คุณภาพเลือกได้: SHOP_POWER_BIAS = 1.15 (ดันของดีขึ้นเล็กน้อยเพื่อชดเชยตัวเลือกน้อย)

Persistence:

ออกจากร้านโดยไม่ซื้อ → ร้านยังอยู่ใน registry (มีสิทธิ์กลับมาในหน้าถัดไป)

ซื้อจนหมดสต็อก → ลบออกอัตโนมัติ

ผู้เล่นสั่งลบด้วยคำสั่งลบร้าน (หรือใช้คำสั่ง DeleteShop ที่โปรเจ็กต์มีอยู่)

Carry-Over Chance: ค่าเริ่มต้น ~0.7 (ปรับได้ใน registry)

4) บอส

Mid Boss: จบ Part 1

Final Boss: จบ Part 2

Secret Boss: โผล่แบบพิเศษ (ไม่แทนที่ Mid/Final)

5) รางวัล/เศรษฐศาสตร์

EXP/Gold ต่างกันตามชนิด encounter (normal/elite/boss/event) + ตัวคูณ zone/part/difficulty

Level Up: โค้ง EXP กำหนดได้ (base/growth หรือ custom thresholds)

ค่าใช้จ่ายร้าน (remove/upgrade/reroll) ปรับได้

อินวาเรียนต์ (Invariants) — “ห้ามหลุด”

เกม = 2 พาร์ตแน่นอน: Part 1 → Mid Boss → Part 2 → Final Boss (Secret Boss = เพิ่มเติม, ไม่แทนที่)

ทุกหน้า = 3 Slots เสมอ

เคลียร์ encounter ที่ไม่ใช่ boss/next_event → ต้อง refresh ช่องเดิมทันที

ถึง PAGE_FORCE_SPLIT_AT ในหน้านั้น → ช่องถัดไป ต้อง กลายเป็น next_event

ร้านการ์ดแสดง 3 ใบ; ออกโดยไม่ซื้อ ยังอยู่; ซื้อหมด ต้องหาย

Carry-over ร้าน (โผล่อีกหน้า) ใช้ registry เป็นแหล่งอ้างอิงเดียว

สรุปพารามิเตอร์ (Machine-Readable Spec)
run_structure:
  parts: 2                # Part 1 → Mid Boss, Part 2 → Final Boss
  bosses:
    part1_end: mid_boss
    part2_end: final_boss
  secret_boss:
    enabled: true         # optional; separate from mid/final

page_flow:
  slots_per_page: 3
  refresh_on_resolve: true
  counters:
    resolves_on_page:
      min_before_split: 3           # PAGE_MIN_BEFORE_SPLIT
      force_split_at: 7             # PAGE_FORCE_SPLIT_AT → inject next_event
  next_event_behaviour: change_page  # load 3 fresh offers

encounters:
  kinds: [normal, elite, event, shop, next_event, boss, secret_boss]
  weights: configurable_per_part     # tuned elsewhere

shops:
  card_shop:
    stock_size: 3                    # SHOP_STOCK_SIZE
    power_bias: 1.15                 # SHOP_POWER_BIAS
  persistence:
    carry_over: true
    respawn_base_chance: 0.7         # registry-level
    delete_actions:
      by_player: allowed
      when_exhausted: auto_delete

rewards:
  exp:
    per_kind: configurable
    curve: base_growth_or_thresholds
  gold:
    per_kind: configurable
    multipliers: [part/zone, difficulty]
  costs:
    remove/upgrade/reroll: configurable

จุดที่ “ต้องไปแก้ค่า” ถ้าจะบาลานซ์

weights.ts → PAGE_*, slots_per_page=3, SHOP_STOCK_SIZE=3, SHOP_POWER_BIAS

shopRegistry.ts → respawn_base_chance

progression.ts → EXP curve

economy.ts → Gold/Costs/Variance