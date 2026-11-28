/* =========================================================
   EN•joy おすすめ人材 統合検索＆絞り込み × 日本地図（職種ふたマップ）
   （patch_japan_map.js v4）
   ・マップ起動を完全安定化（patch_views依存を断ち単独で安全描画）
   ・IME途切れゼロ検索（入力中にフォームを破壊しない結果スロット部分更新）
   ・統合「絞り込みシート」（半径ゲージ / 47都道府県 / 6職種 / 得意なことタグ）
   ・リスト・マップ・スワイプの全3ビューで検索＆地域条件を完全連動
   ・国土地理院タイル（APIキー完全不要）＋ mapOpen:false 地図非掲載保護
   ========================================================= */

(function () {
  const MAP_CFG_KEY = 'en_joy_map_radius_v1';
  const FUTA_DEX_KEY = 'en_joy_futa_discovered_v1';
  const RADIUS_STEPS = [5, 10, 20, 30, 50, 100, 200, 300, 500, 0];
  let jpMapHookInstalled = false;

  const ROLE_META = {
    farm:    { label: '一次産業・農家',   color: '#16a34a', svg: `<path d="M12 21V9"/><path d="M12 9c-3 0-5.5-2-6-5 3-.5 5.5 1.5 6 5z"/><path d="M12 13c3 0 5.5-2 6-5-3-.5-5.5 1.5-6 5z"/>` },
    factory: { label: '加工・工房・蔵元', color: '#ea580c', svg: `<path d="M3 21V10l6 4V10l6 4V6h6v15H3z"/><path d="M7 17h2M11 17h2M15 17h2"/>` },
    design:  { label: 'デザイン・印刷',   color: '#9333ea', svg: `<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="11" cy="11" r="2"/>` },
    truck:   { label: '物流・冷蔵便',     color: '#2563eb', svg: `<path d="M1 4h13v12H1zM14 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>` },
    shop:    { label: '販売・マルシェ',   color: '#db2777', svg: `<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v8h14v-8"/>` },
    craft:   { label: '木工・工芸・特技', color: '#b45309', svg: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>` }
  };

  // 文字を打たずに1タップで絞れる「得意なこと・条件」クイックタグ
  const SKILL_TAGS = [
    { id: 'small_lot', label: '小ロット試作',     re: /小ロット|10kg|20瓶|30kg|50本|50枚|試作/ },
    { id: 'rescue',    label: '規格外・訳ありOK', re: /規格外|訳あり|B品|間伐材|端材/ },
    { id: 'process',   label: '乾燥・加工・発酵', re: /乾燥|加工|発酵|粉末|OEM|キッチン|ピューレ/ },
    { id: 'cold',      label: '冷凍・冷蔵配送',   re: /冷凍|冷蔵|クール|予冷/ },
    { id: 'design',    label: 'パッケージ・印刷', re: /パッケージ|ラベル|印刷|シール|撮影|箱|クラフト/ },
    { id: 'marche',    label: 'マルシェ・店頭',   re: /マルシェ|店頭|カフェ|試食|棚/ }
  ];

  const AREA_COORDS = {
    '北海道': [43.064, 141.347], '札幌': [43.064, 141.347], '帯広': [42.924, 143.196], '旭川': [43.771, 142.365],
    '青森県': [40.824, 140.740], '岩手県': [39.704, 141.153], '宮城県': [38.268, 140.872], '仙台': [38.268, 140.872],
    '秋田県': [39.719, 140.102], '山形県': [38.240, 140.363], '福島県': [37.750, 140.468],
    '茨城県': [36.342, 140.447], '栃木県': [36.566, 139.884], '群馬県': [36.391, 139.060],
    '埼玉県': [35.857, 139.649], '千葉県': [35.605, 140.123], '東京都': [35.689, 139.692],
    '渋谷': [35.658, 139.701], '世田谷': [35.646, 139.653], '神奈川県': [35.448, 139.643], '横浜': [35.444, 139.638],
    '新潟県': [37.902, 139.023], '富山県': [36.695, 137.211], '石川県': [36.594, 136.626], '金沢': [36.561, 136.656],
    '福井県': [36.065, 136.222], '山梨県': [35.664, 138.568], '長野県': [36.651, 138.181], '松本': [36.238, 137.972],
    '岐阜県': [35.391, 136.722], '静岡県': [34.977, 138.383], '愛知県': [35.180, 136.907], '名古屋': [35.181, 136.906],
    '三重県': [34.730, 136.509], '滋賀県': [35.004, 135.869], '京都府': [35.021, 135.756], '京都': [35.012, 135.768], '宇治': [34.884, 135.800],
    '大阪府': [34.686, 135.520], '大阪': [34.694, 135.502], '枚方': [34.814, 135.650], '寝屋川': [34.766, 135.628],
    '東大阪': [34.679, 135.601], '高槻': [34.848, 135.617], '交野': [34.788, 135.680], '岸和田': [34.460, 135.371], '茨木': [34.816, 135.568],
    '兵庫県': [34.691, 135.183], '神戸': [34.690, 135.196], '奈良県': [34.685, 135.833], '和歌山県': [34.226, 135.168],
    '鳥取県': [35.504, 134.238], '島根県': [35.472, 133.051], '岡山県': [34.662, 133.935],
    '広島県': [34.397, 132.460], '尾道': [34.409, 133.205], '山口県': [34.186, 131.471],
    '徳島県': [34.066, 134.559], '香川県': [34.340, 134.043], '愛媛県': [33.842, 132.766], '松山': [33.839, 132.766], '高知県': [33.560, 133.531],
    '福岡県': [33.606, 130.418], '福岡': [33.590, 130.402], '糸島': [33.556, 130.196], '佐賀県': [33.249, 130.299],
    '長崎県': [32.745, 129.874], '熊本県': [32.790, 130.742], '大分県': [33.238, 131.613],
    '宮崎県': [31.911, 131.424], '鹿児島県': [31.560, 130.558], '沖縄県': [26.212, 127.681], '那覇': [26.212, 127.679]
  };

  const PREF_LIST = Object.keys(AREA_COORDS).filter(k => /[都府県]$|^北海道$/.test(k));

  const CITY_TO_PREF = {
    '枚方': '大阪府', '寝屋川': '大阪府', '東大阪': '大阪府', '高槻': '大阪府', '交野': '大阪府', '岸和田': '大阪府', '大阪': '大阪府', '茨木': '大阪府',
    '京都': '京都府', '宇治': '京都府', '神戸': '兵庫県', '帯広': '北海道', '札幌': '北海道', '仙台': '宮城県',
    '渋谷': '東京都', '世田谷': '東京都', '横浜': '神奈川県', '金沢': '石川県', '松本': '長野県', '尾道': '広島県', '糸島': '福岡県', '那覇': '沖縄県'
  };

  function resolveLatLng(areaText) {
    const raw = String(areaText || '');
    const keys = Object.keys(AREA_COORDS).sort((a, b) => b.length - a.length);
    for (const k of keys) if (raw.includes(k)) return AREA_COORDS[k];
    return [34.766, 135.628];
  }

  function detectPref(areaText) {
    const raw = String(areaText || '');
    const hit = PREF_LIST.find(p => raw.includes(p));
    if (hit) return hit;
    for (const [city, pref] of Object.entries(CITY_TO_PREF)) {
      if (raw.includes(city)) return pref;
    }
    return '';
  }

  function calcDistanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371, toRad = d => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // 統合フィルタ状態（リスト・マップ・スワイプ全共通）
  const mapCfg = (function loadMapCfg() {
    try {
      const s = JSON.parse(localStorage.getItem(MAP_CFG_KEY) || 'null');
      if (s && typeof s.stepIdx === 'number') {
        if (!Array.isArray(s.skillTags)) s.skillTags = [];
        if (!s.areaMode) s.areaMode = 'radius'; // 'radius' | 'pref'
        if (typeof s.prefFilter !== 'string') s.prefFilter = '';
        return s;
      }
    } catch (e) {}
    return {
      stepIdx: 9,              // 9 -> 0km(全国)
      baseLat: 34.766,
      baseLng: 135.628,
      baseLabel: '大阪府 寝屋川市',
      areaMode: 'radius',      // 'radius' | 'pref'
      prefFilter: '',
      catFilter: 'all',
      skillTags: []
    };
  })();

  function saveMapCfg() {
    try { localStorage.setItem(MAP_CFG_KEY, JSON.stringify(mapCfg)); } catch (e) {}
  }

  const discoveredSet = (function loadDex() {
    try {
      const arr = JSON.parse(localStorage.getItem(FUTA_DEX_KEY) || '[]');
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) { return new Set(); }
  })();

  function markDiscovered(personId) {
    if (!personId || discoveredSet.has(personId)) return false;
    discoveredSet.add(personId);
    try { localStorage.setItem(FUTA_DEX_KEY, JSON.stringify(Array.from(discoveredSet))); } catch (e) {}
    return true;
  }

  function getCurrentRadiusKm() {
    return RADIUS_STEPS[Math.max(0, Math.min(RADIUS_STEPS.length - 1, mapCfg.stepIdx))];
  }

  function formatRadiusLabel(km) {
    return km === 0 ? '全国すべて' : `半径 ${km}km 以内`;
  }

  function syncBaseFromAreaSettings() {
    try {
      const areaSaved = JSON.parse(localStorage.getItem('en_joy_area_scope_v1') || 'null');
      if (areaSaved && areaSaved.pref && !mapCfg.gpsLocked) {
        const lbl = `${areaSaved.pref}${areaSaved.city ? ' ' + areaSaved.city : ''}`;
        const [lat, lng] = resolveLatLng(lbl);
        mapCfg.baseLat = lat; mapCfg.baseLng = lng; mapCfg.baseLabel = lbl;
      }
    } catch (e) {}
  }

  function normalizePeopleCoords() {
    if (typeof EN_MOCK_PEOPLE === 'undefined' || !Array.isArray(EN_MOCK_PEOPLE)) return;
    const existingCoords = {
      'usr-001': [34.814, 135.650], 'usr-002': [34.679, 135.601],
      'usr-003': [34.686, 135.512], 'usr-004': [34.766, 135.628],
      'usr-jp-01': [36.238, 137.972], 'usr-jp-02': [35.658, 139.701], 'usr-jp-03': [33.556, 130.196]
    };
    EN_MOCK_PEOPLE.forEach(p => {
      if (!p.latLng) p.latLng = existingCoords[p.id] || resolveLatLng(p.area);
      if (!p.mapPos) p.mapPos = { x: 50, y: 50 };
    });
  }

  function ensureNationwideCraftPeople() {
    if (typeof EN_MOCK_PEOPLE === 'undefined' || !Array.isArray(EN_MOCK_PEOPLE)) return;
    const extraNationwide = [
      { id: 'usr-futa-hokkaido', name: '佐々木 拓真', shop: '十勝ひまわり牧場', category: 'farm', categoryLabel: '一次産業・酪農', area: '北海道 帯広市', latLng: [42.924, 143.196], mapPos: { x: 82, y: 14 }, avatar: EN_IMAGES.userFarm, canDo: '放牧グラスフェッド牛乳・ホエイの冷凍小ロット供給（全国クール発送OK）', aiMatch: '濃厚乳製品×焼き菓子・ジェラートコラボで差別化抜群！', detail: { equipment: '殺菌タンク・急速冷凍・全国冷凍便契約', pastLabs: 4, replySpeed: '朝と夜に返信' }, mapOpen: true },
      { id: 'usr-futa-sendai', name: '伊藤 優子', shop: 'みちのく発酵蔵', category: 'factory', categoryLabel: '加工・発酵蔵元', area: '宮城県 仙台市', latLng: [38.268, 140.872], mapPos: { x: 76, y: 34 }, avatar: EN_IMAGES.userFact, canDo: '米麹・甘酒・発酵シロップのOEM小ロット50本〜試作', aiMatch: '無添加×発酵トレンドで全国のフルーツ農家と相性◎', detail: { equipment: '麹室・低温発酵タンク・瓶詰殺菌ライン', pastLabs: 8, replySpeed: '平日昼間に返信' }, mapOpen: true },
      { id: 'usr-futa-kanazawa', name: '前田 匠', shop: '加賀ウッドクラフト', category: 'craft', categoryLabel: '木工・什器職人', area: '石川県 金沢市', latLng: [36.561, 136.656], mapPos: { x: 56, y: 46 }, avatar: EN_IMAGES.userDes, canDo: '県産間伐材で作る折りたたみマルシェ棚・木製ギフト箱の小ロット制作', aiMatch: 'マルシェ出店時の見栄えとブランド感を一気に格上げ！', detail: { equipment: 'レーザー刻印機・NCルーター・全国発送対応', pastLabs: 6, replySpeed: '24時間以内に返信' }, mapOpen: true },
      { id: 'usr-futa-kyoto', name: '藤本 凛', shop: '古民家カフェ en.茶寮', category: 'shop', categoryLabel: '販売・古民家カフェ', area: '京都府 宇治市', latLng: [34.884, 135.800], mapPos: { x: 52, y: 58 }, avatar: EN_IMAGES.userBuyer, canDo: '週末マルシェ会場・店頭テスト販売棚・試食モニター会の共催', aiMatch: 'できたて試作品をリアルなお客様に届けて生の声を集められます！', detail: { equipment: '古民家イベント土間・冷蔵ショーケース・試食キッチン', pastLabs: 10, replySpeed: '水〜日に即レス' }, mapOpen: true },
      { id: 'usr-futa-onomichi', name: '村上 海斗', shop: 'せとうち柑橘ラボ', category: 'farm', categoryLabel: '一次産業・柑橘農家', area: '広島県 尾道市', latLng: [34.409, 133.205], mapPos: { x: 38, y: 64 }, avatar: EN_IMAGES.userFarm, canDo: '減農薬レモン・ネーブルの規格外果実＆皮ごとペースト提供', aiMatch: '香り高い瀬戸内レモンで全国のスイーツ・ドリンク企画に引っ張りだこ！', detail: { equipment: '選果場・冷凍ストッカー・クール便対応', pastLabs: 7, replySpeed: '夕方以降に返信' }, mapOpen: true },
      { id: 'usr-futa-naha', name: '比嘉 美穂', shop: 'やんばるボタニカル印刷', category: 'design', categoryLabel: 'デザイン・和紙印刷', area: '沖縄県 那覇市', latLng: [26.212, 127.679], mapPos: { x: 16, y: 88 }, avatar: EN_IMAGES.userDes, canDo: '南国テイスト＆手描きイラストの耐水シール50枚〜全国郵送', aiMatch: '目を引くギフト向けパッケージデザインが得意です！', detail: { equipment: '小ロットオンデマンド印刷・耐水ラミネート', pastLabs: 5, replySpeed: '平日夕方に返信' }, mapOpen: true }
    ];
    extraNationwide.forEach(p => { if (!EN_MOCK_PEOPLE.some(x => x.id === p.id)) EN_MOCK_PEOPLE.push(p); });
    normalizePeopleCoords();
  }

  // =========================================================
  // 🔍 共通フィルタエンジン（キーワード + 職種 + 得意タグ + 半径/都道府県）
  // =========================================================
  function getAllPeopleEnriched() {
    normalizePeopleCoords();
    return EN_MOCK_PEOPLE.map(p => {
      const [lat, lng] = p.latLng || resolveLatLng(p.area);
      const distKm = Math.round(calcDistanceKm(mapCfg.baseLat, mapCfg.baseLng, lat, lng));
      const pref = detectPref(p.area);
      const searchBlob = `${p.name} ${p.shop} ${p.area} ${pref} ${p.categoryLabel} ${p.canDo} ${p.detail?.equipment || ''}`.toLowerCase();
      return { ...p, lat, lng, distKm, pref, searchBlob };
    });
  }

  function matchesCommonFilters(p, ignoreDistance) {
    // 1) キーワード（スペース区切りAND検索）
    const q = (enViewState.peopleQuery || '').trim().toLowerCase();
    if (q) {
      const words = q.split(/[\s ]+/).filter(Boolean);
      if (!words.every(w => p.searchBlob.includes(w))) return false;
    }
    // 2) 職種
    if (mapCfg.catFilter !== 'all' && p.category !== mapCfg.catFilter) return false;
    // 3) 得意なことタグ（選択した全タグにマッチ）
    if (Array.isArray(mapCfg.skillTags) && mapCfg.skillTags.length) {
      for (const tid of mapCfg.skillTags) {
        const def = SKILL_TAGS.find(s => s.id === tid);
        if (def && !def.re.test(p.searchBlob)) return false;
      }
    }
    // 4) エリア・距離
    if (!ignoreDistance) {
      if (mapCfg.areaMode === 'pref' && mapCfg.prefFilter) {
        if (p.pref !== mapCfg.prefFilter) return false;
      } else {
        const km = getCurrentRadiusKm();
        if (km > 0 && p.distKm > km) return false;
      }
    }
    return true;
  }

  function countActiveFilters() {
    let n = 0;
    if (mapCfg.areaMode === 'pref' && mapCfg.prefFilter) n++;
    else if (mapCfg.areaMode === 'radius' && getCurrentRadiusKm() > 0) n++;
    if (mapCfg.catFilter !== 'all') n++;
    n += (mapCfg.skillTags || []).length;
    return n;
  }

  function resetAllPeopleFilters() {
    enViewState.peopleQuery = '';
    mapCfg.areaMode = 'radius';
    mapCfg.stepIdx = RADIUS_STEPS.length - 1;
    mapCfg.prefFilter = '';
    mapCfg.catFilter = 'all';
    mapCfg.skillTags = [];
    saveMapCfg();
  }

  // =========================================================
  // ⚙️ 統合「絞り込みボトムシート」（地域/半径・6職種・得意なことタグ）
  // =========================================================
  function openUnifiedPeopleFilterSheet(onApplied) {
    const km = getCurrentRadiusKm();
    const isPrefMode = mapCfg.areaMode === 'pref';
    const hitCount = getAllPeopleEnriched().filter(p => matchesCommonFilters(p, false)).length;

    openEnSheetHtml('⚙️ 人材を絞り込む（地域・職種・得意なこと）', 'リスト・マップ・スワイプすべてに即時反映されます', `
      <!-- ① 地域・距離 -->
      <div class="en-pfs-sec">
        <div class="en-pfs-head">
          <span>📍 ① 地域・距離</span>
          <span class="en-meta">${isPrefMode ? (mapCfg.prefFilter || '全国') : formatRadiusLabel(km)}</span>
        </div>
        <div class="en-pfs-mode-tabs">
          <button type="button" class="en-pfs-mode-btn ${!isPrefMode ? 'active' : ''}" data-pfsmode="radius">📏 拠点から半径で選ぶ</button>
          <button type="button" class="en-pfs-mode-btn ${isPrefMode ? 'active' : ''}" data-pfsmode="pref">🗾 都道府県で選ぶ</button>
        </div>

        ${!isPrefMode ? `
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:2px;">
            <div class="en-between">
              <span class="en-meta" style="font-weight:800;">拠点：${esc(mapCfg.baseLabel)}</span>
              <span class="en-radius-val" id="enPfsRadVal">${formatRadiusLabel(km)}</span>
            </div>
            <input type="range" class="en-radius-slider" id="enPfsRadSlider" min="0" max="${RADIUS_STEPS.length - 1}" step="1" value="${mapCfg.stepIdx}">
            <div class="en-radius-ticks"><span>5km</span><span>20km</span><span>50km</span><span>200km</span><span>全国</span></div>
            <div class="en-row" style="gap:6px;margin-top:2px;">
              <button type="button" class="en-radius-mini-btn" id="enPfsGpsBtn">📍 GPS現在地を拠点に</button>
              <select id="enPfsBasePrefSel" class="en-input-field" style="flex:1;padding:5px 8px;font-size:11.5px;">
                ${PREF_LIST.map(p => `<option value="${p}" ${mapCfg.baseLabel.includes(p)?'selected':''}>拠点：${p}</option>`).join('')}
              </select>
            </div>
          </div>
        ` : `
          <select id="enPfsPrefFilterSel" class="en-input-field">
            <option value="">🌐 全国すべて</option>
            ${PREF_LIST.map(p => `<option value="${p}" ${mapCfg.prefFilter === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        `}
      </div>

      <!-- ② 職種 -->
      <div class="en-pfs-sec">
        <div class="en-pfs-head"><span>🏷️ ② 職種・役割</span></div>
        <div class="en-pfs-chips">
          <button type="button" class="en-pfs-chip ${mapCfg.catFilter==='all'?'active':''}" data-pfscat="all">全職種</button>
          ${Object.entries(ROLE_META).map(([k, m]) => `
            <button type="button" class="en-pfs-chip ${mapCfg.catFilter===k?'active':''}" data-pfscat="${k}">
              <span class="en-futa-cat-dot" style="background:${m.color};"></span>${m.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- ③ 得意なこと・条件タグ -->
      <div class="en-pfs-sec">
        <div class="en-pfs-head"><span>✨ ③ 得意なこと・条件（複数タップOK）</span></div>
        <div class="en-pfs-chips">
          ${SKILL_TAGS.map(st => `
            <button type="button" class="en-pfs-chip ${(mapCfg.skillTags || []).includes(st.id) ? 'active' : ''}" data-pfsskill="${st.id}">
              #${st.label}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="en-row" style="gap:8px;margin-top:2px;">
        <button type="button" class="en-act-btn" id="enPfsResetBtn">リセット</button>
        <button type="button" class="en-act-btn primary" style="flex:1;justify-content:center;" id="enPfsApplyBtn">
          この条件で表示する（${hitCount}件）
        </button>
      </div>
    `);

    const refreshSheet = () => {
      saveMapCfg();
      if (typeof onApplied === 'function') onApplied();
      openUnifiedPeopleFilterSheet(onApplied);
    };

    document.querySelectorAll('[data-pfsmode]').forEach(btn => {
      btn.onclick = () => { mapCfg.areaMode = btn.getAttribute('data-pfsmode'); refreshSheet(); };
    });

    const radSlider = document.getElementById('enPfsRadSlider');
    if (radSlider) {
      radSlider.oninput = e => {
        mapCfg.stepIdx = Number(e.target.value);
        const curKm = getCurrentRadiusKm();
        const vEl = document.getElementById('enPfsRadVal');
        if (vEl) vEl.textContent = formatRadiusLabel(curKm);
        const cnt = getAllPeopleEnriched().filter(p => matchesCommonFilters(p, false)).length;
        const ap = document.getElementById('enPfsApplyBtn');
        if (ap) ap.textContent = `この条件で表示する（${cnt}件）`;
      };
      radSlider.onchange = () => { saveMapCfg(); if (typeof onApplied === 'function') onApplied(); };
    }

    document.getElementById('enPfsBasePrefSel')?.addEventListener('change', e => {
      const pf = e.target.value;
      const [lat, lng] = resolveLatLng(pf);
      mapCfg.baseLat = lat; mapCfg.baseLng = lng; mapCfg.baseLabel = pf; mapCfg.gpsLocked = true;
      refreshSheet();
    });

    document.getElementById('enPfsGpsBtn')?.addEventListener('click', () => {
      if (!navigator.geolocation) return enToast('⚠️ この端末ではGPS位置情報を利用できません');
      enToast('📍 現在地を取得中...');
      navigator.geolocation.getCurrentPosition(pos => {
        mapCfg.baseLat = Math.round(pos.coords.latitude * 1000) / 1000;
        mapCfg.baseLng = Math.round(pos.coords.longitude * 1000) / 1000;
        mapCfg.baseLabel = '現在地付近';
        mapCfg.gpsLocked = true;
        enToast('📍 現在地を拠点にセットしました！');
        refreshSheet();
      }, () => enToast('⚠️ 位置情報が許可されませんでした'), { timeout: 6000 });
    });

    document.getElementById('enPfsPrefFilterSel')?.addEventListener('change', e => {
      mapCfg.prefFilter = e.target.value;
      if (mapCfg.prefFilter) {
        const [lat, lng] = resolveLatLng(mapCfg.prefFilter);
        mapCfg.baseLat = lat; mapCfg.baseLng = lng; mapCfg.baseLabel = mapCfg.prefFilter;
      }
      refreshSheet();
    });

    document.querySelectorAll('[data-pfscat]').forEach(btn => {
      btn.onclick = () => { mapCfg.catFilter = btn.getAttribute('data-pfscat'); refreshSheet(); };
    });

    document.querySelectorAll('[data-pfsskill]').forEach(btn => {
      btn.onclick = () => {
        const tid = btn.getAttribute('data-pfsskill');
        if (!Array.isArray(mapCfg.skillTags)) mapCfg.skillTags = [];
        if (mapCfg.skillTags.includes(tid)) mapCfg.skillTags = mapCfg.skillTags.filter(x => x !== tid);
        else mapCfg.skillTags.push(tid);
        refreshSheet();
      };
    });

    document.getElementById('enPfsResetBtn')?.addEventListener('click', () => {
      resetAllPeopleFilters();
      refreshSheet();
    });

    document.getElementById('enPfsApplyBtn')?.addEventListener('click', () => {
      saveMapCfg();
      closeEnSheet();
      if (typeof onApplied === 'function') onApplied();
    });
  }

  // =========================================================
  // 🗾 Leaflet 日本地図（国土地理院タイル・APIキー完全不要）
  // =========================================================
  let leafletMap = null;
  let radiusCircle = null;
  let homeMarker = null;
  let personMarkers = [];

  function destroyLeafletMap() {
    if (leafletMap) {
      try { leafletMap.remove(); } catch (e) {}
      leafletMap = null;
    }
    radiusCircle = null;
    homeMarker = null;
    personMarkers = [];
  }

  function buildFutaDivIcon(person, isSelected, inRange) {
    const meta = ROLE_META[person.category] || ROLE_META.craft;
    const isFound = discoveredSet.has(person.id);
    const shortArea = String(person.area || '').replace(/^.+?[都府県]\s*/, '').slice(0, 5) || person.area;

    return L.divIcon({
      className: 'en-futa-marker-wrap',
      iconSize: [46, 62],
      iconAnchor: [23, 23],
      html: `
        <div class="en-futa-lid ${isSelected ? 'is-selected' : ''} ${!inRange ? 'is-out-range' : ''}"
             style="--lid-color:${meta.color};--lid-bg:#ffffff;--lid-ring:${meta.color}33;">
          <svg viewBox="0 0 24 24" aria-hidden="true">${meta.svg}</svg>
          ${isFound ? '<span class="en-futa-lid-check">✓</span>' : ''}
          <span class="en-futa-lid-city">${esc(shortArea)}</span>
        </div>
      `
    });
  }

  function updateRadiusVisualsLive(hostEl) {
    const km = mapCfg.areaMode === 'pref' ? 0 : getCurrentRadiusKm();
    const valEl = hostEl.querySelector('#enRadiusValPill');
    if (valEl) valEl.textContent = mapCfg.areaMode === 'pref' && mapCfg.prefFilter ? mapCfg.prefFilter : formatRadiusLabel(km);

    if (leafletMap && radiusCircle) {
      if (km === 0 || mapCfg.areaMode === 'pref') {
        radiusCircle.setStyle({ opacity: 0, fillOpacity: 0 });
      } else {
        radiusCircle.setLatLng([mapCfg.baseLat, mapCfg.baseLng]);
        radiusCircle.setRadius(km * 1000);
        radiusCircle.setStyle({ opacity: 0.85, fillOpacity: 0.14 });
      }
    }

    let inCount = 0;
    personMarkers.forEach(item => {
      const matchCommon = matchesCommonFilters(item.person, true);
      const inArea = mapCfg.areaMode === 'pref' && mapCfg.prefFilter
        ? item.person.pref === mapCfg.prefFilter
        : (km === 0 || item.person.distKm <= km);

      if (matchCommon) {
        if (leafletMap && !leafletMap.hasLayer(item.marker)) item.marker.addTo(leafletMap);
        item.marker.setIcon(buildFutaDivIcon(item.person, item.person.id === enViewState.mapSelectedId, inArea));
        if (inArea) inCount++;
      } else {
        if (leafletMap && leafletMap.hasLayer(item.marker)) leafletMap.removeLayer(item.marker);
      }
    });

    const cntEl = hostEl.querySelector('#enRadiusHitCount');
    if (cntEl) cntEl.textContent = `${inCount}件ヒット`;
  }

  function fitMapToCurrentArea() {
    if (!leafletMap) return;
    if (mapCfg.areaMode === 'pref' && mapCfg.prefFilter) {
      const [lat, lng] = resolveLatLng(mapCfg.prefFilter);
      leafletMap.setView([lat, lng], 9, { animate: true });
      return;
    }
    const km = getCurrentRadiusKm();
    if (km === 0) {
      leafletMap.setView([36.5, 137.8], 5, { animate: true });
    } else if (radiusCircle) {
      radiusCircle.setRadius(km * 1000);
      leafletMap.fitBounds(radiusCircle.getBounds(), { padding: [26, 26], maxZoom: 12, animate: true });
    }
  }

  function renderSelectedFutaDetailCard(detailSlot, person) {
    if (!detailSlot || !person) return;
    const meta = ROLE_META[person.category] || ROLE_META.craft;
    const isBuyer = enViewState.userMode === 'buyer';
    const aiTxt = typeof getDynamicAiMatch === 'function' ? getDynamicAiMatch(person) : person.aiMatch;
    const isFound = discoveredSet.has(person.id);

    detailSlot.innerHTML = `
      <div class="card en-card en-futa-detail-card" style="border-left-color:${meta.color} !important;">
        <div class="en-between">
          <div class="en-row">
            <img class="en-avatar" src="${person.avatar}" alt="">
            <div>
              <div class="en-title">${esc(person.name)}（${esc(person.shop)}）</div>
              <div class="en-meta">📍 ${esc(person.area)} ・ ${esc(person.categoryLabel)}</div>
            </div>
          </div>
          <span class="en-futa-dist-pill">拠点から 約${person.distKm}km</span>
        </div>
        <div class="en-row" style="flex-wrap:wrap;gap:6px;">
          <span class="en-pill" style="background:${meta.color}1a;color:${meta.color};">${esc(meta.label)}</span>
          ${isFound ? '<span class="en-pill" style="background:rgba(16,185,129,0.14);color:#059669;">✓ 図鑑で発見済み</span>' : ''}
          <span class="en-meta" style="font-size:11px;">過去ラボ実績 ${person.detail?.pastLabs || 2}件</span>
        </div>
        <p class="en-text">${esc(person.canDo)}</p>
        <div class="en-meta" style="color:var(--en-accent);font-weight:800;">✨ ${esc(aiTxt)}</div>
        <div class="en-actions">
          <button type="button" class="en-act-btn" id="enFutaGreetBtn">👋 ${isBuyer ? '応援する' : '気になる'}</button>
          <button type="button" class="en-act-btn" id="enFutaAskBtn">💬 ちょっと聞く</button>
          <button type="button" class="en-act-btn primary" style="margin-left:auto;" id="enFutaDetailBtn">🪪 詳細・設備</button>
        </div>
      </div>
    `;

    document.getElementById('enFutaGreetBtn')?.addEventListener('click', () => enToast(`👋 ${person.name}さんに「${isBuyer ? '応援' : '気になる'}」を送りました！`));
    document.getElementById('enFutaAskBtn')?.addEventListener('click', () => { if (typeof startQuickAsk === 'function') startQuickAsk(person.id); });
    document.getElementById('enFutaDetailBtn')?.addEventListener('click', () => { if (typeof openPersonDetailSheet === 'function') openPersonDetailSheet(person.id); });
    if (typeof enSyncTheme === 'function') enSyncTheme();
  }

  // =========================================================
  // 👥 おすすめ人材 結果スロット描画（リスト / マップ / スワイプ）
  //    ★検索入力欄を作り直さないので日本語IMEが絶対に途切れない！
  // =========================================================
  function renderActiveFilterPills(barHost, onChanged) {
    const activeCnt = countActiveFilters();
    const fBtn = barHost.querySelector('#enPfFilterOpenBtn');
    if (fBtn) {
      fBtn.classList.toggle('has-active', activeCnt > 0);
      fBtn.innerHTML = `⚙️ 絞り込み${activeCnt > 0 ? `<span class="en-pf-filter-cnt">${activeCnt}</span>` : ''}`;
    }

    const row = barHost.querySelector('#enActiveFilterRow');
    if (!row) return;
    const pills = [];

    if (mapCfg.areaMode === 'pref' && mapCfg.prefFilter) {
      pills.push({ k: 'area', lbl: `🗾 ${mapCfg.prefFilter}` });
    } else if (mapCfg.areaMode === 'radius' && getCurrentRadiusKm() > 0) {
      pills.push({ k: 'area', lbl: `📏 ${mapCfg.baseLabel} 半径${getCurrentRadiusKm()}km` });
    }
    if (mapCfg.catFilter !== 'all' && ROLE_META[mapCfg.catFilter]) {
      pills.push({ k: 'cat', lbl: `🏷️ ${ROLE_META[mapCfg.catFilter].label}` });
    }
    (mapCfg.skillTags || []).forEach(tid => {
      const def = SKILL_TAGS.find(s => s.id === tid);
      if (def) pills.push({ k: 'skill:' + tid, lbl: `#${def.label}` });
    });

    if (!pills.length) {
      row.innerHTML = '';
      return;
    }

    row.innerHTML = pills.map(p => `<button type="button" class="en-pf-pill" data-rmpf="${p.k}">${esc(p.lbl)} ✕</button>`).join('') +
      `<button type="button" class="en-pf-pill reset" data-rmpf="all">クリア</button>`;

    row.querySelectorAll('[data-rmpf]').forEach(btn => {
      btn.onclick = () => {
        const k = btn.getAttribute('data-rmpf');
        if (k === 'all') {
          resetAllPeopleFilters();
          const inp = barHost.querySelector('#enPfSearchInput');
          if (inp) inp.value = '';
          barHost.querySelector('#enPfClearQBtn')?.classList.remove('show');
        } else if (k === 'area') {
          mapCfg.areaMode = 'radius';
          mapCfg.stepIdx = RADIUS_STEPS.length - 1;
          mapCfg.prefFilter = '';
        } else if (k === 'cat') {
          mapCfg.catFilter = 'all';
        } else if (k.startsWith('skill:')) {
          const tid = k.slice(6);
          mapCfg.skillTags = (mapCfg.skillTags || []).filter(x => x !== tid);
        }
        saveMapCfg();
        onChanged();
      };
    });
  }

  function renderPeopleResultsSlot(slot, barHost) {
    if (!slot) return;
    syncBaseFromAreaSettings();
    const view = enViewState.peopleView || 'list';
    const isBuyer = enViewState.userMode === 'buyer';
    const allPeople = getAllPeopleEnriched();

    // --- 📋 リスト表示（地図非掲載ユーザーも地域検索でしっかり表示！） ---
    if (view === 'list') {
      destroyLeafletMap();
      const filtered = allPeople.filter(p => matchesCommonFilters(p, false)).sort((a, b) => a.distKm - b.distKm);

      if (!filtered.length) {
        slot.innerHTML = `
          <div class="en-area-empty">
            <div>条件に合うメンバーがまだ見つかりません</div>
            <button type="button" class="en-act-btn primary" id="enPfEmptyReset">🌐 絞り込みをリセットして全国表示</button>
          </div>
        `;
        slot.querySelector('#enPfEmptyReset')?.addEventListener('click', () => {
          resetAllPeopleFilters();
          const inp = barHost.querySelector('#enPfSearchInput'); if (inp) inp.value = '';
          renderActiveFilterPills(barHost, () => renderPeopleResultsSlot(slot, barHost));
          renderPeopleResultsSlot(slot, barHost);
        });
        if (typeof enSyncTheme === 'function') enSyncTheme();
        return;
      }

      const diagBadge = (typeof EN_DIAG_TYPES !== 'undefined' && EN_DIAG_TYPES[enViewState.diagType]?.badge) || '';
      slot.innerHTML = `
        <div class="en-between" style="padding:0 2px;">
          <span class="en-meta">✨ ${esc(diagBadge)} 基準（${filtered.length}名・近い順）</span>
          <span class="en-meta">拠点：${esc(mapCfg.baseLabel)}</span>
        </div>
        <div class="en-grid-2">
          ${filtered.map(p => {
            const meta = ROLE_META[p.category] || ROLE_META.craft;
            const aiTxt = typeof getDynamicAiMatch === 'function' ? getDynamicAiMatch(p) : p.aiMatch;
            return `
              <div class="card en-card" style="padding:11px;gap:8px;cursor:pointer;" data-persondetail="${p.id}">
                <div class="en-between" style="align-items:flex-start;">
                  <div class="en-row" style="min-width:0;">
                    <img class="en-avatar" style="width:36px;height:36px;" src="${p.avatar}" alt="">
                    <div style="min-width:0;">
                      <div class="en-title" style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(p.name)}</div>
                      <div class="en-meta" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(p.area)}</div>
                    </div>
                  </div>
                  <span class="en-futa-dist-pill">約${p.distKm}km</span>
                </div>
                <div class="en-row" style="flex-wrap:wrap;gap:4px;">
                  <span class="en-pill" style="background:${meta.color}1a;color:${meta.color};">${esc(p.categoryLabel)}</span>
                  ${p.mapOpen === false ? '<span class="en-pill" style="background:var(--en-surface-2);color:var(--en-muted);">🔒 地図非掲載</span>' : ''}
                </div>
                <p class="en-text" style="font-size:11.5px;">${esc(p.canDo)}</p>
                <div class="en-meta" style="color:var(--en-accent);font-weight:800;font-size:11px;">✨ ${esc(aiTxt)}</div>
                <div class="en-actions" style="padding-top:7px;" onclick="event.stopPropagation()">
                  <button class="en-act-btn" style="flex:1;justify-content:center;padding:6px;" data-pcard-greet="${p.id}">👋</button>
                  ${isBuyer
                    ? `<button class="en-act-btn primary" style="flex:1;justify-content:center;padding:6px;" onclick="enGoTab('shop')">🎪</button>`
                    : `<button class="en-act-btn primary" style="flex:1;justify-content:center;padding:6px;" data-pcard-ask="${p.id}">💬</button>`}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      slot.querySelectorAll('[data-persondetail]').forEach(c => c.onclick = () => { if (typeof openPersonDetailSheet === 'function') openPersonDetailSheet(c.getAttribute('data-persondetail')); });
      slot.querySelectorAll('[data-pcard-greet]').forEach(b => b.onclick = () => {
        const p = EN_MOCK_PEOPLE.find(x => x.id === b.getAttribute('data-pcard-greet'));
        if (p) enToast(`👋 ${p.name}さんに「${isBuyer ? '応援' : '気になる'}」を送信！`);
      });
      slot.querySelectorAll('[data-pcard-ask]').forEach(b => b.onclick = () => { if (typeof startQuickAsk === 'function') startQuickAsk(b.getAttribute('data-pcard-ask')); });
      if (typeof enSyncTheme === 'function') enSyncTheme();
      return;
    }

    // --- 🃏 スワイプ表示 ---
    if (view === 'swipe') {
      destroyLeafletMap();
      const filtered = allPeople.filter(p => matchesCommonFilters(p, false));
      const swp = filtered.length ? filtered[enViewState.swipeIdx % filtered.length] : allPeople[0];
      const aiTxt = typeof getDynamicAiMatch === 'function' ? getDynamicAiMatch(swp) : swp.aiMatch;

      slot.innerHTML = `
        <div class="card en-card">
          <div class="en-hero-card" style="height:245px;">
            <img src="${swp.avatar}" alt="">
            <div class="en-hero-overlay">
              <span class="en-hero-tag">${esc(swp.area)} ・ 約${swp.distKm}km ・ ${esc(swp.categoryLabel)}</span>
              <div class="en-hero-title">${esc(swp.name)}（${esc(swp.shop)}）</div>
            </div>
          </div>
          <p class="en-text">${esc(swp.canDo)}</p>
          <div class="en-meta" style="color:var(--en-accent);font-weight:800;">✨ ${esc(aiTxt)}</div>
          <div class="en-actions">
            <button class="en-act-btn" style="flex:1;justify-content:center;" id="enSwpNextBtn">スキップ ➔</button>
            <button class="en-act-btn primary" style="flex:1;justify-content:center;" id="enSwpLikeBtn">👋 気になる！</button>
          </div>
        </div>
      `;
      slot.querySelector('#enSwpNextBtn')?.addEventListener('click', () => { enViewState.swipeIdx++; renderPeopleResultsSlot(slot, barHost); });
      slot.querySelector('#enSwpLikeBtn')?.addEventListener('click', () => { enToast(`👋 ${swp.name}さんに「気になる」を送りました！`); enViewState.swipeIdx++; renderPeopleResultsSlot(slot, barHost); });
      if (typeof enSyncTheme === 'function') enSyncTheme();
      return;
    }

    // --- 🗺️ マップ表示（日本地図 × 半径ゲージ × ポケふた風職種メダル） ---
    const mapPeople = allPeople.filter(p => p.mapOpen !== false);
    const hiddenMapCount = allPeople.length - mapPeople.length;
    const matchedForMap = mapPeople.filter(p => matchesCommonFilters(p, true));
    const curKm = getCurrentRadiusKm();

    // すでにLeaflet地図が存在している場合は、地図を壊さずマーカーだけ即時更新（爆速＆IME無干渉！）
    if (leafletMap && slot.querySelector('#enJapanLeafletMap')) {
      updateRadiusVisualsLive(slot);
      return;
    }

    const selected = matchedForMap.find(p => p.id === enViewState.mapSelectedId) || matchedForMap[0] || mapPeople[0];
    if (selected) {
      enViewState.mapSelectedId = selected.id;
      markDiscovered(selected.id);
    }

    const foundCount = mapPeople.filter(p => discoveredSet.has(p.id)).length;
    const dexPct = Math.round((foundCount / Math.max(1, mapPeople.length)) * 100);

    slot.innerHTML = `
      <div class="en-futa-dex">
        <div class="en-futa-dex-left">
          <div class="en-futa-dex-title">🗾 日本全国「職種ふた」探索マップ</div>
          <div class="en-futa-dex-bar"><div class="en-futa-dex-fill" id="enFutaDexFill" style="width:${dexPct}%"></div></div>
        </div>
        <span class="en-futa-dex-cnt" id="enFutaDexCnt">${foundCount} / ${mapPeople.length} 発見</span>
      </div>

      <div class="en-radius-box">
        <div class="en-radius-head">
          <span class="en-radius-title">📏 拠点（${esc(mapCfg.baseLabel)}）からの範囲</span>
          <span class="en-radius-val" id="enRadiusValPill">${mapCfg.areaMode === 'pref' && mapCfg.prefFilter ? esc(mapCfg.prefFilter) : formatRadiusLabel(curKm)}</span>
        </div>
        <div class="en-radius-slider-row">
          <input type="range" class="en-radius-slider" id="enRadiusSlider" min="0" max="${RADIUS_STEPS.length - 1}" step="1" value="${mapCfg.stepIdx}">
        </div>
        <div class="en-radius-ticks"><span>5km</span><span>20km</span><span>50km</span><span>200km</span><span>全国</span></div>
        <div class="en-radius-actions">
          <span class="en-meta" style="font-weight:800;" id="enRadiusHitCount">0件ヒット</span>
          <div class="en-row" style="gap:5px;">
            <button type="button" class="en-radius-mini-btn" id="enMapUseGpsBtn">📍 GPS現在地</button>
            <button type="button" class="en-radius-mini-btn" id="enMapOpenFilterBtn">⚙️ 詳細条件</button>
          </div>
        </div>
      </div>

      <div class="en-futa-cat-strip">
        <button type="button" class="en-futa-cat-chip ${mapCfg.catFilter==='all'?'active':''}" data-futacat="all">すべて (${mapPeople.length})</button>
        ${Object.entries(ROLE_META).map(([k, m]) => `
          <button type="button" class="en-futa-cat-chip ${mapCfg.catFilter===k?'active':''}" data-futacat="${k}">
            <span class="en-futa-cat-dot" style="background:${m.color};"></span>${m.label.split('・')[0]}
          </button>
        `).join('')}
      </div>

      <div class="en-jpmap-wrap">
        <div id="enJapanLeafletMap"></div>
        <div class="en-jpmap-float-ctrls">
          <button type="button" class="en-jpmap-fbtn" id="enJpFitAllBtn">🗾 日本全体</button>
          <button type="button" class="en-jpmap-fbtn" id="enJpFitBaseBtn">🎯 拠点へ</button>
        </div>
        <span class="en-jpmap-privacy-tag">🛡️ 市町村エリア表示（詳細住所＆非掲載設定は保護）</span>
      </div>

      ${hiddenMapCount > 0 ? `<div class="en-map-hidden-note">🔒 地図非掲載メンバー（${hiddenMapCount}名）はマップ非表示・<strong>「📋 リスト」</strong>の地域検索には表示されます</div>` : ''}
      <div id="enFutaDetailSlot"></div>
    `;

    const detailSlot = slot.querySelector('#enFutaDetailSlot');
    renderSelectedFutaDetailCard(detailSlot, selected);

    slot.querySelectorAll('[data-futacat]').forEach(btn => {
      btn.onclick = () => {
        mapCfg.catFilter = btn.getAttribute('data-futacat');
        saveMapCfg();
        slot.querySelectorAll('[data-futacat]').forEach(b => b.classList.toggle('active', b === btn));
        renderActiveFilterPills(barHost, () => renderPeopleResultsSlot(slot, barHost));
        updateRadiusVisualsLive(slot);
      };
    });

    slot.querySelector('#enMapOpenFilterBtn')?.addEventListener('click', () => {
      openUnifiedPeopleFilterSheet(() => {
        renderActiveFilterPills(barHost, () => renderPeopleResultsSlot(slot, barHost));
        destroyLeafletMap();
        renderPeopleResultsSlot(slot, barHost);
      });
    });

    slot.querySelector('#enMapUseGpsBtn')?.addEventListener('click', () => {
      if (!navigator.geolocation) return enToast('⚠️ この端末ではGPS位置情報を利用できません');
      enToast('📍 現在地を取得中...');
      navigator.geolocation.getCurrentPosition(pos => {
        mapCfg.baseLat = Math.round(pos.coords.latitude * 1000) / 1000;
        mapCfg.baseLng = Math.round(pos.coords.longitude * 1000) / 1000;
        mapCfg.baseLabel = '現在地付近';
        mapCfg.gpsLocked = true;
        mapCfg.areaMode = 'radius';
        saveMapCfg();
        enToast('📍 現在地をマップ拠点に設定しました！');
        destroyLeafletMap();
        renderPeopleResultsSlot(slot, barHost);
      }, () => enToast('⚠️ 位置情報が許可されませんでした'), { timeout: 6000 });
    });

    destroyLeafletMap();
    const mapEl = slot.querySelector('#enJapanLeafletMap');
    if (typeof window.L === 'undefined' || !mapEl) {
      if (mapEl) mapEl.innerHTML = '<div style="padding:24px;text-align:center;">地図ライブラリを読み込み中です（リロードをお試しください）</div>';
      return;
    }

    leafletMap = L.map(mapEl, {
      center: curKm === 0 ? [36.5, 137.8] : [mapCfg.baseLat, mapCfg.baseLng],
      zoom: curKm === 0 ? 5 : 9,
      minZoom: 5,
      maxZoom: 17,
      zoomControl: false,
      attributionControl: true
    });

    // ★国土地理院（地理院地図・淡色）：APIキー完全不要・日本語表記
    let switchedToOsm = false;
    const gsiLayer = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
      minZoom: 5, maxZoom: 18,
      attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">国土地理院</a>'
    }).addTo(leafletMap);

    let tileErrCount = 0;
    gsiLayer.on('tileerror', () => {
      tileErrCount++;
      if (!switchedToOsm && tileErrCount >= 4 && leafletMap) {
        switchedToOsm = true;
        leafletMap.removeLayer(gsiLayer);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          minZoom: 4, maxZoom: 18, attribution: '&copy; OpenStreetMap contributors'
        }).addTo(leafletMap);
      }
    });

    radiusCircle = L.circle([mapCfg.baseLat, mapCfg.baseLng], {
      radius: (curKm || 50) * 1000,
      color: '#2563eb', weight: 2, dashArray: '6 4',
      fillColor: '#3b82f6', fillOpacity: curKm === 0 ? 0 : 0.14, opacity: curKm === 0 ? 0 : 0.85
    }).addTo(leafletMap);

    homeMarker = L.marker([mapCfg.baseLat, mapCfg.baseLng], {
      icon: L.divIcon({ className: 'en-home-pin-wrap', iconSize: [22, 22], iconAnchor: [11, 11], html: '<div class="en-home-pin" title="あなたの拠点"></div>' }),
      zIndexOffset: 500
    }).addTo(leafletMap);

    personMarkers = mapPeople.map(p => {
      const marker = L.marker([p.lat, p.lng], {
        icon: buildFutaDivIcon(p, p.id === enViewState.mapSelectedId, true)
      });
      marker.on('click', () => {
        enViewState.mapSelectedId = p.id;
        const newlyFound = markDiscovered(p.id);
        if (newlyFound) {
          enToast(`✨ 新しいご当地職種「${p.shop}（${p.area}）」を発見！`);
          const fNow = mapPeople.filter(x => discoveredSet.has(x.id)).length;
          const cntEl = slot.querySelector('#enFutaDexCnt');
          const fillEl = slot.querySelector('#enFutaDexFill');
          if (cntEl) cntEl.textContent = `${fNow} / ${mapPeople.length} 発見`;
          if (fillEl) fillEl.style.width = `${Math.round((fNow / Math.max(1, mapPeople.length)) * 100)}%`;
        }
        updateRadiusVisualsLive(slot);
        renderSelectedFutaDetailCard(detailSlot, p);
      });
      return { person: p, marker };
    });

    updateRadiusVisualsLive(slot);

    setTimeout(() => {
      if (!leafletMap) return;
      leafletMap.invalidateSize();
      fitMapToCurrentArea();
    }, 100);

    const slider = slot.querySelector('#enRadiusSlider');
    if (slider) {
      slider.addEventListener('input', e => {
        mapCfg.areaMode = 'radius';
        mapCfg.stepIdx = Number(e.target.value);
        updateRadiusVisualsLive(slot);
      });
      slider.addEventListener('change', () => {
        saveMapCfg();
        renderActiveFilterPills(barHost, () => renderPeopleResultsSlot(slot, barHost));
        fitMapToCurrentArea();
      });
    }

    slot.querySelector('#enJpFitAllBtn')?.addEventListener('click', () => {
      mapCfg.areaMode = 'radius';
      mapCfg.stepIdx = RADIUS_STEPS.length - 1;
      saveMapCfg();
      if (slider) slider.value = String(mapCfg.stepIdx);
      renderActiveFilterPills(barHost, () => renderPeopleResultsSlot(slot, barHost));
      updateRadiusVisualsLive(slot);
      fitMapToCurrentArea();
    });

    slot.querySelector('#enJpFitBaseBtn')?.addEventListener('click', () => {
      mapCfg.areaMode = 'radius';
      if (getCurrentRadiusKm() === 0) {
        mapCfg.stepIdx = 4; // 50km
        saveMapCfg();
        if (slider) slider.value = '4';
      }
      renderActiveFilterPills(barHost, () => renderPeopleResultsSlot(slot, barHost));
      updateRadiusVisualsLive(slot);
      fitMapToCurrentArea();
    });

    if (typeof enSyncTheme === 'function') enSyncTheme();
  }

  // =========================================================
  // 🌟 おすすめ人材タブ全体を単独でクリーン描画（IME安全・衝突ゼロ）
  // =========================================================
  function renderUnifiedPeopleSection() {
    const sec = document.getElementById('view-feed');
    if (!sec) return;
    destroyLeafletMap();

    const isBuyer = enViewState.userMode === 'buyer';
    const view = enViewState.peopleView || 'list';
    const curQ = enViewState.peopleQuery || '';

    sec.innerHTML = `
      <div class="en-wrap" id="enUnifiedPeopleWrap">
        <div class="en-subtabs">
          <button class="en-subtab" data-entab="tweet">💬 つぶやき</button>
          <button class="en-subtab active" data-entab="people">👥 ${isBuyer ? '地域のつくり手' : 'おすすめ人材'}</button>
        </div>

        <!-- 🔍 統合1行検索＆絞り込みバー（日本語IME対応） -->
        <div class="en-pf-bar">
          <div class="en-pf-search-wrap">
            <input id="enPfSearchInput" class="en-pf-search-in" type="search" value="${esc(curQ)}"
                   placeholder="🔍 得意なこと・地域・名前（例：乾燥、小ロット、枚方）" autocomplete="off">
            <button type="button" class="en-pf-clear-q ${curQ ? 'show' : ''}" id="enPfClearQBtn" aria-label="検索をクリア">✕</button>
          </div>
          <button type="button" class="en-pf-filter-btn" id="enPfFilterOpenBtn">⚙️ 絞り込み</button>
        </div>

        <!-- 適用中フィルタピル（普段は空で非表示） -->
        <div class="en-pf-active-row" id="enActiveFilterRow"></div>

        <!-- 表示モード切替 -->
        <div class="en-subtabs">
          <button class="en-subtab ${view==='list'?'active':''}" data-upview="list">📋 リスト</button>
          <button class="en-subtab ${view==='map'?'active':''}" data-upview="map">🗺️ マップ</button>
          <button class="en-subtab ${view==='swipe'?'active':''}" data-upview="swipe">🃏 スワイプ</button>
        </div>

        <!-- 結果スロット（検索時はここだけ書き換えるのでIMEが切れない！） -->
        <div id="enPeopleResultsSlot" style="display:flex;flex-direction:column;gap:10px;"></div>
      </div>
    `;

    const wrap = sec.querySelector('#enUnifiedPeopleWrap');
    const slot = sec.querySelector('#enPeopleResultsSlot');

    const refreshResults = () => {
      renderActiveFilterPills(wrap, refreshResults);
      renderPeopleResultsSlot(slot, wrap);
    };

    // つぶやきタブ切替
    sec.querySelectorAll('[data-entab]').forEach(btn => {
      btn.onclick = () => {
        enViewState.enSubTab = btn.getAttribute('data-entab');
        window.renderEnFeed();
      };
    });

    // リスト / マップ / スワイプ切替
    sec.querySelectorAll('[data-upview]').forEach(btn => {
      btn.onclick = () => {
        enViewState.peopleView = btn.getAttribute('data-upview');
        sec.querySelectorAll('[data-upview]').forEach(b => b.classList.toggle('active', b === btn));
        destroyLeafletMap();
        renderPeopleResultsSlot(slot, wrap);
      };
    });

    // 日本語IME完全対応の検索ボックス
    const sInp = sec.querySelector('#enPfSearchInput');
    const clrBtn = sec.querySelector('#enPfClearQBtn');
    if (sInp) {
      let composing = false;
      const applyQuery = (val) => {
        enViewState.peopleQuery = val;
        clrBtn?.classList.toggle('show', !!val.trim());
        renderPeopleResultsSlot(slot, wrap);
      };
      sInp.addEventListener('compositionstart', () => { composing = true; });
      sInp.addEventListener('compositionend', e => { composing = false; applyQuery(e.target.value); });
      sInp.addEventListener('input', e => { if (!composing) applyQuery(e.target.value); });
    }
    if (clrBtn) {
      clrBtn.onclick = () => {
        if (sInp) { sInp.value = ''; sInp.focus(); }
        enViewState.peopleQuery = '';
        clrBtn.classList.remove('show');
        renderPeopleResultsSlot(slot, wrap);
      };
    }

    // 統合絞り込みシート
    sec.querySelector('#enPfFilterOpenBtn')?.addEventListener('click', () => {
      openUnifiedPeopleFilterSheet(() => {
        destroyLeafletMap();
        refreshResults();
      });
    });

    refreshResults();
    if (typeof enSyncTheme === 'function') enSyncTheme();
  }

  function installJapanMapHookOnce() {
    if (jpMapHookInstalled) return;
    jpMapHookInstalled = true;

    if (typeof window.renderEnFeed === 'function') {
      const origFeed = window.renderEnFeed;
      window.renderEnFeed = function () {
        normalizePeopleCoords();
        if (enViewState.enSubTab === 'people') {
          try {
            renderUnifiedPeopleSection();
          } catch (err) {
            console.error('EN•joy Unified People/Map error:', err);
          }
          return;
        }
        destroyLeafletMap();
        return origFeed.apply(this, arguments);
      };
    }

    document.addEventListener('click', e => {
      if (e.target.closest('#bottomNav [data-tab="feed"]')) {
        setTimeout(() => { if (leafletMap) leafletMap.invalidateSize(); }, 120);
      }
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      ensureNationwideCraftPeople();
      syncBaseFromAreaSettings();
      installJapanMapHookOnce();
      if (typeof renderEnFeed === 'function') renderEnFeed();
    }, 300);
  });
})();