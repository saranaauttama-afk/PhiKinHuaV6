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
  const [monsterPlayingCard, setMonsterPlayingCard] = React.useState<{cardId: string, cardData: any} | null>(null);
  const [monsterCardAnimation, setMonsterCardAnimation] = React.useState<{cardId: string, phase: 'flip' | 'enlarge' | 'execute'} | null>(null);
  const [flippedCards, setFlippedCards] = React.useState<Set<string>>(new Set());
  const [drawingCards, setDrawingCards] = React.useState(false);
  const [drawnCards, setDrawnCards] = React.useState<string[]>([]);

  // Monster floating animation
  const monsterY = useSharedValue(0);
  const monsterX = useSharedValue(0);

  // Monster card animation values
  const cardFlipRotation = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const cardTranslateY = useSharedValue(0);

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
    ] as any,
  }));

  // Monster card animation style
  const monsterCardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${cardFlipRotation.value}deg` },
      { scale: cardScale.value },
      { translateY: cardTranslateY.value },
    ] as any,
  }));

  // Function to simulate monster card play animation
  const playMonsterCardAnimation = React.useCallback(async (cardId: string, cardData: any) => {
    console.log(`🎯 Starting animation for monster card: ${cardData?.name || cardData?.id}`);

    // Phase 1: Flip card (face-down to face-up) - mark as flipped
    setMonsterCardAnimation({ cardId, phase: 'flip' });
    setFlippedCards(prev => new Set([...prev, cardId]));

    await new Promise(resolve => setTimeout(resolve, 500));

    // Phase 2: Enlarge and move center
    setMonsterCardAnimation({ cardId, phase: 'enlarge' });
    setMonsterPlayingCard({ cardId: cardData.id, cardData });

    cardScale.value = withTiming(2.5, { duration: 600 });
    cardTranslateY.value = withTiming(-100, { duration: 600 });

    await new Promise(resolve => setTimeout(resolve, 700));

    // Phase 3: Execute card effect
    setMonsterCardAnimation({ cardId, phase: 'execute' });
    console.log(`🎯 Executing effect for monster card: ${cardData?.name || cardData?.id}`);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Phase 4: Reset and remove
    cardScale.value = withTiming(0, { duration: 300 });

    setTimeout(() => {
      setMonsterPlayingCard(null);
      setMonsterCardAnimation(null);
      // Keep the card flipped after animation
    }, 300);
  }, [cardScale, cardTranslateY]);

  // Removed old startMonsterTurn - now handled directly in EndTurn

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
      // Reset drawing states for new combat
      setDrawingCards(false);
      setDrawnCards([]);
      setFlippedCards(new Set());
      setMonsterCardAnimation(null);
      setMonsterPlayingCard(null);

      dispatch({ type: 'StartCombat', monsterId: monsterId as string });
    }
  }, [monsterId, enemy, gameState.phase, dispatch]);

  // Removed auto-trigger - monster turn will be triggered manually via StartMonsterTurn command

  // Monitor monster sequential turn and play cards
  const currentCardIndexRef = React.useRef(0);

  // Draw cards animation first, then play cards
  React.useEffect(() => {
    const monsterSequentialTurn = (gameState as any).monsterSequentialTurn;

    if (monsterSequentialTurn?.active && monsterSequentialTurn?.queue?.length > 0) {
      console.log(`🎬 Starting monster turn with ${monsterSequentialTurn.queue.length} cards`);
      console.log(`🎬 Queue: ${monsterSequentialTurn.queue.join(', ')}`);

      // Reset states
      currentCardIndexRef.current = 0;
      setFlippedCards(new Set());
      setDrawnCards([]);
      setDrawingCards(true);

      // Draw cards animation (like player)
      const drawCardsWithAnimation = async () => {
        console.log(`🎴 Drawing ${monsterSequentialTurn.queue.length} cards...`);

        for (let i = 0; i < monsterSequentialTurn.queue.length; i++) {
          const cardId = monsterSequentialTurn.queue[i];
          console.log(`🎴 Drawing card ${i + 1}/${monsterSequentialTurn.queue.length}: ${cardId}`);

          setDrawnCards(prev => [...prev, cardId]);
          await new Promise(resolve => setTimeout(resolve, 600)); // 0.6s per card draw
        }

        console.log(`🎴 All cards drawn! Waiting before starting to play...`);
        setDrawingCards(false);

        // Wait a bit for player to see the drawn cards
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log(`🎬 Starting to play cards sequentially`);
        startPlayingCards();
      };

      const startPlayingCards = () => {
        const playNextCard = () => {
          const currentIndex = currentCardIndexRef.current;

          if (currentIndex < monsterSequentialTurn.queue.length) {
            const currentCardId = monsterSequentialTurn.queue[currentIndex];
            console.log(`⏰ Playing card ${currentIndex}: ${currentCardId}`);

            // Animate the card
            const { enemyCardById } = require('../src/core/pack_enemy_cards');
            const cardData = enemyCardById(currentCardId);
            playMonsterCardAnimation(currentCardId, cardData);

            // Execute the card after animation delay
            setTimeout(() => {
              dispatch({ type: 'EnemyPlayCard', cardIndex: currentIndex });
            }, 1000);

            // Move to next card
            currentCardIndexRef.current++;
          }
        };

        // Play first card immediately
        playNextCard();

        // Set up interval for remaining cards
        const interval = setInterval(() => {
          if (currentCardIndexRef.current < monsterSequentialTurn.queue.length) {
            playNextCard();
          } else {
            clearInterval(interval);
          }
        }, 2500); // Slightly longer delay between cards

        // Store interval in ref for cleanup
        (currentCardIndexRef as any).interval = interval;
      };

      // Start the sequence
      drawCardsWithAnimation();

      // Cleanup function
      return () => {
        if ((currentCardIndexRef as any).interval) {
          clearInterval((currentCardIndexRef as any).interval);
        }
      };
    }
  }, [(gameState as any).monsterSequentialTurn?.timer]);

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

          {/* Monster Cards Area */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 10,
            height: 60,
          }}>
            {/* Show monster's hand cards - use MonsterCardSystem if available */}
            {(() => {
              // Use enemyPiles system (works for all monsters)
              if (gameState.enemyPiles?.hand) {
                const enemyHand = gameState.enemyPiles.hand;
                const { enemyCardById } = require('../src/core/pack_enemy_cards');

                // Filter cards based on drawing state
                const displayCards = (drawingCards || drawnCards.length > 0) ?
                  enemyHand.filter(cardId => drawnCards.includes(cardId)) :
                  // Don't show any cards initially until first draw animation starts
                  gameState.phase === 'combat' && !(gameState as any).monsterSequentialTurn ? [] : enemyHand;

                return displayCards.map((cardId: string, index: number) => {
                  const isAnimating = monsterCardAnimation?.cardId === cardId;
                  const card = enemyCardById(cardId);

                  return (
                    <Animated.View
                      key={`monster-card-${cardId}-${index}`}
                      style={[
                        {
                          width: 35,
                          height: 50,
                          marginHorizontal: 2,
                          justifyContent: 'center',
                          alignItems: 'center',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 3,
                          zIndex: isAnimating ? 999 : 1,
                        },
                        isAnimating && monsterCardAnimatedStyle
                      ]}
                    >
                      {/* Card content - flip between back and front */}
                      {(!flippedCards.has(cardId) && (!isAnimating || monsterCardAnimation?.phase === 'flip')) ? (
                        // Card back with image
                        <Image
                          source={require('../assets/images/monsters/bgMonsterCardBackMini.png')}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: 4,
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        // Card front (when flipped)
                        <View style={{
                          flex: 1,
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: 'rgba(40, 20, 80, 0.9)',
                          borderRadius: 4,
                          borderWidth: 1,
                          borderColor: 'rgba(180, 150, 220, 0.6)',
                        }}>
                          <Text style={{
                            color: 'white',
                            fontSize: 8,
                            fontFamily: 'ChakraPetch_400Regular',
                            textAlign: 'center',
                            marginBottom: 2,
                          }}>
                            {card?.name || cardId}
                          </Text>
                          {card?.dmg && (
                            <Text style={{
                              color: '#ff6b6b',
                              fontSize: 10,
                              fontFamily: 'ChakraPetch_700Bold',
                            }}>
                              ⚔{card.dmg}
                            </Text>
                          )}
                          {card?.block && (
                            <Text style={{
                              color: '#4dabf7',
                              fontSize: 10,
                              fontFamily: 'ChakraPetch_700Bold',
                            }}>
                              🛡{card.block}
                            </Text>
                          )}
                        </View>
                      )}
                    </Animated.View>
                  );
                });
              } else {
                // Fallback to old system
                return gameState.enemyPiles?.hand?.map((cardId, index) => {
                  const isAnimating = monsterCardAnimation?.cardId === cardId;
                  const { enemyCardById } = require('../src/core/pack_enemy_cards');
                  const card = enemyCardById(cardId);

              return (
                <Animated.View
                  key={`enemy-card-${index}`}
                  style={[
                    {
                      width: 35,
                      height: 50,
                      // backgroundColor: 'rgba(60, 30, 120, 0.8)',
                      // borderRadius: 6,
                      // borderWidth: 2,
                      // borderColor: 'rgba(180, 150, 220, 0.6)',
                      marginHorizontal: 2,
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 3,
                      zIndex: isAnimating ? 999 : 1,
                    },
                    isAnimating && monsterCardAnimatedStyle
                  ]}
                >
                  {/* Card content - flip between back and front */}
                  {(!isAnimating || monsterCardAnimation?.phase === 'flip') ? (
                    // Card back with image
                    <Image
                      source={require('../assets/images/monsters/bgMonsterCardBackMini.png')}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 4,
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    // Card front (when flipped)
                    <View style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: 'rgba(40, 20, 80, 0.9)',
                      borderRadius: 4,
                      padding: 2,
                    }}>
                      <Text
                        numberOfLines={2}
                        style={{
                          fontSize: 8,
                          color: 'white',
                          fontFamily: 'ChakraPetch_600SemiBold',
                          textAlign: 'center',
                        }}>
                        {card.name || card.id}
                      </Text>
                      {card.dmg && (
                        <Text style={{
                          fontSize: 10,
                          color: '#ff6b6b',
                          fontFamily: 'ChakraPetch_600SemiBold',
                        }}>
                          ⚔{card.dmg}
                        </Text>
                      )}
                      {card.block && (
                        <Text style={{
                          fontSize: 10,
                          color: '#4ecdc4',
                          fontFamily: 'ChakraPetch_600SemiBold',
                        }}>
                          🛡{card.block}
                        </Text>
                      )}
                    </View>
                  )}
                </Animated.View>
              );
                });
              }
            })()}

            {/* Show placeholder when no cards displayed */}
            {(() => {
              const enemyHand = gameState.enemyPiles?.hand || [];
              const displayCards = (drawingCards || drawnCards.length > 0) ?
                enemyHand.filter(cardId => drawnCards.includes(cardId)) :
                gameState.phase === 'combat' && !(gameState as any).monsterSequentialTurn ? [] : enemyHand;

              return displayCards.length === 0 && (
                <Text style={{
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: 11,
                  fontFamily: 'ChakraPetch_400Regular',
                }}>
                  {drawingCards ? 'Drawing cards...' :
                   gameState.phase === 'combat' ? 'Waiting for monster turn...' : 'No cards in hand'}
                </Text>
              );
            })()}
          </View>

          {/* Test Button for Monster Card Animation */}
          <View style={{ marginTop: 10, alignItems: 'center' }}>
            <Pressable
              onPress={() => {
                // Test animation with first card
                if (gameState.enemyPiles?.hand && (gameState.enemyPiles?.hand?.length || 0) > 0) {
                  const firstCardId = gameState.enemyPiles.hand[0];
                  const { enemyCardById } = require('../src/core/pack_enemy_cards');
                  const firstCard = enemyCardById(firstCardId);
                  playMonsterCardAnimation(firstCardId, firstCard);
                }
              }}
              style={{
                backgroundColor: 'rgba(120, 60, 200, 0.8)',
                paddingHorizontal: 15,
                paddingVertical: 8,
                borderRadius: 15,
                borderWidth: 1,
                borderColor: 'rgba(200, 150, 255, 0.5)',
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: 10,
                fontFamily: 'ChakraPetch_600SemiBold',
              }}>
                Test Monster Play
              </Text>
            </Pressable>
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