// app/components/battle/MinionRow.tsx — ผีที่ถูกเรียกมาช่วยในไฟต์
//
// เล่นการ์ด "สร้างกุมาร" แล้วไม่มีอะไรบนจอเปลี่ยนเลย — grep ทั้งโฟลเดอร์ `app/`
// ไม่เจอคำว่า minion สักที่ ทั้งที่ engine เรียกผีมาให้จริงและมันทำงานอยู่ทุกเทิร์น
//
// **ไม่มีหลอดเลือด เพราะผีที่เรียกมาไม่มีเลือด** — `MinionData` ไม่มีฟิลด์ `hp`
// มันคือออร่าที่มีอายุ ไม่ใช่ตัวที่ยืนสู้ สิ่งที่ผู้เล่นต้องรู้จริงๆ คือ
// "มันทำอะไรให้" กับ "อยู่ได้อีกกี่เทิร์น" — สองอย่างนั้นคือสิ่งที่แถวนี้บอก
// (ข้อความบนการ์ดเคยเขียนว่ากุมารมี 8 HP และโจมตี 2 ซึ่งไม่จริงทั้งคู่ แก้แล้ว)

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { MinionData } from '../../../src/core/types_extended';
import { minionTemplateId, visibleMinions, minionSummary } from '../../../src/core/combat/minions/display';
import Art from '../Art';
import { font, palette, radius, size, space, surface, tint } from '../../theme';

type Props = {
  /** ผีทั้งไฟต์ ทั้งสองฝั่ง — แยกด้วย `owner` ตรงนี้ */
  minions?: MinionData[];
};

export default function MinionRow({ minions }: Props) {
  const all = visibleMinions(minions);
  const mine = all.filter(m => m.owner === 'player');
  const theirs = all.filter(m => m.owner === 'enemy');
  const [open, setOpen] = React.useState<string | null>(null);

  if (mine.length === 0 && theirs.length === 0) return null;

  const opened = [...mine, ...theirs].find(m => m.id === open);

  return (
    <View style={{ paddingHorizontal: space.md, gap: space.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {/* ซ้าย = ของเรา ขวา = ของศัตรู ตรงกับที่ตัวละครยืนอยู่บนจอ */}
        <Side list={mine} side="player" open={open} onOpen={setOpen} />
        <Side list={theirs} side="enemy" open={open} onOpen={setOpen} />
      </View>

      {!!opened && (
        <View style={{
          alignSelf: 'center', maxWidth: 280,
          paddingHorizontal: space.md, paddingVertical: space.xs,
          borderRadius: radius.sm,
          backgroundColor: surface.panelDeep,
          borderWidth: 1, borderColor: palette.line,
        }}>
          <Text style={{
            color: palette.textDim, fontSize: size.body,
            fontFamily: font.body, lineHeight: 20, textAlign: 'center',
          }}>
            {minionSummary(opened)}
          </Text>
        </View>
      )}
    </View>
  );
}

function Side({
  list, side, open, onOpen,
}: {
  list: MinionData[];
  side: 'player' | 'enemy';
  open: string | null;
  onOpen: (id: string | null) => void;
}) {
  const ours = side === 'player';

  return (
    <View style={{ flexDirection: 'row', gap: space.xs }}>
      {list.map(m => {
        const active = m.id === open;
        return (
          <Pressable
            key={m.id}
            onPress={() => onOpen(active ? null : m.id)}
            style={{
              alignItems: 'center', width: 58,
              paddingVertical: space.xs,
              borderRadius: radius.md,
              backgroundColor: active ? tint.moonPick : surface.glass,
              borderWidth: 1,
              borderColor: ours ? palette.line : tint.bloodLine,
            }}
          >
            <Art slot={`minion/${minionTemplateId(m.id)}`} width={34} height={34} compact />

            <Text
              numberOfLines={1}
              style={{
                color: ours ? palette.moon : palette.bloodLit,
                fontSize: size.tiny, fontFamily: font.uiMed,
                marginTop: 1, maxWidth: 54,
              }}
            >
              {m.name}
            </Text>

            {/* เลขเดียวที่มีความหมายจริงสำหรับผีที่เรียกมา */}
            <Text style={{ color: palette.textFaint, fontSize: size.tiny, fontFamily: font.ui }}>
              เหลือ {m.duration} เทิร์น
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
