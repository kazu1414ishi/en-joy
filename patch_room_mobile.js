/* =========================================================
   EN•joy スマホ版 進行中ラボ専用ルームUI（patch_room_mobile.js v1）
   ・ルームに入ったらまず「🏠 ルームホーム」を表示（トーク困惑を解消）
   ・上：1×1横スワイプ（Googleカレンダー風月間カレンダー／進捗サマリー／最新状況）
   ・中：2列タイル（トーク／進行／ボード／ルーム詳細）
   ・下：1列フル幅「商品完成登録」（進捗が「試作」到達でオレンジ解放！）
   ・進行トップ：「巣立ちロードマップ」表示＆フェーズ操作
   ========================================================= */

(function () {
  const STAGES = [
    { idx: 0, icon: '🌱', label: 'タネ',     full: 'アイデア・タネ出し',   hint: 'まずはトークやボードで方向性を話そう' },
    { idx: 1, icon: '💰', label: '企画原価', full: '企画・市場・原価設計', hint: '「試作」へ進むと商品完成登録がオレンジ解放！' },
    { idx: 2, icon: '🧪', label: '試作',     full: '試作・味と包材テスト', hint: '🍊 商品完成登録が解放中！試作と並行して準備OK' },
    { idx: 3, icon: '📋', label: '表示法規', full: '食品表示・法規最終確認', hint: '一括表示とアレルゲンを仕上げて巣立ちへ！' },
    { idx: 4, icon: '🎉', label: '巣立ち',   full: '完成・マルシェへ巣立ち', hint: '全準備クリア！完成登録からお披露目しよう！' }
  ];

  const calState = {
    year: 2026,
    month: 10, // 0-indexed (10 = 11月)
    selectedDate: '2026-11-29'
  };

  function isMobileRoomMode() {
    return !document.documentElement.classList.contains('en-pc-mode');
  }

  function esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function pad2(n) { return String(n).padStart(2, '0'); }
  function ymd(y, m, d) { return `${y}-${pad2(m + 1)}-${pad2(d)}`; }

  // ラボ固有データへ「フェーズ」「カレンダー予定」「詳細設定」を安全に初期化
  function ensureMobileLabData(d) {
    if (typeof d.stage !== 'number') {
      // 初回は「企画・原価(1)」からスタートし、進行ロードマップで「試作(2)」を押すとオレンジ解放を体感可能
      d.stage = 1;
    }
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
        joinPolicy: 'approval', // 'open' | 'approval' | 'invite'
        budgetCap: '50000'
      };
    }
    return d;
  }

  // =========================================================
  // 📅 Googleカレンダー風 月間カレンダーHTML生成
  // =========================================================
  function buildMonthlyCalendarSlide(lab, d) {
    const y = calState.year;
    const m = calState.month;
    const firstDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevMonthDays = new Date(y, m, 0).getDate();
    const todayStr = '2026-11-28';

    // 日付別イベントマップ
    const evMap = {};
    d.calEvents.forEach(ev => {
      if (!evMap[ev.date]) evMap[ev.date] = [];
      evMap[ev.date].push(ev);
    });

    const cells = [];
    // 前月埋め
    for (let i = firstDow - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const dt = new Date(y, m - 1, day);
      cells.push({ date: ymd(dt.getFullYear(), dt.getMonth(), day), day, other: true, dow: dt.getDay() });
    }
    // 当月
    for (let day = 1; day <= daysInMonth; day++) {
      const dt = new Date(y, m, day);
      cells.push({ date: ymd(y, m, day), day, other: false, dow: dt.getDay() });
    }
    // 翌月埋め（最大35または42マスで整列）
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
      <div class="en-mrm-slide">
        <div class="en-gcal-head">
          <span class="en-gcal-month">📅 ${y}年${m + 1}月</span>
          <div class="en-gcal-nav">
            <button type="button" class="en-gcal-btn" id="enGcalPrev" aria-label="前の月">◀</button>
            <button type="button" class="en-gcal-btn" id="enGcalToday">今月</button>
            <button type="button" class="en-gcal-btn" id="enGcalNext" aria-label="次の月">▶</button>
            <button type="button" class="en-gcal-btn primary" id="enGcalAddBtn">＋予定</button>
          </div>
        </div>

        <div class="en-gcal-dow">
          <span>日</span><span>月</span><span>火</span><span>水</span><span>木</span><span>金</span><span>土</span>
        </div>

        <div class="en-gcal-grid">
          ${cells.map(c => {
            const evs = evMap[c.date] || [];
            const cls = [
              'en-gcal-cell',
              c.other ? 'other' : '',
              c.dow === 0 ? 'is-sun' : '',
              c.dow === 6 ? 'is-sat' : '',
              c.date === todayStr ? 'is-today' : '',
              c.date === calState.selectedDate ? 'selected' : ''
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

        <div class="en-gcal-agenda">
          <div class="en-gcal-agenda-txt">
            <strong>${selDisp}</strong>：${selEvents.length ? selEvents.map(e => esc(e.title)).join(' / ') : '<span class="en-meta">予定なし</span>'}
          </div>
          ${selEvents.length ? `<button type="button" class="en-gcal-btn" id="enGcalManageBtn">編集</button>` : ''}
        </div>
      </div>
    `;
  }

  function openAddCalEventSheet(labId, d, dateStr) {
    const evs = d.calEvents.filter(e => e.date === dateStr);
    openEnSheetHtml(`📅 ${dateStr} のラボ予定`, 'Googleカレンダー感覚で開発マイルストーンを管理', `
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
        const id = btn.getAttribute('data-delcalev');
        d.calEvents = d.calEvents.filter(x => x.id !== id);
        saveRoomProStore();
        openAddCalEventSheet(labId, d, dateStr);
        window.renderEnRoomModal();
      };
    });
    document.getElementById('enCalEvSaveBtn')?.addEventListener('click', () => {
      const title = document.getElementById('enCalEvTitleIn')?.value.trim();
      const tone = Number(document.getElementById('enCalEvToneIn')?.value || 1);
      if (!title) return enToast('⚠️ 予定タイトルを入力してください');
      d.calEvents.push({ id: 'ev-' + Date.now(), date: dateStr, title, tone });
      saveRoomProStore();
      closeEnSheet();
      enToast(`📅 ${dateStr} に予定を追加しました！`);
      window.renderEnRoomModal();
    });
  }

  // =========================================================
  // 🗺️ 巣立ちロードマップカード（進行タブトップに表示）
  // =========================================================
  function buildRoadmapHtml(lab, d) {
    const st = STAGES[d.stage] || STAGES[1];
    const unlocked = d.stage >= 2;
    const gate = getLaunchGateStatus(d);

    return `
      <div class="en-roadmap-card" id="enMrmRoadmapCard">
        <div class="en-between">
          <div class="en-title">🗺️ 巣立ちロードマップ</div>
          <span class="en-pill" style="${unlocked ? 'background:rgba(249,115,22,0.16);color:#ea580c;' : ''}">現在：${st.icon} ${st.label}</span>
        </div>

        <div class="en-roadmap-steps">
          ${STAGES.map(s => {
            const cls = [
              'en-rm-step',
              s.idx < d.stage ? 'done' : '',
              s.idx === d.stage ? 'current' : '',
              s.idx === 2 ? 'is-proto-gate' : ''
            ].filter(Boolean).join(' ');
            return `
              <button type="button" class="${cls}" data-setstage="${s.idx}" title="${s.full}">
                <span class="rm-ico">${s.idx < d.stage ? '✅' : s.icon}</span>
                <span class="rm-lbl">${s.label}</span>
              </button>
            `;
          }).join('')}
        </div>

        <div class="en-roadmap-note">
          <span>${st.hint}</span>
          ${unlocked
            ? `<button type="button" class="en-gcal-btn primary" style="background:#f97316;flex-shrink:0;" id="enRmGoLaunchBtn">🍊 完成登録 (${gate.pct}%)</button>`
            : `<button type="button" class="en-gcal-btn" style="flex-shrink:0;" data-setstage="2">🧪 試作へ進める</button>`
          }
        </div>
      </div>
    `;
  }

  function bindRoadmapEvents(root, lab, d) {
    root.querySelectorAll('[data-setstage]').forEach(btn => {
      btn.onclick = () => {
        const nextStage = Number(btn.getAttribute('data-setstage'));
        const wasLocked = d.stage < 2;
        d.stage = nextStage;
        saveRoomProStore();
        if (wasLocked && nextStage >= 2) {
          enToast('🍊 進捗が「試作」に到達！商品完成登録がオレンジ解放されました！');
        } else {
          enToast(`🗺️ 進捗を「${STAGES[nextStage].full}」に更新しました`);
        }
        window.renderEnRoomModal();
      };
    });
    root.querySelector('#enRmGoLaunchBtn')?.addEventListener('click', () => {
      enViewState.roomTab = 'launch';
      window.renderEnRoomModal();
    });
  }

  // =========================================================
  // 🏠 スマホ版 ルームホーム画面（1×1スワイプ ＋ 2列 ＋ 1列解放）
  // =========================================================
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
    const isUnlocked = d.stage >= 2; // 進捗が「試作」以上でオレンジ解放！
    const p0 = d.polls[0];

    const slide2 = `
      <div class="en-mrm-slide">
        <div class="en-between">
          <strong style="font-size:14px;">📊 ラボ現在地サマリー</strong>
          <span class="en-pill">${st.icon} ${st.label}</span>
        </div>
        <div class="en-mrm-stat-grid">
          <div class="en-mrm-stat-box">
            <small>💰 現在の原価率</small>
            <strong style="color:${costRate <= 55 ? '#10b981' : '#f97316'};">${costRate}%</strong>
          </div>
          <div class="en-mrm-stat-box">
            <small>✨ 直販1個粗利</small>
            <strong>¥${profit}</strong>
          </div>
          <div class="en-mrm-stat-box">
            <small>🧪 試作パターン</small>
            <strong>${d.protos.length}案</strong>
          </div>
          <div class="en-mrm-stat-box">
            <small>📋 食品表示・法規</small>
            <strong>${d.legal.filter(x => x.done).length}/${d.legal.length}済</strong>
          </div>
        </div>
        <div class="en-meta" style="font-size:11px;">🎯 目標：${esc(d.roomMeta.goal)}</div>
      </div>
    `;

    const slide3 = `
      <div class="en-mrm-slide">
        <div class="en-between">
          <strong style="font-size:14px;">⚡ いま動くべきハイライト</strong>
          <span class="en-pill">直近トピック</span>
        </div>
        <div class="en-formula" style="flex:1;justify-content:center;gap:6px;">
          <div style="font-size:12px;"><strong>💬 最新トーク：</strong>${lastMsg ? esc(lastMsg.sender + '「' + lastMsg.text + '」') : 'まだトークはありません'}</div>
          ${p0 ? `<div style="font-size:12px;"><strong>🗳️ 多数決中：</strong>${esc(p0.title)}（${p0.deadline}）</div>` : ''}
          <div style="font-size:12px;"><strong>✅ 未完了タスク：</strong>残り ${pendingTasks} 件</div>
        </div>
        <div class="en-row">
          <button type="button" class="en-act-btn primary" style="flex:1;justify-content:center;" data-mrmgo="talk">💬 トークを見る</button>
          <button type="button" class="en-act-btn" style="flex:1;justify-content:center;" onclick="openProjectReportSheet('${lab.id}')">📄 企画書</button>
        </div>
      </div>
    `;

    modal.innerHTML = `
      <div class="en-room-head">
        <button type="button" class="en-act-btn" id="enMrmExitBtn">← 一覧</button>
        <strong style="font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;text-align:center;">${esc(lab.title)}</strong>
        <button type="button" class="en-act-btn" id="enMrmFanBtn">👀 外見え</button>
      </div>

      <div class="en-room-body" id="enRoomBody">
        <!-- 1×1 横スクロール情報＆Googleカレンダー風月間カレンダー -->
        <div class="en-mrm-carousel-wrap">
          <div class="en-mrm-carousel" id="enMrmCarousel">
            ${buildMonthlyCalendarSlide(lab, d)}
            ${slide2}
            ${slide3}
          </div>
          <div class="en-mrm-dots" id="enMrmDots">
            <button type="button" class="en-mrm-dot active" data-dot="0" aria-label="カレンダー"></button>
            <button type="button" class="en-mrm-dot" data-dot="1" aria-label="サマリー"></button>
            <button type="button" class="en-mrm-dot" data-dot="2" aria-label="ハイライト"></button>
          </div>
        </div>

        <!-- 2列タイルメニュー（トーク / 進行 / ボード / ルーム詳細） -->
        <div class="en-mrm-tile-grid">
          <button type="button" class="en-mrm-tile" data-mrmgo="talk">
            <div class="en-mrm-tile-top">
              <span class="en-mrm-tile-ico">💬</span>
              <span class="en-mrm-tile-badge">${enViewState.roomMessages.length}件</span>
            </div>
            <div>
              <div class="en-mrm-tile-title">トーク</div>
              <div class="en-mrm-tile-sub">${lastMsg ? esc(lastMsg.text) : 'メンバーと相談する'}</div>
            </div>
          </button>

          <button type="button" class="en-mrm-tile" data-mrmgo="progress">
            <div class="en-mrm-tile-top">
              <span class="en-mrm-tile-ico">✅</span>
              <span class="en-mrm-tile-badge">${st.icon} ${st.label}</span>
            </div>
            <div>
              <div class="en-mrm-tile-title">進行</div>
              <div class="en-mrm-tile-sub">巣立ちロードマップ・やること残り${pendingTasks}件</div>
            </div>
          </button>

          <button type="button" class="en-mrm-tile" data-mrmgo="board">
            <div class="en-mrm-tile-top">
              <span class="en-mrm-tile-ico">🧰</span>
              <span class="en-mrm-tile-badge">${allBoards.length}種</span>
            </div>
            <div>
              <div class="en-mrm-tile-title">ボード</div>
              <div class="en-mrm-tile-sub">意思決定・原価(${costRate}%)・試作・食品表示</div>
            </div>
          </button>

          <button type="button" class="en-mrm-tile" data-mrmgo="detail">
            <div class="en-mrm-tile-top">
              <span class="en-mrm-tile-ico">⚙️</span>
              <span class="en-mrm-tile-badge">${lab.fanPublic ? '公開ON' : '非公開'}</span>
            </div>
            <div>
              <div class="en-mrm-tile-title">ルーム詳細</div>
              <div class="en-mrm-tile-sub">名前・公開範囲・通知・AI設定・企画書出力</div>
            </div>
          </button>
        </div>

        <!-- 1列フル幅：商品完成登録（試作フェーズ到達でオレンジ解放！） -->
        <button type="button" class="en-mrm-complete-card ${isUnlocked ? 'unlocked' : 'locked'}" id="enMrmCompleteBtn">
          <span class="en-mrm-complete-ico">${isUnlocked ? '🍊' : '🔒'}</span>
          <span class="en-mrm-complete-txt">
            <strong>商品完成登録${isUnlocked ? '（解放中！）' : ''}</strong>
            <small>${isUnlocked
              ? `試作フェーズ到達で解放！完成写真・価格・販路を登録しよう（現在 ${gate.pct}%）`
              : `進捗が「🧪 試作」になるとオレンジ解放されます（タップして進行へ）`
            }</small>
          </span>
          <span class="en-mrm-complete-pill">${isUnlocked ? '登録する ➔' : '試作で解放'}</span>
        </button>
      </div>

      ${buildMobileDock('hub')}
    `;

    // イベント紐付け
    document.getElementById('enMrmExitBtn').onclick = () => modal.classList.remove('open');
    document.getElementById('enMrmFanBtn').onclick = () => { enViewState.roomViewAsFan = true; window.renderEnRoomModal(); };

    // カルーセルのドット同期
    const car = document.getElementById('enMrmCarousel');
    const dots = modal.querySelectorAll('#enMrmDots .en-mrm-dot');
    if (car) {
      car.addEventListener('scroll', () => {
        const w = car.clientWidth * 0.92 || 1;
        const idx = Math.min(2, Math.max(0, Math.round(car.scrollLeft / w)));
        dots.forEach((dt, i) => dt.classList.toggle('active', i === idx));
      }, { passive: true });
      dots.forEach(dt => dt.onclick = () => {
        const idx = Number(dt.getAttribute('data-dot'));
        car.scrollTo({ left: idx * (car.clientWidth * 0.92 + 10), behavior: 'smooth' });
      });
    }

    // カレンダー操作
    document.getElementById('enGcalPrev')?.addEventListener('click', () => {
      calState.month--;
      if (calState.month < 0) { calState.month = 11; calState.year--; }
      window.renderEnRoomModal();
    });
    document.getElementById('enGcalNext')?.addEventListener('click', () => {
      calState.month++;
      if (calState.month > 11) { calState.month = 0; calState.year++; }
      window.renderEnRoomModal();
    });
    document.getElementById('enGcalToday')?.addEventListener('click', () => {
      calState.year = 2026; calState.month = 10; calState.selectedDate = '2026-11-28';
      window.renderEnRoomModal();
    });
    document.getElementById('enGcalAddBtn')?.addEventListener('click', () => openAddCalEventSheet(lab.id, d, calState.selectedDate));
    document.getElementById('enGcalManageBtn')?.addEventListener('click', () => openAddCalEventSheet(lab.id, d, calState.selectedDate));
    modal.querySelectorAll('[data-gcaldate]').forEach(cell => {
      cell.onclick = () => {
        const dt = cell.getAttribute('data-gcaldate');
        if (calState.selectedDate === dt) {
          openAddCalEventSheet(lab.id, d, dt);
        } else {
          calState.selectedDate = dt;
          window.renderEnRoomModal();
        }
      };
    });

    // 2列タイル遷移
    modal.querySelectorAll('[data-mrmgo]').forEach(btn => {
      btn.onclick = () => {
        enViewState.roomTab = btn.getAttribute('data-mrmgo');
        window.renderEnRoomModal();
      };
    });

    // 1列 商品完成登録（解放済→完成登録画面 / 未解放→進行ロードマップへ案内）
    document.getElementById('enMrmCompleteBtn')?.addEventListener('click', () => {
      if (isUnlocked) {
        enViewState.roomTab = 'launch';
        window.renderEnRoomModal();
      } else {
        enToast('🧪 進行のロードマップで「試作」に進めるとオレンジ解放されます！');
        enViewState.roomTab = 'progress';
        window.renderEnRoomModal();
      }
    });

    bindMobileDock(modal);
    if (typeof enSyncTheme === 'function') enSyncTheme();
  }

  // =========================================================
  // ⚙️ ルーム詳細（細かい設定専用画面）
  // =========================================================
  function renderMobileRoomSettings(modal, lab, d) {
    const st = STAGES[d.stage] || STAGES[1];
    modal.innerHTML = `
      <div class="en-room-head">
        <button type="button" class="en-act-btn" data-mrmgo="hub">← ホーム</button>
        <strong style="font-size:13.5px;flex:1;text-align:center;">⚙️ ルーム詳細・設定</strong>
        <button type="button" class="en-act-btn" onclick="openProjectReportSheet('${lab.id}')">📄 企画書</button>
      </div>

      <div class="en-room-body" id="enRoomBody">
        <div class="card en-card">
          <div class="en-title">🏷️ 基本情報・開発ゴール</div>
          <div>
            <div class="en-meta" style="font-weight:800;margin-bottom:3px;">プロジェクト名</div>
            <input id="enSetLabTitle" class="en-input-field" value="${esc(lab.title)}">
          </div>
          <div>
            <div class="en-meta" style="font-weight:800;margin-bottom:3px;">開発ゴール・目指す姿</div>
            <textarea id="enSetLabGoal" class="en-input-field" rows="2">${esc(d.roomMeta.goal)}</textarea>
          </div>
          <div class="en-form-grid-2">
            <div>
              <div class="en-meta" style="font-weight:800;margin-bottom:3px;">現在の進捗フェーズ</div>
              <select id="enSetLabStage" class="en-input-field">
                ${STAGES.map(s => `<option value="${s.idx}" ${d.stage === s.idx ? 'selected' : ''}>${s.icon} ${s.full}</option>`).join('')}
              </select>
            </div>
            <div>
              <div class="en-meta" style="font-weight:800;margin-bottom:3px;">試作予算上限（円）</div>
              <input id="enSetLabBudget" class="en-input-field" type="number" value="${esc(d.roomMeta.budgetCap)}">
            </div>
          </div>
        </div>

        <div class="card en-card">
          <div class="en-title">🔐 公開範囲・参加・通知設定</div>
          <div class="en-between">
            <span>🌐 ファン公開（外からの見え方）</span>
            <button type="button" class="en-act-btn ${lab.fanPublic ? 'primary' : ''}" id="enSetFanPubBtn">${lab.fanPublic ? '公開 ON' : '非公開 OFF'}</button>
          </div>
          <div class="en-between">
            <span>🔔 トーク・締切リマインド通知</span>
            <button type="button" class="en-act-btn ${d.roomMeta.notify ? 'primary' : ''}" id="enSetNotifyBtn">${d.roomMeta.notify ? '通知 ON' : '通知 OFF'}</button>
          </div>
          <div class="en-between">
            <span>👥 新規メンバー参加ルール</span>
            <select id="enSetJoinPolicy" class="en-input-field" style="width:140px;">
              <option value="approval" ${d.roomMeta.joinPolicy === 'approval' ? 'selected' : ''}>承認制（おすすめ）</option>
              <option value="open" ${d.roomMeta.joinPolicy === 'open' ? 'selected' : ''}>だれでも参加OK</option>
              <option value="invite" ${d.roomMeta.joinPolicy === 'invite' ? 'selected' : ''}>招待のみ（非公開）</option>
            </select>
          </div>
        </div>

        <div class="card en-card">
          <div class="en-title">🤖 ツール・出力管理</div>
          <div class="en-between">
            <span>✨ 実運用Proモード（AI伴走）</span>
            <button type="button" class="en-pro-pill ${enAiProEnabled ? '' : 'off'}" id="enSetProBtn">${enAiProEnabled ? 'Pro ON' : '無料モード'}</button>
          </div>
          <div class="en-between">
            <span>🧰 使用中ボードを整理・追加</span>
            <button type="button" class="en-act-btn" onclick="openBoardHubSheet('${lab.id}')">ボード管理 ➔</button>
          </div>
          <div class="en-between">
            <span>📄 商品企画書レポート出力</span>
            <button type="button" class="en-act-btn primary" onclick="openProjectReportSheet('${lab.id}')">1タップ生成 ➔</button>
          </div>
          <div class="en-between">
            <span>🔗 元ネタつぶやきへ移動</span>
            <button type="button" class="en-act-btn" id="enSetOriginBtn">元ネタへ ➔</button>
          </div>
        </div>
      </div>

      ${buildMobileDock('detail')}
    `;

    document.getElementById('enSetLabTitle').onchange = e => {
      const v = e.target.value.trim();
      if (v) { lab.title = v; enToast('🏷️ プロジェクト名を更新しました'); if (typeof renderEnLab === 'function') renderEnLab(); }
    };
    document.getElementById('enSetLabGoal').onchange = e => { d.roomMeta.goal = e.target.value; saveRoomProStore(); };
    document.getElementById('enSetLabBudget').onchange = e => { d.roomMeta.budgetCap = e.target.value; saveRoomProStore(); };
    document.getElementById('enSetLabStage').onchange = e => {
      const prev = d.stage;
      d.stage = Number(e.target.value);
      saveRoomProStore();
      if (prev < 2 && d.stage >= 2) enToast('🍊 商品完成登録がオレンジ解放されました！');
      else enToast(`🗺️ フェーズを「${STAGES[d.stage].full}」へ変更`);
    };
    document.getElementById('enSetFanPubBtn').onclick = () => {
      if (typeof toggleLabFanPublic === 'function') toggleLabFanPublic(lab.id);
      else { lab.fanPublic = !lab.fanPublic; window.renderEnRoomModal(); }
    };
    document.getElementById('enSetNotifyBtn').onclick = () => {
      d.roomMeta.notify = !d.roomMeta.notify; saveRoomProStore(); window.renderEnRoomModal();
    };
    document.getElementById('enSetJoinPolicy').onchange = e => { d.roomMeta.joinPolicy = e.target.value; saveRoomProStore(); enToast('👥 参加ルールを更新しました'); };
    document.getElementById('enSetProBtn').onclick = () => { enAiProEnabled = !enAiProEnabled; window.renderEnRoomModal(); };
    document.getElementById('enSetOriginBtn').onclick = () => {
      modal.classList.remove('open');
      enViewState.enSubTab = 'tweet';
      if (typeof renderEnFeed === 'function') renderEnFeed();
      if (typeof enGoTab === 'function') enGoTab('feed');
    };

    modal.querySelectorAll('[data-mrmgo]').forEach(btn => btn.onclick = () => { enViewState.roomTab = btn.getAttribute('data-mrmgo'); window.renderEnRoomModal(); });
    bindMobileDock(modal);
    if (typeof enSyncTheme === 'function') enSyncTheme();
  }

  // 下部5アイコン親指ドック（🏠 ホーム / 💬 トーク / ✅ 進行 / 🧰 ボード / ⚙️ 詳細）
  function buildMobileDock(activeKey) {
    const tabs = [
      ['hub',      '🏠', 'ホーム'],
      ['talk',     '💬', 'トーク'],
      ['progress', '✅', '進行'],
      ['board',    '🧰', 'ボード'],
      ['detail',   '⚙️', '詳細']
    ];
    return `
      <div class="en-room-nav en-mrm-dock">
        ${tabs.map(([k, ic, lb]) => `
          <button type="button" class="en-room-tab ${activeKey === k ? 'active' : ''}" data-mrmdock="${k}">
            <span style="font-size:17px;line-height:1;">${ic}</span><span>${lb}</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  function bindMobileDock(modal) {
    modal.querySelectorAll('[data-mrmdock]').forEach(btn => {
      btn.onclick = () => {
        enViewState.roomTab = btn.getAttribute('data-mrmdock');
        window.renderEnRoomModal();
      };
    });
  }

  // サブ画面（トーク / 進行 / ボード / 商品完成登録）のヘッダー＆下部ドックを統一
  function applyMobileChrome(modal, lab, d, activeKey, subTitle) {
    const head = modal.querySelector('.en-room-head');
    if (head) {
      head.innerHTML = `
        <button type="button" class="en-act-btn" id="enMrmBackHub">← ホーム</button>
        <strong style="font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;text-align:center;">${esc(subTitle || lab.title)}</strong>
        <button type="button" class="en-act-btn" id="enMrmCloseAll" title="ラボ一覧へ戻る">✕</button>
      `;
      document.getElementById('enMrmBackHub').onclick = () => { enViewState.roomTab = 'hub'; window.renderEnRoomModal(); };
      document.getElementById('enMrmCloseAll').onclick = () => modal.classList.remove('open');
    }

    const oldNav = modal.querySelector('.en-room-nav');
    if (oldNav) {
      oldNav.outerHTML = buildMobileDock(activeKey);
      bindMobileDock(modal);
    }
  }

  // =========================================================
  // 🔌 既存の openEnRoomModal / renderEnRoomModal を安全にラップ
  // =========================================================
  function installHooks() {
    if (typeof window.openEnRoomModal === 'function' && !window.openEnRoomModal._enMrmWrapped) {
      const origOpen = window.openEnRoomModal;
      const wrappedOpen = function (labId, initialTab, asFan) {
        // スマホ時はルームに入ったら必ず「🏠 ルームホーム」から開く（困惑防止！）
        const targetTab = (isMobileRoomMode() && !asFan) ? 'hub' : initialTab;
        return origOpen.call(this, labId, targetTab, asFan);
      };
      wrappedOpen._enMrmWrapped = true;
      window.openEnRoomModal = wrappedOpen;
    }

    if (typeof window.renderEnRoomModal === 'function' && !window.renderEnRoomModal._enMrmWrapped) {
      const origRender = window.renderEnRoomModal;
      const wrappedRender = function () {
        const modal = document.getElementById('en-room-modal');
        if (!modal || !isMobileRoomMode() || enViewState.roomViewAsFan) {
          if (modal) modal.classList.remove('en-mrm-active');
          // PCモードへ切り替えた際に 'hub' や 'launch' だった場合は安全に標準タブへフォールバック
          if (!isMobileRoomMode() && (enViewState.roomTab === 'hub' || enViewState.roomTab === 'launch')) {
            enViewState.roomTab = enViewState.roomTab === 'launch' ? 'detail' : 'board';
          }
          return origRender.apply(this, arguments);
        }

        const lab = enViewState.labs.find(l => l.id === enViewState.roomOpenId) || enViewState.labs[0];
        if (!lab) return origRender.apply(this, arguments);
        const d = ensureMobileLabData(getRoomProData(lab.id));
        const rt = enViewState.roomTab;

        modal.classList.add('en-mrm-active');

        // 1) 🏠 ルームホーム
        if (rt === 'hub') {
          renderMobileRoomHub(modal, lab, d);
          return;
        }

        // 2) ⚙️ ルーム詳細（細かい設定専用）
        if (rt === 'detail') {
          renderMobileRoomSettings(modal, lab, d);
          return;
        }

        // 3) 🍊 商品完成登録（既存の巣立ちゲート全機能を生かして専用表示）
        if (rt === 'launch') {
          enViewState.roomTab = 'detail';
          origRender.apply(this, arguments);
          enViewState.roomTab = 'launch';
          const body = modal.querySelector('#enRoomBody');
          if (body) {
            // 先頭の巣立ちゲートカードだけ残し、後ろの企画書・設定カードを隠す
            Array.from(body.children).forEach((el, idx) => {
              if (idx > 0) el.style.display = 'none';
            });
          }
          applyMobileChrome(modal, lab, d, 'hub', '🍊 商品完成登録');
          return;
        }

        // 4) ✅ 進行（トップに巣立ちロードマップを挿入し、重複カードを整理）
        if (rt === 'progress') {
          origRender.apply(this, arguments);
          const body = modal.querySelector('#enRoomBody');
          if (body) {
            // 既存の簡易巣立ちカード(先頭)と1行カレンダー(末尾)を整理して、トップにロードマップを配置
            if (body.firstElementChild) body.firstElementChild.style.display = 'none';
            const wrap = document.createElement('div');
            wrap.innerHTML = buildRoadmapHtml(lab, d);
            const rmEl = wrap.firstElementChild;
            body.insertBefore(rmEl, body.firstElementChild);
            bindRoadmapEvents(rmEl, lab, d);
          }
          applyMobileChrome(modal, lab, d, 'progress', '✅ 進行・ロードマップ');
          return;
        }

        // 5) 💬 トーク / 🧰 ボード（既存全機能を100%生かしつつスマホ導線へ統一）
        origRender.apply(this, arguments);
        applyMobileChrome(modal, lab, d, rt, rt === 'talk' ? '💬 トーク' : '🧰 開発ボード');
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