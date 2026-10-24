/* 流浪仙境 v1.2.19：雙手流派的副手裝備
   拿雙手武器的流派原本不能裝盾牌，副手欄空著。新增四種副手，佔用副手欄，可以和雙手武器一起裝備：
     ・弓箭手（狩殺、樂箭、陷阱流，以及舞孃線）：箭筒——攻擊速度、暴擊率、附加攻擊傷害
     ・盜賊（平A、毒流）：左手短劍——暴擊率、暴擊傷害、攻擊速度
     ・劍士（雙手劍流派）：騎士徽章——力量、暴擊傷害、傷害增加
     ・商人（雙手斧流派）：工匠護手——力量、傷害增加、攻擊速度
   （法師目前沒有雙手流派，所以沒有副手）
   ・強度約為同等級盾牌的 70%：能力值權重合計 0.65～0.8（實測 Lv127 傳奇約 +7%～15% DPS，含隨機能力值），沒有護甲、閃避與生命；插槽與盾牌相同，可以插盾牌卡
   ・只有對應職業、而且拿著雙手武器時才生效；拿單手武器時副手不生效（可以改裝盾牌）
   ・目前流派是雙手流派時，掉落的副手欄裝備（獨特以外）會是自己職業的副手；舊的盾牌不變
   ・裝備欄「盾牌」改名為「副手」 */

const V1219 = { mk: 0 };
// RO 原版圖示（箭筒 12004、左手短劍 1207、徽章 2733、護手 2617）：登錄後才會在開場預先載入
(() => {
  const A = typeof window !== "undefined" && window.RO_ASSETS;
  if (!A) return;
  A.items ||= {};
  for (const id of [12004, 1207, 2733, 2617]) A.items[id] ||= { file: `items/${id}.png`, width: 24, height: 24 };
})();
// 副手：[名稱, 最低物品等級]、RO 圖示、能力值權重
const V1219_OH = {
  bow: { n: "箭筒", ico: 12004, tiers: [["皮革箭筒", 1], ["獵人箭筒", 30], ["精靈箭筒", 60], ["神射手箭筒", 90]], ex: { aspd: 0.3, crit: 0.25, adddmg: 0.25 } },
  thief: { n: "左手短劍", ico: 1207, tiers: [["左手短匕", 1], ["格擋短劍", 30], ["刺客短劍", 60], ["暗影短劍", 90]], ex: { crit: 0.25, critm: 0.15, aspd: 0.25 } },
  sword: { n: "騎士徽章", ico: 2733, tiers: [["戰士徽章", 1], ["騎士徽章", 30], ["聖騎士徽章", 60], ["符文騎士徽章", 90]], ex: { rstr: 0.3, critm: 0.15, dmgp: 0.2 } },
  merchant: { n: "工匠護手", ico: 2617, tiers: [["工匠手套", 1], ["鍛造護手", 30], ["神工匠護手", 60], ["機甲護手", 90]], ex: { rstr: 0.3, dmgp: 0.25, aspd: 0.25 } },
};
const V1219_CLS = Object.keys(V1219_OH);

// 目前流派是不是雙手流派（有裝武器時看武器）
function v1219TwoHandBranch() {
  if (!S) return false;
  const w = S.equip?.weapon;
  if (w && canWear(w)) return !!(w.h2 || w.v1219h);
  const d = typeof V5_WEX !== "undefined" ? V5_WEX[S.tal?.asc] || V5_WEX[S.cls] : null;
  return !!(d && d[0]);
}
// 副手生效：對應職業、而且拿著雙手武器
function v1219On(st = S) {
  const sh = st?.equip?.shield,
    w = st?.equip?.weapon;
  return !!(sh && sh.oh && sh.oh === st.cls && w && canWear(w) && (w.h2 || w.v1219h));
}
function v1219Tpl(cls, L) {
  const D = V1219_OH[cls];
  if (!D) return null;
  let ti = 0;
  D.tiers.forEach(([, lv], i) => {
    if (lv <= Math.max(1, L)) ti = i;
  });
  const [n, lv] = D.tiers[ti];
  return [[n, D.ico, lv, 0, "", D.ex], 900 + V1219_CLS.indexOf(cls) * 10 + ti];
}
// 暫時把雙手武器當成單手（讓內層的「雙手不算盾牌」判斷放行），fn 結束後還原
function v1219AsOneHand(fn) {
  const w = S?.equip?.weapon;
  if (!w || !w.h2) return fn();
  w.h2 = 0;
  w.v1219h = 1;
  try {
    return fn();
  } finally {
    w.h2 = 1;
    delete w.v1219h;
  }
}
// 暫時拿掉副手欄（副手不生效時，內層完全不算它）
function v1219NoShield(fn) {
  const sh = S?.equip?.shield;
  if (!sh) return fn();
  delete S.equip.shield;
  try {
    return fn();
  } finally {
    S.equip.shield = sh;
  }
}
function v1219Note(t) {
  if (!t || !t.oh) return "";
  const D = V1219_OH[t.oh],
    cn = CLASS[t.oh]?.n || "";
  if (!S || S.cls !== t.oh) return `<p class="note" style="margin:2px 0;color:var(--bad)">副手（${D.n}）：只有${esc(cn)}可以使用</p>`;
  const w = S.equip.weapon,
    on = w && canWear(w) && (w.h2 || w.v1219h);
  return `<p class="note" style="margin:2px 0;${on ? "" : "color:var(--bad)"}">副手（${D.n}）：搭配雙手武器時生效${on ? "" : "（目前拿的不是雙手武器，不生效）"}</p>`;
}

function v1219Install() {
  if (typeof v5Convert !== "function" || typeof V5_BASES === "undefined") return;
  // 圖示
  for (const D of Object.values(V1219_OH)) {
    if (typeof roItemFiles !== "undefined") roItemFiles["v5_" + D.ico] = D.ico;
    if (typeof ICONS !== "undefined") ICONS["v5_" + D.ico] ||= ICONS[ICON_SET?.shield?.[0]] || ICONS.sw0;
  }
  if (typeof SLOT_NAME !== "undefined") SLOT_NAME.shield = "副手";
  // 新掉落：雙手流派的副手欄裝備改成自己職業的副手
  const mk = makeItem;
  makeItem = function (...a) {
    V1219.mk++;
    try {
      return mk.apply(this, a);
    } finally {
      V1219.mk--;
    }
  };
  const cv = v5Convert;
  v5Convert = function (it, opt = {}, ...x) {
    if (it && !it.v5 && !it.sl && it.slot === "shield" && !it.uq && !opt.tpl) {
      if (!it.oh && V1219.mk > 0 && S && V1219_OH[S.cls] && v1219TwoHandBranch()) it.oh = S.cls;
      if (it.oh && V1219_OH[it.oh]) opt = { ...opt, tpl: v1219Tpl(it.oh, it.ilvl || 1) };
    }
    return cv.call(this, it, opt, ...x);
  };
  // 能力值：副手生效時當作盾牌計算；不生效時完全不算
  const cm = collectMods;
  collectMods = function (...a) {
    const sh = S?.equip?.shield;
    if (!sh || !sh.oh) return cm.apply(this, a);
    if (v1219On()) return v1219AsOneHand(() => cm.apply(this, a));
    return v1219NoShield(() => cm.apply(this, a));
  };
  // 裝備：副手可以搭配雙手武器；換雙手武器時不會卸下副手
  const eq = equipItem;
  equipItem = function (u, ...x) {
    const it = S && S.bag.find((b) => b.u === +u);
    if (it && it.oh) {
      if (it.oh !== S.cls) return void toast(`${V1219_OH[it.oh]?.n || "副手"}只有${CLASS[it.oh]?.n || ""}可以使用`, "bad");
      return v1219AsOneHand(() => eq.call(this, u, ...x));
    }
    if (it && it.slot === "weapon" && it.h2 && S.equip.shield?.oh) return v1219NoShield(() => eq.call(this, u, ...x));
    return eq.call(this, u, ...x);
  };
  // 裝備說明
  if (typeof v5StatHtml === "function") {
    const sh = v5StatHtml;
    v5StatHtml = function (t, ...x) {
      if (!t || !t.oh) return sh.call(this, t, ...x);
      return v1219AsOneHand(() => sh.call(this, t, ...x)) + v1219Note(t);
    };
  }
  // 裝備建議：副手照常評估
  if (typeof roGearAdvice === "function") {
    const ga = roGearAdvice;
    roGearAdvice = function (item, ...x) {
      if (item && item.oh) {
        if (!S || item.oh !== S.cls) return { good: false, attack: false, defend: false, damage: 0, survival: 0, empty: false, reason: "其他職業的副手" };
        return v1219AsOneHand(() => ga.call(this, item, ...x));
      }
      return ga.call(this, item, ...x);
    };
  }
  // 說明
  const row = ["副手", `拿雙手武器的流派可以裝副手（佔用副手欄，和雙手武器一起裝備）：${V1219_CLS.map((c) => `${CLASS[c]?.n || c}——${V1219_OH[c].n}`).join("、")}。強度約為同等級盾牌的 70%，沒有護甲與生命，插槽可插盾牌卡；只有對應職業、拿著雙手武器時才生效。目前是雙手流派時，掉落的副手欄裝備（獨特以外）會是自己職業的副手。`];
  for (const k of ["gear", "bag", "equip"]) {
    const r = HELP[k]?.[1];
    if (Array.isArray(r) && !r.some((x) => x[0] === "副手")) {
      r.push(row);
      break;
    }
  }
}

if (typeof roV4Install === "function") {
  const r4v1219 = roV4Install;
  roV4Install = function () {
    r4v1219.apply(this, arguments);
    try {
      v1219Install();
    } catch (e) {
      console.error("v1219", e);
    }
  };
}
