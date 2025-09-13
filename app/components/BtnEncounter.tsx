import React from 'react';
import { View, Text, Image, Pressable, ImageBackground } from 'react-native';

interface BtnEncounterProps {
  encounter: {
    id: string;
    type: string;
    name: string;
    description: string;
  };
  onPress?: () => void;
  onEnter?: () => void;
  onClose?: () => void;
  showButtons?: boolean;
}

export default function BtnEncounter({ encounter, onPress, onEnter, onClose, showButtons = false }: BtnEncounterProps) {
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
          height: 250,
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingTop: 16,
        }}
        resizeMode="stretch"
      >
        {/* Title */}
        <Text
          style={{
            color: 'white',
            fontSize: 10,
            fontFamily: 'ChakraPetch_400Regular',
            textAlign: 'center',
            top:12,
            opacity:0.6
          }}
          numberOfLines={1}
        >
          {encounter.name}
        </Text>

        {/* Image */}
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          {(() => {
            try {
              // Try to load image based on encounter type and id
              let imageSource = null;

              if (encounter.id === 'phi-krasue') {
                imageSource = require('../../assets/monsters/phi-krasue.png');
              } else if (encounter.type === 'shop_card') {
                imageSource = require('../../assets/encounters/enShopCardMini.png');
              } else if (encounter.type === 'treasure') {
                imageSource = require('../../assets/encounters/enTreasureOpenMini.png');
              }

              if (imageSource) {
                return (
                  <Image
                    source={imageSource}
                    style={{
                      width: 100,
                      height: 100,
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
              <Text style={{ fontSize: 80 }}>
                {getEncounterIcon(encounter.type)}
              </Text>
            );
          })()}
        </View>

        {/* Description */}
        <Text
          style={{
            color: 'white',
            fontSize: 9,
            fontFamily: 'ChakraPetch_400Regular',
            textAlign: 'center',
            marginTop: 15,
            paddingHorizontal: 12,
            opacity: 0.8,
            lineHeight: 12,
          }}
          numberOfLines={3}
        >
          {encounter.description}
        </Text>

        {/* Delete Button - Top Right (ไม่แสดงสำหรับ monster) */}
        {showButtons && encounter.type !== 'monster' && (
          <View style={{
            position: 'absolute',
            top: 25,
            right: 8,
          }}>
            <Pressable onPress={onClose}>
              <ImageBackground
                source={require('../../assets/images/btnDelete.png')}
                style={{
                  width: 25,
                  height: 25,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                resizeMode="stretch"
              >
              </ImageBackground>
            </Pressable>
          </View>
        )}

        {/* Enter Button - Bottom */}
        {showButtons && (
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 20,
            right: 20,
            alignItems: 'center',
          }}>
            <Pressable onPress={onEnter}>
              <ImageBackground
                source={require('../../assets/images/btnBg.png')}
                style={{
                  width: 90,
                  height: 45,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                resizeMode="stretch"
              >
                <Text style={{
                  color: 'white',
                  fontSize: 12,
                  fontFamily: 'ChakraPetch_400Regular',
                  textAlign: 'center',
                  opacity: 0.8,
                }}>
                  {encounter.type === 'monster' ? 'จับผี' : 'เข้า'}
                </Text>
              </ImageBackground>
            </Pressable>
          </View>
        )}
      </ImageBackground>
    </Pressable>
  );
}