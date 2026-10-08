import { useWindowDimensions } from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

/**
 * ตำแหน่งและขนาดของฉากต่อสู้ — จุดเดียวที่ทั้ง MonsterArea และ EnemyHandCard อ้างอิง
 *
 * เดิม EnemyHandCard ฝังค่า `HAND_CENTER_Y = 380` ไว้เอง พร้อมคอมเมนต์ว่า
 * "paddingTop(100) + sprite(300) − 20" ซึ่งคือการ hardcode layout ของอีกไฟล์หนึ่ง
 * เปลี่ยนขนาดภาพผี → การ์ดบินไปผิดที่ และค่านั้นไม่ scale ตามความสูงจอเลย
 *
 * ตอนนี้ทุกอย่างคิดจากขนาดจอจริง และเปลี่ยนขนาด sprite ที่เดียวจบ
 */

/** สัดส่วนพื้นที่มอนสเตอร์เทียบกับความสูงจอ */
const MONSTER_SIZE_RATIO   = 0.36;  // ขนาดภาพผี
const MONSTER_SIZE_MAX     = 320;

export type BattleLayout = {
  screenW: number;
  screenH: number;
  /** ระยะจากขอบบนถึงภาพผี */
  monsterTop: number;
  /** ด้านกว้าง/สูงของภาพผี (สี่เหลี่ยมจัตุรัส) */
  monsterSize: number;
  /** จุดกึ่งกลางแนวตั้งของแถวการ์ดศัตรู — อยู่ใต้ภาพผีเล็กน้อย */
  enemyHandCenterY: number;
  /** จุดกึ่งกลางจอสำหรับการ์ดที่ถูกเล่น */
  centerX: number;
  centerY: number;
};

export function useBattleLayout(): BattleLayout {
  const { width: screenW, height: screenH } = useWindowDimensions();

  const safe=useSafeAreaInsets();
  const monsterTop = safe.top + (screenH<700?52:66);
  const monsterSize = Math.min(
    MONSTER_SIZE_MAX,
    Math.max(120, Math.min(screenW-32, screenH * MONSTER_SIZE_RATIO, screenH-safe.bottom-430-monsterTop))
  );

  return {
    screenW,
    screenH,
    monsterTop,
    monsterSize,
    // ใต้ภาพผีลงมานิดหน่อย เพื่อให้การ์ดคว่ำนั่งเหนือ badge
    enemyHandCenterY: monsterTop + monsterSize * .58,
    centerX: screenW / 2,
    centerY: screenH * .45,
  };
}
