import React from 'react';
import {Text,View,Modal,Pressable,ScrollView} from 'react-native';
import type {CardData} from '../../src/core/types';
import {canUpgrade,canRemoveCard,upgradeCard} from '../../src/core/engine/shared';
import DeckCard,{CardFace} from './DeckCard';
import RitualSurface from './RitualSurface';
import {QuietButton} from './QuietChrome';
import {cardSummary} from '../cardPresentation';
import {font,palette} from '../theme';
export function upgradeSummary(card:CardData):string {
 const extra=card.trap?.effects.map(e=>`${e.type==='negate'?'ยกเลิก':e.type==='damage'?'โจมตี':'ผลกับดัก'} ${'value' in e?e.value:''}`).join(' · ');
 return `พลัง ${card.cost??0} · ${extra||cardSummary(card)}`;
}
export default function UpgradeCardPicker({cards,selected,onSelect,price,remove=false,onConfirm,disabledConfirm=false}:{cards:CardData[];selected:number|null;onSelect:(i:number|null)=>void;price?:(card:CardData)=>number;remove?:boolean;onConfirm?:(i:number)=>void;disabledConfirm?:boolean}) {
 const card=selected===null?undefined:cards[selected];
 const available=!!card&&(remove?canRemoveCard(card,cards.length):canUpgrade(card));
 return <View style={{gap:16}}>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}>{cards.map((c,i)=><DeckCard key={`${c.id}-${i}`} card={c} selected={selected===i} dim={selected!==null&&selected!==i} onPress={()=>onSelect(i)}/>)}</View>
  <Modal visible={!!card} transparent animationType="fade" onRequestClose={()=>onSelect(null)}><View style={{flex:1,justifyContent:"center",backgroundColor:palette.scrimHeavy,padding:16}}><Pressable accessibilityLabel="ปิดการยืนยันการ์ด" onPress={()=>onSelect(null)} style={{position:"absolute",top:0,left:0,right:0,bottom:0}}/>{card&&<RitualSurface kind="quietSlate" accessibilityViewIsModal style={{padding:18,maxHeight:"88%"}}><ScrollView contentContainerStyle={{gap:10}}>
   <Text accessibilityRole="header" style={{fontFamily:font.heading,color:palette.moon,fontSize:18}}>{remove?'สละการ์ดที่เลือก':'ก่อนและหลังปลุกเสก'}</Text>
   {!remove&&available?<View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Text style={{color:palette.moon,fontFamily:font.ui}}>ก่อน</Text><CardFace card={card}/></View><View style={{flex:1}}><Text style={{color:palette.moon,fontFamily:font.ui}}>หลัง</Text><CardFace card={upgradeCard(card)}/></View></View>:<CardFace card={card}/>}
   <Text style={{fontFamily:font.ui,color:palette.text,fontSize:13,lineHeight:23}}>{!available?(remove?'สละไม่ได้ · การ์ดคุ้มครองหรือใบสุดท้าย':'สุดขั้นแล้ว'):price?`ราคา ${price(card)} เบี้ย`:remove?'ถอดใบนี้จากสำรับ':'ปลุกเสกฟรี 1 ขั้น'}</Text>
   {disabledConfirm&&available&&<Text style={{fontFamily:font.ui,color:palette.bloodLit}}>เบี้ยไม่พอ</Text>}
   {onConfirm&&<QuietButton label={remove?'ยืนยันสละใบนี้':'ยืนยันปลุกเสกใบนี้'} primary disabled={!available||disabledConfirm} onPress={()=>selected!==null&&onConfirm(selected)}/>}
   <QuietButton label="ยกเลิกการเลือก" onPress={()=>onSelect(null)}/>
  </ScrollView></RitualSurface>}</View></Modal>
 </View>;
}
