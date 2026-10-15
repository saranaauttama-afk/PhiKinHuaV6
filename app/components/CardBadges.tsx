import StatusArt from './battle/StatusArt';
import React from 'react';
import {Text,View} from 'react-native';
import type {CardData} from '../../src/core/types';
import {starOf} from '../../src/core/cards/model';
import {costLabel,TYPE_LABEL} from '../../src/core/cards/describe';
import {fighterColors,font,paper} from '../theme';
import StatIcon from './StatIcon';
import UpgradeMarks from './UpgradeMarks';
import MoveMark from './MoveMark';
import {cardTypeLabel} from '../../src/core/cards/typesRegistry';
/** Cost (free, points or mana), card type and stars. */
export default function CardBadges({card,cost,compact=false,ink=paper.ink,showType=false,moveHint}:{card:CardData;cost?:{ap:number;mana:number};compact?:boolean;ink?:string;showType?:boolean;moveHint?:{rhythm:boolean;after:boolean;round?:boolean;stack?:number}}){
 const stars=starOf(card),label=costLabel(card,cost),ap=cost?.ap??card.ap??0,mana=cost?.mana??card.mana??0;
 return <View><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:4}}>
  <View accessibilityLabel={`${cardTypeLabel(card)} · ${label}`} style={{flexDirection:'row',alignItems:'center',gap:2,flexShrink:1}}>
   {(ap>0||mana===0)&&<><StatIcon name="energy" size={compact?21:23}/><Text style={{fontFamily:font.heading,fontSize:compact?14:15,color:ink}}>{ap}</Text></>}
   {mana>0&&<><StatIcon name="mana" size={compact?21:23}/><Text style={{fontFamily:font.heading,fontSize:compact?14:15,color:ink}}>{mana}</Text></>}
   {/* left side: the part of a card still visible when the hand overlaps */}
   <View style={{marginLeft:3}}><MoveMark move={card.move} after={card.after?.move} size={compact?19:22} hint={moveHint}/></View>
   {/* ยก: a bell on cards that get a bonus on the last turn of a round; gold ring when that is now. */}
   {moveHint?.round!=null&&<View testID={moveHint.round?'card-round-live':'card-round'} style={{marginLeft:2,borderRadius:12,borderWidth:moveHint.round?2:0,borderColor:fighterColors.hint,opacity:moveHint.round?1:.45}}><StatusArt name="round" size={compact?17:19}/></View>}
   {/* หมอผี: สาด ×น้ำมนต์ / ปลุกยันต์ ×ยันต์ right now. */}
   {moveHint?.stack!=null&&<Text testID="card-stack-live" style={{marginLeft:3,fontFamily:font.heading,fontSize:compact?12:13,color:moveHint.stack>0?fighterColors.hint:ink,opacity:moveHint.stack>0?1:.5}}>×{moveHint.stack}</Text>}
  </View>
  <UpgradeMarks level={stars} compact={compact} ink={ink}/>
 </View>{showType&&<Text testID="card-detail-type" style={{color:ink,fontFamily:font.ui,fontSize:compact?11:13,marginTop:3}}>ประเภท: {cardTypeLabel(card)}</Text>}</View>;
}
