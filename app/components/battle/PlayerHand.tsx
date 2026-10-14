import CardBadges from '../CardBadges';
import DetailPanel from '../DetailPanel';
import {starOf,cardCost,playBlock} from '../../../src/core/cards/model';
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
import type {GameState} from '../../../src/core/types';
import {cardById} from '../../../src/core/pack';
import {useBattleLayout} from './battleLayout';
import {handGeometry} from '../../battleGeometry';
type CardItem={id:string;instanceId?:string;name:string;[key:string]:any};
type Props={state:GameState;enabled?:boolean;cards:CardItem[];playedCardIds:string[];hoveredCardId:string|null;onPlayCard:(card:CardItem,index:number)=>void;onHoverChange:(card:CardItem,isHovered:boolean)=>void};
export default function PlayerHand({state,enabled=true,cards,playedCardIds,hoveredCardId,onPlayCard,onHoverChange}:Props){
 const [selected,setSelected]=React.useState<string|null>(null);const {width,height}=useWindowDimensions();const layout=useBattleLayout();const {cardW,step:cardStep,overflow,padding}=handGeometry(width,cards.length);const {handHeight,cardHeight,handBottom}=layout;
 React.useEffect(()=>{if(!enabled)setSelected(null)},[enabled]);
 React.useEffect(()=>{if(!selected)return;const sub=BackHandler.addEventListener('hardwareBackPress',()=>{setSelected(null);return true});return ()=>sub.remove()},[selected]);
 // Stagger only cards that just arrived, in draw order, so a new card never waits on old ones.
 const seen=React.useRef<Set<string>>(new Set());const arrivals=new Map<string,number>();
 for(const c of cards){const id=c.instanceId??c.id;if(!seen.current.has(id))arrivals.set(id,arrivals.size);}
 React.useEffect(()=>{seen.current=new Set(cards.map(c=>c.instanceId??c.id));});
 const index=cards.findIndex(c=>(c.instanceId??c.id)===selected);const preview=cards[index];const actualCost=(c:CardItem)=>cardCost(state,c as any);const blockOf=(c:CardItem)=>c.id==='qa_phra_prathan'?null:playBlock(state,c as any);const cost=preview?actualCost(preview):{ap:0,mana:0};const blocked=preview?blockOf(preview):null;
 return <View pointerEvents="box-none" style={{position:'absolute',top:0,bottom:0,left:0,right:0,zIndex:layer.control}}>
 {preview&&enabled&&<DetailPanel title={preview.name} art={<CardGlyphArt card={preview as any} size={68}/>} badges={<CardBadges showType card={preview as any} cost={cost} ink={pulpColors.bone}/>} description={[cardSummary(preview as any),preview.flavor].filter(Boolean).join('\n')}
 style={{position:'absolute',bottom:handBottom+handHeight+6,left:12,right:12,zIndex:layer.overlay,maxHeight:height*.4}}
 actions={<View style={{flexDirection:'row',gap:12}}><QuietButton label={blocked??(preview.type==='prayer'?'สวด':'ใช้การ์ด')} primary disabled={!!blocked} onPress={()=>{onPlayCard(preview,index);setSelected(null)}} style={{flex:1}}/><QuietButton label="ปิด" onPress={()=>enabled&&setSelected(null)} style={{flex:1}}/></View>}/>}

 <View testID="battle-hand" style={{position:'absolute',bottom:handBottom,left:0,right:0,height:handHeight}}>

 <ScrollView horizontal scrollEnabled={overflow} removeClippedSubviews={false} showsHorizontalScrollIndicator={overflow} style={{height:handHeight}} contentContainerStyle={{paddingHorizontal:padding,paddingTop:20,paddingBottom:8,gap:0,alignItems:'flex-end'}}>
 {cards.map((c,i)=>{const id=c.instanceId??c.id;const now=actualCost(c);const tilt=overflow?0:(i-(cards.length-1)/2)*1.4;return <View key={id} style={{marginRight:i===cards.length-1?0:cardStep-cardW,transform:[{translateY:selected===id?-12:Math.abs(tilt)},{rotate:selected===id?'0deg':`${tilt}deg`}],zIndex:selected===id?layer.overlay:i}}><Card card={c as any} width={cardW} height={cardHeight} selected={selected===id} onPress={()=>enabled&&setSelected(selected===id?null:id)} onDragPlay={()=>{if(enabled)onPlayCard(c,i);setSelected(null)}} onHoverChange={v=>onHoverChange(c,v)} isPlayed={playedCardIds.includes(id)} disabled={!enabled||!!blockOf(c)} animationDelay={(arrivals.get(id)??0)*110} costNow={now}/></View>})}
 </ScrollView></View></View>;
}
