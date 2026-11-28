/* =========================================================
   EN•joy 人間工学PCデスクトップ コントローラー（patch_pc.js v4）
   ・☰ 三本線開閉式サイドバー ＋「最近のEN•ラボ（最新順）」履歴直通
   ・開発ルーム5段→1本統合ヘッダー ＋ 境界線ドラッグリサイズ2画面↔フル集中
   ・ボードタブ自動スリム化（現在＋ピン留め上位だけ表示で認知負荷ゼロ）
   ========================================================= */

(function () {
  let forceMobilePreview = false;
  let sidebarOpen = localStorage.getItem('en_pc_sb_open') === '1'; // デフォルトは閉じて広々
  let recentRoomIds = [];
  try { recentRoomIds = JSON.parse(localStorage.getItem('en_pc_recent_rooms') || '[]'); } catch (e) {}

  const pcWs = {
    layout: 'split', // 'split'（左右2画面） | 'single'（1画面フル集中）
    leftPct: 36,     // 境界線ドラッグで24〜58%まで自由調整（ダブルクリックで36%復帰）
    leftTab: 'talk'  // 'talk' | 'progress' | 'story'
  };

  function pcEsc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function isMobilePreviewActive() {
    const bodyCls = document.body ? document.body.className : '';
    const shell = document.getElementById('appShell');
    const shellCls = shell ? shell.className : '';
    return forceMobilePreview || /mobile-preview|mobile-mode|is-mobile|preview-mobile/i.test(bodyCls + ' ' + shellCls);
  }

  function isPcActive() {
    return document.documentElement.classList.contains('en-pc-mode');
  }

  // ☰ サイドバー開閉切替
  function applySidebarState() {
    document.documentElement.classList.toggle('en-pc-sb-open', sidebarOpen);
    localStorage.setItem('en_pc_sb_open', sidebarOpen ? '1' : '0');
    const btn = document.getElementById('enPcBurgerBtn');
    if (btn) btn.setAttribute('aria-expanded', sidebarOpen ? 'true' : 'false');
  }

  function mountBurgerButton() {
    const brand = document.querySelector('#topHeader .brand-wrap');
    if (!brand || document.getElementById('enPcBurgerBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'enPcBurgerBtn';
    btn.type = 'button';
    btn.className = 'en-pc-burger-btn';
    btn.title = 'メニューを開閉（サイドバー）';
    btn.innerHTML = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`;
    btn.onclick = () => {
      sidebarOpen = !sidebarOpen;
      applySidebarState();
    };
    brand.parentNode.insertBefore(btn, brand);
  }

  // 🧪 最近のEN•ラボを最新順で記録 ＆ サイドバーへ描画（Gemini風！）
  function recordRecentRoom(labId) {
    if (!labId) return;
    recentRoomIds = [labId, ...recentRoomIds.filter(id => id !== labId)].slice(0, 12);
    localStorage.setItem('en_pc_recent_rooms', JSON.stringify(recentRoomIds));
    renderSidebarRooms();
  }

  function renderSidebarRooms() {
    const nav = document.getElementById('bottomNav');
    if (!nav || typeof enViewState === 'undefined' || !Array.isArray(enViewState.labs)) return;

    let box = document.getElementById('enPcSidebarRooms');
    if (!box) {
      box = document.createElement('div');
      box.id = 'enPcSidebarRooms';
      box.className = 'en-pc-sb-rooms';
      nav.appendChild(box);
    }

    // 自分の進行中・1人準備中ラボを「最近開いた順」にソート
    const myLabs = enViewState.labs.filter(l => l.mode === 'my_active' || l.mode === 'my_solo');
    myLabs.sort((a, b) => {
      const ia = recentRoomIds.indexOf(a.id);
      const ib = recentRoomIds.indexOf(b.id);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    const openModal = document.getElementById('en-room-modal');
    const curOpenId = (openModal && openModal.classList.contains('open')) ? enViewState.roomOpenId : null;

    box.innerHTML = `
      <div class="en-pc-sb-head">
        <span>🧪 最近のEN•ラボ</span>
        <button type="button" class="en-pc-sb-new" id="enPcSbNewLab">＋ 新規</button>
      </div>
      ${myLabs.slice(0, 7).map(l => {
        const isSolo = l.mode === 'my_solo';
        return `
          <button type="button" class="en-pc-sb-room-btn ${curOpenId === l.id ? 'is-current' : ''}" data-sbroom="${l.id}" data-sbsolo="${isSolo ? '1' : '0'}">
            <span class="en-pc-sb-room-dot ${isSolo ? 'solo' : ''}"></span>
            <span class="en-pc-sb-room-title">${pcEsc(l.title)}</span>
          </button>
        `;
      }).join('')}
    `;

    document.getElementById('enPcSbNewLab')?.addEventListener('click', () => {
      if (typeof openCreateSoloLabSheet === 'function') openCreateSoloLabSheet();
    });
    box.querySelectorAll('[data-sbroom]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-sbroom');
        const isSolo = btn.getAttribute('data-sbsolo') === '1';
        recordRecentRoom(id);
        if (isSolo && typeof openSoloNotebookModal === 'function') openSoloNotebookModal(id);
        else if (typeof openEnRoomModal === 'function') openEnRoomModal(id, 'board', false);
      };
    });
  }

  // 左サイドバー5タブのフル表記化＆ヘッダー文字付きボタン化
  const NAV_META = {
    home: { short: 'ホーム',   full: 'ホーム',         sub: '名刺・全体状況' },
    feed: { short: '縁',       full: '縁を繋げる',     sub: 'つぶやき・人材' },
    en:   { short: 'ラボ',     full: 'EN•ラボ',        sub: '開発・AIディア' },
    tips: { short: '役立ち',   full: '役立ちコーナー', sub: '12月の旬・献立' },
    shop: { short: 'マルシェ', full: 'EN•マルシェ',    sub: '巣立ち・厳選ギア' }
  };

  function syncNavLabels(isPc) {
    document.querySelectorAll('#bottomNav > button[data-tab]').forEach(btn => {
      const meta = NAV_META[btn.getAttribute('data-tab')];
      if (!meta) return;
      const lbl = btn.querySelector('.en-btn-label');
      if (!lbl) return;
      lbl.textContent = isPc ? meta.full : meta.short;
      if (!btn.querySelector('.en-pc-nav-col')) {
        const col = document.createElement('span');
        col.className = 'en-pc-nav-col';
        lbl.parentNode.insertBefore(col, lbl);
        col.appendChild(lbl);
        const sub = document.createElement('span');
        sub.className = 'en-pc-nav-sub';
        sub.textContent = meta.sub;
        col.appendChild(sub);
      }
    });
  }

  function syncHeaderLabels() {
    [['enHdrAskBtn','ちょっと聞く'],['enHdrBellBtn','通知'],['enHdrSetBtn','設定・名刺']].forEach(([id, txt]) => {
      const btn = document.getElementById(id);
      if (!btn || btn.querySelector('.en-pc-hdr-txt')) return;
      const span = document.createElement('span');
      span.className = 'en-pc-hdr-txt';
      span.textContent = txt;
      const dot = btn.querySelector('.en-hdr-dot');
      if (dot) btn.insertBefore(span, dot);
      else btn.appendChild(span);
    });
  }

  function syncPcMode() {
    const wasPc = isPcActive();
    const isPc = window.innerWidth >= 820 && !isMobilePreviewActive();
    document.documentElement.classList.toggle('en-pc-mode', isPc);
    applySidebarState();
    mountBurgerButton();
    syncNavLabels(isPc);
    syncHeaderLabels();
    renderSidebarRooms();

    const modal = document.getElementById('en-room-modal');
    if (wasPc !== isPc && modal && modal.classList.contains('open') && typeof window.renderEnRoomModal === 'function') {
      window.renderEnRoomModal();
    }
  }

  // =========================================================
  // 🤖 AI伴走ポップシート（常駐帯を廃止して必要なときだけ呼ぶ）
  // =========================================================
  function openAiAssistantSheet(lab, d) {
    const guide = typeof getAiCopilotGuidance === 'function'
      ? getAiCopilotGuidance(d)
      : { phase: '開発中', msg: 'ボードを使って企画を詰めましょう', btn: 'ボードへ', tab: 'board', tool: 'cost' };

    openEnSheetHtml(`🤖 AI開発ナビ（${guide.phase}）`, '今の進行状況に合わせたおすすめの次の一手', `
      <div class="en-formula" style="border-color:var(--en-accent);">
        <div>${guide.msg}</div>
        <button class="en-act-btn primary" style="align-self:flex-start;margin-top:6px;" id="enAiJumpGuide">${guide.btn}を開く ➔</button>
      </div>
      <button class="en-sheet-item" onclick="closeEnSheet();openAiTranscriptScan('${lab.id}')">
        <span>✨ トークをAI議事録スキャン<br><small class="en-meta">直近の会話から決定事項・タスク・試作案を一括抽出</small></span><span>➔</span>
      </button>
      <button class="en-sheet-item" onclick="closeEnSheet();runAiToolAssist('${lab.id}','${d.selectedTool}')">
        <span>⚡ いま開いているボードをAI補完<br><small class="en-meta">市場トレンドと原価目安から自動で下書き提案</small></span><span>➔</span>
      </button>
    `);

    document.getElementById('enAiJumpGuide')?.addEventListener('click', () => {
      closeEnSheet();
      enViewState.roomTab = guide.tab;
      if (guide.tool) {
        if (!d.activeTools.includes(guide.tool)) d.activeTools.push(guide.tool);
        d.selectedTool = guide.tool;
      }
      window.renderEnRoomModal();
    });
  }

  // ⋯ ルームその他メニュー（ヘッダーからボタンを減らしてスッキリ格納）
  function openRoomMoreSheet(lab) {
    openEnSheetHtml('⋯ ルームメニュー', lab.title, `
      <button class="en-sheet-item" onclick="closeEnSheet();openProjectReportSheet('${lab.id}')">
        <span>📄 商品企画書レポートを1タップ生成<br><small class="en-meta">全ボードの内容をテキスト企画書に自動統合</small></span><span>➔</span>
      </button>
      <button class="en-sheet-item" onclick="closeEnSheet();enViewState.roomViewAsFan=true;renderEnRoomModal();">
        <span>👀 外からの見え方（ファン公開画面）を確認<br><small class="en-meta">買い手や応援者からどう見えるかプレビュー</small></span><span>➔</span>
      </button>
      <button class="en-sheet-item" onclick="closeEnSheet();enAiProEnabled=!enAiProEnabled;renderEnRoomModal();enToast(enAiProEnabled?'✨ Proモード ON':'無料モードへ切替');">
        <span>✨ 実運用Proモード切替<br><small class="en-meta">現在：${enAiProEnabled ? 'Pro ON（全機能有効）' : '無料モード'}</small></span><span>切替</span>
      </button>
      <button class="en-sheet-item" onclick="closeEnSheet();openBoardHubSheet('${lab.id}')">
        <span>🗂️ 全開発ボード一覧・管理<br><small class="en-meta">検索・ピン留め・カスタムボード追加</small></span><span>➔</span>
      </button>
    `);
  }

  // =========================================================
  // 左ペイン（💬 トーク / ✅ 進行 / 📌 記録 の3つだけに厳選）
  // =========================================================
  function renderLeftPaneBody(container, lab, d) {
    const lt = pcWs.leftTab;

    if (lt === 'talk') {
      container.innerHTML = `
        <div class="en-pc-pane-scroll" id="enPcLeftScroll">
          ${enViewState.roomMessages.map((m, i) => `
            <div class="en-chat-bubble ${m.me ? 'me' : ''}" data-pcmsg="${i}">
              ${!m.me ? `<strong style="font-size:11px;opacity:0.8;">${pcEsc(m.sender)}</strong><br>` : ''}${pcEsc(m.text)}
              ${m.image ? `<img class="en-chat-img" src="${m.image}" data-pczoom="${m.image}" alt="">` : ''}
            </div>
          `).join('')}
        </div>
        <div class="en-room-composer" style="padding:8px 12px 10px;">
          <input id="enPcLeftInput" class="en-room-input" type="text" placeholder="トークを送信（右のボードを見ながら相談）...">
          <button id="enPcLeftSend" class="en-act-btn primary">送信</button>
        </div>
      `;
      const sc = document.getElementById('enPcLeftScroll');
      if (sc) sc.scrollTop = sc.scrollHeight;

      container.querySelectorAll('[data-pczoom]').forEach(img => {
        img.onclick = e => { e.stopPropagation(); if (typeof openEnLightbox === 'function') openEnLightbox(img.getAttribute('data-pczoom')); };
      });
      container.querySelectorAll('[data-pcmsg]').forEach(b => {
        b.onclick = () => {
          const m = enViewState.roomMessages[Number(b.getAttribute('data-pcmsg'))];
          const safe = m.text.replace(/'/g, '');
          openEnSheetHtml('発言をボードへ活かす', m.text, `
            <button class="en-sheet-item" onclick="sendMsgToBoard('${safe}');renderEnRoomModal();"><span>📌 公開ストーリーに記録</span><span>➔</span></button>
            <button class="en-sheet-item" onclick="sendMsgToTask('${safe}');renderEnRoomModal();"><span>✅ やることリストに追加</span><span>➔</span></button>
            <button class="en-sheet-item" onclick="sendMsgToWhy('${lab.id}','${safe}')"><span>❓ なぜなぜ分析の課題にセット</span><span>➔</span></button>
          `);
        };
      });
      const send = () => {
        const inp = document.getElementById('enPcLeftInput');
        const v = inp ? inp.value.trim() : '';
        if (!v) return;
        enViewState.roomMessages.push({ sender: 'あなた', me: true, text: v });
        renderLeftPaneBody(container, lab, d);
        document.getElementById('enPcLeftInput')?.focus();
      };
      document.getElementById('enPcLeftSend')?.addEventListener('click', send);
      document.getElementById('enPcLeftInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
      return;
    }

    if (lt === 'progress') {
      container.innerHTML = `
        <div class="en-pc-pane-scroll">
          <div class="card en-card">
            <div class="en-between">
              <div class="en-title">🗳️ 多数決（${d.polls.length}件）</div>
              <button class="en-act-btn" style="padding:4px 9px;font-size:11px;" onclick="openNewPollSheet('${lab.id}')">＋ 新規</button>
            </div>
            ${d.polls.map(pl => {
              const tot = pl.options.reduce((s, o) => s + o.votes, 0) || 1;
              return `
                <div style="display:flex;flex-direction:column;gap:5px;padding-bottom:6px;border-bottom:1px solid var(--en-border);">
                  <div class="en-between"><strong style="font-size:12.5px;">${pcEsc(pl.title)}</strong><span class="en-meta">${pl.deadline}</span></div>
                  ${pl.options.map(opt => {
                    const pct = Math.round((opt.votes / tot) * 100);
                    return `<button class="en-vote-opt ${pl.myChoice===opt.key?'selected':''}" data-pcpoll="${pl.id}" data-pckey="${opt.key}"><span class="en-vote-bar" style="width:${pct}%"></span><span class="en-vote-inner"><span>${pcEsc(opt.label)}</span><span>${pct}%</span></span></button>`;
                  }).join('')}
                </div>
              `;
            }).join('')}
          </div>

          <div class="card en-card">
            <div class="en-between"><div class="en-title">✅ やること</div><span class="en-pill">${enViewState.roomTasks.filter(t=>t.done).length}/${enViewState.roomTasks.length}</span></div>
            ${enViewState.roomTasks.map((t, i) => `
              <label class="en-row" style="cursor:pointer;font-size:12.5px;${t.done?'text-decoration:line-through;opacity:0.55;':''}">
                <input type="checkbox" ${t.done?'checked':''} data-pctask="${i}"> <span>${pcEsc(t.text)}</span>
              </label>
            `).join('')}
            <div class="en-row">
              <input id="enPcTaskIn" class="en-input-field" placeholder="やることを追加...">
              <button id="enPcTaskAdd" class="en-act-btn primary">追加</button>
            </div>
          </div>
        </div>
      `;
      container.querySelectorAll('[data-pcpoll]').forEach(b => b.onclick = () => {
        const pl = d.polls.find(x => x.id === b.getAttribute('data-pcpoll'));
        const k = b.getAttribute('data-pckey');
        if (!pl) return;
        if (pl.myChoice) pl.options.find(o => o.key === pl.myChoice).votes--;
        pl.myChoice = k; pl.options.find(o => o.key === k).votes++;
        saveRoomProStore(); enToast(`🗳️ 案${k}に投票しました！`); renderLeftPaneBody(container, lab, d);
      });
      container.querySelectorAll('[data-pctask]').forEach(cb => cb.onchange = () => {
        enViewState.roomTasks[Number(cb.getAttribute('data-pctask'))].done = cb.checked;
        renderLeftPaneBody(container, lab, d);
      });
      document.getElementById('enPcTaskAdd')?.addEventListener('click', () => {
        const v = document.getElementById('enPcTaskIn')?.value.trim();
        if (!v) return;
        enViewState.roomTasks.unshift({ id: 't-' + Date.now(), text: v, done: false });
        renderLeftPaneBody(container, lab, d);
      });
      return;
    }

    // story（決定事項＆共有画像）
    const items = enViewState.roomBoards[0].items;
    const shots = d.storyShots || [];
    container.innerHTML = `
      <div class="en-pc-pane-scroll">
        <div class="card en-card">
          <div class="en-title">📌 決定事項・ストーリー</div>
          ${items.map(it => `<div class="en-formula">📌 ${pcEsc(it)}</div>`).join('')}
          ${shots.length ? `<div class="en-story-shots">${shots.map(sh => `<div class="en-story-shot" data-pczoom="${sh.img}"><img src="${sh.img}" alt=""><span>🎨 ${pcEsc(sh.memo)}</span></div>`).join('')}</div>` : ''}
          <div class="en-row">
            <input id="enPcStoryIn" class="en-input-field" placeholder="決定事項をメモ...">
            <button id="enPcStoryAdd" class="en-act-btn primary">追加</button>
          </div>
        </div>
      </div>
    `;
    container.querySelectorAll('[data-pczoom]').forEach(el => el.onclick = () => openEnLightbox(el.getAttribute('data-pczoom')));
    document.getElementById('enPcStoryAdd')?.addEventListener('click', () => {
      const v = document.getElementById('enPcStoryIn')?.value.trim();
      if (!v) return;
      enViewState.roomBoards[0].items.unshift(v);
      renderLeftPaneBody(container, lab, d);
    });
  }

  // =========================================================
  // 🧠 人間工学的PC開発ルーム構築（5段→たった1本の統合ヘッダー）
  // =========================================================
  function enhancePcRoomWorkspace() {
    const modal = document.getElementById('en-room-modal');
    if (!modal || !modal.classList.contains('open')) return;
    if (!isPcActive() || enViewState.roomViewAsFan) {
      modal.classList.remove('en-pc-ws-active');
      return;
    }

    const lab = enViewState.labs.find(l => l.id === enViewState.roomOpenId) || enViewState.labs[0];
    if (!lab) return;
    const d = getRoomProData(lab.id);

    // 2画面モード初回：左がトークなら右はボードを開く（重複しない）
    if (pcWs.layout === 'split' && enViewState.roomTab === 'talk' && pcWs.leftTab === 'talk') {
      enViewState.roomTab = 'board';
      window.renderEnRoomModal();
      return;
    }

    modal.classList.add('en-pc-ws-active');

    const head = modal.querySelector('.en-room-head');
    const bodyEl = modal.querySelector('#enRoomBody');
    const quickChips = modal.querySelector('.en-quick-chips');
    const composer = modal.querySelector('.en-room-composer');
    if (!head || !bodyEl) return;

    const isSplit = pcWs.layout === 'split';
    const rt = enViewState.roomTab;

    // 1) 上部バーを「たった1本のスリム統合ヘッダー」へ置換
    const midTabs = isSplit
      ? [['board','🧰 ボード'], ['detail','🎉 巣立ち'], ['progress','✅ 進行']]
      : [['talk','💬 トーク'], ['board','🧰 ボード'], ['progress','✅ 進行'], ['detail','🎉 巣立ち']];

    head.innerHTML = `
      <div class="en-ergo-head-left">
        <button type="button" class="en-ergo-pill" id="enErgoBackBtn">← 戻る</button>
        <span class="en-ergo-title">${pcEsc(lab.title)}</span>
      </div>
      <div class="en-ergo-head-mid">
        ${midTabs.map(([k, lb]) => `<button type="button" class="en-ergo-seg ${rt===k?'active':''}" data-ergotab="${k}">${lb}</button>`).join('')}
      </div>
      <div class="en-ergo-head-right">
        <button type="button" class="en-ergo-pill ${isSplit?'on':''}" id="enErgoSplitBtn" title="2画面と1画面フル集中を切替">
          ${isSplit ? '🪟 2画面 ON' : '⛶ フル集中'}
        </button>
        <button type="button" class="en-ergo-pill ai" id="enErgoAiBtn" title="AI開発ナビ・議事録スキャン">🤖 AI</button>
        <button type="button" class="en-ergo-pill" id="enErgoMoreBtn" title="企画書・外見え・設定">⋯</button>
      </div>
    `;

    // 2) ボードタブの乱立を自動スリム化（選択中＋ピン留め上位3つだけ見せて認知負荷カット！）
    const toolTabs = Array.from(bodyEl.querySelectorAll('.en-tool-strip .en-tool-tab'));
    if (toolTabs.length > 4) {
      let shown = 0;
      toolTabs.forEach(tab => {
        const keep = tab.classList.contains('active') || shown < 4;
        if (keep) shown++;
        else tab.classList.add('en-pc-overflow-hidden');
      });
    }

    // 3) 左右2ペイン ＋ ドラッグできる境界線リサイザーを構築
    const grid = document.createElement('div');
    grid.className = `en-pc-ws-grid ${!isSplit ? 'is-single' : ''}`;
    grid.style.setProperty('--en-left-w', pcWs.leftPct + '%');

    const leftPane = document.createElement('div');
    leftPane.className = 'en-pc-pane en-pc-pane-left';
    leftPane.innerHTML = `
      <div class="en-pc-left-bar">
        <div class="en-pc-left-tabs">
          ${[['talk','💬 トーク'],['progress','✅ 進行'],['story','📌 記録']].map(([k, lb]) =>
            `<button type="button" class="en-pc-left-tab ${pcWs.leftTab===k?'active':''}" data-pcleft="${k}">${lb}</button>`
          ).join('')}
        </div>
        <button type="button" class="en-pc-close-left" id="enPcCloseLeftBtn" title="左を閉じてフル画面集中">✕</button>
      </div>
      <div class="en-pc-pane" id="enPcLeftContent" style="flex:1;"></div>
    `;

    const resizer = document.createElement('div');
    resizer.className = 'en-pc-resizer';
    resizer.title = 'ドラッグで幅調整（ダブルクリックで標準幅へ）';

    const rightPane = document.createElement('div');
    rightPane.className = 'en-pc-pane en-pc-pane-right';
    rightPane.appendChild(bodyEl);
    if (quickChips) rightPane.appendChild(quickChips);
    if (composer) rightPane.appendChild(composer);

    grid.appendChild(leftPane);
    grid.appendChild(resizer);
    grid.appendChild(rightPane);
    head.after(grid);

    if (isSplit) {
      renderLeftPaneBody(leftPane.querySelector('#enPcLeftContent'), lab, d);
    }

    // --- ドラッグ幅リサイズ（人間工学的な無段階調整） ---
    resizer.addEventListener('pointerdown', e => {
      e.preventDefault();
      resizer.classList.add('dragging');
      resizer.setPointerCapture(e.pointerId);
      const onMove = ev => {
        const pct = Math.max(24, Math.min(58, Math.round((ev.clientX / window.innerWidth) * 100)));
        pcWs.leftPct = pct;
        grid.style.setProperty('--en-left-w', pct + '%');
      };
      const onUp = () => {
        resizer.classList.remove('dragging');
        resizer.removeEventListener('pointermove', onMove);
        resizer.removeEventListener('pointerup', onUp);
      };
      resizer.addEventListener('pointermove', onMove);
      resizer.addEventListener('pointerup', onUp);
    });
    resizer.addEventListener('dblclick', () => {
      pcWs.leftPct = 36;
      grid.style.setProperty('--en-left-w', '36%');
    });

    // --- ヘッダー＆左ペインのイベント ---
    document.getElementById('enErgoBackBtn').onclick = () => {
      modal.classList.remove('open');
      renderSidebarRooms();
    };
    head.querySelectorAll('[data-ergotab]').forEach(btn => {
      btn.onclick = () => {
        enViewState.roomTab = btn.getAttribute('data-ergotab');
        window.renderEnRoomModal();
      };
    });
    document.getElementById('enErgoSplitBtn').onclick = () => {
      pcWs.layout = isSplit ? 'single' : 'split';
      window.renderEnRoomModal();
    };
    document.getElementById('enErgoAiBtn').onclick = () => openAiAssistantSheet(lab, d);
    document.getElementById('enErgoMoreBtn').onclick = () => openRoomMoreSheet(lab);

    leftPane.querySelectorAll('[data-pcleft]').forEach(btn => {
      btn.onclick = () => {
        pcWs.leftTab = btn.getAttribute('data-pcleft');
        window.renderEnRoomModal();
      };
    });
    document.getElementById('enPcCloseLeftBtn').onclick = () => {
      pcWs.layout = 'single';
      window.renderEnRoomModal();
    };
  }

  // フック：ルームを開くたびに最新履歴を更新＋サイドバー反映
  if (typeof window.openEnRoomModal === 'function') {
    const origOpen = window.openEnRoomModal;
    window.openEnRoomModal = function (labId, initialTab, asFan) {
      recordRecentRoom(labId);
      origOpen(labId, initialTab, asFan);
      renderSidebarRooms();
    };
  }
  if (typeof window.openSoloNotebookModal === 'function') {
    const origSolo = window.openSoloNotebookModal;
    window.openSoloNotebookModal = function (labId) {
      recordRecentRoom(labId);
      origSolo(labId);
    };
  }
  if (typeof window.renderEnLab === 'function') {
    const origLab = window.renderEnLab;
    window.renderEnLab = function () {
      origLab();
      renderSidebarRooms();
    };
  }
  if (typeof window.renderEnRoomModal === 'function') {
    const origRender = window.renderEnRoomModal;
    window.renderEnRoomModal = function () {
      origRender();
      enhancePcRoomWorkspace();
    };
  }

  // 初期化・監視
  syncPcMode();
  window.addEventListener('DOMContentLoaded', () => {
    syncPcMode();
    setTimeout(syncPcMode, 300);
    setTimeout(syncPcMode, 650);
    window.addEventListener('resize', syncPcMode);

    const mobBtn = document.getElementById('toggleMobileBtn');
    if (mobBtn) mobBtn.addEventListener('click', () => { forceMobilePreview = !forceMobilePreview; setTimeout(syncPcMode, 50); });
    const exitMobBtn = document.getElementById('devExitMobileBtn');
    if (exitMobBtn) exitMobBtn.addEventListener('click', () => { forceMobilePreview = false; setTimeout(syncPcMode, 50); });

    const obs = new MutationObserver(syncPcMode);
    if (document.body) obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    const shell = document.getElementById('appShell');
    if (shell) obs.observe(shell, { attributes: true, attributeFilter: ['class'] });
  });
})();