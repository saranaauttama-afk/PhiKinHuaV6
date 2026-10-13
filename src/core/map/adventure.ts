import {routeFightQuota,nightEncounterCount,campaignBoss,ultimateRequired,difficultyOf,runEliteQuota} from '../campaign/threeNight';
import {ECONOMY} from '../balance/notfm';
import {next} from '../rng';
import type {GameState} from '../types';
import type {PageOffer} from './pages';
import type {RNG} from '../rng';
import {shuffle} from '../rng';
import {THAI_GHOST_POOLS,type ThaiGhostData} from '../monsters/thai-ghosts';
import {NIGHT_BOSSES,ULTIMATE_BOSS} from '../campaign/bosses';

export type Encounter={id:string;offer:PageOffer};
export type Adventure={version:5;deck:Encounter[];cursor:number;slotIds:(string|null)[];pendingIds:string[];deferredIds:string[];resolvedIds:string[];skippedIds:string[];storyDone:boolean;fightsWon:number;boss:'locked'|'night'|'ultimate'|'done';boardIndex:number;enteredBoard?:number;usedIds:string[];serviceStates:Record<string,Partial<GameState>>};
const finalIds=new Set([...NIGHT_BOSSES.map(m=>m.id),ULTIMATE_BOSS.id]);
/** Every existing ghost except the six difficulty-specific final bosses. */
export const ADVENTURE_GHOSTS:ThaiGhostData[]=Object.values(THAI_GHOST_POOLS).flat().filter(m=>!finalIds.has(m.id));
export function startAdventure(s:GameState,r:RNG):RNG {
 const night=s.campaign!.night,quota=routeFightQuota(s),eliteQuota=runEliteQuota(night,difficultyOf(s));
 const isElite=(m:ThaiGhostData)=>!m.tier.startsWith('T');
 // Identities never repeat in a run. Encounter rank is independent of folklore
 // roster tier, so there are enough distinct creatures at every difficulty.
 const available=ADVENTURE_GHOSTS.filter(m=>!s.defeatedEnemyIds?.includes(m.id));
 const out=shuffle(r,available);r=out.rng;
 const route=out.array.sort((a,b)=>Number(isElite(a))-Number(isElite(b))||(Number(a.tier.slice(1))||7)-(Number(b.tier.slice(1))||7)).slice(0,quota);
 if(route.length!==quota)throw Error('Not enough distinct route ghosts');
 const fights:PageOffer[]=route.map((m,i)=>({kind:'monster',tier:i>=quota-eliteQuota?'elite':'normal',enemyId:m.id}));
 const pick=<T,>(pool:T[]):T=>{const out=shuffle(r,pool);r=out.rng;return out.array[0];};
 // Every night guarantees one of each stop (ECONOMY); the chest is a coin flip.
 const chestRoll=next(r);r=chestRoll.rng;
 const chest=chestRoll.value<ECONOMY.chestChance?[pick<PageOffer>([{kind:'treasure',shopId:''},{kind:'treasure_single',shopId:''}])]:[];
 const services:PageOffer[]=[
  {kind:'shop_card',shopId:''},
  {kind:'blessing',shopId:''},
  {kind:'story_event',shopId:'',eventId:`run_story_${night}`},
  {kind:'shop_upgrade',shopId:'',phase:1},
  pick<PageOffer>([{kind:'well',shopId:''},{kind:'healing_shrine',shopId:''}]),
  {kind:'shop_remove',shopId:'',phase:1},
  ...chest,
 ];
 // Spread the stops evenly between the fights, the shop after the first fight.
 const after=services.map((_,k)=>Math.max(1,Math.min(fights.length-1,Math.round((k+1)*fights.length/(services.length+1)))));
 const kinds:PageOffer[]=[];
 for(let i=0;i<fights.length;i++){kinds.push(fights[i]);services.forEach((o,k)=>{if(after[k]===i+1)kinds.push(o);});if(i===2)kinds.push({kind:'next_event'});}
 const deck=kinds.map((offer,i)=>{const id=`adventure-${night}-${i}`;return {id,offer:'shopId' in offer?{...offer,shopId:id}:offer};});
 r=require('../events/story').rollNightStory(s,r);
 s.pages={pageIndex:0,adventure:{version:5,deck,cursor:0,slotIds:[null,null,null],pendingIds:[],deferredIds:[],resolvedIds:[],skippedIds:[],storyDone:false,fightsWon:0,boss:'locked',boardIndex:0,usedIds:[],serviceStates:{}},current:{offers:[],resolved:[]}};
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
function isNightStory(id:string){return id.startsWith('run_story_');}
function storyId(s:Partial<GameState>){return `run_story_${s.campaign!.night}`;}
export function isCriticalOffer(offer:PageOffer){return offer.kind==='boss'||offer.kind==='monster'||(offer.kind==='story_event'&&isNightStory(offer.eventId));}
export function skippableSlots(s:GameState):number[]{
 if(s.phase!=='map'||s.chapter||!s.pages?.adventure)return [];
 return s.pages.current!.offers.flatMap((o,i)=>o?.kind==='next_event'&&!s.pages!.current!.resolved[i]?[i]:[]);
}
function checkGate(s:GameState){
 const a=s.pages!.adventure!,p=s.pages!.current!;
 if(a.boss==='locked'&&a.storyDone&&a.fightsWon===routeFightQuota(s)){
  const ix=a.slotIds.findIndex(id=>id===null);
  if(ix<0)return;
  const boss=campaignBoss(s);if(s.campaign?.night===3)s.campaign.finalBossId=boss.id;
  a.boss='night';a.slotIds[ix]='night-boss';p.offers[ix]={kind:'boss',bossType:'final',enemyId:boss.id};p.resolved[ix]=false;
 }
}
/**
 * Completion settles only its own slot, and a new page is dealt into it straight away
 * (Night of the Full Moon style), so stops the player is saving for stay on the board.
 * Discard commands cannot delete ghosts.
 */
export function settleAdventureSlot(s:GameState,ix:number,skipped=false):void {
 const a=s.pages?.adventure,p=s.pages?.current;if(!a||!p)return;
 const id=a.slotIds[ix],offer=p.offers[ix];
 if(!id||!offer||p.resolved[ix]||a.resolvedIds.includes(id)||a.skippedIds.includes(id))return;
 if(skipped&&isCriticalOffer(offer))return;
 (skipped?a.skippedIds:a.resolvedIds).push(id);p.resolved[ix]=true;
 if(!skipped&&offer.kind==='monster')a.fightsWon++;
 if(!skipped&&offer.kind==='story_event'&&isNightStory(offer.eventId))a.storyDone=true;
 s.pages!._activeOfferIndex=undefined;s.pages!._shopUsed=false;
 s.pages!.pageIndex=a.resolvedIds.length+a.skippedIds.length;
 refillSlot(s,ix);
}
/** Deal the next page into a settled slot; once the night's work is done the boss takes a free slot. */
function refillSlot(s:GameState,ix:number):void {
 const a=s.pages!.adventure!;
 if(a.boss!=='locked')return;
 a.slotIds[ix]=null;fillSlot(s,ix);
 checkGate(s);
}
export function revealUltimate(s:GameState):void {
 const a=s.pages!.adventure!;for(const id of a.slotIds)if(id&&a.deck.some(e=>e.id===id)&&!a.skippedIds.includes(id))a.skippedIds.push(id);a.boss='ultimate';a.slotIds=['ultimate-boss',null,null];
 s.pages!.current={offers:[{kind:'boss',bossType:'secret',enemyId:ULTIMATE_BOSS.id},undefined as any,undefined as any],resolved:[false,true,true]};
 s.pages!._activeOfferIndex=undefined;s.phase='map';s.secretBossUnlocked=true;
 // No free refill: spending healing early matters through the final battle.
}
export function adventureStage(s:GameState):number {
 const a=s.pages?.adventure;if(!a)return 0;
 if(a.boss==='ultimate')return 15;
 const local=Math.max(0,a.cursor-3)/(a.deck.length-3);
 return (s.campaign!.night-1)*5+Math.min(4,Math.floor(local*4));
}
export function advanceThreePageBoard(s:GameState):void {
 const a=s.pages!.adventure!,p=s.pages!.current!;
 if(!p.resolved.every(Boolean)||a.boss!=='locked')return;
 a.slotIds=[null,null,null];p.offers=[];p.resolved=[];
 for(let i=0;i<3;i++)fillSlot(s,i);
 a.boardIndex=(a.boardIndex??0)+1;
 checkGate(s);
}
/** Explicit skip keeps services/story visible and defers, rather than deletes, ghosts. */
export function useIntersectionPage(s:GameState,ix:number):void {
 const a=s.pages?.adventure,p=s.pages?.current;
 if(s.phase!=='map'||s.chapter||!a||!p||p.resolved[ix]||p.offers[ix]?.kind!=='next_event')return;
 const id=a.slotIds[ix]!;a.resolvedIds.push(id);p.resolved[ix]=true;
 if(a.cursor<a.deck.length||a.pendingIds.length){
  for(let i=0;i<3;i++)if(!p.resolved[i]&&p.offers[i]?.kind==='monster'){
   const pending=a.slotIds[i]!;a.pendingIds.push(pending);if(!a.deferredIds.includes(pending))a.deferredIds.push(pending);p.resolved[i]=true;
  }
  for(let i=0;i<3;i++)if(p.resolved[i]){a.slotIds[i]=null;fillSlot(s,i);}
  a.boardIndex=(a.boardIndex??0)+1;
 }
 s.pages!._activeOfferIndex=undefined;s.pages!._shopUsed=false;
 advanceThreePageBoard(s);
}
const serviceFields=['shopStock','shopBoughtItems','mysticalWell','healingShrine','_singleTreasureRandomized','rewardReceipt','blessingStock'] as const;
export function rememberAdventureService(s:GameState):void {
 if(!s.pages?.adventure||!s.currentShopId)return;
 const a=s.pages!.adventure!,saved:Record<string,unknown>={};
 for(const key of serviceFields)if((s as any)[key]!==undefined)saved[key]=JSON.parse(JSON.stringify((s as any)[key]));
 a.serviceStates[s.currentShopId]=saved;
 if((s.pages!._shopUsed||s.shopBoughtItems?.length)&&!a.usedIds.includes(s.currentShopId))a.usedIds.push(s.currentShopId);
}
export function restoreAdventureService(s:GameState,offer:PageOffer,index:number):boolean {
 if(!s.pages?.adventure||!('shopId' in offer)||offer.kind==='story_event')return false;
 const kinds:Record<string,string>={shop_card:'card',shop_equipment:'equipment',shop_remove:'remove',shop_upgrade:'upgrade',well:'well',healing_shrine:'healing',treasure:'treasure',treasure_single:'treasure_single',blessing:'blessing'};
 const saved=s.pages!.adventure!.serviceStates[offer.shopId];
 for(const key of serviceFields)delete (s as any)[key];
 if(!saved)return false;
 for(const key of serviceFields)if((saved as any)[key]!==undefined)(s as any)[key]=JSON.parse(JSON.stringify((saved as any)[key]));
 s.currentShopId=offer.shopId;s.shopKind=kinds[offer.kind] as GameState['shopKind'];s.phase='shop';s.pages!._activeOfferIndex=index;s.pages!._shopUsed=false;
 return true;
}
export function validAdventure(s:Partial<GameState>):boolean {
 const a=s.pages?.adventure,p=s.pages?.current,c=s.campaign;
 if(!a||a.version!==5||!p||!c||!Number.isInteger(c.difficulty)||c.difficulty!<1||c.difficulty!>5||!Number.isInteger(c.night)||c.night<1||c.night>3)return false;
 if(c.completedNights!==c.night-1+Number(a.boss==='ultimate'||a.boss==='done'))return false;
 if(!Array.isArray(a.deck)||(a.deck.length!==nightEncounterCount(s)&&a.deck.length!==nightEncounterCount(s)+1)||!Number.isInteger(a.cursor)||a.cursor<3||a.cursor>a.deck.length||!Number.isInteger(a.boardIndex)||a.boardIndex!<0)return false;
 if(!Array.isArray(a.slotIds)||a.slotIds.length!==3||![a.resolvedIds,a.skippedIds,a.pendingIds,a.deferredIds,a.usedIds,p.offers,p.resolved].every(Array.isArray))return false;
 if(!a.deck.every(e=>e&&typeof e.id==='string'&&e.offer&&typeof e.offer.kind==='string'))return false;
 const ids=a.deck.map(e=>e.id),drawn=ids.slice(0,a.cursor),consumed=[...a.resolvedIds,...a.skippedIds];
 if(new Set(ids).size!==ids.length||new Set(consumed).size!==consumed.length||consumed.some(id=>!drawn.includes(id)))return false;
 const monsters=a.deck.filter(e=>e.offer.kind==='monster');
 if(monsters.length!==routeFightQuota(s)||new Set(monsters.map(e=>(e.offer as any).enemyId)).size!==monsters.length||monsters.some(e=>!ADVENTURE_GHOSTS.some(m=>m.id===(e.offer as any).enemyId)))return false;
 if(a.skippedIds.some(id=>isCriticalOffer(a.deck.find(e=>e.id===id)!.offer)))return false;
 const finished=a.deck.filter(e=>a.resolvedIds.includes(e.id));
 if(a.fightsWon!==finished.filter(e=>e.offer.kind==='monster').length||a.storyDone!==finished.some(e=>e.offer.kind==='story_event'&&e.offer.eventId===storyId(s)))return false;
 const services=a.deck.filter(e=>e.offer.kind!=='monster').map(e=>e.offer);
 const count=(...kinds:string[])=>services.filter(o=>kinds.includes(o.kind)).length;
 if(count('next_event')!==1||services.filter(o=>o.kind==='story_event'&&o.eventId===storyId(s)).length!==1||count('shop_card','shop_equipment')!==1||count('well','healing_shrine')!==1||count('shop_upgrade')!==1||count('shop_remove')!==1||count('blessing')!==1||count('treasure','treasure_single')!==a.deck.length-nightEncounterCount(s))return false;
 const active=a.slotIds.filter((id,i):id is string=>id!==null&&!p.resolved[i]),outstanding=[...active,...a.pendingIds];
 if(new Set(outstanding).size!==outstanding.length||a.pendingIds.some(id=>!a.deferredIds.includes(id)||consumed.includes(id)))return false;
 if(a.usedIds.some(id=>!drawn.includes(id)||isCriticalOffer(a.deck.find(e=>e.id===id)!.offer)))return false;
 for(let i=0;i<3;i++){const id=a.slotIds[i];if(id===null){if(p.resolved[i]!==true)return false;continue;}if(id==='night-boss'||id==='ultimate-boss')continue;
  if(!drawn.includes(id)||JSON.stringify(p.offers[i])!==JSON.stringify(a.deck.find(e=>e.id===id)?.offer)||p.resolved[i]!==consumed.includes(id))return false;
 }
 if(a.boss==='locked')return consumed.length+outstanding.length===a.cursor&&outstanding.every(id=>drawn.includes(id)&&!consumed.includes(id));
 // Unused stops may still share the board with the boss.
 const waiting=active.filter(id=>id!=='night-boss'&&id!=='ultimate-boss');
 if(consumed.length+waiting.length!==a.cursor||a.cursor!==a.deck.length||a.pendingIds.length||!a.storyDone||a.fightsWon!==routeFightQuota(s))return false;
 if(waiting.some(id=>isCriticalOffer(a.deck.find(e=>e.id===id)!.offer)))return false;
 const id=a.boss==='ultimate'||a.slotIds.includes('ultimate-boss')?'ultimate-boss':'night-boss',ix=a.slotIds.indexOf(id),offer=p.offers[ix];
 return ix>=0&&offer?.kind==='boss'&&offer.enemyId===(id==='ultimate-boss'?ULTIMATE_BOSS.id:campaignBoss(s).id)&&p.resolved[ix]===(a.boss==='done')&&(id!=='ultimate-boss'||ultimateRequired(s));
}
