import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { GameState } from '../src/core/types';
import type { PageOffer } from '../src/core/map/pages';
import { FINAL_BOSS_FIGHT, MID_BOSS_FIGHT } from '../src/core/map/pages';
import { getMonsterById, THAI_GHOST_POOLS } from '../src/core/monsters/thai-ghosts';
import { EXP_BY_TIER, GOLD_BY_TIER, nextExpForLevel } from '../src/core/balance/progression';

/**
 * เป้าหมายสมดุลจาก gameSpec.txt — ล็อกไว้กันค่าเลื่อนโดยไม่ตั้งใจ
 *
 * ก่อนปรับ: เส้นโค้ง EXP แบน (10, 14, 18, …) + รางวัลก้อนเดียวต่อกลุ่มกว้างๆ
 * วัดจริงได้ **เลเวล 14** ตอนเข้าบอสสุดท้าย ทั้งที่สเปคตั้งเป้าไว้ที่ 10
 * และ tier ของผีไม่ไต่ระดับเลย (เจอ T1 hp20 ที่ไฟต์ 9)
 */

type FightLog = {
  index: number;
  enemyId: string;
  tier?: string;
  hp: number;
  levelAfter: number;
  goldAfter: number;
};

/** เล่นจนจบรัน ชนะทุกไฟต์ แล้วบันทึกสถานะแต่ละไฟต์ */
function playRun(seed: string): { fights: FightLog[]; levelAtFinalBoss: number } {
  let s: any = { seed, phase: 'start', turn: 0 };
  let r = makeRng(seed);
  const go = (c: any) => { const o = applyCommand(s, c, r); s = o.state; r = o.rng; };

  go({ type: 'NewRun', seed });
  go({ type: 'ChooseStarterBlessing', index: 0 });

  const fights: FightLog[] = [];
  let levelAtFinalBoss = 0;
  let guard = 0;

  while (guard++ < 300 && s.phase !== 'run_complete') {
    const offers: PageOffer[] = s.pages?.current?.offers ?? [];
    if (!offers.length) break;

    const i = offers.findIndex((o: any) => o.kind === 'monster' || o.kind === 'boss');
    if (i < 0) {
      const ne = offers.findIndex((o: any) => o.kind === 'next_event');
      if (ne >= 0) { go({ type: 'ChooseOffer', index: ne }); continue; }
      go({ type: 'Proceed' });
      continue;
    }

    const offer: any = offers[i];
    go({ type: 'ChooseOffer', index: i });
    if (s.phase !== 'combat') break;

    const index = (s.fightCount ?? 0) + 1;
    if (index === FINAL_BOSS_FIGHT) levelAtFinalBoss = s.player.level;

    const hp = s.enemy.hp;
    const tier = getMonsterById(offer.enemyId)?.tier;

    s.piles.hand = [
      { id: 'k', name: 'k', type: 'attack', cost: 0, dmg: 9999, instanceId: 'k1' },
    ];
    go({ type: 'PlayCard', index: 0 });
    if (s.phase === 'levelup') go({ type: 'SkipLevelUp' });
    go({ type: 'CompleteNode' });
    if (s.phase === 'levelup') go({ type: 'SkipLevelUp' });

    fights.push({ index, enemyId: offer.enemyId, tier, hp, levelAfter: s.player.level, goldAfter: s.player.gold });
  }

  return { fights, levelAtFinalBoss };
}

const SEEDS = ['bal-a', 'bal-b', 'bal-c', 'bal-d'];

describe('เส้นโค้ง EXP', () => {
  it('EXP ที่ต้องใช้เพิ่มขึ้นทุกเลเวล ไม่แบน', () => {
    for (let lv = 1; lv < 12; lv++) {
      expect(nextExpForLevel(lv + 1)).toBeGreaterThan(nextExpForLevel(lv));
    }
  });

  it('รวม EXP ถึงเลเวล 10 เท่ากับ 960 ตามสเปค', () => {
    let total = 0;
    for (let lv = 1; lv <= 9; lv++) total += nextExpForLevel(lv);
    expect(total).toBe(960);
  });
});

describe('รางวัลต่างกันตาม tier ของผี', () => {
  it('tier สูงกว่าให้ EXP และทองมากกว่าเสมอ', () => {
    const order = ['T1', 'T2', 'T3', 'T4', 'T5'] as const;
    for (let i = 1; i < order.length; i++) {
      expect(EXP_BY_TIER[order[i]]).toBeGreaterThan(EXP_BY_TIER[order[i - 1]]);
      expect(GOLD_BY_TIER[order[i]]).toBeGreaterThan(GOLD_BY_TIER[order[i - 1]]);
    }
    expect(EXP_BY_TIER.Elite).toBeGreaterThan(EXP_BY_TIER.T5);
    expect(EXP_BY_TIER.BossFinal).toBeGreaterThan(EXP_BY_TIER.BossMid);
  });

  it('ผีต่าง tier ให้รางวัลไม่เท่ากันจริงตอนเล่น', () => {
    const { fights } = playRun('bal-a');
    const byTier = new Map<string, Set<number>>();
    let prevGold = 0;
    for (const f of fights) {
      if (!f.tier) continue;
      const gained = f.goldAfter - prevGold;
      prevGold = f.goldAfter;
      if (!byTier.has(f.tier)) byTier.set(f.tier, new Set());
      byTier.get(f.tier)!.add(gained);
    }
    // อย่างน้อยต้องมีมากกว่าหนึ่งค่า แปลว่าไม่ได้ให้ก้อนเดียวเท่ากันหมด
    const allGains = new Set([...byTier.values()].flatMap(v => [...v]));
    expect(allGains.size).toBeGreaterThan(1);
  });
});

describe('เลเวลตอนเข้าบอสสุดท้าย', () => {
  it('ถึงเลเวล 10 ตามเป้า (ยอมคลาด ±1)', () => {
    for (const seed of SEEDS) {
      const { levelAtFinalBoss } = playRun(seed);
      expect(levelAtFinalBoss, `seed ${seed}`).toBeGreaterThanOrEqual(9);
      expect(levelAtFinalBoss, `seed ${seed}`).toBeLessThanOrEqual(11);
    }
  });
});

describe('ความยากไต่ระดับ', () => {
  it('ผีช่วงท้ายเลือดหนากว่าช่วงต้นอย่างชัดเจน', () => {
    for (const seed of SEEDS) {
      const { fights } = playRun(seed);
      const early = fights.filter(f => f.index <= 4 && f.index !== MID_BOSS_FIGHT);
      const late  = fights.filter(f => f.index >= 10 && f.index < FINAL_BOSS_FIGHT);

      const avg = (xs: FightLog[]) => xs.reduce((a, b) => a + b.hp, 0) / Math.max(1, xs.length);
      expect(avg(late), `seed ${seed}`).toBeGreaterThan(avg(early) * 1.8);
    }
  });

  it('ไม่เจอผี T1 ในช่วงท้ายเกม', () => {
    for (const seed of SEEDS) {
      const { fights } = playRun(seed);
      const lateT1 = fights.filter(f => f.index >= 10 && f.tier === 'T1');
      expect(lateT1, `seed ${seed}`).toEqual([]);
    }
  });
});

describe('ความหลากหลายของผี', () => {
  it('ไม่เจอผีตัวเดิมสองไฟต์ติดกัน', () => {
    for (const seed of SEEDS) {
      const { fights } = playRun(seed);
      for (let i = 1; i < fights.length; i++) {
        expect(
          fights[i].enemyId,
          `seed ${seed} ไฟต์ ${fights[i].index} ซ้ำกับไฟต์ก่อนหน้า`
        ).not.toBe(fights[i - 1].enemyId);
      }
    }
  });

  it('รันหนึ่งได้เจอผีหลายตนพอสมควร', () => {
    const { fights } = playRun('bal-a');
    const distinct = new Set(fights.map(f => f.enemyId));
    expect(distinct.size).toBeGreaterThanOrEqual(8);
  });
});

describe('HP ของผีเรียงตาม tier', () => {
  it('ค่าเฉลี่ย HP ของ tier สูงกว่ามากกว่า tier ต่ำกว่า', () => {
    const avgHp = (tier: keyof typeof THAI_GHOST_POOLS) => {
      const list = THAI_GHOST_POOLS[tier];
      return list.reduce((a, m) => a + m.hp, 0) / list.length;
    };
    const order = ['T1', 'T2', 'T3', 'T4', 'T5', 'Elite'] as const;
    for (let i = 1; i < order.length; i++) {
      expect(avgHp(order[i])).toBeGreaterThan(avgHp(order[i - 1]));
    }
    expect(avgHp('BossFinal')).toBeGreaterThan(avgHp('BossMid'));
  });
});
