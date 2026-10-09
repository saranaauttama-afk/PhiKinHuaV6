// app/components/FusionAltarView.tsx — หน้าแท่นผสานการ์ด
//
// เลือกการ์ดสองใบจากสำรับ ดูผลลัพธ์ก่อนตัดสินใจ แล้วค่อยยืนยัน
// ผลลัพธ์คำนวณด้วย `fuseCards` ตัวเดียวกับที่ engine ใช้จริง — ตัวเลขที่เห็น
// ก่อนกดจึงตรงกับการ์ดที่ได้เสมอ ไม่ใช่ตัวอย่างที่คำนวณคนละทาง

import {palette,surface} from '../theme';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { CardData, Command, GameState } from '../../src/core/types';
import { canFuse, fuseCards, isFused, FUSION_MAX_TOTAL_COST } from '../../src/core/cards/fusion';
import { FUSIONS_PER_ALTAR } from '../../src/core/engine/handlers/fusion';
import RitualSurface from './RitualSurface';
import {QuietButton} from './QuietChrome';
import {CardGlyphArt,CardFace} from './DeckCard';
import CandleSelection from './CandleSelection';
import { font, radius, size, space, tint } from '../theme';

type Props = {
  state: GameState;
  dispatch: (cmd: Command) => void;
};

function CardChip({card,selected,disabled,onPress}:{card:CardData;selected:boolean;disabled:boolean;onPress:()=>void}) {
 return <Pressable accessibilityRole="button" accessibilityLabel={`ผสาน ${card.name}`} accessibilityState={{selected,disabled}} onPress={onPress} disabled={disabled} style={{width:'48%',opacity:disabled?.35:1}}><CandleSelection selected={selected}><CardFace card={card}/></CandleSelection></Pressable>;
}

export default function FusionAltarView({ state, dispatch }: Props) {
  const [picked, setPicked] = React.useState<number[]>([]);

  const deck = state.masterDeck ?? [];
  const used = state.fusionAltar?.timesUsed ?? 0;
  const spent = used >= FUSIONS_PER_ALTAR;

  // ผสานเสร็จแล้วสำรับเปลี่ยน index ที่เลือกไว้จึงไม่มีความหมายอีก
  React.useEffect(() => {
    if (spent) setPicked([]);
  }, [spent]);

  const toggle = (i: number) => {
    setPicked(prev =>
      prev.includes(i) ? prev.filter(x => x !== i)
      : prev.length >= 2 ? [prev[1], i]   // เลือกใบที่สาม = แทนที่ใบเก่าสุด
      : [...prev, i]
    );
  };

  const a = deck[picked[0]];
  const b = deck[picked[1]];
  const check = picked.length === 2 ? canFuse(a, b) : null;
  const preview = check?.ok ? fuseCards(a, b) : null;

  return (
    <RitualSurface kind="quietSlate" style={{marginTop:8,padding:20}}>
      <Text style={{fontFamily:font.heading,fontSize:24,color:palette.text}}>แท่นผสาน</Text>
      <Text style={{
        color: palette.textDim, fontSize: 14,
        fontFamily: font.ui, lineHeight: 23,
      }}>
        รวมการ์ดสองใบเป็นใบเดียว จ่ายพลังงานครั้งเดียวได้ผลของทั้งสองใบ
        แลกกับการเลือกเล่นทีละใบไม่ได้อีก
      </Text>
      <Text style={{ color: palette.moonDim, fontSize: size.label, marginTop: space.sm, fontFamily: font.ui }}>
        ค่าร่ายรวมกันต้องไม่เกิน {FUSION_MAX_TOTAL_COST} · ผสานได้ {FUSIONS_PER_ALTAR} ครั้งต่อแท่น
        {spent ? ' · ใช้ไปแล้ว' : ''}
      </Text>

      {!spent && (
        <>
          <Text style={{
            color: palette.text, fontSize: size.ui, marginTop: space.lg, marginBottom: space.sm,
            fontFamily: font.heading,
          }}>
            เลือกการ์ดสองใบ ({picked.length}/2)
          </Text>

          <View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {deck.map((card, i) => (
                <CardChip
                  key={`${card.id}-${i}`}
                  card={card}
                  selected={picked.includes(i)}
                  // ใบที่ผสานแล้วหรือเครื่องราง เลือกไม่ได้ตั้งแต่แรก
                  disabled={isFused(card) || card.type === 'equipment'}
                  onPress={() => toggle(i)}
                />
              ))}
            </View>
          </View>
        </>
      )}

      {/* ผลลัพธ์ล่วงหน้า — ตัวเลขตรงกับที่ engine จะสร้างจริง */}
      {check && !check.ok && (
        <Text style={{ color: palette.blood, fontSize: size.ui, marginTop: space.md, fontFamily: font.ui }}>
          {check.reason}
        </Text>
      )}

      {preview && (
        <View style={{
          marginTop: 12, padding: 12, borderRadius: 0,
          backgroundColor: tint.moonFaint,
          borderWidth: 1, borderColor: palette.lineStrong,
        }}>
          <Text style={{ color: palette.moon, fontSize: size.heading, fontFamily: font.display }}>
            {preview.name}
          </Text>
          <Text style={{ color: palette.text, fontSize: size.label, marginTop: 4, fontFamily: font.ui }}>
            ร่าย {preview.cost}
            {preview.dmg ? ` · โจมตี ${preview.dmg}` : ''}
            {preview.block ? ` · ป้องกัน ${preview.block}` : ''}
            {preview.heal ? ` · ฟื้น ${preview.heal}` : ''}
            {preview.draw ? ` · จั่ว ${preview.draw}` : ''}
            {preview.energyGain ? ` · พลังงาน +${preview.energyGain}` : ''}
          </Text>
          {!!preview.desc && (
            <Text style={{ color: palette.textDim, fontSize: 14, lineHeight:23, marginTop: 4, fontFamily: font.ui }}>
              {preview.desc}
            </Text>
          )}
          <Text style={{ color: palette.textFaint, fontSize: 11, marginTop: space.sm, fontFamily: font.ui }}>
            สำรับ {deck.length} → {deck.length - 1} ใบ
          </Text>

          <QuietButton
            label="ผสาน"
            primary
            onPress={() => {
              dispatch({ type: 'FuseCards', indexA: picked[0], indexB: picked[1] });
              setPicked([]);
            }}
            style={{ marginTop: space.md, alignSelf: 'flex-start' }}
          />
        </View>
      )}
    </RitualSurface>
  );
}
