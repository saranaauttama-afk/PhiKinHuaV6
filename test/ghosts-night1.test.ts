// test/ghosts-night1.test.ts — ผีคืน 1 ชุดใหม่ (docs/ghosts/NIGHT1-DESIGN.md): ชาร์จ, สวนของผี,
// มึนฝั่งเรา, ลูกสมุน, ช่วง 2 ของบอส, และ AI ผี 3 ข้อ (ถือชาร์จ, ไม่ตีใส่สวน, ถือคู่เตรียม→ระเบิด).
import { describe, it, expect } from 'vitest';
import type { CardData, GameState } from '../src/core/types';
import { makeCombatState } from './helpers';
import { makeRng } from '../src/core/rng';
import { applyCommand } from '../src/core/reducer';
import { playCard } from '../src/core/cards/play';
import { cardById } from '../src/core/pack';
import { describeCard } from '../src/core/cards/describe';
import { enemyCardById } from '../src/core/pack_enemy_cards';
import { chooseEnemyCards } from '../src/core/combat/enemyPlan';
import { finishEnemyHand } from '../src/core/combat/enemyHand';
import { enemyHandCharges, chargeSteps } from '../src/core/combat/ghostMechanics';
import { cardFx } from '../src/core/combat/enemyCardEffects';
import { resetCardsPlayed } from '../src/core/cards/mechanics';
import { GHOST_MECHANICS } from '../src/core/balance/notfm';
import { NIGHT_ENEMY_DECKS } from '../src/core/campaign/enemyDecks';
import { ghostRule } from '../src/core/campaign/enemyRules';
import { minionDef } from '../src/core/combat/minions';
import { startPlayerTurn } from '../src/core/commands';
import { applyStatusEffect } from '../src/core/statusEffectsRuntime';
import { cardFromEnemy } from '../src/core/cards/borrow';
import { summonMinion } from '../src/core/combat/minions';
import { LEVEL_UP } from '../src/core/balance/notfm';
import { grantExpAndQueueLevelUp } from '../src/core/engine/shared';

const rng = makeRng('night1');
const c = (id: string): CardData => ({ ...cardById(id)!, star: 1 });

/** A fight with the given player hand and ghost hand (ages default 0). */
function fight(opts: { hand?: CardData[]; ghost?: string[]; ages?: number[]; enemyHp?: number; playerHp?: number; monster?: string } = {}): GameState {
  const { state: s } = makeCombatState({ hand: opts.hand, enemyHp: opts.enemyHp ?? 200, playerHp: opts.playerHp ?? 60, monsterId: opts.monster });
  s.player.maxHp = 60;
  s.classId = 'warrior';
  s.fight = { hpLost: 0, ghostTurns: 0, rhythm: 0 };
  s.turn = 1;
  s.turnFlags = { blessingOnce: {} };
  resetCardsPlayed(s);
  s.enemy!.statusEffects = [];
  s.enemyPiles = { draw: [], hand: [...(opts.ghost ?? [])], discard: [] };
  s.enemyHandAges = opts.ages ?? (opts.ghost ?? []).map(() => 0);
  s.enemyHandSize = 5; s.enemyDrawPerTurn = 0; s.enemyMaxRetained = 2;
  return s;
}
const ghostTurn = (s: GameState) => applyCommand(s, { type: 'ResolveEnemyTurn' }, rng).state;
const play = (s: GameState, i = 0) => playCard(s, i, rng).played;

const GAPE = 'phi_pop_n1_gape';            // ปอบ อ้าปากรอ: ตี 4 · ชาร์จ +3
const LEAF = 'nang_tanee_n1_leafguard';    // นางตานี ใบตานีบัง: เกราะ 5 · สวน ตี 5
const GLOW = 'ngu_phi_sang_n1_glow';       // ผีโพง แสงโพง: เราติดมึน
const SLASH = 'phi_pret_n1_slash';         // เปรต แขนยาวกรีด: ตี 3 · เปราะบาง
const NEEDLE = 'phi_pret_n1_needle';       // เปรต ปากเท่ารูเข็ม: ตี 2 · +4 ถ้าเราเปราะบาง
const STRIKE = 'phi_pop_v29_strike';       // ตี 3

describe('ข้อมูล', () => {
  it('ผี 11 ตัวคืน 1 + บอส ใช้เด็คใหม่ 8–10 ใบ มีการ์ดประจำตัว 3–4 แบบ', () => {
    const ghosts = ['phi-krasue', 'phi-pop', 'nang-tanee', 'phi-nang-ram', 'phi-pong-kang', 'ngu-phi-sang',
      'phi-pret', 'krahang', 'kuman-thong', 'phi-tai-hong', 'phi-pa', 'night-head-collector'];
    for (const id of ghosts) {
      const deck = NIGHT_ENEMY_DECKS[id];
      expect(deck.length, id).toBeGreaterThanOrEqual(8);
      expect(deck.length, id).toBeLessThanOrEqual(10);
      const own = new Set(deck.filter(x => x.includes('_n1_')));
      expect(own.size, id).toBeGreaterThanOrEqual(2);
      expect(own.size, id).toBeLessThanOrEqual(4);
    }
  });

  it('ลูกสมุนที่การ์ดและกฎผีเรียกมีอยู่จริงและเป็นฝั่งผี', () => {
    const ids = new Set<string>();
    for (const deck of Object.values(NIGHT_ENEMY_DECKS)) for (const id of deck) { const s = enemyCardById(id)?.fx.summon; if (s) ids.add(s); }
    for (const id of ids) expect(minionDef(id)?.side, id).toBe('enemy');
    expect(ids.size).toBe(5);
  });

  // Owner 15 Oct 2026 (playtest): we cannot pick a target, so a minion that does not take hits
  // could only be killed by a sweep. Every ghost minion takes single hits, oldest first.
  it('ลูกสมุนผีทุกตัวรับหมัดแทน เพราะเราเลือกเป้าไม่ได้', () => {
    for (const m of ['pong_monkey', 'ash_bones', 'ash_crawler', 'forest_shade', 'basket_head']) expect(minionDef(m)!.taunt, m).toBe(true);
  });

  it('หมัดเดี่ยวโดนลูกสมุนตัวที่มาก่อน', () => {
    const s = fight({ hand: [c('jab')] });
    s.enemyMinions = [
      { uid: 'a', id: 'ash_bones', name: 'เถ้ากระดูก', hp: 5, maxHp: 5, side: 'enemy', passive: { triggers: [] }, taunt: true },
      { uid: 'b', id: 'ash_crawler', name: 'เถ้ากระดูกคลาน', hp: 5, maxHp: 5, side: 'enemy', passive: { triggers: [] }, taunt: true },
    ];
    play(s);
    expect(s.enemyMinions.map(m => m.uid)).toEqual(['b']);
    expect(s.enemy!.hp).toBe(200);
  });

  it('คำอธิบายการ์ดบอกกลไก', () => {
    expect(describeCard(enemyCardById(GAPE)!, 'enemy')).toContain('ชาร์จ: โจมตี +3 ต่อเทิร์นที่ถือไว้');
    expect(describeCard(enemyCardById(LEAF)!, 'enemy')).toContain('สวน: โจมตี 5');
    expect(describeCard(enemyCardById(GLOW)!, 'enemy')).toContain('เราติดมึน');
    expect(describeCard(enemyCardById(NEEDLE)!, 'enemy')).toContain('ถ้าเราติดความเปราะบาง +4');
    expect(describeCard(enemyCardById('phi_krasue_n1_drain')!, 'enemy')).toContain('ผีฟื้นเท่าที่ทะลุเกราะเรา');
  });
});

describe('ชาร์จ', () => {
  it('ยิ่งถือนานยิ่งแรง สูงสุด 3 เทิร์น', () => {
    const card = enemyCardById(GAPE)!;
    expect([0, 1, 2, 3, 4].map(a => chargeSteps(card, a))).toEqual([0, 1, 2, 3, 3]);
    const s = fight();
    expect([0, 1, 3].map(n => cardFx(s, card, n).dmg)).toEqual([4, 7, 13]);
    expect(GHOST_MECHANICS.chargeMaxTurns).toBe(3);
  });

  it('ปล่อยแล้วโดนตามชาร์จจริง และป้ายบอกชาร์จ', () => {
    const s = fight({ ghost: [GAPE], ages: [3] });
    const hp = s.player.hp;
    const after = ghostTurn(s);
    expect(hp - after.player.hp).toBe(13);
    const reveal = after.pendingEvents!.find(e => e.t === 'EnemyCardRevealed') as any;
    expect(reveal.charge).toBe(3);
    expect(reveal.dmg).toBe(13);
  });

  it('หลังไพ่ผีโชว์เลขชาร์จเฉพาะใบชาร์จ', () => {
    const s = fight({ ghost: [STRIKE, GAPE], ages: [2, 2] });
    expect(enemyHandCharges(s)).toEqual([null, 2]);
  });
});

describe('สวนของผี', () => {
  it('ผีตั้งสวน แล้วการ์ดโจมตีใบถัดไปของเราโดนเกราะกินหมด → ผีสวน', () => {
    const s = fight({ ghost: [LEAF], hand: [c('jab')] });
    const t = ghostTurn(s);
    expect(t.fight!.enemyRipostes).toHaveLength(1);
    expect(t.enemy!.block).toBe(5);
    t.turnFlags = { blessingOnce: {} }; resetCardsPlayed(t);
    t.piles.hand = [c('jab')]; t.player.ap = 2;
    const hp = t.player.hp;
    play(t);                                // jab 5 into block 5
    expect(t.enemy!.hp).toBe(200);
    expect(hp - t.player.hp).toBe(5);
    expect(t.fight!.enemyRipostes).toEqual([]);
  });

  it('ตีทะลุเกราะ → ผีสวนไม่ทัน และสวนถูกใช้ไปแล้ว', () => {
    const s = fight({ hand: [c('straight_knee'), c('jab')] });
    s.enemy!.block = 5; s.fight!.enemyRipostes = [{ dmg: 5 }];
    const hp = s.player.hp;
    play(s);                                // knee 7 > block 5
    expect(s.player.hp).toBe(hp);
    expect(s.fight!.enemyRipostes).toEqual([]);
    s.enemy!.block = 10; play(s);           // no riposte left to answer this one
    expect(s.player.hp).toBe(hp);
  });

  it('ลูกสมุนรับหมัดแทนก็ไม่นับว่าเกราะผีกินหมด', () => {
    const s = fight({ hand: [c('jab')] });
    s.enemyMinions = [{ uid: 'm1', id: 'pong_monkey', name: 'ลิงโป่ง', hp: 8, maxHp: 8, side: 'enemy', passive: { triggers: [] }, taunt: true }];
    s.fight!.enemyRipostes = [{ dmg: 5 }];
    const hp = s.player.hp;
    play(s);
    expect(s.enemyMinions[0].hp).toBe(3);
    expect(s.player.hp).toBe(hp);
  });

  it('สวนของผีหมดเมื่อขึ้นเทิร์นผีถัดไป', () => {
    const s = fight({ ghost: [] });
    s.fight!.enemyRipostes = [{ dmg: 5 }];
    expect(ghostTurn(s).fight!.enemyRipostes).toEqual([]);
  });
});

describe('มึนฝั่งเรา', () => {
  it('ผีโพงทำให้มึน → เทิร์นหน้าแต้ม −1 แล้วหาย', () => {
    const s = fight({ ghost: [GLOW] });
    const t = ghostTurn(s);
    expect(t.player.statusEffects?.some(e => e.id === 'stun')).toBe(true);
    const { state: n } = startPlayerTurn(t, rng);
    expect(n.player.ap).toBe(n.player.maxAp - GHOST_MECHANICS.stunApLoss);
    expect(n.player.statusEffects?.some(e => e.id === 'stun')).toBe(false);
    expect(n.pendingEvents!.some(e => e.t === 'PlayerStunned')).toBe(true);
  });
});

describe('กลไกประจำตัวอื่น', () => {
  it('กระสือดูดเลือดเท่าที่ทะลุเกราะ', () => {
    const s = fight({ ghost: ['phi_krasue_n1_drain'], enemyHp: 20 });
    s.enemy!.maxHp = 40; s.player.block = 1;
    const t = ghostTurn(s);
    expect(t.enemy!.hp).toBe(23);
  });

  it('นางรำ: รำเบิกโรงทำให้ทุกหมัดหลังจากนั้นในเทิร์นแรงขึ้น แล้วหายท้ายเทิร์นผี', () => {
    const s = fight({ ghost: ['phi_nang_ram_n1_overture', STRIKE] });
    const hp = s.player.hp;
    const t = ghostTurn(s);
    expect(hp - t.player.hp).toBe(4);
    expect(t.enemy!.statusEffects?.some(e => e.id === 'dance')).toBe(false);
  });

  it('เปรต: ปากเท่ารูเข็มแรงขึ้นเมื่อเราเปราะบาง (+4) ก่อนคูณเปราะบาง', () => {
    const s = fight();
    expect(cardFx(s, enemyCardById(NEEDLE)!).dmg).toBe(2);
    applyStatusEffect('player', s, 'vulnerable', 2, 1);
    expect(cardFx(s, enemyCardById(NEEDLE)!).dmg).toBe(6);
  });

  it('ผีตายโหง แค้นฝังใจ +3 ถ้าเทิร์นที่แล้วเราตีมันเข้าเนื้อ', () => {
    const s = fight({ hand: [c('jab')] });
    const card = enemyCardById('phi_tai_hong_n1_rancor')!;
    expect(cardFx(s, card).dmg).toBe(5);
    play(s);
    expect(cardFx(s, card).dmg).toBe(8);
  });

  // Owner 15 Oct 2026 (playtest, choice 2 ก): a minion standing before any card was played read
  // as a bug, so ghosts only call minions with a card.
  it('ไม่มีผีตัวไหนเรียกลูกสมุนตอนเปิดไฟต์ ต้องมาจากการ์ด', () => {
    for (const g of Object.keys(NIGHT_ENEMY_DECKS)) expect(ghostRule(g)?.fx.summon, g).toBeUndefined();
    expect(NIGHT_ENEMY_DECKS['phi-pong-kang'].filter(x => x === 'phi_pong_kang_n1_call')).toHaveLength(2);
    expect(NIGHT_ENEMY_DECKS['night-head-collector'].filter(x => x === 'night_head_collector_n1_basket')).toHaveLength(2);
  });
});

describe('บอสกระหังหนองร้าง ช่วง 2', () => {
  it('เลือด ≤ 50% → เปลี่ยนเด็ค ตะเกียงหนองแตก และไม่เปลี่ยนซ้ำ', () => {
    const s = fight({ ghost: [STRIKE], monster: 'night-head-collector', enemyHp: 100 });
    s.enemy!.id = 'night-head-collector'; s.enemy!.maxHp = 200;
    s.fight!.relic = { bossId: 'night-head-collector', durability: 6, broken: false, stolen: [] };
    s.enemyDrawPerTurn = 2;
    const t = ghostTurn(s);
    expect(t.fight!.ghostPhase2).toBe(true);
    expect(t.fight!.relic!.broken).toBe(true);
    expect(t.enemy!.deck).toEqual(ghostRule('night-head-collector')!.phase2!.deck);
    expect(t.pendingEvents!.some(e => e.t === 'GhostPhase')).toBe(true);
    const all = [...t.enemyPiles!.hand, ...t.enemyPiles!.draw, ...t.enemyPiles!.discard].sort();
    expect(all).toEqual([...ghostRule('night-head-collector')!.phase2!.deck].sort());
    const again = ghostTurn(t);
    expect(again.pendingEvents!.filter(e => e.t === 'GhostPhase')).toHaveLength(0); // events reset per command: no second swap
    expect(again.fight!.ghostPhase2).toBe(true);
  });

  it('เลือดเกินครึ่ง ยังช่วง 1', () => {
    const s = fight({ ghost: [STRIKE], enemyHp: 150 });
    s.enemy!.id = 'night-head-collector'; s.enemy!.maxHp = 200;
    expect(ghostTurn(s).fight!.ghostPhase2).toBeFalsy();
  });
});

describe('AI ผี', () => {
  it('1. ถือการ์ดชาร์จไว้จนเต็ม', () => {
    const s = fight({ ghost: [GAPE, STRIKE], ages: [1, 0] });
    expect(chooseEnemyCards(s, s.enemyPiles!.hand, 2)).toEqual([STRIKE]);
    const full = fight({ ghost: [GAPE, STRIKE], ages: [3, 0] });
    expect(chooseEnemyCards(full, full.enemyPiles!.hand, 2)).toContain(GAPE);
  });

  it('1. ปล่อยชาร์จก่อนเต็มถ้าพอฆ่าเรา', () => {
    const s = fight({ ghost: [GAPE], ages: [1], playerHp: 6 });
    expect(chooseEnemyCards(s, s.enemyPiles!.hand, 2)).toEqual([GAPE]);
  });

  it('1. การ์ดชาร์จที่ยังไม่เต็มถูกเก็บข้ามเทิร์นก่อนใบอื่น และไม่ถูกทิ้งเพราะถือนาน', () => {
    const s = fight({ ghost: [STRIKE, STRIKE, GAPE], ages: [0, 0, 2] });
    s.enemyMaxRetained = 1;
    finishEnemyHand(s, 0);
    expect(s.enemyPiles!.hand).toEqual([GAPE]);
    expect(s.enemyHandAges).toEqual([3]);
  });

  it('1. ถือจริงข้ามเทิร์นแล้วปล่อยตอนเต็ม', () => {
    let s = fight({ ghost: [GAPE], ages: [0] });
    const dealt: number[] = [];
    for (let i = 0; i < 4; i++) {
      const hp = s.player.hp;
      s = ghostTurn(s);
      dealt.push(hp - s.player.hp);
      s.player.block = 0;
    }
    expect(dealt).toEqual([0, 0, 0, 13]);
  });

  it('2. ไม่ตีใส่สวนของเราเมื่อเกราะเรามากกว่าดาเมจ', () => {
    const s = fight({ ghost: [STRIKE, 'phi_pop_v29_ward'] });
    s.player.block = 7; s.fight!.ripostes = [{ dmg: 6 }];
    expect(chooseEnemyCards(s, s.enemyPiles!.hand, 2)).not.toContain(STRIKE);
    s.fight!.ripostes = [];
    expect(chooseEnemyCards(s, s.enemyPiles!.hand, 2)).toContain(STRIKE);
  });

  it('2. ถ้าตีทะลุเกราะได้ ยังตีอยู่', () => {
    const s = fight({ ghost: ['krahang_n1_pestle'] });
    s.player.block = 5; s.fight!.ripostes = [{ dmg: 6 }];
    expect(chooseEnemyCards(s, s.enemyPiles!.hand, 2)).toEqual(['krahang_n1_pestle']);
  });

  it('3. ถือการ์ดระเบิดไว้เมื่อแต้มไม่พอเล่นการ์ดเตรียมก่อน', () => {
    // A setup action that costs the whole budget is not affordable; the payoff waits for it.
    const s = fight({ ghost: [NEEDLE, SLASH] });
    expect(chooseEnemyCards(s, s.enemyPiles!.hand, 2)).toEqual([SLASH, NEEDLE]);
    const noSetupPlayed = fight({ ghost: [NEEDLE, 'phi_pret_n1_starve'] });
    expect(chooseEnemyCards(noSetupPlayed, noSetupPlayed.enemyPiles!.hand, 0)).toEqual([NEEDLE]);
    const waiting = fight({ ghost: [NEEDLE, 'ngu_phi_sang_n1_fire'] });
    // ไฟผีโพง sets poison, not vulnerable: no pairing, the needle is played.
    expect(chooseEnemyCards(waiting, waiting.enemyPiles!.hand, 0)).toEqual([NEEDLE]);
  });

  it('3. การ์ดเตรียมที่เป็นแอ็กชันแต่แต้มไม่พอ → ถือการ์ดระเบิดไว้', () => {
    const s = fight({ ghost: ['phi_phrai_v34_payoff', 'phi_phrai_v29_signature_support'] });
    expect(chooseEnemyCards(s, s.enemyPiles!.hand, 0)).toEqual([]);
    expect(chooseEnemyCards(s, s.enemyPiles!.hand, 1)).toEqual(['phi_phrai_v29_signature_support', 'phi_phrai_v34_payoff']);
  });
});

describe('หลังเทสเล่นจริง + audit (15 ต.ค. 2026)', () => {
  it('audit: AI เห็นเปราะบาง (สถานะไม่ซ้อนชั้น) จึงไม่กั๊กปากเท่ารูเข็มเมื่อเราเปราะบางอยู่แล้ว', () => {
    const s = fight({ ghost: [NEEDLE, SLASH] });
    applyStatusEffect('player', s, 'vulnerable', 2, 1);
    s.player.block = 8; s.fight!.ripostes = [{ dmg: 6 }];
    expect(chooseEnemyCards(s, s.enemyPiles!.hand, 2)).toEqual([NEEDLE]);
  });

  it('audit: คนทรงยืมดูดเลือดแล้วฟื้นจริง', () => {
    const s = fight({ enemyHp: 50 });
    s.player.hp = 30;
    s.piles.hand = [{ ...cardFromEnemy(enemyCardById('phi_krasue_n1_drain')!, true), instanceId: 'b1' }];
    play(s);
    expect(s.player.hp).toBe(34);
  });

  it('ลิงโป่งตีเรา 2 · เงาป่าให้ผีเกราะ 3 ท้ายเทิร์นผี', () => {
    const s = fight();
    summonMinion(s, 'enemy', 'pong_monkey'); summonMinion(s, 'enemy', 'forest_shade');
    const hp = s.player.hp;
    const t = ghostTurn(s);
    expect(hp - t.player.hp).toBe(2);
    expect(t.enemy!.block).toBe(3);
  });

  it('หัวในกระด้งทำให้ไพ่ชาร์จของบอสชาร์จเร็วขึ้นเทิร์นละ 1', () => {
    const s = fight({ ghost: ['night_head_collector_n1_snatch'], ages: [0] });
    summonMinion(s, 'enemy', 'basket_head');
    finishEnemyHand(s, 0);
    expect(s.enemyHandAges).toEqual([2]);
    s.enemyMinions = [];
    finishEnemyHand(s, 0);
    expect(s.enemyHandAges).toEqual([3]);
  });

  it('เลขชาร์จอยู่บนตัวผี ภาพระหว่างเทิร์นผีจึงยังเห็นเลข', () => {
    const s = fight({ ghost: [GAPE, STRIKE], ages: [1, 0] });
    const t = ghostTurn(s);
    const frames = t.pendingEvents!.filter(e => e.frame?.enemy?.handCount);
    expect(frames.length).toBeGreaterThan(0);
    for (const e of frames) expect(e.frame!.enemy!.handCharges?.length).toBe(e.frame!.enemy!.handCount);
  });

  it('เลเวลอัปฟื้น 30% + เลือดสูงสุดที่เพิ่ม ไม่ฟื้นเต็ม', () => {
    expect(LEVEL_UP.healPct).toBe(30);
    const s = fight();
    s.player.hp = 20; s.player.maxHp = 60; s.player.exp = s.player.expToNext - 1;
    s.enemy!.hp = 0;
    grantExpAndQueueLevelUp(s, rng);
    expect(s.player.maxHp).toBe(68);
    expect(s.player.hp).toBe(20 + 8 + Math.round(68 * 0.3));
  });
});

describe('อ่านเกมง่ายขึ้น (เทสเล่นจริง 15 ต.ค.)', () => {
  it('ดาเมจบอกที่มา: จังหวะ แข็งแกร่ง เปราะบาง โกรธ', async () => {
    const { statusDetail } = await import('../src/core/combat/statusDisplay');
    const s = fight({ hand: [c('jab')] });
    s.fight!.rhythm = 2; s.fight!.lastAttackMove = 'punch';
    applyStatusEffect('player', s, 'strength', 2, 1);
    applyStatusEffect('enemy', s, 'vulnerable', 2, 1);
    play(s);
    const hit = s.pendingEvents!.find(e => e.t === 'Damage' && e.target === 'enemy') as any;
    expect(hit.parts.map((p: any) => p.label)).toEqual(['จังหวะ +2', 'แข็งแกร่ง +1', 'เปราะบาง ×1.5']);
    expect(hit.parts.find((p: any) => p.id === 'vulnerable').side).toBe('enemy');
    const w = s.enemy!.statusEffects!.find(e => e.id === 'vulnerable')!;
    expect(statusDetail(w, 'enemy')).toContain('ผีโดนตี ดาเมจ ×1.5');
  });

  it('คำอธิบายอ่อนแอตรงกับโค้ดจริง (25% ไม่ใช่ 50%)', async () => {
    const { statusDetail } = await import('../src/core/combat/statusDisplay');
    const s = fight();
    applyStatusEffect('player', s, 'weakness', 2, 1);
    expect(statusDetail(s.player.statusEffects![0], 'player')).toContain('−25%');
    applyStatusEffect('player', s, 'stun', 2, 1);
    expect(statusDetail(s.player.statusEffects!.find(e => e.id === 'stun')!, 'player')).toContain('แต้ม −1');
  });
});

describe('ยกอธิบายตัวเอง (เจ้าของเลือกคงยก 15 ต.ค.)', () => {
  it('การ์ดที่ใช้ยกได้ระฆัง และสว่างในเทิร์นสุดท้ายของยก', async () => {
    const F = await import('../src/core/cards/fighter');
    const s = fight({ hand: [c('straight_punch'), c('jab')] });
    expect(F.roundCard(c('straight_punch'))).toBe(true);
    expect(F.roundCard(c('jab'))).toBe(false);
    s.turn = 2; expect(F.moveHint(s, c('straight_punch')).round).toBe(false);
    s.turn = 3; expect(F.moveHint(s, c('straight_punch')).round).toBe(true);
    expect(F.moveHint(s, c('jab')).round).toBeUndefined();
    expect(F.roundBeneficiaries(s)).toContain('หมัดตรง');
  });
});
