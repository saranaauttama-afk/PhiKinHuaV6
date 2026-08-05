import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import type { CardData } from '../../../src/core/types';
import CardRow from '../CardRow';
import { palette, surface, tint, font, size, space, radius, layer } from '../../theme';

/**
 * เลือกการ์ดรางวัลหลังชนะไฟต์
 *
 * ตัวเลขสำรับอยู่บนหน้าจอตลอด เพราะการเลือกการ์ดโดยไม่รู้ว่าสำรับมีกี่ใบ
 * คือการเลือกแบบไม่มีข้อมูล — สำรับใหญ่ขึ้นหนึ่งใบคือโอกาสจั่วเจอใบที่ต้องการ
 * ลดลงทุกใบ ปุ่ม "ไม่เอาสักใบ" จึงไม่ใช่ปุ่มยอมแพ้ มันเป็นทางเลือกจริง
 * และวางให้เห็นชัดพอๆ กับการ์ด
 */

type Props = {
  choices: CardData[];
  /** สำรับตอนนี้ — ใช้ทั้งนับจำนวนและบอกว่ามีใบนี้อยู่แล้วกี่ใบ */
  deck: CardData[];
  onChoose: (index: number) => void;
  onSkip: () => void;
};

export default function CardRewardOverlay({ choices, deck, onChoose, onSkip }: Props) {
  const ownedCount = (id: string) => deck.filter(c => c.id === id).length;

  return (
    <View style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: palette.scrimHeavy,
      justifyContent: 'center', paddingHorizontal: space.xl,
      zIndex: layer.overlay,
    }}>
      <Text style={{
        color: palette.moon, fontSize: size.display, textAlign: 'center',
        fontFamily: font.display, marginBottom: space.xs,
      }}>
        ของที่เก็บได้
      </Text>

      <Text style={{
        color: palette.textFaint, fontSize: size.label,
        fontFamily: font.ui, textAlign: 'center', marginBottom: space.lg,
      }}>
        สำรับตอนนี้ {deck.length} ใบ · หยิบแล้วจะเป็น {deck.length + 1} ใบ
      </Text>

      <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: space.md }}>
        {choices.map((card, i) => (
          <Pressable key={card.instanceId ?? `${card.id}-${i}`} onPress={() => onChoose(i)}>
            <CardRow card={card} />
            {ownedCount(card.id) > 0 && (
              <Text style={{
                color: palette.moonDim, fontSize: size.tiny,
                fontFamily: font.ui, marginTop: 2, marginLeft: space.md,
              }}>
                มีอยู่แล้ว {ownedCount(card.id)} ใบ
              </Text>
            )}
          </Pressable>
        ))}
      </ScrollView>

      <Pressable
        onPress={onSkip}
        style={{
          marginTop: space.xl, alignSelf: 'center',
          paddingVertical: space.md, paddingHorizontal: space.xxl,
          borderRadius: radius.md,
          backgroundColor: surface.panel,
          borderWidth: 1, borderColor: palette.line,
        }}
      >
        <Text style={{ color: palette.textDim, fontSize: size.ui, fontFamily: font.uiMed }}>
          ไม่เอาสักใบ
        </Text>
      </Pressable>

      <Text style={{
        color: palette.textFaint, fontSize: size.tiny,
        fontFamily: font.ui, textAlign: 'center', marginTop: space.sm,
      }}>
        สำรับเล็กคือสำรับที่จั่วเจอใบที่ต้องการบ่อยกว่า
      </Text>
    </View>
  );
}
