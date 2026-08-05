// app/components/PlayerStatusBar.tsx — แถบสถานะผู้เล่นบนหน้าแผนที่
//
// สองเรื่องที่แก้จากของเดิม:
//
// 1. **สี** — เดิมแจกสีคนละสีให้ทุกค่า (HP แดง, Energy ฟ้า, Gold ส้ม, Hand ม่วง,
//    EXP เขียว) ซึ่งเป็นสีจากพาเลตต์เว็บที่ไม่มีอยู่ในงานอาร์ตเลยสักสี
//    ตอนนี้เหลือสีเน้นสองสีตามระบบ: แดงเลือดหมูสำหรับ HP อย่างเดียว
//    ที่เหลือเป็นทองแสงจันทร์ แยกกันด้วยป้ายชื่อ ไม่ใช่ด้วยสี
//
// 2. **ตำแหน่ง** — เดิมวางเนื้อหาด้วย `top: 60, left: 25, width: 280` ตายตัว
//    ซึ่งอิงกับความกว้างจอเครื่องเดียว จอแคบกว่านั้นข้อความจะล้นออกนอกกรอบ
//    ตอนนี้วางตามสัดส่วนของกรอบ

import React from 'react';
import { ImageBackground, Pressable, Text, View } from 'react-native';
import type { GameState } from '../../src/core/types';
import { palette, font, size, radius, tint, layer } from '../theme';

const PANEL_H = 170;
const BOTTOM_GAP = 24;

/**
 * พื้นที่ที่แถบนี้กินไปจากก้นจอ
 *
 * หน้าไหนวางปุ่มหรือเนื้อหาไว้ล่างสุดต้องกันที่เท่านี้ — ปุ่ม "เดินต่อ" บนชั้นพัก
 * เคยตั้ง `bottom: 96` ซึ่งอยู่ในแถบนี้พอดี โผล่มาแค่ขอบบนโค้งๆ กดไม่ได้
 */
export const STATUS_BAR_SPACE = PANEL_H + BOTTOM_GAP;

/** พื้นที่ใช้งานจริงข้างในกรอบ วัดเป็นสัดส่วนจากไฟล์ bgUserPanel.png */
const INNER = { top: 0.34, height: 0.44, left: 0.09, right: 0.09 };

function Stat({
  label, value, danger = false, onPress,
}: { label: string; value: string; danger?: boolean; onPress?: () => void }) {
  const body = (pressed: boolean) => (
    <>
      <Text
        style={{
          color: danger ? palette.blood : palette.moonDim,
          fontSize: size.tiny,
          fontFamily: font.uiMed,
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          color: danger ? palette.blood : palette.text,
          fontSize: size.ui,
          fontFamily: font.ui,
          marginTop: 1,
          // ค่าที่กดได้ขีดเส้นใต้ไว้ ไม่งั้นมันดูเหมือนตัวเลขเฉยๆ ไม่มีใครลองกด
          textDecorationLine: onPress ? 'underline' : 'none',
        }}
      >
        {value}
      </Text>
    </>
  );

  if (!onPress) {
    return <View style={{ alignItems: 'center', flex: 1 }}>{body(false)}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        alignItems: 'center', flex: 1,
        borderRadius: radius.sm,
        backgroundColor: pressed ? tint.moonSoft : 'transparent',
      })}
    >
      {({ pressed }) => body(pressed)}
    </Pressable>
  );
}

export default function PlayerStatusBar({
  state, onOpenDeck, onOpenBlessings,
}: {
  state: GameState;
  onOpenDeck?: () => void;
  onOpenBlessings?: () => void;
}) {
  const p = state.player;

  return (
    <ImageBackground
      source={require('../../assets/images/bgUserPanel.png')}
      style={{
        position: 'absolute',
        bottom: BOTTOM_GAP,
        left: 12,
        right: 12,
        height: PANEL_H,
        zIndex: layer.statusBar,
      }}
      resizeMode="stretch"
    >
      <View
        style={{
          position: 'absolute',
          top: PANEL_H * INNER.top,
          height: PANEL_H * INNER.height,
          left: `${INNER.left * 100}%`,
          right: `${INNER.right * 100}%`,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Stat label="เลือด"   value={`${p.hp}/${p.maxHp}`} danger />
        <Stat label="พลังงาน" value={`${p.energy}/${p.maxEnergy}`} />
        <Stat label="ทอง"     value={`${p.gold ?? 0}`} />
        {/* เดิมช่องนี้คือ "มือ" ซึ่งบนแผนที่เป็น 0 เสมอ (สเตตคอมแบตถูกล้างแล้ว)
            เปลี่ยนเป็นจำนวนการ์ดในสำรับ และทำให้กดเข้าไปดูทั้งสำรับได้ */}
        <Stat label="สำรับ"   value={`${(state.masterDeck ?? []).length}`} onPress={onOpenDeck} />
        {/* พรสะสมได้ 4-9 อย่างต่อรันและทำงานตลอดเวลา แต่ไม่เคยมีที่ให้ดูเลย */}
        <Stat label="พร"      value={`${(state.blessings ?? []).length}`} onPress={onOpenBlessings} />
        <Stat label="ประสบการณ์" value={`${p.exp}/${p.expToNext}`} />
      </View>
    </ImageBackground>
  );
}
