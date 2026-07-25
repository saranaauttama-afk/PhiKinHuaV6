# แผนรีแฟกเตอร์ Combat Layer (ก่อนเริ่มรีดีไซน์ NotFM)

เอกสารนี้คือแผนละเอียดของงานที่ต้องทำ **ก่อน** ลงมือรีดีไซน์ภาพ/UI ตาม `context.md`
เป้าหมายไม่ใช่ "รื้อเกมใหม่" แต่คือ **แยกกฎเกมออกจากอนิเมชั่น** เพื่อให้ใส่อนิเมชั่นหนักๆ แบบ Night of the Full Moon ได้โดยไม่พังกฎ

สถานะ: ร่าง รอ approve
ฐาน: branch `redesign-notfm-style` (cut จาก `animationComplete`)

---

## 1. สิ่งที่ตรวจพบ (ยืนยันจากโค้ดจริงแล้วทุกข้อ)

### 1.1 ปัญหาเชิงโครงสร้าง — อนิเมชั่นเป็นคนคุมกฎเกม

`app/battle.tsx:139-201` (`startEnemyTurn`) สร้าง timeline ด้วย `setTimeout` แล้วยิง `dispatch` ตามเวลานั้น
เวลาที่ใช้ import มาจาก **view component**:

```ts
// app/battle.tsx:10
import EnemyHandCard, { ENEMY_PLAY_TOTAL, ENEMY_MAX_SCALE_OFFSET } from './components/battle/EnemyHandCard';

// app/battle.tsx:176
addTimeout(() => { dispatch({ type: 'ResolveEnemyCard', cardId }); }, t + ENEMY_MAX_SCALE_OFFSET);
```

`EnemyHandCard.tsx:26-27`:
```ts
export const ENEMY_PLAY_TOTAL       = PHASE_FLIP + PHASE_RISE + PHASE_HOLD + PHASE_EXIT; // 1350ms
export const ENEMY_MAX_SCALE_OFFSET = PHASE_FLIP + PHASE_RISE;                          // 650ms
```

ผลที่ตามมา:
- จูน `PHASE_RISE` เพื่อความสวย → **จังหวะดาเมจเข้าขยับตาม** โดยไม่ตั้งใจ
- `setTimeout` รันบน **JS thread** / Reanimated รันบน **UI thread** → พอ JS thread หนัก (dispatch zustand + re-render) timeout ดีเลย์ แต่อนิเมชั่นไม่ดีเลย์ → **desync สะสม** ยิ่งการ์ดเยอะยิ่งเพี้ยน
- อาการนี้จะหนักที่สุดบน Android กลาง-ล่าง ซึ่งคือกลุ่มเป้าหมายหลัก

### 1.2 บั๊กกฎเกม: ดาเมจศัตรูไม่ผ่านระบบ status effect เลย

ฝั่งผู้เล่น (`src/core/commands.ts:178`) ผ่านระบบเต็ม:
```ts
let modifiedDamage = modifyDamageForStatusEffects(state, modifiedCard.dmg, true); // true = player attack
```

ฝั่งศัตรู (`src/core/engine/handlers/combat.ts:226-231`) คำนวณดิบ:
```ts
const atk        = def.dmg!;
const blockAfter = Math.max(0, s.player.block - atk);
const hpLoss     = Math.max(0, atk - s.player.block);
```

**`modifyDamageForStatusEffects` ถูกเรียกที่เดียวในโปรเจกต์ และส่ง `true` เสมอ**
→ branch `else` ที่จัดการ "ศัตรูโจมตี" (`src/core/combat/status-effects/runtime.ts:460-471`) **เป็น dead code** เขียนไว้ครบ ถูกต้อง แต่ไม่เคยถูกเรียก

ผลกระทบต่อเกมจริง: buff/debuff ที่ควรมีผลตอนศัตรูตี (strength/weakness ของศัตรู) **ไม่ทำงาน** — กระทบ balance ทั้งเกม

### 1.3 มี damage path ซ้ำซ้อน 3 ชุด

| ที่ | ฟังก์ชัน | สถานะ |
|---|---|---|
| `src/core/commands.ts:318` | `playEnemyCard` | legacy — ยังอยู่ |
| `src/core/engine/handlers/enemy.ts:244` | `runEnemyTurn` | ถูกเรียกผ่าน `endEnemyTurn` |
| `src/core/engine/handlers/combat.ts:231` | `resolveEnemyCard` | **ใช้จริงตอนนี้** (path ที่ทำเพื่ออนิเมชั่น) |

ทั้ง 3 คำนวณ block/hp เองแยกกัน ไม่มีอันไหนผ่าน status effect
บรรทัดแรกของ `combat.ts` เขียนเองว่า `// Legacy only (unified system removed)` — เคยมีระบบรวม แล้วถูกถอดออก

### 1.4 `vulnerable` ประกาศไว้แต่ไม่มีผลอะไรเลย

`grep vulnerable src/core/combat/status-effects/runtime.ts` → **ไม่เจอในส่วนคำนวณดาเมจ**
แต่ UI แสดงไอคอนให้ (`CombatView.tsx:42`) ผู้เล่นเห็นสถานะติดแต่ตัวเลขไม่เปลี่ยน

### 1.5 บั๊กระดับ view

| # | อาการ | ที่ |
|---|---|---|
| a | ตัวเลขดาเมจที่เด้ง = ดาเมจบนการ์ด ไม่ใช่ดาเมจจริง (ไม่หัก block/buff) | `battle.tsx:108` |
| b | ผู้เล่นตายกลางเทิร์นศัตรู แต่การ์ดที่เหลือยังบินมาตีต่อ (timeout ตั้งไว้ล่วงหน้าหมดแล้ว, `resolveEnemyCard` เช็คแค่ `!s.enemy`) | `battle.tsx:176` + `combat.ts:220` |
| c | damage popup หายเมื่อโดน 2 ครั้งในเฟรมเดียว (เดาจาก diff ของ HP ใน useEffect) + การฮีลมองไม่เห็น | `battle.tsx:82-88` |
| d | อ่านรางวัลด้วย regex จาก log string `/^Victory!\s+\+\d+ EXP/` — **เราจะ rewrite ข้อความทั้งเกม รางวัลจะกลายเป็น 0 ทันที** | `battle.tsx:76-80` |
| e | `HAND_CENTER_Y = 380` hardcode layout ของ MonsterArea ไว้ในไฟล์อื่น (คอมเมนต์: "paddingTop(100) + sprite(300) − 20") ไม่ scale ตามจอ — **เราจะใส่ภาพผีจริง 31 ตัว = ขนาด sprite เปลี่ยนแน่** | `EnemyHandCard.tsx:18` |
| f | screen flash วางอยู่ใน container ที่ถูก scale/translate แล้วหารกลับเพื่อ undo transform | `EnemyHandCard.tsx:128-137` |
| g | `CombatView.tsx` (UI debug เก่า, emoji, `(state as any)` ทั้งไฟล์, `require()` ใน render) ยังถูก render อยู่ | `index.tsx:230` |
| h | `console.log` ~15 จุดใน hot path + NaN guard 3 ชั้น (บ่งว่ามีอะไรผลิต NaN อยู่จริง ยังไม่ได้หาต้นเหตุ) | `commands.ts:149-298` |

---

## 2. หลักการของแผน

> **Engine คำนวณจนจบในทีเดียว แล้วคายผลออกมาเป็น event list — View เอา event ไปเล่นเป็นอนิเมชั่นตามจังหวะของตัวเอง**

ไม่มี `setTimeout` ตัวไหนได้แตะ game state อีก

ได้อะไร:
- state ถูกต้องเสมอ ไม่ขึ้นกับว่าอนิเมชั่นเล่นถึงไหน
- ตัวเลขที่โชว์ = ตัวเลขจริง (มาพร้อม event)
- skip / เร่งความเร็ว / ออกจากจอกลางคัน ได้ฟรี โดย state ไม่พัง
- ผู้เล่นตาย = stream จบ ไม่มีตีต่อ
- **จูนอนิเมชั่นสวยแค่ไหนก็ไม่กระทบกฎเกม** ← เหตุผลหลักที่ต้องทำก่อนรีดีไซน์

---

## 3. แผนงานเป็นเฟส

### Phase 0 — ตาข่ายนิรภัย (ครึ่งวัน)

โปรเจกต์ยังไม่มี test เลย และเฟส 1 จะไปแตะสูตรคำนวณดาเมจ ซึ่งแตะแล้วพังเงียบได้ง่ายมาก

- [ ] ติดตั้ง `vitest` สำหรับ `src/core/` เท่านั้น (เป็น pure TS ไม่มี dependency ของ React Native → รันได้เลย ไม่ต้องตั้ง RN test env)
- [ ] เขียน characterization test ครอบพฤติกรรม **ปัจจุบัน** (ยังไม่แก้อะไร) ของ:
  - ผู้เล่นเล่นการ์ดโจมตีใส่ศัตรูที่มี block
  - ศัตรูโจมตีผู้เล่นที่มี block
  - เงื่อนไข victory / defeat
  - `startCombat` → เทิร์นแรก → จบเทิร์น (สโมคเทสต์ของลูป)
- [ ] เพิ่ม `npm test` ใน `package.json`

> เทสต์ชุดนี้จะ "ล็อก" พฤติกรรมเดิมไว้ เวลารีแฟกเตอร์จะได้รู้ทันทีว่าอะไรเปลี่ยนโดยไม่ตั้งใจ
> **หมายเหตุ:** เทสต์ข้อ 2 จะบันทึกพฤติกรรมที่ *ผิด* อยู่ (ไม่ผ่าน status effect) — ตั้งใจให้เป็นแบบนั้น แล้วค่อยไปแก้ค่าคาดหวังใน Phase 1 อย่างจงใจ

---

### Phase 1 — รวม damage path ให้เหลือทางเดียว (1 วัน)

**สร้างไฟล์ใหม่ `src/core/combat/damage.ts`** — single source of truth:

```ts
export type DamageSource =
  | { kind: 'card';   cardId: string }
  | { kind: 'status'; effectId: string }   // poison ฯลฯ
  | { kind: 'minion'; minionId: string }
  | { kind: 'event' };

export type DamageResult = {
  raw: number;       // ตัวเลขบนการ์ด
  modified: number;  // หลัง status effect / combo / adaptive
  blocked: number;   // block ที่ดูดไป
  hpLoss: number;    // HP ที่หายจริง
  died: boolean;
};

export function dealDamage(
  state: GameState,
  args: { from: 'player' | 'enemy'; to: 'player' | 'enemy'; raw: number; source: DamageSource }
): DamageResult
```

หน้าที่ของมัน (รวมทุกอย่างที่ตอนนี้กระจายอยู่):
1. เรียก `modifyDamageForStatusEffects(state, raw, from === 'player')` ← **ส่ง flag ให้ถูก** แก้บั๊ก 1.2
2. รองรับ `vulnerable` (ตอนนี้ประกาศแต่ไม่ทำงาน) — แก้บั๊ก 1.4
3. หัก block → คำนวณ hpLoss → clamp
4. เช็คตาย
5. คืน `DamageResult` ← **ค่านี้แหละที่ view ต้องใช้เพื่อโชว์ตัวเลขที่ถูก** (แก้บั๊ก 1.5a)

**งานต่อสาย:**
- [ ] `commands.ts:176-220` (ผู้เล่นตี) → เรียก `dealDamage`
- [ ] `combat.ts:226-231` (`resolveEnemyCard`) → เรียก `dealDamage`
- [ ] `enemy.ts:244` (`runEnemyTurn`) → เรียก `dealDamage`
- [ ] **ลบ** `playEnemyCard` (`commands.ts:308-326`) ทิ้ง — ยืนยันก่อนว่าไม่มีใครเรียกแล้ว
- [ ] ตัดสินใจว่า `runEnemyTurn` (enemy.ts) กับ `resolveEnemyCard` (combat.ts) จะเหลืออันไหน — Phase 2 จะยุบเป็นอันเดียวอยู่แล้ว
- [ ] หาต้นเหตุ NaN แล้วลบ NaN guard 3 ชั้นทิ้ง (`commands.ts:182-202`) — ถ้ายังหาไม่เจอ ให้เก็บ guard ไว้แต่ `throw` ใน dev เพื่อจับตัวการ
- [ ] ลบ `console.log` ออกจาก hot path

**เกณฑ์ผ่าน:** test Phase 0 ผ่านหมด ยกเว้นข้อที่เราตั้งใจแก้ค่าคาดหวัง (ศัตรูตีต้องได้รับผลจาก status effect แล้ว)

**ความเสี่ยง:** ตัวเลข balance จะขยับ เพราะศัตรูเพิ่งเริ่มได้รับผลจาก buff/debuff จริงๆ เป็นครั้งแรก → ต้องลองเล่นจริงดูว่ายากขึ้น/ง่ายลงแค่ไหน อาจต้องจูน `src/core/balance/`

---

### Phase 2 — เปลี่ยนเทิร์นศัตรูเป็น event stream (1 วัน)

**เพิ่ม type ใน `src/core/types.ts`:**

```ts
export type CombatEvent =
  | { t: 'EnemyCardRevealed'; cardId: string; name: string; dmg: number; block: number }
  | { t: 'Damage';       target: 'player' | 'enemy'; result: DamageResult; source: DamageSource }
  | { t: 'BlockGained';  target: 'player' | 'enemy'; amount: number }
  | { t: 'StatusApplied'; target: 'player' | 'enemy'; effectId: string; stacks: number }
  | { t: 'StatusTicked';  target: 'player' | 'enemy'; effectId: string; hpDelta: number }
  | { t: 'Died';          who: 'player' | 'enemy' }
  | { t: 'TurnEnded';     who: 'player' | 'enemy' };
```

**เพิ่มใน `GameState`:**
```ts
pendingEvents: CombatEvent[];   // engine เขียน, view อ่านแล้วเคลียร์
```
> ⚠️ ต้อง default เป็น `[]` ตอน `loadGame` เพื่อไม่ให้ save เก่าพัง (`src/core/storage.ts`)

**เปลี่ยน command:**
- [ ] **ลบ** `PrepareEnemyTurn` + `ResolveEnemyCard` (คู่นี้เกิดมาเพื่อ sync อนิเมชั่นโดยเฉพาะ ไม่ต้องใช้แล้ว)
- [ ] **เพิ่ม** `ResolveEnemyTurn` — ทำเทิร์นศัตรู **ทั้งเทิร์นจบในทีเดียว** แบบ synchronous แล้ว push event ลง `pendingEvents`
- [ ] ใน loop ต้อง `break` ทันทีเมื่อ `isDefeat(s)` → แก้บั๊ก 1.5b ที่ระดับ engine (ไม่ใช่แค่ปะที่ view)
- [ ] `StartPlayerTurn` ยังอยู่ แต่ view เป็นคนเรียกหลังเล่น event หมดแล้ว

**เพิ่ม event ให้ฝั่งผู้เล่นด้วย** — `PlayCard` ก็ควร push event (Damage / BlockGained / StatusApplied) เพื่อให้ view ใช้ทางเดียวกันทั้งสองฝั่ง ไม่ต้องมีโค้ดพิเศษสำหรับเทิร์นผู้เล่น

---

### Phase 3 — View เล่น event (1-2 วัน)

**สร้าง `app/components/battle/useCombatTimeline.ts`:**

```ts
// รับ event queue → เล่นทีละตัวตามจังหวะที่ view กำหนดเอง
// คืน: event ที่กำลังเล่นอยู่, สถานะ playing, และฟังก์ชัน skip()
function useCombatTimeline(events: CombatEvent[], opts?: { speed?: number })
```

- ค่าเวลาอนิเมชั่นทั้งหมด **อยู่ในฝั่ง view เท่านั้น** ไม่ export ออกไปให้ logic ใช้อีก
- ใช้ Reanimated callback (`withTiming(..., cb)`) หรือ `runOnJS` เดินคิวแทน `setTimeout` chain → ผูกกับเฟรมจริง ไม่ drift
- ได้ **ปุ่ม skip / ปรับความเร็ว** มาฟรี (กดแล้ว drain คิวรวดเดียว, state ถูกอยู่แล้ว)

**แก้ `app/battle.tsx`:**
- [ ] ลบ `startEnemyTurn` ทั้งก้อน (`:139-201`) → เหลือ `dispatch({type:'ResolveEnemyTurn'})` แล้วส่ง `pendingEvents` เข้า timeline
- [ ] ลบ `timeoutRefs` / `addTimeout` ทั้งหมด
- [ ] damage popup อ่าน `result.hpLoss` จาก event (แก้ 1.5a) และรองรับการฮีล (แก้ 1.5c)
- [ ] ลบ effect ที่เดา HP จาก diff (`:82-88`)
- [ ] รางวัลอ่านจาก state ตรงๆ — เพิ่ม `s.lastReward = { exp, gold }` ใน `engine/shared.ts:55` แทนการ regex log (แก้ 1.5d)

**แก้ layout:**
- [ ] `HAND_CENTER_Y` → วัดจริงด้วย `onLayout` ของ MonsterArea หรือย้ายไปไฟล์ `battleLayout.ts` ที่ทั้งสอง component แชร์กัน + คิดจาก `useWindowDimensions` ให้ scale ตามจอ (แก้ 1.5e)
- [ ] ย้าย screen flash ออกมาเป็น sibling ที่ root ของหน้า ขับด้วย shared value (แก้ 1.5f)

---

### Phase 4 — เก็บกวาด (ครึ่งวัน)

- [ ] ลบ `app/components/CombatView.tsx` + import ที่ `index.tsx:19,230` (แก้ 1.5g)
- [ ] ลบ `App.tsx` ที่ root (Expo boilerplate ที่ไม่ได้ใช้)
- [ ] ลบ `src/ui/appState.ts` (ไฟล์ว่าง 0 บรรทัด)
- [ ] เช็คว่า `src/ui/components/` (HUD/Hand/Panel) กับ `src/ui/controllers/gameController.ts` ตายแล้วจริงไหม ถ้าตายก็ลบ
- [ ] ตัดสินใจเรื่อง store ซ้ำ: `src/store/gameStore.ts` vs store inline ใน `app/index.tsx` — เหลืออันเดียว
- [ ] แทน `require()` กลางฟังก์ชันด้วย static import เท่าที่ไม่ติด circular dependency (ถ้าติด แปลว่ามีปัญหา dependency graph ที่ต้องแก้จริง)

---

## 4. สรุปเวลาและลำดับ

| Phase | งาน | เวลาโดยประมาณ | ปลดล็อกอะไร |
|---|---|---|---|
| 0 | test harness | ครึ่งวัน | แก้ของอันตรายได้อย่างมั่นใจ |
| 1 | รวม damage path | 1 วัน | **แก้บั๊กกฎเกม** — status effect ทำงานครบทั้งสองฝั่ง |
| 2 | event stream | 1 วัน | กฎเกมหลุดจากอนิเมชั่น |
| 3 | view เล่น event | 1-2 วัน | อนิเมชั่นนิ่ง + skip/speed ✅ |
| 4 | เก็บกวาด | ครึ่งวัน | ฐานสะอาดพร้อมรีดีไซน์ |

**รวม ~4-5 วัน** แล้วค่อยเริ่ม CombatView ใหม่สไตล์ NotFM บนฐานที่นิ่งแล้ว

Phase 1 ให้ค่ามากที่สุดต่อเวลาที่ลง (แก้บั๊กที่กระทบ balance ทั้งเกม) — ถ้าจะหยุดกลางทาง หยุดหลัง Phase 1 ได้

---

## 5. สิ่งที่ **ไม่** แตะในแผนนี้

ยืนยันว่าของพวกนี้ดีอยู่แล้ว ไม่ใช่ต้นเหตุ และรื้อแล้วเสียของ:

- command/reducer engine (`applyCommand`) — โครงถูกต้อง
- monster pool 31 ตัว + tier progression (`thai-ghosts.ts`)
- balance table (`src/core/balance/`)
- map/page generation + force split
- shop + registry + respawn
- save/autosave + seeded RNG
- ระบบ blessing / equipment / minion (ยังไม่แตะ แต่ Phase 1 อาจทำให้ต้องต่อสายเพิ่มถ้ามันมี damage path ของตัวเอง — ต้องเช็คตอนลงมือ)

---

## 5.1 ผลจริงหลังทำ Phase 0-1 เสร็จ (2026-07-25)

**ทำแล้ว:**
- Phase 0: vitest + Vite plugin แปลง `require()` ตอน transform (ไม่แตะซอร์ส) + characterization test
- Phase 1: `src/core/combat/damage.ts` (`dealDamage` / `gainBlock`) ต่อสายครบ 3 path ของการ์ด
- ลบ `playEnemyCard` ที่ตายแล้ว + NaN guard 3 ชั้น + `console.log` ใน hot path
- รวม 31 เทสต์ผ่าน, `tsc --noEmit` สะอาด

**NaN guard — สรุปว่าเป็นซาก:** ไล่ต้นตอแล้วยืนยันว่า trigger ไม่ได้ในโค้ดปัจจุบัน
(`getStatusEffectStacks` คืน `|| 0` เสมอ, `applyComboCardModifiers` ไม่แตะ `dmg`,
`damageMultiplier` เป็น 1.0/1.2/0.9) น่าจะเหลือจาก "unified system" ที่ถูกถอดไป
แทนที่ด้วยการ validate `raw` ครั้งเดียวที่ปากทาง `dealDamage` แล้ว throw ให้เห็นชัดแทนกลืนเงียบ

**damage path ที่เหลือ — ตัดสินใจแล้วและต่อสายครบ:**

ทำให้ `source.kind` เป็นตัวกำหนดกฎเอง (`rulesFor` ใน `combat/damage.ts`) จะได้ไม่ต้องส่ง flag เพิ่ม

| kind | block | modifier ฝั่งผู้ตี | modifier ฝั่งผู้รับ | เหตุผล |
|---|---|---|---|---|
| `card` / `combo` | ✓ | ✓ | ✓ | combo เกิดจากการเล่นการ์ดของผู้เล่น = พลังของผู้เล่น จึงคิดเหมือนการ์ด |
| `status` (poison) | ✗ | ✗ | ✗ | block คือการปัดป้องหมัดที่กำลังมา แต่พิษอยู่ในตัวแล้ว — เป็นธรรมเนียมของแนวนี้ และ DoT ที่ stack ได้ต้องคาดเดาได้ |
| `minion` | ✓ (เว้นแต่ ability ระบุ `ignoresBlock`) | ✗ | ✓ | minion เป็นคนละตัวกับผู้เรียก มีพลังของตัวเอง จึงไม่สืบทอด strength |
| `event` | ✗ | ✗ | ✗ | ดาเมจเชิงเนื้อเรื่อง ไม่ใช่การต่อสู้ (จุดนี้ถูกอยู่แล้ว ไม่ได้แก้) |

---

## 5.2 พบระหว่างทาง: determinism ของทั้งเกมพัง (ยังไม่แก้)

`gameSpec.txt` ระบุว่ารันต้อง deterministic ตาม seed และ `rng.ts` เขียนหัวไฟล์ไว้เองว่า
*"Pure functional RNG (mulberry32) — no Math.random"*

แต่ **`Math.random()` ถูกใช้อยู่ 22 จุดใน `src/core`** รวมถึงจุดที่สำคัญที่สุด:

| ไฟล์ | ผลกระทบ |
|---|---|
| `monsters/thai-ghosts.ts` (9 จุด) | **เลือก tier และตัวมอนสเตอร์** → seed เดียวกันได้มอนคนละตัว |
| `combat/minions/index.ts` (3 จุด) | เลือก minion |
| `minionRuntime.ts` (2 จุด) | เลือกเป้าหมาย + `mockRng = { seed: Math.random() }` |
| `level.ts:201` | สุ่มตัวเลือกตอนเลเวลอัป |
| `adaptiveAI.ts:271` | `aggressionLevel = 40 + Math.random() * 40` |
| `shopRegistry.ts`, `combat/minions/thai-minions.ts` | สร้าง id ด้วย `Date.now()` + `Math.random()` |

**แปลว่าตอนนี้ seed เดียวกันไม่ได้ให้รันเดียวกัน** และ save/reload อาจได้ผลต่างจากเดิม
ซึ่งขัดกับ invariant ที่เกมประกาศไว้เอง

เรื่องนี้ใหญ่กว่าและครอบคลุมกว่าประเด็น `adaptiveAI` ที่เคยตั้งไว้ใน §6
จึงยุบรวมเป็นเฟสเดียวกัน:

### Phase 5 (ใหม่) — คืน determinism ให้ทั้งเกม
- ร้อย `RNG` ผ่านจุดที่สุ่มทั้ง 22 จุด แทน `Math.random()`
- ย้าย state ของ `adaptiveAI` (`currentAdaptation`, `playerPatterns`) เข้า `GameState`
  → ถูก save, ผูกกับ seed, ไม่ค้างข้ามรัน
- เปลี่ยน id ที่ใช้ `Date.now()` เป็น counter ที่ deterministic
- เพิ่มเทสต์: seed เดียวกัน → รันเหมือนกันทุกครั้ง

**ทำไมไม่แก้ตอน Phase 1:** การรื้อ `adaptiveAI` 451 บรรทัดเพื่อแก้ determinism ที่จุดเดียว
ในขณะที่อีก 21 จุดยังพังอยู่ ไม่ได้ทำให้เกม deterministic ขึ้นจริง
ควรทำทีเดียวพร้อมกันเป็นเฟสของตัวเอง

## 6. เรื่องที่ยังไม่ชัด ต้องตัดสินใจตอนลงมือ

- `getAdaptiveDamageMultiplier()` ใน `commands.ts:188-202` ใช้แบบ `1/adaptiveMult` (inverse) กับดาเมจผู้เล่น ไม่มีเอกสารว่าตั้งใจให้ทำอะไร → ต้องถามเจ้าของโค้ดว่าจะเก็บไว้หรือถอด ก่อนย้ายเข้า `dealDamage`
- ระบบ combo (`cardComboSystem.ts`) แก้ค่าการ์ดก่อนคำนวณดาเมจ → ต้องตัดสินใจว่า combo modifier อยู่ก่อนหรือหลัง status effect ใน `dealDamage` (ตอนนี้อยู่ก่อน)
- `enemyBehaviorRuntime` / `minionRuntime` มี damage path ของตัวเองหรือเปล่า ยังไม่ได้ตรวจ
