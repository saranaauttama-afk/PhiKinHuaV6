import {paperPlacement} from './paperPlacement';

// All approved environmental bitmaps share this source canvas. Only uniform
// cover/crop is permitted: native Image stretch receives this exact aspect ratio.
const SOURCE_W=1024,SOURCE_H=1536;
export const PAPER_BLEED=24;
export function paperViewport(layout:{screenW:number;screenH:number},groundY=paperPlacement(layout.screenW,layout.screenH).groundY){
 const {screenW:w,screenH:h}=layout;
 const cover=(height:number)=>{const scale=Math.max((w+2*PAPER_BLEED)/SOURCE_W,height/SOURCE_H);return {width:SOURCE_W*scale,height:SOURCE_H*scale};};
 const full=cover(h+2*PAPER_BLEED);
 const sky={...full,left:(w-full.width)/2,top:(h-full.height)/2};
 // Register the village road to the authored scene ground anchor and keep its
 // printed lower edge below the screen even on a tall phone with navigation bars.
 const foot=groundY,road=0.57;
 const village=cover(Math.max((foot+PAPER_BLEED)/road,(h-foot+PAPER_BLEED)/(1-road)));
 return {sky,forest:sky,village:{...village,left:(w-village.width)/2,top:foot-village.height*road},
  // The two transparent foliage groups share one animation but independent
  // static registration. The canopy stays above the face; the lower leaves
  // are bottom anchored. Their clips meet only in the source's empty centre.
  canopy:{...full,left:(w-full.width)/2,top:-PAPER_BLEED-h*0.14},
  foliage:{...full,left:(w-full.width)/2,top:h+PAPER_BLEED-full.height}};
}
