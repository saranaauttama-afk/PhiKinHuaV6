import type { GameState } from '../src/core/types';
import { reachableNodes } from '../src/core/map/journey';

/** Map offers describe the destination, while currentId is the previous visit. */
export function mapSceneStage(state: GameState): number {
  const journey = state.journey;
  if (!journey) return 0;
  return reachableNodes(journey)[0]?.row ?? journey.rowIndex;
}

export function mapScene(state: GameState) {
  const row = mapSceneStage(state);
  const source = state.runMode === 'episode'
    ? [
        require('../assets/ui/map-crossroads.jpg'),
        require('../assets/scence/lantern-hut.jpg'),
        require('../assets/scence/menu-haunted.jpg'),
        require('../assets/scence/rest.jpg'),
        require('../assets/scence/menu-haunted.jpg'),
      ][Math.min(row, 4)]
    : state.journey?.plans[row]?.kind === 'rest'
      ? require('../assets/scence/lantern-hut.jpg')
      : require('../assets/scence/menu-haunted.jpg');
  return { key: `${state.runMode ?? 'full'}-location-${row}`, source };
}
