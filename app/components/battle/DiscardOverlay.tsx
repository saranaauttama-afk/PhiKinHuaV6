import React from 'react';
import {View,Text,Pressable,ScrollView,ImageBackground} from 'react-native';
import type {CardData} from '../../../src/core/types';
import {CardGlyphArt} from '../DeckCard';
import {cardSummary} from '../../cardPresentation';
import RitualSurface from '../RitualSurface';
import {GameButton} from '../Panel';
import {font,palette,paper,layer} from '../../theme';
interface CardItem {instanceId?:string;id?:string;name:string;cost?:number;damage?:number;block?:number;effects?:{damage?:number;block?:number};[key:string]:unknown}
interface Props {cards:CardItem[];maxHandSize:number;onConfirm:(indices:number[])=>void;onCancel:()=>void}
export default function DiscardOverlay({cards,maxHandSize,onConfirm,onCancel}:Props){
 const mustDiscard=Math.max(0,cards.length-maxHandSize);
 const [selected,setSelected]=React.useState<number[]>([]);
 const toggle=(i:number)=>setSelected(prev=>prev.includes(i)?prev.filter(x=>x!==i):prev.length<mustDiscard?[...prev,i]:prev);
 return <View accessibilityViewIsModal style={{position:'absolute',top:0,left:0,right:0,bottom:0,zIndex:layer.overlay}}>
  <ImageBackground source={require('../../../assets/ui/deck-mat.jpg')} resizeMode="cover" style={{flex:1,justifyContent:'center',paddingVertical:28,backgroundColor:palette.scrimFull}}>
   <RitualSurface kind="wood" style={{marginHorizontal:16,padding:18}}>
    <Text style={{fontFamily:font.heading,color:palette.moon,fontSize:21,textAlign:'center'}}>เลือกการ์ดที่จะทิ้ง</Text>
    <Text style={{fontFamily:font.ui,color:palette.text,fontSize:14,textAlign:'center',marginTop:8}}>มือเต็ม · เลือก {mustDiscard} ใบ ({selected.length}/{mustDiscard})</Text>
   </RitualSurface>
   <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{paddingHorizontal:16,paddingVertical:20,gap:12,alignItems:'center'}} style={{flexGrow:0}}>
    {cards.map((item,i)=>{const card={...item,id:item.id??'',dmg:item.dmg??item.damage??item.effects?.damage,block:item.block??item.effects?.block} as CardData;const picked=selected.includes(i);return <Pressable key={`${item.instanceId??item.id??'card'}-${i}`} accessibilityRole="button" accessibilityLabel={item.name} accessibilityState={{selected:picked}} onPress={()=>toggle(i)} style={{width:150,opacity:!picked&&selected.length>=mustDiscard?.5:1}}>
     <RitualSurface kind="occupationPage" style={{minHeight:255,padding:18,alignItems:'center',gap:8}}>
      <Text style={{fontFamily:font.heading,color:paper.red,fontSize:18,alignSelf:'flex-start'}}>{item.cost??0}</Text>
      <CardGlyphArt card={card} size={85}/>
      <Text style={{fontFamily:font.heading,color:paper.ink,fontSize:14,textAlign:'center'}}>{item.name}</Text>
      <Text style={{fontFamily:font.ui,color:paper.ink,fontSize:12,lineHeight:19,textAlign:'center'}}>{cardSummary(card)}</Text>
      <Text style={{fontFamily:font.heading,color:paper.red,fontSize:13}}>{picked?'เลือกทิ้งแล้ว':'แตะเพื่อเลือก'}</Text>
     </RitualSurface>
    </Pressable>})}
   </ScrollView>
   <View style={{flexDirection:'row',gap:12,paddingHorizontal:16,justifyContent:'center'}}>
    <GameButton label="ยกเลิก" onPress={onCancel}/>
    <GameButton label={`ทิ้ง ${selected.length}/${mustDiscard} ใบ`} disabled={selected.length!==mustDiscard} tone="primary" onPress={()=>onConfirm(selected)}/>
   </View>
  </ImageBackground>
 </View>;
}
