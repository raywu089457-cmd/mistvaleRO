/* 流浪仙境 v1.0.9（內部 v10.0）：獵人陷阱流職業天賦「定位強化」削弱
   原本說明寫「每 100 閃避 +4%」，實際公式是 4 ×（閃避值 ÷ 15）%，等於每 100 閃避約 +26.7%；
   閃避堆到約 2000 時陷阱傷害 ×6.5，單體輸出是 24 流派中位數的 2.5 倍。
   改為每 100 閃避 +1.5%（「定位陷阱」冷卻 −20% 不變），說明文字改為依實際公式顯示。 */

const V100 = { k: "ro_bow_2_1_1", per100: 1.5 }; // 每 100 閃避，陷阱傷害 +1.5%
// 陷阱的閃避加成公式：陷阱傷害 ×（1 ＋ 係數 × 閃避值 ÷ 15 ÷ 100）→ 每 100 閃避 ＝ 係數 × 100 ÷ 15 %
const v100Per100 = (v) => +((v * 100) / 15).toFixed(2);

function v100Install() {
  if (typeof V5_TAL_TXT !== "undefined") V5_TAL_TXT.trapEva = (v) => `陷阱傷害依閃避值提高（每 100 閃避 +${v100Per100(v)}%）`;
  for (const b of ASC?.bow || [])
    for (const row of b.t || [])
      for (const t of row) {
        if (!t?.e || t.e.trapEva == null) continue;
        if (t.k === V100.k) t.e.trapEva = (V100.per100 * 15) / 100; // 0.225
        if (typeof v5TalText === "function") t.d = v5TalText(t.e);
      }
}
if (typeof roV4Install === "function") {
  const r4v100 = roV4Install;
  roV4Install = function () {
    r4v100();
    v100Install();
  };
}
