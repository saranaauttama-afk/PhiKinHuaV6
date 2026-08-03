import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import type { CardData, GameState } from '../../../src/core/types';
import CardRow from '../CardRow';
import { palette, surface, tint, font, size, space } from '../../theme';

/**
 * หน้าเลือกรางวัลตอนเลเวลอัป
 *
 * engine เตรียม state.levelUp ไว้ให้ตั้งแต่แรกแล้ว (ทั้งคู่ตัวเลือกและการ์ด/พรที่สุ่มมา)
 * แต่ก่อนหน้านี้ไม่มี UI — phase 'levelup' ถูก VictoryOverlay กลืนไป
 * ผู้เล่นจึงไม่เคยได้เลือกเลย
 */

/** คำอธิบายของแต่ละตัวเลือก — ตรงกับ applyBucketChoice ใน handlers/level.ts */
const BUCKET_LABEL: Record<string, { title: string; detail: string }> = {
  max_hp:         { title: 'พลังชีวิต',      detail: 'เพิ่มพลังชีวิตสูงสุด 8 และฟื้นทันที 8' },
  max_energy:     { title: 'พลังงาน',        detail: 'เพิ่มพลังงานต่อเทิร์น 1' },
  max_hand:       { title: 'ขนาดมือ',        detail: 'จั่วการ์ดได้มากขึ้น 1 ใบต่อเทิร์น' },
  cards:          { title: 'การ์ดใหม่',      detail: 'เลือกการ์ดเข้าสำรับ 1 ใบ' },
  blessing:       { title: 'พร',             detail: 'รับพรติดตัว 1 อย่าง' },
  remove:         { title: 'สละการ์ด',       detail: 'ถอดการ์ดออกจากสำรับ' },
  upgrade:        { title: 'ปลุกเสก',        detail: 'อัปเกรดการ์ดในสำรับ' },
  gold:           { title: 'ทรัพย์',         detail: 'รับทองเพิ่ม' },
  equipment_slot: { title: 'ช่องเครื่องราง', detail: 'พกเครื่องรางได้มากขึ้น 1 ชิ้น' },
  gold_skip:      { title: 'ข้ามรับทอง',     detail: 'ไม่รับอะไร แลกกับทอง' },
};

const labelOf = (bucket: string) =>
  BUCKET_LABEL[bucket] ?? { title: bucket, detail: '' };

/** ตัวเลือกที่ต้องเลือกของย่อยอีกชั้น (การ์ด/พร) */
const NEEDS_PICK = new Set(['cards', 'blessing']);

type Props = {
  state: GameState;
  playerLevel: number;
  onChoose: (option: 'A' | 'B', index?: number) => void;
  onSkip: () => void;
};

export default function LevelUpOverlay({ state, playerLevel, onChoose, onSkip }: Props) {
  const choice = state.levelUp?.choice;
  // ตัวเลือกไหนที่ผู้เล่นกดค้างไว้เพื่อเลือกของย่อยต่อ
  const [pending, setPending] = React.useState<'A' | 'B' | null>(null);

  if (!choice) return null;

  const bucketOf = (opt: 'A' | 'B') => (opt === 'A' ? choice.optionA : choice.optionB);

  const deck = state.masterDeck ?? [];
  /** ในสำรับตอนนี้มีการ์ด id นี้อยู่กี่ใบ */
  const ownedCount = (id: string) => deck.filter(c => c.id === id).length;

  type SubChoice = {
    key: string;
    title: string;
    detail: string;
    /** ตัวเลือกที่เป็นการ์ดจริง — แสดงเต็มใบแทนที่จะเป็นแค่ชื่อ */
    card?: CardData;
  };

  const subChoices = (opt: 'A' | 'B'): SubChoice[] => {
    const bucket = bucketOf(opt);
    if (bucket === 'cards') {
      return (state.levelUp?.cardChoices ?? []).map((c, i) => ({
        key: c.instanceId ?? `${c.id}-${i}`,
        title: c.name,
        detail: c.desc ?? '',
        card: c,
      }));
    }
    if (bucket === 'blessing') {
      return (state.levelUp?.blessingChoices ?? []).map((b, i) => ({
        key: b.id ?? `${i}`,
        title: b.name ?? b.id,
        detail: b.desc ?? '',
      }));
    }
    return [];
  };

  const press = (opt: 'A' | 'B') => {
    if (NEEDS_PICK.has(bucketOf(opt)) && subChoices(opt).length > 0) {
      setPending(opt);   // ต้องเลือกของย่อยก่อน
      return;
    }
    onChoose(opt);
  };

  return (
    <View style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: palette.scrimHeavy,
      justifyContent: 'center', paddingHorizontal: 22,
      zIndex: 1000,
    }}>
      <Text style={{
        color: palette.moon, fontSize: 24, textAlign: 'center',
        fontFamily: 'Prompt_700Bold', marginBottom: 4,
      }}>
        เลเวล {playerLevel}
      </Text>
      <Text style={{
        color: palette.textDim, fontSize: 14,
        textAlign: 'center', marginBottom: 18,
      }}>
        {pending ? 'เลือกหนึ่งอย่าง' : choice.contextDescription || 'เลือกทางเดินของคุณ'}
      </Text>

      {pending === null ? (
        <View style={{ gap: 14 }}>
          {(['A', 'B'] as const).map(opt => {
            const l = labelOf(bucketOf(opt));
            return (
              <Pressable
                key={opt}
                onPress={() => press(opt)}
                style={{
                  padding: 18, borderRadius: 16,
                  backgroundColor: surface.panel,
                  borderWidth: 1, borderColor: palette.lineStrong,
                }}
              >
                <Text style={{ color: palette.moon, fontSize: 18, fontFamily: 'Prompt_600SemiBold' }}>
                  {l.title}
                </Text>
                {!!l.detail && (
                  <Text style={{ color: palette.textDim, fontSize: 14, marginTop: 4 }}>
                    {l.detail}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View>
          {/* เลือกการ์ดโดยไม่รู้ว่าสำรับมีกี่ใบคือการเลือกแบบไม่มีข้อมูล
              สำรับใหญ่ขึ้นหนึ่งใบ = โอกาสจั่วเจอใบที่ต้องการลดลงทุกใบ */}
          {bucketOf(pending) === 'cards' && (
            <Text style={{
              color: palette.textFaint, fontSize: size.label,
              fontFamily: font.ui, textAlign: 'center', marginBottom: space.md,
            }}>
              สำรับตอนนี้ {deck.length} ใบ · หยิบแล้วจะเป็น {deck.length + 1} ใบ
            </Text>
          )}

          <ScrollView style={{ maxHeight: 340 }} contentContainerStyle={{ gap: 12 }}>
            {subChoices(pending).map((sc, i) => (
              <Pressable
                key={sc.key}
                onPress={() => onChoose(pending, i)}
                style={{
                  padding: sc.card ? 0 : 16, borderRadius: 14,
                  backgroundColor: sc.card ? 'transparent' : surface.panel,
                  borderWidth: sc.card ? 0 : 1, borderColor: palette.line,
                }}
              >
                {sc.card ? (
                  <View>
                    <CardRow card={sc.card} />
                    {/* ซ้ำใบเดิมไม่ได้แปลว่าแย่ — บางทีเราตั้งใจถือใบเดิมหลายใบ
                        แต่ต้องรู้ตัวว่ากำลังทำอยู่ */}
                    {ownedCount(sc.card.id) > 0 && (
                      <Text style={{
                        color: palette.moonDim, fontSize: size.tiny,
                        fontFamily: font.ui, marginTop: 2, marginLeft: space.md,
                      }}>
                        มีอยู่แล้ว {ownedCount(sc.card.id)} ใบ
                      </Text>
                    )}
                  </View>
                ) : (
                  <>
                    <Text style={{ color: palette.text, fontSize: 16, fontFamily: 'Prompt_600SemiBold' }}>
                      {sc.title}
                    </Text>
                    {!!sc.detail && (
                      <Text style={{ color: palette.textDim, fontSize: 13, marginTop: 4 }}>
                        {sc.detail}
                      </Text>
                    )}
                  </>
                )}
              </Pressable>
            ))}
          </ScrollView>

          <Pressable onPress={() => setPending(null)} style={{ marginTop: 14, alignSelf: 'center' }}>
            <Text style={{ color: palette.textDim, fontSize: 14 }}>◂ ย้อนกลับ</Text>
          </Pressable>
        </View>
      )}

      <Pressable onPress={onSkip} style={{ marginTop: 22, alignSelf: 'center' }}>
        <Text style={{ color: palette.textFaint, fontSize: 13 }}>ข้ามไปก่อน</Text>
      </Pressable>
    </View>
  );
}
