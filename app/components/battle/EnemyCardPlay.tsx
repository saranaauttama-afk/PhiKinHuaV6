import React from 'react';
import { View, Image, Text, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface Props {
  card: { name: string; damage: number; block: number };
  fromX?: number;
}

export const CARD_W = 110;
const CARD_H        = 150;
const START_SCALE   = 0.36;  // 150 * 0.36 = 54px — matches FaceDownCard height exactly

export const PHASE_ARRIVE = 200;
export const PHASE_FLIP   = 300;
export const PHASE_RISE   = 350;
export const PHASE_HOLD   = 600;
export const PHASE_EXIT   = 200;
export const ENEMY_CARD_TOTAL = PHASE_ARRIVE + PHASE_FLIP + PHASE_RISE + PHASE_HOLD + PHASE_EXIT;

const easeOut  = Easing.out(Easing.cubic);
const easeBack = Easing.out(Easing.back(1.4));
const easeIn   = Easing.in(Easing.quad);

export default function EnemyCardPlay({ card, fromX }: Props) {
  const { width: W, height: H } = useWindowDimensions();

  const centerX = W / 2 - CARD_W / 2;
  const centerY = H / 2 - CARD_H / 2 - 40;

  // Fixed layout: paddingTop(65) + sprite(300) + badge(80) + marginBottom(15) + halfHand(30) = 490
  const handY   = 490 - CARD_H / 2;
  const startX  = fromX ?? centerX;

  const posY         = useSharedValue(handY);
  const posX         = useSharedValue(startX);
  const scale        = useSharedValue(START_SCALE);
  const opacity      = useSharedValue(0);
  const flip         = useSharedValue(0);
  const flashOpacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: PHASE_ARRIVE, easing: easeOut }),
      withTiming(1, { duration: PHASE_FLIP + PHASE_RISE + PHASE_HOLD }),
      withTiming(0, { duration: PHASE_EXIT, easing: easeIn }),
    );

    flip.value = withSequence(
      withTiming(0, { duration: PHASE_ARRIVE }),
      withTiming(1, { duration: PHASE_FLIP, easing: easeOut }),
    );

    posY.value = withSequence(
      withTiming(handY,   { duration: PHASE_ARRIVE + PHASE_FLIP }),
      withTiming(centerY, { duration: PHASE_RISE, easing: easeBack }),
    );

    posX.value = withSequence(
      withTiming(startX,  { duration: PHASE_ARRIVE + PHASE_FLIP }),
      withTiming(centerX, { duration: PHASE_RISE, easing: easeBack }),
    );

    scale.value = withSequence(
      withTiming(START_SCALE, { duration: PHASE_ARRIVE + PHASE_FLIP }),
      withTiming(1,           { duration: PHASE_RISE, easing: easeBack }),
      withTiming(1,           { duration: PHASE_HOLD }),
      withTiming(1.12,        { duration: PHASE_EXIT, easing: easeOut }),
    );

    if (card.damage > 0) {
      flashOpacity.value = withDelay(
        PHASE_ARRIVE + PHASE_FLIP + PHASE_RISE,
        withSequence(
          withTiming(0.35, { duration: 120, easing: easeOut }),
          withTiming(0,    { duration: 280, easing: easeOut }),
        )
      );
    }
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: posY.value,
    left: posX.value,
    width: CARD_W,
    height: CARD_H,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const backStyle = useAnimatedStyle(() => ({
    position: 'absolute', width: '100%', height: '100%',
    opacity: flip.value < 0.5 ? 1 : 0,
    transform: [{ perspective: 900 }, { rotateY: `${flip.value * 90}deg` }],
  }));

  const frontStyle = useAnimatedStyle(() => ({
    position: 'absolute', width: '100%', height: '100%',
    opacity: flip.value >= 0.5 ? 1 : 0,
    transform: [{ perspective: 900 }, { rotateY: `${(flip.value - 1) * 90}deg` }],
  }));

  const screenFlashStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(200,30,30,1)',
    opacity: flashOpacity.value * 0.4,
  }));

  const cardFlashStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,60,60,1)',
    opacity: flashOpacity.value,
    borderRadius: 10,
  }));

  const isAttack    = card.damage > 0;
  const borderColor = isAttack ? 'rgba(220,60,60,0.85)' : 'rgba(60,130,220,0.85)';
  const bgColor     = isAttack ? 'rgba(255,80,80,0.12)' : 'rgba(60,140,255,0.12)';

  return (
    <>
      <Animated.View pointerEvents="none" style={screenFlashStyle} />

      <Animated.View style={containerStyle}>
        <Animated.View style={backStyle}>
          <Image
            source={require('../../../assets/images/monsters/bgMonsterCardBackMini.png')}
            style={{ width: '100%', height: '100%', borderRadius: 10 }}
            resizeMode="cover"
          />
        </Animated.View>

        <Animated.View style={frontStyle}>
          <View style={{
            flex: 1, borderRadius: 10,
            borderWidth: 2, borderColor,
            backgroundColor: bgColor,
            overflow: 'hidden',
          }}>
            <Image
              source={require('../../../assets/images/monsters/bgCardMonster.png')}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 10, gap: 8 }}>
              <Text style={{
                color: 'rgba(255,230,230,0.95)', fontSize: 11,
                fontFamily: 'Prompt_600SemiBold', textAlign: 'center',
              }}>
                {card.name}
              </Text>
              {card.damage > 0 && (
                <Text style={{ color: '#ff4444', fontSize: 36, fontFamily: 'Prompt_700Bold' }}>
                  ⚔ {card.damage}
                </Text>
              )}
              {card.block > 0 && (
                <Text style={{ color: '#4dabf7', fontSize: 36, fontFamily: 'Prompt_700Bold' }}>
                  🛡 {card.block}
                </Text>
              )}
              {card.damage === 0 && card.block === 0 && (
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 22 }}>✦</Text>
              )}
            </View>
            <Animated.View style={cardFlashStyle} pointerEvents="none" />
          </View>
        </Animated.View>
      </Animated.View>
    </>
  );
}
