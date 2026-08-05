import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withSequence, Easing,
} from 'react-native-reanimated';
import { palette, surface, tint, layer } from '../../theme';

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
      backgroundColor: palette.scrimHeavy,
      justifyContent: 'center', alignItems: 'center', zIndex: layer.battleOverlay,
    }, bgStyle]}>
      <Animated.View style={[{ alignItems: 'center' }, cardStyle]}>

        {/* Title */}
        <Text style={{
          color: palette.blood, fontSize: 48,
          fontFamily: 'Prompt_700Bold',
          textShadowColor: palette.bloodDeep,
          textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16,
          marginBottom: 12,
        }}>
          พ่ายแพ้
        </Text>

        <Text style={{
          color: palette.textFaint, fontSize: 14,
          fontFamily: 'Prompt_400Regular',
          textAlign: 'center', marginBottom: 52,
          lineHeight: 22,
        }}>
          เจ้าถูกปีศาจปราบ...{'\n'}ลองใหม่อีกครั้ง
        </Text>

        <Pressable
          onPress={onHome}
          style={({ pressed }) => ({
            // ต้องต่างกันจริงตอนกด ไม่งั้นปุ่มไม่มีฟีดแบ็กว่าโดนแตะแล้ว
            backgroundColor: pressed ? tint.bloodSoft : palette.bloodDeep,
            paddingHorizontal: 44, paddingVertical: 13,
            borderRadius: 22, borderWidth: 1.5,
            borderColor: tint.bloodLine,
          })}
        >
          <Text style={{
            color: palette.text, fontSize: 15,
            fontFamily: 'Prompt_600SemiBold',
          }}>
            กลับหน้าหลัก
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}
