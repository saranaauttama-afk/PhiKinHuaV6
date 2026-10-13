import React from 'react';
import {Text,View} from 'react-native';
import type {CardData} from '../../src/core/types';
import {starOf} from '../../src/core/cards/model';
import {costLabel,TYPE_LABEL} from '../../src/core/cards/describe';
import InkIcon from './InkIcon';
import {font,paper,hudPictogramColors} from '../theme';
/** Cost (free, points or mana), card type and stars. */
export default function CardBadges({card,cost,compact=false,ink=paper.ink}:{card:CardData;cost?:{ap:number;mana:number};compact?:boolean;ink?:string}){
 const stars=starOf(card),label=costLabel(card,cost),mana=!!(cost?.mana??card.mana);
 return <View><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:4}}>
  <View accessibilityLabel={`${TYPE_LABEL[card.type]} · ${label}`} style={{flexDirection:'row',alignItems:'center',gap:2,flexShrink:1}}>
   <InkIcon name={mana?'spell_charging':'energy'} size={compact?17:20} color={ink}/>
   <Text numberOfLines={1} style={{fontFamily:font.heading,fontSize:compact?13:15,color:ink}}>{label}</Text>
  </View>
  {stars>1&&<Text accessibilityLabel={`${stars} ดาว`} style={{fontFamily:font.heading,fontSize:compact?13:15,color:paper.red}}>{'★'.repeat(stars)}</Text>}
 </View>{card.type==='equipment'&&<View testID="equipment-type-badge" style={{flexDirection:'row',alignItems:'center',gap:3,borderBottomWidth:2,borderColor:hudPictogramColors.equipment,paddingVertical:2}}><InkIcon name="blessing" size={compact?12:16} color={hudPictogramColors.equipment}/><Text style={{color:hudPictogramColors.equipment,fontFamily:font.heading,fontSize:compact?10:12}}>อุปกรณ์</Text></View>}</View>;
}
