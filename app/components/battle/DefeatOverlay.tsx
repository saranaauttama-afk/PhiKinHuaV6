import {paperPalette as palette,paperSurface as surface,PaperTexture} from '../Paper';
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withSequence, Easing,
} from 'react-native-reanimated';
import { tint, layer,font } from '../../theme';
import RitualSurface from '../RitualSurface';
import {QuietButton} from '../QuietChrome';

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
      justifyContent: 'center', alignItems: 'center', zIndex: layer.overlay,
    }, bgStyle]}>

      <Animated.View style={[{width:'90%',maxWidth:480},cardStyle]}><RitualSurface kind="occupationPage" style={{alignItems:'center',padding:28}}>

        {/* Title */}
        <Text style={{
          color: palette.blood, fontSize: 34,
          fontFamily: font.display,
          textShadowColor: palette.bloodDeep,
          textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16,
          marginBottom: 12,
        }}>
          พ่ายแพ้
        </Text>

        <Text style={{
          color: palette.textFaint, fontSize: 14,
          fontFamily: font.ui,
          textAlign: 'center', marginBottom: 24,
          lineHeight: 22,
        }}>
          เจ้าถูกปีศาจปราบ...{'\n'}ลองใหม่อีกครั้ง
        </Text>

        <QuietButton primary label="กลับหน้าหลัก" onPress={onHome} style={{alignSelf:'stretch'}}/>
      </RitualSurface>
      </Animated.View>
    </Animated.View>
  );
}
