// Protective objects on a wooden shelf; names and effects come from the live blessings.
import React from 'react';
import { Image, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BlessingDef } from '../../src/core/types';
import { groupBlessings } from '../../src/core/blessing/group';
import RitualSurface from './RitualSurface';
import {QuietHeader,QuietButton} from './QuietChrome';
import { font, palette, space, layer } from '../theme';
import { useScreenPadding } from '../useScreenPadding';

const objects = {
  amulet: require('../../assets/ui/blessing-amulet.png'),
  herbs: require('../../assets/ui/blessing-herb-object.png'),
  ancestor: require('../../assets/ui/blessing-shrine-object.png'),
  meditation: require('../../assets/ui/card-breath.png'),
  ritual: require('../../assets/ui/ritual-jar.png'),
  attack: require('../../assets/ui/ritual-knife.png'),
};
export function objectSource(b: BlessingDef) {
  if (b.id === 'free_card_energy') return require('../../assets/ui/card-parry.png');
  if (b.id === 'spirit_energy') return objects.ritual;
  if (b.id === 'herbal_wisdom') return objects.herbs;
  if (b.id === 'ancestral_blessing') return objects.ancestor;
  if (b.id === 'meditation_peace') return objects.meditation;
  if (b.id === 'ritual_shield') return objects.ritual;
  if (b.id === 'bamboo_dart_power') return objects.attack;
  return objects.amulet;
}
type Row = { blessing: BlessingDef; count: number };
export default function BlessingView({ blessings, onClose }: { blessings?: BlessingDef[]; onClose: () => void }) {
  const pad = useScreenPadding();
  const list = blessings ?? [];
  const rows = groupBlessings(list);
  const [selected, setSelected] = React.useState<Row | null>(null);
  const single = rows.length === 1;
  return <ImageBackground source={require('../../assets/ui/blessing-shelf.jpg')} resizeMode="cover" style={styles.screen}>
    <View style={{paddingTop:pad.top}}><QuietHeader title="พรติดตัว" subtitle={`ของคุ้มครอง ${list.length} อย่าง · แตะเพื่ออ่านผลของพร`} onClose={onClose}/></View>
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: pad.bottom + space.xxl }]}>
      {rows.length === 0 ? <Text style={styles.empty}>ยังไม่มีพรติดตัว{'\n'}พรได้จากศาลระหว่างทาง เหตุการณ์ และตอนเลเวลอัป</Text> :
        <View style={[styles.grid, single && styles.singleGrid]}>
          {rows.map(row => <Pressable key={row.blessing.id} accessibilityRole="button"
            accessibilityLabel={`ดูพร ${row.blessing.name} จำนวน ${row.count} อย่าง`}
            accessibilityHint="เปิดอ่านผลของพร" onPress={() => setSelected(row)} style={[styles.item, single && styles.singleItem]}>
            <View style={styles.object}>
              <Image accessible={false} source={objectSource(row.blessing)} resizeMode="contain" style={{ width: single ? 180 : 112, height: single ? 180 : 112 }} />
              {row.count > 1 && <Text style={styles.count}>×{row.count}</Text>}
            </View>
            <RitualSurface kind="quietSlate" style={styles.ledge} />
            <Text style={[styles.name, single && { fontSize: 20 }]}>{row.blessing.name ?? row.blessing.id}</Text>
            <Text style={styles.hint}>แตะดูรายละเอียด ›</Text>
          </Pressable>)}
        </View>}
    </ScrollView>
    <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
      <View style={[styles.scrim, { paddingTop: pad.top + 16, paddingBottom: pad.bottom + 16 }]}>
        {selected && <RitualSurface kind="quietSlate" accessibilityViewIsModal style={styles.details}>
          <ScrollView contentContainerStyle={{ alignItems: 'center', paddingVertical: 12 }}>
            <Text accessibilityRole="header" style={styles.title}>รายละเอียดพร</Text>
            <Image accessible={false} source={objectSource(selected.blessing)} resizeMode="contain" style={{ width: 180, height: 180, marginVertical: 16 }} />
            <Text style={[styles.name, { fontSize: 20 }]}>{selected.blessing.name}</Text>
            {selected.count > 1 && <Text style={styles.subtitle}>×{selected.count} · ผลของพรแต่ละชิ้นซ้อนกัน</Text>}
            {!!selected.blessing.desc && <Text style={[styles.desc, { fontSize: 25, lineHeight: 30, marginTop: 8 }]}>{selected.blessing.desc}</Text>}
          </ScrollView>
          <WoodButton label="กลับไปดูพร" onPress={() => setSelected(null)} />
        </RitualSurface>}
      </View>
    </Modal>
  </ImageBackground>;
}
function WoodButton({label,onPress}:{label:string;onPress:()=>void}) {return <QuietButton label={label} onPress={onPress}/>;}
const styles = StyleSheet.create({
  screen: { ...StyleSheet.absoluteFillObject, backgroundColor: palette.ink, zIndex: layer.overlay },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingBottom: 20 },
  title: { color: palette.moon, fontSize: 24, fontFamily: font.display },
  subtitle: { color: palette.textDim, fontSize: 13, fontFamily: font.ui, marginTop: 4 },
  content: { paddingHorizontal: 24, paddingTop: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 24 },
  singleGrid: { justifyContent: 'center', paddingTop: 20 },
  item: { width: '48%', alignItems: 'center', paddingHorizontal: 4 },
  singleItem: { width: '100%', maxWidth: 300 },
  object: { alignItems: 'center', justifyContent: 'center', width: '100%' },
  count: { position: 'absolute', right: 4, bottom: 4, color: palette.moon, fontFamily: font.heading, fontSize: 16, backgroundColor: palette.scrim, paddingHorizontal: 6 },
  ledge: { width: '100%', height: 8, padding: 0, marginTop: -4 },
  name: { color: palette.moon, fontFamily: font.heading, fontSize: 14, textAlign: 'center', marginTop: 8 },
  desc: { color: palette.text, fontFamily: font.body, fontSize: 21, lineHeight: 25, textAlign: 'center', marginTop: 6 },
  hint: { color: palette.textFaint, fontFamily: font.ui, fontSize: 10, marginTop: 8 },
  button: { color: palette.text, fontFamily: font.heading, fontSize: 14 },
  empty: { color: palette.textDim, fontFamily: font.body, fontSize: 24, lineHeight: 30, textAlign: 'center', paddingVertical: 48 },
  scrim: { flex: 1, backgroundColor: palette.scrimHeavy, paddingHorizontal: 20, justifyContent: 'center' },
  details: { maxHeight: '95%', padding: 28 },
});
