import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {emptyArchive,parseArchive,mergeDiscovery,type ArchiveProfile,type DiscoveryRun} from '../core/archive/progress';
import type {GameState} from '../core/types';
const KEY='phikinhua_archive_v1';
let hydration:Promise<void>|undefined,writes:Promise<void>=Promise.resolve();
const pending=new Map<string,DiscoveryRun>();
let count=0;
type Store={profile:ArchiveProfile;ready:boolean;saving:boolean;error:string;hydrate:()=>Promise<void>;observe:(s:GameState)=>Promise<void>;retry:()=>Promise<void>};
function persist(profile:ArchiveProfile){
 const raw=JSON.stringify(profile);count++;useArchive.setState({saving:true});
 writes=writes.catch(()=>{}).then(()=>AsyncStorage.setItem(KEY,raw));
 return writes.then(()=>useArchive.setState({error:''}),e=>{useArchive.setState({error:'บันทึกอาถรรพ์ไม่สำเร็จ กรุณาลองอีกครั้ง'});throw e;}).finally(()=>{count--;useArchive.setState({saving:count>0});});
}
export const useArchive=create<Store>((set,get)=>({
 profile:emptyArchive(),ready:false,saving:false,error:'',
 hydrate:()=>{
  if(get().ready)return Promise.resolve();if(hydration)return hydration;
  hydration=(async()=>{try{
   const raw=await AsyncStorage.getItem(KEY);const stored=raw?parseArchive(raw):emptyArchive();let profile=stored;
   for(const run of pending.values())profile=mergeDiscovery(profile,run);
   pending.clear();set({profile,ready:true,error:''});if(profile!==stored)await persist(profile);
  }catch(e){set({error:get().ready?'บันทึกอาถรรพ์ไม่สำเร็จ กรุณาลองอีกครั้ง':'อ่านบันทึกอาถรรพ์ไม่สำเร็จ กรุณาลองอีกครั้ง'});throw e;}finally{hydration=undefined;}})();return hydration;
 },
 observe:async s=>{
  if(!s.discovery)return;const run:DiscoveryRun=JSON.parse(JSON.stringify(s.discovery));
  if(!get().ready){const old=pending.get(run.id);pending.set(run.id,mergeDiscovery({version:1,runs:old?{[run.id]:old}:{}},run).runs[run.id]);await get().hydrate();return;}
  const profile=mergeDiscovery(get().profile,run);if(profile===get().profile){await writes;return;}
  set({profile});await persist(profile);
 },
 retry:async()=>{if(!get().ready){await get().hydrate();return;}await persist(get().profile);},
}));
