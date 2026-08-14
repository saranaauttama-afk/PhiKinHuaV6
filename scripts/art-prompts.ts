// scripts/art-prompts.ts — สร้าง docs/art-prompts.md จาก catalog
//
// รันด้วย: npm run art:prompts
//
// ต่างจาก `art-checklist.md` ตรงที่ลิสต์นั้นตอบว่า "ยังขาดอะไร" ส่วนไฟล์นี้ตอบว่า
// **"พิมพ์อะไรลงไปถึงจะได้รูปนั้น"** — คำสั่งเป็นภาษาอังกฤษพร้อมวาง ไม่ต้องแปลเอง
// เพราะเครื่องมือสร้างภาพเกือบทั้งหมดเข้าใจอังกฤษดีกว่าไทยมาก
//
// `brief` ใน catalog เป็นภาษาไทยและสั้น (เขียนไว้ให้คนอ่าน) จึงต้องมีตารางแปล
// คำเฉพาะทางผีไทยตรงนี้ — "กระสือ" แปลตรงตัวเป็น "floating head" แล้วจะได้ภาพ
// ผิดวัฒนธรรม ต้องบรรยายให้เห็นภาพจริง

import * as fs from 'node:fs';
import * as path from 'node:path';
import { ART_CATALOG, type ArtSlot } from '../src/art/catalog';

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const OUT = path.join(ROOT, 'docs', 'art-prompts.md');

/**
 * แกนสไตล์ที่ต้องอยู่ในทุกคำสั่ง
 *
 * ถ้าแต่ละรูปมาจากคำสั่งที่สไตล์ไม่ตรงกัน รูปจะไม่เป็นชุดเดียวกันแม้เนื้อหาถูก —
 * ซึ่งแย่กว่าไม่มีรูป เพราะกลายเป็นภาพปะติดปะต่อ
 */
const STYLE = [
  'hand-painted storybook illustration',
  'Thai rural folk-horror',
  'muted desaturated palette of umber, olive and deep ink',
  'single warm light source (moonlight or oil lamp)',
  'soft painterly edges, visible brush texture',
  'no text, no watermark, no signature',
].join(', ');

/** สิ่งที่ต้องกันออกไป — ไม่งั้นจะได้เทพนิยายยุโรปหรือภาพ 3D มันวาว */
const NEGATIVE = [
  'european fairytale', 'gothic castle', 'anime', 'chibi',
  '3d render', 'photorealistic', 'glossy plastic', 'neon colors',
  'text', 'watermark', 'logo', 'signature', 'frame border',
].join(', ');

/** คำเฉพาะทางผีไทยที่แปลตรงตัวแล้วเพี้ยน */
const GLOSSARY: Array<[RegExp, string]> = [
  [/กระสือ/g, 'Krasue — a detached floating female head trailing glowing entrails, hovering low over rice paddies at night'],
  [/กะหัง|กระหัง/g, 'Krahang — a shirtless man flying with two large woven rice baskets as wings'],
  [/นางตานี/g, 'Nang Tani — a pale woman in traditional green Thai silk haunting a wild banana grove'],
  [/พราย/g, 'Phrai — a drowned water spirit rising from a canal'],
  [/ปอบ/g, 'Phi Pop — a gaunt villager possessed by an organ-eating spirit'],
  [/กุมารทอง/g, 'Kuman Thong — a small golden child spirit statue with a topknot'],
  [/ตายโหง/g, 'a violent-death ghost, still wearing what it died in'],
  [/แม่นาก|นาค/g, 'Mae Nak — a young woman in old Thai dress with an unnaturally long reaching arm'],
  [/หมอผี/g, 'a Thai village exorcist in dark cloth with sacred tattoos and a staff'],
  [/แม่ชี/g, 'a Thai Buddhist nun in white robes with a shaved head'],
  [/ร่างทรง/g, 'a Thai spirit medium mid-trance, eyes rolled back'],
  [/ยันต์/g, 'a Thai sacred yantra cloth with geometric Khom script'],
  [/ตะกรุด/g, 'a rolled metal Thai amulet tube on cord'],
  [/ลูกประคำ/g, 'Buddhist prayer beads'],
  [/ธูป/g, 'burning incense sticks'],
  // เรียงคำยาวก่อนคำสั้นเสมอ — ไม่งั้น 'ศาล' จะกิน 'ศาลา' ซึ่งคนละความหมาย
  [/ศาลาริมทาง|ศาลา/g, 'a small open roadside pavilion'],
  [/ศาลพระภูมิ|ศาล(?!า)/g, 'a Thai spirit house on a post'],
  [/ผ้าแพร/g, 'coloured votive silk ribbons'],
  [/ทุ่งนา/g, 'flooded rice paddies'],
  [/ดงกล้วย|ต้นกล้วย/g, 'a wild banana grove'],
  [/กระท่อม/g, 'a stilted Thai wooden hut'],
  [/โบสถ์|วัด/g, 'an abandoned Thai temple hall with a tiered roof'],
  [/บาตร/g, 'a monk\'s black alms bowl'],
  [/เกลือ/g, 'scattered coarse salt'],
  [/ด้ายสายสิญจน์/g, 'white sacred thread'],
  [/เปรต/g, 'Preta — a towering emaciated hungry ghost with a needle-thin neck and swollen belly'],
  [/ตายทั้งกลม/g, 'the ghost of a woman who died in childbirth, still holding a bundle'],
  [/โป่งค่าง/g, 'a large ape-like forest spirit with long matted black hair'],
  [/นางรำ/g, 'the ghost of a Thai classical dancer in full costume and headdress, mid-pose'],
  [/งู/g, 'a spectral serpent coiled in the dark'],
  [/แม่ม่าย/g, 'a widow ghost in dark mourning cloth'],
  [/นางใหญ่/g, 'an enormous towering female spirit seen from below'],
  [/เจ้าพ่อ|เทพารักษ์/g, 'a guardian forest deity seated among roots, draped in votive cloth'],
  [/อสุรกาย/g, 'an Asura — a horned demon in ornate Thai temple-guardian armour'],
  [/มัจจุราช/g, 'Phraya Maccurat, the Thai lord of death — a crowned skeletal figure in dark royal robes'],
  [/พระอุปคุต/g, 'Phra Upakut — a seated monk half-submerged in dark water, holding an alms bowl'],
  [/ปีศาจไฟ/g, 'a spirit made of drifting ember light'],
  [/วิญญาณเด็ก|เด็ก/g, 'the small pale ghost of a child'],
  [/เร่ร่อน/g, 'a drifting faceless wandering spirit in tattered cloth'],
  [/ห่า/g, 'a plague spirit trailing sickly grey mist'],
  [/ผีป่า|ปีศาจป่า/g, 'a wild forest spirit made of bark, moss and antlers'],
  [/โคลนเงา|เงา/g, 'a featureless shadow double of a person'],
  [/หอยทาก/g, 'a translucent glowing ghost snail'],
  [/นักสู้โบราณ/g, 'the armoured ghost of an ancient Thai warrior with a curved sword'],
  [/ผู้พิทักษ์ต้นไม้/g, 'a tree guardian spirit with a bark face emerging from a trunk'],
  [/พิษ/g, 'a spirit exhaling green poison vapour'],
  [/สหาย|เพื่อน/g, 'a small friendly spirit companion hovering at shoulder height'],
  [/คนทรง/g, 'a Thai spirit medium mid-trance, eyes rolled back'],
];

/**
 * คำอังกฤษที่ตรงกับคำเฉพาะทางในโจทย์ไทย
 *
 * **ไม่ลบคำที่แม็ปได้ออกจากโจทย์เดิม** — ตอนแรกเขียนให้ลบแล้วเอาเศษที่เหลือมา
 * แสดงเป็น "ส่วนที่ยังไม่ได้แปล" ผลคือข้อความไทยพัง: "ลานดินหน้าวัด" กลายเป็น
 * "ลานดินหน้า" และ "ศาลาริมทาง" กลายเป็น "าริมทาง" คนอ่านแล้วไม่รู้ว่าเดิมเขียนอะไร
 * ซึ่งแย่กว่าไม่ช่วยแปลเลย
 *
 * ตอนนี้แค่ "เติม" คำอังกฤษเข้าไป แล้วยกโจทย์ไทยเต็มๆ ไปไว้อีกบรรทัด
 */
function englishHint(brief: string): string {
  const hits: string[] = [];
  for (const [re, en] of GLOSSARY) {
    re.lastIndex = 0;
    if (re.test(brief)) hits.push(en);
  }
  return hits.join('; ');
}

/** อัตราส่วนภาพที่เครื่องมือส่วนใหญ่รับ */
function aspect([w, h]: [number, number]): string {
  const g = (a: number, b: number): number => (b ? g(b, a % b) : a);
  const d = g(w, h);
  return `${w / d}:${h / d}`;
}

const GROUP_TITLE: Record<ArtSlot['group'], string> = {
  scene: 'ฉากพื้นหลัง',
  class: 'ตัวละครผู้เล่น',
  monster: 'ผี',
  boss: 'บอส',
  blessing: 'พรติดตัว',
  event: 'ภาพประกอบเหตุการณ์',
  chapter: 'ภาพประกอบบทคั่น',
  node: 'ไอคอนบนเส้นทาง',
  encounter: 'การ์ดจุดแวะ',
  minion: 'ผีที่เรียกมาช่วย',
};

/** ของแถมเฉพาะกลุ่ม — ภาพคนละหน้าที่ต้องการองค์ประกอบคนละแบบ */
const GROUP_EXTRA: Record<ArtSlot['group'], string> = {
  scene:     'full-bleed vertical background, subject small in frame, empty space in the middle third for UI',
  class:     'single character, waist-up, facing viewer, plain dark background, transparent background',
  monster:   'single creature, full body, plain dark background, transparent background',
  boss:      'single imposing creature, full body, dramatic low angle, plain dark background, transparent background',
  blessing:  'a single small object on plain dark ground, centred, icon-like, transparent background',
  event:     'wide establishing shot of a place, no main character in frame',
  chapter:   'wide cinematic establishing shot, no main character in frame',
  node:      'flat symbolic icon, high contrast, centred in a circle, transparent background',
  encounter: 'a single place or object seen from a short distance, square composition',
  minion:    'a small spirit companion, full body, plain dark background, transparent background',
};

/** ช่องนี้ได้คำบรรยายตัวแบบจากตารางแปลไหม — ถ้าไม่ คำสั่งจะมีแต่สไตล์กับองค์ประกอบ */
export function hasSubject(s: ArtSlot): boolean {
  return englishHint(`${s.label} ${s.brief}`).length > 0;
}

function promptFor(s: ArtSlot): string {
  // อ่านทั้งชื่อและโจทย์ — ชื่อผีอยู่ใน `label` ("ผีกระสือ") ส่วน `brief` บรรยาย
  // ท่าทางเฉยๆ ("ผีหัวลอยที่เหาะไปมา") ถ้าดูแค่ brief กลุ่มผีทั้ง 24 ตนจะได้
  // คำสั่งที่ไม่มีคำบรรยายตัวผีเลยสักคำ เหลือแต่ท่อนสไตล์กับองค์ประกอบภาพ
  const hint = englishHint(`${s.label} ${s.brief}`);
  const subject = [hint, GROUP_EXTRA[s.group]].filter(Boolean).join(', ');
  return `${subject}. ${STYLE}. --ar ${aspect(s.size)}`;
}

function main() {
  const groups = Object.keys(GROUP_TITLE) as ArtSlot['group'][];
  const lines: string[] = [];

  const have = ART_CATALOG.filter(s => fs.existsSync(path.join(ASSETS, s.file))).length;

  lines.push('# คำสั่งสร้างรูป');
  lines.push('');
  lines.push(`สร้างจาก \`src/art/catalog.ts\` — อย่าแก้ไฟล์นี้ตรงๆ แก้ที่ catalog แล้วรัน \`npm run art:prompts\``);
  lines.push('');
  lines.push(`ตอนนี้มีรูปแล้ว **${have}/${ART_CATALOG.length}** ช่อง`);
  lines.push('');
  // ช่องที่ตารางแปลไม่รู้จัก — คำสั่งจะมีแต่ท่อนสไตล์ ได้ภาพมั่วแน่นอน
  // **ต้องบอกให้เห็นชัด** ไม่ใช่ปล่อยให้ไปเจอเอาตอนสร้างครบ 94 รูปแล้ว
  const noSubject = ART_CATALOG.filter(s => !hasSubject(s));
  if (noSubject.length > 0) {
    lines.push('## ⚠️ ต้องเขียนคำบรรยายเอง');
    lines.push('');
    lines.push('ตารางแปลไม่รู้จักคำในชื่อ/โจทย์ของช่องพวกนี้ คำสั่งข้างล่างจึงมีแต่ท่อนสไตล์');
    lines.push('กับองค์ประกอบภาพ ไม่มีคำบรรยายว่าเป็นตัวอะไร — เติมเองก่อนใช้');
    lines.push('');
    lines.push('แก้ถาวรได้โดยเพิ่มคำลงใน `GLOSSARY` ที่ `scripts/art-prompts.ts`');
    lines.push('');
    for (const s of noSubject) lines.push(`- **${s.label}** \`${s.id}\``);
    lines.push('');
  }

  lines.push('## วิธีใช้');
  lines.push('');
  lines.push('1. ก๊อปคำสั่งของช่องที่ต้องการไปวางในเครื่องมือสร้างภาพ');
  lines.push('2. ได้รูปมาแล้ว บันทึกตามชื่อไฟล์ที่ระบุ ลงในโฟลเดอร์ `assets/`');
  lines.push('3. เพิ่มหนึ่งบรรทัดใน `ART_SOURCES` ที่ `app/components/Art.tsx`');
  lines.push('4. `npx vitest run test/art.test.ts` จะบอกเองถ้าลืมต่อสายหรือวางผิดที่');
  lines.push('');
  lines.push('## คำสั่งกันภาพหลุดแนว (negative prompt)');
  lines.push('');
  lines.push('ใส่ชุดนี้กับทุกภาพ:');
  lines.push('');
  lines.push('```');
  lines.push(NEGATIVE);
  lines.push('```');
  lines.push('');
  lines.push('## แกนสไตล์');
  lines.push('');
  lines.push('ทุกคำสั่งข้างล่างมีท่อนนี้ต่อท้ายอยู่แล้ว — ถ้าสร้างภาพเพิ่มเองนอกลิสต์ ให้ใส่ด้วย');
  lines.push('');
  lines.push('```');
  lines.push(STYLE);
  lines.push('```');
  lines.push('');

  for (const g of groups) {
    const slots = ART_CATALOG.filter(s => s.group === g);
    if (slots.length === 0) continue;

    lines.push(`## ${GROUP_TITLE[g]} (${slots.length})`);
    lines.push('');

    for (const s of slots) {
      const done = fs.existsSync(path.join(ASSETS, s.file));
      lines.push(`### ${done ? '✅' : '⬜'} ${s.label}`);
      lines.push('');
      lines.push(`\`assets/${s.file}\` · ${s.size[0]}×${s.size[1]}px`);
      lines.push('');
      lines.push('```');
      lines.push(promptFor(s));
      lines.push('```');
      lines.push('');
      lines.push(`> โจทย์เดิม: ${s.brief}`);
      lines.push('');
    }
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
  console.log(`เขียน ${path.relative(ROOT, OUT)} แล้ว — ${ART_CATALOG.length} คำสั่ง (มีรูปแล้ว ${have})`);
}

main();
