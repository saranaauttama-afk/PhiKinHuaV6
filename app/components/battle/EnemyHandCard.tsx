import React from 'react';
import { View, Image, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useBattleLayout } from './battleLayout';
import { palette, surface, tint } from '../../theme';

const CARD_W      = 110;
const CARD_H      = 150;
const IDLE_SCALE  = 0.28;   // เล็กลง — นั่งอยู่เหนือ badge enemy
const SLOT_W      = 40;

const PHASE_ENTER = 450;
const PHASE_FLIP  = 300;
const PHASE_RISE  = 350;
const PHASE_HOLD  = 500;
const PHASE_EXIT  = 200;

export const ENEMY_PLAY_TOTAL      = PHASE_FLIP + PHASE_RISE + PHASE_HOLD + PHASE_EXIT; // 1350ms
export const ENEMY_MAX_SCALE_OFFSET = PHASE_FLIP + PHASE_RISE; // 650ms — จังหวะที่ card ใหญ่สุด

const easeOut  = Easing.out(Easing.cubic);
const easeBack = Easing.out(Easing.back(1.4));
const easeIn   = Easing.in(Easing.quad);

interface Props {
  card: { name: string; damage: number; block: number };
  cardIndex: number;
  totalCards: number;
  delay: number;    // slide-in delay (staggered)
  playing: boolean; // when true → flip + rise + exit
  /** ยิงตอนการ์ดโจมตีขึ้นเต็มขนาด — ให้หน้าแม่วาดจอแฟลช */
  onAttackPeak?: () => void;
}

export default function EnemyHandCard({
  card, cardIndex, totalCards, delay, playing, onAttackPeak,
}: Props) {
  const layout = useBattleLayout();

  const slotCenterX =
    layout.screenW / 2 - (totalCards * SLOT_W) / 2 + cardIndex * SLOT_W + SLOT_W / 2;
  const idlePosX    = slotCenterX - CARD_W / 2;
  const idlePosY    = layout.enemyHandCenterY - CARD_H / 2;
  const centerX     = layout.centerX - CARD_W / 2;
  const centerY     = layout.centerY - CARD_H / 2;

  const posX    = useSharedValue(idlePosX);
  const posY    = useSharedValue(idlePosY - 80); // start above slot
  const scale   = useSharedValue(IDLE_SCALE);
  const opacity = useSharedValue(0);
  const flip    = useSharedValue(0);

  // Phase 1: slide in to slot (face-down)
  React.useEffect(() => {
    const t = setTimeout(() => {
      posY.value    = withTiming(idlePosY, { duration: PHASE_ENTER, easing: easeOut });
      opacity.value = withTiming(1, { duration: 350 });
    }, delay);
    return () => clearTimeout(t);
  }, []);

  // Phase 2: when playing=true → flip, rise, hold, exit
  React.useEffect(() => {
    if (!playing) return;

    flip.value = withTiming(1, { duration: PHASE_FLIP, easing: easeOut });

    posX.value = withSequence(
      withTiming(idlePosX, { duration: PHASE_FLIP }),
      withTiming(centerX,  { duration: PHASE_RISE, easing: easeBack }),
    );

    posY.value = withSequence(
      withTiming(idlePosY, { duration: PHASE_FLIP }),
      withTiming(centerY,  { duration: PHASE_RISE, easing: easeBack }),
    );

    scale.value = withSequence(
      withTiming(IDLE_SCALE, { duration: PHASE_FLIP }),
      withTiming(1,          { duration: PHASE_RISE, easing: easeBack }),
      withTiming(1,          { duration: PHASE_HOLD }),
      withTiming(1.12,       { duration: PHASE_EXIT, easing: easeOut }),
    );

    opacity.value = withSequence(
      withTiming(1, { duration: PHASE_FLIP + PHASE_RISE + PHASE_HOLD }),
      withTiming(0, { duration: PHASE_EXIT, easing: easeIn }),
    );

    // จอแฟลชตอนการ์ดโจมตีขึ้นเต็มขนาด — วาดที่ root ของหน้า (ดู ScreenFlash)
    // ไม่ใช่ในการ์ดใบนี้ เพราะ container ของการ์ดถูก scale/translate อยู่
    if (card.damage > 0) {
      const t = setTimeout(() => onAttackPeak?.(), PHASE_FLIP + PHASE_RISE);
      return () => clearTimeout(t);
    }
  }, [playing]);

  const containerStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: posY.value,
    left: posX.value,
    width: CARD_W,
    height: CARD_H,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    zIndex: playing ? 250 : 10,
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

  const isAttack = card.damage > 0;
  const bgColor  = isAttack ? tint.bloodSoft : tint.moonFaint;

  return (
    <Animated.View style={containerStyle}>
      {/* Back face (face-down) */}
      <Animated.View style={backStyle}>
        <Image
          source={require('../../../assets/images/monsters/bgMonsterCardBackMini.png')}
          style={{ width: '100%', height: '100%', borderRadius: 10 }}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Front face */}
      <Animated.View style={frontStyle}>
        <View style={{
          flex: 1, borderRadius: 10,
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
              color: palette.text, fontSize: 11,
              fontFamily: 'Prompt_600SemiBold', textAlign: 'center',
            }}>
              {card.name}
            </Text>
            {card.damage > 0 && (
              <Text style={{ color: palette.bloodLit, fontSize: 36, fontFamily: 'Prompt_700Bold' }}>
                ⚔ {card.damage}
              </Text>
            )}
            {card.block > 0 && (
              <Text style={{ color: palette.moon, fontSize: 36, fontFamily: 'Prompt_700Bold' }}>
                🛡 {card.block}
              </Text>
            )}
            {card.damage === 0 && card.block === 0 && (
              <Text style={{ color: palette.textDim, fontSize: 22 }}>✦</Text>
            )}
          </View>
        </View>
      </Animated.View>

    </Animated.View>
  );
}
