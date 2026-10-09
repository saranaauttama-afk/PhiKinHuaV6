import React from 'react';
import {View} from 'react-native';
import QuietPlayerHud,{HudStat} from '../QuietPlayerHud';
import SealPotButton from './SealPotButton';
type Props={blessings?:React.ReactNode;helpers?:React.ReactNode;statuses?:React.ReactNode;hp:number;maxHp:number;energy:number;maxEnergy:number;block:number;maxHandSize:number;drawCount:number;discardCount?:number;classId?:string;onEndTurn:()=>void;onOpenPiles?:()=>void;isEnemyTurn?:boolean;hudFlashKey?:number};
export default function PlayerHUD(p:Props){return <QuietPlayerHud classId={p.classId} hp={p.hp} maxHp={p.maxHp}
 stats={<><HudStat icon="energy" text={`${p.energy}/${p.maxEnergy}`} label="พลัง"/><HudStat icon="block" text={`${p.block}`} label="เกราะ"/><HudStat icon="deck" text={`${p.drawCount} / ${p.discardCount??0}`} label="ดูกองการ์ด" onPress={p.onOpenPiles}/></>}
 action={<SealPotButton disabled={p.isEnemyTurn} onPress={p.onEndTurn}/>}
 blessings={p.blessings}
 extras={<><View style={{flex:1}}>{p.helpers}</View><View style={{flex:2}}>{p.statuses}</View></>}/>;}
