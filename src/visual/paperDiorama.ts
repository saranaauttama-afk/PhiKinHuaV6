/** Presentation only: milliseconds on one assembly timeline, never gameplay state. */
export const PAPER_ASSEMBLY_MS = 1800;
export const PAPER_GHOST_ID = 'phi-nang-yai';
export const PAPER_LAYERS = {
 sky:{start:0,end:300,dx:0,dy:0,drift:0.1,shadow:0},
 forest:{start:300,end:650,dx:-18,dy:8,drift:0.25,shadow:3},
 village:{start:380,end:700,dx:16,dy:14,drift:0.4,shadow:5},
 ghost:{start:700,end:1100,dx:0,dy:54,drift:0.6,shadow:7},
 foliage:{start:1100,end:1500,dx:5,dy:36,drift:1,shadow:8},
} as const;
export type PaperLayerId=keyof typeof PAPER_LAYERS;
export function assemblyProgress(time:number,start:number,end:number){
 'worklet';const p=Math.max(0,Math.min(1,(time-start)/(end-start)));return 1-Math.pow(1-p,3);
}
export function paperProjection(id:PaperLayerId,time:number,x=0,y=0){
 'worklet';const l=PAPER_LAYERS[id],p=assemblyProgress(time,l.start,l.end);
 return {opacity:p,scale:1,translateX:(1-p)*l.dx+x*l.drift,translateY:(1-p)*l.dy+y*l.drift*0.25};
}
export function paperHudOpacity(time:number){'worklet';return assemblyProgress(time,1500,PAPER_ASSEMBLY_MS);}
