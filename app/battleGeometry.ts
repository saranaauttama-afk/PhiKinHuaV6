/** Separate illustration/card lanes above the HUD, shared by all enemy owners. */
export function battleGeometry(screenW:number,screenH:number,top=0,bottom=0) {
 const monsterTop=top+54;
 const monsterSize=Math.max(100,Math.min(260,screenW*.52,screenH-bottom-440-monsterTop));
 const hudTop=monsterTop+monsterSize+12;
 return {screenW,screenH,monsterTop,monsterSize,hudTop,enemyHandCenterY:monsterTop+monsterSize/2,centerX:screenW*.24,centerY:monsterTop+monsterSize/2};
}
export function enemyLane(g:ReturnType<typeof battleGeometry>,index=0,count=1) {
 const n=Math.max(1,count),width=g.screenW/n;
 const artSize=Math.min(g.monsterSize,width*.52);
 const cardW=Math.min(120,width*.42),cardH=Math.min(g.monsterSize-12,cardW*1.34);
 return {artSize,artX:width*(index+.72)-artSize/2,cardX:width*(index+.24),cardY:g.monsterTop+artSize/2,cardW,cardH,hudX:index*width+8,hudWidth:width-16};
}
