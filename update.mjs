// update.mjs — 只抓有變動的檔案（1.1 秒間隔），抓完自動把 CDN 前綴改成本機相對路徑
//
//   node update.mjs            正常更新
//   node update.mjs --dry      只比對、不下载
//
// 流程：
//  1. 抓線上 index.html，解析 131 個 <script src="h/<hash>/<name>.js">
//  2. 跟本機 h/ 底下的檔案比對 → 只下載缺少／hash 有變的
//  3. 新下載的檔案，把 https://cdn.xianjingro.fun/ 換成空字串（並保留 .orig）
//  4. 刪掉新版不再引用的舊腳本
//  5. 掃描所有 JS 的字面素材路徑，缺的就從 CDN 補（同樣 1.1 秒間隔）

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

const SITE = 'https://xianjingro.fun/';
const CDN = 'https://cdn.xianjingro.fun/';
const ROOT = process.cwd();
const DRY = process.argv.includes('--dry');
const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/141', referer: SITE };
const wait = ms => new Promise(r => setTimeout(r, ms));
const gapSec = 1100;

async function get(url) {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(40000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

// ── 1. index.html ─────────────────────────────────────────────
console.log('▶ 抓 index.html');
const html = (await get(SITE)).toString('utf8');
const want = [...html.matchAll(/src="(h\/[^"]+)"/g)].map(m => m[1]);
console.log('  線上腳本數：', want.length);
if (!DRY) await fs.writeFile('index.html', html);

// ── 2. 比對本機腳本 ───────────────────────────────────────────
const have = new Set();
try {
  for (const d of await fs.readdir('h')) for (const f of await fs.readdir(path.join('h', d))) have.add(`h/${d}/${f}`);
} catch {}
const toFetch = want.filter(w => !have.has(w));
console.log('  需更新腳本：', toFetch.length, toFetch.length ? '（' + toFetch.map(t => t.split('/')[2]).join(', ') + '）' : '');

let n = 0;
for (const rel of toFetch) {
  if (DRY) { console.log('  [dry]', rel); continue; }
  const buf = await get(SITE + rel);
  await fs.mkdir(path.dirname(rel), { recursive: true });
  let text = buf.toString('utf8');
  if (text.includes(CDN)) {
    await fs.writeFile(rel + '.orig', text, 'utf8');
    text = text.replaceAll(CDN, '');
  }
  await fs.writeFile(rel, text, 'utf8');
  n++;
  console.log('  ↓', rel, (buf.length / 1024).toFixed(0) + 'KB');
  await wait(gapSec);
}
console.log('  下載完成：', n, '支');

// ── 3. 清掉不再引用的舊腳本 ───────────────────────────────────
const wantSet = new Set(want);
let removed = 0;
for (const rel of have) {
  if (!wantSet.has(rel) && !rel.endsWith('.orig')) {
    if (!DRY) await fs.rm(rel, { force: true });
    removed++;
  }
}
console.log('  移除舊腳本：', removed, '支');

// ── 4. 素材缺件補抓 ───────────────────────────────────────────
console.log('▶ 掃描素材路徑');
const P = /(?:assets\/(?:ro-v3\/)?)?((?:monsters|characters|maps|effects|items|npc|ui|audio|tree|skills|ro-ui|ro-tree|ro-fx-custom|ro\/cards)\/[A-Za-z0-9_./-]+\.(?:png|jpe?g|webp|gif|mp3|ogg|wav|svg))/g;
const roots = ['assets/ro-v3/', 'assets/', 'assets/ro-ui/', 'assets/ro-tree/', ''];
const cand = new Set();
for (const rel of want) {
  const t = await fs.readFile(rel, 'utf8').catch(() => '');
  for (const m of t.matchAll(P)) cand.add(m[1]);
}
const missing = [...cand].filter(rel => !roots.some(r => existsSync(path.join(ROOT, r + rel))));
console.log('  字面路徑', cand.size, '｜缺', missing.length);

let ok = 0, absent = 0;
for (const rel of missing) {
  if (DRY) { console.log('  [dry] 缺', rel); continue; }
  let got = false;
  for (const r of roots) {
    try {
      const buf = await get(CDN + r + rel);
      const f = path.join(ROOT, r + rel);
      await fs.mkdir(path.dirname(f), { recursive: true });
      await fs.writeFile(f, buf);
      ok++; got = true;
      console.log('  ↓', r + rel, (buf.length / 1024).toFixed(0) + 'KB');
      break;
    } catch { /* 試下一個根目錄 */ }
    await wait(gapSec);
  }
  if (!got) { absent++; console.log('  ✗ 原站也沒有：', rel); }
  await wait(gapSec);
}
console.log('\n=== 完成 ===');
console.log(`腳本更新 ${n} 支、移除 ${removed} 支、素材補到 ${ok} 個、原站也沒有 ${absent} 個`);
console.log('接著用 PLAY.cmd 開，或跑一次離線巡檢確認。');
