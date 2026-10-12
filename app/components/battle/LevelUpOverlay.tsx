// app/components/battle/LevelUpOverlay.tsx — level-up: the heal already happened; pick one of three rewards.
import React from 'react';
import { View, Text, Pressable, Image, useWindowDimensions } from 'react-native';
import type { GameState, LevelOption } from '../../../src/core/types';
import { canUpgrade, canRemoveCard } from '../../../src/core/engine/shared';
import { LEVEL_UP } from '../../../src/core/balance/notfm';
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
  { id: 'upgrade', title: 'ปลุกเสก', detail: 'เพิ่มดาวการ์ด 1 ใบในสำรับ' },
  { id: 'remove', title: 'สละการ์ด', detail: 'ถอดการ์ด 1 ใบออกจากสำรับ' },
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
  const unavailable = (o: LevelOption) =>
    o === 'card' ? !level.cards.length : o === 'upgrade' ? !deck.some(canUpgrade) : !deck.some(c => canRemoveCard(c, deck.length));
  const image = (o: LevelOption) =>
    o === 'card' ? require('../../../assets/ui/blessing-amulet.png') : o === 'upgrade' ? RITUAL_OBJECTS.upgrade : RITUAL_OBJECTS.remove;
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

      {pending === null && <View style={{ gap: 16 }}>
        <Text style={{ color: palette.text, fontSize: 14, fontFamily: font.ui, textAlign: 'center' }}>เลือกรางวัล 1 อย่าง</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'stretch' }}>
          {OPTIONS.map(o => {
            const off = unavailable(o.id), picked = selected === o.id;
            return <Pressable key={o.id} testID={`levelup-option-${o.id}`} disabled={off} accessibilityRole="button"
              accessibilityLabel={`${o.title}${picked ? ' · เลือกไว้แล้ว' : ''}`} accessibilityState={{ selected: picked, disabled: off }}
              onPress={() => setSelected(o.id)} style={{ flex: 1 }}>
              <CandleSelection selected={picked} dim={!!selected && !picked}>
                <RitualSurface kind="quietSlate" style={{ flex: 1, minHeight: 200, paddingHorizontal: 8, paddingVertical: 14, alignItems: 'center' }}>
                  <Image accessible={false} source={image(o.id)} resizeMode="contain" style={{ width: 60, height: 60, marginBottom: 10, opacity: off ? .5 : 1 }} />
                  <Text style={{ fontFamily: font.heading, color: palette.moon, fontSize: 16, textAlign: 'center' }}>{o.title}</Text>
                  <Text style={{ fontFamily: font.ui, color: palette.text, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 6 }}>{off ? 'ไม่มีการ์ดที่เลือกได้' : o.detail}</Text>
                </RitualSurface>
              </CandleSelection>
            </Pressable>;
          })}
        </View>
        <QuietButton label={selected ? `ต่อไป · ${OPTIONS.find(o => o.id === selected)!.title}` : 'เลือกรางวัลก่อน'} primary disabled={!selected} onPress={() => selected && setPending(selected)} />
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

      {(pending === 'upgrade' || pending === 'remove') && <View style={{ gap: 14 }}>
        <Text style={{ color: palette.text, fontSize: 14, fontFamily: font.ui, textAlign: 'center' }}>
          {pending === 'upgrade' ? 'เลือกการ์ดที่จะปลุกเสก 1 ใบ' : 'เลือกการ์ดที่จะสละ 1 ใบ'}
        </Text>
        <UpgradeCardPicker cards={deck} selected={index} onSelect={setIndex} remove={pending === 'remove'} onConfirm={i => onChoose(pending, i)} />
        <QuietButton label="ย้อนกลับ" onPress={back} />
      </View>}
    </PostBattleSurface>
  );
}
