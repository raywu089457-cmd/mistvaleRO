/* 流浪仙境 v1.2.26：把本機角色帶到雲端
   ・登入 Google（雲端角色）後，「選單 → 綁定」與建立角色畫面可以「把本機角色帶到雲端」：
     列出這台裝置的本機角色（包含「匯入檔案」匯入、匯出過的存檔），勾選後上傳成這個帳號的雲端角色；本機原本的角色保留
   ・雲端已有同一個角色（同 ID）時不重複加入；同名時名字後面加數字；雲端角色最多 6 個
   ・帳號已有雲端角色時只帶角色（身上與背包的東西都會帶過去），共用倉庫用雲端那份；雲端還沒有角色時，整份本機存檔（含共用倉庫）一起帶上去
   ・伺服器：這次新加入的角色當成新的起點，不算等級、Zeny 成長異常（之後照常檢查）；同一個帳號 7 天內只能帶入 1 次（一次可以選多個） */

const V1226 = { gap: 7 * 864e5, busy: 0, impAt: null, err: "" };
const v1226Raw = (k) => {
  try {
    return V126.raw ? V126.raw.g.call(window.localStorage, k) : null;
  } catch (e) {
    return null;
  }
};
const v1226Ok = (d) => !!(d && typeof d === "object" && CLASS[d.cls] && Number.isFinite(d.lvl));
// 這台裝置的本機角色（未登入時的存檔位置）
function v1226Local() {
  let ro = null,
    cur = null;
  try {
    ro = JSON.parse(v1226Raw(ROSTER_KEY));
  } catch (e) {}
  try {
    cur = lsParse(v1226Raw(SAVE_KEY));
  } catch (e) {}
  const out = [];
  if (v1226Ok(cur)) out.push({ id: cur.cid || "", name: cur.name || CLASS[cur.cls].n, cls: cur.cls, lvl: cur.lvl, d: cur });
  for (const r of (ro && Array.isArray(ro.list) && ro.list) || []) {
    if (!r || !r.id || out.some((x) => x.id === r.id)) continue;
    let d = null;
    try {
      d = lsParse(v1226Raw(CHAR_KEY(r.id)));
    } catch (e) {}
    if (v1226Ok(d)) out.push({ id: r.id, name: d.name || r.name || CLASS[d.cls].n, cls: d.cls, lvl: d.lvl, d });
  }
  return out;
}
// 雲端角色（目前帳號的暫存）
function v1226Cloud() {
  const list = (rosterGet().list || []).filter((x) => x && x.id);
  if (S && S.cid && !list.some((x) => x.id === S.cid)) list.unshift({ id: S.cid, name: S.name, cls: S.cls, lvl: S.lvl });
  return list;
}
const v1226Date = (t) => {
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
function v1226Rename(n, used) {
  const base = String(n || "冒險者").slice(0, 7);
  for (let i = 2; i < 10; i++) if (!used.has(base + i)) return base + i;
  return base.slice(0, 5) + Math.floor(Math.random() * 900 + 100);
}

// ---------------------------------------------------------------------------
// 視窗：選擇要帶到雲端的本機角色
function v1226Sheet() {
  const loc = v1226Local(),
    cloud = v1226Cloud(),
    cids = new Set(cloud.map((x) => x.id)),
    room = CHAR_MAX - cloud.length;
  const wait = V1226.impAt && Date.now() - V1226.impAt < V1226.gap ? V1226.impAt + V1226.gap : 0;
  const st = V1226.impAt == null ? "確認帶入次數中…" : wait ? `這個帳號 7 天內已經帶入過，${v1226Date(wait)} 後才能再帶入。` : "現在可以帶入（帶入後 7 天內不能再帶入）。";
  const rows = loc
    .map((x) => {
      const dup = x.id && cids.has(x.id);
      return `<label class="chk v1226i${dup ? " dup" : ""}"><input type="checkbox" data-v1226="pick" value="${esc(x.id)}" ${dup || wait ? "disabled" : ""}><span><b>${esc(x.name)}</b> <small>${esc(typeof brName === "function" ? brName(x.cls, x.d.tal?.asc) : CLASS[x.cls].n)} Lv.${Math.floor(x.lvl)}${dup ? "・已在雲端" : ""}</small></span></label>`;
    })
    .join("");
  bkSheet(
    `<h2 class="cfh">把本機角色帶到雲端</h2><div class="v1226s">` +
      `<p class="note">勾選要帶到這個帳號雲端的本機角色（包含「匯入檔案」匯入、匯出過的存檔），角色身上與背包的東西都會帶過去；本機原本的角色會保留。每個帳號每 7 天只能帶入 1 次（一次可以選多個），雲端角色最多 ${CHAR_MAX} 個（目前 ${cloud.length} 個）。</p>` +
      `<p class="note">${cloud.length ? "共用倉庫維持雲端那份，本機的共用倉庫不會帶過去。" : "這個帳號還沒有雲端角色：本機的共用倉庫也會一起帶上去。"}</p>` +
      `<p class="note v1226st"${wait ? ' style="color:var(--bad)"' : ""}>${st}</p>` +
      `<div class="v1226l">${rows || '<p class="note">這台裝置沒有本機角色。</p>'}</div>` +
      (V1226.err ? `<p class="note" style="color:var(--bad)">${esc(V1226.err)}</p>` : "") +
      `<div class="row"><button class="btn" data-act="close">取消</button><span class="spacer"></span><button class="btn primary" data-v1226="go" ${!loc.length || wait || room <= 0 || V1226.busy ? "disabled" : ""}>${V1226.busy ? "上傳中…" : room <= 0 ? "雲端角色已滿" : "帶到雲端"}</button></div></div>`,
  );
}
async function v1226Open() {
  if (!V126.on) return;
  V1226.err = "";
  v1226Sheet();
  const r = await v126Api("GET", null, "?ping=1");
  if (!r.err) V1226.impAt = +r.imp || 0;
  if (document.querySelector("#sheet .v1226s")) v1226Sheet();
}
async function v1226Go() {
  if (!V126.on || V1226.busy) return;
  const ids = [...document.querySelectorAll('#sheet [data-v1226="pick"]:checked')].map((x) => x.value);
  const loc = v1226Local(),
    cloud = v1226Cloud(),
    cids = new Set(cloud.map((x) => x.id));
  const add = loc.filter((x) => ids.includes(x.id) && !(x.id && cids.has(x.id)));
  if (!add.length) return void toast("請勾選要帶到雲端的角色", "bad");
  if (cloud.length + add.length > CHAR_MAX) return void toast(`雲端角色最多 ${CHAR_MAX} 個（目前 ${cloud.length} 個）`, "bad");
  V1226.busy = 1;
  V1226.err = "";
  V126.up = 1; // 暫停自動上傳，避免同時上傳
  v1226Sheet();
  try {
    const now = Date.now(),
      used = new Set(cloud.map((x) => x.name).filter(Boolean));
    const chars = add.map((x) => {
      const c = JSON.parse(JSON.stringify(x.d));
      c.cid = /^[a-z0-9]{1,24}$/.test(x.id || "") && !cids.has(x.id) ? x.id : cidNew();
      c.t = now; // 不算離線時間
      if (used.has(c.name)) c.name = v1226Rename(c.name, used);
      used.add(c.name);
      return c;
    });
    let data;
    if (S) {
      data = bkData();
      for (const c of chars) data.chars[c.cid] = c;
    } else {
      let st = null;
      try {
        st = JSON.parse(v1226Raw(STASH_KEY));
      } catch (e) {}
      const [cur, ...rest] = chars;
      data = { k: BK_TAG, v: 1, ver: typeof BUILD_VER === "string" ? BUILD_VER : "", t: now, cur, chars: Object.fromEntries(rest.map((c) => [c.cid, c])), stash: stClean(st) };
    }
    const code = await bkEncode(data);
    const r = await v126Api("PUT", { code, base: V98C.base, dev: V98C.dev, ver: typeof V6_BUILD === "string" ? V6_BUILD : "", imp: chars.map((c) => c.cid) });
    if (r.t && !r.err) {
      V98C.base = V98C.ct = r.t;
      V98C.up = Date.now();
      V98C.err = "";
      v98Put();
      return void v126Reload(`已把 ${chars.length} 個本機角色帶到雲端：${chars.map((c) => c.name).join("、")}`);
    }
    if (r.err === "imp") {
      V1226.impAt = (+r.next || 0) - V1226.gap;
      V1226.err = `這個帳號 7 天內已經帶入過，${v1226Date(+r.next)} 後才能再帶入。`;
    } else if (r.err === "slow") V1226.err = "剛剛才自動上傳過，請等 15 秒後再按一次。";
    else if (r.err === "old") return void v126Reload("雲端存檔已在其他裝置更新，已重新載入雲端角色");
    else if (r.err === "dev") return void v98Kick();
    else if (r.err === "auth") return void v126Logout(V98_ERR.auth);
    else if (r.err === "chk") return void v126Chk(r);
    else V1226.err = V98_ERR[r.err] || V98_ERR.net;
  } catch (e) {
    V1226.err = V98_ERR.net;
  } finally {
    V1226.busy = 0;
    V126.up = 0;
  }
  if (document.querySelector("#sheet .v1226s")) v1226Sheet();
}

// ---------------------------------------------------------------------------
function v1226Install() {
  if (typeof V126 === "undefined" || typeof v98Act !== "function") return;
  if (typeof document !== "undefined") {
    document.addEventListener("click", (e) => {
      const b = e.target?.closest?.("[data-v1226]");
      if (!b || b.tagName === "INPUT") return;
      if (b.dataset.v1226 === "open") v1226Open();
      else if (b.dataset.v1226 === "go") v1226Go();
    });
    if (!document.getElementById("v1226css")) {
      const st = document.createElement("style");
      st.id = "v1226css";
      st.textContent = `.v1226l{display:flex;flex-direction:column;gap:4px;margin:6px 0}.v1226i{display:flex;align-items:center;gap:6px;padding:4px 6px;border:1px solid #d6dee8;border-radius:6px;background:#fff}.v1226i.dup{opacity:.6}.v1226i small{color:var(--muted)}.v1226pk{margin-top:10px;text-align:center}.v1226pk .sub{margin:0 0 4px}`;
      document.head.appendChild(st);
    }
  }
  if (V126.on) {
    // 綁定頁
    const page = ui.m_bind;
    ui.m_bind = function (...a) {
      const h = page.apply(this, a),
        n = v1226Local().length;
      return (
        h +
        `<h3>把本機角色帶到雲端</h3><div class="box stack"><p class="note" style="margin:0">${n ? `這台裝置有 ${n} 個本機角色（包含「匯入檔案」匯入、匯出過的存檔），可以帶到這個帳號的雲端；本機原本的角色會保留。每個帳號每 7 天 1 次。` : "這台裝置沒有本機角色。登出後用「設定 → 匯入檔案」匯入存檔，再登入就可以帶到雲端。"}</p>${n ? '<div class="row"><span class="spacer"></span><button class="btn primary" data-v1226="open">選擇角色</button></div>' : ""}</div>`
      );
    };
    // 建立角色畫面（這個帳號還沒有雲端角色）
    if (typeof showPick === "function") {
      const sp = showPick;
      showPick = function (t, ...a) {
        const r = sp.call(this, t, ...a);
        try {
          const n = (t || "first") === "first" ? v1226Local().length : 0;
          const pk = $("#pick");
          if (n && pk && !pk.querySelector(".v1226pk")) pk.insertAdjacentHTML("beforeend", `<div class="v1226pk"><p class="sub">這台裝置有 ${n} 個本機角色，可以直接帶到雲端</p><button class="btn" data-v1226="open">把本機角色帶到雲端</button></div>`);
        } catch (e) {}
        return r;
      };
    }
  }
  // 說明
  if (HELP.bind && Array.isArray(HELP.bind[1])) {
    const rows = HELP.bind[1],
      r = rows.find((x) => x[0] === "雲端角色");
    if (r) r[1] = "在「選單 → 綁定」用 Google 登入後，改用這個帳號的雲端角色；這台裝置原本的本機角色會保留，登出後可以回到本機角色。帳號還沒有雲端角色時，可以建立新角色，或把本機角色帶到雲端。只記錄帳號識別碼（雜湊後），不儲存 Email。";
    if (!rows.some((x) => x[0] === "帶入本機角色")) {
      const i = rows.findIndex((x) => x[0] === "以雲端為準");
      rows.splice(i < 0 ? 1 : i + 1, 0, [
        "帶入本機角色",
        `登入後在「選單 → 綁定」（或建立角色畫面）按「把本機角色帶到雲端」，勾選這台裝置的本機角色（包含「匯入檔案」匯入、匯出過的存檔）上傳成雲端角色，本機原本的角色保留。每個帳號每 7 天只能帶入 1 次（一次可以選多個），雲端角色最多 ${CHAR_MAX} 個；已在雲端的同一個角色不會重複加入，同名時名字後面加數字。帳號已有雲端角色時只帶角色，共用倉庫用雲端那份；還沒有雲端角色時，本機的共用倉庫也一起帶上去。帶入的角色從這次開始照常檢查，可以上線上排行與隊伍排行。`,
      ]);
    }
  }
}

if (typeof roV4Install === "function") {
  const r4v1226 = roV4Install;
  roV4Install = function () {
    r4v1226.apply(this, arguments);
    try {
      v1226Install();
    } catch (e) {
      console.error("v1226", e);
    }
  };
}
