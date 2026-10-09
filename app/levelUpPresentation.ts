import type { Bucket } from '../src/core/types';

/** Selection opens another picker for these actions; say what the next tap does. */
export function levelUpConfirmLabel(bucket?: Bucket): string {
  switch (bucket) {
    case 'remove': return 'เลือกการ์ดที่จะสละ';
    case 'upgrade': return 'เลือกการ์ดที่จะปลุกเสก';
    case 'blessing': return 'เลือกพรที่จะรับ';
    case 'gold': case 'gold_skip': return 'รับเบี้ย';
    case 'max_hp': return 'เพิ่มพลังชีวิต';
    case 'max_energy': return 'เพิ่มพลังงาน';
    case 'max_hand': return 'เพิ่มขนาดมือ';
    case 'equipment_slot': return 'เพิ่มช่องเครื่องราง';
    default: return 'เลือกสิ่งที่จะรับ';
  }
}
