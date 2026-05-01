import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

interface CardItem {
  instanceId?: string;
  id?: string;
  name: string;
  cost?: number;
  damage?: number;
  block?: number;
  effects?: { damage?: number; block?: number };
}

interface Props {
  cards: CardItem[];
  maxHandSize: number;
  onConfirm: (discardedIndices: number[]) => void;
  onCancel: () => void;
}

const CARD_W = 100;
const CARD_H = 140;

export default function DiscardOverlay({ cards, maxHandSize, onConfirm, onCancel }: Props) {
  const mustDiscard = Math.max(0, cards.length - maxHandSize);
  const [selectedIndices, setSelectedIndices] = React.useState<number[]>([]);

  const toggle = (index: number) => {
    setSelectedIndices(prev => {
      if (prev.includes(index)) return prev.filter(i => i !== index);
      if (prev.length >= mustDiscard) return prev;
      return [...prev, index];
    });
  };

  const canConfirm = selectedIndices.length === mustDiscard;

  return (
    <View style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.88)',
      zIndex: 500,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {/* Header */}
      <Text style={{
        color: 'rgba(255,220,180,0.95)',
        fontSize: 17,
        fontFamily: 'ChakraPetch_700Bold',
        marginBottom: 6,
      }}>
        เลือกการ์ดที่จะทิ้ง
      </Text>
      <Text style={{
        color: 'rgba(255,200,100,0.7)',
        fontSize: 11,
        fontFamily: 'ChakraPetch_400Regular',
        marginBottom: 28,
      }}>
        เลือก {mustDiscard} ใบ  ({selectedIndices.length}/{mustDiscard})
      </Text>

      {/* Horizontal card scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          gap: 12,
          alignItems: 'center',
        }}
        style={{ flexGrow: 0, marginBottom: 36 }}
      >
        {cards.map((card, index) => {
          const isSelected = selectedIndices.includes(index);
          const damage = card.damage ?? card.effects?.damage ?? 0;
          const block  = card.block  ?? card.effects?.block  ?? 0;
          const key    = card.instanceId ?? card.id ?? String(index);

          return (
            <Pressable key={key} onPress={() => toggle(index)}>
              <View style={{
                width: CARD_W,
                height: CARD_H,
                borderRadius: 10,
                borderWidth: isSelected ? 2.5 : 1,
                borderColor: isSelected ? '#ff6b6b' : 'rgba(255,255,255,0.2)',
                backgroundColor: isSelected ? 'rgba(90,15,15,0.95)' : 'rgba(25,12,45,0.92)',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8,
                // ลดขนาดลงเล็กน้อยถ้าเลือกไม่ได้แล้ว
                opacity: (!isSelected && selectedIndices.length >= mustDiscard) ? 0.4 : 1,
              }}>
                {/* Cost badge */}
                {card.cost !== undefined && (
                  <View style={{
                    position: 'absolute', top: 6, left: 6,
                    backgroundColor: 'rgba(60,100,200,0.8)',
                    borderRadius: 10, width: 20, height: 20,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ color: '#ffd93d', fontSize: 10, fontFamily: 'ChakraPetch_700Bold' }}>
                      {card.cost}
                    </Text>
                  </View>
                )}

                {/* Selected X badge */}
                {isSelected && (
                  <View style={{
                    position: 'absolute', top: 6, right: 6,
                    backgroundColor: '#cc2222',
                    borderRadius: 10, width: 20, height: 20,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ color: 'white', fontSize: 10, fontFamily: 'ChakraPetch_700Bold' }}>✕</Text>
                  </View>
                )}

                <Text style={{
                  color: isSelected ? 'rgba(255,160,160,0.95)' : 'rgba(255,255,255,0.9)',
                  fontSize: 10,
                  fontFamily: 'ChakraPetch_600SemiBold',
                  textAlign: 'center',
                  marginBottom: 8,
                  marginTop: 16,
                }}>
                  {card.name}
                </Text>

                {damage > 0 && (
                  <Text style={{ color: '#ff6b6b', fontSize: 22, fontFamily: 'ChakraPetch_700Bold' }}>
                    ⚔ {damage}
                  </Text>
                )}
                {block > 0 && (
                  <Text style={{ color: '#4dabf7', fontSize: 22, fontFamily: 'ChakraPetch_700Bold' }}>
                    🛡 {block}
                  </Text>
                )}
                {damage === 0 && block === 0 && (
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }}>✦</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Buttons */}
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Pressable onPress={onCancel}>
          <View style={{
            paddingHorizontal: 32, paddingVertical: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)',
          }}>
            <Text style={{
              color: 'rgba(255,255,255,0.6)',
              fontFamily: 'ChakraPetch_600SemiBold',
              fontSize: 13,
            }}>
              ยกเลิก
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => { if (canConfirm) onConfirm(selectedIndices); }}
          disabled={!canConfirm}
        >
          <View style={{
            paddingHorizontal: 32, paddingVertical: 12,
            borderRadius: 10,
            backgroundColor: canConfirm ? 'rgba(180,40,40,0.9)' : 'rgba(60,20,20,0.5)',
            borderWidth: 1,
            borderColor: canConfirm ? 'rgba(255,100,100,0.5)' : 'transparent',
          }}>
            <Text style={{
              color: canConfirm ? 'rgba(255,220,220,0.95)' : 'rgba(255,255,255,0.2)',
              fontFamily: 'ChakraPetch_700Bold',
              fontSize: 13,
            }}>
              ยืนยัน ({selectedIndices.length}/{mustDiscard})
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
