import React from 'react';
import {Image,View} from 'react-native';
import Animated,{useSharedValue,useAnimatedStyle,withTiming,withDelay} from 'react-native-reanimated';
import {useBattleLayout} from './battleLayout';
import {useGameSettings} from '../Settings';
import {layer} from '../../theme';

function BackCard({index,reduced}:{index:number;reduced:boolean}){
 const enter=useSharedValue(reduced?1:0);
 React.useEffect(()=>{enter.value=reduced?1:withDelay(index*55,withTiming(1,{duration:350}));},[reduced]);
 const style=useAnimatedStyle(()=>({opacity:.45+.55*enter.value,transform:[{translateY:-18*(1-enter.value)},{rotate:`${-8*(1-enter.value)}deg`}]}));
 return <Animated.View testID={`enemy-held-${index}`} style={[{width:24,height:34},style]}><Image accessible={false} source={require('../../../assets/ui/occupation-page.png')} resizeMode="stretch" style={{position:'absolute',width:24,height:34}}/><Image accessible={false} source={require('../../../assets/ui/trail-ghost.png')} resizeMode="contain" style={{width:18,height:26,margin:3}}/></Animated.View>;
}
export default function EnemyHandRack({count}:{count:number}){
 const layout=useBattleLayout(),reduced=useGameSettings(s=>s.reducedMotion);
 return <View testID="enemy-held-hand" accessible accessibilityLabel={`ไพ่คว่ำในมือผี ${count} ใบ`} pointerEvents="none" style={{position:'absolute',top:layout.enemyHandCenterY-17,left:0,right:0,height:34,flexDirection:'row',gap:4,justifyContent:'center',zIndex:layer.control}}>{Array.from({length:count},(_,i)=><BackCard key={i} index={i} reduced={reduced}/>)}</View>;
}
