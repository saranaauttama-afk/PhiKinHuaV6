import {paperPalette as palette,paperSurface as surface,PaperTexture} from './Paper';
import React from 'react';
import { View, Text, Pressable, ImageBackground } from 'react-native';
import type { GameState } from '../../src/core/types';
import Panel, { GameButton, Scrim } from './Panel';
import { font, size, space, palette as ink, pulpColors } from '../theme';
import RitualSurface from './RitualSurface';

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

  // จอเดียวใช้ทั้งชนะและแพ้ — เดิมทางแพ้ไม่เคยมาถึงจอสรุปเลย
  // (`phase='defeat'` ตกไปหน้าแผนที่ของรันที่ผู้เล่นเพิ่งตาย)
  const headline = !s.won
    ? 'ไปไม่ถึงเช้า'
    : state.runMode === 'episode' ? 'รอดคืนแรก!' : s.beatSecretBoss ? 'ท้ามัจจุราชสำเร็จ' : 'จบการเดินทาง';
  const subline = !s.won
    ? 'คืนนี้จบลงกลางทาง — แต่พระจันทร์เต็มดวงยังมีอีกทุกเดือน'
    : state.runMode === 'episode' ? 'พ้นบ้านร้างมาได้… แต่คืนนี้ยังไม่ใช่คืนสุดท้าย' : s.beatSecretBoss ? 'แม้แต่เจ้าแห่งความตายก็ยังต้องถอย' : 'คุณผ่านค่ำคืนนี้มาได้';

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/scence/episode-village.jpg')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <Scrim heavy style={{ backgroundColor: pulpColors.storySceneShade, justifyContent: 'center', paddingHorizontal: space.xl }}>

          <Text style={{
            color: !s.won ? palette.blood : ink.moon,
            fontSize: size.display, textAlign: 'center',
            fontFamily: font.display,
          }}>
            {headline}
          </Text>

          <Text style={{
            color: ink.text, fontSize: size.bodyLg, fontFamily: font.body,
            textAlign: 'center', marginTop: space.sm, marginBottom: space.xl,
          }}>
            {subline}
          </Text>

          <RitualSurface kind="darkCloth" style={{ gap: space.md }}>
            <Row label={s.won ? 'ไฟต์ทั้งหมด' : 'ไปได้ถึงไฟต์ที่'} value={`${s.fights}`} />
            <Row label="เลเวลสุดท้าย" value={`${s.level}`} />
            <Row label="เบี้ยที่เหลือ" value={`${s.gold}`} />
            {state.runMode !== 'episode' && <Row
              label="ศึกลับ"
              value={s.beatSecretBoss ? 'ชนะแล้ว' : 'ยังไม่ปลดล็อค'}
            />}
          </RitualSurface>

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
      <Text style={{ color: ink.text, fontSize: size.ui, fontFamily: font.ui }}>{label}</Text>
      <Text style={{ color: ink.moon, fontSize: size.ui, fontFamily: font.uiMed }}>
        {value}
      </Text>
    </View>
  );
}
