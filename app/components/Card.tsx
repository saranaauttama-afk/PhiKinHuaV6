import {pulpColors,badgeColors} from '../theme';
import React, { useState } from 'react';
import { View, Text, Image, ImageBackground } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withSequence,
  withDelay,
  cancelAnimation,
  runOnJS
} from 'react-native-reanimated';
import {useGameSettings} from './Settings';
import type { CardData } from '../../src/core/types';
import { palette, surface, tint, layer, font } from '../theme';
import {paper} from './Paper';
import CandleSelection from './CandleSelection';
import RitualSurface from './RitualSurface';
import CardBadges from './CardBadges';
import { CardGlyphArt } from './DeckCard';
import { cardSummary } from '../cardPresentation';
import { costLabel } from '../../src/core/cards/describe';

interface CardProps {
  card: CardData;
  width?: number;
  height?: number;
  onPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  onDragPlay?: () => void;
  onHoverChange?: (isHovered: boolean) => void;
  isPlayed?: boolean;
  animationDelay?: number; // Stagger only newly mounted physical copies.
  /** ค่าร่ายจริง ณ ตอนนี้ — การ์ดบางใบถูกลงตามจำนวนใบที่เล่นไปแล้วในเทิร์น */
  costNow?: { ap: number; mana: number };
}

export default function Card({
  card,
  width = 80,
  height = 110,
  onPress,
  disabled = false,
  selected = false,
  onDragPlay,
  onHoverChange,
  isPlayed = false,
  animationDelay = 0,
  costNow,
}: CardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const badgeTop=Math.max(10,Math.round(height*.07));
  const headerPadding=badgeTop+24;
  const illustrationSize=Math.max(14,Math.min(height*.38,height-94)-(headerPadding-28));
  const reducedMotion=useGameSettings(s=>s.reducedMotion);
  const entrance=useSharedValue(reducedMotion?1:0);
  React.useEffect(()=>{entrance.value=reducedMotion?1:withDelay(animationDelay,withTiming(1,{duration:380,easing:Easing.out(Easing.cubic)}));},[reducedMotion]);

  const updateHoverState = (hovered: boolean) => {
    setIsHovered(hovered);
    if (onHoverChange) {
      onHoverChange(hovered);
    }
  };
  const translateY = useSharedValue(0);
  const dragOffsetY = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isPlayedShared = useSharedValue(false);
  const isDisabledShared = useSharedValue(disabled);

  React.useEffect(() => {
    isDisabledShared.value = disabled;
  }, [disabled]);

  // Dealt cards start visible and inside their touch bounds, including resume.
  // Only a played card leaves the hand; entrance timing cannot hide a live card.

  React.useEffect(() => {
    if (isPlayed) {
      isPlayedShared.value = true;
      cancelAnimation(translateY);
      cancelAnimation(dragOffsetY);
      cancelAnimation(scale);
      // Flash: scale pop to 1.3 then shrink+fade
      scale.value = withSequence(
        withTiming(1.3, { duration: 100 }),
        withTiming(0.8, { duration: 700 })
      );
      opacity.value = withDelay(100, withTiming(0, { duration: 700 }));
      translateY.value = withDelay(100, withTiming(-200, { duration: 700 }));
    }
  }, [isPlayed]);

  const handleDragPlay = () => {
    if (onDragPlay && !disabled) {
      onDragPlay();
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  const panGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .failOffsetX([-20, 20])
    .onStart(() => {
      'worklet';
      // Lift the card — dragOffsetY handles finger follow independently
      translateY.value = withTiming(-20, { duration: 150 });
      scale.value = withTiming(1.1, { duration: 150 });
      runOnJS(updateHoverState)(true);
    })
    .onUpdate((event) => {
      'worklet';
      // Track finger separately — does NOT cancel the lift animation
      dragOffsetY.value = Math.min(0, event.translationY);
    })
    .onEnd((event) => {
      'worklet';
      if (event.translationY < -90 && Math.abs(event.translationX) < 55) {
        if (isDisabledShared.value) {
          shakeX.value = withSequence(
            withTiming(15, { duration: 60 }),
            withTiming(-15, { duration: 60 }),
            withTiming(10, { duration: 60 }),
            withTiming(-10, { duration: 60 }),
            withTiming(0, { duration: 60 })
          );
        } else {
          runOnJS(handleDragPlay)();
        }
      }
      runOnJS(updateHoverState)(false);
    })
    .onFinalize(() => {
      'worklet';
      runOnJS(updateHoverState)(false);
      // Skip reset if card was already played (avoid racing with fade-out)
      if (isPlayedShared.value) return;
      translateY.value = withTiming(0, { duration: 300 });
      dragOffsetY.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(1, { duration: 300 });
    });

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(handlePress)();
    });

  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      // Drawn cards slide up from the draw pile (bottom-left) into place.
      { translateX: shakeX.value - 150*(1-entrance.value) },
      { translateY: translateY.value + dragOffsetY.value + 110*(1-entrance.value) },
      { rotate: `${-12*(1-entrance.value)}deg` },
      { scale: scale.value*(.6+.4*entrance.value) },
    ],
    // Never fully hidden: a live card stays readable even if the timing is skipped.
    opacity: opacity.value*(.25+.75*entrance.value),
  }));

  return (
    <GestureDetector gesture={isPlayed ? Gesture.Tap() : composedGesture}>
      <Animated.View testID={`hand-card-${card.instanceId??card.id}`} accessible accessibilityRole="button" accessibilityLabel={`การ์ด ${card.name} ${costLabel(card, costNow)}`} style={[
        {
          width,
          height,
          zIndex: isHovered ? 999 : 1,
        },
        animatedStyle
      ]}>
      <CandleSelection selected={selected}><RitualSurface kind={disabled?"hideGray":"hideCard"} style={{width:'100%',height:'100%',padding:9,paddingTop:headerPadding,paddingBottom:4}}>
        <View style={{position:'absolute',top:badgeTop,left:Math.max(12,width*.14),right:Math.max(12,width*.14),zIndex:layer.badge}}><CardBadges card={card} cost={costNow} compact/></View>
        <Text numberOfLines={2} style={{fontFamily:font.heading,fontSize:12,lineHeight:16,color:paper.ink,textAlign:'center'}}>{card.name}</Text>
        <View style={{alignItems:'center',marginVertical:2}}><CardGlyphArt card={card} size={illustrationSize} muted={disabled}/></View>
        <Text numberOfLines={2} style={{fontFamily:font.ui,fontSize:10,lineHeight:14,color:disabled?badgeColors.disabledInk:card.type==='attack'?paper.red:paper.ink,textAlign:'center'}}>{cardSummary(card)}</Text>
        {card.exhaust&&<Text style={{position:'absolute',bottom:5,alignSelf:'center',fontFamily:font.ui,color:paper.red,fontSize:8}}>ใช้แล้วหาย</Text>}
      </RitualSurface></CandleSelection>
      </Animated.View>
    </GestureDetector>
  );
}
