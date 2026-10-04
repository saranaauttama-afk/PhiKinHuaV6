import React from 'react';
import { View, Text, ImageBackground } from 'react-native';
import { loadAutoSaveSummary } from '../../src/core/storage';
import type { SaveSummary } from '../../src/core/save';
import { GameButton } from './Panel';
import { font, palette, space, surface } from '../theme';
import { useScreenPadding } from '../useScreenPadding';

type Props = { onStartGame: () => void; onContinue?: () => void };
export default function StartPage({ onStartGame, onContinue }: Props) {
  const pad = useScreenPadding();
  const [saved, setSaved] = React.useState<SaveSummary | null>(null);
  React.useEffect(() => {
    let alive = true;
    loadAutoSaveSummary().then(s => { if (alive) setSaved(s); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return (
    <ImageBackground source={require('../../assets/scence/episode-village.jpg')} style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingTop: pad.top + 24, paddingBottom: pad.bottom + 20, paddingHorizontal: 24, justifyContent: 'space-between', backgroundColor: surface.glassDim }}>
        <View>
          <Text style={{ fontFamily: font.heading, fontSize: 12, color: palette.moon }}>การ์ตูนผี • ตอนที่ ๑</Text>
          <Text style={{ fontFamily: font.display, fontSize: 52, lineHeight: 74, color: palette.text }}>ผีกินหัว</Text>
          <Text style={{ fontFamily: font.heading, fontSize: 21, color: palette.moon }}>คืนแรกที่บ้านร้าง</Text>
        </View>
        <View style={{ backgroundColor: surface.panel, borderWidth: 3, borderColor: palette.ink, padding: 20, gap: space.md }}>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 25, color: palette.text }}>เสียงหัวเราะใต้ถุน… เด็กที่หายไป…{ '\n' }คุณจะพากลับบ้านทันก่อนเช้าหรือเปล่า?</Text>
          <GameButton label="เปิดอ่านคืนแรก" tone="primary" onPress={onStartGame} />
          {saved && onContinue && <GameButton label={`เล่นต่อ • ศึก ${saved.fight}/${saved.totalFights}`} onPress={onContinue} />}
          <Text style={{ fontFamily: font.ui, fontSize: 12, color: palette.textDim }}>3 ศึก • เลือกทางเอง • เป้าหมาย 5–10 นาที</Text>
          {saved && <Text style={{ fontFamily: font.ui, fontSize: 11, color: palette.textDim }}>เริ่มตอนใหม่จะแทนการเดินทางที่ค้างไว้</Text>}
        </View>
      </View>
    </ImageBackground>
  );
}
