import type {ClassId} from '../classes';
import type {BlessingDef,GameState} from '../types';
export type BuildKit={id:string;name:string;classId:ClassId;cardId:string;blessing:BlessingDef;risk:number;plan:string};
const kit=(classId:ClassId,id:string,name:string,cardId:string,desc:string,risk:number,plan:string):BuildKit=>({classId,id,name,cardId,risk,plan,blessing:{id:`build_${id}`,name,rarity:'Rare',desc}});
/** Existing illustrated cards become engines through broad, bounded triggers. */
export const BUILD_KITS:BuildKit[]=[
 kit('warrior','guard','ครูยันต์สวน','ward_riposte','การ์ดเพิ่มเกราะใบแรกแต่ละตา คืนพลังงาน 1',0,'ตั้งเกราะก่อนแล้วใช้วิชาสวน เลือกเครื่องรางเพิ่มเกราะ'),
 kit('warrior','fury','ครูเข่ามวย','threefold_strike','การ์ดโจมตีหลายครั้งใบแรกแต่ละตา ได้แข็งแกร่ง 1 หลังโจมตี',4,'สะสมแรงให้ทุกหมัดหนักขึ้น แลกชีวิตตอนรับวิชา'),
 kit('shaman','hex','ครูสายอาถรรพ์','cursed_needle','การ์ดใส่สถานะลบให้ผีใบแรกแต่ละตา โจมตีเพิ่ม 3',0,'ใส่สาปหรือพิษ แล้วซ้ำแผลด้วยการ์ดที่รับโบนัสจากสถานะ'),
 kit('shaman','kuman','ครูเลี้ยงกุมาร','create_kuman','การ์ดเรียกบริวารใบแรกแต่ละตา ยืดอายุบริวารเรา 1 ตา สูงสุด 4',4,'รักษาบริวารให้อยู่ช่วยโจมตี ใช้เครื่องรางที่ช่วยร่ายวิชา'),
 kit('nun','merit','อานิสงส์คืนวิชา','alms_offering','การ์ดรักษาใบแรกแต่ละตา จั่วเพิ่ม 1 ใบ แม้ชีวิตเต็ม',0,'ใช้ไพ่รักษาเป็นตัวหมุนสำรับ แล้วโจมตีด้วยใบที่จั่วมา'),
 kit('nun','wheel','ครูธรรมจักร','dharma_wheel','การ์ดเพิ่มเกราะใบแรกแต่ละตา ได้ป้องกันเพิ่ม 3',0,'สะสมเกราะให้ถึงเงื่อนไขธรรมจักร ใช้ลูกประคำหรือผ้าขาว'),
 kit('medium','spirits','ครูเชิญคู่กาย','invite_spirit','การ์ดเรียกบริวารใบแรกแต่ละตา คืนพลังงาน 1',4,'เรียกวิญญาณแล้วเหลือพลังตั้งรับ ใช้ศาลพระภูมิย่อร่วมกับวิชา'),
 kit('medium','echo','ครูซ้ำรอยพิษ','poison_echo','การ์ดใส่สถานะลบให้ผีใบแรกแต่ละตา ใส่อ่อนแอ 1 ชั้น นาน 2 ตา',0,'วางพิษและลดแรงผี แล้วใช้การ์ดโจมตีที่แรงขึ้นเมื่อผีติดพิษ'),
];
export function buildsForClass(id?:ClassId){return BUILD_KITS.filter(b=>b.classId===(id??'shaman'));}
export function grantBuildKit(s:GameState,id:string):void{
 const k=BUILD_KITS.find(k=>k.id===id&&k.classId===s.classId);if(!k||s.blessings?.some(b=>b.id===k.blessing.id))return;
 const card=require('../pack').cardById(k.cardId);if(!card)return;
 s.masterDeck.push(JSON.parse(JSON.stringify(card)));require('../engine/shared').grantBlessing(s,k.blessing);
 s.log.push(`ได้สายวิชา ${k.name} · ${k.plan}`);
}
