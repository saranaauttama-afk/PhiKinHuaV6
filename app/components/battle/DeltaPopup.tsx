// app/components/battle/DeltaPopup.tsx — a number that pops up from a stat icon and fades.
// Owner playtest 16 Oct 2026: a hit absorbed by block should show the block going down, on the
// block icon itself (not at a fixed screen position that drifts when the HUD layout changes).
import React from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { fighterColors, layer, palette } from '../../theme';

export type Delta = { key: string; amount: number };

/** Renders absolutely above its parent; `key` restarts it. Negative amounts are red. */
export default function DeltaPopup({ delta }: { delta?: Delta | null }) {
  const y = useSharedValue(0), opacity = useSharedValue(0), scale = useSharedValue(.6);
  React.useEffect(() => {
    if (!delta) return;
    y.value = 0; opacity.value = 1; scale.value = .6;
    scale.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.back(2)) });
    y.value = withTiming(-26, { duration: 750, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(0, { duration: 800 });
  }, [delta?.key]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: y.value }, { scale: scale.value }] }));
  if (!delta) return null;
  return <Animated.Text pointerEvents="none" style={[{
    position: 'absolute', top: -14, left: 0, right: 0, textAlign: 'center', zIndex: layer.popup,
    fontFamily: 'Prompt_700Bold', fontSize: 16, color: delta.amount < 0 ? fighterColors.hpLow : palette.moon,
    textShadowColor: palette.scrimHeavy, textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3,
  }, style]}>{delta.amount > 0 ? '+' : ''}{delta.amount}</Animated.Text>;
}
