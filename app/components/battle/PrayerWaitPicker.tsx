import React from 'react';
import {Text,View} from 'react-native';
import RitualSurface from '../RitualSurface';
import {QuietButton} from '../QuietChrome';
import {font,layer,pulpColors} from '../../theme';
import type {CardData} from '../../../src/core/types';
import {PRAYER_MULT} from '../../../src/core/balance/notfm';
import {fxText} from '../../../src/core/cards/describe';
import {starFx} from '../../../src/core/cards/model';
import {scaleFx} from '../../../src/core/cards/fx';

/** A prayer resolves after 1–3 of the player's turns; waiting longer multiplies it. */
export default function PrayerWaitPicker({card,multBonus=0,onPick,onCancel}:{card:CardData;multBonus?:number;onPick:(wait:number)=>void;onCancel:()=>void}){
 const fx=starFx(card);
 return <View pointerEvents="box-none" style={{position:'absolute',left:0,right:0,bottom:0,top:0,justifyContent:'center',padding:16,zIndex:layer.overlay}}>
  <RitualSurface kind="quietSlate" style={{padding:18,gap:10}}>
   <Text style={{fontFamily:font.heading,color:pulpColors.bone,fontSize:18}}>{card.name} · รอกี่เทิร์น</Text>
   {PRAYER_MULT.map((m,i)=><QuietButton key={i} label={`รอ ${i+1} เทิร์น · ${fxText(scaleFx(fx,m+multBonus)).join(' · ')}`} primary={i===0} onPress={()=>onPick(i+1)}/>)}
   <QuietButton label="ยกเลิก" onPress={onCancel}/>
  </RitualSurface>
 </View>;
}
