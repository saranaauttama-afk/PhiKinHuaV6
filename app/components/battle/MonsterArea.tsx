import React, { useImperativeHandle } from 'react';
import { View, Text, Image, ImageSourcePropType } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

const MONSTER_IMAGES: Record<string, any> = {
  'phi-krasue': require('../../../assets/monsters/phi-krasue.png'),
};

type Props = {
  monsterId: string | string[];
  monsterName?: string | string[];
  enemy?: {
    hp: number; maxHp: number; name: string;
    block?: number; maxEnergy?: number; handSize?: number;
    statusEffects?: { id: string; stacks?: number }[];
  } | null;
};

export type MonsterAreaHandle = {
  shake: () => void;
};

const MonsterArea = React.forwardRef<MonsterAreaHandle, Props>(function MonsterArea({
  monsterId,
  monsterName,
  enemy,
}, ref) {
  const id   = Array.isArray(monsterId)   ? monsterId[0]   : monsterId;
  const name = Array.isArray(monsterName) ? monsterName[0] : monsterName;

  const monsterY      = useSharedValue(0);
  const monsterX      = useSharedValue(0);
  const monsterShakeX = useSharedValue(0);

  React.useEffect(() => {
    monsterY.value = withRepeat(
      withSequence(withTiming(8, { duration: 2000 }), withTiming(-8, { duration: 2000 })),
      -1, true
    );
    const t = setTimeout(() => {
      monsterX.value = withRepeat(
        withSequence(withTiming(5, { duration: 2500 }), withTiming(-5, { duration: 2500 })),
        -1, true
      );
    }, 500);
    return () => {
      clearTimeout(t);
      cancelAnimation(monsterY);
      cancelAnimation(monsterX);
    };
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: monsterX.value + monsterShakeX.value },
      { translateY: monsterY.value },
    ] as any,
  }));

  useImperativeHandle(ref, () => ({
    shake() {
      monsterShakeX.value = withSequence(
        withTiming(10,  { duration: 60 }),
        withTiming(-10, { duration: 60 }),
        withTiming(8,   { duration: 60 }),
        withTiming(-8,  { duration: 60 }),
        withTiming(0,   { duration: 60 })
      );
    },
  }));

  const monsterImage = MONSTER_IMAGES[id];
  const displayName  = enemy?.name ?? name ?? 'Unknown';
  const hp           = enemy?.hp    ?? 20;
  const maxHp        = enemy?.maxHp ?? 20;

  return (
    <View style={{ flex: 1, paddingTop: 65, alignItems: 'center' }}>
      <Animated.View style={floatStyle}>
        {monsterImage ? (
          <Image source={monsterImage} style={{ width: 300, height: 300 }} resizeMode="contain" />
        ) : (
          <Text style={{ fontSize: 120 }}>👻</Text>
        )}
      </Animated.View>

      <View style={{ marginBottom: 15 }}>
        <Image
          source={require('../../../assets/images/badgeMonster.png')}
          style={{ width: 300, height: 80 }}
          resizeMode="contain"
        />
        <Text style={{
          position: 'absolute', top: 20, left: 60,
          color: 'rgba(255,255,255,0.4)', fontSize: 12,
          fontFamily: 'ChakraPetch_400Regular',
        }}>
          {displayName}
        </Text>
        <View style={{
          position: 'absolute', top: 38, left: 60,
          width: 180, height: 12,
          backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 6,
          borderWidth: 1, borderColor: 'rgba(68,23,0,0.8)',
        }}>
          <View style={{
            width: `${(hp / maxHp) * 100}%`,
            height: '100%', backgroundColor: 'rgba(144,4,4,0.5)', borderRadius: 5,
          }} />
        </View>
        <Text style={{
          position: 'absolute', top: 35, left: 50, width: 200,
          color: 'rgba(255,255,255,0.5)', fontSize: 10,
          fontFamily: 'ChakraPetch_400Regular', textAlign: 'center',
        }}>
          {hp}/{maxHp}
        </Text>
      </View>

      {enemy && (
        <View style={{
          flexDirection: 'row', gap: 14, alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 12,
          paddingHorizontal: 14, paddingVertical: 6,
          borderWidth: 1, borderColor: 'rgba(68,23,0,0.6)',
        }}>
          <EnemyStatItem
            icon={require('../../../assets/images/players/iBlock.png')}
            value={`${enemy.block ?? 0}`}
          />
          {enemy.maxEnergy != null && (
            <EnemyStatItem
              icon={require('../../../assets/images/players/iEnergy.png')}
              value={`${enemy.maxEnergy}`}
            />
          )}
          {enemy.handSize != null && (
            <EnemyStatItem
              icon={require('../../../assets/images/players/iMaxHand.png')}
              value={`${enemy.handSize}`}
            />
          )}
        </View>
      )}
    </View>
  );
});

function EnemyStatItem({ icon, value }: { icon: ImageSourcePropType; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Image source={icon} style={{ width: 18, height: 18 }} resizeMode="contain" />
      <Text style={{
        color: 'rgba(255,255,255,0.85)', fontSize: 11,
        fontFamily: 'ChakraPetch_600SemiBold',
      }}>
        {value}
      </Text>
    </View>
  );
}

export default MonsterArea;
