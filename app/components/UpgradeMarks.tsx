import React from 'react';
import {View} from 'react-native';
import Svg,{Path} from 'react-native-svg';
import {paper} from '../theme';
/** The base card is unmarked; each upgrade adds one brush stroke. */
export default function UpgradeMarks({level,ink=paper.red,compact=false}:{level:number;ink?:string;compact?:boolean}) {
 const count=Math.max(0,level-1);if(!count)return null;
 return <View testID="card-upgrade-marks" accessible accessibilityLabel={`ระดับ ${level} · ปลุกเสก ${count} ครั้ง`} style={{flexDirection:'row',gap:3}}>
  {Array.from({length:count},(_,i)=><Svg key={i} width={compact?7:8} height={compact?17:20} viewBox="0 0 7 18"><Path d="M4.8 1L6 3.5L4.4 14.6L2 17L1.1 14L2.7 4L2.3 2.8Z" fill={ink}/><Path d="M4.6 5L3.6 10 M3.1 12.8L2.7 14.1" stroke={paper.light} strokeWidth=".45" opacity=".7"/></Svg>)}
 </View>;
}
