import type {ComboEffect,ComboFeedback} from '../src/core/combat/combos';
import {COMBO_BY_ID,comboTarget} from '../src/core/combat/combos';
import {STATUS_EFFECTS_REGISTRY} from '../src/core/combat/status-effects/registry';
import {THAI_MINIONS} from '../src/core/combat/minions/thai-minions';
export function comboPayoff(e:ComboEffect):string {
 const target=e.target==='enemy'?'ผี':'ผู้เล่น';
 switch(e.type){
  case 'damage':return `โจมตีผี ${e.value} (คิดเกราะและสถานะตามปกติ)`;
  case 'heal':return `ฟื้นชีวิต ${e.value} ไม่เกินชีวิตสูงสุด`;
  case 'block':return `ป้องกัน +${e.value}`;
  case 'energy':return `พลังงาน +${e.value}`;
  case 'draw':return `จั่ว ${e.value} ใบ (ตามการ์ดที่มี)`;
  case 'status':return `${target}: ${STATUS_EFFECTS_REGISTRY[e.statusId as keyof typeof STATUS_EFFECTS_REGISTRY]?.name??e.statusId} ${e.value} ชั้น · ${(e.duration??STATUS_EFFECTS_REGISTRY[e.statusId as keyof typeof STATUS_EFFECTS_REGISTRY]?.defaultDuration??2)>=99?'ตลอดไฟต์':`${e.duration??STATUS_EFFECTS_REGISTRY[e.statusId as keyof typeof STATUS_EFFECTS_REGISTRY]?.defaultDuration??2} เทิร์น`}`;
  case 'summon':return `เรียก ${THAI_MINIONS[e.minionId??'']?.name??'วิญญาณ'} ${e.value} ตน`;
  case 'freeCards':return `การ์ดถัดไป ${e.value} ใบ ร่ายฟรี`;
  case 'debuffImmunity':return 'กันสถานะลบตลอดไฟต์';
  case 'cleanse':return `ล้างสถานะลบทั้งหมดของ${target}`;
 }
}
export function comboFeedbackText(f:ComboFeedback):string {
 const c=COMBO_BY_ID[f.comboId];if(!c)return '';
 if(f.kind==='success')return `${c.name} สำเร็จ · ${c.effects.map(comboPayoff).join(' · ')}`;
 if(f.kind==='reset')return `${c.name} เริ่มใหม่ · ${f.reason==='expired'?'เกินจำนวนเทิร์น':f.reason==='restart'?'เล่นใบเริ่มต้นซ้ำ':'เล่นผิดลำดับ'}`;
 return `${c.name} ${f.played.length}/${comboTarget(c)} · ${c.ordered?'เล่นใบถัดไปตามลำดับ':'เล่นให้ครบชุด'}`;
}
