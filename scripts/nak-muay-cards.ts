// scripts/nak-muay-cards.ts — print the นักมวยคาดเชือก card table (Markdown) from the live data,
// so docs/nak-muay/DESIGN.md never drifts from class_cards.json.
//   npx vite-node --config vitest.config.ts scripts/nak-muay-cards.ts > /tmp/cards.md
import {ALL_CARDS} from '../src/core/pack';
import {describeCard,costLabel} from '../src/core/cards/describe';
const log=console.log;console.log=()=>{};
const own=ALL_CARDS.filter(c=>c.class==='warrior'&&!c.retired);
const TYPE:Record<string,string>={attack:'การ์ดโจมตี (ไม่ใช้แต้ม)',action:'การ์ดแอ็กชัน (ใช้แต้ม)',counter:'การ์ดตั้งรับ',equipment:'ของขลัง (อุปกรณ์)'};
const starter=require('../src/data/packs/base/class_cards.json').reduce((m:any,c:any)=>{if(c.starter)m[c.id]=c.starter;return m;},{});
const order=['Common','Uncommon','Rare','Legendary'];
for(const t of ['attack','action','counter','equipment']){
 const list=own.filter(c=>c.type===t&&!(t==='action'&&c.fx.summon)).sort((a,b)=>order.indexOf(a.rarity??'Common')-order.indexOf(b.rarity??'Common'));
 log(`\n### ${TYPE[t]} — ${list.length} ใบ\n\n| ชื่อ | id | ความหายาก | ราคา | ผล |\n|---|---|---|---|---|`);
 for(const c of list)log(`| ${c.name}${starter[c.id]?` ×${starter[c.id]} (เริ่มต้น)`:''}${c.locked?' (ปลดล็อกจากสมุดบันทึก)':''} | \`${c.id}\` | ${c.rarity} | ${costLabel(c)} | ${describeCard(c).replace(/\|/g,'/')} |`);
}
const camp=own.filter(c=>c.fx.summon);
log(`\n### ศิษย์ค่าย (การ์ดแอ็กชันเรียกมินเนียน) — ${camp.length} ใบ\n\n| ชื่อ | id | ความหายาก | ราคา | ผล |\n|---|---|---|---|---|`);
for(const c of camp)log(`| ${c.name} | \`${c.id}\` | ${c.rarity} | ${costLabel(c)} | ${describeCard(c).replace(/\|/g,'/')} |`);
