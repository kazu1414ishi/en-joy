/* =========================================================
   EN•joy STEP B-2 統合コアパッチ（patch_b2_core.js v2）
   ・二重ラップ根治（モジュールフラグ＋既存バー掃除で重複ゼロ）
   ・表示範囲バーを普段は極小1行折りたたみ（タップ時のみ展開）
   ・登録フォームStep 5に「🗺️ マップ掲載 ON/OFF（地域検索は常時有効）」を追加
   ・ラボ別データ完全分離 / 全国47都道府県 / セキュリティガード / ゆる約束メモ
   ========================================================= */

(function () {
  const AREA_STORAGE_KEY = 'en_joy_area_scope_v1';
  let b2HooksInstalled = false;
  let areaBarExpanded = false; // ★普段はしまっておく（デフォルト閉）

  const DATA_SCOPE = Object.freeze({
    PUBLIC:       'PUBLIC',
    TEAM_ONLY:    'TEAM_ONLY',
    MATCHED_ONLY: 'MATCHED_ONLY'
  });

  function sanitizePlainText(str, maxLen = 2000) {
    return String(str ?? '')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .replace(/javascript\s*:/gi, 'blocked:')
      .replace(/</g, '＜')
      .replace(/>/g, '＞')
      .slice(0, maxLen);
  }

  function sanitizeUrl(url) {
    const s = String(url ?? '').trim();
    return /^https?:\/\//i.test(s) ? s : '';
  }

  function escHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function hasDangerousKeys(obj) {
    if (!obj || typeof obj !== 'object') return false;
    for (const k of Object.keys(obj)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') return true;
      if (typeof obj[k] === 'object' && hasDangerousKeys(obj[k])) return true;
    }
    return false;
  }

  window.EN_SECURITY = { DATA_SCOPE, sanitizePlainText, sanitizeUrl, escHtml, hasDangerousKeys };

  // =========================================================
  // 🗾 全国47都道府県 ＆ 地方ブロックマスタ
  // =========================================================
  const REGIONS = [
    { id: 'hokkaido_tohoku', label: '北海道・東北', prefs: ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県'] },
    { id: 'kanto',           label: '関東',         prefs: ['茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県'] },
    { id: 'chubu',           label: '中部',         prefs: ['新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県'] },
    { id: 'kinki',           label: '近畿',         prefs: ['三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県'] },
    { id: 'chugoku',         label: '中国',         prefs: ['鳥取県','島根県','岡山県','広島県','山口県'] },
    { id: 'shikoku',         label: '四国',         prefs: ['徳島県','香川県','愛媛県','高知県'] },
    { id: 'kyushu_okinawa',  label: '九州・沖縄',   prefs: ['福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'] }
  ];

  const ALL_PREFS = REGIONS.flatMap(r => r.prefs);

  const CITY_TO_PREF_HINTS = {
    '枚方': '大阪府', '寝屋川': '大阪府', '東大阪': '大阪府', '高槻': '大阪府', '交野': '大阪府', '岸和田': '大阪府', '大阪': '大阪府', '堺': '大阪府', '茨木': '大阪府',
    '京都': '京都府', '宇治': '京都府', '神戸': '兵庫県', '奈良': '奈良県', '和歌山': '和歌山県',
    '札幌': '北海道', '帯広': '北海道', '旭川': '北海道', '仙台': '宮城県',
    '渋谷': '東京都', '世田谷': '東京都', '新宿': '東京都', '東京': '東京都', '横浜': '神奈川県', 'さいたま': '埼玉県', '千葉': '千葉県',
    '長野': '長野県', '松本': '長野県', '名古屋': '愛知県', '静岡': '静岡県', '金沢': '石川県',
    '広島': '広島県', '尾道': '広島県', '岡山': '岡山県', '松山': '愛媛県', '高松': '香川県',
    '福岡': '福岡県', '糸島': '福岡県', '熊本': '熊本県', '那覇': '沖縄県'
  };

  function getRegionByPref(pref) {
    return REGIONS.find(r => r.prefs.includes(pref)) || null;
  }

  function detectAreaInfo(areaText) {
    const raw = String(areaText || '').trim();
    if (!raw) return { pref: '', regionId: '', city: '', raw: '' };

    let pref = ALL_PREFS.find(p => raw.includes(p)) || '';
    if (!pref) {
      for (const [hint, pf] of Object.entries(CITY_TO_PREF_HINTS)) {
        if (raw.includes(hint)) { pref = pf; break; }
      }
    }
    const region = pref ? getRegionByPref(pref) : null;
    const cityPart = raw.replace(pref, '').replace(/[・／/、,\s]+/g, ' ').trim();
    return { pref, regionId: region ? region.id : '', city: cityPart, raw };
  }

  const areaScope = (function loadAreaScope() {
    try {
      const saved = JSON.parse(localStorage.getItem(AREA_STORAGE_KEY) || 'null');
      if (saved && saved.range) return saved;
    } catch (e) {}
    return { pref: '大阪府', city: '寝屋川市', range: 'all' };
  })();

  function saveAreaScope() {
    try { localStorage.setItem(AREA_STORAGE_KEY, JSON.stringify(areaScope)); } catch (e) {}
  }

  function syncAreaScopeFromProfileOnce() {
    if (localStorage.getItem(AREA_STORAGE_KEY)) return;
    const profArea = (typeof state !== 'undefined' && state.profile?.area) || (typeof enViewState !== 'undefined' && enViewState.profile?.area) || '';
    const info = detectAreaInfo(profArea);
    if (info.pref) {
      areaScope.pref = info.pref;
      areaScope.city = info.city.split(' ')[0] || '';
      saveAreaScope();
    }
  }

  function matchesAreaScope(areaText) {
    if (areaScope.range === 'all') return true;
    const info = detectAreaInfo(areaText);
    if (!info.pref && !info.city) return true;

    const myRegion = getRegionByPref(areaScope.pref);
    if (areaScope.range === 'block') return !myRegion || info.regionId === myRegion.id;
    if (areaScope.range === 'pref') return !areaScope.pref || info.pref === areaScope.pref;
    if (areaScope.range === 'city') {
      const myCityKey = (areaScope.city || '').replace(/[市区町村]/g, '').trim();
      if (!myCityKey) return !areaScope.pref || info.pref === areaScope.pref;
      return info.raw.includes(myCityKey);
    }
    return true;
  }

  function getAreaRangeLabel() {
    const reg = getRegionByPref(areaScope.pref);
    if (areaScope.range === 'all') return '全国すべて';
    if (areaScope.range === 'block') return `${reg ? reg.label : '地域'}ブロック`;
    if (areaScope.range === 'pref') return areaScope.pref || '都道府県';
    return `${areaScope.pref}${areaScope.city ? ' ' + areaScope.city : ''}`;
  }

  // ★折りたたみ式（普段は1行スッキリ・タップで範囲切替が開く）
  function buildAreaFilterBarHtml(matchedCount, totalCount) {
    const reg = getRegionByPref(areaScope.pref);
    const cityBtnLbl = areaScope.city ? areaScope.city.slice(0, 6) : '地元市区';
    const prefBtnLbl = areaScope.pref ? areaScope.pref.replace(/[都府県]$/, '') : '都道府県';
    const blkBtnLbl = reg ? reg.label.split('・')[0] : 'ブロック';

    return `
      <div class="en-area-bar ${areaBarExpanded ? 'is-open' : ''}" data-en-areabar="1">
        <button type="button" class="en-area-bar-toggle" data-toggle-areabar="1">
          <span class="en-area-current">📍 ${escHtml(getAreaRangeLabel())} <span class="en-meta">(${matchedCount}/${totalCount}件)</span></span>
          <span class="en-area-caret">${areaBarExpanded ? '閉じる ▲' : '範囲 ▾'}</span>
        </button>
        <div class="en-area-drawer">
          <div class="en-area-pills">
            <button type="button" class="en-area-pill ${areaScope.range==='city'?'active':''}" data-setrange="city">${escHtml(cityBtnLbl)}</button>
            <button type="button" class="en-area-pill ${areaScope.range==='pref'?'active':''}" data-setrange="pref">${escHtml(prefBtnLbl)}</button>
            <button type="button" class="en-area-pill ${areaScope.range==='block'?'active':''}" data-setrange="block">${escHtml(blkBtnLbl)}</button>
            <button type="button" class="en-area-pill ${areaScope.range==='all'?'active':''}" data-setrange="all">全国</button>
          </div>
          <div class="en-area-foot">
            <span class="en-meta" style="font-size:10.5px;">拠点：${escHtml(areaScope.pref)} ${escHtml(areaScope.city)}</span>
            <button type="button" class="en-area-edit-btn" data-open-areaset="1">都道府県・市区を変更</button>
          </div>
        </div>
      </div>
    `;
  }

  function openAreaSettingSheet(onDone) {
    openEnSheetHtml('📍 活動エリア ＆ 表示範囲の設定', '全国47都道府県から、見たいエリアの範囲を自由に指定できます', `
      <div>
        <div class="en-meta" style="font-weight:800;margin-bottom:4px;">都道府県（全国47都道府県）</div>
        <select id="enAreaPrefSel" class="en-input-field">
          ${ALL_PREFS.map(p => `<option value="${p}" ${areaScope.pref === p ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
      </div>
      <div>
        <div class="en-meta" style="font-weight:800;margin-bottom:4px;">市区町村（任意・地元絞り込み用）</div>
        <input id="enAreaCityIn" class="en-input-field" value="${escHtml(areaScope.city)}" placeholder="例：札幌市 / 世田谷区 / 松本市 / 寝屋川市 / 糸島市">
      </div>
      <div>
        <div class="en-meta" style="font-weight:800;margin-bottom:4px;">標準の表示範囲</div>
        <select id="enAreaRangeSel" class="en-input-field">
          <option value="city"  ${areaScope.range==='city'?'selected':''}>📍 同じ市区町村のみ</option>
          <option value="pref"  ${areaScope.range==='pref'?'selected':''}>🗾 同じ都道府県</option>
          <option value="block" ${areaScope.range==='block'?'selected':''}>🧭 近隣ブロック（関東・近畿・九州など）</option>
          <option value="all"   ${areaScope.range==='all'?'selected':''}>🌐 全国すべて</option>
        </select>
      </div>
      <button type="button" class="en-act-btn primary" style="justify-content:center;" id="enAreaSaveBtn">このエリア範囲を適用する</button>
    `);

    document.getElementById('enAreaSaveBtn')?.addEventListener('click', () => {
      areaScope.pref = document.getElementById('enAreaPrefSel')?.value || '大阪府';
      areaScope.city = sanitizePlainText(document.getElementById('enAreaCityIn')?.value.trim() || '', 30);
      areaScope.range = document.getElementById('enAreaRangeSel')?.value || 'all';
      saveAreaScope();
      closeEnSheet();
      enToast(`📍 表示範囲を「${getAreaRangeLabel()}」に変更しました`);
      if (typeof onDone === 'function') onDone();
      else rerenderAreaAwareTabs();
    });
  }

  function rerenderAreaAwareTabs() {
    if (typeof renderEnFeed === 'function') renderEnFeed();
    if (typeof renderEnLab === 'function') renderEnLab();
    if (typeof renderEnShop === 'function') renderEnShop();
  }

  function bindAreaBarEvents(container) {
    if (!container) return;
    container.querySelectorAll('[data-toggle-areabar]').forEach(btn => {
      btn.onclick = () => {
        areaBarExpanded = !areaBarExpanded;
        const bar = btn.closest('.en-area-bar');
        if (bar) {
          bar.classList.toggle('is-open', areaBarExpanded);
          const caret = bar.querySelector('.en-area-caret');
          if (caret) caret.textContent = areaBarExpanded ? '閉じる ▲' : '範囲 ▾';
        }
      };
    });
    container.querySelectorAll('[data-setrange]').forEach(btn => {
      btn.onclick = () => {
        areaScope.range = btn.getAttribute('data-setrange');
        saveAreaScope();
        areaBarExpanded = false; // 選んだらスッと閉じて画面を広く保つ
        rerenderAreaAwareTabs();
      };
    });
    container.querySelectorAll('[data-open-areaset]').forEach(btn => {
      btn.onclick = () => openAreaSettingSheet(rerenderAreaAwareTabs);
    });
  }

  // =========================================================
  // 🗺️ 登録フォーム Step 5：マップ掲載 ON/OFF の選択UIを追加
  //    （嫌な人は地図に載せず、地域検索・リストにはしっかり表示）
  // =========================================================
  function syncMapOpenPreference(val) {
    const isOpen = !!val;
    if (typeof state !== 'undefined' && state.profile) {
      state.profile.mapOpen = isOpen;
      if (typeof saveProfile === 'function') saveProfile();
    }
    if (typeof enViewState !== 'undefined') {
      enViewState.mapOpen = isOpen;
      if (typeof saveEnStateLocal === 'function') saveEnStateLocal();
    }
    const grp = document.getElementById('enRegMapOpenGroup');
    if (grp) {
      grp.querySelectorAll('.seg-btn').forEach(b => {
        b.classList.toggle('active', (b.getAttribute('data-regmapopen') === '1') === isOpen);
      });
    }
  }

  function injectRegisterMapConsentUI() {
    const granGroup = document.getElementById('areaGranularityGroup');
    if (!granGroup || document.getElementById('enRegMapOpenGroup')) return;
    const parentField = granGroup.closest('.field-group');
    if (!parentField) return;

    const initVal = (typeof state !== 'undefined' && state.profile && typeof state.profile.mapOpen === 'boolean')
      ? state.profile.mapOpen
      : (typeof enViewState !== 'undefined' ? enViewState.mapOpen !== false : true);

    if (typeof state !== 'undefined' && state.profile && typeof state.profile.mapOpen !== 'boolean') {
      state.profile.mapOpen = initVal;
    }

    const box = document.createElement('div');
    box.className = 'field-group';
    box.innerHTML = `
      <label class="field-label">🗺️ 日本地図（職種マップ）への掲載</label>
      <div class="segment-group" id="enRegMapOpenGroup">
        <button type="button" class="seg-btn ${initVal ? 'active' : ''}" data-regmapopen="1">🗺️ マップに載せる（市町村のみ）</button>
        <button type="button" class="seg-btn ${!initVal ? 'active' : ''}" data-regmapopen="0">🔒 マップには載せない</button>
      </div>
      <p class="mini-note" style="margin-top:5px;">
        ※「載せない」を選んでも、<strong>その地域の検索・おすすめリストにはしっかり表示</strong>されます。どちらを選んでも詳細住所は非公開です。
      </p>
    `;
    parentField.after(box);

    box.querySelectorAll('[data-regmapopen]').forEach(btn => {
      btn.onclick = () => {
        const next = btn.getAttribute('data-regmapopen') === '1';
        syncMapOpenPreference(next);
        if (typeof showToast === 'function') {
          showToast(next
            ? '🗺️ マップ掲載をONにしました（市町村エリアのみ表示）'
            : '🔒 マップ非掲載にしました（地域検索・リストには表示されます）');
        }
      };
    });
  }

  function ensureNationwideSamples() {
    if (typeof enViewState !== 'undefined' && Array.isArray(enViewState.tweets)) {
      const addTw = [
        { id: 'tw-jp-hokkaido', category: 'trouble', author: '十勝ひまわり牧場', role: '一次産業・酪農', area: '北海道 帯広市', iconType: 'farm', avatar: EN_IMAGES.userFarm, time: '2時間前', text: '濃厚な放牧牛乳が今月多めに採れています！全国発送できる焼き菓子・アイス工房さんと小ロットコラボしたいです。', photo: EN_IMAGES.jam, likes: 29, comments: 4 },
        { id: 'tw-jp-tokyo', category: 'idea', author: '下北沢クラフトスタンド', role: '店舗・テスト販売', area: '東京都 世田谷区', iconType: 'design', avatar: EN_IMAGES.userDes, time: '4時間前', text: '週末の店頭ポップアップ棚に全国のこだわり小ロット無添加おやつを置ける枠が2つ空きました！地方の農家さん大歓迎です。', photo: EN_IMAGES.package, likes: 37, comments: 6 },
        { id: 'tw-jp-fukuoka', category: 'want', author: 'あおい（カフェ店主）', role: '買い手・飲食店', area: '福岡県 糸島市', iconType: 'greet', avatar: EN_IMAGES.userBuyer, time: '6時間前', text: '【ほしい！】九州産の規格外フルーツを使った無添加クラフトシロップ、うちのカフェの季節ドリンクで出したいです！', photo: EN_IMAGES.citrus, likes: 33, comments: 5 }
      ];
      addTw.forEach(t => { if (!enViewState.tweets.some(x => x.id === t.id)) enViewState.tweets.push(t); });
    }

    if (typeof EN_MOCK_PEOPLE !== 'undefined' && Array.isArray(EN_MOCK_PEOPLE)) {
      const addPeople = [
        { id: 'usr-jp-01', name: '鈴木 健太', shop: '信州フルーツ乾燥工房', category: 'factory', categoryLabel: '加工・製造', area: '長野県 松本市', avatar: EN_IMAGES.userFact, canDo: 'りんご・ぶどう等の低温ドライ加工（全国クール便試作OK）', aiMatch: '全国の果実農家と相性抜群！小ロット10kgから対応', detail: { equipment: '大型低温乾燥機・真空包装機', pastLabs: 9, replySpeed: '24時間以内に返信' }, mapOpen: true, mapPos: { x: 64, y: 42 } },
        { id: 'usr-jp-02', name: '中村 彩', shop: 'TOKYOパッケージ企画室', category: 'design', categoryLabel: 'デザイン・印刷', area: '東京都 渋谷区', avatar: EN_IMAGES.userDes, canDo: '全国配送向けクラフト箱・オンライン完結のラベル設計', aiMatch: '都会のギフト需要に刺さる見せ方を一緒に作ってくれます', detail: { equipment: 'オンライン打合せ・小ロット印刷連携', pastLabs: 11, replySpeed: '平日午前中に即レス' }, mapOpen: true, mapPos: { x: 78, y: 54 } },
        { id: 'usr-jp-03', name: '森田 大輔', shop: '糸島サンライズ農園', category: 'farm', categoryLabel: '一次産業・農家', area: '福岡県 糸島市', avatar: EN_IMAGES.userFarm, canDo: '完熟あまおう・柑橘の冷凍ピューレ＆規格外素材供給', aiMatch: 'スピード感ある試作でヒット商品を連発する頼れる農家', detail: { equipment: '急速冷凍庫・全国冷凍発送対応', pastLabs: 6, replySpeed: '夕方以降に返信' }, mapOpen: true, mapPos: { x: 18, y: 74 } },
        // ★テスト確認用：マップ非掲載（mapOpen: false）だけど地域検索・リストにはしっかり表示される見本
        { id: 'usr-nomap-01', name: '小林 恵', shop: 'ひらかた無添加ジャム工房（地図非掲載）', category: 'factory', categoryLabel: '加工・製造', area: '大阪府 枚方市', avatar: EN_IMAGES.userFact, canDo: '自宅併設の小規模許可キッチンで20瓶からの極小ロット試作に対応', aiMatch: '地図には出さない設定ですが、枚方・大阪エリアの地域検索にはしっかりヒットします！', detail: { equipment: '小規模許可キッチン・瓶詰殺菌器', pastLabs: 4, replySpeed: '夜に返信' }, mapOpen: false, mapPos: { x: 68, y: 26 } }
      ];
      addPeople.forEach(p => { if (!EN_MOCK_PEOPLE.some(x => x.id === p.id)) EN_MOCK_PEOPLE.push(p); });
    }

    if (typeof enViewState !== 'undefined' && Array.isArray(enViewState.labs)) {
      const addLabs = [
        { id: 'lab-pub-jp1', mode: 'discover', fanPublic: true, title: '信州・傷ありサンふじの無添加アップルチップス', photo: EN_IMAGES.snack, status: '試作中', recruiting: 'パッケージデザイン・都内試食販売', area: '長野県 松本市', tags: ['一次産業', 'ファン投票中'] },
        { id: 'lab-pub-jp2', mode: 'discover', fanPublic: true, title: '糸島あまおう×クラフト炭酸シロップ開発', photo: EN_IMAGES.jam, status: 'アイディア中', recruiting: '瓶詰め加工・ラベル印刷', area: '福岡県 糸島市', tags: ['加工・製造', 'ファン投票中'] }
      ];
      addLabs.forEach(l => { if (!enViewState.labs.some(x => x.id === l.id)) enViewState.labs.push(l); });
    }

    if (typeof EN_MOCK_EVENTS !== 'undefined' && Array.isArray(EN_MOCK_EVENTS)) {
      const addEvs = [
        { day: 14, date: '12/14(日) 11:00〜17:00', area: '東京都 世田谷区・下北沢広場', title: '全国クラフトフード＆農家マルシェTOKYO', note: '地方枠あり・委託出品OK' },
        { day: 20, date: '12/20(土) 10:00〜15:00', area: '福岡県 糸島市・海辺のマルシェ', title: '糸島ウィンター農産クラフト市', note: '試食ブース完備' },
        { day: 21, date: '12/21(日) 10:00〜16:00', area: '長野県 松本市・駅前テラス', title: '信州冬の収穫＆無添加おやつ市', note: '初出店サポートあり' }
      ];
      addEvs.forEach(ev => { if (!EN_MOCK_EVENTS.some(x => x.title === ev.title)) EN_MOCK_EVENTS.push(ev); });
    }
  }

  // =========================================================
  // 🔒 ラボ別データ完全分離
  // =========================================================
  let currentBoundLabId = null;

  function createDefaultPromise() {
    return {
      costRule: '初回試作の素材は提供側が実費負担、加工・包材費は参加メンバーで折半（上限はルーム設定の試作予算内）',
      profitSplit: '売上から原材料・加工費・包材・送料を差し引いた粗利を「素材35%：加工40%：デザイン・販売25%」目安で分配',
      ipRule: 'コラボ中は共同商品として販売。終了時はレシピ・素材ノウハウは加工/農家へ、デザイン原版は制作者へ帰属',
      exitRule: '中止・抜ける場合は1週間前までにルームで相談し、発生済みの実費のみ精算して円満終了',
      revision: 1,
      updatedAt: '',
      agreements: [
        { id: 'me',       name: 'あなた（オーナー）', agreed: false, agreedAt: '', agreedRev: 0 },
        { id: 'partner1', name: '素材パートナー',     agreed: true,  agreedAt: '初回合意済', agreedRev: 1 },
        { id: 'partner2', name: '加工・デザイン担当', agreed: false, agreedAt: '', agreedRev: 0 }
      ]
    };
  }

  function ensureIsolatedLabData(labId) {
    const lab = (typeof enViewState !== 'undefined' && Array.isArray(enViewState.labs))
      ? (enViewState.labs.find(l => l.id === labId) || enViewState.labs[0])
      : null;
    if (!lab || typeof getRoomProData !== 'function') return null;
    const d = getRoomProData(lab.id);

    if (!Array.isArray(d.roomMessages)) {
      d.roomMessages = (lab.id === 'lab-001' && Array.isArray(enViewState.roomMessages) && enViewState.roomMessages.length)
        ? JSON.parse(JSON.stringify(enViewState.roomMessages))
        : [{ sender: 'システム', me: false, text: `🔒「${lab.title}」専用の非公開トークルームが開設されました` }];
    }
    if (!Array.isArray(d.roomTasks)) {
      d.roomTasks = (lab.id === 'lab-001' && Array.isArray(enViewState.roomTasks) && enViewState.roomTasks.length)
        ? JSON.parse(JSON.stringify(enViewState.roomTasks))
        : [
            { id: 't-' + lab.id + '-1', text: 'ゆる約束メモ（試作費・利益分配）をメンバーで確認する', done: false },
            { id: 't-' + lab.id + '-2', text: '初回試作のコンセプトと目標原価を決める', done: false }
          ];
    }
    if (!Array.isArray(d.decisionMemos)) {
      d.decisionMemos = (lab.id === 'lab-001' && enViewState.roomBoards?.[0]?.items) ? [...enViewState.roomBoards[0].items] : [];
    }
    if (typeof d.publicStory !== 'string') {
      d.publicStory = lab.id === 'lab-001'
        ? '完熟トマトの甘みをそのまま閉じ込めた、無添加おやつを開発中です！応援＆パッケージ投票お待ちしています。'
        : `「${lab.title}」をチームで開発中です！完成をお楽しみに。`;
    }
    if (!d.promise || typeof d.promise !== 'object') d.promise = createDefaultPromise();
    if (!d.activeTools.includes('promise')) d.activeTools.push('promise');
    return d;
  }

  function bindLabContext(labId) {
    if (!labId || typeof enViewState === 'undefined') return null;
    const d = ensureIsolatedLabData(labId);
    if (!d) return null;
    currentBoundLabId = labId;
    enViewState.roomMessages = d.roomMessages;
    enViewState.roomTasks = d.roomTasks;
    if (!Array.isArray(enViewState.roomBoards) || !enViewState.roomBoards.length) {
      enViewState.roomBoards = [{ name: '📌 ルーム内決定メモ（非公開）', items: d.decisionMemos }];
    } else {
      enViewState.roomBoards[0].name = '📌 ルーム内決定メモ（非公開）';
      enViewState.roomBoards[0].items = d.decisionMemos;
    }
    return d;
  }

  function persistCurrentLabContext() {
    if (!currentBoundLabId || typeof getRoomProData !== 'function') return;
    const d = getRoomProData(currentBoundLabId);
    if (!d) return;
    d.roomMessages = enViewState.roomMessages;
    d.roomTasks = enViewState.roomTasks;
    if (enViewState.roomBoards?.[0]) d.decisionMemos = enViewState.roomBoards[0].items;
    if (typeof saveRoomProStore === 'function') saveRoomProStore();
  }

  // =========================================================
  // 🤝 コラボ「ゆる約束メモ」ボード
  // =========================================================
  if (typeof EN_TOOL_CATALOG !== 'undefined' && !EN_TOOL_CATALOG.some(t => t.id === 'promise')) {
    EN_TOOL_CATALOG.splice(2, 0, {
      id: 'promise', icon: '🤝', name: 'ゆる約束メモ', cat: '企画・戦略',
      desc: '試作費・利益分配・レシピ権利・解散ルールを揉める前に1枚で合意（TEAM_ONLY）'
    });
  }

  function renderPromiseBoardHtml(labId, d) {
    const pr = d.promise || createDefaultPromise();
    const isPinned = d.pinnedTools.includes('promise');
    const pinBtn = `<button class="en-act-btn" style="padding:4px 8px;font-size:11px;" onclick="togglePinCurrent('${labId}','promise')">${isPinned?'📌 固定中':'📌 固定'}</button>`;
    const agreedCnt = pr.agreements.filter(a => a.agreed && a.agreedRev === pr.revision).length;
    const allAgreed = pr.agreements.length > 0 && agreedCnt === pr.agreements.length;
    const hasStale = pr.agreements.some(a => a.agreed && a.agreedRev !== pr.revision);

    return `
      <div class="card en-card" id="enPromiseCard">
        <div class="en-between">
          <div class="en-title">🤝 ゆる約束メモ（合意 ${agreedCnt}/${pr.agreements.length}）</div>
          <div class="en-row" style="gap:5px;"><span class="en-scope-badge team">🔒 TEAM_ONLY</span>${pinBtn}</div>
        </div>
        <div class="en-meta">売れ始めてから揉めないための「事前の安心メモ」です。項目を書き換えると自動で再確認ステータスになります（外部非公開）。</div>
        <div class="en-promise-grid">
          <div class="en-promise-item"><label>💰 ① 試作の初期費用負担（材料・加工費・包材）</label><textarea class="en-input-field" rows="2" data-prfield="costRule">${escHtml(pr.costRule)}</textarea></div>
          <div class="en-promise-item"><label>📊 ② 売れたときの利益分配ルール（原価差引後）</label><textarea class="en-input-field" rows="2" data-prfield="profitSplit">${escHtml(pr.profitSplit)}</textarea></div>
          <div class="en-promise-item"><label>📖 ③ レシピ・デザイン・商品名の扱い（権利帰属）</label><textarea class="en-input-field" rows="2" data-prfield="ipRule">${escHtml(pr.ipRule)}</textarea></div>
          <div class="en-promise-item"><label>🚪 ④ 途中で止める・抜けるときの円満ルール</label><textarea class="en-input-field" rows="2" data-prfield="exitRule">${escHtml(pr.exitRule)}</textarea></div>
        </div>
        <div class="en-promise-agree-box ${allAgreed ? 'all-ok' : ''}">
          <div class="en-between">
            <strong style="font-size:12.5px;">${allAgreed ? '✅ 全メンバー合意済み（v' + pr.revision + '）' : '☑️ メンバー合意チェック（最新版 v' + pr.revision + '）'}</strong>
            <span class="en-meta">${pr.updatedAt ? '更新: ' + escHtml(pr.updatedAt) : '初期ドラフト'}</span>
          </div>
          ${hasStale ? `<div class="en-promise-changed-warn">⚠️ 約束内容が編集されました。最新版（v${pr.revision}）の内容を再確認して合意ボタンを押してください。</div>` : ''}
          ${pr.agreements.map((ag, i) => {
            const isCurrentOk = ag.agreed && ag.agreedRev === pr.revision;
            return `
              <div class="en-promise-agree-row">
                <div><strong>${escHtml(ag.name)}</strong><div class="en-meta" style="font-size:10.5px;">${isCurrentOk ? `✓ 合意済（${escHtml(ag.agreedAt)}）` : (ag.agreed ? '🔄 内容変更のため再確認待ち' : '未確認')}</div></div>
                <button type="button" class="en-act-btn ${isCurrentOk ? 'primary' : ''}" style="padding:5px 10px;font-size:11px;" data-pragree="${i}">${isCurrentOk ? '✓ 合意済' : '納得・合意する'}</button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function bindPromiseBoardEvents(labId, d) {
    const card = document.getElementById('enPromiseCard');
    if (!card || !d.promise) return;
    const pr = d.promise;

    card.querySelectorAll('[data-prfield]').forEach(ta => {
      ta.onchange = e => {
        const key = ta.getAttribute('data-prfield');
        const nextVal = sanitizePlainText(e.target.value, 500);
        if (pr[key] !== nextVal) {
          pr[key] = nextVal;
          pr.revision = (pr.revision || 1) + 1;
          const now = new Date();
          pr.updatedAt = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
          if (typeof saveRoomProStore === 'function') saveRoomProStore();
          enToast(`🔄 ゆる約束メモを v${pr.revision} に更新（メンバーへ再確認マーク）`);
          window.renderEnRoomModal();
        }
      };
    });

    card.querySelectorAll('[data-pragree]').forEach(btn => {
      btn.onclick = () => {
        const ag = pr.agreements[Number(btn.getAttribute('data-pragree'))];
        if (!ag) return;
        const alreadyOk = ag.agreed && ag.agreedRev === pr.revision;
        if (alreadyOk) { ag.agreed = false; ag.agreedAt = ''; ag.agreedRev = 0; }
        else {
          const now = new Date();
          ag.agreed = true; ag.agreedRev = pr.revision;
          ag.agreedAt = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        }
        if (typeof saveRoomProStore === 'function') saveRoomProStore();
        enToast(ag.agreed ? `🤝 ${ag.name} が合意しました！` : `合意を取り消しました`);
        window.renderEnRoomModal();
      };
    });
  }

  function enforcePublicBoundaryOnFanView(modal, lab, d) {
    if (!modal || !enViewState.roomViewAsFan) return;
    const body = modal.querySelector('#enRoomBody');
    const firstCard = body?.querySelector('.card.en-card');
    if (!firstCard) return;

    firstCard.querySelectorAll('.en-formula, .en-story-shots').forEach(el => el.remove());
    if (!firstCard.querySelector('.en-public-guard-note')) {
      const pubBox = document.createElement('div');
      pubBox.className = 'en-formula';
      pubBox.innerHTML = `<div class="en-between"><strong>📣 チームからの公開メッセージ</strong><span class="en-scope-badge public">🌐 PUBLIC</span></div><div>${escHtml(d.publicStory || '開発ストーリーを準備中です！')}</div>`;
      const guard = document.createElement('div');
      guard.className = 'en-public-guard-note';
      guard.innerHTML = '🛡️ <strong>情報保護中：</strong>ルーム内のトーク・決定メモ・原価・ゆる約束（<code>TEAM_ONLY</code>）や連絡先（<code>MATCHED_ONLY</code>）は外部画面へ一切表示されません。';
      firstCard.appendChild(pubBox);
      firstCard.appendChild(guard);
    }
  }

  function injectPublicStoryEditorInSettings(modal, lab, d) {
    if (!modal || enViewState.roomViewAsFan || enViewState.roomTab !== 'detail') return;
    const body = modal.querySelector('#enRoomBody');
    if (!body || body.querySelector('#enPublicStoryCard')) return;

    const card = document.createElement('div');
    card.id = 'enPublicStoryCard';
    card.className = 'card en-card';
    card.innerHTML = `
      <div class="en-between"><div class="en-title">🌐 外見え画面の公開紹介文</div><span class="en-scope-badge public">PUBLIC のみ外部表示</span></div>
      <div class="en-meta">「👀 外見え」画面に表示される文章です。ファンに見せたい内容だけここに書きます。</div>
      <textarea id="enPublicStoryIn" class="en-input-field" rows="2">${escHtml(d.publicStory || '')}</textarea>
    `;
    body.appendChild(card);
    document.getElementById('enPublicStoryIn')?.addEventListener('change', e => {
      d.publicStory = sanitizePlainText(e.target.value, 400);
      if (typeof saveRoomProStore === 'function') saveRoomProStore();
      enToast('🌐 外見え画面の公開紹介文（PUBLIC）を更新しました');
    });
  }

  function buildScopedBackup(mode) {
    if (mode === 'public_only') {
      return {
        app: 'EN•joy', version: 3, scope: DATA_SCOPE.PUBLIC, exportedAt: new Date().toISOString(),
        publicProfile: { name: enViewState.profile?.name || '', area: enViewState.profile?.area || '', mainRoleLabel: enViewState.profile?.mainRoleLabel || '', diagBadge: enViewState.workDiagMeta?.badge || '' },
        areaScope: { ...areaScope }
      };
    }
    persistCurrentLabContext();
    return {
      app: 'EN•joy', version: 3, scope: 'FULL_PRIVATE_BACKUP', exportedAt: new Date().toISOString(),
      areaScope: { ...areaScope },
      fullState: JSON.parse(localStorage.getItem('en_joy_full_state_v1') || 'null'),
      roomPro: JSON.parse(localStorage.getItem('en_joy_room_pro_v2') || 'null'),
      regProfile: (typeof state !== 'undefined' && state.profile) ? state.profile : null,
      workDiag: (typeof v6 !== 'undefined' && v6.workDiag) ? v6.workDiag : null,
      enMeta: (typeof v6 !== 'undefined' && v6.enMeta) ? v6.enMeta : null,
      theme: localStorage.getItem('en_theme_v1')
    };
  }

  function openSecureMigrationSheet() {
    openEnSheetHtml('📦 全データ移行（安全スコープ選択）', '機密を含む完全バックアップと、公開情報のみの書き出しを分離しています', `
      <div class="en-meta" style="font-weight:800;">① 自分の機種変更用（全データ・取扱注意）</div>
      <div class="en-mig-row">
        <button type="button" class="en-act-btn primary" style="justify-content:center;" id="enB2DlFull">🔒 完全版JSON保存</button>
        <button type="button" class="en-act-btn" style="justify-content:center;" id="enB2CpFull">📋 完全版コピー</button>
      </div>
      <div class="en-meta" style="font-weight:800;margin-top:4px;">② テスト提出・外部共有用（機密を自動除外）</div>
      <button type="button" class="en-act-btn" style="justify-content:center;" id="enB2DlPub">🌐 PUBLIC情報のみJSON保存（連絡先・トーク除外）</button>
      <div class="en-meta" style="font-weight:800;margin-top:6px;">③ バックアップから安全復元（形式検証つき）</div>
      <label class="en-act-btn" style="justify-content:center;cursor:pointer;" for="enB2FileIn">📁 JSONファイルから復元</label>
      <input id="enB2FileIn" type="file" accept=".json,application/json" style="display:none;">
      <textarea id="enB2RestoreTxt" class="en-input-field" rows="3" placeholder="またはバックアップコードを貼り付け..."></textarea>
      <button type="button" class="en-act-btn primary" style="justify-content:center;" id="enB2RestoreBtn">📥 検証してデータを復元</button>
    `);

    const downloadObj = (obj, fname) => {
      const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fname; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    };
    const doRestore = (rawText) => {
      const parsed = JSON.parse(rawText);
      if (!parsed || typeof parsed !== 'object' || hasDangerousKeys(parsed)) throw new Error('unsafe');
      if (parsed.scope === DATA_SCOPE.PUBLIC) {
        if (parsed.areaScope) { Object.assign(areaScope, parsed.areaScope); saveAreaScope(); }
        closeEnSheet(); rerenderAreaAwareTabs();
        enToast('🌐 PUBLICエリア設定を反映しました');
        return;
      }
      if (parsed.areaScope) { Object.assign(areaScope, parsed.areaScope); saveAreaScope(); }
      if (parsed.fullState) localStorage.setItem('en_joy_full_state_v1', JSON.stringify(parsed.fullState));
      if (parsed.roomPro) { localStorage.setItem('en_joy_room_pro_v2', JSON.stringify(parsed.roomPro)); if (typeof loadRoomProStore === 'function') loadRoomProStore(); }
      if (parsed.regProfile && typeof state !== 'undefined') { state.profile = Object.assign({}, state.profile, parsed.regProfile); if (typeof saveProfile === 'function') saveProfile(); }
      if (parsed.workDiag && typeof v6 !== 'undefined') { v6.workDiag = parsed.workDiag; if (parsed.enMeta) v6.enMeta = parsed.enMeta; if (typeof v6SaveAll === 'function') v6SaveAll(); }
      if (parsed.theme) localStorage.setItem('en_theme_v1', parsed.theme);
      closeEnSheet(); enToast('🎉 検証クリア！全データを復元して再読み込みします');
      setTimeout(() => location.reload(), 550);
    };

    const todayStr = new Date().toISOString().slice(0, 10);
    document.getElementById('enB2DlFull')?.addEventListener('click', () => { downloadObj(buildScopedBackup('full'), `ENjoy_FULL_PRIVATE_${todayStr}.json`); enToast('🔒 完全版バックアップを保存しました'); });
    document.getElementById('enB2CpFull')?.addEventListener('click', async () => {
      const s = JSON.stringify(buildScopedBackup('full'));
      try { await navigator.clipboard.writeText(s); enToast('📋 完全版コードをコピーしました'); }
      catch { const t = document.getElementById('enB2RestoreTxt'); if (t) t.value = s; }
    });
    document.getElementById('enB2DlPub')?.addEventListener('click', () => { downloadObj(buildScopedBackup('public_only'), `ENjoy_PUBLIC_ONLY_${todayStr}.json`); enToast('🌐 PUBLICデータのみ保存しました'); });
    document.getElementById('enB2FileIn')?.addEventListener('change', e => {
      const f = e.target.files?.[0]; if (!f) return;
      const r = new FileReader(); r.onload = ev => { try { doRestore(ev.target.result); } catch { enToast('⚠️ 不正または破損したファイルのため復元を中止しました'); } };
      r.readAsText(f);
    });
    document.getElementById('enB2RestoreBtn')?.addEventListener('click', () => {
      try { doRestore(document.getElementById('enB2RestoreTxt')?.value.trim() || ''); }
      catch { enToast('⚠️ 不正なバックアップコードのため復元を中止しました'); }
    });
  }

  // =========================================================
  // 🔌 フック装着（絶対1回のみ実行＝二重バー根治！）
  // =========================================================
  function installB2HooksOnce() {
    if (b2HooksInstalled) return;
    b2HooksInstalled = true;

    window.openDataMigrationSheet = openSecureMigrationSheet;

    if (typeof window.getBoardItemCount === 'function') {
      const origCnt = window.getBoardItemCount;
      window.getBoardItemCount = function (d, tid) {
        if (tid === 'promise') {
          const pr = d?.promise;
          if (!pr) return '未合意';
          return `${pr.agreements.filter(a => a.agreed && a.agreedRev === pr.revision).length}/${pr.agreements.length}合意`;
        }
        return origCnt.apply(this, arguments);
      };
    }

    if (typeof window.renderSelectedToolBody === 'function') {
      const origBody = window.renderSelectedToolBody;
      window.renderSelectedToolBody = function (labId, d) {
        if (d && d.selectedTool === 'promise') { ensureIsolatedLabData(labId); return renderPromiseBoardHtml(labId, d); }
        return origBody.apply(this, arguments);
      };
    }

    if (typeof window.openEnRoomModal === 'function') {
      const origOpen = window.openEnRoomModal;
      window.openEnRoomModal = function (labId) {
        persistCurrentLabContext();
        bindLabContext(labId);
        return origOpen.apply(this, arguments);
      };
    }

    if (typeof window.renderEnRoomModal === 'function') {
      const origRender = window.renderEnRoomModal;
      window.renderEnRoomModal = function () {
        const labId = (typeof enViewState !== 'undefined' && enViewState.roomOpenId) || enViewState.labs?.[0]?.id;
        const d = labId ? bindLabContext(labId) : null;
        const res = origRender.apply(this, arguments);
        const modal = document.getElementById('en-room-modal');
        const lab = enViewState.labs.find(l => l.id === labId) || enViewState.labs[0];
        if (modal && lab && d) {
          if (enViewState.roomViewAsFan) enforcePublicBoundaryOnFanView(modal, lab, d);
          else {
            if (enViewState.roomTab === 'board' && d.selectedTool === 'promise') bindPromiseBoardEvents(lab.id, d);
            if (enViewState.roomTab === 'detail') injectPublicStoryEditorInSettings(modal, lab, d);
          }
          persistCurrentLabContext();
        }
        return res;
      };
    }

    ['toggleRoomTask', 'sendMsgToBoard', 'sendMsgToTask'].forEach(fnName => {
      if (typeof window[fnName] === 'function') {
        const orig = window[fnName];
        window[fnName] = function () { const res = orig.apply(this, arguments); persistCurrentLabContext(); return res; };
      }
    });

    // 縁を繋げる：既存エリアバーを必ず掃除して1個だけ挿入（マップ時は非表示！）
    if (typeof window.renderEnFeed === 'function') {
      const origFeed = window.renderEnFeed;
      window.renderEnFeed = function () {
        const origTweets = enViewState.tweets;
        const origPeopleCopy = [...EN_MOCK_PEOPLE];
        const filteredTweets = origTweets.filter(t => matchesAreaScope(t.area));
        const filteredPeople = origPeopleCopy.filter(p => matchesAreaScope(p.area));
        const isTweet = enViewState.enSubTab === 'tweet';
        const isMapView = !isTweet && enViewState.peopleView === 'map';

        let res;
        try {
          enViewState.tweets = filteredTweets;
          // ★マップ画面は独自の半径ゲージで全国探索するため、ここでは都道府県絞り込みをかけず全候補を渡す
          if (!isMapView) {
            EN_MOCK_PEOPLE.length = 0;
            filteredPeople.forEach(p => EN_MOCK_PEOPLE.push(p));
            if (!EN_MOCK_PEOPLE.length) EN_MOCK_PEOPLE.push(origPeopleCopy[0]);
          }
          res = origFeed.apply(this, arguments);
        } finally {
          enViewState.tweets = origTweets;
          EN_MOCK_PEOPLE.length = 0;
          origPeopleCopy.forEach(p => EN_MOCK_PEOPLE.push(p));
        }

        const wrap = document.querySelector('#view-feed .en-wrap');
        if (wrap) {
          wrap.querySelectorAll('[data-en-areabar="1"]').forEach(el => el.remove());
          // ★おすすめ人材のマップ画面ではエリアバーを出さない（半径ゲージへ一本化）
          if (!isMapView) {
            const cnt = isTweet ? filteredTweets.length : filteredPeople.length;
            const tot = isTweet ? origTweets.length : origPeopleCopy.length;
            const tmp = document.createElement('div');
            tmp.innerHTML = buildAreaFilterBarHtml(cnt, tot);
            const bar = tmp.firstElementChild;
            const firstTabs = wrap.querySelector('.en-subtabs');
            if (firstTabs) firstTabs.after(bar);
            else wrap.prepend(bar);
            bindAreaBarEvents(bar);

            if (cnt === 0) {
              const empty = document.createElement('div');
              empty.className = 'en-area-empty';
              empty.innerHTML = `<div>「${escHtml(getAreaRangeLabel())}」にはまだ投稿がありません</div><button type="button" class="en-act-btn primary" data-setrange="all">🌐 全国すべてを表示する</button>`;
              wrap.appendChild(empty);
              bindAreaBarEvents(empty);
            }
          }
        }
        return res;
      };
    }

    if (typeof window.renderEnLab === 'function') {
      const origLab = window.renderEnLab;
      window.renderEnLab = function () {
        if (enViewState.labSubTab !== 'discover') return origLab.apply(this, arguments);
        const origLabs = enViewState.labs;
        const allDiscover = origLabs.filter(l => l.mode === 'discover');
        const matchedDiscover = allDiscover.filter(l => matchesAreaScope(l.area));
        let res;
        try {
          enViewState.labs = origLabs.filter(l => l.mode !== 'discover' || matchesAreaScope(l.area));
          res = origLab.apply(this, arguments);
        } finally {
          enViewState.labs = origLabs;
        }
        const wrap = document.querySelector('#view-en .en-wrap');
        if (wrap) {
          wrap.querySelectorAll('[data-en-areabar="1"]').forEach(el => el.remove());
          const tmp = document.createElement('div');
          tmp.innerHTML = buildAreaFilterBarHtml(matchedDiscover.length, allDiscover.length);
          const bar = tmp.firstElementChild;
          const firstTabs = wrap.querySelector('.en-subtabs');
          if (firstTabs) firstTabs.after(bar);
          else wrap.prepend(bar);
          bindAreaBarEvents(bar);
          if (matchedDiscover.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'en-area-empty';
            empty.innerHTML = `<div>「${escHtml(getAreaRangeLabel())}」の公開ラボはまだありません</div><button type="button" class="en-act-btn primary" data-setrange="all">🌐 全国の公開ラボを見る</button>`;
            wrap.appendChild(empty);
            bindAreaBarEvents(empty);
          }
        }
        return res;
      };
    }

    if (typeof window.renderEnShop === 'function') {
      const origShop = window.renderEnShop;
      window.renderEnShop = function () {
        const origEventsCopy = [...EN_MOCK_EVENTS];
        const allMarcheEvs = origEventsCopy.filter(e => e.area !== 'ラボ締切');
        const matchedEvs = allMarcheEvs.filter(e => matchesAreaScope(e.area));
        let res;
        try {
          EN_MOCK_EVENTS.length = 0;
          origEventsCopy.filter(e => e.area === 'ラボ締切' || matchesAreaScope(e.area)).forEach(e => EN_MOCK_EVENTS.push(e));
          res = origShop.apply(this, arguments);
        } finally {
          EN_MOCK_EVENTS.length = 0;
          origEventsCopy.forEach(e => EN_MOCK_EVENTS.push(e));
        }
        const sec = document.getElementById('view-shop');
        if (sec) {
          sec.querySelectorAll('.en-sec-sub, .en-subtab, .en-sec-h2').forEach(el => {
            if (el.textContent.includes('関西日程')) el.textContent = el.textContent.replace(/関西日程/g, 'マルシェ日程');
            if (el.textContent.includes('大阪・京都 週末マルシェ')) el.textContent = `📅 ${getAreaRangeLabel()}のマルシェ日程`;
          });
          if (enViewState.marcheFilter === 'event') {
            const wrap = sec.querySelector('.en-wrap');
            if (wrap) {
              wrap.querySelectorAll('[data-en-areabar="1"]').forEach(el => el.remove());
              const tmp = document.createElement('div');
              tmp.innerHTML = buildAreaFilterBarHtml(matchedEvs.length, allMarcheEvs.length);
              const bar = tmp.firstElementChild;
              const tabs = wrap.querySelector('.en-subtabs');
              if (tabs) tabs.after(bar);
              bindAreaBarEvents(bar);
            }
          }
        }
        return res;
      };
    }

    // 設定・ホーム名刺のマップON/OFFトグルと登録データ(state.profile.mapOpen)を同期
    if (typeof window.renderEnHome === 'function') {
      const origHome = window.renderEnHome;
      window.renderEnHome = function () {
        const res = origHome.apply(this, arguments);
        const btn = document.getElementById('enToggleMapBtn');
        if (btn && !btn.dataset.enMapSynced) {
          btn.dataset.enMapSynced = '1';
          btn.addEventListener('click', () => setTimeout(() => syncMapOpenPreference(enViewState.mapOpen), 10));
        }
        return res;
      };
    }

    // XSS & URL 自動無害化
    if (typeof window.submitNewTweet === 'function') {
      const origTw = window.submitNewTweet;
      window.submitNewTweet = function () {
        const inp = document.getElementById('enNewTweetText');
        if (inp) inp.value = sanitizePlainText(inp.value, 500);
        return origTw.apply(this, arguments);
      };
    }
    if (typeof window.submitNewSoloLab === 'function') {
      const origSl = window.submitNewSoloLab;
      window.submitNewSoloLab = function () {
        const t = document.getElementById('enNewLabTitle');
        const s = document.getElementById('enNewLabSeed');
        if (t) t.value = sanitizePlainText(t.value, 60);
        if (s) s.value = sanitizePlainText(s.value, 400);
        return origSl.apply(this, arguments);
      };
    }

    document.addEventListener('change', e => {
      const el = e.target;
      if (!el || !/INPUT|TEXTAREA/.test(el.tagName)) return;
      if (['enB2RestoreTxt', 'enMigRestoreTxt', 'enRestoreInput'].includes(el.id)) return;
      if (el.type === 'url') {
        const clean = sanitizeUrl(el.value);
        if (el.value.trim() && !clean) { el.value = ''; enToast('🛡️ 安全のため https:// または http:// から始まるURLのみ入力できます'); }
      } else if (!/number|date|file|checkbox|radio|range|color|hidden/i.test(el.type || 'text')) {
        if (/[<>]|javascript\s*:/i.test(el.value)) el.value = sanitizePlainText(el.value, 2000);
      }
    }, true);
  }

  window.addEventListener('DOMContentLoaded', () => {
    injectRegisterMapConsentUI();
    // patch_core_sync.js(185ms)の初期化完了後に1回だけ確実にフック装着
    setTimeout(() => {
      injectRegisterMapConsentUI();
      syncAreaScopeFromProfileOnce();
      ensureNationwideSamples();
      installB2HooksOnce();
      if (typeof enViewState !== 'undefined' && Array.isArray(enViewState.labs)) {
        enViewState.labs.filter(l => l.mode === 'my_active').forEach(l => ensureIsolatedLabData(l.id));
      }
      rerenderAreaAwareTabs();
    }, 240);
  });
})();