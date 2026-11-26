/* =========================================================
   EN•joy v6 データ拡張 ＆ 2モード分離ストレージ層 (v6_data.js)
   - data.js の直後に読み込むだけで EnjoyStore を2モード分離
   - 「🐣 最初のサイト（登録から）」⇄「🌳 使用していった時のサイト」
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
  FRIENDS: "enjoy_v6_friends",
  EC_PRODUCTS: "enjoy_v6_ec_products",
  FIFTY_ITEMS: "enjoy_v6_fifty_items",
  NENRIN: "enjoy_v6_nenrin",
  LOGS: "enjoy_v6_logs",
  HEATMAP: "enjoy_v6_heatmap",
  EN_META: "enjoy_v6_en_meta"
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

const ENJOY_V6_DATA = {
  enTypes: [
    { id: "hachidori", label: "開拓ハチドリ型", color: "#3D664A", desc: "素材や現場を飛び回り新しいご縁をつくる" },
    { id: "fukurou", label: "職人フクロウ型", color: "#E87A3E", desc: "レシピ・品質・ものづくりを極める" },
    { id: "tsubame", label: "つなぎツバメ型", color: "#2F6F8F", desc: "人とお店・マルシェを軽やかにつなぐ" },
    { id: "penguin", label: "応援ペンギン型", color: "#8B5E83", desc: "推しを見つけて広め、作り手を支える" }
  ],

  customBoards: [
    { id: "vote", label: "🗳️ 多数決" },
    { id: "calc", label: "🧮 原価計算" },
    { id: "concept", label: "📝 コンセプト" },
    { id: "proto", label: "🍳 試作記録" },
    { id: "label", label: "🏷️ 食品表示" },
    { id: "sales", label: "🛍️ 販売方法" },
    { id: "links", label: "🔗 リンク・50:50" }
  ],

  initialEnMeta: {
    enType: "開拓ハチドリ型",
    enColor: "#3D664A",
    enSeed: "ENJOY-INITIAL-USER",
    enExp: 15
  },

  matureEnMeta: {
    enType: "開拓ハチドリ型",
    enColor: "#3D664A",
    enSeed: "ENJOY-MATURE-SATO",
    enExp: 95
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
    { date: "今日", title: "🌱 EN•joy に参加スタート", detail: "4ステップ登録でデジタル名刺＆中央❓QRを発行" }
  ],

  matureNenrin: [
    { date: "昨日", title: "🎉「規格外みかんの大人クラフトジャム」巣立ち出品！", detail: "初回50瓶がマルシェ＆ECで先行予約開始" },
    { date: "3日前", title: "⚖️ 50:50「120g六角小瓶」に現場レビュー追加", detail: "3人の作り手が愛用中の神資材に仲間入り" },
    { date: "1週間前", title: "🗳️ EN•ラボ多数決が全員承認 → 一般公開！", detail: "和モダン手描き風ラベルが6票で採用" },
    { date: "2週間前", title: "🤝 対面❓QRで3名の作り手と友達登録", detail: "たなか農園・菓子工房ハレ・デザイン室キノ" },
    { date: "3週間前", title: "🌱 EN•joy 参加・デジタル名刺＆❓QR発行", detail: "開拓ハチドリ型でスタート" }
  ],

  initialEcProducts: {
    sudachi: [
      {
        id: "ec-s1",
        name: "【見本】規格外みかんの大人クラフトジャム（120g小瓶）",
        price: 880,
        makers: "たなか農園 × 菓子工房ハレ × デザイン室キノ",
        badge: "🎉 EN•ラボ巣立ち第1号",
        story: "強風でキズがついた完熟みかん50kgをSOSから救出。EN•ラボの多数決で『糖度45%・皮のほろ苦さ仕上げ』と『和モダン手描き風ラベル』に決定しました。",
        voteHistory: "多数決（全員承認→一般公開）：和モダン手描き風（6票） vs シックなギフト箱（2票）",
        members: [
          { name: "高槻みかん農園 たなか", role: "🌾 素材（大阪・高槻）", note: "完熟規格外みかん提供" },
          { name: "菓子工房ハレ", role: "🍳 形にする（大阪・茨木）", note: "小ロット50瓶無添加炊き上げ" },
          { name: "デザイン室キノ", role: "🎨 整える・包む（京都）", note: "和紙風ラベルデザイン" }
        ]
      }
    ],
    reserve: [
      { id: "ec-r1", name: "【先行予約】無添加クラフトみかんシロップ試食セット", price: 1200, makers: "たなか農園 × 菓子工房ハレ", stock: "残り12セット（売れ残りリスクゼロ製造）", badge: "🥚 先行予約・テスト販売" }
    ],
    rescue: [
      { id: "ec-q1", name: "【🆘レスキュー便】キズあり完熟みかん 3kg箱", price: 1580, makers: "高槻みかん農園 たなか", stock: "残り8箱（期限：12/05まで）", badge: "🆘 SOSレスキュー便" }
    ]
  },

  initialFiftyItems: [
    {
      id: "ff-1",
      name: "耐熱ガラス 120g六角小瓶（24本・ツイストキャップ付）",
      category: "🚜 作り手のガチ愛用品",
      discoverer: "菓子工房ハレ",
      discovererId: "fr-2",
      pairing: "「規格外みかんの大人クラフトジャム」と掛け合わせ提案！",
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
      name: "プロ仕様 剪定バサミ（疲れにくい軽量グリップ）",
      category: "🚜 作り手のガチ愛用品",
      discoverer: "高槻みかん農園 たなか",
      discovererId: "fr-1",
      pairing: "果樹園の収穫効率UP＆農家さんへのギフトにも◎",
      url: "https://search.rakuten.co.jp/search/mall/剪定バサミ+軽量/",
      stats: { op: 0, disc: 0, maker: 0 },
      lastRouteMsg: "",
      reviews: [
        { id: "rv-3", author: "高槻みかん農園 たなか", authorId: "fr-1", text: "1日5時間切っても手が痛くならない。3年使っても刃こぼれなし！", likes: 7, applied: 3 }
      ]
    }
  ],

  matureFiftyItems: [
    {
      id: "ff-1",
      name: "耐熱ガラス 120g六角小瓶（24本・ツイストキャップ付）",
      category: "🚜 作り手のガチ愛用品",
      discoverer: "菓子工房ハレ",
      discovererId: "fr-2",
      pairing: "「規格外みかんの大人クラフトジャム（巣立ち商品）」と相性抜群！",
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
      id: "ff-2",
      name: "プロ仕様 剪定バサミ（疲れにくい軽量グリップ）",
      category: "🚜 作り手のガチ愛用品",
      discoverer: "高槻みかん農園 たなか",
      discovererId: "fr-1",
      pairing: "果樹園の収穫効率UP＆農家さんへのギフトにも◎",
      url: "https://search.rakuten.co.jp/search/mall/剪定バサミ+軽量/",
      stats: { op: 2, disc: 1, maker: 1 },
      lastRouteMsg: "",
      reviews: [
        { id: "rv-4", author: "高槻みかん農園 たなか", authorId: "fr-1", text: "1日5時間切っても手が痛くならない。3年使っても刃こぼれなし！", likes: 8, applied: 4 }
      ]
    },
    {
      id: "ff-3",
      name: "楽天の神・厚切りバター食パン（冷凍お取り寄せ）",
      category: "🍽️ 掛け合わせ神商品",
      discoverer: "ねやがわ農園 佐藤",
      discovererId: "me",
      pairing: "「規格外みかんの大人クラフトジャム」を塗ると最高！",
      url: "https://search.rakuten.co.jp/search/mall/厚切り+バター食パン+お取り寄せ/",
      stats: { op: 3, disc: 1, maker: 2 },
      lastRouteMsg: "",
      reviews: [
        { id: "rv-5", author: "ねやがわ農園 佐藤", authorId: "me", text: "試食会でこの食パンにみかんジャムを塗ったら全員おかわりしました！", likes: 11, applied: 5 }
      ]
    }
  ],

  matureProfile: {
    registered: true,
    mainRole: "material",
    otherRoleText: "",
    otherPushOk: true,
    activities: ["果樹・フルーツ", "規格外品の提供", "マルシェ出店"],
    subRoles: ["deliver"],
    subRoleExploring: false,
    customSubRoles: [],
    userStage: "maker",
    accountType: "team",
    photoDataUrl: "",
    photoPendingReview: false,
    favoritePhotos: [],
    profileBio: "大阪・寝屋川＆高槻エリアで旬のフルーツを育てています！規格外素材を使った無添加コラボや週末マルシェ出店を進めています。",
    displayName: "ねやがわ農園 佐藤",
    ageGroup: "30代",
    exactAge: "36",
    area: "大阪府 寝屋川市 香里園",
    areaGranularity: "broad",
    interests: ["規格外品の活用", "小ロット試作", "マルシェ出店"],
    referralCode: "",
    capacityTags: ["週30〜50kgまで供給可", "規格外・B品の定期提供OK", "サンプル発送OK"],
    capacity: "完熟みかん・いちごを季節ごとに週30〜50kg供給できます",
    pride: "糖度14度以上の完熟フルーツを家族で丁寧に育てています。",
    prideVisibility: "public",
    secretPride: "試作1回目の規格外B品は材料実費のみで提供OKです！",
    products: [
      { id: 101, title: "完熟みかんの大人クラフトジャム", icon: "🍯", note: "EN•ラボ巣立ち第1号（120g）", url: "" },
      { id: 102, title: "関西マルシェ出店予定", icon: "🌐", note: "大阪・京都の週末マルシェ", url: "" }
    ],
    ideaMemo: "", seekingPartners: [], ideaNote: "", connectBio: "", fanGenres: [], fanMonitorOk: true, fanMessage: "",
    companyName: "ねやがわ農園",
    phone: "090-1234-5678",
    teamCode: "EN-TM420",
    teamMembers: [
      { id: "tm-1", name: "佐藤 健太", role: "代表・栽培", phone: "090-1234-5678", isPrimary: true },
      { id: "tm-2", name: "佐藤 彩", role: "マルシェ・SNS窓口", phone: "", isPrimary: false }
    ],
    activeSpeakerId: "tm-1"
  },

  matureProjects: [
    {
      id: "proj-mature-1",
      isSample: false,
      stage: 3,
      title: "規格外みかんの大人クラフトジャム",
      goal: "見た目だけ訳ありの完熟みかん50kgを活かし、常温手土産になる120g小瓶ジャムを初回50個テスト販売！",
      area: "大阪府 高槻市・寝屋川市",
      tag: "小ロット試作OK",
      kindTabs: ["新商品開発", "規格外レスキュー"],
      media: null,
      pieces: [
        { id: "material", icon: "🌾", label: "素材", status: "filled", memberName: "ねやがわ農園 佐藤" },
        { id: "make", icon: "🍳", label: "形にする", status: "filled", memberName: "菓子工房ハレ" },
        { id: "pack", icon: "🎨", label: "整える包む", status: "filled", memberName: "デザイン室キノ" },
        { id: "deliver", icon: "🏪", label: "届ける試す", status: "open", memberName: "" }
      ],
      todos: [
        { id: "td-1", title: "完熟みかん50kgのサンプル発送", date: "2026-11-29", done: true },
        { id: "td-2", title: "120g六角小瓶50個を50:50経由で発注", date: "2026-12-02", done: false },
        { id: "td-3", title: "試作ジャム糖度45%・55%の試食会", date: "2026-12-06", done: false }
      ],
      votes: [
        {
          id: "vt-1",
          title: "初回50瓶のラベルデザイン、どっちでいく？",
          deadline: "2026-12-04",
          memberApproved: 3,
          memberTotal: 3,
          isPublic: true,
          options: [
            { id: "vo-1", label: "🌿 和モダン手描き風（農家さん推し）", votes: 6 },
            { id: "vo-2", label: "🎁 シックな手土産ギフト風", votes: 2 }
          ],
          myChoice: "vo-1"
        }
      ],
      boards: {
        active: ["vote", "calc", "concept", "proto", "label", "sales", "links"],
        concept: "ターゲット：30〜50代の関西手土産層。皮のほろ苦さを残した無添加・常温120g小瓶。",
        proto: "第2回試作：糖度45%・レモン果汁3%で爽やかさ抜群。次回12/06に最終試食。",
        label: "原材料：みかん(大阪産)、粗糖、国産レモン果汁 ／ アレルゲン：なし ／ 常温180日 ／ 120g六角小瓶",
        sales: "①EN•joy先行予約30個（売れ残りゼロ）→ ②12/20大阪週末マルシェで20個テスト販売",
        links: "耐熱120g六角小瓶（50:50登録済）"
      },
      calendarExtras: [
        { id: "ce-1", type: "road", date: "2026-12-20", title: "大阪週末マルシェ 初テスト販売", sourceTab: "todo" }
      ],
      members: [
        { roleLabel: "🌾 素材（発起人）", card: null },
        {
          roleLabel: "🍳 形にする",
          card: {
            mainRole: "make", userStage: "maker", accountType: "team", subRoles: [],
            activities: ["ジャム・ソース加工", "小ロット試作OK"],
            displayName: "菓子工房ハレ", ageGroup: "30代", area: "大阪府 茨木市 駅前", areaGranularity: "broad",
            capacity: "50〜200瓶の小ロット対応", pride: "低温炊き上げで果実の香りを残します", prideVisibility: "public",
            companyName: "合同会社ハレ工房", phone: "072-000-1122"
          }
        },
        {
          roleLabel: "🎨 整える包む",
          card: {
            mainRole: "pack", userStage: "skill", accountType: "solo", subRoles: [],
            activities: ["パッケージデザイン", "ラベル・小ロット印刷"],
            displayName: "デザイン室キノ", ageGroup: "30代", area: "京都府 京都市 左京区", areaGranularity: "broad",
            capacity: "小ロット50枚〜ラベル印刷OK", pride: "和モダンで手に取りやすい食品パッケージ", prideVisibility: "public",
            companyName: "デザイン室キノ", phone: "080-9876-5432"
          }
        }
      ],
      applicants: [
        {
          id: "app-m1",
          roleId: "deliver",
          roleLabel: "🏪 届ける試す",
          message: "大阪の週末マルシェと古民家セレクト棚で初回テスト販売をお手伝いできます！",
          card: {
            mainRole: "deliver", userStage: "skill", accountType: "solo", subRoles: [],
            activities: ["マルシェ出店", "店舗でのテスト販売"],
            displayName: "マルシェ設計室ミナミ", ageGroup: "30代", area: "大阪府 大阪市 中央区", areaGranularity: "broad",
            capacity: "週末マルシェ月2回開催", pride: "作り手のストーリーを伝える店頭POPが得意", prideVisibility: "public",
            companyName: "マルシェ設計室ミナミ", phone: "080-5555-1212"
          }
        }
      ],
      messages: [
        { id: "mm-1", who: "sys", sender: "システム", text: "🎉 EN•ラボがスタートしました！", pinned: false, time: "10:00" },
        { id: "mm-2", who: "other", sender: "菓子工房ハレ", text: "糖度45%のほろ苦仕上げで試作完了！12/06の試食会で食べ比べしましょう🍊", pinned: true, dateTag: "2026-12-06", time: "14:20" },
        { id: "mm-3", who: "other", sender: "デザイン室キノ", text: "和モダン手描き風ラベルの校正データできました！12/20のマルシェに間に合います。", pinned: true, dateTag: null, time: "15:05" }
      ]
    },
    {
      id: "proj-mature-2",
      isSample: false,
      stage: 1,
      title: "宇治選別落ち茶葉の米粉フィナンシェ",
      goal: "香り高い一番茶の選別落ち茶葉×国産米粉で、グルテンフリーの京都手土産を小ロット開発！",
      area: "京都府 宇治市・京都市",
      tag: "試作仲間募集",
      kindTabs: ["新商品開発"],
      media: null,
      pieces: [
        { id: "material", icon: "🌾", label: "素材", status: "filled", memberName: "宇治茶ファーム 佐々木" },
        { id: "make", icon: "🍳", label: "形にする", status: "filled", memberName: "菓子工房ハレ" },
        { id: "pack", icon: "🎨", label: "整える包む", status: "open", memberName: "" }
      ],
      todos: [{ id: "td-21", title: "茶葉の微粉砕サンプル確認", date: "2026-12-08", done: false }],
      votes: [],
      boards: { active: ["vote", "calc", "concept"], concept: "グルテンフリー京都手土産（4個入BOX ¥1,100想定）", proto: "", label: "", sales: "", links: "" },
      calendarExtras: [],
      members: [],
      applicants: [],
      messages: [
        { id: "mm-21", who: "other", sender: "宇治茶ファーム 佐々木", text: "一番茶の選別落ち2kg送ります！12/08に試作テストお願いできますか？", pinned: true, dateTag: "2026-12-08", time: "18:10" }
      ]
    }
  ],

  matureFeeds: [
    { id: "mf-1", type: "rescue", authorId: "fr-1", author: "高槻みかん農園 たなか", roleIcon: "🌾", area: "大阪府 高槻市", deadline: "12/05まで", time: "15分前", text: "【🆘SOS】強風で少しキズがついた完熟みかん40kg！糖度14度で味は最高なので、ジャム試作や飲食店デザートで活かしてくださる方いませんか？🍊", media: null, likes: 12 },
    { id: "mf-2", type: "behind", authorId: "fr-2", author: "菓子工房ハレ", roleIcon: "🍳", area: "大阪府 茨木市", time: "2時間前", text: "【🎬開発の裏側】EN•ラボの多数決で決まった糖度45%のほろ苦みかんジャム、試作めちゃくちゃ美味しくできました！12/06の試食会が楽しみです✨", media: null, likes: 18 },
    { id: "mf-3", type: "voice", authorId: "fan-1", author: "食べるの大好き ゆうこ", roleIcon: "🛒", area: "京都府 京都市", time: "昨日", text: "【🗣️みんなの声】常温で日持ちして、ちょっとした手土産に配れる1000円以下の無添加ジャムがあったら絶対買いたい！", media: null, likes: 15 }
  ]
};

// 「使い込みモード」が初回空なら自動で充実データを投入（app.js読み込み前に完了させる）
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
  EnjoyStore.save(STORAGE_KEYS.FEEDS, JSON.parse(JSON.stringify(ENJOY_V6_DATA.matureFeeds)));
  EnjoyStore.save(V6_STORAGE_KEYS.FRIENDS, JSON.parse(JSON.stringify(ENJOY_V6_DATA.matureFriends)));
  EnjoyStore.save(V6_STORAGE_KEYS.EC_PRODUCTS, JSON.parse(JSON.stringify(ENJOY_V6_DATA.initialEcProducts)));
  EnjoyStore.save(V6_STORAGE_KEYS.FIFTY_ITEMS, JSON.parse(JSON.stringify(ENJOY_V6_DATA.matureFiftyItems)));
  EnjoyStore.save(V6_STORAGE_KEYS.NENRIN, JSON.parse(JSON.stringify(ENJOY_V6_DATA.matureNenrin)));
  EnjoyStore.save(V6_STORAGE_KEYS.EN_META, JSON.parse(JSON.stringify(ENJOY_V6_DATA.matureEnMeta)));
  EnjoyStore.save(V6_STORAGE_KEYS.LOGS, {
    anonId: "TEST-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
    events: [
      { time: "19:12", tab: "shop", type: "50:50クリック", detail: "120g六角小瓶 -> 👑発掘者5%枠" },
      { time: "19:08", tab: "en-room", type: "カレンダー切替", detail: "ルームカレンダー表示" }
    ],
    clicksByTab: { home: 4, feed: 3, en: 5, tips: 2, shop: 4 },
    hesitations: 0,
    discordWebhook: ""
  });
})();
// === v6_data.js ここまで ===