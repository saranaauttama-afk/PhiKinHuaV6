// src/core/cards/play.ts — playing a card from hand, one path for all eight card types.
import type { CardData, GameState } from '../types';
import type { RNG } from '../rng';
import { CARD_RULES, PRAYER_MULT } from '../balance/notfm';
import { cardCost, cardFx, playBlock, starFx } from './model';
import { applyFx } from './fx';
import { countCardPlayed } from './mechanics';
import { runEquipTriggers, runTriggers } from './passives';
import { armTrap } from '../combat/traps';

/** Put an equipment card into play; when the slots are full the oldest one leaves. */
function equipCard(s: GameState, card: CardData, rng: RNG): RNG {
  const slots = s.equipmentSlotsMax ?? CARD_RULES.equipmentSlots;
  s.equipped = s.equipped ?? [];
  while (s.equipped.length >= slots) {
    const old = s.equipped.shift()!;
    (old.exhaust ? s.piles.exhaust : s.piles.discard).push(old);
    s.log.push(`ถอด ${old.name}`);
  }
  s.equipped.push(card);
  s.log.push(`สวม ${card.name}`);
  return runEquipTriggers(s, card.instanceId ?? card.id, rng);
}

/**
 * Play hand[index]. Returns `played: false` (state untouched) when the card cannot be played.
 * `wait` is the prayer delay in player turns (1–3).
 */
export function playCard(s: GameState, index: number, rng: RNG, wait = 1): { rng: RNG; played: boolean } {
  const card = s.piles.hand[index];
  if (!card) return { rng, played: false };
  const blocked = playBlock(s, card);
  if (blocked) { s.log.push(`${card.name}: ${blocked}`); return { rng, played: false }; }

  const cost = cardCost(s, card);
  s.player.ap -= cost.ap;
  s.player.mana -= cost.mana;
  countCardPlayed(s, card);
  s.piles.hand.splice(index, 1);
  s.log.push(`เล่น ${card.name}`);

  switch (card.type) {
    case 'equipment':
      rng = equipCard(s, card, rng);
      break;
    case 'counter':
      armTrap(s, card);
      s.piles.exhaust.push(card);
      break;
    case 'prayer': {
      const turns = Math.max(1, Math.min(PRAYER_MULT.length, Math.floor(wait)));
      (s.prayers ??= []).push({ card, turnsLeft: turns, mult: PRAYER_MULT[turns - 1]+require('./passives').ruleModifier(s,'prayerMult') });
      s.log.push(`สวด ${card.name} รอ ${turns} เทิร์น`);
      break;
    }
    default: {
      (card.exhaust || card.borrowed ? s.piles.exhaust : s.piles.discard).push(card);
      if (card.type === 'attack') {
        const GM = require('../combat/ghostMechanics');
        const ghostSide = GM.ghostSideHp(s);
        rng = playAttack(s, card, rng);
        // สวนของผี: the ghost answers an attack card that did not hurt its side.
        GM.resolveGhostRipostes(s, ghostSide);
        break;
      }
      const fx = cardFx(s, card);
      // ปลุกเสก: the next spell's effect is multiplied.
      let mult = 1;
      if (card.type === 'spell' && s.fight?.nextSpellMult) { mult = s.fight.nextSpellMult; s.fight.nextSpellMult = undefined; }
      rng = applyFx(s, fx, { sourceId: card.id, type: card.type, mult }, rng);
    }
  }
  if (card.riposte) require('./fighter').armRiposte(s, starRiposte(card));
  require('./fighter').rememberMove(s, card);
  if(card.borrowed){const loss=require('./passives').ruleModifier(s,'borrowHpCost');if(loss>0){const hpLoss=Math.min(s.player.hp,loss);s.player.hp-=hpLoss;require('../combat/damage').emit(s,{t:'Damage',target:'player',raw:loss,modified:loss,blocked:0,hpLoss,died:s.player.hp<=0,sourceKind:'blessing'});}}
  rng = runTriggers(s, 'play', rng, card.type);
  copyPlayedCard(s, card);
  return { rng, played: true };
}

/** สวน numbers follow the card's star like its other numbers. */
function starRiposte(card: CardData) {
  const { STAR_RULES } = require('../balance/notfm');
  const m = STAR_RULES.mult[Math.max(1, Math.min(3, card.star ?? 1)) - 1];
  const r = card.riposte!;
  return { ...r, dmg: r.dmg == null ? r.dmg : Math.round(r.dmg * m), block: r.block == null ? r.block : Math.round(r.block * m) };
}

/**
 * An attack card (cards/fighter.ts): a new move gains rhythm first, then ต่อจาก and rhythm
 * spending shape the effect, ท่าหนัก adds the ghost's ช้ำ to the first hit, and
 * คาดเชือกใหม่ / ครูมวยเฒ่า / repeatIf may resolve it again (never spending rhythm twice).
 */
function playAttack(s: GameState, card: CardData, rng: RNG): RNG {
  const F = require('./fighter');
  rng = F.onAttackStart(s, card, rng);
  const fx = F.attackFx(s, card, cardFx(s, card));
  const ctx = { sourceId: card.id, type: 'attack' as const, move: card.move };
  const heavy = card.heavy ? F.consumeBruise(s) : 0;
  rng = applyFx(s, fx, { ...ctx, firstHitBonus: heavy }, rng);
  if (s.turnFlags.doubleNext && s.enemy && s.enemy.hp > 0) {
    s.turnFlags.doubleNext = false;
    s.log.push(`${card.name} อีกครั้ง`);
    rng = applyFx(s, fx, ctx, rng);
  }
  const echo = F.echoFraction(s);
  if (echo > 0 && s.enemy && s.enemy.hp > 0) {
    s.turnFlags.echoed = true;
    s.log.push(`ครูมวยเฒ่า: ${card.name} ซ้ำ`);
    const half = (n?: number) => (n == null ? n : Math.max(1, Math.round(n * echo)));
    rng = applyFx(s, { dmg: half(fx.dmg), hits: fx.hits, block: half(fx.block) }, ctx, rng);
  }
  if (card.repeatIf && s.enemy && s.enemy.hp > 0 && require('./mechanics').conditionMet(s, card.repeatIf, card)) {
    s.log.push(`${card.name} ต่อเนื่อง!`);
    rng = applyFx(s, fx, ctx, rng);
  }
  F.onAttackEnd(s, card);
  return rng;
}

/** ครูสอนมวย: the next card played gets a one-use copy in hand. A copy is never copied again. */
function copyPlayedCard(s: GameState, card: CardData): void {
  if (!s.fight?.copyNext || card.copied) return;
  s.fight.copyNext = false;
  if (s.phase !== 'combat' || s.piles.hand.length >= s.player.handMax) return;
  s.piles.hand.push({ ...JSON.parse(JSON.stringify(card)), instanceId: `${card.instanceId ?? card.id}#copy`, copied: true, exhaust: true });
  s.log.push(`ครูสอนมวย: ได้สำเนา ${card.name}`);
}

/** Start of a player turn: prayers count down and the ones that are due resolve. */
export function resolvePrayers(s: GameState, rng: RNG): RNG {
  const waiting = s.prayers ?? [];
  const due = waiting.filter(p => p.turnsLeft <= 1);
  s.prayers = waiting.filter(p => p.turnsLeft > 1).map(p => ({ ...p, turnsLeft: p.turnsLeft - 1 }));
  for (const p of due) {
    if (s.phase !== 'combat' || !s.enemy || s.enemy.hp <= 0) break;
    s.log.push(`บทสวด ${p.card.name} สำเร็จ ×${p.mult}`);
    rng = applyFx(s, cardFx(s, p.card), { sourceId: p.card.id, mult: p.mult }, rng);
    (p.card.exhaust ? s.piles.exhaust : s.piles.discard).push(p.card);
    rng = runTriggers(s, 'prayerDone', rng);
  }
  return rng;
}

/** Return in-play cards to the deck piles' owner at the end of a fight. */
export function clearFightCards(s: GameState): void {
  s.equipped = [];
  s.prayers = [];
}

export { starFx };
