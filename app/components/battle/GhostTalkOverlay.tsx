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
import { Pressable } from 'react-native';
import { font, layer, palette, paper, surface } from '../../theme';
import { useBattleLayout } from './battleLayout';
import { PLAYER_BATTLE_HUD_HEIGHT } from '../../battleGeometry';
import SpeechBubble from './SpeechBubble';

export default function GhostTalkOverlay({ state, onAnswer }: { state: GameState; onAnswer: (c: AlignmentChoice) => void }) {
  const layout = useBattleLayout(), safe = useSafeAreaInsets();
  const id = state.ghostTalk?.ghostId;
  const talk = id ? ghostTalk(id) : undefined;
  if (!talk) return null;
  const name = state.enemy && state.enemy.id === id ? state.enemy.name : 'ผี';
  // The balloon hangs from the lower part of the ghost art; answers sit just above the player HUD.
  const balloonTop = layout.monsterTop + layout.monsterSize * 0.62;
  // Owner 17 Oct 2026: answers sit higher, clear of the item row above the HUD.
  const answersBottom = safe.bottom + 4 + PLAYER_BATTLE_HUD_HEIGHT + 64;
  return (
    <View pointerEvents="box-none" accessibilityViewIsModal style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: layer.overlay }}>
      <Animated.View entering={FadeIn.duration(250)} pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: surface.glassDim }} />
      <Animated.View entering={FadeInDown.duration(320)} testID="talk-balloon" style={{ position: 'absolute', top: balloonTop, left: 24, right: 24, alignItems: 'center' }}>
        {/* Comic oval balloon with a tail up at the ghost (owner 17 Oct 2026). One font (Prompt) for
            the line, the name and the answers, so the dialogue reads as one voice style. */}
        <SpeechBubble tail="up" fill={palette.scrimHeavy} stroke={paper.muted} style={{ alignSelf: 'stretch', paddingVertical: 26, paddingHorizontal: 40, gap: 4 }}>
          <Text accessibilityRole="header" style={{ fontFamily: font.heading, color: palette.moonDim, fontSize: 14, textAlign: 'center' }}>{name}</Text>
          <Text testID="talk-line" style={{ fontFamily: font.ui, color: palette.text, fontSize: 16, lineHeight: 26, textAlign: 'center' }}>{talk.line}</Text>
        </SpeechBubble>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(250).duration(320)} style={{ position: 'absolute', left: 16, right: 16, bottom: answersBottom, gap: 12 }}>
        {/* Answers only, like lines of dialogue (owner: no meter, no rule text). The effects are
            unchanged and still apply; the screen-reader label keeps them. */}
        {([['courage', talk.courage, `ความกล้า +1 · ${ALIGNMENT.courageGold} เบี้ย`], ['merit', talk.merit, `บุญ +1 · ฟื้น ${ALIGNMENT.meritHeal} ชีวิต`], ['leave', 'เดินผ่านไปเงียบ ๆ', 'ไม่เปลี่ยนอะไร']] as const).map(([k, line, fx]) =>
          <Pressable key={k} testID={`talk-${k}`} accessibilityRole="button" accessibilityLabel={`${line} · ${fx}`} onPress={() => onAnswer(k)}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            {/* each answer is its own balloon, tail down toward our portrait */}
            <SpeechBubble tail="down-left" fill={palette.scrimHeavy} stroke={paper.muted} style={{ minHeight: 52, justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 34 }}>
              <Text style={{ fontFamily: font.ui, color: palette.text, fontSize: 15, lineHeight: 22, textAlign: 'center' }}>{line}</Text>
            </SpeechBubble>
          </Pressable>)}
      </Animated.View>
    </View>
  );
}
