/* ============================================================
   EN•joy v6.0 — 統合アプリ本体 (app.js)
   ============================================================ */

(function () {
  'use strict';

  const TAB_TITLES = {
    useful: '🥬 役立ち',
    plaza: '💬 広場',
    en: '🤝 EN 出会い',
    shop: '🛍️ 通販',
    home: '🏠 ホーム'
  };

  let state = loadState();
  let currentTab = 'home';
  let activeDevTab = 'chat';
  let isInsideRoom = false; // false: ルーム一覧 / true: ルームの中
  let selectedMonth = new Date().getMonth() + 1;
  let pendingFeedImg = null;
  let currentShortIdx = 0;
  let diagStep = -1;
  let diagScores = { spark: 0, craft: 0, bridge: 0, cheer: 0 };
  let generatedPlan = null;

  /* ---------- 状態管理 ---------- */
  function loadState() {
    try {
      const raw = localStorage.getItem(window.ENJOY_V6_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.rooms) return parsed;
      }
    } catch (e) {}
    return window.createDefaultV6State();
  }

  function saveState() {
    try {
      localStorage.setItem(window.ENJOY_V6_KEY, JSON.stringify(state));
    } catch (e) {
      toast('保存容量がいっぱいです。不要な写真を削除してください。');
    }
  }

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function nowShort() {
    const d = new Date();
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  let toastTimer = null;
  function toast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
  }

  function getActiveRoom() {
    return state.rooms.find(r => r.id === state.activeRoomId) || state.rooms[0];
  }

  function getActiveProduct() {
    const r = getActiveRoom();
    if (!r) return null;
    return r.products.find(p => p.id === state.activeProductId) || r.products[0];
  }

  function getAllProducts() {
    const list = [];
    state.rooms.forEach(room => {
      room.products.forEach(prod => list.push({ room, prod }));
    });
    return list;
  }

  function calcMatCost(prod) {
    return (prod.adoptedMaterialIds || []).reduce((sum, id) => {
      const m = window.ENJOY_MATERIALS.find(x => x.id === id);
      return sum + (m ? m.unitPrice : 0);
    }, 0);
  }

  function resizeImage(file, maxW, cb) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        cb(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------- ナビ・UIモード・モーダル ---------- */
  function applyUiMode() {
    document.body.classList.toggle('ui-simple', state.uiMode === 'simple');
    const pcBtn = document.getElementById('btn-ui-mode-pc');
    if (pcBtn) pcBtn.textContent = state.uiMode === 'simple' ? '🔰 かんたん（切替）' : '⚡ モダン（切替）';
    const focusBtn = document.getElementById('btn-focus-pc');
    if (focusBtn) {
      focusBtn.textContent = `🚜 集中モード：${state.focusMode ? 'ON' : 'OFF'}`;
      focusBtn.classList.toggle('active', !!state.focusMode);
    }
  }

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
    document.querySelectorAll('.nav-item, .dock-item').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    const t = document.getElementById('page-title');
    if (t) t.textContent = TAB_TITLES[tab] || 'EN•joy';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function switchSeg(group, seg) {
    document.querySelectorAll(`[data-seg-group="${group}"]`).forEach(b => b.classList.toggle('active', b.dataset.seg === seg));
    document.querySelectorAll(`#tab-${group} .seg-panel`).forEach(p => p.classList.toggle('active', p.id === `${group}-${seg}`));
  }

  function switchDevTab(tab) {
    activeDevTab = tab;
    document.querySelectorAll('[data-dev-tab]').forEach(b => b.classList.toggle('active', b.dataset.devTab === tab));
    document.querySelectorAll('.dev-pane').forEach(p => p.classList.toggle('active', p.id === `dev-pane-${tab}`));
  }

  function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === 'modal-chat') renderChatModal();
    el.classList.remove('hidden');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  }

  /* ---------- 全体描画 ---------- */
  function renderAll() {
    applyUiMode();
    renderBadges();
    renderUseful();
    renderPlaza();
    renderEn();
    renderShop();
    renderHome();
  }

  function renderBadges() {
    const unread = state.inbox.filter(m => m.unread).length;
    document.getElementById('badge-chat').textContent = unread;
    ['badge-home-pc', 'badge-home-mobile'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', unread === 0);
    });
  }

  /* ============================================================
     1. 左端：🥬 役立ち（旬・レシピ / 1週間献立 / 資材・協賛）
     ============================================================ */
  function renderUseful() {
    // 1-1: 旬＆レシピ
    const inSeason = window.ENJOY_SHUN.filter(s => s.months.includes(selectedMonth));
    document.getElementById('useful-shun').innerHTML = `
      <div class="card">
        <div class="card-head">
          <h2>🥬 ${selectedMonth}月の旬・見分け方</h2>
          <div class="chip-scroll">
            ${[1,2,3,4,5,6,7,8,9,10,11,12].map(m => `
              <button type="button" class="chip-btn ${m === selectedMonth ? 'active-accent' : ''}" data-month="${m}">${m}月</button>
            `).join('')}
          </div>
        </div>
        <div class="card-grid-2">
          ${inSeason.map(s => `
            <div class="card" style="background:var(--surface-sub);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <strong>${s.icon} ${esc(s.name)}</strong>
                <span class="tag">${s.nutrients.join('・')}</span>
              </div>
              <p class="muted-text"><strong>見分け方：</strong>${esc(s.tip)}</p>
              <p class="muted-text" style="margin-top:4px;"><strong>保存：</strong>${esc(s.save)}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <h2>🍳 大量消費レシピ ＆ 簡易PFC分析</h2>
        </div>
        <form id="form-recipe" class="stack-form" style="margin-bottom:12px;">
          <div class="form-row-2">
            <input type="text" id="rec-title" class="input" placeholder="レシピ名" required />
            <input type="text" id="rec-ing" class="input" placeholder="材料（例：白菜、豚肉、みそ）" required />
          </div>
          <div class="form-actions-right">
            <button type="submit" class="btn btn-accent btn-sm">レシピ追加</button>
          </div>
        </form>
        <div class="card-grid-2">
          ${state.recipes.map(r => {
            const hasP = /豚|鶏|卵|豆腐|魚/.test(r.ingredients);
            const pW = hasP ? 35 : 15, fW = hasP ? 25 : 15, cW = 100 - pW - fW;
            return `
              <div class="card" style="background:var(--surface-sub);">
                <span class="tag-accent">${esc(r.tag)}</span>
                <strong style="display:block; margin:4px 0;">${esc(r.title)}</strong>
                <p class="muted-text">材料：${esc(r.ingredients)}</p>
                <p style="font-size:0.82rem; margin:4px 0;">${esc(r.steps)}</p>
                <div class="pfc-strip" title="P/F/Cバランス">
                  <div class="pfc-p" style="width:${pW}%;"></div>
                  <div class="pfc-f" style="width:${fW}%;"></div>
                  <div class="pfc-c" style="width:${cW}%;"></div>
                </div>
                <span class="muted-text">${hasP ? 'バランス◎' : '＋タンパク質（豆腐・卵など）を足すと◎'}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // 1-2: 1週間献立
    document.getElementById('useful-plan').innerHTML = `
      <div class="card">
        <div class="card-head">
          <h2>📅 旬めし 1週間献立コンシェルジュ</h2>
          <span class="tag-dark">箱買い使い切り</span>
        </div>
        <div class="form-row-2" style="margin-bottom:10px;">
          <select id="plan-item" class="input">
            <option value="白菜＆大根">🥬 白菜＆大根</option>
            <option value="りんご＆みかん">🍎 りんご＆みかん</option>
          </select>
          <button type="button" id="btn-gen-plan" class="btn btn-accent">1週間献立を作成</button>
        </div>
        ${generatedPlan ? `
          <div class="stack-list">
            ${generatedPlan.map(d => `
              <div class="chat-item"><strong>${d.day}</strong>：${esc(d.menu)} <span class="muted-text">(${esc(d.note)})</span></div>
            `).join('')}
          </div>
        ` : '<p class="muted-text">使い切りたい旬の食材を選んでボタンを押してください。</p>'}
      </div>
    `;

    // 1-3: 資材・協賛
    const activeProd = getActiveProduct();
    document.getElementById('useful-tools').innerHTML = `
      <div class="card">
        <div class="card-head">
          <h2>🛠️ 開発資材（採用すると原価に自動加算）</h2>
        </div>
        <div class="card-grid-2">
          ${window.ENJOY_MATERIALS.map(m => {
            const adopted = activeProd && (activeProd.adoptedMaterialIds || []).includes(m.id);
            return `
              <div class="card" style="background:var(--surface-sub);">
                <strong>${esc(m.name)}</strong>
                <p class="muted-text" style="margin:4px 0;">単価目安：¥${m.unitPrice}/個</p>
                <div class="btn-row">
                  <button type="button" class="btn ${adopted ? 'btn-dark' : 'btn-accent'} btn-sm" data-adopt-mat="${esc(m.id)}">
                    ${adopted ? '採用中' : '開発室で採用'}
                  </button>
                  <a href="${m.rakuten}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">楽天 ↗</a>
                  <a href="${m.amazon}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">Amazon ↗</a>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>🏢 協賛テストキッチン・試供品枠</h2></div>
        <div class="card-grid-2">
          ${window.ENJOY_SPONSORS.map(sp => `
            <div class="card" style="background:var(--surface-sub);">
              <span class="tag">${esc(sp.area)}</span>
              <strong style="display:block; margin:4px 0;">${esc(sp.name)}</strong>
              <p class="muted-text" style="margin-bottom:8px;">${esc(sp.offer)}</p>
              <button type="button" class="btn btn-outline btn-sm" data-apply-sp="${esc(sp.id)}">協賛枠を申請</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* ============================================================
     2. 左2：💬 広場（画像付きつぶやき / 15秒動画）
     ============================================================ */
  function renderPlaza() {
    const q = (document.getElementById('feed-search').value || '').toLowerCase();
    const list = state.feeds.filter(f => !q || `${f.author} ${f.area} ${f.text} ${f.tag}`.toLowerCase().includes(q));

    document.getElementById('feed-list').innerHTML = list.map(f => `
      <article class="feed-card">
        <div class="feed-meta">
          <span class="tag-accent">${esc(f.tag)}</span>
          <strong>${esc(f.author)}</strong>
          <span>${esc(f.area)}</span>
          <span>・${esc(f.createdAt)}</span>
        </div>
        ${f.image ? `<img class="feed-card-img" src="${f.image}" alt="投稿写真" />` : ''}
        <p style="font-size:0.9rem;">${esc(f.text)}</p>
        <div class="btn-row">
          <button type="button" class="btn btn-outline btn-sm" data-like-feed="${esc(f.id)}">♥ ${f.likes}</button>
          <button type="button" class="btn btn-ghost btn-sm" data-start-room="${esc(f.author)}|${esc(f.text.slice(0, 14))}">🤝 話してみる</button>
        </div>
      </article>
    `).join('');

    // 15秒動画
    const v = state.shorts[currentShortIdx % state.shorts.length];
    document.getElementById('plaza-shorts').innerHTML = `
      <div class="card" style="background:var(--ink); color:#FFF;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span class="tag-accent">${esc(v.tag)}</span>
          <span style="font-size:0.78rem;">${currentShortIdx + 1} / ${state.shorts.length}</span>
        </div>
        <h2 style="font-size:1.1rem; margin-bottom:6px;">▶️ ${esc(v.title)}</h2>
        <p style="font-size:0.82rem; color:#CCC; margin-bottom:14px;">${esc(v.author)}</p>
        <div class="btn-row">
          <a href="${esc(v.url)}" target="_blank" rel="noopener" class="btn btn-accent btn-sm">動画を再生 ↗</a>
          <button type="button" id="btn-short-like" class="btn btn-outline btn-sm">♥ ${v.likes}</button>
          <button type="button" id="btn-short-next" class="btn btn-outline btn-sm">次の動画 ⬇</button>
        </div>
      </div>
    `;
  }

  /* ============================================================
     3. 真ん中：🤝 EN 出会い（やりたいこと募集 / 人 / マップ）
     ============================================================ */
  function renderEn() {
    // やりたいこと募集カード
    document.getElementById('en-ideas-list').innerHTML = state.ideas.map(idea => `
      <article class="card">
        <div class="feed-meta" style="margin-bottom:6px;">
          <span class="tag-accent">${esc(idea.cat)}</span>
          <span class="tag">募集：${esc(idea.need)}</span>
        </div>
        <h3 style="font-size:0.98rem; margin-bottom:6px;">${esc(idea.title)}</h3>
        <p class="muted-text" style="margin-bottom:8px;">${esc(idea.detail)}</p>
        <div class="feed-meta" style="margin-bottom:10px;">
          <strong>${esc(idea.author)}</strong>（${esc(idea.area)}）
        </div>
        <div class="btn-row">
          <button type="button" class="btn btn-accent btn-sm" data-start-room="${esc(idea.author)}|${esc(idea.title.slice(0, 14))}">🤝 一緒に開発ルームを作る</button>
          <button type="button" class="btn btn-outline btn-sm" data-like-idea="${esc(idea.id)}">気になる (${idea.likes})</button>
        </div>
      </article>
    `).join('');

    // おすすめの人
    const sorted = [...state.people].sort((a, b) => b.heat - a.heat);
    document.getElementById('en-people').innerHTML = `
      <div class="card-grid-3">
        ${sorted.map(p => `
          <article class="card">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <strong>${esc(p.name)}</strong>
              <span class="tag-accent">熱量 ${p.heat}%</span>
            </div>
            <p class="muted-text">${esc(p.role)} ／ ${esc(p.area)}</p>
            <p style="font-size:0.84rem; margin:6px 0 10px;">${esc(p.skills)}</p>
            <button type="button" class="btn btn-outline btn-sm" data-start-room="${esc(p.name)}|コラボ相談">🤝 ご縁を結ぶ</button>
          </article>
        `).join('')}
      </div>
    `;

    // ご縁マップ
    const stampedCnt = state.spots.filter(s => s.stamped).length;
    document.getElementById('en-map').innerHTML = `
      <div class="card">
        <div class="card-head">
          <h2>🗺️ ご縁めぐりマップ</h2>
          <span class="tag-dark">スタンプ ${stampedCnt} / ${state.spots.length}</span>
        </div>
        <div class="map-board">
          ${state.spots.map(s => `
            <button type="button" class="map-pin ${s.stamped ? 'stamped' : ''}" style="left:${s.x}%; top:${s.y}%;" data-stamp-spot="${esc(s.id)}" title="${esc(s.name)}">
              ${s.icon}
            </button>
          `).join('')}
        </div>
        <div class="card-grid-3">
          ${state.spots.map(s => `
            <div class="card" style="background:var(--surface-sub);">
              <div style="display:flex; justify-content:space-between;">
                <strong>${s.icon} ${esc(s.name)}</strong>
                ${s.stamped ? '<span class="tag-accent">済</span>' : ''}
              </div>
              <p class="muted-text" style="margin:4px 0;">${esc(s.memo)}</p>
              <div class="btn-row">
                <button type="button" class="btn btn-outline btn-sm" data-stamp-spot="${esc(s.id)}">${s.stamped ? 'スタンプ済' : '訪問スタンプ'}</button>
                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.area)}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">経路 ↗</a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* ============================================================
     4. 右2：🛍️ 通販（開発中・早割 / EC / 買い物帳）
     ============================================================ */
  function renderShop() {
    const all = getAllProducts();
    const wip = all.filter(({ prod }) => prod.phase !== '販売中');
    const ec = all.filter(({ prod }) => prod.phase === '販売中');

    // 開発中・早割
    document.getElementById('shop-wip').innerHTML = `
      <div class="card" style="background:var(--accent-soft); border-color:var(--accent);">
        <strong>👑 ご縁株主優待：保有 ${state.myShares}株</strong>
        <span class="muted-text">（5株以上で試食モニター優先・10株で古民家EC 10%OFF）</span>
      </div>
      <div class="card-grid-2">
        ${wip.map(({ room, prod }) => `
          <article class="card">
            <div class="feed-meta" style="margin-bottom:4px;">
              <span class="tag-accent">${esc(prod.phase)}</span>
              <span>${esc(room.name)}</span>
            </div>
            <h3>${esc(prod.title)}</h3>
            <p style="margin:6px 0;"><strong>早割 ¥${prod.earlyPrice}</strong> <span class="muted-text">（通常 ¥${prod.priceSell}）</span></p>
            <div class="bar-track" style="margin-bottom:8px;">
              <div class="bar-fill" style="width:${Math.min(100, Math.round((prod.ticketsBought / prod.ticketsLimit) * 100))}%;"></div>
            </div>
            <div class="btn-row">
              <button type="button" class="btn btn-accent btn-sm" data-buy-tkt="${esc(prod.id)}">🎟️ 早割予約 (+2株)</button>
              <button type="button" class="btn btn-outline btn-sm" data-fav-prod="${esc(prod.id)}">
                ${state.shoppingBook.favorites.includes(prod.id) ? '♥ お気に入り済' : '♡ 保存'}
              </button>
            </div>
          </article>
        `).join('')}
      </div>
    `;

    // EN•dress EC
    document.getElementById('shop-ec').innerHTML = `
      <div class="card-grid-3">
        ${ec.length ? ec.map(({ room, prod }) => `
          <article class="card">
            <span class="tag-dark">EN•dress 販売中</span>
            <h3 style="margin:6px 0 4px;">${esc(prod.title)}</h3>
            <p class="muted-text">${esc(room.name)}</p>
            <p style="font-size:1.1rem; font-weight:900; margin:8px 0;">¥${prod.priceSell}</p>
            <div class="btn-row">
              <button type="button" class="btn btn-dark btn-sm" data-buy-ec="${esc(prod.title)}">購入する（デモ）</button>
              <button type="button" class="btn btn-outline btn-sm" data-fav-prod="${esc(prod.id)}">♡</button>
            </div>
          </article>
        `).join('') : '<div class="card">販売中の商品はまだありません。</div>'}
      </div>
    `;

    // 買い物帳
    const favProds = all.filter(({ prod }) => state.shoppingBook.favorites.includes(prod.id));
    document.getElementById('shop-book').innerHTML = `
      <div class="card">
        <div class="card-head"><h2>❤️ お気に入り</h2></div>
        <div class="stack-list">
          ${favProds.length ? favProds.map(({ prod }) => `
            <div class="chat-item" style="display:flex; justify-content:space-between;">
              <strong>${esc(prod.title)}（¥${prod.priceSell}）</strong>
              <button type="button" class="btn btn-ghost btn-sm" data-fav-prod="${esc(prod.id)}">解除</button>
            </div>
          `).join('') : '<p class="muted-text">お気に入りはまだありません。</p>'}
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h2>🛍️ 購入・リピートメモ</h2></div>
        <div class="stack-list">
          ${state.shoppingBook.purchases.map(p => `
            <div class="chat-item">
              <strong>${'★'.repeat(p.rating)} ${esc(p.title)}</strong> <span class="muted-text">(${esc(p.date)})</span>
              <p class="muted-text">${esc(p.memo)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* ============================================================
     5. 右端：🏠 ホーム（最上段：開発ルーム4ミニタブ ／ 下段：個人）
     ============================================================ */
  /* ---------- 要更新チェック（色を変えて目立たせる判定） ---------- */
  function getProductAlerts(prod) {
    const alerts = [];
    if (!prod.images || prod.images.length === 0) alerts.push({ tab: 'media', label: '📸 写真未登録' });
    if (!prod.calendar || prod.calendar.length === 0) alerts.push({ tab: 'plan', label: '📅 予定未設定' });
    if (!prod.priceSell || prod.priceSell <= 0) alerts.push({ tab: 'cost', label: '🧮 売価未設定' });
    const lastChat = (prod.chats || [])[prod.chats.length - 1];
    if (lastChat && lastChat.author !== state.profile.name && lastChat.author !== 'あなた') {
      alerts.push({ tab: 'chat', label: '💬 返信待ち' });
    }
    return alerts;
  }

  /* ============================================================
     5. 右端：🏠 ホーム（一覧 ⇄ ルームの中へ入る2段階設計）
     ============================================================ */
  function renderHome() {
    const listView = document.getElementById('home-list-view');
    const roomView = document.getElementById('home-room-view');
    if (listView && roomView) {
      listView.classList.toggle('hidden', isInsideRoom);
      roomView.classList.toggle('hidden', !isInsideRoom);
    }

    // 【画面A】ルーム一覧カード描画
    const cardsEl = document.getElementById('home-room-cards');
    if (cardsEl) {
      cardsEl.innerHTML = state.rooms.map(r => {
        const mainProd = r.products[0];
        const allAlerts = [];
        r.products.forEach(p => allAlerts.push(...getProductAlerts(p)));
        const needsAction = allAlerts.length > 0;
        const uniqueLabels = [...new Set(allAlerts.map(a => a.label))].slice(0, 2);

        return `
          <article class="room-entry-card ${needsAction ? 'needs-action' : ''}" data-enter-room="${esc(r.id)}">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
              <span class="tag-dark">${esc(mainProd ? mainProd.phase : '企画中')}</span>
              <span class="muted-text">商品 ${r.products.length}件</span>
            </div>
            <div>
              <h3 style="font-size:1rem; margin-bottom:2px;">${esc(r.name)}</h3>
              <p class="muted-text">${esc(mainProd ? mainProd.title : '')}</p>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-top:auto;">
              <div class="btn-row">
                ${needsAction
                  ? uniqueLabels.map(l => `<span class="action-pill">${l}</span>`).join('')
                  : '<span class="tag">✅ 最新</span>'}
              </div>
              <span style="font-size:0.8rem; font-weight:800; color:var(--accent);">入る →</span>
            </div>
          </article>
        `;
      }).join('');
    }

    // 【画面B】ルームの中（コックピット）
    const room = getActiveRoom();
    const prod = getActiveProduct();
    if (room && prod) {
      document.getElementById('dev-room-name').textContent = room.name;
      document.getElementById('dev-prod-title').textContent = prod.title;
      document.getElementById('dev-phase-select').value = prod.phase;

      // 商品スイッチャー
      document.getElementById('dev-prod-tabs').innerHTML = room.products.map(p => {
        const hasAlert = getProductAlerts(p).length > 0;
        return `
          <button type="button" class="chip-btn ${p.id === prod.id ? 'active-accent' : ''}" data-sel-prod="${esc(p.id)}">
            ${esc(p.title)}${hasAlert ? ' ●' : ''}
          </button>
        `;
      }).join('');

      // 4ミニタブの要更新ドット制御
      const alerts = getProductAlerts(prod);
      ['chat', 'media', 'cost', 'plan'].forEach(t => {
        const dot = document.getElementById(`dot-dev-${t}`);
        if (dot) dot.classList.toggle('hidden', !alerts.some(a => a.tab === t));
      });

      // ミニタブ1: LINE風左右吹き出しチャット
      document.getElementById('dev-pane-chat').innerHTML = `
        <div class="line-chat-stream">
          ${(prod.chats || []).length ? prod.chats.map(c => {
            const isMe = c.author === state.profile.name || c.author === 'あなた';
            return `
              <div class="bubble-row ${isMe ? 'is-me' : 'is-other'} ${c.isPrivate ? 'is-priv' : ''}">
                <div class="bubble-meta">
                  <span>${esc(c.author)} ・ ${esc(c.date)}</span>
                  <button type="button" style="border:none;background:none;padding:0;cursor:pointer;font-size:0.7rem;color:var(--ink-sub);" data-toggle-priv="${esc(c.id)}">
                    ${c.isPrivate ? '🔒限定' : '🌐公開'}
                  </button>
                </div>
                <div class="bubble-body">${esc(c.text)}</div>
              </div>
            `;
          }).join('') : '<p class="muted-text" style="text-align:center; padding:20px 0;">まだメッセージはありません。最初のひとことを送りましょう！</p>'}
        </div>
        <form id="form-dev-chat" class="stack-form">
          <div style="display:flex; gap:6px;">
            <input type="text" id="dev-chat-input" class="input" placeholder="メッセージ（例：12/6 試作2回目やります）" required />
            <button type="submit" class="btn btn-accent btn-sm">送信</button>
          </div>
          <label style="font-size:0.76rem; color:var(--ink-sub);">
            <input type="checkbox" id="dev-chat-priv" /> 🔒 メンバー限定メモにする
          </label>
        </form>
      `;

      // ミニタブ2: 試作・写真
      document.getElementById('dev-pane-media').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="muted-text">${(prod.images || []).length ? `登録済み ${prod.images.length}/6枚` : '⚠️ まだ写真がありません（追加すると通販棚に映えます）'}</span>
          <label class="btn btn-accent btn-sm file-label">
            ＋ 写真を追加
            <input type="file" id="dev-img-input" accept="image/*" hidden />
          </label>
        </div>
        <div class="photo-strip">
          ${(prod.images || []).map((src, i) => `
            <div class="photo-cell">
              <img src="${src}" alt="試作写真" />
              <button type="button" class="img-preview-del" data-del-dev-img="${i}">✕</button>
            </div>
          `).join('')}
        </div>
      `;

      // ミニタブ3: グラフ風・原価＆粗利バー
      const matCost = calcMatCost(prod);
      const totalCost = Number(prod.costRaw) + Number(prod.costLabor) + matCost;
      const profit = Number(prod.priceSell) - totalCost;
      const rate = prod.priceSell > 0 ? Math.round((profit / prod.priceSell) * 100) : 0;
      const costPct = prod.priceSell > 0 ? Math.min(100, Math.max(0, Math.round((totalCost / prod.priceSell) * 100))) : 100;
      const profPct = Math.max(0, 100 - costPct);

      document.getElementById('dev-pane-cost').innerHTML = `
        <div class="profit-hero">
          <div>
            <span class="muted-text">1個あたりの予定粗利</span>
            <div class="profit-big ${profit < 0 ? 'is-minus' : ''}">¥${profit.toLocaleString()}</div>
          </div>
          <div style="text-align:right;">
            <span class="tag-accent">粗利率 ${rate}%</span>
            <div class="muted-text" style="margin-top:4px;">売価 ¥${Number(prod.priceSell).toLocaleString()} ／ 原価 ¥${totalCost.toLocaleString()}</div>
          </div>
        </div>
        <div class="cost-graph-bar" title="原価 vs 粗利">
          <div class="graph-seg-cost" style="width:${costPct}%;">原価 ${costPct}%</div>
          <div class="graph-seg-profit" style="width:${profPct}%;">粗利 ${profPct}%</div>
        </div>
        <div class="cost-row-4">
          <label class="muted-text">素材費<input type="number" id="c-raw" class="input" value="${prod.costRaw}" /></label>
          <label class="muted-text">加工費<input type="number" id="c-lab" class="input" value="${prod.costLabor}" /></label>
          <label class="muted-text">資材(自動)<input type="number" class="input" value="${matCost}" readonly /></label>
          <label class="muted-text">売価<input type="number" id="c-sell" class="input" value="${prod.priceSell}" /></label>
        </div>
        <div class="btn-row">
          ${(prod.adoptedMaterialIds || []).map(id => {
            const m = window.ENJOY_MATERIALS.find(x => x.id === id);
            return m ? `<span class="tag">${esc(m.name)} (¥${m.unitPrice}) <button type="button" style="border:none;background:none;cursor:pointer;" data-rem-mat="${esc(id)}">✕</button></span>` : '';
          }).join('')}
        </div>
      `;

      // ミニタブ4: 予定・印刷
      document.getElementById('dev-pane-plan').innerHTML = `
        <form id="form-dev-cal" style="display:flex; gap:6px; margin-bottom:10px; flex-wrap:wrap;">
          <input type="date" id="cal-d" class="input input-compact" required />
          <input type="text" id="cal-t" class="input" style="flex:1;" placeholder="予定（例：瓶詰めテスト）" required />
          <button type="submit" class="btn btn-accent btn-sm">追加</button>
        </form>
        <div class="stack-list" style="margin-bottom:12px;">
          ${(prod.calendar || []).map(c => `
            <div class="chat-item" style="display:flex; justify-content:space-between; align-items:center;">
              <span><strong>${esc(c.date)}</strong> ${esc(c.title)}</span>
              <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(c.title)}" target="_blank" rel="noopener" class="muted-text">Google ↗</a>
            </div>
          `).join('') || '<p class="muted-text">⚠️ 予定が未設定です。次の試作日を入れましょう。</p>'}
        </div>
        <div class="btn-row">
          <button type="button" class="btn btn-outline btn-sm" data-print="agreement">📄 簡易同意書</button>
          <button type="button" class="btn btn-outline btn-sm" data-print="pop">🪧 A4店頭POP</button>
          <button type="button" class="btn btn-outline btn-sm" data-print="cards">🪪 8枚名刺</button>
        </div>
      `;
    }

    // 下段：プロフィール・年輪・設定（一覧画面のときだけ表示）
    const diagRes = state.profile.diagType ? window.ENJOY_DIAG_RES[state.profile.diagType] : null;
    let diagHtml = '';
    if (diagStep >= 0) {
      const q = window.ENJOY_DIAG_Q[diagStep];
      diagHtml = `
        <div class="card">
          <div class="card-head"><h3>🔮 ${q.q}</h3><span>${diagStep + 1}/${window.ENJOY_DIAG_Q.length}</span></div>
          <div class="stack-list">
            ${q.opts.map(o => `<button type="button" class="btn btn-outline" style="justify-content:flex-start;" data-diag-ans="${o.type}">${o.label}</button>`).join('')}
          </div>
        </div>
      `;
    } else if (diagRes) {
      diagHtml = `
        <div class="card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <span class="tag-accent">診断結果</span>
            <strong style="margin-left:6px;">${diagRes.icon} ${diagRes.title}</strong>
            <span class="muted-text">（相性◎：${diagRes.match}）</span>
          </div>
          <button type="button" id="btn-start-diag" class="btn btn-outline btn-sm">再診断</button>
        </div>
      `;
    } else {
      diagHtml = `
        <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
          <strong>🔮 30秒ご縁タイプ診断</strong>
          <button type="button" id="btn-start-diag" class="btn btn-accent btn-sm">診断する</button>
        </div>
      `;
    }

    document.getElementById('home-profile').innerHTML = `
      ${diagHtml}
      <form id="form-profile" class="card stack-form">
        <div class="form-row-2">
          <input type="text" id="p-name" class="input" value="${esc(state.profile.name)}" placeholder="名前・屋号" />
          <input type="text" id="p-area" class="input" value="${esc(state.profile.area)}" placeholder="活動エリア" />
        </div>
        <input type="text" id="p-skills" class="input" value="${esc(state.profile.skills)}" placeholder="得意なこと・設備" />
        <textarea id="p-bio" class="input textarea" rows="2">${esc(state.profile.bio)}</textarea>
        <div class="form-actions-right">
          <button type="submit" class="btn btn-dark btn-sm">プロフィール保存</button>
        </div>
      </form>
    `;

    document.getElementById('home-ring').innerHTML = `
      <div class="card">
        <div class="card-head"><h3>✍️ ご縁の年輪ボード（${state.ringEntries.length}組）</h3></div>
        <form id="form-ring" style="display:flex; gap:6px; margin-bottom:10px; flex-wrap:wrap;">
          <input type="text" id="ring-msg" class="input" style="flex:1;" placeholder="応援メッセージ・サインを刻む" required />
          <button type="submit" class="btn btn-accent btn-sm">刻む</button>
        </form>
        <div class="card-grid-3">
          ${state.ringEntries.map(r => `
            <div class="card" style="background:var(--surface-sub);">
              <span class="tag">${esc(r.role)}</span>
              <strong style="display:block; margin:4px 0;">${esc(r.name)}</strong>
              <p class="muted-text">${esc(r.message)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('home-ops').innerHTML = `
      <div class="card">
        <div class="card-head"><h3>⚙️ 表示・バックアップ設定</h3></div>
        <div class="btn-row">
          <button type="button" id="btn-switch-ui" class="btn btn-outline btn-sm">⚡ モダン / 🔰 かんたん切替</button>
          <button type="button" id="btn-export" class="btn btn-outline btn-sm">⬇️ JSON保存</button>
          <button type="button" id="btn-reset" class="btn btn-outline btn-sm">🔄 初期デモに戻す</button>
        </div>
      </div>
    `;
  }

  /* ---------- チャット受信箱モーダル ---------- */
  function renderChatModal() {
    document.getElementById('chat-modal-body').innerHTML = `
      <div class="stack-list">
        ${state.inbox.map(m => `
          <div class="chat-item ${m.unread ? 'is-priv' : ''}">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem;">
              <strong>${esc(m.from)}</strong>
              <span>${esc(m.date)}</span>
            </div>
            <p style="font-size:0.86rem; margin:4px 0;">${esc(m.text)}</p>
            ${m.unread ? `<button type="button" class="btn btn-outline btn-sm" data-read-msg="${esc(m.id)}">既読</button>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  /* ---------- 印刷プレビュー ---------- */
  function openPrint(mode) {
    const room = getActiveRoom();
    const prod = getActiveProduct();
    if (!room || !prod) return;
    const body = document.getElementById('print-body');
    if (mode === 'agreement') {
      document.getElementById('print-title').textContent = '📄 簡易コラボ確認書';
      body.innerHTML = `<h2>EN•joy 簡易コラボ確認書</h2><p>ルーム：${esc(room.name)} ／ 商品：${esc(prod.title)} ／ 売価目安：¥${prod.priceSell}</p><p style="margin-top:16px;">確認サイン：__________________</p>`;
    } else if (mode === 'pop') {
      document.getElementById('print-title').textContent = '🪧 A4店頭POP';
      body.innerHTML = `<div style="text-align:center; border:3px solid #1A1A1A; padding:24px;"><p>EN•joy × EN•dress</p><h1 style="margin:12px 0;">${esc(prod.title)}</h1><p>${esc(room.name)}</p><h2 style="color:#C65D3B; margin-top:14px;">¥${prod.priceSell}</h2></div>`;
    } else {
      document.getElementById('print-title').textContent = '🪪 8枚名刺シート';
      const c = `<div style="border:1px dashed #999; padding:10px;"><strong>${esc(state.profile.name)}</strong><br><span style="font-size:0.78rem;">${esc(state.profile.area)} / EN•joy</span></div>`;
      body.innerHTML = `<div class="form-row-2">${Array(8).fill(c).join('')}</div>`;
    }
    openModal('modal-print');
  }

  /* ---------- イベント委譲 ---------- */
  function bindEvents() {
    document.addEventListener('click', e => {
      const pickUi = e.target.closest('[data-pick-ui]');
      if (pickUi) {
        state.uiMode = pickUi.dataset.pickUi;
        saveState();
        applyUiMode();
        closeModal('modal-ui-select');
        toast(state.uiMode === 'simple' ? '🔰 かんたんモードに設定しました' : '⚡ モダンモードに設定しました');
        return;
      }
      const tabBtn = e.target.closest('[data-tab]');
      if (tabBtn) {
        const nextTab = tabBtn.dataset.tab;
        const isMobileDock = tabBtn.classList.contains('dock-item');
        if (isMobileDock) {
          if (currentTab === nextTab) {
            // 同じ常設タブをもう一度押したら開閉トグル
            document.body.classList.toggle('subnav-open');
          } else {
            // 別の常設タブを押したら切替＋次の選択タブを表示
            switchTab(nextTab);
            document.body.classList.add('subnav-open');
          }
        } else {
          switchTab(nextTab);
        }
        return;
      }

      const segBtn = e.target.closest('[data-seg]');
      if (segBtn) {
        switchSeg(segBtn.dataset.segGroup, segBtn.dataset.seg);
        document.body.classList.remove('subnav-open'); // 選んだら消す
        return;
      }
// ルーム一覧カードをタップ → ルームの中へ入る
      const enterRoom = e.target.closest('[data-enter-room]');
      if (enterRoom) {
        state.activeRoomId = enterRoom.dataset.enterRoom;
        const r = getActiveRoom();
        state.activeProductId = r && r.products[0] ? r.products[0].id : null;
        isInsideRoom = true;
        saveState();
        renderHome();
        window.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }

      // 「← 一覧へ」ボタン → ルーム一覧へ戻る
      if (e.target.closest('#btn-back-home-list')) {
        isInsideRoom = false;
        renderHome();
        window.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }
      
      const devTab = e.target.closest('[data-dev-tab]');
      if (devTab) {
        switchDevTab(devTab.dataset.devTab);
        document.body.classList.remove('subnav-open'); // 選んだら消す
        return;
      }
      const closeBtn = e.target.closest('[data-close-modal]');
      if (closeBtn) { closeModal(closeBtn.dataset.closeModal); return; }

      const mBtn = e.target.closest('[data-month]');
      if (mBtn) { selectedMonth = Number(mBtn.dataset.month); renderUseful(); return; }

      const adoptMat = e.target.closest('[data-adopt-mat]');
      if (adoptMat) {
        const prod = getActiveProduct();
        const id = adoptMat.dataset.adoptMat;
        if (prod && !prod.adoptedMaterialIds.includes(id)) {
          prod.adoptedMaterialIds.push(id);
          saveState(); renderAll(); toast('資材を採用し、原価に加算しました');
        }
        return;
      }

      const remMat = e.target.closest('[data-rem-mat]');
      if (remMat) {
        const prod = getActiveProduct();
        prod.adoptedMaterialIds = prod.adoptedMaterialIds.filter(x => x !== remMat.dataset.remMat);
        saveState(); renderAll(); return;
      }

      const spBtn = e.target.closest('[data-apply-sp]');
      if (spBtn) { toast('🏢 協賛枠へ申請しました！'); return; }

      const likeFeed = e.target.closest('[data-like-feed]');
      if (likeFeed) {
        const f = state.feeds.find(x => x.id === likeFeed.dataset.likeFeed);
        if (f) { f.likes += 1; saveState(); renderPlaza(); }
        return;
      }

      const likeIdea = e.target.closest('[data-like-idea]');
      if (likeIdea) {
        const i = state.ideas.find(x => x.id === likeIdea.dataset.likeIdea);
        if (i) { i.likes += 1; saveState(); renderEn(); }
        return;
      }

      const startRoom = e.target.closest('[data-start-room]');
      if (startRoom) {
        const [partner, title] = startRoom.dataset.startRoom.split('|');
        const rid = 'room-' + Date.now();
        const pid = 'prod-' + Date.now();
        state.rooms.unshift({
          id: rid, name: `${partner} とのご縁`, members: [state.profile.name, partner],
          products: [{
            id: pid, title: title || '新規コラボ案', phase: '企画中',
            priceSell: 550, earlyPrice: 480, ticketsBought: 0, ticketsLimit: 20,
            costRaw: 100, costLabor: 100, adoptedMaterialIds: [], images: [],
            chats: [{ id: 'c-' + Date.now(), author: state.profile.name, text: `${partner}さんとの開発ルームを作成しました！`, date: nowShort(), isPrivate: false }],
            calendar: [], reactions: { cheer: 1, eat: 0 }
          }]
        });
        state.activeRoomId = rid;
        state.activeProductId = pid;
        saveState(); renderAll(); switchTab('home');
        toast(`🤝 ${partner}さんとの開発ルームをホームに作成しました！`);
        return;
      }

      const stampSpot = e.target.closest('[data-stamp-spot]');
      if (stampSpot) {
        const s = state.spots.find(x => x.id === stampSpot.dataset.stampSpot);
        if (s) { s.stamped = !s.stamped; saveState(); renderEn(); }
        return;
      }

      const buyTkt = e.target.closest('[data-buy-tkt]');
      if (buyTkt) {
        const found = getAllProducts().find(({ prod }) => prod.id === buyTkt.dataset.buyTkt);
        if (found) {
          found.prod.ticketsBought += 1;
          state.myShares += 2;
          saveState(); renderShop(); toast('🎟️ 早割予約完了！＋2ご縁株を獲得');
        }
        return;
      }

      const buyEc = e.target.closest('[data-buy-ec]');
      if (buyEc) {
        state.shoppingBook.purchases.unshift({ id: 'pur-' + Date.now(), title: buyEc.dataset.buyEc, rating: 5, memo: 'ECで購入', date: nowShort().split(' ')[0] });
        saveState(); renderShop(); toast('🛍️ 買い物帳に購入履歴を記録しました');
        return;
      }

      const favProd = e.target.closest('[data-fav-prod]');
      if (favProd) {
        const id = favProd.dataset.favProd;
        const idx = state.shoppingBook.favorites.indexOf(id);
        if (idx >= 0) state.shoppingBook.favorites.splice(idx, 1);
        else state.shoppingBook.favorites.push(id);
        saveState(); renderShop(); return;
      }

      const selRoom = e.target.closest('[data-sel-room]');
      if (selRoom) {
        state.activeRoomId = selRoom.dataset.selRoom;
        const r = getActiveRoom();
        state.activeProductId = r && r.products[0] ? r.products[0].id : null;
        saveState(); renderHome(); return;
      }

      const selProd = e.target.closest('[data-sel-prod]');
      if (selProd) { state.activeProductId = selProd.dataset.selProd; saveState(); renderHome(); return; }

      const togPriv = e.target.closest('[data-toggle-priv]');
      if (togPriv) {
        const c = getActiveProduct().chats.find(x => x.id === togPriv.dataset.togglePriv);
        if (c) { c.isPrivate = !c.isPrivate; saveState(); renderHome(); }
        return;
      }

      const delDevImg = e.target.closest('[data-del-dev-img]');
      if (delDevImg) {
        getActiveProduct().images.splice(Number(delDevImg.dataset.delDevImg), 1);
        saveState(); renderHome(); return;
      }

      const prBtn = e.target.closest('[data-print]');
      if (prBtn) { openPrint(prBtn.dataset.print); return; }

      const readMsg = e.target.closest('[data-read-msg]');
      if (readMsg) {
        const m = state.inbox.find(x => x.id === readMsg.dataset.readMsg);
        if (m) { m.unread = false; saveState(); renderBadges(); renderChatModal(); }
        return;
      }

      const diagAns = e.target.closest('[data-diag-ans]');
      if (diagAns) {
        diagScores[diagAns.dataset.diagAns] += 1;
        diagStep += 1;
        if (diagStep >= window.ENJOY_DIAG_Q.length) {
          state.profile.diagType = Object.entries(diagScores).sort((a, b) => b[1] - a[1])[0][0];
          diagStep = -1;
          saveState();
        }
        renderHome(); return;
      }

      if (e.target.id === 'btn-start-diag') {
        diagStep = 0; diagScores = { spark: 0, craft: 0, bridge: 0, cheer: 0 }; renderHome(); return;
      }
      if (e.target.id === 'btn-short-like') {
        state.shorts[currentShortIdx % state.shorts.length].likes += 1; saveState(); renderPlaza(); return;
      }
      if (e.target.id === 'btn-short-next') {
        currentShortIdx = (currentShortIdx + 1) % state.shorts.length; renderPlaza(); return;
      }
      if (e.target.id === 'btn-gen-plan') {
        const item = document.getElementById('plan-item').value;
        generatedPlan = item === '白菜＆大根'
          ? [
              { day: '月', menu: '白菜と豚バラのみそ重ね蒸し', note: '疲労回復' },
              { day: '水', menu: '冷凍大根と鶏むねの時短煮', note: '高タンパク' },
              { day: '金', menu: '白菜の無限コールスロー', note: '5分で完成' },
              { day: '日', menu: 'ほうれん草と大根のみぞれ鍋', note: '鉄分プラス' }
            ]
          : [
              { day: '月', menu: '皮ごとレンジりんごコンポート', note: '朝の腸活' },
              { day: '水', menu: 'すりおろしりんごの生姜焼き', note: 'お肉が柔らか' },
              { day: '金', menu: 'みかんとほうれん草のサラダ', note: 'ビタミンC' },
              { day: '日', menu: '焼きりんごとシナモンのおやつ', note: '廃棄ゼロ' }
            ];
        renderUseful(); return;
      }
      if (e.target.id === 'btn-switch-ui') {
        state.uiMode = state.uiMode === 'simple' ? 'modern' : 'simple';
        saveState(); applyUiMode(); toast(state.uiMode === 'simple' ? '🔰 かんたんモード' : '⚡ モダンモード'); return;
      }
      if (e.target.id === 'btn-export') {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'enjoy_v6_backup.json'; a.click(); return;
      }
      if (e.target.id === 'btn-reset') {
        if (confirm('初期デモに戻しますか？')) { state = window.createDefaultV6State(); state.uiMode = 'modern'; saveState(); renderAll(); }
        return;
      }
    });

    // フォーム送信委譲
    document.addEventListener('submit', e => {
      if (e.target.id === 'form-feed') {
        e.preventDefault();
        const text = document.getElementById('feed-text').value.trim();
        if (!text && !pendingFeedImg) return;
        state.feeds.unshift({
          id: 'f-' + Date.now(),
          tag: document.getElementById('feed-tag').value,
          area: document.getElementById('feed-area').value.trim() || state.profile.area,
          author: state.profile.name,
          text,
          image: pendingFeedImg,
          likes: 0,
          createdAt: 'たった今'
        });
        pendingFeedImg = null;
        document.getElementById('feed-text').value = '';
        document.getElementById('feed-img-preview').classList.add('hidden');
        saveState(); renderPlaza(); toast('投稿しました');
      }
      if (e.target.id === 'form-new-idea') {
        e.preventDefault();
        state.ideas.unshift({
          id: 'idea-' + Date.now(),
          cat: document.getElementById('idea-cat').value,
          title: document.getElementById('idea-title').value.trim(),
          need: document.getElementById('idea-need').value.trim(),
          detail: document.getElementById('idea-detail').value.trim(),
          author: state.profile.name,
          area: state.profile.area,
          likes: 1
        });
        e.target.reset();
        closeModal('modal-new-idea');
        saveState(); renderEn(); toast('🚀 募集カードを公開しました');
      }
      if (e.target.id === 'form-recipe') {
        e.preventDefault();
        state.recipes.unshift({
          id: 'rec-' + Date.now(),
          title: document.getElementById('rec-title').value.trim(),
          ingredients: document.getElementById('rec-ing').value.trim(),
          tag: 'みんな投稿', author: state.profile.name, steps: '材料を合わせて美味しく調理！'
        });
        saveState(); renderUseful(); toast('🍳 レシピを追加しました');
      }
      if (e.target.id === 'form-dev-chat') {
        e.preventDefault();
        const prod = getActiveProduct();
        const txt = document.getElementById('dev-chat-input').value.trim();
        const priv = document.getElementById('dev-chat-priv').checked;
        if (!txt) return;
        prod.chats.push({ id: 'c-' + Date.now(), author: state.profile.name, text: txt, date: nowShort(), isPrivate: priv });
        const m = txt.match(/(\d{1,2})\/(\d{1,2})/);
        if (m) {
          prod.calendar.push({ id: 'cal-' + Date.now(), date: `2026-${String(m[1]).padStart(2,'0')}-${String(m[2]).padStart(2,'0')}`, title: txt.slice(0, 24) });
          toast('📅 日付を検知し予定にも自動追加しました');
        }
        saveState(); renderHome();
      }
      if (e.target.id === 'form-dev-cal') {
        e.preventDefault();
        getActiveProduct().calendar.push({ id: 'cal-' + Date.now(), date: document.getElementById('cal-d').value, title: document.getElementById('cal-t').value.trim() });
        saveState(); renderHome();
      }
      if (e.target.id === 'form-profile') {
        e.preventDefault();
        state.profile.name = document.getElementById('p-name').value.trim();
        state.profile.area = document.getElementById('p-area').value.trim();
        state.profile.skills = document.getElementById('p-skills').value.trim();
        state.profile.bio = document.getElementById('p-bio').value.trim();
        saveState(); toast('プロフィールを保存しました');
      }
      if (e.target.id === 'form-ring') {
        e.preventDefault();
        state.ringEntries.unshift({ id: 'r-' + Date.now(), name: state.profile.name, role: 'メンバー', message: document.getElementById('ring-msg').value.trim(), rank: 'S' });
        saveState(); renderHome(); toast('✍️ 年輪ボードに刻みました');
      }
    });

    // 入力・変更イベント
    document.addEventListener('change', e => {
      if (e.target.id === 'feed-img-input' && e.target.files[0]) {
        resizeImage(e.target.files[0], 720, url => {
          pendingFeedImg = url;
          const prev = document.getElementById('feed-img-preview');
          prev.innerHTML = `<img src="${url}" alt="プレビュー" /><button type="button" class="img-preview-del" id="btn-del-feed-img">✕</button>`;
          prev.classList.remove('hidden');
          document.getElementById('btn-del-feed-img').onclick = () => {
            pendingFeedImg = null;
            prev.classList.add('hidden');
          };
        });
        e.target.value = '';
      }
      if (e.target.id === 'dev-img-input' && e.target.files[0]) {
        const prod = getActiveProduct();
        if ((prod.images || []).length >= 6) { toast('写真は最大6枚までです'); return; }
        resizeImage(e.target.files[0], 640, url => {
          prod.images.push(url); saveState(); renderHome(); toast('📸 写真を追加しました');
        });
        e.target.value = '';
      }
      if (e.target.id === 'dev-phase-select') {
        getActiveProduct().phase = e.target.value;
        saveState(); renderAll(); toast(`フェーズを「${e.target.value}」に更新`);
      }
    });

    document.addEventListener('input', e => {
      if (e.target.id === 'feed-search') renderPlaza();
      if (['c-raw', 'c-lab', 'c-sell'].includes(e.target.id)) {
        const prod = getActiveProduct();
        prod.costRaw = Number(document.getElementById('c-raw').value || 0);
        prod.costLabor = Number(document.getElementById('c-lab').value || 0);
        prod.priceSell = Number(document.getElementById('c-sell').value || 0);
        saveState(); renderHome();
      }
    });

    // 固定ボタン
    const toggleUi = () => {
      state.uiMode = state.uiMode === 'simple' ? 'modern' : 'simple';
      saveState(); applyUiMode(); toast(state.uiMode === 'simple' ? '🔰 かんたんモード' : '⚡ モダンモード');
    };
    document.getElementById('btn-ui-mode-pc').onclick = toggleUi;
    document.getElementById('btn-ui-mode-mobile').onclick = toggleUi;
    document.getElementById('btn-focus-pc').onclick = () => {
      state.focusMode = !state.focusMode; saveState(); applyUiMode();
      toast(state.focusMode ? '🚜 本業集中モードON' : '通常モードに戻しました');
    };
    document.getElementById('btn-open-chat').onclick = () => openModal('modal-chat');
    document.getElementById('btn-open-new-idea').onclick = () => openModal('modal-new-idea');
    document.getElementById('btn-do-print').onclick = () => window.print();

    document.getElementById('btn-new-room').onclick = () => {
      const name = prompt('新しい開発ルーム名（例：〇〇農園 × △△工房）');
      if (!name) return;
      const rid = 'room-' + Date.now(), pid = 'prod-' + Date.now();
      state.rooms.unshift({
        id: rid, name: name.trim(), members: [state.profile.name, name.trim()],
        products: [{ id: pid, title: '第1弾商品', phase: '企画中', priceSell: 500, earlyPrice: 450, ticketsBought: 0, ticketsLimit: 20, costRaw: 100, costLabor: 100, adoptedMaterialIds: [], images: [], chats: [], calendar: [], reactions: { cheer: 0, eat: 0 } }]
      });
      state.activeRoomId = rid; state.activeProductId = pid; saveState(); renderAll();
    };

    document.getElementById('btn-new-product').onclick = () => {
      const title = prompt('追加する新商品名');
      if (!title) return;
      const pid = 'prod-' + Date.now();
      getActiveRoom().products.push({
        id: pid, title: title.trim(), phase: '企画中', priceSell: 550, earlyPrice: 480, ticketsBought: 0, ticketsLimit: 20, costRaw: 100, costLabor: 100, adoptedMaterialIds: [], images: [], chats: [], calendar: [], reactions: { cheer: 0, eat: 0 }
      });
      state.activeProductId = pid; saveState(); renderAll();
    };
  }

  /* ---------- スクロール連動：下スクロールで常設タブを隠す / 上で再表示 ---------- */
  function bindScrollHideDock() {
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      // 画面最上部付近は常に表示
      if (y <= 40) {
        document.body.classList.remove('dock-hidden');
        lastY = y;
        return;
      }
      // 12px以上下にスクロール → 隠す（サブタブも閉じる）
      if (y > lastY + 12) {
        document.body.classList.add('dock-hidden');
        document.body.classList.remove('subnav-open');
      }
      // 8px以上上にスクロール → 再表示
      else if (y < lastY - 8) {
        document.body.classList.remove('dock-hidden');
      }
      lastY = y;
    }, { passive: true });
  }
  /* ---------- 起動 ---------- */
bindEvents();
  bindScrollHideDock();
  renderAll();
  if (!state.uiMode) openModal('modal-ui-select');
})();