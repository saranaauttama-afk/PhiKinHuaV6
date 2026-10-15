import React from 'react';
import Svg,{Path,Circle,Rect,Ellipse,G} from 'react-native-svg';
import InkIcon,{type InkSymbol} from './InkIcon';
import StatusArt from './battle/StatusArt';
import {palette,paper,hudPictogramColors} from '../theme';
export type StatSymbol=InkSymbol|'draw'|'bell'|'mana'|'water_bowl';
/** Miniature objects drawn in ink, ochre and bone, rather than modern UI symbols. */
export default function StatIcon({name,size=22}:{name:StatSymbol;size?:number}) {
 if(name==='water_bowl')return <StatusArt name="water_bowl" size={size}/>;
 const ink=paper.ink,gold=hudPictogramColors.energy,tan=hudPictogramColors.cards;
 let art:React.ReactNode;
 if(name==='energy'||name==='energy_boost')art=<>
  <Path d="M11.6 1.5Q9 5 12 6.5Q13.6 8 11.6 10Q17 9 15.8 5.8Q14.8 3.5 11.6 1.5Z" fill="#b15b30" stroke={ink} strokeWidth="1.1"/>
  <Path d="M11.7 6.4Q11 8 12.3 8.8" fill="none" stroke={tan} strokeWidth=".7"/>
  <Path d="M4 13Q-.5 12 1.8 9.7Q3.4 8.7 5 11.6" fill="#b38a51" stroke={ink} strokeWidth="1.1"/>
  <Path d="M3 12.6Q12 9.5 21 12.4L18.8 17Q12 20 5.5 17Z M8.2 18.2L7.1 20.5Q12 23 17 20.6L15.7 18.2Z" fill="#b58b52" stroke={ink} strokeWidth="1.2"/>
  <Path d="M3 12.5Q11.6 8.8 21 12.4Q12.3 16.1 3 12.5Z" fill={tan} stroke={ink} strokeWidth="1.1"/>
  <Path d="M6.1 12.5Q12 10.8 17.9 12.4M7.2 16L8.1 17M10 16.8L10.5 18M14.2 17L13.8 18M17 15.8L16.3 17M9 20Q12 21 15 20" fill="none" stroke={ink} strokeWidth=".7"/>
  <Path d="M12 9V12.4" stroke={ink} strokeWidth="1.3"/>
 </>;
 else if(name==='mana')art=<>
  <Path d="M16 3Q14 6 16 7Q18 6 16 3Z M21 6Q19 9 21 10Q23 9 21 6Z" fill={hudPictogramColors.mana} stroke={ink} strokeWidth=".8"/>
  <Path d="M3 12H21Q20 19 15 20H9Q4 19 3 12Z M8 20H16L18 22H6Z" fill={tan} stroke={ink} strokeWidth="1.2"/>
  <Ellipse cx="12" cy="12" rx="9" ry="3" fill={hudPictogramColors.mana} stroke={ink} strokeWidth="1.2"/>
  <Path d="M6 12Q9 10 12 12T18 12M8 16Q12 19 16 16" fill="none" stroke={ink} strokeWidth=".9"/>
  <Path d="M6 2L11 12 M4 3L9 12 M8 2L13 12" stroke={gold} strokeWidth="1.2"/>
 </>;
 else if(name==='gold')art=<><Circle cx="12" cy="12" r="10" fill={gold} stroke={ink} strokeWidth="1.5"/><Circle cx="12" cy="12" r="8" fill="none" stroke={ink}/><Rect x="9" y="9" width="6" height="6" fill={palette.ink} stroke={tan}/><Path d="M6 6L8 7M17 5L16 8M5 16L8 17M17 17L16 19" stroke={ink} strokeWidth="1.5"/></>;
 else if(name==='deck'||name==='draw')art=<><Path d="M2 11L16 8L22 13L8 16Z M2 11V18L8 22L22 19V13" fill={tan} stroke={ink} strokeWidth="1.2"/><Path d="M3 14L8 18L21 15M3 17L8 20L21 17M8 16V22" fill="none" stroke={ink}/>{name==='deck'?<><Path d="M2 9L16 6L22 11L8 14Z" fill={tan} stroke={ink}/><Path d="M9 7L12 12V20M13 6L16 11V20" stroke="#765334" strokeWidth="1.8"/></>:<><Path d="M8 12L9 2L16 3L15 14Z" fill={tan} stroke={ink}/><Path d="M18 3Q23 6 20 10M19 7L20 10L23 8" fill="none" stroke={gold} strokeWidth="1.7"/></>}</>;
 else if(name==='hand')art=<><Path d="M1 8L8 5L14 21L7 23Z" fill={tan} stroke={ink}/><Path d="M8 3L15 2L19 21L12 22Z" fill={tan} stroke={ink}/><Path d="M16 3L23 5L19 23L12 21Z" fill={tan} stroke={ink}/><Path d="M18 9L16 17M16 12L20 13" stroke="#8a3025" strokeWidth="1.4"/></>;
 else if(name==='blessing')art=<><Circle cx="12" cy="3" r="2" fill="none" stroke={gold}/><Path d="M12 5Q5 10 4 21Q12 24 20 21Q19 10 12 5Z" fill="#765334" stroke={gold}/><Path d="M12 8Q7 12 7 20H17Q17 12 12 8Z" fill={gold} stroke={ink}/><Circle cx="12" cy="12" r="1.6" fill={ink}/><Path d="M12 14L9 18H15Z M8 20H16" fill={ink} stroke={ink}/></>;
 else if(name==='bell')art=<><Circle cx="12" cy="3" r="2" fill="none" stroke={gold}/><Path d="M7 8Q12 3 17 8L20 20H4Z" fill="#b38949" stroke={ink} strokeWidth="1.3"/><Path d="M8 9L6 18H18L16 9M12 8V18" fill="none" stroke={ink}/><Ellipse cx="12" cy="20" rx="9" ry="2" fill={gold} stroke={ink}/><Circle cx="12" cy="20" r="1.5" fill={ink}/></>;
 else if(name==='block')art=<><Path d="M5 3Q12 0 19 3V13Q19 19 12 23Q5 19 5 13Z" fill={tan} stroke={ink} strokeWidth="1.5"/><Path d="M8 5Q12 3 16 5V13Q16 17 12 20Q8 17 8 13Z" fill="#846548" stroke={ink}/><Path d="M9 6L15 16M15 6L9 16M8 10H16M8 14H16" fill="none" stroke={tan} strokeWidth=".8"/><Circle cx="12" cy="12" r="3" fill={gold} stroke={ink} strokeWidth="1.2"/><Circle cx="12" cy="12" r="1" fill={ink}/></>;
 else if(name==='spell_charging')art=<><Path d="M9 3H15V7L20 16Q22 22 12 22Q2 22 4 16L9 7Z" fill="#92aaa2" stroke={ink} strokeWidth="1.3"/><Path d="M5 16Q12 13 19 16M9 4H15M8 19Q12 21 16 19" fill="none" stroke={ink}/></>;
 else return <InkIcon name={name} size={size} color={palette.moonDim}/>;
 return <Svg accessible={false} width={size} height={size} viewBox="0 0 24 24"><G strokeLinecap="round" strokeLinejoin="round">{art}</G></Svg>;
}
