// app/components/Panel.tsx — กรอบกระดาษที่ใช้ซ้ำได้ทุกหน้า
//
// องค์ประกอบ "กรอบแบบหนังสือ/กระดาษเก่า" ที่ตกลงกันไว้ใน §2 ของ context.md
// ทำด้วยโค้ดล้วน ไม่ต้องรออาร์ตใหม่ — เส้นขอบสองชั้นแบบกรอบภาพพิมพ์ พื้นสีน้ำตาลไหม้
// และมุมที่มีขีดสั้นๆ เลียนแบบมุมกรอบไม้ในภาพ `bgUserPanel.png`
//
// พอมีอาร์ตกรอบจริงแล้วค่อยเปลี่ยนข้างในไฟล์นี้ที่เดียว ทุกหน้าจะเปลี่ยนตาม

import React from 'react';
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { font, palette, radius, size, space, surface, tint } from '../theme';

type Props = {
  children?: React.ReactNode;
  /** หัวกรอบ — วางคร่อมเส้นขอบบนแบบป้ายชื่อบนกรอบภาพ */
  title?: string;
  /** บรรทัดเล็กใต้หัวกรอบ */
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
  /** กรอบเน้น ใช้กับของสำคัญ เช่น ผลลัพธ์ที่เพิ่งเกิดขึ้น */
  emphasis?: boolean;
  padded?: boolean;
};

/** ขีดมุม — ทำให้ขอบอ่านเป็นกรอบไม้ ไม่ใช่กล่อง CSS */
function Corner({ x, y }: { x: 'l' | 'r'; y: 't' | 'b' }) {
  const len = 14;
  return (
    <>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute', width: len, height: 2,
          backgroundColor: palette.moonDim, opacity: 0.5,
          [x === 'l' ? 'left' : 'right']: 6,
          [y === 't' ? 'top' : 'bottom']: 6,
        } as any}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute', width: 2, height: len,
          backgroundColor: palette.moonDim, opacity: 0.5,
          [x === 'l' ? 'left' : 'right']: 6,
          [y === 't' ? 'top' : 'bottom']: 6,
        } as any}
      />
    </>
  );
}

export default function Panel({
  children, title, subtitle, style, emphasis = false, padded = true,
}: Props) {
  return (
    <View style={[{ marginTop: title ? space.md : 0 }, style]}>
      <View
        style={{
          backgroundColor: emphasis ? surface.panelRaise : surface.panel,
          borderWidth: 1,
          borderColor: emphasis ? palette.lineStrong : palette.line,
          borderRadius: radius.lg,
          padding: padded ? space.lg : 0,
          paddingTop: padded ? (title ? space.xl : space.lg) : 0,
        }}
      >
        <Corner x="l" y="t" />
        <Corner x="r" y="t" />
        <Corner x="l" y="b" />
        <Corner x="r" y="b" />
        {children}
      </View>

      {/* ป้ายชื่อคร่อมเส้นขอบบน เหมือนป้ายบนกรอบภาพ */}
      {!!title && (
        <View
          style={{
            position: 'absolute', top: -space.md, alignSelf: 'center',
            backgroundColor: palette.umber,
            borderWidth: 1, borderColor: emphasis ? palette.lineStrong : palette.line,
            borderRadius: radius.sm,
            paddingHorizontal: space.md, paddingVertical: 3,
          }}
        >
          <Text style={{ color: palette.moon, fontSize: size.ui, fontFamily: font.heading }}>
            {title}
          </Text>
        </View>
      )}

      {!!subtitle && (
        <Text
          style={{
            color: palette.textFaint, fontSize: size.label,
            fontFamily: font.ui, textAlign: 'center', marginTop: space.xs,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

/** ปุ่มมาตรฐานของเกม — สามระดับความสำคัญ ไม่มีสีอื่นนอกจากพาเลตต์ */
export function GameButton({
  label, onPress, tone = 'normal', disabled = false, style,
}: {
  label: string;
  onPress?: () => void;
  tone?: 'normal' | 'primary' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const tones = {
    normal:  { bg: surface.panelRaise, border: palette.line,       fg: palette.text },
    primary: { bg: tint.moonSoft, border: palette.lineStrong, fg: palette.moon },
    danger:  { bg: tint.bloodSoft,   border: tint.bloodLine, fg: palette.blood },
  }[tone];

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={[
        {
          paddingHorizontal: space.xl, paddingVertical: 11,
          borderRadius: radius.md,
          backgroundColor: tones.bg,
          borderWidth: 1, borderColor: tones.border,
          opacity: disabled ? 0.4 : 1,
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Text style={{ color: tones.fg, fontSize: size.ui, fontFamily: font.uiMed }}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * ม่านทับฉากพื้นหลัง
 * ฉากทุกฉากเป็นภาพวาดที่มีรายละเอียดเยอะ ตัวหนังสือวางทับตรงๆ จะอ่านไม่ออก
 */
export function Scrim({
  children, heavy = false, style,
}: {
  children?: React.ReactNode; heavy?: boolean; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ flex: 1, backgroundColor: heavy ? palette.scrimHeavy : palette.scrim }, style]}>
      {children}
    </View>
  );
}
