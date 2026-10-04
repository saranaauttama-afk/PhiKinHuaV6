import {ritualColors} from '../../theme';
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font } from '../../theme';
import {paper} from '../Paper';
import RitualSurface,{chalk} from '../RitualSurface';
import SealPotButton from './SealPotButton';
import InkIcon from '../InkIcon';
import HealthBar from '../HealthBar';
import {GameButton} from '../Panel';
type Props = {hp:number;maxHp:number;energy:number;maxEnergy:number;block:number;maxHandSize:number;drawCount:number;onEndTurn:()=>void;onOpenPiles?:()=>void;isEnemyTurn?:boolean;hudFlashKey?:number};
export default function PlayerHUD(p:Props){const pad=useSafeAreaInsets();return <RitualSurface kind="slate" style={{position:'absolute',bottom:pad.bottom+8,left:12,right:12,paddingHorizontal:22,paddingTop:22,paddingBottom:15,gap:6}}><HealthBar hp={p.hp} maxHp={p.maxHp} dark/><View style={{flexDirection:'row',alignItems:'center',gap:12}}><View style={{flex:1,gap:7}}><View style={{flexDirection:'row',gap:12}}><View style={{flexDirection:'row',alignItems:'center',gap:3}}><InkIcon name="energy" size={20} color={chalk}/><Text style={{fontFamily:font.heading,color:chalk,fontSize:13}}>{p.energy}/{p.maxEnergy}</Text></View><View style={{flexDirection:'row',alignItems:'center',gap:3}}><InkIcon name="block" size={20} color={chalk}/><Text style={{fontFamily:font.heading,color:chalk,fontSize:13}}>{p.block}</Text></View></View><Pressable accessibilityRole="button" accessibilityLabel="ดูกองการ์ด" onPress={p.onOpenPiles} style={{minHeight:32,flexDirection:'row',alignItems:'center',gap:5,backgroundColor:ritualColors.chalkWash,paddingHorizontal:6}}><InkIcon name="deck" size={18} color={chalk}/><Text style={{fontFamily:font.ui,color:chalk,fontSize:10}}>กองจั่ว {p.drawCount} · จั่ว {p.maxHandSize} ›</Text></Pressable></View><SealPotButton disabled={p.isEnemyTurn} onPress={p.onEndTurn}/></View></RitualSurface>;}
