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
import { PAGE_MIN_BEFORE_SPLIT } from '../src/core/balance/weights';

// Components
import StartPage from './components/StartPage';
import ShopView from './components/ShopView';
import MapView from './components/MapView';
import DeckView from './components/DeckView';
import EventView from './components/EventView';
import EncounterCard from './components/EncounterCard';
import BtnEncounter from './components/BtnEncounter';
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

  // จบ encounter แล้วช่องนั้นจะถูกสุ่มใหม่ทันที (Dynamic Refresh) `resolved` จึงกลับเป็น false
  // ตัวนับที่บอกความคืบหน้าจริงของหน้านี้คือ `_resolvesOnPage`
  const resolvesOnPage = state.pages?._resolvesOnPage ?? 0;
  const canProceed = resolvesOnPage >= PAGE_MIN_BEFORE_SPLIT;

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

  /** ลบช่องออกจากแผนที่ — ร้าน/สมบัติใช้คำสั่งของร้านเพื่อให้ช่อง refresh */
  const dismissOffer = (offer: PageOffer, index: number) => {
    if (isShopLike(offer)) dispatch({ type: 'DeleteShopFromMap', index });
    else dispatch({ type: 'DismissOffer', index });
  };

  if (!fontsLoaded) {
    return null;
  }

  // Show StartPage when phase is 'start'
  if (state.phase === 'start') {
    return <StartPage onStartGame={() => newRun(seed)} />;
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
          
          {/* Encounter Cards Row — มาจาก engine จริง ไม่ใช่ค่าที่ hardcode ไว้ */}
          <View style={{ flexDirection: 'row', marginTop: 120 }}>
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

          {/* เดินทางต่อ — เปิดเมื่อเคลียร์ศัตรูในหน้านี้แล้ว */}
          {offers.length > 0 && (
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <Pressable
                onPress={() => dispatch({ type: 'Proceed' })}
                disabled={!canProceed}
                style={{
                  paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12,
                  opacity: canProceed ? 1 : 0.4,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
                }}
              >
                <Text style={{ color: 'white', fontFamily: 'Prompt_600SemiBold' }}>
                  {canProceed
                    ? 'เดินทางต่อ ▸'
                    : `ผจญภัยต่ออีก ${PAGE_MIN_BEFORE_SPLIT - resolvesOnPage} ครั้ง`}
                </Text>
              </Pressable>
            </View>
          )}


          {/* Game Components — คอมแบตอยู่ที่ app/battle.tsx แล้ว ไม่ได้อยู่ตรงนี้ */}
          <ShopView state={state} dispatch={dispatch} />
          <MapView state={state} dispatch={dispatch} />
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