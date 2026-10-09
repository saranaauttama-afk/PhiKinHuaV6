/** Separate illustration/card lanes above the HUD, shared by all enemy owners. */
export function battleGeometry(screenW:number,screenH:number,top=0,bottom=0) {
 const monsterTop=top+54;
 const handHeight=screenH<700?148:178;
 const monsterSize=Math.max(110,Math.min(290,screenW*.70,screenH-bottom-118-handHeight-110-monsterTop));
 const hudTop=monsterTop+monsterSize+12;
 return {screenW,screenH,monsterTop,monsterSize,hudTop,enemyHandCenterY:monsterTop+monsterSize/2,centerX:screenW*.24,centerY:monsterTop+monsterSize/2};
}
export function enemyLane(g:ReturnType<typeof battleGeometry>,index=0,count=1) {
 const n=Math.max(1,count),width=g.screenW/n;
 const artSize=Math.min(g.monsterSize,width*(n===1?.70:.52));
 const artX=n===1?width-artSize-12:width*(index+.72)-artSize/2;
 const cardW=Math.min(112,n===1?artX-16:width*.42),cardH=Math.min(g.monsterSize-12,cardW*1.34);
 return {artSize,artX,cardX:n===1?8+cardW/2:width*(index+.24),cardY:g.monsterTop+artSize/2,cardW,cardH,hudX:index*width+8,hudWidth:width-16};
}
