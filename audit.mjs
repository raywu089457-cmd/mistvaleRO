// 覆蓋率稽核：把 JS/HTML 裡出現的所有素材路徑挖出來，看本機有沒有
import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

const ROOT = process.cwd();
const EXT = /\.(png|jpe?g|webp|gif|mp3|ogg|wav|m4a|json|bin|atlas|svg|woff2?|ttf)$/i;
const STR = /["'`]([^"'`\n]{3,160}\.(?:png|jpe?g|webp|gif|mp3|ogg|wav|m4a|json|bin|atlas|svg|woff2?|ttf))["'`]/g;

const files = [];
async function walk(d) {
  for (const e of await fs.readdir(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'assets') await walk(p); }
    else if (/\.(js|html|css|json)$/i.test(e.name)) files.push(p);
  }
}
await walk(ROOT);

const refs = new Map(); // candidate path -> [sources]
function add(p, src) {
  p = p.replace(/^\.?\//, '').replace(/^~?\//, '');
  if (!p || p.startsWith('http') || p.includes('..') || p.startsWith('data:')) return;
  if (!refs.has(p)) refs.set(p, new Set());
  refs.get(p).add(path.basename(src));
}
for (const f of files) {
  const t = await fs.readFile(f, 'utf8');
  for (const m of t.matchAll(STR)) {
    const raw = m[1].trim();
    if (!EXT.test(raw)) continue;
    add(raw, f);
    // 遊戲會在 assets/ 或 assets/ro-v3/ 下面組路徑
    for (const root of ['assets/', 'assets/ro-v3/', 'assets/ro-v3/maps/', 'assets/ro-v3/characters/']) {
      if (!raw.startsWith(root)) add(root + raw, f);
    }
  }
  for (const m of t.matchAll(/src="([^"]+)"/g)) add(m[1], f);
}

let have = 0, miss = 0;
const missing = [];
for (const p of refs.keys()) {
  if (existsSync(path.join(ROOT, p))) have++;
  else { miss++; missing.push(p); }
}
const byDir = {};
for (const p of missing) {
  const k = p.split('/').slice(0, 3).join('/');
  byDir[k] = (byDir[k] || 0) + 1;
}
console.log(`引用到的素材路徑：${refs.size}`);
console.log(`本機已有：${have}    疑似缺：${miss}    覆蓋率：${(have / refs.size * 100).toFixed(1)}%`);
console.log('\n缺件分佈（前 20）：');
for (const [k, v] of Object.entries(byDir).sort((a, b) => b[1] - a[1]).slice(0, 20)) console.log(`  ${String(v).padStart(4)}  ${k}`);
await fs.writeFile('_audit-missing.json', JSON.stringify(missing.sort(), null, 1));
console.log('\n完整清單：_audit-missing.json');
