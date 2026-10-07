import React from 'react';
import {Pressable,Text,View,useWindowDimensions} from 'react-native';
import type {CardData} from '../../src/core/types';
import {canUpgrade,upgradeCard,upgradeLevelOf} from '../../src/core/engine/shared';
import {CardGlyphArt} from './DeckCard';
import RitualSurface from './RitualSurface';
import {GameButton} from './Panel';
import {cardSummary} from '../cardPresentation';
import {font,paper} from '../theme';

export function upgradeSummary(card:CardData):string {
  const extra=card.trap?.effects.map(e=>`${e.type==='negate'?'ยกเลิก':e.type==='damage'?'โจมตี':'ผลกับดัก'} ${'value' in e?e.value:''}`).join(' · ');
  return `พลัง ${card.cost??0} · ${extra||cardSummary(card)}`;
}
/** Preserve deck indices, including capped cards. Numeric widths also work on native Android. */
export default function UpgradeCardPicker({cards,selected,onSelect,price,remove=false,onConfirm,disabledConfirm=false}:{cards:CardData[];selected:number|null;onSelect:(i:number)=>void;price?:(card:CardData)=>number;remove?:boolean;onConfirm?:(i:number)=>void;disabledConfirm?:boolean}) {
  const {width}=useWindowDimensions();const [rowWidth,setRowWidth]=React.useState(width-40);
  const cardWidth=Math.max(120,Math.floor((rowWidth-12)/2));
  return <View onLayout={e=>setRowWidth(e.nativeEvent.layout.width)} style={{width:'100%',minWidth:0,flexDirection:'row',flexWrap:'wrap',gap:12}}>
    {cards.map((card,i)=>{const available=remove||canUpgrade(card);const picked=selected===i;const next=upgradeCard(card);return <View collapsable={false} key={`${card.id}-${i}`} style={{width:cardWidth,opacity:available?1:.5}}>
      <RitualSurface kind="occupationPage" style={{paddingHorizontal:16,paddingVertical:18,minHeight:236}}>
      <Pressable accessibilityRole="button"
      accessibilityLabel={`เลือกการ์ด ${card.name??card.id} ใบที่ ${i+1}`} accessibilityState={{selected:picked,disabled:!available}} disabled={!available}
      onPress={()=>onSelect(i)}>
        <View style={{alignItems:'center'}}><CardGlyphArt card={card} size={62}/></View>
        <Text style={{fontFamily:font.heading,color:paper.ink,fontSize:14,lineHeight:22,textAlign:'center'}}>{card.name??card.id}</Text>
        <Text style={{fontFamily:font.ui,color:paper.ink,fontSize:12,lineHeight:20,marginTop:6}}>{upgradeSummary(card)}</Text>
        {available&&!remove&&<Text style={{fontFamily:font.ui,color:paper.red,fontSize:12,lineHeight:20,marginTop:6}}>หลังปลุกเสก: {upgradeSummary(next)}</Text>}
        <Text style={{fontFamily:font.ui,color:paper.ink,fontSize:11,lineHeight:19,marginTop:6}}>{remove?'ถอดออกจากสำรับ':available?`ขั้น ${upgradeLevelOf(card)} → ${upgradeLevelOf(card)+1}${price?` · ${price(card)} เบี้ย`:' · ฟรี'}`:'สุดขั้นแล้ว'}</Text>
        <Text style={{fontFamily:font.heading,color:paper.red,fontSize:12,lineHeight:20,marginTop:6}}>{picked?'✓ เลือกไว้แล้ว':' '}</Text>
      </Pressable>
        {picked&&onConfirm&&<GameButton label={remove?'สละใบนี้':'ปลุกเสกใบนี้'} tone="primary" disabled={disabledConfirm} onPress={()=>onConfirm(i)} style={{marginTop:6}}/>}
      </RitualSurface>
    </View>;})}
  </View>;
}
