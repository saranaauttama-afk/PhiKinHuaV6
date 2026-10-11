// app/components/battle/TrapRow.tsx — กับดักที่ตั้งไว้แล้วยังไม่ทำงาน
//
// **ผู้เล่นต้องเห็นกับดักของตัวเองตลอด** — การซ่อนมันไม่ได้เพิ่มความลึกอะไร
// มันแค่ทำให้ลืมว่าตั้งอะไรไว้ แล้วการตั้งดักก็กลายเป็นการเดาแทนที่จะเป็นแผน
// (สิ่งที่ควรซ่อนคือให้ศัตรูไม่รู้ ซึ่งศัตรูเป็น AI อยู่แล้ว)

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { ArmedTrap } from '../../../src/core/combat/traps';
import { font, palette, radius, size, space, surface, tint } from '../../theme';

const TRIGGER_LABEL: Record<ArmedTrap['trigger'], string> = {
  enemy_attack: 'รอท่าโจมตี',
  enemy_skill: 'รอท่าตั้งรับ',
  enemy_any: 'รอทุกท่า',
};

export default function TrapRow({ traps }: { traps?: ArmedTrap[] }) {
  const list = traps ?? [];
  const [open, setOpen] = React.useState<string | null>(null);

  if (list.length === 0) return null;

  const opened = list.find(t => t.cardId === open);

  return (
    <View style={{ alignItems: 'center', gap: space.xs }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, justifyContent: 'center' }}>
        {list.map(t => {
          const active = t.cardId === open;
          return (
            <Pressable
              key={t.cardId}
              onPress={() => setOpen(active ? null : t.cardId)}
              hitSlop={6}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingHorizontal: space.sm, paddingVertical: 2,
                borderRadius: radius.pill,
                backgroundColor: active ? tint.moonPick : surface.glass,
                borderWidth: 1, borderColor: palette.lineStrong,
              }}
            >
              <Text style={{ color: palette.moon, fontSize: size.tiny, fontFamily: font.uiMed }}>
                {t.name}
              </Text>
              <Text style={{ color: palette.textFaint, fontSize: size.tiny, fontFamily: font.ui }}>
                {TRIGGER_LABEL[t.trigger]}
                {t.turnsLeft != null ? ` · ${t.turnsLeft}ท` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!!opened && (
        <View style={{
          maxWidth: 280,
          paddingHorizontal: space.md, paddingVertical: space.xs,
          borderRadius: radius.sm,
          backgroundColor: surface.panelDeep,
          borderWidth: 1, borderColor: palette.line,
        }}>
          <Text style={{
            color: palette.textDim, fontSize: size.body,
            fontFamily: font.body, lineHeight: 20, textAlign: 'center',
          }}>
            {opened.effects.map(e => e.desc).join(' · ')}
          </Text>
        </View>
      )}
    </View>
  );
}
