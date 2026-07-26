import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ART_CATALOG, ART_BY_ID, artSlot } from '../src/art/catalog';
import { THAI_GHOST_POOLS } from '../src/core/monsters/thai-ghosts';
import { ALL_CLASS_IDS } from '../src/core/classes';

/**
 * ทะเบียนอาร์ต — ช่องรูปทั้งหมดที่เกมต้องการ อยู่ที่ `src/art/catalog.ts`
 * ส่วนการผูกไฟล์จริงอยู่ที่ `ART_SOURCES` ใน `app/components/Art.tsx`
 *
 * ที่ต้องแยกสองที่เพราะ React Native บังคับให้ `require()` เป็น path คงที่ตอน build
 * สแกนโฟลเดอร์แล้วโหลดตามชื่อไม่ได้ → ความเสี่ยงคือ "วางไฟล์แล้วลืมต่อสาย"
 * แล้วเกมยังโชว์ placeholder อยู่ทั้งที่รูปมาแล้ว เทสต์ชุดนี้กันเรื่องนั้น
 */

const ROOT = path.resolve(__dirname, '..');
const ART_TSX = path.join(ROOT, 'app', 'components', 'Art.tsx');

/** slot ที่ถูกผูกกับไฟล์รูปแล้วใน Art.tsx (อ่านจาก source เพราะ vitest โหลด .png ไม่ได้) */
function wiredSlots(): Set<string> {
  const src = fs.readFileSync(ART_TSX, 'utf8');
  const body = src.slice(src.indexOf('ART_SOURCES'), src.indexOf('export function hasArt'));
  return new Set([...body.matchAll(/'([a-z_]+\/[a-zA-Z0-9_-]+)'\s*:/g)].map(m => m[1]));
}

/** path ของรูปที่ Art.tsx require ไว้ (นับจาก assets/) */
function wiredFiles(): string[] {
  const src = fs.readFileSync(ART_TSX, 'utf8');
  const body = src.slice(src.indexOf('ART_SOURCES'), src.indexOf('export function hasArt'));
  return [...body.matchAll(/require\('\.\.\/\.\.\/assets\/([^']+)'\)/g)].map(m => m[1]);
}

describe('catalog ครบและไม่ขัดกันเอง', () => {
  it('ทุก slot มี id ไม่ซ้ำ', () => {
    const ids = ART_CATALOG.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ทุก slot มี path ไฟล์ไม่ซ้ำ', () => {
    const files = ART_CATALOG.map(s => s.file);
    expect(new Set(files).size).toBe(files.length);
  });

  it('ทุก slot มีชื่อ โจทย์ภาพ และขนาดที่ใช้ได้จริง', () => {
    for (const s of ART_CATALOG) {
      expect(s.label.trim(), s.id).not.toBe('');
      expect(s.brief.trim().length, s.id).toBeGreaterThan(10);
      expect(s.size[0], s.id).toBeGreaterThan(0);
      expect(s.size[1], s.id).toBeGreaterThan(0);
    }
  });

  it('ผีทุกตนมีช่องรูปของตัวเอง', () => {
    const ghosts = Object.values(THAI_GHOST_POOLS).flat();
    for (const g of ghosts) {
      expect(artSlot(`monster/${g.id}`), `ผี ${g.name} ไม่มีช่องรูป`).toBeDefined();
    }
    expect(ghosts.length).toBeGreaterThan(20);
  });

  it('คลาสทุกคลาสมีช่องรูปของตัวเอง', () => {
    for (const id of ALL_CLASS_IDS) {
      expect(artSlot(`class/${id}`), `คลาส ${id} ไม่มีช่องรูป`).toBeDefined();
    }
  });

  it('ทุก slot ที่ describeOffer ใช้ มีอยู่ใน catalog', () => {
    // ชนิด encounter ที่โผล่บนแผนที่ได้จริง (ไม่รวม monster/boss ที่ใช้ slot ของผี)
    const kinds = [
      'shop_card', 'shop_equipment', 'shop_remove', 'shop_upgrade',
      'well', 'healing_shrine', 'treasure', 'treasure_single',
    ];
    for (const k of kinds) {
      expect(artSlot(`encounter/${k}`), `encounter/${k}`).toBeDefined();
    }
  });
});

describe('การผูกไฟล์รูปใน Art.tsx', () => {
  it('ทุก slot ที่ผูกไว้ มีอยู่จริงใน catalog', () => {
    for (const id of wiredSlots()) {
      expect(ART_BY_ID[id], `Art.tsx ผูก '${id}' ไว้ แต่ catalog ไม่มี slot นี้`).toBeDefined();
    }
  });

  it('ทุกไฟล์ที่ require ไว้ มีอยู่จริงบนดิสก์', () => {
    for (const f of wiredFiles()) {
      expect(
        fs.existsSync(path.join(ROOT, 'assets', f)),
        `Art.tsx require 'assets/${f}' แต่หาไฟล์ไม่เจอ — Metro จะ build ไม่ผ่าน`
      ).toBe(true);
    }
  });

  it('รูปที่วางไว้ตาม path ใน catalog แล้ว ต้องถูกต่อสายใน Art.tsx ด้วย', () => {
    const wired = wiredSlots();
    const forgotten = ART_CATALOG
      .filter(s => fs.existsSync(path.join(ROOT, 'assets', s.file)) && !wired.has(s.id))
      .map(s => `${s.id} (assets/${s.file})`);

    expect(
      forgotten,
      'วางไฟล์รูปแล้วแต่ลืมเพิ่มบรรทัดใน ART_SOURCES — เกมจะยังโชว์ placeholder อยู่'
    ).toEqual([]);
  });
});
