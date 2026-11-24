/* ============================================================
   EN•joy v5.0 — 初期データ & マスタ定義 (data.js)
   ※ユーザー編集データは localStorage('enjoy_v5_state') に保存されます
   ============================================================ */

window.ENJOY_VERSION = 'v5.0';
window.ENJOY_STORAGE_KEY = 'enjoy_v5_state';

/* ---------- 1. 開発資材レコメンド（運営100% × 採用で原価自動加算＆無料PR）(#9) ---------- */
window.ENJOY_MATERIALS = [
  {
    id: 'mat-jar-140',
    name: '耐熱ジャム瓶 140ml（ツイストキャップ付）',
    unitPrice: 78,
    desc: '脱気殺菌対応。ジャム・ペースト・ドレッシングの定番サイズ。',
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/ジャム瓶+140ml+耐熱/',
    amazonUrl: 'https://www.amazon.co.jp/s?k=ジャム瓶+140ml+耐熱'
  },
  {
    id: 'mat-pouch-craft',
    name: 'クラフト紙スタンドパック（窓付き・チャック付）',
    unitPrice: 32,
    desc: 'ドライフルーツ・焼き菓子・グラノーラが映える和モダン袋。',
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/クラフト+スタンドパック+窓付き/',
    amazonUrl: 'https://www.amazon.co.jp/s?k=クラフト+スタンドパック+窓付き'
  },
  {
    id: 'mat-label-washi',
    name: '耐水・和紙風ラベルシール（A4ノーカット）',
    unitPrice: 18,
    desc: '自宅プリンタで1枚から印刷OK。冷蔵商品でも剥がれにくい。',
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/耐水+和紙+ラベルシール/',
    amazonUrl: 'https://www.amazon.co.jp/s?k=耐水+和紙+ラベルシール'
  },
  {
    id: 'mat-box-gift',
    name: '京都・古民家風ギフト化粧箱（2本入）',
    unitPrice: 120,
    desc: 'EN•dressマルシェや手土産セットの単価アップに最適。',
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/ギフトボックス+クラフト+瓶/',
    amazonUrl: 'https://www.amazon.co.jp/s?k=ギフトボックス+クラフト+瓶'
  }
];

/* ---------- 2. 現場の神道具（50:50 みんなのマルシェ軍資金）(#9) ---------- */
window.ENJOY_TOOLS = [
  {
    id: 'tool-sealer',
    name: '卓上インパルスシーラー（20cm幅）',
    price: 3980,
    desc: '袋詰めが一瞬で綺麗に決まる。小ロット試作〜マルシェ出店の必須機。',
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/卓上+シーラー+20cm/',
    amazonUrl: 'https://www.amazon.co.jp/s?k=卓上+シーラー+20cm'
  },
  {
    id: 'tool-brix',
    name: 'デジタル糖度計（果物・ジャム試作用）',
    price: 4500,
    desc: 'レシピの再現性を上げる神アイテム。規格外果物の見極めにも。',
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/糖度計+デジタル/',
    amazonUrl: 'https://www.amazon.co.jp/s?k=糖度計+デジタル'
  },
  {
    id: 'tool-scale',
    name: '防水デジタルはかり（0.1g単位〜3kg）',
    price: 2280,
    desc: '原価管理と食品表示の正確な計量に。水洗いできて現場向き。',
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/防水+デジタルスケール+0.1g/',
    amazonUrl: 'https://www.amazon.co.jp/s?k=防水+デジタルスケール+0.1g'
  },
  {
    id: 'tool-wagon',
    name: '折りたたみキャリーワゴン（マルシェ搬入用）',
    price: 8900,
    desc: '軽トラからマルシェブースまでの往復を1回で終わらせる相棒。',
    rakutenUrl: 'https://search.rakuten.co.jp/search/mall/キャリーワゴン+折りたたみ/',
    amazonUrl: 'https://www.amazon.co.jp/s?k=キャリーワゴン+折りたたみ'
  }
];

/* ---------- 3. 努力型称号マスタ（％ゲージ連動）(#15) ---------- */
window.ENJOY_TITLES = [
  {
    id: 'title-heat-100',
    icon: '🔥',
    name: '本気の旗振り役',
    desc: 'プロフィールのAI熱量メーターを100%以上に到達させる',
    metric: 'heat',
    target: 100
  },
  {
    id: 'title-feed-3',
    icon: '📣',
    name: '現場の伝令係',
    desc: '広場で現場つぶやきを3回以上投稿する',
    metric: 'feedsPosted',
    target: 3
  },
  {
    id: 'title-story-5',
    icon: '🧪',
    name: '試作の鬼',
    desc: '開発ログ（ストーリー）を5回以上記録する',
    metric: 'storiesPosted',
    target: 5
  },
  {
    id: 'title-products-3',
    icon: '📦',
    name: '多産クリエイター',
    desc: 'ご縁ルーム内で合計3商品以上の企画を立ち上げる',
    metric: 'productsCount',
    target: 3
  },
  {
    id: 'title-cheer-5',
    icon: '🧡',
    name: 'ご縁の目利き',
    desc: '進行中プロジェクトへ5回以上リアクション・応援を送る',
    metric: 'cheersSent',
    target: 5
  },
  {
    id: 'title-cal-3',
    icon: '📅',
    name: '段取り名人',
    desc: 'メンバー共有カレンダーに3件以上予定を登録する',
    metric: 'calendarsAdded',
    target: 3
  }
];

/* ---------- 4. 番頭の勝手にご縁＆仮収支提案プール ---------- */
window.ENJOY_BANTO_PROPOSALS = [
  {
    title: '長野の規格外りんご × 大阪・町工場の低温ドライ加工',
    partner: '信州・青木りんご園 × なにわ乾燥工房',
    pitch: '傷ありりんご50kgを無添加チップス化。クラフト窓付き袋＋和紙ラベルでマルシェ映え抜群。',
    estCost: 210,
    estPrice: 580,
    estProfit: 370
  },
  {
    title: '高槻の朝採れトマト × 京都の老舗スパイス調合所',
    partner: 'たかつき太陽農園 × 鴨川スパイス舎',
    pitch: '完熟で出荷できない割れトマトを「食べるスパイスソース」に。140ml耐熱瓶で常温販売OK。',
    estCost: 260,
    estPrice: 680,
    estProfit: 420
  },
  {
    title: '間伐ヒノキ端材 × クラフト紙ラベル職人のコラボ香袋',
    partner: '丹波きこり組 × 紙工アトリエ縁',
    pitch: '食品以外の異業種コラボ案！マルシェのレジ横で「ついで買い」を狙える高粗利アイテム。',
    estCost: 140,
    estPrice: 500,
    estProfit: 360
  }
];

/* ---------- 5. 初期アプリ状態（デモデータ） ---------- */
window.createDefaultEnjoyState = function () {
  return {
    version: window.ENJOY_VERSION,
    focusMode: false,
    fontLarge: false,
    activeRoomId: 'room-1',
    activeProductId: 'prod-1',
    proposalIndex: 0,

    /* 運営お知らせバー (#19) */
    adminBanner: {
      enabled: true,
      type: 'release',
      text: 'EN•joy v5.0 公開！裏方番頭システム・1ご縁複数商品・原価資材連動をスマホで触ってみてください。'
    },

    /* 自分のプロフィール (#5) */
    profile: {
      name: 'あなた（EN•joy発起人）',
      role: 'デザイン・企画',
      area: '大阪府高槻市',
      skills: '企画設計・データ分析・Web仕組みづくり・現場ヒアリング',
      bio: '農家さんや町工場、さまざまな産業の「もったいない」と「技術」を繋いで、楽しく続く経済圏と京都の古民家セレクトショップ（EN•dress）を作っています。まずは小さな試作から一緒に楽しみましょう！',
      mapPublic: false
    },

    /* 個人4軸EXP (#15) */
    personalExp: {
      cheer: 120,
      field: 95,
      en: 150,
      craft: 110
    },

    /* 努力型称号用カウンタ */
    stats: {
      feedsPosted: 1,
      storiesPosted: 2,
      cheersSent: 2,
      calendarsAdded: 2
    },

    /* マルシェ軍資金（50:50連動） */
    fund: {
      current: 18500,
      goal: 30000,
      nextReward: '第1回 EN•dress マルシェ：出店者のテーブル・POP印刷費を全員無料化！'
    },

    /* 番頭：1分おかえりブリーフィング */
    bantoBriefs: [
      {
        id: 'br-1',
        kind: '🙋 参加オファー',
        text: '「蜜たっぷり規格外りんごジャム」に印刷デザイン担当から参加オファーが届いています。',
        targetTab: 'en'
      },
      {
        id: 'br-2',
        kind: '📅 明日の予定',
        text: '11/28 瓶詰めテスト＆糖度チェック（開発室カレンダーより自動抽出）',
        targetTab: 'en'
      },
      {
        id: 'br-3',
        kind: '🧡 応援の声',
        text: '広場プロジェクトに「食べてみたい！」が3件増えました。POPへ引用できます。',
        targetTab: 'plaza'
      }
    ],

    /* 広場つぶやき */
    feeds: [
      {
        id: 'feed-1',
        author: '信州・青木りんご園',
        role: '農家・生産者',
        area: '長野県安曇野市',
        tag: '💡 余ってます',
        body: '台風前の強風で枝スレしたりんご（サンふじ）が約80kg出ました！味は蜜入りで最高です。ジャムやチップスにしてくれる工房さんいませんか？',
        createdAt: '2時間前',
        likes: 14
      },
      {
        id: 'feed-2',
        author: 'なにわ乾燥・瓶詰め工房',
        role: '町工場・加工',
        area: '大阪府東大阪市',
        tag: '🛠️ 加工・試作募集',
        body: '来週火曜〜木曜、低温ドライ機と殺菌釜に空きが出ました！10kgの小ロット試作から相談OKです。',
        createdAt: '5時間前',
        likes: 9
      },
      {
        id: 'feed-3',
        author: 'たかつき軽トラ便（佐藤）',
        role: '農家・生産者',
        area: '大阪府高槻市 → 京都市',
        tag: '🚚 軽トラ便',
        body: '今週土曜の朝8時に高槻から京都方面へ走ります。荷台半分空いているので、試作品の相乗り配送あれば声かけてください！',
        createdAt: '昨日',
        likes: 11
      }
    ],

    /* 仲間図鑑 (#5 熱量ブースト順) */
    members: [
      {
        id: 'mem-1',
        name: '信州・青木りんご園',
        role: '農家・生産者',
        area: '長野県安曇野市',
        skills: 'サンふじ・シナノゴールド栽培、軽トラ運搬',
        bio: '見た目だけで弾かれる蜜入りりんごを、加工のプロと組んで全国に届けたいです！試作サンプルすぐ送れます。',
        heat: 118,
        mapPublic: true
      },
      {
        id: 'mem-2',
        name: 'なにわ乾燥・瓶詰め工房',
        role: '町工場・加工',
        area: '大阪府東大阪市',
        skills: '低温ドライ加工、ジャム瓶詰め、食品表示ラベル相談',
        bio: '小ロット10kgから試作対応できる町工場です。農家さんの「これ何とかならん？」を形にするのが生きがい。',
        heat: 112,
        mapPublic: true
      },
      {
        id: 'mem-3',
        name: '紙工アトリエ縁（えん）',
        role: 'デザイン・企画',
        area: '京都府京都市',
        skills: '和紙パッケージ設計、店頭POP、ロゴ・名刺デザイン',
        bio: '京都で紙器とパッケージを仕立てています。マルシェで思わず手に取りたくなる装いをお手伝いします。',
        heat: 104,
        mapPublic: true
      },
      {
        id: 'mem-4',
        name: 'マルシェ好きのミキ',
        role: '一般サポーター',
        area: '大阪府茨木市',
        skills: '試食レビュー、SNSショート動画撮影、レシピ投稿',
        bio: '生産者さんの裏話が大好き！週末はマルシェ巡りをして応援レビューを書いています。',
        heat: 88,
        mapPublic: false
      }
    ],

    /* 1ご縁（親）→ 複数商品（子）(#1〜#10) */
    rooms: [
      {
        id: 'room-1',
        name: '青木りんご園 × なにわ工房',
        partner: '信州・青木りんご園 / なにわ乾燥・瓶詰め工房',
        members: ['あなた（EN•joy発起人）', '信州・青木りんご園', 'なにわ乾燥・瓶詰め工房'],
        products: [
          {
            id: 'prod-1',
            title: '蜜たっぷり規格外りんごの無添加ジャム',
            category: 'ジャム・瓶詰め',
            phase: '試作中',
            visibility: 'public',
            images: [],
            costRaw: 140,
            costLabor: 110,
            adoptedMaterialIds: ['mat-jar-140', 'mat-label-washi'],
            priceSell: 650,
            productExp: { story: 85, fan: 70, quality: 90, market: 40 },
            stories: [
              {
                id: 'st-1',
                author: '信州・青木りんご園',
                text: '枝スレのサンふじ20kgを発送しました！皮ごと煮ると香りが出て最高です。',
                date: '11/22 14:20',
                isPrivate: false
              },
              {
                id: 'st-2',
                author: 'なにわ乾燥・瓶詰め工房',
                text: '原価メモ：瓶の仕入れは100本単位にすると単価65円まで下がりそう（メンバー限定メモ）。',
                date: '11/23 19:10',
                isPrivate: true
              }
            ],
            calendar: [
              { id: 'cal-1', date: '2026-11-28', title: '試作2回目：糖度チェック＆瓶詰めテスト' },
              { id: 'cal-2', date: '2026-12-05', title: '高槻・軽トラ相乗り便でサンプル受け渡し' }
            ],
            offers: [
              {
                id: 'off-1',
                from: '紙工アトリエ縁（えん）',
                message: '和紙ラベルとマルシェ用の手描き風POP作成でぜひ参加させてください！',
                approvals: ['信州・青木りんご園']
              }
            ],
            reactions: { cheer: 18, eat: 27, visit: 9 },
            comments: [
              { author: 'マルシェ好きのミキ', text: '皮ごと無添加ジャム絶対買いたいです！ヨーグルトに合わせたい！' }
            ]
          },
          {
            id: 'prod-2',
            title: '第2弾：パリッと低温乾燥りんごチップス',
            category: 'お菓子・ドライ',
            phase: '準備OK',
            visibility: 'public',
            images: [],
            costRaw: 110,
            costLabor: 90,
            adoptedMaterialIds: ['mat-pouch-craft', 'mat-label-washi'],
            priceSell: 520,
            productExp: { story: 65, fan: 80, quality: 85, market: 75 },
            stories: [
              {
                id: 'st-3',
                author: 'なにわ乾燥・瓶詰め工房',
                text: '厚み2.5mmで低温8時間乾燥が一番パリッと甘みが出ました！マルシェ出品準備OKです。',
                date: '11/24 11:00',
                isPrivate: false
              }
            ],
            calendar: [
              { id: 'cal-3', date: '2026-12-12', title: 'プレマルシェ試食販売（京都古民家前）' }
            ],
            offers: [],
            reactions: { cheer: 12, eat: 21, visit: 11 },
            comments: [
              { author: 'たかつき軽トラ便（佐藤）', text: '子どもが止まらなくなるやつですね！箱買いします！' }
            ]
          }
        ]
      },
      {
        id: 'room-2',
        name: '高槻トマト × 紙工アトリエ縁',
        partner: 'たかつき太陽農園 / 紙工アトリエ縁',
        members: ['あなた（EN•joy発起人）', 'たかつき太陽農園', '紙工アトリエ縁（えん）'],
        products: [
          {
            id: 'prod-3',
            title: '完熟トマトの食べる和風スパイスソース',
            category: '調味料・ソース',
            phase: '出店中',
            visibility: 'public',
            images: [],
            costRaw: 160,
            costLabor: 120,
            adoptedMaterialIds: ['mat-jar-140', 'mat-box-gift'],
            priceSell: 780,
            productExp: { story: 95, fan: 92, quality: 90, market: 88 },
            stories: [
              {
                id: 'st-4',
                author: '紙工アトリエ縁（えん）',
                text: '2本入りの古民家風ギフト箱が完成しました！手土産需要バッチリです。',
                date: '11/20 16:40',
                isPrivate: false
              }
            ],
            calendar: [],
            offers: [],
            reactions: { cheer: 31, eat: 44, visit: 19 },
            comments: [
              { author: 'マルシェ好きのミキ', text: 'パスタにも豆腐にも合って最高でした！リピート決定です。' }
            ]
          }
        ]
      }
    ],

    /* 一括メッセージ箱 (#11) */
    inbox: [
      {
        id: 'msg-1',
        type: 'cheer',
        from: 'マルシェ好きのミキ',
        text: '皮ごと無添加りんごジャム、発売したら絶対買いに行きます！応援してます！',
        date: '11/24 18:10',
        unread: true,
        quotedForPop: true
      },
      {
        id: 'msg-2',
        type: 'offer',
        from: '紙工アトリエ縁（えん）',
        text: '「蜜たっぷり規格外りんごの無添加ジャム」へ参加オファーを送りました。',
        date: '11/24 15:30',
        unread: true,
        quotedForPop: false
      },
      {
        id: 'msg-3',
        type: 'dev',
        from: 'なにわ乾燥・瓶詰め工房',
        text: '11/28の試作2回目、10時から釜を空けておきますね！',
        date: '11/23 20:05',
        unread: false,
        quotedForPop: false
      },
      {
        id: 'msg-4',
        type: 'ops',
        from: 'EN•joy 運営',
        text: 'v5.0へアップデートされました。お問い合わせ窓口からいつでも改善要望を送れます。',
        date: '11/24 19:00',
        unread: false,
        quotedForPop: false
      }
    ],

    /* 受信済みお問い合わせログ (#19) */
    inquiries: [
      {
        id: 'inq-demo-1',
        category: '🏢 協賛・テストキッチン・試供品相談',
        body: '（デモ履歴）京都のシェアキッチンです。試作枠として月2回提供できるか相談したいです。',
        meta: 'EN•joy v5.0 / 広場',
        date: '11/24 12:00'
      }
    ]
  };
};