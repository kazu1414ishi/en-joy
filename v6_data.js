/* =========================================================
   EN•joy v6.5 データ拡張 ＆ 2モード分離ストレージ層 (v6_data.js)
   - data.js の直後に読み込むだけで EnjoyStore を2モード分離
   - 仕事性格診断（enちゃんとは別：簡易4問＋詳細15項目任意）マスタ完備
   - 旧localStorageデータが残っていても安全に補完する構造
========================================================= */

const ENJOY_MODE_KEY = "enjoy_v6_site_mode";

function getSiteMode() {
  try {
    return localStorage.getItem(ENJOY_MODE_KEY) === "mature" ? "mature" : "initial";
  } catch {
    return "initial";
  }
}

function setSiteMode(mode) {
  try {
    localStorage.setItem(ENJOY_MODE_KEY, mode === "mature" ? "mature" : "initial");
  } catch {}
}

function scopedKey(key) {
  return `${getSiteMode()}__${key}`;
}

const V6_STORAGE_KEYS = {
  EN_META: "enjoy_v6_en_meta",
  WORK_DIAG: "enjoy_v6_work_diag",
  FRIENDS: "enjoy_v6_friends",
  HOME_CONFIG: "enjoy_v6_home_config",
  EC_PRODUCTS: "enjoy_v6_ec_products",
  FIFTY_ITEMS: "enjoy_v6_fifty_items",
  NENRIN: "enjoy_v6_nenrin",
  LOGS: "enjoy_v6_logs",
  HEATMAP: "enjoy_v6_heatmap",
  FAN_STATE: "enjoy_v6_fan_state"
};

// v5の EnjoyStore をモード分離仕様へ拡張（v5原本のdata.js/app.jsを傷つけない）
EnjoyStore.load = function (key, fallback) {
  try {
    const raw = localStorage.getItem(scopedKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

EnjoyStore.save = function (key, value) {
  try {
    localStorage.setItem(scopedKey(key), JSON.stringify(value));
  } catch (e) {
    console.warn("保存スキップ:", e);
  }
};

EnjoyStore.clearCurrentMode = function () {
  const prefix = `${getSiteMode()}__`;
  Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(prefix + k));
  Object.values(V6_STORAGE_KEYS).forEach(k => localStorage.removeItem(prefix + k));
};

// 見本プロジェクトへv6拡張データを付与
Object.assign(ENJOY_DATA.sampleProjectTemplate, {
  supportCount: 8,
  supportMessages: [
    { author: "食べるの大好き ゆうこ", text: "甘すぎない大人みかんジャム、完成したら絶対買います🍊", time: "1時間前" }
  ],
  todos: [
    { id: "st-1", title: "120g小瓶のサンプル20個を手配", priority: "high", date: "2026-12-03", comment: "デザイン室キノさんと口径確認", done: false, source: { tab: "talk", refId: "m-3" } },
    { id: "st-2", title: "糖度45%・55%の試作食べ比べ", priority: "mid", date: "2026-12-07", comment: "皮のほろ苦さチェック", done: false, source: { tab: "tools", refId: "proto" } }
  ],
  votes: [
    {
      id: "sv-1",
      title: "初回の小瓶ラベル、どっちの雰囲気にする？",
      deadline: "2026-12-05",
      memberApproved: 2,
      memberTotal: 2,
      isPublic: true,
      url: "https://search.rakuten.co.jp/search/mall/和紙+ラベルシール+小ロット/",
      costNote: "50枚〜 / 1枚あたり約18円",
      options: [
        { id: "so-1", label: "🌿 和モダン手描き風（農家さん推し）", memberVotes: 2, fanVotes: 5 },
        { id: "so-2", label: "🎁 シックな手土産ギフト風", memberVotes: 0, fanVotes: 3 }
      ],
      comments: [{ author: "デザイン室キノ", text: "和紙シールなら50枚から小ロット印刷できます！" }],
      myChoice: null
    }
  ],
  boards: {
    active: ["calc", "vote"],
    concept: { target: "30〜50代の関西手土産層", what: "皮の香り活かす大人みかんジャム（120g小瓶）", price: "880円前後", when: "1月の関西マルシェ" },
    roadmap: [
      { id: "rm-1", title: "試作v1〜v2確定", date: "2026-12-07", done: false },
      { id: "rm-2", title: "小瓶・ラベル発注", date: "2026-12-14", done: false },
      { id: "rm-3", title: "食品表示・賞味期限確認", date: "2026-12-20", done: false },
      { id: "rm-4", title: "大阪週末マルシェ初テスト販売", date: "2027-01-10", done: false }
    ],
    protos: [
      { id: "pr-1", ver: "v1", recipe: "完熟みかん500g / 粗糖200g / レモン汁大さじ2", memo: "皮の香り最高！少しゆるめなのでv2で煮詰め調整" }
    ],
    calc: { qty: 50, mat: 180, subMat: 40, pkg: 120, label: 20, oem: 8000, design: 5000, test: 3000, equip: 0, sellPrice: 880, channel: "marche", splitNote: "素材35%：加工40%：デザイン販売25%" }
  },
  calendarExtras: [
    { id: "sce-1", type: "road", date: "2027-01-10", title: "大阪週末マルシェ お披露目テスト販売", sourceTab: "tools" }
  ]
});

const ENJOY_V6_DATA = {
  // ==================== Step 4：仕事性格診断（enちゃんとは完全別・仕事の為） ====================
  workDiagQuick: [
    {
      id: "wq1",
      q: "Q1. 新しい商品や企画を進めるとき、最初にどう動きたい？",
      options: [
        { id: "a", label: "🚀 まず小さく試作して動きながら直す", axis: "drive", pts: 3 },
        { id: "b", label: "📐 原価・目標・手順を整理してから動く", axis: "plan", pts: 3 }
      ]
    },
    {
      id: "wq2",
      q: "Q2. ものづくりや仕事で、いちばん譲れないポイントは？",
      options: [
        { id: "a", label: "✨ 味・素材・見た目の納得いく品質", axis: "craft", pts: 3 },
        { id: "b", label: "🤝 関わる仲間やお客様が喜ぶ空気感", axis: "collab", pts: 3 }
      ]
    },
    {
      id: "wq3",
      q: "Q3. チームで意見が割れたとき、自然にとる役割は？",
      options: [
        { id: "a", label: "🗣️ 全員の話を聞いて折衷案をまとめる", axis: "collab", pts: 3 },
        { id: "b", label: "📊 数字や現実的な条件で判断軸を出す", axis: "plan", pts: 3 }
      ]
    },
    {
      id: "wq4",
      q: "Q4. コラボ相手から一番言われて嬉しいひと言は？",
      options: [
        { id: "a", label: "🔥 「行動が早くて一気に前に進んだ！」", axis: "drive", pts: 3 },
        { id: "b", label: "🏆 「細部までのこだわりがプロすぎる！」", axis: "craft", pts: 3 }
      ]
    }
  ],

  workDiagDetail: [
    { id: "wd01", text: "1. 60点の試作品でも、まず現場に出して反応を見る方が早いと思う", axis: "drive" },
    { id: "wd02", text: "2. 締め切りや段取り表があると安心して力を発揮できる", axis: "plan" },
    { id: "wd03", text: "3. 味やデザインは自分が100%納得するまで妥協したくない", axis: "craft" },
    { id: "wd04", text: "4. 初対面の人とも雑談しながら距離を縮めるのが得意", axis: "collab" },
    { id: "wd05", text: "5. チャンスだと思ったら、その日のうちに連絡・行動することが多い", axis: "drive" },
    { id: "wd06", text: "6. 原価計算や利益率のシミュレーションを見るのが苦にならない", axis: "plan" },
    { id: "wd07", text: "7. 他の人が気づかない細かな違和感や改良点によく気づく", axis: "craft" },
    { id: "wd08", text: "8. 「誰と誰を繋いだら面白そうか」をよく考えている", axis: "collab" },
    { id: "wd09", text: "9. 失敗しても「次どう直すか」にすぐ気持ちを切り替えられる", axis: "drive" },
    { id: "wd10", text: "10. 決まったことはメモやリストに残して抜け漏れを防ぎたい", axis: "plan" },
    { id: "wd11", text: "11. 自分の専門分野や素材の魅力を深く掘り下げるのが好き", axis: "craft" },
    { id: "wd12", text: "12. チームの雰囲気が良くなるよう、こまめな感謝や反応を大事にする", axis: "collab" },
    { id: "wd13", text: "13. まだ誰もやっていない組み合わせや企画にワクワクする", axis: "drive" },
    { id: "wd14", text: "14. 事前にリスクや最悪のケースを想定して備えておく方だ", axis: "plan" },
    { id: "wd15", text: "15. 相手の立場や忙しさを想像しながら無理のない進め方を選びたい", axis: "collab" }
  ],

  workDiagTypes: {
    drive: {
      id: "drive",
      badge: "🚀 スピード推進タイプ",
      summary: "「まず試す」突破力で企画を前に動かすエンジン役",
      workStyle: "素早い試作と即レスが得意。ゼロから1を立ち上げる局面で真価を発揮します。",
      bestMatch: "📐 堅実プランナー型（段取り・採算面）と組むと最強のコンビに！"
    },
    craft: {
      id: "craft",
      badge: "✨ こだわり職人タイプ",
      summary: "素材・味・見た目の完成度を引き上げる品質の要",
      workStyle: "細部まで手を抜かず、お客様が「また買いたい」と思う本物を作り上げます。",
      bestMatch: "🤝 つなぎ共創型（発信・販路）と組むと価値がしっかり届きます！"
    },
    collab: {
      id: "collab",
      badge: "🤝 つなぎ共創タイプ",
      summary: "異業種の想いを翻訳してチームを一つにする潤滑油",
      workStyle: "相手の強みを引き出すのが上手く、マルシェやSNSでファンを巻き込む力も抜群です。",
      bestMatch: "✨ こだわり職人型（ものづくり）と組むとヒット商品が生まれやすい！"
    },
    plan: {
      id: "plan",
      badge: "📐 堅実プランナータイプ",
      summary: "スケジュールと原価・採算を守り切る頼れる司令塔",
      workStyle: "抜け漏れ防止と利益設計が得意。企画を「一過性」で終わらせず続く事業にします。",
      bestMatch: "🚀 スピード推進型（突破力）と組むと最速で確実に形になります！"
    }
  },

  // ==================== enちゃん（テスト版は中央❓QR） ====================
  enTypes: [
    { id: "hachidori", label: "開拓ハチドリ型", color: "#3D664A", desc: "素材や現場を飛び回り新しいご縁をつくる" },
    { id: "fukurou", label: "職人フクロウ型", color: "#E87A3E", desc: "レシピ・品質・ものづくりを極める" },
    { id: "tsubame", label: "つなぎツバメ型", color: "#2F6F8F", desc: "人とお店・マルシェを軽やかにつなぐ" },
    { id: "penguin", label: "応援ペンギン型", color: "#8B5E83", desc: "推しを見つけて広め、作り手を支える" }
  ],

  homeStatCatalog: [
    { id: "active_labs", label: "進行中ラボ", group: "maker" },
    { id: "my_offers", label: "困りごと", group: "maker" },
    { id: "got_interest", label: "興味届いた", group: "maker" },
    { id: "sent_interest", label: "送った数", group: "maker" },
    { id: "my_todos", label: "やること", group: "both" },
    { id: "fan_favs", label: "お気に入り", group: "fan" },
    { id: "fan_supports", label: "応援中", group: "fan" },
    { id: "fan_votes", label: "投票した", group: "fan" }
  ],

  homeIndexCatalog: [
    { id: "talk_new", label: "💬 トーク新着", desc: "参加中ラボの最新トーク" },
    { id: "public_vote", label: "🗳️ 公開中の多数決", desc: "全員OKで公開された投票に1タップ参加" },
    { id: "todo_due", label: "✅ 期限が近いやること", desc: "締切・重要度高のタスク横断" },
    { id: "news", label: "📰 EN•joyニュース＆市場", desc: "関西マルシェ・旬トレンド・50:50人気" },
    { id: "sos_alert", label: "🆘 SOSレスキュー速報", desc: "期限つきの急ぎSOS投稿" },
    { id: "sudachi_new", label: "🎉 巣立ち・新商品", desc: "完成したコラボ商品の最新お披露目" }
  ],

  customBoardsCatalog: [
    { id: "calc", phase: "お金・採算", label: "🧮 原価・設備費計算機", defaultOn: true },
    { id: "vote", phase: "意思決定", label: "🗳️ 意思決定・多数決ボード", defaultOn: true },
    { id: "concept", phase: "方向性", label: "🧭 コンセプト1枚メモ", defaultOn: false },
    { id: "roadmap", phase: "方向性", label: "🗓️ かんたんロードマップ", defaultOn: false },
    { id: "proto", phase: "試作", label: "🧪 試作レシピ履歴（v1→v2）", defaultOn: false },
    { id: "channel", phase: "販売決定", label: "🏪 販売チャネル比較＆利益", defaultOn: false },
    { id: "ai", phase: "サポート", label: "✨ AIおすすめ枠", defaultOn: false }
  ],

  aiSuggestions: [
    { id: "ai-1", tag: "小ロット資材", title: "120g六角ガラス小瓶（24本〜卸）", detail: "50個試作なら小瓶＋ツイスト蓋で約120円/個。50:50でも愛用者多数。", url: "https://search.rakuten.co.jp/search/mall/120g+六角+ジャム瓶/", costNote: "24本〜 / 約120円/個" },
    { id: "ai-2", tag: "関西マルシェ", title: "大阪・京都 週末マルシェ出店枠（今月3件）", detail: "初テスト販売におすすめの委託・対面マルシェ募集（出店料3,000円〜）。", url: "https://news.google.com/search?q=大阪+京都+マルシェ+出店募集", costNote: "出店料 約3,000円〜" },
    { id: "ai-3", tag: "コスト削減ヒント", title: "スタンドパウチ切替で包材費 約45円ダウン", detail: "原価率が高い場合は初回テストのみパウチ＋耐水ラベル50枚印刷も有効。", url: "https://search.rakuten.co.jp/search/mall/スタンドパウチ+食品+小ロット/", costNote: "50枚〜 / 約35円/枚" },
    { id: "ai-4", tag: "成功事例", title: "規格外柑橘×皮ごとマーマレード（他県ヒット）", detail: "他県で人気の「甘さ控えめ・常温180日・手土産仕様」は関西でまだ空き枠あり。", url: "", costNote: "参考売価 880〜1,080円" }
  ],

  initialEnMeta: { enType: "開拓ハチドリ型", enColor: "#3D664A", enSeed: "ENJOY-INIT-QR", enExp: 15, hasNotify: true },
  matureEnMeta: { enType: "開拓ハチドリ型", enColor: "#3D664A", enSeed: "ENJOY-SATO-QR", enExp: 95, hasNotify: true },

  initialWorkDiag: { quick: {}, detail: {}, detailOpen: false },
  matureWorkDiag: {
    quick: { wq1: "a", wq2: "a", wq3: "a", wq4: "a" },
    detail: { wd01: 2, wd03: 2, wd05: 2, wd08: 2, wd11: 2, wd13: 2 },
    detailOpen: false
  },

  initialFriends: [
    { id: "fr-1", name: "たなか農園（見本）", role: "🌾 素材・つくる", area: "大阪府 高槻市", bio: "規格外みかん・レモンを活かしたい！", isFriend: false },
    { id: "fr-2", name: "菓子工房ハレ（見本）", role: "🍳 形にする", area: "大阪府 茨木市", bio: "50瓶からの小ロット無添加ジャム試作OK", isFriend: false }
  ],

  matureFriends: [
    { id: "fr-1", name: "高槻みかん農園 たなか", role: "🌾 素材・つくる", area: "大阪府 高槻市", bio: "糖度14度の規格外みかん週50kg提供OK", isFriend: true },
    { id: "fr-2", name: "菓子工房ハレ", role: "🍳 形にする", area: "大阪府 茨木市", bio: "50瓶からの小ロット無添加ジャム試作OK", isFriend: true },
    { id: "fr-3", name: "デザイン室キノ", role: "🎨 整える・包む", area: "京都府 京都市", bio: "小ロット50枚〜和モダン食品ラベル制作", isFriend: true },
    { id: "fr-4", name: "京都・宇治茶ファーム 佐々木", role: "🌾 素材・つくる", area: "京都府 宇治市", bio: "一番茶の選別落ち茶葉コラボ募集中", isFriend: false }
  ],

  initialNenrin: [
    { date: "今日", title: "🌱 EN•joy に参加スタート", detail: "5ステップ登録でデジタル名刺・仕事性格診断・❓QRを発行" }
  ],

  matureNenrin: [
    { date: "昨日", title: "🎉「規格外みかんの大人クラフトジャム」巣立ち出品！", detail: "初回50瓶がマルシェ＆ECで先行予約開始" },
    { date: "3日前", title: "⚖️ 50:50「120g六角小瓶」に現場レビュー追加", detail: "3人の作り手が愛用中の神資材に仲間入り" },
    { date: "1週間前", title: "🗳️ EN•ラボ多数決が全員OK → 一般公開！", detail: "和モダン手描き風ラベルがファン投票込みで採用" },
    { date: "2週間前", title: "🤝 対面❓QRで3名の作り手と友達登録", detail: "たなか農園・菓子工房ハレ・デザイン室キノ" },
    { date: "3週間前", title: "🌱 EN•joy 参加・デジタル名刺＆仕事性格診断完了", detail: "スピード推進タイプでスタート" }
  ],

  initialEcProducts: {
    sudachi: [
      {
        id: "ec-s1",
        name: "規格外みかんの大人クラフトジャム（120g小瓶）",
        price: 880,
        makers: "高槻みかん農園 たなか × 菓子工房ハレ × デザイン室キノ",
        badge: "🎉 EN•ラボ巣立ち第1号",
        story: "強風でキズがついた完熟みかん50kgをSOSから救出。EN•ラボの全員OK公開多数決で『糖度45%・皮のほろ苦さ仕上げ』と『和モダン手描き風ラベル』に決定しました。",
        voteHistory: "公開多数決結果：和モダン手描き風（メンバー2票＋ファン5票） vs シックなギフト風（3票）",
        pairingText: "⚖️ 50:50の「厚切りバター食パン」と掛け合わせると最高！",
        members: [
          { name: "高槻みかん農園 たなか", role: "🌾 素材（大阪・高槻）", note: "完熟規格外みかん提供" },
          { name: "菓子工房ハレ", role: "🍳 形にする（大阪・茨木）", note: "小ロット50瓶無添加炊き上げ" },
          { name: "デザイン室キノ", role: "🎨 整える・包む（京都）", note: "和紙風ラベルデザイン" }
        ]
      }
    ],
    reserve: [
      { id: "ec-r1", name: "【先行予約】無添加クラフトみかんシロップ試食セット", price: 1200, makers: "たなか農園 × 菓子工房ハレ", stock: "残り12セット（売れ残りリスクゼロ製造）", badge: "🥚 予約・テスト販売" }
    ],
    rescue: [
      { id: "ec-q1", name: "【🆘レスキュー便】キズあり完熟みかん 3kg箱", price: 1580, makers: "高槻みかん農園 たなか", stock: "残り8箱（期限：今週中）", badge: "🆘 SOSレスキュー便" }
    ]
  },

  initialFiftyItems: [
    {
      id: "ff-1",
      name: "耐熱ガラス 120g六角小瓶（24本・ツイストキャップ付）",
      category: "🚜 作り手のガチ愛用品",
      discoverer: "菓子工房ハレ",
      discovererId: "fr-2",
      pairing: "「規格外みかんの大人クラフトジャム（巣立ち商品）」にピッタリ！",
      url: "https://search.rakuten.co.jp/search/mall/120g+六角+ジャム瓶/",
      stats: { op: 0, disc: 0, maker: 0 },
      lastRouteMsg: "",
      reviews: [
        { id: "rv-1", author: "菓子工房ハレ", authorId: "fr-2", text: "煮沸脱気しても蓋が歪みにくく、マルシェで並べたとき一番高見えします。", likes: 5, applied: 4 },
        { id: "rv-2", author: "高槻みかん農園 たなか", authorId: "fr-1", text: "発送時に割れにくい厚みで助かってます！", likes: 2, applied: 1 }
      ]
    },
    {
      id: "ff-2",
      name: "楽天の神・厚切りバター食パン（冷凍お取り寄せ）",
      category: "🍽️ 掛け合わせ神商品",
      discoverer: "デザイン室キノ",
      discovererId: "fr-3",
      pairing: "「規格外みかんの大人クラフトジャム」を塗ると最高の手土産セットに！",
      url: "https://search.rakuten.co.jp/search/mall/厚切り+バター食パン+お取り寄せ/",
      stats: { op: 0, disc: 0, maker: 0 },
      lastRouteMsg: "",
      reviews: [
        { id: "rv-3", author: "デザイン室キノ", authorId: "fr-3", text: "試食会でこの食パンにみかんジャムを塗ったら全員おかわりしました！", likes: 8, applied: 3 }
      ]
    }
  ],

  matureProfile: {
    registered: true, mainRole: "material", otherRoleText: "", otherPushOk: true,
    activities: ["果樹・フルーツ", "規格外品の提供", "マルシェ出店"],
    subRoles: ["deliver"], subRoleExploring: false, customSubRoles: [],
    userStage: "maker", accountType: "team", photoDataUrl: "", photoPendingReview: false, favoritePhotos: [],
    profileBio: "大阪・寝屋川＆高槻エリアで旬のフルーツを栽培中！規格外素材を活かした無添加コラボや週末マルシェ出店を進めています。",
    displayName: "ねやがわ農園 佐藤", ageGroup: "30代", exactAge: "36", area: "大阪府 寝屋川市 香里園", areaGranularity: "broad",
    interests: ["規格外品の活用", "小ロット試作", "マルシェ出店"], referralCode: "",
    capacityTags: ["週30〜50kgまで供給可", "規格外・B品の定期提供OK", "サンプル発送OK"],
    capacity: "完熟みかん・いちごを季節ごとに週30〜50kg供給できます",
    pride: "糖度14度以上の完熟フルーツを家族で丁寧に育てています。", prideVisibility: "public",
    secretPride: "試作1回目の規格外B品は材料実費のみで提供OKです！",
    products: [
      { id: 101, title: "完熟みかんの大人クラフトジャム", icon: "🍯", note: "EN•ラボ巣立ち第1号（120g）", url: "" },
      { id: 102, title: "関西マルシェ出店予定", icon: "🌐", note: "大阪・京都の週末マルシェ", url: "" }
    ],
    ideaMemo: "", seekingPartners: [], ideaNote: "", connectBio: "", fanGenres: [], fanMonitorOk: true, fanMessage: "",
    companyName: "ねやがわ農園", phone: "090-1234-5678", teamCode: "EN-TM420",
    teamMembers: [
      { id: "tm-1", name: "佐藤 健太", role: "代表・栽培", phone: "090-1234-5678", isPrimary: true },
      { id: "tm-2", name: "佐藤 彩", role: "マルシェ・SNS窓口", phone: "", isPrimary: false }
    ],
    activeSpeakerId: "tm-1"
  },

  matureProjects: [
    {
      id: "proj-mature-1", isSample: false, stage: 3,
      title: "規格外みかんの大人クラフトジャム",
      goal: "見た目だけ訳ありの完熟みかん50kgを活かし、常温手土産になる120g小瓶ジャムを初回50個テスト販売！",
      area: "大阪府 高槻市・寝屋川市", tag: "小ロット試作OK", kindTabs: ["新商品開発", "規格外レスキュー"], media: null,
      supportCount: 19,
      supportMessages: [{ author: "食べるの大好き ゆうこ", text: "試作のやり取り見てファンになりました！予約始まったら絶対買います！", time: "2時間前" }],
      pieces: [
        { id: "material", icon: "🌾", label: "素材", status: "filled", memberName: "ねやがわ農園 佐藤" },
        { id: "make", icon: "🍳", label: "形にする", status: "filled", memberName: "菓子工房ハレ" },
        { id: "pack", icon: "🎨", label: "整える包む", status: "filled", memberName: "デザイン室キノ" },
        { id: "deliver", icon: "🏪", label: "届ける試す", status: "open", memberName: "" }
      ],
      todos: [
        { id: "td-1", title: "完熟みかん50kgのサンプル発送", priority: "high", date: "2026-11-29", comment: "冷蔵便で工房へ", done: true, source: { tab: "talk", refId: "mm-2" } },
        { id: "td-2", title: "120g六角小瓶50個を50:50経由で発注", priority: "high", date: "2026-12-03", comment: "佐藤担当・予備5本", done: false, source: { tab: "tools", refId: "calc" } },
        { id: "td-3", title: "試作ジャム糖度45%・55%の最終試食会", priority: "mid", date: "2026-12-06", comment: "14:00〜 工房ハレにて", done: false, source: { tab: "talk", refId: "mm-2" } }
      ],
      votes: [
        {
          id: "vt-1", title: "初回50瓶のラベルデザイン、どっちでいく？", deadline: "2026-12-04",
          memberApproved: 3, memberTotal: 3, isPublic: true,
          url: "https://search.rakuten.co.jp/search/mall/和紙+ラベルシール+小ロット/", costNote: "50枚〜 / 1枚あたり18円",
          options: [
            { id: "vo-1", label: "🌿 和モダン手描き風（農家さん推し）", memberVotes: 2, fanVotes: 6 },
            { id: "vo-2", label: "🎁 シックな手土産ギフト風", memberVotes: 1, fanVotes: 2 }
          ],
          comments: [{ author: "デザイン室キノ", text: "和紙シールなら50枚から綺麗に印刷できます！" }],
          myChoice: "vo-1"
        }
      ],
      boards: {
        active: ["calc", "vote", "concept", "roadmap", "proto", "channel", "ai"],
        concept: { target: "30〜50代の関西手土産層", what: "皮のほろ苦さ×無添加120g小瓶ジャム", price: "880円（税込）", when: "12/20 大阪週末マルシェ" },
        roadmap: [
          { id: "rm-1", title: "素材確定・みかん手配", date: "2026-11-29", done: true },
          { id: "rm-2", title: "試作v2＆糖度決定", date: "2026-12-06", done: false },
          { id: "rm-3", title: "小瓶・和紙ラベル入稿", date: "2026-12-12", done: false },
          { id: "rm-4", title: "大阪週末マルシェ 初テスト販売", date: "2026-12-20", done: false }
        ],
        protos: [
          { id: "pr-1", ver: "v1", recipe: "みかん500g / 粗糖220g / レモン大1", memo: "少し甘め。香りは抜群。" },
          { id: "pr-2", ver: "v2", recipe: "みかん500g / 粗糖180g / 皮千切り20g / レモン大2", memo: "糖度45%で大人味！メンバー満場一致で採用。" }
        ],
        calc: { qty: 50, mat: 180, subMat: 40, pkg: 120, label: 18, oem: 8000, design: 5000, test: 3000, equip: 0, sellPrice: 880, channel: "marche", splitNote: "素材35%：加工40%：デザイン販売25%" }
      },
      calendarExtras: [{ id: "ce-1", type: "road", date: "2026-12-20", title: "大阪週末マルシェ 初テスト販売", sourceTab: "tools" }],
      members: [
        { roleLabel: "🌾 素材（発起人）", card: null },
        { roleLabel: "🍳 形にする", card: { mainRole: "make", userStage: "maker", accountType: "team", subRoles: [], activities: ["ジャム・ソース加工", "小ロット試作OK"], displayName: "菓子工房ハレ", ageGroup: "30代", area: "大阪府 茨木市 駅前", areaGranularity: "broad", capacity: "50〜200瓶の小ロット対応", pride: "低温炊き上げで果実の香りを残します", prideVisibility: "public", companyName: "合同会社ハレ工房", phone: "072-000-1122" } },
        { roleLabel: "🎨 整える包む", card: { mainRole: "pack", userStage: "skill", accountType: "solo", subRoles: [], activities: ["パッケージデザイン", "ラベル・小ロット印刷"], displayName: "デザイン室キノ", ageGroup: "30代", area: "京都府 京都市 左京区", areaGranularity: "broad", capacity: "小ロット50枚〜ラベル印刷OK", pride: "和モダンで手に取りやすい食品パッケージ", prideVisibility: "public", companyName: "デザイン室キノ", phone: "080-9876-5432" } }
      ],
      applicants: [
        { id: "app-m1", roleId: "deliver", roleLabel: "🏪 届ける試す", message: "大阪の週末マルシェと古民家セレクト棚で初回テスト販売をお手伝いできます！", card: { mainRole: "deliver", userStage: "skill", accountType: "solo", subRoles: [], activities: ["マルシェ出店", "店舗でのテスト販売"], displayName: "マルシェ設計室ミナミ", ageGroup: "30代", area: "大阪府 大阪市 中央区", areaGranularity: "broad", capacity: "週末マルシェ月2回開催", pride: "作り手のストーリーを伝える店頭POPが得意", prideVisibility: "public", companyName: "マルシェ設計室ミナミ", phone: "080-5555-1212" } }
      ],
      messages: [
        { id: "mm-1", who: "sys", sender: "システム", text: "🎉 EN•ラボがスタートしました！", pinned: false, time: "10:00" },
        { id: "mm-2", who: "other", sender: "菓子工房ハレ", text: "皮ごと炊いたv2（糖度45%）めちゃくちゃ良い香りです🍊 12/06の試食会で食べ比べしましょう！", pinned: true, dateTag: "2026-12-06", time: "14:20" },
        { id: "mm-3", who: "other", sender: "デザイン室キノ", text: "うわ、色めちゃくちゃ綺麗！！和紙ラベル絶対合いますね✨ 12/20のマルシェ間に合わせます！", pinned: true, dateTag: null, time: "15:05" }
      ]
    }
  ],

  matureOffers: [
    { id: "mo-1", text: "【💡こんなアイデア】甘くない大人向けの「規格外みかんクラフトコーラ」あったらカフェで絶対飲みたい！", area: "京都府 京都市", kindTabs: ["こんなアイデア"], author: "食べるの大好き ゆうこ", comments: 2 },
    { id: "mo-2", text: "【🍊素材が余る】来月、無農薬ゆずが30kgほど余りそうです。シロップや焼き菓子でコラボできる工房さんいませんか？", area: "大阪府 寝屋川市", kindTabs: ["余剰素材", "コラボ相手探し"], author: "ねやがわ農園 佐藤", comments: 3 }
  ],

  matureFeeds: [
    { id: "mf-1", type: "rescue", authorId: "fr-1", author: "高槻みかん農園 たなか", roleIcon: "🌾", area: "大阪府 高槻市", deadline: "あと3日", amount: "約40kg", time: "15分前", text: "強風で少しキズがついた完熟みかんが40kgあります！糖度14度で味は最高なので、ジャム試作・飲食店デザート・訳あり販売で助けてください🍊", media: null, likes: 12, wantEat: 9 },
    {
      id: "mf-2", type: "behind", authorId: "fr-2", author: "菓子工房ハレ", roleIcon: "🍳", area: "大阪府 茨木市", time: "2時間前", linkedRoomId: "proj-mature-1",
      text: "試作v2がめちゃくちゃ良い色に仕上がりました！ルームのリアルな掛け合いをそのままお届けします✨",
      popClip: [
        { icon: "🌾", who: "ねやがわ農園 佐藤", text: "皮ごと炊いてみた！香りがすごい🍊" },
        { icon: "🎨", who: "デザイン室キノ", text: "うわ、色めちゃくちゃ綺麗！！和紙ラベル絶対合いますね✨" },
        { icon: "🍳", who: "菓子工房ハレ", text: "糖度45%で仕上げて12/06最終試食いきます🔥" }
      ],
      media: null, likes: 18, wantEat: 24
    },
    { id: "mf-3", type: "voice", authorId: "fan-1", author: "食べるの大好き ゆうこ", roleIcon: "🛒", area: "京都府 京都市", time: "昨日", text: "常温で日持ちして、ちょっとした手土産に配れる1000円以下の無添加クラフトジャムがあったら絶対買いたい！小瓶だと嬉しいな〜。", media: null, likes: 15, wantEat: 11, helpful: 4 }
  ],

  matureFiftyItems: [
    {
      id: "ff-1", name: "耐熱ガラス 120g六角小瓶（24本・ツイストキャップ付）", category: "🚜 作り手のガチ愛用品",
      discoverer: "菓子工房ハレ", discovererId: "fr-2", pairing: "「規格外みかんの大人クラフトジャム（巣立ち商品）」と相性抜群！",
      url: "https://search.rakuten.co.jp/search/mall/120g+六角+ジャム瓶/",
      stats: { op: 4, disc: 1, maker: 3 },
      lastRouteMsg: "最新クリック遷移先 → 👑 最初に見つけた人【菓子工房ハレ】リンク（先見の明 5%枠!）",
      reviews: [
        { id: "rv-1", author: "菓子工房ハレ", authorId: "fr-2", text: "煮沸脱気しても蓋が歪みにくく、マルシェで並べたとき一番高見えします。", likes: 9, applied: 6 },
        { id: "rv-2", author: "高槻みかん農園 たなか", authorId: "fr-1", text: "発送時に割れにくい厚みで助かってます！", likes: 4, applied: 2 },
        { id: "rv-3", author: "デザイン室キノ", authorId: "fr-3", text: "和紙ラベルが綺麗に貼れる六角面がお気に入りです。", likes: 5, applied: 3 }
      ]
    },
    {
      id: "ff-2", name: "プロ仕様 剪定バサミ（疲れにくい軽量グリップ）", category: "🚜 作り手のガチ愛用品",
      discoverer: "高槻みかん農園 たなか", discovererId: "fr-1", pairing: "果樹園の収穫効率UP＆農家さんへのギフトにも◎",
      url: "https://search.rakuten.co.jp/search/mall/剪定バサミ+軽量/",
      stats: { op: 2, disc: 1, maker: 1 }, lastRouteMsg: "",
      reviews: [{ id: "rv-4", author: "高槻みかん農園 たなか", authorId: "fr-1", text: "1日5時間切っても手が痛くならない。3年使っても刃こぼれなし！", likes: 8, applied: 4 }]
    },
    {
      id: "ff-3", name: "楽天の神・厚切りバター食パン（冷凍お取り寄せ）", category: "🍽️ 掛け合わせ神商品",
      discoverer: "ねやがわ農園 佐藤", discovererId: "me", pairing: "「規格外みかんの大人クラフトジャム」を塗ると最高！",
      url: "https://search.rakuten.co.jp/search/mall/厚切り+バター食パン+お取り寄せ/",
      stats: { op: 3, disc: 1, maker: 2 }, lastRouteMsg: "",
      reviews: [{ id: "rv-5", author: "ねやがわ農園 佐藤", authorId: "me", text: "試食会でこの食パンにみかんジャムを塗ったら全員おかわりしました！", likes: 11, applied: 5 }]
    }
  ]
};

// 仕事性格診断のスコア集計ヘルパー（簡易4問＋詳細15項目からタイプ判定）
function v6CalcWorkDiagResult(diag) {
  const quick = diag?.quick || {};
  const detail = diag?.detail || {};
  const qCount = Object.keys(quick).length;
  const dCount = Object.keys(detail).length;
  if (qCount === 0 && dCount === 0) return null;

  const scores = { drive: 0, craft: 0, collab: 0, plan: 0 };
  ENJOY_V6_DATA.workDiagQuick.forEach(q => {
    const picked = q.options.find(o => o.id === quick[q.id]);
    if (picked) scores[picked.axis] += picked.pts;
  });
  ENJOY_V6_DATA.workDiagDetail.forEach(d => {
    const v = detail[d.id];
    if (typeof v === "number") scores[d.axis] += v;
  });

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topAxis = sorted[0][0];
  const subAxis = sorted[1][0];
  return {
    type: ENJOY_V6_DATA.workDiagTypes[topAxis],
    subType: ENJOY_V6_DATA.workDiagTypes[subAxis],
    scores,
    quickDone: qCount,
    detailDone: dCount
  };
}

// 旧localStorageデータが残っていても安全に不足キーを補完するヘルパー
function v6NormalizeLogs(raw) {
  const base = {
    anonId: "USER-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
    events: [],
    clicksByTab: { home: 1, feed: 0, en: 0, tips: 0, shop: 0 },
    toolUsage: {},
    screenTimeSec: {},
    hesitations: 0,
    discordWebhook: ""
  };
  const merged = Object.assign(base, raw || {});
  if (!merged.events || !Array.isArray(merged.events)) merged.events = [];
  if (!merged.clicksByTab || typeof merged.clicksByTab !== "object") merged.clicksByTab = base.clicksByTab;
  if (!merged.toolUsage || typeof merged.toolUsage !== "object") merged.toolUsage = {};
  if (!merged.screenTimeSec || typeof merged.screenTimeSec !== "object") merged.screenTimeSec = {};
  return merged;
}

// 「使い込みモード」初回空時に自動で充実データを投入
(function ensureMatureSeed() {
  if (getSiteMode() !== "mature") return;
  if (EnjoyStore.load(STORAGE_KEYS.PROFILE, null)) return;

  const mp = JSON.parse(JSON.stringify(ENJOY_V6_DATA.matureProfile));
  const projs = JSON.parse(JSON.stringify(ENJOY_V6_DATA.matureProjects));
  if (projs[0] && projs[0].members && projs[0].members[0]) {
    projs[0].members[0].card = JSON.parse(JSON.stringify(mp));
  }
  EnjoyStore.save(STORAGE_KEYS.PROFILE, mp);
  EnjoyStore.save(STORAGE_KEYS.PROJECTS, projs);
  EnjoyStore.save(STORAGE_KEYS.OFFERS, JSON.parse(JSON.stringify(ENJOY_V6_DATA.matureOffers)));
  EnjoyStore.save(STORAGE_KEYS.FEEDS, JSON.parse(JSON.stringify(ENJOY_V6_DATA.matureFeeds)));
  EnjoyStore.save(V6_STORAGE_KEYS.EN_META, JSON.parse(JSON.stringify(ENJOY_V6_DATA.matureEnMeta)));
  EnjoyStore.save(V6_STORAGE_KEYS.WORK_DIAG, JSON.parse(JSON.stringify(ENJOY_V6_DATA.matureWorkDiag)));
  EnjoyStore.save(V6_STORAGE_KEYS.FRIENDS, JSON.parse(JSON.stringify(ENJOY_V6_DATA.matureFriends)));
  EnjoyStore.save(V6_STORAGE_KEYS.EC_PRODUCTS, JSON.parse(JSON.stringify(ENJOY_V6_DATA.initialEcProducts)));
  EnjoyStore.save(V6_STORAGE_KEYS.FIFTY_ITEMS, JSON.parse(JSON.stringify(ENJOY_V6_DATA.matureFiftyItems)));
  EnjoyStore.save(V6_STORAGE_KEYS.NENRIN, JSON.parse(JSON.stringify(ENJOY_V6_DATA.matureNenrin)));
  EnjoyStore.save(V6_STORAGE_KEYS.LOGS, v6NormalizeLogs({
    events: [
      { time: "19:12", tab: "shop", type: "50:50クリック", detail: "120g六角小瓶 -> 👑発掘者5%枠" },
      { time: "19:08", tab: "en-room", type: "カレンダー切替", detail: "ルームカレンダー表示" }
    ],
    clicksByTab: { home: 4, feed: 3, en: 5, tips: 2, shop: 4 },
    toolUsage: { calc: 3, vote: 4, proto: 2 },
    screenTimeSec: { home: 42, feed: 35, en: 68, shop: 29 }
  }));
})();
// === v6_data.js ここまで ===