import React from 'react';
import {View} from 'react-native';
import Svg,{Path} from 'react-native-svg';
import {paper} from '../theme';
/** The base card is unmarked; each upgrade adds one brush stroke. */
export default function UpgradeMarks({level,ink=paper.red,compact=false}:{level:number;ink?:string;compact?:boolean}) {
 const count=Math.max(0,level-1);if(!count)return null;
 return <View accessible accessibilityLabel={`ระดับ ${level} · ปลุกเสก ${count} ครั้ง`} style={{flexDirection:'row',gap:2}}>
  {Array.from({length:count},(_,i)=><Svg key={i} width={compact?5:7} height={compact?14:18} viewBox="0 0 7 18"><Path d="M5 1L6 4L4 15L2 17L1 14L3 3Z" fill={ink}/></Svg>)}
 </View>;
}
