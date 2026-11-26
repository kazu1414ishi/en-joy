/* =========================================================
   EN•joy v6.5 Part 2 (v6_part2.js)
   - switchView / renderAll の安全ラップ（旧localStorageでもクラッシュしない）
   - タブ連動右下FAB（🥚＋企画 / 🌱＋タネ / 🆘＋SOS出す / ✍️＋つぶやく）
   - EN•ラボ一覧（1行検索＆進行中案件からの自動抽出・多条件絞り込み）
   - EN•ラボの中（Googleマップ風4ボックスタブ・スワイプカレンダー・7種カスタムボード・全員OK公開多数決・任意やること＆元ネタワープ・ポップ切り抜き投稿）
   - 役立ち（50:50発掘登録）＆ ショップ（巣立ち・予約・レスキュー・50:50リンク交互切替）
   - タブ長押しうっすらプレビュー ＆ 行動ログ（5秒迷い検知・滞在時間・ヒートマップ・Discord送信）
========================================================= */

let v6SelectedClipIds = new Set();

/* ==================== 安全な全体レンダリング＆画面切替ラップ ==================== */
function v6RenderAll() {
  try {
    if (typeof v6RenderHomeDashboard === "function") v6RenderHomeDashboard();
    if (typeof v6RenderDevDock === "function") v6RenderDevDock();
    v6UpdateFab();
    v6RenderTipsPage();
    v6RenderShopPage();
    v6RenderHeatmap();
  } catch (err) {
    console.warn("v6RenderAll warning:", err);
  }
}

const _v5RenderWantsBase = renderWants;
renderWants = function () {
  const tEl = document.getElementById("wantTipsCount");
  const sEl = document.getElementById("wantShopCount");
  if (tEl) tEl.textContent = (state.wants && state.wants.tips) || 0;
  if (sEl) sEl.textContent = (state.wants && state.wants.shop) || 0;
};

const _v5RenderAllBase = renderAll;
renderAll = function () {
  _v5RenderAllBase();
  v6RenderAll();
};

const _v5SwitchViewBase = switchView;
switchView = function (viewName) {
  try {
    v6.logs = v6NormalizeLogs(v6.logs);
    const prevView = state.activeView || "register";
    const elapsed = Math.max(1, Math.round((Date.now() - (v6.screenEnteredAt || Date.now())) / 1000));
    v6.logs.screenTimeSec[prevView] = (v6.logs.screenTimeSec[prevView] || 0) + elapsed;
    v6.screenEnteredAt = Date.now();
  } catch (err) {
    console.warn("v6 timing warning:", err);
  }

  _v5SwitchViewBase(viewName);

  try {
    v6LogAction("画面切替", viewName);
    v6RenderAll();
  } catch (err) {
    console.warn("v6 post-switch warning:", err);
  }
};

/* ==================== 右下フロートボタン（FAB・タブ連動） ==================== */
function v6UpdateFab() {
  const fab = document.getElementById("v6FabBtn");
  if (!fab) return;
  const view = state.activeView;
  if (view !== "en" && view !== "feed") {
    fab.classList.add("hidden");
    return;
  }
  fab.classList.remove("hidden");
  if (view === "en") {
    fab.textContent = state.enMode === "offers" ? "🌱＋ タネ" : "🥚＋ 企画";
  } else {
    fab.textContent = state.feedFilter === "rescue" ? "🆘＋ SOS出す" : "✍️＋ つぶやく";
  }
}

/* ==================== EN•ラボ一覧（ネーミング統一・0件見本のみ・1行検索＆多条件絞り込み） ==================== */
function v6InjectEnLabListUI() {
  const h2 = document.querySelector("#view-en .en-header h2");
  if (h2) h2.textContent = "🧪 EN•ラボ";
  const sub = document.querySelector("#view-en .en-header .eyebrow");
  if (sub) sub.textContent = "共創・開発ルーム（2社から即スタートOK）";

  const revEnBtn = document.getElementById("revealGoEnBtn");
  if (revEnBtn) revEnBtn.textContent = "🧪 EN•ラボを見に行く";

  document.getElementById("openPostModalBtn")?.classList.add("hidden");

  const modeTabs = document.getElementById("enModeTabs");
  if (modeTabs) {
    modeTabs.innerHTML = `
      <button type="button" class="${state.enMode !== "offers" ? "active" : ""}" data-enmode="projects">🥚 en.プロジェクト</button>
      <button type="button" class="${state.enMode === "offers" ? "active" : ""}" data-enmode="offers">🌱 ひらめき・困りごと<br/><span style="font-size:0.66rem;font-weight:500;">このタネから何か生まれるかも</span></button>
    `;
  }

  const fBar = document.getElementById("enFilterBar");
  if (fBar && !document.getElementById("v6EnSearchWrap")) {
    const wrap = document.createElement("div");
    wrap.id = "v6EnSearchWrap";
    wrap.innerHTML = `
      <div class="v6-search-bar">
        <input id="v6EnSearchInput" class="text-input" type="search" placeholder="🔍 キーワード（みかん、ジャム、高槻など）" style="padding:8px 11px;font-size:0.84rem;" />
        <button id="v6OpenEnFilterBtn" type="button" class="btn btn-outline btn-sm" style="white-space:nowrap;">⚙️ 絞り込み</button>
      </div>
      <div id="v6EnActiveFilterChips" class="v6-active-filters"></div>
    `;
    fBar.replaceWith(wrap);
  }

  const offerTabs = document.getElementById("offerKindTabs");
  if (offerTabs && !offerTabs.querySelector('[value="こんなアイデア"]')) {
    const lbl = document.createElement("label");
    lbl.className = "check-chip";
    lbl.innerHTML = `<input type="checkbox" value="こんなアイデア" /> 💡 こんなアイデア`;
    offerTabs.appendChild(lbl);
  }

  // 投稿モーダルへ「✨ 入力例」ボタン追加
  const postHead = document.querySelector("#postModal .modal-head h3");
  if (postHead && !document.getElementById("v6PostSampleBtn")) {
    const sb = document.createElement("button");
    sb.id = "v6PostSampleBtn"; sb.type = "button"; sb.className = "btn-sample-fill"; sb.textContent = "✨ 入力例";
    sb.onclick = () => {
      document.getElementById("projTitle").value = "完熟いちごの無添加シロップ";
      document.getElementById("projGoal").value = "規格外いちごを炭酸割りや手土産になる150ml小瓶シロップに50本試作したい！";
      document.getElementById("projArea").value = "大阪府 寝屋川市";
      document.getElementById("projTag").value = "小ロット試作OK";
      document.getElementById("offerText").value = "【💡こんなアイデア】甘さ控えめで炭酸で割る「規格外いちごの大人シロップ」を関西のカフェで出してみたい！";
    };
    postHead.after(sb);
  }

  // ボトムナビ名称統一
  document.querySelectorAll("#bottomNav .nav-item").forEach(btn => {
    const t = btn.dataset.tab;
    const ico = btn.querySelector(".nav-icon");
    const lbl = btn.querySelector("span:last-child");
    if (t === "en") { if (ico) ico.textContent = "🧪"; if (lbl) lbl.textContent = "EN•ラボ"; }
    if (t === "tips" && lbl) lbl.textContent = "役立ち";
    if (t === "shop" && lbl) lbl.textContent = "ショップ";
  });
}

function v6RenderActiveFilterChips() {
  const box = document.getElementById("v6EnActiveFilterChips");
  if (!box) return;
  const f = v6.enFilters;
  const tags = [];
  if (f.role) tags.push({ key: "role", label: `募集:${f.role}` });
  if (f.stage) tags.push({ key: "stage", label: `進行:${f.stage}` });
  if (f.tag) tags.push({ key: "tag", label: `#${f.tag}` });
  if (f.area) tags.push({ key: "area", label: `📍${f.area}` });
  if (f.offerKind) tags.push({ key: "offerKind", label: `種別:${f.offerKind}` });
  box.innerHTML = tags.map(t => `<button type="button" class="v6-filter-tag" data-v6-clear-filter="${t.key}">${escapeHtml(t.label)} ✕</button>`).join("");
}

// 0件時は長い説明ボックスを出さず「点線イメージ見本カード1枚」だけスッキリ表示
renderProjectCards = function (container) {
  v6RenderActiveFilterChips();
  v6UpdateFab();
  const isZero = state.projects.length === 0;
  let list = isZero ? [state.sampleRoom] : [...state.projects];

  const q = (v6.enSearchQuery || "").trim().toLowerCase();
  const f = v6.enFilters;

  if (!isZero) {
    list = list.filter(p => {
      const pieces = normalizePieces(p.pieces);
      const openPieces = pieces.filter(x => x.status === "open");
      if (q && !`${p.title} ${p.goal} ${p.area} ${(p.kindTabs || []).join(" ")} ${p.tag || ""}`.toLowerCase().includes(q)) return false;
      if (f.role === "myrole") {
        const myR = [state.profile.mainRole, ...(state.profile.subRoles || [])];
        if (!openPieces.some(x => myR.includes(x.id))) return false;
      } else if (f.role && !openPieces.some(x => x.id === f.role)) return false;
      if (f.stage === "last1" && openPieces.length !== 1) return false;
      if (f.stage && f.stage !== "last1" && String(p.stage || 1) !== f.stage) return false;
      if (f.tag && !(p.kindTabs || []).includes(f.tag) && p.tag !== f.tag) return false;
      if (f.area && !(p.area || "").includes(f.area)) return false;
      return true;
    });
  }

  if (!list.length) {
    container.innerHTML = `<div class="empty-callout"><p>条件に一致するプロジェクトがありません。絞り込みを解除するか右下の「🥚＋ 企画」から新しく作れます。</p></div>`;
    return;
  }

  container.innerHTML = list.map(p => {
    const pieces = normalizePieces(p.pieces);
    const kindTags = (p.kindTabs || []).map(t => `<span class="kind-tag ${t.includes("レスキュー") ? "rescue" : ""}">${escapeHtml(t)}</span>`).join("");
    const appCount = (p.applicants || []).length;
    return `
      <article class="project-card ${p.isSample ? "sample-card" : ""}" data-open-room="${p.id}">
        ${p.isSample ? `<span class="sample-badge">✨ イメージ見本（タップで開発室を体験）</span>` : ""}
        ${appCount > 0 ? `<span class="sample-badge" style="background:var(--orange-soft);color:var(--orange);">👋 応募 ${appCount}件</span>` : ""}
        ${kindTags ? `<div class="proj-kind-tags">${kindTags}</div>` : ""}
        <h3 class="proj-title">${escapeHtml(p.title)}</h3>
        <p class="proj-goal">${escapeHtml(p.goal)}</p>
        ${renderMediaTag(p.media, "media-thumb-box")}
        <div class="room-pieces-list" style="margin-bottom:8px;">
          ${pieces.map(pc => `<span class="room-piece-chip ${pc.status}" style="font-size:0.7rem;padding:3px 8px;">${escapeHtml(pc.icon || "🧩")} ${escapeHtml(pc.label)}：${pc.status === "open" ? "募集" : "決定"}</span>`).join("")}
        </div>
        <div class="proj-meta">
          <span>📍 ${escapeHtml(p.area || "関西")}</span>
          <span>👏 応援 ${p.supportCount || 0}</span>
        </div>
      </article>
    `;
  }).join("");

  container.querySelectorAll("[data-open-room]").forEach(card => {
    card.addEventListener("click", () => openEnRoom(card.dataset.openRoom));
  });
};

renderOfferCards = function (container) {
  v6RenderActiveFilterChips();
  v6UpdateFab();
  const q = (v6.enSearchQuery || "").trim().toLowerCase();
  const f = v6.enFilters;

  const list = state.offers.filter(o => {
    if (q && !`${o.text} ${o.area} ${o.author}`.toLowerCase().includes(q)) return false;
    if (f.offerKind && !(o.kindTabs || []).includes(f.offerKind)) return false;
    if (f.area && !(o.area || "").includes(f.area)) return false;
    return true;
  });

  if (!list.length) {
    container.innerHTML = `<div class="empty-callout"><strong>🌱 ひらめき・困りごとのタネ（まだありません）</strong><p>右下の「🌱＋ タネ」から、余剰素材・困りごと・ひょんなアイデアを気軽に置いてみましょう！</p></div>`;
    return;
  }

  container.innerHTML = list.map(o => {
    const tags = (o.kindTabs || []).map(t => `<span class="kind-tag ${t.includes("困りごと") ? "rescue" : ""}">${escapeHtml(t)}</span>`).join("");
    return `
      <div class="offer-card-v2">
        ${tags ? `<div class="offer-tags">${tags}</div>` : ""}
        <div style="font-weight:700;font-size:0.92rem;white-space:pre-wrap;">${escapeHtml(o.text)}</div>
        ${renderMediaTag(o.media, "media-thumb-box")}
        <div class="mini-note">📍 ${escapeHtml(o.area || "関西")} ／ 👤 ${escapeHtml(o.author)}</div>
        <div class="offer-actions">
          <button type="button" class="btn btn-primary btn-sm" data-offer-to-proj="${o.id}">🧪 これでEN•ラボを立てる</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="showToast('👋 投稿者に興味ありを送りました！')">👋 興味あり</button>
        </div>
      </div>
    `;
  }).join("");

  container.querySelectorAll("[data-offer-to-proj]").forEach(btn => {
    btn.addEventListener("click", () => {
      const offer = state.offers.find(x => x.id === btn.dataset.offerToProj);
      if (offer) createProjectFromSource({ title: `${offer.text.slice(0, 15)}コラボ`, goal: offer.text, area: offer.area, kindTabs: offer.kindTabs || ["新商品開発"], sourceAuthor: offer.author, media: offer.media });
    });
  });
};

function v6OpenEnFilterModal() {
  const projs = v6AllProjects();
  const isOffers = state.enMode === "offers";
  const dynamicTags = Array.from(new Set(projs.flatMap(p => [...(p.kindTabs || []), p.tag].filter(Boolean))));
  const dynamicAreas = Array.from(new Set([...projs, ...state.offers].map(x => (x.area || "").split(/[\s ]+/)[0]).filter(Boolean)));

  if (isOffers) {
    const kinds = ["余剰素材", "困りごと", "こんなアイデア", "スキル・設備", "コラボ相手探し"];
    v6OpenModal("⚙️ ひらめき・困りごと 絞り込み", `
      <div class="field-group"><label class="field-label">種別で絞り込む</label><div class="chip-group">${kinds.map(k => `<button type="button" class="select-chip ${v6.enFilters.offerKind === k ? "selected" : ""}" data-v6-set-filter="offerKind|${escapeHtml(k)}">${escapeHtml(k)}</button>`).join("")}</div></div>
      <div class="field-group"><label class="field-label">エリア（投稿から自動抽出）</label><div class="chip-group">${dynamicAreas.map(a => `<button type="button" class="select-chip ${v6.enFilters.area === a ? "selected" : ""}" data-v6-set-filter="area|${escapeHtml(a)}">📍 ${escapeHtml(a)}</button>`).join("")}</div></div>
      <div style="display:flex;gap:8px;"><button type="button" class="btn btn-outline" id="v6ResetEnFilterBtn">リセット</button><button type="button" class="btn btn-primary" style="flex:1;" onclick="v6CloseModal()">この条件で表示</button></div>
    `);
  } else {
    const roleOpts = [{ id: "myrole", label: "✨ あなたの出番" }, { id: "material", label: "🌾 素材" }, { id: "make", label: "🍳 形にする" }, { id: "pack", label: "🎨 整える包む" }, { id: "deliver", label: "🏪 届ける試す" }];
    const stageOpts = [{ id: "last1", label: "🔥 あと1ピース" }, { id: "1", label: "Step 1 仲間あつめ" }, { id: "2", label: "Step 2 方向性" }, { id: "3", label: "Step 3 試作中" }];
    v6OpenModal("⚙️ en.プロジェクト 多条件絞り込み", `
      <div class="field-group"><label class="field-label">① 募集中のEN（役割）</label><div class="chip-group chip-group-sm">${roleOpts.map(r => `<button type="button" class="select-chip ${v6.enFilters.role === r.id ? "selected" : ""}" data-v6-set-filter="role|${r.id}">${r.label}</button>`).join("")}</div></div>
      <div class="field-group"><label class="field-label">② 進行ステージ</label><div class="chip-group chip-group-sm">${stageOpts.map(s => `<button type="button" class="select-chip ${v6.enFilters.stage === s.id ? "selected" : ""}" data-v6-set-filter="stage|${s.id}">${s.label}</button>`).join("")}</div></div>
      <div class="field-group"><label class="field-label">③ 企画タグ（進行中案件から自動抽出）</label><div class="chip-group chip-group-sm">${dynamicTags.map(tg => `<button type="button" class="select-chip ${v6.enFilters.tag === tg ? "selected" : ""}" data-v6-set-filter="tag|${escapeHtml(tg)}">#${escapeHtml(tg)}</button>`).join("")}</div></div>
      <div class="field-group"><label class="field-label">④ エリア（進行中案件から自動抽出）</label><div class="chip-group chip-group-sm">${dynamicAreas.map(ar => `<button type="button" class="select-chip ${v6.enFilters.area === ar ? "selected" : ""}" data-v6-set-filter="area|${escapeHtml(ar)}">📍 ${escapeHtml(ar)}</button>`).join("")}</div></div>
      <div style="display:flex;gap:8px;"><button type="button" class="btn btn-outline" id="v6ResetEnFilterBtn">リセット</button><button type="button" class="btn btn-primary" style="flex:1;" onclick="v6CloseModal()">この条件で表示</button></div>
    `);
  }
  document.getElementById("v6ResetEnFilterBtn").onclick = () => {
    v6.enFilters = { role: "", stage: "", tag: "", area: "", offerKind: "" };
    renderEnRoomList();
    v6OpenEnFilterModal();
  };
}

/* ==================== EN•ラボの中（Googleマップ風4タブ・スワイプカレンダー・7種カスタムボード） ==================== */
function v6InjectRoomDetailUI() {
  const roomSec = document.getElementById("view-en-room");
  if (!roomSec || document.getElementById("v6GmapTabs")) return;

  const topbar = roomSec.querySelector(".room-topbar");
  const modeSw = document.getElementById("roomViewModeSwitch");
  if (topbar && modeSw) {
    const grp = document.createElement("div");
    grp.style.cssText = "display:flex;gap:5px;align-items:center;";
    grp.innerHTML = `<button id="v6RoomInviteBtn" type="button" class="btn btn-outline btn-sm">＋招待</button><button id="v6RoomLineBtn" type="button" class="btn btn-outline btn-sm">LINE</button>`;
    topbar.insertBefore(grp, modeSw);
  }

  const gmapTabs = document.createElement("div");
  gmapTabs.id = "v6GmapTabs";
  gmapTabs.className = "v6-gmap-tabs";
  gmapTabs.innerHTML = `
    <button type="button" class="v6-gmap-tab active" data-v6-rtab="room">🏠 ルーム(仲間)</button>
    <button type="button" class="v6-gmap-tab" data-v6-rtab="talk">💬 トーク</button>
    <button type="button" class="v6-gmap-tab" data-v6-rtab="tools">🧰 役立ち</button>
    <button type="button" class="v6-gmap-tab" data-v6-rtab="todo">✅ やること</button>
  `;
  topbar.after(gmapTabs);

  const heroCard = roomSec.querySelector(".room-hero-card");
  const swipeWrap = document.createElement("div");
  swipeWrap.id = "v6RoomSwipeWrap";
  swipeWrap.className = "swipe-room-wrap";
  swipeWrap.innerHTML = `
    <div class="swipe-room-track" id="v6RoomSwipeTrack">
      <div class="swipe-room-slide" id="v6SlideSummarySlot"></div>
      <div class="swipe-room-slide">
        <div class="card" style="padding:14px;">
          <div class="v6-between" style="margin-bottom:4px;">
            <button id="v6BtnToSummary" type="button" class="btn btn-outline btn-sm" style="padding:3px 9px;font-size:0.74rem;">← 📌 企画まとめ</button>
            <span class="stage-pill">📅 ルームカレンダー（全集約）</span>
          </div>
          <div class="cal-legend">
            <span><i class="cal-dot todo"></i>やること</span>
            <span><i class="cal-dot road"></i>ロードマップ</span>
            <span><i class="cal-dot talk"></i>トーク</span>
            <span><i class="cal-dot vote"></i>多数決</span>
          </div>
          <div id="v6RoomCalList" class="cal-list"></div>
          <div class="cal-add-row">
            <input id="v6CalDate" class="text-input" type="date" style="padding:6px 8px;font-size:0.78rem;" />
            <input id="v6CalTitle" class="text-input" type="text" placeholder="予定を直接追加..." style="padding:6px 8px;font-size:0.78rem;" />
            <button id="v6CalAddBtn" type="button" class="btn btn-primary btn-sm">追加</button>
          </div>
        </div>
      </div>
    </div>
    <div class="swipe-dots" id="v6SwipeDots">
      <span class="swipe-dot active" data-rslide="0"></span>
      <span class="swipe-dot" data-rslide="1"></span>
    </div>
  `;
  heroCard.parentNode.insertBefore(swipeWrap, heroCard);
  document.getElementById("v6SlideSummarySlot").appendChild(heroCard);

  const stBadge = document.getElementById("roomStageBadge");
  if (stBadge) {
    const b = document.createElement("button");
    b.id = "v6BtnToCal"; b.type = "button"; b.className = "btn btn-outline btn-sm";
    b.style.cssText = "padding:3px 9px;font-size:0.74rem;margin-left:6px;"; b.textContent = "📅 予定 →";
    stBadge.after(b);
  }

  let sx = 0;
  swipeWrap.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
  swipeWrap.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (dx < -40 && v6.roomSwipeSlide === 0) v6SetRoomSwipe(1);
    if (dx > 40 && v6.roomSwipeSlide === 1) v6SetRoomSwipe(0);
  });

  document.getElementById("roomInnerTabs")?.classList.add("hidden");

  const roomTopSlot = document.createElement("div");
  roomTopSlot.id = "v6RoomOverviewPanels";
  swipeWrap.after(roomTopSlot);

  const toolsPanel = document.createElement("div");
  toolsPanel.id = "v6RoomPanelTools"; toolsPanel.className = "hidden";
  roomSec.appendChild(toolsPanel);

  const todoPanel = document.createElement("div");
  todoPanel.id = "v6RoomPanelTodo"; todoPanel.className = "hidden";
  roomSec.appendChild(todoPanel);

  const talkTab = document.getElementById("roomTabTalk");
  if (talkTab) {
    const clipBar = document.createElement("div");
    clipBar.id = "v6TalkClipBar"; clipBar.className = "card card-soft";
    clipBar.style.cssText = "padding:10px 12px;margin-top:8px;";
    clipBar.innerHTML = `
      <div class="v6-between">
        <span class="mini-note">💬 発言の「🫧切り抜き」を選ぶとPOPな吹き出し投稿が作れます（選択中: <strong id="v6ClipCnt">0</strong>件）</span>
        <button id="v6PublishClipBtn" type="button" class="btn btn-accent btn-sm">🎬 開発の裏側へ投稿</button>
      </div>
    `;
    talkTab.appendChild(clipBar);
  }
}

function v6SetRoomSwipe(idx) {
  v6.roomSwipeSlide = idx;
  const tr = document.getElementById("v6RoomSwipeTrack");
  if (tr) tr.style.transform = `translateX(-${idx * 100}%)`;
  document.querySelectorAll("#v6SwipeDots .swipe-dot").forEach((d, i) => d.classList.toggle("active", i === idx));
}

function v6SwitchRoomTab(tab) {
  state.roomInnerTab = tab;
  document.querySelectorAll("#v6GmapTabs .v6-gmap-tab").forEach(b => b.classList.toggle("active", b.dataset.v6Rtab === tab));
  renderActiveEnRoom();
}

const _v5OpenEnRoomBase = openEnRoom;
openEnRoom = function (projId) {
  _v5OpenEnRoomBase(projId);
  v6SelectedClipIds.clear();
  v6SetRoomSwipe(0);
  v6SwitchRoomTab("room");
};

const _v5RenderActiveEnRoomBase = renderActiveEnRoom;
renderActiveEnRoom = function () {
  _v5RenderActiveEnRoomBase();
  const proj = getProjectById(state.currentRoomId);
  if (!proj) return;

  const isInside = state.roomViewMode === "inside";
  const tab = state.roomInnerTab || "room";

  document.getElementById("v6GmapTabs")?.classList.toggle("hidden", !isInside);
  const showRoom = !isInside || tab === "room";
  const showTalk = isInside && tab === "talk";
  const showTools = isInside && tab === "tools";
  const showTodo = isInside && tab === "todo";

  document.getElementById("v6RoomSwipeWrap")?.classList.toggle("hidden", !showRoom);
  document.getElementById("v6RoomOverviewPanels")?.classList.toggle("hidden", !showRoom);
  document.getElementById("roomTabMembers")?.classList.toggle("hidden", !showRoom);
  document.getElementById("roomTabTalk")?.classList.toggle("hidden", !showTalk);
  document.getElementById("v6RoomPanelTools")?.classList.toggle("hidden", !showTools);
  document.getElementById("v6RoomPanelTodo")?.classList.toggle("hidden", !showTodo);

  v6RenderRoomCalendar(proj);
  if (showRoom) v6RenderRoomOverview(proj, isInside);
  if (showTalk) v6EnhanceTalkMessages(proj);
  if (showTools) v6RenderCustomBoardsPanel(proj);
  if (showTodo) v6RenderTodoPanel(proj);
};

function v6RenderRoomCalendar(proj) {
  const el = document.getElementById("v6RoomCalList");
  if (!el) return;
  const events = [];
  (proj.todos || []).forEach(t => { if (t.date) events.push({ date: t.date, type: "todo", title: t.title, tab: "todo", refId: t.id }); });
  (proj.votes || []).forEach(v => { if (v.deadline) events.push({ date: v.deadline, type: "vote", title: `投票締切：${v.title}`, tab: "tools", refId: "vote" }); });
  (proj.messages || []).forEach(m => { if (m.dateTag) events.push({ date: m.dateTag, type: "talk", title: `${m.sender}：${m.text.slice(0, 18)}…`, tab: "talk", refId: m.id }); });
  (proj.boards?.roadmap || []).forEach(r => { if (r.date) events.push({ date: r.date, type: "road", title: r.title, tab: "tools", refId: "roadmap" }); });
  (proj.calendarExtras || []).forEach(c => events.push({ date: c.date, type: c.type || "road", title: c.title, tab: c.sourceTab || "todo", refId: "" }));
  events.sort((a, b) => a.date.localeCompare(b.date));

  el.innerHTML = events.map(ev => `
    <div class="cal-item" data-v6-warp="${ev.tab}|${ev.refId || ""}">
      <div><i class="cal-dot ${ev.type}"></i><strong>${escapeHtml(ev.date.slice(5))}</strong> ${escapeHtml(ev.title)}</div>
      <span class="mini-note">元ネタへ →</span>
    </div>
  `).join("") || `<p class="mini-note">予定はまだありません（やること・ロードマップ・トーク・多数決から自動集約）</p>`;
}

function v6RenderRoomOverview(proj, isInside) {
  const slot = document.getElementById("v6RoomOverviewPanels");
  if (!slot) return;
  const votes = (proj.votes || []).filter(v => isInside || v.isPublic);
  const votesBlock = `
    <div class="card">
      <div class="v6-between" style="margin-bottom:6px;">
        <h3 class="card-title" style="margin:0;">🗳️ ${isInside ? "進行中の多数決" : "みんなで決める！（公開中の多数決）"}</h3>
        ${isInside ? `<button type="button" class="btn btn-outline btn-sm" onclick="v6SwitchRoomTab('tools')">＋ 多数決を追加</button>` : ""}
      </div>
      ${votes.length ? votes.map(v => v6RenderSingleVoteCard(proj, v, isInside)).join("") : `<p class="mini-note">${isInside ? "まだ多数決はありません。「＋ 多数決を追加」から作成できます。" : "現在一般公開中の多数決はありません。"}</p>`}
    </div>
  `;

  if (!isInside) {
    slot.innerHTML = `
      <div class="card" style="border:1.5px solid var(--orange);background:#FFFBF7;">
        <h3 class="card-title">👀 このプロジェクトを応援・参加する</h3>
        <p class="card-desc" style="margin-bottom:10px;">メンバー限定のトークや原価計算は非公開で保護されています。外から応援や参加リクエストを送れます！</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
          <button type="button" class="btn btn-outline btn-sm" id="v6OutsideCheerBtn">👏 応援する (${proj.supportCount || 0})</button>
          <button type="button" class="btn btn-accent btn-sm" id="v6OutsideJoinBtn2">👋 参加したい（興味あり）</button>
        </div>
        <div class="inline-add">
          <input id="v6OutsideMsgInp" class="text-input" type="text" placeholder="作り手へ応援メッセージを送る..." style="font-size:0.82rem;padding:7px 10px;" />
          <button id="v6OutsideMsgSendBtn" type="button" class="btn btn-primary btn-sm">送信</button>
        </div>
        ${(proj.supportMessages || []).length ? `<div class="v6-stack" style="margin-top:8px;">${proj.supportMessages.slice(0, 3).map(sm => `<div class="review-box" style="margin-top:0;"><strong>${escapeHtml(sm.author)}</strong>：${escapeHtml(sm.text)}</div>`).join("")}</div>` : ""}
      </div>
      ${votesBlock}
    `;
    document.getElementById("v6OutsideCheerBtn").onclick = () => {
      proj.supportCount = (proj.supportCount || 0) + 1;
      if (!v6.fanState.supports.includes(proj.id)) v6.fanState.supports.push(proj.id);
      saveProjectState(proj); v6SaveAll(); renderActiveEnRoom(); showToast("👏 プロジェクトに応援を送りました！");
    };
    document.getElementById("v6OutsideJoinBtn2").onclick = () => openInterestModal(proj.id, "");
    document.getElementById("v6OutsideMsgSendBtn").onclick = () => {
      const txt = document.getElementById("v6OutsideMsgInp").value.trim();
      if (!txt) return;
      proj.supportMessages = proj.supportMessages || [];
      proj.supportMessages.unshift({ author: getActiveSenderName(), text: txt, time: getNowTimeStr() });
      saveProjectState(proj); renderActiveEnRoom(); showToast("💬 応援メッセージを送りました！");
    };
    return;
  }

  const undone = (proj.todos || []).filter(t => !t.done).slice(0, 3);
  slot.innerHTML = `
    <div class="card">
      <div class="v6-between" style="margin-bottom:6px;">
        <h3 class="card-title" style="margin:0;">✅ いまの「やること」ダイジェスト</h3>
        <button type="button" class="btn btn-outline btn-sm" id="v6QuickAddTodoFromTopBtn">＋ 追加</button>
      </div>
      ${undone.length ? `<div class="v6-stack">${undone.map(t => `
        <div class="cal-item" data-v6-warp="${t.source?.tab || "todo"}|${t.source?.refId || t.id}">
          <div>${v6PrioBadgeHtml(t.priority)} <strong>${escapeHtml(t.title)}</strong></div>
          <span class="mini-note">${t.date ? escapeHtml(t.date.slice(5)) : "期限なし"} →</span>
        </div>
      `).join("")}</div>` : `<p class="mini-note">未完了のやることはありません。</p>`}
    </div>
    ${votesBlock}
  `;
  document.getElementById("v6QuickAddTodoFromTopBtn").onclick = () => v6OpenTodoRegisterModal("", { tab: "room", refId: "" });
}

function v6RenderSingleVoteCard(proj, v, isInside) {
  const total = (v.options || []).reduce((s, o) => s + (o.memberVotes || 0) + (o.fanVotes || 0), 0) || 1;
  const app = v.memberApproved || 1;
  const memTot = v.memberTotal || Math.max(2, (proj.members || []).length);
  return `
    <div class="card card-soft" style="padding:11px;margin-bottom:8px;">
      <div class="v6-between">
        <strong style="font-size:0.85rem;">${escapeHtml(v.title)}</strong>
        <span class="stage-pill">${v.isPublic ? "🌐 みんなに公開中" : `🔒 公開承認 ${app}/${memTot}人`}</span>
      </div>
      ${v.costNote ? `<div class="mini-note">参考：${escapeHtml(v.costNote)} ${v.url ? `／ <a href="${escapeHtml(v.url)}" target="_blank" rel="noopener">参考リンク</a>` : ""}</div>` : ""}
      ${(v.options || []).map(o => {
        const mV = o.memberVotes || 0, fV = o.fanVotes || 0, sum = mV + fV, pct = Math.round((sum / total) * 100);
        return `
          <button type="button" class="vote-opt-btn ${v.myChoice === o.id ? "selected" : ""}" data-v6-cast-vote="${v.id}|${o.id}">
            <div style="display:flex;justify-content:space-between;gap:6px;"><span>${escapeHtml(o.label)}</span><span style="white-space:nowrap;">${sum}票 (${pct}%)</span></div>
            <div class="mini-note" style="font-size:0.68rem;">メンバー ${mV}票 ／ 一般ファン ${fV}票</div>
            <div class="vote-bar"><i style="width:${pct}%"></i></div>
          </button>
        `;
      }).join("")}
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
        ${isInside && !v.isPublic ? `<button type="button" class="btn btn-outline btn-sm" data-v6-approve-pub="${v.id}">🌐 公開OKを押す（全員OKで一般公開）</button>` : ""}
        ${isInside ? `<button type="button" class="btn btn-outline btn-sm" data-v6-vote-to-todo="${v.id}">✅ やることへ登録</button>` : ""}
      </div>
    </div>
  `;
}

function v6EnhanceTalkMessages(proj) {
  const rows = document.querySelectorAll("#roomChatMessages .chat-row");
  rows.forEach((row, idx) => {
    const m = (proj.messages || [])[idx];
    if (!m || m.who === "sys") return;
    row.dataset.v6MsgId = m.id;
    const ft = row.querySelector(".chat-msg-footer");
    if (!ft || ft.dataset.v6Enhanced) return;
    ft.dataset.v6Enhanced = "1";

    const isReg = (proj.todos || []).some(t => t.source?.refId === m.id);
    const todoBtn = document.createElement("button");
    todoBtn.type = "button"; todoBtn.className = `pin-msg-btn ${isReg ? "pinned" : ""}`;
    todoBtn.dataset.v6MsgToTodo = m.id; todoBtn.textContent = isReg ? "✅ やること登録済" : "✅ やることへ登録";

    const dateBtn = document.createElement("button");
    dateBtn.type = "button"; dateBtn.className = `pin-msg-btn ${m.dateTag ? "pinned" : ""}`;
    dateBtn.dataset.v6MsgDate = m.id; dateBtn.textContent = m.dateTag ? `📅 ${m.dateTag.slice(5)}` : "📅 予定登録";

    const clipBtn = document.createElement("button");
    clipBtn.type = "button"; clipBtn.className = `pin-msg-btn ${v6SelectedClipIds.has(m.id) ? "pinned" : ""}`;
    clipBtn.dataset.v6ClipToggle = m.id; clipBtn.textContent = v6SelectedClipIds.has(m.id) ? "🫧 選択中" : "🫧 切り抜き";

    ft.append(todoBtn, dateBtn, clipBtn);
  });
  const cntEl = document.getElementById("v6ClipCnt");
  if (cntEl) cntEl.textContent = v6SelectedClipIds.size;
}

function v6OpenTodoRegisterModal(defaultTitle, source) {
  v6OpenModal("✅ やることへ登録（項目はすべて任意）", `
    <div class="field-group"><label class="field-label">やること内容</label><input id="v6TrTitle" class="text-input" type="text" value="${escapeHtml(defaultTitle)}" placeholder="やることを入力..." /></div>
    <div class="field-group"><label class="field-label">重要度（任意）</label><div class="chip-group chip-group-sm" id="v6TrPrioChips"><button type="button" class="select-chip" data-prio="high">🔴 高</button><button type="button" class="select-chip" data-prio="mid">🟡 中</button><button type="button" class="select-chip" data-prio="low">🟢 低</button></div></div>
    <div class="field-group"><label class="field-label">期日（任意・カレンダー自動反映）</label><input id="v6TrDate" class="text-input" type="date" /></div>
    <div class="field-group"><label class="field-label">コメント（任意）</label><input id="v6TrComment" class="text-input" type="text" placeholder="例：サンプル50個の見積もり確認、田中さん担当" /></div>
    <button id="v6TrSaveBtn" type="button" class="btn btn-primary btn-full">登録する（元ネタワープ付き）</button>
  `);
  let pickedPrio = "";
  document.getElementById("v6TrPrioChips").onclick = (e) => {
    const b = e.target.closest("[data-prio]");
    if (!b) return;
    pickedPrio = (pickedPrio === b.dataset.prio) ? "" : b.dataset.prio;
    document.querySelectorAll("#v6TrPrioChips .select-chip").forEach(c => c.classList.toggle("selected", c.dataset.prio === pickedPrio));
  };
  document.getElementById("v6TrSaveBtn").onclick = () => {
    const proj = getProjectById(state.currentRoomId);
    const title = document.getElementById("v6TrTitle").value.trim();
    if (!proj || !title) { showToast("内容を入力してください"); return; }
    proj.todos = proj.todos || [];
    proj.todos.unshift({ id: "td-" + Date.now(), title, priority: pickedPrio, date: document.getElementById("v6TrDate").value || "", comment: document.getElementById("v6TrComment").value.trim(), done: false, source: source || { tab: "room", refId: "" } });
    saveProjectState(proj); v6CloseModal(); renderActiveEnRoom();
    showToast("✅ やることへ登録しました！（元ネタワープ連携済み）");
  };
}

function v6PrioBadgeHtml(p) {
  if (p === "high") return `<span class="prio-pill prio-high">🔴 高</span>`;
  if (p === "mid") return `<span class="prio-pill prio-mid">🟡 中</span>`;
  if (p === "low") return `<span class="prio-pill prio-low">🟢 低</span>`;
  return "";
}

function v6RenderCustomBoardsPanel(proj) {
  const panel = document.getElementById("v6RoomPanelTools");
  if (!panel) return;
  if (!proj.boards) proj.boards = { active: ["calc", "vote"], concept: {}, roadmap: [], protos: [], calc: {} };
  const active = proj.boards.active || ["calc", "vote"];

  let cardsHtml = "";
  if (active.includes("calc")) cardsHtml += v6BuildCalcBoardHtml(proj);
  if (active.includes("vote")) {
    cardsHtml += `
      <div class="card" data-v6-board-id="vote">
        <div class="v6-between" style="margin-bottom:6px;"><h3 class="card-title" style="margin:0;">🗳️ 意思決定・多数決ボード</h3><button id="v6BoardVoteSample" type="button" class="btn-sample-fill">✨ 入力例</button></div>
        ${(proj.votes || []).map(v => v6RenderSingleVoteCard(proj, v, true)).join("")}
        <div class="field-group" style="margin-top:8px;margin-bottom:6px;"><input id="v6NewVoteTitle" class="text-input" type="text" placeholder="新しい議題..." /></div>
        <div class="two-col-fields" style="margin-bottom:6px;"><input id="v6NewVoteOpt1" class="text-input" type="text" placeholder="選択肢1" /><input id="v6NewVoteOpt2" class="text-input" type="text" placeholder="選択肢2" /></div>
        <div class="two-col-fields" style="margin-bottom:6px;"><input id="v6NewVoteUrl" class="text-input" type="url" placeholder="参考URL（任意）" /><input id="v6NewVoteDeadline" class="text-input" type="date" /></div>
        <button id="v6CreateVoteBtn" type="button" class="btn btn-accent btn-sm">多数決を作成</button>
      </div>
    `;
  }
  if (active.includes("concept")) {
    const c = proj.boards.concept || {};
    cardsHtml += `
      <div class="card" data-v6-board-id="concept">
        <div class="v6-between" style="margin-bottom:6px;"><h3 class="card-title" style="margin:0;">🧭 コンセプト1枚メモ</h3><span class="mini-note">自動保存</span></div>
        <div class="two-col-fields">
          <div><label class="field-label">誰に（ターゲット）</label><input class="text-input" data-v6-concept="target" value="${escapeHtml(c.target || "")}" placeholder="例：30〜50代手土産層" /></div>
          <div><label class="field-label">何を（強み）</label><input class="text-input" data-v6-concept="what" value="${escapeHtml(c.what || "")}" placeholder="例：無添加120g小瓶ジャム" /></div>
          <div><label class="field-label">いくらくらいで</label><input class="text-input" data-v6-concept="price" value="${escapeHtml(c.price || "")}" placeholder="例：880円" /></div>
          <div><label class="field-label">いつ売るか</label><input class="text-input" data-v6-concept="when" value="${escapeHtml(c.when || "")}" placeholder="例：来月の関西マルシェ" /></div>
        </div>
      </div>
    `;
  }
  if (active.includes("roadmap")) {
    const rms = proj.boards.roadmap || [];
    cardsHtml += `
      <div class="card" data-v6-board-id="roadmap">
        <div class="v6-between" style="margin-bottom:6px;"><h3 class="card-title" style="margin:0;">🗓️ かんたんロードマップ</h3><button id="v6RoadmapToTodosBtn" type="button" class="btn btn-outline btn-sm">✅ 一括でやることへ</button></div>
        <div class="v6-stack" style="margin-bottom:8px;">${rms.map(r => `<div class="todo-item ${r.done ? "done" : ""}"><span class="todo-title-txt">${escapeHtml(r.title)}</span><span class="stage-pill">${escapeHtml((r.date || "").slice(5))}</span></div>`).join("") || `<p class="mini-note">マイルストーンを追加してください</p>`}</div>
        <div class="cal-add-row"><input id="v6RmDate" class="text-input" type="date" style="padding:6px 8px;font-size:0.8rem;" /><input id="v6RmTitle" class="text-input" type="text" placeholder="工程（例：ラベル印刷入稿）" style="padding:6px 8px;font-size:0.8rem;" /><button id="v6RmAddBtn" type="button" class="btn btn-primary btn-sm">追加</button></div>
      </div>
    `;
  }
  if (active.includes("proto")) {
    const pts = proj.boards.protos || [];
    cardsHtml += `
      <div class="card" data-v6-board-id="proto">
        <h3 class="card-title" style="margin-bottom:6px;">🧪 試作レシピ履歴（v1 → v2）</h3>
        <div class="v6-stack" style="margin-bottom:8px;">${pts.map(pt => `<div class="review-box" style="margin-top:0;"><strong>${escapeHtml(pt.ver)}</strong>：${escapeHtml(pt.recipe)}<div class="mini-note">${escapeHtml(pt.memo)}</div></div>`).join("") || `<p class="mini-note">試作メモをバージョンごとに残せます</p>`}</div>
        <div class="two-col-fields" style="margin-bottom:6px;"><input id="v6PtRecipe" class="text-input" type="text" placeholder="配合（例：みかん500g・粗糖180g）" /><input id="v6PtMemo" class="text-input" type="text" placeholder="感想（例：糖度45%で最高！）" /></div>
        <button id="v6PtAddBtn" type="button" class="btn btn-primary btn-sm">＋ 試作バージョンを記録</button>
      </div>
    `;
  }
  if (active.includes("channel")) cardsHtml += v6BuildChannelCompareHtml(proj);
  if (active.includes("ai")) {
    cardsHtml += `
      <div class="card" data-v6-board-id="ai">
        <div class="v6-between" style="margin-bottom:6px;"><h3 class="card-title" style="margin:0;">✨ AIおすすめ枠（詰まりを溶かす相棒）</h3><span class="stage-pill">リサーチDB連動</span></div>
        <div class="v6-stack">${ENJOY_V6_DATA.aiSuggestions.map(ai => `<div class="review-box" style="margin-top:0;"><div class="v6-between"><strong>${escapeHtml(ai.title)}</strong><span class="kind-tag">${escapeHtml(ai.tag)}</span></div><div class="mini-note" style="margin:3px 0 6px;">${escapeHtml(ai.detail)}</div><button type="button" class="btn btn-outline btn-sm" data-v6-ai-to-vote="${ai.id}">🗳️ 多数決ボードへ候補追加</button></div>`).join("")}</div>
      </div>
    `;
  }

  panel.innerHTML = `
    <div class="card card-soft" style="padding:11px 12px;">
      <div class="v6-between"><strong style="font-size:0.83rem;">🧰 カスタムボード（表示中 ${active.length} / 7 ツール）</strong><button id="v6OpenBoardPickerBtn" type="button" class="btn btn-primary btn-sm">＋ ツールを追加・整理</button></div>
    </div>
    ${cardsHtml || `<div class="card card-soft"><p class="mini-note">「＋ ツールを追加・整理」から使いたい道具を選んでください。</p></div>`}
  `;
  v6RecalcCostBoard();
}

function v6BuildCalcBoardHtml(proj) {
  const c = Object.assign({ qty: 50, mat: 180, subMat: 40, pkg: 120, label: 18, oem: 8000, design: 5000, test: 3000, equip: 0, sellPrice: 880, channel: "marche", splitNote: "素材35%：加工40%：販売25%" }, proj.boards?.calc || {});
  return `
    <div class="card" data-v6-board-id="calc">
      <div class="v6-between" style="margin-bottom:6px;"><h3 class="card-title" style="margin:0;">🧮 原価・設備費計算機</h3><span class="stage-pill">抜け漏れ防止</span></div>
      <div class="calc-grid">
        <div><label class="field-label">製造個数(個)</label><input class="text-input" type="number" data-v6-calc="qty" value="${c.qty}" /></div>
        <div><label class="field-label">目標売価(円)</label><input class="text-input" type="number" data-v6-calc="sellPrice" value="${c.sellPrice}" /></div>
        <div><label class="field-label">①メイン素材/個</label><input class="text-input" type="number" data-v6-calc="mat" value="${c.mat}" /></div>
        <div><label class="field-label">①副材料/個</label><input class="text-input" type="number" data-v6-calc="subMat" value="${c.subMat}" /></div>
        <div><label class="field-label">①容器(瓶・袋)/個</label><input class="text-input" type="number" data-v6-calc="pkg" value="${c.pkg}" /></div>
        <div><label class="field-label">①ラベル・箱/個</label><input class="text-input" type="number" data-v6-calc="label" value="${c.label}" /></div>
        <div><label class="field-label">②加工・キッチン(計)</label><input class="text-input" type="number" data-v6-calc="oem" value="${c.oem}" /></div>
        <div><label class="field-label">②デザイン・検査(計)</label><input class="text-input" type="number" data-v6-calc="design" value="${c.design}" /></div>
        <div><label class="field-label">②設備・道具費(計)</label><input class="text-input" type="number" data-v6-calc="equip" value="${c.equip}" /></div>
        <div><label class="field-label">③販売チャネル</label><select class="text-input" data-v6-calc="channel"><option value="marche" ${c.channel === "marche" ? "selected" : ""}>マルシェ直売(5%)</option><option value="ec" ${c.channel === "ec" ? "selected" : ""}>自社EC(10%+送料)</option><option value="station" ${c.channel === "station" ? "selected" : ""}>道の駅委託(25%)</option></select></div>
      </div>
      <div class="field-group" style="margin-bottom:8px;"><label class="field-label">コラボ分配メモ（任意）</label><input class="text-input" type="text" data-v6-calc="splitNote" value="${escapeHtml(c.splitNote)}" /></div>
      <div id="v6CalcSummaryBox" class="calc-result"></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
        <button id="v6CalcShareTalkBtn" type="button" class="btn btn-outline btn-sm">💬 トークへ共有</button>
        <button id="v6CalcToTodoBtn" type="button" class="btn btn-outline btn-sm">✅ やることへ登録</button>
        <button id="v6CalcToEcDraftBtn" type="button" class="btn btn-primary btn-sm">🥚 予約出品下書きへ</button>
      </div>
    </div>
  `;
}

function v6RecalcCostBoard() {
  const box = document.getElementById("v6CalcSummaryBox");
  const proj = getProjectById(state.currentRoomId);
  if (!box || !proj) return;
  const c = proj.boards?.calc || {};
  const qty = Math.max(1, Number(c.qty) || 50), sell = Number(c.sellPrice) || 880;
  const varCost = (Number(c.mat) || 0) + (Number(c.subMat) || 0) + (Number(c.pkg) || 0) + (Number(c.label) || 0);
  const fixedTot = (Number(c.oem) || 0) + (Number(c.design) || 0) + (Number(c.test) || 0) + (Number(c.equip) || 0);
  const unitCost = Math.round(varCost + fixedTot / qty);
  const feeRate = c.channel === "station" ? 0.25 : (c.channel === "ec" ? 0.12 : 0.05);
  const unitProfit = Math.round(sell * (1 - feeRate) - unitCost);
  const costRate = sell > 0 ? ((unitCost / sell) * 100).toFixed(1) : "0.0";
  const breakEven = unitProfit > 0 ? Math.ceil(fixedTot / Math.max(1, sell * (1 - feeRate) - varCost)) : "赤字";
  box.innerHTML = `1個あたり原価：<strong>¥${unitCost.toLocaleString()}</strong>（原価率 ${costRate}%）<br/>1個手残り利益：<strong>¥${unitProfit.toLocaleString()}</strong> ／ 損益分岐点：<strong>${breakEven === "赤字" ? "売価見直し要" : `${breakEven}個で初期費回収！`}</strong>`;
}

function v6BuildChannelCompareHtml(proj) {
  const c = proj.boards?.calc || { sellPrice: 880, mat: 180, subMat: 40, pkg: 120, label: 18 };
  const sell = Number(c.sellPrice) || 880;
  const varCost = (Number(c.mat) || 0) + (Number(c.subMat) || 0) + (Number(c.pkg) || 0) + (Number(c.label) || 0);
  const rows = [
    { name: "🎪 マルシェ直売", fee: "5%", net: Math.round(sell * 0.95 - varCost), note: "試食でファン化◎" },
    { name: "🏪 道の駅・委託", fee: "25%", net: Math.round(sell * 0.75 - varCost), note: "平日も自動で売れる" },
    { name: "📦 自社EC（予約）", fee: "10%+送料", net: Math.round(sell * 0.90 - varCost - 120), note: "売れ残りゼロ製造" },
    { name: "🚚 小売卸売り", fee: "卸掛け率65%", net: Math.round(sell * 0.65 - varCost), note: "まとまった数量向け" }
  ];
  return `<div class="card" data-v6-board-id="channel"><h3 class="card-title" style="margin-bottom:6px;">🏪 販売チャネル比較＆手残り利益（売価 ¥${sell} 時）</h3><div class="v6-stack">${rows.map(r => `<div class="friend-row"><div><strong>${r.name}</strong><div class="mini-note">手数料:${r.fee} ／ ${r.note}</div></div><strong style="color:var(--green);">手残り ¥${r.net}</strong></div>`).join("")}</div></div>`;
}

function v6RenderTodoPanel(proj) {
  const panel = document.getElementById("v6RoomPanelTodo");
  if (!panel) return;
  const list = [...(proj.todos || [])];
  const prioRank = { high: 1, mid: 2, low: 3, "": 4 };
  if (v6.todoSort === "priority") list.sort((a, b) => (prioRank[a.priority || ""] - prioRank[b.priority || ""]) || (a.date || "9999").localeCompare(b.date || "9999"));
  else list.sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));

  panel.innerHTML = `
    <div class="card">
      <div class="v6-between" style="margin-bottom:8px;">
        <h3 class="card-title" style="margin:0;">✅ やること一覧（${list.length}件）</h3>
        <div style="display:flex;gap:5px;">
          <button type="button" class="chip-btn ${v6.todoSort === "date" ? "active" : ""}" data-v6-todo-sort="date">📅 期限順</button>
          <button type="button" class="chip-btn ${v6.todoSort === "priority" ? "active" : ""}" data-v6-todo-sort="priority">🔴 重要度順</button>
          <button type="button" class="btn btn-primary btn-sm" id="v6AddTodoDirectBtn">＋ 追加</button>
        </div>
      </div>
      <div class="v6-stack">
        ${list.map(t => `
          <div class="todo-item ${t.done ? "done" : ""}" data-v6-todo-row="${t.id}">
            <label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;flex:1;">
              <input type="checkbox" data-v6-todo-chk="${t.id}" ${t.done ? "checked" : ""} style="margin-top:3px;" />
              <div>
                <div>${v6PrioBadgeHtml(t.priority)} <span class="todo-title-txt" style="font-weight:700;">${escapeHtml(t.title)}</span></div>
                ${t.comment ? `<div class="mini-note">💬 ${escapeHtml(t.comment)}</div>` : ""}
                <div class="mini-note">${t.date ? `📅 期日: ${escapeHtml(t.date)}` : "期日なし"}</div>
              </div>
            </label>
            ${t.source?.tab ? `<button type="button" class="btn btn-outline btn-sm" data-v6-warp="${t.source.tab}|${t.source.refId || ""}" style="white-space:nowrap;">元ネタへ →</button>` : ""}
          </div>
        `).join("") || `<p class="mini-note">まだやることはありません。トークや役立ちから登録できます。</p>`}
      </div>
    </div>
  `;
  document.getElementById("v6AddTodoDirectBtn").onclick = () => v6OpenTodoRegisterModal("", { tab: "todo", refId: "" });
}

function v6WarpToSource(tab, refId) {
  v6SetRoomSwipe(0);
  v6SwitchRoomTab(tab || "room");
  setTimeout(() => {
    let target = null;
    if (tab === "talk" && refId) target = document.querySelector(`#roomChatMessages [data-v6-msg-id="${refId}"]`);
    if (tab === "tools" && refId) target = document.querySelector(`#v6RoomPanelTools [data-v6-board-id="${refId}"]`);
    if (tab === "todo" && refId) target = document.querySelector(`#v6RoomPanelTodo [data-v6-todo-row="${refId}"]`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.remove("v6-warp-flash");
      void target.offsetWidth;
      target.classList.add("v6-warp-flash");
    }
  }, 60);
}

/* ==================== 役立ちタブ（全体向け）＆ ショップ（EC ＆ 50:50） ==================== */
function v6RenderTipsPage() {
  const sec = document.getElementById("view-tips");
  if (!sec || sec.dataset.v6Ready) return;
  sec.dataset.v6Ready = "1";
  sec.innerHTML = `
    <div class="en-header">
      <div><p class="eyebrow">現場の神資材発掘 ＆ 関西トレンド</p><h2>🥬 役立ち・50:50登録</h2></div>
      <button type="button" class="btn btn-outline btn-sm" data-v6-want="tips">🔔 要望（<span id="wantTipsCount">${state.wants.tips || 0}</span>）</button>
    </div>
    <div class="card">
      <div class="v6-between" style="margin-bottom:6px;"><h3 class="card-title" style="margin:0;">🔗 現場の愛用品・神資材を 50:50 へ発掘登録</h3><button id="v6TipsFiftySample" type="button" class="btn-sample-fill">✨ 入力例</button></div>
      <p class="card-desc">最初に見つけた人は誰経由で買われてもずっと<strong>👑先見の明ボーナス（5%）</strong>対象！同じ商品は1カードに統合されます。</p>
      <div class="field-group"><label class="field-label">資材・道具・商品名</label><input id="v6TipsFiftyName" class="text-input" type="text" placeholder="例：折りたたみ木製ディスプレイ棚（3段）" /></div>
      <div class="field-group"><label class="field-label">楽天・Amazon等のURL（任意）</label><input id="v6TipsFiftyUrl" class="text-input" type="url" placeholder="https://..." /></div>
      <div class="field-group"><label class="field-label">現場で活かした一言レビュー</label><input id="v6TipsFiftyComment" class="text-input" type="text" placeholder="例：軽自動車に積めて設営3分！小瓶ジャムが映えます。" /></div>
      <button id="v6TipsFiftySubmit" type="button" class="btn btn-accent btn-sm">⚖️ 50:50 に発掘登録する</button>
    </div>
    <div class="card card-soft">
      <h3 class="card-title">📰 関西マルシェ・旬の市場データ（夜間リサーチ連動）</h3>
      <p class="mini-note" style="margin-top:6px;">・🍊 <strong>人気急上昇：</strong>無添加・120g小瓶・常温手土産ジャム</p>
      <p class="mini-note">・📍 <strong>関西マルシェ：</strong>大阪・京都エリアの週末マルシェ出店募集（今月3件）</p>
      <p class="mini-note">・✨ <strong>先取りチャンス：</strong>他県ヒット×関西0件の「規格外フルーツ×小ロット加工」</p>
    </div>
  `;
}

function v6RenderShopPage() {
  const sec = document.getElementById("view-shop");
  if (!sec) return;
  if (!sec.dataset.v6Ready) {
    sec.dataset.v6Ready = "1";
    sec.innerHTML = `
      <div class="en-header">
        <div><p class="eyebrow">巣立ち・予約・レスキュー・50:50</p><h2>🛍️ ショップ ＆ 50:50</h2></div>
        <button type="button" class="btn btn-outline btn-sm" data-v6-want="shop">🔔 応援（<span id="wantShopCount">${state.wants.shop || 0}</span>）</button>
      </div>
      <div class="filter-bar" id="v6ShopTabs">
        <button type="button" class="filter-chip active" data-shoptab="sudachi">🎉 巣立ち商品</button>
        <button type="button" class="filter-chip" data-shoptab="reserve">🥚 予約・テスト販売</button>
        <button type="button" class="filter-chip" data-shoptab="rescue">🆘 レスキュー便</button>
        <button type="button" class="filter-chip" data-shoptab="fifty">⚖️ 50:50</button>
      </div>
      <div id="v6ShopContainer"></div>
    `;
  }
  const wrap = document.getElementById("v6ShopContainer");
  if (!wrap) return;
  document.querySelectorAll("#v6ShopTabs .filter-chip").forEach(b => b.classList.toggle("active", b.dataset.shoptab === v6.shopTab));

  if (v6.shopTab === "sudachi") {
    wrap.innerHTML = (v6.ecProducts.sudachi || []).map(p => `
      <div class="card">
        <span class="stage-pill">${escapeHtml(p.badge)}</span>
        <h3 class="card-title" style="margin-top:8px;">${escapeHtml(p.name)}</h3>
        <div class="mini-note">作り手：${escapeHtml(p.makers)}</div>
        <div class="ec-price">¥${Number(p.price).toLocaleString()}</div>
        <p class="card-desc" style="margin-bottom:8px;">${escapeHtml(p.story)}</p>
        ${p.pairingText ? `<div class="pairing-box" style="margin-bottom:10px;">${escapeHtml(p.pairingText)}</div>` : ""}
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn btn-primary btn-sm" data-v6-buy-ec="巣立ち商品：${escapeHtml(p.name)}">🛒 応援購入する</button>
          <button type="button" class="btn btn-outline btn-sm" data-v6-open-story="${p.id}">🧪 開発のストーリーを見る</button>
        </div>
      </div>
    `).join("");
    return;
  }
  if (v6.shopTab === "reserve") {
    wrap.innerHTML = (v6.ecProducts.reserve || []).map(p => `
      <div class="card">
        <span class="stage-pill" style="background:var(--orange-soft);color:var(--orange);">${escapeHtml(p.badge)}</span>
        <h3 class="card-title" style="margin-top:8px;">${escapeHtml(p.name)}</h3>
        <div class="mini-note">${escapeHtml(p.makers)} ／ ${escapeHtml(p.stock)}</div>
        <div class="ec-price">¥${Number(p.price).toLocaleString()}</div>
        <button type="button" class="btn btn-accent btn-sm" data-v6-buy-ec="先行予約：${escapeHtml(p.name)}">🥚 最初の応援者として予約</button>
      </div>
    `).join("");
    return;
  }
  if (v6.shopTab === "rescue") {
    wrap.innerHTML = (v6.ecProducts.rescue || []).map(p => `
      <div class="card" style="border:1.5px solid var(--orange);background:#FFFBF7;">
        <span class="feed-badge rescue">${escapeHtml(p.badge)}</span>
        <h3 class="card-title" style="margin-top:8px;">${escapeHtml(p.name)}</h3>
        <div class="mini-note">${escapeHtml(p.makers)} ／ ${escapeHtml(p.stock)}</div>
        <div class="ec-price">¥${Number(p.price).toLocaleString()}</div>
        <button type="button" class="btn btn-accent btn-sm" data-v6-buy-ec="レスキュー便：${escapeHtml(p.name)}">🆘 レスキュー購入する</button>
      </div>
    `).join("");
    return;
  }

  const friendIds = new Set(v6.friends.filter(f => f.isFriend).map(f => f.id));
  const sorted = [...v6.fiftyItems].sort((a, b) => (b.reviews.some(r => friendIds.has(r.authorId)) ? 1 : 0) - (a.reviews.some(r => friendIds.has(r.authorId)) ? 1 : 0));

  wrap.innerHTML = `
    <div class="card card-soft" style="padding:11px 12px;">
      <strong style="font-size:0.83rem;">⚖️ 50:50 リンク交互切替（ポイント制なし・超軽量）</strong>
      <p class="mini-note" style="margin-top:4px;">・レビュー経由：<strong>👑発掘者 5%（先見の明）＋ 🗣️紹介者 45% ＋ 🌱運営 50%</strong></p>
      <p class="mini-note">・一覧直接購入：<strong>👑発掘者 15% ＋ 🛠️愛用者 35%（活かした数で確率UP）＋ 🌱運営 50%</strong></p>
    </div>
  ` + sorted.map(item => {
    const hasFriend = item.reviews.some(r => friendIds.has(r.authorId));
    const tot = (item.stats.op || 0) + (item.stats.disc || 0) + (item.stats.maker || 0);
    return `
      <div class="card">
        <div class="v6-between" style="margin-bottom:5px;">
          <span class="stage-pill">${escapeHtml(item.category)}</span>
          <span class="stage-pill" style="background:var(--orange-soft);color:var(--orange);">🔥 ${item.reviews.length}人の作り手が愛用中</span>
        </div>
        <h3 class="card-title">${escapeHtml(item.name)}</h3>
        <div class="mini-note">👑 最初に見つけた人：<strong>${escapeHtml(item.discoverer)}</strong> ${hasFriend ? `／ <strong style="color:var(--green);">🤝 友達が愛用中</strong>` : ""}</div>
        <div class="pairing-box">🤝 <strong>掛け合わせ提案：</strong>${escapeHtml(item.pairing)}</div>
        ${item.reviews.map(rv => `
          <div class="review-box">
            <div><strong>${escapeHtml(rv.author)}</strong>の現場レビュー：</div>
            <div style="margin-top:2px;">${escapeHtml(rv.text)}</div>
            <div class="review-actions">
              <button type="button" class="btn btn-outline btn-sm" data-v6-rv-react="${item.id}|${rv.id}|likes">👍 いいね (${rv.likes})</button>
              <button type="button" class="btn btn-outline btn-sm" data-v6-rv-react="${item.id}|${rv.id}|applied">🛠️ 現場で活かした！ (${rv.applied})</button>
              <button type="button" class="btn btn-primary btn-sm" data-v6-fifty-buy="${item.id}|${escapeHtml(rv.author)}">このレビュー経由で買う</button>
            </div>
          </div>
        `).join("")}
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
          <button type="button" class="btn btn-accent btn-sm" data-v6-fifty-buy="${item.id}|">⚖️ 一覧から直接購入（リンク切替テスト）</button>
          <button type="button" class="btn btn-outline btn-sm" data-v6-add-rv="${item.id}">＋ レビュー追加</button>
          ${item.url ? `<a class="btn btn-outline btn-sm" href="${escapeHtml(item.url)}" target="_blank" rel="noopener" style="text-decoration:none;">🔗 楽天等で確認</a>` : ""}
        </div>
        ${tot > 0 ? `<div class="rotation-log">${escapeHtml(item.lastRouteMsg)}<br/>累計(${tot}回)：運営 ${item.stats.op} / 👑発掘者 ${item.stats.disc} / 作り手 ${item.stats.maker}</div>` : ""}
      </div>
    `;
  }).join("");
}

function v6ExecuteFiftyClick(itemId, viaAuthor) {
  const item = v6.fiftyItems.find(x => x.id === itemId);
  if (!item) return;
  const r = Math.random() * 100;
  let winner = "";
  if (viaAuthor) {
    if (r < 50) { item.stats.op += 1; winner = "🌱 EN•joy運営リンク（50%枠）"; }
    else if (r < 55) { item.stats.disc += 1; winner = `👑 最初に見つけた人【${item.discoverer}】リンク（先見の明 5%枠!）`; }
    else { item.stats.maker += 1; winner = `🗣️ レビュー紹介者【${viaAuthor}】リンク（45%枠）`; }
  } else {
    if (r < 50) { item.stats.op += 1; winner = "🌱 EN•joy運営リンク（50%枠）"; }
    else if (r < 65) { item.stats.disc += 1; winner = `👑 最初に見つけた人【${item.discoverer}】リンク（先見の明 15%枠!）`; }
    else {
      item.stats.maker += 1;
      const weights = item.reviews.map(rv => 1 + (rv.likes || 0) + (rv.applied || 0) * 3);
      const totW = weights.reduce((a, b) => a + b, 0);
      let pick = Math.random() * totW;
      let chosen = item.reviews[0].author;
      for (let i = 0; i < item.reviews.length; i++) {
        pick -= weights[i];
        if (pick <= 0) { chosen = item.reviews[i].author; break; }
      }
      winner = `🛠️ 愛用者【${chosen}】リンク（現場コメント優遇 35%枠）`;
    }
  }
  item.lastRouteMsg = `最新クリック遷移先 → ${winner}`;
  v6SaveAll(); v6RenderShopPage(); v6LogAction("50:50クリック", `${item.name} -> ${winner}`);
  showToast(`リンク自動切替：${winner}`);
}

/* ==================== 行動ログ・5秒無操作迷い検知・ヒートマップ・Discord送信 ==================== */
function v6LogAction(type, detail) {
  v6.logs = v6NormalizeLogs(v6.logs);
  v6.lastActionLabel = `${type}:${detail}`;
  const tabKey = state.activeView === "en-room" ? "en" : state.activeView;
  if (type === "画面切替" && v6.logs.clicksByTab[tabKey] !== undefined) v6.logs.clicksByTab[tabKey] += 1;
  v6.logs.events.unshift({ time: getNowTimeStr(), tab: state.activeView, type, detail });
  if (v6.logs.events.length > 60) v6.logs.events.pop();
  v6SaveAll(); v6ResetHesitation();
}

function v6ResetHesitation() {
  clearTimeout(v6.hesitationTimer);
  v6.hesitationTimer = setTimeout(() => {
    v6.logs = v6NormalizeLogs(v6.logs);
    v6.logs.hesitations = (v6.logs.hesitations || 0) + 1;
    v6.logs.events.unshift({
      time: getNowTimeStr(), tab: state.activeView, type: "迷い検知(5秒無操作)",
      detail: `画面:${state.activeView} / Y:${Math.round(window.scrollY)}px / 直前:${v6.lastActionLabel}`
    });
    if (v6.logs.events.length > 60) v6.logs.events.pop();
    v6SaveAll();
  }, 5000);
}

function v6RenderHeatmap() {
  const layer = document.getElementById("v6HeatmapLayer");
  if (!layer) return;
  layer.classList.toggle("hidden", !v6.heatmapVisible);
  if (!v6.heatmapVisible) return;
  const pts = (v6.heatmap || []).filter(p => p.view === state.activeView).slice(-90);
  layer.innerHTML = pts.map(p => `<span class="heat-dot" style="left:${p.x}%;top:${p.y}%;"></span>`).join("");
}

function v6OpenLogsModal() {
  v6.logs = v6NormalizeLogs(v6.logs);
  const evHtml = (v6.logs.events || []).slice(0, 10).map(e => `<li><strong>${escapeHtml(e.time)}</strong> [${escapeHtml(e.tab)}] ${escapeHtml(e.type)}：${escapeHtml(e.detail)}</li>`).join("") || "<li class='mini-note'>ログなし</li>";
  v6OpenModal(`📊 隠し分析パネル（匿名ID: ${v6.logs.anonId}）`, `
    <div class="quick-stats" style="grid-template-columns:repeat(3,1fr);margin-bottom:10px;">
      <div class="stat-box"><span class="stat-num">${v6.logs.hesitations || 0}</span><span class="stat-lbl">迷い検知(5秒)</span></div>
      <div class="stat-box"><span class="stat-num">${v6.logs.events.length}</span><span class="stat-lbl">記録ログ数</span></div>
      <div class="stat-box"><span class="stat-num">${v6.heatmap.length}</span><span class="stat-lbl">タップ座標</span></div>
    </div>
    <button id="v6ToggleHeatBtn" type="button" class="btn btn-outline btn-sm btn-full" style="margin-bottom:8px;">
      🔥 タップ密度ヒートマップ：${v6.heatmapVisible ? "ON（クリックでOFF）" : "OFF（クリックでON）"}
    </button>
    <p class="mini-note" style="margin-bottom:6px;">画面別滞在(秒)：${JSON.stringify(v6.logs.screenTimeSec)}</p>
    <p class="mini-note" style="margin-bottom:8px;">ツール利用数：${JSON.stringify(v6.logs.toolUsage)}</p>
    <ul style="margin:0 0 12px;padding-left:18px;font-size:0.78rem;">${evHtml}</ul>
    <label class="field-label">分析用 Discord Webhook URL</label>
    <input id="v6WebhookInp" class="text-input" type="text" value="${escapeHtml(v6.logs.discordWebhook || "")}" placeholder="https://discord.com/api/webhooks/..." />
    <button id="v6SendDiscordBtn" type="button" class="btn btn-primary btn-full" style="margin-top:8px;">📤 Discordへ分析レポート送信</button>
  `);
  document.getElementById("v6ToggleHeatBtn").onclick = () => { v6.heatmapVisible = !v6.heatmapVisible; v6RenderHeatmap(); v6OpenLogsModal(); };
  document.getElementById("v6SendDiscordBtn").onclick = async () => {
    const url = document.getElementById("v6WebhookInp").value.trim();
    v6.logs.discordWebhook = url; v6SaveAll();
    if (!url) { showToast("Webhook URLを入力してください"); return; }
    const content = `📊 **EN•joy 10人テスト分析 (${v6.logs.anonId} / ${getSiteMode()})**\n・迷い検知(5秒無操作): ${v6.logs.hesitations}回\n・滞在秒数: ${JSON.stringify(v6.logs.screenTimeSec)}\n・ツール利用: ${JSON.stringify(v6.logs.toolUsage)}\n・直近ログ: ${v6.logs.events.slice(0, 4).map(e => `${e.time} ${e.type}(${e.detail})`).join(" / ")}`;
    try {
      await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
      showToast("✅ Discordへ分析レポートを送信しました！");
    } catch { showToast("⚠️ 送信エラー"); }
  };
}

/* ==================== ボトムナビ長押し「うっすらプレビュー」 ==================== */
function v6SetupNavPeek() {
  const overlay = document.getElementById("v6PeekOverlay");
  const card = document.getElementById("v6PeekCard");
  if (!overlay || !card) return;
  const textFor = (tab) => {
    if (tab === "home") return `<strong>🏠 ホーム プレビュー</strong><br/>友達：${v6.friends.filter(f => f.isFriend).length}人 ／ 年輪：${v6.nenrin.length}件`;
    if (tab === "feed") return `<strong>💬 つぶやき プレビュー</strong><br/>投稿：${state.feeds.length}件（SOS ${state.feeds.filter(f => f.type === "rescue").length}件）`;
    if (tab === "en") return `<strong>🧪 EN•ラボ プレビュー</strong><br/>プロジェクト：${state.projects.length}件 ／ タネ置き場：${state.offers.length}件`;
    if (tab === "tips") return `<strong>🥬 役立ち プレビュー</strong><br/>現場の神資材を50:50へ発掘登録・関西マルシェヒント`;
    return `<strong>🛍️ ショップ ＆ 50:50 プレビュー</strong><br/>巣立ち：${v6.ecProducts.sudachi.length}件 ／ 50:50：${v6.fiftyItems.length}件`;
  };
  document.querySelectorAll("#bottomNav .nav-item").forEach(btn => {
    const tab = btn.dataset.tab;
    let timer = null, didLong = false;
    const start = () => { didLong = false; clearTimeout(timer); timer = setTimeout(() => { didLong = true; card.innerHTML = textFor(tab); overlay.classList.remove("hidden"); v6LogAction("長押しプレビュー", tab); }, 420); };
    const end = () => { clearTimeout(timer); overlay.classList.add("hidden"); };
    btn.addEventListener("click", (e) => { if (didLong) { didLong = false; e.stopImmediatePropagation(); } }, true);
    btn.addEventListener("mousedown", start); btn.addEventListener("mouseup", end); btn.addEventListener("mouseleave", end);
    btn.addEventListener("touchstart", start, { passive: true }); btn.addEventListener("touchend", end); btn.addEventListener("touchcancel", end);
    btn.addEventListener("contextmenu", e => e.preventDefault());
  });
}

/* ==================== Part 2 初期化＆全イベント配線 ==================== */
document.addEventListener("DOMContentLoaded", () => {
  v6InjectEnLabListUI();
  v6InjectRoomDetailUI();
  v6SetupNavPeek();

  // 初回起動時の描画ズレを解消（v5のDOMContentLoaded直後に確実に同期）
  v6RenderAll();
  renderEnRoomList();
  renderFeedView();
  renderWants();
  if (state.activeView === "register") goStep(state.step || 1);
  v6ResetHesitation();

  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    const down = y > v6.lastScrollY && y > 70;
    document.getElementById("v6GmapTabs")?.classList.toggle("tabs-hidden", down);
    document.body.classList.toggle("nav-is-hidden", down);
    v6.lastScrollY = y;
    v6ResetHesitation();
  }, { passive: true });

  document.addEventListener("pointerdown", (e) => {
    v6.heatmap.push({ view: state.activeView, x: Math.round((e.clientX / window.innerWidth) * 100), y: Math.round((e.clientY / window.innerHeight) * 100) });
    if (v6.heatmap.length > 180) v6.heatmap.shift();
    v6ResetHesitation();
  }, { passive: true });

  document.getElementById("v6EnSearchInput")?.addEventListener("input", (e) => {
    v6.enSearchQuery = e.target.value;
    renderEnRoomList();
  });

  document.body.addEventListener("click", (e) => {
    const t = e.target;

    // 役立ち・ショップの要望/応援ボタン復活
    const wBtn = t.closest("[data-v6-want]");
    if (wBtn) {
      const k = wBtn.dataset.v6Want;
      state.wants[k] = (state.wants[k] || 0) + 1;
      EnjoyStore.save(STORAGE_KEYS.WANTS, state.wants);
      renderWants();
      showToast("🔔 応援・リクエストを記録しました！");
      return;
    }

    // 右下FAB
    if (t.closest("#v6FabBtn")) {
      if (state.activeView === "en") openPostModal(state.enMode === "offers" ? "offer" : "project");
      else if (state.activeView === "feed") {
        document.getElementById("feedPostModal").classList.remove("hidden");
        if (state.feedFilter === "rescue") {
          state.feedPostType = "rescue";
          document.querySelectorAll("#feedTypeSwitch .seg-btn").forEach(b => b.classList.toggle("active", b.dataset.feedtype === "rescue"));
          document.getElementById("v6FeedSosFields")?.classList.remove("hidden");
        }
      }
      return;
    }

    // EN•ラボ絞り込み
    if (t.closest("#v6OpenEnFilterBtn")) { v6OpenEnFilterModal(); return; }
    const setF = t.closest("[data-v6-set-filter]");
    if (setF) {
      const [k, val] = setF.dataset.v6SetFilter.split("|");
      v6.enFilters[k] = (v6.enFilters[k] === val) ? "" : val;
      renderEnRoomList(); v6OpenEnFilterModal();
      return;
    }
    const clrF = t.closest("[data-v6-clear-filter]");
    if (clrF) { v6.enFilters[clrF.dataset.v6ClearFilter] = ""; renderEnRoomList(); return; }

    // EN•ラボ 4ボックスタブ・スワイプ・カレンダー・招待・LINE
    const rTab = t.closest("[data-v6-rtab]");
    if (rTab) { v6SwitchRoomTab(rTab.dataset.v6Rtab); return; }
    if (t.closest("#v6BtnToCal")) { v6SetRoomSwipe(1); return; }
    if (t.closest("#v6BtnToSummary")) { v6SetRoomSwipe(0); return; }
    const dot = t.closest("#v6SwipeDots .swipe-dot");
    if (dot) { v6SetRoomSwipe(Number(dot.dataset.rslide)); return; }
    const warp = t.closest("[data-v6-warp]");
    if (warp) { const [tb, rf] = warp.dataset.v6Warp.split("|"); v6WarpToSource(tb, rf); return; }

    if (t.closest("#v6CalAddBtn")) {
      const proj = getProjectById(state.currentRoomId);
      const date = document.getElementById("v6CalDate")?.value;
      const title = document.getElementById("v6CalTitle")?.value.trim();
      if (!proj || !date || !title) { showToast("日付と予定名を入力してください"); return; }
      proj.calendarExtras = proj.calendarExtras || [];
      proj.calendarExtras.push({ id: "ce-" + Date.now(), type: "road", date, title, sourceTab: "todo" });
      document.getElementById("v6CalTitle").value = "";
      saveProjectState(proj); v6RenderRoomCalendar(proj); showToast("📅 カレンダーに予定を追加しました！");
      return;
    }
    if (t.closest("#v6RoomInviteBtn")) {
      const frs = v6.friends.filter(f => f.isFriend);
      v6OpenModal("🤝 友達をEN•ラボへ招待", frs.length
        ? `<div class="v6-stack">${frs.map(f => `<div class="friend-row"><div><strong>${escapeHtml(f.name)}</strong><div class="mini-note">${escapeHtml(f.role)}</div></div><button type="button" class="btn btn-primary btn-sm" data-v6-inv-do="${escapeHtml(f.name)}">招待</button></div>`).join("")}</div>`
        : `<p class="mini-note">まだ友達がいません。ヘッダーの「🪪」から対面❓QR読込テストで追加できます。</p>`
      );
      return;
    }
    const invDo = t.closest("[data-v6-inv-do]");
    if (invDo) {
      const proj = getProjectById(state.currentRoomId);
      if (proj) {
        proj.messages.push({ id: "m-" + Date.now(), who: "sys", sender: "システム", text: `🤝 友達の「${invDo.dataset.v6InvDo}」さんをEN•ラボへ招待しました！`, pinned: false, time: getNowTimeStr() });
        saveProjectState(proj); v6CloseModal(); renderActiveEnRoom(); showToast(`🎉 ${invDo.dataset.v6InvDo}さんを招待しました！`);
      }
      return;
    }
    if (t.closest("#v6RoomLineBtn")) {
      const proj = getProjectById(state.currentRoomId);
      window.open(`https://line.me/R/msg/text/?${encodeURIComponent(`【EN•ラボ招待】${proj?.title || "EN•joy"}に参加しよう！`)}`, "_blank");
      return;
    }

    // トーク発言アクション
    const mTodo = t.closest("[data-v6-msg-to-todo]");
    if (mTodo) {
      const proj = getProjectById(state.currentRoomId);
      const m = (proj?.messages || []).find(x => x.id === mTodo.dataset.v6MsgToTodo);
      if (m) v6OpenTodoRegisterModal(m.text.slice(0, 32), { tab: "talk", refId: m.id });
      return;
    }
    const mDate = t.closest("[data-v6-msg-date]");
    if (mDate) {
      const proj = getProjectById(state.currentRoomId);
      const m = (proj?.messages || []).find(x => x.id === mDate.dataset.v6MsgDate);
      if (!m) return;
      const d = prompt("カレンダーに登録する日付 (YYYY-MM-DD)", m.dateTag || "2026-12-12");
      if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) { m.dateTag = d; saveProjectState(proj); renderActiveEnRoom(); showToast(`📅 カレンダー(${d})へ集約しました！`); }
      return;
    }
    const clipT = t.closest("[data-v6-clip-toggle]");
    if (clipT) {
      const id = clipT.dataset.v6ClipToggle;
      if (v6SelectedClipIds.has(id)) v6SelectedClipIds.delete(id);
      else v6SelectedClipIds.add(id);
      renderActiveEnRoom(); return;
    }
    if (t.closest("#v6PublishClipBtn")) {
      const proj = getProjectById(state.currentRoomId);
      if (!proj || !v6SelectedClipIds.size) { showToast("切り抜きたい発言の「🫧 切り抜き」を1〜3個選んでください"); return; }
      const clips = (proj.messages || []).filter(m => v6SelectedClipIds.has(m.id)).map(m => ({ icon: "🌱", who: m.sender, text: m.text }));
      state.feeds.unshift({
        id: "feed-" + Date.now(), type: "behind", author: getActiveSenderName(), roleIcon: "🧪",
        area: proj.area || "関西", time: "たった今", linkedRoomId: proj.id,
        text: `【${proj.title}】開発ルームのリアルな掛け合いをお届けします✨`,
        popClip: clips, media: null, likes: 0, wantEat: 0
      });
      saveFeedsSafely(); v6SelectedClipIds.clear(); v6AddNenrin("🎬 開発の裏側をポップ投稿", proj.title);
      state.feedFilter = "behind"; switchView("feed");
      showToast("🎬 トーク切り抜きを「開発の裏側」へ投稿しました！");
      return;
    }

    // 多数決・公開承認・カスタムボード
    const castV = t.closest("[data-v6-cast-vote]");
    if (castV) {
      const proj = getProjectById(state.currentRoomId);
      const [vid, oid] = castV.dataset.v6CastVote.split("|");
      const v = (proj?.votes || []).find(x => x.id === vid);
      if (!v) return;
      const isMember = state.roomViewMode === "inside";
      const key = isMember ? "memberVotes" : "fanVotes";
      if (v.myChoice) { const p = v.options.find(o => o.id === v.myChoice); if (p) p[key] = Math.max(0, (p[key] || 0) - 1); }
      v.myChoice = oid;
      const cur = v.options.find(o => o.id === oid);
      if (cur) cur[key] = (cur[key] || 0) + 1;
      if (!isMember && !v6.fanState.votedIds.includes(vid)) v6.fanState.votedIds.push(vid);
      v6GainExp(5); saveProjectState(proj); renderActiveEnRoom(); showToast("🗳️ 投票しました！");
      return;
    }
    const appPub = t.closest("[data-v6-approve-pub]");
    if (appPub) {
      const proj = getProjectById(state.currentRoomId);
      const v = (proj?.votes || []).find(x => x.id === appPub.dataset.v6ApprovePub);
      if (!v) return;
      v.memberApproved = (v.memberApproved || 1) + 1;
      if (v.memberApproved >= (v.memberTotal || 2)) {
        v.isPublic = true; v6AddNenrin("🌐 多数決が全員OK → 一般公開！", v.title);
        showToast("🎉 メンバー全員OK！一般ユーザーにも公開されました！");
      } else showToast(`✅ 公開OKを押しました（${v.memberApproved}/${v.memberTotal}人）`);
      saveProjectState(proj); renderActiveEnRoom(); return;
    }
    const vToTodo = t.closest("[data-v6-vote-to-todo]");
    if (vToTodo) {
      const proj = getProjectById(state.currentRoomId);
      const v = (proj?.votes || []).find(x => x.id === vToTodo.dataset.v6VoteToTodo);
      if (v) v6OpenTodoRegisterModal(`多数決決定：${v.title}`, { tab: "tools", refId: "vote" });
      return;
    }
    if (t.closest("#v6OpenBoardPickerBtn")) {
      const proj = getProjectById(state.currentRoomId);
      if (!proj) return;
      const act = proj.boards?.active || [];
      v6OpenModal("🧰 カスタムボードを追加・整理", `
        <p class="mini-note" style="margin-bottom:10px;">使いたいツールにチェックを入れると、役立ちタブに並びます。</p>
        <div class="v6-stack" style="margin-bottom:12px;">
          ${ENJOY_V6_DATA.customBoardsCatalog.map(cb => `<label class="friend-row" style="cursor:pointer;"><div><strong style="font-size:0.84rem;">${cb.label}</strong><div class="mini-note">${cb.phase}</div></div><input type="checkbox" data-v6-pick-board="${cb.id}" ${act.includes(cb.id) ? "checked" : ""} /></label>`).join("")}
        </div>
        <button type="button" class="btn btn-primary btn-full" onclick="v6CloseModal()">完了</button>
      `);
      return;
    }
    if (t.closest("#v6BoardVoteSample")) {
      document.getElementById("v6NewVoteTitle").value = "初回テスト販売の価格帯、どっちがいい？";
      document.getElementById("v6NewVoteOpt1").value = "¥880（手土産ギフト仕様）";
      document.getElementById("v6NewVoteOpt2").value = "¥750（まずは試しやすい価格）";
      document.getElementById("v6NewVoteDeadline").value = "2026-12-08";
      return;
    }
    if (t.closest("#v6CreateVoteBtn")) {
      const proj = getProjectById(state.currentRoomId);
      const title = document.getElementById("v6NewVoteTitle")?.value.trim();
      const o1 = document.getElementById("v6NewVoteOpt1")?.value.trim();
      const o2 = document.getElementById("v6NewVoteOpt2")?.value.trim();
      if (!proj || !title || !o1 || !o2) { showToast("議題と2つの選択肢を入力してください"); return; }
      proj.votes = proj.votes || [];
      proj.votes.unshift({
        id: "vt-" + Date.now(), title, deadline: document.getElementById("v6NewVoteDeadline")?.value || "2026-12-10",
        url: document.getElementById("v6NewVoteUrl")?.value.trim() || "", costNote: "",
        memberApproved: 1, memberTotal: Math.max(2, (proj.members || []).length), isPublic: false,
        options: [{ id: "vo-1", label: o1, memberVotes: 0, fanVotes: 0 }, { id: "vo-2", label: o2, memberVotes: 0, fanVotes: 0 }], myChoice: null
      });
      saveProjectState(proj); renderActiveEnRoom(); showToast("🗳️ 多数決を作成しました！");
      return;
    }
    if (t.closest("#v6CalcShareTalkBtn")) {
      const proj = getProjectById(state.currentRoomId);
      const sum = document.getElementById("v6CalcSummaryBox")?.innerText.replace(/\n/g, " ／ ") || "";
      if (proj && sum) {
        proj.messages.push({ id: "m-" + Date.now(), who: "me", sender: getActiveSenderName(), text: `🧮【原価シミュレーション共有】${sum}`, pinned: false, time: getNowTimeStr() });
        saveProjectState(proj); v6SwitchRoomTab("talk"); showToast("💬 原価計算の結果をトークへ共有しました！");
      }
      return;
    }
    if (t.closest("#v6CalcToTodoBtn")) {
      const c = getProjectById(state.currentRoomId)?.boards?.calc || {};
      v6OpenTodoRegisterModal(`原価¥${c.sellPrice || 880}（${c.qty || 50}個ロット）の資材手配`, { tab: "tools", refId: "calc" });
      return;
    }
    if (t.closest("#v6CalcToEcDraftBtn")) {
      const proj = getProjectById(state.currentRoomId);
      const price = Number(proj?.boards?.calc?.sellPrice) || 880;
      v6.ecProducts.reserve.unshift({ id: "ec-r" + Date.now(), name: `【予約・テスト】${proj?.title || "新商品"}`, price, makers: state.profile.displayName || "EN•joy", stock: `限定${proj?.boards?.calc?.qty || 50}個（売れ残りゼロ製造）`, badge: "🥚 役立ちからワンタップ出品" });
      v6SaveAll(); v6.shopTab = "reserve"; switchView("shop"); showToast("🥚 ショップ「予約・テスト販売」へ下書き出品しました！");
      return;
    }
    if (t.closest("#v6RmAddBtn")) {
      const proj = getProjectById(state.currentRoomId);
      const date = document.getElementById("v6RmDate")?.value;
      const title = document.getElementById("v6RmTitle")?.value.trim();
      if (!proj || !date || !title) { showToast("日付と工程を入力してください"); return; }
      proj.boards.roadmap = proj.boards.roadmap || [];
      proj.boards.roadmap.push({ id: "rm-" + Date.now(), title, date, done: false });
      saveProjectState(proj); renderActiveEnRoom(); showToast("🗓️ ロードマップ＆カレンダーへ追加しました！");
      return;
    }
    if (t.closest("#v6RoadmapToTodosBtn")) {
      const proj = getProjectById(state.currentRoomId);
      (proj?.boards?.roadmap || []).forEach(r => {
        if (!(proj.todos || []).some(td => td.title === r.title)) {
          proj.todos.push({ id: "td-" + Date.now() + Math.random(), title: r.title, priority: "mid", date: r.date, comment: "ロードマップ連動", done: r.done, source: { tab: "tools", refId: "roadmap" } });
        }
      });
      saveProjectState(proj); showToast("✅ ロードマップの工程をやることへ一括登録しました！");
      return;
    }
    if (t.closest("#v6PtAddBtn")) {
      const proj = getProjectById(state.currentRoomId);
      const recipe = document.getElementById("v6PtRecipe")?.value.trim();
      const memo = document.getElementById("v6PtMemo")?.value.trim();
      if (!proj || !recipe) { showToast("配合を入力してください"); return; }
      proj.boards.protos = proj.boards.protos || [];
      proj.boards.protos.push({ id: "pr-" + Date.now(), ver: `v${proj.boards.protos.length + 1}`, recipe, memo });
      saveProjectState(proj); renderActiveEnRoom(); showToast("🧪 新しい試作バージョンを記録しました！");
      return;
    }
    const aiVote = t.closest("[data-v6-ai-to-vote]");
    if (aiVote) {
      const proj = getProjectById(state.currentRoomId);
      const ai = ENJOY_V6_DATA.aiSuggestions.find(x => x.id === aiVote.dataset.v6AiToVote);
      if (proj && ai) {
        proj.votes = proj.votes || [];
        proj.votes.unshift({
          id: "vt-" + Date.now(), title: `【AI提案】${ai.title} 採用する？`, deadline: "2026-12-10",
          url: ai.url, costNote: ai.costNote, memberApproved: 1, memberTotal: Math.max(2, (proj.members || []).length), isPublic: false,
          options: [{ id: "vo-1", label: "👍 これで進める", memberVotes: 0, fanVotes: 0 }, { id: "vo-2", label: "🔍 他案も比較する", memberVotes: 0, fanVotes: 0 }], myChoice: null
        });
        saveProjectState(proj); renderActiveEnRoom(); showToast("🗳️ AI提案を多数決ボードへ候補追加しました！");
      }
      return;
    }
    const tSort = t.closest("[data-v6-todo-sort]");
    if (tSort) { v6.todoSort = tSort.dataset.v6TodoSort; renderActiveEnRoom(); return; }

    // 役立ち（全体タブ）50:50発掘登録
    if (t.closest("#v6TipsFiftySample")) {
      document.getElementById("v6TipsFiftyName").value = "マルシェ用 折りたたみ木製ディスプレイ棚（3段）";
      document.getElementById("v6TipsFiftyUrl").value = "https://search.rakuten.co.jp/search/mall/マルシェ+木製+ディスプレイ棚/";
      document.getElementById("v6TipsFiftyComment").value = "軽自動車に積めて設営3分！小瓶ジャムがすごく映えます。";
      return;
    }
    if (t.closest("#v6TipsFiftySubmit")) {
      const name = document.getElementById("v6TipsFiftyName")?.value.trim();
      const url = document.getElementById("v6TipsFiftyUrl")?.value.trim() || "";
      const comment = document.getElementById("v6TipsFiftyComment")?.value.trim();
      if (!name || !comment) { showToast("商品名と現場コメントを入力してください"); return; }
      const author = state.profile.displayName || "あなた";
      const hit = v6.fiftyItems.find(x => x.name === name);
      if (hit) {
        hit.reviews.push({ id: "rv-" + Date.now(), author, authorId: "me", text: comment, likes: 0, applied: 0 });
        showToast("🔥 既存商品カードに1商品統合し、レビューを追加しました！");
      } else {
        v6.fiftyItems.unshift({ id: "ff-" + Date.now(), name, category: "🚜 作り手のガチ愛用品", discoverer: author, discovererId: "me", pairing: "EN•ラボ開発商品との掛け合わせにおすすめ！", url, stats: { op: 0, disc: 0, maker: 0 }, lastRouteMsg: "", reviews: [{ id: "rv-" + Date.now(), author, authorId: "me", text: comment, likes: 0, applied: 0 }] });
        v6GainExp(10); v6AddNenrin("👑 50:50に神資材を初発掘！", name);
        showToast("👑 最初の発掘者（先見の明ボーナス対象）として登録しました！");
      }
      document.getElementById("v6TipsFiftyName").value = ""; document.getElementById("v6TipsFiftyUrl").value = ""; document.getElementById("v6TipsFiftyComment").value = "";
      v6SaveAll(); v6.shopTab = "fifty"; switchView("shop");
      return;
    }

    // ショップ＆50:50
    const sTab = t.closest("#v6ShopTabs [data-shoptab]");
    if (sTab) { v6.shopTab = sTab.dataset.shoptab; v6RenderShopPage(); return; }
    const buyEc = t.closest("[data-v6-buy-ec]");
    if (buyEc) { v6LogAction("ECテスト購入", buyEc.dataset.v6BuyEc); showToast(`🛒 テスト購入を記録：${buyEc.dataset.v6BuyEc}`); return; }
    const stBtn = t.closest("[data-v6-open-story]");
    if (stBtn) {
      const p = (v6.ecProducts.sudachi || []).find(x => x.id === stBtn.dataset.v6OpenStory);
      if (p) v6OpenModal("🧪 開発のストーリー", `<span class="stage-pill">${escapeHtml(p.badge)}</span><h3 class="card-title" style="margin-top:8px;">${escapeHtml(p.name)}</h3><p class="card-desc" style="margin-top:6px;">${escapeHtml(p.story)}</p><div class="safety-banner"><strong>🗳️ 公開多数決の裏話</strong><p>${escapeHtml(p.voteHistory || "")}</p></div><div class="v6-stack">${(p.members || []).map(m => `<div class="friend-row"><div><strong>${escapeHtml(m.name)}</strong><div class="mini-note">${escapeHtml(m.role)} ／ ${escapeHtml(m.note)}</div></div></div>`).join("")}</div>`);
      return;
    }
    const rvR = t.closest("[data-v6-rv-react]");
    if (rvR) {
      const [iid, rvid, fld] = rvR.dataset.v6RvReact.split("|");
      const rv = v6.fiftyItems.find(x => x.id === iid)?.reviews.find(r => r.id === rvid);
      if (rv) { rv[fld] = (rv[fld] || 0) + 1; v6SaveAll(); v6RenderShopPage(); showToast(fld === "applied" ? "🛠️ 現場で活かした！を記録（リンク確率UP）" : "👍 いいねしました！"); }
      return;
    }
    const buy50 = t.closest("[data-v6-fifty-buy]");
    if (buy50) { const [iid, via] = buy50.dataset.v6FiftyBuy.split("|"); v6ExecuteFiftyClick(iid, via || null); return; }
    const addRv = t.closest("[data-v6-add-rv]");
    if (addRv) {
      const item = v6.fiftyItems.find(x => x.id === addRv.dataset.v6AddRv);
      if (!item) return;
      v6OpenModal("🛠️ 現場レビューを追加", `<p class="mini-note" style="margin-bottom:6px;">対象：${escapeHtml(item.name)}</p><textarea id="v6NewRvInp" class="text-area" rows="3" placeholder="現場で活かした一言..."></textarea><button id="v6SaveRvBtn" type="button" class="btn btn-primary btn-full" style="margin-top:8px;">追加する</button>`);
      document.getElementById("v6SaveRvBtn").onclick = () => {
        const txt = document.getElementById("v6NewRvInp").value.trim();
        if (!txt) return;
        item.reviews.push({ id: "rv-" + Date.now(), author: state.profile.displayName || "あなた", authorId: "me", text: txt, likes: 0, applied: 0 });
        v6SaveAll(); v6CloseModal(); v6RenderShopPage(); showToast("🛠️ 現場レビューを追加しました！");
      };
      return;
    }
  });

  document.body.addEventListener("input", (e) => {
    const calcKey = e.target.dataset?.v6Calc;
    if (calcKey) {
      const proj = getProjectById(state.currentRoomId);
      if (proj) { proj.boards = proj.boards || {}; proj.boards.calc = proj.boards.calc || {}; proj.boards.calc[calcKey] = e.target.value; saveProjectState(proj); v6RecalcCostBoard(); }
    }
    const cKey = e.target.dataset?.v6Concept;
    if (cKey) {
      const proj = getProjectById(state.currentRoomId);
      if (proj) { proj.boards = proj.boards || {}; proj.boards.concept = proj.boards.concept || {}; proj.boards.concept[cKey] = e.target.value; saveProjectState(proj); }
    }
  });

  document.body.addEventListener("change", (e) => {
    const pickB = e.target.dataset?.v6PickBoard;
    if (pickB) {
      const proj = getProjectById(state.currentRoomId);
      if (proj) {
        proj.boards = proj.boards || { active: ["calc", "vote"] };
        if (e.target.checked && !proj.boards.active.includes(pickB)) proj.boards.active.push(pickB);
        if (!e.target.checked) proj.boards.active = proj.boards.active.filter(x => x !== pickB);
        v6.logs = v6NormalizeLogs(v6.logs);
        v6.logs.toolUsage[pickB] = (v6.logs.toolUsage[pickB] || 0) + 1;
        saveProjectState(proj); v6SaveAll(); renderActiveEnRoom();
      }
    }
    const tdChk = e.target.closest("[data-v6-todo-chk]");
    if (tdChk) {
      const proj = getProjectById(state.currentRoomId);
      const td = (proj?.todos || []).find(x => x.id === tdChk.dataset.v6TodoChk);
      if (td) { td.done = !td.done; v6GainExp(5); saveProjectState(proj); renderActiveEnRoom(); }
    }
  });
});
// === v6_part2.js 完結 ===