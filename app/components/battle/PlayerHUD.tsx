import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, palette, surface } from '../../theme';
type Props = {
  hp: number; maxHp: number; energy: number; maxEnergy: number;
  block: number; maxHandSize: number; drawCount: number;
  onEndTurn: () => void; onOpenPiles?: () => void; isEnemyTurn?: boolean; hudFlashKey?: number;
};
export default function PlayerHUD(p: Props) {
  const pad = useSafeAreaInsets();
  return <View style={{ position: 'absolute', bottom: pad.bottom + 8, left: 12, right: 12, borderWidth: 3, borderColor: palette.ink, backgroundColor: surface.panelRaise, padding: 10, gap: 6 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View><Text style={{ color: palette.text, fontFamily: font.heading, fontSize: 16 }}>เลือด {p.hp}/{p.maxHp}</Text>
        <Text style={{ color: palette.moon, fontFamily: font.ui, fontSize: 12 }}>พลัง {p.energy}/{p.maxEnergy} · เกราะ {p.block}</Text></View>
      <Pressable accessibilityRole="button" onPress={p.onEndTurn} disabled={p.isEnemyTurn} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, backgroundColor: palette.paperDeep, borderWidth: 2, borderColor: palette.moon, opacity: p.isEnemyTurn ? 0.5 : 1 }}>
        <Text style={{ color: palette.text, fontFamily: font.heading }}>{p.isEnemyTurn ? 'ตาของผี…' : 'จบเทิร์น'}</Text>
      </Pressable>
    </View>
    <Pressable accessibilityRole="button" onPress={p.onOpenPiles} hitSlop={8}><Text style={{ color: palette.textDim, fontFamily: font.ui, fontSize: 11 }}>กองจั่ว {p.drawCount} ใบ · จั่วเทิร์นละ {p.maxHandSize} · แตะดูกอง</Text></Pressable>
  </View>;
}
