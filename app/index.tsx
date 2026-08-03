// app/index.tsx — Clean version for redesign
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, { useMemo, useState, useEffect } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, ImageBackground, Image } from 'react-native';
import { useAppFonts } from './useAppFonts';
import type { SaveSlotInfo } from '../src/core/storage';
import type { PageOffer } from '../src/core/map/pages';
import { useGame } from '../src/store/gameStore';
import { describeOffer, isShopLike } from './components/offerDisplay';

// Components
import StartPage from './components/StartPage';
import ShopView from './components/ShopView';
import DeckView from './components/DeckView';
import EventView from './components/EventView';
import BtnEncounter from './components/BtnEncounter';
import RunCompleteScreen from './components/RunCompleteScreen';
import ClassSelectScreen from './components/ClassSelectScreen';
import JourneyTrail from './components/JourneyTrail';
import StoryEventView from './components/StoryEventView';
import ChapterView from './components/ChapterView';
import PlayerStatusBar from './components/PlayerStatusBar';
import Panel, { GameButton, Scrim } from './components/Panel';
import { useRouter } from 'expo-router';
import { screenForState, mapIsReady } from './screenRouter';
import { palette, font, size, space } from './theme';


export default function Home() {
  const { state, dispatch, newRun, saveToSlot, loadFromSlot, getSaveSlots, continueRun } = useGame();
  const router = useRouter();
  const [seed, setSeed] = useState('demo-001');
  const [saveSlots, setSaveSlots] = useState<SaveSlotInfo[]>([]);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [saveLoadError, setSaveLoadError] = useState<string>('');
  const [showDebugTools, setShowDebugTools] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [pickingClass, setPickingClass] = useState(false);

  const [fontsLoaded] = useAppFonts();

  const page   = state.pages?.current;
  const offers = page?.offers ?? [];

  // ตัวเลือกบนแผนที่คือ "โหนดที่เดินไปได้จากตรงที่ยืนอยู่" ไม่ใช่ถาดที่สุ่มใหม่ได้
  // เลือกทางไหนก็เดินไปทางนั้น ไม่มีปุ่มข้าม ไม่มีการวนเก็บให้ครบก่อนไปต่อ

  /** เลือก encounter — คอมแบตไปหน้าต่อสู้ ที่เหลือ engine เปลี่ยน phase เอง */
  const enterOffer = (offer: PageOffer, index: number) => {
    dispatch({ type: 'ChooseOffer', index });

    const d = describeOffer(offer, index);
    if (d.isCombat) {
      // ChooseOffer เซ็ตอัพคอมแบตให้ครบแล้ว (ศัตรู เด็ค มือแรก)
      // หน้าต่อสู้แค่แสดงผล ไม่ต้อง StartCombat ซ้ำ
      router.push({
        pathname: '/battle',
        params: { monsterId: d.id, monsterName: d.name },
      });
    }
  };

  /** ข้ามโหนดนี้ไป — เดินผ่านร้านโดยไม่แวะ แล้วไปต่อชั้นถัดไป */
  const dismissOffer = (offer: PageOffer, index: number) => {
    if (isShopLike(offer)) dispatch({ type: 'DeleteShopFromMap', index });
    else dispatch({ type: 'DismissOffer', index });
  };

  if (!fontsLoaded) {
    return null;
  }

  // หน้าไหนควรขึ้น ตัดสินที่ `screenForState` ซึ่งเป็นฟังก์ชันบริสุทธิ์และมีเทสต์คุม
  // เดิมเป็น if-chain อยู่ตรงนี้ แล้วพลาดจนเปิดแอปมาค้างที่แผนที่เปล่า
  const screen = screenForState(state, { pickingClass });

  if (screen === 'start') {
    return (
      <StartPage
        onStartGame={() => setPickingClass(true)}
        onContinue={() => { void continueRun(); }}
      />
    );
  }

  // เลือกผู้เดินทางก่อนเริ่มรัน — คลาสกำหนดเด็คและวิธีเล่นทั้งรัน
  if (screen === 'class-select') {
    return (
      <ClassSelectScreen
        onPick={(classId) => { setPickingClass(false); newRun(seed, classId); }}
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
    return <RunCompleteScreen state={state} onNewRun={() => setPickingClass(true)} />;
  }

  // เลือกพรตั้งต้นก่อนเข้าหน้าแรก
  if (screen === 'starter-blessing') {
    return (
      <View style={{ flex: 1 }}>
        <ImageBackground
          source={require('../assets/scence/swamp.png')}
          style={{ flex: 1 }}
          resizeMode="cover"
        >
          <Scrim heavy style={{ justifyContent: 'center', paddingHorizontal: space.xl }}>
            <Text style={{
              color: palette.moon, fontSize: size.display, textAlign: 'center',
              fontFamily: font.display,
            }}>
              เลือกพรติดตัว
            </Text>
            <Text style={{
              color: palette.textFaint, fontSize: size.ui, textAlign: 'center',
              fontFamily: font.ui, marginTop: space.xs, marginBottom: space.xl,
            }}>
              สิ่งที่ติดตัวไปตลอดการเดินทาง เลือกได้อย่างเดียว
            </Text>

            <View style={{ gap: space.md }}>
              {(state.starter?.choices ?? []).map((b, i) => (
                <Pressable
                  key={b.id ?? i}
                  onPress={() => dispatch({ type: 'ChooseStarterBlessing', index: i })}
                >
                  <Panel emphasis>
                    <Text style={{
                      color: palette.moon, fontSize: size.heading, fontFamily: font.heading,
                    }}>
                      {b.name ?? b.id}
                    </Text>
                    {!!b.desc && (
                      <Text style={{
                        color: palette.textDim, fontSize: size.bodyLg,
                        fontFamily: font.body, marginTop: space.xs, lineHeight: 24,
                      }}>
                        {b.desc}
                      </Text>
                    )}
                  </Panel>
                </Pressable>
              ))}
            </View>
          </Scrim>
        </ImageBackground>
      </View>
    );
  }

  // มาถึงหน้าแผนที่โดยไม่มีเส้นทาง = หลุดมาผิดทาง (เช่นเซฟเก่าก่อนมีระบบเส้นทาง)
  // เดิมกรณีนี้จะได้จอเปล่าที่กดอะไรไม่ได้เลย ต้องมีทางออกให้เสมอ
  if (!mapIsReady(state)) {
    return (
      <View style={{ flex: 1 }}>
        <ImageBackground
          source={require('../assets/scence/swamp.png')}
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

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../assets/scence/swamp.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <Scrim style={{ paddingTop: 46 }}>

          {/* เส้นทางทั้งรัน — เห็นว่าเดินมาไกลแค่ไหนและบอสอยู่ตรงไหน */}
          <JourneyTrail state={state} />

          {/* ทางแยกตรงหน้า — มาจากโหนดที่เดินไปได้จริงบนเส้นทาง
              การ์ดมีความกว้างตามสัดส่วนของกรอบ จึงจัดกลางแล้วเว้นช่องไฟ
              แทนที่จะยืด flex เต็มความกว้างจนกรอบบิดผิดสัดส่วน */}
          <View style={{
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: space.sm,
            paddingHorizontal: space.sm,
            paddingBottom: 140,
          }}>
            {offers.map((offer, i) => {
              const d = describeOffer(offer, i);
              const resolved = page?.resolved[i] ?? false;
              const picked = selectedCard === i;

              return (
                <View
                  key={`${d.id}-${i}`}
                  style={{
                    opacity: resolved ? 0.35 : 1,
                    // การ์ดที่เลือกอยู่ยกขึ้นเล็กน้อย ให้รู้ว่ากำลังตัดสินใจใบไหน
                    transform: [{ translateY: picked ? -8 : 0 }],
                  }}
                >
                  <BtnEncounter
                    encounter={{
                      id: d.id,
                      type: d.type,
                      name: d.name,
                      description: d.description,
                      artSlot: d.artSlot,
                    }}
                    height={offers.length >= 3 ? 232 : 264}
                    onPress={() => !resolved && setSelectedCard(picked ? null : i)}
                    showButtons={picked && !resolved}
                    onEnter={() => {
                      setSelectedCard(null);
                      enterOffer(offer, i);
                    }}
                    onClose={() => {
                      setSelectedCard(null);
                      if (d.canDismiss) dismissOffer(offer, i);
                    }}
                  />
                </View>
              );
            })}
          </View>

          {/* ไม่มีปุ่ม "เดินทางต่อ" อีกแล้ว — เลือกทางแยกคือการเดินทางต่อในตัวเอง */}


          {/* Game Components — คอมแบตอยู่ที่ app/battle.tsx แล้ว ไม่ได้อยู่ตรงนี้ */}
          {/* MapView เดิมถูกลบทิ้ง — เป็นแผงดีบั๊กภาษาอังกฤษที่โชว์ตัวเลข pool
              กับ "Page X/Y" ซึ่งไม่มีความหมายอีกแล้วบนแผนที่แบบเส้นทาง
              และยังมีรายการทางเลือกซ้ำกับการ์ด encounter ด้านบนอีกชุด */}
          <ShopView state={state} dispatch={dispatch} />
          <StoryEventView state={state} dispatch={dispatch} />
          <DeckView state={state} dispatch={dispatch} />
          <EventView state={state} dispatch={dispatch} />


          <PlayerStatusBar state={state} />

        </Scrim>
      </ImageBackground>

      {/* BlessingDialog/EncounterDialog แบบ mock ถูกแทนด้วยหน้าเลือกพรจริง
          และการ์ด encounter ที่มาจาก state.pages แล้ว */}

    </View>
  );
}