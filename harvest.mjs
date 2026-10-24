// 禮貌型素材補抓器（可重跑、可續傳）
//
//   node harvest.mjs                    # 預設每 1.1 秒抓一個
//   node harvest.mjs --interval 800     # 每秒 1.25 個（更積極）
//   node harvest.mjs --only effect      # 只補某分類
//   node harvest.mjs --dry              # 只檢查狀態，不下載
//
// 行為：
//  - 一次只發一個請求，之間 sleep interval + 0~250ms 抖動（不要同步節奏）
//  - 遇到 403/429/503/連線錯誤 → 指數退避（30s→60s→2m→…→10m 上限），連續失敗 8 次就停
//  - 每個結果寫進 _harvest-log.csv，manifest 同步更新 status/http/bytes
//  - 已下載過的檔案自動跳過（可隨時中斷再跑）

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

const BASE = 'https://xianjingro.netlify.app/';
const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, '_assets-manifest.json');
const LOG = path.join(ROOT, '_harvest-log.csv');

const args = process.argv.slice(2);
const getArg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const INTERVAL = Number(getArg('--interval', 1100));
const ONLY = getArg('--only', null);
const DRY = args.includes('--dry');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8'));

if (!existsSync(LOG)) await fs.writeFile(LOG, 'ts,path,http,bytes,ms,note\n');

let consecutiveFail = 0, backoff = 30000;
let stats = { ok: 0, notfound: 0, blocked: 0, skipped: 0, other: 0 };

for (const entry of manifest) {
  if (ONLY && entry.category !== ONLY) continue;
  if (entry.status === 'ok' || entry.status === 'notfound') { stats.skipped++; continue; }
  const dest = path.join(ROOT, entry.path);
  if (existsSync(dest)) { entry.status = 'ok'; stats.skipped++; continue; }

  const t0 = Date.now();
  let note = '';
  try {
    const res = await fetch(BASE + entry.path, {
      headers: { 'user-agent': UA, 'accept': '*/*', 'referer': BASE },
      signal: AbortSignal.timeout(25000),
    });
    const ms = Date.now() - t0;
    entry.tries++;

    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (!DRY) {
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.writeFile(dest, buf);
      }
      entry.status = 'ok'; entry.http = res.status; entry.bytes = buf.length;
      stats.ok++; consecutiveFail = 0; backoff = 30000;
      await fs.appendFile(LOG, `${new Date().toISOString()},${entry.path},${res.status},${buf.length},${ms},\n`);
      console.log(`OK   ${entry.path}  ${(buf.length / 1024).toFixed(0)}KB ${ms}ms`);
    } else if (res.status === 404 || res.status === 410) {
      entry.status = 'notfound'; entry.http = res.status;
      stats.notfound++; consecutiveFail = 0;
      await fs.appendFile(LOG, `${new Date().toISOString()},${entry.path},${res.status},,${ms},absent-on-origin\n`);
      console.log(`404  ${entry.path}`);
    } else {
      const blocked = res.status === 403 || res.status === 429 || res.status === 503;
      entry.http = res.status; entry.status = blocked ? 'blocked' : 'error';
      if (blocked) stats.blocked++; else stats.other++;
      consecutiveFail++;
      note = blocked ? 'blocked' : 'server-error';
      await fs.appendFile(LOG, `${new Date().toISOString()},${entry.path},${res.status},,${ms},${note}\n`);
      console.log(`${res.status} ${entry.path} → 退避 ${Math.round(backoff / 1000)}s`);
      if (consecutiveFail >= 8) { console.log('連續失敗 8 次，停止。稍後再跑。'); break; }
      await sleep(backoff);
      backoff = Math.min(600000, backoff * 2);
    }
  } catch (e) {
    const ms = Date.now() - t0;
    entry.tries++; entry.status = 'error'; consecutiveFail++;
    stats.blocked++;
    await fs.appendFile(LOG, `${new Date().toISOString()},${entry.path},,,${ms},${String(e.name || e).slice(0, 40)}\n`);
    console.log(`NET  ${entry.path} → ${String(e.name || e).slice(0, 30)} 退避 ${Math.round(backoff / 1000)}s`);
    if (consecutiveFail >= 8) { console.log('連續失敗 8 次，停止。稍後再跑。'); break; }
    await sleep(backoff);
    backoff = Math.min(600000, backoff * 2);
  }
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 1), 'utf8');
  await sleep(INTERVAL + Math.random() * 250);
}

await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 1), 'utf8');
const sum = {};
for (const e of manifest) sum[e.status] = (sum[e.status] || 0) + 1;
console.log('\n=== 結束 ===');
console.log('本次：', JSON.stringify(stats));
console.log('清單統計：', JSON.stringify(sum));
