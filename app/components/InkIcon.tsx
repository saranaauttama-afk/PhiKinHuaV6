import React from 'react';
import {paper} from '../theme';
import Svg, { Path, Circle } from 'react-native-svg';
export type InkSymbol = 'hp'|'energy'|'block'|'gold'|'deck'|'blessing'|'hand'|'attack'|'rest'|'house'|'lantern'|'walk'|'check'|'settings';
const paths: Record<InkSymbol,string> = {
 hp:'M12 21C8 17 2 13 2 7C2 1 10 1 12 6C14 1 22 1 22 7C22 13 16 17 12 21Z',
 energy:'M14 2L4 14H11L9 23L21 10H14Z',
 block:'M12 2L21 6V12Q20 19 12 23Q4 19 3 12V6Z M8 12L11 15L17 8',
 gold:'M8 5H16L18 9Q24 22 12 22Q0 22 6 9Z M9 2L12 5L15 2 M15 11Q7 8 8 13Q8 16 15 15Q18 21 8 18 M12 9V20',
 deck:'M4 5L17 2L22 20L9 23Z M3 8L1 10L6 23 M10 9L16 8 M11 13L17 12 M12 17L18 16',
 blessing:'M5 2H19V22H5Z M9 6L15 18 M15 6L9 18 M7 12H17 M12 4V20',
 hand:'M4 9L9 7L13 21L8 23Z M10 4L15 3L19 20L14 21Z M17 2L22 3L21 19',
 attack:'M4 21L8 17 M6 14L10 18 M8 16L17 3L21 2L21 6L10 18 M3 3L15 16 M14 19L19 14 M17 17L21 21',
 rest:'M12 3Q8 9 12 12Q16 9 16 5Q23 16 18 20Q8 26 5 17Q3 10 8 6 M4 23L20 21 M5 21L20 23',
 house:'M2 10L12 2L22 10 M4 9V20H20V9 M9 20V13H15V20 M2 23H22',
 lantern:'M9 4V2H15V4 M7 6H17L19 19H5Z M5 21H19 M12 8V17 M8 11L16 16 M16 11L8 16',
 walk:'M6 3L10 5L8 11L4 10Z M16 13L20 15L18 22L14 20Z',
 check:'M3 12L9 19L21 4',
 settings:'M9 2H15L16 6L21 7L23 12L19 15L19 20L13 23L9 19L4 19L1 13L5 9L5 4Z'
};
export default function InkIcon({name,size=24,color=paper.ink}:{name:InkSymbol;size?:number;color?:string}) {
 return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d={paths[name]} fill={name==='hp'?color:'none'} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>{name==='settings'&&<Circle cx="12" cy="12" r="3" fill="none" stroke={color} strokeWidth="1.5"/>}</Svg>;
}
