import { describe, it, expect } from 'vitest';
import { buildEpisode } from '../src/core/map/episode';
import { moveTo } from '../src/core/map/journey';
import { baseNewState } from '../src/core/commands';
import { mapSceneStage } from '../app/scenePresentation';

describe('destination scene after completing a location', () => {
  it('follows the next offers rather than the last visited node or fight count', () => {
    const state = baseNewState('scene-regression');
    state.journey = buildEpisode();
    expect(mapSceneStage(state)).toBe(0);
    for (let row = 0; row < 4; row++) {
      moveTo(state.journey, `e${row}_0`);
      // The engine retains the visited node while the map shows the next row.
      expect(mapSceneStage(state)).toBe(row + 1);
    }
  });
  it('keeps the destination through unrelated UI state updates', () => {
    const state = baseNewState('scene-persistence');
    state.journey = buildEpisode();
    moveTo(state.journey, 'e1_0');
    state.fightCount = 1;
    expect(mapSceneStage(state)).toBe(2);
    state.phase = 'event';
    expect(mapSceneStage(state)).toBe(2);
    state.phase = 'map';
    expect(mapSceneStage(state)).toBe(2);
  });
});

import {episodeSceneId,battleSceneStage} from '../app/scenePresentation';
it('uses five distinct episode destinations and the visited arena during combat',()=>{
 const s=baseNewState('scene-route');s.runMode='episode';s.journey=buildEpisode();
 const sources=[episodeSceneId(mapSceneStage(s))];
 for(let row=0;row<4;row++){moveTo(s.journey,`e${row}_0`);sources.push(episodeSceneId(mapSceneStage(s)));}
 expect(new Set(sources).size).toBe(5);
 moveTo(s.journey,'e2_0');s.phase='combat';
 expect(episodeSceneId(battleSceneStage(s))).toBe(sources[2]);
 expect(episodeSceneId(battleSceneStage(s))).not.toBe(episodeSceneId(mapSceneStage(s)));
});
