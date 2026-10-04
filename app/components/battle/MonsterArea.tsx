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
import StatusStrip from './StatusStrip';
import type { EnemyIntent } from '../../../src/core/types';
import type { StatusEffect } from '../../../src/core/types_extended';
import { palette, space, surface, tint } from '../../theme';

type Props = {
  monsterId: string | string[];
  monsterName?: string | string[];
  intent?: EnemyIntent;
  enemy?: {
    hp: number; maxHp: number; name: string;
    block?: number; maxEnergy?: number; handSize?: number;
    statusEffects?: StatusEffect[];
  } | null;
};

export type MonsterAreaHandle = {
  shake: () => void;
};

const MonsterArea = React.forwardRef<MonsterAreaHandle, Props>(function MonsterArea({
  monsterId,
  monsterName,
  enemy, intent,
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

      {intent && (
        <View style={{ backgroundColor: surface.panel, borderColor: palette.lineStrong, borderWidth: 2, padding: 8, maxWidth: 310 }}>
          <Text style={{ color: palette.moon, fontFamily: 'Prompt_600SemiBold', fontSize: 13 }}>ท่าถัดไป: {intent.damage > 0 ? `โจมตี ${intent.damage}` : 'ร่ายวิชา'}{intent.block > 0 ? ` · กัน ${intent.block}` : ''}</Text>
          <Text style={{ color: palette.textDim, fontFamily: 'Prompt_400Regular', fontSize: 10 }}>แรงโจมตีก่อนหักเกราะ · สถานะและกับดักอาจเปลี่ยนผล</Text>
        </View>
      )}
      <View style={{ width: 250, backgroundColor: surface.panel, borderWidth: 3, borderColor: palette.ink, padding: 8, marginTop: 6 }}>
        <Text style={{ color: palette.text, fontFamily: 'Prompt_600SemiBold', fontSize: 14, textAlign: 'center' }}>{displayName} · {hp}/{maxHp}</Text>
        <View style={{ height: 7, backgroundColor: palette.ink, marginTop: 4 }}>
          <View style={{ width: `${Math.max(0, hp / maxHp) * 100}%`, height: '100%', backgroundColor: palette.blood }} />
        </View>
      </View>

      {/* ไม่มีป้ายบอกท่าล่วงหน้าแล้ว — ศัตรูตัดสินใจตอนถึงตาของตัวเอง
          ผู้เล่นรู้ว่าโดนอะไรตอนที่โดนจริง

          แต่สถานะที่ติดตัวศัตรูอยู่ต้องเห็น — พิษที่เราใส่ไว้จะทำงานอีกกี่เทิร์น
          คือข้อมูลที่ตัดสินว่าเทิร์นนี้ควรตีต่อหรือควรตั้งการ์ด
          prop `statusEffects` ประกาศค้างอยู่ตรงนี้มานานแล้วโดยไม่เคยถูกใช้ */}
      <View style={{ marginTop: space.sm, marginBottom: space.xs }}>
        <StatusStrip effects={enemy?.statusEffects} compact />
      </View>

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
