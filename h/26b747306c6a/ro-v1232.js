/* 流浪仙境 v1.2.32：雲端角色重新整理不再倒退進度、不再出現假的離線收益
   原因：雲端角色每次開啟都讀伺服器上的存檔，而存檔每 3 分鐘才上傳一次（關閉頁面時來不及上傳），
   重新整理會載入最多 3 分鐘前的存檔，再把「距離上次上傳的時間」當成離線時間，跳出 1～3 分鐘的離線收益。
   修正：開啟時，如果雲端在這段時間沒有被其他裝置更新（雲端版本＝這台上次上傳或載入的版本），
   而且這台裝置的暫存比上次上傳新，就先把暫存上傳到雲端（伺服器照常檢查等級、Zeny、技能寶石），成功後直接使用這份最新進度。
   離線時間改用實際關閉頁面的時間，並以伺服器記錄的「距離上次上傳的時間」為上限（改電腦時間無效）。
   雲端已被其他裝置更新、上傳未通過檢查或連線失敗時，照舊以雲端存檔為準。
   v1.4.4：上傳太頻繁（同帳號 15 秒內）時等待後重試一次，避免剛開啟就按自動更新時退回沒有離線收益的雲端存檔。 */

const V1232 = { skipKey: "v1232skip" };

// 這台裝置的雲端角色暫存（雲端角色模式下 localStorage 已導向這個帳號的位置）
function v1232Cache() {
  let cur = null;
  try {
    cur = lsParse(localStorage.getItem(SAVE_KEY));
  } catch (e) {}
  if (!cur || !CLASS[cur.cls] || !Number.isFinite(cur.lvl) || !/^[a-z0-9]{1,24}$/.test(cur.cid || "")) return null;
  const chars = {};
  for (const r of rosterGet().list || []) {
    if (!r || !r.id || r.id === cur.cid) continue;
    const c = charLoad(r.id);
    if (c) chars[r.id] = c;
  }
  let stash = null;
  try {
    stash = JSON.parse(localStorage.getItem(STASH_KEY));
  } catch (e) {}
  return { k: BK_TAG, v: 1, ver: typeof BUILD_VER === "string" ? BUILD_VER : "", t: Date.now(), cur, chars, stash: stClean(stash) };
}

if (typeof v126Boot === "function" && typeof V126 !== "undefined") {
  const boot0 = v126Boot;
  v126Boot = async function (...a) {
    if (!V126.on) return boot0.apply(this, a);
    let skip = false;
    try {
      skip = sessionStorage.getItem(V1232.skipKey) === "1";
      sessionStorage.removeItem(V1232.skipKey);
    } catch (e) {}
    let o = null;
    try {
      o = skip ? null : v1232Cache();
    } catch (e) {
      o = null;
    }
    // 暫存要比上次上傳新，而且這台知道的雲端版本存在
    if (!o || !V98C.base || !(o.cur.t > (V98C.up || 0) + 1000)) return boot0.apply(this, a);
    v126Cover("正在同步雲端角色…");
    const p = await v126Api("GET", null, "?ping=1");
    if (p.err || p.t == null || p.t !== V98C.base) return boot0.apply(this, a);
    let r = null;
    try {
      const code = await bkEncode(o),
        body = { code, base: p.t, dev: V98C.dev, ver: typeof V6_BUILD === "string" ? V6_BUILD : "" };
      r = await v126Api("PUT", body);
      // v1.4.4：伺服器同一帳號 15 秒內只收一次（例如剛開啟就按自動更新）：等到滿 15 秒再傳一次，不退回較舊的雲端存檔
      if (r && r.err === "slow") {
        const wait = Math.min(16e3, Math.max(1e3, 16e3 - Math.max(0, (p.now || 0) - (p.t || 0))));
        v126Cover("正在同步雲端角色…", { sub: `等待雲端存檔可再次上傳（約 ${Math.ceil(wait / 1000)} 秒）` });
        await new Promise((res) => setTimeout(res, wait));
        r = await v126Api("PUT", body);
      }
    } catch (e) {
      r = null;
    }
    if (!r || r.err || !r.t) {
      if (r && r.err === "chk") {
        try {
          sessionStorage.setItem("v126msg", `這台裝置的最新進度未通過雲端檢查${r.why ? `（${r.why}）` : ""}，已改用上一次的雲端存檔`);
        } catch (e) {}
      }
      return boot0.apply(this, a);
    }
    // 上傳成功：直接使用這份暫存
    const now = Date.now(),
      cap = Math.max(0, (p.now || now) - (p.t || now)),
      offCur = Math.max(0, Math.min(now - (o.cur.t || now), cap)),
      shift = now - offCur - (o.cur.t || now);
    V126.bootPerf = performance.now();
    for (const c of [o.cur, ...Object.entries(o.chars).map(([k, c]) => ((c.cid = k), c))]) V126.cOff[c.cid] = Math.max(0, (now - ((c.t || now) + shift)) / 1000);
    V98C.base = V98C.ct = r.t;
    V98C.up = now;
    V98C.ask = 0;
    V98C.err = "";
    v98Put();
    v126Ok(r);
    v126CoverOff();
    V126.bootOk = 1;
    return true;
  };
  // 雲端檢查未通過後重新載入：下次開啟不再上傳暫存
  if (typeof v126Chk === "function") {
    const ck = v126Chk;
    v126Chk = function (...a) {
      try {
        sessionStorage.setItem(V1232.skipKey, "1");
      } catch (e) {}
      return ck.apply(this, a);
    };
  }
}
