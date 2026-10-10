import type {CardData,Command,GameState} from '../types';
import {GHOST_CATALOG} from './catalog';

export type DiscoveryRun={id:string;night:number;ghostNights?:Record<string,{first:number;last:number}>;cardNights?:Record<string,{first:number;last:number}>;ghosts:Record<string,{seen:true;won:boolean}>;cards:Record<string,CardData>};
export type ArchiveProfile={version:1;runs:Record<string,DiscoveryRun>};
export type Discovery={seen:number;won:number;firstNight:number;lastNight:number};
const ghostIds=new Set(GHOST_CATALOG.map(g=>g.id));
export const emptyArchive=():ArchiveProfile=>({version:1,runs:{}});
/** Engine records only revealed ghosts and owned cards, never shops/reward candidates or future deck entries. */
export function trackDiscovery(before:GameState,after:GameState,cmd?:Command):void{
 if(!after.seed||after.phase==='start')return;
 if(cmd?.type==='NewRun'||!after.discovery){
  after.discovery={id:cmd?.type==='NewRun'?(cmd.discoveryId??`${after.seed}:${after.classId}:${after.campaign?.night??1}`):`legacy:${after.seed}:${after.classId}:${after.campaign?.night??1}`,night:after.campaign?.night??1,ghosts:{},cards:{}};
 }
 const run=after.discovery;
 const night=after.campaign?.night??1;
 const note=(key:'ghostNights'|'cardNights',id:string)=>{if(!after.campaign?.difficulty)return;const entries=run[key]??={};entries[id]={first:entries[id]?.first??night,last:night};};
 const see=(id:string,won=false)=>{if(ghostIds.has(id)){run.ghosts[id]={seen:true,won:won||!!run.ghosts[id]?.won};note('ghostNights',id);}};
 // Neighbours remain in state during combat/shops; they are already revealed on the map.
 if(after.phase==='map'&&!after.chapter)after.pages?.current?.offers.forEach(o=>{if(o&&(o.kind==='monster'||o.kind==='boss'))see(o.enemyId);});
 if(after.enemy)see(after.enemy.id);
 after.defeatedEnemyIds?.forEach(id=>{if(!run.ghosts[id]?.won)see(id,true);});
 if(before.enemy&&(after.fightCount??0)>(before.fightCount??0))see(before.enemy.id,true);
 const owned=[...(after.masterDeck??[]),...(after.equipped??[]).flatMap(e=>e.sourceCard?[e.sourceCard]:[]),...Object.values(after.piles??{}).flat()];
 owned.forEach(card=>{
  if(!card?.id||run.cards[card.id])return;
  note('cardNights',card.id);
  run.cards[card.id]=JSON.parse(JSON.stringify(card));
 });
}
/** Union snapshots of one run; loading/replaying its checkpoints cannot double-credit discoveries. */
export function mergeDiscovery(profile:ArchiveProfile,run:DiscoveryRun):ArchiveProfile{
 const old=profile.runs[run.id];const ghosts={...(old?.ghosts??{})},cards={...(old?.cards??{})};let changed=!old;
 for(const [id,g] of Object.entries(run.ghosts)){if(!ghostIds.has(id))continue;if(!ghosts[id]||(g.won&&!ghosts[id].won)){ghosts[id]={seen:true,won:!!g.won||!!ghosts[id]?.won};changed=true;}}
 for(const [id,c] of Object.entries(run.cards))if(!cards[id]){cards[id]=c;changed=true;}
 const mergeNights=(key:'ghostNights'|'cardNights')=>{if(!run[key])return old?.[key];const out={...(old?.[key]??{})};for(const [id,n] of Object.entries(run[key]!)){const prev=out[id];const next={first:Math.min(prev?.first??n.first,n.first),last:Math.max(prev?.last??n.last,n.last)};if(!prev||JSON.stringify(prev)!==JSON.stringify(next)){changed=true;out[id]=next;}}return out;};
 const ghostNights=mergeNights('ghostNights'),cardNights=mergeNights('cardNights');
 if(!changed)return profile;
 return {version:1,runs:{...profile.runs,[run.id]:{id:run.id,night:old?.night??run.night,ghosts,cards,...(ghostNights?{ghostNights}:{}),...(cardNights?{cardNights}:{})}}};
}
export function archiveProgress(profile:ArchiveProfile){
 const ghosts:Record<string,Discovery>={},cards:Record<string,Discovery>={},cardData:Record<string,CardData>={};
 const add=(out:Record<string,Discovery>,id:string,night:number,won=false,lastNight=night)=>{const old=out[id];out[id]={seen:(old?.seen??0)+1,won:(old?.won??0)+Number(won),firstNight:old?.firstNight??night,lastNight};};
 for(const run of Object.values(profile.runs)){
  for(const [id,g] of Object.entries(run.ghosts))add(ghosts,id,run.ghostNights?.[id]?.first??run.night,g.won,run.ghostNights?.[id]?.last??run.night);
  for(const [id,c] of Object.entries(run.cards)){add(cards,id,run.cardNights?.[id]?.first??run.night,false,run.cardNights?.[id]?.last??run.night);cardData[id]=c;}
 }
 return {ghosts,cards,cardData};
}
/** Reject corrupt data without replacing the stored profile with a blank one. */
export function parseArchive(raw:string):ArchiveProfile{
 const p=JSON.parse(raw);if(p?.version!==1||!p.runs||typeof p.runs!=='object'||Array.isArray(p.runs))throw Error('Invalid archive');
 for(const [id,r] of Object.entries(p.runs) as [string,DiscoveryRun][]){
  if(!r||r.id!==id||!Number.isInteger(r.night)||r.night<1||r.night>5||!r.ghosts||!r.cards||typeof r.ghosts!=='object'||typeof r.cards!=='object'||Array.isArray(r.ghosts)||Array.isArray(r.cards))throw Error('Invalid discovery run');
  for(const key of ['ghostNights','cardNights'] as const)if(r[key]){if(typeof r[key]!=='object'||Array.isArray(r[key]))throw Error('Invalid discovery nights');for(const [entry,n] of Object.entries(r[key]!))if(!(key==='ghostNights'?r.ghosts[entry]:r.cards[entry])||!Number.isInteger(n.first)||!Number.isInteger(n.last)||n.first<1||n.last>5||n.first>n.last)throw Error('Invalid discovery nights');}
  for(const [gid,g] of Object.entries(r.ghosts))if(!ghostIds.has(gid)||g?.seen!==true||typeof g.won!=='boolean')throw Error('Invalid ghost discovery');
  for(const [cid,c] of Object.entries(r.cards))if(!c||c.id!==cid||typeof c.name!=='string'||!['attack','skill','trap','equipment','curse','power'].includes(c.type))throw Error('Invalid card discovery');
 }
 return p;
}
