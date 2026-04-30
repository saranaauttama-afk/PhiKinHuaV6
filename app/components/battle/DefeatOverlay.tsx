import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withSequence, Easing,
} from 'react-native-reanimated';

type Props = {
  onHome: () => void;
};

export default function DefeatOverlay({ onHome }: Props) {
  const bgOpacity   = useSharedValue(0);
  const cardY       = useSharedValue(-40);
  const cardOpacity = useSharedValue(0);
  const shakeX      = useSharedValue(0);

  React.useEffect(() => {
    bgOpacity.value   = withTiming(1, { duration: 600 });
    cardOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    cardY.value       = withDelay(300, withTiming(0, { duration: 450, easing: Easing.out(Easing.cubic) }));
    shakeX.value      = withDelay(700, withSequence(
      withTiming(10,  { duration: 60 }),
      withTiming(-10, { duration: 60 }),
      withTiming(7,   { duration: 60 }),
      withTiming(-7,  { duration: 60 }),
      withTiming(0,   { duration: 60 }),
    ));
  }, []);

  const bgStyle   = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }, { translateX: shakeX.value }],
  }));

  return (
    <Animated.View style={[{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      justifyContent: 'center', alignItems: 'center', zIndex: 500,
    }, bgStyle]}>
      <Animated.View style={[{ alignItems: 'center' }, cardStyle]}>

        {/* Title */}
        <Text style={{
          color: '#cc2222', fontSize: 48,
          fontFamily: 'ChakraPetch_700Bold',
          textShadowColor: 'rgba(200,0,0,0.7)',
          textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16,
          marginBottom: 12,
        }}>
          พ่ายแพ้
        </Text>

        <Text style={{
          color: 'rgba(255,255,255,0.4)', fontSize: 14,
          fontFamily: 'ChakraPetch_400Regular',
          textAlign: 'center', marginBottom: 52,
          lineHeight: 22,
        }}>
          เจ้าถูกปีศาจปราบ...{'\n'}ลองใหม่อีกครั้ง
        </Text>

        <Pressable
          onPress={onHome}
          style={({ pressed }) => ({
            backgroundColor: pressed ? 'rgba(100,0,0,0.9)' : 'rgba(130,0,0,0.8)',
            paddingHorizontal: 44, paddingVertical: 13,
            borderRadius: 22, borderWidth: 1.5,
            borderColor: 'rgba(200,50,50,0.55)',
          })}
        >
          <Text style={{
            color: 'white', fontSize: 15,
            fontFamily: 'ChakraPetch_600SemiBold',
          }}>
            กลับหน้าหลัก
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}
