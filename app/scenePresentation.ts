import type { GameState } from '../src/core/types';
import {adventureStage} from '../src/core/map/adventure';
import {JOURNEY_LOCATIONS} from './journeyLocations';

/** Night progress (0–14, 15 for the ultimate boss) selects the backdrop. */
export function battleSceneStage(state:GameState) {return adventureStage(state);}
export const mapSceneStage=battleSceneStage;
function journeySource(id:string){
 const sources:Record<string,any>={
  '01-village':require('../assets/scence/journey/thai-v24/01-village.jpg'),
  '02-village-edge':require('../assets/scence/journey/thai-v24/02-village-edge.jpg'),
  '03-temple-gate':require('../assets/scence/journey/thai-v24/03-temple-gate.jpg'),
  '04-temple-court':require('../assets/scence/journey/thai-v24/04-temple-court.jpg'),
  '05-cremation-ground':require('../assets/scence/journey/thai-v24/05-cremation-ground.jpg'),
  '06-bamboo-forest':require('../assets/scence/journey/thai-v24/06-bamboo-forest.jpg'),
  '07-banyan':require('../assets/scence/journey/thai-v24/07-banyan.jpg'),
  '08-stream':require('../assets/scence/journey/thai-v24/08-stream.jpg'),
  '09-waterfall':require('../assets/scence/journey/thai-v24/09-waterfall.jpg'),
  '10-mountain-trail':require('../assets/scence/journey/thai-v24/10-mountain-trail.jpg'),
  '11-mountain-shrine':require('../assets/scence/journey/thai-v24/11-mountain-shrine.jpg'),
  '12-cave-mouth':require('../assets/scence/journey/thai-v24/12-cave-mouth.jpg'),
  '13-cave-river':require('../assets/scence/journey/thai-v24/13-cave-river.jpg'),
  '14-buried-sanctuary':require('../assets/scence/journey/thai-v24/14-buried-sanctuary.jpg'),
  '15-otherworld-gate':require('../assets/scence/journey/thai-v24/15-otherworld-gate.jpg'),
  '16-secret-throne':require('../assets/scence/journey/thai-v24/16-secret-throne.jpg'),
 };
 return sources[id]??sources['01-village'];
}
export const ADVENTURE_GEOGRAPHY=JOURNEY_LOCATIONS.map(l=>l.id);
export function adventureSceneId(state:GameState):string {
 if(state.pages?.adventure?.boss==='ultimate')return '16-secret-throne';
 return ADVENTURE_GEOGRAPHY[Math.min(14,adventureStage(state))];
}
function scene(state:GameState){const id=adventureSceneId(state);return {key:`night-${state.campaign?.night}-${id}`,name:JOURNEY_LOCATIONS.find(l=>l.id===id)?.name??'แดนผีกินหัว',source:journeySource(id)};}
export function battleScene(state:GameState){return scene(state);}
/** Events and shops keep the current night location. */
export function visitedScene(state:GameState){return scene(state);}
export function mapScene(state:GameState){return scene(state);}
