import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * ตาข่ายกันสีหลุดพาเลตต์
 *
 * พาเลตต์ของเกมดึงมาจากงานอาร์ตจริง (ดินเผา-เขียวมะกอก + ทองแสงจันทร์ + แดงเลือดหมู)
 * ก่อนรีดีไซน์ UI ใช้สีจากพาเลตต์เว็บอยู่ 40 กว่าสี — ฟ้า #93c5fd ม่วง #c4b5fd
 * เขียว #4ade80 — ซึ่งไม่มีอยู่ในภาพเลยสักสี ทำให้หน้าจอดูเป็นแดชบอร์ดเว็บ
 * ที่แปะอยู่บนโปสเตอร์หนังผี
 *
 * เทสต์นี้ไม่ได้ตัดสินว่าอะไรสวย แต่กันไม่ให้สีนอกระบบไหลกลับเข้ามาทีละจุด
 * โดยที่ไม่มีใครเห็น — สำคัญเป็นพิเศษเพราะรีวิวงานนี้ด้วยตาไม่ได้ทุกครั้ง
 */

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'app');

/** ไฟล์ที่ยังไม่ได้ย้ายเข้าระบบ — ลดลิสต์นี้ลงเรื่อยๆ อย่าเพิ่มเข้าไป */
const NOT_YET_MIGRATED = new Set<string>([
  'components/Card.tsx',
  'components/Temp.tsx',
  'components/DeckView.tsx',
  'components/EventView.tsx',
  'components/StartPage.tsx',
  'components/battle/DiscardOverlay.tsx',
  'components/battle/VictoryOverlay.tsx',
  'components/battle/DefeatOverlay.tsx',
  'components/battle/LevelUpOverlay.tsx',
  'components/battle/PlayerHand.tsx',
  'components/battle/PlayerHUD.tsx',
  'components/battle/EnemyHandCard.tsx',
  'components/battle/EnemyCardPlay.tsx',
  'components/battle/EnemyIntentBadge.tsx',
  'components/battle/DamagePopup.tsx',
  'components/battle/StatGainPopup.tsx',
  'components/battle/ScreenFlash.tsx',
  'components/battle/MonsterArea.tsx',
  'battle.tsx',
]);

/** สีที่อนุญาตให้เขียนตรงๆ ได้ — โปร่งใส ขาวดำล้วนที่ใช้เป็นม่าน/เงา */
const ALLOWED_LITERALS = /^(transparent|#fff|#ffffff|#000|#000000)$/i;

function tsxFiles(dir: string, base = ''): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...tsxFiles(path.join(dir, e.name), rel));
    else if (e.name.endsWith('.tsx')) out.push(rel);
  }
  return out;
}

/** สีที่เขียนเป็นค่าตรงๆ ในไฟล์ (hex หรือ rgba) */
function literalColors(src: string): string[] {
  const hex = [...src.matchAll(/'(#[0-9a-fA-F]{3,8})'/g)].map(m => m[1]);
  const rgba = [...src.matchAll(/'(rgba?\([^)]*\))'/g)].map(m => m[1]);
  return [...hex, ...rgba].filter(c => !ALLOWED_LITERALS.test(c));
}

describe('ระบบสี', () => {
  const files = tsxFiles(APP);

  it('มีไฟล์ให้ตรวจจริง', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it('หน้าจอที่ย้ายเข้าระบบแล้ว ไม่มีสีนอกพาเลตต์', () => {
    const offenders: string[] = [];

    for (const f of files) {
      if (NOT_YET_MIGRATED.has(f)) continue;
      const src = fs.readFileSync(path.join(APP, f), 'utf8');
      const colors = literalColors(src);
      if (colors.length > 0) {
        offenders.push(`${f}: ${[...new Set(colors)].join(', ')}`);
      }
    }

    expect(offenders, 'ใช้ token จาก app/theme.ts แทนการเขียนสีตรงๆ').toEqual([]);
  });

  it('ไม่มีไฟล์ในลิสต์ยกเว้นที่หายไปแล้ว — ลิสต์ต้องไม่ค้างชื่อไฟล์ที่ถูกลบ', () => {
    const stale = [...NOT_YET_MIGRATED].filter(f => !fs.existsSync(path.join(APP, f)));
    expect(stale, 'ลบชื่อออกจาก NOT_YET_MIGRATED ด้วย').toEqual([]);
  });

  it('ไม่มีใครใช้ ChakraPetch อีกแล้ว — ตัวอักษรแนวเทคโนขัดกับงานอาร์ต', () => {
    const users = files.filter(f =>
      fs.readFileSync(path.join(APP, f), 'utf8').includes('ChakraPetch')
    );
    expect(users).toEqual([]);
  });
});

describe('การโหลดตัวอักษร', () => {
  it('ทุกหน้าที่เป็นจุดเข้าโหลดฟอนต์เอง', () => {
    // เดิม battle.tsx ใช้ฟอนต์แต่ไม่เคยโหลด — รอดเพราะปกติเข้าหน้าแผนที่ก่อน
    for (const entry of ['index.tsx', 'battle.tsx']) {
      const src = fs.readFileSync(path.join(APP, entry), 'utf8');
      expect(src, `${entry} ต้องเรียก useAppFonts`).toContain('useAppFonts');
    }
  });

  it('ตัวอักษรที่ใช้ต้องเป็นตัวที่โหลดไว้จริง', () => {
    const loader = fs.readFileSync(path.join(APP, 'useAppFonts.ts'), 'utf8');
    const used = new Set<string>();

    for (const f of tsxFiles(APP)) {
      const src = fs.readFileSync(path.join(APP, f), 'utf8');
      for (const m of src.matchAll(/fontFamily:\s*'([^']+)'/g)) used.add(m[1]);
    }

    for (const family of used) {
      expect(loader, `ฟอนต์ ${family} ถูกใช้แต่ไม่ได้โหลด`).toContain(family);
    }
    expect(used.size).toBeGreaterThan(2);
  });
});
