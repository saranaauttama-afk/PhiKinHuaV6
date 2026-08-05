// src/core/balance/weights.ts
export const ENABLE_PAGES = true;        // เปิดถาวร (ตอนนี้ปิดไว้ เผื่อยังใช้ UI เดิม)
export const PAGES_TOTAL = 16;
// === Card Shop size rule ===
// จำกัดจำนวนการ์ดที่ร้านแสดง = 3 เพื่อให้เลือกเร็ว กระชับ
export const SHOP_STOCK_SIZE = 3;
export const SHOP_POWER_BIAS = 1.15;

/**
 * เงื่อนไขปลดล็อคศึกลับกับพระยามัจจุราช (ไฟต์ที่ 16)
 *
 * ชนะบอสสุดท้ายโดยเลือดยังเหลือไม่น้อยกว่าสัดส่วนนี้ = มีแรงเหลือพอจะท้ามัจจุราช
 * เลือกเงื่อนไขนี้เพราะตรวจได้จาก state ตรงๆ ผู้เล่นรู้ตัวได้ระหว่างเล่น
 * และให้รางวัลกับการเล่นที่ประหยัดเลือด แทนที่จะเป็นเงื่อนไขลับที่เดาไม่ได้
 */
export const SECRET_BOSS_HP_RATIO = 0.5;

// รันหนึ่งมี 15 ไฟต์ โดยไฟต์ 7 กับ 15 เป็นบอส → เหลือไฟต์ปกติ 13 ไฟต์
// (1-6 = 6 ไฟต์, 8-14 = 7 ไฟต์) pool ของมอนจึงต้องรวมกันได้ 13 พอดี
export const NORMAL_FIGHTS_TOTAL = 13;

export const POOL_DEFAULT = {
  normal: 9,
  elite: 4,
  shopCard: 4,
  shopEquipment: 2,
  shopRemove1: 1, // Phase 1: early game
  shopRemove2: 1, // Phase 2: late game (after phase 1 deleted)
  shopUpgrade1: 1, // Phase 1: early game
  shopUpgrade2: 1, // Phase 2: late game (after phase 1 deleted)
  // ── โควตาการ "เติมช่อง" บนชั้นพัก (ดู `map/restPage.ts`) ──
  //
  // ตัวเลขพวกนี้คุมเฉพาะของที่ **เติมเข้ามาใหม่** หลังผู้เล่นเคลียร์ช่องไป
  // ของที่วางไว้บนแผนที่ตั้งแต่ต้นรัน (~14 โหนดพัก) ไม่ถูกคุม เพราะตอนสร้าง
  // แผนที่ยังไม่รู้ว่าผู้เล่นจะเดินทางไหน
  //
  // ของฟรีตั้งเป็น 0 = ได้เท่าที่วางไว้บนแผนที่ ไม่มีเติม
  // วัดจริง 40 รันแบบเคลียร์ทุกช่อง: ศาล 2.05 → 1.4, บ่อ 1.90 → 0.9
  // ถ้าปล่อยให้เติมได้ด้วย รันจะง่ายลงชัดเจนโดยที่ไม่มีใครตั้งใจ —
  // ร้านที่คิดเงินคุมตัวเองได้ด้วยกระเป๋าอยู่แล้ว ของฟรีไม่มีอะไรคุม
  wells: 0,
  healingShrine: 0,
  treasure: 1, // Free card treasures per part
  treasureSingle: 0, // Single card treasure with random option
  nextEvent: 2, // next_page แบบ event พิเศษ
  storyEvent: 2,
  fusionAltar: 1,
};

export const WEIGHTS = {
  monsterNormal: 5,
  monsterElite: 2,
  shopCard: 3,
  shopEquipment: 2,
  shopRemove1: 2,
  shopRemove2: 2,
  shopUpgrade1: 2,
  shopUpgrade2: 2,
  well: 1,
  healingShrine: 2,
  treasure: 2, // Medium chance for treasure chest
  treasureSingle: 2, // Medium chance for single treasure
  nextEvent: 1,
  boss: 10, // ใช้เมื่อถึงเวลา spawn บอส (inject)
};

// ===== Pages / MTOM-style =====
export const PAGES_OFFERS_PER_PAGE = 3;

// จำนวนมอนที่ต้องสู้ทั้งรัน (normal ก่อน, หมดแล้วค่อยปล่อย elite)
export const RUN_NORMAL_MONSTERS = 9;
export const RUN_ELITE_MONSTERS  = 3;

// โอกาสใส่ next_event เป็น “ช่องทางลัด” บางหน้า (0..1)
export const NEXT_EVENT_RATE = 0.25;

// === Page Budget / Split Rules (high-level) ===
// สัดส่วน encounter ต่อหน้า ก่อนบังคับเปลี่ยนหน้า
export const PAGE_MIN_BEFORE_SPLIT = 3;   // soft guideline
export const PAGE_FORCE_SPLIT_AT   = 7;   // hard cap per page

