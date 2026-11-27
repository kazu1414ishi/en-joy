/* =========================================================
   EN•joy モックデータ集・最終完全版（patch_mock_data.js）
   ・全5タブ対応 / 昼間版の全メンバー＆全ラボ収録
   ========================================================= */

const EN_IMAGES = {
  tomato:    'https://picsum.photos/seed/en-tomato/640/400',
  drying:    'https://picsum.photos/seed/en-factory/640/400',
  package:   'https://picsum.photos/seed/en-craftpkg/640/400',
  truck:     'https://picsum.photos/seed/en-delivery/640/400',
  citrus:    'https://picsum.photos/seed/en-citrus/640/400',
  jam:       'https://picsum.photos/seed/en-jamjar/640/400',
  snack:     'https://picsum.photos/seed/en-snack/640/400',
  gear:      'https://picsum.photos/seed/en-gear/640/400',
  userFarm:  'https://picsum.photos/seed/en-p1/200/200',
  userFact:  'https://picsum.photos/seed/en-p2/200/200',
  userDes:   'https://picsum.photos/seed/en-p3/200/200',
  userTruck: 'https://picsum.photos/seed/en-p4/200/200',
  userBuyer: 'https://picsum.photos/seed/en-p6/200/200'
};

// 1. つぶやき（category: 'want' | 'trouble' | 'idea'）
const EN_MOCK_TWEETS = [
  {
    id: 'tw-000',
    category: 'want',
    author: 'かな（子育てママ）',
    role: '買い手・応援ファン',
    area: '寝屋川市',
    iconType: 'greet',
    avatar: EN_IMAGES.userBuyer,
    time: '8分前',
    text: '【ほしい！】無添加で子どもがパクパク食べられる、地元野菜のサクサクチップスがあったら絶対買いたい！スーパーのは添加物が多くて…。',
    photo: EN_IMAGES.snack,
    likes: 42,
    comments: 9,
    savedToHint: false
  },
  {
    id: 'tw-001',
    category: 'trouble',
    author: '山田農園（山田 健一）',
    role: '一次産業・トマト農家',
    area: '枚方市',
    iconType: 'farm',
    avatar: EN_IMAGES.userFarm,
    time: '15分前',
    text: '今年の完熟トマト、甘さは過去最高なんだけど形が不揃いな規格外が30kgほど余ってます…。ジュースか乾燥おつまみに加工できる方いませんか？',
    photo: EN_IMAGES.tomato,
    likes: 18,
    comments: 5,
    savedToHint: false
  },
  {
    id: 'tw-002',
    category: 'idea',
    author: 'カワチ乾燥加工所',
    role: '二次産業・食品加工',
    area: '東大阪市',
    iconType: 'factory',
    avatar: EN_IMAGES.userFact,
    time: '1時間前',
    text: '来週の火・水、低温乾燥機（1回50kg対応）に空きが出ました！果物や野菜のチップス試作してみたい農家さん、小ロットから一緒に試しませんか？',
    photo: EN_IMAGES.drying,
    likes: 24,
    comments: 7,
    savedToHint: true
  },
  {
    id: 'tw-003',
    category: 'idea',
    author: 'アトリエ木漏れ日（佐藤）',
    role: 'デザイン・パッケージ',
    area: '大阪市中央区',
    iconType: 'design',
    avatar: EN_IMAGES.userDes,
    time: '3時間前',
    text: 'クラフト紙に1色刷りだけのシンプルな袋、コスト抑えられて農産物との相性バツグンだった！小ロット印刷のテスト品が上がってきたので共有します。',
    photo: EN_IMAGES.package,
    likes: 31,
    comments: 4,
    savedToHint: false
  },
  {
    id: 'tw-004',
    category: 'idea',
    author: '北河内ルート便（高橋）',
    role: '配達ドライバー・物流',
    area: '寝屋川市',
    iconType: 'truck',
    avatar: EN_IMAGES.userTruck,
    time: '5時間前',
    text: '毎週木曜の午前中、交野〜東大阪の往復ルートに冷蔵スペース半分空きあり！試作品の運搬やマルシェ搬入の相乗り便として使いたい人どうぞ。',
    photo: EN_IMAGES.truck,
    likes: 15,
    comments: 3,
    savedToHint: false
  }
];

// 2. EN•ラボ（進行中 / 1人準備中 / 探す）
const EN_MOCK_LABS = [
  {
    id: 'lab-001',
    mode: 'my_active',
    fanPublic: true,
    title: '無添加・濃厚ドライトマトおつまみ開発',
    photo: EN_IMAGES.tomato,
    sourceTweetId: 'tw-001',
    urgent: true,
    unread: 3,
    badges: [
      { type: 'vote', label: '多数決あと1件', targetTab: 'progress' },
      { type: 'task', label: 'タスク2件', targetTab: 'progress' }
    ],
    nextDeadline: '試作パッケージ決定：あと2日',
    summary: {
      flow: '塩味とハーブ味の2種で試作が完了しました',
      decided: '1袋30g・原価280円以内に収める',
      next: 'あなたのパッケージ多数決待ち'
    }
  },
  {
    id: 'lab-002',
    mode: 'my_active',
    fanPublic: true,
    title: '地域柑橘のクラフトシロップ試作',
    photo: EN_IMAGES.citrus,
    sourceTweetId: null,
    urgent: false,
    unread: 0,
    badges: [],
    nextDeadline: 'ラベル納品：あと9日',
    summary: {
      flow: '瓶詰めテストが順調に完了',
      decided: '道の駅とECで初回100本テスト販売',
      next: '今は順調！（次の動き待ち）'
    }
  },
  {
    id: 'lab-solo-001',
    mode: 'my_solo',
    fanPublic: false,
    title: '規格外いちご×低温乾燥チョコがけ案',
    photo: EN_IMAGES.jam,
    sourceTweetId: 'tw-002',
    updatedAt: '昨日メモ追加',
    summary: {
      seed: '規格外いちごを丸ごと乾燥＋ビターチョコでギフト化',
      needed: '小ロットの化粧箱を印刷できる業者・保冷配送'
    }
  },
  {
    id: 'lab-solo-002',
    mode: 'my_solo',
    fanPublic: false,
    title: '朝採れ野菜の「相乗り直売ボックス」',
    photo: EN_IMAGES.truck,
    sourceTweetId: 'tw-004',
    updatedAt: '3日前',
    summary: {
      seed: '木曜の空き冷蔵便を使って駅前カフェへ直送する仕組み',
      needed: '受け取り拠点になってくれるカフェオーナー'
    }
  },
  {
    id: 'lab-pub-001',
    mode: 'discover',
    fanPublic: false,
    title: '端材ウッドで作るマルシェ用ディスプレイ棚',
    photo: EN_IMAGES.package,
    status: '試作中',
    recruiting: '軽トラで運べる人・塗装できる人',
    area: '交野市',
    tags: ['加工・製造', '物流・配送']
  },
  {
    id: 'lab-pub-002',
    mode: 'discover',
    fanPublic: true,
    title: '訳ありみかんの無添加マーマレード',
    photo: EN_IMAGES.citrus,
    status: 'アイディア中',
    recruiting: '瓶詰め加工できる方・試食モニター求む',
    area: '岸和田市',
    tags: ['一次産業', 'ファン投票中']
  }
];

// 3. AIディア（3点掛け算）
const EN_MOCK_AIDEA = [
  {
    id: 'ai-001',
    creator: 'AI提案',
    want: '寝屋川市・買い手「無添加の地元野菜チップスがほしい」',
    trouble: { area: '枚方市・農家', text: '規格外の完熟トマトが30kg余っている' },
    myStrength: 'あなたの過去ラボ「乾燥おつまみ開発」の知見',
    partner: { area: '東大阪市・加工業', text: '低温乾燥機（来週空きあり）' },
    proposal: '『無添加・枚方産完熟トマトのサクサクチップス』',
    reason: '買い手の強い要望(42いいね)と乾燥機の空き時期が完全一致。初回50袋でテスト販売可能。',
    photo: EN_IMAGES.tomato,
    sourceTweetId: 'tw-000'
  },
  {
    id: 'ai-002',
    creator: '人間×AI創出',
    want: '仕事帰りに新鮮な地元果物を買いたい',
    trouble: { area: '交野市・果樹園', text: 'マルシェへ運ぶ冷蔵車が足りない' },
    myStrength: 'あなたのプロフィール「地域イベント企画」',
    partner: { area: '寝屋川市・配達ドライバー', text: '木曜午前の冷蔵相乗り便' },
    proposal: '『木曜限定・採れたて果物のオフィス直送便』',
    reason: '既存ルートの空きスペース活用で配送料を半減できます。',
    photo: EN_IMAGES.truck,
    sourceTweetId: 'tw-004'
  }
];

// 4. おすすめ人材（4業種フル収録・性格診断相性付き）
const EN_MOCK_PEOPLE = [
  {
    id: 'usr-001',
    name: '山田 健一',
    shop: '山田農園',
    category: 'farm',
    categoryLabel: '一次産業・農家',
    area: '枚方市',
    avatar: EN_IMAGES.userFarm,
    canDo: '完熟トマト・季節野菜の通年供給（規格外も対応可）',
    aiMatch: '慎重派のあなた × 行動派の山田さん＝試作スピード最強タッグ！',
    detail: { equipment: 'ハウス4棟・予冷庫あり', pastLabs: 3, replySpeed: '夕方〜夜に返信が早い' },
    mapOpen: true,
    mapPos: { x: 68, y: 26 }
  },
  {
    id: 'usr-002',
    name: '田中 誠',
    shop: 'カワチ乾燥加工所',
    category: 'factory',
    categoryLabel: '加工・製造',
    area: '東大阪市',
    avatar: EN_IMAGES.userFact,
    canDo: '低温乾燥・粉末化・小ロット10kgからの試作加工',
    aiMatch: '計画派同士で相性◎。原価やロット相談がスムーズに進みます',
    detail: { equipment: '低温乾燥機2台・真空シーラー・金属探知機', pastLabs: 7, replySpeed: '平日昼間に即レス' },
    mapOpen: true,
    mapPos: { x: 54, y: 66 }
  },
  {
    id: 'usr-003',
    name: '佐藤 美咲',
    shop: 'アトリエ木漏れ日',
    category: 'design',
    categoryLabel: 'デザイン・印刷',
    area: '大阪市中央区',
    avatar: EN_IMAGES.userDes,
    canDo: 'クラフト系パッケージ・小ロットラベル・SNS写真撮影',
    aiMatch: '温かみのある世界観が得意。一次産業の魅力を伝えるのが上手です',
    detail: { equipment: 'オンデマンド小ロット印刷提携・撮影スタジオ', pastLabs: 5, replySpeed: '24時間以内に返信' },
    mapOpen: true,
    mapPos: { x: 28, y: 58 }
  },
  {
    id: 'usr-004',
    name: '高橋 亮',
    shop: '北河内ルート便',
    category: 'truck',
    categoryLabel: '配達ドライバー・物流',
    area: '寝屋川市',
    avatar: EN_IMAGES.userTruck,
    canDo: '冷蔵軽バンでの地域ルート配送・マルシェ搬入代行',
    aiMatch: '農家と加工場の「距離の壁」を一気に解決してくれる心強い相棒！',
    detail: { equipment: '冷蔵軽バン2台（-5℃〜10℃設定可）', pastLabs: 2, replySpeed: '朝と夕方に確認' },
    mapOpen: true,
    mapPos: { x: 52, y: 40 }
  }
];

// 5. 🥬 役立ち（毎晩の分析ニュース ＆ 旬レシピ）
const EN_MOCK_NEWS = [
  {
    id: 'news-001',
    type: 'analysis',
    date: '昨夜 23:00 分析更新',
    title: '【冬の需要速報】関西マルシェで「500〜800円の無添加プチギフト」が急伸中',
    summary: '12月の週末マルシェでは、自宅用より「ちょっとした手土産」需要が1.8倍。クラフト袋＋1色ラベルの小ロット包装が原価を抑えて人気です。',
    photo: EN_IMAGES.package
  },
  {
    id: 'news-002',
    type: 'recipe',
    date: '旬の食材レシピ',
    title: '規格外みかんを丸ごと使う「皮ごと濃厚ジャム」失敗しない糖度バランス',
    summary: '白いワタを少し残すことでペクチン不要でとろみUP。家庭用フードプロセッサーでも15分で試作できます。',
    photo: EN_IMAGES.citrus
  }
];

// 6. 🎪 マルシェ（巣立ち商品 ＆ 50:50厳選ギア）
const EN_MOCK_MARCHE = [
  {
    id: 'item-001',
    type: 'product',
    badge: '巣立ち第1号・予約早割',
    title: '枚方産・完熟ドライトマトのおつまみ（3袋セット）',
    price: '¥1,280',
    maker: '山田農園 × カワチ乾燥加工所',
    photo: EN_IMAGES.tomato
  },
  {
    id: 'gear-001',
    type: 'gear',
    badge: '50:50 厳選ギア（現場の愛用品）',
    title: '小ロット試作に最強！業務用クラスの家庭用真空シーラー',
    price: '¥6,980（Amazon）',
    maker: 'カワチ乾燥加工所 推薦',
    photo: EN_IMAGES.gear
  }
];