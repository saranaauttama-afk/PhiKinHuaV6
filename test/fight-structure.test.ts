import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { GameState } from '../src/core/types';
import type { PageOffer } from '../src/core/map/pages';
import {
  MID_BOSS_FIGHT, FINAL_BOSS_FIGHT, SECRET_BOSS_FIGHT,
} from '../src/core/map/pages';
import { SECRET_BOSS_HP_RATIO } from '../src/core/balance/weights';
import { THAI_GHOST_POOLS } from '../src/core/monsters/thai-ghosts';
import { buildJourney } from '../src/core/map/journey';
import { resolveStoryIfAny } from './helpers';

/**
 * โครงสร้างรันตาม gameSpec.txt — 15 ไฟต์, บอสกลางที่ไฟต์ 7, บอสสุดท้ายที่ 15
 *
 * เดิมบอสโผล่ตอน pool มอนหมด (ไฟต์ที่ 13) และประเภทบอสตัดสินจาก pageIndex
 * ซึ่งค้างที่ 0 → ได้ 'final' เสมอ BossMid กับ SecretBoss จึงเข้าไม่ถึงเลย
 */

type FightRecord = {
  index: number;
  kind: string;
  bossType?: string;
  enemyId: string;
  /** สถานะทันทีหลังปิดโหนดของไฟต์นี้ — ใช้ตรวจว่าเดินทางต่อได้จริง */
  phaseAfter: string;
  offersAfter: number;
};

type RunResult = {
  state: GameState;
  fights: FightRecord[];
};

/** เล่นรันจนจบ โดยชนะทุกไฟต์ทันที และคุมเลือดตอนจบบอสสุดท้ายได้ */
function playFullRun(seed: string, opts: { hpRatioAtFinal?: number } = {}): RunResult {
  let s: any = { seed, phase: 'start', turn: 0 };
  let r = makeRng(seed);
  const go = (c: any) => { const o = applyCommand(s, c, r); s = o.state; r = o.rng; };

  go({ type: 'NewRun', seed });
  go({ type: 'ChooseStarterBlessing', index: 0 });

  const fights: FightRecord[] = [];
  let guard = 0;

  while (guard++ < 500 && s.phase !== 'run_complete') {
    const offers: PageOffer[] = s.pages?.current?.offers ?? [];
    if (!offers.length) break;

    const i = offers.findIndex((o: any) => o.kind === 'monster' || o.kind === 'boss');
    if (i < 0) {
      // ชั้นพักบนเส้นทาง — ต้องแวะโหนดใดโหนดหนึ่งแล้วปิด ถึงจะเปิดชั้นถัดไป
      go({ type: 'ChooseOffer', index: 0 });
      resolveStoryIfAny(s, go);
      go({ type: 'CompleteNode' });
      continue;
    }

    const offer: any = offers[i];
    go({ type: 'ChooseOffer', index: i });
    if (s.phase !== 'combat') break;

    const index = (s.fightCount ?? 0) + 1;

    // คุมเลือดถ้าเป็นบอสสุดท้าย เพื่อทดสอบเงื่อนไขศึกลับ
    if (offer.bossType === 'final' && opts.hpRatioAtFinal != null) {
      s.player.hp = Math.max(1, Math.round(s.player.maxHp * opts.hpRatioAtFinal));
    }

    // ชนะด้วยการเล่นการ์ดจริง เพื่อให้ผ่านเส้นทางชัยชนะของ engine เอง
    // (fightCount เพิ่มใน grantExpAndQueueLevelUp ซึ่งถูกเรียกจาก PlayCard)
    s.piles.hand = [
      { id: 'kill', name: 'kill', type: 'attack', cost: 0, dmg: 9999, instanceId: 'kill1' },
    ];
    go({ type: 'PlayCard', index: 0 });

    if (s.phase === 'levelup') go({ type: 'SkipLevelUp' });
    go({ type: 'CompleteNode' });
    if (s.phase === 'levelup') go({ type: 'SkipLevelUp' });

    fights.push({
      index,
      kind: offer.kind,
      bossType: offer.bossType,
      enemyId: offer.enemyId,
      phaseAfter: s.phase,
      offersAfter: (s.pages?.current?.offers ?? []).length,
    });
  }

  return { state: s, fights };
}

describe('ลำดับไฟต์ตรงตามสเปค', () => {
  it('บอสกลางอยู่ที่ไฟต์ 7 พอดี', () => {
    const { fights } = playFullRun('struct-1');
    const mid = fights.find(f => f.bossType === 'mid');
    expect(mid).toBeDefined();
    expect(mid!.index).toBe(MID_BOSS_FIGHT);
  });

  it('บอสสุดท้ายอยู่ที่ไฟต์ 15 พอดี', () => {
    const { fights } = playFullRun('struct-1');
    const fin = fights.find(f => f.bossType === 'final');
    expect(fin).toBeDefined();
    expect(fin!.index).toBe(FINAL_BOSS_FIGHT);
  });

  it('รันจบที่ 15 ไฟต์เมื่อไม่ปลดล็อคศึกลับ', () => {
    const { state, fights } = playFullRun('struct-1', { hpRatioAtFinal: 0.2 });
    expect(fights).toHaveLength(FINAL_BOSS_FIGHT);
    expect(state.phase).toBe('run_complete');
    expect(state.runSummary?.won).toBe(true);
    expect(state.runSummary?.beatSecretBoss).toBe(false);
  });

  it('ไฟต์ 1-6 และ 8-14 ไม่ใช่บอส', () => {
    const { fights } = playFullRun('struct-1');
    for (const f of fights) {
      const isBossFight = f.index === MID_BOSS_FIGHT
        || f.index === FINAL_BOSS_FIGHT
        || f.index === SECRET_BOSS_FIGHT;
      expect(f.kind === 'boss').toBe(isBossFight);
    }
  });

  it('ผลเหมือนกันทุก seed (โครงสร้างถูกล็อก ไม่ขึ้นกับการสุ่ม)', () => {
    for (const seed of ['s-a', 's-b', 's-c']) {
      const { fights } = playFullRun(seed, { hpRatioAtFinal: 0.2 });
      expect(fights).toHaveLength(FINAL_BOSS_FIGHT);
      expect(fights[MID_BOSS_FIGHT - 1].bossType).toBe('mid');
      expect(fights[FINAL_BOSS_FIGHT - 1].bossType).toBe('final');
    }
  });
});

describe('บอสมาจาก pool ที่ถูกต้อง', () => {
  const idsOf = (tier: keyof typeof THAI_GHOST_POOLS) =>
    THAI_GHOST_POOLS[tier].map(m => m.id);

  it('บอสกลางมาจาก BossMid และบอสสุดท้ายมาจาก BossFinal', () => {
    const { fights } = playFullRun('struct-2', { hpRatioAtFinal: 0.2 });
    const mid = fights.find(f => f.bossType === 'mid')!;
    const fin = fights.find(f => f.bossType === 'final')!;

    expect(idsOf('BossMid')).toContain(mid.enemyId);
    expect(idsOf('BossFinal')).toContain(fin.enemyId);
  });

  it('ชั้นบอสบนเส้นทางมีทางเดียว — เลี่ยงไม่ได้', () => {
    for (const seed of ['boss-page', 'bp-2', 'bp-3']) {
      const { journey } = buildJourney(makeRng(seed));
      const bossRows = journey.rows.filter(row =>
        row.some(id => journey.nodes[id].offer.kind === 'boss')
      );
      expect(bossRows.length, `seed ${seed}`).toBeGreaterThan(0);
      for (const row of bossRows) {
        expect(row, `seed ${seed}`).toHaveLength(1);
      }
    }
  });
});

describe('ศึกลับกับพระยามัจจุราช', () => {
  it('เลือดถึงเกณฑ์ตอนชนะบอสสุดท้าย → ปลดล็อคและได้สู้ต่อเป็นไฟต์ 16', () => {
    const { state, fights } = playFullRun('secret-1', {
      hpRatioAtFinal: SECRET_BOSS_HP_RATIO + 0.1,
    });

    expect(state.secretBossUnlocked).toBe(true);
    expect(fights).toHaveLength(SECRET_BOSS_FIGHT);
    expect(fights[SECRET_BOSS_FIGHT - 1].bossType).toBe('secret');
    expect(THAI_GHOST_POOLS.SecretBoss.map(m => m.id))
      .toContain(fights[SECRET_BOSS_FIGHT - 1].enemyId);
  });

  it('ชนะศึกลับแล้วจบรัน พร้อมบันทึกว่าชนะศึกลับ', () => {
    const { state } = playFullRun('secret-1', {
      hpRatioAtFinal: SECRET_BOSS_HP_RATIO + 0.1,
    });
    expect(state.phase).toBe('run_complete');
    expect(state.runSummary?.beatSecretBoss).toBe(true);
    expect(state.runSummary?.fights).toBe(SECRET_BOSS_FIGHT);
  });

  it('เลือดต่ำกว่าเกณฑ์ → ไม่ปลดล็อค', () => {
    const { state } = playFullRun('secret-2', {
      hpRatioAtFinal: SECRET_BOSS_HP_RATIO - 0.1,
    });
    expect(state.secretBossUnlocked).toBeFalsy();
    expect(state.runSummary?.beatSecretBoss).toBe(false);
  });
});

describe('ชนะบอสกลางแล้วเดินทางต่อ ไม่ใช่จบรัน', () => {
  it('หลังบอสกลาง ยังมีทางให้เดินต่อ', () => {
    const { fights } = playFullRun('mid-cont', { hpRatioAtFinal: 0.2 });
    const mid = fights.find(f => f.bossType === 'mid')!;

    expect(mid).toBeDefined();
    expect(mid.phaseAfter).not.toBe('run_complete');
    expect(mid.phaseAfter).not.toBe('victory');
    expect(mid.offersAfter).toBeGreaterThan(0);
  });

  it('บอสสุดท้ายเป็นปลายทางจริง — ไม่มีทางเดินต่อ', () => {
    const { fights, state } = playFullRun('mid-cont', { hpRatioAtFinal: 0.2 });
    const fin = fights.find(f => f.bossType === 'final')!;

    expect(fin.phaseAfter).toBe('run_complete');
    expect(state.phase).toBe('run_complete');
  });
});

describe('ไม่สู้กับผีตัวเดิมซ้ำในรันเดียว', () => {
  /**
   * เส้นทางถูกสร้างล่วงหน้าทั้งเส้น มีโหนดสู้ 28 โหนดจากผีที่ไม่ใช่บอส 24 ตน
   * จึงสร้างแบบไม่ซ้ำเลยตั้งแต่ต้นไม่ได้ — แต่ผู้เล่นสู้จริงแค่ 13 ไฟต์ปกติ
   * `replaceDefeatedMonsters` จึงเปลี่ยนตัวตอนแสดงผลแทน
   */
  it('เดินจนจบรัน ไม่มีผีตัวไหนถูกสู้สองครั้ง', () => {
    for (const seed of ['nodup-1', 'nodup-2', 'nodup-3', 'nodup-4', 'nodup-5']) {
      const { fights } = playFullRun(seed, { hpRatioAtFinal: 0.2 });
      const ids = fights.map(f => f.enemyId);

      const seen = new Map<string, number[]>();
      ids.forEach((id, i) => {
        if (!seen.has(id)) seen.set(id, []);
        seen.get(id)!.push(i + 1);
      });
      const repeats = [...seen.entries()]
        .filter(([, at]) => at.length > 1)
        .map(([id, at]) => `${id} ที่ไฟต์ ${at.join(', ')}`);

      expect(repeats, `seed ${seed}`).toEqual([]);
      expect(ids.length, `seed ${seed}`).toBe(FINAL_BOSS_FIGHT);
    }
  });

  it('ผีที่ปราบแล้วถูกบันทึกไว้ครบ', () => {
    const { state, fights } = playFullRun('nodup-1', { hpRatioAtFinal: 0.2 });
    expect(state.defeatedEnemyIds ?? []).toEqual(fights.map(f => f.enemyId));
  });
});
