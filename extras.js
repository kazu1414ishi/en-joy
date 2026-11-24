/* ============================================================
   EN•joy v5.2 Complete — 残り全柱コンプリートモジュール (extras.js)
   搭載機能：
   - #12 🎬 15秒ショート動画劇場（縦スワイプ風＋開発室URL登録）
   - #14 🎟️ 事前応援チケット（早割・まとめ買い）＆ ご縁株主優待
   - #16 🏢 協賛企業枠（テストキッチン・試供品枠の申請＆紐づけ）
   - #17 ☕ 開発応援チップ（EN•joy開発サポーター枠）
   - #15 🎓 努力型称号連動「認定コンサル案内」
   ============================================================ */

(function () {
  'use strict';

  const EXTRAS_KEY = 'enjoy_v52_extras';

  function createDefaultExtras() {
    return {
      /* #12 ショート動画リスト（URL埋め込み式・容量0対策） */
      videos: [
        {
          id: 'vid-1',
          title: '【15秒】枝スレりんごを皮ごとジャムにする瞬間！',
          author: '信州・青木りんご園',
          tag: '🍎 規格外レスキュー',
          url: 'https://www.youtube.com/shorts/',
          likes: 34,
          linkedProduct: '蜜たっぷり規格外りんごの無添加ジャム'
        },
        {
          id: 'vid-2',
          title: '【15秒】低温ドライ機からパリッと焼き上がる音',
          author: 'なにわ乾燥・瓶詰め工房',
          tag: '⚙️ 町工場の現場',
          url: 'https://www.youtube.com/shorts/',
          likes: 28,
          linkedProduct: '第2弾：パリッと低温乾燥りんごチップス'
        },
        {
          id: 'vid-3',
          title: '【15秒】白菜1/2玉を5分で冷凍ストックする裏ワザ',
          author: 'たかつき太陽農園',
          tag: '🥬 旬の保存ワザ',
          url: 'https://www.youtube.com/shorts/',
          likes: 41,
          linkedProduct: '完熟トマトの食べる和風スパイスソース'
        }
      ],

      /* #14 事前応援チケット ＆ ご縁株主優待 */
      tickets: [
        {
          id: 'tkt-1',
          title: '【早割15%OFF】無添加りんごジャム3本セット事前予約券',
          maker: '青木りんご園 × なにわ工房',
          price: 1650,
          normalPrice: 1950,
          shares: 3,
          bought: 12,
          limit: 30
        },
        {
          id: 'tkt-2',
          title: '【箱買いレスキュー】信州サンふじ5kg＋レシピ帳付き応援券',
          maker: '信州・青木りんご園',
          price: 2980,
          normalPrice: 3600,
          shares: 5,
          bought: 19,
          limit: 40
        }
      ],
      myShares: 5, // 現在の保有「ご縁株」数

      /* #16 協賛企業（テストキッチン・試供品枠） */
      sponsors: [
        {
          id: 'sp-1',
          name: '京都・烏丸シェアテストキッチン',
          offer: '毎月2枠まで「試作利用料 無料」＋食品衛生アドバイザー同席',
          area: '京都府京都市',
          appliedProducts: ['蜜たっぷり規格外りんごの無添加ジャム']
        },
        {
          id: 'sp-2',
          name: '関西クラフト瓶・資材パートナーズ',
          offer: '初回試作用の耐熱ジャム瓶 30本を無償サンプル提供',
          area: '大阪府東大阪市',
          appliedProducts: []
        },
        {
          id: 'sp-3',
          name: '和紙ラベル印刷ラボ（協賛）',
          offer: 'EN•dressマルシェ出店者限定：耐水和紙ラベル50枚お試し無料',
          area: '京都府宇治市',
          appliedProducts: []
        }
      ],

      /* #17 開発応援チップ */
      tipsTotal: 6300,
      tipsCount: 9,
      tipLogs: [
        { name: 'マルシェ好きのミキ', amount: 500, msg: '円形年輪ボード最高！応援してます！', date: '11/24' }
      ]
    };
  }

  let ex = loadExtras();
  let currentVideoIdx = 0;

  function loadExtras() {
    try {
      const raw = localStorage.getItem(EXTRAS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return createDefaultExtras();
  }

  function saveExtras() {
    try {
      localStorage.setItem(EXTRAS_KEY, JSON.stringify(ex));
    } catch (e) {}
  }

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getActiveProductTitle() {
    try {
      const raw = localStorage.getItem(window.ENJOY_STORAGE_KEY);
      if (!raw) return '選択中の開発商品';
      const st = JSON.parse(raw);
      const room = (st.rooms || []).find(r => r.id === st.activeRoomId) || st.rooms[0];
      const prod = room && ((room.products || []).find(p => p.id === st.activeProductId) || room.products[0]);
      return prod ? prod.title : '選択中の開発商品';
    } catch (e) {
      return '選択中の開発商品';
    }
  }

  /* ---------- 専用CSS注入 ---------- */
  function injectStyles() {
    if (document.getElementById('enjoy-extras-style')) return;
    const style = document.createElement('style');
    style.id = 'enjoy-extras-style';
    style.textContent = `
      .shorts-stage {
        background: linear-gradient(160deg, #2D241F, #4A382E);
        color: #FDFBF7;
        border-radius: 18px;
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        border: 2px solid var(--gold);
      }
      .shorts-screen {
        background: rgba(255,255,255,0.08);
        border: 1px dashed rgba(255,255,255,0.28);
        border-radius: 14px;
        padding: 22px 16px;
        text-align: center;
      }
      .shorts-nav { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
      .ticket-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 10px; }
      .ticket-card {
        background: var(--bg); border: 1.5px dashed var(--accent); border-radius: 14px;
        padding: 14px; display: flex; flex-direction: column; gap: 8px;
      }
      .shareholder-bar {
        background: var(--gold-soft); border: 1px solid var(--gold);
        border-radius: 12px; padding: 10px 14px; font-size: 0.85rem; color: #5C4618;
      }
      .tip-btn-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 10px 0; }
      @media (max-width: 860px) {
        .ticket-grid, .tip-btn-row { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ============================================================
     1. #12 🎬 15秒ショート動画劇場（マルシェ・旬タブ上部に配置）
     ============================================================ */
  function renderShortsTheater() {
    const container = document.getElementById('marche-shun');
    if (!container) return;

    let card = document.getElementById('extras-shorts-card');
    if (!card) {
      card = document.createElement('article');
      card.id = 'extras-shorts-card';
      card.className = 'card';
      container.insertBefore(card, container.firstChild);
    }

    const v = ex.videos[currentVideoIdx % ex.videos.length];
    card.innerHTML = `
      <div class="card-head">
        <div>
          <span class="eyebrow">EN•joy #12 — URL埋め込み式（容量0パンク防止）</span>
          <h2>🎬 15秒ショート動画劇場（${currentVideoIdx + 1} / ${ex.videos.length}）</h2>
        </div>
        <button type="button" id="btn-toggle-add-vid" class="btn btn-outline btn-sm">＋ 動画URLを登録</button>
      </div>

      <div class="shorts-stage">
        <div class="shorts-screen">
          <span class="phase-badge">${esc(v.tag)}</span>
          <h3 style="margin:10px 0 6px; font-size:1.1rem;">▶️ ${esc(v.title)}</h3>
          <p style="font-size:0.84rem; color:#E8DCCB;">投稿：${esc(v.author)} ／ 関連商品：${esc(v.linkedProduct)}</p>
          <div style="margin-top:12px;">
            <a href="${esc(v.url)}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">🎬 ショート動画を再生 ↗</a>
          </div>
        </div>
        <div class="shorts-nav">
          <button type="button" id="btn-vid-prev" class="btn btn-outline btn-sm">⬆ 前の動画</button>
          <button type="button" id="btn-vid-like" class="btn btn-olive btn-sm">🧡 いいね (${v.likes})</button>
          <button type="button" id="btn-vid-next" class="btn btn-outline btn-sm">⬇ 次の動画</button>
        </div>
      </div>

      <form id="form-add-vid" class="stack-form hidden" style="margin-top:12px;">
        <div class="form-row-2">
          <input type="text" id="vid-in-title" class="input" placeholder="動画タイトル（例：収穫の瞬間15秒！）" required />
          <input type="url" id="vid-in-url" class="input" placeholder="YouTube Shorts / TikTok / Instagram URL" required />
        </div>
        <div class="form-actions-right">
          <button type="submit" class="btn btn-primary btn-sm">劇場に追加する</button>
        </div>
      </form>
    `;

    document.getElementById('btn-toggle-add-vid').onclick = () => {
      document.getElementById('form-add-vid').classList.toggle('hidden');
    };
    document.getElementById('btn-vid-prev').onclick = () => {
      currentVideoIdx = (currentVideoIdx - 1 + ex.videos.length) % ex.videos.length;
      renderShortsTheater();
    };
    document.getElementById('btn-vid-next').onclick = () => {
      currentVideoIdx = (currentVideoIdx + 1) % ex.videos.length;
      renderShortsTheater();
    };
    document.getElementById('btn-vid-like').onclick = () => {
      v.likes += 1;
      saveExtras();
      renderShortsTheater();
    };
    document.getElementById('form-add-vid').onsubmit = e => {
      e.preventDefault();
      const title = document.getElementById('vid-in-title').value.trim();
      const url = document.getElementById('vid-in-url').value.trim();
      if (!title || !url) return;
      ex.videos.unshift({
        id: 'vid-' + Date.now(),
        title,
        author: 'あなた',
        tag: '🎬 現場ショート',
        url,
        likes: 1,
        linkedProduct: getActiveProductTitle()
      });
      currentVideoIdx = 0;
      saveExtras();
      renderShortsTheater();
    };
  }

  /* ============================================================
     2. #14 🎟️ 事前応援チケット（早割）＆ ご縁株主優待（マルシェ棚）
     ============================================================ */
  function renderPreorderTickets() {
    const shelf = document.getElementById('marche-shelf');
    if (!shelf) return;

    let card = document.getElementById('extras-tickets-card');
    if (!card) {
      card = document.createElement('article');
      card.id = 'extras-tickets-card';
      card.className = 'card';
      shelf.insertBefore(card, shelf.children[1] || null);
    }

    const rankName = ex.myShares >= 10 ? '👑 ご縁プラチナ株主（古民家EC 10%OFF＋試食会優先）'
      : ex.myShares >= 5 ? '🌟 ご縁ゴールド株主（試作モニター優先案内）'
      : '🌱 ご縁サポーター株主（あと' + (5 - ex.myShares) + '株でゴールド！）';

    card.innerHTML = `
      <div class="card-head">
        <div>
          <span class="eyebrow">EN•joy #14 — 作り手の資金を先に支える</span>
          <h2>🎟️ 事前応援チケット（早割）＆ ご縁株主優待</h2>
        </div>
        <span class="mini-pill">保有ご縁株：${ex.myShares} 株</span>
      </div>

      <div class="shareholder-bar">
        <strong>現在の優待ランク：</strong>${rankName}
      </div>

      <div class="ticket-grid">
        ${ex.tickets.map(t => {
          const pct = Math.min(100, Math.round((t.bought / t.limit) * 100));
          return `
            <div class="ticket-card">
              <div class="badge-row">
                <span class="phase-badge">早割 ¥${t.price.toLocaleString()}</span>
                <span class="vis-badge" style="text-decoration:line-through;">通常 ¥${t.normalPrice.toLocaleString()}</span>
                <span class="vis-badge">＋${t.shares} ご縁株</span>
              </div>
              <strong>${esc(t.title)}</strong>
              <div class="hint-text" style="margin:0;">${esc(t.maker)} ／ 残り ${Math.max(0, t.limit - t.bought)} 枠</div>
              <div class="progress-track"><div class="progress-fill" style="width:${pct}%;"></div></div>
              <button type="button" class="btn btn-primary btn-sm" data-buy-ticket="${esc(t.id)}">
                🎟️ 事前応援チケットを予約（デモ）
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;

    card.querySelectorAll('[data-buy-ticket]').forEach(btn => {
      btn.onclick = () => {
        const t = ex.tickets.find(x => x.id === btn.dataset.buyTicket);
        if (!t || t.bought >= t.limit) return;
        t.bought += 1;
        ex.myShares += t.shares;
        saveExtras();
        renderPreorderTickets();
        alert(`🎉 「${t.title}」を事前応援予約しました！（＋${t.shares}ご縁株を獲得）`);
      };
    });
  }

  /* ============================================================
     3. #16 🏢 協賛企業枠（テストキッチン・試供品申請）
     ============================================================ */
  function renderSponsorsCard() {
    const matTab = document.getElementById('marche-materials');
    if (!matTab) return;

    let card = document.getElementById('extras-sponsors-card');
    if (!card) {
      card = document.createElement('article');
      card.id = 'extras-sponsors-card';
      card.className = 'card';
      matTab.appendChild(card);
    }

    const activeTitle = getActiveProductTitle();
    card.innerHTML = `
      <div class="card-head">
        <div>
          <span class="eyebrow">EN•joy #16 — 試作コストを0円に近づける協賛枠</span>
          <h2>🏢 協賛テストキッチン ＆ 試供品パートナー</h2>
        </div>
      </div>
      <p class="hint-text" style="margin-bottom:10px;">
        現在開発室で選択中の商品：<strong>「${esc(activeTitle)}」</strong> に対して協賛枠を申請できます。
      </p>
      <div class="material-grid">
        ${ex.sponsors.map(sp => {
          const applied = sp.appliedProducts.includes(activeTitle);
          return `
            <div class="material-card">
              <div class="badge-row">
                <span class="phase-badge">🏢 協賛パートナー</span>
                <span class="vis-badge">📍 ${esc(sp.area)}</span>
              </div>
              <strong>${esc(sp.name)}</strong>
              <p style="font-size:0.84rem;">✨ ${esc(sp.offer)}</p>
              <div class="pr-box">
                申請・利用中：${sp.appliedProducts.length ? sp.appliedProducts.map(esc).join(' ／ ') : '募集中！'}
              </div>
              <button type="button" class="btn ${applied ? 'btn-olive' : 'btn-primary'} btn-sm" data-apply-sponsor="${esc(sp.id)}">
                ${applied ? '✅ この商品で申請済み' : '🤝 開発中の商品で協賛枠を申請'}
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;

    card.querySelectorAll('[data-apply-sponsor]').forEach(btn => {
      btn.onclick = () => {
        const sp = ex.sponsors.find(x => x.id === btn.dataset.applySponsor);
        const title = getActiveProductTitle();
        if (!sp) return;
        if (!sp.appliedProducts.includes(title)) {
          sp.appliedProducts.push(title);
          saveExtras();
          renderSponsorsCard();
          alert(`🏢 「${sp.name}」の協賛枠へ「${title}」を申請しました！`);
        }
      };
    });
  }

  /* ============================================================
     4. #17 ☕ 開発応援チップ（サポート＆運営タブに配置）
     ============================================================ */
  function renderDevTipCard() {
    const ops = document.getElementById('my-ops');
    if (!ops) return;

    let card = document.getElementById('extras-tip-card');
    if (!card) {
      card = document.createElement('article');
      card.id = 'extras-tip-card';
      card.className = 'card';
      ops.insertBefore(card, ops.children[1] || null);
    }

    card.innerHTML = `
      <div class="card-head">
        <div>
          <span class="eyebrow">EN•joy #17 — 非圧迫型・任意の開発応援</span>
          <h2>☕ EN•joy 開発応援チップ（サポーター枠）</h2>
        </div>
        <span class="mini-pill">累計 ¥${ex.tipsTotal.toLocaleString()} (${ex.tipsCount}名)</span>
      </div>
      <p class="hint-text">EN•joyは基本機能ずっと無料！開発の継続やサーバー・マルシェ運営をコーヒー1杯分から応援いただけます。</p>
      <div class="tip-btn-row">
        <button type="button" class="btn btn-outline btn-sm" data-send-tip="300">☕ コーヒー1杯 (¥300)</button>
        <button type="button" class="btn btn-outline btn-sm" data-send-tip="1000">🍱 開発ランチ応援 (¥1,000)</button>
        <button type="button" class="btn btn-primary btn-sm" data-send-tip="3000">🔥 全力サポーター (¥3,000)</button>
      </div>
      <div class="hint-text">
        最新の応援：${ex.tipLogs.slice(0, 2).map(l => `🧡 ${esc(l.name)}さん(¥${l.amount})「${esc(l.msg)}」`).join(' ／ ')}
      </div>
    `;

    card.querySelectorAll('[data-send-tip]').forEach(btn => {
      btn.onclick = () => {
        const amt = Number(btn.dataset.sendTip);
        const msg = prompt(`¥${amt} の開発応援チップを送ります（デモ）。ひとことメッセージがあればどうぞ！`, 'EN•joy応援してます！');
        if (msg === null) return;
        const d = new Date();
        ex.tipsTotal += amt;
        ex.tipsCount += 1;
        ex.tipLogs.unshift({
          name: 'あなた',
          amount: amt,
          msg: msg.trim() || '応援してます！',
          date: `${d.getMonth() + 1}/${d.getDate()}`
        });
        saveExtras();
        renderDevTipCard();
        alert('☕ 温かい開発応援ありがとうございます！（年輪ボードにもぜひサインを残してくださいね！）');
      };
    });
  }

  /* ============================================================
     5. #15 🎓 認定コンサル・伴走パートナー案内（努力型称号タブ）
     ============================================================ */
  function renderConsultantBanner() {
    const titlesTab = document.getElementById('my-titles');
    if (!titlesTab) return;

    let card = document.getElementById('extras-consult-card');
    if (!card) {
      card = document.createElement('article');
      card.id = 'extras-consult-card';
      card.className = 'card';
      titlesTab.appendChild(card);
    }

    card.innerHTML = `
      <div class="card-head">
        <div>
          <span class="eyebrow">EN•joy #15 — やり込みのその先へ</span>
          <h2>🎓 EN•joy 認定コンサル・伴走パートナー制度</h2>
        </div>
        <span class="phase-badge">称号3個以上でエントリー可</span>
      </div>
      <p style="font-size:0.86rem; color:var(--ink-sub);">
        努力型称号を3つ以上獲得したメンバーは、新しい農家さん・町工場さんのコラボ立ち上げをサポートする「EN•joy認定伴走パートナー」として活動できます。
      </p>
      <div class="form-actions-right" style="margin-top:10px;">
        <button type="button" class="btn btn-outline btn-sm" data-open-modal="modal-inquiry">
          ✉️ 認定パートナーについて相談する
        </button>
      </div>
    `;
  }

  /* ---------- 起動 ---------- */
  function init() {
    injectStyles();
    renderShortsTheater();
    renderPreorderTickets();
    renderSponsorsCard();
    renderDevTipCard();
    renderConsultantBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();