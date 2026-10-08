import React from 'react';
import { Pressable, Text, View, Image, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { GameState } from '../../src/core/types';
import { CHARACTER_CLASSES } from '../../src/core/classes';
import { artSource } from './Art';
import RitualSurface from './RitualSurface';
import QuietPlayerHud,{HudStat} from './QuietPlayerHud';
import InkIcon from './InkIcon';
import { font, layer, paper, pulpColors, palette } from '../theme';

export const STATUS_BAR_SPACE = 100;
export default function PlayerStatusBar({ state, onOpenDeck, onOpenBlessings }: {
  state: GameState; onOpenDeck?: () => void; onOpenBlessings?: () => void;
}) {
  const p = state.player;
  const pad = useSafeAreaInsets();
  const character = CHARACTER_CLASSES[state.classId ?? 'shaman'];
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const health = Math.max(0, Math.min(1, p.hp / Math.max(1, p.maxHp)));
  return <>
    <QuietPlayerHud classId={state.classId} hp={p.hp} maxHp={p.maxHp} onPortrait={()=>setDetailsOpen(true)}
     stats={<><HudStat icon="gold" text={`${p.gold??0}`} label="เบี้ย"/><HudStat icon="deck" text={`${state.masterDeck?.length??0}`} onPress={onOpenDeck} label={`สำรับ ${state.masterDeck?.length??0}`}/><HudStat icon="blessing" text={`${state.blessings?.length??0}`} onPress={onOpenBlessings} label={`พร ${state.blessings?.length??0}`}/></>}/>
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
  hud: { position: 'absolute', left: 12, right: 12, height: 112, paddingHorizontal: 20, paddingVertical: 9, zIndex: layer.statusBar, flexDirection: 'row', gap: 8 },
  portrait: { width: 52, height: 88, overflow: 'hidden', alignItems: 'center' },
  portraitImage: { position: 'absolute', top: 0, width: 86, height: 128 },
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
