/* ==========================================
   EN•joy マスターデータ ＆ 初期サンプル定義（v4.0）
   ========================================== */

const KEYS = {
  MODE: 'enjoy_readability_v3',
  PROFILE: 'enjoy_user_profile_v1',
  TWEETS: 'enjoy_local_tweets_v6',
  PROJECTS: 'enjoy_projects_v2',
  MARCHE: 'enjoy_marche_items_v2',
  TOOLS: 'enjoy_tools_v1',
  FUND: 'enjoy_marche_fund_v1',
  BADGES: 'enjoy_earned_badges_v1',
  GRATITUDE: 'enjoy_gratitude_count_v1',
  CART: 'enjoy_ec_cart_v1'
};

const PAGE_META = {
  home: { title: 'ホーム', sub: 'マルシェ開催カウントダウン・現場の知恵・最新つぶやきを一望' },
  tweet: { title: 'つぶやき広場・相性順仲間さがし', sub: '47都道府県×地方ブロック×キーワードで、近くの仲間や案件をしっかり検索' },
  en: { title: 'EN（ご縁・開発スタジオ）', sub: 'LINE風相談・ToDo・原価＆山分け電卓・同意書PDF・店頭POP＆名刺まで完結' },
  marche: { title: 'マルシェ・京都古民家EC・神道具', sub: '誕生コラボ商品の店頭POP＆8枚ストーリー名刺印刷・ストーリーEC棚・50:50軍資金シェア' },
  roadmap: { title: 'マイ職人カード・性格診断・構想', sub: 'かんたん登録から詳細プロフィールまで自在に編集・データバックアップ管理' }
};

const SAMPLE_APPLE_IMG = 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=700';

/* ==========================================
   地域検索用：地方ブロック ＆ 47都道府県
   ========================================== */
const REGION_BLOCKS = [
  { key: 'ALL', label: '🗾 全国', prefs: [] },
  {
    key: 'hokkaido_tohoku',
    label: '北海道・東北',
    prefs: ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県']
  },
  {
    key: 'kanto',
    label: '関東',
    prefs: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県']
  },
  {
    key: 'chubu',
    label: '中部・北陸',
    prefs: ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県']
  },
  {
    key: 'kinki',
    label: '近畿',
    prefs: ['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県']
  },
  {
    key: 'chugoku_shikoku',
    label: '中国・四国',
    prefs: ['鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県']
  },
  {
    key: 'kyushu_okinawa',
    label: '九州・沖縄',
    prefs: ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県']
  }
];

const PREFECTURES = REGION_BLOCKS
  .filter(r => r.key !== 'ALL')
  .reduce((acc, r) => acc.concat(r.prefs), []);

/* ==========================================
   チャット・ニュース・性格診断・合意選択肢
   ========================================== */
const CHAT_QUICK_CHIPS = [
  '📦 サンプル発送しました！',
  '🍎 試作の味見しました！香り最高です',
  '🧮 原価シミュレーターで試算してみました',
  '📋 合意カード、この内容でOKです👍',
  '🚚 軽トラ便の日程、今週金曜でどうでしょう？'
];

const FIELD_INSIGHTS = {
  fruit: {
    label: '🍎 果物・規格外活用',
    title: '皮ごと使う無添加スプレッドがマルシェで完売続出',
    body: '雹（ひょう）や枝スレで規格外になったりんご・柑橘は、皮の香りを活かした「無添加バター・ジュレ」にすると、50〜100個の小ロットでも初回完売する事例が急増しています。'
  },
  tea: {
    label: '🍵 お茶・和素材',
    title: '焙じ茶×ドライフルーツの「古民家カフェ系」土産が人気',
    body: '単体では価格競争になりやすい茶葉も、別地域の果物農家と組んで「フルーツ焙じ茶」や焼き菓子ペーストに仕立てることで、高単価なセレクトショップ定番品に化けます。'
  },
  pack: {
    label: '📦 小ロット包装',
    title: '最初は「クラフト袋＋店頭POP＋8枚ストーリー名刺」で初期費ゼロ',
    body: 'いきなり数千枚の専用印刷袋を作ると在庫リスクが跳ね上がります。初回マルシェは既製のクラフト袋＋EN•joyの自動生成「開発ストーリー名刺」を添えて手渡すのが鉄則です。'
  },
  grant: {
    label: '🚚 地域物流・補助金',
    title: '空き軽トラの混載＆「小規模事業者持続化補助金」の活用ヒント',
    body: '試作の試食費やマルシェ出展の備品・パッケージ試作は、地域の商工会経由の補助金対象になるケースも。まずは3〜5商品のテスト販売実績を作っておくと採択率が上がります。'
  }
};

const QUIZ_QUESTIONS = [
  { q: '新しい商品アイデアが浮かんだとき、まずどう動く？', a: 'とりあえず小ロットで試作して、形にしながら考える！', b: 'まずは原価・材料・手順を紙に書き出して整理する' },
  { q: 'コラボ相手に一番求めるのはどっち？', a: '「それ面白いね！」とノリよく乗ってくれる熱量', b: '納期や連絡をきっちり守ってくれる安心感' },
  { q: '天候不良や材料不足など、想定外のトラブルが起きたら？', a: '「じゃあ別ルートで！」と柔軟に発想を切り替える', b: '原因を調べて、二度と起きない仕組みに整え直す' },
  { q: 'ものづくりで一番ワクワクする瞬間は？', a: '誰も見たことのない組み合わせを思いついたとき', b: '味や仕上がりの精度が狙い通りにピタッとハマったとき' },
  { q: 'マルシェやお店で目指したい理想のゴールは？', a: '話題になって行列ができるサプライズ商品！', b: '地域の人に何年も愛され続ける定番の逸品！' }
];

const DIAGNOSIS_TYPES = {
  spark: {
    title: '🔥 直感突破のアイデア職人', stamp: '直感', stampClass: 'terracotta',
    partner: '🛡️ 段取り完璧な守護神',
    desc: '「これ面白そう！」の閃きと行動力が武器。まず試作して形にしながら磨くチャレンジャーです。',
    tip: '計画やコスト管理が得意な「守護神」と組むと、面白いアイデアが爆速でヒット商品に化けます！'
  },
  bridge: {
    title: '⚡ 現場をつなぐ推進メーカー', stamp: '推進', stampClass: '',
    partner: '🔬 こだわり抜く品質の匠',
    desc: 'スピード感と巻き込み力が抜群。農家さんと町工場の想いを繋いで企画を前へ進めるムードメーカーです。',
    tip: '製法に妥協しない「品質の匠」と組むと、ファンが熱狂する強いブランドが生まれます！'
  },
  artisan: {
    title: '🔬 こだわり抜く品質の匠', stamp: '匠', stampClass: '',
    partner: '⚡ 現場をつなぐ推進メーカー',
    desc: '味・手触り・仕上がりに一切妥協しない本格派。「本当に良いもの」を生み出す確かな技術が武器です。',
    tip: '発信や段取りを引っ張る「推進メーカー」と組むと、あなたのこだわりが一気に世の中へ届きます！'
  },
  guardian: {
    title: '🛡️ 段取り完璧な守護神', stamp: '守護神', stampClass: '',
    partner: '🔥 直感突破のアイデア職人',
    desc: 'コスト・スケジュール・安心安全をきっちり守る現場の要。あなたがいるだけで成功率が跳ね上がります。',
    tip: '突飛なアイデアを出す「直感職人」と組むと、夢物語が確実な定番商品に育ちます！'
  }
};

const COST_OPTIONS = [
  '試作費は折半（50:50）',
  '素材を買い取り（加工側主導）',
  '現物提供 × 加工技術（持ち出しゼロ型）',
  'テスト販売後に売上分配'
];

const SALES_OPTIONS = [
  'EN•joy マルシェ優先出品（出店無料）',
  '公式ストーリーECで産地直送',
  'お互いの直売所・販路で自由販売'
];

const LOGISTICS_OPTIONS = [
  '農家から持ち込み・発送',
  '加工工房が引き取り',
  '🚚 軽トラ地域便オファー連携'
];

const GRATITUDE_STAMPS = ['🏅 素材の匠', '💡 開発の鬼', '🤝 安心の伴走者', '🚚 現場の救世主'];

const FILTER_TAGS = [
  { key: 'ALL', label: 'すべて' },
  { key: '🆘', label: '🆘 ちょっと助けて' },
  { key: '💡', label: '💡 余ってます・試作' },
  { key: '🚚', label: '🚚 軽トラ便' },
  { key: '🌱', label: '🌱 ひとこと' }
];

const DEFAULT_CALC = {
  materialCost: 160,
  processCost: 180,
  packCost: 90,
  fixedCost: 6000,
  batchQty: 50,
  sellPrice: 880,
  shareRatioA: 50
};

/* ==========================================
   相性％順・仲間さがし図鑑 サンプルデータ
   ========================================== */
const DEFAULT_MEMBERS = [
  {
    id: 'm1',
    name: '信州りんご農園 / 田中',
    role: '農家・生産者',
    pref: '長野県',
    city: '安曇野市',
    typeId: 'artisan',
    bio: '標高700mで減農薬ふじ・シナノゴールドを栽培。雹キズやサイズ外の極上りんごを加工品で活かしたいです。',
    specialty: 'ふじ・紅玉・シナノゴールド（糖度14度以上）',
    lot: '試作5kg〜 / 本生産200kgまで対応',
    delivery: '安曇野・松本は軽トラ直納 / 全国クール便OK',
    link: ''
  },
  {
    id: 'm2',
    name: '大阪クラフト菓子工房',
    role: '加工業者・町工場',
    pref: '大阪府',
    city: '高槻市',
    typeId: 'guardian',
    bio: '小ロットのジャム・コンフィチュール・焼き菓子OEMが得意な町工房です。食品表示ラベル作成まで一緒に伴走します。',
    specialty: '菓子製造業・びん詰加工許可 / 真空殺菌釜・低温乾燥機',
    lot: '初回試作30個〜 / 本製造50〜500個',
    delivery: '関西圏は引き取り相談可 / 全国宅配対応',
    link: ''
  },
  {
    id: 'm3',
    name: '京都・宇治茶クラフト工房',
    role: '加工業者・町工場',
    pref: '京都府',
    city: '宇治市',
    typeId: 'spark',
    bio: '焙じ茶・抹茶と地域の果物を掛け合わせた新感覚スイーツやクラフトシロップを作っています！面白い組み合わせ大歓迎。',
    specialty: '焙煎機・ペースト粉砕機・ドリンク充填ライン',
    lot: '小ロット50本〜テスト製造OK',
    delivery: '京都・大阪・滋賀エリアは直接打ち合わせ可',
    link: ''
  },
  {
    id: 'm4',
    name: '丹波・黒豆ファーム',
    role: '農家・生産者',
    pref: '兵庫県',
    city: '丹波篠山市',
    typeId: 'bridge',
    bio: '丹波黒豆と季節の根菜を育てています。選別ではじかれた割れ豆をきなこやグラノーラにしてくれる工房さん募集中！',
    specialty: '丹波黒大豆・大納言小豆・山の芋',
    lot: '乾燥豆3kg〜 / 定期供給相談可',
    delivery: '兵庫・京都・大阪は軽トラ配達OK',
    link: ''
  },
  {
    id: 'm5',
    name: '安曇野・軽トラ地域便サポーター',
    role: '軽トラ・地域サポーター',
    pref: '長野県',
    city: '松本市・安曇野市',
    typeId: 'guardian',
    bio: '週2回、安曇野〜松本〜塩尻エリアを軽トラで回っています。試作品の受け渡しやマルシェ搬入の手伝いなら任せてください！',
    specialty: '軽トラック（幌付き）・保冷コンテナ3台所有',
    lot: 'ダンボール1箱〜最大350kgまで',
    delivery: '長野県中信エリア全般（日時応相談）',
    link: ''
  },
  {
    id: 'm6',
    name: '紀州みかん山・山本果樹園',
    role: '農家・生産者',
    pref: '和歌山県',
    city: '有田川町',
    typeId: 'spark',
    bio: '温州みかん・八朔・レモンを段々畑で栽培。皮まで使える減農薬柑橘で、クラフトコーラやピール菓子を一緒に作りたい！',
    specialty: '減農薬レモン・有田みかん・山椒',
    lot: 'サンプル3kg〜 / 季節限定100kg対応',
    delivery: '和歌山・大阪南部は持ち込み可 / 全国発送',
    link: ''
  },
  {
    id: 'm7',
    name: '瀬戸内ドライフルーツ製作所',
    role: '加工業者・町工場',
    pref: '広島県',
    city: '尾道市',
    typeId: 'artisan',
    bio: '砂糖不使用・低温じっくり乾燥で色と香りを残すドライ加工専門工場です。規格外フルーツの価値を最大まで引き上げます。',
    specialty: '業務用低温乾燥機4台・シーラー包装機・粉末加工',
    lot: '生果10kgから委託試作OK',
    delivery: '中国・四国・関西エリア便あり / 全国宅配可',
    link: ''
  },
  {
    id: 'm8',
    name: '博多マルシェ応援・パッケージ企画室',
    role: '企画・アイデア応援',
    pref: '福岡県',
    city: '福岡市',
    typeId: 'bridge',
    bio: '農家さんと町工場のコラボ商品を「売れる物語」に仕上げるデザイン＆マルシェ出展サポートをしています！',
    specialty: '小ロットラベル設計・ネーミング・試食導線づくり',
    lot: '商品1アイテム・試作段階から相談OK',
    delivery: '九州内は現地訪問 / 全国オンライン対応',
    link: ''
  },
  {
    id: 'm9',
    name: '十勝・小さな乳製品ラボ',
    role: '加工業者・町工場',
    pref: '北海道',
    city: '帯広市',
    typeId: 'guardian',
    bio: '十勝の生乳・発酵バターと全国の果物・お茶を合わせるコラボ開発が大好きです。冷凍配送テストも対応できます。',
    specialty: '乳製品加工許可・急速冷凍機・バタースプレッド製造',
    lot: '初回40個〜テスト製造可',
    delivery: '全国クール・冷凍便対応',
    link: ''
  }
];

/* ==========================================
   初期サンプルデータ（つぶやき・ご縁・マルシェ・神道具）
   ========================================== */
const DEFAULT_TWEETS = [
  {
    id: 101,
    tag: '💡 余ってます・試作相談',
    author: '信州りんご農園 / 田中',
    pref: '長野県',
    city: '安曇野市',
    qty: '規格外ふじ 約50kg',
    deadline: '今月中',
    stamp: '匠',
    stampClass: '',
    typeId: 'artisan',
    text: '【りんごの収穫が始まりました！】少しキズのある規格外ふじが50kgあります。無添加りんごバターや焼き菓子に試作してくれる工房さん、ぜひご縁を繋ぎませんか？🍎',
    photo: SAMPLE_APPLE_IMG,
    helps: 4,
    solved: false,
    daysLeft: 29,
    time: '15分前'
  },
  {
    id: 102,
    tag: '🚚 軽トラ空きあり',
    author: '安曇野・軽トラサポーター',
    pref: '長野県',
    city: '松本市・安曇野市',
    qty: '軽トラ荷台 空きあり',
    deadline: '今週金曜 午前',
    stamp: '守護神',
    stampClass: '',
    typeId: 'guardian',
    text: '今週金曜の午前中、安曇野〜松本エリアを空荷で走ります！試作品や箱物の運搬があればお声がけください。',
    photo: '',
    helps: 5,
    solved: false,
    daysLeft: 28,
    time: '1時間前'
  },
  {
    id: 103,
    tag: '🆘 ちょっと助けて',
    author: '京都・宇治茶クラフト工房',
    pref: '京都府',
    city: '宇治市',
    qty: '初回試作50個分',
    deadline: '来月中旬まで',
    stamp: '直感',
    stampClass: 'terracotta',
    typeId: 'spark',
    text: '焙じ茶ペーストの新商品に合う「甘み強めの柑橘」や「規格外フルーツ」を探しています！小ロット50個から一緒に試作できる農家さんいませんか？',
    photo: '',
    helps: 3,
    solved: false,
    daysLeft: 26,
    time: '2時間前'
  },
  {
    id: 104,
    tag: '🌱 今日のひとこと',
    author: '大阪クラフト菓子工房',
    pref: '大阪府',
    city: '高槻市',
    qty: '小ロット30瓶〜相談可',
    deadline: '随時',
    stamp: '守護神',
    stampClass: '',
    typeId: 'guardian',
    text: '先月ここで出会った農家さんとの試作、原価と山分けバランスもスッキリ決まって来週いよいよマルシェ初出品です！関西の農家さんとも新しいご縁を作りたいです。',
    photo: '',
    helps: 7,
    solved: false,
    daysLeft: 24,
    time: '3時間前'
  }
];

const DEFAULT_PROJECTS = [
  {
    id: 1001,
    title: '無添加「皮ごとりんごバター」小ロット試作',
    partnerName: '長野りんご農園 × 大阪クラフト菓子工房',
    partnerTypeId: 'guardian',
    compatibility: 94,
    completed: false,
    costPlan: COST_OPTIONS[2],
    salesPlan: SALES_OPTIONS[0],
    logisticsPlan: LOGISTICS_OPTIONS[2],
    partyA: '長野りんご農園（サンプル）',
    partyB: '大阪クラフト菓子工房（サンプル）',
    memo: '規格外ふじりんご5kgで初回50瓶を試作。マルシェで試食販売を目指す。',
    calc: {
      materialCost: 160,
      processCost: 180,
      packCost: 90,
      fixedCost: 6000,
      batchQty: 50,
      sellPrice: 880,
      shareRatioA: 50
    },
    todos: [
      { text: '規格外ふじりんごの糖度・サンプル量（5kg）を共有する', done: true },
      { text: '「🧮 原価・山分け」タブで売価と黒字ラインを確認する', done: false },
      { text: '合意カードで「費用配分・売り方・軽トラ便」を確定してPDF出力する', done: false },
      { text: '店頭ストーリーPOPと8枚面付けストーリー名刺を印刷テストする', done: false }
    ],
    messages: [
      { id: 8001, sender: 'partner', name: '大阪クラフト菓子工房', text: 'はじめまして！規格外ふじの投稿を拝見しました。皮ごと煮詰める無添加りんごバター、50瓶の小ロットから試作できますよ🍎', time: '10:15' },
      { id: 8002, sender: 'me', name: '自分', text: 'ありがとうございます！すごく嬉しいです。まずは糖度高めのふじ5kgを今週中にサンプル発送しますね📦', time: '10:22' },
      { id: 8003, sender: 'partner', name: '大阪クラフト菓子工房', text: '助かります！右の「原価・山分け」タブで1瓶880円・50瓶試算を入れてみました。これならお互い無理なく黒字にできそうです👍', time: '10:28' }
    ],
    diaries: [
      {
        id: 5001,
        date: '試作1日目',
        masked: true,
        text: 'ふじりんごの皮を活かすため低温でじっくり煮詰めテスト！試作原価[非公開]内で収まる見込み。香りが部屋中に広がって最高でした🍎',
        photo: SAMPLE_APPLE_IMG
      }
    ]
  }
];

const DEFAULT_MARCHE = [
  {
    id: 201,
    title: '信州ふじの無添加「ご縁りんごジュレ」',
    makers: '信州りんご農園 × 松本ジャム工房',
    price: 880,
    story: '雹（ひょう）で少し傷がついただけの極上ふじを皮ごと煮詰めた、香り爆発の試作第1号。3回の糖度調整を経て完成しました。',
    photo: SAMPLE_APPLE_IMG,
    cheers: 18
  },
  {
    id: 202,
    title: '町工場の低温焙煎「黒豆きなこクランチ」',
    makers: '丹波・黒豆農家 × 京都菓子製作所',
    price: 750,
    story: '割れ豆を捨てずに活かしたい一言つぶやきから3週間で形になった香ばしい逸品。古民家カフェのほうじ茶に抜群に合います。',
    photo: '',
    cheers: 14
  }
];

const DEFAULT_TOOLS = [
  {
    id: 301,
    name: 'プロ仕様・疲れにくい軽量剪定ばさみ（国産鍛造）',
    author: '信州りんご農園 / 田中',
    comment: '1日500本切っても手首が痛くならない神道具。農園スタッフ全員これに変えました。',
    userUrl: 'https://hb.afl.rakuten.co.jp/example-farmer-tanaka',
    adminUrl: 'https://hb.afl.rakuten.co.jp/example-enjoy-marche-fund',
    clicks: 3
  },
  {
    id: 302,
    name: '小ロット試作向け・卓上真空パックシーラー',
    author: '大阪クラフト菓子工房',
    comment: 'マルシェ用の50〜100個包装ならこれで十分！食品ロスも激減しました。',
    userUrl: 'https://amzn.to/example-osaka-kobo',
    adminUrl: 'https://amzn.to/example-enjoy-marche-fund',
    clicks: 2
  }
];

const DEFAULT_BADGES = ['🌱 EN•joy 初期チャレンジャー'];