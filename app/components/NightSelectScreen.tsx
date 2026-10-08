import React from 'react';
import {View,Text,Pressable,Image} from 'react-native';
import type {ClassId} from '../../src/core/classes';
import {CHARACTER_CLASSES} from '../../src/core/classes';
import {NIGHT_RULES,type Night} from '../../src/core/campaign/nights';
import {unlockedNight} from '../../src/core/campaign/journal';
import {useJournal} from '../../src/store/journalStore';
import {QuietButton,QuietPage,QuietSection} from './QuietChrome';
import {playerPortraits} from './QuietPlayerHud';
import {font,palette,quietUiColors} from '../theme';
import JournalView from './JournalView';
export default function NightSelectScreen({classId,onStart,onBack}:{classId:ClassId;onStart:(n:Night)=>Promise<boolean>;onBack:()=>void}){
 const {journal,ready,saving,error,hydrate,retry}=useJournal();
 const [busy,setBusy]=React.useState(false),[showJournal,setShowJournal]=React.useState(false),[localError,setError]=React.useState('');
 const p=journal.classes[classId],top=unlockedNight(journal,classId);
 const [selected,setSelected]=React.useState<Night>(1);
 React.useEffect(()=>{void hydrate().catch(()=>{});},[]);
 if(showJournal)return <JournalView classId={classId} onClose={()=>setShowJournal(false)}/>;
 const rule=NIGHT_RULES.find(r=>r.night===selected)!,b=p.best[selected],locked=selected>top;
 return <QuietPage title="ห้าคืนอาถรรพ์" subtitle={CHARACTER_CLASSES[classId].name+' · ผ่านคืนก่อนเพื่อเปิดคืนถัดไป'} onClose={onBack} closeLabel="กลับ">
  <Image accessible={false} source={playerPortraits[classId]} resizeMode="contain" style={{height:170,width:'100%'}}/>
  <View style={{flexDirection:'row',gap:8,justifyContent:'center'}}>{NIGHT_RULES.map(r=><Pressable key={r.night} accessibilityRole="button" accessibilityLabel={'ดูคืนที่ '+r.night} accessibilityState={{selected:selected===r.night}} onPress={()=>setSelected(r.night)} style={{flex:1,minHeight:66,alignItems:'center',justifyContent:'center',borderBottomWidth:selected===r.night?2:0,borderColor:palette.moon,backgroundColor:quietUiColors.hudShade}}>
   <Text style={{fontFamily:font.display,fontSize:26,color:r.night>top?palette.textDim:palette.moon}}>{r.night}</Text><Text style={{fontFamily:font.ui,fontSize:10,color:palette.textDim}}>{r.night<=p.highestCleared?'ผ่านแล้ว':r.night>top?'ยังไม่เปิด':'เล่นได้'}</Text>
  </Pressable>)}</View>
  <QuietSection title={'คืนที่ '+selected+' · '+rule.name}>
   <Text style={{fontFamily:font.body,fontSize:22,lineHeight:28,color:palette.text}}>{rule.desc}</Text>
   <Text style={{fontFamily:font.ui,fontSize:12,color:palette.textDim}}>15 ศึก · มีจุดพักระหว่างทาง · บอสกลางทางและท้ายคืน</Text>
   {b&&<Text style={{fontFamily:font.ui,fontSize:12,lineHeight:22,color:palette.moon}}>สำรับเล็กสุด {b.smallestDeck} ใบ · ใช้การ์ดน้อยสุด {b.fewestCards} ครั้ง · ชนะ {b.wins} ครั้ง</Text>}
   <QuietButton primary label={locked?'ผ่านคืนที่ '+(selected-1)+' ก่อน':busy?'กำลังออกเดินทาง…':'เล่นคืนที่ '+selected} disabled={locked||!ready||saving||busy||!!error} onPress={()=>{setBusy(true);setError('');void onStart(selected).then(ok=>{if(!ok)setError('ยังเริ่มคืนไม่ได้ กรุณาลองอีกครั้ง');}).catch(()=>setError('เปิดสมุดบันทึกไม่สำเร็จ')).finally(()=>setBusy(false));}}/>
  </QuietSection>
  {!ready&&<Text style={{color:palette.text}}>กำลังเปิดสมุดบันทึก…</Text>}
  {(error||localError)&&<><Text style={{color:palette.text}}>{error||localError}</Text><QuietButton label="ลองบันทึกอีกครั้ง" onPress={()=>{void retry().catch(()=>{});}}/></>}
  <QuietButton label="สมุดบันทึกและของปลดล็อก" onPress={()=>setShowJournal(true)}/>
 </QuietPage>;
}
