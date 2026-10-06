import React from 'react';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import type { CardData } from '../../src/core/types';
import { cardGlyph, cardSummary } from '../cardPresentation';
import RitualSurface from './RitualSurface';
import { font, paper } from '../theme';

const glyphs = {
  clap: require('../../assets/ui/card-clap.png'), sword: require('../../assets/ui/card-sword.png'),
  stance: require('../../assets/ui/card-stance.png'), parry: require('../../assets/ui/card-parry.png'),
  breath: require('../../assets/ui/card-breath.png'), trap: require('../../assets/ui/ritual-knife.png'),
  equipment: require('../../assets/ui/ritual-jar.png'), curse: require('../../assets/ui/trail-ghost.png'),
};
export function CardGlyphArt({ card, size = 76 }: { card: CardData; size?: number }) {
  return <Image accessible={false} source={glyphs[cardGlyph(card)]} resizeMode="contain" style={{ width: size, height: size, tintColor: cardGlyph(card) === 'curse' ? paper.red : undefined }} />;
}
export default function DeckCard({ card, count, onPress }: { card: CardData; count: number; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`ดูการ์ด ${card.name ?? card.id} จำนวน ${count} ใบ`} accessibilityHint={`พลังงาน ${card.cost ?? 0} · ${cardSummary(card)}`} onPress={onPress} style={styles.touch}>
    <RitualSurface kind="occupationPage" style={styles.card}>
      <View style={styles.top}><Text style={styles.cost}>{card.cost ?? 0}</Text><Text style={styles.count}>×{count}</Text></View>
      <View style={styles.symbol}><CardGlyphArt card={card} /></View>
      <Text style={styles.name}>{card.name ?? card.id}</Text>
      <Text style={[styles.summary, { color: card.type === 'attack' ? paper.red : paper.ink }]}>{cardSummary(card)}</Text>
      {card.upgraded && <Text style={styles.note}>ปลุกเสกแล้ว</Text>}
      {(card.exhaust || card.type === 'trap') && <Text style={styles.note}>ใช้แล้วหายจากไฟต์</Text>}
    </RitualSurface>
  </Pressable>;
}
const styles = StyleSheet.create({
  touch: { width: '48%' }, card: { minHeight: 205, paddingHorizontal: 16, paddingVertical: 17 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cost: { fontFamily: font.heading, fontSize: 18, color: paper.red }, count: { fontFamily: font.uiMed, fontSize: 12, color: paper.ink },
  symbol: { alignItems: 'center', marginVertical: 4 }, name: { fontFamily: font.heading, fontSize: 13, textAlign: 'center', color: paper.ink },
  summary: { fontFamily: font.ui, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 4 },
  note: { fontFamily: font.ui, fontSize: 9, color: paper.red, textAlign: 'center', marginTop: 3 },
});
