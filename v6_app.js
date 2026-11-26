/* =========================================================
   EN•joy v6 拡張ロジック（前半：2モード・QR・登録補助・ホーム・つぶやき）
   ※v5原本の app.js を書き換えずにそのまま拡張します
========================================================= */

const v6 = {
  enMeta: EnjoyStore.load(V6_STORAGE_KEYS.EN_META, cloneObj(ENJOY_V6_DATA.initialEnMeta)),
  friends: EnjoyStore.load(V6_STORAGE_KEYS.FRIENDS, cloneObj(ENJOY_V6_DATA.initialFriends)),
  ecProducts: EnjoyStore.load(V6_STORAGE_KEYS.EC_PRODUCTS, cloneObj(ENJOY_V6_DATA.initialEcProducts)),
  fiftyItems: EnjoyStore.load(V6_STORAGE_KEYS.FIFTY_ITEMS, cloneObj(ENJOY_V6_DATA.initialFiftyItems)),
  nenrin: EnjoyStore.load(V6_STORAGE_KEYS.NENRIN, cloneObj(ENJOY_V6_DATA.initialNenrin)),
  logs: EnjoyStore.load(V6_STORAGE_KEYS.LOGS, {
    anonId: "TEST-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
    events: [],
    clicksByTab: { home: 1, feed: 0, en: 0, tips: 0, shop: 0 },
    hesitations: 0,
    discordWebhook: ""
  }),
  heatmap: EnjoyStore.load(V6_STORAGE_KEYS.HEATMAP, []),
  shopTab: "sudachi",
  roomSwipeSlide: 0,
  heatmapVisible: false,
  lastActionLabel: "初回表示",
  hesitationTimer: null,
  reviewTargetItemId: null
};

function v6SaveAll() {
  EnjoyStore.save(V6_STORAGE_KEYS.EN_META, v6.enMeta);
  EnjoyStore.save(V6_STORAGE_KEYS.FRIENDS, v6.friends);
  EnjoyStore.save(V6_STORAGE_KEYS.EC_PRODUCTS, v6.ecProducts);
  EnjoyStore.save(V6_STORAGE_KEYS.FIFTY_ITEMS, v6.fiftyItems);
  EnjoyStore.save(V6_STORAGE_KEYS.NENRIN, v6.nenrin);
  EnjoyStore.save(V6_STORAGE_KEYS.LOGS, v6.logs);
  EnjoyStore.save(V6_STORAGE_KEYS.HEATMAP, v6.heatmap.slice(-150));
}

function v6AddNenrin(title, detail) {
  v6.nenrin.unshift({ date: getNowTimeStr(), title, detail });
  if (v6.nenrin.length > 25) v6.nenrin.pop();
  v6SaveAll();
}

function v6GainExp(pt) {
  v6.enMeta.enExp = (v6.enMeta.enExp || 15) + pt;
  v6SaveAll();
}

function v6SwitchSiteMode(targetMode) {
  const next = targetMode || (getSiteMode() === "initial" ? "mature" : "initial");
  setSiteMode(next);
  location.reload();
}

/* ==================== 中央❓付き専用QR SVG生成 ==================== */
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
    <svg viewBox="0 0 92 92" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      <rect width="92" height="92" fill="#ffffff" rx="6"/>
      ${rects}
      <rect x="32" y="32" width="28" height="28" rx="6" fill="${col}" stroke="#ffffff" stroke-width="2"/>
      <text x="46" y="51.5" text-anchor="middle" font-size="16" font-weight="800" fill="#ffffff">❓</text>
    </svg>
  `;
}

/* ==================== v5のコア関数を安全に拡張ラップ ==================== */
const _v5BuildBusinessCardHTML = buildBusinessCardHTML;
buildBusinessCardHTML = function (p, mode) {
  const baseHtml = _v5BuildBusinessCardHTML(p, mode);
  const enType = (p === state.profile ? v6.enMeta.enType : p.enType) || "開拓ハチドリ型";
  const enColor = (p === state.profile ? v6.enMeta.enColor : p.enColor) || "#3D664A";
  const seed = (p === state.profile ? v6.enMeta.enSeed : p.enSeed) || `${p.displayName || "ENJOY"}-${enType}`;
  const qrHtml = `
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

const _v5SwitchView = switchView;
switchView = function (viewName) {
  _v5SwitchView(viewName);
  if (typeof v6LogAction === "function") v6LogAction("画面切替", viewName);
  v6RenderAll();
};

const _v5RenderAll = renderAll;
renderAll = function () {
  _v5RenderAll();
  v6RenderAll();
};

/* ==================== つぶやき＆動画（4タブ＋友達のみ・SNSシェア・SOS直行） ==================== */
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

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-callout">
        <strong>💬 該当する投稿はまだありません</strong>
        <p>SOS・開発の裏側・みんなの声を最初の1件として投稿してみませんか？</p>
        <button type="button" class="btn btn-accent btn-sm" onclick="document.getElementById('feedPostModal').classList.remove('hidden')">＋ 投稿してみる</button>
      </div>
    `;
    return;
  }

  const badgeMap = {
    rescue: { cls: "rescue", label: "🆘 SOS・緊急" },
    behind: { cls: "general", label: "🎬 開発の裏側" },
    voice: { cls: "general", label: "🗣️ みんなの声" },
    general: { cls: "general", label: "🗣️ みんなの声" }
  };

  container.innerHTML = list.map(f => {
    const isRescue = f.type === "rescue";
    const b = badgeMap[f.type] || badgeMap.general;
    const deadlineTag = f.deadline ? ` ・ ⏰ 期限:${escapeHtml(f.deadline)}` : "";
    return `
      <article class="feed-card ${isRescue ? "rescue-card" : ""}">
        <div class="feed-head">
          <div class="feed-author-wrap">
            <div class="feed-avatar">${f.roleIcon || "🌱"}</div>
            <div>
              <div class="feed-author">${escapeHtml(f.author)}</div>
              <div class="feed-meta">📍 ${escapeHtml(f.area || "関西")} ・ ${escapeHtml(f.time || "たった今")}${deadlineTag}</div>
            </div>
          </div>
          <span class="feed-badge ${b.cls}">${b.label}</span>
        </div>
        <p class="feed-body">${escapeHtml(f.text)}</p>
        ${renderMediaTag(f.media, "feed-media")}
        <div class="feed-actions">
          <div class="feed-action-left">
            <button type="button" class="btn btn-outline btn-sm" data-v6-like-feed="${f.id}">👏 応援 (${f.likes || 0})</button>
            ${isRescue ? `<button type="button" class="btn btn-primary btn-sm" data-v6-rescue-to-lab="${f.id}">🧪 EN•ラボ起動</button>` : ""}
            ${isRescue ? `<button type="button" class="btn btn-accent btn-sm" data-v6-go-rescue="1">🆘 レスキュー便</button>` : ""}
            <button type="button" class="btn btn-outline btn-sm" data-v6-share-sns="${f.id}">📤 X/インスタ共有</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
};

/* ==================== v5のUIへv6パーツを自動注入（v5デザイン完全維持） ==================== */
function v6InjectStaticUI() {
  const isMature = getSiteMode() === "mature";

  // 1. ヘッダー＆開発バーに「最初のサイト ⇄ 使い込み」切替・🪺巣・📊分析ボタンを追加
  const headerCtrls = document.querySelector(".header-controls");
  if (headerCtrls && !document.getElementById("v6ModeBtn")) {
    const modeBtn = document.createElement("button");
    modeBtn.id = "v6ModeBtn";
    modeBtn.type = "button";
    modeBtn.className = `chip-btn ${isMature ? "chip-mode-mature" : "chip-mode-initial"}`;
    modeBtn.textContent = isMature ? "🌳 使い込み中→最初へ" : "🐣 最初→使い込みへ";
    modeBtn.onclick = () => v6SwitchSiteMode();

    const nestBtn = document.createElement("button");
    nestBtn.id = "v6NestBtn";
    nestBtn.type = "button";
    nestBtn.className = "chip-btn";
    nestBtn.title = "enちゃんの巣（育成）";
    nestBtn.textContent = "🪺";
    nestBtn.onclick = () => v6OpenNestModal();

    const logBtn = document.createElement("button");
    logBtn.id = "v6LogBtn";
    logBtn.type = "button";
    logBtn.className = "chip-btn";
    logBtn.title = "テスト行動ログ・ヒートマップ・Discord送信";
    logBtn.textContent = "📊";
    logBtn.onclick = () => v6OpenLogsModal();

    headerCtrls.insertBefore(modeBtn, document.getElementById("openRegBtn"));
    headerCtrls.insertBefore(nestBtn, document.getElementById("openRegBtn"));
    headerCtrls.insertBefore(logBtn, document.getElementById("openRegBtn"));
  }

  const devBar = document.getElementById("devFloatingBar");
  if (devBar && !document.getElementById("v6DevModeBtn")) {
    const b = document.createElement("button");
    b.id = "v6DevModeBtn";
    b.type = "button";
    b.className = "chip-btn";
    b.textContent = isMature ? "🐣 最初の登録へ" : "🌳 使い込み画面を見る";
    b.onclick = () => v6SwitchSiteMode();
    devBar.insertBefore(b, document.getElementById("devResetBtn"));
  }

  // リセットボタンを2モード分離クリア対応に上書き
  ["resetToStartBtn", "devResetBtn"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      if (confirm("現在のモードのテストデータを初期化してやり直しますか？")) {
        EnjoyStore.clearCurrentMode();
        location.reload();
      }
    }, true);
  });

  // 2. 登録進捗バー横に「🌳 使い込み後を見る」＆ Step 1〜4へ「✨ 入力イメージ」注入
  const progTop = document.querySelector(".reg-progress-top");
  if (progTop && !document.getElementById("v6JumpMatureBtn")) {
    const jump = document.createElement("button");
    jump.id = "v6JumpMatureBtn";
    jump.type = "button";
    jump.className = "btn-link";
    jump.style.fontSize = "0.74rem";
    jump.textContent = "🌳 使い込み後を見る";
    jump.onclick = () => v6SwitchSiteMode("mature");
    progTop.appendChild(jump);
  }

  v6AttachSampleBtn('.step-panel[data-panel="1"] .reg-step-head', "v6RegSample1", () => {
    state.profile.mainRole = "material";
    state.profile.userStage = "maker";
    saveProfile();
    renderRoleTiles();
    renderStep2Content();
    renderStep3ByStage();
    renderStep4AccountUI();
    showToast("✨ Step 1 の入力イメージをセットしました");
  });

  v6AttachSampleBtn('.step-panel[data-panel="2"] .reg-step-head', "v6RegSample2", () => {
    if (!state.profile.mainRole) state.profile.mainRole = "material";
    state.profile.activities = ["果樹・フルーツ", "規格外品の提供", "マルシェ出店"];
    state.profile.subRoles = ["deliver"];
    state.profile.userStage = "maker";
    saveProfile();
    renderStep2Content();
    renderStep3ByStage();
    renderStep4AccountUI();
    showToast("✨ Step 2 の入力イメージをセットしました");
  });

  v6AttachSampleBtn('.step-panel[data-panel="3"] .reg-step-head', "v6RegSample3", () => {
    state.profile.capacityTags = ["週30〜50kgまで供給可", "規格外・B品の定期提供OK"];
    state.profile.capacity = "完熟みかんを季節ごとに週50kgまで提供できます";
    state.profile.pride = "糖度14度以上の減農薬みかんを家族で丁寧に育てています。";
    state.profile.secretPride = "試作1回目の規格外B品は材料実費のみで提供OKです！";
    v6.enMeta.enType = "開拓ハチドリ型";
    v6.enMeta.enColor = "#3D664A";
    saveProfile();
    v6SaveAll();
    syncFormFromProfile();
    renderStep3ByStage();
    v6RenderEnDiagChips();
    showToast("✨ Step 3 の入力イメージをセットしました");
  });

  const step4Head = document.querySelector('.step-panel[data-panel="4"] .card:nth-of-type(2) .card-title');
  if (step4Head && !document.getElementById("v6RegSample4")) {
    const wrap = document.createElement("div");
    wrap.className = "v6-row-between";
    wrap.style.marginBottom = "8px";
    step4Head.parentNode.insertBefore(wrap, step4Head);
    wrap.appendChild(step4Head);
    const btn = document.createElement("button");
    btn.id = "v6RegSample4";
    btn.type = "button";
    btn.className = "btn-sample-fill";
    btn.textContent = "✨ 入力イメージ";
    btn.onclick = () => {
      state.profile.displayName = "ねやがわ農園 佐藤";
      state.profile.ageGroup = "30代";
      state.profile.exactAge = "36";
      state.profile.area = "大阪府 寝屋川市 香里園";
      state.profile.profileBio = "寝屋川で旬の果物を栽培中！規格外フルーツを使った小瓶ジャムコラボ募集中です。";
      state.profile.companyName = "ねやがわ農園";
      state.profile.phone = "090-1234-5678";
      v6.enMeta.enSeed = "SATO-" + Date.now();
      saveProfile();
      v6SaveAll();
      syncFormFromProfile();
      renderAgeGroups();
      showToast("✨ Step 4 の入力イメージをセットしました");
    };
    wrap.appendChild(btn);
  }

  // 3. Step 3の診断バーを「enちゃん自己診断（中央❓QR）」へアップグレード
  const diagBar = document.querySelector(".diag-mini-bar");
  if (diagBar && !document.getElementById("v6EnDiagBox")) {
    const box = document.createElement("div");
    box.id = "v6EnDiagBox";
    box.className = "card card-soft";
    box.style.cssText = "padding:12px;margin-top:12px;margin-bottom:0;";
    box.innerHTML = `
      <div class="v6-row-between">
        <strong style="font-size:0.84rem;">🐣 自分だけのenちゃん自己診断（中央❓QR発行）</strong>
        <span class="status-tag">テスト版：❓表記</span>
      </div>
      <p class="mini-note" style="margin:3px 0 8px;">スタンスを選ぶと、あなた専用の❓付きQRコードが名刺に入ります。</p>
      <div id="v6EnDiagChips" class="chip-group chip-group-sm" style="margin-bottom:0;"></div>
    `;
    diagBar.replaceWith(box);
    v6RenderEnDiagChips();
  }

  // 4. ボトムナビの名称を「EN•ラボ」「役立ち」「ショップ」に統一
  document.querySelectorAll("#bottomNav .nav-item").forEach(btn => {
    const t = btn.dataset.tab;
    const ico = btn.querySelector(".nav-icon");
    const lbl = btn.querySelector("span:last-child");
    if (t === "en") { if (ico) ico.textContent = "🧪"; if (lbl) lbl.textContent = "EN•ラボ"; }
    if (t === "tips" && lbl) lbl.textContent = "役立ち";
    if (t === "shop" && lbl) lbl.textContent = "ショップ";
  });

  // EN一覧画面の見出しも「EN•ラボ」へ統一
  const enH2 = document.querySelector("#view-en h2");
  if (enH2) enH2.textContent = "🧪 EN•ラボ（開発ルーム）";
  const enCta = document.querySelector('#view-home [data-goto-tab="en"]');
  if (enCta) enCta.textContent = "🧪 EN•ラボを見る";

  // 5. つぶやき4タブ（すべて / SOS / 開発の裏側 / みんなの声 / 友達のみ）へ更新
  const feedBar = document.getElementById("feedFilterBar");
  if (feedBar) {
    feedBar.innerHTML = `
      <button type="button" class="filter-chip active" data-feedfilter="all">すべて</button>
      <button type="button" class="filter-chip" data-feedfilter="rescue">🆘 SOS</button>
      <button type="button" class="filter-chip" data-feedfilter="behind">🎬 開発の裏側</button>
      <button type="button" class="filter-chip" data-feedfilter="voice">🗣️ みんなの声</button>
      <button type="button" class="filter-chip" data-feedfilter="friends">🤝 友達のみ</button>
    `;
  }

  // つぶやき投稿モーダルにもタイプ＆期限＆入力例を追加
  const feedSwitch = document.getElementById("feedTypeSwitch");
  if (feedSwitch && !feedSwitch.dataset.v6Ready) {
    feedSwitch.dataset.v6Ready = "1";
    feedSwitch.style.gridTemplateColumns = "repeat(3, 1fr)";
    feedSwitch.innerHTML = `
      <button type="button" class="seg-btn active" data-feedtype="voice">🗣️ みんなの声</button>
      <button type="button" class="seg-btn" data-feedtype="rescue">🆘 SOS</button>
      <button type="button" class="seg-btn" data-feedtype="behind">🎬 開発の裏側</button>
    `;
    state.feedPostType = "voice";
    const feedModalHead = document.querySelector("#feedPostModal .modal-head h3");
    if (feedModalHead) {
      const sb = document.createElement("button");
      sb.type = "button";
      sb.className = "btn-sample-fill";
      sb.textContent = "✨ 入力例";
      sb.onclick = () => {
        state.feedPostType = "rescue";
        feedSwitch.querySelectorAll(".seg-btn").forEach(b => b.classList.toggle("active", b.dataset.feedtype === "rescue"));
        document.getElementById("feedTextInput").value = "【🆘SOS・12/05まで】雨上がりで形が不揃いな完熟いちご15kg！ジャムやスイーツ試作に活かせる方いませんか？🍓";
      };
      feedModalHead.after(sb);
    }
  }

  // 6. ホーム画面にファーストビュー固定アンカー＆友達リスト＆年輪を差し込み
  const homeMain = document.querySelector("#view-home .home-main");
  if (homeMain && !document.getElementById("v6HomeQuickAnchors")) {
    const anchors = document.createElement("div");
    anchors.id = "v6HomeQuickAnchors";
    anchors.className = "home-quick-anchors";
    anchors.innerHTML = `
      <button type="button" class="home-anchor-tile" id="v6GoNenrinBtn"><span>🪵</span><strong>年輪</strong><small id="v6AnchorNenrinSub">歩み 1件</small></button>
      <button type="button" class="home-anchor-tile" id="v6GoSettingsBtn"><span>⚙️</span><strong>設定</strong><small>登録・切替</small></button>
      <button type="button" class="home-anchor-tile" id="v6GoContactBtn"><span>✉️</span><strong>お問い合わせ</strong><small>テスト感想</small></button>
    `;
    homeMain.prepend(anchors);

    const extraWrap = document.createElement("div");
    extraWrap.id = "v6HomeExtraBlocks";
    extraWrap.innerHTML = `
      <div class="card">
        <div class="card-head-row">
          <h3 class="card-title">🤝 友達リスト ＆ 対面❓QR交換</h3>
          <span id="v6FriendCountPill" class="stage-pill">0人</span>
        </div>
        <div class="home-cta-row" style="margin-bottom:10px;">
          <button id="v6ScanQrBtn" type="button" class="btn btn-primary btn-sm">📷 対面❓QR読込テスト</button>
          <button id="v6HomeNestBtn" type="button" class="btn btn-outline btn-sm">🪺 enちゃんの巣を見る</button>
        </div>
        <div id="v6HomeFriendsList" class="v6-list-stack"></div>
      </div>
      <div class="card" id="v6NenrinSection">
        <div class="card-head-row">
          <h3 class="card-title">🪵 年輪（EN•joyの歩み）</h3>
          <span id="v6NenrinCountPill" class="stage-pill">1件</span>
        </div>
        <div id="v6NenrinList" class="nenrin-timeline"></div>
      </div>
    `;
    homeMain.appendChild(extraWrap);
  }

  // 7. オーバーレイ（長押しプレビュー・ヒートマップ）＆ v6共通モーダル群を body に追加
  if (!document.getElementById("v6OverlaysRoot")) {
    const root = document.createElement("div");
    root.id = "v6OverlaysRoot";
    root.innerHTML = `
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
    document.getElementById("v6GenericModal").onclick = (e) => {
      if (e.target.id === "v6GenericModal") v6CloseModal();
    };
  }
}

function v6AttachSampleBtn(selector, id, handler) {
  const el = document.querySelector(selector);
  if (!el || document.getElementById(id)) return;
  const btn = document.createElement("button");
  btn.id = id;
  btn.type = "button";
  btn.className = "btn-sample-fill";
  btn.style.marginTop = "6px";
  btn.textContent = "✨ 入力イメージを入れる";
  btn.onclick = handler;
  el.appendChild(btn);
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

function v6RenderHomeExtra() {
  const fCnt = v6.friends.filter(f => f.isFriend).length;
  const fPill = document.getElementById("v6FriendCountPill");
  const fList = document.getElementById("v6HomeFriendsList");
  if (fPill) fPill.textContent = `${fCnt}人`;
  if (fList) {
    fList.innerHTML = v6.friends.map(f => `
      <div class="friend-row">
        <div>
          <strong style="font-size:0.86rem;">${escapeHtml(f.name)}</strong>
          <span class="mini-note" style="margin-left:6px;">${escapeHtml(f.role)}・${escapeHtml(f.area)}</span>
          <div class="mini-note">${escapeHtml(f.bio)}</div>
        </div>
        <button type="button" class="btn ${f.isFriend ? "btn-outline" : "btn-primary"} btn-sm" data-v6-toggle-friend="${f.id}">
          ${f.isFriend ? "友達済" : "＋友達登録"}
        </button>
      </div>
    `).join("");
  }

  const nSub = document.getElementById("v6AnchorNenrinSub");
  const nPill = document.getElementById("v6NenrinCountPill");
  const nList = document.getElementById("v6NenrinList");
  if (nSub) nSub.textContent = `歩み ${v6.nenrin.length}件`;
  if (nPill) nPill.textContent = `${v6.nenrin.length}件`;
  if (nList) {
    nList.innerHTML = v6.nenrin.map(n => `
      <div class="nenrin-item">
        <strong>${escapeHtml(n.title)}</strong> <span class="mini-note">${escapeHtml(n.date)}</span>
        <div class="mini-note">${escapeHtml(n.detail)}</div>
      </div>
    `).join("");
  }
}

function v6OpenModal(title, html) {
  document.getElementById("v6ModalTitle").textContent = title;
  document.getElementById("v6ModalBody").innerHTML = html;
  document.getElementById("v6GenericModal").classList.remove("hidden");
}
function v6CloseModal() {
  document.getElementById("v6GenericModal").classList.add("hidden");
}

/* =========================================================
   EN•joy v6 拡張ロジック（後半：EN•ラボ／役立ち／ショップ50:50／ログ＆ヒートマップ）
========================================================= */

/* ==================== EN•ラボ（スワイプカレンダー・4タブ・カスタムボード） ==================== */
function v6InjectLabAndShops() {
  // 1. EN•ラボ上部バーへ「＋友達招待」「LINE共有」を追加
  const topbar = document.querySelector("#view-en-room .room-topbar");
  if (topbar && !document.getElementById("v6RoomInviteBtn")) {
    const grp = document.createElement("div");
    grp.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;align-items:center;";
    grp.innerHTML = `
      <button id="v6RoomInviteBtn" type="button" class="btn btn-outline btn-sm">＋友達招待</button>
      <button id="v6RoomLineBtn" type="button" class="btn btn-outline btn-sm">LINE共有</button>
    `;
    const modeSw = document.getElementById("roomViewModeSwitch");
    topbar.insertBefore(grp, modeSw);
  }

  // 2. 企画まとめカードを横スワイプ枠（企画まとめ ⇄ ルームカレンダー）で包む
  const heroCard = document.querySelector("#view-en-room .room-hero-card");
  if (heroCard && !document.getElementById("v6RoomSwipeWrap")) {
    const wrap = document.createElement("div");
    wrap.id = "v6RoomSwipeWrap";
    wrap.className = "swipe-room-wrap";
    heroCard.parentNode.insertBefore(wrap, heroCard);

    wrap.innerHTML = `
      <div class="swipe-room-track" id="v6RoomSwipeTrack">
        <div class="swipe-room-slide" id="v6SlideSummarySlot"></div>
        <div class="swipe-room-slide">
          <div class="card" style="padding:15px;">
            <div class="v6-row-between" style="margin-bottom:4px;">
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
              <input id="v6CalDate" class="text-input" type="date" style="padding:6px 8px;font-size:0.8rem;" />
              <input id="v6CalTitle" class="text-input" type="text" placeholder="予定を直接追加..." style="padding:6px 8px;font-size:0.8rem;" />
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
    document.getElementById("v6SlideSummarySlot").appendChild(heroCard);

    const badge = document.getElementById("roomStageBadge");
    if (badge && !document.getElementById("v6BtnToCal")) {
      const calBtn = document.createElement("button");
      calBtn.id = "v6BtnToCal";
      calBtn.type = "button";
      calBtn.className = "btn btn-outline btn-sm";
      calBtn.style.cssText = "padding:3px 9px;font-size:0.74rem;margin-left:6px;";
      calBtn.textContent = "📅 予定 →";
      badge.after(calBtn);
    }

    // タッチスワイプ操作
    let sx = 0;
    wrap.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
    wrap.addEventListener("touchend", e => {
      const dx = e.changedTouches[0].clientX - sx;
      if (dx < -40 && v6.roomSwipeSlide === 0) v6SetRoomSwipe(1);
      if (dx > 40 && v6.roomSwipeSlide === 1) v6SetRoomSwipe(0);
    });
  }

  // 3. EN•ラボ内タブを4タブ（ルーム / トーク / やること / 役立ちカスタムボード）へ拡張
  const innerTabs = document.getElementById("roomInnerTabs");
  if (innerTabs && !innerTabs.classList.contains("room-tabs-4")) {
    innerTabs.classList.add("room-tabs-4");
    innerTabs.innerHTML = `
      <button type="button" data-roomtab="members">🏠 ルーム</button>
      <button type="button" class="active" data-roomtab="talk">💬 トーク</button>
      <button type="button" data-roomtab="todo">✅ やること</button>
      <button type="button" data-roomtab="tools">🧰 役立ち</button>
    `;

    const memPanel = document.getElementById("roomTabMembers");
    const todoDiv = document.createElement("div");
    todoDiv.id = "v6RoomTabTodo";
    todoDiv.className = "hidden";
    todoDiv.innerHTML = `
      <div class="card">
        <div class="v6-row-between" style="margin-bottom:8px;">
          <h3 class="card-title" style="margin:0;">✅ やること（カレンダー自動反映）</h3>
          <button id="v6TodoSampleBtn" type="button" class="btn-sample-fill">✨ 入力例</button>
        </div>
        <div class="cal-add-row" style="margin-bottom:10px;">
          <input id="v6TodoDate" class="text-input" type="date" style="padding:7px 8px;font-size:0.82rem;" />
          <input id="v6TodoTitle" class="text-input" type="text" placeholder="やることを入力..." style="padding:7px 8px;font-size:0.82rem;" />
          <button id="v6TodoAddBtn" type="button" class="btn btn-primary btn-sm">追加</button>
        </div>
        <div id="v6TodoList" class="v6-list-stack"></div>
      </div>
    `;

    const toolsDiv = document.createElement("div");
    toolsDiv.id = "v6RoomTabTools";
    toolsDiv.className = "hidden";
    toolsDiv.innerHTML = `
      <div class="card card-soft" style="padding:12px;">
        <div class="v6-row-between" style="margin-bottom:6px;">
          <strong style="font-size:0.84rem;">🧰 開発用カスタムボード（使うツールを自由にON/OFF）</strong>
        </div>
        <div id="v6BoardToggleBar" class="board-toggle-bar"></div>
      </div>
      <div id="v6CustomBoardsContainer"></div>
    `;

    memPanel.after(todoDiv, toolsDiv);
  }

  // 4. 全体向け「🥬 役立ち」タブを開放（v5の #wantTipsCount を保持）
  const tipsSec = document.getElementById("view-tips");
  if (tipsSec && !tipsSec.dataset.v6Ready) {
    tipsSec.dataset.v6Ready = "1";
    tipsSec.innerHTML = `
      <div class="en-header">
        <div>
          <p class="eyebrow">旬・マルシェ・原価・50:50発掘</p>
          <h2>🥬 役立ちツール</h2>
        </div>
        <button type="button" class="btn btn-outline btn-sm want-btn" data-want="tips">
          🔔 要望（<span id="wantTipsCount">0</span>）
        </button>
      </div>
      <div class="card">
        <div class="v6-row-between" style="margin-bottom:6px;">
          <h3 class="card-title" style="margin:0;">🧮 簡易原価・利益シミュレーター</h3>
          <span class="stage-pill">EC予約連動</span>
        </div>
        <div class="calc-grid">
          <div><label class="field-label">販売価格(円)</label><input id="v6TipsPrice" class="text-input" type="number" value="880" /></div>
          <div><label class="field-label">材料費(円)</label><input id="v6TipsMat" class="text-input" type="number" value="220" /></div>
          <div><label class="field-label">容器・資材(円)</label><input id="v6TipsPkg" class="text-input" type="number" value="140" /></div>
          <div><label class="field-label">手数料・送料(円)</label><input id="v6TipsFee" class="text-input" type="number" value="120" /></div>
        </div>
        <div id="v6TipsCalcRes" class="calc-result">粗利：¥400（利益率 45.5%）</div>
        <button id="v6TipsToEcBtn" type="button" class="btn btn-primary btn-sm" style="margin-top:10px;">🥚 ショップ「予約・テスト」へ下書き出品</button>
      </div>
      <div class="card">
        <div class="v6-row-between" style="margin-bottom:6px;">
          <h3 class="card-title" style="margin:0;">🔗 現場の神資材を 50:50 へ発掘登録</h3>
          <button id="v6Tips5050Sample" type="button" class="btn-sample-fill">✨ 入力例</button>
        </div>
        <p class="card-desc">最初に見つけた人は永続の<strong>👑先見の明ボーナス（5%）</strong>対象！同じ商品は1カードに統合されます。</p>
        <div class="field-group"><label class="field-label">資材・道具名</label><input id="v6Tips5050Name" class="text-input" type="text" placeholder="例：折りたたみ木製ディスプレイ棚（3段）" /></div>
        <div class="field-group"><label class="field-label">商品URL（楽天・Amazon等・任意）</label><input id="v6Tips5050Url" class="text-input" type="url" placeholder="https://..." /></div>
        <div class="field-group"><label class="field-label">現場で活かした一言レビュー</label><input id="v6Tips5050Comment" class="text-input" type="text" placeholder="例：軽自動車にも積めて設営3分！小瓶ジャムが映えます。" /></div>
        <button id="v6Tips5050Submit" type="button" class="btn btn-accent btn-sm">⚖️ 50:50 に発掘登録する</button>
      </div>
      <div class="card card-soft">
        <h3 class="card-title">📰 関西マルシェ・旬ヒント（夜間リサーチ連動枠）</h3>
        <p class="mini-note" style="margin-top:6px;">・🍊 人気急上昇：無添加・120g小瓶・常温手土産ジャム</p>
        <p class="mini-note">・📍 関西マルシェ：大阪・京都の週末マルシェ出店募集（今月3件）</p>
        <p class="mini-note">・✨ 先取りチャンス：他県ヒット×関西0件の「規格外フルーツ×小ロット加工」</p>
      </div>
    `;
  }

  // 5. 「🛍️ ショップ ＆ 50:50」タブを開放（v5の #wantShopCount を保持）
  const shopSec = document.getElementById("view-shop");
  if (shopSec && !shopSec.dataset.v6Ready) {
    shopSec.dataset.v6Ready = "1";
    shopSec.innerHTML = `
      <div class="en-header">
        <div>
          <p class="eyebrow">巣立ち・予約・レスキュー・50:50</p>
          <h2>🛍️ ショップ ＆ 50:50</h2>
        </div>
        <button type="button" class="btn btn-outline btn-sm want-btn" data-want="shop">
          🔔 応援（<span id="wantShopCount">0</span>）
        </button>
      </div>
      <div class="filter-bar" id="v6ShopTabs">
        <button type="button" class="filter-chip active" data-shoptab="sudachi">🎉 巣立ち商品</button>
        <button type="button" class="filter-chip" data-shoptab="reserve">🥚 予約・テスト</button>
        <button type="button" class="filter-chip" data-shoptab="rescue">🆘 レスキュー便</button>
        <button type="button" class="filter-chip" data-shoptab="fifty">⚖️ 50:50</button>
      </div>
      <div id="v6ShopContainer"></div>
    `;
  }

  // 投稿モーダルにも「✨ 入力例」を追加
  const postHead = document.querySelector("#postModal .modal-head h3");
  if (postHead && !document.getElementById("v6PostSampleBtn")) {
    const sb = document.createElement("button");
    sb.id = "v6PostSampleBtn";
    sb.type = "button";
    sb.className = "btn-sample-fill";
    sb.textContent = "✨ 入力例";
    sb.onclick = () => {
      document.getElementById("projTitle").value = "完熟いちごの無添加シロップ";
      document.getElementById("projGoal").value = "規格外いちごを炭酸割りや手土産になる150ml小瓶シロップに50本試作！";
      document.getElementById("projArea").value = "大阪府 寝屋川市";
      document.getElementById("projTag").value = "小ロット試作OK";
      document.getElementById("offerText").value = "来週、完熟いちごが15kgほど余りそうです！加工コラボ相手を探しています。";
    };
    postHead.after(sb);
  }
}

/* ==================== v5の EN•ラボ描画関数を拡張ラップ ==================== */
const _v5OpenEnRoom = openEnRoom;
openEnRoom = function (projId) {
  _v5OpenEnRoom(projId);
  v6SetRoomSwipe(0);
};

const _v5RenderActiveEnRoom = renderActiveEnRoom;
renderActiveEnRoom = function () {
  _v5RenderActiveEnRoom();
  const proj = getProjectById(state.currentRoomId);
  if (!proj) return;

  const tab = state.roomInnerTab || "talk";
  document.getElementById("roomTabMembers")?.classList.toggle("hidden", tab !== "members");
  document.getElementById("roomTabTalk")?.classList.toggle("hidden", tab !== "talk");
  document.getElementById("v6RoomTabTodo")?.classList.toggle("hidden", tab !== "todo");
  document.getElementById("v6RoomTabTools")?.classList.toggle("hidden", tab !== "tools");

  const memBtn = document.querySelector('#roomInnerTabs [data-roomtab="members"]');
  const appLen = (proj.applicants || []).length;
  if (memBtn) memBtn.textContent = appLen > 0 ? `🏠 ルーム(${appLen})` : "🏠 ルーム";

  // トーク各発言に「📅 予定登録」「✅ やること化」ボタンを追加
  if (tab === "talk") {
    document.querySelectorAll("#roomChatMessages .chat-msg-footer").forEach(ft => {
      if (ft.querySelector("[data-v6-talk-date]")) return;
      const pinBtn = ft.querySelector("[data-toggle-pin]");
      if (!pinBtn) return;
      const mid = pinBtn.dataset.togglePin;
      const m = (proj.messages || []).find(x => x.id === mid);
      const dBtn = document.createElement("button");
      dBtn.type = "button";
      dBtn.className = `pin-msg-btn ${m?.dateTag ? "pinned" : ""}`;
      dBtn.dataset.v6TalkDate = mid;
      dBtn.textContent = m?.dateTag ? `📅 ${m.dateTag.slice(5)}` : "📅 予定登録";

      const tBtn = document.createElement("button");
      tBtn.type = "button";
      tBtn.className = "pin-msg-btn";
      tBtn.dataset.v6TalkToTodo = mid;
      tBtn.textContent = "✅ やることへ";
      ft.append(dBtn, tBtn);
    });
  }

  v6RenderRoomCalendar(proj);
  if (tab === "todo") v6RenderRoomTodos(proj);
  if (tab === "tools") v6RenderRoomTools(proj);
};

function v6SetRoomSwipe(idx) {
  v6.roomSwipeSlide = idx;
  const track = document.getElementById("v6RoomSwipeTrack");
  if (track) track.style.transform = `translateX(-${idx * 100}%)`;
  document.querySelectorAll("#v6SwipeDots .swipe-dot").forEach((d, i) => d.classList.toggle("active", i === idx));
}

function v6RenderRoomCalendar(proj) {
  const el = document.getElementById("v6RoomCalList");
  if (!el || !proj) return;
  const events = [];
  (proj.todos || []).forEach(t => { if (t.date) events.push({ date: t.date, type: "todo", title: t.title, tab: "todo" }); });
  (proj.votes || []).forEach(v => { if (v.deadline) events.push({ date: v.deadline, type: "vote", title: `投票締切：${v.title}`, tab: "tools" }); });
  (proj.messages || []).forEach(m => { if (m.dateTag) events.push({ date: m.dateTag, type: "talk", title: `${m.sender}：${m.text.slice(0, 18)}…`, tab: "talk" }); });
  (proj.calendarExtras || []).forEach(c => events.push({ date: c.date, type: c.type || "road", title: c.title, tab: c.sourceTab || "todo" }));
  events.sort((a, b) => a.date.localeCompare(b.date));

  el.innerHTML = events.map(ev => `
    <div class="cal-item" data-v6-cal-warp="${ev.tab}">
      <div><i class="cal-dot ${ev.type}"></i><strong>${escapeHtml(ev.date.slice(5))}</strong> ${escapeHtml(ev.title)}</div>
      <span class="mini-note">開く →</span>
    </div>
  `).join("") || `<p class="mini-note">予定はまだありません（やること・トーク・多数決から自動集約されます）</p>`;
}

function v6RenderRoomTodos(proj) {
  const el = document.getElementById("v6TodoList");
  if (!el) return;
  proj.todos = proj.todos || [];
  el.innerHTML = proj.todos.map(t => `
    <div class="todo-item ${t.done ? "done" : ""}">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
        <input type="checkbox" data-v6-todo-chk="${t.id}" ${t.done ? "checked" : ""} />
        <span>${escapeHtml(t.title)}</span>
      </label>
      <span class="stage-pill">${t.date ? escapeHtml(t.date.slice(5)) : "期日なし"}</span>
    </div>
  `).join("") || `<p class="mini-note">まだやることはありません。上から追加するとカレンダーへ自動反映されます。</p>`;
}

function v6EnsureBoards(proj) {
  if (!proj.boards) {
    proj.boards = {
      active: ["vote", "calc", "concept", "proto", "label", "sales", "links"],
      concept: "", proto: "", label: "", sales: "", links: ""
    };
  }
  return proj.boards;
}

function v6RenderRoomTools(proj) {
  const bar = document.getElementById("v6BoardToggleBar");
  const wrap = document.getElementById("v6CustomBoardsContainer");
  if (!bar || !wrap) return;

  const b = v6EnsureBoards(proj);
  bar.innerHTML = ENJOY_V6_DATA.customBoards.map(cb => `
    <button type="button" class="select-chip chip-quick ${b.active.includes(cb.id) ? "selected" : ""}" data-v6-toggle-board="${cb.id}">
      ${cb.label}
    </button>
  `).join("");

  let html = "";

  // 1. 多数決ボード（メンバー全員承認 → 一般公開）
  if (b.active.includes("vote")) {
    proj.votes = proj.votes || [];
    const votesHtml = proj.votes.map(v => {
      const total = (v.options || []).reduce((s, o) => s + (o.votes || 0), 0) || 1;
      const app = v.memberApproved || 1;
      const memTot = v.memberTotal || Math.max(2, (proj.members || []).length);
      return `
        <div class="card card-soft" style="padding:12px;margin-bottom:8px;">
          <div class="v6-row-between">
            <strong style="font-size:0.86rem;">🗳️ ${escapeHtml(v.title)}</strong>
            <span class="stage-pill">${v.isPublic ? "🌐 一般公開中（ファン投票OK）" : `🔒 承認 ${app}/${memTot}人`}</span>
          </div>
          <div class="mini-note">締切：${v.deadline ? escapeHtml(v.deadline) : "未定"}</div>
          ${(v.options || []).map(o => {
            const pct = Math.round(((o.votes || 0) / total) * 100);
            return `
              <button type="button" class="vote-opt-btn ${v.myChoice === o.id ? "selected" : ""}" data-v6-vote="${v.id}|${o.id}">
                <div style="display:flex;justify-content:space-between;"><span>${escapeHtml(o.label)}</span><span>${o.votes || 0}票 (${pct}%)</span></div>
                <div class="vote-bar"><i style="width:${pct}%"></i></div>
              </button>
            `;
          }).join("")}
          ${!v.isPublic ? `<button type="button" class="btn btn-outline btn-sm" style="margin-top:8px;" data-v6-approve-vote="${v.id}">✅ 一般公開を承認する（全員承認で外部ファンへ公開）</button>` : ""}
        </div>
      `;
    }).join("") || `<p class="mini-note">まだ多数決はありません。</p>`;

    html += `
      <div class="card">
        <div class="v6-row-between" style="margin-bottom:8px;">
          <h3 class="card-title" style="margin:0;">🗳️ 多数決ボード（全員承認で一般公開）</h3>
          <button id="v6VoteSampleBtn" type="button" class="btn-sample-fill">✨ 入力例</button>
        </div>
        ${votesHtml}
        <div class="field-group" style="margin-top:8px;margin-bottom:6px;"><input id="v6VoteTitle" class="text-input" type="text" placeholder="新しい議題を入力..." /></div>
        <div class="two-col-fields" style="margin-bottom:6px;">
          <input id="v6VoteOpt1" class="text-input" type="text" placeholder="選択肢1" />
          <input id="v6VoteOpt2" class="text-input" type="text" placeholder="選択肢2" />
        </div>
        <div class="inline-add">
          <input id="v6VoteDeadline" class="text-input" type="date" />
          <button id="v6VoteCreateBtn" type="button" class="btn btn-accent btn-sm">作成</button>
        </div>
      </div>
    `;
  }

  // 2. 原価シミュレーター
  if (b.active.includes("calc")) {
    html += `
      <div class="card">
        <div class="v6-row-between" style="margin-bottom:6px;">
          <h3 class="card-title" style="margin:0;">🧮 原価・利益シミュレーター</h3>
          <span class="stage-pill">EC予約連動</span>
        </div>
        <div class="calc-grid">
          <div><label class="field-label">販売価格(円)</label><input id="v6LabPrice" class="text-input" type="number" value="880" /></div>
          <div><label class="field-label">材料費(円)</label><input id="v6LabMat" class="text-input" type="number" value="220" /></div>
          <div><label class="field-label">容器・資材(円)</label><input id="v6LabPkg" class="text-input" type="number" value="140" /></div>
          <div><label class="field-label">手数料・送料(円)</label><input id="v6LabFee" class="text-input" type="number" value="120" /></div>
        </div>
        <div id="v6LabCalcRes" class="calc-result">粗利：¥400（利益率 45.5%）</div>
        <button id="v6LabDraftEcBtn" type="button" class="btn btn-primary btn-sm" style="margin-top:8px;">🥚 この価格でショップ「予約・テスト」へ下書き</button>
      </div>
    `;
  }

  // 3. 各種開発メモボード（コンセプト・試作・食品表示・販売方法・リンク＆50:50）
  const memoDefs = [
    { id: "concept", title: "📝 コンセプトメモ", ph: "ターゲット・商品の強み・開発ストーリー..." },
    { id: "proto", title: "🍳 試作記録ボード", ph: "試作回数・配合・糖度・試食会の感想..." },
    { id: "label", title: "🏷️ 食品表示・パッケージメモ", ph: "原材料・アレルゲン・日持ち・保存方法・容器（120g小瓶など）..." },
    { id: "sales", title: "🛍️ 販売方法・販路ボード", ph: "先行予約・関西マルシェ・実店舗テスト販売などの計画..." },
    { id: "links", title: "🔗 リンク共有 ＆ 50:50発掘メモ", ph: "参考URL・現場で使ったおすすめ資材や道具..." }
  ];
  memoDefs.forEach(md => {
    if (!b.active.includes(md.id)) return;
    html += `
      <div class="card">
        <div class="v6-row-between" style="margin-bottom:6px;">
          <h3 class="card-title" style="margin:0;">${md.title}</h3>
          ${md.id === "links" ? `<button type="button" class="btn btn-outline btn-sm" onclick="switchView('tips')">⚖️ 50:50へ登録する →</button>` : `<span class="mini-note">自動保存</span>`}
        </div>
        <textarea class="text-area" rows="2" data-v6-board-memo="${md.id}" placeholder="${md.ph}">${escapeHtml(b[md.id] || "")}</textarea>
      </div>
    `;
  });

  wrap.innerHTML = html || `<div class="card card-soft"><p class="mini-note">上のチップから使いたいボードをONにしてください。</p></div>`;
  v6UpdateLabCalc();
}

function v6UpdateLabCalc() {
  const p = document.getElementById("v6LabPrice");
  const out = document.getElementById("v6LabCalcRes");
  if (!p || !out) return;
  const price = Number(p.value) || 0;
  const cost = (Number(document.getElementById("v6LabMat")?.value) || 0)
    + (Number(document.getElementById("v6LabPkg")?.value) || 0)
    + (Number(document.getElementById("v6LabFee")?.value) || 0);
  const profit = price - cost;
  const rate = price > 0 ? ((profit / price) * 100).toFixed(1) : "0.0";
  out.textContent = `粗利：¥${profit.toLocaleString()}（利益率 ${rate}%）`;
}

function v6UpdateTipsCalc() {
  const p = document.getElementById("v6TipsPrice");
  const out = document.getElementById("v6TipsCalcRes");
  if (!p || !out) return;
  const price = Number(p.value) || 0;
  const cost = (Number(document.getElementById("v6TipsMat")?.value) || 0)
    + (Number(document.getElementById("v6TipsPkg")?.value) || 0)
    + (Number(document.getElementById("v6TipsFee")?.value) || 0);
  const profit = price - cost;
  const rate = price > 0 ? ((profit / price) * 100).toFixed(1) : "0.0";
  out.textContent = `粗利：¥${profit.toLocaleString()}（利益率 ${rate}%）`;
}

/* ==================== ショップ ＆ 50:50（リンク交互切替） ==================== */
function v6RenderShop() {
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
        <p class="card-desc" style="margin-bottom:10px;">${escapeHtml(p.story)}</p>
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

  // 50:50（ポイント制なし・リンク交互切替・友達愛用優先表示）
  const friendIds = new Set(v6.friends.filter(f => f.isFriend).map(f => f.id));
  const sorted = [...v6.fiftyItems].sort((a, b) => {
    const aF = a.reviews.some(r => friendIds.has(r.authorId)) ? 1 : 0;
    const bF = b.reviews.some(r => friendIds.has(r.authorId)) ? 1 : 0;
    return bF - aF;
  });

  wrap.innerHTML = `
    <div class="card card-soft" style="padding:12px;">
      <strong style="font-size:0.84rem;">⚖️ 50:50 リンク交互切替（ポイント制なし・超軽量）</strong>
      <p class="mini-note" style="margin-top:4px;">・誰かのレビュー経由：<strong>👑発掘者 5%（先見の明）＋ 🗣️紹介者 45% ＋ 🌱運営 50%</strong></p>
      <p class="mini-note">・一覧から直接購入：<strong>👑発掘者 15% ＋ 🛠️愛用者 35%（活かした数で確率UP）＋ 🌱運営 50%</strong></p>
    </div>
  ` + sorted.map(item => {
    const hasFriend = item.reviews.some(r => friendIds.has(r.authorId));
    const totalClicks = (item.stats.op || 0) + (item.stats.disc || 0) + (item.stats.maker || 0);
    return `
      <div class="card">
        <div class="v6-row-between" style="margin-bottom:6px;">
          <span class="stage-pill">${escapeHtml(item.category)}</span>
          <span class="stage-pill" style="background:var(--orange-soft);color:var(--orange);">🔥 ${item.reviews.length}人が愛用中</span>
        </div>
        <h3 class="card-title">${escapeHtml(item.name)}</h3>
        <div class="mini-note">
          👑 最初に見つけた人：<strong>${escapeHtml(item.discoverer)}</strong>
          ${hasFriend ? ` ／ <strong style="color:var(--green);">🤝 友達が愛用中</strong>` : ""}
        </div>
        <div class="pairing-box">🤝 <strong>掛け合わせ提案：</strong>${escapeHtml(item.pairing)}</div>
        ${item.reviews.map(rv => `
          <div class="review-box">
            <div><strong>${escapeHtml(rv.author)}</strong>の現場レビュー：</div>
            <div style="margin-top:2px;">${escapeHtml(rv.text)}</div>
            <div class="review-actions">
              <button type="button" class="btn btn-outline btn-sm" data-v6-rv-react="${item.id}|${rv.id}|likes">👍 いいね (${rv.likes})</button>
              <button type="button" class="btn btn-outline btn-sm" data-v6-rv-react="${item.id}|${rv.id}|applied">🛠️ 活かした！ (${rv.applied})</button>
              <button type="button" class="btn btn-primary btn-sm" data-v6-fifty-buy="${item.id}|${escapeHtml(rv.author)}">このレビュー経由で買う</button>
            </div>
          </div>
        `).join("")}
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
          <button type="button" class="btn btn-accent btn-sm" data-v6-fifty-buy="${item.id}|">⚖️ 一覧から直接購入（リンク切替テスト）</button>
          <button type="button" class="btn btn-outline btn-sm" data-v6-add-rv="${item.id}">＋ レビュー追加</button>
          ${item.url ? `<a class="btn btn-outline btn-sm" href="${escapeHtml(item.url)}" target="_blank" rel="noopener" style="text-decoration:none;">🔗 楽天等で確認</a>` : ""}
        </div>
        ${totalClicks > 0 ? `<div class="rotation-log">${escapeHtml(item.lastRouteMsg)}<br/>累計(${totalClicks}回)：運営 ${item.stats.op} / 👑発掘者 ${item.stats.disc} / 作り手 ${item.stats.maker}</div>` : ""}
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
      const totalW = weights.reduce((a, b) => a + b, 0);
      let pick = Math.random() * totalW;
      let chosen = item.reviews[0].author;
      for (let i = 0; i < item.reviews.length; i++) {
        pick -= weights[i];
        if (pick <= 0) { chosen = item.reviews[i].author; break; }
      }
      winner = `🛠️ 愛用者【${chosen}】リンク（現場コメント優遇 35%枠）`;
    }
  }
  item.lastRouteMsg = `最新クリック遷移先 → ${winner}`;
  v6SaveAll();
  v6RenderShop();
  v6LogAction("50:50クリック", `${item.name} -> ${winner}`);
  showToast(`リンク自動切替：${winner}`);
}

/* ==================== 行動ログ・5秒無操作迷い検知・ヒートマップ ==================== */
function v6LogAction(type, detail) {
  v6.lastActionLabel = `${type}:${detail}`;
  const tabKey = state.activeView === "en-room" ? "en" : state.activeView;
  if (type === "画面切替" && v6.logs.clicksByTab[tabKey] !== undefined) {
    v6.logs.clicksByTab[tabKey] += 1;
  }
  v6.logs.events.unshift({ time: getNowTimeStr(), tab: state.activeView, type, detail });
  if (v6.logs.events.length > 60) v6.logs.events.pop();
  v6SaveAll();
  v6ResetHesitationTimer();
}

function v6ResetHesitationTimer() {
  clearTimeout(v6.hesitationTimer);
  v6.hesitationTimer = setTimeout(() => {
    v6.logs.hesitations = (v6.logs.hesitations || 0) + 1;
    v6.logs.events.unshift({
      time: getNowTimeStr(),
      tab: state.activeView,
      type: "迷い検知(5秒無操作)",
      detail: `画面:${state.activeView} / Y:${Math.round(window.scrollY)}px / 直前:${v6.lastActionLabel}`
    });
    if (v6.logs.events.length > 60) v6.logs.events.pop();
    v6SaveAll();
  }, 5000);
}

function v6RenderHeatmapOverlay() {
  const layer = document.getElementById("v6HeatmapLayer");
  if (!layer) return;
  layer.classList.toggle("hidden", !v6.heatmapVisible);
  if (!v6.heatmapVisible) return;
  const pts = v6.heatmap.filter(p => p.view === state.activeView).slice(-80);
  layer.innerHTML = pts.map(p => `<span class="heat-dot" style="left:${p.x}%;top:${p.y}%;"></span>`).join("");
}

/* ==================== 長押し「うっすらプレビュー」 ==================== */
function v6SetupNavLongPress() {
  const overlay = document.getElementById("v6PeekOverlay");
  const card = document.getElementById("v6PeekCard");
  if (!overlay || !card) return;

  const peekText = (tab) => {
    if (tab === "home") return `<strong>🏠 ホーム プレビュー</strong><br/>友達：${v6.friends.filter(f => f.isFriend).length}人 ／ 年輪：${v6.nenrin.length}件`;
    if (tab === "feed") return `<strong>💬 つぶやき プレビュー</strong><br/>投稿：${state.feeds.length}件（SOS ${state.feeds.filter(f => f.type === "rescue").length}件）`;
    if (tab === "en") return `<strong>🧪 EN•ラボ プレビュー</strong><br/>進行中企画：${state.projects.length}件 ／ 素材置き場：${state.offers.length}件`;
    if (tab === "tips") return `<strong>🥬 役立ち プレビュー</strong><br/>原価シミュレーター・50:50神資材発掘・関西マルシェヒント`;
    return `<strong>🛍️ ショップ ＆ 50:50 プレビュー</strong><br/>巣立ち：${v6.ecProducts.sudachi.length}件 ／ 50:50：${v6.fiftyItems.length}件`;
  };

  document.querySelectorAll("#bottomNav .nav-item").forEach(btn => {
    const tab = btn.dataset.tab;
    let timer = null;
    let didLong = false;
    const start = () => {
      didLong = false;
      clearTimeout(timer);
      timer = setTimeout(() => {
        didLong = true;
        card.innerHTML = peekText(tab);
        overlay.classList.remove("hidden");
        v6LogAction("長押しプレビュー", tab);
      }, 420);
    };
    const end = () => { clearTimeout(timer); overlay.classList.add("hidden"); };

    btn.addEventListener("click", (e) => {
      if (didLong) { didLong = false; e.stopImmediatePropagation(); }
    }, true);
    btn.addEventListener("mousedown", start);
    btn.addEventListener("mouseup", end);
    btn.addEventListener("mouseleave", end);
    btn.addEventListener("touchstart", start, { passive: true });
    btn.addEventListener("touchend", end);
    btn.addEventListener("touchcancel", end);
    btn.addEventListener("contextmenu", e => e.preventDefault());
  });
}

/* ==================== 各種モーダル（巣・ログ・QR・設定・お問い合わせ・ストーリー） ==================== */
function v6OpenNestModal() {
  const exp = v6.enMeta.enExp || 15;
  const lv = Math.floor(exp / 25) + 1;
  const icon = exp < 40 ? "🥚" : (exp < 80 ? "🐣" : (exp < 130 ? "🐥" : "🕊️"));
  const phase = exp < 40 ? "タマゴ期（アイデア温め中）" : (exp < 80 ? "孵化・ヒナ期（試作スタート）" : (exp < 130 ? "若鳥期（マルシェ準備中）" : "巣立ち達成！"));
  v6OpenModal("🪺 enちゃんの巣（育成）", `
    <div style="text-align:center;padding:8px 0;">
      <div style="font-size:3.2rem;margin-bottom:6px;">${icon}</div>
      <h3>${escapeHtml(v6.enMeta.enType)}（Lv.${lv}）</h3>
      <span class="stage-pill">${phase}</span>
      <p class="card-desc" style="margin-top:10px;">経験値：<strong>${exp}pt</strong>（やること・多数決・友達登録・50:50発掘で成長）</p>
      <button id="v6CareBtn" type="button" class="btn btn-primary btn-sm">🌱 声をかけて育てる（+10pt）</button>
    </div>
  `);
  document.getElementById("v6CareBtn").onclick = () => {
    v6GainExp(10);
    v6AddNenrin("🪺 enちゃんの巣でお世話", `経験値が ${v6.enMeta.enExp}pt になりました`);
    v6OpenNestModal();
    v6RenderHomeExtra();
    showToast("🥚 enちゃんが成長しました！（+10pt）");
  };
}

function v6OpenLogsModal() {
  const evHtml = (v6.logs.events || []).slice(0, 10).map(e =>
    `<li><strong>${escapeHtml(e.time)}</strong> [${escapeHtml(e.tab)}] ${escapeHtml(e.type)}：${escapeHtml(e.detail)}</li>`
  ).join("") || "<li class='mini-note'>まだログがありません</li>";

  v6OpenModal(`📊 テスト行動ログ（匿名ID: ${v6.logs.anonId}）`, `
    <div class="quick-stats" style="grid-template-columns:repeat(3,1fr);margin-bottom:10px;">
      <div class="stat-box"><span class="stat-num">${v6.logs.hesitations || 0}</span><span class="stat-lbl">迷い検知(5秒)</span></div>
      <div class="stat-box"><span class="stat-num">${v6.logs.events.length}</span><span class="stat-lbl">ログ件数</span></div>
      <div class="stat-box"><span class="stat-num">${v6.heatmap.length}</span><span class="stat-lbl">タップ座標</span></div>
    </div>
    <button id="v6ToggleHeatBtn" type="button" class="btn btn-outline btn-sm btn-full" style="margin-bottom:10px;">
      🔥 タップ密度ヒートマップ表示：${v6.heatmapVisible ? "ON（クリックでOFF）" : "OFF（クリックでON）"}
    </button>
    <p class="mini-note" style="margin-bottom:6px;">タブ別：ホーム(${v6.logs.clicksByTab.home}) / つぶやき(${v6.logs.clicksByTab.feed}) / EN•ラボ(${v6.logs.clicksByTab.en}) / 役立ち(${v6.logs.clicksByTab.tips}) / ショップ(${v6.logs.clicksByTab.shop})</p>
    <ul style="margin:0 0 12px;padding-left:18px;font-size:0.78rem;">${evHtml}</ul>
    <label class="field-label">Discord Webhook URL（任意・テスト報告用）</label>
    <input id="v6WebhookInp" class="text-input" type="text" value="${escapeHtml(v6.logs.discordWebhook || "")}" placeholder="https://discord.com/api/webhooks/..." />
    <button id="v6SendDiscordBtn" type="button" class="btn btn-primary btn-full" style="margin-top:8px;">📤 Discordへログを送信</button>
  `);
  document.getElementById("v6ToggleHeatBtn").onclick = () => {
    v6.heatmapVisible = !v6.heatmapVisible;
    v6RenderHeatmapOverlay();
    v6OpenLogsModal();
  };
  document.getElementById("v6SendDiscordBtn").onclick = async () => {
    const url = document.getElementById("v6WebhookInp").value.trim();
    v6.logs.discordWebhook = url;
    v6SaveAll();
    if (!url) { showToast("Webhook URLを入力してください"); return; }
    const content = `🧪 **EN•joy v6 テストログ (${v6.logs.anonId} / ${getSiteMode()})**\n・迷い検知(5秒無操作): ${v6.logs.hesitations}回\n・タップ記録: ${v6.heatmap.length}点\n・タブ別: ${JSON.stringify(v6.logs.clicksByTab)}\n・直近: ${v6.logs.events.slice(0, 4).map(e => `${e.time} ${e.type}(${e.detail})`).join(" / ")}`;
    try {
      await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
      showToast("✅ Discordへログを送信しました！");
    } catch { showToast("⚠️ 送信エラー（URLや通信を確認してください）"); }
  };
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
    v6GainExp(10);
    v6AddNenrin("🤝 対面❓QRで友達登録", "京都・宇治茶ファーム 佐々木さんとつながりました");
    v6CloseModal();
    renderAll();
    showToast("🤝 ❓QRから友達登録が完了しました！");
  };
}

function v6OpenStoryModal(prodId) {
  const p = (v6.ecProducts.sudachi || []).find(x => x.id === prodId);
  if (!p) return;
  v6OpenModal("🧪 開発のストーリー", `
    <span class="stage-pill">${escapeHtml(p.badge)}</span>
    <h3 class="card-title" style="margin-top:8px;">${escapeHtml(p.name)}</h3>
    <p class="card-desc" style="margin-top:6px;">${escapeHtml(p.story)}</p>
    <div class="safety-banner" style="margin-bottom:12px;">
      <strong>🗳️ 開発ルームの多数決で決まった裏話</strong>
      <p>${escapeHtml(p.voteHistory || "")}</p>
    </div>
    <strong style="font-size:0.84rem;">🪪 参加メンバーのデジタル名刺</strong>
    <div class="v6-list-stack" style="margin:6px 0 12px;">
      ${(p.members || []).map(m => `<div class="friend-row"><div><strong>${escapeHtml(m.name)}</strong><div class="mini-note">${escapeHtml(m.role)} ／ ${escapeHtml(m.note)}</div></div></div>`).join("")}
    </div>
    <button type="button" class="btn btn-primary btn-full" onclick="v6CloseModal();showToast('🛒 応援購入テストを記録しました！')">🛒 このストーリーを応援して購入（¥${Number(p.price).toLocaleString()}）</button>
  `);
}

function v6RenderAll() {
  v6RenderEnDiagChips();
  v6RenderHomeExtra();
  v6UpdateTipsCalc();
  v6RenderShop();
  v6RenderHeatmapOverlay();
}

/* ==================== v6 起動＆全イベント委譲 ==================== */
document.addEventListener("DOMContentLoaded", () => {
  v6InjectStaticUI();
  v6InjectLabAndShops();
  v6SetupNavLongPress();
  v6RenderAll();
  v6ResetHesitationTimer();

  // タップ座標記録（ヒートマップ用）
  document.addEventListener("pointerdown", (e) => {
    const x = Math.round((e.clientX / window.innerWidth) * 100);
    const y = Math.round((e.clientY / window.innerHeight) * 100);
    v6.heatmap.push({ view: state.activeView, x, y });
    if (v6.heatmap.length > 150) v6.heatmap.shift();
    v6ResetHesitationTimer();
  }, { passive: true });

  // 統一イベント委譲
  document.body.addEventListener("click", (e) => {
    const t = e.target;

    // 自己診断チップ
    const enBtn = t.closest("[data-v6-entype]");
    if (enBtn) {
      v6.enMeta.enType = enBtn.dataset.v6Entype;
      v6.enMeta.enColor = enBtn.dataset.v6Encolor;
      v6.enMeta.enSeed = `${state.profile.displayName || "ENJOY"}-${v6.enMeta.enType}`;
      v6SaveAll();
      v6RenderEnDiagChips();
      renderBusinessCards();
      showToast(`🐣 「${v6.enMeta.enType}」の専用❓QRを発行しました`);
      return;
    }

    // ホーム固定アンカー＆ボタン
    if (t.closest("#v6GoNenrinBtn")) { document.getElementById("v6NenrinSection")?.scrollIntoView({ behavior: "smooth" }); return; }
    if (t.closest("#v6GoSettingsBtn")) {
      v6OpenModal("⚙️ 設定", `
        <div class="v6-list-stack">
          <button type="button" class="btn btn-primary" onclick="v6CloseModal();goStep(1);switchView('register');">✨ 4ステップ登録・名刺編集</button>
          <button type="button" class="btn btn-outline" onclick="v6SwitchSiteMode();">${getSiteMode() === "initial" ? "🌳 使用していった時のサイトへ切替" : "🐣 最初のサイト（登録から）へ切替"}</button>
          <button type="button" class="btn btn-outline" onclick="if(confirm('現在モードのデータを初期化しますか？')){EnjoyStore.clearCurrentMode();location.reload();}">🔄 このモードを初期化</button>
        </div>
      `);
      return;
    }
    if (t.closest("#v6GoContactBtn")) {
      v6OpenModal("✉️ お問い合わせ・テスト感想", `
        <div class="v6-row-between" style="margin-bottom:6px;"><span class="mini-note">使いにくかった点や要望</span><button type="button" class="btn-sample-fill" onclick="document.getElementById('v6ContactTxt').value='スワイプカレンダーと50:50がわかりやすい！';">✨ 入力例</button></div>
        <textarea id="v6ContactTxt" class="text-area" rows="3" placeholder="テストの感想を入力..."></textarea>
        <button type="button" class="btn btn-primary btn-full" style="margin-top:8px;" onclick="const v=document.getElementById('v6ContactTxt').value.trim();if(v){v6LogAction('お問い合わせ',v);v6CloseModal();showToast('✉️ 感想をログへ記録しました！');}">送信する</button>
      `);
      return;
    }
    if (t.closest("#v6ScanQrBtn")) { v6OpenQrScanModal(); return; }
    if (t.closest("#v6HomeNestBtn")) { v6OpenNestModal(); return; }

    // 友達トグル
    const fBtn = t.closest("[data-v6-toggle-friend]");
    if (fBtn) {
      const f = v6.friends.find(x => x.id === fBtn.dataset.v6ToggleFriend);
      if (f) { f.isFriend = !f.isFriend; v6SaveAll(); renderAll(); showToast(f.isFriend ? `🤝 ${f.name}さんと友達になりました！` : `${f.name}さんを解除しました`); }
      return;
    }

    // つぶやきアクション
    const likeFeed = t.closest("[data-v6-like-feed]");
    if (likeFeed) {
      const f = state.feeds.find(x => x.id === likeFeed.dataset.v6LikeFeed);
      if (f) { f.likes = (f.likes || 0) + 1; saveFeedsSafely(); renderFeedView(); }
      return;
    }
    const toLab = t.closest("[data-v6-rescue-to-lab]");
    if (toLab) {
      const f = state.feeds.find(x => x.id === toLab.dataset.v6RescueToLab);
      if (f) createProjectFromSource({ title: `【SOS】${f.text.slice(0, 14)}…`, goal: f.text, area: f.area, kindTabs: ["規格外レスキュー", "新商品開発"], sourceAuthor: f.author, media: f.media });
      return;
    }
    if (t.closest("[data-v6-go-rescue]")) { v6.shopTab = "rescue"; switchView("shop"); showToast("🆘 SOS連動：レスキュー便へ移動しました！"); return; }
    const shareSns = t.closest("[data-v6-share-sns]");
    if (shareSns) {
      const f = state.feeds.find(x => x.id === shareSns.dataset.v6ShareSns);
      if (f) {
        const txt = encodeURIComponent(`${f.text} #ENjoy関西`);
        window.open(`https://twitter.com/intent/tweet?text=${txt}`, "_blank");
        showToast("📤 X/インスタ用シェア文を作成しました！");
      }
      return;
    }

    // EN•ラボ スワイプ・カレンダー・招待・LINE
    if (t.closest("#v6BtnToCal")) { v6SetRoomSwipe(1); return; }
    if (t.closest("#v6BtnToSummary")) { v6SetRoomSwipe(0); return; }
    const dot = t.closest("#v6SwipeDots .swipe-dot");
    if (dot) { v6SetRoomSwipe(Number(dot.dataset.rslide)); return; }
    const calWarp = t.closest("[data-v6-cal-warp]");
    if (calWarp) {
      state.roomInnerTab = calWarp.dataset.v6CalWarp;
      document.querySelectorAll("#roomInnerTabs button").forEach(b => b.classList.toggle("active", b.dataset.roomtab === state.roomInnerTab));
      v6SetRoomSwipe(0);
      renderActiveEnRoom();
      showToast("元ネタのタブへワープしました！");
      return;
    }
    if (t.closest("#v6CalAddBtn")) {
      const proj = getProjectById(state.currentRoomId);
      const date = document.getElementById("v6CalDate")?.value;
      const title = document.getElementById("v6CalTitle")?.value.trim();
      if (!proj || !date || !title) { showToast("日付と予定名を入力してください"); return; }
      proj.calendarExtras = proj.calendarExtras || [];
      proj.calendarExtras.push({ id: "ce-" + Date.now(), type: "road", date, title, sourceTab: "todo" });
      document.getElementById("v6CalTitle").value = "";
      saveProjectState(proj);
      v6RenderRoomCalendar(proj);
      showToast("📅 カレンダーに予定を追加しました！");
      return;
    }
    if (t.closest("#v6RoomInviteBtn")) {
      const proj = getProjectById(state.currentRoomId);
      const frs = v6.friends.filter(f => f.isFriend);
      v6OpenModal("🤝 友達をEN•ラボへ招待", frs.length
        ? `<div class="v6-list-stack">${frs.map(f => `<div class="friend-row"><div><strong>${escapeHtml(f.name)}</strong><div class="mini-note">${escapeHtml(f.role)}</div></div><button type="button" class="btn btn-primary btn-sm" data-v6-inv-do="${escapeHtml(f.name)}">招待</button></div>`).join("")}</div>`
        : `<p class="mini-note">まだ友達がいません。ホームの「📷 対面❓QR読込テスト」から追加できます。</p>`
      );
      return;
    }
    const invDo = t.closest("[data-v6-inv-do]");
    if (invDo) {
      const proj = getProjectById(state.currentRoomId);
      if (proj) {
        proj.messages = proj.messages || [];
        proj.messages.push({ id: "m-" + Date.now(), who: "sys", sender: "システム", text: `🤝 友達の「${invDo.dataset.v6InvDo}」さんをEN•ラボへ招待しました！`, pinned: false, time: getNowTimeStr() });
        saveProjectState(proj);
        v6CloseModal();
        renderActiveEnRoom();
        showToast(`🎉 ${invDo.dataset.v6InvDo}さんを招待しました！`);
      }
      return;
    }
    if (t.closest("#v6RoomLineBtn")) {
      const proj = getProjectById(state.currentRoomId);
      window.open(`https://line.me/R/msg/text/?${encodeURIComponent(`【EN•ラボ招待】${proj?.title || "EN•joy"}に参加しよう！`)}`, "_blank");
      return;
    }

    // トーク → カレンダー予定登録 / やること登録
    const tdBtn = t.closest("[data-v6-talk-date]");
    if (tdBtn) {
      const proj = getProjectById(state.currentRoomId);
      const m = (proj?.messages || []).find(x => x.id === tdBtn.dataset.v6TalkDate);
      if (!m) return;
      const d = prompt("カレンダーに登録する日付 (YYYY-MM-DD)", m.dateTag || "2026-12-12");
      if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) { m.dateTag = d; saveProjectState(proj); renderActiveEnRoom(); showToast(`📅 カレンダー(${d})へ自動集約しました！`); }
      return;
    }
    const ttBtn = t.closest("[data-v6-talk-to-todo]");
    if (ttBtn) {
      const proj = getProjectById(state.currentRoomId);
      const m = (proj?.messages || []).find(x => x.id === ttBtn.dataset.v6TalkToTodo);
      if (!proj || !m) return;
      proj.todos = proj.todos || [];
      proj.todos.unshift({ id: "td-" + Date.now(), title: m.text.slice(0, 28), date: m.dateTag || "", done: false });
      saveProjectState(proj);
      v6RenderRoomCalendar(proj);
      showToast("✅ トークの決定事項を「やること」へ登録しました！");
      return;
    }

    // やること入力例・追加
    if (t.closest("#v6TodoSampleBtn")) {
      document.getElementById("v6TodoTitle").value = "小ロット印刷会社に和紙ラベル見積もりを依頼";
      document.getElementById("v6TodoDate").value = "2026-12-09";
      return;
    }
    if (t.closest("#v6TodoAddBtn")) {
      const proj = getProjectById(state.currentRoomId);
      const title = document.getElementById("v6TodoTitle")?.value.trim();
      const date = document.getElementById("v6TodoDate")?.value || "";
      if (!proj || !title) { showToast("やることを入力してください"); return; }
      proj.todos = proj.todos || [];
      proj.todos.unshift({ id: "td-" + Date.now(), title, date, done: false });
      document.getElementById("v6TodoTitle").value = "";
      saveProjectState(proj);
      renderActiveEnRoom();
      showToast(date ? "✅ 追加＆カレンダーへ反映しました！" : "✅ やることを追加しました！");
      return;
    }

    // カスタムボードON/OFF・多数決作成・投票・全員承認→一般公開
    const bToggle = t.closest("[data-v6-toggle-board]");
    if (bToggle) {
      const proj = getProjectById(state.currentRoomId);
      if (!proj) return;
      const b = v6EnsureBoards(proj);
      toggleArrayItem(b.active, bToggle.dataset.v6ToggleBoard);
      saveProjectState(proj);
      v6RenderRoomTools(proj);
      return;
    }
    if (t.closest("#v6VoteSampleBtn")) {
      document.getElementById("v6VoteTitle").value = "初回テスト販売の価格帯、どっちがいい？";
      document.getElementById("v6VoteOpt1").value = "¥880（手土産ギフト仕様）";
      document.getElementById("v6VoteOpt2").value = "¥750（まずは試しやすい価格）";
      document.getElementById("v6VoteDeadline").value = "2026-12-07";
      return;
    }
    if (t.closest("#v6VoteCreateBtn")) {
      const proj = getProjectById(state.currentRoomId);
      const title = document.getElementById("v6VoteTitle")?.value.trim();
      const o1 = document.getElementById("v6VoteOpt1")?.value.trim();
      const o2 = document.getElementById("v6VoteOpt2")?.value.trim();
      const dl = document.getElementById("v6VoteDeadline")?.value || "2026-12-10";
      if (!proj || !title || !o1 || !o2) { showToast("議題と選択肢を2つ入力してください"); return; }
      proj.votes = proj.votes || [];
      proj.votes.unshift({
        id: "vt-" + Date.now(), title, deadline: dl,
        memberApproved: 1, memberTotal: Math.max(2, (proj.members || []).length), isPublic: false,
        options: [{ id: "vo-1", label: o1, votes: 0 }, { id: "vo-2", label: o2, votes: 0 }], myChoice: null
      });
      saveProjectState(proj);
      renderActiveEnRoom();
      showToast("🗳️ 多数決を作成＆締切をカレンダーへ集約しました！");
      return;
    }
    const vBtn = t.closest("[data-v6-vote]");
    if (vBtn) {
      const proj = getProjectById(state.currentRoomId);
      const [vid, oid] = vBtn.dataset.v6Vote.split("|");
      const v = (proj?.votes || []).find(x => x.id === vid);
      if (!v) return;
      if (v.myChoice) { const p = v.options.find(o => o.id === v.myChoice); if (p) p.votes = Math.max(0, p.votes - 1); }
      v.myChoice = oid;
      const cur = v.options.find(o => o.id === oid);
      if (cur) cur.votes = (cur.votes || 0) + 1;
      v6GainExp(5);
      saveProjectState(proj);
      v6RenderRoomTools(proj);
      showToast("🗳️ 投票しました！");
      return;
    }
    const appVote = t.closest("[data-v6-approve-vote]");
    if (appVote) {
      const proj = getProjectById(state.currentRoomId);
      const v = (proj?.votes || []).find(x => x.id === appVote.dataset.v6ApproveVote);
      if (!v) return;
      v.memberApproved = (v.memberApproved || 1) + 1;
      if (v.memberApproved >= (v.memberTotal || 2)) {
        v.isPublic = true;
        v6AddNenrin("🌐 多数決が全員承認 → 一般公開！", v.title);
        showToast("🎉 メンバー全員承認！外部ファンにも一般公開されました！");
      } else {
        showToast(`✅ 承認しました（${v.memberApproved}/${v.memberTotal}人）`);
      }
      saveProjectState(proj);
      v6RenderRoomTools(proj);
      return;
    }

    // 原価計算 → EC予約下書き（ラボ内 / 役立ちタブ共通）
    if (t.closest("#v6LabDraftEcBtn") || t.closest("#v6TipsToEcBtn")) {
      const isLab = !!t.closest("#v6LabDraftEcBtn");
      const price = Number(document.getElementById(isLab ? "v6LabPrice" : "v6TipsPrice")?.value) || 880;
      const proj = isLab ? getProjectById(state.currentRoomId) : null;
      v6.ecProducts.reserve.unshift({
        id: "ec-r" + Date.now(),
        name: `【テスト下書き】${proj ? proj.title : (state.profile.displayName || "EN•joy") + "コラボ商品"}`,
        price, makers: state.profile.displayName || "あなた",
        stock: "小ロット30個予定（売れ残りゼロ製造）", badge: "🥚 シミュレーターから下書き"
      });
      v6AddNenrin("🥚 EC予約・テスト販売へ下書き出品", `販売予定価格 ¥${price.toLocaleString()}`);
      v6.shopTab = "reserve";
      switchView("shop");
      showToast("🥚 ショップの「予約・テスト」へ反映しました！");
      return;
    }

    // 役立ち → 50:50 発掘登録
    if (t.closest("#v6Tips5050Sample")) {
      document.getElementById("v6Tips5050Name").value = "マルシェ用 折りたたみ木製ディスプレイ棚（3段）";
      document.getElementById("v6Tips5050Url").value = "https://search.rakuten.co.jp/search/mall/マルシェ+木製+ディスプレイ棚/";
      document.getElementById("v6Tips5050Comment").value = "軽自動車にも積めて設営3分！小瓶ジャムがすごく映えます。";
      return;
    }
    if (t.closest("#v6Tips5050Submit")) {
      const name = document.getElementById("v6Tips5050Name")?.value.trim();
      const url = document.getElementById("v6Tips5050Url")?.value.trim() || "";
      const comment = document.getElementById("v6Tips5050Comment")?.value.trim();
      if (!name || !comment) { showToast("商品名と現場コメントを入力してください"); return; }
      const author = state.profile.displayName || "あなた";
      const existing = v6.fiftyItems.find(x => x.name === name);
      if (existing) {
        existing.reviews.push({ id: "rv-" + Date.now(), author, authorId: "me", text: comment, likes: 0, applied: 0 });
        showToast("🔥 既存商品カードへ1商品統合し、現場レビューを追加しました！");
      } else {
        v6.fiftyItems.unshift({
          id: "ff-" + Date.now(), name, category: "🚜 作り手のガチ愛用品",
          discoverer: author, discovererId: "me", pairing: "EN•ラボ開発商品との掛け合わせにおすすめ！",
          url, stats: { op: 0, disc: 0, maker: 0 }, lastRouteMsg: "",
          reviews: [{ id: "rv-" + Date.now(), author, authorId: "me", text: comment, likes: 0, applied: 0 }]
        });
        v6GainExp(10);
        v6AddNenrin("👑 50:50に神資材を初発掘！", name);
        showToast("👑 最初の発掘者（先見の明ボーナス対象）として登録しました！");
      }
      document.getElementById("v6Tips5050Name").value = "";
      document.getElementById("v6Tips5050Url").value = "";
      document.getElementById("v6Tips5050Comment").value = "";
      v6SaveAll();
      v6.shopTab = "fifty";
      switchView("shop");
      return;
    }

    // ショップ＆50:50操作
    const sTab = t.closest("#v6ShopTabs [data-shoptab]");
    if (sTab) { v6.shopTab = sTab.dataset.shoptab; v6RenderShop(); return; }
    const buyEc = t.closest("[data-v6-buy-ec]");
    if (buyEc) { v6LogAction("EC購入テスト", buyEc.dataset.v6BuyEc); showToast(`🛒 テスト購入を記録：${buyEc.dataset.v6BuyEc}`); return; }
    const storyBtn = t.closest("[data-v6-open-story]");
    if (storyBtn) { v6OpenStoryModal(storyBtn.dataset.v6OpenStory); return; }
    const rvReact = t.closest("[data-v6-rv-react]");
    if (rvReact) {
      const [iid, rvid, field] = rvReact.dataset.v6RvReact.split("|");
      const rv = v6.fiftyItems.find(x => x.id === iid)?.reviews.find(r => r.id === rvid);
      if (rv) { rv[field] = (rv[field] || 0) + 1; v6SaveAll(); v6RenderShop(); showToast(field === "applied" ? "🛠️ 現場で活かした！を記録（確率UP）" : "👍 いいねしました！"); }
      return;
    }
    const buy50 = t.closest("[data-v6-fifty-buy]");
    if (buy50) { const [iid, via] = buy50.dataset.v6FiftyBuy.split("|"); v6ExecuteFiftyClick(iid, via || null); return; }
    const addRv = t.closest("[data-v6-add-rv]");
    if (addRv) {
      const item = v6.fiftyItems.find(x => x.id === addRv.dataset.v6AddRv);
      if (!item) return;
      v6.reviewTargetItemId = item.id;
      v6OpenModal("🛠️ 現場レビューを追加", `
        <div class="v6-row-between" style="margin-bottom:6px;"><span class="mini-note">対象：${escapeHtml(item.name)}</span><button type="button" class="btn-sample-fill" onclick="document.getElementById('v6NewRvTxt').value='小ロット50個から使いやすくリピート確定です！';">✨ 入力例</button></div>
        <textarea id="v6NewRvTxt" class="text-area" rows="3" placeholder="現場で活かした一言を入力..."></textarea>
        <button id="v6SaveNewRvBtn" type="button" class="btn btn-primary btn-full" style="margin-top:8px;">レビューを追加（愛用者枠に参加）</button>
      `);
      document.getElementById("v6SaveNewRvBtn").onclick = () => {
        const txt = document.getElementById("v6NewRvTxt").value.trim();
        if (!txt) return;
        item.reviews.push({ id: "rv-" + Date.now(), author: state.profile.displayName || "あなた", authorId: "me", text: txt, likes: 0, applied: 0 });
        v6SaveAll();
        v6CloseModal();
        v6RenderShop();
        showToast("🛠️ 現場レビューを追加しました！");
      };
      return;
    }
  });

  // 入力連動（原価シミュレーター・開発カスタムボードメモ自動保存・やること完了）
  document.body.addEventListener("input", (e) => {
    const id = e.target.id;
    if (["v6LabPrice", "v6LabMat", "v6LabPkg", "v6LabFee"].includes(id)) v6UpdateLabCalc();
    if (["v6TipsPrice", "v6TipsMat", "v6TipsPkg", "v6TipsFee"].includes(id)) v6UpdateTipsCalc();
    const memoKey = e.target.dataset?.v6BoardMemo;
    if (memoKey) {
      const proj = getProjectById(state.currentRoomId);
      if (proj) { v6EnsureBoards(proj)[memoKey] = e.target.value; saveProjectState(proj); }
    }
  });

  document.body.addEventListener("change", (e) => {
    const chk = e.target.closest("[data-v6-todo-chk]");
    if (chk) {
      const proj = getProjectById(state.currentRoomId);
      const td = (proj?.todos || []).find(x => x.id === chk.dataset.v6TodoChk);
      if (td) { td.done = !td.done; v6GainExp(5); saveProjectState(proj); renderActiveEnRoom(); }
    }
  });
});
// === v6_app.js 完結 ===