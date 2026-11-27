/* =========================================================
   EN•joy テーマ着せ替え ＆ 6問タップアンケート（patch_theme.js）
   ・単色ラインSVG辞書（27種）
   ・4種プリセット（極クール含む）＋ 6軸カスタム
   ・6問アンケート ＋ POST送信（失敗時は自動コピー）
   ========================================================= */

// ★GAS等の送信先URL（テスト中は空のままでも自動でクリップボードコピーされます）
const EN_SURVEY_ENDPOINT = '';

// 1. 単色ラインSVGアイコン辞書（5タブ＋全画面対応）
const EN_ICONS = {
  home:     `<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/>`,
  news:     `<path d="M4 22h16a2 2 0 0 0 2-2V4H6a2 2 0 0 0-2 2v16Z"/><path d="M10 8h8M10 12h8M10 16h5"/>`,
  marche:   `<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v8h14v-8"/>`,
  lab:      `<path d="M9 3h6M10 3v6.5L5.2 18.2A2 2 0 0 0 7 21h10a2 2 0 0 0 1.8-2.8L14 9.5V3"/><path d="M8.5 14h7"/>`,
  search:   `<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>`,
  filter:   `<path d="M4 6h16M7 12h10M10 18h4"/>`,
  aidea:    `<path d="M12 3l1.8 4.8L18.5 9.5l-4.7 1.7L12 16l-1.8-4.8L5.5 9.5l4.7-1.7L12 3z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z"/>`,
  talk:     `<path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L4 20l1.1-4.2A8.5 8.5 0 1 1 21 11.5z"/>`,
  progress: `<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8.5 12 2.5 2.5 4.5-5"/>`,
  board:    `<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>`,
  detail:   `<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>`,
  vote:     `<path d="M5 12h14v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7z"/><path d="M9 12V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7"/><path d="m10 8 1.5 1.5L14 7"/>`,
  warp:     `<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.5-1.5"/>`,
  summary:  `<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>`,
  lock:     `<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>`,
  tweet:    `<path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="m13.5 6.5 4 4"/>`,
  people:   `<circle cx="9" cy="8" r="3.5"/><path d="M3 19a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a4.5 4.5 0 0 1 5 4.5"/>`,
  seed:     `<path d="M12 21V11"/><path d="M12 11C12 6.5 8.5 4 4 4c0 4.5 2.5 7 8 7z"/><path d="M12 13c0-4 3-6.5 7.5-6.5 0 4-2.5 6.5-7.5 6.5z"/>`,
  hint:     `<path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1z"/>`,
  map:      `<path d="M12 21s-6-5.7-6-10a6 6 0 1 1 12 0c0 4.3-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/>`,
  swipe:    `<rect x="6" y="4" width="12" height="16" rx="2"/><path d="M3 7v10M21 7v10"/>`,
  greet:    `<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.3l7.8-7.8 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>`,
  ask:      `<path d="M8 9h8M8 13h5"/><path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"/>`,
  invite:   `<path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/>`,
  farm:     `<path d="M12 21V9"/><path d="M12 9c-3 0-5.5-2-6-5 3-.5 5.5 1.5 6 5z"/><path d="M12 13c3 0 5.5-2 6-5-3-.5-5.5 1.5-6 5z"/>`,
  factory:  `<path d="M3 21V10l6 4V10l6 4V6h6v15H3z"/><path d="M7 17h2M11 17h2M15 17h2"/>`,
  truck:    `<path d="M1 4h13v12H1zM14 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>`,
  theme:    `<circle cx="12" cy="12" r="9"/><circle cx="9.5" cy="9.5" r="1" fill="currentColor"/><circle cx="14.5" cy="9.5" r="1" fill="currentColor"/><circle cx="8.5" cy="14" r="1" fill="currentColor"/><path d="M15 14.5a2 2 0 1 0 0-4"/>`,
  design:   `<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="11" cy="11" r="2"/>`,
  bell:     `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`,
  plus:     `<path d="M12 5v14M5 12h14"/>`,

};

function getIcon(name, size = 18, cls = '') {
  const path = EN_ICONS[name] || '';
  return `<svg class="en-svg ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

// 2. テーマ状態管理 ＆ 4種プリセット
const EN_PRESETS = {
  v5:     { color: 'v5',    shape: 'round', icon: 'emoji', btn: 'full',      frame: 'border', font: 'normal' },
  sharp:  { color: 'navy',  shape: 'semi',  icon: 'svg',   btn: 'mini',      frame: 'border', font: 'normal' },
  warm:   { color: 'wa',    shape: 'round', icon: 'emoji', btn: 'full',      frame: 'border', font: 'large'  },
  cool:   { color: 'cool',  shape: 'sharp', icon: 'svg',   btn: 'icon-only', frame: 'glass',  font: 'normal' }
};

let enThemeState = JSON.parse(localStorage.getItem('en_theme_v1') || 'null') || { ...EN_PRESETS.v5 };
let enSurveyAns = {};

function applyEnTheme() {
  const root = document.documentElement;
  root.setAttribute('data-en-color', enThemeState.color);
  root.setAttribute('data-en-shape', enThemeState.shape);
  root.setAttribute('data-en-icon',  enThemeState.icon);
  root.setAttribute('data-en-btn',   enThemeState.btn);
  root.setAttribute('data-en-frame', enThemeState.frame);
  root.setAttribute('data-en-font',  enThemeState.font);
  localStorage.setItem('en_theme_v1', JSON.stringify(enThemeState));

  // data-icon属性を持つ要素の絵文字↔SVG一括切替
  document.querySelectorAll('[data-en-icon-name]').forEach(el => {
    const name = el.getAttribute('data-en-icon-name');
    const emoji = el.getAttribute('data-en-emoji') || '';
    el.innerHTML = enThemeState.icon === 'svg' ? getIcon(name, 18) : emoji;
  });
}

// 3. 着せ替え ＆ 6問アンケートUI生成
function initEnThemeTool() {
  if (document.getElementById('en-theme-fab')) return;

  const fab = document.createElement('button');
  fab.id = 'en-theme-fab';
  fab.innerHTML = `${getIcon('theme', 16)} 着せ替え・感想`;
  fab.onclick = () => document.getElementById('en-theme-drawer').classList.toggle('open');
  document.body.appendChild(fab);

  const drawer = document.createElement('div');
  drawer.id = 'en-theme-drawer';
  drawer.innerHTML = `
    <div class="en-drawer-head">
      <strong>🎨 EN•joy 見た目テスト ＆ 感想</strong>
      <button id="en-drawer-close" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;">✕</button>
    </div>
    <div class="en-drawer-tabs">
      <button class="en-drawer-tab active" data-pane="theme">🎨 着せ替え</button>
      <button class="en-drawer-tab" data-pane="survey">📩 6問アンケート</button>
    </div>
    <div id="en-pane-theme"></div>
    <div id="en-pane-survey" style="display:none;"></div>
  `;
  document.body.appendChild(drawer);

  document.getElementById('en-drawer-close').onclick = () => drawer.classList.remove('open');
  drawer.querySelectorAll('.en-drawer-tab').forEach(tab => {
    tab.onclick = () => {
      drawer.querySelectorAll('.en-drawer-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const p = tab.getAttribute('data-pane');
      document.getElementById('en-pane-theme').style.display = p === 'theme' ? 'block' : 'none';
      document.getElementById('en-pane-survey').style.display = p === 'survey' ? 'block' : 'none';
    };
  });

  renderThemeControls();
  renderSurveyControls();
  applyEnTheme();
}

function renderThemeControls() {
  const pane = document.getElementById('en-pane-theme');
  const axes = [
    { key: 'color', title: '① 色味（6種）', opts: [['v5','現行v5'],['clear','クリア白'],['navy','近代ネイビー'],['wa','あたたか和'],['dark','ダーク'],['cool','⚡極・クール']] },
    { key: 'shape', title: '② 形（3種）', opts: [['round','丸'],['semi','セミシャープ'],['sharp','シャープ']] },
    { key: 'icon',  title: '③ アイコン（2種）', opts: [['emoji','🎨 絵文字'],['svg','✒️ 単色SVG']] },
    { key: 'btn',   title: '④ ボタン表記（3種）', opts: [['full','文字＋アイコン'],['mini','極小ラベル'],['icon-only','アイコンのみ']] },
    { key: 'frame', title: '⑤ 枠と質感（3種）', opts: [['border','枠あり'],['none','枠レス'],['glass','ガラス質感']] },
    { key: 'font',  title: '⑥ 文字サイズ（2種）', opts: [['normal','標準'],['large','大きめ']] }
  ];

  pane.innerHTML = `
    <div class="en-sec-title">⚡ ワンタップ・プリセット</div>
    <div class="en-chip-row">
      <button class="en-chip" data-preset="v5">現行v5</button>
      <button class="en-chip" data-preset="sharp">近代シャープ</button>
      <button class="en-chip" data-preset="warm">やさしい街のラボ</button>
      <button class="en-chip" data-preset="cool">⚡ 極・クール</button>
    </div>
    ${axes.map(a => `
      <div class="en-sec-title">${a.title}</div>
      <div class="en-chip-row">
        ${a.opts.map(([val, label]) => `
          <button class="en-chip ${enThemeState[a.key] === val ? 'active' : ''}" data-axis="${a.key}" data-val="${val}">${label}</button>
        `).join('')}
      </div>
    `).join('')}
  `;

  pane.querySelectorAll('[data-preset]').forEach(btn => {
    btn.onclick = () => {
      enThemeState = { ...EN_PRESETS[btn.getAttribute('data-preset')] };
      applyEnTheme();
      renderThemeControls();
    };
  });
  pane.querySelectorAll('[data-axis]').forEach(btn => {
    btn.onclick = () => {
      enThemeState[btn.getAttribute('data-axis')] = btn.getAttribute('data-val');
      applyEnTheme();
      renderThemeControls();
    };
  });
}

function renderSurveyControls() {
  const pane = document.getElementById('en-pane-survey');
  const qs = [
    { id: 'q1_role',   t: '1. あなたの立場（任意）', opts: ['一次産業','加工・製造','デザイン','物流','買い手・応援','その他'] },
    { id: 'q2_look',   t: '2. 第一印象は？', opts: ['すごく良い','まあ良い','普通','ごちゃつく'] },
    { id: 'q3_info',   t: '3. 情報量は？', opts: ['ちょうど良い','もう少し欲しい','少し多い'] },
    { id: 'q4_tap',    t: '4. 片手での押しやすさ', opts: ['押しやすい','普通','押しにくい'] },
    { id: 'q5_use',    t: '5. 一番使いたい機能', opts: ['つぶやき/ほしい','おすすめ人材マップ','EN•ラボ','AIディア','役立ちニュース','マルシェ'] },
    { id: 'q6_freq',   t: '6. どれくらい開きたい？', opts: ['毎日','週に数回','たまに','まだ分からない'] }
  ];

  pane.innerHTML = qs.map(q => `
    <div class="en-sec-title">${q.t}</div>
    <div class="en-chip-row">
      ${q.opts.map(opt => `
        <button class="en-chip ${enSurveyAns[q.id] === opt ? 'active' : ''}" data-qid="${q.id}" data-ans="${opt}">${opt}</button>
      `).join('')}
    </div>
  `).join('') + `<button id="en-survey-send" class="en-submit-btn">📩 この設定と感想を送る</button>`;

  pane.querySelectorAll('[data-qid]').forEach(btn => {
    btn.onclick = () => {
      enSurveyAns[btn.getAttribute('data-qid')] = btn.getAttribute('data-ans');
      renderSurveyControls();
    };
  });

  document.getElementById('en-survey-send').onclick = async () => {
    const payload = {
      timestamp: new Date().toISOString(),
      screenWidth: window.innerWidth,
      theme: enThemeState,
      survey: enSurveyAns
    };
    const jsonStr = JSON.stringify(payload, null, 2);

    if (EN_SURVEY_ENDPOINT) {
      try {
        await fetch(EN_SURVEY_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: jsonStr
        });
        alert('送信しました！ご協力ありがとうございます🎉');
        return;
      } catch (e) { /* フォールバックへ */ }
    }
    try {
      await navigator.clipboard.writeText(jsonStr);
      alert('テスト結果をクリップボードにコピーしました！（そのままLINE等に貼れます）');
    } catch (e) {
      console.log(jsonStr);
      alert('コンソールに結果を出力しました！');
    }
  };
}

window.addEventListener('DOMContentLoaded', initEnThemeTool);