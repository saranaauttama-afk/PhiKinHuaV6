import React from 'react';
import {View,Text} from 'react-native';
import {font,palette,paper} from '../theme';
/** Same ink-framed blood strip on both sides; the empty part stays dark. */
export default function HealthBar({hp,maxHp,label,dark,compact=false}:{hp:number;maxHp:number;label?:string;dark?:boolean;compact?:boolean}) {
 const fraction=Math.max(0,Math.min(1,hp/Math.max(1,maxHp)));
 return <View style={{gap:4}}>
  {!compact&&<Text style={{fontFamily:font.ui,fontSize:12,color:dark?palette.text:paper.ink}}>{label??'พลังชีวิต'}</Text>}
  <View accessible accessibilityRole="progressbar" accessibilityLabel={label??'พลังชีวิต'} accessibilityValue={{min:0,max:maxHp,now:hp}} style={{height:compact?19:23,backgroundColor:'#282017',overflow:'hidden',borderWidth:1,borderColor:palette.moonDim,borderTopLeftRadius:3,borderBottomRightRadius:3}}>
   <View style={{position:'absolute',top:1,bottom:1,left:1,width:`${fraction*100}%`,backgroundColor:paper.red,borderTopWidth:1,borderTopColor:'#b35b46',borderBottomWidth:1,borderBottomColor:'#63251d'}}/>
   <Text style={{fontFamily:font.heading,color:palette.text,fontSize:compact?12:14,textAlign:'center',lineHeight:compact?17:21}}>{hp}/{maxHp}</Text>
  </View>
 </View>;
}
