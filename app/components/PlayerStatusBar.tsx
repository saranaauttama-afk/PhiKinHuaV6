import React from 'react';
import { Pressable, Text, View, Image, Modal, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { GameState } from '../../src/core/types';
import { CHARACTER_CLASSES } from '../../src/core/classes';
import { artSource } from './Art';
import RitualSurface from './RitualSurface';
import QuietPlayerHud,{HudStat} from './QuietPlayerHud';
import {retainLimit} from '../../src/core/engine/handlers/combat';
import {CARD_RULES} from '../../src/core/balance/notfm';
import {openingHandSize} from '../../src/core/cards/hand';
import InkIcon from './InkIcon';
import SkillSheet, { skillStatus } from './SkillSheet';
import AlignmentMeter from './AlignmentMeter';
import { skillsFor } from '../../src/core/skills';
import { font, layer, paper, pulpColors, palette } from '../theme';

export const STATUS_BAR_SPACE = 84;
export default function PlayerStatusBar({ state, onOpenDeck, onOpenBlessings, onUseSkill }: {
  state: GameState; onOpenDeck?: () => void; onOpenBlessings?: () => void;
  /** Slot A skill (map only). */
  onUseSkill?: (id: string, index?: number) => void;
}) {
  const [skillOpen, setSkillOpen] = React.useState<string | null>(null);
  const mapSkill = onUseSkill ? skillsFor(state.classId).find(d => d.slot === 'A') : undefined;
  const mapSkillStatus = mapSkill ? skillStatus(state, mapSkill.id) : undefined;
  const p = state.player;
  const pad = useSafeAreaInsets();
  const character = CHARACTER_CLASSES[state.classId ?? 'shaman'];
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const health = Math.max(0, Math.min(1, p.hp / Math.max(1, p.maxHp)));
  return <>
    <QuietPlayerHud classId={state.classId} hp={p.hp} maxHp={p.maxHp} onPortrait={()=>setDetailsOpen(true)}
     stats={<><HudStat icon="gold" text={`${p.gold??0}`} label="เบี้ย"/><HudStat icon="deck" text={`${state.masterDeck?.length??0}`} onPress={onOpenDeck} label={`สำรับ ${state.masterDeck?.length??0}`}/><HudStat icon="hand" text={`${retainLimit(state)}`} label="มือสูงสุดท้ายเทิร์น" onPress={()=>setDetailsOpen(true)}/><HudStat icon="draw" text={`${p.drawPerTurn}`} label="จั่วต่อเทิร์น" onPress={()=>setDetailsOpen(true)}/></>}/>

    {onUseSkill&&<SkillSheet state={state} id={skillOpen} onClose={()=>setSkillOpen(null)} onUse={onUseSkill}/>}
    <Modal visible={detailsOpen} transparent animationType="fade" onRequestClose={() => setDetailsOpen(false)}>
      <View style={[styles.scrim, { paddingTop: pad.top + 16, paddingBottom: pad.bottom + 16 }]}>
        <RitualSurface kind="occupationPage" accessibilityViewIsModal style={[styles.details,{maxHeight:'90%'}]}><ScrollView contentContainerStyle={{gap:10}}>
          <Text accessibilityRole="header" style={styles.detailTitle}>ข้อมูลผู้เดินทาง</Text>
          <Text style={styles.detailText}>{character.name} · เลเวล {p.level}</Text>
          <Text style={styles.detailText}>พลังชีวิต {p.hp}/{p.maxHp}</Text>
          <Text style={styles.detailText}>แต้ม {p.maxAp} · {require('../../src/core/cards/water').resourceName(state.classId)}ตั้งต้น {p.startMana}</Text>
          <Text style={styles.detailText}>มือสูงสุดท้ายเทิร์น {retainLimit(state)} · จั่วต่อเทิร์น {p.drawPerTurn}</Text>
          <Text style={styles.detailText}>เปิดศึก {openingHandSize(state)} ใบ · ถือระหว่างเล่นไม่เกิน {p.handMax} ใบ</Text>
          <Text style={styles.detailText}>EXP {p.exp}/{p.expToNext}</Text>
          {state.campaign&&<View style={{marginTop:8}}><AlignmentMeter campaign={state.campaign} ink/></View>}
          <Pressable accessibilityRole="button" accessibilityLabel={`ดูพร ${state.blessings?.length??0} พร`} onPress={()=>{setDetailsOpen(false);onOpenBlessings?.();}} style={styles.close}><Text style={styles.linkText}>พรติดตัว {state.blessings?.length??0}</Text></Pressable>
          {mapSkill&&<Pressable accessibilityRole="button" accessibilityLabel={`สกิล ${mapSkill.name}`} onPress={()=>{setDetailsOpen(false);setSkillOpen(mapSkill.id);}} style={styles.close}><Text style={styles.linkText}>{mapSkill.name} · {mapSkillStatus?.label}</Text></Pressable>}
          <Pressable accessibilityRole="button" accessibilityLabel="ปิดข้อมูลผู้เดินทาง" onPress={() => setDetailsOpen(false)} style={styles.close}><Text style={styles.linkText}>กลับไปเลือกทาง</Text></Pressable>
        </ScrollView></RitualSurface>
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
