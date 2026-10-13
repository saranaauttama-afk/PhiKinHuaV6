import {Modal,Pressable} from 'react-native';
import StatIcon from '../StatIcon';
import {QuietButton} from '../QuietChrome';
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
import GhostArt from '../GhostArt';
import EnemyHandRack from './EnemyHandRack';
import {ghostLore} from '../../../src/core/monsters/folklore';
import {paper} from '../Paper';
import RitualSurface,{chalk} from '../RitualSurface';
import InkIcon,{type InkSymbol} from '../InkIcon';
import HealthBar from '../HealthBar';
import {enemyBattleRule} from '../../../src/core/campaign/enemyRules';
import StatusStrip from './StatusStrip';
import type { StatusEffect } from '../../../src/core/types_extended';
import { palette, space, surface, tint, layer, quietUiColors } from '../../theme';

type Props = {
  monsterId: string | string[];
  enemies?:Array<{id:string;name:string;hp:number;maxHp:number;block?:number;handCount?:number;ap?:number;maxAp?:number;handSize?:number;statusEffects?:StatusEffect[]}>;
  monsterName?: string | string[];
  turnLabel?: string;
  rules?:boolean;
  helpers?:React.ReactNode;
  /** Rage is on this fight; shown as a rule until the ghost's rage status appears. */
  rage?:{startTurn:number;perTurn:number};
  /** The boss's relic: its rule works until the player's hits break it. */
  relic?:{name:string;durability:number;text:string;flavor:string;broken:boolean;stolen:number};
  /** Stable face-down slots for the single ghost: total places and which are still held. */
  handSlots?:{total:number;remaining:number[]};
  enemy?: {
    hp: number; maxHp: number; name: string;
    handCount?:number; ap?: number; block?: number; maxAp?: number; handSize?: number; drawPerTurn?:number; maxRetained?:number;
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
  rage,
  relic,
  handSlots,
  enemies,
  rules=false,
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
     <GhostArt id={actor.id} width={lane.artWidth} height={lane.artSize}/>
    </Animated.View>
    <EnemyHandRack count={actor.handCount??0} slots={actors.length===1?handSlots:undefined} ownerIndex={index} ownerCount={actors.length}/>
    <View testID={`enemy-hud-${index}`} style={{position:'absolute',top:layout.hudTop,left:lane.hudX,width:lane.hudWidth}}>
     <RitualSurface kind="quietSlate" style={{height:layout.enemyHudHeight,paddingHorizontal:actors.length>1?6:10,paddingVertical:4,gap:2}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
       <Text numberOfLines={1} style={{flex:1,fontFamily:'Prompt_600SemiBold',fontSize:actors.length>1?11:13,color:chalk}}>{ghostLore(actor.id)?.name??actor.name}</Text>
       <View style={{flex:1.2}}><HealthBar hp={actor.hp} maxHp={actor.maxHp} compact label={actor.name}/></View>
      </View>
      <View style={{flexDirection:'row',gap:actors.length>1?4:12,alignItems:'center',minHeight:24}}>
       <EnemyStatItem icon="energy" label="" value={`${actor.ap??actor.maxAp??0}`}/>
       <EnemyStatItem icon="block" label="" value={`${actor.block??0}`}/>
       <EnemyStatItem icon="hand" label="" value={`${actor.handCount??0}/${actor.handSize??0}`} detail={`ไพ่ในมือ ${actor.handCount??0} ใบ · ถือได้สูงสุด ${actor.handSize??0} ใบ\nจั่วต่อเทิร์น ${enemy?.drawPerTurn??0} ใบ · เก็บข้ามเทิร์น ${enemy?.maxRetained??0} ใบ`}/>
      </View>
     </RitualSurface>
      <View testID={`enemy-extras-${index}`} style={{height:layout.enemyExtrasHeight,flexDirection:'row',gap:4,alignItems:'center'}}>
       <View style={{flex:2}}><StatusStrip effects={actor.statusEffects} extra={[...(relic&&index===0?[{id:'boss-relic',name:relic.name,symbol:'curse',bad:!relic.broken,neutral:relic.broken,count:relic.broken?'✕':`${relic.durability}`,detail:relic.broken?`${relic.name} แตกแล้ว · กฎนี้หยุดทำงาน`:`${relic.text}\nโจมตีโดนบอสอีก ${relic.durability} ครั้ง อุปกรณ์จะแตก${relic.stolen?` · ถูกขโมยไว้ ${relic.stolen} ใบ`:''}\n${relic.flavor}`}]:[]),...(rules&&enemyBattleRule(actor.id)?[{id:'ghost-rule',...enemyBattleRule(actor.id)!,neutral:true}]:[]),...(rage&&!actor.statusEffects?.some(e=>e.id==='rage')?[{id:'rage-rule',name:'โกรธ',symbol:'strength',bad:true,detail:`ตั้งแต่เทิร์น ${rage.startTurn} ทุกหมัดของผีแรงขึ้น ${rage.perTurn} ทุกเทิร์นที่ไฟต์ยืดออกไป`}]:[])]} compact/></View>
       {index===0&&<View style={{flex:1,minWidth:0}}>{helpers}</View>}
      </View>
    </View>
   </View>;})}
  </View>;
});

function EnemyStatItem({ icon, label, value,detail }: { icon: InkSymbol; label: string; value: string;detail?:string }) {
  const [open,setOpen]=React.useState(false);
  return <><Pressable onPress={()=>setOpen(true)} accessible accessibilityRole="button" accessibilityLabel={`${icon==='block'?'เกราะ':icon==='energy'?'พลัง':'การ์ดในมือ'} ${value}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
    <StatIcon name={icon} size={20} />
    <Text style={{ color: chalk, fontSize: 11, fontFamily: 'Prompt_600SemiBold' }}>{label} {value}</Text>
  </Pressable><Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}><View style={{flex:1,justifyContent:'center',padding:24,backgroundColor:palette.scrimHeavy}}><RitualSurface kind="quietSlate" style={{padding:22,gap:14}}><Text style={{fontFamily:'Prompt_600SemiBold',color:chalk,fontSize:15}}>{detail??`${icon==='energy'?'แต้มของผี':'เกราะของผี'} ${value}`}</Text><QuietButton label="ปิด" onPress={()=>setOpen(false)}/></RitualSurface></View></Modal></>;
}

export default MonsterArea;
