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
import {useAudioSettings} from '../../src/audio/audio';
type Settings={reducedMotion:boolean;setReducedMotion:(v:boolean)=>void;hydrate:()=>Promise<void>};
export const useGameSettings=create<Settings>((set)=>({reducedMotion:false,setReducedMotion:(v)=>{set({reducedMotion:v});void AsyncStorage.setItem('phi-ui-settings',JSON.stringify({reducedMotion:v})).catch(()=>{});},hydrate:async()=>{try{const raw=await AsyncStorage.getItem('phi-ui-settings');if(raw){const s=JSON.parse(raw);set({reducedMotion:s.reducedMotion===true});}}catch{}}}));
function Toggle({title,hint,value,onChange}:{title:string;hint:string;value:boolean;onChange:(v:boolean)=>void}){return <View style={{flexDirection:'row',alignItems:'center',gap:12}}><View style={{flex:1}}><Text style={{fontFamily:font.heading,color:paper.ink,fontSize:15}}>{title}</Text><Text style={{fontFamily:font.ui,color:paper.muted,fontSize:12,marginTop:4}}>{hint}</Text></View><Switch accessibilityLabel={title} value={value} onValueChange={onChange} trackColor={{false:pulpColors.switchOff,true:pulpColors.switchOn}}/></View>;}
export default function Settings({onClose}:{onClose:()=>void}){const s=useGameSettings();const a=useAudioSettings();return <View style={{position:'absolute',inset:0,backgroundColor:pulpColors.settingsShade,zIndex:layer.settings,padding:24,justifyContent:'center'}}><RitualSurface kind="occupationPage" style={{gap:22,padding:26}}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><InkIcon name="settings"/><Text style={{fontFamily:font.heading,fontSize:22,color:paper.ink}}>ตั้งค่า</Text></View><View style={{flexDirection:'row',alignItems:'center',gap:12}}><View style={{flex:1}}><Text style={{fontFamily:font.heading,color:paper.ink,fontSize:15}}>ลดการเคลื่อนไหวของฉาก</Text><Text style={{fontFamily:font.ui,color:paper.muted,fontSize:12,marginTop:4}}>แสดงฉากและตัวเลือกทันที</Text></View><Switch accessibilityLabel="ลดการเคลื่อนไหวของฉาก" value={s.reducedMotion} onValueChange={s.setReducedMotion} trackColor={{false:pulpColors.switchOff,true:pulpColors.switchOn}}/></View><Toggle title="เพลงและเสียงบรรยากาศ" hint="ดนตรีและเสียงกลางคืนที่เล่นวนอยู่เบื้องหลัง" value={a.musicOn} onChange={a.setMusicOn}/><Toggle title="เสียงเอฟเฟกต์" hint="เสียงจั่วการ์ด ผีโจมตี และเสียงเปิดตัวบอส" value={a.sfxOn} onChange={a.setSfxOn}/><QuietButton label="กลับ" onPress={onClose}/></RitualSurface></View>;}
