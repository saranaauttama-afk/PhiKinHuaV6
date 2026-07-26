// app/components/Art.tsx — จุดเดียวที่ผูกไฟล์รูปจริงเข้ากับช่องรูปของเกม
//
// **วิธีเพิ่มรูปใหม่: วางไฟล์ตาม path ที่ `docs/art-checklist.md` บอก แล้วเพิ่ม
// หนึ่งบรรทัดใน `ART_SOURCES` ข้างล่าง — จบ ไม่ต้องแก้คอมโพเนนต์ไหนอีก**
//
// ที่ต้องมาแปะมือแบบนี้เพราะ React Native / Metro บังคับว่า `require()` ต้องเป็น
// path คงที่ตอน build จะสแกนโฟลเดอร์แล้วโหลดตามชื่อไม่ได้
//
// ช่องไหนยังไม่มีรูป `<Art>` จะวาดกรอบ placeholder ที่บอกชื่อ ขนาด ชื่อไฟล์ที่ต้อง
// วาง และภาพควรเป็นอะไร — เพื่อให้ประกอบ UI ต่อได้เลยโดยไม่ต้องรอรูปครบ

import React from 'react';
import { Image, ImageStyle, StyleProp, Text, View, ViewStyle } from 'react-native';
import { artSlot } from '../../src/art/catalog';

/**
 * รูปที่มีอยู่จริงในโปรเจกต์ตอนนี้
 * key ต้องตรงกับ `id` ใน `src/art/catalog.ts` เป๊ะ (มีเทสต์คุมให้)
 */
export const ART_SOURCES: Record<string, any> = {
  'scene/start':  require('../../assets/scence/startPage.png'),
  'scene/swamp':  require('../../assets/scence/swamp.png'),
  'scene/hut':    require('../../assets/scence/abandonedHut.png'),
  'scene/battle': require('../../assets/scence/battleScence1.png'),

  'monster/phi-krasue': require('../../assets/monsters/phi-krasue.png'),

  'encounter/shop_card': require('../../assets/encounters/enShopCardMini.png'),
  'encounter/treasure':  require('../../assets/encounters/enTreasureOpenMini.png'),

  // ไฟล์สองอันนี้ตั้งชื่อตาม id ปลอมของ BlessingDialog ที่เป็น mock (ถูกลบไปแล้ว)
  // ไม่ตรงกับ id จริงใน blessings.json จึงต้องแม็ปตามความหมายของภาพ
  'blessing/ancestral_blessing': require('../../assets/imgBlessing/regen_1.png'),     // ฟื้น 1 HP ท้ายเทิร์น
  'blessing/meditation_peace':   require('../../assets/imgBlessing/start_block_3.png'), // ต้นเทิร์นได้ Block 3
};

export function hasArt(slotId: string): boolean {
  return !!ART_SOURCES[slotId];
}

/** รูปจริงของช่องนี้ ถ้ายังไม่มีคืน undefined */
export function artSource(slotId: string): any | undefined {
  return ART_SOURCES[slotId];
}

type Props = {
  /** id ของช่องรูป เช่น `monster/phi-pop` */
  slot: string;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  /** ย่อ placeholder เหลือแค่ชื่อ ใช้ตอนช่องเล็กมาก */
  compact?: boolean;
};

export default function Art({
  slot,
  width,
  height,
  style,
  imageStyle,
  resizeMode = 'contain',
  compact = false,
}: Props) {
  const spec = artSlot(slot);
  const src = ART_SOURCES[slot];

  // อัตราส่วนมาจาก catalog เพื่อให้ placeholder กินที่เท่ารูปจริงที่จะมาแทน
  const ratio = spec ? spec.size[0] / spec.size[1] : 1;
  const w = width ?? (height ? height * ratio : 120);
  const h = height ?? w / ratio;

  if (src) {
    return (
      <Image
        source={src}
        style={[{ width: w, height: h }, imageStyle as any]}
        resizeMode={resizeMode}
      />
    );
  }

  const tiny = compact || w < 90 || h < 90;

  return (
    <View
      style={[
        {
          width: w,
          height: h,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.28)',
          borderStyle: 'dashed',
          backgroundColor: 'rgba(255,255,255,0.06)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 6,
          paddingVertical: 6,
          gap: 3,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Text
        numberOfLines={2}
        style={{
          color: 'rgba(255,255,255,0.9)',
          fontSize: tiny ? 10 : 13,
          textAlign: 'center',
          fontFamily: 'Prompt_600SemiBold',
        }}
      >
        {spec?.label ?? slot}
      </Text>

      {!tiny && (
        <>
          <Text
            numberOfLines={3}
            style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: 10,
              textAlign: 'center',
              lineHeight: 14,
            }}
          >
            {spec?.brief ?? 'ยังไม่มีข้อมูลช่องรูปนี้ใน catalog'}
          </Text>

          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, textAlign: 'center' }}>
            {spec ? `assets/${spec.file} · ${spec.size[0]}×${spec.size[1]}` : slot}
          </Text>
        </>
      )}

      <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9 }}>รอรูป</Text>
    </View>
  );
}
