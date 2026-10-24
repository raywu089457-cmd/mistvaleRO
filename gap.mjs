// 用「程式碼裡真的出現的字面路徑」比對本機檔案，算出真缺件
import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

const ROOT = process.cwd();
const P = /(?:assets\/(?:ro-v3\/)?)?((?:monsters|characters|maps|effects|items|npc|ui|audio|tree|skills)\/[A-Za-z0-9_./-]+\.(?:png|jpe?g|webp|gif|mp3|ogg|wav|svg))/g;
// 也有純檔名（ro-jobs.js 的 file: "characters/jobs/xxx.png"）
const roots = ['assets/ro-v3/', 'assets/'];

const files = [];
async function walk(d) {
  for (const e of await fs.readdir(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'assets') await walk(p); }
    else if (/\.(js|html)$/i.test(e.name)) files.push(p);
  }
}
await walk(ROOT);

const cand = new Set();
for (const f of files) {
  const t = await fs.readFile(f, 'utf8');
  for (const m of t.matchAll(P)) cand.add(m[1]);
  for (const m of t.matchAll(/"(characters\/[A-Za-z0-9_./-]+\.png)"/g)) cand.add(m[1]);
}

const have = [], miss = [];
for (const rel of cand) {
  const hit = roots.map(r => r + rel).find(p => existsSync(path.join(ROOT, p)));
  (hit ? have : miss).push(hit || rel);
}
console.log(`字面引用的素材：${cand.size}`);
console.log(`本機有：${have.length}  缺：${miss.length}  覆蓋率：${(have.length / cand.size * 100).toFixed(1)}%`);
const byDir = {};
for (const p of miss) { const k = p.split('/')[0]; byDir[k] = (byDir[k] || 0) + 1; }
console.log('缺件分佈：', JSON.stringify(byDir));
await fs.writeFile('_gap.json', JSON.stringify(miss.sort(), null, 1));
console.log('清單 → _gap.json');
