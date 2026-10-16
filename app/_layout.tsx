import 'react-native-gesture-handler';
import 'react-native-reanimated';
import {AppState,Platform} from 'react-native';
import {useGame} from '../src/store/gameStore';
import { Stack } from 'expo-router';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {useGameSettings} from './components/Settings';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {initAudio,setAudioForeground,setMenuAudio} from '../src/audio/audio';

export default function RootLayout() {
  React.useEffect(()=>{void useGameSettings.getState().hydrate();initAudio();setMenuAudio();},[]);
  React.useEffect(()=>{
    const active=()=>{const on=AppState.currentState==='active'&&(Platform.OS!=='web'||!document.hidden);useGame.getState().setForeground(on);setAudioForeground(on);};
    active();const sub=AppState.addEventListener('change',active);
    if(Platform.OS==='web')document.addEventListener('visibilitychange',active);
    const timer=setInterval(()=>useGame.getState().flushPlayTime(),1000);
    return ()=>{clearInterval(timer);sub.remove();if(Platform.OS==='web')document.removeEventListener('visibilitychange',active);};
  },[]);
  return (
    // `react-native-safe-area-context` อยู่ใน package.json มาตั้งแต่ต้นแต่ไม่เคย
    // ถูกใช้ — ทุกหน้าจึงเดาระยะขอบบนเป็น `paddingTop: 56` เท่ากันหมด
    // ซึ่งไม่พอบนเครื่องที่มีรอยบาก ข้อความหน้าร้านไปทับนาฬิกากับแบตเตอรี่
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}