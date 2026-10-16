// app/components/battle/GhostTalkOverlay.tsx — after a win the ghost speaks; the answer moves ความกล้า or บุญ.
//
// Owner playtest 16 Oct 2026: the talk happens on the battle scene before the victory page — a
// speech balloon from the defeated ghost and our answers below it — so it feels like talking to
// the ghost, not filling in a form. No voice yet. The ghost fades away after the answer
// (battle.tsx holdForDeath), then the victory page, level-up and card reward follow as before.
import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AlignmentChoice, GameState } from '../../../src/core/types';
import { ghostTalk } from '../../../src/core/campaign/alignment';
import { ALIGNMENT } from '../../../src/core/balance/notfm';
import { QuietButton } from '../QuietChrome';
import AlignmentMeter from '../AlignmentMeter';
import RitualSurface from '../RitualSurface';
import { font, layer, palette, paper } from '../../theme';
import { useBattleLayout } from './battleLayout';
import { PLAYER_BATTLE_HUD_HEIGHT } from '../../battleGeometry';

export default function GhostTalkOverlay({ state, onAnswer }: { state: GameState; onAnswer: (c: AlignmentChoice) => void }) {
  const layout = useBattleLayout(), safe = useSafeAreaInsets();
  const id = state.ghostTalk?.ghostId;
  const talk = id ? ghostTalk(id) : undefined;
  if (!talk) return null;
  const name = state.enemy && state.enemy.id === id ? state.enemy.name : 'ผี';
  // The balloon hangs from the lower part of the ghost art; answers sit just above the player HUD.
  const balloonTop = layout.monsterTop + layout.monsterSize * 0.62;
  const answersBottom = safe.bottom + 4 + PLAYER_BATTLE_HUD_HEIGHT + 12;
  return (
    <View pointerEvents="box-none" accessibilityViewIsModal style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: layer.overlay }}>
      <Animated.View entering={FadeIn.duration(250)} pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: palette.scrim }} />
      <Animated.View entering={FadeInDown.duration(320)} testID="talk-balloon" style={{ position: 'absolute', top: balloonTop, left: 24, right: 24, alignItems: 'center' }}>
        {/* tail pointing up at the ghost */}
        <View style={{ width: 18, height: 18, marginBottom: -10, transform: [{ rotate: '45deg' }], backgroundColor: paper.light, borderLeftWidth: 1.5, borderTopWidth: 1.5, borderColor: paper.line }} />
        <View style={{ alignSelf: 'stretch', backgroundColor: paper.light, borderRadius: 18, borderWidth: 1.5, borderColor: paper.line, paddingVertical: 14, paddingHorizontal: 18, gap: 6 }}>
          <Text accessibilityRole="header" style={{ fontFamily: font.heading, color: paper.red, fontSize: 14, textAlign: 'center' }}>{name}</Text>
          <Text testID="talk-line" style={{ fontFamily: font.body, color: paper.ink, fontSize: 19, lineHeight: 28, textAlign: 'center' }}>{talk.line}</Text>
        </View>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(250).duration(320)} style={{ position: 'absolute', left: 16, right: 16, bottom: answersBottom, gap: 8 }}>
        <RitualSurface kind="quietSlate" style={{ paddingVertical: 6, paddingHorizontal: 10 }}><AlignmentMeter campaign={state.campaign} /></RitualSurface>
        <QuietButton testID="talk-courage" primary label={`${talk.courage} · ความกล้า +1 · ${ALIGNMENT.courageGold} เบี้ย`} onPress={() => onAnswer('courage')} />
        <QuietButton testID="talk-merit" primary label={`${talk.merit} · บุญ +1 · ฟื้น ${ALIGNMENT.meritHeal} ชีวิต`} onPress={() => onAnswer('merit')} />
        <QuietButton testID="talk-leave" label="เดินผ่านไปเงียบ ๆ" onPress={() => onAnswer('leave')} />
      </Animated.View>
    </View>
  );
}
