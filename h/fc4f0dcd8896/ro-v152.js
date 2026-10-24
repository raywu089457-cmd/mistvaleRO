/* 流浪仙境 v1.5.2：裝備保留規則重置為目前的條件
   v5 改版後，裝備保留規則只剩：指定詞綴、稀有度、部位、物品等級、基底品質、獨特、插槽數、已鑲卡片、精煉值。
   舊存檔的規則還留著已拿掉的條件（任意詞綴、舊的指定詞綴、詞綴計數、插槽裝備）：
   現在的裝備沒有這些詞綴，一般情況永遠不成立（該保留的被自動分解），勾「非」時永遠成立（全部保留、背包塞滿），
   選單裡也看不到、玩家無法自己修。
   ・進入角色時移除目前選單沒有的條件；整條規則都是舊條件時整條刪除；其餘現行條件照舊保留
   ・所有角色共用的規則（共用倉庫）一併清理；背包的「一律保留 插槽 ≥」快速設定照舊
   ・石板、符文石已在 v6.2 移除：留在存檔裡的石板／符文石保留規則一併刪除（不另外提示）
   ・有清理時提示一次 */

// 清理一組裝備保留規則：回傳 { list, n（移除的條件數）, g（整條刪除的規則數） }
function v152Clean(list) {
  if (!Array.isArray(list) || typeof KEEP_K === "undefined") return { list, n: 0, g: 0 };
  const ok = new Set(Object.keys(KEEP_K));
  let n = 0,
    g = 0;
  const out = [];
  for (const grp of list) {
    if (!grp || typeof grp !== "object" || !Array.isArray(grp.c)) {
      g++;
      continue;
    }
    const c = grp.c.filter((x) => x && typeof x === "object" && ok.has(x.k));
    const drop = grp.c.length - c.length;
    n += drop;
    if (!drop) {
      out.push(grp);
      continue;
    }
    if (!c.length) {
      g++;
      continue;
    }
    out.push({ ...grp, c });
  }
  return { list: out, n, g };
}
function v152Run() {
  if (typeof S === "undefined" || !S || !S.set) return;
  if (typeof V1213 !== "undefined" && (V1213.run || (typeof V1213B !== "undefined" && V1213B.mode))) return;
  let n = 0,
    g = 0;
  // 石板、符文石已在 v6.2 移除：刪除留在存檔裡的石板／符文石保留規則（不另外提示）
  const gone = (o) => !!o && ((Array.isArray(o.skeep) && o.skeep.length) || (Array.isArray(o.rkeep) && o.rkeep.length));
  if (gone(S.set)) {
    S.set.skeep = [];
    S.set.rkeep = [];
    try {
      markDirty();
    } catch (e) {}
  }
  // 共用倉庫裡的共用規則
  try {
    const st = stLoad();
    let w = false;
    if (st && st.kp && gone(st.kp)) {
      st.kp.skeep = [];
      st.kp.rkeep = [];
      w = true;
    }
    if (st && st.kp && Array.isArray(st.kp.keep)) {
      const b = v152Clean(st.kp.keep);
      if (b.n || b.g) {
        st.kp.keep = b.list;
        w = true;
        n = b.n;
        g = b.g;
      }
    }
    if (w && stWrite(st)) STH = st;
  } catch (e) {}
  // 這個角色目前使用的規則
  const a = v152Clean(S.set.keep);
  if (a.n || a.g) {
    S.set.keep = a.list;
    n = Math.max(n, a.n);
    g = Math.max(g, a.g);
    try {
      if (S.kpS && typeof kpPush === "function") kpPush();
    } catch (e) {}
    try {
      markDirty();
    } catch (e) {}
  }
  if (n || g)
    setTimeout(() => {
      try {
        toast(`裝備保留規則已更新為目前的條件：移除 ${n} 個舊版條件${g ? `，其中 ${g} 條規則只有舊條件，已整條刪除` : ""}；請到背包的保留規則確認`, "lvl", 1);
      } catch (e) {}
    }, 2000);
}
if (typeof startGame === "function") {
  const sg152 = startGame;
  startGame = function (...a) {
    const r = sg152.apply(this, a);
    try {
      v152Run();
    } catch (e) {
      console.error("v152", e);
    }
    return r;
  };
}
try {
  v152Run();
} catch (e) {}
