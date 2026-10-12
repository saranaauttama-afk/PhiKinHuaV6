// app/components/battle/GhostTalkOverlay.tsx — after a win the ghost speaks; the answer moves ความกล้า or บุญ.
import React from 'react';
import { Text, View } from 'react-native';
import type { AlignmentChoice, GameState } from '../../../src/core/types';
import { ghostTalk } from '../../../src/core/campaign/alignment';
import { ALIGNMENT } from '../../../src/core/balance/notfm';
import PostBattleSurface from './PostBattleSurface';
import RitualSurface from '../RitualSurface';
import { QuietButton } from '../QuietChrome';
import AlignmentMeter from '../AlignmentMeter';
import { font, palette } from '../../theme';

export default function GhostTalkOverlay({ state, onAnswer }: { state: GameState; onAnswer: (c: AlignmentChoice) => void }) {
  const id = state.ghostTalk?.ghostId;
  const talk = id ? ghostTalk(id) : undefined;
  if (!talk) return null;
  const name = state.enemy && state.enemy.id === id ? state.enemy.name : 'ผี';
  return (
    <PostBattleSurface mat>
      <RitualSurface kind="quietSlate" style={{ padding: 20, gap: 12 }}>
        <Text accessibilityRole="header" style={{ fontFamily: font.heading, color: palette.moon, fontSize: 18, textAlign: 'center' }}>{name}</Text>
        <Text testID="talk-line" style={{ fontFamily: font.body, color: palette.text, fontSize: 21, lineHeight: 30, textAlign: 'center' }}>{talk.line}</Text>
        <AlignmentMeter campaign={state.campaign} />
      </RitualSurface>
      <View style={{ gap: 10, marginTop: 12 }}>
        <QuietButton testID="talk-courage" primary label={`${talk.courage} · ความกล้า +1 · ${ALIGNMENT.courageGold} เบี้ย`} onPress={() => onAnswer('courage')} />
        <QuietButton testID="talk-merit" primary label={`${talk.merit} · บุญ +1 · ฟื้น ${ALIGNMENT.meritHeal} ชีวิต`} onPress={() => onAnswer('merit')} />
        <QuietButton testID="talk-leave" label="เดินผ่านไปเงียบ ๆ" onPress={() => onAnswer('leave')} />
      </View>
    </PostBattleSurface>
  );
}
