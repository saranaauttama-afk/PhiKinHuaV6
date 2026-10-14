import {THAI_GHOST_POOLS} from '../monsters/thai-ghosts';
import {NIGHT_BOSSES,ULTIMATE_BOSS} from '../campaign/bosses';
import {ALL_CARDS,CURSE_CARDS} from '../pack';
import {ALL_CLASS_IDS,CHARACTER_CLASSES} from '../classes';
import type {CardData} from '../types';

export const GHOST_GROUPS=['ผีทั่วไป · ระดับ 1','ผีทั่วไป · ระดับ 2','ผีทั่วไป · ระดับ 3','ผีทั่วไป · ระดับ 4','ผีทั่วไป · ระดับ 5','ผีดุ','ผีผู้เฝ้าทาง','บอสแต่ละคืน','ผีกินหัว'];
export const CARD_GROUPS=[...ALL_CLASS_IDS.map(id=>CHARACTER_CLASSES[id].name),'ใช้ร่วมกัน','คำสาป'];
export const GHOST_CATALOG=Object.values(THAI_GHOST_POOLS).flat().map(g=>{
 const night=NIGHT_BOSSES.findIndex(b=>b.id===g.id)+1;
 const group=g.id===ULTIMATE_BOSS.id?'ผีกินหัว':night?'บอสแต่ละคืน':g.tier==='Elite'?'ผีดุ':g.tier.includes('Boss')?'ผีผู้เฝ้าทาง':GHOST_GROUPS[Number(g.tier.slice(1))-1];
 return {...g,group,night:g.id===ULTIMATE_BOSS.id?5:night||undefined};
}).sort((a,b)=>GHOST_GROUPS.indexOf(a.group)-GHOST_GROUPS.indexOf(b.group)||(a.night??a.hp)-(b.night??b.hp));
export type ArchiveCard={card:CardData;group:string;pair?:string[]};
export const CARD_CATALOG:ArchiveCard[]=[
...ALL_CARDS.filter(card=>!card.retired).map(card=>({card,group:card.class?CHARACTER_CLASSES[card.class].name:'ใช้ร่วมกัน'})),
 ...CURSE_CARDS.map(card=>({card,group:'คำสาป'})),
];
export const CORE_CARD_IDS=new Set(ALL_CARDS.filter(c=>!c.retired).map(c=>c.id));
export function archiveCards(discovered:Record<string,CardData>):ArchiveCard[]{
 const known=new Set(CARD_CATALOG.map(x=>x.card.id));
 void known;void discovered;return [...CARD_CATALOG];
}
