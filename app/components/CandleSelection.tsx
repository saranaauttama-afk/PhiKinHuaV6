import React from 'react';
import {View,Image} from 'react-native';
/** Soft circular candle halos, with stable native parents and no rectangular border. */
export default function CandleSelection({selected,dim=false,children}:{selected:boolean;dim?:boolean;children:React.ReactNode}) {
 return <View collapsable={false} style={{flex:1,opacity:dim?.68:1}}>
  <View pointerEvents="none" style={{position:'absolute',top:0,bottom:0,left:0,right:0,alignItems:'center',justifyContent:'center',opacity:selected?1:0}}>
   <Image source={require('../../assets/ui/candle-selection.webp')} resizeMode="stretch" style={{position:'absolute',width:'120%',height:'116%',opacity:.38}}/>
  </View>{children}
 </View>;
}
