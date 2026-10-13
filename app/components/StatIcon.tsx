import {hudPictogramColors,palette} from '../theme';
import React from 'react';
import Svg,{Path} from 'react-native-svg';
import InkIcon,{type InkSymbol} from './InkIcon';
/** Small ink pictograms; colour and silhouette both identify each resource. */
export default function StatIcon({name,size=20}:{name:InkSymbol;size?:number}){
 const icons:Partial<Record<InkSymbol,[string,string]>>={
  energy:[hudPictogramColors.energy,'M14 1L3 14H10L8 23L22 9H14Z'],
  spell_charging:[hudPictogramColors.mana,'M9 2H15V6L20 16Q22 22 12 22Q2 22 4 16L9 6Z M6 15H18'],
  block:[hudPictogramColors.block,'M12 2L21 6V12Q21 19 12 23Q3 19 3 12V6Z M7 12L11 16L17 8'],
  hand:[hudPictogramColors.cards,'M2 9L8 7L13 21L7 23Z M9 4L15 3L19 20L13 21Z M17 2L23 4L21 20'],
  deck:[hudPictogramColors.cards,'M7 2H21V19H7Z M3 6H6V22H18V20 M10 7H18 M10 11H18 M10 15H18'],
 };
 const def=icons[name];if(!def)return <InkIcon name={name} size={size} color={palette.moon}/>;
 return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d={def[1]} fill={def[0]} fillOpacity={.75} stroke={def[0]} strokeWidth={1.4} strokeLinejoin="round"/></Svg>;
}
