/* ============================================================
   EN•joy v5.2 — ポケフタ風「ご縁めぐりマップ」(#20)
   ファイル名: map.js
   ※ index.html の <script src="analytics.js"></script> の直後に読み込むだけで動作します
   ============================================================ */

(function () {
  'use strict';

  const MAP_KEY = 'enjoy_v52_map';

  const DEFAULT_SPOTS = [
    {
      id: 'spot-azumino',
      name: '信州・青木りんご園 直売所',
      type: '🌱 農家・直売所',
      icon: '🍎',
      area: '長野県安曇野市',
      query: '長野県安曇野市',
      x: 68, y: 34,
      accessMemo: '安曇野ICから車で12分。赤い軽トラと木製看板が目印（駐車5台OK）。',
      highlight: '規格外サンふじの試食＆箱買いレスキュー実施中！'
    },
    {
      id: 'spot-kyoto',
      name: 'EN•dress 京都・古民家テストキッチン',
      type: '🎪 拠点・テストキッチン',
      icon: '🏮',
      area: '京都府京都市中京区',
      query: '京都府京都市中京区',
      x: 46, y: 54,
      accessMemo: '阪急烏丸駅から徒歩8分。町家の暖簾（のれん）が目印です。',
      highlight: 'プレマルシェ試食会＆和紙パッケージ相談の拠点。'
    },
    {
      id: 'spot-takatsuki',
      name: 'たかつき太陽農園 ＆ 軽トラ集合所',
      type: '🚚 軽トラ・直売',
      icon: '🍅',
      area: '大阪府高槻市',
      query: '大阪府高槻市',
      x: 38, y: 66,
      accessMemo: 'JR高槻駅からバス10分。土曜朝8時は京都向け軽トラ相乗り便が出発。',
      highlight: '朝採れ完熟トマト＆スパイスソース試作品あり。'
    },
    {
      id: 'spot-higashiosaka',
      name: 'なにわ乾燥・瓶詰め工房',
      type: '🏭 町工場・加工',
      icon: '⚙️',
      area: '大阪府東大阪市',
      query: '大阪府東大阪市',
      x: 32, y: 78,
      accessMemo: '近鉄布施駅から徒歩12分。工場前に軽トラ横付け搬入スペースあり。',
      highlight: '小ロット10kgから低温ドライ・瓶詰め試作を見学OK（要連絡）。'
    }
  ];

  let mapState = loadMapState();
  let filterType = 'all';

  function loadMapState() {
    try {
      const raw = localStorage.getItem(MAP_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      spots: DEFAULT_SPOTS,
      stamps: { 'spot-takatsuki': '11/24' }
    };
  }

  function saveMapState() {
    try {
      localStorage.setItem(MAP_KEY, JSON.stringify(mapState));
    } catch (e) {}
  }

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getMergedSpots() {
    const list = [...mapState.spots];
    try {
      const raw = localStorage.getItem(window.ENJOY_STORAGE_KEY);
      if (raw) {
        const appSt = JSON.parse(raw);
        if (appSt && appSt.profile && appSt.profile.mapPublic) {
          list.unshift({
            id: 'spot-me',
            name: appSt.profile.name || 'あなたの拠点',
            type: '⭐ あなたの公開エリア',
            icon: '🌟',
            area: appSt.profile.area || '活動エリア',
            query: appSt.profile.area || '大阪府高槻市',
            x: 52, y: 42,
            accessMemo: 'プロフィール設定で「マップ公開ON」にした自分のスポットです。',
            highlight: appSt.profile.skills || 'ご縁づくり活動中！'
          });
        }
      }
    } catch (e) {}
    return list;
  }

  /* ---------- 専用CSS注入 ---------- */
  function injectStyles() {
    if (document.getElementById('enjoy-map-style')) return;
    const style = document.createElement('style');
    style.id = 'enjoy-map-style';
    style.textContent = `
      .pokefuta-canvas {
        position: relative;
        width: 100%;
        height: 310px;
        border-radius: 18px;
        border: 2px solid var(--border);
        background:
          radial-gradient(circle at 25% 30%, rgba(104, 123, 80, 0.16) 0%, transparent 45%),
          radial-gradient(circle at 75% 65%, rgba(196, 147, 63, 0.18) 0%, transparent 48%),
          linear-gradient(135deg, #EFE7D8 0%, #F7F1E5 50%, #E7DEC9 100%);
        overflow: hidden;
        margin: 12px 0;
      }
      .map-grid-lines {
        position: absolute; inset: 0;
        background-image:
          linear-gradient(rgba(147,132,121,0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(147,132,121,0.12) 1px, transparent 1px);
        background-size: 36px 36px;
        pointer-events: none;
      }
      .pokefuta-pin {
        position: absolute;
        transform: translate(-50%, -50%);
        width: 56px; height: 56px;
        border-radius: 50%;
        border: 3px solid var(--ink);
        background: #FDFBF7;
        box-shadow: 0 4px 12px rgba(52, 42, 36, 0.22);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        cursor: pointer;
        transition: transform 0.15s;
        z-index: 2;
      }
      .pokefuta-pin:hover { transform: translate(-50%, -50%) scale(1.12); z-index: 5; }
      .pokefuta-pin.stamped {
        border-color: var(--accent);
        background: #FBF4E4;
        box-shadow: 0 0 0 3px rgba(198, 93, 59, 0.25), 0 4px 12px rgba(52, 42, 36, 0.2);
      }
      .pin-ico { font-size: 1.4rem; line-height: 1; }
      .pin-stamp-mark {
        position: absolute; top: -6px; right: -6px;
        background: var(--accent); color: #fff;
        font-size: 0.62rem; font-weight: 900; padding: 2px 5px;
        border-radius: 999px; border: 1.5px solid #fff;
      }
      .pin-label {
        position: absolute; top: 58px; left: 50%; transform: translateX(-50%);
        background: rgba(52, 42, 36, 0.88); color: #fff;
        padding: 2px 8px; border-radius: 999px; font-size: 0.7rem; font-weight: 700;
        white-space: nowrap; pointer-events: none;
      }
      .spot-list-grid {
        display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 10px;
      }
      .spot-card {
        background: var(--bg); border: 1px solid var(--border); border-radius: 12px;
        padding: 12px; display: flex; flex-direction: column; gap: 6px; cursor: pointer;
      }
      .spot-card.stamped { border-color: var(--accent); background: #FDF7EE; }
      .nav-mode-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0; }
      .stamp-seal {
        display: inline-block; border: 2px solid var(--accent); color: var(--accent);
        border-radius: 50%; padding: 4px 10px; font-weight: 900; font-size: 0.78rem;
        transform: rotate(-8deg);
      }
      @media (max-width: 860px) { .spot-list-grid { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
  }

  /* ---------- スポット詳細モーダル ---------- */
  function ensureModal() {
    if (document.getElementById('modal-spot-detail')) return;
    const m = document.createElement('div');
    m.id = 'modal-spot-detail';
    m.className = 'modal hidden';
    m.innerHTML = `
      <div class="modal-backdrop" data-spot-close="true"></div>
      <div class="modal-sheet">
        <div class="modal-head">
          <h2 id="spot-modal-title">🗺️ スポット詳細</h2>
          <button type="button" class="icon-close" data-spot-close="true">✕</button>
        </div>
        <div id="spot-modal-body" class="modal-body"></div>
      </div>
    `;
    document.body.appendChild(m);
    m.addEventListener('click', e => {
      if (e.target.closest('[data-spot-close]')) m.classList.add('hidden');
    });
  }

  function openSpotDetail(spotId) {
    const spot = getMergedSpots().find(s => s.id === spotId);
    if (!spot) return;
    const stampedDate = mapState.stamps[spot.id];
    const q = encodeURIComponent(spot.query || spot.area);

    document.getElementById('spot-modal-title').textContent = `${spot.icon} ${spot.name}`;
    document.getElementById('spot-modal-body').innerHTML = `
      <div class="badge-row" style="align-items:center; justify-content:space-between;">
        <div>
          <span class="phase-badge">${esc(spot.type)}</span>
          <span class="vis-badge">📍 ${esc(spot.area)}</span>
        </div>
        ${stampedDate ? `<span class="stamp-seal">済 ${esc(stampedDate)}</span>` : ''}
      </div>

      <p style="margin:10px 0; font-weight:700;">✨ ${esc(spot.highlight)}</p>
      <div class="info-strip" style="margin-bottom:12px;">
        <strong>🚗 リアル行き方メモ：</strong>${esc(spot.accessMemo)}
      </div>

      <span class="field-label">🧭 Googleマップで経路をひらく</span>
      <div class="nav-mode-row">
        <a href="https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving" target="_blank" rel="noopener" class="btn btn-outline btn-sm">🚗 車で行く</a>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=transit" target="_blank" rel="noopener" class="btn btn-outline btn-sm">🚃 電車・バス</a>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=walking" target="_blank" rel="noopener" class="btn btn-outline btn-sm">🚶 徒歩</a>
      </div>

      <div class="divider-sm"></div>
      <div class="form-actions-right">
        <button type="button" id="btn-toggle-stamp" class="btn ${stampedDate ? 'btn-outline' : 'btn-primary'}">
          ${stampedDate ? 'スタンプを取り消す' : '💮 訪問スタンプを押す！'}
        </button>
      </div>
    `;

    document.getElementById('btn-toggle-stamp').onclick = () => {
      if (mapState.stamps[spot.id]) {
        delete mapState.stamps[spot.id];
      } else {
        const d = new Date();
        mapState.stamps[spot.id] = `${d.getMonth() + 1}/${d.getDate()}`;
      }
      saveMapState();
      renderMap();
      openSpotDetail(spot.id);
    };

    document.getElementById('modal-spot-detail').classList.remove('hidden');
  }

  /* ---------- マップUI描画 ---------- */
  function renderMap() {
    const container = document.getElementById('plaza-map');
    if (!container) return;

    const allSpots = getMergedSpots();
    const filtered = filterType === 'all' ? allSpots : allSpots.filter(s => s.type.includes(filterType));
    const stampedCount = allSpots.filter(s => mapState.stamps[s.id]).length;
    const pct = allSpots.length ? Math.round((stampedCount / allSpots.length) * 100) : 0;

    container.innerHTML = `
      <div class="card">
        <div class="card-head">
          <div>
            <span class="eyebrow">EN•joy v5.2 — 公開ONの拠点だけをめぐる (#20)</span>
            <h2>🗺️ ポケフタ風「ご縁めぐりマップ」</h2>
          </div>
          <span class="mini-pill">💮 訪問スタンプ ${stampedCount} / ${allSpots.length} (${pct}%)</span>
        </div>

        <div class="progress-track"><div class="progress-fill" style="width:${pct}%;"></div></div>

        <div class="filter-bar" style="margin-top:12px;">
          <button type="button" class="chip-filter ${filterType === 'all' ? 'active' : ''}" data-map-filter="all">すべて</button>
          <button type="button" class="chip-filter ${filterType === '農家' ? 'active' : ''}" data-map-filter="農家">🌱 農家・直売</button>
          <button type="button" class="chip-filter ${filterType === '町工場' ? 'active' : ''}" data-map-filter="町工場">🏭 町工場</button>
          <button type="button" class="chip-filter ${filterType === '拠点' ? 'active' : ''}" data-map-filter="拠点">🏮 拠点・キッチン</button>
        </div>

        <!-- ポケフタ風カスタムピンボード -->
        <div class="pokefuta-canvas" aria-label="ご縁めぐりマップ">
          <div class="map-grid-lines"></div>
          ${filtered.map(s => {
            const isStamped = !!mapState.stamps[s.id];
            return `
              <button type="button" class="pokefuta-pin ${isStamped ? 'stamped' : ''}"
                      style="left:${s.x}%; top:${s.y}%;" data-open-spot="${esc(s.id)}">
                <span class="pin-ico">${s.icon}</span>
                ${isStamped ? '<span class="pin-stamp-mark">済</span>' : ''}
                <span class="pin-label">${esc(s.name.slice(0, 10))}</span>
              </button>
            `;
          }).join('')}
        </div>

        <!-- スポット一覧カード -->
        <div class="spot-list-grid">
          ${filtered.map(s => {
            const isStamped = !!mapState.stamps[s.id];
            return `
              <div class="spot-card ${isStamped ? 'stamped' : ''}" data-open-spot="${esc(s.id)}">
                <div class="feed-meta" style="margin-bottom:2px;">
                  <span class="tag-pill">${esc(s.type)}</span>
                  <span>${esc(s.area)}</span>
                  ${isStamped ? '<span class="phase-badge">💮 訪問済</span>' : ''}
                </div>
                <strong>${s.icon} ${esc(s.name)}</strong>
                <div class="hint-text" style="margin:0;">${esc(s.highlight)}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 新規スポット登録 -->
      <div class="card">
        <h3 class="card-title-sm">📍 ご縁スポットを新しく追加する</h3>
        <form id="form-add-spot" class="stack-form">
          <div class="form-row-2">
            <input type="text" id="spot-in-name" class="input" placeholder="スポット名（例：〇〇マルシェ会場）" required />
            <input type="text" id="spot-in-area" class="input" placeholder="エリア（例：京都府宇治市）" required />
          </div>
          <div class="form-row-2">
            <select id="spot-in-type" class="input">
              <option value="🌱 農家・直売所">🌱 農家・直売所</option>
              <option value="🏭 町工場・加工">🏭 町工場・加工</option>
              <option value="🎪 拠点・マルシェ">🎪 拠点・マルシェ</option>
            </select>
            <input type="text" id="spot-in-memo" class="input" placeholder="行き方メモ（駐車場・目印など）" />
          </div>
          <div class="form-actions-right">
            <button type="submit" class="btn btn-primary btn-sm">マップにピンを立てる</button>
          </div>
        </form>
      </div>
    `;

    // イベント
    container.querySelectorAll('[data-map-filter]').forEach(btn => {
      btn.onclick = () => {
        filterType = btn.dataset.mapFilter;
        renderMap();
      };
    });
    container.querySelectorAll('[data-open-spot]').forEach(el => {
      el.onclick = () => openSpotDetail(el.dataset.openSpot);
    });
    const form = document.getElementById('form-add-spot');
    if (form) {
      form.onsubmit = e => {
        e.preventDefault();
        const name = document.getElementById('spot-in-name').value.trim();
        const area = document.getElementById('spot-in-area').value.trim();
        const type = document.getElementById('spot-in-type').value;
        const memo = document.getElementById('spot-in-memo').value.trim() || '現地でEN•joyの目印を探してください！';
        if (!name || !area) return;
        mapState.spots.push({
          id: 'spot-' + Date.now(),
          name,
          type,
          icon: type.startsWith('🌱') ? '🥬' : type.startsWith('🏭') ? '🛠️' : '🎪',
          area,
          query: area + ' ' + name,
          x: 20 + Math.floor(Math.random() * 62),
          y: 22 + Math.floor(Math.random() * 58),
          accessMemo: memo,
          highlight: '新しく追加されたEN•joyご縁スポット！'
        });
        saveMapState();
        renderMap();
      };
    }
  }

  /* ---------- 起動 ---------- */
  function init() {
    injectStyles();
    ensureModal();
    renderMap();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();