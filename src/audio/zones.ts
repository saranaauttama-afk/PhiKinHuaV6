import type { BedId, SfxId } from './manifest';

/**
 * เสียงตามโซน (ชุด 3, 16 ต.ค. 2026) — ฟังก์ชันล้วน มีเทสต์ `test/audio-zones.test.ts`
 *
 * เจ้าของเกมอยากให้แผนที่ "มีเสียงชีวิต" แบบหมู่บ้านกลางคืน (จิ้งหรีด ลม นาน ๆ หมาหอนที)
 * แทนเพลงวนอย่างเดียว และตอนสู้ให้เปลี่ยนเป็นลมแรงขึ้น + กลองจังหวะ (ไม่ต้องเป็นดนตรีไทย)
 * ฉากเดินทาง 16 ฉากจัดเป็นโซนเสียง ฉากใกล้กันใช้ชุดเดียวกัน — แผนเต็มอยู่ใน docs/audio/AUDIO.md
 *
 * แต่ละโซนมี 3 ส่วน:
 * - `map`     เสียงพื้นวนบนแผนที่/ร้าน/อีเวนต์
 * - `battle`  เสียงพื้นตอนสู้ (โซนเดิม แต่สัตว์เงียบ ลมแรงขึ้น) — ซ้อนกับกลอง `BATTLE_DRUM`
 * - `oneShots` เสียงแทรกนาน ๆ ที สุ่มเล่นบนแผนที่ (แยกจากลูป เพื่อไม่ให้หมาหอนจุดเดิมทุกรอบลูป)
 *
 * โซนที่ยังไม่มีไฟล์ใช้ชุดหมู่บ้านไปก่อน (`FALLBACK_ZONE`)
 */
export type ZoneId = 'village' | 'temple' | 'cremation' | 'forest' | 'water' | 'mountain' | 'cave' | 'otherworld';

type ZoneSound = { map: BedId | null; battle: BedId | null; oneShots: SfxId[] };

export const ZONES: Record<ZoneId, ZoneSound> = {
  village: { map: 'villageBed', battle: 'villageBattleBed', oneShots: ['villageDogHowl'] },
  temple: { map: null, battle: null, oneShots: [] },
  cremation: { map: null, battle: null, oneShots: [] },
  forest: { map: null, battle: null, oneShots: [] },
  water: { map: null, battle: null, oneShots: [] },
  mountain: { map: null, battle: null, oneShots: [] },
  cave: { map: null, battle: null, oneShots: [] },
  otherworld: { map: null, battle: null, oneShots: [] },
};

const FALLBACK_ZONE: ZoneId = 'village';

/** ฉากเดินทาง (app/scenePresentation.ts adventureSceneId) → โซนเสียง */
const SCENE_ZONE: Record<string, ZoneId> = {
  '01-village': 'village',
  '02-village-edge': 'village',
  '03-temple-gate': 'temple',
  '04-temple-court': 'temple',
  '05-cremation-ground': 'cremation',
  '06-bamboo-forest': 'forest',
  '07-banyan': 'forest',
  '08-stream': 'water',
  '09-waterfall': 'water',
  '10-mountain-trail': 'forest',
  '11-mountain-shrine': 'mountain',
  '12-cave-mouth': 'cave',
  '13-cave-river': 'cave',
  '14-buried-sanctuary': 'cave',
  '15-otherworld-gate': 'otherworld',
  '16-secret-throne': 'otherworld',
};

/** กลองหัวใจตอนสู้ ใช้ร่วมทุกโซน (ระดับผีเก่ง/บอสยังไม่มีไฟล์) */
export const BATTLE_DRUM: BedId = 'battleDrumNormal';

/** แผนที่ยังเปิดเพลงชั่วคราวเบา ๆ ใต้เสียงโซน — รอเจ้าของตัดสินว่าจะเก็บหรือตัด */
export const MAP_KEEPS_MUSIC = true;

/** เสียงแทรกสุ่มทุก 40–90 วินาที (เบา ไกล ไม่ให้ถี่จนกลายเป็นลูป) */
export const ONE_SHOT_GAP_MS: [number, number] = [40_000, 90_000];

export function zoneOf(sceneId: string | undefined): ZoneId {
  return (sceneId && SCENE_ZONE[sceneId]) || FALLBACK_ZONE;
}

function soundOf(zone: ZoneId, part: 'map' | 'battle'): BedId | null {
  return ZONES[zone][part] ?? ZONES[FALLBACK_ZONE][part];
}

export type AudioMode = 'map' | 'battle' | 'victory';

/**
 * เสียงพื้นที่ควรดังตอนนี้
 * - map: (เพลงชั่วคราว) + เสียงพื้นของโซน
 * - battle: เสียงพื้นตอนสู้ของโซน + กลอง — ไม่มีเพลง (เจ้าของ: ไม่ต้องดนตรีไทย)
 * - victory: กลองหยุด เหลือลม ให้รู้สึกว่า "รอดแล้ว" ก่อนกลับแผนที่
 */
export function bedsFor(sceneId: string | undefined, mode: AudioMode): BedId[] {
  const zone = zoneOf(sceneId);
  if (mode === 'map') {
    const bed = soundOf(zone, 'map');
    return [...(MAP_KEEPS_MUSIC ? (['music'] as BedId[]) : []), ...(bed ? [bed] : [])];
  }
  const bed = soundOf(zone, 'battle');
  return [...(bed ? [bed] : []), ...(mode === 'battle' ? [BATTLE_DRUM] : [])];
}

/** เสียงแทรกของโซนบนแผนที่ (ตอนสู้ไม่มี — กลองกับลมคุมอารมณ์อยู่แล้ว) */
export function oneShotsFor(sceneId: string | undefined, mode: AudioMode): SfxId[] {
  if (mode !== 'map') return [];
  const zone = zoneOf(sceneId);
  return ZONES[zone].oneShots.length ? ZONES[zone].oneShots : ZONES[FALLBACK_ZONE].oneShots;
}

/** เกนก้าวหนึ่งของการเฟด (0..1) — เปลี่ยนเต็มช่วงภายใน fadeMs */
export function stepGain(current: number, target: number, dtMs: number, fadeMs: number): number {
  if (fadeMs <= 0) return target;
  const step = dtMs / fadeMs;
  return current < target ? Math.min(target, current + step) : Math.max(target, current - step);
}
