/* =========================================================
   EN•joy 役立ちコーナー本気モジュール（patch_tips_pro.js）
   ・固定「12月」× 流れるぼかし背景ヘッダー
   ・旬の者たち（12品3列グリッド / 栄養 / 保存・保温 / レスキュー / レシピ連動）
   ・旬レシピ（2列一覧 / PFC＆12月不足栄養計算 / 1週間献立ビルダー / 自動合算買物リスト）
   ========================================================= */

const EN_SHUN_DEC = [
  // --- 野菜（6品） ---
  {
    id: 'daikon', cat: 'veg', catLabel: '野菜', name: '冬大根', rescue: true,
    topNutri: 'ビタミンC・消化酵素', img: 'https://picsum.photos/seed/dec-daikon/360/360',
    desc: '寒さで甘みが凝縮する12月の主役。割れや二股の規格外ほど甘く、煮物やみぞれ鍋に最高です。',
    nutrients: [{ n: 'ビタミンC(葉)', v: 92 }, { n: '食物繊維', v: 78 }, { n: 'ジアスターゼ', v: 90 }, { n: 'カリウム', v: 74 }],
    storage: {
      room: '新聞紙に包み冷暗所で約1週間（葉は必ず切り離す）',
      fridge: 'カット後はラップ密着で野菜室5〜7日',
      warm: '煮物は一度冷まして再加熱（保温調理）すると味染み2倍！'
    }
  },
  {
    id: 'hakusai', cat: 'veg', catLabel: '野菜', name: '霜降り白菜', rescue: true,
    topNutri: 'カリウム・ビタミンC', img: 'https://picsum.photos/seed/dec-hakusai/360/360',
    desc: '霜に当たるとデンプンが糖に変わり激甘に。1玉買いすると余りがちなので重ね蒸し＆鍋で大量消費！',
    nutrients: [{ n: 'ビタミンC', v: 82 }, { n: 'カリウム', v: 86 }, { n: '葉酸', v: 76 }, { n: '食物繊維', v: 74 }],
    storage: {
      room: '丸ごとなら新聞紙で包み立てて冷暗所2〜3週間',
      fridge: 'カット品は芯に切れ目を入れポリ袋で野菜室1週間',
      warm: 'スープジャーや土鍋保温でトロトロ甘味アップ'
    }
  },
  {
    id: 'horenso', cat: 'veg', catLabel: '野菜', name: 'ちぢみほうれん草', rescue: false,
    topNutri: '鉄分・葉酸・βカロテン', img: 'https://picsum.photos/seed/dec-spinach/360/360',
    desc: '冬採れは夏採りの約3倍のビタミンC！冷えやすい12月の鉄分・葉酸チャージの最強野菜です。',
    nutrients: [{ n: '鉄分', v: 94 }, { n: 'ビタミンC', v: 90 }, { n: '葉酸', v: 96 }, { n: 'βカロテン', v: 92 }],
    storage: {
      room: '常温NG（しおれやすいので即冷蔵）',
      fridge: '湿らせたキッチンペーパーで包み立てて冷蔵4〜5日',
      warm: '下茹では30秒！冷凍ストックなら汁物に凍ったまま投入OK'
    }
  },
  {
    id: 'broccoli', cat: 'veg', catLabel: '野菜', name: '冬ブロッコリー', rescue: false,
    topNutri: 'VitC・植物たんぱく', img: 'https://picsum.photos/seed/dec-broccoli/360/360',
    desc: '野菜トップクラスのビタミンCとたんぱく質。実は「茎」のほうが甘くて栄養豊富なので丸ごと使おう！',
    nutrients: [{ n: 'ビタミンC', v: 98 }, { n: 'たんぱく質', v: 76 }, { n: '葉酸', v: 88 }, { n: '食物繊維', v: 84 }],
    storage: {
      room: '常温NG（すぐ黄色くなるため冷蔵へ）',
      fridge: 'チルド室（0℃付近）にポリ袋で入れると10日シャキシャキ',
      warm: '茹でず「少量の水で2分蒸し」するとビタミンC流出ゼロ'
    }
  },
  {
    id: 'renkon', cat: 'veg', catLabel: '野菜', name: '新れんこん', rescue: false,
    topNutri: '食物繊維・ポリフェノール', img: 'https://picsum.photos/seed/dec-renkon/360/360',
    desc: '冬の粘り気が強いれんこんは免疫サポートに◎。ビタミンCがデンプンに守られ加熱しても壊れにくい！',
    nutrients: [{ n: 'ビタミンC', v: 86 }, { n: '食物繊維', v: 88 }, { n: 'カリウム', v: 80 }, { n: 'ポリフェノール', v: 82 }],
    storage: {
      room: '泥付きなら新聞紙で包み冷暗所1週間',
      fridge: '洗い品は濡れペーパー＋ラップで野菜室5〜7日',
      warm: 'すりおろして汁物に入れるととろみ＆保温効果が長続き'
    }
  },
  {
    id: 'shungiku', cat: 'veg', catLabel: '野菜', name: '香り春菊', rescue: false,
    topNutri: 'βカロテン・カルシウム', img: 'https://picsum.photos/seed/dec-shungiku/360/360',
    desc: '12月の鍋の必須メンバー。香気成分が胃腸を温め、不足しがちなカルシウムとβカロテンが豊富です。',
    nutrients: [{ n: 'βカロテン', v: 94 }, { n: 'カルシウム', v: 82 }, { n: '鉄分', v: 78 }, { n: '葉酸', v: 86 }],
    storage: {
      room: '常温NG（乾燥に弱い）',
      fridge: '濡れペーパーで包み袋に入れて立てて野菜室3〜4日',
      warm: '鍋の最後にサッと10秒くぐらせるだけで香りMAX'
    }
  },
  // --- 果物（3品） ---
  {
    id: 'mikan', cat: 'fruit', catLabel: '果物', name: '完熟みかん', rescue: true,
    topNutri: 'VitC・βクリプトキサンチン', img: 'https://picsum.photos/seed/dec-mikan/360/360',
    desc: '12月は豊作＆サイズ不揃いの規格外が大量に出る時期！白い筋とワタごと食べると血管ケア＆食物繊維UP。',
    nutrients: [{ n: 'ビタミンC', v: 95 }, { n: '食物繊維(筋)', v: 84 }, { n: 'βクリプト', v: 96 }, { n: 'クエン酸', v: 85 }],
    storage: {
      room: 'ヘタを下にして風通しの良い涼しい場所で2週間',
      fridge: '暖かい部屋なら野菜室へ（箱の底から傷むので天地返し）',
      warm: '焼きみかん・ホットみかんにすると体を冷やさず甘み倍増'
    }
  },
  {
    id: 'ringo', cat: 'fruit', catLabel: '果物', name: '蜜入りりんご', rescue: true,
    topNutri: 'ペクチン・ポリフェノール', img: 'https://picsum.photos/seed/dec-apple/360/360',
    desc: '12月が最高峰のサンふじ。皮のすぐ下にポリフェノールが集中しているので、傷あり品は皮ごとコンポートに！',
    nutrients: [{ n: '食物繊維', v: 86 }, { n: 'ポリフェノール', v: 90 }, { n: 'カリウム', v: 78 }, { n: '有機酸', v: 80 }],
    storage: {
      room: '寒い玄関・廊下で新聞紙包み2週間',
      fridge: '1個ずつポリ袋で密閉して冷蔵（エチレン対策）1ヶ月OK',
      warm: '電子レンジ3分のホットりんごで整腸ペクチンが活性化！'
    }
  },
  {
    id: 'yuzu', cat: 'fruit', catLabel: '果物', name: '冬至ゆず', rescue: true,
    topNutri: 'VitC(皮)・リモネン', img: 'https://picsum.photos/seed/dec-yuzu/360/360',
    desc: '12月22日の冬至に大活躍。皮のビタミンCは果汁の約4倍！余ったゆずは千切り冷凍で1年中使えます。',
    nutrients: [{ n: 'ビタミンC(皮)', v: 98 }, { n: 'クエン酸', v: 90 }, { n: 'リモネン', v: 95 }, { n: '食物繊維', v: 76 }],
    storage: {
      room: '冬場の冷暗所で1〜2週間',
      fridge: 'ポリ袋に入れて野菜室で約3週間',
      warm: 'ゆず湯＆はちみつゆず茶で体の芯までポカポカ保温'
    }
  },
  // --- 魚介（3品） ---
  {
    id: 'buri', cat: 'fish', catLabel: '魚介', name: '寒ぶり', rescue: false,
    topNutri: 'ビタミンD・EPA/DHA', img: 'https://picsum.photos/seed/dec-buri/360/360',
    desc: '12月に日照不足で激減する「ビタミンD」の最強補給源！脂がのって旨みも栄養も1年でピークです。',
    nutrients: [{ n: 'ビタミンD', v: 98 }, { n: 'たんぱく質', v: 94 }, { n: 'EPA/DHA', v: 96 }, { n: '鉄分', v: 76 }],
    storage: {
      room: '常温NG（即冷蔵or下味冷凍へ）',
      fridge: '水分を拭き塩少々＋ラップでチルド室2日',
      warm: 'ぶり大根は火を止めて余熱保温20分で身がふっくら'
    }
  },
  {
    id: 'tara', cat: 'fish', catLabel: '魚介', name: '真鱈（たら）', rescue: false,
    topNutri: '高たんぱく・VitD・低脂質', img: 'https://picsum.photos/seed/dec-tara/360/360',
    desc: '高たんぱく＆超低脂質でPFCバランスを整える優等生！冬に不足するビタミンDも豊富で鍋・ムニエルに万能。',
    nutrients: [{ n: 'たんぱく質', v: 92 }, { n: 'ビタミンD', v: 88 }, { n: '低脂質度', v: 96 }, { n: 'ビタミンB12', v: 84 }],
    storage: {
      room: '常温NG',
      fridge: 'キッチンペーパーで水気を拭きチルド室1〜2日',
      warm: '酒と塩を振って10分置くと臭みゼロ＆ふっくら仕上がる'
    }
  },
  {
    id: 'kaki', cat: 'fish', catLabel: '魚介', name: '冬牡蠣（かき）', rescue: false,
    topNutri: '亜鉛・鉄分・ビタミンB12', img: 'https://picsum.photos/seed/dec-oyster/360/360',
    desc: '「海のミルク」と呼ばれる冬のごちそう。免疫と冷え対策に欠かせない亜鉛・鉄分が圧倒的トップクラス！',
    nutrients: [{ n: '亜鉛', v: 100 }, { n: '鉄分', v: 92 }, { n: 'ビタミンB12', v: 98 }, { n: 'たんぱく質', v: 82 }],
    storage: {
      room: '常温NG（必ず冷蔵）',
      fridge: '塩水ごとチルド室で消費期限内（1〜2日）',
      warm: '片栗粉を薄くまぶして加熱すると縮まず旨み＆熱々キープ'
    }
  }
];

const EN_SHUN_RECIPES = [
  {
    id: 'rec-1', title: '寒ぶりと冬大根の余熱しみしみ「ぶり大根」', time: '25分', rescue: true,
    shunIds: ['buri', 'daikon', 'yuzu'], img: 'https://picsum.photos/seed/rec-buridaikon/480/320',
    tags: ['日照不足VitD', '保温味染み'],
    kcal: 540, p: 36, f: 22, c: 44, vitD: 95, vitC: 45, iron: 40, fiber: 55, calc: 35,
    ingredients: [
      { name: '寒ぶり切り身', qty: 2, unit: '切れ', cat: '🐟 魚・肉' },
      { name: '冬大根', qty: 0.3, unit: '本', cat: '🥬 野菜・果物' },
      { name: '冬至ゆず（皮）', qty: 0.2, unit: '個', cat: '🥬 野菜・果物' },
      { name: 'しょうが・醤油・みりん', qty: 1, unit: '式', cat: '🧂 調味料・その他' }
    ],
    steps: ['大根は2cm厚の半月切りで下茹で', 'ぶりに熱湯をかけて霜降りし臭みオフ', '煮汁で15分煮て、火を止め余熱保温15分で完成！']
  },
  {
    id: 'rec-2', title: '真鱈と白菜・春菊の「ゆず香る白だし豆乳鍋」', time: '15分', rescue: true,
    shunIds: ['tara', 'hakusai', 'shungiku', 'yuzu'], img: 'https://picsum.photos/seed/rec-taranabe/480/320',
    tags: ['高たんぱく', 'カルシウム'],
    kcal: 460, p: 38, f: 14, c: 40, vitD: 85, vitC: 72, iron: 58, fiber: 75, calc: 85,
    ingredients: [
      { name: '真鱈切り身', qty: 2, unit: '切れ', cat: '🐟 魚・肉' },
      { name: '霜降り白菜', qty: 0.25, unit: '玉', cat: '🥬 野菜・果物' },
      { name: '香り春菊', qty: 0.5, unit: '束', cat: '🥬 野菜・果物' },
      { name: '無調整豆乳', qty: 300, unit: 'ml', cat: '🧂 調味料・その他' }
    ],
    steps: ['白菜の芯から白だしで煮る', '真鱈と豆乳を加え弱火でフツフツ煮る', '仕上げに春菊とゆず皮をのせて温かいうちに！']
  },
  {
    id: 'rec-3', title: '牡蠣とちぢみほうれん草の「鉄分たっぷりグラタン」', time: '20分', rescue: false,
    shunIds: ['kaki', 'horenso'], img: 'https://picsum.photos/seed/rec-oystergratin/480/320',
    tags: ['鉄分＆亜鉛MAX', '冷え対策'],
    kcal: 560, p: 32, f: 24, c: 48, vitD: 55, vitC: 68, iron: 95, fiber: 60, calc: 90,
    ingredients: [
      { name: '冬牡蠣（加熱用）', qty: 150, unit: 'g', cat: '🐟 魚・肉' },
      { name: 'ちぢみほうれん草', qty: 0.5, unit: '束', cat: '🥬 野菜・果物' },
      { name: '牛乳・米粉・チーズ', qty: 1, unit: '式', cat: '🧂 調味料・その他' }
    ],
    steps: ['牡蠣を片栗粉で優しく洗いソテー', 'ほうれん草と米粉ホワイトソースを絡める', 'チーズをのせてトースターで焼き色をつける']
  },
  {
    id: 'rec-4', title: '規格外みかんの皮ごと甘酢チキン＆ブロッコリー', time: '18分', rescue: true,
    shunIds: ['mikan', 'broccoli'], img: 'https://picsum.photos/seed/rec-mikanchicken/480/320',
    tags: ['廃棄レスキュー', 'VitC爆盛り'],
    kcal: 580, p: 38, f: 20, c: 56, vitD: 25, vitC: 100, iron: 45, fiber: 78, calc: 45,
    ingredients: [
      { name: '鶏もも肉', qty: 250, unit: 'g', cat: '🐟 魚・肉' },
      { name: '完熟みかん（規格外OK）', qty: 2, unit: '個', cat: '🥬 野菜・果物' },
      { name: '冬ブロッコリー', qty: 0.5, unit: '株', cat: '🥬 野菜・果物' }
    ],
    steps: ['鶏肉をカリッと焼き、2分蒸しブロッコリーを添える', 'みかん果汁＋薄切り皮＋醤油・酢で甘酢ダレを煮絡める', '爽やかな香りでご飯が進む！']
  },
  {
    id: 'rec-5', title: '新れんこんと豚肉の「すりおろし保温とろみ汁」', time: '15分', rescue: false,
    shunIds: ['renkon', 'daikon'], img: 'https://picsum.photos/seed/rec-renkonsoup/480/320',
    tags: ['保温力◎', '食物繊維'],
    kcal: 490, p: 28, f: 18, c: 52, vitD: 30, vitC: 80, iron: 50, fiber: 92, calc: 42,
    ingredients: [
      { name: '豚バラ薄切り', qty: 150, unit: 'g', cat: '🐟 魚・肉' },
      { name: '新れんこん', qty: 150, unit: 'g', cat: '🥬 野菜・果物' },
      { name: '冬大根', qty: 0.2, unit: '本', cat: '🥬 野菜・果物' }
    ],
    steps: ['れんこん半分は薄切り、半分はすりおろす', '豚肉・大根をだしで煮て味噌を溶く', '最後にすりおろしれんこんを入れて自然なとろみで保温！']
  },
  {
    id: 'rec-6', title: '白菜1/4玉ペロリ！豚バラのゆずポン重ね蒸し', time: '15分', rescue: true,
    shunIds: ['hakusai', 'yuzu'], img: 'https://picsum.photos/seed/rec-millefeuille/480/320',
    tags: ['大量消費', '15分時短'],
    kcal: 520, p: 30, f: 22, c: 46, vitD: 25, vitC: 76, iron: 42, fiber: 82, calc: 50,
    ingredients: [
      { name: '霜降り白菜', qty: 0.25, unit: '玉', cat: '🥬 野菜・果物' },
      { name: '豚バラ薄切り', qty: 200, unit: 'g', cat: '🐟 魚・肉' },
      { name: '冬至ゆず（果汁＆皮）', qty: 0.5, unit: '個', cat: '🥬 野菜・果物' }
    ],
    steps: ['白菜と豚肉を交互に重ねて5cm幅にカット', '鍋にぎっしり詰めて酒大さじ3で12分蓋蒸し', 'ゆずポン酢でさっぱりいただく！']
  },
  {
    id: 'rec-7', title: 'ブロッコリー丸ごと＆鮭の「ビタミンD満点クリーム煮」', time: '18分', rescue: true,
    shunIds: ['broccoli', 'horenso'], img: 'https://picsum.photos/seed/rec-salmoncream/480/320',
    tags: ['日照不足VitD', 'カルシウム'],
    kcal: 550, p: 35, f: 21, c: 50, vitD: 96, vitC: 92, iron: 62, fiber: 76, calc: 88,
    ingredients: [
      { name: '生鮭切り身', qty: 2, unit: '切れ', cat: '🐟 魚・肉' },
      { name: '冬ブロッコリー', qty: 0.5, unit: '株', cat: '🥬 野菜・果物' },
      { name: 'ちぢみほうれん草', qty: 0.5, unit: '束', cat: '🥬 野菜・果物' },
      { name: '無調整豆乳', qty: 200, unit: 'ml', cat: '🧂 調味料・その他' }
    ],
    steps: ['ブロッコリーの茎も薄切りにして鮭とソテー', '豆乳とコンソメで8分煮込む', 'ほうれん草をサッと混ぜて完成！']
  },
  {
    id: 'rec-8', title: '傷ありりんご丸ごと！豚ロースの「ハニーアップルソテー」', time: '15分', rescue: true,
    shunIds: ['ringo', 'shungiku'], img: 'https://picsum.photos/seed/rec-applepork/480/320',
    tags: ['廃棄レスキュー', '整腸ペクチン'],
    kcal: 570, p: 34, f: 20, c: 58, vitD: 20, vitC: 65, iron: 55, fiber: 84, calc: 55,
    ingredients: [
      { name: '豚ロース（生姜焼き用）', qty: 200, unit: 'g', cat: '🐟 魚・肉' },
      { name: '蜜入りりんご（皮ごと）', qty: 1, unit: '個', cat: '🥬 野菜・果物' },
      { name: '香り春菊', qty: 0.5, unit: '束', cat: '🥬 野菜・果物' }
    ],
    steps: ['りんごを皮ごとくし切りにしバターでこんがり焼く', '豚ロースを焼き醤油＆少々はちみつで絡める', '生春菊サラダを添えてビタミン＆鉄分UP！']
  }
];

// 役立ちコーナー拡張状態
const enTipsProState = {
  shunCat: 'all',          // 'all' | 'veg' | 'fruit' | 'fish'
  recipeFilterShun: 'all', // 'all' | shunId
  recipeMode: 'week',      // 'list'(レシピ一覧) | 'week'(1週間献立＆栄養計算＆自動買物) | 'community'(みんな投稿)
  weekGoal: 'immune',      // 'immune'(免疫＆日照VitD/C) | 'protein'(温活・高たんぱく) | 'rescue'(廃棄レスキュー)
  weekPlanIds: ['rec-1', 'rec-4', 'rec-2', 'rec-3', 'rec-5', 'rec-7', 'rec-6'], // 月〜日
  autoShopChecked: {}
};

// 1週間の目標別に最適7日メニューを自動生成
function autoBuildWeekPlan(goal) {
  enTipsProState.weekGoal = goal;
  if (goal === 'immune') {
    enTipsProState.weekPlanIds = ['rec-1', 'rec-4', 'rec-7', 'rec-3', 'rec-2', 'rec-5', 'rec-6'];
    enToast('🛡️ 12月の日照不足(VitD)＆風邪予防(VitC)重視で7日間を編成しました！');
  } else if (goal === 'protein') {
    enTipsProState.weekPlanIds = ['rec-2', 'rec-4', 'rec-1', 'rec-7', 'rec-8', 'rec-3', 'rec-5'];
    enToast('💪 高たんぱく＆鉄分・保温重視で7日間を編成しました！');
  } else {
    enTipsProState.weekPlanIds = ['rec-6', 'rec-4', 'rec-1', 'rec-8', 'rec-2', 'rec-7', 'rec-5'];
    enToast('♻️ 旬の規格外・余りやすい食材を救う7日間を編成しました！');
  }
  renderEnTips();
}

// 選んだ7日分の栄養（平均PFC・12月不足栄養5軸）をリアルタイム計算
function calcWeekNutrition(ids) {
  const recs = ids.map(id => EN_SHUN_RECIPES.find(r => r.id === id) || EN_SHUN_RECIPES[0]);
  const n = recs.length || 1;
  const avg = key => Math.round(recs.reduce((s, r) => s + r[key], 0) / n);
  const p = avg('p'), f = avg('f'), c = avg('c'), kcal = avg('kcal');
  const pCal = p * 4, fCal = f * 9, cCal = c * 4, tot = pCal + fCal + cCal || 1;
  return {
    kcal, p, f, c,
    pPct: Math.round((pCal / tot) * 100),
    fPct: Math.round((fCal / tot) * 100),
    cPct: Math.round((cCal / tot) * 100),
    vitD:  Math.min(100, Math.round(avg('vitD') * 1.15)),
    vitC:  Math.min(100, Math.round(avg('vitC') * 1.15)),
    iron:  Math.min(100, Math.round(avg('iron') * 1.2)),
    fiber: Math.min(100, Math.round(avg('fiber') * 1.15)),
    calc:  Math.min(100, Math.round(avg('calc') * 1.2))
  };
}

// 7日分のレシピから材料を自動合算してカテゴリ別買い物リストを生成
function buildAggregatedShoppingList(ids) {
  const map = new Map();
  ids.forEach(id => {
    const rec = EN_SHUN_RECIPES.find(r => r.id === id);
    if (!rec) return;
    rec.ingredients.forEach(ing => {
      const key = `${ing.cat}__${ing.name}__${ing.unit}`;
      if (!map.has(key)) map.set(key, { ...ing });
      else {
        const cur = map.get(key);
        if (ing.unit !== '式') cur.qty = Math.round((cur.qty + ing.qty) * 100) / 100;
      }
    });
  });
  const grouped = {};
  map.forEach(item => {
    if (!grouped[item.cat]) grouped[item.cat] = [];
    grouped[item.cat].push(item);
  });
  return grouped;
}

// 🎬 共通：中央固定「12月」× 流れるぼかし背景ヘッダー生成
function renderSeasonBanner(subtitle) {
  const imgs = EN_SHUN_DEC.map(s => `<img src="${s.img}" alt="">`).join('');
  return `
    <div class="en-season-banner">
      <div class="en-season-marquee">${imgs}${imgs}</div>
      <div class="en-season-overlay">
        <div class="en-season-en">DECEMBER • SEASONAL CRAFT</div>
        <div class="en-season-num">12月</div>
        <div class="en-season-sub">${subtitle}</div>
      </div>
    </div>
  `;
}

// 🥬 旬の食材詳細ボトムシート（栄養・保存/保温・関連レシピ直行）
function openShunDetailSheet(shunId) {
  const s = EN_SHUN_DEC.find(x => x.id === shunId);
  if (!s) return;
  const relRecipes = EN_SHUN_RECIPES.filter(r => r.shunIds.includes(s.id));

  openEnSheetHtml(`${s.name}（12月の旬・${s.catLabel}）`, s.topNutri, `
    <img class="en-feed-img" style="border-radius:14px;" src="${s.img}" alt="">
    <p class="en-text">${s.desc}</p>

    <div class="en-sec-title" style="color:var(--en-muted);margin:2px 0 0;">📊 注目栄養素バランス</div>
    <div class="en-nutri-grid">
      ${s.nutrients.map((nt, i) => `
        <div class="en-nutri-item">
          <div class="en-between"><span>${nt.n}</span><span>${nt.v}%</span></div>
          <div class="en-nutri-track"><div class="en-nutri-fill ${i%2===0?'orange':''}" style="width:${nt.v}%"></div></div>
        </div>
      `).join('')}
    </div>

    <div class="en-sec-title" style="color:var(--en-muted);margin:4px 0 0;">❄️ 保存方法 ＆ 🔥 保温・美味しく食べるコツ</div>
    <div class="en-storage-grid">
      <div class="en-storage-box"><strong>🏠 常温</strong>${s.storage.room}</div>
      <div class="en-storage-box"><strong>❄️ 冷蔵</strong>${s.storage.fridge}</div>
      <div class="en-storage-box"><strong>🔥 保温・コツ</strong>${s.storage.warm}</div>
    </div>

    <div class="en-sec-title" style="color:var(--en-muted);margin:4px 0 0;">🍳 ${s.name}を使った12月レシピ (${relRecipes.length}品)</div>
    ${relRecipes.map(r => `
      <button class="en-sheet-item" onclick="closeEnSheet();openRecipeDetailSheet('${r.id}')">
        <span>${r.title}<br><small class="en-meta">⏱ ${r.time} ・ ${r.kcal}kcal ・ P${r.p}g / F${r.f}g / C${r.c}g</small></span>
        <span>➔</span>
      </button>
    `).join('')}

    <div class="en-actions" style="border:none;padding-top:4px;">
      <button class="en-act-btn" style="flex:1;justify-content:center;" onclick="closeEnSheet();enViewState.tipsSubTab='recipe';enTipsProState.recipeMode='list';enTipsProState.recipeFilterShun='${s.id}';renderEnTips();">🍳 レシピ一覧で絞る</button>
      <button class="en-act-btn primary" style="flex:1;justify-content:center;" onclick="closeEnSheet();openSeedSheet('12月の旬「${s.name}」を使った商品開発','旬の者たち')">🌱 タネにする</button>
    </div>
  `);
}

// 🍳 レシピ詳細ボトムシート（PFC・材料・手順・好きな曜日にセット）
function openRecipeDetailSheet(recId) {
  const r = EN_SHUN_RECIPES.find(x => x.id === recId);
  if (!r) return;
  const pCal = r.p * 4, fCal = r.f * 9, cCal = r.c * 4, tot = pCal + fCal + cCal;
  const pPct = Math.round((pCal / tot) * 100), fPct = Math.round((fCal / tot) * 100), cPct = 100 - pPct - fPct;

  openEnSheetHtml(r.title, `⏱ ${r.time} ・ ${r.kcal}kcal（1人前目安）`, `
    <img class="en-feed-img" style="border-radius:14px;" src="${r.img}" alt="">
    <div class="en-formula">
      <div class="en-between"><strong>📊 PFCバランス</strong><span>P:${r.p}g / F:${r.f}g / C:${r.c}g</span></div>
      <div class="en-pfc-bar">
        <div class="en-pfc-p" style="width:${pPct}%"></div>
        <div class="en-pfc-f" style="width:${fPct}%"></div>
        <div class="en-pfc-c" style="width:${cPct}%"></div>
      </div>
      <div class="en-pfc-legend"><span style="color:#f97316;">P ${pPct}%</span><span style="color:#eab308;">F ${fPct}%</span><span style="color:#3b82f6;">C ${cPct}%</span></div>
    </div>
    <div class="en-nutri-grid">
      <div class="en-nutri-item"><div class="en-between"><span>☀️ ビタミンD</span><span>${r.vitD}%</span></div><div class="en-nutri-track"><div class="en-nutri-fill orange" style="width:${r.vitD}%"></div></div></div>
      <div class="en-nutri-item"><div class="en-between"><span>🍊 ビタミンC</span><span>${r.vitC}%</span></div><div class="en-nutri-track"><div class="en-nutri-fill" style="width:${r.vitC}%"></div></div></div>
      <div class="en-nutri-item"><div class="en-between"><span>🩸 鉄分</span><span>${r.iron}%</span></div><div class="en-nutri-track"><div class="en-nutri-fill orange" style="width:${r.iron}%"></div></div></div>
      <div class="en-nutri-item"><div class="en-between"><span>🌿 食物繊維</span><span>${r.fiber}%</span></div><div class="en-nutri-track"><div class="en-nutri-fill" style="width:${r.fiber}%"></div></div></div>
    </div>
    <div class="en-sec-title" style="color:var(--en-muted);margin:2px 0 0;">🛒 材料（2人前）</div>
    <div class="en-formula">${r.ingredients.map(i => `<div class="en-between"><span>${i.name}</span><strong>${i.qty}${i.unit}</strong></div>`).join('')}</div>
    <div class="en-sec-title" style="color:var(--en-muted);margin:2px 0 0;">👩‍🍳 かんたん3ステップ</div>
    <div class="en-formula">${r.steps.map((st, idx) => `<div><strong>${idx+1}.</strong> ${st}</div>`).join('')}</div>
    <button class="en-act-btn primary" style="justify-content:center;" onclick="closeEnSheet();openAssignDaySheet('${r.id}')">📅 このレシピを1週間献立に入れる</button>
  `);
}

function openAssignDaySheet(recId) {
  const days = ['月','火','水','木','金','土','日'];
  openEnSheetHtml('📅 何曜日の献立に入れますか？', '入れると栄養バランス＆買い物リストが自動再計算されます', days.map((d, i) => {
    const cur = EN_SHUN_RECIPES.find(r => r.id === enTipsProState.weekPlanIds[i]);
    return `<button class="en-sheet-item" onclick="setDayRecipe(${i},'${recId}')"><span><strong>${d}曜日</strong>（現在：${cur ? cur.title.slice(0,14) : ''}…）</span><span>入替 ➔</span></button>`;
  }).join(''));
}

function openPickRecipeForDaySheet(dayIdx) {
  const days = ['月','火','水','木','金','土','日'];
  openEnSheetHtml(`📅 ${days[dayIdx]}曜日のメニューを変更`, '選ぶと1週間PFC＆買い物リストを即時再計算します', EN_SHUN_RECIPES.map(r => `
    <button class="en-sheet-item" onclick="setDayRecipe(${dayIdx},'${r.id}')">
      <span>${r.title}<br><small class="en-meta">${r.kcal}kcal ・ VitD:${r.vitD}% / VitC:${r.vitC}% / 鉄:${r.iron}%</small></span>
      <span>選ぶ</span>
    </button>
  `).join(''));
}

window.setDayRecipe = (dayIdx, recId) => {
  enTipsProState.weekPlanIds[dayIdx] = recId;
  closeEnSheet();
  enViewState.tipsSubTab = 'recipe';
  enTipsProState.recipeMode = 'week';
  renderEnTips();
  enToast('✅ 献立を更新！PFC＆買い物リストを再計算しました');
};

// =========================================================
// 🌟 renderEnTips を本気仕様へ完全アップグレード（オーバーライド）
// =========================================================
window.renderEnTips = function () {
  const sec = document.getElementById('view-tips');
  if (!sec) return;

  // 旧キー互換（ホームの「1週間献立」ウィジェット等からの遷移を自動吸収）
  if (enViewState.tipsSubTab === 'weekly') { enViewState.tipsSubTab = 'recipe'; enTipsProState.recipeMode = 'week'; }
  if (enViewState.tipsSubTab === 'rescue') { enViewState.tipsSubTab = 'shun'; }
  if (!['shun', 'recipe', 'news', 'featured'].includes(enViewState.tipsSubTab)) enViewState.tipsSubTab = 'shun';

  const st = enViewState.tipsSubTab;
  let bodyHtml = '';

  // ----- ① 🥬 旬の者たち（12月固定×流れぼかし＋3列タイル） -----
  if (st === 'shun') {
    const list = EN_SHUN_DEC.filter(s => enTipsProState.shunCat === 'all' || s.cat === enTipsProState.shunCat);
    bodyHtml = `
      ${renderSeasonBanner('12月の旬の者たち（全12品・タップで栄養/保存/レシピ）')}
      <div class="en-chip-row">
        ${[['all','✨ すべて (12)'],['veg','🥬 野菜 (6)'],['fruit','🍊 果物 (3)'],['fish','🐟 魚介 (3)']].map(([k,l]) =>
          `<button class="en-tag-chip ${enTipsProState.shunCat===k?'active':''}" data-shuncat="${k}">${l}</button>`
        ).join('')}
      </div>
      <div class="en-shun-grid">
        ${list.map(s => `
          <div class="en-shun-card" data-openshun="${s.id}">
            <div class="en-shun-thumb">
              <img src="${s.img}" alt="">
              <span class="en-shun-cat">${s.catLabel}</span>
              ${s.rescue ? '<span class="en-shun-rescue-dot">♻️ 旬多め</span>' : ''}
            </div>
            <div class="en-shun-info">
              <div class="en-shun-name">${s.name}</div>
              <div class="en-shun-nutri">${s.topNutri}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="en-meta" style="text-align:center;">💡 気になる食材をタップすると「栄養素・保存/保温のコツ・レシピ」が見れます</div>
    `;
  }

  // ----- ② 🍳 旬レシピ ＆ 12月不足栄養の1週間献立 ＆ 自動買い物リスト -----
  else if (st === 'recipe') {
    const rm = enTipsProState.recipeMode;
    let subHtml = '';

    if (rm === 'list') {
      const fList = EN_SHUN_RECIPES.filter(r => enTipsProState.recipeFilterShun === 'all' || r.shunIds.includes(enTipsProState.recipeFilterShun));
      subHtml = `
        <div class="en-chip-row">
          <button class="en-tag-chip ${enTipsProState.recipeFilterShun==='all'?'active':''}" data-rshun="all">すべて (${EN_SHUN_RECIPES.length})</button>
          ${EN_SHUN_DEC.slice(0, 8).map(s => `<button class="en-tag-chip ${enTipsProState.recipeFilterShun===s.id?'active':''}" data-rshun="${s.id}">${s.name}</button>`).join('')}
        </div>
        <div class="en-recipe-grid">
          ${fList.map(r => `
            <div class="en-recipe-card" data-openrec="${r.id}">
              <div class="en-recipe-thumb">
                <img src="${r.img}" alt="">
                <span class="en-img-chip" style="font-size:9px;padding:2.5px 7px;">⏱ ${r.time}</span>
              </div>
              <div class="en-recipe-body">
                <div class="en-recipe-title">${r.title}</div>
                <div class="en-pfc-mini"><span>${r.kcal}kcal</span><span>P${r.p}g</span><span>VitD ${r.vitD}%</span></div>
                <span class="en-pill" style="align-self:flex-start;font-size:9.5px;margin-top:auto;">${r.tags[0]}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (rm === 'week') {
      const nut = calcWeekNutrition(enTipsProState.weekPlanIds);
      const shopGroups = buildAggregatedShoppingList(enTipsProState.weekPlanIds);
      const days = ['月','火','水','木','金','土','日'];
      subHtml = `
        <div class="card en-card">
          <div class="en-between">
            <div class="en-title">⚡ 12月の不足栄養から自動編成</div>
            <span class="en-pill">1日平均 ${nut.kcal}kcal</span>
          </div>
          <div class="en-chip-row">
            <button class="en-tag-chip ${enTipsProState.weekGoal==='immune'?'active':''}" data-wgoal="immune">🛡️ 免疫・日照不足(VitD/C)</button>
            <button class="en-tag-chip ${enTipsProState.weekGoal==='protein'?'active':''}" data-wgoal="protein">💪 温活・高たんぱく</button>
            <button class="en-tag-chip ${enTipsProState.weekGoal==='rescue'?'active':''}" data-wgoal="rescue">♻️ 旬の廃棄レスキュー</button>
          </div>
          <div style="margin-top:2px;">
            <div class="en-between" style="font-size:11.5px;font-weight:800;margin-bottom:4px;">
              <span>📊 7日間平均 PFCバランス</span>
              <span>P:${nut.p}g / F:${nut.f}g / C:${nut.c}g</span>
            </div>
            <div class="en-pfc-bar">
              <div class="en-pfc-p" style="width:${nut.pPct}%"></div>
              <div class="en-pfc-f" style="width:${nut.fPct}%"></div>
              <div class="en-pfc-c" style="width:${nut.cPct}%"></div>
            </div>
            <div class="en-pfc-legend">
              <span style="color:#f97316;">たんぱく質 ${nut.pPct}%</span>
              <span style="color:#eab308;">脂質 ${nut.fPct}%</span>
              <span style="color:#3b82f6;">炭水化物 ${nut.cPct}%</span>
            </div>
          </div>
          <div class="en-nutri-grid">
            <div class="en-nutri-item"><div class="en-between"><span>☀️ ビタミンD(冬不足!)</span><span>${nut.vitD}%</span></div><div class="en-nutri-track"><div class="en-nutri-fill orange" style="width:${nut.vitD}%"></div></div></div>
            <div class="en-nutri-item"><div class="en-between"><span>🍊 ビタミンC(免疫)</span><span>${nut.vitC}%</span></div><div class="en-nutri-track"><div class="en-nutri-fill" style="width:${nut.vitC}%"></div></div></div>
            <div class="en-nutri-item"><div class="en-between"><span>🩸 鉄分(冷え対策)</span><span>${nut.iron}%</span></div><div class="en-nutri-track"><div class="en-nutri-fill orange" style="width:${nut.iron}%"></div></div></div>
            <div class="en-nutri-item"><div class="en-between"><span>🌿 食物繊維・Ca</span><span>${Math.round((nut.fiber+nut.calc)/2)}%</span></div><div class="en-nutri-track"><div class="en-nutri-fill" style="width:${Math.round((nut.fiber+nut.calc)/2)}%"></div></div></div>
          </div>
        </div>

        <div class="card en-card">
          <div class="en-between"><div class="en-title">📅 あなたの1週間メニュー</div><span class="en-meta">曜日タップで入替OK</span></div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${enTipsProState.weekPlanIds.map((rid, idx) => {
              const r = EN_SHUN_RECIPES.find(x => x.id === rid) || EN_SHUN_RECIPES[0];
              return `
                <div class="en-week-row" data-changeday="${idx}">
                  <span class="en-day-badge">${days[idx]}</span>
                  <img class="en-week-thumb" src="${r.img}" alt="">
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:12.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.title}</div>
                    <div class="en-meta">⏱ ${r.time} ・ P${r.p}g ・ VitD ${r.vitD}%</div>
                  </div>
                  <span class="en-pill" style="font-size:9.5px;">入替</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="card en-card">
          <div class="en-between">
            <div class="en-title">🛒 自動合算・買い物リスト</div>
            <button class="en-act-btn primary" style="padding:5px 10px;font-size:11px;" id="enCopyAutoShopBtn">📋 コピー</button>
          </div>
          <div class="en-meta">上の7日間の材料を自動計算してまとめています（チェック可）</div>
          ${Object.entries(shopGroups).map(([cat, items]) => `
            <div class="en-sec-title" style="color:var(--en-muted);margin:4px 0 2px;">${cat}</div>
            <div style="display:flex;flex-direction:column;gap:5px;">
              ${items.map(it => {
                const k = `${cat}-${it.name}`;
                const ck = !!enTipsProState.autoShopChecked[k];
                return `
                  <label class="en-shop-item ${ck?'checked':''}">
                    <span class="en-row"><input type="checkbox" ${ck?'checked':''} data-autock="${k}"> <strong>${it.name}</strong></span>
                    <span class="en-pill">${it.qty}${it.unit}</span>
                  </label>
                `;
              }).join('')}
            </div>
          `).join('')}
        </div>
      `;
    } else {
      const plan = enViewState.weeklyPlans[enViewState.selectedPlanIdx] || enViewState.weeklyPlans[0];
      subHtml = `
        <div class="en-between">
          <span class="en-sec-sub">👥 みんなの1週間献立を参考にしよう</span>
          <button class="en-act-btn primary" style="padding:5px 10px;font-size:11px;" onclick="openCreateWeeklyPlanSheet()">＋ 自分の献立を投稿</button>
        </div>
        <div class="en-chip-row">
          ${enViewState.weeklyPlans.map((wp, i) => `<button class="en-tag-chip ${enViewState.selectedPlanIdx===i?'active':''}" data-wpidx="${i}">👤 ${wp.author.split('（')[0]} (${wp.likes}❤️)</button>`).join('')}
        </div>
        <div class="card en-card">
          <div class="en-between"><span class="en-pill">${plan.tag}</span><span class="en-meta">${plan.author}</span></div>
          <div class="en-title">${plan.title}</div>
          <div style="display:flex;flex-direction:column;gap:5px;">
            ${plan.days.map(([d, menu]) => `<div class="en-day-row"><span class="en-day-badge">${d}</span><span>${menu}</span></div>`).join('')}
          </div>
        </div>
      `;
    }

    bodyHtml = `
      ${renderSeasonBanner('12月の旬レシピ ＆ PFC栄養・1週間献立')}
      <div class="en-subtabs">
        <button class="en-subtab ${rm==='week'?'active':''}" data-rmode="week">📅 1週間＆買物</button>
        <button class="en-subtab ${rm==='list'?'active':''}" data-rmode="list">🍳 旬レシピ一覧</button>
        <button class="en-subtab ${rm==='community'?'active':''}" data-rmode="community">👥 みんな投稿</button>
      </div>
      ${subHtml}
    `;
  }

  // ----- ③ 📰 毎晩ニュース -----
  else if (st === 'news') {
    const hero = EN_MOCK_NEWS[0];
    const rest = EN_MOCK_NEWS.slice(1);
    bodyHtml = `
      <div class="en-hero-card" data-opennews="0">
        <img src="${hero.photo}" alt="">
        <div class="en-hero-overlay">
          <span class="en-hero-tag">${hero.date}</span>
          <div class="en-hero-title">${hero.title}</div>
          <div class="en-hero-meta"><span>タップで全文＆50:50ギア連携</span><strong>➔</strong></div>
        </div>
      </div>
      ${rest.map((n, i) => `
        <div class="card en-card">
          <div class="en-card-img-wrap" style="cursor:pointer;" data-opennews="${i+1}"><img class="en-feed-img" src="${n.photo}" alt=""><span class="en-img-chip">${n.date}</span></div>
          <div class="en-title">${n.title}</div>
          <p class="en-text">${n.summary}</p>
          <div class="en-actions"><button class="en-act-btn primary" style="width:100%;justify-content:center;" data-seed="${n.title}">${enIconTag('seed','🌱')} <span>このネタをタネにする</span></button></div>
        </div>
      `).join('')}
    `;
  }

  // ----- ④ ✨ 注目商品（食品＋便利製品） -----
  else {
    bodyHtml = `
      <div class="en-meta">✨ 12月に注目の「旬の食べ物」＆「現場・家庭で役立つ便利製品」（利益50:50還元）</div>
      <div class="en-grid-2">
        ${EN_SEASONAL_FEATURED.map(item => `
          <div class="card en-card" style="padding:10px;gap:7px;">
            <div class="en-card-img-wrap">
              <img class="en-gear-img" src="${EN_IMAGES[item.imgKey] || EN_IMAGES.gear}" alt="">
              <span class="en-img-chip" style="font-size:9.5px;padding:2.5px 7px;">${item.kind}</span>
            </div>
            <div class="en-title" style="font-size:12.5px;">${item.title}</div>
            <div class="en-meta" style="font-size:11px;">${item.note}</div>
            <div class="en-price" style="font-size:14px;">${item.price}</div>
            <button class="en-act-btn primary" style="justify-content:center;width:100%;font-size:11px;" onclick="enToast('🛒 ${item.badge}ページを開きます')">詳細を見る</button>
          </div>
        `).join('')}
      </div>
    `;
  }

  sec.innerHTML = `
    <div class="en-wrap">
      <div class="en-sec-head">
        <h2 class="en-sec-h2">${enIconTag('news','🥬')} 役立ちコーナー</h2>
        <span class="en-sec-sub">旬・レシピ・毎晩分析</span>
      </div>
      <div class="en-subtabs">
        ${[['shun','🥬 旬の者たち'],['recipe','🍳 レシピ＆献立'],['news','📰 ニュース'],['featured','✨ 注目商品']].map(([k,l]) =>
          `<button class="en-subtab ${st===k?'active':''}" data-tipstab="${k}">${l}</button>`
        ).join('')}
      </div>
      ${bodyHtml}
    </div>
  `;

  // イベント紐付け
  sec.querySelectorAll('[data-tipstab]').forEach(b => b.onclick = () => { enViewState.tipsSubTab = b.getAttribute('data-tipstab'); renderEnTips(); });
  sec.querySelectorAll('[data-shuncat]').forEach(b => b.onclick = () => { enTipsProState.shunCat = b.getAttribute('data-shuncat'); renderEnTips(); });
  sec.querySelectorAll('[data-openshun]').forEach(c => c.onclick = () => openShunDetailSheet(c.getAttribute('data-openshun')));
  sec.querySelectorAll('[data-rmode]').forEach(b => b.onclick = () => { enTipsProState.recipeMode = b.getAttribute('data-rmode'); renderEnTips(); });
  sec.querySelectorAll('[data-rshun]').forEach(b => b.onclick = () => { enTipsProState.recipeFilterShun = b.getAttribute('data-rshun'); renderEnTips(); });
  sec.querySelectorAll('[data-openrec]').forEach(c => c.onclick = () => openRecipeDetailSheet(c.getAttribute('data-openrec')));
  sec.querySelectorAll('[data-wgoal]').forEach(b => b.onclick = () => autoBuildWeekPlan(b.getAttribute('data-wgoal')));
  sec.querySelectorAll('[data-changeday]').forEach(r => r.onclick = () => openPickRecipeForDaySheet(Number(r.getAttribute('data-changeday'))));
  sec.querySelectorAll('[data-autock]').forEach(cb => cb.onchange = () => { enTipsProState.autoShopChecked[cb.getAttribute('data-autock')] = cb.checked; renderEnTips(); });
  sec.querySelectorAll('[data-wpidx]').forEach(b => b.onclick = () => { enViewState.selectedPlanIdx = Number(b.getAttribute('data-wpidx')); renderEnTips(); });
  sec.querySelectorAll('[data-seed]').forEach(b => b.onclick = () => openSeedSheet(b.getAttribute('data-seed'), '役立ち'));
  sec.querySelectorAll('[data-opennews]').forEach(el => el.onclick = () => {
    const n = EN_MOCK_NEWS[Number(el.getAttribute('data-opennews'))];
    openEnSheetHtml(n.title, n.date, `
      <p class="en-text">${n.summary}</p>
      <div class="en-formula"><strong>🔪 記事内で紹介された50:50注目製品</strong><div>業務用パワー家庭用真空シーラー（¥6,980）</div><button class="en-act-btn" style="align-self:flex-start;" onclick="closeEnSheet();enViewState.tipsSubTab='featured';renderEnTips();">注目商品で見る ➔</button></div>
      <button class="en-act-btn primary" style="justify-content:center;" onclick="closeEnSheet();openSeedSheet('${n.title.replace(/'/g,'')}','役立ちニュース')">🌱 このネタをタネにする</button>
    `);
  });

  const copyBtn = document.getElementById('enCopyAutoShopBtn');
  if (copyBtn) copyBtn.onclick = async () => {
    const groups = buildAggregatedShoppingList(enTipsProState.weekPlanIds);
    const lines = ['【EN•joy 12月の1週間買い物リスト】'];
    Object.entries(groups).forEach(([cat, items]) => {
      lines.push(`\n${cat}`);
      items.forEach(i => lines.push(`・${i.name}：${i.qty}${i.unit}`));
    });
    try { await navigator.clipboard.writeText(lines.join('\n')); enToast('📋 自動合算した買い物リストをコピーしました！'); }
    catch { enToast('📋 買い物リストをコピーしました！'); }
  };

  enSyncTheme();
};

// 初回ロード時に新・役立ちコーナーへ差し替え描画
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    enViewState.tipsSubTab = 'shun';
    renderEnTips();
  }, 220);
});