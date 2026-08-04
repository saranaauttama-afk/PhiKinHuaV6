// app/components/battle/ComboStrip.tsx — คอมโบที่กำลังนับอยู่
//
// ระบบคอมโบทำงานอยู่จริงทุกครั้งที่เล่นการ์ด แต่บอกผลผ่าน `s.log.push()` อย่างเดียว
// ซึ่งไม่มีจอไหนแสดง — ผู้เล่นจึงติดคอมโบได้โดยไม่มีทางรู้ว่าติด ไม่รู้ว่าใกล้ติด
// และไม่มีทางเล่นหาคอมโบอย่างตั้งใจได้เลย
//
// แถบนี้ตอบสองคำถาม: **เหลืออีกกี่ใบ** กับ **ใบไหน**

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { GameState } from '../../../src/core/types';
import { COMBO_BY_ID, comboTarget } from '../../../src/core/combat/combos';
import { font, palette, radius, size, space, surface, tint } from '../../theme';

export default function ComboStrip({ state }: { state: GameState }) {
  const progress = state.combo?.progress ?? [];
  const done = state.combo?.done ?? [];
  const [open, setOpen] = React.useState<string | null>(null);

  if (progress.length === 0 && done.length === 0) return null;

  const opened = open ? COMBO_BY_ID[open] : undefined;
  const openedProgress = progress.find(p => p.comboId === open);

  return (
    <View style={{ alignItems: 'center', gap: space.xs }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, justifyContent: 'center' }}>
        {progress.map(p => {
          const combo = COMBO_BY_ID[p.comboId];
          if (!combo) return null;
          const target = comboTarget(combo);
          const active = p.comboId === open;

          return (
            <Pressable
              key={p.comboId}
              onPress={() => setOpen(active ? null : p.comboId)}
              hitSlop={6}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingHorizontal: space.sm, paddingVertical: 2,
                borderRadius: radius.pill,
                backgroundColor: active ? tint.moonPick : tint.moonFaint,
                borderWidth: 1, borderColor: palette.line,
              }}
            >
              <Text style={{ color: palette.moonDim, fontSize: size.tiny, fontFamily: font.uiMed }}>
                {combo.name}
              </Text>
              <Text style={{ color: palette.moon, fontSize: size.tiny, fontFamily: font.uiMed }}>
                {p.cardsPlayed.length}/{target}
              </Text>
            </Pressable>
          );
        })}

        {/* คอมโบที่ติดไปแล้วยังโชว์ไว้จางๆ — ผู้เล่นจะได้รู้ว่าอันนี้ใช้ไปแล้ว
            ไม่ต้องพยายามทำซ้ำในไฟต์เดียวกัน */}
        {done.map(id => {
          const combo = COMBO_BY_ID[id];
          if (!combo) return null;
          return (
            <View
              key={id}
              style={{
                paddingHorizontal: space.sm, paddingVertical: 2,
                borderRadius: radius.pill,
                backgroundColor: surface.glassDim,
                borderWidth: 1, borderColor: palette.line,
                opacity: 0.55,
              }}
            >
              <Text style={{ color: palette.textFaint, fontSize: size.tiny, fontFamily: font.ui }}>
                {combo.name} ✓
              </Text>
            </View>
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
            {opened.desc}
          </Text>
          {/* เหลือใบไหน — ข้อมูลที่ทำให้เล่นหาคอมโบได้จริง ไม่ใช่ติดโดยบังเอิญ */}
          {!!openedProgress && !!opened.requiredCards?.length && (
            <Text style={{
              color: palette.moonDim, fontSize: size.tiny,
              fontFamily: font.ui, textAlign: 'center', marginTop: 2,
            }}>
              เหลือ {opened.requiredCards.filter(id => !openedProgress.cardsPlayed.includes(id)).length} ใบ
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
