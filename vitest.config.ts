import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * src/core ถูกเขียนแบบผสม: ESM import ข้างบน + require() กลางฟังก์ชัน
 * (require() ถูกใช้เพื่อตัด circular dependency เช่น commands.ts ↔ engine/handlers/enemy.ts)
 *
 * Vite แปลงไฟล์เป็น ESM ทำให้ require() กลายเป็น undefined ตอนรัน
 * plugin นี้แปลง require('x') เป็น static namespace import ตอน transform เท่านั้น
 * ไม่แตะไฟล์ต้นฉบับ — โค้ดที่รันบน Metro/Hermes ยังเป็นของเดิมทุกอย่าง
 *
 * cycle ยังปลอดภัยเพราะ require() ทุกจุดอยู่ใน function body (เรียกตอน runtime
 * หลังโมดูลโหลดครบแล้ว) ไม่ใช่ top-level ดังนั้น live binding ของ ESM รับมือได้
 */
function requireToImport() {
  const RE = /require\((['"])([^'"]+)\1\)/g;

  return {
    name: 'phikinhua:require-to-import',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (!id.includes('/src/')) return null;
      if (!/\.tsx?$/.test(id)) return null;
      if (!code.includes('require(')) return null;

      const specToIdent = new Map<string, string>();
      let n = 0;

      const out = code.replace(RE, (_m, _q, spec: string) => {
        let ident = specToIdent.get(spec);
        if (!ident) {
          ident = `__cjs_${n++}`;
          specToIdent.set(spec, ident);
        }
        return ident;
      });

      if (specToIdent.size === 0) return null;

      const imports = [...specToIdent.entries()]
        .map(([spec, ident]) =>
          // JSON: โค้ดคาดหวัง object ตรงๆ → ต้องใช้ default import
          spec.endsWith('.json')
            ? `import ${ident} from '${spec}';`
            : `import * as ${ident} from '${spec}';`
        )
        .join('\n');

      return { code: `${imports}\n${out}`, map: null };
    },
  };
}

export default defineConfig({
  plugins: [requireToImport()],
  resolve: {
    alias: {
      // storage.ts เป็นตัวเดียวใน src/core ที่พึ่ง React Native
      '@react-native-async-storage/async-storage': path.resolve(
        __dirname,
        'test/stubs/async-storage.ts'
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // เกมใช้ seeded RNG — เทสต์ต้อง deterministic
    sequence: { shuffle: false },
  },
});
