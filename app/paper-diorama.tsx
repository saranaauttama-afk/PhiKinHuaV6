import React from 'react';
import {Platform, Pressable, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import Animated, {cancelAnimation, Easing, runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming} from 'react-native-reanimated';
import {battleGeometry} from './battleGeometry';
import {BattleLayoutContext} from './components/battle/battleLayout';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {applyCommand} from '../src/core/reducer';
import {makeRng} from '../src/core/rng';
import type {Command, GameState} from '../src/core/types';
import {requiredDiscards} from '../src/core/cards/hand';
import {PAPER_GHOST_ID, PAPER_ASSEMBLY_MS, paperHudOpacity} from '../src/visual/paperDiorama';
import {useAppFonts} from './useAppFonts';
import {font, palette, layer, paperDioramaColors as ink} from './theme';
import Settings, {useGameSettings} from './components/Settings';
import {QuietButton, QuietPage} from './components/QuietChrome';
import RitualSurface from './components/RitualSurface';
import PaperDiorama from './components/paper/PaperDiorama';
import {usePaperMotion} from './components/paper/usePaperMotion';
import MonsterArea from './components/battle/MonsterArea';
import PlayerHand from './components/battle/PlayerHand';
import PlayerHUD from './components/battle/PlayerHUD';
import StatusStrip from './components/battle/StatusStrip';
import BlessingSeals from './components/battle/BlessingSeals';
import DiscardOverlay from './components/battle/DiscardOverlay';

function previewBattle() {
  const seed = 'paper-village-preview'; let rng = makeRng(seed);
  let state = {seed, turn:0, phase:'start'} as GameState;
  for (const command of [{type:'NewRun', seed, classId:'warrior',difficulty:1}, {type:'SkipChapter'}, {type:'ChooseStarterBlessing', index:0}, {type:'StartCombat', monsterId:PAPER_GHOST_ID}] as Command[]) {
    const result = applyCommand(state, command, rng); state = result.state; rng = result.rng;
  }
  return {state, rng};
}

/** Opt-in, isolated one-route review. Never writes a run, journal or discoveries. */
export default function PaperDioramaPreview() {
  const [loaded] = useAppFonts(), safe = useSafeAreaInsets(),window=useWindowDimensions();
  const [viewport,setViewport]=React.useState({width:window.width,height:window.height});
  const layout=React.useMemo(()=>battleGeometry(viewport.width,viewport.height,safe.top,safe.bottom),[viewport.width,viewport.height,safe.top,safe.bottom]);
  const enabled = process.env.EXPO_PUBLIC_PAPER_DIORAMA === '1';
  const [snapshot, setSnapshot] = React.useState(previewBattle);
  const [phase, setPhase] = React.useState<'route'|'arrival'|'battle'>('route');
  const [selected, setSelected] = React.useState(false), [discard, setDiscard] = React.useState(false);
  const settings = useGameSettings(), motion = usePaperMotion();
  const assembly = useSharedValue(PAPER_ASSEMBLY_MS), x = useSharedValue(0), y = useSharedValue(0);
  const arrivalId = React.useRef(0), animateEntry=React.useRef(true);
  const [showSettings,setShowSettings]=React.useState(false),[assetsReady,setAssetsReady]=React.useState(false);
  const onReady=React.useCallback(()=>setAssetsReady(true),[]);
  const ready=loaded&&settings.hydrated&&motion.ready;
  const hudStyle=useAnimatedStyle(()=>({opacity:paperHudOpacity(assembly.value)}));
  const finishArrival = React.useCallback((id:number) => {if(id===arrivalId.current)setPhase(current=>current==='arrival'?'battle':current);}, []);
  React.useEffect(()=>{
    cancelAnimation(x);cancelAnimation(y);x.value=0;y.value=0;
    if(!enabled||!ready||phase!=='battle'||motion.reduced||!motion.active)return;
    x.value=withRepeat(withSequence(withTiming(1,{duration:16000,easing:Easing.inOut(Easing.sin)}),withTiming(-1,{duration:16000,easing:Easing.inOut(Easing.sin)})),-1);
    return ()=>{cancelAnimation(x);cancelAnimation(y);};
  },[enabled,ready,phase,motion.reduced,motion.active,x,y]);
  React.useEffect(()=>{
    const id=++arrivalId.current;cancelAnimation(assembly);
    if(!ready)return;
    if(phase==='arrival'){
      if(!animateEntry.current||motion.reduced||!motion.active){assembly.value=PAPER_ASSEMBLY_MS;finishArrival(id);}
      else assembly.value=withTiming(PAPER_ASSEMBLY_MS,{duration:PAPER_ASSEMBLY_MS,easing:Easing.linear},complete=>{if(complete)runOnJS(finishArrival)(id);});
    }else assembly.value=PAPER_ASSEMBLY_MS;
    return ()=>{++arrivalId.current;cancelAnimation(assembly);};
  },[ready,phase,motion.reduced,motion.active,assembly,finishArrival]);
  const reset=()=>{++arrivalId.current;cancelAnimation(assembly);assembly.value=PAPER_ASSEMBLY_MS;setSnapshot(previewBattle());setPhase('route');setSelected(false);setDiscard(false);};
  const enter=()=>{animateEntry.current=settings.dioramaAnimation&&!motion.reduced;assembly.value=animateEntry.current?0:PAPER_ASSEMBLY_MS;setPhase('arrival');};
  const dispatch = (command:Command) => setSnapshot(current => {const out = applyCommand(current.state,command,current.rng); return {state:out.state,rng:out.rng};});
  const endTurn = () => {if(phase!=='battle')return;if(requiredDiscards(snapshot.state)>0)setDiscard(true);else dispatch({type:'EndTurn'});};
  if (!enabled) return <QuietPage title="ฉากทดลอง"><Text style={{color:palette.text}}>เปิดเฉพาะ Web Preview ของฉากต้นแบบ</Text></QuietPage>;
  if (!ready) return <View style={{flex:1,backgroundColor:ink.loading}}><Text style={{color:palette.moon}}>กำลังเปิดฉาก…</Text></View>;
  const state = snapshot.state;
  return <View onLayout={event=>{const {width,height}=event.nativeEvent.layout;if(width>0&&height>0)setViewport(current=>current.width===width&&current.height===height?current:{width,height});}} testID="paper-preview" style={{flex:1,overflow:'hidden',backgroundColor:ink.backing}}>
    <BattleLayoutContext.Provider value={layout}>
    <PaperDiorama assembly={assembly} x={x} y={y} onReady={onReady}/>
    {/* No camera transform is an ancestor of this screen-space HUD. */}
    <View testID="paper-screen-ui" pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {phase!=='arrival'&&<View style={{position:'absolute',left:12,right:12,top:safe.top+7,zIndex:layer.control,flexDirection:'row',alignItems:'center',gap:8}}>
        <Pressable accessibilityRole="button" accessibilityLabel="กลับฉากเส้นทาง" onPress={reset} style={{padding:9,backgroundColor:ink.controls,borderColor:ink.controlEdge,borderWidth:1}}><Text style={{fontFamily:font.ui,color:palette.moon,fontSize:11}}>กลับฉาก</Text></Pressable>
        <View style={{flex:1}}/>
        <Pressable accessibilityRole="button" accessibilityLabel="ตั้งค่า" onPress={()=>setShowSettings(true)} style={{padding:9,backgroundColor:ink.controls,borderColor:ink.controlEdge,borderWidth:1}}><Text style={{fontFamily:font.ui,color:palette.moon,fontSize:11}}>ตั้งค่า</Text></Pressable>
      </View>}
      {phase==='route'&&<>
        <Pressable testID="paper-route-select" accessibilityRole="button" accessibilityLabel="เลือกเส้นทางผีตายโหงเรือนร้าง" onPress={()=>setSelected(true)} style={{position:'absolute',top:'14%',left:'20%',right:'20%',height:'34%'}}/>
        <View style={{position:'absolute',left:20,right:20,bottom:safe.bottom+28,gap:10}}>
          <RitualSurface kind="quietSlate" style={{padding:18,gap:7}}>
            <Text style={{fontFamily:font.display,fontSize:25,color:palette.moon}}>ชายหมู่บ้าน</Text>
            <Text style={{fontFamily:font.body,fontSize:22,color:palette.text,lineHeight:28}}>เสียงฝีเท้าดังจากใต้ถุนเรือน…</Text>
            <Text style={{fontFamily:font.ui,fontSize:12,color:palette.textDim}}>{selected?'ผีตายโหงเรือนร้าง · เตรียมเผชิญหน้า':'แตะผีเพื่อเลือกเส้นทาง'}</Text>
          </RitualSurface>
          <QuietButton label="เดินเข้าหมู่บ้าน" disabled={!selected||!assetsReady} primary onPress={enter}/>
        </View>
      </>}
      {(phase==='arrival'||phase==='battle')&&<Animated.View testID="paper-battle-ui" pointerEvents={phase==='battle'?'box-none':'none'} accessibilityElementsHidden={phase!=='battle'} importantForAccessibility={phase==='battle'?'auto':'no-hide-descendants'} style={[StyleSheet.absoluteFill,hudStyle]}>
        <MonsterArea hideArtwork monsterId={PAPER_GHOST_ID} enemy={state.enemy}/>
        <PlayerHand state={state} enabled={phase==='battle'&&state.phase==='combat'} cards={state.piles.hand} energy={state.player.energy} playedCardIds={[]} hoveredCardId={null} onHoverChange={()=>{}} onPlayCard={(_,index)=>dispatch({type:'PlayCard',index})}/>
        <PlayerHUD classId={state.classId} hp={state.player.hp} maxHp={state.player.maxHp} energy={state.player.energy} maxEnergy={state.player.maxEnergy} block={state.player.block} maxHandSize={state.player.maxHandSize} drawCount={state.piles.draw.length} discardCount={state.piles.discard.length} onEndTurn={endTurn} blessings={<BlessingSeals blessings={state.blessings}/>} statuses={<StatusStrip effects={state.player.statusEffects}/>}/>
        {state.phase!=='combat'&&<View style={{position:'absolute',left:24,right:24,top:'44%',zIndex:layer.battleOverlay}}><QuietButton label="ลองฉากอีกครั้ง" primary onPress={reset}/></View>}
      </Animated.View>}
      {showSettings&&<Settings onClose={()=>setShowSettings(false)}/>}
      {discard&&<DiscardOverlay cards={state.piles.hand} maxHandSize={state.player.maxHandSize!} onCancel={()=>setDiscard(false)} onConfirm={indices=>{for(const index of [...indices].sort((a,b)=>b-a))dispatch({type:'DiscardCard',index});setDiscard(false);dispatch({type:'EndTurn'});}}/>}
    </View>
    {Platform.OS==='web'&&<Text testID="paper-state" pointerEvents="none" style={{position:'absolute',opacity:0,width:1,height:1}}>{JSON.stringify({phase,reduced:motion.reduced,active:motion.active,enemy:state.enemy?.id,hand:state.piles.hand.map(c=>c.id),turn:state.turn,eventTypes:state.pendingEvents?.map(e=>e.t)??[],assemblyMs:PAPER_ASSEMBLY_MS,animationOn:settings.dioramaAnimation,assetsReady,progressionWritten:false,viewport,safe})}</Text>}
  </BattleLayoutContext.Provider>
  </View>;
}
