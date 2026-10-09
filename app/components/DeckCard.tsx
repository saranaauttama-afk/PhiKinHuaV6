import React from 'react';
import { Image, Pressable, Text, View, StyleSheet, Platform } from 'react-native';
import type { CardData } from '../../src/core/types';
import { CARD_ART_SOURCES, GRAY_CARD_ART_SOURCES } from '../cardArt';
import { cardGlyph, cardSummary } from '../cardPresentation';
import RitualSurface from './RitualSurface';
import { font, paper } from '../theme';
import {upgradeLevelOf} from '../../src/core/engine/shared';
import {fusedArtParents} from '../cardArtIdentity';
import CandleSelection from './CandleSelection';

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
  const parents=fusedArtParents(card.id);
  if(parents.length===2&&!CARD_ART_SOURCES[card.id])return <View style={{width:size,height:size,flexDirection:'row',alignItems:'center'}}>{parents.map(id=><CardGlyphArt key={id} card={{...card,id}} size={size/2} muted={muted}/>)}</View>;
  return <Image accessible={false} source={muted ? (GRAY_CARD_ART_SOURCES[card.id] ?? grayGlyphs[cardGlyph(card)]) : (CARD_ART_SOURCES[card.id] ?? glyphs[cardGlyph(card)])} resizeMode="contain" style={{ width: size, height: size, filter:(muted?(Platform.OS==='web'?'grayscale(1)':[ {grayscale:1} ]):undefined) as any, tintColor: !muted && !CARD_ART_SOURCES[card.id] && cardGlyph(card) === 'curse' ? paper.red : undefined }} />;
}
/** Same paper, art, energy, level and complete ability text in deck and all shops. */
export function CardFace({card,count}:{card:CardData;count?:number}) {
 return <RitualSurface kind="occupationPage" style={styles.card}>
  <View style={styles.top}><Text style={styles.cost}>พลัง {card.cost??0}</Text><Text style={styles.count}>ขั้น {upgradeLevelOf(card)}</Text></View>
  <View style={styles.symbol}><CardGlyphArt card={card}/></View>
  <Text style={styles.name}>{card.name??card.id}</Text>
  <Text style={[styles.summary,{color:card.type==='attack'?paper.red:paper.ink}]}>{cardSummary(card)}</Text>
  {!!card.desc&&!card.upgraded&&<Text style={styles.summary}>{card.desc}</Text>}
  {count!=null&&<Text style={styles.note}>×{count} ใบ</Text>}
  {(card.exhaust||card.type==='trap')&&<Text style={styles.note}>ใช้แล้วหายจากไฟต์</Text>}
 </RitualSurface>;
}
export default function DeckCard({card,count,onPress,selected=false,dim=false,fullWidth=false}:{card:CardData;count?:number;onPress:()=>void;selected?:boolean;dim?:boolean;fullWidth?:boolean}) {
 return <Pressable accessibilityRole="button" accessibilityLabel={`ดูการ์ด ${card.name??card.id}${count!=null?` จำนวน ${count} ใบ`:''}`} accessibilityState={{selected}} accessibilityHint={`พลังงาน ${card.cost??0} · ขั้น ${upgradeLevelOf(card)} · ${cardSummary(card)}`} onPress={onPress} style={[styles.touch,fullWidth&&{width:'100%'}]}>
  <CandleSelection selected={selected} dim={dim}><CardFace card={card} count={count}/></CandleSelection>
 </Pressable>;
}
const styles = StyleSheet.create({
  touch: { width: '48%' }, card: { minHeight: 205, paddingHorizontal: 16, paddingVertical: 17 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cost: { fontFamily: font.heading, fontSize: 12, color: paper.red }, count: { fontFamily: font.uiMed, fontSize: 12, color: paper.ink },
  symbol: { alignItems: 'center', marginVertical: 4 }, name: { fontFamily: font.heading, fontSize: 14, textAlign: 'center', color: paper.ink },
  summary: { fontFamily: font.ui, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 4 },
  note: { fontFamily: font.ui, fontSize: 9, color: paper.red, textAlign: 'center', marginTop: 3 },
});
