import React from 'react';
import {View,Text,Modal} from 'react-native';
import QuietPlayerHud,{HudStat} from '../QuietPlayerHud';
import SealPotButton from './SealPotButton';
import RitualSurface from '../RitualSurface';
import {QuietButton} from '../QuietChrome';
import {font,palette} from '../../theme';
type Props={blessings?:React.ReactNode;helpers?:React.ReactNode;statuses?:React.ReactNode;hp:number;maxHp:number;ap:number;maxAp:number;mana:number;block:number;drawCount:number;discardCount?:number;classId?:string;handCount?:number;handMax?:number;retain?:number;drawPerTurn?:number;opening?:number;onEndTurn:()=>void;onOpenPiles?:()=>void;isEnemyTurn?:boolean;hudFlashKey?:number};
export default function PlayerHUD(p:Props){
 const [details,setDetails]=React.useState(false);return <>
 <QuietPlayerHud compact classId={p.classId} hp={p.hp} maxHp={p.maxHp}
 stats={<><HudStat icon="energy" text={`${p.ap}/${p.maxAp}`} label="แต้มต่อเทิร์น" onPress={()=>setDetails(true)}/><HudStat icon="spell_charging" text={`${p.mana}`} label="มานา" onPress={()=>setDetails(true)}/><HudStat icon="block" text={`${p.block}`} label="เกราะ" onPress={()=>setDetails(true)}/><HudStat icon="hand" text={`${p.handCount??0}/${p.retain??2}`} label={`ในมือ ${p.handCount??0} · มือสูงสุดท้ายเทิร์น ${p.retain??2}`} onPress={()=>setDetails(true)}/></>}
 action={<SealPotButton disabled={p.isEnemyTurn} onPress={p.onEndTurn}/>}
 blessings={p.blessings}
 extras={<View style={{flexDirection:'row',alignItems:'center',gap:4}}><View style={{flex:2,minWidth:0}}>{p.helpers}</View><View style={{flex:2,minWidth:0}}>{p.statuses}</View></View>}/>
 <Modal visible={details} transparent animationType="fade" onRequestClose={()=>setDetails(false)}>
  <View style={{flex:1,justifyContent:'center',padding:20,backgroundColor:palette.scrimHeavy}}><RitualSurface kind="quietSlate" style={{padding:20,gap:10}}>
   <Text style={{fontFamily:font.heading,color:palette.moon,fontSize:20}}>ค่าต่อสู้ของเรา</Text>
   {[`แต้ม ${p.ap}/${p.maxAp} · มานา ${p.mana} · เกราะ ${p.block}`,`ในมือ ${p.handCount??0} ใบ · มือสูงสุดท้ายเทิร์น ${p.retain??2} ใบ`,`จั่วต่อเทิร์น ${p.drawPerTurn??2} ใบ · เปิดศึก ${p.opening??2} ใบ`,`ถือระหว่างเล่นได้ไม่เกิน ${p.handMax??10} ใบ`,`กองจั่ว ${p.drawCount} ใบ · กองทิ้ง ${p.discardCount??0} ใบ`].map(t=><Text key={t} style={{fontFamily:font.ui,color:palette.text,fontSize:14,lineHeight:23}}>{t}</Text>)}
   <QuietButton label="ดูกองจั่ว / กองทิ้ง" onPress={()=>{setDetails(false);p.onOpenPiles?.();}}/><QuietButton label="ปิด" onPress={()=>setDetails(false)}/>
  </RitualSurface></View>
 </Modal></>;
}
