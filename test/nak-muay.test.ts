// test/nak-muay.test.ts — นักมวยคาดเชือก (docs/nak-muay/DESIGN.md): จังหวะ, ต่อจาก, ช้ำ/ท่าหนัก,
// สวน, มึน, ยก, ศิษย์ค่าย, ของขลังมีครั้ง, ติดมือ, คาดเชือกใหม่, ใช้จังหวะ.
import { describe, it, expect } from 'vitest';
import type { CardData, GameState } from '../src/core/types';
import { makeCombatState, runEnemyCards } from './helpers';
import { makeRng } from '../src/core/rng';
import { applyCommand } from '../src/core/reducer';
import { playCard } from '../src/core/cards/play';
import { cardById, poolFor, ALL_CARDS, BLESSING_POOL, PANDORA_BLESSINGS, blessingFitsClass } from '../src/core/pack';
import { describeCard } from '../src/core/cards/describe';
import { FIGHTER_RULES, CLASS_PASSIVES, ENEMY_DEPTH } from '../src/core/balance/notfm';
import { climbingRoute, ADVENTURE_GHOSTS } from '../src/core/map/adventure';
import { CHARACTER_CLASSES, buildStarterDeck } from '../src/core/classes';
import { CARD_LIST_WITH_STARTERS } from '../src/core/pack';
import { beginPlayerFight } from '../src/core/commands';
import { rhythmOf, roundOf } from '../src/core/cards/fighter';
import { rollLevelOffers } from '../src/core/engine/shared';
import { resetCardsPlayed } from '../src/core/cards/mechanics';
import { resetMinions } from '../src/core/combat/minions';
import { dealDamage } from '../src/core/combat/damage';
import { baseNewState, startCombat } from '../src/core/commands';

const rng = makeRng('muay');
const HIT = 'phi_krasue_v29_strike'; // ghost attack 3
const HIT6 = 'pisaj_fai_v29_signature'; // ghost attack 6
const c = (id: string, star = 1): CardData => ({ ...cardById(id)!, star });

function fight(hand: CardData[], over: Parameters<typeof makeCombatState>[0] = {}): GameState {
  const { state: s } = makeCombatState({ hand, enemyHp: 200, playerHp: 40, ...over });
  s.classId = 'warrior';
  s.fight = { hpLost: 0, ghostTurns: 0, rhythm: 0 };
  s.turn = 1;
  s.turnFlags = { blessingOnce: {} };
  resetCardsPlayed(s);
  return s;
}
const play = (s: GameState, i = 0) => playCard(s, i, rng).played;
const bruise = (s: GameState) => s.enemy!.statusEffects?.find(e => e.id === 'bruise')?.stacks ?? 0;

describe('อาชีพ', () => {
  it('ชื่อใหม่ นักมวยคาดเชือก และ passive จังหวะ', () => {
    expect(CHARACTER_CLASSES.warrior.name).toBe('นักมวยคาดเชือก');
    expect(CLASS_PASSIVES.warrior.rhythm).toBe(true);
    expect(CHARACTER_CLASSES.warrior.passiveDesc).toContain('จังหวะ');
  });

  it('เด็คเริ่มต้น 10 ใบ ไม่มีอาวุธ และการ์ดเก่าที่ปลดแล้วไม่ถูกเสนอ', () => {
    const deck = buildStarterDeck(CHARACTER_CLASSES.warrior, CARD_LIST_WITH_STARTERS);
    expect(deck).toHaveLength(10);
    expect(deck.filter(x => x.id === 'jab')).toHaveLength(2);
    expect(deck.some(x => x.id === 'wai_khru')).toBe(true);
    const pool = poolFor('warrior').map(x => x.id);
    // Weapon cards of the old นักรบวัด are gone (owner: old saves need not load).
    for (const id of ['temple_blade', 'long_spear', 'ancestor_blade', 'equipment_iron_bracer']) expect(cardById(id)).toBeUndefined();
  });

  it('การ์ดอาชีพครบ 52 ใบ และการ์ดโจมตีทุกใบมีท่า', () => {
    const own = ALL_CARDS.filter(x => x.class === 'warrior' && !x.locked);
    expect(own).toHaveLength(52);
    for (const x of own.filter(x => x.type === 'attack')) expect(x.move, x.id).toBeDefined();
  });

  it('ไม่มีพรหรือเลเวลอัปที่ให้แค่มานาสำหรับนักมวย', () => {
    const bad = [...BLESSING_POOL, ...PANDORA_BLESSINGS].filter((b: any) => !blessingFitsClass(b, 'warrior')).map((b: any) => b.id);
    expect(bad).toEqual(expect.arrayContaining(['spirit_energy', 'ritual_shield', 'pandora_doom_power']));
    expect(blessingFitsClass(BLESSING_POOL.find((b: any) => b.id === 'spirit_energy')!, 'shaman')).toBe(true);
    const s = fight([]);
    s.player.startMana = 0;
    for (let i = 0; i < 30; i++) expect(rollLevelOffers(s, makeRng('m' + i)).list).not.toContain('mana');
  });

  it('ร้านไม่ขายการ์ดใช้มานาให้นักมวย (ไม่มีแหล่งมานา)', () => {
    const pool = poolFor('warrior').map(x => x.id);
    expect(pool).not.toContain('bell_sound');
    expect(poolFor('shaman').map(x => x.id)).toContain('bell_sound');
  });
});

describe('จังหวะ', () => {
  it('ท่าใหม่ต่างจากท่าก่อนหน้าได้จังหวะ ท่าซ้ำไม่ได้ ใบแรกของไฟต์ไม่ได้', () => {
    const s = fight([c('jab'), c('jab'), c('low_kick'), c('straight_knee')]);
    play(s); expect(rhythmOf(s)).toBe(0);
    play(s); expect(rhythmOf(s)).toBe(0);
    play(s); expect(rhythmOf(s)).toBe(1);
    play(s); expect(rhythmOf(s)).toBe(2);
  });

  it('จังหวะเพิ่มดาเมจทุกครั้งที่ตี และใบที่ได้จังหวะได้ผลทันที', () => {
    const s = fight([c('jab'), c('straight_knee')]);
    play(s); // 4
    const hp = s.enemy!.hp;
    play(s); // knee 6 +1 rhythm
    expect(hp - s.enemy!.hp).toBe(c('straight_knee').fx.dmg! + FIGHTER_RULES.dmgPerStack);
  });

  it('สูงสุดตาม FIGHTER_RULES.rhythmMax', () => {
    const s = fight([c('war_cry'), c('war_cry'), c('war_cry'), c('war_cry'), c('war_cry')], { playerAp: 9 });
    for (let i = 0; i < 5; i++) play(s);
    expect(rhythmOf(s)).toBe(FIGHTER_RULES.rhythmMax);
  });

  it('จบเทิร์นโดยไม่ได้ตี จังหวะหายหมด · ก้าวสลับฟันปลา/ใจนักมวยเก็บไว้ได้', () => {
    const a = fight([c('war_cry')]);
    play(a);
    const a2 = runEnemyCards(a, []);
    expect(rhythmOf(a2)).toBe(0);
    const b = fight([c('war_cry'), c('shin_block')]);
    play(b); play(b);
    expect(rhythmOf(runEnemyCards(b, []))).toBe(2);
    const d = fight([c('war_cry'), c('iron_will')]);
    play(d); play(d);
    expect(rhythmOf(runEnemyCards(d, []))).toBe(3);
  });

  it('ศอกกลับลังกาใช้จังหวะทั้งหมดเป็นดาเมจ', () => {
    const s = fight([c('war_cry'), c('reverse_elbow')]);
    play(s); // rhythm 2
    const hp = s.enemy!.hp;
    play(s);
    expect(hp - s.enemy!.hp).toBe(4 + 2 * 3);
    expect(rhythmOf(s)).toBe(0);
  });

  it('หนุมานถวายแหวนตีเท่าจำนวนจังหวะ', () => {
    const s = fight([c('war_cry'), c('war_cry'), c('hanuman_ring')], { playerAp: 4 });
    play(s); play(s); // 4
    const hp = s.enemy!.hp;
    play(s);
    expect(hp - s.enemy!.hp).toBe(5 * 4);
  });
});

describe('ต่อจาก และคอมโบ', () => {
  it('เตะตัดขาต่อจากหมัดทำให้ผีอ่อนแอ ไม่ต่อไม่ได้', () => {
    const a = fight([c('jab'), c('low_kick')]);
    play(a); play(a);
    expect(a.enemy!.statusEffects?.some(e => e.id === 'weakness')).toBe(true);
    const b = fight([c('low_kick')]);
    play(b);
    expect(b.enemy!.statusEffects?.some(e => e.id === 'weakness')).toBe(false);
  });

  it('การ์ดที่ไม่มีท่าคั่นกลาง ตัดการต่อจาก', () => {
    const s = fight([c('jab'), c('muay_stance'), c('low_kick')]);
    play(s); play(s); play(s);
    expect(s.enemy!.statusEffects?.some(e => e.id === 'weakness')).toBe(false);
  });

  it('คาดเชือกใหม่: การ์ดโจมตีใบถัดไปทำงาน 2 ครั้ง', () => {
    const s = fight([c('rewrap'), c('straight_punch')]);
    play(s);
    const hp = s.enemy!.hp;
    play(s);
    expect(hp - s.enemy!.hp).toBe(14);
  });

  it('จระเข้ฟาดหางทำซ้ำเมื่อเทิร์นนี้ออกครบ 3 ท่า', () => {
    const s = fight([c('jab'), c('straight_knee'), c('crocodile_tail')]);
    play(s); play(s);
    const hp = s.enemy!.hp;
    play(s);
    // rhythm 1 → 2 on the kick; heavy eats the jab's ช้ำ 1 (+2) on the first resolve only
    expect(hp - s.enemy!.hp).toBe((14 + 2 + 2) + (14 + 2));
  });
});

describe('ช้ำ ท่าหนัก มึน', () => {
  it('หมัดแย็บแปะช้ำ ท่าหนักกินช้ำทั้งหมด +2 ต่อชั้น', () => {
    const s = fight([c('jab'), c('double_hook'), c('slant_elbow')]);
    play(s); play(s);
    expect(bruise(s)).toBe(3);
    const hp = s.enemy!.hp;
    play(s); // elbow 5 + rhythm 1 (hook→elbow; jab→hook is the same move) + bruise 3×2
    expect(hp - s.enemy!.hp).toBe(c('slant_elbow').fx.dmg! + 1 + 3 * FIGHTER_RULES.heavyPerBruise);
    expect(bruise(s)).toBe(0);
  });

  it('เตะเสยคางเมื่อช้ำ ≥ 3: ผีมึน การ์ดโจมตีใบแรกเทิร์นหน้าถูกยกเลิก', () => {
    const s = fight([c('stare_down'), c('chin_kick')]);
    play(s); play(s);
    expect(s.enemy!.statusEffects?.some(e => e.id === 'stun')).toBe(true);
    const hp = s.player.hp;
    const after = runEnemyCards(s, [HIT, HIT]);
    expect(hp - after.player.hp).toBe(3); // one of two hits cancelled
  });

  it('ถีบจิกทำลายเกราะผีก่อนตี', () => {
    const s = fight([c('push_kick')], { enemyBlock: 8 });
    play(s);
    expect(s.enemy!.block).toBe(0);
    expect(s.enemy!.hp).toBe(198);
  });
});

describe('สวน', () => {
  // A 6-damage hit into 6 block: the ghost AI only refuses hits the block is *greater* than
  // (enemyPlan.ts rule 2), so this one lands on the block and the riposte fires.
  it('ตั้งการ์ดสวนหมัด: ผีตีแล้วเราไม่เสียเลือด → สวน 6', () => {
    const s = fight([c('gate_watch')]);
    play(s);
    const hp = s.enemy!.hp;
    const after = runEnemyCards(s, [HIT6]);
    expect(after.player.hp).toBe(40);
    expect(hp - after.enemy!.hp).toBe(6);
  });

  it('เกราะไม่พอ เสียเลือด → ไม่สวน และใช้ไปแล้ว', () => {
    const s = fight([c('gate_watch')]);
    play(s);
    s.player.block = 1;
    const hp = s.enemy!.hp;
    const after = runEnemyCards(s, [HIT, HIT]);
    expect(after.enemy!.hp).toBe(hp);
  });

  it('กางเกงมวยลงยันต์ +4 ทุกครั้งที่สวน', () => {
    const s = fight([c('yantra_shorts'), c('gate_watch')]);
    play(s); play(s);
    const hp = s.enemy!.hp;
    const after = runEnemyCards(s, [HIT6]);
    expect(hp - after.enemy!.hp).toBe(10);
  });
});

describe('ยก', () => {
  it('3 เทิร์น = 1 ยก · พักยกทำงานหลังเทิร์นที่ 3', () => {
    expect([1, 2, 3, 4, 6, 7].map(roundOf)).toEqual([1, 1, 1, 2, 2, 3]);
    const s = fight([c('call_corner')]);
    play(s);
    s.turn = 3; s.player.hp = 20;
    const after = runEnemyCards(s, []);
    expect(after.player.hp).toBe(24);
  });

  it('หมัดตรงแรงขึ้นในเทิร์นสุดท้ายของยก', () => {
    const s = fight([c('straight_punch')]);
    s.turn = 3;
    play(s);
    expect(s.enemy!.hp).toBe(188);
  });
});

describe('ศิษย์ค่าย', () => {
  it('ลูกศิษย์ตีท้ายเทิร์น ถ้าออกหมัดตีเพิ่ม', () => {
    const s = fight([c('call_pupil'), c('jab')]);
    play(s); play(s);
    const hp = s.enemy!.hp;
    const after = runEnemyCards(s, []);
    expect(hp - after.enemy!.hp).toBe(6);
  });

  it('นักมวยรุ่นพี่รับการ์ดโจมตีใบแรกของผีแทน', () => {
    const s = fight([c('call_senior')]);
    play(s);
    const after = runEnemyCards(s, [HIT, HIT]);
    expect(after.player.hp).toBe(37);
    expect(after.minions![0].hp).toBe(14 - 3);
  });

  it('ครูมวยเฒ่า: การ์ดโจมตีใบแรกของเทิร์นซ้ำที่แรงครึ่งหนึ่ง', () => {
    const s = fight([c('call_old_master'), c('straight_punch'), c('straight_punch')]);
    play(s);
    const hp = s.enemy!.hp;
    play(s);
    expect(hp - s.enemy!.hp).toBe(7 + 4);
    const hp2 = s.enemy!.hp;
    play(s);
    expect(hp2 - s.enemy!.hp).toBe(7);
  });

  it('สูงสุด 2 ตัว ตัวที่สามไล่ตัวเก่าที่สุดออก และไฟต์ใหม่ไม่มีใครเหลือ', () => {
    const s = fight([c('call_pupil'), c('call_corner'), c('call_pi')], { playerAp: 3 });
    play(s); play(s); play(s);
    expect(s.minions!.map(m => m.id)).toEqual(['corner_man', 'pi_player']);
    resetMinions(s);
    expect(s.minions).toEqual([]);
  });

  it('คนเป่าปี่ชวาเก็บจังหวะไว้แม้เทิร์นไม่ได้ตี', () => {
    const s = fight([c('war_cry'), c('call_pi')]);
    play(s); play(s);
    expect(rhythmOf(runEnemyCards(s, []))).toBe(2);
  });
});

describe('ของขลัง', () => {
  it('ประเจียดแขน: โดนตีเกิน 8 ลดเหลือ 4 ใช้ได้ 3 ครั้งแล้วเสื่อม', () => {
    const s = fight([c('arm_prajiad')]);
    play(s);
    for (let i = 0; i < 3; i++) dealDamage(s, { from: 'enemy', to: 'player', raw: 12, source: { kind: 'card', cardId: 'x' } });
    expect(s.player.hp).toBe(40 - 12);
    expect(s.equipped).toHaveLength(0);
    dealDamage(s, { from: 'enemy', to: 'player', raw: 12, source: { kind: 'card', cardId: 'x' } });
    expect(s.player.hp).toBe(40 - 24);
  });

  it('ตะกรุดโทน: ไม่ตายครั้งเดียว', () => {
    const s = fight([c('takrut')], { playerHp: 5 });
    play(s);
    dealDamage(s, { from: 'enemy', to: 'player', raw: 30, source: { kind: 'card', cardId: 'x' } });
    expect(s.player.hp).toBe(1);
    expect(s.player.block).toBe(10);
  });

  it('เชือกคาดชุบน้ำมันงา: หมัด +2', () => {
    const s = fight([c('oiled_wraps'), c('straight_punch')]);
    play(s); play(s);
    expect(s.enemy!.hp).toBe(191);
  });

  it('เชือกคาดเศษแก้ว: หมัดช้ำเพิ่ม และท่าหนักกินช้ำ +3', () => {
    const s = fight([c('glass_wraps'), c('jab'), c('slant_elbow')]);
    play(s); play(s);
    expect(bruise(s)).toBe(2);
    const hp = s.enemy!.hp;
    play(s);
    expect(hp - s.enemy!.hp).toBe(c('slant_elbow').fx.dmg! + 1 + 2 * 3);
  });
});

describe('ติดมือ และคำอธิบาย', () => {
  it('ไหว้ครูร่ายรำอยู่ในมือเปิดศึกเสมอ', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e']) {
      let s = applyCommand(baseNewState(seed), { type: 'NewRun', seed, classId: 'warrior', difficulty: 1 }, makeRng(seed)).state;
      const r = makeRng(seed + 'f');
      startCombat(s, 'phi-krasue', r);
      beginPlayerFight(s, r);
      expect(s.piles.hand.some(x => x.id === 'wai_khru'), seed).toBe(true);
    }
  });

  it('ทุกการ์ดนักมวยมีคำอธิบายที่ไม่ว่าง และบอกท่า', () => {
    for (const x of ALL_CARDS.filter(x => x.class === 'warrior')) {
      const text = describeCard(x);
      expect(text.length, x.id).toBeGreaterThan(3);
      if (x.move) expect(text, x.id).toMatch(/หมัด|เตะ|เข่า|ศอก/);
    }
    expect(describeCard(c('gate_watch'))).toContain('สวน: โจมตี 6');
    expect(describeCard(c('call_pupil'))).toContain('เลือด 8');
  });
});

describe('ความลึกในคืน (ENEMY_DEPTH)', () => {
  const start = (seed: string) => {
    let s = applyCommand(baseNewState(seed), { type: 'NewRun', seed, classId: 'warrior', difficulty: 1 }, makeRng(seed)).state;
    let r = makeRng(seed);
    const go = (c: any) => ({ state: s, rng: r } = applyCommand(s, c, r));
    while (s.chapter) go({ type: 'SkipChapter' });
    go({ type: 'ChooseStarterBlessing', index: 0 });
    return { get s() { return s; }, go };
  };
  it('ผีไฟต์หลังของคืนเลือดหนาขึ้น แรงขึ้น และแต้มเพิ่ม ไม่ว่าจะเลือกเพจไหน', () => {
    const a = start('depth'), b = start('depth');
    const ix = a.s.pages!.current!.offers.findIndex(o => o?.kind === 'monster');
    b.s.pages!.adventure!.fightsWon = 6;
    a.go({ type: 'ChooseOffer', index: ix }); b.go({ type: 'ChooseOffer', index: ix });
    expect(a.s.enemy!.id).toBe(b.s.enemy!.id);
    expect(b.s.enemy!.depth).toBe(6);
    expect(b.s.enemy!.maxHp).toBeCloseTo(a.s.enemy!.maxHp * (1 + 6 * ENEMY_DEPTH.hpPct / 100), -1);
    const str = (x: GameState) => x.enemy!.statusEffects?.find(e => e.id === 'strength')?.stacks ?? 0;
    expect(str(b.s) - str(a.s)).toBe(2);
    expect(b.s.enemy!.maxAp).toBe(a.s.enemy!.maxAp! + 1);
  });

  it('เส้นทางคืน 1 เริ่มผีระดับต่ำแล้วไต่ขึ้น', () => {
    const route = climbingRoute(ADVENTURE_GHOSTS, 7, 1).map((m: any) => Number(m.tier.slice(1)) || 6);
    expect(route[0]).toBe(1);
    expect(route.at(-1)).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < route.length; i++) expect(route[i]).toBeGreaterThanOrEqual(route[i - 1]);
  });
});

import { moveHint } from '../src/core/cards/fighter';
describe('moveHint (hand hints)', () => {
  it('lights rhythm for a new move and ต่อจาก when the last card was that move', () => {
    const s: any = { classId: 'warrior', fight: { lastAttackMove: 'punch', rhythm: 1 }, turnFlags: { lastMove: 'punch' } };
    expect(moveHint(s, { move: 'kick' } as any)).toEqual({ rhythm: true, after: false });
    expect(moveHint(s, { move: 'punch' } as any).rhythm).toBe(false);
    expect(moveHint(s, { move: 'knee', after: { move: 'punch', bonus: {} } } as any)).toEqual({ rhythm: true, after: true });
    expect(moveHint({ ...s, classId: 'nun' }, { move: 'kick' } as any).rhythm).toBe(false);
  });
});

import { CLASS_BOOK_ORDER, classPlayable, ALL_CLASS_IDS } from '../src/core/classes';
describe('store launch class gate', () => {
  it('opens with นักมวย and only นักมวย can start; the book still lists every class', () => {
    expect(CLASS_BOOK_ORDER[0]).toBe('warrior');
    expect([...CLASS_BOOK_ORDER].sort()).toEqual([...ALL_CLASS_IDS].sort());
    expect(CLASS_BOOK_ORDER.filter(classPlayable)).toEqual(['warrior']);
  });
});
