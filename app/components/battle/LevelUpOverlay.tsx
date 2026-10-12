// app/components/battle/LevelUpOverlay.tsx — level-up: the heal already happened; pick one of three rewards.
import React from 'react';
import { View, Text, Pressable, Image, useWindowDimensions } from 'react-native';
import type { GameState, LevelOption } from '../../../src/core/types';
import { canUpgrade, canRemoveCard } from '../../../src/core/engine/shared';
import { CARD_RULES, LEVEL_UP } from '../../../src/core/balance/notfm';
import { levelOffers } from '../../../src/core/engine/handlers/level';
import PostBattleSurface from './PostBattleSurface';
import RitualSurface from '../RitualSurface';
import CandleSelection from '../CandleSelection';
import { QuietButton } from '../QuietChrome';
import { RITUAL_OBJECTS } from '../RitualObject';
import UpgradeCardPicker from '../UpgradeCardPicker';
import Card from '../Card';
import CardRow from '../CardRow';
import { font, palette } from '../../theme';

const OPTIONS: Array<{ id: LevelOption; title: string; detail: string }> = [
  { id: 'card', title: 'การ์ดใหม่', detail: 'เลือก 1 ใบจาก 3 ใบเข้าสำรับ' },
  { id: 'upgrade', title: 'ปลุกเสก', detail: `เพิ่มดาวการ์ด ${LEVEL_UP.upgrades} ครั้ง` },
  { id: 'remove', title: 'สละการ์ด', detail: 'ถอดการ์ด 1 ใบออกจากสำรับ' },
  { id: 'slot', title: 'ช่องอุปกรณ์', detail: 'ใส่อุปกรณ์พร้อมกันได้เพิ่ม 1 ชิ้น' },
  { id: 'retain', title: 'เก็บการ์ด', detail: 'เก็บการ์ดข้ามเทิร์นได้เพิ่ม 1 ใบ' },
];

type Props = {
  state: GameState;
  playerLevel: number;
  onChoose: (option: LevelOption, index: number) => void;
  onSkip: () => void;
};

export default function LevelUpOverlay({ state, playerLevel, onChoose, onSkip }: Props) {
  const [selected, setSelected] = React.useState<LevelOption | null>(null);
  const [pending, setPending] = React.useState<LevelOption | null>(null);
  const [index, setIndex] = React.useState<number | null>(null);
  const { width } = useWindowDimensions();
  const level = state.levelUp;
  if (!level || level.consumed) return null;
  const deck = state.masterDeck ?? [];
  const offered = OPTIONS.filter(o => levelOffers(state).includes(o.id));
  const upgrading = level.upgradesLeft != null;
  const unavailable = (o: LevelOption) =>
    o === 'card' ? !level.cards.length : o === 'upgrade' ? !deck.some(canUpgrade) : o === 'remove' ? !deck.some(c => canRemoveCard(c, deck.length)) : false;
  const image = (o: LevelOption) =>
    o === 'upgrade' ? RITUAL_OBJECTS.upgrade : o === 'remove' ? RITUAL_OBJECTS.remove : require('../../../assets/ui/blessing-amulet.png');
  const detail = (o: (typeof OPTIONS)[number]) =>
    o.id === 'slot' ? `${o.detail} (${state.equipmentSlotsMax ?? CARD_RULES.equipmentSlots} → ${(state.equipmentSlotsMax ?? CARD_RULES.equipmentSlots) + 1})`
      : o.id === 'retain' ? `${o.detail} (${state.player.retain ?? CARD_RULES.retain} → ${(state.player.retain ?? CARD_RULES.retain) + 1})` : o.detail;
  const next = (o: LevelOption) => (o === 'slot' || o === 'retain') ? onChoose(o, 0) : setPending(o);
  const back = () => { setPending(null); setIndex(null); };
  const cardWidth = Math.min(132, (width - 56) / 3);

  return (
    <PostBattleSurface mat>
      <RitualSurface kind="quietSlate" style={{ paddingVertical: 18, marginBottom: 10, alignItems: 'center', gap: 6 }}>
        <Text style={{ color: palette.moon, fontSize: 24, fontFamily: font.heading }}>เลเวล {playerLevel}</Text>
        <Text testID="levelup-heal" style={{ color: palette.text, fontSize: 13, fontFamily: font.ui, textAlign: 'center' }}>
          ฟื้นพลังชีวิตเต็ม · ชีวิตสูงสุด +{LEVEL_UP.maxHp} ({state.player.hp}/{state.player.maxHp})
        </Text>
      </RitualSurface>

      {pending === null && !upgrading && <View style={{ gap: 16 }}>
        <Text style={{ color: palette.text, fontSize: 14, fontFamily: font.ui, textAlign: 'center' }}>เลือกรางวัล 1 อย่าง</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'stretch' }}>
          {offered.map(o => {
            const off = unavailable(o.id), picked = selected === o.id;
            return <Pressable key={o.id} testID={`levelup-option-${o.id}`} disabled={off} accessibilityRole="button"
              accessibilityLabel={`${o.title}${picked ? ' · เลือกไว้แล้ว' : ''}`} accessibilityState={{ selected: picked, disabled: off }}
              onPress={() => setSelected(o.id)} style={{ flex: 1 }}>
              <CandleSelection selected={picked} dim={!!selected && !picked}>
                <RitualSurface kind="quietSlate" style={{ flex: 1, minHeight: 200, paddingHorizontal: 8, paddingVertical: 14, alignItems: 'center' }}>
                  <Image accessible={false} source={image(o.id)} resizeMode="contain" style={{ width: 60, height: 60, marginBottom: 10, opacity: off ? .5 : 1 }} />
                  <Text style={{ fontFamily: font.heading, color: palette.moon, fontSize: 16, textAlign: 'center' }}>{o.title}</Text>
                  <Text style={{ fontFamily: font.ui, color: palette.text, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 6 }}>{off ? 'ไม่มีการ์ดที่เลือกได้' : detail(o)}</Text>
                </RitualSurface>
              </CandleSelection>
            </Pressable>;
          })}
        </View>
        <QuietButton label={selected ? `ต่อไป · ${OPTIONS.find(o => o.id === selected)!.title}` : 'เลือกรางวัลก่อน'} primary disabled={!selected} onPress={() => selected && next(selected)} />
        <QuietButton label={`ข้าม · รับ ${LEVEL_UP.skipGold} เบี้ย`} onPress={onSkip} />
      </View>}

      {pending === 'card' && <View style={{ gap: 12 }}>
        <Text style={{ color: palette.text, fontSize: 14, fontFamily: font.ui, textAlign: 'center' }}>แตะการ์ดเพื่ออ่าน แล้วยืนยัน</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          {level.cards.map((c, i) => <View key={`${c.id}-${i}`} testID={`levelup-card-${i}`} style={{ width: cardWidth, opacity: index !== null && index !== i ? .68 : 1, transform: [{ translateY: index === i ? -8 : 0 }] }}>
            <Card card={c} width={cardWidth} height={174} selected={index === i} onPress={() => setIndex(index === i ? null : i)} />
          </View>)}
        </View>
        {index !== null && <RitualSurface kind="occupationPage" style={{ padding: 20 }}>
          <CardRow card={level.cards[index]} plain />
          <QuietButton label={`รับ ${level.cards[index].name}`} primary onPress={() => onChoose('card', index)} />
        </RitualSurface>}
        <QuietButton label="ย้อนกลับ" onPress={back} />
      </View>}

      {(pending === 'upgrade' || pending === 'remove' || upgrading) && <View style={{ gap: 14 }}>
        <Text testID="levelup-picker-title" style={{ color: palette.text, fontSize: 14, fontFamily: font.ui, textAlign: 'center' }}>
          {pending === 'remove' ? 'เลือกการ์ดที่จะสละ 1 ใบ' : `เลือกการ์ดที่จะปลุกเสก · เหลือ ${level.upgradesLeft ?? LEVEL_UP.upgrades} ครั้ง`}
        </Text>
        <UpgradeCardPicker cards={deck} selected={index} onSelect={setIndex} remove={pending === 'remove'} onConfirm={i => { onChoose(upgrading ? 'upgrade' : pending!, i); setIndex(null); }} />
        {upgrading ? <QuietButton label="พอแล้ว" onPress={onSkip} /> : <QuietButton label="ย้อนกลับ" onPress={back} />}
      </View>}
    </PostBattleSurface>
  );
}
