import type {PageOffer} from '../../src/core/map/pages';
import {ENEMY_ARCHETYPES} from '../../src/core/campaign/enemyDecks';

/** Public persistent traits, never a forecast of the enemy's next card. */
const traits:Record<string,string>={hunger:'กัดกินพลังชีวิต\nฟื้นเลือดเมื่อโจมตี',poison:'ปล่อยพิษสะสม\nหลบการโจมตี',counter:'ตั้งรับแล้วสวนกลับ\nลดแรงโจมตี',fear:'ทำให้หวาดกลัว\nบั่นทอนพลัง',drain:'ดูดพลังชีวิต\nฟื้นกำลัง',curse:'แทรกคำสาป\nขัดจังหวะสำรับ',rush:'จู่โจมต่อเนื่อง\nเร่งพลังโจมตี',rage:'สะสมความแข็งแกร่ง\nโจมตีรุนแรง',guard:'ตั้งรับแน่นหนา\nรอจังหวะโจมตี',
 // Night-1 ghosts (15 Oct 2026, docs/ghosts/NIGHT1-DESIGN.md): each page names the ghost's one mechanic.
 evade:'ลอยหลบหมัด\nดูดเลือดเมื่อตีเข้า',charge:'เก็บไพ่ไว้ชาร์จ\nยิ่งรอยิ่งหนัก',dance:'ร่ายรำต่อท่า\nยิ่งรำยิ่งแรง',
 minion:'เรียกลูกสมุน\nรับหมัดแทน',daze:'แสงทำให้มึน\nแต้มเทิร์นหน้าลด',wound:'กรีดให้เปราะ\nแล้วซ้ำแผล',
 minionDaze:'เงาป่ารับหมัดแทน\nลมป่าทำให้มึน',headTaker:'หัวในกระด้งรับหมัดแทน\nชาร์จฉวยหัว ตั้งกระด้งสวน',
 // Nights 2–3 (docs/ghosts/NIGHT23-DESIGN.md): two mechanics each.
 counterThief:'รอสวนริมท่าน้ำ\nแขนยาวขโมยการ์ด',chargeDrain:'อ้าปากชาร์จ\nกินตับดูดเลือด',dazePoison:'ไฟล่อให้มึน\nเผาลามเป็นพิษ',
 evadeCharge:'กระโดดหลบ\nชาร์จกอยกอย',woundCurse:'กรีดให้เปราะ\nขอส่วนบุญเป็นคำสาป',minionPoison:'พรายน้ำรับหมัดแทน\nพิษจากน้ำตา',
 counterCurse:'แค้นรอสวน\nสาปส่งเข้ากอง',chargeDaze:'ไฟสุมชาร์จ\nแสงหลอกให้มึน',minionWall:'เสือสมิง เถาวัลย์\nกำแพงดงทึบ',
 danceWound:'ฟ้อนเร่งหมัด\nเล็บกรีดให้เปราะ',evadeDrain:'ดำน้ำหลบ\nดึงขาดูดเลือด',chargeCounter:'สากอาคมชาร์จ\nปีกกระด้งรอสวน',
 drainDaze:'ชายในฝันทำให้มึน\nจุมพิตดูดเลือด',chargeWound:'หิวกระหายชาร์จฟื้น\nกลืนแผลที่เปราะ',
 bellKeeper:'ระฆังยัดคำสาป เปรตบริวาร\nแตกแล้วเคาะระฆังใหญ่',rootLord:'รากไทรรับหมัดแทน\nขาดแล้วโอบรัดรอสวน',
 caveMother:'พรายน้ำ ไอหมอกพิษ\nเงียบแล้วคลื่นถ้ำ',headlessKing:'ชาร์จเวทปอบ ตาจ้องให้มึน\nคืนชีพแล้วฟันรัว',
 headEater:'หัวลอยคาบการ์ด กลืนหัวชาร์จ\nคลั่งแล้วกินคำสุดท้าย'};
export function encounterClue(o:PageOffer):string{
 if(o.kind==='monster'||o.kind==='boss')return traits[ENEMY_ARCHETYPES[o.enemyId]]??'วิญญาณขวางทาง\nเตรียมพร้อมต่อสู้';
 switch(o.kind){
  case 'shop_card':return 'การ์ด เครื่องราง\nและพลังถาวร';
  case 'blessing':return 'ขอพรติดตัว\nเลือก 1 จาก 3';
  case 'shop_equipment':return 'เลือกซื้อเครื่องราง\nเสริมพลังระหว่างทาง';
  case 'well':return 'ดื่มน้ำจากบ่อ\nฟื้นพลังชีวิต';
  case 'healing_shrine':return 'พักฟื้นที่ศาล\nเรียกกำลังกลับคืน';
  case 'treasure':return 'เปิดหีบสมบัติ\nเลือกการ์ดหนึ่งใบ';
  case 'treasure_single':return 'รับสมบัติหนึ่งชิ้น\nเพิ่มการ์ดในสำรับ';
  case 'shop_upgrade':return 'ปลุกเสกการ์ด\nใบแรกฟรี';
  case 'shop_remove':return 'สละการ์ดที่ไม่ใช้\nใบแรกฟรี';
  case 'story_event':return 'เรื่องราวระหว่างทาง\nเลือกชะตาด้วยตนเอง';
  case 'next_event':return 'เดินทางต่อ\nสู่พื้นที่ถัดไป';
 }
}
