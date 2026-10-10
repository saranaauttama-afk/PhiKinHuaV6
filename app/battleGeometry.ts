/** Shared owner coordinates: enlarged upper body and reveal beside its shoulder. */
export function battleGeometry(screenW:number,screenH:number,top=0,bottom=0) {
 const monsterTop=top+10,handHeight=screenH<700?148:178;
 const monsterSize=Math.max(140,Math.min(390,screenH-bottom-118-handHeight-110-monsterTop));
 const hudTop=monsterTop+monsterSize+8;
 return {screenW,screenH,monsterTop,monsterSize,hudTop,enemyHandCenterY:monsterTop+monsterSize*.55,centerX:screenW*.34,centerY:monsterTop+monsterSize*.55};
}
export function enemyLane(g:ReturnType<typeof battleGeometry>,index=0,count=1) {
 const n=Math.max(1,count),width=g.screenW/n;
 const artWidth=width*(n===1?.88:.94),artSize=g.monsterSize;
 const artX=index*width+(width-artWidth)/2;
 const cardW=Math.min(112,width*.36),cardH=Math.min(g.monsterSize*.78,cardW*1.34);
 const cardX=index*width+width*.27,cardY=g.monsterTop+g.monsterSize*.57;
 return {artSize,artWidth,artX,cardX,cardY,cardW,cardH,hudX:index*width+8,hudWidth:width-16};
}
