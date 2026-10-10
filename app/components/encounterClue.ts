import type {PageOffer} from '../../src/core/map/pages';
import {ENEMY_ARCHETYPES} from '../../src/core/campaign/enemyDecks';

/** Public persistent traits, never a forecast of the enemy's next card. */
const traits:Record<string,string>={hunger:'กัดกินพลังชีวิต\nฟื้นเลือดเมื่อโจมตี',poison:'ปล่อยพิษสะสม\nหลบการโจมตี',counter:'ตั้งรับแล้วสวนกลับ\nลดแรงโจมตี',fear:'ทำให้หวาดกลัว\nบั่นทอนพลัง',drain:'ดูดพลังชีวิต\nฟื้นกำลัง',curse:'แทรกคำสาป\nขัดจังหวะสำรับ',rush:'จู่โจมต่อเนื่อง\nเร่งพลังโจมตี',rage:'สะสมความแข็งแกร่ง\nโจมตีรุนแรง',guard:'ตั้งรับแน่นหนา\nรอจังหวะโจมตี'};
export function encounterClue(o:PageOffer):string{
 if(o.kind==='monster'||o.kind==='boss')return traits[ENEMY_ARCHETYPES[o.enemyId]]??'วิญญาณขวางทาง\nเตรียมพร้อมต่อสู้';
 switch(o.kind){
  case 'shop_card':return 'เลือกซื้อการ์ด\nเสริมสำรับ';
  case 'shop_equipment':return 'เลือกซื้อเครื่องราง\nเสริมพลังระหว่างทาง';
  case 'well':return 'ดื่มน้ำจากบ่อ\nฟื้นพลังชีวิต';
  case 'healing_shrine':return 'พักฟื้นที่ศาล\nเรียกกำลังกลับคืน';
  case 'treasure':return 'เปิดหีบสมบัติ\nเลือกการ์ดหนึ่งใบ';
  case 'treasure_single':return 'รับสมบัติหนึ่งชิ้น\nเพิ่มการ์ดในสำรับ';
  case 'shop_upgrade':return 'ปลุกเสกการ์ด\nเพิ่มพลังวิชา';
  case 'shop_remove':return 'สละการ์ดที่ไม่ใช้\nจัดสำรับให้กระชับ';
  case 'fusion_altar':return 'ผสานการ์ดสองใบ\nรวมพลังเป็นวิชาใหม่';
  case 'story_event':return 'เรื่องราวระหว่างทาง\nเลือกชะตาด้วยตนเอง';
  case 'next_event':return 'เดินทางต่อ\nสู่พื้นที่ถัดไป';
 }
}
