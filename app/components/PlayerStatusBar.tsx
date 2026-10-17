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
import BattleSeal from './battle/BattleSeal';
import { Image as RNImage } from 'react-native';

/** Map skill (slot A) art for the HUD seal. Owner 17 Oct 2026: the map skill lives on the HUD, not in the traveler page. */
const mapSkillArt: Record<string, number> = {
  rune_weapon: require('../../assets/ui/card-clap.png'), bargain: require('../../assets/ui/ritual-jar.png'),
  pray_change: require('../../assets/ui/blessing-shrine-object.png'), ask_ancestors: require('../../assets/ui/blessing-ancestor.png'),
};
/** One-line meaning of each HUD stat; each icon explains itself instead of all opening the traveler page. */
const STAT_HELP = {
  hand: (n: number) => `มือสูงสุดท้ายเทิร์น ${n}\nจบเทิร์นแล้วเก็บการ์ดไว้ในมือได้ไม่เกิน ${n} ใบ`,
  draw: (n: number) => `จั่วต่อเทิร์น ${n}\nต้นเทิร์นจั่วการ์ดเพิ่ม ${n} ใบ`,
};
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
  const [statHelp, setStatHelp] = React.useState<string | null>(null);
  const health = Math.max(0, Math.min(1, p.hp / Math.max(1, p.maxHp)));
  return <>
    <QuietPlayerHud classId={state.classId} hp={p.hp} maxHp={p.maxHp} onPortrait={()=>setDetailsOpen(true)}
     stats={<><HudStat icon="gold" text={`${p.gold??0}`} label="เบี้ย"/><HudStat icon="deck" text={`${state.masterDeck?.length??0}`} onPress={onOpenDeck} label={`สำรับ ${state.masterDeck?.length??0}`}/><HudStat icon="hand" text={`${retainLimit(state)}`} label="มือสูงสุดท้ายเทิร์น" onPress={()=>setStatHelp(STAT_HELP.hand(retainLimit(state)))}/><HudStat icon="draw" text={`${p.drawPerTurn}`} label="จั่วต่อเทิร์น" onPress={()=>setStatHelp(STAT_HELP.draw(p.drawPerTurn))}/>
      {mapSkill&&mapSkillStatus&&<View testID="map-skill-seal" style={{width:44,height:44,alignItems:'center',justifyContent:'center',opacity:mapSkillStatus.ready?1:0.45}}>
        {/* ready: a soft lamp-glow disc behind the seal; used/cooling down: the seal goes dark */}
        {mapSkillStatus.ready&&<View pointerEvents="none" style={{position:'absolute',width:40,height:40,borderRadius:20,backgroundColor:palette.moon,opacity:0.35,shadowColor:palette.moon,shadowOpacity:1,shadowRadius:10,shadowOffset:{width:0,height:0},elevation:6}}/>}
        <BattleSeal label={`${mapSkill.name} · ${mapSkillStatus.label}`} onPress={()=>setSkillOpen(mapSkill.id)} tone={mapSkillStatus.ready?'positive':'neutral'} muted={!mapSkillStatus.ready} count={(state.skills?.[mapSkill.id]??0)>0?state.skills![mapSkill.id]:undefined}>
          {mapSkillArt[mapSkill.id]!=null?<RNImage accessible={false} source={mapSkillArt[mapSkill.id]} resizeMode="contain" style={{width:26,height:26}}/>:<InkIcon name="check" size={18}/>}
        </BattleSeal>
      </View>}</>}/>
    <Modal visible={!!statHelp} transparent animationType="fade" onRequestClose={()=>setStatHelp(null)}>
      <Pressable accessibilityLabel="ปิดคำอธิบาย" onPress={()=>setStatHelp(null)} style={[styles.scrim,{backgroundColor:palette.scrim}]}>
        <RitualSurface kind="quietSlate" style={{paddingHorizontal:20,paddingVertical:16,maxWidth:340}}><Text style={{fontFamily:font.ui,color:palette.text,fontSize:15,lineHeight:24,textAlign:'center'}}>{statHelp}</Text></RitualSurface>
      </Pressable>
    </Modal>

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
          {/* Owner 17 Oct 2026: stop at บุญ. No threshold rule or night-3 ghost hint (left a mystery);
              blessings live in the deck page, the map skill on the HUD. */}
          {state.campaign&&<View style={{marginTop:8}}><AlignmentMeter campaign={state.campaign} ink compact/></View>}
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
