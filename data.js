/* =========================================================
   EN•joy Stage 1 マスターデータ ＆ ストレージ層 (v5)
   - 登録フロー刷新（順番変更・5タイプ出し分け・1人/複数人チーム）
   - 活動検索用マスター・役割別ガイド文言
   - 将来 Supabase / Firebase へ移行する際はこの層を差し替えるだけでOK
========================================================= */

const ENJOY_DATA = {
  roles: [
    { id: "material", icon: "🌾", title: "素材・つくる", sub: "農家・酪農・漁師" },
    { id: "make", icon: "🍳", title: "形にする", sub: "加工所・菓子工房・OEM" },
    { id: "pack", icon: "🎨", title: "整える・包む", sub: "デザイン・印刷・企画" },
    { id: "deliver", icon: "🏪", title: "届ける・試す", sub: "販売・道の駅・マルシェ" },
    { id: "buy", icon: "🛒", title: "応援・買う", sub: "食べる・試す・広める" },
    { id: "other", icon: "✨", title: "その他", sub: "上記にない特技・業種" }
  ],

  // 子階層（具体的な活動）：画面に最初から並ぶ定番リスト
  activitiesByRole: {
    material: ["露地野菜", "果樹・フルーツ", "米・穀物", "規格外品の提供", "ハーブ・お茶", "養蜂・畜産", "きのこ・山菜", "水産・海産物"],
    make: ["ジャム・ソース加工", "焼き菓子・スイーツ", "冷凍食品・惣菜", "小ロット試作OK", "シェアキッチン運営", "発酵・飲料", "乾燥・ドライ加工", "レトルト・瓶詰め"],
    pack: ["パッケージデザイン", "ラベル・小ロット印刷", "商品撮影・動画", "ネーミング・企画", "ECサイト制作", "SNS発信サポート", "コピーライティング", "店頭POP制作"],
    deliver: ["マルシェ出店", "店舗でのテスト販売", "ギフト企画", "道の駅・百貨店販路", "ポップアップ運営", "飲食店メニュー導入", "無人販売・自販機", "地域イベント販売"],
    buy: ["試食モニター参加", "予約早割で応援", "SNSレビュー発信", "地元マルシェ巡り", "お取り寄せ好き", "フードロス応援"],
    other: ["地域イベント企画", "福祉事業所との連携", "木工・クラフト什器", "動画制作・編集", "栄養・レシピ監修", "冷蔵・配送サポート"]
  },

  // 子階層（具体的な活動）：「すべてのタブを見る」で追加検索できる詳細リスト
  extendedActivitiesByRole: {
    material: ["有機・減農薬栽培", "柑橘・みかん", "いちご・ベリー", "さつまいも・根菜", "卵・乳製品", "ジビエ・精肉", "花き・エディブルフラワー", "竹林・間伐材"],
    make: ["アイス・ジェラート", "パン・ベーカリー", "和菓子・あんこ", "スパイス・カレー", "ドレッシング・調味料", "漬物・佃煮", "クラフトビール・酒類", "ペットフード加工"],
    pack: ["化粧箱・貼り箱設計", "ロゴ・ブランド設計", "イラスト・キャラクター", "動画リール編集", "クラファンページ制作", "成分表示・食品ラベル相談", "展示会ブース装飾", "リーフレット制作"],
    deliver: ["百貨店催事", "ホテル・旅館向け卸", "法人ノベルティ・手土産", "サブスク・定期便", "海外輸出・インバウンド", "キッチンカー販売", "カフェ・喫茶店併設", "ふるさと納税出品"],
    buy: ["現地収穫体験に参加", "クラウドファンディング応援", "ギフト購入が多い", "無添加・オーガニック派", "子育て世帯向け探し", "お酒のおつまみ探し"],
    other: ["食品衛生・表示アドバイス", "クラウドファンディング伴走", "補助金・事業計画サポート", "翻訳・インバウンド対応", "倉庫・冷蔵保管", "キッチンカー製作・レンタル"]
  },

  // 親階層（掛け持ち・兼業）：「すべてのタブを見る」で探せる業種・役割カタログ（子階層の具体活動とは完全分離）
  subRoleCatalog: [
    {
      category: "🎨 クリエイティブ・発信系",
      items: [
        "写真・動画クリエイター",
        "デザイナー・イラストレーター",
        "ライター・編集者",
        "SNS・Webマーケター",
        "ECサイト運営者"
      ]
    },
    {
      category: "🪵 ものづくり・空間・資材系",
      items: [
        "木工・クラフト什器職人",
        "陶芸・器作家",
        "包材・箱・印刷会社",
        "店舗内装・空間デザイナー",
        "キッチンカー運営"
      ]
    },
    {
      category: "🤝 地域・専門サポート系",
      items: [
        "マルシェ・イベント主催者",
        "福祉事業所・就労支援",
        "栄養士・フードコーディネーター",
        "冷蔵・冷凍物流パートナー",
        "飲食店・カフェオーナー",
        "補助金・ブランディング相談"
      ]
    }
  ],

  // 案2：役割別の自由入力ガイド（何を書けばいいか迷わない）
  activityGuidesByRole: {
    material: {
      label: "育てている作物・素材があれば（任意）",
      placeholder: "例：完熟いちご、原木しいたけ、規格外みかん、平飼い卵"
    },
    make: {
      label: "作れるもの・得意な加工があれば（任意）",
      placeholder: "例：ジェラート製造、グルテンフリー焼菓子、小ロット瓶詰め"
    },
    pack: {
      label: "得意な制作物・サポート内容があれば（任意）",
      placeholder: "例：和紙ラベル印刷、ショート動画編集、ロゴ・箱デザイン"
    },
    deliver: {
      label: "持っている売り場・届け方があれば（任意）",
      placeholder: "例：京都の古民家カフェ、週末マルシェ運営、法人ギフト提案"
    },
    buy: {
      label: "特に好きなジャンル・応援したいこと（任意）",
      placeholder: "例：無添加ジャム、ご当地スイーツ、農家さんの裏話を見るのが好き"
    },
    other: {
      label: "お持ちの特技・関わり方があれば（任意）",
      placeholder: "例：木製ディスプレイ制作、地域の福祉連携、カメラ撮影"
    }
  },

  // 案3：まだ決まっていない人用の共通チップ
  exploringActivityLabel: "💡 まだ模索中・これから決めたい",

  // Step 2 下部：「今のあなたに一番近いのは？」（5タイプ出し分け）
  userStages: [
    {
      id: "maker",
      icon: "🏭",
      title: "すでに作っている",
      sub: "農家・工房・メーカー（素材や商品を活かしたい）",
      step3Title: "自慢の素材・商品・設備を教えてください",
      step3Desc: "最初の熱量そのままに、強みや作れる量をサッと入れましょう（あとから編集OK）。"
    },
    {
      id: "idea",
      icon: "💡",
      title: "作りたい・アイデアあり",
      sub: "構想はあるけど加工先や仲間を探している",
      step3Title: "作りたいアイデア・探している仲間を教えてください",
      step3Desc: "まだぼんやりでも大丈夫！頭の中のイメージを書くと仲間が見つかりやすくなります。"
    },
    {
      id: "skill",
      icon: "🎨",
      title: "技術や販路で力になりたい",
      sub: "デザイン・印刷・販売・マルシェなどでコラボしたい",
      step3Title: "得意な技術・対応できる規模を教えてください",
      step3Desc: "「小ロットから相談OK」など、作り手が安心できる強みを書いてみましょう。"
    },
    {
      id: "connect",
      icon: "🤝",
      title: "まずは面白い人と出会いたい",
      sub: "まだ具体的に決まってない・異業種と繋がりたい",
      step3Title: "興味のあるジャンル・ひとことを教えてください",
      step3Desc: "設備や実績の入力は不要です。気軽に話せるきっかけだけ置いておきましょう。"
    },
    {
      id: "fan",
      icon: "🛒",
      title: "応援したい・買いたい",
      sub: "試食や開発の裏側を楽しみたい・商品を買いたい",
      step3Title: "好きな食べ物・応援したいジャンルを教えてください",
      step3Desc: "事業者向けの難しい入力はすべて省略しました！好きなものをタップするだけでOKです。"
    }
  ],

  // 役割からおすすめタイプへの初期マッピング
  defaultStageByRole: {
    material: "maker",
    make: "maker",
    pack: "skill",
    deliver: "skill",
    buy: "fan",
    other: "connect"
  },

  ageGroups: ["20代", "30代", "40代", "50代", "60代〜"],

  interests: [
    "規格外品の活用",
    "小ロット試作",
    "パッケージ刷新",
    "季節限定コラボ",
    "マルシェ出店",
    "販路拡大",
    "地域ブランドづくり"
  ],

  fanGenres: [
    "フルーツ・ジャム",
    "焼き菓子・スイーツ",
    "旬の野菜・お米",
    "発酵・クラフト飲料",
    "お取り寄せギフト",
    "フードロス・農家レスキュー"
  ],

  seekingPartners: [
    "🌾 素材（農家・生産者）",
    "🍳 形にする（加工・工房・OEM）",
    "🎨 整える・包む（デザイン・印刷）",
    "🏪 届ける・試す（販売・マルシェ）",
    "💬 まずは一緒に企画を練る仲間"
  ],

  capacityQuickChips: [
    "小ロット試作OK（30個〜）",
    "週30〜50kgまで供給可",
    "冷凍設備あり",
    "真空パック機あり",
    "食品衛生許可キッチンあり"
  ],

  skillQuickChips: [
    "小ロット50枚〜印刷OK",
    "パッケージデザイン1点〜OK",
    "週末マルシェでテスト販売可",
    "商品撮影・動画制作OK",
    "オンライン初回相談無料"
  ],

  // Step 3 規模・設備・得意なこと用の共通「模索中」＆全タブ検索マスタ
  exploringCapacityLabel: "💡 まだ模索中・これから相談したい",

  capacitiesByCategory: [
    {
      category: "🌾 生産・供給量（農家・生産者）",
      items: [
        "週10〜30kgまで供給可",
        "週30〜50kgまで供給可",
        "規格外・B品の定期提供OK",
        "季節限定でまとまった量OK",
        "サンプル発送OK"
      ]
    },
    {
      category: "🍳 加工設備・小ロット試作",
      items: [
        "小ロット試作OK（30個〜）",
        "冷凍設備・急速冷凍あり",
        "真空パック機あり",
        "食品衛生許可キッチンあり",
        "瓶詰め・加熱殺菌設備あり",
        "焼き菓子・オーブン設備あり"
      ]
    },
    {
      category: "🎨 デザイン・制作・PR",
      items: [
        "小ロット50枚〜印刷OK",
        "パッケージデザイン1点〜OK",
        "商品撮影・動画制作OK",
        "ロゴ・ネーミング提案OK",
        "SNS・LP発信サポートOK",
        "オンライン初回相談無料"
      ]
    },
    {
      category: "🏪 販路・テスト販売・物流",
      items: [
        "週末マルシェでテスト販売可",
        "実店舗の棚でテスト販売OK",
        "ギフト・手土産提案OK",
        "冷蔵・冷凍配送対応可",
        "試食イベントスペースあり"
      ]
    }
  ],

  // チームコードによる入力省略テスト用マスタ（複数人チーム用）
  sampleStaffCodes: {
    "EN-TK88": {
      accountType: "team",
      displayName: "高槻みかん農園 たなか",
      ageGroup: "40代",
      area: "大阪府 高槻市 富田町",
      companyName: "株式会社たなか農園",
      phone: "090-1234-5678",
      capacity: "完熟みかん週50kgまで / 真空パック機あり",
      pride: "糖度14度以上の減農薬みかんを家族で丁寧に育てています。",
      secretPride: "規格外B品（見た目のみ訳あり）の卸値相談OKです。",
      teamMembers: [
        { id: "tm-1", name: "田中 健太", role: "代表・栽培", phone: "090-1234-5678", isPrimary: true },
        { id: "tm-2", name: "田中 由美", role: "企画・販売窓口", phone: "", isPrimary: false }
      ]
    }
  },

  // 初期状態は「0件＋点線イメージ見本1個だけ」ルール
  sampleProjectTemplate: {
    id: "sample-01",
    isSample: true,
    stage: 1,
    title: "【見本】規格外みかんの大人クラフトジャム",
    goal: "見た目だけ訳ありの完熟みかんを活かし、手土産になる小瓶ジャムをまず50個試作したい！",
    area: "大阪府 高槻市",
    tag: "小ロット試作OK",
    kindTabs: ["新商品開発", "規格外レスキュー"],
    media: null,
    pieces: [
      { id: "material", icon: "🌾", label: "素材", status: "filled", memberName: "たなか農園" },
      { id: "make", icon: "🍳", label: "形にする", status: "open", memberName: "" },
      { id: "pack", icon: "🎨", label: "整える包む", status: "filled", memberName: "デザイン室キノ" },
      { id: "deliver", icon: "🏪", label: "届ける試す", status: "open", memberName: "" }
    ],
    ownerCard: {
      mainRole: "material",
      userStage: "maker",
      accountType: "team",
      subRoles: [],
      activities: ["果樹・フルーツ", "規格外品の提供"],
      displayName: "たなか農園（見本）",
      ageGroup: "40代",
      area: "大阪府 高槻市 富田町",
      areaGranularity: "broad",
      capacity: "完熟みかん週50kgまで / 真空パック機あり",
      pride: "糖度14度以上の減農薬みかんを家族で丁寧に育てています。",
      prideVisibility: "public",
      companyName: "株式会社たなか農園",
      phone: "090-1234-5678",
      teamCode: "EN-TK88",
      teamMembers: [
        { id: "tm-s1", name: "田中 健太", role: "代表", phone: "090-1234-5678", isPrimary: true }
      ],
      secretPride: "B品みかん50kgまで試作提供できます！"
    },
    members: [
      {
        roleLabel: "🌾 素材",
        card: {
          mainRole: "material",
          userStage: "maker",
          accountType: "team",
          subRoles: [],
          activities: ["果樹・フルーツ", "規格外品の提供"],
          displayName: "たなか農園（見本）",
          ageGroup: "40代",
          area: "大阪府 高槻市 富田町",
          areaGranularity: "broad",
          capacity: "完熟みかん週50kgまで",
          pride: "糖度14度以上の減農薬みかん",
          prideVisibility: "public",
          companyName: "株式会社たなか農園",
          phone: "090-1234-5678",
          teamCode: "EN-TK88",
          teamMembers: [
            { id: "tm-s1", name: "田中 健太", role: "代表", phone: "090-1234-5678", isPrimary: true }
          ],
          secretPride: "B品みかん50kgまで試作提供できます！"
        }
      },
      {
        roleLabel: "🎨 整える包む",
        card: {
          mainRole: "pack",
          userStage: "skill",
          accountType: "solo",
          subRoles: [],
          activities: ["パッケージデザイン", "ラベル・小ロット印刷"],
          displayName: "デザイン室キノ（見本）",
          ageGroup: "30代",
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
          userStage: "maker",
          accountType: "team",
          subRoles: [],
          activities: ["ジャム・ソース加工", "小ロット試作OK"],
          displayName: "菓子工房ハレ（応募サンプル）",
          ageGroup: "30代",
          area: "大阪府 茨木市 駅前",
          areaGranularity: "broad",
          capacity: "1回50〜200瓶の小ロット対応・食品衛生許可キッチンあり",
          pride: "果実本来の香りを残す低温炊き上げが得意です。",
          prideVisibility: "public",
          companyName: "合同会社ハレ工房",
          phone: "072-000-1122",
          teamMembers: [
            { id: "tm-h1", name: "佐藤 美咲", role: "代表・製造", phone: "072-000-1122", isPrimary: true }
          ],
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
        sender: "たなか農園（田中 健太）",
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
  PROFILE: "enjoy_stage1_profile_v4",
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
