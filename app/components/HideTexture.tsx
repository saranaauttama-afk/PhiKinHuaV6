import React from 'react';
import {Image,Platform,View} from 'react-native';

const rawhide=require('../../assets/ui/cards/approved-rawhide-aged.png');
/** The approved pale, wrinkled rawhide frame; all live text/art remain separate. */
export default function HideTexture({width,height,muted=false}:{width:number;height:number;muted?:boolean}) {
 return <View pointerEvents="none" style={{position:'absolute',left:0,top:0,width,height}}><Image accessible={false} source={rawhide} resizeMode="stretch" style={{width,height,filter:(muted?(Platform.OS==='web'?'grayscale(1)':[{grayscale:1}]):undefined) as any}}/></View>;
}
