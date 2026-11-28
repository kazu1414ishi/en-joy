/* =========================================================
   EN•joy 日本地図 × 半径ゲージ × ポケふた風「ご当地職種メダルマップ」
   （patch_japan_map.js v3）
   ・全国追加メンバーの mapPos 欠落エラーを完全修正（マップが開かないバグ根治）
   ・国土地理院（地理院地図・淡色）タイル採用（APIキー完全不要・日本語表記）
   ・他タブ復帰時の自動リサイズ(invalidateSize)＋通信エラー時OSM自動退避
   ・mapOpen === false のユーザーは地図非掲載（地域検索・リストのみ表示）
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

  function resolveLatLng(areaText) {
    const raw = String(areaText || '');
    const keys = Object.keys(AREA_COORDS).sort((a, b) => b.length - a.length);
    for (const k of keys) {
      if (raw.includes(k)) return AREA_COORDS[k];
    }
    return [34.766, 135.628];
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

  const mapCfg = (function loadMapCfg() {
    try {
      const s = JSON.parse(localStorage.getItem(MAP_CFG_KEY) || 'null');
      if (s && typeof s.stepIdx === 'number') return s;
    } catch (e) {}
    return { stepIdx: 9, baseLat: 34.766, baseLng: 135.628, baseLabel: '大阪府 寝屋川市', catFilter: 'all' };
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

  // 全メンバーに必須の mapPos と latLng を保証（patch_views.js の描画エラーを完全防止）
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

    extraNationwide.forEach(p => {
      if (!EN_MOCK_PEOPLE.some(x => x.id === p.id)) EN_MOCK_PEOPLE.push(p);
    });
    normalizePeopleCoords();
  }

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

  function getPeopleWithDistance(onlyMapAllowed) {
    normalizePeopleCoords();
    return EN_MOCK_PEOPLE
      .filter(p => !onlyMapAllowed || p.mapOpen !== false)
      .map(p => {
        const [lat, lng] = p.latLng || resolveLatLng(p.area);
        const distKm = Math.round(calcDistanceKm(mapCfg.baseLat, mapCfg.baseLng, lat, lng));
        return { ...p, lat, lng, distKm };
      });
  }

  function updateRadiusVisualsLive(km, wrapEl) {
    const valEl = wrapEl.querySelector('#enRadiusValPill');
    if (valEl) valEl.textContent = formatRadiusLabel(km);

    if (leafletMap && radiusCircle) {
      if (km === 0) radiusCircle.setStyle({ opacity: 0, fillOpacity: 0 });
      else { radiusCircle.setRadius(km * 1000); radiusCircle.setStyle({ opacity: 0.85, fillOpacity: 0.14 }); }
    }

    let inCount = 0;
    personMarkers.forEach(item => {
      const catOk = mapCfg.catFilter === 'all' || item.person.category === mapCfg.catFilter;
      const distOk = km === 0 || item.person.distKm <= km;
      if (catOk) {
        if (!leafletMap.hasLayer(item.marker)) item.marker.addTo(leafletMap);
        item.marker.setIcon(buildFutaDivIcon(item.person, item.person.id === enViewState.mapSelectedId, distOk));
        if (distOk) inCount++;
      } else {
        if (leafletMap.hasLayer(item.marker)) leafletMap.removeLayer(item.marker);
      }
    });

    const cntEl = wrapEl.querySelector('#enRadiusHitCount');
    if (cntEl) cntEl.textContent = `${inCount}件ヒット`;
  }

  function fitMapToRadius(km) {
    if (!leafletMap) return;
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

  function mountJapanFutaMapView(wrapEl) {
    const oldMapBox = wrapEl.querySelector('.en-map-box');
    if (!oldMapBox) return;

    const oldCard = oldMapBox.nextElementSibling;
    if (oldCard && oldCard.classList.contains('en-card')) oldCard.remove();

    syncBaseFromAreaSettings();
    const mapPeople = getPeopleWithDistance(true);
    const hiddenMapCount = EN_MOCK_PEOPLE.filter(p => p.mapOpen === false).length;

    const curKm = getCurrentRadiusKm();
    const q = (enViewState.peopleQuery || '').trim();
    const searchFiltered = mapPeople.filter(p => !q || (p.name + p.shop + p.area + p.canDo + p.categoryLabel).includes(q));

    const selected = searchFiltered.find(p => p.id === enViewState.mapSelectedId) || searchFiltered[0] || mapPeople[0];
    if (selected) {
      enViewState.mapSelectedId = selected.id;
      markDiscovered(selected.id);
    }

    const foundCount = mapPeople.filter(p => discoveredSet.has(p.id)).length;
    const dexPct = Math.round((foundCount / Math.max(1, mapPeople.length)) * 100);
    const inRangeNow = searchFiltered.filter(p => (mapCfg.catFilter === 'all' || p.category === mapCfg.catFilter) && (curKm === 0 || p.distKm <= curKm)).length;

    const host = document.createElement('div');
    host.style.cssText = 'display:flex;flex-direction:column;gap:10px;';
    host.innerHTML = `
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
          <span class="en-radius-val" id="enRadiusValPill">${formatRadiusLabel(curKm)}</span>
        </div>
        <div class="en-radius-slider-row">
          <input type="range" class="en-radius-slider" id="enRadiusSlider" min="0" max="${RADIUS_STEPS.length - 1}" step="1" value="${mapCfg.stepIdx}">
        </div>
        <div class="en-radius-ticks">
          <span>5km</span><span>20km</span><span>50km</span><span>200km</span><span>全国</span>
        </div>
        <div class="en-radius-actions">
          <span class="en-meta" style="font-weight:800;" id="enRadiusHitCount">${inRangeNow}件ヒット</span>
          <div class="en-row" style="gap:5px;">
            <button type="button" class="en-radius-mini-btn" id="enMapUseGpsBtn">📍 GPS現在地</button>
            <button type="button" class="en-radius-mini-btn" id="enMapPickPrefBtn">🗾 拠点変更</button>
          </div>
        </div>
      </div>

      <div class="en-futa-cat-strip">
        <button type="button" class="en-futa-cat-chip ${mapCfg.catFilter==='all'?'active':''}" data-futacat="all">すべて (${searchFiltered.length})</button>
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

      ${hiddenMapCount > 0 ? `<div class="en-map-hidden-note">🔒 地図非掲載設定のメンバー（${hiddenMapCount}名）はマップには出ず、<strong>「📋 リスト」の地域検索</strong>に表示されます</div>` : ''}
      <div id="enFutaDetailSlot"></div>
    `;

    oldMapBox.replaceWith(host);

    const detailSlot = host.querySelector('#enFutaDetailSlot');
    renderSelectedFutaDetailCard(detailSlot, selected);

    host.querySelectorAll('[data-futacat]').forEach(btn => {
      btn.onclick = () => {
        mapCfg.catFilter = btn.getAttribute('data-futacat');
        saveMapCfg();
        host.querySelectorAll('[data-futacat]').forEach(b => b.classList.toggle('active', b === btn));
        updateRadiusVisualsLive(getCurrentRadiusKm(), host);
      };
    });

    host.querySelector('#enMapUseGpsBtn')?.addEventListener('click', () => {
      if (!navigator.geolocation) return enToast('⚠️ この端末ではGPS位置情報を利用できません');
      enToast('📍 現在地を取得中...');
      navigator.geolocation.getCurrentPosition(pos => {
        mapCfg.baseLat = Math.round(pos.coords.latitude * 1000) / 1000;
        mapCfg.baseLng = Math.round(pos.coords.longitude * 1000) / 1000;
        mapCfg.baseLabel = '現在地付近';
        mapCfg.gpsLocked = true;
        saveMapCfg();
        enToast('📍 現在地をマップ拠点に設定しました！');
        renderEnFeed();
      }, () => enToast('⚠️ 位置情報が許可されませんでした（拠点変更から都道府県を選べます）'), { timeout: 6000 });
    });

    host.querySelector('#enMapPickPrefBtn')?.addEventListener('click', () => {
      const prefs = Object.keys(AREA_COORDS).filter(k => /[都府県]$|^北海道$/.test(k));
      openEnSheetHtml('📍 半径検索の拠点エリアを選ぶ', '選んだ場所を中心に半径ゲージで周辺メンバーを探せます', `
        <select id="enBasePrefSel" class="en-input-field">
          ${prefs.map(p => `<option value="${p}" ${mapCfg.baseLabel.includes(p)?'selected':''}>${p}</option>`).join('')}
        </select>
        <input id="enBaseCityIn" class="en-input-field" placeholder="市区町村（任意：例 枚方市 / 松本市 / 糸島市）">
        <button type="button" class="en-act-btn primary" style="justify-content:center;" id="enBaseApplyBtn">この場所を拠点にする</button>
      `);
      document.getElementById('enBaseApplyBtn')?.addEventListener('click', () => {
        const pf = document.getElementById('enBasePrefSel')?.value || '大阪府';
        const ct = (document.getElementById('enBaseCityIn')?.value || '').trim();
        const lbl = `${pf}${ct ? ' ' + ct : ''}`;
        const [lat, lng] = resolveLatLng(lbl);
        mapCfg.baseLat = lat; mapCfg.baseLng = lng; mapCfg.baseLabel = lbl; mapCfg.gpsLocked = true;
        saveMapCfg(); closeEnSheet(); enToast(`📍 拠点を「${lbl}」に設定しました！`); renderEnFeed();
      });
    });

    destroyLeafletMap();
    const mapEl = host.querySelector('#enJapanLeafletMap');
    if (typeof window.L === 'undefined' || !mapEl) {
      if (mapEl) mapEl.innerHTML = '<div style="padding:20px;text-align:center;">地図を読み込み中です（通信環境をご確認ください）</div>';
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

    let switchedToOsm = false;
    const gsiLayer = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
      minZoom: 5,
      maxZoom: 18,
      attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">国土地理院</a>'
    }).addTo(leafletMap);

    let tileErrCount = 0;
    gsiLayer.on('tileerror', () => {
      tileErrCount++;
      if (!switchedToOsm && tileErrCount >= 4 && leafletMap) {
        switchedToOsm = true;
        leafletMap.removeLayer(gsiLayer);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          minZoom: 4,
          maxZoom: 18,
          attribution: '&copy; OpenStreetMap contributors'
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

    personMarkers = searchFiltered.map(p => {
      const distOk = curKm === 0 || p.distKm <= curKm;
      const marker = L.marker([p.lat, p.lng], {
        icon: buildFutaDivIcon(p, p.id === enViewState.mapSelectedId, distOk)
      });

      marker.on('click', () => {
        enViewState.mapSelectedId = p.id;
        const newlyFound = markDiscovered(p.id);
        if (newlyFound) {
          enToast(`✨ 新しいご当地職種「${p.shop}（${p.area}）」を発見！`);
          const fNow = mapPeople.filter(x => discoveredSet.has(x.id)).length;
          const cntEl = host.querySelector('#enFutaDexCnt');
          const fillEl = host.querySelector('#enFutaDexFill');
          if (cntEl) cntEl.textContent = `${fNow} / ${mapPeople.length} 発見`;
          if (fillEl) fillEl.style.width = `${Math.round((fNow / Math.max(1, mapPeople.length)) * 100)}%`;
        }
        updateRadiusVisualsLive(getCurrentRadiusKm(), host);
        renderSelectedFutaDetailCard(detailSlot, p);
      });

      if (mapCfg.catFilter === 'all' || p.category === mapCfg.catFilter) marker.addTo(leafletMap);
      return { person: p, marker };
    });

    setTimeout(() => {
      if (!leafletMap) return;
      leafletMap.invalidateSize();
      fitMapToRadius(curKm);
    }, 100);

    const slider = host.querySelector('#enRadiusSlider');
    if (slider) {
      slider.addEventListener('input', e => {
        mapCfg.stepIdx = Number(e.target.value);
        updateRadiusVisualsLive(getCurrentRadiusKm(), host);
      });
      slider.addEventListener('change', () => { saveMapCfg(); fitMapToRadius(getCurrentRadiusKm()); });
    }

    host.querySelector('#enJpFitAllBtn')?.addEventListener('click', () => {
      mapCfg.stepIdx = RADIUS_STEPS.length - 1;
      saveMapCfg();
      if (slider) slider.value = String(mapCfg.stepIdx);
      updateRadiusVisualsLive(0, host);
      fitMapToRadius(0);
    });
    host.querySelector('#enJpFitBaseBtn')?.addEventListener('click', () => {
      if (getCurrentRadiusKm() === 0) {
        mapCfg.stepIdx = 4;
        saveMapCfg();
        if (slider) slider.value = '4';
        updateRadiusVisualsLive(50, host);
      }
      fitMapToRadius(getCurrentRadiusKm());
    });
  }

  function installJapanMapHookOnce() {
    if (jpMapHookInstalled) return;
    jpMapHookInstalled = true;

    if (typeof window.renderEnFeed === 'function') {
      const origFeed = window.renderEnFeed;
      window.renderEnFeed = function () {
        normalizePeopleCoords();
        const res = origFeed.apply(this, arguments);
        const wrap = document.querySelector('#view-feed .en-wrap');
        if (!wrap) return res;

        if (enViewState.enSubTab === 'people' && enViewState.peopleView === 'map') {
          wrap.querySelectorAll('[data-en-areabar="1"]').forEach(el => el.remove());
          try {
            mountJapanFutaMapView(wrap);
          } catch (err) {
            console.error('EN•joy Japan Map error:', err);
          }
        } else {
          destroyLeafletMap();
        }
        return res;
      };
    }

    // 他タブから「縁」へ戻ったときにマップが切れないよう自動リサイズ
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