import React from 'react';
import {Text,View} from 'react-native';
import type {CardData} from '../../src/core/types';
import {upgradeLevelOf} from '../../src/core/engine/shared';
import InkIcon from './InkIcon';
import {font,paper} from '../theme';
export default function CardBadges({card,cost,compact=false,ink=paper.ink}:{card:CardData;cost?:number;compact?:boolean;ink?:string}){
 const level=upgradeLevelOf(card);
 return <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
  <View accessibilityLabel={`พลังงาน ${cost??card.cost??0}`} style={{flexDirection:'row',alignItems:'center',gap:2}}><InkIcon name="energy" size={compact?19:22} color={ink}/><Text style={{fontFamily:font.heading,fontSize:compact?15:17,color:ink}}>{cost??card.cost??0}</Text></View>
  {level>0&&<Text accessibilityLabel={`ปลุกเสกขั้น ${level}`} style={{fontFamily:font.heading,fontSize:compact?17:19,color:paper.red,transform:[{rotate:'-7deg'}]}}>+{level}</Text>}
 </View>;
}
