// src/core/engine/shared.ts
import type { GameState, CardData } from '../types';
import type { RNG } from '../rng';
import { nextExpForLevel, expForMonster, goldForMonster } from '../balance/progression';
import { rollLevelUpChoice, rollTwoBlessings, rollThreeCards, type LevelBucket } from '../level';
import { getMonsterById, type ThaiGhostData } from '../monsters/thai-ghosts';

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

export function upgradeCard(c: CardData): CardData {
  const up = { ...c, name: (c.name ?? c.id) + ' +' };
  if (typeof up.dmg === 'number') up.dmg += 3;
  if (typeof up.block === 'number') up.block += 3;
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
        const rr = rollThreeCards(r, s.player.level); r = rr.rng; cardChoices = rr.list;
      }
      if (choice.optionA === 'blessing' || choice.optionB === 'blessing') {
        const bb = rollTwoBlessings(r); r = bb.rng; blessingChoices = bb.list;
      }
      
      s.levelUp = { choice, cardChoices, blessingChoices, consumed: false };
    } else {
      s.log.push('LevelUp queued (multiple levels).');
    }
  }
  return r;
}
