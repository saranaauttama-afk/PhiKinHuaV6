// app/components/SkillSheet.tsx — read a class skill, pick what it needs, use it.
// Shared by the battle skill buttons (slots B/C) and the map skill chip (slot A).
import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import type { GameState } from '../../src/core/types';
import { skillById, skillBlock, skillChoice, skillOptions, possessionCards } from '../../src/core/skills';
import { enemyCardById } from '../../src/core/pack_enemy_cards';
import { cardFromEnemy } from '../../src/core/cards/borrow';
import { describeCard } from '../../src/core/cards/describe';
import RitualSurface from './RitualSurface';
import { QuietButton } from './QuietChrome';
import UpgradeCardPicker from './UpgradeCardPicker';
import CandleSelection from './CandleSelection';
import { font, palette } from '../theme';

const SLOT_LABEL = { A: 'ช่อง A · ใช้บนแผนที่', B: 'ช่อง B · เครื่องมือในไฟต์', C: 'ช่อง C · พลิกเกม' } as const;

/** Short status for a button: ready, cooldown, or why it cannot be used now. */
export function skillStatus(state: GameState, id: string): { ready: boolean; label: string } {
  const cd = state.skills?.[id] ?? 0;
  if (cd > 0) return { ready: false, label: `อีก ${cd} ไฟต์` };
  const block = skillBlock(state, id);
  return block && block !== 'ต้องเลือกก่อน' ? { ready: false, label: block } : { ready: true, label: 'พร้อม' };
}

export default function SkillSheet({ state, id, onUse, onClose }: {
  state: GameState; id: string | null;
  onUse: (id: string, index?: number) => void; onClose: () => void;
}) {
  const [index, setIndex] = React.useState<number | null>(null);
  React.useEffect(() => setIndex(null), [id]);
  const def = id ? skillById(id) : undefined;
  if (!def) return null;
  const choice = skillChoice(def.id);
  const status = skillStatus(state, def.id);
  const ghostIds = choice === 'ghost-card' ? possessionCards(state) : [];
  const use = (i?: number) => { onUse(def.id, i); onClose(); };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: palette.scrimHeavy, padding: 16 }}>
        <Pressable accessibilityLabel="ปิดสกิล" onPress={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <RitualSurface kind="quietSlate" accessibilityViewIsModal style={{ padding: 18, gap: 10, maxHeight: '88%' }}>
          <Text accessibilityRole="header" style={{ fontFamily: font.heading, color: palette.moon, fontSize: 20 }}>{def.name}</Text>
          <Text style={{ fontFamily: font.ui, color: palette.moonDim, fontSize: 12 }}>{SLOT_LABEL[def.slot]} · พักสกิล {def.cd} ไฟต์</Text>
          <Text style={{ fontFamily: font.ui, color: palette.text, fontSize: 15, lineHeight: 25 }}>{def.text}</Text>
          {!status.ready && <Text testID="skill-blocked" style={{ fontFamily: font.ui, color: palette.bloodLit, fontSize: 13 }}>{status.label}</Text>}

          {status.ready && !choice && <QuietButton testID="skill-use" label={`ใช้ ${def.name}`} primary onPress={() => use()} />}

          {status.ready && choice === 'option' && skillOptions(def.id).map((label, i) =>
            <QuietButton key={label} testID={`skill-option-${i}`} label={label} primary onPress={() => use(i)} />)}

          {status.ready && (choice === 'deck-upgrade' || choice === 'deck-card') && <ScrollView style={{ maxHeight: 420 }}>
            <UpgradeCardPicker cards={state.masterDeck} selected={index} onSelect={setIndex} remove={choice === 'deck-card'}
              labels={choice === 'deck-card' ? { title: 'อธิษฐานเปลี่ยนการ์ดใบนี้', detail: 'เปลี่ยนเป็นการ์ดแม่ชีแบบสุ่ม', confirm: 'ยืนยันเปลี่ยนใบนี้' } : undefined}
              onConfirm={i => use(i)} />
          </ScrollView>}

          {status.ready && choice === 'ghost-card' && <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ gap: 8 }}>
            {ghostIds.map((gid, i) => {
              const card = cardFromEnemy(enemyCardById(gid)!);
              return <Pressable key={`${gid}-${i}`} testID={`skill-ghost-${i}`} accessibilityRole="button" accessibilityLabel={card.name} onPress={() => setIndex(i)}>
                <CandleSelection selected={index === i} dim={index !== null && index !== i}>
                  <RitualSurface kind="quietSlate" style={{ padding: 10, gap: 3 }}>
                    <Text style={{ fontFamily: font.heading, color: palette.moon, fontSize: 15 }}>{card.name}</Text>
                    <Text style={{ fontFamily: font.ui, color: palette.text, fontSize: 13 }}>{describeCard(card)}</Text>
                  </RitualSurface>
                </CandleSelection>
              </Pressable>;
            })}
            <QuietButton label="เล่นสำเนาใบนี้" primary disabled={index === null} onPress={() => index !== null && use(index)} />
          </ScrollView>}

          <QuietButton label="ปิด" onPress={onClose} />
        </RitualSurface>
      </View>
    </Modal>
  );
}
