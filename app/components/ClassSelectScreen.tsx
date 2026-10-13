import React from 'react';
import {View,Text,ScrollView,ImageBackground,useWindowDimensions} from 'react-native';
import {CHARACTER_CLASSES,ALL_CLASS_IDS,type ClassId} from '../../src/core/classes';
import {CARD_RULES,CLASS_RESOURCES} from '../../src/core/balance/notfm';
import {skillsFor} from '../../src/core/skills';
import {useJournal} from '../../src/store/journalStore';
import Art from './Art';
import RitualSurface from './RitualSurface';
import {QuietButton} from './QuietChrome';
import CloseSeal from './CloseSeal';
import StatIcon from './StatIcon';
import {font,palette,paper} from '../theme';
import {useScreenPadding} from '../useScreenPadding';
type Props={onPick:(id:ClassId)=>void;onBack?:()=>void};
/** One cover and one page per existing occupation; selection still enters difficulty choice. */
export default function ClassSelectScreen({onPick,onBack}:Props) {
 const pad=useScreenPadding(),{height}=useWindowDimensions();
 const [page,setPage]=React.useState(-1);
 const {journal,ready,error,hydrate}=useJournal();
 React.useEffect(()=>{void hydrate().catch(()=>{});},[hydrate]);
 const id=ALL_CLASS_IDS[Math.max(0,page)],picked=CHARACTER_CLASSES[id];
 const progress=journal.classes[id];
 const completed=Math.max(0,...journal.history.filter(r=>r.classId===id).map(r=>r.completedNights));
 return <ImageBackground source={require('../../assets/ui/occupation-table-tall.jpg')} style={{flex:1}}>
  <View style={{flex:1,paddingTop:pad.top+8,paddingBottom:pad.bottom+12,paddingHorizontal:18,backgroundColor:palette.scrim}}>
   <View style={{height:44,alignItems:'flex-end'}}>{onBack&&<CloseSeal label="กลับ" onPress={onBack}/>}</View>
   {page<0?<RitualSurface testID="occupation-book-cover" kind="darkCloth" style={{flex:1,maxWidth:480,width:'100%',alignSelf:'center',padding:26,justifyContent:'space-between',borderLeftWidth:5,borderLeftColor:paper.line}}>
    <View style={{alignItems:'center',gap:12,paddingTop:22}}><StatIcon name="blessing" size={48}/><Text style={{fontFamily:font.ui,color:palette.moonDim,fontSize:12}}>ผีกินหัว</Text><Text accessibilityRole="header" style={{fontFamily:font.display,fontSize:30,lineHeight:44,color:palette.moon,textAlign:'center'}}>ตำรานักปราบผี</Text><Text style={{fontFamily:font.ui,fontSize:13,color:palette.text,textAlign:'center'}}>สี่วิชา · สามคืนตามหัว</Text></View>
    <View style={{alignItems:'center'}}><Art slot="class/shaman" width={Math.min(190,height*.23)} height={Math.min(280,height*.32)}/></View>
    <View style={{gap:12}}><Text style={{fontFamily:font.ui,color:palette.text,fontSize:13,lineHeight:23,textAlign:'center'}}>เปิดตำรา เลือกวิชาประจำตัวก่อนออกตามหัวกลับมา</Text><QuietButton primary label="เปิดตำรา" onPress={()=>setPage(0)}/></View>
   </RitualSurface>:<RitualSurface testID={`occupation-${id}`} kind="occupationPage" style={{flex:1,maxWidth:480,width:'100%',alignSelf:'center',padding:22}}>
    <ScrollView contentContainerStyle={{gap:10}}>
     <Text style={{fontFamily:font.ui,fontSize:10,color:paper.muted,textAlign:'center'}}>ตำรานักปราบผี · {page+1} / {ALL_CLASS_IDS.length}</Text>
     <Text accessibilityRole="header" style={{fontFamily:font.display,color:paper.ink,fontSize:28,textAlign:'center'}}>{picked.name}</Text>
     <Text style={{fontFamily:font.ui,fontSize:12,color:paper.muted,textAlign:'center'}}>{picked.title}</Text>
     <View style={{alignItems:'center'}}><Art slot={`class/${id}`} width={Math.min(180,height*.23)} height={Math.min(240,height*.28)}/></View>
     <Text style={{fontFamily:font.ui,fontSize:13,lineHeight:23,color:paper.ink}}>{picked.desc}</Text>
     <View style={{flexDirection:'row',gap:12,justifyContent:'space-around',borderTopWidth:1,borderBottomWidth:1,borderColor:paper.line,paddingVertical:8}}>
      <Stat label="ชีวิต" value={picked.startHp}/><Stat label="พลังงาน" value={CARD_RULES.apPerTurn}/><Stat label="มานา" value={CLASS_RESOURCES[id].startMana}/>
     </View>
     <Text style={{fontFamily:font.heading,fontSize:14,color:paper.red}}>{picked.passiveName}</Text>
     <Text style={{fontFamily:font.ui,fontSize:12,lineHeight:22,color:paper.ink}}>{picked.passiveDesc}</Text>
     {skillsFor(id).map(d=><Text key={d.id} testID={`class-skill-${d.slot}`} style={{fontFamily:font.ui,fontSize:12,lineHeight:22,color:paper.ink}}>{d.name} · {d.text} · พัก {d.cd} ไฟต์</Text>)}
     <Text style={{fontFamily:font.ui,fontSize:12,lineHeight:22,color:paper.red}}>{!ready?'กำลังอ่านบันทึก…':error?'อ่านบันทึกไม่สำเร็จ':`ผ่านถึงคืน ${completed}/3 · ผ่านอาถรรพ์ ${progress.highestDifficulty}/5`}</Text>
    </ScrollView>
    <View style={{gap:6,paddingTop:8}}><QuietButton primary label={`เลือก${picked.name}`} onPress={()=>onPick(id)}/>
     <View style={{flexDirection:'row',gap:8}}><QuietButton label={page===0?'หน้าปก':'‹ หน้าก่อน'} onPress={()=>setPage(page-1)} style={{flex:1}}/><QuietButton label="หน้าถัดไป ›" disabled={page===ALL_CLASS_IDS.length-1} onPress={()=>setPage(page+1)} style={{flex:1}}/></View>
    </View>
   </RitualSurface>}
  </View>
 </ImageBackground>;
}
function Stat({label,value}:{label:string;value:number}) {return <View style={{alignItems:'center'}}><Text style={{fontFamily:font.heading,fontSize:17,color:paper.red}}>{value}</Text><Text style={{fontFamily:font.ui,fontSize:10,color:paper.ink}}>{label}</Text></View>}
