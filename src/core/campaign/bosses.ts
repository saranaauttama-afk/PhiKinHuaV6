import type {ThaiGhostData} from '../monsters/thai-ghosts';
/** Fixed identities across seeds; a night must never repeat another night's final boss. */
export const NIGHT_BOSSES:ThaiGhostData[]=[
 {id:'night-head-collector',name:'คนแบกหัว',hp:125,tier:'BossFinal',description:'สะกดให้โจมตีอ่อนลง แล้วฉวยศีรษะในความมืด'},
 {id:'night-bell-keeper',name:'เงาระฆังร้าง',hp:145,tier:'BossFinal',description:'เสียงระฆังยัดคำสาปเข้ามือและรบกวนสำรับ'},
 {id:'night-root-lord',name:'เจ้าดงรากผี',hp:165,tier:'BossFinal',description:'เรียกวิญญาณป่ามาช่วยและสะสมแรงโจมตี'},
 {id:'night-cave-mother',name:'นางเฝ้าถ้ำ',hp:185,tier:'BossFinal',description:'ฟื้นพลังด้วยเสียงสะท้อน ต้องเร่งทำลายวงจรฟื้นชีวิต'},
 {id:'night-headless-king',name:'เจ้าไร้เศียร',hp:205,tier:'BossFinal',description:'ฟันหลายจังหวะ เมื่ออ่อนแรงจะตื่นด้วยพลังอาถรรพ์'},
];
export const ULTIMATE_BOSS:ThaiGhostData={id:'phi-kin-hua',name:'ผีกินหัว',hp:245,tier:'SecretBoss',description:'ผู้กลืนชื่อและศีรษะ ต้นตอคำสาปทั้งห้าคืน'};
export function nightFinalBoss(night:number){return NIGHT_BOSSES[Math.max(0,Math.min(4,night-1))];}
export function nightFightTotal(night?:number){return night===5?16:15;}
