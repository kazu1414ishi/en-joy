/* =========================================================
   EN•joy ULTIMATE COMPLETE 描画パッチ（patch_views.js v5）
   ・登録画面FAB自動非表示 / 登録⇔名刺連動 / 階層型設定ハブ＋データ移行
   ・仕事性格診断(簡易3問)＆AI相性連動 / 巣立ち祝福＆マルシェ自動出品
   ・進行中(チーム)vs1人準備中(ノート)完全分離 / 役立ち4本柱(1週間＆買物＆注目商品)
   ========================================================= */

const EN_DIAG_TYPES = {
  action:  { code: 'action',  badge: '🔥 ひらめき行動派', desc: 'まず形にして試すスピード型！', matchMap: { farm: '行動派同士で試作スピード最強タッグ！', factory: '計画派の田中さんがあなたの勢いを原価面から支えます', design: '佐藤さんの世界観があなたのアイデアを一気に商品化！', truck: '高橋さんの機動力と抜群の相性！即テスト販売OK' } },
  plan:    { code: 'plan',    badge: '📐 コツコツ計画派', desc: '原価と需要を見極める参謀型！', matchMap: { farm: '計画派のあなた × 行動派の山田さん＝売れる黄金バランス！', factory: '計画派同士で相性◎。ロット・原価相談が超スムーズ', design: '丁寧なヒアリング派同士でクオリティが跳ね上がります', truck: '配送コスト計算までピタッと噛み合う頼れる相棒' } },
  connect: { code: 'connect', badge: '🤝 共感つなぎ派',   desc: '異業種を巻き込むプロデューサー型！', matchMap: { farm: '山田さんの熱い想いを引き出してファンを増やせる名コンビ', factory: '加工の凄さを買い手に伝える橋渡し役として相性抜群', design: '共感力×デザイン力で応援したくなるストーリーが作れます', truck: '地域を繋ぐルート便とのコラボ企画がすぐ立ち上がります' } },
  craft:   { code: 'craft',   badge: '🎨 こだわり職人派', desc: '味と品質をとことん磨く本物志向！', matchMap: { farm: '完熟素材へのこだわりが完全一致！看板商品が生まれる予感', factory: '低温乾燥の細かな温度調整まで妥協なく詰められます', design: 'クラフト感のある上質なパッケージで価値が2倍に伝わる', truck: '温度管理に強い冷蔵便だから品質そのまま届けられます' } }
};

const enViewState = {
  activeMainTab: 'home',
  userMode: 'maker',
  profile: { name: 'マイ名刺', area: '大阪府 枚方市・寝屋川市', photo: '' },
  diagType: 'plan',
  notifEnabled: true,
  mapOpen: true,
  slideIdx: 0,
  slideFixed: false,
  enSubTab: 'tweet',
  tweetCat: 'all',
  likedIds: {},
  savedIds: {},
  tweetComments: {
    'tw-000': [{ author: '山田農園', text: 'うちのリコピン濃厚トマトでチップス試作してみましょうか！' }],
    'tw-001': [{ author: 'カワチ乾燥加工所', text: '来週火曜なら30kgそのまま乾燥テストできますよ！' }]
  },
  peopleView: 'list',
  peopleQuery: '',
  peopleFilterOpen: false,
  peopleCat: 'all',
  mapSelectedId: 'usr-001',
  swipeIdx: 0,
  labSubTab: 'my',
  myLabMode: 'my_active',
  discoverQuery: '',
  discoverTag: 'all',
  aideaSubTab: 'suggest',
  flippedLabs: {},
  tipsSubTab: 'news',     // 'news' | 'rescue' | 'weekly' | 'featured'
  selectedPlanIdx: 0,
  shoppingChecked: {},
  marcheFilter: 'all',
  roomOpenId: null,
  roomTab: 'talk',
  roomViewAsFan: false,
  roomCalExpanded: false,
  boardIdx: 0,
  voteCounts: { A: 3, B: 2 },
  voteChoice: null,
  earlyBirdJoined: false,
  graduatedIds: {},
  tweets: [],
  labs: [],
  marcheItems: [],
  hintBox: [{ id: 'h-1', title: 'カワチ乾燥加工所の低温乾燥機（来週火・水空き）', from: 'つぶやき', time: '1時間前' }],
  quickAsks: [{ id: 'qa-1', userId: 'usr-002', name: '田中 誠（カワチ乾燥加工所）', area: '東大阪市', msg: 'トマト30kgからの乾燥試作、だいたいの目安教えていただけますか？', matched: false }],
  notifications: [
    { id: 'n-1', icon: '🧪', text: 'あなたの「🙋ほしい！」から『無添加トマトチップス』ラボが立ち上がりました！', time: '12分前', tab: 'en' },
    { id: 'n-2', icon: '🗳️', text: 'ドライトマト開発：パッケージ多数決の締切まであと2日です', time: '1時間前', roomId: 'lab-001', roomTab: 'progress' },
    { id: 'n-3', icon: '🎁', text: '応援中の『訳ありみかんジャム』先行早割の案内が届きました', time: '昨日', tab: 'shop' }
  ],
  roomMessages: [
    { sender: '山田農園', me: false, text: '試作トマト30kg、明日の午前中に冷蔵便で送れます！' },
    { sender: 'あなた',   me: true,  text: 'ありがとうございます！届き次第、低温乾燥テスト入ります🔥' },
    { sender: 'アトリエ木漏れ日', me: false, text: 'クラフト袋のラベル案2パターン作りました！進行タブの多数決に入れておきますね。' }
  ],
  roomTasks: [
    { id: 't1', text: '食品表示ラベルの原材料チェック（担当：カワチ加工所）', done: false },
    { id: 't2', text: '初回50袋の原価計算（1袋280円以内）', done: true },
    { id: 't3', text: '12/6 枚方マルシェ用の試食パック10袋を準備', done: false }
  ],
  roomBoards: [
    { name: '📌 公開ストーリー', items: ['1袋30g・原価280円以内で無添加仕上げ', '12/6 枚方週末マルシェで先行50袋テスト販売'] },
    { name: '🧪 試作メモ',       items: ['低温60℃×8時間で甘みが最大に引き立つ', '塩味とハーブ味の2種展開で確定'] },
    { name: '💰 原価・ロット',   items: ['初回テスト50袋：袋＋ラベル代 1枚38円', '希望売価：¥480（3袋セット¥1,280）'] },
    { name: '📦 パッケージ',     items: ['案A：クラフト紙＋1色スタンプ風', '案B：中身が見える透明窓付きスタンド袋'] }
  ],
  weeklyPlans: [
    {
      id: 'wp-1', author: 'かな（寝屋川市・子育てママ）', likes: 34,
      title: '旬の規格外みかん＆冬根菜で回す「1週間レスキュー節約献立」',
      tag: '旬×食品ロス削減 / 4人前 約¥4,800',
      days: [
        ['月', '丸ごと大根と鶏のトロトロみぞれ煮（葉はふりかけに）'],
        ['火', '規格外みかんの皮ごと甘酢チキン＋白菜サラダ'],
        ['水', '白菜と豚バラの重ね蒸し（ポン酢＆ゆず皮）'],
        ['木', '根菜たっぷり粕汁＋焼き鮭'],
        ['金', '完熟トマト＆冬野菜の無水カレー'],
        ['土', 'みかん皮ごとジャムトースト＋具だくさんスープ'],
        ['日', '余り野菜全部入れ！ごちそうポトフ']
      ],
      shopping: [
        { name: '規格外みかん（1箱/2kg）', qty: '農家直売 ¥600' },
        { name: '葉付き大根・白菜', qty: '各1/2個' },
        { name: '鶏もも肉・豚バラ薄切り', qty: '計800g' },
        { name: '完熟トマト（B品OK）', qty: '5〜6個' },
        { name: '酒粕・カレールー・だし', qty: 'ストック確認' }
      ]
    },
    {
      id: 'wp-2', author: '山田農園（枚方市・農家メシ）', likes: 27,
      title: '冬野菜の栄養を逃さない「15分時短・農家の一週間」',
      tag: '高たんぱく・ビタミン重視',
      days: [
        ['月', 'ほうれん草とベーコンの濃厚キッシュ風オムレツ'],
        ['火', 'ブロッコリーと鶏むねのガーリック蒸し'],
        ['水', '里芋とイカのほっこり煮物'],
        ['木', 'トマトと鯖缶の10分リコピン鍋'],
        ['金', 'ごぼうと牛肉のしぐれ煮丼'],
        ['土', '冬野菜グリル（オリーブオイル＆岩塩）'],
        ['日', '残り物リセット中華あんかけ焼きそば']
      ],
      shopping: [
        { name: 'ほうれん草・ブロッコリー', qty: '各2束' },
        { name: '里芋・ごぼう', qty: '各1袋' },
        { name: '鶏むね肉・鯖缶(水煮)', qty: '600g / 2缶' },
        { name: '卵・ベーコン', qty: '1パックずつ' }
      ]
    }
  ]
};

const EN_SEASONAL_RESCUE = [
  {
    id: 'res-1', season: '11〜12月・廃棄急増中', title: '規格外みかん「白いワタごと濃厚ジャム＆ドレッシング」',
    photo: '', reason: '豊作とサイズ不揃いで出荷できないみかんが急増。ワタごと使うとペクチン・食物繊維が2倍に！',
    nutri: [{ label: 'ビタミンC', val: 95, cls: 'orange' }, { label: '食物繊維', val: 84, cls: '' }, { label: '廃棄削減度', val: 96, cls: 'orange' }, { label: 'コスパ', val: 90, cls: '' }]
  },
  {
    id: 'res-2', season: '冬の旬・葉まで丸ごと', title: '傷あり大根＆葉の「1本使い切り・鉄分たっぷり常備菜3種」',
    photo: '', reason: '少し割れただけで廃棄される冬大根は甘み最高。葉にはほうれん草以上のカルシウム＆ビタミンA！',
    nutri: [{ label: 'ビタミンA/C', val: 88, cls: '' }, { label: 'カルシウム', val: 82, cls: '' }, { label: '廃棄削減度', val: 92, cls: 'orange' }, { label: '時短度', val: 85, cls: 'orange' }]
  }
];

const EN_SEASONAL_FEATURED = [
  { kind: '🍊 旬の食品', badge: '50:50 注目食品', title: '和歌山の訳あり有田みかん 5kg（家庭用・糖度13度以上）', price: '¥2,180', note: 'ジャム試作・1週間メニューに最適！', imgKey: 'citrus' },
  { kind: '🔪 便利製品', badge: '50:50 注目製品', title: '業務用パワー家庭用真空シーラー（汁物対応モード付）', price: '¥6,980', note: '余った旬野菜の冷凍保存＆小ロット試作の必需品', imgKey: 'gear' },
  { kind: '📦 クラフト製品', badge: '50:50 注目製品', title: '窓付きクラフトスタンド袋 50枚＋耐水ラベル入門セット', price: '¥2,480', note: 'マルシェ初出店でも見栄えが一気にプロ級に', imgKey: 'package' },
  { kind: '🌡️ 冬支度製品', badge: '50:50 注目製品', title: 'デジタル糖度計＆食品中心温度計（プロ農家愛用）', price: '¥3,480', note: 'レシピの再現性と品質チェックが1秒で完了', imgKey: 'drying' }
];

const EN_MOCK_EVENTS = [
  { day: 29, date: '11/29(日)', area: 'ラボ締切', title: 'ドライトマト試作パッケージ最終決定', note: '多数決締切' },
  { day: 6,  date: '12/6(土) 10:00〜16:00', area: '枚方市・ニッペパーク岡東中央', title: 'ひらかた週末クラフト＆農産マルシェ', note: '初出店枠あり・¥3,000' },
  { day: 13, date: '12/13(土) 11:00〜15:00', area: '京都市・古民家EN•dress前', title: '冬の新商品お披露目＆試食マルシェ', note: '巣立ち商品優先枠' }
];

function enIconTag(name, emoji) { return `<span data-en-icon-name="${name}" data-en-emoji="${emoji}">${emoji}</span>`; }
function enGoTab(tabName) { enViewState.activeMainTab = tabName; document.querySelector(`#bottomNav [data-tab="${tabName}"]`)?.click(); updateActionFab(); }
function enSyncTheme() { if (typeof applyEnTheme === 'function') applyEnTheme(); }

// ローカル保存＆復元（データ移行にも利用）
function saveEnStateLocal() {
  try {
    const snap = {
      userMode: enViewState.userMode, profile: enViewState.profile, diagType: enViewState.diagType,
      notifEnabled: enViewState.notifEnabled, mapOpen: enViewState.mapOpen,
      hintBox: enViewState.hintBox, shoppingChecked: enViewState.shoppingChecked
    };
    localStorage.setItem('en_joy_v5_state', JSON.stringify(snap));
  } catch (e) {}
}
function loadEnStateLocal() {
  try {
    const raw = JSON.parse(localStorage.getItem('en_joy_v5_state') || 'null');
    if (raw) Object.assign(enViewState, raw);
  } catch (e) {}
}

// 🏝️ トースト / 📑 ボトムシート / 🖼️ 全画面写真拡大
let enToastTimer = null;
function enToast(msg) {
  let el = document.getElementById('en-island-toast');
  if (!el) { el = document.createElement('div'); el.id = 'en-island-toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(enToastTimer);
  enToastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}
function openEnSheetHtml(title, subtitle, innerHtml) {
  let bd = document.getElementById('en-sheet-backdrop');
  if (!bd) {
    bd = document.createElement('div');
    bd.id = 'en-sheet-backdrop';
    bd.onclick = e => { if (e.target === bd) bd.classList.remove('open'); };
    document.body.appendChild(bd);
  }
  bd.innerHTML = `
    <div class="en-sheet-card">
      <div class="en-sheet-handle"></div>
      <div class="en-between">
        <div><div class="en-title" style="font-size:16px;">${title}</div>${subtitle ? `<div class="en-meta">${subtitle}</div>` : ''}</div>
        <button class="en-act-btn" onclick="closeEnSheet()">✕</button>
      </div>
      <div id="en-sheet-content" style="display:flex;flex-direction:column;gap:9px;">${innerHtml}</div>
    </div>
  `;
  bd.classList.add('open');
  enSyncTheme();
}
function closeEnSheet() { document.getElementById('en-sheet-backdrop')?.classList.remove('open'); }

function openEnLightbox(src) {
  let lb = document.getElementById('en-lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'en-lightbox';
    lb.onclick = () => lb.classList.remove('open');
    document.body.appendChild(lb);
  }
  lb.innerHTML = `<img src="${src}" alt="">`;
  lb.classList.add('open');
}

// =========================================================
// 🚫 登録画面との被りゼロ監視 ＋ 登録フォーム⇔ホーム名刺連動
// =========================================================
function syncRegisterOverlayState() {
  const regSec = document.getElementById('view-register');
  const isReg = !!(regSec && regSec.classList.contains('active'));
  document.body.classList.toggle('en-in-register', isReg);
}

function syncProfileFromRegForm() {
  const nameVal = document.getElementById('displayNameInput')?.value?.trim();
  const areaVal = document.getElementById('areaInput')?.value?.trim();
  const imgEl   = document.getElementById('photoPreviewImg');
  if (nameVal) enViewState.profile.name = nameVal;
  if (areaVal) enViewState.profile.area = areaVal;
  if (imgEl && !imgEl.classList.contains('hidden') && imgEl.src) enViewState.profile.photo = imgEl.src;

  // Step 3 のファン専用ブロック表示中なら買い手モードへ自動連動
  const fanBlock = document.getElementById('stageBlockFan');
  if (fanBlock && !fanBlock.classList.contains('hidden')) enViewState.userMode = 'buyer';

  saveEnStateLocal();
  renderEnHome(); renderEnFeed();
}

function enhanceRegisterScreen() {
  // 1. 進捗バー右側に被らない極小ツール（🎨見た目・⚡デモ体験）を追加
  const topBar = document.querySelector('.reg-progress-top');
  if (topBar && !document.getElementById('enRegMiniTools')) {
    const wrap = document.createElement('div');
    wrap.id = 'enRegMiniTools';
    wrap.className = 'en-reg-mini-tools';
    wrap.innerHTML = `
      <button type="button" class="en-reg-mini-btn" id="enRegThemeBtn">🎨</button>
      <button type="button" class="en-reg-mini-btn" id="enRegSkipBtn">⚡ デモへ</button>
    `;
    topBar.appendChild(wrap);
    document.getElementById('enRegThemeBtn').onclick = () => document.getElementById('en-theme-drawer')?.classList.toggle('open');
    document.getElementById('enRegSkipBtn').onclick = () => {
      syncProfileFromRegForm();
      document.getElementById('view-register')?.classList.remove('active');
      document.getElementById('view-home')?.classList.add('active');
      document.getElementById('bottomNav')?.classList.remove('hidden');
      syncRegisterOverlayState();
      enGoTab('home');
      enToast('✨ デモ画面に切り替えました！');
    };
  }

  // 2. Step 3 の「仕事性格診断」バーを実際に押して遊べるように有効化
  const diagBar = document.querySelector('.diag-mini-bar');
  if (diagBar && !diagBar.dataset.bound) {
    diagBar.dataset.bound = '1';
    diagBar.style.cursor = 'pointer';
    diagBar.innerHTML = `<span>🧠 仕事性格診断（簡易3問）</span><span class="en-pill" id="enRegDiagBadge">今すぐ診断する ➔</span>`;
    diagBar.onclick = () => openPersonalityQuiz();
  }

  // 3. 登録完了ボタンでプロフィールをホームへ連動
  const compBtn = document.getElementById('completeRegBtn');
  if (compBtn && !compBtn.dataset.enSynced) {
    compBtn.dataset.enSynced = '1';
    compBtn.addEventListener('click', () => setTimeout(() => { syncProfileFromRegForm(); syncRegisterOverlayState(); }, 100));
  }
}

// =========================================================
// 🧠 仕事性格診断（簡易3問）＆ AI相性リアルタイム反映
// =========================================================
let enQuizAnswers = [];
const EN_QUIZ_QS = [
  { q: 'Q1. 新しい商品アイデアが浮かんだら？', opts: [['action','🔥 まず小さく試作してみる'],['plan','📐 原価と需要をサクッと計算'],['connect','🤝 誰かに話して巻き込む'],['craft','🎨 素材と味をとことん詰める']] },
  { q: 'Q2. コラボで一番ワクワクする瞬間は？', opts: [['action','🔥 スピード感よく形になるとき'],['plan','📐 計画通りピタッと決まったとき'],['connect','🤝 異業種と意気投合したとき'],['craft','🎨 納得のクオリティが出たとき']] },
  { q: 'Q3. 買い手の「ほしい！」を見たら？', opts: [['action','🔥 すぐ1人ラボで実験開始！'],['plan','📐 売れる価格帯とロットを分析'],['connect','🤝 関係する農家や工房へ声かけ'],['craft','🎨 最高の素材選びから考える']] }
];

function openPersonalityQuiz(step = 0) {
  if (step === 0) enQuizAnswers = [];
  if (step < EN_QUIZ_QS.length) {
    const cur = EN_QUIZ_QS[step];
    openEnSheetHtml(`🧠 仕事性格診断（${step + 1} / 3）`, cur.q, cur.opts.map(([code, label]) => `
      <button class="en-sheet-item" onclick="answerQuiz('${code}', ${step})"><span>${label}</span><span>➔</span></button>
    `).join(''));
  } else {
    const counts = {};
    enQuizAnswers.forEach(c => counts[c] = (counts[c] || 0) + 1);
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    enViewState.diagType = best;
    saveEnStateLocal();
    const res = EN_DIAG_TYPES[best];
    const regBadge = document.getElementById('enRegDiagBadge');
    if (regBadge) regBadge.textContent = res.badge;
    renderEnHome(); renderEnFeed();
    openEnSheetHtml('🎉 診断完了！あなたのタイプ', 'おすすめ人材の「AI相性ひとこと」に反映されました', `
      <div class="en-grad-banner">
        <div style="font-size:20px;font-weight:900;">${res.badge}</div>
        <div style="font-size:13px;opacity:0.95;">${res.desc}</div>
      </div>
      <button class="en-act-btn primary" style="justify-content:center;" onclick="closeEnSheet();enToast('✨ 相性診断を名刺＆人材タブに反映しました！')">OK（アプリに反映）</button>
    `);
  }
}
window.answerQuiz = (code, step) => { enQuizAnswers.push(code); openPersonalityQuiz(step + 1); };

// =========================================================
// ⚙️ 階層型設定ハブ（名刺の変更 / 詳細設定 / データ移行）
// =========================================================
function openSettingsHub() {
  const diag = EN_DIAG_TYPES[enViewState.diagType];
  openEnSheetHtml('⚙️ 設定 ＆ マイページ', '変更したい項目を選んでください', `
    <div class="en-sec-title" style="color:var(--en-muted);margin:2px 0;">👤 プロフィール・名刺</div>
    <div class="en-settings-group">
      <button class="en-settings-row" onclick="closeEnSheet();document.getElementById('openRegBtn')?.click();syncRegisterOverlayState();">
        <div>🪪 名刺の変更<small>活動名・写真・業種・兼業・設備を編集</small></div><span>➔</span>
      </button>
      <button class="en-settings-row" onclick="openPersonalityQuiz(0)">
        <div>🧠 仕事性格診断（簡易3問）<small>現在：${diag.badge}</small></div><span>➔</span>
      </button>
    </div>

    <div class="en-sec-title" style="color:var(--en-muted);margin:6px 0 2px;">🔧 詳細設定</div>
    <div class="en-settings-group">
      <button class="en-settings-row" onclick="enViewState.userMode=enViewState.userMode==='maker'?'buyer':'maker';saveEnStateLocal();renderEnHome();renderEnFeed();openSettingsHub();">
        <div>🔄 表示モード切替<small>現在：${enViewState.userMode==='maker'?'🛠️ つくり手ベース':'🛍️ 買い手・応援ベース'}</small></div>
        <span class="en-pill">切替</span>
      </button>
      <button class="en-settings-row" onclick="enViewState.mapOpen=!enViewState.mapOpen;saveEnStateLocal();renderEnHome();openSettingsHub();">
        <div>🗺️ マップ位置情報の公開<small>現在：${enViewState.mapOpen?'ON（市町村まで公開）':'OFF（非公開）'}</small></div>
        <span class="en-pill">${enViewState.mapOpen?'ON':'OFF'}</span>
      </button>
      <button class="en-settings-row" onclick="enViewState.notifEnabled=!enViewState.notifEnabled;saveEnStateLocal();openSettingsHub();">
        <div>🔔 通知・早割アラート<small>多数決リマインド＆巣立ち先行早割通知</small></div>
        <span class="en-pill">${enViewState.notifEnabled?'ON':'OFF'}</span>
      </button>
      <button class="en-settings-row" onclick="closeEnSheet();document.getElementById('en-theme-drawer')?.classList.add('open');">
        <div>🎨 見た目・着せ替え設定<small>色味・形・単色SVG・極クール切替</small></div><span>➔</span>
      </button>
      <button class="en-settings-row" onclick="document.getElementById('toggleZoneBtn')?.click();enToast('🥚 将来ゾーン枠の表示を切り替えました');">
        <div>🥚 将来ゾーン枠（開発プレビュー）<small>マイ・エンちゃん等の将来配置を表示</small></div><span>切替</span>
      </button>
    </div>

    <div class="en-sec-title" style="color:var(--en-muted);margin:6px 0 2px;">📦 データ移行・アカウント</div>
    <div class="en-settings-group">
      <button class="en-settings-row" onclick="openDataMigrationSheet()">
        <div>📦 データ移行（書き出し / 復元）<small>機種変更や別ブラウザへ設定・ヒント箱を移行</small></div><span>➔</span>
      </button>
      <button class="en-settings-row" style="color:#ef4444;" onclick="if(confirm('初期状態に戻しますか？')){closeEnSheet();document.getElementById('resetToStartBtn')?.click();}">
        <div>🔄 最初（初回登録）からやり直す<small>テストデータを初期化します</small></div><span>➔</span>
      </button>
    </div>
  `);
}

function openDataMigrationSheet() {
  const backupJson = JSON.stringify({
    profile: enViewState.profile, diagType: enViewState.diagType,
    userMode: enViewState.userMode, hintBox: enViewState.hintBox,
    theme: localStorage.getItem('en_theme_v1')
  });
  openEnSheetHtml('📦 データ移行（バックアップ＆復元）', '移行コードをコピーして別端末へ貼り付けるだけ', `
    <div class="en-meta">① 今のデータを書き出す</div>
    <button class="en-act-btn primary" style="justify-content:center;" id="enCopyBackupBtn">📋 移行用バックアップコードをコピー</button>
    <div class="en-meta" style="margin-top:6px;">② 別端末のコードを貼り付けて復元</div>
    <textarea id="enRestoreInput" class="en-input-field" rows="3" placeholder="ここに移行用コードを貼り付け..."></textarea>
    <button class="en-act-btn" style="justify-content:center;" id="enRestoreBtn">📥 このコードからデータを復元</button>
  `);
  document.getElementById('enCopyBackupBtn').onclick = async () => {
    try { await navigator.clipboard.writeText(backupJson); enToast('📋 移行コードをコピーしました！'); }
    catch { enToast('コピーできないため入力欄に出力しました'); document.getElementById('enRestoreInput').value = backupJson; }
  };
  document.getElementById('enRestoreBtn').onclick = () => {
    try {
      const parsed = JSON.parse(document.getElementById('enRestoreInput').value.trim());
      if (parsed.profile) enViewState.profile = parsed.profile;
      if (parsed.diagType) enViewState.diagType = parsed.diagType;
      if (parsed.hintBox) enViewState.hintBox = parsed.hintBox;
      saveEnStateLocal(); renderEnHome(); renderEnLab(); closeEnSheet();
      enToast('🎉 データを復元しました！');
    } catch { enToast('⚠️ 正しい移行コードを入力してください'); }
  };
}

// =========================================================
// ヘッダー右上：💬（ちょっと聞く）＆ 🔔（通知）＆ ⚙️（設定ハブ）
// =========================================================
function mountHeaderQuickIcons() {
  const ctrls = document.querySelector('#topHeader .header-controls');
  if (!ctrls || document.getElementById('enHdrAskBtn')) return;

  const askBtn = document.createElement('button');
  askBtn.id = 'enHdrAskBtn'; askBtn.type = 'button'; askBtn.className = 'en-hdr-icon-btn';
  askBtn.innerHTML = `${enIconTag('ask','💬')}<span class="en-hdr-dot" id="enAskCount">${enViewState.quickAsks.length}</span>`;
  askBtn.onclick = openQuickAskSheet;

  const bellBtn = document.createElement('button');
  bellBtn.id = 'enHdrBellBtn'; bellBtn.type = 'button'; bellBtn.className = 'en-hdr-icon-btn';
  bellBtn.innerHTML = `${enIconTag('bell','🔔')}<span class="en-hdr-dot" id="enNotifCount">${enViewState.notifications.length}</span>`;
  bellBtn.onclick = openNotifSheet;

  const setBtn = document.createElement('button');
  setBtn.id = 'enHdrSetBtn'; setBtn.type = 'button'; setBtn.className = 'en-hdr-icon-btn';
  setBtn.innerHTML = enIconTag('detail','⚙️');
  setBtn.onclick = openSettingsHub;

  ctrls.prepend(setBtn);
  ctrls.prepend(bellBtn);
  ctrls.prepend(askBtn);
  enSyncTheme();
}

function updateHeaderCounts() {
  const ac = document.getElementById('enAskCount');
  if (ac) ac.textContent = enViewState.quickAsks.length;
}

function openQuickAskSheet() {
  const html = enViewState.quickAsks.map((q, idx) => `
    <div class="en-formula" style="gap:7px;">
      <div class="en-between"><strong>${q.name}</strong><span class="en-pill">${q.matched ? '🔓 名刺開示済' : '🔒 連絡先非公開'}</span></div>
      <div class="en-meta">📍 ${q.area}</div>
      <div class="en-text">${q.msg}</div>
      ${q.matched
        ? `<div class="en-meta" style="color:var(--en-accent);font-weight:800;">📞 072-888-1234（マッチ成立で自動開示）</div>`
        : `<button class="en-act-btn primary" style="justify-content:center;" onclick="promoteAskToLab(${idx})">🧪 ワンタップでEN•ラボへ昇格（名刺ロック解除）</button>`}
    </div>
  `).join('');
  openEnSheetHtml('💬 ちょっと聞く一覧', '活動名・アイコンのみで気軽に相談 → ラボ昇格で名刺開示', html);
}
window.promoteAskToLab = (idx) => {
  const q = enViewState.quickAsks[idx]; q.matched = true;
  enViewState.labs.unshift({
    id: 'lab-new-' + Date.now(), mode: 'my_active', fanPublic: false,
    title: `${q.name.split('（')[0]}さんとの新コラボ企画`, photo: EN_IMAGES.drying,
    urgent: true, unread: 1, badges: [{ type: 'task', label: 'キックオフ', targetTab: 'talk' }],
    nextDeadline: '初回打ち合わせ調整中', summary: { flow: 'ちょっと聞くから昇格', decided: 'サンプル共有から', next: 'トークで挨拶' }
  });
  enToast('🎉 ラボ昇格＆デジタル名刺のロックが解除されました！');
  renderEnLab(); openQuickAskSheet();
};

function openNotifSheet() {
  const html = enViewState.notifications.map((n, i) => `
    <button class="en-sheet-item" onclick="handleNotifClick(${i})">
      <span>${n.icon} ${n.text}<br><small class="en-meta">${n.time}</small></span><span>➔</span>
    </button>
  `).join('');
  openEnSheetHtml('🔔 通知', 'ラボの動き・買い手連携・早割のお知らせ', html);
}
window.handleNotifClick = (i) => {
  const n = enViewState.notifications[i]; closeEnSheet();
  if (n.roomId) openEnRoomModal(n.roomId, n.roomTab || 'talk');
  else if (n.tab) enGoTab(n.tab);
};

// 🌱 タネにする / 📅 全体カレンダー
function openSeedSheet(title, fromLabel) {
  const safe = title.replace(/'/g, '');
  openEnSheetHtml('🌱 このネタをどう活かす？', title, `
    <button class="en-sheet-item" onclick="addToHintBox('${safe}','${fromLabel}')">
      <span>📌 ヒント箱にストック<br><small class="en-meta">AIディアの「ヒント箱」タブに保存</small></span><span>➔</span>
    </button>
    <button class="en-sheet-item" onclick="createSoloLabFromSeed('${safe}')">
      <span>🧪 すぐ1人ノートラボを作る<br><small class="en-meta">1人準備中へ即追加（元ネタワープ付き）</small></span><span>➔</span>
    </button>
  `);
}
window.addToHintBox = (title, fromLabel) => {
  enViewState.hintBox.unshift({ id: 'h-' + Date.now(), title, from: fromLabel, time: 'たった今' });
  saveEnStateLocal(); closeEnSheet(); enToast('📌 AIディアのヒント箱にストックしました！'); renderEnLab();
};
window.createSoloLabFromSeed = (title) => {
  enViewState.labs.unshift({
    id: 'lab-solo-' + Date.now(), mode: 'my_solo', fanPublic: false, title: title.slice(0, 22),
    photo: EN_IMAGES.package, sourceTweetId: 'tw-000', updatedAt: 'たった今メモ',
    summary: { seed: title, needed: '加工・デザイン・物流パートナー検討中' },
    notes: [title]
  });
  closeEnSheet(); enViewState.labSubTab = 'my'; enViewState.myLabMode = 'my_solo';
  renderEnLab(); enGoTab('en'); enToast('📒 1人準備中ノートラボを作成しました！');
};

function openGlobalCalendarSheet() {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const marks = [6, 13, 29];
  openEnSheetHtml('📅 全体カレンダー（全ラボ＋マルシェ）', 'オレンジの日付に締切・イベントがあります', `
    <div class="en-cal-grid">
      ${['日','月','火','水','木','金','土'].map(d => `<div class="en-meta" style="font-weight:800;">${d}</div>`).join('')}
      ${days.map(d => `<div class="en-cal-cell ${marks.includes(d) ? 'mark' : ''}">${d}</div>`).join('')}
    </div>
    ${EN_MOCK_EVENTS.map(ev => `<div class="en-formula"><div class="en-between"><strong>${ev.date}</strong><span class="en-pill">${ev.note}</span></div><div>${ev.title}（${ev.area}）</div></div>`).join('')}
  `);
}

function enMiniRing(pct) {
  const c = 2 * Math.PI * 13, off = c - (pct / 100) * c;
  return `<div class="en-ring-wrap"><svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="none" stroke="var(--en-border)" stroke-width="3"/><circle cx="16" cy="16" r="13" fill="none" stroke="var(--en-accent)" stroke-width="3" stroke-dasharray="${c}" stroke-dashoffset="${off}" stroke-linecap="round" transform="rotate(-90 16 16)"/></svg><span>${pct}%</span></div>`;
}

// =========================================================
// 1. 🏠 ホーム（登録連動名刺 ＋ 診断バッジ ＋ 2×2ウィジェット）
// =========================================================
function renderEnHome() {
  const sec = document.getElementById('view-home');
  if (!sec) return;
  const isMaker = enViewState.userMode === 'maker';
  const activeCount = enViewState.labs.filter(l => l.mode === 'my_active').length;
  const diag = EN_DIAG_TYPES[enViewState.diagType];
  const avatarSrc = enViewState.profile.photo || EN_IMAGES.userFarm;

  const widgets = isMaker ? [
    { kind: 'ring', pct: 75, urgent: true,  title: '全体のやること', badge: '直行',   body: 'ドライトマト開発',   sub: '多数決あと1件 → 進行へ', action: 'room-progress' },
    { kind: 'date', m: '11月', d: '29', urgent: false, title: '全体カレンダー', badge: '展開',  body: '試作パッケージ締切', sub: '12/6 枚方マルシェほか3件', action: 'calendar' },
    { kind: 'icon', icon: 'talk',  emoji: '💬', color: 'green',  urgent: false, title: '関連の動き',     badge: '新着',  body: '「ほしい！」42応援', sub: `ヒント箱 ${enViewState.hintBox.length}件・新着反応`, action: 'related' },
    { kind: 'icon', icon: 'aidea', emoji: '✨', color: 'purple', urgent: false, title: '今日のAIディア', badge: '3点掛', body: 'トマト×低温乾燥',    sub: '🙋要望 × 🌾素材 × 🏭設備', action: 'aidea' }
  ] : [
    { kind: 'icon', icon: 'marche', emoji: '🛍️', color: '',      urgent: true,  title: '新着・予約早割', badge: '限定',   body: '完熟ドライトマト',   sub: '巣立ち第1号・¥1,280', action: 'shop' },
    { kind: 'ring', pct: 80, urgent: false, title: '応援中の公開ラボ', badge: '投票', body: 'ドライトマト開発', sub: '外からの見え方・投票へ', action: 'room-fan' },
    { kind: 'date', m: '12月', d: '6', urgent: false, title: '週末マルシェ',   badge: '大阪',   body: '枚方週末マルシェ',   sub: '試食ブースあり・無料', action: 'calendar' },
    { kind: 'icon', icon: 'news',   emoji: '📅', color: 'green', urgent: false, title: '旬の1週間献立',  badge: '人気',   body: 'みかん＆冬根菜献立', sub: '買うものリスト付き！', action: 'weekly' }
  ];

  sec.innerHTML = `
    <div class="en-wrap">
      <div class="en-prof-slider" id="enProfSlider">
        <div class="en-prof-watermark">EN•JOY</div>
        <div class="en-prof-track" id="enProfTrack" style="transform:translateX(-${enViewState.slideIdx * 100}%)">
          <div class="en-prof-slide">
            <div class="en-between">
              <div class="en-row">
                <img class="en-avatar" src="${avatarSrc}" alt="">
                <div>
                  <div style="font-size:9.5px;opacity:0.85;font-weight:900;letter-spacing:0.06em;">${diag.badge}</div>
                  <div class="en-title" style="color:#fff;">${enViewState.profile.name}（${isMaker ? '🛠️ つくり手' : '🛍️ 買い手'}）</div>
                  <div style="font-size:11px;opacity:0.86;">📍 ${enViewState.profile.area}</div>
                </div>
              </div>
              <button class="en-act-btn" style="background:rgba(255,255,255,0.16);color:#fff;border-color:rgba(255,255,255,0.34);" id="enHomeSetBtn">
                ${enIconTag('detail','⚙️')} <span class="en-btn-label">設定</span>
              </button>
            </div>
            <div class="en-prof-stats">
              <div class="en-prof-stat"><strong>12</strong><span>🤝 繋がり</span></div>
              <div class="en-prof-stat"><strong>48</strong><span>❤️ 応援</span></div>
              <div class="en-prof-stat"><strong>${activeCount}</strong><span>🧪 進行ラボ</span></div>
            </div>
          </div>
          <div class="en-prof-slide">
            <div style="font-size:9.5px;opacity:0.8;font-weight:900;letter-spacing:0.12em;margin-bottom:8px;">QUICK CONTROLS</div>
            <div class="en-between" style="margin-bottom:10px;">
              <div class="en-title" style="color:#fff;">${enIconTag('map','🗺️')} マップ公開：${enViewState.mapOpen ? 'ON' : 'OFF'}</div>
              <button class="en-act-btn" style="background:rgba(255,255,255,0.18);color:#fff;border-color:rgba(255,255,255,0.4);" id="enToggleMapBtn">${enViewState.mapOpen ? 'OFFにする' : 'ONにする'}</button>
            </div>
            <div class="en-between">
              <span style="font-size:12px;opacity:0.9;">兼業モード 1タップ切替</span>
              <button class="en-act-btn" style="background:#fff;color:#1c1917;border:none;" id="enToggleModeBtn">${isMaker ? '🛍️ 買い手表示へ' : '🛠️ つくり手表示へ'}</button>
            </div>
          </div>
          <div class="en-prof-slide">
            <div style="font-size:9.5px;opacity:0.8;font-weight:900;letter-spacing:0.12em;margin-bottom:6px;">CREATOR MOTIVATION</div>
            <div class="en-between">
              <div>
                <div class="en-title" style="color:#fff;">🪺 マイ・エンちゃん（Lv.2）</div>
                <div style="font-size:12px;opacity:0.9;margin-top:4px;">${diag.desc} 次の巣立ちで限定バッジ解放！</div>
              </div>
              <span class="en-badge" style="background:#fff;color:#1c1917;">巣立ち間近</span>
            </div>
          </div>
        </div>
        <div class="en-prof-dots">
          ${[0,1,2].map(i => `<span class="en-prof-dot ${enViewState.slideIdx === i ? 'active' : ''}" data-slide="${i}"></span>`).join('')}
        </div>
      </div>

      <div class="en-widget-grid">
        ${widgets.map(w => `
          <button type="button" class="en-widget ${w.urgent ? 'urgent' : ''}" data-wact="${w.action}">
            <div class="en-widget-top">
              ${w.kind === 'ring' ? enMiniRing(w.pct) : w.kind === 'date' ? `<span class="en-date-pill"><small>${w.m}</small><b>${w.d}</b></span>` : `<span class="en-w-icon ${w.color}">${enIconTag(w.icon, w.emoji)}</span>`}
              <span class="en-badge">${w.urgent ? '<span class="en-live-dot"></span>' : ''}${w.badge}</span>
            </div>
            <div class="en-widget-label">${w.title}</div>
            <div class="en-widget-body">${w.body}</div>
            <div class="en-widget-sub">${w.sub}</div>
          </button>
        `).join('')}
      </div>

      <div class="en-news-bar" onclick="enViewState.tipsSubTab='news';renderEnTips();enGoTab('tips')">
        <span class="en-badge">${enIconTag('news', '📰')} 昨夜の分析</span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:800;flex:1;">${EN_MOCK_NEWS[0].title}</span>
        <span style="opacity:0.5;">➔</span>
      </div>
    </div>
  `;

  document.getElementById('enHomeSetBtn').onclick = openSettingsHub;
  const slider = document.getElementById('enProfSlider');
  let startX = 0;
  slider.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 35) { enViewState.slideFixed = true; enViewState.slideIdx = (enViewState.slideIdx + (dx < 0 ? 1 : 2)) % 3; renderEnHome(); }
  }, { passive: true });

  sec.querySelectorAll('[data-wact]').forEach(el => el.onclick = () => {
    const act = el.getAttribute('data-wact');
    if (act === 'room-progress') openEnRoomModal('lab-001', 'progress', false);
    else if (act === 'room-fan') openEnRoomModal('lab-001', 'progress', true);
    else if (act === 'calendar') openGlobalCalendarSheet();
    else if (act === 'aidea') { enViewState.labSubTab = 'aidea'; renderEnLab(); enGoTab('en'); }
    else if (act === 'weekly') { enViewState.tipsSubTab = 'weekly'; renderEnTips(); enGoTab('tips'); }
    else if (act === 'shop') enGoTab('shop');
    else if (act === 'related') openNotifSheet();
  });
  sec.querySelectorAll('[data-slide]').forEach(dot => dot.onclick = () => { enViewState.slideFixed = true; enViewState.slideIdx = Number(dot.getAttribute('data-slide')); renderEnHome(); });
  document.getElementById('enToggleMapBtn').onclick = () => { enViewState.slideFixed = true; enViewState.mapOpen = !enViewState.mapOpen; saveEnStateLocal(); enToast(`🗺️ マップ公開を ${enViewState.mapOpen ? 'ON' : 'OFF'} にしました`); renderEnHome(); };
  document.getElementById('enToggleModeBtn').onclick = () => { enViewState.slideFixed = true; enViewState.userMode = isMaker ? 'buyer' : 'maker'; saveEnStateLocal(); enToast(enViewState.userMode === 'buyer' ? '🛍️ 買い手表示に切替ました' : '🛠️ つくり手表示に切替ました'); renderEnHome(); renderEnFeed(); };
  enSyncTheme();
}

// =========================================================
// 2. 🤝 縁を繋げる（タイト隙間10px / 16:10写真＋拡大 / 実コメント / 診断相性連動）
// =========================================================
function getDynamicAiMatch(person) {
  const diag = EN_DIAG_TYPES[enViewState.diagType];
  return (diag && diag.matchMap[person.category]) || person.aiMatch;
}

function renderEnFeed() {
  const sec = document.getElementById('view-feed');
  if (!sec) return;
  const isTweet = enViewState.enSubTab === 'tweet';
  const isBuyer = enViewState.userMode === 'buyer';

  let bodyHtml = '';
  if (isTweet) {
    const list = enViewState.tweets.filter(t => enViewState.tweetCat === 'all' || t.category === enViewState.tweetCat);
    bodyHtml = `
      <div class="en-subtabs">
        ${[['all','すべて'],['want','🙋 ほしい'],['trouble','🆘 困りごと'],['idea','💡 ひらめき']].map(([k,l]) =>
          `<button class="en-subtab ${enViewState.tweetCat === k ? 'active' : ''}" data-tcat="${k}">${l}</button>`
        ).join('')}
      </div>
      <div class="en-feed-stack">
        ${list.map(t => {
          const liked = !!enViewState.likedIds[t.id];
          const saved = !!enViewState.savedIds[t.id];
          const cCount = (enViewState.tweetComments[t.id] || []).length + t.comments;
          const catLabel = t.category === 'want' ? '🙋 買い手ニーズ' : t.category === 'trouble' ? '🆘 困りごと' : '💡 ひらめき';
          return `
            <div class="card en-card">
              <div class="en-between">
                <div class="en-row">
                  <img class="en-avatar" src="${t.avatar}" alt="">
                  <div><div class="en-title">${t.author}</div><div class="en-meta">${t.area} ・ ${t.role} ・ ${t.time}</div></div>
                </div>
                <span class="en-pill">${catLabel}</span>
              </div>
              <p class="en-text">${t.text}</p>
              ${t.photo ? `<div class="en-card-img-wrap"><img class="en-feed-img" src="${t.photo}" data-zoom="${t.photo}" alt=""><span class="en-img-chip">${catLabel}</span></div>` : ''}
              <div class="en-actions">
                <button class="en-act-btn ${liked ? 'liked' : ''}" data-like="${t.id}">${enIconTag('greet', '❤️')} <span>${t.likes + (liked?1:0)}</span></button>
                <button class="en-act-btn" data-comment="${t.id}">${enIconTag('talk', '💬')} <span>${cCount}</span></button>
                <button class="en-act-btn ${saved ? 'liked' : ''}" data-save="${t.id}">${enIconTag('hint', '🔖')}</button>
                <button class="en-act-btn primary" style="margin-left:auto;" data-seed="${t.author}：${t.text.slice(0,22)}">
                  ${enIconTag('seed', '🌱')} <span class="en-btn-label">タネにする</span>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    const view = enViewState.peopleView;
    const q = enViewState.peopleQuery.trim();
    const filtered = EN_MOCK_PEOPLE.filter(p => (enViewState.peopleCat === 'all' || p.category === enViewState.peopleCat) && (!q || (p.name + p.shop + p.area + p.canDo).includes(q)));
    const selected = filtered.find(p => p.id === enViewState.mapSelectedId) || filtered[0] || EN_MOCK_PEOPLE[0];
    const swp = filtered.length ? filtered[enViewState.swipeIdx % filtered.length] : EN_MOCK_PEOPLE[0];

    bodyHtml = `
      <div class="en-search-row">
        <input id="enPeopleSearch" class="en-search-input" type="search" value="${enViewState.peopleQuery}" placeholder="🔍 エリア・得意なことで検索（例：枚方、乾燥）">
        <button class="en-act-btn ${enViewState.peopleFilterOpen ? 'primary' : ''}" id="enPeopleFilterBtn">${enIconTag('filter','⚙️')}</button>
      </div>
      ${enViewState.peopleFilterOpen ? `
        <div class="en-filter-panel">
          ${[['all','全業種'],['farm','🌾 一次産業'],['factory','🏭 加工・製造'],['design','🎨 デザイン'],['truck','🚚 物流']].map(([k,l]) =>
            `<button class="en-tag-chip ${enViewState.peopleCat===k?'active':''}" data-pcat="${k}">${l}</button>`
          ).join('')}
        </div>
      ` : ''}
      <div class="en-subtabs">
        <button class="en-subtab ${view==='list'?'active':''}" data-pview="list">${enIconTag('people','📋')} リスト</button>
        <button class="en-subtab ${view==='map'?'active':''}" data-pview="map">${enIconTag('map','🗺️')} マップ</button>
        <button class="en-subtab ${view==='swipe'?'active':''}" data-pview="swipe">${enIconTag('swipe','🃏')} スワイプ</button>
      </div>
      ${view === 'list' ? `
        <div class="en-meta" style="text-align:center;">✨ ${EN_DIAG_TYPES[enViewState.diagType].badge} 基準で相性表示中 ／ タップで詳細</div>
        <div class="en-grid-2">
          ${filtered.map(p => `
            <div class="card en-card" style="padding:11px;gap:8px;cursor:pointer;" data-persondetail="${p.id}">
              <div class="en-row">
                <img class="en-avatar" style="width:36px;height:36px;" src="${p.avatar}" alt="">
                <div><div class="en-title" style="font-size:13px;">${p.name}</div><div class="en-meta">${p.area}</div></div>
              </div>
              <span class="en-pill" style="align-self:flex-start;">${enIconTag(p.category,'🌾')} ${p.categoryLabel}</span>
              <p class="en-text" style="font-size:11.5px;">${p.canDo}</p>
              <div class="en-meta" style="color:var(--en-accent);font-weight:800;font-size:11px;">✨ ${getDynamicAiMatch(p)}</div>
              <div class="en-actions" style="padding-top:7px;" onclick="event.stopPropagation()">
                <button class="en-act-btn" style="flex:1;justify-content:center;padding:6px;" onclick="enToast('👋 ${p.name}さんに${isBuyer?'応援':'気になる'}を送信！')">${enIconTag('greet','👋')}</button>
                ${isBuyer ? `<button class="en-act-btn primary" style="flex:1;justify-content:center;padding:6px;" onclick="enGoTab('shop')">${enIconTag('marche','🎪')}</button>`
                  : `<button class="en-act-btn primary" style="flex:1;justify-content:center;padding:6px;" onclick="startQuickAsk('${p.id}')">${enIconTag('ask','💬')}</button>`}
              </div>
            </div>
          `).join('')}
        </div>
      ` : view === 'map' ? `
        <div class="en-map-box">
          <svg class="en-map-svg" viewBox="0 0 400 260" preserveAspectRatio="none">
            <path d="M-10,210 C90,175 180,120 260,85 C320,60 365,30 415,15" fill="none" stroke="#38bdf8" stroke-width="18" stroke-linecap="round" opacity="0.38"/>
            <path d="M30,0 L160,265 M120,0 L290,265 M0,115 L400,155 M0,195 L400,75" fill="none" stroke="var(--en-muted)" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.45"/>
          </svg>
          <div class="en-map-radar" style="left:${selected.mapPos.x}%;top:${selected.mapPos.y}%;"></div>
          ${filtered.map(p => `<button class="en-map-pin ${p.id === selected.id ? 'active' : ''}" data-pin="${p.id}" style="left:${p.mapPos.x}%;top:${p.mapPos.y}%;">${enIconTag(p.category,'📍')} ${p.area}</button>`).join('')}
        </div>
        <div class="card en-card">
          <div class="en-row"><img class="en-avatar" src="${selected.avatar}" alt=""><div><div class="en-title">${selected.name}（${selected.shop}）</div><div class="en-meta">${selected.area} ・ ${selected.categoryLabel}</div></div></div>
          <p class="en-text">${selected.canDo}</p>
          <div class="en-meta" style="color:var(--en-accent);font-weight:800;">✨ ${getDynamicAiMatch(selected)}</div>
          <div class="en-actions">
            <button class="en-act-btn" onclick="enToast('👋 ${selected.name}さんに「気になる」を送信！')">${enIconTag('greet','👋')} <span class="en-btn-label">気になる</span></button>
            <button class="en-act-btn" onclick="startQuickAsk('${selected.id}')">${enIconTag('ask','💬')} <span class="en-btn-label">ちょっと聞く</span></button>
            <button class="en-act-btn primary" style="margin-left:auto;" onclick="enToast('📩 ${selected.name}さんをEN•ラボへ招待しました！')">${enIconTag('invite','📩')} <span class="en-btn-label">ラボに誘う</span></button>
          </div>
        </div>
      ` : `
        <div class="card en-card">
          <div class="en-hero-card" style="height:245px;">
            <img src="${swp.avatar}" alt="">
            <div class="en-hero-overlay"><span class="en-hero-tag">${swp.area} ・ ${swp.categoryLabel}</span><div class="en-hero-title">${swp.name}（${swp.shop}）</div></div>
          </div>
          <p class="en-text">${swp.canDo}</p>
          <div class="en-meta" style="color:var(--en-accent);font-weight:800;">✨ ${getDynamicAiMatch(swp)}</div>
          <div class="en-actions">
            <button class="en-act-btn" style="flex:1;justify-content:center;" id="enSwipeNext">スキップ ➔</button>
            <button class="en-act-btn primary" style="flex:1;justify-content:center;" id="enSwipeLike">${enIconTag('greet','👋')} <span class="en-btn-label">気になる！</span></button>
          </div>
        </div>
      `}
    `;
  }

  sec.innerHTML = `
    <div class="en-wrap">
      <div class="en-subtabs">
        <button class="en-subtab ${isTweet?'active':''}" data-entab="tweet">${enIconTag('tweet','💬')} つぶやき</button>
        <button class="en-subtab ${!isTweet?'active':''}" data-entab="people">${enIconTag('people','👥')} ${isBuyer ? '地域のつくり手' : 'おすすめ人材'}</button>
      </div>
      ${bodyHtml}
    </div>
  `;

  sec.querySelectorAll('[data-entab]').forEach(b => b.onclick = () => { enViewState.enSubTab = b.getAttribute('data-entab'); renderEnFeed(); });
  sec.querySelectorAll('[data-tcat]').forEach(b => b.onclick = () => { enViewState.tweetCat = b.getAttribute('data-tcat'); renderEnFeed(); });
  sec.querySelectorAll('[data-like]').forEach(b => b.onclick = () => { const id = b.getAttribute('data-like'); enViewState.likedIds[id] = !enViewState.likedIds[id]; renderEnFeed(); });
  sec.querySelectorAll('[data-save]').forEach(b => b.onclick = () => { const id = b.getAttribute('data-save'); enViewState.savedIds[id] = !enViewState.savedIds[id]; enToast(enViewState.savedIds[id] ? '🔖 保存しました' : '保存解除'); renderEnFeed(); });
  sec.querySelectorAll('[data-zoom]').forEach(img => img.onclick = () => openEnLightbox(img.getAttribute('data-zoom')));
  sec.querySelectorAll('[data-comment]').forEach(b => b.onclick = () => openTweetCommentSheet(b.getAttribute('data-comment')));
  sec.querySelectorAll('[data-seed]').forEach(b => b.onclick = () => openSeedSheet(b.getAttribute('data-seed'), 'つぶやき'));
  sec.querySelectorAll('[data-pview]').forEach(b => b.onclick = () => { enViewState.peopleView = b.getAttribute('data-pview'); renderEnFeed(); });
  sec.querySelectorAll('[data-pin]').forEach(b => b.onclick = () => { enViewState.mapSelectedId = b.getAttribute('data-pin'); renderEnFeed(); });
  sec.querySelectorAll('[data-pcat]').forEach(b => b.onclick = () => { enViewState.peopleCat = b.getAttribute('data-pcat'); renderEnFeed(); });
  sec.querySelectorAll('[data-persondetail]').forEach(c => c.onclick = () => openPersonDetailSheet(c.getAttribute('data-persondetail')));
  const pSearch = document.getElementById('enPeopleSearch');
  if (pSearch) pSearch.oninput = e => { enViewState.peopleQuery = e.target.value; renderEnFeed(); document.getElementById('enPeopleSearch')?.focus(); };
  const pFilter = document.getElementById('enPeopleFilterBtn');
  if (pFilter) pFilter.onclick = () => { enViewState.peopleFilterOpen = !enViewState.peopleFilterOpen; renderEnFeed(); };
  const nextBtn = document.getElementById('enSwipeNext'); if (nextBtn) nextBtn.onclick = () => { enViewState.swipeIdx++; renderEnFeed(); };
  const likeBtn = document.getElementById('enSwipeLike'); if (likeBtn) likeBtn.onclick = () => { enToast('👋 「気になる」を送りました！'); enViewState.swipeIdx++; renderEnFeed(); };
  enSyncTheme();
}

function openTweetCommentSheet(tid) {
  const tw = enViewState.tweets.find(x => x.id === tid);
  const cmts = enViewState.tweetComments[tid] || [];
  openEnSheetHtml('💬 コメント', tw ? `${tw.author}の投稿` : '', `
    ${cmts.length ? cmts.map(c => `<div class="en-formula"><strong>${c.author}</strong><div>${c.text}</div></div>`).join('') : '<div class="en-meta">最初のコメントを送ってみましょう！</div>'}
    <div class="en-row" style="margin-top:6px;">
      <input id="enNewCmtInput" class="en-input-field" placeholder="コメントを書く...">
      <button class="en-act-btn primary" id="enNewCmtSend">送信</button>
    </div>
  `);
  document.getElementById('enNewCmtSend').onclick = () => {
    const v = document.getElementById('enNewCmtInput').value.trim();
    if (!v) return;
    if (!enViewState.tweetComments[tid]) enViewState.tweetComments[tid] = [];
    enViewState.tweetComments[tid].push({ author: enViewState.profile.name, text: v });
    renderEnFeed(); openTweetCommentSheet(tid); enToast('💬 コメントを投稿しました！');
  };
}

function openPersonDetailSheet(uid) {
  const p = EN_MOCK_PEOPLE.find(x => x.id === uid);
  if (!p) return;
  openEnSheetHtml(`${p.name}（${p.shop}）`, `${p.area} ・ ${p.categoryLabel}`, `
    <div class="en-formula">
      <div>🏭 <strong>設備・強み：</strong>${p.detail.equipment}</div>
      <div>🧪 <strong>過去ラボ実績：</strong>${p.detail.pastLabs}件</div>
      <div>⚡ <strong>返信ペース：</strong>${p.detail.replySpeed}</div>
      <div style="color:var(--en-accent);font-weight:800;">✨ 性格相性：${getDynamicAiMatch(p)}</div>
    </div>
    <button class="en-act-btn primary" style="justify-content:center;" onclick="closeEnSheet();startQuickAsk('${p.id}')">💬 ちょっと聞く（連絡先非公開で相談）</button>
  `);
}

window.startQuickAsk = (uid) => {
  const p = EN_MOCK_PEOPLE.find(x => x.id === uid);
  if (!p) return;
  if (!enViewState.quickAsks.some(q => q.userId === uid)) {
    enViewState.quickAsks.unshift({ id: 'qa-' + Date.now(), userId: uid, name: `${p.name}（${p.shop}）`, area: p.area, msg: 'こんにちは！少しご相談してみたくて連絡しました！', matched: false });
    updateHeaderCounts();
  }
  enToast(`💬 右上の💬「ちょっと聞く」に${p.name}さんを追加しました！`);
  openQuickAskSheet();
};

// =========================================================
// 3. 🧪 EN•ラボ（進行中＝チームダッシュボード vs 1人準備中＝秘密ノート分離！）
// =========================================================
function renderEnLab() {
  const sec = document.getElementById('view-en');
  if (!sec) return;
  const tab = enViewState.labSubTab;

  let bodyHtml = '';
  if (tab === 'my') {
    const isSolo = enViewState.myLabMode === 'my_solo';
    const labs = enViewState.labs.filter(l => l.mode === enViewState.myLabMode);
    bodyHtml = `
      <div class="en-subtabs">
        <button class="en-subtab ${!isSolo?'active':''}" data-lmode="my_active">👥 進行中 (${enViewState.labs.filter(l=>l.mode==='my_active').length})</button>
        <button class="en-subtab ${isSolo?'active':''}" data-lmode="my_solo">${enIconTag('lock','📒')} 1人準備中 (${enViewState.labs.filter(l=>l.mode==='my_solo').length})</button>
      </div>
      ${!isSolo ? labs.map(l => {
        const flipped = !!enViewState.flippedLabs[l.id];
        return `
          <div class="card en-card" data-swipeflip="${l.id}">
            <div class="en-lab-tapzone" data-openroom="${l.id}">
              <div class="en-card-img-wrap">
                <img class="en-card-img" src="${l.photo}" alt="">
                <span class="en-img-chip">${l.fanPublic ? '🌐 ファン公開中' : '🔒 チーム限定'}</span>
                <span class="en-enter-pill">開発室に入る ➔</span>
              </div>
              <div class="en-between">
                <div class="en-title">${l.title}</div>
                <div class="en-avatar-stack">
                  <img src="${EN_IMAGES.userFarm}" alt=""><img src="${EN_IMAGES.userFact}" alt=""><img src="${EN_IMAGES.userDes}" alt="">
                </div>
              </div>
              <div class="en-steps">
                <span class="en-step done">1.タネ</span><span class="en-step done">2.試作</span><span class="en-step now">3.投票</span><span class="en-step">4.巣立ち</span>
              </div>
            </div>
            ${!flipped ? `
              <div class="en-row" style="flex-wrap:wrap;">
                ${(l.badges || []).map(b => `<button class="en-badge" data-openroom="${l.id}" data-opentab="${b.targetTab || 'progress'}">⚡ ${b.label} ➔</button>`).join('')}
                <span class="en-meta">${l.nextDeadline || ''}</span>
              </div>
            ` : `
              <div class="en-formula">
                <div>📌 <strong>流れ：</strong>${l.summary.flow}</div>
                <div>✅ <strong>決定：</strong>${l.summary.decided}</div>
                <div>👉 <strong>次：</strong>${l.summary.next}</div>
              </div>
            `}
            <div class="en-actions">
              <button class="en-act-btn" data-flip="${l.id}">${enIconTag('summary','📄')} <span class="en-btn-label">${flipped ? '表に戻す' : '要約を見る'}</span></button>
              <button class="en-act-btn primary" style="margin-left:auto;" data-openroom="${l.id}">${enIconTag('lab','🧪')} <span>開発室を開く</span></button>
            </div>
          </div>
        `;
      }).join('') : `
        <div class="en-meta" style="text-align:center;">📒 1人準備中は締切ゼロの秘密ノート！温まったら進行中ラボへ昇格できます</div>
        ${labs.map(l => `
          <div class="card en-card en-solo-card">
            <div class="en-lab-tapzone" data-opensolo="${l.id}">
              <div class="en-between">
                <span class="en-pill" style="background:rgba(139,92,246,0.14);color:#8b5cf6;">🔒 1人アイデアノート</span>
                <span class="en-meta">${l.updatedAt || '下書き'}</span>
              </div>
              <div class="en-title">${l.title}</div>
              <div class="en-formula" style="border-style:dotted;">
                <div>🌱 <strong>今のタネ：</strong>${l.summary.seed}</div>
                <div>🧩 <strong>欲しい相棒：</strong>${l.summary.needed}</div>
              </div>
            </div>
            <div class="en-actions">
              <button class="en-act-btn" data-opensolo="${l.id}">✏️ ノートを開く</button>
              <button class="en-act-btn primary" style="margin-left:auto;" data-promotesolo="${l.id}">🚀 進行中ラボへ昇格</button>
            </div>
          </div>
        `).join('')}
      `}
    `;
  } else if (tab === 'discover') {
    const dq = enViewState.discoverQuery.trim();
    const list = enViewState.labs.filter(l => l.mode === 'discover' && (!dq || (l.title + l.area + l.recruiting).includes(dq)) && (enViewState.discoverTag === 'all' || (l.tags || []).includes(enViewState.discoverTag)));
    bodyHtml = `
      <input id="enDiscoverSearch" class="en-search-input" type="search" value="${enViewState.discoverQuery}" placeholder="🔍 ラボ名・エリア・募集職種で探す">
      <div class="en-chip-row">${['all','一次産業','加工・製造','ファン投票中'].map(t => `<button class="en-tag-chip ${enViewState.discoverTag===t?'active':''}" data-dtag="${t}">${t==='all'?'すべて':t}</button>`).join('')}</div>
      ${list.map(l => `
        <div class="card en-card">
          <div class="en-lab-tapzone" data-openroom="${l.id}" data-fan="1">
            <div class="en-card-img-wrap"><img class="en-card-img" src="${l.photo}" alt=""><span class="en-img-chip">${l.status}</span><span class="en-enter-pill">のぞく・投票 ➔</span></div>
            <div class="en-title">${l.title}</div>
            <div class="en-meta">📍 ${l.area} ・ 募集：${l.recruiting}</div>
          </div>
        </div>
      `).join('')}
    `;
  } else {
    const isHint = enViewState.aideaSubTab === 'hint';
    bodyHtml = `
      <div class="en-subtabs">
        <button class="en-subtab ${!isHint?'active':''}" data-aitab="suggest">💡 AI 3点掛け算</button>
        <button class="en-subtab ${isHint?'active':''}" data-aitab="hint">📌 ヒント箱 (${enViewState.hintBox.length})</button>
      </div>
      ${!isHint ? EN_MOCK_AIDEA.map(a => `
        <div class="card en-card">
          <div class="en-card-img-wrap"><img class="en-card-img" src="${a.photo}" alt=""><span class="en-img-chip">✨ ${a.creator}（3点掛け算）</span></div>
          <div class="en-title">${a.proposal}</div>
          <div class="en-formula">
            <div>🙋 <strong>買い手：</strong>${a.want}</div>
            <div>🌾 <strong>素材：</strong>${a.trouble.area}（${a.trouble.text}）</div>
            <div>🏭 <strong>相棒：</strong>${a.partner.area}（${a.partner.text}）</div>
          </div>
          <p class="en-text">${a.reason}</p>
          <div class="en-actions">
            <button class="en-act-btn" onclick="createSoloLabFromSeed('${a.proposal}')">${enIconTag('seed','📒')} <span class="en-btn-label">1人ノートで温める</span></button>
            <button class="en-act-btn primary" style="margin-left:auto;" onclick="enToast('📩 関係者へコラボオファーを送信しました！')">${enIconTag('invite','📩')} <span class="en-btn-label">すぐオファー</span></button>
          </div>
        </div>
      `).join('') : enViewState.hintBox.map(h => `
        <div class="card en-card" style="gap:6px;">
          <div class="en-between"><span class="en-pill">📌 ${h.from}</span><span class="en-meta">${h.time}</span></div>
          <div class="en-title">${h.title}</div>
          <button class="en-act-btn primary" style="align-self:flex-end;" onclick="createSoloLabFromSeed('${h.title.replace(/'/g,'')}')">📒 1人ノートラボにする</button>
        </div>
      `).join('')}
    `;
  }

  sec.innerHTML = `
    <div class="en-wrap">
      <div class="en-subtabs">
        <button class="en-subtab ${tab==='my'?'active':''}" data-ltab="my">${enIconTag('lab','🧪')} マイラボ</button>
        <button class="en-subtab ${tab==='discover'?'active':''}" data-ltab="discover">${enIconTag('search','🔍')} 探す</button>
        <button class="en-subtab ${tab==='aidea'?'active':''}" data-ltab="aidea">${enIconTag('aidea','✨')} AIディア</button>
      </div>
      ${bodyHtml}
    </div>
  `;

  sec.querySelectorAll('[data-ltab]').forEach(b => b.onclick = () => { enViewState.labSubTab = b.getAttribute('data-ltab'); renderEnLab(); });
  sec.querySelectorAll('[data-lmode]').forEach(b => b.onclick = () => { enViewState.myLabMode = b.getAttribute('data-lmode'); renderEnLab(); });
  sec.querySelectorAll('[data-aitab]').forEach(b => b.onclick = () => { enViewState.aideaSubTab = b.getAttribute('data-aitab'); renderEnLab(); });
  sec.querySelectorAll('[data-dtag]').forEach(b => b.onclick = () => { enViewState.discoverTag = b.getAttribute('data-dtag'); renderEnLab(); });
  sec.querySelectorAll('[data-flip]').forEach(b => b.onclick = () => { const id = b.getAttribute('data-flip'); enViewState.flippedLabs[id] = !enViewState.flippedLabs[id]; renderEnLab(); });
  sec.querySelectorAll('[data-openroom]').forEach(b => b.onclick = () => openEnRoomModal(b.getAttribute('data-openroom'), b.getAttribute('data-opentab') || 'talk', b.getAttribute('data-fan') === '1'));
  sec.querySelectorAll('[data-opensolo]').forEach(b => b.onclick = () => openSoloNotebookModal(b.getAttribute('data-opensolo')));
  sec.querySelectorAll('[data-promotesolo]').forEach(b => b.onclick = () => promoteSoloToActive(b.getAttribute('data-promotesolo')));
  sec.querySelectorAll('[data-swipeflip]').forEach(card => {
    let sx = 0;
    card.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    card.addEventListener('touchend', e => { if (Math.abs(e.changedTouches[0].clientX - sx) > 55) { const id = card.getAttribute('data-swipeflip'); enViewState.flippedLabs[id] = !enViewState.flippedLabs[id]; renderEnLab(); } }, { passive: true });
  });
  const ds = document.getElementById('enDiscoverSearch');
  if (ds) ds.oninput = e => { enViewState.discoverQuery = e.target.value; renderEnLab(); document.getElementById('enDiscoverSearch')?.focus(); };
  enSyncTheme();
}

// 📒 1人準備中専用：秘密のアイデアノートUI（進行中とは別体験！）
function openSoloNotebookModal(labId) {
  const lab = enViewState.labs.find(l => l.id === labId);
  if (!lab) return;
  if (!lab.notes) lab.notes = [lab.summary.seed];

  openEnSheetHtml(`📒 ${lab.title}`, '1人準備中・非公開アイデアノート（締切なし）', `
    <div class="en-sec-title" style="color:var(--en-muted);margin:0;">🌱 温め中のメモ</div>
    ${lab.notes.map(n => `<div class="en-formula">📝 ${n}</div>`).join('')}
    <div class="en-row">
      <input id="enSoloNoteInput" class="en-input-field" placeholder="思いついたアイデアをメモ...">
      <button class="en-act-btn primary" id="enSoloNoteAdd">追加</button>
    </div>
    <div class="en-sec-title" style="color:var(--en-muted);margin-top:6px;">🧩 このタネに合いそうな相棒（AI推薦）</div>
    <div class="en-formula">
      <div class="en-between"><strong>佐藤 美咲（デザイン・印刷）</strong><button class="en-act-btn" onclick="closeEnSheet();startQuickAsk('usr-003')">💬 ちょっと聞く</button></div>
      <div class="en-between"><strong>高橋 亮（冷蔵ルート便）</strong><button class="en-act-btn" onclick="closeEnSheet();startQuickAsk('usr-004')">💬 ちょっと聞く</button></div>
    </div>
    <button class="en-act-btn primary" style="justify-content:center;margin-top:4px;" onclick="closeEnSheet();promoteSoloToActive('${lab.id}')">🚀 仲間を募って「進行中ラボ」へ昇格する！</button>
  `);
  document.getElementById('enSoloNoteAdd').onclick = () => {
    const v = document.getElementById('enSoloNoteInput').value.trim();
    if (!v) return;
    lab.notes.push(v); lab.updatedAt = 'たった今メモ';
    renderEnLab(); openSoloNotebookModal(labId); enToast('📝 ノートに追記しました！');
  };
}

window.promoteSoloToActive = (labId) => {
  const lab = enViewState.labs.find(l => l.id === labId);
  if (!lab) return;
  lab.mode = 'my_active';
  lab.badges = [{ type: 'task', label: '仲間募集中', targetTab: 'talk' }];
  lab.nextDeadline = '初回キックオフ日程決め';
  lab.summary = { flow: '1人ノートから正式ラボへ昇格しました！', decided: lab.summary.seed, next: '相棒を招待して試作スタート' };
  enViewState.myLabMode = 'my_active';
  renderEnLab(); renderEnHome();
  enToast('🚀 進行中ラボへ昇格しました！');
};

// 🧪 進行中ラボ専用：4タブ開発室 ＋ 全タスク完了→巣立ち祝福＆マルシェ自動出品
function openEnRoomModal(labId, initialTab = 'talk', asFan = false) {
  enViewState.roomOpenId = labId;
  enViewState.roomTab = initialTab;
  enViewState.roomViewAsFan = asFan || enViewState.userMode === 'buyer';
  let modal = document.getElementById('en-room-modal');
  if (!modal) { modal = document.createElement('div'); modal.id = 'en-room-modal'; document.body.appendChild(modal); }
  modal.classList.add('open');
  renderEnRoomModal();
}

function renderEnRoomModal() {
  const modal = document.getElementById('en-room-modal');
  const lab = enViewState.labs.find(l => l.id === enViewState.roomOpenId) || enViewState.labs[0];
  const rt = enViewState.roomTab;
  const fanMode = enViewState.roomViewAsFan;
  const allDone = enViewState.roomTasks.every(t => t.done);

  let content = '';
  if (fanMode) {
    content = `
      <div class="card en-card">
        <span class="en-pill" style="align-self:flex-start;">👀 外からの見え方（ファン公開画面）</span>
        <div class="en-title">${lab.title}</div>
        <p class="en-text">開発ストーリーを見守って投票に参加しよう！商品が巣立ったら先行早割が届きます。</p>
        <div class="en-formula">${enViewState.roomBoards[0].items.map(x => `<div>📌 ${x}</div>`).join('')}</div>
      </div>
      <div class="card en-card">
        <div class="en-between"><div class="en-title">🗳️ ファン参加型パッケージ投票</div><span class="en-badge">締切2日</span></div>
        <div class="en-actions" style="border:none;padding-top:0;">
          <button class="en-act-btn ${enViewState.voteChoice==='A'?'primary':''}" onclick="castRoomVote('A')">案A：クラフト紙 (${enViewState.voteCounts.A}票)</button>
          <button class="en-act-btn ${enViewState.voteChoice==='B'?'primary':''}" onclick="castRoomVote('B')">案B：透明窓付き (${enViewState.voteCounts.B}票)</button>
        </div>
        <button class="en-act-btn primary" style="justify-content:center;" onclick="enViewState.earlyBirdJoined=true;enToast('🎁 巣立ち時の先行早割・試食モニター通知をONにしました！');renderEnRoomModal();">
          ${enViewState.earlyBirdJoined ? '✅ 巣立ち早割通知 ON済' : '🎁 応援して巣立ち早割通知を受け取る'}
        </button>
      </div>
    `;
  } else if (rt === 'talk') {
    content = enViewState.roomMessages.map((m, i) => `
      <div class="en-chat-bubble ${m.me ? 'me' : ''}" data-msgaction="${i}">
        ${!m.me ? `<strong style="font-size:11px;opacity:0.8;">${m.sender}</strong><br>` : ''}${m.text}
      </div>
    `).join('') + `<div class="en-meta" style="text-align:center;margin-top:6px;">💡 吹き出しをタップ → 「📌 公開ストーリーへ送る」／「✅ やること追加」</div>`;
  } else if (rt === 'progress') {
    content = `
      ${allDone ? `
        <div class="en-grad-banner">
          <div style="font-size:17px;font-weight:900;">🎉 全タスク完了！巣立ち準備OK！</div>
          <div style="font-size:12px;">この商品をマルシェの「巣立ち新商品」へお披露目できます</div>
          <button class="en-act-btn" style="background:#fff;color:#1c1917;justify-content:center;border:none;" onclick="graduateLabToMarche('${lab.id}')">
            ${enViewState.graduatedIds[lab.id] ? '✅ マルシェへ出品済み（見に行く）' : '🎪 マルシェへ巣立ち出品する！'}
          </button>
        </div>
      ` : ''}
      <div class="card en-card">
        <div class="en-between"><div class="en-title">🗳️ 全員OK公開多数決：パッケージ案</div><span class="en-badge">締切あと2日</span></div>
        <div class="en-actions" style="border:none;padding-top:0;">
          <button class="en-act-btn ${enViewState.voteChoice==='A'?'primary':''}" onclick="castRoomVote('A')">案A：クラフト紙＋1色 (${enViewState.voteCounts.A}票)</button>
          <button class="en-act-btn ${enViewState.voteChoice==='B'?'primary':''}" onclick="castRoomVote('B')">案B：中身が見える透明窓 (${enViewState.voteCounts.B}票)</button>
        </div>
      </div>
      <div class="card en-card">
        <div class="en-between"><div class="en-title">✅ やることリスト</div><span class="en-pill">${enViewState.roomTasks.filter(t=>t.done).length}/${enViewState.roomTasks.length} 完了</span></div>
        ${enViewState.roomTasks.map((t, i) => `
          <label class="en-row" style="cursor:pointer;font-size:13px;${t.done?'text-decoration:line-through;opacity:0.55;':''}">
            <input type="checkbox" ${t.done?'checked':''} onchange="toggleRoomTask(${i})"> <span>${t.text}</span>
          </label>
        `).join('')}
        <div class="en-meta">💡 全部チェックすると「🎉 巣立ち祝福演出」が発動します！</div>
      </div>
      <div class="card en-card" style="cursor:pointer;" onclick="enViewState.roomCalExpanded=!enViewState.roomCalExpanded;renderEnRoomModal();">
        <div class="en-between"><div class="en-title">📅 ルーム1行カレンダー</div><span class="en-pill">${enViewState.roomCalExpanded ? '閉じる ▲' : '展開 ▼'}</span></div>
        <div class="en-meta">次：11/29(日) パッケージ決定 ／ 12/6(土) 枚方マルシェ</div>
        ${enViewState.roomCalExpanded ? `<div class="en-cal-grid" style="margin-top:6px;">${Array.from({length:14},(_,i)=>`<div class="en-cal-cell ${[6,13].includes(i+1)?'mark':''}">12/${i+1}</div>`).join('')}</div>` : ''}
      </div>
    `;
  } else if (rt === 'board') {
    const b = enViewState.roomBoards[enViewState.boardIdx];
    content = `
      <div class="en-subtabs">${enViewState.roomBoards.map((bd, i) => `<button class="en-subtab ${enViewState.boardIdx===i?'active':''}" data-bidx="${i}">${bd.name}</button>`).join('')}</div>
      <div class="en-board-canvas" id="enBoardCanvas">
        <div class="en-between"><div class="en-title">${b.name}</div><span class="en-meta">左右スワイプで切替</span></div>
        ${b.items.map(it => `<div class="en-formula">📌 ${it}</div>`).join('')}
        <div class="en-row" style="margin-top:auto;">
          <input id="enBoardAddInput" class="en-input-field" type="text" placeholder="このボードにメモを追加...">
          <button id="enBoardAddBtn" class="en-act-btn primary">追加</button>
        </div>
      </div>
    `;
  } else {
    content = `
      <div class="card en-card">
        <div class="en-title">⚙️ ルーム詳細（2階）</div>
        <div class="en-between"><span>🌐 ファン公開（👀外からの見え方）</span><button class="en-act-btn ${lab.fanPublic?'primary':''}" onclick="toggleLabFanPublic('${lab.id}')">${lab.fanPublic ? '公開 ON' : '非公開 OFF'}</button></div>
        <div class="en-between"><span>🔗 元ネタつぶやきへワープ</span><button class="en-act-btn" onclick="document.getElementById('en-room-modal').classList.remove('open');enViewState.enSubTab='tweet';renderEnFeed();enGoTab('feed');">元ネタへ移動 ➔</button></div>
      </div>
      <div class="card en-card">
        <div class="en-title">👥 参加メンバー（名刺ロック解除済）</div>
        <div class="en-formula">
          <div><strong>山田農園（山田 健一）</strong>｜📞 072-841-xxxx</div>
          <div><strong>カワチ乾燥加工所（田中 誠）</strong>｜📞 06-6789-xxxx</div>
          <div><strong>アトリエ木漏れ日（佐藤 美咲）</strong>｜📞 06-6201-xxxx</div>
        </div>
      </div>
    `;
  }

  modal.innerHTML = `
    <div class="en-room-head">
      <button class="en-act-btn" onclick="document.getElementById('en-room-modal').classList.remove('open')">← 一覧</button>
      <strong style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;text-align:center;">${lab.title}</strong>
      <button class="en-act-btn ${fanMode?'primary':''}" onclick="enViewState.roomViewAsFan=!enViewState.roomViewAsFan;renderEnRoomModal();">${fanMode ? '🛠️ 開発室' : '👀 外見え'}</button>
    </div>
    <div class="en-room-body" id="enRoomBody">${content}</div>
    ${(!fanMode && rt === 'talk') ? `<div class="en-room-composer"><input id="enRoomInput" class="en-room-input" type="text" placeholder="トークを送信..."><button id="enRoomSend" class="en-act-btn primary">送信</button></div>` : ''}
    ${!fanMode ? `<div class="en-room-nav">${[['talk','talk','💬','トーク'],['progress','progress','✅','進行'],['board','board','📋','ボード'],['detail','detail','⚙️','詳細']].map(([k,ic,em,lb]) => `<button class="en-room-tab ${rt===k?'active':''}" data-rtab="${k}">${enIconTag(ic,em)}<span>${lb}</span></button>`).join('')}</div>` : ''}
  `;

  modal.querySelectorAll('[data-rtab]').forEach(b => b.onclick = () => { enViewState.roomTab = b.getAttribute('data-rtab'); renderEnRoomModal(); });
  modal.querySelectorAll('[data-bidx]').forEach(b => b.onclick = () => { enViewState.boardIdx = Number(b.getAttribute('data-bidx')); renderEnRoomModal(); });
  modal.querySelectorAll('[data-msgaction]').forEach(b => b.onclick = () => {
    const m = enViewState.roomMessages[Number(b.getAttribute('data-msgaction'))];
    const safe = m.text.replace(/'/g, '');
    openEnSheetHtml('発言アクション', m.text, `
      <button class="en-sheet-item" onclick="sendMsgToBoard('${safe}')"><span>📌 公開ストーリー（ボード）に送る</span><span>➔</span></button>
      <button class="en-sheet-item" onclick="sendMsgToTask('${safe}')"><span>✅ やることリストに追加する</span><span>➔</span></button>
    `);
  });
  const bCanvas = document.getElementById('enBoardCanvas');
  if (bCanvas) {
    let bx = 0;
    bCanvas.addEventListener('touchstart', e => { bx = e.touches[0].clientX; }, { passive: true });
    bCanvas.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - bx; if (Math.abs(dx) > 45) { enViewState.boardIdx = (enViewState.boardIdx + (dx < 0 ? 1 : enViewState.roomBoards.length - 1)) % enViewState.roomBoards.length; renderEnRoomModal(); } }, { passive: true });
  }
  const bAdd = document.getElementById('enBoardAddBtn');
  if (bAdd) bAdd.onclick = () => { const v = document.getElementById('enBoardAddInput').value.trim(); if (!v) return; enViewState.roomBoards[enViewState.boardIdx].items.push(v); enToast('📋 ボードに追加しました！'); renderEnRoomModal(); };
  const sendBtn = document.getElementById('enRoomSend');
  if (sendBtn) {
    const send = () => { const v = document.getElementById('enRoomInput').value.trim(); if (!v) return; enViewState.roomMessages.push({ sender: 'あなた', me: true, text: v }); renderEnRoomModal(); const body = document.getElementById('enRoomBody'); if (body) body.scrollTop = body.scrollHeight; };
    sendBtn.onclick = send;
    document.getElementById('enRoomInput').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  }
  enSyncTheme();
}

window.graduateLabToMarche = (labId) => {
  const lab = enViewState.labs.find(l => l.id === labId);
  if (lab && !enViewState.graduatedIds[labId]) {
    enViewState.graduatedIds[labId] = true;
    enViewState.marcheItems.unshift({
      id: 'grad-' + Date.now(), type: 'product', badge: '🎉 たった今巣立ち！先行早割',
      title: lab.title, price: '¥1,480', maker: `${enViewState.profile.name} × コラボチーム`, photo: lab.photo
    });
    renderEnShop();
  }
  document.getElementById('en-room-modal')?.classList.remove('open');
  enViewState.marcheFilter = 'product'; renderEnShop(); enGoTab('shop');
  enToast('🎉 おめでとうございます！マルシェに巣立ち出品されました！');
};
window.castRoomVote = (c) => { if (enViewState.voteChoice) enViewState.voteCounts[enViewState.voteChoice]--; enViewState.voteChoice = c; enViewState.voteCounts[c]++; enToast(`🗳️ 案${c}に投票しました！`); renderEnRoomModal(); };
window.toggleRoomTask = (i) => { enViewState.roomTasks[i].done = !enViewState.roomTasks[i].done; if (enViewState.roomTasks.every(t => t.done)) enToast('🎉 全タスク完了！巣立ち準備OK！'); renderEnRoomModal(); };
window.toggleLabFanPublic = (id) => { const l = enViewState.labs.find(x => x.id === id); if (l) { l.fanPublic = !l.fanPublic; enToast(`🌐 ファン公開を ${l.fanPublic?'ON':'OFF'} にしました`); renderEnLab(); renderEnRoomModal(); } };
window.sendMsgToBoard = (text) => { enViewState.roomBoards[0].items.unshift(text); closeEnSheet(); enToast('📌 ルーム内決定メモ（非公開）に保存しました！'); };
window.sendMsgToTask = (text) => { enViewState.roomTasks.unshift({ id: 't'+Date.now(), text, done: false }); closeEnSheet(); enToast('✅ やることリストに追加しました！'); };

// =========================================================
// 4. 🥬 役立ち（4本柱：毎晩ニュース / 旬×廃棄レスキュー＆栄養 / 1週間＆買物＋みんな投稿 / 注目商品［食品＋製品］）
// =========================================================
function renderEnTips() {
  const sec = document.getElementById('view-tips');
  if (!sec) return;
  const st = enViewState.tipsSubTab;

  let bodyHtml = '';
  if (st === 'news') {
    const hero = EN_MOCK_NEWS[0];
    const rest = EN_MOCK_NEWS.slice(1);
    bodyHtml = `
      <div class="en-hero-card" data-opennews="0">
        <img src="${hero.photo}" alt="">
        <div class="en-hero-overlay">
          <span class="en-hero-tag">${hero.date}</span>
          <div class="en-hero-title">${hero.title}</div>
          <div class="en-hero-meta"><span>タップで全文＆記事内50:50ギア連携</span><strong>➔</strong></div>
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
  } else if (st === 'rescue') {
    bodyHtml = `
      <div class="en-meta">🥬 旬の食材ほど出荷増で規格外・廃棄が増えがち。美味しく救うメニュー＆栄養バランスまとめ！</div>
      ${EN_SEASONAL_RESCUE.map((r, idx) => `
        <div class="card en-card">
          <div class="en-card-img-wrap">
            <img class="en-feed-img" src="${idx===0 ? EN_IMAGES.citrus : EN_IMAGES.tomato}" alt="">
            <span class="en-img-chip">♻️ ${r.season}</span>
          </div>
          <div class="en-title">${r.title}</div>
          <p class="en-text">${r.reason}</p>
          <div class="en-nutri-grid">
            ${r.nutri.map(nt => `
              <div class="en-nutri-item">
                <div class="en-between"><span>${nt.label}</span><span>${nt.val}%</span></div>
                <div class="en-nutri-track"><div class="en-nutri-fill ${nt.cls}" style="width:${nt.val}%"></div></div>
              </div>
            `).join('')}
          </div>
          <div class="en-actions">
            <button class="en-act-btn" onclick="enViewState.tipsSubTab='weekly';renderEnTips();">📅 1週間メニューを見る</button>
            <button class="en-act-btn primary" style="margin-left:auto;" data-seed="${r.title}">${enIconTag('seed','🌱')} <span>商品タネ化</span></button>
          </div>
        </div>
      `).join('')}
    `;
  } else if (st === 'weekly') {
    const plan = enViewState.weeklyPlans[enViewState.selectedPlanIdx] || enViewState.weeklyPlans[0];
    bodyHtml = `
      <div class="en-between">
        <span class="en-sec-sub">👥 みんなの旬1週間メニューを参考にしよう</span>
        <button class="en-act-btn primary" style="padding:5px 10px;font-size:11px;" id="enPostWeeklyBtn">＋ 自分の献立を投稿</button>
      </div>
      <div class="en-chip-row">
        ${enViewState.weeklyPlans.map((wp, i) => `
          <button class="en-tag-chip ${enViewState.selectedPlanIdx===i?'active':''}" data-wpidx="${i}">👤 ${wp.author.split('（')[0]} (${wp.likes}❤️)</button>
        `).join('')}
      </div>
      <div class="card en-card">
        <div class="en-between"><span class="en-pill">${plan.tag}</span><span class="en-meta">投稿：${plan.author}</span></div>
        <div class="en-title">${plan.title}</div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          ${plan.days.map(([d, menu]) => `<div class="en-day-row"><span class="en-day-badge">${d}</span><span>${menu}</span></div>`).join('')}
        </div>
      </div>
      <div class="card en-card">
        <div class="en-between">
          <div class="en-title">🛒 この1週間の買うものリスト</div>
          <button class="en-act-btn" style="padding:5px 9px;font-size:11px;" id="enCopyShopListBtn">📋 リストをコピー</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${plan.shopping.map((item, idx) => {
            const key = `${plan.id}-${idx}`;
            const ck = !!enViewState.shoppingChecked[key];
            return `
              <label class="en-shop-item ${ck?'checked':''}">
                <span class="en-row"><input type="checkbox" ${ck?'checked':''} data-shopck="${key}"> <strong>${item.name}</strong></span>
                <span class="en-meta">${item.qty}</span>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } else {
    bodyHtml = `
      <div class="en-meta">✨ この季節に話題の「旬の食べ物」＆「現場・家庭で役立つ便利製品」（利益50:50還元）</div>
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
        <h2 class="en-sec-h2">${enIconTag('news','🥬')} 役立ち・旬と分析</h2>
        <span class="en-sec-sub">毎晩23:00更新＋みんな投稿</span>
      </div>
      <div class="en-subtabs">
        ${[['news','📰 ニュース'],['rescue','🥬 旬×栄養'],['weekly','📅 1週間＆買物'],['featured','✨ 注目商品']].map(([k,l]) =>
          `<button class="en-subtab ${st===k?'active':''}" data-tipstab="${k}">${l}</button>`
        ).join('')}
      </div>
      ${bodyHtml}
    </div>
  `;

  sec.querySelectorAll('[data-tipstab]').forEach(b => b.onclick = () => { enViewState.tipsSubTab = b.getAttribute('data-tipstab'); renderEnTips(); });
  sec.querySelectorAll('[data-wpidx]').forEach(b => b.onclick = () => { enViewState.selectedPlanIdx = Number(b.getAttribute('data-wpidx')); renderEnTips(); });
  sec.querySelectorAll('[data-shopck]').forEach(cb => cb.onchange = () => { const k = cb.getAttribute('data-shopck'); enViewState.shoppingChecked[k] = cb.checked; saveEnStateLocal(); renderEnTips(); });
  sec.querySelectorAll('[data-seed]').forEach(b => b.onclick = () => openSeedSheet(b.getAttribute('data-seed'), '役立ち'));
  sec.querySelectorAll('[data-opennews]').forEach(el => el.onclick = () => {
    const n = EN_MOCK_NEWS[Number(el.getAttribute('data-opennews'))];
    openEnSheetHtml(n.title, n.date, `
      <p class="en-text">${n.summary}</p>
      <div class="en-formula"><strong>🔪 記事内で紹介された50:50注目製品</strong><div>業務用パワー家庭用真空シーラー（¥6,980）</div><button class="en-act-btn" style="align-self:flex-start;" onclick="closeEnSheet();enViewState.tipsSubTab='featured';renderEnTips();">注目商品タブで見る ➔</button></div>
      <button class="en-act-btn primary" style="justify-content:center;" onclick="closeEnSheet();openSeedSheet('${n.title.replace(/'/g,'')}','役立ちニュース')">🌱 このネタをタネにする</button>
    `);
  });
  const cpBtn = document.getElementById('enCopyShopListBtn');
  if (cpBtn) cpBtn.onclick = async () => {
    const plan = enViewState.weeklyPlans[enViewState.selectedPlanIdx];
    const txt = `【${plan.title}】買うものリスト\n` + plan.shopping.map(s => `・${s.name}（${s.qty}）`).join('\n');
    try { await navigator.clipboard.writeText(txt); enToast('📋 買うものリストをコピーしました！'); } catch { enToast('📋 コピー完了！'); }
  };
  const pwBtn = document.getElementById('enPostWeeklyBtn');
  if (pwBtn) pwBtn.onclick = openCreateWeeklyPlanSheet;
  enSyncTheme();
}

function openCreateWeeklyPlanSheet() {
  openEnSheetHtml('📅 自分の1週間メニューを投稿', '旬の食材を使った献立＆買うものリストをみんなにシェア！', `
    <input id="enWpTitle" class="en-input-field" placeholder="タイトル（例：旬の白菜1玉使い切り1週間！）">
    <input id="enWpMon" class="en-input-field" placeholder="メイン献立メモ（例：月:重ね蒸し / 火:クリーム煮 / 水:鍋）">
    <input id="enWpShop" class="en-input-field" placeholder="主な買うもの（カンマ区切り：白菜, 豚肉, 牛乳）">
    <button class="en-act-btn primary" style="justify-content:center;" id="enWpSubmit">みんなの献立に公開する</button>
  `);
  document.getElementById('enWpSubmit').onclick = () => {
    const title = document.getElementById('enWpTitle').value.trim();
    const mon = document.getElementById('enWpMon').value.trim() || '旬の食材たっぷりアレンジ献立';
    const shopRaw = document.getElementById('enWpShop').value.trim() || '旬の冬野菜, 鶏もも肉';
    if (!title) return enToast('⚠️ タイトルを入力してください');
    enViewState.weeklyPlans.unshift({
      id: 'wp-' + Date.now(), author: `${enViewState.profile.name}（投稿）`, likes: 1, title, tag: 'ユーザー投稿・旬メニュー',
      days: [['月', mon], ['火', '作り置きアレンジ'], ['水', '旬野菜のあったか汁物'], ['木', '時短ワンプレート'], ['金', '冷蔵庫リセットメニュー']],
      shopping: shopRaw.split(/[,、]/).map(s => ({ name: s.trim(), qty: '適量' }))
    });
    enViewState.selectedPlanIdx = 0; closeEnSheet(); renderEnTips();
    enToast('📅 みんなの1週間メニューに公開しました！');
  };
}

// =========================================================
// 5. 🎪 マルシェ（巣立ち商品詳細シート ＋ 50:50ギア棚 ＋ 関西日程）
// =========================================================
function renderEnShop() {
  const sec = document.getElementById('view-shop');
  if (!sec) return;
  const f = enViewState.marcheFilter;
  const prod = enViewState.marcheItems.filter(m => m.type === 'product');
  const gears = enViewState.marcheItems.filter(m => m.type === 'gear');

  sec.innerHTML = `
    <div class="en-wrap">
      <div class="en-sec-head"><h2 class="en-sec-h2">${enIconTag('marche','🎪')} EN•マルシェ</h2><span class="en-sec-sub">巣立ち商品・厳選ギア・関西日程</span></div>
      <div class="en-subtabs">
        ${[['all','すべて'],['product','🎉 巣立ち'],['gear','🔪 50:50ギア'],['event','📅 関西日程']].map(([k,l]) =>
          `<button class="en-subtab ${f===k?'active':''}" data-mf="${k}">${l}</button>`
        ).join('')}
      </div>
      ${(f === 'all' || f === 'product') ? `
        <div class="en-sec-head"><h3 class="en-sec-h2" style="font-size:14px;">🎉 ラボから巣立った新商品</h3><span class="en-sec-sub">タップでストーリー＆予約</span></div>
        ${prod.map((p, i) => `
          <div class="en-hero-card" data-openprod="${i}">
            <img src="${p.photo}" alt="">
            <div class="en-hero-overlay">
              <span class="en-hero-tag">${p.badge}</span>
              <div class="en-hero-title">${p.title}</div>
              <div class="en-hero-meta"><span>${p.maker}</span><span class="en-hero-price">${p.price}</span></div>
            </div>
          </div>
        `).join('')}
      ` : ''}
      ${(f === 'all' || f === 'gear') ? `
        <div class="en-sec-head"><h3 class="en-sec-h2" style="font-size:14px;">🔪 50:50 厳選ギア棚</h3><span class="en-sec-sub">利益50:50還元</span></div>
        <div class="en-grid-2">
          ${gears.concat(gears).map((g, idx) => `
            <div class="card en-card" style="padding:10px;gap:7px;">
              <div class="en-card-img-wrap"><img class="en-gear-img" src="${idx===0 ? g.photo : EN_IMAGES.package}" alt=""><span class="en-img-chip" style="font-size:9.5px;padding:2.5px 7px;">プロ推薦</span></div>
              <div class="en-title" style="font-size:12.5px;">${idx===0 ? g.title : '小ロット用クラフト袋＆シーラー入門セット'}</div>
              <div class="en-price" style="font-size:14px;">${idx===0 ? g.price : '¥2,480'}</div>
              <button class="en-act-btn primary" style="justify-content:center;width:100%;font-size:11px;" onclick="enToast('🛒 Amazon（50:50還元リンク）を開きます')">Amazonで見る</button>
            </div>
          `).join('')}
        </div>
      ` : ''}
      ${(f === 'all' || f === 'event') ? `
        <div class="en-sec-head"><h3 class="en-sec-h2" style="font-size:14px;">📅 大阪・京都 週末マルシェ</h3></div>
        ${EN_MOCK_EVENTS.filter(e=>e.area!=='ラボ締切').map(ev => `
          <div class="card en-card" style="gap:5px;cursor:pointer;" onclick="enToast('📅 ${ev.title} を全体カレンダーに追加！')">
            <div class="en-between"><span class="en-pill">${ev.date}</span><span class="en-meta">${ev.note}</span></div>
            <div class="en-title">${ev.title}</div>
            <div class="en-meta">📍 ${ev.area}</div>
          </div>
        `).join('')}
      ` : ''}
    </div>
  `;
  sec.querySelectorAll('[data-mf]').forEach(b => b.onclick = () => { enViewState.marcheFilter = b.getAttribute('data-mf'); renderEnShop(); });
  sec.querySelectorAll('[data-openprod]').forEach(el => el.onclick = () => {
    const p = prod[Number(el.getAttribute('data-openprod'))];
    openEnSheetHtml(p.title, `${p.maker} ｜ ${p.price}`, `
      <img class="en-feed-img" style="border-radius:14px;" src="${p.photo}" alt="">
      <div class="en-formula"><strong>🌱 この商品の誕生ストーリー</strong><div>買い手の「無添加で子どもが食べられるチップスがほしい！」から規格外トマト×低温乾燥機が繋がり誕生しました。</div></div>
      <button class="en-act-btn primary" style="justify-content:center;" onclick="closeEnSheet();enToast('🎉 ${p.title} の先行早割を予約しました！')">🛍️ 先行早割で予約する（${p.price}）</button>
    `);
  });
  enSyncTheme();
}

// =========================================================
// ➕ 右下FAB（タブ連動・登録画面中は自動非表示）
// =========================================================
function openCreateTweetSheet() {
  openEnSheetHtml('💬 つぶやきを投稿', '買い手の「ほしい！」も農家の「困りごと」もここから', `
    <select id="enNewTweetCat" class="en-input-field">
      <option value="want">🙋 ほしい（市場ニーズ）</option>
      <option value="trouble">🆘 困りごと・余剰素材</option>
      <option value="idea">💡 ひらめき・空き設備</option>
    </select>
    <textarea id="enNewTweetText" class="en-input-field" rows="3" placeholder="例：無添加の地元いちごジャムがほしい！／来週乾燥機が空いてます！"></textarea>
    <button class="en-act-btn primary" style="justify-content:center;" onclick="submitNewTweet()">タイムラインに投稿する</button>
  `);
}
window.submitNewTweet = () => {
  const cat = document.getElementById('enNewTweetCat').value;
  const text = document.getElementById('enNewTweetText').value.trim();
  if (!text) return enToast('⚠️ 本文を入力してください');
  enViewState.tweets.unshift({
    id: 'tw-' + Date.now(), category: cat, author: enViewState.profile.name, role: enViewState.userMode === 'buyer' ? '買い手・応援' : 'つくり手',
    area: enViewState.profile.area, iconType: 'farm', avatar: enViewState.profile.photo || EN_IMAGES.userFarm, time: 'たった今', text, photo: '', likes: 0, comments: 0
  });
  closeEnSheet(); enViewState.enSubTab = 'tweet'; enViewState.tweetCat = 'all';
  renderEnFeed(); enGoTab('feed'); enToast('✨ つぶやきを投稿しました！');
};

function openCreateSoloLabSheet() {
  openEnSheetHtml('📒 1人準備中ノートラボを作成', 'まずは締切ゼロの非公開メモから温めよう', `
    <input id="enNewLabTitle" class="en-input-field" type="text" placeholder="ラボ名（例：寝屋川産・無添加いちごチップス）">
    <textarea id="enNewLabSeed" class="en-input-field" rows="2" placeholder="今のタネ・作りたいイメージ"></textarea>
    <button class="en-act-btn primary" style="justify-content:center;" onclick="submitNewSoloLab()">1人ノートラボを作る</button>
  `);
}
window.submitNewSoloLab = () => {
  const title = document.getElementById('enNewLabTitle').value.trim();
  const seed = document.getElementById('enNewLabSeed').value.trim() || 'これから詳細を詰める予定';
  if (!title) return enToast('⚠️ ラボ名を入力してください');
  enViewState.labs.unshift({
    id: 'lab-solo-' + Date.now(), mode: 'my_solo', fanPublic: false, title, photo: EN_IMAGES.jam,
    updatedAt: 'たった今作成', summary: { seed, needed: 'パートナー検討中' }, notes: [seed]
  });
  closeEnSheet(); enViewState.labSubTab = 'my'; enViewState.myLabMode = 'my_solo';
  renderEnLab(); enGoTab('en'); enToast('📒 1人ノートラボを作成しました！');
};

function updateActionFab() {
  let fab = document.getElementById('en-action-fab');
  if (!fab) { fab = document.createElement('button'); fab.id = 'en-action-fab'; document.body.appendChild(fab); }
  const map = {
    home: { label: 'クイック作成', fn: () => openEnSheetHtml('＋ クイック作成', 'やりたいことを選んでください', `
      <button class="en-sheet-item" onclick="openCreateTweetSheet()"><span>💬 つぶやき・🙋ほしいを投稿</span><span>➔</span></button>
      <button class="en-sheet-item" onclick="openCreateSoloLabSheet()"><span>📒 1人ノートラボを作る</span><span>➔</span></button>
      <button class="en-sheet-item" onclick="openCreateWeeklyPlanSheet()"><span>📅 旬の1週間メニューを投稿</span><span>➔</span></button>
    `)},
    feed: { label: 'つぶやく', fn: openCreateTweetSheet },
    en:   { label: '1人ノート', fn: openCreateSoloLabSheet },
    tips: { label: '献立・商品推薦', fn: () => openEnSheetHtml('🥬 役立ちに投稿する', '', `
      <button class="en-sheet-item" onclick="openCreateWeeklyPlanSheet()"><span>📅 旬の1週間メニュー＆買物リストを投稿</span><span>➔</span></button>
      <button class="en-sheet-item" onclick="closeEnSheet();enToast('🔪 50:50注目商品の推薦フォームを開きます')"><span>✨ 季節の注目商品（50:50）を推薦</span><span>➔</span></button>
    `)},
    shop: { label: '出品・出店', fn: () => openEnSheetHtml('🎪 マルシェ出品・出店', '', `
      <button class="en-sheet-item" onclick="closeEnSheet();enToast('🎉 巣立ち商品の出品申請を開きます')"><span>🎉 ラボ巣立ち商品を出品</span><span>➔</span></button>
      <button class="en-sheet-item" onclick="closeEnSheet();enToast('📅 枚方・京都マルシェへ出店申込')"><span>📅 関西マルシェへ出店申込</span><span>➔</span></button>
    `)}
  };
  const cur = map[enViewState.activeMainTab] || map.home;
  fab.innerHTML = `${enIconTag('plus','＋')} <span>${cur.label}</span>`;
  fab.onclick = cur.fn;
  enSyncTheme();
}

// 初期化 ＆ 登録画面状態監視
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    loadEnStateLocal();
    enViewState.tweets = [...EN_MOCK_TWEETS];
    enViewState.labs   = [...EN_MOCK_LABS];
    enViewState.marcheItems = [...EN_MOCK_MARCHE];

    mountHeaderQuickIcons();
    enhanceRegisterScreen();
    syncRegisterOverlayState();
    renderEnHome(); renderEnFeed(); renderEnLab(); renderEnTips(); renderEnShop();
    updateActionFab();

    const regSec = document.getElementById('view-register');
    if (regSec) {
      new MutationObserver(syncRegisterOverlayState).observe(regSec, { attributes: true, attributeFilter: ['class'] });
    }
    document.querySelectorAll('#bottomNav [data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        enViewState.activeMainTab = btn.getAttribute('data-tab');
        syncRegisterOverlayState();
        updateActionFab();
      });
    });

    setInterval(() => {
      if (enViewState.slideFixed) return;
      enViewState.slideIdx = (enViewState.slideIdx + 1) % 3;
      const track = document.getElementById('enProfTrack');
      if (track) {
        track.style.transform = `translateX(-${enViewState.slideIdx * 100}%)`;
        document.querySelectorAll('.en-prof-dot').forEach((d, i) => d.classList.toggle('active', i === enViewState.slideIdx));
      }
    }, 4500);
  }, 150);
});