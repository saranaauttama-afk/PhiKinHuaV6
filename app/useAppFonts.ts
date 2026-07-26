// app/useAppFonts.ts — โหลดตัวอักษรที่เดียว
//
// เดิมโหลดกันเองสองที่ (`index.tsx` กับ `StartPage.tsx`) และ `battle.tsx`
// ไม่โหลดเลยแต่เรียกใช้ฟอนต์ — รอดมาได้เพราะปกติผู้เล่นเดินผ่านหน้าแผนที่ก่อน
// ถ้าเปิดตรงเข้าหน้าต่อสู้ (expo-router ทำได้) ฟอนต์จะยังไม่ถูกโหลด

import { useFonts } from 'expo-font';
import {
  Prompt_400Regular, Prompt_600SemiBold, Prompt_700Bold,
} from '@expo-google-fonts/prompt';

export function useAppFonts() {
  return useFonts({
    Prompt_400Regular,
    Prompt_600SemiBold,
    Prompt_700Bold,
    // ตัวหนังสือแบบเอกสารไทย ใช้กับเนื้อเรื่องที่ต้องอ่านยาว
    // ไฟล์อยู่ในโปรเจกต์มาตั้งแต่ต้นแต่ไม่เคยถูกโหลด
    THSarabun: require('../assets/fonts/THSarabun.ttf'),
    THSarabunBold: require('../assets/fonts/THSarabun Bold.ttf'),
  });
}
