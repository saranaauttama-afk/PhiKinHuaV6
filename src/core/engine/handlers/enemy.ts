import {drawEnemyHand,initializeEnemyHand,consumeEnemyCard,finishEnemyHand} from '../../combat/enemyHand';
import {chooseEnemyCardIndexes} from '../../combat/enemyPlan';
// src/core/engine/handlers/enemy.ts
import type { GameState } from '../../types';
import type { RNG } from '../../rng';
import { int } from '../../rng';
import { enemyCardById, poolForOwner } from '../../pack_enemy_cards';
import {
  ENEMY_DECK_SIZE, ENEMY_HAND_SIZE,
  ENEMY_MAX_ENERGY_NORMAL, ENEMY_MAX_ENERGY_ELITE, ENEMY_MAX_ENERGY_BOSS
} from '../../balance/core';
// PATCH: import equipment hooks for enemy start/end & on_card_played

type DeckConfig =
  | { lists: Array<{ id: string; weight: number; cards: string[] }>; handSize?: number; maxEnergy?: number }
  | { pool: { allowOwners: string[]; include?: Array<{ id: string; w: number }>; minAttack?: number; minBlock?: number }, handSize?: number; maxEnergy?: number };

// ====== utils ======
function shuffleIds(ids: string[], r: RNG) {
  const a = ids.slice();
  let rr = r;
  for (let i = a.length - 1; i > 0; i--) {
    const ro = int(rr, 0, i);
    rr = ro.rng;
    const j = ro.value;
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return { arr: a, rng: rr };
}

function defaultCycleForTier(tier: 'normal'|'elite'|'boss'): string[] {
  if (tier === 'elite') return ['swipe','swipe','brace','guard'];
  if (tier === 'boss')  return ['maul','brace','maul','guard','swipe'];
  return ['claw','guard','claw','claw'];
}

function tierFromEnemy(s: GameState): 'normal'|'elite'|'boss' {
  const id = s.enemy?.id ?? '';
  if (/boss/i.test(id)) return 'boss';
  if (/elite/i.test(id)) return 'elite';
  return 'normal';
}

function maxEnergyForTier(t: 'normal'|'elite'|'boss') {
  if (t === 'elite') return ENEMY_MAX_ENERGY_ELITE;
  if (t === 'boss')  return ENEMY_MAX_ENERGY_BOSS;
  return ENEMY_MAX_ENERGY_NORMAL;
}

// ====== build at combat start ======
export function buildAndShuffleEnemyDeck(s: GameState, r: RNG) {
  if (!s.enemy) return { state: s, rng: r };
  const t = tierFromEnemy(s);

  // ✅ 1) ถ้ามี deck config → ใช้เลย
  const deckCfg = ((s.enemy as any).deck) || ((s.enemy as any).ai?.deck);
  let ids: string[] | null = null;
  let handSizeCfg: number | undefined;
  let maxEnergyCfg: number | undefined;

  if (deckCfg) {
    const out = buildDeckFromConfig(s.enemy.id, deckCfg, r);
    r = out.rng;
    ids = out.ids;
    handSizeCfg = out.handSize;
    maxEnergyCfg = out.maxEnergy;
  }

  // ✅ 2) ถ้าไม่มี deck config → fallback เป็น cycle (กรณีตัวเก่ายังไม่ย้าย)
  if (!ids) {
    const cycle: string[] =
      ((s as any).enemyAi?.cycle?.length ? (s as any).enemyAi.cycle.slice()
       : (s.enemy as any)?.ai?.cycle?.length ? (s.enemy as any).ai.cycle.slice()
       : defaultCycleForTier(t));

    ids = [];
    for (let i = 0; ids.length < ENEMY_DECK_SIZE; i++) {
      ids.push(cycle[i % cycle.length]);
    }
  }

  // สุ่มลำดับเด็คหนึ่งครั้งให้ deterministic
  const sh = shuffleIds(ids, r);
  (s as any).enemyPiles = { draw: sh.arr, hand: [], discard: [] };
  (s as any).enemyEnergy = 0;s.enemy.energy=0;s.enemy.handCount=0;

  // ใช้ค่าจาก deck config ถ้ามี ไม่งั้น default ตาม tier
  (s as any).enemyHandSize = handSizeCfg ?? (s as any).enemyHandSize ?? ENEMY_HAND_SIZE;
  (s as any).enemyMaxEnergy = maxEnergyCfg ?? (s as any).enemyMaxEnergy ?? maxEnergyForTier(t);

  s.enemyDrawPerTurn=undefined;s.enemyMaxRetained=undefined;s.enemyHandAges=[];s.enemyIdleTurns=0;
  // New encounters use tier rules; episode-specific hand limits remain authored.
  const rules=require('../../combat/enemyHand').ENEMY_HAND_RULES[require('../../combat/enemyHand').enemyKind(s)];
  s.enemyHandSize=Math.max(handSizeCfg??0,rules.handSize);s.enemy.handSize=s.enemyHandSize;
  initializeEnemyHand(s);

  // preview intent
  (s as any).enemyIntentCardId = (s as any).enemyPiles.draw[0];

  return { state: s, rng: sh.rng };
}

function buildDeckFromConfig(_enemyId: string, cfg: DeckConfig, r: RNG): { ids: string[]; rng: RNG; handSize?: number; maxEnergy?: number } {
  let rr = r;
  if ('lists' in cfg && cfg.lists?.length) {
    const total = cfg.lists.reduce((a,c)=>a+(c.weight||0),0) || 1;
    const ro = int(rr, 0, total-1); rr = ro.rng;
    let acc=0, pick = cfg.lists[0];
    for (const opt of cfg.lists) { acc += (opt.weight||0); if (ro.value < acc) { pick = opt; break; } }
    const ids = pick.cards.slice();
    return { ids, rng: rr, handSize: cfg.handSize, maxEnergy: cfg.maxEnergy };
  }

  // Handle pool config
  if ('pool' in cfg && cfg.pool?.allowOwners) {
    const { allowOwners, minAttack, minBlock } = cfg.pool;

    // เดิมอ่านการ์ดจาก `pack.enemyCards || pack.default` ซึ่งไม่มีอยู่จริง
    // (โมดูลนี้ export เป็นฟังก์ชัน) → รายการว่างเสมอ แล้วตกไป fallback claw/guard
    // เงียบๆ ทำให้ deck config ไม่เคยถูกใช้เลย ทั้งที่ poolForOwner มีไว้เพื่อการนี้
    const allCards = poolForOwner(allowOwners)
      .filter(card => !minAttack || (card.dmg ?? 0) >= minAttack)
      .filter(card => !minBlock || (card.block ?? 0) >= minBlock)
      .map(card => card.id);

    if (allCards.length > 0) {
      const ids: string[] = [];
      for (let i = 0; i < ENEMY_DECK_SIZE; i++) {
        const ro = int(rr, 0, allCards.length - 1);
        rr = ro.rng;
        ids.push(allCards[ro.value]);
      }
      return { ids, rng: rr, handSize: cfg.handSize, maxEnergy: cfg.maxEnergy };
    }
  }

  // fallback: วน cycle เริ่มต้น (กันเด็คว่าง)
  const ids: string[] = defaultCycleForTier('normal').slice(0, ENEMY_DECK_SIZE);
  return { ids, rng: rr, handSize: cfg.handSize, maxEnergy: cfg.maxEnergy };
}

// Compatibility name; v34 draws a fixed count rather than filling the whole hand.
export const enemyDrawUpToHand=drawEnemyHand;

export function enemyPlayCardId(s: GameState, idx: number): boolean {
  const piles = (s as any).enemyPiles as { draw: string[]; hand: string[]; discard: string[] } | undefined;
  if (!s.enemy || !piles) {
    s.log.push(`DEBUG: enemyPlayCardId - No enemy or piles`);
    return false;
  }
  if (idx < 0 || idx >= piles.hand.length) {
    s.log.push(`DEBUG: enemyPlayCardId - Invalid index ${idx}, hand size: ${piles.hand.length}`);
    return false;
  }

  const id = piles.hand[idx];
  const def = enemyCardById(id);
  if(!def){piles.discard.push(piles.hand.splice(idx,1)[0]);s.enemyHandAges?.splice(idx,1);s.enemy.handCount=piles.hand.length;return false;}
  if(!consumeEnemyCard(s,idx))return false;

  // เล่นเอฟเฟ็กต์
  require('../../combat/enemyCardEffects').resolveEnemyCard(s, def);

  return true;
}

export function enemyDiscardHand(s: GameState) {
  s.enemyHandAges=[];
  if(s.enemy)s.enemy.handCount=0;
  const piles = (s as any).enemyPiles as { draw: string[]; hand: string[]; discard: string[] } | undefined;
  if (!piles) return;
  if (piles.hand.length > 0) {
    piles.discard.push(...piles.hand.splice(0, piles.hand.length));
  }
}

export function runEnemyTurn(s: GameState) {
  if (!s.enemy) {
    s.log.push(`DEBUG: runEnemyTurn - No enemy found`);
    return;
  }
  if (!(s as any).enemyPiles) {
    s.log.push(`DEBUG: runEnemyTurn - No enemy piles found, enemy deck not initialized`);
    return;
  }

  // Simple behavior system - Night of the Full Moon style
  const { processEnemyTurnBehaviors } = require('../../enemyBehaviorRuntime');
  
  // PATCH: equipment once-per-turn reset and start-turn hook for ENEMY

  // Process simple enemy behaviors (just basic defend/attack patterns)
  processEnemyTurnBehaviors(s);

  // เริ่มเทิร์นศัตรู
  s.enemy.block = 0;
  (s as any).enemyEnergy=s.enemy.maxEnergy??(s as any).enemyMaxEnergy??ENEMY_MAX_ENERGY_NORMAL;
  s.enemy.energy=(s as any).enemyEnergy;
  // จั่วถึงขนาดมือ
  enemyDrawUpToHand(s);
  s.enemy.handCount=(s as any).enemyPiles?.hand?.length??0;

  const piles = (s as any).enemyPiles as { draw: string[]; hand: string[]; discard: string[] };
  const startHand = piles?.hand?.length ?? 0;
  let plays = 0;

  // Log เริ่มเทิร์น
  s.log.push(`Enemy turn: hand=${startHand}, energy=${(s as any).enemyEnergy}`);
  s.log.push(`DEBUG: Enemy hand contents: [${piles.hand.join(', ')}]`);

  const consumed:number[]=[];
  for(const original of chooseEnemyCardIndexes(s,piles.hand,s.enemyEnergy??0)){
    if(s.player.hp<=0||s.enemy.hp<=0)break;
    const index=original-consumed.filter(i=>i<original).length;
    if(enemyPlayCardId(s,index)){consumed.push(original);plays++;}
  }
  finishEnemyHand(s,plays);

  // Simplified - no complex minion or status effect processing

  // PATCH: equipment end-turn hook for ENEMY

  // ตั้ง intent preview สำหรับเทิร์นถัดไป = ไพ่บนสุดของ draw (ถ้ามี)
  (s as any).enemyIntentCardId = (s as any).enemyPiles.draw[0];
}
