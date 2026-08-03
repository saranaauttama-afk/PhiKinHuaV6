// src/art/catalog.ts — ทะเบียนกลางว่าเกมนี้ "ต้องการ" รูปอะไรบ้าง
//
// ไฟล์นี้เป็นข้อมูลล้วน **ห้ามมี require() ของรูป** เพื่อให้:
//   - เทสต์และสคริปต์ทำลิสต์ของที่ยังขาดอ่านได้ (vitest โหลด .png ไม่ได้)
//   - รายการช่องรูป generate จากข้อมูลเกมจริง เพิ่มผีตัวใหม่แล้วช่องรูปโผล่เอง
//
// การผูกไฟล์รูปจริงเข้ากับ slot อยู่ที่ `app/components/Art.tsx` (`ART_SOURCES`)
// เพราะ React Native บังคับว่า `require()` ต้องเป็น path คงที่ตอน build
// สแกนโฟลเดอร์อัตโนมัติไม่ได้ → เพิ่มรูปใหม่ = เพิ่มหนึ่งบรรทัดที่ไฟล์นั้น

import { THAI_GHOST_POOLS } from '../core/monsters/thai-ghosts';
import { CHARACTER_CLASSES, ALL_CLASS_IDS } from '../core/classes';
import { STORY_EVENTS } from '../core/events/story';
import { STORY_CHAPTERS } from '../core/story/chapters';

const blessings: Array<{ id: string; name: string; desc?: string }> =
  require('../data/packs/base/blessings.json');

export type ArtSlot = {
  /** id ของช่อง เช่น `monster/phi-pop` */
  id: string;
  /** ชื่อที่คนอ่านรู้เรื่อง — ขึ้นบน placeholder และในลิสต์ */
  label: string;
  /** ไฟล์ที่ต้องวาง นับจากโฟลเดอร์ `assets/` */
  file: string;
  /** ขนาดที่ออกแบบไว้ (กว้าง สูง) หน่วย px */
  size: [number, number];
  /** ภาพนี้ควรเป็นอะไร — ใช้ทั้งบน placeholder และเป็นโจทย์ตอนไปหา/สร้างรูป */
  brief: string;
  /** จัดกลุ่มในลิสต์ */
  group: 'monster' | 'boss' | 'class' | 'blessing' | 'scene' | 'node' | 'encounter' | 'event' | 'chapter';
  /**
   * ไฟล์ที่มีอยู่ยังเป็นพื้นทึบ ทั้งที่ช่องนี้ต้องการพื้นโปร่ง
   *
   * ตั้งไว้เพื่อให้ `<Art>` วาดกรอบครอบให้ ภาพจะได้อ่านเป็น "ภาพในกรอบ"
   * แทนที่จะเป็นสี่เหลี่ยมพื้นสีลอยอยู่กลางฉาก — เป็นการกลบชั่วคราว
   * ไม่ใช่การแก้ ถ้าได้ไฟล์พื้นโปร่งมาแล้วให้ลบธงนี้ทิ้ง
   */
  opaqueSource?: boolean;
};

/**
 * โจทย์ภาพร่วมของทั้งเกม
 *
 * ตาม §4 ของ context.md: เทคนิคยืมจาก Night of the Full Moon (วาดมือแบบหนังสือ
 * นิทาน กรอบกระดาษเก่า โทนหม่นตัดไฟอุ่น) แต่ **เนื้อหาเป็นไทยชัดเจน** — ทุ่งนา
 * ป่า วัด ผ้าแพรบูชา ธูป ดงกล้วย ไม่ใช่เทพนิยายยุโรป
 */
export const STYLE_BRIEF =
  'วาดมือแนวหนังสือนิทาน โทนหม่นตัดแสงไฟอุ่น บรรยากาศผีไทยชนบท (ทุ่งนา ป่า วัด ธูป ผ้าแพร)';

/** ฉากพื้นหลังเต็มจอ */
const SCENES: ArtSlot[] = [
  { id: 'scene/start',   label: 'หน้าเริ่มเกม',     file: 'scence/startPage.png',      size: [1080, 1920], brief: 'ปกเกม — ตัวเอกยืนหันหลังมองทางเข้าป่า/หมู่บ้านยามค่ำ', group: 'scene' },
  { id: 'scene/swamp',   label: 'ฉากหนองน้ำ',       file: 'scence/swamp.png',          size: [1080, 1920], brief: 'หนองน้ำยามค่ำ หมอกลอย ใช้เป็นพื้นหลังหน้าแผนที่', group: 'scene' },
  { id: 'scene/hut',     label: 'ฉากกระท่อมร้าง',   file: 'scence/abandonedHut.png',   size: [1080, 1920], brief: 'กระท่อมไม้ร้างกลางทุ่ง ใช้เป็นพื้นหลังหน้าเหตุการณ์', group: 'scene' },
  { id: 'scene/battle',  label: 'ฉากต่อสู้',        file: 'scence/battleScence1.png',  size: [1080, 1920], brief: 'ลานดินหน้าวัด/ดงไม้ ใช้เป็นพื้นหลังหน้าต่อสู้', group: 'scene' },
  { id: 'scene/rest',    label: 'ฉากจุดพัก',        file: 'scence/rest.png',           size: [1080, 1920], brief: 'ศาลาริมทาง กองไฟ ใช้เป็นพื้นหลังโหนดพักบนเส้นทาง', group: 'scene' },
  { id: 'scene/boss',    label: 'ฉากศึกบอส',        file: 'scence/boss.png',           size: [1080, 1920], brief: 'โบสถ์ร้าง/ต้นไม้ใหญ่ตอนพระจันทร์เต็มดวง ใช้เฉพาะไฟต์บอส', group: 'scene' },
];

/** ภาพกลางการ์ด encounter บนหน้าแผนที่ (โหนดที่ไม่ใช่การต่อสู้) */
const ENCOUNTERS: ArtSlot[] = [
  { id: 'encounter/shop_card',       label: 'ร้านค้าการ์ด',   file: 'encounters/enShopCardMini.png',     size: [200, 200], brief: 'แผงขายของริมทาง มีม้วนคาถา/ยันต์วางขาย', group: 'encounter' },
  { id: 'encounter/shop_equipment',  label: 'ร้านเครื่องราง', file: 'encounters/enShopEquipMini.png',    size: [200, 200], brief: 'แผงขายเครื่องราง ตะกรุด ลูกประคำ', group: 'encounter' },
  { id: 'encounter/shop_remove',     label: 'สละการ์ด',       file: 'encounters/enRemoveMini.png',       size: [200, 200], brief: 'กองไฟเผากระดาษยันต์ สื่อถึงการทิ้งการ์ด', group: 'encounter' },
  { id: 'encounter/shop_upgrade',    label: 'ปลุกเสกการ์ด',   file: 'encounters/enUpgradeMini.png',      size: [200, 200], brief: 'โต๊ะพิธี ธูปเทียน สื่อถึงการปลุกเสก', group: 'encounter' },
  { id: 'encounter/well',            label: 'บ่อน้ำลึกลับ',   file: 'encounters/enWellMini.png',         size: [200, 200], brief: 'บ่อน้ำหินเก่า มีแสงเรืองจากก้นบ่อ', group: 'encounter' },
  { id: 'encounter/healing_shrine',  label: 'ศาลพักใจ',       file: 'encounters/enShrineMini.png',       size: [200, 200], brief: 'ศาลพระภูมิเล็กๆ มีผ้าแพรและธูปจุดค้างอยู่', group: 'encounter' },
  { id: 'encounter/treasure',        label: 'หีบสมบัติ',      file: 'encounters/enTreasureOpenMini.png', size: [200, 200], brief: 'หีบไม้เก่าเปิดอยู่ มีแสงลอดออกมา', group: 'encounter' },
  { id: 'encounter/treasure_single', label: 'สมบัติชิ้นเดียว', file: 'encounters/enTreasure1Mini.png',    size: [200, 200], brief: 'ห่อผ้าเล็กๆ วางบนตอไม้ มีของชิ้นเดียวข้างใน', group: 'encounter' },
  { id: 'encounter/fusion_altar',    label: 'แท่นผสาน',       file: 'encounters/enFusionMini.png',       size: [200, 200], brief: 'แท่นหินกลางป่า มีรอยยันต์เรืองแสง ใช้รวมการ์ดสองใบเป็นใบเดียว', group: 'encounter' },
];

/** ไอคอนบนแถบเส้นทาง — ตอนนี้ยังเป็น emoji อยู่ */
const NODES: ArtSlot[] = [
  { id: 'node/fight', label: 'ไอคอนโหนดสู้',  file: 'nodes/fight.png', size: [96, 96], brief: 'สัญลักษณ์การต่อสู้ — มีดหมอ/ตะกรุด บนวงกลมโปร่ง', group: 'node' },
  { id: 'node/boss',  label: 'ไอคอนโหนดบอส',  file: 'nodes/boss.png',  size: [96, 96], brief: 'สัญลักษณ์บอส — กะโหลก/มงกุฎผี บนวงกลมโปร่ง', group: 'node' },
  { id: 'node/rest',  label: 'ไอคอนโหนดพัก',  file: 'nodes/rest.png',  size: [96, 96], brief: 'สัญลักษณ์จุดพัก — ศาลา/กองไฟ บนวงกลมโปร่ง', group: 'node' },
];

function monsterSlots(): ArtSlot[] {
  const out: ArtSlot[] = [];
  for (const [tier, list] of Object.entries(THAI_GHOST_POOLS)) {
    const isBoss = tier.includes('Boss');
    for (const m of list) {
      out.push({
        id: `monster/${m.id}`,
        label: m.name,
        file: `monsters/${m.id}.png`,
        // บอสวาดใหญ่กว่า เพราะกินพื้นที่กลางจอตอนสู้
        size: isBoss ? [768, 768] : [512, 512],
        brief: (m.description ? `${m.description} — ` : '')
          + 'ครึ่งตัว หันหน้าเข้าหาผู้เล่น **PNG พื้นโปร่งเท่านั้น** '
          + 'โทนเดียวกับฉาก (ดินเผา-เขียวมะกอก ตัดไฟอุ่น) ไม่ใช่สีสดแบบการ์ตูน',
        group: isBoss ? 'boss' : 'monster',
        // ไฟล์เดียวที่มีตอนนี้เป็นพื้นทึบ ดูหมายเหตุที่ `opaqueSource`
        opaqueSource: m.id === 'phi-krasue',
      });
    }
  }
  return out;
}

function classSlots(): ArtSlot[] {
  return ALL_CLASS_IDS.map(id => {
    const cls = CHARACTER_CLASSES[id];
    return {
      id: `class/${id}`,
      label: cls.name,
      file: `classes/${id}.png`,
      size: [512, 768] as [number, number],
      brief: `${cls.desc} — เต็มตัว ยืนนิ่ง พื้นหลังโปร่ง ใช้ในหน้าเลือกผู้เดินทาง`,
      group: 'class' as const,
    };
  });
}

function blessingSlots(): ArtSlot[] {
  return blessings.map(b => ({
    id: `blessing/${b.id}`,
    label: b.name,
    file: `imgBlessing/${b.id}.png`,
    size: [256, 256] as [number, number],
    brief: `${b.desc ?? b.name} — ไอคอนวัตถุมงคลชิ้นเดียว พื้นหลังโปร่ง`,
    group: 'blessing' as const,
  }));
}

/**
 * ภาพประกอบของเหตุการณ์เล่าเรื่อง
 *
 * ใช้ข้อความเปิดเรื่องเป็นโจทย์ภาพตรงๆ — คนหารูปจะได้ไม่ต้องเปิดไฟล์ข้อมูลอีกที
 * และภาพกับข้อความจะได้ไม่หลุดจากกันเวลาแก้เนื้อเรื่อง
 */
function storyEventSlots(): ArtSlot[] {
  return STORY_EVENTS.map(e => ({
    id: `event/${e.id}`,
    label: e.title,
    file: `events/${e.id}.png`,
    size: [768, 512] as [number, number],
    brief: `${e.text.slice(0, 90)}… — ภาพฉากแนวนอน ไม่ต้องมีตัวเอกในภาพ`,
    group: 'event' as const,
  }));
}

/**
 * ภาพประกอบบทคั่น — ภาพเดียวเต็มความกว้าง อยู่เหนือข้อความ
 *
 * ใช้ย่อหน้าแรกเป็นโจทย์ เพราะมันคือสิ่งที่ผู้เล่นเห็นพร้อมภาพพอดี
 */
function chapterSlots(): ArtSlot[] {
  return STORY_CHAPTERS.map(c => ({
    id: `chapter/${c.id}`,
    label: `บท: ${c.title}${c.classId ? ` (${c.classId})` : ''}`,
    file: `chapters/${c.id}.png`,
    size: [1024, 576] as [number, number],
    brief: `${c.text[0]?.slice(0, 90) ?? c.title}… — ภาพฉากแนวนอน บรรยากาศนำก่อนข้อความ`,
    group: 'chapter' as const,
  }));
}

/** ช่องรูปทั้งหมดที่เกมต้องการ เรียงตามกลุ่ม */
export const ART_CATALOG: ArtSlot[] = [
  ...SCENES,
  ...classSlots(),
  ...monsterSlots(),
  ...blessingSlots(),
  ...storyEventSlots(),
  ...chapterSlots(),
  ...ENCOUNTERS,
  ...NODES,
];

export const ART_BY_ID: Record<string, ArtSlot> = Object.fromEntries(
  ART_CATALOG.map(s => [s.id, s])
);

export function artSlot(id: string): ArtSlot | undefined {
  return ART_BY_ID[id];
}
