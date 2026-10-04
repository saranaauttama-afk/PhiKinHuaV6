import {pulpColors} from '../theme';
import React, { useState } from 'react';
import { View, Text, Image, ImageBackground } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  cancelAnimation,
  runOnJS
} from 'react-native-reanimated';
import type { CardData } from '../../src/core/types';
import { palette, surface, tint, layer, font } from '../theme';
import Paper,{paper} from './Paper';
import InkIcon from './InkIcon';

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
  animationDelay?: number; // For staggered entrance
  /** ค่าร่ายจริง ณ ตอนนี้ — การ์ดบางใบถูกลงตามจำนวนใบที่เล่นไปแล้วในเทิร์น */
  costNow?: number;
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

  const updateHoverState = (hovered: boolean) => {
    setIsHovered(hovered);
    if (onHoverChange) {
      onHoverChange(hovered);
    }
  };
  const translateY = useSharedValue(200);
  const dragOffsetY = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const isPlayedShared = useSharedValue(false);
  const isDisabledShared = useSharedValue(disabled);

  React.useEffect(() => {
    isDisabledShared.value = disabled;
  }, [disabled]);

  // Entrance animation on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      translateY.value = withTiming(0, { duration: 600 });
      scale.value = withTiming(1, { duration: 600 });
      opacity.value = withTiming(1, { duration: 600 });
    }, animationDelay);

    return () => clearTimeout(timer);
  }, [animationDelay]);

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
    .onBegin(() => {
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
      if (event.translationY < -50) {
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
      { translateX: shakeX.value },
      { translateY: translateY.value + dragOffsetY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={isPlayed ? Gesture.Tap() : composedGesture}>
      <Animated.View accessible accessibilityRole="button" accessibilityLabel={`การ์ด ${card.name} พลัง ${costNow ?? card.cost}`} style={[
        {
          width,
          height,
          zIndex: isHovered ? 999 : 1,
        },
        animatedStyle
      ]}>
      <Paper style={{width:'100%',height:'100%',padding:7,paddingTop:10,backgroundColor:selected?pulpColors.selectedPaper:paper.bg,borderWidth:selected?2:1,borderColor:selected?paper.red:paper.line,opacity:disabled?.68:1}}>
        <View style={{position:'absolute',top:4,left:4,width:25,height:25,borderRadius:13,backgroundColor:paper.ink,alignItems:'center',justifyContent:'center',zIndex:layer.badge}}><Text style={{color:paper.light,fontFamily:font.heading,fontSize:14}}>{costNow??card.cost}</Text></View>
        <View style={{alignItems:'center',justifyContent:'center',height:height*.27,marginTop:8,borderBottomWidth:1,borderColor:paper.line}}><InkIcon name={card.type==='attack'?'attack':card.type==='equipment'?'gold':card.type==='trap'?'block':'blessing'} size={height*.21} color={card.type==='attack'?paper.red:paper.ink}/></View>
        <Text numberOfLines={2} style={{fontFamily:font.heading,fontSize:width>130?17:11,lineHeight:width>130?24:14,color:paper.ink,textAlign:'center',marginTop:6}}>{card.name}</Text>
        <Text numberOfLines={width>130?8:2} style={{fontFamily:font.body,fontSize:width>130?23:16,lineHeight:width>130?26:16,color:paper.muted,textAlign:'center',marginTop:4}}>{card.desc}</Text>
        {card.exhaust&&<Text style={{position:'absolute',bottom:4,alignSelf:'center',fontFamily:font.ui,color:paper.red,fontSize:9}}>ใช้แล้วหาย</Text>}
      </Paper>
      </Animated.View>
    </GestureDetector>
  );
}