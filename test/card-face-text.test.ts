// test/card-face-text.test.ts — short card-face text (owner playtest 16 Oct 2026: faces too long).
import { describe, it, expect } from 'vitest';
import { cardFaceText, describeCard } from '../src/core/cards/describe';
import { cardById } from '../src/core/pack';
import raw from '../src/data/packs/base/class_cards.json';

const all = ((Array.isArray(raw) ? raw : (raw as any).cards) as any[]).map(c => ({ ...cardById(c.id)!, star: 1 }));

describe('ข้อความหน้าการ์ดแบบสั้น', () => {
  it('ทุกใบมีข้อความ และไม่ยาวกว่าข้อความเต็ม', () => {
    for (const c of all) {
      const face = cardFaceText(c);
      expect(face.length, c.id).toBeGreaterThan(0);
      expect(face.length, c.id).toBeLessThanOrEqual(describeCard(c).length);
    }
  });
  it('สั้นลงอย่างน้อยหนึ่งในสามโดยเฉลี่ย', () => {
    const f = all.reduce((n, c) => n + cardFaceText(c).length, 0), d = all.reduce((n, c) => n + describeCard(c).length, 0);
    expect(f / d).toBeLessThan(2 / 3);
  });
  it('ตัวอย่างคำย่อ', () => {
    const face = (id: string) => cardFaceText({ ...cardById(id)!, star: 1 });
    expect(face('jab')).toBe('ตี 5 · ช้ำ 1');
    expect(face('bruise_guard')).toBe('เกราะ 7 · สวน ตี 5 · ช้ำ ≥3: +เกราะ 5');
    expect(face('corner_towel')).toBe('เกราะ 4 · ศิษย์ค่ายฟื้น 4 · ท้ายยก: +เกราะ 4');
    expect(face('holy_water_splash')).toBe('สาดทั้งขัน: ตี 5/น้ำ');
  });
  it('ไม่มี flavor บนหน้าการ์ด', () => {
    for (const c of all.filter(c => c.flavor)) expect(cardFaceText(c)).not.toContain(c.flavor);
  });
});
