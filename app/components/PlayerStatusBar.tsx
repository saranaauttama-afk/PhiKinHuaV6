import React from 'react';
import { Pressable, Text, View, Image, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { GameState } from '../../src/core/types';
import { CHARACTER_CLASSES } from '../../src/core/classes';
import { artSource } from './Art';
import RitualSurface from './RitualSurface';
import QuietPlayerHud,{HudStat} from './QuietPlayerHud';
import InkIcon from './InkIcon';
import SkillSheet, { skillStatus } from './SkillSheet';
import AlignmentMeter from './AlignmentMeter';
import { skillsFor } from '../../src/core/skills';
import { font, layer, paper, pulpColors, palette } from '../theme';

export const STATUS_BAR_SPACE = 88;
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
     stats={<><HudStat icon="gold" text={`${p.gold??0}`} label="เบี้ย"/><HudStat icon="deck" text={`${state.masterDeck?.length??0}`} onPress={onOpenDeck} label={`สำรับ ${state.masterDeck?.length??0}`}/><HudStat icon="blessing" text={`${state.blessings?.length??0}`} onPress={onOpenBlessings} label={`พร ${state.blessings?.length??0}`}/>{state.campaign&&<HudStat icon="lantern" text={`${state.campaign.courage??0}·${state.campaign.merit??0}`} onPress={()=>setDetailsOpen(true)} label={`ความกล้า ${state.campaign.courage??0} บุญ ${state.campaign.merit??0}`}/>}{mapSkill&&<HudStat icon={mapSkillStatus!.ready?'lantern':'rest'} text={mapSkillStatus!.ready?mapSkill.name:`${state.skills?.[mapSkill.id]??0}`} onPress={()=>setSkillOpen(mapSkill.id)} label={`สกิล ${mapSkill.name} · ${mapSkillStatus!.label}`}/>}</>}/>
    {onUseSkill&&<SkillSheet state={state} id={skillOpen} onClose={()=>setSkillOpen(null)} onUse={onUseSkill}/>}
    <Modal visible={detailsOpen} transparent animationType="fade" onRequestClose={() => setDetailsOpen(false)}>
      <View style={[styles.scrim, { paddingTop: pad.top + 16, paddingBottom: pad.bottom + 16 }]}>
        <RitualSurface kind="occupationPage" accessibilityViewIsModal style={styles.details}>
          <Text accessibilityRole="header" style={styles.detailTitle}>ข้อมูลผู้เดินทาง</Text>
          <Text style={styles.detailText}>{character.name} · เลเวล {p.level}</Text>
          <Text style={styles.detailText}>พลังชีวิต {p.hp}/{p.maxHp}</Text>
          <Text style={styles.detailText}>แต้ม {p.maxAp} · มานาตั้งต้น {p.startMana}</Text>
          <Text style={styles.detailText}>EXP {p.exp}/{p.expToNext}</Text>
          {state.campaign&&<View style={{marginTop:8}}><AlignmentMeter campaign={state.campaign} ink/></View>}
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
