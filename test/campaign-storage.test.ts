import {beforeEach,describe,it,expect,vi} from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useJournal} from '../src/store/journalStore';
import {useGame} from '../src/store/gameStore';
import {emptyJournal,recordRun} from '../src/core/campaign/journal';
import {baseNewState} from '../src/core/commands';
import {applyCommand} from '../src/core/reducer';
import {makeRng} from '../src/core/rng';
import {makeRunRecord} from '../src/core/campaign/metrics';
function ended(seed='storage-result'){
 let s=applyCommand(baseNewState(seed),{type:'NewRun',seed,classId:'warrior',difficulty:1},makeRng(seed)).state;
 s.campaign!.night=3;s.campaign!.completedNights=3;s.runSummary={won:true,fights:30,level:1,gold:0,beatSecretBoss:false};s.fightCount=30;return s;
}
beforeEach(async()=>{await AsyncStorage.clear();useJournal.setState({journal:emptyJournal(),ready:false,saving:false,error:''});vi.restoreAllMocks();});
describe('campaign persistence',()=>{
 it('new difficulty entry starts at night one and requires a complete three-night record to unlock the next tier',async()=>{
  expect(await useGame.getState().newDifficultyRun('new-locked','warrior',2)).toBe(false);expect(await useGame.getState().newDifficultyRun('new-run','warrior',1)).toBe(true);expect(useGame.getState().state.campaign).toMatchObject({night:1,difficulty:1,completedNights:0});
  const complete=structuredClone(useGame.getState().state);complete.campaign!.night=3;complete.campaign!.completedNights=3;complete.fightCount=30;complete.runSummary={won:true,fights:30,level:3,gold:50,beatSecretBoss:false};await useJournal.getState().addRun(complete);expect(await useGame.getState().newDifficultyRun('next-tier','warrior',2)).toBe(true);expect(useGame.getState().state.campaign).toMatchObject({night:1,difficulty:2});expect(await useGame.getState().newDifficultyRun('other-class','shaman',2)).toBe(false);
 });
 it('retains class progression when an unrelated run save is cleared',async()=>{
  await useJournal.getState().addRun(ended());await AsyncStorage.removeItem('phikinhua_autosave');useJournal.setState({ready:false,journal:emptyJournal()});await useJournal.getState().hydrate();expect(useJournal.getState().journal.classes.warrior.highestDifficulty).toBe(1);
 });
 it('serializes concurrent records without losing a completed run',async()=>{
  await Promise.all([useJournal.getState().addRun(ended('a')),useJournal.getState().addRun(ended('b'))]);expect(useJournal.getState().saving).toBe(false);const saved=JSON.parse((await AsyncStorage.getItem('phikinhua_journal_v1'))!);expect(saved.history).toHaveLength(2);expect(saved.classes.warrior.difficultyBest[1].wins).toBe(2);
 });
 it('failed writes preserve the result and retry saves it once',async()=>{
  vi.spyOn(AsyncStorage,'setItem').mockRejectedValueOnce(Error('disk'));await expect(useJournal.getState().addRun(ended())).rejects.toThrow();expect(useJournal.getState().error).toBeTruthy();expect(useJournal.getState().journal.history).toHaveLength(1);await useJournal.getState().retry();expect(useJournal.getState().error).toBe('');await useJournal.getState().addRun(ended());expect(useJournal.getState().journal.history).toHaveLength(1);
 });
 it('does not overwrite a corrupt profile during hydration',async()=>{
  await AsyncStorage.setItem('phikinhua_journal_v1','{"version":2}');await expect(useJournal.getState().hydrate()).rejects.toThrow();expect(useJournal.getState().ready).toBe(false);expect(await AsyncStorage.getItem('phikinhua_journal_v1')).toBe('{"version":2}');
 });
 it('discards a version-1 journal instead of misreading old single-night records',async()=>{
  await AsyncStorage.setItem('phikinhua_journal_v1',JSON.stringify({version:1,classes:{},history:[],recordedIds:[]}));await useJournal.getState().hydrate();expect(useJournal.getState().journal).toEqual(emptyJournal());
 });
 it('starting a locked difficulty fails; another class starts fresh without clearing records',async()=>{
  await useJournal.getState().addRun(ended());expect(await useGame.getState().newDifficultyRun('locked','warrior',3)).toBe(false);expect(await useGame.getState().newDifficultyRun('next','warrior',2)).toBe(true);expect(useGame.getState().state.campaign?.difficulty).toBe(2);expect(await useGame.getState().newDifficultyRun('other','shaman',1)).toBe(true);expect(useJournal.getState().journal.classes.warrior.highestDifficulty).toBe(1);expect(useGame.getState().state.classId).toBe('shaman');
 });
});
