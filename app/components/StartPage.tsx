import React, { useState } from 'react';
import { View, Text, Pressable, ImageBackground, Dimensions } from 'react-native';
import { useAppFonts } from '../useAppFonts';
import type { GameState } from '../../src/core/types';

const { width, height } = Dimensions.get('window');

interface StartPageProps {
  onStartGame: () => void;
}

function StartPage({ onStartGame }: StartPageProps) {
  const [fontsLoaded] = useAppFonts();

  if (!fontsLoaded) {
    return null; // or loading spinner
  }

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/scence/startPage.png')}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%'
        }}
        resizeMode="cover"
      >
        {/* Dark overlay for better text readability */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)'
        }} />
      
        {/* Start Game Button */}
        <View style={{
          zIndex: 1,
          top: 150,
          alignItems: 'center',
        }}>
          <Pressable
            onPress={onStartGame}
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <ImageBackground
              source={require('../../assets/images/btnBg.png')}
              style={{
                width: 200,
                height: 120,
                justifyContent: 'center',
                alignItems: 'center',
                opacity:0.8
              }}
              resizeMode="stretch"
            >
              <Text style={{
                fontSize: 16,
                color: 'white',
                textAlign: 'center',
                fontFamily: 'Prompt_400Regular',
                opacity:0.6
              }}>
                เข้าสู่เกมส์
              </Text>
            </ImageBackground>
          </Pressable>
        </View>

        {/* Version or Credits (optional) */}
        <View style={{
          position: 'absolute',
          bottom: 40,
          alignItems: 'center',
          zIndex: 1
        }}>
          <Text style={{
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.2)',
              fontFamily: 'Prompt_400Regular',
            textShadowColor: 'rgba(0, 0, 0, 0.8)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2
          }}>
            Thai Horror Theme
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}

export default StartPage;