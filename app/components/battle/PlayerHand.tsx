import React from 'react';
import { View, Text, Pressable, Dimensions, ScrollView } from 'react-native';
import Card from '../Card';
import { font, palette, surface, layer } from '../../theme';
import { costWithRule } from '../../../src/core/cards/mechanics';

const { width: screenWidth } = Dimensions.get('window');

type CardItem = {
  id: string;
  instanceId?: string;
  name: string;
  [key: string]: any;
};

type Props = {
  cards: CardItem[];
  playedCardIds: string[];
  hoveredCardId: string | null;
  energy: number;
  /** เล่นการ์ดไปแล้วกี่ใบเทิร์นนี้ — การ์ดค่าร่ายลื่นใช้คำนวณเลขที่โชว์ */
  cardsPlayedThisTurn?: number;
  onPlayCard: (card: CardItem, index: number) => void;
  onHoverChange: (card: CardItem, isHovered: boolean) => void;
};

export default function PlayerHand({
  cards, playedCardIds, hoveredCardId, energy,
  cardsPlayedThisTurn = 0, onPlayCard, onHoverChange,
}: Props) {
  const [selected, setSelected] = React.useState<string | null>(null);
  const previewIndex = cards.findIndex(c => (c.instanceId ?? c.id) === selected);
  const preview = cards[previewIndex];
  const previewCost = preview ? costWithRule(preview as any, cardsPlayedThisTurn) : 0;
  const count = cards.length;
  const maxRotation = Math.min(25, count * 2.5);
  const centerIndex = (count - 1) / 2;

  let spacing: number;
  if (count <= 3) spacing = 100;
  else if (count <= 5) spacing = 70;
  else spacing = Math.max(50, (screenWidth - 40) / (count + 1));

  const wideHand = count > 5;
  const canvasW = wideHand ? count * 118 + 24 : screenWidth;
  return (
    <View style={{
      position: 'absolute', bottom: 120,
      left: 0, right: 0, height: 160,
      alignItems: 'center', justifyContent: 'flex-end',
    }}>
      {preview && <View style={{ position: 'absolute', bottom: 174, left: 16, right: 16, zIndex: layer.control, backgroundColor: surface.panelRaise, borderWidth: 3, borderColor: palette.ink, padding: 12, gap: 6 }}>
        <Text style={{ fontFamily: font.heading, color: palette.moon, fontSize: 17 }}>{preview.name} · พลัง {previewCost}</Text>
        <Text style={{ fontFamily: font.ui, color: palette.text, fontSize: 14 }}>{preview.desc}</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Pressable accessibilityRole="button" disabled={previewCost > energy} onPress={() => { onPlayCard(preview, previewIndex); setSelected(null); }} style={{ minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: palette.paperDeep, opacity: previewCost > energy ? 0.4 : 1 }}>
            <Text style={{ fontFamily: font.heading, color: palette.text }}>{previewCost > energy ? 'พลังไม่พอ' : 'ใช้การ์ด'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setSelected(null)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ fontFamily: font.ui, color: palette.text }}>ปิด</Text></Pressable>
        </View>
      </View>}
      <ScrollView horizontal scrollEnabled={wideHand} showsHorizontalScrollIndicator={wideHand} style={{ width: screenWidth, height: 164 }} contentContainerStyle={{ width: canvasW, height: 164 }}>
      <View style={{ width: canvasW, height: 164 }}>
      {cards.map((card, index) => {
        const offset = index - centerIndex;
        const rotation = wideHand ? 0 : centerIndex !== 0 ? (offset / centerIndex) * maxRotation : 0;
        const xOffset = offset * spacing;
        const identifier = card.instanceId ?? card.id;
        const isPlayed = playedCardIds.includes(identifier);
        // เลขที่โชว์กับเลขที่ใช้ตัดสินว่ากดได้ไหม ต้องมาจากสูตรเดียวกัน
        // ไม่งั้นการ์ดค่าร่ายลื่นจะโชว์ 0 แต่กดไม่ได้
        const costNow = costWithRule(card as any, cardsPlayedThisTurn);
        const isDisabled = costNow > energy;

        return (
          <View
            key={identifier}
            style={{
              position: 'absolute',
              bottom: 0,
              left: wideHand ? 12 + index * 118 : screenWidth / 2 + xOffset - 55,
              transform: [{ rotate: `${rotation}deg` }],
              zIndex: hoveredCardId === identifier ? 999 : index,
            }}
          >
            <Card
              card={card as any}
              width={110}
              height={140}
              onPress={() => setSelected(selected === identifier ? null : identifier)}
              selected={selected === identifier}
              onDragPlay={() => onPlayCard(card, index)}
              onHoverChange={(isHovered: boolean) => onHoverChange(card, isHovered)}
              isPlayed={isPlayed}
              disabled={isDisabled}
              animationDelay={index * 80}
              costNow={costNow}
            />
          </View>
        );
      })}
      </View>
      </ScrollView>
    </View>
  );
}
