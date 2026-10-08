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
import { font, palette, radius, surface } from '../theme';

/**
 * รูปที่มีอยู่จริงในโปรเจกต์ตอนนี้
 * key ต้องตรงกับ `id` ใน `src/art/catalog.ts` เป๊ะ (มีเทสต์คุมให้)
 */
export const ART_SOURCES: Record<string, any> = {
  'event/episode_blessing': require('../../assets/scence/lantern-hut.jpg'),
  'event/spirit_medium_trance': require('../../assets/scence/lantern-hut.jpg'),
  'event/boatman': require('../../assets/scence/lantern-hut.jpg'),
  'event/temple_bell': require('../../assets/scence/lantern-hut.jpg'),
  'event/fork_in_mist': require('../../assets/scence/lantern-hut.jpg'),
  'event/silk_on_tree': require('../../assets/scence/lantern-hut.jpg'),
  'event/night_funeral': require('../../assets/scence/lantern-hut.jpg'),
  'event/old_well': require('../../assets/scence/lantern-hut.jpg'),
  'event/crying_child': require('../../assets/scence/lantern-hut.jpg'),
  'event/wandering_shaman': require('../../assets/scence/lantern-hut.jpg'),
  'event/tanee_grove': require('../../assets/scence/lantern-hut.jpg'),
  'event/old_woman_rice': require('../../assets/scence/lantern-hut.jpg'),
  'event/roadside_shrine': require('../../assets/scence/lantern-hut.jpg'),
  'chapter/ending_lose': require('../../assets/scence/menu-haunted.jpg'),
  'chapter/ending_secret': require('../../assets/scence/boss.jpg'),
  'chapter/ending_win': require('../../assets/scence/menu-haunted.jpg'),
  'chapter/secret_unlocked': require('../../assets/scence/boss.jpg'),
  'chapter/before_final_boss': require('../../assets/scence/boss.jpg'),
  'chapter/after_mid_boss': require('../../assets/scence/boss.jpg'),
  'chapter/prologue_medium': require('../../assets/ui/occupation-temple.jpg'),
  'chapter/prologue_nun': require('../../assets/ui/occupation-temple.jpg'),
  'chapter/prologue_warrior': require('../../assets/ui/occupation-temple.jpg'),
  'chapter/prologue_shaman': require('../../assets/ui/occupation-temple.jpg'),
  'monster/asuragaya': require('../../assets/monsters/asuragaya.png'),
  'monster/jao-por-pa': require('../../assets/monsters/jao-por-pa.png'),
  'monster/krahang': require('../../assets/monsters/krahang.png'),
  'monster/kuman-thong': require('../../assets/monsters/kuman-thong.png'),
  'monster/mae-nak': require('../../assets/monsters/mae-nak.png'),
  'monster/ngu-phi-sang': require('../../assets/monsters/ngu-phi-sang.png'),
  'monster/phaya-nak': require('../../assets/monsters/phaya-nak.png'),
  'monster/phi-ha-ratri': require('../../assets/monsters/phi-ha-ratri.png'),
  'monster/phi-mae-mai': require('../../assets/monsters/phi-mae-mai.png'),
  'monster/phi-nang-yai': require('../../assets/monsters/phi-nang-yai.png'),
  'monster/phi-pa': require('../../assets/monsters/phi-pa.png'),
  'monster/phi-phrai': require('../../assets/monsters/phi-phrai.png'),
  'monster/phi-pret': require('../../assets/monsters/phi-pret.png'),
  'monster/phi-tai-hong': require('../../assets/monsters/phi-tai-hong.png'),
  'monster/phra-upakut': require('../../assets/monsters/phra-upakut.png'),
  'monster/phraya-maccurat': require('../../assets/monsters/phraya-maccurat.png'),
  'monster/pisaj-fai': require('../../assets/monsters/pisaj-fai.png'),
  'monster/pop-yai': require('../../assets/monsters/pop-yai.png'),
  'monster/thep-aksorn': require('../../assets/monsters/thep-aksorn.png'),
  'monster/winyan-dek': require('../../assets/monsters/winyan-dek.png'),
  'monster/winyan-rerorn': require('../../assets/monsters/winyan-rerorn.png'),
  'monster/yak-dam': require('../../assets/monsters/yak-dam.png'),
  'monster/yak-wat-jaeng': require('../../assets/monsters/yak-wat-jaeng.png'),
  'minion/kuman_spirit': require('../../assets/minions/kuman_spirit.png'),
  'minion/ghost_ally': require('../../assets/minions/ghost_ally.png'),
  'minion/demon_minion': require('../../assets/minions/demon_minion.png'),
  'minion/poison_spirit': require('../../assets/minions/poison_spirit.png'),
  'minion/shadow_clone': require('../../assets/minions/shadow_clone.png'),
  'minion/tree_guardian': require('../../assets/minions/tree_guardian.png'),
  'minion/ancient_warrior_spirit': require('../../assets/minions/ancient_warrior_spirit.png'),
  'minion/spirit_snail': require('../../assets/minions/spirit_snail.png'),
  'minion/forest_demon': require('../../assets/minions/forest_demon.png'),
  'scene/episode': require('../../assets/scence/episode-village.jpg'),
  'event/episode_lantern': require('../../assets/scence/lantern-hut.jpg'),
  'chapter/episode_open': require('../../assets/scence/episode-village.jpg'),
  'chapter/episode_end': require('../../assets/scence/menu-haunted.jpg'),
  'encounter/healing_shrine': require('../../assets/scence/rest.jpg'),
  'encounter/shop_upgrade': require('../../assets/scence/rest.jpg'),
  'scene/start':  require('../../assets/scence/startPage.png'),
  'scene/swamp':  require('../../assets/scence/swamp.png'),
  'scene/hut':    require('../../assets/scence/abandonedHut.png'),
  'scene/battle': require('../../assets/scence/battleScence1.png'),
  'scene/rest': require('../../assets/scence/rest.jpg'),
  'scene/boss': require('../../assets/scence/boss.jpg'),

  'class/shaman': require('../../assets/classes/shaman.png'),
  'class/warrior': require('../../assets/classes/warrior.png'),
  'class/nun': require('../../assets/classes/nun.png'),
  'class/medium': require('../../assets/classes/medium.png'),

  'monster/phi-krasue': require('../../assets/monsters/phi-krasue-pulp.png'),
  'monster/phi-pop': require('../../assets/monsters/phi-pop.png'),
  'monster/nang-tanee': require('../../assets/monsters/nang-tanee.png'),
  'monster/phi-nang-ram': require('../../assets/monsters/phi-nang-ram.png'),
  'monster/phi-pong-kang': require('../../assets/monsters/phi-pong-kang.png'),

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
    const img = (
      <Image
        source={src}
        style={[{ width: w, height: h }, imageStyle as any]}
        resizeMode={resizeMode}
      />
    );

    // ไฟล์ที่ยังเป็นพื้นทึบจะกลายเป็นสี่เหลี่ยมสีลอยอยู่กลางฉาก
    // ครอบกรอบให้อ่านเป็น "ภาพในกรอบ" ไปก่อน — กลบไว้ ไม่ใช่แก้
    // ได้ไฟล์พื้นโปร่งมาเมื่อไหร่ ให้ลบ `opaqueSource` ออกจาก catalog
    if (spec?.opaqueSource) {
      return (
        <View
          style={[
            {
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: palette.line,
              overflow: 'hidden',
            },
            style,
          ]}
        >
          {img}
        </View>
      );
    }

    return <View style={style}>{img}</View>;
  }

  const tiny = compact || w < 90 || h < 90;

  return (
    <View
      style={[
        {
          width: w,
          height: h,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: palette.line,
          borderStyle: 'dashed',
          backgroundColor: surface.panelDim,
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
          color: palette.text,
          fontSize: tiny ? 10 : 13,
          textAlign: 'center',
          fontFamily: font.heading,
        }}
      >
        {spec?.label ?? slot}
      </Text>

      {!tiny && (
        <>
          <Text
            numberOfLines={3}
            style={{
              color: palette.textDim,
              fontSize: 10,
              textAlign: 'center',
              lineHeight: 14,
              fontFamily: font.ui,
            }}
          >
            {spec?.brief ?? 'ยังไม่มีข้อมูลช่องรูปนี้ใน catalog'}
          </Text>

          <Text style={{ color: palette.textFaint, fontSize: 9, textAlign: 'center', fontFamily: font.ui }}>
            {spec ? `assets/${spec.file} · ${spec.size[0]}×${spec.size[1]}` : slot}
          </Text>
        </>
      )}

      <Text style={{ color: palette.textFaint, fontSize: 9, fontFamily: font.ui }}>รอรูป</Text>
    </View>
  );
}
