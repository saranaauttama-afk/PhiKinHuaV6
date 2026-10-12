// Commands — pure helpers used by reducer
// baseNewState, buildAndShuffleDeck, drawCards, startPlayerTurn, beginPlayerFight, isVictory/isDefeat, startCombat
import type { CardData, GameState } from './types';
import { START_DECK, START_GOLD, START_HP, nextExpForLevel } from './balance';
import { CARD_RULES } from './balance/notfm';
import { shuffle, type RNG } from './rng';
import { THAI_GHOST_POOLS, type ThaiGhostData } from './monsters/thai-ghosts';
import { dealDamage, gainBlock, heal } from './combat/damage';

let _instanceCounter = 0;

// NOTE: We keep state updates pure by working on shallow copies of containers.
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export function baseNewState(seed: string): GameState {
  return {
    seed,
    phase: 'start',
    turn: 0,
    player: {
      hp: START_HP, maxHp: START_HP, block: 0,
      ap: CARD_RULES.apPerTurn, maxAp: CARD_RULES.apPerTurn, mana: 0, startMana: 0,
      openingDraw: CARD_RULES.openingDraw, drawPerTurn: CARD_RULES.drawPerTurn, handMax: CARD_RULES.handMax,
      gold: START_GOLD, level: 1, exp: 0, expToNext: nextExpForLevel(1),
    },
    enemy: undefined,
    fightCount: 0, // Track fights for boss encounters
    piles: { draw: [], hand: [], discard: [], exhaust: [] },
    log: [],
    // ✅ ฟิลด์ที่เพิ่มใน M2
    blessings: [],
    turnFlags: { blessingOnce: {} },
    runCounters: { removed: 0 },
    // rewardOptions: undefined,
    // map: undefined,
    shopStock: undefined,
    event: undefined,
    combatVictoryLock: false,    
    masterDeck: [],               // ✅ ใส่ค่าเริ่มต้นว่างไว้ เดี๋ยว NewRun จะตั้งจริง
    deckOpen: false,
    shopRegistry: [],
  };
}

/** Draw `n` cards, stopping at the hand limit. */
export function drawCards(s: GameState, rng: RNG, n: number): { state: GameState; rng: RNG } {
  return { state: s, rng: require('./cards/fx').drawCards(s, rng, n) };
}

export function buildAndShuffleDeck(_state: GameState, _rng: RNG): { state: GameState; rng: RNG } {
  let state = _state;
  let rng = _rng;
  const source = state.masterDeck?.length ? state.masterDeck : START_DECK;
  const out = shuffle(rng, source);
  _instanceCounter = 0;
  state.piles = {
    draw: out.array.map(c => ({ ...c, instanceId: `${c.id}__${++_instanceCounter}` })),
    hand: [], discard: [], exhaust: [],
  };
  rng = out.rng;
  return { state, rng };
}

export function startPlayerTurn(state: GameState, rng: RNG): { state: GameState; rng: RNG } {
  const { processStatusEffectsOnTurnStart } = require('./statusEffectsRuntime');
  require('./cards/mechanics').resetCardsPlayed(state);
  state.player.ap = state.player.maxAp;
  state.player.block = 0;
  // สำรวมจิต lasts until the start of the next player turn.
  if (state.fight) state.fight.halfDamage = false;
  processStatusEffectsOnTurnStart('player', state);
  rng = require('./cards/play').resolvePrayers(state, rng);
  if (state.phase !== 'combat') return { state, rng };
  ({ state, rng } = drawCards(state, rng, state.player.drawPerTurn));
  rng = require('./cards/passives').runTriggers(state, 'turnStart', rng);
  require('./cards/testWin').dealTestWinCard(state);
  return { state, rng };
}

/**
 * Set up the player's side of a new fight: fresh piles, resources, opening hand,
 * blessings' battle-start triggers and the class passive. Enemy must already exist.
 */
export function beginPlayerFight(s: GameState, rng: RNG): RNG {
  ({ state: s, rng } = buildAndShuffleDeck(s, rng));
  s.cardHistory = []; s.cardHistorySeq = 0;
  s.equipped = []; s.prayers = []; s.traps = [];
  s.fight = { hpLost: 0, ghostTurns: 0 };
  require('./skills').tickSkillCooldowns(s);
  s.player.block = 0;
  s.player.ap = s.player.maxAp;
  s.player.mana = s.player.startMana;
  require('./cards/mechanics').resetCardsPlayed(s);
  ({ state: s, rng } = drawCards(s, rng, s.player.openingDraw));
  rng = require('./cards/passives').runTriggers(s, 'battleStart', rng);
  require('./cards/testWin').dealTestWinCard(s);
  return rng;
}

export function isVictory(state: GameState): boolean {
  return !!state.enemy && state.enemy.hp <= 0;
}

export function isDefeat(state: GameState): boolean {
  return state.player.hp <= 0;
}

// ===== START COMBAT =====
export function startCombat(state: GameState, monsterId: string, rng?: RNG): RNG | undefined {
  // Find monster from Thai ghost pools
  const allMonsters = [
    ...THAI_GHOST_POOLS.T1,
    ...THAI_GHOST_POOLS.T2,
    ...THAI_GHOST_POOLS.T3,
    ...THAI_GHOST_POOLS.T4,
    ...THAI_GHOST_POOLS.T5,
    ...THAI_GHOST_POOLS.Elite,
    ...THAI_GHOST_POOLS.BossMid,
    ...THAI_GHOST_POOLS.BossFinal,
    ...THAI_GHOST_POOLS.SecretBoss
  ];

  const monsterData = allMonsters.find(m => m.id === monsterId);
  if (!monsterData) {
    console.error(`Monster not found: ${monsterId}`);
    return;
  }

  state.phase = 'combat';
  state.cardHistory = []; state.cardHistorySeq = 0;
  state.enemy = {
    id: monsterData.id, name: monsterData.name, hp: monsterData.hp, maxHp: monsterData.hp, block: 0,
    deck: require('./monsters/monster-decks').deckForMonster(monsterData), statusEffects: [],
  };
  state.enemyPiles = { draw: [], hand: [], discard: [] };

  if (rng) {
    const enemyHandlers = require('./engine/handlers/enemy');
    rng = enemyHandlers.buildAndShuffleEnemyDeck(state, rng).rng;
    rng = beginPlayerFight(state, rng!);
  }

  state.log.push(`เริ่มต่อสู้กับ ${monsterData.name} (HP: ${monsterData.hp})`);
  return rng;
}
