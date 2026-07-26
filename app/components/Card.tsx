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
import { palette, surface, tint } from '../theme';

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
  animationDelay = 0
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
    if (onPress && !disabled) {
      onPress();
    }
  };

  const panGesture = Gesture.Pan()
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
      <Animated.View style={[
        {
          width,
          height,
          zIndex: isHovered ? 999 : 1,
        },
        animatedStyle
      ]}>
      <ImageBackground
        source={require('../../assets/images/players/bgCardPlayer.png')}
        style={{
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
        resizeMode="stretch"
      >
        {/* Card Cost */}
        <View style={{
          position: 'absolute',
          top: -10,
          left: -10,
          width: 24,
          height: 24,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
        }}>
          <Image
            source={require('../../assets/images/players/iEnergy.png')}
            style={{
              width: 24,
              height: 24,
              position: 'absolute',
            }}
            resizeMode="contain"
          />
          <Text style={{
            color: palette.text,
            fontSize: 10,
            fontFamily: 'Prompt_600SemiBold',
            textShadowColor: palette.shadow,
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
          }}>
            {card.cost}
          </Text>
        </View>

        {/* Card Icon */}
        <View style={{
          alignItems: 'center',
          marginTop: 8,
        }}>
          <Image
            source={require('../../assets/images/cardIcon.png')}
            style={{
              width: 40,
              height: 40,
              marginBottom: 4,
            }}
            resizeMode="contain"
          />

          {/* Card Name */}
          <Text style={{
            color: palette.text,
            fontSize: 11,
            fontFamily: 'Prompt_600SemiBold',
            textAlign: 'center',
            textShadowColor: palette.shadow,
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
          }}>
            {card.name}
          </Text>

          {/* Card Description */}
          <Text style={{
            color: palette.text,
            fontSize: 8,
            fontFamily: 'Prompt_400Regular',
            textAlign: 'center',
            marginTop: 2,
            paddingHorizontal: 6,
            textShadowColor: palette.shadow,
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
          }}>
            {card.desc}
          </Text>
        </View>
      </ImageBackground>
      </Animated.View>
    </GestureDetector>
  );
}