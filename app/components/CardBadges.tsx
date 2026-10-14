import React from 'react';
import {Text,View} from 'react-native';
import type {CardData} from '../../src/core/types';
import {starOf} from '../../src/core/cards/model';
import {costLabel,TYPE_LABEL} from '../../src/core/cards/describe';
import InkIcon from './InkIcon';
import {font,paper,hudPictogramColors} from '../theme';
import StatIcon from './StatIcon';
import UpgradeMarks from './UpgradeMarks';
/** Cost (free, points or mana), card type and stars. */
export default function CardBadges({card,cost,compact=false,ink=paper.ink}:{card:CardData;cost?:{ap:number;mana:number};compact?:boolean;ink?:string}){
 const stars=starOf(card),label=costLabel(card,cost),ap=cost?.ap??card.ap??0,mana=cost?.mana??card.mana??0;
 return <View><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:4}}>
  <View accessibilityLabel={`${TYPE_LABEL[card.type]} · ${label}`} style={{flexDirection:'row',alignItems:'center',gap:2,flexShrink:1}}>
   {(ap>0||mana===0)&&<><StatIcon name="energy" size={compact?21:23}/><Text style={{fontFamily:font.heading,fontSize:compact?14:15,color:ink}}>{ap}</Text></>}
   {mana>0&&<><StatIcon name="mana" size={compact?21:23}/><Text style={{fontFamily:font.heading,fontSize:compact?14:15,color:ink}}>{mana}</Text></>}
  </View>
  <UpgradeMarks level={stars} compact={compact} ink={ink}/>
 </View>{card.type==='equipment'&&<View testID="equipment-type-badge" style={{flexDirection:'row',alignItems:'center',gap:3,borderBottomWidth:2,borderColor:hudPictogramColors.equipment,paddingVertical:2}}><InkIcon name="blessing" size={compact?12:16} color={hudPictogramColors.equipment}/><Text style={{color:hudPictogramColors.equipment,fontFamily:font.heading,fontSize:compact?10:12}}>อุปกรณ์</Text></View>}</View>;
}
