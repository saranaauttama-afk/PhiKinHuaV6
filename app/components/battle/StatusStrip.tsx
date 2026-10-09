import React from 'react';
import StatusArt from './StatusArt';
import {Modal,Pressable,Text,View,ScrollView} from 'react-native';
import type {StatusEffect} from '../../../src/core/types_extended';
import {sortForDisplay,isDebuff} from '../../../src/core/combat/statusDisplay';
import RitualSurface from '../RitualSurface';
import InkIcon,{type InkSymbol} from '../InkIcon';
import {font,palette,badgeColors} from '../../theme';
export type BattleBadge={id:string;name:string;symbol:string;detail:string;count?:string;bad?:boolean;neutral?:boolean;onPress?:()=>void};
const symbols:Record<string,InkSymbol>={fear:'fear',poison:'poison',curse:'curse',corruption:'corruption',entangle:'entangle',weak:'weakness',weakness:'weakness',vulnerable:'vulnerable',strength:'strength',regeneration:'regeneration',regen:'regeneration',protection:'block',haste:'energy',draw_reduction:'draw_reduction',block_next:'block_next',energy_boost:'energy_boost',spell_charging:'spell_charging',burn:'rest',bleed:'hp'};
const badgeSymbol=(e:BattleBadge)=>(e.symbol in symbols?symbols[e.symbol]:e.id.startsWith('trap:')?'trap':e.id==='rage-rule'?'strength':e.id.startsWith('combo:')||e.id.startsWith('done:')?'combo':e.symbol==='✓'?'check':e.symbol) as InkSymbol;
/** One bounded row; details open above combat without changing HUD height. */
export default function StatusStrip({effects,extra=[],compact=false,align='center'}:{effects?:StatusEffect[];extra?:BattleBadge[];compact?:boolean;align?:'center'|'flex-start'}){
 const [open,setOpen]=React.useState<string|null>(null);
 const list:BattleBadge[]=[...extra,...sortForDisplay(effects??[]).map(e=>({id:`status:${e.id}`,name:e.name,symbol:symbols[e.id]??'curse',bad:isDebuff(e),count:(e.stacks??1)>1?`${e.stacks}`:undefined,detail:`${e.description}\n${(e.stacks??1)>1?`${e.stacks} ชั้น · `:''}${e.duration>=99?'ตลอดการต่อสู้':`เหลือ ${e.duration} เทิร์น`}`}))];
 const selected=list.find(e=>e.id===open);
 if(!list.length)return null;
 return <View style={{width:'100%'}}>
  <ScrollView horizontal showsHorizontalScrollIndicator={list.length>7} style={{height:36}} contentContainerStyle={{gap:4,alignItems:'center',flexGrow:1,justifyContent:'flex-start',paddingHorizontal:2}}>
   {list.map(e=><Pressable key={e.id} accessibilityRole="button" accessibilityLabel={`ดู${e.name}`} accessibilityHint={e.detail} onPress={()=>e.onPress?e.onPress():setOpen(e.id)} style={{width:36,height:36,alignItems:'center',justifyContent:'center'}}>
    <View style={{width:compact?28:30,height:compact?28:30,borderRadius:18,backgroundColor:e.neutral?badgeColors.neutral:e.bad?badgeColors.negative:badgeColors.positive,borderWidth:1,borderColor:e.neutral?badgeColors.neutralLine:e.bad?badgeColors.negativeLine:badgeColors.positiveLine,alignItems:'center',justifyContent:'center'}}><StatusArt name={badgeSymbol(e)} size={26}/></View>
    {!!e.count&&<View style={{position:'absolute',right:0,bottom:0,backgroundColor:badgeColors.counter,borderRadius:8,paddingHorizontal:3}}><Text style={{fontFamily:font.ui,fontSize:9,color:palette.moon}}>{e.count}</Text></View>}
   </Pressable>)}
  </ScrollView>
  <Modal visible={!!selected} transparent animationType="fade" onRequestClose={()=>setOpen(null)}>
   <View style={{flex:1,backgroundColor:palette.scrimHeavy,justifyContent:'center',padding:24}}>
    <Pressable accessibilityLabel="ปิดรายละเอียดสถานะ" onPress={()=>setOpen(null)} style={{position:'absolute',top:0,bottom:0,left:0,right:0}}/>
    <RitualSurface kind="wood" style={{padding:24,gap:14,maxHeight:'75%'}}>
     <View style={{flexDirection:"row",alignItems:"center",gap:12}}><StatusArt name={selected?badgeSymbol(selected):"curse"} size={52}/><Text style={{flex:1,fontFamily:font.heading,fontSize:20,color:palette.moon}}>{selected?.name}</Text></View>
     <ScrollView><Text style={{fontFamily:font.body,fontSize:21,lineHeight:29,color:palette.text}}>{selected?.detail}</Text></ScrollView>
     <Pressable accessibilityRole="button" onPress={()=>setOpen(null)} style={{minHeight:44,alignItems:'center',justifyContent:'center'}}><Text style={{fontFamily:font.heading,color:palette.moon}}>ปิด</Text></Pressable>
    </RitualSurface>
   </View>
  </Modal>
 </View>;
}
