// src/core/engine/shared.ts
import type { GameState, CardData, BlessingDef } from '../types';
import type { RNG } from '../rng';
import { nextExpForLevel, expForMonster, goldForMonster } from '../balance/progression';
import { rollThreeCards } from '../level';
import { LEVEL_UP, CARD_RULES } from '../balance/notfm';
import { rollCardReward } from '../cards/reward';
import { starOf } from '../cards/model';
import { STAR_RULES } from '../balance/notfm';
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
  applyBlessingGain(s, b);
  return true;
}

/** One-time effects of a blessing (แพนโดรา). HP never drops below 1 from a blessing. */
export function applyBlessingGain(s: GameState, b: BlessingDef): void {
  const g = b.onGain;
  if (!g) return;
  const p = s.player;
  if (g.maxHp) { p.maxHp = Math.max(1, p.maxHp + g.maxHp); if (g.maxHp > 0 && !g.hp) p.hp += g.maxHp; }
  if (g.hp) p.hp += g.hp;
  p.hp = Math.max(1, Math.min(p.maxHp, p.hp));
  if (g.gold) p.gold = (p.gold ?? 0) + g.gold;
  // Pandora gains stop at the level-up caps too (review 14 Oct 2026: AP 4 and a 4th slot were reachable).
  if (g.ap) { p.maxAp = Math.max(p.maxAp, Math.min(LEVEL_UP.caps.ap, p.maxAp + g.ap)); p.ap = p.maxAp; }
  if (g.draw) p.drawPerTurn = g.draw>0?Math.max(p.drawPerTurn,Math.min(LEVEL_UP.caps.draw,p.drawPerTurn+g.draw)):Math.max(1,p.drawPerTurn+g.draw);
  if (g.retain) p.retain = g.retain>0?Math.max(p.retain??CARD_RULES.retain,Math.min(LEVEL_UP.caps.retain,(p.retain ?? CARD_RULES.retain) + g.retain)):Math.max(0,(p.retain??CARD_RULES.retain)+g.retain);
  if (g.startMana) p.startMana = (p.startMana ?? 0) + g.startMana;
  if (g.slot) s.equipmentSlotsMax = Math.max(s.equipmentSlotsMax ?? 1, Math.min(LEVEL_UP.caps.slot, (s.equipmentSlotsMax ?? 1) + g.slot));
}

/** Two different level-up rewards, weighted by LEVEL_UP.weights, skipping ones that cannot be used. */
export function rollLevelOffers(s: GameState, r: RNG): { rng: RNG; list: import('../types').LevelOption[] } {
  const { int } = require('../rng');
  const usable: Record<import('../types').LevelOption, boolean> = {
    ap:s.player.maxAp<LEVEL_UP.caps.ap,
    mana:s.player.startMana<LEVEL_UP.caps.mana&&require('../pack').classUsesMana(s.classId),
    draw:s.player.drawPerTurn<LEVEL_UP.caps.draw,
    card: true,
    upgrade: s.masterDeck.some(canUpgrade),
    remove: s.masterDeck.some(c => canRemoveCard(c, s.masterDeck.length)),
    slot: (s.equipmentSlotsMax ?? 1) < LEVEL_UP.caps.slot,
    retain: (s.player.retain ?? CARD_RULES.retain) < LEVEL_UP.caps.retain,
  };
  let pool = (Object.keys(LEVEL_UP.weights) as import('../types').LevelOption[]).filter(o => usable[o] && LEVEL_UP.weights[o]>0);
  const list: import('../types').LevelOption[] = [];
  while (list.length < LEVEL_UP.offers && pool.length) {
    const total = pool.reduce((n, o) => n + LEVEL_UP.weights[o], 0);
    const roll = int(r, 1, total); r = roll.rng;
    let v = roll.value, pick = pool[0];
    for (const o of pool) { v -= LEVEL_UP.weights[o]; if (v <= 0) { pick = o; break; } }
    list.push(pick); pool = pool.filter(o => o !== pick);
  }
  return { rng: r, list };
}

/** Nights cleared across all runs, for แพนโดรา unlocks (set at NewRun). */
export function blessingTier(s: Partial<GameState>): number { return s.campaign?.blessingTier ?? 0; }

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
  const {NIGHT_EXP}=require('../balance/notfm'),n=Math.max(0,Math.min(2,(s.campaign?.night??1)-1));
  const gained = s.pages?.adventure?(offer?.kind==='boss'?NIGHT_EXP.boss[n]:elite?NIGHT_EXP.elite[n]:NIGHT_EXP.normal[n]):expForMonster(tier);
  const {ECONOMY}=require('../balance/notfm');
  const gold = s.pages?.adventure?(offer?.kind==='boss'?ECONOMY.gold.boss:elite?ECONOMY.gold.elite:Math.round(goldForMonster(tier)*ECONOMY.gold.normalPct/100)):goldForMonster(tier);

  s.player.exp += gained;
  require('../campaign/alignment').queueGhostTalk(s);
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

    // Every level: more max HP and a partial heal (LEVEL_UP.healPct). One reward choice at a time.
    s.player.maxHp += LEVEL_UP.maxHp;
    s.player.hp = Math.min(s.player.maxHp, s.player.hp + LEVEL_UP.maxHp + Math.round(s.player.maxHp * LEVEL_UP.healPct / 100));
    if (!s.levelUp || s.levelUp.consumed) {
      const rolled = rollThreeCards(r, s.player.level, s.classId,s.campaign?.milestoneLevel??0); r = rolled.rng;
      const offers = rollLevelOffers(s, r); r = offers.rng;
      s.levelUp = { cards: rolled.list, offers: offers.list, consumed: false };
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
  if (s.ghostTalk) {
    s.phase = 'talk';
    return;
  }
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
