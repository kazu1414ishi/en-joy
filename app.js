/* ============================================================
   EN•joy v5.0 — アプリ本体ロジック (app.js)
   ============================================================ */

(function () {
  'use strict';

  const TAB_TITLES = {
    home: '🏠 ホーム',
    plaza: '💬 広場・めぐり',
    en: '🤝 EN ご縁・開発室',
    marche: '🎪 マルシェ・旬',
    my: '🏆 マイ・輪'
  };

  let state = loadState();
  let currentTab = 'home';
  let shelfFilter = 'all';
  let inboxFilter = 'all';
  let bannerDismissed = false;

  /* ---------- 状態管理 (localStorage) ---------- */
  function loadState() {
    try {
      const raw = localStorage.getItem(window.ENJOY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.rooms) return parsed;
      }
    } catch (e) {
      console.warn('localStorage load failed:', e);
    }
    return window.createDefaultEnjoyState();
  }

  function saveState() {
    try {
      localStorage.setItem(window.ENJOY_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      showToast('⚠️ 端末の保存容量がいっぱいです。不要な写真を削除してください。');
    }
  }

  /* ---------- ユーティリティ ---------- */
  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function nowLabel() {
    const d = new Date();
    const mm = d.getMonth() + 1;
    const dd = d.getDate();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${mm}/${dd} ${hh}:${mi}`;
  }

  let toastTimer = null;
  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2800);
  }

  function getActiveRoom() {
    return state.rooms.find(r => r.id === state.activeRoomId) || state.rooms[0];
  }

  function getActiveProduct() {
    const room = getActiveRoom();
    if (!room) return null;
    return room.products.find(p => p.id === state.activeProductId) || room.products[0];
  }

  function getAllProductsWithRoom() {
    const list = [];
    state.rooms.forEach(room => {
      room.products.forEach(prod => list.push({ room, prod }));
    });
    return list;
  }

  function calcHeat(profile) {
    let score = 15;
    if (profile.name && profile.name.trim().length >= 2) score += 15;
    if (profile.area && profile.area.trim().length >= 2) score += 15;
    if (profile.skills && profile.skills.trim().length >= 4) score += 20;
    const bioLen = (profile.bio || '').trim().length;
    score += Math.min(60, Math.floor(bioLen * 0.6));
    return score;
  }

  function calcLevel(exp) {
    return Math.max(1, Math.floor(exp / 50) + 1);
  }

  function calcMaterialCost(prod) {
    return (prod.adoptedMaterialIds || []).reduce((sum, id) => {
      const m = window.ENJOY_MATERIALS.find(x => x.id === id);
      return sum + (m ? m.unitPrice : 0);
    }, 0);
  }

  function addPersonalExp(axis, pts) {
    if (!state.personalExp[axis]) state.personalExp[axis] = 0;
    state.personalExp[axis] += pts;
  }

  /* ---------- ナビゲーション & モーダル ---------- */
  function switchTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tabName}`));
    document.querySelectorAll('.nav-item, .dock-item').forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = TAB_TITLES[tabName] || 'EN•joy';

    const fab = document.getElementById('fab-quick-post');
    if (fab) fab.classList.toggle('hidden', tabName !== 'plaza');

    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function switchSubtab(group, subtab) {
    document.querySelectorAll(`[data-subtab-group="${group}"]`).forEach(btn => {
      btn.classList.toggle('active', btn.dataset.subtab === subtab);
    });
    document.querySelectorAll(`#tab-${group} .subtab-panel`).forEach(panel => {
      panel.classList.toggle('active', panel.id === `${group}-${subtab}`);
    });
  }

  function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === 'modal-inbox') renderInbox();
    if (id === 'modal-inquiry') {
      document.getElementById('inq-auto-meta').textContent = `自動添付：EN•joy ${window.ENJOY_VERSION} ／ 現在の画面：${TAB_TITLES[currentTab]}`;
    }
    el.classList.remove('hidden');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  }

  /* ---------- 全体レンダリング ---------- */
  function renderAll() {
    document.body.classList.toggle('font-large', !!state.fontLarge);
    renderAdminBanner();
    renderBadges();
    renderHome();
    renderPlaza();
    renderEnWorkspace();
    renderMarche();
    renderMy();
  }

  function renderAdminBanner() {
    const bar = document.getElementById('admin-banner');
    const badge = document.getElementById('admin-banner-badge');
    const text = document.getElementById('admin-banner-text');
    const b = state.adminBanner;
    if (!b || !b.enabled || !b.text || bannerDismissed) {
      bar.classList.add('hidden');
      return;
    }
    bar.classList.remove('hidden', 'type-maint', 'type-release');
    if (b.type === 'maint') {
      bar.classList.add('type-maint');
      badge.textContent = '🔧 メンテナンス';
    } else if (b.type === 'release') {
      bar.classList.add('type-release');
      badge.textContent = '🎉 新機能';
    } else {
      badge.textContent = '📢 お知らせ';
    }
    text.textContent = b.text;
  }

  function renderBadges() {
    const unread = state.inbox.filter(m => m.unread).length;
    document.getElementById('badge-inbox').textContent = unread;

    let pendingOffers = 0;
    getAllProductsWithRoom().forEach(({ prod }) => {
      pendingOffers += (prod.offers || []).length;
    });
    ['badge-en-pc', 'badge-en-mobile'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = pendingOffers;
      el.classList.toggle('hidden', pendingOffers === 0);
    });
  }

  /* ---------- TAB 1: ホーム ---------- */
  function renderHome() {
    const on = !!state.focusMode;
    document.getElementById('focus-state-label').textContent = on ? 'ON' : 'OFF';
    document.getElementById('focus-state-sidebar').textContent = on ? 'ON' : 'OFF';
    document.getElementById('btn-focus-toggle').classList.toggle('active', on);
    document.getElementById('btn-focus-sidebar').classList.toggle('active', on);
    document.getElementById('focus-banner').classList.toggle('hidden', !on);

    // 1分ブリーフィング
    const briefList = document.getElementById('banto-brief-list');
    document.getElementById('banto-brief-count').textContent = `${state.bantoBriefs.length}件`;
    briefList.innerHTML = state.bantoBriefs.length
      ? state.bantoBriefs.slice(0, 4).map(b => `
          <li class="brief-item">
            <div><strong>${esc(b.kind)}</strong><br>${esc(b.text)}</div>
            <button type="button" class="text-btn" data-jump-tab="${esc(b.targetTab)}">見る</button>
          </li>
        `).join('')
      : '<li class="brief-item">いま確認が必要な連絡はありません。現場に集中できます！</li>';

    // 勝手にご縁＆仮収支提案
    const prop = window.ENJOY_BANTO_PROPOSALS[state.proposalIndex % window.ENJOY_BANTO_PROPOSALS.length];
    document.getElementById('banto-proposal-box').innerHTML = `
      <div><strong>${esc(prop.title)}</strong></div>
      <div class="hint-text" style="margin:0;">想定ペア：${esc(prop.partner)}</div>
      <p style="font-size:0.84rem;">${esc(prop.pitch)}</p>
      <div class="hint-text" style="margin:0;">
        仮原価 ¥${prop.estCost} ／ 想定売価 ¥${prop.estPrice} → <strong>粗利 ¥${prop.estProfit}/個</strong>
      </div>
      <div>
        <button type="button" class="btn btn-outline btn-sm" id="btn-adopt-proposal">この案でご縁ルームを作る</button>
      </div>
    `;
    const adoptBtn = document.getElementById('btn-adopt-proposal');
    if (adoptBtn) {
      adoptBtn.onclick = () => {
        const newRoomId = 'room-' + Date.now();
        const newProdId = 'prod-' + Date.now();
        state.rooms.unshift({
          id: newRoomId,
          name: prop.partner,
          partner: prop.partner,
          members: [state.profile.name, prop.partner],
          products: [{
            id: newProdId,
            title: prop.title,
            category: '新規コラボ案',
            phase: '企画中',
            visibility: 'public',
            images: [],
            costRaw: Math.round(prop.estCost * 0.5),
            costLabor: Math.round(prop.estCost * 0.5),
            adoptedMaterialIds: [],
            priceSell: prop.estPrice,
            productExp: { story: 20, fan: 10, quality: 20, market: 10 },
            stories: [{ id: 'st-' + Date.now(), author: '☕ 裏方番頭', text: `仮提案から作成：${prop.pitch}`, date: nowLabel(), isPrivate: false }],
            calendar: [],
            offers: [],
            reactions: { cheer: 1, eat: 0, visit: 0 },
            comments: []
          }]
        });
        state.activeRoomId = newRoomId;
        state.activeProductId = newProdId;
        addPersonalExp('en', 25);
        saveState();
        renderAll();
        switchTab('en');
        showToast('✨ 番頭の提案から新しいご縁ルームを作成しました！');
      };
    }

    // マイ簡易ステータス
    const heat = calcHeat(state.profile);
    const totalLv = calcLevel(
      state.personalExp.cheer + state.personalExp.field + state.personalExp.en + state.personalExp.craft
    );
    const unlockedCount = window.ENJOY_TITLES.filter(t => getTitleProgress(t) >= 100).length;
    document.getElementById('home-status-body').innerHTML = `
      <div class="stat-tile">
        <div class="stat-tile-label">総合レベル</div>
        <div class="stat-tile-val">Lv.${totalLv}</div>
        <div class="hint-text" style="margin:0;">応援・現場・ご縁・ものづくり合算</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile-label">🔥 AI熱量メーター</div>
        <div class="stat-tile-val">${heat}%</div>
        <div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, heat)}%;"></div></div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile-label">🏅 努力型称号</div>
        <div class="stat-tile-val">${unlockedCount} / ${window.ENJOY_TITLES.length}</div>
        <div class="hint-text" style="margin:0;">達成でプロフィールに勲章表示</div>
      </div>
    `;

    // 進行中の開発ボード
    const allProds = getAllProductsWithRoom();
    document.getElementById('home-projects-list').innerHTML = allProds.slice(0, 4).map(({ room, prod }) => `
      <div class="mini-project-card" data-open-prod="${esc(room.id)}|${esc(prod.id)}">
        <div class="badge-row">
          <span class="phase-badge">${esc(prod.phase)}</span>
          <span class="vis-badge">${esc(room.name)}</span>
        </div>
        <strong>${esc(prod.title)}</strong>
        <div class="hint-text">🧡 ${prod.reactions.cheer} ／ 😋 ${prod.reactions.eat} ／ 🚗 ${prod.reactions.visit}</div>
      </div>
    `).join('');

    // 直近カレンダー
    const cals = [];
    allProds.forEach(({ prod }) => {
      (prod.calendar || []).forEach(c => cals.push({ ...c, prodTitle: prod.title }));
    });
    cals.sort((a, b) => a.date.localeCompare(b.date));
    document.getElementById('home-calendar-list').innerHTML = cals.length
      ? cals.slice(0, 4).map(c => `
          <li class="cal-item">
            <div><span class="cal-date-badge">${esc(c.date)}</span> <strong>${esc(c.title)}</strong> <span class="hint-text">(${esc(c.prodTitle)})</span></div>
            <a href="${buildGoogleCalUrl(c.title, c.date)}" target="_blank" rel="noopener" class="text-btn">Google追加 ↗</a>
          </li>
        `).join('')
      : '<li class="cal-item">登録されている予定はまだありません。</li>';

    // 軍資金 & ピックアップ資材
    const fundHtml = buildFundBannerHtml();
    document.getElementById('home-fund-box').innerHTML = fundHtml;
    document.getElementById('home-pickup-materials').innerHTML = window.ENJOY_MATERIALS.slice(0, 2).map(m => `
      <div class="material-card">
        <strong>${esc(m.name)}</strong>
        <div class="hint-text" style="margin:0;">目安単価：¥${m.unitPrice}/個</div>
        <div class="btn-row">
          <button type="button" class="btn btn-outline btn-sm" data-adopt-mat="${esc(m.id)}">開発室で採用</button>
          <a href="${m.rakutenUrl}" target="_blank" rel="noopener" class="text-btn">楽天 ↗</a>
        </div>
      </div>
    `).join('');
  }

  function buildFundBannerHtml() {
    const pct = Math.min(100, Math.round((state.fund.current / state.fund.goal) * 100));
    return `
      <div class="fund-banner-top">
        <span>🎪 みんなのマルシェ軍資金（50:50神道具連動）</span>
        <span class="fund-amount">¥${state.fund.current.toLocaleString()} / ¥${state.fund.goal.toLocaleString()}</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%;"></div></div>
      <p style="font-size:0.8rem; margin-top:6px; color:#E8DCCB;">🔓 達成特典：${esc(state.fund.nextReward)}</p>
    `;
  }

  /* ---------- TAB 2: 広場・めぐり ---------- */
  function renderPlaza() {
    // 2-1: 現場つぶやき
    const q = (document.getElementById('feed-search').value || '').toLowerCase();
    const tag = document.getElementById('feed-filter-tag').value;
    const filteredFeeds = state.feeds.filter(f => {
      const matchTag = !tag || f.tag === tag;
      const matchQ = !q || `${f.author} ${f.area} ${f.body} ${f.tag}`.toLowerCase().includes(q);
      return matchTag && matchQ;
    });
    document.getElementById('feed-list').innerHTML = filteredFeeds.length
      ? filteredFeeds.map(f => `
          <article class="feed-card">
            <div class="feed-meta">
              <span class="tag-pill">${esc(f.tag)}</span>
              <strong>${esc(f.author)}</strong>
              <span>(${esc(f.role)} / ${esc(f.area)})</span>
              <span>・${esc(f.createdAt)}</span>
            </div>
            <p class="feed-body">${esc(f.body)}</p>
            <div class="reaction-row">
              <button type="button" class="react-btn" data-like-feed="${esc(f.id)}">🧡 いいね (${f.likes})</button>
              <button type="button" class="react-btn" data-connect-author="${esc(f.author)}">🤝 声をかけてご縁ルーム作成</button>
            </div>
          </article>
        `).join('')
      : '<div class="card">該当するつぶやきがありません。</div>';

    // 2-2: 仲間図鑑 (#5 熱量ブースト順)
    const mq = (document.getElementById('member-search').value || '').toLowerCase();
    const mrole = document.getElementById('member-filter-role').value;
    const sortedMembers = [...state.members]
      .sort((a, b) => b.heat - a.heat)
      .filter(m => {
        const okRole = !mrole || m.role === mrole;
        const okQ = !mq || `${m.name} ${m.area} ${m.skills} ${m.bio}`.toLowerCase().includes(mq);
        return okRole && okQ;
      });
    document.getElementById('members-grid').innerHTML = sortedMembers.map(m => {
      const matchPct = Math.min(99, 72 + Math.floor(m.heat / 5));
      return `
        <article class="member-card">
          <div class="member-top">
            <div>
              <strong>${esc(m.name)}</strong>
              <div class="hint-text" style="margin:0;">${esc(m.role)} ／ ${esc(m.area)}</div>
            </div>
            <span class="match-badge">相性 ${matchPct}%</span>
          </div>
          <div class="hint-text" style="margin:0;">🔥 熱量 ${m.heat}% ／ 得意：${esc(m.skills)}</div>
          <p style="font-size:0.86rem;">${esc(m.bio)}</p>
          <div class="form-actions-right">
            <button type="button" class="btn btn-outline btn-sm" data-connect-author="${esc(m.name)}">🤝 ご縁を結ぶ</button>
          </div>
        </article>
      `;
    }).join('');

    // 2-3: 進行中企画公開一覧 (#6・#7)
    const pubList = getAllProductsWithRoom().filter(({ prod }) => prod.visibility !== 'private');
    document.getElementById('public-projects-list').innerHTML = pubList.map(({ room, prod }) => `
      <article class="card">
        <div class="card-head">
          <div>
            <div class="badge-row">
              <span class="phase-badge">${esc(prod.phase)}</span>
              <span class="vis-badge">${esc(room.name)}</span>
            </div>
            <h3>${esc(prod.title)}</h3>
          </div>
          <button type="button" class="btn btn-outline btn-sm" data-open-offer="${esc(prod.id)}">🙋 参加オファー</button>
        </div>
        <div class="reaction-row" style="margin-bottom:10px;">
          <button type="button" class="react-btn" data-react="${esc(prod.id)}|cheer">🧡 応援 (${prod.reactions.cheer})</button>
          <button type="button" class="react-btn" data-react="${esc(prod.id)}|eat">😋 食べてみたい (${prod.reactions.eat})</button>
          <button type="button" class="react-btn" data-react="${esc(prod.id)}|visit">🚗 行ってみたい (${prod.reactions.visit})</button>
        </div>
        <div class="hint-text" style="margin-bottom:6px;">
          ${(prod.comments || []).slice(-2).map(c => `💬 <strong>${esc(c.author)}</strong>：${esc(c.text)}`).join('<br>') || 'まだ応援コメントはありません'}
        </div>
        <form class="voice-input-row" data-comment-form="${esc(prod.id)}">
          <input type="text" class="input" placeholder="温かい応援コメントを書く（作り手のLvが伸びます！）" required />
          <button type="submit" class="btn btn-primary btn-sm">送る</button>
        </form>
      </article>
    `).join('');

    // 2-4: マップ公開ONメンバーのプレビュー
    const publicSpots = state.members.filter(m => m.mapPublic);
    if (state.profile.mapPublic) {
      publicSpots.unshift({ name: state.profile.name, area: state.profile.area });
    }
    document.getElementById('map-preview-list').innerHTML = publicSpots.map(s =>
      `<span class="tag-pill">📍 ${esc(s.name)}（${esc(s.area)}）</span>`
    ).join('');
  }

  /* ---------- TAB 3: EN ご縁・開発室 ---------- */
  function renderEnWorkspace() {
    const room = getActiveRoom();
    const prod = getActiveProduct();
    if (!room || !prod) return;

    // 親ルーム一覧
    document.getElementById('en-room-pills').innerHTML = state.rooms.map(r => `
      <button type="button" class="room-pill ${r.id === room.id ? 'active' : ''}" data-select-room="${esc(r.id)}">
        🤝 ${esc(r.name)} (${r.products.length})
      </button>
    `).join('');

    // 子商品一覧
    document.getElementById('en-product-pills').innerHTML = room.products.map(p => `
      <button type="button" class="prod-pill ${p.id === prod.id ? 'active' : ''}" data-select-prod="${esc(p.id)}">
        📦 ${esc(p.title)}
      </button>
    `).join('');

    // ヘッダー
    document.getElementById('ws-phase-badge').textContent = prod.phase;
    const visMap = { public: '🌐 広場に公開', supporters: '🧡 サポーター限定', private: '🔒 メンバーのみ非公開' };
    document.getElementById('ws-visibility-badge').textContent = visMap[prod.visibility] || '🌐 公開';
    document.getElementById('ws-product-title').textContent = prod.title;
    document.getElementById('ws-members-line').textContent = `参加メンバー（${room.members.length}名）：${room.members.join(' ／ ')}`;
    document.getElementById('ws-phase-select').value = prod.phase;
    document.getElementById('ws-visibility-select').value = prod.visibility;

    // 商品4軸Lv
    const pe = prod.productExp || { story: 10, fan: 10, quality: 10, market: 10 };
    const prodTotalLv = calcLevel(pe.story + pe.fan + pe.quality + pe.market);
    document.getElementById('ws-product-total-lv').textContent = `総合 Lv.${prodTotalLv}`;
    const pAxes = [
      { label: '📖 物語・試作Lv', val: pe.story },
      { label: '🧡 ファン熱量Lv', val: pe.fan },
      { label: '🛠️ 仕立て・品質Lv', val: pe.quality },
      { label: '🎪 市場・出店Lv', val: pe.market }
    ];
    document.getElementById('ws-product-lv-grid').innerHTML = pAxes.map(a => `
      <div class="lv-card">
        <div class="lv-card-head"><span>${a.label}</span><span>Lv.${calcLevel(a.val)}</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${(a.val % 50) * 2}%;"></div></div>
      </div>
    `).join('');

    // 複数画像ギャラリー (#2)
    const gal = document.getElementById('ws-gallery');
    gal.innerHTML = (prod.images && prod.images.length)
      ? prod.images.map((src, idx) => `
          <div class="gallery-item">
            <img src="${src}" alt="商品写真 ${idx + 1}" />
            <button type="button" class="gallery-del" data-del-img="${idx}" title="削除">✕</button>
          </div>
        `).join('')
      : '<div class="hint-text">まだ写真がありません。「＋ 写真を追加」から試作や素材の写真を登録できます。</div>';

    // 参加オファー承認箱 (#7)
    const offersCard = document.getElementById('ws-offers-card');
    const offers = prod.offers || [];
    offersCard.classList.toggle('hidden', offers.length === 0);
    document.getElementById('ws-offers-list').innerHTML = offers.map(o => {
      const approved = (o.approvals || []).includes(state.profile.name);
      return `
        <div class="offer-item">
          <div><strong>🙋 ${esc(o.from)}</strong> さんからの参加オファー</div>
          <p style="font-size:0.86rem;">「${esc(o.message)}」</p>
          <div class="hint-text" style="margin:0;">現在の同意：${o.approvals.length} / ${room.members.length} 名（全員同意で正式合流）</div>
          <div class="btn-row">
            <button type="button" class="btn btn-primary btn-sm" data-approve-offer="${esc(o.id)}" ${approved ? 'disabled' : ''}>
              ${approved ? '✅ あなたは同意済み' : '👍 参加に同意する'}
            </button>
            <button type="button" class="btn btn-olive btn-sm" data-approve-all="${esc(o.id)}">
              ⚡ 全員同意を完了して合流（デモ）
            </button>
          </div>
        </div>
      `;
    }).join('');

    // 原価電卓 & 採用資材
    const matCost = calcMaterialCost(prod);
    document.getElementById('ws-cost-raw').value = prod.costRaw;
    document.getElementById('ws-cost-labor').value = prod.costLabor;
    document.getElementById('ws-cost-mat').value = matCost;
    document.getElementById('ws-price-sell').value = prod.priceSell;
    const totalCost = Number(prod.costRaw) + Number(prod.costLabor) + matCost;
    const profit = Number(prod.priceSell) - totalCost;
    const rate = prod.priceSell > 0 ? Math.round((profit / prod.priceSell) * 100) : 0;
    document.getElementById('ws-cost-summary').innerHTML = `
      <div>合計原価：<strong>¥${totalCost}</strong></div>
      <div>予定粗利：<strong style="color:${profit >= 0 ? 'var(--olive)' : 'var(--accent)'};">¥${profit}</strong></div>
      <div>粗利率：<strong>${rate}%</strong></div>
    `;
    document.getElementById('ws-adopted-materials').innerHTML = (prod.adoptedMaterialIds || []).length
      ? prod.adoptedMaterialIds.map(id => {
          const m = window.ENJOY_MATERIALS.find(x => x.id === id);
          if (!m) return '';
          return `<span class="mat-chip">${esc(m.name)} (¥${m.unitPrice}) <button type="button" data-remove-mat="${esc(id)}">✕</button></span>`;
        }).join('')
      : '<span class="hint-text">まだ採用中の資材はありません。マルシェの「資材＆神道具」から採用できます。</span>';

    // ストーリーログ (#8)
    document.getElementById('ws-story-list').innerHTML = (prod.stories || []).map(st => `
      <div class="story-item ${st.isPrivate ? 'is-private' : ''}">
        <div class="story-item-head">
          <span><strong>${esc(st.author)}</strong> ・ ${esc(st.date)}</span>
          <button type="button" class="text-btn" data-toggle-story-priv="${esc(st.id)}">
            ${st.isPrivate ? '🔒 メンバー限定（公開にする）' : '🌐 公開中（非公開にする）'}
          </button>
        </div>
        <p style="font-size:0.88rem;">${esc(st.text)}</p>
      </div>
    `).join('');

    // 参加型カレンダー (#10)
    document.getElementById('ws-calendar-list').innerHTML = (prod.calendar || []).length
      ? prod.calendar.map(c => `
          <li class="cal-item">
            <div><span class="cal-date-badge">${esc(c.date)}</span> <strong>${esc(c.title)}</strong></div>
            <div class="btn-row">
              <a href="${buildGoogleCalUrl(c.title, c.date)}" target="_blank" rel="noopener" class="text-btn">Googleカレンダーへ ↗</a>
              <button type="button" class="text-btn" data-del-cal="${esc(c.id)}">削除</button>
            </div>
          </li>
        `).join('')
      : '<li class="cal-item">予定はまだありません。開発ログに「12/10 試作」のように書いても自動追加されます！</li>';
  }

  function buildGoogleCalUrl(title, dateStr) {
    const clean = (dateStr || '2026-12-01').replace(/-/g, '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('EN•joy: ' + title)}&dates=${clean}/${clean}`;
  }

  /* ---------- TAB 4: マルシェ・旬 ---------- */
  function renderMarche() {
    // 4-1: みんなの棚 (#3)
    const all = getAllProductsWithRoom().filter(({ prod }) => prod.visibility !== 'private');
    const filtered = shelfFilter === 'all' ? all : all.filter(({ prod }) => prod.phase === shelfFilter);
    document.getElementById('marche-shelf-grid').innerHTML = filtered.length
      ? filtered.map(({ room, prod }) => {
          const thumb = prod.images && prod.images[0]
            ? `<img class="product-thumb" src="${prod.images[0]}" alt="${esc(prod.title)}" />`
            : `<div class="product-thumb">🧺</div>`;
          return `
            <article class="product-card">
              ${thumb}
              <div class="badge-row">
                <span class="phase-badge">${esc(prod.phase)}</span>
                <span class="vis-badge">${esc(prod.category)}</span>
              </div>
              <strong>${esc(prod.title)}</strong>
              <div class="hint-text" style="margin:0;">${esc(room.name)} ／ 予定価格 ¥${prod.priceSell}</div>
              <div class="reaction-row">
                <button type="button" class="react-btn" data-react="${esc(prod.id)}|eat">😋 食べてみたい (${prod.reactions.eat})</button>
                <button type="button" class="react-btn" data-open-prod="${esc(room.id)}|${esc(prod.id)}">開発室を見る</button>
              </div>
            </article>
          `;
        }).join('')
      : '<div class="card">このフェーズの商品はまだありません。</div>';

    // 4-2: マイ商品カタログ (#4)
    const groupBy = document.getElementById('catalog-group-by').value;
    const groups = {};
    getAllProductsWithRoom().forEach(({ room, prod }) => {
      const key = groupBy === 'room' ? room.name : groupBy === 'category' ? prod.category : prod.phase;
      if (!groups[key]) groups[key] = [];
      groups[key].push({ room, prod });
    });
    document.getElementById('my-catalog-body').innerHTML = Object.entries(groups).map(([k, items]) => `
      <div>
        <div class="catalog-group-title">${esc(k)}（${items.length}点）</div>
        <div class="mini-project-grid">
          ${items.map(({ room, prod }) => `
            <div class="mini-project-card" data-open-prod="${esc(room.id)}|${esc(prod.id)}">
              <span class="phase-badge">${esc(prod.phase)}</span>
              <div style="margin-top:6px;"><strong>${esc(prod.title)}</strong></div>
              <div class="hint-text">売価 ¥${prod.priceSell} ／ 原価 ¥${Number(prod.costRaw) + Number(prod.costLabor) + calcMaterialCost(prod)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    // 4-3: 資材 & 神道具 (#9)
    document.getElementById('marche-fund-box').innerHTML = buildFundBannerHtml();
    const activeProd = getActiveProduct();
    document.getElementById('materials-list').innerHTML = window.ENJOY_MATERIALS.map(m => {
      const adoptedBy = getAllProductsWithRoom()
        .filter(({ prod }) => (prod.adoptedMaterialIds || []).includes(m.id))
        .map(({ prod }) => prod.title);
      const isAdoptedHere = activeProd && (activeProd.adoptedMaterialIds || []).includes(m.id);
      return `
        <article class="material-card">
          <strong>${esc(m.name)}</strong>
          <div class="hint-text" style="margin:0;">目安単価：¥${m.unitPrice}/個 ・ ${esc(m.desc)}</div>
          <div class="pr-box">
            ✨ 無料PR掲載中：${adoptedBy.length ? adoptedBy.map(esc).join(' ／ ') : '最初に採用するとここに掲載されます！'}
          </div>
          <div class="btn-row">
            <button type="button" class="btn ${isAdoptedHere ? 'btn-olive' : 'btn-primary'} btn-sm" data-adopt-mat="${esc(m.id)}">
              ${isAdoptedHere ? '✅ 採用中' : '📦 開発室で採用'}
            </button>
            <a href="${m.rakutenUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">楽天比較 ↗</a>
            <a href="${m.amazonUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">Amazon ↗</a>
          </div>
        </article>
      `;
    }).join('');

    document.getElementById('tools-list').innerHTML = window.ENJOY_TOOLS.map(t => `
      <article class="material-card">
        <strong>${esc(t.name)}</strong>
        <div class="hint-text" style="margin:0;">目安：¥${t.price.toLocaleString()} ・ ${esc(t.desc)}</div>
        <div class="btn-row">
          <a href="${t.rakutenUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm" data-fund-boost="150">楽天で見る ↗</a>
          <a href="${t.amazonUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm" data-fund-boost="150">Amazonで見る ↗</a>
        </div>
      </article>
    `).join('');
  }

  /* ---------- TAB 5: マイ・輪 ---------- */
  function getTitleProgress(t) {
    let val = 0;
    if (t.metric === 'heat') val = calcHeat(state.profile);
    else if (t.metric === 'productsCount') val = getAllProductsWithRoom().length;
    else val = state.stats[t.metric] || 0;
    return Math.min(100, Math.round((val / t.target) * 100));
  }

  function renderMy() {
    // 個人4軸Lv
    const pe = state.personalExp;
    const totalLv = calcLevel(pe.cheer + pe.field + pe.en + pe.craft);
    document.getElementById('my-total-lv-badge').textContent = `総合 Lv.${totalLv}`;
    const axes = [
      { label: '🧡 応援・目利きLv', val: pe.cheer },
      { label: '🎪 現場・マルシェLv', val: pe.field },
      { label: '🤝 ご縁・つなぎLv', val: pe.en },
      { label: '🛠️ ものづくりLv', val: pe.craft }
    ];
    document.getElementById('my-lv-4-grid').innerHTML = axes.map(a => `
      <div class="lv-card">
        <div class="lv-card-head"><span>${a.label}</span><span>Lv.${calcLevel(a.val)} (${a.val} EXP)</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${(a.val % 50) * 2}%;"></div></div>
      </div>
    `).join('');

    // 熱量メーター & プロフィール
    const heat = calcHeat(state.profile);
    document.getElementById('my-heat-badge').textContent = `${heat}%`;
    document.getElementById('my-heat-bar').style.width = `${Math.min(100, heat)}%`;
    document.getElementById('my-heat-comment').textContent =
      heat >= 100
        ? '🔥 100%突破！仲間図鑑で最上位ブースト表示され、相性マッチングが優遇されています！'
        : 'あと少し！想いや持っている設備を詳しく書くほど100%に近づきます。';

    document.getElementById('prof-name').value = state.profile.name || '';
    document.getElementById('prof-role').value = state.profile.role || '農家・生産者';
    document.getElementById('prof-area').value = state.profile.area || '';
    document.getElementById('prof-skills').value = state.profile.skills || '';
    document.getElementById('prof-bio').value = state.profile.bio || '';
    document.getElementById('prof-map-public').checked = !!state.profile.mapPublic;

    // 努力型称号
    document.getElementById('titles-grid').innerHTML = window.ENJOY_TITLES.map(t => {
      const pct = getTitleProgress(t);
      const unlocked = pct >= 100;
      return `
        <div class="title-card ${unlocked ? 'unlocked' : ''}">
          <div class="lv-card-head">
            <span>${t.icon} ${esc(t.name)}</span>
            <span>${unlocked ? '✨ 獲得済み' : pct + '%'}</span>
          </div>
          <p class="hint-text" style="margin:0 0 8px;">${esc(t.desc)}</p>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%;"></div></div>
        </div>
      `;
    }).join('');

    // 運営コントロールパネル
    document.getElementById('admin-banner-type').value = state.adminBanner.type || 'info';
    document.getElementById('admin-banner-enabled').checked = !!state.adminBanner.enabled;
    document.getElementById('admin-banner-input').value = state.adminBanner.text || '';
    document.getElementById('admin-inquiry-log').innerHTML = (state.inquiries || []).length
      ? state.inquiries.map(i => `
          <div class="inbox-item">
            <div class="feed-meta" style="margin-bottom:4px;">
              <span class="tag-pill">${esc(i.category)}</span>
              <span>${esc(i.date)}</span>
              <span>(${esc(i.meta)})</span>
            </div>
            <p style="font-size:0.86rem;">${esc(i.body)}</p>
          </div>
        `).join('')
      : '<p class="hint-text">まだお問い合わせはありません。</p>';
  }

  /* ---------- 一括メッセージ箱 (#11) ---------- */
  function renderInbox() {
    const list = inboxFilter === 'all' ? state.inbox : state.inbox.filter(m => m.type === inboxFilter);
    const typeLabel = { cheer: '🧡 応援の声', offer: '🙋 参加オファー', dev: '🛠️ 開発連絡', ops: '📢 運営' };
    document.getElementById('inbox-list').innerHTML = list.length
      ? list.map(m => `
          <div class="inbox-item">
            <div class="feed-meta" style="margin-bottom:4px;">
              <span class="tag-pill">${typeLabel[m.type] || '✉️ 連絡'}</span>
              <strong>${esc(m.from)}</strong>
              <span>・${esc(m.date)}</span>
              ${m.unread ? '<span class="phase-badge">未読</span>' : ''}
            </div>
            <p style="font-size:0.88rem; margin-bottom:8px;">${esc(m.text)}</p>
            <div class="btn-row">
              ${m.unread ? `<button type="button" class="btn btn-outline btn-sm" data-read-msg="${esc(m.id)}">既読にする</button>` : ''}
              ${m.type === 'cheer' ? `<button type="button" class="btn ${m.quotedForPop ? 'btn-olive' : 'btn-outline'} btn-sm" data-quote-pop="${esc(m.id)}">${m.quotedForPop ? '✅ POP引用中' : '🪧 店頭POPに引用'}</button>` : ''}
            </div>
          </div>
        `).join('')
      : '<p class="hint-text">該当するメッセージはありません。</p>';
  }

  /* ---------- 印刷プレビュー（同意書 / A4 POP / 8枚名刺） ---------- */
  function openPrintPreview(mode) {
    const room = getActiveRoom();
    const prod = getActiveProduct();
    if (!room || !prod) return;
    const area = document.getElementById('print-preview-area');
    const title = document.getElementById('print-title');

    if (mode === 'agreement') {
      title.textContent = '📄 簡易コラボ同意書（印刷・PDF保存）';
      const totalCost = Number(prod.costRaw) + Number(prod.costLabor) + calcMaterialCost(prod);
      area.innerHTML = `
        <div class="print-doc">
          <h2 style="text-align:center; margin-bottom:14px;">EN•joy 簡易コラボ開発 確認書</h2>
          <p><strong>ご縁ルーム：</strong>${esc(room.name)}</p>
          <p><strong>対象商品：</strong>${esc(prod.title)}（フェーズ：${esc(prod.phase)}）</p>
          <p><strong>参加メンバー：</strong>${esc(room.members.join(' ／ '))}</p>
          <hr style="margin:12px 0;" />
          <p><strong>想定原価：</strong>¥${totalCost}/個 ／ <strong>予定販売価格：</strong>¥${prod.priceSell}/個</p>
          <p style="margin-top:10px; font-size:0.88rem;">
            1. 本プロジェクトはメンバー全員の合意のもとで進行し、追加参加も全員同意を原則とします。<br>
            2. 試作費・資材費の分担および売上配分は、販売開始前にメンバー間で最終確認を行います。<br>
            3. 本書は現場での認識合わせを目的とした簡易メモです。
          </p>
          <div style="margin-top:24px; display:flex; justify-content:space-between;">
            <span>作成日：${new Date().toLocaleDateString('ja-JP')}</span>
            <span>確認サイン：______________________</span>
          </div>
        </div>
      `;
    } else if (mode === 'pop') {
      title.textContent = '🪧 応援の声つき A4店頭POP';
      const quoted = state.inbox.find(m => m.quotedForPop) || (prod.comments && prod.comments[0]);
      const voiceText = quoted ? quoted.text : '作り手の想いが詰まった、ご縁から生まれた自信作です！';
      area.innerHTML = `
        <div class="print-doc print-pop">
          <div style="color:var(--accent); font-weight:900; letter-spacing:0.1em;">EN•joy × EN•dress</div>
          <h1 style="font-size:1.8rem; margin:12px 0;">${esc(prod.title)}</h1>
          <p style="font-size:1rem; color:#555; margin-bottom:16px;">${esc(room.name)} 共同開発</p>
          <div style="background:#FBF4E4; padding:14px; border-radius:10px; margin:14px 0;">
            <div style="font-size:0.8rem; font-weight:800; color:#8A5A12;">🧡 みんなの応援の声</div>
            <p style="font-size:1.05rem; font-weight:700; margin-top:4px;">「${esc(voiceText)}」</p>
          </div>
          <div style="font-size:2rem; font-weight:900; color:var(--accent); margin-top:14px;">¥${prod.priceSell} <span style="font-size:0.9rem;">(税込目安)</span></div>
        </div>
      `;
    } else if (mode === 'cards') {
      title.textContent = '🪪 8枚まとめ名刺シート（A4印刷用）';
      const cardHtml = `
        <div class="print-biz-card">
          <div style="font-weight:900; color:var(--accent);">EN•joy / EN•dress</div>
          <div style="font-size:1rem; font-weight:900; margin:4px 0;">${esc(state.profile.name)}</div>
          <div>${esc(state.profile.role)} ／ ${esc(state.profile.area)}</div>
          <div style="font-size:0.75rem; color:#666; margin-top:4px;">${esc(state.profile.skills)}</div>
        </div>
      `;
      area.innerHTML = `<div class="print-doc"><div class="print-cards-grid">${Array(8).fill(cardHtml).join('')}</div></div>`;
    }
    openModal('modal-print');
  }

  /* ---------- 画像自動軽量リサイズ（パンク防止） ---------- */
  function resizeImageFile(file, maxW, callback) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------- イベントリスナー登録 ---------- */
  function bindEvents() {
    // 5タブ切替 & ホーム帰還
    document.addEventListener('click', e => {
      const tabBtn = e.target.closest('[data-tab]');
      if (tabBtn) {
        switchTab(tabBtn.dataset.tab);
        return;
      }
      if (e.target.closest('[data-go-home]')) {
        switchTab('home');
        return;
      }
      const subBtn = e.target.closest('[data-subtab]');
      if (subBtn) {
        switchSubtab(subBtn.dataset.subtabGroup, subBtn.dataset.subtab);
        return;
      }
      const jumpBtn = e.target.closest('[data-jump-tab]');
      if (jumpBtn) {
        switchTab(jumpBtn.dataset.jumpTab);
        if (jumpBtn.dataset.jumpSubtab) switchSubtab(jumpBtn.dataset.jumpTab, jumpBtn.dataset.jumpSubtab);
        return;
      }
      const openModalBtn = e.target.closest('[data-open-modal]');
      if (openModalBtn) {
        openModal(openModalBtn.dataset.openModal);
        return;
      }
      const closeModalBtn = e.target.closest('[data-close-modal]');
      if (closeModalBtn) {
        closeModal(closeModalBtn.dataset.closeModal);
        return;
      }

      // ご縁ルーム・商品選択
      const openProd = e.target.closest('[data-open-prod]');
      if (openProd) {
        const [rid, pid] = openProd.dataset.openProd.split('|');
        state.activeRoomId = rid;
        state.activeProductId = pid;
        saveState();
        renderEnWorkspace();
        switchTab('en');
        return;
      }
      const selRoom = e.target.closest('[data-select-room]');
      if (selRoom) {
        state.activeRoomId = selRoom.dataset.selectRoom;
        const r = getActiveRoom();
        state.activeProductId = r && r.products[0] ? r.products[0].id : null;
        saveState();
        renderEnWorkspace();
        return;
      }
      const selProd = e.target.closest('[data-select-prod]');
      if (selProd) {
        state.activeProductId = selProd.dataset.selectProd;
        saveState();
        renderEnWorkspace();
        return;
      }

      // 広場いいね & ご縁作成
      const likeFeed = e.target.closest('[data-like-feed]');
      if (likeFeed) {
        const f = state.feeds.find(x => x.id === likeFeed.dataset.likeFeed);
        if (f) {
          f.likes += 1;
          addPersonalExp('cheer', 5);
          saveState();
          renderAll();
          showToast('🧡 いいねを送りました (+5 EXP)');
        }
        return;
      }
      const connAuthor = e.target.closest('[data-connect-author]');
      if (connAuthor) {
        const partner = connAuthor.dataset.connectAuthor;
        const newRoomId = 'room-' + Date.now();
        const newProdId = 'prod-' + Date.now();
        state.rooms.unshift({
          id: newRoomId,
          name: `${partner} とのご縁`,
          partner,
          members: [state.profile.name, partner],
          products: [{
            id: newProdId,
            title: `${partner} コラボ第1弾（企画中）`,
            category: '新規コラボ',
            phase: '企画中',
            visibility: 'public',
            images: [],
            costRaw: 100,
            costLabor: 100,
            adoptedMaterialIds: [],
            priceSell: 500,
            productExp: { story: 15, fan: 10, quality: 10, market: 10 },
            stories: [{ id: 'st-' + Date.now(), author: state.profile.name, text: `${partner}さんに声をかけてご縁ルームを立ち上げました！`, date: nowLabel(), isPrivate: false }],
            calendar: [],
            offers: [],
            reactions: { cheer: 1, eat: 0, visit: 0 },
            comments: []
          }]
        });
        state.activeRoomId = newRoomId;
        state.activeProductId = newProdId;
        addPersonalExp('en', 20);
        saveState();
        renderAll();
        switchTab('en');
        showToast(`🤝 ${partner}さんとのご縁ルームを作成しました！`);
        return;
      }

      // プロジェクトリアクション (#6)
      const reactBtn = e.target.closest('[data-react]');
      if (reactBtn) {
        const [pid, kind] = reactBtn.dataset.react.split('|');
        const found = getAllProductsWithRoom().find(({ prod }) => prod.id === pid);
        if (found) {
          found.prod.reactions[kind] = (found.prod.reactions[kind] || 0) + 1;
          found.prod.productExp.fan += 5;
          state.stats.cheersSent += 1;
          addPersonalExp('cheer', 8);
          saveState();
          renderAll();
          showToast('🧡 リアクションを届けました (+8 EXP)');
        }
        return;
      }

      // 参加オファーモーダル (#7)
      const offerBtn = e.target.closest('[data-open-offer]');
      if (offerBtn) {
        const found = getAllProductsWithRoom().find(({ prod }) => prod.id === offerBtn.dataset.openOffer);
        if (found) {
          document.getElementById('offer-product-id').value = found.prod.id;
          document.getElementById('offer-target-name').textContent = `対象：${found.prod.title}（${found.room.name}）`;
          openModal('modal-offer');
        }
        return;
      }

      // オファー同意 (#7)
      const approveBtn = e.target.closest('[data-approve-offer], [data-approve-all]');
      if (approveBtn) {
        const oid = approveBtn.dataset.approveOffer || approveBtn.dataset.approveAll;
        const room = getActiveRoom();
        const prod = getActiveProduct();
        const idx = (prod.offers || []).findIndex(o => o.id === oid);
        if (idx >= 0) {
          const offer = prod.offers[idx];
          if (approveBtn.dataset.approveAll) {
            if (!room.members.includes(offer.from)) room.members.push(offer.from);
            prod.offers.splice(idx, 1);
            prod.stories.unshift({ id: 'st-' + Date.now(), author: '🤝 システム', text: `全員同意が揃い、${offer.from}さんが正式合流しました！`, date: nowLabel(), isPrivate: false });
            addPersonalExp('en', 25);
            showToast(`🎉 ${offer.from}さんが正式合流しました！`);
          } else {
            if (!offer.approvals.includes(state.profile.name)) offer.approvals.push(state.profile.name);
            showToast('👍 同意を記録しました（全員同意で正式合流）');
          }
          saveState();
          renderAll();
        }
        return;
      }

      // 資材採用 / 解除 (#9)
      const adoptMat = e.target.closest('[data-adopt-mat]');
      if (adoptMat) {
        const prod = getActiveProduct();
        const mid = adoptMat.dataset.adoptMat;
        if (prod) {
          if (!prod.adoptedMaterialIds) prod.adoptedMaterialIds = [];
          if (!prod.adoptedMaterialIds.includes(mid)) {
            prod.adoptedMaterialIds.push(mid);
            prod.productExp.quality += 10;
            addPersonalExp('craft', 10);
            saveState();
            renderAll();
            showToast('📦 資材を採用！原価に自動加算＆無料PR掲載されました');
          } else {
            showToast('すでに選択中の商品に採用済みです');
          }
        }
        return;
      }
      const remMat = e.target.closest('[data-remove-mat]');
      if (remMat) {
        const prod = getActiveProduct();
        if (prod) {
          prod.adoptedMaterialIds = (prod.adoptedMaterialIds || []).filter(x => x !== remMat.dataset.removeMat);
          saveState();
          renderAll();
        }
        return;
      }

      // 神道具クリックで軍資金デモ加算
      const fundBoost = e.target.closest('[data-fund-boost]');
      if (fundBoost) {
        state.fund.current += Number(fundBoost.dataset.fundBoost || 100);
        saveState();
        renderMarche();
        renderHome();
        return;
      }

      // 写真削除 / ストーリー個別非公開切替 / カレンダー削除
      const delImg = e.target.closest('[data-del-img]');
      if (delImg) {
        const prod = getActiveProduct();
        prod.images.splice(Number(delImg.dataset.delImg), 1);
        saveState();
        renderEnWorkspace();
        return;
      }
      const togPriv = e.target.closest('[data-toggle-story-priv]');
      if (togPriv) {
        const prod = getActiveProduct();
        const st = prod.stories.find(s => s.id === togPriv.dataset.toggleStoryPriv);
        if (st) {
          st.isPrivate = !st.isPrivate;
          saveState();
          renderEnWorkspace();
        }
        return;
      }
      const delCal = e.target.closest('[data-del-cal]');
      if (delCal) {
        const prod = getActiveProduct();
        prod.calendar = prod.calendar.filter(c => c.id !== delCal.dataset.delCal);
        saveState();
        renderAll();
        return;
      }

      // マルシェ棚フィルタ / 受信箱フィルタ
      const sf = e.target.closest('[data-shelf-filter]');
      if (sf) {
        shelfFilter = sf.dataset.shelfFilter;
        document.querySelectorAll('[data-shelf-filter]').forEach(b => b.classList.toggle('active', b === sf));
        renderMarche();
        return;
      }
      const inf = e.target.closest('[data-inbox-filter]');
      if (inf) {
        inboxFilter = inf.dataset.inboxFilter;
        document.querySelectorAll('[data-inbox-filter]').forEach(b => b.classList.toggle('active', b === inf));
        renderInbox();
        return;
      }
      const readMsg = e.target.closest('[data-read-msg]');
      if (readMsg) {
        const m = state.inbox.find(x => x.id === readMsg.dataset.readMsg);
        if (m) m.unread = false;
        saveState();
        renderBadges();
        renderInbox();
        return;
      }
      const quotePop = e.target.closest('[data-quote-pop]');
      if (quotePop) {
        const m = state.inbox.find(x => x.id === quotePop.dataset.quotePop);
        if (m) {
          m.quotedForPop = !m.quotedForPop;
          saveState();
          renderInbox();
          showToast(m.quotedForPop ? '🪧 A4店頭POPの引用にセットしました！' : 'POP引用を解除しました');
        }
        return;
      }
    });

    // ヘッダー・基本ボタン
    document.getElementById('btn-close-banner').onclick = () => {
      bannerDismissed = true;
      renderAdminBanner();
    };
    document.getElementById('btn-version-pc').onclick = () => openModal('modal-version');
    document.getElementById('btn-version-mobile').onclick = () => openModal('modal-version');
    document.getElementById('btn-open-inbox').onclick = () => openModal('modal-inbox');
    document.getElementById('btn-font-toggle').onclick = () => {
      state.fontLarge = !state.fontLarge;
      saveState();
      renderAll();
      showToast(state.fontLarge ? '文字サイズ：大文字モード' : '文字サイズ：標準');
    };

    // 本業集中モード
    const toggleFocus = () => {
      state.focusMode = !state.focusMode;
      saveState();
      renderHome();
      showToast(state.focusMode ? '🚜 本業集中モードON！通知は番頭がまとめます' : '☕ おかえりなさい！通常モードに戻しました');
    };
    document.getElementById('btn-focus-toggle').onclick = toggleFocus;
    document.getElementById('btn-focus-sidebar').onclick = toggleFocus;

    // 番頭：音声入力 & 丸投げ
    document.getElementById('btn-voice-rec').onclick = () => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        showToast('このブラウザでは音声認識が使えません。キーボードのマイク入力をお使いください。');
        return;
      }
      const rec = new SR();
      rec.lang = 'ja-JP';
      rec.onresult = ev => {
        document.getElementById('banto-memo-input').value = ev.results[0][0].transcript;
        showToast('🎙️ 音声を読み取りました！「番頭に投げる」を押してください');
      };
      rec.start();
      showToast('🎙️ お話しください...');
    };

    document.getElementById('btn-banto-submit').onclick = () => {
      const input = document.getElementById('banto-memo-input');
      const txt = input.value.trim();
      if (!txt) return;
      state.bantoBriefs.unshift({
        id: 'br-' + Date.now(),
        kind: '🎙️ 番頭仕込み済',
        text: `「${txt}」→ 広場の下書き＆開発室メモへ整理しました。`,
        targetTab: 'plaza'
      });
      state.feeds.unshift({
        id: 'feed-' + Date.now(),
        author: state.profile.name,
        role: state.profile.role,
        area: state.profile.area,
        tag: '💡 余ってます',
        body: `【番頭代筆】${txt}`,
        createdAt: 'たった今',
        likes: 1
      });
      state.stats.feedsPosted += 1;
      addPersonalExp('field', 12);
      input.value = '';
      saveState();
      renderAll();
      showToast('☕ 番頭が受け取り、広場とブリーフィングへ自動整理しました！');
    };

    document.getElementById('btn-refresh-proposal').onclick = () => {
      state.proposalIndex = (state.proposalIndex + 1) % window.ENJOY_BANTO_PROPOSALS.length;
      saveState();
      renderHome();
    };

    // 広場つぶやき投稿 & 検索
    document.getElementById('form-post-feed').onsubmit = e => {
      e.preventDefault();
      const body = document.getElementById('feed-body').value.trim();
      if (!body) return;
      state.feeds.unshift({
        id: 'feed-' + Date.now(),
        author: state.profile.name,
        role: state.profile.role,
        area: document.getElementById('feed-area').value.trim() || state.profile.area,
        tag: document.getElementById('feed-tag').value,
        body,
        createdAt: 'たった今',
        likes: 0
      });
      state.stats.feedsPosted += 1;
      addPersonalExp('field', 15);
      document.getElementById('feed-body').value = '';
      saveState();
      renderAll();
      showToast('📣 広場につぶやきました (+15 EXP)');
    };
    document.getElementById('feed-search').oninput = renderPlaza;
    document.getElementById('feed-filter-tag').onchange = renderPlaza;
    document.getElementById('member-search').oninput = renderPlaza;
    document.getElementById('member-filter-role').onchange = renderPlaza;
    document.getElementById('fab-quick-post').onclick = () => {
      switchSubtab('plaza', 'feed');
      document.getElementById('feed-body').focus();
    };

    // 公開プロジェクトへのコメント送信
    document.addEventListener('submit', e => {
      const cForm = e.target.closest('[data-comment-form]');
      if (!cForm) return;
      e.preventDefault();
      const pid = cForm.dataset.commentForm;
      const input = cForm.querySelector('input');
      const txt = input.value.trim();
      if (!txt) return;
      const found = getAllProductsWithRoom().find(({ prod }) => prod.id === pid);
      if (found) {
        found.prod.comments.push({ author: state.profile.name, text: txt });
        found.prod.productExp.fan += 10;
        state.inbox.unshift({
          id: 'msg-' + Date.now(),
          type: 'cheer',
          from: state.profile.name,
          text: `【${found.prod.title}】${txt}`,
          date: nowLabel(),
          unread: true,
          quotedForPop: false
        });
        addPersonalExp('cheer', 12);
        input.value = '';
        saveState();
        renderAll();
        showToast('💬 応援コメントを送りました！(+12 EXP)');
      }
    });

    // 参加オファー送信 (#7)
    document.getElementById('form-send-offer').onsubmit = e => {
      e.preventDefault();
      const pid = document.getElementById('offer-product-id').value;
      const msg = document.getElementById('offer-message').value.trim();
      const found = getAllProductsWithRoom().find(({ prod }) => prod.id === pid);
      if (found && msg) {
        found.prod.offers.push({
          id: 'off-' + Date.now(),
          from: state.profile.name,
          message: msg,
          approvals: []
        });
        state.inbox.unshift({
          id: 'msg-' + Date.now(),
          type: 'offer',
          from: state.profile.name,
          text: `「${found.prod.title}」へ参加オファー：${msg}`,
          date: nowLabel(),
          unread: true,
          quotedForPop: false
        });
        document.getElementById('offer-message').value = '';
        closeModal('modal-offer');
        saveState();
        renderAll();
        showToast('🙋 参加オファーを送信しました！');
      }
    };

    // ご縁ルーム新規 & 新商品追加 (#1)
    document.getElementById('btn-new-room').onclick = () => {
      const name = prompt('新しいご縁ルーム名（例：〇〇農園 × △△工房）');
      if (!name || !name.trim()) return;
      const rid = 'room-' + Date.now();
      const pid = 'prod-' + Date.now();
      state.rooms.unshift({
        id: rid,
        name: name.trim(),
        partner: name.trim(),
        members: [state.profile.name, name.trim()],
        products: [{
          id: pid,
          title: '第1弾コラボ商品（企画中）',
          category: '新規コラボ',
          phase: '企画中',
          visibility: 'public',
          images: [],
          costRaw: 100,
          costLabor: 100,
          adoptedMaterialIds: [],
          priceSell: 500,
          productExp: { story: 10, fan: 10, quality: 10, market: 10 },
          stories: [],
          calendar: [],
          offers: [],
          reactions: { cheer: 0, eat: 0, visit: 0 },
          comments: []
        }]
      });
      state.activeRoomId = rid;
      state.activeProductId = pid;
      addPersonalExp('en', 20);
      saveState();
      renderAll();
      showToast('🤝 新しいご縁ルームを作成しました！');
    };

    document.getElementById('btn-new-product').onclick = () => {
      const room = getActiveRoom();
      if (!room) return;
      const title = prompt(`「${room.name}」に追加する新商品名（第2弾・別展開など）`);
      if (!title || !title.trim()) return;
      const pid = 'prod-' + Date.now();
      room.products.push({
        id: pid,
        title: title.trim(),
        category: 'コラボ商品',
        phase: '企画中',
        visibility: 'public',
        images: [],
        costRaw: 120,
        costLabor: 100,
        adoptedMaterialIds: [],
        priceSell: 550,
        productExp: { story: 15, fan: 10, quality: 10, market: 10 },
        stories: [{ id: 'st-' + Date.now(), author: state.profile.name, text: `新商品「${title.trim()}」の企画をスタート！`, date: nowLabel(), isPrivate: false }],
        calendar: [],
        offers: [],
        reactions: { cheer: 0, eat: 0, visit: 0 },
        comments: []
      });
      state.activeProductId = pid;
      addPersonalExp('craft', 20);
      saveState();
      renderAll();
      showToast('📦 新商品を追加しました！');
    };

    // フェーズ・公開範囲・原価変更
    document.getElementById('ws-phase-select').onchange = e => {
      const prod = getActiveProduct();
      if (!prod) return;
      prod.phase = e.target.value;
      prod.productExp.market += 15;
      saveState();
      renderAll();
      showToast(`🚩 フェーズを「${prod.phase}」へ更新（マルシェ棚に自動反映）`);
    };
    document.getElementById('ws-visibility-select').onchange = e => {
      const prod = getActiveProduct();
      if (!prod) return;
      prod.visibility = e.target.value;
      saveState();
      renderAll();
    };
    ['ws-cost-raw', 'ws-cost-labor', 'ws-price-sell'].forEach(id => {
      document.getElementById(id).oninput = () => {
        const prod = getActiveProduct();
        if (!prod) return;
        prod.costRaw = Number(document.getElementById('ws-cost-raw').value || 0);
        prod.costLabor = Number(document.getElementById('ws-cost-labor').value || 0);
        prod.priceSell = Number(document.getElementById('ws-price-sell').value || 0);
        saveState();
        renderEnWorkspace();
      };
    });

    // 写真追加（自動軽量リサイズ・最大6枚）
    document.getElementById('ws-image-input').onchange = e => {
      const file = e.target.files && e.target.files[0];
      const prod = getActiveProduct();
      if (!file || !prod) return;
      if ((prod.images || []).length >= 6) {
        showToast('⚠️ 1商品あたり最大6枚まで登録できます');
        return;
      }
      resizeImageFile(file, 640, dataUrl => {
        if (!prod.images) prod.images = [];
        prod.images.push(dataUrl);
        prod.productExp.story += 10;
        saveState();
        renderAll();
        showToast('📸 写真を軽量化してギャラリーへ追加しました！');
      });
      e.target.value = '';
    };

    // ストーリー投稿（MM/DDを検知してカレンダー自動追加）
    document.getElementById('form-story-post').onsubmit = e => {
      e.preventDefault();
      const prod = getActiveProduct();
      const txt = document.getElementById('ws-story-input').value.trim();
      const isPriv = document.getElementById('ws-story-private').checked;
      if (!prod || !txt) return;
      prod.stories.unshift({
        id: 'st-' + Date.now(),
        author: state.profile.name,
        text: txt,
        date: nowLabel(),
        isPrivate: isPriv
      });
      prod.productExp.story += 12;
      state.stats.storiesPosted += 1;
      addPersonalExp('craft', 12);

      // 日付（例: 12/6）自動抽出 → カレンダー追記 (#10)
      const m = txt.match(/(\d{1,2})\/(\d{1,2})/);
      if (m) {
        const mm = String(m[1]).padStart(2, '0');
        const dd = String(m[2]).padStart(2, '0');
        const year = new Date().getFullYear();
        prod.calendar.push({
          id: 'cal-' + Date.now(),
          date: `${year}-${mm}-${dd}`,
          title: txt.slice(0, 28)
        });
        state.stats.calendarsAdded += 1;
        showToast(`📅 ログ内の「${mm}/${dd}」を検知してカレンダーにも自動登録しました！`);
      } else {
        showToast('💬 開発ログを追記しました (+12 EXP)');
      }

      document.getElementById('ws-story-input').value = '';
      document.getElementById('ws-story-private').checked = false;
      saveState();
      renderAll();
    };

    // カレンダー手動追加
    document.getElementById('form-add-cal').onsubmit = e => {
      e.preventDefault();
      const prod = getActiveProduct();
      const date = document.getElementById('cal-date').value;
      const title = document.getElementById('cal-title').value.trim();
      if (!prod || !date || !title) return;
      prod.calendar.push({ id: 'cal-' + Date.now(), date, title });
      state.stats.calendarsAdded += 1;
      addPersonalExp('field', 10);
      document.getElementById('cal-title').value = '';
      saveState();
      renderAll();
      showToast('📅 共有カレンダーに予定を追加しました！');
    };

    // 印刷ボタン
    document.getElementById('btn-print-agreement').onclick = () => openPrintPreview('agreement');
    document.getElementById('btn-print-pop').onclick = () => openPrintPreview('pop');
    document.getElementById('btn-print-cards').onclick = () => openPrintPreview('cards');
    document.getElementById('btn-do-print').onclick = () => window.print();

    // カタログ分類切替
    document.getElementById('catalog-group-by').onchange = renderMarche;

    // プロフィール保存
    document.getElementById('form-profile').onsubmit = e => {
      e.preventDefault();
      state.profile = {
        name: document.getElementById('prof-name').value.trim() || 'ゲスト',
        role: document.getElementById('prof-role').value,
        area: document.getElementById('prof-area').value.trim(),
        skills: document.getElementById('prof-skills').value.trim(),
        bio: document.getElementById('prof-bio').value.trim(),
        mapPublic: document.getElementById('prof-map-public').checked
      };
      saveState();
      renderAll();
      showToast(`🔥 プロフィール保存完了！現在の熱量：${calcHeat(state.profile)}%`);
    };

    // カテゴリー別お問い合わせ (#19)
    document.getElementById('form-inquiry').onsubmit = e => {
      e.preventDefault();
      const category = document.getElementById('inq-category').value;
      const body = document.getElementById('inq-body').value.trim();
      if (!body) return;
      const meta = `EN•joy ${window.ENJOY_VERSION} / ${TAB_TITLES[currentTab]}`;
      state.inquiries.unshift({ id: 'inq-' + Date.now(), category, body, meta, date: nowLabel() });
      state.inbox.unshift({
        id: 'msg-' + Date.now(),
        type: 'ops',
        from: `お問い合わせ (${category})`,
        text: body,
        date: nowLabel(),
        unread: true,
        quotedForPop: false
      });
      document.getElementById('inq-body').value = '';
      closeModal('modal-inquiry');
      saveState();
      renderAll();
      showToast('✉️ お問い合わせを受け付けました！ありがとうございます');
    };

    // 運営お知らせバー設定 (#19)
    document.getElementById('form-admin-banner').onsubmit = e => {
      e.preventDefault();
      state.adminBanner = {
        type: document.getElementById('admin-banner-type').value,
        enabled: document.getElementById('admin-banner-enabled').checked,
        text: document.getElementById('admin-banner-input').value.trim()
      };
      bannerDismissed = false;
      saveState();
      renderAdminBanner();
      showToast('📢 運営お知らせバーを更新しました');
    };

    // JSONエクスポート / インポート / リセット
    document.getElementById('btn-export-json').onclick = () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enjoy_v5_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('💾 バックアップJSONをダウンロードしました');
    };

    document.getElementById('input-import-json').onchange = e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (!imported.rooms) throw new Error('invalid');
          state = imported;
          saveState();
          renderAll();
          showToast('⬆️ JSONからデータを復元しました！');
        } catch {
          showToast('⚠️ 正しいEN•joyのバックアップJSONではありません');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    };

    document.getElementById('btn-reset-demo').onclick = () => {
      if (!confirm('初期デモデータに戻しますか？（現在の編集内容は消去されます）')) return;
      state = window.createDefaultEnjoyState();
      saveState();
      renderAll();
      showToast('🔄 初期デモデータに戻しました');
    };
  }

  /* ---------- 起動 ---------- */
  bindEvents();
  renderAll();
})();