import type {GameState} from '../types';
import type {PageOffer} from './pages';
import type {RNG} from '../rng';
import {shuffle} from '../rng';
import {THAI_GHOST_POOLS,type ThaiGhostData} from '../monsters/thai-ghosts';
import {nightFinalBoss,NIGHT_BOSSES,ULTIMATE_BOSS} from '../campaign/bosses';

export type Encounter={id:string;offer:PageOffer};
export type Adventure={version:2;deck:Encounter[];cursor:number;slotIds:(string|null)[];pendingIds:string[];deferredIds:string[];resolvedIds:string[];skippedIds:string[];storyDone:boolean;fightsWon:number;boss:'locked'|'night'|'ultimate'|'done'};
const finalIds=new Set([...NIGHT_BOSSES.map(m=>m.id),ULTIMATE_BOSS.id]);
/** Every existing ghost except the six difficulty-specific final bosses. */
export const ADVENTURE_GHOSTS:ThaiGhostData[]=Object.values(THAI_GHOST_POOLS).flat().filter(m=>!finalIds.has(m.id));
export const FIGHTS_PER_NIGHT=ADVENTURE_GHOSTS.length;
export const ENCOUNTERS_PER_NIGHT=FIGHTS_PER_NIGHT+13;
export function adventureFightTotal(night?:number){return FIGHTS_PER_NIGHT+(night===5?2:1);}
/** Same full roster every night; shuffle within stages, never sample a subset. */
export function startAdventure(s:GameState,r:RNG):RNG {
 const night=s.campaign!.night;
 const groups=[THAI_GHOST_POOLS.T1,THAI_GHOST_POOLS.T2,THAI_GHOST_POOLS.T3,THAI_GHOST_POOLS.T4,THAI_GHOST_POOLS.T5,THAI_GHOST_POOLS.Elite,ADVENTURE_GHOSTS.filter(m=>m.tier.includes('Boss'))];
 const fights:PageOffer[]=[];
 for(const group of groups){const out=shuffle(r,group);r=out.rng;fights.push(...out.array.map(m=>({kind:'monster',tier:m.tier.startsWith('T')?'normal':'elite',enemyId:m.id} as PageOffer)));}
 const services:PageOffer[]=[{kind:'shop_card',shopId:''},{kind:'well',shopId:''},{kind:'treasure',shopId:''},{kind:'shop_upgrade',shopId:'',phase:1},{kind:'healing_shrine',shopId:''},{kind:'shop_equipment',shopId:''},{kind:'story_event',shopId:'',eventId:`night_story_${night}`},{kind:'shop_card',shopId:''},{kind:'well',shopId:''},{kind:'shop_remove',shopId:'',phase:1},{kind:'treasure',shopId:''},{kind:'fusion_altar',shopId:''},{kind:'healing_shrine',shopId:''}];
 const kinds:PageOffer[]=[fights[0],services[0],services[1]];
 let service=2;
 for(let i=1;i<fights.length;i++){kinds.push(fights[i]);if(i%2===0&&service<services.length)kinds.push(services[service++]);}
 while(service<services.length)kinds.push(services[service++]);
 const deck=kinds.map((offer,i)=>{const id=`adventure-${night}-${i}`;return {id,offer:'shopId' in offer?{...offer,shopId:id}:offer};});
 s.journey=undefined;
 s.pages!.adventure={version:2,deck,cursor:0,slotIds:[null,null,null],pendingIds:[],deferredIds:[],resolvedIds:[],skippedIds:[],storyDone:false,fightsWon:0,boss:'locked'};
 s.pages!.current={offers:[],resolved:[]};
 for(let ix=0;ix<3;ix++)fillSlot(s,ix);
 return r;
}
function fillSlot(s:GameState,ix:number){
 const a=s.pages!.adventure!,p=s.pages!.current!;
 const pendingId=a.cursor<a.deck.length?undefined:a.pendingIds.shift();
 const entry=a.cursor<a.deck.length?a.deck[a.cursor++]:a.deck.find(e=>e.id===pendingId);
 if(!entry){a.slotIds[ix]=null;p.offers[ix]=undefined as any;p.resolved[ix]=true;return;}
 a.slotIds[ix]=entry.id;p.offers[ix]=entry.offer;p.resolved[ix]=false;
}
export function isCriticalOffer(offer:PageOffer){return offer.kind==='boss'||offer.kind==='monster'||(offer.kind==='story_event'&&offer.eventId.startsWith('night_story_'));}
export function skippableSlots(s:GameState):number[]{
 if(s.phase!=='map'||s.chapter||!s.pages?.adventure)return [];
 const a=s.pages.adventure;
 return s.pages.current!.offers.flatMap((o,i)=>o&&!s.pages!.current!.resolved[i]&&(!isCriticalOffer(o)||(o.kind==='monster'&&(a.cursor<a.deck.length||a.pendingIds.length>0)))?[i]:[]);
}
function checkGate(s:GameState){
 const a=s.pages!.adventure!,p=s.pages!.current!;
 if(a.boss==='locked'&&a.cursor===a.deck.length&&!a.pendingIds.length&&a.slotIds.every(id=>id===null)&&a.storyDone&&a.fightsWon===FIGHTS_PER_NIGHT){
  a.boss='night';a.slotIds=['night-boss',null,null];p.offers=[{kind:'boss',bossType:'final',enemyId:nightFinalBoss(s.campaign!.night).id}];p.resolved=[false];
 }
}
/** Completion replaces only its own slot. Discard commands cannot delete ghosts. */
export function settleAdventureSlot(s:GameState,ix:number,skipped=false):void {
 const a=s.pages?.adventure,p=s.pages?.current;if(!a||!p)return;
 const id=a.slotIds[ix],offer=p.offers[ix];
 if(!id||!offer||a.resolvedIds.includes(id)||a.skippedIds.includes(id))return;
 if(skipped&&isCriticalOffer(offer))return;
 (skipped?a.skippedIds:a.resolvedIds).push(id);
 if(!skipped&&offer.kind==='monster')a.fightsWon++;
 if(!skipped&&offer.kind==='story_event'&&offer.eventId.startsWith('night_story_'))a.storyDone=true;
 fillSlot(s,ix);
 s.pages!._activeOfferIndex=undefined;s.pages!._shopUsed=false;
 s.pages!.pageIndex=a.resolvedIds.length+a.skippedIds.length;
 checkGate(s);
}
export function nextIntersection(s:GameState):void {
 const indices=skippableSlots(s),a=s.pages?.adventure,p=s.pages?.current;if(!a||!p||!indices.length)return;
 // Remove the old board first, then draw: a replacement cannot be skipped in this command.
 for(const ix of indices){const id=a.slotIds[ix]!,o=p.offers[ix];
  if(o.kind==='monster'){a.pendingIds.push(id);if(!a.deferredIds.includes(id))a.deferredIds.push(id);}
  else a.skippedIds.push(id);
  a.slotIds[ix]=null;p.offers[ix]=undefined as any;p.resolved[ix]=true;
 }
 for(const ix of indices)fillSlot(s,ix);
 s.pages!._activeOfferIndex=undefined;s.pages!._shopUsed=false;
 s.pages!.pageIndex=a.resolvedIds.length+a.skippedIds.length;
 checkGate(s);
}
export function revealUltimate(s:GameState):void {
 const a=s.pages!.adventure!;a.boss='ultimate';a.slotIds=['ultimate-boss',null,null];
 s.pages!.current={offers:[{kind:'boss',bossType:'secret',enemyId:ULTIMATE_BOSS.id}],resolved:[false]};
 s.pages!._activeOfferIndex=undefined;s.phase='map';s.secretBossUnlocked=true;
 // No free refill: spending healing early matters through the final battle.
}
export function adventureStage(s:GameState):number {
 const a=s.pages?.adventure;if(!a)return 0;
 return a.boss==='ultimate'?15:Math.min(14,Math.floor(Math.max(0,a.cursor-3)*14/(ENCOUNTERS_PER_NIGHT-3)));
}
export function validAdventure(s:Partial<GameState>):boolean {
 const a=s.pages?.adventure,p=s.pages?.current;
 if(!a||a.version!==2||!p||!s.campaign||!Array.isArray(a.deck)||a.deck.length!==ENCOUNTERS_PER_NIGHT||!Number.isInteger(a.cursor)||a.cursor<3||a.cursor>a.deck.length)return false;
 if(!Array.isArray(a.slotIds)||a.slotIds.length!==3||![a.resolvedIds,a.skippedIds,a.pendingIds,a.deferredIds].every(Array.isArray))return false;
 if(!a.deck.every(e=>e&&typeof e.id==='string'&&e.offer&&typeof e.offer.kind==='string'))return false;
 const monsters=a.deck.filter(e=>e.offer.kind==='monster').map(e=>(e.offer as Extract<PageOffer,{kind:'monster'}>).enemyId);
 if(monsters.length!==FIGHTS_PER_NIGHT||new Set(monsters).size!==FIGHTS_PER_NIGHT||ADVENTURE_GHOSTS.some(m=>!monsters.includes(m.id)))return false;
 const consumed=[...a.resolvedIds,...a.skippedIds],ids=a.deck.map(e=>e.id),drawn=ids.slice(0,a.cursor);
 if(new Set(ids).size!==ids.length||new Set(consumed).size!==consumed.length||consumed.some(id=>!drawn.includes(id)))return false;
 const resolved=a.deck.filter(e=>a.resolvedIds.includes(e.id));
 if(a.skippedIds.some(id=>isCriticalOffer(a.deck.find(e=>e.id===id)!.offer)))return false;
 if(a.fightsWon!==resolved.filter(e=>e.offer.kind==='monster').length||a.storyDone!==resolved.some(e=>e.offer.kind==='story_event'&&e.offer.eventId===`night_story_${s.campaign!.night}`))return false;
 if(new Set(a.deferredIds).size!==a.deferredIds.length||a.deferredIds.some(id=>!drawn.includes(id)||a.deck.find(e=>e.id===id)?.offer.kind!=='monster'))return false;
 const visible=a.slotIds.filter(id=>id!==null),outstanding=[...visible,...a.pendingIds];
 if(new Set(outstanding).size!==outstanding.length||a.pendingIds.some(id=>!a.deferredIds.includes(id)||consumed.includes(id)))return false;
 if(a.boss==='locked')return consumed.length+outstanding.length===a.cursor&&outstanding.every(id=>drawn.includes(id)&&!consumed.includes(id))&&a.slotIds.every((id,i)=>id===null?p.resolved[i]===true:!p.resolved[i]&&JSON.stringify(p.offers[i])===JSON.stringify(a.deck.find(e=>e.id===id)?.offer));
 if(a.cursor!==ENCOUNTERS_PER_NIGHT||consumed.length!==ENCOUNTERS_PER_NIGHT||a.pendingIds.length||!a.storyDone||a.fightsWon!==FIGHTS_PER_NIGHT)return false;
 const boss=p.offers[0];
 if(!boss||boss.kind!=='boss'||visible.length!==1)return false;
 if(a.boss==='night')return visible[0]==='night-boss'&&boss.enemyId===nightFinalBoss(s.campaign.night).id&&!p.resolved[0];
 if(a.boss==='ultimate')return s.campaign.night===5&&visible[0]==='ultimate-boss'&&boss.enemyId===ULTIMATE_BOSS.id&&!p.resolved[0];
 return a.boss==='done'&&p.resolved[0]===true;
}
