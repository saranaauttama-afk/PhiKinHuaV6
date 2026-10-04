import {ritualColors} from '../theme';
import {pulpColors} from '../theme';
import React from 'react';
import {View,Text} from 'react-native';
import InkIcon from './InkIcon';
import {paper} from './Paper';
import {font} from '../theme';
export default function HealthBar({hp,maxHp,label,dark}:{hp:number;maxHp:number;label?:string;dark?:boolean}){return <View style={{gap:5}}><View style={{flexDirection:'row',alignItems:'center',gap:7}}><InkIcon name="hp" color={paper.red} size={18}/><Text style={{fontFamily:font.heading,color:dark?ritualColors.chalk:paper.ink,fontSize:13,flex:1}}>{label??'พลังชีวิต'}</Text><Text style={{fontFamily:font.heading,color:dark?ritualColors.chalk:paper.red,fontSize:14}}>{hp}/{maxHp}</Text></View><View style={{height:8,backgroundColor:pulpColors.healthTrack,borderRadius:2,overflow:'hidden'}}><View style={{height:'100%',width:`${Math.max(0,Math.min(1,hp/Math.max(1,maxHp)))*100}%`,backgroundColor:paper.red}}/></View></View>;}
