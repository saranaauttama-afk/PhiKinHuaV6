import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Stack } from 'expo-router';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
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