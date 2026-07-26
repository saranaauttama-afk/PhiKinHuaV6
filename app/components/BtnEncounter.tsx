import React from 'react';
import { View, Text, Pressable, ImageBackground } from 'react-native';
import Art from './Art';

interface BtnEncounterProps {
  encounter: {
    id: string;
    type: string;
    name: string;
    description: string;
    /** ช่องรูปใน src/art/catalog.ts */
    artSlot: string;
  };
  onPress?: () => void;
  onEnter?: () => void;
  onClose?: () => void;
  showButtons?: boolean;
}

export default function BtnEncounter({ encounter, onPress, onEnter, onClose, showButtons = false }: BtnEncounterProps) {
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

        {/* Image — ช่องไหนยังไม่มีรูป <Art> จะวาด placeholder ที่บอกว่าต้องการรูปอะไร */}
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <Art slot={encounter.artSlot} width={100} height={100} />
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