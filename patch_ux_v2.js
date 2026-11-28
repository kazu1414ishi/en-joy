/* =========================================================
   EN•joy UX v2 統合パッチ（patch_ux_v2.js v1）
   1) ボトムナビ「邪魔にならない自動隠蔽 × 100%確実タップ」両立
   2) タブ再編：縁(つぶやき/おすすめ人材[リスト・マップ]/AIディア) & ラボ(進行中/1人準備中)
   3) 縁を繋ぐ・いいね・保存 → 相手合意でマッチ済 → 2人専用ルーム直行（ボタン数維持）
   4) ホーム「ご縁インボックス」（相手からのリアクション ⇄ 自分発信）
   5) 全タブ共通「1本スマート検索バー」（入力欄タップで詳細絞り込み展開・IME対応）
   6) マップ拠点ピンをドラッグ＆長押し/右クリックで自由移動（自宅復帰つき）
   ・新規UIアイコンは100%純粋な統一ラインSVG
   ========================================================= */

(function () {
  const REL_STORAGE_KEY = 'en_joy_relations_v1';
  const MAP_CFG_KEY = 'en_joy_map_radius_v1';
  const FUTA_DEX_KEY = 'en_joy_futa_discovered_v1';
  const RADIUS_STEPS = [5, 10, 20, 30, 50, 100, 200, 300, 500, 0];

  let uxV2Installed = false;

  // =========================================================
  // ✒️ 統一ラインSVGアイコン辞書（絵文字ゼロ）
  // =========================================================
  const SVG_PATHS = {
    search:   `<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>`,
    sliders:  `<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>`,
    x:        `<path d="M18 6 6 18M6 6l12 12"/>`,
    heart:    `<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.3l7.8-7.8 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>`,
    bookmark: `<path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1z"/>`,
    link:     `<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.5-1.5"/>`,
    clock:    `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
    check:    `<path d="M20 6 9 17l-5-5"/>`,
    chat:     `<path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L4 20l1.1-4.2A8.5 8.5 0 1 1 21 11.5z"/>`,
    people:   `<circle cx="9" cy="8" r="3.5"/><path d="M3 19a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a4.5 4.5 0 0 1 5 4.5"/>`,
    sparkle:  `<path d="M12 3l1.8 4.8L18.5 9.5l-4.7 1.7L12 16l-1.8-4.8L5.5 9.5l4.7-1.7L12 3z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z"/>`,
    list:     `<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>`,
    map:      `<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z"/><path d="M9 3v15M15 6v15"/>`,
    pin:      `<path d="M12 21s-6-5.7-6-10a6 6 0 1 1 12 0c0 4.3-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/>`,
    target:   `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>`,
    globe:    `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>`,
    inbox:    `<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>`,
    send:     `<path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/>`,
    lock:     `<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>`,
    lab:      `<path d="M9 3h6M10 3v6.5L5.2 18.2A2 2 0 0 0 7 21h10a2 2 0 0 0 1.8-2.8L14 9.5V3"/><path d="M8.5 14h7"/>`,
    book:     `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>`,
    move:     `<path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>`,
    farm:     `<path d="M12 21V9"/><path d="M12 9c-3 0-5.5-2-6-5 3-.5 5.5 1.5 6 5z"/><path d="M12 13c3 0 5.5-2 6-5-3-.5-5.5 1.5-6 5z"/>`,
    factory:  `<path d="M3 21V10l6 4V10l6 4V6h6v15H3z"/><path d="M7 17h2M11 17h2M15 17h2"/>`,
    design:   `<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="11" cy="11" r="2"/>`,
    truck:    `<path d="M1 4h13v12H1zM14 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>`,
    shop:     `<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v8h14v-8"/>`,
    craft:    `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`
  };

  function svgIc(name, cls = '') {
    return `<svg class="en-u-svg ${cls}" viewBox="0 0 24 24" aria-hidden="true">${SVG_PATHS[name] || ''}</svg>`;
  }

  function esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  const ROLE_META = {
    farm:    { label: '一次産業・農家',   color: '#16a34a', icon: 'farm' },
    factory: { label: '加工・工房・蔵元', color: '#ea580c', icon: 'factory' },
    design:  { label: 'デザイン・印刷',   color: '#9333ea', icon: 'design' },
    truck:   { label: '物流・冷蔵便',     color: '#2563eb', icon: 'truck' },
    shop:    { label: '販売・マルシェ',   color: '#db2777', icon: 'shop' },
    craft:   { label: '木工・工芸・特技', color: '#b45309', icon: 'craft' }
  };

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
    for (const [c, p] of Object.entries(CITY_TO_PREF)) if (raw.includes(c)) return p;
    return '';
  }
  function calcDistanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371, toRad = d => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // =========================================================
  // 🧭 1. ボトムナビ「邪魔にならない自動隠蔽 × 100%確実タップ」
  // =========================================================
  function installReliableBottomNav() {
    const nav = document.getElementById('bottomNav');
    if (!nav || nav.dataset.enUxNavFixed) return;
    nav.dataset.enUxNavFixed = '1';

    // キャプチャフェーズで確実にタブ切替を発火（SVG置換等のイベント途切れゼロ）
    nav.addEventListener('click', e => {
      const btn = e.target.closest('button[data-tab]');
      if (!btn) return;
      const tab = btn.getAttribute('data-tab');
      nav.classList.remove('en-nav-retracted');
      if (typeof enViewState !== 'undefined') enViewState.activeMainTab = tab;
      if (typeof switchView === 'function') switchView(tab);
      if (typeof updateActionFab === 'function') updateActionFab();
    }, true);

    // 安定したスクロール連動（下48px連続で完全退避、上16pxまたは最上部・最下部で即復帰）
    let lastY = window.scrollY || 0;
    let accDown = 0;
    let accUp = 0;
    let retracted = false;

    const onScroll = () => {
      if (document.documentElement.classList.contains('en-pc-mode')) {
        if (retracted) { retracted = false; nav.classList.remove('en-nav-retracted'); }
        return;
      }
      const curY = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
      const docH = document.documentElement.scrollHeight;
      const winH = window.innerHeight;
      const nearTop = curY < 45;
      const nearBottom = curY + winH >= docH - 60;

      if (nearTop || nearBottom) {
        accDown = 0; accUp = 0;
        if (retracted) { retracted = false; nav.classList.remove('en-nav-retracted'); }
        lastY = curY;
        return;
      }

      const delta = curY - lastY;
      if (delta > 0) {
        accDown += delta;
        accUp = 0;
        if (!retracted && accDown > 48) {
          retracted = true;
          nav.classList.add('en-nav-retracted');
        }
      } else if (delta < 0) {
        accUp += Math.abs(delta);
        accDown = 0;
        if (retracted && accUp > 16) {
          retracted = false;
          nav.classList.remove('en-nav-retracted');
        }
      }
      lastY = curY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // =========================================================
  // 🤝 2. 関係ステータス管理（いいね / 保存 / 相談送付 / 相手合意マッチ / 2人ルーム）
  // =========================================================
  const relStore = (function loadRelStore() {
    try {
      const s = JSON.parse(localStorage.getItem(REL_STORAGE_KEY) || 'null');
      if (s && s.outgoing && s.incoming) return s;
    } catch (e) {}
    return {
      // 自分発信（相手ID -> { liked, saved, status: 'none'|'sent'|'matched', sentMsg, roomId }）
      outgoing: {
        'usr-002': { liked: true, saved: true, status: 'sent', sentMsg: '小ロット乾燥テストのご相談をお願いできますか？', roomId: '' }
      },
      // 相手からのリアクション（相手ID -> { liked, saved, status: 'none'|'received'|'matched', msg, time }）
      incoming: {
        'usr-001': { liked: true, saved: true, status: 'received', msg: '完熟トマトの規格外品でぜひコラボ試作しませんか？', time: '18分前' },
        'usr-003': { liked: true, saved: true, status: 'none', msg: '', time: '1時間前' },
        'usr-futa-kyoto': { liked: true, saved: false, status: 'none', msg: '', time: '3時間前' }
      }
    };
  })();

  function saveRelStore() {
    try { localStorage.setItem(REL_STORAGE_KEY, JSON.stringify(relStore)); } catch (e) {}
  }

  function getOutRel(pid) {
    if (!relStore.outgoing[pid]) relStore.outgoing[pid] = { liked: false, saved: false, status: 'none', sentMsg: '', roomId: '' };
    return relStore.outgoing[pid];
  }
  function getInRel(pid) {
    if (!relStore.incoming[pid]) relStore.incoming[pid] = { liked: false, saved: false, status: 'none', msg: '', time: '' };
    return relStore.incoming[pid];
  }

  // 2人の統合ステータスを算出（お互いの合意で matched！）
  function getPairStatus(pid) {
    const outR = getOutRel(pid);
    const inR = getInRel(pid);
    if (outR.status === 'matched' || inR.status === 'matched') return 'matched';
    if (inR.status === 'received') return 'received';
    if (outR.status === 'sent') return 'sent';
    return 'none';
  }

  // マッチ成立 ➔ 2人専用の進行中ルームを自動生成して返す
  function completeMutualMatch(pid, openAfter) {
    const p = (typeof EN_MOCK_PEOPLE !== 'undefined') ? EN_MOCK_PEOPLE.find(x => x.id === pid) : null;
    if (!p) return null;
    const outR = getOutRel(pid);
    const inR = getInRel(pid);

    outR.status = 'matched';
    inR.status = 'matched';

    let roomId = outR.roomId;
    if (!roomId || !enViewState.labs.some(l => l.id === roomId)) {
      roomId = 'lab-pair-' + pid;
      outR.roomId = roomId;
      const myName = (enViewState.profile?.name && enViewState.profile.name !== 'マイ名刺') ? enViewState.profile.name : 'あなた';
      const cover = p.coverPhoto || p.avatar || EN_IMAGES.tomato;

      if (!enViewState.labs.some(l => l.id === roomId)) {
        enViewState.labs.unshift({
          id: roomId,
          mode: 'my_active',
          fanPublic: false,
          isPairRoom: true,
          partnerId: pid,
          title: `${p.shop} × ${myName}`,
          photo: cover,
          urgent: true,
          unread: 1,
          badges: [{ type: 'task', label: '2人ルーム開始', targetTab: 'talk' }],
          nextDeadline: '初回あいさつ＆ゆる約束確認',
          summary: {
            flow: `${p.shop}（${p.name}）とお互いの合意でマッチ成立！`,
            decided: '2人専用の非公開ルームから企画スタート',
            next: 'トークで挨拶＆やりたいことを共有'
          }
        });
      }
      if (typeof getRoomProData === 'function') {
        const d = getRoomProData(roomId);
        if (!Array.isArray(d.roomMessages) || d.roomMessages.length <= 1) {
          d.roomMessages = [
            { sender: 'システム', me: false, text: `お互いの合意により「${p.shop}（${p.name}）」さんとマッチ成立しました！2人専用の非公開ルームです。` },
            { sender: p.shop, me: false, text: inR.msg || 'ご縁ありがとうございます！まずは気軽にアイデアからお話ししましょう。' }
          ];
          if (outR.sentMsg) {
            d.roomMessages.push({ sender: myName, me: true, text: outR.sentMsg });
          }
        }
        if (typeof saveRoomProStore === 'function') saveRoomProStore();
      }
    }

    saveRelStore();
    if (typeof renderEnHome === 'function') renderEnHome();
    if (typeof renderEnLab === 'function') renderEnLab();

    enToast(`${p.shop}さんとマッチ成立！2人専用ルームが開設されました`);
    if (openAfter && typeof openEnRoomModal === 'function') {
      openEnRoomModal(roomId, 'talk', false);
    }
    return roomId;
  }

  function openConnectRequestSheet(pid, onUpdated) {
    const p = EN_MOCK_PEOPLE.find(x => x.id === pid);
    if (!p) return;
    const status = getPairStatus(pid);
    const outR = getOutRel(pid);
    const inR = getInRel(pid);

    if (status === 'matched') {
      const rid = completeMutualMatch(pid, false);
      if (rid && typeof openEnRoomModal === 'function') openEnRoomModal(rid, 'talk', false);
      return;
    }

    if (status === 'received') {
      openEnSheetHtml(`${p.shop}さんから相談が届いています`, 'お互いの合意でマッチ成立し、2人専用ルームが開きます', `
        <div class="en-formula">
          <strong>${esc(p.name)}（${esc(p.area)}）からのメッセージ</strong>
          <div>${esc(inR.msg || 'ぜひコラボのご相談をしたいです！')}</div>
        </div>
        <button type="button" class="en-act-btn primary" style="justify-content:center;" id="enUxAcceptMatchBtn">
          ${svgIc('check')} <span>合意して繋がる（2人ルームへ）</span>
        </button>
        <button type="button" class="en-act-btn" style="justify-content:center;" id="enUxDeclineBtn">今回は見送る</button>
      `);
      document.getElementById('enUxAcceptMatchBtn')?.addEventListener('click', () => {
        closeEnSheet();
        completeMutualMatch(pid, true);
        if (onUpdated) onUpdated();
      });
      document.getElementById('enUxDeclineBtn')?.addEventListener('click', () => {
        inR.status = 'none';
        saveRelStore();
        closeEnSheet();
        enToast('リクエストを整理しました');
        if (onUpdated) onUpdated();
        if (typeof renderEnHome === 'function') renderEnHome();
      });
      return;
    }

    if (status === 'sent') {
      openEnSheetHtml(`${p.shop}さんへ相談送付済み`, '相手の合意があるとマッチ成立し、2人専用ルームが開きます', `
        <div class="en-formula">
          <strong>送信済みメッセージ</strong>
          <div>${esc(outR.sentMsg || 'ご縁を繋ぎたくてご連絡しました！')}</div>
        </div>
        <button type="button" class="en-act-btn primary" style="justify-content:center;" id="enUxDemoApproveBtn">
          ${svgIc('sparkle')} <span>テスト用：相手が合意したことにする（マッチ体験）</span>
        </button>
        <button type="button" class="en-act-btn" style="justify-content:center;" id="enUxCancelSentBtn">相談送付を取り消す</button>
      `);
      document.getElementById('enUxDemoApproveBtn')?.addEventListener('click', () => {
        closeEnSheet();
        completeMutualMatch(pid, true);
        if (onUpdated) onUpdated();
      });
      document.getElementById('enUxCancelSentBtn')?.addEventListener('click', () => {
        outR.status = 'none';
        outR.sentMsg = '';
        saveRelStore();
        closeEnSheet();
        enToast('相談送付を取り消しました');
        if (onUpdated) onUpdated();
        if (typeof renderEnHome === 'function') renderEnHome();
      });
      return;
    }

    // status === 'none'：新規相談送付
    openEnSheetHtml(`${p.shop}さんと縁を繋ぐ`, '相談を送ると相手へ通知されます（お互いの合意後にマッチ成立）', `
      <div class="en-meta">ひとこと相談メッセージ（任意・空のままでも送信OK）</div>
      <textarea id="enUxConnMsgIn" class="en-input-field" rows="3" placeholder="例：はじめまして！小ロットの試作コラボについて少しお話してみたいです。"></textarea>
      <button type="button" class="en-act-btn primary" style="justify-content:center;" id="enUxSendConnBtn">
        ${svgIc('send')} <span>相談を送る（相手に通知されます）</span>
      </button>
    `);
    document.getElementById('enUxSendConnBtn')?.addEventListener('click', () => {
      const raw = document.getElementById('enUxConnMsgIn')?.value.trim() || 'はじめまして！ぜひご縁を繋いでお話ししてみたいです。';
      outR.status = 'sent';
      outR.sentMsg = window.EN_SECURITY ? window.EN_SECURITY.sanitizePlainText(raw, 300) : raw;
      saveRelStore();
      closeEnSheet();
      enToast(`${p.shop}さんへ相談を送りました（相手へ通知済・合意待ち）`);
      if (onUpdated) onUpdated();
      if (typeof renderEnHome === 'function') renderEnHome();
    });
  }

  function getInboxStats() {
    const outVals = Object.values(relStore.outgoing || {});
    const inVals = Object.values(relStore.incoming || {});
    const allIds = new Set([...Object.keys(relStore.outgoing || {}), ...Object.keys(relStore.incoming || {})]);
    let matchedCnt = 0;
    allIds.forEach(id => { if (getPairStatus(id) === 'matched') matchedCnt++; });

    return {
      inReq:   inVals.filter(x => x.status === 'received').length,
      inLike:  inVals.filter(x => x.liked).length,
      inSave:  inVals.filter(x => x.saved).length,
      outMatch: matchedCnt,
      outSent: outVals.filter(x => x.status === 'sent').length,
      outLike: outVals.filter(x => x.liked).length,
      outSave: outVals.filter(x => x.saved).length
    };
  }

  function openEnInboxSheet(initialSide = 'in') {
    let side = initialSide;

    const renderBody = () => {
      const st = getInboxStats();
      const peopleMap = {};
      (EN_MOCK_PEOPLE || []).forEach(p => { peopleMap[p.id] = p; });

      let listHtml = '';
      if (side === 'in') {
        const entries = Object.entries(relStore.incoming || {})
          .filter(([id, v]) => peopleMap[id] && (v.status === 'received' || v.status === 'matched' || v.liked || v.saved))
          .sort((a, b) => (b[1].status === 'received' ? 1 : 0) - (a[1].status === 'received' ? 1 : 0));

        listHtml = entries.length ? entries.map(([pid, v]) => {
          const p = peopleMap[pid];
          const pairSt = getPairStatus(pid);
          const tags = [];
          if (pairSt === 'received') tags.push('相談リクエストあり');
          if (pairSt === 'matched') tags.push('マッチ済み');
          if (v.liked) tags.push('いいね');
          if (v.saved) tags.push('保存');
          return `
            <div class="en-rel-row">
              <div class="en-rel-row-head">
                <div class="en-row" style="min-width:0;">
                  <img class="en-avatar" style="width:34px;height:34px;" src="${p.avatar}" alt="">
                  <div style="min-width:0;">
                    <div class="en-title" style="font-size:13px;">${esc(p.shop)}</div>
                    <div class="en-meta">${esc(p.area)} ・ ${tags.join(' / ')}</div>
                  </div>
                </div>
                ${pairSt === 'received'
                  ? `<button type="button" class="en-act-btn primary" style="padding:5px 9px;font-size:11px;" data-inb-act="${pid}">${svgIc('check','sm')} 合意</button>`
                  : pairSt === 'matched'
                    ? `<button type="button" class="en-act-btn primary" style="padding:5px 9px;font-size:11px;background:#059669;" data-inb-act="${pid}">${svgIc('chat','sm')} 2人ルーム</button>`
                    : `<button type="button" class="en-act-btn" style="padding:5px 9px;font-size:11px;" data-inb-act="${pid}">${svgIc('link','sm')} 縁を繋ぐ</button>`}
              </div>
              ${v.msg ? `<div class="en-meta" style="color:var(--en-text);">${esc(v.msg)}</div>` : ''}
            </div>
          `;
        }).join('') : '<div class="en-meta">相手からのリアクションはまだありません</div>';
      } else {
        const allOutIds = Array.from(new Set([...Object.keys(relStore.outgoing || {}), ...Object.keys(relStore.incoming || {})]))
          .filter(id => {
            if (!peopleMap[id]) return false;
            const o = getOutRel(id);
            const ps = getPairStatus(id);
            return ps === 'matched' || o.status === 'sent' || o.liked || o.saved;
          });

        listHtml = allOutIds.length ? allOutIds.map(pid => {
          const p = peopleMap[pid];
          const o = getOutRel(pid);
          const pairSt = getPairStatus(pid);
          const tags = [];
          if (pairSt === 'matched') tags.push('マッチ済み');
          else if (o.status === 'sent') tags.push('相談送付済');
          if (o.liked) tags.push('いいね済');
          if (o.saved) tags.push('保存済');
          return `
            <div class="en-rel-row">
              <div class="en-rel-row-head">
                <div class="en-row" style="min-width:0;">
                  <img class="en-avatar" style="width:34px;height:34px;" src="${p.avatar}" alt="">
                  <div style="min-width:0;">
                    <div class="en-title" style="font-size:13px;">${esc(p.shop)}</div>
                    <div class="en-meta">${esc(p.area)} ・ ${tags.join(' / ')}</div>
                  </div>
                </div>
                ${pairSt === 'matched'
                  ? `<button type="button" class="en-act-btn primary" style="padding:5px 9px;font-size:11px;background:#059669;" data-inb-act="${pid}">${svgIc('chat','sm')} 2人ルーム</button>`
                  : `<button type="button" class="en-act-btn" style="padding:5px 9px;font-size:11px;" data-inb-act="${pid}">${o.status === 'sent' ? '送付確認' : '縁を繋ぐ'}</button>`}
              </div>
              ${o.sentMsg ? `<div class="en-meta">${esc(o.sentMsg)}</div>` : ''}
            </div>
          `;
        }).join('') : '<div class="en-meta">まだ自分からのアクションはありません</div>';
      }

      openEnSheetHtml('ご縁リアクション・マッチ管理', 'お互いの合意でマッチ成立 ➔ 2人専用ルームへ直行できます', `
        <div class="en-subtabs">
          <button type="button" class="en-subtab ${side==='in'?'active':''}" data-inbside="in">${svgIc('inbox','sm')} 相手から (${st.inReq + st.inLike})</button>
          <button type="button" class="en-subtab ${side==='out'?'active':''}" data-inbside="out">${svgIc('send','sm')} 自分から (${st.outMatch + st.outSent + st.outLike + st.outSave})</button>
        </div>
        ${listHtml}
      `);

      document.querySelectorAll('[data-inbside]').forEach(b => {
        b.onclick = () => { side = b.getAttribute('data-inbside'); renderBody(); };
      });
      document.querySelectorAll('[data-inb-act]').forEach(b => {
        b.onclick = () => {
          const pid = b.getAttribute('data-inb-act');
          openConnectRequestSheet(pid, () => {
            if (typeof renderEnHome === 'function') renderEnHome();
            if (typeof renderEnFeed === 'function') renderEnFeed();
          });
        };
      });
    };
    renderBody();
  }

  // =========================================================
  // 🏠 3. ホーム画面へ「ご縁インボックス（相手から / 自分から）」注入
  // =========================================================
  function injectHomeEnInbox() {
    const wrap = document.querySelector('#view-home .en-wrap');
    if (!wrap || wrap.querySelector('#enHomeInboxGrid')) return;

    const st = getInboxStats();
    const box = document.createElement('div');
    box.id = 'enHomeInboxGrid';
    box.className = 'en-inbox-grid';
    box.innerHTML = `
      <button type="button" class="en-inbox-tile ${st.inReq > 0 ? 'has-alert' : ''}" id="enHomeInBtn">
        <div class="en-inbox-top">
          <span class="en-inbox-title">${svgIc('inbox')} 相手から</span>
          ${st.inReq > 0 ? `<span class="en-inbox-dot">相談 ${st.inReq}</span>` : `<span class="en-inbox-dot soft">新着</span>`}
        </div>
        <div class="en-inbox-nums">
          <span class="en-inbox-chip">${svgIc('link','sm')} 相談 <strong>${st.inReq}</strong></span>
          <span class="en-inbox-chip">${svgIc('heart','sm')} <strong>${st.inLike}</strong></span>
          <span class="en-inbox-chip">${svgIc('bookmark','sm')} <strong>${st.inSave}</strong></span>
        </div>
      </button>

      <button type="button" class="en-inbox-tile" id="enHomeOutBtn">
        <div class="en-inbox-top">
          <span class="en-inbox-title">${svgIc('send')} 自分発信</span>
          <span class="en-inbox-dot soft">マッチ ${st.outMatch}</span>
        </div>
        <div class="en-inbox-nums">
          <span class="en-inbox-chip">${svgIc('clock','sm')} 送付 <strong>${st.outSent}</strong></span>
          <span class="en-inbox-chip">${svgIc('heart','sm')} <strong>${st.outLike}</strong></span>
          <span class="en-inbox-chip">${svgIc('bookmark','sm')} <strong>${st.outSave}</strong></span>
        </div>
      </button>
    `;

    const widgetGrid = wrap.querySelector('.en-widget-grid');
    if (widgetGrid) wrap.insertBefore(box, widgetGrid);
    else wrap.appendChild(box);

    document.getElementById('enHomeInBtn')?.addEventListener('click', () => openEnInboxSheet('in'));
    document.getElementById('enHomeOutBtn')?.addEventListener('click', () => openEnInboxSheet('out'));

    // ホームの「今日のAIディア」ウィジェット遷移先を「縁 → AIディア」へ更新
    wrap.querySelectorAll('[data-wact="aidea"]').forEach(w => {
      w.onclick = () => {
        enViewState.enSubTab = 'aidea';
        renderEnFeed();
        enGoTab('feed');
      };
    });
  }

  // =========================================================
  // 🗾 4. マップ＆おすすめ人材（1本スマート検索・リスト/マップ2択・移動可能拠点ピン）
  // =========================================================
  const mapCfg = (function loadMapCfg() {
    try {
      const s = JSON.parse(localStorage.getItem(MAP_CFG_KEY) || 'null');
      if (s && typeof s.stepIdx === 'number') {
        if (!Array.isArray(s.skillTags)) s.skillTags = [];
        if (!s.areaMode) s.areaMode = 'radius';
        if (typeof s.prefFilter !== 'string') s.prefFilter = '';
        return s;
      }
    } catch (e) {}
    return { stepIdx: 9, baseLat: 34.766, baseLng: 135.628, baseLabel: '大阪府 寝屋川市', areaMode: 'radius', prefFilter: '', catFilter: 'all', skillTags: [] };
  })();

  function saveMapCfg() {
    try { localStorage.setItem(MAP_CFG_KEY, JSON.stringify(mapCfg)); } catch (e) {}
  }

  function getHomeDefaultBase() {
    const profArea = (typeof state !== 'undefined' && state.profile?.area) || (typeof enViewState !== 'undefined' && enViewState.profile?.area) || '大阪府 寝屋川市';
    const [lat, lng] = resolveLatLng(profArea);
    return { lat, lng, label: profArea };
  }

  const discoveredSet = (function loadDex() {
    try {
      const arr = JSON.parse(localStorage.getItem(FUTA_DEX_KEY) || '[]');
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) { return new Set(); }
  })();

  function markDiscovered(pid) {
    if (!pid || discoveredSet.has(pid)) return false;
    discoveredSet.add(pid);
    try { localStorage.setItem(FUTA_DEX_KEY, JSON.stringify(Array.from(discoveredSet))); } catch (e) {}
    return true;
  }

  function getCurrentRadiusKm() {
    return RADIUS_STEPS[Math.max(0, Math.min(RADIUS_STEPS.length - 1, mapCfg.stepIdx))];
  }
  function formatRadiusLabel(km) {
    return km === 0 ? '全国すべて' : `半径 ${km}km`;
  }

  function getAllPeopleEnriched() {
    return (EN_MOCK_PEOPLE || []).map(p => {
      const [lat, lng] = p.latLng || resolveLatLng(p.area);
      const distKm = Math.round(calcDistanceKm(mapCfg.baseLat, mapCfg.baseLng, lat, lng));
      const pref = detectPref(p.area);
      const searchBlob = `${p.name} ${p.shop} ${p.area} ${pref} ${p.categoryLabel} ${p.canDo} ${p.detail?.equipment || ''}`.toLowerCase();
      return { ...p, lat, lng, distKm, pref, searchBlob, coverPhoto: p.coverPhoto || p.avatar };
    });
  }

  function matchesPeopleFilters(p, ignoreDistance) {
    const q = (enViewState.peopleQuery || '').trim().toLowerCase();
    if (q) {
      const words = q.split(/[\s ]+/).filter(Boolean);
      if (!words.every(w => p.searchBlob.includes(w))) return false;
    }
    if (mapCfg.catFilter !== 'all' && p.category !== mapCfg.catFilter) return false;
    if (Array.isArray(mapCfg.skillTags) && mapCfg.skillTags.length) {
      for (const tid of mapCfg.skillTags) {
        const def = SKILL_TAGS.find(s => s.id === tid);
        if (def && !def.re.test(p.searchBlob)) return false;
      }
    }
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

  function countPeopleActiveConds() {
    let n = 0;
    if (mapCfg.areaMode === 'pref' && mapCfg.prefFilter) n++;
    else if (mapCfg.areaMode === 'radius' && getCurrentRadiusKm() > 0) n++;
    if (mapCfg.catFilter !== 'all') n++;
    n += (mapCfg.skillTags || []).length;
    return n;
  }

  // 📸 写真全面フォトボックス（ボタンを増やさず いいね・保存・縁を繋ぐ→合意→2人ルーム）
  function buildVisualBoxV2(p, isSelected) {
    const meta = ROLE_META[p.category] || ROLE_META.craft;
    const outR = getOutRel(p.id);
    const pairSt = getPairStatus(p.id);

    let statusTagHtml = '';
    let rightBtnCls = 'primary';
    let rightBtnHtml = `${svgIc('link', 'sm')} <span>縁を繋ぐ</span>`;

    if (pairSt === 'sent') {
      statusTagHtml = `<span class="en-pbox-status-tag sent">${svgIc('clock', 'sm')} 相談送付済</span>`;
      rightBtnCls = 'state-sent';
      rightBtnHtml = `${svgIc('clock', 'sm')} <span>相談送付済</span>`;
    } else if (pairSt === 'received') {
      statusTagHtml = `<span class="en-pbox-status-tag received">${svgIc('inbox', 'sm')} 相談あり</span>`;
      rightBtnCls = 'state-received';
      rightBtnHtml = `${svgIc('check', 'sm')} <span>合意して繋ぐ</span>`;
    } else if (pairSt === 'matched') {
      statusTagHtml = `<span class="en-pbox-status-tag matched">${svgIc('check', 'sm')} マッチ済み</span>`;
      rightBtnCls = 'state-matched';
      rightBtnHtml = `${svgIc('chat', 'sm')} <span>2人のルーム</span>`;
    }

    return `
      <div class="en-pbox ${isSelected ? 'is-selected' : ''}" data-pboxid="${p.id}">
        <img class="en-pbox-bg" src="${p.coverPhoto}" alt="" loading="lazy">
        <div class="en-pbox-scrim"></div>

        <div class="en-pbox-top">
          <span class="en-pbox-cat">
            <span class="en-futa-cat-dot" style="background:${meta.color};"></span>
            <span>${esc(p.categoryLabel)}</span>
          </span>
          <span class="en-pbox-top-right">
            <span class="en-pbox-dist">約${p.distKm}km</span>
            <button type="button" class="en-pbox-save ${outR.saved ? 'saved' : ''}" data-pbox-save="${p.id}" aria-label="保存">
              ${svgIc('bookmark', outR.saved ? 'sm filled' : 'sm')}
            </button>
          </span>
        </div>

        <div class="en-pbox-bottom">
          <div class="en-pbox-meta-row">
            ${statusTagHtml}
            ${p.mapOpen === false ? `<span class="en-pbox-mini-tag nomap">${svgIc('lock', 'sm')} 地図非掲載</span>` : ''}
          </div>
          <div class="en-pbox-who">
            <img class="en-pbox-ava" src="${p.avatar}" alt="">
            <div class="en-pbox-names">
              <div class="en-pbox-name">${esc(p.shop)}</div>
              <div class="en-pbox-area">${esc(p.area)} ・ ${esc(p.name)}</div>
            </div>
          </div>
          <div class="en-pbox-cando">${esc(p.canDo)}</div>
          <div class="en-pbox-acts" onclick="event.stopPropagation()">
            <button type="button" class="en-pbox-btn ${outR.liked ? 'liked' : ''}" data-pbox-like="${p.id}">
              ${svgIc('heart', outR.liked ? 'sm filled' : 'sm')} <span>${outR.liked ? 'いいね済' : 'いいね'}</span>
            </button>
            <button type="button" class="en-pbox-btn ${rightBtnCls}" data-pbox-conn="${p.id}">
              ${rightBtnHtml}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function bindVisualBoxV2(container, onBoxTap, onRefresh) {
    if (!container) return;

    container.querySelectorAll('[data-pboxid]').forEach(box => {
      box.onclick = () => {
        const pid = box.getAttribute('data-pboxid');
        if (typeof onBoxTap === 'function') onBoxTap(pid);
        else if (typeof openPersonDetailSheet === 'function') openPersonDetailSheet(pid);
      };
    });

    container.querySelectorAll('[data-pbox-like]').forEach(btn => {
      btn.onclick = e => {
        e.stopPropagation();
        const pid = btn.getAttribute('data-pbox-like');
        const outR = getOutRel(pid);
        outR.liked = !outR.liked;
        saveRelStore();
        const p = EN_MOCK_PEOPLE.find(x => x.id === pid);
        enToast(outR.liked ? `${p?.shop || '相手'}へ「いいね」を伝えました` : 'いいねを解除しました');
        if (onRefresh) onRefresh();
        if (typeof renderEnHome === 'function') renderEnHome();
      };
    });

    container.querySelectorAll('[data-pbox-save]').forEach(btn => {
      btn.onclick = e => {
        e.stopPropagation();
        const pid = btn.getAttribute('data-pbox-save');
        const outR = getOutRel(pid);
        outR.saved = !outR.saved;
        saveRelStore();
        const p = EN_MOCK_PEOPLE.find(x => x.id === pid);
        enToast(outR.saved ? `${p?.shop || '相手'}を保存しました（相手へ通知済）` : '保存を解除しました');
        if (onRefresh) onRefresh();
        if (typeof renderEnHome === 'function') renderEnHome();
      };
    });

    container.querySelectorAll('[data-pbox-conn]').forEach(btn => {
      btn.onclick = e => {
        e.stopPropagation();
        openConnectRequestSheet(btn.getAttribute('data-pbox-conn'), onRefresh);
      };
    });
  }

  // --- Leaflet マップ管理（ドラッグ可能な拠点ピン＋長押し/右クリック移動） ---
  let uxMap = null;
  let uxCircle = null;
  let uxHomePin = null;
  let uxMarkers = [];

  function destroyUxMap() {
    if (uxMap) { try { uxMap.remove(); } catch (e) {} uxMap = null; }
    uxCircle = null; uxHomePin = null; uxMarkers = [];
  }

  function buildFutaMarkerIcon(person, isSelected, inRange) {
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
          <svg viewBox="0 0 24 24" aria-hidden="true">${SVG_PATHS[meta.icon] || ''}</svg>
          ${isFound ? `<span class="en-futa-lid-check"><svg viewBox="0 0 24 24">${SVG_PATHS.check}</svg></span>` : ''}
          <span class="en-futa-lid-city">${esc(shortArea)}</span>
        </div>
      `
    });
  }

  function renderMapRail(slotEl, scrollToSelected) {
    const railSlot = slotEl.querySelector('#enUxMapRailSlot');
    if (!railSlot) return;
    const list = getAllPeopleEnriched()
      .filter(p => matchesPeopleFilters(p, false))
      .sort((a, b) => a.distKm - b.distKm);

    if (!list.length) {
      railSlot.innerHTML = `
        <div class="en-area-empty">
          <div>この範囲には該当メンバーがいません（ピンを動かすか範囲を広げてみよう）</div>
          <button type="button" class="en-act-btn primary" id="enUxRailWideBtn">${svgIc('globe','sm')} 全国すべてを表示</button>
        </div>
      `;
      railSlot.querySelector('#enUxRailWideBtn')?.addEventListener('click', () => {
        mapCfg.areaMode = 'radius'; mapCfg.stepIdx = RADIUS_STEPS.length - 1; saveMapCfg();
        const sl = slotEl.querySelector('#enRadiusSlider'); if (sl) sl.value = String(mapCfg.stepIdx);
        refreshMapLive(slotEl, false);
        fitUxMap();
      });
      return;
    }

    const km = getCurrentRadiusKm();
    const title = mapCfg.areaMode === 'pref' && mapCfg.prefFilter
      ? `${mapCfg.prefFilter}のおすすめ`
      : (km === 0 ? '全国のおすすめメンバー' : `${mapCfg.baseLabel}から半径${km}km`);

    railSlot.innerHTML = `
      <div class="en-pbox-rail-head">
        <span class="en-pbox-rail-title">${svgIc('sparkle','sm')} ${esc(title)}（${list.length}名）</span>
        <span class="en-meta" style="font-size:10.5px;">横にスライド</span>
      </div>
      <div class="en-pbox-rail">
        ${list.map(p => buildVisualBoxV2(p, p.id === enViewState.mapSelectedId)).join('')}
      </div>
    `;

    bindVisualBoxV2(
      railSlot,
      (pid) => {
        const target = list.find(x => x.id === pid);
        if (!target) return;
        const already = enViewState.mapSelectedId === pid;
        enViewState.mapSelectedId = pid;
        if (target.mapOpen === false || already) {
          if (typeof openPersonDetailSheet === 'function') openPersonDetailSheet(pid);
          return;
        }
        if (markDiscovered(pid)) {
          enToast(`新しいご当地職種「${target.shop}」を発見しました`);
        }
        if (uxMap) uxMap.panTo([target.lat, target.lng], { animate: true });
        refreshMapLive(slotEl, false);
      },
      () => refreshMapLive(slotEl, false)
    );

    if (scrollToSelected && enViewState.mapSelectedId) {
      railSlot.querySelector(`[data-pboxid="${enViewState.mapSelectedId}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  function refreshMapLive(slotEl, scrollToSelected) {
    const km = mapCfg.areaMode === 'pref' ? 0 : getCurrentRadiusKm();
    const valEl = slotEl.querySelector('#enRadiusValPill');
    if (valEl) valEl.textContent = mapCfg.areaMode === 'pref' && mapCfg.prefFilter ? mapCfg.prefFilter : formatRadiusLabel(km);
    const titleEl = slotEl.querySelector('#enBaseTitleTxt');
    if (titleEl) titleEl.textContent = `拠点（${mapCfg.baseLabel}）からの範囲`;

    if (uxMap && uxCircle) {
      uxCircle.setLatLng([mapCfg.baseLat, mapCfg.baseLng]);
      if (km === 0 || mapCfg.areaMode === 'pref') uxCircle.setStyle({ opacity: 0, fillOpacity: 0 });
      else { uxCircle.setRadius(km * 1000); uxCircle.setStyle({ opacity: 0.85, fillOpacity: 0.14 }); }
    }
    if (uxHomePin) uxHomePin.setLatLng([mapCfg.baseLat, mapCfg.baseLng]);

    // 拠点移動に合わせて全マーカーの距離を再計算
    let inMapCnt = 0;
    uxMarkers.forEach(item => {
      item.person.distKm = Math.round(calcDistanceKm(mapCfg.baseLat, mapCfg.baseLng, item.person.lat, item.person.lng));
      const okCommon = matchesPeopleFilters(item.person, true);
      const inArea = mapCfg.areaMode === 'pref' && mapCfg.prefFilter
        ? item.person.pref === mapCfg.prefFilter
        : (km === 0 || item.person.distKm <= km);
      if (okCommon) {
        if (uxMap && !uxMap.hasLayer(item.marker)) item.marker.addTo(uxMap);
        item.marker.setIcon(buildFutaMarkerIcon(item.person, item.person.id === enViewState.mapSelectedId, inArea));
        if (inArea) inMapCnt++;
      } else {
        if (uxMap && uxMap.hasLayer(item.marker)) uxMap.removeLayer(item.marker);
      }
    });

    const totalAreaCnt = getAllPeopleEnriched().filter(p => matchesPeopleFilters(p, false)).length;
    const hitEl = slotEl.querySelector('#enRadiusHitCount');
    if (hitEl) hitEl.textContent = `地図${inMapCnt}件（地域計${totalAreaCnt}名）`;

    const mapPeople = EN_MOCK_PEOPLE.filter(p => p.mapOpen !== false);
    const foundCnt = mapPeople.filter(p => discoveredSet.has(p.id)).length;
    const dCnt = slotEl.querySelector('#enFutaDexCnt');
    const dFill = slotEl.querySelector('#enFutaDexFill');
    if (dCnt) dCnt.textContent = `${foundCnt} / ${mapPeople.length} 発見`;
    if (dFill) dFill.style.width = `${Math.round((foundCnt / Math.max(1, mapPeople.length)) * 100)}%`;

    renderMapRail(slotEl, !!scrollToSelected);
  }

  function fitUxMap() {
    if (!uxMap) return;
    if (mapCfg.areaMode === 'pref' && mapCfg.prefFilter) {
      const [lat, lng] = resolveLatLng(mapCfg.prefFilter);
      uxMap.setView([lat, lng], 9, { animate: true });
      return;
    }
    const km = getCurrentRadiusKm();
    if (km === 0) uxMap.setView([36.5, 137.8], 5, { animate: true });
    else if (uxCircle) {
      uxCircle.setRadius(km * 1000);
      uxMap.fitBounds(uxCircle.getBounds(), { padding: [24, 24], maxZoom: 12, animate: true });
    }
  }

  function renderPeopleSmartSearchAndResults(sec) {
    const isBuyer = enViewState.userMode === 'buyer';
    // スワイプ廃止：リストとマップの2択のみ
    if (enViewState.peopleView !== 'map') enViewState.peopleView = 'list';
    const view = enViewState.peopleView;
    const curQ = enViewState.peopleQuery || '';

    sec.innerHTML = `
      <div class="en-wrap" id="enUxPeopleWrap">
        <div class="en-subtabs">
          <button class="en-subtab" data-uxentab="tweet">${svgIc('chat','sm')} つぶやき</button>
          <button class="en-subtab active" data-uxentab="people">${svgIc('people','sm')} ${isBuyer ? '地域のつくり手' : 'おすすめ人材'}</button>
          <button class="en-subtab" data-uxentab="aidea">${svgIc('sparkle','sm')} AIディア</button>
        </div>

        <!-- 🔍 1本スマート検索バー（入力欄タップで詳細条件が真下に展開） -->
        <div class="en-ssearch" id="enPeopleSmartSearch">
          <div class="en-ssearch-box">
            <span class="en-ssearch-ico">${svgIc('search')}</span>
            <input id="enUxPeopleSearchIn" class="en-ssearch-input" type="search" value="${esc(curQ)}"
                   placeholder="キーワード・得意なこと・地域で探す" autocomplete="off">
            <button type="button" class="en-ssearch-clear ${curQ ? 'show' : ''}" id="enUxPeopleClearQ" aria-label="クリア">${svgIc('x','sm')}</button>
            <button type="button" class="en-ssearch-status" id="enUxPeopleStatusBtn">条件</button>
          </div>

          <div class="en-ssearch-panel" id="enUxPeoplePanel"></div>
          <div class="en-ssearch-active-pills" id="enUxPeoplePills"></div>
        </div>

        <!-- 表示切替：リスト / マップの2択のみ -->
        <div class="en-subtabs">
          <button class="en-subtab ${view==='list'?'active':''}" data-uxpview="list">${svgIc('list','sm')} リスト</button>
          <button class="en-subtab ${view==='map'?'active':''}" data-uxpview="map">${svgIc('map','sm')} マップ</button>
        </div>

        <div id="enUxPeopleResults" style="display:flex;flex-direction:column;gap:10px;"></div>
      </div>
    `;

    const sBox = sec.querySelector('#enPeopleSmartSearch');
    const panel = sec.querySelector('#enUxPeoplePanel');
    const pillsRow = sec.querySelector('#enUxPeoplePills');
    const statusBtn = sec.querySelector('#enUxPeopleStatusBtn');
    const resSlot = sec.querySelector('#enUxPeopleResults');
    const sInp = sec.querySelector('#enUxPeopleSearchIn');
    const clrBtn = sec.querySelector('#enUxPeopleClearQ');

    const renderSmartPanel = () => {
      const km = getCurrentRadiusKm();
      const isPref = mapCfg.areaMode === 'pref';
      panel.innerHTML = `
        <div class="en-ssearch-sec">
          <div class="en-ssearch-sec-lbl">
            <span>${svgIc('pin','sm')} 地域・距離</span>
            <span>${isPref ? (mapCfg.prefFilter || '全国') : formatRadiusLabel(km)}</span>
          </div>
          <div class="en-pfs-mode-tabs">
            <button type="button" class="en-pfs-mode-btn ${!isPref ? 'active' : ''}" data-spmode="radius">${svgIc('target','sm')} 拠点から半径</button>
            <button type="button" class="en-pfs-mode-btn ${isPref ? 'active' : ''}" data-spmode="pref">${svgIc('map','sm')} 都道府県で選ぶ</button>
          </div>
          ${!isPref ? `
            <input type="range" class="en-radius-slider" id="enSpRadSlider" min="0" max="${RADIUS_STEPS.length - 1}" step="1" value="${mapCfg.stepIdx}">
            <div class="en-radius-ticks"><span>5km</span><span>20km</span><span>50km</span><span>200km</span><span>全国</span></div>
          ` : `
            <select id="enSpPrefSel" class="en-input-field" style="padding:6px 9px;font-size:12px;">
              <option value="">全国すべて</option>
              ${PREF_LIST.map(p => `<option value="${p}" ${mapCfg.prefFilter === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
          `}
        </div>

        <div class="en-ssearch-sec">
          <div class="en-ssearch-sec-lbl"><span>職種</span></div>
          <div class="en-ssearch-chips">
            <button type="button" class="en-ssearch-chip ${mapCfg.catFilter==='all'?'active':''}" data-spcat="all">すべて</button>
            ${Object.entries(ROLE_META).map(([k, m]) => `
              <button type="button" class="en-ssearch-chip ${mapCfg.catFilter===k?'active':''}" data-spcat="${k}">
                <span class="en-futa-cat-dot" style="background:${m.color};"></span>${m.label.split('・')[0]}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="en-ssearch-sec">
          <div class="en-ssearch-sec-lbl"><span>得意なこと・条件（複数OK）</span></div>
          <div class="en-ssearch-chips">
            ${SKILL_TAGS.map(st => `
              <button type="button" class="en-ssearch-chip ${(mapCfg.skillTags||[]).includes(st.id)?'active':''}" data-spskill="${st.id}">#${st.label}</button>
            `).join('')}
          </div>
        </div>

        <div class="en-ssearch-foot">
          <button type="button" class="en-act-btn" style="padding:5px 10px;font-size:11px;" id="enSpResetBtn">リセット</button>
          <button type="button" class="en-act-btn primary" style="padding:5px 14px;font-size:11.5px;" id="enSpCloseBtn">閉じる</button>
        </div>
      `;

      panel.querySelectorAll('[data-spmode]').forEach(b => b.onclick = () => {
        mapCfg.areaMode = b.getAttribute('data-spmode'); saveMapCfg(); renderSmartPanel(); refreshAll();
      });
      const rSl = panel.querySelector('#enSpRadSlider');
      if (rSl) {
        rSl.oninput = e => { mapCfg.stepIdx = Number(e.target.value); updateStatusAndPills(); refreshResultsOnly(); };
        rSl.onchange = () => { saveMapCfg(); renderSmartPanel(); if (uxMap) fitUxMap(); };
      }
      panel.querySelector('#enSpPrefSel')?.addEventListener('change', e => {
        mapCfg.prefFilter = e.target.value; saveMapCfg(); renderSmartPanel(); refreshAll();
      });
      panel.querySelectorAll('[data-spcat]').forEach(b => b.onclick = () => {
        mapCfg.catFilter = b.getAttribute('data-spcat'); saveMapCfg(); renderSmartPanel(); refreshAll();
      });
      panel.querySelectorAll('[data-spskill]').forEach(b => b.onclick = () => {
        const id = b.getAttribute('data-spskill');
        if (!Array.isArray(mapCfg.skillTags)) mapCfg.skillTags = [];
        if (mapCfg.skillTags.includes(id)) mapCfg.skillTags = mapCfg.skillTags.filter(x => x !== id);
        else mapCfg.skillTags.push(id);
        saveMapCfg(); renderSmartPanel(); refreshAll();
      });
      panel.querySelector('#enSpResetBtn')?.addEventListener('click', () => {
        enViewState.peopleQuery = '';
        if (sInp) sInp.value = '';
        clrBtn?.classList.remove('show');
        mapCfg.areaMode = 'radius'; mapCfg.stepIdx = RADIUS_STEPS.length - 1; mapCfg.prefFilter = ''; mapCfg.catFilter = 'all'; mapCfg.skillTags = [];
        saveMapCfg(); renderSmartPanel(); refreshAll();
      });
      panel.querySelector('#enSpCloseBtn')?.addEventListener('click', () => sBox.classList.remove('is-open'));
    };

    const updateStatusAndPills = () => {
      const cnt = countPeopleActiveConds();
      statusBtn.classList.toggle('has-cond', cnt > 0);
      statusBtn.innerHTML = `${svgIc('sliders','sm')} <span>${cnt > 0 ? `${cnt}件` : '条件'}</span>`;

      const pills = [];
      if (mapCfg.areaMode === 'pref' && mapCfg.prefFilter) pills.push({ k: 'area', lbl: mapCfg.prefFilter });
      else if (mapCfg.areaMode === 'radius' && getCurrentRadiusKm() > 0) pills.push({ k: 'area', lbl: `半径${getCurrentRadiusKm()}km` });
      if (mapCfg.catFilter !== 'all' && ROLE_META[mapCfg.catFilter]) pills.push({ k: 'cat', lbl: ROLE_META[mapCfg.catFilter].label.split('・')[0] });
      (mapCfg.skillTags || []).forEach(tid => { const d = SKILL_TAGS.find(s => s.id === tid); if (d) pills.push({ k: 'skill:' + tid, lbl: '#' + d.label }); });

      pillsRow.innerHTML = pills.length
        ? pills.map(p => `<button type="button" class="en-pf-pill" data-uxrm="${p.k}">${esc(p.lbl)} ${svgIc('x','sm')}</button>`).join('')
        : '';

      pillsRow.querySelectorAll('[data-uxrm]').forEach(b => {
        b.onclick = () => {
          const k = b.getAttribute('data-uxrm');
          if (k === 'area') { mapCfg.areaMode = 'radius'; mapCfg.stepIdx = RADIUS_STEPS.length - 1; mapCfg.prefFilter = ''; }
          else if (k === 'cat') mapCfg.catFilter = 'all';
          else if (k.startsWith('skill:')) mapCfg.skillTags = (mapCfg.skillTags || []).filter(x => x !== k.slice(6));
          saveMapCfg(); renderSmartPanel(); refreshAll();
        };
      });
    };

    const refreshResultsOnly = () => {
      const curView = enViewState.peopleView;
      const allPeople = getAllPeopleEnriched();

      if (curView === 'list') {
        destroyUxMap();
        const list = allPeople.filter(p => matchesPeopleFilters(p, false)).sort((a, b) => a.distKm - b.distKm);
        if (!list.length) {
          resSlot.innerHTML = `<div class="en-area-empty"><div>条件に合うメンバーがまだ見つかりません</div><button type="button" class="en-act-btn primary" id="enUxEmptyAll">${svgIc('globe','sm')} 条件をクリアして全国表示</button></div>`;
          resSlot.querySelector('#enUxEmptyAll')?.addEventListener('click', () => {
            enViewState.peopleQuery = ''; if (sInp) sInp.value = ''; clrBtn?.classList.remove('show');
            mapCfg.areaMode = 'radius'; mapCfg.stepIdx = RADIUS_STEPS.length - 1; mapCfg.prefFilter = ''; mapCfg.catFilter = 'all'; mapCfg.skillTags = [];
            saveMapCfg(); renderSmartPanel(); refreshAll();
          });
          return;
        }
        resSlot.innerHTML = `
          <div class="en-between" style="padding:0 2px;">
            <span class="en-meta" style="font-weight:800;">近い順（${list.length}名）</span>
            <span class="en-meta">拠点：${esc(mapCfg.baseLabel)}</span>
          </div>
          <div class="en-pbox-grid">
            ${list.map(p => buildVisualBoxV2(p, false)).join('')}
          </div>
        `;
        bindVisualBoxV2(resSlot, pid => { if (typeof openPersonDetailSheet === 'function') openPersonDetailSheet(pid); }, refreshResultsOnly);
        return;
      }

      // マップ表示（既存インスタンスがあればそのまま高速更新）
      if (uxMap && resSlot.querySelector('#enJapanLeafletMap')) {
        refreshMapLive(resSlot, false);
        return;
      }

      const mapPeople = allPeople.filter(p => p.mapOpen !== false);
      const curKm = getCurrentRadiusKm();
      const foundCnt = mapPeople.filter(p => discoveredSet.has(p.id)).length;
      const dexPct = Math.round((foundCnt / Math.max(1, mapPeople.length)) * 100);

      resSlot.innerHTML = `
        <div class="en-futa-dex">
          <div class="en-futa-dex-left">
            <div class="en-futa-dex-title">${svgIc('map','sm')} 日本全国「職種ふた」探索マップ</div>
            <div class="en-futa-dex-bar"><div class="en-futa-dex-fill" id="enFutaDexFill" style="width:${dexPct}%"></div></div>
          </div>
          <span class="en-futa-dex-cnt" id="enFutaDexCnt">${foundCnt} / ${mapPeople.length} 発見</span>
        </div>

        <div class="en-radius-box">
          <div class="en-radius-head">
            <span class="en-radius-title">${svgIc('target','sm')} <span id="enBaseTitleTxt">拠点（${esc(mapCfg.baseLabel)}）からの範囲</span></span>
            <span class="en-radius-val" id="enRadiusValPill">${formatRadiusLabel(curKm)}</span>
          </div>
          <div class="en-radius-slider-row">
            <input type="range" class="en-radius-slider" id="enRadiusSlider" min="0" max="${RADIUS_STEPS.length - 1}" step="1" value="${mapCfg.stepIdx}">
          </div>
          <div class="en-radius-ticks"><span>5km</span><span>20km</span><span>50km</span><span>200km</span><span>全国</span></div>
          <div class="en-radius-actions">
            <span class="en-meta" style="font-weight:800;" id="enRadiusHitCount">0件</span>
            <span class="en-meta" style="font-size:10px;">${svgIc('move','sm')} 青ピンをドラッグ移動可</span>
          </div>
        </div>

        <div class="en-jpmap-wrap">
          <div id="enJapanLeafletMap"></div>
          <div class="en-jpmap-float-ctrls">
            <button type="button" class="en-jpmap-fbtn" id="enUxFitAllBtn">${svgIc('globe','sm')} 全国</button>
            <button type="button" class="en-jpmap-fbtn" id="enUxResetHomePinBtn">${svgIc('pin','sm')} 自宅拠点</button>
          </div>
          <span class="en-jpmap-privacy-tag">市町村エリア表示・青ピンドラッグ/長押しで探索地点を移動</span>
        </div>

        <div id="enUxMapRailSlot" style="display:flex;flex-direction:column;gap:6px;"></div>
      `;

      destroyUxMap();
      const mapEl = resSlot.querySelector('#enJapanLeafletMap');
      if (typeof window.L === 'undefined' || !mapEl) {
        renderMapRail(resSlot, false);
        return;
      }

      uxMap = L.map(mapEl, {
        center: curKm === 0 ? [36.5, 137.8] : [mapCfg.baseLat, mapCfg.baseLng],
        zoom: curKm === 0 ? 5 : 9,
        minZoom: 5, maxZoom: 17, zoomControl: false, attributionControl: true
      });

      let switchedOsm = false, errCnt = 0;
      const gsi = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
        minZoom: 5, maxZoom: 18, attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">国土地理院</a>'
      }).addTo(uxMap);
      gsi.on('tileerror', () => {
        if (++errCnt >= 4 && !switchedOsm && uxMap) {
          switchedOsm = true; uxMap.removeLayer(gsi);
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { minZoom: 4, maxZoom: 18, attribution: '&copy; OpenStreetMap' }).addTo(uxMap);
        }
      });

      uxCircle = L.circle([mapCfg.baseLat, mapCfg.baseLng], {
        radius: (curKm || 50) * 1000,
        color: '#2563eb', weight: 2, dashArray: '6 4',
        fillColor: '#3b82f6', fillOpacity: curKm === 0 ? 0 : 0.14, opacity: curKm === 0 ? 0 : 0.85
      }).addTo(uxMap);

      // ★自由にドラッグ移動できる青い拠点ピン
      uxHomePin = L.marker([mapCfg.baseLat, mapCfg.baseLng], {
        draggable: true,
        icon: L.divIcon({
          className: 'en-home-pin-wrap',
          iconSize: [26, 26],
          iconAnchor: [13, 13],
          html: `<div class="en-home-pin draggable" title="ドラッグで探索中心を移動">${svgIc('move','sm')}<span class="en-home-pin-hint">移動可</span></div>`
        }),
        zIndexOffset: 700
      }).addTo(uxMap);

      const moveBasePinTo = (lat, lng, labelText) => {
        mapCfg.baseLat = Math.round(lat * 1000) / 1000;
        mapCfg.baseLng = Math.round(lng * 1000) / 1000;
        mapCfg.baseLabel = labelText || '移動した地点';
        mapCfg.areaMode = 'radius';
        if (getCurrentRadiusKm() === 0) {
          mapCfg.stepIdx = 4; // 50kmへ自動フォーカスして探索しやすく
          const sl = resSlot.querySelector('#enRadiusSlider'); if (sl) sl.value = '4';
        }
        saveMapCfg();
        updateStatusAndPills();
        refreshMapLive(resSlot, false);
      };

      uxHomePin.on('drag', e => {
        const ll = e.target.getLatLng();
        if (uxCircle) uxCircle.setLatLng(ll);
      });
      uxHomePin.on('dragend', e => {
        const ll = e.target.getLatLng();
        moveBasePinTo(ll.lat, ll.lng, '移動した探索ピン');
        enToast('探索ピンを移動しました（周囲のおすすめを更新）');
      });

      // 地図上の長押し・右クリックでもパッと拠点ピンを移動
      uxMap.on('contextmenu', e => {
        moveBasePinTo(e.latlng.lat, e.latlng.lng, '指定した地点');
        enToast('タップした地点へ探索ピンを移動しました');
      });

      uxMarkers = mapPeople.map(p => {
        const marker = L.marker([p.lat, p.lng], { icon: buildFutaMarkerIcon(p, p.id === enViewState.mapSelectedId, true) });
        marker.on('click', () => {
          enViewState.mapSelectedId = p.id;
          if (markDiscovered(p.id)) enToast(`新しいご当地職種「${p.shop}」を発見しました`);
          refreshMapLive(resSlot, true);
        });
        return { person: p, marker };
      });

      refreshMapLive(resSlot, false);
      setTimeout(() => { if (uxMap) { uxMap.invalidateSize(); fitUxMap(); } }, 100);

      const slider = resSlot.querySelector('#enRadiusSlider');
      if (slider) {
        slider.addEventListener('input', e => {
          mapCfg.areaMode = 'radius';
          mapCfg.stepIdx = Number(e.target.value);
          updateStatusAndPills();
          refreshMapLive(resSlot, false);
        });
        slider.addEventListener('change', () => { saveMapCfg(); renderSmartPanel(); fitUxMap(); });
      }

      resSlot.querySelector('#enUxFitAllBtn')?.addEventListener('click', () => {
        mapCfg.areaMode = 'radius'; mapCfg.stepIdx = RADIUS_STEPS.length - 1; saveMapCfg();
        if (slider) slider.value = String(mapCfg.stepIdx);
        updateStatusAndPills(); renderSmartPanel(); refreshMapLive(resSlot, false); fitUxMap();
      });

      resSlot.querySelector('#enUxResetHomePinBtn')?.addEventListener('click', () => {
        const home = getHomeDefaultBase();
        mapCfg.baseLat = home.lat; mapCfg.baseLng = home.lng; mapCfg.baseLabel = home.label;
        mapCfg.areaMode = 'radius';
        if (getCurrentRadiusKm() === 0) { mapCfg.stepIdx = 4; if (slider) slider.value = '4'; }
        saveMapCfg(); updateStatusAndPills(); renderSmartPanel(); refreshMapLive(resSlot, false); fitUxMap();
        enToast(`自宅拠点（${home.label}）へ戻しました`);
      });
    };

    const refreshAll = () => {
      updateStatusAndPills();
      refreshResultsOnly();
    };

    // スマート検索バー開閉制御（入力欄フォーカスで自動展開・外側クリックで閉じる）
    const openSmart = () => sBox.classList.add('is-open');
    sInp?.addEventListener('focus', openSmart);
    statusBtn?.addEventListener('click', () => sBox.classList.toggle('is-open'));

    const onOutsideClick = (e) => {
      if (!document.body.contains(sBox)) { document.removeEventListener('pointerdown', onOutsideClick); return; }
      if (!sBox.contains(e.target)) sBox.classList.remove('is-open');
    };
    document.addEventListener('pointerdown', onOutsideClick);

    // 日本語IME完全対応
    if (sInp) {
      let comp = false;
      const runQ = v => { enViewState.peopleQuery = v; clrBtn?.classList.toggle('show', !!v.trim()); refreshResultsOnly(); };
      sInp.addEventListener('compositionstart', () => { comp = true; });
      sInp.addEventListener('compositionend', e => { comp = false; runQ(e.target.value); });
      sInp.addEventListener('input', e => { if (!comp) runQ(e.target.value); });
    }
    clrBtn?.addEventListener('click', () => {
      if (sInp) { sInp.value = ''; sInp.focus(); }
      enViewState.peopleQuery = ''; clrBtn.classList.remove('show'); refreshResultsOnly();
    });

    sec.querySelectorAll('[data-uxentab]').forEach(b => {
      b.onclick = () => { enViewState.enSubTab = b.getAttribute('data-uxentab'); window.renderEnFeed(); };
    });
    sec.querySelectorAll('[data-uxpview]').forEach(b => {
      b.onclick = () => {
        enViewState.peopleView = b.getAttribute('data-uxpview');
        sec.querySelectorAll('[data-uxpview]').forEach(x => x.classList.toggle('active', x === b));
        destroyUxMap();
        refreshResultsOnly();
      };
    });

    renderSmartPanel();
    refreshAll();
  }

  // =========================================================
  // ✨ 5. 「縁を繋げる」内へ引っ越した AIディア画面
  // =========================================================
  function renderAiDeaInsideFeed(sec) {
    destroyUxMap();
    const isBuyer = enViewState.userMode === 'buyer';
    const isHint = enViewState.aideaSubTab === 'hint';

    sec.innerHTML = `
      <div class="en-wrap">
        <div class="en-subtabs">
          <button class="en-subtab" data-uxentab="tweet">${svgIc('chat','sm')} つぶやき</button>
          <button class="en-subtab" data-uxentab="people">${svgIc('people','sm')} ${isBuyer ? '地域のつくり手' : 'おすすめ人材'}</button>
          <button class="en-subtab active" data-uxentab="aidea">${svgIc('sparkle','sm')} AIディア</button>
        </div>

        <div class="en-subtabs">
          <button class="en-subtab ${!isHint?'active':''}" data-uxai="suggest">${svgIc('sparkle','sm')} AI 3点掛け算</button>
          <button class="en-subtab ${isHint?'active':''}" data-uxai="hint">${svgIc('bookmark','sm')} ヒント箱 (${enViewState.hintBox.length})</button>
        </div>

        ${!isHint ? EN_MOCK_AIDEA.map(a => `
          <div class="card en-card">
            <div class="en-card-img-wrap">
              <img class="en-card-img" src="${a.photo}" alt="">
              <span class="en-img-chip">${esc(a.creator)}（3点掛け算）</span>
            </div>
            <div class="en-title">${esc(a.proposal)}</div>
            <div class="en-formula">
              <div><strong>買い手ニーズ：</strong>${esc(a.want)}</div>
              <div><strong>素材：</strong>${esc(a.trouble.area)}（${esc(a.trouble.text)}）</div>
              <div><strong>相棒：</strong>${esc(a.partner.area)}（${esc(a.partner.text)}）</div>
            </div>
            <p class="en-text">${esc(a.reason)}</p>
            <div class="en-actions">
              <button type="button" class="en-act-btn" data-ai-solo="${esc(a.proposal)}">${svgIc('book','sm')} <span>1人準備中で温める</span></button>
              <button type="button" class="en-act-btn primary" style="margin-left:auto;" data-ai-offer="${esc(a.proposal)}">${svgIc('send','sm')} <span>オファーを送る</span></button>
            </div>
          </div>
        `).join('') : enViewState.hintBox.map(h => `
          <div class="card en-card" style="gap:6px;">
            <div class="en-between"><span class="en-pill">${esc(h.from)}</span><span class="en-meta">${esc(h.time)}</span></div>
            <div class="en-title">${esc(h.title)}</div>
            <button type="button" class="en-act-btn primary" style="align-self:flex-end;" data-ai-solo="${esc(h.title)}">${svgIc('book','sm')} 1人準備中ノートへ</button>
          </div>
        `).join('')}
      </div>
    `;

    sec.querySelectorAll('[data-uxentab]').forEach(b => b.onclick = () => { enViewState.enSubTab = b.getAttribute('data-uxentab'); window.renderEnFeed(); });
    sec.querySelectorAll('[data-uxai]').forEach(b => b.onclick = () => { enViewState.aideaSubTab = b.getAttribute('data-uxai'); window.renderEnFeed(); });
    sec.querySelectorAll('[data-ai-solo]').forEach(b => b.onclick = () => { if (typeof createSoloLabFromSeed === 'function') createSoloLabFromSeed(b.getAttribute('data-ai-solo')); });
    sec.querySelectorAll('[data-ai-offer]').forEach(b => b.onclick = () => enToast('関係者へコラボオファーを送信しました'));
  }

  // =========================================================
  // 🔍 6. 汎用「1本スマート検索バー」を つぶやき・EN•ラボ・マルシェ へも統一展開
  // =========================================================
  const tabSearchState = { tweetQ: '', labQ: '', shopQ: '' };

  function mountSimpleSmartSearch(wrap, opts) {
    if (!wrap || wrap.querySelector(`[data-ssearch="${opts.id}"]`)) return;

    const host = document.createElement('div');
    host.className = 'en-ssearch';
    host.setAttribute('data-ssearch', opts.id);
    const curQ = opts.getQuery() || '';
    const condLbl = opts.getStatusLabel ? opts.getStatusLabel() : '絞り込み';
    const hasCond = opts.hasCond ? opts.hasCond() : false;

    host.innerHTML = `
      <div class="en-ssearch-box">
        <span class="en-ssearch-ico">${svgIc('search')}</span>
        <input class="en-ssearch-input" type="search" value="${esc(curQ)}" placeholder="${esc(opts.placeholder)}" autocomplete="off">
        <button type="button" class="en-ssearch-clear ${curQ ? 'show' : ''}" aria-label="クリア">${svgIc('x','sm')}</button>
        ${opts.chips && opts.chips.length ? `<button type="button" class="en-ssearch-status ${hasCond ? 'has-cond' : ''}">${svgIc('sliders','sm')} <span>${esc(condLbl)}</span></button>` : ''}
      </div>
      ${opts.chips && opts.chips.length ? `
        <div class="en-ssearch-panel">
          <div class="en-ssearch-sec">
            <div class="en-ssearch-sec-lbl"><span>${esc(opts.panelTitle || '絞り込み')}</span></div>
            <div class="en-ssearch-chips">
              ${opts.chips.map(c => `<button type="button" class="en-ssearch-chip ${c.active ? 'active' : ''}" data-ssval="${esc(c.val)}">${esc(c.label)}</button>`).join('')}
            </div>
          </div>
          <div class="en-ssearch-foot">
            <button type="button" class="en-act-btn" style="padding:4px 9px;font-size:11px;" data-ssreset="1">リセット</button>
            <button type="button" class="en-act-btn primary" style="padding:4px 12px;font-size:11px;" data-ssclose="1">閉じる</button>
          </div>
        </div>
      ` : ''}
    `;

    if (opts.insertAfter) opts.insertAfter.after(host);
    else wrap.prepend(host);

    const inp = host.querySelector('.en-ssearch-input');
    const clr = host.querySelector('.en-ssearch-clear');
    const stBtn = host.querySelector('.en-ssearch-status');

    const applyDomFilter = (val) => {
      opts.setQuery(val);
      clr?.classList.toggle('show', !!val.trim());
      const words = val.trim().toLowerCase().split(/[\s ]+/).filter(Boolean);
      wrap.querySelectorAll(opts.cardSelector).forEach(card => {
        const txt = (card.textContent || '').toLowerCase();
        const show = !words.length || words.every(w => txt.includes(w));
        card.style.display = show ? '' : 'none';
      });
    };

    if (curQ) applyDomFilter(curQ);

    let comp = false;
    inp?.addEventListener('focus', () => { if (opts.chips?.length) host.classList.add('is-open'); });
    inp?.addEventListener('compositionstart', () => { comp = true; });
    inp?.addEventListener('compositionend', e => { comp = false; applyDomFilter(e.target.value); });
    inp?.addEventListener('input', e => { if (!comp) applyDomFilter(e.target.value); });

    clr?.addEventListener('click', () => { inp.value = ''; inp.focus(); applyDomFilter(''); });
    stBtn?.addEventListener('click', () => host.classList.toggle('is-open'));
    host.querySelector('[data-ssclose]')?.addEventListener('click', () => host.classList.remove('is-open'));
    host.querySelector('[data-ssreset]')?.addEventListener('click', () => {
      inp.value = ''; applyDomFilter('');
      if (opts.onReset) opts.onReset();
    });
    host.querySelectorAll('[data-ssval]').forEach(b => {
      b.onclick = () => { host.classList.remove('is-open'); if (opts.onPickChip) opts.onPickChip(b.getAttribute('data-ssval')); };
    });

    const onOut = e => {
      if (!document.body.contains(host)) { document.removeEventListener('pointerdown', onOut); return; }
      if (!host.contains(e.target)) host.classList.remove('is-open');
    };
    document.addEventListener('pointerdown', onOut);
  }

  // =========================================================
  // 🔌 7. 全フック装着
  // =========================================================
  function installUxV2HooksOnce() {
    if (uxV2Installed) return;
    uxV2Installed = true;

    installReliableBottomNav();

    // A) ホーム画面：ご縁インボックス注入
    if (typeof window.renderEnHome === 'function') {
      const origHome = window.renderEnHome;
      window.renderEnHome = function () {
        const res = origHome.apply(this, arguments);
        injectHomeEnInbox();
        return res;
      };
    }

    // B) 縁を繋げる：3タブ構成（つぶやき / おすすめ人材[リスト・マップ] / AIディア）＋スマート検索統一
    if (typeof window.renderEnFeed === 'function') {
      const origFeed = window.renderEnFeed;
      window.renderEnFeed = function () {
        const sec = document.getElementById('view-feed');
        if (!sec) return origFeed.apply(this, arguments);

        if (enViewState.enSubTab === 'people') {
          renderPeopleSmartSearchAndResults(sec);
          return;
        }
        if (enViewState.enSubTab === 'aidea') {
          renderAiDeaInsideFeed(sec);
          return;
        }

        // つぶやきタブ：トップタブへ「AIディア」を追加＋1本スマート検索バー装着
        destroyUxMap();
        const res = origFeed.apply(this, arguments);
        const wrap = sec.querySelector('.en-wrap');
        if (wrap) {
          const topTabs = wrap.querySelector('.en-subtabs');
          if (topTabs && !topTabs.querySelector('[data-entab="aidea"]')) {
            const isBuyer = enViewState.userMode === 'buyer';
            topTabs.innerHTML = `
              <button class="en-subtab active" data-uxentab="tweet">${svgIc('chat','sm')} つぶやき</button>
              <button class="en-subtab" data-uxentab="people">${svgIc('people','sm')} ${isBuyer ? '地域のつくり手' : 'おすすめ人材'}</button>
              <button class="en-subtab" data-uxentab="aidea">${svgIc('sparkle','sm')} AIディア</button>
            `;
            topTabs.querySelectorAll('[data-uxentab]').forEach(b => {
              b.onclick = () => { enViewState.enSubTab = b.getAttribute('data-uxentab'); window.renderEnFeed(); };
            });
          }
          // つぶやきカテゴリ帯はスマート検索パネルへ吸収してスッキリ
          const catBar = wrap.querySelectorAll('.en-subtabs')[1];
          if (catBar) catBar.style.display = 'none';

          const catMap = { all: 'すべて', want: 'ほしい', trouble: '困りごと', idea: 'ひらめき' };
          mountSimpleSmartSearch(wrap, {
            id: 'tweet',
            placeholder: 'つぶやき・地域・素材で探す',
            insertAfter: topTabs,
            cardSelector: '.en-feed-stack > .en-card',
            panelTitle: 'カテゴリで絞り込み',
            getQuery: () => tabSearchState.tweetQ,
            setQuery: v => { tabSearchState.tweetQ = v; },
            hasCond: () => enViewState.tweetCat !== 'all',
            getStatusLabel: () => catMap[enViewState.tweetCat] || '条件',
            chips: Object.entries(catMap).map(([val, label]) => ({ val, label, active: enViewState.tweetCat === val })),
            onPickChip: val => { enViewState.tweetCat = val; window.renderEnFeed(); },
            onReset: () => { enViewState.tweetCat = 'all'; window.renderEnFeed(); }
          });
        }
        return res;
      };
    }

    // C) EN•ラボ：「探す」「AIディア」を廃止して 進行中 / 1人準備中 の2タブ直行＋スマート検索
    if (typeof window.renderEnLab === 'function') {
      const origLab = window.renderEnLab;
      window.renderEnLab = function () {
        enViewState.labSubTab = 'my'; // 常にマイラボ（進行中／1人準備中）直行
        const res = origLab.apply(this, arguments);
        const wrap = document.querySelector('#view-en .en-wrap');
        if (wrap) {
          // 1段目の3タブ（マイラボ/探す/AIディア）を非表示にして2タブ直行へ
          const tabs = wrap.querySelectorAll(':scope > .en-subtabs');
          if (tabs.length >= 2) {
            tabs[0].style.display = 'none';
            const modeTab = tabs[1];
            const activeCnt = enViewState.labs.filter(l => l.mode === 'my_active').length;
            const soloCnt = enViewState.labs.filter(l => l.mode === 'my_solo').length;
            const isSolo = enViewState.myLabMode === 'my_solo';
            modeTab.innerHTML = `
              <button class="en-subtab ${!isSolo?'active':''}" data-lmode="my_active">${svgIc('lab','sm')} 進行中 (${activeCnt})</button>
              <button class="en-subtab ${isSolo?'active':''}" data-lmode="my_solo">${svgIc('book','sm')} 1人準備中 (${soloCnt})</button>
            `;
            modeTab.querySelectorAll('[data-lmode]').forEach(b => {
              b.onclick = () => { enViewState.myLabMode = b.getAttribute('data-lmode'); window.renderEnLab(); };
            });

            mountSimpleSmartSearch(wrap, {
              id: 'lab',
              placeholder: 'ラボ名・メモ・キーワードで探す',
              insertAfter: modeTab,
              cardSelector: ':scope > .en-card',
              panelTitle: '表示切替',
              getQuery: () => tabSearchState.labQ,
              setQuery: v => { tabSearchState.labQ = v; },
              hasCond: () => false,
              getStatusLabel: () => isSolo ? '1人準備中' : '進行中',
              chips: [
                { val: 'my_active', label: `進行中 (${activeCnt})`, active: !isSolo },
                { val: 'my_solo',   label: `1人準備中 (${soloCnt})`, active: isSolo }
              ],
              onPickChip: val => { enViewState.myLabMode = val; window.renderEnLab(); },
              onReset: () => { tabSearchState.labQ = ''; window.renderEnLab(); }
            });
          }
        }
        return res;
      };
    }

    // D) EN•マルシェにも統一1本スマート検索バーを装着
    if (typeof window.renderEnShop === 'function') {
      const origShop = window.renderEnShop;
      window.renderEnShop = function () {
        const res = origShop.apply(this, arguments);
        const wrap = document.querySelector('#view-shop .en-wrap');
        if (wrap) {
          const tabs = wrap.querySelector('.en-subtabs');
          const mMap = { all: 'すべて', product: '巣立ち商品', gear: '50:50ギア', event: 'マルシェ日程' };
          mountSimpleSmartSearch(wrap, {
            id: 'shop',
            placeholder: '商品名・ギア・マルシェ地域で探す',
            insertAfter: tabs,
            cardSelector: '.en-hero-card, .en-card',
            panelTitle: 'カテゴリで絞り込み',
            getQuery: () => tabSearchState.shopQ,
            setQuery: v => { tabSearchState.shopQ = v; },
            hasCond: () => enViewState.marcheFilter !== 'all',
            getStatusLabel: () => mMap[enViewState.marcheFilter] || '条件',
            chips: Object.entries(mMap).map(([val, label]) => ({ val, label, active: enViewState.marcheFilter === val })),
            onPickChip: val => { enViewState.marcheFilter = val; window.renderEnShop(); },
            onReset: () => { enViewState.marcheFilter = 'all'; window.renderEnShop(); }
          });
        }
        return res;
      };
    }

    // タブ復帰時のマップ自動リサイズ
    document.addEventListener('click', e => {
      if (e.target.closest('#bottomNav [data-tab="feed"]')) {
        setTimeout(() => { if (uxMap) uxMap.invalidateSize(); }, 130);
      }
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      installUxV2HooksOnce();
      if (typeof renderEnHome === 'function') renderEnHome();
      if (typeof renderEnFeed === 'function') renderEnFeed();
      if (typeof renderEnLab === 'function') renderEnLab();
      if (typeof renderEnShop === 'function') renderEnShop();
    }, 380);
  });
})();