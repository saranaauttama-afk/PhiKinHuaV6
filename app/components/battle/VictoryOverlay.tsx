import {palette,surface,font} from '../../theme';
import PostBattleSurface from './PostBattleSurface';
import RitualSurface from '../RitualSurface';
import {GameButton} from '../Panel';
import {Image} from 'react-native';
import React from 'react';
import InkIcon from '../InkIcon';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withSequence, Easing,
} from 'react-native-reanimated';
import { tint, layer } from '../../theme';

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
    <PostBattleSurface>
      <Animated.View style={bgStyle}>
      <Animated.View style={[{ width: '100%', alignItems: 'center' }, cardStyle]}>

        <Image source={require('../../../assets/ui/blessing-amulet.png')} resizeMode="contain" style={{width:80,height:80,marginBottom:12}}/>
        <RitualSurface kind="wood" style={{width:'100%',alignItems:'center',padding:24}}>
        {/* Title */}
        <Text style={{
          color: palette.moon, fontSize: 42,
          fontFamily: 'Prompt_700Bold',
          textShadowColor: palette.lineStrong,
          textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12,
          marginBottom: 4,
        }}>
          ปราบสำเร็จ
        </Text>
        <Text style={{
          color: palette.text, fontSize: 13,
          fontFamily: 'Prompt_400Regular', marginBottom: 12,
        }}>
          {enemyName} ถูกปราบแล้ว
        </Text>

        </RitualSurface>
        <RitualSurface kind="slate" style={{width:'100%',padding:24,marginTop:12}}>
        {/* EXP row */}
        <View style={{ width: '100%', marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ color: palette.moonDim, fontSize: 12, fontFamily: 'Prompt_400Regular' }}>
              เลเวล {playerLevel} · ประสบการณ์
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
              backgroundColor: palette.blood, borderRadius: 5,
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
          <InkIcon name="gold" size={32} color={palette.moon}/>
          <Text style={{
            color: palette.moon, fontSize: 28,
            fontFamily: 'Prompt_700Bold',
            textShadowColor: palette.line,
            textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8,
          }}>
            +{goldGained} เบี้ย
          </Text>
        </Animated.View>

        </RitualSurface>
        <GameButton label="ดำเนินต่อ" tone="primary" onPress={onContinue} style={{marginTop:18}}/>
      </Animated.View>
      </Animated.View>
    </PostBattleSurface>
  );
}
