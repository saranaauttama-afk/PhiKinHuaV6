// app/useScreenPadding.ts — ระยะขอบจริงของเครื่อง
//
// ทุกหน้าเคยเดาระยะขอบบนเป็น `paddingTop: 56` เท่ากันหมด ซึ่งเป็นตัวเลขที่มา
// จากเครื่องเดียว บนเครื่องที่รอยบากลึกกว่านั้นข้อความจะไปทับนาฬิกากับแบตเตอรี่
// (เห็นชัดที่หน้าร้านปลุกเสก) และบนเครื่องที่ไม่มีรอยบากเลยก็เว้นเกินจำเป็น
//
// `react-native-safe-area-context` อยู่ใน package.json มาตั้งแต่ต้นโปรเจกต์
// แต่ไม่เคยถูกเรียกใช้เลยสักที่

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space } from './theme';

export function useScreenPadding() {
  const insets = useSafeAreaInsets();
  return {
    /** ใต้แถบสถานะของเครื่อง (นาฬิกา/แบตเตอรี่/รอยบาก) */
    top: insets.top + space.lg,
    /** เหนือแถบนำทาง/ขีดโฮม */
    bottom: insets.bottom + space.lg,
  };
}
