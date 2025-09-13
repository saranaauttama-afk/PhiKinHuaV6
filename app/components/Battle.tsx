import React from 'react';
import { View, Text, ImageBackground, Pressable, Dimensions } from 'react-native';

interface BattleProps {
  visible: boolean;
  onClose: () => void;
  monster: {
    id: string;
    name: string;
    hp: number;
    description: string;
  };
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Battle({ visible, onClose, monster }: BattleProps) {
  if (!visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: screenWidth * 0.9,
          height: screenHeight * 0.8,
          backgroundColor: 'black',
        }}
      >
        {/* Background */}
        <ImageBackground
          source={require('../../assets/scence/battleScence1.png')}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
          }}
          resizeMode="cover"
        >
          {/* Close Button */}
          <View style={{
            position: 'absolute',
            top: 20,
            right: 20,
          }}>
            <Pressable onPress={onClose}>
              <ImageBackground
                source={require('../../assets/images/btnDelete.png')}
                style={{
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                resizeMode="stretch"
              >
              </ImageBackground>
            </Pressable>
          </View>

          {/* Battle Content */}
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}>
            <Text style={{
              color: 'white',
              fontSize: 24,
              fontFamily: 'ChakraPetch_600SemiBold',
              textAlign: 'center',
              marginBottom: 20,
            }}>
              ⚔️ สู้กับ {monster.name}
            </Text>

            <Text style={{
              color: 'white',
              fontSize: 16,
              fontFamily: 'ChakraPetch_400Regular',
              textAlign: 'center',
              opacity: 0.8,
            }}>
              HP: {monster.hp}
            </Text>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
}