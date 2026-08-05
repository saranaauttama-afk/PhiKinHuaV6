// app/components/CardRow.tsx — "การ์ดใบนี้คืออะไร" เขียนไว้ที่เดียว
//
// ใช้ทั้งในหน้าสำรับ (นอกไฟต์) และหน้าดูกองการ์ด (ในไฟต์) — สองที่นี้ต้องอ่าน
// เหมือนกันเป๊ะ ไม่งั้นผู้เล่นต้องเรียนรู้สองแบบสำหรับข้อมูลชุดเดียวกัน

import React from 'react';
import { Text, View } from 'react-native';
import type { CardData } from '../../src/core/types';
import { isFused } from '../../src/core/cards/fusion';
import { hitsOf, conditionLabel } from '../../src/core/cards/mechanics';
import { font, palette, radius, size, space, surface, tint } from '../theme';

/** ป้ายเล็กบอกคุณสมบัติพิเศษของใบนี้ */
function Badge({ label, tone = 'moon' }: { label: string; tone?: 'moon' | 'blood' }) {
  return (
    <View style={{
      paddingHorizontal: space.sm, paddingVertical: 1,
      borderRadius: radius.pill,
      backgroundColor: tone === 'blood' ? tint.bloodSoft : tint.moonSoft,
      borderWidth: 1,
      borderColor: tone === 'blood' ? tint.bloodLine : palette.line,
    }}>
      <Text style={{
        color: tone === 'blood' ? palette.blood : palette.moon,
        fontSize: size.tiny, fontFamily: font.uiMed,
      }}>
        {label}
      </Text>
    </View>
  );
}

function Chip({ label, tone = 'dim' }: { label: string; tone?: 'dim' | 'blood' | 'moon' }) {
  const color = tone === 'blood' ? palette.blood : tone === 'moon' ? palette.moonDim : palette.textDim;
  return (
    <Text style={{ color, fontSize: size.label, fontFamily: font.ui }}>{label}</Text>
  );
}

/** สรุปผลของการ์ดที่ค้างอยู่ในมือเป็นบรรทัดเดียว */
function heldLabel(card: CardData): string {
  const e = card.whileHeld!;
  const parts: string[] = [];
  if (e.block) parts.push(`กัน ${e.block}`);
  if (e.heal) parts.push(`ฟื้น ${e.heal}`);
  if (e.status) parts.push(`${e.status.effect} ${e.status.value}`);
  return `ค้างอยู่ในมือท้ายเทิร์น → ${parts.join(' · ')}`;
}

type Props = {
  card: CardData;
  /** มีกี่ใบในกองนี้ — ไม่ส่งมาแปลว่าใบเดียว ไม่ต้องขึ้น ×n */
  count?: number;
  /** ใบนี้ใช้ไปแล้วในไฟต์นี้ (อยู่ในกองเผา) — วาดจางลงและติดป้าย */
  spent?: boolean;
};

export default function CardRow({ card, count, spent = false }: Props) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'flex-start', gap: space.md,
      padding: space.md,
      borderRadius: radius.md,
      backgroundColor: surface.panelSunk,
      borderWidth: 1,
      borderColor: spent ? palette.line : surface.panelWell,
      opacity: spent ? 0.45 : 1,
    }}>
      {/* ค่าร่าย — อ่านเป็นเลขเดียวโดดๆ เหมือนมุมการ์ดจริง */}
      <View style={{
        width: 26, height: 26, borderRadius: radius.pill,
        backgroundColor: tint.moonFaint,
        borderWidth: 1, borderColor: palette.line,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ color: palette.moon, fontSize: size.ui, fontFamily: font.uiMed }}>
          {card.cost ?? 0}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' }}>
          <Text style={{ color: palette.text, fontSize: size.ui, fontFamily: font.uiMed }}>
            {card.name ?? card.id}
          </Text>
          {count != null && count > 1 && (
            <Text style={{ color: palette.moonDim, fontSize: size.ui, fontFamily: font.ui }}>
              ×{count}
            </Text>
          )}
          {/* ใบที่ใช้แล้วหายคือข้อมูลที่ต้องเห็นก่อนกด ไม่ใช่หลังกด */}
          {card.type === 'trap' && <Badge label="ตั้งดัก" />}
          {card.type === 'curse' && <Badge label="เล่นไม่ได้" tone="blood" />}
          {card.exhaust && card.type !== 'trap' && (
            <Badge label={spent ? 'ใช้ไปแล้ว' : 'ใช้แล้วหาย'} tone="blood" />
          )}
          {card.upgraded && <Badge label="ปลุกเสกแล้ว" />}
          {isFused(card) && <Badge label="ผสาน" />}
          {hitsOf(card) > 1 && <Badge label={`${hitsOf(card)} หมัด`} tone="blood" />}
          {!!card.whileHeld && <Badge label="ถือไว้ก็ทำงาน" />}
          {!!card.costRule && <Badge label="ยิ่งร่ายยิ่งถูก" />}
        </View>

        <View style={{ flexDirection: 'row', gap: space.md, marginTop: 2, flexWrap: 'wrap' }}>
          {!!card.dmg        && <Chip label={`โจมตี ${card.dmg}`} tone="blood" />}
          {!!card.block      && <Chip label={`กัน ${card.block}`} tone="moon" />}
          {!!card.heal       && <Chip label={`ฟื้น ${card.heal}`} tone="moon" />}
          {!!card.energyGain && <Chip label={`พลังงาน +${card.energyGain}`} />}
          {!!card.draw       && <Chip label={`จั่ว ${card.draw}`} />}
        </View>

        {/* เงื่อนไขต้องอ่านออกก่อนกด ไม่ใช่หลังกดแล้วงงว่าทำไมแรงไม่เท่าเดิม */}
        {!!card.conditional && (
          <Text style={{
            color: palette.moonDim, fontSize: size.label,
            fontFamily: font.ui, marginTop: 2,
          }}>
            {conditionLabel(card.conditional)}
          </Text>
        )}

        {!!card.whileHeld && (
          <Text style={{
            color: palette.moonDim, fontSize: size.label,
            fontFamily: font.ui, marginTop: 2,
          }}>
            {heldLabel(card)}
          </Text>
        )}

        {!!card.desc && (
          <Text style={{
            color: palette.textFaint, fontSize: size.body,
            fontFamily: font.body, marginTop: space.xs, lineHeight: 22,
          }}>
            {card.desc}
          </Text>
        )}
      </View>
    </View>
  );
}
