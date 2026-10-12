// src/core/engine/shared.ts
import type { GameState, CardData, BlessingDef } from '../types';
import type { RNG } from '../rng';
import { nextExpForLevel, expForMonster, goldForMonster } from '../balance/progression';
import { rollLevelUpChoice, rollTwoBlessings, type LevelBucket } from '../level';
import { rollCardReward } from '../cards/reward';
import { starOf } from '../cards/model';
import { STAR_RULES } from '../balance/notfm';
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

export function canRemoveCard(card:CardData|undefined,deckSize:number):boolean {
 return !!card&&deckSize>1&&!card.unremovable&&card.id!=='qa_phra_prathan';
}

/** Upgrades raise a card from 1 to 3 stars (ช่างตีเหล็ก). */
export const MAX_UPGRADE_LEVEL = STAR_RULES.maxStar - 1;
/** Upgrades already applied (star − 1). */
export function upgradeLevelOf(c: CardData): number {
  return starOf(c) - 1;
}
export function canUpgrade(c: CardData): boolean {
  return c.type !== 'curse' && !c.borrowed && starOf(c) < STAR_RULES.maxStar;
}
/** One more star. Numbers follow `STAR_RULES` or the card's own star values. */
export function upgradeCard(c: CardData): CardData {
  if (!canUpgrade(c)) return c;
  return { ...c, star: starOf(c) + 1 };
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
  const offer=s.pages?.current?.offers[s.pages._activeOfferIndex??-1];
  const elite=offer?.kind==='monster'&&offer.tier==='elite';
  const gained = s.pages?.adventure?(offer?.kind==='boss'?60:elite?32:18):expForMonster(tier);
  const gold = s.pages?.adventure?(offer?.kind==='boss'?60:elite?28:18):goldForMonster(tier);

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
      let blessingChoices;

      if (choice.optionA === 'blessing' || choice.optionB === 'blessing') {
        const owned = (s.blessings ?? []).map(b => b.id);
        const bb = rollTwoBlessings(r, owned); r = bb.rng; blessingChoices = bb.list;
      }

      s.levelUp = { choice, blessingChoices, consumed: false };
    } else {
      s.log.push('LevelUp queued (multiple levels).');
    }
  }

  // การ์ดรางวัลเป็นของ "ชนะไฟต์" ไม่ใช่ของ "เลเวลอัป" — ทุกไฟต์ที่ชนะได้เลือก
  // The finite adventure gives cards for elites/bosses; ordinary fights give XP/money.
  if(!s.pages?.adventure||offer?.kind==='boss'||(offer?.kind==='monster'&&offer.tier==='elite'))r=rollCardReward(s,r);
  else s.cardReward=undefined;

  return r;
}

/**
 * ชนะไฟต์แล้วต้องไปหน้าไหนต่อ — จุดเดียวที่ตัดสิน
 *
 * มีของค้างให้เลือกได้สองอย่างและมันมาไม่พร้อมกัน (เลเวลอัปมาเฉพาะไฟต์ที่
 * ดันข้ามขั้น การ์ดรางวัลมาทุกไฟต์) ถ้าปล่อยให้แต่ละที่ตัดสินเอง จะมีเส้นทาง
 * ที่กระโดดข้ามรางวัลไปเงียบๆ — ซึ่งเคยเกิดมาแล้วกับ phase 'levelup' ที่ถูก
 * VictoryOverlay กลืนไปทั้ง phase
 */
export function advanceAfterVictory(s: GameState): void {
  if (s.levelUp && !s.levelUp.consumed) {
    s.phase = 'levelup';
    s.log.push('Level Up!');
    return;
  }
  if (s.cardReward) {
    s.phase = 'reward';
    return;
  }
  s.phase = 'victory';
  s.log.push('Victory!');
}
