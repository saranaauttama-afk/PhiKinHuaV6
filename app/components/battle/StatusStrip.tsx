import React from 'react';
import StatusArt from './StatusArt';
import {CARD_ART_SOURCES} from '../../cardArt';
import {Image,Modal,Pressable,Text,View,ScrollView} from 'react-native';
import type {StatusEffect} from '../../../src/core/types_extended';
import {sortForDisplay,isDebuff} from '../../../src/core/combat/statusDisplay';
import RitualSurface from '../RitualSurface';
import DetailPanel from '../DetailPanel';
import {QuietButton} from '../QuietChrome';
import InkIcon,{type InkSymbol} from '../InkIcon';
import {font,palette,badgeColors,paper} from '../../theme';
import BattleSeal,{BATTLE_SEAL_ART_SIZE} from './BattleSeal';
export type BattleBadge={id:string;name:string;symbol:string;detail:string;count?:string;bad?:boolean;neutral?:boolean;cardId?:string;onPress?:()=>void};
const symbols:Record<string,InkSymbol>={thorns:'thorns',dodge:'dodge',fear:'fear',poison:'poison',curse:'curse',corruption:'corruption',entangle:'entangle',weak:'weakness',weakness:'weakness',vulnerable:'vulnerable',strength:'strength',rage:'strength',regeneration:'regeneration',regen:'regeneration',protection:'block',haste:'energy',draw_reduction:'draw_reduction',block_next:'block_next',energy_boost:'energy_boost',spell_charging:'spell_charging',burn:'rest',bleed:'hp',bruise:'vulnerable',stun:'fear',rhythm:'energy',round:'rest',minion:'attack'};
const badgeSymbol=(e:BattleBadge)=>(e.symbol in symbols?symbols[e.symbol]:e.id.startsWith('trap:')?'trap':e.id==='rage-rule'?'strength':e.symbol==='✓'?'check':e.symbol) as InkSymbol;
/** One bounded row; details open above combat without changing HUD height. */
export default function StatusStrip({effects,extra=[],compact=false,align='center'}:{effects?:StatusEffect[];extra?:BattleBadge[];compact?:boolean;align?:'center'|'flex-start'}){
 const [open,setOpen]=React.useState<string|null>(null);
 const [viewportWidth,setViewportWidth]=React.useState(0),[contentWidth,setContentWidth]=React.useState(0);
 const list:BattleBadge[]=[...extra,...sortForDisplay(effects??[]).map(e=>({id:`status:${e.id}`,name:e.name,symbol:symbols[e.id]??'curse',bad:isDebuff(e),count:(e.stacks??1)>1?`${e.stacks}`:undefined,detail:`${e.description}\n${(e.stacks??1)>1?`${e.stacks} ชั้น · `:''}${e.duration>=99?'ตลอดการต่อสู้':`เหลือ ${e.duration} เทิร์น`}`}))];
 const selected=list.find(e=>e.id===open);
 if(!list.length)return null;
 return <View testID="status-strip" style={{width:'100%',minWidth:0,overflow:'hidden'}}>
  <ScrollView testID="status-scroll" horizontal showsHorizontalScrollIndicator={contentWidth>viewportWidth+1} onLayout={e=>setViewportWidth(e.nativeEvent.layout.width)} onContentSizeChange={w=>setContentWidth(w)} style={{height:36,width:'100%'}} contentContainerStyle={{gap:4,alignItems:'center',flexGrow:1,justifyContent:'flex-start',paddingHorizontal:2}}>
   {list.map(e=><BattleSeal key={e.id} testID={`battle-badge-${e.id}`} label={`ดู${e.name}`} hint={e.detail} onPress={()=>e.onPress?e.onPress():setOpen(e.id)} hitSize={36} tone={e.neutral?'neutral':e.bad?'negative':'positive'} count={e.count}>
    {e.cardId&&CARD_ART_SOURCES[e.cardId]?<Image accessible={false} source={CARD_ART_SOURCES[e.cardId]} resizeMode="contain" style={{width:BATTLE_SEAL_ART_SIZE,height:BATTLE_SEAL_ART_SIZE}}/>:<StatusArt name={badgeSymbol(e)} size={BATTLE_SEAL_ART_SIZE}/>}
   </BattleSeal>)}
  </ScrollView>
  <Modal visible={!!selected} transparent animationType="fade" onRequestClose={()=>setOpen(null)}>
   <View style={{flex:1,backgroundColor:palette.scrimHeavy,justifyContent:'center',padding:24}}>
    <Pressable accessibilityLabel="ปิดรายละเอียดสถานะ" onPress={()=>setOpen(null)} style={{position:'absolute',top:0,bottom:0,left:0,right:0}}/>
    <DetailPanel testID="status-detail-paper" title={selected?.name??''} art={<StatusArt name={selected?badgeSymbol(selected):'curse'} size={52}/>} description={selected?.detail}
     actions={<QuietButton testID="status-detail-close" label="ปิด" onPress={()=>setOpen(null)}/>}/>

   </View>
  </Modal>
 </View>;
}
