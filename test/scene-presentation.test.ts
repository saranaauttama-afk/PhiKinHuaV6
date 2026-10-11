import { describe, it, expect } from 'vitest';
import { buildEpisode } from '../src/core/map/episode';
import { moveTo, buildJourney } from '../src/core/map/journey';
import { baseNewState } from '../src/core/commands';
import { mapSceneStage, journeySceneId } from '../app/scenePresentation';
import { JOURNEY_LOCATIONS } from '../app/journeyLocations';

it('gives all 15 fights and seven interleaved rest rows distinct destinations', () => {
 const state=baseNewState('unique-geography');
 state.journey=buildJourney({s:42}).journey;
 const ids=state.journey.plans.map((_,row)=>journeySceneId(state,row));
 expect(new Set(ids).size).toBe(ids.length);
 const fights=state.journey.plans.flatMap((p,row)=>p.kind==='rest'?[]:[journeySceneId(state,row)]);
 expect(fights).toEqual(JOURNEY_LOCATIONS.map(l=>l.id));
});
it('keeps the actual visited location for combat and rest results, independent of fightCount', () => {
 const state=baseNewState('visited-geography');
 state.journey=buildJourney({s:53}).journey;
 for(let row=0;row<state.journey.rows.length;row++){
  const expected=journeySceneId(state,mapSceneStage(state));
  moveTo(state.journey,state.journey.rows[row][0]);
  state.fightCount=99;
  expect(journeySceneId(state,battleSceneStage(state))).toBe(expected);
 }
});
it('uses separate secret-boss geography without replacing the fifteenth location',()=>{
 const state=baseNewState('secret-geography');state.journey=buildJourney({s:64},true).journey;
 const fights=state.journey.plans.flatMap((p,row)=>p.kind==='rest'?[]:[journeySceneId(state,row)]);
 expect(fights[14]).toBe('15-otherworld-gate');expect(fights[15]).toBe('16-secret-throne');
});

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
