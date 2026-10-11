// Complete deck on a woven mat. Grouped cards open full live details; equipment actions stay available.
import { paper } from '../theme';
import React from 'react';
import { ImageBackground, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import type { CardData, Command, GameState } from '../../src/core/types';
import { groupCards } from '../../src/core/cards/group';
import CardRow from './CardRow';
import DeckCard, { CardGlyphArt } from './DeckCard';
import RitualSurface from './RitualSurface';
import {QuietHeader,QuietButton} from './QuietChrome';
import { font, radius, size, space, layer, palette, surface } from '../theme';
import { useScreenPadding } from '../useScreenPadding';

/** ชื่อชนิดการ์ดเป็นภาษาไทย — เดิมเอาค่า type ดิบมาต่อกับคำว่า "Cards" */
const TYPE_LABEL: Record<string, string> = {
  attack: 'การ์ดโจมตี',
  skill: 'การ์ดวิชา',
  trap: 'การ์ดดัก',
  equipment: 'เครื่องราง',
  curse: 'คำสาป',
};
// คำสาปอยู่ท้ายสุด — มันคือของที่อยากถอนออก ไม่ใช่ของที่อยากดู
const TYPE_ORDER = ['attack', 'skill', 'trap', 'equipment', 'curse'] as const;

type Props = {
  state: GameState;
  dispatch: (cmd: Command) => void;
};

export default function DeckView({ state, dispatch }: Props) {
  const pad = useScreenPadding();
  const [selected, setSelected] = React.useState<{ card: CardData; count: number } | null>(null);
  React.useEffect(() => { if (!state.deckOpen) setSelected(null); }, [state.deckOpen]);
  if (!state.deckOpen) return null;

  const deck = state.masterDeck ?? [];

  const rows = groupCards(deck);

  const equipped = state.equipped ?? [];
  const slotsMax = state.equipmentSlotsMax ?? 1;
  const slotsUsed = equipped.reduce((sum, eq) => sum + (eq.slotCost || 1), 0);
  const equipmentCards = deck.filter(c => c.type === 'equipment');

  return (
    <ImageBackground source={require('../../assets/ui/deck-mat.jpg')} resizeMode="cover" style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: palette.scrimFull,
      zIndex: layer.overlay,
    }}>

      <View style={{paddingTop:pad.top}}><QuietHeader title="สำรับของเรา" subtitle={`ทั้งหมด ${deck.length} ใบ · แตะการ์ดเพื่ออ่านรายละเอียด`} onClose={()=>dispatch({type:'CloseDeck'})}/></View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.xl, paddingBottom: pad.bottom + space.xxl, gap: space.lg,
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
                  padding: space.md, borderRadius: 0,
                  backgroundColor: surface.glassDim,
                  borderWidth: 1, borderColor: palette.line,
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
                    padding: space.md, borderRadius: 0,
                    backgroundColor: surface.glassDim,
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
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 }}>
                {list.map(r => <DeckCard key={r.card.id} card={r.card} count={r.count} onPress={() => setSelected(r)} />)}
              </View>
            </Section>
          );
        })}
      </ScrollView>
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={{ flex: 1, backgroundColor: palette.scrimHeavy, paddingHorizontal: 20, paddingTop: pad.top + 16, paddingBottom: pad.bottom + 16, justifyContent: 'center' }}>
          {selected && <RitualSurface kind="occupationPage" style={{ maxHeight: '95%', padding: 24 }}>
            <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
              <Text accessibilityRole="header" style={{ color: paper.ink, fontFamily: font.heading, fontSize: 18, textAlign: 'center' }}>รายละเอียดการ์ด</Text>
              <View style={{ alignItems: 'center', marginTop: 10 }}><CardGlyphArt card={selected.card} size={110} /></View>
              <CardRow card={selected.card} count={selected.count} plain />
            </ScrollView>
            <Pressable accessibilityRole="button" accessibilityLabel="กลับไปดูสำรับ" onPress={() => setSelected(null)} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: paper.ink, fontFamily: font.heading, fontSize: 14 }}>กลับไปดูสำรับ</Text>
            </Pressable>
          </RitualSurface>}
        </View>
      </Modal>
    </ImageBackground>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text style={{ color: title.startsWith('การ์ดโจมตี') ? palette.bloodLit : palette.text, fontSize: size.heading, fontFamily: font.heading }}>
        {title}
      </Text>
      <View style={{ gap: space.sm }}>{children}</View>
    </View>
  );
}

function SmallButton({label,onPress}:{label:string;onPress:()=>void}) {return <QuietButton label={label} onPress={onPress}/>;}
