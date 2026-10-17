import { describe, expect, it } from 'vitest';
import { cuesFor } from '../src/audio/cues';
import { SFX } from '../src/audio/manifest';

const hit = { t: 'Damage', target: 'enemy', sourceKind: 'card', modified: 6 } as any;

describe('audio cues (batch 2)', () => {
  it('one hit sound per batch, heavy replaces it, death replaces both', () => {
    expect(cuesFor([hit, hit, hit])).toEqual(['playerHit']);
    expect(cuesFor([{ t: 'HeavyHit', bonus: 4 } as any, hit])).toEqual(['heavyHit']);
    expect(cuesFor([hit, { t: 'Died', who: 'enemy' } as any])).toEqual(['ghostDeath', 'ghostWail']);
  });
  it('fighter events map to their sounds', () => {
    const c = cuesFor([
      { t: 'RhythmChanged', value: 2 }, { t: 'Riposte' }, { t: 'RoundEnd', round: 1 },
      { t: 'MinionSummoned', side: 'player', uid: 'a#1', id: 'camp_pupil' },
      { t: 'StatusApplied', target: 'enemy', effectId: 'stun', stacks: 1 },
    ] as any);
    expect(c).toEqual(expect.arrayContaining(['rhythmUp', 'riposte', 'roundBell', 'minionSummon', 'stun']));
  });
  it('losing rhythm is silent; zero-damage hits are silent', () => {
    expect(cuesFor([{ t: 'RhythmChanged', value: 0 } as any])).toEqual([]);
    expect(cuesFor([{ ...hit, modified: 0 }])).toEqual([]);
  });
  it('every cue has a manifest entry', () => {
    for (const id of ['playerHit','heavyHit','block','riposte','rhythmUp','roundBell','minionSummon','stun','ghostDeath','playerDeath','heal','debuff','turnStart','uiTap','ghostWhisper','ghostScreech','ghostWail','villagerFear'])
      expect((SFX as any)[id]).toBeDefined();
  });
});
