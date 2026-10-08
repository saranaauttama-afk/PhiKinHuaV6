import type { GameState } from '../src/core/types';
import { reachableNodes } from '../src/core/map/journey';
import {JOURNEY_LOCATIONS} from './journeyLocations';

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
/** A fight's plan index, not its row, selects geography because rest rows are interleaved. */
export function journeySceneId(state:GameState,row:number):string {
 const plans=state.journey?.plans;const plan=plans?.[row];
 if(plan?.kind==='rest'){
  const previous=plans?.slice(0,row).reverse().find(p=>p.kind!=='rest');
  const fight=previous?previous.fightIndex:2;
  return 'rest-'+String(Math.max(2,Math.min(15,fight))).padStart(2,'0');
 }
 const fight=plan?plan.fightIndex:1;
 return fight>15?'16-secret-throne':JOURNEY_LOCATIONS[Math.max(0,Math.min(14,fight-1))].id;
}
function journeySource(id:string){
 const sources:Record<string,any>={
  '01-village':require('../assets/scence/journey/01-village.jpg'),
  '02-village-edge':require('../assets/scence/journey/02-village-edge.jpg'),
  '03-temple-gate':require('../assets/scence/journey/03-temple-gate.jpg'),
  '04-temple-court':require('../assets/scence/journey/04-temple-court.jpg'),
  '05-cremation-ground':require('../assets/scence/journey/05-cremation-ground.jpg'),
  '06-bamboo-forest':require('../assets/scence/journey/06-bamboo-forest.jpg'),
  '07-banyan':require('../assets/scence/journey/07-banyan.jpg'),
  '08-stream':require('../assets/scence/journey/08-stream.jpg'),
  '09-waterfall':require('../assets/scence/journey/09-waterfall.jpg'),
  '10-mountain-trail':require('../assets/scence/journey/10-mountain-trail.jpg'),
  '11-mountain-shrine':require('../assets/scence/journey/11-mountain-shrine.jpg'),
  '12-cave-mouth':require('../assets/scence/journey/12-cave-mouth.jpg'),
  '13-cave-river':require('../assets/scence/journey/13-cave-river.jpg'),
  '14-buried-sanctuary':require('../assets/scence/journey/14-buried-sanctuary.jpg'),
  '15-otherworld-gate':require('../assets/scence/journey/15-otherworld-gate.jpg'),
  'rest-02':require('../assets/scence/journey/rest-02.jpg'),
  'rest-04':require('../assets/scence/journey/rest-04.jpg'),
  'rest-06':require('../assets/scence/journey/rest-06.jpg'),
  'rest-08':require('../assets/scence/journey/rest-08.jpg'),
  'rest-10':require('../assets/scence/journey/rest-10.jpg'),
  'rest-12':require('../assets/scence/journey/rest-12.jpg'),
  'rest-14':require('../assets/scence/journey/rest-14.jpg'),
  'rest-15':require('../assets/scence/boss.jpg'),
  '16-secret-throne':require('../assets/scence/journey/16-secret-throne.jpg'),
 };
 return sources[id]??sources['01-village'];
}
function sceneForRow(state:GameState,row:number){
 const id=state.runMode==='episode'?episodeSceneId(row):journeySceneId(state,row);
 const name=JOURNEY_LOCATIONS.find(l=>l.id===id)?.name??(id.startsWith('rest-')?'ที่พักระหว่างทาง':'แดนมัจจุราช');
 return {key:`${state.runMode??'full'}-location-${row}-${id}`,name,source:state.runMode==='episode'?episodeSource(row):journeySource(id)};
}
export function battleScene(state:GameState){return sceneForRow(state,battleSceneStage(state));}
/** Events and shops preserve the visited rest location, including after their result. */
export function visitedScene(state:GameState){return sceneForRow(state,state.phase==='shop'||state.phase==='event'?mapSceneStage(state):battleSceneStage(state));}

/** Map offers describe the destination, while currentId is the previous visit. */
export function mapSceneStage(state: GameState): number {
  const journey = state.journey;
  if (!journey) return 0;
  return reachableNodes(journey)[0]?.row ?? journey.rowIndex;
}

export function mapScene(state:GameState){return sceneForRow(state,mapSceneStage(state));}
