import {ritualColors} from '../theme';
import React from 'react';
import {Image,View,StyleProp,ViewStyle} from 'react-native';

const surfaces={
 slate:require('../../assets/ui/ritual-slate.png'),
 palm:require('../../assets/ui/ritual-palm.png'),
 wood:require('../../assets/ui/ritual-wood.png'),
 cloth:require('../../assets/ui/ritual-cloth.png'),
 notice:require('../../assets/ui/ritual-notice.png'),
};
export const chalk=ritualColors.chalk;
/** Numeric measured bounds avoid native Image intrinsic/percentage sizing surprises. */
export default function RitualSurface({kind,children,style}:{kind:keyof typeof surfaces;children?:React.ReactNode;style?:StyleProp<ViewStyle>}){
 const [size,setSize]=React.useState({width:0,height:0});
 return <View collapsable={false} onLayout={e=>{const {width,height}=e.nativeEvent.layout;setSize(s=>s.width===width&&s.height===height?s:{width,height})}} style={[{padding:16},style]}>
  <Image accessible={false} source={surfaces[kind]} resizeMode="stretch" style={{position:'absolute',left:0,top:0,width:size.width,height:size.height}}/>
  {children}
 </View>;
}
