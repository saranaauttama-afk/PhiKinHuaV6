import React from 'react';
import { View, Text, Pressable, ScrollView, Image, Modal, StyleSheet, useWindowDimensions } from 'react-native';
import { CHARACTER_CLASSES, type ClassId } from '../../src/core/classes';
import Art from './Art';
import RitualSurface from './RitualSurface';
import { font, occupationColors as sceneColors, notebookColors as colors } from '../theme';
import { useScreenPadding } from '../useScreenPadding';
const scene = require('../../assets/ui/occupation-table.jpg');
// One normalized coordinate system keeps illustrated sheets and tap targets aligned.
const sheets: { id: ClassId; x: number; y: number; w: number; h: number; angle: string }[] = [
  { id: 'shaman', x: .112, y: .409, w: .224, h: .16, angle: '16deg' },
  { id: 'warrior', x: .301, y: .437, w: .223, h: .16, angle: '15deg' },
  { id: 'nun', x: .511, y: .464, w: .223, h: .16, angle: '13deg' },
  { id: 'medium', x: .737, y: .491, w: .223, h: .16, angle: '9deg' },
];
type Props = { onPick: (id: ClassId) => void; onBack?: () => void };
export default function ClassSelectScreen({ onPick, onBack }: Props) {
  const pad = useScreenPadding();
  const { width, height } = useWindowDimensions();
  const sceneWidth = Math.min(width, (height - pad.top - pad.bottom) * 2 / 3);
  const sceneHeight = sceneWidth * 1.5;
  const detailWidth = Math.min(width - 24, 480);
  const [selected, setSelected] = React.useState<ClassId | null>(null);
  const picked = selected ? CHARACTER_CLASSES[selected] : null;
  return <View style={[styles.screen, { paddingTop: pad.top, paddingBottom: pad.bottom }]}>
    <Image accessible={false} source={scene} resizeMode="cover" blurRadius={10} style={{ position: 'absolute', width, height, opacity: .35 }} />
    <View collapsable={false} style={{ width: sceneWidth, height: sceneHeight }}>
      <Image accessible={false} source={scene} resizeMode="stretch" style={{ position: 'absolute', width: sceneWidth, height: sceneHeight }} />
      <View style={styles.heading}>
        <RitualSurface kind="notice" style={styles.titlePaper}><Text accessibilityRole="header" style={styles.title}>เลือกอาชีพ</Text></RitualSurface>
        <Text style={styles.subtitle}>คืนมืดกำลังรอ… คุณจะเป็นใคร</Text>
      </View>
      {onBack && <Pressable accessibilityRole="button" accessibilityLabel="ย้อนกลับ" onPress={onBack} style={styles.back}><Text style={styles.backLabel}>‹</Text></Pressable>}
      {sheets.map(sheet => <Pressable key={sheet.id} accessibilityRole="button" accessibilityLabel={`เลือก${CHARACTER_CLASSES[sheet.id].name}`}
        accessibilityHint="เปิดภาพใหญ่และรายละเอียดอาชีพ" onPress={() => setSelected(sheet.id)}
        style={({ pressed }) => [{ position: 'absolute', left: sceneWidth * sheet.x, top: sceneHeight * sheet.y,
          width: sceneWidth * sheet.w, height: sceneHeight * sheet.h, transform: [{ rotate: sheet.angle }] }, pressed && styles.pressedSheet]}>
        <Text numberOfLines={1} style={[styles.sheetLabel, { fontSize: Math.max(10, sceneWidth * .034) }]}>{CHARACTER_CLASSES[sheet.id].name}</Text>
      </Pressable>)}
      <View pointerEvents="none" style={styles.hintWrap}><Text style={styles.hint}>แตะใบอาชีพบนโต๊ะเพื่อดูรายละเอียด</Text></View>
    </View>
    <Modal visible={!!picked} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
      <View style={[styles.scrim, { paddingTop: pad.top, paddingBottom: pad.bottom }]}>
        {picked && <View collapsable={false} accessibilityViewIsModal style={[styles.detail, { width: detailWidth, maxHeight: height - pad.top - pad.bottom }]}>
          <ScrollView contentContainerStyle={styles.detailContent}>
            <Text accessibilityRole="header" style={styles.detailName}>{picked.name}</Text><Text style={styles.detailTitle}>{picked.title}</Text>
            <RitualSurface kind="notice" style={styles.portrait}><Art slot={`class/${picked.id}`} width={detailWidth - 76} height={Math.min(300, height * .3)} /></RitualSurface>
            <Text style={styles.copy}>{picked.desc}</Text>
            <View style={styles.stats}><Stat label="ชีวิต" value={picked.startHp} /><Stat label="พลังงาน" value={picked.startEnergy} /><Stat label="ไพ่ในมือ" value={picked.startHandSize} /></View>
            <Text style={styles.passive}>{picked.passiveName}</Text><Text style={styles.copy}>{picked.passiveDesc}</Text>
          </ScrollView>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={() => { const id = picked.id; setSelected(null); onPick(id); }} style={({ pressed }) => [styles.depart, pressed && { opacity: .8 }]}><Text style={styles.departLabel}>เลือก{picked.name} · ออกเดินทาง →</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => setSelected(null)} style={styles.close}><Text style={styles.closeLabel}>กลับไปเลือกอาชีพ</Text></Pressable>
          </View>
        </View>}
      </View>
    </Modal>
  </View>;
}
function Stat({ label, value }: { label: string; value: number }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: sceneColors.night, alignItems: 'center', justifyContent: 'center' },
  heading: { position: 'absolute', top: '5%', left: '16%', right: '5%', alignItems: 'center' },
  titlePaper: { width: '100%', paddingTop: 14, paddingBottom: 25 },
  title: { color: colors.ink, fontFamily: font.display, fontSize: 30, textAlign: 'center' },
  subtitle: { color: sceneColors.cream, backgroundColor: sceneColors.subtitleShade, fontFamily: font.ui, fontSize: 12, textAlign: 'center', marginTop: 4, padding: 5 },
  back: { position: 'absolute', top: 10, left: 10, width: 44, height: 44, backgroundColor: sceneColors.backShade, borderWidth: 2, borderColor: sceneColors.backEdge, alignItems: 'center', justifyContent: 'center' },
  backLabel: { color: sceneColors.backInk, fontSize: 38, lineHeight: 40 },
  pressedSheet: { backgroundColor: sceneColors.pressWash, borderWidth: 2, borderColor: sceneColors.pressEdge },
  sheetLabel: { position: 'absolute', bottom: '5%', left: '4%', right: '4%', textAlign: 'center', color: sceneColors.labelInk, fontFamily: font.display },
  hintWrap: { position: 'absolute', bottom: '4%', left: 10, right: 10, alignItems: 'center' },
  hint: { color: sceneColors.cream, backgroundColor: sceneColors.hintShade, fontFamily: font.ui, fontSize: 12, paddingHorizontal: 12, paddingVertical: 7, textAlign: 'center' },
  scrim: { flex: 1, backgroundColor: sceneColors.scrim, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  detail: { backgroundColor: colors.paper, borderWidth: 3, borderColor: sceneColors.detailEdge, flexShrink: 1 },
  detailContent: { padding: 16, alignItems: 'center' },
  detailName: { color: colors.ink, fontFamily: font.display, fontSize: 30 },
  detailTitle: { color: sceneColors.mutedInk, fontFamily: font.ui, fontSize: 14, textAlign: 'center' },
  portrait: { marginVertical: 12, alignItems: 'center', padding: 14 },
  copy: { color: colors.ink, fontFamily: font.body, fontSize: 20, lineHeight: 26, alignSelf: 'stretch' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', alignSelf: 'stretch', paddingVertical: 12, marginVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: sceneColors.rule },
  stat: { alignItems: 'center' }, statValue: { color: colors.red, fontFamily: font.display, fontSize: 24 }, statLabel: { color: colors.ink, fontFamily: font.ui, fontSize: 12 },
  passive: { color: colors.red, fontFamily: font.heading, fontSize: 17, alignSelf: 'stretch', marginBottom: 4 },
  actions: { paddingHorizontal: 12, paddingTop: 8, borderTopWidth: 1, borderColor: sceneColors.rule },
  depart: { minHeight: 52, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  departLabel: { color: colors.paper, fontFamily: font.heading, fontSize: 16, textAlign: 'center' },
  close: { minHeight: 48, alignItems: 'center', justifyContent: 'center' }, closeLabel: { color: colors.ink, fontFamily: font.ui, fontSize: 14 },
});
