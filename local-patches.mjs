// local-patches.mjs — 本機鏡像自己的修改，集中在這裡；update.mjs 抓完新版後會自動重新套用。
//
//   node local-patches.mjs        直接對目前的檔案套用（已套用過的會略過）
//
// 內容：
//  1. index.html：載入浮層（local/body-start.html）、寶石盤操作改良＋開發者面板＋Service Worker 註冊（local/body-end.html）
//  2. index.html：音效資料 ro-sfx-data.js（535 KB，壓不小）改成 window load 之後才載入
//     —— ro-bgm.js 每次播音效都會重試 roSfxLoad()，資料到之前用原本的合成音效代替
//  3. ro-content.js：fast-boot —— 只等角色／道具／技能圖示（約 0.2 MB）就開遊戲，
//     怪物與技能特效（約 10 MB）改背景佇列載入（local/ro-content-roLoad.new.js）
//
// 每一項都會先檢查「原本的樣子」對不對得上，對不上就跳過並警告，不會亂改。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const L = (f) => fs.readFileSync(path.join(ROOT, 'local', f), 'utf8').replace(/\r\n/g, '\n');
const log = (...a) => console.log('  [local]', ...a);

function readText(f) {
  const raw = fs.readFileSync(f, 'utf8');
  return { crlf: raw.includes('\r\n'), text: raw.replace(/\r\n/g, '\n') };
}
function writeText(f, { crlf, text }) {
  fs.writeFileSync(f, crlf ? text.replace(/\n/g, '\r\n') : text, 'utf8');
}

const SFX_TAG = /<script src="(h\/[^"]+\/ro-sfx-data\.js)"><\/script>/;
const RESCUE_TAG = '<script src="h/local/bootrescue.js"></script>';
const sfxLoader = (src) =>
  `<script id="sfx-late">window.addEventListener("load",function(){setTimeout(function(){var s=document.createElement("script");s.src="${src}";document.body.appendChild(s)},800)})</script>`;

export function patchIndexHtml(html) {
  const doc = { ...(typeof html === 'string' ? { crlf: html.includes('\r\n'), text: html.replace(/\r\n/g, '\n') } : html) };
  let t = doc.text;
  if (!t.includes('id="bootSplash"')) {
    if (/<body>\n/.test(t)) { t = t.replace(/<body>\n/, '<body>\n' + L('body-start.html')); log('index.html：加回載入浮層'); }
    else log('⚠ index.html 找不到 <body>，載入浮層沒加');
  }
  const m = t.match(SFX_TAG);
  if (m) { t = t.replace(SFX_TAG, sfxLoader(m[1])); log('index.html：音效資料改成延後載入'); }
  // 載入卡住的自救按鈕：要越早載入越好（卡住時才幫得上忙），插在 <body> 後第一行
  if (!t.includes('h/local/bootrescue.js')) {
    if (/<body>\n/.test(t)) { t = t.replace(/<body>\n/, '<body>\n' + RESCUE_TAG + '\n'); log('index.html：加入載入卡住自救按鈕'); }
    else log('⚠ index.html 找不到 <body>，自救按鈕沒加');
  }
  const tail = L('body-end.html').split('\n').filter((l) => l && !t.includes(l)).join('\n');
  if (tail) {
    const at = t.lastIndexOf('</body>');   // 用最後一個：前面的 inline 腳本字串裡也有 </body>
    if (tail && at >= 0) { t = t.slice(0, at) + tail + '\n' + t.slice(at); log('index.html：加回本機腳本（寶石盤改良／開發者面板／SW 註冊）'); }
  }
  doc.text = t;
  return typeof html === 'string' ? (doc.crlf ? t.replace(/\n/g, '\r\n') : t) : doc;
}

const ROIMG_OLD = 'function roImage(file) {\n  return RO.images[RO.root + file];\n}';
const ROIMG_NEW =
  'function roImage(file) {\n  const im = RO.images[RO.root + file];\n  if (!im && typeof roLateWant === "function") roLateWant(RO.root + file);\n  return im;\n}';

export function patchRoContent(file) {
  const doc = readText(file);
  let t = doc.text;
  if (t.includes('[本機鏡像 fast-boot]')) return log('ro-content.js：fast-boot 已套用');
  const oldBlock = L('ro-content-roLoad.orig.js');
  if (!t.includes(oldBlock) || !t.includes(ROIMG_OLD)) return log('⚠ ro-content.js 的 roLoad 跟原本不同（作者改版了），fast-boot 沒套用，請重新檢查');
  t = t.replace(oldBlock, L('ro-content-roLoad.new.js')).replace(ROIMG_OLD, ROIMG_NEW);
  writeText(file, { ...doc, text: t });
  log('ro-content.js：fast-boot 已套用');
}

export function applyAll() {
  const idx = path.join(ROOT, 'index.html');
  writeText(idx, patchIndexHtml(readText(idx)));
  const html = fs.readFileSync(idx, 'utf8');
  const rc = html.match(/src="(h\/[^"]+\/ro-content\.js)"/);
  if (rc) patchRoContent(path.join(ROOT, rc[1]));
  else log('⚠ index.html 裡找不到 ro-content.js');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) applyAll();
