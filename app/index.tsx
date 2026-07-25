// app/index.tsx — Clean version for redesign
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, { useMemo, useState, useEffect } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, ImageBackground, Image } from 'react-native';
import { useFonts, Prompt_400Regular, Prompt_600SemiBold, Prompt_700Bold } from '@expo-google-fonts/prompt';
import { ChakraPetch_400Regular, ChakraPetch_600SemiBold, ChakraPetch_700Bold } from '@expo-google-fonts/chakra-petch';
import type { SaveSlotInfo } from '../src/core/storage';
import { useGame } from '../src/store/gameStore';

// Components
import StartPage from './components/StartPage';
import ShopView from './components/ShopView';
import MapView from './components/MapView';
import DeckView from './components/DeckView';
import EventView from './components/EventView';
import BlessingDialog from './components/BlessingDialog';
import EncounterDialog from './components/EncounterDialog';
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
  const [showBlessingDialog, setShowBlessingDialog] = useState(false);
  const [selectedBlessing, setSelectedBlessing] = useState<string | null>(null);
  const [showEncounterDialog, setShowEncounterDialog] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  let [fontsLoaded] = useFonts({
    Prompt_400Regular,
    Prompt_600SemiBold,
    Prompt_700Bold,
    ChakraPetch_400Regular,
    ChakraPetch_600SemiBold,
    ChakraPetch_700Bold,
  });

  // Auto redirect removed - user must click encounter to enter battle

  if (!fontsLoaded) {
    return null;
  }

  // Show StartPage when phase is 'start'
  if (state.phase === 'start') {
    return <StartPage onStartGame={() => {
      dispatch({ type: 'EnterMenu' });
      // แสดง BlessingDialog หลังจากเข้าหน้า index แล้ว
      setTimeout(() => setShowBlessingDialog(true), 100);
    }} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../assets/scence/swamp.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', paddingTop: 50 }}>
          
          {/* Encounter Cards Row */}
          <View style={{
            flexDirection: 'row',
            marginTop: 120,
          }}>
            {/* Encounter 1 - Monster */}
            <View style={{ flex: 1 }}>
              <BtnEncounter
                encounter={{
                  id: 'phi-krasue',
                  type: 'monster',
                  name: 'ผีกระสือ',
                  description: 'ผีหัวลอยที่เหาะไปมา มักปรากฏตัวในยามค่ำคืน'
                }}
                onPress={() => setSelectedCard(0)}
                showButtons={selectedCard === 0}
                onEnter={() => {
                  console.log('เข้าสู่การผจญภัยกับผีกระสือ');
                  setSelectedCard(null);
                  router.push({
                    pathname: '/battle',
                    params: {
                      monsterId: 'phi-krasue',
                      monsterName: 'ผีกระสือ',
                      monsterHp: '20'
                    }
                  });
                }}
                onClose={() => setSelectedCard(null)}
              />
            </View>

            {/* Encounter 2 - Shop */}
            <View style={{ flex: 1 }}>
              <BtnEncounter
                encounter={{
                  id: 'shop-card',
                  type: 'shop_card',
                  name: 'ร้านค้าการ์ด',
                  description: 'ซื้อการ์ดใหม่เพื่อเสริมสร้างสำรับ'
                }}
                onPress={() => setSelectedCard(1)}
                showButtons={selectedCard === 1}
                onEnter={() => {
                  console.log('เข้าสู่ร้านค้า');
                  setSelectedCard(null);
                }}
                onClose={() => setSelectedCard(null)}
              />
            </View>

            {/* Encounter 3 - Treasure */}
            <View style={{ flex: 1 }}>
              <BtnEncounter
                encounter={{
                  id: 'treasure',
                  type: 'treasure',
                  name: 'หีบสมบัติ',
                  description: 'รับการ์ดฟรี เลือก 1 จาก 2 ใบ'
                }}
                onPress={() => setSelectedCard(2)}
                showButtons={selectedCard === 2}
                onEnter={() => {
                  console.log('เปิดหีบสมบัติ');
                  setSelectedCard(null);
                }}
                onClose={() => setSelectedCard(null)}
              />
            </View>
          </View>


          {/* Game Components — คอมแบตอยู่ที่ app/battle.tsx แล้ว ไม่ได้อยู่ตรงนี้ */}
          <ShopView state={state} dispatch={dispatch} />
          <MapView state={state} dispatch={dispatch} />
          <DeckView state={state} dispatch={dispatch} />
          <EventView state={state} dispatch={dispatch} />

          {/* Blessing Icon - Above Player Status */}
          {selectedBlessing && (
            <Image
              source={selectedBlessing === 'regen_1' 
                ? require('../assets/imgBlessing/regen_1.png')
                : require('../assets/imgBlessing/start_block_3.png')
              }
              style={{
                position: 'absolute',
                bottom: 165,
                left: 80,
                width: 32,
                height: 32,
              }}
              resizeMode="contain"
            />
          )}

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

      {/* Blessing Dialog */}
      <BlessingDialog
        visible={showBlessingDialog}
        onClose={() => setShowBlessingDialog(false)}
        onReceiveBlessing={(blessingId) => {
          setSelectedBlessing(blessingId);
          setShowBlessingDialog(false);
        }}
      />

      {/* Encounter Dialog */}
      <EncounterDialog
        visible={showEncounterDialog}
        onClose={() => setShowEncounterDialog(false)}
        onEnter={() => {
          console.log('เข้าสู่การผจญภัยกับผีกระสือ');
          setShowEncounterDialog(false);
        }}
        encounter={{
          id: 'phi-krasue',
          type: 'monster',
          name: 'ผีกระสือ',
          description: 'ผีหัวลอยที่เหาะไปมา มักปรากฏตัวในยามค่ำคืน'
        }}
        title="พบกับผีกระสือ"
      />

    </View>
  );
}