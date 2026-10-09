import React from 'react';
import {Image} from 'react-native';
/** Existing illustrations with distinct subjects, without recolouring one icon. */
export const RITUAL_OBJECTS={
 upgrade:require('../../assets/cards/thai-v24/held_charm.webp'),
 remove:require('../../assets/ui/remove-torn-card-b17.webp'),
 shop:require('../../assets/cards/thai-v24/offering_tray.webp'),
};
export default function RitualObject({kind,size=72}:{kind:'upgrade'|'remove';size?:number}){return <Image accessible={false} source={RITUAL_OBJECTS[kind]} resizeMode="contain" style={{width:size,height:size}}/>;}
