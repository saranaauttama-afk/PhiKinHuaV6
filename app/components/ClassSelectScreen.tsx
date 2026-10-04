import React from 'react';
import { View, Text, Pressable, ScrollView, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { ALL_CLASS_IDS, CHARACTER_CLASSES, type ClassId } from '../../src/core/classes';
import Art from './Art';
import { font, notebookColors as colors } from '../theme';
import { useScreenPadding } from '../useScreenPadding';

const panel = require('../../assets/ui/character-comic-panel.png');
const summaries: Record<ClassId, string> = {
  shaman: 'คาถา พิษ และของขลัง', warrior: 'ตั้งรับแน่น สวนกลับหนัก',
  nun: 'ฟื้นเลือด ยืนระยะยาว', medium: 'เรียกวิญญาณมาช่วยต่อสู้',
};
type Props = { onPick: (id: ClassId) => void; onBack?: () => void };

/** Live text stays on clean ivory; raster ink scenery belongs to the portrait. */
export default function ClassSelectScreen({ onPick, onBack }: Props) {
  const pad = useScreenPadding();
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width - 24, 600);
  const [selected, setSelected] = React.useState<ClassId | null>(null);
  const picked = selected ? CHARACTER_CLASSES[selected] : null;
  return (
    <View style={[styles.screen, { paddingTop: pad.top, paddingBottom: pad.bottom }]}>
      <View style={[styles.page, { width: pageWidth }]}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>เลือกผู้เดินทาง</Text>
          <View style={styles.rule} />
          <Text style={styles.subtitle}>แต่ละคนถือสำรับและวิชาคนละอย่าง</Text>
        </View>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {ALL_CLASS_IDS.map(id => {
            const c = CHARACTER_CLASSES[id];
            const isOn = selected === id;
            return (
              <Pressable key={id} accessibilityRole="button" accessibilityLabel={`เลือก${c.name}`}
                accessibilityState={{ selected: isOn }} onPress={() => setSelected(id)}
                style={[styles.record, { borderColor: isOn ? colors.red : colors.ink }]}>
                <View collapsable={false} style={styles.recordBody}>
                  <Image source={panel} resizeMode="stretch"
                    style={{ position: 'absolute', width: pageWidth - 6, height: 156 }} />
                  <View style={styles.portrait}>
                    <Art slot={`class/${id}`} width={Math.max(76, pageWidth * .27)} height={142} compact />
                  </View>
                  <View style={styles.copy}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{c.name}</Text>
                      <Text accessibilityLabel={isOn ? 'เลือกแล้ว' : undefined}
                        style={[styles.check, { opacity: isOn ? 1 : 0 }]}>✓</Text>
                    </View>
                    <Text style={styles.description}>{summaries[id]}</Text>
                    <View style={styles.statRule} />
                    <View style={styles.stats}>
                      <Stat label="ชีวิต" value={c.startHp} />
                      <Stat label="พลังงาน" value={c.startEnergy} />
                      <Stat label="มือ" value={c.startHandSize} />
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
          {picked && (
            <View style={styles.details} accessibilityLiveRegion="polite">
              <Text style={styles.detailTitle}>{picked.name} · {picked.title}</Text>
              <Text style={styles.detailText}>{picked.desc}</Text>
              <Text style={styles.detailTitle}>{picked.passiveName}</Text>
              <Text style={styles.detailText}>{picked.passiveDesc}</Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: !selected }}
            disabled={!selected} onPress={() => selected && onPick(selected)}
            style={({ pressed }) => [styles.depart, { backgroundColor: selected ? colors.red : colors.disabled, opacity: pressed ? .85 : 1 }]}>
            <Text style={styles.departLabel}>{selected ? 'ออกเดินทาง  →' : 'เลือกผู้เดินทางก่อน'}</Text>
          </Pressable>
          {onBack && <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
            <Text style={styles.backLabel}>◂ ย้อนกลับ</Text>
          </Pressable>}
        </View>
      </View>
    </View>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return <View style={styles.stat}><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text></View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, alignItems: 'center' }, page: { flex: 1 },
  header: { paddingHorizontal: 6, paddingBottom: 12 },
  title: { color: colors.ink, fontFamily: font.display, fontSize: 28, textAlign: 'center' },
  rule: { height: 3, backgroundColor: colors.red, marginHorizontal: 22, marginTop: 5 },
  subtitle: { color: colors.ink, fontFamily: font.ui, fontSize: 12, textAlign: 'center', marginTop: 7 },
  list: { flex: 1 }, listContent: { gap: 10, paddingBottom: 12 },
  record: { borderWidth: 3, backgroundColor: colors.paper },
  recordBody: { flexDirection: 'row', minHeight: 156, overflow: 'hidden' },
  portrait: { width: '34%', alignItems: 'center', justifyContent: 'center', paddingVertical: 7 },
  copy: { flex: 1, backgroundColor: colors.paper, marginVertical: 9, marginRight: 9, paddingHorizontal: 10, paddingVertical: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { color: colors.ink, fontFamily: font.display, fontSize: 23 },
  check: { color: colors.red, fontFamily: font.display, fontSize: 22 },
  description: { color: colors.ink, fontFamily: font.bodyBold, fontSize: 20, lineHeight: 22, marginTop: 3 },
  statRule: { height: 1, backgroundColor: colors.ink, marginTop: 9, marginBottom: 5 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', gap: 3 },
  stat: { alignItems: 'center' }, statLabel: { color: colors.ink, fontFamily: font.ui, fontSize: 10 },
  statValue: { color: colors.ink, fontFamily: font.display, fontSize: 21, lineHeight: 27 },
  details: { borderLeftWidth: 4, borderColor: colors.red, paddingLeft: 12, paddingVertical: 6 },
  detailTitle: { color: colors.ink, fontFamily: font.heading, fontSize: 14, marginTop: 4 },
  detailText: { color: colors.ink, fontFamily: font.body, fontSize: 20, lineHeight: 24 },
  footer: { paddingTop: 8 },
  depart: { minHeight: 54, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.ink },
  departLabel: { color: colors.paper, fontFamily: font.display, fontSize: 20, textAlign: 'center' },
  back: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  backLabel: { color: colors.ink, fontFamily: font.heading, fontSize: 14 },
});
