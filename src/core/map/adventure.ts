import type {GameState} from '../types';
import type {PageOffer} from './pages';
import type {RNG} from '../rng';
import {shuffle} from '../rng';
import {THAI_GHOST_POOLS,type ThaiGhostData} from '../monsters/thai-ghosts';
import {nightFinalBoss,ULTIMATE_BOSS} from '../campaign/bosses';

export type Encounter={id:string;offer:PageOffer};
export type Adventure={version:1;deck:Encounter[];cursor:number;slotIds:(string|null)[];resolvedIds:string[];skippedIds:string[];storyDone:boolean;fightsWon:number;boss:'locked'|'night'|'ultimate'|'done'};
export const ENCOUNTERS_PER_NIGHT=12;
export const FIGHTS_PER_NIGHT=5;
/** Finite deck. Drawing reserves an encounter; neither shops nor RNG can refill it. */
export function startAdventure(s:GameState,r:RNG):RNG {
 const night=s.campaign!.night;
 const tiers=(['T1','T2','T3','T4','T5'] as const).slice(Math.max(0,night-2),Math.min(5,night+1));
 const candidates=tiers.flatMap<ThaiGhostData>(t=>THAI_GHOST_POOLS[t]);
 const out=shuffle(r,candidates);r=out.rng;
 const elite=shuffle(r,THAI_GHOST_POOLS.Elite);r=elite.rng;
 const fights=out.array.slice(0,4).map(m=>({kind:'monster',tier:'normal',enemyId:m.id} as PageOffer));
 fights.push({kind:'monster',tier:'elite',enemyId:elite.array[0].id});
 const service:PageOffer['kind']=['shop_equipment','shop_remove','fusion_altar','shop_equipment','shop_remove'][night-1] as PageOffer['kind'];
 const kinds:PageOffer[]=[fights[0],{kind:'shop_card',shopId:''},{kind:'well',shopId:''},fights[1],{kind:'healing_shrine',shopId:''},fights[2],{kind:'story_event',shopId:'',eventId:`night_story_${night}`},{kind:'treasure',shopId:''},fights[3],{kind:'shop_upgrade',shopId:'',phase:1},fights[4],{kind:service,shopId:'',phase:1} as PageOffer];
 const deck=kinds.map((offer,i)=>{const id=`adventure-${night}-${i}`;return {id,offer:'shopId' in offer?{...offer,shopId:id}:offer};});
 s.journey=undefined;
 s.pages!.adventure={version:1,deck,cursor:0,slotIds:[null,null,null],resolvedIds:[],skippedIds:[],storyDone:false,fightsWon:0,boss:'locked'};
 s.pages!.current={offers:[],resolved:[]};
 for(let ix=0;ix<3;ix++)fillSlot(s,ix);
 return r;
}
function fillSlot(s:GameState,ix:number){
 const a=s.pages!.adventure!,p=s.pages!.current!;
 const entry=a.deck[a.cursor++];
 if(!entry){a.cursor=a.deck.length;a.slotIds[ix]=null;p.offers[ix]=undefined as any;p.resolved[ix]=true;return;}
 a.slotIds[ix]=entry.id;p.offers[ix]=entry.offer;p.resolved[ix]=false;
}
export function isCriticalOffer(offer:PageOffer){return offer.kind==='boss'||offer.kind==='monster'||(offer.kind==='story_event'&&offer.eventId.startsWith('night_story_'));}
export function skippableSlots(s:GameState):number[]{
 if(s.phase!=='map'||s.chapter||!s.pages?.adventure)return [];
 return s.pages.current!.offers.flatMap((o,i)=>o&&!s.pages!.current!.resolved[i]&&!isCriticalOffer(o)?[i]:[]);
}
/** Completion replaces exactly one slot, preserving all postponed neighbours. */
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
 if(a.boss==='locked'&&a.cursor===a.deck.length&&a.slotIds.every(id=>id===null)&&a.storyDone&&a.fightsWon===FIGHTS_PER_NIGHT){
  a.boss='night';a.slotIds=['night-boss',null,null];p.offers=[{kind:'boss',bossType:'final',enemyId:nightFinalBoss(s.campaign!.night).id}];p.resolved=[false];
 }
}
export function nextIntersection(s:GameState):void {
 // Snapshot indices: replacements are never discarded by the same command.
 for(const ix of skippableSlots(s))settleAdventureSlot(s,ix,true);
}
export function revealUltimate(s:GameState):void {
 const a=s.pages!.adventure!;a.boss='ultimate';a.slotIds=['ultimate-boss',null,null];
 s.pages!.current={offers:[{kind:'boss',bossType:'secret',enemyId:ULTIMATE_BOSS.id}],resolved:[false]};
 s.pages!._activeOfferIndex=undefined;s.phase='map';s.secretBossUnlocked=true;
 // The returned villagers lend their breath before the mandatory final fight.
 s.player.hp=Math.max(s.player.hp,Math.round(s.player.maxHp*.75));
 s.log.push('เสียงของชาวบ้านพยุงลมหายใจ · ฟื้นชีวิตอย่างน้อย 75% ก่อนเผชิญผีกินหัว');
}
export function adventureStage(s:GameState):number {
 const a=s.pages?.adventure;if(!a)return 0;
 return a.boss==='ultimate'?15:Math.min(14,Math.floor((a.resolvedIds.length+a.skippedIds.length)*14/ENCOUNTERS_PER_NIGHT));
}
export function validAdventure(s:Partial<GameState>):boolean {
 const a=s.pages?.adventure,p=s.pages?.current;
 if(!a||a.version!==1||!p||!s.campaign||!Array.isArray(a.deck)||a.deck.length!==ENCOUNTERS_PER_NIGHT||!Number.isInteger(a.cursor)||a.cursor<3||a.cursor>a.deck.length)return false;
 if(!Array.isArray(a.slotIds)||a.slotIds.length!==3||!Array.isArray(a.resolvedIds)||!Array.isArray(a.skippedIds))return false;
 if(!a.deck.every(e=>e&&typeof e.id==='string'&&e.offer&&typeof e.offer.kind==='string'))return false;
 const consumed=[...a.resolvedIds,...a.skippedIds],ids=a.deck.map(e=>e.id);
 if(new Set(ids).size!==ids.length||new Set(consumed).size!==consumed.length||consumed.some(id=>!ids.includes(id)))return false;
 const resolved=a.deck.filter(e=>a.resolvedIds.includes(e.id));
 if(a.skippedIds.some(id=>isCriticalOffer(a.deck.find(e=>e.id===id)!.offer)))return false;
 if(a.fightsWon!==resolved.filter(e=>e.offer.kind==='monster').length||a.storyDone!==resolved.some(e=>e.offer.kind==='story_event'&&e.offer.eventId===`night_story_${s.campaign!.night}`))return false;
 const visible=a.slotIds.filter(id=>id!==null);
 if(new Set(visible).size!==visible.length)return false;
 if(a.boss==='locked')return consumed.length+visible.length===a.cursor&&a.slotIds.every((id,i)=>id===null?p.resolved[i]===true:!p.resolved[i]&&ids.slice(0,a.cursor).includes(id)&&!consumed.includes(id)&&JSON.stringify(p.offers[i])===JSON.stringify(a.deck.find(e=>e.id===id)?.offer));
 if(a.cursor!==ENCOUNTERS_PER_NIGHT||consumed.length!==ENCOUNTERS_PER_NIGHT||!a.storyDone||a.fightsWon!==FIGHTS_PER_NIGHT)return false;
 const boss=p.offers[0];
 if(!boss||boss.kind!=='boss'||visible.length!==1)return false;
 if(a.boss==='night')return visible[0]==='night-boss'&&boss.enemyId===nightFinalBoss(s.campaign.night).id&&!p.resolved[0];
 if(a.boss==='ultimate')return s.campaign.night===5&&visible[0]==='ultimate-boss'&&boss.enemyId===ULTIMATE_BOSS.id&&!p.resolved[0];
 return a.boss==='done'&&p.resolved[0]===true;
}
