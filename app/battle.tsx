import React from 'react';
import { View, Text, ImageBackground, Pressable, Dimensions, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence
} from 'react-native-reanimated';
import { useGame } from '../src/store/gameStore';
import Card from './components/Card';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function BattlePage() {
  const router = useRouter();
  const gameState = useGame((state) => state.state);
  const dispatch = useGame((state) => state.dispatch);
  const player = gameState.player;
  const enemy = gameState.enemy;
  const [hoveredCardId, setHoveredCardId] = React.useState<string | null>(null);
  const [playedCardIds, setPlayedCardIds] = React.useState<string[]>([]);

  // Monster floating animation
  const monsterY = useSharedValue(0);
  const monsterX = useSharedValue(0);

  React.useEffect(() => {
    // Vertical floating animation
    monsterY.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 2000 }),
        withTiming(-8, { duration: 2000 })
      ),
      -1, // Infinite repeat
      true // Reverse
    );

    // Horizontal floating animation (slightly offset timing)
    setTimeout(() => {
      monsterX.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 2500 }),
          withTiming(-5, { duration: 2500 })
        ),
        -1,
        true
      );
    }, 500); // 0.5s delay for more natural movement
  }, []);

  const monsterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: monsterX.value },
      { translateY: monsterY.value },
    ],
  }));

  const searchParams = useLocalSearchParams();
  const {
    monsterId,
    monsterName,
    monsterHp
  } = searchParams;

  // If no params provided, we shouldn't be here - go back to index
  React.useEffect(() => {
    if (!monsterId) {
      console.log('No monster ID provided, redirecting to index');
      router.replace('/');
      return;
    }
  }, [monsterId, router]);

  // Start combat when entering battle page
  React.useEffect(() => {
    if (monsterId && !enemy && gameState.phase !== 'combat') {
      dispatch({ type: 'StartCombat', monsterId: monsterId as string });
    }
  }, [monsterId, enemy, gameState.phase, dispatch]);

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
          <Animated.View style={monsterAnimatedStyle}>
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
          </Animated.View>

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
              {enemy?.name || monsterName || 'Unknown Monster'}
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
                width: `${enemy ? (enemy.hp / enemy.maxHp) * 100 : (monsterHp ? parseInt(monsterHp.toString()) / 20 * 100 : 100)}%`,
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
              {enemy ? `${enemy.hp}/${enemy.maxHp}` : (monsterHp ? `${monsterHp}/20` : `20/20`)}
            </Text>
          </View>
        </View>

        {/* Hand Cards - Above Player Badge */}
        <View style={{
          position: 'absolute',
          bottom: 120,
          left: 0,
          right: 0,
          height: 160,
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}>
          {gameState.piles.hand.map((card, index) => {
            const cardCount = gameState.piles.hand.length;
            const maxRotation = Math.min(25, cardCount * 2.5);
            const totalWidth = screenWidth - 40;

            // Calculate spacing based on card count
            let spacing;
            if (cardCount <= 3) {
              spacing = 100; // No overlap
            } else if (cardCount <= 5) {
              spacing = 70; // Some overlap
            } else {
              spacing = Math.max(50, totalWidth / (cardCount + 1)); // More overlap
            }

            // Calculate position and rotation for each card
            const centerIndex = (cardCount - 1) / 2;
            const offsetFromCenter = index - centerIndex;
            const rotation = (offsetFromCenter / centerIndex) * maxRotation;
            const xOffset = offsetFromCenter * spacing;

            return (
              <View
                key={card.id}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: screenWidth / 2 + xOffset - 55, // Center and offset
                  transform: [{ rotate: `${rotation}deg` }],
                  zIndex: hoveredCardId === card.id ? 999 : index, // Hovered card goes to top
                }}
              >
                <Card
                  card={card}
                  width={110}
                  height={140}
                  onPress={() => {
                    console.log('Card tapped:', card.name);
                    // Show card details or preview
                  }}
                  onDragPlay={() => {
                    console.log('Card played by drag:', card.name);
                    // Mark card as played (will trigger fade out)
                    setPlayedCardIds(prev => [...prev, card.id]);

                    // Play card through game engine
                    dispatch({ type: 'PlayCard', index });

                    // After fade out animation, the card will be removed from hand by game engine
                    setTimeout(() => {
                      console.log('Card attack completed:', card.name);
                      // Remove from playedCardIds since it's already removed from hand
                      setPlayedCardIds(prev => prev.filter(id => id !== card.id));
                    }, 800); // Match fade duration
                  }}
                  onHoverChange={(isHovered) => {
                    setHoveredCardId(isHovered ? card.id : null);
                  }}
                  isPlayed={playedCardIds.includes(card.id)}
                  animationDelay={index * 100} // Stagger by 100ms each
                />
              </View>
            );
          })}
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


            {/* HP and End Turn Row */}
            <View style={{
              position: 'absolute',
              top: 18,
              left: 60,
              right: 80,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              {/* HP Section */}
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {/* HP Icon */}
                <Image
                  source={require('../assets/images/players/iHp.png')}
                  style={{
                    width: 20,
                    height: 20,
                    marginRight: 6,
                  }}
                  resizeMode="contain"
                />

                {/* Player HP Gauge with Text Overlay */}
                <View style={{ position: 'relative' }}>
                  <View style={{
                    width: 100,
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

                  {/* HP Text - Centered on Gauge */}
                  <Text style={{
                    position: 'absolute',
                    top: -2,
                    left: 0,
                    right: 0,
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: 10,
                    fontFamily: 'ChakraPetch_600SemiBold',
                    textAlign: 'center',
                    textShadowColor: 'rgba(0,0,0,0.8)',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 2,
                  }}>
                    {player.hp}/{player.maxHp}
                  </Text>
                </View>
              </View>

              {/* End Turn Button */}
              <Pressable
                onPress={() => {
                  console.log('End Turn pressed');
                  dispatch({ type: 'EndTurn' });
                }}
                style={{
                  width: 70,
                  height: 22,
                  backgroundColor: 'rgba(200, 50, 50, 0.8)',
                  borderRadius: 11,
                  borderWidth: 2,
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: 9,
                  fontFamily: 'ChakraPetch_600SemiBold',
                  textShadowColor: 'rgba(0,0,0,0.8)',
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 2,
                }}>
                  จบเทิร์น
                </Text>
              </Pressable>
            </View>

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