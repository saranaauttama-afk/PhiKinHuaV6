import React from 'react';
import { Image, Pressable, Text, View, StyleSheet, Platform } from 'react-native';
import type { CardData } from '../../src/core/types';
import { CARD_ART_SOURCES, GRAY_CARD_ART_SOURCES } from '../cardArt';
import { cardGlyph, cardSummary } from '../cardPresentation';
import RitualSurface from './RitualSurface';
import { font, paper } from '../theme';
import {costLabel,TYPE_LABEL} from '../../src/core/cards/describe';
import {starOf} from '../../src/core/cards/model';
import CardBadges from './CardBadges';
import CandleSelection from './CandleSelection';
import CardTypeMark from './CardTypeMark';
import {cardTypeWash} from './cardTypeWash';

const glyphs = {
  clap: require('../../assets/ui/card-clap.png'), sword: require('../../assets/ui/card-sword.png'),
  stance: require('../../assets/ui/card-stance.png'), parry: require('../../assets/ui/card-parry.png'),
  breath: require('../../assets/ui/card-breath.png'), trap: require('../../assets/ui/ritual-knife.png'),
  equipment: require('../../assets/ui/ritual-jar.png'), curse: require('../../assets/ui/trail-ghost.png'),
};
const grayGlyphs = {
  clap: require('../../assets/ui/card-gray/card-clap.webp'), sword: require('../../assets/ui/card-gray/card-sword.webp'),
  stance: require('../../assets/ui/card-gray/card-stance.webp'), parry: require('../../assets/ui/card-gray/card-parry.webp'),
  breath: require('../../assets/ui/card-gray/card-breath.webp'), trap: require('../../assets/ui/card-gray/ritual-knife.webp'),
  equipment: require('../../assets/ui/card-gray/ritual-jar.webp'), curse: require('../../assets/ui/card-gray/trail-ghost.webp'),
};
export function CardGlyphArt({ card, size = 76, muted = false }: { card: CardData; size?: number; muted?: boolean }) {
  return <Image accessible={false} source={muted ? (GRAY_CARD_ART_SOURCES[card.id] ?? grayGlyphs[cardGlyph(card)]) : (CARD_ART_SOURCES[card.id] ?? glyphs[cardGlyph(card)])} resizeMode="contain" style={{ width: size, height: size, filter:(muted?(Platform.OS==='web'?'grayscale(1)':[ {grayscale:1} ]):undefined) as any, tintColor: !muted && !CARD_ART_SOURCES[card.id] && cardGlyph(card) === 'curse' ? paper.red : undefined }} />;
}
/** Same paper, art, energy, level and complete ability text in deck and all shops. */
export function CardFace({card,count,compact=false,equippedCount=0}:{card:CardData;count?:number;compact?:boolean;equippedCount?:number}) {
 return <RitualSurface kind="hideCard" hideWash={cardTypeWash[card.type]} style={[styles.card,compact&&{minHeight:158,paddingHorizontal:12,paddingTop:16,paddingBottom:28}]}>
  <CardBadges card={card} compact={compact}/>
  <View style={styles.symbol}><CardGlyphArt card={card} size={compact?50:76}/></View>
  <Text style={[styles.name,compact&&{fontSize:11}]}>{card.name??card.id}</Text>
  <Text style={[styles.summary,compact&&{fontSize:10,lineHeight:16},{color:card.type==='attack'?paper.red:paper.ink}]}>{cardSummary(card)}</Text>
  {!compact&&!!card.flavor&&<Text style={styles.summary}>{card.flavor}</Text>}
  {equippedCount>0&&<Text style={styles.note}>✓ สวม {equippedCount} ใบ</Text>}
  {count!=null&&<Text style={styles.note}>×{count} ใบ</Text>}
  <View pointerEvents="none" style={{position:'absolute',right:compact?14:18,bottom:compact?10:12}}><CardTypeMark type={card.type} size={compact?12:16}/></View>
 </RitualSurface>;
}
export default function DeckCard({card,count,onPress,selected=false,dim=false,fullWidth=false,compact=false,equippedCount=0}:{card:CardData;count?:number;onPress:()=>void;selected?:boolean;dim?:boolean;fullWidth?:boolean;compact?:boolean;equippedCount?:number}) {
 return <Pressable accessibilityRole="button" accessibilityLabel={`ดูการ์ด ${card.name??card.id}${count!=null?` จำนวน ${count} ใบ`:''}`} accessibilityState={{selected}} accessibilityHint={`${TYPE_LABEL[card.type]} · ${costLabel(card)} · ระดับ ${starOf(card)} · ${cardSummary(card)}`} onPress={onPress} style={[styles.touch,compact&&{width:'31.5%'},fullWidth&&{width:'100%'}]}>
  <CandleSelection selected={selected} dim={dim}><CardFace card={card} count={count} compact={compact} equippedCount={equippedCount}/></CandleSelection>
 </Pressable>;
}
const styles = StyleSheet.create({
  touch: { width: '48%' }, card: { minHeight: 205, paddingHorizontal: 16, paddingTop:17,paddingBottom:34 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cost: { fontFamily: font.heading, fontSize: 12, color: paper.red }, count: { fontFamily: font.uiMed, fontSize: 12, color: paper.ink },
  symbol: { alignItems: 'center', marginVertical: 4 }, name: { fontFamily: font.heading, fontSize: 14, textAlign: 'center', color: paper.ink },
  summary: { fontFamily: font.ui, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 4 },
  note: { fontFamily: font.ui, fontSize: 9, color: paper.red, textAlign: 'center', marginTop: 3 },
});
