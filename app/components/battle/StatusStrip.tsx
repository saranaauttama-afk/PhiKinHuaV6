// app/components/battle/StatusStrip.tsx — สถานะที่ติดอยู่บนตัว ใช้ได้ทั้งสองฝั่ง
//
// ข้อมูลชุดนี้พร้อมใช้มาตลอด — สถานะ 13 อย่างในทะเบียนมีชื่อไทยและคำอธิบายไทย
// ครบทุกตัว เก็บอยู่ใน `player.statusEffects` / `enemy.statusEffects` พร้อมจำนวน
// ชั้นและเทิร์นที่เหลือ แต่ไม่เคยมีจอไหนแสดง `MonsterArea` ถึงกับประกาศ prop
// `statusEffects` ไว้แล้วไม่เคยเรนเดอร์มันเลย
//
// **ดีบัฟขึ้นก่อนบัฟเสมอ** — สิ่งที่กำลังทำร้ายเราต้องเห็นก่อนสิ่งที่ช่วยเรา
//
// สีมีสองสีตามระบบ: ดีบัฟแดงเลือดหมู บัฟทองแสงจันทร์ ไม่แจกสีรายสถานะ
// (13 สถานะ = 13 สี คือทางกลับไปเป็นแดชบอร์ดเว็บ)

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { StatusEffect } from '../../../src/core/types_extended';
import { sortForDisplay, isDebuff } from '../../../src/core/combat/statusDisplay';
import { font, palette, radius, size, space, surface, tint } from '../../theme';

type Props = {
  effects?: StatusEffect[];
  /** ขนาดเล็กลงสำหรับฝั่งศัตรูที่พื้นที่แคบกว่า */
  compact?: boolean;
  align?: 'center' | 'flex-start';
};

export default function StatusStrip({ effects, compact = false, align = 'center' }: Props) {
  const list = sortForDisplay(effects ?? []);
  /** สถานะที่แตะค้างดูคำอธิบายอยู่ */
  const [open, setOpen] = React.useState<string | null>(null);

  if (list.length === 0) return null;

  const opened = list.find(e => e.id === open);

  return (
    <View style={{ alignItems: align, gap: space.xs }}>
      <View style={{
        flexDirection: 'row', flexWrap: 'wrap', gap: space.xs,
        justifyContent: align === 'center' ? 'center' : 'flex-start',
      }}>
        {list.map(e => {
          const bad = isDebuff(e);
          const active = e.id === open;
          return (
            <Pressable
              key={e.id}
              onPress={() => setOpen(active ? null : e.id)}
              hitSlop={6}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 3,
                paddingHorizontal: compact ? 5 : space.sm,
                paddingVertical: compact ? 1 : 2,
                borderRadius: radius.pill,
                backgroundColor: active
                  ? (bad ? tint.bloodHint : tint.moonPick)
                  : (bad ? tint.bloodSoft : tint.moonSoft),
                borderWidth: 1,
                borderColor: bad ? tint.bloodLine : palette.line,
              }}
            >
              <Text style={{
                color: bad ? palette.bloodLit : palette.moon,
                fontSize: compact ? size.tiny : size.label,
                fontFamily: font.uiMed,
              }}>
                {e.name}
              </Text>

              {/* จำนวนชั้นขึ้นเมื่อซ้อนกันจริงเท่านั้น ชั้นเดียวไม่ต้องเขียน ×1 */}
              {(e.stacks ?? 1) > 1 && (
                <Text style={{
                  color: bad ? palette.bloodLit : palette.moon,
                  fontSize: compact ? size.tiny : size.label,
                  fontFamily: font.uiMed,
                }}>
                  ×{e.stacks}
                </Text>
              )}

              {/* เทิร์นที่เหลือคือข้อมูลที่ใช้ตัดสินใจจริง — จะทนอีกเทิร์นหรือรีบแก้ */}
              <Text style={{
                color: palette.textFaint,
                fontSize: size.tiny, fontFamily: font.ui,
              }}>
                {e.duration >= 99 ? 'ตลอดไฟต์' : `${e.duration}ท`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!!opened && (
        <View style={{
          maxWidth: 260,
          paddingHorizontal: space.md, paddingVertical: space.xs,
          borderRadius: radius.sm,
          backgroundColor: surface.panelDeep,
          borderWidth: 1, borderColor: palette.line,
        }}>
          <Text style={{
            color: palette.textDim, fontSize: size.body,
            fontFamily: font.body, lineHeight: 20, textAlign: 'center',
          }}>
            {opened.description}
          </Text>
        </View>
      )}
    </View>
  );
}
