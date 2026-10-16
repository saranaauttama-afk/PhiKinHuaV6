import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from 'zustand';
export type EnemySpeed=1|1.5|2;
type Settings={reducedMotion:boolean;enemySpeed:EnemySpeed;setReducedMotion:(v:boolean)=>void;setEnemySpeed:(v:EnemySpeed)=>void;hydrate:()=>Promise<void>};
const persist=(s:{reducedMotion:boolean;enemySpeed:EnemySpeed})=>void AsyncStorage.setItem('phi-ui-settings',JSON.stringify({reducedMotion:s.reducedMotion,enemySpeed:s.enemySpeed})).catch(()=>{});
export const useGameSettings=create<Settings>((set,get)=>({
 reducedMotion:false,enemySpeed:1,
 setReducedMotion:v=>{set({reducedMotion:v});persist(get());},
 setEnemySpeed:v=>{set({enemySpeed:v});persist(get());},
 hydrate:async()=>{try{const raw=await AsyncStorage.getItem('phi-ui-settings');if(raw){const s=JSON.parse(raw);set({reducedMotion:s.reducedMotion===true,enemySpeed:s.enemySpeed===1.5||s.enemySpeed===2?s.enemySpeed:1});}}catch{}},
}));
