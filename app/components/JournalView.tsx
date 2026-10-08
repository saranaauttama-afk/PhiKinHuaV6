import React from 'react';
import {Text,ScrollView,ImageBackground,View,Image} from 'react-native';
import {useJournal} from '../../src/store/journalStore';
import {ALL_CLASS_IDS,CHARACTER_CLASSES,type ClassId} from '../../src/core/classes';
import {ACHIEVEMENTS} from '../../src/core/campaign/journal';
import {SPECIAL_BLESSINGS,SPECIAL_CARD_IDS} from '../../src/core/campaign/nights';
import {cardById} from '../../src/core/pack';
import {GameButton,Scrim} from './Panel';
import {CARD_ART_SOURCES} from '../cardArt';
import RitualSurface from './RitualSurface';
import {font,palette} from '../theme';
import {useScreenPadding} from '../useScreenPadding';
export default function JournalView({classId,onClose}:{classId?:ClassId;onClose:()=>void}){
 const {journal,ready,saving,error,hydrate,retry,claim}=useJournal();const pad=useScreenPadding();
 const [selected,setSelected]=React.useState<ClassId>(classId??'warrior');const [detail,setDetail]=React.useState<string|null>(null);
 React.useEffect(()=>{void hydrate().catch(()=>{});},[]);
 const p=journal.classes[selected],card=cardById(SPECIAL_CARD_IDS[selected]),blessing=SPECIAL_BLESSINGS[selected];
 return <ImageBackground source={require('../../assets/ui/occupation-table-tall.jpg')} style={{flex:1}}><Scrim heavy><ScrollView contentContainerStyle={{padding:20,paddingTop:pad.top+16,paddingBottom:pad.bottom+20,gap:12}}>
 <Text style={{fontFamily:font.display,color:palette.moon,fontSize:30}}>สมุดผ่านคืน</Text>
 <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{ALL_CLASS_IDS.map(id=><GameButton key={id} label={CHARACTER_CLASSES[id].name} tone={id===selected?'primary':undefined} onPress={()=>{setSelected(id);setDetail(null);}}/>)}</View>
 {!ready&&<Text style={{color:palette.text}}>กำลังอ่านสมุด…</Text>}
 {error&&<><Text style={{color:palette.text}}>{error}</Text><GameButton label="ลองบันทึกอีกครั้ง" onPress={()=>{void retry().catch(()=>{});}}/></>}
 <RitualSurface kind="darkCloth" style={{gap:6}}><Text style={heading}>ผ่านแล้ว {p.highestCleared}/5 คืน</Text>
 {Object.entries(p.best).map(([n,b])=><Text key={n} style={copy}>คืน {n}: สำรับเล็กสุด {b.smallestDeck} ใบ · ใช้การ์ด {b.fewestCards} ครั้ง · {b.fewestTurns} เทิร์น</Text>)}
 {!p.highestCleared&&<Text style={copy}>ยังไม่ผ่านคืนแรก</Text>}</RitualSurface>
 <RitualSurface kind="darkCloth" style={{gap:8}}><Text style={heading}>วิชาห้าคืน</Text><Text style={copy}>ผ่านคืนที่ 5 เลือกปลดล็อก 1 อย่าง เล่นชนะคืนที่ 5 อีกครั้งเพื่อเก็บอีกอย่าง</Text>
 <Image source={CARD_ART_SOURCES[SPECIAL_CARD_IDS[selected]]} resizeMode="contain" style={{width:120,height:120,alignSelf:'center'}}/><Text style={heading}>{card?.name}</Text><Text style={copy}>{card?.desc} · เมื่อปลดล็อกจะพบในรางวัลของอาชีพนี้</Text>
 <GameButton label={p.unlocks.includes('card')?'ปลดล็อกการ์ดแล้ว':'เลือกปลดล็อกการ์ด'} disabled={!ready||saving||!!error||p.nightFiveWins<=p.unlocks.length||p.unlocks.includes('card')} onPress={()=>{void claim(selected,'card').catch(()=>{});}}/>
 <Text style={heading}>{blessing.name}</Text><Text style={copy}>{blessing.desc} · เมื่อปลดล็อกจะเลือกเป็นพรตั้งต้นได้</Text>
 <GameButton label={p.unlocks.includes('blessing')?'ปลดล็อกพรแล้ว':'เลือกปลดล็อกพร'} disabled={!ready||saving||!!error||p.nightFiveWins<=p.unlocks.length||p.unlocks.includes('blessing')} onPress={()=>{void claim(selected,'blessing').catch(()=>{});}}/>
 </RitualSurface>
 <RitualSurface kind="darkCloth" style={{gap:8}}><Text style={heading}>ความสำเร็จ {p.achievements.length}/{ACHIEVEMENTS.length}</Text>{ACHIEVEMENTS.map(a=><Text key={a.id} style={[copy,{color:p.achievements.includes(a.id)?palette.moon:palette.textDim}]}>{p.achievements.includes(a.id)?'สำเร็จ · ':'ยังไม่สำเร็จ · '}{a.name}
{a.desc}</Text>)}</RitualSurface>
 <Text style={heading}>ประวัติการเดินทาง</Text>
 {journal.history.filter(r=>r.classId===selected).map(r=><RitualSurface key={r.id} kind="darkCloth" style={{gap:6}}><Text style={heading}>คืน {r.night} · {r.won?'ผ่านคืน':'ไปไม่ถึงเช้า'} · {r.fights}/15 ศึก</Text><Text style={copy}>สำรับ {r.deck.length} ใบ · เล่น {r.metrics.cardsPlayed} ใบ · {r.metrics.turns} เทิร์น · คอมโบ {r.metrics.combos}</Text><GameButton label={detail===r.id?'ซ่อนสำรับ':'ดูสำรับและพร'} onPress={()=>setDetail(detail===r.id?null:r.id)}/>{detail===r.id&&<><Text style={copy}>{r.deck.map(c=>c.name).join(' · ')}</Text><Text style={copy}>พร: {r.blessings.map(b=>b.name).join(' · ')||'ไม่มี'}</Text><Text style={copy}>นำเข้า {r.metrics.added} · นำออก {r.metrics.removed} · ปลุกเสก {r.metrics.upgraded}</Text></>}</RitualSurface>)}
 <GameButton label="กลับ" onPress={onClose}/>
 </ScrollView></Scrim></ImageBackground>;
}
const heading={fontFamily:font.heading,color:palette.moon,fontSize:19};const copy={fontFamily:font.ui,color:palette.text,fontSize:14,lineHeight:23};
