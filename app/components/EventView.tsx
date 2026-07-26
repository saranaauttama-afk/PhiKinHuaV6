import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { GameState, Command } from '../../src/core/types';
import { getBucketDisplayInfo } from '../../src/core/level';
import { palette, surface, tint } from '../theme';

interface EventViewProps {
  state: GameState;
  dispatch: (cmd: Command) => void;
}

function EventView({ state, dispatch }: EventViewProps) {
  const inEvent = state.phase === 'event';
  const inLevelUp = state.phase === 'levelup';
  const inVictory = state.phase === 'victory';
  const inStarter = state.phase === 'starter';

  if (!inEvent && !inLevelUp && !inVictory && !inStarter) return null;

  const renderWell = () => {
    const event = state.event as any;
    return (
      <View style={{ marginTop: 16, borderRadius: 16, padding: 16, backgroundColor: surface.panelWell, borderWidth: 1, borderColor: palette.line }}>
        <Text style={{ color: palette.text, fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>🏞️ Mystical Well</Text>
        <Text style={{ color: palette.moonDim, marginBottom: 16 }}>A magical well glows with healing energy.</Text>
        
        {!event.used && !event.dismissed ? (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => dispatch({ type: 'DoWellUse' })}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: tint.moonPick,
                borderWidth: 1,
                borderColor: palette.lineStrong
              }}
            >
              <Text style={{ color: palette.moonDim, fontWeight: '600' }}>💧 Drink (+10 HP)</Text>
            </Pressable>
            <Pressable
              onPress={() => dispatch({ type: 'DoWellDismiss' })}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: surface.panelWell,
                borderWidth: 1,
                borderColor: palette.line
              }}
            >
              <Text style={{ color: palette.textDim, fontWeight: '600' }}>🚶 Leave</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: palette.textDim, marginBottom: 12 }}>
              {event.used ? '✅ You feel refreshed from the magical waters.' : '👋 You decided to leave the well untouched.'}
            </Text>
            <Pressable
              onPress={() => dispatch({ type: 'CompleteNode' })}
              style={{
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: palette.lineStrong,
                borderWidth: 1,
                borderColor: palette.lineStrong
              }}
            >
              <Text style={{ color: palette.moonDim, fontWeight: '600' }}>Continue Journey</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  const renderHealingShrine = () => {
    const event = state.event as any;
    return (
      <View className="mt-4 rounded-2xl p-4 bg-green-900/30 border border-green-500/30">
        <Text className="text-white text-xl font-bold mb-2">🏥 Healing Shrine</Text>
        <Text className="text-green-200 mb-4">An ancient shrine radiates powerful healing magic.</Text>
        
        {!event.used && !event.dismissed ? (
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => dispatch({ type: 'DoHealingShrineUse' })}
              className="px-4 py-3 rounded-xl bg-green-600/50 border border-green-400/50 active:opacity-70"
            >
              <Text className="text-green-200 font-semibold">🙏 Pray (+15 HP)</Text>
            </Pressable>
            <Pressable
              onPress={() => dispatch({ type: 'DoHealingShrineDismiss' })}
              className="px-4 py-3 rounded-xl bg-gray-600/50 border border-gray-400/50 active:opacity-70"
            >
              <Text className="text-gray-200 font-semibold">🚶 Leave</Text>
            </Pressable>
          </View>
        ) : (
          <View className="text-center">
            <Text className="text-white/60 mb-3">
              {event.used ? '✨ The shrine\'s blessing has healed your wounds.' : '👋 You respectfully left the shrine.'}
            </Text>
            <Pressable
              onPress={() => dispatch({ type: 'CompleteNode' })}
              className="px-6 py-3 rounded-xl bg-green-600/50 border border-green-400/50 active:opacity-70"
            >
              <Text className="text-green-200 font-semibold">Continue Journey</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  const renderLevelUp = () => {
    const lu = state.levelUp;
    if (!lu) return null;

    // Support for new choice-based system
    if (lu.choice) {
      const { optionA, optionB, contextDescription } = lu.choice;
      const infoA = getBucketDisplayInfo(optionA);
      const infoB = getBucketDisplayInfo(optionB);

      const renderChoiceOption = (option: 'A' | 'B', info: any) => {
        const bucket = option === 'A' ? optionA : optionB;
        const needsSubChoice = bucket === 'cards' || bucket === 'blessing' || bucket === 'remove' || bucket === 'upgrade';
        
        return (
          <Pressable
            onPress={() => {
              if (!needsSubChoice) {
                // For direct choices, apply immediately
                dispatch({ type: 'ChooseLevelUpOption', option });
              }
              // For choices that need sub-selection, do nothing - just show the sub-options
            }}
            style={{
              flex: 1,
              padding: 16,
              marginHorizontal: 4,
              borderRadius: 12,
              backgroundColor: needsSubChoice ? tint.moonFaint : tint.moonSoft,
              borderWidth: 2,
              borderColor: needsSubChoice ? tint.moonSoft : palette.line,
              opacity: needsSubChoice ? 0.6 : 1,
            }}
          >
            <Text style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>{info.icon}</Text>
            <Text style={{ color: palette.text, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 }}>{info.name}</Text>
            <Text style={{ color: palette.moonDim, textAlign: 'center', fontSize: 12 }}>{info.description}</Text>
          </Pressable>
        );
      };

      return (
        <View style={{ marginTop: 16, borderRadius: 16, padding: 16, backgroundColor: surface.panelWell, borderWidth: 1, borderColor: palette.line }}>
          <Text style={{ color: palette.text, fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>⬆️ Level Up!</Text>
          <Text style={{ color: palette.moonDim, marginBottom: 16, textAlign: 'center' }}>
            {contextDescription || 'Choose your path forward:'}
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {renderChoiceOption('A', infoA)}
            {renderChoiceOption('B', infoB)}
          </View>

          {/* Sub-choice rendering for cards/blessings */}
          {(optionA === 'cards' || optionB === 'cards') && lu.cardChoices && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ color: palette.text, fontWeight: 'bold', marginBottom: 8 }}>Choose cards to add:</Text>
              <View style={{ gap: 8 }}>
                {lu.cardChoices.map((card, i) => (
                  <Pressable
                    key={i}
                    onPress={() => dispatch({ type: 'ChooseLevelUpOption', option: optionA === 'cards' ? 'A' : 'B', index: i })}
                    style={{ padding: 12, borderRadius: 8, backgroundColor: tint.moonSoft, borderWidth: 1, borderColor: palette.line }}
                  >
                    <Text style={{ color: palette.moonDim, fontWeight: 'bold' }}>{card.name}</Text>
                    <Text style={{ color: palette.moonDim, fontSize: 12 }}>Cost: {card.cost ?? 0}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {(optionA === 'blessing' || optionB === 'blessing') && lu.blessingChoices && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ color: palette.text, fontWeight: 'bold', marginBottom: 8 }}>Choose a blessing:</Text>
              <View style={{ gap: 8 }}>
                {lu.blessingChoices.map((blessing, i) => (
                  <Pressable
                    key={i}
                    onPress={() => dispatch({ type: 'ChooseLevelUpOption', option: optionA === 'blessing' ? 'A' : 'B', index: i })}
                    style={{ padding: 12, borderRadius: 8, backgroundColor: tint.moonSoft, borderWidth: 1, borderColor: palette.line }}
                  >
                    <Text style={{ color: palette.moonDim, fontWeight: 'bold' }}>{blessing.name}</Text>
                    <Text style={{ color: palette.moonDim, fontSize: 12 }}>{blessing.desc}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Remove/Upgrade card selection */}
          {(optionA === 'remove' || optionB === 'remove' || optionA === 'upgrade' || optionB === 'upgrade') && !lu.choice?.selectedOption && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ color: palette.text, fontWeight: 'bold', marginBottom: 8 }}>
                Choose a card to {optionA === 'remove' || optionB === 'remove' ? 'remove' : 'upgrade'}:
              </Text>
              <View style={{ gap: 8 }}>
                {state.masterDeck?.map((card, i) => (
                  <Pressable
                    key={i}
                    onPress={() => {
                      const option = (optionA === 'remove' || optionA === 'upgrade') ? 'A' : 'B';
                      dispatch({ type: 'ChooseLevelUpOption', option, index: i });
                    }}
                    style={{ 
                      padding: 12, 
                      borderRadius: 8, 
                      backgroundColor: tint.bloodSoft, 
                      borderWidth: 1, 
                      borderColor: tint.bloodLine 
                    }}
                  >
                    <Text style={{ color: palette.blood, fontWeight: 'bold' }}>{card.name}</Text>
                    <Text style={{ color: palette.blood, fontSize: 12 }}>
                      Cost: {card.cost ?? 0}
                      {card.dmg && ` | DMG: ${card.dmg}`}
                      {card.block && ` | Block: ${card.block}`}
                    </Text>
                  </Pressable>
                ))}
              </View>
              
              {/* Back button */}
              <Pressable
                onPress={() => dispatch({ type: 'CancelLevelUpChoice' })}
                style={{
                  marginTop: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: surface.panelWell,
                  borderWidth: 1,
                  borderColor: palette.line,
                  alignSelf: 'center'
                }}
              >
                <Text style={{ color: palette.textDim, fontWeight: '600' }}>← Back to rewards</Text>
              </Pressable>
            </View>
          )}
        </View>
      );
    }

    // Legacy support for old bucket system
    if (lu.bucket) {
      const Btn = ({ label, onPress }: { label: string; onPress: () => void }) => (
        <Pressable onPress={onPress} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: palette.lineStrong, borderWidth: 1, borderColor: palette.lineStrong }}>
          <Text style={{ color: palette.moonDim, fontWeight: 'bold' }}>{label}</Text>
        </Pressable>
      );

      return (
        <View style={{ marginTop: 16, borderRadius: 16, padding: 16, backgroundColor: surface.panelWell, borderWidth: 1, borderColor: palette.line }}>
          <Text style={{ color: palette.text, fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>⬆️ Level Up!</Text>
          <Text style={{ color: palette.moonDim, marginBottom: 16 }}>Choose your reward:</Text>
          
          {(() => {
            switch (lu.bucket) {
              case 'blessing':
                return (
                  <View>
                    <Text style={{ color: palette.text, fontWeight: 'bold', marginBottom: 8 }}>Choose a blessing:</Text>
                    <View style={{ gap: 8 }}>
                      {(lu.blessingChoices ?? []).map((blessing, i) => (
                        <Pressable
                          key={i}
                          onPress={() => dispatch({ type: 'ChooseLevelUp', index: i })}
                          style={{ padding: 12, borderRadius: 8, backgroundColor: tint.moonSoft, borderWidth: 1, borderColor: palette.line }}
                        >
                          <Text style={{ color: palette.moonDim, fontWeight: 'bold' }}>{blessing.name}</Text>
                          <Text style={{ color: palette.moonDim, fontSize: 12 }}>{blessing.desc}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                );
              case 'cards':
                return (
                  <View>
                    <Text style={{ color: palette.text, fontWeight: 'bold', marginBottom: 8 }}>Choose cards to add:</Text>
                    <View style={{ gap: 8 }}>
                      {(lu.cardChoices ?? []).map((card, i) => (
                        <Pressable
                          key={i}
                          onPress={() => dispatch({ type: 'ChooseLevelUp', index: i })}
                          style={{ padding: 12, borderRadius: 8, backgroundColor: tint.moonSoft, borderWidth: 1, borderColor: palette.line }}
                        >
                          <Text style={{ color: palette.moonDim, fontWeight: 'bold' }}>{card.name}</Text>
                          <Text style={{ color: palette.moonDim, fontSize: 12 }}>Cost: {card.cost ?? 0}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                );
              case 'remove': 
                return <Btn label="Remove a card from deck" onPress={() => dispatch({ type: 'ChooseLevelUp' })} />;
              case 'upgrade':
                return <Btn label="Upgrade a card" onPress={() => dispatch({ type: 'ChooseLevelUp' })} />;
              case 'max_hp': 
                return <Btn label="+5 Max HP" onPress={() => dispatch({ type: 'ChooseLevelUp' })} />;
              case 'max_energy': 
                return <Btn label="+1 Max Energy" onPress={() => dispatch({ type: 'ChooseLevelUp' })} />;
              case 'max_hand': 
                return <Btn label="+1 Max Hand Size" onPress={() => dispatch({ type: 'ChooseLevelUp' })} />;
              case 'equipment_slot':
                return <Btn label="+1 Equipment Slot" onPress={() => dispatch({ type: 'ChooseLevelUp' })} />;
              case 'gold_skip':
                return <Btn label="+50 Gold" onPress={() => dispatch({ type: 'ChooseLevelUp' })} />;
              case 'gold':
              default: 
                return <Btn label="+25 Gold" onPress={() => dispatch({ type: 'ChooseLevelUp' })} />;
            }
          })()}
        </View>
      );
    }

    return null;
  };

  const renderStarter = () => {
    if (!state.starter) return null;

    return (
      <View className="mt-4 rounded-2xl p-4 bg-purple-900/30 border border-purple-500/30">
        <Text className="text-white text-xl font-bold mb-2">🌟 Choose Your Starting Blessing</Text>
        <Text className="text-purple-200 mb-4">Select a blessing to begin your journey:</Text>
        
        <View className="flex-col gap-3">
          {state.starter.choices.map((blessing, i) => (
            <Pressable
              key={i}
              onPress={() => dispatch({ type: 'ChooseStarterBlessing', index: i })}
              className="p-4 rounded-lg bg-purple-800/30 border border-purple-500/30 active:opacity-70"
            >
              <Text className="text-purple-200 font-bold text-lg">{blessing.name}</Text>
              <Text className="text-purple-200/80 mt-1">{blessing.desc}</Text>
              <Text className="text-purple-300/60 text-sm mt-2">⭐ {blessing.rarity}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const renderVictory = () => (
    <View style={{ marginTop: 16, borderRadius: 16, padding: 16, backgroundColor: surface.panelWell, borderWidth: 1, borderColor: tint.moonSoft }}>
      <Text style={{ color: palette.text, fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>🎉 Victory!</Text>
      <Text style={{ color: palette.moonDim, marginBottom: 16 }}>You have defeated your enemy!</Text>
      
      <Pressable
        onPress={() => dispatch({ type: 'CompleteNode' })}
        style={{
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 12,
          backgroundColor: tint.moonPick,
          borderWidth: 1,
          borderColor: palette.lineStrong
        }}
      >
        <Text style={{ color: palette.moonDim, fontWeight: '600' }}>Continue</Text>
      </Pressable>
    </View>
  );

  return (
    <View>
      {inEvent && state.event?.type === 'well' && renderWell()}
      {inEvent && state.event?.type === 'healing_shrine' && renderHealingShrine()}
      {inLevelUp && renderLevelUp()}
      {inStarter && renderStarter()}
      {inVictory && renderVictory()}
    </View>
  );
}

export default EventView;