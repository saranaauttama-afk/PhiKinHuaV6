import React from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { palette, surface, tint } from '../../theme';

interface Props {
  damage: number;
  onDone: () => void;
}

export default function DamagePopup({ damage, onDone }: Props) {
  const y = useSharedValue(0);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    y.value = withTiming(-90, { duration: 900 });
    opacity.value = withTiming(0, { duration: 900 });
    const t = setTimeout(onDone, 950);
    return () => clearTimeout(t);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[{
      color: palette.bloodLit,
      fontSize: 44,
      fontFamily: 'Prompt_700Bold',
      textShadowColor: palette.shadow,
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 4,
    }, style]}>
      -{damage}
    </Animated.Text>
  );
}
