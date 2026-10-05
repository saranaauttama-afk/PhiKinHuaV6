import React from 'react';
import { Pressable, Text, View, Image, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { GameState } from '../../src/core/types';
import { CHARACTER_CLASSES } from '../../src/core/classes';
import { artSource } from './Art';
import RitualSurface from './RitualSurface';
import { font, layer, paper, pulpColors, palette } from '../theme';

export const STATUS_BAR_SPACE = 140;
export default function PlayerStatusBar({ state, onOpenDeck, onOpenBlessings }: {
  state: GameState; onOpenDeck?: () => void; onOpenBlessings?: () => void;
}) {
  const p = state.player;
  const pad = useSafeAreaInsets();
  const character = CHARACTER_CLASSES[state.classId ?? 'shaman'];
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const health = Math.max(0, Math.min(1, p.hp / Math.max(1, p.maxHp)));
  return <>
    <RitualSurface kind="hudPaper" style={[styles.hud, { bottom: pad.bottom + 8 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="ข้อมูลผู้เดินทาง" onPress={() => setDetailsOpen(true)} style={styles.portrait}>
        <Image accessible={false} source={artSource(`class/${character.id}`)} resizeMode="contain" style={styles.portraitImage} />
      </Pressable>
      <View style={styles.content}>
        <View style={styles.nameRow}><Text style={styles.name}>{character.name}</Text><Text style={styles.hp}>{p.hp}/{p.maxHp}</Text></View>
        <View accessible accessibilityRole="progressbar" accessibilityLabel="พลังชีวิต" accessibilityValue={{ min: 0, max: p.maxHp, now: p.hp }}
          style={styles.healthRow}><Text style={styles.healthLabel}>พลังชีวิต</Text><View style={styles.track}><View style={[styles.fill, { width: `${health * 100}%` }]} /></View></View>
        <View style={styles.links}>
          <View style={styles.link}><Text style={styles.linkText}>ทอง {p.gold ?? 0}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={`สำรับ ${state.masterDeck?.length ?? 0}`} disabled={!onOpenDeck}
            onPress={onOpenDeck} android_ripple={{ color: pulpColors.pressedPaper }} style={styles.link}><Text style={styles.linkText}>สำรับ {state.masterDeck?.length ?? 0} ›</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`พร ${state.blessings?.length ?? 0}`} disabled={!onOpenBlessings}
            onPress={onOpenBlessings} android_ripple={{ color: pulpColors.pressedPaper }} style={styles.link}><Text style={styles.linkText}>พร {state.blessings?.length ?? 0} ›</Text></Pressable>
        </View>
      </View>
    </RitualSurface>
    <Modal visible={detailsOpen} transparent animationType="fade" onRequestClose={() => setDetailsOpen(false)}>
      <View style={[styles.scrim, { paddingTop: pad.top + 16, paddingBottom: pad.bottom + 16 }]}>
        <RitualSurface kind="occupationPage" accessibilityViewIsModal style={styles.details}>
          <Text accessibilityRole="header" style={styles.detailTitle}>ข้อมูลผู้เดินทาง</Text>
          <Text style={styles.detailText}>{character.name} · เลเวล {p.level}</Text>
          <Text style={styles.detailText}>พลังชีวิต {p.hp}/{p.maxHp}</Text>
          <Text style={styles.detailText}>พลังงาน {p.energy}/{p.maxEnergy}</Text>
          <Text style={styles.detailText}>EXP {p.exp}/{p.expToNext}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="ปิดข้อมูลผู้เดินทาง" onPress={() => setDetailsOpen(false)} style={styles.close}><Text style={styles.linkText}>กลับไปเลือกทาง</Text></Pressable>
        </RitualSurface>
      </View>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  hud: { position: 'absolute', left: 12, right: 12, height: 128, paddingHorizontal: 20, paddingVertical: 14, zIndex: layer.statusBar, flexDirection: 'row', gap: 8 },
  portrait: { width: 64, height: 100, overflow: 'hidden', alignItems: 'center' },
  portraitImage: { position: 'absolute', top: 0, width: 98, height: 147 },
  content: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  name: { fontFamily: font.heading, color: paper.ink, fontSize: 16 },
  hp: { fontFamily: font.heading, color: paper.red, fontSize: 17 },
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  healthLabel: { fontFamily: font.ui, color: paper.ink, fontSize: 10 },
  track: { flex: 1, height: 8, backgroundColor: pulpColors.healthTrack, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: paper.red },
  links: { flexDirection: 'row', borderTopWidth: 1, borderColor: paper.line, marginTop: 7 },
  link: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkText: { fontFamily: font.ui, color: paper.ink, fontSize: 12 },
  scrim: { flex: 1, backgroundColor: palette.scrimHeavy, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  details: { width: '100%', maxWidth: 380, paddingHorizontal: 28, paddingVertical: 36, gap: 10 },
  detailTitle: { fontFamily: font.heading, color: paper.ink, fontSize: 20 },
  detailText: { fontFamily: font.ui, color: paper.ink, fontSize: 15 },
  close: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
});
