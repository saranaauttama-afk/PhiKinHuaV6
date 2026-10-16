import { describe, expect, it } from 'vitest';
import { bedsFor, oneShotsFor, stepGain, zoneOf, BATTLE_DRUM, MAP_KEEPS_MUSIC } from '../src/audio/zones';
import { BEDS, SFX } from '../src/audio/manifest';
import { ADVENTURE_GEOGRAPHY } from '../app/scenePresentation';

describe('zone audio (ชุด 3)', () => {
  it('every journey scene maps to a zone', () => {
    for (const id of [...ADVENTURE_GEOGRAPHY, '16-secret-throne']) expect(zoneOf(id)).toBeTruthy();
    expect(zoneOf('01-village')).toBe('village');
    expect(zoneOf('13-cave-river')).toBe('cave');
    expect(zoneOf(undefined)).toBe('village');
  });

  it('map plays the zone bed (plus temp music while kept), never the drum', () => {
    const beds = bedsFor('01-village', 'map');
    expect(beds).toContain('villageBed');
    expect(beds).not.toContain(BATTLE_DRUM);
    expect(beds.includes('music')).toBe(MAP_KEEPS_MUSIC);
  });

  it('battle drops the music and adds wind + drum; victory keeps the wind, stops the drum', () => {
    expect(bedsFor('01-village', 'battle')).toEqual(['villageBattleBed', BATTLE_DRUM]);
    expect(bedsFor('01-village', 'victory')).toEqual(['villageBattleBed']);
  });

  it('zones without their own files fall back to the village set', () => {
    expect(bedsFor('12-cave-mouth', 'battle')).toEqual(['villageBattleBed', BATTLE_DRUM]);
    expect(oneShotsFor('08-stream', 'map')).toEqual(['villageDogHowl']);
  });

  it('one-shots only on the map', () => {
    expect(oneShotsFor('01-village', 'map')).toEqual(['villageDogHowl']);
    expect(oneShotsFor('01-village', 'battle')).toEqual([]);
  });

  it('every bed/one-shot a zone names has a file', () => {
    for (const mode of ['map', 'battle', 'victory'] as const) {
      for (const id of bedsFor('01-village', mode)) expect(BEDS[id].file).not.toBeNull();
    }
    expect(SFX.villageDogHowl.files.length).toBeGreaterThan(0);
  });

  it('fade steps move toward the target and never overshoot', () => {
    expect(stepGain(0, 1, 50, 1500)).toBeCloseTo(50 / 1500);
    expect(stepGain(1, 0, 50, 1500)).toBeCloseTo(1 - 50 / 1500);
    expect(stepGain(0.99, 1, 50, 1500)).toBe(1);
    expect(stepGain(0.01, 0, 50, 1500)).toBe(0);
    expect(stepGain(0.3, 1, 50, 0)).toBe(1);
  });
});
