import React from 'react';
import {Image,View} from 'react-native';
import {artSource} from './Art';
import bounds from '../ghostArtBounds.json';
import {archiveColors} from '../theme';
/** Normalize transparent margins in layout only. Battle crops the enlarged lower body. */
export default function GhostArt({id,width,height,halfBody=false,silhouette=false}:{id:string;width:number;height:number;halfBody?:boolean;silhouette?:boolean}){
 const b=(bounds as Record<string,{width:number;height:number;bounds:number[]}>)[id];
 if(!b)return <Image source={artSource(`monster/${id}`)} resizeMode="contain" style={{width,height,tintColor:silhouette?archiveColors.silhouette:undefined}}/>;
 const [x,y,right,bottom]=b.bounds,bw=right-x,bh=bottom-y;
 const scale=Math.min(width/bw,height/(bh*(halfBody?.55:1)));
 const visibleHeight=halfBody?height:bh*scale;
 return <View style={{width,height,overflow:'hidden'}}>
  <Image accessible={false} source={artSource(`monster/${id}`)} resizeMode="stretch" style={{position:'absolute',width:b.width*scale,height:b.height*scale,left:(width-bw*scale)/2-x*scale,top:height-visibleHeight-y*scale,tintColor:silhouette?archiveColors.silhouette:undefined}}/>
 </View>;
}
