import React from 'react';
import Svg,{Path,Circle,Rect,Ellipse,G} from 'react-native-svg';
import InkIcon,{type InkSymbol} from './InkIcon';
import {palette,paper,hudPictogramColors} from '../theme';
export type StatSymbol=InkSymbol|'draw'|'bell';
/** Miniature objects drawn in ink, ochre and bone, rather than modern UI symbols. */
export default function StatIcon({name,size=22}:{name:StatSymbol;size?:number}) {
 const ink=paper.ink,gold=hudPictogramColors.energy,tan=hudPictogramColors.cards;
 let art:React.ReactNode;
 if(name==='energy'||name==='energy_boost')art=<>
  <Path d="M12 2C9 6 14 7 11 10C17 9 17 5 12 2Z" fill="#bf6a36" stroke={ink}/>
  <Path d="M3 14Q12 10 21 14L18 19Q12 22 6 19Z M2 13Q0 10 5 11" fill={gold} stroke={ink} strokeWidth="1.3"/>
  <Ellipse cx="12" cy="14" rx="9" ry="2" fill="#745130" stroke={ink}/><Path d="M12 14V10M7 18Q12 20 17 18" stroke={gold} strokeWidth="1.2"/>
 </>;
 else if(name==='gold')art=<><Circle cx="12" cy="12" r="10" fill={gold} stroke={ink} strokeWidth="1.5"/><Circle cx="12" cy="12" r="8" fill="none" stroke={ink}/><Rect x="9" y="9" width="6" height="6" fill={palette.ink} stroke={tan}/><Path d="M6 6L8 7M17 5L16 8M5 16L8 17M17 17L16 19" stroke={ink} strokeWidth="1.5"/></>;
 else if(name==='deck'||name==='draw')art=<><Path d="M2 11L16 8L22 13L8 16Z M2 11V18L8 22L22 19V13" fill={tan} stroke={ink} strokeWidth="1.2"/><Path d="M3 14L8 18L21 15M3 17L8 20L21 17M8 16V22" fill="none" stroke={ink}/>{name==='deck'?<><Path d="M2 9L16 6L22 11L8 14Z" fill={tan} stroke={ink}/><Path d="M9 7L12 12V20M13 6L16 11V20" stroke="#765334" strokeWidth="1.8"/></>:<><Path d="M8 12L9 2L16 3L15 14Z" fill={tan} stroke={ink}/><Path d="M18 3Q23 6 20 10M19 7L20 10L23 8" fill="none" stroke={gold} strokeWidth="1.7"/></>}</>;
 else if(name==='hand')art=<><Path d="M1 8L8 5L14 21L7 23Z" fill={tan} stroke={ink}/><Path d="M8 3L15 2L19 21L12 22Z" fill={tan} stroke={ink}/><Path d="M16 3L23 5L19 23L12 21Z" fill={tan} stroke={ink}/><Path d="M18 9L16 17M16 12L20 13" stroke="#8a3025" strokeWidth="1.4"/></>;
 else if(name==='blessing')art=<><Circle cx="12" cy="3" r="2" fill="none" stroke={gold}/><Path d="M12 5Q5 10 4 21Q12 24 20 21Q19 10 12 5Z" fill="#765334" stroke={gold}/><Path d="M12 8Q7 12 7 20H17Q17 12 12 8Z" fill={gold} stroke={ink}/><Circle cx="12" cy="12" r="1.6" fill={ink}/><Path d="M12 14L9 18H15Z M8 20H16" fill={ink} stroke={ink}/></>;
 else if(name==='bell')art=<><Circle cx="12" cy="3" r="2" fill="none" stroke={gold}/><Path d="M7 8Q12 3 17 8L20 20H4Z" fill="#b38949" stroke={ink} strokeWidth="1.3"/><Path d="M8 9L6 18H18L16 9M12 8V18" fill="none" stroke={ink}/><Ellipse cx="12" cy="20" rx="9" ry="2" fill={gold} stroke={ink}/><Circle cx="12" cy="20" r="1.5" fill={ink}/></>;
 else if(name==='block')art=<><Path d="M12 2L21 6V12Q20 19 12 23Q4 19 3 12V6Z" fill="#8c9c7b" stroke={ink} strokeWidth="1.4"/><Path d="M12 5L18 8V12Q17 17 12 20Q7 17 6 12V8Z" fill="none" stroke={ink}/><Path d="M8 12L11 15L16 9" stroke={ink} strokeWidth="1.7" fill="none"/></>;
 else if(name==='spell_charging')art=<><Path d="M9 3H15V7L20 16Q22 22 12 22Q2 22 4 16L9 7Z" fill="#92aaa2" stroke={ink} strokeWidth="1.3"/><Path d="M5 16Q12 13 19 16M9 4H15M8 19Q12 21 16 19" fill="none" stroke={ink}/></>;
 else return <InkIcon name={name} size={size} color={palette.moonDim}/>;
 return <Svg accessible={false} width={size} height={size} viewBox="0 0 24 24"><G strokeLinecap="round" strokeLinejoin="round">{art}</G></Svg>;
}
