import React from 'react';
import {paper} from '../theme';
import Svg, { Path, Circle } from 'react-native-svg';
export type InkSymbol = 'hp'|'energy'|'block'|'gold'|'deck'|'blessing'|'hand'|'attack'|'rest'|'house'|'lantern'|'walk'|'check'|'settings'|'fear'|'poison'|'curse'|'corruption'|'entangle'|'weakness'|'vulnerable'|'draw_reduction'|'regeneration'|'strength'|'block_next'|'energy_boost'|'spell_charging'|'combo'|'trap';
const paths: Record<InkSymbol,string> = {
 fear:'M5 19Q1 8 8 3Q19 0 21 10Q23 18 17 21L14 18L11 22L8 19Z M7 9L10 10 M17 9L14 10 M9 15Q12 11 15 15',
 poison:'M12 2Q4 12 4 16Q4 23 12 23Q20 23 20 16Q20 12 12 2Z M8 14L16 20 M16 14L8 20',
 curse:'M3 3L21 21 M21 3L3 21 M5 8L12 2L19 8L17 19L7 19Z',
 corruption:'M5 3H19V21H5Z M8 7L14 10L9 13L16 17 M2 12H6 M18 12H22',
 entangle:'M5 4Q20 0 18 8Q0 14 7 20Q20 26 20 16Q5 6 4 14 M8 1L16 23',
 weakness:'M3 6L12 15L21 6 M3 14L12 23L21 14',
 vulnerable:'M12 2L21 6V15L16 21L13 14L16 10L10 7L12 2 M9 3L3 6V15L8 21L9 14L6 10',
 draw_reduction:'M4 3H16V19H4Z M19 6H22V22H8 M7 9L13 15 M13 9L7 15',
 regeneration:'M2 12H7L10 5L14 20L17 12H22 M12 2V6 M10 4H14',
 strength:'M3 16L7 9L11 11L12 4L18 3L20 9L17 13L22 17Q14 25 3 16Z',
 block_next:'M12 2L21 6V12Q20 19 12 23Q4 19 3 12V6Z M7 12H17 M12 7V17',
 energy_boost:'M14 2L4 14H11L9 23L21 10H14Z M3 3V8 M1 5H6',
 spell_charging:'M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z M12 7V17',
 combo:'M3 8Q6 2 10 7L16 13Q21 18 17 21Q14 24 10 19L4 13Q0 9 3 8 M8 14L16 6 M13 4L20 11',
 trap:'M3 21L8 4L12 17L16 4L21 21 M4 17H20',
 hp:'M12 21C8 17 2 13 2 7C2 1 10 1 12 6C14 1 22 1 22 7C22 13 16 17 12 21Z',
 energy:'M14 2L4 14H11L9 23L21 10H14Z',
 block:'M12 2L21 6V12Q20 19 12 23Q4 19 3 12V6Z M8 12L11 15L17 8',
 gold:'M12 2C3 2 2 10 4 17C6 24 18 24 20 17C22 10 21 2 12 2Z M12 5Q8 12 12 20 M9 7L12 8L15 7 M8 11L11 12L16 11 M8 15L11 16L16 15',
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
