import React from 'react';
import { useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { palette, surface, tint, layer } from '../../theme';

type StatType = 'block' | 'energy';
type Side     = 'player' | 'enemy';

interface Props {
  amount:   number;
  statType: StatType;
  side:     Side;
  onDone:   () => void;
}

// ── Player HUD (bottom) ───────────────────────────────────────────
// Badge 350px centered, stats row top:40 inside 100px badge, bottom:10
// Space-between 4 items in 190px → item centers relative to screen center:
//   Energy (i=0): W/2 - 83
//   Block  (i=2): W/2 + 44
const HUD_STATS_BOTTOM = 70;

// ── Enemy area (top) ──────────────────────────────────────────────
// paddingTop:65 + sprite:300 + badge:80 + marginBottom:15 = 460
// Stats row is below badge, centered horizontally
const ENEMY_STATS_TOP = 500;

const POPUP_RISE = 55;

export default function StatGainPopup({ amount, statType, side, onDone }: Props) {
  const { width: W } = useWindowDimensions();
  const y       = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale   = useSharedValue(0.6);

  React.useEffect(() => {
    scale.value   = withTiming(1,           { duration: 180, easing: Easing.out(Easing.back(2)) });
    y.value       = withTiming(-POPUP_RISE, { duration: 750, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(0,           { duration: 750 });
    const t = setTimeout(onDone, 800);
    return () => clearTimeout(t);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  // พาเลตต์มีสีเน้นสองสี และทั้งการ์ดกับพลังงานไม่ใช่ "อันตราย" จึงเป็นทองทั้งคู่
  // แยกกันด้วยความสว่างกับไอคอนแทน: พลังงานคือของที่ได้มาแล้วใช้ต่อ จึงสว่างกว่า
  // ส่วนการ์ดป้องกันเป็นของตั้งรับ จึงหม่นกว่าหนึ่งขั้น
  const color = statType === 'block' ? palette.moonDim : palette.moon;
  const icon  = statType === 'block' ? '🛡' : '⚡';

  // ── Player side: bottom-anchored, near stat icon ──────────────
  if (side === 'player') {
    const centerX = statType === 'energy' ? W / 2 - 83 : W / 2 + 44;
    return (
      <Animated.Text style={[{
        position: 'absolute',
        bottom: HUD_STATS_BOTTOM + 4,
        left: centerX - 28,
        color, fontSize: 22,
        fontFamily: 'Prompt_700Bold',
        textShadowColor: palette.scrimHeavy,
        textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3,
        pointerEvents: 'none',
        zIndex: layer.popup,
      }, animStyle]}>
        {icon}+{amount}
      </Animated.Text>
    );
  }

  // ── Enemy side: top-anchored, centered near enemy stats row ───
  return (
    <Animated.Text style={[{
      position: 'absolute',
      top: ENEMY_STATS_TOP - 8,
      left: W / 2 - 28,
      color, fontSize: 22,
      fontFamily: 'Prompt_700Bold',
      textShadowColor: palette.scrimHeavy,
      textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3,
      pointerEvents: 'none',
      zIndex: layer.popup,
    }, animStyle]}>
      {icon}+{amount}
    </Animated.Text>
  );
}
