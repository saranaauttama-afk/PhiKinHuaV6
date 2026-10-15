import React from 'react';
import {Image,Text,View} from 'react-native';
import Animated,{useSharedValue,useAnimatedStyle,withTiming,withDelay,withRepeat,withSequence} from 'react-native-reanimated';
import {useBattleLayout} from './battleLayout';
import {useGameSettings} from '../Settings';
import {font,ghostColors,layer} from '../../theme';
import {enemyHandGeometry} from '../../battleGeometry';
import {GHOST_MECHANICS} from '../../../src/core/balance/notfm';
import {chargeCountdown} from '../../../src/core/combat/ghostMechanics';

/**
 * One face-down card in the ghost's hand. `charge` (ชาร์จ, docs/ghosts/NIGHT1-DESIGN.md): a held
 * charge card glows and counts down the turns until it is full (owner playtest 15 Oct 2026: a
 * countdown reads better than a count up); "!" = full, it can land any time.
 * The player sees that something heavy waits and how soon it peaks, not what it is.
 */
function BackCard({index,reduced,width,height,prefix,charge}:{index:number;reduced:boolean;width:number;height:number;prefix:string;charge?:number|null}){
 const enter=useSharedValue(reduced?1:0),pulse=useSharedValue(0);
 React.useEffect(()=>{enter.value=reduced?1:withDelay(index*55,withTiming(1,{duration:350}));},[reduced]);
 const charging=charge!=null;
 React.useEffect(()=>{pulse.value=charging&&!reduced?withRepeat(withSequence(withTiming(1,{duration:700}),withTiming(0,{duration:700})),-1):0;},[charging,reduced]);
 const style=useAnimatedStyle(()=>({opacity:.45+.55*enter.value,transform:[{translateY:-18*(1-enter.value)},{rotate:`${-8*(1-enter.value)}deg`}]}));
 const full=(charge??0)>=GHOST_MECHANICS.chargeMaxTurns;
 const glow=useAnimatedStyle(()=>({opacity:(full?.75:.35)+.25*pulse.value}));
 return <Animated.View testID={`${prefix}-${index}`} style={[{width,height},style]}>
  {charging&&<Animated.View pointerEvents="none" style={[{position:'absolute',left:-3,top:-3,right:-3,bottom:-3,borderRadius:6,borderWidth:2,borderColor:ghostColors.charge,backgroundColor:ghostColors.chargeGlow},glow]}/>}
  <Image accessible={false} source={require('../../../assets/ui/occupation-page.png')} resizeMode="stretch" style={{position:'absolute',width,height}}/>
  <Image accessible={false} source={require('../../../assets/ui/trail-ghost.png')} resizeMode="contain" style={{width:width*.75,height:height*.76,margin:width*.125}}/>
  {charging&&<View testID={`${prefix}-charge-${index}`} style={{position:'absolute',top:-8,alignSelf:'center',minWidth:18,height:18,borderRadius:9,paddingHorizontal:3,alignItems:'center',justifyContent:'center',backgroundColor:ghostColors.chargePlate,borderWidth:1,borderColor:ghostColors.charge}}>
   <Text style={{fontFamily:font.heading,fontSize:11,lineHeight:14,color:ghostColors.chargeText}}>{full?'!':chargeCountdown(charge??0)}</Text>
  </View>}
 </Animated.View>;
}
/**
 * `charges[i]` is the charge count of hand card i (null for a normal card). It is only drawn when it
 * matches the cards on screen, so a mid-animation frame never puts a number on the wrong back.
 */
export default function EnemyHandRack({count,ownerIndex=0,ownerCount=1,slots:held,charges}:{count:number;ownerIndex?:number;ownerCount?:number;slots?:{total:number;remaining:number[]};charges?:Array<number|null>}){
 // With `held`, lay out the turn's full set of places and leave played ones empty, so nothing slides.
 const useHeld=!!held&&held.remaining.length===count;
 const places=useHeld?held!.total:count,shown=new Set(useHeld?held!.remaining:Array.from({length:count},(_,i)=>i));
 const layout=useBattleLayout(),reduced=useGameSettings(s=>s.reducedMotion),slots=enemyHandGeometry(layout,places,ownerIndex,ownerCount);
 const prefix=ownerCount===1?'enemy-held':`enemy-${ownerIndex}-held`;
 const chargeAt=(slot:number)=>{if(!charges||charges.length!==count)return null;const k=useHeld?held!.remaining.indexOf(slot):slot;return k<0?null:charges[k]??null;};
 const charging=charges&&charges.length===count?charges.filter(x=>x!=null).length:0;
 return <View testID={ownerCount===1?'enemy-held-hand':`enemy-held-hand-${ownerIndex}`} accessible accessibilityLabel={`ไพ่คว่ำในมือผี ${count} ใบ${charging?` · กำลังชาร์จ ${charging} ใบ`:''}`} pointerEvents="none" style={{position:'absolute',top:slots.top,left:slots.left,width:slots.width,height:slots.height,flexDirection:'row',gap:4,alignItems:'center',justifyContent:'center',zIndex:layer.control}}>{Array.from({length:places},(_,i)=>shown.has(i)?<BackCard key={i} index={i} reduced={reduced} width={slots.cardW} height={slots.cardH} prefix={prefix} charge={chargeAt(i)}/>:<View key={i} style={{width:slots.cardW,height:slots.cardH}}/>)}</View>;
}
