/* =========================================================
   EN•joy みんなホワイトボード v3（patch_whiteboard.js）
   ・🖥️ PCワイド大画面＆スマホ両対応（高精細800×600 / 4:3・Escで全画面終了）
   ・📤 1タップ共有（トークに画像投稿 / 巣立ち完成写真セット / 公開ストーリー記録 / PNG保存）
   ・📐 図形（ペン/矢印/四角/丸/直線）＋ 📷 写真赤入れ ＋ メンバー別レイヤー
   ========================================================= */

(function () {
  const WB_W = 800;
  const WB_H = 600;
  let wbFullscreen = false;

  if (typeof EN_TOOL_CATALOG !== 'undefined' && !EN_TOOL_CATALOG.some(t => t.id === 'whiteboard')) {
    EN_TOOL_CATALOG.splice(1, 0, {
      id: 'whiteboard',
      icon: '🎨',
      name: 'ホワイトボード',
      cat: '発想・解決',
      desc: 'PC大画面・図形・写真赤入れ・メンバー別レイヤー＆1タップ共有対応'
    });
  }

  function createInitialWhiteboard() {
    return {
      activeLayerId: 'me',
      tool: 'pen',
      penSize: 4,
      layers: [
        { id: 'me',      name: 'あなた',     color: '#e06d1f', visible: true },
        { id: 'farm',    name: '山田農園',   color: '#10b981', visible: true },
        { id: 'factory', name: 'カワチ加工', color: '#3b82f6', visible: true },
        { id: 'design',  name: '木漏れ日',   color: '#a855f7', visible: true },
        { id: 'ai',      name: '🤖 AI',      color: '#ec4899', visible: true }
      ],
      photos: [
        { id: 'ph-init-1', layerId: 'farm', src: EN_IMAGES.tomato, x: 26, y: 34, w: 32 }
      ],
      strokes: [
        { type: 'circle', layerId: 'farm',    color: '#10b981', size: 4, x1: 75,  y1: 95,  x2: 345, y2: 315 },
        { type: 'arrow',  layerId: 'factory', color: '#3b82f6', size: 4, x1: 365, y1: 205, x2: 500, y2: 205 },
        { type: 'rect',   layerId: 'design',  color: '#a855f7', size: 4, x1: 520, y1: 100, x2: 745, y2: 310 }
      ],
      notes: [
        { id: 'n-1', layerId: 'farm',    x: 26, y: 65, text: '完熟トマト30kg！砂糖ゼロでも激甘🍅' },
        { id: 'n-2', layerId: 'factory', x: 54, y: 72, text: '低温60℃×8hでサクサク確認済！' },
        { id: 'n-3', layerId: 'design',  x: 79, y: 34, text: '窓付きクラフト袋＋農家イラスト案📦' },
        { id: 'n-4', layerId: 'me',      x: 24, y: 84, text: 'まずは50袋テストでマルシェ反応見よう！' }
      ]
    };
  }

  function ensureWhiteboard(d) {
    if (!d.whiteboard) {
      d.whiteboard = createInitialWhiteboard();
      if (!d.activeTools.includes('whiteboard')) d.activeTools.unshift('whiteboard');
      if (!d.pinnedTools.includes('whiteboard')) d.pinnedTools.unshift('whiteboard');
      if (typeof saveRoomProStore === 'function') saveRoomProStore();
    }
    if (!Array.isArray(d.whiteboard.photos)) d.whiteboard.photos = [];
    if (!Array.isArray(d.storyShots)) d.storyShots = [];
    if (!d.whiteboard.tool) d.whiteboard.tool = 'pen';
    return d.whiteboard;
  }

  if (typeof window.getRoomProData === 'function') {
    const origGet = window.getRoomProData;
    window.getRoomProData = function (labId) {
      const d = origGet(labId);
      ensureWhiteboard(d);
      return d;
    };
  }

  if (typeof window.getBoardItemCount === 'function') {
    const origCount = window.getBoardItemCount;
    window.getBoardItemCount = function (d, tid) {
      if (tid === 'whiteboard') {
        const wb = ensureWhiteboard(d);
        return `写真${wb.photos.length}・付箋${wb.notes.length}`;
      }
      return origCount(d, tid);
    };
  }

  if (typeof window.runAiToolAssist === 'function') {
    const origAi = window.runAiToolAssist;
    window.runAiToolAssist = function (labId, toolId) {
      if (toolId === 'whiteboard') {
        if (!enAiProEnabled) return origAi(labId, toolId);
        const d = getRoomProData(labId);
        const wb = ensureWhiteboard(d);
        const aiLayer = wb.layers.find(l => l.id === 'ai');
        if (aiLayer) aiLayer.visible = true;
        wb.notes.push({
          id: 'n-ai-' + Date.now(),
          layerId: 'ai',
          x: 72, y: 70,
          text: '✨AIまとめ：写真＋窓袋訴求で¥480ギフト路線が最強！'
        });
        wb.strokes.push({
          type: 'arrow', layerId: 'ai', color: '#ec4899', size: 4,
          x1: 270, y1: 350, x2: 495, y2: 410
        });
        saveRoomProStore();
        enToast('🤖 AIレイヤー（ピンク）に矢印＆まとめ付箋を追加しました！');
        renderEnRoomModal();
        return;
      }
      return origAi(labId, toolId);
    };
  }

  // ストローク・図形描画
  function drawOneStroke(ctx, st) {
    const type = st.type || 'free';
    ctx.strokeStyle = st.color;
    ctx.fillStyle = st.color;
    ctx.lineWidth = st.size || 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (type === 'free') {
      if (!st.pts || st.pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(st.pts[0].x, st.pts[0].y);
      for (let i = 1; i < st.pts.length; i++) ctx.lineTo(st.pts[i].x, st.pts[i].y);
      ctx.stroke();
      return;
    }

    const { x1, y1, x2, y2 } = st;
    if (type === 'rect') {
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    } else if (type === 'circle') {
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
      const rx = Math.abs(x2 - x1) / 2, ry = Math.abs(y2 - y1) / 2;
      if (rx < 1 && ry < 1) return;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (type === 'line') {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    } else if (type === 'arrow') {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = Math.max(13, (st.size || 3) * 4);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }
  }

  function redrawCanvas(canvas, wb, previewStroke = null) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, WB_W, WB_H);
    const visMap = {};
    wb.layers.forEach(l => { visMap[l.id] = l.visible; });
    wb.strokes.forEach(st => { if (visMap[st.layerId]) drawOneStroke(ctx, st); });
    if (previewStroke) drawOneStroke(ctx, previewStroke);
  }

  // 📷 写真＋赤入れ＋付箋を1枚の合成画像(DataURL)へ変換（CORS安全フォールバック付）
  async function buildWhiteboardSnapshot(wb, canvas, skipExternal = false) {
    const out = document.createElement('canvas');
    out.width = WB_W; out.height = WB_H;
    const octx = out.getContext('2d');

    // 背景＋うっすらドットグリッド
    octx.fillStyle = '#fffdf9';
    octx.fillRect(0, 0, WB_W, WB_H);
    octx.fillStyle = 'rgba(120, 113, 108, 0.18)';
    for (let x = 20; x < WB_W; x += 24) {
      for (let y = 20; y < WB_H; y += 24) {
        octx.fillRect(x, y, 2, 2);
      }
    }

    // 1) 表示中写真を合成
    for (const ph of wb.photos) {
      const ly = wb.layers.find(l => l.id === ph.layerId);
      if (!ly || !ly.visible) continue;
      const isExternal = /^https?:\/\//i.test(ph.src);
      if (skipExternal && isExternal) {
        const dw = ((ph.w || 32) / 100) * WB_W;
        const dh = dw * 0.68;
        const dx = (ph.x / 100) * WB_W - dw / 2;
        const dy = (ph.y / 100) * WB_H - dh / 2;
        octx.fillStyle = '#f3efe6'; octx.fillRect(dx, dy, dw, dh);
        octx.strokeStyle = ly.color; octx.lineWidth = 3; octx.strokeRect(dx, dy, dw, dh);
        octx.fillStyle = '#78716c'; octx.font = 'bold 13px sans-serif';
        octx.fillText(`📷 ${ly.name}のサンプル写真`, dx + 12, dy + dh / 2);
        continue;
      }
      await new Promise(res => {
        const img = new Image();
        if (isExternal) img.crossOrigin = 'anonymous';
        img.onload = () => {
          const dw = ((ph.w || 32) / 100) * WB_W;
          const dh = (img.naturalHeight / (img.naturalWidth || 1)) * dw;
          const dx = (ph.x / 100) * WB_W - dw / 2;
          const dy = (ph.y / 100) * WB_H - dh / 2;
          try {
            octx.drawImage(img, dx, dy, dw, dh);
            octx.strokeStyle = ly.color; octx.lineWidth = 3; octx.strokeRect(dx, dy, dw, dh);
          } catch (e) {}
          res();
        };
        img.onerror = res;
        img.src = ph.src;
      });
    }

    // 2) 線・図形を合成
    octx.drawImage(canvas, 0, 0);

    // 3) 付箋を合成（2行折り返し対応）
    wb.notes.forEach(n => {
      const ly = wb.layers.find(l => l.id === n.layerId);
      if (!ly || !ly.visible) return;
      const nw = 176, nh = 62;
      const px = Math.max(8, Math.min(WB_W - nw - 8, (n.x / 100) * WB_W - nw / 2));
      const py = Math.max(8, Math.min(WB_H - nh - 8, (n.y / 100) * WB_H - nh / 2));
      octx.fillStyle = 'rgba(0,0,0,0.12)'; octx.fillRect(px + 2, py + 3, nw, nh);
      octx.fillStyle = '#ffffff'; octx.fillRect(px, py, nw, nh);
      octx.fillStyle = ly.color;  octx.fillRect(px, py, nw, 5);
      octx.fillStyle = ly.color;  octx.font = 'bold 11px sans-serif';
      octx.fillText(`● ${ly.name}`, px + 8, py + 20);
      octx.fillStyle = '#1c1917'; octx.font = '12px sans-serif';
      octx.fillText(n.text.slice(0, 13), px + 8, py + 38);
      if (n.text.length > 13) octx.fillText(n.text.slice(13, 26), px + 8, py + 54);
    });

    try {
      return out.toDataURL('image/jpeg', 0.86);
    } catch (e) {
      if (!skipExternal) return buildWhiteboardSnapshot(wb, canvas, true);
      return '';
    }
  }

  // 画像自動軽量化
  function compressPhotoFile(file, callback) {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const maxSide = 760;
        let w = img.width, h = img.height;
        if (w > maxSide || h > maxSide) {
          if (w >= h) { h = Math.round((h * maxSide) / w); w = maxSide; }
          else { w = Math.round((w * maxSide) / h); h = maxSide; }
        }
        const off = document.createElement('canvas');
        off.width = w; off.height = h;
        off.getContext('2d').drawImage(img, 0, 0, w, h);
        callback(off.toDataURL('image/jpeg', 0.8));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ホワイトボードUI構築
  if (typeof window.renderSelectedToolBody === 'function') {
    const origBody = window.renderSelectedToolBody;
    window.renderSelectedToolBody = function (labId, d) {
      if (d.selectedTool !== 'whiteboard') return origBody(labId, d);

      const wb = ensureWhiteboard(d);
      const curLayer = wb.layers.find(l => l.id === wb.activeLayerId) || wb.layers[0];
      const isPinned = d.pinnedTools.includes('whiteboard');

      const tools = [
        ['pen',    '✏️ ペン'],
        ['arrow',  '↗️ 矢印'],
        ['rect',   '⬜ 四角'],
        ['circle', '⭕ 丸'],
        ['line',   '📏 直線'],
        ['move',   '🖐️ 写真移動']
      ];

      return `
        <div class="card en-card en-wb-card ${wbFullscreen ? 'is-fullscreen' : ''}" style="gap:7px;padding:10px;">
          <div class="en-between">
            <div class="en-title" style="font-size:14px;">🎨 みんなホワイトボード</div>
            <div class="en-row" style="gap:5px;">
              ${!wbFullscreen ? `<button class="en-act-btn" style="padding:4px 8px;font-size:11px;" onclick="togglePinCurrent('${labId}','whiteboard')">${isPinned?'📌 固定中':'📌 固定'}</button>` : ''}
              <button class="en-pro-pill ${enAiProEnabled?'':'off'}" onclick="runAiToolAssist('${labId}','whiteboard')">✨ AI参加</button>
              <button class="en-act-btn ${wbFullscreen?'primary':''}" style="padding:4.5px 9px;font-size:11px;" id="enWbFsBtn">${wbFullscreen ? '✕ 閉じる' : '⛶ 全画面'}</button>
            </div>
          </div>

          <div class="en-wb-layers">
            ${wb.layers.map(ly => `
              <div class="en-wb-layer-pill ${wb.activeLayerId===ly.id?'active':''} ${!ly.visible?'hidden-layer':''}"
                   style="${wb.activeLayerId===ly.id ? `border-color:${ly.color};` : ''}"
                   data-wblayer="${ly.id}">
                <span class="en-wb-dot" style="background:${ly.color};"></span>
                <span>${enEsc(ly.name)}</span>
                <button type="button" class="en-wb-eye" data-wbeye="${ly.id}" title="表示/非表示">${ly.visible ? '👁️' : '🙈'}</button>
              </div>
            `).join('')}
          </div>

          <div class="en-wb-mode-strip">
            ${tools.map(([k, lb]) => `<button type="button" class="en-wb-mode-btn ${wb.tool===k?'active':''}" data-wbtool="${k}">${lb}</button>`).join('')}
          </div>

          <div class="en-wb-stage-wrap">
            <div class="en-wb-stage ${wb.tool==='move'?'mode-move':''}" id="enWbStage">
              <div class="en-wb-photos-layer" id="enWbPhotos"></div>
              <canvas id="enWbCanvas" class="en-wb-canvas" width="${WB_W}" height="${WB_H}"></canvas>
              <div class="en-wb-notes-layer" id="enWbNotes"></div>
            </div>
          </div>

          <div class="en-wb-toolbar">
            <div class="en-wb-tools-left">
              ${[[2,'細'],[4,'中'],[7,'太']].map(([sz,lb]) => `
                <button type="button" class="en-wb-btn ${wb.penSize===sz?'active':''}" data-wbsize="${sz}">${lb}</button>
              `).join('')}
              <button type="button" class="en-wb-btn" id="enWbUndoBtn">↩ 戻す</button>
              <button type="button" class="en-wb-btn" id="enWbClearLayerBtn">🧹 ${enEsc(curLayer.name)}消し</button>
            </div>
            <div class="en-wb-tools-right">
              <button type="button" class="en-wb-btn" id="enWbAddPhotoBtn">📷 写真貼る</button>
              <button type="button" class="en-wb-btn" id="enWbAddNoteBtn">📌 付箋</button>
              <button type="button" class="en-act-btn primary" style="padding:5.5px 10px;font-size:11px;" id="enWbShareBtn">📤 共有・反映</button>
            </div>
          </div>
        </div>
      `;
    };
  }

  // 📤 1タップ共有・反映シート（トーク / 巣立ちゲート / 公開ストーリー / PNG保存）
  async function openWhiteboardShareSheet(labId, wb, canvas) {
    const dataUrl = await buildWhiteboardSnapshot(wb, canvas);
    if (!dataUrl) return enToast('⚠️ 画像の生成に失敗しました');
    const d = getRoomProData(labId);

    openEnSheetHtml('📤 ホワイトボードを共有・反映', '写真＋赤入れ＋付箋を1枚にまとめて各機能へ送ります', `
      <img src="${dataUrl}" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px;border:1px solid var(--en-border);" alt="">
      <input id="enWbShareMemo" class="en-input-field" value="🎨 ホワイトボードの赤入れ案を共有しました！" placeholder="ひとことメモ...">
      <button class="en-sheet-item" id="enShareToTalk">
        <span>💬 ルームのトークに画像投稿<br><small class="en-meta">チャットに赤入れ画像がそのまま届きます</small></span><span>➔</span>
      </button>
      <button class="en-sheet-item" id="enShareToLaunch">
        <span>🎉 巣立ちゲートの完成写真にセット<br><small class="en-meta">巣立ち条件①「完成写真」へそのまま反映</small></span><span>➔</span>
      </button>
      <button class="en-sheet-item" id="enShareToStory">
        <span>📌 公開ストーリー（ボード）に画像付き記録<br><small class="en-meta">開発の歩み＆ファン公開画面にも残せます</small></span><span>➔</span>
      </button>
      <button class="en-act-btn" style="justify-content:center;" id="enShareDownload">💾 PNG画像としてPC・スマホへ保存</button>
    `);

    const getMemo = () => document.getElementById('enWbShareMemo')?.value.trim() || '🎨 ホワイトボードを共有しました！';

    document.getElementById('enShareToTalk').onclick = () => {
      enViewState.roomMessages.push({ sender: 'あなた', me: true, text: getMemo(), image: dataUrl });
      wbFullscreen = false;
      enViewState.roomTab = 'talk';
      closeEnSheet();
      renderEnRoomModal();
      const body = document.getElementById('enRoomBody');
      if (body) body.scrollTop = body.scrollHeight;
      enToast('💬 ルームのトークに赤入れ画像を投稿しました！');
    };

    document.getElementById('enShareToLaunch').onclick = () => {
      d.launch.photo = dataUrl;
      saveRoomProStore();
      wbFullscreen = false;
      enViewState.roomTab = 'detail';
      closeEnSheet();
      renderEnRoomModal();
      enToast('🎉 巣立ちゲートの完成写真にセットしました！');
    };

    document.getElementById('enShareToStory').onclick = () => {
      const memo = getMemo();
      enViewState.roomBoards[0].items.unshift(`🎨 ${memo}`);
      d.storyShots.unshift({ img: dataUrl, memo, time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) });
      saveRoomProStore();
      wbFullscreen = false;
      d.selectedTool = 'story';
      closeEnSheet();
      renderEnRoomModal();
      enToast('📌 公開ストーリーに画像付きで記録しました！');
    };

    document.getElementById('enShareDownload').onclick = () => {
      const link = document.createElement('a');
      link.download = `ENjoy_whiteboard_${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
      enToast('💾 画像を保存しました！');
    };
  }

  function renderPhotosDom(labId, d, wb) {
    const stage = document.getElementById('enWbStage');
    const wrap = document.getElementById('enWbPhotos');
    if (!stage || !wrap) return;

    const layerMap = {};
    wb.layers.forEach(l => { layerMap[l.id] = l; });

    wrap.innerHTML = wb.photos.filter(p => layerMap[p.layerId]?.visible).map(p => {
      const ly = layerMap[p.layerId];
      return `
        <div class="en-wb-photo-item" data-photoid="${p.id}" style="left:${p.x}%;top:${p.y}%;width:${p.w || 32}%;">
          <img src="${p.src}" style="border-color:${ly.color};" alt="">
          <span class="en-wb-photo-tag">📷 ${enEsc(ly.name)}</span>
          <div class="en-wb-photo-ctrl">
            <button type="button" data-phscale="${p.id}" data-delta="-7">－</button>
            <button type="button" data-phscale="${p.id}" data-delta="7">＋</button>
            <button type="button" data-phdel="${p.id}">✕</button>
          </div>
        </div>
      `;
    }).join('');

    wrap.querySelectorAll('[data-phscale]').forEach(btn => {
      btn.onpointerdown = e => e.stopPropagation();
      btn.onclick = e => {
        e.stopPropagation();
        const ph = wb.photos.find(x => x.id === btn.getAttribute('data-phscale'));
        if (ph) { ph.w = Math.max(16, Math.min(82, (ph.w || 32) + Number(btn.getAttribute('data-delta')))); saveRoomProStore(); renderPhotosDom(labId, d, wb); }
      };
    });
    wrap.querySelectorAll('[data-phdel]').forEach(btn => {
      btn.onpointerdown = e => e.stopPropagation();
      btn.onclick = e => {
        e.stopPropagation();
        wb.photos = wb.photos.filter(x => x.id !== btn.getAttribute('data-phdel'));
        saveRoomProStore(); renderPhotosDom(labId, d, wb);
      };
    });
    wrap.querySelectorAll('.en-wb-photo-item').forEach(el => {
      let dragging = false;
      const pid = el.getAttribute('data-photoid');
      el.addEventListener('pointerdown', e => {
        if (wb.tool !== 'move' || e.target.closest('.en-wb-photo-ctrl')) return;
        e.stopPropagation(); dragging = true; el.setPointerCapture(e.pointerId);
      });
      el.addEventListener('pointermove', e => {
        if (!dragging) return;
        const rect = stage.getBoundingClientRect();
        const nx = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
        const ny = Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100));
        el.style.left = nx + '%'; el.style.top = ny + '%';
        const target = wb.photos.find(x => x.id === pid);
        if (target) { target.x = Math.round(nx * 10) / 10; target.y = Math.round(ny * 10) / 10; }
      });
      el.addEventListener('pointerup', () => { if (dragging) { dragging = false; saveRoomProStore(); } });
    });
  }

  function renderNotesDom(labId, d, wb) {
    const stage = document.getElementById('enWbStage');
    const wrap = document.getElementById('enWbNotes');
    if (!stage || !wrap) return;

    const layerMap = {};
    wb.layers.forEach(l => { layerMap[l.id] = l; });

    wrap.innerHTML = wb.notes.filter(n => layerMap[n.layerId]?.visible).map(n => {
      const ly = layerMap[n.layerId];
      return `
        <div class="en-wb-note" data-noteid="${n.id}" style="left:${n.x}%;top:${n.y}%;border-top-color:${ly.color};">
          <div class="en-wb-note-head">
            <span style="color:${ly.color};">● ${enEsc(ly.name)}</span>
            <button type="button" class="en-wb-note-del" data-notedel="${n.id}">✕</button>
          </div>
          <div>${enEsc(n.text)}</div>
        </div>
      `;
    }).join('');

    wrap.querySelectorAll('[data-notedel]').forEach(btn => {
      btn.onpointerdown = e => e.stopPropagation();
      btn.onclick = e => {
        e.stopPropagation();
        wb.notes = wb.notes.filter(x => x.id !== btn.getAttribute('data-notedel'));
        saveRoomProStore(); renderNotesDom(labId, d, wb);
      };
    });
    wrap.querySelectorAll('.en-wb-note').forEach(el => {
      let dragging = false;
      const nid = el.getAttribute('data-noteid');
      el.addEventListener('pointerdown', e => {
        if (e.target.closest('.en-wb-note-del')) return;
        e.stopPropagation(); dragging = true; el.setPointerCapture(e.pointerId);
      });
      el.addEventListener('pointermove', e => {
        if (!dragging) return;
        const rect = stage.getBoundingClientRect();
        const nx = Math.max(8, Math.min(92, ((e.clientX - rect.left) / rect.width) * 100));
        const ny = Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100));
        el.style.left = nx + '%'; el.style.top = ny + '%';
        const target = wb.notes.find(x => x.id === nid);
        if (target) { target.x = Math.round(nx * 10) / 10; target.y = Math.round(ny * 10) / 10; }
      });
      el.addEventListener('pointerup', () => { if (dragging) { dragging = false; saveRoomProStore(); } });
    });
  }

  function mountWhiteboardInteractive(labId) {
    const canvas = document.getElementById('enWbCanvas');
    if (!canvas) return;
    const d = getRoomProData(labId);
    const wb = ensureWhiteboard(d);

    renderPhotosDom(labId, d, wb);
    redrawCanvas(canvas, wb);
    renderNotesDom(labId, d, wb);

    const fsBtn = document.getElementById('enWbFsBtn');
    if (fsBtn) fsBtn.onclick = () => { wbFullscreen = !wbFullscreen; renderEnRoomModal(); };

    document.querySelectorAll('[data-wblayer]').forEach(pill => {
      pill.onclick = e => {
        if (e.target.closest('[data-wbeye]')) return;
        wb.activeLayerId = pill.getAttribute('data-wblayer');
        const ly = wb.layers.find(l => l.id === wb.activeLayerId);
        if (ly && !ly.visible) ly.visible = true;
        saveRoomProStore(); renderEnRoomModal();
      };
    });
    document.querySelectorAll('[data-wbeye]').forEach(eye => {
      eye.onclick = e => {
        e.stopPropagation();
        const ly = wb.layers.find(l => l.id === eye.getAttribute('data-wbeye'));
        if (ly) ly.visible = !ly.visible;
        saveRoomProStore(); renderEnRoomModal();
      };
    });
    document.querySelectorAll('[data-wbtool]').forEach(btn => {
      btn.onclick = () => {
        wb.tool = btn.getAttribute('data-wbtool');
        saveRoomProStore(); renderEnRoomModal();
        if (wb.tool === 'move') enToast('🖐️ 写真をドラッグ移動＆－/＋でサイズ調整できます');
      };
    });
    document.querySelectorAll('[data-wbsize]').forEach(btn => {
      btn.onclick = () => { wb.penSize = Number(btn.getAttribute('data-wbsize')); saveRoomProStore(); renderEnRoomModal(); };
    });

    const undoBtn = document.getElementById('enWbUndoBtn');
    if (undoBtn) undoBtn.onclick = () => {
      for (let i = wb.strokes.length - 1; i >= 0; i--) {
        if (wb.strokes[i].layerId === wb.activeLayerId) {
          wb.strokes.splice(i, 1); saveRoomProStore(); redrawCanvas(canvas, wb); enToast('↩ 1手戻しました'); return;
        }
      }
      enToast('このレイヤーに手書き・図形がありません');
    };

    const clearBtn = document.getElementById('enWbClearLayerBtn');
    if (clearBtn) clearBtn.onclick = () => {
      const ly = wb.layers.find(l => l.id === wb.activeLayerId);
      wb.strokes = wb.strokes.filter(s => s.layerId !== wb.activeLayerId);
      saveRoomProStore(); redrawCanvas(canvas, wb); enToast(`🧹 ${ly.name}の線・図形を消去しました`);
    };

    const addPhotoBtn = document.getElementById('enWbAddPhotoBtn');
    if (addPhotoBtn) addPhotoBtn.onclick = () => {
      const ly = wb.layers.find(l => l.id === wb.activeLayerId) || wb.layers[0];
      openEnSheetHtml(`📷 ${ly.name}レイヤーに写真を貼る`, '貼った上から矢印や丸で直接赤入れできます！', `
        <label class="en-act-btn primary" style="justify-content:center;cursor:pointer;" for="enWbFileIn">📁 スマホ・PCから写真を選ぶ</label>
        <input id="enWbFileIn" type="file" accept="image/*" style="display:none;">
        <div class="en-meta" style="margin-top:4px;">テスト用サンプル写真を1タップで貼る</div>
        <div class="en-chip-row">
          <button class="en-tag-chip" data-sampph="tomato">🍅 トマト試作</button>
          <button class="en-tag-chip" data-sampph="package">📦 クラフト袋</button>
          <button class="en-tag-chip" data-sampph="drying">🏭 乾燥設備</button>
        </div>
      `);
      const placePhoto = src => {
        ly.visible = true;
        wb.photos.push({ id: 'ph-' + Date.now(), layerId: ly.id, src, x: 50, y: 45, w: 36 });
        wb.tool = 'move';
        saveRoomProStore(); closeEnSheet(); renderEnRoomModal();
        enToast('📷 写真を貼りました！位置を合わせてペン・矢印で書き込めます');
      };
      document.getElementById('enWbFileIn').onchange = e => {
        const f = e.target.files?.[0]; if (f) compressPhotoFile(f, placePhoto);
      };
      document.querySelectorAll('[data-sampph]').forEach(b => {
        b.onclick = () => placePhoto(EN_IMAGES[b.getAttribute('data-sampph')] || EN_IMAGES.tomato);
      });
    };

    const addNoteBtn = document.getElementById('enWbAddNoteBtn');
    if (addNoteBtn) addNoteBtn.onclick = () => {
      const ly = wb.layers.find(l => l.id === wb.activeLayerId) || wb.layers[0];
      openEnSheetHtml(`📌 ${ly.name}の付箋を貼る`, '貼ったあとドラッグで自由に配置できます', `
        <textarea id="enWbNoteTextIn" class="en-input-field" rows="2" placeholder="例：ここのラベル色をもっと明るく！"></textarea>
        <button class="en-act-btn primary" style="justify-content:center;" id="enWbNoteSubmit">ホワイトボードに貼る</button>
      `);
      document.getElementById('enWbNoteSubmit').onclick = () => {
        const txt = document.getElementById('enWbNoteTextIn').value.trim();
        if (!txt) return enToast('⚠️ 文字を入力してください');
        ly.visible = true;
        wb.notes.push({ id: 'n-' + Date.now(), layerId: ly.id, x: 35 + Math.round(Math.random()*30), y: 35 + Math.round(Math.random()*30), text: txt });
        saveRoomProStore(); closeEnSheet(); renderEnRoomModal();
        enToast(`📌 ${ly.name}レイヤーに付箋を貼りました！`);
      };
    };

    const shareBtn = document.getElementById('enWbShareBtn');
    if (shareBtn) shareBtn.onclick = () => openWhiteboardShareSheet(labId, wb, canvas);

    // ✏️ ドラッグ描画
    let drawing = false;
    let curStroke = null;
    const getPt = e => {
      const r = canvas.getBoundingClientRect();
      return {
        x: Math.round(((e.clientX - r.left) / r.width) * WB_W),
        y: Math.round(((e.clientY - r.top) / r.height) * WB_H)
      };
    };

    canvas.addEventListener('pointerdown', e => {
      if (wb.tool === 'move') return;
      const ly = wb.layers.find(l => l.id === wb.activeLayerId) || wb.layers[0];
      if (!ly.visible) ly.visible = true;
      drawing = true;
      canvas.setPointerCapture(e.pointerId);
      const pt = getPt(e);
      if (wb.tool === 'pen') {
        curStroke = { type: 'free', layerId: ly.id, color: ly.color, size: wb.penSize, pts: [pt, { x: pt.x + 0.5, y: pt.y + 0.5 }] };
        wb.strokes.push(curStroke);
        redrawCanvas(canvas, wb);
      } else {
        curStroke = { type: wb.tool, layerId: ly.id, color: ly.color, size: wb.penSize, x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y };
        redrawCanvas(canvas, wb, curStroke);
      }
    });
    canvas.addEventListener('pointermove', e => {
      if (!drawing || !curStroke) return;
      const pt = getPt(e);
      if (curStroke.type === 'free') { curStroke.pts.push(pt); redrawCanvas(canvas, wb); }
      else { curStroke.x2 = pt.x; curStroke.y2 = pt.y; redrawCanvas(canvas, wb, curStroke); }
    });
    const endDraw = () => {
      if (!drawing) return;
      if (curStroke && curStroke.type !== 'free') {
        if (Math.hypot(curStroke.x2 - curStroke.x1, curStroke.y2 - curStroke.y1) >= 6) wb.strokes.push(curStroke);
      }
      drawing = false; curStroke = null;
      redrawCanvas(canvas, wb);
      saveRoomProStore();
    };
    canvas.addEventListener('pointerup', endDraw);
    canvas.addEventListener('pointercancel', endDraw);
  }

  // 💬 トーク吹き出し ＆ 📌 公開ストーリーへの共有画像レンダリング注入
  function injectSharedImages(labId) {
    const d = getRoomProData(labId);

    // 1) トーク吹き出しに添付画像を描画（タップで全画面拡大）
    if (enViewState.roomTab === 'talk' && !enViewState.roomViewAsFan) {
      document.querySelectorAll('#enRoomBody .en-chat-bubble[data-msgaction]').forEach(bubble => {
        const idx = Number(bubble.getAttribute('data-msgaction'));
        const msg = enViewState.roomMessages[idx];
        if (msg && msg.image && !bubble.querySelector('.en-chat-img')) {
          const img = document.createElement('img');
          img.className = 'en-chat-img';
          img.src = msg.image;
          img.alt = '共有ホワイトボード';
          img.onclick = e => { e.stopPropagation(); if (typeof openEnLightbox === 'function') openEnLightbox(msg.image); };
          bubble.appendChild(img);
        }
      });
    }

    // 2) 公開ストーリーボード / ファン公開画面にスナップショット一覧を描画
    const showStory = (enViewState.roomTab === 'board' && d.selectedTool === 'story') || enViewState.roomViewAsFan;
    if (showStory && d.storyShots && d.storyShots.length > 0) {
      const targetCard = document.querySelector('#enRoomBody .card.en-card');
      if (targetCard && !targetCard.querySelector('.en-story-shots')) {
        const wrap = document.createElement('div');
        wrap.className = 'en-story-shots';
        wrap.innerHTML = d.storyShots.map(sh => `
          <div class="en-story-shot" data-shotzoom="${sh.img}">
            <img src="${sh.img}" alt="">
            <span>🎨 ${enEsc(sh.memo)}</span>
          </div>
        `).join('');
        wrap.querySelectorAll('[data-shotzoom]').forEach(el => {
          el.onclick = () => { if (typeof openEnLightbox === 'function') openEnLightbox(el.getAttribute('data-shotzoom')); };
        });
        targetCard.appendChild(wrap);
      }
    }
  }

  // PC用：Escキーで全画面モードを終了
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && wbFullscreen) {
      wbFullscreen = false;
      renderEnRoomModal();
    }
  });

  if (typeof window.renderEnRoomModal === 'function') {
    const origRenderModal = window.renderEnRoomModal;
    window.renderEnRoomModal = function () {
      origRenderModal();
      const modal = document.getElementById('en-room-modal');
      if (!modal || !modal.classList.contains('open')) { wbFullscreen = false; return; }
      const lab = enViewState.labs.find(l => l.id === enViewState.roomOpenId) || enViewState.labs[0];
      if (!lab) return;
      const d = getRoomProData(lab.id);
      if (enViewState.roomTab === 'board' && d.selectedTool === 'whiteboard' && !enViewState.roomViewAsFan) {
        mountWhiteboardInteractive(lab.id);
      }
      injectSharedImages(lab.id);
    };
  }
})();