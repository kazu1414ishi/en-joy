/* =========================================================
   EN•joy Stage 1 アプリ本体ロジック
========================================================= */

const defaultProfile = {
  registered: false,
  mainRole: "material",
  otherRoleText: "",
  otherPushOk: true,
  activities: ["果樹・フルーツ", "規格外品の提供"],
  subRoles: [],
  photoDataUrl: "",
  photoPendingReview: false,
  displayName: "",
  ageGroup: "30代",
  exactAge: "",
  position: "solo",
  staffName: "",
  staffCode: "",
  area: "",
  areaGranularity: "broad", // broad | detail
  interests: ["規格外品の活用", "小ロット試作"],
  loginId: "",
  referralCode: "",
  capacity: "",
  pride: "",
  prideVisibility: "public", // public | match
  secretPride: "",
  products: [],
  companyName: "",
  phone: "",
  freeMemo: ""
};

let state = {
  step: 1,
  activeView: "register", // register | home | en | tips | shop
  cardMode: "pre",        // pre | post
  enMode: "projects",     // projects | offers
  enFilter: "all",
  profile: Object.assign({}, defaultProfile, EnjoyStore.load(STORAGE_KEYS.PROFILE, {})),
  projects: EnjoyStore.load(STORAGE_KEYS.PROJECTS, []),
  offers: EnjoyStore.load(STORAGE_KEYS.OFFERS, []),
  matches: EnjoyStore.load(STORAGE_KEYS.MATCHES, {}),
  wants: EnjoyStore.load(STORAGE_KEYS.WANTS, { tips: 0, shop: 0 })
};

/* ==================== 初期化 ==================== */
document.addEventListener("DOMContentLoaded", () => {
  checkReferralFromUrl();
  initStaticRender();
  bindEvents();
  syncFormFromProfile();
  renderAll();
  initScrollResponsiveNav();

  // すでに登録済みならホームへ
  if (state.profile.registered) {
    switchView("home");
  }
});

function checkReferralFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref && !state.profile.referralCode) {
    state.profile.referralCode = ref;
    saveProfile();
  }
}

function saveProfile() {
  EnjoyStore.save(STORAGE_KEYS.PROFILE, state.profile);
}

/* ==================== 静的選択肢の描画 ==================== */
function initStaticRender() {
  renderRoleTiles();
  renderActivities();
  renderSubRoles();
  renderAgeGroups();
  renderPositions();
  renderInterests();
  renderCapacityQuickChips();
}

function renderRoleTiles() {
  const grid = document.getElementById("roleGrid");
  grid.innerHTML = ENJOY_DATA.roles.map(r => `
    <button type="button"
      class="role-tile ${r.id === "other" ? "role-other" : ""} ${state.profile.mainRole === r.id ? "selected" : ""}"
      data-role="${r.id}">
      <span class="role-icon">${r.icon}</span>
      <span class="role-title">${r.title}</span>
      <span class="role-sub">${r.sub}</span>
    </button>
  `).join("");

  const otherBox = document.getElementById("otherRoleBox");
  otherBox.classList.toggle("hidden", state.profile.mainRole !== "other");
}

function renderActivities() {
  const container = document.getElementById("activityChips");
  const baseList = ENJOY_DATA.activitiesByRole[state.profile.mainRole] || [];
  const merged = Array.from(new Set([...baseList, ...state.profile.activities]));

  container.innerHTML = merged.map(act => `
    <button type="button"
      class="select-chip ${state.profile.activities.includes(act) ? "selected" : ""}"
      data-activity="${escapeHtml(act)}">
      ${escapeHtml(act)}
    </button>
  `).join("");
}

function renderSubRoles() {
  const container = document.getElementById("subRoleChips");
  const candidates = ENJOY_DATA.roles.filter(r => r.id !== state.profile.mainRole && r.id !== "other");
  container.innerHTML = candidates.map(r => `
    <button type="button"
      class="select-chip ${state.profile.subRoles.includes(r.id) ? "selected" : ""}"
      data-subrole="${r.id}">
      ${r.icon} ${r.title}もOK
    </button>
  `).join("");
}

function renderAgeGroups() {
  const container = document.getElementById("ageGroupChips");
  container.innerHTML = ENJOY_DATA.ageGroups.map(age => `
    <button type="button"
      class="select-chip ${state.profile.ageGroup === age ? "selected" : ""}"
      data-age="${age}">
      ${age}
    </button>
  `).join("");
}

function renderPositions() {
  const container = document.getElementById("positionChips");
  container.innerHTML = ENJOY_DATA.positions.map(p => `
    <button type="button"
      class="select-chip ${state.profile.position === p.id ? "selected" : ""}"
      data-pos="${p.id}">
      ${p.label}
    </button>
  `).join("");

  const staffBox = document.getElementById("staffBox");
  staffBox.classList.toggle("hidden", state.profile.position === "solo");
  updateGeneratedStaffCodeUI();
}

function renderInterests() {
  const container = document.getElementById("interestChips");
  container.innerHTML = ENJOY_DATA.interests.map(item => `
    <button type="button"
      class="select-chip ${state.profile.interests.includes(item) ? "selected" : ""}"
      data-interest="${item}">
      ${item}
    </button>
  `).join("");
}

function renderCapacityQuickChips() {
  const container = document.getElementById("capacityQuickChips");
  container.innerHTML = ENJOY_DATA.capacityQuickChips.map(text => `
    <button type="button" class="select-chip chip-quick" data-capquick="${text}">＋ ${text}</button>
  `).join("");
}

/* ==================== フォーム値同期 ==================== */
function syncFormFromProfile() {
  const p = state.profile;
  setVal("otherRoleInput", p.otherRoleText);
  document.getElementById("otherPushOk").checked = !!p.otherPushOk;
  setVal("displayNameInput", p.displayName);
  setVal("exactAgeInput", p.exactAge);
  setVal("staffNameInput", p.staffName);
  setVal("areaInput", p.area);
  setVal("loginIdInput", p.loginId);
  setVal("referralInput", p.referralCode);
  setVal("capacityInput", p.capacity);
  setVal("prideInput", p.pride);
  setVal("secretPrideInput", p.secretPride);
  setVal("companyNameInput", p.companyName);
  setVal("phoneInput", p.phone);
  setVal("freeMemoInput", p.freeMemo);

  // エリア粒度
  document.querySelectorAll("#areaGranularityGroup .seg-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.granularity === p.areaGranularity);
  });
  // 自慢公開範囲
  document.querySelectorAll("#prideVisibilityToggle button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.vis === p.prideVisibility);
  });

  // 写真
  if (p.photoDataUrl) {
    document.getElementById("photoPreviewImg").src = p.photoDataUrl;
    document.getElementById("photoPreviewImg").classList.remove("hidden");
    document.getElementById("photoPlaceholder").classList.add("hidden");
  }

  renderAddedProducts();
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || "";
}

/* ==================== イベントバインド ==================== */
function bindEvents() {
  // ヘッダー制御
  document.getElementById("toggleZoneBtn").addEventListener("click", () => {
    const isOn = document.body.classList.toggle("show-zones");
    document.getElementById("zoneStateText").textContent = isOn ? "ON" : "OFF";
    document.getElementById("toggleZoneBtn").classList.toggle("active", isOn);
  });

  document.getElementById("toggleMobileBtn").addEventListener("click", (e) => {
    const on = document.body.classList.toggle("mobile-preview");
    e.currentTarget.classList.toggle("active", on);
  });

  document.getElementById("openRegBtn").addEventListener("click", () => switchView("register"));
  document.getElementById("editProfileFromHomeBtn").addEventListener("click", () => switchView("register"));

  // ステッパー＆前後ボタン
  document.getElementById("stepper").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-step]");
    if (btn) goStep(Number(btn.dataset.step));
  });
  document.querySelectorAll("[data-next]").forEach(btn => {
    btn.addEventListener("click", () => goStep(Number(btn.dataset.next)));
  });
  document.querySelectorAll("[data-prev]").forEach(btn => {
    btn.addEventListener("click", () => goStep(Number(btn.dataset.prev)));
  });

  // Step 1 ロール選択
  document.getElementById("roleGrid").addEventListener("click", (e) => {
    const tile = e.target.closest("[data-role]");
    if (!tile) return;
    state.profile.mainRole = tile.dataset.role;
    state.profile.subRoles = state.profile.subRoles.filter(r => r !== state.profile.mainRole);
    saveProfile();
    renderRoleTiles();
    renderActivities();
    renderSubRoles();
    renderBusinessCards();
  });

  bindInput("otherRoleInput", val => { state.profile.otherRoleText = val; });
  document.getElementById("otherPushOk").addEventListener("change", (e) => {
    state.profile.otherPushOk = e.target.checked;
    saveProfile();
    renderBusinessCards();
  });

  // Step 2 活動チップ＆自由追加＆兼業追加
  document.getElementById("activityChips").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-activity]");
    if (!btn) return;
    const act = btn.dataset.activity;
    toggleArrayItem(state.profile.activities, act);
    saveProfile();
    renderActivities();
    renderBusinessCards();
  });

  document.getElementById("addActivityBtn").addEventListener("click", () => {
    const input = document.getElementById("customActivityInput");
    const val = input.value.trim();
    if (!val) return;
    if (!state.profile.activities.includes(val)) {
      state.profile.activities.push(val);
    }
    input.value = "";
    saveProfile();
    renderActivities();
    renderBusinessCards();
    showToast(`「${val}」を追加しました`);
  });

  document.getElementById("subRoleChips").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-subrole]");
    if (!btn) return;
    const rid = btn.dataset.subrole;
    if (state.profile.subRoles.includes(rid)) {
      state.profile.subRoles = state.profile.subRoles.filter(x => x !== rid);
    } else {
      if (state.profile.subRoles.length >= 2) {
        showToast("兼業・追加の役割は最大2つまで選べます");
        return;
      }
      state.profile.subRoles.push(rid);
    }
    saveProfile();
    renderSubRoles();
    renderBusinessCards();
  });

  // Step 3 担当者コード反映＆デモ
  document.getElementById("demoCodeBtn").addEventListener("click", () => {
    document.getElementById("importCodeInput").value = "EN-TK88";
    applyStaffImportCode("EN-TK88");
  });
  document.getElementById("applyCodeBtn").addEventListener("click", () => {
    applyStaffImportCode(document.getElementById("importCodeInput").value.trim().toUpperCase());
  });

  // 写真アップロード
  document.getElementById("photoInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.profile.photoDataUrl = reader.result;
      state.profile.photoPendingReview = true;
      saveProfile();
      syncFormFromProfile();
      renderBusinessCards();
      showToast("写真を選択しました（運営審査中ステータス）");
    };
    reader.readAsDataURL(file);
  });

  bindInput("displayNameInput", val => { state.profile.displayName = val; });
  bindInput("exactAgeInput", val => { state.profile.exactAge = val; });
  bindInput("areaInput", val => { state.profile.area = val; });
  bindInput("loginIdInput", val => { state.profile.loginId = val; });
  bindInput("referralInput", val => { state.profile.referralCode = val; });

  // 担当者氏名 → 専用コード自動発行
  document.getElementById("staffNameInput").addEventListener("input", (e) => {
    state.profile.staffName = e.target.value;
    state.profile.staffCode = generateStaffCode(e.target.value);
    saveProfile();
    updateGeneratedStaffCodeUI();
    renderBusinessCards();
  });

  document.getElementById("copyStaffCodeBtn").addEventListener("click", () => {
    if (!state.profile.staffCode) return;
    navigator.clipboard?.writeText(state.profile.staffCode).catch(() => {});
    showToast(`専用コード ${state.profile.staffCode} をコピーしました`);
  });

  // 年代・立場・興味・エリア粒度
  document.getElementById("ageGroupChips").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-age]");
    if (!btn) return;
    state.profile.ageGroup = btn.dataset.age;
    saveProfile();
    renderAgeGroups();
    renderBusinessCards();
  });

  document.getElementById("positionChips").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pos]");
    if (!btn) return;
    state.profile.position = btn.dataset.pos;
    saveProfile();
    renderPositions();
    renderBusinessCards();
  });

  document.getElementById("interestChips").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-interest]");
    if (!btn) return;
    toggleArrayItem(state.profile.interests, btn.dataset.interest);
    saveProfile();
    renderInterests();
    renderBusinessCards();
  });

  document.getElementById("areaGranularityGroup").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-granularity]");
    if (!btn) return;
    state.profile.areaGranularity = btn.dataset.granularity;
    saveProfile();
    syncFormFromProfile();
    renderBusinessCards();
  });

  // 現在地取得
  document.getElementById("geoBtn").addEventListener("click", handleGeolocation);

  // Step 4 設備・自慢・商品・連絡先
  document.getElementById("capacityQuickChips").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-capquick]");
    if (!btn) return;
    const text = btn.dataset.capquick;
    state.profile.capacity = state.profile.capacity ? `${state.profile.capacity} / ${text}` : text;
    document.getElementById("capacityInput").value = state.profile.capacity;
    saveProfile();
    renderBusinessCards();
  });

  bindInput("capacityInput", val => { state.profile.capacity = val; });
  bindInput("prideInput", val => { state.profile.pride = val; });
  bindInput("secretPrideInput", val => { state.profile.secretPride = val; });
  bindInput("companyNameInput", val => { state.profile.companyName = val; });
  bindInput("phoneInput", val => { state.profile.phone = val; });
  bindInput("freeMemoInput", val => { state.profile.freeMemo = val; });

  document.getElementById("prideVisibilityToggle").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-vis]");
    if (!btn) return;
    state.profile.prideVisibility = btn.dataset.vis;
    saveProfile();
    syncFormFromProfile();
    renderBusinessCards();
  });

  // 自社商品・HPカード追加
  document.getElementById("addProductBtn").addEventListener("click", () => {
    const title = document.getElementById("prodTitleInput").value.trim();
    const icon = document.getElementById("prodIconSelect").value;
    const note = document.getElementById("prodNoteInput").value.trim();
    const url = document.getElementById("prodUrlInput").value.trim();
    if (!title) {
      showToast("商品名またはサイト名を入力してください");
      return;
    }
    state.profile.products.push({ id: Date.now(), title, icon, note: note || "詳細を見る", url });
    document.getElementById("prodTitleInput").value = "";
    document.getElementById("prodNoteInput").value = "";
    document.getElementById("prodUrlInput").value = "";
    saveProfile();
    renderAddedProducts();
    renderBusinessCards();
    showToast("ビジュアルカードを追加しました");
  });

  document.getElementById("addedProductList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-delprod]");
    if (!btn) return;
    const id = Number(btn.dataset.delprod);
    state.profile.products = state.profile.products.filter(x => x.id !== id);
    saveProfile();
    renderAddedProducts();
    renderBusinessCards();
  });

  // 登録完了・スキップ
  document.getElementById("completeRegBtn").addEventListener("click", () => finishRegistration(false));
  document.getElementById("skipFinishBtn").addEventListener("click", () => finishRegistration(true));

  // 名刺プレビュー（マッチ前／後切替）
  ["cardModeSwitch", "homeCardModeSwitch"].forEach(id => {
    document.getElementById(id).addEventListener("click", (e) => {
      const btn = e.target.closest("[data-mode]");
      if (!btn) return;
      state.cardMode = btn.dataset.mode;
      syncCardModeButtons();
      renderBusinessCards();
    });
  });

  // ナビゲーション
  document.getElementById("bottomNav").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tab]");
    if (btn) switchView(btn.dataset.tab);
  });
  document.querySelectorAll("[data-goto-tab]").forEach(btn => {
    btn.addEventListener("click", () => switchView(btn.dataset.gotoTab));
  });

  // EN開発ルーム操作
  document.getElementById("enModeTabs").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-enmode]");
    if (!btn) return;
    state.enMode = btn.dataset.enmode;
    document.querySelectorAll("#enModeTabs button").forEach(b => b.classList.toggle("active", b === btn));
    renderEnRoom();
  });

  document.getElementById("enFilterBar").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;
    state.enFilter = btn.dataset.filter;
    document.querySelectorAll("#enFilterBar button").forEach(b => b.classList.toggle("active", b === btn));
    renderEnRoom();
  });

  // モーダル開閉
  document.getElementById("openPostModalBtn").addEventListener("click", () => openPostModal("project"));
  document.getElementById("quickPostFromHomeBtn").addEventListener("click", () => {
    switchView("en");
    openPostModal();
  });
  document.querySelectorAll("[data-close-modal]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById(btn.dataset.closeModal).classList.add("hidden");
    });
  });
  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) backdrop.classList.add("hidden");
    });
  });

  // 投稿モーダル切替＆送信
  document.getElementById("postTypeSwitch").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-posttype]");
    if (!btn) return;
    const isProj = btn.dataset.posttype === "project";
    document.querySelectorAll("#postTypeSwitch .seg-btn").forEach(b => b.classList.toggle("active", b === btn));
    document.getElementById("projectPostForm").classList.toggle("hidden", !isProj);
    document.getElementById("offerPostForm").classList.toggle("hidden", isProj);
  });

  document.getElementById("projectPostForm").addEventListener("submit", handleProjectSubmit);
  document.getElementById("offerPostForm").addEventListener("submit", handleOfferSubmit);

  // ロック中タブ「早く使いたい」
  document.querySelectorAll(".want-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.want;
      state.wants[key] = (state.wants[key] || 0) + 1;
      EnjoyStore.save(STORAGE_KEYS.WANTS, state.wants);
      renderWants();
      showToast("🔔 解放リクエストを記録しました！");
    });
  });
}

function bindInput(id, updater) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", (e) => {
    updater(e.target.value);
    saveProfile();
    renderBusinessCards();
  });
}

/* ==================== ステップ・画面切替 ==================== */
function goStep(stepNum) {
  state.step = stepNum;
  document.querySelectorAll(".step-panel").forEach(p => {
    p.classList.toggle("active", Number(p.dataset.panel) === stepNum);
  });
  document.querySelectorAll("#stepper .step-pill").forEach(pill => {
    const n = Number(pill.dataset.step);
    pill.classList.toggle("active", n === stepNum);
    pill.classList.toggle("done", n < stepNum);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function switchView(viewName) {
  state.activeView = viewName;
  document.querySelectorAll(".view-section").forEach(sec => {
    sec.classList.toggle("active", sec.id === `view-${viewName}`);
  });
  document.querySelectorAll("#bottomNav .nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.tab === viewName);
  });
  renderAll();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function finishRegistration(skipped) {
  if (!state.profile.displayName.trim()) {
    state.profile.displayName = "新しいつくり手さん";
  }
  state.profile.registered = true;
  saveProfile();
  showToast(skipped ? "まずはこの内容でスタートします！" : "🎉 登録完了！あなただけのデジタル名刺ができました");
  switchView("en");
}

/* ==================== 補助機能 ==================== */
function applyStaffImportCode(code) {
  const msg = document.getElementById("codeApplyMsg");
  const hit = ENJOY_DATA.sampleStaffCodes[code];
  if (!hit) {
    msg.textContent = "コードが見つかりませんでした（テスト用は EN-TK88 をお試しください）";
    return;
  }
  Object.assign(state.profile, hit, { staffCode: code });
  saveProfile();
  syncFormFromProfile();
  renderAgeGroups();
  renderPositions();
  renderBusinessCards();
  msg.textContent = `✅ コード「${code}」から基本情報・会社情報を自動入力しました！`;
  showToast("担当者コードで入力を省略しました");
}

function generateStaffCode(name) {
  const clean = (name || "").trim();
  if (!clean) return "";
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) % 900;
  }
  return `EN-ST${100 + hash}`;
}

function updateGeneratedStaffCodeUI() {
  const box = document.getElementById("generatedCodeBox");
  const txt = document.getElementById("generatedCodeText");
  if (state.profile.staffCode) {
    box.classList.remove("hidden");
    txt.textContent = state.profile.staffCode;
  } else {
    box.classList.add("hidden");
  }
}

function handleGeolocation() {
  const status = document.getElementById("geoStatus");
  status.textContent = "現在地を確認しています…";
  if (!navigator.geolocation) {
    applyDemoGeo("位置情報に未対応のため、サンプルエリアをセットしました");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    () => {
      // 外部APIキー不要でテストが止まらないよう取得成功後にエリア補完（本番は逆ジオコーディング接続）
      applyDemoGeo("📍 現在地を取得しました（必要に応じて町名まで微調整してください）");
    },
    () => {
      applyDemoGeo("📍 位置情報の許可がオフだったため、サンプル（大阪府 高槻市 富田町）を仮入力しました");
    },
    { timeout: 4000 }
  );
}

function applyDemoGeo(message) {
  state.profile.area = "大阪府 高槻市 富田町";
  document.getElementById("areaInput").value = state.profile.area;
  document.getElementById("geoStatus").textContent = message;
  saveProfile();
  renderBusinessCards();
}

function renderAddedProducts() {
  const list = document.getElementById("addedProductList");
  if (!state.profile.products.length) {
    list.innerHTML = "";
    return;
  }
  list.innerHTML = state.profile.products.map(prod => `
    <div class="added-prod-item">
      <span>${prod.icon} <strong>${escapeHtml(prod.title)}</strong>（${escapeHtml(prod.note)}）</span>
      <button type="button" class="btn-link" data-delprod="${prod.id}">削除</button>
    </div>
  `).join("");
}

/* ==================== デジタル名刺レンダリング ==================== */
function renderAll() {
  renderBusinessCards();
  renderHomeStats();
  renderEnRoom();
  renderWants();
}

function syncCardModeButtons() {
  document.querySelectorAll(".card-mode-switch button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === state.cardMode);
  });
}

function renderBusinessCards() {
  const html = buildBusinessCardHTML(state.profile, state.cardMode);
  document.getElementById("liveBusinessCard").innerHTML = html;
  document.getElementById("homeBusinessCard").innerHTML = html;
}

function formatAreaForMode(area, granularity, mode) {
  const raw = (area || "").trim();
  if (!raw) return "エリア未設定";
  if (mode === "post" || granularity === "detail") return raw;
  // 大雑把（市町村まで）表示
  const parts = raw.split(/[\s　]+/);
  return parts.length >= 2 ? `${parts[0]} ${parts[1]}（マッチ後詳細）` : `${raw}（市町村まで）`;
}

function buildBusinessCardHTML(p, mode) {
  const isPost = mode === "post";
  const mainRoleObj = ENJOY_DATA.roles.find(r => r.id === p.mainRole) || ENJOY_DATA.roles[0];
  const mainRoleLabel = p.mainRole === "other" && p.otherRoleText
    ? `✨ ${p.otherRoleText}`
    : `${mainRoleObj.icon} ${mainRoleObj.title}`;

  const subBadges = (p.subRoles || []).map(rid => {
    const r = ENJOY_DATA.roles.find(x => x.id === rid);
    return r ? `<span class="bc-role-sub">${r.icon} ${r.title}もOK</span>` : "";
  }).join("");

  const posObj = ENJOY_DATA.positions.find(x => x.id === p.position);
  const ageText = p.exactAge ? `${p.ageGroup}（${p.exactAge}歳）` : (p.ageGroup || "");
  const areaText = formatAreaForMode(p.area, p.areaGranularity, mode);

  const avatarHtml = p.photoDataUrl
    ? `<img src="${p.photoDataUrl}" alt="プロフィール写真" />`
    : mainRoleObj.icon;

  const reviewBadge = p.photoPendingReview
    ? `<span class="bc-review-pill">🕒 写真審査中</span>`
    : "";

  const activityTags = (p.activities || []).slice(0, 5).map(a => `<span class="bc-tag">#${escapeHtml(a)}</span>`).join("");

  const prideVisible = p.pride && (p.prideVisibility === "public" || isPost);
  const prideLockedNote = p.pride && p.prideVisibility === "match" && !isPost
    ? `<p class="mini-note">🔒 自慢ポイントはマッチ後に公開されます</p>`
    : "";

  const productsHtml = (p.products && p.products.length)
    ? `<div class="bc-section">
         <div class="bc-sec-title">📦 自社商品・公式HP</div>
         <div class="bc-prod-grid">
           ${p.products.map(pr => `
             <a class="bc-prod-card" href="${pr.url ? escapeHtml(pr.url) : "javascript:void(0)"}" ${pr.url ? 'target="_blank" rel="noopener"' : ""}>
               <div class="bc-prod-icon">${pr.icon}</div>
               <div class="bc-prod-title">${escapeHtml(pr.title)}</div>
               <div class="bc-prod-note">${escapeHtml(pr.note)}</div>
             </a>
           `).join("")}
         </div>
       </div>`
    : "";

  const secretHtml = isPost
    ? `<div class="bc-secret-box unlocked">
         <strong>🤝 マッチ成立により自動公開中</strong>
         <ul class="bc-secret-list">
           <li>正式社名・屋号：<strong>${escapeHtml(p.companyName || "（未記入）")}</strong></li>
           ${p.position !== "solo" ? `<li>担当者：<strong>${escapeHtml(p.staffName || "（未記入）")}</strong> ${p.staffCode ? `（${p.staffCode}）` : ""}</li>` : ""}
           <li>電話番号：${p.phone ? `<a class="tel-link" href="tel:${escapeHtml(p.phone)}">${escapeHtml(p.phone)}</a>` : "（未記入）"}</li>
           ${p.secretPride ? `<li>秘密の条件・強み：${escapeHtml(p.secretPride)}</li>` : ""}
         </ul>
         <p class="mini-note">💬 LINE等の交換は安全のためトーク欄で行えます</p>
       </div>`
    : `<div class="bc-secret-box locked">
         <strong>🔒 マッチ後に自動公開される情報</strong>
         <ul class="bc-secret-list">
           <li>正式な会社名・屋号（ロック中）</li>
           <li>電話番号・ワンタップ発信（ロック中）</li>
           ${p.secretPride ? "<li>マッチ限定の強み・条件 1件（ロック中）</li>" : "<li>秘密の条件・強み（マッチで開示）</li>"}
         </ul>
       </div>`;

  return `
    <div class="bc-top-strip ${isPost ? "mode-post" : "mode-pre"}">
      <span>${isPost ? "🤝 マッチ後の見え方（全情報解放）" : "👀 マッチ前の見え方（安心ガード中）"}</span>
      <span>EN•joy 名刺</span>
    </div>
    <div class="bc-body">
      <div class="bc-profile">
        <div class="bc-avatar">${avatarHtml}</div>
        <div>
          <div class="bc-name-row">
            <span class="bc-name">${escapeHtml(p.displayName || "活動名（未入力）")}</span>
            <span class="bc-age">${escapeHtml(ageText)}</span>
            ${posObj ? `<span class="bc-pos-badge">${posObj.label}</span>` : ""}
          </div>
          <div class="bc-area">📍 ${escapeHtml(areaText)}</div>
          ${reviewBadge}
        </div>
      </div>

      <div class="bc-roles">
        <span class="bc-role-main">メイン：${escapeHtml(mainRoleLabel)}</span>
        ${subBadges}
      </div>

      ${activityTags ? `<div class="bc-tags">${activityTags}</div>` : ""}

      ${(p.capacity || prideVisible || prideLockedNote) ? `
        <div class="bc-section">
          ${p.capacity ? `<div><span class="bc-sec-title">🏭 設備・作れる量</span><br/>${escapeHtml(p.capacity)}</div>` : ""}
          ${prideVisible ? `<div style="margin-top:8px;"><span class="bc-sec-title">✨ 自慢ポイント</span><br/>${escapeHtml(p.pride)}</div>` : ""}
          ${prideLockedNote}
        </div>
      ` : ""}

      ${productsHtml}
      ${secretHtml}
    </div>
  `;
}

/* ==================== ホーム統計 ==================== */
function renderHomeStats() {
  document.getElementById("homeGreeting").textContent = state.profile.displayName
    ? `${state.profile.displayName} さんのマイページ`
    : "マイ名刺と活動ステータス";
  document.getElementById("statProjects").textContent = state.projects.length;
  document.getElementById("statOffers").textContent = state.offers.length;
  document.getElementById("statMatches").textContent = Object.keys(state.matches).length;
}

/* ==================== EN 開発ルーム ==================== */
function renderEnRoom() {
  const projWrap = document.getElementById("enProjectsContainer");
  const offerWrap = document.getElementById("enOffersContainer");
  const isProjects = state.enMode === "projects";

  projWrap.classList.toggle("hidden", !isProjects);
  offerWrap.classList.toggle("hidden", isProjects);

  if (isProjects) {
    renderProjectCards(projWrap);
  } else {
    renderOfferCards(offerWrap);
  }
}

function renderProjectCards(container) {
  let list = [...state.projects];
  const isZero = list.length === 0;

  if (isZero) {
    list = [ENJOY_DATA.sampleProjectTemplate];
  } else {
    list = list.filter(p => matchesFilter(p));
  }

  let html = "";
  if (isZero) {
    html += `
      <div class="empty-callout">
        <strong>🌱 まだ第1号の企画は生まれていません</strong>
        <p>下の点線カードはイメージ見本です。あなたが最初の企画を出してみませんか？</p>
        <button type="button" class="btn btn-accent btn-sm" onclick="openPostModal()">＋ 第1号の企画を出す</button>
      </div>
    `;
  }

  if (!list.length) {
    html += `<div class="empty-callout"><p>この条件に合う企画はまだありません。「すべて」に戻すか新しく出してみてください。</p></div>`;
  } else {
    html += list.map(p => {
      const pieceOrder = ["material", "make", "pack", "deliver"];
      const icons = { material: "🌾", make: "🍳", pack: "🎨", deliver: "🏪" };
      const matched = !!state.matches[p.id];
      return `
        <article class="project-card ${p.isSample ? "sample-card" : ""}" data-open-proj="${p.id}">
          ${p.isSample ? `<span class="sample-badge">イメージ見本（タップで体験できます）</span>` : ""}
          ${matched ? `<span class="sample-badge" style="background:var(--orange-soft);color:var(--orange);">🤝 マッチ中・トーク可</span>` : ""}
          <h3 class="proj-title">${escapeHtml(p.title)}</h3>
          <p class="proj-goal">${escapeHtml(p.goal)}</p>
          <div class="pieces-bar">
            ${pieceOrder.map(k => {
              const pc = p.pieces[k];
              return `<div class="piece-pill ${pc.status}">${icons[k]} ${pc.status === "open" ? "募集中" : "決定"}</div>`;
            }).join("")}
          </div>
          <div class="proj-meta">
            <span>📍 ${escapeHtml(p.area || "関西")}</span>
            <span>🏷️ ${escapeHtml(p.tag || "コラボ募集")}</span>
          </div>
        </article>
      `;
    }).join("");
  }

  container.innerHTML = html;
  container.querySelectorAll("[data-open-proj]").forEach(card => {
    card.addEventListener("click", () => openProjectDetail(card.dataset.openProj));
  });
}

function matchesFilter(p) {
  const openKeys = Object.keys(p.pieces).filter(k => p.pieces[k].status === "open");
  if (state.enFilter === "last1") return openKeys.length === 1;
  if (state.enFilter === "myrole") {
    const myRoles = [state.profile.mainRole, ...(state.profile.subRoles || [])];
    return openKeys.some(k => myRoles.includes(k));
  }
  if (state.enFilter === "kansai") {
    return /大阪|京都|兵庫|滋賀|奈良|和歌山|高槻/.test(p.area || "");
  }
  return true;
}

function renderOfferCards(container) {
  if (!state.offers.length) {
    container.innerHTML = `
      <div class="empty-callout">
        <strong>🌱 素材・スキル1行置き場（まだ0件）</strong>
        <p>「来月みかんが30kg余る」「小ロットのラベル作れます」など、企画になる前の1行を気軽に置けます。</p>
        <button type="button" class="btn btn-accent btn-sm" onclick="openPostModal('offer')">＋ 1行だけ置いてみる</button>
      </div>
    `;
    return;
  }
  container.innerHTML = state.offers.map(o => `
    <div class="offer-card">
      <div>
        <div style="font-weight:700;font-size:0.92rem;">${escapeHtml(o.text)}</div>
        <div class="mini-note">📍 ${escapeHtml(o.area || "関西")} ／ 👤 ${escapeHtml(o.author)}</div>
      </div>
      <button type="button" class="btn btn-outline btn-sm" onclick="showToast('👋 興味ありを送りました！')">👋 興味あり</button>
    </div>
  `).join("");
}

/* ==================== 投稿・詳細・マッチング ==================== */
function openPostModal(defaultType = "project") {
  document.getElementById("postModal").classList.remove("hidden");
  document.getElementById("projArea").value = state.profile.area || "大阪府 高槻市";
  document.getElementById("offerArea").value = state.profile.area || "大阪府 高槻市";
  const btn = document.querySelector(`#postTypeSwitch [data-posttype="${defaultType}"]`);
  if (btn) btn.click();
}

function handleProjectSubmit(e) {
  e.preventDefault();
  const title = document.getElementById("projTitle").value.trim();
  const goal = document.getElementById("projGoal").value.trim();
  const area = document.getElementById("projArea").value.trim();
  const tag = document.getElementById("projTag").value.trim() || "コラボ募集";
  const openSet = new Set(
    Array.from(document.querySelectorAll("#projOpenPieces input:checked")).map(c => c.value)
  );

  const wasEmpty = state.projects.length === 0;
  const newProj = {
    id: "proj-" + Date.now(),
    isSample: false,
    title,
    goal,
    area,
    tag,
    pieces: {
      material: { status: openSet.has("material") ? "open" : "filled", label: "素材" },
      make: { status: openSet.has("make") ? "open" : "filled", label: "形にする" },
      pack: { status: openSet.has("pack") ? "open" : "filled", label: "整える包む" },
      deliver: { status: openSet.has("deliver") ? "open" : "filled", label: "届ける試す" }
    },
    ownerCard: Object.assign({}, state.profile)
  };

  state.projects.unshift(newProj);
  EnjoyStore.save(STORAGE_KEYS.PROJECTS, state.projects);
  e.target.reset();
  document.getElementById("postModal").classList.add("hidden");
  renderAll();
  showToast(wasEmpty ? "🎉 初めての取り組みが生まれました‼️（第1号バッジ獲得）" : "企画を公開しました！");
}

function handleOfferSubmit(e) {
  e.preventDefault();
  const text = document.getElementById("offerText").value.trim();
  const area = document.getElementById("offerArea").value.trim();
  state.offers.unshift({
    id: "offer-" + Date.now(),
    text,
    area,
    author: state.profile.displayName || "つくり手さん"
  });
  EnjoyStore.save(STORAGE_KEYS.OFFERS, state.offers);
  e.target.reset();
  document.getElementById("postModal").classList.add("hidden");
  state.enMode = "offers";
  document.querySelectorAll("#enModeTabs button").forEach(b => b.classList.toggle("active", b.dataset.enmode === "offers"));
  renderAll();
  showToast("🌱 1行置き場に追加しました！");
}

function openProjectDetail(projId) {
  const proj = projId === ENJOY_DATA.sampleProjectTemplate.id
    ? ENJOY_DATA.sampleProjectTemplate
    : state.projects.find(p => p.id === projId);
  if (!proj) return;

  const matched = state.matches[proj.id];
  document.getElementById("detailTitle").textContent = proj.title;

  const owner = proj.ownerCard || {};
  const body = document.getElementById("detailBody");
  body.innerHTML = `
    <p style="margin:0 0 12px;font-size:0.88rem;">${escapeHtml(proj.goal)}</p>

    <div class="future-zone" data-zone="true" style="display:${document.body.classList.contains("show-zones") ? "block" : "none"};">
      <span class="zone-badge">🥚 将来ゾーン（卵デコ → 合体エンちゃん孵化 → 全画面巣立ち動画）</span>
      <p>マッチ直後は卵にスタンプを貼ってアイスブレイク → 方向性決定で合体エンちゃん誕生 → 完成時に公開記憶を吸って巣立ち！</p>
    </div>

    ${!matched ? `
      <div class="card card-soft" style="margin-bottom:12px;">
        <p class="mini-title">🔒 マッチ前のオーナー情報</p>
        <p class="mini-note">活動名：${escapeHtml(owner.displayName || "企画オーナー")} ／ エリア：${escapeHtml(proj.area || "関西")}</p>
        <p class="mini-note">※「興味あり」でマッチ成立すると、正式社名・電話番号・秘密の条件が自動開示されます。</p>
      </div>
      <button type="button" class="btn btn-accent btn-full" id="sendInterestBtn">
        👋 この企画に「興味あり」を送ってマッチ体験する
      </button>
    ` : `
      <div class="bc-secret-box unlocked" style="margin-top:0;">
        <strong>🤝 マッチ成立！相手の詳細名刺がロック解除されました</strong>
        <ul class="bc-secret-list">
          <li>正式社名・屋号：<strong>${escapeHtml(owner.companyName || "株式会社たなか農園")}</strong></li>
          <li>担当者：<strong>${escapeHtml(owner.staffName || "担当者")}</strong></li>
          <li>電話番号：<a class="tel-link" href="tel:${escapeHtml(owner.phone || "090-1234-5678")}">${escapeHtml(owner.phone || "090-1234-5678")}</a></li>
          ${owner.secretPride ? `<li>秘密の条件：${escapeHtml(owner.secretPride)}</li>` : ""}
        </ul>
      </div>

      <div class="chat-box">
        <div class="mini-title" style="margin-bottom:8px;">💬 簡易トーク（LINE交換などはこちらから）</div>
        <div id="chatMessages" class="chat-messages">
          ${matched.messages.map(m => `<div class="chat-msg ${m.who}">${escapeHtml(m.text)}</div>`).join("")}
        </div>
        <div class="inline-add">
          <input id="chatInput" class="text-input" type="text" placeholder="ひとこと挨拶を送ってみよう…" />
          <button id="sendChatBtn" type="button" class="btn btn-primary btn-sm">送信</button>
        </div>
      </div>
    `}
  `;

  if (!matched) {
    document.getElementById("sendInterestBtn").addEventListener("click", () => {
      state.matches[proj.id] = {
        matchedAt: Date.now(),
        messages: [
          { who: "sys", text: "🎉 マッチング成立！お互いの正式社名・電話番号が開示されました。" },
          { who: "other", text: "興味ありありがとうございます！まずは気軽に試作のイメージをお話しできたら嬉しいです。" }
        ]
      };
      EnjoyStore.save(STORAGE_KEYS.MATCHES, state.matches);
      renderAll();
      openProjectDetail(proj.id);
      showToast("🤝 マッチ成立！詳細名刺がロック解除されました");
    });
  } else {
    document.getElementById("sendChatBtn").addEventListener("click", () => {
      const inp = document.getElementById("chatInput");
      const text = inp.value.trim();
      if (!text) return;
      state.matches[proj.id].messages.push({ who: "me", text });
      EnjoyStore.save(STORAGE_KEYS.MATCHES, state.matches);
      openProjectDetail(proj.id);
    });
  }

  document.getElementById("detailModal").classList.remove("hidden");
}

function renderWants() {
  document.getElementById("wantTipsCount").textContent = state.wants.tips || 0;
  document.getElementById("wantShopCount").textContent = state.wants.shop || 0;
}

/* ==================== スクロール連動ナビ ==================== */
function initScrollResponsiveNav() {
  let lastY = window.scrollY;
  const header = document.getElementById("topHeader");
  const bottomNav = document.getElementById("bottomNav");

  window.addEventListener("scroll", () => {
    const currentY = window.scrollY;
    const goingDown = currentY > lastY && currentY > 70;
    header.classList.toggle("nav-hidden", goingDown);
    bottomNav.classList.toggle("nav-hidden", goingDown);
    lastY = currentY;
  }, { passive: true });
}

/* ==================== ユーティリティ ==================== */
function toggleArrayItem(arr, item) {
  const idx = arr.indexOf(item);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(item);
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let toastTimer;
function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 2800);
}
