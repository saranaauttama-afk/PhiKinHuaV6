import React from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Text } from 'react-native';
import { palette, surface, tint } from '../../theme';

interface Props {
  damage: number;
  /** What changed the hit (combat/damage.ts damageParts), shown small under the number. */
  parts?: string[];
  onDone: () => void;
}

export default function DamagePopup({ damage, parts, onDone }: Props) {
  const y = useSharedValue(0);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    y.value = withTiming(-90, { duration: parts?.length ? 1400 : 900 });
    opacity.value = withTiming(0, { duration: parts?.length ? 1400 : 900 });
    const t = setTimeout(onDone, parts?.length ? 1500 : 950);
    return () => clearTimeout(t);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ alignItems: 'center' }, style]}>
    <Animated.Text style={[{
      color: palette.bloodLit,
      fontSize: 44,
      fontFamily: 'Prompt_700Bold',
      textShadowColor: palette.shadow,
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 4,
    }]}>
      -{damage}
    </Animated.Text>
    {!!parts?.length && <Text testID="damage-parts" style={{ color: palette.paperLight, fontSize: 13, fontFamily: 'Prompt_600SemiBold', textShadowColor: palette.shadow, textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3, textAlign: 'center', maxWidth: 300 }}>{parts.join(' · ')}</Text>}
    </Animated.View>
  );
}
