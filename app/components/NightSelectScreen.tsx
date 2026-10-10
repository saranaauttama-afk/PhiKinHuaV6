import {DIFFICULTY_RULES,runFightTotal} from '../../src/core/campaign/threeNight';
import React from 'react';
import {View,Text,Pressable,Image} from 'react-native';
import type {ClassId} from '../../src/core/classes';
import {CHARACTER_CLASSES} from '../../src/core/classes';
import {type Night} from '../../src/core/campaign/nights';
import {unlockedDifficulty} from '../../src/core/campaign/journal';
import {useJournal} from '../../src/store/journalStore';
import {QuietButton,QuietPage,QuietSection} from './QuietChrome';
import {playerPortraits} from './QuietPlayerHud';
import {font,palette} from '../theme';
import CandleSelection from './CandleSelection';
import JournalView from './JournalView';
export default function NightSelectScreen({classId,onStart,onBack}:{classId:ClassId;onStart:(n:Night)=>Promise<boolean>;onBack:()=>void}){
 const {journal,ready,saving,error,hydrate,retry}=useJournal();
 const [busy,setBusy]=React.useState(false),[showJournal,setShowJournal]=React.useState(false),[localError,setError]=React.useState('');
 const p=journal.classes[classId],top=unlockedDifficulty(journal,classId);
 const [selected,setSelected]=React.useState<Night>(1);
 React.useEffect(()=>{void hydrate().catch(()=>{});},[]);
 if(showJournal)return <JournalView classId={classId} onClose={()=>setShowJournal(false)}/>;
 const rule=DIFFICULTY_RULES.find(r=>r.level===selected)!,b=p.difficultyBest[selected],locked=selected>top;
 return <QuietPage title="ระดับอาถรรพ์" subtitle={CHARACTER_CLASSES[classId].name+' · หนึ่งรอบ สามคืนต่อเนื่อง'} onClose={onBack} closeLabel="กลับ">
  <Image accessible={false} source={playerPortraits[classId]} resizeMode="contain" style={{height:170,width:'100%'}}/>
  <View style={{flexDirection:'row',gap:8,justifyContent:'center'}}>{DIFFICULTY_RULES.map(r=><Pressable key={r.level} accessibilityRole="button" accessibilityLabel={'ดูระดับอาถรรพ์ '+r.level} accessibilityState={{selected:selected===r.level}} onPress={()=>setSelected(r.level)} style={{flex:1}}><CandleSelection selected={selected===r.level} dim={selected!==r.level}><View style={{minHeight:66,alignItems:'center',justifyContent:'center'}}>
   <Text style={{fontFamily:font.display,fontSize:26,color:r.level>top?palette.textDim:palette.moon}}>{r.level}</Text><Text style={{fontFamily:font.ui,fontSize:10,color:palette.textDim}}>{r.level<=p.highestDifficulty?'ผ่านแล้ว':r.level>top?'ยังไม่เปิด':'เล่นได้'}</Text>
  </View></CandleSelection></Pressable>)}</View>
  <QuietSection title={'ระดับ '+selected+' · '+rule.name}>
   <Text style={{fontFamily:font.body,fontSize:22,lineHeight:28,color:palette.text}}>{rule.desc}</Text>
   <Text style={{fontFamily:font.ui,fontSize:12,color:palette.textDim}}>{runFightTotal(selected)} ศึก · บอสประจำคืน 3 ตัว{selected===5?' + ผีกินหัว':''} · ร้าน 3 จุด · พักฟื้น 3 จุด · ของพิเศษ 2 จุด</Text>
   {b&&<Text style={{fontFamily:font.ui,fontSize:12,lineHeight:22,color:palette.moon}}>สำรับเล็กสุด {b.smallestDeck} ใบ · ใช้การ์ดน้อยสุด {b.fewestCards} ครั้ง · ชนะ {b.wins} ครั้ง</Text>}
   <QuietButton primary label={locked?'ชนะระดับ '+(selected-1)+' ก่อน':busy?'กำลังออกเดินทาง…':'เริ่มรอบ · ระดับ '+selected} disabled={locked||!ready||saving||busy||!!error} onPress={()=>{setBusy(true);setError('');void onStart(selected).then(ok=>{if(!ok)setError('ยังเริ่มรอบไม่ได้ กรุณาลองอีกครั้ง');}).catch(()=>setError('เปิดสมุดบันทึกไม่สำเร็จ')).finally(()=>setBusy(false));}}/>
  </QuietSection>
  {!ready&&<Text style={{color:palette.text}}>กำลังเปิดสมุดบันทึก…</Text>}
  {(error||localError)&&<><Text style={{color:palette.text}}>{error||localError}</Text><QuietButton label="ลองบันทึกอีกครั้ง" onPress={()=>{void retry().catch(()=>{});}}/></>}
  <Text style={{fontFamily:font.ui,fontSize:12,lineHeight:20,color:palette.textDim}}>สำรับ พร อุปกรณ์ และเบี้ยเดินต่อทั้งสามคืน · จบรอบแล้วเริ่มใหม่ด้วยสำรับอาชีพ · ชนะเพื่อปลดระดับถัดไปของอาชีพนี้</Text>
  <QuietButton label="สมุดบันทึกและของปลดล็อก" onPress={()=>setShowJournal(true)}/>
 </QuietPage>;
}
