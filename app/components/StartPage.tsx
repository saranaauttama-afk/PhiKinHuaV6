// app/components/StartPage.tsx — หน้าเริ่มเกม
//
// เพิ่มปุ่ม "เดินทางต่อ" ที่ขึ้นเฉพาะเมื่อมีการเดินทางค้างไว้ **และเล่นต่อได้จริง**
// ไม่ใช่แค่มีไฟล์เซฟอยู่ — เซฟจากก่อนมีระบบเส้นทางจะกดแล้วไปเจอจอเปล่า

import React from 'react';
import { View, Text, Pressable, ImageBackground } from 'react-native';
import { useAppFonts } from '../useAppFonts';
import { loadAutoSaveSummary } from '../../src/core/storage';
import type { SaveSummary } from '../../src/core/save';
import { getClass } from '../../src/core/classes';
import { font, palette, size, space, surface, layer } from '../theme';

interface StartPageProps {
  onStartGame: () => void;
  onContinue?: () => void;
}

/** ปุ่มบนหน้าเริ่มเกม — ใช้กรอบไม้เดียวกับปุ่มอื่นในเกม */
function MenuButton({
  label, sub, onPress,
}: { label: string; sub?: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1, alignItems: 'center' })}
    >
      <ImageBackground
        source={require('../../assets/images/btnBg.png')}
        style={{
          width: 220, height: 96,
          justifyContent: 'center', alignItems: 'center',
        }}
        resizeMode="stretch"
      >
        <Text style={{
          fontSize: size.heading, color: palette.moon,
          textAlign: 'center', fontFamily: font.heading,
        }}>
          {label}
        </Text>
        {!!sub && (
          <Text style={{
            fontSize: size.label, color: palette.textDim,
            textAlign: 'center', fontFamily: font.ui, marginTop: 2,
          }}>
            {sub}
          </Text>
        )}
      </ImageBackground>
    </Pressable>
  );
}

function StartPage({ onStartGame, onContinue }: StartPageProps) {
  const [fontsLoaded] = useAppFonts();
  const [saved, setSaved] = React.useState<SaveSummary | null>(null);
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    loadAutoSaveSummary()
      .then(s => { if (alive) { setSaved(s); setChecked(true); } })
      .catch(() => { if (alive) setChecked(true); });
    return () => { alive = false; };
  }, []);

  if (!fontsLoaded) return null;

  const canContinue = checked && saved && onContinue;
  const className = saved?.classId ? getClass(saved.classId as any).name : '';

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/scence/startPage.png')}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        resizeMode="cover"
      >
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: surface.glassDim,
        }} />

        <View style={{ zIndex: layer.badge, top: 150, alignItems: 'center', gap: space.xs }}>
          {/* เดินทางต่อมาก่อน — คนที่ค้างไว้กลับมาเพื่อสิ่งนี้ */}
          {canContinue && (
            <MenuButton
              label="เดินทางต่อ"
              sub={`${className} · ศึกที่ ${saved!.fight}/${saved!.totalFights} · เลือด ${saved!.hp}/${saved!.maxHp}`}
              onPress={onContinue!}
            />
          )}

          <MenuButton
            label={canContinue ? 'ออกเดินทางใหม่' : 'เข้าสู่เกม'}
            onPress={onStartGame}
          />

          {/* เตือนว่าเริ่มใหม่แล้วของเก่าหาย — ปุ่มสองปุ่มติดกันกดผิดได้ง่าย */}
          {canContinue && (
            <Text style={{
              color: palette.textFaint, fontSize: size.label,
              fontFamily: font.ui, marginTop: space.xs,
            }}>
              เริ่มใหม่แล้วการเดินทางที่ค้างไว้จะหายไป
            </Text>
          )}
        </View>

        <View style={{ position: 'absolute', bottom: 40, alignItems: 'center', zIndex: layer.badge }}>
          <Text style={{
            fontSize: size.label, color: palette.textFaint,
            fontFamily: font.ui,
            textShadowColor: palette.shadow,
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
          }}>
            ผีกินหัว
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}

export default StartPage;
