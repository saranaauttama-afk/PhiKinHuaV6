import React from 'react';
import { View, Text, Image, ImageBackground, Pressable } from 'react-native';
import type { CardData } from '../../src/core/types';

interface CardProps {
  card: CardData;
  width?: number;
  height?: number;
  onPress?: () => void;
  disabled?: boolean;
}

export default function Card({
  card,
  width = 80,
  height = 110,
  onPress,
  disabled = false
}: CardProps) {
  const CardWrapper = onPress ? Pressable : View;

  return (
    <CardWrapper
      onPress={disabled ? undefined : onPress}
      style={{
        width,
        height,
        opacity: disabled ? 0.5 : 1,
      }}
    >
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
            paddingHorizontal: 4,
            textShadowColor: 'rgba(0,0,0,0.8)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
          }}>
            {card.desc}
          </Text>
        </View>
      </ImageBackground>
    </CardWrapper>
  );
}