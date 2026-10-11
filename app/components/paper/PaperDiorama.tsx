import React from 'react';
import {Image, ImageSourcePropType, Platform, StyleSheet, View} from 'react-native';
import Animated, {SharedValue, useAnimatedStyle} from 'react-native-reanimated';
import {PAPER_GHOST_ID, PAPER_LAYERS, PaperLayerId, paperProjection} from '../../../src/visual/paperDiorama';
import {paperViewport} from '../../../src/visual/paperViewport';
import {paperPlacement, type PaperCharacterPlacement} from '../../../src/visual/paperPlacement';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useBattleLayout} from '../battle/battleLayout';
import GhostArt from '../GhostArt';
import {paperDioramaColors as ink} from '../../theme';

const sources = {
  sky: require('../../../assets/scence/paper-diorama-v1/sky.png'),
  forest: require('../../../assets/scence/paper-diorama-v1/forest.png'),
  village: require('../../../assets/scence/paper-diorama-v1/village-v2.png'),
  foliage: require('../../../assets/scence/paper-diorama-v1/foliage.png'),
};
const inkSources={sky:require('../../../assets/scence/paper-diorama-v1/sky-ink.png'),forest:require('../../../assets/scence/paper-diorama-v1/forest-ink.png'),village:require('../../../assets/scence/paper-diorama-v1/village-v2-ink.png'),foliage:require('../../../assets/scence/paper-diorama-v1/foliage-ink.png')};
type Motion = {assembly: SharedValue<number>; x: SharedValue<number>; y: SharedValue<number>;onReady?:()=>void;placement?:PaperCharacterPlacement};
const webPlaneStyle = Platform.OS==='web'?{willChange:'transform'}:{};
function useLayer(id: PaperLayerId, motion: Motion) {
  return useAnimatedStyle(() => {
    const p = paperProjection(id, motion.assembly.value, motion.x.value, motion.y.value);
    return {...webPlaneStyle,opacity:p.opacity,transform: [{translateX: p.translateX}, {translateY: p.translateY}, {scale: p.scale}]};
  });
}
type Plane={left:number;top:number;width:number;height:number};
function PaperPrint({id,source,plane,onLoad}: {id:Exclude<PaperLayerId,'ghost'>;source:ImageSourcePropType;plane:Plane;onLoad?:(key:string)=>void}){
 const offset=PAPER_LAYERS[id].shadow;
 return <View testID={`paper-print-${id}`} style={{position:'absolute',...plane}}>
  {offset>0&&<Image fadeDuration={0} accessible={false} source={source} resizeMode="stretch" style={[styles.plane,{tintColor:ink.shadow,opacity:0.55,transform:[{translateX:offset},{translateY:offset*1.3}]}]}/>}
  <Image fadeDuration={0} accessible={false} source={source} onLoad={()=>onLoad?.(id)} resizeMode="stretch" style={styles.plane}/>
  <Image fadeDuration={0} testID={`paper-ink-${id}`} accessible={false} source={inkSources[id]} onLoad={()=>onLoad?.(id+'-ink')} resizeMode="stretch" style={styles.plane}/>
 </View>;
}
function BackLayer({id,source,motion,plane,canopy,onLoad}: {id:Exclude<PaperLayerId,'ghost'>;source:ImageSourcePropType;motion:Motion;plane:Plane;canopy?:Plane;onLoad?:(key:string)=>void}){
 const style=useLayer(id,motion);
 return <Animated.View testID={`paper-layer-${id}`} style={[StyleSheet.absoluteFill,style]}>
  {canopy?<>
   <View testID="paper-canopy-clip" style={{position:'absolute',left:-24,right:-24,top:canopy.top,height:canopy.height*0.42,overflow:'hidden'}}><PaperPrint id={id} source={source} plane={{...canopy,left:canopy.left+24,top:0}} onLoad={onLoad}/></View>
   <View testID="paper-foliage-clip" style={{position:'absolute',left:-24,right:-24,top:plane.top+plane.height*0.42,bottom:-24,overflow:'hidden'}}><PaperPrint id={id} source={source} plane={{...plane,left:plane.left+24,top:-plane.height*0.42}}/></View>
  </>:<PaperPrint id={id} source={source} plane={plane} onLoad={onLoad}/>}
 </Animated.View>;
}
/** Each original bitmap moves independently; screen UI is a separate sibling. */
export default function PaperDiorama(motion: Motion) {
  const seen=React.useRef(new Set<string>());
  const onLoad=React.useCallback((key:string)=>{seen.current.add(key);if(seen.current.size===9)motion.onReady?.();},[motion.onReady]);
  const layout = useBattleLayout(), safe=useSafeAreaInsets(), ghostStyle = useLayer('ghost', motion);
  const placement=paperPlacement(layout.screenW,layout.screenH,safe.top,safe.bottom,motion.placement);
  const lane={artWidth:placement.actor.width,artSize:placement.actor.height};
  // Route and battle share world landmarks; HUD is a separate sibling.
  const planes=paperViewport(layout,placement.groundY);
  return <View pointerEvents="none" testID="paper-world" style={[StyleSheet.absoluteFill, {overflow:'hidden', backgroundColor:ink.backing}]}>
    <BackLayer id="sky" source={sources.sky} motion={motion} plane={planes.sky} onLoad={onLoad}/>
    <BackLayer id="forest" source={sources.forest} motion={motion} plane={planes.forest} onLoad={onLoad}/>
    <BackLayer id="village" source={sources.village} motion={motion} plane={planes.village} onLoad={onLoad}/>
    <Animated.View testID="paper-contact-shadow" style={[{position:"absolute",left:placement.shadow.left,top:placement.shadow.top,width:placement.shadow.width,height:placement.shadow.height},ghostStyle]}><View style={{flex:1,backgroundColor:ink.ghostShadow,borderRadius:100,opacity:placement.shadow.opacity}}/></Animated.View>
    <Animated.View testID="paper-layer-ghost" style={[{position:'absolute',...placement.actor},ghostStyle]}>
      <View style={[StyleSheet.absoluteFill,{transform:[{translateX:7},{translateY:9}],opacity:0.65}]}><GhostArt fadeDuration={0} id={PAPER_GHOST_ID} width={lane.artWidth} height={lane.artSize} paperTint={ink.ghostShadow}/></View>
      {[[-1.3,-1.3],[1.3,1.3]].map(([x,y],i)=><View key={i} style={[StyleSheet.absoluteFill,{transform:[{translateX:x},{translateY:y}]}]}><GhostArt fadeDuration={0} id={PAPER_GHOST_ID} width={lane.artWidth} height={lane.artSize} paperTint={ink.edge}/></View>)}
      <GhostArt fadeDuration={0} id={PAPER_GHOST_ID} width={lane.artWidth} height={lane.artSize} onLoad={()=>onLoad("ghost")}/>
    </Animated.View>
    <BackLayer id="foliage" source={sources.foliage} motion={motion} plane={planes.foliage} canopy={planes.canopy} onLoad={onLoad}/>
  </View>;
}
const styles = StyleSheet.create({plane:{...StyleSheet.absoluteFillObject,width:'100%',height:'100%'}});
