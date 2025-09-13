import React from 'react';
import { View, ImageBackground, Modal, Pressable, Dimensions, Text, Image } from 'react-native';

interface EncounterDialogProps {
  visible: boolean;
  onClose: () => void;
  onEnter?: () => void;
  encounter?: {
    id: string;
    type: string;
    name: string;
    description: string;
  };
  title?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function EncounterDialog({
  visible,
  onClose,
  onEnter,
  encounter,
  title = "การผจญภัย"
}: EncounterDialogProps) {

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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: screenWidth * 0.85,
            height: screenHeight * 0.7,
            backgroundColor: 'black',
          }}
        >
          {/* Background */}
          <Image
            source={require('../../assets/encounters/bgEnNormal.png')}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              top: 0,
              left: 0,
            }}
            resizeMode="stretch"
          />

          {/* Close Button */}
          <View style={{
            position: 'absolute',
            top: 50,
            right: 10,
            padding: 0,
          }}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Image
                source={require('../../assets/images/btnCloseMini.png')}
                style={{ width: 40, height: 40 }}
                resizeMode="stretch"
              />
            </Pressable>
          </View>

          {/* Title */}
          <View style={{
            position: 'absolute',
            top: '25%',
            width: '100%',
            alignItems: 'center',
          }}>
            <Text
              style={{
                color: 'white',
                fontSize: 18,
                fontFamily: 'ChakraPetch_600SemiBold',
                textAlign: 'center',
                textShadowColor: 'rgba(0,0,0,0.8)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2,
              }}
            >
              {title}
            </Text>
          </View>

          {/* Monster Image */}
          {encounter && (
            <View style={{
              position: 'absolute',
              top: '35%',
              width: '100%',
              alignItems: 'center',
            }}>
              {/* Try to load monster image, fallback to emoji */}
              {(() => {
                try {
                  // This will work if the image exists
                  const imageSource = encounter.id === 'phi-krasue'
                    ? require('../../assets/monsters/phi-krasue.png')
                    : null;

                  if (imageSource) {
                    return (
                      <Image
                        source={imageSource}
                        style={{
                          width: 120,
                          height: 120,
                          borderRadius: 8,
                        }}
                        resizeMode="contain"
                      />
                    );
                  }
                } catch (error) {
                  console.log(`Image not found for monster: ${encounter.id}`);
                }

                // Fallback to emoji
                return (
                  <View style={{
                    width: 120,
                    height: 120,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 8,
                  }}>
                    <Text style={{ fontSize: 60 }}>
                      {getEncounterIcon(encounter.type)}
                    </Text>
                  </View>
                );
              })()}
            </View>
          )}

          {/* Monster Details */}
          {encounter && (
            <View style={{
              position: 'absolute',
              top: '60%',
              width: '100%',
              paddingHorizontal: 30,
              alignItems: 'center',
            }}>
              <Text
                style={{
                  color: 'white',
                  fontSize: 12,
                  fontFamily: 'ChakraPetch_400Regular',
                  textAlign: 'center',
                  opacity: 0.9,
                  lineHeight: 16,
                }}
              >
                {encounter.description}
              </Text>
            </View>
          )}

          {/* Action Button */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            alignItems: 'center',
            paddingBottom: 60,
          }}>
            <Pressable
              onPress={() => {
                if (encounter && onEnter) {
                  onEnter();
                } else {
                  onClose();
                }
              }}
            >
              <ImageBackground
                source={require('../../assets/images/btnBg.png')}
                style={{
                  width: 160,
                  height: 80,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                resizeMode="stretch"
              >
                <Text
                  style={{
                    color: 'white',
                    fontSize: 14,
                    opacity: 0.8,
                    fontFamily: 'ChakraPetch_400Regular',
                    textAlign: 'center',
                  }}
                >
                  {encounter ? 'เข้าสู่การผจญภัย' : 'ปิด'}
                </Text>
              </ImageBackground>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}