import React from 'react';
import {Pressable} from 'react-native';
import Svg,{Path,Circle} from 'react-native-svg';
import {palette} from '../theme';
export default function CloseSeal({onPress,label='ปิด'}:{onPress:()=>void;label?:string}) {
 return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({pressed})=>({width:44,height:44,alignItems:'center',justifyContent:'center',opacity:pressed?.7:1})}>
  <Svg accessible={false} width={40} height={40} viewBox="0 0 40 40"><Circle cx="20" cy="20" r="18" fill={palette.inkSoft} stroke={palette.moonDim} strokeWidth="1.5"/><Path d="M12 9L30 27L26 30L9 13Z M27 9L30 12L13 30L9 26Z" fill={palette.text}/></Svg>
 </Pressable>;
}
