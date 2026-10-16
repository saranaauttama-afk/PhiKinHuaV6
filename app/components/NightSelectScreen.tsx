import {DIFFICULTY_RULES,runFightTotal} from '../../src/core/campaign/threeNight';
import React from 'react';
import {View,Text,ScrollView,Image,Pressable} from 'react-native';
import type {ClassId} from '../../src/core/classes';
import {CHARACTER_CLASSES} from '../../src/core/classes';
import type {Difficulty} from '../../src/core/campaign/threeNight';
import {unlockedDifficulty} from '../../src/core/campaign/journal';
import {useJournal} from '../../src/store/journalStore';
import {font,paper} from '../theme';
import {artSource} from './Art';
import {BookScreen,BookStage,BookPage,BookButton,BookStamp,InkTitle,bookCream,bookInk} from './OccupationBook';
import JournalView from './JournalView';
export default function NightSelectScreen({classId,onStart,onBack}:{classId:ClassId;onStart:(n:Difficulty)=>Promise<boolean>;onBack:()=>void}){
 const {journal,ready,saving,error,hydrate,retry}=useJournal();
 const [busy,setBusy]=React.useState(false),[showJournal,setShowJournal]=React.useState(false),[localError,setError]=React.useState('');
 const p=journal.classes[classId],top=unlockedDifficulty(journal,classId);
 const [selected,setSelected]=React.useState<Difficulty>(1);
 React.useEffect(()=>{void hydrate().catch(()=>{});},[]);
 if(showJournal)return <JournalView classId={classId} onClose={()=>setShowJournal(false)}/>;
 const rule=DIFFICULTY_RULES.find(r=>r.level===selected)!,b=p.difficultyBest[selected],locked=selected>top;
 return <BookScreen title="ระดับอาถรรพ์" onBack={onBack} footer={<>
  <BookButton label={locked?'ชนะระดับ '+(selected-1)+' ก่อน':busy?'กำลังออกเดินทาง…':'เริ่มรอบ · ระดับ '+selected} disabled={locked||!ready||saving||busy||!!error} onPress={()=>{setBusy(true);setError('');void onStart(selected).then(ok=>{if(!ok)setError('ยังเริ่มรอบไม่ได้ กรุณาลองอีกครั้ง');}).catch(()=>setError('เปิดสมุดบันทึกไม่สำเร็จ')).finally(()=>setBusy(false));}}/>
  <Text style={{fontFamily:font.ui,fontSize:11,color:bookCream,lineHeight:18}}>หนึ่งรอบ · สามคืนต่อเนื่อง</Text>
 </>}>
  <BookStage testID="occupation-difficulty-book">{({width,height})=><BookPage>
   <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{gap:7,paddingBottom:6}}>
    <Text style={{fontFamily:font.ui,fontSize:11,textAlign:'center',color:paper.ink}}>วิชาของ{CHARACTER_CLASSES[classId].name}</Text>
    <View style={{height:height*.27,overflow:'hidden',borderWidth:2,borderColor:bookInk}}><Image accessible={false} source={require('../../assets/ui/occupation-temple.jpg')} resizeMode="cover" style={{position:'absolute',width:width*.71,height:height*.27}}/><Image accessible={false} source={artSource(`class/${classId}`)} resizeMode="contain" style={{position:'absolute',width:width*.72,height:height*.55,top:0,alignSelf:'center'}}/></View>
    <InkTitle>{CHARACTER_CLASSES[classId].name}</InkTitle>
    <View style={{flexDirection:'row',justifyContent:'space-between'}}>{DIFFICULTY_RULES.map(r=><View key={r.level} style={{alignItems:'center',flex:1}}>
     <BookStamp value={r.level} complete={r.level<=p.highestDifficulty} selected={selected===r.level} disabled={r.level>top} onPress={()=>setSelected(r.level)}/>
     <Text style={{fontFamily:font.ui,fontSize:9,color:r.level>top?paper.muted:paper.red}}>{r.level<=p.highestDifficulty?'ผ่านแล้ว':r.level>top?'ยังไม่เปิด':'เล่นได้'}</Text>
    </View>)}</View>
    <View style={{borderTopWidth:1,borderBottomWidth:1,borderColor:paper.line,paddingVertical:7,gap:6}}>
     <Text style={{fontFamily:font.heading,fontSize:15,color:paper.red}}>ระดับ {selected} · {rule.name}</Text>
     <Text style={copy}>{rule.desc}</Text>
     <Text style={copy}>{runFightTotal(selected)} ศึก · บอสประจำคืน 3 ตัว{selected===5?' + ผีกินหัว':''} · ทุกคืนมีร้าน ศาลพร ช่างปลุกเสก ศาลาลืมเลือน และจุดพักฟื้น</Text>
     {b&&<Text style={copy}>สำรับเล็กสุด {b.smallestDeck} ใบ · ใช้การ์ดน้อยสุด {b.fewestCards} ครั้ง · ชนะ {b.wins} ครั้ง</Text>}
    </View>
    {!ready&&<Text style={copy}>กำลังเปิดสมุดบันทึก…</Text>}
    {!!(error||localError)&&<><Text style={{...copy,color:paper.red}}>{error||localError}</Text><BookButton label="ลองบันทึกอีกครั้ง" onPress={()=>{void retry().catch(()=>{});}}/></>}
    <Text style={{...copy,fontSize:10,lineHeight:17}}>สำรับ พร เครื่องราง และเบี้ยเดินต่อทั้งสามคืน · จบรอบแล้วเริ่มใหม่ด้วยสำรับอาชีพ · ชนะเพื่อปลดระดับถัดไปของอาชีพนี้</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="สมุดบันทึกและของปลดล็อก" onPress={()=>setShowJournal(true)} style={{minHeight:40,justifyContent:'center'}}><Text style={{fontFamily:font.heading,fontSize:11,color:paper.red,textAlign:'center',textDecorationLine:'underline'}}>สมุดบันทึกและของปลดล็อก ›</Text></Pressable>
   </ScrollView>
  </BookPage>}</BookStage>
 </BookScreen>;
}
const copy={fontFamily:font.ui,fontSize:12,lineHeight:20,color:paper.ink};
