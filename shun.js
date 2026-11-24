/* ============================================================
   EN•joy v5.2 — 旬の早見表・見分け方・AI栄養レシピ＆1週間献立 (#22・#23)
   ファイル名: shun.js
   ※ index.html の <script src="map.js"></script> の直後に読み込むだけで動作します
   ============================================================ */

(function () {
  'use strict';

  const SHUN_KEY = 'enjoy_v52_shun_recipes';

  /* ---------- 1. 旬の食材＆農家直伝「美味しい見分け方」マスタ ---------- */
  const SHUN_ITEMS = [
    {
      id: 'apple', name: 'りんご（サンふじ）', icon: '🍎', months: [10, 11, 12, 1],
      tip: 'お尻（底）まで黄色みがあり、持ったときにズッシリ重いものが蜜入りのサイン！少しの枝スレは味に影響なし。',
      saveTip: '1個ずつ新聞紙で包んでポリ袋に入れ野菜室へ。大量買いは皮ごとコンポート＆冷凍で3ヶ月OK！',
      nutrients: ['ビタミンC', '食物繊維', 'カリウム']
    },
    {
      id: 'hakusai', name: '白菜', icon: '🥬', months: [11, 12, 1, 2],
      tip: 'カット品は断面が盛り上がっていないもの、丸ごとは外葉が濃い緑で巻きがギュッと固いものが甘い！',
      saveTip: 'ざく切りにして生でそのまま冷凍袋へ。凍らせると繊維が壊れて鍋や煮物の味しみが爆速になります。',
      nutrients: ['ビタミンC', '食物繊維', '葉酸']
    },
    {
      id: 'daikon', name: '大根', icon: '🥕', months: [11, 12, 1, 2, 3],
      tip: 'ひげ根の穴が真っすぐ縦に並んでいるものがストレスなく育った証拠で甘くてみずみずしい！',
      saveTip: '上（甘み）はサラダ、真ん中は煮物、下（辛み）はおろしに。いちょう切りで冷凍すると時短おでんに最高。',
      nutrients: ['ビタミンC', '消化酵素', '食物繊維']
    },
    {
      id: 'spinach', name: 'ほうれん草', icon: '🌿', months: [11, 12, 1, 2],
      tip: '根元が濃い赤ピンク色で太く、葉が肉厚でピンとしている冬の「寒締め」は驚くほど甘い！',
      saveTip: 'さっと茹でて水気を絞り、小分けラップで冷凍。味噌汁や卵焼きに毎日ポンッと足せます。',
      nutrients: ['鉄分', 'ビタミンA', '葉酸']
    },
    {
      id: 'tomato', name: '完熟トマト', icon: '🍅', months: [5, 6, 7, 8, 9, 10, 11],
      tip: 'お尻に星型（スターマーク）の白い線がクッキリ出ているものほど糖度が高い！ヘタがピンと緑のものを。',
      saveTip: 'ヘタを取って丸ごと冷凍！水につけるだけでツルンと皮がむけて、絶品トマトソースが一瞬で作れます。',
      nutrients: ['リコピン', 'ビタミンC', 'ビタミンA']
    },
    {
      id: 'nasu', name: 'なす', icon: '🍆', months: [6, 7, 8, 9, 10],
      tip: 'ガクのトゲがチクッと痛いくらい尖っていて、皮にハリとツヤがあるものが新鮮な証拠！',
      saveTip: '乱切りして油を少し絡めて冷凍すると、変色せずそのまま麻婆なすや揚げ浸しに使えます。',
      nutrients: ['カリウム', 'ポリフェノール', '食物繊維']
    },
    {
      id: 'mikan', name: 'みかん', icon: '🍊', months: [11, 12, 1, 2],
      tip: 'ヘタの軸が細く、皮のツブツブ（油胞）がきめ細かくて平べったい形のものほど甘みが濃い！',
      saveTip: '箱買いしたらすぐ底から出し、ヘタを下にして風通しよく保存。傷みかけは丸ごと冷凍みかんに。',
      nutrients: ['ビタミンC', 'クエン酸', '食物繊維']
    }
  ];

  /* ---------- 2. 軽量AI栄養辞書（0円フロント分析用） ---------- */
  const NUTRIENT_DICT = [
    { key: 'りんご', p: 0.3, f: 0.2, c: 15, kcal: 56, vit: ['ビタミンC', '食物繊維'] },
    { key: '白菜', p: 1.0, f: 0.1, c: 3.2, kcal: 14, vit: ['ビタミンC', '食物繊維'] },
    { key: '大根', p: 0.5, f: 0.1, c: 4.1, kcal: 18, vit: ['ビタミンC', '食物繊維'] },
    { key: 'ほうれん草', p: 2.2, f: 0.4, c: 3.1, kcal: 20, vit: ['鉄分', 'ビタミンA'] },
    { key: 'トマト', p: 0.7, f: 0.1, c: 4.7, kcal: 20, vit: ['ビタミンC', 'リコピン'] },
    { key: 'なす', p: 1.1, f: 0.1, c: 5.1, kcal: 22, vit: ['カリウム', '食物繊維'] },
    { key: '豚', p: 18, f: 14, c: 0.2, kcal: 210, vit: ['ビタミンB1'] },
    { key: '鶏', p: 22, f: 4, c: 0, kcal: 130, vit: ['ビタミンB6'] },
    { key: '卵', p: 12, f: 10, c: 0.4, kcal: 145, vit: ['ビタミンD', '鉄分'] },
    { key: '豆腐', p: 7, f: 4, c: 2, kcal: 72, vit: ['カルシウム', '鉄分'] },
    { key: 'みそ', p: 2.5, f: 1.2, c: 4.5, kcal: 40, vit: ['発酵パワー'] },
    { key: 'チーズ', p: 7, f: 8, c: 0.5, kcal: 105, vit: ['カルシウム'] },
    { key: 'ごま油', p: 0, f: 12, c: 0, kcal: 110, vit: ['ビタミンE'] },
    { key: '砂糖', p: 0, f: 0, c: 15, kcal: 60, vit: [] },
    { key: '米', p: 3.8, f: 0.5, c: 55, kcal: 250, vit: [] }
  ];

  /* ---------- 3. 初期レシピ（大量消費＆農家めし） ---------- */
  function createDefaultRecipes() {
    return [
      {
        id: 'rec-1',
        title: '箱買いレスキュー！皮ごと無添加りんごのレンジコンポート',
        tag: '📦 箱買い大量消費',
        author: '信州・青木りんご園',
        ingredients: 'りんご 2個、砂糖 大さじ2、レモン汁 少々',
        steps: '①りんごを皮ごとくし切りにする ②耐熱容器に砂糖と入れて600Wで7分チン ③粗熱を取って保存瓶へ！ヨーグルトやトーストに最高。'
      },
      {
        id: 'rec-2',
        title: '白菜1/2玉ペロリ！豚バラと無添加みその重ね蒸し',
        tag: '👨‍🌾 本気の農家めし',
        author: 'たかつき太陽農園',
        ingredients: '白菜 1/2玉、豚バラ肉 150g、みそ 大さじ2、ごま油 少々',
        steps: '①白菜と豚肉を交互に重ねて鍋に詰める ②みそを溶いただし大さじ3をかけて蓋をし、中火で12分蒸すだけ！'
      },
      {
        id: 'rec-3',
        title: '規格外トマト丸ごと！10分絶品トマト卵炒め',
        tag: '🥫 規格外救済',
        author: 'マルシェ好きのミキ',
        ingredients: 'トマト 3個、卵 3個、ごま油 大さじ1、塩こしょう',
        steps: '①卵を半熟に炒めて一度取り出す ②ざく切りトマトを強火で炒め、卵を戻してさっと絡めるだけ！'
      }
    ];
  }

  let recipes = loadRecipes();
  let selectedMonth = new Date().getMonth() + 1;
  let activeShunSub = 'calendar'; // calendar | recipes | planner
  let generatedPlan = null;

  function loadRecipes() {
    try {
      const raw = localStorage.getItem(SHUN_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return createDefaultRecipes();
  }

  function saveRecipes() {
    try {
      localStorage.setItem(SHUN_KEY, JSON.stringify(recipes));
    } catch (e) {}
  }

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- AI栄養（PFC・ビタミン）分析 ＆ 旬クロス提案エンジン ---------- */
  function analyzeNutrition(ingredientsText) {
    let p = 2, f = 1, c = 6, kcal = 45;
    const vits = new Set();

    NUTRIENT_DICT.forEach(item => {
      if (ingredientsText.includes(item.key)) {
        p += item.p;
        f += item.f;
        c += item.c;
        kcal += item.kcal;
        item.vit.forEach(v => vits.add(v));
      }
    });

    const totalMacro = p + f + c || 1;
    const pPct = Math.round((p / totalMacro) * 100);
    const fPct = Math.round((f / totalMacro) * 100);
    const cPct = Math.max(0, 100 - pPct - fPct);

    // 足りない栄養を検知 → いま旬の別食材をクロスおすすめ
    let lackLabel = '';
    let crossRec = '';
    if (p < 12) {
      lackLabel = 'タンパク質（P）が控えめ';
      crossRec = '📌 プラス1品おすすめ：町工場の手作り豆腐・平飼い卵・ジビエや豆加工品';
    } else if (!vits.has('鉄分') && !vits.has('ビタミンA')) {
      lackLabel = '鉄分・緑黄色ビタミンを足すと完璧！';
      crossRec = '📌 いま旬のプラス1品：寒締めほうれん草（おひたし・味噌汁にポン！）';
    } else if (!vits.has('ビタミンC')) {
      lackLabel = 'ビタミンCを足すとさらに◎';
      crossRec = '📌 いま旬のプラス1品：信州のサンふじりんご・箱買いみかん';
    } else {
      lackLabel = 'バランス優秀！';
      crossRec = '📌 さらに楽しむなら：EN•dress クラフト棚の無添加スパイスや発酵みそ';
    }

    return {
      p: p.toFixed(1), f: f.toFixed(1), c: c.toFixed(1),
      kcal: Math.round(kcal),
      pPct, fPct, cPct,
      vits: Array.from(vits),
      lackLabel, crossRec
    };
  }

  /* ---------- 専用CSS注入 ---------- */
  function injectStyles() {
    if (document.getElementById('enjoy-shun-style')) return;
    const style = document.createElement('style');
    style.id = 'enjoy-shun-style';
    style.textContent = `
      .month-scroll { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 10px; }
      .month-pill {
        padding: 6px 12px; border-radius: 999px; border: 1px solid var(--border);
        background: var(--bg-paper); color: var(--ink-sub); font-size: 0.8rem; font-weight: 700;
        white-space: nowrap; cursor: pointer;
      }
      .month-pill.active { background: var(--accent); color: #fff; border-color: var(--accent); }
      .shun-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .shun-card {
        background: var(--bg); border: 1px solid var(--border); border-radius: 14px;
        padding: 14px; display: flex; flex-direction: column; gap: 8px;
      }
      .shun-tip-box {
        background: #FDFBF7; border-left: 3px solid var(--olive);
        padding: 8px 10px; border-radius: 6px; font-size: 0.83rem;
      }
      .pfc-bar {
        display: flex; height: 12px; border-radius: 999px; overflow: hidden; margin: 6px 0;
        background: var(--bg-soft);
      }
      .pfc-p { background: #C65D3B; }
      .pfc-f { background: #C4933F; }
      .pfc-c { background: #687B50; }
      .cross-rec-box {
        background: var(--gold-soft); border: 1px solid #E8D5A8; color: #5C4618;
        border-radius: 10px; padding: 8px 10px; font-size: 0.82rem; margin-top: 6px;
      }
      .plan-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; margin-top: 10px; }
      .plan-table th, .plan-table td {
        border: 1px solid var(--border); padding: 8px; text-align: left; background: var(--bg-paper);
      }
      .plan-table th { background: var(--bg-soft); font-weight: 800; width: 64px; }
      @media (max-width: 860px) { .shun-grid { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
  }

  /* ---------- メイン描画 ---------- */
  function renderShun() {
    const container = document.getElementById('marche-shun');
    if (!container) return;

    container.innerHTML = `
      <div class="filter-bar">
        <button type="button" class="chip-filter ${activeShunSub === 'calendar' ? 'active' : ''}" data-shun-sub="calendar">📅 旬の早見表＆見分け方</button>
        <button type="button" class="chip-filter ${activeShunSub === 'recipes' ? 'active' : ''}" data-shun-sub="recipes">🍳 大量消費レシピ＆AI栄養</button>
        <button type="button" class="chip-filter ${activeShunSub === 'planner' ? 'active' : ''}" data-shun-sub="planner">✨ 1週間献立コンシェルジュ</button>
      </div>
      <div id="shun-body"></div>
    `;

    container.querySelectorAll('[data-shun-sub]').forEach(btn => {
      btn.onclick = () => {
        activeShunSub = btn.dataset.shunSub;
        renderShun();
      };
    });

    if (activeShunSub === 'calendar') renderCalendarView();
    else if (activeShunSub === 'recipes') renderRecipesView();
    else renderPlannerView();
  }

  /* ---------- VIEW 1: 旬のもの早見表＆見分け方 ---------- */
  function renderCalendarView() {
    const body = document.getElementById('shun-body');
    const inSeason = SHUN_ITEMS.filter(item => item.months.includes(selectedMonth));

    body.innerHTML = `
      <div class="card">
        <div class="card-head">
          <div>
            <span class="eyebrow">廃棄レスキュー＆箱買い応援 (#22)</span>
            <h2>🥬 ${selectedMonth}月の「旬のもの早見表」＆ 農家直伝の見分け方</h2>
          </div>
          <span class="mini-pill">🔥 ${inSeason.length}品目が旬</span>
        </div>

        <div class="month-scroll">
          ${Array.from({ length: 12 }, (_, i) => i + 1).map(m => `
            <button type="button" class="month-pill ${m === selectedMonth ? 'active' : ''}" data-pick-month="${m}">
              ${m}月
            </button>
          `).join('')}
        </div>

        <div class="shun-grid">
          ${inSeason.length ? inSeason.map(item => `
            <article class="shun-card">
              <div class="badge-row">
                <span class="phase-badge">🔥 ${selectedMonth}月の旬</span>
                ${item.nutrients.map(n => `<span class="vis-badge">${esc(n)}</span>`).join('')}
              </div>
              <h3>${item.icon} ${esc(item.name)}</h3>
              <div class="shun-tip-box">
                <strong>👀 農家直伝・美味しい見分け方：</strong><br>${esc(item.tip)}
              </div>
              <div class="hint-text" style="margin:0;">
                <strong>📦 大量消費・保存ワザ：</strong>${esc(item.saveTip)}
              </div>
            </article>
          `).join('') : '<p class="hint-text">この月の登録食材はまだありません。順次追加予定です！</p>'}
        </div>
      </div>
    `;

    body.querySelectorAll('[data-pick-month]').forEach(btn => {
      btn.onclick = () => {
        selectedMonth = Number(btn.dataset.pickMonth);
        renderCalendarView();
      };
    });
  }

  /* ---------- VIEW 2: 大量消費レシピ＆AI栄養(PFC)分析 ---------- */
  function renderRecipesView() {
    const body = document.getElementById('shun-body');

    body.innerHTML = `
      <div class="card">
        <h3 class="card-title-sm">✍️ レシピを投稿する（AIがPFC＆旬のプラス1品を自動分析！）</h3>
        <form id="form-add-recipe" class="stack-form">
          <div class="form-row-2">
            <input type="text" id="rec-title" class="input" placeholder="レシピ名（例：大根1本消費！鶏みそ煮）" required />
            <select id="rec-tag" class="input">
              <option value="📦 箱買い大量消費">📦 箱買い大量消費</option>
              <option value="👨‍🌾 本気の農家めし">👨‍🌾 本気の農家めし</option>
              <option value="🥫 規格外救済">🥫 規格外救済</option>
            </select>
          </div>
          <input type="text" id="rec-ing" class="input" placeholder="材料（例：大根 1/2本、鶏もも肉 200g、みそ 大さじ2）" required />
          <textarea id="rec-steps" class="input textarea" rows="2" placeholder="作り方をカンタンに"></textarea>
          <div class="form-actions-right">
            <button type="submit" class="btn btn-primary btn-sm">レシピを投稿してAI分析</button>
          </div>
        </form>
      </div>

      <div class="card-stack">
        ${recipes.map(r => {
          const nu = analyzeNutrition(r.ingredients);
          return `
            <article class="card">
              <div class="feed-meta">
                <span class="tag-pill">${esc(r.tag)}</span>
                <strong>${esc(r.author)}</strong>
              </div>
              <h3 style="margin-bottom:6px;">🍳 ${esc(r.title)}</h3>
              <p class="hint-text" style="margin:0 0 6px;"><strong>材料：</strong>${esc(r.ingredients)}</p>
              <p style="font-size:0.86rem; margin-bottom:10px;">${esc(r.steps)}</p>

              <!-- AI栄養分析パネル -->
              <div class="sub-box">
                <div class="sub-box-head">
                  <strong>🤖 AI栄養バランス分析（目安：約${nu.kcal} kcal）</strong>
                  <span class="mini-pill">P:${nu.p}g / F:${nu.f}g / C:${nu.c}g</span>
                </div>
                <div class="pfc-bar" title="赤:P タンパク質 / 黄:F 脂質 / 緑:C 炭水化物">
                  <div class="pfc-p" style="width:${nu.pPct}%;"></div>
                  <div class="pfc-f" style="width:${nu.fPct}%;"></div>
                  <div class="pfc-c" style="width:${nu.cPct}%;"></div>
                </div>
                <div class="badge-row" style="margin-top:6px;">
                  ${nu.vits.length ? nu.vits.map(v => `<span class="vis-badge">✨ ${esc(v)}</span>`).join('') : '<span class="vis-badge">シンプル構成</span>'}
                </div>
                <div class="cross-rec-box">
                  <strong>💡 分析メモ：${esc(nu.lackLabel)}</strong><br>
                  ${esc(nu.crossRec)}
                </div>
                <p class="hint-text" style="font-size:0.74rem;">※栄養価は食材データからのAI推定目安です。</p>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;

    document.getElementById('form-add-recipe').onsubmit = e => {
      e.preventDefault();
      const title = document.getElementById('rec-title').value.trim();
      const ing = document.getElementById('rec-ing').value.trim();
      if (!title || !ing) return;
      recipes.unshift({
        id: 'rec-' + Date.now(),
        title,
        tag: document.getElementById('rec-tag').value,
        author: 'あなた',
        ingredients: ing,
        steps: document.getElementById('rec-steps').value.trim() || '材料を合わせて美味しく調理します！'
      });
      saveRecipes();
      renderRecipesView();
    };
  }

  /* ---------- VIEW 3: 1週間献立コンシェルジュ（有料オプション体験）(#23) ---------- */
  function renderPlannerView() {
    const body = document.getElementById('shun-body');

    body.innerHTML = `
      <div class="card">
        <div class="card-head">
          <div>
            <span class="eyebrow">有料ライトプラン体験プレビュー (#23)</span>
            <h2>✨ EN•joy 旬めし1週間献立コンシェルジュ</h2>
          </div>
          <span class="phase-badge">月額¥300〜500想定</span>
        </div>
        <p class="hint-text" style="margin-bottom:12px;">
          箱買いした旬の野菜を飽きずに1週間で使い切る献立と、足りない栄養を補う買い物リストをAIが自動作成します。
        </p>

        <form id="form-gen-plan" class="stack-form">
          <div class="form-row-2">
            <label class="field-box">
              <span>箱買い・使い切りたい旬の食材</span>
              <select id="plan-main-item" class="input">
                <option value="白菜＆大根">🥬 白菜＆大根（冬野菜セット）</option>
                <option value="りんご＆みかん">🍎 りんご＆みかん（果物箱買い）</option>
                <option value="トマト＆なす">🍅 トマト＆なす（夏秋レスキュー）</option>
              </select>
            </label>
            <label class="field-box">
              <span>献立のテーマ</span>
              <select id="plan-goal" class="input">
                <option value="時短＆節約">⚡ 平日15分・時短＆節約</option>
                <option value="高タンパク">💪 高タンパク・元気ごはん</option>
                <option value="子ども向け">😊 子どもが喜ぶやさしい味</option>
              </select>
            </label>
          </div>
          <div class="form-actions-right">
            <button type="submit" class="btn btn-primary">📅 1週間の献立＆買い物リストを自動生成</button>
          </div>
        </form>

        ${generatedPlan ? `
          <div class="divider"></div>
          <h3>📋 あなたの1週間「${esc(generatedPlan.item)}」使い切り献立（${esc(generatedPlan.goal)}）</h3>
          <table class="plan-table">
            <tbody>
              ${generatedPlan.days.map(d => `
                <tr><th>${d.day}</th><td><strong>${esc(d.menu)}</strong><br><span class="hint-text">${esc(d.point)}</span></td></tr>
              `).join('')}
            </tbody>
          </table>
          <div class="cross-rec-box" style="margin-top:12px;">
            <strong>🛒 足りない栄養を補う1週間ぶんの買い物リスト：</strong><br>
            ${generatedPlan.shopping.map(s => `☑ ${esc(s)}`).join(' ')}
          </div>
        ` : ''}
      </div>
    `;

    document.getElementById('form-gen-plan').onsubmit = e => {
      e.preventDefault();
      const item = document.getElementById('plan-main-item').value;
      const goal = document.getElementById('plan-goal').value;

      const presets = {
        '白菜＆大根': [
          { day: '月曜', menu: '白菜と豚バラの無添加みそ重ね蒸し', point: 'ビタミンC＋B1で週明けの疲労回復' },
          { day: '火曜', menu: '冷凍大根と鶏むねの時短しみしみ煮', point: '冷凍大根で煮込み時間半分！高タンパク' },
          { day: '水曜', menu: '白菜と豆腐のとろみ中華あんかけ', point: '胃にやさしい＆カルシウム補給' },
          { day: '木曜', menu: '大根ステーキ（和風スパイスソースがけ）', point: 'EN•dressソースで味変！' },
          { day: '金曜', menu: '白菜とツナの無限コールスロー＆卵スープ', point: '金曜は火を使わず5分で完成' },
          { day: '土曜', menu: '残り野菜ぜんぶ入れ！農家風けんちん汁', point: '端材まで丸ごと使い切り' },
          { day: '日曜', menu: 'ほうれん草と大根おろしのさっぱりみぞれ鍋', point: '鉄分プラスで1週間の栄養バランス完了！' }
        ],
        'りんご＆みかん': [
          { day: '月曜', menu: '皮ごとレンジりんごコンポート＆ヨーグルト', point: '朝の腸活＆カルシウム補給' },
          { day: '火曜', menu: '豚ロースのすりおろしりんご生姜焼き', point: 'りんごの酵素でお肉が驚くほど柔らかく！' },
          { day: '水曜', menu: 'みかんとほうれん草の爽やかチキンサラダ', point: 'ビタミンCが鉄分の吸収をアップ' },
          { day: '木曜', menu: 'すりおろしりんご入り・コク旨カレー', point: '子どもも大喜びの自然な甘み' },
          { day: '金曜', menu: '低温乾燥りんごチップス＆チーズのおつまみ', point: '週末のご褒美プレート' },
          { day: '土曜', menu: '丸ごと冷凍みかんのシャーベット＆豆腐パンケーキ', point: 'おやつも廃棄ゼロでヘルシーに' },
          { day: '日曜', menu: '焼きりんごとシナモンのホットスイーツ', point: '日曜の午後にほっと一息' }
        ],
        'トマト＆なす': [
          { day: '月曜', menu: '規格外トマトとふわふわ卵の10分炒め', point: 'リコピンは油と一緒で吸収率アップ' },
          { day: '火曜', menu: '冷凍なすのコク旨みそ麻婆', point: '油少なめでもトロッと仕上がる！' },
          { day: '水曜', menu: '丸ごと冷凍トマトの無水チキンカレー', point: '水なしで作る濃厚な旨み' },
          { day: '木曜', menu: 'なすと豚しゃぶのさっぱり香味だれ', point: '夏バテ知らずの黄金コンビ' },
          { day: '金曜', menu: 'トマトと豆腐のカプレーゼ風・和風だしジュレ', point: '火を使わない5分メニュー' },
          { day: '土曜', menu: 'なすとトマトの重ね焼きグラタン（チーズたっぷり）', point: 'カルシウム＆タンパク質を補強' },
          { day: '日曜', menu: '余ったトマトで作り置きスパイスソース＆パスタ', point: '翌週の平日の自分を助ける仕込み！' }
        ]
      };

      generatedPlan = {
        item,
        goal,
        days: presets[item] || presets['白菜＆大根'],
        shopping: ['豚バラ肉 300g', '鶏むね肉 1枚', '平飼い卵 1パック', '手作り豆腐 2丁', '無添加みそ', '寒締めほうれん草 1束']
      };
      renderPlannerView();
    };
  }

  /* ---------- 起動 ---------- */
  function init() {
    injectStyles();
    renderShun();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();