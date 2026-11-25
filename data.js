/* =========================================================
   EN•joy Stage 1 マスターデータ ＆ ストレージ層 (v2)
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

  // 初期状態は「0件＋点線イメージ見本1個だけ」ルール（2社開始＋途中EN追加・固定メモ対応）
  sampleProjectTemplate: {
    id: "sample-01",
    isSample: true,
    stage: 1, // 1:仲間あつめ 2:方向性づくり 3:試作・仕上げ
    title: "【見本】規格外みかんの大人クラフトジャム",
    goal: "見た目だけ訳ありの完熟みかんを活かし、手土産になる小瓶ジャムをまず50個試作したい！",
    area: "大阪府 高槻市",
    tag: "小ロット試作OK",
    kindTabs: ["新商品開発", "規格外レスキュー"],
    media: null,
    // 2社（農家＋工房）から即スタートでき、必要なタイミングで途中EN追加できる配列形式
    pieces: [
      { id: "material", icon: "🌾", label: "素材", status: "filled", memberName: "たなか農園" },
      { id: "make", icon: "🍳", label: "形にする", status: "open", memberName: "" },
      { id: "pack", icon: "🎨", label: "整える包む", status: "filled", memberName: "デザイン室キノ" },
      { id: "deliver", icon: "🏪", label: "届ける試す", status: "open", memberName: "" }
    ],
    ownerCard: {
      mainRole: "material",
      subRoles: [],
      activities: ["果樹・フルーツ", "規格外品の提供"],
      displayName: "たなか農園（見本）",
      ageGroup: "40代",
      position: "ceo",
      staffName: "田中 健太",
      staffCode: "EN-TK88",
      area: "大阪府 高槻市 富田町",
      areaGranularity: "broad",
      capacity: "完熟みかん週50kgまで / 真空パック機あり",
      pride: "糖度14度以上の減農薬みかんを家族で丁寧に育てています。",
      prideVisibility: "public",
      companyName: "株式会社たなか農園",
      phone: "090-1234-5678",
      secretPride: "B品みかん50kgまで試作提供できます！"
    },
    members: [
      {
        roleLabel: "🌾 素材",
        card: {
          mainRole: "material",
          subRoles: [],
          activities: ["果樹・フルーツ", "規格外品の提供"],
          displayName: "たなか農園（見本）",
          ageGroup: "40代",
          position: "ceo",
          staffName: "田中 健太",
          staffCode: "EN-TK88",
          area: "大阪府 高槻市 富田町",
          areaGranularity: "broad",
          capacity: "完熟みかん週50kgまで",
          pride: "糖度14度以上の減農薬みかん",
          prideVisibility: "public",
          companyName: "株式会社たなか農園",
          phone: "090-1234-5678",
          secretPride: "B品みかん50kgまで試作提供できます！"
        }
      },
      {
        roleLabel: "🎨 整える包む",
        card: {
          mainRole: "pack",
          subRoles: [],
          activities: ["パッケージデザイン", "ラベル・小ロット印刷"],
          displayName: "デザイン室キノ（見本）",
          ageGroup: "30代",
          position: "solo",
          area: "京都府 京都市 左京区",
          areaGranularity: "broad",
          capacity: "小ロット50枚からのラベル手配OK",
          pride: "和モダンで手に取りやすい食品パッケージが得意です。",
          prideVisibility: "public",
          companyName: "デザイン室キノ",
          phone: "080-9876-5432",
          secretPride: "初回テスト品はデザイン費ご相談に乗ります"
        }
      }
    ],
    applicants: [
      {
        id: "app-demo-1",
        roleId: "make",
        roleLabel: "🍳 形にする",
        message: "小ロット試作で力になれます！うちの工房なら50瓶から無添加ジャムのテスト製造が可能です。まずはみかんサンプルを拝見したいです！",
        card: {
          mainRole: "make",
          subRoles: [],
          activities: ["ジャム・ソース加工", "小ロット試作OK"],
          displayName: "菓子工房ハレ（応募サンプル）",
          ageGroup: "30代",
          position: "ceo",
          staffName: "佐藤 美咲",
          staffCode: "EN-HR22",
          area: "大阪府 茨木市 駅前",
          areaGranularity: "broad",
          capacity: "1回50〜200瓶の小ロット対応・食品衛生許可キッチンあり",
          pride: "果実本来の香りを残す低温炊き上げが得意です。",
          prideVisibility: "public",
          companyName: "合同会社ハレ工房",
          phone: "072-000-1122",
          secretPride: "試作1回目の加工費は材料実費のみで対応できます"
        }
      }
    ],
    messages: [
      {
        id: "m-1",
        who: "sys",
        sender: "システム",
        text: "🎉 開発室がスタートしました！（2社から開始OK・必要なタイミングで他のENも追加募集できます）",
        pinned: false,
        time: "10:00"
      },
      {
        id: "m-2",
        who: "other",
        sender: "たなか農園",
        text: "皮に少しキズがあるだけで糖度14度の完熟みかんが来月50kg出ます！皮の香りも活かした大人向けジャムにしたいです🍊",
        pinned: true,
        time: "10:05"
      },
      {
        id: "m-3",
        who: "other",
        sender: "デザイン室キノ",
        text: "いいですね！初回は120g小瓶で50個テスト製造、1月の関西マルシェでお披露目を目指すのはどうでしょう？",
        pinned: true,
        time: "10:12"
      }
    ]
  },

  // つぶやき＆動画タブの初期見本（一般＆農家レスキューのイメージ確認用）
  initialFeedSamples: [
    {
      id: "feed-sample-1",
      type: "rescue",
      author: "たなか農園（見本）",
      roleIcon: "🌾",
      area: "大阪府 高槻市",
      time: "2時間前",
      text: "【農家レスキュー見本】冷え込み前に急いで収穫した完熟みかんが約50kg余りそうです🍊 味はバッチリなので、ジャム試作・飲食店デザート・店頭販売で助けてくださる方いませんか？",
      media: null,
      likes: 4,
      isSample: true
    },
    {
      id: "feed-sample-2",
      type: "general",
      author: "食べるの大好き ゆうこ（見本）",
      roleIcon: "🛒",
      area: "京都府 京都市",
      time: "5時間前",
      text: "地元の規格外フルーツを使った無添加クラフトジャム、手土産に買いたいな〜！開発の様子が見られるのワクワクします✨",
      media: null,
      likes: 6,
      isSample: true
    }
  ]
};

const STORAGE_KEYS = {
  PROFILE: "enjoy_stage1_profile_v1",
  PROJECTS: "enjoy_stage1_projects_v2",
  OFFERS: "enjoy_stage1_offers_v2",
  MATCHES: "enjoy_stage1_matches_v2",
  WANTS: "enjoy_stage1_wants_v1",
  FEEDS: "enjoy_stage1_feeds_v2",
  SAMPLE_STATE: "enjoy_stage1_sample_room_v2"
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
      console.warn("保存スキップ（容量超過等）:", e);
    }
  }
};