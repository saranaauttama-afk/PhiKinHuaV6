// scripts/art-checklist.ts — สร้าง docs/art-checklist.md จาก catalog + ไฟล์จริงบนดิสก์
//
// รันด้วย: npm run art:checklist
//
// ลิสต์นี้มีไว้ให้เปิดดูจากมือถือได้ว่า "ต้องไปหารูปอะไรบ้าง ตั้งชื่อไฟล์ว่าอะไร
// ขนาดเท่าไหร่ ภาพควรเป็นอะไร" โดยไม่ต้องเปิดโค้ด

import * as fs from 'node:fs';
import * as path from 'node:path';
import { ART_CATALOG, STYLE_BRIEF, type ArtSlot } from '../src/art/catalog';

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const OUT = path.join(ROOT, 'docs', 'art-checklist.md');

/** ไฟล์ที่ Art.tsx ผูกไว้แล้ว — อ่านจาก source ตรงๆ เพราะ .png import ที่นี่ไม่ได้ */
function wiredSlots(): Set<string> {
  const src = fs.readFileSync(path.join(ROOT, 'app', 'components', 'Art.tsx'), 'utf8');
  const body = src.slice(src.indexOf('ART_SOURCES'), src.indexOf('export function hasArt'));
  return new Set([...body.matchAll(/'([a-z_]+\/[a-zA-Z0-9_-]+)'\s*:/g)].map(m => m[1]));
}

const GROUP_TITLE: Record<ArtSlot['group'], string> = {
  scene: 'ฉากพื้นหลัง',
  class: 'ตัวละครผู้เล่น',
  monster: 'ผี',
  boss: 'บอส',
  blessing: 'พรติดตัว',
  encounter: 'ภาพบนการ์ดโหนด',
  node: 'ไอคอนบนแถบเส้นทาง',
};

function main() {
  const wired = wiredSlots();
  const rows = ART_CATALOG.map(s => ({
    ...s,
    onDisk: fs.existsSync(path.join(ASSETS, s.file)),
    wired: wired.has(s.id),
  }));

  const done = rows.filter(r => r.onDisk && r.wired).length;

  const lines: string[] = [
    '<!-- ไฟล์นี้ generate ด้วย `npm run art:checklist` อย่าแก้มือ -->',
    '',
    '# รูปที่เกมต้องใช้',
    '',
    `มีแล้ว **${done}** จากทั้งหมด **${rows.length}** ช่อง`,
    '',
    `**โจทย์ภาพร่วม:** ${STYLE_BRIEF}`,
    '',
    'ช่องไหนยังไม่มีรูป เกมจะวาดกรอบ placeholder ที่เขียนชื่อและโจทย์ไว้ให้แทน',
    'ประกอบ UI ต่อได้เลยโดยไม่ต้องรอรูปครบ',
    '',
    '## วิธีเพิ่มรูป',
    '',
    '1. วางไฟล์ตาม path ในคอลัมน์ **ไฟล์** (นับจากโฟลเดอร์ `assets/`)',
    '2. เพิ่มหนึ่งบรรทัดใน `ART_SOURCES` ที่ `app/components/Art.tsx`:',
    '   ```ts',
    "   'monster/phi-pop': require('../../assets/monsters/phi-pop.png'),",
    '   ```',
    '3. `npm run art:checklist` เพื่ออัปเดตลิสต์นี้',
    '',
    'ขั้นที่ 2 ต้องทำมือเพราะ React Native บังคับว่า `require()` ต้องเป็น path คงที่ตอน build',
    'สแกนโฟลเดอร์อัตโนมัติไม่ได้ — มีเทสต์ `art.test.ts` คอยเตือนถ้าวางไฟล์แล้วลืมต่อสาย',
    '',
  ];

  const groups = ['scene', 'class', 'monster', 'boss', 'blessing', 'encounter', 'node'] as const;

  for (const g of groups) {
    const list = rows.filter(r => r.group === g);
    if (list.length === 0) continue;

    const have = list.filter(r => r.onDisk && r.wired).length;
    lines.push(`## ${GROUP_TITLE[g]} (${have}/${list.length})`, '');
    lines.push('| | ชื่อ | ไฟล์ | ขนาด | ภาพควรเป็นอะไร |');
    lines.push('|---|---|---|---|---|');

    for (const r of list) {
      const mark = r.onDisk && r.wired ? '✅'
        : r.onDisk ? '⚠️'   // มีไฟล์แต่ยังไม่ได้ต่อสายใน Art.tsx
        : '⬜';
      lines.push(
        `| ${mark} | ${r.label} | \`${r.file}\` | ${r.size[0]}×${r.size[1]} | ${r.brief} |`
      );
    }
    lines.push('');
  }

  lines.push('---', '', '✅ พร้อมใช้ · ⚠️ มีไฟล์แล้วแต่ยังไม่ได้ต่อสายใน `Art.tsx` · ⬜ ยังไม่มีรูป', '');

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
  console.log(`เขียน ${path.relative(ROOT, OUT)} แล้ว — มีรูป ${done}/${rows.length} ช่อง`);
}

main();
