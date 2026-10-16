import {Modal,Pressable} from 'react-native';
import StatIcon from '../StatIcon';
import {QuietButton} from '../QuietChrome';
import React, { useImperativeHandle } from 'react';
import { View, Text, Image, ImageSourcePropType } from 'react-native';
import DeltaPopup from './DeltaPopup';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {enemyLane} from '../../battleGeometry';
import { useBattleLayout } from './battleLayout';
import GhostArt from '../GhostArt';
import AshPuff from './AshPuff';
import {useGameSettings} from '../Settings';
import EnemyHandRack from './EnemyHandRack';
import {ghostLore} from '../../../src/core/monsters/folklore';
import {paper} from '../Paper';
import RitualSurface,{chalk} from '../RitualSurface';
import InkIcon,{type InkSymbol} from '../InkIcon';
import HealthBar from '../HealthBar';
import {enemyBattleRule} from '../../../src/core/campaign/enemyRules';
import StatusStrip from './StatusStrip';
import type { StatusEffect } from '../../../src/core/types_extended';
import { palette, space, surface, tint, layer, quietUiColors, combatUiColors } from '../../theme';

type Props = {
  /** Ghost block lost to our hit (DeltaPopup on its block icon). */
  blockDelta?: import('./DeltaPopup').Delta | null;
  monsterId: string | string[];
  enemies?:Array<{id:string;name:string;hp:number;maxHp:number;block?:number;handCount?:number;ap?:number;maxAp?:number;handSize?:number;statusEffects?:StatusEffect[]}>;
  monsterName?: string | string[];
  turnLabel?: string;
  rules?:boolean;
  helpers?:React.ReactNode;
  /** Rage is on this fight; shown as a rule until the ghost's rage status appears. */
  rage?:{startTurn:number;perTurn:number};
  /** Extra ghost badges: ความลึก, ชาร์จ, ผีรอสวน (combat/fightBadges.ts). ลูกสมุน stand as figures (MinionRow side="enemy"). */
  minions?:import('./StatusStrip').BattleBadge[];
  /** The boss's relic: its rule works until the player's hits break it. */
  relic?:{name:string;durability:number;text:string;flavor:string;broken:boolean;stolen:number};
  /** Stable face-down slots for the single ghost: total places and which are still held. */
  handSlots?:{total:number;remaining:number[]};
  /** ชาร์จ count per held card (null = not a charge card), from ghostMechanics.enemyHandCharges. */
  handCharges?:Array<number|null>;
  /** Ghost badges that just changed a hit (shake). */
  pulse?:{ids:string[];key:string};
  enemy?: {
    hp: number; maxHp: number; name: string;
    handCount?:number; ap?: number; block?: number; maxAp?: number; handSize?: number; drawPerTurn?:number; maxRetained?:number;
    drawCadence?:{extra:number;every:number};
    statusEffects?: StatusEffect[];
  } | null;
};

export type MonsterAreaHandle = {
  shake: () => void;
  /** Killing blow: a short shudder, then the ghost sinks and fades (owner playtest 16 Oct 2026). */
  die: (speed?:number) => void;
  /** Beaten but still talking (ghost talk after a win): shudder, sag a little and dim. */
  defeat: (speed?:number) => void;
};

const MonsterArea = React.forwardRef<MonsterAreaHandle, Props>(function MonsterArea({
  monsterId,
  monsterName,
  enemy,
  turnLabel,
  helpers,
  rage,
  relic,minions,
  handSlots,handCharges,pulse,
  enemies,
  rules=false,
  blockDelta,
}, ref) {
  const id     = Array.isArray(monsterId)   ? monsterId[0]   : monsterId;
  const name   = Array.isArray(monsterName) ? monsterName[0] : monsterName;
  // ขนาด/ตำแหน่งของภาพผีมาจากไฟล์เดียวกับที่การ์ดศัตรูใช้อ้างอิง
  // เปลี่ยนขนาดที่นี่แล้วการ์ดจะขยับตามเอง (ดู battleLayout.ts)
  const layout = useBattleLayout();
  const safe = useSafeAreaInsets();

  const figures=React.useRef(new Map<number,MonsterAreaHandle>());
  useImperativeHandle(ref,()=>({
    shake:()=>figures.current.get(0)?.shake(),
    die:(speed)=>actors.forEach((actor,i)=>{if(actor.hp<=0)figures.current.get(i)?.die(speed);}),
    defeat:(speed)=>figures.current.get(0)?.defeat(speed),
  }));
  const actors=enemies?.length?enemies:[{id,name:ghostLore(id)?.name??enemy?.name??name??'ผี',hp:enemy?.hp??20,maxHp:enemy?.maxHp??20,...enemy}];
  return <View pointerEvents="box-none" style={{flex:1}}>
   {actors.map((actor,index)=>{const lane=enemyLane(layout,index,actors.length);return <View key={actor.id} pointerEvents="box-none" style={{position:'absolute',top:0,left:0,right:0,bottom:0}}>
    <GhostFigure ref={handle=>{if(handle)figures.current.set(index,handle);else figures.current.delete(index);}} id={actor.id} index={index} width={lane.artWidth} height={lane.artSize} top={layout.monsterTop} left={lane.artX}/>
    <EnemyHandRack count={actor.handCount??0} slots={actors.length===1?handSlots:undefined} charges={actors.length===1?handCharges:undefined} ownerIndex={index} ownerCount={actors.length}/>
    <View testID={`enemy-hud-${index}`} style={{position:'absolute',top:layout.hudTop,left:lane.hudX,width:lane.hudWidth}}>
     <RitualSurface kind="quietSlate" style={{height:layout.enemyHudHeight,paddingHorizontal:actors.length>1?6:10,paddingVertical:4,gap:2}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
       <Text numberOfLines={1} style={{flex:1,fontFamily:'Prompt_600SemiBold',fontSize:actors.length>1?11:13,color:chalk}}>{ghostLore(actor.id)?.name??actor.name}</Text>
       <View style={{flex:1.2}}><HealthBar hp={actor.hp} maxHp={actor.maxHp} compact label={actor.name}/></View>
      </View>
      <View style={{flexDirection:'row',gap:actors.length>1?4:12,alignItems:'center',minHeight:24}}>
       <EnemyStatItem icon="energy" label="" value={`${actor.ap??actor.maxAp??0}`}/>
       <EnemyStatItem icon="block" label="" value={`${actor.block??0}`} delta={index===0?blockDelta:undefined}/>
       <EnemyStatItem icon="hand" label="" value={`${actor.handCount??0}/${actor.handSize??0}`} detail={`ไพ่ในมือ ${actor.handCount??0} ใบ · ถือได้สูงสุด ${actor.handSize??0} ใบ\nจั่วต่อเทิร์น ${enemy?.drawPerTurn??0} ใบ · เก็บข้ามเทิร์น ${enemy?.maxRetained??0} ใบ${enemy?.drawCadence?`\nทุก ${enemy.drawCadence.every} เทิร์นผี จั่วเพิ่ม ${enemy.drawCadence.extra} ใบ เท่าที่มือว่าง`:''}`}/>
      </View>
     </RitualSurface>
      <View testID={`enemy-extras-${index}`} style={{height:layout.enemyExtrasHeight,flexDirection:'row',gap:4,alignItems:'center'}}>
       <View style={{flex:2}}><StatusStrip effects={actor.statusEffects} extra={[...(index===0?minions??[]:[]),...(relic&&index===0?[{id:'boss-relic',name:relic.name,symbol:'curse',bad:!relic.broken,neutral:relic.broken,count:relic.broken?'✕':`${relic.durability}`,detail:relic.broken?`${relic.name} แตกแล้ว · กฎนี้หยุดทำงาน`:`${relic.text}\nโจมตีโดนบอสอีก ${relic.durability} ครั้ง ${relic.name}จะแตก${relic.stolen?` · ถูกขโมยไว้ ${relic.stolen} ใบ`:''}\n${relic.flavor}`}]:[]),...(rules&&enemyBattleRule(actor.id)?[{id:'ghost-rule',...enemyBattleRule(actor.id)!,neutral:true}]:[]),...(rage&&!actor.statusEffects?.some(e=>e.id==='rage')?[{id:'rage-rule',name:'โกรธ',symbol:'strength',bad:true,detail:`ตั้งแต่เทิร์น ${rage.startTurn} ทุกหมัดของผีแรงขึ้น ${rage.perTurn} ทุกเทิร์นที่ไฟต์ยืดออกไป`}]:[])]} compact side="enemy" pulse={index===0?pulse:undefined}/></View>
       {index===0&&<View style={{flex:1,minWidth:0}}>{helpers}</View>}
      </View>
    </View>
   </View>;})}
  </View>;
});

function EnemyStatItem({ icon, label, value,detail,delta }: { icon: InkSymbol; label: string; value: string;detail?:string;delta?:import('./DeltaPopup').Delta|null }) {
  const [open,setOpen]=React.useState(false);
  return <><Pressable onPress={()=>setOpen(true)} accessible accessibilityRole="button" accessibilityLabel={`${icon==='block'?'เกราะ':icon==='energy'?'พลัง':'การ์ดในมือ'} ${value}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
    <StatIcon name={icon} size={20} />
    <Text style={{ color: chalk, fontSize: 11, fontFamily: 'Prompt_600SemiBold' }}>{label} {value}</Text>
    <DeltaPopup delta={delta}/>
  </Pressable><Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}><View style={{flex:1,justifyContent:'center',padding:24,backgroundColor:palette.scrimHeavy}}><RitualSurface kind="quietSlate" style={{padding:22,gap:14}}><Text style={{fontFamily:'Prompt_600SemiBold',color:chalk,fontSize:15}}>{detail??`${icon==='energy'?'แต้มของผี':'เกราะของผี'} ${value}`}</Text><QuietButton label="ปิด" onPress={()=>setOpen(false)}/></RitualSurface></View></Modal></>;
}

export default MonsterArea;

const GhostFigure=React.forwardRef<MonsterAreaHandle,{id:string;index:number;width:number;height:number;top:number;left:number}>(function GhostFigure({id,index,width,height,top,left},ref){
  const died=React.useRef(false),deathSpeed=React.useRef(1);
  const [death,setDeath]=React.useState(0);
  const reduced=useGameSettings(s=>s.reducedMotion);
  const hit=useSharedValue(0);
  const hitStyle=useAnimatedStyle(()=>({opacity:hit.value}));
  const monsterY      = useSharedValue(0);
  const monsterX      = useSharedValue(0);
  const monsterShakeX = useSharedValue(0);
  const monsterFall   = useSharedValue(0);
  const monsterFade   = useSharedValue(1);

  React.useEffect(() => {
    if(reduced){monsterY.value=0;monsterX.value=0;return;}
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
  }, [reduced]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: monsterX.value + monsterShakeX.value },
      { translateY: monsterY.value + monsterFall.value },
    ] as any,
    opacity: monsterFade.value,
  }));

  React.useEffect(()=>{
    if(reduced){cancelAnimation(monsterShakeX);cancelAnimation(monsterFall);cancelAnimation(hit);monsterShakeX.value=0;monsterFall.value=0;hit.value=0;}
    return ()=>{cancelAnimation(monsterShakeX);cancelAnimation(monsterFall);cancelAnimation(monsterFade);cancelAnimation(hit);};
  },[reduced]);
  // A new ghost (next fight, or the screen reused) starts standing.
  React.useEffect(() => { died.current=false;setDeath(0);monsterFall.value = 0; monsterFade.value = 1; }, [id]);

  useImperativeHandle(ref, () => ({
    shake() {
      if(reduced)return;
      hit.value=withSequence(withTiming(.85,{duration:40}),withTiming(0,{duration:180}));
      monsterShakeX.value = withSequence(
        withTiming(10,  { duration: 60 }),
        withTiming(-10, { duration: 60 }),
        withTiming(8,   { duration: 60 }),
        withTiming(-8,  { duration: 60 }),
        withTiming(0,   { duration: 60 })
      );
    },
    defeat(speed=1) {
      if(reduced){monsterFade.value=withTiming(.6,{duration:100/speed});return;}
      monsterShakeX.value = withSequence(
        withTiming(6,  { duration: 50/speed }), withTiming(-6, { duration: 50/speed }),
        withTiming(4,  { duration: 50/speed }), withTiming(0,  { duration: 50/speed })
      );
      monsterFall.value = withDelay(200/speed, withTiming(14, { duration: 500/speed, easing: Easing.out(Easing.quad) }));
      monsterFade.value = withDelay(200/speed, withTiming(0.6, { duration: 500/speed }));
    },
    die(speed=1) {
      if(died.current)return;died.current=true;
      if(reduced){monsterFade.value=withTiming(0,{duration:100/speed});return;}
      deathSpeed.current=speed;setDeath(n=>n+1);
      hit.value=withSequence(withTiming(.85,{duration:40/speed}),withTiming(0,{duration:180/speed}));
      monsterShakeX.value = withSequence(
        withTiming(6,  { duration: 50/speed }), withTiming(-6, { duration: 50/speed }),
        withTiming(5,  { duration: 50/speed }), withTiming(-5, { duration: 50/speed }),
        withTiming(3,  { duration: 50/speed }), withTiming(0,  { duration: 50/speed })
      );
      monsterFall.value = withDelay(300/speed, withTiming(70, { duration: 650/speed, easing: Easing.in(Easing.quad) }));
      monsterFade.value = withDelay(300/speed, withTiming(0, { duration: 650/speed }));
    },
  }));

  return <View pointerEvents="none" style={{position:'absolute',top,left,width,height}}>
    <Animated.View pointerEvents="none" testID={`enemy-art-${index}`} style={floatStyle}>
      <GhostArt id={id} width={width} height={height}/>
      <Animated.View pointerEvents="none" style={[{position:'absolute',inset:0},hitStyle]}><GhostArt id={id} width={width} height={height} silhouette tint={combatUiColors.hitFlash}/></Animated.View>
    </Animated.View>
    {death>0&&!reduced&&<View pointerEvents="none" style={{position:'absolute',left:(width-Math.min(width,height))/2,bottom:0,width:Math.min(width,height),height:Math.min(width,height)}}><AshPuff key={death} size={Math.min(width,height)} duration={1000/deathSpeed.current}/></View>}
  </View>;
});
