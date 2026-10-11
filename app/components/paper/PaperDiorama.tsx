import React from 'react';
import {Image, ImageSourcePropType, Platform, StyleSheet, View} from 'react-native';
import Animated, {SharedValue, useAnimatedStyle} from 'react-native-reanimated';
import {PAPER_GHOST_ID, PAPER_LAYERS, PaperLayerId, paperProjection} from '../../../src/visual/paperDiorama';
import {enemyLane} from '../../battleGeometry';
import {useBattleLayout} from '../battle/battleLayout';
import GhostArt from '../GhostArt';
import {paperDioramaColors as ink} from '../../theme';

const sources = {
  sky: require('../../../assets/scence/paper-diorama-v1/sky.png'),
  forest: require('../../../assets/scence/paper-diorama-v1/forest.png'),
  village: require('../../../assets/scence/paper-diorama-v1/village-v2.png'),
  foliage: require('../../../assets/scence/paper-diorama-v1/foliage.png'),
};
type Motion = {camera: SharedValue<number>; x: SharedValue<number>; y: SharedValue<number>};
const webPlaneStyle = Platform.OS==='web'?{willChange:'transform'}:{};
function useLayer(id: PaperLayerId, motion: Motion) {
  return useAnimatedStyle(() => {
    const p = paperProjection(id, motion.camera.value, motion.x.value, motion.y.value);
    return {...webPlaneStyle,transform: [{translateX: p.translateX}, {translateY: p.translateY}, {scale: p.scale}]};
  });
}
function BackLayer({id, source, motion, baseY=0}: {id: Exclude<PaperLayerId, 'ghost'>; source: ImageSourcePropType; motion: Motion; baseY?:number}) {
  const style = useLayer(id, motion), offset = PAPER_LAYERS[id].shadow;
  return <Animated.View testID={`paper-layer-${id}`} style={[styles.overscan, {top:-16+baseY,bottom:-16-baseY},style]}>
    {offset > 0 && <Image accessible={false} source={source} resizeMode="stretch" style={[styles.plane, {tintColor:ink.shadow, opacity:0.55, transform:[{translateX:offset},{translateY:offset*1.3}]}]}/>}
    <Image accessible={false} source={source} resizeMode="stretch" style={styles.plane}/>
  </Animated.View>;
}
/** Each original bitmap moves independently; screen UI is a separate sibling. */
export default function PaperDiorama(motion: Motion) {
  const layout = useBattleLayout(), lane = enemyLane(layout), ghostStyle = useLayer('ghost', motion);
  // Register the printed lane's horizon to the approved battle foot line on
  // short and tall phones, rather than moving any HUD or stretching the art.
  const groundShift = layout.hudTop - 12 - layout.screenH * 0.57;
  return <View pointerEvents="none" testID="paper-world" style={[StyleSheet.absoluteFill, {overflow:'hidden', backgroundColor:ink.backing}]}>
    <BackLayer id="sky" source={sources.sky} motion={motion}/>
    <BackLayer id="forest" source={sources.forest} motion={motion}/>
    <View style={{position:'absolute',top:layout.hudTop-12,left:0,right:0,bottom:0,backgroundColor:ink.floor}}/>
    <BackLayer id="village" source={sources.village} motion={motion} baseY={groundShift}/>
    <Animated.View testID="paper-layer-ghost" style={[{position:'absolute',top:layout.monsterTop,left:lane.artX,width:lane.artWidth,height:lane.artSize},ghostStyle]}>
      <View style={[StyleSheet.absoluteFill,{transform:[{translateX:7},{translateY:9}],opacity:0.65}]}><GhostArt id={PAPER_GHOST_ID} width={lane.artWidth} height={lane.artSize} paperTint={ink.ghostShadow}/></View>
      {[[-1.3,-1.3],[1.3,1.3]].map(([x,y],i)=><View key={i} style={[StyleSheet.absoluteFill,{transform:[{translateX:x},{translateY:y}]}]}><GhostArt id={PAPER_GHOST_ID} width={lane.artWidth} height={lane.artSize} paperTint={ink.edge}/></View>)}
      <GhostArt id={PAPER_GHOST_ID} width={lane.artWidth} height={lane.artSize}/>
    </Animated.View>
    <BackLayer id="foliage" source={sources.foliage} motion={motion} baseY={-layout.screenH*0.14}/>
  </View>;
}
const styles = StyleSheet.create({overscan:{position:'absolute',top:-16,left:-16,right:-16,bottom:-16},plane:{...StyleSheet.absoluteFillObject,width:'100%',height:'100%'}});
