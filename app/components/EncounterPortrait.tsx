import React from 'react';
import {Image,View} from 'react-native';
import type {PageOffer} from '../../src/core/map/pages';
import {artSource} from './Art';
import {encounterObject} from './EncounterArt';
import bounds from '../ghostArtBounds.json';
import {palette} from '../theme';

/** Original sprite focal points; crop is layout-only and never changes the asset. */
const focal:Record<string,[number,number,number]>={
 'phi-pop':[.62,.20,.68],'pop-yai':[.53,.20,.68],'phi-krasue':[.56,.26,.76],
 'phi-nang-ram':[.61,.23,.78],'phi-pa':[.46,.23,.68],'phi-nang-yai':[.52,.20,.70],
 'ngu-phi-sang':[.55,.24,.70],'jao-por-pa':[.44,.21,.72],'krahang':[.65,.24,.76],
 'yak-dam':[.64,.25,.76],'night-head-collector':[.58,.24,.76],
 'night-headless-king':[.62,.19,.74],'winyan-dek':[.62,.23,.70],
 'phi-ha-ratri':[.52,.50,.98],'pisaj-fai':[.52,.51,.98],
 'phi-kin-hua':[.53,.24,.78],'night-root-lord':[.53,.24,.78],
};
export default function EncounterPortrait({offer,diameter,index,selected}:{offer:PageOffer;diameter:number;index:number;selected:boolean}){
 const inner=diameter-8,combat=offer.kind==='monster'||offer.kind==='boss';
 const b=combat?(bounds as Record<string,{width:number;height:number;bounds:number[]}>)[offer.enemyId]:undefined;
 const [cx,cy,span]=combat?(focal[offer.enemyId]??[.52,.20,.68]):[.5,.5,1];
 const scale=b?inner/(b.width*span):1;
 return <View testID={'adventure-art-'+index} style={{width:diameter,height:diameter,borderRadius:diameter/2,borderWidth:1.5,borderColor:selected?palette.bloodLit:palette.moonDim,padding:2,backgroundColor:palette.inkSoft}}>
  <View testID={'adventure-circle-'+index} style={{width:inner,height:inner,borderRadius:inner/2,overflow:'hidden',borderWidth:1,borderColor:palette.paper,backgroundColor:palette.olive}}>
   <Image accessible={false} source={require('../../assets/scence/quiet-village.png')} resizeMode="cover" style={{position:'absolute',width:inner,height:inner,opacity:.35}}/>
   {combat?<Image testID={'adventure-ghost-'+index} accessible={false} source={artSource('monster/'+offer.enemyId)} resizeMode={b?'stretch':'contain'} style={b?{position:'absolute',width:b.width*scale,height:b.height*scale,left:inner/2-b.width*cx*scale,top:inner/2-b.height*cy*scale}:{width:inner,height:inner}}/>:<Image testID={'adventure-prop-'+index} accessible={false} source={encounterObject(offer)} resizeMode="contain" style={{width:inner,height:inner}}/>}
  </View>
 </View>;
}
