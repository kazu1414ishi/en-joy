/* ============================================================
   EN•joy v5.1 — 円形・和紙「ご縁の年輪ボード」専用モジュール (board.js)
   ※ index.html の <script src="app.js"></script> の直後に読み込むだけで動作します
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'enjoy_v51_ring_board';

  // 年輪リング定義（0: 創設の輪 12コマ / 1: 第1回マルシェの輪 18コマ）
  const RINGS = [
    { id: 0, name: '1周目：創設の輪', slots: 12, rIn: 92, rOut: 178 },
    { id: 1, name: '2周目：マルシェの輪', slots: 18, rIn: 184, rOut: 274 }
  ];

  // 応援ランク別サイズ定義
  const RANKS = {
    S:  { label: '☕ S枠（1コマ・¥500目安）',  span: 1, color: '#EFE7D8' },
    M:  { label: '🍱 M枠（2コマ・¥1,500目安）', span: 2, color: '#FBF4E4' },
    L:  { label: '🔥 L枠（3コマ・¥5,000目安）', span: 3, color: '#FBECE6' },
    XL: { label: '🏢 XL協賛枠（4コマ・特別）',  span: 4, color: '#EDF2E6' }
  };

  // デモ用初期データ
  function createDefaultEntries() {
    return [
      {
        id: 'ent-1', ring: 0, start: 0, span: 2, rank: 'M',
        name: '信州・青木りんご園', role: '🌱 農家・生産者',
        message: '蜜入りりんごで全国を笑顔に！',
        imageData: null, createdAt: '11/24'
      },
      {
        id: 'ent-2', ring: 0, start: 2, span: 2, rank: 'M',
        name: 'なにわ乾燥工房', role: '🏭 町工場・加工',
        message: '小ロット試作まかせてください！',
        imageData: null, createdAt: '11/24'
      },
      {
        id: 'ent-3', ring: 0, start: 4, span: 3, rank: 'L',
        name: '京都テストキッチン協賛', role: '🏢 協賛パートナー',
        message: 'EN•dressの挑戦を全力応援します！',
        imageData: null, createdAt: '11/24'
      },
      {
        id: 'ent-4', ring: 0, start: 7, span: 1, rank: 'S',
        name: 'マルシェ好きミキ', role: '🧡 個人サポーター',
        message: '古民家ショップ楽しみ！',
        imageData: null, createdAt: '11/24'
      }
    ];
  }

  let entries = loadEntries();
  let selectedRank = 'S';
  let boardRotation = 0;
  let activeSlotTarget = null; // { ring, start, span }

  // キャンバス描画状態
  let canvas, ctx;
  let isDrawing = false;
  let penColor = '#342A24';
  let penWidth = 4;
  let strokes = [];
  let currentStroke = null;

  function loadEntries() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return createDefaultEntries();
  }

  function saveEntries() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      alert('保存容量がいっぱいです。');
    }
  }

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- 専用CSSを自動注入 ---------- */
  function injectStyles() {
    if (document.getElementById('enjoy-board-style')) return;
    const style = document.createElement('style');
    style.id = 'enjoy-board-style';
    style.textContent = `
      .ring-wrap { display: flex; flex-direction: column; gap: 14px; }
      .ring-controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; }
      .ring-rank-pills { display: flex; flex-wrap: wrap; gap: 6px; }
      .rank-pill {
        padding: 6px 11px; border-radius: 999px; border: 1px solid var(--border);
        background: var(--bg-paper); color: var(--ink); font-size: 0.78rem; font-weight: 700; cursor: pointer;
      }
      .rank-pill.active { background: var(--accent); color: #fff; border-color: var(--accent); }
      .ring-stage {
        background: #F4ECDD;
        background-image: radial-gradient(rgba(147,132,121,0.18) 1px, transparent 1px);
        background-size: 16px 16px;
        border: 2px solid var(--border);
        border-radius: 20px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow: hidden;
      }
      .ring-svg {
        width: 100%; max-width: 560px; height: auto;
        transition: transform 0.25s ease;
        user-select: none; -webkit-user-select: none;
      }
      .ring-slot-empty { cursor: pointer; transition: fill 0.15s; }
      .ring-slot-empty:hover { fill: rgba(198, 93, 59, 0.16); }
      .ring-slot-filled { cursor: pointer; transition: opacity 0.15s; }
      .ring-slot-filled:hover { opacity: 0.85; }
      .ring-rotate-bar {
        display: flex; align-items: center; gap: 10px; width: 100%; max-width: 420px;
        margin-top: 10px; font-size: 0.82rem; font-weight: 700; color: var(--ink-sub);
      }
      .ring-rotate-bar input[type="range"] { flex: 1; accent-color: var(--accent); }
      .draw-canvas-wrap {
        background: #FAF5EB;
        border: 2px dashed var(--accent);
        border-radius: 14px;
        overflow: hidden;
        touch-action: none;
        margin: 8px 0;
      }
      #ring-draw-canvas { width: 100%; height: 220px; display: block; cursor: crosshair; touch-action: none; }
      .pen-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
      .pen-colors, .pen-sizes { display: flex; gap: 6px; align-items: center; }
      .pen-dot {
        width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent; cursor: pointer;
      }
      .pen-dot.active { border-color: #222; transform: scale(1.12); box-shadow: 0 0 0 2px #fff inset; }
      .pen-size-btn {
        padding: 4px 10px; border-radius: 8px; border: 1px solid var(--border);
        background: var(--bg); font-size: 0.78rem; font-weight: 700; cursor: pointer;
      }
      .pen-size-btn.active { background: var(--ink); color: #fff; }
      .ring-view-img {
        width: 100%; max-height: 220px; object-fit: contain;
        background: #FAF5EB; border: 1px solid var(--border); border-radius: 12px; margin: 10px 0;
      }
    `;
    document.head.appendChild(style);
  }

  /* ---------- 極座標・扇形SVGパス計算 ---------- */
  function polarToXY(cx, cy, r, angleDeg) {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function buildSectorPath(cx, cy, rIn, rOut, startDeg, endDeg) {
    const p1 = polarToXY(cx, cy, rOut, startDeg);
    const p2 = polarToXY(cx, cy, rOut, endDeg);
    const p3 = polarToXY(cx, cy, rIn, endDeg);
    const p4 = polarToXY(cx, cy, rIn, startDeg);
    const large = (endDeg - startDeg) > 180 ? 1 : 0;
    return [
      `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`,
      `A ${rOut} ${rOut} 0 ${large} 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
      `L ${p3.x.toFixed(1)} ${p3.y.toFixed(1)}`,
      `A ${rIn} ${rIn} 0 ${large} 0 ${p4.x.toFixed(1)} ${p4.y.toFixed(1)}`,
      'Z'
    ].join(' ');
  }

  function isSlotOccupied(ringId, slotIndex) {
    return entries.some(e => e.ring === ringId && slotIndex >= e.start && slotIndex < e.start + e.span);
  }

  function canPlace(ringId, startSlot, span) {
    const ring = RINGS[ringId];
    if (!ring || startSlot + span > ring.slots) return false;
    for (let i = startSlot; i < startSlot + span; i++) {
      if (isSlotOccupied(ringId, i)) return false;
    }
    return true;
  }

  /* ---------- 年輪ボードUIの描画 ---------- */
  function renderRingBoard() {
    const container = document.getElementById('my-ring');
    if (!container) return;

    const totalSlots = RINGS.reduce((s, r) => s + r.slots, 0);
    const usedSlots = entries.reduce((s, e) => s + e.span, 0);
    const pct = Math.round((usedSlots / totalSlots) * 100);

    container.innerHTML = `
      <div class="card ring-wrap">
        <div class="card-head">
          <div>
            <span class="eyebrow">EN•joy v5.1 — みんなで埋める円形手書きウォール</span>
            <h2>✍️ ご縁の年輪ボード（現在 ${entries.length}組・達成率 ${pct}%）</h2>
          </div>
          <span class="mini-pill">${usedSlots} / ${totalSlots} コマ</span>
        </div>

        <div class="progress-track"><div class="progress-fill" style="width:${pct}%;"></div></div>

        <div class="ring-controls">
          <div>
            <span class="field-label" style="margin-bottom:4px;">① 枠サイズを選んで、下の「空き枠（点線）」をタップして手書き！</span>
            <div class="ring-rank-pills">
              ${Object.entries(RANKS).map(([key, r]) => `
                <button type="button" class="rank-pill ${selectedRank === key ? 'active' : ''}" data-ring-rank="${key}">
                  ${r.label}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="ring-stage">
          ${buildBoardSvg()}
          <div class="ring-rotate-bar">
            <span>🔄 回転</span>
            <input type="range" id="ring-rotate-slider" min="0" max="360" value="${boardRotation}" />
            <button type="button" class="btn btn-outline btn-sm" id="btn-ring-rot-reset">正面</button>
          </div>
          <p class="hint-text">※点線の空き枠をタップすると「水平な拡大和紙キャンバス」が開きます。書き込み済みの枠をタップすると拡大して読めます。</p>
        </div>
      </div>
    `;

    bindBoardEvents();
  }

  function buildBoardSvg() {
    const cx = 300, cy = 300;
    let pathsHtml = '';

    RINGS.forEach(ring => {
      const step = 360 / ring.slots;

      // 1. 空き枠（点線）
      for (let i = 0; i < ring.slots; i++) {
        if (isSlotOccupied(ring.id, i)) continue;
        const startDeg = i * step + 1.2;
        const endDeg = (i + 1) * step - 1.2;
        const d = buildSectorPath(cx, cy, ring.rIn, ring.rOut, startDeg, endDeg);
        const mid = polarToXY(cx, cy, (ring.rIn + ring.rOut) / 2, (startDeg + endDeg) / 2);
        pathsHtml += `
          <g class="ring-slot-empty" data-empty-slot="${ring.id}|${i}">
            <path d="${d}" fill="rgba(255,255,255,0.45)" stroke="#C9BCA8" stroke-width="1.5" stroke-dasharray="4 3" />
            <text x="${mid.x.toFixed(1)}" y="${mid.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle"
                  fill="#938479" font-size="11" font-weight="700">＋</text>
          </g>
        `;
      }

      // 2. 書き込み済み枠
      entries.filter(e => e.ring === ring.id).forEach(e => {
        const startDeg = e.start * step + 1.2;
        const endDeg = (e.start + e.span) * step - 1.2;
        const midDeg = (startDeg + endDeg) / 2;
        const rMid = (ring.rIn + ring.rOut) / 2;
        const mid = polarToXY(cx, cy, rMid, midDeg);
        const d = buildSectorPath(cx, cy, ring.rIn, ring.rOut, startDeg, endDeg);
        const fill = (RANKS[e.rank] && RANKS[e.rank].color) || '#FDFBF7';

        let innerContent = '';
        if (e.imageData) {
          const imgW = Math.min(110, 42 + e.span * 22);
          const imgH = 58;
          innerContent = `
            <g transform="rotate(${midDeg.toFixed(1)}, ${mid.x.toFixed(1)}, ${mid.y.toFixed(1)})">
              <image href="${e.imageData}" x="${(mid.x - imgW / 2).toFixed(1)}" y="${(mid.y - imgH / 2 - 4).toFixed(1)}"
                     width="${imgW}" height="${imgH}" preserveAspectRatio="xMidYMid meet" />
              <text x="${mid.x.toFixed(1)}" y="${(mid.y + imgH / 2 + 5).toFixed(1)}" text-anchor="middle"
                    fill="#6E5F55" font-size="9" font-weight="700">${esc(e.name.slice(0, 10))}</text>
            </g>
          `;
        } else {
          innerContent = `
            <g transform="rotate(${midDeg.toFixed(1)}, ${mid.x.toFixed(1)}, ${mid.y.toFixed(1)})">
              <text x="${mid.x.toFixed(1)}" y="${(mid.y - 6).toFixed(1)}" text-anchor="middle"
                    fill="#342A24" font-size="10.5" font-weight="800">${esc(e.name.slice(0, 10))}</text>
              <text x="${mid.x.toFixed(1)}" y="${(mid.y + 9).toFixed(1)}" text-anchor="middle"
                    fill="#6E5F55" font-size="8.5">${esc(e.message.slice(0, 12))}</text>
            </g>
          `;
        }

        pathsHtml += `
          <g class="ring-slot-filled" data-view-entry="${esc(e.id)}">
            <path d="${d}" fill="${fill}" stroke="#C65D3B" stroke-width="1.6" />
            ${innerContent}
          </g>
        `;
      });
    });

    return `
      <svg id="ring-board-svg" class="ring-svg" viewBox="0 0 600 600" style="transform: rotate(${boardRotation}deg);">
        <circle cx="${cx}" cy="${cy}" r="286" fill="none" stroke="#D7C9B4" stroke-width="2" />
        ${pathsHtml}
        <!-- 中心：EN•joy 丸印 -->
        <circle cx="${cx}" cy="${cy}" r="82" fill="#FDFBF7" stroke="#C65D3B" stroke-width="4" />
        <circle cx="${cx}" cy="${cy}" r="74" fill="none" stroke="#C4933F" stroke-width="1.5" stroke-dasharray="4 3" />
        <text x="${cx}" y="${cy - 6}" text-anchor="middle" fill="#342A24" font-size="26" font-weight="900">EN•joy</text>
        <text x="${cx}" y="${cy + 18}" text-anchor="middle" fill="#C65D3B" font-size="11" font-weight="800">ご縁の年輪</text>
      </svg>
    `;
  }

  /* ---------- 手書きモーダル & 詳細モーダルを動的生成 ---------- */
  function ensureModals() {
    if (!document.getElementById('ring-draw-modal')) {
      const m = document.createElement('div');
      m.id = 'ring-draw-modal';
      m.className = 'modal hidden';
      m.innerHTML = `
        <div class="modal-backdrop" data-ring-close="ring-draw-modal"></div>
        <div class="modal-sheet">
          <div class="modal-head">
            <h2 id="ring-draw-title">✍️ 和紙に手書きで書き込む</h2>
            <button type="button" class="icon-close" data-ring-close="ring-draw-modal">✕</button>
          </div>
          <div class="modal-body">
            <div class="pen-toolbar">
              <div class="pen-colors">
                <button type="button" class="pen-dot active" data-pen-color="#342A24" style="background:#342A24;" title="墨ブラウン"></button>
                <button type="button" class="pen-dot" data-pen-color="#C65D3B" style="background:#C65D3B;" title="朱テラコッタ"></button>
                <button type="button" class="pen-dot" data-pen-color="#687B50" style="background:#687B50;" title="抹茶オリーブ"></button>
                <button type="button" class="pen-dot" data-pen-color="#C4933F" style="background:#C4933F;" title="金色"></button>
              </div>
              <div class="pen-sizes">
                <button type="button" class="pen-size-btn" data-pen-size="2.5">細</button>
                <button type="button" class="pen-size-btn active" data-pen-size="4.5">中</button>
                <button type="button" class="pen-size-btn" data-pen-size="8">太</button>
                <button type="button" class="btn btn-outline btn-sm" id="btn-ring-undo">↩️ 戻す</button>
                <button type="button" class="btn btn-outline btn-sm" id="btn-ring-clear">🗑️ 消す</button>
              </div>
            </div>

            <div class="draw-canvas-wrap">
              <canvas id="ring-draw-canvas" width="600" height="280"></canvas>
            </div>

            <form id="form-ring-save" class="stack-form">
              <div class="form-row-2">
                <input type="text" id="ring-in-name" class="input" placeholder="載せるお名前・屋号（匿名OK）" required />
                <select id="ring-in-role" class="input">
                  <option value="🧡 個人サポーター">🧡 個人サポーター</option>
                  <option value="🌱 農家・生産者">🌱 農家・生産者</option>
                  <option value="🏭 町工場・加工">🏭 町工場・加工</option>
                  <option value="🏢 協賛パートナー">🏢 協賛パートナー</option>
                </select>
              </div>
              <input type="text" id="ring-in-msg" class="input" placeholder="ひとこと応援メッセージ（任意）" />
              <div class="form-actions-right">
                <button type="button" class="btn btn-outline" data-ring-close="ring-draw-modal">キャンセル</button>
                <button type="submit" class="btn btn-primary">年輪ボードに刻む！</button>
              </div>
            </form>
          </div>
        </div>
      `;
      document.body.appendChild(m);
      setupCanvas();
    }

    if (!document.getElementById('ring-view-modal')) {
      const v = document.createElement('div');
      v.id = 'ring-view-modal';
      v.className = 'modal hidden';
      v.innerHTML = `
        <div class="modal-backdrop" data-ring-close="ring-view-modal"></div>
        <div class="modal-sheet">
          <div class="modal-head">
            <h2>✍️ ご縁のサイン詳細</h2>
            <button type="button" class="icon-close" data-ring-close="ring-view-modal">✕</button>
          </div>
          <div id="ring-view-body" class="modal-body"></div>
        </div>
      `;
      document.body.appendChild(v);
    }
  }

  /* ---------- 手書きキャンバス制御 ---------- */
  function setupCanvas() {
    canvas = document.getElementById('ring-draw-canvas');
    ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
      };
    }

    canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      isDrawing = true;
      const p = getPos(e);
      currentStroke = { color: penColor, width: penWidth, points: [p] };
      strokes.push(currentStroke);
      redrawCanvas();
    });

    canvas.addEventListener('pointermove', e => {
      if (!isDrawing || !currentStroke) return;
      e.preventDefault();
      currentStroke.points.push(getPos(e));
      redrawCanvas();
    });

    const endDraw = () => { isDrawing = false; currentStroke = null; };
    canvas.addEventListener('pointerup', endDraw);
    canvas.addEventListener('pointercancel', endDraw);

    // ツールバー操作
    document.querySelectorAll('[data-pen-color]').forEach(btn => {
      btn.onclick = () => {
        penColor = btn.dataset.penColor;
        document.querySelectorAll('[data-pen-color]').forEach(b => b.classList.toggle('active', b === btn));
      };
    });
    document.querySelectorAll('[data-pen-size]').forEach(btn => {
      btn.onclick = () => {
        penWidth = Number(btn.dataset.penSize);
        document.querySelectorAll('[data-pen-size]').forEach(b => b.classList.toggle('active', b === btn));
      };
    });
    document.getElementById('btn-ring-undo').onclick = () => {
      strokes.pop();
      redrawCanvas();
    };
    document.getElementById('btn-ring-clear').onclick = () => {
      strokes = [];
      redrawCanvas();
    };

    // 保存
    document.getElementById('form-ring-save').onsubmit = e => {
      e.preventDefault();
      if (!activeSlotTarget) return;
      const name = document.getElementById('ring-in-name').value.trim() || '匿名サポーター';
      const role = document.getElementById('ring-in-role').value;
      const message = document.getElementById('ring-in-msg').value.trim();
      const imageData = strokes.length > 0 ? canvas.toDataURL('image/png') : null;

      const d = new Date();
      entries.push({
        id: 'ent-' + Date.now(),
        ring: activeSlotTarget.ring,
        start: activeSlotTarget.start,
        span: activeSlotTarget.span,
        rank: selectedRank,
        name,
        role,
        message,
        imageData,
        createdAt: `${d.getMonth() + 1}/${d.getDate()}`
      });

      saveEntries();
      document.getElementById('ring-draw-modal').classList.add('hidden');
      renderRingBoard();
    };
  }

  function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach(s => {
      if (!s.points.length) return;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      if (s.points.length === 1) {
        ctx.lineTo(s.points[0].x + 0.1, s.points[0].y + 0.1);
      }
      ctx.stroke();
    });
  }

  /* ---------- ボード操作イベント ---------- */
  function bindBoardEvents() {
    document.querySelectorAll('[data-ring-rank]').forEach(btn => {
      btn.onclick = () => {
        selectedRank = btn.dataset.ringRank;
        renderRingBoard();
      };
    });

    const slider = document.getElementById('ring-rotate-slider');
    const svg = document.getElementById('ring-board-svg');
    if (slider && svg) {
      slider.oninput = () => {
        boardRotation = Number(slider.value);
        svg.style.transform = `rotate(${boardRotation}deg)`;
      };
    }
    const resetBtn = document.getElementById('btn-ring-rot-reset');
    if (resetBtn && slider && svg) {
      resetBtn.onclick = () => {
        boardRotation = 0;
        slider.value = 0;
        svg.style.transform = 'rotate(0deg)';
      };
    }

    // 空き枠タップ → 水平手書きモーダルを開く
    document.querySelectorAll('[data-empty-slot]').forEach(g => {
      g.onclick = () => {
        const [ringId, slotIdx] = g.dataset.emptySlot.split('|').map(Number);
        const span = RANKS[selectedRank].span;
        if (!canPlace(ringId, slotIdx, span)) {
          alert(`この位置は連続して ${span} コマ空いていません。別の空き枠か、小さい枠サイズを選んでください！`);
          return;
        }
        activeSlotTarget = { ring: ringId, start: slotIdx, span };
        strokes = [];
        redrawCanvas();
        document.getElementById('ring-draw-title').textContent = `✍️ ${RANKS[selectedRank].label} に手書きする`;
        document.getElementById('ring-in-name').value = '';
        document.getElementById('ring-in-msg').value = '';
        document.getElementById('ring-draw-modal').classList.remove('hidden');
      };
    });

    // 書き込み済み枠タップ → 拡大詳細表示
    document.querySelectorAll('[data-view-entry]').forEach(g => {
      g.onclick = () => {
        const ent = entries.find(x => x.id === g.dataset.viewEntry);
        if (!ent) return;
        const body = document.getElementById('ring-view-body');
        body.innerHTML = `
          <div class="badge-row">
            <span class="phase-badge">${esc(ent.role)}</span>
            <span class="vis-badge">${esc(RANKS[ent.rank]?.label || ent.rank)}</span>
          </div>
          <h3 style="margin-top:6px;">${esc(ent.name)}</h3>
          <p class="hint-text">記入日：${esc(ent.createdAt)}</p>
          ${ent.imageData ? `<img class="ring-view-img" src="${ent.imageData}" alt="手書きサイン" />` : ''}
          ${ent.message ? `<p style="margin-top:8px; font-weight:700;">「${esc(ent.message)}」</p>` : ''}
        `;
        document.getElementById('ring-view-modal').classList.remove('hidden');
      };
    });
  }

  document.addEventListener('click', e => {
    const closeBtn = e.target.closest('[data-ring-close]');
    if (closeBtn) {
      const target = document.getElementById(closeBtn.dataset.ringClose);
      if (target) target.classList.add('hidden');
    }
  });

  /* ---------- 起動 ---------- */
  function init() {
    injectStyles();
    ensureModals();
    renderRingBoard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();