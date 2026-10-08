import {nightFightTotal} from '../../src/core/campaign/bosses';
import React from 'react';
import {View,Text,Image} from 'react-native';
import type {GameState} from '../../src/core/types';
import {QuietButton,QuietPage} from './QuietChrome';
import RitualSurface from './RitualSurface';
import Art from './Art';
import {font,paper,palette} from '../theme';
export default function RunCompleteScreen({state,onNewRun,onJournal}:{state:GameState;onNewRun:()=>void;onJournal?:()=>void}){
 const s=state.runSummary;if(!s)return null;
 const headline=!s.won?'ไปไม่ถึงเช้า':state.campaign?'ผ่านคืนที่ '+state.campaign.night+'!':state.runMode==='episode'?'รอดคืนแรก!':s.beatSecretBoss?'ท้ามัจจุราชสำเร็จ':'จบการเดินทาง';
 return <QuietPage title="บันทึกเมื่อฟ้าสาง" subtitle={state.campaign?'ห้าคืนอาถรรพ์ · คืนที่ '+state.campaign.night:undefined} source={require('../../assets/scence/quiet-village.png')} footer={<QuietButton primary label="ออกเดินทางอีกครั้ง" onPress={onNewRun}/>}>
  <RitualSurface kind="occupationPage" style={{paddingHorizontal:26,paddingVertical:28,gap:12}}>
   <Text accessibilityRole="header" style={{fontFamily:font.display,fontSize:32,color:paper.red,textAlign:'center'}}>{headline}</Text>
   <View style={{height:180,alignItems:'center'}}><Art slot={'class/'+(state.classId??'shaman')} width={120} height={180}/></View>
   <Text style={{fontFamily:font.body,fontSize:22,lineHeight:28,color:paper.ink,textAlign:'center'}}>{s.won?'เสียงนกเริ่มดัง… คุณผ่านค่ำคืนนี้มาได้':'เรื่องราวจบลงกลางทาง แต่ยังมีคืนถัดไปให้ลองอีกครั้ง'}</Text>
   <View style={{gap:10,paddingTop:12,borderTopWidth:1,borderColor:paper.muted}}>
    <Row label="ศึกที่ผ่าน" value={s.fights+' / '+(state.campaign?nightFightTotal(state.campaign.night):state.runMode==='episode'?3:15)}/>
    <Row label="เลเวล · เบี้ยที่เหลือ" value={s.level+' · '+s.gold}/>
    <Row label="สำรับตอนจบ" value={state.masterDeck.length+' ใบ'}/>
    {s.metrics&&<><Row label="ใช้การ์ดทั้งหมด" value={s.metrics.cardsPlayed+' ครั้ง'}/><Row label="เทิร์น · คอมโบ" value={s.metrics.turns+' · '+s.metrics.combos}/><Row label="เพิ่ม · สละ · ปลุกเสก" value={s.metrics.added+' · '+s.metrics.removed+' · '+s.metrics.upgraded}/></>}
    {!state.campaign&&state.runMode!=='episode'&&<Row label="ศึกลับ" value={s.beatSecretBoss?'ชนะแล้ว':'ยังไม่ปลดล็อก'}/>}
   </View>
  </RitualSurface>
  {state.campaign&&s.won&&<Text style={{fontFamily:font.ui,fontSize:13,lineHeight:22,textAlign:'center',color:palette.moon}}>{state.campaign.night<5?'เปิดคืนที่ '+(state.campaign.night+1)+' สำหรับอาชีพนี้แล้ว':'เลือกวิชาห้าคืนได้ในสมุดผ่านคืน'}</Text>}
  {onJournal&&<QuietButton label="ดูสมุดผ่านคืน" onPress={onJournal}/>}
 </QuietPage>;
}
function Row({label,value}:{label:string;value:string}){return <View style={{flexDirection:'row',gap:12,justifyContent:'space-between'}}><Text style={{flex:1,fontFamily:font.ui,fontSize:12,color:paper.ink}}>{label}</Text><Text style={{fontFamily:font.heading,fontSize:13,color:paper.red}}>{value}</Text></View>;}
