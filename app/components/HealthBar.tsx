import {ritualColors} from '../theme';
import {pulpColors} from '../theme';
import React from 'react';
import {View,Text} from 'react-native';
import InkIcon from './InkIcon';
import {paper} from './Paper';
import {font} from '../theme';
export default function HealthBar({hp,maxHp,label,dark,compact=false}:{hp:number;maxHp:number;label?:string;dark?:boolean;compact?:boolean}){
 const fraction=Math.max(0,Math.min(1,hp/Math.max(1,maxHp)));
 if(compact)return <View accessible accessibilityRole="progressbar" accessibilityLabel={label??'พลังชีวิต'} accessibilityValue={{min:0,max:maxHp,now:hp}} style={{height:18,backgroundColor:pulpColors.healthTrack,overflow:'hidden',borderWidth:1,borderColor:paper.ink}}>
  <View style={{position:'absolute',top:0,bottom:0,left:0,width:`${fraction*100}%`,backgroundColor:paper.red}}/>
  <Text style={{fontFamily:font.heading,color:ritualColors.chalk,fontSize:12,textAlign:'center',lineHeight:17}}>{hp}/{maxHp}</Text>
 </View>;
 return <View style={{gap:5}}><View style={{flexDirection:'row',alignItems:'center',gap:7}}><InkIcon name="hp" color={paper.red} size={18}/><Text numberOfLines={1} style={{fontFamily:font.heading,color:dark?ritualColors.chalk:paper.ink,fontSize:13,flex:1}}>{label??'พลังชีวิต'}</Text><Text style={{fontFamily:font.heading,color:dark?ritualColors.chalk:paper.red,fontSize:14}}>{hp}/{maxHp}</Text></View><View style={{height:8,backgroundColor:pulpColors.healthTrack,borderRadius:2,overflow:'hidden'}}><View style={{height:'100%',width:`${fraction*100}%`,backgroundColor:paper.red}}/></View></View>;
}
