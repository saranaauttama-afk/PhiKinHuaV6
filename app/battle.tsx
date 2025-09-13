import React from 'react';
import { View, Text, ImageBackground, Pressable, Dimensions, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGame } from './store/gameStore';
import Card from './components/Card';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function BattlePage() {
  const router = useRouter();
  const gameState = useGame((state) => state.state);
  const player = gameState.player;

  const {
    monsterId = 'phi-krasue',
    monsterName = 'ผีกระสือ',
    monsterHp = '20'
  } = useLocalSearchParams();

  // Calculate deck size (total cards in all piles + master deck)
  const deckSize = gameState.masterDeck.length +
    gameState.piles.draw.length +
    gameState.piles.hand.length +
    gameState.piles.discard.length;

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
          top: 30,
          right: 10,
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
          // justifyContent: 'center',
          top:65,
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
                      marginBottom: 0,
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

          <View style={{ position: 'relative', marginBottom: 15 }}>
            <Image
              source={require('../assets/images/badgeMonster.png')}
              style={{
                width: 300,
                height: 80,
              }}
              resizeMode="contain"
            />

            <Text style={{
              position: 'absolute',
              top: 20,
              left: 60,
              
              color: 'rgba(255,255,255,0.4)',
              fontSize: 12,
              fontFamily: 'ChakraPetch_400Regular',
              textAlign: 'center',
              textAlignVertical: 'center',
              // textShadowColor: 'rgba(0,0,0,0.8)',
              // textShadowOffset: { width: 2, height: 2 },
              // textShadowRadius: 4,
            }}>
              {monsterName}
            </Text>

            {/* HP Gauge */}
            <View style={{
              position: 'absolute',
              // bottom: 15,
              top:38,
              left: 60,
              width: 180,
              height: 12,
              backgroundColor: 'rgba(0,0,0,0.4)',
              borderRadius: 6,
              borderWidth: 1,
              borderColor: 'rgba(68,23,0,0.8)',
            }}>
              <View style={{
                width: `${(parseInt(monsterHp.toString()) / 20) * 100}%`,
                height: '100%',
                backgroundColor: 'rgba(144,4,4,0.5)',
                borderRadius: 5,
              }} />
            </View>

            {/* HP Text */}
            <Text style={{
              position: 'absolute',
              top: 35,
              left: 50,
              width: 200,
              // height: 12,
              color: 'rgba(255,255,255,0.5)',
              fontSize: 10,
              fontFamily: 'ChakraPetch_400Regular',
              textAlign: 'center',
              textAlignVertical: 'center',
              // textShadowColor: 'rgba(0,0,0,0.8)',
              // textShadowOffset: { width: 1, height: 1 },
              // textShadowRadius: 2,
            }}>
              {monsterHp}/20
            </Text>
          </View>
        </View>

        {/* Hand Cards - Above Player Badge */}
        <View style={{
          position: 'absolute',
          bottom: 120,
          left: 20,
          right: 20,
          alignItems: 'center',
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 10,
          }}>
            {gameState.piles.hand.map((card, index) => (
              <Card
                key={card.id}
                card={card}
                width={110}
                height={140}
                onPress={() => {
                  console.log('Card played:', card.name);
                }}
              />
            ))}
          </View>
        </View>

        {/* Player Badge - Bottom */}
        <View style={{
          position: 'absolute',
          bottom: 10,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}>
          <View style={{ position: 'relative' }}>
            <Image
              source={require('../assets/images/players/badgePlayer.png')}
              style={{
                width: 350,
                height: 100,
              }}
              resizeMode="contain"
            />


            {/* HP Icon */}
            <Image
              source={require('../assets/images/players/iHp.png')}
              style={{
                position: 'absolute',
                top: 19,
                left: 60,
                width: 22,
                height: 22,
              }}
              resizeMode="contain"
            />

            {/* Player HP Gauge */}
            <View style={{
              position: 'absolute',
              top: 23,
              left: 80,
              width: 190,
              height: 14,
              backgroundColor: 'rgba(0,0,0,0.4)',
              borderRadius: 7,
              borderWidth: 1,
              borderColor: 'rgba(68,23,0,0.8)',
            }}>
              <View style={{
                width: `${(player.hp / player.maxHp) * 100}%`,
                height: '100%',
                backgroundColor: 'rgba(144,4,4,0.5)',
                borderRadius: 6,
              }} />
            </View>

            {/* Player HP Text */}
            <Text style={{
              position: 'absolute',
              top: 20,
              left: 70,
              width: 210,
              color: 'rgba(255,255,255,0.6)',
              fontSize: 11,
              fontFamily: 'ChakraPetch_400Regular',
              textAlign: 'center',
              textAlignVertical: 'center',
            }}>
              HP: {player.hp}/{player.maxHp}
            </Text>

            {/* Player Stats Row */}
            <View style={{
              position: 'absolute',
              top: 40,
              left: 80,
              right: 80,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('../assets/images/players/iEnergy.png')}
                  style={{ width: 24, height: 24, marginRight: 4 }}
                  resizeMode="contain"
                />
                <Text style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 11,
                  fontFamily: 'ChakraPetch_600SemiBold',
                }}>
                  {player.energy}/{player.maxEnergy}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('../assets/images/players/iMaxHand.png')}
                  style={{ width: 24, height: 24, marginRight: 4 }}
                  resizeMode="contain"
                />
                <Text style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 11,
                  fontFamily: 'ChakraPetch_600SemiBold',
                }}>
                  {player.maxHandSize}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('../assets/images/players/iBlock.png')}
                  style={{ width: 24, height: 24, marginRight: 4 }}
                  resizeMode="contain"
                />
                <Text style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 11,
                  fontFamily: 'ChakraPetch_600SemiBold',
                }}>
                  {player.block}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('../assets/images/players/iDeck.png')}
                  style={{ width: 24, height: 24, marginRight: 4 }}
                  resizeMode="contain"
                />
                <Text style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 11,
                  fontFamily: 'ChakraPetch_600SemiBold',
                }}>
                  {deckSize}
                </Text>
              </View>
            </View>

          </View>
        </View>
      </ImageBackground>
    </View>
  );
}