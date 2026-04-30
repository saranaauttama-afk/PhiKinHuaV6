import React from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

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
      color: '#ff3333',
      fontSize: 44,
      fontFamily: 'ChakraPetch_700Bold',
      textShadowColor: 'rgba(0,0,0,0.9)',
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 4,
    }, style]}>
      -{damage}
    </Animated.Text>
  );
}
