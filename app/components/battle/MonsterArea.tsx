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
import {enemyLane} from '../../battleGeometry';
import { useBattleLayout } from './battleLayout';
import Art from '../Art';
import GhostLoreButton from '../GhostLoreButton';
import {ghostLore} from '../../../src/core/monsters/folklore';
import {paper} from '../Paper';
import RitualSurface,{chalk} from '../RitualSurface';
import InkIcon,{type InkSymbol} from '../InkIcon';
import HealthBar from '../HealthBar';
import StatusStrip from './StatusStrip';
import type { StatusEffect } from '../../../src/core/types_extended';
import { palette, space, surface, tint, layer, quietUiColors } from '../../theme';

type Props = {
  monsterId: string | string[];
  enemies?:Array<{id:string;name:string;hp:number;maxHp:number;block?:number;handCount?:number;energy?:number;maxEnergy?:number;handSize?:number;statusEffects?:StatusEffect[]}>;
  monsterName?: string | string[];
  turnLabel?: string;
  helpers?:React.ReactNode;
  escalating?:{every:number;strength:number};
  enemy?: {
    hp: number; maxHp: number; name: string;
    handCount?:number; energy?: number; block?: number; maxEnergy?: number; handSize?: number;
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
  escalating,
  enemies,
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

  const actors=enemies?.length?enemies:[{id,name:ghostLore(id)?.name??enemy?.name??name??'ผี',hp:enemy?.hp??20,maxHp:enemy?.maxHp??20,...enemy}];
  return <View pointerEvents="box-none" style={{flex:1}}>
   {actors.map((actor,index)=>{const lane=enemyLane(layout,index,actors.length);return <View key={actor.id} pointerEvents="box-none" style={{position:'absolute',top:0,left:0,right:0,bottom:0}}>
    <Animated.View pointerEvents="none" testID={`enemy-art-${index}`} style={[floatStyle,{position:'absolute',top:layout.monsterTop,left:lane.artX}]}>
     <Art slot={`monster/${actor.id}`} width={lane.artSize} height={lane.artSize}/>
    </Animated.View>
    <View testID={`enemy-hud-${index}`} style={{position:'absolute',top:layout.hudTop,left:lane.hudX,width:lane.hudWidth}}>
     <RitualSurface kind="quietSlate" style={{paddingHorizontal:actors.length>1?6:14,paddingVertical:4,gap:2}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
       <Text numberOfLines={1} style={{flex:1,fontFamily:'Prompt_600SemiBold',fontSize:actors.length>1?11:13,color:chalk}}>{ghostLore(actor.id)?.name??actor.name}</Text>
       <View style={{flex:1.2}}><HealthBar hp={actor.hp} maxHp={actor.maxHp} compact label={actor.name}/></View>
       {actors.length===1&&<GhostLoreButton compact id={actor.id}/>}
      </View>
      <View style={{flexDirection:'row',gap:actors.length>1?4:12,alignItems:'center',minHeight:24}}>
       <EnemyStatItem icon="block" label="" value={`${actor.block??0}`}/>
       <EnemyStatItem icon="energy" label="" value={`${actor.energy??actor.maxEnergy??0}`}/>
       <EnemyStatItem icon="deck" label="" value={`${actor.handCount??actor.handSize??0}`}/>
      </View>
      <View style={{flexDirection:'row',gap:6,alignItems:'center'}}>
       <View style={{flex:2}}><StatusStrip effects={actor.statusEffects} extra={escalating?[{id:'rage-rule',name:'ผีคลุ้มคลั่ง',symbol:'strength',bad:true,detail:`ทุก ${escalating.every} เทิร์น ผีได้ความแข็งแกร่งเพิ่ม ${escalating.strength} จนจบไฟต์`}]:[]} compact/></View>
       {index===0&&<View style={{flex:1}}>{helpers}</View>}
      </View>
     </RitualSurface>
    </View>
   </View>;})}
  </View>;
});

function EnemyStatItem({ icon, label, value }: { icon: InkSymbol; label: string; value: string }) {
  return <View accessible accessibilityLabel={`${icon==='block'?'เกราะ':icon==='energy'?'พลัง':'การ์ด'} ${value}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
    <InkIcon name={icon} size={20} color={chalk} />
    <Text style={{ color: chalk, fontSize: 11, fontFamily: 'Prompt_600SemiBold' }}>{label} {value}</Text>
  </View>;
}

export default MonsterArea;
