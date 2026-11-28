/* =========================================================
   EN•joy STEP B-3 実務連動 ＆ AI安全エンジン（patch_b3_ops.js v1）
   1) やること（期日・担当者）⇄ 月間カレンダー自動双方向同期
   2) ボード間「自動バトンリレー」（原価→完成登録 / 本採用試作→食品表示 / 販促→完成登録）
   3) AI安全ラッパー層 EN_AI_GUARD（個人情報自動マスク / AI下書き人間承認ロック /
      食品表示チェック必須ガード / 1日上限＆クールダウン / 障害時手動フォールバック）
   ========================================================= */

(function () {
  const AI_QUOTA_KEY = 'en_joy_ai_quota_v1';
  const DAILY_AI_LIMIT = 20;
  const COOLDOWN_MS = 3000;
  const DEFAULT_ASSIGNEES = ['あなた', '山田農園', 'カワチ加工所', 'アトリエ木漏れ日', '全員'];

  let b3HooksInstalled = false;
  let lastAiCallAt = 0;

  function pad2(n) { return String(n).padStart(2, '0'); }
  function todayYmd() {
    const t = new Date();
    return `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}`;
  }
  function esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function savePro() {
    if (typeof saveRoomProStore === 'function') saveRoomProStore();
  }

  // =========================================================
  // 🛡️ 1. AI安全ラッパー層（EN_AI_GUARD）
  // =========================================================
  function maskSensitiveInfo(text) {
    let s = String(text ?? '');
    let maskedCount = 0;
    const rep = (re, tag) => {
      s = s.replace(re, () => { maskedCount++; return tag; });
    };
    // メールアドレス
    rep(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[メール非公開]');
    // 電話番号（ハイフンあり・なし）
    rep(/(?:0\d{1,4}-\d{1,4}-\d{3,4}|0[789]0\d{8}|0\d{9})/g, '[電話番号非公開]');
    // 郵便番号
    rep(/〒?\s?\d{3}-\d{4}/g, '[郵便番号非公開]');
    // 番地（例：1丁目2番3号 / 12-34-5）
    rep(/\d+丁目\d+番(?:\d+号)?/g, '[番地非公開]');
    rep(/(?<![0-9/])\d{1,4}-\d{1,4}-\d{1,4}(?![0-9/])/g, '[番地非公開]');
    return { maskedText: s, maskedCount };
  }

  function loadAiQuota() {
    const today = todayYmd();
    try {
      const q = JSON.parse(localStorage.getItem(AI_QUOTA_KEY) || 'null');
      if (q && q.date === today) return q;
    } catch (e) {}
    return { date: today, used: 0 };
  }

  function consumeAiQuota() {
    const now = Date.now();
    if (now - lastAiCallAt < COOLDOWN_MS) {
      return { ok: false, reason: 'cooldown', msg: '⏳ 連続実行ガード中（3秒あけてお試しください）' };
    }
    const q = loadAiQuota();
    if (q.used >= DAILY_AI_LIMIT) {
      return { ok: false, reason: 'limit', msg: `🛡️ 本日のAI上限（${DAILY_AI_LIMIT}回）に達しました（手動入力はそのまま利用できます）` };
    }
    q.used += 1;
    lastAiCallAt = now;
    try { localStorage.setItem(AI_QUOTA_KEY, JSON.stringify(q)); } catch (e) {}
    return { ok: true, used: q.used, remain: DAILY_AI_LIMIT - q.used };
  }

  function getAiQuotaStatus() {
    const q = loadAiQuota();
    return { used: q.used, limit: DAILY_AI_LIMIT, remain: Math.max(0, DAILY_AI_LIMIT - q.used) };
  }

  function countUnapprovedAiLegal(d) {
    if (!d || !Array.isArray(d.legal)) return 0;
    return d.legal.filter(item => item && item.aiDraft && !item.humanApproved).length;
  }

  window.EN_AI_GUARD = {
    maskSensitiveInfo,
    getAiQuotaStatus,
    countUnapprovedAiLegal,
    DAILY_AI_LIMIT
  };

  // =========================================================
  // 📅 2. やること（期日・担当者）⇄ 月間カレンダー自動双方向同期
  // =========================================================
  function syncTasksToCalendar(labId) {
    if (!labId || typeof getRoomProData !== 'function') return;
    const d = getRoomProData(labId);
    if (!d) return;
    if (!Array.isArray(d.calEvents)) d.calEvents = [];
    const tasks = Array.isArray(d.roomTasks) ? d.roomTasks : (enViewState.roomTasks || []);

    const taskMap = new Map();
    tasks.forEach(t => {
      if (t && t.id && t.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate)) {
        taskMap.set(t.id, t);
      }
    });

    // 削除または期日クリアされたタスク由来イベントをカレンダーから掃除
    d.calEvents = d.calEvents.filter(ev => !ev.sourceTaskId || taskMap.has(ev.sourceTaskId));

    // 期日つきタスクをカレンダーへアップサート（最新状態で完全一致）
    taskMap.forEach((t, tid) => {
      const label = `${t.done ? '✓' : '✅'} ${t.text}${t.assignee ? `(${t.assignee})` : ''}`;
      const existing = d.calEvents.find(ev => ev.sourceTaskId === tid);
      if (existing) {
        existing.date = t.dueDate;
        existing.title = label;
        existing.tone = t.done ? 2 : 1;
      } else {
        d.calEvents.push({
          id: 'ev-task-' + tid,
          sourceTaskId: tid,
          date: t.dueDate,
          title: label,
          tone: t.done ? 2 : 1
        });
      }
    });

    savePro();
  }

  function openTaskMetaEditSheet(labId, taskIdx) {
    const tasks = enViewState.roomTasks || [];
    const t = tasks[taskIdx];
    if (!t) return;
    const assigneeOpts = Array.from(new Set([...DEFAULT_ASSIGNEES, t.assignee].filter(Boolean)));

    openEnSheetHtml('📅 タスクの期日・担当を設定', '期日を入れると月間カレンダーへ自動同期されます', `
      <div>
        <div class="en-meta" style="font-weight:800;margin-bottom:3px;">やること内容</div>
        <input id="enTmTextIn" class="en-input-field" value="${esc(t.text)}">
      </div>
      <div class="en-form-grid-2">
        <div>
          <div class="en-meta" style="font-weight:800;margin-bottom:3px;">📅 期日（カレンダー連動）</div>
          <input id="enTmDateIn" class="en-input-field" type="date" value="${esc(t.dueDate || '')}">
        </div>
        <div>
          <div class="en-meta" style="font-weight:800;margin-bottom:3px;">👤 担当者</div>
          <select id="enTmWhoSel" class="en-input-field">
            <option value="">未割当</option>
            ${assigneeOpts.map(name => `<option value="${esc(name)}" ${t.assignee === name ? 'selected' : ''}>${esc(name)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="en-row" style="gap:8px;margin-top:4px;">
        <button type="button" class="en-act-btn" id="enTmClearDateBtn">期日を外す</button>
        <button type="button" class="en-act-btn primary" style="flex:1;justify-content:center;" id="enTmSaveBtn">保存してカレンダー同期</button>
      </div>
    `);

    document.getElementById('enTmClearDateBtn')?.addEventListener('click', () => {
      const dEl = document.getElementById('enTmDateIn');
      if (dEl) dEl.value = '';
    });
    document.getElementById('enTmSaveBtn')?.addEventListener('click', () => {
      const txt = (document.getElementById('enTmTextIn')?.value || '').trim();
      if (!txt) return enToast('⚠️ やること内容を入力してください');
      t.text = window.EN_SECURITY ? window.EN_SECURITY.sanitizePlainText(txt, 140) : txt;
      t.dueDate = document.getElementById('enTmDateIn')?.value || '';
      t.assignee = document.getElementById('enTmWhoSel')?.value || '';
      syncTasksToCalendar(labId);
      closeEnSheet();
      enToast(t.dueDate ? `📅 期日(${t.dueDate})をカレンダーへ自動同期しました！` : '✅ タスクを更新しました');
      window.renderEnRoomModal();
    });
  }

  function enhanceTaskListInContainer(container, labId, isLeftPane) {
    if (!container) return;
    const tasks = enViewState.roomTasks || [];
    const today = todayYmd();

    // A. 各タスク行に「期日」「担当」「編集」ピルを注入
    const rowSel = isLeftPane ? '[data-pctask]' : 'input[type="checkbox"][onchange^="toggleRoomTask"]';
    container.querySelectorAll(rowSel).forEach(cb => {
      const labelEl = cb.closest('label');
      if (!labelEl || labelEl.querySelector('.en-task-chips')) return;
      let idx = -1;
      if (isLeftPane) {
        idx = Number(cb.getAttribute('data-pctask'));
      } else {
        const m = String(cb.getAttribute('onchange') || '').match(/toggleRoomTask\((\d+)\)/);
        if (m) idx = Number(m[1]);
      }
      const t = tasks[idx];
      if (!t) return;

      const isOverdue = !t.done && t.dueDate && t.dueDate < today;
      const chips = document.createElement('span');
      chips.className = 'en-task-chips';
      chips.innerHTML = `
        ${t.dueDate ? `<button type="button" class="en-task-chip ${isOverdue ? 'overdue' : 'due'}" data-edittask="${idx}">📅 ${t.dueDate.slice(5)}</button>` : ''}
        ${t.assignee ? `<button type="button" class="en-task-chip who" data-edittask="${idx}">👤 ${esc(t.assignee)}</button>` : ''}
        ${(!t.dueDate && !t.assignee) ? `<button type="button" class="en-task-chip edit" data-edittask="${idx}">＋期日/担当</button>` : ''}
      `;
      labelEl.appendChild(chips);
    });

    container.querySelectorAll('[data-edittask]').forEach(btn => {
      btn.onclick = e => {
        e.preventDefault();
        e.stopPropagation();
        openTaskMetaEditSheet(labId, Number(btn.getAttribute('data-edittask')));
      };
    });

    // B. 新規タスク追加欄に「📅 期日」＆「👤 担当」を差し込み（カレンダー自動連動）
    const addBtnId = isLeftPane ? '#enPcTaskAdd' : '#enNewTaskAdd';
    const inpId = isLeftPane ? '#enPcTaskIn' : '#enNewTaskIn';
    const addBtn = container.querySelector(addBtnId);
    const txtInp = container.querySelector(inpId);
    if (addBtn && txtInp && !addBtn.dataset.enB3TaskBound) {
      addBtn.dataset.enB3TaskBound = '1';
      const rowWrap = txtInp.closest('.en-row');
      if (rowWrap) {
        const metaRow = document.createElement('div');
        metaRow.className = 'en-task-meta-row';
        const dId = isLeftPane ? 'enPcTaskDue' : 'enNewTaskDue';
        const wId = isLeftPane ? 'enPcTaskWho' : 'enNewTaskWho';
        metaRow.innerHTML = `
          <input id="${dId}" type="date" class="en-task-meta-in" title="期日（入力するとカレンダーへ自動反映）">
          <select id="${wId}" class="en-task-meta-in" title="担当者">
            <option value="">👤 担当（任意）</option>
            ${DEFAULT_ASSIGNEES.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('')}
          </select>
        `;
        rowWrap.after(metaRow);

        // キャプチャフェーズで横取りして期日・担当つきで登録＆カレンダー同期
        addBtn.addEventListener('click', e => {
          const val = txtInp.value.trim();
          if (!val) return;
          e.preventDefault();
          e.stopImmediatePropagation();
          const cleanText = window.EN_SECURITY ? window.EN_SECURITY.sanitizePlainText(val, 140) : val;
          const dueDate = document.getElementById(dId)?.value || '';
          const assignee = document.getElementById(wId)?.value || '';
          enViewState.roomTasks.unshift({
            id: 't-' + Date.now(),
            text: cleanText,
            done: false,
            dueDate,
            assignee
          });
          syncTasksToCalendar(labId);
          enToast(dueDate ? `✅ タスク追加＆📅カレンダー(${dueDate.slice(5)})へ自動反映しました！` : '✅ タスクを追加しました！');
          window.renderEnRoomModal();
        }, true);
      }
    }
  }

  // =========================================================
  // 🔁 3. ボード間「自動バトンリレー」UI注入
  // =========================================================
  function injectBoardBatonRelay(modal, lab, d) {
    if (!modal || enViewState.roomViewAsFan || enViewState.roomTab !== 'board') return;
    const body = modal.querySelector('#enRoomBody');
    const card = body?.querySelector('.card.en-card');
    if (!card || card.querySelector('.en-relay-bar')) return;

    const tid = d.selectedTool;

    // 1) 原価計算 → 商品完成登録（売価転記）
    if (tid === 'cost') {
      const price = Number(d.cost?.price || 0);
      const bar = document.createElement('div');
      bar.className = 'en-relay-bar';
      bar.innerHTML = `
        <div class="en-relay-txt">
          <span>🔁 ボード間バトンリレー</span>
          <small>現在の予定売価（¥${price.toLocaleString()}）を商品完成登録へそのまま反映</small>
        </div>
        <button type="button" class="en-act-btn primary" style="font-size:11px;padding:6px 10px;" id="enRelayCostBtn">🍊 完成登録へ転記</button>
      `;
      card.appendChild(bar);
      bar.querySelector('#enRelayCostBtn').onclick = () => {
        d.launch.detailPrice = String(d.cost.price || 480);
        savePro();
        enToast(`🍊 売価 ¥${Number(d.launch.detailPrice).toLocaleString()} を商品完成登録へ反映しました！`);
      };
      return;
    }

    // 2) 試作A/B → 食品表示・法規（本採用配合をラベル下書きへ追記）
    if (tid === 'proto' && Array.isArray(d.protos) && d.protos.length) {
      const best = d.protos.find(p => p.adopted) || d.protos[d.protos.length - 1];
      const bar = document.createElement('div');
      bar.className = 'en-relay-bar';
      bar.innerHTML = `
        <div class="en-relay-txt">
          <span>🔁 ボード間バトンリレー（${esc(best.ver)}${best.adopted ? '・本採用' : ''}）</span>
          <small>配合「${esc(best.cond)}」を食品表示ラベル原案へ転記します</small>
        </div>
        <button type="button" class="en-act-btn primary" style="font-size:11px;padding:6px 10px;" id="enRelayProtoBtn">📋 食品表示へ転記</button>
      `;
      card.appendChild(bar);
      bar.querySelector('#enRelayProtoBtn').onclick = () => {
        if (!Array.isArray(d.legal) || !d.legal.length) return enToast('⚠️ 食品表示ボードに項目がありません');
        const noteLine = `【試作${best.ver} 転記】配合：${best.cond}（${best.memo}）`;
        if (!String(d.legal[0].detail || '').includes(noteLine)) {
          d.legal[0].detail = `${d.legal[0].detail || ''}\n${noteLine}`.trim();
          d.legal[0].done = false; // 転記後は人間が目視再確認する安全設計
          savePro();
          enToast(`📋 ${best.ver}の配合を「食品表示・法規」へ転記しました（要確認に切替）`);
        } else {
          enToast('ℹ️ この試作メモはすでに食品表示へ転記済みです');
        }
      };
      return;
    }

    // 3) 市場・ポジショニング / 販促 → 商品完成登録（紹介文＆こだわり転記）
    if (tid === 'market' || tid === 'promo') {
      const bar = document.createElement('div');
      bar.className = 'en-relay-bar';
      bar.innerHTML = `
        <div class="en-relay-txt">
          <span>🔁 ボード間バトンリレー</span>
          <small>キャッチコピー・選ばれる理由を「商品完成登録」の紹介文へ自動転記</small>
        </div>
        <button type="button" class="en-act-btn primary" style="font-size:11px;padding:6px 10px;" id="enRelayPromoBtn">🍊 完成登録へ転記</button>
      `;
      card.appendChild(bar);
      bar.querySelector('#enRelayPromoBtn').onclick = () => {
        const pitch = [d.promo?.copy, d.market?.advantage].filter(Boolean).join('／');
        if (!pitch) return enToast('⚠️ 先にキャッチコピーまたは選ばれる理由を入力してください');
        d.launch.detailPitch = pitch;
        if (!d.launch.comment || d.launch.comment.length < 8) {
          d.launch.comment = `${d.market?.target || '皆さま'}に向けて、${d.market?.advantage || 'こだわり素材'}で仕上げました！`;
        }
        savePro();
        enToast('🍊 キャッチ＆こだわりを「商品完成登録」へ反映しました！');
      };
    }
  }

  // =========================================================
  // 🤖 4. 食品表示・法規の「AI下書き人間承認ガード」UI注入
  // =========================================================
  function enhanceLegalAiApprovalUI(modal, d) {
    if (!modal || enViewState.roomViewAsFan || enViewState.roomTab !== 'board' || d.selectedTool !== 'legal') return;
    const cards = modal.querySelectorAll('#enRoomBody .en-legal-card');
    cards.forEach((cardEl, idx) => {
      const item = d.legal?.[idx];
      if (!item || !item.aiDraft) return;
      if (cardEl.querySelector('.en-ai-draft-bar, .en-ai-approved-pill')) return;

      if (!item.humanApproved) {
        const warn = document.createElement('div');
        warn.className = 'en-ai-draft-bar';
        warn.innerHTML = `
          <span>🤖 AI下書き（要目視確認・未承認の間は巣立ち公開ロック）</span>
          <button type="button" class="en-act-btn primary" style="padding:4px 9px;font-size:10.5px;" data-approvelegal="${idx}">✓ 内容確認・承認</button>
        `;
        cardEl.insertBefore(warn, cardEl.firstChild);
        warn.querySelector('[data-approvelegal]').onclick = () => {
          item.humanApproved = true;
          item.approvedAt = new Date().toLocaleString('ja-JP');
          savePro();
          enToast('✅ 食品表示のAI下書きを人間確認で承認しました！');
          window.renderEnRoomModal();
        };
      } else {
        const head = cardEl.querySelector('.en-legal-head');
        if (head) {
          const pill = document.createElement('span');
          pill.className = 'en-ai-approved-pill';
          pill.textContent = '✓ AI下書き承認済';
          head.after(pill);
        }
      }
    });
  }

  function injectAiGuardStatusInSettings(modal) {
    if (!modal || enViewState.roomViewAsFan || enViewState.roomTab !== 'detail') return;
    const body = modal.querySelector('#enRoomBody');
    if (!body || body.querySelector('#enAiGuardStatusBox')) return;

    const st = getAiQuotaStatus();
    const box = document.createElement('div');
    box.id = 'enAiGuardStatusBox';
    box.className = 'en-ai-guard-status';
    box.innerHTML = `
      <span>🛡️ <strong>AI安全ガード稼働中</strong>（個人情報自動マスクON・食品表示承認ロックON）</span>
      <strong>本日残り ${st.remain} / ${st.limit} 回</strong>
    `;
    body.appendChild(box);
  }

  // =========================================================
  // 🔌 5. 全フック一括装着
  // =========================================================
  function installB3HooksOnce() {
    if (b3HooksInstalled) return;
    b3HooksInstalled = true;

    // A) AIツール補完に「回数制限・クールダウン・例外フォールバック・AI下書きタグ」を装着
    if (typeof window.runAiToolAssist === 'function') {
      const origAi = window.runAiToolAssist;
      window.runAiToolAssist = function (labId, toolId) {
        const quota = consumeAiQuota();
        if (!quota.ok) {
          enToast(quota.msg);
          return;
        }
        const d = (typeof getRoomProData === 'function') ? getRoomProData(labId) : null;
        const prevLegalLen = d && Array.isArray(d.legal) ? d.legal.length : 0;

        try {
          const res = origAi.apply(this, arguments);
          if (d && toolId === 'legal' && Array.isArray(d.legal) && d.legal.length > prevLegalLen) {
            for (let i = prevLegalLen; i < d.legal.length; i++) {
              d.legal[i].aiDraft = true;
              d.legal[i].humanApproved = false;
            }
            savePro();
            window.renderEnRoomModal();
            enToast('🛡️ AI下書きを追加しました（内容を目視確認して「承認」してください）');
          }
          return res;
        } catch (err) {
          console.error('AI Assist fallback:', err);
          enToast('⚠️ AI補完が一時的に応答できませんでした（手動入力はそのまま使えます）');
        }
      };
    }

    // B) AI議事録スキャンに「送信前・個人情報自動マスキング」を装着
    if (typeof window.openAiTranscriptScan === 'function') {
      const origScan = window.openAiTranscriptScan;
      window.openAiTranscriptScan = function (labId) {
        const res = origScan.apply(this, arguments);
        const content = document.getElementById('en-sheet-content');
        if (content) {
          const lastMsgs = (enViewState.roomMessages || []).slice(-4);
          const rawCombined = lastMsgs.map(m => `${m.sender}: ${m.text}`).join(' / ');
          const { maskedText, maskedCount } = maskSensitiveInfo(rawCombined);

          const firstFormula = content.querySelector('.en-formula');
          if (firstFormula) {
            const meta = firstFormula.querySelector('.en-meta');
            if (meta) meta.textContent = maskedText;
            const note = document.createElement('div');
            note.className = 'en-ai-mask-preview';
            note.innerHTML = maskedCount > 0
              ? `🛡️ <strong>個人情報マスク発動（${maskedCount}件保護）：</strong>電話番号・メール・番地を自動マスクしました。`
              : `🛡️ <strong>送信前セキュリティ検査クリア：</strong>個人情報（電話・メール・番地）の混入なしを確認済みです。`;
            firstFormula.after(note);
          }
        }
        return res;
      };
    }

    // C) 巣立ち公開に「食品表示AI下書き・未承認ブロック」を装着
    if (typeof window.completeProGraduation === 'function') {
      const origGrad = window.completeProGraduation;
      window.completeProGraduation = function (labId) {
        const d = (typeof getRoomProData === 'function') ? getRoomProData(labId) : null;
        const unapproved = countUnapprovedAiLegal(d);
        if (unapproved > 0) {
          enToast(`🛡️ 食品表示のAI下書きが${unapproved}件未承認です！目視確認して承認してください`);
          if (d) {
            d.selectedTool = 'legal';
            enViewState.roomTab = 'board';
            window.renderEnRoomModal();
          }
          return;
        }
        return origGrad.apply(this, arguments);
      };
    }

    // D) タスク完了切替・削除時にカレンダーを自動同期
    if (typeof window.toggleRoomTask === 'function') {
      const origTgl = window.toggleRoomTask;
      window.toggleRoomTask = function () {
        const res = origTgl.apply(this, arguments);
        const labId = enViewState.roomOpenId || enViewState.labs?.[0]?.id;
        syncTasksToCalendar(labId);
        return res;
      };
    }

    // E) ルーム描画後に B-3 UI（タスク期日/担当・バトンリレー・AI承認・ガード表示）を自動注入
    if (typeof window.renderEnRoomModal === 'function') {
      const origRender = window.renderEnRoomModal;
      window.renderEnRoomModal = function () {
        const labId = enViewState.roomOpenId || enViewState.labs?.[0]?.id;
        if (labId) syncTasksToCalendar(labId);
        const res = origRender.apply(this, arguments);

        const modal = document.getElementById('en-room-modal');
        const lab = enViewState.labs.find(l => l.id === labId) || enViewState.labs[0];
        const d = (lab && typeof getRoomProData === 'function') ? getRoomProData(lab.id) : null;
        if (!modal || !lab || !d) return res;

        // 1) PC/スマホ進行タブのタスク期日＆担当＆カレンダー同期UI
        if (!enViewState.roomViewAsFan && enViewState.roomTab === 'progress') {
          enhanceTaskListInContainer(modal.querySelector('#enRoomBody'), lab.id, false);
        }
        // 2) PC左ペイン進行タブにも同様に適用
        const leftContent = modal.querySelector('#enPcLeftContent');
        if (leftContent && leftContent.querySelector('#enPcTaskIn')) {
          enhanceTaskListInContainer(leftContent, lab.id, true);
        }
        // タスク削除ボタン押下時のカレンダー再同期
        modal.querySelectorAll('[data-deltask]').forEach(btn => {
          btn.addEventListener('click', () => setTimeout(() => syncTasksToCalendar(lab.id), 20));
        });

        // 3) ボード間バトンリレー
        injectBoardBatonRelay(modal, lab, d);
        // 4) 食品表示AI下書きの人間承認ガード
        enhanceLegalAiApprovalUI(modal, d);
        // 5) ルーム設定のAI安全ガードステータス表示
        injectAiGuardStatusInSettings(modal);

        if (typeof enSyncTheme === 'function') enSyncTheme();
        return res;
      };
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      installB3HooksOnce();
    }, 340);
  });
})();