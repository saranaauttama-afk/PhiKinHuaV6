// app/components/CardRow.tsx — "การ์ดใบนี้คืออะไร" เขียนไว้ที่เดียว
//
// ใช้ทั้งในหน้าสำรับ (นอกไฟต์) และหน้าดูกองการ์ด (ในไฟต์) — สองที่นี้ต้องอ่าน
// เหมือนกันเป๊ะ ไม่งั้นผู้เล่นต้องเรียนรู้สองแบบสำหรับข้อมูลชุดเดียวกัน

import {paperPalette as palette,paperSurface as surface,PaperTexture} from './Paper';
import React from 'react';
import InkIcon from './InkIcon';
import { Text, View } from 'react-native';
import type { CardData } from '../../src/core/types';
import { costLabel, describeCard, TYPE_LABEL } from '../../src/core/cards/describe';
import { starOf } from '../../src/core/cards/model';
import CardBadges from './CardBadges';
import UpgradeMarks from './UpgradeMarks';
import { font, radius, size, space, tint, paper } from '../theme';
import {cardTypeLabel} from '../../src/core/cards/typesRegistry';

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

type Props = {
  card: CardData;
  /** มีกี่ใบในกองนี้ — ไม่ส่งมาแปลว่าใบเดียว ไม่ต้องขึ้น ×n */
  count?: number;
  /** ใบนี้ใช้ไปแล้วในไฟต์นี้ (อยู่ในกองเผา) — วาดจางลงและติดป้าย */
  spent?: boolean;
  plain?: boolean;
};

export default function CardRow({ card, count, spent = false, plain = false }: Props) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'flex-start', gap: space.md,
      padding: space.md,
      borderRadius: radius.md,
      backgroundColor: plain ? 'transparent' : surface.panelSunk,
      borderWidth: plain ? 0 : 1,
      borderColor: spent ? palette.line : surface.panelWell,
      opacity: spent ? 0.45 : 1,
    }}>
      {!plain && <PaperTexture />}
      <View style={{minWidth:42}}><CardBadges card={{...card,star:1}} compact/></View>

      {!plain && <InkIcon name={card.type === 'attack' ? 'attack' : card.type === 'counter' ? 'trap' : 'blessing'} size={30} color={palette.blood} />}
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
          <Badge label={cardTypeLabel(card)} tone={card.type === 'curse' ? 'blood' : 'moon'} />
          {starOf(card) > 1 && <UpgradeMarks level={starOf(card)}/>}
          {spent && <Badge label="ใช้ไปแล้ว" tone="blood" />}
        </View>

        <Text style={{ color: palette.moonDim, fontSize: size.label, fontFamily: font.ui, marginTop: 2 }}>
          {describeCard(card)}
        </Text>

        {!!card.flavor && (
          <Text style={{
            color: plain ? paper.ink : palette.textFaint, fontSize: size.body,
            fontFamily: font.ui, marginTop: space.xs, lineHeight: 22,
          }}>
            {card.flavor}
          </Text>
        )}
      </View>
    </View>
  );
}
