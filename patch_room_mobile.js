/* =========================================================
   EN•joy スマホ版 進行中ラボ専用ルームUI（patch_room_mobile.js v9）
   ・MutationObserver完全撤去＆PCモード即バイパス（PC/スマホ戻りフリーズ根治）
   ・外見え／巣立ち公開を含む全終了ルートでカーテン＆スクロールロックを確実に解除
   ・今日の日付を動的取得／トーク転送をイベントリスナー化（引用符・改行安全）
   ========================================================= */

(function () {
  const STAGES = [
    {
      idx: 0, icon: '🌱', label: 'タネ', full: 'STEP 1：タネ・アイデア出し',
      desc: 'まずは「誰のどんな困りごとを解決するか」をメンバーで自由に膨らませよう。',
      boards: [
        { id: 'market', label: '📊 市場・ポジショニングを考える' },
        { id: 'scamper', label: '💡 SCAMPERで差別化アイデア出し' }
      ]
    },
    {
      idx: 1, icon: '💰', label: '企画原価', full: 'STEP 2：企画・原価設計',
      desc: '売価と原価率・ターゲットをざっくり固めよう。次の「試作」へ進むと商品完成登録がオレンジ解放されます！',
      boards: [
        { id: 'cost', label: '💰 原価・販路別粗利をシミュレーション' },
        { id: 'vpc',  label: '👤 顧客価値(VPC)で刺さる理由を整理' }
      ]
    },
    {
      idx: 2, icon: '🧪', label: '試作', full: 'STEP 3：試作・テスト検証',
      desc: '🍊 商品完成登録がオレンジ解放中！配合テストと原因分析を回しながら完成度を高めよう。',
      boards: [
        { id: 'proto', label: '🧪 試作A/B比較表で配合と味を記録' },
        { id: 'why',   label: '❓ なぜなぜ分析で課題の根っこを潰す' }
      ]
    },
    {
      idx: 3, icon: '📋', label: '表示法規', full: 'STEP 4：食品表示・法規・リスク確認',
      desc: '販売前の最終チェック！一括表示の中身・アレルゲン・配送割れなどのリスクを潰そう。',
      boards: [
        { id: 'legal', label: '📋 食品表示・法規の中身を確認＆記入' },
        { id: 'risk',  label: '🛡️ リスク先回り(FMEA)をチェック' }
      ]
    },
    {
      idx: 4, icon: '🎉', label: '巣立ち', full: 'STEP 5：完成・巣立ちお披露目',
      desc: '準備バッチリ！販促コピーを整えたら、商品完成登録からEN•マルシェ＆各販路へ羽ばたかせよう！',
      boards: [
        { id: 'promo',   label: '📣 販促・パッケージ計画を仕上げる' },
        { id: '_launch', label: '🍊 商品完成登録を開いてお披露目する', orange: true }
      ]
    }
  ];

  const BOARD_CATEGORIES = [
    { key: '企画・戦略', title: '💡 コンセプト・企画' },
    { key: '経営・試作', title: '💰 原価・試作テスト' },
    { key: '発想・解決', title: '🧠 原因分析・意思決定' },
    { key: '品質・販路', title: '🛡️ 食品表示・品質・販促' },
    { key: 'カスタム',   title: '📝 オリジナルボード' }
  ];

  function pad2(n) { return String(n).padStart(2, '0'); }
  function ymd(y, m, d) { return `${y}-${pad2(m + 1)}-${pad2(d)}`; }
  function getTodayStr() {
    const t = new Date();
    return ymd(t.getFullYear(), t.getMonth(), t.getDate());
  }

  const initNow = new Date();
  const calState = {
    year: initNow.getFullYear(),
    month: initNow.getMonth(),
    selectedDate: getTodayStr()
  };
  const uiState = { boardViewMode: 'list', talkPlusOpen: false, _staySlide: 1 };
  const vpState = {
    baseHeight: window.innerHeight || 800,
    kbdActive: false,
    isSyncing: false,
    talkAtBottom: true,
    talkSavedScrollTop: 0,
    settleTimer: null
  };

  function isMobileRoomMode() {
    return !document.documentElement.classList.contains('en-pc-mode');
  }
  function isRoomModalOpenMobile() {
    const modal = document.getElementById('en-room-modal');
    return !!(isMobileRoomMode() && modal && modal.classList.contains('open'));
  }
  function esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function shiftSelectedDate(deltaDays) {
    const [y, m, d] = calState.selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d + deltaDays);
    calState.year = dt.getFullYear();
    calState.month = dt.getMonth();
    calState.selectedDate = ymd(dt.getFullYear(), dt.getMonth(), dt.getDate());
  }
  function shiftCalMonth(deltaMonths) {
    const dt = new Date(calState.year, calState.month + deltaMonths, 1);
    calState.year = dt.getFullYear();
    calState.month = dt.getMonth();
  }
  function safeSave() {
    if (typeof saveRoomProStore === 'function') saveRoomProStore();
  }
  function isTextInputEl(el) {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true;
    if (el.tagName === 'INPUT') return !/checkbox|radio|range|file|button|submit|reset|color/i.test(el.type || 'text');
    return false;
  }

  // --- カーテン＆スクロールロック（全終了経路で確実解除） ---
  function setCurtainState(isOn) {
    const modal = document.getElementById('en-room-modal');
    let curtain = document.getElementById('en-mrm-curtain');
    if (isOn) {
      if (!curtain) {
        curtain = document.createElement('div');
        curtain.id = 'en-mrm-curtain';
        document.body.appendChild(curtain);
      }
      if (modal) {
        const mz = parseInt(window.getComputedStyle(modal).zIndex, 10) || 9990;
        curtain.style.zIndex = String(mz - 1);
      }
      curtain.classList.add('active');
      document.documentElement.classList.add('en-mrm-locked');
      document.body.classList.add('en-mrm-locked');
    } else {
      if (curtain) curtain.classList.remove('active');
      document.documentElement.classList.remove('en-mrm-locked', 'en-kbd-open');
      document.body.classList.remove('en-mrm-locked');
      document.documentElement.style.removeProperty('--en-vvh');
      document.documentElement.style.removeProperty('--en-vvt');
      vpState.kbdActive = false;
    }
  }

  function closeMobileRoomModal() {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    uiState.talkPlusOpen = false;
    const modal = document.getElementById('en-room-modal');
    if (modal) {
      modal.classList.remove('open', 'en-mrm-active', 'en-mrm-board-detail', 'en-mrm-talk');
    }
    if (typeof enViewState !== 'undefined') enViewState.roomViewAsFan = false;
    setCurtainState(false);
  }
  window.closeMobileRoomModal = closeMobileRoomModal;

  // --- スマホ・ルーム内専用のキーボード安定化 ---
  function captureTalkScrollState() {
    const modal = document.getElementById('en-room-modal');
    const body = document.getElementById('enRoomBody');
    if (!modal || !body || !modal.classList.contains('en-mrm-talk')) return;
    const distFromBottom = body.scrollHeight - body.scrollTop - body.clientHeight;
    vpState.talkAtBottom = distFromBottom <= 36;
    vpState.talkSavedScrollTop = body.scrollTop;
  }

  function keepRoomInputInView(inputEl) {
    if (!inputEl || !isTextInputEl(inputEl) || inputEl.id === 'enRoomInput') return;
    const container = inputEl.closest('#enRoomBody') || inputEl.closest('#en-sheet-backdrop .en-sheet-card');
    if (!container) return;

    const vv = window.visualViewport;
    const visTop = (vv ? vv.offsetTop : 0) + 54;
    const visBottom = (vv ? vv.offsetTop + vv.height : window.innerHeight) - 24;
    const rect = inputEl.getBoundingClientRect();
    if (rect.top >= visTop && rect.bottom <= visBottom) return;

    const targetY = visTop + (visBottom - visTop) * 0.42;
    container.scrollTop += (rect.top - targetY);
  }

  let vpRaf = 0;
  function syncViewportNow() {
    if (vpRaf) cancelAnimationFrame(vpRaf);
    vpRaf = requestAnimationFrame(() => {
      vpRaf = 0;
      const root = document.documentElement;
      if (!isRoomModalOpenMobile()) {
        if (vpState.kbdActive || document.body.classList.contains('en-mrm-locked')) setCurtainState(false);
        return;
      }

      const vv = window.visualViewport;
      const curH = Math.round(vv ? vv.height : window.innerHeight);
      const curTop = Math.round(vv ? vv.offsetTop : 0);

      if (curH > vpState.baseHeight || !vpState.kbdActive) {
        vpState.baseHeight = Math.max(vpState.baseHeight, curH);
      }

      const ae = document.activeElement;
      const inRoomOrSheet = !!(ae && (ae.closest('#en-room-modal') || ae.closest('#en-sheet-backdrop')) && isTextInputEl(ae));
      const kbdH = Math.max(0, vpState.baseHeight - curH);
      const isKbdNowOpen = inRoomOrSheet && kbdH > 100;
      vpState.kbdActive = isKbdNowOpen;

      vpState.isSyncing = true;
      root.style.setProperty('--en-vvh', curH + 'px');
      root.style.setProperty('--en-vvt', curTop + 'px');
      root.classList.toggle('en-kbd-open', isKbdNowOpen);

      const modal = document.getElementById('en-room-modal');
      const body = document.getElementById('enRoomBody');
      if (modal && body && modal.classList.contains('en-mrm-talk') && !ae?.closest('#en-sheet-backdrop')) {
        if (vpState.talkAtBottom) body.scrollTop = body.scrollHeight - body.clientHeight;
        else body.scrollTop = vpState.talkSavedScrollTop;
      } else if (isKbdNowOpen && inRoomOrSheet) {
        keepRoomInputInView(ae);
      }

      clearTimeout(vpState.settleTimer);
      if (isKbdNowOpen && inRoomOrSheet && ae.id !== 'enRoomInput') {
        vpState.settleTimer = setTimeout(() => {
          if (vpState.kbdActive && document.activeElement === ae) keepRoomInputInView(ae);
        }, 160);
      }
      setTimeout(() => { vpState.isSyncing = false; }, 100);
    });
  }

  function installKeyboardObservers() {
    if (window._enKbdObsInstalled) return;
    window._enKbdObsInstalled = true;

    document.addEventListener('pointerdown', e => {
      if (e.target && e.target.id === 'enRoomInput') captureTalkScrollState();
    }, true);

    document.addEventListener('focusin', e => {
      const t = e.target;
      if (!isRoomModalOpenMobile() || !t || !isTextInputEl(t)) return;
      if (!t.closest('#en-room-modal') && !t.closest('#en-sheet-backdrop')) return;
      if (t.id === 'enRoomInput') {
        captureTalkScrollState();
        if (uiState.talkPlusOpen) {
          uiState.talkPlusOpen = false;
          document.querySelector('#en-room-modal .en-talk-plus-btn')?.classList.remove('open');
          document.querySelector('#en-room-modal .en-talk-plus-tray')?.classList.remove('open');
        }
      }
      syncViewportNow();
    });

    document.addEventListener('focusout', () => {
      if (!isRoomModalOpenMobile()) return;
      setTimeout(syncViewportNow, 120);
    });

    // 外見えモード等の本体側ボタンでモーダルが閉じた場合も必ず後片付けする保険
    document.addEventListener('click', () => {
      if (document.body.classList.contains('en-mrm-locked')) {
        setTimeout(() => {
          const modal = document.getElementById('en-room-modal');
          if (!modal || !modal.classList.contains('open')) setCurtainState(false);
        }, 0);
      }
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => { if (isRoomModalOpenMobile()) syncViewportNow(); });
      window.visualViewport.addEventListener('scroll', () => { if (isRoomModalOpenMobile()) syncViewportNow(); });
    }
    window.addEventListener('orientationchange', () => {
      vpState.baseHeight = 0;
      setTimeout(() => { if (isRoomModalOpenMobile()) syncViewportNow(); }, 300);
    });
  }

  function ensureMobileLabData(d) {
    if (typeof d.stage !== 'number') d.stage = 1;
    if (!Array.isArray(d.calEvents)) {
      d.calEvents = [
        { id: 'ev-1', date: '2026-11-29', title: 'パッケージ最終決定', tone: 1 },
        { id: 'ev-2', date: '2026-12-02', title: '試作Ver.3 乾燥テスト', tone: 2 },
        { id: 'ev-3', date: '2026-12-06', title: '枚方マルシェ視察', tone: 3 },
        { id: 'ev-4', date: '2026-12-13', title: 'ラベル最終校了', tone: 1 },
        { id: 'ev-5', date: '2026-12-20', title: '初売りお披露目', tone: 2 }
      ];
    }
    if (!d.roomMeta) {
      d.roomMeta = {
        goal: '枚方・寝屋川エリアで愛される無添加おやつを小ロットから商品化',
        notify: true,
        joinPolicy: 'approval',
        budgetCap: '50000'
      };
    }
    if (!Array.isArray(d.reportHistory)) d.reportHistory = [];
    return d;
  }

  function safeBoardName(b) { return b.id === 'story' ? 'ルーム内決定メモ' : b.name; }
  function safeBoardDesc(b) { return b.id === 'story' ? '外部非公開・チームで決まった方針の記録' : (b.desc || ''); }

  // --- 作成日時つき企画書履歴 ---
  function generateAndSaveReport(lab, d) {
    const now = new Date();
    const createdAt = `${now.getFullYear()}/${pad2(now.getMonth() + 1)}/${pad2(now.getDate())} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    const c = d.cost;
    const unitCost = Number(c.material) + Number(c.process) + Number(c.pack) + Number(c.ship);
    const profit = Number(c.price) - unitCost;
    const costRate = c.price > 0 ? Math.round((unitCost / c.price) * 100) : 0;
    const st = STAGES[d.stage] || STAGES[1];
    const ver = `v${d.reportHistory.length + 1}`;

    const text = [
      `====================================`,
      `【EN•joy 商品企画書 ${ver}】`,
      `商品名：${lab.title}`,
      `作成日時：${createdAt}（進捗：${st.label}）`,
      `====================================`,
      ``,
      `■ 1. ターゲット・独自価値`,
      `・ターゲット：${d.market.target}`,
      `・選ばれる理由：${d.market.advantage}`,
      `・キャッチ案：${d.promo.copy}`,
      ``,
      `■ 2. 原価・収益`,
      `・売価：¥${c.price} ／ 原価：¥${unitCost}（原価率 ${costRate}%）`,
      `・直販粗利：¥${profit} ／ 初回${c.lot}個利益：¥${(profit * c.lot - c.fixedCost).toLocaleString()}`,
      ``,
      `■ 3. 試作・決定メモ`,
      ...d.protos.map(p => `・${p.ver} [${p.score}${p.adopted ? '・採用' : ''}] ${p.cond} (${p.cost})：${p.memo}`),
      ...enViewState.roomBoards[0].items.map(s => `・📌 ${s}`),
      ``,
      `■ 4. 食品表示・法規確認`,
      ...d.legal.map(l => `・[${l.done ? '済' : '未'}] ${l.label}`)
    ].join('\n');

    d.reportHistory.unshift({ id: 'rep-' + Date.now(), ver, createdAt, stage: st.label, text });
    if (d.reportHistory.length > 10) d.reportHistory.length = 10;
    safeSave();
    return d.reportHistory[0];
  }

  function openReportHistorySheet(lab, d) {
    const latest = d.reportHistory[0];
    openEnSheetHtml('📄 商品企画書（作成日時つき履歴）', '加工所見積りやチーム共有用に今の状態をスナップショット保存', `
      <button type="button" class="en-act-btn primary" style="justify-content:center;" id="enRepCreateNowBtn">
        ✨ 今の日時で新しい企画書（v${d.reportHistory.length + 1}）を作成
      </button>
      ${latest ? `
        <div class="en-meta" style="font-weight:800;">最新：${latest.ver}（${latest.createdAt} 作成｜${latest.stage}）</div>
        <pre class="en-report-pre" id="enRepPreviewPre">${esc(latest.text)}</pre>
        <button type="button" class="en-act-btn" style="justify-content:center;" id="enRepCopyBtn">📋 表示中の企画書をコピー</button>
      ` : '<div class="en-meta">まだ企画書は作成されていません。上のボタンから作成できます。</div>'}
      ${d.reportHistory.length > 1 ? `
        <div class="en-meta" style="font-weight:800;margin-top:4px;">🕒 過去の履歴（タップで表示切替）</div>
        ${d.reportHistory.map((r, i) => `
          <button type="button" class="en-sheet-item" data-repidx="${i}">
            <span><strong>${r.ver}</strong>｜${r.createdAt}<br><small class="en-meta">作成時フェーズ：${r.stage}</small></span>
            <span>表示</span>
          </button>
        `).join('')}
      ` : ''}
    `);

    document.getElementById('enRepCreateNowBtn')?.addEventListener('click', () => {
      const created = generateAndSaveReport(lab, d);
      enToast(`📄 企画書 ${created.ver}（${created.createdAt}）を保存しました！`);
      openReportHistorySheet(lab, d);
      window.renderEnRoomModal();
    });
    document.getElementById('enRepCopyBtn')?.addEventListener('click', async () => {
      const txt = document.getElementById('enRepPreviewPre')?.textContent || '';
      try { await navigator.clipboard.writeText(txt); enToast('📋 企画書をコピーしました！'); }
      catch { enToast('コピー完了！'); }
    });
    document.querySelectorAll('[data-repidx]').forEach(btn => {
      btn.onclick = () => {
        const r = d.reportHistory[Number(btn.getAttribute('data-repidx'))];
        const pre = document.getElementById('enRepPreviewPre');
        if (pre && r) { pre.textContent = r.text; enToast(`📄 ${r.ver}（${r.createdAt}）を表示中`); }
      };
    });
  }

  // --- 左(0枚目)：やることリスト・注目 ---
  function buildHighlightSlide(lab, d) {
    const st = STAGES[d.stage] || STAGES[1];
    const pendingTasks = enViewState.roomTasks.filter(t => !t.done);
    const p0 = d.polls[0];
    const lastMsg = enViewState.roomMessages[enViewState.roomMessages.length - 1];
    const firstRecBoard = st.boards[0];

    const rows = [];
    pendingTasks.slice(0, 2).forEach(t => rows.push({ ico: '✅', tag: 'やること（未完了）', main: t.text, action: 'progress', accent: true }));
    if (p0) rows.push({ ico: '🗳️', tag: `多数決（${p0.deadline}）`, main: p0.title, action: 'progress' });
    if (firstRecBoard) {
      rows.push({
        ico: st.icon, tag: `今のフェーズおすすめ（${st.label}）`, main: firstRecBoard.label,
        action: firstRecBoard.id === '_launch' ? 'launch' : `board:${firstRecBoard.id}`
      });
    }
    if (lastMsg) rows.push({ ico: '💬', tag: `最新トーク｜${lastMsg.sender}`, main: lastMsg.text, action: 'talk' });

    return `
      <div class="en-mrm-slide">
        <div class="en-between"><strong style="font-size:14px;">✅ やることリスト・注目</strong><span class="en-pill">残り ${pendingTasks.length}件</span></div>
        <div class="en-hl-list">
          ${rows.slice(0, 4).map(r => `
            <button type="button" class="en-hl-row ${r.accent ? 'accent' : ''}" data-hljump="${r.action}">
              <span class="en-hl-ico">${r.ico}</span>
              <span class="en-hl-txt"><span class="en-hl-tag">${esc(r.tag)}</span><span class="en-hl-main">${esc(r.main)}</span></span>
              <span class="en-hl-go">➔</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  // --- 真ん中(1枚目)：月間カレンダー ---
  function buildMonthlyCalendarSlide(lab, d) {
    const y = calState.year, m = calState.month;
    const firstDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevMonthDays = new Date(y, m, 0).getDate();
    const todayStr = getTodayStr();

    const evMap = {};
    d.calEvents.forEach(ev => { if (!evMap[ev.date]) evMap[ev.date] = []; evMap[ev.date].push(ev); });

    const cells = [];
    for (let i = firstDow - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const dt = new Date(y, m - 1, day);
      cells.push({ date: ymd(dt.getFullYear(), dt.getMonth(), day), day, other: true, dow: dt.getDay() });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dt = new Date(y, m, day);
      cells.push({ date: ymd(y, m, day), day, other: false, dow: dt.getDay() });
    }
    const targetCells = cells.length > 35 ? 42 : 35;
    let nextDay = 1;
    while (cells.length < targetCells) {
      const dt = new Date(y, m + 1, nextDay);
      cells.push({ date: ymd(dt.getFullYear(), dt.getMonth(), nextDay), day: nextDay, other: true, dow: dt.getDay() });
      nextDay++;
    }

    const selEvents = evMap[calState.selectedDate] || [];
    const selDisp = calState.selectedDate.replace(/^(\d+)-(\d+)-(\d+)$/, (_, yy, mm, dd) => `${Number(mm)}/${Number(dd)}`);

    return `
      <div class="en-mrm-slide" id="enGcalSlide">
        <div class="en-gcal-head">
          <span class="en-gcal-month">📅 ${y}年${m + 1}月</span>
          <div class="en-gcal-nav">
            <button type="button" class="en-gcal-btn" id="enGcalPrevM">▲</button>
            <button type="button" class="en-gcal-btn" id="enGcalNextM">▼</button>
            <button type="button" class="en-gcal-btn primary" id="enGcalAddBtn">＋予定</button>
          </div>
        </div>
        <div class="en-gcal-dow"><span>日</span><span>月</span><span>火</span><span>水</span><span>木</span><span>金</span><span>土</span></div>
        <div class="en-gcal-grid" id="enGcalGrid">
          ${cells.map(c => {
            const evs = evMap[c.date] || [];
            const cls = [
              'en-gcal-cell', c.other ? 'other' : '', c.dow === 0 ? 'is-sun' : '', c.dow === 6 ? 'is-sat' : '',
              c.date === todayStr ? 'is-today' : '', c.date === calState.selectedDate ? 'selected' : ''
            ].filter(Boolean).join(' ');
            const firstEv = evs[0];
            return `
              <button type="button" class="${cls}" data-gcaldate="${c.date}">
                <span class="en-gcal-num">${c.day}</span>
                ${firstEv ? `<span class="en-gcal-chip tone-${firstEv.tone || 1}">${esc(firstEv.title)}</span>` : ''}
              </button>
            `;
          }).join('')}
        </div>
        <div class="en-gcal-daybar">
          <button type="button" class="en-gcal-btn" id="enGcalPrevDay">◀</button>
          <button type="button" class="en-gcal-dayinfo" id="enGcalManageBtn">
            <strong>${selDisp}</strong>：${selEvents.length ? selEvents.map(e => esc(e.title)).join(' / ') : '予定なし（タップで追加）'}
          </button>
          <button type="button" class="en-gcal-btn" id="enGcalNextDay">▶</button>
        </div>
      </div>
    `;
  }

  function openAddCalEventSheet(labId, d, dateStr) {
    const evs = d.calEvents.filter(e => e.date === dateStr);
    openEnSheetHtml(`📅 ${dateStr} のラボ予定`, '開発マイルストーンをカレンダーで共有管理', `
      ${evs.length ? evs.map(e => `
        <div class="en-formula en-list-row-del">
          <span>📌 ${esc(e.title)}</span>
          <button type="button" class="en-del-x" data-delcalev="${e.id}">🗑️</button>
        </div>
      `).join('') : '<div class="en-meta">この日の予定はまだありません</div>'}
      <div class="en-form-box">
        <div class="en-meta" style="font-weight:800;">＋ この日に予定を追加</div>
        <input id="enCalEvTitleIn" class="en-input-field" placeholder="例：加工所さんと初回試作打ち合わせ">
        <div class="en-row">
          <select id="enCalEvToneIn" class="en-input-field" style="flex:1;">
            <option value="1">🟠 重要マイルストーン</option>
            <option value="2">🟢 試作・テスト</option>
            <option value="3">🟣 マルシェ・販促</option>
          </select>
          <button type="button" class="en-act-btn primary" id="enCalEvSaveBtn">追加する</button>
        </div>
      </div>
    `);

    document.querySelectorAll('[data-delcalev]').forEach(btn => {
      btn.onclick = () => {
        d.calEvents = d.calEvents.filter(x => x.id !== btn.getAttribute('data-delcalev'));
        safeSave(); uiState._staySlide = 1; openAddCalEventSheet(labId, d, dateStr); window.renderEnRoomModal();
      };
    });
    document.getElementById('enCalEvSaveBtn')?.addEventListener('click', () => {
      const title = document.getElementById('enCalEvTitleIn')?.value.trim();
      const tone = Number(document.getElementById('enCalEvToneIn')?.value || 1);
      if (!title) return enToast('⚠️ 予定タイトルを入力してください');
      d.calEvents.push({ id: 'ev-' + Date.now(), date: dateStr, title, tone });
      safeSave(); closeEnSheet(); uiState._staySlide = 1; enToast(`📅 ${dateStr} に予定を追加しました！`); window.renderEnRoomModal();
    });
  }

  // --- 進行：「いまここカード」フォーカス型ロードマップ ---
  function buildFocusRoadmapHtml(lab, d) {
    const st = STAGES[d.stage] || STAGES[1];
    const fillPct = (d.stage / (STAGES.length - 1)) * 100;
    const prevSt = d.stage > 0 ? STAGES[d.stage - 1] : null;
    const nextSt = d.stage < STAGES.length - 1 ? STAGES[d.stage + 1] : null;

    return `
      <div class="en-focus-rm" id="enMrmFocusRoadmap">
        <div class="en-rm-rail">
          <div class="en-rm-rail-fill" style="width:calc((100% - 36px) * ${fillPct / 100});"></div>
          ${STAGES.map(s => {
            const cls = s.idx < d.stage ? 'done' : s.idx === d.stage ? 'current' : '';
            return `
              <button type="button" class="en-rm-node ${cls}" data-setstage="${s.idx}">
                <span class="en-rm-dot">${s.idx < d.stage ? '✓' : s.icon}</span>
                <span class="en-rm-node-lbl">${s.label}</span>
              </button>
            `;
          }).join('')}
        </div>
        <div class="en-rm-focus-card">
          <div class="en-between"><span class="en-pill">いまここ</span><span class="en-meta">${d.stage + 1} / ${STAGES.length} ステップ</span></div>
          <div class="en-rm-focus-title">${st.icon} ${esc(st.full)}</div>
          <div class="en-rm-focus-desc">${esc(st.desc)}</div>
          <div class="en-rm-rec-boards">
            ${st.boards.map(b => `
              <button type="button" class="en-rm-rec-btn ${b.orange ? 'orange' : ''}" data-rmjump="${b.id}">
                <span>${esc(b.label)}</span><span>開く ➔</span>
              </button>
            `).join('')}
          </div>
          <div class="en-rm-foot-nav">
            <button type="button" class="en-rm-nav-btn" id="enRmPrevBtn" ${!prevSt ? 'disabled' : ''}>${prevSt ? `← ${prevSt.label}へ戻す` : '← 最初'}</button>
            <button type="button" class="en-rm-nav-btn next" id="enRmNextBtn" ${!nextSt ? 'disabled' : ''}>${nextSt ? `${nextSt.icon}「${nextSt.label}」へ進む ➔` : '🎉 最終ステップ到達！'}</button>
          </div>
        </div>
      </div>
    `;
  }

  function setStageAndNotify(d, nextIdx) {
    const wasLocked = d.stage < 2;
    d.stage = Math.max(0, Math.min(STAGES.length - 1, nextIdx));
    safeSave();
    if (wasLocked && d.stage >= 2) enToast('🍊「試作」フェーズ到達！商品完成登録がオレンジ解放されました！');
    else enToast(`🗺️ ${STAGES[d.stage].full} に切り替えました`);
    window.renderEnRoomModal();
  }

  function bindFocusRoadmapEvents(root, lab, d) {
    root.querySelectorAll('[data-setstage]').forEach(btn => btn.onclick = () => setStageAndNotify(d, Number(btn.getAttribute('data-setstage'))));
    root.querySelector('#enRmPrevBtn')?.addEventListener('click', () => setStageAndNotify(d, d.stage - 1));
    root.querySelector('#enRmNextBtn')?.addEventListener('click', () => setStageAndNotify(d, d.stage + 1));
    root.querySelectorAll('[data-rmjump]').forEach(btn => {
      btn.onclick = () => {
        const tid = btn.getAttribute('data-rmjump');
        if (tid === '_launch') { enViewState.roomTab = 'launch'; window.renderEnRoomModal(); return; }
        if (!d.activeTools.includes(tid)) d.activeTools.push(tid);
        d.selectedTool = tid; safeSave();
        uiState.boardViewMode = 'detail'; enViewState.roomTab = 'board'; window.renderEnRoomModal();
      };
    });
  }

  // --- ボード入口：カテゴリ別2列カード一覧 ---
  function renderMobileBoardHubList(modal, lab, d) {
    const allBoards = getAllActiveBoardDefs(d);
    const st = STAGES[d.stage] || STAGES[1];
    const recIds = st.boards.map(b => b.id);

    const groupsHtml = BOARD_CATEGORIES.map(cat => {
      const list = allBoards.filter(b => b.cat === cat.key);
      if (!list.length) return '';
      return `
        <div>
          <div class="en-bcat-head"><span>${cat.title}</span><span>${list.length}個</span></div>
          <div class="en-bcat-grid">
            ${list.map(b => {
              const isRec = recIds.includes(b.id);
              const isPin = d.pinnedTools.includes(b.id);
              return `
                <button type="button" class="en-bcat-card ${isRec ? 'rec' : ''}" data-openboard="${b.id}">
                  <div class="en-bcat-top">
                    <span class="en-bcat-ico">${b.icon}</span>
                    <span class="en-bcat-cnt">${isRec ? '★おすすめ' : (isPin ? '📌 ' : '') + getBoardItemCount(d, b.id)}</span>
                  </div>
                  <div>
                    <div class="en-bcat-name">${esc(safeBoardName(b))}</div>
                    <div class="en-bcat-desc">${esc(safeBoardDesc(b))}</div>
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    modal.innerHTML = `
      <div class="en-room-head">
        <button type="button" class="en-act-btn" data-mrmgo="hub">← ホーム</button>
        <strong style="font-size:13.5px;flex:1;text-align:center;">🧰 開発ボード一覧（${allBoards.length}）</strong>
        <button type="button" class="en-act-btn primary" style="padding:5px 10px;font-size:11.5px;" onclick="openToolPickerSheet('${lab.id}')">＋ 追加</button>
      </div>
      <div class="en-room-body" id="enRoomBody">
        <div class="en-bcat-wrap">
          ${groupsHtml}
          <button type="button" class="en-act-btn" style="justify-content:center;padding:12px;" onclick="openToolPickerSheet('${lab.id}')">
            ＋ ツールを追加 / オリジナルボードを自由作成
          </button>
        </div>
      </div>
      ${buildMobileDock('board')}
    `;

    modal.querySelectorAll('[data-openboard]').forEach(btn => {
      btn.onclick = () => { d.selectedTool = btn.getAttribute('data-openboard'); safeSave(); uiState.boardViewMode = 'detail'; window.renderEnRoomModal(); };
    });
    modal.querySelectorAll('[data-mrmgo]').forEach(btn => {
      btn.onclick = () => { uiState._staySlide = 1; enViewState.roomTab = btn.getAttribute('data-mrmgo'); window.renderEnRoomModal(); };
    });
    bindMobileDock(modal);
    if (typeof enSyncTheme === 'function') enSyncTheme();
  }

  // --- ルームホーム画面 ---
  function renderMobileRoomHub(modal, lab, d) {
    const c = d.cost;
    const unitCost = Number(c.material) + Number(c.process) + Number(c.pack) + Number(c.ship);
    const profit = Number(c.price) - unitCost;
    const costRate = c.price > 0 ? Math.round((unitCost / c.price) * 100) : 0;
    const pendingTasks = enViewState.roomTasks.filter(t => !t.done).length;
    const allBoards = getAllActiveBoardDefs(d);
    const lastMsg = enViewState.roomMessages[enViewState.roomMessages.length - 1];
    const gate = getLaunchGateStatus(d);
    const st = STAGES[d.stage] || STAGES[1];
    const isUnlocked = d.stage >= 2;

    const slideRight = `
      <div class="en-mrm-slide">
        <div class="en-between"><strong style="font-size:14px;">📊 ラボ現在地サマリー</strong><span class="en-pill">${st.icon} ${st.label}</span></div>
        <div class="en-mrm-stat-grid">
          <div class="en-mrm-stat-box"><small>💰 現在の原価率</small><strong style="color:${costRate <= 55 ? '#10b981' : '#f97316'};">${costRate}%</strong></div>
          <div class="en-mrm-stat-box"><small>✨ 直販1個粗利</small><strong>¥${profit}</strong></div>
          <div class="en-mrm-stat-box"><small>🧪 試作パターン</small><strong>${d.protos.length}案</strong></div>
          <div class="en-mrm-stat-box"><small>📋 食品表示・法規</small><strong>${d.legal.filter(x => x.done).length}/${d.legal.length}済</strong></div>
        </div>
        <div class="en-meta" style="font-size:11px;">🎯 目標：${esc(d.roomMeta.goal)}</div>
      </div>
    `;

    modal.innerHTML = `
      <div class="en-room-head">
        <button type="button" class="en-act-btn" id="enMrmExitBtn">← 一覧</button>
        <strong style="font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;text-align:center;">${esc(lab.title)}</strong>
        <button type="button" class="en-act-btn" id="enMrmFanBtn">👀 外見え</button>
      </div>
      <div class="en-room-body" id="enRoomBody">
        <div class="en-mrm-carousel-wrap">
          <div class="en-mrm-carousel" id="enMrmCarousel">
            ${buildHighlightSlide(lab, d)}
            ${buildMonthlyCalendarSlide(lab, d)}
            ${slideRight}
          </div>
          <div class="en-mrm-dots" id="enMrmDots">
            <button type="button" class="en-mrm-dot" data-dot="0"></button>
            <button type="button" class="en-mrm-dot active" data-dot="1"></button>
            <button type="button" class="en-mrm-dot" data-dot="2"></button>
          </div>
        </div>
        <div class="en-mrm-tile-grid">
          <button type="button" class="en-mrm-tile" data-mrmgo="talk">
            <div class="en-mrm-tile-top"><span class="en-mrm-tile-ico">💬</span><span class="en-mrm-tile-badge">🔒 ${enViewState.roomMessages.length}件</span></div>
            <div><div class="en-mrm-tile-title">トーク</div><div class="en-mrm-tile-sub">${lastMsg ? esc(lastMsg.text) : 'ルーム内限定で相談する'}</div></div>
          </button>
          <button type="button" class="en-mrm-tile" data-mrmgo="progress">
            <div class="en-mrm-tile-top"><span class="en-mrm-tile-ico">✅</span><span class="en-mrm-tile-badge">${st.icon} ${st.label}</span></div>
            <div><div class="en-mrm-tile-title">進行</div><div class="en-mrm-tile-sub">ロードマップ・やること${pendingTasks}件・多数決</div></div>
          </button>
          <button type="button" class="en-mrm-tile" data-mrmgo="board">
            <div class="en-mrm-tile-top"><span class="en-mrm-tile-ico">🧰</span><span class="en-mrm-tile-badge">${allBoards.length}種</span></div>
            <div><div class="en-mrm-tile-title">ボード</div><div class="en-mrm-tile-sub">2列一覧から選んで全画面で作業</div></div>
          </button>
          <button type="button" class="en-mrm-tile" data-mrmgo="detail">
            <div class="en-mrm-tile-top"><span class="en-mrm-tile-ico">⚙️</span><span class="en-mrm-tile-badge">${lab.fanPublic ? '公開ON' : '非公開'}</span></div>
            <div><div class="en-mrm-tile-title">ルーム詳細</div><div class="en-mrm-tile-sub">設定・企画書履歴(${d.reportHistory.length}件)・参加ルール</div></div>
          </button>
        </div>
        <button type="button" class="en-mrm-complete-card ${isUnlocked ? 'unlocked' : 'locked'}" id="enMrmCompleteBtn">
          <span class="en-mrm-complete-ico">${isUnlocked ? '🍊' : '🔒'}</span>
          <span class="en-mrm-complete-txt">
            <strong>商品完成登録${isUnlocked ? '（解放中！）' : ''}</strong>
            <small>${isUnlocked ? `試作フェーズ到達で解放！完成登録へ（現在 ${gate.pct}%）` : `進捗が「🧪 試作」になるとオレンジ解放されます`}</small>
          </span>
          <span class="en-mrm-complete-pill">${isUnlocked ? '登録する ➔' : '試作で解放'}</span>
        </button>
      </div>
      ${buildMobileDock('hub')}
    `;

    const car = document.getElementById('enMrmCarousel');
    const dots = modal.querySelectorAll('#enMrmDots .en-mrm-dot');
    if (car) {
      const slides = Array.from(car.querySelectorAll('.en-mrm-slide'));
      const centerScrollOf = (idx) => {
        const el = slides[idx];
        return el ? Math.max(0, el.offsetLeft - (car.clientWidth - el.clientWidth) / 2) : 0;
      };
      const updateDots = (idx) => dots.forEach((dt, i) => dt.classList.toggle('active', i === idx));
      const startIdx = typeof uiState._staySlide === 'number' ? uiState._staySlide : 1;
      const snapInitial = () => { car.scrollLeft = centerScrollOf(startIdx); updateDots(startIdx); };
      snapInitial();
      requestAnimationFrame(snapInitial);

      car.addEventListener('scroll', () => {
        const centerX = car.scrollLeft + car.clientWidth / 2;
        let bestIdx = 1, bestDist = Infinity;
        slides.forEach((sl, i) => {
          const dist = Math.abs((sl.offsetLeft + sl.clientWidth / 2) - centerX);
          if (dist < bestDist) { bestDist = dist; bestIdx = i; }
        });
        uiState._staySlide = bestIdx;
        updateDots(bestIdx);
      }, { passive: true });
      dots.forEach(dt => dt.onclick = () => {
        const idx = Number(dt.getAttribute('data-dot'));
        uiState._staySlide = idx;
        car.scrollTo({ left: centerScrollOf(idx), behavior: 'smooth' });
      });
    }

    modal.querySelectorAll('[data-hljump]').forEach(btn => {
      btn.onclick = () => {
        const act = btn.getAttribute('data-hljump');
        if (act.startsWith('board:')) {
          const tid = act.slice(6);
          if (!d.activeTools.includes(tid)) d.activeTools.push(tid);
          d.selectedTool = tid; safeSave();
          uiState.boardViewMode = 'detail'; enViewState.roomTab = 'board';
        } else { enViewState.roomTab = act; }
        window.renderEnRoomModal();
      };
    });

    const rerenderOnCal = () => { uiState._staySlide = 1; window.renderEnRoomModal(); };
    document.getElementById('enGcalPrevM')?.addEventListener('click', () => { shiftCalMonth(-1); rerenderOnCal(); });
    document.getElementById('enGcalNextM')?.addEventListener('click', () => { shiftCalMonth(1); rerenderOnCal(); });
    document.getElementById('enGcalPrevDay')?.addEventListener('click', () => { shiftSelectedDate(-1); rerenderOnCal(); });
    document.getElementById('enGcalNextDay')?.addEventListener('click', () => { shiftSelectedDate(1); rerenderOnCal(); });
    document.getElementById('enGcalAddBtn')?.addEventListener('click', () => { uiState._staySlide = 1; openAddCalEventSheet(lab.id, d, calState.selectedDate); });
    document.getElementById('enGcalManageBtn')?.addEventListener('click', () => { uiState._staySlide = 1; openAddCalEventSheet(lab.id, d, calState.selectedDate); });
    modal.querySelectorAll('[data-gcaldate]').forEach(cell => {
      cell.onclick = () => {
        const dt = cell.getAttribute('data-gcaldate');
        uiState._staySlide = 1;
        if (calState.selectedDate === dt) openAddCalEventSheet(lab.id, d, dt);
        else { calState.selectedDate = dt; window.renderEnRoomModal(); }
      };
    });

    const gcalGrid = document.getElementById('enGcalGrid');
    if (gcalGrid) {
      let sx = 0, sy = 0;
      gcalGrid.addEventListener('touchstart', e => { if (!e.touches[0]) return; sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
      gcalGrid.addEventListener('touchend', e => {
        if (!e.changedTouches[0]) return;
        const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx) * 1.4) { shiftCalMonth(dy < 0 ? 1 : -1); rerenderOnCal(); }
      }, { passive: true });
    }

    document.getElementById('enMrmExitBtn').onclick = closeMobileRoomModal;
    document.getElementById('enMrmFanBtn').onclick = () => { enViewState.roomViewAsFan = true; window.renderEnRoomModal(); };
    modal.querySelectorAll('[data-mrmgo]').forEach(btn => {
      btn.onclick = () => {
        const next = btn.getAttribute('data-mrmgo');
        if (next === 'board') uiState.boardViewMode = 'list';
        uiState.talkPlusOpen = false;
        enViewState.roomTab = next;
        window.renderEnRoomModal();
      };
    });
    document.getElementById('enMrmCompleteBtn')?.addEventListener('click', () => {
      if (isUnlocked) { enViewState.roomTab = 'launch'; window.renderEnRoomModal(); }
      else { enToast('🧪 進行のロードマップで「試作」に進めるとオレンジ解放されます！'); enViewState.roomTab = 'progress'; window.renderEnRoomModal(); }
    });
    bindMobileDock(modal);
    if (typeof enSyncTheme === 'function') enSyncTheme();
  }

  // --- ルーム詳細 ---
  function renderMobileRoomSettings(modal, lab, d) {
    const latestRep = d.reportHistory[0];
    modal.innerHTML = `
      <div class="en-room-head">
        <button type="button" class="en-act-btn" data-mrmgo="hub">← ホーム</button>
        <strong style="font-size:13.5px;flex:1;text-align:center;">⚙️ ルーム詳細・設定</strong>
        <button type="button" class="en-act-btn" id="enMrmCloseAll">✕</button>
      </div>
      <div class="en-room-body" id="enRoomBody">
        <div class="card en-card">
          <div class="en-title">🏷️ 基本情報・開発ゴール</div>
          <div><div class="en-meta" style="font-weight:800;margin-bottom:3px;">プロジェクト名</div><input id="enSetLabTitle" class="en-input-field" value="${esc(lab.title)}"></div>
          <div><div class="en-meta" style="font-weight:800;margin-bottom:3px;">開発ゴール・目指す姿</div><textarea id="enSetLabGoal" class="en-input-field" rows="2">${esc(d.roomMeta.goal)}</textarea></div>
          <div class="en-form-grid-2">
            <div><div class="en-meta" style="font-weight:800;margin-bottom:3px;">現在の進捗フェーズ</div><select id="enSetLabStage" class="en-input-field">${STAGES.map(s => `<option value="${s.idx}" ${d.stage === s.idx ? 'selected' : ''}>${s.icon} ${s.label}</option>`).join('')}</select></div>
            <div><div class="en-meta" style="font-weight:800;margin-bottom:3px;">試作予算上限（円）</div><input id="enSetLabBudget" class="en-input-field" type="number" value="${esc(d.roomMeta.budgetCap)}"></div>
          </div>
        </div>
        <div class="card en-card">
          <div class="en-between"><div class="en-title">📄 商品企画書・履歴</div><button type="button" class="en-act-btn primary" style="padding:5px 10px;font-size:11.5px;" id="enSetOpenRepBtn">作成・履歴 ➔</button></div>
          <div class="en-meta">${latestRep ? `最終作成：<strong>${latestRep.ver}</strong>（${latestRep.createdAt}｜${latestRep.stage}）` : 'まだ未作成です。必要なタイミングで日時つき企画書を保存できます。'}</div>
        </div>
        <div class="card en-card">
          <div class="en-title">🔐 公開範囲・参加・通知設定</div>
          <div class="en-between"><span>🌐 ファン公開</span><button type="button" class="en-act-btn ${lab.fanPublic ? 'primary' : ''}" id="enSetFanPubBtn">${lab.fanPublic ? '公開 ON' : '非公開 OFF'}</button></div>
          <div class="en-between"><span>🔔 通知リマインド</span><button type="button" class="en-act-btn ${d.roomMeta.notify ? 'primary' : ''}" id="enSetNotifyBtn">${d.roomMeta.notify ? '通知 ON' : '通知 OFF'}</button></div>
          <div class="en-between"><span>👥 参加ルール</span><select id="enSetJoinPolicy" class="en-input-field" style="width:140px;"><option value="approval" ${d.roomMeta.joinPolicy === 'approval' ? 'selected' : ''}>承認制</option><option value="open" ${d.roomMeta.joinPolicy === 'open' ? 'selected' : ''}>だれでもOK</option><option value="invite" ${d.roomMeta.joinPolicy === 'invite' ? 'selected' : ''}>招待のみ</option></select></div>
        </div>
        <div class="card en-card">
          <div class="en-title">🤖 ツール・元ネタ管理</div>
          <div class="en-between"><span>✨ 実運用Proモード</span><button type="button" class="en-pro-pill ${enAiProEnabled ? '' : 'off'}" id="enSetProBtn">${enAiProEnabled ? 'Pro ON' : '無料モード'}</button></div>
          <div class="en-between"><span>🔗 元ネタつぶやき</span><button type="button" class="en-act-btn" id="enSetOriginBtn">元ネタへ ➔</button></div>
        </div>
      </div>
      ${buildMobileDock('detail')}
    `;

    document.getElementById('enMrmCloseAll').onclick = closeMobileRoomModal;
    document.getElementById('enSetOpenRepBtn').onclick = () => openReportHistorySheet(lab, d);
    document.getElementById('enSetLabTitle').onchange = e => { const v = e.target.value.trim(); if (v) { lab.title = v; enToast('🏷️ プロジェクト名を更新しました'); if (typeof renderEnLab === 'function') renderEnLab(); } };
    document.getElementById('enSetLabGoal').onchange = e => { d.roomMeta.goal = e.target.value; safeSave(); };
    document.getElementById('enSetLabBudget').onchange = e => { d.roomMeta.budgetCap = e.target.value; safeSave(); };
    document.getElementById('enSetLabStage').onchange = e => setStageAndNotify(d, Number(e.target.value));
    document.getElementById('enSetFanPubBtn').onclick = () => { if (typeof toggleLabFanPublic === 'function') toggleLabFanPublic(lab.id); else { lab.fanPublic = !lab.fanPublic; window.renderEnRoomModal(); } };
    document.getElementById('enSetNotifyBtn').onclick = () => { d.roomMeta.notify = !d.roomMeta.notify; safeSave(); window.renderEnRoomModal(); };
    document.getElementById('enSetJoinPolicy').onchange = e => { d.roomMeta.joinPolicy = e.target.value; safeSave(); enToast('👥 参加ルールを更新しました'); };
    document.getElementById('enSetProBtn').onclick = () => { enAiProEnabled = !enAiProEnabled; window.renderEnRoomModal(); };
    document.getElementById('enSetOriginBtn').onclick = () => { closeMobileRoomModal(); enViewState.enSubTab = 'tweet'; if (typeof renderEnFeed === 'function') renderEnFeed(); if (typeof enGoTab === 'function') enGoTab('feed'); };
    modal.querySelectorAll('[data-mrmgo]').forEach(btn => btn.onclick = () => { uiState._staySlide = 1; enViewState.roomTab = btn.getAttribute('data-mrmgo'); window.renderEnRoomModal(); });
    bindMobileDock(modal);
    if (typeof enSyncTheme === 'function') enSyncTheme();
  }

  // --- トーク機能強化（安全イベントリスナー化＆正確な送信ボタンID） ---
  function enhanceMobileTalk(modal, lab) {
    const body = modal.querySelector('#enRoomBody');
    if (body) {
      const priv = document.createElement('div');
      priv.className = 'en-talk-private-bar';
      priv.innerHTML = '🔒 ルーム内限定トーク（外部へ自動公開されることはありません）';
      body.insertBefore(priv, body.firstChild);

      const lastMeta = body.querySelector('.en-meta:last-child');
      if (lastMeta) lastMeta.textContent = '💡 発言タップ → ルーム内メモ・やること・なぜなぜへ（完全非公開）';

      requestAnimationFrame(() => {
        body.scrollTop = body.scrollHeight;
        vpState.talkAtBottom = true;
        vpState.talkSavedScrollTop = body.scrollTop;
      });
      body.addEventListener('scroll', () => { if (!vpState.isSyncing) captureTalkScrollState(); }, { passive: true });
      body.addEventListener('click', e => {
        if (!e.target.closest('.en-chat-bubble, button, a, input, textarea') && vpState.kbdActive) {
          document.activeElement?.blur();
        }
      });

      body.querySelectorAll('[data-msgaction]').forEach(b => {
        b.onclick = () => {
          const m = enViewState.roomMessages[Number(b.getAttribute('data-msgaction'))];
          if (!m) return;
          openEnSheetHtml('🔒 ルーム内ツールへメモ転送（非公開）', m.text, `
            <button type="button" class="en-sheet-item" id="enMrmToMemoBtn"><span>📌 ルーム内決定メモに保存<br><small class="en-meta">※外部非公開</small></span><span>➔</span></button>
            <button type="button" class="en-sheet-item" id="enMrmToTaskBtn"><span>✅ やることリストに追加</span><span>➔</span></button>
            <button type="button" class="en-sheet-item" id="enMrmToWhyBtn"><span>❓ なぜなぜ分析の課題に追加</span><span>➔</span></button>
          `);
          document.getElementById('enMrmToMemoBtn')?.addEventListener('click', () => {
            if (typeof sendMsgToBoard === 'function') sendMsgToBoard(m.text);
            enToast('📌 ルーム内決定メモに保存しました（非公開）');
          });
          document.getElementById('enMrmToTaskBtn')?.addEventListener('click', () => {
            if (typeof sendMsgToTask === 'function') sendMsgToTask(m.text);
          });
          document.getElementById('enMrmToWhyBtn')?.addEventListener('click', () => {
            if (typeof sendMsgToWhy === 'function') sendMsgToWhy(lab.id, m.text);
          });
        };
      });
    }

    const composer = modal.querySelector('.en-room-composer');
    if (composer) {
      const roomInp = composer.querySelector('#enRoomInput');
      if (roomInp) {
        roomInp.setAttribute('autocomplete', 'off');
        roomInp.setAttribute('autocorrect', 'off');
        roomInp.setAttribute('spellcheck', 'false');
        roomInp.setAttribute('enterkeyhint', 'send');
      }
      const sendBtn = composer.querySelector('#enRoomSend, .en-act-btn.primary');
      if (sendBtn) sendBtn.addEventListener('click', () => { vpState.talkAtBottom = true; }, true);

      const tray = document.createElement('div');
      tray.className = `en-talk-plus-tray ${uiState.talkPlusOpen ? 'open' : ''}`;
      tray.innerHTML = `
        <button type="button" class="en-talk-tray-btn ai" id="enTrayAiScan">✨ AI議事録スキャン</button>
        <button type="button" class="en-talk-tray-btn" id="enTrayPoll">🗳️ 多数決を立てる</button>
        <button type="button" class="en-talk-tray-btn" data-traymsg="📸 試作サンプルの写真を共有します！味見どうですか？">📸 試作を共有</button>
        <button type="button" class="en-talk-tray-btn" data-traymsg="💰 包材と加工費の見積りを原価ボードに更新しました！">💰 原価更新を共有</button>
      `;
      composer.parentNode.insertBefore(tray, composer);

      const plusBtn = document.createElement('button');
      plusBtn.type = 'button';
      plusBtn.className = `en-talk-plus-btn ${uiState.talkPlusOpen ? 'open' : ''}`;
      plusBtn.textContent = '+';
      plusBtn.onclick = () => {
        document.activeElement?.blur();
        uiState.talkPlusOpen = !uiState.talkPlusOpen;
        plusBtn.classList.toggle('open', uiState.talkPlusOpen);
        tray.classList.toggle('open', uiState.talkPlusOpen);
      };
      composer.insertBefore(plusBtn, composer.firstChild);

      tray.querySelector('#enTrayAiScan').onclick = () => { uiState.talkPlusOpen = false; openAiTranscriptScan(lab.id); };
      tray.querySelector('#enTrayPoll').onclick = () => { uiState.talkPlusOpen = false; openNewPollSheet(lab.id); };
      tray.querySelectorAll('[data-traymsg]').forEach(btn => {
        btn.onclick = () => {
          uiState.talkPlusOpen = false; vpState.talkAtBottom = true;
          enViewState.roomMessages.push({ sender: 'あなた', me: true, text: btn.getAttribute('data-traymsg') });
          window.renderEnRoomModal();
        };
      });
    }
  }

  function buildMobileDock(activeKey) {
    const tabs = [['hub','🏠','ホーム'], ['talk','💬','トーク'], ['progress','✅','進行'], ['board','🧰','ボード'], ['detail','⚙️','詳細']];
    return `
      <div class="en-room-nav en-mrm-dock">
        ${tabs.map(([k, ic, lb]) => `<button type="button" class="en-room-tab ${activeKey === k ? 'active' : ''}" data-mrmdock="${k}"><span style="font-size:17px;line-height:1;">${ic}</span><span>${lb}</span></button>`).join('')}
      </div>
    `;
  }

  function bindMobileDock(modal) {
    modal.querySelectorAll('[data-mrmdock]').forEach(btn => {
      btn.onclick = () => {
        document.activeElement?.blur();
        const next = btn.getAttribute('data-mrmdock');
        if (next === 'board') uiState.boardViewMode = 'list';
        if (next === 'hub') uiState._staySlide = 1;
        uiState.talkPlusOpen = false;
        enViewState.roomTab = next;
        window.renderEnRoomModal();
      };
    });
  }

  function applyMobileChrome(modal, lab, d, activeKey, subTitle, backLabel, backFn) {
    const head = modal.querySelector('.en-room-head');
    if (head) {
      head.innerHTML = `
        <button type="button" class="en-act-btn" id="enMrmBackBtn">${backLabel || '← ホーム'}</button>
        <strong style="font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;text-align:center;">${esc(subTitle || lab.title)}</strong>
        <button type="button" class="en-act-btn" id="enMrmCloseAll">✕</button>
      `;
      document.getElementById('enMrmBackBtn').onclick = backFn || (() => { document.activeElement?.blur(); uiState._staySlide = 1; enViewState.roomTab = 'hub'; window.renderEnRoomModal(); });
      document.getElementById('enMrmCloseAll').onclick = closeMobileRoomModal;
    }
    const oldNav = modal.querySelector('.en-room-nav');
    if (oldNav) { oldNav.outerHTML = buildMobileDock(activeKey); bindMobileDock(modal); }
  }

  // --- 既存フック（PCモード即バイパス＆巣立ち完了時クリーンアップ付き） ---
  function installHooks() {
    installKeyboardObservers();

    if (typeof window.completeProGraduation === 'function' && !window.completeProGraduation._enMrmWrapped) {
      const origGrad = window.completeProGraduation;
      const wrappedGrad = function () {
        setCurtainState(false);
        return origGrad.apply(this, arguments);
      };
      wrappedGrad._enMrmWrapped = true;
      window.completeProGraduation = wrappedGrad;
    }

    if (typeof window.openEnRoomModal === 'function' && !window.openEnRoomModal._enMrmWrapped) {
      const origOpen = window.openEnRoomModal;
      const wrappedOpen = function (labId, initialTab, asFan) {
        if (!isMobileRoomMode()) {
          setCurtainState(false);
          return origOpen.call(this, labId, initialTab, asFan);
        }
        uiState.boardViewMode = 'list';
        uiState.talkPlusOpen = false;
        uiState._staySlide = 1;
        const targetTab = !asFan ? 'hub' : initialTab;
        const res = origOpen.call(this, labId, targetTab, asFan);
        setCurtainState(true);
        syncViewportNow();
        return res;
      };
      wrappedOpen._enMrmWrapped = true;
      window.openEnRoomModal = wrappedOpen;
    }

    if (typeof window.renderEnRoomModal === 'function' && !window.renderEnRoomModal._enMrmWrapped) {
      const origRender = window.renderEnRoomModal;
      const wrappedRender = function () {
        const modal = document.getElementById('en-room-modal');

        if (!isMobileRoomMode()) {
          if (modal && modal.classList.contains('en-mrm-active')) {
            modal.classList.remove('en-mrm-active', 'en-mrm-board-detail', 'en-mrm-talk');
          }
          setCurtainState(false);
          if (typeof enViewState !== 'undefined' && (enViewState.roomTab === 'hub' || enViewState.roomTab === 'launch')) {
            enViewState.roomTab = enViewState.roomTab === 'launch' ? 'detail' : 'board';
          }
          return origRender.apply(this, arguments);
        }

        if (!modal || enViewState.roomViewAsFan) {
          if (modal) modal.classList.remove('en-mrm-active', 'en-mrm-board-detail', 'en-mrm-talk');
          const res = origRender.apply(this, arguments);
          // 外見えモードの「← 一覧」ボタンにも確実な後片付けを紐付け
          const fanBack = modal?.querySelector('.en-room-head button');
          if (fanBack && fanBack.textContent.includes('一覧')) {
            fanBack.onclick = closeMobileRoomModal;
          }
          return res;
        }

        const lab = enViewState.labs.find(l => l.id === enViewState.roomOpenId) || enViewState.labs[0];
        if (!lab) return origRender.apply(this, arguments);
        const d = ensureMobileLabData(getRoomProData(lab.id));
        const rt = enViewState.roomTab;

        modal.classList.add('en-mrm-active');
        modal.classList.remove('en-mrm-board-detail', 'en-mrm-talk');
        if (modal.classList.contains('open')) setCurtainState(true);

        if (rt === 'hub') { renderMobileRoomHub(modal, lab, d); return; }
        if (rt === 'detail') { renderMobileRoomSettings(modal, lab, d); return; }

        if (rt === 'launch') {
          enViewState.roomTab = 'detail';
          origRender.apply(this, arguments);
          enViewState.roomTab = 'launch';
          const body = modal.querySelector('#enRoomBody');
          if (body) Array.from(body.children).forEach((el, idx) => { if (idx > 0) el.style.display = 'none'; });
          applyMobileChrome(modal, lab, d, 'hub', '🍊 商品完成登録');
          return;
        }

        if (rt === 'progress') {
          origRender.apply(this, arguments);
          const body = modal.querySelector('#enRoomBody');
          if (body) {
            if (body.firstElementChild) body.firstElementChild.style.display = 'none';
            if (body.lastElementChild && body.children.length > 3) body.lastElementChild.style.display = 'none';
            body.querySelectorAll('.en-title').forEach(el => {
              if (el.textContent.includes('公開多数決')) el.textContent = el.textContent.replace('公開多数決', 'ルーム内多数決');
            });
            const wrap = document.createElement('div');
            wrap.innerHTML = buildFocusRoadmapHtml(lab, d);
            const rmEl = wrap.firstElementChild;
            body.insertBefore(rmEl, body.firstElementChild);
            bindFocusRoadmapEvents(rmEl, lab, d);
          }
          applyMobileChrome(modal, lab, d, 'progress', '✅ 進行・ロードマップ');
          return;
        }

        if (rt === 'board') {
          if (uiState.boardViewMode === 'list') { renderMobileBoardHubList(modal, lab, d); return; }
          origRender.apply(this, arguments);
          modal.classList.add('en-mrm-board-detail');
          const curDef = getAllActiveBoardDefs(d).find(b => b.id === d.selectedTool);
          const titleStr = curDef ? `${curDef.icon} ${safeBoardName(curDef)}` : '🧰 開発ボード';
          modal.querySelectorAll('#enRoomBody .en-title').forEach(el => {
            if (el.textContent.includes('公開ストーリー')) el.textContent = '📌 ルーム内決定メモ（非公開）';
          });
          modal.querySelectorAll('#enRoomBody .en-act-btn').forEach(btn => {
            if (btn.textContent.includes('ストーリーへ')) btn.textContent = '📌 決定メモへ';
          });
          applyMobileChrome(modal, lab, d, 'board', titleStr, '← ボード一覧', () => {
            document.activeElement?.blur();
            uiState.boardViewMode = 'list';
            window.renderEnRoomModal();
          });
          return;
        }

        origRender.apply(this, arguments);
        modal.classList.add('en-mrm-talk');
        enhanceMobileTalk(modal, lab);
        applyMobileChrome(modal, lab, d, 'talk', '💬 トーク（非公開）');
      };
      wrappedRender._enMrmWrapped = true;
      window.renderEnRoomModal = wrappedRender;
    }
  }

  installHooks();
  window.addEventListener('DOMContentLoaded', () => {
    installHooks();
    setTimeout(installHooks, 250);
  });
})();