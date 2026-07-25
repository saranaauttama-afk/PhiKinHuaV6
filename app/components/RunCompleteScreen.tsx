import React from 'react';
import { View, Text, Pressable, ImageBackground } from 'react-native';
import type { GameState } from '../../src/core/types';

/**
 * จอสรุปตอนจบรัน
 *
 * ก่อนหน้านี้ฆ่าบอสสุดท้ายแล้ว phase ค้างที่ 'victory' และเด้งกลับหน้าแผนที่
 * ที่ไม่มีอะไรเหลือ = ทางตัน ผู้เล่นไม่รู้ว่าจบแล้ว
 */

type Props = {
  state: GameState;
  onNewRun: () => void;
};

export default function RunCompleteScreen({ state, onNewRun }: Props) {
  const s = state.runSummary;
  if (!s) return null;

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/scence/swamp.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={{
          flex: 1, backgroundColor: 'rgba(0,0,0,0.78)',
          justifyContent: 'center', paddingHorizontal: 30,
        }}>
          <Text style={{
            color: s.beatSecretBoss ? '#ffd88a' : 'white',
            fontSize: 28, textAlign: 'center',
            fontFamily: 'Prompt_700Bold',
          }}>
            {s.beatSecretBoss ? 'ท้ามัจจุราชสำเร็จ' : 'จบการเดินทาง'}
          </Text>

          <Text style={{
            color: 'rgba(255,255,255,0.7)', fontSize: 15,
            textAlign: 'center', marginTop: 8, marginBottom: 28,
          }}>
            {s.beatSecretBoss
              ? 'แม้แต่เจ้าแห่งความตายก็ยังต้องถอย'
              : 'คุณผ่านค่ำคืนนี้มาได้'}
          </Text>

          <View style={{
            gap: 12, padding: 20, borderRadius: 16,
            backgroundColor: 'rgba(20,14,10,0.75)',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
          }}>
            <Row label="ไฟต์ทั้งหมด" value={`${s.fights}`} />
            <Row label="เลเวลสุดท้าย" value={`${s.level}`} />
            <Row label="ทรัพย์ที่เหลือ" value={`${s.gold}`} />
            <Row
              label="ศึกลับ"
              value={s.beatSecretBoss ? 'ชนะแล้ว' : 'ยังไม่ปลดล็อค'}
            />
          </View>

          <Pressable
            onPress={onNewRun}
            style={{
              marginTop: 30, alignSelf: 'center',
              paddingHorizontal: 30, paddingVertical: 12, borderRadius: 14,
              backgroundColor: 'rgba(0,0,0,0.6)',
              borderWidth: 1, borderColor: 'rgba(255,216,138,0.5)',
            }}
          >
            <Text style={{ color: '#ffd88a', fontSize: 16, fontFamily: 'Prompt_600SemiBold' }}>
              ออกเดินทางอีกครั้ง
            </Text>
          </Pressable>
        </View>
      </ImageBackground>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>{label}</Text>
      <Text style={{ color: 'white', fontSize: 15, fontFamily: 'Prompt_600SemiBold' }}>
        {value}
      </Text>
    </View>
  );
}
