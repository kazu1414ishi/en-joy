/* =========================================================
   EN•joy 全機能コンプリート描画パッチ（patch_views.js v4）
   ・ルーム即入りUX（カード全体タップ / バッジ→進行直行 / 横スワイプ要約）
   ・ヘッダー💬(ちょっと聞く)＆🔔(通知) / 2階建て検索 / 長押し詳細
   ・ヒント箱実連動 / 4種ボードスワイプ / 全体カレンダー / 実投稿＆1人ラボ作成
   ========================================================= */

const enViewState = {
  activeMainTab: 'home',
  userMode: 'maker',     // 'maker' | 'buyer'
  mapOpen: true,
  slideIdx: 0,
  slideFixed: false,
  enSubTab: 'tweet',
  tweetCat: 'all',
  likedIds: {},
  savedIds: {},
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
  aideaSubTab: 'suggest', // 'suggest' | 'hint'
  flippedLabs: {},
  marcheFilter: 'all',
  roomOpenId: null,
  roomTab: 'talk',        // 'talk' | 'progress' | 'board' | 'detail'
  roomViewAsFan: false,
  roomCalExpanded: false,
  boardIdx: 0,
  voteCounts: { A: 3, B: 2 },
  voteChoice: null,
  earlyBirdJoined: false,
  // 動的データ（実際に追加・連動する）
  tweets: [],
  labs: [],
  hintBox: [
    { id: 'h-1', title: 'カワチ乾燥加工所の低温乾燥機（来週火・水空き）', from: 'つぶやき', time: '1時間前' }
  ],
  quickAsks: [
    { id: 'qa-1', userId: 'usr-002', name: '田中 誠（カワチ乾燥加工所）', area: '東大阪市', msg: 'トマト30kgからの乾燥試作、だいたいの目安教えていただけますか？', matched: false }
  ],
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
  ]
};

const EN_MOCK_EVENTS = [
  { day: 29, date: '11/29(日)', area: 'ラボ締切', title: 'ドライトマト試作パッケージ最終決定', note: '多数決締切' },
  { day: 6,  date: '12/6(土) 10:00〜16:00', area: '枚方市・ニッペパーク岡東中央', title: 'ひらかた週末クラフト＆農産マルシェ', note: '初出店枠あり・¥3,000' },
  { day: 13, date: '12/13(土) 11:00〜15:00', area: '京都市・古民家EN•dress前', title: '冬の新商品お披露目＆試食マルシェ', note: '巣立ち商品優先枠' }
];

function enIconTag(name, emoji) {
  return `<span data-en-icon-name="${name}" data-en-emoji="${emoji}">${emoji}</span>`;
}
function enGoTab(tabName) {
  enViewState.activeMainTab = tabName;
  document.querySelector(`#bottomNav [data-tab="${tabName}"]`)?.click();
  updateActionFab();
}
function enSyncTheme() {
  if (typeof applyEnTheme === 'function') applyEnTheme();
}

// 🏝️ Dynamic Island風トースト
let enToastTimer = null;
function enToast(msg) {
  let el = document.getElementById('en-island-toast');
  if (!el) { el = document.createElement('div'); el.id = 'en-island-toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(enToastTimer);
  enToastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

// 📑 汎用ネイティブボトムシート（HTML直接描画も可）
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
        <div>
          <div class="en-title" style="font-size:16px;">${title}</div>
          ${subtitle ? `<div class="en-meta">${subtitle}</div>` : ''}
        </div>
        <button class="en-act-btn" onclick="closeEnSheet()">✕</button>
      </div>
      <div id="en-sheet-content" style="display:flex;flex-direction:column;gap:9px;">${innerHtml}</div>
    </div>
  `;
  bd.classList.add('open');
  enSyncTheme();
}
function closeEnSheet() {
  document.getElementById('en-sheet-backdrop')?.classList.remove('open');
}

// =========================================================
// ヘッダー右上：💬（ちょっと聞く）＆ 🔔（通知）自動設置
// =========================================================
function mountHeaderQuickIcons() {
  const ctrls = document.querySelector('#topHeader .header-controls');
  if (!ctrls || document.getElementById('enHdrAskBtn')) return;

  const askBtn = document.createElement('button');
  askBtn.id = 'enHdrAskBtn';
  askBtn.type = 'button';
  askBtn.className = 'en-hdr-icon-btn';
  askBtn.title = 'ちょっと聞く（連絡先非公開トーク）';
  askBtn.innerHTML = `${enIconTag('ask','💬')}<span class="en-hdr-dot" id="enAskCount">${enViewState.quickAsks.length}</span>`;
  askBtn.onclick = openQuickAskSheet;

  const bellBtn = document.createElement('button');
  bellBtn.id = 'enHdrBellBtn';
  bellBtn.type = 'button';
  bellBtn.className = 'en-hdr-icon-btn';
  bellBtn.title = '通知';
  bellBtn.innerHTML = `${enIconTag('bell','🔔')}<span class="en-hdr-dot" id="enNotifCount">${enViewState.notifications.length}</span>`;
  bellBtn.onclick = openNotifSheet;

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
      <div class="en-between">
        <strong>${q.name}</strong>
        <span class="en-pill">${q.matched ? '🔓 名刺開示済' : '🔒 連絡先非公開'}</span>
      </div>
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
  const q = enViewState.quickAsks[idx];
  q.matched = true;
  enViewState.labs.unshift({
    id: 'lab-new-' + Date.now(),
    mode: 'my_active',
    fanPublic: false,
    title: `${q.name.split('（')[0]}さんとの新コラボ企画`,
    photo: EN_IMAGES.drying,
    sourceTweetId: null,
    urgent: true,
    unread: 1,
    badges: [{ type: 'task', label: 'キックオフ', targetTab: 'talk' }],
    nextDeadline: '初回打ち合わせ調整中',
    summary: { flow: 'ちょっと聞くからラボへ昇格しました', decided: 'まずはサンプル共有から', next: 'トークで挨拶しよう' }
  });
  enToast('🎉 ラボ昇格＆デジタル名刺のロックが解除されました！');
  renderEnLab();
  openQuickAskSheet();
};

function openNotifSheet() {
  const html = enViewState.notifications.map((n, i) => `
    <button class="en-sheet-item" onclick="handleNotifClick(${i})">
      <span>${n.icon} ${n.text}<br><small class="en-meta">${n.time}</small></span>
      <span>➔</span>
    </button>
  `).join('');
  openEnSheetHtml('🔔 通知', 'ラボの動き・買い手連携・早割のお知らせ', html);
}

window.handleNotifClick = (i) => {
  const n = enViewState.notifications[i];
  closeEnSheet();
  if (n.roomId) openEnRoomModal(n.roomId, n.roomTab || 'talk');
  else if (n.tab) enGoTab(n.tab);
};

// 🌱 タネにする（ヒント箱へ実追加 / 1人ラボへ実作成）
function openSeedSheet(title, fromLabel) {
  const safe = title.replace(/'/g, '');
  openEnSheetHtml('🌱 このネタをどう活かす？', title, `
    <button class="en-sheet-item" onclick="addToHintBox('${safe}','${fromLabel}')">
      <span>📌 ヒント箱にストック<br><small class="en-meta">AIディアの「ヒント箱」タブに保存されます</small></span><span>➔</span>
    </button>
    <button class="en-sheet-item" onclick="createSoloLabFromSeed('${safe}')">
      <span>🧪 すぐ1人ラボを作る（元ネタワープ付き）<br><small class="en-meta">マイラボの「1人準備中」へ即追加</small></span><span>➔</span>
    </button>
  `);
}

window.addToHintBox = (title, fromLabel) => {
  enViewState.hintBox.unshift({ id: 'h-' + Date.now(), title, from: fromLabel, time: 'たった今' });
  closeEnSheet();
  enToast('📌 AIディアのヒント箱にストックしました！');
  renderEnLab();
};

window.createSoloLabFromSeed = (title) => {
  const id = 'lab-solo-' + Date.now();
  enViewState.labs.unshift({
    id, mode: 'my_solo', fanPublic: false, title: `【タネ】${title.slice(0, 18)}`,
    photo: EN_IMAGES.package, sourceTweetId: 'tw-000', updatedAt: 'たった今作成',
    summary: { seed: title, needed: '加工・デザイン・物流パートナーをこれから検討' }
  });
  closeEnSheet();
  enViewState.labSubTab = 'my';
  enViewState.myLabMode = 'my_solo';
  renderEnLab();
  enGoTab('en');
  enToast('🧪 1人準備中ラボを作成しました！');
};

// 📅 全体カレンダー展開シート
function openGlobalCalendarSheet() {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const marks = [6, 13, 29];
  const html = `
    <div class="en-cal-grid">
      ${['日','月','火','水','木','金','土'].map(d => `<div class="en-meta" style="font-weight:800;">${d}</div>`).join('')}
      ${days.map(d => `<div class="en-cal-cell ${marks.includes(d) ? 'mark' : ''}">${d}</div>`).join('')}
    </div>
    <div class="en-sec-title" style="color:var(--en-muted);margin-top:6px;">全ラボ横断スケジュール</div>
    ${EN_MOCK_EVENTS.map(ev => `
      <div class="en-formula">
        <div class="en-between"><strong>${ev.date}</strong><span class="en-pill">${ev.note}</span></div>
        <div>${ev.title}（${ev.area}）</div>
      </div>
    `).join('')}
  `;
  openEnSheetHtml('📅 全体カレンダー（全ラボ＋マルシェ）', 'オレンジの日付に締切・イベントがあります', html);
}

// SVGミニ進捗リング
function enMiniRing(pct) {
  const c = 2 * Math.PI * 13;
  const off = c - (pct / 100) * c;
  return `
    <div class="en-ring-wrap">
      <svg width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="13" fill="none" stroke="var(--en-border)" stroke-width="3"/>
        <circle cx="16" cy="16" r="13" fill="none" stroke="var(--en-accent)" stroke-width="3"
          stroke-dasharray="${c}" stroke-dashoffset="${off}" stroke-linecap="round" transform="rotate(-90 16 16)"/>
      </svg>
      <span>${pct}%</span>
    </div>
  `;
}

// =========================================================
// 1. 🏠 ホーム（直行ウィジェット ＋ 自動/スワイプ3面名刺 ＋ ニュース帯）
// =========================================================
function renderEnHome() {
  const sec = document.getElementById('view-home');
  if (!sec) return;
  const isMaker = enViewState.userMode === 'maker';
  const activeCount = enViewState.labs.filter(l => l.mode === 'my_active').length;

  const widgets = isMaker ? [
    { kind: 'ring', pct: 75, urgent: true,  title: '全体のやること', badge: '直行',   body: 'ドライトマト開発',   sub: '多数決あと1件 → タップで進行へ', action: 'room-progress' },
    { kind: 'date', m: '11月', d: '29', urgent: false, title: '全体カレンダー', badge: '展開',  body: '試作パッケージ締切', sub: '12/6 枚方マルシェほか3件', action: 'calendar' },
    { kind: 'icon', icon: 'talk',  emoji: '💬', color: 'green',  urgent: false, title: '関連の動き',     badge: '新着',  body: '「ほしい！」42応援', sub: `ヒント箱 ${enViewState.hintBox.length}件・新着反応`, action: 'related' },
    { kind: 'icon', icon: 'aidea', emoji: '✨', color: 'purple', urgent: false, title: '今日のAIディア', badge: '3点掛', body: 'トマト×低温乾燥',    sub: '🙋要望 × 🌾素材 × 🏭設備', action: 'aidea' }
  ] : [
    { kind: 'icon', icon: 'marche', emoji: '🛍️', color: '',      urgent: true,  title: '新着・予約早割', badge: '限定',   body: '完熟ドライトマト',   sub: '巣立ち第1号・¥1,280', action: 'shop' },
    { kind: 'ring', pct: 80, urgent: false, title: '応援中の公開ラボ', badge: '投票', body: 'ドライトマト開発', sub: 'タップで外からの見え方へ', action: 'room-fan' },
    { kind: 'date', m: '12月', d: '6', urgent: false, title: '週末マルシェ',   badge: '大阪',   body: '枚方週末マルシェ',   sub: '試食ブースあり・無料', action: 'calendar' },
    { kind: 'icon', icon: 'greet',  emoji: '❤️', color: 'green', urgent: false, title: '推しのつくり手', badge: '4軒',   body: '山田農園 ほか3軒',   sub: 'マップで近所の農家探し', action: 'people' }
  ];

  sec.innerHTML = `
    <div class="en-wrap">
      <div class="en-prof-slider" id="enProfSlider">
        <div class="en-prof-watermark">EN•JOY</div>
        <div class="en-prof-track" id="enProfTrack" style="transform:translateX(-${enViewState.slideIdx * 100}%)">
          <div class="en-prof-slide">
            <div class="en-between">
              <div class="en-row">
                <img class="en-avatar" src="${EN_IMAGES.userFarm}" alt="">
                <div>
                  <div style="font-size:9.5px;opacity:0.8;font-weight:900;letter-spacing:0.12em;">EN•JOY DIGITAL CARD</div>
                  <div class="en-title" style="color:#fff;">マイ名刺（${isMaker ? '🛠️ つくり手' : '🛍️ 買い手'}）</div>
                  <div style="font-size:11px;opacity:0.86;">📍 大阪府 枚方市・寝屋川市</div>
                </div>
              </div>
              <button class="en-act-btn" style="background:rgba(255,255,255,0.16);color:#fff;border-color:rgba(255,255,255,0.34);" onclick="document.getElementById('openRegBtn')?.click()">
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
                <div style="font-size:12px;opacity:0.9;margin-top:4px;">今月のコラボ熱量バツグン！次の巣立ちで限定バッジ解放</div>
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
              ${w.kind === 'ring' ? enMiniRing(w.pct)
                : w.kind === 'date' ? `<span class="en-date-pill"><small>${w.m}</small><b>${w.d}</b></span>`
                : `<span class="en-w-icon ${w.color}">${enIconTag(w.icon, w.emoji)}</span>`}
              <span class="en-badge">${w.urgent ? '<span class="en-live-dot"></span>' : ''}${w.badge}</span>
            </div>
            <div class="en-widget-label">${w.title}</div>
            <div class="en-widget-body">${w.body}</div>
            <div class="en-widget-sub">${w.sub}</div>
          </button>
        `).join('')}
      </div>

      <div class="en-news-bar" onclick="enGoTab('tips')">
        <span class="en-badge">${enIconTag('news', '📰')} 昨夜の分析</span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:800;flex:1;">${EN_MOCK_NEWS[0].title}</span>
        <span style="opacity:0.5;">➔</span>
      </div>
    </div>
  `;

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
    else if (act === 'people') { enViewState.enSubTab = 'people'; renderEnFeed(); enGoTab('feed'); }
    else if (act === 'shop') enGoTab('shop');
    else if (act === 'related') openNotifSheet();
  });

  sec.querySelectorAll('[data-slide]').forEach(dot => dot.onclick = () => { enViewState.slideFixed = true; enViewState.slideIdx = Number(dot.getAttribute('data-slide')); renderEnHome(); });
  document.getElementById('enToggleMapBtn').onclick = () => { enViewState.slideFixed = true; enViewState.mapOpen = !enViewState.mapOpen; enToast(`🗺️ マップ公開を ${enViewState.mapOpen ? 'ON' : 'OFF'} にしました`); renderEnHome(); };
  document.getElementById('enToggleModeBtn').onclick = () => { enViewState.slideFixed = true; enViewState.userMode = isMaker ? 'buyer' : 'maker'; enToast(enViewState.userMode === 'buyer' ? '🛍️ 買い手表示に切替ました' : '🛠️ つくり手表示に切替ました'); renderEnHome(); renderEnFeed(); };
  enSyncTheme();
}

// =========================================================
// 2. 🤝 縁を繋げる（つぶやき ＋ 2階建て検索＆長押し詳細＆3段階アクション）
// =========================================================
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
      ${list.map(t => {
        const liked = !!enViewState.likedIds[t.id];
        const saved = !!enViewState.savedIds[t.id];
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
            ${t.photo ? `<div class="en-card-img-wrap"><img class="en-card-img" src="${t.photo}" alt=""><span class="en-img-chip">${catLabel}</span></div>` : ''}
            <div class="en-actions">
              <button class="en-act-btn ${liked ? 'liked' : ''}" data-like="${t.id}">${enIconTag('greet', '❤️')} <span>${t.likes + (liked?1:0)}</span></button>
              <button class="en-act-btn" onclick="enToast('💬 コメントを閲覧中')">${enIconTag('talk', '💬')} <span>${t.comments}</span></button>
              <button class="en-act-btn ${saved ? 'liked' : ''}" data-save="${t.id}">${enIconTag('hint', '🔖')}</button>
              <button class="en-act-btn primary" style="margin-left:auto;" data-seed="${t.author}：${t.text.slice(0,22)}">
                ${enIconTag('seed', '🌱')} <span class="en-btn-label">タネにする</span>
              </button>
            </div>
          </div>
        `;
      }).join('')}
    `;
  } else {
    const view = enViewState.peopleView;
    const q = enViewState.peopleQuery.trim();
    const filtered = EN_MOCK_PEOPLE.filter(p => {
      const catOk = enViewState.peopleCat === 'all' || p.category === enViewState.peopleCat;
      const qOk = !q || (p.name + p.shop + p.area + p.canDo).includes(q);
      return catOk && qOk;
    });
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
        <div class="en-meta" style="text-align:center;">💡 カードをタップ（長押し）で設備・過去実績の詳細ポップが開きます</div>
        <div class="en-grid-2">
          ${filtered.map(p => `
            <div class="card en-card" style="padding:11px;gap:8px;cursor:pointer;" data-persondetail="${p.id}">
              <div class="en-row">
                <img class="en-avatar" style="width:36px;height:36px;" src="${p.avatar}" alt="">
                <div><div class="en-title" style="font-size:13px;">${p.name}</div><div class="en-meta">${p.area}</div></div>
              </div>
              <span class="en-pill" style="align-self:flex-start;">${enIconTag(p.category,'🌾')} ${p.categoryLabel}</span>
              <p class="en-text" style="font-size:11.5px;">${p.canDo}</p>
              <div class="en-meta" style="color:var(--en-accent);font-weight:800;font-size:11px;">✨ ${p.aiMatch}</div>
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
          ${filtered.map(p => `
            <button class="en-map-pin ${p.id === selected.id ? 'active' : ''}" data-pin="${p.id}" style="left:${p.mapPos.x}%;top:${p.mapPos.y}%;">
              ${enIconTag(p.category,'📍')} ${p.area}
            </button>
          `).join('')}
        </div>
        <div class="card en-card">
          <div class="en-row">
            <img class="en-avatar" src="${selected.avatar}" alt="">
            <div><div class="en-title">${selected.name}（${selected.shop}）</div><div class="en-meta">${selected.area} ・ ${selected.categoryLabel}</div></div>
          </div>
          <p class="en-text">${selected.canDo}</p>
          <div class="en-meta" style="color:var(--en-accent);font-weight:800;">✨ ${selected.aiMatch}</div>
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
            <div class="en-hero-overlay">
              <span class="en-hero-tag">${swp.area} ・ ${swp.categoryLabel}</span>
              <div class="en-hero-title">${swp.name}（${swp.shop}）</div>
            </div>
          </div>
          <p class="en-text">${swp.canDo}</p>
          <div class="en-meta" style="color:var(--en-accent);font-weight:800;">✨ ${swp.aiMatch}</div>
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
  sec.querySelectorAll('[data-save]').forEach(b => b.onclick = () => { const id = b.getAttribute('data-save'); enViewState.savedIds[id] = !enViewState.savedIds[id]; enToast(enViewState.savedIds[id] ? '🔖 保存しました' : '保存を解除しました'); renderEnFeed(); });
  sec.querySelectorAll('[data-seed]').forEach(b => b.onclick = () => openSeedSheet(b.getAttribute('data-seed'), 'つぶやき'));
  sec.querySelectorAll('[data-pview]').forEach(b => b.onclick = () => { enViewState.peopleView = b.getAttribute('data-pview'); renderEnFeed(); });
  sec.querySelectorAll('[data-pin]').forEach(b => b.onclick = () => { enViewState.mapSelectedId = b.getAttribute('data-pin'); renderEnFeed(); });
  sec.querySelectorAll('[data-pcat]').forEach(b => b.onclick = () => { enViewState.peopleCat = b.getAttribute('data-pcat'); renderEnFeed(); });
  sec.querySelectorAll('[data-persondetail]').forEach(c => c.onclick = () => openPersonDetailSheet(c.getAttribute('data-persondetail')));
  const pSearch = document.getElementById('enPeopleSearch');
  if (pSearch) pSearch.oninput = e => { enViewState.peopleQuery = e.target.value; renderEnFeed(); document.getElementById('enPeopleSearch')?.focus(); };
  const pFilter = document.getElementById('enPeopleFilterBtn');
  if (pFilter) pFilter.onclick = () => { enViewState.peopleFilterOpen = !enViewState.peopleFilterOpen; renderEnFeed(); };
  const nextBtn = document.getElementById('enSwipeNext');
  if (nextBtn) nextBtn.onclick = () => { enViewState.swipeIdx++; renderEnFeed(); };
  const likeBtn = document.getElementById('enSwipeLike');
  if (likeBtn) likeBtn.onclick = () => { enToast('👋 「気になる」を送りました！'); enViewState.swipeIdx++; renderEnFeed(); };
  enSyncTheme();
}

function openPersonDetailSheet(uid) {
  const p = EN_MOCK_PEOPLE.find(x => x.id === uid);
  if (!p) return;
  openEnSheetHtml(`${p.name}（${p.shop}）`, `${p.area} ・ ${p.categoryLabel}`, `
    <div class="en-formula">
      <div>🏭 <strong>設備・強み：</strong>${p.detail.equipment}</div>
      <div>🧪 <strong>過去ラボ実績：</strong>${p.detail.pastLabs}件</div>
      <div>⚡ <strong>返信ペース：</strong>${p.detail.replySpeed}</div>
      <div style="color:var(--en-accent);font-weight:800;">✨ 性格相性：${p.aiMatch}</div>
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
// 3. 🧪 EN•ラボ（カード全体タップ即入り ＋ 探す検索 ＋ ヒント箱連動）
// =========================================================
function renderEnLab() {
  const sec = document.getElementById('view-en');
  if (!sec) return;
  const tab = enViewState.labSubTab;

  let bodyHtml = '';
  if (tab === 'my') {
    const labs = enViewState.labs.filter(l => l.mode === enViewState.myLabMode);
    bodyHtml = `
      <div class="en-subtabs">
        <button class="en-subtab ${enViewState.myLabMode==='my_active'?'active':''}" data-lmode="my_active">👥 進行中 (${enViewState.labs.filter(l=>l.mode==='my_active').length})</button>
        <button class="en-subtab ${enViewState.myLabMode==='my_solo'?'active':''}" data-lmode="my_solo">${enIconTag('lock','🔒')} 1人準備中 (${enViewState.labs.filter(l=>l.mode==='my_solo').length})</button>
      </div>
      <div class="en-meta" style="text-align:center;">👆 カードをタップで即ルームへ ／ 左右スワイプで要約を確認</div>
      ${labs.map(l => {
        const flipped = !!enViewState.flippedLabs[l.id];
        return `
          <div class="card en-card" data-swipeflip="${l.id}">
            <div class="en-lab-tapzone" data-openroom="${l.id}">
              <div class="en-card-img-wrap">
                <img class="en-card-img" src="${l.photo}" alt="">
                ${l.fanPublic ? '<span class="en-img-chip">🌐 ファン公開中</span>' : '<span class="en-img-chip">🔒 メンバー限定</span>'}
                <span class="en-enter-pill">ルームに入る ➔</span>
              </div>
              <div class="en-title">${l.title}</div>
              <div class="en-steps">
                <span class="en-step done">1.タネ</span>
                <span class="en-step ${l.mode==='my_active'?'done':'now'}">2.試作</span>
                <span class="en-step ${l.mode==='my_active'?'now':''}">3.投票</span>
                <span class="en-step">4.巣立ち</span>
              </div>
            </div>
            ${!flipped ? `
              <div class="en-row" style="flex-wrap:wrap;">
                ${(l.badges || []).map(b => `<button class="en-badge" data-openroom="${l.id}" data-opentab="${b.targetTab || 'progress'}">⚡ ${b.label} ➔</button>`).join('')}
                <span class="en-meta">${l.nextDeadline || l.updatedAt}</span>
              </div>
            ` : `
              <div class="en-formula">
                ${l.summary.flow ? `<div>📌 <strong>流れ：</strong>${l.summary.flow}</div><div>✅ <strong>決定：</strong>${l.summary.decided}</div><div>👉 <strong>次：</strong>${l.summary.next}</div>`
                  : `<div>🌱 <strong>タネ：</strong>${l.summary.seed}</div><div>🤝 <strong>必要：</strong>${l.summary.needed}</div>`}
              </div>
            `}
            <div class="en-actions">
              <button class="en-act-btn" data-flip="${l.id}">${enIconTag('summary','📄')} <span class="en-btn-label">${flipped ? '表に戻す' : '要約を見る'}</span></button>
              <button class="en-act-btn primary" style="margin-left:auto;" data-openroom="${l.id}">${enIconTag('lab','🧪')} <span>ルームを開く</span></button>
            </div>
          </div>
        `;
      }).join('')}
    `;
  } else if (tab === 'discover') {
    const dq = enViewState.discoverQuery.trim();
    const list = enViewState.labs.filter(l => l.mode === 'discover' && (!dq || (l.title + l.area + l.recruiting).includes(dq)) && (enViewState.discoverTag === 'all' || (l.tags || []).includes(enViewState.discoverTag)));
    bodyHtml = `
      <input id="enDiscoverSearch" class="en-search-input" type="search" value="${enViewState.discoverQuery}" placeholder="🔍 ラボ名・エリア・募集職種で探す">
      <div class="en-chip-row">
        ${['all','一次産業','加工・製造','ファン投票中'].map(t => `<button class="en-tag-chip ${enViewState.discoverTag===t?'active':''}" data-dtag="${t}">${t==='all'?'すべて':t}</button>`).join('')}
      </div>
      ${list.map(l => `
        <div class="card en-card">
          <div class="en-lab-tapzone" data-openroom="${l.id}" data-fan="1">
            <div class="en-card-img-wrap">
              <img class="en-card-img" src="${l.photo}" alt="">
              <span class="en-img-chip">${l.status}</span>
              <span class="en-enter-pill">のぞく・投票 ➔</span>
            </div>
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
            <button class="en-act-btn" onclick="createSoloLabFromSeed('${a.proposal}')">${enIconTag('seed','🧪')} <span class="en-btn-label">1人ルームで温める</span></button>
            <button class="en-act-btn primary" style="margin-left:auto;" onclick="enToast('📩 関係者へコラボオファーを送信しました！')">${enIconTag('invite','📩')} <span class="en-btn-label">すぐオファー</span></button>
          </div>
        </div>
      `).join('') : enViewState.hintBox.map(h => `
        <div class="card en-card" style="gap:6px;">
          <div class="en-between"><span class="en-pill">📌 ${h.from}</span><span class="en-meta">${h.time}</span></div>
          <div class="en-title">${h.title}</div>
          <button class="en-act-btn primary" style="align-self:flex-end;" onclick="createSoloLabFromSeed('${h.title.replace(/'/g,'')}')">🧪 このヒントから1人ラボ作成</button>
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
  sec.querySelectorAll('[data-swipeflip]').forEach(card => {
    let sx = 0;
    card.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    card.addEventListener('touchend', e => {
      if (Math.abs(e.changedTouches[0].clientX - sx) > 55) {
        const id = card.getAttribute('data-swipeflip');
        enViewState.flippedLabs[id] = !enViewState.flippedLabs[id];
        renderEnLab();
      }
    }, { passive: true });
  });
  const ds = document.getElementById('enDiscoverSearch');
  if (ds) ds.oninput = e => { enViewState.discoverQuery = e.target.value; renderEnLab(); document.getElementById('enDiscoverSearch')?.focus(); };
  enSyncTheme();
}

// =========================================================
// 🧪 ルーム内フル画面モーダル（トーク・進行・4種ボード・詳細＋ファン公開視点）
// =========================================================
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
      <div class="en-subtabs">
        ${enViewState.roomBoards.map((bd, i) => `<button class="en-subtab ${enViewState.boardIdx===i?'active':''}" data-bidx="${i}">${bd.name}</button>`).join('')}
      </div>
      <div class="en-board-canvas" id="enBoardCanvas">
        <div class="en-between"><div class="en-title">${b.name}</div><span class="en-meta">左右スワイプでボード切替</span></div>
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
        <div class="en-between">
          <span>🌐 ファン公開（👀外からの見え方）</span>
          <button class="en-act-btn ${lab.fanPublic?'primary':''}" onclick="toggleLabFanPublic('${lab.id}')">${lab.fanPublic ? '公開 ON' : '非公開 OFF'}</button>
        </div>
        <div class="en-between">
          <span>🔗 元ネタつぶやきへワープ</span>
          <button class="en-act-btn" onclick="document.getElementById('en-room-modal').classList.remove('open');enViewState.enSubTab='tweet';renderEnFeed();enGoTab('feed');">元ネタへ移動 ➔</button>
        </div>
      </div>
      <div class="card en-card">
        <div class="en-title">👥 参加メンバー（名刺ロック解除済）</div>
        <div class="en-formula">
          <div><strong>山田農園（山田 健一）</strong>｜📞 072-841-xxxx（一次産業）</div>
          <div><strong>カワチ乾燥加工所（田中 誠）</strong>｜📞 06-6789-xxxx（食品加工）</div>
          <div><strong>アトリエ木漏れ日（佐藤 美咲）</strong>｜📞 06-6201-xxxx（デザイン）</div>
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
    ${(!fanMode && rt === 'talk') ? `
      <div class="en-room-composer">
        <input id="enRoomInput" class="en-room-input" type="text" placeholder="トークを送信...">
        <button id="enRoomSend" class="en-act-btn primary">送信</button>
      </div>
    ` : ''}
    ${!fanMode ? `
      <div class="en-room-nav">
        ${[['talk','talk','💬','トーク'],['progress','progress','✅','進行'],['board','board','📋','ボード'],['detail','detail','⚙️','詳細']].map(([k,ic,em,lb]) => `
          <button class="en-room-tab ${rt===k?'active':''}" data-rtab="${k}">${enIconTag(ic,em)}<span>${lb}</span></button>
        `).join('')}
      </div>
    ` : ''}
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
    bCanvas.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - bx;
      if (Math.abs(dx) > 45) {
        enViewState.boardIdx = (enViewState.boardIdx + (dx < 0 ? 1 : enViewState.roomBoards.length - 1)) % enViewState.roomBoards.length;
        renderEnRoomModal();
      }
    }, { passive: true });
  }
  const bAdd = document.getElementById('enBoardAddBtn');
  if (bAdd) bAdd.onclick = () => {
    const v = document.getElementById('enBoardAddInput').value.trim();
    if (!v) return;
    enViewState.roomBoards[enViewState.boardIdx].items.push(v);
    enToast('📋 ボードに追加しました！');
    renderEnRoomModal();
  };

  const sendBtn = document.getElementById('enRoomSend');
  if (sendBtn) {
    const send = () => {
      const v = document.getElementById('enRoomInput').value.trim();
      if (!v) return;
      enViewState.roomMessages.push({ sender: 'あなた', me: true, text: v });
      renderEnRoomModal();
      const body = document.getElementById('enRoomBody');
      if (body) body.scrollTop = body.scrollHeight;
    };
    sendBtn.onclick = send;
    document.getElementById('enRoomInput').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  }
  enSyncTheme();
}

window.castRoomVote = (choice) => {
  if (enViewState.voteChoice) enViewState.voteCounts[enViewState.voteChoice]--;
  enViewState.voteChoice = choice;
  enViewState.voteCounts[choice]++;
  enToast(`🗳️ 案${choice}に投票しました！`);
  renderEnRoomModal();
};
window.toggleRoomTask = (i) => { enViewState.roomTasks[i].done = !enViewState.roomTasks[i].done; renderEnRoomModal(); };
window.toggleLabFanPublic = (id) => { const l = enViewState.labs.find(x => x.id === id); if (l) { l.fanPublic = !l.fanPublic; enToast(`🌐 ファン公開を ${l.fanPublic?'ON':'OFF'} にしました`); renderEnLab(); renderEnRoomModal(); } };
window.sendMsgToBoard = (text) => { enViewState.roomBoards[0].items.unshift(text); closeEnSheet(); enToast('📌 公開ストーリー（ボード）に転送しました！'); };
window.sendMsgToTask = (text) => { enViewState.roomTasks.unshift({ id: 't'+Date.now(), text, done: false }); closeEnSheet(); enToast('✅ 進行タブのやることリストに追加しました！'); };

// =========================================================
// 4. 🥬 役立ち（毎晩分析 ＋ 記事内50:50ギア紹介 ＋ タネ化）
// =========================================================
function renderEnTips() {
  const sec = document.getElementById('view-tips');
  if (!sec) return;
  const hero = EN_MOCK_NEWS[0];
  const rest = EN_MOCK_NEWS.slice(1);

  sec.innerHTML = `
    <div class="en-wrap">
      <div class="en-sec-head">
        <h2 class="en-sec-h2">${enIconTag('news','🥬')} 役立ち・毎晩分析</h2>
        <span class="en-sec-sub">毎日23:00 自動更新</span>
      </div>

      <div class="en-hero-card" data-opennews="0">
        <img src="${hero.photo}" alt="">
        <div class="en-hero-overlay">
          <span class="en-hero-tag">${hero.date}</span>
          <div class="en-hero-title">${hero.title}</div>
          <div class="en-hero-meta"><span>タップで全文＆記事内50:50ギアを見る</span><strong>➔</strong></div>
        </div>
      </div>

      ${rest.map((n, i) => `
        <div class="card en-card">
          <div class="en-card-img-wrap" style="cursor:pointer;" data-opennews="${i+1}">
            <img class="en-card-img" src="${n.photo}" alt="">
            <span class="en-img-chip">${n.date}</span>
          </div>
          <div class="en-title">${n.title}</div>
          <p class="en-text">${n.summary}</p>
          <div class="en-actions">
            <button class="en-act-btn primary" style="width:100%;justify-content:center;" data-seed="${n.title}">
              ${enIconTag('seed','🌱')} <span class="en-btn-label">このネタをタネにする</span>
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  sec.querySelectorAll('[data-opennews]').forEach(el => el.onclick = () => {
    const n = EN_MOCK_NEWS[Number(el.getAttribute('data-opennews'))];
    openEnSheetHtml(n.title, n.date, `
      <p class="en-text">${n.summary}</p>
      <div class="en-formula">
        <strong>🔪 記事内で紹介された50:50厳選ギア</strong>
        <div>業務用クラスの家庭用真空シーラー（¥6,980 / 利益50:50還元）</div>
        <button class="en-act-btn" style="align-self:flex-start;" onclick="closeEnSheet();enGoTab('shop');">マルシェのギア棚を見る ➔</button>
      </div>
      <button class="en-act-btn primary" style="justify-content:center;" onclick="closeEnSheet();openSeedSheet('${n.title.replace(/'/g,'')}','役立ちニュース')">🌱 このネタをタネにする</button>
    `);
  });
  sec.querySelectorAll('[data-seed]').forEach(b => b.onclick = () => openSeedSheet(b.getAttribute('data-seed'), '役立ちレシピ'));
  enSyncTheme();
}

// =========================================================
// 5. 🎪 マルシェ（巣立ち商品 ＋ 50:50ギア棚 ＋ 関西イベント）
// =========================================================
function renderEnShop() {
  const sec = document.getElementById('view-shop');
  if (!sec) return;
  const f = enViewState.marcheFilter;
  const prod = EN_MOCK_MARCHE.filter(m => m.type === 'product');
  const gears = EN_MOCK_MARCHE.filter(m => m.type === 'gear');

  sec.innerHTML = `
    <div class="en-wrap">
      <div class="en-sec-head">
        <h2 class="en-sec-h2">${enIconTag('marche','🎪')} EN•マルシェ</h2>
        <span class="en-sec-sub">巣立ち商品・厳選ギア・関西日程</span>
      </div>
      <div class="en-subtabs">
        ${[['all','すべて'],['product','🎉 巣立ち'],['gear','🔪 50:50ギア'],['event','📅 関西日程']].map(([k,l]) =>
          `<button class="en-subtab ${f===k?'active':''}" data-mf="${k}">${l}</button>`
        ).join('')}
      </div>
      ${(f === 'all' || f === 'product') ? `
        <div class="en-sec-head"><h3 class="en-sec-h2" style="font-size:14px;">🎉 ラボから巣立った新商品</h3><span class="en-sec-sub">先行早割受付中</span></div>
        ${prod.map(p => `
          <div class="en-hero-card" onclick="enToast('🎉 ${p.title} の予約早割をカートに追加しました！')">
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
              <div class="en-card-img-wrap">
                <img class="en-gear-img" src="${idx===0 ? g.photo : EN_IMAGES.package}" alt="">
                <span class="en-img-chip" style="font-size:9.5px;padding:2.5px 7px;">プロ推薦</span>
              </div>
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
  enSyncTheme();
}

// =========================================================
// ➕ 右下FAB（実際に投稿・1人ラボ作成ができるシート起動）
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
    id: 'tw-' + Date.now(), category: cat, author: 'あなた（マイアカウント）', role: enViewState.userMode === 'buyer' ? '買い手・応援' : 'つくり手',
    area: '寝屋川市', iconType: 'farm', avatar: EN_IMAGES.userFarm, time: 'たった今', text, photo: '', likes: 0, comments: 0
  });
  closeEnSheet();
  enViewState.enSubTab = 'tweet';
  enViewState.tweetCat = 'all';
  renderEnFeed();
  enGoTab('feed');
  enToast('✨ つぶやきを投稿しました！');
};

function openCreateSoloLabSheet() {
  openEnSheetHtml('🧪 1人準備中ラボを作成', 'まずは非公開でタネを温めよう', `
    <input id="enNewLabTitle" class="en-input-field" type="text" placeholder="ラボ名（例：寝屋川産・無添加いちごチップス）">
    <textarea id="enNewLabSeed" class="en-input-field" rows="2" placeholder="今のタネ・作りたいイメージ"></textarea>
    <button class="en-act-btn primary" style="justify-content:center;" onclick="submitNewSoloLab()">1人ラボを立ち上げる</button>
  `);
}

window.submitNewSoloLab = () => {
  const title = document.getElementById('enNewLabTitle').value.trim();
  const seed = document.getElementById('enNewLabSeed').value.trim() || 'これから詳細を詰める予定';
  if (!title) return enToast('⚠️ ラボ名を入力してください');
  enViewState.labs.unshift({
    id: 'lab-solo-' + Date.now(), mode: 'my_solo', fanPublic: false, title,
    photo: EN_IMAGES.jam, sourceTweetId: null, updatedAt: 'たった今作成',
    summary: { seed, needed: 'パートナー検討中' }
  });
  closeEnSheet();
  enViewState.labSubTab = 'my';
  enViewState.myLabMode = 'my_solo';
  renderEnLab();
  enGoTab('en');
  enToast('🧪 1人準備中ラボを立ち上げました！');
};

function updateActionFab() {
  let fab = document.getElementById('en-action-fab');
  if (!fab) { fab = document.createElement('button'); fab.id = 'en-action-fab'; document.body.appendChild(fab); }
  const map = {
    home: { label: 'クイック作成', fn: () => openEnSheetHtml('＋ クイック作成', 'やりたいことを選んでください', `
      <button class="en-sheet-item" onclick="openCreateTweetSheet()"><span>💬 つぶやき・🙋ほしいを投稿</span><span>➔</span></button>
      <button class="en-sheet-item" onclick="openCreateSoloLabSheet()"><span>🧪 1人準備中ラボを立ち上げる</span><span>➔</span></button>
    `)},
    feed: { label: 'つぶやく', fn: openCreateTweetSheet },
    en:   { label: '1人ラボ作成', fn: openCreateSoloLabSheet },
    tips: { label: 'ギア推薦', fn: () => openEnSheetHtml('🔪 50:50 厳選ギア推薦', 'おすすめ商品を紹介して利益50:50還元', `
      <input class="en-input-field" placeholder="商品名・Amazon URL"><button class="en-act-btn primary" style="justify-content:center;" onclick="closeEnSheet();enToast('🔪 厳選ギア推薦を受け付けました！')">推薦する</button>
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

// 初期化
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    enViewState.tweets = [...EN_MOCK_TWEETS];
    enViewState.labs   = [...EN_MOCK_LABS];
    mountHeaderQuickIcons();
    renderEnHome(); renderEnFeed(); renderEnLab(); renderEnTips(); renderEnShop();
    updateActionFab();

    document.querySelectorAll('#bottomNav [data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        enViewState.activeMainTab = btn.getAttribute('data-tab');
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