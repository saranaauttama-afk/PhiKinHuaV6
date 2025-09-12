# ⚙️ Game Rules (Developer Version)

## Page & Encounter Flow
- **3 Slots ต่อหน้า (Page)**
- เมื่อจบ Encounter (ไม่ใช่ boss / path split) → Refresh slot ทันที
- นับจำนวน encounter ต่อหน้า (`s.pages._resolvesOnPage`)
  - `PAGE_MIN_BEFORE_SPLIT = 3`
  - `PAGE_FORCE_SPLIT_AT = 7` → ครบ quota แล้วยัด `next_event` ลงช่องเพื่อบังคับเปลี่ยนหน้า

## Shop System
- Card shop แสดงการ์ด 3 ใบ (`SHOP_STOCK_SIZE = 3`)
- ใช้ `SHOP_POWER_BIAS = 1.15` เพื่อดันของดีให้เลือกง่าย
- Carry-over: ร้านคงอยู่ถ้าออกโดยไม่ซื้อ
- Exhausted: ถ้าสต็อกหมด → remove อัตโนมัติ
- RemoveShopFromMap: ผู้เล่นสั่งลบได้
- Respawn chance: `baseChance = 0.7` (shopRegistry.calculateRespawnChance)

## Rewards & Progression
- EXP / Gold ปรับได้ใน `progression.ts` และ `economy.ts`
- EXP Curve: ปรับ base, growth หรือ custom thresholds
- Gold: ปรับ baseMob, baseElite, baseBoss + multiplier per zone/difficulty
- Variance สามารถปิดเพื่อ deterministic ได้

## Config / Tuning Points
- `weights.ts`: Encounter weights, page quota, shop size, bias
- `progression.ts`: EXP curve
- `economy.ts`: Gold, cost ของ remove/upgrade
- `shopRegistry.ts`: Respawn chance logic

## Commands / Handlers
- **ใหม่**: `RemoveShopFromMap`
- **เปลี่ยน**: `completeNode(...)` → Refresh slot, Force split
- **เพิ่ม**: `rollPageOffers(...)` → Respawn ร้านจาก registry
