// app/index.tsx — Clean version for redesign
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, { useMemo, useState, useEffect } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, ImageBackground, Image } from 'react-native';
import { useAppFonts } from './useAppFonts';
import type { SaveSlotInfo } from '../src/core/storage';
import type { PageOffer } from '../src/core/map/pages';
import { useGame } from '../src/store/gameStore';
import { describeOffer } from './components/offerDisplay';

// Components
import StartPage from './components/StartPage';
import ShopView from './components/ShopView';
import DeckView from './components/DeckView';
import RestDestinations from './components/RestDestinations';
import SceneGhostChoices from './components/SceneGhostChoices';
import RunCompleteScreen from './components/RunCompleteScreen';
import ClassSelectScreen from './components/ClassSelectScreen';
import NightSelectScreen from './components/NightSelectScreen';
import JournalView from './components/JournalView';
import type {ClassId} from '../src/core/classes';
import JourneyTrail from './components/JourneyTrail';
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
import { onRestRow } from '../src/core/map/restPage';
import { nextRowPreview } from '../src/core/map/journeySync';
import { palette, font, size, space, surface } from './theme';


export default function Home() {
  const { state, dispatch, newRun, newNightRun, saveToSlot, loadFromSlot, getSaveSlots, continueRun } = useGame();
  const router = useRouter();
  const {chooseClass}=useLocalSearchParams();
  const [seed, setSeed] = useState('demo-001');
  const [saveSlots, setSaveSlots] = useState<SaveSlotInfo[]>([]);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [saveLoadError, setSaveLoadError] = useState<string>('');
  const [showDebugTools, setShowDebugTools] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [nightClass,setNightClass]=useState<ClassId|null>(null);
  const [journalOpen,setJournalOpen]=useState(false);
  const [pickingClass, setPickingClass] = useState(chooseClass==='1');
  const [blessingsOpen, setBlessingsOpen] = useState(false);
  const enteredRest = React.useRef<string | null>(null);

  const [fontsLoaded] = useAppFonts();
  const pad = useScreenPadding();

  useEffect(() => {
    if (state.phase === 'combat' && state.enemy) router.replace({pathname:'/battle',params:{monsterId:state.enemy.id,monsterName:state.enemy.name}});
  },[state.phase,state.enemy?.id]);

  const page   = state.pages?.current;
  const offers = page?.offers ?? [];

  // ชั้นสู้: เลือกทางไหนก็เดินไปทางนั้น ไม่มีการวนเก็บให้ครบก่อนไปต่อ
  // ชั้นพัก: เคลียร์ได้ทุกช่อง ช่องที่เคลียร์แล้วมีของใหม่ขึ้นแทนจนโควตาหมด
  //          แล้วกดเดินต่อเมื่อไหร่ก็ได้ (ดู `map/restPage.ts`)
  const restRow = onRestRow(state);
  const ahead   = restRow ? nextRowPreview(state) : undefined;

  /** เลือก encounter — คอมแบตไปหน้าต่อสู้ ที่เหลือ engine เปลี่ยน phase เอง */
  const enterOffer = (offer: PageOffer, index: number) => {
    if (restRow) enteredRest.current = mapScene(state).key;
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
  if(nightClass)return <NightSelectScreen classId={nightClass} onBack={()=>setNightClass(null)} onStart={async night=>{const ok=await newNightRun(`night-${Date.now()}`,nightClass,night);if(ok){enteredRest.current=null;setNightClass(null);setPickingClass(false);}return ok;}}/>;
  if (screen === 'start') {
    return (
      <StartPage
        onStartGame={() => setPickingClass(true)}
        onJournal={()=>setJournalOpen(true)}
        onContinue={() => { void continueRun(); }}
      />
    );
  }

  // เลือกผู้เดินทางก่อนเริ่มรัน — คลาสกำหนดเด็คและวิธีเล่นทั้งรัน
  if (screen === 'class-select') {
    return (
      <ClassSelectScreen
        onPick={(classId) => setNightClass(classId)}
        onBack={() => setPickingClass(false)}
      />
    );
  }

  // บทคั่น — หยุดทุกอย่างไว้ก่อนจนกว่าจะอ่านจบหรือกดข้าม
  if (screen === 'chapter') {
    return <ChapterView state={state} dispatch={dispatch} />;
  }

  // จบรันแล้ว — แสดงจอสรุปแทนการเด้งกลับแผนที่ที่ไม่มีอะไรเหลือ
  if (screen === 'run-complete') {
    return <RunCompleteScreen state={state} onJournal={()=>setJournalOpen(true)} onNewRun={() => setPickingClass(true)} />;
  }

  // เลือกพรตั้งต้นก่อนเข้าหน้าแรก
  if (screen === 'starter-blessing') {
    return <StarterBlessingScreen choices={state.starter?.choices ?? []} onPick={index => dispatch({ type: 'ChooseStarterBlessing', index })} />;
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
      <SceneArrival instant={restRow && enteredRest.current === location.key} sceneKey={location.key} source={location.source}>
        <Scrim style={{ paddingTop: pad.top }}>
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: surface.glassDim, opacity: selectedCard !== null && offers.some((o, i) => o && describeOffer(o, i).isCombat) ? .55 : 0 }} />

          {/* เส้นทางทั้งรัน — เห็นว่าเดินมาไกลแค่ไหนและบอสอยู่ตรงไหน */}
          {state.runMode === 'episode' && (
            <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
              <Text style={{ color: palette.moon, fontFamily: font.heading, fontSize: size.heading }}>คืนแรกที่บ้านร้าง</Text>
              <Text style={{ color: palette.text, fontFamily: font.ui, fontSize: size.label }}>ปราบผี {state.fightCount ?? 0}/3 · {restRow ? 'แตะสถานที่เพื่อแวะ หรือเดินผ่าน' : 'แตะเลือกผี แล้วกดเผชิญหน้า'}</Text>
            </View>
          )}
          {state.campaign&&<Text style={{color:palette.moon,fontFamily:font.heading,fontSize:18,paddingHorizontal:16}}>คืนที่ {state.campaign.night} · ปราบผี {state.fightCount??0}/15</Text>}
          <JourneyTrail state={state} compact={restRow} />

          {offers.some((o, i) => o && describeOffer(o, i).isCombat) ? (
            <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: STATUS_BAR_SPACE + pad.bottom }}>
              <SceneGhostChoices choices={offers.flatMap((offer, index) => offer ? [{ display: describeOffer(offer, index), resolved: page?.resolved[index] ?? false, index }] : [])}
                selected={selectedCard} onSelect={setSelectedCard}
                onEnter={index => { const offer = offers[index]; if (offer && !page?.resolved[index]) { setSelectedCard(null); enterOffer(offer, index); } }} />
            </View>
          ) : <View style={{flex:1,paddingBottom:STATUS_BAR_SPACE+pad.bottom}}>
            <RestDestinations offers={offers} resolved={page?.resolved??[]} onEnter={(offer,index)=>{setSelectedCard(null);enterOffer(offer,index);}}>
              {restRow&&ahead&&<View style={{gap:6}}>
                <GameButton label="เดินทางต่อ" onPress={()=>{setSelectedCard(null);dispatch({type:'Proceed'});}}/>
                <Text style={{color:palette.textDim,fontFamily:font.ui,fontSize:12,textAlign:'center'}}>ถัดไป · {ahead.label}</Text>
              </View>}
            </RestDestinations>
          </View>}

          {/* Game Components — คอมแบตอยู่ที่ app/battle.tsx แล้ว ไม่ได้อยู่ตรงนี้ */}
          {/* MapView เดิมถูกลบทิ้ง — เป็นแผงดีบั๊กภาษาอังกฤษที่โชว์ตัวเลข pool
              กับ "Page X/Y" ซึ่งไม่มีความหมายอีกแล้วบนแผนที่แบบเส้นทาง
              และยังมีรายการทางเลือกซ้ำกับการ์ด encounter ด้านบนอีกชุด */}
          <ShopView state={state} dispatch={dispatch} />



          <PlayerStatusBar
            state={state}
            onOpenDeck={() => dispatch({ type: 'OpenDeck' })}
            onOpenBlessings={() => setBlessingsOpen(true)}
          />

        </Scrim>
      </SceneArrival>

      {/* BlessingDialog/EncounterDialog แบบ mock ถูกแทนด้วยหน้าเลือกพรจริง
          และการ์ด encounter ที่มาจาก state.pages แล้ว */}

      {/* สำรับเป็นจอทับเต็มจอ วางนอก Scrim เพื่อให้อยู่เหนือทุกอย่าง
          เดิมวางเป็นบล็อกไหลอยู่ในคอลัมน์กลางแผนที่ จึงล้นออกนอกจอ */}
      <DeckView state={state} dispatch={dispatch} />

      {blessingsOpen && (
        <BlessingView
          blessings={state.blessings}
          onClose={() => setBlessingsOpen(false)}
        />
      )}

    </View>
  );
}
