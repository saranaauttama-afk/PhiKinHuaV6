import React from 'react';
import {StyleSheet,View} from 'react-native';
import Animated,{useAnimatedStyle} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import GhostArt from '../GhostArt';
import {useBattleLayout} from '../battle/battleLayout';
import {paperPlacement} from '../../../src/visual/paperPlacement';
import {characterPlacement} from '../../../src/visual/paperEnvironments';
import {paperProjection} from '../../../src/visual/paperDiorama';
import {paperDioramaColors as ink} from '../../theme';
import type {TheaterMotion} from './SceneTheater';
/** One authored contact anchor per scene plus an independent character mode. */
function PaperActor({id,motion,onReady}:{id:string;motion:TheaterMotion;onReady:()=>void}){
 const layout=useBattleLayout(),safe=useSafeAreaInsets();
 const placement=paperPlacement(layout.screenW,layout.screenH,safe.top,safe.bottom,characterPlacement(motion.sceneId,id),layout.hudTop-8);
 const style=useAnimatedStyle(()=>{const p=paperProjection('ghost',motion.assembly.value,motion.x.value,motion.y.value);return {opacity:p.opacity,transform:[{translateX:p.translateX},{translateY:p.translateY}]};});
 const props={id,width:placement.actor.width,height:placement.actor.height,fadeDuration:0};
 return <>
  <Animated.View testID="theater-contact-shadow" style={[{position:'absolute',...placement.shadow},style]}><View style={{flex:1,backgroundColor:ink.ghostShadow,borderRadius:100}}/></Animated.View>
  <Animated.View renderToHardwareTextureAndroid shouldRasterizeIOS testID="theater-character" style={[{position:'absolute',...placement.actor},style]}>
   <View style={[StyleSheet.absoluteFill,{transform:[{translateX:4},{translateY:6}],opacity:.6}]}><GhostArt {...props} paperTint={ink.ghostShadow}/></View>
   {[[-1,-1],[1,1]].map(([x,y],i)=><View key={i} style={[StyleSheet.absoluteFill,{transform:[{translateX:x},{translateY:y}]}]}><GhostArt {...props} paperTint={ink.edge}/></View>)}
   <GhostArt {...props} onLoad={onReady}/>
  </Animated.View>
 </>;
}

export default React.memo(PaperActor);
