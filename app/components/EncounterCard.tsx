import React from 'react';
import { View, Text, Image, Pressable, ImageBackground } from 'react-native';

interface EncounterCardProps {
  encounter: {
    id: string;
    type: string;
    name: string;
    description: string;
  };
  onPress?: () => void;
}

export default function EncounterCard({ encounter, onPress }: EncounterCardProps) {
  const getEncounterIcon = (type: string) => {
    switch (type) {
      case 'monster': return '👹';
      case 'boss': return '👑';
      case 'shop_card': return '🛒';
      case 'shop_equipment': return '⚔️';
      case 'healing_shrine': return '🏥';
      case 'treasure': return '📦';
      case 'treasure_single': return '💎';
      case 'next_event': return '📄';
      default: return '❓';
    }
  };

  return (
    <Pressable onPress={onPress} style={{ width: '100%' }}>
      <ImageBackground
        source={require('../../assets/encounters/bgEnNormal.png')}
        style={{
          width: '100%',
          aspectRatio: 1,
          padding: 16,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        resizeMode="contain"
      >
        {/* Title */}
        <Text
          style={{
            color: 'white',
            fontSize: 14,
            fontFamily: 'ChakraPetch_600SemiBold',
            textAlign: 'center',
            marginBottom: 12,
          }}
          numberOfLines={2}
        >
          {encounter.name}
        </Text>

        {/* Image/Icon */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {(() => {
            try {
              // Try to load monster image
              const imageSource = encounter.id === 'phi-krasue'
                ? require('../../assets/monsters/phi-krasue.png')
                : null;

              if (imageSource) {
                return (
                  <Image
                    source={imageSource}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 6,
                    }}
                    resizeMode="contain"
                  />
                );
              }
            } catch (error) {
              console.log(`Image not found for: ${encounter.id}`);
            }

            // Fallback to emoji
            return (
              <Text style={{ fontSize: 60 }}>
                {getEncounterIcon(encounter.type)}
              </Text>
            );
          })()}
        </View>

        {/* Description */}
        <Text
          style={{
            color: 'white',
            fontSize: 10,
            fontFamily: 'ChakraPetch_400Regular',
            textAlign: 'center',
            opacity: 0.8,
            marginTop: 12,
            lineHeight: 14,
          }}
          numberOfLines={4}
        >
          {encounter.description}
        </Text>

        {/* Enter Button */}
        <View style={{ marginTop: 12 }}>
          <ImageBackground
            source={require('../../assets/images/btnBg.png')}
            style={{
              width: 100,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            resizeMode="stretch"
          >
            <Text
              style={{
                color: 'white',
                fontSize: 10,
                fontFamily: 'ChakraPetch_400Regular',
                textAlign: 'center',
              }}
            >
              เข้าสู่
            </Text>
          </ImageBackground>
        </View>
      </ImageBackground>
    </Pressable>
  );
}