import React from 'react';
import {Animated,Easing,Image,Pressable,ScrollView,Text,View,useWindowDimensions} from 'react-native';
import type {PageOffer} from '../../src/core/map/pages';
import {describeOffer,ghostTierLabel} from './offerDisplay';
import EncounterPortrait from './EncounterPortrait';
import {encounterClue} from './encounterClue';
import InkIcon,{type InkSymbol} from './InkIcon';
import RitualSurface from './RitualSurface';
import {QuietButton} from './QuietChrome';
import CloseSeal from './CloseSeal';
import {layer,font,palette} from '../theme';

import {useGameSettings} from './Settings';
import {SceneContentVisible} from './SceneArrival';
const frame=require('../../assets/ui/encounter-frame-v30.webp');
const kindLabel=(o:PageOffer)=>o.kind==='monster'?'ต่อสู้':o.kind==='boss'?'ศึกใหญ่':o.kind==='story_event'?'สำรวจเรื่องราว':o.kind==='treasure'||o.kind==='treasure_single'?'รับสมบัติ':o.kind==='shop_card'||o.kind==='shop_equipment'?'เข้าร้าน':o.kind==='well'?'ดื่มน้ำ':o.kind==='shop_upgrade'?'ปลุกเสก':o.kind==='shop_remove'?'สละการ์ด':o.kind==='next_event'?'เดินต่อ':'พักฟื้น';
const pageLabel=(o:PageOffer)=>o.kind==='story_event'?'เรื่องสำคัญ':kindLabel(o);
const iconFor=(o:PageOffer):InkSymbol=>o.kind==='monster'||o.kind==='boss'?'attack':o.kind==='story_event'?'lantern':o.kind==='well'||o.kind==='healing_shrine'?'rest':o.kind==='next_event'?'walk':o.kind==='shop_card'||o.kind==='treasure'||o.kind==='treasure_single'||o.kind==='shop_remove'?'deck':'blessing';
const enterLabel=(o:PageOffer,i:number)=>o.kind==='monster'||o.kind==='boss'?'เผชิญหน้า · '+describeOffer(o,i).name:o.kind==='story_event'?'สำรวจเรื่องราว':kindLabel(o)+' · '+describeOffer(o,i).name;

/** Selection and confirmation are siblings inside a stable frame, not nested buttons. */
export default function AdventureChoices({offers,resolved,slotIds,onEnter,skipCount=0,onDestroy,usedIds=[],appearanceKey='',runKey='',depth}:{runKey?:string;depth?:number;offers:PageOffer[];resolved:boolean[];slotIds:(string|null)[];onEnter:(offer:PageOffer,index:number)=>void;skipCount?:number;onDestroy?:(index:number)=>void;usedIds?:string[];appearanceKey?:string}){
 const reduced=useGameSettings(s=>s.reducedMotion);
 const [selected,setSelected]=React.useState<number|null>(null);
 const {height,width}=useWindowDimensions();
 const [viewport,setViewport]=React.useState({width,height:height-140});
 const cardWidth=Math.min(175,(viewport.width-40)/3),diameter=cardWidth-18,cardHeight=diameter+178;
 const titleSize=cardWidth<112?13:14;
 const topSpace=Math.min(height*.22,Math.max(8,viewport.height-cardHeight-84));
 React.useEffect(()=>{setSelected(null)},[slotIds.join('|')]);
 return <ScrollView testID="adventure-choices" style={{flex:1}} onLayout={e=>{const {width,height}=e.nativeEvent.layout;setViewport(v=>v.width===width&&v.height===height?v:{width,height})}} contentContainerStyle={{paddingHorizontal:12,paddingTop:topSpace,paddingBottom:10,flexGrow:1}}>
  <View testID="adventure-row" style={{flexDirection:'row',gap:8,justifyContent:'center'}}>
   {offers.map((o,i)=>!o||resolved[i]?<View key={'empty-'+i} style={{width:cardWidth}}/>:<PageFade key={slotIds[i]??i} pageId={slotIds[i]?`${runKey}|${slotIds[i]}`:undefined} appearanceKey={appearanceKey} delay={i*80} reduced={reduced} testID={'adventure-frame-'+i} style={{width:cardWidth,height:cardHeight}}>
    <Image accessible={false} source={frame} resizeMode="stretch" style={{position:'absolute',width:cardWidth,height:cardHeight}}/>
    <Image accessible={false} source={frame} tintColor={palette.bloodLit} resizeMode="stretch" style={{position:'absolute',width:cardWidth,height:cardHeight,opacity:selected===i?.28:0}}/>
    {selected===i&&!!onDestroy&&(depth??0)>=(o.availableAfterWins??0)&&o.kind!=='monster'&&o.kind!=='boss'&&o.kind!=='story_event'&&o.kind!=='next_event'&&<View style={{position:'absolute',top:-4,right:-4,zIndex:layer.control}}><CloseSeal testID={'adventure-destroy-'+i} label={'ทำลายเพจ '+describeOffer(o,i).name} onPress={()=>{onDestroy(i);setSelected(null)}}/></View>}
    <View style={{paddingTop:18,paddingHorizontal:8,alignItems:'center'}}>
     <Pressable testID={'adventure-slot-'+i} accessibilityRole="button" accessibilityLabel={describeOffer(o,i).name+' · '+(ghostTierLabel(o,depth)??pageLabel(o))} accessibilityHint="แตะเลือก แล้วใช้ปุ่มในกรอบเพื่อยืนยัน" accessibilityState={{selected:selected===i}} onPress={()=>{setSelected(selected===i?null:i)}} style={({pressed})=>({width:'100%',alignItems:'center',opacity:pressed?.8:1})}>
      {ghostTierLabel(o,depth)?<View style={{height:42,justifyContent:'center',alignItems:'center'}}>
       <Text testID={'adventure-name-'+i} numberOfLines={1} adjustsFontSizeToFit style={{fontFamily:font.heading,fontSize:titleSize,lineHeight:19,color:palette.moon,textAlign:'center'}}>{describeOffer(o,i).name}</Text>
       <Text testID={'adventure-tier-'+i} numberOfLines={1} style={{fontFamily:font.ui,fontSize:11,lineHeight:15,color:o.kind==='boss'||(o.kind==='monster'&&o.tier==='elite')?palette.bloodLit:palette.moonDim,textAlign:'center'}}>{ghostTierLabel(o,depth)}</Text>
      </View>:<Text testID={'adventure-name-'+i} numberOfLines={2} style={{height:42,fontFamily:font.heading,fontSize:titleSize,lineHeight:19,color:palette.moon,textAlign:'center',textAlignVertical:'center'}}>{describeOffer(o,i).name}</Text>}
      <EncounterPortrait offer={o} diameter={diameter} index={i} selected={selected===i}/>
      <Text testID={'adventure-clue-'+i} numberOfLines={3} style={{height:52,marginTop:8,fontFamily:font.ui,fontSize:11,lineHeight:16,color:palette.text,textAlign:'center',textAlignVertical:'center'}}>{(depth??0)<(o.availableAfterWins??0)?`เปิดหลังปราบผี ${o.availableAfterWins} ตัวในคืนนี้`:usedIds.includes(slotIds[i]??'')?'ใช้แล้ว · กลับเข้าได้\nปิดเพจด้วยกากบาทเมื่อพร้อม':encounterClue(o)}</Text>
     </Pressable>
     <View testID={'adventure-action-'+i} style={{height:44,width:'100%',marginTop:3,justifyContent:'center'}}>
      {selected===i?<Pressable testID={'adventure-enter-'+i} accessibilityRole="button" accessibilityLabel={enterLabel(o,i)} accessibilityState={{disabled:(depth??0)<(o.availableAfterWins??0)}} disabled={(depth??0)<(o.availableAfterWins??0)} onPress={()=>{onEnter(o,i);setSelected(null);}} style={({pressed})=>({height:44,justifyContent:'center',alignItems:'center',opacity:pressed?.75:1})}>
       <RitualSurface kind="hudPaper" style={{height:44,width:'100%',padding:4,alignItems:'center',justifyContent:'center'}}><View pointerEvents="none" style={{flexDirection:'row',alignItems:'center',gap:4}}><InkIcon name={iconFor(o)} size={18} color={palette.ink}/><Text numberOfLines={2} style={{fontFamily:font.heading,fontSize:13,lineHeight:17,color:palette.ink,textAlign:'center'}}>{(depth??0)<(o.availableAfterWins??0)?'ยังไม่เปิด':kindLabel(o)}</Text></View></RitualSurface>
      </Pressable>:<View pointerEvents="none" style={{alignItems:'center',gap:2}}><InkIcon name={iconFor(o)} color={palette.textDim} size={17}/><Text style={{fontFamily:font.ui,fontSize:10,color:palette.textDim,textAlign:'center'}}>{pageLabel(o)}</Text></View>}
     </View>
    </View>
   </PageFade>)}
  </View>
  <View style={{flex:1,minHeight:20}}/>
 </ScrollView>;
}

/**
 * Pages that already played their reveal. Coming back from a fight or closing the bag remounts the
 * board; surviving pages must stay put and only a newly dealt page fades in (phase7 mobile check).
 * Keyed by adventure slot id, which is unique per page within a run.
 */
const revealedPages=new Set<string>();
function PageFade({pageId,appearanceKey,delay,reduced,children,...props}:{pageId?:string;appearanceKey:string;delay:number;reduced:boolean;children:React.ReactNode;style:any;testID:string}){
 const visible=React.useContext(SceneContentVisible);
 const seen=!!pageId&&revealedPages.has(pageId);
 const still=reduced||seen;
 const [ready,setReady]=React.useState(still);
 const progress=React.useRef(new Animated.Value(still?1:0)).current;
 React.useEffect(()=>{
  let active=true;
  const shown=reduced||(!!pageId&&revealedPages.has(pageId));
  setReady(shown);
  progress.stopAnimation();progress.setValue(shown?1:0);
  if(shown||!visible)return ()=>{active=false};
  if(pageId)revealedPages.add(pageId);
  const a=Animated.timing(progress,{toValue:1,duration:620,delay,easing:Easing.out(Easing.quad),useNativeDriver:true});
  a.start(({finished})=>{if(active&&finished)setReady(true)});return ()=>{active=false;a.stop();};
 },[appearanceKey,reduced,visible,delay]);
 const opacity=progress;
 const translateY=progress.interpolate({inputRange:[0,1],outputRange:[12,0]});
 const scale=progress.interpolate({inputRange:[0,1],outputRange:[.94,1]});
 return <Animated.View {...props} pointerEvents={ready?'auto':'none'} accessibilityElementsHidden={!ready} importantForAccessibility={ready?'auto':'no-hide-descendants'} style={[props.style,{opacity,transform:[{translateY},{scale}]}]}>
  <Animated.View testID={props.testID.replace('adventure-frame-','adventure-glow-')} pointerEvents="none" style={{position:'absolute',left:'-10%',top:'-7%',width:'120%',height:'114%',opacity:progress.interpolate({inputRange:[0,.25,.65,1],outputRange:[0,.38,.12,0]})}}><Image accessible={false} source={require('../../assets/ui/candle-selection.webp')} resizeMode="stretch" style={{width:'100%',height:'100%'}}/></Animated.View>
  {children}
 </Animated.View>;
}
