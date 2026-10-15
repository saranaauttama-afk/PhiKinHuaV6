import React from 'react';
import {Image,Text,View} from 'react-native';
import type {Move} from '../../src/core/types';
import {MOVE_NAMES} from '../../src/core/cards/fighter';
import {fighterColors,font} from '../theme';
const GOLD=fighterColors.hint;

const MOVE_ART:Record<Move,any>={
 punch:require('../../assets/ui/moves/move_punch.webp'),
 kick:require('../../assets/ui/moves/move_kick.webp'),
 knee:require('../../assets/ui/moves/move_knee.webp'),
 elbow:require('../../assets/ui/moves/move_elbow.webp'),
};

/**
 * ท่า of a นักมวย card on its face: the move icon, and the move it continues (ต่อจาก) as a small
 * "‹" icon after it (move first: only the left edge shows when the hand overlaps). Why it is on the card: rhythm and ต่อจาก both depend on move order, so the player must
 * read the move without opening the card (docs/nak-muay/DESIGN.md).
 * `hint` lights the icon in the hand: gold ring = gains จังหวะ now, ต่อจาก lit = bonus is live.
 */
export default function MoveMark({move,after,size=20,hint}:{move?:Move;after?:Move;size?:number;hint?:{rhythm:boolean;after:boolean}}){
 if(!move&&!after)return null;
 const label=[move&&`ท่า${MOVE_NAMES[move]}`,after&&`ต่อจาก${MOVE_NAMES[after]}${hint?.after?' (ติดแล้ว)':''}`,hint?.rhythm&&'ได้จังหวะ'].filter(Boolean).join(' · ');
 return <View testID="move-mark" accessibilityLabel={label} style={{flexDirection:'row',alignItems:'center',gap:1}}>
  {move&&<View style={{borderRadius:size,borderWidth:hint?.rhythm?2:0,borderColor:GOLD,padding:hint?.rhythm?0:2}}>
   <Image accessible={false} source={MOVE_ART[move]} style={{width:size,height:size}} resizeMode="contain"/>
  </View>}
  {after&&<View style={{flexDirection:'row',alignItems:'center',opacity:hint?.after?1:.55}}>
   <Text style={{fontFamily:font.heading,fontSize:size*.5,color:hint?.after?GOLD:fighterColors.idle,marginHorizontal:-1}}>‹</Text>
   <Image accessible={false} source={MOVE_ART[after]} style={{width:size*.7,height:size*.7}} resizeMode="contain"/>
  </View>}
 </View>;
}
