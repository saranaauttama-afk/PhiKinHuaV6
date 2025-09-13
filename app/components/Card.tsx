import React, { useState } from 'react';
import { View, Text, Image, ImageBackground } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import type { CardData } from '../../src/core/types';

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
  const translateY = useSharedValue(200); // Start from below
  const scale = useSharedValue(0.5); // Start small
  const opacity = useSharedValue(0); // Start invisible

  // Entrance animation on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      translateY.value = withTiming(0, { duration: 600 });
      scale.value = withTiming(1, { duration: 600 });
      opacity.value = withTiming(1, { duration: 600 });
    }, animationDelay);

    return () => clearTimeout(timer);
  }, []);

  // Trigger fade out when card is played
  React.useEffect(() => {
    if (isPlayed) {
      opacity.value = withTiming(0, { duration: 800 });
      translateY.value = withTiming(-200, { duration: 800 }); // Move up as it fades
      scale.value = withTiming(0.8, { duration: 800 }); // Shrink slightly
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
      translateY.value = withTiming(-20, { duration: 150 });
      scale.value = withTiming(1.1, { duration: 150 });
      runOnJS(updateHoverState)(true);
    })
    .onUpdate((event) => {
      'worklet';
      // Follow finger movement, but only allow upward movement
      translateY.value = -20 + Math.min(0, event.translationY);
    })
    .onEnd((event) => {
      'worklet';

      // Check if dragged up enough to play card
      if (event.translationY < -50) {
        runOnJS(handleDragPlay)();
      }

      runOnJS(updateHoverState)(false);
    })
    .onFinalize(() => {
      'worklet';
      // Always reset to original position when gesture is completely done
      translateY.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(1, { duration: 300 });
    });

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(handlePress)();
    });

  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
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
            color: 'white',
            fontSize: 10,
            fontFamily: 'ChakraPetch_600SemiBold',
            textShadowColor: 'rgba(0,0,0,0.8)',
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
            color: 'white',
            fontSize: 11,
            fontFamily: 'ChakraPetch_600SemiBold',
            textAlign: 'center',
            textShadowColor: 'rgba(0,0,0,0.8)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
          }}>
            {card.name}
          </Text>

          {/* Card Description */}
          <Text style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 8,
            fontFamily: 'ChakraPetch_400Regular',
            textAlign: 'center',
            marginTop: 2,
            paddingHorizontal: 6,
            textShadowColor: 'rgba(0,0,0,0.8)',
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