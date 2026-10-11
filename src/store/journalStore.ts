import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {GameState} from '../core/types';
import type {ClassId} from '../core/classes';
import {emptyJournal,parseJournal,recordRun,claimUnlock,type Journal} from '../core/campaign/journal';
import {makeRunRecord} from '../core/campaign/metrics';

const KEY='phikinhua_journal_v1';
let hydration:Promise<void>|undefined;
let writes:Promise<void>=Promise.resolve();
let pendingWrites=0;
function persist(journal:Journal){
 const raw=JSON.stringify(journal);pendingWrites++;useJournal.setState({saving:true});
 writes=writes.catch(()=>{}).then(()=>AsyncStorage.setItem(KEY,raw));
 return writes.finally(()=>{pendingWrites--;useJournal.setState({saving:pendingWrites>0});});
}
type Store={journal:Journal;ready:boolean;saving:boolean;error:string;hydrate:()=>Promise<void>;retry:()=>Promise<void>;
 addRun:(s:GameState)=>Promise<void>;claim:(id:ClassId,kind:'card'|'blessing')=>Promise<void>};
export const useJournal=create<Store>((set,get)=>({
 journal:emptyJournal(),ready:false,saving:false,error:'',
 hydrate:()=>{
  if(get().ready)return Promise.resolve();
  if(hydration)return hydration;
  hydration=(async()=>{
   try{const raw=await AsyncStorage.getItem(KEY);set({journal:raw?parseJournal(raw):emptyJournal(),ready:true,error:''});}
   catch(e){set({error:'อ่านสมุดบันทึกไม่สำเร็จ กรุณาลองอีกครั้ง'});throw e;}
   finally{hydration=undefined;}
  })();return hydration;
 },
 retry:async()=>{if(!get().ready){await get().hydrate();return;}set({saving:true});try{await persist(get().journal);set({error:''});}catch(e){set({error:'บันทึกสมุดไม่สำเร็จ กรุณาลองอีกครั้ง'});throw e;}},
 addRun:async s=>{
  const record=makeRunRecord(s,new Date().toISOString());if(!record)return;
  await get().hydrate();const next=recordRun(get().journal,record);if(next===get().journal){if(get().error)throw Error(get().error);return;}
  set({journal:next,saving:true});try{await persist(next);set({error:''});}catch(e){set({error:'บันทึกสมุดไม่สำเร็จ กรุณาลองอีกครั้ง'});throw e;}
 },
 claim:async(id,kind)=>{
  await get().hydrate();if(get().saving||get().error)return;
  const next=claimUnlock(get().journal,id,kind);if(next===get().journal)return;
  set({journal:next,saving:true});try{await persist(next);set({error:''});}catch(e){set({error:'บันทึกของปลดล็อกไม่สำเร็จ กรุณาลองอีกครั้ง'});throw e;}
 },
}));
