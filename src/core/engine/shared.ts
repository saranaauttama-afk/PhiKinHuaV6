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

/** ใบนี้ปลุกเสกได้อีกไหม */
export function canUpgrade(c: CardData): boolean {
  return !c.upgraded;
}

/** จำนวนที่บวกให้ใบที่มีตัวเลข */
export const UPGRADE_BONUS = 4;

/**
 * ปลุกเสกการ์ดหนึ่งใบ — **ครั้งเดียวต่อใบ**
 *
 * ของเดิมบวก +3 dmg / +3 block ให้ทุกใบเหมือนกันหมด แล้วเติม " +" ท้ายชื่อ
 * โดยไม่จำกัดจำนวนครั้ง อัพใบเดิมสามรอบได้ชื่อ "ฟันดาบ + + +" และตัวเลขวิ่งหนี
 * ทั้งสำรับ — ทางที่ดีที่สุดคือทุ่มทองใส่ใบเดียวแล้วถือยาว
 *
 * สูตรตอนนี้แยกตามสิ่งที่ใบนั้นทำจริง:
 *   - มีตัวเลขโจมตี/กัน → บวกตัวเลขนั้น
 *   - ไม่มีตัวเลขเลย (ใบผลพิเศษ) → ลดค่าร่ายลงหนึ่ง ได้ใช้เร็วขึ้นหนึ่งเทิร์น
 *     ค่าร่ายศูนย์อยู่แล้วก็ให้จั่วเพิ่มหนึ่งใบแทน
 *
 * **ใบที่ใช้แล้วหายยังหายเหมือนเดิม** — ตอนแรกตั้งใจให้การปลุกเสกปลดข้อจำกัดนี้
 * แต่ใบ exhaust ทั้งหกใบในเกมไม่มีตัวเลขให้บวกเลย มันเป็นผลพิเศษล้วนๆ และสองใบ
 * ในนั้นคือ "ฟื้นเต็มหลอด + กันสถานะ 3 เทิร์น" กับ "ฟื้น 8 และ **Max HP +2 ถาวร**"
 * ปลดข้อจำกัดให้ = ร่ายซ้ำได้ไม่จำกัด = เลือดสูงสุดไม่มีเพดานและตายไม่เป็น
 */
export function upgradeCard(c: CardData): CardData {
  if (!canUpgrade(c)) return c;

  const up: CardData = { ...c, name: (c.name ?? c.id) + ' +', upgraded: true };

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
