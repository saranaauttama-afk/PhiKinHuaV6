import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withSequence, Easing,
} from 'react-native-reanimated';
import { palette, surface, tint } from '../../theme';

type Props = {
  enemyName: string;
  expGained: number;
  goldGained: number;
  playerLevel: number;
  playerExp: number;
  playerExpToNext: number;
  onContinue: () => void;
};

export default function VictoryOverlay({
  enemyName, expGained, goldGained,
  playerLevel, playerExp, playerExpToNext,
  onContinue,
}: Props) {
  const bgOpacity   = useSharedValue(0);
  const cardY       = useSharedValue(60);
  const cardOpacity = useSharedValue(0);
  const expBar      = useSharedValue(0);
  const goldScale   = useSharedValue(0);

  const expFraction = Math.min(1, playerExp / Math.max(1, playerExpToNext));

  React.useEffect(() => {
    bgOpacity.value   = withTiming(1, { duration: 350 });
    cardOpacity.value = withDelay(150, withTiming(1, { duration: 350 }));
    cardY.value       = withDelay(150, withTiming(0, { duration: 400, easing: Easing.out(Easing.back(1.2)) }));
    expBar.value      = withDelay(500, withTiming(expFraction, { duration: 900, easing: Easing.out(Easing.cubic) }));
    goldScale.value   = withDelay(400, withSequence(
      withTiming(1.2, { duration: 200, easing: Easing.out(Easing.back(2)) }),
      withTiming(1,   { duration: 150 }),
    ));
  }, []);

  const bgStyle   = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({ opacity: cardOpacity.value, transform: [{ translateY: cardY.value }] }));
  const barStyle  = useAnimatedStyle(() => ({ width: `${expBar.value * 100}%` as any }));
  const goldStyle = useAnimatedStyle(() => ({ transform: [{ scale: goldScale.value }] }));

  return (
    <Animated.View style={[{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: palette.scrimHeavy,
      justifyContent: 'center', alignItems: 'center', zIndex: 500,
    }, bgStyle]}>
      <Animated.View style={[{ width: 300, alignItems: 'center' }, cardStyle]}>

        {/* Title */}
        <Text style={{
          color: palette.moon, fontSize: 42,
          fontFamily: 'Prompt_700Bold',
          textShadowColor: palette.lineStrong,
          textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12,
          marginBottom: 4,
        }}>
          ชนะ!
        </Text>
        <Text style={{
          color: palette.textFaint, fontSize: 13,
          fontFamily: 'Prompt_400Regular', marginBottom: 28,
        }}>
          {enemyName} ถูกปราบแล้ว
        </Text>

        {/* EXP row */}
        <View style={{ width: '100%', marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ color: palette.moonDim, fontSize: 12, fontFamily: 'Prompt_400Regular' }}>
              Lv.{playerLevel}  EXP
            </Text>
            <Text style={{ color: palette.moon, fontSize: 13, fontFamily: 'Prompt_700Bold' }}>
              +{expGained}
            </Text>
          </View>
          <View style={{
            width: '100%', height: 12,
            backgroundColor: surface.glass, borderRadius: 6,
            borderWidth: 1, borderColor: tint.moonSoft,
            overflow: 'hidden',
          }}>
            <Animated.View style={[{
              height: '100%',
              backgroundColor: palette.lineStrong, borderRadius: 5,
            }, barStyle]} />
          </View>
          <Text style={{
            color: palette.textFaint, fontSize: 10,
            fontFamily: 'Prompt_400Regular',
            textAlign: 'right', marginTop: 3,
          }}>
            {playerExp} / {playerExpToNext}
          </Text>
        </View>

        {/* Gold row */}
        <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 36 }, goldStyle]}>
          <Text style={{ fontSize: 28 }}>💰</Text>
          <Text style={{
            color: palette.moon, fontSize: 28,
            fontFamily: 'Prompt_700Bold',
            textShadowColor: palette.line,
            textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8,
          }}>
            +{goldGained}
          </Text>
        </Animated.View>

        {/* Continue button */}
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => ({
            backgroundColor: pressed ? palette.paperDeep : palette.paper,
            paddingHorizontal: 48, paddingVertical: 13,
            borderRadius: 22, borderWidth: 1.5,
            borderColor: palette.lineStrong,
          })}
        >
          <Text style={{
            color: palette.text, fontSize: 15,
            fontFamily: 'Prompt_600SemiBold',
            textShadowColor: surface.glass,
            textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
          }}>
            ดำเนินต่อ
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}
