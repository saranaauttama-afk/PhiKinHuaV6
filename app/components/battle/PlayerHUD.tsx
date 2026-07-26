import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { palette, surface, tint } from '../../theme';

type Props = {
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  block: number;
  maxHandSize: number;
  deckSize: number;
  onEndTurn: () => void;
  isEnemyTurn?: boolean;
  hudFlashKey?: number;
};

export default function PlayerHUD({
  hp, maxHp, energy, maxEnergy, block, maxHandSize, deckSize, onEndTurn,
  isEnemyTurn, hudFlashKey,
}: Props) {
  const flashOpacity = useSharedValue(0);
  const hudShakeX = useSharedValue(0);
  const prevHpRef = React.useRef(hp);

  React.useEffect(() => {
    if (hp < prevHpRef.current) {
      // Flash red
      flashOpacity.value = withSequence(
        withTiming(0.7, { duration: 80 }),
        withTiming(0, { duration: 250 })
      );
      // Shake HUD
      hudShakeX.value = withSequence(
        withTiming(6, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
    prevHpRef.current = hp;
  }, [hp]);

  const hudShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: hudShakeX.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  return (
    <Animated.View style={[{ position: 'absolute', bottom: 10, left: 0, right: 0, alignItems: 'center' }, hudShakeStyle]}>
      <View style={{ position: 'relative' }}>
        <Image
          source={require('../../../assets/images/players/badgePlayer.png')}
          style={{ width: 350, height: 100 }}
          resizeMode="contain"
        />

        {/* Red flash overlay */}
        <Animated.View style={[{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: tint.bloodLine, borderRadius: 8,
          pointerEvents: 'none',
        }, flashStyle]} />

        {/* HP + End Turn row */}
        <View style={{
          position: 'absolute', top: 18, left: 60, right: 80,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* HP */}
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Image
              source={require('../../../assets/images/players/iHp.png')}
              style={{ width: 20, height: 20, marginRight: 6 }}
              resizeMode="contain"
            />
            <View style={{ position: 'relative' }}>
              <View style={{
                width: 100, height: 14,
                backgroundColor: surface.glassDim, borderRadius: 7,
                borderWidth: 1, borderColor: palette.line,
              }}>
                <View style={{
                  width: `${(hp / maxHp) * 100}%`,
                  height: '100%', backgroundColor: palette.bloodDeep, borderRadius: 6,
                }} />
              </View>
              <Text style={{
                position: 'absolute', top: -2, left: 0, right: 0,
                color: palette.text, fontSize: 10,
                fontFamily: 'Prompt_600SemiBold', textAlign: 'center',
                textShadowColor: palette.shadow,
                textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2,
              }}>
                {hp}/{maxHp}
              </Text>
            </View>
          </View>

          {/* End Turn */}
          <Pressable
            onPress={onEndTurn}
            disabled={isEnemyTurn}
            style={{
              width: 70, height: 22,
              backgroundColor: palette.blood, borderRadius: 11,
              borderWidth: 2, borderColor: palette.line,
              justifyContent: 'center', alignItems: 'center',
              opacity: isEnemyTurn ? 0.5 : 1,
            }}
          >
            <Text style={{
              color: palette.text, fontSize: 9,
              fontFamily: 'Prompt_600SemiBold',
              textShadowColor: palette.shadow,
              textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2,
            }}>
              จบเทิร์น
            </Text>
          </Pressable>
        </View>

        {/* Stats row */}
        <View style={{
          position: 'absolute', top: 40, left: 80, right: 80,
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <StatItem icon={require('../../../assets/images/players/iEnergy.png')} value={`${energy}/${maxEnergy}`} />
          <StatItem icon={require('../../../assets/images/players/iMaxHand.png')} value={`${maxHandSize}`} />
          <StatItem icon={require('../../../assets/images/players/iBlock.png')} value={`${block}`} />
          <StatItem icon={require('../../../assets/images/players/iDeck.png')} value={`${deckSize}`} />
        </View>
      </View>
    </Animated.View>
  );
}

function StatItem({ icon, value }: { icon: any; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Image source={icon} style={{ width: 24, height: 24, marginRight: 4 }} resizeMode="contain" />
      <Text style={{
        color: palette.text, fontSize: 11,
        fontFamily: 'Prompt_600SemiBold',
      }}>
        {value}
      </Text>
    </View>
  );
}
