import React from 'react';
import { View, Text, ImageBackground, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import type { BlessingDef } from '../../src/core/types';
import RitualSurface from './RitualSurface';
import { font, paper, palette, pulpColors } from '../theme';
import { useScreenPadding } from '../useScreenPadding';

export default function StarterBlessingScreen({ choices, onPick }: { choices: BlessingDef[]; onPick: (index: number) => void }) {
  const { width } = useWindowDimensions();
  const pad = useScreenPadding();
  const cardWidth = Math.min(width * .82, 420);
  return <ImageBackground source={require('../../assets/scence/episode-village.jpg')} resizeMode="cover" style={styles.screen}>
    <View style={styles.shade} />
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: pad.top + 20, paddingBottom: pad.bottom + 20 }]}>
      <RitualSurface kind="hudPaper" style={styles.titlePaper}><Text accessibilityRole="header" style={styles.title}>เลือกพรติดตัว</Text></RitualSurface>
      <Text style={styles.subtitle}>สิ่งที่ติดตัวไปตลอดการเดินทาง เลือกได้อย่างเดียว</Text>
      <View style={styles.choices}>
        {choices.map((b, index) => <Pressable key={b.id} accessibilityRole="button" accessibilityLabel={`พรติดตัว ${index + 1}: ${b.name}`}
          onPress={() => onPick(index)} android_ripple={{ color: pulpColors.pressedPaper }} style={{ width: cardWidth }}>
          <RitualSurface kind={b.id === 'herbal_wisdom' ? 'blessingHerbs' : b.id === 'ancestral_blessing' ? 'blessingAncestor' : 'hudPaper'}
            style={[styles.card, { paddingLeft: b.id === 'herbal_wisdom' || b.id === 'ancestral_blessing' ? cardWidth * .41 : 20 }]}>
            <Text style={styles.name}>{b.name}</Text>
            {!!b.desc && <Text style={styles.desc}>{b.desc.split(/(\+1 Energy|1 HP)/g).map((part, i) => <Text key={i} style={part === '+1 Energy' || part === '1 HP' ? styles.emphasis : undefined}>{part}</Text>)}</Text>}
          </RitualSurface>
        </Pressable>)}
      </View>
      <Text style={styles.hint}>แตะเลือกพร 1 อย่าง เพื่อเริ่มการเดินทาง</Text>
    </ScrollView>
  </ImageBackground>;
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: pulpColors.mapShade },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  titlePaper: { paddingHorizontal: 28, paddingVertical: 10 },
  title: { fontFamily: font.display, color: paper.ink, fontSize: 25, textAlign: 'center' },
  subtitle: { fontFamily: font.ui, color: palette.text, backgroundColor: palette.scrim, fontSize: 12, textAlign: 'center', marginTop: 6, marginBottom: 18, padding: 4 },
  choices: { gap: 12 },
  card: { minHeight: 136, paddingRight: 18, paddingVertical: 18, justifyContent: 'center' },
  name: { fontFamily: font.heading, color: paper.ink, fontSize: 16 },
  desc: { fontFamily: font.body, color: paper.ink, fontSize: 20, lineHeight: 23, marginTop: 5 },
  emphasis: { color: paper.red, fontFamily: font.bodyBold },
  hint: { fontFamily: font.ui, color: palette.text, fontSize: 11, textAlign: 'center', marginTop: 14 },
});
