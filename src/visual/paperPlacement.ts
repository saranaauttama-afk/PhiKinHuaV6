/** Village-only authored framing; independent of battle HUD/card geometry. */
export type PaperCharacterPlacement={
 groundAnchorX:number;groundAnchorY:number;characterScale:number;characterOffsetY:number;
 placementMode:'grounded'|'floating';shadowOpacity:number;shadowScale:number;
 compactGroundAnchorY:number;compactHeight:number;referenceHeight:number;
};
export const VILLAGE_PLACEMENT:PaperCharacterPlacement={
 groundAnchorX:.5,groundAnchorY:410/852,compactGroundAnchorY:200/640,
 compactHeight:640,referenceHeight:852,characterScale:1,characterOffsetY:-.012,
 // The dangling, unequal feet in the approved cutout intentionally float.
 placementMode:'floating',shadowOpacity:.22,shadowScale:.42,
};
export function paperPlacement(width:number,height:number,top=0,bottom=0,config=VILLAGE_PLACEMENT){
 const shortY=config.compactGroundAnchorY*config.compactHeight;
 const referenceY=config.groundAnchorY*config.referenceHeight;
 const authoredY=shortY+(height-config.compactHeight)*(referenceY-shortY)/(config.referenceHeight-config.compactHeight);
 const groundX=width*config.groundAnchorX;
 const groundY=Math.max(top+90,Math.min(height-bottom-24,authoredY-bottom));
 const offset=config.placementMode==='floating'?config.characterOffsetY*height:0;
 const footY=groundY+offset;
 const actorHeight=Math.max(40,footY-top-36)*config.characterScale;
 const actorWidth=width*.8*config.characterScale;
 return {groundX,groundY,footY,actor:{left:groundX-actorWidth/2,top:footY-actorHeight,width:actorWidth,height:actorHeight},
 shadow:{left:groundX-actorWidth*config.shadowScale/2,top:groundY-3,width:actorWidth*config.shadowScale,height:config.placementMode==='floating'?9:5,opacity:config.shadowOpacity},mode:config.placementMode};
}
