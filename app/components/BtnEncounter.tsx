// app/components/BtnEncounter.tsx — การ์ดทางแยกบนแผนที่
//
// กรอบ `bgEnNormal.png` ออกแบบช่องมาให้แล้ว: แถบชื่อด้านบน ช่องภาพใหญ่ตรงกลาง
// ช่องคำบรรยาย และแถบล่างสำหรับปุ่ม
//
// เดิมโค้ดวางเนื้อหาด้วย `top: 12` / `marginTop: 20` / `marginTop: 15` เรียงต่อกัน
// ไปเรื่อยๆ ซึ่งไม่ได้อ้างอิงกับช่องในกรอบเลย ตัวหนังสือจึงไปทับเถาวัลย์
// และช่องคำบรรยายที่วาดไว้ก็ว่างเปล่า
//
// ตอนนี้วางแบบ absolute ตามสัดส่วนที่วัดจากไฟล์ภาพจริง (ดู `encounterFrame` ใน theme)
// เปลี่ยนขนาดการ์ดแล้วทุกอย่างขยับตามสัดส่วนเอง

import React from 'react';
import { ImageBackground, Pressable, Text, View } from 'react-native';
import Art from './Art';
import { encounterFrame as F, font, palette, size, surface, tint } from '../theme';

interface BtnEncounterProps {
  encounter: {
    id: string;
    type: string;
    name: string;
    description: string;
    /** ช่องรูปใน src/art/catalog.ts */
    artSlot: string;
  };
  /** ความสูงของการ์ด — ความกว้างคำนวณจากสัดส่วนของกรอบ */
  height?: number;
  onPress?: () => void;
  onEnter?: () => void;
  onClose?: () => void;
  showButtons?: boolean;
}

export default function BtnEncounter({
  encounter, height = 250, onPress, onEnter, onClose, showButtons = false,
}: BtnEncounterProps) {
  const H = height;
  const W = H * F.ratio;
  const insetX = W * F.insetX;
  const contentW = W - insetX * 2;

  /** วางกล่องลงในช่องของกรอบตามสัดส่วน */
  const slot = (top: number, h: number) => ({
    position: 'absolute' as const,
    top: H * top,
    height: H * h,
    left: insetX,
    width: contentW,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  });

  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center' }}>
      <ImageBackground
        source={require('../../assets/encounters/bgEnNormal.png')}
        style={{ width: W, height: H }}
        resizeMode="stretch"
      >
        {/* แถบชื่อ */}
        <View style={slot(F.titleTop, F.titleH)}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              color: palette.moon, fontSize: size.label,
              fontFamily: font.heading, textAlign: 'center',
            }}
          >
            {encounter.name}
          </Text>
        </View>

        {/* ช่องภาพ — ยังไม่มีรูปก็ได้ placeholder ที่บอกโจทย์ภาพแทน */}
        <View style={slot(F.artTop, F.artH)}>
          <Art
            slot={encounter.artSlot}
            width={contentW * 0.92}
            height={H * F.artH * 0.96}
            compact
          />
        </View>

        {/* ช่องคำบรรยาย — เดิมช่องนี้ว่างเปล่าเพราะข้อความไปอยู่ที่อื่น */}
        <View style={[slot(F.descTop, F.descH), { justifyContent: 'flex-start' }]}>
          <Text
            numberOfLines={4}
            style={{
              color: palette.text, opacity: 0.85,
              fontSize: size.tiny, lineHeight: 13,
              fontFamily: font.ui, textAlign: 'center',
            }}
          >
            {encounter.description}
          </Text>
        </View>

        {/* แถบล่าง — ปุ่มเข้า */}
        {showButtons && (
          <View style={slot(F.footerTop, F.footerH)}>
            <Pressable
              onPress={onEnter}
              style={{
                paddingHorizontal: 16, paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: tint.moonSoft,
                borderWidth: 1, borderColor: palette.lineStrong,
              }}
            >
              <Text style={{ color: palette.moon, fontSize: size.label, fontFamily: font.uiMed }}>
                {encounter.type === 'monster' || encounter.type === 'boss' ? 'จับผี' : 'เข้า'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* ปุ่มข้าม — เฉพาะโหนดที่ข้ามได้ */}
        {showButtons && encounter.type !== 'monster' && encounter.type !== 'boss' && (
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={{
              position: 'absolute',
              top: H * F.titleTop, right: insetX * 0.4,
              width: 22, height: 22, borderRadius: 11,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: surface.panelDeep,
              borderWidth: 1, borderColor: tint.bloodHint,
            }}
          >
            <Text style={{ color: palette.blood, fontSize: 12, fontFamily: font.uiMed }}>✕</Text>
          </Pressable>
        )}
      </ImageBackground>
    </Pressable>
  );
}
