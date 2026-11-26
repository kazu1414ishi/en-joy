/* =========================================================
   EN•joy v6.5 Part 1 (v6_part1.js)
   - 登録5ステップ化（Step 4に「仕事性格診断：簡易4問＋詳細15項目(任意)」を追加）
   - 開発用ツール（最初⇄使い込み・スマホ幅・ゾーン枠・ログ・初期化）を格納式フロートタブへ完全集約
   - 登録完了→ホーム遷移の確実化＆ユーザータイプ別ホーム自動切替
   - ホーム（初回1画面収まり・数字ボックス→進捗→ルーム直行・マイインデックス棚・最下部 設定/年輪/お問い合わせ）
   - つぶやき＆動画（4タブ＋友達・ポップ切り抜き・X/インスタ画像シェア）・enちゃんの巣・名刺＆❓QR＆友達
========================================================= */

function v6DefaultHomeConfig(stage) {
  const isFan = stage === "fan";
  return {
    customized: false,
    stats: isFan ? ["fan_favs", "fan_supports", "fan_votes"] : ["active_labs", "my_offers", "got_interest"],
    indexes: isFan ? ["public_vote", "sos_alert", "sudachi_new"] : ["talk_new", "public_vote"]
  };
}

const v6 = {
  enMeta: EnjoyStore.load(V6_STORAGE_KEYS.EN_META, cloneObj(ENJOY_V6_DATA.initialEnMeta)),
  workDiag: EnjoyStore.load(V6_STORAGE_KEYS.WORK_DIAG, cloneObj(ENJOY_V6_DATA.initialWorkDiag)),
  friends: EnjoyStore.load(V6_STORAGE_KEYS.FRIENDS, cloneObj(ENJOY_V6_DATA.initialFriends)),
  homeConfig: EnjoyStore.load(V6_STORAGE_KEYS.HOME_CONFIG, null),
  ecProducts: EnjoyStore.load(V6_STORAGE_KEYS.EC_PRODUCTS, cloneObj(ENJOY_V6_DATA.initialEcProducts)),
  fiftyItems: EnjoyStore.load(V6_STORAGE_KEYS.FIFTY_ITEMS, cloneObj(ENJOY_V6_DATA.initialFiftyItems)),
  nenrin: EnjoyStore.load(V6_STORAGE_KEYS.NENRIN, cloneObj(ENJOY_V6_DATA.initialNenrin)),
  fanState: EnjoyStore.load(V6_STORAGE_KEYS.FAN_STATE, { favs: ["ec-s1"], supports: ["proj-mature-1"], votedIds: ["vt-1"] }),
  logs: v6NormalizeLogs(EnjoyStore.load(V6_STORAGE_KEYS.LOGS, null)),
  heatmap: EnjoyStore.load(V6_STORAGE_KEYS.HEATMAP, []),
  shopTab: "sudachi",
  roomSwipeSlide: 0,
  activeStatDrawer: null,
  enSearchQuery: "",
  enFilters: { role: "", stage: "", tag: "", area: "", offerKind: "" },
  todoSort: "date",
  heatmapVisible: false,
  devOpen: false,
  lastActionLabel: "起動",
  screenEnteredAt: Date.now(),
  hesitationTimer: null,
  lastScrollY: 0
};

if (!v6.homeConfig || !Array.isArray(v6.homeConfig.stats)) {
  v6.homeConfig = v6DefaultHomeConfig(state.profile.userStage);
}
if (!v6.workDiag || typeof v6.workDiag !== "object") {
  v6.workDiag = cloneObj(ENJOY_V6_DATA.initialWorkDiag);
}

function v6SaveAll() {
  EnjoyStore.save(V6_STORAGE_KEYS.EN_META, v6.enMeta);
  EnjoyStore.save(V6_STORAGE_KEYS.WORK_DIAG, v6.workDiag);
  EnjoyStore.save(V6_STORAGE_KEYS.FRIENDS, v6.friends);
  EnjoyStore.save(V6_STORAGE_KEYS.HOME_CONFIG, v6.homeConfig);
  EnjoyStore.save(V6_STORAGE_KEYS.EC_PRODUCTS, v6.ecProducts);
  EnjoyStore.save(V6_STORAGE_KEYS.FIFTY_ITEMS, v6.fiftyItems);
  EnjoyStore.save(V6_STORAGE_KEYS.NENRIN, v6.nenrin);
  EnjoyStore.save(V6_STORAGE_KEYS.FAN_STATE, v6.fanState);
  EnjoyStore.save(V6_STORAGE_KEYS.LOGS, v6.logs);
  EnjoyStore.save(V6_STORAGE_KEYS.HEATMAP, (v6.heatmap || []).slice(-180));
}

function v6AddNenrin(title, detail) {
  v6.nenrin.unshift({ date: getNowTimeStr(), title, detail });
  if (v6.nenrin.length > 30) v6.nenrin.pop();
  v6SaveAll();
}

function v6GainExp(pt) {
  v6.enMeta.enExp = (v6.enMeta.enExp || 15) + pt;
  v6.enMeta.hasNotify = true;
  v6SaveAll();
  document.getElementById("v6NestBtn")?.classList.add("has-notify");
}

function v6SwitchSiteMode(targetMode) {
  const next = targetMode || (getSiteMode() === "initial" ? "mature" : "initial");
  setSiteMode(next);
  location.reload();
}

function v6AllProjects() {
  return state.projects.length ? state.projects : [state.sampleRoom];
}

/* ==================== 5ステップ登録（goStep & 完了処理のラップ） ==================== */
goStep = function (stepNum) {
  state.step = stepNum;
  document.querySelectorAll(".step-panel").forEach(p => {
    p.classList.toggle("active", Number(p.dataset.panel) === stepNum);
  });
  const lbl = document.getElementById("regProgressLabel");
  const fill = document.getElementById("regProgressFill");
  if (lbl) lbl.textContent = `ステップ ${stepNum} / 5`;
  if (fill) fill.style.width = `${stepNum * 20}%`;

  if (stepNum === 2) renderStep2Content();
  if (stepNum === 3) { renderStep3ByStage(); v6RenderEnDiagChips(); }
  if (stepNum === 4) v6RenderWorkDiagPanel();
  if (stepNum === 5) renderStep4AccountUI();

  window.scrollTo({ top: 0, behavior: "smooth" });
};

const _v5FinishReg = finishRegistrationAndReveal;
finishRegistrationAndReveal = function () {
  // 登録時のユーザータイプに合わせてホーム初期配置を自動同期（手動カスタム前のみ）
  if (!v6.homeConfig.customized) {
    v6.homeConfig = v6DefaultHomeConfig(state.profile.userStage);
  }
  v6GainExp(10);
  v6SaveAll();
  _v5FinishReg();
};

/* ==================== 中央❓付き専用QR ＆ 名刺への仕事性格反映 ==================== */
function v6GenerateQrSvg(seed, accentColor) {
  const s = String(seed || "ENJOY-V6");
  let hash = 2166136261;
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const size = 21;
  let rects = "";
  const isFinder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);
  const isCenter = (r, c) => r >= 7 && r <= 13 && c >= 7 && c <= 13;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isCenter(r, c)) continue;
      let on = false;
      if (isFinder(r, c)) {
        const lr = r < 7 ? r : r - (size - 7);
        const lc = c < 7 ? c : c - (size - 7);
        on = lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
      } else {
        hash = Math.imul(hash ^ (r * 31 + c), 16777619);
        on = ((hash >>> 0) % 100) < 48;
      }
      if (on) rects += `<rect x="${c * 4 + 4}" y="${r * 4 + 4}" width="4" height="4" fill="#242724" rx="0.8"/>`;
    }
  }
  const col = accentColor || "#3D664A";
  return `
    <svg viewBox="0 0 92 92" width="76" height="76" xmlns="http://www.w3.org/2000/svg">
      <rect width="92" height="92" fill="#ffffff" rx="6"/>
      ${rects}
      <rect x="32" y="32" width="28" height="28" rx="6" fill="${col}" stroke="#ffffff" stroke-width="2"/>
      <text x="46" y="51.5" text-anchor="middle" font-size="16" font-weight="800" fill="#ffffff">❓</text>
    </svg>
  `;
}

const _v5BuildBusinessCardHTML = buildBusinessCardHTML;
buildBusinessCardHTML = function (p, mode) {
  const baseHtml = _v5BuildBusinessCardHTML(p, mode);
  const isMine = (p === state.profile);
  const enType = (isMine ? v6.enMeta.enType : p.enType) || "開拓ハチドリ型";
  const enColor = (isMine ? v6.enMeta.enColor : p.enColor) || "#3D664A";
  const seed = (isMine ? v6.enMeta.enSeed : p.enSeed) || `${p.displayName || "ENJOY"}-${enType}`;

  const diagRes = isMine ? v6CalcWorkDiagResult(v6.workDiag) : null;
  const diagHtml = diagRes ? `
    <div class="bc-work-diag-box">
      <strong style="color:var(--green);">🧠 仕事スタイル：${escapeHtml(diagRes.type.badge)}</strong>
      <div class="mini-note" style="margin-top:2px;">${escapeHtml(diagRes.type.summary)}</div>
    </div>
  ` : "";

  const qrHtml = `
    ${diagHtml}
    <div class="bc-qr-block">
      <div class="bc-qr-svg-wrap">${v6GenerateQrSvg(seed, enColor)}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:0.78rem;font-weight:800;color:var(--green);">🐣 ${escapeHtml(enType)}（専用❓QR）</div>
        <p class="mini-note" style="margin-top:2px;">対面で読み込むと名刺表示→ワンタップ友達登録（テスト版は中央❓表記）。</p>
      </div>
    </div>
  `;
  const lastIdx = baseHtml.lastIndexOf("</div>");
  return lastIdx > 0 ? baseHtml.slice(0, lastIdx) + qrHtml + baseHtml.slice(lastIdx) : baseHtml + qrHtml;
};

/* ==================== Step 4：仕事性格診断（簡易4問＋詳細15項目任意） ==================== */
function v6RenderWorkDiagPanel() {
  const panel = document.getElementById("v6WorkDiagPanel");
  if (!panel) return;
  const quick = v6.workDiag.quick || {};
  const detail = v6.workDiag.detail || {};
  const detailOpen = !!v6.workDiag.detailOpen;
  const qDone = Object.keys(quick).length;
  const dDone = Object.keys(detail).length;
  const res = v6CalcWorkDiagResult(v6.workDiag);

  const quickHtml = ENJOY_V6_DATA.workDiagQuick.map(q => `
    <div class="diag-q-box">
      <p class="diag-q-title">${escapeHtml(q.q)}</p>
      <div class="diag-opt-grid">
        ${q.options.map(opt => `
          <button type="button" class="diag-opt-btn ${quick[q.id] === opt.id ? "selected" : ""}" data-v6-wq="${q.id}|${opt.id}">
            ${escapeHtml(opt.label)}
          </button>
        `).join("")}
      </div>
    </div>
  `).join("");

  const detailHtml = ENJOY_V6_DATA.workDiagDetail.map(d => {
    const val = detail[d.id];
    return `
      <div class="diag-detail-item">
        <p class="diag-detail-q">${escapeHtml(d.text)}</p>
        <div class="diag-scale-row">
          <button type="button" class="diag-scale-btn ${val === 2 ? "selected" : ""}" data-v6-wd="${d.id}|2">当てはまる</button>
          <button type="button" class="diag-scale-btn ${val === 1 ? "selected" : ""}" data-v6-wd="${d.id}|1">どちらとも</button>
          <button type="button" class="diag-scale-btn ${val === 0 ? "selected" : ""}" data-v6-wd="${d.id}|0">あまり</button>
        </div>
      </div>
    `;
  }).join("");

  const resHtml = res ? `
    <div class="diag-result-card">
      <div class="v6-between">
        <span class="stage-pill">🧠 診断結果（簡易${res.quickDone}/4 ・ 詳細${res.detailDone}/15）</span>
        <span class="mini-note">名刺に自動反映</span>
      </div>
      <h3 style="margin:6px 0 4px;color:var(--green);">${escapeHtml(res.type.badge)}</h3>
      <p style="margin:0 0 6px;font-size:0.84rem;font-weight:700;">${escapeHtml(res.type.summary)}</p>
      <p class="mini-note" style="margin:0 0 4px;">💼 ${escapeHtml(res.type.workStyle)}</p>
      <p class="mini-note" style="margin:0;color:var(--orange);font-weight:700;">🤝 ${escapeHtml(res.type.bestMatch)}</p>
    </div>
  ` : `<div class="card card-soft" style="padding:10px;margin-top:8px;"><p class="mini-note">上の簡易4問をタップすると、ここにあなたの仕事スタイル診断が出ます。</p></div>`;

  panel.innerHTML = `
    <div class="card reg-card">
      <div class="reg-step-head">
        <div class="v6-between">
          <h2 class="reg-title-oneline">仕事の向き合い方・性格診断</h2>
          <button id="v6RS4Diag" type="button" class="btn-sample-fill">✨ 入力イメージ</button>
        </div>
        <p class="reg-subtitle">相性のいいコラボ相手と出会うための診断です（enちゃんとは別の仕事用・30秒で完了）。</p>
      </div>

      <div style="margin-bottom:8px;">
        <span class="stage-pill">STEP A：簡易診断（4問） ${qDone} / 4</span>
      </div>
      ${quickHtml}

      <div class="diag-q-box" style="margin-top:12px;">
        <div class="v6-between">
          <div>
            <strong style="font-size:0.84rem;">📋 STEP B：もっと詳しく診断する（15項目・任意）</strong>
            <p class="mini-note">回答済：${dDone} / 15項目（答えるほどマッチング精度が上がります）</p>
          </div>
          <button id="v6ToggleDetailDiagBtn" type="button" class="btn btn-outline btn-sm">${detailOpen ? "▲ 閉じる" : "▼ 15項目を開く"}</button>
        </div>
        <div id="v6WorkDiagDetailWrap" class="${detailOpen ? "" : "hidden"}" style="margin-top:10px;">
          ${detailHtml}
        </div>
      </div>

      ${resHtml}

      <div class="step-actions">
        <button type="button" class="btn btn-ghost" data-v6-gostep="3">← 戻る</button>
        <div class="finish-btns">
          <button type="button" class="btn btn-outline btn-sm" data-v6-gostep="5">あとで診断</button>
          <button type="button" class="btn btn-accent" data-v6-gostep="5">次へ（詳細情報へ）</button>
        </div>
      </div>
    </div>
  `;
}

/* ==================== 共通モーダル ＆ 格納式・開発フロートタブ ==================== */
function v6OpenModal(title, html) {
  document.getElementById("v6ModalTitle").textContent = title;
  document.getElementById("v6ModalBody").innerHTML = html;
  document.getElementById("v6GenericModal").classList.remove("hidden");
}
function v6CloseModal() {
  document.getElementById("v6GenericModal").classList.add("hidden");
}

function v6RenderDevDock() {
  const dock = document.getElementById("v6DevDock");
  if (!dock) return;
  const isMature = getSiteMode() === "mature";
  const isMobile = document.body.classList.contains("mobile-preview");
  const isZones = document.body.classList.contains("show-zones");

  dock.innerHTML = `
    <button type="button" class="v6-dev-handle" id="v6DevHandleBtn">🛠️ 開発</button>
    <div class="v6-dev-panel ${v6.devOpen ? "" : "hidden"}" id="v6DevPanel">
      <h4><span>🛠️ 開発・テストツール</span><button type="button" class="v6-index-close" id="v6DevCloseBtn">✕</button></h4>
      <div class="v6-dev-btn-list">
        <button type="button" class="v6-dev-btn ${!isMature ? "active" : ""}" id="v6DevModeInit">🐣 最初のサイト（登録から）</button>
        <button type="button" class="v6-dev-btn ${isMature ? "active" : ""}" id="v6DevModeMature">🌳 使用していった時のサイト</button>
        <button type="button" class="v6-dev-btn ${isMobile ? "active" : ""}" id="v6DevToggleMobile">📱 スマホ幅プレビュー：${isMobile ? "ON" : "OFF"}</button>
        <button type="button" class="v6-dev-btn ${isZones ? "active" : ""}" id="v6DevToggleZones">🧱 将来ゾーン枠：${isZones ? "ON" : "OFF"}</button>
        <button type="button" class="v6-dev-btn" id="v6DevOpenLogs">📊 行動ログ・ヒートマップ・Discord</button>
        <button type="button" class="v6-dev-btn" id="v6DevResetMode" style="border-color:#E87A3E;color:#F8C5A5;">🔄 このモードを最初に戻す</button>
      </div>
    </div>
  `;
}

/* ==================== ホーム画面（初回1画面収まり・ユーザー別数字→進捗→ルーム直行） ==================== */
function v6GetStatValue(statId) {
  const projs = v6AllProjects();
  if (statId === "active_labs") return { num: state.projects.length, sub: "" };
  if (statId === "my_offers") {
    const cmts = state.offers.reduce((s, o) => s + (o.comments || 0), 0);
    return { num: state.offers.length, sub: cmts > 0 ? `💬+${cmts}` : "" };
  }
  if (statId === "got_interest") return { num: projs.reduce((s, p) => s + ((p.applicants || []).length), 0), sub: "" };
  if (statId === "sent_interest") return { num: Object.keys(state.matches || {}).length, sub: "" };
  if (statId === "my_todos") return { num: projs.reduce((s, p) => s + (p.todos || []).filter(t => !t.done).length, 0), sub: "" };
  if (statId === "fan_favs") return { num: (v6.fanState.favs || []).length, sub: "" };
  if (statId === "fan_supports") return { num: (v6.fanState.supports || []).length, sub: "" };
  if (statId === "fan_votes") return { num: (v6.fanState.votedIds || []).length, sub: "" };
  return { num: 0, sub: "" };
}

function v6RenderHomeDashboard() {
  const root = document.getElementById("v6HomeRoot");
  if (!root) return;

  const activeStats = (v6.homeConfig.stats || []).slice(0, 3);
  const statsHtml = activeStats.map(sid => {
    const def = ENJOY_V6_DATA.homeStatCatalog.find(x => x.id === sid) || { id: sid, label: sid };
    const val = v6GetStatValue(sid);
    return `
      <button type="button" class="v6-stat-tile ${v6.activeStatDrawer === sid ? "active" : ""}" data-v6-stat-open="${sid}">
        <span class="v6-stat-num">${val.num}${val.sub ? `<span class="v6-stat-subbadge">${val.sub}</span>` : ""}</span>
        <span class="v6-stat-lbl">${escapeHtml(def.label)}</span>
      </button>
    `;
  }).join("") + `
    <button type="button" class="v6-stat-tile" id="v6OpenHomeCustomBtn">
      <span class="v6-stat-num" style="color:var(--orange);">＋</span>
      <span class="v6-stat-lbl">カスタム</span>
    </button>
  `;

  const drawerHtml = v6.activeStatDrawer ? v6BuildStatDrawerHtml(v6.activeStatDrawer) : "";
  const indexes = v6.homeConfig.indexes || [];
  const indexCardsHtml = indexes.map(idxId => v6BuildHomeIndexCardHtml(idxId)).join("")
    || `<div class="v6-index-card"><p class="mini-note">インデックスが空です。下のボタンから表示したいカードを追加できます。</p></div>`;

  root.innerHTML = `
    <div class="v6-home-top-stats">${statsHtml}</div>
    ${drawerHtml}
    <div id="v6HomeIndexShelf">
      ${indexCardsHtml}
      <div style="text-align:center;margin:6px 0 4px;">
        <button type="button" class="btn-link" id="v6ManageIndexBtn">＋ インデックスを追加・整理</button>
      </div>
    </div>
    <div class="v6-home-footer">
      <button type="button" class="v6-footer-btn" id="v6FootSettings">⚙️ 設定</button>
      <button type="button" class="v6-footer-btn" id="v6FootNenrin">🪵 年輪 (${v6.nenrin.length})</button>
      <button type="button" class="v6-footer-btn" id="v6FootContact">✉️ お問い合わせ</button>
    </div>
  `;
}

function v6BuildStatDrawerHtml(statId) {
  const def = ENJOY_V6_DATA.homeStatCatalog.find(x => x.id === statId);
  const projs = v6AllProjects();
  let rows = "";

  if (statId === "my_todos") {
    const items = [];
    projs.forEach(p => (p.todos || []).filter(t => !t.done).forEach(t => items.push({ p, t })));
    rows = items.slice(0, 4).map(({ p, t }) => `
      <div class="v6-prog-row" data-v6-jump-room="${p.id}|todo">
        <div class="v6-between"><strong style="font-size:0.82rem;">✅ ${escapeHtml(t.title)}</strong><span class="mini-note">${t.date ? escapeHtml(t.date.slice(5)) : "期限なし"}</span></div>
        <div class="mini-note">🧪 ${escapeHtml(p.title)} → タップでやることへ</div>
      </div>
    `).join("") || `<p class="mini-note">未完了のやることはありません。</p>`;
  } else if (statId === "my_offers") {
    rows = state.offers.slice(0, 4).map(o => `
      <div class="v6-prog-row" data-v6-go-offers="1">
        <div style="font-size:0.82rem;font-weight:700;">🌱 ${escapeHtml(o.text.slice(0, 32))}…</div>
        <div class="mini-note">📍 ${escapeHtml(o.area || "関西")} ／ 💬 コメント ${o.comments || 0}件 → EN•ラボへ</div>
      </div>
    `).join("") || `<p class="mini-note">投稿したひらめき・困りごとはまだありません。</p>`;
  } else {
    rows = projs.slice(0, 4).map(p => {
      const pct = Math.min(100, (p.stage || 1) * 25);
      const stTxt = ["仲間あつめ", "方向性づくり", "試作・仕上げ", "巣立ち完了"][(p.stage || 1) - 1] || "進行中";
      return `
        <div class="v6-prog-row" data-v6-jump-room="${p.id}|room">
          <div class="v6-between">
            <strong style="font-size:0.82rem;">🧪 ${escapeHtml(p.title)}</strong>
            <span class="stage-pill">Step ${p.stage || 1}/4 ${stTxt}</span>
          </div>
          <div class="v6-prog-bar"><i style="width:${pct}%"></i></div>
        </div>
      `;
    }).join("");
  }

  return `
    <div class="v6-stat-drawer">
      <div class="v6-between" style="margin-bottom:8px;">
        <strong style="font-size:0.84rem;color:var(--green);">📑 ${escapeHtml(def?.label || "")} インデックス＆進捗</strong>
        <button type="button" class="v6-index-close" id="v6CloseStatDrawer">✕</button>
      </div>
      <div class="v6-stack">${rows}</div>
    </div>
  `;
}

function v6BuildHomeIndexCardHtml(idxId) {
  const projs = v6AllProjects();
  const wrap = (title, body) => `
    <div class="v6-index-card">
      <div class="v6-between" style="margin-bottom:5px;">
        <strong style="font-size:0.83rem;">${title}</strong>
        <button type="button" class="v6-index-close" data-v6-remove-idx="${idxId}" title="ホームから外す">✕</button>
      </div>
      ${body}
    </div>
  `;

  if (idxId === "talk_new") {
    const msgs = [];
    projs.forEach(p => { const m = (p.messages || []).slice(-1)[0]; if (m) msgs.push({ p, m }); });
    const body = msgs.slice(0, 2).map(({ p, m }) => `
      <div class="v6-prog-row" style="margin-bottom:4px;" data-v6-jump-room="${p.id}|talk">
        <div style="font-size:0.78rem;"><strong>${escapeHtml(m.sender)}</strong>：${escapeHtml(m.text.slice(0, 34))}…</div>
        <div class="mini-note">🧪 ${escapeHtml(p.title)}</div>
      </div>
    `).join("") || `<p class="mini-note">新着トークはまだありません。</p>`;
    return wrap("💬 トーク新着", body);
  }
  if (idxId === "public_vote") {
    let hit = null;
    projs.forEach(p => (p.votes || []).forEach(v => { if (v.isPublic && !hit) hit = { p, v }; }));
    if (!hit) return wrap("🗳️ 公開中の多数決", `<p class="mini-note">現在公開中の多数決はありません。</p>`);
    return wrap("🗳️ みんなで決める！（公開中）", `
      <div style="font-size:0.8rem;font-weight:700;margin-bottom:4px;">${escapeHtml(hit.v.title)}</div>
      <div class="v6-between">
        <span class="mini-note">🧪 ${escapeHtml(hit.p.title)}</span>
        <button type="button" class="btn btn-accent btn-sm" style="padding:4px 10px;font-size:0.74rem;" data-v6-jump-room="${hit.p.id}|room">🗳️ 投票する</button>
      </div>
    `);
  }
  if (idxId === "todo_due") {
    const tds = [];
    projs.forEach(p => (p.todos || []).filter(t => !t.done).forEach(t => tds.push({ p, t })));
    const body = tds.slice(0, 2).map(({ p, t }) => `
      <div class="v6-prog-row" style="margin-bottom:4px;" data-v6-jump-room="${p.id}|todo">
        <div class="v6-between"><span style="font-size:0.78rem;font-weight:700;">✅ ${escapeHtml(t.title)}</span><span class="mini-note">${escapeHtml((t.date || "").slice(5))}</span></div>
      </div>
    `).join("") || `<p class="mini-note">期限が近いやることはありません。</p>`;
    return wrap("✅ 期限が近いやること", body);
  }
  if (idxId === "news") {
    return wrap("📰 EN•joyニュース＆市場", `
      <div class="mini-note">・🔥 50:50人気急上昇：<strong>「無添加・120g小瓶・常温手土産」</strong></div>
      <div class="mini-note">・📍 大阪・京都の週末マルシェ出店募集（今月3件）</div>
    `);
  }
  if (idxId === "sos_alert") {
    const sos = state.feeds.find(f => f.type === "rescue");
    const body = sos
      ? `<div class="v6-prog-row" data-v6-go-feed-sos="1"><div style="font-size:0.78rem;font-weight:700;">🆘 ${escapeHtml(sos.text.slice(0, 42))}…</div><div class="mini-note">📍 ${escapeHtml(sos.area || "関西")} ／ タップでSOS一覧へ</div></div>`
      : `<p class="mini-note">急ぎのSOSはありません。</p>`;
    return wrap("🆘 SOSレスキュー速報", body);
  }
  if (idxId === "sudachi_new") {
    const s = (v6.ecProducts.sudachi || [])[0];
    const body = s
      ? `<div class="v6-prog-row" onclick="v6.shopTab='sudachi';switchView('shop');"><div style="font-size:0.78rem;font-weight:700;">🎉 ${escapeHtml(s.name)}（¥${Number(s.price).toLocaleString()}）</div><div class="mini-note">タップで開発ストーリー＆ショップへ</div></div>`
      : `<p class="mini-note">巣立ち商品は準備中です。</p>`;
    return wrap("🎉 巣立ち・新商品", body);
  }
  return "";
}

/* ==================== つぶやき＆動画（4タブ＋友達・ポップ切り抜き・SNSシェア） ==================== */
renderFeedView = function () {
  const container = document.getElementById("feedListContainer");
  if (!container) return;
  let list = [...state.feeds];

  if (state.feedFilter === "rescue") list = list.filter(f => f.type === "rescue");
  else if (state.feedFilter === "behind") list = list.filter(f => f.type === "behind");
  else if (state.feedFilter === "voice") list = list.filter(f => f.type === "voice" || f.type === "general");
  else if (state.feedFilter === "friends") {
    const fIds = new Set(v6.friends.filter(fr => fr.isFriend).map(fr => fr.id));
    const fNames = new Set(v6.friends.filter(fr => fr.isFriend).map(fr => fr.name));
    list = list.filter(f => f.author === getActiveSenderName() || fIds.has(f.authorId) || fNames.has(f.author));
  }

  if (typeof v6UpdateFab === "function") v6UpdateFab();
  if (!list.length) {
    container.innerHTML = `<div class="empty-callout"><strong>💬 該当する投稿はまだありません</strong><p>右下のボタンから最初の1件を投稿してみましょう！</p></div>`;
    return;
  }

  const badgeMap = {
    rescue: { cls: "rescue", label: "🆘 SOS" },
    behind: { cls: "general", label: "🛠️ 開発の裏側" },
    voice: { cls: "general", label: "🛒 みんなの声" },
    general: { cls: "general", label: "🛒 みんなの声" }
  };

  container.innerHTML = list.map(f => {
    const isSos = f.type === "rescue";
    const isBehind = f.type === "behind";
    const isVoice = f.type === "voice" || f.type === "general";
    const b = badgeMap[f.type] || badgeMap.voice;

    const sosTags = isSos ? `
      <div class="proj-kind-tags" style="margin-bottom:6px;">
        <span class="kind-tag rescue">⏰ ${escapeHtml(f.deadline || "今週中")}</span>
        ${f.amount ? `<span class="kind-tag rescue">📦 ${escapeHtml(f.amount)}</span>` : ""}
        <span class="kind-tag">📍 ${escapeHtml(f.area || "関西")}</span>
      </div>` : "";

    const popClipHtml = (f.popClip && f.popClip.length) ? `
      <div class="pop-clip-box">
        <div class="mini-note" style="font-weight:800;color:var(--orange);">💬 ルーム内トーク切り抜き</div>
        ${f.popClip.map(c => `<div class="pop-bubble"><strong>${escapeHtml(c.icon || "🌱")} ${escapeHtml(c.who)}</strong>${escapeHtml(c.text)}</div>`).join("")}
      </div>` : "";

    return `
      <article class="feed-card ${isSos ? "rescue-card" : ""}">
        <div class="feed-head">
          <div class="feed-author-wrap">
            <div class="feed-avatar">${f.roleIcon || "🌱"}</div>
            <div>
              <div class="feed-author">${escapeHtml(f.author)}</div>
              <div class="feed-meta">📍 ${escapeHtml(f.area || "関西")} ・ ${escapeHtml(f.time || "たった今")}</div>
            </div>
          </div>
          <span class="feed-badge ${b.cls}">${b.label}</span>
        </div>
        ${sosTags}
        <p class="feed-body">${escapeHtml(f.text)}</p>
        ${popClipHtml}
        ${renderMediaTag(f.media, "feed-media")}
        <div class="feed-actions">
          <div class="feed-action-left">
            <button type="button" class="btn btn-outline btn-sm" data-v6-feed-react="${f.id}|likes">👏 応援 (${f.likes || 0})</button>
            ${(isBehind || isSos) ? `<button type="button" class="btn btn-outline btn-sm" data-v6-feed-react="${f.id}|wantEat">🤤 食べてみたい (${f.wantEat || 0})</button>` : ""}
            ${isSos ? `<button type="button" class="btn btn-primary btn-sm" data-v6-sos-to-lab="${f.id}">🧪 EN•ラボを立てる</button><button type="button" class="btn btn-accent btn-sm" data-v6-go-rescue="1">🛒 訳ありで買う</button>` : ""}
            ${isBehind && f.linkedRoomId ? `<button type="button" class="btn btn-primary btn-sm" data-v6-jump-room="${f.linkedRoomId}|room">🧪 この企画のルームを見る</button>` : ""}
            ${isVoice ? `<button type="button" class="btn btn-outline btn-sm" data-v6-feed-react="${f.id}|helpful">💡 参考になった (${f.helpful || 0})</button><button type="button" class="btn btn-accent btn-sm" data-v6-voice-to-proj="${f.id}">🥚 この声で企画を立てる</button>` : ""}
            <button type="button" class="btn btn-outline btn-sm" data-v6-sns-share="${f.id}">📤 X/インスタ</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
};

/* ==================== X & インスタ同時シェア（ポップ画像生成） ==================== */
function v6OpenSnsShareModal(feedId) {
  const f = state.feeds.find(x => x.id === feedId);
  if (!f) return;
  const shareText = `${f.text}\n#ENjoy #商品開発の裏側`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  v6OpenModal("📤 X ＆ Instagram 同時シェア", `
    <p class="mini-note" style="margin-bottom:8px;">投稿テキストとポップ画像を自動生成しました。</p>
    <canvas id="v6ShareCanvas" width="540" height="540" style="width:100%;max-width:300px;display:block;margin:0 auto 10px;border-radius:12px;border:1px solid var(--line);"></canvas>
    <div class="v6-stack">
      <a class="btn btn-primary btn-full" href="${xUrl}" target="_blank" rel="noopener" style="text-decoration:none;">𝕏 (Twitter) で文章入り投稿を開く</a>
      <button id="v6SaveInstaImgBtn" type="button" class="btn btn-accent btn-full">📸 インスタ用ポップ画像を保存 / スマホ共有</button>
    </div>
  `);

  const cv = document.getElementById("v6ShareCanvas");
  if (cv && cv.getContext) {
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#F8F7F2"; ctx.fillRect(0, 0, 540, 540);
    ctx.fillStyle = "#3D664A"; ctx.fillRect(0, 0, 540, 74);
    ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 24px sans-serif"; ctx.fillText("🌱 EN•joy 開発の裏側", 24, 46);
    ctx.fillStyle = "#242724"; ctx.font = "bold 20px sans-serif"; ctx.fillText(f.author || "EN•joyメンバー", 24, 118);
    ctx.font = "18px sans-serif";
    ((f.text || "").match(/.{1,24}/g) || []).slice(0, 4).forEach((ln, i) => ctx.fillText(ln, 24, 158 + i * 30));
    let y = 295;
    (f.popClip || []).slice(0, 3).forEach(c => {
      ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = "#E87A3E"; ctx.lineWidth = 2;
      ctx.fillRect(24, y, 492, 54); ctx.strokeRect(24, y, 492, 54);
      ctx.fillStyle = "#3D664A"; ctx.font = "bold 15px sans-serif"; ctx.fillText(`${c.icon || "🌱"} ${c.who}`, 36, y + 22);
      ctx.fillStyle = "#242724"; ctx.font = "15px sans-serif"; ctx.fillText((c.text || "").slice(0, 28), 36, y + 44);
      y += 64;
    });
    ctx.fillStyle = "#E87A3E"; ctx.font = "bold 16px sans-serif"; ctx.fillText("EN•joy で開発中！ #ENjoy", 295, 518);
  }
  document.getElementById("v6SaveInstaImgBtn").onclick = () => {
    const cvEl = document.getElementById("v6ShareCanvas");
    if (!cvEl) return;
    if (navigator.share && cvEl.toBlob) {
      cvEl.toBlob(async blob => {
        try { await navigator.share({ files: [new File([blob], "enjoy_story.png", { type: "image/png" })], title: "EN•joy", text: shareText }); return; } catch {}
        v6DownloadCanvas(cvEl);
      });
    } else v6DownloadCanvas(cvEl);
  };
}

function v6DownloadCanvas(cv) {
  const a = document.createElement("a");
  a.href = cv.toDataURL("image/png");
  a.download = "enjoy_share_card.png";
  a.click();
  showToast("📸 インスタ用画像を保存しました！");
}

/* ==================== 巣・名刺＆❓QR・年輪・ホームカスタム・設定・お問い合わせ ==================== */
function v6OpenNestModal() {
  v6.enMeta.hasNotify = false; v6SaveAll();
  document.getElementById("v6NestBtn")?.classList.remove("has-notify");
  const exp = v6.enMeta.enExp || 15;
  const lv = Math.floor(exp / 25) + 1;
  const icon = exp < 40 ? "🥚" : (exp < 80 ? "🐣" : (exp < 130 ? "🐥" : "🕊️"));
  const stage = exp < 40 ? "タマゴ期（アイデア温め中）" : (exp < 80 ? "孵化・ヒナ期（試作スタート）" : (exp < 130 ? "若鳥期（マルシェ準備中）" : "巣立ち達成！"));
  v6OpenModal("🪺 enちゃんの巣（見に行ったらいる育成ルーム）", `
    <div style="text-align:center;padding:8px 0;">
      <div style="font-size:3.4rem;margin-bottom:6px;">${icon}</div>
      <h3>${escapeHtml(v6.enMeta.enType)}（Lv.${lv}）</h3>
      <span class="stage-pill">${stage}</span>
      <p class="card-desc" style="margin-top:10px;">現在経験値：<strong>${exp}pt</strong></p>
      <button id="v6CareEnBtn" type="button" class="btn btn-primary btn-sm">🌱 声をかけて育てる（+10pt）</button>
    </div>
  `);
  document.getElementById("v6CareEnBtn").onclick = () => {
    v6GainExp(10); v6AddNenrin("🪺 enちゃんの巣でお世話", `経験値が ${v6.enMeta.enExp}pt になりました`);
    v6OpenNestModal(); v6RenderHomeDashboard(); showToast("🥚 enちゃんが喜んでいます！（+10pt）");
  };
}

function v6OpenMeishiModal() {
  const fCnt = v6.friends.filter(f => f.isFriend).length;
  v6OpenModal("🪪 デジタル名刺・専用❓QR・友達", `
    <div class="v6-between" style="margin-bottom:10px;">
      <div class="card-mode-switch" id="v6ModalCardMode">
        <button type="button" class="${state.cardMode === "pre" ? "active" : ""}" data-mode="pre">👀 マッチ前</button>
        <button type="button" class="${state.cardMode === "post" ? "active" : ""}" data-mode="post">🤝 マッチ後</button>
      </div>
      <button type="button" class="btn btn-outline btn-sm" onclick="v6CloseModal();goStep(1);switchView('register');">名刺を編集</button>
    </div>
    <div class="business-card" style="margin-bottom:12px;">${buildBusinessCardHTML(state.profile, state.cardMode)}</div>
    <div class="v6-between" style="margin-bottom:8px;">
      <strong style="font-size:0.9rem;">🤝 友達リスト（${fCnt}人）</strong>
      <button id="v6ScanQrTestBtn" type="button" class="btn btn-primary btn-sm">📷 対面❓QR読込テスト</button>
    </div>
    <div class="v6-stack">
      ${v6.friends.map(f => `
        <div class="friend-row">
          <div><strong style="font-size:0.84rem;">${escapeHtml(f.name)}</strong> <span class="mini-note">${escapeHtml(f.role)}</span><div class="mini-note">${escapeHtml(f.bio)}</div></div>
          <button type="button" class="btn ${f.isFriend ? "btn-outline" : "btn-primary"} btn-sm" data-v6-toggle-friend="${f.id}">${f.isFriend ? "友達済" : "＋友達登録"}</button>
        </div>
      `).join("")}
    </div>
  `);
  document.getElementById("v6ModalCardMode").onclick = (e) => {
    const b = e.target.closest("[data-mode]");
    if (!b) return;
    state.cardMode = b.dataset.mode; syncCardModeButtons(); v6OpenMeishiModal();
  };
  document.getElementById("v6ScanQrTestBtn").onclick = () => v6OpenQrScanModal();
}

function v6OpenQrScanModal() {
  v6OpenModal("📷 対面❓QRコード読み込みテスト", `
    <div class="card card-soft" style="margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <div style="width:44px;height:44px;border-radius:10px;background:var(--green);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:800;">❓</div>
        <div><strong>京都・宇治茶ファーム 佐々木</strong><div class="mini-note">つなぎツバメ型 ／ 🌾 茶農家（京都府 宇治市）</div></div>
      </div>
      <p class="mini-note">「一番茶の選別落ち茶葉があります！小ロット焼菓子やラテのコラボ募集中です。」</p>
    </div>
    <button id="v6ConfirmQrBtn" type="button" class="btn btn-primary btn-full">🤝 ワンタップで友達登録する</button>
  `);
  document.getElementById("v6ConfirmQrBtn").onclick = () => {
    const hit = v6.friends.find(f => f.id === "fr-qr-sasaki");
    if (hit) hit.isFriend = true;
    else v6.friends.unshift({ id: "fr-qr-sasaki", name: "京都・宇治茶ファーム 佐々木", role: "🌾 素材・つくる", area: "京都府 宇治市", bio: "一番茶の選別落ち茶葉コラボ募集中", isFriend: true });
    v6GainExp(10); v6AddNenrin("🤝 対面❓QRで友達登録", "京都・宇治茶ファーム 佐々木さんとつながりました");
    v6OpenMeishiModal(); showToast("🤝 ❓QRから友達登録が完了しました！");
  };
}

function v6OpenNenrinModal() {
  v6OpenModal("🪵 年輪（これまでの歩み・ご縁の記録）", `
    <p class="mini-note" style="margin-bottom:10px;">EN•joyで積み上げた企画・巣立ち・ご縁が年輪のように刻まれていきます。</p>
    <div class="nenrin-timeline">
      ${v6.nenrin.map(n => `<div class="nenrin-item"><strong>${escapeHtml(n.title)}</strong> <span class="mini-note">${escapeHtml(n.date)}</span><div class="mini-note">${escapeHtml(n.detail)}</div></div>`).join("")}
    </div>
  `);
}

function v6OpenHomeCustomModal() {
  v6OpenModal("⚙️ ホーム画面カスタマイズ", `
    <strong style="font-size:0.84rem;">① 上部の数字ボックス（最大3つ選択）</strong>
    <div class="chip-group chip-group-sm" style="margin:8px 0 14px;">
      ${ENJOY_V6_DATA.homeStatCatalog.map(s => `<button type="button" class="select-chip ${v6.homeConfig.stats.includes(s.id) ? "selected" : ""}" data-v6-cust-stat="${s.id}">${escapeHtml(s.label)}</button>`).join("")}
    </div>
    <strong style="font-size:0.84rem;">② 下部のマイ・インデックス棚（追加・削除）</strong>
    <div class="v6-stack" style="margin:8px 0 14px;">
      ${ENJOY_V6_DATA.homeIndexCatalog.map(ix => `<label class="friend-row" style="cursor:pointer;"><div><strong style="font-size:0.82rem;">${escapeHtml(ix.label)}</strong><div class="mini-note">${escapeHtml(ix.desc)}</div></div><input type="checkbox" data-v6-cust-idx="${ix.id}" ${v6.homeConfig.indexes.includes(ix.id) ? "checked" : ""} /></label>`).join("")}
    </div>
    <button type="button" class="btn btn-primary btn-full" onclick="v6CloseModal()">完了</button>
  `);
}

function v6OpenSettingsModal() {
  v6OpenModal("⚙️ 設定", `
    <div class="v6-stack">
      <button type="button" class="btn btn-primary" onclick="v6CloseModal();goStep(1);switchView('register');">✨ 5ステップ登録・名刺編集</button>
      <button type="button" class="btn btn-outline" onclick="v6CloseModal();goStep(4);switchView('register');">🧠 仕事性格診断をやり直す</button>
      <button type="button" class="btn btn-outline" onclick="v6OpenMeishiModal();">🪪 マイ名刺・専用❓QR・友達管理</button>
    </div>
  `);
}

function v6OpenContactModal() {
  v6OpenModal("✉️ お問い合わせ・テスト感想", `
    <div class="v6-between" style="margin-bottom:6px;"><span class="mini-note">使いにくかった箇所・欲しい機能</span><button type="button" class="btn-sample-fill" onclick="document.getElementById('v6ContactTxt').value='5ステップの仕事性格診断と入力欄の色が見やすくて良かった！';">✨ 入力例</button></div>
    <textarea id="v6ContactTxt" class="text-area" rows="3" placeholder="テストの感想を自由にどうぞ..."></textarea>
    <button type="button" class="btn btn-primary btn-full" style="margin-top:8px;" onclick="const t=document.getElementById('v6ContactTxt').value.trim();if(t){if(typeof v6LogAction==='function')v6LogAction('お問い合わせ',t);v6CloseModal();showToast('✉️ 感想を記録しました！');}">送信する</button>
  `);
}

function v6RenderEnDiagChips() {
  const el = document.getElementById("v6EnDiagChips");
  if (!el) return;
  el.innerHTML = ENJOY_V6_DATA.enTypes.map(t => `
    <button type="button" class="select-chip ${v6.enMeta.enType === t.label ? "selected" : ""}"
      data-v6-entype="${escapeHtml(t.label)}" data-v6-encolor="${t.color}" title="${escapeHtml(t.desc)}">
      🐣 ${escapeHtml(t.label)}
    </button>
  `).join("");
}

/* ==================== Part 1 UI注入（ヘッダー整理・5ステップ構築・開発フロートタブ） ==================== */
function v6InitPart1UI() {
  // 1. ヘッダーから開発用ボタンを撤去（格納式フロートタブへ完全集約し、サイト本来の見た目を綺麗に保つ）
  ["toggleZoneBtn", "toggleMobileBtn", "resetToStartBtn"].forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });

  // ユーザー向けアイコン（🪺enちゃんの巣・🪪名刺QR）だけスッキリ配置
  const ctrls = document.querySelector(".header-controls");
  if (ctrls && !document.getElementById("v6NestBtn")) {
    const nestBtn = document.createElement("button");
    nestBtn.id = "v6NestBtn"; nestBtn.type = "button";
    nestBtn.className = `chip-btn v6-nest-dot ${v6.enMeta.hasNotify ? "has-notify" : ""}`;
    nestBtn.title = "enちゃんの巣"; nestBtn.textContent = "🪺";
    nestBtn.onclick = () => v6OpenNestModal();

    const cardBtn = document.createElement("button");
    cardBtn.id = "v6MeishiBtn"; cardBtn.type = "button";
    cardBtn.className = "chip-btn"; cardBtn.title = "マイ名刺・専用❓QR・友達"; cardBtn.textContent = "🪪";
    cardBtn.onclick = () => v6OpenMeishiModal();

    const openReg = document.getElementById("openRegBtn");
    ctrls.insertBefore(nestBtn, openReg);
    ctrls.insertBefore(cardBtn, openReg);
  }

  // 2. 4ステップ → 5ステップへ変換（既存panel 4をpanel 5へ移し、間に新規panel 4「仕事性格診断」を挿入）
  const origPanel4 = document.querySelector('.step-panel[data-panel="4"]');
  if (origPanel4 && !document.getElementById("v6WorkDiagPanel")) {
    origPanel4.dataset.panel = "5";
    const backBtn = origPanel4.querySelector('[data-prev="3"]');
    if (backBtn) backBtn.dataset.prev = "4";

    const workDiagPanel = document.createElement("div");
    workDiagPanel.id = "v6WorkDiagPanel";
    workDiagPanel.className = "step-panel";
    workDiagPanel.dataset.panel = "4";
    origPanel4.parentNode.insertBefore(workDiagPanel, origPanel4);
  }

  // Step 1〜3・Step 5へ「✨ 入力イメージ」ボタンを配置（確実なセレクタで修正済）
  const addSample = (sel, id, fn) => {
    const el = document.querySelector(sel);
    if (!el || document.getElementById(id)) return;
    const b = document.createElement("button");
    b.id = id; b.type = "button"; b.className = "btn-sample-fill"; b.style.marginTop = "6px";
    b.textContent = "✨ 入力イメージを入れる";
    b.onclick = fn;
    el.appendChild(b);
  };
  addSample('.step-panel[data-panel="1"] .reg-step-head', "v6RS1", () => {
    state.profile.mainRole = "material"; state.profile.userStage = "maker";
    saveProfile(); renderRoleTiles(); renderStep2Content(); renderStep3ByStage(); renderStep4AccountUI();
    showToast("✨ Step 1 の入力イメージをセットしました");
  });
  addSample('.step-panel[data-panel="2"] .reg-step-head', "v6RS2", () => {
    if (!state.profile.mainRole) state.profile.mainRole = "material";
    state.profile.activities = ["果樹・フルーツ", "規格外品の提供", "マルシェ出店"];
    state.profile.subRoles = ["deliver"]; state.profile.userStage = "maker";
    saveProfile(); renderStep2Content(); renderStep3ByStage(); renderStep4AccountUI();
    showToast("✨ Step 2 の入力イメージをセットしました");
  });
  addSample('.step-panel[data-panel="3"] .reg-step-head', "v6RS3", () => {
    state.profile.capacityTags = ["週30〜50kgまで供給可", "規格外・B品の定期提供OK"];
    state.profile.capacity = "完熟みかんを季節ごとに週50kgまで提供できます";
    state.profile.pride = "糖度14度以上の減農薬みかんを家族で丁寧に育てています。";
    state.profile.secretPride = "試作1回目の規格外B品は材料実費のみで提供OKです！";
    v6.enMeta.enType = "開拓ハチドリ型"; v6.enMeta.enColor = "#3D664A";
    saveProfile(); v6SaveAll(); syncFormFromProfile(); renderStep3ByStage(); v6RenderEnDiagChips();
    showToast("✨ Step 3 の入力イメージをセットしました");
  });

  // Step 5（基本プロフィール）：#displayNameInput が属する .card の .card-title を確実に取得
  const dispCard = document.getElementById("displayNameInput")?.closest(".card");
  const s5Title = dispCard?.querySelector(".card-title");
  if (s5Title && !document.getElementById("v6RS5")) {
    const w = document.createElement("div"); w.className = "v6-between"; w.style.marginBottom = "8px";
    s5Title.parentNode.insertBefore(w, s5Title); w.appendChild(s5Title);
    const b = document.createElement("button"); b.id = "v6RS5"; b.type = "button"; b.className = "btn-sample-fill"; b.textContent = "✨ 入力イメージ";
    b.onclick = () => {
      state.profile.displayName = "ねやがわ農園 佐藤"; state.profile.ageGroup = "30代"; state.profile.exactAge = "36";
      state.profile.area = "大阪府 寝屋川市 香里園"; state.profile.profileBio = "寝屋川で旬の果物を栽培中！規格外フルーツの小瓶ジャムコラボ募集中。";
      state.profile.companyName = "ねやがわ農園"; state.profile.phone = "090-1234-5678";
      v6.enMeta.enSeed = "SATO-" + Date.now();
      saveProfile(); v6SaveAll(); syncFormFromProfile(); renderAgeGroups();
      document.getElementById("displayNameInput")?.classList.remove("input-error");
      document.getElementById("displayNameErrorMsg")?.classList.add("hidden");
      showToast("✨ Step 5 の入力イメージをセットしました");
    };
    w.appendChild(b);
  }

  // Step 3の下部バーを「enちゃんタイプ（専用❓QR用）」へ差し替え（仕事性格診断はStep 4に独立）
  const diagBar = document.querySelector(".diag-mini-bar");
  if (diagBar && !document.getElementById("v6EnDiagBox")) {
    const box = document.createElement("div");
    box.id = "v6EnDiagBox"; box.className = "field-group"; box.style.marginTop = "12px";
    box.innerHTML = `
      <div class="v6-between"><strong style="font-size:0.84rem;">🐣 マイenちゃんタイプ（専用❓QR用・任意）</strong><span class="status-tag">テスト版：❓表記</span></div>
      <p class="mini-note" style="margin:3px 0 8px;">対面友達登録用の専用❓QRに反映されます（仕事性格診断は次のステップ4で行います）。</p>
      <div id="v6EnDiagChips" class="chip-group chip-group-sm" style="margin-bottom:0;"></div>
    `;
    diagBar.replaceWith(box);
    v6RenderEnDiagChips();
  }

  // 3. ホーム画面を初回1画面収まり設計へ切替
  const homeSec = document.getElementById("view-home");
  if (homeSec && !document.getElementById("v6HomeRoot")) {
    homeSec.querySelector(".home-grid")?.classList.add("hidden");
    const hr = document.createElement("div"); hr.id = "v6HomeRoot"; homeSec.appendChild(hr);
  }

  // 4. つぶやき4タブ＋友達＆モーダル拡張
  document.getElementById("openFeedPostBtn")?.classList.add("hidden");
  const fBar = document.getElementById("feedFilterBar");
  if (fBar) {
    fBar.innerHTML = `
      <button type="button" class="filter-chip active" data-feedfilter="all">✨ すべて</button>
      <button type="button" class="filter-chip" data-feedfilter="rescue">🆘 SOS</button>
      <button type="button" class="filter-chip" data-feedfilter="behind">🛠️ 開発の裏側</button>
      <button type="button" class="filter-chip" data-feedfilter="voice">🛒 みんなの声</button>
      <button type="button" class="filter-chip" data-feedfilter="friends">🤝 友達のみ</button>
    `;
  }
  const fSw = document.getElementById("feedTypeSwitch");
  if (fSw && !fSw.dataset.v6Ready) {
    fSw.dataset.v6Ready = "1";
    fSw.style.gridTemplateColumns = "repeat(3, 1fr)";
    fSw.innerHTML = `
      <button type="button" class="seg-btn active" data-feedtype="voice">🛒 みんなの声</button>
      <button type="button" class="seg-btn" data-feedtype="rescue">🆘 SOS</button>
      <button type="button" class="seg-btn" data-feedtype="behind">🛠️ 開発の裏側</button>
    `;
    state.feedPostType = "voice";
    const fForm = document.getElementById("feedPostForm");
    if (fForm && !document.getElementById("v6FeedExtraFields")) {
      const ex = document.createElement("div"); ex.id = "v6FeedExtraFields";
      ex.innerHTML = `
        <div id="v6FeedSosFields" class="two-col-fields hidden" style="margin-bottom:10px;">
          <div><label class="field-label">⏰ 期限</label><input id="v6SosDeadline" class="text-input" type="text" placeholder="例：あと3日・今週中" /></div>
          <div><label class="field-label">📦 目安量</label><input id="v6SosAmount" class="text-input" type="text" placeholder="例：約40kg" /></div>
        </div>
        <label class="check-row" style="margin:0 0 12px;"><input id="v6FeedShareSnsChk" type="checkbox" /><span>📤 投稿後に X / Instagram へ同時シェアする</span></label>
      `;
      fForm.insertBefore(ex, fForm.querySelector('button[type="submit"]'));
    }
    fSw.addEventListener("click", (e) => {
      const b = e.target.closest("[data-feedtype]");
      if (b) document.getElementById("v6FeedSosFields")?.classList.toggle("hidden", b.dataset.feedtype !== "rescue");
    });
    const fHead = document.querySelector("#feedPostModal .modal-head h3");
    if (fHead && !document.getElementById("v6FeedSampleBtn")) {
      const sb = document.createElement("button"); sb.id = "v6FeedSampleBtn"; sb.type = "button"; sb.className = "btn-sample-fill"; sb.textContent = "✨ 入力例";
      sb.onclick = () => {
        state.feedPostType = "rescue";
        fSw.querySelectorAll(".seg-btn").forEach(b => b.classList.toggle("active", b.dataset.feedtype === "rescue"));
        document.getElementById("v6FeedSosFields")?.classList.remove("hidden");
        document.getElementById("v6SosDeadline").value = "あと3日";
        document.getElementById("v6SosAmount").value = "約15kg";
        document.getElementById("feedTextInput").value = "雨上がりで少し不揃いな完熟いちごが15kg！甘さは抜群なのでジャム試作や店頭販売で助けてください🍓";
      };
      fHead.after(sb);
    }
    document.getElementById("feedPostForm")?.addEventListener("submit", () => {
      setTimeout(() => {
        const latest = state.feeds[0];
        if (!latest) return;
        latest.deadline = document.getElementById("v6SosDeadline")?.value.trim() || "";
        latest.amount = document.getElementById("v6SosAmount")?.value.trim() || "";
        saveFeedsSafely(); renderFeedView();
        if (document.getElementById("v6FeedShareSnsChk")?.checked) v6OpenSnsShareModal(latest.id);
      }, 80);
    });
  }

  // 5. 開発用フロートタブ・右下FAB・プレビュー・ヒートマップ・共通モーダルをbodyへ追加
  if (!document.getElementById("v6OverlaysRoot")) {
    const root = document.createElement("div");
    root.id = "v6OverlaysRoot";
    root.innerHTML = `
      <div id="v6DevDock" class="v6-dev-dock"></div>
      <button id="v6FabBtn" type="button" class="v6-fab hidden">🥚＋ 企画</button>
      <div id="v6PeekOverlay" class="peek-overlay hidden"><div id="v6PeekCard" class="peek-card"></div></div>
      <div id="v6HeatmapLayer" class="heatmap-layer hidden"></div>
      <div id="v6GenericModal" class="modal-backdrop hidden">
        <div class="modal-card modal-lg">
          <div class="modal-head">
            <h3 id="v6ModalTitle">タイトル</h3>
            <button type="button" class="icon-close" id="v6CloseModalBtn">✕</button>
          </div>
          <div id="v6ModalBody"></div>
        </div>
      </div>
    `;
    document.body.appendChild(root);
    document.getElementById("v6CloseModalBtn").onclick = () => v6CloseModal();
    document.getElementById("v6GenericModal").onclick = (e) => { if (e.target.id === "v6GenericModal") v6CloseModal(); };
  }

  v6RenderDevDock();
  if (state.activeView === "register") goStep(state.step || 1);
}

// Part 1 イベント委譲
document.addEventListener("DOMContentLoaded", () => {
  v6InitPart1UI();

  document.body.addEventListener("click", (e) => {
    const t = e.target;

    // 格納式・開発フロートタブ操作
    if (t.closest("#v6DevHandleBtn") || t.closest("#v6DevCloseBtn")) { v6.devOpen = !v6.devOpen; v6RenderDevDock(); return; }
    if (t.closest("#v6DevModeInit")) { v6SwitchSiteMode("initial"); return; }
    if (t.closest("#v6DevModeMature")) { v6SwitchSiteMode("mature"); return; }
    if (t.closest("#v6DevToggleMobile")) { document.body.classList.toggle("mobile-preview"); v6RenderDevDock(); return; }
    if (t.closest("#v6DevToggleZones")) { document.body.classList.toggle("show-zones"); v6RenderDevDock(); return; }
    if (t.closest("#v6DevOpenLogs")) { v6.devOpen = false; v6RenderDevDock(); if (typeof v6OpenLogsModal === "function") v6OpenLogsModal(); return; }
    if (t.closest("#v6DevResetMode")) {
      if (confirm("現在のモードのテストデータをすべて初期化して最初からやり直しますか？")) {
        EnjoyStore.clearCurrentMode(); location.reload();
      }
      return;
    }

    // Step 4 仕事性格診断の回答・15項目開閉・入力イメージ・ステップ移動
    const goSt = t.closest("[data-v6-gostep]");
    if (goSt) { goStep(Number(goSt.dataset.v6Gostep)); return; }
    const wqBtn = t.closest("[data-v6-wq]");
    if (wqBtn) {
      const [qid, oid] = wqBtn.dataset.v6Wq.split("|");
      v6.workDiag.quick = v6.workDiag.quick || {};
      v6.workDiag.quick[qid] = oid;
      v6SaveAll(); v6RenderWorkDiagPanel();
      return;
    }
    const wdBtn = t.closest("[data-v6-wd]");
    if (wdBtn) {
      const [did, val] = wdBtn.dataset.v6Wd.split("|");
      v6.workDiag.detail = v6.workDiag.detail || {};
      v6.workDiag.detail[did] = Number(val);
      v6SaveAll(); v6RenderWorkDiagPanel();
      return;
    }
    if (t.closest("#v6ToggleDetailDiagBtn")) {
      v6.workDiag.detailOpen = !v6.workDiag.detailOpen;
      v6SaveAll(); v6RenderWorkDiagPanel();
      return;
    }
    if (t.closest("#v6RS4Diag")) {
      v6.workDiag.quick = { wq1: "a", wq2: "a", wq3: "a", wq4: "a" };
      v6.workDiag.detail = { wd01: 2, wd03: 2, wd05: 2, wd08: 2, wd11: 2, wd13: 2 };
      v6SaveAll(); v6RenderWorkDiagPanel();
      showToast("✨ Step 4 仕事性格診断の入力イメージをセットしました");
      return;
    }

    // enちゃんタイプ選択（Step 3）
    const enBtn = t.closest("[data-v6-entype]");
    if (enBtn) {
      v6.enMeta.enType = enBtn.dataset.v6Entype;
      v6.enMeta.enColor = enBtn.dataset.v6Encolor;
      v6.enMeta.enSeed = `${state.profile.displayName || "ENJOY"}-${v6.enMeta.enType}`;
      v6SaveAll(); v6RenderEnDiagChips(); renderBusinessCards();
      showToast(`🐣 「${v6.enMeta.enType}」の専用❓QRを発行しました`);
      return;
    }

    // ホーム数字ボックス・インデックス・フッター
    const stOpen = t.closest("[data-v6-stat-open]");
    if (stOpen) { v6.activeStatDrawer = (v6.activeStatDrawer === stOpen.dataset.v6StatOpen) ? null : stOpen.dataset.v6StatOpen; v6RenderHomeDashboard(); return; }
    if (t.closest("#v6CloseStatDrawer")) { v6.activeStatDrawer = null; v6RenderHomeDashboard(); return; }
    if (t.closest("#v6OpenHomeCustomBtn") || t.closest("#v6ManageIndexBtn")) { v6OpenHomeCustomModal(); return; }
    if (t.closest("#v6FootSettings")) { v6OpenSettingsModal(); return; }
    if (t.closest("#v6FootNenrin")) { v6OpenNenrinModal(); return; }
    if (t.closest("#v6FootContact")) { v6OpenContactModal(); return; }

    if (t.closest("[data-v6-go-offers]")) {
      state.enMode = "offers";
      document.querySelectorAll("#enModeTabs button").forEach(b => b.classList.toggle("active", b.dataset.enmode === "offers"));
      switchView("en");
      return;
    }
    if (t.closest("[data-v6-go-feed-sos]")) {
      state.feedFilter = "rescue";
      document.querySelectorAll("#feedFilterBar button").forEach(b => b.classList.toggle("active", b.dataset.feedfilter === "rescue"));
      switchView("feed");
      return;
    }

    const rmIdx = t.closest("[data-v6-remove-idx]");
    if (rmIdx) {
      v6.homeConfig.customized = true;
      v6.homeConfig.indexes = v6.homeConfig.indexes.filter(x => x !== rmIdx.dataset.v6RemoveIdx);
      v6SaveAll(); v6RenderHomeDashboard();
      return;
    }
    const cStat = t.closest("[data-v6-cust-stat]");
    if (cStat) {
      const sid = cStat.dataset.v6CustStat;
      v6.homeConfig.customized = true;
      if (v6.homeConfig.stats.includes(sid)) {
        if (v6.homeConfig.stats.length > 1) v6.homeConfig.stats = v6.homeConfig.stats.filter(x => x !== sid);
      } else {
        if (v6.homeConfig.stats.length >= 3) { showToast("数字ボックスは最大3つまで選べます"); return; }
        v6.homeConfig.stats.push(sid);
      }
      v6SaveAll(); v6RenderHomeDashboard(); v6OpenHomeCustomModal();
      return;
    }

    // 友達トグル
    const fBtn = t.closest("[data-v6-toggle-friend]");
    if (fBtn) {
      const f = v6.friends.find(x => x.id === fBtn.dataset.v6ToggleFriend);
      if (f) { f.isFriend = !f.isFriend; v6SaveAll(); v6OpenMeishiModal(); renderFeedView(); showToast(f.isFriend ? `🤝 ${f.name}さんと友達になりました！` : `${f.name}さんを解除しました`); }
      return;
    }

    // つぶやき操作
    const fReact = t.closest("[data-v6-feed-react]");
    if (fReact) {
      const [fid, field] = fReact.dataset.v6FeedReact.split("|");
      const f = state.feeds.find(x => x.id === fid);
      if (f) { f[field] = (f[field] || 0) + 1; saveFeedsSafely(); renderFeedView(); }
      return;
    }
    const sosLab = t.closest("[data-v6-sos-to-lab]");
    if (sosLab) {
      const f = state.feeds.find(x => x.id === sosLab.dataset.v6SosToLab);
      if (f) createProjectFromSource({ title: `【SOS】${f.text.slice(0, 14)}…`, goal: f.text, area: f.area, kindTabs: ["規格外レスキュー", "新商品開発"], sourceAuthor: f.author, media: f.media });
      return;
    }
    if (t.closest("[data-v6-go-rescue]")) { v6.shopTab = "rescue"; switchView("shop"); showToast("🆘 SOS連動：レスキュー便へ移動しました！"); return; }
    const vToProj = t.closest("[data-v6-voice-to-proj]");
    if (vToProj) {
      const f = state.feeds.find(x => x.id === vToProj.dataset.v6VoiceToProj);
      if (f) {
        switchView("en"); openPostModal("project");
        document.getElementById("projTitle").value = "みんなの声から生まれた企画";
        document.getElementById("projGoal").value = f.text;
        showToast("🥚 みんなの声を企画フォームにセットしました！");
      }
      return;
    }
    const snsBtn = t.closest("[data-v6-sns-share]");
    if (snsBtn) { v6OpenSnsShareModal(snsBtn.dataset.v6SnsShare); return; }

    const jmp = t.closest("[data-v6-jump-room]");
    if (jmp) {
      const [pid, tab] = jmp.dataset.v6JumpRoom.split("|");
      openEnRoom(pid);
      if (typeof v6SwitchRoomTab === "function") v6SwitchRoomTab(tab || "room");
      return;
    }
  });

  document.body.addEventListener("change", (e) => {
    const cIdx = e.target.closest("[data-v6-cust-idx]");
    if (cIdx) {
      const id = cIdx.dataset.v6CustIdx;
      v6.homeConfig.customized = true;
      if (cIdx.checked && !v6.homeConfig.indexes.includes(id)) v6.homeConfig.indexes.push(id);
      if (!cIdx.checked) v6.homeConfig.indexes = v6.homeConfig.indexes.filter(x => x !== id);
      v6SaveAll(); v6RenderHomeDashboard();
    }
  });
});
// === v6_part1.js ここまで ===