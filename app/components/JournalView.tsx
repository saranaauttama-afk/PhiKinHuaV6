import {nightFightTotal} from '../../src/core/campaign/bosses';
import React from 'react';
import {Text,View,Image,Pressable} from 'react-native';
import {useJournal} from '../../src/store/journalStore';
import {ALL_CLASS_IDS,CHARACTER_CLASSES,type ClassId} from '../../src/core/classes';
import {ACHIEVEMENTS} from '../../src/core/campaign/journal';
import {SPECIAL_BLESSINGS,SPECIAL_CARD_IDS} from '../../src/core/campaign/nights';
import {cardById} from '../../src/core/pack';
import {CARD_ART_SOURCES} from '../cardArt';
import {QuietButton,QuietPage,QuietSection} from './QuietChrome';
import {playerPortraits} from './QuietPlayerHud';
import {objectSource} from './BlessingView';
import {font,palette,quietUiColors} from '../theme';
export default function JournalView({classId,onClose}:{classId?:ClassId;onClose:()=>void}){
 const {journal,ready,saving,error,hydrate,retry,claim}=useJournal();
 const [selected,setSelected]=React.useState<ClassId>(classId??'warrior'),[detail,setDetail]=React.useState<string|null>(null);
 const [tab,setTab]=React.useState<'record'|'unlock'|'achievement'>('record');
 React.useEffect(()=>{void hydrate().catch(()=>{});},[]);
 const p=journal.classes[selected],card=cardById(SPECIAL_CARD_IDS[selected]),blessing=SPECIAL_BLESSINGS[selected];
 return <QuietPage title="สมุดผ่านคืน" subtitle="เรื่องราว วิชาที่ค้นพบ และการจัดสำรับของคุณ" onClose={onClose} closeLabel="กลับ">
  <View style={{flexDirection:'row',gap:6}}>{ALL_CLASS_IDS.map(id=><Pressable key={id} accessibilityRole="button" accessibilityLabel={'บันทึก'+CHARACTER_CLASSES[id].name} accessibilityState={{selected:id===selected}} onPress={()=>{setSelected(id);setDetail(null);}} style={{flex:1,alignItems:'center',paddingBottom:8,borderBottomWidth:id===selected?2:0,borderColor:palette.moon}}><Image source={playerPortraits[id]} resizeMode="contain" style={{width:'100%',height:76,opacity:id===selected?1:.5}}/><Text style={{fontFamily:font.ui,fontSize:10,textAlign:'center',color:id===selected?palette.moon:palette.textDim}}>{CHARACTER_CLASSES[id].name}</Text></Pressable>)}</View>
  <Text style={heading}>{CHARACTER_CLASSES[selected].name} · ผ่านแล้ว {p.highestDifficulty}/5 ระดับ</Text>
  <View style={{flexDirection:'row',gap:6}}>{([['record','การเดินทาง'],['unlock','วิชาอาถรรพ์'],['achievement','ความสำเร็จ']] as const).map(([id,label])=><Pressable key={id} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected:tab===id}} onPress={()=>setTab(id)} style={{flex:1,minHeight:48,justifyContent:'center',backgroundColor:quietUiColors.hudShade,borderBottomWidth:tab===id?2:0,borderColor:palette.moon}}><Text style={{fontFamily:font.ui,fontSize:12,textAlign:'center',color:tab===id?palette.moon:palette.textDim}}>{label}</Text></Pressable>)}</View>
  {!ready&&<Text style={copy}>กำลังอ่านสมุด…</Text>}
  {error&&<><Text style={copy}>{error}</Text><QuietButton label="ลองบันทึกอีกครั้ง" onPress={()=>{void retry().catch(()=>{});}}/></>}
  {tab==='record'&&<>
   <QuietSection title="สถิติดีที่สุด">{Object.entries(p.difficultyBest).map(([n,b])=><View key={n} style={{gap:4,paddingVertical:8}}><Text style={heading}>ระดับอาถรรพ์ {n}</Text><Text style={copy}>สำรับเล็กสุด {b.smallestDeck} ใบ · ใช้การ์ด {b.fewestCards} ครั้ง · {b.fewestTurns} เทิร์น</Text></View>)}{!p.highestDifficulty&&<Text style={copy}>ยังไม่จบรอบสามคืน · สถิติจะบันทึกเมื่อจบการเดินทาง</Text>}</QuietSection>
   <Text style={heading}>ประวัติการเดินทาง</Text>
   {!journal.history.some(r=>r.classId===selected)&&<Text style={copy}>สมุดหน้านี้ยังว่างอยู่</Text>}
   {journal.history.filter(r=>r.classId===selected).map(r=><QuietSection key={r.id} title={(r.difficulty?'ระดับ '+r.difficulty+' · คืน '+r.night+'/3':'รอบเดิม · คืน '+r.night)+' · '+(r.won?'ผ่านแล้ว':'ไปไม่ถึงเช้า')}><Text style={copy}>{r.fights}/{(r.totalFights??(r.route==='adventure'?(r.night===5?12:11):nightFightTotal(r.night)))} ศึก · สำรับ {r.deck.length} ใบ · เล่น {r.metrics.cardsPlayed} ใบ</Text><Text style={copy}>{r.metrics.turns} เทิร์น · คอมโบ {r.metrics.combos} ครั้ง</Text><QuietButton label={detail===r.id?'ซ่อนสำรับ':'ดูสำรับและพร'} onPress={()=>setDetail(detail===r.id?null:r.id)}/>{detail===r.id&&<><Text style={copy}>{r.deck.map(c=>c.name).join(' · ')}</Text><Text style={copy}>พร: {r.blessings.map(b=>b.name).join(' · ')||'ไม่มี'}</Text><Text style={copy}>นำเข้า {r.metrics.added} · นำออก {r.metrics.removed} · ปลุกเสก {r.metrics.upgraded}</Text></>}</QuietSection>)}
  </>}
  {tab==='unlock'&&<><Text style={copy}>ชนะผีกินหัวในระดับอาถรรพ์ 5 เลือกปลดล็อก 1 อย่าง เล่นชนะอีกครั้งเพื่อเก็บอีกอย่าง</Text>
   <QuietSection title={card?.name??'วิชาประจำอาชีพ'}><Image source={CARD_ART_SOURCES[SPECIAL_CARD_IDS[selected]]} resizeMode="contain" style={{width:'100%',height:130}}/><Text style={copy}>{card?.desc} · เมื่อปลดล็อกจะพบในรางวัลของอาชีพนี้</Text><QuietButton primary label={p.unlocks.includes('card')?'ปลดล็อกการ์ดแล้ว':'เลือกปลดล็อกการ์ด'} disabled={!ready||saving||!!error||p.nightFiveWins<=p.unlocks.length||p.unlocks.includes('card')} onPress={()=>{void claim(selected,'card').catch(()=>{});}}/></QuietSection>
   <QuietSection title={blessing.name}><Image source={objectSource(blessing)} resizeMode="contain" style={{width:'100%',height:120}}/><Text style={copy}>{blessing.desc} · เมื่อปลดล็อกจะเลือกเป็นพรตั้งต้นได้</Text><QuietButton primary label={p.unlocks.includes('blessing')?'ปลดล็อกพรแล้ว':'เลือกปลดล็อกพร'} disabled={!ready||saving||!!error||p.nightFiveWins<=p.unlocks.length||p.unlocks.includes('blessing')} onPress={()=>{void claim(selected,'blessing').catch(()=>{});}}/></QuietSection>
  </>}
  {tab==='achievement'&&<QuietSection title={'ความสำเร็จ '+p.achievements.length+'/'+ACHIEVEMENTS.length}>{ACHIEVEMENTS.map(a=><View key={a.id} style={{paddingVertical:10,gap:5,borderBottomWidth:1,borderColor:quietUiColors.optionLine}}><Text style={[heading,{color:p.achievements.includes(a.id)?palette.moon:palette.textDim}]}>{p.achievements.includes(a.id)?'✓ ':'○ '}{a.name}</Text><Text style={copy}>{a.desc}</Text></View>)}</QuietSection>}
 </QuietPage>;
}
const heading={fontFamily:font.heading,color:palette.moon,fontSize:18};const copy={fontFamily:font.ui,color:palette.text,fontSize:13,lineHeight:23};
