// 補抓缺失素材：等原站恢復後再跑這支，會把 _missing.json 裡抓到的移除。
import fs from 'node:fs/promises';
import path from 'node:path';
const BASE = 'https://xianjingro.netlify.app/';
const OUT = process.cwd();
const file = path.join(OUT, '_missing.json');
let list = JSON.parse(await fs.readFile(file, 'utf8'));
let ok = 0, fail = 0, bytes = 0;
const left = [];
for (let i = 0; i < list.length; i++) {
  const rel = list[i];
  try {
    const r = await fetch(BASE + rel, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) { left.push(rel); fail++; continue; }
    const b = Buffer.from(await r.arrayBuffer());
    const f = path.join(OUT, rel);
    await fs.mkdir(path.dirname(f), { recursive: true });
    await fs.writeFile(f, b);
    ok++; bytes += b.length;
  } catch { left.push(rel); fail++; }
  await new Promise(r => setTimeout(r, 250)); // 客氣一點，別再被擋
  if ((i + 1) % 25 === 0) console.log(`進度 ${i + 1}/${list.length} 成功 ${ok} 失敗 ${fail}`);
}
await fs.writeFile(file, JSON.stringify(left, null, 1));
console.log(`\n完成：補到 ${ok} 個 (${(bytes / 1048576).toFixed(1)} MB)，還缺 ${left.length}`);
