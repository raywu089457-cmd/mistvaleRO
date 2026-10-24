/* 流浪仙境 v1.2.6：精煉連按時誤勾「傳說的魔力礦石」
   原因：精煉結果文字出現／消失、+5 起多出「使用保護」那一行，精煉按鈕被往下推，連按時游標落到按鈕上方的勾選框。
   ① 精煉、鑲嵌頁的結果文字固定保留一行的空間（單行顯示，過長以「…」省略）
   ② 精煉按鈕移到成功率下方；保護、傳說的魔力礦石等勾選放在按鈕下面（選項增減不會再推動按鈕）
   ③ 按下精煉後 1 秒內，點到勾選框不生效 */

const V127 = { guard: 1000, t: -1e9 };

function v127Install() {
  if (typeof v5ResHtml !== "function" || typeof v5RefTab !== "function") return;
  // ① 結果文字：精煉、鑲嵌頁沒有結果時也保留同樣高度
  const rh = v5ResHtml;
  v5ResHtml = function (...a) {
    const h = rh.apply(this, a);
    if (h || !(ui.v5at === "ref" || ui.v5at === "sock")) return h;
    return '<p class="v5res v127ph" aria-hidden="true">&nbsp;</p>';
  };
  // ② 精煉按鈕移到成功率那一行的正下方
  const rt = v5RefTab;
  v5RefTab = function (...a) {
    let h = rt.apply(this, a);
    if (typeof h !== "string") return h;
    const b = h.match(/<button class="btn primary" data-v5="refine"[^>]*>[\s\S]*?<\/button>/),
      r = h.match(/<div class="row"><span>成功率[\s\S]*?<\/div>/);
    if (!b || !r || h.indexOf(r[0]) > h.indexOf(b[0])) return h;
    h = h.replace(b[0], "");
    return h.replace(r[0], `${r[0]}<div class="v127btn">${b[0]}</div>`);
  };
  // ③ 按下精煉後 1 秒內，勾選框（保護、傳說的魔力礦石）不受點擊
  if (typeof document !== "undefined") {
    document.addEventListener(
      "click",
      (e) => {
        const t = e.target;
        if (!t || !t.closest) return;
        if (t.closest('[data-v5="refine"]')) {
          V127.t = performance.now();
          return;
        }
        const box = t.closest("label.chk");
        if (box && box.querySelector('[data-v64lg],[data-v5="prot"]') && performance.now() - V127.t < V127.guard) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },
      true,
    );
    if (!document.getElementById("v127css")) {
      const st = document.createElement("style");
      st.id = "v127css";
      st.textContent = `.v5res{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v5res.v127ph{visibility:hidden}.v127btn{margin:6px 0 4px}.v127btn .btn{width:100%}`;
      document.head.appendChild(st);
    }
  }
}
if (typeof roV4Install === "function") {
  const r4v127 = roV4Install;
  roV4Install = function () {
    r4v127.apply(this, arguments);
    try {
      v127Install();
    } catch (e) {
      console.error("v127", e);
    }
  };
}
