import React from 'react';
import {Image,Platform,StyleSheet,View} from 'react-native';
import Svg,{ClipPath,Defs,Image as SvgImage,Path} from 'react-native-svg';
import Animated,{useAnimatedStyle} from 'react-native-reanimated';
import {paperEnvironment,environmentPlane,registeredStructurePlane,contourPath} from '../../../src/visual/paperEnvironments';
import {paperPlacement} from '../../../src/visual/paperPlacement';
import {paperProjection,type PaperLayerId} from '../../../src/visual/paperDiorama';
import {PAPER_SCENE_ASSETS} from '../../paperSceneAssets';
import {useBattleLayout} from '../battle/battleLayout';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {paperDioramaColors as ink} from '../../theme';
import type {TheaterMotion} from './SceneTheater';

const webComposite=Platform.OS==='web'?{willChange:'transform,opacity'}:{};
function PrintLayer({id,d,plane,motion,source}:{id:'forest'|'village'|'foliage';d:string;plane:ReturnType<typeof environmentPlane>;motion:TheaterMotion;source:any}){
 const style=useAnimatedStyle(()=>{const p=paperProjection(id,motion.assembly.value,motion.x.value,motion.y.value);return {...webComposite,opacity:p.opacity,transform:[{translateX:p.translateX},{translateY:p.translateY}]};});
 const depth=id==='forest'?2:id==='village'?4:6;
 return <Animated.View renderToHardwareTextureAndroid shouldRasterizeIOS testID={`environment-layer-${id}`} style={[{position:'absolute',...plane},style]}>
  <Svg width="100%" height="100%" viewBox="0 0 1024 1536">
   <Defs><ClipPath id={`cut-${id}`}><Path d={d}/></ClipPath></Defs>
   <Path d={d} fill={ink.shadow} opacity={.6} transform={`translate(${depth},${depth*1.5})`}/>
   <SvgImage href={source} x={0} y={0} width={1024} height={1536} clipPath={`url(#cut-${id})`} preserveAspectRatio="xMidYMid slice"/>
   <Path d={d} fill="none" stroke={ink.edge} strokeWidth={depth} strokeLinejoin="round"/>
  </Svg>
 </Animated.View>;
}
/** Static full image foundation; translucent ink underlays give relief beneath separate paper prints.
 * The entire original foundation stays visible, including the opening frame. */
function PaperEnvironment({motion,onReady,foregroundOnly=false}:{motion:TheaterMotion;onReady:()=>void;foregroundOnly?:boolean}){
 const env=paperEnvironment(motion.sceneId)!,layout=useBattleLayout(),safe=useSafeAreaInsets();
 const world=paperPlacement(layout.screenW,layout.screenH,safe.top,safe.bottom,env.placement,layout.hudTop-8);
 const plane=environmentPlane(layout.screenW,layout.screenH,world.groundY,env.sourceGroundY);
 const structurePlane=registeredStructurePlane(plane,world.groundY,env.sourceGroundY);
 const source=PAPER_SCENE_ASSETS[env.id];
 const svgSource=typeof source==='number'?Image.resolveAssetSource(source):source;
 const cuts=[['forest',env.far],['village',env.structures],['foliage',env.foreground]] as const;
 if(foregroundOnly)return <PrintLayer id="foliage" d={contourPath(env.foreground)} plane={plane} motion={motion} source={svgSource}/>;
 return <View testID={`environment-${env.id}`} pointerEvents="none" style={[StyleSheet.absoluteFill,{overflow:'hidden'}]}>
  <Image testID="environment-static-base" fadeDuration={0} source={source} onLoad={onReady} resizeMode="stretch" style={{position:'absolute',...plane}}/>
  {cuts.map(([id,points])=><View key={id} style={{position:'absolute',...(id==='village'?structurePlane:plane)}}><Svg width="100%" height="100%" viewBox="0 0 1024 1536"><Path d={contourPath(points)} fill={ink.shadow} opacity={.16}/></Svg></View>)}
  {cuts.filter(([id])=>id!=='foliage').map(([id,points])=><PrintLayer key={id} id={id} d={contourPath(points)} plane={id==='village'?structurePlane:plane} motion={motion} source={svgSource}/>)}
 </View>;
}

export default React.memo(PaperEnvironment);
