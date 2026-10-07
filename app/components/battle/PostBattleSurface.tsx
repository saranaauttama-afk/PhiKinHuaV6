import {combatUiColors} from '../../theme';
import React from 'react';
import {ImageBackground,ScrollView,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {layer,palette} from '../../theme';
/** Victory preserves the scene; choices share the illustrated woven mat. */
export default function PostBattleSurface({children,mat=false}:{children:React.ReactNode;mat?:boolean}){
 const safe=useSafeAreaInsets();
 const content=<ScrollView style={{flex:1}} contentContainerStyle={{flexGrow:1,justifyContent:'center',paddingTop:safe.top+24,paddingBottom:safe.bottom+24,paddingHorizontal:20}}>{children}</ScrollView>;
 const style={position:'absolute' as const,top:0,bottom:0,left:0,right:0,zIndex:layer.overlay,overflow:'hidden' as const};
 return mat?<ImageBackground source={require('../../../assets/ui/deck-mat.jpg')} resizeMode="cover" accessibilityViewIsModal style={style}><View style={{flex:1,backgroundColor:combatUiColors.rewardShade}}>{content}</View></ImageBackground>:<View accessibilityViewIsModal style={[style,{backgroundColor:palette.scrim}]}>{content}</View>;
}
