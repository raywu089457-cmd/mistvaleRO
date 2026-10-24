/* 流浪仙境 v1.3.4 — 26 分支、624 天賦。資料、介面與離線一覽共用本檔。
 * 依 index.html 最後載入；不重新呼叫舊安裝器，不讀寫玩家以外的存檔。
 * 戰鬥狀態全放 G.pl.v133，由既有隊伍 context 一起切換。
 */
"use strict";
const V133_ROW = ["資源來源", "釋放節奏", "技能聯動", "資源取捨", "生存條件", "循環工具", "風險契約", "分支奧義"];
const v133Q = (ev, x = {}) => ({ ev, cd: 1, ...x });
const v133D = (v, n = 1, r = 0, pulses = 1) => ({ op: "strike", v, n, r, pulses });
const v133B = (stat, v, t = 4) => ({ op: "buff", stat, v, t });
const v133H = (v) => ({ op: "heal", v });
const v133S = (v) => ({ op: "shield", v });
const v133N = (kind, v) => ({ op: "native", kind, v });
const v133C = (id, v) => ({ op: "cooldown", id, v });
const v133U = (n, acts, x = {}) => ({ n, acts, ...x });
// 第一來源即免費分支特性；第一排可改成另兩種取得方式。
// 來源每成功一次 +1 格；每個來源有獨立的時間、連續目標和順序記錄。
const V133_SPEC = [
  { k:"ro_sword_0", resource:"龍槍協律", cap:3, cd:4, intent:"槍技與龍息交替，最後以龍息或騎槍收束。",
    feeds:[v133Q("cast",{ids:["sw_bowl","sw_brandish","sw_breath"],dragon:1,alternate:1,every:2,window:7}),v133Q("basic",{every:3,cond:"near"}),v133Q("dodge",{cd:2})],
    feedNames:["槍息輪轉","貼身步法","反擊預備"], finish:["sw_breath","sw_brandish"],
    ults:[v133U("龍槍合一",[v133D(2.4,3,36),v133B("skill",.18,4)]),v133U("攻守換位",[v133D(1.2,2,30),v133S(.14),v133N("limit",12)]),v133U("雙息回響",[v133D(.7,4,40,3)],{cd:6})]},
  { k:"ro_sword_2", resource:"血怒", cap:4, cd:4, intent:"在有風險的生命區間連續近戰，決定爆發、回復或持續狂戰。",
    feeds:[v133Q("basic",{every:2,cond:"low70"}),v133Q("hurt",{min:.01,cd:1.2}),v133Q("cast",{ids:["sw_wave","sw_spiral"],alternate:1,every:2,window:8})],feedNames:["戰傷激怒","痛覺燃料","狂槍交替"],finish:["sw_spiral","sw_wave"],
    ults:[v133U("瀕危破軍",[v133D(4),v133B("taken",.12,4)]),v133U("血債清償",[v133D(1.6),v133H(.14)]),v133U("長夜狂戰",[v133B("basic",.32,7),v133B("as",.18,7)],{cd:7})]},
  { k:"ro_sword_1", resource:"獻禮", cap:3, cd:5, intent:"主動技能實際支付生命後累積獻禮，選擇審判、聖盾或救贖。",
    feeds:[v133Q("payment",{min:.01,cd:1}),v133Q("cast",{ids:["sw_gcross","sw_shboom"],alternate:1,every:2,window:9}),v133Q("basic",{every:3,cond:"shield"})],feedNames:["生命獻祭","十字迴環","持盾宣誓"],finish:["sw_gcross","sw_charge"],
    ults:[v133U("殉道審判",[v133D(2.8,4,36)]),v133U("聖約庇護",[v133D(1,3,30),v133S(.20)]),v133U("回生禮拜",[v133H(.12),v133B("skill",.22,6)],{cd:6})]},
  { k:"ro_sword_3", resource:"盾壓", cap:3, cd:4, intent:"實際吸收攻擊累積盾壓，轉為盾擊、反擊窗口或堡壘。",
    feeds:[v133Q("absorb",{min:.005,cd:.8}),v133Q("hurt",{min:.01,cd:1.5}),v133Q("cast",{ids:["sw_provoke","sw_shboom"],alternate:1,every:2,window:8})],feedNames:["承壓盾面","破甲毅力","挑釁迴旋"],finish:["sw_shboom","sw_gcross"],
    ults:[v133U("蓄壓撞城",[v133D(3.6,2,26)]),v133U("反攻壁壘",[v133B("basic",.35,6),v133B("dr",.18,6)]),v133U("不動要塞",[v133S(.22),v133B("dr",.12,6)],{cd:7})]},
  { k:"ro_bow_0", resource:"瞄準", cap:3, cd:4, intent:"遠距連續命中同一目標累積瞄準，換目標會重算連續命中。",
    feeds:[v133Q("basic",{same:1,every:3,cond:"far",window:5}),v133Q("hit",{crit:1,same:1,every:3,window:5}),v133Q("pulse",{cond:"stillFar",every:2,cd:1})],feedNames:["定點校準","破綻測距","伏擊鏡架"],finish:["bw_snipe","bw_sharp"],
    ults:[v133U("一箭定生死",[v133D(4.4)]),v133U("貫穿射線",[v133D(2.2,4,28)]),v133U("獵鷹接力",[v133D(.95,2,55,3)],{cd:6})]},
  { k:"ro_bow_2", resource:"引線", cap:3, cd:4, intent:"先鋪陷阱或限制敵人，再用爆破箭消耗引線。",
    feeds:[v133Q("cast",{ids:["bw_ankle"],cd:2}),v133Q("cast",{ids:["bw_varrow"],cd:2}),v133Q("basic",{every:3,cond:"controlled"})],feedNames:["埋設雷管","箭雨佈線","獵物入網"],finish:["bw_burst","bw_varrow"],
    ults:[v133U("連鎖爆破",[v133D(1.8,5,48)]),v133U("定向破甲雷",[v133D(3.5),{op:"vuln",v:.15,t:5}]),v133U("游擊雷幕",[v133D(.8,4,32,3),v133B("ms",.22,5)],{cd:6})]},
  { k:"ro_bow_3", resource:"樂章", cap:3, cd:5, intent:"不同樂曲依序構成樂章；重複單曲不能完成第一來源。",
    feeds:[v133Q("cast",{ids:["bw_song","bw_disso","bw_bsong"],distinct:3,window:12,cd:.5}),v133Q("cast",{ids:["bw_song"],cd:3}),v133Q("basic",{every:4,cond:"afterCast"})],feedNames:["三部曲","單曲返場","拍點伴奏"],finish:["bw_bsong","bw_disso"],
    ults:[v133U("大合奏終章",[v133D(2,5,55),v133B("skill",.15,5)]),v133U("不歇獨奏",[v133B("as",.25,8),v133B("basic",.20,8)],{cd:8}),v133U("安可守護曲",[v133H(.10),v133S(.12),v133C("bw_song",2)])]},
  { k:"ro_bow_1", resource:"節拍", cap:4, cd:4, intent:"唱歌後用普攻填拍，以二連矢或不協和音結算。",
    feeds:[v133Q("basic",{cond:"afterSong",cd:.7}),v133Q("cast",{ids:["bw_song","bw_double"],alternate:1,every:2,window:8}),v133Q("hit",{ids:["bw_double"],crit:1,cd:1})],feedNames:["弦上四拍","唱射輪奏","重音射擊"],finish:["bw_double","bw_disso"],
    ults:[v133U("雙拍重奏",[v133D(1.8,1,0,2)]),v133U("快板箭舞",[v133B("as",.30,5),v133B("ms",.15,5)]),v133U("留拍餘韻",[v133D(2),v133C("bw_song",1.5)],{refund:2})]},
  { k:"ro_bow_4", resource:"魅惑契印", cap:3, cd:5, intent:"持續攻擊已被魅惑的目標，選擇獨舞、群舞或收場。",
    feeds:[v133Q("basic",{same:1,every:2,cond:"charmed",window:6}),v133Q("cast",{ids:["dc_ugly","dc_forget"],alternate:1,every:2,window:9}),v133Q("pulse",{cond:"charmNear",every:2})],feedNames:["凝視舞伴","雙面舞姿","魅場養成"],finish:["dc_partner","dc_ugly"],
    ults:[v133U("唯一舞伴",[v133D(3.3),{op:"vuln",v:.16,t:6}]),v133U("群星圓舞",[v133D(1.8,5,50),v133B("dr",.10,5)]),v133U("謝幕飛吻",[v133D(2.5,3,35),v133C("dc_partner",2)],{cd:7})]},
  { k:"ro_bow_5", resource:"舞步", cap:3, cd:4, intent:"遠距投鞭建立舞步，尖叫或第二次投鞭轉入收束。",
    feeds:[v133Q("cast",{ids:["dc_throw"],cond:"far",cd:2}),v133Q("pulse",{cond:"moving",every:3}),v133Q("cast",{ids:["dc_humming","dc_scream"],alternate:1,every:2,window:8})],feedNames:["遠鞭起手","流動舞台","聲鞭互答"],finish:["dc_scream","dc_throw"],
    ults:[v133U("旋身裂帛",[v133D(2.2,4,34)]),v133U("長鞭追影",[v133D(1.1,1,0,3),v133B("ms",.25,4)]),v133U("定場喝采",[v133D(1.3,3,38),{op:"stun",v:.8,r:38,n:3},v133S(.08)])]},
  { k:"ro_mage_0", resource:"反應譜", cap:3, cd:4, intent:"蒐集不同元素反應，避免同一反應無限重複累積。",
    feeds:[v133Q("reaction",{distinct:2,window:8,cd:.5}),v133Q("cast",{ids:["mg_meteor","mg_storm","mg_lov"],distinct:3,window:10}),v133Q("reaction",{same:1,every:3,window:6})],feedNames:["異色反應","三元素序列","單體實驗"],finish:["mg_meteor","mg_lov"],
    ults:[v133U("元素交響",[v133D(2.5,4,44)]),v133U("反應餘燼",[v133D(.65,5,40,4)],{cd:7}),v133U("雙相催化",[v133D(1.7,2,30),v133B("skill",.24,5)],{refund:1})]},
  { k:"ro_mage_2", resource:"儀式環", cap:4, cd:5, intent:"以泥沼與重力準備儀式，再讓四元素爆發結算。",
    feeds:[v133Q("cast",{ids:["mg_quag","mg_gravity"],alternate:1,every:2,window:10}),v133Q("pulse",{cond:"still",every:3}),v133Q("reaction",{every:2,cd:1})],feedNames:["雙環儀式","靜默吟詠","反應祭品"],finish:["mg_tetra","mg_gravity"],
    ults:[v133U("四象禁典",[v133D(4,3,32)],{cd:7}),v133U("速寫咒陣",[v133D(1.8,3,36),v133C("mg_tetra",1)],{cd:3}),v133U("透支法則",[v133D(4.8),v133B("taken",.15,5)],{refund:1})]},
  { k:"ro_mage_1", resource:"精靈調律", cap:3, cd:5, intent:"結界與召靈交替調律，精靈存在時才能走伴生路線。",
    feeds:[v133Q("cast",{ids:["mg_field","mg_spirits"],alternate:1,every:2,window:10}),v133Q("pulse",{cond:"summons",every:3}),v133Q("cast",{ids:["mg_fireball"],cd:2})],feedNames:["界靈交替","伴生共鳴","火靈餵養"],finish:["mg_spirits","mg_fireball"],
    ults:[v133U("主靈契約",[v133B("min",.40,7),{op:"repair",v:.20}],{cd:7}),v133U("雙靈協奏",[v133D(1.3,3,36,2),v133B("min",.15,5)]),v133U("靈體融合",[v133D(2.4,2,30),v133S(.14)])]},
  { k:"ro_mage_3", resource:"咒文記憶", cap:4, cd:4, intent:"先施法再以普攻默誦；完成記憶後結算法術回響。",
    feeds:[v133Q("basic",{cond:"afterCast",every:2}),v133Q("cast",{ids:["mg_bolt","mg_frost","mg_fireball"],distinct:2,window:7}),v133Q("basic",{every:3,same:1,window:5})],feedNames:["擊打默誦","雙咒記憶","定靶覆寫"],finish:["mg_bolt","mg_frost","mg_fireball"],
    ults:[v133U("單頁深刻",[v133D(3.6)]),v133U("雙頁連讀",[v133D(1.25,2,32,2)]),v133U("覆寫迴圈",[v133D(1.5),v133C("mg_bolt",1),v133C("mg_frost",1),v133C("mg_fireball",1)],{refund:1})]},
  { k:"ro_thief_2", resource:"刃式", cap:3, cd:4, intent:"以不同招式組合刃式，再施放終結技；不靠單招連打。",
    feeds:[v133Q("cast",{ids:["th_slash","th_clone","th_envenom"],distinct:2,window:8}),v133Q("cpSpend",{minCount:3,cd:1}),v133Q("basic",{every:3,cond:"afterCast"})],feedNames:["雙式起手","終結心得","刃間追打"],finish:["th_sonic","th_envenom"],
    ults:[v133U("最後一刃",[v133D(4.2)]),v133U("雙式交叉",[v133D(1.7,3,28,2)],{cd:6}),v133U("留手再起",[v133D(1.8),v133N("cp",2)],{refund:1})]},
  { k:"ro_thief_0", resource:"裂傷", cap:5, cd:3, intent:"普攻堆積裂傷，暴擊或刃技結算；快速小結算與長蓄爆發擇一。",
    feeds:[v133Q("basic",{cd:.6}),v133Q("hit",{crit:1,cond:"poisoned",cd:.7}),v133Q("basic",{same:1,every:2,window:4,cd:.5})],feedNames:["細刃留痕","毒血裂口","定點剖解"],finish:["th_dual","th_slash"],
    ults:[v133U("毒刃延燒",[v133D(.8,2,24,4)],{cd:6}),v133U("深層剖開",[v133D(4.5)],{cd:5}),v133U("細傷連收",[v133D(1.7),v133H(.025)],{refund:2,cd:3})]},
  { k:"ro_thief_1", resource:"戰利標記", cap:3, cd:4, intent:"偷取與隱匿建立戰利標記；標記只用於戰鬥，不產生金幣或掉落。",
    feeds:[v133Q("cast",{ids:["th_snatch"],cd:2}),v133Q("cast",{ids:["th_hide","th_backstab"],alternate:1,every:2,window:8}),v133Q("dodge",{cd:2})],feedNames:["順手留印","隱襲往返","擦身取物"],finish:["th_backstab","th_snatch"],
    ults:[v133U("雙重奪心",[v133D(1.8,1,0,2)]),v133U("得手離場",[v133D(2.1),v133B("ms",.35,4),v133B("dr",.15,4)]),v133U("窮追不捨",[v133D(.9,2,40,3),v133C("th_backstab",1)],{cd:6})]},
  { k:"ro_thief_3", resource:"咒結", cap:3, cd:5, intent:"在詛咒目標間建立咒結，單王也能用連續命中建立連結。",
    feeds:[v133Q("hit",{cond:"cursed",distinctTarget:3,window:8,cd:.5}),v133Q("basic",{cond:"cursed",same:1,every:3,window:5}),v133Q("cast",{ids:["th_mark","th_weak"],alternate:1,every:2,window:8})],feedNames:["三方咒鏈","孤王咒縛","雙咒織結"],finish:["th_mark","th_weak"],
    ults:[v133U("群咒傳導",[v133D(1.9,5,60)]),v133U("孤影追債",[v133D(1.4,1,0,3)],{cd:6}),v133U("解結封喉",[v133D(3),{op:"vuln",v:.20,t:4}])]},
  { k:"ro_acolyte_0", resource:"恩典", cap:3, cd:5, intent:"主動治療溢出、有效治療或聖光輪轉，三種恩典來源擇一。",
    feeds:[v133Q("overheal",{min:.02,cd:1}),v133Q("healed",{min:.03,cd:2}),v133Q("cast",{ids:["ac_light","ac_heal"],alternate:1,every:2,window:9})],feedNames:["溢光收存","療傷見證","光療輪轉"],finish:["ac_light","ac_sanct","ac_heal"],
    ults:[v133U("慈悲審判",[v133D(2.8,3,38)]),v133U("恩典護幕",[v133S(.20),v133H(.05)]),v133U("涓流祝福",[v133B("regen",.025,7),v133B("skill",.15,7)],{cd:7})]},
  { k:"ro_acolyte_2", resource:"祈禱階", cap:4, cd:5, intent:"穩定站位禱告讓儀式成熟；離開 4 距離的站位範圍會重算時間，但不刪除已獲得階數。",
    feeds:[v133Q("pulse",{cond:"still",every:2}),v133Q("cast",{ids:["ac_magnus","ac_orbs"],alternate:1,every:2,window:9}),v133Q("basic",{every:3,cond:"afterCast"})],feedNames:["定地禱告","珠陣禮序","聖言續誦"],finish:["ac_wrath","ac_magnus"],
    ults:[v133U("大聖堂",[v133D(.8,5,45,4),v133B("dr",.10,4)],{cd:7}),v133U("行走聖壇",[v133D(1.9,3,40),v133B("ms",.25,6)]),v133U("終禱降裁",[v133D(3.6,3,35)],{cd:6})]},
  { k:"ro_acolyte_1", resource:"拳序", cap:3, cd:4, intent:"普攻與連拳串接，將拳序轉成續拳、阿修羅或護體。",
    feeds:[v133Q("basic",{every:3,cond:"afterCombo"}),v133Q("cast",{ids:["ac_combo","ac_call"],alternate:1,every:2,window:7}),v133Q("sphSpend",{minCount:3,cd:2})],feedNames:["拳後三擊","呼吸連拳","收勢悟拳"],finish:["ac_combo","ac_asura"],
    ults:[v133U("不斷連環",[v133B("as",.28,5),v133N("sph",2)]),v133U("一拳終式",[v133D(4.2)],{cd:5}),v133U("金鐘收勢",[v133D(1.6),v133S(.16),v133B("dr",.12,4)])]},
  { k:"ro_acolyte_3", resource:"氣脈", cap:3, cd:4, intent:"大量消耗氣球打通氣脈，選擇集中爆發或回氣續戰。",
    feeds:[v133Q("sphSpend",{minCount:3,cd:1}),v133Q("cast",{ids:["ac_knuckle","ac_finger"],alternate:1,every:2,window:8}),v133Q("basic",{every:3,cond:"spheres"})],feedNames:["三氣貫脈","拳指通氣","含珠吐勁"],finish:["ac_rampage","ac_finger"],
    ults:[v133U("五氣朝元",[v133D(3.8,2,30)]),v133U("寸勁吐納",[v133D(1.5),v133N("sph",1)],{refund:1,cd:3}),v133U("回氣長息",[v133N("sph",3),v133B("dr",.18,5),v133H(.05)],{cd:6})]},
  { k:"ro_merchant_0", resource:"鍛打", cap:4, cd:4, intent:"普攻與錘擊鍛打，再以手推車或金錢攻擊收錘；不額外花錢。",
    feeds:[v133Q("basic",{every:2,cond:"near"}),v133Q("cast",{ids:["mc_hfall"],cd:2}),v133Q("hit",{cond:"controlled",every:3})],feedNames:["百鍛錘音","落錘淬鍊","破綻鍛接"],finish:["mc_term","mc_mammon"],
    ults:[v133U("千鈞落錘",[v133D(3.5,3,28)],{cd:5}),v133U("快錘連鍛",[v133B("as",.30,6),v133B("basic",.22,6)]),v133U("鍛甲回火",[v133D(1.8,2,26),v133S(.16)])]},
  { k:"ro_merchant_2", resource:"調壓齒", cap:3, cd:5, intent:"在中溫區間運轉或主動排熱，再以砲擊選擇穩態、過載或回收。",
    feeds:[v133Q("pulse",{cond:"heatBand",every:2}),v133Q("cast",{ids:["mc_faw","mc_axe"],alternate:1,every:2,window:8}),v133Q("heatVent",{cd:2})],feedNames:["恆溫齒輪","砲斧換檔","排熱回收"],finish:["mc_cannon","mc_axe"],
    ults:[v133U("恆溫機關",[v133B("skill",.28,7),v133N("cool",25)],{cd:7}),v133U("短時過載",[v133D(3,4,40),v133B("taken",.12,4)],{cd:7}),v133U("冷卻再生",[v133N("cool",50),v133S(.16),{op:"repair",v:.25}])]},
  { k:"ro_merchant_1", resource:"適應素", cap:3, cd:5, intent:"生命體存在時，酸液與火瓶交替使其適應；可改走長期培養。",
    feeds:[v133Q("cast",{ids:["mc_acidbomb","mc_firebomb"],alternate:1,every:2,window:9,cond:"summons"}),v133Q("pulse",{cond:"summons",every:3}),v133Q("hurt",{min:.01,cond:"summons",cd:1.5})],feedNames:["雙劑馴化","長期培養","共命催化"],finish:["mc_homun","mc_acidbomb","mc_firebomb"],
    ults:[v133U("巨型共生",[v133B("min",.45,7),{op:"repair",v:.25}],{cd:7}),v133U("共命外膜",[v133S(.18),v133B("min",.20,6)]),v133U("速效突變",[v133D(2,3,36),v133C("mc_homun",2)],{refund:1})]},
  { k:"ro_merchant_3", resource:"孢熟", cap:4, cd:5, intent:"維持毒雲或中毒目標，等孢熟後用孢子或植物採收。",
    feeds:[v133Q("cast",{ids:["mc_miasma"],cond:"poisoned",cd:2}),v133Q("pulse",{cond:"poisonNear",every:2}),v133Q("cast",{ids:["mc_plant","mc_spore"],alternate:1,every:2,window:9})],feedNames:["毒霧培床","毒域育成","播種採收"],finish:["mc_spore","mc_plant"],
    ults:[v133U("孢海擴散",[v133D(.65,6,58,4)],{cd:7}),v133U("熟株守成",[v133B("skill",.35,7),v133B("dr",.14,7)],{cd:7}),v133U("一次採淨",[v133D(3.2,3,32),v133H(.08)])]}
];

for(const p of V133_SPEC)for(const q of p.feeds)q.gain=q.distinct || q.distinctTarget || (q.alternate?2:1);
const V133_BY_KEY = Object.fromEntries(V133_SPEC.map(p => [p.k,p]));
const V133_COND = {
  near:"目標距離不超過 32", far:"目標距離至少 35", low70:"自身生命低於 70%", low50:"自身生命低於 50%",
  shield:"自身有護盾", controlled:"目標正受冰緩、暈眩或嘲諷", charmed:"目標正被魅惑", cursed:"目標帶暗影標記或詛咒",
  poisoned:"目標身上有毒層", still:"在 4 距離內穩定站位至少 2 秒", stillFar:"在 4 距離內穩定站位至少 2 秒且目標距離至少 35",
  moving:"正在移動", afterCast:"自己成功施放主動技能後 5 秒內", afterSong:"自己成功施放樂曲後 6 秒內",
  afterCombo:"自己成功施放連拳後 4 秒內", summons:"自身有存活的召喚物", spheres:"至少持有 3 顆氣球",
  heatBand:"機械熱量在 30～75", poisonNear:"60 距離內有中毒敵人", charmNear:"60 距離內有魅惑敵人",
  reserve:"至少持有 1 格分支資源", boss:"目標是 Boss", safe:"至少 4 秒未受生命傷害"
};
Object.assign(V133_COND,{
  crowded:"目標周圍 40 距離內至少有 3 名敵人",full2:"持續滿格至少 2 秒",far60:"目標距離至少 60",
  highHeat:"機械熱量至少 75",lowHeat:"機械熱量不超過 20",fullLife:"自身生命至少 80%",dying:"目標生命不超過 35%",
  hidden:"自己在 2 秒內以隱匿狀態成功發動技能",recentCrit:"自己在 2 秒內造成過直接暴擊",recentPay:"自己在 4 秒內以主動技能支付過生命",
  recentCP:"自己在 2 秒內一次消耗至少 3 連擊點",recentSph:"自己在 2 秒內一次消耗至少 3 氣球",
  recentHeal:"自己在 4 秒內以主動技能造成過有效治療",recentReaction:"自己在 3 秒內產生過元素反應"
});
// Different branches wager on different combat states; none requires manual input.
// [name, condition, power, optional incoming-damage penalty while condition holds]
const V133_RISK={
  ro_sword_0:[["近身接槍","near",1.20],["持盾換息","shield",1.25],["蓄律待發","full2",1.30]],
  ro_sword_2:[["背水決鬥","low50",1.40,.10],["殘血追斬","dying",1.30],["蓄怒待發","full2",1.30]],
  ro_sword_1:[["完整聖約","fullLife",1.20],["獻祭證明","recentPay",1.28],["持盾審判","shield",1.25]],
  ro_sword_3:[["盾在城在","shield",1.22],["圍陣不退","crowded",1.30],["靜壁重壓","still",1.28]],
  ro_bow_0:[["極距狙心","far60",1.30],["靜息扣弦","still",1.28],["臨終瞄線","dying",1.30]],
  ro_bow_1:[["歌後重拍","afterSong",1.20],["行進快板","moving",1.28],["暴擊重音","recentCrit",1.25]],
  ro_bow_2:[["困獸引爆","controlled",1.28],["密陣引爆","crowded",1.30],["安全引信","safe",1.24]],
  ro_bow_3:[["延長謝幕","full2",1.32],["伴奏齊鳴","summons",1.22],["無傷演奏","safe",1.25]],
  ro_bow_4:[["契印回眸","charmed",1.25],["聚光群舞","crowded",1.30],["最後邀舞","dying",1.30]],
  ro_bow_5:[["貼身鞭旋","near",1.25],["遠距甩尾","far",1.25],["走位謝幕","moving",1.28]],
  ro_mage_0:[["反應餘溫","recentReaction",1.24],["元素密度","crowded",1.30],["安全實驗","safe",1.24]],
  ro_mage_1:[["靈伴在場","summons",1.22],["靜心合靈","still",1.28],["晶壁合靈","shield",1.25]],
  ro_mage_2:[["定地禁典","still",1.30],["群星祭品","crowded",1.30],["虛弱強讀","low70",1.28]],
  ro_mage_3:[["精準覆寫","recentCrit",1.25],["隔空默誦","far",1.25],["無傷記憶","safe",1.24]],
  ro_thief_0:[["毒口撕裂","poisoned",1.23],["瀕死深切","dying",1.32],["銳刃追切","recentCrit",1.25]],
  ro_thief_1:[["藏影結帳","hidden",1.35],["得手追逐","moving",1.28],["無傷竊襲","safe",1.25]],
  ro_thief_2:[["三點收式","recentCP",1.28],["最後殺式","dying",1.30],["留式待機","full2",1.32]],
  ro_thief_3:[["咒印回流","cursed",1.23],["群影索命","crowded",1.30],["遠咒追債","far",1.25]],
  ro_acolyte_0:[["滿心慈悲","fullLife",1.20],["療後聖裁","recentHeal",1.28],["恩盾同行","shield",1.25]],
  ro_acolyte_2:[["定壇誓言","still",1.28],["群禱聖域","crowded",1.30],["寧靜禮拜","safe",1.25]],
  ro_acolyte_1:[["拳距掌握","near",1.20],["連掌餘勢","afterCombo",1.25],["留珠含勁","spheres",1.30]],
  ro_acolyte_3:[["散氣爆鳴","recentSph",1.28],["逆血吐勁","low70",1.28],["蓄脈長吐","full2",1.32]],
  ro_merchant_0:[["群敵重鍛","crowded",1.30],["暈鐵再敲","controlled",1.28],["貼身作業","near",1.20]],
  ro_merchant_1:[["共生在場","summons",1.22],["健康樣本","fullLife",1.20],["無傷培養","safe",1.25]],
  ro_merchant_2:[["中溫精度","heatBand",1.25],["高熱超頻","highHeat",1.35],["冷機脈衝","lowHeat",1.25]],
  ro_merchant_3:[["毒床採收","poisoned",1.23],["群落採收","crowded",1.30],["靜置熟成","still",1.28]]
};
const v133SkillName = id => (typeof roSkName === "function" ? roSkName(id) : SKILLS[id]?.n) || id;
const v133Pct = v => +(v*100).toFixed(2)+"%";
function v133RuleText(q) {
  const ev = {cast:"成功施放主動技能",basic:"普攻命中",hit:"直接命中",hurt:"實際受到生命傷害",absorb:"護盾實際吸收傷害",payment:"主動技能實際支付生命",reaction:"產生元素反應",cpSpend:"終結技實際消耗連擊點",sphSpend:"實際消耗氣球",overheal:"主動技能治療產生溢補",healed:"主動技能造成有效治療",dodge:"成功閃避",pulse:"每秒檢查一次",cycle:"分支資源完成釋放",heatVent:"原有機械過熱爆發",killOrBoss:"親自擊殺，或對同一 Boss 累積 8 次直接命中"};
  const parts=[q.ids?.length ? `成功${q.ev === "cast" ? "施放" : "命中"}「${q.ids.map(v133SkillName).join("／") }」` : ev[q.ev]];
  if(q.cond) parts.push(V133_COND[q.cond]);
  if(q.crit) parts.push("必須暴擊");
  if(q.min) parts.push(`單次數值至少為最大生命的 ${v133Pct(q.min)}`);
  if(q.minCount) parts.push(`單次至少消耗 ${q.minCount} 個`);
  if(q.same) parts.push("連續同一目標，換目標重算");
  if(q.alternate) parts.push(q.dragon?"相鄰兩次必須在槍技（保齡球擊／騎乘攻擊）與龍息之間交替，同類重算":"相鄰兩次必須是不同技能，同招重算");
  if(q.distinct) parts.push(`湊齊 ${q.distinct} 種不同${q.ev === "reaction" ? "反應" : "技能"}`);
  if(q.distinctTarget) parts.push(`命中 ${q.distinctTarget} 個不同目標`);
  if(q.every > 1) parts.push(`每 ${q.every} 次符合條件觸發一次`);
  if(q.window) parts.push(`計數須在 ${q.window} 秒內完成，逾時重算`);
  parts.push(`內置冷卻 ${q.cd} 秒`);
  return parts.filter(Boolean).join("；");
}
function v133ActionText(a) {
  if(a.op === "strike") return `追加 ${a.pulses} 段、每段 ${v133Pct(a.v)} 武器傷害${a.n > 1 ? `，目標周圍 ${a.r} 距離內最多 ${a.n} 名敵人` : "，單一目標"}${a.pulses > 1 ? "，段間隔 1 秒" : ""}`;
  if(a.op === "buff") return `${({damage:"造成傷害增加",basic:"普攻傷害增加",skill:"技能傷害增加",min:"召喚物傷害增加",dr:"受到傷害減少",taken:"受到傷害增加",as:"攻速增加",ms:"移速增加",regen:"每秒回復最大生命"})[a.stat]} ${v133Pct(a.v)}，持續 ${a.t} 秒`;
  if(a.op === "heal") return `回復 ${v133Pct(a.v)} 最大生命（受原有治療倍率影響）`;
  if(a.op === "shield") return `獲得 ${v133Pct(a.v)} 最大生命護盾（本系統新增護盾上限 25%，不削減既有較大護盾）`;
  if(a.op === "cooldown") return `${a.id === "all" ? "所有已裝備主動技能" : "「"+v133SkillName(a.id)+"」"}剩餘冷卻減少 ${a.v} 秒，最低 0`;
  if(a.op === "native") return ({cp:`回復 ${a.v} 連擊點`,sph:`回復 ${a.v} 氣球`,limit:`增加 ${a.v} 極限槽`,cool:`排除 ${a.v} 熱量（最低 0，不觸發排熱來源）`})[a.kind]+"，遵守原有上限";
  if(a.op === "repair") return `回復自身存活召喚物 ${v133Pct(a.v)} 最大生命（無生命欄位者略過）`;
  if(a.op === "stun") return `目標周圍 ${a.r} 距離內最多 ${a.n} 名敵人暈眩 ${a.v} 秒（沿用 Boss 抗性）`;
  if(a.op === "vuln") return `目前目標受到自己的直接傷害增加 ${v133Pct(a.v)}，持續 ${a.t} 秒（不分享給隊友）`;
  throw Error("Unknown v133 action: "+a.op);
}
const v133ActionsText = a => a.map(v133ActionText).join("；");
function v133CoreText(p) {
  const extra=p.k==="ro_sword_3"?"成功施放挑釁時，先獲得 10% 最大生命護盾（冷卻 8 秒，新增上限 25%），供盾壓起步。":"";
  return `${p.intent}【${p.resource}】上限 ${p.cap} 格；${v133RuleText(p.feeds[0])}時 +${p.feeds[0].gain} 格。滿格後成功施放「${p.finish.map(v133SkillName).join("／") }」消耗全部，追加單體 180% 武器傷害；釋放冷卻 ${p.cd} 秒。${extra}第一、二、四、八排可改寫此循環；未選奧義仍可運作。`;
}
function v133BuildRows(p,b) {
  const cls=p.k.split("_")[1], acts=b.core.A, N=p.resource, si=V133_SPEC.indexOf(p);
  const make=(row,col,n,d,v) => ({k:`${p.k}_v133_${row}_${col}`,n,d,e:{v133Choice:1},v133:v,src:null});
  const rows=[];
  rows[0]=p.feeds.map((base,i)=>{const q={...base,gain:base.gain+(i===0?1:0)};return make(0,i,p.feedNames[i],`資源來源改為：${v133RuleText(q)}時，獲得 ${q.gain} 格${N}。${i===0?"比免費來源每次多 1 格。":""}取代免費來源；不與其他來源並存。`,{kind:"feed",q});});
  rows[1]=[
    make(1,0,`${N}・完整收束`,`持有上限格數，成功施放「${p.finish.map(v133SkillName).join("／")}」時消耗全部；釋放效能 ×1.15。維持基本冷卻 ${p.cd} 秒。`,{kind:"release",mode:0}),
    make(1,1,`${N}・半蓄快放`,`持有至少上限一半（向上取整）即可由相同收束技能消耗全部；釋放效能 ×0.60；基本釋放冷卻減少 1 秒、最低 2 秒。`,{kind:"release",mode:1}),
    make(1,2,`${N}・普攻接手`,`持有上限格數後，每第 3 次普攻命中消耗全部；收束技能不再觸發釋放。釋放效能 ×1.05；基本釋放冷卻增加 1 秒。`,{kind:"release",mode:2})
  ];
  // 聯動只認成功施放，不認投射物數量、持續地板或額外施法。
  const links={
    sword:[[v133B("basic",.18,4)],[v133S(.07)],[v133N("limit",7)]],
    bow:[[v133B("ms",.18,4)],[v133B("basic",.20,4)],[v133C(acts[0],.8)]],
    mage:[[v133B("skill",.16,4)],[v133S(.07)],[v133C(acts[0],.8)]],
    thief:[[v133N("cp",1)],[v133B("ms",.20,4)],[v133B("basic",.20,4)]],
    acolyte:[[v133N("sph",1)],[v133B("dr",.10,4)],[v133S(.08)]],
    merchant:[[v133B("basic",.18,4)],[v133N("cool",12)],[v133B("skill",.20,4)]]
  }[cls];
  const linkOverrides={
    ro_merchant_0:[[v133B("basic",.18,4)],[v133B("dr",.10,4)],[v133C("mc_hfall",.8)]],
    ro_merchant_1:[[v133B("min",.18,4)],[{op:"repair",v:.12}],[v133B("skill",.16,4)]],
    ro_merchant_2:[[v133B("min",.18,4)],[v133N("cool",12)],[v133C("mc_cannon",.8)]],
    ro_merchant_3:[[v133B("skill",.18,4)],[v133S(.07)],[v133C("mc_miasma",.8)]],
    ro_thief_0:[[v133B("basic",.18,4)],[v133S(.07)],[v133B("ms",.20,4)]],
    ro_thief_1:[[v133C("th_backstab",.8)],[v133B("ms",.20,4)],[v133S(.08)]],
    ro_thief_3:[[{op:"vuln",v:.10,t:4}],[v133B("dr",.10,4)],[v133C("th_mark",.8)]],
    ro_acolyte_0:[[v133C("ac_heal",.8)],[v133B("dr",.10,4)],[v133S(.08)]],
    ro_acolyte_2:[[v133C("ac_wrath",.8)],[v133B("dr",.10,4)],[v133S(.08)]]
  }[p.k];
  if(linkOverrides)links.splice(0,3,...linkOverrides);
  rows[2]=acts.slice(0,3).map((id,i)=>{const q=v133Q("cast",{ids:[id],cond:"reserve",cd:7+i});return make(2,i,`${N}・${v133SkillName(id)}・${["前奏","承接","餘勢"][i]}`,`${v133RuleText(q)}：${v133ActionsText(links[i])}。`,{kind:"rule",q,acts:links[i]});});
  rows[3]=[
    make(3,0,`${N}・深庫`,`${N}上限 +2 格；所有釋放效能 ×1.30；需要更多來源觸發才能滿蓄。`,{kind:"economy",mode:0}),
    make(3,1,`${N}・回存`,`每次釋放後保留 1 格${N}；釋放效能 ×0.85。和奧義保留相加，但最多保留上限減 1 格。`,{kind:"economy",mode:1}),
    make(3,2,`${N}・快轉`,`釋放冷卻減少 1.5 秒，最低 2 秒；釋放效能 ×0.80。來源條件、資源上限與消耗格數不變。`,{kind:"economy",mode:2})
  ];
  const defense={
    sword:[[v133Q("absorb",{min:.01,cd:8}),[v133H(.05)]],[v133Q("hurt",{cond:"low50",cd:12}),[v133S(.13)]],[v133Q("cast",{ids:[acts[2]],cd:9}),[v133B("dr",.14,3)]]],
    bow:[[v133Q("pulse",{cond:"moving",every:2,cd:10}),[v133S(.08)]],[v133Q("hurt",{cd:10}),[v133B("ms",.30,3),v133B("dr",.10,3)]],[v133Q("cycle",{cd:8}),[v133H(.07)]]],
    mage:[[v133Q("reaction",{cd:9}),[v133S(.09)]],[v133Q("cast",{ids:[acts[1]],cd:8}),[v133B("dr",.13,3)]],[v133Q("hit",{cond:"low50",cd:10}),[v133H(.07)]]],
    thief:[[v133Q("dodge",{cd:8}),[v133H(.06)]],[v133Q("cast",{ids:[acts[2]],cd:10}),[v133S(.09)]],[v133Q("hit",{crit:1,cond:"low70",cd:9}),[v133B("dr",.16,3)]]],
    acolyte:[[v133Q("overheal",{min:.02,cd:9}),[v133S(.10)]],[v133Q("sphSpend",{minCount:2,cd:8}),[v133H(.07)]],[v133Q("cast",{ids:[acts[0]],cd:9}),[v133B("dr",.14,3)]]],
    merchant:[[v133Q("pulse",{cond:"summons",every:3,cd:10}),[{op:"repair",v:.15},v133S(.05)]],[v133Q("hurt",{cond:"low70",cd:10}),[v133S(.11)]],[v133Q("cycle",{cd:9}),[v133H(.08)]]]
  }[cls];
  if(p.k==="ro_merchant_0")defense[0]=[v133Q("hit",{ids:["mc_hfall"],cd:9}),[v133H(.05)]];
  if(p.k==="ro_merchant_3")defense[0]=[v133Q("pulse",{cond:"poisonNear",every:3,cd:10}),[v133S(.06),v133B("dr",.08,3)]];
  if(p.k==="ro_acolyte_0")defense[1]=[v133Q("healed",{min:.03,cd:8}),[v133B("dr",.14,4)]];
  if(p.k==="ro_acolyte_2") {defense[0]=[v133Q("pulse",{cond:"still",every:3,cd:9}),[v133S(.08)]];defense[1]=[v133Q("cast",{ids:["ac_orbs"],cd:8}),[v133H(.06)]];}
  if(p.k==="ro_acolyte_1")defense[0]=[v133Q("sphSpend",{minCount:2,cd:9}),[v133S(.09)]];
  if(p.k==="ro_acolyte_3")defense[0]=[v133Q("sphSpend",{minCount:3,cd:9}),[v133S(.10)]];
  const dn={sword:["承擊回氣","破陣護心","收刃護勢"],bow:["移步掩護","受創脫身","奏畢調息"],mage:["反應晶壁","施法屏障","危境汲光"],thief:["閃身喘息","影步護衣","危血藏鋒"],acolyte:["溢光成盾","散氣療身","禱式護體"],merchant:["工坊維護","應急甲片","交貨回補"]}[cls];
  if(p.k==="ro_merchant_0")dn[0]="回鍛療身";
  if(p.k==="ro_merchant_3")dn[0]="毒域外膜";
  if(p.k==="ro_acolyte_0")dn[1]="療傷守誓";
  if(p.k==="ro_acolyte_2"){dn[0]="淨地護幕";dn[1]="禱珠回息";}
  if(p.k==="ro_acolyte_1" || p.k==="ro_acolyte_3")dn[0]="散氣護體";
  rows[4]=defense.map(([q,a],i)=>make(4,i,`${N}・${dn[i]}`,`${v133RuleText(q)}：${v133ActionsText(a)}。`,{kind:"rule",q,acts:a}));
  const native=({ro_thief_0:v133B("as",.16,4),ro_thief_1:v133C("th_backstab",1.2),ro_thief_3:{op:"vuln",v:.08,t:4},
    ro_acolyte_0:v133C("ac_heal",1.2),ro_acolyte_2:v133C("ac_wrath",1.2),ro_merchant_0:v133C("mc_hfall",1.2),
    ro_merchant_1:{op:"repair",v:.15},ro_merchant_3:v133C("mc_miasma",1.2)})[p.k] ||
    {sword:v133N("limit",10),bow:v133B("as",.16,4),mage:v133C(acts[1],1.2),thief:v133N("cp",1),acolyte:v133N("sph",1),merchant:v133N("cool",18)}[cls];
  const utility=[
    ["循環接續",v133Q("cycle",{cd:6}),[native]],
    ["轉場步調",v133Q("cast",{ids:[acts[si%3]],cd:8}),[v133B("ms",.24,4)]],
    ["追獵復拍",v133Q("killOrBoss",{cd:6}),[v133C("all",.7)]]
  ];
  rows[5]=utility.map(([n,q,a],i)=>make(5,i,`${N}・${n}`,`${v133RuleText(q)}：${v133ActionsText(a)}。`,{kind:"rule",q,acts:a}));
  rows[6]=V133_RISK[p.k].map(([n,cond,power,penalty],i)=>make(6,i,n,`釋放當下${V133_COND[cond]}：本次釋放效能 ×${power.toFixed(2)}。${penalty?`符合此條件期間受到傷害增加 ${v133Pct(penalty)}。`:"未達條件時仍正常釋放，但沒有本項倍率。"}`,{kind:"risk",mode:i,cond,power,penalty:penalty||0}));
  rows[7]=p.ults.map((u,i)=>make(7,i,u.n,`取代免費釋放效果：${v133ActionsText(u.acts)}。${u.cd?`基本釋放冷卻改為 ${u.cd} 秒；`:""}${u.refund?`釋放後保留 ${u.refund} 格${N}（最多上限減 1）；`:""}仍依第二排消耗條件；第二、四、七排倍率同時影響此處傷害與正面效果數值，仍遵守共通上限；不放大負面代價、持續時間或保留格數。`,{kind:"ultimate",u}));
  return rows;
}

function v133Migrate(st) {
  if(!st?.tal) return false;
  let refund=false;
  const clean = page => {
    if(!page || !Array.isArray(page.p)) return;
    const p=V133_BY_KEY[page.asc];
    if(!p) return;
    const b=Object.values(ASC).flat().find(b=>b.k===page.asc);
    const keys=new Set(b.t.flat().map(t=>t.k));
    if(page.p.some(k=>!keys.has(k))) { page.p=[];refund=true;return; }
    // Imported builds cannot equip two columns in a row or skip prerequisite rows.
    const normalized=[];
    for(const row of b.t) {const t=row.find(t=>page.p.includes(t.k));if(!t)break;normalized.push(t.k);}
    page.p=normalized;
  };
  clean(st.tal);
  if(st.bld && typeof st.bld === "object") Object.values(st.bld).forEach(clean);
  st.tal.v133=1;
  if(refund) st.tal.v133Refund=1;
  return refund;
}
function v133State() {
  if(!S?.tal || !G?.pl || !PS || G.dead || !PS.T?.v133 || (typeof v63Pending === "function" && v63Pending())) return null;
  const p=V133_BY_KEY[S.tal.asc];if(!p) return null;
  const sig=S.tal.asc+":"+(S.tal.p || []).join(",");
  let s=G.pl.v133;
  if(!s || s.sig!==sig) {
    const b=Object.values(ASC).flat().find(b=>b.k===p.k);
    const selected=b.t.map(row=>row.find(t=>S.tal.p.includes(t.k)));
    s=G.pl.v133={sig,p,selected,cols:selected.map(t=>t?t.v133:null),energy:0,counters:{},buffs:{},queue:[],vuln:new WeakMap(),depth:0,
      lastHurt:G.t,lastCast:-Infinity,lastSong:-Infinity,lastCombo:-Infinity,still:0,x:G.pl.x,y:G.pl.y,pulse:0,next:0,fullAt:null,
      casts:[],eligible:{},damageStack:[],stats:{gain:0,cycles:0,procHits:0,rules:0},lastCombat:G.t};
  }
  return s;
}
const v133Cap = s => s.p.cap+(s.cols[3]?.mode===0?2:0);
const v133Targets = () => (G?.mobs || []).filter(m=>alive(m) && !(m.spawnT>0));
const v133Target = e => alive(e?.m)?e.m:alive(G.pl.tgt)?G.pl.tgt:v133Targets().sort((a,b)=>dist(a,G.pl)-dist(b,G.pl))[0];
const v133Summons = () => [...(G.mins||[]),...(G.gsp||[]),...(G.turs||[])].filter(m=>m.hp==null || m.hp>0);
function v133Condition(k,e,s) {
  if(!k)return true;
  const m=e.m || v133Target(e), d=m?dist(m,G.pl):Infinity;
  const poisoned=m=>m?.psn?.s?.some(x=>x.t>0);
  switch(k) {
    case "near":return d<=32;
    case "far":return d>=35 && d<Infinity;
    case "low70":return S.hp<PS.maxhp*.7;
    case "low50":return S.hp<PS.maxhp*.5;
    case "shield":return G.pl.shd>0;
    case "controlled":return !!m && (m.slow>0 || m.v6stun>G.t || m.tnt>0 || m.root>0);
    case "charmed":return m?.v123ch>G.t;
    case "cursed":return !!m && (m.v6mark>G.t || Object.values(m.crs||{}).some(x=>x>0));
    case "poisoned":return !!poisoned(m);
    case "still":return s.still>=2;
    case "stillFar":return s.still>=2 && d>=35 && d<Infinity;
    case "moving":return !!G.pl.moving;
    case "afterCast":return G.t-s.lastCast<=5;
    case "afterSong":return G.t-s.lastSong<=6;
    case "afterCombo":return G.t-s.lastCombo<=4;
    case "summons":return v133Summons().length>0;
    case "spheres":return (G.v6?.sph||0)>=3;
    case "heatBand":return G.v6?.heat>=30 && G.v6.heat<=75;
    case "poisonNear":return v133Targets().some(m=>dist(m,G.pl)<=60 && poisoned(m));
    case "charmNear":return v133Targets().some(m=>dist(m,G.pl)<=60 && m.v123ch>G.t);
    case "reserve":return s.energy>=1;
    case "boss":return !!m?.boss;
    case "safe":return G.t-s.lastHurt>=4;
    case "crowded":return !!m && v133Targets().filter(t=>dist(t,m)<=40).length>=3;
    case "full2":return s.fullAt!=null && s.energy>=v133Cap(s) && G.t-s.fullAt>=2;
    case "far60":return d>=60 && d<Infinity;
    case "highHeat":return (G.v6?.heat||0)>=75;
    case "lowHeat":return (G.v6?.heat||0)<=20;
    case "fullLife":return S.hp>=PS.maxhp*.8;
    case "dying":return !!m && m.hp<=m.max*.35;
    case "hidden":return G.t-(s.lastHidden??-Infinity)<=2;
    case "recentCrit":return G.t-(s.lastCrit??-Infinity)<=2;
    case "recentPay":return G.t-(s.lastPay??-Infinity)<=4;
    case "recentCP":return G.t-(s.lastCP??-Infinity)<=2;
    case "recentSph":return G.t-(s.lastSph??-Infinity)<=2;
    case "recentHeal":return G.t-(s.lastHeal??-Infinity)<=4;
    case "recentReaction":return G.t-(s.lastReaction??-Infinity)<=3;
  }
  return false;
}
function v133Match(q,e,s,key,source=false) {
  if(q.ev === "killOrBoss") {
    if(e.ev !== "kill" && !(e.ev === "hit" && e.m?.boss))return false;
  } else if(q.ev!==e.ev)return false;
  const c=s.counters[key] ||= {n:0,at:-Infinity,start:G.t,next:0,seen:new Set()};
  if((q.same || (q.ev==="killOrBoss" && e.ev==="hit")) && c.target!==e.m) {c.n=0;c.seen.clear();c.start=G.t;}
  c.target=e.m;
  if(q.ids && !q.ids.includes(e.id))return false;
  if(q.crit && !e.crit)return false;
  if(q.min && !(e.amount>=PS.maxhp*q.min))return false;
  if(q.minCount && !(e.count>=q.minCount))return false;
  if(!v133Condition(q.cond,e,s))return false;
  if(G.t<c.next)return false;
  if(q.window && G.t-c.start>q.window) {c.n=0;c.seen.clear();c.last=null;}
  const identity=q.ev==="reaction"?e.reaction:q.dragon?(e.id==="sw_breath"?"dragon":"spear"):e.id;
  if(q.alternate && c.last===identity)c.n=0;
  if(!c.n && !c.seen.size)c.start=G.t;
  c.last=identity;c.at=G.t;
  if(q.distinct || q.distinctTarget) {
    c.seen.add(q.distinctTarget?e.m:identity);
    if(c.seen.size<(q.distinctTarget||q.distinct))return false;
  }
  c.n++;
  const count=q.ev==="killOrBoss" && e.ev==="hit" ? 8 : (q.every||1);
  if(c.n<count)return false;
  c.n=0;c.seen.clear();
  c.next=G.t+Math.max(.3,q.cd);
  return true;
}
function v133Gain(s,n) {
  const old=s.energy;s.energy=clamp(s.energy+n,0,v133Cap(s));
  s.stats.gain+=s.energy-old;
  if(s.energy>=v133Cap(s) && s.fullAt==null)s.fullAt=G.t;
  if(s.energy<v133Cap(s))s.fullAt=null;
}
function v133Buff(s,key,stat,v,t) {
  // Refreshes the same talent; different sources add up to the documented cap.
  s.buffs[key+":"+stat]={stat,v,until:G.t+t};
}
function v133BuffValue(s,stat) {
  if(!s)return 0;
  return Object.values(s.buffs).reduce((v,b)=>v+(b.stat===stat && b.until>G.t?b.v:0),0);
}
function v133Strike(s,a,e,power) {
  const target=v133Target(e);if(!target)return;
  const targets=a.n===1?[target]:v133Targets().filter(m=>dist(m,target)<=a.r).sort((x,y)=>(x===target?-1:y===target?1:dist(x,target)-dist(y,target))).slice(0,a.n);
  s.depth++;
  try {
    for(const m of targets)if(alive(m)) {
      hitMob(m,a.v*power,{skill:1,v6r:1,v133Proc:1,nomom:1,ncrit:1,kb:0,v6sk:"v133:"+s.p.k});
      s.stats.procHits++;
    }
  } finally {s.depth--;}
}
function v133Apply(s,acts,e,key,power=1) {
  s.depth++;
  try { for(const base of acts) {
    const a={...base};
    if(a.op!=="strike" && !(a.op==="buff" && a.stat==="taken")) {
      a.v*=power;
      if(a.op==="native" && ["cp","sph"].includes(a.kind))a.v=Math.max(1,Math.floor(a.v));
      if(a.op==="heal")a.v=Math.min(.25,a.v);
      if(a.op==="repair")a.v=Math.min(.40,a.v);
      if(a.op==="vuln")a.v=Math.min(.25,a.v);
      if(a.op==="cooldown")a.v=Math.min(3,a.v);
      if(a.op==="stun")a.v=Math.min(1.5,a.v);
    }
    if(a.op==="strike") {
      v133Strike(s,a,e,power);
      for(let i=1;i<a.pulses;i++)s.queue.push({at:G.t+i,a:{...a,pulses:1},e:{m:e.m},power});
    } else if(a.op==="buff")v133Buff(s,key,a.stat,a.v,a.t);
    else if(a.op==="heal")heal(PS.maxhp*a.v);
    else if(a.op==="shield")G.pl.shd=Math.max(G.pl.shd||0,Math.min(PS.maxhp*.25,(G.pl.shd||0)+PS.maxhp*a.v));
    else if(a.op==="cooldown")for(const g of activeGems())if(a.id==="all" || g.id===a.id)G.pl.cds[g.u]=Math.max(0,(G.pl.cds[g.u]||0)-a.v);
    else if(a.op==="native") {
      if(a.kind==="cp")v6CpAdd(a.v);
      else if(a.kind==="sph")v6SphAdd(a.v);
      else if(a.kind==="limit")v6LimAdd(a.v);
      else if(a.kind==="cool")v6G().heat=Math.max(0,(v6G().heat||0)-a.v);
    } else if(a.op==="repair")for(const m of v133Summons()) {
      const max=m.max || m.maxhp;
      if(Number.isFinite(m.hp) && Number.isFinite(max) && max>0)m.hp=Math.min(max,m.hp+max*a.v);
    } else if(a.op==="vuln") {const m=v133Target(e);if(m){const marks=s.vuln.get(m)||{};marks[key]={v:a.v,until:G.t+a.t};s.vuln.set(m,marks);}}
    else if(a.op==="stun") {const m=v133Target(e);if(m)for(const t of v133Targets().filter(t=>dist(t,m)<=a.r).slice(0,a.n))v6Stun(t,a.v);}
  }} finally {s.depth--;}
}
function v133Release(s,e) {
  const cap=v133Cap(s), mode=s.cols[1]?.mode??0, threshold=mode===1?Math.ceil(cap/2):cap;
  if(s.energy<threshold || G.t<s.next)return;
  if(mode===2) {
    if(!v133Match(v133Q("basic",{every:3,cd:.3}),e,s,"release"))return;
  } else if(e.ev!=="cast" || !s.p.finish.includes(e.id))return;
  let power=s.cols[1]?[1.15,.60,1.05][mode]:1;
  if(s.cols[3])power*=[1.3,.85,.8][s.cols[3].mode];
  const risk=s.cols[6];
  if(risk && v133Condition(risk.cond,e,s))power*=risk.power;
  const u=s.cols[7]?.u;
  const cd=Math.max(2,(u?.cd||s.p.cd)+(mode===1?-1:mode===2?1:0)-(s.cols[3]?.mode===2?1.5:0));
  // Commit cost and cooldown before any hit/heal. Recursion cannot spend twice.
  s.energy=Math.min(cap-1,(s.cols[3]?.mode===1?1:0)+(u?.refund||0));
  s.fullAt=null;s.next=G.t+cd;s.stats.cycles++;
  num(G.pl.x,G.pl.y-35,u?.n || s.p.resource+"釋放","#a5e7ff");
  v133Apply(s,u?.acts || [v133D(1.8)],e,"core",power);
  v133Emit({ev:"cycle",m:e.m});
}
function v133Emit(e) {
  const s=v133State();if(!s || s.depth)return;
  if(!v133Targets().some(m=>dist(m,G.pl)<180) && e.ev!=="kill")return;
  s.lastCombat=G.t;
  if(e.ev==="hit" && e.crit)s.lastCrit=G.t;
  if(e.ev==="payment" && e.amount>0)s.lastPay=G.t;
  if(e.ev==="cpSpend" && e.count>=3)s.lastCP=G.t;
  if(e.ev==="sphSpend" && e.count>=3)s.lastSph=G.t;
  if(e.ev==="healed" && e.amount>0)s.lastHeal=G.t;
  if(e.ev==="reaction")s.lastReaction=G.t;
  if(e.ev==="cast") {
    s.lastCast=G.t;
    if(["bw_song","bw_disso","bw_bsong"].includes(e.id))s.lastSong=G.t;
    if(e.id==="ac_combo")s.lastCombo=G.t;
    if(s.p.k==="ro_sword_3" && e.id==="sw_provoke" && G.t>=(s.guardAt||0)) {
      s.guardAt=G.t+8;v133Apply(s,[v133S(.10)],e,"ironStart");
    }
  }
  if(e.ev==="hurt" && e.amount>0)s.lastHurt=G.t;
  const feed=s.cols[0]?.q || s.p.feeds[0];
  if(v133Match(feed,e,s,"source",true))v133Gain(s,feed.gain);
  for(const row of [2,4,5]) {
    const rule=s.cols[row];
    if(rule && v133Match(rule.q,e,s,"row"+row)) {v133Apply(s,rule.acts,e,"row"+row);s.stats.rules++;}
  }
  v133Release(s,e);
}
function v133Tick(dt) {
  const s=v133State();if(!s || !(dt>0))return;
  if(Math.hypot(G.pl.x-s.x,G.pl.y-s.y)>4) {s.still=0;s.x=G.pl.x;s.y=G.pl.y;}else s.still+=dt;
  for(const key of Object.keys(s.buffs))if(s.buffs[key].until<=G.t)delete s.buffs[key];
  for(let i=s.queue.length-1;i>=0;i--)if(s.queue[i].at<=G.t) {
    const q=s.queue.splice(i,1)[0];
    // Multi-hit echoes keep their original target; its death cancels remaining hits.
    if(alive(q.e.m))v133Strike(s,q.a,q.e,q.power);
  }
  if(v133Targets().some(m=>dist(m,G.pl)<180))s.lastCombat=G.t;
  if(G.t-s.lastCombat>8) {s.energy=0;s.fullAt=null;s.counters={};s.queue=[];s.buffs={};}
  s.pulse+=dt;
  if(s.pulse>=1) {
    s.pulse%=1;
    const regen=Math.min(.04,v133BuffValue(s,"regen"));
    if(regen>0) {s.depth++;try{heal(PS.maxhp*regen);}finally{s.depth--;}}
    v133Emit({ev:"pulse",m:v133Target()});
  }
}

function v133Install() {
  if(v133Install.done)return;v133Install.done=true;
  for(const p of V133_SPEC) {
    const b=Object.values(ASC).flat().find(b=>b.k===p.k);
    if(!b || b.core.A.length<3)throw Error("Missing branch: "+p.k);
    b.t=v133BuildRows(p,b);
    b.trait={n:p.resource,d:v133CoreText(p),e:{v133:1}};
    b.d=p.intent;
  }
  const rc=recalc;
  recalc=function(...a) {v133Migrate(S);return rc.apply(this,a);};
  const dead=die;
  die=function(...a) {const r=dead.apply(this,a);if(G.dead && G.pl)delete G.pl.v133;return r;};
  const fr=fire;
  fire=function(type,...a) {
    const s=v133State(), pending=s?.damageStack.at(-1);
    // Capture absorption before any hurt talent can add a replacement shield.
    const absorb=type==="hurt" && pending?Math.max(0,pending.shield-(G.pl.shd||0)):0;
    const result=fr.call(this,type,...a);
    if(!s || s.depth)return result;
    if(type==="tick")v133Tick(a[0]);
    else if(type==="hit") {
      const [m,damage,crit,o]=a;
      const context=typeof roFxContext!=="undefined"?roFxContext?.id:null;
      const id=o?.v6sk || (context && (CLASS[S.cls]?.gems.find(id=>id===context || SKILLS[id]?.roBase===context) || context));
      if(!o?.v133Proc && !o?.v6r && !o?.min && !o?.refl)v133Emit({ev:"hit",m,amount:damage,crit,id});
    } else if(type==="basicHit")v133Emit({ev:"basic",m:a[0]});
    else if(type==="cast") {
      const g=a[0], own=g && s.eligible[g.u];
      if(own?.t===G.t && own.ok)v133Emit({ev:"cast",id:g.id,m:v133Target()});
    } else if(type==="hurt") {
      if(a[1]>0)v133Emit({ev:"hurt",amount:a[1],m:pending?.source});
      if(absorb>0)v133Emit({ev:"absorb",amount:absorb,m:pending?.source});
    } else if(type==="dodge")v133Emit({ev:"dodge",m:pending?.source});
    else if(type==="kill")v133Emit({ev:"kill",m:a[0]});
    return result;
  };
  const cast=castSkill;
  castSkill=function(g,a=1,...rest) {
    const s=v133State();if(!s)return cast.call(this,g,a,...rest);
    const eligible=a>=1 && !G.v6?.inExtra && !s.depth && !s.casts.length;
    const before=S.hp, frame={eligible,id:g.id,hidden:(G.v6?.buf?.hide||0)>G.t};s.casts.push(frame);
    let result;
    try {result=cast.call(this,g,a,...rest);}
    finally {s.casts.pop();}
    s.eligible[g.u]={t:G.t,ok:!!result && eligible};
    if(result && eligible && frame.hidden)s.lastHidden=G.t;
    if(result && eligible && S.hp<before)v133Emit({ev:"payment",id:g.id,amount:before-S.hp,m:v133Target()});
    return result;
  };
  const hp=heal;
  heal=function(amount,...a) {
    const s=v133State(), frame=s?.casts.at(-1), before=S?.hp;
    const effective=PS?amount*slHealMul():0;
    const overflow=PS?Math.max(0,effective-Math.max(0,hpCap()-before)):0;
    const r=hp.call(this,amount,...a);
    if(s && !s.depth && frame?.eligible) {
      if(S.hp>before)v133Emit({ev:"healed",id:frame.id,amount:S.hp-before});
      if(overflow>0)v133Emit({ev:"overheal",id:frame.id,amount:overflow});
    }
    return r;
  };
  const hurt=damagePlayer;
  damagePlayer=function(amount,x,y,source,...a) {
    const s=v133State();if(!s)return hurt.call(this,amount,x,y,source,...a);
    s.damageStack.push({shield:G.pl.shd||0,source});
    try{return hurt.call(this,amount,x,y,source,...a);}finally{s.damageStack.pop();}
  };
  const cp=v6FinCp;
  v6FinCp=function(...a) {const n=v6G().cp,r=cp.apply(this,a);v133Emit({ev:"cpSpend",count:Math.max(0,n-v6G().cp),m:v133Target()});return r;};
  const sph=v6SphSpend;
  v6SphSpend=function(...a) {const n=Math.floor(v6G().sph),r=sph.apply(this,a);v133Emit({ev:"sphSpend",count:Math.max(0,n-Math.floor(v6G().sph)),m:v133Target()});return r;};
  const react=v6React;
  v6React=function(m,a,b,...rest) {const valid=alive(m) && V6_REACT[[a,b].sort().join("+")],r=react.call(this,m,a,b,...rest);if(valid)v133Emit({ev:"reaction",m,reaction:[a,b].sort().join("+")});return r;};
  const heat=v6HeatAdd;
  v6HeatAdd=function(n) {const before=v6G().heat,r=heat.call(this,n);if(S?.cls==="merchant" && before+n*(1+v6Tal("v6heat"))>=V6_HEAT.max)v133Emit({ev:"heatVent",m:v133Target()});return r;};
  const trig=trigHit;
  trigHit=function(t,a,s,o,...rest) {if(o?.v133Proc)return;return trig.call(this,t,a,s,o,...rest);};
  const ready=skillReady;
  skillReady=function(g,...a) {
    const s=v133State(), feed=s && (s.cols[0]?.q || s.p.feeds[0]);
    if(["ac_finger","ac_rampage","ac_asura"].includes(g.id)) {
      if(feed?.ev==="sphSpend" && Math.floor(G.v6?.sph||0)<feed.minCount+(v6Linked(g,"ac_focus")?1:0))return false;
      if(feed?.cond==="spheres" && s.energy<v133Cap(s))return false;
    }
    if(feed?.ev==="cpSpend" && SKILLS[g.id]?.tg?.includes("fin") && (G.v6?.cp||0)<feed.minCount+(v6Linked(g,"th_finish")?1:0))return false;
    return ready.call(this,g,...a);
  };
  const kite=kiteDir;
  kiteDir=function(target,...a) {
    const s=v133State(), cond=s && (s.cols[0]?.q || s.p.feeds[0]).cond;
    // The existing danger dodge remains active; only idle orbiting is stopped.
    if(cond==="stillFar" && alive(target) && S.hp>PS.maxhp*.35 && dist(target,G.pl)<38) {
      const dx=G.pl.x-target.x,dy=G.pl.y-target.y,d=Math.hypot(dx,dy)||1;
      return [dx/d,dy/d];
    }
    if((cond==="still" || cond==="stillFar") && alive(target) && S.hp>PS.maxhp*.35 && dist(target,G.pl)<=Math.max(PS.range,skillReach()||0))return null;
    return kite.call(this,target,...a);
  };
  const reach=skillReach;
  skillReach=function(...a) {
    const r=reach.apply(this,a),s=v133State(),cond=s && (s.cols[0]?.q || s.p.feeds[0]).cond;
    return cond==="stillFar" && S.hp>PS.maxhp*.35?Math.max(r||0,44):r;
  };
  HIT_MUL.push({k:"v133:conditional",f:(damage,m,o)=>{
    const s=v133State();if(!s)return damage;
    const kind=o?.min?"min":o?.skill?"skill":"basic";
    const buff=Math.min(.6,v133BuffValue(s,"damage")+v133BuffValue(s,kind));
    const marks=s.vuln.get(m)||{};
    const exposed=Math.min(.25,Object.values(marks).reduce((v,mark)=>v+(mark.until>G.t?mark.v:0),0));
    return damage*(1+buff)*(1+exposed);
  }});
  HURT_MUL.push({k:"v133:defense",f:()=>{const s=v133State();if(!s)return 1;const risk=s.cols[6];return (1-Math.min(.3,v133BuffValue(s,"dr")))*(1+v133BuffValue(s,"taken")+(risk?.penalty && v133Condition(risk.cond,{},s)?risk.penalty:0));}});
  SPD_AS.push({k:"v133:tempo",f:()=>1+Math.min(.4,v133BuffValue(v133State(),"as"))});
  SPD_MS.push({k:"v133:steps",f:()=>1+Math.min(.4,v133BuffValue(v133State(),"ms"))});
  const mech=v121Mech;
  v121Mech=function(...a) {const r=mech.apply(this,a);if(r)r[1]=r[1].map(t=>t.includes("氣之共鳴")?"分支資源與氣球分開計算；祭司以恩典、祈禱階運作，武僧依技能與天賦消耗氣球。":t);return r;};
  const help=HELP.asc?.[1];
  if(Array.isArray(help))for(const row of help) {
    if(row[0]==="分支特性")row[1]="流派確定後免費取得各分支的資源循環。尚未選奧義也能釋放；第一排改來源、第二排改釋放時機。";
    if(row[0]==="8 排 × 3 選 1")row[1]="26 分支、每分支 8 排，每排 3 選 1，共 624 選項。依序為："+V133_ROW.join("、")+"。核心循環與奧義依分支區分，部分生存與資源取捨使用共通規則。";
    if(row[0]==="奧義")row[1]="取代免費釋放效果：單體、範圍、分段回響、持續增益或回復等方向依分支不同；仍須滿足第二排的資源與出招條件。";
    if(row[0]==="來源標籤") {row[0]="條件與上限";row[1]="每個選項直接列出觸發條件、內置冷卻與數值。追加傷害不再觸發本版天賦，分段回響每秒一次，原目標死亡時取消餘段。";}
    if(row[0]==="共鳴") {row[0]="技能聯動";row[1]="第三排在持有分支資源時，成功施放指定主動技能可啟動額外效果；需裝備對應技能。";}
  }
  const ah=ui.ascHtml;
  ui.ascHtml=function(...a) {
    let h=ah.apply(this,a);
    const p=V133_BY_KEY[S?.tal?.asc];
    if(!p)return h;
    for(let i=0;i<8;i++)h=h.replace(new RegExp(`<h3>第 ${i+1} 排[^<]*</h3>`,"g"),`<h3>第 ${i+1} 排・${V133_ROW[i]}</h3>`);
    const s=v133State();
    const notice=S.tal.v133Refund?'<p class="muted">v1.3.4 已退還舊職業配點；總天賦點、職業分支與裝備保留，請重新選擇。</p>':"";
    return `<div class="board"><b>分支循環・${esc(p.resource)}</b><p>${esc(p.intent)}</p>${s?`<p>開啟此頁時：${s.energy} / ${v133Cap(s)} 格；釋放冷卻 ${Math.max(0,s.next-G.t).toFixed(1)} 秒</p>`:""}${notice}<a href="職業天賦一覽.html" target="_blank" rel="noopener">完整 26 分支・624 天賦與數值</a></div>`+h;
  };
  // ro-content starts async loading before this final script. A fast local save
  // may already have booted; recalculate it now as well as on future loads.
  if(typeof S!=="undefined" && S?.tal && G?.pl) {recalc();ui.refreshIf("asc","char","skill");}
}
v133Install();
