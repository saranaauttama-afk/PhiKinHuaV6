import React from 'react';
import { View, Text, Pressable, ImageBackground } from 'react-native';
import type { GameState } from '../../src/core/types';
import Panel, { GameButton, Scrim } from './Panel';
import { palette, font, size, space } from '../theme';

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
        <Scrim heavy style={{ justifyContent: 'center', paddingHorizontal: space.xl }}>
          <Text style={{
            color: s.beatSecretBoss ? palette.moon : palette.text,
            fontSize: size.display, textAlign: 'center',
            fontFamily: font.display,
          }}>
            {s.beatSecretBoss ? 'ท้ามัจจุราชสำเร็จ' : 'จบการเดินทาง'}
          </Text>

          <Text style={{
            color: palette.textDim, fontSize: size.bodyLg, fontFamily: font.body,
            textAlign: 'center', marginTop: space.sm, marginBottom: space.xl,
          }}>
            {s.beatSecretBoss
              ? 'แม้แต่เจ้าแห่งความตายก็ยังต้องถอย'
              : 'คุณผ่านค่ำคืนนี้มาได้'}
          </Text>

          <Panel emphasis={!!s.beatSecretBoss} style={{ gap: space.md }}>
            <Row label="ไฟต์ทั้งหมด" value={`${s.fights}`} />
            <Row label="เลเวลสุดท้าย" value={`${s.level}`} />
            <Row label="ทรัพย์ที่เหลือ" value={`${s.gold}`} />
            <Row
              label="ศึกลับ"
              value={s.beatSecretBoss ? 'ชนะแล้ว' : 'ยังไม่ปลดล็อค'}
            />
          </Panel>

          <GameButton
            label="ออกเดินทางอีกครั้ง"
            tone="primary"
            onPress={onNewRun}
            style={{ marginTop: space.xxl, alignSelf: 'center' }}
          />
        </Scrim>
      </ImageBackground>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: palette.textDim, fontSize: size.ui, fontFamily: font.ui }}>{label}</Text>
      <Text style={{ color: palette.text, fontSize: size.ui, fontFamily: font.uiMed }}>
        {value}
      </Text>
    </View>
  );
}
