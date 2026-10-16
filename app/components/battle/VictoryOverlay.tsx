import React from 'react';
import Animated,{cancelAnimation,Easing,useAnimatedStyle,useSharedValue,withDelay,withRepeat,withSequence,withTiming} from 'react-native-reanimated';
import {useGameSettings} from '../Settings';
import AshPuff from './AshPuff';
import {FxSprite} from './fxArt';
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
 const reduced=useGameSettings(s=>s.reducedMotion);
 const [skipped,setSkipped]=React.useState(false);
 const still=reduced||skipped;
 const entrance=useSharedValue(still?1:0),stamp=useSharedValue(0),rays=useSharedValue(0);
 const fraction=Math.min(1,p.playerExp/Math.max(1,p.playerExpToNext));
 // When EXP wrapped through a level, begin at zero: never run backwards.
 const exp=useSharedValue(Math.max(0,p.playerExp-p.expGained)/Math.max(1,p.playerExpToNext));
 const gold=useRewardCount(p.goldGained,still);
 React.useEffect(()=>{
  entrance.value=still?1:withTiming(1,{duration:420,easing:Easing.out(Easing.back(1.6))});
  stamp.value=still?0:withDelay(420,withSequence(withTiming(-3,{duration:40}),withTiming(2,{duration:45}),withTiming(0,{duration:65})));
  exp.value=still?fraction:withTiming(fraction,{duration:700});
  rays.value=still?0:withRepeat(withTiming(360,{duration:120000,easing:Easing.linear}),-1,false);
  return ()=>{[entrance,stamp,exp,rays].forEach(cancelAnimation);};
 },[still,fraction]);
 const entranceStyle=useAnimatedStyle(()=>({opacity:.6+.4*entrance.value,transform:[{translateY:still?0:-90*(1-entrance.value)}]}));
 const stampStyle=useAnimatedStyle(()=>({transform:[{rotate:`${stamp.value}deg`}]}));
 const rayStyle=useAnimatedStyle(()=>({transform:[{rotate:`${rays.value}deg`}],opacity:.22}));
 const expStyle=useAnimatedStyle(()=>({width:`${exp.value*100}%` as `${number}%`}));
 const classId=useGame(s=>s.state.classId??'shaman');const {height}=useWindowDimensions();
 return <PostBattleSurface>
  <Animated.View style={entranceStyle}><RitualSurface kind="occupationPage" style={{paddingHorizontal:24,paddingVertical:24,gap:12}}>
   <Animated.Text accessibilityRole="header" style={[{fontFamily:font.display,fontSize:36,color:paper.red,textAlign:'center'},stampStyle]}>ชนะศึก</Animated.Text>
   <View style={{height:Math.min(220,height*.26),alignItems:'center'}}><Animated.View pointerEvents="none" style={[{position:'absolute',height:'100%',aspectRatio:1},rayStyle]}><FxSprite id="victory_rays" style={{width:'100%',height:'100%'}}/></Animated.View>{!still&&<AshPuff size={Math.min(220,height*.26)} duration={1000} smoke={2} ash={0}/>}<Image source={artSource(`class/${classId}`)} resizeMode="contain" style={{width:'100%',height:'100%'}}/></View>
   <Text style={{fontFamily:font.ui,color:paper.ink,fontSize:13,textAlign:'center'}}>{p.enemyName} ถูกปราบแล้ว</Text>
   <View style={{flexDirection:'row',justifyContent:'space-around',paddingVertical:10,borderTopWidth:1,borderColor:paper.line}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:6}}><InkIcon name="gold" size={26}/><Text style={{fontFamily:font.heading,color:paper.ink,fontSize:16}}>เบี้ย +{gold}</Text></View>
    <Text style={{fontFamily:font.heading,color:paper.ink,fontSize:14}}>EXP +{p.expGained}</Text>
   </View>
   <View style={{height:9,backgroundColor:paper.line}}><Animated.View style={[{height:'100%',backgroundColor:paper.red},expStyle]}/></View>
   <Text style={{fontFamily:font.ui,color:paper.ink,fontSize:11,textAlign:'right'}}>เลเวล {p.playerLevel} · {p.playerExp}/{p.playerExpToNext}</Text>
  </RitualSurface></Animated.View>
  <GameButton label="รับรางวัล" onPress={()=>{setSkipped(true);p.onContinue();}} style={{marginTop:16,alignSelf:'center',minWidth:180}}/>
 </PostBattleSurface>;
}

function useRewardCount(total:number,still:boolean){
 const [count,setCount]=React.useState(still?total:0);
 React.useEffect(()=>{
  if(still){setCount(total);return;}
  const start=Date.now();setCount(0);
  const timer=setInterval(()=>{const f=Math.min(1,(Date.now()-start)/600);setCount(Math.round(total*f));if(f===1)clearInterval(timer);},32);
  return ()=>clearInterval(timer);
 },[total,still]);
 return still?total:count;
}
