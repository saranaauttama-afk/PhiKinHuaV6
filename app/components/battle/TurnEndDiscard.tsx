// app/components/battle/TurnEndDiscard.tsx — end of turn with more cards than the retain limit:
// pick which to discard (NOTFM). Cancel goes back to the turn.
import React from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import type { CardData } from '../../../src/core/types';
import DeckCard from '../DeckCard';
import RitualSurface from '../RitualSurface';
import { QuietButton } from '../QuietChrome';
import { font, palette } from '../../theme';

export default function TurnEndDiscard({ hand, need, retain, onConfirm, onCancel }: {
  hand: CardData[]; need: number; retain: number;
  onConfirm: (indices: number[]) => void; onCancel: () => void;
}) {
  const [picked, setPicked] = React.useState<number[]>([]);
  React.useEffect(() => setPicked([]), [need, hand.length]);
  const toggle = (i: number) => setPicked(p => p.includes(i) ? p.filter(x => x !== i) : p.length < need ? [...p, i] : [...p.slice(1), i]);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: palette.scrimHeavy, padding: 14 }}>
        <RitualSurface kind="quietSlate" accessibilityViewIsModal style={{ padding: 16, gap: 10, maxHeight: '92%' }}>
          <Text testID="turn-end-discard-title" accessibilityRole="header" style={{ fontFamily: font.heading, color: palette.moon, fontSize: 18, textAlign: 'center' }}>
            เลือกทิ้ง {need} ใบ
          </Text>
          <Text style={{ fontFamily: font.ui, color: palette.textDim, fontSize: 13, textAlign: 'center' }}>
            เก็บการ์ดข้ามเทิร์นได้สูงสุด {retain} ใบ · เลือกแล้ว {picked.length}/{need}
          </Text>
          <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {hand.map((c, i) => c.type === 'curse' ? null : (
              <View key={`${c.instanceId ?? c.id}-${i}`} testID={`turn-end-discard-${i}`} style={{ width: '31%' }}>
                <DeckCard fullWidth card={c} selected={picked.includes(i)} dim={picked.length === need && !picked.includes(i)} onPress={() => toggle(i)} />
              </View>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <QuietButton testID="turn-end-discard-confirm" label="ยืนยันทิ้ง" primary disabled={picked.length !== need} style={{ flex: 1 }} onPress={() => onConfirm(picked)} />
            <QuietButton label="ยกเลิก" style={{ flex: 1 }} onPress={onCancel} />
          </View>
        </RitualSurface>
      </View>
    </Modal>
  );
}
