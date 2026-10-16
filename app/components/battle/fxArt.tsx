import React from 'react';
import {Image,View,type ImageSourcePropType,type StyleProp,type ImageStyle} from 'react-native';
import {create} from 'zustand';
import {healthBarColors} from '../../theme';
export type FxId='incense_smoke'|'ash_fleck'|'victory_rays'|'battle_mist'|'firefly'|'ink_blood_drop'|'page_burn_edge'|'card_ready_glow';
// Populated after generation; every effect remains usable while art is being produced.
export const FX_ART:Partial<Record<FxId,ImageSourcePropType>>={};
export function FxSprite({id,style}:{id:FxId;style?:StyleProp<ImageStyle>}){
 return FX_ART[id]?<Image accessible={false} source={FX_ART[id]} resizeMode="stretch" style={style}/>:<View pointerEvents="none" style={[{borderRadius:100,backgroundColor:healthBarColors.chip},style]}/>;
}
// A screen-wide cap: bursts temporarily replace ambient fireflies, never add to them.
const useBudget=create<{leases:Map<symbol,number>;reserve:(id:symbol,n:number)=>void;release:(id:symbol)=>void}>(set=>({
 leases:new Map(),reserve:(id,n)=>set(s=>({leases:new Map(s.leases).set(id,n)})),release:id=>set(s=>{const leases=new Map(s.leases);leases.delete(id);return {leases};}),
}));
export function useParticleSlots(request:number,active=true){
 const id=React.useRef(Symbol('fx')).current;
 React.useEffect(()=>{if(active)useBudget.getState().reserve(id,request);return ()=>useBudget.getState().release(id);},[id,request,active]);
 return useBudget(s=>{let used=0;for(const [key,n] of s.leases){const grant=Math.min(n,Math.max(0,12-used));if(key===id)return grant;used+=grant;}return 0;});
}
export function useBurstActive(){return useBudget(s=>s.leases.size>0);}
