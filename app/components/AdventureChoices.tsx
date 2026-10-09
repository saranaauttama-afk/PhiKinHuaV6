import React from 'react';
import {Image,Pressable,ScrollView,Text,View,useWindowDimensions} from 'react-native';
import type {PageOffer} from '../../src/core/map/pages';
import {describeOffer} from './offerDisplay';
import GhostArt from './GhostArt';
import {artSource} from './Art';
import {RITUAL_OBJECTS} from './RitualObject';
import CandleSelection from './CandleSelection';
import RitualSurface from './RitualSurface';
import {QuietButton} from './QuietChrome';
import {font,palette} from '../theme';
function source(o:PageOffer){
 if(o.kind==='monster'||o.kind==='boss')return artSource(`monster/${o.enemyId}`);
 if(o.kind==='shop_upgrade')return RITUAL_OBJECTS.upgrade;
 if(o.kind==='shop_remove')return RITUAL_OBJECTS.remove;
 if(o.kind==='shop_card'||o.kind==='treasure'||o.kind==='treasure_single')return RITUAL_OBJECTS.shop;
 if(o.kind==='well'||o.kind==='healing_shrine')return require('../../assets/ui/blessing-shrine-object.png');
 if(o.kind==='shop_equipment')return require('../../assets/ui/blessing-amulet.png');
 if(o.kind==='fusion_altar')return require('../../assets/ui/ritual-knife.png');
 return require('../../assets/ui/trail-rest.png');
}
const kindLabel=(o:PageOffer)=>o.kind==='monster'?'ต่อสู้':o.kind==='boss'?'ศึกใหญ่':o.kind==='story_event'?'เรื่องสำคัญ':'แวะพัก';
/** Each independent page owns its type and action, including mixed ghost/shop boards. */
export default function AdventureChoices({offers,resolved,slotIds,onEnter,onSkip,skipCount=0}:{offers:PageOffer[];resolved:boolean[];slotIds:(string|null)[];onEnter:(offer:PageOffer,index:number)=>void;onSkip?:()=>void;skipCount?:number}){
 const [selected,setSelected]=React.useState<number|null>(null),[confirmSkip,setConfirmSkip]=React.useState(false);
 const {height,width}=useWindowDimensions();
 const artHeight=height<700?194:254,slotWidth=(width-40)/3;
 React.useEffect(()=>{setSelected(null);setConfirmSkip(false)},[slotIds.join('|')]);
 const picked=selected===null?undefined:offers[selected];
 return <ScrollView style={{flex:1}} contentContainerStyle={{paddingHorizontal:12,paddingVertical:8,gap:10,flexGrow:1,justifyContent:'center'}}>
  <View style={{flexDirection:'row',gap:8,justifyContent:'center'}}>
   {offers.map((o,i)=>!o||resolved[i]?<View key={`empty-${i}`} style={{flex:1}}/>:<Pressable key={slotIds[i]??i} testID={`adventure-slot-${i}`} accessibilityRole="button" accessibilityLabel={`${describeOffer(o,i).name} · ${kindLabel(o)}`} accessibilityState={{selected:selected===i}} onPress={()=>{setSelected(selected===i?null:i);setConfirmSkip(false)}} style={{flex:1,maxWidth:230}}>
    <CandleSelection selected={selected===i} dim={selected!==null&&selected!==i}><View style={{height:artHeight+96,paddingHorizontal:4,paddingVertical:10,gap:4,alignItems:'center'}}>
     <View testID={`adventure-art-${i}`} style={{height:artHeight,alignItems:'center',justifyContent:'flex-end'}}>
      {o.kind==='monster'||o.kind==='boss'?<GhostArt id={o.enemyId} width={slotWidth} height={artHeight}/>:<Image testID={`adventure-prop-${i}`} accessible={false} source={source(o)} resizeMode="contain" style={{width:slotWidth*.80,height:artHeight*.42}}/>}
     </View>
     <Text style={{height:48,fontFamily:font.heading,fontSize:14,lineHeight:22,color:palette.moon,textAlign:'center'}}>{describeOffer(o,i).name}</Text>
     <Text style={{fontFamily:font.ui,fontSize:11,color:palette.text,textAlign:'center'}}>{kindLabel(o)}</Text>
    </View></CandleSelection>
   </Pressable>)}
  </View>
  <View style={{minHeight:66,gap:5,justifyContent:'center'}}>
   {picked?<QuietButton label={picked.kind==='monster'||picked.kind==='boss'?`เผชิญหน้า · ${describeOffer(picked,selected!).name}`:picked.kind==='story_event'?'สำรวจเรื่องราว':`แวะ · ${describeOffer(picked,selected!).name}`} primary onPress={()=>{onEnter(picked,selected!);setSelected(null);}}/>:<Text style={{color:palette.textDim,fontFamily:font.ui,fontSize:12,textAlign:'center'}}>เลือกหนึ่งหน้า · หน้าอื่นยังรออยู่</Text>}
  </View>
  {!!onSkip&&<View style={{gap:6}}>
   {confirmSkip?<RitualSurface kind="quietSlate" style={{padding:12,gap:8}}><Text style={{fontFamily:font.ui,fontSize:13,lineHeight:21,color:palette.moon}}>เดินผ่าน {skipCount} หน้า · ผีที่ข้ามจะรอเจอทีหลัง · จุดพักที่เดินผ่านจะเสียไป · เรื่องสำคัญยังอยู่</Text><QuietButton label="ยืนยันไปทางแยกถัดไป" onPress={()=>{onSkip();setConfirmSkip(false)}}/><QuietButton label="เก็บหน้าเหล่านี้ไว้" onPress={()=>setConfirmSkip(false)}/></RitualSurface>:<QuietButton label="ทางแยกถัดไป" disabled={!skipCount} onPress={()=>setConfirmSkip(true)}/>}
  </View>}
 </ScrollView>;
}
