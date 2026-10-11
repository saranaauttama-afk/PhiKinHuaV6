/** Test-build-only review of the same production route/battle wrappers.
 * No store, progression or campaign writes. */
import React from 'react';
import {Platform,Pressable,Text,View,StyleSheet} from 'react-native';
import {useLocalSearchParams} from 'expo-router';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppFonts} from './useAppFonts';
import {makeRng} from '../src/core/rng';
import {applyCommand} from '../src/core/reducer';
import {baseNewState} from '../src/core/commands';
import type {Command} from '../src/core/types';
import {paperEnvironment} from '../src/visual/paperEnvironments';
import {PAPER_SCENE_ASSETS} from './paperSceneAssets';
import SceneArrival from './components/SceneArrival';
import BattleBackdrop from './components/battle/BattleBackdrop';
import MonsterArea from './components/battle/MonsterArea';
import PlayerHand from './components/battle/PlayerHand';
import PlayerHUD from './components/battle/PlayerHUD';
import StatusStrip from './components/battle/StatusStrip';
import BlessingSeals from './components/battle/BlessingSeals';
import Settings from './components/Settings';
import {font,palette,layer} from './theme';
import SceneGhostChoices from './components/SceneGhostChoices';
import {describeOffer} from './components/offerDisplay';

export default function EnvironmentReview(){
 const params=useLocalSearchParams<{sceneId?:string;ghostId?:string}>(),[loaded]=useAppFonts(),safe=useSafeAreaInsets();
 const sceneId=paperEnvironment(params.sceneId??'')?.id??'01-village',ghostId=params.ghostId??'phi-pop';
 const [mode,setMode]=React.useState<'route'|'battle'>('route'),[selected,setSelected]=React.useState<number|null>(null),[showSettings,setShowSettings]=React.useState(false);
 const seed='paper-rollout-review';
 const initial=React.useMemo(()=>{let state=baseNewState(seed),rng=makeRng(seed);for(const cmd of [{type:'NewRun',seed,classId:'warrior',difficulty:1},{type:'SkipChapter'},{type:'ChooseStarterBlessing',index:0},{type:'StartCombat',monsterId:ghostId}] as Command[])({state,rng}=applyCommand(state,cmd,rng));return{state,rng};},[ghostId]);
 const [snapshot,setSnapshot]=React.useState(initial);
 React.useEffect(()=>{setSnapshot(initial);setMode('route');setSelected(null);},[sceneId,initial]);
 const dispatch=(cmd:Command)=>setSnapshot(s=>applyCommand(s.state,cmd,s.rng));
 const enabled=process.env.EXPO_PUBLIC_DIORAMA_REVIEW==='1';
 if(!enabled||!loaded)return <View style={{flex:1,backgroundColor:palette.ink}}/>;
 const state=snapshot.state,source=PAPER_SCENE_ASSETS[sceneId];
 const hud=<>
  <MonsterArea monsterId={ghostId} enemy={state.enemy}/>
  <PlayerHand state={state} cards={state.piles.hand} energy={state.player.energy} enabled={state.phase==='combat'} playedCardIds={[]} hoveredCardId={null} onHoverChange={()=>{}} onPlayCard={(_,index)=>dispatch({type:'PlayCard',index})}/>
  <PlayerHUD classId={state.classId} hp={state.player.hp} maxHp={state.player.maxHp} block={state.player.block} energy={state.player.energy} maxEnergy={state.player.maxEnergy} maxHandSize={state.player.maxHandSize} drawCount={state.piles.draw.length} discardCount={state.piles.discard.length} onEndTurn={()=>dispatch({type:'EndTurn'})} blessings={<BlessingSeals blessings={state.blessings}/>} statuses={<StatusStrip effects={state.player.statusEffects}/>} />
 </>;
 const route=<View style={{flex:1,paddingTop:safe.top+40,paddingBottom:safe.bottom+30}}><SceneGhostChoices choices={[{display:describeOffer({kind:'monster',enemyId:ghostId,tier:'normal'} as any,0),resolved:false,index:0}]} selected={selected} onSelect={setSelected} onEnter={()=>setMode('battle')}/></View>;
 return <View style={{flex:1,overflow:'hidden'}}>
  {mode==='route'?<SceneArrival sceneId={sceneId} sceneKey={sceneId+':review-route'} source={source}>{route}</SceneArrival>:<BattleBackdrop source={source} sceneId={sceneId} entryKey={sceneId+':review-battle'} ghostId={ghostId}>{hud}</BattleBackdrop>}
  <View style={{position:'absolute',left:8,right:8,top:safe.top+4,flexDirection:'row',gap:12,zIndex:layer.control}}>
   <Pressable accessibilityRole="button" accessibilityLabel="กลับฉากทดลอง" onPress={()=>{setMode('route');setSelected(null);setSnapshot(initial);}} style={{padding:8}}><Text style={{fontFamily:font.ui,fontSize:11,color:palette.moon}}>กลับฉาก</Text></Pressable><View style={{flex:1}}/><Pressable accessibilityRole="button" accessibilityLabel="ตั้งค่า" onPress={()=>setShowSettings(true)} style={{padding:8}}><Text style={{fontFamily:font.ui,fontSize:11,color:palette.moon}}>ตั้งค่า</Text></Pressable>
  </View>
  {showSettings&&<Settings onClose={()=>setShowSettings(false)}/>}
  {Platform.OS==='web'&&<Text testID="rollout-review-state" style={{position:'absolute',opacity:0,width:1,height:1}}>{JSON.stringify({sceneId,ghostId,mode,turn:state.turn,phase:state.phase,hand:state.piles.hand.map(c=>c.id)})}</Text>}
 </View>;
}
