import {pulpColors} from '../../theme';
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
import {font} from '../../theme';
import {paper} from '../Paper';
import RitualSurface from '../RitualSurface';
import InkIcon from '../InkIcon';
import {CardGlyphArt} from '../DeckCard';

const CARD_W      = 150;
const CARD_H      = 200;
const IDLE_SCALE  = 0.32;   // เล็กลง — นั่งอยู่เหนือ badge enemy
const SLOT_W      = 40;

const PHASE_ENTER = 450;
const PHASE_FLIP  = 300;
const PHASE_RISE  = 350;
const PHASE_HOLD  = 1300;
const PHASE_EXIT  = 200;

export const ENEMY_PLAY_TOTAL      = PHASE_FLIP + PHASE_RISE + PHASE_HOLD + PHASE_EXIT; // 1350ms
export const ENEMY_MAX_SCALE_OFFSET = PHASE_FLIP + PHASE_RISE; // 650ms — จังหวะที่ card ใหญ่สุด

const easeOut  = Easing.out(Easing.cubic);
const easeBack = Easing.out(Easing.back(1.4));
const easeIn   = Easing.in(Easing.quad);

interface Props {
  card: { name: string; damage: number; block: number; cost?: number };
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
    if (playing) return;
    const t = setTimeout(() => {
      posY.value    = withTiming(idlePosY, { duration: PHASE_ENTER, easing: easeOut });
      opacity.value = withTiming(1, { duration: 350 });
    }, delay);
    return () => clearTimeout(t);
  }, [playing]);

  // Phase 2: when playing=true → flip, rise, hold, exit
  React.useEffect(() => {
    if (!playing) return;

    opacity.value = 1;
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


  return (
    <Animated.View style={containerStyle}>
      {/* Back face (face-down) */}
      <Animated.View style={backStyle}>
        <RitualSurface kind="occupationPage" style={{flex:1,alignItems:'center',justifyContent:'center',padding:5,borderWidth:2,borderColor:pulpColors.enemyInk}}><InkIcon name="blessing" size={66} color={pulpColors.enemyInk}/></RitualSurface>
      </Animated.View>

      {/* Front face */}
      <Animated.View style={frontStyle}>
        <RitualSurface kind="occupationPage" style={{flex:1,alignItems:'center',justifyContent:'center',padding:10,gap:10,borderWidth:2,borderColor:paper.red}}><Image source={isAttack?require('../../../assets/ui/trail-ghost.png'):require('../../../assets/ui/blessing-amulet.png')} resizeMode="contain" style={{width:70,height:70}}/><Text style={{color:paper.ink,fontFamily:font.ui,fontSize:11}}>พลัง {card.cost??1}</Text><Text style={{color:paper.ink,fontFamily:font.heading,fontSize:16,textAlign:'center'}}>{card.name}</Text>{card.damage>0&&<Text style={{color:paper.red,fontFamily:font.heading,fontSize:24}}>โจมตี {card.damage}</Text>}{card.block>0&&<Text style={{color:paper.ink,fontFamily:font.heading,fontSize:18}}>เกราะ {card.block}</Text>}</RitualSurface>
      </Animated.View>

    </Animated.View>
  );
}
