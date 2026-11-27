/* =========================================================
   EN•joy モック画面描画パッチ（patch_views.js）
   ・ホーム / 縁 / ラボ / 役立ち / マルシェ の全5タブ描画
   ・着せ替えツール（絵文字↔SVG・ボタン表記）と完全連動
   ========================================================= */

const enViewState = {
  userMode: 'maker',     // 'maker'(つくり手) | 'buyer'(買い手)
  mapOpen: true,
  slideIdx: 0,
  slideFixed: false,
  enSubTab: 'tweet',     // 'tweet' | 'people'
  tweetCat: 'all',       // 'all' | 'want' | 'trouble' | 'idea'
  peopleView: 'list',    // 'list' | 'map' | 'swipe'
  mapSelectedId: 'usr-001',
  swipeIdx: 0,
  labSubTab: 'my',       // 'my' | 'discover' | 'aidea'
  myLabMode: 'my_active',// 'my_active' | 'my_solo'
  flippedLabs: {}
};

function enIconTag(name, emoji) {
  return `<span data-en-icon-name="${name}" data-en-emoji="${emoji}">${emoji}</span>`;
}
function enGoTab(tabName) {
  document.querySelector(`#bottomNav [data-tab="${tabName}"]`)?.click();
}
function enSyncTheme() {
  if (typeof applyEnTheme === 'function') applyEnTheme();
}

// =========================================================
// 1. 🏠 ホーム（自動横スワイプ3面帯 ＋ 2×2ウィジェット ＋ ニュース1行）
// =========================================================
function renderEnHome() {
  const sec = document.getElementById('view-home');
  if (!sec) return;
  let root = document.getElementById('en-mock-home');
  if (!root) {
    root = document.createElement('div');
    root.id = 'en-mock-home';
    root.className = 'en-wrap';
    sec.prepend(root);
  }

  const isMaker = enViewState.userMode === 'maker';
  const widgets = isMaker ? [
    { icon: 'vote',   emoji: '⚡', title: '全体のやること', badge: '2件', body: 'ドライトマト：多数決あと1件', tab: 'en' },
    { icon: 'board',  emoji: '📅', title: '全体カレンダー', badge: '今週', body: '11/29 試作パッケージ締切', tab: 'en' },
    { icon: 'talk',   emoji: '💬', title: '関連の動き',     badge: '新着', body: '買い手「ほしい！」に42いいね', tab: 'feed' },
    { icon: 'aidea',  emoji: '✨', title: '今日のAIディア', badge: '提案', body: '完熟トマト×低温乾燥チップス', tab: 'en' }
  ] : [
    { icon: 'marche', emoji: '🛍️', title: '新着商品',       badge: '早割', body: '枚方産ドライトマトおつまみ', tab: 'shop' },
    { icon: 'lab',    emoji: '🧪', title: '応援中ラボ',     badge: '投票', body: '訳ありみかんマーマレード', tab: 'en' },
    { icon: 'board',  emoji: '📅', title: 'マルシェ予定',   badge: '週末', body: '12/6 大阪・枚方週末マルシェ', tab: 'shop' },
    { icon: 'greet',  emoji: '❤️', title: 'お気に入り',     badge: '4件', body: '山田農園 ほか3軒のつくり手', tab: 'feed' }
  ];

  root.innerHTML = `
    <div class="en-prof-slider" id="enProfSlider">
      <div class="en-prof-track" id="enProfTrack" style="transform:translateX(-${enViewState.slideIdx * 100}%)">
        <div class="en-prof-slide">
          <div class="en-between">
            <div class="en-row">
              <img class="en-avatar" src="${EN_IMAGES.userFarm}" alt="">
              <div>
                <div class="en-title">マイ名刺（${isMaker ? '🛠️ つくり手' : '🛍️ 買い手'}）</div>
                <div class="en-meta">大阪府 枚方市・寝屋川市</div>
              </div>
            </div>
            <span class="en-pill">進行2 / 繋がり12</span>
          </div>
        </div>
        <div class="en-prof-slide">
          <div class="en-between">
            <div class="en-title">${enIconTag('map', '🗺️')} マップ公開：${enViewState.mapOpen ? 'ON' : 'OFF'}</div>
            <button class="en-act-btn" id="enToggleMapBtn">${enViewState.mapOpen ? 'OFFにする' : 'ONにする'}</button>
          </div>
          <div class="en-between" style="margin-top:8px;">
            <span class="en-meta">表示モード切替（兼業対応）</span>
            <button class="en-act-btn primary" id="enToggleModeBtn">${isMaker ? '🛍️ 買い手表示へ' : '🛠️ つくり手表示へ'}</button>
          </div>
        </div>
        <div class="en-prof-slide">
          <div class="en-between">
            <div>
              <div class="en-title">🪺 マイ・エンちゃん（育成中）</div>
              <div class="en-meta">今月の応援 48件・巣立ちまであと1ステップ！</div>
            </div>
            <span class="en-pill">Lv.2</span>
          </div>
        </div>
      </div>
      <div class="en-prof-dots">
        ${[0,1,2].map(i => `<span class="en-prof-dot ${enViewState.slideIdx === i ? 'active' : ''}" data-slide="${i}"></span>`).join('')}
      </div>
    </div>

    <div class="en-widget-grid">
      ${widgets.map(w => `
        <button type="button" class="en-widget" data-jump="${w.tab}">
          <div class="en-widget-head">
            <span>${enIconTag(w.icon, w.emoji)} ${w.title}</span>
            <span class="en-badge">${w.badge}</span>
          </div>
          <div class="en-widget-body">${w.body}</div>
        </button>
      `).join('')}
    </div>

    <div class="en-news-bar" data-jump="tips">
      <span class="en-pill">${enIconTag('news', '📰')} 昨夜の分析</span>
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700;">${EN_MOCK_NEWS[0].title}</span>
    </div>
  `;

  root.querySelectorAll('[data-jump]').forEach(el => {
    el.onclick = () => enGoTab(el.getAttribute('data-jump'));
  });
  root.querySelectorAll('[data-slide]').forEach(dot => {
    dot.onclick = () => {
      enViewState.slideFixed = true;
      enViewState.slideIdx = Number(dot.getAttribute('data-slide'));
      renderEnHome();
    };
  });
  document.getElementById('enToggleMapBtn').onclick = () => {
    enViewState.slideFixed = true;
    enViewState.mapOpen = !enViewState.mapOpen;
    renderEnHome();
  };
  document.getElementById('enToggleModeBtn').onclick = () => {
    enViewState.slideFixed = true;
    enViewState.userMode = isMaker ? 'buyer' : 'maker';
    renderEnHome();
  };
  enSyncTheme();
}

// =========================================================
// 2. 🤝 縁を繋げる（つぶやき4タブ ＋ おすすめ人材 リスト/マップ/スワイプ）
// =========================================================
function renderEnFeed() {
  const sec = document.getElementById('view-feed');
  if (!sec) return;
  const isTweet = enViewState.enSubTab === 'tweet';

  let bodyHtml = '';
  if (isTweet) {
    const list = EN_MOCK_TWEETS.filter(t => enViewState.tweetCat === 'all' || t.category === enViewState.tweetCat);
    bodyHtml = `
      <div class="en-subtabs">
        ${[['all','すべて'],['want','🙋 ほしい'],['trouble','🆘 困りごと'],['idea','💡 ひらめき']].map(([k,l]) =>
          `<button class="en-subtab ${enViewState.tweetCat === k ? 'active' : ''}" data-tcat="${k}">${l}</button>`
        ).join('')}
      </div>
      ${list.map(t => `
        <div class="card en-card">
          <div class="en-between">
            <div class="en-row">
              <img class="en-avatar" src="${t.avatar}" alt="">
              <div>
                <div class="en-title">${t.author}</div>
                <div class="en-meta">${t.area} ・ ${t.role} ・ ${t.time}</div>
              </div>
            </div>
            <span class="en-pill">${t.category === 'want' ? 'ほしい' : t.category === 'trouble' ? '困りごと' : 'ひらめき'}</span>
          </div>
          <p class="en-text">${t.text}</p>
          <img class="en-card-img" src="${t.photo}" alt="">
          <div class="en-actions">
            <button class="en-act-btn">${enIconTag('greet', '❤️')} <span>${t.likes}</span></button>
            <button class="en-act-btn">${enIconTag('talk', '💬')} <span>${t.comments}</span></button>
            <button class="en-act-btn primary" onclick="alert('📌 ヒント箱にストック / 🧪 1人ラボ作成 を選択できます！')">
              ${enIconTag('seed', '🌱')} <span class="en-btn-label">タネにする</span>
            </button>
          </div>
        </div>
      `).join('')}
    `;
  } else {
    const view = enViewState.peopleView;
    const selected = EN_MOCK_PEOPLE.find(p => p.id === enViewState.mapSelectedId) || EN_MOCK_PEOPLE[0];
    const swp = EN_MOCK_PEOPLE[enViewState.swipeIdx % EN_MOCK_PEOPLE.length];

    bodyHtml = `
      <div class="en-subtabs">
        <button class="en-subtab ${view==='list'?'active':''}" data-pview="list">${enIconTag('people','📋')} リスト</button>
        <button class="en-subtab ${view==='map'?'active':''}" data-pview="map">${enIconTag('map','🗺️')} マップ</button>
        <button class="en-subtab ${view==='swipe'?'active':''}" data-pview="swipe">${enIconTag('swipe','🃏')} スワイプ</button>
      </div>
      ${view === 'list' ? `
        <div class="en-grid-2">
          ${EN_MOCK_PEOPLE.map(p => `
            <div class="card en-card" style="padding:10px;">
              <div class="en-row">
                <img class="en-avatar" src="${p.avatar}" alt="">
                <div><div class="en-title" style="font-size:13px;">${p.name}</div><div class="en-meta">${p.area}</div></div>
              </div>
              <span class="en-pill" style="align-self:flex-start;">${enIconTag(p.category,'🌾')} ${p.categoryLabel}</span>
              <p class="en-text" style="font-size:12px;">${p.canDo}</p>
              <div class="en-meta" style="color:var(--en-accent);">✨ ${p.aiMatch}</div>
              <div class="en-actions">
                <button class="en-act-btn">${enIconTag('greet','👋')} <span class="en-btn-label">気になる</span></button>
                <button class="en-act-btn">${enIconTag('ask','💬')} <span class="en-btn-label">聞く</span></button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : view === 'map' ? `
        <div class="en-map-box">
          ${EN_MOCK_PEOPLE.map(p => `
            <button class="en-map-pin ${p.id === selected.id ? 'active' : ''}" data-pin="${p.id}" style="left:${p.mapPos.x}%;top:${p.mapPos.y}%;">
              ${enIconTag(p.category,'📍')} ${p.area}
            </button>
          `).join('')}
        </div>
        <div class="card en-card">
          <div class="en-row">
            <img class="en-avatar" src="${selected.avatar}" alt="">
            <div><div class="en-title">${selected.name}（${selected.shop}）</div><div class="en-meta">${selected.area} ・ ${selected.categoryLabel}</div></div>
          </div>
          <p class="en-text">${selected.canDo}</p>
          <div class="en-meta" style="color:var(--en-accent);">✨ ${selected.aiMatch}</div>
          <div class="en-actions">
            <button class="en-act-btn">${enIconTag('greet','👋')} <span class="en-btn-label">気になる</span></button>
            <button class="en-act-btn">${enIconTag('ask','💬')} <span class="en-btn-label">ちょっと聞く</span></button>
            <button class="en-act-btn primary">${enIconTag('invite','📩')} <span class="en-btn-label">ラボに誘う</span></button>
          </div>
        </div>
      ` : `
        <div class="card en-card">
          <img class="en-card-img" style="height:210px;" src="${swp.avatar}" alt="">
          <div class="en-title">${swp.name}（${swp.shop}）</div>
          <div class="en-meta">${swp.area} ・ ${swp.categoryLabel}</div>
          <p class="en-text">${swp.canDo}</p>
          <div class="en-meta" style="color:var(--en-accent);">✨ ${swp.aiMatch}</div>
          <div class="en-actions">
            <button class="en-act-btn" id="enSwipeNext">スキップ ➔</button>
            <button class="en-act-btn primary" id="enSwipeLike">${enIconTag('greet','👋')} <span class="en-btn-label">気になる！</span></button>
          </div>
        </div>
      `}
    `;
  }

  sec.innerHTML = `
    <div class="en-wrap">
      <div class="en-subtabs">
        <button class="en-subtab ${isTweet?'active':''}" data-entab="tweet">${enIconTag('tweet','💬')} つぶやき</button>
        <button class="en-subtab ${!isTweet?'active':''}" data-entab="people">${enIconTag('people','👥')} おすすめ人材</button>
      </div>
      ${bodyHtml}
    </div>
  `;

  sec.querySelectorAll('[data-entab]').forEach(b => b.onclick = () => { enViewState.enSubTab = b.getAttribute('data-entab'); renderEnFeed(); });
  sec.querySelectorAll('[data-tcat]').forEach(b => b.onclick = () => { enViewState.tweetCat = b.getAttribute('data-tcat'); renderEnFeed(); });
  sec.querySelectorAll('[data-pview]').forEach(b => b.onclick = () => { enViewState.peopleView = b.getAttribute('data-pview'); renderEnFeed(); });
  sec.querySelectorAll('[data-pin]').forEach(b => b.onclick = () => { enViewState.mapSelectedId = b.getAttribute('data-pin'); renderEnFeed(); });
  const nextBtn = document.getElementById('enSwipeNext');
  if (nextBtn) nextBtn.onclick = () => { enViewState.swipeIdx++; renderEnFeed(); };
  const likeBtn = document.getElementById('enSwipeLike');
  if (likeBtn) likeBtn.onclick = () => { enViewState.swipeIdx++; renderEnFeed(); };
  enSyncTheme();
}

// =========================================================
// 3. 🧪 EN•ラボ（マイラボ / 探す / AIディア）
// =========================================================
function renderEnLab() {
  const sec = document.getElementById('view-en');
  if (!sec) return;
  const tab = enViewState.labSubTab;

  let bodyHtml = '';
  if (tab === 'my') {
    const labs = EN_MOCK_LABS.filter(l => l.mode === enViewState.myLabMode);
    bodyHtml = `
      <div class="en-subtabs">
        <button class="en-subtab ${enViewState.myLabMode==='my_active'?'active':''}" data-lmode="my_active">👥 進行中</button>
        <button class="en-subtab ${enViewState.myLabMode==='my_solo'?'active':''}" data-lmode="my_solo">${enIconTag('lock','🔒')} 1人準備中</button>
      </div>
      ${labs.map(l => {
        const flipped = !!enViewState.flippedLabs[l.id];
        return `
          <div class="card en-card">
            <img class="en-card-img" src="${l.photo}" alt="">
            <div class="en-between">
              <div class="en-title">${l.title}</div>
              ${l.fanPublic ? '<span class="en-pill">🌐 ファン公開</span>' : ''}
            </div>
            ${!flipped ? `
              <div class="en-row" style="flex-wrap:wrap;">
                ${(l.badges || []).map(b => `<span class="en-badge">${b.label}</span>`).join('')}
                <span class="en-meta">${l.nextDeadline || l.updatedAt}</span>
              </div>
            ` : `
              <div class="en-text" style="background:rgba(128,128,128,0.08);padding:8px;border-radius:8px;font-size:12px;">
                ${l.summary.flow ? `<div>📌 流れ：${l.summary.flow}</div><div>✅ 決定：${l.summary.decided}</div><div>👉 次：${l.summary.next}</div>`
                  : `<div>🌱 タネ：${l.summary.seed}</div><div>🤝 必要：${l.summary.needed}</div>`}
              </div>
            `}
            <div class="en-actions">
              <button class="en-act-btn" data-flip="${l.id}">${enIconTag('summary','📄')} <span class="en-btn-label">${flipped ? '表に戻す' : '要約を見る'}</span></button>
              <button class="en-act-btn primary" onclick="alert('ルーム内（トーク・進行・ボード・詳細）を開きます！')">${enIconTag('lab','🧪')} <span class="en-btn-label">ルームを開く</span></button>
            </div>
          </div>
        `;
      }).join('')}
    `;
  } else if (tab === 'discover') {
    const labs = EN_MOCK_LABS.filter(l => l.mode === 'discover');
    bodyHtml = labs.map(l => `
      <div class="card en-card">
        <img class="en-card-img" src="${l.photo}" alt="">
        <div class="en-between">
          <div class="en-title">${l.title}</div>
          <span class="en-pill">${l.status}</span>
        </div>
        <div class="en-meta">📍 ${l.area} ・ 募集：${l.recruiting}</div>
        <div class="en-actions">
          <button class="en-act-btn primary">${enIconTag('greet','👋')} <span class="en-btn-label">応援・参加を見る</span></button>
        </div>
      </div>
    `).join('');
  } else {
    bodyHtml = EN_MOCK_AIDEA.map(a => `
      <div class="card en-card">
        <span class="en-pill" style="align-self:flex-start;">${enIconTag('aidea','✨')} ${a.creator}（3点掛け算）</span>
        <img class="en-card-img" src="${a.photo}" alt="">
        <div class="en-title">${a.proposal}</div>
        <div class="en-meta">🙋 買い手：${a.want}</div>
        <div class="en-meta">🌾 素材：${a.trouble.area}（${a.trouble.text}）</div>
        <div class="en-meta">🏭 相棒：${a.partner.area}（${a.partner.text}）</div>
        <p class="en-text">${a.reason}</p>
        <div class="en-actions">
          <button class="en-act-btn">${enIconTag('seed','🧪')} <span class="en-btn-label">1人ルームで温める</span></button>
          <button class="en-act-btn primary">${enIconTag('invite','📩')} <span class="en-btn-label">すぐオファー</span></button>
        </div>
      </div>
    `).join('');
  }

  sec.innerHTML = `
    <div class="en-wrap">
      <div class="en-subtabs">
        <button class="en-subtab ${tab==='my'?'active':''}" data-ltab="my">${enIconTag('lab','🧪')} マイラボ</button>
        <button class="en-subtab ${tab==='discover'?'active':''}" data-ltab="discover">${enIconTag('search','🔍')} 探す</button>
        <button class="en-subtab ${tab==='aidea'?'active':''}" data-ltab="aidea">${enIconTag('aidea','✨')} AIディア</button>
      </div>
      ${bodyHtml}
    </div>
  `;

  sec.querySelectorAll('[data-ltab]').forEach(b => b.onclick = () => { enViewState.labSubTab = b.getAttribute('data-ltab'); renderEnLab(); });
  sec.querySelectorAll('[data-lmode]').forEach(b => b.onclick = () => { enViewState.myLabMode = b.getAttribute('data-lmode'); renderEnLab(); });
  sec.querySelectorAll('[data-flip]').forEach(b => b.onclick = () => {
    const id = b.getAttribute('data-flip');
    enViewState.flippedLabs[id] = !enViewState.flippedLabs[id];
    renderEnLab();
  });
  enSyncTheme();
}

// =========================================================
// 4. 🥬 役立ち（毎晩の分析ニュース ＆ 旬レシピ）
// =========================================================
function renderEnTips() {
  const sec = document.getElementById('view-tips');
  if (!sec) return;
  sec.innerHTML = `
    <div class="en-wrap">
      <div class="en-title">${enIconTag('news','🥬')} 役立ち（毎晩分析ニュース ＆ 旬レシピ）</div>
      ${EN_MOCK_NEWS.map(n => `
        <div class="card en-card">
          <span class="en-pill" style="align-self:flex-start;">${n.date}</span>
          <img class="en-card-img" src="${n.photo}" alt="">
          <div class="en-title">${n.title}</div>
          <p class="en-text">${n.summary}</p>
          <div class="en-actions">
            <button class="en-act-btn primary" onclick="alert('この記事をタネにして1人ラボを作成します！')">
              ${enIconTag('seed','🌱')} <span class="en-btn-label">このネタをタネにする</span>
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  enSyncTheme();
}

// =========================================================
// 5. 🎪 マルシェ（巣立ち商品 ＆ 50:50厳選ギア）
// =========================================================
function renderEnShop() {
  const sec = document.getElementById('view-shop');
  if (!sec) return;
  sec.innerHTML = `
    <div class="en-wrap">
      <div class="en-title">${enIconTag('marche','🎪')} マルシェ（巣立ち商品 ＆ 50:50厳選ギア）</div>
      ${EN_MOCK_MARCHE.map(m => `
        <div class="card en-card">
          <span class="en-pill" style="align-self:flex-start;">${m.badge}</span>
          <img class="en-card-img" src="${m.photo}" alt="">
          <div class="en-between">
            <div class="en-title">${m.title}</div>
            <strong style="color:var(--en-accent);white-space:nowrap;">${m.price}</strong>
          </div>
          <div class="en-meta">${m.maker}</div>
          <div class="en-actions">
            <button class="en-act-btn primary">${enIconTag('marche','🛍️')} <span class="en-btn-label">${m.type === 'gear' ? 'Amazonで見る（50:50）' : '予約・購入する'}</span></button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  enSyncTheme();
}

// 初期化 ＆ 自動スライド（操作したら固定）
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    renderEnHome();
    renderEnFeed();
    renderEnLab();
    renderEnTips();
    renderEnShop();

    // プロフィール帯の4.5秒自動スライド（触ったら停止）
    setInterval(() => {
      if (enViewState.slideFixed) return;
      enViewState.slideIdx = (enViewState.slideIdx + 1) % 3;
      const track = document.getElementById('enProfTrack');
      if (track) {
        track.style.transform = `translateX(-${enViewState.slideIdx * 100}%)`;
        document.querySelectorAll('.en-prof-dot').forEach((d, i) => d.classList.toggle('active', i === enViewState.slideIdx));
      }
    }, 4500);
  }, 150);
});