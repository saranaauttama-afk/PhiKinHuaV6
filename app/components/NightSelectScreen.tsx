import React from 'react';
import {View,Text,ScrollView,ImageBackground} from 'react-native';
import type {ClassId} from '../../src/core/classes';
import {CHARACTER_CLASSES} from '../../src/core/classes';
import {NIGHT_RULES,type Night} from '../../src/core/campaign/nights';
import {unlockedNight} from '../../src/core/campaign/journal';
import {useJournal} from '../../src/store/journalStore';
import {GameButton,Scrim} from './Panel';
import RitualSurface from './RitualSurface';
import {font,palette,space} from '../theme';
import {useScreenPadding} from '../useScreenPadding';
import JournalView from './JournalView';
export default function NightSelectScreen({classId,onStart,onBack}:{classId:ClassId;onStart:(n:Night)=>Promise<boolean>;onBack:()=>void}){
 const {journal,ready,saving,error,hydrate,retry}=useJournal();const pad=useScreenPadding();
 const [busy,setBusy]=React.useState(false),[showJournal,setShowJournal]=React.useState(false),[localError,setError]=React.useState('');
 React.useEffect(()=>{void hydrate().catch(()=>{});},[]);
 if(showJournal)return <JournalView classId={classId} onClose={()=>setShowJournal(false)}/>;
 const p=journal.classes[classId],top=unlockedNight(journal,classId);
 return <ImageBackground source={require('../../assets/ui/occupation-temple.jpg')} style={{flex:1}}><Scrim heavy><ScrollView contentContainerStyle={{padding:20,paddingTop:pad.top+20,paddingBottom:pad.bottom+24,gap:12}}>
 <Text style={{fontFamily:font.display,color:palette.moon,fontSize:32}}>ห้าคืน · {CHARACTER_CLASSES[classId].name}</Text>
 <Text style={{fontFamily:font.body,color:palette.text,fontSize:20}}>ทุกคืนเป็นการเดินทางใหม่ 15 ศึก ผ่านคืนก่อนเพื่อเปิดคืนถัดไป</Text>
 {!ready&&<Text style={{color:palette.text}}>กำลังเปิดสมุดบันทึก…</Text>}
 {(error||localError)&&<><Text style={{color:palette.text}}>{error||localError}</Text><GameButton label="ลองบันทึกอีกครั้ง" onPress={()=>{void retry().catch(()=>{});}}/></>}
 {NIGHT_RULES.map(rule=>{const locked=rule.night>top,b=p.best[rule.night];return <RitualSurface key={rule.night} kind="darkCloth" style={{gap:6}}>
 <Text style={{fontFamily:font.heading,color:locked?palette.textDim:palette.moon,fontSize:22}}>คืนที่ {rule.night} · {rule.name}{rule.night<=p.highestCleared?' · ผ่านแล้ว':''}</Text>
 <Text style={{fontFamily:font.ui,color:palette.text,fontSize:14,lineHeight:22}}>{rule.desc}</Text>
 {b&&<Text style={{fontFamily:font.ui,color:palette.textDim,fontSize:12}}>สำรับเล็กสุด {b.smallestDeck} ใบ · ใช้การ์ดน้อยสุด {b.fewestCards} ครั้ง · ชนะ {b.wins} ครั้ง</Text>}
 <GameButton label={locked?`ผ่านคืนที่ ${rule.night-1} ก่อน`:busy?'กำลังออกเดินทาง…':`เล่นคืนที่ ${rule.night}`} disabled={locked||!ready||saving||busy||!!error} onPress={()=>{setBusy(true);void onStart(rule.night).then(ok=>{if(!ok)setError('ยังเริ่มคืนไม่ได้ กรุณาลองอีกครั้ง');}).catch(()=>setError('เปิดสมุดบันทึกไม่สำเร็จ')).finally(()=>setBusy(false));}}/>
 </RitualSurface>;})}
 <GameButton label="สมุดบันทึกและของปลดล็อก" onPress={()=>setShowJournal(true)}/><GameButton label="กลับไปเลือกอาชีพ" onPress={onBack}/>
 </ScrollView></Scrim></ImageBackground>;
}
