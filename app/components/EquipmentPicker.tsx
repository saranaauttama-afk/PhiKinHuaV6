import React from 'react';
import {Modal,View,ScrollView,Text,Pressable} from 'react-native';
import type {GameState} from '../../src/core/types';
import {validEquipmentSelection} from '../../src/core/cards/equipment';
import {QuietButton,QuietHeader} from './QuietChrome';
import CardRow from './CardRow';
import RitualSurface from './RitualSurface';
import {font,palette,paper} from '../theme';
import {useScreenPadding} from '../useScreenPadding';
export default function EquipmentPicker({state,onConfirm,onCancel}:{state:GameState;onConfirm:(indices:number[])=>void;onCancel:()=>void}){
 const [picks,setPicks]=React.useState<number[]>([]);const pad=useScreenPadding();
 const slots=state.equipmentSlotsMax??1;
 return <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
  <View style={{flex:1,backgroundColor:palette.scrimHeavy,paddingTop:pad.top,paddingBottom:pad.bottom}}>
   <QuietHeader title="เตรียมเครื่องราง" subtitle={`เลือกได้ ${slots} ชิ้น · สวมก่อนจั่วมือแรก · ใบที่สวมจะออกจากกองจั่ว`} onClose={onCancel} closeLabel="ย้อนกลับ"/>
   <Text testID="equipment-selection-count" style={{color:palette.moon,fontFamily:font.ui,textAlign:'center'}}>เลือกแล้ว {picks.length}/{slots} · ไม่เลือกก็เริ่มสู้ได้</Text>
   <ScrollView contentContainerStyle={{padding:16,gap:10}}>
    {state.masterDeck.map((card,i)=>card.type==='equipment'?<Pressable key={i} accessibilityRole="button" accessibilityLabel={`เลือกเครื่องราง ${card.name} ใบที่ ${i+1}`} accessibilityState={{selected:picks.includes(i),disabled:!picks.includes(i)&&picks.length>=slots}} disabled={!picks.includes(i)&&picks.length>=slots} onPress={()=>setPicks(p=>p.includes(i)?p.filter(x=>x!==i):[...p,i])}>
     <RitualSurface kind="occupationPage" style={{padding:22,opacity:picks.length>=slots&&!picks.includes(i)?.5:1}}>
      <Text style={{fontFamily:font.heading,color:paper.red}}>{picks.includes(i)?'✓ สวมก่อนสู้':'แตะเลือกสวม'}</Text><CardRow card={card} plain/>
     </RitualSurface>
    </Pressable>:null)}
   </ScrollView>
   <View style={{paddingHorizontal:16,paddingVertical:8}}><QuietButton testID="equipment-confirm" primary label={`เริ่มต่อสู้ · สวม ${picks.length} ชิ้น`} disabled={!validEquipmentSelection(state,picks)} onPress={()=>onConfirm(picks)}/></View>
  </View>
 </Modal>;
}
