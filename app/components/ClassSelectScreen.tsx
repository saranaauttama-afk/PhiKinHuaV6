import React from 'react';
import {View,Text,Image,Pressable,PanResponder,ScrollView} from 'react-native';
import {CHARACTER_CLASSES,CLASS_BOOK_ORDER as ALL_CLASS_IDS,classPlayable,type ClassId} from '../../src/core/classes';
import {CARD_RULES,CLASS_RESOURCES} from '../../src/core/balance/notfm';
import {skillsFor} from '../../src/core/skills';
import {useJournal} from '../../src/store/journalStore';
import {artSource} from './Art';
import {BookScreen,BookStage,BookPage,BookButton,BookArrow,bookCream,bookInk,bookRed} from './OccupationBook';
import {font,paper} from '../theme';
type Props={onPick:(id:ClassId)=>void;onBack?:()=>void};
/** Presentation only: class values, skills and run callbacks come from the game. */
export default function ClassSelectScreen({onPick,onBack}:Props) {
 const [page,setPage]=React.useState(-1);
 const {journal,ready,error,hydrate}=useJournal();
 React.useEffect(()=>{void hydrate().catch(()=>{});},[hydrate]);
 const id=ALL_CLASS_IDS[Math.max(0,page)],picked=CHARACTER_CLASSES[id];
 const completed=Math.max(0,...journal.history.filter(r=>r.classId===id).map(r=>r.completedNights));
 const move=React.useCallback((offset:number)=>setPage(p=>Math.max(-1,Math.min(ALL_CLASS_IDS.length-1,p+offset))),[]);
 const swipe=React.useMemo(()=>PanResponder.create({onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dx)>22&&Math.abs(g.dx)>Math.abs(g.dy)*1.6,onPanResponderRelease:(_,g)=>{if(Math.abs(g.dx)>45)move(g.dx<0?1:-1);}}),[move]);
 return <BookScreen onBack={page<0?onBack:()=>setPage(-1)} footer={page<0?
  <BookButton label="เปิดตำรา" onPress={()=>move(1)}/>:<>
   <View style={{flexDirection:'row',gap:8,alignItems:'center'}}><BookArrow label={page===0?'หน้าปก':'หน้าก่อน'} direction="left" onPress={()=>move(-1)} style={{height:40}}/>{ALL_CLASS_IDS.map((c,i)=><Pressable key={c} accessibilityRole="button" accessibilityLabel={'เปิดหน้า'+CHARACTER_CLASSES[c].name} accessibilityState={{selected:page===i}} onPress={()=>setPage(i)} style={{width:24,height:24,alignItems:'center',justifyContent:'center'}}><View style={{width:8,height:8,borderRadius:4,borderWidth:1,borderColor:bookCream,backgroundColor:page===i?bookCream:'transparent'}}/></Pressable>)}<BookArrow label="หน้าถัดไป" direction="right" disabled={page===ALL_CLASS_IDS.length-1} onPress={()=>move(1)} style={{height:40}}/></View>
   <BookButton label={classPlayable(id)?'เลือก'+picked.name:picked.name+' · ยังไม่เปิด รอการ์ดชุดใหม่'} disabled={!classPlayable(id)} onPress={()=>{if(classPlayable(id))onPick(id);}}/>
  </>}>
  <BookStage cover={page<0} testID={page<0?'occupation-book-cover':`occupation-${id}`}>{({width,height})=>page<0?
   <View accessible accessibilityLabel="ปกตำรานักปราบผี คืนหัวก่อนรุ่งสาง" style={{width,height}}/>:<>
    <BookPage><View style={{flex:1}} {...swipe.panHandlers}>
     <ClassPage key={id} id={id} page={page} width={width} height={height}/>
     {!classPlayable(id)&&<View pointerEvents="none" accessible accessibilityLabel="ยังไม่เปิด" style={{position:'absolute',top:'38%',alignSelf:'center',transform:[{rotate:'-12deg'}],borderWidth:3,borderColor:bookRed,borderRadius:6,paddingHorizontal:14,paddingVertical:4}}><Text style={{fontFamily:font.heading,fontSize:22,color:bookRed}}>ยังไม่เปิด</Text></View>}
     <View testID="class-completion-corner" style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingTop:4}}>
      <Text style={{fontFamily:font.ui,fontSize:9,color:paper.muted}}>{page+1}/{ALL_CLASS_IDS.length}</Text>
      <View style={{alignItems:'flex-end',gap:2}}>
       <View style={{flexDirection:'row',alignItems:'center',gap:3}}><Text style={{fontFamily:font.ui,fontSize:9,color:paper.muted}}>คืนที่ผ่าน</Text>{[1,2,3].map(n=><View key={n} accessible accessibilityLabel={'คืน '+n+(ready&&completed>=n?' ผ่านแล้ว':' ยังไม่ผ่าน')} style={{width:17,height:17,borderRadius:9,borderWidth:1,borderColor:ready&&completed>=n?bookRed:paper.muted,alignItems:'center',justifyContent:'center'}}><Text style={{fontFamily:font.heading,fontSize:10,lineHeight:14,color:ready&&completed>=n?bookRed:paper.muted}}>{ready&&completed>=n?'✓':n}</Text></View>)}</View>
       <Text style={{fontFamily:font.ui,fontSize:8,lineHeight:12,color:paper.muted}}>{!ready?'กำลังอ่านบันทึก…':error?'อ่านบันทึกไม่สำเร็จ':`อาถรรพ์ ${journal.classes[id].highestDifficulty}/5`}</Text>
      </View>
     </View>
    </View></BookPage>
   </>}</BookStage>
 </BookScreen>;
}
function ClassPage({id,page,width,height}:{id:ClassId;page:number;width:number;height:number}) {
 const picked=CHARACTER_CLASSES[id];
 const [copyHeight,setCopyHeight]=React.useState(330);
 // Give the illustration the remaining space; all rules stay on this page.
 // Scrolling remains available for large accessibility font settings.
 const portrait=Math.max(54,Math.min(160,height*.27,height*.84-copyHeight-42));
 const compact=height<510;
 const copy={fontFamily:font.ui,fontSize:compact?10:11,lineHeight:compact?15:17,color:paper.ink};
 return <ScrollView testID="class-single-page" style={{flex:1}} showsVerticalScrollIndicator={false} contentContainerStyle={{gap:4}}>
  <View style={{height:portrait,overflow:'hidden',borderWidth:1,borderColor:bookInk}}>
   <Image accessible={false} source={require('../../assets/ui/occupation-temple.jpg')} resizeMode="cover" style={{position:'absolute',width:width*.72,height:portrait}}/>
   <Image accessible={false} source={artSource(`class/${id}`)} resizeMode="contain" style={{position:'absolute',width:width*.76,height:portrait*2.1,top:-portrait*.03,alignSelf:'center'}}/>
  </View>
  <View onLayout={e=>setCopyHeight(e.nativeEvent.layout.height)} style={{gap:4}}>
   <View style={{flexDirection:'row',alignItems:'baseline',justifyContent:'space-between',borderBottomWidth:1,borderColor:bookRed,paddingBottom:2}}><Text accessibilityRole="header" style={{fontFamily:font.display,fontSize:compact?20:23,lineHeight:compact?27:31,color:bookInk}}>{picked.name}</Text><Text style={{fontFamily:font.ui,fontSize:9,color:paper.muted}}>บทที่ {page+1}</Text></View>
   <Text style={copy}>{picked.desc}</Text>
   <Text style={{...copy,fontFamily:font.heading,color:bookRed}}>ชีวิต {picked.startHp} · พลังงาน {CARD_RULES.apPerTurn} · มานา {CLASS_RESOURCES[id].startMana}</Text>
   <View testID="class-passive" style={{borderTopWidth:1,borderColor:paper.line,paddingTop:3}}><Text style={{...copy,fontFamily:font.heading,color:bookRed}}>{picked.passiveName} · ความสามารถประจำตัว</Text><Text style={copy}>{picked.passiveDesc}</Text></View>
   {skillsFor(id).map(d=><View key={d.id} testID={`class-skill-${d.slot}`} style={{borderTopWidth:1,borderColor:paper.line,paddingTop:3}}><View style={{flexDirection:'row',justifyContent:'space-between',gap:4}}><Text style={{...copy,fontFamily:font.heading}}>{d.name}</Text><Text style={{fontFamily:font.ui,fontSize:8,lineHeight:copy.lineHeight,color:paper.muted}}>{d.slot==='A'?'นอกศึก':'ในศึก'} · พัก {d.cd} ไฟต์</Text></View><Text style={copy}>{d.text}</Text></View>)}
  </View>
 </ScrollView>;
}
