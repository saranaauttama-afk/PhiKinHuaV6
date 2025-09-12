import React, { useState } from 'react';
import { View, Text, Pressable, ImageBackground, Dimensions } from 'react-native';
import { useFonts, Prompt_400Regular, Prompt_600SemiBold, Prompt_700Bold } from '@expo-google-fonts/prompt';
import { ChakraPetch_400Regular, ChakraPetch_600SemiBold, ChakraPetch_700Bold } from '@expo-google-fonts/chakra-petch';
import type { GameState } from '../../src/core/types';

const { width, height } = Dimensions.get('window');

interface StartPageProps {
  onStartGame: () => void;
}

function StartPage({ onStartGame }: StartPageProps) {
  let [fontsLoaded] = useFonts({
    Prompt_400Regular,
    Prompt_600SemiBold,
    Prompt_700Bold,
    ChakraPetch_400Regular,
    ChakraPetch_600SemiBold,
    ChakraPetch_700Bold,
  });

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
          width: '50%',
          maxWidth: 300,
          top:150
        }}>
          <Pressable
            onPress={onStartGame}
            style={{ 
              paddingHorizontal: 16, 
              paddingVertical: 16, 
              borderRadius: 16, 
              backgroundColor: 'rgba(245, 158, 11, 0.15)', 
              borderWidth: 1, 
              // borderColor: 'rgba(30, 64, 175, 0.8)'
            }}
          >
            <Text style={{
              fontSize: 16,
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center',
              fontFamily: 'ChakraPetch_400Regular'
            }}>
              เข้าสู่เกมส์
            </Text>
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
              fontFamily: 'ChakraPetch_400Regular',
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