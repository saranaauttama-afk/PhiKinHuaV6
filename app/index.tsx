// app/index.tsx — Clean version for redesign
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, { useMemo, useState, useEffect } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, ImageBackground, Image } from 'react-native';
import { useFonts, Prompt_400Regular, Prompt_600SemiBold, Prompt_700Bold } from '@expo-google-fonts/prompt';
import { ChakraPetch_400Regular, ChakraPetch_600SemiBold, ChakraPetch_700Bold } from '@expo-google-fonts/chakra-petch';
import type { SaveSlotInfo } from '../src/core/storage';
import type { PageOffer } from '../src/core/map/pages';
import { useGame } from '../src/store/gameStore';
import { describeOffer, isShopLike } from './components/offerDisplay';

// Components
import StartPage from './components/StartPage';
import ShopView from './components/ShopView';
import DeckView from './components/DeckView';
import EventView from './components/EventView';
import EncounterCard from './components/EncounterCard';
import BtnEncounter from './components/BtnEncounter';
import RunCompleteScreen from './components/RunCompleteScreen';
import ClassSelectScreen from './components/ClassSelectScreen';
import JourneyTrail from './components/JourneyTrail';
import { useRouter } from 'expo-router';


export default function Home() {
  const { state, dispatch, newRun, saveToSlot, loadFromSlot, getSaveSlots } = useGame();
  const router = useRouter();
  const [seed, setSeed] = useState('demo-001');
  const [saveSlots, setSaveSlots] = useState<SaveSlotInfo[]>([]);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [saveLoadError, setSaveLoadError] = useState<string>('');
  const [showDebugTools, setShowDebugTools] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [pickingClass, setPickingClass] = useState(false);

  let [fontsLoaded] = useFonts({
    Prompt_400Regular,
    Prompt_600SemiBold,
    Prompt_700Bold,
    ChakraPetch_400Regular,
    ChakraPetch_600SemiBold,
    ChakraPetch_700Bold,
  });

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

  // Show StartPage when phase is 'start'
  if (state.phase === 'start') {
    return <StartPage onStartGame={() => setPickingClass(true)} />;
  }

  // เลือกผู้เดินทางก่อนเริ่มรัน — คลาสกำหนดเด็คและวิธีเล่นทั้งรัน
  if (pickingClass) {
    return (
      <ClassSelectScreen
        onPick={(classId) => { setPickingClass(false); newRun(seed, classId); }}
        onBack={() => setPickingClass(false)}
      />
    );
  }

  // จบรันแล้ว — แสดงจอสรุปแทนการเด้งกลับแผนที่ที่ไม่มีอะไรเหลือ
  if (state.phase === 'run_complete') {
    return <RunCompleteScreen state={state} onNewRun={() => setPickingClass(true)} />;
  }

  // เลือกพรตั้งต้นก่อนเข้าหน้าแรก
  if (state.phase === 'starter' && state.starter && !state.starter.consumed) {
    return (
      <View style={{ flex: 1 }}>
        <ImageBackground
          source={require('../assets/scence/swamp.png')}
          style={{ flex: 1 }}
          resizeMode="cover"
        >
          <View style={{
            flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center', paddingHorizontal: 28, gap: 16,
          }}>
            <Text style={{
              color: 'white', fontSize: 22, textAlign: 'center',
              fontFamily: 'Prompt_700Bold', marginBottom: 8,
            }}>
              เลือกพรติดตัว
            </Text>

            {state.starter.choices.map((b, i) => (
              <Pressable
                key={b.id ?? i}
                onPress={() => dispatch({ type: 'ChooseStarterBlessing', index: i })}
                style={{
                  padding: 16, borderRadius: 14,
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
                }}
              >
                <Text style={{ color: 'white', fontSize: 17, fontFamily: 'Prompt_600SemiBold' }}>
                  {b.name ?? b.id}
                </Text>
                {!!b.desc && (
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 }}>
                    {b.desc}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
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
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', paddingTop: 50 }}>

          {/* เส้นทางทั้งรัน — เห็นว่าเดินมาไกลแค่ไหนและบอสอยู่ตรงไหน */}
          <JourneyTrail state={state} />

          {/* ทางแยกตรงหน้า — มาจากโหนดที่เดินไปได้จริงบนเส้นทาง */}
          <View style={{ flexDirection: 'row', marginTop: 70 }}>
            {offers.map((offer, i) => {
              const d = describeOffer(offer, i);
              const resolved = page?.resolved[i] ?? false;

              return (
                <View key={`${d.id}-${i}`} style={{ flex: 1, opacity: resolved ? 0.4 : 1 }}>
                  <BtnEncounter
                    encounter={{
                      id: d.id,
                      type: d.type,
                      name: d.name,
                      description: d.description,
                    }}
                    onPress={() => !resolved && setSelectedCard(i)}
                    showButtons={selectedCard === i && !resolved}
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
          <DeckView state={state} dispatch={dispatch} />
          <EventView state={state} dispatch={dispatch} />


          {/* Player Status Block - Floating Card */}
          <ImageBackground
            source={require('../assets/images/bgUserPanel.png')}
            style={{
              position: 'absolute',
              bottom: 30,
              left: 15,
              right: 15,
              padding: 12,
              height:180
            }}
            resizeMode="stretch"
          >
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              top:60,
              width:280,
              left:25
            }}>
              {/* HP */}
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ 
                  color: '#ef4444', 
                  fontSize: 11, 
                  fontFamily: 'ChakraPetch_600SemiBold'
                }}>HP</Text>
                <Text style={{ 
                  color: 'white', 
                  fontSize: 13,
                  fontFamily: 'ChakraPetch_400Regular'
                }}>
                  {state.player.hp}/{state.player.maxHp}
                </Text>
              </View>

              {/* Energy */}
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ 
                  color: '#3b82f6', 
                  fontSize: 11, 
                  fontFamily: 'ChakraPetch_600SemiBold'
                }}>Energy</Text>
                <Text style={{ 
                  color: 'white', 
                  fontSize: 13,
                  fontFamily: 'ChakraPetch_400Regular'
                }}>
                  {state.player.energy}/{state.player.maxEnergy}
                </Text>
              </View>

              {/* Gold */}
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ 
                  color: '#f59e0b', 
                  fontSize: 11, 
                  fontFamily: 'ChakraPetch_600SemiBold'
                }}>Gold</Text>
                <Text style={{ 
                  color: 'white', 
                  fontSize: 13,
                  fontFamily: 'ChakraPetch_400Regular'
                }}>
                  {state.player.gold}
                </Text>
              </View>

              {/* Hand Size */}
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ 
                  color: '#8b5cf6', 
                  fontSize: 11, 
                  fontFamily: 'ChakraPetch_600SemiBold'
                }}>Hand</Text>
                <Text style={{ 
                  color: 'white', 
                  fontSize: 13,
                  fontFamily: 'ChakraPetch_400Regular'
                }}>
                  {state.piles.hand.length}/{state.player.maxHandSize}
                </Text>
              </View>

              {/* Experience */}
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ 
                  color: '#10b981', 
                  fontSize: 11, 
                  fontFamily: 'ChakraPetch_600SemiBold'
                }}>EXP</Text>
                <Text style={{ 
                  color: 'white', 
                  fontSize: 13,
                  fontFamily: 'ChakraPetch_400Regular'
                }}>
                  {state.player.exp}/{state.player.expToNext}
                </Text>
              </View>
            </View>
          </ImageBackground>
          
        </View>
      </ImageBackground>

      {/* BlessingDialog/EncounterDialog แบบ mock ถูกแทนด้วยหน้าเลือกพรจริง
          และการ์ด encounter ที่มาจาก state.pages แล้ว */}

    </View>
  );
}