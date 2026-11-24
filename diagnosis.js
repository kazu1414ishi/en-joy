/* ============================================================
   EN•joy — 30秒ご縁タイプ（性格・相性）診断モジュール (diagnosis.js)
   ※ index.html の <script src="shun.js"></script> の直後に読み込むだけで動作します
   ============================================================ */

(function () {
  'use strict';

  const DIAG_KEY = 'enjoy_v5_diagnosis';

  const QUESTIONS = [
    {
      q: 'Q1. 規格外の野菜や端材を見つけたとき、まず浮かぶのは？',
      options: [
        { label: '💡 「これ加工したら面白い新商品になるんじゃ？」', type: 'spark' },
        { label: '🛠️ 「どう調理・加工すれば一番美味しく仕上がるかな」', type: 'craft' },
        { label: '🤝 「あの人とあの人を繋いだら解決できそう！」', type: 'bridge' },
        { label: '🧡 「SNSや口コミでみんなに広めて応援したい！」', type: 'cheer' }
      ]
    },
    {
      q: 'Q2. マルシェやイベントで一番ワクワクする瞬間は？',
      options: [
        { label: '🚀 自分の企画やアイデアが形になって並んだとき', type: 'spark' },
        { label: '✨ お客さんが「美味しい！丁寧！」と喜んでくれたとき', type: 'craft' },
        { label: '🎉 出店者同士が仲良くなって次のコラボが決まったとき', type: 'bridge' },
        { label: '📸 素敵な作り手を見つけてファンになったとき', type: 'cheer' }
      ]
    },
    {
      q: 'Q3. チームで動くとき、自然と引き受けがちな役割は？',
      options: [
        { label: '🚩 最初の「これやろう！」と旗を振る役', type: 'spark' },
        { label: '⚙️ 試作・品質・細部のクオリティを詰める役', type: 'craft' },
        { label: '📅 段取り・連絡調整・みんなのペースを守る役', type: 'bridge' },
        { label: '📣 盛り上げ役・試食レビュー・お客さん目線の意見出し', type: 'cheer' }
      ]
    }
  ];

  const RESULTS = {
    spark: {
      icon: '🔥',
      title: '熱血アイデア発起人タイプ',
      desc: '0から1を生み出す突破力の持ち主！現場の「もったいない」をワクワクする企画に変える天才です。',
      bestMatch: '🛠️ 職人・仕立ての達人タイプ ／ 🤝 ご縁つなぎの番頭タイプ',
      tip: 'まずは広場の「現場つぶやき」でアイデアの種を投げてみると、形にしてくれる仲間が集まります！'
    },
    craft: {
      icon: '🛠️',
      title: '職人・仕立ての達人タイプ',
      desc: 'こだわりと技術で「本物」を仕上げる頼れるプロ気質。あなたの丁寧な仕事がファンを惹きつけます。',
      bestMatch: '🔥 熱血アイデア発起人タイプ ／ 🧡 現場の応援団長タイプ',
      tip: '開発室の「試作ログ」や「写真ギャラリー」にこだわりを残すと、応援の声が一気に集まります！'
    },
    bridge: {
      icon: '🤝',
      title: 'ご縁つなぎの番頭タイプ',
      desc: '人と人、産業と産業の相性を見抜く名プロデューサー。あなたが間に入るだけでプロジェクトが前に進みます。',
      bestMatch: '🔥 熱血アイデア発起人タイプ ／ 🛠️ 職人・仕立ての達人タイプ',
      tip: '仲間図鑑で熱量の高い人を見つけて、どんどん「ご縁ルーム」を立ち上げてみてください！'
    },
    cheer: {
      icon: '🧡',
      title: '現場の応援団長タイプ',
      desc: '作り手の魅力を誰よりも早く見つける目利き＆発信者。あなたの「食べてみたい！」が商品を育てます。',
      bestMatch: '🛠️ 職人・仕立ての達人タイプ ／ 🔥 熱血アイデア発起人タイプ',
      tip: '進行中プロジェクトへのリアクションや、旬レシピの投稿で「応援・目利きLv」が爆伸びします！'
    }
  };

  let savedResult = loadResult();
  let step = 0;
  let scores = { spark: 0, craft: 0, bridge: 0, cheer: 0 };
  let isDiagnosing = false;

  function loadResult() {
    try {
      const raw = localStorage.getItem(DIAG_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function saveResult(typeKey) {
    savedResult = { type: typeKey, date: new Date().toLocaleDateString('ja-JP') };
    try {
      localStorage.setItem(DIAG_KEY, JSON.stringify(savedResult));
    } catch (e) {}
  }

  function injectStyles() {
    if (document.getElementById('enjoy-diag-style')) return;
    const style = document.createElement('style');
    style.id = 'enjoy-diag-style';
    style.textContent = `
      .diag-card { border-top: 4px solid var(--gold); }
      .diag-opt-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
      .diag-opt-btn {
        text-align: left; padding: 11px 14px; border-radius: 12px;
        border: 1px solid var(--border); background: var(--bg);
        color: var(--ink); font-size: 0.88rem; font-weight: 700; cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
      }
      .diag-opt-btn:hover { border-color: var(--accent); background: var(--accent-soft); }
      .diag-result-box {
        background: var(--gold-soft); border: 1px solid #E8D5A8;
        border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 8px;
      }
      .diag-result-title { font-size: 1.15rem; font-weight: 900; color: var(--ink); }
    `;
    document.head.appendChild(style);
  }

  function renderDiagnosisCard() {
    const container = document.getElementById('my-profile');
    if (!container) return;

    let card = document.getElementById('diag-profile-card');
    if (!card) {
      card = document.createElement('article');
      card.id = 'diag-profile-card';
      card.className = 'card diag-card';
      container.insertBefore(card, container.firstChild);
    }

    if (isDiagnosing) {
      const qObj = QUESTIONS[step];
      card.innerHTML = `
        <div class="card-head">
          <div>
            <span class="eyebrow">30秒ご縁タイプ診断（全${QUESTIONS.length}問）</span>
            <h2>✨ ${qObj.q}</h2>
          </div>
          <span class="mini-pill">${step + 1} / ${QUESTIONS.length}</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${Math.round(((step + 1) / QUESTIONS.length) * 100)}%;"></div></div>
        <div class="diag-opt-list">
          ${qObj.options.map((opt, idx) => `
            <button type="button" class="diag-opt-btn" data-diag-pick="${opt.type}" data-idx="${idx}">
              ${opt.label}
            </button>
          `).join('')}
        </div>
      `;

      card.querySelectorAll('[data-diag-pick]').forEach(btn => {
        btn.onclick = () => {
          scores[btn.dataset.diagPick] += 1;
          step += 1;
          if (step >= QUESTIONS.length) {
            const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
            saveResult(best);
            isDiagnosing = false;
          }
          renderDiagnosisCard();
        };
      });
      return;
    }

    if (savedResult && RESULTS[savedResult.type]) {
      const res = RESULTS[savedResult.type];
      card.innerHTML = `
        <div class="card-head">
          <div>
            <span class="eyebrow">30秒ご縁タイプ診断 結果</span>
            <h2>🔮 あなたのご縁スタイル</h2>
          </div>
          <button type="button" id="btn-diag-retry" class="btn btn-outline btn-sm">🔄 もう一度診断</button>
        </div>
        <div class="diag-result-box">
          <div class="diag-result-title">${res.icon} ${res.title}</div>
          <p style="font-size:0.88rem;">${res.desc}</p>
          <div class="hint-text" style="margin:0; color:#5C4618;">
            <strong>🤝 相性抜群のパートナー：</strong>${res.bestMatch}
          </div>
          <div class="hint-text" style="margin:0; color:#5C4618;">
            <strong>💡 おすすめの楽しみ方：</strong>${res.tip}
          </div>
        </div>
      `;
      document.getElementById('btn-diag-retry').onclick = startDiagnosis;
    } else {
      card.innerHTML = `
        <div class="card-head">
          <div>
            <span class="eyebrow">30秒でわかる！あなたの強みと相性</span>
            <h2>🔮 EN•joy 性格・ご縁タイプ診断</h2>
          </div>
          <button type="button" id="btn-diag-start" class="btn btn-primary btn-sm">30秒診断をはじめる</button>
        </div>
        <p class="hint-text" style="margin:0;">3つの質問に答えるだけで、ものづくり・ご縁づくりでのあなたのタイプと相性の良い仲間が分かります。</p>
      `;
      document.getElementById('btn-diag-start').onclick = startDiagnosis;
    }
  }

  function startDiagnosis() {
    isDiagnosing = true;
    step = 0;
    scores = { spark: 0, craft: 0, bridge: 0, cheer: 0 };
    renderDiagnosisCard();
  }

  function init() {
    injectStyles();
    renderDiagnosisCard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();