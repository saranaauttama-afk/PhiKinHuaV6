import React from 'react';
import {Image,Pressable,ScrollView,Text,View,useWindowDimensions} from 'react-native';
import type {PageOffer} from '../../src/core/map/pages';
import {describeOffer} from './offerDisplay';
import EncounterPortrait from './EncounterPortrait';
import {encounterClue} from './encounterClue';
import InkIcon,{type InkSymbol} from './InkIcon';
import RitualSurface from './RitualSurface';
import {QuietButton} from './QuietChrome';
import {font,palette} from '../theme';

const frame=require('../../assets/ui/encounter-frame-v30.webp');
const kindLabel=(o:PageOffer)=>o.kind==='monster'?'ต่อสู้':o.kind==='boss'?'ศึกใหญ่':o.kind==='story_event'?'สำรวจเรื่องราว':o.kind==='treasure'||o.kind==='treasure_single'?'รับสมบัติ':o.kind==='shop_card'||o.kind==='shop_equipment'?'เข้าร้าน':o.kind==='well'?'ดื่มน้ำ':o.kind==='shop_upgrade'?'ปลุกเสก':o.kind==='shop_remove'?'สละการ์ด':o.kind==='fusion_altar'?'ผสานการ์ด':o.kind==='next_event'?'เดินต่อ':'พักฟื้น';
const pageLabel=(o:PageOffer)=>o.kind==='story_event'?'เรื่องสำคัญ':kindLabel(o);
const iconFor=(o:PageOffer):InkSymbol=>o.kind==='monster'||o.kind==='boss'?'attack':o.kind==='story_event'?'lantern':o.kind==='well'||o.kind==='healing_shrine'?'rest':o.kind==='next_event'?'walk':o.kind==='shop_card'||o.kind==='treasure'||o.kind==='treasure_single'||o.kind==='shop_remove'?'deck':'blessing';
const enterLabel=(o:PageOffer,i:number)=>o.kind==='monster'||o.kind==='boss'?'เผชิญหน้า · '+describeOffer(o,i).name:o.kind==='story_event'?'สำรวจเรื่องราว':kindLabel(o)+' · '+describeOffer(o,i).name;

/** Selection and confirmation are siblings inside a stable frame, not nested buttons. */
export default function AdventureChoices({offers,resolved,slotIds,onEnter,onSkip,skipCount=0}:{offers:PageOffer[];resolved:boolean[];slotIds:(string|null)[];onEnter:(offer:PageOffer,index:number)=>void;onSkip?:()=>void;skipCount?:number}){
 const [selected,setSelected]=React.useState<number|null>(null),[confirmSkip,setConfirmSkip]=React.useState(false);
 const {height,width}=useWindowDimensions();
 const [viewport,setViewport]=React.useState({width,height:height-140});
 const cardWidth=Math.min(175,(viewport.width-40)/3),diameter=cardWidth-18,cardHeight=diameter+178;
 const titleSize=cardWidth<112?13:14;
 const topSpace=Math.min(height*.22,Math.max(8,viewport.height-cardHeight-84));
 React.useEffect(()=>{setSelected(null);setConfirmSkip(false)},[slotIds.join('|')]);
 return <ScrollView testID="adventure-choices" style={{flex:1}} onLayout={e=>{const {width,height}=e.nativeEvent.layout;setViewport(v=>v.width===width&&v.height===height?v:{width,height})}} contentContainerStyle={{paddingHorizontal:12,paddingTop:topSpace,paddingBottom:10,flexGrow:1}}>
  <View testID="adventure-row" style={{flexDirection:'row',gap:8,justifyContent:'center'}}>
   {offers.map((o,i)=>!o||resolved[i]?<View key={'empty-'+i} style={{width:cardWidth}}/>:<View key={slotIds[i]??i} testID={'adventure-frame-'+i} style={{width:cardWidth,height:cardHeight}}>
    <Image accessible={false} source={frame} resizeMode="stretch" style={{position:'absolute',width:cardWidth,height:cardHeight}}/>
    <Image accessible={false} source={frame} tintColor={palette.bloodLit} resizeMode="stretch" style={{position:'absolute',width:cardWidth,height:cardHeight,opacity:selected===i?.28:0}}/>
    <View style={{paddingTop:18,paddingHorizontal:8,alignItems:'center'}}>
     <Pressable testID={'adventure-slot-'+i} accessibilityRole="button" accessibilityLabel={describeOffer(o,i).name+' · '+pageLabel(o)} accessibilityHint="แตะเลือก แล้วใช้ปุ่มในกรอบเพื่อยืนยัน" accessibilityState={{selected:selected===i}} onPress={()=>{setSelected(selected===i?null:i);setConfirmSkip(false)}} style={({pressed})=>({width:'100%',alignItems:'center',opacity:pressed?.8:1})}>
      <Text testID={'adventure-name-'+i} numberOfLines={2} style={{height:42,fontFamily:font.heading,fontSize:titleSize,lineHeight:19,color:palette.moon,textAlign:'center',textAlignVertical:'center'}}>{describeOffer(o,i).name}</Text>
      <EncounterPortrait offer={o} diameter={diameter} index={i} selected={selected===i}/>
      <Text testID={'adventure-clue-'+i} numberOfLines={3} style={{height:52,marginTop:8,fontFamily:font.ui,fontSize:11,lineHeight:16,color:palette.text,textAlign:'center',textAlignVertical:'center'}}>{encounterClue(o)}</Text>
     </Pressable>
     <View testID={'adventure-action-'+i} style={{height:44,width:'100%',marginTop:3,justifyContent:'center'}}>
      {selected===i?<Pressable testID={'adventure-enter-'+i} accessibilityRole="button" accessibilityLabel={enterLabel(o,i)} onPress={()=>{onEnter(o,i);setSelected(null);}} style={({pressed})=>({height:44,justifyContent:'center',alignItems:'center',opacity:pressed?.75:1})}>
       <RitualSurface kind="hudPaper" style={{height:44,width:'100%',padding:4,alignItems:'center',justifyContent:'center'}}><View pointerEvents="none" style={{position:'absolute',top:5,bottom:5,left:3,right:3,backgroundColor:palette.bloodDeep,opacity:.92}}/><Text numberOfLines={2} style={{fontFamily:font.heading,fontSize:12,lineHeight:16,color:palette.text,textAlign:'center'}}>{kindLabel(o)}</Text></RitualSurface>
      </Pressable>:<View pointerEvents="none" style={{alignItems:'center',gap:2}}><InkIcon name={iconFor(o)} color={palette.textDim} size={17}/><Text style={{fontFamily:font.ui,fontSize:10,color:palette.textDim,textAlign:'center'}}>{pageLabel(o)}</Text></View>}
     </View>
    </View>
   </View>)}
  </View>
  <View style={{flex:1,minHeight:20}}/>
  {!!onSkip&&<View style={{gap:6,paddingTop:8}}>
   {confirmSkip?<RitualSurface kind="quietSlate" style={{padding:12,gap:8}}><Text style={{fontFamily:font.ui,fontSize:13,lineHeight:21,color:palette.moon}}>เดินผ่าน {skipCount} หน้า · ผีที่ข้ามจะรอเจอทีหลัง · จุดพักที่เดินผ่านจะเสียไป · เรื่องสำคัญยังอยู่</Text><QuietButton label="ยืนยันไปทางแยกถัดไป" onPress={()=>{onSkip();setConfirmSkip(false)}}/><QuietButton label="เก็บหน้าเหล่านี้ไว้" onPress={()=>setConfirmSkip(false)}/></RitualSurface>:<Pressable accessibilityRole="button" accessibilityLabel="ทางแยกถัดไป" accessibilityState={{disabled:!skipCount}} disabled={!skipCount} onPress={()=>setConfirmSkip(true)} style={({pressed})=>({alignSelf:'center',minHeight:44,paddingHorizontal:20,flexDirection:'row',gap:8,alignItems:'center',opacity:!skipCount?.4:pressed?.75:1})}><InkIcon name="walk" size={20} color={palette.moon}/><Text style={{fontFamily:font.ui,fontSize:12,color:palette.moon}}>ทางแยกถัดไป</Text></Pressable>}
  </View>}
 </ScrollView>;
}
