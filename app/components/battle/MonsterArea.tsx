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
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { useBattleLayout } from './battleLayout';
import Art from '../Art';
import {paper} from '../Paper';
import RitualSurface,{chalk} from '../RitualSurface';
import InkIcon,{type InkSymbol} from '../InkIcon';
import HealthBar from '../HealthBar';
import StatusStrip from './StatusStrip';
import type { StatusEffect } from '../../../src/core/types_extended';
import { palette, space, surface, tint } from '../../theme';

type Props = {
  monsterId: string | string[];
  monsterName?: string | string[];
  turnLabel?: string;
  helpers?:React.ReactNode;
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
  enemy,
  turnLabel,
  helpers,
}, ref) {
  const id     = Array.isArray(monsterId)   ? monsterId[0]   : monsterId;
  const name   = Array.isArray(monsterName) ? monsterName[0] : monsterName;
  // ขนาด/ตำแหน่งของภาพผีมาจากไฟล์เดียวกับที่การ์ดศัตรูใช้อ้างอิง
  // เปลี่ยนขนาดที่นี่แล้วการ์ดจะขยับตามเอง (ดู battleLayout.ts)
  const layout = useBattleLayout();
  const safe = useSafeAreaInsets();

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
    <View pointerEvents="box-none" style={{ flex: 1, paddingTop: layout.monsterTop, alignItems: 'center' }}>
      <RitualSurface kind="wood" style={{position:'absolute',top:safe.top+8,left:20,right:112,paddingHorizontal:15,paddingVertical:10}}><HealthBar hp={hp} maxHp={maxHp} label={displayName} dark/><View style={{flexDirection:'row',justifyContent:'space-between',gap:6,marginTop:5}}><Text style={{color:chalk,fontFamily:'Prompt_600SemiBold',fontSize:11}}>เกราะ {enemy?.block ?? 0}</Text><Text numberOfLines={1} style={{color:chalk,fontFamily:'Prompt_600SemiBold',fontSize:11,flexShrink:1}}>{turnLabel}</Text></View><StatusStrip effects={enemy?.statusEffects} compact />{helpers}</RitualSurface>
      <Animated.View style={floatStyle}>
        {/* ผีตัวไหนยังไม่มีรูป จะได้กรอบ placeholder ที่บอกชื่อและโจทย์ภาพแทน */}
        <Art slot={`monster/${id}`} width={layout.monsterSize} height={layout.monsterSize} />
      </Animated.View>


    </View>
  );
});

function EnemyStatItem({ icon, label, value }: { icon: InkSymbol; label: string; value: string }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
    <InkIcon name={icon} size={20} color={chalk} />
    <Text style={{ color: chalk, fontSize: 11, fontFamily: 'Prompt_600SemiBold' }}>{label} {value}</Text>
  </View>;
}

export default MonsterArea;
