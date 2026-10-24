// 把 _gap.json 的字面路徑逐個試根目錄（1.1s 間隔），能拿的就存下來
import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

const BASE = 'https://xianjingro.netlify.app/';
const ROOT = process.cwd();
const ROOTS = ['assets/ro-v3/', 'assets/', 'assets/ro-ui/'];
const gap = JSON.parse(await fs.readFile('_gap.json', 'utf8'));
const report = [];
let ok = 0, absent = 0, skipped = 0, bytes = 0;

const ua = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/141', referer: BASE };
const wait = ms => new Promise(r => setTimeout(r, ms));

for (let i = 0; i < gap.length; i++) {
  const rel = gap[i];
  const already = ROOTS.map(r => r + rel).find(p => existsSync(path.join(ROOT, p)));
  if (already) { skipped++; continue; }
  let done = false;
  for (const r of ROOTS) {
    try {
      const res = await fetch(BASE + r + rel, { headers: ua, signal: AbortSignal.timeout(20000) });
      if (res.ok) {
        const b = Buffer.from(await res.arrayBuffer());
        const f = path.join(ROOT, r + rel);
        await fs.mkdir(path.dirname(f), { recursive: true });
        await fs.writeFile(f, b);
        ok++; bytes += b.length; done = true;
        report.push({ rel, root: r, status: 200, bytes: b.length });
        break;
      }
      report.push({ rel, root: r, status: res.status });
    } catch (e) { report.push({ rel, root: r, status: String(e.name) }); }
    await wait(1100);
  }
  if (!done) absent++;
  if ((i + 1) % 20 === 0) {
    console.log(`進度 ${i + 1}/${gap.length} 抓到 ${ok} 缺 ${absent} 跳過 ${skipped} (${(bytes / 1048576).toFixed(1)}MB)`);
  }
  await wait(1100);
}
await fs.writeFile('_gap-report.json', JSON.stringify(report, null, 1));
console.log(`\n=== 結束 ===抓到 ${ok} 個 (${(bytes / 1048576).toFixed(1)} MB)，確認不存在 ${absent}，已有跳過 ${skipped}`);
