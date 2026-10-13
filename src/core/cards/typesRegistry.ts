import type {CardType} from '../types';
/** Shared by deck, archive and tutorial: all current engine types. */
export const CARD_TYPE_LABELS:Record<CardType,string>={attack:'โจมตี',action:'วิชา',spell:'คาถา',equipment:'เครื่องราง',mana:'มานา',prayer:'บทสวด',counter:'สวนกลับ',curse:'คำสาป'};
export const CARD_TYPE_ORDER=Object.keys(CARD_TYPE_LABELS) as CardType[];
