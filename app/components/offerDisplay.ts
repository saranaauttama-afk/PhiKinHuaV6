import type { PageOffer } from '../../src/core/map/pages';
import { getMonsterById } from '../../src/core/monsters/thai-ghosts';

/**
 * แปลง PageOffer จาก engine เป็นข้อมูลที่ BtnEncounter ใช้แสดงผล
 *
 * ก่อนหน้านี้หน้าแผนที่ hardcode encounter ไว้ 3 อัน ทำให้ระบบ map/page
 * ที่ engine ทำเสร็จแล้ว (สุ่ม offer, force split, boss ที่ไฟต์ 7/15,
 * ร้านค้าที่ respawn ได้) ไม่มีทางเข้าจาก UI เลย
 */

export type OfferDisplay = {
  id: string;
  type: string;
  name: string;
  description: string;
  /** ต้องไปหน้าต่อสู้ไหม */
  isCombat: boolean;
  /** ลบออกจากแผนที่ได้ไหม (มอนสเตอร์กับบอสลบไม่ได้) */
  canDismiss: boolean;
};

export function describeOffer(offer: PageOffer, index: number): OfferDisplay {
  const base = { id: `${offer.kind}-${index}`, isCombat: false, canDismiss: true };

  switch (offer.kind) {
    case 'monster': {
      const m = getMonsterById(offer.enemyId);
      return {
        ...base,
        id: offer.enemyId,
        type: offer.tier === 'elite' ? 'boss' : 'monster',
        name: m?.name ?? (offer.tier === 'elite' ? 'ศัตรูพิเศษ' : 'ศัตรู'),
        description: m?.description ?? 'ศัตรูที่รออยู่ข้างหน้า',
        isCombat: true,
        canDismiss: false,
      };
    }

    case 'boss': {
      const b = getMonsterById(offer.enemyId);
      return {
        ...base,
        id: offer.enemyId,
        type: 'boss',
        name: b?.name ?? 'บอส',
        description: b?.description ?? 'ศึกใหญ่ที่หลีกเลี่ยงไม่ได้',
        isCombat: true,
        canDismiss: false,
      };
    }

    case 'shop_card':
      return { ...base, type: 'shop_card', name: 'ร้านค้าการ์ด', description: 'ซื้อการ์ดใหม่เพื่อเสริมสำรับ' };

    case 'shop_equipment':
      return { ...base, type: 'shop_equipment', name: 'ร้านเครื่องราง', description: 'ซื้อเครื่องรางติดตัว' };

    case 'shop_remove':
      return { ...base, type: 'shop_card', name: 'สละการ์ด', description: 'ถอดการ์ดที่ไม่ต้องการออกจากสำรับ' };

    case 'shop_upgrade':
      return { ...base, type: 'shop_equipment', name: 'ปลุกเสกการ์ด', description: 'อัปเกรดการ์ดที่มีอยู่ให้แรงขึ้น' };

    case 'well':
      return { ...base, type: 'healing_shrine', name: 'บ่อน้ำลึกลับ', description: 'ดื่มน้ำจากบ่อ ฟื้นพลังชีวิต' };

    case 'healing_shrine':
      return { ...base, type: 'healing_shrine', name: 'ศาลพักใจ', description: 'พักฟื้น เรียกพลังชีวิตกลับคืน' };

    case 'treasure':
      return { ...base, type: 'treasure', name: 'หีบสมบัติ', description: 'รับการ์ดฟรี เลือก 1 จาก 2 ใบ' };

    case 'treasure_single':
      return { ...base, type: 'treasure_single', name: 'สมบัติชิ้นเดียว', description: 'ได้การ์ดฟรีหนึ่งใบ' };

    case 'next_event':
      return { ...base, type: 'next_event', name: 'ทางไปต่อ', description: 'เดินทางต่อไปยังพื้นที่ถัดไป', canDismiss: false };
  }
}

/** offer ที่ต้องลบด้วยคำสั่งของร้าน (เพื่อให้ช่องถูก refresh) */
export function isShopLike(offer: PageOffer): boolean {
  return (
    offer.kind.startsWith('shop_') ||
    offer.kind === 'well' ||
    offer.kind === 'healing_shrine' ||
    offer.kind === 'treasure' ||
    offer.kind === 'treasure_single'
  );
}
