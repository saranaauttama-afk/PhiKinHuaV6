// app/components/DeckView.tsx — สำรับทั้งหมดของผู้เล่น
//
// **หน้านี้เขียนเสร็จมานานแล้วแต่เปิดไม่ได้** — คำสั่ง `OpenDeck` ต่อสายเข้า
// reducer เรียบร้อย แต่ไม่มีปุ่มไหนในเกมสั่งมันเลย เป็นหน้าจอที่ไม่มีประตู
// ตอนนี้เข้าได้จากแถบสถานะบนแผนที่ และจากหน้าต่อสู้
//
// ของเดิมยังมีปัญหาอีกสองอย่าง: วางเป็นบล็อกไหลอยู่กลางหน้าแผนที่ (ไม่ใช่จอทับ
// จึงล้นออกนอกจอ) และปุ่มปิดเป็นตัวหนังสือสีเลือดบนพื้นสีเลือด — มองไม่เห็น
// ส่วนของเครื่องรางก็ยังเป็น className ของ NativeWind ปนกับ StyleSheet อยู่

import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { Command, GameState } from '../../src/core/types';
import { groupCards } from '../../src/core/cards/group';
import CardRow from './CardRow';
import { GameButton } from './Panel';
import { font, palette, radius, size, space, surface, tint } from '../theme';

/** ชื่อชนิดการ์ดเป็นภาษาไทย — เดิมเอาค่า type ดิบมาต่อกับคำว่า "Cards" */
const TYPE_LABEL: Record<string, string> = {
  attack: 'การ์ดโจมตี',
  skill: 'การ์ดวิชา',
  equipment: 'เครื่องราง',
};
const TYPE_ORDER = ['attack', 'skill', 'equipment'] as const;

type Props = {
  state: GameState;
  dispatch: (cmd: Command) => void;
};

export default function DeckView({ state, dispatch }: Props) {
  if (!state.deckOpen) return null;

  const deck = state.masterDeck ?? [];

  const rows = groupCards(deck);

  const equipped = state.equipped ?? [];
  const slotsMax = state.equipmentSlotsMax ?? 1;
  const slotsUsed = equipped.reduce((sum, eq) => sum + (eq.slotCost || 1), 0);
  const equipmentCards = deck.filter(c => c.type === 'equipment');

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
            สำรับของเรา
          </Text>
          <Text style={{ color: palette.textDim, fontSize: size.ui, fontFamily: font.ui }}>
            ทั้งหมด {deck.length} ใบ
          </Text>
        </View>
        <GameButton label="ปิด" onPress={() => dispatch({ type: 'CloseDeck' })} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.xl, paddingBottom: space.xxl, gap: space.lg,
        }}
      >
        {deck.length === 0 && (
          <Text style={{
            color: palette.textDim, fontSize: size.bodyLg, fontFamily: font.body,
            textAlign: 'center', paddingVertical: space.xxl,
          }}>
            สำรับว่างเปล่า
          </Text>
        )}

        {(equipped.length > 0 || equipmentCards.length > 0) && (
          <Section title={`เครื่องราง (${slotsUsed}/${slotsMax} ช่อง)`}>
            {equipped.map((eq, i) => (
              <View
                key={eq.id ?? i}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: space.md,
                  padding: space.md, borderRadius: radius.md,
                  backgroundColor: surface.panelRaise,
                  borderWidth: 1, borderColor: palette.lineStrong,
                }}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    <Text style={{ color: palette.moon, fontSize: size.ui, fontFamily: font.uiMed }}>
                      {eq.name || eq.id}
                    </Text>
                    {eq.temporary && (
                      <Text style={{ color: palette.textFaint, fontSize: size.tiny, fontFamily: font.ui }}>
                        ชั่วคราว (หมดเมื่อจบไฟต์)
                      </Text>
                    )}
                  </View>
                  {!!eq.desc && (
                    <Text style={{
                      color: palette.textFaint, fontSize: size.body,
                      fontFamily: font.body, marginTop: 2, lineHeight: 22,
                    }}>
                      {eq.desc}
                    </Text>
                  )}
                </View>

                {/* ของชั่วคราวถอดไม่ได้ — มันจะหายเองตอนจบไฟต์ */}
                {!eq.temporary && (
                  <SmallButton
                    label="ถอด"
                    onPress={() => dispatch({ type: 'UnequipToDeck', equipmentId: eq.id })}
                  />
                )}
              </View>
            ))}

            {equipmentCards.map((card, i) => {
              const isEquipped = equipped.some(eq => eq.id === card.equipmentId);
              if (isEquipped) return null;
              const canEquip = slotsUsed < slotsMax;

              return (
                <View
                  key={`${card.id}-${i}`}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: space.md,
                    padding: space.md, borderRadius: radius.md,
                    backgroundColor: surface.panelSunk,
                    borderWidth: 1, borderColor: surface.panelWell,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: palette.text, fontSize: size.ui, fontFamily: font.uiMed }}>
                      {card.name || card.id}
                    </Text>
                    {!!card.desc && (
                      <Text style={{
                        color: palette.textFaint, fontSize: size.body,
                        fontFamily: font.body, marginTop: 2, lineHeight: 22,
                      }}>
                        {card.desc}
                      </Text>
                    )}
                  </View>

                  {canEquip ? (
                    <SmallButton
                      label="สวม"
                      onPress={() => dispatch({ type: 'EquipFromDeck', cardId: card.id })}
                    />
                  ) : (
                    <Text style={{ color: palette.textFaint, fontSize: size.label, fontFamily: font.ui }}>
                      ช่องเต็ม
                    </Text>
                  )}
                </View>
              );
            })}
          </Section>
        )}

        {TYPE_ORDER.map(type => {
          const list = rows.filter(r => r.card.type === type);
          if (list.length === 0) return null;
          const total = list.reduce((n, r) => n + r.count, 0);

          return (
            <Section key={type} title={`${TYPE_LABEL[type] ?? type} (${total} ใบ)`}>
              {list.map(r => (
                <CardRow key={r.card.id} card={r.card} count={r.count} />
              ))}
            </Section>
          );
        })}
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text style={{ color: palette.moonDim, fontSize: size.heading, fontFamily: font.heading }}>
        {title}
      </Text>
      <View style={{ gap: space.sm }}>{children}</View>
    </View>
  );
}

function SmallButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: space.lg, paddingVertical: space.sm,
        borderRadius: radius.md,
        backgroundColor: pressed ? tint.moonPick : tint.moonSoft,
        borderWidth: 1, borderColor: palette.lineStrong,
      })}
    >
      <Text style={{ color: palette.moon, fontSize: size.label, fontFamily: font.uiMed }}>
        {label}
      </Text>
    </Pressable>
  );
}
