import React from 'react';
import { View, Text, ImageBackground, Pressable, Dimensions, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function BattlePage() {
  const router = useRouter();
  const {
    monsterId = 'phi-krasue',
    monsterName = 'ผีกระสือ',
    monsterHp = '20'
  } = useLocalSearchParams();

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../assets/scence/battleScence1.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        {/* Close Button */}
        <View style={{
          position: 'absolute',
          top: 50,
          right: 20,
          zIndex: 100,
        }}>
          <Pressable onPress={() => router.back()}>
            <ImageBackground
              source={require('../assets/images/btnDelete.png')}
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

        {/* Monster - Center */}
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {(() => {
            try {
              // Load monster image based on monsterId
              if (monsterId === 'phi-krasue') {
                return (
                  <Image
                    source={require('../assets/monsters/phi-krasue.png')}
                    style={{
                      width: 300,
                      height: 300,
                      marginBottom: 20,
                    }}
                    resizeMode="contain"
                  />
                );
              }
            } catch (error) {
              console.log(`Monster image not found: ${monsterId}`);
            }

            // Fallback to emoji
            return (
              <Text style={{
                fontSize: 120,
                marginBottom: 20,
              }}>
                👻
              </Text>
            );
          })()}

          <Text style={{
            color: 'white',
            fontSize: 24,
            fontFamily: 'ChakraPetch_600SemiBold',
            textAlign: 'center',
            marginBottom: 10,
            textShadowColor: 'rgba(0,0,0,0.8)',
            textShadowOffset: { width: 2, height: 2 },
            textShadowRadius: 4,
          }}>
            {monsterName}
          </Text>

          <Text style={{
            color: 'white',
            fontSize: 18,
            fontFamily: 'ChakraPetch_400Regular',
            textAlign: 'center',
            opacity: 0.9,
            textShadowColor: 'rgba(0,0,0,0.6)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
          }}>
            HP: {monsterHp}
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}