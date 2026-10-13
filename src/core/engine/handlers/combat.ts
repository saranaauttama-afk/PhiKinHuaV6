import {historySnapshot,recordCardHistory} from '../../combat/cardHistory';
import {consumeEnemyCard,finishEnemyHand} from '../../combat/enemyHand';
// src/core/engine/handlers/combat.ts — player card play and the enemy turn
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { isVictory, isDefeat, startPlayerTurn, startCombat } from '../../commands';
import { planEnemyIntent } from '../../combat/intent';
import { grantExpAndQueueLevelUp, advanceAfterVictory } from '../shared';
import { emit } from '../../combat/damage';
import { loseRun } from './runEnd';
import { springTraps, tickTraps } from '../../combat/traps';
import { applyHeldEffects, countCardPlayed } from '../../cards/mechanics';
import { discardCurses } from '../../cards/curse';
import { TEST_WIN_CARD_ID, testWinCardEnabled } from '../../cards/testWin';
import { playCard } from '../../cards/play';
import { runTriggers } from '../../cards/passives';
import { cardFromEnemy } from '../../cards/borrow';
import { CLASS_PASSIVES } from '../../balance/notfm';
import { enemyCardCost } from '../../pack_enemy_cards';
import { cardFx as enemyCardFx } from '../../combat/enemyCardEffects';
import { describeCard } from '../../cards/describe';

/** Resolve deaths from helper/status/trap effects as well as direct played cards. */
/** Medium passive: the first ghost card revealed each fight is copied into hand. */
function mimicGhostCard(s: GameState, def: import('../../pack_enemy_cards').EnemyCardDef): void {
  if (!s.classId || !CLASS_PASSIVES[s.classId].copyFirstGhostCard || !s.fight || s.fight.mimicUsed) return;
  s.fight.mimicUsed = true;
  if (s.piles.hand.length >= s.player.handMax) return;
  const card = cardFromEnemy(def, true);
  card.name = 'ยืม·' + card.name;
  card.instanceId = `mimic__${def.id}__${s.cardHistorySeq ?? 0}`;
  s.piles.hand.push(card);
  s.log.push(`ผีติดตาม: ได้สำเนา ${def.name}`);
}

export function settleCombat(s: GameState, r: RNG): RNG {
  if (s.phase !== 'combat') return r;
  if (s.enemy && s.enemy.hp <= 0 && !s.combatVictoryLock && require('../../campaign/bossRules').tryBossRevive(s)) return r;
  if (isDefeat(s)) {
    loseRun(s);
  } else if (isVictory(s) && !s.combatVictoryLock) {
    r = grantExpAndQueueLevelUp(s, r);
    s.combatVictoryLock = true;
    advanceAfterVictory(s);
  }
  return r;
}

export function play(s: GameState, cmd: Extract<Command, { type: 'PlayCard' }>, r: RNG) {
  if (s.phase !== 'combat' || s.combatVictoryLock) return { state: s, rng: r };
  const idx = cmd.index;
  if (idx < 0 || idx >= s.piles.hand.length) return { state: s, rng: r };
  const played = s.piles.hand[idx];
  if (played.id === TEST_WIN_CARD_ID) {
    if (!testWinCardEnabled() || !s.enemy) return { state: s, rng: r };
    countCardPlayed(s);
    s.piles.exhaust.push(s.piles.hand.splice(idx, 1)[0]);
    s.enemy.hp = 0;
    if (s.fight?.relic) s.fight.relic.broken = true; // the test card wins outright, no revive
    s.log.push('พระประธาน: ชนะการต่อสู้ทันที (ทดสอบ)');
    r = settleCombat(s, r);
    return { state: s, rng: r };
  }
  const out = playCard(s, idx, r, cmd.wait);
  r = out.rng;
  if (!out.played) return { state: s, rng: r };
  r = settleCombat(s, r);
  return { state: s, rng: r };
}

/**
 * จบเทิร์นผู้เล่น — ส่งต่อให้ `resolveEnemyTurn` ทั้งดุ้น
 *
 * เดิมตรงนี้เป็นสำเนาที่สองของลำดับจบเทิร์นทั้งชุด และมันแตกออกจากกันไปเรื่อยๆ
 * ตามของที่เพิ่มเข้ามาทีหลัง — ไม่มีกับดักนับถอยหลัง ไม่มีการทิ้งคำสาป
 * ไม่มีการ์ดค้างมือ เกมจริงไม่เคยเรียก `EndTurn` เลยสักครั้ง
 * (`battle.tsx` ส่ง `ResolveEnemyTurn` ทางเดียว) มีแต่เทสต์ที่ยังเรียก —
 * ซึ่งแปลว่าเทสต์กำลังตรวจเส้นทางที่เกมไม่ได้ใช้
 */
/** Cards kept past the end of a turn (NOTFM). */
export function retainLimit(s: GameState): number {
  return Math.max(0,(s.player.retain ?? require('../../balance/notfm').CARD_RULES.retain)+require('../../cards/passives').ruleModifier(s,'retain'));
}
/** How many cards must be discarded before the turn can end. */
export function turnEndExcess(s: GameState): number {
  return Math.max(0, s.piles.hand.filter(c => c.type !== 'curse').length - retainLimit(s));
}
function enforceRetain(s: GameState): boolean {
  const over = turnEndExcess(s);
  if (!over) return false;
  const keep = s.piles.hand.filter(c => c.type === 'curse'), rest = s.piles.hand.filter(c => c.type !== 'curse');
  const dropped = rest.splice(rest.length - over, over);
  s.piles.hand = [...rest, ...keep];
  s.piles.discard.push(...dropped);
  s.log.push(`มือเกิน ${retainLimit(s)} ใบ: ทิ้ง ${dropped.map(c => c.name).join(', ')}`);
  return true;
}

/** The player's picks to get down to the retain limit at the end of the turn. */
export function discardForTurnEnd(s: GameState, cmd: Extract<Command, { type: 'DiscardForTurnEnd' }>, r: RNG) {
  if (s.phase !== 'combat') return { state: s, rng: r };
  const picks = [...new Set(cmd.indices)].filter(i => Number.isInteger(i) && s.piles.hand[i]);
  if (picks.length !== turnEndExcess(s)) return { state: s, rng: r };
  const dropped = picks.map(i => s.piles.hand[i]);
  s.piles.hand = s.piles.hand.filter((_, i) => !picks.includes(i));
  s.piles.discard.push(...dropped);
  s.log.push(`ทิ้งท้ายเทิร์น: ${dropped.map(c => c.name).join(', ')}`);
  if(dropped.length)r=runTriggers(s,'discard',r);
  return { state: s, rng: r };
}

export function endTurn(s: GameState, _cmd: Extract<Command, { type: 'EndTurn' }>, r: RNG) {
  return resolveEnemyTurn(s, { type: 'ResolveEnemyTurn' }, r);
}

export function startPlayerTurnHandler(s: GameState, _cmd: Extract<Command, { type: 'StartPlayerTurn' }>, r: RNG) {
  if (s.phase !== 'combat') return { state: s, rng: r };
  s.turn=(s.turn??1)+1;
  ({ state: s, rng: r } = startPlayerTurn(s, r));
  r = settleCombat(s, r);
  if (s.phase === 'combat' && !!s.campaign) planEnemyIntent(s);
  return { state: s, rng: r };
}

export function start(s: GameState, cmd: Extract<Command, { type: 'StartCombat' }>, r: RNG) {
  s.turn = 1;
  r = startCombat(s, cmd.monsterId, r) ?? r;
  return { state: s, rng: r };
}

// Kept for apply.ts compatibility — legacy endTurn handles all enemy card playing
export function enemyPlayCard(s: GameState, _cmd: Extract<Command, { type: 'EnemyPlayCard' }>, r: RNG) {
  return { state: s, rng: r };
}

export function startMonsterTurn(s: GameState, _cmd: Extract<Command, { type: 'StartMonsterTurn' }>, r: RNG) {
  return { state: s, rng: r };
}

/**
 * ทำเทิร์นศัตรูทั้งเทิร์นจบในทีเดียว แล้วคายผลออกมาทาง s.pendingEvents
 *
 * เดิมงานนี้ถูกแยกเป็น PrepareEnemyTurn + ResolveEnemyCard ทีละใบ โดยให้ view
 * ตั้ง setTimeout ยิง dispatch ตามจังหวะอนิเมชั่น ทำให้กฎเกมผูกกับเวลาของอนิเมชั่น
 * (จูนอนิเมชั่นแล้วดาเมจเลื่อนตาม, JS thread ดีเลย์แล้วภาพกับ state หลุดกัน)
 *
 * ตอนนี้ state ถูกคำนวณจนจบทันที ส่วน view เอา event ไปเล่นตามจังหวะของตัวเอง
 * จะเร่ง จะข้าม หรือออกจากจอกลางคัน ก็ไม่กระทบความถูกต้องของ state
 */
export function resolveEnemyTurn(s: GameState, _cmd: Extract<Command, { type: 'ResolveEnemyTurn' }>, r: RNG) {
  if (s.phase !== 'combat') return { state: s, rng: r };

  const { processStatusEffectsOnTurnEnd } = require('../../statusEffectsRuntime');

  // จบเทิร์น player
  processStatusEffectsOnTurnEnd('player', s);
  // Curses go first, then the hand is cut to the retain limit (the player picked with
  // DiscardForTurnEnd; anything still over is dropped newest first).
  discardCurses(s);
  if(enforceRetain(s))r=runTriggers(s,'discard',r);
  // การ์ดที่ยังค้างอยู่ในมือทำงานก่อนเทิร์นศัตรู — ทั้งหมดของกลไกนี้คือ
  // "ถือไว้แล้วมันกันให้" ถ้าไปทำงานหลังโดนตีแล้วก็ไม่มีความหมาย
  applyHeldEffects(s);
  tickTraps(s);
  r = runTriggers(s, 'turnEnd', r);


  emit(s, { t: 'TurnEnded', who: 'player' });
  r = settleCombat(s, r);
  if (s.phase !== 'combat') return { state: s, rng: r };

  // เข้าสมาธิ: the player takes another turn; the ghost does not act, so rage does not rise.
  if (s.fight?.extraTurn) {
    s.fight.extraTurn = false;
    s.log.push('เข้าสมาธิ: ได้เทิร์นเพิ่ม');
    return { state: s, rng: r };
  }

  // ── เทิร์นศัตรู
  if (s.enemy && (s as any).enemyPiles) {
    s.enemy.ap = s.enemy.maxAp ?? 2;
    s.enemy.block = 0;
    if (s.fight) s.fight.ghostTurns += 1;
    require('../../campaign/nights').applyRage(s);
    require('../../campaign/bossRules').applyBossRule(s);
    require('../../statusEffectsRuntime').processStatusEffectsOnTurnStart('enemy',s);
    r=settleCombat(s,r);
    if(s.phase!=='combat')return {state:s,rng:r};

    // Decide from the current public board and the real held cards once the turn starts.
    const handBeforeDraw=s.enemyPiles!.hand.length;
    planEnemyIntent(s,true);
    emit(s,{t:'EnemyHandChanged',drawn:s.enemyPiles!.hand.length-handBeforeDraw});
    const toPlay:string[]=[...(s.enemyIntent?.cardIds??[])];
    const indexes=s.enemyIntent?.handIndexes??[];
    const consumed:number[]=[];
    s.enemyLastPlayed=[];

    const { enemyCardById } = require('../../pack_enemy_cards');

    for (const [playIndex,plannedId] of toPlay.entries()) {
      // ผู้เล่นตายกลางคัน → หยุดทันที ใบที่เหลือไม่ถูกเล่น
      if (s.phase !== 'combat') break;

      const original=indexes[playIndex];
      const index=original==null?s.enemyPiles!.hand.indexOf(plannedId):original-consumed.filter(i=>i<original).length;
      // Traps/counters can awaken the boss between reveals. Read the actual transformed copy.
      const cardId=s.enemyPiles!.hand[index];
      const def=enemyCardById(cardId);
      if(!def)continue;
      const historyBefore=historySnapshot(s),eventStart=s.pendingEvents?.length??0;
      if(index<0||!consumeEnemyCard(s,index))continue;
      if(original!=null)consumed.push(original);
      const shown=enemyCardFx(s,def);
      mimicGhostCard(s,def);
      s.enemyLastPlayed.push(cardId);
      emit(s, {
        t: 'EnemyCardRevealed',
        ownerId:s.enemy.id, handIndex:index,
        cardId,
        name: def.name,
        dmg: shown.dmg ?? 0,
        hits: shown.hits,
        // Damage and block have their own lines on the revealed card; the rest is rules text.
        desc: describeCard({ ...def, conditional: undefined, fx: { ...shown, dmg: undefined, hits: undefined, block: undefined } }, 'enemy') || undefined,
        block: shown.block ?? 0,
        cost: enemyCardCost(def),
      });

      // กับดักที่ตั้งไว้ทำงานก่อนการ์ดของศัตรูจะมีผล — ดักที่ยกเลิกได้
      // ต้องยกเลิกก่อนดาเมจเข้า ไม่งั้นมันคือการ "ยกเลิกหลังโดนแล้ว"
      const trapped = springTraps(s, def.type === 'attack' ? 'attack' : 'skill');
      r = settleCombat(s, r);
      const historyCard=cardFromEnemy(def);
      if (s.phase !== 'combat') {recordCardHistory(s,'enemy',historyCard,historyBefore,eventStart,'ถูกขัดจังหวะ');break;}
      if (trapped.negated) {
        s.log.push(`${def.name ?? def.id} ถูกขัดจังหวะ`);
        recordCardHistory(s,'enemy',historyCard,historyBefore,eventStart,'ถูกขัดจังหวะ');
        continue;
      }

      require('../../combat/enemyCardEffects').resolveEnemyCard(s, def);
      recordCardHistory(s,'enemy',historyCard,historyBefore,eventStart,undefined,{ap:enemyCardCost(def),mana:0});

      r = settleCombat(s, r);
    }
  }

  finishEnemyHand(s,s.enemyLastPlayed?.length??0);
  if(s.phase==='combat'){processStatusEffectsOnTurnEnd('enemy',s);r=settleCombat(s,r);}
  if(s.enemy)s.enemy.handCount=s.enemyPiles?.hand.length??0;
  emit(s, { t: 'TurnEnded', who: 'enemy' });

  // ไม่ประกาศแผนล่วงหน้าอีกแล้ว — ล้างทิ้งเพื่อไม่ให้ค้างเป็นข้อมูลเก่า
  s.enemyIntent = undefined;

  return { state: s, rng: r };
}
