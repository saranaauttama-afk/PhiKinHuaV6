import type {CardData,Command,GameState} from '../types';
import {GHOST_CATALOG} from './catalog';

export type DiscoveryRun={id:string;night:number;ghosts:Record<string,{seen:true;won:boolean}>;cards:Record<string,CardData>};
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
 const see=(id:string,won=false)=>{if(ghostIds.has(id))run.ghosts[id]={seen:true,won:won||!!run.ghosts[id]?.won};};
 // Neighbours remain in state during combat/shops; they are already revealed on the map.
 if(after.phase==='map'&&!after.chapter)after.pages?.current?.offers.forEach(o=>{if(o&&(o.kind==='monster'||o.kind==='boss'))see(o.enemyId);});
 if(after.enemy)see(after.enemy.id);
 after.defeatedEnemyIds?.forEach(id=>see(id,true));
 if(before.enemy&&(after.fightCount??0)>(before.fightCount??0))see(before.enemy.id,true);
 const owned=[...(after.masterDeck??[]),...(after.equipped??[]).flatMap(e=>e.sourceCard?[e.sourceCard]:[]),...Object.values(after.piles??{}).flat()];
 owned.forEach(card=>{
  if(!card?.id||run.cards[card.id])return;
  run.cards[card.id]=JSON.parse(JSON.stringify(card));
 });
}
/** Union snapshots of one run; loading/replaying its checkpoints cannot double-credit discoveries. */
export function mergeDiscovery(profile:ArchiveProfile,run:DiscoveryRun):ArchiveProfile{
 const old=profile.runs[run.id];const ghosts={...(old?.ghosts??{})},cards={...(old?.cards??{})};let changed=!old;
 for(const [id,g] of Object.entries(run.ghosts)){if(!ghostIds.has(id))continue;if(!ghosts[id]||(g.won&&!ghosts[id].won)){ghosts[id]={seen:true,won:!!g.won||!!ghosts[id]?.won};changed=true;}}
 for(const [id,c] of Object.entries(run.cards))if(!cards[id]){cards[id]=c;changed=true;}
 if(!changed)return profile;
 return {version:1,runs:{...profile.runs,[run.id]:{id:run.id,night:old?.night??run.night,ghosts,cards}}};
}
export function archiveProgress(profile:ArchiveProfile){
 const ghosts:Record<string,Discovery>={},cards:Record<string,Discovery>={},cardData:Record<string,CardData>={};
 const add=(out:Record<string,Discovery>,id:string,night:number,won=false)=>{const old=out[id];out[id]={seen:(old?.seen??0)+1,won:(old?.won??0)+Number(won),firstNight:old?.firstNight??night,lastNight:night};};
 for(const run of Object.values(profile.runs)){
  for(const [id,g] of Object.entries(run.ghosts))add(ghosts,id,run.night,g.won);
  for(const [id,c] of Object.entries(run.cards)){add(cards,id,run.night);cardData[id]=c;}
 }
 return {ghosts,cards,cardData};
}
/** Reject corrupt data without replacing the stored profile with a blank one. */
export function parseArchive(raw:string):ArchiveProfile{
 const p=JSON.parse(raw);if(p?.version!==1||!p.runs||typeof p.runs!=='object'||Array.isArray(p.runs))throw Error('Invalid archive');
 for(const [id,r] of Object.entries(p.runs) as [string,DiscoveryRun][]){
  if(!r||r.id!==id||!Number.isInteger(r.night)||r.night<1||r.night>5||!r.ghosts||!r.cards||typeof r.ghosts!=='object'||typeof r.cards!=='object'||Array.isArray(r.ghosts)||Array.isArray(r.cards))throw Error('Invalid discovery run');
  for(const [gid,g] of Object.entries(r.ghosts))if(!ghostIds.has(gid)||g?.seen!==true||typeof g.won!=='boolean')throw Error('Invalid ghost discovery');
  for(const [cid,c] of Object.entries(r.cards))if(!c||c.id!==cid||typeof c.name!=='string'||!['attack','skill','trap','equipment','curse','power'].includes(c.type))throw Error('Invalid card discovery');
 }
 return p;
}
