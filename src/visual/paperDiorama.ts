/** Presentation only: milliseconds on one assembly timeline, never gameplay state. */
export const PAPER_ASSEMBLY_MS = 3000;
export const PAPER_GHOST_ID = 'phi-nang-yai';
export const PAPER_LAYERS = {
 sky:{start:0,end:0,dx:0,dy:0,drift:0,shadow:0},
 forest:{start:400,end:1500,dx:-18,dy:8,drift:0.25,shadow:3},
 village:{start:450,end:1500,dx:16,dy:14,drift:0.4,shadow:5},
 ghost:{start:1200,end:2300,dx:0,dy:42,drift:0.6,shadow:7},
 foliage:{start:1800,end:2600,dx:5,dy:30,drift:1,shadow:8},
} as const;
export type PaperLayerId=keyof typeof PAPER_LAYERS;
export function assemblyProgress(time:number,start:number,end:number){
 'worklet';const p=Math.max(0,Math.min(1,(time-start)/(end-start)));
 // Smoothstep has zero velocity at both ends, unlike the old fast cubic-out.
 return p*p*(3-2*p);
}
export function paperProjection(id:PaperLayerId,time:number,x=0,y=0){
 'worklet';if(id==='sky')return {opacity:1,scale:1,translateX:0,translateY:0};
 const l=PAPER_LAYERS[id],p=assemblyProgress(time,l.start,l.end);
 const ambient=time>=PAPER_ASSEMBLY_MS?1:0;
 return {opacity:p,scale:1,translateX:(1-p)*l.dx+x*l.drift*ambient,translateY:(1-p)*l.dy+y*l.drift*0.25*ambient};
}
export function paperHudOpacity(time:number){'worklet';return assemblyProgress(time,2500,PAPER_ASSEMBLY_MS);}
