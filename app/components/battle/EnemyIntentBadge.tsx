import React from 'react';
import { View, Text } from 'react-native';
import type { EnemyIntent } from '../../../src/core/types';

/**
 * ป้ายบอกว่าศัตรูจะทำอะไรเทิร์นหน้า
 *
 * เดิมศัตรูเปิดการ์ดคว่ำตอนถึงเทิร์นตัวเอง ผู้เล่นเลยเดาไม่ออกว่าควรตีหรือควรกัน
 * ตัวเลขที่โชว์คำนวณด้วยสูตรเดียวกับดาเมจจริง (computeModifiedDamage)
 * ถ้าโชว์เลขที่ไม่ตรงกับที่โดน ผู้เล่นจะวางแผนจากข้อมูลผิด
 */

type Props = {
  intent?: EnemyIntent;
  /** block ของผู้เล่นตอนนี้ ใช้บอกว่าดาเมจจะทะลุเข้าเลือดเท่าไร */
  playerBlock: number;
};

export default function EnemyIntentBadge({ intent, playerBlock }: Props) {
  if (!intent) return null;

  const willHurt = Math.max(0, intent.damage - playerBlock);
  const label =
    intent.kind === 'wait' ? 'ตั้งท่ารอ'
    : intent.kind === 'defend' ? 'ตั้งการ์ด'
    : intent.kind === 'mixed' ? 'ตีและตั้งการ์ด'
    : 'จะโจมตี';

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderWidth: 1,
      borderColor: intent.damage > 0 ? 'rgba(255,90,90,0.55)' : 'rgba(120,180,255,0.5)',
    }}>
      <Text style={{
        color: 'rgba(255,255,255,0.8)', fontSize: 12,
        fontFamily: 'Prompt_600SemiBold',
      }}>
        {label}
      </Text>

      {intent.damage > 0 && (
        <Text style={{ color: '#ff6b6b', fontSize: 16, fontFamily: 'ChakraPetch_700Bold' }}>
          ⚔ {intent.damage}
          {playerBlock > 0 && (
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
              {'  '}→ เลือด {willHurt}
            </Text>
          )}
        </Text>
      )}

      {intent.block > 0 && (
        <Text style={{ color: '#7ab8ff', fontSize: 16, fontFamily: 'ChakraPetch_700Bold' }}>
          🛡 {intent.block}
        </Text>
      )}
    </View>
  );
}
