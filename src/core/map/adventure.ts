import {isThreeNight,routeFightQuota,nightEncounterCount,campaignBoss,ultimateRequired,difficultyOf,runEliteQuota} from '../campaign/threeNight';
import type {GameState} from '../types';
import type {PageOffer} from './pages';
import type {RNG} from '../rng';
import {shuffle,int} from '../rng';
import {THAI_GHOST_POOLS,type ThaiGhostData} from '../monsters/thai-ghosts';
import {NIGHT_BOSSES,ULTIMATE_BOSS} from '../campaign/bosses';

export type Encounter={id:string;offer:PageOffer};
export type Adventure={version:3|4|5;deck:Encounter[];cursor:number;slotIds:(string|null)[];pendingIds:string[];deferredIds:string[];resolvedIds:string[];skippedIds:string[];storyDone:boolean;fightsWon:number;boss:'locked'|'night'|'ultimate'|'done';boardIndex?:number;enteredBoard?:number;usedIds?:string[];serviceStates?:Record<string,Partial<GameState>>};
export const usesThreePageBoard=(s:Partial<GameState>)=>s.pages?.adventure?.version===5;
const finalIds=new Set([...NIGHT_BOSSES.map(m=>m.id),ULTIMATE_BOSS.id]);
/** Every existing ghost except the six difficulty-specific final bosses. */
export const ADVENTURE_GHOSTS:ThaiGhostData[]=Object.values(THAI_GHOST_POOLS).flat().filter(m=>!finalIds.has(m.id));
export const FIGHTS_PER_NIGHT=10;
export const ENCOUNTERS_PER_NIGHT=FIGHTS_PER_NIGHT+4;
export function adventureFightTotal(night?:number){return FIGHTS_PER_NIGHT+(night===5?2:1);}
/** Twelve familiar ghosts first, then two introductions each night. Rare elite
 * identities rotate across replays; the archive never requires a single run. */
const introductions=[
 ['phi-krasue','phi-pop','nang-tanee','phi-nang-ram','phi-pong-kang','ngu-phi-sang','phi-pret','krahang','kuman-thong','phi-tai-hong','phi-pa','mae-nak'],
 ['pop-yai','winyan-rerorn'],['phi-ha-ratri','pisaj-fai'],['asuragaya','jao-por-pa'],['yak-wat-jaeng','phi-phrai'],
];
export function mainNightRoster(night:number):ThaiGhostData[]{
 const ids=introductions.slice(0,night).flat();return ADVENTURE_GHOSTS.filter(m=>ids.includes(m.id));
}
export function nightEliteCount(night:number){return night===1?0:night===2?1:2;}
export function startAdventure(s:GameState,r:RNG):RNG {
 const night=s.campaign!.night,modern=isThreeNight(s),board=modern&&s.pages?.adventure?.version!==4,difficulty=difficultyOf(s),quota=routeFightQuota(s),rosterNight=modern?Math.min(5,night+(difficulty>=3?1:0)+(difficulty===5?1:0)):night,main=mainNightRoster(rosterNight),fresh=night>1?introductions[night-1]:[];
 const eliteQuota=modern?runEliteQuota(night,difficulty):nightEliteCount(night);
 const isElite=(m:ThaiGhostData)=>!m.tier.startsWith('T');
 if(modern)for(const elite of [false,true]){const needed=elite?eliteQuota:quota-eliteQuota,available=main.filter(m=>isElite(m)===elite).length;
  if(available<needed)main.push(...ADVENTURE_GHOSTS.filter(m=>isElite(m)===elite&&!main.some(x=>x.id===m.id)).slice(0,needed-available));
 }
 const rare=rosterNight>=3?ADVENTURE_GHOSTS.filter(m=>isElite(m)&&!main.some(x=>x.id===m.id)&&(rosterNight>=4||m.tier==='Elite')):[];
 const selected=main.filter(m=>fresh.includes(m.id));
 for(const elite of [false,true]){
  const count=(elite?eliteQuota:quota-eliteQuota)-selected.filter(m=>isElite(m)===elite).length;
  const out=shuffle(r,main.filter(m=>isElite(m)===elite&&!fresh.includes(m.id)));r=out.rng;
  selected.push(...out.array.slice(0,count));
 }
 const swap=selected.findIndex(m=>isElite(m)&&!fresh.includes(m.id));
 if(rare.length&&swap>=0){const chance=int(r,0,4);r=chance.rng;if(chance.value===0){const out=shuffle(r,rare);r=out.rng;selected[swap]=out.array[0];}}
 // Low tiers lead the route, introductions and elites arrive later.
 const shuffled=shuffle(r,selected);r=shuffled.rng;
 let route=shuffled.array.sort((a,b)=>Number(isElite(a))-Number(isElite(b))||Number(a.tier.slice(1))-Number(b.tier.slice(1)));
 if(board){
  // Identities never repeat in a run. Encounter rank is independent of folklore
  // roster tier, so there are enough distinct creatures at every difficulty.
  const available=ADVENTURE_GHOSTS.filter(m=>!s.defeatedEnemyIds?.includes(m.id));
  const out=shuffle(r,available);r=out.rng;
  route=out.array.sort((a,b)=>Number(isElite(a))-Number(isElite(b))||(Number(a.tier.slice(1))||7)-(Number(b.tier.slice(1))||7)).slice(0,quota);
  if(route.length!==quota)throw Error('Not enough distinct route ghosts');
 }
 const fights:PageOffer[]=route.map((m,i)=>({kind:'monster',tier:board?(i>=quota-eliteQuota?'elite':'normal'):isElite(m)?'elite':'normal',enemyId:m.id}));
 const pick=<T,>(pool:T[]):T=>{const out=shuffle(r,pool);r=out.rng;return out.array[0];};
 const shop=modern&&night===1?{kind:'shop_card' as const,shopId:''}:pick<PageOffer>([{kind:'shop_card',shopId:''},{kind:'shop_equipment',shopId:''}]);
 const healing=pick<PageOffer>([{kind:'well',shopId:''},{kind:'healing_shrine',shopId:''}]);
 const special=pick<PageOffer>([{kind:'treasure',shopId:''},{kind:'treasure_single',shopId:''},{kind:'shop_upgrade',shopId:'',phase:1},{kind:'shop_remove',shopId:'',phase:1}]);
 const story:PageOffer={kind:'story_event',shopId:'',eventId:`${modern?'run_story':'night_story'}_${night}`};
 const early=pick(modern?[1,2]:[1,2,3]),middle=pick(modern&&night===1?[3,4]:[4,5]),late=pick([8,9]);
 const kinds:PageOffer[]=[];
 for(let i=0;i<fights.length;i++){kinds.push(fights[i]);if(i+1===early)kinds.push(shop);if(i+1===middle)kinds.push(story);if(i+1===middle+2)kinds.push(healing);if(i+1===late&&(!modern||night>1))kinds.push(special);if(board&&i===2)kinds.push({kind:'next_event'});}
 const deck=kinds.map((offer,i)=>{const id=`adventure-${night}-${i}`;return {id,offer:'shopId' in offer?{...offer,shopId:id}:offer};});
 s.journey=undefined;
 s.pages!.adventure={version:board?5:modern?4:3,deck,cursor:0,slotIds:[null,null,null],pendingIds:[],deferredIds:[],resolvedIds:[],skippedIds:[],storyDone:false,fightsWon:0,boss:'locked',...(board?{boardIndex:0,usedIds:[],serviceStates:{}}:{})};
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
function isNightStory(id:string){return id.startsWith('night_story_')||id.startsWith('run_story_');}
function storyId(s:Partial<GameState>){return `${isThreeNight(s)?'run_story':'night_story'}_${s.campaign!.night}`;}
export function isCriticalOffer(offer:PageOffer){return offer.kind==='boss'||offer.kind==='monster'||(offer.kind==='story_event'&&isNightStory(offer.eventId));}
export function skippableSlots(s:GameState):number[]{
 if(s.phase!=='map'||s.chapter||!s.pages?.adventure)return [];
 if(usesThreePageBoard(s))return s.pages.current!.offers.flatMap((o,i)=>o?.kind==='next_event'&&!s.pages!.current!.resolved[i]?[i]:[]);
 const a=s.pages.adventure;
 return s.pages.current!.offers.flatMap((o,i)=>o&&!s.pages!.current!.resolved[i]&&(!isCriticalOffer(o)||(o.kind==='monster'&&(a.cursor<a.deck.length||a.pendingIds.length>0)))?[i]:[]);
}
function checkGate(s:GameState){
 const a=s.pages!.adventure!,p=s.pages!.current!;
 if(a.boss==='locked'&&a.storyDone&&a.fightsWon===routeFightQuota(s)){
  const ix=a.slotIds.findIndex(id=>id===null);
  if(ix<0)return;
  a.boss='night';a.slotIds[ix]='night-boss';p.offers[ix]={kind:'boss',bossType:'final',enemyId:campaignBoss(s).id};p.resolved[ix]=false;
 }
}
/** Completion replaces only its own slot. Discard commands cannot delete ghosts. */
export function settleAdventureSlot(s:GameState,ix:number,skipped=false):void {
 if(usesThreePageBoard(s)){settleBoardSlot(s,ix,skipped);return;}
 const a=s.pages?.adventure,p=s.pages?.current;if(!a||!p)return;
 const id=a.slotIds[ix],offer=p.offers[ix];
 if(!id||!offer||a.resolvedIds.includes(id)||a.skippedIds.includes(id))return;
 if(skipped&&isCriticalOffer(offer))return;
 (skipped?a.skippedIds:a.resolvedIds).push(id);
 if(!skipped&&offer.kind==='monster')a.fightsWon++;
 if(!skipped&&offer.kind==='story_event'&&isNightStory(offer.eventId))a.storyDone=true;
 fillSlot(s,ix);
 s.pages!._activeOfferIndex=undefined;s.pages!._shopUsed=false;
 s.pages!.pageIndex=a.resolvedIds.length+a.skippedIds.length;
 checkGate(s);
}
export function nextIntersection(s:GameState):void {
 if(usesThreePageBoard(s))return; // A real next_event page owns this action.
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
 const a=s.pages!.adventure!;for(const id of a.slotIds)if(id&&a.deck.some(e=>e.id===id)&&!a.skippedIds.includes(id))a.skippedIds.push(id);a.boss='ultimate';a.slotIds=['ultimate-boss',null,null];
 s.pages!.current={offers:usesThreePageBoard(s)?[{kind:'boss',bossType:'secret',enemyId:ULTIMATE_BOSS.id},undefined as any,undefined as any]:[{kind:'boss',bossType:'secret',enemyId:ULTIMATE_BOSS.id}],resolved:usesThreePageBoard(s)?[false,true,true]:[false]};
 s.pages!._activeOfferIndex=undefined;s.phase='map';s.secretBossUnlocked=true;
 // No free refill: spending healing early matters through the final battle.
}
export function adventureStage(s:GameState):number {
 const a=s.pages?.adventure;if(!a)return 0;
 if(a.boss==='ultimate')return 15;
 const local=Math.max(0,a.cursor-3)/(nightEncounterCount(s)-3);
 return isThreeNight(s)?(s.campaign!.night-1)*5+Math.min(4,Math.floor(local*4)):Math.min(14,Math.floor(local*14));
}
export function advanceThreePageBoard(s:GameState):void {
 const a=s.pages!.adventure!,p=s.pages!.current!;
 if(!p.resolved.every(Boolean)||a.boss!=='locked')return;
 a.slotIds=[null,null,null];p.offers=[];p.resolved=[];
 for(let i=0;i<3;i++)fillSlot(s,i);
 a.boardIndex=(a.boardIndex??0)+1;
 checkGate(s);
}
function settleBoardSlot(s:GameState,ix:number,skipped=false):void {
 const a=s.pages!.adventure!,p=s.pages!.current!,id=a.slotIds[ix],offer=p.offers[ix];
 if(!id||!offer||p.resolved[ix]||a.resolvedIds.includes(id)||a.skippedIds.includes(id))return;
 if(skipped&&isCriticalOffer(offer))return;
 (skipped?a.skippedIds:a.resolvedIds).push(id);p.resolved[ix]=true;
 if(!skipped&&offer.kind==='monster')a.fightsWon++;
 if(!skipped&&offer.kind==='story_event'&&isNightStory(offer.eventId))a.storyDone=true;
 s.pages!._activeOfferIndex=undefined;s.pages!._shopUsed=false;
 s.pages!.pageIndex=a.resolvedIds.length+a.skippedIds.length;
 advanceThreePageBoard(s);
}
/** Explicit skip keeps services/story visible and defers, rather than deletes, ghosts. */
export function useIntersectionPage(s:GameState,ix:number):void {
 const a=s.pages?.adventure,p=s.pages?.current;
 if(!usesThreePageBoard(s)||s.phase!=='map'||s.chapter||!a||!p||p.resolved[ix]||p.offers[ix]?.kind!=='next_event')return;
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
const serviceFields=['shopStock','shopBoughtItems','mysticalWell','healingShrine','_singleTreasureRandomized','rewardReceipt'] as const;
export function rememberAdventureService(s:GameState):void {
 if(!usesThreePageBoard(s)||!s.currentShopId)return;
 const a=s.pages!.adventure!,saved:Record<string,unknown>={};
 for(const key of serviceFields)if((s as any)[key]!==undefined)saved[key]=JSON.parse(JSON.stringify((s as any)[key]));
 (a.serviceStates??={})[s.currentShopId]=saved;
 if((s.pages!._shopUsed||s.shopBoughtItems?.length)&&!a.usedIds!.includes(s.currentShopId))a.usedIds!.push(s.currentShopId);
}
export function restoreAdventureService(s:GameState,offer:PageOffer,index:number):boolean {
 if(!usesThreePageBoard(s)||!('shopId' in offer)||offer.kind==='story_event')return false;
 const kinds:Record<string,string>={shop_card:'card',shop_equipment:'equipment',shop_remove:'remove',shop_upgrade:'upgrade',well:'well',healing_shrine:'healing',treasure:'treasure',treasure_single:'treasure_single'};
 const saved=s.pages!.adventure!.serviceStates?.[offer.shopId];
 for(const key of serviceFields)delete (s as any)[key];
 if(!saved)return false;
 for(const key of serviceFields)if((saved as any)[key]!==undefined)(s as any)[key]=JSON.parse(JSON.stringify((saved as any)[key]));
 s.currentShopId=offer.shopId;s.shopKind=kinds[offer.kind] as GameState['shopKind'];s.phase='shop';s.pages!._activeOfferIndex=index;s.pages!._shopUsed=false;
 return true;
}
function validThreePageBoard(s:Partial<GameState>):boolean {
 const a=s.pages?.adventure,p=s.pages?.current,c=s.campaign;
 if(!a||!p||!c||!isThreeNight(s)||!Number.isInteger(c.difficulty)||c.difficulty!<1||c.difficulty!>5||!Number.isInteger(c.night)||c.night<1||c.night>3)return false;
 if(c.completedNights!==c.night-1+Number(a.boss==='ultimate'||a.boss==='done'))return false;
 if(!Array.isArray(a.deck)||a.deck.length!==nightEncounterCount(s)||!Number.isInteger(a.cursor)||a.cursor<3||a.cursor>a.deck.length||!Number.isInteger(a.boardIndex)||a.boardIndex!<0)return false;
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
 if(services.filter(o=>o.kind==='next_event').length!==1||services.filter(o=>o.kind==='story_event'&&o.eventId===storyId(s)).length!==1||services.filter(o=>o.kind==='shop_card'||o.kind==='shop_equipment').length!==1||services.filter(o=>o.kind==='well'||o.kind==='healing_shrine').length!==1||services.filter(o=>['treasure','treasure_single','shop_upgrade','shop_remove'].includes(o.kind)).length!==(c.night===1?0:1))return false;
 const active=a.slotIds.filter((id,i):id is string=>id!==null&&!p.resolved[i]),outstanding=[...active,...a.pendingIds];
 if(new Set(outstanding).size!==outstanding.length||a.pendingIds.some(id=>!a.deferredIds.includes(id)||consumed.includes(id)))return false;
 if(a.usedIds!.some(id=>!drawn.includes(id)||isCriticalOffer(a.deck.find(e=>e.id===id)!.offer)))return false;
 for(let i=0;i<3;i++){const id=a.slotIds[i];if(id===null){if(p.resolved[i]!==true)return false;continue;}if(id==='night-boss'||id==='ultimate-boss')continue;
  if(!drawn.includes(id)||JSON.stringify(p.offers[i])!==JSON.stringify(a.deck.find(e=>e.id===id)?.offer)||p.resolved[i]!==consumed.includes(id))return false;
 }
 if(a.boss==='locked')return consumed.length+outstanding.length===a.cursor&&outstanding.every(id=>drawn.includes(id)&&!consumed.includes(id));
 if(consumed.length!==a.cursor||a.cursor!==a.deck.length||a.pendingIds.length||!a.storyDone||a.fightsWon!==routeFightQuota(s))return false;
 const id=a.boss==='ultimate'||a.slotIds.includes('ultimate-boss')?'ultimate-boss':'night-boss',ix=a.slotIds.indexOf(id),offer=p.offers[ix];
 return ix>=0&&offer?.kind==='boss'&&offer.enemyId===(id==='ultimate-boss'?ULTIMATE_BOSS.id:campaignBoss(s).id)&&p.resolved[ix]===(a.boss==='done')&&(id!=='ultimate-boss'||ultimateRequired(s));
}
export function validAdventure(s:Partial<GameState>):boolean {
 if(usesThreePageBoard(s))return validThreePageBoard(s);
 const a=s.pages?.adventure,p=s.pages?.current;
 if(isThreeNight(s)&&(!Number.isInteger(s.campaign?.difficulty)||s.campaign!.difficulty!<1||s.campaign!.difficulty!>5||!Number.isInteger(s.campaign!.night)||s.campaign!.night<1||s.campaign!.night>3||s.campaign!.completedNights!==s.campaign!.night-1+Number(a?.boss==='ultimate'||a?.boss==='done')))return false;
 if(!a||a.version!==(isThreeNight(s)?4:3)||!p||!s.campaign||!Array.isArray(a.deck)||a.deck.length!==nightEncounterCount(s)||!Number.isInteger(a.cursor)||a.cursor<3||a.cursor>a.deck.length)return false;
 if(!Array.isArray(a.slotIds)||a.slotIds.length!==3||![a.resolvedIds,a.skippedIds,a.pendingIds,a.deferredIds].every(Array.isArray))return false;
 if(!a.deck.every(e=>e&&typeof e.id==='string'&&e.offer&&typeof e.offer.kind==='string'))return false;
 const monsters=a.deck.filter(e=>e.offer.kind==='monster').map(e=>(e.offer as Extract<PageOffer,{kind:'monster'}>).enemyId);
 if(monsters.length!==routeFightQuota(s)||new Set(monsters).size!==routeFightQuota(s)||monsters.some(id=>!ADVENTURE_GHOSTS.some(m=>m.id===id)))return false;
 const services=a.deck.filter(e=>e.offer.kind!=='monster').map(e=>e.offer);
 if(services.filter(o=>o.kind==='shop_card'||o.kind==='shop_equipment').length!==1||services.filter(o=>o.kind==='well'||o.kind==='healing_shrine').length!==1||services.filter(o=>o.kind==='story_event'&&o.eventId===storyId(s)).length!==1||services.filter(o=>['treasure','treasure_single','shop_upgrade','shop_remove'].includes(o.kind)).length!==(isThreeNight(s)&&s.campaign.night===1?0:1))return false;
 const consumed=[...a.resolvedIds,...a.skippedIds],ids=a.deck.map(e=>e.id),drawn=ids.slice(0,a.cursor);
 if(new Set(ids).size!==ids.length||new Set(consumed).size!==consumed.length||consumed.some(id=>!drawn.includes(id)))return false;
 const resolved=a.deck.filter(e=>a.resolvedIds.includes(e.id));
 if(a.skippedIds.some(id=>isCriticalOffer(a.deck.find(e=>e.id===id)!.offer)))return false;
 if(a.fightsWon!==resolved.filter(e=>e.offer.kind==='monster').length||a.storyDone!==resolved.some(e=>e.offer.kind==='story_event'&&e.offer.eventId===storyId(s)))return false;
 if(new Set(a.deferredIds).size!==a.deferredIds.length||a.deferredIds.some(id=>!drawn.includes(id)||a.deck.find(e=>e.id===id)?.offer.kind!=='monster'))return false;
 const visible=a.slotIds.filter(id=>id!==null),outstanding=[...visible,...a.pendingIds];
 if(new Set(outstanding).size!==outstanding.length||a.pendingIds.some(id=>!a.deferredIds.includes(id)||consumed.includes(id)))return false;
 if(a.boss==='locked')return consumed.length+outstanding.length===a.cursor&&outstanding.every(id=>drawn.includes(id)&&!consumed.includes(id))&&a.slotIds.every((id,i)=>id===null?p.resolved[i]===true:!p.resolved[i]&&JSON.stringify(p.offers[i])===JSON.stringify(a.deck.find(e=>e.id===id)?.offer));
 if(a.cursor!==nightEncounterCount(s)||a.pendingIds.length||!a.storyDone||a.fightsWon!==routeFightQuota(s))return false;
 if(a.boss==='ultimate'||a.boss==='done'&&a.slotIds[0]==='ultimate-boss')return ultimateRequired(s)&&visible.length===1&&visible[0]==='ultimate-boss'&&p.offers[0]?.kind==='boss'&&p.offers[0].enemyId===ULTIMATE_BOSS.id&&(a.boss==='done'?p.resolved[0]:!p.resolved[0]);
 const ix=a.slotIds.indexOf('night-boss'),boss=p.offers[ix];
 if(ix<0||!boss||boss.kind!=='boss'||boss.enemyId!==campaignBoss(s).id)return false;
 const serviceIds=visible.filter(id=>id!=='night-boss');
 if(serviceIds.some(id=>{const ix=a.slotIds.indexOf(id);return p.resolved[ix]||JSON.stringify(p.offers[ix])!==JSON.stringify(a.deck.find(e=>e.id===id)?.offer);}))return false;
 if(consumed.length+serviceIds.length!==a.cursor||serviceIds.some(id=>!drawn.includes(id)||consumed.includes(id)||isCriticalOffer(a.deck.find(e=>e.id===id)!.offer)))return false;
 return a.boss==='night'?!p.resolved[ix]:a.boss==='done'&&p.resolved[ix]===true;

}
