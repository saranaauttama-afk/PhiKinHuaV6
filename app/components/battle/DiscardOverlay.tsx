import React from 'react';
import { View, Text, Pressable } from 'react-native';

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

export default function DiscardOverlay({ cards, maxHandSize, onConfirm, onCancel }: Props) {
  const mustDiscard = Math.max(0, cards.length - maxHandSize);
  const [selectedIndices, setSelectedIndices] = React.useState<number[]>([]);

  const toggle = (index: number) => {
    setSelectedIndices((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
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
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    }}>
      <Text style={{
        color: 'rgba(255,220,180,0.95)',
        fontSize: 17,
        fontFamily: 'ChakraPetch_700Bold',
        marginBottom: 6,
        textAlign: 'center',
      }}>
        เลือกการ์ดที่จะทิ้ง
      </Text>

      <Text style={{
        color: 'rgba(255,200,100,0.7)',
        fontSize: 11,
        fontFamily: 'ChakraPetch_400Regular',
        marginBottom: 24,
        textAlign: 'center',
      }}>
        เลือก {mustDiscard} ใบ  ({selectedIndices.length}/{mustDiscard})
      </Text>

      {/* Card grid */}
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 32,
      }}>
        {cards.map((card, index) => {
          const isSelected = selectedIndices.includes(index);
          const damage = card.damage ?? card.effects?.damage ?? 0;
          const block  = card.block  ?? card.effects?.block  ?? 0;
          const key    = card.instanceId ?? card.id ?? String(index);

          return (
            <Pressable key={key} onPress={() => toggle(index)}>
              <View style={{
                width: 80,
                height: 110,
                borderRadius: 8,
                borderWidth: isSelected ? 2.5 : 1,
                borderColor: isSelected ? '#ff6b6b' : 'rgba(255,255,255,0.25)',
                backgroundColor: isSelected ? 'rgba(80,20,20,0.92)' : 'rgba(30,15,50,0.9)',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 5,
              }}>
                <Text style={{
                  color: isSelected ? 'rgba(255,180,180,0.95)' : 'rgba(255,255,255,0.85)',
                  fontSize: 9,
                  fontFamily: 'ChakraPetch_600SemiBold',
                  textAlign: 'center',
                  marginBottom: 4,
                }}>
                  {card.name}
                </Text>

                {card.cost !== undefined && (
                  <Text style={{ color: '#ffd93d', fontSize: 9, fontFamily: 'ChakraPetch_400Regular' }}>
                    ⚡{card.cost}
                  </Text>
                )}

                {damage > 0 && (
                  <Text style={{ color: '#ff6b6b', fontSize: 16, fontFamily: 'ChakraPetch_700Bold' }}>
                    ⚔ {damage}
                  </Text>
                )}

                {block > 0 && (
                  <Text style={{ color: '#4dabf7', fontSize: 16, fontFamily: 'ChakraPetch_700Bold' }}>
                    🛡 {block}
                  </Text>
                )}

                {/* Selected mark */}
                {isSelected && (
                  <View style={{
                    position: 'absolute', top: 4, right: 4,
                    backgroundColor: '#ff6b6b',
                    borderRadius: 8, width: 16, height: 16,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ color: 'white', fontSize: 9, fontFamily: 'ChakraPetch_700Bold' }}>✕</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Buttons */}
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Pressable onPress={onCancel}>
          <View style={{
            paddingHorizontal: 28, paddingVertical: 11,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.35)',
          }}>
            <Text style={{
              color: 'rgba(255,255,255,0.65)',
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
            paddingHorizontal: 28, paddingVertical: 11,
            borderRadius: 8,
            backgroundColor: canConfirm ? 'rgba(180,40,40,0.85)' : 'rgba(80,30,30,0.5)',
          }}>
            <Text style={{
              color: canConfirm ? 'rgba(255,220,220,0.95)' : 'rgba(255,255,255,0.25)',
              fontFamily: 'ChakraPetch_700Bold',
              fontSize: 13,
            }}>
              ยืนยัน
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
