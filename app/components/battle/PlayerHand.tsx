import CardBadges from '../CardBadges';
import {upgradeLevelOf} from '../../../src/core/engine/shared';
import {pulpColors} from '../../theme';
import React from 'react';
import {View,Text,ScrollView,useWindowDimensions,ImageBackground,BackHandler} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Card from '../Card';
import { CardGlyphArt } from '../DeckCard';
import {paper} from '../Paper';
import RitualSurface from '../RitualSurface';
import {QuietButton} from '../QuietChrome';
import {font,layer} from '../../theme';
import {cardSummary} from '../../cardPresentation';
import {costWithRule,effectiveCost} from '../../../src/core/cards/mechanics';
import type {GameState} from '../../../src/core/types';
import {canPlayAttackCards} from '../../../src/core/statusEffectsRuntime';
import {combosForClass} from '../../../src/core/combat/combos';
import {cardById} from '../../../src/core/pack';
type CardItem={id:string;instanceId?:string;name:string;[key:string]:any};
type Props={state?:GameState;enabled?:boolean;cards:CardItem[];playedCardIds:string[];hoveredCardId:string|null;energy:number;cardsPlayedThisTurn?:number;onPlayCard:(card:CardItem,index:number)=>void;onHoverChange:(card:CardItem,isHovered:boolean)=>void};
export default function PlayerHand({state,enabled=true,cards,playedCardIds,hoveredCardId,energy,cardsPlayedThisTurn=0,onPlayCard,onHoverChange}:Props){
 const [selected,setSelected]=React.useState<string|null>(null);const {width,height}=useWindowDimensions();const pad=useSafeAreaInsets();const short=height<700;const cardW=Math.min(122,Math.max(100,width*.29));const cardStep=Math.round(cardW*.86);const handHeight=short?148:178;const cardHeight=short?134:160;const handBottom=118;
 React.useEffect(()=>{if(!enabled)setSelected(null)},[enabled]);
 React.useEffect(()=>{if(!selected)return;const sub=BackHandler.addEventListener('hardwareBackPress',()=>{setSelected(null);return true});return ()=>sub.remove()},[selected]);
 const index=cards.findIndex(c=>(c.instanceId??c.id)===selected);const preview=cards[index];const actualCost=(c:CardItem)=>state?effectiveCost(state,c as any):costWithRule(c as any,cardsPlayedThisTurn);const cost=preview?actualCost(preview):0;const cannotPlay=preview?.type==='curse'||!!(state&&preview?.type==='attack'&&!canPlayAttackCards(state));const overflow=cardW+cardStep*Math.max(0,cards.length-1)+32>width;
 return <View pointerEvents="box-none" style={{position:'absolute',top:0,bottom:0,left:0,right:0,zIndex:layer.control}}>
 {preview&&enabled&&<RitualSurface kind="quietSlate" style={{position:'absolute',bottom:pad.bottom+handBottom+handHeight+6,left:12,right:12,padding:18,gap:8,zIndex:layer.overlay,maxHeight:height*.4}}>
 <View style={{flexDirection:'row',gap:12}}><CardGlyphArt card={preview as any} size={68}/><View style={{flex:1}}><Text style={{fontFamily:font.heading,color:pulpColors.bone,fontSize:17}}>{preview.name}</Text><CardBadges card={preview as any} cost={cost} ink={pulpColors.bone}/>{upgradeLevelOf(preview as any)>0&&<Text style={{fontFamily:font.ui,color:pulpColors.bone,fontSize:12}}>ปลุกเสกขั้น {upgradeLevelOf(preview as any)}</Text>}<ScrollView style={{maxHeight:height*.18}}><Text style={{fontFamily:font.body,color:pulpColors.bone,fontSize:20,lineHeight:25}}>{cardSummary(preview as any)}{!preview.upgraded&&preview.desc?`\n${preview.desc}`:null}</Text></ScrollView></View></View>
 {state&&preview&&combosForClass(state.classId??'shaman').filter(c=>c.ordered&&c.requiredCards?.includes(preview.id)&&!state.combo?.done.includes(c.id)).map(c=><Text key={c.id} style={{fontFamily:font.ui,color:pulpColors.bone,fontSize:12,lineHeight:18}}>{c.name}: {c.requiredCards?.map(id=>cardById(id)?.name??id).join(' → ')} · เทิร์นเดียว · ครั้งเดียวต่อไฟต์</Text>)}
 <View style={{flexDirection:'row',gap:12}}><QuietButton label={cannotPlay?'เล่นไม่ได้ในตอนนี้':cost>energy?'พลังไม่พอ':'ใช้การ์ด'} primary disabled={cannotPlay||cost>energy} onPress={()=>{onPlayCard(preview,index);setSelected(null)}} style={{flex:1}}/><QuietButton label="ปิด" onPress={()=>enabled&&setSelected(null)} style={{flex:1}}/></View></RitualSurface>}

 <View style={{position:'absolute',bottom:pad.bottom+handBottom,left:0,right:0,height:handHeight}}>

 <ScrollView horizontal removeClippedSubviews={false} showsHorizontalScrollIndicator={overflow} style={{height:handHeight}} contentContainerStyle={{paddingHorizontal:16,paddingTop:14,paddingBottom:3,gap:0,alignItems:'flex-end'}}>
 {cards.map((c,i)=>{const id=c.instanceId??c.id;const now=actualCost(c);return <View key={id} style={{marginRight:i===cards.length-1?0:cardStep-cardW,transform:[{translateY:selected===id?-12:0}],zIndex:selected===id?999:i}}><Card card={c as any} width={cardW} height={cardHeight} selected={selected===id} onPress={()=>enabled&&setSelected(selected===id?null:id)} onDragPlay={()=>{onPlayCard(c,i);setSelected(null)}} onHoverChange={v=>onHoverChange(c,v)} isPlayed={playedCardIds.includes(id)} disabled={!enabled||c.type==='curse'||now>energy||!!(state&&c.type==='attack'&&!canPlayAttackCards(state))} animationDelay={i*55} costNow={now}/></View>})}
 </ScrollView></View></View>;
}
