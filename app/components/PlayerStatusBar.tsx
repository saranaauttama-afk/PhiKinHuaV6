import {pulpColors} from '../theme';
import React from 'react';
import {Pressable,Text,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {GameState} from '../../src/core/types';
import Paper,{paper} from './Paper';
import HealthBar from './HealthBar';
import InkIcon,{InkSymbol} from './InkIcon';
import {font,layer} from '../theme';
export const STATUS_BAR_SPACE=155;
export default function PlayerStatusBar({state,onOpenDeck,onOpenBlessings}:{state:GameState;onOpenDeck?:()=>void;onOpenBlessings?:()=>void}){
 const p=state.player;const pad=useSafeAreaInsets();
 const stats: {icon:InkSymbol;label:string;value:string;onPress?:()=>void}[]=[{icon:'energy',label:'พลัง',value:`${p.energy}/${p.maxEnergy}`},{icon:'gold',label:'ทอง',value:`${p.gold??0}`},{icon:'deck',label:'สำรับ',value:`${state.masterDeck?.length??0}`,onPress:onOpenDeck},{icon:'blessing',label:'พร',value:`${state.blessings?.length??0}`,onPress:onOpenBlessings}];
 return <Paper style={{position:'absolute',bottom:pad.bottom+8,left:12,right:12,padding:12,zIndex:layer.statusBar,gap:8}}><HealthBar hp={p.hp} maxHp={p.maxHp}/><View style={{flexDirection:'row',gap:6}}>{stats.map(s=><Pressable key={s.label} accessibilityRole={s.onPress?'button':undefined} accessibilityLabel={`${s.label} ${s.value}`} disabled={!s.onPress} onPress={s.onPress} style={({pressed})=>({flex:1,minHeight:44,alignItems:'center',justifyContent:'center',gap:3,backgroundColor:s.onPress?(pressed?pulpColors.pressedPaper:paper.light):'transparent',borderBottomWidth:s.onPress?2:0,borderColor:paper.line})}><View style={{flexDirection:'row',gap:4,alignItems:'center'}}><InkIcon name={s.icon} size={20}/><Text style={{color:paper.ink,fontFamily:font.heading,fontSize:14}}>{s.value}</Text></View><Text style={{color:paper.muted,fontFamily:font.ui,fontSize:10}}>{s.label}{s.onPress?' ›':''}</Text></Pressable>)}</View><View style={{flexDirection:'row',alignItems:'center',gap:8}}><Text style={{fontFamily:font.ui,color:paper.muted,fontSize:10}}>เลเวล {p.level} · EXP {p.exp}/{p.expToNext}</Text><View style={{flex:1,height:4,backgroundColor:pulpColors.expTrack}}><View style={{width:`${Math.min(1,p.exp/Math.max(1,p.expToNext))*100}%`,height:4,backgroundColor:pulpColors.expFill}}/></View></View></Paper>;
}
