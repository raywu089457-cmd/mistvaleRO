/* 流浪仙境 v1.4.5：關掉本機「存檔驗證失敗」標記
   v1.1.5（ro-v118.js）的存檔驗證碼會把讀檔時對不上的角色永久標記為「被修改過」（zx），之後不能上傳排行、不能聊天，
   標記還會跟著存檔上傳雲端。v1.4.3 起大量一般玩家被誤判（例如共用卡片圖鑑在簽完驗證碼後才合併卡片紀錄），
   而驗證碼的鑰匙寫在遊戲程式裡，擋不住真的修改存檔的人。改為：
   ・讀檔不再標記；所有角色現有的標記在讀取時清除（目前角色、其他角色、雲端下載的存檔、匯入的備份）
   ・共用倉庫不再檢查；這台裝置的「倉庫被修改過」紀錄清除
   ・存檔仍照常附上驗證碼（不影響遊玩）
   ・防作弊改由伺服器檢查：技能寶石合成、等級超出範圍（netlify/functions/cloud.mjs） */

const V145 = { done: 0 };

// 讀檔：只移除驗證碼與舊標記，不再標記
if (typeof v118Check === "function")
  v118Check = function (o) {
    if (o && typeof o === "object" && o.cls) {
      delete o.zq;
      delete o.zx;
    }
    return o;
  };
// 共用倉庫：不再檢查
if (typeof v118StashCheck === "function") v118StashCheck = function () {};
// 提示：不再出現
if (typeof v118Flag === "function")
  v118Flag = function () {
    if (typeof S !== "undefined" && S && S.zx) {
      delete S.zx;
      try {
        markDirty();
      } catch (e) {}
    }
  };
// 雲端下載、匯入備份：清除備份裡的標記
if (typeof bkDecode === "function") {
  const bd145 = bkDecode;
  bkDecode = async function (...a) {
    const s = await bd145.apply(this, a);
    try {
      if (s && typeof s === "object") {
        delete s.v118x;
        if (s.cur) delete s.cur.zx;
        for (const c of Object.values(s.chars || {})) if (c) delete c.zx;
      }
    } catch (e) {}
    return s;
  };
}
// 這台裝置的「倉庫被修改過」紀錄、目前已載入的角色
function v145Clear() {
  try {
    if (typeof v118RegGet === "function") {
      const r = v118RegGet();
      if (r.x) v118RegPut({ ...r, x: 0 });
    }
  } catch (e) {}
  try {
    if (typeof S !== "undefined" && S && S.zx) {
      delete S.zx;
      markDirty();
    }
  } catch (e) {}
}
v145Clear();
if (typeof startGame === "function") {
  const sg145 = startGame;
  startGame = function (...a) {
    const r = sg145.apply(this, a);
    v145Clear();
    return r;
  };
}

// 說明
try {
  const rows = HELP.tower && HELP.tower[1];
  if (Array.isArray(rows))
    for (const r of rows)
      if (r[0] === "防作弊")
        r[1] = "雲端角色由伺服器檢查技能寶石合成與等級範圍；技能寶石合成對不上的帳號會排除在線上排行之外。管理員可以刪除不合理的紀錄並封鎖該角色與帳號。";
  const bind = HELP.bind && HELP.bind[1];
  if (Array.isArray(bind))
    for (const r of bind)
      if (r[0] === "檢查")
        r[1] = "伺服器會檢查等級範圍與技能寶石合成（合成變異寶石必須用掉 3 顆同技能的變異寶石）。等級超出範圍時拒收這次上傳；技能寶石合成對不上時照常保存進度，但這個帳號會排除在線上排行之外（管理員可解除）。";
} catch (e) {}
