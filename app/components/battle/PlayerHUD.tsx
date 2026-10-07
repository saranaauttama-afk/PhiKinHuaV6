import React from 'react';
import {View,Text,Pressable,Image} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import RitualSurface,{chalk} from '../RitualSurface';
import HealthBar from '../HealthBar';
import Art from '../Art';
import SealPotButton from './SealPotButton';
import {font} from '../../theme';
const portraits:Record<string,any>={warrior:require('../../../assets/ui/battle-portraits/warrior.png'),shaman:require('../../../assets/ui/battle-portraits/shaman.png'),nun:require('../../../assets/ui/battle-portraits/nun.png'),medium:require('../../../assets/ui/battle-portraits/medium.png')};
type Props={helpers?:React.ReactNode;statuses?:React.ReactNode;hp:number;maxHp:number;energy:number;maxEnergy:number;block:number;maxHandSize:number;drawCount:number;discardCount?:number;classId?:string;onEndTurn:()=>void;onOpenPiles?:()=>void;isEnemyTurn?:boolean;hudFlashKey?:number};
export default function PlayerHUD(p:Props){const pad=useSafeAreaInsets();return <>
 <View style={{position:'absolute',bottom:pad.bottom+220,left:12,right:12}}>
 {p.helpers}
 <RitualSurface kind="slate" style={{padding:12,flexDirection:'row',gap:8}}>
  <Image source={portraits[p.classId??'warrior']} resizeMode="contain" style={{width:48,height:64}}/>
  <View style={{flex:1,gap:6}}><HealthBar hp={p.hp} maxHp={p.maxHp} dark/><Text style={{fontFamily:font.heading,fontSize:13,color:chalk}}>พลัง {p.energy}/{p.maxEnergy}     เกราะ {p.block}</Text></View>
 </RitualSurface>
 {p.statuses&&<RitualSurface kind="slate" style={{paddingHorizontal:12,paddingVertical:6}}>{p.statuses}</RitualSurface>}
 </View>
 <View style={{position:'absolute',bottom:pad.bottom+4,left:14,right:8,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
  <Pressable accessibilityRole="button" accessibilityLabel="ดูกองการ์ด" onPress={p.onOpenPiles} style={{minHeight:44,justifyContent:'center'}}><Text style={{color:chalk,fontFamily:font.heading,fontSize:12}}>กองจั่ว {p.drawCount} · ทิ้ง {p.discardCount??0} ›</Text></Pressable>
  <SealPotButton disabled={p.isEnemyTurn} onPress={p.onEndTurn}/>
 </View>
 </>;}
