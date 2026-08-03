// app/components/BlessingView.tsx — พรติดตัวที่สะสมมาทั้งรัน
//
// `state.blessings` ไม่เคยถูกแสดงที่ไหนเลย ทั้งบนแผนที่และในไฟต์ ทั้งที่วัดจริง
// แล้วรันหนึ่งได้พร **4-9 อย่าง** และพรทุกอย่างส่งผลต่อการต่อสู้ตลอดเวลา —
// ผู้เล่นตัดสินใจโดยไม่รู้ว่าตัวเองถืออะไรอยู่มาตลอด
//
// พรซ้ำเกิดขึ้นจริงและบ่อย (วัดได้ 2 ใบซ้ำต่อรัน) จึงรวมเป็น ×n
// **ตอนนี้พรซ้ำผลซ้อนกัน** — "ผีป้องกัน" สองใบได้ Block 4 ต่อการ์ดโจมตี
// ซึ่งไม่ได้ตั้งใจออกแบบไว้ แต่ยังไม่แก้ในรอบนี้ หน้านี้อย่างน้อยทำให้เห็นมัน

import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { BlessingDef } from '../../src/core/types';
import { groupBlessings } from '../../src/core/blessing/group';
import Art from './Art';
import { GameButton } from './Panel';
import { font, palette, radius, size, space, surface } from '../theme';

type Props = {
  blessings?: BlessingDef[];
  onClose: () => void;
};

export default function BlessingView({ blessings, onClose }: Props) {
  const list = blessings ?? [];
  const rows = groupBlessings(list);

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
        <View>
          <Text style={{ color: palette.moon, fontSize: size.title, fontFamily: font.display }}>
            พรติดตัว
          </Text>
          <Text style={{ color: palette.textDim, fontSize: size.ui, fontFamily: font.ui }}>
            ทั้งหมด {list.length} อย่าง
          </Text>
        </View>
        <GameButton label="ปิด" onPress={onClose} />
      </View>

      <ScrollView contentContainerStyle={{
        paddingHorizontal: space.xl, paddingBottom: space.xxl, gap: space.sm,
      }}>
        {rows.length === 0 ? (
          <Text style={{
            color: palette.textDim, fontSize: size.bodyLg, fontFamily: font.body,
            textAlign: 'center', paddingVertical: space.xxl, lineHeight: 28,
          }}>
            ยังไม่มีพรติดตัว{'\n'}พรได้จากศาลระหว่างทาง เหตุการณ์ และตอนเลเวลอัป
          </Text>
        ) : (
          rows.map(({ blessing: b, count }) => (
            <View
              key={b.id ?? b.name}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: space.md,
                padding: space.md, borderRadius: radius.md,
                backgroundColor: surface.panelSunk,
                borderWidth: 1, borderColor: surface.panelWell,
              }}
            >
              <Art slot={`blessing/${b.id}`} width={44} height={44} compact />

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                  <Text style={{ color: palette.moon, fontSize: size.ui, fontFamily: font.uiMed }}>
                    {b.name ?? b.id}
                  </Text>
                  {count > 1 && (
                    <Text style={{ color: palette.moonDim, fontSize: size.ui, fontFamily: font.ui }}>
                      ×{count}
                    </Text>
                  )}
                </View>
                {!!b.desc && (
                  <Text style={{
                    color: palette.textFaint, fontSize: size.body,
                    fontFamily: font.body, marginTop: 2, lineHeight: 22,
                  }}>
                    {b.desc}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
