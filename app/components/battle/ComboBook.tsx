import React from 'react';
import {Modal,Pressable,ScrollView,Text,View} from 'react-native';
import type {GameState} from '../../../src/core/types';
import {combosForClass,comboTarget} from '../../../src/core/combat/combos';
import {ALL_CARDS} from '../../../src/core/pack';
import {comboPayoff,comboFeedbackText} from '../../comboPresentation';
import RitualSurface from '../RitualSurface';
import {CardGlyphArt} from '../DeckCard';
import {QuietButton} from '../QuietChrome';
import {font,paper,palette,blessingSealColors} from '../../theme';
export default function ComboBook({state,visible,onClose}:{state:GameState;visible:boolean;onClose:()=>void}) {
 return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
  <View style={{flex:1,backgroundColor:palette.scrimHeavy,padding:20,justifyContent:'center'}}>
   <Pressable accessibilityLabel="ปิดตำราคอมโบ" onPress={onClose} style={{position:'absolute',top:0,left:0,right:0,bottom:0}}/>
   <RitualSurface kind="occupationPage" style={{maxHeight:'88%',padding:24,gap:12}}>
    <Text accessibilityRole="header" style={{fontFamily:font.heading,fontSize:22,color:paper.ink}}>ตำราคอมโบ</Text>
    <ScrollView contentContainerStyle={{gap:22}}>
     {combosForClass(state.classId??'').map(c=>{const p=state.combo?.progress.find(p=>p.comboId===c.id);const done=state.combo?.done.includes(c.id);return <View key={c.id} style={{gap:8}}>
      <Text style={{fontFamily:font.heading,fontSize:18,color:paper.red}}>{c.name} · {done?'สำเร็จแล้ว':`${p?.cardsPlayed.length??0}/${comboTarget(c)}`}</Text>
      <Text style={{fontFamily:font.ui,fontSize:12,lineHeight:21,color:paper.ink}}>{c.ordered?'เล่นตามลำดับ':'เล่นครบชุด ไม่บังคับลำดับ'} · ภายใน {c.maxTurns>=999?'ไฟต์นี้':`${c.maxTurns} เทิร์น`} · เมื่อครบแล้วใช้ได้ครั้งเดียวต่อไฟต์</Text>
      {!!c.requiredCards?.length&&<View style={{flexDirection:'row',gap:5}}>{c.requiredCards.map((id,i)=>{const card=ALL_CARDS.find(x=>x.id===id);const played=done||p?.cardsPlayed.includes(id);return <View key={id} style={{flex:1,alignItems:'center',opacity:played?1:.68}}>
       {card&&<CardGlyphArt card={card} size={48}/>}<Text style={{fontFamily:font.ui,fontSize:11,lineHeight:19,color:paper.ink,textAlign:'center'}}>{i+1}. {card?.name??id}</Text>
       <Text style={{fontFamily:font.heading,fontSize:11,color:played?blessingSealColors.completed:paper.red}}>{played?'✓ เล่นแล้ว':'ยังเหลือ'}</Text>
      </View>;})}</View>}
      {c.requiredTags&&<Text style={{fontFamily:font.ui,color:paper.ink}}>เล่นการ์ดแท็ก {c.requiredTags.join(', ')} ไม่ซ้ำ {comboTarget(c)} ใบ · เล่นแล้ว {p?.cardsPlayed.length??0} ใบ</Text>}
      <Text style={{fontFamily:font.heading,color:paper.ink}}>ผลเมื่อสำเร็จ</Text>
      {c.effects.map((e,i)=><Text key={i} style={{fontFamily:font.ui,color:paper.ink,fontSize:13,lineHeight:22}}>• {comboPayoff(e)}</Text>)}
     </View>;})}
     {!!state.combo?.feedback?.length&&<Text style={{fontFamily:font.ui,color:paper.red,fontSize:12,lineHeight:23}}>จังหวะล่าสุด{'\n'}{state.combo.feedback.slice(-4).map(comboFeedbackText).join('\n')}</Text>}
    </ScrollView><QuietButton label="ปิดตำรา" onPress={onClose}/>
   </RitualSurface>
  </View>
 </Modal>;
}
