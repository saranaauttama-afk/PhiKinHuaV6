import React from 'react';
import {Platform,StyleSheet,View,useWindowDimensions} from 'react-native';
import Animated,{cancelAnimation,Easing,runOnJS,useAnimatedStyle,useSharedValue,withRepeat,withSequence,withTiming,SharedValue} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {battleGeometry} from '../../battleGeometry';
import {BattleLayoutContext} from '../battle/battleLayout';
import {useGameSettings} from '../Settings';
import {usePaperMotion} from './usePaperMotion';
import PaperDiorama from './PaperDiorama';
import {PAPER_ASSEMBLY_MS,paperHudOpacity} from '../../../src/visual/paperDiorama';
import {paperDioramaColors as ink,layer} from '../../theme';

export type TheaterMotion={assembly:SharedValue<number>;x:SharedValue<number>;y:SharedValue<number>;sceneId:string;ready:boolean};
export const TheaterContext=React.createContext<TheaterMotion|null>(null);
/** Presentation lifecycle keyed to entry identity, never combat turns or saves. */
export default function SceneTheater({sceneId,entryKey,instant=false,ghostId,children}:{sceneId:string;entryKey:string;instant?:boolean;ghostId?:string;children:React.ReactNode}){
 const settings=useGameSettings(),motion=usePaperMotion(),safe=useSafeAreaInsets(),window=useWindowDimensions();
 const [size,setSize]=React.useState({width:window.width,height:window.height});
 const layout=React.useMemo(()=>battleGeometry(size.width,size.height,safe.top,safe.bottom),[size,safe.top,safe.bottom]);
 const bypass=instant||!settings.dioramaAnimation||motion.reduced;
 const [assetsReady,setAssetsReady]=React.useState(false),[finished,setFinished]=React.useState(bypass);
 const onReady=React.useCallback(()=>setAssetsReady(true),[]);
 const assembly=useSharedValue(bypass?PAPER_ASSEMBLY_MS:0),x=useSharedValue(0),y=useSharedValue(0),generation=React.useRef(0);
 const finish=React.useCallback((id:number)=>{if(id===generation.current)setFinished(true);},[]);
 const hydrated=settings.hydrated&&motion.ready;
 React.useEffect(()=>{
  const id=++generation.current;cancelAnimation(assembly);
  if(!hydrated||!assetsReady)return;
  if(bypass){assembly.value=PAPER_ASSEMBLY_MS;setFinished(true);}
  else{setFinished(false);assembly.value=0;assembly.value=withTiming(PAPER_ASSEMBLY_MS,{duration:PAPER_ASSEMBLY_MS,easing:Easing.linear},done=>{if(done)runOnJS(finish)(id);});}
  return ()=>{++generation.current;cancelAnimation(assembly);};
 },[entryKey,hydrated,assetsReady,bypass,assembly,finish]);
 React.useEffect(()=>{
  cancelAnimation(x);cancelAnimation(y);x.value=0;y.value=0;
  if(!finished||motion.reduced||!motion.active)return;
  x.value=withRepeat(withSequence(withTiming(1,{duration:16000,easing:Easing.inOut(Easing.sin)}),withTiming(-1,{duration:16000,easing:Easing.inOut(Easing.sin)})),-1);
  return ()=>{cancelAnimation(x);cancelAnimation(y);};
 },[finished,motion.reduced,motion.active,x,y]);
 const uiStyle=useAnimatedStyle(()=>({opacity:paperHudOpacity(assembly.value)}));
 const ready=hydrated&&assetsReady&&(bypass||finished);
 const context=React.useMemo(()=>({assembly,x,y,sceneId,ready}),[assembly,x,y,sceneId,ready]);
 return <View testID="scene-theater" onLayout={e=>{const {width,height}=e.nativeEvent.layout;if(width>0&&height>0)setSize(s=>s.width===width&&s.height===height?s:{width,height});}} style={{flex:1,overflow:'hidden',backgroundColor:ink.backing}}>
  <BattleLayoutContext.Provider value={layout}><TheaterContext.Provider value={context}>
   <PaperDiorama assembly={assembly} x={x} y={y} onReady={onReady} showGhost={!!ghostId} ghostId={ghostId}/>
   <Animated.View testID="theater-screen-ui" pointerEvents={ready?'box-none':'none'} accessibilityElementsHidden={!ready} importantForAccessibility={ready?'auto':'no-hide-descendants'} style={[StyleSheet.absoluteFill,uiStyle]}>{children}</Animated.View>
   {!ready&&<View testID="theater-input-guard" style={[StyleSheet.absoluteFill,{zIndex:layer.battleOverlay}]} pointerEvents="auto"/>}
   {Platform.OS==='web'&&<View testID={`theater-${sceneId}-${ready?'ready':'assembling'}`} pointerEvents="none" style={{width:0,height:0}}/>}
  </TheaterContext.Provider></BattleLayoutContext.Provider>
 </View>;
}
