/** One coordinate system for full-body art, compact HUDs and the hand. */
export function battleGeometry(screenW:number,screenH:number,top=0,bottom=0) {
 const short=screenH-top-bottom<700;
 const playerHudHeight=76,playerHudBottom=bottom+6,sealHeight=36;
 const handBottom=playerHudBottom+playerHudHeight+sealHeight+8;
 const cardHeight=screenH-top-bottom<600?114:short?134:166,handHeight=cardHeight+24;
 const handTop=screenH-handBottom-handHeight;
 const enemyHudHeight=52,enemyExtrasHeight=36,noticeHeight=26;
 const hudTop=handTop-enemyHudHeight-enemyExtrasHeight-noticeHeight-8;
 const monsterTop=top+42,monsterSize=Math.max(24,hudTop-monsterTop-48);
 return {screenW,screenH,monsterTop,monsterSize,hudTop,enemyHudHeight,enemyExtrasHeight,
  playerHudHeight,playerHudBottom,sealHeight,handBottom,handHeight,handTop,cardHeight,
  noticeTop:hudTop+enemyHudHeight+enemyExtrasHeight+2,noticeHeight,
  enemyHandCenterY:hudTop-22,centerX:screenW*.5,centerY:monsterTop+monsterSize*.55};
}
export function enemyLane(g:ReturnType<typeof battleGeometry>,index=0,count=1) {
 const n=Math.max(1,count),width=g.screenW/n;
 const artWidth=width*(n===1?.80:.88),artSize=g.monsterSize;
 const artX=index*width+(width-artWidth)/2;
 const cardW=Math.min(140,width*.58),cardH=Math.min(g.monsterSize*.74,cardW*1.34);
 const cardX=index*width+width*.5,cardY=g.monsterTop+g.monsterSize*.50;
 const hudWidth=width*(n===1?.80:.94),hudX=index*width+(width-hudWidth)/2;
 return {artSize,artWidth,artX,cardX,cardY,cardW,cardH,hudX,hudWidth};
}
/** Six exposed cost corners remain tappable; larger hands browse explicitly. */
export function handGeometry(screenW:number,count:number) {
 const cardW=Math.min(118,Math.max(100,screenW*.29)),gutter=14;
 const step=count<=6?Math.min(cardW*.88,(screenW-gutter*2-cardW)/Math.max(1,count-1)):48;
 const span=cardW+step*Math.max(0,count-1),overflow=span>screenW-gutter*2;
 return {cardW,step,span,overflow,padding:overflow?gutter:Math.max(gutter,(screenW-span)/2)};
}

/** Hidden card slots are confined to their owner's HUD lane, including multiple actors. */
export function enemyHandGeometry(g:ReturnType<typeof battleGeometry>,count:number,index=0,owners=1){
 const lane=enemyLane(g,index,owners),cardW=Math.min(24,(lane.hudWidth-4*Math.max(0,count-1))/Math.max(1,count));
 return {left:lane.hudX,width:lane.hudWidth,top:g.enemyHandCenterY-17,height:34,cardW,cardH:cardW*34/24,step:cardW+4};
}
