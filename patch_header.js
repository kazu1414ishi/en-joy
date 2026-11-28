/* =========================================================
   EN•joy スリム統合ヘッダー＆ハンバーガーメニュー（patch_header.js v1）
   ・ヘッダーは「ロゴ」＋「☰」の2要素のみ
   ・スクロール時は42pxすりガラスで残す（ロゴタップでトップ復帰）
   ・☰メニュー内に旧ヘッダー機能＋設定画面案内＋PC時ラボ直通を集約
   ========================================================= */

(function () {
  function escH(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function hasUnreadNotif() {
    const dot = document.querySelector('#enHdrBellBtn .en-hdr-dot');
    if (!dot) return false;
    const st = window.getComputedStyle(dot);
    return st.display !== 'none' && st.visibility !== 'hidden' && st.opacity !== '0';
  }

  function syncBurgerUnread() {
    const btn = document.getElementById('enUnifiedBurgerBtn');
    if (btn) btn.classList.toggle('has-unread', hasUnreadNotif());
  }

  function closeHdrDrawer() {
    document.getElementById('en-hdr-drawer')?.classList.remove('open');
    document.getElementById('en-hdr-backdrop')?.classList.remove('open');
  }

  function openHdrDrawer() {
    ensureDrawerDom();
    renderHdrDrawerBody();
    document.getElementById('en-hdr-drawer')?.classList.add('open');
    document.getElementById('en-hdr-backdrop')?.classList.add('open');
  }

  function ensureDrawerDom() {
    if (document.getElementById('en-hdr-drawer')) return;

    const backdrop = document.createElement('div');
    backdrop.id = 'en-hdr-backdrop';
    backdrop.onclick = closeHdrDrawer;

    const drawer = document.createElement('aside');
    drawer.id = 'en-hdr-drawer';
    drawer.setAttribute('aria-label', 'EN•joy メニュー');
    drawer.innerHTML = `
      <div class="en-hdr-d-head">
        <span class="en-hdr-d-brand">EN•joy メニュー</span>
        <button type="button" class="en-hdr-d-close" id="enHdrDrawerClose" aria-label="閉じる">✕</button>
      </div>
      <div class="en-hdr-d-body" id="enHdrDrawerBody"></div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
    document.getElementById('enHdrDrawerClose').onclick = closeHdrDrawer;
  }

  function renderHdrDrawerBody() {
    const body = document.getElementById('enHdrDrawerBody');
    if (!body) return;

    const isPc = document.documentElement.classList.contains('en-pc-mode');
    const sbOpen = document.documentElement.classList.contains('en-pc-sb-open');
    const unread = hasUnreadNotif();
    const hasMobileToggle = !!document.getElementById('toggleMobileBtn');

    // PC時：最近のEN•ラボ（最新順）を取得
    let recentLabsHtml = '';
    if (isPc && typeof enViewState !== 'undefined' && Array.isArray(enViewState.labs)) {
      let recentIds = [];
      try { recentIds = JSON.parse(localStorage.getItem('en_pc_recent_rooms') || '[]'); } catch (e) {}
      const myLabs = enViewState.labs
        .filter(l => l.mode === 'my_active' || l.mode === 'my_solo')
        .sort((a, b) => {
          const ia = recentIds.indexOf(a.id), ib = recentIds.indexOf(b.id);
          if (ia === -1 && ib === -1) return 0;
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        })
        .slice(0, 5);

      recentLabsHtml = `
        <div>
          <div class="en-hdr-d-sec-title">🖥️ PCワークスペース</div>
          <div class="en-hdr-d-group">
            <button type="button" class="en-hdr-d-item" id="enMenuTogglePcSb">
              <span class="en-hdr-d-ico">📑</span>
              <span class="en-hdr-d-txt">
                <strong>左サイドバー表示（現在：${sbOpen ? 'ON' : 'OFF'}）</strong>
                <small>PC画面の左にナビとラボ一覧を常駐表示</small>
              </span>
              <span class="en-hdr-d-arrow">${sbOpen ? '閉じる' : '開く'}</span>
            </button>
            ${myLabs.map(l => `
              <button type="button" class="en-hdr-d-item" data-hdrlab="${l.id}" data-hdrsolo="${l.mode === 'my_solo' ? '1' : '0'}">
                <span class="en-hdr-d-ico">${l.mode === 'my_solo' ? '📓' : '🧪'}</span>
                <span class="en-hdr-d-txt">
                  <strong>${escH(l.title)}</strong>
                  <small>${l.mode === 'my_solo' ? '1人準備ノートを開く' : '開発ルームへ直接ワープ'}</small>
                </span>
                <span class="en-hdr-d-arrow">➔</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    body.innerHTML = `
      <div>
        <div class="en-hdr-d-sec-title">⚡ クイック機能（ヘッダー集約）</div>
        <div class="en-hdr-d-group">
          <button type="button" class="en-hdr-d-item" id="enMenuAsk">
            <span class="en-hdr-d-ico">💬</span>
            <span class="en-hdr-d-txt">
              <strong>ちょっと聞く</strong>
              <small>使い方の疑問・アイデア相談をすぐ聞く</small>
            </span>
            <span class="en-hdr-d-arrow">➔</span>
          </button>

          <button type="button" class="en-hdr-d-item" id="enMenuBell">
            <span class="en-hdr-d-ico">🔔</span>
            <span class="en-hdr-d-txt">
              <strong>お知らせ・通知</strong>
              <small>ラボの更新・投票・コメントを確認</small>
            </span>
            ${unread ? '<span class="en-hdr-d-pill">新着</span>' : '<span class="en-hdr-d-arrow">➔</span>'}
          </button>
        </div>
      </div>

      <div>
        <div class="en-hdr-d-sec-title">⚙️ 設定画面へのご案内</div>
        <div class="en-hdr-d-group">
          <button type="button" class="en-hdr-d-item highlight" id="enMenuSet">
            <span class="en-hdr-d-ico">⚙️</span>
            <span class="en-hdr-d-txt">
              <strong>設定・マイ名刺を開く</strong>
              <small>プロフィール・性格診断・表示設定・データ管理へ</small>
            </span>
            <span class="en-hdr-d-arrow">開く ➔</span>
          </button>

          <button type="button" class="en-hdr-d-item" id="enMenuTheme">
            <span class="en-hdr-d-ico">🎨</span>
            <span class="en-hdr-d-txt">
              <strong>画面の着せ替え・配色設定</strong>
              <small>標準・和風・ダーク・クールをワンタップ切替</small>
            </span>
            <span class="en-hdr-d-arrow">➔</span>
          </button>

          <div class="en-hdr-d-guide">
            <strong>💡 設定画面でできること</strong><br>
            マイ名刺の編集、仕事スタイル性格診断の見直し、文字サイズ・公開範囲の調整は上の<strong>「設定・マイ名刺を開く」</strong>からいつでも変更できます。
          </div>
        </div>
      </div>

      ${recentLabsHtml}

      ${hasMobileToggle ? `
        <div>
          <div class="en-hdr-d-sec-title">🛠️ 表示切替</div>
          <div class="en-hdr-d-group">
            <button type="button" class="en-hdr-d-item" id="enMenuMobPreview">
              <span class="en-hdr-d-ico">📱</span>
              <span class="en-hdr-d-txt">
                <strong>スマホ / PC 表示プレビュー切替</strong>
                <small>レイアウトの動作確認用スイッチ</small>
              </span>
              <span class="en-hdr-d-arrow">切替</span>
            </button>
          </div>
        </div>
      ` : ''}
    `;

    // 各ボタンを既存のDOMイベントへ安全にブリッジ
    document.getElementById('enMenuAsk')?.addEventListener('click', () => {
      closeHdrDrawer();
      document.getElementById('enHdrAskBtn')?.click();
    });
    document.getElementById('enMenuBell')?.addEventListener('click', () => {
      closeHdrDrawer();
      document.getElementById('enHdrBellBtn')?.click();
      setTimeout(syncBurgerUnread, 200);
    });
    document.getElementById('enMenuSet')?.addEventListener('click', () => {
      closeHdrDrawer();
      document.getElementById('enHdrSetBtn')?.click();
    });
    document.getElementById('enMenuTheme')?.addEventListener('click', () => {
      closeHdrDrawer();
      const fab = document.getElementById('en-theme-fab');
      if (fab) fab.click();
      else document.getElementById('en-theme-drawer')?.classList.toggle('open');
    });
    document.getElementById('enMenuMobPreview')?.addEventListener('click', () => {
      closeHdrDrawer();
      document.getElementById('toggleMobileBtn')?.click();
    });
    document.getElementById('enMenuTogglePcSb')?.addEventListener('click', () => {
      const next = !document.documentElement.classList.contains('en-pc-sb-open');
      document.documentElement.classList.toggle('en-pc-sb-open', next);
      localStorage.setItem('en_pc_sb_open', next ? '1' : '0');
      closeHdrDrawer();
    });
    body.querySelectorAll('[data-hdrlab]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-hdrlab');
        const isSolo = btn.getAttribute('data-hdrsolo') === '1';
        closeHdrDrawer();
        if (isSolo && typeof openSoloNotebookModal === 'function') openSoloNotebookModal(id);
        else if (typeof openEnRoomModal === 'function') openEnRoomModal(id, 'board', false);
      };
    });
  }

  function mountUnifiedHeader() {
    const inner = document.querySelector('#topHeader .header-inner');
    if (!inner) return;

    if (!document.getElementById('enUnifiedBurgerBtn')) {
      const btn = document.createElement('button');
      btn.id = 'enUnifiedBurgerBtn';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'メニューを開く');
      btn.title = 'メニュー（通知・ちょっと聞く・設定）';
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <path d="M4 7h16M4 12h16M4 17h16"/>
        </svg>
        <span class="en-uhdr-badge" aria-hidden="true"></span>
      `;
      btn.onclick = openHdrDrawer;
      inner.appendChild(btn);
    }

    // ロゴタップで最上部へスッと戻る
    const brand = inner.querySelector('.brand-wrap');
    if (brand && !brand.dataset.enTopBound) {
      brand.dataset.enTopBound = '1';
      brand.addEventListener('click', () => {
        if (window.scrollY > 30) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    syncBurgerUnread();
  }

  function onScrollHeader() {
    document.documentElement.classList.toggle('en-hdr-scrolled', window.scrollY > 24);
  }

  window.addEventListener('scroll', onScrollHeader, { passive: true });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeHdrDrawer(); });

  window.addEventListener('DOMContentLoaded', () => {
    mountUnifiedHeader();
    onScrollHeader();
    setTimeout(mountUnifiedHeader, 300);
    setTimeout(mountUnifiedHeader, 700);
  });
})();