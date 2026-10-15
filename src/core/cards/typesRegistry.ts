import type {CardType} from '../types';
/** Shared by deck, archive and tutorial: all current engine types. */
export const CARD_TYPE_LABELS:Record<CardType,string>={attack:'โจมตี',action:'วิชา',spell:'คาถา',equipment:'เครื่องราง',mana:'มานา',prayer:'บทสวด',counter:'สวนกลับ',curse:'คำสาป'};
/** Type label for one card: the shaman's mana cards are เสกน้ำมนต์ (docs/mor-phi/DESIGN.md). */
export function cardTypeLabel(card:{type:CardType;class?:string}):string{return card.type==='mana'&&card.class==='shaman'?'เสกน้ำมนต์':CARD_TYPE_LABELS[card.type];}
export const CARD_TYPE_ORDER=Object.keys(CARD_TYPE_LABELS) as CardType[];
