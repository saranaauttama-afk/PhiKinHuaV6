import React from 'react';
import {Image,View} from 'react-native';
import Animated,{useSharedValue,useAnimatedStyle,withTiming,withDelay} from 'react-native-reanimated';
import {useBattleLayout} from './battleLayout';
import {useGameSettings} from '../Settings';
import {layer} from '../../theme';
import {enemyHandGeometry} from '../../battleGeometry';

function BackCard({index,reduced,width,height,prefix}:{index:number;reduced:boolean;width:number;height:number;prefix:string}){
 const enter=useSharedValue(reduced?1:0);
 React.useEffect(()=>{enter.value=reduced?1:withDelay(index*55,withTiming(1,{duration:350}));},[reduced]);
 const style=useAnimatedStyle(()=>({opacity:.45+.55*enter.value,transform:[{translateY:-18*(1-enter.value)},{rotate:`${-8*(1-enter.value)}deg`}]}));
 return <Animated.View testID={`${prefix}-${index}`} style={[{width,height},style]}><Image accessible={false} source={require('../../../assets/ui/occupation-page.png')} resizeMode="stretch" style={{position:'absolute',width,height}}/><Image accessible={false} source={require('../../../assets/ui/trail-ghost.png')} resizeMode="contain" style={{width:width*.75,height:height*.76,margin:width*.125}}/></Animated.View>;
}
export default function EnemyHandRack({count,ownerIndex=0,ownerCount=1,slots:held}:{count:number;ownerIndex?:number;ownerCount?:number;slots?:{total:number;remaining:number[]}}){
 // With `held`, lay out the turn's full set of places and leave played ones empty, so nothing slides.
 const places=held&&held.remaining.length===count?held.total:count,shown=new Set(held&&held.remaining.length===count?held.remaining:Array.from({length:count},(_,i)=>i));
 const layout=useBattleLayout(),reduced=useGameSettings(s=>s.reducedMotion),slots=enemyHandGeometry(layout,places,ownerIndex,ownerCount);
 const prefix=ownerCount===1?'enemy-held':`enemy-${ownerIndex}-held`;
 return <View testID={ownerCount===1?'enemy-held-hand':`enemy-held-hand-${ownerIndex}`} accessible accessibilityLabel={`ไพ่คว่ำในมือผี ${count} ใบ`} pointerEvents="none" style={{position:'absolute',top:slots.top,left:slots.left,width:slots.width,height:slots.height,flexDirection:'row',gap:4,alignItems:'center',justifyContent:'center',zIndex:layer.control}}>{Array.from({length:places},(_,i)=>shown.has(i)?<BackCard key={i} index={i} reduced={reduced} width={slots.cardW} height={slots.cardH} prefix={prefix}/>:<View key={i} style={{width:slots.cardW,height:slots.cardH}}/>)}</View>;
}
