import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeCombatState, attackCard } from './helpers';
import type { CombatEvent, GameState } from '../src/core/types';
import { makeRng } from '../src/core/rng';

/**
 * Phase 2 — engine คำนวณเทิร์นศัตรูจบในทีเดียวแล้วคาย event ออกมา
 * ไม่มี setTimeout ตัวไหนได้แตะ state อีก
 */

const rng = () => makeRng('t');

function resolveEnemyTurn(state: GameState) {
  return applyCommand(state, { type: 'ResolveEnemyTurn' }, rng());
}

const eventsOf = (s: GameState): CombatEvent[] => s.pendingEvents ?? [];
const kinds = (s: GameState) => eventsOf(s).map(e => e.t);

/** ใส่มือให้ศัตรูตรงๆ เพื่อคุมผลลัพธ์ให้ deterministic */
function giveEnemyHand(state: GameState, cardIds: string[]) {
  (state as any).enemyPiles = { draw: [], hand: [...cardIds], discard: [] };
}

describe('ResolveEnemyTurn ทำทั้งเทิร์นจบในทีเดียว', () => {
  it('คาย event ครบทุกใบที่ศัตรูเล่น พร้อมปิดหัวท้ายด้วย TurnEnded', () => {
    const { state } = makeCombatState({ playerHp: 50, playerBlock: 0 });
    giveEnemyHand(state, ['claw', 'guard']);

    const { state: out } = resolveEnemyTurn(state);

    expect(kinds(out)[0]).toBe('TurnEnded');            // จบเทิร์นผู้เล่น
    expect(kinds(out)).toContain('EnemyCardRevealed');
    expect(kinds(out)).toContain('Damage');
    expect(kinds(out)).toContain('BlockGained');
    expect(kinds(out).at(-1)).toBe('TurnEnded');        // จบเทิร์นศัตรู
  });

  it('event Damage พก hpLoss จริงมาด้วย ไม่ใช่ตัวเลขบนการ์ด', () => {
    const { state } = makeCombatState({ playerHp: 50, playerBlock: 4 });
    giveEnemyHand(state, ['claw']); // dmg 6 เจอ block 4

    const { state: out } = resolveEnemyTurn(state);
    const dmg = eventsOf(out).find(e => e.t === 'Damage')!;

    expect(dmg).toMatchObject({
      t: 'Damage', target: 'player',
      raw: 6, modified: 6, blocked: 4, hpLoss: 2, died: false,
    });
    expect(out.player.hp).toBe(48);
  });

  it('state ถูกคำนวณจนจบทันที ไม่ต้องรออนิเมชั่น', () => {
    const { state } = makeCombatState({ playerHp: 50, playerBlock: 0 });
    giveEnemyHand(state, ['claw', 'claw', 'claw']); // 6 × 3

    const { state: out } = resolveEnemyTurn(state);
    expect(out.player.hp).toBe(32);
  });
});

describe('หยุดกลางคันเมื่อผู้เล่นตาย', () => {
  it('ใบที่เหลือไม่ถูกเล่นต่อ และ state ไม่ถูกแตะเพิ่ม', () => {
    const { state } = makeCombatState({ playerHp: 7, playerBlock: 0 });
    giveEnemyHand(state, ['claw', 'claw', 'claw']); // ใบที่ 2 ฆ่าพอดี

    const { state: out } = resolveEnemyTurn(state);

    expect(out.player.hp).toBe(0);
    expect(out.phase).toBe('defeat');

    // เปิดการ์ดแค่ 2 ใบ ใบที่ 3 ไม่ถูกแตะ
    const revealed = eventsOf(out).filter(e => e.t === 'EnemyCardRevealed');
    expect(revealed).toHaveLength(2);

    const died = eventsOf(out).filter(e => e.t === 'Died');
    expect(died).toHaveLength(1);
  });
});

describe('pendingEvents เป็นของคำสั่งล่าสุดเท่านั้น', () => {
  it('คำสั่งถัดไปเคลียร์ event ของคำสั่งก่อนหน้า', () => {
    const { state } = makeCombatState({ playerHp: 50 });
    giveEnemyHand(state, ['claw']);

    const { state: afterEnemy } = resolveEnemyTurn(state);
    expect(eventsOf(afterEnemy).length).toBeGreaterThan(0);

    const { state: afterNext } = applyCommand(afterEnemy, { type: 'OpenDeck' }, rng());
    expect(eventsOf(afterNext)).toHaveLength(0);
  });

  it('view ที่ถือคิวเก่าไว้ไม่ถูกกระทบเมื่อ state เปลี่ยน', () => {
    const { state } = makeCombatState({ playerHp: 50 });
    giveEnemyHand(state, ['claw']);

    const { state: afterEnemy } = resolveEnemyTurn(state);
    const heldByView = eventsOf(afterEnemy);
    const lengthWhenGrabbed = heldByView.length;

    applyCommand(afterEnemy, { type: 'OpenDeck' }, rng());
    expect(heldByView).toHaveLength(lengthWhenGrabbed);
  });
});

describe('เทิร์นผู้เล่นก็คาย event ทางเดียวกัน', () => {
  it('เล่นการ์ดโจมตีแล้วได้ event Damage ที่ target เป็นศัตรู', () => {
    const { state } = makeCombatState({ hand: [attackCard(8)], enemyHp: 30, enemyBlock: 3 });

    const { state: out } = applyCommand(state, { type: 'PlayCard', index: 0 }, rng());
    const dmg = eventsOf(out).find(e => e.t === 'Damage');

    expect(dmg).toMatchObject({ target: 'enemy', raw: 8, blocked: 3, hpLoss: 5 });
  });
});

describe('presentation frames preserve each card impact', () => {
  it('keeps the unrevealed damage out of earlier HP/block frames', () => {
    const {state} = makeCombatState({playerHp:50,playerBlock:4});
    giveEnemyHand(state,['claw','claw']);
    const {state:out}=resolveEnemyTurn(state);
    const reveal=eventsOf(out).filter(e=>e.t==='EnemyCardRevealed');
    const damage=eventsOf(out).filter(e=>e.t==='Damage');
    expect(reveal.map(e=>e.frame?.player.hp)).toEqual([50,48]);
    expect(damage.map(e=>e.frame?.player.hp)).toEqual([48,42]);
    expect(damage.map(e=>e.frame?.player.block)).toEqual([0,0]);
    out.player.hp=1;
    expect(reveal[0].frame?.player.hp).toBe(50);
    expect(damage[1].frame?.player.hp).toBe(42);
  });
});

it('shows a summoned helper acting before its real result, then expires it', () => {
  const {state}=makeCombatState({playerHp:40,playerBlock:0});
  state.minions=[{id:'kuman_spirit_test',name:'กุมารทอง',duration:3,owner:'player',abilities:[{type:'heal',trigger:'turn_start',target:'owner',value:2,description:'ฟื้นฟู'}]}];
  const out=applyCommand(state,{type:'StartPlayerTurn'},rng()).state;
  const acting=eventsOf(out).find(e=>e.t==='MinionActing');
  const resolved=eventsOf(out).find(e=>e.t==='MinionResolved');
  expect(acting?.frame?.player.hp).toBe(40);
  expect(resolved?.frame?.player.hp).toBe(42);
  expect(out.player.hp).toBe(42);
});

it('enemy helper acts before cards and cannot continue attacking after lethal damage',()=>{
  const {state}=makeCombatState({playerHp:3});
  giveEnemyHand(state,['claw']);
  state.minions=[{id:'shadow_clone_test',name:'โคลนเงา',duration:3,owner:'enemy',abilities:[{type:'attack',trigger:'turn_start',target:'enemy',value:8,description:'จู่โจม'}]}];
  const out=resolveEnemyTurn(state).state;
  expect(out.phase).toBe('defeat');
  expect(kinds(out)).toContain('MinionActing');
  expect(kinds(out)).not.toContain('EnemyCardRevealed');
});


it('finishes combat when a player helper kills the ghost without another card',()=>{
  const {state}=makeCombatState({playerHp:40,enemyHp:2});
  state.minions=[{id:'ghost_ally_test',name:'วิญญาณเพื่อน',duration:3,owner:'player',abilities:[{type:'attack',trigger:'turn_start',target:'enemy',value:4,description:'โจมตี'}]}];
  const out=applyCommand(state,{type:'StartPlayerTurn'},rng()).state;
  expect(out.enemy?.hp).toBe(0);
  expect(out.combatVictoryLock).toBe(true);
  expect(out.phase).not.toBe('combat');
  expect(kinds(out)).toContain('MinionActing');
  expect(kinds(out)).toContain('Died');
});
