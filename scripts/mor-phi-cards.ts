// scripts/mor-phi-cards.ts — print the หมอผี card table (Markdown) from the live data,
// so docs/mor-phi/DESIGN.md never drifts from class_cards.json.
//   npx vite-node --config vitest.config.ts scripts/mor-phi-cards.ts > /tmp/cards.md
import {ALL_CARDS} from '../src/core/pack';
import {describeCard,costLabel} from '../src/core/cards/describe';
const log=console.log;console.log=()=>{};
const own=ALL_CARDS.filter(c=>c.class==='shaman');
const TYPE:Record<string,string>={attack:'การ์ดโจมตี (ฟรี)',mana:'เสกน้ำมนต์ (ฟรี)',spell:'คาถา (ใช้น้ำมนต์)',action:'วิชา (ใช้แต้ม)',prayer:'บทสวด',counter:'การ์ดตั้งรับ',equipment:'ของขลัง (อุปกรณ์)'};
const starter=require('../src/data/packs/base/class_cards.json').reduce((m:any,c:any)=>{if(c.starter)m[c.id]=c.starter;return m;},{});
const order=['Common','Uncommon','Rare','Legendary'];
for(const t of ['attack','mana','spell','action','prayer','counter','equipment']){
 const list=own.filter(c=>c.type===t&&!c.fx.summon).sort((a,b)=>order.indexOf(a.rarity??'Common')-order.indexOf(b.rarity??'Common'));
 log(`\n### ${TYPE[t]} — ${list.length} ใบ\n\n| ชื่อ | id | ความหายาก | ราคา | ผล |\n|---|---|---|---|---|`);
 for(const c of list)log(`| ${c.name}${starter[c.id]?` ×${starter[c.id]} (เริ่มต้น)`:''}${c.locked?' (ปลดล็อกจากสมุดบันทึก)':''} | \`${c.id}\` | ${c.rarity} | ${costLabel(c)} | ${describeCard(c).replace(/\|/g,'/')} |`);
}
const camp=own.filter(c=>c.fx.summon);
log(`\n### ของเลี้ยง (การ์ดเรียกมินเนียน) — ${camp.length} ใบ\n\n| ชื่อ | id | ความหายาก | ราคา | ผล |\n|---|---|---|---|---|`);
for(const c of camp)log(`| ${c.name} | \`${c.id}\` | ${c.rarity} | ${costLabel(c)} | ${describeCard(c).replace(/\|/g,'/')} |`);
