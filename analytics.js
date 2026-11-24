/* ============================================================
   EN•joy v5.1 — マイ買い物帳(#13) ＆ 行動アナリティクス(#18)
   ファイル名: analytics.js
   ※ index.html の <script src="board.js"></script> の直後に読み込むだけで動作します
   ============================================================ */

(function () {
  'use strict';

  const BOOK_KEY = 'enjoy_v51_shopping_book';
  const LOG_KEY = 'enjoy_v51_analytics';

  const TAB_NAMES = {
    home: '🏠 ホーム',
    plaza: '💬 広場・めぐり',
    en: '🤝 EN ご縁・開発室',
    marche: '🎪 マルシェ・旬',
    my: '🏆 マイ・輪'
  };

  let book = loadJson(BOOK_KEY, {
    favorites: [
      { id: 'prod-1', title: '蜜たっぷり規格外りんごの無添加ジャム', room: '青木りんご園 × なにわ工房', price: 650, addedAt: '11/24' }
    ],
    history: [
      { id: 'prod-3', title: '完熟トマトの食べる和風スパイスソース', room: '高槻トマト × 紙工アトリエ縁', price: 780, viewedAt: '11/24 19:30' }
    ],
    purchases: [
      { id: 'pur-1', title: '完熟トマトの食べる和風スパイスソース', price: 780, rating: 5, memo: 'パスタにも冷奴にも最高！次回マルシェで2本リピート確定。', date: '11/20' }
    ]
  });

  let stats = loadJson(LOG_KEY, {
    sessions: 1,
    tabClicks: { home: 1, plaza: 0, en: 0, marche: 0, my: 0 },
    tabSeconds: { home: 0, plaza: 0, en: 0, marche: 0, my: 0 },
    buttonClicks: {}
  });

  let activeTab = 'home';
  let tabEnterTime = Date.now();
  let bookSubtab = 'fav';

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return fallback;
  }

  function saveJson(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
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

  function getAppProducts() {
    try {
      const raw = localStorage.getItem(window.ENJOY_STORAGE_KEY);
      const st = raw ? JSON.parse(raw) : window.createDefaultEnjoyState();
      const list = [];
      (st.rooms || []).forEach(r => {
        (r.products || []).forEach(p => list.push({ id: p.id, title: p.title, room: r.name, price: p.priceSell }));
      });
      return list;
    } catch (e) {
      return [];
    }
  }

  /* ---------- 専用CSS注入 ---------- */
  function injectStyles() {
    if (document.getElementById('enjoy-analytics-style')) return;
    const style = document.createElement('style');
    style.id = 'enjoy-analytics-style';
    style.textContent = `
      .book-item {
        background: var(--bg); border: 1px solid var(--border); border-radius: 12px;
        padding: 10px 12px; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;
      }
      .book-stars { color: var(--gold); font-size: 0.95rem; letter-spacing: 1px; }
      .an-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 10px 0; }
      .an-bar-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; font-size: 0.84rem; }
      .an-bar-head { display: flex; justify-content: space-between; font-weight: 700; }
      .an-alert {
        background: #FBECE6; border: 1px solid #E8B8A6; color: #8A3218;
        border-radius: 10px; padding: 10px 12px; font-size: 0.83rem; margin-top: 10px;
      }
      @media (max-width: 860px) { .an-grid { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
  }

  /* ---------- 1. ヘッダーに「❤️ 買い物帳」ボタンを追加 ---------- */
  function mountHeaderButton() {
    const right = document.querySelector('.top-header-right');
    if (!right || document.getElementById('btn-open-book')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'btn-open-book';
    btn.className = 'header-icon-btn';
    btn.title = 'マイ買い物帳 (#13)';
    btn.innerHTML = `<span>❤️</span><span class="pc-only">買い物帳</span><span id="badge-book" class="count-badge">${book.favorites.length}</span>`;
    btn.onclick = () => {
      renderBookModal();
      document.getElementById('modal-book').classList.remove('hidden');
    };
    right.insertBefore(btn, right.firstChild);
  }

  function updateBookBadge() {
    const b = document.getElementById('badge-book');
    if (b) b.textContent = book.favorites.length;
  }

  /* ---------- 2. 買い物帳モーダル (#13) ---------- */
  function ensureBookModal() {
    if (document.getElementById('modal-book')) return;
    const m = document.createElement('div');
    m.id = 'modal-book';
    m.className = 'modal hidden';
    m.innerHTML = `
      <div class="modal-backdrop" data-book-close="true"></div>
      <div class="modal-sheet modal-lg">
        <div class="modal-head">
          <h2>❤️ マイ買い物帳（お気に入り・履歴・⭐メモ）</h2>
          <button type="button" class="icon-close" data-book-close="true">✕</button>
        </div>
        <div class="modal-body">
          <div class="filter-bar" style="margin-bottom:12px;">
            <button type="button" class="chip-filter active" data-book-tab="fav">❤️ お気に入り</button>
            <button type="button" class="chip-filter" data-book-tab="hist">🕒 閲覧履歴</button>
            <button type="button" class="chip-filter" data-book-tab="pur">🛍️ 購入＆⭐メモ</button>
          </div>
          <div id="book-modal-content"></div>
        </div>
      </div>
    `;
    document.body.appendChild(m);

    m.addEventListener('click', e => {
      if (e.target.closest('[data-book-close]')) {
        m.classList.add('hidden');
        return;
      }
      const tabBtn = e.target.closest('[data-book-tab]');
      if (tabBtn) {
        bookSubtab = tabBtn.dataset.bookTab;
        m.querySelectorAll('[data-book-tab]').forEach(b => b.classList.toggle('active', b === tabBtn));
        renderBookModal();
        return;
      }
      const delFav = e.target.closest('[data-del-fav]');
      if (delFav) {
        book.favorites = book.favorites.filter(x => x.id !== delFav.dataset.delFav);
        saveJson(BOOK_KEY, book);
        updateBookBadge();
        renderBookModal();
        return;
      }
      const delPur = e.target.closest('[data-del-pur]');
      if (delPur) {
        book.purchases = book.purchases.filter(x => x.id !== delPur.dataset.delPur);
        saveJson(BOOK_KEY, book);
        renderBookModal();
        return;
      }
      const addFavSel = e.target.closest('#btn-quick-add-fav');
      if (addFavSel) {
        const sel = document.getElementById('book-prod-select');
        const prod = getAppProducts().find(p => p.id === sel.value);
        if (prod && !book.favorites.some(f => f.id === prod.id)) {
          book.favorites.unshift({ ...prod, addedAt: nowShort() });
          saveJson(BOOK_KEY, book);
          updateBookBadge();
          renderBookModal();
        }
      }
    });
  }

  function renderBookModal() {
    const body = document.getElementById('book-modal-content');
    if (!body) return;
    const allProds = getAppProducts();

    if (bookSubtab === 'fav') {
      body.innerHTML = `
        <div class="voice-input-row" style="margin-bottom:12px;">
          <select id="book-prod-select" class="input">
            ${allProds.map(p => `<option value="${esc(p.id)}">${esc(p.title)} (¥${p.price})</option>`).join('')}
          </select>
          <button type="button" id="btn-quick-add-fav" class="btn btn-primary btn-sm">❤️ 追加</button>
        </div>
        <div class="card-stack">
          ${book.favorites.length ? book.favorites.map(f => `
            <div class="book-item">
              <div>
                <strong>${esc(f.title)}</strong>
                <div class="hint-text" style="margin:0;">${esc(f.room)} ／ ¥${f.price} ・ 登録 ${esc(f.addedAt)}</div>
              </div>
              <button type="button" class="text-btn" data-del-fav="${esc(f.id)}">解除</button>
            </div>
          `).join('') : '<p class="hint-text">お気に入りはまだありません。</p>'}
        </div>
      `;
    } else if (bookSubtab === 'hist') {
      body.innerHTML = `
        <div class="card-stack">
          ${book.history.length ? book.history.map(h => `
            <div class="book-item">
              <div>
                <strong>${esc(h.title)}</strong>
                <div class="hint-text" style="margin:0;">${esc(h.room)} ／ ¥${h.price} ・ 閲覧 ${esc(h.viewedAt)}</div>
              </div>
            </div>
          `).join('') : '<p class="hint-text">閲覧履歴はまだありません。商品をタップすると自動で記録されます。</p>'}
        </div>
      `;
    } else {
      body.innerHTML = `
        <form id="form-add-purchase" class="stack-form" style="margin-bottom:14px;">
          <div class="form-row-2">
            <input type="text" id="pur-title" class="input" placeholder="買った商品名" required />
            <select id="pur-rating" class="input">
              <option value="5">⭐⭐⭐⭐⭐ (絶対リピート！)</option>
              <option value="4">⭐⭐⭐⭐ (また買いたい)</option>
              <option value="3">⭐⭐⭐ (よかった)</option>
              <option value="2">⭐⭐ (ふつう)</option>
              <option value="1">⭐ (メモのみ)</option>
            </select>
          </div>
          <div class="voice-input-row">
            <input type="text" id="pur-memo" class="input" placeholder="味・使い心地・次回メモ" />
            <button type="submit" class="btn btn-primary btn-sm">記録する</button>
          </div>
        </form>
        <div class="card-stack">
          ${book.purchases.map(p => `
            <div class="book-item">
              <div>
                <div class="book-stars">${'★'.repeat(p.rating)}${'☆'.repeat(5 - p.rating)}</div>
                <strong>${esc(p.title)}</strong> <span class="hint-text">(${esc(p.date)})</span>
                <p style="font-size:0.84rem; margin-top:4px;">${esc(p.memo)}</p>
              </div>
              <button type="button" class="text-btn" data-del-pur="${esc(p.id)}">削除</button>
            </div>
          `).join('')}
        </div>
      `;
      const form = document.getElementById('form-add-purchase');
      if (form) {
        form.onsubmit = e => {
          e.preventDefault();
          const title = document.getElementById('pur-title').value.trim();
          if (!title) return;
          book.purchases.unshift({
            id: 'pur-' + Date.now(),
            title,
            price: 0,
            rating: Number(document.getElementById('pur-rating').value),
            memo: document.getElementById('pur-memo').value.trim(),
            date: nowShort().split(' ')[0]
          });
          saveJson(BOOK_KEY, book);
          renderBookModal();
        };
      }
    }
  }

  /* ---------- 3. 行動アナリティクス計測 & パネル描画 (#18) ---------- */
  function flushStayTime() {
    const now = Date.now();
    const sec = Math.max(0, Math.round((now - tabEnterTime) / 1000));
    stats.tabSeconds[activeTab] = (stats.tabSeconds[activeTab] || 0) + sec;
    tabEnterTime = now;
    saveJson(LOG_KEY, stats);
  }

  function renderAnalyticsCard() {
    const ops = document.getElementById('my-ops');
    if (!ops) return;

    let card = document.getElementById('analytics-ops-card');
    if (!card) {
      card = document.createElement('article');
      card.id = 'analytics-ops-card';
      card.className = 'card';
      ops.insertBefore(card, ops.firstChild);
    }

    flushStayTime();
    const totalClicks = Object.values(stats.tabClicks).reduce((a, b) => a + b, 0) || 1;
    const totalSec = Object.values(stats.tabSeconds).reduce((a, b) => a + b, 0);
    const unusedTabs = Object.keys(TAB_NAMES).filter(k => (stats.tabClicks[k] || 0) === 0);

    card.innerHTML = `
      <div class="card-head">
        <div>
          <span class="eyebrow">EN•joy v5.1 — 引き算と改善のためのデータ (#18)</span>
          <h2>📊 ユーザー行動アナリティクス</h2>
        </div>
        <button type="button" id="btn-copy-an-report" class="btn btn-outline btn-sm">📋 改善レポートをコピー</button>
      </div>

      <div class="an-grid">
        <div class="stat-tile">
          <div class="stat-tile-label">累計起動セッション</div>
          <div class="stat-tile-val">${stats.sessions} 回</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile-label">累計アプリ滞在時間</div>
          <div class="stat-tile-val">${Math.floor(totalSec / 60)}分 ${totalSec % 60}秒</div>
        </div>
      </div>

      <h3 class="sub-heading">📌 5タブ別 利用率 ＆ 滞在時間</h3>
      ${Object.entries(TAB_NAMES).map(([k, label]) => {
        const cnt = stats.tabClicks[k] || 0;
        const sec = stats.tabSeconds[k] || 0;
        const pct = Math.round((cnt / totalClicks) * 100);
        return `
          <div class="an-bar-row">
            <div class="an-bar-head"><span>${label}</span><span>${cnt}回 (${pct}%) ／ ${sec}秒</span></div>
            <div class="progress-track"><div class="progress-fill" style="width:${pct}%;"></div></div>
          </div>
        `;
      }).join('')}

      ${unusedTabs.length ? `
        <div class="an-alert">
          ⚠️ <strong>未使用機能アラート：</strong> ${unusedTabs.map(k => TAB_NAMES[k]).join('・')} がまだ開かれていません。導線を見直すヒントになります。
        </div>
      ` : '<p class="hint-text">✅ 全5タブがバランスよく使われています！</p>'}
    `;

    document.getElementById('btn-copy-an-report').onclick = () => {
      const report = [
        `【EN•joy 行動アナリティクスレポート】(${nowShort()})`,
        `累計セッション: ${stats.sessions}回 / 累計滞在: ${totalSec}秒`,
        ...Object.entries(TAB_NAMES).map(([k, label]) => `- ${label}: ${stats.tabClicks[k] || 0}回 (${stats.tabSeconds[k] || 0}秒)`),
        unusedTabs.length ? `未使用アラート: ${unusedTabs.map(k => TAB_NAMES[k]).join(', ')}` : '未使用アラート: なし'
      ].join('\n');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(report).then(() => alert('📋 改善レポートをクリップボードにコピーしました！'));
      } else {
        prompt('以下をコピーしてください', report);
      }
    };
  }

  /* ---------- 4. クリック＆閲覧履歴の自動トラッキング ---------- */
  function bindTracking() {
    document.addEventListener('click', e => {
      const tabBtn = e.target.closest('[data-tab]');
      if (tabBtn) {
        flushStayTime();
        activeTab = tabBtn.dataset.tab;
        stats.tabClicks[activeTab] = (stats.tabClicks[activeTab] || 0) + 1;
        saveJson(LOG_KEY, stats);
        if (activeTab === 'my') renderAnalyticsCard();
      }

      // 商品タップで閲覧履歴に自動追加
      const prodEl = e.target.closest('[data-open-prod]');
      if (prodEl) {
        const pid = prodEl.dataset.openProd.split('|')[1];
        const prod = getAppProducts().find(p => p.id === pid);
        if (prod) {
          book.history = book.history.filter(h => h.id !== prod.id);
          book.history.unshift({ ...prod, viewedAt: nowShort() });
          if (book.history.length > 20) book.history.pop();
          saveJson(BOOK_KEY, book);
        }
      }
    });

    window.addEventListener('beforeunload', flushStayTime);
  }

  /* ---------- 起動 ---------- */
  function init() {
    stats.sessions = (stats.sessions || 0) + 1;
    saveJson(LOG_KEY, stats);
    injectStyles();
    mountHeaderButton();
    ensureBookModal();
    renderAnalyticsCard();
    bindTracking();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();