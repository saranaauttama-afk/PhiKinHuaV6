import React from 'react';
import {View,Text,Image,ImageBackground,ScrollView} from 'react-native';
import {loadAutoSaveSummary} from '../../src/core/storage';
import type {SaveSummary} from '../../src/core/save';
import {QuietButton} from './QuietChrome';
import Settings from './Settings';
import {font,palette,pulpColors} from '../theme';
import {useScreenPadding} from '../useScreenPadding';
type Props={onStartGame:()=>void;onContinue?:()=>void;onJournal?:()=>void};
export default function StartPage({onStartGame,onContinue,onJournal}:Props){
 const pad=useScreenPadding();const [saved,setSaved]=React.useState<SaveSummary|null>(null),[settings,setSettings]=React.useState(false);
 React.useEffect(()=>{let alive=true;loadAutoSaveSummary().then(s=>{if(alive)setSaved(s)}).catch(()=>{});return()=>{alive=false}},[]);
 return <ImageBackground source={require('../../assets/scence/menu-haunted.jpg')} style={{flex:1}}>
  <ScrollView contentContainerStyle={{flexGrow:1,paddingTop:pad.top+24,paddingBottom:pad.bottom+24,paddingHorizontal:28,justifyContent:'space-between',backgroundColor:pulpColors.menuShade}}>
   <View style={{alignItems:'center'}}><Text style={{fontFamily:font.ui,color:palette.moonDim,fontSize:12,letterSpacing:3}}>การ์ตูนผี • ห้าคืนอาถรรพ์</Text><Image accessible accessibilityLabel="ผีกินหัว" source={require('../../assets/ui/title-pulp.png')} resizeMode="contain" style={{width:'100%',maxWidth:340,height:150,marginTop:14}}/></View>
   <View style={{gap:12,paddingTop:100,maxWidth:480,width:'100%',alignSelf:'center'}}>
    <Text style={{fontFamily:font.body,color:palette.text,fontSize:25,lineHeight:30,textAlign:'center',marginBottom:20}}>ชาวบ้านยังหลับ… แต่หัวหายไป{'\n'}ตามหัวกลับมา ก่อนฟ้าสาง</Text>
    {saved&&onContinue&&<QuietButton primary label={'เล่นต่อ • '+(saved.night?'คืน '+saved.night+' · ':'')+'ศึก '+saved.fight+'/'+saved.totalFights} onPress={onContinue}/>}
    <QuietButton primary={!saved} label="เริ่มเกม" onPress={onStartGame}/>
    <View style={{flexDirection:'row',gap:10}}>{onJournal&&<QuietButton label="สมุดผ่านคืน" onPress={onJournal} style={{flex:1}}/>}<QuietButton label="ตั้งค่า" onPress={()=>setSettings(true)} style={{flex:1}}/></View>
    {saved&&<Text style={{fontFamily:font.ui,color:palette.textDim,fontSize:10,textAlign:'center'}}>เริ่มเกมใหม่จะแทนการเดินทางที่ค้างไว้</Text>}
   </View>
  </ScrollView>
  {settings&&<Settings onClose={()=>setSettings(false)}/>}
 </ImageBackground>;
}
