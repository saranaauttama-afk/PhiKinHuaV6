import { describe, expect, it } from 'vitest';
import { bedsFor, oneShotsFor, stepGain, zoneOf, BATTLE_DRUM, BATTLE_DRUMS, MAP_KEEPS_MUSIC, ZONES } from '../src/audio/zones';
import { BEDS, SFX } from '../src/audio/manifest';
import { ADVENTURE_GEOGRAPHY } from '../app/scenePresentation';

describe('zone audio (ชุด 3)', () => {
  it('every journey scene maps to a zone', () => {
    for (const id of [...ADVENTURE_GEOGRAPHY, '16-secret-throne']) expect(zoneOf(id)).toBeTruthy();
    expect(zoneOf('01-village')).toBe('village');
    expect(zoneOf('13-cave-river')).toBe('cave');
    expect(zoneOf(undefined)).toBe('village');
  });

  it('map plays the zone bed, no music (cut 16 Oct), never the drum', () => {
    const beds = bedsFor('01-village', 'map');
    expect(beds).toContain('villageBed');
    expect(beds).not.toContain(BATTLE_DRUM);
    expect(MAP_KEEPS_MUSIC).toBe(false);
    expect(beds).not.toContain('music');
  });

  it('battle drops the music and adds wind + drum; victory keeps the wind, stops the drum', () => {
    expect(bedsFor('01-village', 'battle')).toEqual(['villageBattleBed', BATTLE_DRUM]);
    expect(bedsFor('01-village', 'victory')).toEqual(['villageBattleBed']);
  });

  it('every zone has its own beds; one-shots never borrow the village ones', () => {
    expect(bedsFor('08-stream', 'map')).toContain('waterBed');
    expect(bedsFor('06-bamboo-forest', 'battle')).toEqual(['forestBattleBed', BATTLE_DRUM]);
    expect(oneShotsFor('15-otherworld-gate', 'map')).not.toContain('villageDogHowl');
    expect(bedsFor('12-cave-mouth', 'battle')).toEqual(['caveBattleBed', BATTLE_DRUM]);
  });

  it('drum follows the ghost kind', () => {
    expect(bedsFor('01-village', 'battle', 'elite')).toEqual(['villageBattleBed', 'battleDrumElite']);
    expect(bedsFor('15-otherworld-gate', 'battle', 'boss')).toEqual(['otherworldBattleBed', 'battleDrumBoss']);
    expect(bedsFor('01-village', 'victory', 'boss')).toEqual(['villageBattleBed']);
  });

  it('one-shots only on the map', () => {
    expect(oneShotsFor('01-village', 'map')).toContain('villageDogHowl');
    expect(oneShotsFor('05-cremation-ground', 'map')).toContain('cremationOwl');
    expect(oneShotsFor('01-village', 'battle')).toEqual([]);
  });

  it('every bed/one-shot a zone names has a file', () => {
    for (const scene of [...ADVENTURE_GEOGRAPHY, '16-secret-throne'])
      for (const mode of ['map', 'battle', 'victory'] as const)
        for (const id of bedsFor(scene, mode)) expect(BEDS[id].file).not.toBeNull();
    for (const z of Object.values(ZONES)) for (const id of z.oneShots) expect(SFX[id].files.length).toBeGreaterThan(0);
    for (const id of Object.values(BATTLE_DRUMS)) expect(BEDS[id].file).not.toBeNull();
  });

  it('fade steps move toward the target and never overshoot', () => {
    expect(stepGain(0, 1, 50, 1500)).toBeCloseTo(50 / 1500);
    expect(stepGain(1, 0, 50, 1500)).toBeCloseTo(1 - 50 / 1500);
    expect(stepGain(0.99, 1, 50, 1500)).toBe(1);
    expect(stepGain(0.01, 0, 50, 1500)).toBe(0);
    expect(stepGain(0.3, 1, 50, 0)).toBe(1);
  });
});
