import React from 'react';
import { View, Dimensions } from 'react-native';
import Card from '../Card';
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
  const count = cards.length;
  const maxRotation = Math.min(25, count * 2.5);
  const centerIndex = (count - 1) / 2;

  let spacing: number;
  if (count <= 3) spacing = 100;
  else if (count <= 5) spacing = 70;
  else spacing = Math.max(50, (screenWidth - 40) / (count + 1));

  return (
    <View style={{
      position: 'absolute', bottom: 120,
      left: 0, right: 0, height: 160,
      alignItems: 'center', justifyContent: 'flex-end',
    }}>
      {cards.map((card, index) => {
        const offset = index - centerIndex;
        const rotation = centerIndex !== 0 ? (offset / centerIndex) * maxRotation : 0;
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
              left: screenWidth / 2 + xOffset - 55,
              transform: [{ rotate: `${rotation}deg` }],
              zIndex: hoveredCardId === identifier ? 999 : index,
            }}
          >
            <Card
              card={card as any}
              width={110}
              height={140}
              onPress={() => {}}
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
  );
}
