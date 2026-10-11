import React from 'react';
import SceneTheater from '../paper/SceneTheater';
import {Image,ImageSourcePropType,StyleSheet,View} from 'react-native';
import Svg,{Defs,LinearGradient,RadialGradient,Rect,Stop} from 'react-native-svg';
import {battleSceneColors} from '../../theme';
/** Existing geography stays visible; its centre/floor no longer compete with UI. */
export default function BattleBackdrop({source,children,sceneId,entryKey,ghostId}:{source:ImageSourcePropType;children:React.ReactNode;sceneId?:string;entryKey?:string;ghostId?:string}){
 if(sceneId==='01-village')return <SceneTheater key={entryKey} sceneId={sceneId} entryKey={entryKey??sceneId} ghostId={ghostId}>{children}</SceneTheater>;
 return <View style={{flex:1,backgroundColor:battleSceneColors.base}}>
  <Image accessible={false} source={source} resizeMode="cover" style={[StyleSheet.absoluteFill,{opacity:.76}]}/>
  <View pointerEvents="none" style={StyleSheet.absoluteFill}><Svg width="100%" height="100%"><Defs>
   <RadialGradient id="stageQuiet" cx="50%" cy="32%" rx="54%" ry="46%"><Stop offset="0" stopColor={battleSceneColors.centre} stopOpacity=".64"/><Stop offset=".65" stopColor={battleSceneColors.centre} stopOpacity=".30"/><Stop offset="1" stopColor={battleSceneColors.centre} stopOpacity="0"/></RadialGradient>
   <LinearGradient id="floorQuiet" x1="0" y1="0" x2="0" y2="1"><Stop offset=".5" stopColor={battleSceneColors.floor} stopOpacity="0"/><Stop offset=".72" stopColor={battleSceneColors.floor} stopOpacity=".5"/><Stop offset="1" stopColor={battleSceneColors.floor} stopOpacity=".85"/></LinearGradient>
  </Defs><Rect width="100%" height="100%" fill="url(#stageQuiet)"/><Rect width="100%" height="100%" fill="url(#floorQuiet)"/></Svg></View>{children}
 </View>;
}
