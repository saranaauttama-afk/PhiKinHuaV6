// src/core/engine/shared.ts
import type { GameState, CardData, BlessingDef } from '../types';
import type { RNG } from '../rng';
import { nextExpForLevel, expForMonster, goldForMonster } from '../balance/progression';
import { rollLevelUpChoice, rollTwoBlessings, rollThreeCards, type LevelBucket } from '../level';
import { getMonsterById, type ThaiGhostData } from '../monsters/thai-ghosts';
import { applyClassVictoryPassive, getClass } from '../classes';

export function getCurrentNodeId(map?: any): string | undefined {
  if (!map) return undefined;
  return map.currentNodeId ?? map.currentId;
}

// keep functions pure / preserve function refs (blessings & shrine options)
export function cloneForReducer(prev: GameState): GameState {
  const s: GameState = JSON.parse(JSON.stringify(prev));
  s.blessings = (prev.blessings ?? []).slice();
  if (prev.event?.type === 'shrine' && s.event?.type === 'shrine') {
    s.event.options = prev.event.options;
  }
  return s;
}

/**
 * เพิ่มพรเข้าตัวผู้เล่น — เงียบๆ ถ้ามีอยู่แล้ว
 *
 * ตาข่ายชั้นสุดท้าย: `rollTwoBlessings` กันไม่ให้เสนอพรที่ถืออยู่แล้ว
 * แต่พรถูกแจกจากสามที่ (เลเวลอัป ศาล เหตุการณ์) จุดนี้เลยกันไว้อีกชั้น
 * ให้ "ถือพรเดิมสองใบ" เป็นไปไม่ได้ ไม่ว่าจะมาทางไหน
 */
export function grantBlessing(s: GameState, b: BlessingDef): boolean {
  s.blessings = s.blessings ?? [];
  if (s.blessings.some(x => x.id === b.id)) return false;
  s.blessings.push(b);
  return true;
}

/** ปลุกเสกได้สูงสุดกี่ขั้นต่อใบ */
export const MAX_UPGRADE_LEVEL = 3;

/** ปลุกเสกไปแล้วกี่ขั้น */
export function upgradeLevelOf(c: CardData): number {
  return c.upgradeLevel ?? (c.upgraded ? 1 : 0);
}

/** ใบนี้ปลุกเสกได้อีกไหม */
export function canUpgrade(c: CardData): boolean {
  // คำสาปปลุกเสกไม่ได้ — มันไม่ได้มีไว้ใช้ตั้งแต่แรก
  if (c.type === 'curse') return false;
  return upgradeLevelOf(c) < MAX_UPGRADE_LEVEL;
}

/** จำนวนที่บวกให้ใบที่มีตัวเลข ต่อหนึ่งขั้น */
export const UPGRADE_BONUS = 4;

/**
 * ปลุกเสกการ์ดหนึ่งใบ — สูงสุด 3 ขั้น
 *
 * ของเดิมบวก +3 dmg / +3 block ให้ทุกใบเหมือนกันหมด **ไม่จำกัดจำนวนครั้ง**
 * อัพใบเดิมสามรอบได้ชื่อ "ฟันดาบ + + +" และตัวเลขวิ่งหนีทั้งสำรับ — ทางที่ดีที่สุด
 * คือทุ่มทองใส่ใบเดียวแล้วถือยาว รอบก่อนหน้านี้จึงจำกัดไว้ครั้งเดียวต่อใบ
 * ซึ่งแก้ปัญหาแต่ตัดความรู้สึกว่า "การ์ดใบนี้คือใบที่เราปั้นมา" ทิ้งไปด้วย
 *
 * ตอนนี้อยู่ตรงกลาง: ปลุกได้ถึงขั้น 3 มีเพดานชัดเจน และ **ราคาขึ้นตามขั้นของใบนั้น**
 * (ดู `upgradeCostForCount`) ไม่ใช่ตามจำนวนครั้งที่ใช้ร้านอย่างเดียว
 *
 * สูตรแยกตามสิ่งที่ใบนั้นทำจริง:
 *   - มีตัวเลขโจมตี/กัน → บวกตัวเลขนั้น
 *   - ไม่มีตัวเลขเลย (ใบผลพิเศษ) → ลดค่าร่ายลงหนึ่ง ค่าร่ายศูนย์แล้วก็จั่วเพิ่มหนึ่ง
 *   - การ์ดดัก → บวกให้ผลที่เป็นตัวเลขของกับดัก
 *
 * **ใบที่ใช้แล้วหายยังหายเหมือนเดิม** — ใบ exhaust ทั้งหกในเกมไม่มีตัวเลขให้บวก
 * มันเป็นผลพิเศษล้วน และสองใบในนั้นคือ "ฟื้นเต็มหลอด + กันสถานะ 3 เทิร์น" กับ
 * "ฟื้น 8 และ Max HP +2 ถาวร" — ปลดข้อจำกัดให้ = ร่ายซ้ำได้ไม่จำกัด
 */
export function upgradeCard(c: CardData): CardData {
  if (!canUpgrade(c)) return c;

  const level = upgradeLevelOf(c) + 1;
  const up: CardData = {
    ...c,
    name: `${stripPlus(c.name ?? c.id)} +${level}`,
    upgraded: true,
    upgradeLevel: level,
  };

  // การ์ดดัก: ตัวเลขอยู่ในผลของกับดัก ไม่ได้อยู่บนตัวการ์ด
  if (up.type === 'trap' && up.trap) {
    up.trap = {
      ...up.trap,
      effects: up.trap.effects.map(e =>
        e.type === 'negate' ? e : { ...e, value: e.value + UPGRADE_BONUS }
      ),
    };
    return up;
  }

  const hasNumbers = typeof up.dmg === 'number' || typeof up.block === 'number';
  if (hasNumbers) {
    if (typeof up.dmg === 'number') up.dmg += UPGRADE_BONUS;
    if (typeof up.block === 'number') up.block += UPGRADE_BONUS;
    return up;
  }

  if ((up.cost ?? 0) > 0) up.cost = up.cost - 1;
  else up.draw = (up.draw ?? 0) + 1;
  return up;
}

/** ตัด " +2" ท้ายชื่อออกก่อนเติมขั้นใหม่ ไม่งั้นชื่อจะยาวขึ้นเรื่อยๆ */
function stripPlus(name: string): string {
  return name.replace(/\s*\+\d+$/, '');
}

/** tier ของผีที่เพิ่งถูกฆ่า — อ่านจาก enemy ที่ยังอยู่ใน state ตอนชนะ */
function defeatedMonsterTier(s: GameState): ThaiGhostData['tier'] | undefined {
  const id = s.enemy?.id;
  if (!id) return undefined;
  return getMonsterById(id)?.tier;
}

export function grantExpAndQueueLevelUp(s: GameState, r: RNG): RNG {
  // Increment fight count for boss timing
  s.fightCount = (s.fightCount || 0) + 1;

  // รางวัลคิดจาก tier ของผีที่เพิ่งฆ่าจริงๆ (T1…T5/Elite/Boss)
  // เดิมใช้ก้อนเดียวสำหรับทุกตัวที่ไม่ใช่ elite/boss ผีกระสือกับผีพราย
  // จึงให้รางวัลเท่ากันทั้งที่ HP ต่างกัน 4 เท่า
  const tier = defeatedMonsterTier(s);
  const gained = expForMonster(tier);
  const gold = goldForMonster(tier);

  s.player.exp += gained;
  s.player.gold = (s.player.gold || 0) + gold;

  // พรติดตัวของคลาสที่ทำงานตอนชนะไฟต์ (แม่ชีฟื้นเลือดข้ามไฟต์)
  applyClassVictoryPassive(s);
  const goldResult = { amount: gold };

  // เก็บรางวัลไว้เป็นข้อมูล ไม่ใช่ให้ UI ไปแกะจากข้อความ log
  // (log เป็นข้อความสำหรับคนอ่าน — พอ rewrite ข้อความเกม regex จะพังทันที)
  s.lastReward = { exp: gained, gold: goldResult.amount };

  s.log.push(`Victory! +${gained} EXP, +${goldResult.amount} gold`);

  while (s.player.exp >= s.player.expToNext) {
    s.player.exp -= s.player.expToNext;
    s.player.level += 1;
    s.player.expToNext = nextExpForLevel(s.player.level);

    if (!s.levelUp || s.levelUp.consumed) {
      const rolled = rollLevelUpChoice(r, s); r = rolled.rng;
      const choice = rolled.choice;
      let cardChoices, blessingChoices;
      
      // Check if either option needs additional choices (cards/blessings)
      if (choice.optionA === 'cards' || choice.optionB === 'cards') {
        const rr = rollThreeCards(r, s.player.level, getClass(s.classId).cardTag); r = rr.rng; cardChoices = rr.list;
      }
      if (choice.optionA === 'blessing' || choice.optionB === 'blessing') {
        const owned = (s.blessings ?? []).map(b => b.id);
        const bb = rollTwoBlessings(r, owned); r = bb.rng; blessingChoices = bb.list;
      }
      
      s.levelUp = { choice, cardChoices, blessingChoices, consumed: false };
    } else {
      s.log.push('LevelUp queued (multiple levels).');
    }
  }
  return r;
}
