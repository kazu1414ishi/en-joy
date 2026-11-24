/* ============================================================
   EN•joy v6.0 — 統合マスタ & 初期データ (data.js)
   ============================================================ */

window.ENJOY_V6_KEY = 'enjoy_v6_state';

/* ---------- 1. 旬の食材＆見分け方マスタ（左端：役立ち） ---------- */
window.ENJOY_SHUN = [
  {
    id: 'apple', name: 'りんご（サンふじ）', icon: '🍎', months: [10, 11, 12, 1],
    tip: 'お尻まで黄色く、ズッシリ重いものが蜜入り。枝スレは味に影響なし。',
    save: '新聞紙で包み野菜室へ。大量買いは皮ごとレンジコンポート＆冷凍。',
    nutrients: ['ビタミンC', '食物繊維']
  },
  {
    id: 'hakusai', name: '白菜', icon: '🥬', months: [11, 12, 1, 2],
    tip: 'カット断面が平らで、外葉が濃い緑・巻きが固いものが甘い。',
    save: 'ざく切りでそのまま生冷凍。煮物の味しみが爆速に。',
    nutrients: ['ビタミンC', '葉酸']
  },
  {
    id: 'daikon', name: '大根', icon: '🥕', months: [11, 12, 1, 2, 3],
    tip: 'ひげ根の穴が真っすぐ縦に並ぶものが甘くてみずみずしい。',
    save: 'いちょう切りで冷凍すると時短おでん・煮物に最適。',
    nutrients: ['消化酵素', '食物繊維']
  },
  {
    id: 'spinach', name: 'ほうれん草', icon: '🌿', months: [11, 12, 1, 2],
    tip: '根元が濃い赤ピンクで葉が肉厚な冬の「寒締め」が甘い。',
    save: 'さっと茹でて小分け冷凍。味噌汁に毎日ポンッと追加。',
    nutrients: ['鉄分', 'ビタミンA']
  },
  {
    id: 'tomato', name: '完熟トマト', icon: '🍅', months: [5, 6, 7, 8, 9, 10, 11],
    tip: 'お尻に白い星型（スターマーク）が出るほど高糖度。',
    save: 'ヘタを取り丸ごと冷凍。水で皮がツルンとむけてソースに最高。',
    nutrients: ['リコピン', 'ビタミンC']
  }
];

/* ---------- 2. 開発資材＆協賛パートナー（左端：役立ち） ---------- */
window.ENJOY_MATERIALS = [
  {
    id: 'mat-jar', name: '耐熱ジャム瓶 140ml（キャップ付）', unitPrice: 78,
    rakuten: 'https://search.rakuten.co.jp/search/mall/ジャム瓶+140ml+耐熱/',
    amazon: 'https://www.amazon.co.jp/s?k=ジャム瓶+140ml+耐熱'
  },
  {
    id: 'mat-pouch', name: 'クラフト窓付きスタンドパック', unitPrice: 32,
    rakuten: 'https://search.rakuten.co.jp/search/mall/クラフト+スタンドパック+窓付き/',
    amazon: 'https://www.amazon.co.jp/s?k=クラフト+スタンドパック+窓付き'
  },
  {
    id: 'mat-label', name: '耐水・和紙風ラベルシール（A4）', unitPrice: 18,
    rakuten: 'https://search.rakuten.co.jp/search/mall/耐水+和紙+ラベルシール/',
    amazon: 'https://www.amazon.co.jp/s?k=耐水+和紙+ラベルシール'
  },
  {
    id: 'mat-box', name: '古民家風クラフトギフト箱（2本入）', unitPrice: 120,
    rakuten: 'https://search.rakuten.co.jp/search/mall/ギフトボックス+クラフト+瓶/',
    amazon: 'https://www.amazon.co.jp/s?k=ギフトボックス+クラフト+瓶'
  }
];

window.ENJOY_SPONSORS = [
  { id: 'sp-1', name: '京都・烏丸シェアテストキッチン', area: '京都市', offer: '毎月2枠「試作利用料 無料」', applied: ['無添加りんごジャム'] },
  { id: 'sp-2', name: '関西クラフト瓶パートナーズ', area: '東大阪市', offer: '初回試作用の耐熱瓶30本 無償提供', applied: [] }
];

/* ---------- 3. 30秒ご縁タイプ診断 ---------- */
window.ENJOY_DIAG_Q = [
  {
    q: '規格外や端材を見つけたとき、まず浮かぶのは？',
    opts: [
      { label: '💡 新商品のアイデアを企画したい', type: 'spark' },
      { label: '🛠️ どう加工すれば最高に仕上がるか考える', type: 'craft' },
      { label: '🤝 あの人とあの人を繋げば解決しそう', type: 'bridge' },
      { label: '🧡 みんなに広めて応援したい', type: 'cheer' }
    ]
  },
  {
    q: 'チームで動くとき、自然と引き受ける役割は？',
    opts: [
      { label: '🚩 最初に旗を振る発起人', type: 'spark' },
      { label: '⚙️ 試作・品質を詰める職人', type: 'craft' },
      { label: '📅 段取り・連絡調整の番頭', type: 'bridge' },
      { label: '📣 盛り上げ・お客さん目線のレビュー', type: 'cheer' }
    ]
  }
];

window.ENJOY_DIAG_RES = {
  spark:  { icon: '🔥', title: 'アイデア発起人', match: '職人タイプ・番頭タイプ' },
  craft:  { icon: '🛠️', title: '仕立ての職人',   match: '発起人タイプ・応援団長タイプ' },
  bridge: { icon: '🤝', title: 'ご縁の番頭',     match: '発起人タイプ・職人タイプ' },
  cheer:  { icon: '🧡', title: '現場の応援団長', match: '職人タイプ・発起人タイプ' }
};

/* ---------- 4. 初期アプリ状態 ---------- */
window.createDefaultV6State = function () {
  return {
    uiMode: null, // 初回は null → モダン / かんたん選択モーダル表示
    focusMode: false,
    activeRoomId: 'room-1',
    activeProductId: 'prod-1',
    myShares: 5,

    profile: {
      name: 'あなた（EN•joy発起人）',
      role: 'デザイン・企画',
      area: '大阪府高槻市',
      skills: '企画設計・仕組みづくり・データ分析',
      bio: '農家・町工場・異業種を繋いで、楽しく続く共創と京都古民家EC（EN•dress）を作っています。',
      diagType: null
    },

    /* 左端：役立ち（レシピ） */
    recipes: [
      {
        id: 'rec-1', title: '皮ごと無添加りんごレンジコンポート', tag: '箱買い消費',
        author: '青木りんご園', ingredients: 'りんご 2個、砂糖 大さじ2',
        steps: 'くし切りにして砂糖と600Wで7分チン。'
      },
      {
        id: 'rec-2', title: '白菜1/2玉ペロリ！豚バラみそ重ね蒸し', tag: '農家めし',
        author: 'たかつき太陽農園', ingredients: '白菜 1/2玉、豚バラ 150g、みそ 大さじ2',
        steps: '交互に重ねてみそだしをかけ12分蒸すだけ。'
      }
    ],

    /* 左2：広場（画像対応つぶやき & 15秒動画） */
    feeds: [
      {
        id: 'f-1', tag: '余ってます', area: '長野・安曇野', author: '青木りんご園',
        text: '強風で枝スレのサンふじ80kg出ました！蜜入りで味は最高。加工してくれる工房さんいませんか？',
        image: null, likes: 14, createdAt: '2時間前'
      },
      {
        id: 'f-2', tag: '軽トラ便', area: '大阪・高槻→京都', author: '佐藤（軽トラ）',
        text: '土曜朝8時に京都へ走ります。荷台半分空いているので試作品の相乗りどうぞ！',
        image: null, likes: 9, createdAt: '5時間前'
      }
    ],
    shorts: [
      { id: 'v-1', title: '枝スレりんごを皮ごとジャムにする15秒', author: '青木りんご園', tag: '🍎 現場', url: 'https://www.youtube.com/shorts/', likes: 34 },
      { id: 'v-2', title: '低温ドライ機からパリッと焼き上がる音', author: 'なにわ乾燥工房', tag: '⚙️ 町工場', url: 'https://www.youtube.com/shorts/', likes: 28 }
    ],

    /* 真ん中：EN 出会い（大きい案件：やりたいこと募集 / おすすめの人 / マップ） */
    ideas: [
      {
        id: 'idea-1', cat: '活用模索', title: '間伐ヒノキの端材×香袋・マルシェ什器を一緒に作りたい',
        need: 'デザイナー・縫製工房', author: '丹波きこり組', area: '兵庫県丹波市',
        detail: '製材時に出る香りの良いヒノキ端材が月200kgあります。食品以外のマルシェ定番品へ昇華させたいです。',
        likes: 16
      },
      {
        id: 'idea-2', cat: '商品開発', title: '規格外サンふじで「常温で日持ちする手土産スイーツ」開発',
        need: '菓子工房・パッケージ設計', author: '青木りんご園', area: '長野県安曇野市',
        detail: '10kg〜小ロットで試作スタート希望。京都の古民家セレクト棚（EN•dress）に並ぶ逸品を一緒に作りたい！',
        likes: 23
      }
    ],
    people: [
      { id: 'p-1', name: '青木りんご園', role: '農家・生産者', area: '長野県安曇野市', skills: 'りんご栽培・軽トラ', heat: 118 },
      { id: 'p-2', name: 'なにわ乾燥工房', role: '町工場・加工', area: '大阪府東大阪市', skills: '低温ドライ・瓶詰め', heat: 112 },
      { id: 'p-3', name: '紙工アトリエ縁', role: 'デザイン・企画', area: '京都府京都市', skills: '和紙パッケージ・POP', heat: 104 }
    ],
    spots: [
      { id: 'sp-a', name: '青木りんご園 直売所', type: '農家', icon: '🍎', area: '長野県安曇野市', x: 70, y: 32, memo: '安曇野ICから車12分・駐車5台', stamped: false },
      { id: 'sp-b', name: 'EN•dress 古民家拠点', type: '拠点', icon: '🏮', area: '京都市中京区', x: 48, y: 54, memo: '烏丸駅徒歩8分・暖簾が目印', stamped: true },
      { id: 'sp-c', name: 'なにわ乾燥工房', type: '町工場', icon: '⚙️', area: '大阪府東大阪市', x: 32, y: 74, memo: '布施駅徒歩12分・軽トラ横付け可', stamped: false }
    ],

    /* 右2：通販 & 右端：ホーム（開発ルーム・商品統合） */
    rooms: [
      {
        id: 'room-1',
        name: '青木りんご園 × なにわ工房',
        members: ['あなた', '青木りんご園', 'なにわ乾燥工房'],
        products: [
          {
            id: 'prod-1', title: '無添加りんごジャム', phase: '試作中',
            priceSell: 650, earlyPrice: 550, ticketsBought: 12, ticketsLimit: 30,
            costRaw: 140, costLabor: 110, adoptedMaterialIds: ['mat-jar', 'mat-label'],
            images: [],
            chats: [
              { id: 'c-1', author: '青木りんご園', text: 'サンふじ20kg発送しました！皮ごと煮ると香り最高です。', date: '11/22', isPrivate: false },
              { id: 'c-2', author: 'なにわ乾燥工房', text: '瓶は100本単位なら65円まで下がります（メンバー限定）', date: '11/23', isPrivate: true }
            ],
            calendar: [
              { id: 'cal-1', date: '2026-11-28', title: '試作2回目・糖度チェック' }
            ],
            reactions: { cheer: 18, eat: 27 }
          },
          {
            id: 'prod-2', title: '低温乾燥りんごチップス', phase: '販売中',
            priceSell: 520, earlyPrice: 450, ticketsBought: 24, ticketsLimit: 30,
            costRaw: 110, costLabor: 90, adoptedMaterialIds: ['mat-pouch', 'mat-label'],
            images: [],
            chats: [
              { id: 'c-3', author: 'なにわ乾燥工房', text: '2.5mm厚・低温8時間でパリッと完成！販売開始できます。', date: '11/24', isPrivate: false }
            ],
            calendar: [],
            reactions: { cheer: 15, eat: 31 }
          }
        ]
      }
    ],

    shoppingBook: {
      favorites: ['prod-1'],
      purchases: [
        { id: 'pur-1', title: '低温乾燥りんごチップス', rating: 5, memo: 'パリパリで止まらない！次回2袋リピート。', date: '11/24' }
      ]
    },

    ringEntries: [
      { id: 'r-1', name: '青木りんご園', role: '農家', message: '蜜入りりんごで笑顔に！', rank: 'M' },
      { id: 'r-2', name: 'なにわ乾燥工房', role: '町工場', message: '小ロット試作お任せ！', rank: 'M' },
      { id: 'r-3', name: '京都テストキッチン', role: '協賛', message: 'EN•dressを全力応援！', rank: 'L' }
    ],

    inbox: [
      { id: 'm-1', from: 'マルシェ好きミキ', text: '無添加りんごジャム、発売したら絶対買います！', date: '11/24 18:10', unread: true },
      { id: 'm-2', from: 'なにわ乾燥工房', text: '11/28の試作2回目、10時から釜を空けておきますね。', date: '11/23 20:05', unread: false }
    ]
  };
};