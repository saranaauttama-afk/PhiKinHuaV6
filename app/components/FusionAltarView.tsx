// app/components/FusionAltarView.tsx — หน้าแท่นผสานการ์ด
//
// เลือกการ์ดสองใบจากสำรับ ดูผลลัพธ์ก่อนตัดสินใจ แล้วค่อยยืนยัน
// ผลลัพธ์คำนวณด้วย `fuseCards` ตัวเดียวกับที่ engine ใช้จริง — ตัวเลขที่เห็น
// ก่อนกดจึงตรงกับการ์ดที่ได้เสมอ ไม่ใช่ตัวอย่างที่คำนวณคนละทาง

import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { CardData, Command, GameState } from '../../src/core/types';
import { canFuse, fuseCards, isFused, FUSION_MAX_TOTAL_COST } from '../../src/core/cards/fusion';
import { FUSIONS_PER_ALTAR } from '../../src/core/engine/handlers/fusion';

type Props = {
  state: GameState;
  dispatch: (cmd: Command) => void;
};

function CardChip({
  card, selected, disabled, onPress,
}: {
  card: CardData; selected: boolean; disabled: boolean; onPress: () => void;
}) {
  const bits = [
    card.dmg   ? `⚔${card.dmg}`   : '',
    card.block ? `🛡${card.block}` : '',
    card.heal  ? `♥${card.heal}`   : '',
    card.draw  ? `+${card.draw}ใบ` : '',
    card.energyGain ? `⚡${card.energyGain}` : '',
  ].filter(Boolean).join(' ');

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12,
        backgroundColor: selected ? 'rgba(255,216,138,0.22)' : 'rgba(0,0,0,0.4)',
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? 'rgba(255,216,138,0.8)' : 'rgba(255,255,255,0.18)',
        opacity: disabled ? 0.35 : 1,
        minWidth: 96,
      }}
    >
      <Text style={{ color: 'white', fontSize: 13, fontFamily: 'Prompt_600SemiBold' }}>
        {card.name}
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>
        ร่าย {card.cost}{bits ? ` · ${bits}` : ''}
      </Text>
    </Pressable>
  );
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
    <View style={{
      marginTop: 16, borderRadius: 16, padding: 16,
      backgroundColor: 'rgba(28,20,38,0.85)',
      borderWidth: 1, borderColor: 'rgba(196,181,253,0.3)',
    }}>
      <Text style={{ color: 'white', fontSize: 18, fontFamily: 'Prompt_700Bold' }}>
        แท่นผสาน
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 4 }}>
        รวมการ์ดสองใบเป็นใบเดียว จ่ายพลังงานครั้งเดียวได้ผลของทั้งสองใบ
        แลกกับการเลือกเล่นทีละใบไม่ได้อีก
      </Text>
      <Text style={{ color: 'rgba(196,181,253,0.9)', fontSize: 12, marginTop: 6 }}>
        ค่าร่ายรวมกันต้องไม่เกิน {FUSION_MAX_TOTAL_COST} · ผสานได้ {FUSIONS_PER_ALTAR} ครั้งต่อแท่น
        {spent ? ' · ใช้ไปแล้ว' : ''}
      </Text>

      {!spent && (
        <>
          <Text style={{
            color: 'white', fontSize: 14, marginTop: 14, marginBottom: 8,
            fontFamily: 'Prompt_600SemiBold',
          }}>
            เลือกการ์ดสองใบ ({picked.length}/2)
          </Text>

          <ScrollView style={{ maxHeight: 220 }}>
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
          </ScrollView>
        </>
      )}

      {/* ผลลัพธ์ล่วงหน้า — ตัวเลขตรงกับที่ engine จะสร้างจริง */}
      {check && !check.ok && (
        <Text style={{ color: '#fca5a5', fontSize: 13, marginTop: 12 }}>
          {check.reason}
        </Text>
      )}

      {preview && (
        <View style={{
          marginTop: 12, padding: 12, borderRadius: 12,
          backgroundColor: 'rgba(255,216,138,0.1)',
          borderWidth: 1, borderColor: 'rgba(255,216,138,0.35)',
        }}>
          <Text style={{ color: '#ffd88a', fontSize: 15, fontFamily: 'Prompt_700Bold' }}>
            {preview.name}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>
            ร่าย {preview.cost}
            {preview.dmg ? ` · โจมตี ${preview.dmg}` : ''}
            {preview.block ? ` · ป้องกัน ${preview.block}` : ''}
            {preview.heal ? ` · ฟื้น ${preview.heal}` : ''}
            {preview.draw ? ` · จั่ว ${preview.draw}` : ''}
            {preview.energyGain ? ` · พลังงาน +${preview.energyGain}` : ''}
          </Text>
          {!!preview.desc && (
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 }}>
              {preview.desc}
            </Text>
          )}
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 6 }}>
            สำรับ {deck.length} → {deck.length - 1} ใบ
          </Text>

          <Pressable
            onPress={() => {
              dispatch({ type: 'FuseCards', indexA: picked[0], indexB: picked[1] });
              setPicked([]);
            }}
            style={{
              marginTop: 10, alignSelf: 'flex-start',
              paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
              backgroundColor: 'rgba(255,216,138,0.28)',
              borderWidth: 1, borderColor: 'rgba(255,216,138,0.6)',
            }}
          >
            <Text style={{ color: '#ffd88a', fontFamily: 'Prompt_600SemiBold' }}>
              ผสาน
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
