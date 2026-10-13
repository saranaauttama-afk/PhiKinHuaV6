// test/notfm-bosses.test.ts — boss relic rules, ความกล้า / บุญ dialogues and night-3 boss choice.
import { describe, it, expect } from 'vitest';
import type { GameState } from '../src/core/types';
import { makeCombatState, attackCard } from './helpers';
import { dealDamage } from '../src/core/combat/damage';
import { applyBossRule, bossRule, bossRuleIds, chipBossRelic, initBossRelic, tryBossRevive } from '../src/core/campaign/bossRules';
import { alignmentBoss, answerGhostTalk, ghostTalk, queueGhostTalk, secretBossReady, talkIds, ALIGNMENT_BLESSINGS } from '../src/core/campaign/alignment';
import { campaignBoss } from '../src/core/campaign/threeNight';
import { NIGHT_BOSSES, ULTIMATE_BOSS } from '../src/core/campaign/bosses';
import { ALIGNMENT } from '../src/core/balance/notfm';
import { settleCombat } from '../src/core/engine/handlers/combat';
import { makeRng } from '../src/core/rng';
import { getMonsterById } from '../src/core/monsters/thai-ghosts';

const BOSS_IDS = [...NIGHT_BOSSES.map(b => b.id), ULTIMATE_BOSS.id];

/** A fight against `bossId` with its relic, on ghost turn `turn`. */
function bossFight(bossId: string, turn = 1): GameState {
  const { state: s } = makeCombatState({ enemyHp: 100, playerHp: 50, hand: [attackCard(3), attackCard(4), attackCard(5)] });
  s.enemy!.id = bossId;
  s.enemy!.maxHp = 100;
  s.fight = { hpLost: 0, ghostTurns: turn };
  initBossRelic(s);
  return s;
}
const hit = (s: GameState, raw = 3) => dealDamage(s, { from: 'player', to: 'enemy', raw, source: { kind: 'card', cardId: 'x' } as any });
const status = (side: { statusEffects?: Array<{ id: string; stacks?: number }> }, id: string) => side.statusEffects?.find(e => e.id === id);

function campaignState(courage: number, merit: number, over: Record<string, unknown> = {}): GameState {
  const { state: s } = makeCombatState();
  s.campaign = { night: 3, difficulty: 1, completedNights: 2, unlocks: [], courage, merit, ...over } as any;
  return s;
}

describe('ข้อมูลกฎบอส', () => {
  it('บอสทั้ง 6 ตัวมีอุปกรณ์และกฎของตัวเอง', () => {
    expect(bossRuleIds().sort()).toEqual([...BOSS_IDS].sort());
    for (const id of BOSS_IDS) {
      const r = bossRule(id)!;
      expect(r.relic.length, id).toBeGreaterThan(0);
      expect(r.text.length, id).toBeGreaterThan(0);
      expect(r.durability, id).toBeGreaterThan(0);
    }
    expect(new Set(BOSS_IDS.map(id => bossRule(id)!.kind)).size).toBe(6);
  });

  it('ผีธรรมดาไม่มีอุปกรณ์', () => {
    const s = bossFight('phi-krasue');
    expect(s.fight!.relic).toBeUndefined();
  });
});

describe('กฎบอสทำงานต้นเทิร์นผี', () => {
  it('ตะเกียงหนอง: ผู้เล่นอ่อนแอทุก 2 เทิร์น', () => {
    const s = bossFight('night-head-collector', 1);
    applyBossRule(s);
    expect(status(s.player, 'weakness')).toBeUndefined();
    s.fight!.ghostTurns = 2;
    applyBossRule(s);
    expect(status(s.player, 'weakness')).toBeTruthy();
  });

  it('ระฆังวัดร้าง: ยัดการ์ดคำสาปเข้ากองจั่วทุก 2 เทิร์น', () => {
    const s = bossFight('night-bell-keeper');
    const before = s.piles.draw.length;
    for (const t of [1, 2, 3, 4]) { s.fight!.ghostTurns = t; applyBossRule(s); }
    expect(s.piles.draw.length).toBe(before + 2);
    expect(s.piles.draw.filter(c => c.id === bossRule('night-bell-keeper')!.curse)).toHaveLength(2);
  });

  it('รากไทร: แรง +2 ทุก 2 เทิร์น', () => {
    const s = bossFight('night-root-lord', 1);
    applyBossRule(s);
    expect(status(s.enemy!, 'strength')).toBeUndefined();
    s.fight!.ghostTurns = 2;
    applyBossRule(s);
    expect(status(s.enemy!, 'strength')?.stacks).toBe(bossRule('night-root-lord')!.params.stacks);
  });

  it('เสียงสะท้อน: ฟื้นเลือดตามเปอร์เซ็นต์ทุกเทิร์น', () => {
    const s = bossFight('night-cave-mother');
    s.enemy!.hp = 50;
    applyBossRule(s);
    expect(s.enemy!.hp).toBe(50 + bossRule('night-cave-mother')!.params.pct);
  });

  it('หัวที่ขโมยมา: ขโมยการ์ดในมือทีละใบ แล้วคืนเมื่ออุปกรณ์แตก', () => {
    const s = bossFight('phi-kin-hua');
    applyBossRule(s);
    s.fight!.ghostTurns = 2;
    applyBossRule(s);
    expect(s.piles.hand).toHaveLength(1);
    expect(s.fight!.relic!.stolen).toHaveLength(2);
    for (let i = 0; i < bossRule('phi-kin-hua')!.durability; i++) hit(s);
    expect(s.fight!.relic!.broken).toBe(true);
    expect(s.fight!.relic!.stolen).toHaveLength(0);
    expect(s.piles.hand).toHaveLength(3);
  });

  it('หม้อคาถา: บอสตายครั้งแรกคืนชีพ 50% ครั้งเดียว', () => {
    const s = bossFight('night-headless-king');
    s.enemy!.hp = 0;
    expect(tryBossRevive(s)).toBe(true);
    expect(s.enemy!.hp).toBe(50);
    s.enemy!.hp = 0;
    expect(tryBossRevive(s)).toBe(false);
  });

  it('หม้อคาถาคืนชีพผ่าน settleCombat แทนที่จะจบไฟต์', () => {
    const s = bossFight('night-headless-king');
    s.phase = 'combat';
    s.enemy!.hp = 0;
    settleCombat(s, makeRng('rev'));
    expect(s.phase).toBe('combat');
    expect(s.enemy!.hp).toBeGreaterThan(0);
  });
});

describe('ทำลายอุปกรณ์', () => {
  it('ทุกการโจมตีที่โดนบอสลดความทน 1 และกฎหยุดเมื่อแตก', () => {
    const s = bossFight('night-head-collector');
    const durability = bossRule('night-head-collector')!.durability;
    hit(s);
    expect(s.fight!.relic!.durability).toBe(durability - 1);
    for (let i = 1; i < durability; i++) hit(s);
    expect(s.fight!.relic!.broken).toBe(true);
    applyBossRule(s);
    expect(status(s.player, 'weakness')).toBeUndefined();
  });

  it('หม้อคาถาแตกแล้วไม่คืนชีพ', () => {
    const s = bossFight('night-headless-king');
    for (let i = 0; i < bossRule('night-headless-king')!.durability; i++) chipBossRelic(s);
    s.enemy!.hp = 0;
    expect(tryBossRevive(s)).toBe(false);
  });

  it('ดาเมจที่ไม่ใช่การโจมตี (เช่นพิษ) ไม่ลดความทน', () => {
    const s = bossFight('night-head-collector');
    dealDamage(s, { from: 'player', to: 'enemy', raw: 3, source: { kind: 'status', statusId: 'poison' } as any });
    expect(s.fight!.relic!.durability).toBe(bossRule('night-head-collector')!.durability);
  });
});

describe('ความกล้า / บุญ', () => {
  it('บทพูดทุกตัวมีผีจริงและมีสองทางเลือก', () => {
    for (const id of talkIds()) {
      const t = ghostTalk(id)!;
      expect(getMonsterById(id) || NIGHT_BOSSES.some(b => b.id === id), id).toBeTruthy();
      expect(t.line && t.courage && t.merit, id).toBeTruthy();
    }
  });

  it('ตอบกล้าได้ความกล้า +1 และเบี้ย ตอบบุญได้บุญ +1 และฟื้นเลือด ตอบเดินผ่านไม่ได้อะไร', () => {
    const s = campaignState(0, 0);
    s.player.hp = 20; s.player.maxHp = 60;
    const gold = s.player.gold;
    s.ghostTalk = { ghostId: talkIds()[0] };
    answerGhostTalk(s, 'courage');
    expect(s.campaign!.courage).toBe(1);
    expect(s.player.gold).toBe(gold + ALIGNMENT.courageGold);
    s.ghostTalk = { ghostId: talkIds()[1] };
    answerGhostTalk(s, 'merit');
    expect(s.campaign!.merit).toBe(1);
    expect(s.player.hp).toBe(20 + ALIGNMENT.meritHeal);
    s.ghostTalk = { ghostId: talkIds()[2] };
    answerGhostTalk(s, 'leave');
    expect([s.campaign!.courage, s.campaign!.merit]).toEqual([1, 1]);
    expect(s.ghostTalk).toBeUndefined();
  });

  it('ถึง 4 ได้พรครั้งเดียว และค่าไม่เกิน 6', () => {
    const s = campaignState(3, 0);
    s.blessings = [];
    for (let i = 0; i < 5; i++) { s.ghostTalk = { ghostId: talkIds()[i] }; answerGhostTalk(s, 'courage'); }
    expect(s.campaign!.courage).toBe(ALIGNMENT.max);
    expect(s.blessings.filter(b => b.id === ALIGNMENT_BLESSINGS.courage.id)).toHaveLength(1);
    expect(s.campaign!.alignmentRewards).toEqual(['courage']);
  });

  it('ผีพูดได้ไม่เกินจำนวนต่อคืน และผีธรรมดาตัวเดิมไม่พูดซ้ำ', () => {
    const id = talkIds().find(i => getMonsterById(i)?.tier !== 'Elite')!;
    const s = campaignState(0, 0, { night: 1, talked: [id], talksThisNight: 0 });
    s.enemy!.id = id;
    queueGhostTalk(s);
    expect(s.ghostTalk).toBeUndefined();
    s.campaign!.talked = [];
    s.campaign!.talksThisNight = ALIGNMENT.talksPerNight;
    queueGhostTalk(s);
    expect(s.ghostTalk).toBeUndefined();
    s.campaign!.talksThisNight = 0;
    queueGhostTalk(s);
    expect(s.ghostTalk).toEqual({ ghostId: id });
  });
});

describe('บอสคืนที่สาม', () => {
  it('คืน 1 และ 2 ตายตัว', () => {
    expect(campaignBoss(campaignState(6, 0, { night: 1 })).id).toBe(NIGHT_BOSSES[0].id);
    expect(campaignBoss(campaignState(0, 6, { night: 2 })).id).toBe(NIGHT_BOSSES[1].id);
  });

  it('กล้ามากกว่า → ปอบครูอาคม บุญมากกว่า → พรายแอ่งถ้ำ เท่ากัน → ผีป่าไทรพันราก', () => {
    expect(campaignBoss(campaignState(3, 1)).id).toBe('night-headless-king');
    expect(campaignBoss(campaignState(1, 3)).id).toBe('night-cave-mother');
    expect(campaignBoss(campaignState(2, 2)).id).toBe('night-root-lord');
  });

  it('ทั้งคู่ถึง 4 และเคยชนะบอสสุดท้าย → ผีกินหัว', () => {
    expect(secretBossReady(campaignState(4, 4))).toBe(false);
    expect(campaignBoss(campaignState(4, 4)).id).toBe('night-root-lord');
    expect(campaignBoss(campaignState(4, 4, { veteran: true })).id).toBe(ULTIMATE_BOSS.id);
    expect(campaignBoss(campaignState(5, 4, { veteran: true })).id).toBe(ULTIMATE_BOSS.id);
  });

  it('ระดับ 5 ที่ผีกินหัวมาทีหลังอยู่แล้ว ไม่สลับมาคืนที่สาม', () => {
    expect(alignmentBoss(campaignState(4, 4, { veteran: true, difficulty: 5 }), false).id).toBe('night-root-lord');
    expect(campaignBoss(campaignState(4, 4, { veteran: true, difficulty: 5 })).id).toBe('night-root-lord');
  });

  it('บอสคืนที่สามล็อกเมื่อประตูเปิด แม้ค่าจะเปลี่ยนทีหลัง', () => {
    const s = campaignState(3, 0, { finalBossId: 'night-cave-mother' });
    expect(campaignBoss(s).id).toBe('night-cave-mother');
  });
});
