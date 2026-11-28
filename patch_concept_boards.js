/* =========================================================
   EN•joy STEP C コンセプト設計3大ボードモジュール
   （patch_concept_boards.js v1）
   1) 系統図（ロジックツリー / 手段展開） + タスク/決定メモ直行
   2) ビジュアル魚の骨（リアルタイムSVGフィッシュボーン） + なぜなぜ/タスク連動
   3) ポジショニングマトリクス（ドラッグ式2軸マップ） + 市場/完成登録バトンリレー
   ・TEAM_ONLY スコープ / 全SVG UI / IME安全入力 / AI補完対応
   ========================================================= */

(function () {
  let conceptHooksInstalled = false;

  const C_SVG = {
    tree:    `<path d="M12 4v6M6 10h12M6 10v4M18 10v4M4 14h4v4H4zM16 14h4v4h-4zM10 2h4v4h-4z"/>`,
    fish:    `<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z"/><path d="M22 12l-3-3m3 3-3 3"/><circle cx="7.5" cy="11.5" r=".8" fill="currentColor"/>`,
    posmap:  `<path d="M3 12h18M12 3v18"/><circle cx="17" cy="7" r="2.2" fill="currentColor"/><circle cx="7" cy="16" r="1.8"/><circle cx="15" cy="15" r="1.8"/>`,
    target:  `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>`,
    plus:    `<path d="M12 5v14M5 12h14"/>`,
    trash:   `<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>`,
    check:   `<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8.5 12 2.5 2.5 4.5-5"/>`,
    pin:     `<path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a1 1 0 0 1 1-1V4H8v1a1 1 0 0 1 1 1z"/>`,
    help:    `<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.8.8c0 1.7-2.3 2.2-2.3 3.7"/><circle cx="12" cy="17.5" r=".6" fill="currentColor"/>`,
    star:    `<polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2" fill="currentColor"/>`,
    sparkle: `<path d="M12 3l1.8 4.8L18.5 9.5l-4.7 1.7L12 16l-1.8-4.8L5.5 9.5l4.7-1.7L12 3z"/>`,
    lock:    `<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>`,
    relay:   `<path d="M5 12h14M13 5l7 7-7 7"/>`
  };

  function cSvg(name, cls = '') {
    return `<svg class="en-c-svg ${cls}" viewBox="0 0 24 24" aria-hidden="true">${C_SVG[name] || ''}</svg>`;
  }
  function esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function cleanText(str, max = 300) {
    return window.EN_SECURITY ? window.EN_SECURITY.sanitizePlainText(str, max) : String(str ?? '').slice(0, max);
  }
  function savePro() {
    if (typeof saveRoomProStore === 'function') saveRoomProStore();
  }

  // =========================================================
  // 📚 ツールカタログ登録（スマホ2列一覧＆PCハブへ自動出現）
  // =========================================================
  function registerConceptCatalog() {
    if (typeof EN_TOOL_CATALOG === 'undefined' || !Array.isArray(EN_TOOL_CATALOG)) return;

    if (!EN_TOOL_CATALOG.some(t => t.id === 'tree')) {
      EN_TOOL_CATALOG.splice(3, 0, {
        id: 'tree',
        icon: '🌿',
        name: '系統図（手段展開）',
        cat: '企画・戦略',
        desc: '目的→大方針→具体アクションをツリーで展開しタスク直結'
      });
    }
    if (!EN_TOOL_CATALOG.some(t => t.id === 'posmap')) {
      EN_TOOL_CATALOG.splice(4, 0, {
        id: 'posmap',
        icon: '🎯',
        name: 'ポジショニング図',
        cat: '企画・戦略',
        desc: '2軸マップ上で自社商品と競合をドラッグ配置し勝ち筋を可視化'
      });
    }
    const fishDef = EN_TOOL_CATALOG.find(t => t.id === 'fish');
    if (fishDef) {
      fishDef.name = '魚の骨（特性要因図）';
      fishDef.desc = '人・設備・材料・方法の4本の大骨をリアルタイムSVG図で原因整理';
    }
  }

  // =========================================================
  // 🧱 データ初期化（既存ラボへ安全にマイグレーション）
  // =========================================================
  function ensureConceptBoards(d) {
    if (!d) return d;

    // 1) 系統図（ロジックツリー）
    if (!d.conceptTree || !Array.isArray(d.conceptTree.branches)) {
      d.conceptTree = {
        goal: '初回マルシェ50袋完売＆リピートされる無添加おやつを作る',
        branches: [
          {
            id: 'br-1',
            title: '味と安心感で「また買いたい」を作る',
            leaves: [
              { id: 'lf-1', text: '完熟トマトの甘みを活かす低温60℃乾燥で配合固定' },
              { id: 'lf-2', text: '原材料2行（トマト・塩のみ）を表面ラベルで大きく訴求' }
            ]
          },
          {
            id: 'br-2',
            title: '手土産需要に刺さる見た目と価格に整える',
            leaves: [
              { id: 'lf-3', text: '既製窓付きクラフト袋＋1色シールで包材費42円以内' },
              { id: 'lf-4', text: '単品¥480／ギフト3袋セット¥1,280の2本立て' }
            ]
          },
          {
            id: 'br-3',
            title: 'マルシェ店頭で足を止めてもらう導線',
            leaves: [
              { id: 'lf-5', text: '個包装1枚試食カップ＋農家さんの畑写真POPを設置' }
            ]
          }
        ]
      };
    }

    // 2) 魚の骨（既存 d.fish に課題ヘッドを追加）
    if (!d.fish) d.fish = { man: [], machine: [], material: [], method: [] };
    if (typeof d.fishHead !== 'string' || !d.fishHead.trim()) {
      d.fishHead = '乾燥ムラ＆小ロット原価が高止まりする';
    }

    // 3) ポジショニングマトリクス（2軸プロット）
    if (!d.posMap || !Array.isArray(d.posMap.items)) {
      d.posMap = {
        axisTop: 'ギフト・ご褒美感',
        axisBottom: '日常・手軽さ',
        axisLeft: '市販・量産系',
        axisRight: '無添加・産地特化',
        winMemo: '右上「無添加×ちょっとした手土産ギフト（¥480〜¥1,280）」の空きポジションを狙う！',
        items: [
          { id: 'pm-ours', name: '自社商品案', x: 78, y: 24, ours: true },
          { id: 'pm-c1',   name: 'スーパー野菜チップス', x: 24, y: 74, ours: false },
          { id: 'pm-c2',   name: '百貨店高級ドライフルーツ', x: 74, y: 12, ours: false },
          { id: 'pm-c3',   name: 'コンビニ無添加ナッツ', x: 46, y: 66, ours: false }
        ]
      };
    }

    // すぐ試せるように初回だけアクティブツールへ自動登録
    if (!d._stepCSeeded) {
      ['tree', 'posmap', 'fish'].forEach(id => {
        if (!d.activeTools.includes(id)) d.activeTools.push(id);
      });
      d._stepCSeeded = true;
    }

    return d;
  }

  // =========================================================
  // 1. 系統図（ロジックツリー）UI描画＆イベント
  // =========================================================
  function renderTreeBoardHtml(labId, d) {
    const tr = d.conceptTree;
    const isPinned = d.pinnedTools.includes('tree');
    const pinBtn = `<button type="button" class="en-act-btn" style="padding:4px 8px;font-size:11px;" onclick="togglePinCurrent('${labId}','tree')">${cSvg('pin','sm')} ${isPinned ? '固定中' : '固定'}</button>`;
    const aiBtn = `<button type="button" class="en-pro-pill ${enAiProEnabled ? '' : 'off'}" onclick="runAiToolAssist('${labId}','tree')">${cSvg('sparkle','sm')} AI案追加</button>`;

    return `
      <div class="card en-card" id="enTreeBoardCard">
        <div class="en-between">
          <div class="en-title">${cSvg('tree')} 系統図（目的 ➔ 手段展開）</div>
          <div class="en-row" style="gap:5px;">
            <span class="en-scope-badge team">${cSvg('lock','sm')} TEAM_ONLY</span>
            ${pinBtn}${aiBtn}
          </div>
        </div>
        <div class="en-meta">ゴールから逆算して「大方針 → 具体アクション」へ分解します。末端の具体策は1タップでやることリストへ送れます。</div>

        <div class="en-tree-goal">
          <span class="en-tree-goal-lbl">${cSvg('target','sm')} 最終目的（ゴール）</span>
          <input id="enTreeGoalIn" class="en-input-field" value="${esc(tr.goal)}" placeholder="達成したいゴールを入力...">
        </div>

        <div class="en-tree-branches">
          ${tr.branches.map((br, bi) => `
            <div class="en-tree-branch">
              <div class="en-tree-branch-head">
                <span class="en-tree-lvl-tag">方針 ${bi + 1}</span>
                <input class="en-input-field" style="flex:1;font-weight:800;" data-trbr="${bi}" value="${esc(br.title)}" placeholder="大方針を入力...">
                <button type="button" class="en-del-x" data-deltrbr="${bi}" title="方針を削除">${cSvg('trash','sm')}</button>
              </div>

              <div class="en-tree-leaves">
                ${br.leaves.map((lf, li) => `
                  <div class="en-tree-leaf">
                    <input class="en-tree-leaf-in" data-trlf="${bi}:${li}" value="${esc(lf.text)}" placeholder="具体的なアクション...">
                    <button type="button" class="en-tree-mini-btn" data-lftotask="${bi}:${li}" title="やることリストへ送る">${cSvg('check','sm')} タスク</button>
                    <button type="button" class="en-del-x" data-dellf="${bi}:${li}" title="削除">✕</button>
                  </div>
                `).join('')}

                <div class="en-row" style="gap:5px;margin-top:2px;">
                  <input class="en-input-field" style="padding:6px 9px;font-size:12px;" data-addlfin="${bi}" placeholder="具体策（2次手段）を追加...">
                  <button type="button" class="en-act-btn" style="padding:5px 9px;font-size:11px;" data-addlfbtn="${bi}">${cSvg('plus','sm')} 追加</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="en-form-box">
          <div class="en-meta" style="font-weight:800;">新しい大方針（1次手段）を追加</div>
          <div class="en-row">
            <input id="enNewTrBrIn" class="en-input-field" placeholder="例：SNSで発売前からファンを巻き込む">
            <button type="button" class="en-act-btn primary" id="enNewTrBrBtn">${cSvg('plus','sm')} 方針追加</button>
          </div>
        </div>
      </div>
    `;
  }

  function bindTreeBoardEvents(d) {
    const card = document.getElementById('enTreeBoardCard');
    if (!card || !d.conceptTree) return;
    const tr = d.conceptTree;

    card.querySelector('#enTreeGoalIn')?.addEventListener('input', e => {
      tr.goal = cleanText(e.target.value, 200);
      savePro();
    });
    card.querySelectorAll('[data-trbr]').forEach(inp => {
      inp.oninput = e => { tr.branches[Number(inp.getAttribute('data-trbr'))].title = cleanText(e.target.value, 160); savePro(); };
    });
    card.querySelectorAll('[data-trlf]').forEach(inp => {
      inp.oninput = e => {
        const [bi, li] = inp.getAttribute('data-trlf').split(':').map(Number);
        tr.branches[bi].leaves[li].text = cleanText(e.target.value, 200);
        savePro();
      };
    });
    card.querySelectorAll('[data-deltrbr]').forEach(btn => {
      btn.onclick = () => { tr.branches.splice(Number(btn.getAttribute('data-deltrbr')), 1); savePro(); window.renderEnRoomModal(); };
    });
    card.querySelectorAll('[data-dellf]').forEach(btn => {
      btn.onclick = () => {
        const [bi, li] = btn.getAttribute('data-dellf').split(':').map(Number);
        tr.branches[bi].leaves.splice(li, 1); savePro(); window.renderEnRoomModal();
      };
    });
    card.querySelectorAll('[data-addlfbtn]').forEach(btn => {
      btn.onclick = () => {
        const bi = Number(btn.getAttribute('data-addlfbtn'));
        const inp = card.querySelector(`[data-addlfin="${bi}"]`);
        const val = cleanText((inp?.value || '').trim(), 200);
        if (!val) return;
        tr.branches[bi].leaves.push({ id: 'lf-' + Date.now(), text: val });
        savePro(); window.renderEnRoomModal();
      };
    });
    card.querySelectorAll('[data-lftotask]').forEach(btn => {
      btn.onclick = () => {
        const [bi, li] = btn.getAttribute('data-lftotask').split(':').map(Number);
        const txt = tr.branches[bi]?.leaves[li]?.text?.trim();
        if (!txt) return;
        if (typeof sendMsgToTask === 'function') sendMsgToTask(`[系統図] ${txt}`);
        else {
          enViewState.roomTasks.unshift({ id: 't-' + Date.now(), text: `[系統図] ${txt}`, done: false });
          enToast('やることリストへ送りました');
        }
        window.renderEnRoomModal();
      };
    });
    card.querySelector('#enNewTrBrBtn')?.addEventListener('click', () => {
      const inp = card.querySelector('#enNewTrBrIn');
      const val = cleanText((inp?.value || '').trim(), 160);
      if (!val) return enToast('方針タイトルを入力してください');
      tr.branches.push({ id: 'br-' + Date.now(), title: val, leaves: [] });
      savePro(); window.renderEnRoomModal();
    });
  }

  // =========================================================
  // 2. ビジュアル魚の骨（SVGフィッシュボーン）UI描画＆イベント
  // =========================================================
  const BONE_DEFS = [
    { key: 'man',      label: '人（作業・体制）', color: '#2563eb', side: 'top',    xTop: 115, xJoin: 195 },
    { key: 'machine',  label: '設備・道具',       color: '#ea580c', side: 'top',    xTop: 295, xJoin: 375 },
    { key: 'material', label: '材料・包材',       color: '#16a34a', side: 'bottom', xTop: 115, xJoin: 195 },
    { key: 'method',   label: '方法・手順',       color: '#9333ea', side: 'bottom', xTop: 295, xJoin: 375 }
  ];

  function buildFishboneSvgHtml(d) {
    const f = d.fish || { man: [], machine: [], material: [], method: [] };
    const headTxt = String(d.fishHead || '解決したい課題');
    const headLines = headTxt.length > 9 ? [headTxt.slice(0, 9), headTxt.slice(9, 18) + (headTxt.length > 18 ? '…' : '')] : [headTxt];

    const bonesSvg = BONE_DEFS.map(b => {
      const items = (f[b.key] || []).slice(0, 4);
      const isTop = b.side === 'top';
      const yEnd = isTop ? 36 : 264;
      const yMid = 150;

      // 小骨（各要因）を大骨から水平に描画
      const ribs = items.map((txt, idx) => {
        const t = (idx + 1) / (items.length + 1);
        const rx = b.xTop + (b.xJoin - b.xTop) * t;
        const ry = yEnd + (yMid - yEnd) * t;
        const shortTxt = txt.length > 13 ? txt.slice(0, 12) + '…' : txt;
        return `
          <line x1="${rx - 78}" y1="${ry}" x2="${rx}" y2="${ry}" stroke="${b.color}" stroke-width="1.5" opacity="0.72"/>
          <circle cx="${rx}" cy="${ry}" r="2.6" fill="${b.color}"/>
          <text x="${rx - 82}" y="${ry + 3.5}" text-anchor="end" font-size="10.5" font-weight="700" fill="currentColor">${esc(shortTxt)}</text>
        `;
      }).join('');

      const badgeY = isTop ? 14 : 268;
      return `
        <line x1="${b.xTop}" y1="${yEnd}" x2="${b.xJoin}" y2="${yMid}" stroke="${b.color}" stroke-width="2.6" stroke-linecap="round"/>
        <rect x="${b.xTop - 52}" y="${badgeY}" width="104" height="22" rx="11" fill="${b.color}"/>
        <text x="${b.xTop}" y="${badgeY + 14.5}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#ffffff">${esc(b.label)}</text>
        ${ribs}
      `;
    }).join('');

    return `
      <svg class="en-fish-svg" viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg">
        <!-- 尾びれ -->
        <polygon points="18,120 46,150 18,180 28,150" fill="none" stroke="var(--en-muted)" stroke-width="2.2" stroke-linejoin="round"/>
        <!-- 背骨 -->
        <line x1="42" y1="150" x2="452" y2="150" stroke="var(--en-text)" stroke-width="3.2" stroke-linecap="round"/>
        <polygon points="452,143 466,150 452,157" fill="var(--en-text)"/>
        <!-- 4本の大骨＆小骨 -->
        ${bonesSvg}
        <!-- 魚頭（課題・結果ボックス） -->
        <rect x="466" y="106" width="124" height="88" rx="18" fill="var(--en-surface)" stroke="#ef4444" stroke-width="2.5"/>
        <text x="528" y="128" text-anchor="middle" font-size="9.5" font-weight="900" fill="#ef4444">結果・課題</text>
        ${headLines.map((ln, i) => `
          <text x="528" y="${150 + i * 17}" text-anchor="middle" font-size="11.5" font-weight="900" fill="currentColor">${esc(ln)}</text>
        `).join('')}
      </svg>
    `;
  }

  function renderVisualFishBoardHtml(labId, d) {
    const f = d.fish;
    const isPinned = d.pinnedTools.includes('fish');
    const pinBtn = `<button type="button" class="en-act-btn" style="padding:4px 8px;font-size:11px;" onclick="togglePinCurrent('${labId}','fish')">${cSvg('pin','sm')} ${isPinned ? '固定中' : '固定'}</button>`;
    const aiBtn = `<button type="button" class="en-pro-pill ${enAiProEnabled ? '' : 'off'}" onclick="runAiToolAssist('${labId}','fish')">${cSvg('sparkle','sm')} AI要因補完</button>`;

    return `
      <div class="card en-card" id="enFishVisualCard">
        <div class="en-between">
          <div class="en-title">${cSvg('fish')} 魚の骨（特性要因図・4M）</div>
          <div class="en-row" style="gap:5px;">
            <span class="en-scope-badge team">${cSvg('lock','sm')} TEAM_ONLY</span>
            ${pinBtn}${aiBtn}
          </div>
        </div>

        <div class="en-fish-head-row">
          <span class="en-fish-head-tag">課題（魚頭）</span>
          <input id="enFishHeadIn" class="en-input-field" style="flex:1;font-weight:800;" value="${esc(d.fishHead)}" placeholder="解決したい問題・目標を入力...">
        </div>

        <div class="en-fish-stage" id="enFishSvgStage">
          ${buildFishboneSvgHtml(d)}
        </div>

        <div class="en-fish-bone-list">
          ${BONE_DEFS.map(b => `
            <div class="en-fish-bone-box" style="--bone-col:${b.color};">
              <div class="en-fish-bone-title">
                <span>${esc(b.label)}</span>
                <span>${(f[b.key] || []).length}件</span>
              </div>
              ${(f[b.key] || []).map((txt, idx) => `
                <div class="en-fish-factor-row">
                  <span class="en-fish-factor-txt">${esc(txt)}</span>
                  <button type="button" class="en-tree-mini-btn" data-fishtowhy="${b.key}:${idx}" title="なぜなぜ分析へ送る">${cSvg('help','sm')}</button>
                  <button type="button" class="en-del-x" data-fishdel="${b.key}:${idx}" title="削除">✕</button>
                </div>
              `).join('') || '<div class="en-meta" style="font-size:11px;">まだ要因がありません</div>'}
            </div>
          `).join('')}
        </div>

        <div class="en-form-box">
          <div class="en-meta" style="font-weight:800;">新しい要因（小骨）を追加</div>
          <div class="en-row">
            <select id="enFishAddCat" class="en-input-field" style="width:115px;">
              ${BONE_DEFS.map(b => `<option value="${b.key}">${b.label.split('（')[0]}</option>`).join('')}
            </select>
            <input id="enFishAddIn" class="en-input-field" placeholder="原因・要因メモを入力...">
            <button type="button" class="en-act-btn primary" id="enFishAddBtn">${cSvg('plus','sm')} 追加</button>
          </div>
        </div>
      </div>
    `;
  }

  function bindVisualFishBoardEvents(labId, d) {
    const card = document.getElementById('enFishVisualCard');
    if (!card) return;

    card.querySelector('#enFishHeadIn')?.addEventListener('input', e => {
      d.fishHead = cleanText(e.target.value, 80);
      savePro();
      const stage = card.querySelector('#enFishSvgStage');
      if (stage) stage.innerHTML = buildFishboneSvgHtml(d);
    });

    card.querySelector('#enFishAddBtn')?.addEventListener('click', () => {
      const cat = card.querySelector('#enFishAddCat')?.value || 'man';
      const inp = card.querySelector('#enFishAddIn');
      const val = cleanText((inp?.value || '').trim(), 140);
      if (!val) return enToast('要因を入力してください');
      if (!Array.isArray(d.fish[cat])) d.fish[cat] = [];
      d.fish[cat].push(val);
      savePro();
      enToast('魚の骨へ要因を追加しました');
      window.renderEnRoomModal();
    });

    card.querySelectorAll('[data-fishdel]').forEach(btn => {
      btn.onclick = () => {
        const [k, i] = btn.getAttribute('data-fishdel').split(':');
        d.fish[k].splice(Number(i), 1);
        savePro();
        window.renderEnRoomModal();
      };
    });

    card.querySelectorAll('[data-fishtowhy]').forEach(btn => {
      btn.onclick = () => {
        const [k, i] = btn.getAttribute('data-fishtowhy').split(':');
        const txt = d.fish[k]?.[Number(i)];
        if (txt && typeof sendMsgToWhy === 'function') sendMsgToWhy(labId, txt);
      };
    });
  }

  // =========================================================
  // 3. ポジショニングマトリクス（ドラッグ式 2軸マップ）UI描画＆イベント
  // =========================================================
  function renderPosMapBoardHtml(labId, d) {
    const pm = d.posMap;
    const isPinned = d.pinnedTools.includes('posmap');
    const pinBtn = `<button type="button" class="en-act-btn" style="padding:4px 8px;font-size:11px;" onclick="togglePinCurrent('${labId}','posmap')">${cSvg('pin','sm')} ${isPinned ? '固定中' : '固定'}</button>`;
    const aiBtn = `<button type="button" class="en-pro-pill ${enAiProEnabled ? '' : 'off'}" onclick="runAiToolAssist('${labId}','posmap')">${cSvg('sparkle','sm')} AI競合配置</button>`;

    return `
      <div class="card en-card" id="enPosMapCard">
        <div class="en-between">
          <div class="en-title">${cSvg('posmap')} ポジショニングマトリクス（2軸図）</div>
          <div class="en-row" style="gap:5px;">
            <span class="en-scope-badge team">${cSvg('lock','sm')} TEAM_ONLY</span>
            ${pinBtn}${aiBtn}
          </div>
        </div>
        <div class="en-meta">自社商品（オレンジ）と競合を指・マウスで直接ドラッグ配置し、「他社がいない勝ち筋」を見つけます。</div>

        <div class="en-pos-axes-grid">
          <input class="en-input-field en-pos-axis-in" data-posaxis="axisTop"    value="${esc(pm.axisTop)}"    placeholder="上軸（例：ギフト・高価格）">
          <input class="en-input-field en-pos-axis-in" data-posaxis="axisBottom" value="${esc(pm.axisBottom)}" placeholder="下軸（例：日常・手頃）">
          <input class="en-input-field en-pos-axis-in" data-posaxis="axisLeft"   value="${esc(pm.axisLeft)}"   placeholder="左軸（例：市販・量産）">
          <input class="en-input-field en-pos-axis-in" data-posaxis="axisRight"  value="${esc(pm.axisRight)}"  placeholder="右軸（例：無添加・産地特化）">
        </div>

        <div class="en-pos-board-outer">
          <span class="en-pos-lbl top"    id="enPosLblTop">${esc(pm.axisTop)}</span>
          <span class="en-pos-lbl bottom" id="enPosLblBottom">${esc(pm.axisBottom)}</span>
          <span class="en-pos-lbl left"   id="enPosLblLeft">${esc(pm.axisLeft)}</span>
          <span class="en-pos-lbl right"  id="enPosLblRight">${esc(pm.axisRight)}</span>

          <div class="en-pos-canvas" id="enPosCanvas">
            <div class="en-pos-axis-x"></div>
            <div class="en-pos-axis-y"></div>
            ${pm.items.map(it => `
              <div class="en-pos-dot ${it.ours ? 'is-ours' : 'is-comp'}" data-posdot="${it.id}" style="left:${it.x}%;top:${it.y}%;">
                ${it.ours ? cSvg('star','sm') : ''}
                <span>${esc(it.name)}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="en-pos-item-list">
          ${pm.items.map((it, idx) => `
            <div class="en-pos-item-row">
              <span class="en-row" style="gap:6px;min-width:0;">
                <span class="en-pos-badge ${it.ours ? 'ours' : ''}">${it.ours ? '自社' : '競合'}</span>
                <strong style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(it.name)}</strong>
              </span>
              <span class="en-row" style="gap:5px;">
                <span class="en-meta" style="font-size:10px;" data-poscoord="${it.id}">X:${Math.round(it.x)} Y:${Math.round(100 - it.y)}</span>
                ${!it.ours ? `<button type="button" class="en-del-x" data-posdel="${idx}">✕</button>` : ''}
              </span>
            </div>
          `).join('')}
        </div>

        <div class="en-row">
          <input id="enPosNewNameIn" class="en-input-field" placeholder="競合・代替品を追加（例：道の駅クッキー）">
          <button type="button" class="en-act-btn primary" id="enPosNewAddBtn">${cSvg('plus','sm')} 配置</button>
        </div>

        <div>
          <div class="en-meta" style="font-weight:800;margin-bottom:3px;">導き出した勝ち筋ポジションメモ</div>
          <textarea id="enPosWinMemoIn" class="en-input-field" rows="2">${esc(pm.winMemo)}</textarea>
        </div>

        <div class="en-relay-bar">
          <div class="en-relay-txt">
            <span>${cSvg('relay','sm')} 勝ち筋を市場・完成登録へ転記</span>
            <small>「選ばれる理由」と「商品完成登録のこだわり」へワンタップ反映</small>
          </div>
          <button type="button" class="en-act-btn primary" style="font-size:11px;padding:6px 10px;" id="enPosRelayBtn">反映する</button>
        </div>
      </div>
    `;
  }

  function bindPosMapBoardEvents(d) {
    const card = document.getElementById('enPosMapCard');
    if (!card || !d.posMap) return;
    const pm = d.posMap;
    const canvas = card.querySelector('#enPosCanvas');

    const lblMap = { axisTop: '#enPosLblTop', axisBottom: '#enPosLblBottom', axisLeft: '#enPosLblLeft', axisRight: '#enPosLblRight' };
    card.querySelectorAll('[data-posaxis]').forEach(inp => {
      inp.oninput = e => {
        const k = inp.getAttribute('data-posaxis');
        pm[k] = cleanText(e.target.value, 24);
        const target = card.querySelector(lblMap[k]);
        if (target) target.textContent = pm[k];
        savePro();
      };
    });

    card.querySelector('#enPosWinMemoIn')?.addEventListener('input', e => {
      pm.winMemo = cleanText(e.target.value, 300);
      savePro();
    });

    // ドラッグ配置（モバイル指操作＆PCマウス両対応）
    if (canvas) {
      canvas.querySelectorAll('[data-posdot]').forEach(dot => {
        const pid = dot.getAttribute('data-posdot');
        let dragging = false;

        dot.addEventListener('pointerdown', e => {
          e.preventDefault();
          e.stopPropagation();
          dragging = true;
          dot.setPointerCapture(e.pointerId);
        });
        dot.addEventListener('pointermove', e => {
          if (!dragging) return;
          const rect = canvas.getBoundingClientRect();
          const nx = Math.max(8, Math.min(92, ((e.clientX - rect.left) / rect.width) * 100));
          const ny = Math.max(8, Math.min(92, ((e.clientY - rect.top) / rect.height) * 100));
          dot.style.left = nx + '%';
          dot.style.top = ny + '%';
          const item = pm.items.find(x => x.id === pid);
          if (item) {
            item.x = Math.round(nx * 10) / 10;
            item.y = Math.round(ny * 10) / 10;
            const cEl = card.querySelector(`[data-poscoord="${pid}"]`);
            if (cEl) cEl.textContent = `X:${Math.round(item.x)} Y:${Math.round(100 - item.y)}`;
          }
        });
        const finishDrag = () => {
          if (!dragging) return;
          dragging = false;
          savePro();
        };
        dot.addEventListener('pointerup', finishDrag);
        dot.addEventListener('pointercancel', finishDrag);
      });
    }

    card.querySelector('#enPosNewAddBtn')?.addEventListener('click', () => {
      const inp = card.querySelector('#enPosNewNameIn');
      const name = cleanText((inp?.value || '').trim(), 24);
      if (!name) return enToast('配置する名前を入力してください');
      pm.items.push({ id: 'pm-' + Date.now(), name, x: 42 + Math.round(Math.random() * 20), y: 42 + Math.round(Math.random() * 20), ours: false });
      savePro();
      window.renderEnRoomModal();
    });

    card.querySelectorAll('[data-posdel]').forEach(btn => {
      btn.onclick = () => {
        pm.items.splice(Number(btn.getAttribute('data-posdel')), 1);
        savePro();
        window.renderEnRoomModal();
      };
    });

    card.querySelector('#enPosRelayBtn')?.addEventListener('click', () => {
      const memo = (pm.winMemo || '').trim();
      if (!memo) return enToast('先に勝ち筋ポジションメモを入力してください');
      if (d.market) d.market.advantage = memo;
      if (d.launch) d.launch.detailPitch = memo;
      savePro();
      enToast('勝ち筋ポジションを「市場ボード」と「商品完成登録」へ反映しました');
    });
  }

  // =========================================================
  // 🔌 フック装着
  // =========================================================
  function installConceptHooksOnce() {
    if (conceptHooksInstalled) return;
    conceptHooksInstalled = true;

    registerConceptCatalog();

    if (typeof window.getRoomProData === 'function') {
      const origGet = window.getRoomProData;
      window.getRoomProData = function (labId) {
        const d = origGet.apply(this, arguments);
        return ensureConceptBoards(d);
      };
    }

    if (typeof window.getBoardItemCount === 'function') {
      const origCnt = window.getBoardItemCount;
      window.getBoardItemCount = function (d, tid) {
        ensureConceptBoards(d);
        if (tid === 'tree') return `${(d.conceptTree?.branches || []).length}方針`;
        if (tid === 'posmap') return `${(d.posMap?.items || []).length}点配置`;
        if (tid === 'fish') {
          const f = d.fish || {};
          const tot = ['man', 'machine', 'material', 'method'].reduce((s, k) => s + (f[k]?.length || 0), 0);
          return `${tot}要因`;
        }
        return origCnt.apply(this, arguments);
      };
    }

    if (typeof window.renderSelectedToolBody === 'function') {
      const origBody = window.renderSelectedToolBody;
      window.renderSelectedToolBody = function (labId, d) {
        ensureConceptBoards(d);
        if (d.selectedTool === 'tree') return renderTreeBoardHtml(labId, d);
        if (d.selectedTool === 'fish') return renderVisualFishBoardHtml(labId, d);
        if (d.selectedTool === 'posmap') return renderPosMapBoardHtml(labId, d);
        return origBody.apply(this, arguments);
      };
    }

    if (typeof window.runAiToolAssist === 'function') {
      const origAi = window.runAiToolAssist;
      window.runAiToolAssist = function (labId, toolId) {
        if (toolId === 'tree' || toolId === 'posmap') {
          if (!enAiProEnabled) return origAi.apply(this, arguments);
          const d = ensureConceptBoards(getRoomProData(labId));
          if (toolId === 'tree') {
            d.conceptTree.branches.push({
              id: 'br-ai-' + Date.now(),
              title: '[AI提案] 試食アンケートで次ロットの改善ループを回す',
              leaves: [
                { id: 'lf-ai-1', text: '裏面にQRを貼り「甘さ・食感」3秒アンケートを回収' },
                { id: 'lf-ai-2', text: '回答者へ次回マルシェ50円引きクーポンを配布' }
              ]
            });
            savePro();
            enToast('AIが系統図に新しい方針と具体アクションを追加しました');
            window.renderEnRoomModal();
            return;
          }
          if (toolId === 'posmap') {
            d.posMap.items.push({ id: 'pm-ai-' + Date.now(), name: '道の駅お土産スナック', x: 58, y: 38, ours: false });
            d.posMap.winMemo = '[AI分析] 右上の「産地ストーリー×無添加プチギフト（¥480〜¥1,280）」が最も競合が少なく高粗利を狙える勝ち筋です。';
            savePro();
            enToast('AIが競合プロットと勝ち筋メモを補完しました');
            window.renderEnRoomModal();
            return;
          }
        }
        return origAi.apply(this, arguments);
      };
    }

    if (typeof window.renderEnRoomModal === 'function') {
      const origRender = window.renderEnRoomModal;
      window.renderEnRoomModal = function () {
        const res = origRender.apply(this, arguments);
        const modal = document.getElementById('en-room-modal');
        if (!modal || !modal.classList.contains('open') || enViewState.roomViewAsFan) return res;
        const lab = enViewState.labs.find(l => l.id === enViewState.roomOpenId) || enViewState.labs[0];
        if (!lab) return res;
        const d = ensureConceptBoards(getRoomProData(lab.id));

        if (enViewState.roomTab === 'board') {
          if (d.selectedTool === 'tree') bindTreeBoardEvents(d);
          else if (d.selectedTool === 'fish') bindVisualFishBoardEvents(lab.id, d);
          else if (d.selectedTool === 'posmap') bindPosMapBoardEvents(d);
        }
        return res;
      };
    }
  }

  installConceptHooksOnce();
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(installConceptHooksOnce, 200);
  });
})();