/* ==========================================
   EN•joy アプリケーションロジック（v4.5 最適UI完全版）
   ========================================== */

let currentTab = 'home';
let currentTag = '🆘 ちょっと助けて';
let quickTag = '🆘 ちょっと助けて';
let selectedProjectId = null;
let currentInsightKey = 'fruit';
let currentMarcheSub = 'marche';
let currentTweetSub = 'feed'; // 'feed' | 'directory'
let currentStudioTab = 'todo'; // 'todo' | 'calc' | 'agree' | 'diary'
let pendingPhotos = { tweet: '', diary: '', qt: '' };

// つぶやき検索ステート
let tweetRegionKey = 'ALL';
let tweetPrefFilter = 'ALL';
let tweetFilterTag = 'ALL';
let tweetSearchQuery = '';
let hideSolvedTweets = false;

// 相性順・仲間さがし図鑑フィルタステート
let dirRegionKey = 'ALL';
let dirPrefFilter = 'ALL';
let dirRoleFilter = 'ALL';
let dirSearchQuery = '';

let chatSenderRole = 'me';
let activePopData = null;
let activeStoryCardData = null;
let quizState = { active: false, step: 0, scoreA: 0 };

window.onload = function() {
  initPrefectureSelects();
  const savedMode = localStorage.getItem(KEYS.MODE) || 'normal';
  setUiMode(savedMode);
  loadProfileForm();
  renderEverything();
  window.addEventListener('scroll', updateMobileFabVisibility, { passive: true });
  updateMobileFabVisibility();
};

function renderEverything() {
  renderAllProfileViews();
  renderFieldInsights();
  renderTweets();
  renderMemberDirectory();
  renderEnSection();
  renderMarcheSection();
  renderEarnedBadges();
  renderHomeIndex();
  renderTweetAsideExtras();
}

/* ==========================================
   都道府県プルダウン初期化 ＆ 地域判定ヘルパー
   ========================================== */
function initPrefectureSelects() {
  const inputOptions = `<option value="">都道府県を選択（任意）</option>` +
    PREFECTURES.map(p => `<option value="${p}">${p}</option>`).join('');
  document.querySelectorAll('.pref-select-sync').forEach(sel => {
    sel.innerHTML = inputOptions;
  });
  refreshPrefFilterOptions('tweet-pref-filter', 'ALL', 'ALL');
  refreshPrefFilterOptions('dir-pref-filter', 'ALL', 'ALL');
}

function refreshPrefFilterOptions(selectId, regionKey, selectedPref) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const block = REGION_BLOCKS.find(r => r.key === regionKey);
  const prefs = (block && block.prefs.length > 0) ? block.prefs : PREFECTURES;
  sel.innerHTML = `<option value="ALL">${regionKey === 'ALL' ? 'すべての都道府県' : `${block.label}の全県`}</option>` +
    prefs.map(p => `<option value="${p}">${p}</option>`).join('');
  sel.value = prefs.includes(selectedPref) ? selectedPref : 'ALL';
}

function matchesRegionAndPref(itemPref, regionKey, prefFilter) {
  if (prefFilter && prefFilter !== 'ALL') {
    return itemPref === prefFilter;
  }
  if (regionKey && regionKey !== 'ALL') {
    const block = REGION_BLOCKS.find(r => r.key === regionKey);
    if (block && block.prefs.length > 0) {
      return block.prefs.includes(itemPref);
    }
  }
  return true;
}

/* ==========================================
   ユーティリティ（保存・通知・圧縮・マスキング・相性計算）
   ========================================== */
function loadData(key, fallback) {
  const raw = localStorage.getItem(key);
  if (raw) { try { return JSON.parse(raw); } catch (e) {} }
  return JSON.parse(JSON.stringify(fallback));
}

function saveData(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); }
  catch (e) { showToast('⚠️ 保存容量の上限に近づきました。写真を減らすか初期化してください'); }
}

function showToast(msg) {
  const el = document.getElementById('global-toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => el.classList.remove('show'), 2900);
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function nowTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function calcCompatibility(myType, partnerType) {
  const a = myType || 'spark';
  const b = partnerType || 'artisan';
  if ((a === 'spark' && b === 'guardian') || (a === 'guardian' && b === 'spark')) return 96;
  if ((a === 'bridge' && b === 'artisan') || (a === 'artisan' && b === 'bridge')) return 95;
  if ((a === 'spark' && b === 'artisan') || (a === 'artisan' && b === 'spark')) return 91;
  if ((a === 'bridge' && b === 'guardian') || (a === 'guardian' && b === 'bridge')) return 91;
  if (a !== b) return 88;
  return 84;
}

function ensureProjectCalc(proj) {
  if (!proj.calc) {
    proj.calc = Object.assign({}, DEFAULT_CALC);
  }
  return proj.calc;
}

function computeProfitMetrics(c) {
  const mat = Math.max(0, Number(c.materialCost) || 0);
  const proc = Math.max(0, Number(c.processCost) || 0);
  const pack = Math.max(0, Number(c.packCost) || 0);
  const fixed = Math.max(0, Number(c.fixedCost) || 0);
  const qty = Math.max(1, Number(c.batchQty) || 1);
  const sell = Math.max(0, Number(c.sellPrice) || 0);
  const ratioA = Math.min(100, Math.max(0, Number(c.shareRatioA) || 50));
  const ratioB = 100 - ratioA;

  const varCostPerUnit = mat + proc + pack;
  const fixedPerUnit = Math.ceil(fixed / qty);
  const totalUnitCost = varCostPerUnit + fixedPerUnit;
  const unitGrossMargin = sell - varCostPerUnit;
  const unitNetProfit = sell - totalUnitCost;
  const totalRevenue = sell * qty;
  const totalCost = varCostPerUnit * qty + fixed;
  const totalProfit = totalRevenue - totalCost;
  const profitRate = sell > 0 ? Math.round((unitNetProfit / sell) * 100) : 0;
  const shareA = Math.round(totalProfit * (ratioA / 100));
  const shareB = totalProfit - shareA;
  const breakEvenQty = unitGrossMargin > 0 ? Math.ceil(fixed / unitGrossMargin) : null;

  return {
    varCostPerUnit,
    fixedPerUnit,
    totalUnitCost,
    unitGrossMargin,
    unitNetProfit,
    totalRevenue,
    totalCost,
    totalProfit,
    profitRate,
    ratioA,
    ratioB,
    shareA,
    shareB,
    breakEvenQty,
    qty,
    sell
  };
}

function copyTextSafely(text, successMsg) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast(successMsg)).catch(() => fallbackCopy(text, successMsg));
  } else { fallbackCopy(text, successMsg); }
}

function fallbackCopy(text, successMsg) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); showToast(successMsg); } catch (e) { alert(text); }
  document.body.removeChild(ta);
}

function handlePhotoSelect(event, targetKey) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const maxW = 640;
      let w = img.width, h = img.height;
      if (w > maxW) { h = Math.round((h * maxW) / w); w = maxW; }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.74);
      pendingPhotos[targetKey] = dataUrl;
      const prev = document.getElementById(targetKey + '-photo-preview');
      const clr = document.getElementById(targetKey + '-photo-clear');
      if (prev) { prev.src = dataUrl; prev.style.display = 'inline-block'; }
      if (clr) { clr.style.display = 'inline-flex'; }
      showToast('📷 写真を自動圧縮してセットしました！');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function clearPendingPhoto(targetKey) {
  pendingPhotos[targetKey] = '';
  const prev = document.getElementById(targetKey + '-photo-preview');
  const clr = document.getElementById(targetKey + '-photo-clear');
  const inp = document.getElementById(targetKey + '-photo-file');
  if (prev) { prev.src = ''; prev.style.display = 'none'; }
  if (clr) { clr.style.display = 'none'; }
  if (inp) { inp.value = ''; }
}

function applySafetyMask(rawText) {
  let masked = rawText;
  masked = masked.replace(/\d{2,4}-\d{2,4}-\d{3,4}/g, '[連絡先非公開]');
  masked = masked.replace(/(原価|仕入れ|仕入|卸値|単価|コスト)\s*[:：]?\s*[¥￥]?\s*[\d,]+円?/g, '$1[非公開]');
  masked = masked.replace(/[¥￥]\s*[\d,]+/g, '[金額非公開]');
  masked = masked.replace(/[\d,]+\s*円/g, '[金額非公開]');
  masked = masked.replace(/(粗利|利益率|マージン)\s*[:：]?\s*\d+%?/g, '$1[非公開]');
  return masked;
}

function generateAgreementHash(str) {
  let h1 = 0xdeadbeef ^ str.length, h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `ENJOY-${(h1 >>> 0).toString(16).padStart(8, '0').toUpperCase()}-${(h2 >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}

function awardBadge(badgeLabel) {
  const badges = loadData(KEYS.BADGES, DEFAULT_BADGES);
  if (!badges.includes(badgeLabel)) {
    badges.push(badgeLabel);
    saveData(KEYS.BADGES, badges);
    renderEarnedBadges();
  }
}

/* ==========================================
   バックアップ書き出し＆復元
   ========================================== */
function exportBackupJson() {
  const dump = {};
  Object.values(KEYS).forEach(k => {
    const val = localStorage.getItem(k);
    if (val !== null) dump[k] = val;
  });
  const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date();
  a.href = url;
  a.download = `EN-joy-backup-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('💾 EN•joy の全ローカルデータをバックアップ保存しました！');
}

function importBackupJson(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      const validKeys = new Set(Object.values(KEYS));
      let restored = 0;
      Object.keys(parsed).forEach(k => {
        if (validKeys.has(k)) { localStorage.setItem(k, parsed[k]); restored++; }
      });
      if (restored === 0) { showToast('⚠️ EN•joyのバックアップファイルではありません'); return; }
      loadProfileForm();
      setUiMode(localStorage.getItem(KEYS.MODE) || 'normal');
      renderEverything();
      showToast(`📂 バックアップから ${restored} 項目を復元しました！`);
    } catch (err) { showToast('⚠️ JSONファイルの読み込みに失敗しました'); }
  };
  reader.readAsText(file);
  event.target.value = '';
}

/* ==========================================
   UI切替・ナビ同期・スマホ途中ポップアップ制御
   ========================================== */
function setUiMode(mode) {
  localStorage.setItem(KEYS.MODE, mode);
  const isLarge = (mode === 'large');
  document.body.classList.toggle('large-mode', isLarge);
  document.querySelectorAll('.mode-btn-normal').forEach(b => b.classList.toggle('active', !isLarge));
  document.querySelectorAll('.mode-btn-large').forEach(b => b.classList.toggle('active', isLarge));
}

function switchTab(tabName) {
  currentTab = tabName;
  document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
  const targetView = document.getElementById('view-' + tabName);
  if (targetView) targetView.classList.add('active');
  ['home', 'tweet', 'en', 'marche', 'roadmap'].forEach(k => {
    document.querySelectorAll('.nav-sync-' + k).forEach(el => el.classList.toggle('active', k === tabName));
  });
  if (PAGE_META[tabName]) {
    const titleEl = document.getElementById('pc-header-title');
    const subEl = document.getElementById('pc-header-sub');
    if (titleEl) titleEl.textContent = PAGE_META[tabName].title;
    if (subEl) subEl.textContent = PAGE_META[tabName].sub;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  updateMobileFabVisibility();
}

function switchTweetSubtab(sub) {
  currentTweetSub = sub;
  const feedEl = document.getElementById('tweet-sub-feed');
  const dirEl = document.getElementById('tweet-sub-directory');
  const btnFeed = document.getElementById('sub-btn-tweet-feed');
  const btnDir = document.getElementById('sub-btn-tweet-dir');
  // PCのCSS Gridを壊さないよう、表示時はインラインstyleを空文字に戻す
  if (feedEl) feedEl.style.display = (sub === 'feed') ? '' : 'none';
  if (dirEl) dirEl.style.display = (sub === 'directory') ? 'flex' : 'none';
  if (btnFeed) btnFeed.classList.toggle('active', sub === 'feed');
  if (btnDir) btnDir.classList.toggle('active', sub === 'directory');
  if (sub === 'directory') renderMemberDirectory();
  updateMobileFabVisibility();
}

function switchMarcheSubtab(sub) {
  currentMarcheSub = sub;
  ['marche', 'shop', 'tools'].forEach(k => {
    const el = document.getElementById('marche-sub-' + k);
    const btn = document.getElementById('sub-btn-' + k);
    if (el) el.style.display = (k === sub) ? 'flex' : 'none';
    if (btn) btn.classList.toggle('active', k === sub);
  });
}

function updateMobileFabVisibility() {
  const fab = document.getElementById('mobile-tweet-fab');
  if (!fab) return;
  const shouldShow = (currentTab === 'tweet' && currentTweetSub === 'feed' && window.scrollY > 180);
  fab.classList.toggle('show', shouldShow);
}

/* ==========================================
   ホーム：全インデックス目次バー ＆ ジャンプ機能
   ========================================== */
function scrollToHomeSection(secId) {
  const el = document.getElementById(secId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderHomeIndex() {
  const bar = document.getElementById('home-index-bar');
  if (!bar) return;
  const projects = loadData(KEYS.PROJECTS, DEFAULT_PROJECTS);
  const activeProjCount = projects.filter(p => !p.completed).length;
  const marcheItems = loadData(KEYS.MARCHE, DEFAULT_MARCHE);
  const fund = loadData(KEYS.FUND, 12400);
  const tweets = loadData(KEYS.TWEETS, DEFAULT_TWEETS);
  const openTweets = tweets.filter(t => !t.solved).length;

  const items = [
    { id: 'home-sec-profile', label: '🪪 マイ職人', badge: getProfile().typeId ? '診断済' : '未診断' },
    { id: 'home-sec-projects', label: '🔥 商品企画の推進', badge: `${activeProjCount}件進行` },
    { id: 'home-sec-marche', label: '🎪 マルシェ', badge: `${marcheItems.length}/10商品` },
    { id: 'home-sec-tools', label: '🛠️ 神道具50:50', badge: `¥${fund.toLocaleString()}` },
    { id: 'home-sec-news', label: '📰 現場ニュース', badge: '4カテゴリ' },
    { id: 'home-sec-tweets', label: '💬 最新つぶやき', badge: `募集中${openTweets}件` }
  ];

  bar.innerHTML = items.map(it => `
    <button type="button" class="home-index-pill" onclick="scrollToHomeSection('${it.id}')">
      <span>${it.label}</span>
      <span class="home-index-badge">${it.badge}</span>
    </button>
  `).join('');
}

/* ==========================================
   ホーム ＆ PC3列目：現場ニュース
   ========================================== */
function selectInsightCategory(key) {
  currentInsightKey = key;
  renderFieldInsights();
  renderTweetAsideExtras();
}

function cycleAsideInsight() {
  const keys = Object.keys(FIELD_INSIGHTS);
  const nextIdx = (keys.indexOf(currentInsightKey) + 1) % keys.length;
  selectInsightCategory(keys[nextIdx]);
}

function renderFieldInsights() {
  const pillsEl = document.getElementById('insight-category-pills');
  const boxEl = document.getElementById('insight-content-box');
  if (!pillsEl || !boxEl) return;
  pillsEl.innerHTML = Object.keys(FIELD_INSIGHTS).map(k => `
    <button type="button" class="pill-option ${k === currentInsightKey ? 'selected olive-sel' : ''}" onclick="selectInsightCategory('${k}')">${FIELD_INSIGHTS[k].label}</button>
  `).join('');
  const item = FIELD_INSIGHTS[currentInsightKey];
  boxEl.innerHTML = `
    <div style="font-weight:bold; font-size:0.96em; margin-bottom:5px; color:var(--text-ink);">${item.title}</div>
    <p style="font-size:0.86em; color:var(--text-muted);">${item.body}</p>
  `;
}

function renderTweetAsideExtras() {
  const toolsSlot = document.getElementById('tweet-aside-tools-slot');
  if (toolsSlot) {
    const tools = loadData(KEYS.TOOLS, DEFAULT_TOOLS);
    const fund = loadData(KEYS.FUND, 12400);
    toolsSlot.innerHTML = `
      <div style="font-size:0.75em; font-weight:bold; color:var(--terracotta); margin-bottom:8px;">
        🎪 マルシェ軍資金：¥${fund.toLocaleString()} / 目標 ¥30,000
      </div>
      ${tools.slice(0, 2).map(tl => {
        const nextIsUser = ((tl.clicks + 1) % 2 === 1);
        return `
          <div class="aside-mini-tool">
            <span class="aff-badge ${nextIsUser ? 'user-turn' : 'admin-turn'}" style="font-size:0.68em; padding:2px 7px;">
              ${nextIsUser ? '次回：👤 投稿者収益' : '次回：🎪 軍資金還元'}
            </span>
            <div style="font-size:0.84em; font-weight:bold; line-height:1.35; margin-bottom:4px;">${escapeHtml(tl.name)}</div>
            <div style="font-size:0.74em; color:var(--text-muted); margin-bottom:7px;">${escapeHtml(tl.comment)}</div>
            <button type="button" class="btn-outline" style="width:100%; justify-content:center; padding:6px 10px; font-size:0.76em;" onclick="clickAffiliateTool(${tl.id})">🔗 50:50リンクを開く (${tl.clicks})</button>
          </div>
        `;
      }).join('')}
      <button type="button" class="btn-outline" style="width:100%; justify-content:center; margin-top:8px; font-size:0.76em;" onclick="switchMarcheSubtab('tools'); switchTab('marche');">神道具をもっと見る →</button>
    `;
  }

  const newsSlot = document.getElementById('tweet-aside-news-slot');
  if (newsSlot) {
    const item = FIELD_INSIGHTS[currentInsightKey] || FIELD_INSIGHTS.fruit;
    newsSlot.innerHTML = `
      <div style="font-size:0.74em; font-weight:bold; color:var(--olive); margin-bottom:4px;">${item.label}</div>
      <div style="font-size:0.86em; font-weight:bold; line-height:1.4; margin-bottom:6px;">${item.title}</div>
      <p style="font-size:0.77em; color:var(--text-muted); line-height:1.55; margin-bottom:10px;">${item.body}</p>
      <button type="button" class="btn-outline" style="width:100%; justify-content:center; padding:6px 10px; font-size:0.76em;" onclick="cycleAsideInsight()">🔄 次の現場ヒントを見る</button>
    `;
  }
}

/* ==========================================
   ① 性格診断 ＆ プロフィール（かんたん＋詳細対応）
   ========================================== */
function getProfile() {
  return loadData(KEYS.PROFILE, {
    name: '',
    role: '農家・生産者',
    pref: '',
    area: '',
    bio: '',
    specialty: '',
    lot: '',
    delivery: '',
    link: '',
    typeId: null
  });
}

function loadProfileForm() {
  const p = getProfile();
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
  setVal('prof-name', p.name);
  setVal('prof-role', p.role || '農家・生産者');
  setVal('prof-pref', p.pref);
  setVal('prof-area', p.area);
  setVal('prof-bio', p.bio);
  setVal('prof-specialty', p.specialty);
  setVal('prof-lot', p.lot);
  setVal('prof-delivery', p.delivery);
  setVal('prof-link', p.link);
}

function saveProfileForm() {
  const p = getProfile();
  const getVal = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  p.name = getVal('prof-name');
  p.role = document.getElementById('prof-role').value;
  p.pref = document.getElementById('prof-pref').value;
  p.area = getVal('prof-area');
  p.bio = getVal('prof-bio');
  p.specialty = getVal('prof-specialty');
  p.lot = getVal('prof-lot');
  p.delivery = getVal('prof-delivery');
  p.link = getVal('prof-link');
  saveData(KEYS.PROFILE, p);
  renderAllProfileViews();
  renderMemberDirectory();
  renderHomeIndex();
  showToast('✅ プロフィールを端末に保存しました！');
}

function applyBioTemplate(kind) {
  const roleEl = document.getElementById('prof-role');
  const bioEl = document.getElementById('prof-bio');
  if (kind === 'farmer') {
    roleEl.value = '農家・生産者';
    bioEl.value = '季節の規格外フルーツや余剰作物を活かして、美味しい加工品を一緒に作ってくれる工房さんを探しています！小ロットから気軽に相談したいです。';
  } else if (kind === 'maker') {
    roleEl.value = '加工業者・町工場';
    bioEl.value = '小ロットからの試作・商品開発が得意な工房です。農家さんの「もったいない」や「こんなの作りたい」を一緒に形にします！';
  } else {
    roleEl.value = '軽トラ・地域サポーター';
    bioEl.value = '近隣エリアの軽トラ運搬やマルシェのお手伝いで力になれます！面白いものづくりを現場から応援したいです。';
  }
}

function startDiagnosis(jumpToTab) {
  if (jumpToTab) switchTab('roadmap');
  quizState = { active: true, step: 0, scoreA: 0 };
  renderDiagnosisCard();
  setTimeout(() => {
    const el = document.getElementById('diagnosis-card');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
}

function answerQuiz(isChoiceA) {
  if (isChoiceA) quizState.scoreA += 1;
  quizState.step += 1;
  if (quizState.step >= QUIZ_QUESTIONS.length) {
    let resultType = 'guardian';
    if (quizState.scoreA >= 4) resultType = 'spark';
    else if (quizState.scoreA === 3) resultType = 'bridge';
    else if (quizState.scoreA === 2) resultType = 'artisan';
    const p = getProfile();
    p.typeId = resultType;
    quizState.active = false;
    saveData(KEYS.PROFILE, p);
    awardBadge(`🧭 ${DIAGNOSIS_TYPES[resultType].stamp}タイプ認定`);
    renderAllProfileViews();
    renderMemberDirectory();
    renderHomeIndex();
    showToast(`🧭 診断完了！「${DIAGNOSIS_TYPES[resultType].title}」`);
  } else {
    renderDiagnosisCard();
  }
}

function renderDiagnosisCard() {
  const container = document.getElementById('diagnosis-content');
  if (!container) return;
  const p = getProfile();
  if (quizState.active) {
    const q = QUIZ_QUESTIONS[quizState.step];
    const dots = QUIZ_QUESTIONS.map((_, i) => `<div class="quiz-dot ${i <= quizState.step ? 'filled' : ''}"></div>`).join('');
    container.innerHTML = `
      <div style="font-size:0.8em; font-weight:bold; color:var(--olive); margin-bottom:8px;">Q ${quizState.step + 1} / ${QUIZ_QUESTIONS.length}（直感でクリック！）</div>
      <div class="quiz-progress">${dots}</div>
      <p class="quiz-question">${q.q}</p>
      <div class="quiz-choices">
        <button type="button" class="quiz-choice-btn" onclick="answerQuiz(true)"><span class="choice-letter">A</span><span>${q.a}</span></button>
        <button type="button" class="quiz-choice-btn" onclick="answerQuiz(false)"><span class="choice-letter">B</span><span>${q.b}</span></button>
      </div>
    `;
    return;
  }
  if (p.typeId && DIAGNOSIS_TYPES[p.typeId]) {
    const t = DIAGNOSIS_TYPES[p.typeId];
    container.innerHTML = `
      <div class="stamp-badge ${t.stampClass}">${t.stamp}</div>
      <div class="result-box">
        <div style="font-size:0.78em; font-weight:bold; color:var(--olive); margin-bottom:4px;">あなたの職人タイプ</div>
        <div style="font-size:1.14em; font-weight:800; margin-bottom:6px;">${t.title}</div>
        <p style="font-size:0.86em;">${t.desc}</p>
        <div style="background:#fff; border:1px solid var(--border-shoji); border-radius:10px; padding:10px 12px; margin-top:10px; font-size:0.84em;">
          <strong>🤝 相性抜群のパートナー：${t.partner}</strong>
          <p style="margin-top:3px; color:var(--text-muted);">${t.tip}</p>
        </div>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button type="button" class="btn-olive" onclick="switchTab('tweet'); switchTweetSubtab('directory');">🧭 相性順で仲間をさがす →</button>
        <button type="button" class="btn-outline" onclick="startDiagnosis(false)">🔄 もう一度診断する</button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <p style="font-size:0.88em; color:var(--text-muted); margin-bottom:14px;">5問の2択に答えるだけで、あなたの「ものづくりタイプ」と「相性％順・仲間さがし図鑑」が最適化されます！</p>
      <button type="button" class="btn-terracotta" style="width:100%;" onclick="startDiagnosis(false)">🧭 30秒・性格診断をスタート！</button>
    `;
  }
}

function renderAllProfileViews() {
  const p = getProfile();
  const t = p.typeId ? DIAGNOSIS_TYPES[p.typeId] : null;
  const displayName = p.name ? escapeHtml(p.name) : 'ゲスト職人さん（未設定）';
  const regionLabel = [p.pref, p.area].filter(Boolean).join('・');
  const displayArea = regionLabel ? ` ｜ 📍 ${escapeHtml(regionLabel)}` : '';

  renderDiagnosisCard();

  const homeSlot = document.getElementById('home-profile-slot');
  if (homeSlot) {
    if (t) {
      homeSlot.innerHTML = `
        <section class="card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div class="stamp-badge ${t.stampClass}">${t.stamp}</div>
          <div style="padding-right:56px; flex:1; min-width:220px;">
            <div class="section-kicker">MY ARTISAN CARD</div>
            <h2 class="section-title" style="margin-bottom:4px; padding-right:0;">${displayName}</h2>
            <p style="font-size:0.84em; color:var(--olive); font-weight:bold; margin-bottom:4px;">${t.title}（${escapeHtml(p.role)}${displayArea}）</p>
            <p style="font-size:0.83em; color:var(--text-muted);">${p.bio ? escapeHtml(p.bio) : '「マイ・診断・構想」から屋号や詳細設備をいつでも追加できます'}</p>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="btn-olive" onclick="switchTab('tweet'); switchTweetSubtab('directory');">🧭 相性順で仲間を見る</button>
            <button type="button" class="btn-outline" onclick="switchTab('roadmap')">プロフィール編集</button>
          </div>
        </section>
      `;
    } else {
      homeSlot.innerHTML = `
        <section class="card terracotta-accent">
          <div class="section-kicker" style="color:var(--terracotta);">STEP 1｜まずは30秒でスタート</div>
          <h2 class="section-title">🧭 あなたの「ものづくりタイプ」を診断しよう</h2>
          <p style="font-size:0.86em; color:var(--text-muted); margin-bottom:12px;">診断すると「相性％順・仲間さがし図鑑」と「自動ToDo」があなた専用に最適化されます。</p>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="btn-terracotta" onclick="startDiagnosis(true)">30秒・性格診断をやってみる →</button>
            <button type="button" class="btn-outline" onclick="switchTab('tweet'); switchTweetSubtab('directory');">先に仲間さがし図鑑を見る</button>
          </div>
        </section>
      `;
    }
  }

  const enBanner = document.getElementById('en-my-type-banner');
  if (enBanner) {
    enBanner.innerHTML = t ? `
      <section class="card" style="padding:16px 22px;">
        <div class="stamp-badge ${t.stampClass}" style="width:42px; height:42px; font-size:0.68em; top:12px; right:16px;">${t.stamp}</div>
        <div class="section-kicker">YOUR MATCHING RADAR</div>
        <div style="font-weight:bold; font-size:0.95em; padding-right:48px;">好相性レーダー：${t.partner}</div>
      </section>
    ` : `
      <section class="card" style="padding:16px 22px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <div class="section-kicker">YOUR MATCHING RADAR</div>
          <div style="font-weight:bold; font-size:0.95em;">性格診断をすると、相性度と自動ToDoがあなた仕様になります</div>
        </div>
        <button type="button" class="btn-olive" onclick="startDiagnosis(true)">30秒診断</button>
      </section>
    `;
  }

  const postAs = document.getElementById('tweet-posting-as');
  if (postAs) {
    postAs.innerHTML = (p.name || t || regionLabel)
      ? `投稿者：<strong>${displayName}${displayArea}</strong> ${t ? `【${t.stamp}】` : ''}`
      : `※このまま一言だけで投稿OK！地域や診断を登録すると自動で反映されます。`;
  }
}

function renderEarnedBadges() {
  const badges = loadData(KEYS.BADGES, DEFAULT_BADGES);
  const gratitudeCount = loadData(KEYS.GRATITUDE, 0);
  const shelf = document.getElementById('earned-badges-shelf');
  if (shelf) {
    shelf.innerHTML = badges.map(b => `<span class="earned-badge">${escapeHtml(b)}</span>`).join('');
  }
  const mentorEl = document.getElementById('mentor-status-box');
  if (!mentorEl) return;
  const isUnlocked = gratitudeCount >= 3 || badges.includes('🏅 地域の名産メーカー（商品化達成）');
  mentorEl.className = isUnlocked ? 'mentor-box unlocked' : 'mentor-box';
  mentorEl.innerHTML = isUnlocked ? `
    <strong style="color:var(--olive);">🎓 認定コンサル（先輩アドバイザー）資格アンロック済！</strong>
    <p style="margin-top:4px; color:var(--text-muted);">感謝スタンプ累計：${gratitudeCount}回。新規ペアの開発相談に乗ることで、将来の売上レベニューシェア枠に参加できます！</p>
  ` : `
    <strong>🔒 認定コンサル（先輩アドバイザー）昇格まであと少し</strong>
    <p style="margin-top:4px; color:var(--text-muted);">解放条件：「EN」タブで感謝スタンプを3回贈る（現在 ${gratitudeCount}/3）または商品を1つ完成させる</p>
  `;
}

/* ==========================================
   ② つぶやき広場（PC3列常設 ＋ スマホ途中ポップアップ）
   ========================================== */
function selectTag(btn) {
  document.querySelectorAll('#tag-selector .tag-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  currentTag = btn.textContent;
}

function selectQuickTag(btn) {
  document.querySelectorAll('#qt-tag-selector .tag-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  quickTag = btn.textContent;
}

function openQuickTweetModal() {
  const modal = document.getElementById('quick-tweet-modal');
  if (!modal) return;
  modal.classList.add('open');
  setTimeout(() => {
    const inp = document.getElementById('qt-input');
    if (inp) inp.focus();
  }, 80);
}

function closeQuickTweetModal() {
  const modal = document.getElementById('quick-tweet-modal');
  if (modal) modal.classList.remove('open');
}

function selectTweetRegion(regionKey) {
  tweetRegionKey = regionKey;
  tweetPrefFilter = 'ALL';
  refreshPrefFilterOptions('tweet-pref-filter', regionKey, 'ALL');
  renderTweets();
}

function onTweetPrefChange(val) {
  tweetPrefFilter = val || 'ALL';
  renderTweets();
}

function selectTweetFilter(key) { tweetFilterTag = key; renderTweets(); }
function onTweetSearchInput(val) { tweetSearchQuery = val.trim().toLowerCase(); renderTweets(); }
function toggleHideSolved(checked) { hideSolvedTweets = checked; renderTweets(); }

function submitTweetInternal({ tag, text, pref, city, qty, deadline, photoKey, useSamplePhoto }) {
  const p = getProfile();
  const t = p.typeId ? DIAGNOSIS_TYPES[p.typeId] : null;
  const finalPref = pref || p.pref || '';
  const finalCity = city || p.area || '';
  const authorLabel = p.name || 'あなた（テスト投稿）';
  const finalPhoto = pendingPhotos[photoKey] || (useSamplePhoto ? SAMPLE_APPLE_IMG : '');

  const tweets = loadData(KEYS.TWEETS, DEFAULT_TWEETS);
  tweets.unshift({
    id: Date.now(),
    tag: tag,
    author: authorLabel,
    pref: finalPref,
    city: finalCity,
    qty: qty || '',
    deadline: deadline || '',
    stamp: t ? t.stamp : '',
    stampClass: t ? t.stampClass : '',
    typeId: p.typeId || 'spark',
    text: text,
    photo: finalPhoto,
    helps: 1,
    solved: false,
    daysLeft: 30,
    time: 'たった今'
  });
  saveData(KEYS.TWEETS, tweets);
  clearPendingPhoto(photoKey);
  renderTweets();
  renderHomeIndex();
  showToast('💬 現場のつぶやきを投稿しました！（30日後に自動消去）');
}

function postTweet() {
  const input = document.getElementById('tweet-input');
  const text = input ? input.value.trim() : '';
  if (!text) { showToast('⚠️ つぶやき本文を一言入力してください'); return; }

  submitTweetInternal({
    tag: currentTag,
    text: text,
    pref: document.getElementById('tweet-pref') ? document.getElementById('tweet-pref').value : '',
    city: document.getElementById('tweet-city') ? document.getElementById('tweet-city').value.trim() : '',
    qty: document.getElementById('tweet-qty') ? document.getElementById('tweet-qty').value.trim() : '',
    deadline: document.getElementById('tweet-deadline') ? document.getElementById('tweet-deadline').value.trim() : '',
    photoKey: 'tweet',
    useSamplePhoto: document.getElementById('tweet-attach-sample-photo') && document.getElementById('tweet-attach-sample-photo').checked
  });

  input.value = '';
  ['tweet-pref', 'tweet-city', 'tweet-qty', 'tweet-deadline'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const chk = document.getElementById('tweet-attach-sample-photo');
  if (chk) chk.checked = false;
}

function postQuickTweet() {
  const input = document.getElementById('qt-input');
  const text = input ? input.value.trim() : '';
  if (!text) { showToast('⚠️ つぶやき本文を一言入力してください'); return; }

  submitTweetInternal({
    tag: quickTag,
    text: text,
    pref: document.getElementById('qt-pref') ? document.getElementById('qt-pref').value : '',
    city: document.getElementById('qt-city') ? document.getElementById('qt-city').value.trim() : '',
    qty: document.getElementById('qt-qty') ? document.getElementById('qt-qty').value.trim() : '',
    deadline: document.getElementById('qt-deadline') ? document.getElementById('qt-deadline').value.trim() : '',
    photoKey: 'qt',
    useSamplePhoto: document.getElementById('qt-attach-sample-photo') && document.getElementById('qt-attach-sample-photo').checked
  });

  input.value = '';
  ['qt-pref', 'qt-city', 'qt-qty', 'qt-deadline'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const chk = document.getElementById('qt-attach-sample-photo');
  if (chk) chk.checked = false;
  closeQuickTweetModal();
}

function addHelp(id, btnElement) {
  const tweets = loadData(KEYS.TWEETS, DEFAULT_TWEETS);
  const target = tweets.find(t => t.id === id);
  if (target) {
    target.helps += 1;
    saveData(KEYS.TWEETS, tweets);
    btnElement.classList.remove('pop');
    void btnElement.offsetWidth;
    btnElement.classList.add('pop');
    setTimeout(() => renderTweets(), 240);
  }
}

function toggleTweetSolved(id) {
  const tweets = loadData(KEYS.TWEETS, DEFAULT_TWEETS);
  const target = tweets.find(t => t.id === id);
  if (!target) return;
  target.solved = !target.solved;
  saveData(KEYS.TWEETS, tweets);
  renderTweets();
  renderHomeIndex();
  showToast(target.solved ? '✅ 解決済みスタンプを押しました！' : '🔄 募集中に戻しました');
}

function createCollabProject({ title, partnerAuthor, partnerType, triggerText, isKeiTruck }) {
  const p = getProfile();
  const myName = p.name || 'あなたの工房・農園';
  const myType = p.typeId || 'spark';
  const compat = calcCompatibility(myType, partnerType);

  const customTodos = [
    { text: `相談ルームで最初のあいさつ：「${triggerText.slice(0, 22)}…」の希望量を確認する`, done: false },
    myType === 'spark' || partnerType === 'spark'
      ? { text: '【直感ペア専用】まず最小ロット（5〜10個分）の試作イメージを合わせる', done: false }
      : { text: '【堅実ペア専用】「🧮 原価・山分け」タブで売価と黒字ラインを試算する', done: false },
    { text: '「📋 合意・印刷」タブで費用配分・売り方・軽トラ便を確定する', done: false },
    { text: '簡易共同開発同意書（PDF）・A4店頭POP・8枚名刺を出力テストする', done: false }
  ];

  const projects = loadData(KEYS.PROJECTS, DEFAULT_PROJECTS);
  const newProj = {
    id: Date.now(),
    title: title,
    partnerName: `${myName} × ${partnerAuthor}`,
    partnerTypeId: partnerType,
    compatibility: compat,
    completed: false,
    costPlan: COST_OPTIONS[0],
    salesPlan: SALES_OPTIONS[0],
    logisticsPlan: isKeiTruck ? LOGISTICS_OPTIONS[2] : LOGISTICS_OPTIONS[0],
    partyA: myName,
    partyB: partnerAuthor,
    memo: `きっかけ：${triggerText}`,
    calc: Object.assign({}, DEFAULT_CALC),
    todos: customTodos,
    messages: [
      { id: Date.now() + 1, sender: 'partner', name: partnerAuthor, text: `ご縁ありがとうございます！「${triggerText.slice(0, 34)}…」の件、ぜひ楽しく相談しましょう🤝`, time: nowTimeStr() }
    ],
    diaries: []
  };

  projects.unshift(newProj);
  saveData(KEYS.PROJECTS, projects);
  selectedProjectId = newProj.id;
  currentStudioTab = 'todo';
  awardBadge('🤝 はじめてのご縁成立');
  renderEnSection();
  renderHomeIndex();
  switchTab('en');
  showToast(`🤝 ご縁成立！相性${compat}%の相談ルーム＆自動ToDoを作成しました`);
}

function connectEnFromTweet(tweetId) {
  const tweets = loadData(KEYS.TWEETS, DEFAULT_TWEETS);
  const tw = tweets.find(t => t.id === tweetId);
  if (!tw) return;
  createCollabProject({
    title: `${tw.author.split('/')[0].trim()}とのコラボ新商品企画`,
    partnerAuthor: tw.author,
    partnerType: tw.typeId || 'artisan',
    triggerText: tw.text,
    isKeiTruck: tw.tag.includes('軽トラ')
  });
}

function buildTweetCardHtml(t) {
  const stampHtml = t.solved
    ? `<div class="stamp-badge solved">解決<br>済</div>`
    : (t.stamp ? `<div class="stamp-badge ${t.stampClass || ''}">${escapeHtml(t.stamp)}</div>` : '');
  const photoHtml = t.photo ? `<img class="tweet-photo" src="${t.photo}" alt="投稿画像" loading="lazy">` : '';
  const areaLabel = [t.pref, t.city].filter(Boolean).join(' ');
  const detailChips = [
    areaLabel ? `📍 ${escapeHtml(areaLabel)}` : '',
    t.qty ? `📦 ${escapeHtml(t.qty)}` : '',
    t.deadline ? `🗓️ ${escapeHtml(t.deadline)}` : ''
  ].filter(Boolean);

  return `
    <article class="card tweet-card ${t.solved ? 'solved-card' : ''}">
      ${stampHtml}
      <div class="tweet-meta">
        <span class="tweet-tag">${escapeHtml(t.tag)}</span><span>｜</span>
        <span class="author-name">${escapeHtml(t.author)}</span><span>・ ${escapeHtml(t.time)}</span>
        <span class="ttl-chip">⏳ あと${t.daysLeft || 30}日</span>
      </div>
      ${detailChips.length > 0 ? `<div class="tweet-detail-strip">${detailChips.map(c => `<span class="detail-pill">${c}</span>`).join('')}</div>` : ''}
      <p class="tweet-body">${escapeHtml(t.text)}</p>
      ${photoHtml}
      <div class="action-row">
        <button type="button" class="help-btn" onclick="addHelp(${t.id}, this)"><span>🙋‍♂️ 力になれます！ <strong>${t.helps}</strong></span></button>
        ${t.solved ? '' : `<button type="button" class="btn-outline" onclick="connectEnFromTweet(${t.id})">🤝 ご縁を繋ぐ</button>`}
        <button type="button" class="btn-outline" onclick="toggleTweetSolved(${t.id})">${t.solved ? '🔄 再開' : '✅ 解決済'}</button>
      </div>
    </article>
  `;
}

function renderTweets() {
  const tweets = loadData(KEYS.TWEETS, DEFAULT_TWEETS);

  const regPills = document.getElementById('tweet-region-pills');
  if (regPills) {
    regPills.innerHTML = REGION_BLOCKS.map(r => `
      <button type="button" class="pill-option ${tweetRegionKey === r.key ? 'selected olive-sel' : ''}" onclick="selectTweetRegion('${r.key}')">${r.label}</button>
    `).join('');
  }

  const tagPills = document.getElementById('tweet-filter-pills');
  if (tagPills) {
    tagPills.innerHTML = FILTER_TAGS.map(ft => `
      <button type="button" class="pill-option ${tweetFilterTag === ft.key ? 'selected olive-sel' : ''}" onclick="selectTweetFilter('${ft.key}')">${ft.label}</button>
    `).join('');
  }

  const filtered = tweets.filter(t => {
    if (hideSolvedTweets && t.solved) return false;
    if (tweetFilterTag !== 'ALL' && !t.tag.includes(tweetFilterTag)) return false;
    if (!matchesRegionAndPref(t.pref || '', tweetRegionKey, tweetPrefFilter)) return false;
    if (tweetSearchQuery) {
      const hay = `${t.text} ${t.author} ${t.tag} ${t.pref || ''} ${t.city || ''} ${t.qty || ''} ${t.deadline || ''}`.toLowerCase();
      if (!hay.includes(tweetSearchQuery)) return false;
    }
    return true;
  });

  const listEl = document.getElementById('tweet-list');
  if (listEl) {
    listEl.innerHTML = filtered.length === 0
      ? `<section class="card"><p style="color:var(--text-muted);">条件に合うつぶやきが見つかりませんでした。地域やキーワードを広げてお試しください。</p></section>`
      : filtered.map(buildTweetCardHtml).join('');
  }

  const homePrev = document.getElementById('home-tweet-preview');
  if (homePrev) {
    homePrev.innerHTML = tweets.slice(0, 2).map(buildTweetCardHtml).join('');
  }
}

/* ==========================================
   ②-B 相性％順・仲間さがし図鑑
   ========================================== */
function selectDirRegion(regionKey) {
  dirRegionKey = regionKey;
  dirPrefFilter = 'ALL';
  refreshPrefFilterOptions('dir-pref-filter', regionKey, 'ALL');
  renderMemberDirectory();
}

function onDirPrefChange(val) { dirPrefFilter = val || 'ALL'; renderMemberDirectory(); }
function onDirRoleChange(val) { dirRoleFilter = val || 'ALL'; renderMemberDirectory(); }
function onDirSearchInput(val) { dirSearchQuery = val.trim().toLowerCase(); renderMemberDirectory(); }

function connectEnFromMember(memberId) {
  const member = DEFAULT_MEMBERS.find(m => m.id === memberId);
  if (!member) return;
  createCollabProject({
    title: `${member.name.split('/')[0].trim()}との新商品コラボ企画`,
    partnerAuthor: `${member.name}（${member.pref}）`,
    partnerType: member.typeId,
    triggerText: `${member.pref}${member.city}の${member.role}：${member.specialty}`,
    isKeiTruck: member.role.includes('軽トラ')
  });
}

function renderMemberDirectory() {
  const p = getProfile();
  const myType = p.typeId;
  const myTypeObj = myType ? DIAGNOSIS_TYPES[myType] : null;

  const statusEl = document.getElementById('dir-my-status');
  if (statusEl) {
    statusEl.innerHTML = myTypeObj
      ? `あなたの診断結果<strong>「${myTypeObj.title}」</strong>をもとに、相性％が高い順へ自動ランキング表示しています（おすすめ相手：<strong>${myTypeObj.partner}</strong>）。`
      : `※まだ性格診断が未実施のため標準順で表示中。<button type="button" class="chip-btn" style="margin-left:6px;" onclick="startDiagnosis(true)">🧭 30秒診断で相性順を解放する</button>`;
  }

  const regPills = document.getElementById('dir-region-pills');
  if (regPills) {
    regPills.innerHTML = REGION_BLOCKS.map(r => `
      <button type="button" class="pill-option ${dirRegionKey === r.key ? 'selected olive-sel' : ''}" onclick="selectDirRegion('${r.key}')">${r.label}</button>
    `).join('');
  }

  const ranked = DEFAULT_MEMBERS
    .map(m => Object.assign({}, m, { compat: calcCompatibility(myType, m.typeId) }))
    .filter(m => {
      if (!matchesRegionAndPref(m.pref, dirRegionKey, dirPrefFilter)) return false;
      if (dirRoleFilter !== 'ALL' && m.role !== dirRoleFilter) return false;
      if (dirSearchQuery) {
        const hay = `${m.name} ${m.role} ${m.pref} ${m.city} ${m.bio} ${m.specialty} ${m.lot} ${m.delivery}`.toLowerCase();
        if (!hay.includes(dirSearchQuery)) return false;
      }
      return true;
    })
    .sort((a, b) => b.compat - a.compat);

  const hitEl = document.getElementById('dir-hit-count');
  if (hitEl) {
    hitEl.textContent = `表示中：${ranked.length} 件（相性％が高い順）`;
  }

  const listEl = document.getElementById('member-directory-list');
  if (!listEl) return;

  if (ranked.length === 0) {
    listEl.innerHTML = `<section class="card" style="grid-column:1/-1;"><p style="color:var(--text-muted);">条件に合う仲間が見つかりませんでした。都道府県や立場フィルタを緩めてお試しください。</p></section>`;
    return;
  }

  listEl.innerHTML = ranked.map(m => {
    const typeInfo = DIAGNOSIS_TYPES[m.typeId] || DIAGNOSIS_TYPES.artisan;
    const isTopMatch = m.compat >= 95;
    return `
      <article class="card member-card ${isTopMatch ? 'terracotta-accent' : ''}">
        <div class="stamp-badge ${isTopMatch ? 'terracotta' : ''}">相性<br>${m.compat}%</div>
        <div>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px; padding-right:56px;">
            <span class="member-area-tag">📍 ${escapeHtml(m.pref)} ${escapeHtml(m.city)}</span>
            <span class="member-role-tag">${escapeHtml(m.role)}</span>
          </div>
          <h3 class="section-title" style="margin-bottom:4px;">${escapeHtml(m.name)}</h3>
          <div style="font-size:0.78em; font-weight:bold; color:var(--olive); margin-bottom:8px;">タイプ：${typeInfo.title}</div>
          <p style="font-size:0.86em; margin-bottom:10px;">${escapeHtml(m.bio)}</p>
          <div class="member-detail-box">
            <div class="member-detail-row"><strong>🛠️ 得意素材・設備：</strong>${escapeHtml(m.specialty)}</div>
            <div class="member-detail-row"><strong>📦 対応ロット：</strong>${escapeHtml(m.lot)}</div>
            <div class="member-detail-row"><strong>🚚 受け渡し範囲：</strong>${escapeHtml(m.delivery)}</div>
          </div>
        </div>
        <div class="action-row" style="margin-top:6px;">
          <button type="button" class="${isTopMatch ? 'btn-terracotta' : 'btn-olive'}" style="flex:1;" onclick="connectEnFromMember('${m.id}')">🤝 相性${m.compat}%でご縁を繋ぐ</button>
        </div>
      </article>
    `;
  }).join('');
}

/* ==========================================
   ③ EN（ご縁・開発スタジオ）＆ ホーム推進ボード描画
   ========================================== */
function renderHomeProjectBoard(projects) {
  const homeEn = document.getElementById('home-active-en-slot');
  if (!homeEn) return;

  if (!projects || projects.length === 0) {
    homeEn.innerHTML = `<p style="font-size:0.86em; color:var(--text-muted);">まだ進行中の企画がありません。「つぶやき・仲間さがし」から気になる相手とご縁を繋いでみましょう！</p>`;
    return;
  }

  homeEn.innerHTML = projects.slice(0, 3).map(proj => {
    const doneTodos = proj.todos.filter(td => td.done).length;
    const totalTodos = Math.max(1, proj.todos.length);
    const pct = proj.completed ? 100 : Math.round((doneTodos / totalTodos) * 100);
    const msgCount = (proj.messages || []).length;
    const diaryCount = (proj.diaries || []).length;
    const calc = ensureProjectCalc(proj);
    const metrics = computeProfitMetrics(calc);

    const stageDone = [
      msgCount > 0,
      Boolean(proj.costPlan) && metrics.sell > 0,
      diaryCount > 0,
      Boolean(proj.completed)
    ];
    const firstUndone = stageDone.indexOf(false);
    const stageLabels = ['① ご縁・相談', '② 原価・合意', '③ 試作・写メ日記', '④ 完成・マルシェ'];
    const stageHtml = stageLabels.map((label, idx) => {
      const cls = stageDone[idx] ? 'done' : (idx === firstUndone ? 'current' : '');
      const icon = stageDone[idx] ? '✓ ' : (idx === firstUndone ? '▶ ' : '');
      return `<div class="proj-stage-step ${cls}">${icon}${label}</div>`;
    }).join('');

    return `
      <div class="home-proj-card" onclick="selectProject(${proj.id}); switchTab('en');">
        <div class="home-proj-top">
          <div>
            <div style="font-size:0.75em; font-weight:bold; color:var(--olive); margin-bottom:2px;">🤝 ${escapeHtml(proj.partnerName)}</div>
            <div style="font-size:1.05em; font-weight:800; line-height:1.35;">${escapeHtml(proj.title)}</div>
          </div>
          <span class="proj-compat-pill ${proj.completed ? 'done' : ''}">
            ${proj.completed ? '🎉 商品化完了' : `相性 ${proj.compatibility}%`}
          </span>
        </div>

        <div class="proj-gauge-row">
          <div class="proj-gauge-track">
            <div class="proj-gauge-fill" style="width:${Math.max(8, pct)}%;"></div>
          </div>
          <span class="proj-gauge-pct">${pct}%</span>
        </div>

        <div class="proj-stage-steps">${stageHtml}</div>

        <div class="home-proj-meta">
          <span>✅ ToDo ${doneTodos}/${totalTodos} ｜ 💬 相談 ${msgCount}件 ｜ 📸 日記 ${diaryCount}件 ｜ 売価目安 <strong>¥${metrics.sell.toLocaleString()}</strong></span>
          <span style="color:var(--terracotta); font-weight:bold;">開発スタジオを開く →</span>
        </div>
      </div>
    `;
  }).join('');
}

function selectProject(projId) {
  selectedProjectId = projId;
  clearPendingPhoto('diary');
  renderEnSection();
}

function switchStudioSubtab(tab) {
  currentStudioTab = tab;
  renderEnRightPaneOnly();
}

function setChatSenderRole(role) {
  chatSenderRole = role;
  renderEnSection(false);
}

function sendQuickChat(projId, chipIndex) {
  const text = CHAT_QUICK_CHIPS[chipIndex];
  if (!text) return;
  appendChatMessage(projId, text);
}

function onChatKeyDown(event, projId) {
  if (event.key === 'Enter' && !event.isComposing) {
    event.preventDefault();
    sendChatInput(projId);
  }
}

function sendChatInput(projId) {
  const inp = document.getElementById('chat-input-' + projId);
  if (!inp) return;
  const text = inp.value.trim();
  if (!text) return;
  inp.value = '';
  appendChatMessage(projId, text);
}

function appendChatMessage(projId, text) {
  const projects = loadData(KEYS.PROJECTS, DEFAULT_PROJECTS);
  const proj = projects.find(p => p.id === projId);
  if (!proj) return;
  if (!proj.messages) proj.messages = [];
  const p = getProfile();
  const senderName = chatSenderRole === 'me'
    ? (p.name || proj.partyA || '自分')
    : (proj.partyB || 'パートナー');

  proj.messages.push({ id: Date.now(), sender: chatSenderRole, name: senderName, text: text, time: nowTimeStr() });
  saveData(KEYS.PROJECTS, projects);
  renderChatThreadOnly(proj, true);
  renderHomeProjectBoard(projects);
}

function renderChatThreadOnly(proj, scrollBottom) {
  const threadEl = document.getElementById('chat-scroll-' + proj.id);
  if (!threadEl) { renderEnSection(scrollBottom); return; }
  const messages = proj.messages || [];
  threadEl.innerHTML = messages.map(m => `
    <div class="chat-row ${m.sender === 'me' ? 'me' : 'partner'}">
      <div class="chat-sender-name">${escapeHtml(m.name)}</div>
      <div class="chat-bubble">${escapeHtml(m.text)}</div>
      <div class="chat-meta-line">
        <span>${escapeHtml(m.time)}</span>
        <button type="button" class="chat-to-diary-btn" onclick="promoteChatToDiary(${proj.id}, ${m.id})">📸 日記へ転記</button>
      </div>
    </div>
  `).join('');
  if (scrollBottom) threadEl.scrollTop = threadEl.scrollHeight;
}

function promoteChatToDiary(projId, msgId) {
  const projects = loadData(KEYS.PROJECTS, DEFAULT_PROJECTS);
  const proj = projects.find(p => p.id === projId);
  if (!proj || !proj.messages) return;
  const msg = proj.messages.find(m => m.id === msgId);
  if (!msg) return;

  if (!proj.diaries) proj.diaries = [];
  proj.diaries.unshift({
    id: Date.now(), date: `相談メモより転記 (${msg.time})`, masked: true,
    text: applySafetyMask(`「${msg.text}」`), photo: ''
  });
  saveData(KEYS.PROJECTS, projects);
  awardBadge('📸 ストーリー記録マスター');
  currentStudioTab = 'diary';
  renderEnRightPaneOnly();
  renderHomeProjectBoard(projects);
  showToast('📸 相談メッセージを自動伏せ字つきで「写メ日記」へ転記しました！');
}

function toggleProjectTodo(projId, idx) {
  const projects = loadData(KEYS.PROJECTS, DEFAULT_PROJECTS);
  const proj = projects.find(p => p.id === projId);
  if (!proj || !proj.todos[idx]) return;
  proj.todos[idx].done = !proj.todos[idx].done;
  saveData(KEYS.PROJECTS, projects);
  updateEnProgressBadgeOnly(proj);
  renderEnRightPaneOnly();
  renderHomeProjectBoard(projects);
}

function updateEnProgressBadgeOnly(proj) {
  const labelEl = document.getElementById('en-todo-progress-text');
  if (!labelEl) return;
  const doneCount = proj.todos.filter(t => t.done).length;
  const pct = Math.round((doneCount / proj.todos.length) * 100);
  labelEl.textContent = `${doneCount}/${proj.todos.length}（${pct}%）`;
}

function updateProjectCalc(projId, field, rawVal) {
  const projects = loadData(KEYS.PROJECTS, DEFAULT_PROJECTS);
  const proj = projects.find(p => p.id === projId);
  if (!proj) return;
  const calc = ensureProjectCalc(proj);
  calc[field] = Number(rawVal) || 0;
  saveData(KEYS.PROJECTS, projects);
  const resultTarget = document.getElementById('calc-result-live-' + projId);
  if (resultTarget) {
    resultTarget.innerHTML = buildCalcResultHtml(proj);
  }
  const ratioLabel = document.getElementById('calc-ratio-label-' + projId);
  if (ratioLabel) {
    const m = computeProfitMetrics(calc);
    ratioLabel.textContent = `甲 ${m.ratioA}% ： 乙 ${m.ratioB}%`;
  }
  renderHomeProjectBoard(projects);
}

function shareCalcToChat(projId) {
  const projects = loadData(KEYS.PROJECTS, DEFAULT_PROJECTS);
  const proj = projects.find(p => p.id === projId);
  if (!proj) return;
  const m = computeProfitMetrics(ensureProjectCalc(proj));
  const summary = `【原価試算共有】売価¥${m.sell.toLocaleString()} × ${m.qty}個 → 1個利益¥${m.unitNetProfit.toLocaleString()}（粗利率${m.profitRate}%）／合計利益¥${m.totalProfit.toLocaleString()}（甲¥${m.shareA.toLocaleString()}・乙¥${m.shareB.toLocaleString()}）`;
  appendChatMessage(projId, summary);
  showToast('🧮 原価シミュレーション結果を相談ルームへ共有しました！');
}

function buildCalcResultHtml(proj) {
  const c = ensureProjectCalc(proj);
  const m = computeProfitMetrics(c);
  const isRed = m.unitNetProfit <= 0;
  const breakEvenText = m.breakEvenQty === null
    ? '赤字（売価が変動原価以下）'
    : (m.breakEvenQty > m.qty ? `${m.breakEvenQty}個（予定数を超えています）` : `あと ${m.breakEvenQty} 個売れば黒字！`);

  return `
    <div class="calc-status-banner ${isRed ? 'warn' : ''}">
      ${isRed
        ? `⚠️ 現在の売価（¥${m.sell.toLocaleString()}）は1個あたりの総原価（¥${m.totalUnitCost.toLocaleString()}）を下回っています。売価を見直しましょう！`
        : `✅ 健全な黒字プラン！マルシェで ${m.breakEvenQty} 個売れた時点で固定費を回収し、完売で ¥${m.totalProfit.toLocaleString()} の利益が残ります。`
      }
    </div>
    <div class="calc-result-grid">
      <div class="calc-stat-card ${isRed ? 'danger' : 'highlight'}">
        <div class="calc-stat-label">1個あたりの純利益（利益率）</div>
        <div class="calc-stat-val">¥${m.unitNetProfit.toLocaleString()} <span style="font-size:0.55em;">(${m.profitRate}%)</span></div>
      </div>
      <div class="calc-stat-card">
        <div class="calc-stat-label">1個あたりの総原価（変動+固定割）</div>
        <div class="calc-stat-val">¥${m.totalUnitCost.toLocaleString()}</div>
      </div>
      <div class="calc-stat-card highlight">
        <div class="calc-stat-label">甲（${escapeHtml(proj.partyA || '自分')}）の手残り (${m.ratioA}%)</div>
        <div class="calc-stat-val">¥${m.shareA.toLocaleString()}</div>
      </div>
      <div class="calc-stat-card highlight">
        <div class="calc-stat-label">乙（${escapeHtml(proj.partyB || '相手')}）の手残り (${m.ratioB}%)</div>
        <div class="calc-stat-val">¥${m.shareB.toLocaleString()}</div>
      </div>
    </div>
    <div style="font-size:0.8em; color:var(--text-muted); margin-bottom:10px;">
      📊 想定売上：<strong>¥${m.totalRevenue.toLocaleString()}</strong> ｜ 総コスト：<strong>¥${m.totalCost.toLocaleString()}</strong> ｜ 損益分岐：<strong>${breakEvenText}</strong>
    </div>
  `;
}

function updateProjectOption(projId, field, optIndex) {
  const maps = { costPlan: COST_OPTIONS, salesPlan: SALES_OPTIONS, logisticsPlan: LOGISTICS_OPTIONS };
  const val = maps[field] && maps[field][optIndex];
  if (!val) return;
  updateProjectField(projId, field, val, true);
}

function updateProjectField(projId, field, value, reRenderRight) {
  const projects = loadData(KEYS.PROJECTS, DEFAULT_PROJECTS);
  const proj = projects.find(p => p.id === projId);
  if (!proj) return;
  proj[field] = value;
  saveData(KEYS.PROJECTS, projects);
  renderHomeProjectBoard(projects);
  if (reRenderRight) {
    renderEnRightPaneOnly();
    showToast('💾 合意カードの選択を保存しました');
  }
}

function addDiaryEntry(projId) {
  const input = document.getElementById('diary-input-' + projId);
  if (!input) return;
  const rawText = input.value.trim();
  if (!rawText) { showToast('⚠️ 試作メモを一言入力してください'); return; }
  const maskChecked = document.getElementById('diary-mask-' + projId).checked;
  const safeText = maskChecked ? applySafetyMask(rawText) : rawText;

  const projects = loadData(KEYS.PROJECTS, DEFAULT_PROJECTS);
  const proj = projects.find(p => p.id === projId);
  if (!proj) return;
  if (!proj.diaries) proj.diaries = [];
  proj.diaries.unshift({
    id: Date.now(), date: `試作メモ #${proj.diaries.length + 1}`, masked: maskChecked, text: safeText, photo: pendingPhotos.diary || ''
  });
  saveData(KEYS.PROJECTS, projects);
  pendingPhotos.diary = '';
  awardBadge('📸 ストーリー記録マスター');
  renderEnRightPaneOnly();
  renderHomeProjectBoard(projects);
  showToast(maskChecked ? '🔒 原価・機密を自動伏せ字にして写メ日記に保存しました！' : '📸 写メ日記を保存しました！');
}

function sendGratitudeStamp(stampIndex) {
  const label = GRATITUDE_STAMPS[stampIndex];
  if (!label) return;
  const count = loadData(KEYS.GRATITUDE, 0) + 1;
  saveData(KEYS.GRATITUDE, count);
  awardBadge(label);
  if (count >= 3) {
    awardBadge('🎓 認定コンサル（先輩アドバイザー）');
    showToast('🎊 感謝スタンプ累計3回達成！「認定コンサル」が解放されました！');
  } else {
    showToast(`✨ パートナーへ「${label}」スタンプを贈りました！（累計 ${count}）`);
  }
  renderEarnedBadges();
}

function postKeiTruckRequest(projId) {
  const projects = loadData(KEYS.PROJECTS, DEFAULT_PROJECTS);
  const proj = projects.find(p => p.id === projId);
  if (!proj) return;
  const p = getProfile();
  const tweets = loadData(KEYS.TWEETS, DEFAULT_TWEETS);
  tweets.unshift({
    id: Date.now(),
    tag: '🚚 軽トラ配送オファー募集',
    author: proj.partyA || 'EN•joy コラボペア',
    pref: p.pref || '',
    city: p.area || '',
    qty: '試作品・素材運搬',
    deadline: '日程応相談',
    stamp: 'ご縁便',
    stampClass: 'terracotta',
    typeId: 'bridge',
    text: `【軽トラ便ご協力募集】「${proj.title}」の試作品・素材の運搬を手伝ってくださる地域ドライバーさんを探しています！ご協力いただける方は「力になれます！」をお願いします🚚`,
    photo: '',
    helps: 1,
    solved: false,
    daysLeft: 30,
    time: 'たった今'
  });
  saveData(KEYS.TWEETS, tweets);
  renderTweets();
  renderHomeIndex();
  showToast('🚚 軽トラ配送オファーをつぶやき広場へ自動投稿しました！');
}

/* ==========================================
   印刷モーダル：簡易同意書PDF ／ A4店頭POP ／ A4・8枚ストーリー名刺
   ========================================== */
function closeDocModal() {
  document.getElementById('doc-modal').classList.remove('open');
}

function openAgreementModal(projId) {
  const projects = loadData(KEYS.PROJECTS, DEFAULT_PROJECTS);
  const proj = projects.find(p => p.id === projId);
  if (!proj) return;

  const calc = ensureProjectCalc(proj);
  const m = computeProfitMetrics(calc);
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const agreeHash = generateAgreementHash(`${proj.title}|${proj.partyA}|${proj.partyB}|${proj.costPlan}|${proj.salesPlan}|${proj.logisticsPlan}|${m.sell}|${dateStr}`);
  awardBadge('📄 揉めない合意マスター');

  document.getElementById('doc-modal-content').innerHTML = `
    <div class="modal-toolbar no-print">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <span style="font-size:0.86em; font-weight:bold; color:var(--olive);">🔒 サーバー送信ゼロ・この端末内だけで生成</span>
        <div style="display:flex; gap:8px;">
          <button type="button" class="btn-olive" onclick="window.print()">🖨️ PDF保存 / 印刷</button>
          <button type="button" class="btn-outline" onclick="closeDocModal()">✕ 閉じる</button>
        </div>
      </div>
    </div>
    <div class="agreement-sheet">
      <h2>簡易共同開発 確認同意書（覚書）</h2>
      <p style="font-size:0.88em; margin-bottom:10px;">甲および乙は、EN•joyを通じた新商品の共同試作・開発にあたり、気持ちよく協力し合うため以下の条件を確認・合意します。</p>
      <table class="agree-table">
        <tr><th>企画・商品名</th><td><strong>${escapeHtml(proj.title)}</strong></td></tr>
        <tr><th>甲（企画・生産側）</th><td>${escapeHtml(proj.partyA || '未入力')}</td></tr>
        <tr><th>乙（加工・協力側）</th><td>${escapeHtml(proj.partyB || '未入力')}</td></tr>
        <tr><th>① 試作費用の配分</th><td>${escapeHtml(proj.costPlan)}</td></tr>
        <tr><th>② 想定売価・ロット・利益配分</th><td>売価 ¥${m.sell.toLocaleString()} × ${m.qty}個（利益配分目安：甲 ${m.ratioA}% ： 乙 ${m.ratioB}%）</td></tr>
        <tr><th>③ 販売・販路の方針</th><td>${escapeHtml(proj.salesPlan)}</td></tr>
        <tr><th>④ 物流・運搬の方法</th><td>${escapeHtml(proj.logisticsPlan)}</td></tr>
        <tr><th>⑤ 備考・試作メモ</th><td>${escapeHtml(proj.memo || '特記事項なし')}</td></tr>
        <tr><th>合意確認日</th><td>${dateStr}</td></tr>
      </table>
      <div class="agree-clauses">
        <strong>【揉めないための基本確認事項（7つの急所）】</strong>
        <ol style="margin-top:6px;">
          <li><strong>役割分担：</strong>甲は素材および現場知見の提供、乙は加工試作・製造検討を誠実に分担する。</li>
          <li><strong>試作費と赤字防止：</strong>合意範囲を超える追加費用が生じる場合は事前に双方合意を得る。</li>
          <li><strong>知財・レシピの尊重：</strong>各自の既存技術・レシピは各自に帰属し、新規の商品名・企画は双方協議で共有する。</li>
          <li><strong>秘密保持：</strong>原価・仕入れ先・製造ノウハウ等の機密は第三者に開示しない。</li>
          <li><strong>食品衛生・表示責任：</strong>販売時の食品表示・衛生基準は製造・販売実務担当を中心に双方で確認する。</li>
          <li><strong>中止・見直し時の扱い：</strong>やむを得ず中止する場合はその時点までの実費精算を誠実に協議する。</li>
          <li><strong>誠実協議：</strong>定めのない事項はお互いの現場を尊重して話し合いで解決する。</li>
        </ol>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:20px;">
        <div style="border-top:1px solid #333; padding-top:6px; font-size:0.85em;">甲 署名・捺印：${escapeHtml(proj.partyA || '')}</div>
        <div style="border-top:1px solid #333; padding-top:6px; font-size:0.85em;">乙 署名・捺印：${escapeHtml(proj.partyB || '')}</div>
      </div>
      <div class="agree-hash"><strong>EN•joy 合意証明ハッシュ（ローカル生成）：</strong><br>${agreeHash} ｜ ${dateStr}</div>
    </div>
  `;
  document.getElementById('doc-modal').classList.add('open');
}

function getProjectStoryPackage(proj) {
  const latestDiary = (proj.diaries && proj.diaries[0]) ? proj.diaries[0] : null;
  const calc = ensureProjectCalc(proj);
  const storyText = latestDiary
    ? `${proj.memo ? proj.memo + ' ' : ''}${latestDiary.text}`
    : (proj.memo || '農家と町工場の「あったらいいな」から生まれた限定コラボ商品です。');
  return {
    title: proj.title,
    makers: `${proj.partyA || '甲'} × ${proj.partyB || '乙'}`,
    price: Number(calc.sellPrice) || 880,
    story: storyText,
    photo: (latestDiary && latestDiary.photo) ? latestDiary.photo : SAMPLE_APPLE_IMG
  };
}

function openPopFromProject(projId) {
  const projects = loadData(KEYS.PROJECTS, DEFAULT_PROJECTS);
  const proj = projects.find(p => p.id === projId);
  if (!proj) return;
  const pkg = getProjectStoryPackage(proj);
  openPopModal(Object.assign({}, pkg, { catchphrase: 'ご縁から生まれた・マルシェ限定試作品', theme: 'washi' }));
}

function openPopFromMarche(itemId) {
  const items = loadData(KEYS.MARCHE, DEFAULT_MARCHE);
  const item = items.find(i => i.id === itemId);
  if (!item) return;
  openPopModal({
    title: item.title,
    makers: item.makers,
    price: item.price || 880,
    catchphrase: '農家と町工場の「ご縁」から生まれた一品',
    story: item.story,
    photo: item.photo || '',
    theme: 'washi'
  });
}

function openPopModal(data) {
  activePopData = Object.assign({}, data);
  awardBadge('🎨 マルシェ店頭POPクリエイター');
  renderPopModalContent();
  document.getElementById('doc-modal').classList.add('open');
}

function updatePopSetting(key, val) {
  if (!activePopData) return;
  activePopData[key] = (key === 'price') ? (parseInt(val, 10) || 0) : val;
  const target = document.getElementById('pop-sheet-live-target');
  if (target) target.innerHTML = buildPopSheetInnerHtml();
}

function setPopTheme(theme) {
  if (!activePopData) return;
  activePopData.theme = theme;
  renderPopModalContent();
}

function buildPopSheetInnerHtml() {
  const d = activePopData;
  const hasPhoto = Boolean(d.photo);
  const priceText = d.price > 0 ? `¥${d.price.toLocaleString()}` : '試食無料';
  return `
    <div class="pop-sheet ${d.theme === 'kyoto' ? 'kyoto-dark' : ''}">
      <div class="pop-frame">
        <div class="pop-top-ribbon">
          <div class="pop-brand">EN<span>•</span>joy</div>
          <div style="font-size:0.78em; font-weight:bold; letter-spacing:0.06em; opacity:0.85;">
            農家と町工場の「あったらいいな」が形になる場所
          </div>
        </div>
        <div class="pop-catch">✨ ${escapeHtml(d.catchphrase)}</div>
        <h2 class="pop-main-title">${escapeHtml(d.title)}</h2>
        <div class="pop-makers">🤝 作り手ペア：${escapeHtml(d.makers)}</div>
        <div class="pop-body-grid ${hasPhoto ? 'has-photo' : ''}">
          ${hasPhoto ? `<img class="pop-photo-frame" src="${d.photo}" alt="商品写真">` : ''}
          <div class="pop-story-card">
            <div style="font-size:0.82em; font-weight:800; letter-spacing:0.08em; margin-bottom:6px; opacity:0.85;">📖 誕生ストーリー・開発秘話</div>
            <p style="font-size:0.96em; line-height:1.75;">${escapeHtml(d.story)}</p>
          </div>
        </div>
        <div class="pop-footer-row">
          <div>
            <div style="font-size:0.76em; font-weight:bold; opacity:0.75; margin-bottom:4px;">店頭販売価格（税込）</div>
            <div class="pop-price-block">${priceText}<span style="font-size:0.42em; font-family:sans-serif; margin-left:4px;">${d.price > 0 ? '（税込）' : ''}</span></div>
          </div>
          <div class="pop-qr-box">
            <svg width="52" height="52" viewBox="0 0 40 40" aria-hidden="true">
              <rect width="40" height="40" fill="#ffffff"/>
              <rect x="2" y="2" width="12" height="12" fill="#231D19"/><rect x="4" y="4" width="8" height="8" fill="#ffffff"/><rect x="6" y="6" width="4" height="4" fill="#231D19"/>
              <rect x="26" y="2" width="12" height="12" fill="#231D19"/><rect x="28" y="4" width="8" height="8" fill="#ffffff"/><rect x="30" y="6" width="4" height="4" fill="#231D19"/>
              <rect x="2" y="26" width="12" height="12" fill="#231D19"/><rect x="4" y="28" width="8" height="8" fill="#ffffff"/><rect x="6" y="30" width="4" height="4" fill="#231D19"/>
              <rect x="17" y="5" width="4" height="4" fill="#4E6347"/><rect x="17" y="13" width="6" height="6" fill="#231D19"/><rect x="25" y="18" width="4" height="4" fill="#C85E2B"/>
              <rect x="18" y="24" width="5" height="5" fill="#231D19"/><rect x="27" y="26" width="4" height="9" fill="#231D19"/><rect x="33" y="24" width="5" height="5" fill="#4E6347"/>
            </svg>
            <div>
              <strong>開発日記・作り手を見る</strong><br>
              EN•joy 公式ストーリー棚<br>
              <span style="opacity:0.7;">#ENjoy #ご縁から生まれた</span>
            </div>
          </div>
        </div>
      </div>
      <div style="text-align:center; font-size:0.72em; opacity:0.65; margin-top:10px;">
        ✂️ この点線に沿ってA4印刷・カットすると、マルシェや京都古民家ショップの店頭スタンドにそのまま飾れます
      </div>
    </div>
  `;
}

function renderPopModalContent() {
  const d = activePopData;
  document.getElementById('doc-modal-content').innerHTML = `
    <div class="modal-toolbar no-print">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <strong style="font-size:0.95em;">🎨 A4 店頭「開発ストーリーPOP」プレビュー＆微調整</strong>
        <div style="display:flex; gap:8px;">
          <button type="button" class="btn-olive" onclick="window.print()">🖨️ A4印刷 / PDF保存</button>
          <button type="button" class="btn-outline" onclick="closeDocModal()">✕ 閉じる</button>
        </div>
      </div>
      <div class="pop-controls-grid">
        <div>
          <label style="font-size:0.74em; font-weight:bold; color:var(--text-muted); display:block; margin-bottom:4px;">キャッチコピー（リアルタイム反映）</label>
          <input type="text" class="form-input" style="padding:8px 11px; font-size:0.86em;" value="${escapeHtml(d.catchphrase)}" oninput="updatePopSetting('catchphrase', this.value)">
        </div>
        <div>
          <label style="font-size:0.74em; font-weight:bold; color:var(--text-muted); display:block; margin-bottom:4px;">販売価格（円）</label>
          <input type="number" class="form-input" style="padding:8px 11px; font-size:0.86em;" value="${d.price}" oninput="updatePopSetting('price', this.value)">
        </div>
        <div>
          <label style="font-size:0.74em; font-weight:bold; color:var(--text-muted); display:block; margin-bottom:4px;">POPデザイン切替</label>
          <div class="ui-switch">
            <button type="button" class="${d.theme === 'washi' ? 'active' : ''}" onclick="setPopTheme('washi')">和紙白</button>
            <button type="button" class="${d.theme === 'kyoto' ? 'active' : ''}" onclick="setPopTheme('kyoto')">京都ダーク</button>
          </div>
        </div>
      </div>
    </div>
    <div id="pop-sheet-live-target">${buildPopSheetInnerHtml()}</div>
  `;
}

/* A4・8枚面付け 持ち帰りストーリー名刺 */
function openStoryCardsFromProject(projId) {
  const projects = loadData(KEYS.PROJECTS, DEFAULT_PROJECTS);
  const proj = projects.find(p => p.id === projId);
  if (!proj) return;
  const pkg = getProjectStoryPackage(proj);
  openStoryCardsModal({
    title: pkg.title,
    makers: pkg.makers,
    story: pkg.story.slice(0, 95),
    footerNote: 'マルシェ限定コラボ・ご購入ありがとうございます！',
    theme: 'washi'
  });
}

function openStoryCardsFromMarche(itemId) {
  const items = loadData(KEYS.MARCHE, DEFAULT_MARCHE);
  const item = items.find(i => i.id === itemId);
  if (!item) return;
  openStoryCardsModal({
    title: item.title,
    makers: item.makers,
    story: (item.story || '').slice(0, 95),
    footerNote: 'EN•joy マルシェ・古民家セレクト棚でお買い上げ感謝！',
    theme: 'washi'
  });
}

function openStoryCardsModal(data) {
  activeStoryCardData = Object.assign({}, data);
  awardBadge('🪪 ストーリー名刺クリエイター');
  renderStoryCardsModalContent();
  document.getElementById('doc-modal').classList.add('open');
}

function updateStoryCardSetting(key, val) {
  if (!activeStoryCardData) return;
  activeStoryCardData[key] = val;
  const target = document.getElementById('story-cards-live-target');
  if (target) target.innerHTML = buildStoryCardsSheetHtml();
}

function setStoryCardTheme(theme) {
  if (!activeStoryCardData) return;
  activeStoryCardData.theme = theme;
  renderStoryCardsModalContent();
}

function buildStoryCardsSheetHtml() {
  const d = activeStoryCardData;
  const cells = Array.from({ length: 8 }, () => `
    <div class="story-card-cell">
      <div>
        <div class="sc-head">
          <div class="sc-brand">EN<span>•</span>joy</div>
          <span class="sc-badge">ご縁ストーリー</span>
        </div>
        <div class="sc-title">${escapeHtml(d.title)}</div>
        <div class="sc-makers">🤝 ${escapeHtml(d.makers)}</div>
        <div class="sc-story">${escapeHtml(d.story)}</div>
      </div>
      <div class="sc-foot">
        <span>${escapeHtml(d.footerNote)}</span>
        <strong style="white-space:nowrap;">#ENjoy</strong>
      </div>
    </div>
  `).join('');

  return `
    <div class="story-cards-sheet ${d.theme === 'kyoto' ? 'kyoto-dark' : ''}">
      <div class="story-cards-grid">${cells}</div>
      <div style="text-align:center; font-size:0.74em; color:#6B5E55; margin-top:10px;" class="no-print">
        ✂️ A4用紙1枚に8枚のストーリー名刺が面付けされます。点線に沿ってカットし、商品と一緒に袋へ入れて手渡してください！
      </div>
    </div>
  `;
}

function renderStoryCardsModalContent() {
  const d = activeStoryCardData;
  document.getElementById('doc-modal-content').innerHTML = `
    <div class="modal-toolbar no-print">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <strong style="font-size:0.95em;">🪪 A4・8枚面付け「持ち帰りストーリー名刺」印刷プレビュー</strong>
        <div style="display:flex; gap:8px;">
          <button type="button" class="btn-olive" onclick="window.print()">🖨️ A4で8枚まとめて印刷</button>
          <button type="button" class="btn-outline" onclick="closeDocModal()">✕ 閉じる</button>
        </div>
      </div>
      <div class="pop-controls-grid">
        <div>
          <label style="font-size:0.74em; font-weight:bold; color:var(--text-muted); display:block; margin-bottom:4px;">名刺に載せる一言ストーリー（リアルタイム反映）</label>
          <input type="text" class="form-input" style="padding:8px 11px; font-size:0.86em;" value="${escapeHtml(d.story)}" oninput="updateStoryCardSetting('story', this.value)">
        </div>
        <div>
          <label style="font-size:0.74em; font-weight:bold; color:var(--text-muted); display:block; margin-bottom:4px;">下部メッセージ</label>
          <input type="text" class="form-input" style="padding:8px 11px; font-size:0.86em;" value="${escapeHtml(d.footerNote)}" oninput="updateStoryCardSetting('footerNote', this.value)">
        </div>
        <div>
          <label style="font-size:0.74em; font-weight:bold; color:var(--text-muted); display:block; margin-bottom:4px;">名刺デザイン</label>
          <div class="ui-switch">
            <button type="button" class="${d.theme === 'washi' ? 'active' : ''}" onclick="setStoryCardTheme('washi')">和紙白</button>
            <button type="button" class="${d.theme === 'kyoto' ? 'active' : ''}" onclick="setStoryCardTheme('kyoto')">京都ダーク</button>
          </div>
        </div>
      </div>
    </div>
    <div id="story-cards-live-target">${buildStoryCardsSheetHtml()}</div>
  `;
}

function completeProjectToMarche(projId) {
  const projects = loadData(KEYS.PROJECTS, DEFAULT_PROJECTS);
  const proj = projects.find(p => p.id === projId);
  if (!proj || proj.completed) return;

  proj.completed = true;
  proj.todos.forEach(td => td.done = true);
  saveData(KEYS.PROJECTS, projects);

  const pkg = getProjectStoryPackage(proj);
  const marcheItems = loadData(KEYS.MARCHE, DEFAULT_MARCHE);
  marcheItems.unshift({
    id: Date.now(),
    title: pkg.title,
    makers: pkg.makers,
    price: pkg.price,
    story: pkg.story,
    photo: pkg.photo,
    cheers: 1
  });
  saveData(KEYS.MARCHE, marcheItems);

  awardBadge('🏅 地域の名産メーカー（商品化達成）');
  renderEverything();
  showToast(`🎉 商品完成（¥${pkg.price.toLocaleString()}）！マルシェと京都・古民家EC棚に並びました！`);
}

/* ENスタジオ右ペイン（✅ ToDo / 🧮 原価・山分け / 📋 合意・印刷 / 📸 日記） */
function renderEnRightPaneOnly() {
  const slot = document.getElementById('en-right-studio-slot');
  if (!slot) return;
  const projects = loadData(KEYS.PROJECTS, DEFAULT_PROJECTS);
  const proj = projects.find(p => p.id === selectedProjectId);
  if (!proj) return;

  const diaries = proj.diaries || [];
  const c = ensureProjectCalc(proj);
  let tabBodyHtml = '';

  if (currentStudioTab === 'todo') {
    tabBodyHtml = `
      <div class="section-kicker">AUTO TODO CHECKLIST</div>
      <h3 class="section-title" style="padding-right:0;">✅ 性格タイプ連動・自動ToDo</h3>
      <div class="todo-list-box">
        ${proj.todos.map((td, idx) => `
          <label class="todo-item ${td.done ? 'done' : ''}">
            <input type="checkbox" ${td.done ? 'checked' : ''} onchange="toggleProjectTodo(${proj.id}, ${idx})">
            <span>${escapeHtml(td.text)}</span>
          </label>
        `).join('')}
      </div>
      <div style="margin-top:16px; padding-top:14px; border-top:1px dashed var(--border-shoji);">
        <div class="section-kicker" style="color:var(--gold);">GRATITUDE STAMPS</div>
        <div style="font-size:0.82em; color:var(--text-muted); margin-bottom:6px;">パートナーへ感謝スタンプを贈る（累計3回で認定コンサル解放）</div>
        <div class="gratitude-grid">
          ${GRATITUDE_STAMPS.map((st, idx) => `<button type="button" class="gratitude-btn" onclick="sendGratitudeStamp(${idx})">${st}</button>`).join('')}
        </div>
      </div>
    `;
  } else if (currentStudioTab === 'calc') {
    const m = computeProfitMetrics(c);
    tabBodyHtml = `
      <div class="section-kicker" style="color:var(--terracotta);">PROFIT &amp; SHARE SIMULATOR</div>
      <h3 class="section-title" style="padding-right:0;">🧮 かんたん原価・売価・山分けシミュレーター</h3>
      <p style="font-size:0.8em; color:var(--text-muted); margin-bottom:12px;">
        ここで決めた販売価格は、そのまま<strong>「A4店頭POP」「簡易同意書PDF」「マルシェ登録」</strong>に自動反映されます！
      </p>

      <div class="calc-grid">
        <div>
          <label class="form-label">原材料費 / 1個（円）</label>
          <input type="number" min="0" class="form-input" value="${c.materialCost}" oninput="updateProjectCalc(${proj.id}, 'materialCost', this.value)">
        </div>
        <div>
          <label class="form-label">加工・製造費 / 1個（円）</label>
          <input type="number" min="0" class="form-input" value="${c.processCost}" oninput="updateProjectCalc(${proj.id}, 'processCost', this.value)">
        </div>
        <div>
          <label class="form-label">瓶・袋・ラベル代 / 1個（円）</label>
          <input type="number" min="0" class="form-input" value="${c.packCost}" oninput="updateProjectCalc(${proj.id}, 'packCost', this.value)">
        </div>
        <div>
          <label class="form-label">送料・試食など固定費計（円）</label>
          <input type="number" min="0" step="500" class="form-input" value="${c.fixedCost}" oninput="updateProjectCalc(${proj.id}, 'fixedCost', this.value)">
        </div>
        <div>
          <label class="form-label">予定販売個数（個）</label>
          <input type="number" min="1" class="form-input" value="${c.batchQty}" oninput="updateProjectCalc(${proj.id}, 'batchQty', this.value)">
        </div>
        <div>
          <label class="form-label" style="color:var(--terracotta);">店頭販売価格（税込・円）</label>
          <input type="number" min="0" step="10" class="form-input" style="border-color:var(--terracotta); font-weight:bold;" value="${c.sellPrice}" oninput="updateProjectCalc(${proj.id}, 'sellPrice', this.value)">
        </div>
      </div>

      <div class="form-group">
        <div style="display:flex; justify-content:space-between; font-size:0.82em; font-weight:bold; margin-bottom:5px;">
          <span>利益の山分け比率</span>
          <span id="calc-ratio-label-${proj.id}" style="color:var(--olive);">甲 ${m.ratioA}% ： 乙 ${m.ratioB}%</span>
        </div>
        <input type="range" min="10" max="90" step="5" value="${m.ratioA}" style="width:100%; accent-color:var(--olive);" oninput="updateProjectCalc(${proj.id}, 'shareRatioA', this.value)">
      </div>

      <div id="calc-result-live-${proj.id}">
        ${buildCalcResultHtml(proj)}
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <button type="button" class="btn-outline" onclick="shareCalcToChat(${proj.id})">💬 試算を相談室へ共有</button>
        <button type="button" class="btn-gold" onclick="openPopFromProject(${proj.id})">🎨 この売価でPOPを見る</button>
      </div>
    `;
  } else if (currentStudioTab === 'agree') {
    tabBodyHtml = `
      <div class="section-kicker" style="color:var(--terracotta);">AGREEMENT CARD &amp; LOCAL PRINT</div>
      <h3 class="section-title" style="padding-right:0;">📋 揉めない「お金・売り方・軽トラ」合意カード</h3>

      <div class="agreement-sub">① 企画・商品名 ＆ お互いの屋号（PDF・店頭POP・名刺に連動）</div>
      <div style="display:grid; grid-template-columns:1fr; gap:8px; margin-bottom:10px;">
        <input type="text" class="form-input" value="${escapeHtml(proj.title)}" placeholder="商品名・企画名" onchange="updateProjectField(${proj.id}, 'title', this.value, false)">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <input type="text" class="form-input" value="${escapeHtml(proj.partyA)}" placeholder="甲（自分）の屋号" onchange="updateProjectField(${proj.id}, 'partyA', this.value, false)">
          <input type="text" class="form-input" value="${escapeHtml(proj.partyB)}" placeholder="乙（相手）の屋号" onchange="updateProjectField(${proj.id}, 'partyB', this.value, false)">
        </div>
      </div>

      <div class="agreement-sub">② 試作費用の配分パターン</div>
      <div class="choice-pills">
        ${COST_OPTIONS.map((opt, idx) => `<button type="button" class="pill-option ${proj.costPlan === opt ? 'selected olive-sel' : ''}" onclick="updateProjectOption(${proj.id}, 'costPlan', ${idx})">${opt}</button>`).join('')}
      </div>

      <div class="agreement-sub">③ 売り方・販路</div>
      <div class="choice-pills">
        ${SALES_OPTIONS.map((opt, idx) => `<button type="button" class="pill-option ${proj.salesPlan === opt ? 'selected olive-sel' : ''}" onclick="updateProjectOption(${proj.id}, 'salesPlan', ${idx})">${opt}</button>`).join('')}
      </div>

      <div class="agreement-sub">④ 物流・配送方法</div>
      <div class="choice-pills">
        ${LOGISTICS_OPTIONS.map((opt, idx) => `<button type="button" class="pill-option ${proj.logisticsPlan === opt ? 'selected olive-sel' : ''}" onclick="updateProjectOption(${proj.id}, 'logisticsPlan', ${idx})">${opt}</button>`).join('')}
      </div>

      ${proj.logisticsPlan.includes('軽トラ') ? `
        <div style="margin:8px 0 10px 0; padding:10px 12px; background:var(--olive-light); border-radius:10px; font-size:0.83em;">
          🚚 軽トラ地域便が選択されています！<br>
          <button type="button" class="btn-outline" style="margin-top:6px;" onclick="postKeiTruckRequest(${proj.id})">📢 つぶやき広場に軽トラ募集をワンタップ投稿</button>
        </div>
      ` : ''}

      <div class="agreement-sub">⑤ 試作メモ（同意書＆店頭POP・名刺に連動）</div>
      <textarea onchange="updateProjectField(${proj.id}, 'memo', this.value, false)" style="min-height:62px;">${escapeHtml(proj.memo)}</textarea>

      <div style="display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:8px; margin-top:6px;">
        <button type="button" class="btn-ink" style="font-size:0.8em; padding:10px 8px;" onclick="openAgreementModal(${proj.id})">📄 同意書PDF</button>
        <button type="button" class="btn-gold" style="font-size:0.8em; padding:10px 8px;" onclick="openPopFromProject(${proj.id})">🎨 店頭POP</button>
        <button type="button" class="btn-olive" style="font-size:0.8em; padding:10px 8px;" onclick="openStoryCardsFromProject(${proj.id})">🪪 8枚名刺</button>
      </div>
      <div style="margin-top:10px;">
        ${proj.completed
          ? `<button type="button" class="btn-olive" style="width:100%;" onclick="switchMarcheSubtab('shop'); switchTab('marche');">🏮 京都・古民家EC棚で見る →</button>`
          : `<button type="button" class="btn-terracotta" style="width:100%;" onclick="completeProjectToMarche(${proj.id})">🎉 試作完成！マルシェ＆古民家EC棚へ登録</button>`
        }
      </div>
    `;
  } else {
    tabBodyHtml = `
      <div class="section-kicker">STORY DIARY &amp; AUTO MASKING</div>
      <h3 class="section-title" style="padding-right:0;">📸 試作「写メ日記」＆ 自動伏せ字</h3>
      <p style="font-size:0.8em; color:var(--text-muted); margin-bottom:10px;">
        ここで残した記録は「京都・古民家EC棚」「A4店頭POP」「8枚ストーリー名刺」へ自動反映されます！
      </p>
      <textarea id="diary-input-${proj.id}" style="min-height:72px;" placeholder="例：試作2回目！原価220円で香り最高。連絡先090-1234-5678で最終確認予定"></textarea>
      <div class="photo-picker-row">
        <label class="file-label">
          📷 試作写真を選ぶ
          <input type="file" id="diary-photo-file" accept="image/*" onchange="handlePhotoSelect(event, 'diary')">
        </label>
        <img id="diary-photo-preview" class="upload-preview" alt="プレビュー">
        <button type="button" id="diary-photo-clear" class="btn-outline" style="display:none;" onclick="clearPendingPhoto('diary')">✕</button>
        <label style="font-size:0.78em; font-weight:bold; color:var(--olive); display:flex; align-items:center; gap:5px; cursor:pointer;">
          <input type="checkbox" id="diary-mask-${proj.id}" checked> 🔒 原価・金額・電話を自動伏せ字
        </label>
      </div>
      <button type="button" class="btn-olive" style="width:100%;" onclick="addDiaryEntry(${proj.id})">写メ日記を記録する</button>

      ${diaries.map(d => `
        <div class="diary-entry">
          <span class="diary-badge">${escapeHtml(d.date)}${d.masked ? ' ｜ 🔒 安全マスキング済' : ''}</span>
          <p style="font-size:0.86em;">${escapeHtml(d.text)}</p>
          ${d.photo ? `<img class="tweet-photo" src="${d.photo}" alt="試作写真" style="margin-bottom:0;">` : ''}
        </div>
      `).join('')}
    `;
  }

  slot.innerHTML = `
    <div class="studio-subtabs">
      <button type="button" class="studio-tab-btn ${currentStudioTab === 'todo' ? 'active' : ''}" onclick="switchStudioSubtab('todo')">✅ ToDo</button>
      <button type="button" class="studio-tab-btn ${currentStudioTab === 'calc' ? 'active' : ''}" onclick="switchStudioSubtab('calc')">🧮 原価・山分け</button>
      <button type="button" class="studio-tab-btn ${currentStudioTab === 'agree' ? 'active' : ''}" onclick="switchStudioSubtab('agree')">📋 合意・印刷</button>
      <button type="button" class="studio-tab-btn ${currentStudioTab === 'diary' ? 'active' : ''}" onclick="switchStudioSubtab('diary')">📸 日記 (${diaries.length})</button>
    </div>
    ${tabBodyHtml}
  `;
}

function renderEnSection(scrollChatToBottom) {
  const projects = loadData(KEYS.PROJECTS, DEFAULT_PROJECTS);
  const activeCount = projects.filter(p => !p.completed).length;
  const badgeLabel = activeCount > 0 ? activeCount : '✓';
  document.querySelectorAll('.en-badge-count-sync').forEach(el => { el.textContent = badgeLabel; });

  if (!selectedProjectId || !projects.some(p => p.id === selectedProjectId)) {
    selectedProjectId = projects[0] ? projects[0].id : null;
  }

  renderHomeProjectBoard(projects);

  const tabsEl = document.getElementById('en-project-tabs');
  if (tabsEl) {
    tabsEl.innerHTML = projects.map(p => `
      <button type="button" class="proj-tab-btn ${p.id === selectedProjectId ? 'active' : ''}" onclick="selectProject(${p.id})">
        ${p.completed ? '🎉 ' : '🤝 '}${escapeHtml(p.title.slice(0, 18))}${p.title.length > 18 ? '…' : ''}
      </button>
    `).join('');
  }

  const proj = projects.find(p => p.id === selectedProjectId);
  const detailEl = document.getElementById('en-active-project-detail');
  if (!detailEl) return;
  if (!proj) {
    detailEl.innerHTML = `<section class="card"><p>つぶやき広場や仲間さがし図鑑で「🤝 ご縁を繋ぐ」を押すとコラボ案件が始まります！</p></section>`;
    return;
  }

  const doneCount = proj.todos.filter(t => t.done).length;
  const pct = Math.round((doneCount / proj.todos.length) * 100);
  const messages = proj.messages || [
    { id: 9001, sender: 'partner', name: proj.partyB || 'パートナー', text: 'よろしくお願いします！まずはサンプル量やスケジュールを気軽に話しましょう🤝', time: '09:00' }
  ];

  detailEl.innerHTML = `
    <section class="card terracotta-accent" style="margin-bottom:20px; padding:18px 22px;">
      <div class="stamp-badge ${proj.completed ? 'gold' : 'terracotta'}">
        ${proj.completed ? '完成<br>済' : `相性<br>${proj.compatibility}%`}
      </div>
      <div class="section-kicker" style="color:var(--terracotta);">ACTIVE COLLABORATION STUDIO</div>
      <h2 class="section-title" style="margin-bottom:4px;">${escapeHtml(proj.title)}</h2>
      <p style="font-size:0.85em; color:var(--text-muted);">
        ペア：<strong>${escapeHtml(proj.partnerName)}</strong> ｜ ToDo進捗：<strong id="en-todo-progress-text">${doneCount}/${proj.todos.length}（${pct}%）</strong>
      </p>
    </section>

    <div class="en-workspace-grid">
      <section class="card">
        <div class="chat-header-row">
          <div>
            <div class="section-kicker">REALTIME CONSULTATION</div>
            <h3 class="section-title" style="margin-bottom:0; padding-right:0;">💬 パートナー相談ルーム</h3>
          </div>
          <div class="sender-toggle" title="1人テスト用に自分・相手の視点を切り替えられます">
            <button type="button" class="${chatSenderRole === 'me' ? 'active' : ''}" onclick="setChatSenderRole('me')">自分として送信</button>
            <button type="button" class="${chatSenderRole === 'partner' ? 'active partner-mode' : ''}" onclick="setChatSenderRole('partner')">相手デモ返信</button>
          </div>
        </div>

        <div id="chat-scroll-${proj.id}" class="chat-thread">
          ${messages.map(m => `
            <div class="chat-row ${m.sender === 'me' ? 'me' : 'partner'}">
              <div class="chat-sender-name">${escapeHtml(m.name)}</div>
              <div class="chat-bubble">${escapeHtml(m.text)}</div>
              <div class="chat-meta-line">
                <span>${escapeHtml(m.time)}</span>
                <button type="button" class="chat-to-diary-btn" onclick="promoteChatToDiary(${proj.id}, ${m.id})">📸 日記へ転記</button>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="template-chips" style="margin-bottom:8px;">
          ${CHAT_QUICK_CHIPS.map((c, idx) => `<button type="button" class="chip-btn" onclick="sendQuickChat(${proj.id}, ${idx})">${c}</button>`).join('')}
        </div>

        <div class="chat-input-bar">
          <input type="text" id="chat-input-${proj.id}" class="form-input" placeholder="${chatSenderRole === 'me' ? 'メッセージを入力してEnter送信…' : '【相手デモ返信】パートナー目線で入力…'}" onkeydown="onChatKeyDown(event, ${proj.id})">
          <button type="button" class="${chatSenderRole === 'me' ? 'btn-olive' : 'btn-terracotta'}" style="flex-shrink:0;" onclick="sendChatInput(${proj.id})">送信</button>
        </div>
      </section>

      <section id="en-right-studio-slot" class="card terracotta-accent"></section>
    </div>
  `;

  renderEnRightPaneOnly();

  if (scrollChatToBottom) {
    const sc = document.getElementById('chat-scroll-' + proj.id);
    if (sc) sc.scrollTop = sc.scrollHeight;
  }
}

/* ==========================================
   ④ マルシェ ／ 京都古民家EC棚 ／ 神道具50:50（ホーム連動含む）
   ========================================== */
function buildMarcheMeterHtml(count) {
  const target = 10, remain = Math.max(0, target - count);
  const segments = Array.from({ length: target }, (_, i) =>
    `<div class="seg-bar ${i < count ? (count >= target ? 'filled gold' : 'filled') : ''}"></div>`
  ).join('');
  const statusMsg = count >= target
    ? '🎊 10商品達成！第1回 EN•joy 誕生コラボマルシェ開催決定！'
    : (count >= 3 ? `✨ ポップアップ試食会 開催圏内！単独まであと ${remain} 商品` : `単独マルシェ開催まであと ${remain} 商品！`);
  return `
    <div class="progress-header">
      <span>開発進捗：<strong>${String(count).padStart(2, '0')} / ${target} 商品</strong></span>
      <span style="color:var(--terracotta); font-size:0.86em;">${statusMsg}</span>
    </div>
    <div class="segment-grid">${segments}</div>
    <small style="color:var(--text-muted); font-size:0.74em;">※3〜5商品でポップアップ試食会、10商品で第1回単独マルシェ（ペア出店料無料）を開催！</small>
  `;
}

function buildMarcheProductCardHtml(item) {
  return `
    <div class="product-item">
      <div>
        <div style="font-size:0.78em; font-weight:bold; color:var(--olive); margin-bottom:4px;">🤝 ${escapeHtml(item.makers)}</div>
        <div style="font-size:1.04em; font-weight:bold; margin-bottom:6px;">${escapeHtml(item.title)}</div>
        ${item.photo ? `<img class="tweet-photo" src="${item.photo}" alt="商品写真" style="max-height:180px;">` : ''}
        <p style="font-size:0.85em; color:var(--text-muted); margin-bottom:12px;">${escapeHtml(item.story)}</p>
      </div>
      <div class="action-row">
        <button type="button" class="help-btn" onclick="cheerProduct(${item.id}, this)"><span>🧡 応援 <strong>${item.cheers}</strong></span></button>
        <button type="button" class="btn-outline" onclick="openPopFromMarche(${item.id})">🖨️ 店頭POP</button>
        <button type="button" class="btn-outline" onclick="openStoryCardsFromMarche(${item.id})">🪪 8枚名刺</button>
        <button type="button" class="btn-outline" onclick="shareProductSns(${item.id})">📣 告知</button>
      </div>
    </div>
  `;
}

function buildToolCardHtml(tl) {
  const nextIsUser = ((tl.clicks + 1) % 2 === 1);
  return `
    <div class="tool-item">
      <div>
        <span class="aff-badge ${nextIsUser ? 'user-turn' : 'admin-turn'}">${nextIsUser ? '次回：👤 投稿者リンク（奇数回）' : '次回：🎪 運営軍資金リンク（偶数回）'}</span>
        <div style="font-size:1.02em; font-weight:bold; margin-bottom:4px;">${escapeHtml(tl.name)}</div>
        <div style="font-size:0.79em; color:var(--text-muted); margin-bottom:6px;">紹介者：${escapeHtml(tl.author)} ｜ 累計クリック：${tl.clicks}回</div>
        <p style="font-size:0.85em; margin-bottom:12px;">${escapeHtml(tl.comment)}</p>
      </div>
      <button type="button" class="btn-outline" onclick="clickAffiliateTool(${tl.id})">🔗 リンクテスト（50:50交互切替）</button>
    </div>
  `;
}

function cheerProduct(itemId, btnEl) {
  const items = loadData(KEYS.MARCHE, DEFAULT_MARCHE);
  const target = items.find(i => i.id === itemId);
  if (!target) return;
  target.cheers += 1;
  saveData(KEYS.MARCHE, items);
  btnEl.classList.remove('pop');
  void btnEl.offsetWidth;
  btnEl.classList.add('pop');
  setTimeout(() => renderMarcheSection(), 240);
}

function addToTestCart(itemId) {
  const items = loadData(KEYS.MARCHE, DEFAULT_MARCHE);
  const target = items.find(i => i.id === itemId);
  if (!target) return;
  const cart = loadData(KEYS.CART, []);
  cart.push({ title: target.title, price: target.price || 880 });
  saveData(KEYS.CART, cart);
  renderMarcheSection();
  showToast(`🛍️ 「${target.title}」を古民家ECかごに追加しました！`);
}

function checkoutTestCart() {
  const cart = loadData(KEYS.CART, []);
  if (cart.length === 0) { showToast('🛍️ 先に棚の商品から「かごに入れる」を押してみてください！'); return; }
  const total = cart.reduce((sum, c) => sum + c.price, 0);
  saveData(KEYS.CART, []);
  renderMarcheSection();
  showToast(`✨ テスト注文完了（${cart.length}点・¥${total.toLocaleString()}）！生産者から産地直送されます📦`);
}

function shareProductSns(itemId) {
  const items = loadData(KEYS.MARCHE, DEFAULT_MARCHE);
  const target = items.find(i => i.id === itemId);
  if (!target) return;
  const post = `【ご縁から生まれた新商品🍎】\n${target.title}\n（${target.makers}）\n\n「${target.story}」\n\n農家と町工場の『あったらいいな』を形にする場所「EN•joy」から誕生！\n#ENjoy #農家と町工場 #コラボ商品`;
  copyTextSafely(post, '📣 SNS告知文をコピーしました！（裏ロジック非公開フォーマット）');
}

function copyBuildInPublicPost() {
  const items = loadData(KEYS.MARCHE, DEFAULT_MARCHE);
  const post = `【100日後に農家と町工場が楽しく新商品を作れるサイトを完成させる素人エンジニア】\n\nホームに全目次＆商品企画の推進ゲージを搭載し、PCのつぶやき広場は「右で常につぶやき＆神道具」の3列レイアウト、スマホはスクロール途中ポップアップ投稿に進化させました！\n詳しい仕掛けはまだ秘密ですが、みんなが笑顔で得する仕組みを仕込み中( ͡° ͜ʖ ͡°)\n\n現在の試作モデル：${items.length}/10商品\n#100日後に完成させる素人エンジニア #個人開発 #一次産業`;
  copyTextSafely(post, '📣 「100日後エンジニア」SNS投稿文をコピーしました！');
}

function clickAffiliateTool(toolId) {
  const tools = loadData(KEYS.TOOLS, DEFAULT_TOOLS);
  const tool = tools.find(t => t.id === toolId);
  if (!tool) return;
  tool.clicks += 1;
  const isUserTurn = (tool.clicks % 2 === 1);
  saveData(KEYS.TOOLS, tools);
  if (!isUserTurn) {
    const fund = loadData(KEYS.FUND, 12400) + 150;
    saveData(KEYS.FUND, fund);
    showToast('🎪 【偶数回目：運営URL起動】マルシェ軍資金が +¥150 貯まりました！');
  } else {
    showToast(`👤 【奇数回目：投稿者URL起動】${tool.author}さんの収益リンクが選ばれました！`);
  }
  renderMarcheSection();
  renderHomeIndex();
  renderTweetAsideExtras();
}

function addRecommendedTool() {
  const name = document.getElementById('tool-name-input').value.trim();
  const comment = document.getElementById('tool-comment-input').value.trim();
  const url = document.getElementById('tool-url-input').value.trim();
  if (!name) { showToast('⚠️ 道具名を入力してください'); return; }
  const p = getProfile();
  const tools = loadData(KEYS.TOOLS, DEFAULT_TOOLS);
  tools.unshift({
    id: Date.now(), name: name, author: p.name || 'あなた（テスト投稿）',
    comment: comment || '現場で大活躍中のおすすめ道具です！',
    userUrl: url || 'https://hb.afl.rakuten.co.jp/your-affiliate-link', adminUrl: 'https://hb.afl.rakuten.co.jp/enjoy-marche-fund', clicks: 0
  });
  saveData(KEYS.TOOLS, tools);
  document.getElementById('tool-name-input').value = '';
  document.getElementById('tool-comment-input').value = '';
  document.getElementById('tool-url-input').value = '';
  awardBadge('🛠️ 現場の目利きサポーター');
  renderMarcheSection();
  renderTweetAsideExtras();
  showToast('🛠️ おすすめ道具を登録しました！50:50交互表示が有効です');
}

function renderMarcheSection() {
  const items = loadData(KEYS.MARCHE, DEFAULT_MARCHE);
  const meterHtml = buildMarcheMeterHtml(items.length);
  const homeMeter = document.getElementById('home-marche-meter');
  const tabMeter = document.getElementById('marche-tab-meter');
  if (homeMeter) homeMeter.innerHTML = meterHtml;
  if (tabMeter) tabMeter.innerHTML = meterHtml;

  const homeMarchePreview = document.getElementById('home-marche-preview');
  if (homeMarchePreview) {
    homeMarchePreview.innerHTML = items.slice(0, 2).map(buildMarcheProductCardHtml).join('');
  }

  const prodList = document.getElementById('marche-product-list');
  if (prodList) {
    prodList.innerHTML = items.map(buildMarcheProductCardHtml).join('');
  }

  const cart = loadData(KEYS.CART, []);
  const cartTotal = cart.reduce((sum, c) => sum + c.price, 0);
  const cartCountEl = document.getElementById('ec-cart-count');
  if (cartCountEl) cartCountEl.textContent = `${cart.length} 点（¥${cartTotal.toLocaleString()}）`;

  const ecShelf = document.getElementById('ec-shelf-list');
  if (ecShelf) {
    ecShelf.innerHTML = items.map(item => `
      <article class="ec-shelf-card">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap;">
            <span style="font-size:0.75em; font-weight:bold; color:var(--olive); background:var(--olive-light); padding:3px 9px; border-radius:12px;">📦 産地直送</span>
            <span class="ec-price">¥${(item.price || 880).toLocaleString()}</span>
          </div>
          <h3 style="font-size:1.08em; margin-bottom:4px;">${escapeHtml(item.title)}</h3>
          <div style="font-size:0.79em; color:var(--text-muted); margin-bottom:8px;">作り手：${escapeHtml(item.makers)}</div>
          ${item.photo ? `<img class="tweet-photo" src="${item.photo}" alt="商品写真" style="max-height:190px;">` : ''}
          <div class="ec-story-box"><strong>📖 開発秘話ストーリー：</strong><br>${escapeHtml(item.story)}</div>
        </div>
        <div class="action-row">
          <button type="button" class="btn-olive" style="flex:1;" onclick="addToTestCart(${item.id})">🛍️ かごに入れる</button>
          <button type="button" class="btn-outline" onclick="openPopFromMarche(${item.id})">🖨️ POP</button>
          <button type="button" class="btn-outline" onclick="openStoryCardsFromMarche(${item.id})">🪪 名刺</button>
          <button type="button" class="btn-outline" onclick="shareProductSns(${item.id})">📣</button>
        </div>
      </article>
    `).join('');
  }

  const fund = loadData(KEYS.FUND, 12400);
  const fundPct = Math.min(100, Math.round((fund / 30000) * 100));
  const fundEl = document.getElementById('marche-fund-display');
  if (fundEl) fundEl.textContent = `¥${fund.toLocaleString()} / 目標 ¥30,000`;

  const tools = loadData(KEYS.TOOLS, DEFAULT_TOOLS);
  const toolList = document.getElementById('tool-list');
  if (toolList) {
    toolList.innerHTML = tools.map(buildToolCardHtml).join('');
  }

  const homeToolsSlot = document.getElementById('home-tools-slot');
  if (homeToolsSlot) {
    homeToolsSlot.innerHTML = `
      <div class="home-fund-strip">
        <div style="flex:1; min-width:200px;">
          <div style="font-size:0.76em; font-weight:bold; color:var(--text-muted);">🎪 50:50シェア蓄積マルシェ軍資金（進捗 ${fundPct}%）</div>
          <div style="font-family:'Georgia',serif; font-size:1.3em; font-weight:800; color:var(--terracotta);">¥${fund.toLocaleString()} <span style="font-size:0.65em; color:var(--text-muted); font-family:sans-serif;">/ 目標 ¥30,000</span></div>
        </div>
        <div class="proj-gauge-track" style="min-width:160px; max-width:260px;">
          <div class="proj-gauge-fill" style="width:${fundPct}%;"></div>
        </div>
      </div>
      <div class="product-grid">
        ${tools.slice(0, 2).map(buildToolCardHtml).join('')}
      </div>
    `;
  }
}

function resetDemoData() {
  if (!confirm('テスト投稿・コラボ案件・軍資金などのローカルデータを初期状態に戻しますか？')) return;
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  location.reload();
}