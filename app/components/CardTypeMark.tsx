import React from 'react';
import Svg,{Path,Circle,G} from 'react-native-svg';
import type {CardType} from '../../src/core/types';
import {cardTypeInkColors} from '../theme';

export const typeInk:Record<CardType,string>={attack:cardTypeInkColors.strike,action:cardTypeInkColors.strike,counter:cardTypeInkColors.strike,spell:cardTypeInkColors.arcane,mana:cardTypeInkColors.arcane,prayer:cardTypeInkColors.arcane,equipment:cardTypeInkColors.gear,curse:cardTypeInkColors.curse};
const marks:Record<CardType,string>={
 attack:'M5 22L9 17 M5 14L11 20 M8 17L18 3L22 1L22 6L11 19 M15 8L18 5',
 action:'M4 19L3 12L5 10L7 11L7 6Q9 4 10 6L10 10L11 4Q13 2 14 5L14 10L16 5Q18 4 18 7L18 12L20 9Q22 9 22 12L20 18L17 22L8 22Z M7 13L17 14 M8 17L16 18',
 spell:'M12 2L21 7V17L12 22L3 17V7Z M7 7H17V17H7Z M12 4V20 M5 12H19 M9 9L15 15 M15 9L9 15',
 mana:'M3 12Q12 8 21 12Q12 16 3 12Z M3 12Q4 19 9 20H15Q20 19 21 12 M8 21H16 M7 11Q10 13 13 11T18 11 M12 1Q8 6 12 7Q16 6 12 1Z',
 prayer:'M4 5L20 3L22 18L6 21Z M2 7L4 22L19 21 M6 9L17 7 M7 12L18 10 M8 16L18 14 M5 4L8 20 M17 4L20 19',
 counter:'M5 5L12 2L19 5V12Q18 18 12 22Q6 18 5 12Z M20 9Q15 6 11 11L8 15 M8 9V15H14',
 equipment:'M12 5Q5 11 3 22Q12 25 21 22Q19 11 12 5Z M12 9L6 21H18Z M9 18L12 14L15 18 M7 21H17',
 curse:'M6 22Q2 16 4 9Q5 2 12 2Q19 2 21 9Q22 15 18 20L15 18L12 22L9 19Z M7 9L10 11 M17 9L14 11 M10 16Q12 13 14 16 M4 6L2 3 M20 5L23 2',
};
/** Shape identifies the type; the ink palette groups related types. */
export default function CardTypeMark({type,size=18,ink=typeInk[type]}:{type:CardType;size?:number;ink?:string}){
 return <Svg accessible={false} testID={'type-mark-'+type} width={size} height={size} viewBox="0 0 26 26"><G transform="rotate(-5 13 13)" fill="none" stroke={ink} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><Path d={marks[type]}/>{type==='equipment'&&<><Circle cx="12" cy="3" r="2"/><Circle cx="12" cy="12" r="1" fill={ink}/></>}</G></Svg>;
}
