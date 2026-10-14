import React from 'react';
import {Pressable} from 'react-native';
import Svg,{Path,G} from 'react-native-svg';
import {paper} from '../theme';
/** A worn paper tab with a brush-printed cross, shared by page and battle chrome. */
export default function CloseSeal({onPress,label='ปิด',testID='close-seal'}:{onPress:()=>void;label?:string;testID?:string}) {
 return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({pressed})=>({width:44,height:44,alignItems:'center',justifyContent:'center',opacity:pressed?.8:1,transform:[{scale:pressed?.94:1}]})}>
  <Svg accessible={false} width={30} height={30} viewBox="0 0 40 40">
   <Path d="M8 4L18 2L29 4L35 10L38 21L34 31L26 37L14 38L6 33L2 23L3 12Z" fill={paper.ink} opacity=".6" transform="translate(1 1)"/>
   <Path d="M8 4L17 1L27 3L34 8L36 17L38 20L35 29L29 34L20 37L11 35L5 30L2 21L4 11Z" fill={paper.light} stroke={paper.ink} strokeWidth="1.8" strokeLinejoin="round"/>
   <Path d="M7 12L10 7L16 5 M26 6L31 10L33 16 M32 26L28 31L21 33 M13 32L8 28L6 21" fill="none" stroke="#ad8960" strokeWidth="1" strokeLinecap="round"/>
   <G transform="rotate(-7 20 20)">
    <Path d="M10 10L15 9L20 15L25 9L30 12L24 20L31 27L27 31L20 24L12 30L9 26L16 19Z" fill={paper.red}/>
    <Path d="M12 12L14 13 M26 12L24 15 M12 26L14 24 M26 27L25 25" stroke={paper.light} strokeWidth=".8" strokeLinecap="round"/>
   </G>
   <Path d="M29 4L33 8L29 9Z" fill="#cdb58b" stroke="#ad8960" strokeWidth=".6"/>
  </Svg>
 </Pressable>;
}
