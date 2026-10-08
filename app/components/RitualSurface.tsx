import {ritualColors,paper,palette} from '../theme';
import React from 'react';
import {Image,View,StyleProp,ViewStyle} from 'react-native';

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
export default function RitualSurface({kind,children,style,accessibilityViewIsModal}:{kind:keyof typeof surfaces;children?:React.ReactNode;style?:StyleProp<ViewStyle>;accessibilityViewIsModal?:boolean}){
 const [size,setSize]=React.useState({width:0,height:0});
 // Preserve the native parent when borders/opacity change; avoid Fabric reparenting on exit.
 // Keep the image mounted: measurement changes dimensions, never the child hierarchy.
 return <View collapsable={false} accessibilityViewIsModal={accessibilityViewIsModal} onLayout={e=>{const {width,height}=e.nativeEvent.layout;setSize(s=>s.width===width&&s.height===height?s:{width,height})}} style={[{padding:16,backgroundColor:kind==='occupationPage'||kind==='hudPaper'||kind==='grayCard'?paper.bg:palette.inkSoft},style]}>
  <Image accessible={false} source={surfaces[kind]} resizeMode="stretch" style={{position:'absolute',left:0,top:0,width:size.width,height:size.height}}/>
  {children}
 </View>;
}
