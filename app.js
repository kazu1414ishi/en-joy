/* =========================================================
   EN•joy Stage 1 アプリ本体ロジック (v2)
   - 登録Step 1〜4 ＆ リアルタイムデジタル名刺（v1完全維持）
   - 下部5タブ：ホーム / つぶやき＆動画 / EN開発 / 役立ち / ショップ
   - フル画面EN開発室（2タブ構成・スクロール式固定メモ・途中EN追加）
   - 興味あり全対応（ワンタップ定型＋熱意自由文）
   - 写真・動画添付 ＆ 素材・困りごとからのワンタップ企画化
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

function cloneObj(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadSampleRoom() {
  const saved = EnjoyStore.load(STORAGE_KEYS.SAMPLE_STATE, null);
  return saved ? saved : cloneObj(ENJOY_DATA.sampleProjectTemplate);
}

function loadFeeds() {
  const saved = EnjoyStore.load(STORAGE_KEYS.FEEDS, null);
  return saved && Array.isArray(saved) && saved.length ? saved : cloneObj(ENJOY_DATA.initialFeedSamples);
}

let state = {
  step: 1,
  activeView: "register", // register | home | feed | en | en-room | tips | shop
  cardMode: "pre",        // pre | post
  enMode: "projects",     // projects | offers
  enFilter: "all",
  feedFilter: "all",
  feedPostType: "general", // general | rescue
  currentRoomId: null,
  roomViewMode: "inside", // inside | outside
  roomInnerTab: "talk",   // talk | members
  pendingRoomMedia: null, // { type: 'image'|'video', url: string, name: string }
  interestTargetProjId: null,
  interestSelectedRoleId: "",
  selectedAddEnText: "",
  profile: Object.assign({}, defaultProfile, EnjoyStore.load(STORAGE_KEYS.PROFILE, {})),
  projects: EnjoyStore.load(STORAGE_KEYS.PROJECTS, []),
  sampleRoom: loadSampleRoom(),
  offers: EnjoyStore.load(STORAGE_KEYS.OFFERS, []),
  feeds: loadFeeds(),
  matches: EnjoyStore.load(STORAGE_KEYS.MATCHES, {}),
  wants: EnjoyStore.load(STORAGE_KEYS.WANTS, { tips: 0, shop: 0 })
};

/* ==================== 初期化 ==================== */
document.addEventListener("DOMContentLoaded", () => {
  // 下部5タブが確実に1列5等分になるようスタイル補完（style.cssの4列指定が残っていても崩れない）
  const bottomNav = document.getElementById("bottomNav");
  if (bottomNav) {
    bottomNav.style.gridTemplateColumns = "repeat(5, 1fr)";
  }

  checkReferralFromUrl();
  initStaticRender();
  bindEvents();
  syncFormFromProfile();
  renderAll();
  initScrollResponsiveNav();

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

function saveProjectState(proj) {
  if (proj.id === state.sampleRoom.id) {
    state.sampleRoom = proj;
    EnjoyStore.save(STORAGE_KEYS.SAMPLE_STATE, state.sampleRoom);
  } else {
    EnjoyStore.save(STORAGE_KEYS.PROJECTS, state.projects);
  }
}

function getProjectById(id) {
  if (id === state.sampleRoom.id) return state.sampleRoom;
  return state.projects.find(p => p.id === id) || null;
}

/* ==================== 静的選択肢の描画（登録フロー） ==================== */
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

  document.querySelectorAll("#areaGranularityGroup .seg-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.granularity === p.areaGranularity);
  });
  document.querySelectorAll("#prideVisibilityToggle button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.vis === p.prideVisibility);
  });

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

  document.getElementById("openRegBtn").addEventListener("click", () => {
    goStep(1);
    switchView("register");
  });
  document.getElementById("editProfileFromHomeBtn").addEventListener("click", () => {
    goStep(1);
    switchView("register");
  });

  // 開発用：「🔄 最初に戻す」で真っさらな初回登録(Step 1)へ完全リセット
  const resetBtn = document.getElementById("resetToStartBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const ok = window.confirm("【開発用リセット】\n入力した名刺やテスト投稿をすべて消して、最初の登録画面（Step 1）からやり直しますか？");
      if (!ok) return;
      Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
      location.reload();
    });
  }
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
    toggleArrayItem(state.profile.activities, btn.dataset.activity);
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

  // ==================== つぶやき＆動画タブ ====================
  document.getElementById("feedFilterBar").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-feedfilter]");
    if (!btn) return;
    state.feedFilter = btn.dataset.feedfilter;
    document.querySelectorAll("#feedFilterBar button").forEach(b => b.classList.toggle("active", b === btn));
    renderFeedView();
  });

  document.getElementById("openFeedPostBtn").addEventListener("click", () => {
    document.getElementById("feedPostModal").classList.remove("hidden");
  });

  document.getElementById("feedTypeSwitch").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-feedtype]");
    if (!btn) return;
    state.feedPostType = btn.dataset.feedtype;
    document.querySelectorAll("#feedTypeSwitch .seg-btn").forEach(b => b.classList.toggle("active", b === btn));
  });

  document.getElementById("feedPostForm").addEventListener("submit", handleFeedSubmit);

  // ==================== EN一覧・投稿 ====================
  document.getElementById("enModeTabs").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-enmode]");
    if (!btn) return;
    state.enMode = btn.dataset.enmode;
    document.querySelectorAll("#enModeTabs button").forEach(b => b.classList.toggle("active", b === btn));
    renderEnRoomList();
  });

  document.getElementById("enFilterBar").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;
    state.enFilter = btn.dataset.filter;
    document.querySelectorAll("#enFilterBar button").forEach(b => b.classList.toggle("active", b === btn));
    renderEnRoomList();
  });

  document.getElementById("openPostModalBtn").addEventListener("click", () => openPostModal("project"));
  document.getElementById("quickPostFromHomeBtn").addEventListener("click", () => {
    switchView("en");
    openPostModal("project");
  });

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

  // ==================== フル画面・専用EN開発ルーム ====================
  document.getElementById("backToEnListBtn").addEventListener("click", () => switchView("en"));

  document.getElementById("roomViewModeSwitch").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-roomview]");
    if (!btn) return;
    state.roomViewMode = btn.dataset.roomview;
    document.querySelectorAll("#roomViewModeSwitch button").forEach(b => b.classList.toggle("active", b === btn));
    renderActiveEnRoom();
  });

  document.getElementById("roomInnerTabs").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-roomtab]");
    if (!btn) return;
    state.roomInnerTab = btn.dataset.roomtab;
    document.querySelectorAll("#roomInnerTabs button").forEach(b => b.classList.toggle("active", b === btn));
    renderActiveEnRoom();
  });

  document.getElementById("roomMediaInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    state.pendingRoomMedia = await readMediaFile(file);
    document.getElementById("roomPendingMediaName").textContent = `📎 ${file.name} を添付予定`;
  });

  document.getElementById("roomChatSendBtn").addEventListener("click", handleRoomChatSend);
  document.getElementById("roomChatInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleRoomChatSend();
    }
  });

  // 途中EN追加モーダル
  document.getElementById("openAddEnModalBtn").addEventListener("click", () => {
    state.selectedAddEnText = "";
    document.getElementById("addEnCustomInput").value = "";
    document.querySelectorAll("#addEnRoleChips .select-chip").forEach(c => c.classList.remove("selected"));
    document.getElementById("addEnModal").classList.remove("hidden");
  });

  document.getElementById("addEnRoleChips").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-adden]");
    if (!btn) return;
    state.selectedAddEnText = btn.dataset.adden;
    document.querySelectorAll("#addEnRoleChips .select-chip").forEach(c => c.classList.toggle("selected", c === btn));
  });

  document.getElementById("addEnForm").addEventListener("submit", handleAddEnSubmit);

  // 興味ありモーダル（ワンタップ定型＋自由熱意文）
  document.getElementById("interestQuickChips").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-quickmsg]");
    if (!btn) return;
    const msg = btn.dataset.quickmsg;
    const ta = document.getElementById("interestFreeMsg");
    ta.value = ta.value.trim() ? `${ta.value.trim()}\n${msg}` : msg;
    btn.classList.add("selected");
  });

  document.getElementById("interestForm").addEventListener("submit", handleInterestSubmit);

  // 共通モーダル閉じる
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

/* ==================== 写真・動画読み込みヘルパー ==================== */
function readMediaFile(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const isVideo = file.type.startsWith("video/");
    if (isVideo) {
      // 動画はメモリ軽量＆即再生可能なObjectURLを使用（localStorageパンク防止）
      resolve({ type: "video", url: URL.createObjectURL(file), name: file.name, ephemeral: true });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ type: "image", url: reader.result, name: file.name });
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function renderMediaTag(media, wrapperClass) {
  if (!media || !media.url) return "";
  if (media.type === "video") {
    return `<div class="${wrapperClass}"><video src="${media.url}" controls playsinline preload="metadata"></video></div>`;
  }
  return `<div class="${wrapperClass}"><img src="${media.url}" alt="${escapeHtml(media.name || "添付写真")}" /></div>`;
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
  // 専用開発ルームにいる間はボトムナビの「EN開発」をアクティブ表示
  const navHighlight = viewName === "en-room" ? "en" : viewName;
  document.querySelectorAll("#bottomNav .nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.tab === navHighlight);
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

/* ==================== 登録補助機能 ==================== */
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
    () => applyDemoGeo("📍 現在地を取得しました（必要に応じて町名まで微調整してください）"),
    () => applyDemoGeo("📍 位置情報の許可がオフだったため、サンプル（大阪府 高槻市 富田町）を仮入力しました"),
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

/* ==================== 全体レンダリング ==================== */
function renderAll() {
  renderBusinessCards();
  renderHomeStats();
  renderFeedView();
  renderEnRoomList();
  if (state.activeView === "en-room" && state.currentRoomId) {
    renderActiveEnRoom();
  }
  renderWants();
}

function syncCardModeButtons() {
  document.querySelectorAll(".card-mode-switch button[data-mode]").forEach(btn => {
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

  const reviewBadge = p.photoPendingReview ? `<span class="bc-review-pill">🕒 写真審査中</span>` : "";
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

/* ==================== つぶやき ＆ 動画フィード ==================== */
function renderFeedView() {
  const container = document.getElementById("feedListContainer");
  let list = [...state.feeds];

  if (state.feedFilter === "rescue") list = list.filter(f => f.type === "rescue");
  if (state.feedFilter === "general") list = list.filter(f => f.type === "general");
  if (state.feedFilter === "video") list = list.filter(f => f.media && f.media.type === "video");

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-callout">
        <strong>💬 該当する投稿はまだありません</strong>
        <p>動画つきのつぶやきや、農家のレスキュー速報を最初の1件として投稿してみませんか？</p>
        <button type="button" class="btn btn-accent btn-sm" onclick="document.getElementById('feedPostModal').classList.remove('hidden')">＋ 投稿してみる</button>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(f => {
    const isRescue = f.type === "rescue";
    return `
      <article class="feed-card ${isRescue ? "rescue-card" : ""}">
        <div class="feed-head">
          <div class="feed-author-wrap">
            <div class="feed-avatar">${f.roleIcon || "🌱"}</div>
            <div>
              <div class="feed-author">${escapeHtml(f.author)}</div>
              <div class="feed-meta">📍 ${escapeHtml(f.area || "関西")} ・ ${escapeHtml(f.time || "たった今")}</div>
            </div>
          </div>
          <span class="feed-badge ${isRescue ? "rescue" : "general"}">
            ${isRescue ? "🆘 農家レスキュー" : "💬 一般・つぶやき"}
          </span>
        </div>
        <p class="feed-body">${escapeHtml(f.text)}</p>
        ${renderMediaTag(f.media, "feed-media")}
        <div class="feed-actions">
          <div class="feed-action-left">
            <button type="button" class="btn btn-outline btn-sm" data-like-feed="${f.id}">👏 応援 (${f.likes || 0})</button>
            ${isRescue ? `<button type="button" class="btn btn-primary btn-sm" data-rescue-to-en="${f.id}">🧩 これでEN企画を立てる</button>` : ""}
          </div>
          ${f.media && f.media.type === "video" ? `<span class="mini-note">🎥 動画つき</span>` : ""}
        </div>
      </article>
    `;
  }).join("");

  container.querySelectorAll("[data-like-feed]").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = state.feeds.find(x => x.id === btn.dataset.likeFeed);
      if (!target) return;
      target.likes = (target.likes || 0) + 1;
      saveFeedsSafely();
      renderFeedView();
    });
  });

  container.querySelectorAll("[data-rescue-to-en]").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = state.feeds.find(x => x.id === btn.dataset.rescueToEn);
      if (!target) return;
      createProjectFromSource({
        title: `【レスキュー】${target.text.slice(0, 14)}…`,
        goal: target.text,
        area: target.area,
        kindTabs: ["規格外レスキュー", "新商品開発"],
        sourceAuthor: target.author,
        media: target.media
      });
    });
  });
}

async function handleFeedSubmit(e) {
  e.preventDefault();
  const text = document.getElementById("feedTextInput").value.trim();
  if (!text) return;
  const file = document.getElementById("feedMediaInput").files[0];
  const media = await readMediaFile(file);
  const roleObj = ENJOY_DATA.roles.find(r => r.id === state.profile.mainRole) || ENJOY_DATA.roles[0];

  state.feeds.unshift({
    id: "feed-" + Date.now(),
    type: state.feedPostType,
    author: state.profile.displayName || "つくり手・応援メンバー",
    roleIcon: roleObj.icon,
    area: state.profile.area || "関西エリア",
    time: getNowTimeStr(),
    text,
    media,
    likes: 0,
    isSample: false
  });
  saveFeedsSafely();
  e.target.reset();
  document.getElementById("feedPostModal").classList.add("hidden");
  renderFeedView();
  showToast(state.feedPostType === "rescue" ? "🆘 農家レスキューをタイムラインに投稿しました！" : "💬 つぶやきを投稿しました！");
}

function saveFeedsSafely() {
  // 動画ObjectURLはリロード後無効になるため、保存時は安全にコピー
  const serializable = state.feeds.map(f => {
    if (f.media && f.media.ephemeral) {
      return Object.assign({}, f, { media: null });
    }
    return f;
  });
  EnjoyStore.save(STORAGE_KEYS.FEEDS, serializable);
}

/* ==================== EN 開発ルーム一覧 ＆ 素材・困りごと置き場 ==================== */
function renderEnRoomList() {
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
    list = [state.sampleRoom];
  } else {
    list = list.filter(p => matchesFilter(p));
  }

  let html = "";
  if (isZero) {
    html += `
      <div class="empty-callout">
        <strong>🌱 まだ第1号の企画は生まれていません</strong>
        <p>下の点線カードをタップすると、フル画面の専用開発室（固定メモ・応募承認・途中EN追加）を丸ごと体験できます！</p>
        <button type="button" class="btn btn-accent btn-sm" onclick="openPostModal('project')">＋ 第1号の企画を出す</button>
      </div>
    `;
  }

  if (!list.length) {
    html += `<div class="empty-callout"><p>この条件に合う企画はまだありません。「すべて」に戻すか新しく出してみてください。</p></div>`;
  } else {
    html += list.map(p => {
      const pieces = normalizePieces(p.pieces);
      const kindTags = (p.kindTabs || []).map(t =>
        `<span class="kind-tag ${t.includes("レスキュー") ? "rescue" : ""}">${escapeHtml(t)}</span>`
      ).join("");
      const pinnedCount = (p.messages || []).filter(m => m.pinned).length;
      const appCount = (p.applicants || []).length;

      return `
        <article class="project-card ${p.isSample ? "sample-card" : ""}" data-open-room="${p.id}">
          ${p.isSample ? `<span class="sample-badge">イメージ見本（タップで専用開発室を体験）</span>` : ""}
          ${appCount > 0 ? `<span class="sample-badge" style="background:var(--orange-soft);color:var(--orange);">👋 応募 ${appCount}件</span>` : ""}
          ${kindTags ? `<div class="proj-kind-tags">${kindTags}</div>` : ""}
          <h3 class="proj-title">${escapeHtml(p.title)}</h3>
          <p class="proj-goal">${escapeHtml(p.goal)}</p>
          ${renderMediaTag(p.media, "media-thumb-box")}
          <div class="room-pieces-list" style="margin-bottom:10px;">
            ${pieces.map(pc => `
              <span class="room-piece-chip ${pc.status}" style="font-size:0.7rem;padding:3px 8px;">
                ${escapeHtml(pc.icon || "🧩")} ${escapeHtml(pc.label)}：${pc.status === "open" ? "募集" : "決定"}
              </span>
            `).join("")}
          </div>
          <div class="proj-meta">
            <span>📍 ${escapeHtml(p.area || "関西")}</span>
            <span>📌 固定メモ ${pinnedCount}件</span>
          </div>
        </article>
      `;
    }).join("");
  }

  container.innerHTML = html;
  container.querySelectorAll("[data-open-room]").forEach(card => {
    card.addEventListener("click", () => openEnRoom(card.dataset.openRoom));
  });
}

function normalizePieces(pieces) {
  if (Array.isArray(pieces)) return pieces;
  const icons = { material: "🌾", make: "🍳", pack: "🎨", deliver: "🏪" };
  return Object.keys(pieces || {}).map(k => ({
    id: k,
    icon: icons[k] || "🧩",
    label: pieces[k].label || k,
    status: pieces[k].status || "open",
    memberName: pieces[k].by || ""
  }));
}

function matchesFilter(p) {
  const pieces = normalizePieces(p.pieces);
  const openPieces = pieces.filter(x => x.status === "open");
  if (state.enFilter === "last1") return openPieces.length === 1;
  if (state.enFilter === "myrole") {
    const myRoles = [state.profile.mainRole, ...(state.profile.subRoles || [])];
    return openPieces.some(x => myRoles.includes(x.id));
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
        <strong>🌱 素材・困りごと置き場（まだ0件）</strong>
        <p>「来月みかんが50kg余る」「加工先が見つからず困っている」など、写真・動画や種別タブ付きで気軽に置けます。</p>
        <button type="button" class="btn btn-accent btn-sm" onclick="openPostModal('offer')">＋ 素材・困りごとを置いてみる</button>
      </div>
    `;
    return;
  }

  container.innerHTML = state.offers.map(o => {
    const tags = (o.kindTabs || []).map(t =>
      `<span class="kind-tag ${t.includes("困りごと") ? "rescue" : ""}">${escapeHtml(t)}</span>`
    ).join("");
    return `
      <div class="offer-card-v2">
        ${tags ? `<div class="offer-tags">${tags}</div>` : ""}
        <div style="font-weight:700;font-size:0.93rem;white-space:pre-wrap;">${escapeHtml(o.text)}</div>
        ${renderMediaTag(o.media, "media-thumb-box")}
        <div class="mini-note">📍 ${escapeHtml(o.area || "関西")} ／ 👤 ${escapeHtml(o.author)}</div>
        <div class="offer-actions">
          <button type="button" class="btn btn-primary btn-sm" data-offer-to-proj="${o.id}">🧩 これでEN開発ルームを立ち上げる</button>
          <button type="button" class="btn btn-outline btn-sm" onclick="showToast('👋 投稿者に興味ありを送りました！')">👋 興味あり</button>
        </div>
      </div>
    `;
  }).join("");

  container.querySelectorAll("[data-offer-to-proj]").forEach(btn => {
    btn.addEventListener("click", () => {
      const offer = state.offers.find(x => x.id === btn.dataset.offerToProj);
      if (!offer) return;
      createProjectFromSource({
        title: `${offer.text.slice(0, 16)}コラボ企画`,
        goal: offer.text,
        area: offer.area,
        kindTabs: offer.kindTabs && offer.kindTabs.length ? offer.kindTabs : ["新商品開発"],
        sourceAuthor: offer.author,
        media: offer.media
      });
    });
  });
}

/* ==================== 投稿モーダル ＆ 素材/レスキューからの自動企画化 ==================== */
function openPostModal(defaultType = "project") {
  document.getElementById("postModal").classList.remove("hidden");
  document.getElementById("projArea").value = state.profile.area || "大阪府 高槻市";
  document.getElementById("offerArea").value = state.profile.area || "大阪府 高槻市";
  const btn = document.querySelector(`#postTypeSwitch [data-posttype="${defaultType}"]`);
  if (btn) btn.click();
}

async function handleProjectSubmit(e) {
  e.preventDefault();
  const title = document.getElementById("projTitle").value.trim();
  const goal = document.getElementById("projGoal").value.trim();
  const area = document.getElementById("projArea").value.trim();
  const tag = document.getElementById("projTag").value.trim() || "コラボ募集";
  const kindTabs = Array.from(document.querySelectorAll("#projKindTabs input:checked")).map(c => c.value);
  const openSet = new Set(
    Array.from(document.querySelectorAll("#projOpenPieces input:checked")).map(c => c.value)
  );
  const file = document.getElementById("projMediaInput").files[0];
  const media = await readMediaFile(file);

  const myName = state.profile.displayName || "企画オーナー";
  const basePieces = [
    { id: "material", icon: "🌾", label: "素材", status: openSet.has("material") ? "open" : "filled", memberName: openSet.has("material") ? "" : myName },
    { id: "make", icon: "🍳", label: "形にする", status: openSet.has("make") ? "open" : "filled", memberName: openSet.has("make") ? "" : myName },
    { id: "pack", icon: "🎨", label: "整える包む", status: openSet.has("pack") ? "open" : "filled", memberName: openSet.has("pack") ? "" : myName },
    { id: "deliver", icon: "🏪", label: "届ける試す", status: openSet.has("deliver") ? "open" : "filled", memberName: openSet.has("deliver") ? "" : myName }
  ];

  const wasEmpty = state.projects.length === 0;
  const roleObj = ENJOY_DATA.roles.find(r => r.id === state.profile.mainRole) || ENJOY_DATA.roles[0];

  const newProj = {
    id: "proj-" + Date.now(),
    isSample: false,
    stage: 1,
    title,
    goal,
    area,
    tag,
    kindTabs,
    media,
    pieces: basePieces,
    ownerCard: cloneObj(state.profile),
    members: [
      { roleLabel: `${roleObj.icon} ${roleObj.title}（発起人）`, card: cloneObj(state.profile) }
    ],
    applicants: [],
    messages: [
      {
        id: "m-" + Date.now(),
        who: "sys",
        sender: "システム",
        text: "🎉 新しいEN開発ルームが誕生しました！まずは2社からでもスタートOK。大事な決定は「📌 固定」で残せます。",
        pinned: false,
        time: getNowTimeStr()
      }
    ]
  };

  state.projects.unshift(newProj);
  EnjoyStore.save(STORAGE_KEYS.PROJECTS, state.projects);
  e.target.reset();
  document.getElementById("postModal").classList.add("hidden");
  showToast(wasEmpty ? "🎉 初めての取り組みが生まれました‼️（第1号バッジ獲得）" : "企画をEN開発ルームに出しました！");
  openEnRoom(newProj.id);
}

async function handleOfferSubmit(e) {
  e.preventDefault();
  const text = document.getElementById("offerText").value.trim();
  const area = document.getElementById("offerArea").value.trim();
  const kindTabs = Array.from(document.querySelectorAll("#offerKindTabs input:checked")).map(c => c.value);
  const file = document.getElementById("offerMediaInput").files[0];
  const media = await readMediaFile(file);

  state.offers.unshift({
    id: "offer-" + Date.now(),
    text,
    area,
    kindTabs,
    media,
    author: state.profile.displayName || "つくり手さん"
  });
  EnjoyStore.save(STORAGE_KEYS.OFFERS, state.offers);
  e.target.reset();
  document.getElementById("postModal").classList.add("hidden");
  state.enMode = "offers";
  document.querySelectorAll("#enModeTabs button").forEach(b => b.classList.toggle("active", b.dataset.enmode === "offers"));
  renderAll();
  showToast("🌱 素材・困りごと置き場に投稿しました！");
}

function createProjectFromSource({ title, goal, area, kindTabs, sourceAuthor, media }) {
  const myName = state.profile.displayName || "あなた";
  const myRoleObj = ENJOY_DATA.roles.find(r => r.id === state.profile.mainRole) || ENJOY_DATA.roles[1];

  const newProj = {
    id: "proj-" + Date.now(),
    isSample: false,
    stage: 1,
    title,
    goal,
    area: area || "関西",
    tag: "2社即スタート",
    kindTabs: kindTabs || ["新商品開発"],
    media: media || null,
    // 2社（素材提供者＋あなた）が埋まった状態で即スタート！必要になったら後からEN追加できる
    pieces: [
      { id: "material", icon: "🌾", label: "素材・相談主", status: "filled", memberName: sourceAuthor },
      { id: myRoleObj.id, icon: myRoleObj.icon, label: myRoleObj.title, status: "filled", memberName: myName }
    ],
    ownerCard: cloneObj(state.profile),
    members: [
      {
        roleLabel: "🌾 素材・相談主",
        card: {
          mainRole: "material",
          subRoles: [],
          activities: ["素材提供・相談"],
          displayName: sourceAuthor,
          ageGroup: "40代",
          position: "ceo",
          area: area || "大阪府 高槻市",
          areaGranularity: "broad",
          companyName: `${sourceAuthor}（連携テスト）`,
          phone: "090-0000-0000"
        }
      },
      {
        roleLabel: `${myRoleObj.icon} ${myRoleObj.title}`,
        card: cloneObj(state.profile)
      }
    ],
    applicants: [],
    messages: [
      {
        id: "m-" + Date.now(),
        who: "sys",
        sender: "システム",
        text: `🎉 「${sourceAuthor}」さんの投稿から2社スタートで開発室を立ち上げました！必要になったタイミングで上の「＋ 必要なENを追加募集」からデザイナーや販路を呼べます。`,
        pinned: true,
        time: getNowTimeStr()
      }
    ]
  };

  state.projects.unshift(newProj);
  EnjoyStore.save(STORAGE_KEYS.PROJECTS, state.projects);
  showToast("🧩 2社スタートで専用開発ルームを立ち上げました！");
  openEnRoom(newProj.id);
}

/* ==================== フル画面・専用EN開発ルーム ==================== */
function openEnRoom(projId) {
  state.currentRoomId = projId;
  state.roomViewMode = "inside";
  state.roomInnerTab = "talk";
  state.pendingRoomMedia = null;
  document.getElementById("roomPendingMediaName").textContent = "";

  document.querySelectorAll("#roomViewModeSwitch button").forEach(b => {
    b.classList.toggle("active", b.dataset.roomview === "inside");
  });
  document.querySelectorAll("#roomInnerTabs button").forEach(b => {
    b.classList.toggle("active", b.dataset.roomtab === "talk");
  });

  switchView("en-room");
}

function renderActiveEnRoom() {
  const proj = getProjectById(state.currentRoomId);
  if (!proj) return;

  const isInside = state.roomViewMode === "inside";
  const stageLabels = {
    1: "Step 1：仲間あつめ（2社から進行OK）",
    2: "Step 2：方向性づくり",
    3: "Step 3：試作・仕上げ",
    4: "🎉 完成・お披露目（巣立ち準備OK）"
  };

  document.getElementById("roomStageBadge").textContent = stageLabels[proj.stage || 1];
  document.getElementById("roomTitle").textContent = proj.title;
  document.getElementById("roomGoal").textContent = proj.goal;

  // 添付メディア表示
  const mediaEl = document.getElementById("roomMediaPreview");
  if (proj.media && proj.media.url) {
    mediaEl.classList.remove("hidden");
    mediaEl.innerHTML = proj.media.type === "video"
      ? `<video src="${proj.media.url}" controls playsinline></video>`
      : `<img src="${proj.media.url}" alt="企画メディア" />`;
  } else {
    mediaEl.classList.add("hidden");
    mediaEl.innerHTML = "";
  }

  // 右上アクションボタン（中：ステージ進行 / 外：興味あり送信）
  const actionSlot = document.getElementById("roomActionSlot");
  if (isInside) {
    const nextStageBtnText = proj.stage === 1
      ? "✨ 作るものが決まった！ → Step 2へ"
      : proj.stage === 2
        ? "🍳 試作フェーズへ → Step 3へ"
        : proj.stage === 3
          ? "🎉 商品完成・お披露目！"
          : "✅ 完成お披露目済み";
    actionSlot.innerHTML = `
      <button id="advanceStageBtn" type="button" class="btn btn-primary btn-sm" ${proj.stage >= 4 ? "disabled" : ""}>
        ${nextStageBtnText}
      </button>
    `;
    const advBtn = document.getElementById("advanceStageBtn");
    if (advBtn && proj.stage < 4) {
      advBtn.addEventListener("click", () => {
        proj.stage = (proj.stage || 1) + 1;
        proj.messages.push({
          id: "m-" + Date.now(),
          who: "sys",
          sender: "システム",
          text: `🚀 開発ステージが「${stageLabels[proj.stage]}」に進みました！`,
          pinned: true,
          time: getNowTimeStr()
        });
        saveProjectState(proj);
        renderActiveEnRoom();
        showToast(`🚀 ${stageLabels[proj.stage]} に進みました！`);
      });
    }
  } else {
    actionSlot.innerHTML = `
      <button id="outsideInterestBtn" type="button" class="btn btn-accent btn-sm">👋 興味ありを送る</button>
    `;
    document.getElementById("outsideInterestBtn").addEventListener("click", () => openInterestModal(proj.id, ""));
  }

  // 参加ピース一覧（空きピースタップで興味ありモーダル起動）
  const pieces = normalizePieces(proj.pieces);
  proj.pieces = pieces;
  const piecesList = document.getElementById("roomPiecesList");
  piecesList.innerHTML = pieces.map(pc => `
    <button type="button" class="room-piece-chip ${pc.status}" data-piece-click="${pc.id}">
      ${escapeHtml(pc.icon || "🧩")} ${escapeHtml(pc.label)}：${pc.status === "open" ? "募集中（タップで応募）" : escapeHtml(pc.memberName || "決定")}
    </button>
  `).join("");

  piecesList.querySelectorAll("[data-piece-click]").forEach(btn => {
    btn.addEventListener("click", () => {
      const pc = pieces.find(x => x.id === btn.dataset.pieceClick);
      if (pc && pc.status === "open") {
        openInterestModal(proj.id, pc.id);
      } else {
        // 決定済みメンバーならメンバータブへジャンプ
        state.roomInnerTab = "members";
        document.querySelectorAll("#roomInnerTabs button").forEach(b => b.classList.toggle("active", b.dataset.roomtab === "members"));
        renderActiveEnRoom();
      }
    });
  });

  // 途中EN追加ボタンは「中の開発室」のときだけ表示
  document.getElementById("openAddEnModalBtn").classList.toggle("hidden", !isInside);

  // タブ表示切替
  const isTalk = state.roomInnerTab === "talk";
  document.getElementById("roomTabTalk").classList.toggle("hidden", !isTalk);
  document.getElementById("roomTabMembers").classList.toggle("hidden", isTalk);

  // タブボタンに応募件数バッジを反映
  const membersTabBtn = document.querySelector('#roomInnerTabs [data-roomtab="members"]');
  const appLen = (proj.applicants || []).length;
  membersTabBtn.textContent = appLen > 0 ? `👥 メンバー ＆ 応募承認（${appLen}）` : "👥 メンバー ＆ 応募承認";

  if (isTalk) {
    renderRoomPinnedAndChat(proj, isInside);
  } else {
    renderRoomMembersAndApplicants(proj, isInside);
  }
}

function renderRoomPinnedAndChat(proj, isInside) {
  const msgs = proj.messages || [];
  const pinnedMsgs = msgs.filter(m => m.pinned);

  document.getElementById("pinnedCountBadge").textContent = `${pinnedMsgs.length}件（上下スクロール可）`;
  const pinnedArea = document.getElementById("pinnedScrollArea");

  if (!pinnedMsgs.length) {
    pinnedArea.innerHTML = `<p class="mini-note">トーク内の発言で「📌 固定」を押すと、何件でも流れないメモとしてここに残ります。</p>`;
  } else {
    pinnedArea.innerHTML = pinnedMsgs.map(m => `
      <div class="pinned-item">
        <div>
          <div>${escapeHtml(m.text)}</div>
          <div class="pinned-item-meta">👤 ${escapeHtml(m.sender || "メンバー")} ・ ${escapeHtml(m.time || "")}</div>
        </div>
        ${isInside ? `<button type="button" class="unpin-btn" data-toggle-pin="${m.id}">解除</button>` : ""}
      </div>
    `).join("");
  }

  // トーク一覧（「外からの見え方」では内部トークを保護表示）
  const chatWrap = document.getElementById("roomChatMessages");
  const composer = document.getElementById("roomChatInputWrap");

  if (!isInside) {
    composer.classList.add("hidden");
    chatWrap.innerHTML = `
      <div class="empty-callout" style="margin:0;">
        <strong>🔒 メンバー限定の開発トークは保護されています</strong>
        <p>上の「📌 決まったこと・固定メモ」だけ外からも安心して確認できます。参加するには「👋 興味あり」を送ってください！</p>
        <button type="button" class="btn btn-accent btn-sm" id="chatOutsideJoinBtn">👋 この企画に興味ありを送る</button>
      </div>
    `;
    document.getElementById("chatOutsideJoinBtn").addEventListener("click", () => openInterestModal(proj.id, ""));
  } else {
    composer.classList.remove("hidden");
    chatWrap.innerHTML = msgs.map(m => `
      <div class="chat-row ${m.who || "other"}">
        ${m.who !== "sys" ? `<span class="chat-sender">${escapeHtml(m.sender || "")} ・ ${escapeHtml(m.time || "")}</span>` : ""}
        <div class="chat-bubble">
          ${escapeHtml(m.text)}
          ${renderMediaTag(m.media, "chat-media")}
        </div>
        ${m.who !== "sys" ? `
          <div class="chat-msg-footer">
            <button type="button" class="pin-msg-btn ${m.pinned ? "pinned" : ""}" data-toggle-pin="${m.id}">
              ${m.pinned ? "📌 固定中" : "📌 固定する"}
            </button>
          </div>
        ` : ""}
      </div>
    `).join("");
    chatWrap.scrollTop = chatWrap.scrollHeight;
  }

  // 固定／解除ボタンの一括バインド
  document.querySelectorAll("[data-toggle-pin]").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = (proj.messages || []).find(m => m.id === btn.dataset.togglePin);
      if (!target) return;
      target.pinned = !target.pinned;
      saveProjectState(proj);
      renderRoomPinnedAndChat(proj, isInside);
      showToast(target.pinned ? "📌 上部の固定メモに追加しました！" : "固定メモから解除しました");
    });
  });
}

function handleRoomChatSend() {
  const proj = getProjectById(state.currentRoomId);
  if (!proj) return;
  const input = document.getElementById("roomChatInput");
  const text = input.value.trim();
  if (!text && !state.pendingRoomMedia) return;

  proj.messages = proj.messages || [];
  proj.messages.push({
    id: "m-" + Date.now(),
    who: "me",
    sender: state.profile.displayName || "あなた",
    text: text || "（写真・動画を共有しました）",
    media: state.pendingRoomMedia,
    pinned: false,
    time: getNowTimeStr()
  });

  input.value = "";
  state.pendingRoomMedia = null;
  document.getElementById("roomMediaInput").value = "";
  document.getElementById("roomPendingMediaName").textContent = "";

  // 動画ObjectURLは保存対象から安全に除外
  if (proj.id === state.sampleRoom.id) {
    EnjoyStore.save(STORAGE_KEYS.SAMPLE_STATE, stripEphemeralMedia(proj));
  } else {
    EnjoyStore.save(STORAGE_KEYS.PROJECTS, state.projects.map(stripEphemeralMedia));
  }
  renderActiveEnRoom();
}

function stripEphemeralMedia(proj) {
  const cp = cloneObj(proj);
  if (cp.media && cp.media.ephemeral) cp.media = null;
  if (Array.isArray(cp.messages)) {
    cp.messages.forEach(m => {
      if (m.media && m.media.ephemeral) m.media = null;
    });
  }
  return cp;
}

function renderRoomMembersAndApplicants(proj, isInside) {
  const appArea = document.getElementById("roomApplicantsArea");
  const memArea = document.getElementById("roomMembersList");
  const applicants = proj.applicants || [];
  const members = proj.members || [];

  if (isInside && applicants.length) {
    appArea.innerHTML = `
      <h3 class="card-title" style="margin-bottom:8px;">👋 届いている「興味あり」応募（${applicants.length}件）</h3>
      ${applicants.map(app => `
        <div class="applicant-card">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
            <strong>${escapeHtml(app.card.displayName || "応募者")}</strong>
            <span class="stage-pill">希望EN：${escapeHtml(app.roleLabel)}</span>
          </div>
          <div class="mini-note">📍 ${escapeHtml(app.card.area || "関西")} ／ ${escapeHtml(app.card.capacity || "")}</div>
          <div class="applicant-msg">${escapeHtml(app.message)}</div>
          <div class="applicant-actions">
            <button type="button" class="btn btn-primary btn-sm" data-approve-app="${app.id}">🤝 メンバーに迎える（名刺ロック解除）</button>
            <button type="button" class="btn btn-outline btn-sm" data-decline-app="${app.id}">今回は見送る</button>
          </div>
        </div>
      `).join("")}
    `;

    appArea.querySelectorAll("[data-approve-app]").forEach(btn => {
      btn.addEventListener("click", () => approveApplicant(proj, btn.dataset.approveApp));
    });
    appArea.querySelectorAll("[data-decline-app]").forEach(btn => {
      btn.addEventListener("click", () => {
        proj.applicants = proj.applicants.filter(a => a.id !== btn.dataset.declineApp);
        saveProjectState(proj);
        renderActiveEnRoom();
        showToast("応募リストから整理しました");
      });
    });
  } else {
    appArea.innerHTML = "";
  }

  // 参加メンバー名刺（中の開発室＝マッチ後全開示、外から＝マッチ前ロック）
  const cardMode = isInside ? "post" : "pre";
  memArea.innerHTML = members.map(m => `
    <div>
      <div class="mini-title" style="margin-bottom:6px;">担当EN：${escapeHtml(m.roleLabel)}</div>
      <div class="business-card">${buildBusinessCardHTML(m.card, cardMode)}</div>
    </div>
  `).join("");
}

function approveApplicant(proj, appId) {
  const app = (proj.applicants || []).find(a => a.id === appId);
  if (!app) return;

  // 該当ピースを「決定」に更新
  const piece = (proj.pieces || []).find(p => p.id === app.roleId && p.status === "open")
    || (proj.pieces || []).find(p => p.status === "open");
  if (piece) {
    piece.status = "filled";
    piece.memberName = app.card.displayName || "新メンバー";
  }

  proj.members = proj.members || [];
  proj.members.push({ roleLabel: app.roleLabel, card: app.card });
  proj.applicants = proj.applicants.filter(a => a.id !== appId);
  proj.messages = proj.messages || [];
  proj.messages.push({
    id: "m-" + Date.now(),
    who: "sys",
    sender: "システム",
    text: `🤝 ${app.card.displayName} さんが「${app.roleLabel}」として合流しました！お互いの詳細名刺（社名・電話・秘密条件）がロック解除されました。`,
    pinned: false,
    time: getNowTimeStr()
  });

  state.matches[proj.id] = { matchedAt: Date.now() };
  EnjoyStore.save(STORAGE_KEYS.MATCHES, state.matches);
  saveProjectState(proj);
  renderAll();
  showToast(`🤝 ${app.card.displayName} さんを迎えました！名刺が全開示されました`);
}

/* ==================== 途中EN追加 ＆ 興味あり送信 ==================== */
function handleAddEnSubmit(e) {
  e.preventDefault();
  const proj = getProjectById(state.currentRoomId);
  if (!proj) return;

  const custom = document.getElementById("addEnCustomInput").value.trim();
  const labelRaw = custom || state.selectedAddEnText;
  if (!labelRaw) {
    showToast("追加したい職種・企業タイプを選ぶか入力してください");
    return;
  }

  // 先頭に絵文字があれば分離、なければ🧩
  const iconMatch = labelRaw.match(/^(\p{Extended_Pictographic})\s*(.+)$/u);
  const icon = iconMatch ? iconMatch[1] : "🧩";
  const label = iconMatch ? iconMatch[2] : labelRaw;

  proj.pieces = normalizePieces(proj.pieces);
  proj.pieces.push({
    id: "custom-en-" + Date.now(),
    icon,
    label,
    status: "open",
    memberName: ""
  });

  proj.messages = proj.messages || [];
  proj.messages.push({
    id: "m-" + Date.now(),
    who: "sys",
    sender: "システム",
    text: `➕ 新たに「${icon} ${label}」のEN枠を追加募集しました！`,
    pinned: false,
    time: getNowTimeStr()
  });

  saveProjectState(proj);
  document.getElementById("addEnModal").classList.add("hidden");
  renderActiveEnRoom();
  showToast(`➕ 「${icon} ${label}」を開発室に追加募集しました！`);
}

function openInterestModal(projId, preselectRoleId) {
  const proj = getProjectById(projId);
  if (!proj) return;

  state.interestTargetProjId = projId;
  const openPieces = normalizePieces(proj.pieces).filter(p => p.status === "open");
  const choices = openPieces.length
    ? openPieces
    : [{ id: "support", icon: "🤝", label: "サポート・別枠で参加" }];

  state.interestSelectedRoleId = preselectRoleId && choices.some(c => c.id === preselectRoleId)
    ? preselectRoleId
    : choices[0].id;

  document.getElementById("interestTargetTitle").textContent = `対象企画：${proj.title}`;
  document.getElementById("interestFreeMsg").value = "";
  document.querySelectorAll("#interestQuickChips .select-chip").forEach(c => c.classList.remove("selected"));

  const roleSelect = document.getElementById("interestRoleSelect");
  roleSelect.innerHTML = choices.map(c => `
    <button type="button"
      class="select-chip ${c.id === state.interestSelectedRoleId ? "selected" : ""}"
      data-int-role="${c.id}">
      ${escapeHtml(c.icon || "🧩")} ${escapeHtml(c.label)}
    </button>
  `).join("");

  roleSelect.querySelectorAll("[data-int-role]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.interestSelectedRoleId = btn.dataset.intRole;
      roleSelect.querySelectorAll("[data-int-role]").forEach(b => b.classList.toggle("selected", b === btn));
    });
  });

  document.getElementById("interestModal").classList.remove("hidden");
}

function handleInterestSubmit(e) {
  e.preventDefault();
  const proj = getProjectById(state.interestTargetProjId);
  if (!proj) return;

  const piece = normalizePieces(proj.pieces).find(p => p.id === state.interestSelectedRoleId);
  const roleLabel = piece ? `${piece.icon || "🧩"} ${piece.label}` : "🤝 サポート参加";
  const msg = document.getElementById("interestFreeMsg").value.trim() || "👋 ぜひ一度お話ししてみたいです！";

  proj.applicants = proj.applicants || [];
  proj.applicants.unshift({
    id: "app-" + Date.now(),
    roleId: state.interestSelectedRoleId,
    roleLabel,
    message: msg,
    card: cloneObj(state.profile.displayName ? state.profile : Object.assign({}, state.profile, { displayName: "あなた（テストユーザー）" }))
  });

  saveProjectState(proj);
  document.getElementById("interestModal").classList.add("hidden");

  // そのまま開発室の「メンバー＆応募承認」タブで承認体験できるように誘導
  state.currentRoomId = proj.id;
  state.roomViewMode = "inside";
  state.roomInnerTab = "members";
  document.querySelectorAll("#roomViewModeSwitch button").forEach(b => b.classList.toggle("active", b.dataset.roomview === "inside"));
  document.querySelectorAll("#roomInnerTabs button").forEach(b => b.classList.toggle("active", b.dataset.roomtab === "members"));

  switchView("en-room");
  showToast("👋 興味ありを送信しました！（メンバータブから承認体験もテストできます）");
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

function getNowTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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
  toastTimer = setTimeout(() => el.classList.add("hidden"), 3000);
}