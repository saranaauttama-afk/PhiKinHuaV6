import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { GameState, Command } from '../../src/core/types';
import { palette, surface, tint } from '../theme';

/** ชื่อชนิดการ์ดเป็นภาษาไทย — เดิมเอาค่า type ดิบมาต่อกับคำว่า "Cards" */
const TYPE_LABEL: Record<string, string> = {
  attack: 'การ์ดโจมตี',
  skill: 'การ์ดวิชา',
  equipment: 'เครื่องราง',
};

interface DeckViewProps {
  state: GameState;
  dispatch: (cmd: Command) => void;
}

function DeckView({ state, dispatch }: DeckViewProps) {
  if (!state.deckOpen) return null;

  // Group cards by ID for counting
  const counts = new Map<string, { name: string; count: number; card: any }>();
  for (const c of state.masterDeck ?? []) {
    const name = c.name ?? c.id;
    const rec = counts.get(c.id) ?? { name, count: 0, card: c };
    rec.count += 1;
    counts.set(c.id, rec);
  }
  
  const cardList = Array.from(counts.values()).sort((a, b) => a.name.localeCompare(b.name));
  const equipmentCards = (state.masterDeck ?? []).filter(c => c.type === 'equipment');

  return (
    <View style={{ marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: surface.panel, borderWidth: 1, borderColor: palette.line }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: palette.text, fontSize: 20, fontWeight: 'bold' }}>📚 สำรับของเรา ({state.masterDeck?.length} ใบ)</Text>
        <Pressable
          onPress={() => dispatch({ type: 'CloseDeck' })}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: palette.blood,
            borderWidth: 1,
            borderColor: tint.bloodLine
          }}
        >
          <Text style={{ color: palette.blood }}>✕ ปิด</Text>
        </Pressable>
      </View>

      {!cardList.length ? (
        <Text style={{ color: palette.textDim, textAlign: 'center', paddingVertical: 32 }}>สำรับว่างเปล่า</Text>
      ) : (
        <>
          {/* Equipment Management Section */}
          {(equipmentCards.length > 0 || (state.equipped && state.equipped.length > 0)) && (
            <View style={{ marginBottom: 24, padding: 16, borderRadius: 8, backgroundColor: surface.panelRaise, borderWidth: 1, borderColor: surface.panelWell }}>
              <Text style={{ color: palette.moonDim, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
                ⚔️ เครื่องราง ({(state.equipped ?? []).length}/{state.equipmentSlotsMax ?? 1})
              </Text>
              
              {/* Currently Equipped */}
              {(state.equipped ?? []).length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: palette.moonDim, fontWeight: '600', marginBottom: 8 }}>🛡️ ที่สวมอยู่</Text>
                  {(state.equipped ?? []).map((eq, i) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: 12, borderRadius: 8, backgroundColor: surface.panelWell, borderWidth: 1, borderColor: tint.moonSoft }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: palette.moonDim, fontWeight: '600' }}>{eq.name || eq.id}</Text>
                        <Text style={{ color: palette.moonDim, fontSize: 14 }}>{eq.desc}</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                          <Text style={{ color: palette.moon, fontSize: 12 }}>⭐ {eq.rarity}</Text>
                          {eq.temporary && <Text style={{ color: palette.moonDim, fontSize: 12 }}>🕐 TEMPORARY</Text>}
                        </View>
                      </View>
                      {!eq.temporary && (
                        <Pressable
                          onPress={() => dispatch({ type: 'UnequipToDeck', equipmentId: eq.id })}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 8,
                            backgroundColor: palette.blood,
                            borderWidth: 1,
                            borderColor: tint.bloodLine
                          }}
                        >
                          <Text style={{ color: palette.blood, fontWeight: '600' }}>ถอด</Text>
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>
              )}
              
              {/* Equipment Cards in Deck */}
              {equipmentCards.length > 0 && (
                <View>
                  <Text className="text-amber-300 font-semibold mb-2">📦 เครื่องรางที่ยังไม่ได้สวม</Text>
                  {equipmentCards.map((card, i) => {
                    const isEquipped = (state.equipped ?? []).some(eq => eq.id === card.equipmentId);
                    const currentSlotUsage = (state.equipped ?? []).reduce((sum, eq) => sum + (eq.slotCost || 1), 0);
                    const maxSlots = state.equipmentSlotsMax || 1;
                    const canEquip = !isEquipped && currentSlotUsage < maxSlots;
                    
                    return (
                      <View key={card.id + i} className={`flex-row justify-between items-center mb-2 p-3 rounded-lg border ${
                        isEquipped ? 'bg-gray-600/30 border-gray-500/30' : 'bg-blue-900/30 border-blue-500/30'
                      }`}>
                        <View className="flex-1">
                          <Text className={`font-semibold ${isEquipped ? 'text-gray-400' : 'text-blue-300'}`}>
                            {card.name || card.id}
                          </Text>
                          <Text className={`text-sm ${isEquipped ? 'text-gray-400' : 'text-blue-300/70'}`}>
                            {card.desc}
                          </Text>
                          <View className="flex-row gap-2 mt-1">
                            <Text className={`text-xs ${isEquipped ? 'text-gray-400' : 'text-blue-400'}`}>
                              ⭐ {card.rarity}
                            </Text>
                            {isEquipped && <Text className="text-gray-400 text-xs">✓ EQUIPPED</Text>}
                          </View>
                        </View>
                        
                        <View className="ml-3">
                          {canEquip && (
                            <Pressable
                              onPress={() => dispatch({ type: 'EquipFromDeck', cardId: card.id })}
                              className="px-3 py-2 rounded-lg bg-blue-600/50 border border-blue-400/50 active:opacity-70"
                            >
                              <Text className="text-blue-200 font-semibold">สวม</Text>
                            </Pressable>
                          )}
                          {!canEquip && !isEquipped && (
                            <Text className="text-red-400 text-sm font-semibold px-2">ช่องเต็ม</Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
          
          {/* Regular Card List */}
          <View>
            <Text style={{ color: palette.text, fontSize: 18, fontWeight: '600', marginBottom: 12 }}>🃏 แยกตามชนิด</Text>
            
            {/* Group by card type */}
            {['attack', 'skill', 'equipment'].map(type => {
              const typeCards = cardList.filter(item => item.card.type === type);
              if (typeCards.length === 0) return null;
              
              const typeIcon = type === 'attack' ? '⚔️' : type === 'skill' ? '🧠' : '⚙️';
              // สามชนิดต้องแยกออกจากกันได้ — โจมตีเป็นแดง ที่เหลือแยกด้วยความสว่าง
              const typeColorStyle =
                type === 'attack' ? palette.blood
                : type === 'skill' ? palette.moon
                : palette.moonDim;
              
              return (
                <View key={type} style={{ marginBottom: 16 }}>
                  <Text style={{ color: typeColorStyle, fontWeight: '600', marginBottom: 8 }}>
                    {typeIcon} {TYPE_LABEL[type] ?? type} ({typeCards.length} ใบ)
                  </Text>
                  <View style={{ marginLeft: 12 }}>
                    {typeCards.map((item, idx) => (
                      <View key={`${item.name}-${idx}`} style={{ marginBottom: 8, padding: 8, borderRadius: 8, backgroundColor: surface.panelWell }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View>
                            <Text style={{ color: palette.text, fontWeight: '600' }}>{item.name} × {item.count}</Text>
                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                              <Text style={{ color: palette.textDim, fontSize: 14 }}>Cost: {item.card.cost ?? 0}</Text>
                              {item.card.dmg && <Text style={{ color: palette.blood, fontSize: 14 }}>DMG {item.card.dmg}</Text>}
                              {item.card.block && <Text style={{ color: palette.moonDim, fontSize: 14 }}>Block {item.card.block}</Text>}
                              {item.card.energyGain && <Text style={{ color: palette.moonDim, fontSize: 14 }}>Energy +{item.card.energyGain}</Text>}
                              {item.card.draw && <Text style={{ color: palette.moonDim, fontSize: 14 }}>Draw {item.card.draw}</Text>}
                            </View>
                            {item.card.desc && (
                              <Text style={{ color: palette.textFaint, fontSize: 12, marginTop: 4 }}>{item.card.desc}</Text>
                            )}
                          </View>
                          <Text style={{ color: palette.textFaint, fontSize: 14 }}>⭐ {item.card.rarity}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

export default DeckView;