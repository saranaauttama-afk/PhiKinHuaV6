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
 'blessing/night_medium_blessing': require('../../assets/blessings/thai-v24/night_medium_blessing.webp'),
 'blessing/night_nun_blessing': require('../../assets/blessings/thai-v24/night_nun_blessing.webp'),
 'blessing/night_shaman_blessing': require('../../assets/blessings/thai-v24/night_shaman_blessing.webp'),
 'blessing/night_warrior_blessing': require('../../assets/blessings/thai-v24/night_warrior_blessing.webp'),
 'blessing/naga_blessing': require('../../assets/blessings/thai-v24/naga_blessing.webp'),
 'blessing/luang_pu_protection': require('../../assets/blessings/thai-v24/luang_pu_protection.webp'),
 'blessing/free_card_energy': require('../../assets/blessings/thai-v24/free_card_energy.webp'),
 'blessing/ritual_shield': require('../../assets/blessings/thai-v24/ritual_shield.webp'),
 'blessing/bamboo_dart_power': require('../../assets/blessings/thai-v24/bamboo_dart_power.webp'),
 'blessing/life_steal_spirit': require('../../assets/blessings/thai-v24/life_steal_spirit.webp'),
 'blessing/sacred_cloth': require('../../assets/blessings/thai-v24/sacred_cloth.webp'),
 'blessing/herbal_wisdom': require('../../assets/blessings/thai-v24/herbal_wisdom.webp'),
 'blessing/ghost_protection': require('../../assets/blessings/thai-v24/ghost_protection.webp'),
 'blessing/spirit_energy': require('../../assets/blessings/thai-v24/spirit_energy.webp'),
  'monster/night-head-collector':require('../../assets/monsters/thai-v24/night-head-collector.webp'),
  'monster/night-bell-keeper':require('../../assets/monsters/thai-v24/night-bell-keeper.webp'),
  'monster/night-root-lord':require('../../assets/monsters/thai-v24/night-root-lord.webp'),
  'monster/night-cave-mother':require('../../assets/monsters/thai-v24/night-cave-mother.webp'),
  'monster/night-headless-king':require('../../assets/monsters/thai-v24/night-headless-king.webp'),
  'monster/phi-kin-hua':require('../../assets/monsters/thai-v24/phi-kin-hua.webp'),

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
  'chapter/ending_secret': require('../../assets/scence/journey/thai-v24/16-secret-throne.jpg'),
  'chapter/ending_win': require('../../assets/scence/menu-haunted.jpg'),
  'chapter/secret_unlocked': require('../../assets/scence/journey/thai-v24/16-secret-throne.jpg'),
  'chapter/before_final_boss': require('../../assets/scence/journey/thai-v24/15-otherworld-gate.jpg'),
  'chapter/after_mid_boss': require('../../assets/scence/journey/thai-v24/07-banyan.jpg'),
  'chapter/prologue_medium': require('../../assets/ui/occupation-temple.jpg'),
  'chapter/prologue_nun': require('../../assets/ui/occupation-temple.jpg'),
  'chapter/prologue_warrior': require('../../assets/ui/occupation-temple.jpg'),
  'chapter/prologue_shaman': require('../../assets/ui/occupation-temple.jpg'),
  'monster/asuragaya': require('../../assets/monsters/thai-v24/asuragaya.webp'),
  'monster/jao-por-pa': require('../../assets/monsters/thai-v24/jao-por-pa.webp'),
  'monster/krahang': require('../../assets/monsters/thai-v24/krahang.webp'),
  'monster/kuman-thong': require('../../assets/monsters/thai-v24/kuman-thong.webp'),
  'monster/mae-nak': require('../../assets/monsters/thai-v24/mae-nak.webp'),
  'monster/ngu-phi-sang': require('../../assets/monsters/thai-v24/ngu-phi-sang.webp'),
  'monster/phaya-nak': require('../../assets/monsters/thai-v24/phaya-nak.webp'),
  'monster/phi-ha-ratri': require('../../assets/monsters/thai-v24/phi-ha-ratri.webp'),
  'monster/phi-mae-mai': require('../../assets/monsters/thai-v24/phi-mae-mai.webp'),
  'monster/phi-nang-yai': require('../../assets/monsters/thai-v24/phi-nang-yai.webp'),
  'monster/phi-pa': require('../../assets/monsters/thai-v24/phi-pa.webp'),
  'monster/phi-phrai': require('../../assets/monsters/thai-v24/phi-phrai.webp'),
  'monster/phi-pret': require('../../assets/monsters/thai-v24/phi-pret.webp'),
  'monster/phi-tai-hong': require('../../assets/monsters/thai-v24/phi-tai-hong.webp'),
  'monster/phra-upakut': require('../../assets/monsters/thai-v24/phra-upakut.webp'),
  'monster/phraya-maccurat': require('../../assets/monsters/thai-v24/phraya-maccurat.webp'),
  'monster/pisaj-fai': require('../../assets/monsters/thai-v24/pisaj-fai.webp'),
  'monster/pop-yai': require('../../assets/monsters/thai-v24/pop-yai.webp'),
  'monster/thep-aksorn': require('../../assets/monsters/thai-v24/thep-aksorn.webp'),
  'monster/winyan-dek': require('../../assets/monsters/thai-v24/winyan-dek.webp'),
  'monster/winyan-rerorn': require('../../assets/monsters/thai-v24/winyan-rerorn.webp'),
  'monster/yak-dam': require('../../assets/monsters/thai-v24/yak-dam.webp'),
  'monster/yak-wat-jaeng': require('../../assets/monsters/thai-v24/yak-wat-jaeng.webp'),
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
  'scene/boss': require('../../assets/scence/journey/thai-v24/15-otherworld-gate.jpg'),

  'class/shaman': require('../../assets/classes/shaman.png'),
  'class/warrior': require('../../assets/classes/warrior.png'),
  'class/nun': require('../../assets/classes/nun.png'),
  'class/medium': require('../../assets/classes/medium.png'),

  'monster/phi-krasue': require('../../assets/monsters/thai-v24/phi-krasue.webp'),
  'monster/phi-pop': require('../../assets/monsters/thai-v24/phi-pop.webp'),
  'monster/nang-tanee': require('../../assets/monsters/thai-v24/nang-tanee.webp'),
  'monster/phi-nang-ram': require('../../assets/monsters/thai-v24/phi-nang-ram.webp'),
  'monster/phi-pong-kang': require('../../assets/monsters/thai-v24/phi-pong-kang.webp'),

  'encounter/shop_card': require('../../assets/cards/thai-v24/offering_tray.webp'),
  'encounter/treasure':  require('../../assets/encounters/enTreasureOpenMini.png'),

  // ไฟล์สองอันนี้ตั้งชื่อตาม id ปลอมของ BlessingDialog ที่เป็น mock (ถูกลบไปแล้ว)
  // ไม่ตรงกับ id จริงใน blessings.json จึงต้องแม็ปตามความหมายของภาพ
  'blessing/ancestral_blessing': require('../../assets/blessings/thai-v24/ancestral_blessing.webp'),     // ฟื้น 1 HP ท้ายเทิร์น
  'blessing/meditation_peace':   require('../../assets/blessings/thai-v24/meditation_peace.webp'), // ต้นเทิร์นได้ Block 3
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
