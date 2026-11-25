/* =========================================================
   EN•joy Stage 1 アプリ本体ロジック (v5)
   - 登録フロー完全刷新：スマホ集中モード / 2列3行役割 / 未選択赤エラー
   - 順番変更：①役割 → ②活動＆状態 → ③タイプ別熱量入力 → ④基本情報(1人/チーム)
   - 完了時：実物カード風の「完成マイ名刺」お披露目演出
   - EN開発ルーム（複数人チームの発言者1タップ切替対応）・つぶやき＆動画継承
========================================================= */

const defaultProfile = {
  registered: false,
  mainRole: "",          // v3: 初期未選択（未選択ガード＆赤枠エラー用）
  otherRoleText: "",
  otherPushOk: true,
  activities: [],
  subRoles: [],
  subRoleExploring: false,
  customSubRoles: [],
  userStage: "",         // maker | idea | skill | connect | fan
  accountType: "solo",   // solo | team
  photoDataUrl: "",
  photoPendingReview: false,
  favoritePhotos: [],    // 最大5枚の好きなこと写真（DataURL配列）
  profileBio: "",        // 任意の自己紹介文
  displayName: "",
  ageGroup: "30代",
  exactAge: "",
  area: "",
  areaGranularity: "broad",
  interests: [],
  referralCode: "",
  // Step 3 (maker / skill)
  capacityTags: [],
  capacity: "",
  pride: "",
  prideVisibility: "public",
  secretPride: "",
  products: [],
  // Step 3 (idea)
  ideaMemo: "",
  seekingPartners: [],
  ideaNote: "",
  // Step 3 (connect)
  connectBio: "",
  // Step 3 (fan)
  fanGenres: [],
  fanMonitorOk: true,
  fanMessage: "",
  // Step 4 (solo / team)
  companyName: "",
  phone: "",
  teamCode: "",
  teamMembers: [
    { id: "tm-1", name: "", role: "", phone: "", isPrimary: true }
  ],
  activeSpeakerId: "tm-1"
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

function loadProfile() {
  const saved = EnjoyStore.load(STORAGE_KEYS.PROFILE, null);
  const p = Object.assign(cloneObj(defaultProfile), saved || {});
  if (!Array.isArray(p.teamMembers) || !p.teamMembers.length) {
    p.teamMembers = [{ id: "tm-1", name: "", role: "", phone: "", isPrimary: true }];
  }
  return p;
}

let state = {
  step: 1,
  activeView: "register",
  cardMode: "pre",
  enMode: "projects",
  enFilter: "all",
  feedFilter: "all",
  feedPostType: "general",
  currentRoomId: null,
  roomViewMode: "inside",
  roomInnerTab: "talk",
  pendingRoomMedia: null,
  interestTargetProjId: null,
  interestSelectedRoleId: "",
  selectedAddEnText: "",
  activityModalRoleId: "",     // 子モーダルで現在フォーカスしている役割ID
  activityModalScope: "focused", // focused | all
  profile: loadProfile(),
  projects: EnjoyStore.load(STORAGE_KEYS.PROJECTS, []),
  sampleRoom: loadSampleRoom(),
  offers: EnjoyStore.load(STORAGE_KEYS.OFFERS, []),
  feeds: loadFeeds(),
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

  if (state.profile.registered) {
    switchView("home");
  } else {
    goStep(1);
    switchView("register");
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
    EnjoyStore.save(STORAGE_KEYS.SAMPLE_STATE, stripEphemeralMedia(state.sampleRoom));
  } else {
    EnjoyStore.save(STORAGE_KEYS.PROJECTS, state.projects.map(stripEphemeralMedia));
  }
}

function getProjectById(id) {
  if (id === state.sampleRoom.id) return state.sampleRoom;
  return state.projects.find(p => p.id === id) || null;
}

/* ==================== 登録画面レンダリング ==================== */
function initStaticRender() {
  renderRoleTiles();
  renderStep2Content();
  renderStep3ByStage();
  renderStep4AccountUI();
  renderAgeGroups();
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

  // Step 1 次へボタンの活性化見た目（未選択＝灰色）
  const nextBtn = document.getElementById("step1NextBtn");
  const hasRole = !!state.profile.mainRole;
  nextBtn.classList.toggle("btn-muted", !hasRole);
  if (hasRole) {
    grid.classList.remove("has-error");
    document.getElementById("step1ErrorMsg").classList.add("hidden");
  }
}

function renderStep2Content() {
  renderActivities();
  renderCustomActivityGuide();
  renderSubRoles();
  renderSubRoleActivities();
  renderUserStages();
}

function renderActivities() {
  const container = document.getElementById("activityChips");
  const baseList = ENJOY_DATA.activitiesByRole[state.profile.mainRole] || [];
  // 選んだ活動のうち兼業側固有ではないカスタム追加も含め、最後に「模索中」チップを置く
  const subPool = new Set(
    (state.profile.subRoles || []).flatMap(rid => ENJOY_DATA.activitiesByRole[rid] || [])
  );
  const extras = (state.profile.activities || []).filter(
    a => !baseList.includes(a) && !subPool.has(a) && a !== ENJOY_DATA.exploringActivityLabel
  );
  const merged = Array.from(new Set([...baseList, ...extras, ENJOY_DATA.exploringActivityLabel]));

  container.innerHTML = merged.map(act => `
    <button type="button"
      class="select-chip ${state.profile.activities.includes(act) ? "selected" : ""}"
      data-activity="${escapeHtml(act)}">
      ${escapeHtml(act)}
    </button>
  `).join("");
}

function renderCustomActivityGuide() {
  const guide = ENJOY_DATA.activityGuidesByRole[state.profile.mainRole] || {
    label: "リストにない活動名を追加",
    placeholder: "例：完熟いちご、小ロット試作、マルシェ企画"
  };
  document.getElementById("customActivityLabel").textContent = guide.label;
  document.getElementById("customActivityInput").placeholder = guide.placeholder;
}

function renderSubRoles() {
  const container = document.getElementById("subRoleChips");
  const candidates = ENJOY_DATA.roles.filter(r => r.id !== state.profile.mainRole && r.id !== "other");
  const customSubs = state.profile.customSubRoles || [];

  const roleHtml = candidates.map(r => `
    <button type="button"
      class="select-chip ${state.profile.subRoles.includes(r.id) ? "selected" : ""}"
      data-subrole="${r.id}">
      ${r.icon} ${r.title}もOK
    </button>
  `).join("");

  const customHtml = customSubs.map(label => `
    <button type="button"
      class="select-chip selected"
      data-custom-subrole="${escapeHtml(label)}" title="タップで解除">
      ✨ ${escapeHtml(label)} ✕
    </button>
  `).join("");

  const exploringHtml = `
    <button type="button"
      class="select-chip ${state.profile.subRoleExploring ? "selected" : ""}"
      data-subrole-exploring="true">
      💡 まだ模索中
    </button>
  `;

  container.innerHTML = roleHtml + customHtml + exploringHtml;
}

// 兼業を選んだ直下に、その兼業ロールの具体的な活動（模索中・自由追加・全タブ検索つき）を展開
function renderSubRoleActivities() {
  const wrap = document.getElementById("subRoleActivitiesWrap");
  const subs = state.profile.subRoles || [];
  if (!subs.length) {
    wrap.innerHTML = "";
    return;
  }

  wrap.innerHTML = subs.map(rid => {
    const roleObj = ENJOY_DATA.roles.find(r => r.id === rid);
    const baseActs = ENJOY_DATA.activitiesByRole[rid] || [];
    const acts = Array.from(new Set([...baseActs, ENJOY_DATA.exploringActivityLabel]));
    const guide = ENJOY_DATA.activityGuidesByRole[rid] || {
      label: "リストにない活動を追加",
      placeholder: "例：小ロット試作、写真撮影"
    };
    return `
      <div class="subrole-activity-block" data-subblock="${rid}">
        <div class="subrole-activity-head">
          <div class="subrole-activity-title">└ ${roleObj ? `${roleObj.icon} ${roleObj.title}` : rid} の具体的な活動（任意）</div>
          <span class="hierarchy-pill child-pill">詳細・活動</span>
        </div>
        <div class="chip-group" style="margin-bottom:4px;">
          ${acts.map(act => `
            <button type="button"
              class="select-chip ${state.profile.activities.includes(act) ? "selected" : ""}"
              data-sub-activity="${escapeHtml(act)}">
              ${escapeHtml(act)}
            </button>
          `).join("")}
        </div>
        <div class="subrole-helper-btns">
          <button type="button" class="btn btn-outline btn-sm" data-toggle-subcustom="${rid}">＋ リストにない活動</button>
          <button type="button" class="btn btn-outline btn-sm" data-open-allact-role="${rid}">🔍 すべてのタブを見る</button>
        </div>
        <div class="subrole-custom-box hidden" id="subCustomBox-${rid}">
          <label class="field-label" style="font-size:0.78rem;">${escapeHtml(guide.label)}</label>
          <div class="inline-add">
            <input class="text-input" type="text" id="subCustomInput-${rid}" placeholder="${escapeHtml(guide.placeholder)}" />
            <button type="button" class="btn btn-primary btn-sm" data-add-subcustom="${rid}">追加</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  wrap.querySelectorAll("[data-sub-activity]").forEach(btn => {
    btn.addEventListener("click", () => {
      toggleArrayItem(state.profile.activities, btn.dataset.subActivity);
      saveProfile();
      renderSubRoleActivities();
      renderActivities();
    });
  });

  wrap.querySelectorAll("[data-toggle-subcustom]").forEach(btn => {
    btn.addEventListener("click", () => {
      const rid = btn.dataset.toggleSubcustom;
      const box = document.getElementById(`subCustomBox-${rid}`);
      if (!box) return;
      const willShow = box.classList.contains("hidden");
      box.classList.toggle("hidden", !willShow);
      if (willShow) document.getElementById(`subCustomInput-${rid}`)?.focus();
    });
  });

  wrap.querySelectorAll("[data-add-subcustom]").forEach(btn => {
    btn.addEventListener("click", () => {
      const rid = btn.dataset.addSubcustom;
      const inp = document.getElementById(`subCustomInput-${rid}`);
      const val = inp ? inp.value.trim() : "";
      if (!val) return;
      if (!state.profile.activities.includes(val)) {
        state.profile.activities.push(val);
      }
      inp.value = "";
      saveProfile();
      renderActivities();
      renderSubRoleActivities();
      showToast(`「${val}」を追加しました`);
    });
  });

  wrap.querySelectorAll("[data-open-allact-role]").forEach(btn => {
    btn.addEventListener("click", () => {
      openActivitiesModalForRole(btn.dataset.openAllactRole);
    });
  });
}

function renderUserStages() {
  const list = document.getElementById("userStageList");
  list.innerHTML = ENJOY_DATA.userStages.map(st => `
    <button type="button"
      class="stage-choice-card ${state.profile.userStage === st.id ? "selected" : ""}"
      data-userstage="${st.id}">
      <span class="stage-choice-icon">${st.icon}</span>
      <div>
        <span class="stage-choice-title">${st.title}</span>
        <span class="stage-choice-sub">${st.sub}</span>
      </div>
    </button>
  `).join("");

  const hasStage = !!state.profile.userStage;
  document.getElementById("step2NextBtn").classList.toggle("btn-muted", !hasStage);
  if (hasStage) {
    list.classList.remove("has-error");
    document.getElementById("step2StageErrorMsg").classList.add("hidden");
  }
}

// 親階層：「すべての兼業・業種から探す」モーダル描画（役割・業種の大分類のみ）
function openAllSubRolesModal() {
  document.getElementById("allSubRolesSearchInput").value = "";
  renderAllSubRolesModal("");
  document.getElementById("allSubRolesModal").classList.remove("hidden");
}

function renderAllSubRolesModal(keyword = "") {
  const container = document.getElementById("allSubRolesResult");
  const q = keyword.trim().toLowerCase();
  let html = "";

  // 1. 基本の役割（メイン以外）
  const baseRoles = ENJOY_DATA.roles.filter(r =>
    r.id !== state.profile.mainRole &&
    r.id !== "other" &&
    (!q || r.title.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q))
  );
  if (baseRoles.length) {
    html += `
      <div>
        <div class="all-act-group-title">🌱 基本の役割（選ぶと下に具体活動が展開されます・最大2つ）</div>
        <div class="chip-group" style="margin-bottom:4px;">
          ${baseRoles.map(r => `
            <button type="button"
              class="select-chip ${state.profile.subRoles.includes(r.id) ? "selected" : ""}"
              data-modal-subrole="${r.id}">
              ${r.icon} ${r.title}（${r.sub}）
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  // 2. 拡張業種・役割カタログ（親階層）
  (ENJOY_DATA.subRoleCatalog || []).forEach(group => {
    const items = group.items.filter(item => !q || item.toLowerCase().includes(q));
    if (!items.length) return;
    html += `
      <div>
        <div class="all-act-group-title">${escapeHtml(group.category)}</div>
        <div class="chip-group" style="margin-bottom:4px;">
          ${items.map(item => `
            <button type="button"
              class="select-chip ${(state.profile.customSubRoles || []).includes(item) ? "selected" : ""}"
              data-modal-custom-subrole="${escapeHtml(item)}">
              ✨ ${escapeHtml(item)}
            </button>
          `).join("")}
        </div>
      </div>
    `;
  });

  if (!html) {
    html = `<p class="mini-note">「${escapeHtml(keyword)}」に一致する業種が見つかりませんでした。「＋ リストにない兼業」から自由に追加できます。</p>`;
  }
  container.innerHTML = html;

  container.querySelectorAll("[data-modal-subrole]").forEach(btn => {
    btn.addEventListener("click", () => {
      const rid = btn.dataset.modalSubrole;
      if (state.profile.subRoles.includes(rid)) {
        state.profile.subRoles = state.profile.subRoles.filter(x => x !== rid);
      } else {
        if (state.profile.subRoles.length >= 2) {
          showToast("基本の役割の兼業は最大2つまで追加できます");
          return;
        }
        state.profile.subRoles.push(rid);
      }
      saveProfile();
      renderSubRoles();
      renderSubRoleActivities();
      renderAllSubRolesModal(document.getElementById("allSubRolesSearchInput").value);
    });
  });

  container.querySelectorAll("[data-modal-custom-subrole]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.profile.customSubRoles = state.profile.customSubRoles || [];
      toggleArrayItem(state.profile.customSubRoles, btn.dataset.modalCustomSubrole);
      saveProfile();
      renderSubRoles();
      renderAllSubRolesModal(document.getElementById("allSubRolesSearchInput").value);
    });
  });
}

// 子階層：「具体的な活動から探す」モーダル（対象ロールの活動だけ優先表示＋全ジャンル切替可）
function openActivitiesModalForRole(roleId) {
  const targetRoleId = roleId || state.profile.mainRole || "material";
  state.activityModalRoleId = targetRoleId;
  state.activityModalScope = "focused";

  const roleObj = ENJOY_DATA.roles.find(r => r.id === targetRoleId);
  const titleEl = document.getElementById("allActivitiesModalTitle");
  const focusedBtn = document.getElementById("actScopeFocusedBtn");

  if (roleObj) {
    titleEl.textContent = `🔍 ${roleObj.icon} ${roleObj.title} の活動から探す`;
    focusedBtn.textContent = `${roleObj.icon} ${roleObj.title}の活動だけ`;
  } else {
    titleEl.textContent = "🔍 具体的な活動から探す";
    focusedBtn.textContent = "この役割の活動だけ";
  }

  document.querySelectorAll("#allActivitiesScopeSwitch .seg-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.actscope === "focused");
  });
  document.getElementById("allActivitiesSearchInput").value = "";
  renderAllActivitiesModal("");
  document.getElementById("allActivitiesModal").classList.remove("hidden");
}

function renderAllActivitiesModal(keyword = "") {
  const container = document.getElementById("allActivitiesResult");
  const q = keyword.trim().toLowerCase();
  const rolesToShow = state.activityModalScope === "focused"
    ? ENJOY_DATA.roles.filter(r => r.id === state.activityModalRoleId)
    : ENJOY_DATA.roles;

  let html = "";
  rolesToShow.forEach(r => {
    const base = ENJOY_DATA.activitiesByRole[r.id] || [];
    const ext = (ENJOY_DATA.extendedActivitiesByRole && ENJOY_DATA.extendedActivitiesByRole[r.id]) || [];
    const merged = Array.from(new Set([...base, ...ext])).filter(a => !q || a.toLowerCase().includes(q));
    if (!merged.length) return;
    html += `
      <div>
        <div class="all-act-group-title">${r.icon} ${r.title} の具体的な活動</div>
        <div class="chip-group" style="margin-bottom:4px;">
          ${merged.map(act => `
            <button type="button"
              class="select-chip ${state.profile.activities.includes(act) ? "selected" : ""}"
              data-modal-activity="${escapeHtml(act)}">
              ${escapeHtml(act)}
            </button>
          `).join("")}
        </div>
      </div>
    `;
  });

  if (!html) {
    html = `<p class="mini-note">「${escapeHtml(keyword)}」に一致する活動が見つかりませんでした。「＋ リストにない活動」から自由に追加できます。</p>`;
  }
  container.innerHTML = html;

  container.querySelectorAll("[data-modal-activity]").forEach(btn => {
    btn.addEventListener("click", () => {
      toggleArrayItem(state.profile.activities, btn.dataset.modalActivity);
      saveProfile();
      renderAllActivitiesModal(document.getElementById("allActivitiesSearchInput").value);
      renderActivities();
      renderSubRoleActivities();
    });
  });
}

// Step 3：選んだタイプ（5分類）に合わせてフォームを出し分け
function renderStep3ByStage() {
  const stId = state.profile.userStage || "maker";
  const stObj = ENJOY_DATA.userStages.find(s => s.id === stId) || ENJOY_DATA.userStages[0];

  document.getElementById("step3TypeBadge").textContent = `${stObj.icon} ${stObj.title}`;
  document.getElementById("step3Heading").textContent = stObj.step3Title;
  document.getElementById("step3Desc").textContent = stObj.step3Desc;

  // 安心・対等バナーは事業者・アイデア・スキル系のみ表示（一般ファン・交流は隠して気楽に）
  const showSafety = ["maker", "idea", "skill"].includes(stId);
  document.getElementById("step3SafetyBanner").classList.toggle("hidden", !showSafety);

  // 4ブロックの出し分け
  document.getElementById("stageBlockMakerSkill").classList.toggle("hidden", !(stId === "maker" || stId === "skill"));
  document.getElementById("stageBlockIdea").classList.toggle("hidden", stId !== "idea");
  document.getElementById("stageBlockConnect").classList.toggle("hidden", stId !== "connect");
  document.getElementById("stageBlockFan").classList.toggle("hidden", stId !== "fan");

  // maker vs skill のラベル＆選択チップ（模索中・自由追加・全タブ検索つき）切り替え
  if (stId === "skill") {
    document.getElementById("capacityLabel").textContent = "対応できる規模・得意なこと";
    document.getElementById("customCapacityLabel").textContent = "リストにない対応規模・得意なことを追加（任意）";
    document.getElementById("customCapacityInput").placeholder = "例：小ロット30枚〜OK、ショート動画制作、イベント集客";
    document.getElementById("capacityInput").placeholder = "補足メモ（任意：例 納期目安や詳しい対応範囲など）";
    document.getElementById("prideLabel").textContent = "強み・こだわりポイント";
    document.getElementById("prideInput").placeholder = "例：食品の手土産パッケージが得意です。初回オンライン相談OK！";
    document.getElementById("productSectionLabel").textContent = "🎨 実績・ポートフォリオ・公式HP（カード表示）";
    renderCapacityChips(ENJOY_DATA.skillQuickChips);
  } else {
    document.getElementById("capacityLabel").textContent = "設備・作れる量（生産能力）";
    document.getElementById("customCapacityLabel").textContent = "リストにない設備・作れる量を追加（任意）";
    document.getElementById("customCapacityInput").placeholder = "例：完熟みかん週50kg、低温乾燥機あり、サンプル発送OK";
    document.getElementById("capacityInput").placeholder = "補足メモ（任意：例 週50kgまで、詳しい条件など）";
    document.getElementById("prideLabel").textContent = "自慢ポイント（農作物・技術など）";
    document.getElementById("prideInput").placeholder = "例：糖度14度以上の減農薬みかんを家族で丁寧に育てています。";
    document.getElementById("productSectionLabel").textContent = "📦 自社商品・公式HP（URLではなくカード表示）";
    renderCapacityChips(ENJOY_DATA.capacityQuickChips);
  }

  renderSeekingPartners();
  renderInterests();
  renderFanGenres();
  renderAddedProducts();
}

function renderCapacityChips(baseList) {
  const el = document.getElementById("capacityQuickChips");
  const selected = state.profile.capacityTags || [];
  const extras = selected.filter(t => !baseList.includes(t) && t !== ENJOY_DATA.exploringCapacityLabel);
  const merged = Array.from(new Set([...baseList, ...extras, ENJOY_DATA.exploringCapacityLabel]));

  el.innerHTML = merged.map(text => `
    <button type="button"
      class="select-chip ${selected.includes(text) ? "selected" : ""}"
      data-captag="${escapeHtml(text)}">
      ${escapeHtml(text)}
    </button>
  `).join("");
}

function renderAllCapacitiesModal(keyword = "") {
  const container = document.getElementById("allCapacitiesResult");
  const q = keyword.trim().toLowerCase();
  const selected = state.profile.capacityTags || [];
  let html = "";

  ENJOY_DATA.capacitiesByCategory.forEach(group => {
    const items = group.items.filter(item => !q || item.toLowerCase().includes(q));
    if (!items.length) return;
    html += `
      <div>
        <div class="all-act-group-title">${escapeHtml(group.category)}</div>
        <div class="chip-group" style="margin-bottom:4px;">
          ${items.map(item => `
            <button type="button"
              class="select-chip ${selected.includes(item) ? "selected" : ""}"
              data-modal-cap="${escapeHtml(item)}">
              ${escapeHtml(item)}
            </button>
          `).join("")}
        </div>
      </div>
    `;
  });

  if (!html) {
    html = `<p class="mini-note">「${escapeHtml(keyword)}」に一致する項目が見つかりませんでした。「＋ リストにない項目を追加」から自由に追加できます。</p>`;
  }
  container.innerHTML = html;

  container.querySelectorAll("[data-modal-cap]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.profile.capacityTags = state.profile.capacityTags || [];
      toggleArrayItem(state.profile.capacityTags, btn.dataset.modalCap);
      saveProfile();
      renderAllCapacitiesModal(document.getElementById("allCapacitiesSearchInput").value);
      renderStep3ByStage();
    });
  });
}

// 好きなこと写真（最大5枚）エディタ描画
function renderFavoritePhotosEditor() {
  const grid = document.getElementById("favPhotosGrid");
  const countText = document.getElementById("favPhotosCountText");
  const uploadLabel = document.getElementById("favPhotosUploadLabel");
  if (!grid) return;

  const photos = state.profile.favoritePhotos || [];
  countText.textContent = `${photos.length} / 5 枚`;
  uploadLabel.classList.toggle("hidden", photos.length >= 5);

  let html = photos.map((url, idx) => `
    <div class="fav-photo-thumb">
      <img src="${url}" alt="好きなこと写真 ${idx + 1}" onclick="openPhotoLightbox('${url}')" />
      <button type="button" class="fav-photo-del" data-del-favphoto="${idx}" title="削除">✕</button>
    </div>
  `).join("");

  for (let i = photos.length; i < 5; i++) {
    html += `<div class="fav-photo-slot-empty">＋</div>`;
  }
  grid.innerHTML = html;

  grid.querySelectorAll("[data-del-favphoto]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.delFavphoto);
      state.profile.favoritePhotos.splice(idx, 1);
      saveProfile();
      renderFavoritePhotosEditor();
    });
  });
}

// 画像を軽量リサイズしてDataURL化（5枚＋トップ写真でもlocalStorageがパンクしない安全設計）
function resizeImageToDataUrl(file, maxEdge = 520, quality = 0.78) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch {
          resolve(reader.result);
        }
      };
      img.onerror = () => resolve(reader.result);
      img.src = reader.result;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function openPhotoLightbox(src) {
  if (!src) return;
  document.getElementById("photoLightboxImg").src = src;
  document.getElementById("photoLightboxModal").classList.remove("hidden");
}

function renderSeekingPartners() {
  const el = document.getElementById("seekingPartnerChips");
  el.innerHTML = ENJOY_DATA.seekingPartners.map(item => `
    <button type="button"
      class="select-chip ${(state.profile.seekingPartners || []).includes(item) ? "selected" : ""}"
      data-seeking="${escapeHtml(item)}">
      ${escapeHtml(item)}
    </button>
  `).join("");
}

function renderInterests() {
  const el = document.getElementById("interestChips");
  el.innerHTML = ENJOY_DATA.interests.map(item => `
    <button type="button"
      class="select-chip ${(state.profile.interests || []).includes(item) ? "selected" : ""}"
      data-interest="${escapeHtml(item)}">
      ${escapeHtml(item)}
    </button>
  `).join("");
}

function renderFanGenres() {
  const el = document.getElementById("fanGenreChips");
  el.innerHTML = ENJOY_DATA.fanGenres.map(item => `
    <button type="button"
      class="select-chip ${(state.profile.fanGenres || []).includes(item) ? "selected" : ""}"
      data-fangenre="${escapeHtml(item)}">
      ${escapeHtml(item)}
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

// Step 4：1人で使う vs 複数人チーム（応援・買いたいタイプは超シンプル化）
function renderStep4AccountUI() {
  const isFan = state.profile.userStage === "fan";
  if (isFan) {
    state.profile.accountType = "solo";
  }

  const isTeam = !isFan && state.profile.accountType === "team";

  document.getElementById("accountTypeCard").classList.toggle("hidden", isFan);
  document.getElementById("soloContactCard").classList.toggle("hidden", isFan || isTeam);
  document.getElementById("teamContactCard").classList.toggle("hidden", !isTeam);

  document.querySelectorAll("#accountTypeGroup .account-tile").forEach(tile => {
    tile.classList.toggle("active", tile.dataset.acctype === state.profile.accountType);
  });

  if (isTeam) {
    renderTeamMembersEditor();
    updateTeamCodeDisplay();
  }
}

function renderTeamMembersEditor() {
  const container = document.getElementById("teamMembersEditor");
  const members = state.profile.teamMembers || [];
  if (!members.length) {
    members.push({ id: "tm-1", name: "", role: "", phone: "", isPrimary: true });
    state.profile.teamMembers = members;
  }

  container.innerHTML = members.map((m, idx) => `
    <div class="team-member-card" data-tm-idx="${idx}">
      <div class="team-member-head">
        <span>👤 担当者 ${idx + 1}${idx === 0 ? "（まずはあなた）" : ""}</span>
        <div style="display:flex;align-items:center;gap:6px;">
          <label class="primary-radio-label ${m.isPrimary ? "is-primary" : ""}">
            <input type="radio" name="primaryTeamMember" ${m.isPrimary ? "checked" : ""} data-tm-primary="${idx}" style="margin:0;" />
            ⭐ 最初の窓口
          </label>
          ${idx > 0 ? `<button type="button" class="btn-link" data-tm-del="${idx}">削除</button>` : ""}
        </div>
      </div>
      <div class="two-col-fields">
        <input class="text-input" type="text" placeholder="氏名（例：山田 太郎）" value="${escapeHtml(m.name)}" data-tm-field="name" data-tm-idx="${idx}" />
        <input class="text-input" type="text" placeholder="役割（例：代表・営業・製造）" value="${escapeHtml(m.role)}" data-tm-field="role" data-tm-idx="${idx}" />
      </div>
      <div style="margin-top:6px;">
        <input class="text-input" type="tel" placeholder="直通電話（任意・空欄なら代表番号を表示）" value="${escapeHtml(m.phone)}" data-tm-field="phone" data-tm-idx="${idx}" />
      </div>
    </div>
  `).join("");

  document.getElementById("teamMemberCountText").textContent = members.length;
  document.getElementById("addTeamMemberBtn").disabled = members.length >= 5;

  container.querySelectorAll("[data-tm-field]").forEach(inp => {
    inp.addEventListener("input", (e) => {
      const i = Number(e.target.dataset.tmIdx);
      const field = e.target.dataset.tmField;
      state.profile.teamMembers[i][field] = e.target.value;
      saveProfile();
    });
  });

  container.querySelectorAll("[data-tm-primary]").forEach(radio => {
    radio.addEventListener("change", (e) => {
      const i = Number(e.target.dataset.tmPrimary);
      state.profile.teamMembers.forEach((m, idx) => { m.isPrimary = (idx === i); });
      saveProfile();
      renderTeamMembersEditor();
    });
  });

  container.querySelectorAll("[data-tm-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.tmDel);
      const wasPrimary = state.profile.teamMembers[i]?.isPrimary;
      state.profile.teamMembers.splice(i, 1);
      if (wasPrimary && state.profile.teamMembers.length) {
        state.profile.teamMembers[0].isPrimary = true;
      }
      saveProfile();
      renderTeamMembersEditor();
    });
  });
}

function updateTeamCodeDisplay() {
  const box = document.getElementById("teamCodeDisplayBox");
  const txt = document.getElementById("generatedTeamCodeText");
  if (state.profile.teamCode) {
    box.classList.remove("hidden");
    txt.textContent = state.profile.teamCode;
  } else {
    box.classList.add("hidden");
  }
}

/* ==================== フォーム値同期 ==================== */
function syncFormFromProfile() {
  const p = state.profile;
  setVal("otherRoleInput", p.otherRoleText);
  document.getElementById("otherPushOk").checked = !!p.otherPushOk;
  setVal("displayNameInput", p.displayName);
  setVal("exactAgeInput", p.exactAge);
  setVal("areaInput", p.area);
  setVal("referralInput", p.referralCode);
  setVal("capacityInput", p.capacity);
  setVal("prideInput", p.pride);
  setVal("secretPrideInput", p.secretPride);
  setVal("ideaMemoInput", p.ideaMemo);
  setVal("ideaNoteInput", p.ideaNote);
  setVal("connectBioInput", p.connectBio);
  document.getElementById("fanMonitorCheck").checked = p.fanMonitorOk !== false;
  setVal("fanMessageInput", p.fanMessage);
  setVal("companyNameInput", p.companyName);
  setVal("phoneInput", p.phone);
  setVal("teamCompanyInput", p.companyName);
  setVal("teamPhoneInput", p.phone);

  document.querySelectorAll("#areaGranularityGroup .seg-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.granularity === p.areaGranularity);
  });
  document.querySelectorAll("#prideVisibilityToggle button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.vis === p.prideVisibility);
  });

  setVal("profileBioInput", p.profileBio);

  if (p.photoDataUrl) {
    document.getElementById("photoPreviewImg").src = p.photoDataUrl;
    document.getElementById("photoPreviewImg").classList.remove("hidden");
    document.getElementById("photoPlaceholder").classList.add("hidden");
  }

  renderFavoritePhotosEditor();
  renderAddedProducts();
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || "";
}

/* ==================== イベントバインド ==================== */
function bindEvents() {
  // ヘッダー＆開発用フローティングバー
  document.getElementById("toggleZoneBtn").addEventListener("click", () => {
    const isOn = document.body.classList.toggle("show-zones");
    document.getElementById("zoneStateText").textContent = isOn ? "ON" : "OFF";
    document.getElementById("toggleZoneBtn").classList.toggle("active", isOn);
  });

  document.getElementById("toggleMobileBtn").addEventListener("click", (e) => {
    const on = document.body.classList.toggle("mobile-preview");
    e.currentTarget.classList.toggle("active", on);
  });

  document.getElementById("devExitMobileBtn").addEventListener("click", () => {
    document.body.classList.remove("mobile-preview");
    document.getElementById("toggleMobileBtn").classList.remove("active");
  });

  const handleDevReset = () => {
    const ok = window.confirm("【開発用リセット】\n入力した名刺やテスト投稿をすべて消して、最初の登録画面（Step 1）からやり直しますか？");
    if (!ok) return;
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    location.reload();
  };
  document.getElementById("resetToStartBtn").addEventListener("click", handleDevReset);
  document.getElementById("devResetBtn").addEventListener("click", handleDevReset);

  document.getElementById("openRegBtn").addEventListener("click", () => {
    goStep(1);
    switchView("register");
  });
  document.getElementById("editProfileFromHomeBtn").addEventListener("click", () => {
    goStep(1);
    switchView("register");
  });

  // 前後ステップボタン（Step 3・4用）
  document.querySelectorAll("[data-next]").forEach(btn => {
    btn.addEventListener("click", () => goStep(Number(btn.dataset.next)));
  });
  document.querySelectorAll("[data-prev]").forEach(btn => {
    btn.addEventListener("click", () => goStep(Number(btn.dataset.prev)));
  });

  // Step 1 ロール選択 ＆ 未選択ガード付き次へ
  document.getElementById("roleGrid").addEventListener("click", (e) => {
    const tile = e.target.closest("[data-role]");
    if (!tile) return;
    const picked = tile.dataset.role;
    state.profile.mainRole = picked;
    state.profile.subRoles = state.profile.subRoles.filter(r => r !== picked);
    // 選んだ役割に合わせておすすめタイプを初期提案
    state.profile.userStage = ENJOY_DATA.defaultStageByRole[picked] || "maker";
    saveProfile();
    renderRoleTiles();
    renderStep2Content();
    renderStep3ByStage();
    renderStep4AccountUI();
  });

  document.getElementById("step1NextBtn").addEventListener("click", () => {
    if (!state.profile.mainRole) {
      document.getElementById("roleGrid").classList.add("has-error");
      document.getElementById("step1ErrorMsg").classList.remove("hidden");
      document.getElementById("step1ErrorMsg").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    goStep(2);
  });

  bindInput("otherRoleInput", val => { state.profile.otherRoleText = val; });
  document.getElementById("otherPushOk").addEventListener("change", (e) => {
    state.profile.otherPushOk = e.target.checked;
    saveProfile();
  });

  // Step 2 活動・開閉式自由入力・全タブ検索・兼業・5タイプ選択
  document.getElementById("activityChips").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-activity]");
    if (!btn) return;
    toggleArrayItem(state.profile.activities, btn.dataset.activity);
    saveProfile();
    renderActivities();
  });

  document.getElementById("toggleCustomActivityBtn").addEventListener("click", () => {
    const box = document.getElementById("customActivityBox");
    const willShow = box.classList.contains("hidden");
    box.classList.toggle("hidden", !willShow);
    if (willShow) document.getElementById("customActivityInput").focus();
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
    showToast(`「${val}」を追加しました`);
  });

  document.getElementById("openAllActivitiesBtn").addEventListener("click", () => {
    openActivitiesModalForRole(state.profile.mainRole);
  });

  document.getElementById("allActivitiesScopeSwitch").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-actscope]");
    if (!btn) return;
    state.activityModalScope = btn.dataset.actscope;
    document.querySelectorAll("#allActivitiesScopeSwitch .seg-btn").forEach(b => b.classList.toggle("active", b === btn));
    renderAllActivitiesModal(document.getElementById("allActivitiesSearchInput").value);
  });

  document.getElementById("allActivitiesSearchInput").addEventListener("input", (e) => {
    renderAllActivitiesModal(e.target.value);
  });

  document.getElementById("subRoleChips").addEventListener("click", (e) => {
    const expBtn = e.target.closest("[data-subrole-exploring]");
    if (expBtn) {
      state.profile.subRoleExploring = !state.profile.subRoleExploring;
      saveProfile();
      renderSubRoles();
      return;
    }

    const customBtn = e.target.closest("[data-custom-subrole]");
    if (customBtn) {
      const label = customBtn.dataset.customSubrole;
      state.profile.customSubRoles = (state.profile.customSubRoles || []).filter(x => x !== label);
      saveProfile();
      renderSubRoles();
      return;
    }

    const btn = e.target.closest("[data-subrole]");
    if (!btn) return;
    const rid = btn.dataset.subrole;
    if (state.profile.subRoles.includes(rid)) {
      state.profile.subRoles = state.profile.subRoles.filter(x => x !== rid);
    } else {
      if (state.profile.subRoles.length >= 2) {
        showToast("掛け持ち・兼業は最大2つまで追加できます");
        return;
      }
      state.profile.subRoles.push(rid);
    }
    saveProfile();
    renderSubRoles();
    renderSubRoleActivities();
  });

  document.getElementById("toggleCustomSubRoleBtn").addEventListener("click", () => {
    const box = document.getElementById("customSubRoleBox");
    const willShow = box.classList.contains("hidden");
    box.classList.toggle("hidden", !willShow);
    if (willShow) document.getElementById("customSubRoleInput").focus();
  });

  document.getElementById("addSubRoleCustomBtn").addEventListener("click", () => {
    const input = document.getElementById("customSubRoleInput");
    const val = input.value.trim();
    if (!val) return;
    state.profile.customSubRoles = state.profile.customSubRoles || [];
    if (!state.profile.customSubRoles.includes(val)) {
      state.profile.customSubRoles.push(val);
    }
    input.value = "";
    saveProfile();
    renderSubRoles();
    showToast(`兼業「${val}」を追加しました`);
  });

  document.getElementById("openAllSubRolesBtn").addEventListener("click", () => {
    openAllSubRolesModal();
  });

  document.getElementById("allSubRolesSearchInput").addEventListener("input", (e) => {
    renderAllSubRolesModal(e.target.value);
  });

  document.getElementById("userStageList").addEventListener("click", (e) => {
    const card = e.target.closest("[data-userstage]");
    if (!card) return;
    state.profile.userStage = card.dataset.userstage;
    saveProfile();
    renderUserStages();
    renderStep3ByStage();
    renderStep4AccountUI();
  });

  document.getElementById("step2NextBtn").addEventListener("click", () => {
    if (!state.profile.userStage) {
      document.getElementById("userStageList").classList.add("has-error");
      document.getElementById("step2StageErrorMsg").classList.remove("hidden");
      return;
    }
    renderStep3ByStage();
    goStep(3);
  });

  // Step 3 各種入力（タイプ別・規模チップ選択＋自由追加＋全タブ検索）
  document.getElementById("capacityQuickChips").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-captag]");
    if (!btn) return;
    state.profile.capacityTags = state.profile.capacityTags || [];
    toggleArrayItem(state.profile.capacityTags, btn.dataset.captag);
    saveProfile();
    renderStep3ByStage();
  });

  document.getElementById("toggleCustomCapacityBtn").addEventListener("click", () => {
    const box = document.getElementById("customCapacityBox");
    const willShow = box.classList.contains("hidden");
    box.classList.toggle("hidden", !willShow);
    if (willShow) document.getElementById("customCapacityInput").focus();
  });

  document.getElementById("addCapacityTagBtn").addEventListener("click", () => {
    const input = document.getElementById("customCapacityInput");
    const val = input.value.trim();
    if (!val) return;
    state.profile.capacityTags = state.profile.capacityTags || [];
    if (!state.profile.capacityTags.includes(val)) {
      state.profile.capacityTags.push(val);
    }
    input.value = "";
    saveProfile();
    renderStep3ByStage();
    showToast(`「${val}」を追加しました`);
  });

  document.getElementById("openAllCapacitiesBtn").addEventListener("click", () => {
    document.getElementById("allCapacitiesSearchInput").value = "";
    renderAllCapacitiesModal("");
    document.getElementById("allCapacitiesModal").classList.remove("hidden");
  });

  document.getElementById("allCapacitiesSearchInput").addEventListener("input", (e) => {
    renderAllCapacitiesModal(e.target.value);
  });

  bindInput("capacityInput", val => { state.profile.capacity = val; });
  bindInput("prideInput", val => { state.profile.pride = val; });
  bindInput("secretPrideInput", val => { state.profile.secretPride = val; });
  bindInput("ideaMemoInput", val => { state.profile.ideaMemo = val; });
  bindInput("ideaNoteInput", val => { state.profile.ideaNote = val; });
  bindInput("connectBioInput", val => { state.profile.connectBio = val; });
  bindInput("fanMessageInput", val => { state.profile.fanMessage = val; });

  document.getElementById("fanMonitorCheck").addEventListener("change", (e) => {
    state.profile.fanMonitorOk = e.target.checked;
    saveProfile();
  });

  document.getElementById("prideVisibilityToggle").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-vis]");
    if (!btn) return;
    state.profile.prideVisibility = btn.dataset.vis;
    saveProfile();
    syncFormFromProfile();
  });

  document.getElementById("seekingPartnerChips").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-seeking]");
    if (!btn) return;
    toggleArrayItem(state.profile.seekingPartners, btn.dataset.seeking);
    saveProfile();
    renderSeekingPartners();
  });

  document.getElementById("interestChips").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-interest]");
    if (!btn) return;
    toggleArrayItem(state.profile.interests, btn.dataset.interest);
    saveProfile();
    renderInterests();
  });

  document.getElementById("fanGenreChips").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-fangenre]");
    if (!btn) return;
    toggleArrayItem(state.profile.fanGenres, btn.dataset.fangenre);
    saveProfile();
    renderFanGenres();
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
    showToast("ビジュアルカードを追加しました");
  });

  document.getElementById("addedProductList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-delprod]");
    if (!btn) return;
    const id = Number(btn.dataset.delprod);
    state.profile.products = state.profile.products.filter(x => x.id !== id);
    saveProfile();
    renderAddedProducts();
  });

  // Step 4 基本情報・1人/複数人チーム
  document.getElementById("accountTypeGroup").addEventListener("click", (e) => {
    const tile = e.target.closest("[data-acctype]");
    if (!tile) return;
    state.profile.accountType = tile.dataset.acctype;
    saveProfile();
    renderStep4AccountUI();
  });

  document.getElementById("photoInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await resizeImageToDataUrl(file, 420, 0.8);
    if (!dataUrl) return;
    state.profile.photoDataUrl = dataUrl;
    state.profile.photoPendingReview = true;
    saveProfile();
    syncFormFromProfile();
    showToast("トップ写真を選択しました（運営審査中ステータス）");
  });

  document.getElementById("favoritePhotosInput").addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    state.profile.favoritePhotos = state.profile.favoritePhotos || [];
    const remain = 5 - state.profile.favoritePhotos.length;
    if (remain <= 0) {
      showToast("好きなこと写真は最大5枚までです");
      e.target.value = "";
      return;
    }
    const targetFiles = files.slice(0, remain);
    for (const file of targetFiles) {
      const dataUrl = await resizeImageToDataUrl(file, 480, 0.76);
      if (dataUrl) state.profile.favoritePhotos.push(dataUrl);
    }
    e.target.value = "";
    saveProfile();
    renderFavoritePhotosEditor();
    showToast(`好きなこと写真を${targetFiles.length}枚追加しました（${state.profile.favoritePhotos.length}/5枚）`);
  });

  bindInput("profileBioInput", val => { state.profile.profileBio = val; });

  document.getElementById("displayNameInput").addEventListener("input", (e) => {
    state.profile.displayName = e.target.value;
    if (e.target.value.trim()) {
      e.target.classList.remove("input-error");
      document.getElementById("displayNameErrorMsg").classList.add("hidden");
    }
    saveProfile();
  });

  bindInput("exactAgeInput", val => { state.profile.exactAge = val; });
  bindInput("areaInput", val => { state.profile.area = val; });
  bindInput("referralInput", val => { state.profile.referralCode = val; });
  bindInput("companyNameInput", val => {
    state.profile.companyName = val;
    setVal("teamCompanyInput", val);
  });
  bindInput("phoneInput", val => {
    state.profile.phone = val;
    setVal("teamPhoneInput", val);
  });

  document.getElementById("teamCompanyInput").addEventListener("input", (e) => {
    state.profile.companyName = e.target.value;
    setVal("companyNameInput", e.target.value);
    state.profile.teamCode = generateTeamCode(e.target.value);
    saveProfile();
    updateTeamCodeDisplay();
  });

  document.getElementById("teamPhoneInput").addEventListener("input", (e) => {
    state.profile.phone = e.target.value;
    setVal("phoneInput", e.target.value);
    saveProfile();
  });

  document.getElementById("copyTeamCodeBtn").addEventListener("click", () => {
    if (!state.profile.teamCode) return;
    navigator.clipboard?.writeText(state.profile.teamCode).catch(() => {});
    showToast(`チームコード ${state.profile.teamCode} をコピーしました`);
  });

  document.getElementById("demoCodeBtn").addEventListener("click", () => {
    document.getElementById("importCodeInput").value = "EN-TK88";
    applyTeamImportCode("EN-TK88");
  });
  document.getElementById("applyCodeBtn").addEventListener("click", () => {
    applyTeamImportCode(document.getElementById("importCodeInput").value.trim().toUpperCase());
  });

  document.getElementById("addTeamMemberBtn").addEventListener("click", () => {
    if (state.profile.teamMembers.length >= 5) {
      showToast("担当者は最大5名まで登録できます");
      return;
    }
    state.profile.teamMembers.push({
      id: "tm-" + Date.now(),
      name: "",
      role: "",
      phone: "",
      isPrimary: false
    });
    saveProfile();
    renderTeamMembersEditor();
  });

  document.getElementById("ageGroupChips").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-age]");
    if (!btn) return;
    state.profile.ageGroup = btn.dataset.age;
    saveProfile();
    renderAgeGroups();
  });

  document.getElementById("areaGranularityGroup").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-granularity]");
    if (!btn) return;
    state.profile.areaGranularity = btn.dataset.granularity;
    saveProfile();
    syncFormFromProfile();
  });

  document.getElementById("geoBtn").addEventListener("click", handleGeolocation);

  // 登録完了 → 完成マイ名刺お披露目演出！
  document.getElementById("completeRegBtn").addEventListener("click", finishRegistrationAndReveal);

  // 完成名刺お披露目モーダル操作
  ["homeCardModeSwitch", "revealCardModeSwitch"].forEach(id => {
    document.getElementById(id).addEventListener("click", (e) => {
      const btn = e.target.closest("[data-mode]");
      if (!btn) return;
      state.cardMode = btn.dataset.mode;
      syncCardModeButtons();
      renderBusinessCards();
    });
  });

  document.getElementById("revealGoEnBtn").addEventListener("click", () => {
    document.getElementById("cardRevealModal").classList.add("hidden");
    switchView("en");
  });
  document.getElementById("revealGoHomeBtn").addEventListener("click", () => {
    document.getElementById("cardRevealModal").classList.add("hidden");
    switchView("home");
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
      if (e.target === backdrop && backdrop.id !== "cardRevealModal") {
        backdrop.classList.add("hidden");
      }
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
  });
}

/* ==================== ステップ・画面切替 ==================== */
function goStep(stepNum) {
  state.step = stepNum;
  document.querySelectorAll(".step-panel").forEach(p => {
    p.classList.toggle("active", Number(p.dataset.panel) === stepNum);
  });
  document.getElementById("regProgressLabel").textContent = `ステップ ${stepNum} / 4`;
  document.getElementById("regProgressFill").style.width = `${stepNum * 25}%`;

  if (stepNum === 2) renderStep2Content();
  if (stepNum === 3) renderStep3ByStage();
  if (stepNum === 4) renderStep4AccountUI();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function switchView(viewName) {
  state.activeView = viewName;
  // 登録画面のときだけ集中モード（スマホ時バナー非表示・全幅ボトムナビ非表示）
  document.body.classList.toggle("register-focus", viewName === "register");

  document.querySelectorAll(".view-section").forEach(sec => {
    sec.classList.toggle("active", sec.id === `view-${viewName}`);
  });
  const navHighlight = viewName === "en-room" ? "en" : viewName;
  document.querySelectorAll("#bottomNav .nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.tab === navHighlight);
  });
  renderAll();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function finishRegistrationAndReveal() {
  const nameInput = document.getElementById("displayNameInput");
  if (!state.profile.displayName.trim()) {
    nameInput.classList.add("input-error");
    document.getElementById("displayNameErrorMsg").classList.remove("hidden");
    nameInput.scrollIntoView({ behavior: "smooth", block: "center" });
    nameInput.focus();
    return;
  }

  state.profile.registered = true;
  saveProfile();

  // 完成名刺カードお披露目モーダルをリセット＆アニメーション再発火
  state.cardMode = "pre";
  syncCardModeButtons();
  renderBusinessCards();

  const animCard = document.getElementById("revealBusinessCard");
  animCard.classList.remove("reveal-card-anim");
  void animCard.offsetWidth;
  animCard.classList.add("reveal-card-anim");

  document.getElementById("cardRevealModal").classList.remove("hidden");
}

/* ==================== 登録補助機能 ==================== */
function applyTeamImportCode(code) {
  const msg = document.getElementById("codeApplyMsg");
  const hit = ENJOY_DATA.sampleStaffCodes[code];
  if (!hit) {
    msg.textContent = "コードが見つかりませんでした（テスト用は EN-TK88 をお試しください）";
    return;
  }
  Object.assign(state.profile, cloneObj(hit), { teamCode: code, accountType: "team" });
  saveProfile();
  syncFormFromProfile();
  renderAgeGroups();
  renderStep4AccountUI();
  msg.textContent = `✅ チームコード「${code}」から会社情報・担当者リストを自動反映しました！`;
  showToast("チームコードで入力を省略しました");
}

function generateTeamCode(companyName) {
  const clean = (companyName || "").trim();
  if (!clean) return "";
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) % 900;
  }
  return `EN-TM${100 + hash}`;
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

/* ==================== 全体レンダリング ＆ デジタル名刺 ==================== */
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
  const homeCard = document.getElementById("homeBusinessCard");
  const revealCard = document.getElementById("revealBusinessCard");
  if (homeCard) homeCard.innerHTML = html;
  if (revealCard) revealCard.innerHTML = html;
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

  const stageObj = ENJOY_DATA.userStages.find(s => s.id === p.userStage);
  const subBadges = [
    ...(p.subRoles || []).map(rid => {
      const r = ENJOY_DATA.roles.find(x => x.id === rid);
      return r ? `<span class="bc-role-sub">${r.icon} ${r.title}もOK</span>` : "";
    }),
    ...(p.customSubRoles || []).map(label => `<span class="bc-role-sub">✨ ${escapeHtml(label)}</span>`)
  ].join("");

  const ageText = p.exactAge ? `${p.ageGroup}（${p.exactAge}歳）` : (p.ageGroup || "");
  const areaText = formatAreaForMode(p.area, p.areaGranularity, mode);
  const avatarHtml = p.photoDataUrl ? `<img src="${p.photoDataUrl}" alt="プロフィール写真" />` : mainRoleObj.icon;
  const reviewBadge = p.photoPendingReview ? `<span class="bc-review-pill">🕒 写真審査中</span>` : "";
  const activityTags = (p.activities || []).slice(0, 6).map(a => `<span class="bc-tag">#${escapeHtml(a)}</span>`).join("");

  // タイプ別メイン本文
  let stageSpecificHtml = "";
  if (p.userStage === "idea") {
    const seekers = (p.seekingPartners || []).map(s => `<span class="bc-tag">${escapeHtml(s)}</span>`).join("");
    stageSpecificHtml = `
      ${(p.ideaMemo || seekers || p.ideaNote) ? `
        <div class="bc-section">
          ${p.ideaMemo ? `<div><span class="bc-sec-title">💡 作りたいアイデア</span><br/>${escapeHtml(p.ideaMemo)}</div>` : ""}
          ${seekers ? `<div style="margin-top:8px;"><span class="bc-sec-title">🤝 探している仲間</span><div class="bc-tags">${seekers}</div></div>` : ""}
          ${p.ideaNote ? `<div style="margin-top:8px;"><span class="bc-sec-title">💬 相談したいこと</span><br/>${escapeHtml(p.ideaNote)}</div>` : ""}
        </div>
      ` : ""}
    `;
  } else if (p.userStage === "connect") {
    const ints = (p.interests || []).map(i => `<span class="bc-tag">#${escapeHtml(i)}</span>`).join("");
    stageSpecificHtml = `
      ${(ints || p.connectBio) ? `
        <div class="bc-section">
          ${ints ? `<div><span class="bc-sec-title">✨ 興味テーマ</span><div class="bc-tags">${ints}</div></div>` : ""}
          ${p.connectBio ? `<div style="margin-top:8px;"><span class="bc-sec-title">💬 ひとこと</span><br/>${escapeHtml(p.connectBio)}</div>` : ""}
        </div>
      ` : ""}
    `;
  } else if (p.userStage === "fan") {
    const genres = (p.fanGenres || []).map(g => `<span class="bc-tag">🍽️ ${escapeHtml(g)}</span>`).join("");
    stageSpecificHtml = `
      <div class="bc-section">
        ${genres ? `<div><span class="bc-sec-title">好きなジャンル</span><div class="bc-tags">${genres}</div></div>` : ""}
        ${p.fanMonitorOk ? `<div style="margin-top:6px;font-size:0.78rem;color:var(--green);font-weight:700;">🎁 試食モニター・先行予約に興味あり</div>` : ""}
        ${p.fanMessage ? `<div style="margin-top:6px;">${escapeHtml(p.fanMessage)}</div>` : ""}
      </div>
    `;
  } else {
    const prideVisible = p.pride && (p.prideVisibility === "public" || isPost);
    const prideLockedNote = p.pride && p.prideVisibility === "match" && !isPost
      ? `<p class="mini-note">🔒 自慢ポイントはマッチ後に公開されます</p>` : "";
    const productsHtml = (p.products && p.products.length)
      ? `<div class="bc-section">
           <div class="bc-sec-title">${p.userStage === "skill" ? "🎨 実績・公式HP" : "📦 自社商品・公式HP"}</div>
           <div class="bc-prod-grid">
             ${p.products.map(pr => `
               <a class="bc-prod-card" href="${pr.url ? escapeHtml(pr.url) : "javascript:void(0)"}" ${pr.url ? 'target="_blank" rel="noopener"' : ""}>
                 <div class="bc-prod-icon">${pr.icon}</div>
                 <div class="bc-prod-title">${escapeHtml(pr.title)}</div>
                 <div class="bc-prod-note">${escapeHtml(pr.note)}</div>
               </a>
             `).join("")}
           </div>
         </div>` : "";
    const capTagsHtml = (p.capacityTags && p.capacityTags.length)
      ? `<div class="bc-tags" style="margin-top:4px;">${p.capacityTags.map(t => `<span class="bc-tag">${escapeHtml(t)}</span>`).join("")}</div>`
      : "";
    const hasCapAny = (p.capacityTags && p.capacityTags.length) || p.capacity;
    stageSpecificHtml = `
      ${(hasCapAny || prideVisible || prideLockedNote) ? `
        <div class="bc-section">
          ${hasCapAny ? `<div><span class="bc-sec-title">${p.userStage === "skill" ? "🛠️ 対応規模・得意なこと" : "🏭 設備・作れる量"}</span>${capTagsHtml}${p.capacity ? `<div style="margin-top:4px;">${escapeHtml(p.capacity)}</div>` : ""}</div>` : ""}
          ${prideVisible ? `<div style="margin-top:8px;"><span class="bc-sec-title">✨ 自慢ポイント</span><br/>${escapeHtml(p.pride)}</div>` : ""}
          ${prideLockedNote}
        </div>
      ` : ""}
      ${productsHtml}
    `;
  }

  // マッチ後開示枠（一般ファンは事業者連絡先を出さずシンプルに）
  let secretHtml = "";
  if (p.userStage === "fan") {
    secretHtml = `
      <div class="bc-secret-box locked">
        <strong>🛒 応援・買い手アカウント</strong>
        <p class="mini-note" style="margin-top:4px;">電話番号や社名の登録なしで安心してお使いいただけます。</p>
      </div>
    `;
  } else if (isPost) {
    const isTeam = p.accountType === "team";
    const tMembers = (p.teamMembers || []).filter(m => m.name && m.name.trim());
    const primary = tMembers.find(m => m.isPrimary) || tMembers[0];
    const mainTel = (isTeam && primary && primary.phone) ? primary.phone : p.phone;

    secretHtml = `
      <div class="bc-secret-box unlocked">
        <strong>🤝 マッチ成立により自動公開中</strong>
        <ul class="bc-secret-list">
          <li>正式社名・屋号：<strong>${escapeHtml(p.companyName || "（未記入）")}</strong></li>
          ${isTeam && primary ? `<li>⭐ 最初の窓口：<strong>${escapeHtml(primary.name)}</strong>${primary.role ? `（${escapeHtml(primary.role)}）` : ""}</li>` : ""}
          <li>電話番号：${mainTel ? `<a class="tel-link" href="tel:${escapeHtml(mainTel)}">${escapeHtml(mainTel)}</a>` : "（未記入）"}</li>
          ${isTeam && tMembers.length > 1 ? `<li>チーム体制：全${tMembers.length}名（${tMembers.map(m => escapeHtml(m.name)).join("・")}）</li>` : ""}
          ${p.secretPride ? `<li>秘密の条件・強み：${escapeHtml(p.secretPride)}</li>` : ""}
        </ul>
        <p class="mini-note">💬 LINE等の交換は安全のためトーク欄で行えます</p>
      </div>
    `;
  } else {
    const isTeam = p.accountType === "team";
    const tCount = (p.teamMembers || []).filter(m => m.name && m.name.trim()).length;
    secretHtml = `
      <div class="bc-secret-box locked">
        <strong>🔒 マッチ後に自動公開される情報</strong>
        <ul class="bc-secret-list">
          <li>正式な会社名・屋号（ロック中）</li>
          <li>${isTeam ? `⭐ 最初の窓口担当者（チーム${Math.max(1, tCount)}名体制・ロック中）` : "電話番号・ワンタップ発信（ロック中）"}</li>
          ${p.secretPride ? "<li>マッチ限定の強み・条件 1件（ロック中）</li>" : "<li>秘密の条件・強み（マッチで開示）</li>"}
        </ul>
      </div>
    `;
  }

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
            ${p.accountType === "team" ? `<span class="bc-pos-badge">🏢 チーム</span>` : ""}
          </div>
          <div class="bc-area">📍 ${escapeHtml(areaText)}</div>
          ${stageObj ? `<span class="bc-review-pill">${stageObj.icon} ${stageObj.title}</span>` : ""}
          ${reviewBadge}
        </div>
      </div>

      <div class="bc-roles">
        <span class="bc-role-main">メイン：${escapeHtml(mainRoleLabel)}</span>
        ${subBadges}
      </div>

      ${activityTags ? `<div class="bc-tags">${activityTags}</div>` : ""}
      ${p.profileBio ? `<div class="bc-bio">${escapeHtml(p.profileBio)}</div>` : ""}
      ${(p.favoritePhotos && p.favoritePhotos.length) ? `
        <div class="bc-section">
          <div class="bc-sec-title">📸 好きなこと・雰囲気（${p.favoritePhotos.length}枚・タップで拡大）</div>
          <div class="bc-fav-gallery">
            ${p.favoritePhotos.map((src, i) => `<img src="${src}" alt="好きなこと写真${i + 1}" onclick="openPhotoLightbox('${src}')" />`).join("")}
          </div>
        </div>
      ` : ""}
      ${stageSpecificHtml}
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

/* ==================== 写真・動画読み込みヘルパー ==================== */
function readMediaFile(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    if (file.type.startsWith("video/")) {
      resolve({ type: "video", url: URL.createObjectURL(file), name: file.name, ephemeral: true });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve({ type: "image", url: reader.result, name: file.name });
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
    author: getActiveSenderName(),
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
  const serializable = state.feeds.map(f => (f.media && f.media.ephemeral ? Object.assign({}, f, { media: null }) : f));
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
  const openSet = new Set(Array.from(document.querySelectorAll("#projOpenPieces input:checked")).map(c => c.value));
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
    members: [{ roleLabel: `${roleObj.icon} ${roleObj.title}（発起人）`, card: cloneObj(state.profile) }],
    applicants: [],
    messages: [{
      id: "m-" + Date.now(),
      who: "sys",
      sender: "システム",
      text: "🎉 新しいEN開発ルームが誕生しました！まずは2社からでもスタートOK。大事な決定は「📌 固定」で残せます。",
      pinned: false,
      time: getNowTimeStr()
    }]
  };

  state.projects.unshift(newProj);
  EnjoyStore.save(STORAGE_KEYS.PROJECTS, state.projects.map(stripEphemeralMedia));
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
    author: getActiveSenderName()
  });
  EnjoyStore.save(STORAGE_KEYS.OFFERS, state.offers.map(o => (o.media && o.media.ephemeral ? Object.assign({}, o, { media: null }) : o)));
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
          userStage: "maker",
          accountType: "solo",
          subRoles: [],
          activities: ["素材提供・相談"],
          displayName: sourceAuthor,
          ageGroup: "40代",
          area: area || "大阪府 高槻市",
          areaGranularity: "broad",
          companyName: `${sourceAuthor}（連携テスト）`,
          phone: "090-0000-0000"
        }
      },
      { roleLabel: `${myRoleObj.icon} ${myRoleObj.title}`, card: cloneObj(state.profile) }
    ],
    applicants: [],
    messages: [{
      id: "m-" + Date.now(),
      who: "sys",
      sender: "システム",
      text: `🎉 「${sourceAuthor}」さんの投稿から2社スタートで開発室を立ち上げました！必要になったタイミングで上の「＋ 必要なENを追加募集」からデザイナーや販路を呼べます。`,
      pinned: true,
      time: getNowTimeStr()
    }]
  };

  state.projects.unshift(newProj);
  EnjoyStore.save(STORAGE_KEYS.PROJECTS, state.projects.map(stripEphemeralMedia));
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

  document.querySelectorAll("#roomViewModeSwitch button").forEach(b => b.classList.toggle("active", b.dataset.roomview === "inside"));
  document.querySelectorAll("#roomInnerTabs button").forEach(b => b.classList.toggle("active", b.dataset.roomtab === "talk"));

  switchView("en-room");
}

function getActiveSenderName() {
  const base = state.profile.displayName || "あなた";
  if (state.profile.accountType === "team") {
    const valid = (state.profile.teamMembers || []).filter(m => m.name && m.name.trim());
    const active = valid.find(m => m.id === state.profile.activeSpeakerId) || valid.find(m => m.isPrimary) || valid[0];
    if (active) return `${base}（${active.name}）`;
  }
  return base;
}

function renderTeamSpeakerBar() {
  const bar = document.getElementById("teamSpeakerBar");
  const chips = document.getElementById("teamSpeakerChips");
  const valid = state.profile.accountType === "team"
    ? (state.profile.teamMembers || []).filter(m => m.name && m.name.trim())
    : [];

  if (valid.length <= 1) {
    bar.classList.add("hidden");
    return;
  }

  bar.classList.remove("hidden");
  if (!valid.some(m => m.id === state.profile.activeSpeakerId)) {
    state.profile.activeSpeakerId = valid[0].id;
  }

  chips.innerHTML = valid.map(m => `
    <button type="button"
      class="select-chip chip-quick ${m.id === state.profile.activeSpeakerId ? "selected" : ""}"
      data-speaker-id="${m.id}">
      👤 ${escapeHtml(m.name)}
    </button>
  `).join("");

  chips.querySelectorAll("[data-speaker-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.profile.activeSpeakerId = btn.dataset.speakerId;
      saveProfile();
      renderTeamSpeakerBar();
    });
  });
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

  const actionSlot = document.getElementById("roomActionSlot");
  if (isInside) {
    const nextStageBtnText = proj.stage === 1
      ? "✨ 作るものが決まった！ → Step 2へ"
      : proj.stage === 2
        ? "🍳 試作フェーズへ → Step 3へ"
        : proj.stage === 3
          ? "🎉 商品完成・お披露目！"
          : "✅ 完成お披露目済み";
    actionSlot.innerHTML = `<button id="advanceStageBtn" type="button" class="btn btn-primary btn-sm" ${proj.stage >= 4 ? "disabled" : ""}>${nextStageBtnText}</button>`;
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
    actionSlot.innerHTML = `<button id="outsideInterestBtn" type="button" class="btn btn-accent btn-sm">👋 興味ありを送る</button>`;
    document.getElementById("outsideInterestBtn").addEventListener("click", () => openInterestModal(proj.id, ""));
  }

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
        state.roomInnerTab = "members";
        document.querySelectorAll("#roomInnerTabs button").forEach(b => b.classList.toggle("active", b.dataset.roomtab === "members"));
        renderActiveEnRoom();
      }
    });
  });

  document.getElementById("openAddEnModalBtn").classList.toggle("hidden", !isInside);

  const isTalk = state.roomInnerTab === "talk";
  document.getElementById("roomTabTalk").classList.toggle("hidden", !isTalk);
  document.getElementById("roomTabMembers").classList.toggle("hidden", isTalk);

  const membersTabBtn = document.querySelector('#roomInnerTabs [data-roomtab="members"]');
  const appLen = (proj.applicants || []).length;
  membersTabBtn.textContent = appLen > 0 ? `👥 メンバー ＆ 応募承認（${appLen}）` : "👥 メンバー ＆ 応募承認";

  if (isTalk) {
    renderTeamSpeakerBar();
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
    sender: getActiveSenderName(),
    text: text || "（写真・動画を共有しました）",
    media: state.pendingRoomMedia,
    pinned: false,
    time: getNowTimeStr()
  });

  input.value = "";
  state.pendingRoomMedia = null;
  document.getElementById("roomMediaInput").value = "";
  document.getElementById("roomPendingMediaName").textContent = "";

  saveProjectState(proj);
  renderActiveEnRoom();
}

function stripEphemeralMedia(proj) {
  const cp = cloneObj(proj);
  if (cp.media && cp.media.ephemeral) cp.media = null;
  if (Array.isArray(cp.messages)) {
    cp.messages.forEach(m => { if (m.media && m.media.ephemeral) m.media = null; });
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

  const iconMatch = labelRaw.match(/^(\p{Extended_Pictographic})\s*(.+)$/u);
  const icon = iconMatch ? iconMatch[1] : "🧩";
  const label = iconMatch ? iconMatch[2] : labelRaw;

  proj.pieces = normalizePieces(proj.pieces);
  proj.pieces.push({ id: "custom-en-" + Date.now(), icon, label, status: "open", memberName: "" });

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
  const choices = openPieces.length ? openPieces : [{ id: "support", icon: "🤝", label: "サポート・別枠で参加" }];

  state.interestSelectedRoleId = preselectRoleId && choices.some(c => c.id === preselectRoleId)
    ? preselectRoleId : choices[0].id;

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
    if (document.body.classList.contains("register-focus")) return;
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
