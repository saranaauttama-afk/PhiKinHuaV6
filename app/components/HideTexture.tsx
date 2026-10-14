import React from 'react';
import {Image,Platform,View} from 'react-native';

const rawhide=require('../../assets/ui/cards/approved-rawhide-aged.png');
/** The approved pale, wrinkled rawhide frame; all live text/art remain separate. */
export type HideWash={color:string;opacity:number};
export default function HideTexture({width,height,muted=false,wash}:{width:number;height:number;muted?:boolean;wash?:HideWash}) {
 const filter=Platform.OS==='web'?[muted?'grayscale(1)':'',wash?'saturate(.45)':''].filter(Boolean).join(' '):[...(muted?[{grayscale:1}]:[]),...(wash?[{saturate:.45}]:[])];
 return <View pointerEvents="none" style={{position:'absolute',left:0,top:0,width,height}}><Image accessible={false} source={rawhide} resizeMode="stretch" style={{width,height,filter:filter as any}}/>{wash&&<Image accessible={false} source={rawhide} resizeMode="stretch" tintColor={wash.color} style={{position:'absolute',left:0,top:0,width,height,opacity:wash.opacity}}/>}</View>;
}
