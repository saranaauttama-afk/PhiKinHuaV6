import type {OfferDisplay} from './components/offerDisplay';
export function encounterAction(d:OfferDisplay):string {
 if(d.isCombat)return 'เผชิญหน้า →';
 if(d.type.startsWith('shop_'))return 'เข้าร้าน →';
 if(d.type==='story_event')return 'สำรวจเหตุการณ์ →';
 if(d.type==='next_event')return 'เดินทางต่อ →';
 return 'แวะจุดพัก →';
}
