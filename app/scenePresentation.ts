import type { GameState } from '../src/core/types';
import { reachableNodes } from '../src/core/map/journey';

export function episodeSceneId(row:number) {
  return ['crossroads','lantern','village','shrine','house'][Math.max(0,Math.min(row,4))];
}
function episodeSource(row:number) {
const episodeScenes=[
  require('../assets/ui/map-crossroads.jpg'),
  require('../assets/scence/lantern-hut.jpg'),
  require('../assets/scence/episode-village.jpg'),
  require('../assets/scence/rest.jpg'),
  require('../assets/scence/menu-haunted.jpg'),
];
return episodeScenes[Math.max(0,Math.min(row,4))];
}
export function battleSceneStage(state:GameState) {
 const j=state.journey;
 return j?.currentId?j.nodes[j.currentId]?.row??0:0;
}
export function battleScene(state:GameState) {
  const row=battleSceneStage(state);
  return {key:`battle-location-${row}`,source:state.journey?.plans[row]?.kind==='boss'?require('../assets/scence/boss.jpg'):require('../assets/scence/quiet-village.png')};
}

/** Map offers describe the destination, while currentId is the previous visit. */
export function mapSceneStage(state: GameState): number {
  const journey = state.journey;
  if (!journey) return 0;
  return reachableNodes(journey)[0]?.row ?? journey.rowIndex;
}

export function mapScene(state: GameState) {
  const row = mapSceneStage(state);
  const source = state.runMode === 'episode'
    ? episodeSource(row)
    : state.journey?.plans[row]?.kind === 'rest'
      ? require('../assets/scence/lantern-hut.jpg')
      : require('../assets/scence/quiet-village.png');
  return { key: `${state.runMode ?? 'full'}-location-${row}`, source };
}
