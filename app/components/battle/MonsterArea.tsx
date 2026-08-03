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
import { useBattleLayout } from './battleLayout';
import Art from '../Art';
import { palette, surface, tint } from '../../theme';

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
  const id     = Array.isArray(monsterId)   ? monsterId[0]   : monsterId;
  const name   = Array.isArray(monsterName) ? monsterName[0] : monsterName;
  // ขนาด/ตำแหน่งของภาพผีมาจากไฟล์เดียวกับที่การ์ดศัตรูใช้อ้างอิง
  // เปลี่ยนขนาดที่นี่แล้วการ์ดจะขยับตามเอง (ดู battleLayout.ts)
  const layout = useBattleLayout();

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

  const displayName  = enemy?.name ?? name ?? 'Unknown';
  const hp           = enemy?.hp    ?? 20;
  const maxHp        = enemy?.maxHp ?? 20;

  return (
    <View style={{ flex: 1, paddingTop: layout.monsterTop, alignItems: 'center' }}>
      <Animated.View style={floatStyle}>
        {/* ผีตัวไหนยังไม่มีรูป จะได้กรอบ placeholder ที่บอกชื่อและโจทย์ภาพแทน */}
        <Art slot={`monster/${id}`} width={layout.monsterSize} height={layout.monsterSize} />
      </Animated.View>

      <View style={{ marginBottom: -8 }}>
        <Image
          source={require('../../../assets/images/badgeMonster.png')}
          style={{ width: 300, height: 80 }}
          resizeMode="contain"
        />
        <Text style={{
          position: 'absolute', top: 20, left: 60,
          color: palette.textFaint, fontSize: 12,
          fontFamily: 'Prompt_400Regular',
        }}>
          {displayName}
        </Text>
        <View style={{
          position: 'absolute', top: 38, left: 60,
          width: 180, height: 12,
          backgroundColor: surface.glassDim, borderRadius: 6,
          borderWidth: 1, borderColor: palette.line,
        }}>
          <View style={{
            width: `${(hp / maxHp) * 100}%`,
            height: '100%', backgroundColor: palette.bloodDeep, borderRadius: 5,
          }} />
        </View>
        <Text style={{
          position: 'absolute', top: 35, left: 50, width: 200,
          color: palette.textFaint, fontSize: 10,
          fontFamily: 'Prompt_400Regular', textAlign: 'center',
        }}>
          {hp}/{maxHp}
        </Text>
      </View>

      {/* ไม่มีป้ายบอกท่าล่วงหน้าแล้ว — ศัตรูตัดสินใจตอนถึงตาของตัวเอง
          ผู้เล่นรู้ว่าโดนอะไรตอนที่โดนจริง */}

      {enemy && (
        <View style={{
          flexDirection: 'row', gap: 14, alignItems: 'center',
          backgroundColor: surface.glassDim, borderRadius: 12,
          paddingHorizontal: 14, paddingVertical: 6,
          borderWidth: 1, borderColor: palette.line,
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
        color: palette.text, fontSize: 11,
        fontFamily: 'Prompt_600SemiBold',
      }}>
        {value}
      </Text>
    </View>
  );
}

export default MonsterArea;
