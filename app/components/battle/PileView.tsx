// app/components/battle/PileView.tsx — กองการ์ดระหว่างไฟต์
//
// เกมการ์ดแนวนี้ตัดสินใจจาก "อะไรเหลืออยู่" ไม่ใช่แค่ "อะไรอยู่บนมือ" — จะทุ่ม
// พลังงานเทิร์นนี้หรือเก็บไว้ ขึ้นกับว่าใบที่รออยู่ในกองจั่วมีอะไรบ้าง
//
// สำคัญที่สุดคือ **กองเผา**: การ์ด 6 ใบในเกมนี้เล่นแล้วหายไปจากไฟต์เลย
// (คำอธิบายเขียน "ใช้ได้ครั้งเดียว" ไว้) แต่ก่อนหน้านี้ผู้เล่นไม่มีทางรู้ว่า
// ใช้ไปแล้วหรือยัง ต้องจำเอง
//
// **กองจั่วเรียงตามชื่อ ไม่ใช่ตามลำดับจริง** — บอกลำดับที่จะจั่วเท่ากับยกเลิก
// การสับไพ่ทิ้ง ที่นี่ตอบว่า "เหลืออะไรบ้าง" ไม่ใช่ "ใบไหนมาก่อน"

import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { CardData, DeckPiles } from '../../../src/core/types';
import { groupCards } from '../../../src/core/cards/group';
import CardRow from '../CardRow';
import { GameButton } from '../Panel';
import { font, palette, radius, size, space, surface, tint } from '../../theme';

export type PileId = 'draw' | 'discard' | 'exhaust' | 'all';

const PILE_ORDER: PileId[] = ['draw', 'discard', 'exhaust', 'all'];

const PILE_LABEL: Record<PileId, string> = {
  draw:    'กองจั่ว',
  discard: 'กองทิ้ง',
  exhaust: 'กองเผา',
  all:     'ทั้งสำรับ',
};

const PILE_HINT: Record<PileId, string> = {
  draw:    'เรียงตามชื่อ ไม่ใช่ลำดับที่จะจั่ว',
  discard: 'จั่วจนหมดกองแล้วจะถูกสับกลับเป็นกองจั่ว',
  exhaust: 'ออกจากไฟต์นี้ไปแล้ว จะไม่กลับมาอีก',
  all:     'สำรับถาวรของรันนี้ รวมใบที่อยู่บนมือและในทุกกอง',
};

type Props = {
  piles: DeckPiles;
  /** สำรับถาวรของรัน — แท็บ "ทั้งสำรับ" */
  deck: CardData[];
  /** กองที่เปิดอยู่ — `null` แปลว่าปิด */
  open: PileId | null;
  onChangePile: (pile: PileId) => void;
  onClose: () => void;
};

export default function PileView({ piles, deck, open, onChangePile, onClose }: Props) {
  if (!open) return null;

  const cardsIn = (id: PileId): CardData[] =>
    id === 'all' ? deck : (piles[id] ?? []);

  const rows = groupCards(cardsIn(open));
  const total = cardsIn(open).length;

  return (
    <View style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: palette.scrimFull,
      zIndex: 2000,
    }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: space.xl, paddingTop: 56, paddingBottom: space.md,
      }}>
        <Text style={{ color: palette.moon, fontSize: size.title, fontFamily: font.display }}>
          กองการ์ด
        </Text>
        <GameButton label="ปิด" onPress={onClose} />
      </View>

      {/* สลับกองได้ในจอเดียว — ปิดแล้วเปิดใหม่ทุกครั้งที่อยากเทียบคือความรำคาญ */}
      <View style={{
        flexDirection: 'row', gap: space.sm,
        paddingHorizontal: space.xl, paddingBottom: space.md,
      }}>
        {PILE_ORDER.map(id => {
          const active = id === open;
          return (
            <Pressable
              key={id}
              onPress={() => onChangePile(id)}
              style={{
                flex: 1, alignItems: 'center',
                paddingVertical: space.sm, borderRadius: radius.md,
                backgroundColor: active ? tint.moonSoft : surface.panelSunk,
                borderWidth: 1,
                borderColor: active ? palette.lineStrong : palette.line,
              }}
            >
              <Text style={{
                color: active ? palette.moon : palette.textDim,
                fontSize: size.ui, fontFamily: font.uiMed,
              }}>
                {PILE_LABEL[id]}
              </Text>
              <Text style={{
                color: active ? palette.moonDim : palette.textFaint,
                fontSize: size.label, fontFamily: font.ui,
              }}>
                {cardsIn(id).length}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={{
        color: palette.textFaint, fontSize: size.label, fontFamily: font.ui,
        paddingHorizontal: space.xl, marginBottom: space.sm,
      }}>
        {PILE_HINT[open]}
      </Text>

      <ScrollView contentContainerStyle={{
        paddingHorizontal: space.xl, paddingBottom: space.xxl, gap: space.sm,
      }}>
        {total === 0 ? (
          <Text style={{
            color: palette.textDim, fontSize: size.bodyLg, fontFamily: font.body,
            textAlign: 'center', paddingVertical: space.xxl,
          }}>
            ไม่มีการ์ดใน{PILE_LABEL[open]}
          </Text>
        ) : (
          rows.map(r => (
            <CardRow
              key={r.card.id}
              card={r.card}
              count={r.count}
              spent={open === 'exhaust'}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
