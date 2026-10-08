import React from 'react';
import {Image,Text,View,useWindowDimensions} from 'react-native';
import PostBattleSurface from './PostBattleSurface';
import RitualSurface from '../RitualSurface';
import {GameButton} from '../Panel';
import {artSource} from '../Art';
import InkIcon from '../InkIcon';
import {useGame} from '../../../src/store/gameStore';
import {font,paper} from '../../theme';
type Props={enemyName:string;expGained:number;goldGained:number;playerLevel:number;playerExp:number;playerExpToNext:number;onContinue:()=>void};
export default function VictoryOverlay(p:Props){
 const classId=useGame(s=>s.state.classId??'shaman');const {height}=useWindowDimensions();
 return <PostBattleSurface>
  <RitualSurface kind="occupationPage" style={{paddingHorizontal:24,paddingVertical:24,gap:12}}>
   <Text accessibilityRole="header" style={{fontFamily:font.display,fontSize:36,color:paper.red,textAlign:'center'}}>ชนะศึก</Text>
   <View style={{height:Math.min(220,height*.26),alignItems:'center'}}><Image source={artSource(`class/${classId}`)} resizeMode="contain" style={{width:'100%',height:'100%'}}/></View>
   <Text style={{fontFamily:font.ui,color:paper.ink,fontSize:13,textAlign:'center'}}>{p.enemyName} ถูกปราบแล้ว</Text>
   <View style={{flexDirection:'row',justifyContent:'space-around',paddingVertical:10,borderTopWidth:1,borderColor:paper.line}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:6}}><InkIcon name="gold" size={26}/><Text style={{fontFamily:font.heading,color:paper.ink,fontSize:16}}>เบี้ย +{p.goldGained}</Text></View>
    <Text style={{fontFamily:font.heading,color:paper.ink,fontSize:14}}>EXP +{p.expGained}</Text>
   </View>
   <View style={{height:9,backgroundColor:paper.line}}><View style={{height:'100%',width:`${Math.min(1,p.playerExp/Math.max(1,p.playerExpToNext))*100}%`,backgroundColor:paper.red}}/></View>
   <Text style={{fontFamily:font.ui,color:paper.ink,fontSize:11,textAlign:'right'}}>เลเวล {p.playerLevel} · {p.playerExp}/{p.playerExpToNext}</Text>
  </RitualSurface>
  <GameButton label="รับรางวัล" onPress={p.onContinue} style={{marginTop:16,alignSelf:'center',minWidth:180}}/>
 </PostBattleSurface>;
}
