import {pulpColors} from '../theme';
import React from 'react';
import {View,Text,ImageBackground,Animated} from 'react-native';
import {loadAutoSaveSummary} from '../../src/core/storage';
import type {SaveSummary} from '../../src/core/save';
import {GameButton} from './Panel';
import Settings,{useGameSettings} from './Settings';
import {font,palette} from '../theme';
import {useScreenPadding} from '../useScreenPadding';
type Props={onStartGame:()=>void;onContinue?:()=>void};
export default function StartPage({onStartGame,onContinue}:Props){
 const pad=useScreenPadding();const [saved,setSaved]=React.useState<SaveSummary|null>(null);const [settings,setSettings]=React.useState(false);const glow=React.useRef(new Animated.Value(.1)).current;const reduced=useGameSettings(s=>s.reducedMotion);
 React.useEffect(()=>{let alive=true;loadAutoSaveSummary().then(s=>{if(alive)setSaved(s)}).catch(()=>{});return()=>{alive=false}},[]);
 React.useEffect(()=>{if(reduced)return;const a=Animated.loop(Animated.sequence([Animated.timing(glow,{toValue:.25,duration:1700,useNativeDriver:true}),Animated.timing(glow,{toValue:.08,duration:2100,useNativeDriver:true})]));a.start();return()=>a.stop()},[reduced]);
 return <ImageBackground source={require('../../assets/scence/menu-haunted.jpg')} style={{flex:1}}><View style={{flex:1,paddingTop:pad.top+20,paddingBottom:pad.bottom+20,paddingHorizontal:28,justifyContent:'space-between',backgroundColor:pulpColors.menuShade}}><View><Text style={{fontFamily:font.ui,color:palette.moonDim,fontSize:12,letterSpacing:3}}>การ์ตูนผี • ตอนที่ ๑</Text><Text style={{fontFamily:font.display,color:palette.moon,fontSize:48,lineHeight:72,textShadowColor:pulpColors.black,textShadowRadius:6,textShadowOffset:{width:0,height:2}}}>ผีกินหัว</Text><Text style={{fontFamily:font.heading,color:palette.text,fontSize:19}}>คืนแรกที่บ้านร้าง</Text></View><Animated.View pointerEvents="none" style={{position:'absolute',top:'38%',left:'20%',width:120,height:140,backgroundColor:pulpColors.lanternGlow,borderRadius:100,opacity:glow}}/><View style={{gap:12}}><Text style={{fontFamily:font.body,color:palette.text,fontSize:25,lineHeight:29,marginBottom:10,textShadowColor:pulpColors.black,textShadowRadius:5,textShadowOffset:{width:0,height:1}}}>เสียงหัวเราะดังจากบ้านร้าง…{ '\n' }คืนนี้ คุณจะพาเด็กที่หายไปกลับมาได้ไหม?</Text><GameButton label="เริ่มเกม" tone="primary" onPress={onStartGame}/>{saved&&onContinue&&<GameButton label={`เล่นต่อ • ศึก ${saved.fight}/${saved.totalFights}`} onPress={onContinue}/>}<GameButton label="ตั้งค่า" onPress={()=>setSettings(true)}/>{saved&&<Text style={{fontFamily:font.ui,color:palette.textDim,fontSize:10,textAlign:'center'}}>เริ่มเกมใหม่จะแทนการเดินทางที่ค้างไว้</Text>}</View></View>{settings&&<Settings onClose={()=>setSettings(false)}/>}</ImageBackground>;
}
