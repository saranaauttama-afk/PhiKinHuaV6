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
import {enemyLane} from '../../battleGeometry';
import { useBattleLayout } from './battleLayout';
import {font} from '../../theme';
import {paper} from '../Paper';
import RitualSurface from '../RitualSurface';
import InkIcon from '../InkIcon';
import {CardGlyphArt} from '../DeckCard';

const CARD_W      = 200;
const CARD_H      = 270;
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
  card: { id?: string; name: string; damage: number; block: number; cost?: number; hits?: number; desc?: string };
  ownerIndex?:number;
  ownerCount?:number;
  cardIndex: number;
  totalCards: number;
  delay: number;    // slide-in delay (staggered)
  playing: boolean; // when true → flip + rise + exit
  /** ยิงตอนการ์ดโจมตีขึ้นเต็มขนาด — ให้หน้าแม่วาดจอแฟลช */
  onAttackPeak?: () => void;
}

export default function EnemyHandCard({
  card, cardIndex, totalCards, delay, playing, onAttackPeak, ownerIndex=0,ownerCount=1,
}: Props) {
  const layout = useBattleLayout();

  const lane=enemyLane(layout,ownerIndex,ownerCount);
  const peakScale=Math.min(lane.cardW/CARD_W,lane.cardH/CARD_H)/1.12;
  const slotStep=Math.min(18,lane.cardW/Math.max(1,totalCards));
  const slotCenterX=lane.cardX-(totalCards-1)*slotStep/2+cardIndex*slotStep;
  const idlePosX=slotCenterX-CARD_W/2;
  const idlePosY=lane.cardY-CARD_H/2;
  const centerX=lane.cardX-CARD_W/2;
  const centerY=lane.cardY-CARD_H/2;

  const posX    = useSharedValue(idlePosX);
  const posY    = useSharedValue(idlePosY - 80); // start above slot
  const scale   = useSharedValue(Math.min(.20,peakScale*.65));
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
      withTiming(Math.min(.20,peakScale*.65), { duration: PHASE_FLIP }),
      withTiming(peakScale,  { duration: PHASE_RISE, easing: easeBack }),
      withTiming(peakScale,  { duration: PHASE_HOLD }),
      withTiming(peakScale*1.12,{ duration: PHASE_EXIT, easing: easeOut }),
    );

    // A timed opacity sequence collapses to zero under Android reduced motion.
    // Keep the revealed information visible for the same JS timeline dwell time.
    opacity.value = 1;
    const exitTimer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: PHASE_EXIT, easing: easeIn });
    }, PHASE_FLIP + PHASE_RISE + PHASE_HOLD);
    return () => clearTimeout(exitTimer);

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
    <Animated.View pointerEvents="none" testID={`enemy-played-${ownerIndex}`} accessibilityLabel={playing?`ผีเล่น ${card.name}`:undefined} style={containerStyle}>
      {/* Back face (face-down) */}
      <Animated.View style={backStyle}>
        <RitualSurface kind="occupationPage" style={{flex:1,alignItems:'center',justifyContent:'center',padding:5}}><Image source={require('../../../assets/ui/trail-ghost.png')} resizeMode="contain" style={{width:100,height:140}}/></RitualSurface>
      </Animated.View>

      {/* Front face */}
      <Animated.View style={frontStyle}>
        {playing && <RitualSurface kind="occupationPage" style={{flex:1,alignItems:'center',justifyContent:'center',padding:10,gap:4}}>
          <Text style={{color:paper.ink,fontFamily:font.ui,fontSize:18}}>พลัง {card.cost??1}</Text>
          <CardGlyphArt card={{id:card.id??'',name:card.name,type:isAttack?'attack':'skill',cost:card.cost??1}} size={68}/>
          <Text numberOfLines={2} style={{color:paper.ink,fontFamily:font.heading,fontSize:22,textAlign:'center'}}>{card.name}</Text>
          {card.damage>0&&<Text style={{color:paper.red,fontFamily:font.heading,fontSize:22}}>โจมตี {card.damage}{(card.hits??1)>1?` ×${card.hits}`:''}</Text>}
          {card.block>0&&<Text style={{color:paper.ink,fontFamily:font.heading,fontSize:21}}>ป้องกัน {card.block}</Text>}
          {!!card.desc&&<Text numberOfLines={2} style={{color:paper.ink,fontFamily:font.ui,fontSize:18,lineHeight:18,textAlign:'center'}}>{card.desc}</Text>}
        </RitualSurface>}
      </Animated.View>

    </Animated.View>
  );
}
