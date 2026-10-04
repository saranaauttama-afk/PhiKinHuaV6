import {pulpColors} from '../../theme';
import React from 'react';
import {View,Text,ScrollView,useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Card from '../Card';
import {paper} from '../Paper';
import RitualSurface from '../RitualSurface';
import {GameButton} from '../Panel';
import {font,layer} from '../../theme';
import {costWithRule} from '../../../src/core/cards/mechanics';
type CardItem={id:string;instanceId?:string;name:string;[key:string]:any};
type Props={cards:CardItem[];playedCardIds:string[];hoveredCardId:string|null;energy:number;cardsPlayedThisTurn?:number;onPlayCard:(card:CardItem,index:number)=>void;onHoverChange:(card:CardItem,isHovered:boolean)=>void};
export default function PlayerHand({cards,playedCardIds,hoveredCardId,energy,cardsPlayedThisTurn=0,onPlayCard,onHoverChange}:Props){
 const [selected,setSelected]=React.useState<string|null>(null);const {width}=useWindowDimensions();const pad=useSafeAreaInsets();const cardW=Math.min(110,Math.max(72,(width-32-Math.min(cards.length-1,4)*6)/Math.min(Math.max(cards.length,1),5)));
 const index=cards.findIndex(c=>(c.instanceId??c.id)===selected);const preview=cards[index];const cost=preview?costWithRule(preview as any,cardsPlayedThisTurn):0;const cannotPlay=preview?.type==='curse';const overflow=cardW*cards.length+6*Math.max(0,cards.length-1)+32>width;
 return <View pointerEvents="box-none" style={{position:'absolute',top:0,bottom:0,left:0,right:0,zIndex:layer.control}}>
 {preview&&<RitualSurface kind="cloth" style={{position:'absolute',bottom:pad.bottom+365,left:18,right:18,padding:16,gap:10,zIndex:layer.overlay}}><Text style={{fontFamily:font.heading,color:paper.ink,fontSize:18}}>{preview.name} · พลัง {cost}</Text><Text style={{fontFamily:font.body,color:paper.ink,fontSize:25,lineHeight:28}}>{preview.desc}</Text><View style={{flexDirection:'row',gap:12}}><GameButton label={cannotPlay?'คำสาป · เล่นไม่ได้':cost>energy?'พลังไม่พอ':'ใช้การ์ด'} tone="primary" disabled={cannotPlay||cost>energy} onPress={()=>{onPlayCard(preview,index);setSelected(null)}} style={{flex:1}}/><GameButton label="ปิด" onPress={()=>setSelected(null)} style={{flex:1}}/></View></RitualSurface>}
 <View style={{position:'absolute',bottom:pad.bottom+178,left:0,right:0,height:180}}>
 <Text style={{fontFamily:font.ui,color:pulpColors.bone,fontSize:10,marginHorizontal:18,marginBottom:5}}>แตะการ์ดเพื่ออ่าน · ลากขึ้นเพื่อใช้{overflow?' · เลื่อนดูใบอื่น':''}</Text>
 <ScrollView horizontal showsHorizontalScrollIndicator={overflow} contentContainerStyle={{paddingHorizontal:16,paddingTop:6,paddingBottom:8,gap:6,alignItems:'flex-end'}}>
 {cards.map((c,i)=>{const id=c.instanceId??c.id;const now=costWithRule(c as any,cardsPlayedThisTurn);return <View key={id} style={{transform:[{translateY:selected===id?-5:0}],zIndex:hoveredCardId===id?999:i}}><Card card={c as any} width={cardW} height={150} selected={selected===id} onPress={()=>setSelected(selected===id?null:id)} onDragPlay={()=>{onPlayCard(c,i);setSelected(null)}} onHoverChange={v=>onHoverChange(c,v)} isPlayed={playedCardIds.includes(id)} disabled={c.type==='curse'||now>energy} animationDelay={i*55} costNow={now}/></View>})}
 </ScrollView></View></View>;
}
