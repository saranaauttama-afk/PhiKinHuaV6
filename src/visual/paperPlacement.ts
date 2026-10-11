/** Village-only authored framing; independent of battle HUD/card geometry. */
export type PaperCharacterPlacement={
 groundAnchorX:number;groundAnchorY:number;characterScale:number;characterOffsetY:number;
 placementMode:'grounded'|'floating';shadowOpacity:number;shadowScale:number;
 presentationShiftY?:number;compactGroundAnchorY:number;compactHeight:number;transitionHeight:number;transitionGroundAnchorY:number;referenceHeight:number;
};
export const VILLAGE_PLACEMENT:PaperCharacterPlacement={
 groundAnchorX:.5,groundAnchorY:410/852,compactGroundAnchorY:230/640,
 compactHeight:640,transitionHeight:700,transitionGroundAnchorY:258/700,referenceHeight:852,characterScale:1,characterOffsetY:-.012,
 // The dangling, unequal feet in the approved cutout intentionally float.
 presentationShiftY:.04,placementMode:'floating',shadowOpacity:.22,shadowScale:.42,
};
export function paperPlacement(width:number,height:number,top=0,bottom=0,config=VILLAGE_PLACEMENT,footLimit=Infinity){
 const shortY=config.compactGroundAnchorY*config.compactHeight;
 const referenceY=config.groundAnchorY*config.referenceHeight;
 const transitionY=config.transitionGroundAnchorY*config.transitionHeight;
 // Authored portrait landmarks keep intermediate heights continuous and clear
 // of screen controls without using HUD positions to define the world plane.
 const authoredY=height>config.referenceHeight?referenceY+height-config.referenceHeight
  :height>config.transitionHeight?transitionY+(height-config.transitionHeight)*(referenceY-transitionY)/(config.referenceHeight-config.transitionHeight)
  :shortY+(height-config.compactHeight)*(transitionY-shortY)/(config.transitionHeight-config.compactHeight);
 const groundX=width*config.groundAnchorX;
 const offset=config.placementMode==='floating'?config.characterOffsetY*height:0;
 const groundY=Math.max(top+90,Math.min(height-bottom-24,authoredY-bottom+height*(config.presentationShiftY??0),footLimit-offset));
 const footY=groundY+offset;
 const actorHeight=Math.max(40,footY-top-36)*config.characterScale;
 const actorWidth=width*.8*config.characterScale;
 return {groundX,groundY,footY,actor:{left:groundX-actorWidth/2,top:footY-actorHeight,width:actorWidth,height:actorHeight},
 shadow:{left:groundX-actorWidth*config.shadowScale/2,top:groundY-3,width:actorWidth*config.shadowScale,height:config.placementMode==='floating'?9:5,opacity:config.shadowOpacity},mode:config.placementMode};
}
