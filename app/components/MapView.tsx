import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { GameState, Command } from '../../src/core/types';
import { getMonsterById } from '../../src/core/monsters/thai-ghosts';

interface MapViewProps {
  state: GameState;
  dispatch: (cmd: Command) => void;
}

function MapView({ state, dispatch }: MapViewProps) {
  const inMap = state.phase === 'map';
  const isPages = state.mapMode === 'pages';
  const page = state.pages?.current;
  
  if (!inMap || !isPages) return null;

  // Note: Auto-proceed handled by backend when all resolved

  // Check if can proceed - combat must be completed
  const canProceedPage = (() => {
    if (!page) return false;
    
    let hasCombat = false;
    let combatCompleted = false;
    
    for (let i = 0; i < page.offers.length; i++) {
      const offer = page.offers[i];
      const isResolved = page.resolved[i];
      
      if (offer.kind === 'monster') {
        hasCombat = true;
        if (isResolved) {
          combatCompleted = true;
        }
      }
    }
    
    // Must have combat and complete it
    if (hasCombat && !combatCompleted) {
      return false;
    }
    
    // Combat completed - can proceed even with unfinished shops/events
    // User can choose to continue or complete remaining encounters
    return true;
  })();

  return (
    <View style={{ marginTop: 16, borderRadius: 16, padding: 16, backgroundColor: 'rgba(39, 39, 42, 0.7)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
      <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>🗺️ Adventure Map</Text>
      <Text style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: 16 }}>
        Page {(state.pages?.pageIndex ?? 0) + 1} / {state.pages?.totalPages ?? 0}
      </Text>

      {/* Fight Progress */}
      {state.fightCount !== undefined && (
        <View style={{ marginBottom: 16, padding: 12, borderRadius: 8, backgroundColor: 'rgba(63, 63, 70, 0.5)' }}>
          <Text style={{ color: 'white', fontWeight: '600', marginBottom: 8 }}>⚔️ Fight Progress</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ color: '#60a5fa' }}>
              Fights: {state.fightCount}/15
            </Text>
            {state.fightCount === 6 && (
              <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>👑 Next: Mid Boss (Fight 7)</Text>
            )}
            {state.fightCount === 14 && (
              <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>👑 Next: Final Boss (Fight 15)</Text>
            )}
            {state.fightCount === 7 && (
              <Text style={{ color: '#10b981' }}>✅ Part 1 Complete!</Text>
            )}
          </View>
        </View>
      )}

      {/* Pools Status */}
      {state.pages && (
        <View style={{ marginBottom: 16, padding: 12, borderRadius: 8, backgroundColor: 'rgba(63, 63, 70, 0.5)' }}>
          <Text style={{ color: 'white', fontWeight: '600', marginBottom: 8 }}>📊 Remaining Encounters</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Text style={{ color: '#fca5a5' }}>👹 Normal: {state.pages.pools.normal}</Text>
            <Text style={{ color: '#fdba74' }}>🔥 Elite: {state.pages.pools.elite}</Text>
            <Text style={{ color: '#93c5fd' }}>🛒 Shop: {state.pages.pools.shopCard}</Text>
            <Text style={{ color: '#fcd34d' }}>⚔️ Equipment: {state.pages.pools.shopEquipment}</Text>
            <Text style={{ color: '#86efac' }}>🏥 Healing: {state.pages.pools.healingShrine}</Text>
            <Text style={{ color: '#fde68a' }}>📦 Treasure: {state.pages.pools.treasure || 0}</Text>
            <Text style={{ color: '#e879f9' }}>💎 Single: {state.pages.pools.treasureSingle || 0}</Text>
            <Text style={{ color: '#c4b5fd' }}>📄 Next Page: {state.pages.pools.nextEvent}</Text>
          </View>
        </View>
      )}

      {page ? (
        <>
          {/* Current Page Offers */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: 'white', fontWeight: '600', marginBottom: 12 }}>Choose your path:</Text>
            <View style={{ flexDirection: 'column', gap: 12 }}>
              {page.offers.map((o, i) => {
                const isResolved = page.resolved[i];
                
                let offerName = '❓ Unknown';
                if (o.kind === 'monster') {
                  const monster = getMonsterById(o.enemyId);
                  offerName = monster ? `👹 ${monster.name}` : `👹 ${o.tier} Monster`;
                } else if (o.kind === 'boss') {
                  const boss = getMonsterById(o.enemyId);
                  offerName = boss ? `👑 ${boss.name}` : '👑 Boss Fight';
                } else {
                  offerName = o.kind === 'shop_card' ? '🛒 Card Shop' :
                              o.kind === 'shop_equipment' ? '⚔️ Equipment Shop' :
                              o.kind === 'shop_remove' ? '🗑️ Remove Cards' :
                              o.kind === 'shop_upgrade' ? '⬆️ Upgrade Cards' :
                              o.kind === 'well' ? '🏞️ Mystical Well' :
                              o.kind === 'healing_shrine' ? '🏥 Healing Shrine' :
                              o.kind === 'treasure' ? '📦 Treasure Chest' :
                              o.kind === 'treasure_single' ? '💎 Single Treasure' :
                              o.kind === 'next_event' ? '📄 Next Page' : '❓ Unknown';
                }

                // Check if this is a boss encounter for special styling
                const isBoss = o.kind === 'boss';
                const borderColor = isBoss ? 'rgba(239, 68, 68, 0.8)' : 'rgba(255, 255, 255, 0.1)';
                const backgroundColor = isBoss ? 'rgba(239, 68, 68, 0.1)' : 'rgba(63, 63, 70, 0.3)';
                const borderWidth = isBoss ? 2 : 1;

                return (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 8, backgroundColor, borderWidth, borderColor }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 18, fontWeight: '600', color: isResolved ? '#4ade80' : 'white' }}>
                        {offerName} {isResolved ? '✅' : ''}
                      </Text>
                      <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
                        {o.kind === 'monster' && (() => {
                          const monster = getMonsterById(o.enemyId);
                          return monster?.description || `Face a ${o.tier} enemy`;
                        })()}
                        {o.kind === 'boss' && (() => {
                          const boss = getMonsterById(o.enemyId);
                          return boss?.description || 'Final challenge';
                        })()}
                        {o.kind === 'shop_card' && 'Buy new cards'}
                        {o.kind === 'shop_equipment' && 'Buy equipment'}
                        {o.kind === 'shop_remove' && 'Remove unwanted cards'}
                        {o.kind === 'shop_upgrade' && 'Upgrade existing cards'}
                        {o.kind === 'well' && 'Restore health (+10 HP)'}
                        {o.kind === 'healing_shrine' && 'Greater healing (+15 HP)'}
                        {o.kind === 'treasure' && 'Free cards (choose 1 of 2)'}
                        {o.kind === 'treasure_single' && 'Free card + random option'}
                        {o.kind === 'next_event' && 'Continue to next page'}
                      </Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {!isResolved && (
                        <>
                          <Pressable
                            onPress={() => dispatch({ type: 'ChooseOffer', index: i })}
                            style={{
                              paddingHorizontal: 16,
                              paddingVertical: 8,
                              borderRadius: 8,
                              backgroundColor: 'rgba(37, 99, 235, 0.5)',
                              borderWidth: 1,
                              borderColor: 'rgba(96, 165, 250, 0.5)'
                            }}
                          >
                            <Text style={{ color: '#bfdbfe', fontWeight: '600' }}>Enter</Text>
                          </Pressable>
                          {o.kind !== 'monster' && (
                            <Pressable
                              onPress={() => {
                                // For shops, healing shrines, wells, and treasures, use DeleteShopFromMap to refresh slot
                                if (o.kind.startsWith('shop_') || o.kind === 'healing_shrine' || o.kind === 'well' || o.kind === 'treasure' || o.kind === 'treasure_single') {
                                  dispatch({ type: 'DeleteShopFromMap', index: i });
                                } else {
                                  // For events, use DismissOffer
                                  dispatch({ type: 'DismissOffer', index: i });
                                }
                              }}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 8,
                                backgroundColor: 'rgba(220, 38, 38, 0.5)',
                                borderWidth: 1,
                                borderColor: 'rgba(248, 113, 113, 0.5)'
                              }}
                            >
                              <Text style={{ color: '#fecaca' }}>Delete</Text>
                            </Pressable>
                          )}
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Proceed Button */}
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <Pressable
              onPress={() => dispatch({ type: 'Proceed' })}
              style={{
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                opacity: canProceedPage ? 1 : 0.5,
                backgroundColor: canProceedPage ? 'rgba(34, 197, 94, 0.5)' : 'rgba(82, 82, 91, 0.3)',
                borderColor: canProceedPage ? 'rgba(74, 222, 128, 0.5)' : 'rgba(113, 113, 122, 0.3)'
              }}
              disabled={!canProceedPage}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>
                {canProceedPage ? '🚀 Continue Journey' : '⏳ Complete encounters first'}
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        /* No Current Page */
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: 16 }}>No encounters available. Generate new page.</Text>
          <Pressable
            onPress={() => dispatch({ type: 'OpenPage' })}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: 'rgba(37, 99, 235, 0.5)',
              borderWidth: 1,
              borderColor: 'rgba(96, 165, 250, 0.5)'
            }}
          >
            <Text style={{ color: '#bfdbfe', fontWeight: '600' }}>🎲 Generate Encounters</Text>
          </Pressable>
        </View>
      )}

      {/* Debug Buttons */}
      <View className="mt-6 pt-4 border-t border-white/10">
        <Text className="text-white/40 font-semibold mb-2">🛠️ Debug Controls</Text>
        <View className="flex-row gap-2 flex-wrap">
          <Pressable 
            onPress={() => dispatch({ type: 'QA_InitPages' })} 
            className="px-3 py-2 rounded-lg bg-purple-700/30 border border-purple-500/30 active:opacity-70"
          >
            <Text className="text-purple-200 text-sm">Init Pages</Text>
          </Pressable>
          <Pressable 
            onPress={() => dispatch({ type: 'QA_PrintPage' })} 
            className="px-3 py-2 rounded-lg bg-purple-700/30 border border-purple-500/30 active:opacity-70"
          >
            <Text className="text-purple-200 text-sm">Print Status</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default MapView;