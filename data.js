/* =========================================================
   EN•joy Stage 1 マスターデータ ＆ ストレージ層
   ※将来 Supabase / Firebase へ移行する際はこの層を差し替えるだけでOK
========================================================= */

const ENJOY_DATA = {
  roles: [
    { id: "material", icon: "🌾", title: "素材・つくる", sub: "農家・酪農・漁師・生産者" },
    { id: "make", icon: "🍳", title: "形にする", sub: "加工所・菓子工房・飲食店・OEM" },
    { id: "pack", icon: "🎨", title: "整える・包む", sub: "デザイン・印刷・企画・写真" },
    { id: "deliver", icon: "🏪", title: "届ける・試す", sub: "販売・道の駅・マルシェ・バイヤー" },
    { id: "buy", icon: "🛒", title: "応援・買う", sub: "食べる・試す・SNSで広める" },
    { id: "other", icon: "✨", title: "その他", sub: "上記にない新しい業種・特技" }
  ],

  activitiesByRole: {
    material: ["露地野菜", "果樹・フルーツ", "米・穀物", "規格外品の提供", "ハーブ・お茶", "養蜂・畜産"],
    make: ["ジャム・ソース加工", "焼き菓子・スイーツ", "冷凍食品・惣菜", "小ロット試作OK", "シェアキッチン運営", "発酵・飲料"],
    pack: ["パッケージデザイン", "ラベル・小ロット印刷", "商品撮影", "ネーミング・企画", "ECサイト制作", "SNS発信サポート"],
    deliver: ["マルシェ出店", "店舗でのテスト販売", "ギフト企画", "道の駅・百貨店販路", "ポップアップ運営", "飲食店メニュー導入"],
    buy: ["試食モニター参加", "予約早割で応援", "SNSレビュー発信", "地元イベント参加"],
    other: ["地域イベント企画", "福祉事業所との連携", "木工・クラフト什器", "動画制作"]
  },

  ageGroups: ["20代", "30代", "40代", "50代", "60代〜"],

  positions: [
    { id: "ceo", label: "👑 社長・代表" },
    { id: "staff", label: "🤝 担当者" },
    { id: "solo", label: "🌱 個人・フリー" }
  ],

  interests: [
    "規格外品の活用",
    "小ロット試作",
    "パッケージ刷新",
    "季節限定コラボ",
    "マルシェ出店",
    "販路拡大",
    "地域ブランドづくり"
  ],

  capacityQuickChips: [
    "小ロット試作OK（30個〜）",
    "週30〜50kgまで供給可",
    "冷凍設備あり",
    "真空パック機あり",
    "食品衛生許可キッチンあり"
  ],

  // 担当者コードによる入力省略テスト用マスタ
  sampleStaffCodes: {
    "EN-TK88": {
      displayName: "高槻みかん農園 たなか",
      ageGroup: "40代",
      position: "staff",
      staffName: "田中 健太",
      area: "大阪府 高槻市 富田町",
      companyName: "株式会社たなか農園",
      phone: "090-1234-5678",
      capacity: "完熟みかん週50kgまで / 真空パック機あり",
      pride: "糖度14度以上の減農薬みかんを家族で丁寧に育てています。",
      secretPride: "規格外B品（見た目のみ訳あり）の卸値相談OKです。"
    }
  },

  // 初期状態は「0件＋点線イメージ見本1個だけ」ルール
  sampleProjectTemplate: {
    id: "sample-01",
    isSample: true,
    title: "【見本】規格外みかんの大人クラフトジャム",
    goal: "見た目だけ訳ありの完熟みかんを活かし、手土産になる小瓶ジャムをまず50個試作したい！",
    area: "大阪府 高槻市",
    tag: "小ロット試作OK",
    pieces: {
      material: { status: "filled", label: "素材", by: "たなか農園" },
      make: { status: "open", label: "形にする" },
      pack: { status: "filled", label: "整える包む", by: "デザイン室キノ" },
      deliver: { status: "open", label: "届ける試す" }
    },
    ownerCard: {
      displayName: "たなか農園（見本）",
      ageGroup: "40代",
      position: "ceo",
      staffName: "田中 健太",
      staffCode: "EN-TK88",
      area: "大阪府 高槻市 富田町",
      companyName: "株式会社たなか農園",
      phone: "090-1234-5678",
      secretPride: "B品みかん50kgまで試作提供できます！"
    }
  }
};

const STORAGE_KEYS = {
  PROFILE: "enjoy_stage1_profile_v1",
  PROJECTS: "enjoy_stage1_projects_v1",
  OFFERS: "enjoy_stage1_offers_v1",
  MATCHES: "enjoy_stage1_matches_v1",
  WANTS: "enjoy_stage1_wants_v1"
};

const EnjoyStore = {
  load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("保存スキップ:", e);
    }
  }
};
