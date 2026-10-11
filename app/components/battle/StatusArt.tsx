import React from 'react';
import {Image} from 'react-native';
/** Reuse the illustrated Thai subjects behind the corresponding effect. */
export const STATUS_ART:Record<string,any>={
 fear:require('../../../assets/cards/thai-v24/curse_dread.webp'),
 poison:require('../../../assets/cards/thai-v24/fused_needle_powder.webp'),
 curse:require('../../../assets/cards/thai-v24/curse_whisper.webp'),
 corruption:require('../../../assets/cards/thai-v24/black_magic.webp'),
 entangle:require('../../../assets/cards/thai-v24/night_hex_knot.webp'),
 weakness:require('../../../assets/cards/thai-v24/ghost_hand.webp'),
 vulnerable:require('../../../assets/cards/thai-v24/salt_in_wound.webp'),
 regeneration:require('../../../assets/blessings/thai-v24/herbal_wisdom.webp'),
 strength:require('../../../assets/cards/thai-v24/war_cry.webp'),
 block:require('../../../assets/cards/thai-v24/held_charm.webp'),
 block_next:require('../../../assets/cards/thai-v24/stand_firm.webp'),
 energy:require('../../../assets/blessings/thai-v24/spirit_energy.webp'),
 energy_boost:require('../../../assets/cards/thai-v24/spirit_lamp.webp'),
 draw_reduction:require('../../../assets/cards/thai-v24/whisper_ear.webp'),
 spell_charging:require('../../../assets/cards/thai-v24/count_beads.webp'),
 trap:require('../../../assets/ui/ritual-knife.png'),
 combo:require('../../../assets/cards/thai-v24/fighter_breath.webp'),
 check:require('../../../assets/cards/thai-v24/divine_protection.webp'),
 rest:require('../../../assets/cards/thai-v24/hell_gate.webp'),
 hp:require('../../../assets/cards/thai-v24/salt_in_wound.webp'),
};
export default function StatusArt({name,size=28}:{name:string;size?:number}){return <Image accessible={false} source={STATUS_ART[name]??STATUS_ART.curse} resizeMode="contain" style={{width:size,height:size}}/>;}
