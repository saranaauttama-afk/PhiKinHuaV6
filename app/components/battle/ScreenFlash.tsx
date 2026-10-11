import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { palette, surface, tint, layer } from '../../theme';

/**
 * จอแฟลชสีแดงตอนโดนโจมตี — วางเป็น sibling ที่ root ของหน้าต่อสู้
 *
 * เดิมถูกวาดอยู่ข้างใน EnemyHandCard ซึ่ง container ถูก scale/translate อยู่
 * จึงต้องหารกลับด้วย scale เพื่อ undo transform ของ parent
 * (`top: -posY / scale`, `width: W / scale` ฯลฯ) ซึ่งใช้ได้ด้วยความบังเอิญ
 * และจะพังทันทีที่เปลี่ยน transform-origin หรือ layout ของการ์ด
 *
 * ตอนนี้มันเป็น overlay เต็มจอตรงๆ ไม่ต้องรู้อะไรเกี่ยวกับการ์ดเลย
 */

export type ScreenFlashHandle = { flash: () => void };

const ScreenFlash = React.forwardRef<ScreenFlashHandle, { color?: string }>(
  function ScreenFlash({ color = tint.bloodSoft }, ref) {
    const opacity = useSharedValue(0);

    React.useImperativeHandle(ref, () => ({
      flash() {
        opacity.value = withSequence(
          withTiming(0.35, { duration: 120, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) })
        );
      },
    }));

    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: color, zIndex: layer.battleOverlay }, style]}
      />
    );
  }
);

export default ScreenFlash;
