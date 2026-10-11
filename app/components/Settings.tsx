import {pulpColors} from '../theme';
import React from 'react';
import {View,Text,Switch} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from 'zustand';
import {paper} from './Paper';
import RitualSurface from './RitualSurface';
import {QuietButton} from './QuietChrome';
import InkIcon from './InkIcon';
import {font,layer} from '../theme';
import {readDioramaSettings} from '../../src/visual/dioramaSettings';
type Settings={reducedMotion:boolean;dioramaAnimation:boolean;hydrated:boolean;setReducedMotion:(v:boolean)=>void;setDioramaAnimation:(v:boolean)=>void;hydrate:()=>Promise<void>};
let extras:Record<string,unknown>={},writes=Promise.resolve();
export const useGameSettings=create<Settings>((set,get)=>{
 const persist=()=>{const s=get(),raw=JSON.stringify({...extras,reducedMotion:s.reducedMotion,dioramaAnimation:s.dioramaAnimation});writes=writes.catch(()=>{}).then(()=>AsyncStorage.setItem('phi-ui-settings',raw));void writes.catch(()=>{});};
 return {reducedMotion:false,dioramaAnimation:true,hydrated:false,
 setReducedMotion:v=>{set({reducedMotion:v});persist();},setDioramaAnimation:v=>{set({dioramaAnimation:v});persist();},
 hydrate:async()=>{try{const raw=await AsyncStorage.getItem('phi-ui-settings');const value=raw?JSON.parse(raw):{};extras=value&&typeof value==='object'&&!Array.isArray(value)?value:{};set(readDioramaSettings(extras));}catch{}finally{set({hydrated:true});}}};
});
export default function Settings({onClose}:{onClose:()=>void}){const s=useGameSettings();return <View style={{position:'absolute',inset:0,backgroundColor:pulpColors.settingsShade,zIndex:layer.settings,padding:24,justifyContent:'center'}}><RitualSurface kind="occupationPage" style={{gap:22,padding:26}}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><InkIcon name="settings"/><Text style={{fontFamily:font.heading,fontSize:22,color:paper.ink}}>ตั้งค่า</Text></View><View style={{flexDirection:'row',alignItems:'center',gap:12}}><View style={{flex:1}}><Text style={{fontFamily:font.heading,color:paper.ink,fontSize:15}}>ลดการเคลื่อนไหวของฉาก</Text><Text style={{fontFamily:font.ui,color:paper.muted,fontSize:12,marginTop:4}}>แสดงฉากและตัวเลือกทันที</Text></View><Switch accessibilityLabel="ลดการเคลื่อนไหวของฉาก" value={s.reducedMotion} onValueChange={s.setReducedMotion} trackColor={{false:pulpColors.switchOff,true:pulpColors.switchOn}}/></View><View style={{flexDirection:"row",alignItems:"center",gap:12}}><View style={{flex:1}}><Text style={{fontFamily:font.heading,color:paper.ink,fontSize:15}}>แอนิเมชันฉากกระดาษ</Text><Text style={{fontFamily:font.ui,color:paper.muted,fontSize:12,marginTop:4}}>เปิด: ประกอบฉากทีละชั้น · ปิด: แสดงฉากทันที</Text></View><Switch accessibilityLabel="แอนิเมชันฉากกระดาษ" value={s.dioramaAnimation} onValueChange={s.setDioramaAnimation} trackColor={{false:pulpColors.switchOff,true:pulpColors.switchOn}}/></View><QuietButton label="กลับ" onPress={onClose}/></RitualSurface></View>;}
