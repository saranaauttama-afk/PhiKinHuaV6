import React from 'react';
import {Text,View} from 'react-native';
import type {CardData} from '../../src/core/types';
import {starOf} from '../../src/core/cards/model';
import {costLabel,TYPE_LABEL} from '../../src/core/cards/describe';
import {font,paper} from '../theme';
import StatIcon from './StatIcon';
import UpgradeMarks from './UpgradeMarks';
import MoveMark from './MoveMark';
/** Cost (free, points or mana), card type and stars. */
export default function CardBadges({card,cost,compact=false,ink=paper.ink,showType=false,moveHint}:{card:CardData;cost?:{ap:number;mana:number};compact?:boolean;ink?:string;showType?:boolean;moveHint?:{rhythm:boolean;after:boolean}}){
 const stars=starOf(card),label=costLabel(card,cost),ap=cost?.ap??card.ap??0,mana=cost?.mana??card.mana??0;
 return <View><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:4}}>
  <View accessibilityLabel={`${TYPE_LABEL[card.type]} · ${label}`} style={{flexDirection:'row',alignItems:'center',gap:2,flexShrink:1}}>
   {(ap>0||mana===0)&&<><StatIcon name="energy" size={compact?21:23}/><Text style={{fontFamily:font.heading,fontSize:compact?14:15,color:ink}}>{ap}</Text></>}
   {mana>0&&<><StatIcon name="mana" size={compact?21:23}/><Text style={{fontFamily:font.heading,fontSize:compact?14:15,color:ink}}>{mana}</Text></>}
   {/* left side: the part of a card still visible when the hand overlaps */}
   <View style={{marginLeft:3}}><MoveMark move={card.move} after={card.after?.move} size={compact?19:22} hint={moveHint}/></View>
  </View>
  <UpgradeMarks level={stars} compact={compact} ink={ink}/>
 </View>{showType&&<Text testID="card-detail-type" style={{color:ink,fontFamily:font.ui,fontSize:compact?11:13,marginTop:3}}>ประเภท: {TYPE_LABEL[card.type]}</Text>}</View>;
}
