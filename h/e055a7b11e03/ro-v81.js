/* 流浪仙境 v8.1：商店技能依「職業線＋職階」開放（三轉、四轉後販售該職業的技能）、「氣勢」更名「怒氣值」並修正不需光環的累積、HP 下方的怒氣值條 */

// ---------------------------------------------------------------------------
// 1. 商店／任務的流派技能：原本只看流派（例如盧恩騎士的龍之吐息只有騎士・均衡流買得到，暴力流四轉成盧恩騎士也買不到）。
//    在原本的流派規則之外，加上依 RO 原作轉職階段開放：同一條職業線的兩個流派都買得到，
//    一轉起販售二轉職技能、三轉後加上三轉職技能、四轉後加上四轉職技能。原本流派買得到的維持不變（只會多、不會少）。
//    [職業線（V63_LINES 的順序）][職階 0＝一轉起、1＝三轉後、2＝四轉後]
const V81_TIER = {
  sword: [
    // 騎士 → 騎士領主 → 盧恩騎士
    [["sw_bowl", "sw_brandish", "sw_charge", "sw_counter"], ["sw_spiral", "sw_berserk", "sw_parry"], ["sw_wave", "sw_breath", "sw_ignite", "sw_frost", "sw_runeb"]],
    // 十字軍 → 聖殿十字軍 → 皇家禁衛隊
    [["sw_shboom", "sw_gcross"], [], []],
  ],
  bow: [
    // 獵人 → 神射手 → 遊俠
    [["bw_blitz", "bw_ankle", "bw_falcon"], ["bw_sharp"], ["bw_snipe", "bw_trap"]],
    // 詩人 → 搞笑藝人 → 宮廷樂師
    [["bw_song", "bw_disso", "bw_ens2"], ["bw_ens"], ["bw_bsong"]],
  ],
  mage: [
    // 巫師 → 超魔導士 → 大法師
    [["mg_meteor", "mg_storm", "mg_lov", "mg_quake", "mg_quag"], ["mg_gravity"], ["mg_tetra"]],
    // 賢者 → 智者 → 元素使
    [["mg_field", "mg_spirit"], [], ["mg_spirits", "mg_spirit2"]],
  ],
  thief: [
    // 刺客 → 十字刺客 → 十字斬首者
    [["th_envenom", "th_sonic", "pstack", "th_toxin", "th_crit"], [], ["th_slash"]],
    // 流氓 → 神行太保 → 魅影追蹤者
    [["th_snatch", "th_backstab", "th_ambush"], [], ["th_mark", "th_weak", "th_clone", "th_shadow"]],
  ],
  acolyte: [
    // 祭司 → 神官 → 大主教
    [["ac_magnus", "ac_orbs", "ac_sanct", "ac_holy", "ac_ray"], ["ac_angel"], ["ac_wrath", "ac_angel2"]],
    // 武僧 → 武術宗師 → 修羅
    [["ac_combo", "ac_call", "ac_asura", "ac_finger", "ac_knuckle", "ac_triple", "ac_spirit", "ac_fury"], [], ["ac_rampage"]],
  ],
  merchant: [
    // 鐵匠 → 神工匠 → 機匠
    [["mc_hfall", "mc_hammer", "mc_over"], ["mc_term"], ["mc_faw", "mc_axe", "mc_proj", "mc_prec"]],
    // 鍊金術師 → 創造者 → 基因學者
    [["mc_homun", "mc_firebomb", "mcount", "mdmg", "mc_acid"], ["mc_acidbomb", "mc_cot"], ["mc_cannon", "mc_plant", "mc_spore", "mc_miasma"]],
  ],
};
const V81_STAGE_N = ["一轉起", "三轉後", "四轉後"];
// 這個技能在指定的職業線、職階下能不能買（只看職階表）
function v81TierOk(id, cls = S?.cls, asc = S?.tal?.asc, stage = typeof v63Stage === "function" ? v63Stage() : 0) {
  if (!cls || !asc || typeof v63LineOf !== "function") return false;
  const li = v63LineOf(cls, asc),
    map = V81_TIER[cls]?.[li];
  if (!map) return false;
  for (let t = 0; t <= Math.min(2, stage); t++) if (map[t].includes(id)) return true;
  return false;
}
// 技能開放的職階（任一流派買得到時回傳 -1）
function v81TierOf(id, cls) {
  for (const L of V81_TIER[cls] || []) for (let t = 0; t < 3; t++) if (L[t].includes(id)) return t;
  return null;
}
function v81ShopInstall() {
  if (typeof v6ShopOk !== "function") return;
  const ok = v6ShopOk;
  v6ShopOk = function (id, ...a) {
    return ok.call(this, id, ...a) || v81TierOk(id);
  };
  if (ui.m_shop) {
    const ms = ui.m_shop;
    ui.m_shop = function (...a) {
      const h = ms.apply(this, a);
      if (typeof h !== "string" || !(this.shopV === "act" || this.shopV === "sup") || typeof v63LineOf !== "function") return h;
      const li = S?.tal?.asc ? v63LineOf(S.cls, S.tal.asc) : -1,
        L = V63_LINES?.[S.cls]?.[li],
        st = v63Stage();
      if (!L) return h;
      const next = st < 2 ? `；${["三轉", "四轉"][st]}成為「${L.n[st + 1]}」後會再開放該職業的${this.shopV === "act" ? "技能" : "輔助"}` : "";
      return h.replace(/(<p class="note"[^>]*>)/, `$1目前職業：${L.n[st]}${next}。`);
    };
  }
  const r = HELP.shop?.[1]?.find((x) => x[0] === "流派寶石");
  if (r)
    r[1] =
      "商店只販售一轉基本技能、通用輔助，以及目前流派與職業的專屬技能與輔助：除了流派專屬的寶石，同一條職業線的兩個流派都能買到該職業線的技能，一轉起販售二轉職技能、三轉後加上三轉職技能、四轉後加上四轉職技能（例：騎士線四轉成盧恩騎士後開放龍之吐息、點燃爆破、冰霜龍息、劍氣衝擊）。其他流派的寶石只能從變異寶石取得，取得後可正常放上技能盤。";
}

// ---------------------------------------------------------------------------
// 2. 怒氣值（原名「氣勢」）
//    ・分支特性「技能擊中也會獲得怒氣值」（劍領・連斬、十字刺客・音速、武僧・連拳）與傳說裝備的同名效果：
//      原本必須開著雙劍格擋／二刀流光環才會累積，沒有光環時完全沒有作用（劍士的商店也買不到雙劍格擋）。
//      改為不需光環：普攻與技能擊中都獲得 1 層；有光環時維持原本的規則，不會重複獲得。
//    ・「氣勢」更名為「怒氣值」（技能、職業天賦、分支特性、傳說裝備、說明與提示）
//    ・左上 HP 下方新增怒氣值條：分格顯示層數，滿層變金色閃爍、正在減少時變暗；滑鼠移上去顯示目前加成與剩餘時間
//    ・技能列雙劍格擋／二刀流圖示下方的數字改為「層數/上限」
const V81_RAGE = { wrap: false };
const v81MomMax = () => STK.mom.max + (typeof tal === "function" ? tal("momMax") : 0);
const v81MomOn = () => !!(G?.pl && (G.pl.sus?.dance || stkN("mom") > 0));
const v81MomShow = () => !!(S && G?.pl && !G.dead && (G.pl.sus?.dance || tal("momSkill") || stkN("mom") > 0));

// 2-1. 不需光環也能累積：技能擊中也會獲得怒氣值（分支特性／傳說）→ 普攻與技能擊中都 +1 層
function v81MomGainInstall() {
  if (typeof TAL_ON === "undefined") return;
  TAL_ON.momSkill = {
    hit: (m, dmg, crit, s) => {
      // 有光環時由原本的規則處理（普攻＋技能），這裡只處理沒有光環的情況；回傳 undefined，不中斷其他擊中效果
      if (G?.pl && !G.pl.sus?.dance && !s?.nomom) addStk("mom");
    },
  };
}

// 2-2. 更名：氣勢 → 怒氣值（天賦名稱「無限氣勢」「連段氣勢」→「無限怒氣」「連段怒氣」）
const v81Rn = (s) => (typeof s === "string" && s.includes("氣勢") ? s.replace(/無限氣勢/g, "無限怒氣").replace(/連段氣勢/g, "連段怒氣").replace(/氣勢/g, "怒氣值") : s);
const v81RnDeep = (v) => (typeof v === "string" ? v81Rn(v) : Array.isArray(v) ? v.map(v81RnDeep) : v);
function v81RnWrap(f) {
  if (f.v81rn) return f;
  const g = function (...a) {
    return v81RnDeep(f.apply(this, a));
  };
  g.v81rn = 1;
  return g;
}
function v81RnWalk(o, seen, depth = 0) {
  if (!o || typeof o !== "object" || seen.has(o) || depth > 12) return;
  seen.add(o);
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (typeof v === "string") {
      if (v.includes("氣勢")) o[k] = v81Rn(v);
    } else if (typeof v === "function") {
      if (!v.v81rn && Function.prototype.toString.call(v).includes("氣勢")) o[k] = v81RnWrap(v);
    } else if (v && typeof v === "object") v81RnWalk(v, seen, depth + 1);
  }
}
function v81RenameInstall() {
  const seen = new WeakSet(),
    roots = [];
  for (const n of ["STK", "SKILLS", "ASC", "HELP", "UNIQUE", "LEG", "RO_TREE_NODES", "roBranches", "roTemplates", "RO_ASC_CORE_ULT", "V5_TAL_TXT", "V5_TAL2", "V6_ACT", "HIT_MUL"])
    try {
      const v = (0, eval)(`typeof ${n} === "undefined" ? null : ${n}`);
      if (v) roots.push(v);
    } catch (e) {}
  for (const r of roots) v81RnWalk(r, seen);
}

// 2-3. 怒氣值條（左上 HP 下方）
function v81MomTip(n) {
  const max = v81MomMax(),
    rows = [`${n} / ${max} 層：攻擊速度 +${5 * n}%、移動速度 +${3 * n}%`];
  if (tal("momDmg")) rows.push(`傷害倍率 +${+(n * tal("momDmg") * 100).toFixed(1)}%（每層 +${+(tal("momDmg") * 100).toFixed(1)}%）`);
  if (tal("momDR")) rows.push(`受到的傷害 −${+(n * tal("momDR") * 100).toFixed(1)}%（每層 −${+(tal("momDR") * 100).toFixed(1)}%）`);
  if (tal("momDbl")) rows.push(`${n >= max ? "滿層：" : "滿層時，"}擊中有 ${+(tal("momDbl") * 100).toFixed(0)}% 機率造成 2 倍傷害`);
  const s = G.pl.stk?.mom;
  rows.push(s ? (s.t > STK.mom.decay + 0.01 ? `${s.t.toFixed(1)} 秒內沒有擊中就開始減少` : `正在減少（每 ${STK.mom.decay} 秒 −1 層）`) : "擊中敵人後開始累積");
  const dance = G.pl.sus?.dance,
    sk = tal("momSkill");
  rows.push(
    dance
      ? `來源：雙劍格擋／二刀流開啟中，普攻${sk ? "與技能" : ""}擊中獲得 1 層`
      : sk
        ? "來源：分支特性，普攻與技能擊中都獲得 1 層（不需光環）"
        : "光環已關閉，剩餘層數會逐漸消失",
  );
  rows.push(`${STK.mom.dur} 秒沒有擊中後，每 ${STK.mom.decay} 秒減少 1 層`);
  return rows;
}
function v81DrawRage(c) {
  if (!v81MomShow()) return;
  const max = Math.max(1, v81MomMax()),
    n = Math.min(max, stkN("mom")),
    full = n >= max,
    st = G.pl.stk?.mom,
    decay = !!st && st.t <= STK.mom.decay + 0.01,
    bw = Math.min(64, G.W - 100),
    bx = 28,
    txt = `${n}/${max}`;
  let y = 27;
  if (V81_RAGE.wrap) {
    // 畫面太窄、XP/M 換到第二行時：改畫在上方面板下面（有頭目血條時再往下）
    y = 37;
    if (typeof alive === "function" && alive(G.boss)) y = 52 + (HUD_HIT.some((h) => h.y === 37 && /^[bh]/.test(h.k)) ? 17 : 0);
    c.fillStyle = "#f4f8fbe0";
    c.fillRect(0, y - 2, bx + bw + 8 + textW(txt), 9);
  }
  const by = y + 1;
  roHudText(c, "怒氣值", 4, y, full ? "#c88a1a" : "#b0602c");
  c.fillStyle = "#120d1c";
  c.fillRect(bx - 1, by - 1, bw + 2, 5);
  c.fillStyle = "#3a2414";
  c.fillRect(bx, by, bw, 3);
  const fw = Math.round((bw * n) / max);
  if (fw > 0) {
    c.fillStyle = full ? (G.t % 0.5 < 0.25 ? "#fff0a0" : "#ffd84a") : decay ? "#b8693a" : "#ff7a2a";
    c.fillRect(bx, by, fw, 3);
    c.fillStyle = full ? "#fffbe0" : decay ? "#d89a70" : "#ffc58a";
    c.fillRect(bx, by, fw, 1);
  }
  // 每層一格
  if (max <= 30) {
    c.fillStyle = "#120d1c";
    for (let i = 1; i < max; i++) c.fillRect(bx + Math.round((bw * i) / max) - 0.25, by, 0.5, 3);
  }
  roHudText(c, txt, bx + bw + 4, y, full ? "#c88a1a" : decay ? "#8a7466" : "#b0602c");
  HUD_HIT.push({ k: "v81rage", x: 2, y: y - 1, w: bx + bw + 6 + textW(txt), h: 8, t: () => ["怒氣值", v81MomTip(stkN("mom")), "#ff9a4a"] });
}
function v81MomInstall() {
  if (typeof STK === "undefined" || !STK.mom) return;
  v81MomGainInstall();
  if (typeof drawHUD === "function") {
    const dh = drawHUD;
    drawHUD = function (c, ...a) {
      V81_RAGE.wrap = false;
      const r = dh.call(this, c, ...a);
      try {
        v81DrawRage(c);
        // 技能列提示（雙劍格擋「開啟中・氣勢 n 層」）也改用新名稱
        for (const h of HUD_HIT) if (h.k?.[0] === "g" && h.t && !h.t.v81rn) h.t = v81RnWrap(h.t);
      } catch (e) {}
      return r;
    };
  }
  // 技能列：雙劍格擋／二刀流圖示下方的數字改為「層數/上限」；同時偵測 XP/M 是否換到第二行
  const ht = roHudText;
  roHudText = function (c, text, x, y, color, ...r) {
    if (y === 26 && (text === "XP/M" || text === "KILL/M")) V81_RAGE.wrap = true;
    if (y === 31 && color === "#9ab0ff" && /^\d+$/.test(String(text)) && v81MomOn() && +text === stkN("mom")) {
      const s = `${text}/${v81MomMax()}`;
      return ht.call(this, c, s, x + Math.ceil(textW(String(text)) / 2) - Math.ceil(textW(s) / 2), y, stkN("mom") >= v81MomMax() ? "#ffd84a" : color, ...r);
    }
    return ht.call(this, c, text, x, y, color, ...r);
  };
  const L = HELP.asc?.[1];
  if (L && !L.some((x) => x[0] === "怒氣值")) {
    const i = L.findIndex((x) => x[0] === "分支特性");
    L.splice(i < 0 ? L.length : i + 1, 0, [
      "怒氣值",
      "雙劍格擋（劍士）、二刀流（盜賊）開啟時，普攻擊中獲得 1 層；劍領・連斬、十字刺客・音速、武僧・連拳的分支特性「技能擊中也會獲得怒氣值」不需光環，普攻與技能擊中都獲得 1 層。每層攻擊速度 +5%、移動速度 +3%，3 秒沒有擊中後每 0.5 秒減少 1 層。左上 HP 下方的怒氣值條顯示目前層數（滿層變金色），滑鼠移上去可查看目前加成。",
    ]);
  }
}

// ---------------------------------------------------------------------------
function v81Install() {
  v81ShopInstall();
  v81MomInstall();
  v81RenameInstall();
}
if (typeof roV4Install === "function") {
  const r4v81 = roV4Install;
  roV4Install = function () {
    r4v81();
    v81Install();
  };
}
