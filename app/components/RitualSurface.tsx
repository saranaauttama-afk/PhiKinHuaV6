import {ritualColors,palette} from '../theme';
import React from 'react';
import {Image,View,StyleProp,ViewStyle,StyleSheet} from 'react-native';
import HideTexture,{type HideWash} from './HideTexture';

const surfaces={
 quietSlate:require('../../assets/ui/quiet-slate.png'),
 darkCloth:require('../../assets/ui/ritual-dark-cloth.webp'),
 slate:require('../../assets/ui/ritual-slate.png'),
 palm:require('../../assets/ui/ritual-palm.png'),
 wood:require('../../assets/ui/ritual-wood.png'),
 cloth:require('../../assets/ui/ritual-cloth.png'),
 notice:require('../../assets/ui/ritual-notice.png'),
 occupationPage:require('../../assets/ui/occupation-page.png'),
 grayCard:require('../../assets/ui/card-gray/occupation-page.webp'),
 hudPaper:require('../../assets/ui/paper-button.png'),
 blessingHerbs:require('../../assets/ui/blessing-herbs.png'),
 blessingAncestor:require('../../assets/ui/blessing-ancestor.png'),
};
export const chalk=ritualColors.chalk;
/** Numeric measured bounds avoid native Image intrinsic/percentage sizing surprises. */
export default function RitualSurface({kind,children,style,accessibilityViewIsModal,testID,hideWash}:{kind:keyof typeof surfaces|'hideCard'|'hideGray';children?:React.ReactNode;style?:StyleProp<ViewStyle>;accessibilityViewIsModal?:boolean;testID?:string;hideWash?:HideWash}){
 const [size,setSize]=React.useState({width:0,height:0});
 // Large explanation sheets need clear space beyond their torn, stained edges.
 // Preserve any larger caller inset; leave small tabs and card textures alone.
 const requested=StyleSheet.flatten([{padding:16},style]);
 const h=kind==='occupationPage'&&size.width>=200?Math.max(28,Math.ceil(size.width*.085)):0;
 const v=h?28:0;
 const inset=(edge:'Left'|'Right'|'Top'|'Bottom',floor:number)=>{
  const value=requested[`padding${edge}`]??requested[edge==='Left'||edge==='Right'?'paddingHorizontal':'paddingVertical']??requested.padding;
  return Math.max(floor,typeof value==='number'?value:16);
 };
 const safePaper=h?{paddingLeft:inset('Left',h),paddingRight:inset('Right',h),paddingTop:inset('Top',v),paddingBottom:inset('Bottom',v)}:undefined;
 // Preserve the native parent when borders/opacity change; avoid Fabric reparenting on exit.
 // Keep the image mounted: measurement changes dimensions, never the child hierarchy.
 return <View testID={testID} collapsable={false} accessibilityViewIsModal={accessibilityViewIsModal} onLayout={e=>{const {width,height}=e.nativeEvent.layout;setSize(s=>s.width===width&&s.height===height?s:{width,height})}} style={[{padding:16,backgroundColor:'transparent'},style,safePaper]}>
  {kind==='hideCard'||kind==='hideGray'?<HideTexture width={size.width} height={size.height} muted={kind==='hideGray'} wash={hideWash}/>:<Image accessible={false} source={surfaces[kind]} resizeMode="stretch" style={{position:'absolute',left:0,top:0,width:size.width,height:size.height}}/>}
  {children}
 </View>;
}
