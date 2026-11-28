/* =========================================================
   EN•joy STEP B コア統合モジュール（patch_core_sync.js v1）
   1) 全データ自動永続化（localStorage）＆ 丸ごとJSONファイル移行/復元
   2) 5ステップ登録（Step 4 仕事性格診断 4問＋15項目）➔ 全画面リアルタイム同期
   3) PC / スマホ 進行中ラボ仕様完全統一（5段階ロードマップ・試作オレンジ解放・
      月間カレンダー・作成日時つき企画書履歴・ルーム詳細設定）
   ========================================================= */

(function () {
  const FULL_STATE_KEY = 'en_joy_full_state_v1';

  const SHARED_STAGES = [
    {
      idx: 0, icon: '🌱', label: 'タネ', full: 'STEP 1：タネ・アイデア出し',
      desc: 'まずは「誰のどんな困りごとを解決するか」をメンバーで自由に膨らませよう。',
      boards: [
        { id: 'market',  label: '📊 市場・ポジショニングを考える' },
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

  // Step 4 仕事性格診断の軸 → EN_DIAG_TYPES キー変換
  const AXIS_TO_DIAG = {
    drive: 'action',
    plan: 'plan',
    collab: 'connect',
    craft: 'craft'
  };

  function pad2(n) { return String(n).padStart(2, '0'); }
  function ymd(y, m, d) { return `${y}-${pad2(m + 1)}-${pad2(d)}`; }
  function getTodayStr() {
    const t = new Date();
    return ymd(t.getFullYear(), t.getMonth(), t.getDate());
  }
  function esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function isPcMode() {
    return document.documentElement.classList.contains('en-pc-mode');
  }

  const nowInit = new Date();
  const pcSyncUi = {
    showLeftCal: false,
    calYear: nowInit.getFullYear(),
    calMonth: nowInit.getMonth(),
    calSelected: getTodayStr()
  };

  function ensureSharedLabData(d) {
    if (!d) return d;
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

  // =========================================================
  // 💾 1. 全データ永続化（自動保存 ＆ 復元）
  // =========================================================
  let saveTimer = null;
  let hasHydrated = false;

  const VIEW_PERSIST_KEYS = [
    'userMode', 'profile', 'diagType', 'notifEnabled', 'mapOpen',
    'tweets', 'likedIds', 'savedIds', 'tweetComments',
    'labs', 'flippedLabs', 'hintBox', 'quickAsks', 'notifications',
    'roomMessages', 'roomTasks', 'roomBoards',
    'graduatedIds', 'earlyBirdJoined', 'voteCounts', 'voteChoice',
    'weeklyPlans', 'selectedPlanIdx', 'shoppingChecked', 'marcheItems'
  ];

  function getRegisteredSpeakerName() {
    if (typeof getActiveSenderName === 'function' && typeof state !== 'undefined' && state.profile?.displayName?.trim()) {
      return getActiveSenderName();
    }
    if (typeof enViewState !== 'undefined' && enViewState.profile?.name && enViewState.profile.name !== 'マイ名刺') {
      return enViewState.profile.name;
    }
    return 'あなた';
  }

  function saveFullAppStateNow() {
    if (!hasHydrated || typeof enViewState === 'undefined') return;
    try {
      // 最新発言の sender を登録名へ同期（ハイライトやAI議事録でも本名反映）
      const spName = getRegisteredSpeakerName();
      if (spName !== 'あなた' && Array.isArray(enViewState.roomMessages)) {
        enViewState.roomMessages.forEach(m => {
          if (m && m.me && m.sender === 'あなた') m.sender = spName;
        });
      }

      const viewSnap = {};
      VIEW_PERSIST_KEYS.forEach(k => {
        if (enViewState[k] !== undefined) viewSnap[k] = enViewState[k];
      });

      const tipsSnap = (typeof enTipsProState !== 'undefined') ? {
        weekGoal: enTipsProState.weekGoal,
        weekPlanIds: enTipsProState.weekPlanIds,
        autoShopChecked: enTipsProState.autoShopChecked
      } : null;

      localStorage.setItem(FULL_STATE_KEY, JSON.stringify({
        ver: 1,
        savedAt: new Date().toISOString(),
        view: viewSnap,
        tips: tipsSnap
      }));
    } catch (e) {
      console.warn('EN•joy full save skipped:', e);
    }
  }

  function scheduleFullSave() {
    if (!hasHydrated) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveFullAppStateNow, 220);
  }

  function restoreFullAppState() {
    try {
      const raw = localStorage.getItem(FULL_STATE_KEY);
      if (raw && typeof enViewState !== 'undefined') {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.view) {
          VIEW_PERSIST_KEYS.forEach(k => {
            if (parsed.view[k] !== undefined) {
              if (Array.isArray(parsed.view[k]) && ['tweets', 'labs', 'marcheItems', 'weeklyPlans'].includes(k) && parsed.view[k].length === 0) {
                return;
              }
              enViewState[k] = parsed.view[k];
            }
          });
        }
        if (parsed && parsed.tips && typeof enTipsProState !== 'undefined') {
          if (parsed.tips.weekGoal) enTipsProState.weekGoal = parsed.tips.weekGoal;
          if (Array.isArray(parsed.tips.weekPlanIds) && parsed.tips.weekPlanIds.length === 7) {
            enTipsProState.weekPlanIds = parsed.tips.weekPlanIds;
          }
          if (parsed.tips.autoShopChecked) enTipsProState.autoShopChecked = parsed.tips.autoShopChecked;
        }
      }
    } catch (e) {
      console.warn('EN•joy full restore skipped:', e);
    }
    hasHydrated = true;
  }

  // =========================================================
  // 🪪 2. 5ステップ登録（Step 4 仕事性格診断）➔ 全画面同期
  // =========================================================
  function syncRegistrationToApp(forceUserMode) {
    if (typeof state === 'undefined' || !state.profile || typeof enViewState === 'undefined') return;
    const p = state.profile;

    if (p.displayName && p.displayName.trim()) {
      enViewState.profile.name = p.displayName.trim();
    }
    if (p.area && p.area.trim()) {
      enViewState.profile.area = p.area.trim();
    }
    if (p.photoDataUrl) {
      enViewState.profile.photo = p.photoDataUrl;
    }

    // 役割・兼業・活動・設備をプロファイルへ同期
    const rolesMaster = (typeof ENJOY_DATA !== 'undefined' && Array.isArray(ENJOY_DATA.roles)) ? ENJOY_DATA.roles : [];
    const mainRoleObj = rolesMaster.find(r => r.id === p.mainRole);
    enViewState.profile.mainRole = p.mainRole || '';
    enViewState.profile.mainRoleLabel = p.mainRole === 'other' && p.otherRoleText
      ? p.otherRoleText
      : (mainRoleObj ? mainRoleObj.title : '');
    enViewState.profile.subRoleLabels = [
      ...(p.subRoles || []).map(rid => rolesMaster.find(r => r.id === rid)?.title).filter(Boolean),
      ...(p.customSubRoles || [])
    ];
    enViewState.profile.activities = Array.isArray(p.activities) ? [...p.activities] : [];
    enViewState.profile.capacityTags = Array.isArray(p.capacityTags) ? [...p.capacityTags] : [];
    enViewState.profile.capacity = p.capacity || '';
    enViewState.profile.pride = p.pride || '';
    enViewState.profile.bio = p.profileBio || '';
    enViewState.profile.userStage = p.userStage || '';
    enViewState.profile.registered = !!p.registered;

    if (forceUserMode && p.userStage) {
      enViewState.userMode = (p.userStage === 'fan') ? 'buyer' : 'maker';
    }

    // Step 4 仕事性格診断（簡易4問＋詳細15項目）をリアルタイム反映
    if (typeof v6 !== 'undefined' && typeof v6CalcWorkDiagResult === 'function') {
      const diagRes = v6CalcWorkDiagResult(v6.workDiag);
      if (diagRes && diagRes.type) {
        const mappedKey = AXIS_TO_DIAG[diagRes.type.id] || 'plan';
        enViewState.diagType = mappedKey;
        enViewState.workDiagMeta = {
          axis: diagRes.type.id,
          badge: diagRes.type.badge,
          summary: diagRes.type.summary,
          workStyle: diagRes.type.workStyle,
          bestMatch: diagRes.type.bestMatch,
          quickDone: diagRes.quickDone,
          detailDone: diagRes.detailDone
        };
        if (typeof EN_DIAG_TYPES !== 'undefined' && EN_DIAG_TYPES[mappedKey]) {
          EN_DIAG_TYPES[mappedKey].badge = diagRes.type.badge;
          EN_DIAG_TYPES[mappedKey].desc = diagRes.type.summary;
        }
      } else {
        enViewState.workDiagMeta = null;
      }
    }

    // 登録済ユーザーの場合、進捗バー右上の「⚡ デモへ」を「🏠 ホームへ戻る」へ自然化
    const skipBtn = document.getElementById('enRegSkipBtn');
    if (skipBtn) {
      skipBtn.textContent = p.registered ? '🏠 ホームへ戻る' : '⚡ デモへ';
    }

    scheduleFullSave();
  }

  // ホーム名刺へ登録タグ＆Step 4診断精度を美しく追記
  function decorateHomeCardWithRegInfo() {
    const firstSlide = document.querySelector('#enProfTrack .en-prof-slide:first-child');
    if (!firstSlide || firstSlide.querySelector('.en-prof-reg-tags')) return;

    const p = enViewState.profile || {};
    const pills = [];
    if (p.mainRoleLabel) pills.push({ cls: '', txt: `🏷️ ${p.mainRoleLabel}` });
    (p.subRoleLabels || []).slice(0, 2).forEach(s => pills.push({ cls: '', txt: `＋${s}` }));
    (p.capacityTags || []).slice(0, 1).forEach(c => pills.push({ cls: '', txt: c }));
    if (enViewState.workDiagMeta) {
      const m = enViewState.workDiagMeta;
      pills.push({ cls: 'diag', txt: `🧠 診断 簡易${m.quickDone}/4・詳細${m.detailDone}/15` });
    }
    if (!pills.length) return;

    const statsRow = firstSlide.querySelector('.en-prof-stats');
    const wrap = document.createElement('div');
    wrap.className = 'en-prof-reg-tags';
    wrap.innerHTML = pills.map(pl => `<span class="en-prof-reg-pill ${pl.cls}">${esc(pl.txt)}</span>`).join('');
    if (statsRow) firstSlide.insertBefore(wrap, statsRow);
    else firstSlide.appendChild(wrap);
  }

  // 登録役割＋エリア＋Step 4性格診断を掛け合わせたパーソナライズAI相性コメント
  function buildPersonalizedAiMatch(person, origFn) {
    const base = typeof origFn === 'function' ? origFn(person) : (person.aiMatch || '');
    const p = enViewState.profile || {};
    const diag = enViewState.workDiagMeta;
    const role = p.mainRole;
    const sameArea = p.area && person.area && p.area.includes(person.area.replace(/市|区|町/g, ''));

    let synergy = '';
    if (role === 'material' && person.category === 'factory') synergy = 'あなたの素材×小ロット加工で即試作タッグ！';
    else if (role === 'material' && person.category === 'design') synergy = '産地の想いをパッケージで魅力2倍に！';
    else if (role === 'make' && person.category === 'farm') synergy = '規格外素材を活かす加工コラボに最適！';
    else if (role === 'pack' && (person.category === 'farm' || person.category === 'factory')) synergy = 'デザイン力で新商品の売れ行きを加速！';
    else if (role === 'deliver' && person.category === 'farm') synergy = 'マルシェ・店頭テスト販売の強力なタッグ！';

    const prefix = sameArea ? `📍同エリア相性◎｜` : '';
    if (synergy && diag) return `${prefix}${synergy}（${diag.badge.replace(/^[^\s]+\s*/, '')}）`;
    if (synergy) return `${prefix}${synergy}`;
    return prefix + base;
  }

  // =========================================================
  // 📄 3. PC/スマホ共通：作成日時つき商品企画書履歴シート
  // =========================================================
  function generateVersionedReport(lab, d) {
    ensureSharedLabData(d);
    const now = new Date();
    const createdAt = `${now.getFullYear()}/${pad2(now.getMonth() + 1)}/${pad2(now.getDate())} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    const c = d.cost;
    const unitCost = Number(c.material) + Number(c.process) + Number(c.pack) + Number(c.ship);
    const profit = Number(c.price) - unitCost;
    const costRate = c.price > 0 ? Math.round((unitCost / c.price) * 100) : 0;
    const st = SHARED_STAGES[d.stage] || SHARED_STAGES[1];
    const ver = `v${d.reportHistory.length + 1}`;
    const chNames = (typeof EN_SALES_CHANNELS !== 'undefined')
      ? EN_SALES_CHANNELS.filter(x => d.launch.channels.includes(x.id)).map(x => x.label).join(' / ')
      : '';

    const text = [
      `====================================`,
      `【EN•joy 商品企画書 ${ver}】`,
      `商品名：${lab.title}`,
      `作成日時：${createdAt}（進捗：${st.label}）`,
      `作成者：${getRegisteredSpeakerName()}`,
      `====================================`,
      ``,
      `■ 1. 開発ゴール・ターゲット・独自価値`,
      `・開発ゴール：${d.roomMeta.goal}`,
      `・ターゲット：${d.market.target}`,
      `・選ばれる理由：${d.market.advantage}`,
      `・キャッチ案：${d.promo.copy}`,
      ``,
      `■ 2. 原価・収益シミュレーション`,
      `・予定売価：¥${c.price} ／ 原価合計：¥${unitCost}（原価率 ${costRate}%）`,
      `・直販粗利：¥${profit} ／ 初回${c.lot}個手残り：¥${(profit * c.lot - c.fixedCost).toLocaleString()}`,
      `・試作予算上限：¥${Number(d.roomMeta.budgetCap || 0).toLocaleString()}`,
      ``,
      `■ 3. 試作・ルーム内決定メモ（非公開）`,
      ...d.protos.map(p => `・${p.ver} [${p.score}${p.adopted ? '・採用' : ''}] ${p.cond} (${p.cost})：${p.memo}`),
      ...enViewState.roomBoards[0].items.map(s => `・📌 ${s}`),
      ``,
      `■ 4. なぜなぜ分析（根本対策）`,
      ...(d.whyList || []).map((w, i) => `・課題${i + 1}：${w.problem} → 対策：${w.action}`),
      ``,
      `■ 5. 食品表示・法規確認`,
      ...d.legal.map(l => `・[${l.done ? '済' : '未'}] ${l.label}\n  ${String(l.detail || '').replace(/\n/g, ' / ')}`),
      ``,
      `■ 6. 販売先・商品仕様`,
      `・仕様：${d.launch.detailSpec}（¥${d.launch.detailPrice}）`,
      `・販路：${chNames}${d.launch.externalUrl ? ' / ' + d.launch.externalUrl : ''}`
    ].join('\n');

    d.reportHistory.unshift({ id: 'rep-' + Date.now(), ver, createdAt, stage: st.label, text });
    if (d.reportHistory.length > 15) d.reportHistory.length = 15;
    if (typeof saveRoomProStore === 'function') saveRoomProStore();
    return d.reportHistory[0];
  }

  function openUnifiedReportHistorySheet(labId) {
    const lab = enViewState.labs.find(l => l.id === labId) || enViewState.labs[0];
    if (!lab) return;
    const d = ensureSharedLabData(getRoomProData(lab.id));
    const latest = d.reportHistory[0];

    openEnSheetHtml('📄 商品企画書（作成日時つき履歴）', 'PC・スマホ共通でバージョン履歴を自動保存します', `
      <button type="button" class="en-act-btn primary" style="justify-content:center;" id="enUniRepCreateBtn">
        ✨ 今の日時で新しい企画書（v${d.reportHistory.length + 1}）を作成
      </button>
      ${latest ? `
        <div class="en-meta" style="font-weight:800;">表示中：${latest.ver}（${latest.createdAt} 作成｜${latest.stage}）</div>
        <pre class="en-report-pre" id="enUniRepPre">${esc(latest.text)}</pre>
        <button type="button" class="en-act-btn" style="justify-content:center;" id="enUniRepCopyBtn">📋 表示中の企画書をコピー</button>
      ` : '<div class="en-meta">まだ企画書は作成されていません。上のボタンから作成すると日時つきで保存されます。</div>'}
      ${d.reportHistory.length > 1 ? `
        <div class="en-meta" style="font-weight:800;margin-top:4px;">🕒 過去の履歴（クリックで切替）</div>
        ${d.reportHistory.map((r, i) => `
          <button type="button" class="en-sheet-item" data-unirepidx="${i}">
            <span><strong>${r.ver}</strong>｜${r.createdAt}<br><small class="en-meta">作成時フェーズ：${r.stage}</small></span>
            <span>表示</span>
          </button>
        `).join('')}
      ` : ''}
    `);

    document.getElementById('enUniRepCreateBtn')?.addEventListener('click', () => {
      const created = generateVersionedReport(lab, d);
      enToast(`📄 企画書 ${created.ver}（${created.createdAt}）を保存しました！`);
      openUnifiedReportHistorySheet(lab.id);
      if (typeof window.renderEnRoomModal === 'function') window.renderEnRoomModal();
    });
    document.getElementById('enUniRepCopyBtn')?.addEventListener('click', async () => {
      const txt = document.getElementById('enUniRepPre')?.textContent || '';
      try { await navigator.clipboard.writeText(txt); enToast('📋 企画書をコピーしました！'); }
      catch { enToast('コピー完了！'); }
    });
    document.querySelectorAll('[data-unirepidx]').forEach(btn => {
      btn.onclick = () => {
        const r = d.reportHistory[Number(btn.getAttribute('data-unirepidx'))];
        const pre = document.getElementById('enUniRepPre');
        if (pre && r) { pre.textContent = r.text; enToast(`📄 ${r.ver}（${r.createdAt}）を表示中`); }
      };
    });
  }

  // =========================================================
  // 🖥️ 4. PC版 進行中ラボの統一（5段階ロードマップ・オレンジ解放・月間カレンダー・詳細設定）
  // =========================================================
  function setSharedStage(d, nextIdx) {
    ensureSharedLabData(d);
    const wasLocked = d.stage < 2;
    d.stage = Math.max(0, Math.min(SHARED_STAGES.length - 1, nextIdx));
    if (typeof saveRoomProStore === 'function') saveRoomProStore();
    if (wasLocked && d.stage >= 2) {
      enToast('🍊「試作」フェーズ到達！商品完成登録がオレンジ解放されました！');
    } else {
      enToast(`🗺️ ${SHARED_STAGES[d.stage].full} に切り替えました`);
    }
    window.renderEnRoomModal();
  }

  function buildSharedFocusRoadmapHtml(d) {
    ensureSharedLabData(d);
    const st = SHARED_STAGES[d.stage] || SHARED_STAGES[1];
    const fillPct = (d.stage / (SHARED_STAGES.length - 1)) * 100;
    const prevSt = d.stage > 0 ? SHARED_STAGES[d.stage - 1] : null;
    const nextSt = d.stage < SHARED_STAGES.length - 1 ? SHARED_STAGES[d.stage + 1] : null;

    return `
      <div class="en-focus-rm" data-shared-rm="1">
        <div class="en-rm-rail">
          <div class="en-rm-rail-fill" style="width:calc((100% - 36px) * ${fillPct / 100});"></div>
          ${SHARED_STAGES.map(s => {
            const cls = s.idx < d.stage ? 'done' : s.idx === d.stage ? 'current' : '';
            return `
              <button type="button" class="en-rm-node ${cls}" data-pcstage="${s.idx}" title="${s.full}">
                <span class="en-rm-dot">${s.idx < d.stage ? '✓' : s.icon}</span>
                <span class="en-rm-node-lbl">${s.label}</span>
              </button>
            `;
          }).join('')}
        </div>
        <div class="en-rm-focus-card">
          <div class="en-between">
            <span class="en-pill">いまここ</span>
            <span class="en-meta">${d.stage + 1} / ${SHARED_STAGES.length} ステップ</span>
          </div>
          <div class="en-rm-focus-title">${st.icon} ${esc(st.full)}</div>
          <div class="en-rm-focus-desc">${esc(st.desc)}</div>
          <div class="en-rm-rec-boards">
            ${st.boards.map(b => `
              <button type="button" class="en-rm-rec-btn ${b.orange ? 'orange' : ''}" data-pcrmjump="${b.id}">
                <span>${esc(b.label)}</span><span>開く ➔</span>
              </button>
            `).join('')}
          </div>
          <div class="en-rm-foot-nav">
            <button type="button" class="en-rm-nav-btn" data-pcrmprev="1" ${!prevSt ? 'disabled' : ''}>${prevSt ? `← ${prevSt.label}へ戻す` : '← 最初'}</button>
            <button type="button" class="en-rm-nav-btn next" data-pcrmnext="1" ${!nextSt ? 'disabled' : ''}>${nextSt ? `${nextSt.icon}「${nextSt.label}」へ進む ➔` : '🎉 最終ステップ到達！'}</button>
          </div>
        </div>
      </div>
    `;
  }

  function bindSharedRoadmap(root, d) {
    if (!root) return;
    root.querySelectorAll('[data-pcstage]').forEach(btn => {
      btn.onclick = () => setSharedStage(d, Number(btn.getAttribute('data-pcstage')));
    });
    root.querySelector('[data-pcrmprev]')?.addEventListener('click', () => setSharedStage(d, d.stage - 1));
    root.querySelector('[data-pcrmnext]')?.addEventListener('click', () => setSharedStage(d, d.stage + 1));
    root.querySelectorAll('[data-pcrmjump]').forEach(btn => {
      btn.onclick = () => {
        const tid = btn.getAttribute('data-pcrmjump');
        if (tid === '_launch') {
          enViewState.roomTab = 'detail';
          window.renderEnRoomModal();
          return;
        }
        if (!d.activeTools.includes(tid)) d.activeTools.push(tid);
        d.selectedTool = tid;
        if (typeof saveRoomProStore === 'function') saveRoomProStore();
        enViewState.roomTab = 'board';
        window.renderEnRoomModal();
      };
    });
  }

  // PC左ペイン用：スマホと完全共通の月間カレンダー
  function openPcCalEventSheet(lab, d, dateStr, onUpdated) {
    ensureSharedLabData(d);
    const evs = d.calEvents.filter(e => e.date === dateStr);
    openEnSheetHtml(`📅 ${dateStr} のラボ予定`, 'PC・スマホ共通の月間カレンダーへ自動同期', `
      ${evs.length ? evs.map(e => `
        <div class="en-formula en-list-row-del">
          <span>📌 ${esc(e.title)}</span>
          <button type="button" class="en-del-x" data-pcdelcal="${e.id}">🗑️</button>
        </div>
      `).join('') : '<div class="en-meta">この日の予定はまだありません</div>'}
      <div class="en-form-box">
        <div class="en-meta" style="font-weight:800;">＋ この日に予定を追加</div>
        <input id="enPcCalTitleIn" class="en-input-field" placeholder="例：加工所さんと初回試作打ち合わせ">
        <div class="en-row">
          <select id="enPcCalToneIn" class="en-input-field" style="flex:1;">
            <option value="1">🟠 重要マイルストーン</option>
            <option value="2">🟢 試作・テスト</option>
            <option value="3">🟣 マルシェ・販促</option>
          </select>
          <button type="button" class="en-act-btn primary" id="enPcCalSaveBtn">追加する</button>
        </div>
      </div>
    `);

    document.querySelectorAll('[data-pcdelcal]').forEach(btn => {
      btn.onclick = () => {
        d.calEvents = d.calEvents.filter(x => x.id !== btn.getAttribute('data-pcdelcal'));
        if (typeof saveRoomProStore === 'function') saveRoomProStore();
        openPcCalEventSheet(lab, d, dateStr, onUpdated);
        if (onUpdated) onUpdated();
      };
    });
    document.getElementById('enPcCalSaveBtn')?.addEventListener('click', () => {
      const title = document.getElementById('enPcCalTitleIn')?.value.trim();
      const tone = Number(document.getElementById('enPcCalToneIn')?.value || 1);
      if (!title) return enToast('⚠️ 予定タイトルを入力してください');
      d.calEvents.push({ id: 'ev-' + Date.now(), date: dateStr, title, tone });
      if (typeof saveRoomProStore === 'function') saveRoomProStore();
      closeEnSheet();
      enToast(`📅 ${dateStr} に予定を追加しました！`);
      if (onUpdated) onUpdated();
    });
  }

  function renderPcLeftCalendar(container, lab, d) {
    ensureSharedLabData(d);
    const y = pcSyncUi.calYear, m = pcSyncUi.calMonth;
    const firstDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevMonthDays = new Date(y, m, 0).getDate();
    const todayStr = getTodayStr();

    const evMap = {};
    d.calEvents.forEach(ev => {
      if (!evMap[ev.date]) evMap[ev.date] = [];
      evMap[ev.date].push(ev);
    });

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

    const selEvents = evMap[pcSyncUi.calSelected] || [];
    const monthPrefix = `${y}-${pad2(m + 1)}-`;
    const monthEvents = d.calEvents
      .filter(e => e.date.startsWith(monthPrefix))
      .sort((a, b) => a.date.localeCompare(b.date));

    container.innerHTML = `
      <div class="en-pc-pane-scroll">
        <div class="en-pc-cal-card">
          <div class="en-gcal-head">
            <span class="en-gcal-month">📅 ${y}年${m + 1}月</span>
            <div class="en-gcal-nav">
              <button type="button" class="en-gcal-btn" id="enPcCalPrevM">◀</button>
              <button type="button" class="en-gcal-btn" id="enPcCalToday">今日</button>
              <button type="button" class="en-gcal-btn" id="enPcCalNextM">▶</button>
              <button type="button" class="en-gcal-btn primary" id="enPcCalAdd">＋予定</button>
            </div>
          </div>
          <div class="en-gcal-dow"><span>日</span><span>月</span><span>火</span><span>水</span><span>木</span><span>金</span><span>土</span></div>
          <div class="en-gcal-grid">
            ${cells.map(c => {
              const evs = evMap[c.date] || [];
              const cls = [
                'en-gcal-cell', c.other ? 'other' : '', c.dow === 0 ? 'is-sun' : '', c.dow === 6 ? 'is-sat' : '',
                c.date === todayStr ? 'is-today' : '', c.date === pcSyncUi.calSelected ? 'selected' : ''
              ].filter(Boolean).join(' ');
              const firstEv = evs[0];
              return `
                <button type="button" class="${cls}" data-pccaldate="${c.date}">
                  <span class="en-gcal-num">${c.day}</span>
                  ${firstEv ? `<span class="en-gcal-chip tone-${firstEv.tone || 1}">${esc(firstEv.title)}</span>` : ''}
                </button>
              `;
            }).join('')}
          </div>
          <div class="en-gcal-daybar">
            <button type="button" class="en-gcal-dayinfo" id="enPcCalSelBtn">
              <strong>${pcSyncUi.calSelected}</strong>：${selEvents.length ? selEvents.map(e => esc(e.title)).join(' / ') : '予定なし（クリックで追加）'}
            </button>
          </div>
        </div>

        <div class="card en-card" style="padding:12px;">
          <div class="en-between">
            <div class="en-title" style="font-size:13px;">📌 ${m + 1}月の予定一覧（${monthEvents.length}件）</div>
          </div>
          <div class="en-pc-cal-list">
            ${monthEvents.length ? monthEvents.map(ev => `
              <div class="en-pc-cal-ev-row">
                <span class="en-row" style="gap:7px;min-width:0;">
                  <span class="en-pc-cal-dot tone-${ev.tone || 1}"></span>
                  <strong>${ev.date.slice(5)}</strong>
                  <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(ev.title)}</span>
                </span>
                <button type="button" class="en-del-x" data-pccaldelrow="${ev.id}">🗑️</button>
              </div>
            `).join('') : '<div class="en-meta">この月の予定はまだありません</div>'}
          </div>
        </div>
      </div>
    `;

    const rerender = () => renderPcLeftCalendar(container, lab, d);
    document.getElementById('enPcCalPrevM')?.addEventListener('click', () => {
      const dt = new Date(y, m - 1, 1); pcSyncUi.calYear = dt.getFullYear(); pcSyncUi.calMonth = dt.getMonth(); rerender();
    });
    document.getElementById('enPcCalNextM')?.addEventListener('click', () => {
      const dt = new Date(y, m + 1, 1); pcSyncUi.calYear = dt.getFullYear(); pcSyncUi.calMonth = dt.getMonth(); rerender();
    });
    document.getElementById('enPcCalToday')?.addEventListener('click', () => {
      const t = new Date(); pcSyncUi.calYear = t.getFullYear(); pcSyncUi.calMonth = t.getMonth(); pcSyncUi.calSelected = getTodayStr(); rerender();
    });
    document.getElementById('enPcCalAdd')?.addEventListener('click', () => openPcCalEventSheet(lab, d, pcSyncUi.calSelected, rerender));
    document.getElementById('enPcCalSelBtn')?.addEventListener('click', () => openPcCalEventSheet(lab, d, pcSyncUi.calSelected, rerender));
    container.querySelectorAll('[data-pccaldate]').forEach(btn => {
      btn.onclick = () => {
        const dt = btn.getAttribute('data-pccaldate');
        if (pcSyncUi.calSelected === dt) openPcCalEventSheet(lab, d, dt, rerender);
        else { pcSyncUi.calSelected = dt; rerender(); }
      };
    });
    container.querySelectorAll('[data-pccaldelrow]').forEach(btn => {
      btn.onclick = () => {
        d.calEvents = d.calEvents.filter(x => x.id !== btn.getAttribute('data-pccaldelrow'));
        if (typeof saveRoomProStore === 'function') saveRoomProStore();
        rerender();
      };
    });
    if (typeof enSyncTheme === 'function') enSyncTheme();
  }

  function enhancePcUnifiedFeatures() {
    const modal = document.getElementById('en-room-modal');
    if (!modal || !modal.classList.contains('open') || !isPcMode() || enViewState.roomViewAsFan) return;
    const lab = enViewState.labs.find(l => l.id === enViewState.roomOpenId) || enViewState.labs[0];
    if (!lab) return;
    const d = ensureSharedLabData(getRoomProData(lab.id));
    const isUnlocked = d.stage >= 2;
    const st = SHARED_STAGES[d.stage] || SHARED_STAGES[1];

    // A. PC上部ヘッダーの「巣立ち」タブをスマホと同じ「試作でオレンジ解放」仕様に統一
    const launchSeg = modal.querySelector('.en-ergo-head-mid [data-ergotab="detail"]');
    if (launchSeg) {
      launchSeg.classList.toggle('is-orange-unlocked', isUnlocked);
      launchSeg.classList.toggle('is-locked-launch', !isUnlocked);
      launchSeg.textContent = isUnlocked ? '🍊 商品完成登録・詳細' : '🔒 完成登録・詳細';
    }

    // B. PC左ペインに「📅 予定」月間カレンダータブを追加
    const leftTabs = modal.querySelector('.en-pc-left-tabs');
    const leftContent = modal.querySelector('#enPcLeftContent');
    if (leftTabs && leftContent && !leftTabs.querySelector('[data-pccal="1"]')) {
      const calBtn = document.createElement('button');
      calBtn.type = 'button';
      calBtn.className = `en-pc-left-tab ${pcSyncUi.showLeftCal ? 'active' : ''}`;
      calBtn.setAttribute('data-pccal', '1');
      calBtn.textContent = '📅 予定';
      leftTabs.appendChild(calBtn);

      // 元の3タブを押したらカレンダー表示OFFに戻す
      leftTabs.querySelectorAll('[data-pcleft]').forEach(btn => {
        btn.addEventListener('click', () => { pcSyncUi.showLeftCal = false; }, true);
      });

      calBtn.onclick = () => {
        pcSyncUi.showLeftCal = true;
        leftTabs.querySelectorAll('.en-pc-left-tab').forEach(b => b.classList.toggle('active', b === calBtn));
        renderPcLeftCalendar(leftContent, lab, d);
      };

      if (pcSyncUi.showLeftCal) {
        leftTabs.querySelectorAll('.en-pc-left-tab').forEach(b => b.classList.toggle('active', b === calBtn));
        renderPcLeftCalendar(leftContent, lab, d);
      } else {
        // 左ペインが「✅ 進行」のときはトップにコンパクトロードマップを注入
        const activeLeft = leftTabs.querySelector('.en-pc-left-tab.active');
        if (activeLeft && activeLeft.getAttribute('data-pcleft') === 'progress') {
          const sc = leftContent.querySelector('.en-pc-pane-scroll');
          if (sc && !sc.querySelector('[data-shared-rm="1"]')) {
            const tmp = document.createElement('div');
            tmp.innerHTML = buildSharedFocusRoadmapHtml(d);
            const rmEl = tmp.firstElementChild;
            sc.insertBefore(rmEl, sc.firstElementChild);
            bindSharedRoadmap(rmEl, d);
          }
        }
      }
    }

    // C. PC右ペイン「✅ 進行」タブのトップに5段階フォーカスロードマップを統一表示
    const body = modal.querySelector('#enRoomBody');
    if (body && enViewState.roomTab === 'progress' && !body.querySelector('[data-shared-rm="1"]')) {
      if (body.firstElementChild) body.firstElementChild.style.display = 'none';
      if (body.lastElementChild && body.children.length > 3) body.lastElementChild.style.display = 'none';
      const tmp = document.createElement('div');
      tmp.innerHTML = buildSharedFocusRoadmapHtml(d);
      const rmEl = tmp.firstElementChild;
      body.insertBefore(rmEl, body.firstElementChild);
      bindSharedRoadmap(rmEl, d);
    }

    // D. PC右ペイン「🎉 巣立ち・詳細」タブに試作オレンジ解放ゲート＋roomMeta詳細設定＋企画書履歴を統一
    if (body && enViewState.roomTab === 'detail' && !body.querySelector('#enPcUnifiedSettings')) {
      const gateCard = body.firstElementChild;
      if (gateCard && !isUnlocked) {
        gateCard.style.display = 'none';
        const lockBox = document.createElement('div');
        lockBox.className = 'en-pc-launch-lock';
        lockBox.innerHTML = `
          <div class="en-between">
            <strong>🔒 商品完成登録（巣立ちゲート）は「🧪 試作」でオレンジ解放</strong>
            <span class="en-pill">現在：${st.icon} ${st.label}</span>
          </div>
          <div class="en-meta">スマホ版と同じ進捗フェーズで連動しています。試作フェーズへ進めると完成写真・販売先登録が解放されます。</div>
          <div class="en-row">
            <button type="button" class="en-act-btn primary" id="enPcUnlockNowBtn">🧪「試作」へ進めて今すぐオレンジ解放する</button>
            <button type="button" class="en-act-btn" id="enPcGoRoadmapBtn">🗺️ 進行ロードマップを開く</button>
          </div>
        `;
        body.insertBefore(lockBox, gateCard);
        document.getElementById('enPcUnlockNowBtn')?.addEventListener('click', () => setSharedStage(d, 2));
        document.getElementById('enPcGoRoadmapBtn')?.addEventListener('click', () => { enViewState.roomTab = 'progress'; window.renderEnRoomModal(); });
      }

      // ルーム詳細設定（スマホ版と100%共通項目）＋最新企画書履歴情報
      const latestRep = d.reportHistory[0];
      const metaCard = document.createElement('div');
      metaCard.id = 'enPcUnifiedSettings';
      metaCard.className = 'card en-card';
      metaCard.innerHTML = `
        <div class="en-between">
          <div class="en-title">🏷️ ルーム基本情報・詳細設定（PC/スマホ共通）</div>
          <span class="en-pill">${latestRep ? `企画書 ${latestRep.ver}（${latestRep.createdAt}）` : '企画書 未作成'}</span>
        </div>
        <div class="en-form-grid-2">
          <div>
            <div class="en-meta" style="font-weight:800;margin-bottom:3px;">プロジェクト名</div>
            <input id="enPcSetTitle" class="en-input-field" value="${esc(lab.title)}">
          </div>
          <div>
            <div class="en-meta" style="font-weight:800;margin-bottom:3px;">現在の進捗フェーズ</div>
            <select id="enPcSetStage" class="en-input-field">
              ${SHARED_STAGES.map(s => `<option value="${s.idx}" ${d.stage === s.idx ? 'selected' : ''}>${s.icon} ${s.full}</option>`).join('')}
            </select>
          </div>
        </div>
        <div>
          <div class="en-meta" style="font-weight:800;margin-bottom:3px;">開発ゴール・目指す姿</div>
          <textarea id="enPcSetGoal" class="en-input-field" rows="2">${esc(d.roomMeta.goal)}</textarea>
        </div>
        <div class="en-form-grid-2">
          <div>
            <div class="en-meta" style="font-weight:800;margin-bottom:3px;">試作予算上限（円）</div>
            <input id="enPcSetBudget" class="en-input-field" type="number" value="${esc(d.roomMeta.budgetCap)}">
          </div>
          <div>
            <div class="en-meta" style="font-weight:800;margin-bottom:3px;">新規メンバー参加ルール</div>
            <select id="enPcSetPolicy" class="en-input-field">
              <option value="approval" ${d.roomMeta.joinPolicy === 'approval' ? 'selected' : ''}>承認制（おすすめ）</option>
              <option value="open" ${d.roomMeta.joinPolicy === 'open' ? 'selected' : ''}>だれでも参加OK</option>
              <option value="invite" ${d.roomMeta.joinPolicy === 'invite' ? 'selected' : ''}>招待のみ（非公開）</option>
            </select>
          </div>
        </div>
      `;
      body.appendChild(metaCard);

      document.getElementById('enPcSetTitle')?.addEventListener('change', e => {
        const v = e.target.value.trim();
        if (v) { lab.title = v; scheduleFullSave(); if (typeof renderEnLab === 'function') renderEnLab(); enToast('🏷️ プロジェクト名を更新しました'); window.renderEnRoomModal(); }
      });
      document.getElementById('enPcSetStage')?.addEventListener('change', e => setSharedStage(d, Number(e.target.value)));
      document.getElementById('enPcSetGoal')?.addEventListener('change', e => { d.roomMeta.goal = e.target.value; if (typeof saveRoomProStore === 'function') saveRoomProStore(); });
      document.getElementById('enPcSetBudget')?.addEventListener('change', e => { d.roomMeta.budgetCap = e.target.value; if (typeof saveRoomProStore === 'function') saveRoomProStore(); });
      document.getElementById('enPcSetPolicy')?.addEventListener('change', e => { d.roomMeta.joinPolicy = e.target.value; if (typeof saveRoomProStore === 'function') saveRoomProStore(); enToast('👥 参加ルールを更新しました'); });
    }
  }

  // =========================================================
  // 📦 5. 丸ごとデータ移行（JSONファイル書き出し＆読込＋コード対応）
  // =========================================================
  function buildFullMigrationPayload() {
    saveFullAppStateNow();
    return {
      app: 'EN•joy',
      version: 2,
      exportedAt: new Date().toISOString(),
      fullState: JSON.parse(localStorage.getItem(FULL_STATE_KEY) || 'null'),
      roomPro: JSON.parse(localStorage.getItem('en_joy_room_pro_v2') || 'null'),
      regProfile: (typeof state !== 'undefined' && state.profile) ? state.profile : null,
      workDiag: (typeof v6 !== 'undefined' && v6.workDiag) ? v6.workDiag : null,
      enMeta: (typeof v6 !== 'undefined' && v6.enMeta) ? v6.enMeta : null,
      theme: localStorage.getItem('en_theme_v1')
    };
  }

  function applyMigrationPayload(parsed) {
    if (!parsed || typeof parsed !== 'object') throw new Error('invalid');

    // 新形式（v2丸ごと）と旧形式（v1簡易）の両方に対応
    if (parsed.fullState) {
      localStorage.setItem(FULL_STATE_KEY, JSON.stringify(parsed.fullState));
      restoreFullAppState();
    } else if (parsed.profile) {
      enViewState.profile = parsed.profile;
      if (parsed.diagType) enViewState.diagType = parsed.diagType;
      if (parsed.hintBox) enViewState.hintBox = parsed.hintBox;
    }

    if (parsed.roomPro && typeof enRoomProStore !== 'undefined') {
      localStorage.setItem('en_joy_room_pro_v2', JSON.stringify(parsed.roomPro));
      if (typeof loadRoomProStore === 'function') loadRoomProStore();
    }
    if (parsed.regProfile && typeof state !== 'undefined') {
      state.profile = Object.assign({}, state.profile, parsed.regProfile);
      if (typeof saveProfile === 'function') saveProfile();
    }
    if (parsed.workDiag && typeof v6 !== 'undefined') {
      v6.workDiag = parsed.workDiag;
      if (parsed.enMeta) v6.enMeta = parsed.enMeta;
      if (typeof v6SaveAll === 'function') v6SaveAll();
    }
    if (parsed.theme) {
      localStorage.setItem('en_theme_v1', parsed.theme);
    }

    syncRegistrationToApp(false);
    saveFullAppStateNow();
    if (typeof renderEnHome === 'function') renderEnHome();
    if (typeof renderEnFeed === 'function') renderEnFeed();
    if (typeof renderEnLab === 'function') renderEnLab();
    if (typeof renderEnTips === 'function') renderEnTips();
    if (typeof renderEnShop === 'function') renderEnShop();
  }

  function openUpgradedDataMigrationSheet() {
    openEnSheetHtml('📦 全データ移行（バックアップ＆復元）', '名刺・性格診断・つぶやき・全ラボ・カレンダー・企画書を丸ごと移行', `
      <div class="en-meta" style="font-weight:800;">① 今の全データを保存する</div>
      <div class="en-mig-row">
        <button type="button" class="en-act-btn primary" style="justify-content:center;" id="enMigDownloadBtn">💾 JSONファイル保存</button>
        <button type="button" class="en-act-btn" style="justify-content:center;" id="enMigCopyBtn">📋 テキストコピー</button>
      </div>

      <div class="en-meta" style="font-weight:800;margin-top:6px;">② バックアップから復元する</div>
      <label class="en-act-btn" style="justify-content:center;cursor:pointer;" for="enMigFileIn">📁 JSONファイルを選んで復元</label>
      <input id="enMigFileIn" type="file" accept=".json,application/json" style="display:none;">
      <textarea id="enMigRestoreTxt" class="en-input-field" rows="3" placeholder="またはコピーしたバックアップコードをここに貼り付け..."></textarea>
      <button type="button" class="en-act-btn primary" style="justify-content:center;" id="enMigRestoreBtn">📥 コードからデータを復元</button>
    `);

    document.getElementById('enMigDownloadBtn')?.addEventListener('click', () => {
      const jsonStr = JSON.stringify(buildFullMigrationPayload(), null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `ENjoy_backup_${getTodayStr()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
      enToast('💾 全データのJSONバックアップを保存しました！');
    });

    document.getElementById('enMigCopyBtn')?.addEventListener('click', async () => {
      const jsonStr = JSON.stringify(buildFullMigrationPayload());
      try {
        await navigator.clipboard.writeText(jsonStr);
        enToast('📋 全データの移行コードをコピーしました！');
      } catch {
        const ta = document.getElementById('enMigRestoreTxt');
        if (ta) ta.value = jsonStr;
        enToast('入力欄へ出力しました（そのままコピーできます）');
      }
    });

    document.getElementById('enMigFileIn')?.addEventListener('change', e => {
      const f = e.target.files?.[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          applyMigrationPayload(JSON.parse(ev.target.result));
          closeEnSheet();
          enToast('🎉 JSONファイルから全データを復元しました！');
        } catch {
          enToast('⚠️ ファイルの形式が正しくありません');
        }
      };
      reader.readAsText(f);
    });

    document.getElementById('enMigRestoreBtn')?.addEventListener('click', () => {
      try {
        const txt = document.getElementById('enMigRestoreTxt')?.value.trim();
        applyMigrationPayload(JSON.parse(txt));
        closeEnSheet();
        enToast('🎉 コードから全データを復元しました！');
      } catch {
        enToast('⚠️ 正しいバックアップコードを入力してください');
      }
    });
  }

  // =========================================================
  // 🔌 フック一括装着
  // =========================================================
  function installCoreHooks() {
    // 1. 企画書出力をPC/スマホ共通の日時つき履歴シートへ統一
    window.openProjectReportSheet = openUnifiedReportHistorySheet;

    // 2. データ移行シートを丸ごと保存/復元版へ差し替え
    window.openDataMigrationSheet = openUpgradedDataMigrationSheet;

    // 3. 性格診断の入口を Step 4（簡易4問＋詳細15項目）へ一本化
    window.openPersonalityQuiz = function () {
      closeEnSheet();
      if (typeof goStep === 'function' && typeof switchView === 'function') {
        goStep(4);
        switchView('register');
        enToast('🧠 仕事性格診断（簡易4問＋詳細15項目）を開きました');
      }
    };

    // 4. 設定ハブのラベル表記を最新化
    if (typeof window.openSettingsHub === 'function' && !window.openSettingsHub._enCoreWrapped) {
      const origHub = window.openSettingsHub;
      const wrappedHub = function () {
        const res = origHub.apply(this, arguments);
        const content = document.getElementById('en-sheet-content');
        if (content) {
          content.querySelectorAll('.en-settings-row').forEach(row => {
            if (row.innerHTML.includes('簡易3問')) {
              row.innerHTML = row.innerHTML.replace('簡易3問', '簡易4問＋詳細15項目');
            }
          });
        }
        return res;
      };
      wrappedHub._enCoreWrapped = true;
      window.openSettingsHub = wrappedHub;
      const hdrSet = document.getElementById('enHdrSetBtn');
      if (hdrSet) hdrSet.onclick = wrappedHub;
    }

    // 5. 登録フォーム保存 ＆ Step 4診断回答を即アプリ全体へ同期
    if (typeof window.saveProfile === 'function' && !window.saveProfile._enCoreWrapped) {
      const origSP = window.saveProfile;
      const wrappedSP = function () {
        const res = origSP.apply(this, arguments);
        syncRegistrationToApp(false);
        return res;
      };
      wrappedSP._enCoreWrapped = true;
      window.saveProfile = wrappedSP;
    }
    if (typeof window.v6SaveAll === 'function' && !window.v6SaveAll._enCoreWrapped) {
      const origV6 = window.v6SaveAll;
      const wrappedV6 = function () {
        const res = origV6.apply(this, arguments);
        syncRegistrationToApp(false);
        return res;
      };
      wrappedV6._enCoreWrapped = true;
      window.v6SaveAll = wrappedV6;
    }
    if (typeof window.finishRegistrationAndReveal === 'function' && !window.finishRegistrationAndReveal._enCoreWrapped) {
      const origFin = window.finishRegistrationAndReveal;
      const wrappedFin = function () {
        const res = origFin.apply(this, arguments);
        syncRegistrationToApp(true);
        if (typeof renderEnHome === 'function') renderEnHome();
        if (typeof renderEnFeed === 'function') renderEnFeed();
        saveFullAppStateNow();
        return res;
      };
      wrappedFin._enCoreWrapped = true;
      window.finishRegistrationAndReveal = wrappedFin;
    }

    // 6. ホーム名刺の登録タグ追記 ＆ 人材AI相性のパーソナライズ化
    if (typeof window.renderEnHome === 'function' && !window.renderEnHome._enCoreWrapped) {
      const origHome = window.renderEnHome;
      const wrappedHome = function () {
        const res = origHome.apply(this, arguments);
        decorateHomeCardWithRegInfo();
        scheduleFullSave();
        return res;
      };
      wrappedHome._enCoreWrapped = true;
      window.renderEnHome = wrappedHome;
    }

    if (typeof window.getDynamicAiMatch === 'function' && !window.getDynamicAiMatch._enCoreWrapped) {
      const origMatch = window.getDynamicAiMatch;
      const wrappedMatch = function (person) {
        return buildPersonalizedAiMatch(person, origMatch);
      };
      wrappedMatch._enCoreWrapped = true;
      window.getDynamicAiMatch = wrappedMatch;
    }

    // 7. PC/スマホ 進行中ラボの統一フック
    if (typeof window.renderEnRoomModal === 'function' && !window.renderEnRoomModal._enCoreWrapped) {
      const origRM = window.renderEnRoomModal;
      const wrappedRM = function () {
        const res = origRM.apply(this, arguments);
        enhancePcUnifiedFeatures();
        scheduleFullSave();
        return res;
      };
      wrappedRM._enCoreWrapped = true;
      window.renderEnRoomModal = wrappedRM;
    }

    // 8. 主要ミューテーション・描画関数に自動保存フック
    [
      'saveEnStateLocal', 'saveRoomProStore', 'renderEnFeed', 'renderEnLab',
      'renderEnTips', 'renderEnShop', 'submitNewTweet', 'submitNewSoloLab',
      'promoteSoloToActive', 'completeProGraduation', 'graduateLabToMarche',
      'toggleRoomTask', 'sendMsgToBoard', 'sendMsgToTask', 'toggleLabFanPublic',
      'setDayRecipe', 'promoteAskToLab', 'addToHintBox', 'createSoloLabFromSeed'
    ].forEach(fnName => {
      if (typeof window[fnName] === 'function' && !window[fnName]._enAutoSaveWrapped) {
        const orig = window[fnName];
        const wrapped = function () {
          const res = orig.apply(this, arguments);
          scheduleFullSave();
          return res;
        };
        wrapped._enAutoSaveWrapped = true;
        window[fnName] = wrapped;
      }
    });

    // 9. リセット時に永続化キーも確実にクリア
    ['resetToStartBtn', 'devResetBtn'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.dataset.enCoreResetBound) {
        el.dataset.enCoreResetBound = '1';
        el.addEventListener('click', () => {
          localStorage.removeItem(FULL_STATE_KEY);
          localStorage.removeItem('en_joy_v5_state');
          localStorage.removeItem('en_joy_room_pro_v2');
        }, true);
      }
    });
  }

  // アプリ終了・バックグラウンド移行時の即時保存（iOS PWA対策）
  window.addEventListener('pagehide', saveFullAppStateNow);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveFullAppStateNow();
  });

  window.addEventListener('DOMContentLoaded', () => {
    installCoreHooks();
    // patch_views.js (150ms) の初期ロード直後に永続データを復元＆登録同期して一括再描画
    setTimeout(() => {
      installCoreHooks();
      restoreFullAppState();
      syncRegistrationToApp(false);
      if (typeof renderEnHome === 'function') renderEnHome();
      if (typeof renderEnFeed === 'function') renderEnFeed();
      if (typeof renderEnLab === 'function') renderEnLab();
      if (typeof renderEnTips === 'function') renderEnTips();
      if (typeof renderEnShop === 'function') renderEnShop();
      saveFullAppStateNow();
    }, 185);
  });
})();