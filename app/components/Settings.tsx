import {pulpColors} from '../theme';
import React from 'react';
import {View,Text,Switch} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from 'zustand';
import Paper,{paper} from './Paper';
import {GameButton} from './Panel';
import InkIcon from './InkIcon';
import {font,layer} from '../theme';
type Settings={reducedMotion:boolean;setReducedMotion:(v:boolean)=>void;hydrate:()=>Promise<void>};
export const useGameSettings=create<Settings>((set)=>({reducedMotion:false,setReducedMotion:(v)=>{set({reducedMotion:v});void AsyncStorage.setItem('phi-ui-settings',JSON.stringify({reducedMotion:v})).catch(()=>{});},hydrate:async()=>{try{const raw=await AsyncStorage.getItem('phi-ui-settings');if(raw){const s=JSON.parse(raw);set({reducedMotion:s.reducedMotion===true});}}catch{}}}));
export default function Settings({onClose}:{onClose:()=>void}){const s=useGameSettings();return <View style={{position:'absolute',inset:0,backgroundColor:pulpColors.settingsShade,zIndex:layer.settings,padding:24,justifyContent:'center'}}><Paper style={{gap:22}}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><InkIcon name="settings"/><Text style={{fontFamily:font.heading,fontSize:22,color:paper.ink}}>ตั้งค่า</Text></View><View style={{flexDirection:'row',alignItems:'center',gap:12}}><View style={{flex:1}}><Text style={{fontFamily:font.heading,color:paper.ink,fontSize:15}}>ลดการเคลื่อนไหวของฉาก</Text><Text style={{fontFamily:font.ui,color:paper.muted,fontSize:12,marginTop:4}}>แสดงฉากและตัวเลือกทันที</Text></View><Switch accessibilityLabel="ลดการเคลื่อนไหวของฉาก" value={s.reducedMotion} onValueChange={s.setReducedMotion} trackColor={{false:pulpColors.switchOff,true:pulpColors.switchOn}}/></View><GameButton label="กลับ" onPress={onClose}/></Paper></View>;}
