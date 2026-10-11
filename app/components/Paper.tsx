import {pulpColors} from '../theme';
import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import {paper,paperPalette,paperSurface} from '../theme';
export {paper,paperPalette,paperSurface};
export function PaperTexture() {
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}><Svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none">
    <Path d="M0 3 L31 1 69 4 112 2 151 5 199 1 249 4 301 2 351 5 400 1 M1 0 L4 38 1 82 4 131 2 190 4 245 1 300 M0 297 L53 299 104 296 167 298 225 295 283 299 346 296 400 299 M398 0 L396 62 399 122 396 185 399 246 397 300" fill="none" stroke={pulpColors.paperEdge} strokeWidth="3" opacity=".48" />
    {Array.from({length:45},(_,i)=><Circle key={i} cx={(i*73+11)%400} cy={(i*47+7)%300} r={i%4===0?1.6:.6} fill={pulpColors.paperSpeck} opacity=".12"/>)}
    <Path d="M6 19 Q40 6 67 13 M340 283 Q369 296 395 275 M13 270 L24 279 M373 17 L389 22" stroke={pulpColors.paperWear} strokeWidth="8" opacity=".1" fill="none" />
  </Svg></View>;
}
export default function Paper({children,style}: {children?:React.ReactNode;style?:StyleProp<ViewStyle>}) {
  return <View style={[{backgroundColor:paper.bg,padding:16,borderRadius:2,shadowColor:pulpColors.black,shadowOpacity:.3,shadowRadius:5,shadowOffset:{width:0,height:3},elevation:3},style]}><PaperTexture/>{children}</View>;
}

