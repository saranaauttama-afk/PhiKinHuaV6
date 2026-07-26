import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { GameState, Command } from '../../src/core/types';
import { removeCostForCount, upgradeCostForCount } from '../../src/core/balance/economy';
import FusionAltarView from './FusionAltarView';

interface ShopViewProps {
  state: GameState;
  dispatch: (cmd: Command) => void;
}

function ShopView({ state, dispatch }: ShopViewProps) {
  const inShop = state.phase === 'shop';
  const shopKind = state.shopKind;

  if (!inShop) return null;

  const renderCardShop = () => (
    <View style={{ marginTop: 16, borderRadius: 16, padding: 16, backgroundColor: 'rgba(39, 39, 42, 0.8)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
      <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>🛒 Card Shop</Text>
      {state.currentShopId && (
        <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12, marginBottom: 4 }}>Shop ID: {state.currentShopId}</Text>
      )}
      <Text style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: 8 }}>Gold: {state.player.gold}g</Text>
      
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {(state.shopStock ?? []).map((item, i) => (
          <Pressable
            key={i}
            onPress={() => dispatch({ type: 'TakeShop', index: i })}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              borderWidth: 1,
              backgroundColor: '#374151',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>{'card' in item ? item.card?.name || 'Unknown' : 'Unknown'}</Text>
            <Text style={{ color: '#fcd34d' }}>💰 {item.price}g</Text>
            {'card' in item && item.card?.dmg ? <Text style={{ color: '#fca5a5' }}>DMG {item.card.dmg}</Text> : null}
            {'card' in item && item.card?.block ? <Text style={{ color: '#7dd3fc' }}>Block {item.card.block}</Text> : null}
            {'card' in item && item.card?.energyGain ? <Text style={{ color: '#fcd34d' }}>Energy +{item.card.energyGain}</Text> : null}
            {'card' in item && item.card?.draw ? <Text style={{ color: '#86efac' }}>Draw {item.card.draw}</Text> : null}
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => dispatch({ type: 'ShopReroll' })}
        className="px-4 py-2 rounded-xl bg-purple-700/40 border border-purple-500/40 active:opacity-70"
      >
        <Text className="text-purple-200 font-semibold">🎲 Reroll (50g)</Text>
      </Pressable>
    </View>
  );

  const renderEquipmentShop = () => (
    <View className="mt-4 rounded-2xl p-4 bg-zinc-800/80 border border-amber-500/20">
      <Text className="text-white text-lg font-semibold mb-2">⚔️ Equipment Shop</Text>
      {state.currentShopId && (
        <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12, marginBottom: 4 }}>Shop ID: {state.currentShopId}</Text>
      )}
      <Text className="text-white/80 mb-2">Gold: {state.player.gold}g</Text>
      
      <View className="flex-row gap-2 flex-wrap">
        {(state.shopStock ?? []).map((item, i) => (
          <Pressable
            key={i}
            onPress={() => dispatch({ type: 'TakeShopEquipment', index: i })}
            className="px-3 py-2 rounded-xl border bg-amber-900/30 border-amber-500/30 active:opacity-70"
          >
            <Text className="text-amber-200 font-semibold">{'equipment' in item ? item.equipment?.name || 'Unknown' : 'Unknown'}</Text>
            <Text className="text-amber-300">💰 {item.price}g</Text>
            <Text className="text-amber-300/70 text-sm">{'equipment' in item ? item.equipment?.rarity : ''}</Text>
            <Text className="text-amber-200/70 text-xs">{'equipment' in item ? item.equipment?.desc : ''}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderRemoveShop = () => {
    const removeCount = state.runCounters?.removeShopCount ?? 0;
    const removeCost = removeCostForCount(removeCount);

    return (
      <View className="mt-4 rounded-2xl p-4 bg-red-900/30 border border-red-500/30">
        <Text className="text-white text-lg font-semibold mb-2">🗑️ Remove Cards</Text>
        {state.currentShopId && (
          <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12, marginBottom: 4 }}>Shop ID: {state.currentShopId}</Text>
        )}
        <Text className="text-white/80 mb-2">Gold: {state.player.gold}g</Text>
        <Text className="text-red-300 mb-3">Cost: {removeCost}g (removed {removeCount} cards)</Text>
        
        <Text className="text-white font-semibold mb-2">Select card to remove:</Text>
        <View className="flex-row gap-2 flex-wrap">
          {(state.masterDeck ?? []).map((card, i) => (
            <Pressable
              key={i}
              onPress={() => dispatch({ type: 'ShopRemoveBuy', index: i })}
              className="px-3 py-2 rounded-xl border bg-red-800/30 border-red-500/30 active:opacity-70"
            >
              <Text className="text-red-200">{card.name || card.id}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const renderUpgradeShop = () => {
    const upgradeCount = state.runCounters?.upgradeShopCount ?? 0;
    const upgradeCost = upgradeCostForCount(upgradeCount);

    return (
      <View className="mt-4 rounded-2xl p-4 bg-green-900/30 border border-green-500/30">
        <Text className="text-white text-lg font-semibold mb-2">⬆️ Upgrade Cards</Text>
        {state.currentShopId && (
          <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12, marginBottom: 4 }}>Shop ID: {state.currentShopId}</Text>
        )}
        <Text className="text-white/80 mb-2">Gold: {state.player.gold}g</Text>
        <Text className="text-green-300 mb-3">Cost: {upgradeCost}g (upgraded {upgradeCount} cards)</Text>
        
        <Text className="text-white font-semibold mb-2">Select card to upgrade:</Text>
        <View className="flex-row gap-2 flex-wrap">
          {(state.masterDeck ?? []).map((card, i) => (
            <Pressable
              key={i}
              onPress={() => dispatch({ type: 'ShopUpgradeBuy', index: i })}
              className="px-3 py-2 rounded-xl border bg-green-800/30 border-green-500/30 active:opacity-70"
            >
              <Text className="text-green-200">{card.name || card.id}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const renderHealingShop = () => {
    const healCount = (state as any).healingShrine?.timesUsed ?? 0;
    const healCost = 25 + (healCount * 10); // Cost increases with usage
    const maxUses = 3; // Maximum uses per shrine
    const canUse = healCount < maxUses && state.player.gold >= healCost && state.player.hp < state.player.maxHp;

    return (
      <View style={{ marginTop: 16, borderRadius: 16, padding: 16, backgroundColor: 'rgba(22, 101, 52, 0.3)', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)' }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>🏥 Healing Shrine</Text>
        {state.currentShopId && (
          <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12, marginBottom: 4 }}>Shrine ID: {state.currentShopId}</Text>
        )}
        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: 8 }}>Gold: {state.player.gold}g | HP: {state.player.hp}/{state.player.maxHp}</Text>
        <Text style={{ color: '#86efac', marginBottom: 16 }}>An ancient shrine radiates powerful healing magic.</Text>
        
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: 'white', fontWeight: '600', marginBottom: 8 }}>Healing Services:</Text>
          <Text style={{ color: '#bbf7d0', marginBottom: 4 }}>• Full Heal: {healCost}g</Text>
          <Text style={{ color: '#fca5a5', fontSize: 12, marginBottom: 4 }}>Uses: {healCount}/{maxUses}</Text>
          {healCount >= maxUses && (
            <Text style={{ color: '#ef4444', fontSize: 12 }}>⚠️ Shrine power depleted</Text>
          )}
        </View>

        {canUse ? (
          <Pressable
            onPress={() => dispatch({ type: 'UseHealingShrine' })}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: 'rgba(34, 197, 94, 0.5)',
              borderWidth: 1,
              borderColor: 'rgba(74, 222, 128, 0.5)',
              marginBottom: 8
            }}
          >
            <Text style={{ color: '#bbf7d0', fontWeight: '600', textAlign: 'center' }}>🙏 Pray for Healing (+{state.player.maxHp - state.player.hp} HP)</Text>
          </Pressable>
        ) : (
          <View style={{ 
            paddingHorizontal: 16, 
            paddingVertical: 12, 
            borderRadius: 12, 
            backgroundColor: 'rgba(75, 85, 99, 0.3)', 
            borderWidth: 1, 
            borderColor: 'rgba(156, 163, 175, 0.3)', 
            marginBottom: 8 
          }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
              {healCount >= maxUses ? '🙏 Shrine depleted' : 
               state.player.hp >= state.player.maxHp ? '💚 Already at full health' : 
               '💰 Not enough gold'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderWellShop = () => {
    const wellCount = (state as any).mysticalWell?.timesUsed ?? 0;
    const maxUses = 2; // Free uses, then well disappears
    const canUse = wellCount < maxUses && state.player.hp < state.player.maxHp;

    return (
      <View style={{ marginTop: 16, borderRadius: 16, padding: 16, backgroundColor: 'rgba(30, 58, 138, 0.3)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>🏞️ Mystical Well</Text>
        {state.currentShopId && (
          <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12, marginBottom: 4 }}>Well ID: {state.currentShopId}</Text>
        )}
        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: 8 }}>HP: {state.player.hp}/{state.player.maxHp}</Text>
        <Text style={{ color: '#bfdbfe', marginBottom: 16 }}>A magical well glows with healing energy.</Text>
        
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: 'white', fontWeight: '600', marginBottom: 8 }}>🆓 Free Healing:</Text>
          <Text style={{ color: '#86efac', marginBottom: 4 }}>• Minor Heal (+10 HP): FREE</Text>
          <Text style={{ color: '#fca5a5', fontSize: 12, marginBottom: 4 }}>Remaining: {maxUses - wellCount}/{maxUses}</Text>
          {wellCount >= maxUses && (
            <Text style={{ color: '#ef4444', fontSize: 12 }}>⚠️ Well has dried up</Text>
          )}
        </View>

        {canUse ? (
          <Pressable
            onPress={() => dispatch({ type: 'UseWell' })}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: 'rgba(34, 197, 94, 0.5)',
              borderWidth: 1,
              borderColor: 'rgba(74, 222, 128, 0.5)',
              marginBottom: 8
            }}
          >
            <Text style={{ color: '#bbf7d0', fontWeight: '600', textAlign: 'center' }}>💧 Drink from Well (+10 HP) - FREE</Text>
          </Pressable>
        ) : (
          <View style={{ 
            paddingHorizontal: 16, 
            paddingVertical: 12, 
            borderRadius: 12, 
            backgroundColor: 'rgba(75, 85, 99, 0.3)', 
            borderWidth: 1, 
            borderColor: 'rgba(156, 163, 175, 0.3)', 
            marginBottom: 8 
          }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
              {wellCount >= maxUses ? '💧 Well has dried up' : 
               '💚 Already at full health'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderTreasureShop = () => {
    return (
      <View style={{ marginTop: 16, borderRadius: 16, padding: 16, backgroundColor: 'rgba(146, 64, 14, 0.3)', borderWidth: 1, borderColor: 'rgba(234, 179, 8, 0.3)' }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>📦 Treasure Chest</Text>
        {state.currentShopId && (
          <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12, marginBottom: 4 }}>Chest ID: {state.currentShopId}</Text>
        )}
        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: 8 }}>Cards in deck: {state.masterDeck?.length ?? 0}</Text>
        <Text style={{ color: '#fde68a', marginBottom: 16 }}>A mysterious chest glows with magical energy. Choose wisely!</Text>
        
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: 'white', fontWeight: '600', marginBottom: 8 }}>🆓 Free Cards - Choose One:</Text>
        </View>

        {(state.shopStock ?? []).length > 0 ? (
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {(state.shopStock ?? []).map((item, i) => (
                <Pressable
                  key={i}
                  onPress={() => dispatch({ type: 'TakeTreasureCard', index: i })}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 12,
                    borderWidth: 2,
                    backgroundColor: 'rgba(234, 179, 8, 0.2)',
                    borderColor: 'rgba(234, 179, 8, 0.5)',
                    flex: 1,
                    minWidth: '45%'
                  }}
                >
                  <Text style={{ color: '#fde68a', fontWeight: '600', textAlign: 'center' }}>{'card' in item ? item.card?.name || 'Unknown' : 'Unknown'}</Text>
                  {'card' in item && item.card?.dmg ? <Text style={{ color: '#fca5a5', textAlign: 'center' }}>DMG {item.card.dmg}</Text> : null}
                  {'card' in item && item.card?.block ? <Text style={{ color: '#7dd3fc', textAlign: 'center' }}>Block {item.card.block}</Text> : null}
                  {'card' in item && item.card?.energyGain ? <Text style={{ color: '#fcd34d', textAlign: 'center' }}>Energy +{item.card.energyGain}</Text> : null}
                  {'card' in item && item.card?.draw ? <Text style={{ color: '#86efac', textAlign: 'center' }}>Draw {item.card.draw}</Text> : null}
                  <Text style={{ color: '#86efac', fontSize: 10, textAlign: 'center', marginTop: 4 }}>FREE</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View style={{ 
            paddingHorizontal: 16, 
            paddingVertical: 12, 
            borderRadius: 12, 
            backgroundColor: 'rgba(75, 85, 99, 0.3)', 
            borderWidth: 1, 
            borderColor: 'rgba(156, 163, 175, 0.3)', 
            marginBottom: 16 
          }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
              📦 Chest is empty
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderSingleTreasureShop = () => {
    const hasUsedRandom = (state as any)._singleTreasureRandomized ?? false;
    
    return (
      <View style={{ marginTop: 16, borderRadius: 16, padding: 16, backgroundColor: 'rgba(146, 64, 14, 0.3)', borderWidth: 1, borderColor: 'rgba(234, 179, 8, 0.3)' }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>💎 Single Treasure</Text>
        {state.currentShopId && (
          <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12, marginBottom: 4 }}>Treasure ID: {state.currentShopId}</Text>
        )}
        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: 8 }}>Cards in deck: {state.masterDeck?.length ?? 0}</Text>
        <Text style={{ color: '#fde68a', marginBottom: 16 }}>A mysterious single gem glows with magical energy.</Text>
        
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: 'white', fontWeight: '600', marginBottom: 8 }}>🆓 Free Card:</Text>
        </View>

        {(state.shopStock ?? []).length > 0 ? (
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {(state.shopStock ?? []).map((item, i) => (
                <Pressable
                  key={i}
                  onPress={() => dispatch({ type: 'TakeSingleTreasureCard', index: i })}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 12,
                    borderWidth: 2,
                    backgroundColor: 'rgba(234, 179, 8, 0.2)',
                    borderColor: 'rgba(234, 179, 8, 0.5)',
                    minWidth: 140,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: '#fde68a', fontWeight: '600', fontSize: 16 }}>
                    {'card' in item ? item.card?.name || 'Unknown Card' : 'Unknown Item'}
                  </Text>
                  <Text style={{ color: '#fde68a', fontSize: 12, marginTop: 4 }}>
                    💰 FREE
                  </Text>
                </Pressable>
              ))}
            </View>
            
            {/* Random Button */}
            <View style={{ marginTop: 16, alignItems: 'center' }}>
              <Pressable
                onPress={() => dispatch({ type: 'RandomizeSingleTreasure' })}
                disabled={hasUsedRandom}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: hasUsedRandom ? 'rgba(82, 82, 91, 0.3)' : 'rgba(139, 69, 19, 0.5)',
                  borderWidth: 1,
                  borderColor: hasUsedRandom ? 'rgba(113, 113, 122, 0.3)' : 'rgba(160, 82, 45, 0.5)',
                  opacity: hasUsedRandom ? 0.5 : 1
                }}
              >
                <Text style={{ color: hasUsedRandom ? '#a1a1aa' : '#d2b48c', fontWeight: '600' }}>
                  {hasUsedRandom ? '🎲 Random Used' : '🎲 Randomize (1 time)'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={{
            padding: 20,
            borderRadius: 8,
            backgroundColor: 'rgba(63, 63, 70, 0.3)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            alignItems: 'center'
          }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
              💎 Treasure is empty
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View>
      {shopKind === 'card' && renderCardShop()}
      {shopKind === 'equipment' && renderEquipmentShop()}
      {shopKind === 'remove' && renderRemoveShop()}
      {shopKind === 'upgrade' && renderUpgradeShop()}
      {shopKind === 'healing' && renderHealingShop()}
      {shopKind === 'well' && renderWellShop()}
      {shopKind === 'treasure' && renderTreasureShop()}
      {shopKind === 'treasure_single' && renderSingleTreasureShop()}
      {shopKind === 'fusion' && <FusionAltarView state={state} dispatch={dispatch} />}

      {/* Shop Control Buttons */}
      <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
        <Pressable
          onPress={() => dispatch({ type: 'CompleteNode' })}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: 'rgba(63, 63, 70, 0.5)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)'
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>🚪 Leave Shop</Text>
        </Pressable>
        <Pressable
          onPress={() => dispatch({ type: 'DeleteShop' })}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: 'rgba(220, 38, 38, 0.5)',
            borderWidth: 1,
            borderColor: 'rgba(248, 113, 113, 0.5)'
          }}
        >
          <Text style={{ color: '#fecaca', fontWeight: '600' }}>🗑️ Delete Shop</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default ShopView;