import EquipmentPicker from './components/EquipmentPicker';
// app/index.tsx — Clean version for redesign
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, { useMemo, useState, useEffect } from 'react';
import { BackHandler, Pressable, ScrollView, Text, TextInput, View, ImageBackground, Image } from 'react-native';
import { useAppFonts } from './useAppFonts';
import type { SaveSlotInfo } from '../src/core/storage';
import type { PageOffer } from '../src/core/map/pages';
import { useGame } from '../src/store/gameStore';

// Components
import StartPage from './components/StartPage';
import ShopView from './components/ShopView';
import DeckView from './components/DeckView';
import AdventureChoices from './components/AdventureChoices';
import {skippableSlots} from '../src/core/map/adventure';
import RunCompleteScreen from './components/RunCompleteScreen';
import ClassSelectScreen from './components/ClassSelectScreen';
import NightSelectScreen from './components/NightSelectScreen';
import JournalView from './components/JournalView';
import ArchiveView from './components/ArchiveView';
import type {ClassId} from '../src/core/classes';
import StarterBlessingScreen from './components/StarterBlessingScreen';
import StoryEventView from './components/StoryEventView';
import ChapterView from './components/ChapterView';
import SceneArrival from './components/SceneArrival';
import LoadingScreen from './components/LoadingScreen';
import { mapScene } from './scenePresentation';
import {paper} from './components/Paper';
import BlessingView from './components/BlessingView';
import PlayerStatusBar, { STATUS_BAR_SPACE } from './components/PlayerStatusBar';
import Panel, { GameButton, Scrim } from './components/Panel';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { screenForState, mapIsReady } from './screenRouter';
import { useScreenPadding } from './useScreenPadding';
import { palette, font, size, space, surface } from './theme';


export default function Home() {
  const { state, dispatch, newDifficultyRun, saveToSlot, loadFromSlot, getSaveSlots, continueRun } = useGame();
  const router = useRouter();
  const {chooseClass}=useLocalSearchParams();
  const [seed, setSeed] = useState('demo-001');
  const [saveSlots, setSaveSlots] = useState<SaveSlotInfo[]>([]);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [saveLoadError, setSaveLoadError] = useState<string>('');
  const [showDebugTools, setShowDebugTools] = useState(false);
  const [nightClass,setNightClass]=useState<ClassId|null>(null);
  const [journalOpen,setJournalOpen]=useState(false);
  const [archiveOpen,setArchiveOpen]=useState(false);
  const [pickingClass, setPickingClass] = useState(chooseClass==='1');
  const [equipmentOffer,setEquipmentOffer]=useState<number|null>(null);
  const [bagTab,setBagTab]=useState<'deck'|'blessings'>('deck');

  const [fontsLoaded] = useAppFonts();
  const pad = useScreenPadding();

  const returnToMainMenu = React.useCallback(() => {
    setPickingClass(false);
    setNightClass(null);
    setJournalOpen(false);
    setArchiveOpen(false);
    dispatch({type:'EnterMenu'});
  }, [dispatch]);

  useEffect(() => {
    const atEnding=state.phase==='run_complete'||(state.phase==='defeat'&&!!state.runSummary);
    if (!atEnding||state.chapter||journalOpen||nightClass||pickingClass) return;
    const back=BackHandler.addEventListener('hardwareBackPress',()=>{returnToMainMenu();return true;});
    return ()=>back.remove();
  }, [state.phase,state.chapter,state.runSummary,journalOpen,nightClass,pickingClass,returnToMainMenu]);

  useEffect(() => {
    if (['combat','victory','talk','levelup','reward'].includes(state.phase) && state.enemy && !state.chapter) router.replace({pathname:'/battle',params:{monsterId:state.enemy.id,monsterName:state.enemy.name}});
  },[state.phase,state.enemy?.id,state.chapter]);

  const page   = state.pages?.current;
  const offers = page?.offers ?? [];

  /** เลือก encounter — คอมแบตไปหน้าต่อสู้ ที่เหลือ engine เปลี่ยน phase เอง */
  const enterOffer = (offer: PageOffer, index: number) => {
    if((offer.kind==='monster'||offer.kind==='boss')&&state.masterDeck.some(c=>c.type==='equipment')){setEquipmentOffer(index);return;}
    dispatch({ type: 'ChooseOffer', index });

    // Restored and newly entered fights share the combat redirect above.
  };

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  // หน้าไหนควรขึ้น ตัดสินที่ `screenForState` ซึ่งเป็นฟังก์ชันบริสุทธิ์และมีเทสต์คุม
  // เดิมเป็น if-chain อยู่ตรงนี้ แล้วพลาดจนเปิดแอปมาค้างที่แผนที่เปล่า
  const screen = screenForState(state, { pickingClass });

  if(journalOpen)return <JournalView onClose={()=>setJournalOpen(false)}/>;
  if(archiveOpen)return <ArchiveView onClose={()=>setArchiveOpen(false)}/>;
  if(nightClass)return <NightSelectScreen classId={nightClass} onBack={()=>setNightClass(null)} onStart={async night=>{const ok=await newDifficultyRun(`run-${Date.now()}`,nightClass,night);if(ok){setNightClass(null);setPickingClass(false);}return ok;}}/>;
  if (screen === 'start') {
    return (
      <StartPage
        onStartGame={() => setPickingClass(true)}
        onJournal={()=>setJournalOpen(true)}
        onArchive={()=>setArchiveOpen(true)}
        onContinue={() => { void continueRun(); }}
      />
    );
  }

  // เลือกผู้เดินทางก่อนเริ่มรัน — คลาสกำหนดเด็คและวิธีเล่นทั้งรัน
  if (screen === 'class-select') {
    return (
      <ClassSelectScreen
        onPick={(classId) => setNightClass(classId)}
        onBack={() => state.runSummary?returnToMainMenu():setPickingClass(false)}
      />
    );
  }

  // บทคั่น — หยุดทุกอย่างไว้ก่อนจนกว่าจะอ่านจบหรือกดข้าม
  if (screen === 'chapter') {
    return <ChapterView state={state} dispatch={dispatch} />;
  }

  // จบรันแล้ว — แสดงจอสรุปแทนการเด้งกลับแผนที่ที่ไม่มีอะไรเหลือ
  if (screen === 'run-complete') {
    return <RunCompleteScreen state={state} onMainMenu={returnToMainMenu} onJournal={()=>setJournalOpen(true)} onNewRun={() => setPickingClass(true)} />;
  }

  // เลือกพรตั้งต้นก่อนเข้าหน้าแรก
  if (screen === 'starter-blessing') {
    return <StarterBlessingScreen state={state} choices={state.starter?.choices ?? []} onPick={index => dispatch({ type: 'ChooseStarterBlessing', index })} />;
  }

  // มาถึงหน้าแผนที่โดยไม่มีเส้นทาง = หลุดมาผิดทาง (เช่นเซฟเก่าก่อนมีระบบเส้นทาง)
  // เดิมกรณีนี้จะได้จอเปล่าที่กดอะไรไม่ได้เลย ต้องมีทางออกให้เสมอ
  if (!mapIsReady(state)) {
    return (
      <View style={{ flex: 1 }}>
        <ImageBackground
          source={require('../assets/scence/episode-village.jpg')}
          style={{ flex: 1 }}
          resizeMode="cover"
        >
          <Scrim heavy style={{ justifyContent: 'center', paddingHorizontal: space.xl }}>
            <Text style={{
              color: palette.moon, fontSize: size.title, fontFamily: font.display,
              textAlign: 'center',
            }}>
              ไม่พบเส้นทางของรันนี้
            </Text>
            <Text style={{
              color: palette.textDim, fontSize: size.bodyLg, fontFamily: font.body,
              textAlign: 'center', marginTop: space.sm, lineHeight: 26,
            }}>
              อาจเป็นเซฟที่บันทึกไว้ก่อนระบบแผนที่จะเปลี่ยน เริ่มการเดินทางใหม่ได้เลย
            </Text>
            <GameButton
              label="ออกเดินทางใหม่"
              tone="primary"
              onPress={() => setPickingClass(true)}
              style={{ marginTop: space.xl, alignSelf: 'center' }}
            />
          </Scrim>
        </ImageBackground>
      </View>
    );
  }

  // Events own their full-screen arrival; never start it inside a fading map.
  if (state.phase === 'event' && state.story) {
    return <StoryEventView state={state} dispatch={dispatch} />;
  }
  const location = mapScene(state);
  return (
    <View style={{ flex: 1 }}>
      <SceneArrival instant={state.pages?.adventure?.enteredBoard===state.pages?.adventure?.boardIndex} sceneKey={`${location.key}:board-${state.pages?.adventure?.boardIndex}`} source={location.source}>
        <Scrim style={{ paddingTop: pad.top }}>

          <View style={{flex:1,paddingBottom:STATUS_BAR_SPACE+pad.bottom}}><AdventureChoices appearanceKey={`${state.phase}:${state.fightCount??0}`} runKey={`${state.seed}:${state.campaign?.night??0}`} offers={offers} resolved={page?.resolved??[]} slotIds={state.pages?.adventure?.slotIds??offers.map((_,i)=>String(i))} onEnter={enterOffer} usedIds={state.pages?.adventure?.usedIds} onDestroy={index=>dispatch({type:'DeleteShopFromMap',index})} skipCount={skippableSlots(state).length}/></View>

          {/* Game Components — คอมแบตอยู่ที่ app/battle.tsx แล้ว ไม่ได้อยู่ตรงนี้ */}
          {/* MapView เดิมถูกลบทิ้ง — เป็นแผงดีบั๊กภาษาอังกฤษที่โชว์ตัวเลข pool
              กับ "Page X/Y" ซึ่งไม่มีความหมายอีกแล้วบนแผนที่แบบเส้นทาง
              และยังมีรายการทางเลือกซ้ำกับการ์ด encounter ด้านบนอีกชุด */}
          <ShopView state={state} dispatch={dispatch} />



          <PlayerStatusBar
            state={state}
            onOpenDeck={() => {setBagTab('deck');dispatch({ type: 'OpenDeck' });}}
            onOpenBlessings={() => {setBagTab('blessings');dispatch({type:'OpenDeck'});}}
            onUseSkill={(id, index) => dispatch({ type: 'UseSkill', id, index })}
          />

        </Scrim>
      </SceneArrival>

      {/* BlessingDialog/EncounterDialog แบบ mock ถูกแทนด้วยหน้าเลือกพรจริง
          และการ์ด encounter ที่มาจาก state.pages แล้ว */}

      {/* สำรับเป็นจอทับเต็มจอ วางนอก Scrim เพื่อให้อยู่เหนือทุกอย่าง
          เดิมวางเป็นบล็อกไหลอยู่ในคอลัมน์กลางแผนที่ จึงล้นออกนอกจอ */}
      {equipmentOffer!==null&&<EquipmentPicker state={state} onCancel={()=>setEquipmentOffer(null)} onConfirm={equipmentIndices=>{const index=equipmentOffer;setEquipmentOffer(null);dispatch({type:'ChooseOffer',index,equipmentIndices});}}/>}
      <DeckView state={state} dispatch={dispatch} initialTab={bagTab} />



    </View>
  );
}
