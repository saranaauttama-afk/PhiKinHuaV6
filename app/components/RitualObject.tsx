import React from 'react';
import {Image} from 'react-native';
import {ENCOUNTER_OBJECTS} from './EncounterArt';
export const RITUAL_OBJECTS={upgrade:ENCOUNTER_OBJECTS.shop_upgrade,remove:ENCOUNTER_OBJECTS.shop_remove,shop:ENCOUNTER_OBJECTS.shop_card};
export default function RitualObject({kind,size=72}:{kind:'upgrade'|'remove';size?:number}){return <Image accessible={false} source={RITUAL_OBJECTS[kind]} resizeMode="contain" style={{width:size,height:size}}/>;}
