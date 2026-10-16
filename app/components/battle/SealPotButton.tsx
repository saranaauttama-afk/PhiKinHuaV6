import React from 'react';
import {Pressable,Text,View} from 'react-native';
import {badgeColors,font,palette} from '../../theme';
import RitualSurface from '../RitualSurface';
import StatIcon from '../StatIcon';
/** Ring the bell to finish a turn. Always reads จบเทิร์น; greyed and disabled on the ghost's turn. */
export default function SealPotButton({disabled,onPress,compact=false}:{disabled?:boolean;onPress:()=>void;compact?:boolean}) {
 return <Pressable accessibilityRole="button" accessibilityLabel="จบเทิร์น" accessibilityState={{disabled:!!disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>({width:compact?56:72,minHeight:compact?44:50,flexShrink:0,opacity:disabled?.45:pressed?.75:1,transform:[{translateY:pressed?2:0}]})}>
  <RitualSurface kind="wood" style={{minHeight:compact?44:50,padding:compact?2:4,alignItems:'center',justifyContent:'center',gap:2}}>
   <StatIcon name="bell" size={compact?20:22}/><Text style={{fontFamily:font.heading,fontSize:compact?9:10,lineHeight:compact?13:15,color:palette.text,textAlign:'center'}}>จบเทิร์น</Text>
  </RitualSurface>
  {/* Ghost's turn: greyed out, no "whose turn" text (owner 16 Oct 2026). */}
  {disabled&&<View pointerEvents="none" style={{position:'absolute',top:0,left:0,right:0,bottom:0,borderRadius:6,backgroundColor:badgeColors.disabledInk,opacity:.6}}/>}
 </Pressable>;
}
