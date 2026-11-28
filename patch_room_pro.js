/* =========================================================
   EN•joy 開発ルーム 全力Proモジュール（patch_room_pro.js v3）
   ・全ボード構造矛盾を完全解消（試作A/B4項目入力 / 複数なぜなぜ / 全項目削除対応）
   ・食品表示・法規カード：中身を常時表示＆直接編集＋自由項目追加＋削除
   ・既存localStorage(en_joy_room_pro_v2)からの自動マイグレーション対応
   ========================================================= */

const EN_ROOM_PRO_STORAGE_KEY = 'en_joy_room_pro_v2';

const EN_TOOL_CATALOG = [
  { id: 'story',   icon: '📌', name: 'ルーム内決定メモ（非公開）',       cat: '企画・戦略', desc: 'チーム内で決まった方針・メモの記録（外部非公開）' },
  { id: 'cost',    icon: '💰', name: '原価・販路別粗利',     cat: '経営・試作', desc: '原価率・損益分岐点・マルシェ/EC/卸の手残り比較' },
  { id: 'market',  icon: '📊', name: '市場・ポジショニング', cat: '企画・戦略', desc: 'ターゲット・競合・選ばれる理由・価格帯設計' },
  { id: 'vpc',     icon: '👤', name: '顧客価値(VPC)',        cat: '企画・戦略', desc: '買い手の悩み・理想 × 商品の解決策をピタッと接続' },
  { id: 'proto',   icon: '🧪', name: '試作A/B比較表',        cat: '経営・試作', desc: '配合・原価・評価・感想メモの比較＆採用管理' },
  { id: 'why',     icon: '❓', name: 'なぜなぜ分析',         cat: '発想・解決', desc: '複数課題を5段階深掘り→根本対策を即タスク化' },
  { id: 'fish',    icon: '🐟', name: '特性要因(4M1E)',       cat: '発想・解決', desc: '人・設備・材料・方法で原因を網羅＆整理' },
  { id: 'scamper', icon: '💡', name: 'SCAMPER発想',          cat: '発想・解決', desc: '代用・結合・応用・逆転など7視点で差別化案創出' },
  { id: 'decision',icon: '⚖️', name: '重み付け意思決定',     cat: '発想・解決', desc: '複数案を「味・原価・見た目・速さ」で数値採点' },
  { id: 'matrix',  icon: '🎯', name: '優先順位マトリクス',   cat: '発想・解決', desc: '効果×手間の4象限で今すぐやる1手を厳選' },
  { id: 'swot',    icon: '🧭', name: 'SWOTクロス戦略',       cat: '企画・戦略', desc: '強み・弱み・機会・脅威から勝ち筋アクション導出' },
  { id: 'risk',    icon: '🛡️', name: 'リスク先回り(FMEA)',  cat: '品質・販路', desc: '発生率×重大度スコアで割れ・湿気・事故を事前潰し' },
  { id: 'legal',   icon: '📋', name: '食品表示・法規',       cat: '品質・販路', desc: '一括表示・アレルゲン・栄養成分の中身下書き＆自由追加' },
  { id: 'promo',   icon: '📣', name: '販促・パッケージ計画', cat: '品質・販路', desc: 'キャッチコピー・店頭POP・SNS告知・試食動線' }
];

const EN_TOOL_PACKS = [
  { id: 'food_full', label: '🥫 食品開発フルセット',   tools: ['story','cost','market','vpc','proto','risk','legal','promo'] },
  { id: 'solve_pro', label: '🧠 問題解決プロセット',   tools: ['why','fish','decision','matrix','scamper','swot'] },
  { id: 'speed_mvp', label: '⚡ 最速マルシェ試作セット', tools: ['story','cost','proto','legal','promo'] }
];

const EN_SALES_CHANNELS = [
  { id: 'marche',    label: '🎪 EN•マルシェ' },
  { id: 'own_ec',    label: '🌐 自社ECサイト' },
  { id: 'roadside',  label: '🏪 道の駅・直売所' },
  { id: 'sns',       label: '📷 Instagram / LINE' },
  { id: 'event',     label: '🏕️ 地域マルシェ・店頭' },
  { id: 'wholesale', label: '🏬 カフェ・小売店卸' }
];

const DEFAULT_LEGAL_ITEMS = [
  {
    id: 'lg-1',
    label: '一括表示ラベル原案（名称・原材料・内容量・保存方法）',
    detail: '【名称】乾燥野菜チップス\n【原材料名】トマト（大阪府枚方市産）、食塩（国内製造）\n【内容量】30g\n【保存方法】直射日光・高温多湿を避け常温保存',
    done: true
  },
  {
    id: 'lg-2',
    label: '特定原材料（アレルゲン28品目）の確認',
    detail: '使用アレルゲン：なし（28品目該当なし）\n※同一加工ラインで小麦・乳成分を含む製品を製造しているため、コンタミ注意書きを枠外へ記載予定。',
    done: true
  },
  {
    id: 'lg-3',
    label: '栄養成分表示（1袋30gあたり推定値）',
    detail: 'エネルギー：98kcal / たんぱく質：3.2g / 脂質：0.4g / 炭水化物：20.4g / 食塩相当量：0.25g\n※日本食品標準成分表ベースで算出（加工所と最終確認中）',
    done: false
  },
  {
    id: 'lg-4',
    label: '製造所・営業許可・賞味期限の根拠',
    detail: '【製造者】カワチ乾燥加工所（東大阪市〇〇／食品衛生法 営業届出済）\n【賞味期限】製造日より90日（常温・乾燥剤封入の経時テスト実施中）',
    done: false
  }
];

let enRoomProStore = {};
let enAiProEnabled = true;
let enTaskFilterPendingOnly = false;
let enHubSearchQuery = '';
let enHubCatFilter = 'all';

function enEsc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function loadRoomProStore() {
  try {
    const raw = localStorage.getItem(EN_ROOM_PRO_STORAGE_KEY);
    if (raw) enRoomProStore = JSON.parse(raw) || {};
  } catch (e) { enRoomProStore = {}; }
}

function saveRoomProStore() {
  try { localStorage.setItem(EN_ROOM_PRO_STORAGE_KEY, JSON.stringify(enRoomProStore)); } catch (e) {}
}

// 既存保存データの自動マイグレーション（古いデータを壊さず新構造へ昇格）
function migrateRoomProData(d) {
  if (!Array.isArray(d.whyList)) {
    const oldWhy = d.why || {
      problem: '1袋あたりの原価が目標280円ギリギリになってしまう',
      steps: ['クラフト袋＋個包装ラベルの単価が1枚65円かかっている', '最小50枚の小ロットで袋へ直接カラー印刷する見積りだった', '初期版代が1袋あたりに重く乗っている'],
      action: '既製無地クラフト窓袋＋1色耐水シール切替で包材費を42円へ削減！'
    };
    d.whyList = [
      { id: 'why-1', problem: oldWhy.problem, steps: [...(oldWhy.steps || [])], action: oldWhy.action || '' },
      { id: 'why-2', problem: '梅雨〜夏場にチップスがしんなりしやすい', steps: ['開封後にチャックを閉めても湿気が戻りやすい', '乾燥剤（シリカゲル）の容量が30gに対して不足していた'], action: '防湿アルミ蒸着クラフト袋＋シリカゲル2gへ変更' }
    ];
  }
  if (!Array.isArray(d.legal) || d.legal.length === 0) {
    d.legal = DEFAULT_LEGAL_ITEMS.map(x => ({ ...x }));
  } else {
    d.legal.forEach((item, idx) => {
      if (!item.id) item.id = 'lg-' + idx + '-' + Date.now();
      if (typeof item.detail !== 'string') {
        const def = DEFAULT_LEGAL_ITEMS[idx];
        item.detail = def ? def.detail : 'ここに確認内容・表示文言・根拠メモを記入できます';
      }
    });
  }
  if (!Array.isArray(d.customBoards)) d.customBoards = [];
  if (!Array.isArray(d.pinnedTools)) d.pinnedTools = ['cost', 'proto', 'why'];
  return d;
}

function getRoomProData(labId) {
  if (!enRoomProStore[labId]) {
    enRoomProStore[labId] = {
      activeTools: ['story', 'cost', 'market', 'proto', 'why', 'decision', 'risk', 'legal'],
      pinnedTools: ['cost', 'proto', 'why', 'legal'],
      selectedTool: 'cost',
      customBoards: [],
      polls: [
        { id: 'poll-1', title: 'パッケージデザイン最終決定', deadline: 'あと2日', myChoice: null, options: [
          { key: 'A', label: '案A：クラフト紙＋1色スタンプ風', votes: 3 },
          { key: 'B', label: '案B：中身が見える透明窓付き袋', votes: 2 }
        ]}
      ],
      cost: { material: 105, process: 72, pack: 42, ship: 35, price: 480, fixedCost: 15000, lot: 100 },
      market: {
        target: '寝屋川・枚方エリアの30〜40代子育てママ（無添加おやつ探し層）',
        competitor: 'スーパーの市販野菜チップス（¥250〜300・添加物あり）',
        advantage: '完熟地元トマト100%・低温乾燥で甘み凝縮・塩のみ無添加',
        priceRange: '単品 ¥450〜520 ／ ギフト3袋 ¥1,280〜1,480'
      },
      vpc: {
        pains: '市販のお菓子は添加物や油が多く子どもに罪悪感がある',
        gains: '罪悪感ゼロで子どもが喜び、地元農家の応援にもなる',
        relievers: '砂糖・油・保存料ゼロの低温60℃ノンフライ製法',
        creators: '枚方産完熟トマトの濃い甘み＆チャック袋で持ち歩きOK'
      },
      protos: [
        { ver: 'Ver.1', cond: '70℃×6h・塩1.2%', cost: '¥270', score: '★★☆', adopted: false, memo: '少し焦げ感あり。子どもには塩気が強い' },
        { ver: 'Ver.2', cond: '60℃×8h・塩0.5%', cost: '¥254', score: '★★★', adopted: true,  memo: '甘みMAX！サクサク感と色味も最高で本採用候補' }
      ],
      whyList: [
        {
          id: 'why-1',
          problem: '1袋あたりの原価が目標280円ギリギリになってしまう',
          steps: ['クラフト袋＋個包装ラベルの単価が1枚65円かかっている', '最小50枚の小ロットで袋へ直接カラー印刷する見積りだった', '初期版代が1袋あたりに重く乗っている'],
          action: '既製無地クラフト窓袋＋1色耐水シール切替で包材費を42円へ削減！'
        },
        {
          id: 'why-2',
          problem: '梅雨〜夏場にチップスがしんなりしやすい',
          steps: ['開封後にチャックを閉めても湿気が戻りやすい', '乾燥剤（シリカゲル）の容量が30gに対して不足していた'],
          action: '防湿アルミ蒸着クラフト袋＋シリカゲル2gへ変更'
        }
      ],
      fish: {
        man: ['ラベル貼り作業が1人だと1時間50袋が限界'],
        machine: ['低温乾燥機は火・水のみ空き（1回50kgまで）'],
        material: ['完熟度によって水分量が変わり乾燥時間にムラが出る'],
        method: ['スライス厚みを3mmに統一する治具がまだない']
      },
      scamper: [
        { key: 'S 代用', text: '高価な化粧箱 → クラフト帯巻きでコスト60%減' },
        { key: 'C 結合', text: 'ドライトマト × 地元バジルで大人おつまみ版' },
        { key: 'A 応用', text: '砕けた端材はスープの素・トマトパウダーへ転用（廃棄ゼロ）' },
        { key: 'R 逆転', text: '「規格外＝訳あり」ではなく「完熟すぎて出荷不可の幻トマト」訴求' }
      ],
      decision: {
        topic: '初回パッケージ仕様の最終選定',
        candidates: [
          { name: '案A：クラフト窓袋＋シール', taste: 4, cost: 5, look: 4, speed: 5 },
          { name: '案B：全面フルカラー印刷袋', taste: 4, cost: 2, look: 5, speed: 2 },
          { name: '案C：透明チャック袋＋帯紙', taste: 4, cost: 4, look: 4, speed: 4 }
        ]
      },
      swot: {
        s: '糖度高い完熟トマト×低温乾燥設備が車で20分圏内',
        w: '初回小ロットのため包材単価が高くなりやすい',
        o: '関西週末マルシェで500〜800円無添加ギフト需要が1.8倍',
        t: '天候不順による収穫量変動・夏場の湿気劣化'
      },
      risks: [
        { risk: '開封後の湿気・ベタつき', prob: 4, impact: 5, prevent: 'シリカゲル封入＋防湿チャック袋を採用', done: true },
        { risk: '配送中のチップス割れ',   prob: 3, impact: 4, prevent: 'メール便は厚紙ケース・マルシェは手渡し', done: false },
        { risk: '食品表示ラベル記載漏れ', prob: 2, impact: 5, prevent: '加工所の食品衛生責任者と二重チェック', done: false }
      ],
      matrix: {
        now:   ['無地クラフト窓袋＋耐水シール発注（原価-23円）', '賞味期限テスト用サンプル3袋の保管開始'],
        plan:  ['3袋ギフトセット用クラフト帯デザイン作成', '道の駅バイヤーへ試食サンプル持参'],
        quick: ['SNS用の試作タイムラプス動画を15秒撮影'],
        later: ['ふるさと納税返礼品への登録検討']
      },
      legal: DEFAULT_LEGAL_ITEMS.map(x => ({ ...x })),
      promo: {
        copy: '「完熟すぎて市場に出せない、ご褒美トマトチップス。」',
        sns: '試作の乾燥タイムラプス＋農家さんの畑ストーリーを発売7日前から3連投',
        pop: 'マルシェ店頭で1枚試食→「砂糖ゼロ・トマト100%！」の赤POPをアイレベル配置'
      },
      launch: {
        photo: '', comment: '', detailPrice: '1280',
        detailSpec: '30g×3袋セット・完全無添加・賞味期限90日', detailPitch: '',
        channels: ['marche'], externalUrl: ''
      }
    };
    saveRoomProStore();
  }
  return migrateRoomProData(enRoomProStore[labId]);
}

function getAllActiveBoardDefs(d) {
  const builtIns = d.activeTools.map(id => EN_TOOL_CATALOG.find(t => t.id === id)).filter(Boolean);
  const customs = (d.customBoards || []).map(cb => ({ id: cb.id, icon: cb.icon, name: cb.name, cat: 'カスタム', desc: cb.kind, isCustom: true }));
  return [...builtIns, ...customs].sort((a, b) => (d.pinnedTools.includes(b.id) ? 1 : 0) - (d.pinnedTools.includes(a.id) ? 1 : 0));
}

function getBoardItemCount(d, tid) {
  if (tid === 'story') return enViewState.roomBoards[0].items.length + '件';
  if (tid === 'cost') {
    const c = d.cost; const u = Number(c.material)+Number(c.process)+Number(c.pack)+Number(c.ship);
    return (c.price > 0 ? Math.round((u/c.price)*100) : 0) + '%';
  }
  if (tid === 'proto') return d.protos.length + '案';
  if (tid === 'why') return (d.whyList || []).length + '課題';
  if (tid === 'scamper') return d.scamper.length + '案';
  if (tid === 'decision') return d.decision.candidates.length + '案比較';
  if (tid === 'risk') return d.risks.filter(r=>r.done).length + '/' + d.risks.length;
  if (tid === 'legal') return d.legal.filter(l=>l.done).length + '/' + d.legal.length;
  const cb = (d.customBoards || []).find(x => x.id === tid);
  if (cb) return cb.items.length + '件';
  return '入力済';
}

function getLaunchGateStatus(d) {
  const l = d.launch;
  const cPhoto   = !!(l.photo && l.photo.trim());
  const cComment = !!(l.comment && l.comment.trim().length >= 8);
  const cDetail  = !!(l.detailPrice && l.detailSpec.trim() && l.detailPitch.trim());
  const cChannel = !!(l.channels && l.channels.length > 0 && (l.channels.includes('marche') || l.externalUrl.trim()));
  const count = [cPhoto, cComment, cDetail, cChannel].filter(Boolean).length;
  return { cPhoto, cComment, cDetail, cChannel, count, pct: count * 25, ready: count === 4 };
}

function getAiCopilotGuidance(d) {
  const gate = getLaunchGateStatus(d);
  const c = d.cost;
  const u = Number(c.material)+Number(c.process)+Number(c.pack)+Number(c.ship);
  const rate = c.price > 0 ? Math.round((u/c.price)*100) : 100;

  if (rate > 58) return { phase: '原価見直し', msg: `原価率${rate}%！<strong>原価計算</strong>か<strong>なぜなぜ分析</strong>で50%以下を狙おう`, btn: '原価へ', tab: 'board', tool: 'cost' };
  if (d.legal.some(l => !l.done)) return { phase: '表示・法規確認', msg: `<strong>食品表示・法規</strong>の未確認(${d.legal.filter(l=>!l.done).length}件)の中身をチェックしておこう`, btn: '法規へ', tab: 'board', tool: 'legal' };
  if (d.risks.some(r => !r.done)) return { phase: '品質チェック', msg: `<strong>リスク先回り</strong>の未対策(${d.risks.filter(r=>!r.done).length}件)を潰そう`, btn: 'リスクへ', tab: 'board', tool: 'risk' };
  if (!gate.ready) return { phase: `巣立ち ${gate.pct}%`, msg: `あと${4-gate.count}項目で<strong>巣立ち準備OK</strong>！完成写真・詳細・販売先を入れよう`, btn: '巣立ちへ', tab: 'detail', tool: null };
  return { phase: '🎉 巣立ちOK', msg: `全4条件クリア！<strong>マルシェ＆各販路へお披露目</strong>できます！`, btn: 'お披露目', tab: 'detail', tool: null };
}

// =========================================================
// ✨ Pro機能：AI議事録スキャン / 企画書出力 / AIツール補完
// =========================================================
window.openAiTranscriptScan = (labId) => {
  if (!enAiProEnabled) return openProUpsellSheet();
  const lastMsgs = enViewState.roomMessages.slice(-4);
  const combined = lastMsgs.map(m => `${m.sender}: ${m.text}`).join(' / ');
  openEnSheetHtml('✨ AI議事録スキャン（Pro）', '直近トークを解析して各ボード＆タスクへ自動振り分けします', `
    <div class="en-formula"><strong>🔍 解析対象（直近${lastMsgs.length}件）</strong><div class="en-meta">${enEsc(combined)}</div></div>
    <div class="en-formula" style="border-color:var(--en-accent);">
      <div>📌 <strong>ルーム内決定メモ（非公開）：</strong>「冷蔵便で完熟トマト30kg調達→低温乾燥テスト開始」</div>
      <div>✅ <strong>やることリスト：</strong>「ラベル案2パターンの多数決をメンバー全員で締切前に回答」</div>
      <div>🧪 <strong>試作ログ：</strong>「低温60℃・完熟トマト30kg本試作ロット」</div>
    </div>
    <button class="en-act-btn primary" style="justify-content:center;" onclick="applyAiTranscriptScan('${labId}')">⚡ この3件を一括で各ボードへ反映する</button>
  `);
};

window.applyAiTranscriptScan = (labId) => {
  const d = getRoomProData(labId);
  enViewState.roomBoards[0].items.unshift('【AI抽出】冷蔵便で完熟トマト30kg調達→低温乾燥テスト開始');
  enViewState.roomTasks.unshift({ id: 't-ai-' + Date.now(), text: '【AI抽出】ラベル案2パターンの多数決を完了させる', done: false });
  d.protos.push({ ver: `Ver.${d.protos.length+1}`, cond: '本試作30kg・低温60℃乾燥', cost: '¥248', score: '★★★', adopted: false, memo: 'AI議事録より自動登録：山田農園トマト到着分' });
  saveRoomProStore(); closeEnSheet();
  enToast('✨ トークから3件を各ボードへ一括反映しました！');
  renderEnRoomModal();
};

window.openProjectReportSheet = (labId) => {
  const lab = enViewState.labs.find(l => l.id === labId) || enViewState.labs[0];
  const d = getRoomProData(labId);
  const c = d.cost;
  const unitCost = Number(c.material)+Number(c.process)+Number(c.pack)+Number(c.ship);
  const profit = Number(c.price) - unitCost;
  const costRate = c.price > 0 ? Math.round((unitCost / c.price) * 100) : 0;
  const chNames = EN_SALES_CHANNELS.filter(x => d.launch.channels.includes(x.id)).map(x => x.label).join(' / ');

  const report = [
    `====================================`,
    `【EN•joy 商品開発企画書・引き継ぎレポート】`,
    `商品名：${lab.title}`,
    `出力日時：${new Date().toLocaleString('ja-JP')}`,
    `====================================`,
    ``,
    `■ 1. 市場・ターゲット・独自価値`,
    `・ターゲット：${d.market.target}`,
    `・選ばれる理由：${d.market.advantage}`,
    `・キャッチ案：${d.promo.copy}`,
    ``,
    `■ 2. 原価・収益シミュレーション`,
    `・予定売価：¥${c.price} ／ 原価合計：¥${unitCost}（原価率 ${costRate}%）`,
    `・1個粗利：¥${profit} ／ 初回${c.lot}個完売利益：¥${(profit*c.lot - c.fixedCost).toLocaleString()}`,
    ``,
    `■ 3. 採用試作・ルーム内決定メモ（非公開）`,
    ...d.protos.map(p => `・${p.ver} [${p.score}${p.adopted?'・採用':''}] ${p.cond} (${p.cost})：${p.memo}`),
    ...enViewState.roomBoards[0].items.map(s => `・📌 ${s}`),
    ``,
    `■ 4. なぜなぜ分析（根本対策）`,
    ...d.whyList.map((w, i) => `・課題${i+1}：${w.problem} → 対策：${w.action}`),
    ``,
    `■ 5. 食品表示・法規メモ`,
    ...d.legal.map(l => `・[${l.done?'済':'未'}] ${l.label}\n  ${String(l.detail||'').replace(/\n/g,' / ')}`),
    ``,
    `■ 6. 販売先・商品詳細`,
    `・仕様：${d.launch.detailSpec}（¥${d.launch.detailPrice}）`,
    `・販売先：${chNames}${d.launch.externalUrl ? ' / ' + d.launch.externalUrl : ''}`
  ].join('\n');

  openEnSheetHtml('📄 商品企画書レポート（自動生成）', '加工所への見積り・バイヤー提案・チーム共有にそのまま使えます', `
    <pre class="en-report-pre">${enEsc(report)}</pre>
    <button class="en-act-btn primary" style="justify-content:center;" id="enCopyReportBtn">📋 企画書全文をコピーする</button>
  `);
  document.getElementById('enCopyReportBtn').onclick = async () => {
    try { await navigator.clipboard.writeText(report); enToast('📋 商品企画書をコピーしました！'); }
    catch { enToast('コピー完了！'); }
  };
};

function openProUpsellSheet() {
  openEnSheetHtml('✨ EN•ラボ Proモード（実運用プラン）', '商品開発のスピードと成功率を劇的に高めるAI伴走機能', `
    <div class="en-formula">
      <div>🤖 <strong>AI議事録スキャン：</strong>トークから決定事項・タスク・原価を全ボードへ自動振り分け</div>
      <div>🧰 <strong>全14種＋無制限カスタムボード：</strong>各手法をAIが市場データ込みで自動入力</div>
      <div>📄 <strong>商品企画書1タップ出力：</strong>加工所・道の駅バイヤー向け提案書を自動生成</div>
    </div>
    <button class="en-act-btn primary" style="justify-content:center;" onclick="enAiProEnabled=true;closeEnSheet();enToast('✨ ProモードをONにしました！');renderEnRoomModal();">⚡ ProモードをONにして全機能を使う</button>
  `);
}

window.runAiToolAssist = (labId, toolId) => {
  if (!enAiProEnabled) return openProUpsellSheet();
  const d = getRoomProData(labId);

  if (toolId === 'cost') {
    d.cost = { material: 95, process: 68, pack: 36, ship: 32, price: 480, fixedCost: 12000, lot: 100 };
    enToast('🤖 AIが包材＆ロット最適化で原価率48%へ改善案を入力！');
  } else if (toolId === 'market') {
    d.market.target = '枚方・寝屋川・京都の自然派ママ層＋クラフトビール好き30〜50代';
    d.market.advantage = '規格外トマト救済×完全無添加×低温60℃濃縮の濃厚甘み';
    enToast('🤖 AIが昨夜の関西マルシェ分析から市場ポジショニングを更新！');
  } else if (toolId === 'vpc') {
    d.vpc.relievers = 'AI提案：無添加・ノンフライ・原材料「枚方産トマト・塩のみ」の2行表示で安心感MAX';
    d.vpc.creators = 'AI提案：裏面に農家さんの顔写真QRを載せてリピート＆SNSシェア誘発';
    enToast('🤖 AIが顧客価値キャンバス（VPC）を強化しました！');
  } else if (toolId === 'proto') {
    d.protos.push({ ver: `Ver.${d.protos.length+1}`, cond: '60℃×8h・塩0.4%＋地元バジル', cost: '¥258', score: '★★★', adopted: false, memo: 'AI提案：大人おつまみ派生版（客単価+100円狙い）' });
    enToast('🤖 AIが次期A/Bテスト案を追加しました！');
  } else if (toolId === 'why') {
    if (!d.whyList.length) d.whyList.push({ id: 'why-' + Date.now(), problem: '初回小ロットでの認知拡大が弱い', steps: [], action: '' });
    d.whyList[0].steps.push('AI深掘り：初期版代が50袋に対して1袋25円以上乗っているため');
    d.whyList[0].action = 'AI対策：既製窓付きクラフト袋＋耐水クラフトシール（1枚8円）で原価231円へ圧縮！';
    enToast('🤖 AIが1つ目の課題をさらに深掘り＆対策を更新しました！');
  } else if (toolId === 'fish') {
    d.fish.method.push('AI提案：スライサー治具(3mm固定)導入で乾燥ムラを80%削減');
    enToast('🤖 AIが4M1Eに標準化対策を追記しました！');
  } else if (toolId === 'scamper') {
    d.scamper.push({ key: 'E 除去', text: 'AI提案：個包装トレイを省きチャック袋直入れでゴミ＆原価を同時削減' });
    enToast('🤖 AIがSCAMPER差別化案を追加しました！');
  } else if (toolId === 'decision') {
    d.decision.candidates.push({ name: '案D(AI)：既製窓袋＋クラフト帯', taste: 5, cost: 5, look: 5, speed: 5 });
    enToast('🤖 AIがコスパ＆見栄え満点の「案D」を比較表に追加！');
  } else if (toolId === 'swot') {
    d.swot.o += ' ／ 冬の手土産需要で3袋セットが好調';
    enToast('🤖 AIがSWOTの機会を最新トレンドで補完！');
  } else if (toolId === 'risk') {
    d.risks.push({ risk: 'マルシェ当日の試食衛生＆アレルゲン誤認', prob: 3, impact: 5, prevent: 'AI対策：個包装試食カップ＋原材料POP前面掲示', done: false });
    enToast('🤖 AIが見落としがちな販売リスク(FMEA)を追加！');
  } else if (toolId === 'matrix') {
    d.matrix.now.unshift('AI最優先：自然光で完成写真1枚撮影→巣立ちゲート登録');
    enToast('🤖 AIが最優先アクションを追加しました！');
  } else if (toolId === 'legal') {
    d.legal.push({
      id: 'lg-ai-' + Date.now(),
      label: '【AI追加】JANコード・プラ識別マーク＆消費者庁ガイド確認',
      detail: '・道の駅・小売店卸を行う場合はGS1事業者コード(JAN)取得を検討\n・クラフト窓袋（紙＋プラ複合）の識別マーク表記を包材メーカーに確認',
      done: false
    });
    enToast('🤖 AIが見落としがちな法規・識別マーク項目を中身付きで追加しました！');
  } else if (toolId === 'promo') {
    d.promo.copy = 'AI提案：「砂糖ゼロ。なのに、フルーツみたいに甘い枚方トマト。」';
    enToast('🤖 AIがキャッチコピーを提案しました！');
  } else if (toolId === 'launch') {
    if (!d.launch.photo) d.launch.photo = EN_IMAGES.tomato;
    d.launch.comment = '枚方の完熟トマト農家と東大阪の低温乾燥工房がタッグを組み、買い手の「無添加で子どもが喜ぶおやつがほしい！」の声から誕生しました。';
    d.launch.detailPitch = '砂糖・保存料一切不使用。60℃で8時間じっくり乾燥させ、完熟トマト本来の甘みと旨みをサクッと閉じ込めました。';
    if (!d.launch.channels.includes('own_ec')) d.launch.channels.push('own_ec');
    if (!d.launch.externalUrl) d.launch.externalUrl = 'https://yamada-farm.shop / 道の駅枚方直売コーナー';
    enToast('🤖 AIが巣立ち4条件のストーリー＆詳細を自動入力しました！');
  } else {
    const cb = (d.customBoards || []).find(x => x.id === toolId);
    if (cb) { cb.items.push({ text: '【AI提案】次回試作会で買い手モニター3名の感想を数値化して追記', done: false, sub: 'AI伴走' }); enToast(`🤖 AIが「${cb.name}」に提案を追記！`); }
  }
  saveRoomProStore();
  renderEnRoomModal();
};

// =========================================================
// 🗂️ 全ボード一覧ハブ ＆ 🧰 ツール追加・無制限カスタム作成
// =========================================================
window.openBoardHubSheet = (labId) => {
  const d = getRoomProData(labId);
  const allActive = getAllActiveBoardDefs(d);
  const cats = ['all', '企画・戦略', '経営・試作', '発想・解決', '品質・販路', 'カスタム'];
  const q = enHubSearchQuery.trim();
  const filtered = allActive.filter(b => (enHubCatFilter === 'all' || b.cat === enHubCatFilter) && (!q || (b.name + b.cat + (b.desc || '')).includes(q)));

  openEnSheetHtml(`🗂️ 開発ボード一覧（使用中 ${allActive.length}個）`, '検索＆📌ピン留めで何十個になっても1秒ジャンプ', `
    <input id="enHubSearchIn" class="en-input-field" type="search" value="${enEsc(enHubSearchQuery)}" placeholder="🔍 ボード名で検索（例：原価、法規、なぜなぜ）">
    <div class="en-chip-row">${cats.map(c => `<button class="en-tag-chip ${enHubCatFilter===c?'active':''}" data-hubcat="${c}">${c==='all'?'すべて':c}</button>`).join('')}</div>
    <div class="en-hub-grid">
      ${filtered.map(b => {
        const isPin = d.pinnedTools.includes(b.id);
        return `
          <div class="en-hub-card ${d.selectedTool===b.id?'active':''}" data-hubpick="${b.id}">
            <button class="en-hub-pin ${isPin?'on':''}" data-hubpin="${b.id}" title="上部にピン留め">📌</button>
            <div style="font-size:18px;">${b.icon}</div>
            <div class="en-title" style="font-size:12.5px;padding-right:18px;">${enEsc(b.name)}</div>
            <div class="en-between"><span class="en-meta" style="font-size:10px;">${b.cat}</span><span class="en-pill" style="font-size:9.5px;padding:1.5px 6px;">${getBoardItemCount(d, b.id)}</span></div>
          </div>
        `;
      }).join('')}
    </div>
    <div class="en-actions" style="border:none;padding-top:4px;">
      <button class="en-act-btn primary" style="flex:1;justify-content:center;" onclick="openToolPickerSheet('${labId}')">＋ ツール追加 / 自由作成</button>
      <button class="en-act-btn" style="justify-content:center;" onclick="openProjectReportSheet('${labId}')">📄 企画書出力</button>
    </div>
  `);

  const sIn = document.getElementById('enHubSearchIn');
  if (sIn) sIn.oninput = e => { enHubSearchQuery = e.target.value; openBoardHubSheet(labId); document.getElementById('enHubSearchIn')?.focus(); };
  document.querySelectorAll('[data-hubcat]').forEach(btn => btn.onclick = () => { enHubCatFilter = btn.getAttribute('data-hubcat'); openBoardHubSheet(labId); });
  document.querySelectorAll('[data-hubpin]').forEach(btn => btn.onclick = e => {
    e.stopPropagation();
    const tid = btn.getAttribute('data-hubpin');
    if (d.pinnedTools.includes(tid)) d.pinnedTools = d.pinnedTools.filter(x => x !== tid);
    else d.pinnedTools.unshift(tid);
    saveRoomProStore(); renderEnRoomModal(); openBoardHubSheet(labId);
  });
  document.querySelectorAll('[data-hubpick]').forEach(card => card.onclick = () => {
    d.selectedTool = card.getAttribute('data-hubpick');
    saveRoomProStore(); closeEnSheet(); renderEnRoomModal();
  });
};

window.openToolPickerSheet = (labId) => {
  const d = getRoomProData(labId);
  openEnSheetHtml('🧰 ボードを追加・無制限カスタム作成', 'プロ手法(14種)もオリジナルボードも何個でも追加できます', `
    <div class="en-sec-title" style="color:var(--en-muted);margin:0;">📝 オリジナル自由ボードを新規作成</div>
    <div class="en-form-box">
      <div class="en-row">
        <input id="enNewCbIcon" class="en-input-field" style="width:52px;text-align:center;" value="📝">
        <input id="enNewCbName" class="en-input-field" style="flex:1;" placeholder="ボード名（例：包材業者比較・試食会メモ）">
      </div>
      <div class="en-row">
        <select id="enNewCbKind" class="en-input-field" style="flex:1;">
          <option value="memo">📄 メモ・議事録型</option>
          <option value="check">☑️ チェックリスト型</option>
          <option value="table">⚖️ 2列比較（項目×内容）型</option>
        </select>
        <button class="en-act-btn primary" id="enCreateCbBtn">作成して開く</button>
      </div>
    </div>
    <div class="en-sec-title" style="color:var(--en-muted);margin:4px 0 0;">📦 目的別パック（1タップ一括導入）</div>
    <div class="en-chip-row">${EN_TOOL_PACKS.map(pk => `<button class="en-tag-chip" data-packid="${pk.id}">${pk.label}</button>`).join('')}</div>
    <div class="en-sec-title" style="color:var(--en-muted);margin:4px 0 0;">🧰 本格開発＆問題解決ツール（全14種）</div>
    ${EN_TOOL_CATALOG.map(t => {
      const active = d.activeTools.includes(t.id);
      return `
        <button class="en-sheet-item" onclick="toggleRoomTool('${labId}','${t.id}')">
          <span>${t.icon} <strong>${t.name}</strong> <span class="en-pill" style="font-size:9px;margin-left:4px;">${t.cat}</span><br><small class="en-meta">${t.desc}</small></span>
          <span class="en-pill" style="${active ? 'background:var(--en-accent);color:#fff;' : ''}">${active ? '✓ 使用中' : '＋ 追加'}</span>
        </button>
      `;
    }).join('')}
  `);

  document.getElementById('enCreateCbBtn').onclick = () => {
    const icon = document.getElementById('enNewCbIcon').value.trim() || '📝';
    const name = document.getElementById('enNewCbName').value.trim();
    const kind = document.getElementById('enNewCbKind').value;
    if (!name) return enToast('⚠️ ボード名を入力してください');
    const id = 'cb-' + Date.now();
    d.customBoards.push({ id, icon, name, cat: 'カスタム', kind, items: [] });
    d.pinnedTools.unshift(id); d.selectedTool = id;
    saveRoomProStore(); closeEnSheet(); renderEnRoomModal();
    enToast(`✨ カスタムボード「${name}」を作成しました！`);
  };
  document.querySelectorAll('[data-packid]').forEach(btn => btn.onclick = () => {
    const pk = EN_TOOL_PACKS.find(x => x.id === btn.getAttribute('data-packid'));
    pk.tools.forEach(tid => { if (!d.activeTools.includes(tid)) d.activeTools.push(tid); });
    saveRoomProStore(); closeEnSheet(); renderEnRoomModal();
    enToast(`📦 ${pk.label}を一括導入しました！`);
  });
};

window.toggleRoomTool = (labId, toolId) => {
  const d = getRoomProData(labId);
  if (toolId === 'story') return enToast('📌 ルーム内決定メモ（非公開）は基本ボードです');
  if (d.activeTools.includes(toolId)) {
    d.activeTools = d.activeTools.filter(x => x !== toolId);
    if (d.selectedTool === toolId) d.selectedTool = d.activeTools[0] || 'story';
  } else {
    d.activeTools.push(toolId); d.selectedTool = toolId;
    enToast(`🧰 「${EN_TOOL_CATALOG.find(t=>t.id===toolId).name}」を追加しました！`);
  }
  saveRoomProStore(); renderEnRoomModal(); openToolPickerSheet(labId);
};

function updateCostKpiDom(d) {
  const c = d.cost;
  const u = Number(c.material)+Number(c.process)+Number(c.pack)+Number(c.ship);
  const profit = Number(c.price) - u;
  const rate = c.price > 0 ? Math.round((u / c.price) * 100) : 0;
  const bep = profit > 0 ? Math.ceil(Number(c.fixedCost) / profit) + '個' : '赤字';
  const lotProfit = profit * Number(c.lot) - Number(c.fixedCost);
  const setT = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setT('enKpiRate', `${rate}%`); setT('enKpiProfit', `¥${profit}`); setT('enKpiBep', bep);
  setT('enKpiLot', `${lotProfit >= 0 ? '+' : ''}¥${lotProfit.toLocaleString()}`);
  setT('enChDirect', `¥${profit}`); setT('enChEc', `¥${Math.round(c.price * 0.9 - u)}`); setT('enChWholesale', `¥${Math.round(c.price * 0.65 - u)}`);
}

// =========================================================
// 🧰 全14種＋カスタムボード描画（矛盾ゼロ・構造化入力・全削除対応）
// =========================================================
function renderSelectedToolBody(labId, d) {
  const tid = d.selectedTool;
  const isPinned = d.pinnedTools.includes(tid);
  const aiBtn = `<button class="en-pro-pill ${enAiProEnabled?'':'off'}" onclick="runAiToolAssist('${labId}','${tid}')">✨ AI補完 ${enAiProEnabled?'(Pro)':'🔒'}</button>`;
  const pinBtn = `<button class="en-act-btn" style="padding:4px 8px;font-size:11px;" onclick="togglePinCurrent('${labId}','${tid}')">${isPinned?'📌 固定中':'📌 固定'}</button>`;

  if (tid === 'story') {
    const items = enViewState.roomBoards[0].items;
    return `
      <div class="card en-card">
        <div class="en-between"><div class="en-title">📌 ルーム内決定メモ（非公開）</div><div class="en-row">${pinBtn}</div></div>
        ${items.length ? items.map((it, i) => `
          <div class="en-formula en-list-row-del">
            <span>📌 ${enEsc(it)}</span>
            <button type="button" class="en-del-x" data-delstory="${i}" title="削除">✕</button>
          </div>
        `).join('') : '<div class="en-meta">まだ記録がありません</div>'}
        <div class="en-row"><input id="enProStoryIn" class="en-input-field" placeholder="決まったこと・誕生エピソードを追加..."><button class="en-act-btn primary" id="enProStoryAdd">追加</button></div>
      </div>
    `;
  }

  if (tid === 'cost') {
    const c = d.cost;
    const u = Number(c.material)+Number(c.process)+Number(c.pack)+Number(c.ship);
    const profit = Number(c.price) - u;
    const rate = c.price > 0 ? Math.round((u / c.price) * 100) : 0;
    const bep = profit > 0 ? Math.ceil(Number(c.fixedCost) / profit) + '個' : '赤字';
    const lotProfit = profit * Number(c.lot) - Number(c.fixedCost);
    const cls = rate <= 50 ? 'good' : rate <= 65 ? 'warn' : 'bad';

    return `
      <div class="card en-card">
        <div class="en-between"><div class="en-title">💰 原価・販路別粗利計算</div><div class="en-row">${pinBtn}${aiBtn}</div></div>
        <div class="en-kpi-grid">
          <div class="en-kpi-box ${cls}"><small>原価率</small><strong id="enKpiRate">${rate}%</strong></div>
          <div class="en-kpi-box ${profit>0?'good':'bad'}"><small>直販1個粗利</small><strong id="enKpiProfit">¥${profit}</strong></div>
          <div class="en-kpi-box"><small>損益分岐点</small><strong id="enKpiBep">${bep}</strong></div>
        </div>
        <div class="en-channel-profit-grid">
          <div class="en-ch-profit-box"><span>🎪 マルシェ直販</span><strong id="enChDirect" style="color:#10b981;">¥${profit}</strong></div>
          <div class="en-ch-profit-box"><span>🌐 EC(手数料10%)</span><strong id="enChEc" style="color:var(--en-accent);">¥${Math.round(c.price*0.9 - u)}</strong></div>
          <div class="en-ch-profit-box"><span>🏬 卸売(掛率65%)</span><strong id="enChWholesale">¥${Math.round(c.price*0.65 - u)}</strong></div>
        </div>
        <div class="en-formula" style="flex-direction:row;justify-content:space-between;align-items:center;">
          <span>📦 ${c.lot}個完売時の手残り（固定費差引）</span>
          <strong id="enKpiLot" style="font-size:14px;color:${lotProfit>=0?'#10b981':'#ef4444'};">${lotProfit>=0?'+':''}¥${lotProfit.toLocaleString()}</strong>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          ${[['price','🏷️ 販売予定価格（税込）'],['material','🌾 原材料費（1個）'],['process','🏭 加工・乾燥委託費'],['pack','📦 袋・ラベル・乾燥剤'],['ship','🚚 配送・資材雑費'],['fixedCost','🖨️ 初期固定費（版代等）'],['lot','🔢 製造予定数（個）']].map(([k, lbl]) => `
            <div class="en-cost-row"><span>${lbl}</span><input class="en-cost-input" type="number" data-costkey="${k}" value="${c[k]}"></div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (tid === 'market') {
    const m = d.market;
    return `
      <div class="card en-card">
        <div class="en-between"><div class="en-title">📊 市場・ポジショニング</div><div class="en-row">${pinBtn}${aiBtn}</div></div>
        ${[['target','🎯 ターゲット'],['competitor','🔍 競合・代替品'],['advantage','✨ うちが選ばれる理由'],['priceRange','💴 許容価格帯']].map(([k, lbl]) => `
          <div><div class="en-meta" style="font-weight:800;margin-bottom:3px;">${lbl}</div><input class="en-input-field" data-mktkey="${k}" value="${enEsc(m[k])}"></div>
        `).join('')}
      </div>
    `;
  }

  if (tid === 'vpc') {
    const v = d.vpc;
    return `
      <div class="card en-card">
        <div class="en-between"><div class="en-title">👤 顧客価値キャンバス(VPC)</div><div class="en-row">${pinBtn}${aiBtn}</div></div>
        <div class="en-quad-grid">
          <div class="en-quad-box"><strong>😣 買い手の悩み</strong><textarea class="en-input-field" rows="3" data-vpckey="pains">${enEsc(v.pains)}</textarea></div>
          <div class="en-quad-box"><strong>✨ 欲しい未来</strong><textarea class="en-input-field" rows="3" data-vpckey="gains">${enEsc(v.gains)}</textarea></div>
          <div class="en-quad-box"><strong>💊 悩みの解決策</strong><textarea class="en-input-field" rows="3" data-vpckey="relievers">${enEsc(v.relievers)}</textarea></div>
          <div class="en-quad-box"><strong>🎁 喜びを生む仕掛け</strong><textarea class="en-input-field" rows="3" data-vpckey="creators">${enEsc(v.creators)}</textarea></div>
        </div>
      </div>
    `;
  }

  // 🧪 試作A/B比較表（2段構造に完全対応した4項目入力＋個別削除）
  if (tid === 'proto') {
    return `
      <div class="card en-card">
        <div class="en-between"><div class="en-title">🧪 試作A/Bテスト比較表（${d.protos.length}案）</div><div class="en-row">${pinBtn}${aiBtn}</div></div>
        ${d.protos.length ? d.protos.map((p, i) => `
          <div class="en-proto-card" style="${p.adopted?'border-left-color:#10b981;':''}">
            <div class="en-between">
              <strong>${enEsc(p.ver)}｜${enEsc(p.cond)}</strong>
              <span class="en-row" style="gap:4px;">
                <span class="en-meta">${enEsc(p.cost||'')}</span>
                <span class="en-pill">${p.score}</span>
                <button type="button" class="en-del-x" data-delproto="${i}" title="この試作を削除">🗑️</button>
              </span>
            </div>
            <div class="en-text" style="font-size:12.5px;">${enEsc(p.memo)}</div>
            <div class="en-between" style="margin-top:3px;">
              <button class="en-act-btn" style="padding:3px 9px;font-size:11px;" onclick="toggleProtoAdopt('${labId}',${i})">${p.adopted?'✅ 本採用中':'採用候補にする'}</button>
              <button class="en-act-btn" style="padding:3px 9px;font-size:11px;" onclick="sendMsgToBoard('【試作採用】${enEsc(p.ver)} ${enEsc(p.cond)}')">📌 決定メモへ</button>
            </div>
          </div>
        `).join('') : '<div class="en-meta">試作ログがありません。下から記録してください。</div>'}

        <div class="en-form-box">
          <div class="en-meta" style="font-weight:800;">＋ 新しい試作パターンを記録（2段フル入力）</div>
          <div class="en-form-grid-3">
            <input id="enProtoCondIn" class="en-input-field" placeholder="条件・配合（例：60℃×7h・塩0.5%）">
            <input id="enProtoCostIn" class="en-input-field" placeholder="原価（例：¥250）">
            <select id="enProtoScoreIn" class="en-input-field">
              <option value="★★★">★★★ 最高</option>
              <option value="★★☆" selected>★★☆ 良い</option>
              <option value="★☆☆">★☆☆ 要改善</option>
            </select>
          </div>
          <div class="en-row">
            <input id="enProtoMemoIn" class="en-input-field" placeholder="味・食感・見た目・次への改善メモ">
            <button class="en-act-btn primary" id="enProtoAdd">🧪 記録追加</button>
          </div>
        </div>
      </div>
    `;
  }

  // ❓ なぜなぜ分析（複数課題対応＋各Wステップ削除＋課題ごと削除＋直接編集）
  if (tid === 'why') {
    return `
      <div class="card en-card">
        <div class="en-between">
          <div class="en-title">❓ なぜなぜ分析（${d.whyList.length}課題）</div>
          <div class="en-row">${pinBtn}${aiBtn}</div>
        </div>

        ${d.whyList.map((w, wi) => `
          <div class="en-why-card">
            <div class="en-between" style="gap:6px;">
              <span class="en-pill">🎯 課題 #${wi + 1}</span>
              <input class="en-input-field" style="flex:1;font-weight:800;" data-whyprob="${wi}" value="${enEsc(w.problem)}" placeholder="解決したい課題を入力">
              <button type="button" class="en-del-x" data-delwhycard="${wi}" title="この課題を削除">🗑️</button>
            </div>

            <div style="display:flex;flex-direction:column;gap:5px;">
              ${w.steps.map((s, si) => `
                <div class="en-why-step">
                  <span class="en-why-num">W${si+1}</span>
                  <span>${enEsc(s)}</span>
                  <button type="button" class="en-del-x" data-delwhystep="${wi}:${si}" title="削除">✕</button>
                </div>
              `).join('')}
            </div>

            <div class="en-row">
              <input class="en-input-field" data-whystepin="${wi}" placeholder="さらに「なぜ？」を深掘り追加...">
              <button type="button" class="en-act-btn" data-addwhystep="${wi}">＋ 深掘り</button>
            </div>

            <div class="en-formula" style="background:rgba(16,185,129,0.1);border-color:rgba(16,185,129,0.35);gap:6px;">
              <div class="en-between">
                <strong style="color:#10b981;">✅ 根本対策</strong>
                <button type="button" class="en-act-btn" style="padding:3px 9px;font-size:11px;" data-whytotask="${wi}">✅ やることへ送る</button>
              </div>
              <input class="en-input-field" data-whyact="${wi}" value="${enEsc(w.action)}" placeholder="導き出した具体的な解決策を入力...">
            </div>
          </div>
        `).join('')}

        <div class="en-form-box">
          <div class="en-meta" style="font-weight:800;">＋ 新しい課題のなぜなぜ分析を追加</div>
          <div class="en-row">
            <input id="enNewWhyProbIn" class="en-input-field" placeholder="例：マルシェで足を止めてもらえない / 割れが多い">
            <button type="button" class="en-act-btn primary" id="enNewWhyAddBtn">＋ 課題追加</button>
          </div>
        </div>
      </div>
    `;
  }

  // 🐟 特性要因図 4M1E（全項目削除対応）
  if (tid === 'fish') {
    const f = d.fish;
    return `
      <div class="card en-card">
        <div class="en-between"><div class="en-title">🐟 特性要因図（4M1E分析）</div><div class="en-row">${pinBtn}${aiBtn}</div></div>
        <div class="en-quad-grid">
          ${[['man','👤 人（作業・スキル）'],['machine','⚙️ 設備・機械'],['material','🌾 材料・包材'],['method','📐 方法・手順']].map(([k, lbl]) => `
            <div class="en-quad-box">
              <strong>${lbl}</strong>
              ${f[k].map((x, i) => `<div class="en-list-row-del"><span>・${enEsc(x)}</span><button type="button" class="en-del-x" data-delfish="${k}:${i}">✕</button></div>`).join('')}
            </div>
          `).join('')}
        </div>
        <div class="en-row">
          <select id="enFishCat" class="en-input-field" style="width:92px;"><option value="man">人</option><option value="machine">設備</option><option value="material">材料</option><option value="method">方法</option></select>
          <input id="enFishIn" class="en-input-field" placeholder="原因メモを追加...">
          <button class="en-act-btn primary" id="enFishAdd">追加</button>
        </div>
      </div>
    `;
  }

  // ⚖️ 重み付け意思決定（議題編集＋案の追加＆削除）
  if (tid === 'decision') {
    const dec = d.decision;
    const totals = dec.candidates.map(c => c.taste * 2 + c.cost * 2 + c.look + c.speed);
    const maxScore = totals.length ? Math.max(...totals) : 0;
    return `
      <div class="card en-card">
        <div class="en-between"><div class="en-title">⚖️ 重み付け意思決定（味×2・原価×2）</div><div class="en-row">${pinBtn}${aiBtn}</div></div>
        <input class="en-input-field" id="enDecTopicIn" value="${enEsc(dec.topic)}" placeholder="比較したいテーマ">
        ${dec.candidates.map((c, idx) => {
          const sc = totals[idx];
          const win = sc === maxScore && totals.length > 0;
          return `
            <div class="en-score-row ${win?'winner':''}">
              <div class="en-between">
                <strong>${win?'🏆 ':''}${enEsc(c.name)}</strong>
                <span class="en-row" style="gap:4px;"><span class="en-pill">${sc} / 30点</span><button type="button" class="en-del-x" data-deldec="${idx}">🗑️</button></span>
              </div>
              <div class="en-score-sliders">
                <label>味/品質 <input type="range" min="1" max="5" value="${c.taste}" data-decidx="${idx}" data-deckey="taste"></label>
                <label>原価◎ <input type="range" min="1" max="5" value="${c.cost}" data-decidx="${idx}" data-deckey="cost"></label>
                <label>見た目 <input type="range" min="1" max="5" value="${c.look}" data-decidx="${idx}" data-deckey="look"></label>
                <label>速さ <input type="range" min="1" max="5" value="${c.speed}" data-decidx="${idx}" data-deckey="speed"></label>
              </div>
            </div>
          `;
        }).join('')}
        <div class="en-row">
          <input id="enDecCandIn" class="en-input-field" placeholder="新しい比較案を追加（例：案D 紙箱タイプ）">
          <button class="en-act-btn primary" id="enDecCandAdd">＋ 案を追加</button>
        </div>
      </div>
    `;
  }

  // 💡 SCAMPER発想（7切り口選択＋内容入力＋削除）
  if (tid === 'scamper') {
    return `
      <div class="card en-card">
        <div class="en-between"><div class="en-title">💡 SCAMPER発想ボード</div><div class="en-row">${pinBtn}${aiBtn}</div></div>
        ${d.scamper.map((s, i) => `
          <div class="en-formula">
            <div class="en-between"><strong style="color:var(--en-accent);">${enEsc(s.key)}</strong><button type="button" class="en-del-x" data-delscamp="${i}">✕</button></div>
            <div>${enEsc(s.text)}</div>
          </div>
        `).join('')}
        <div class="en-row">
          <select id="enScampKey" class="en-input-field" style="width:108px;">
            <option value="S 代用">S 代用</option><option value="C 結合">C 結合</option><option value="A 応用">A 応用</option>
            <option value="M 変更">M 変更</option><option value="P 転用">P 転用</option><option value="E 除去">E 除去</option>
            <option value="R 逆転">R 逆転</option><option value="✨ 自由">✨ 自由</option>
          </select>
          <input id="enScampIn" class="en-input-field" placeholder="切り口アイデアを追加...">
          <button class="en-act-btn primary" id="enScampAdd">追加</button>
        </div>
      </div>
    `;
  }

  if (tid === 'swot') {
    const sw = d.swot;
    return `
      <div class="card en-card">
        <div class="en-between"><div class="en-title">🧭 SWOTクロス戦略</div><div class="en-row">${pinBtn}${aiBtn}</div></div>
        <div class="en-quad-grid">
          <div class="en-quad-box"><strong>💪 強み (S)</strong><textarea class="en-input-field" rows="2" data-swotkey="s">${enEsc(sw.s)}</textarea></div>
          <div class="en-quad-box"><strong>⚠️ 弱み (W)</strong><textarea class="en-input-field" rows="2" data-swotkey="w">${enEsc(sw.w)}</textarea></div>
          <div class="en-quad-box"><strong>🌟 機会 (O)</strong><textarea class="en-input-field" rows="2" data-swotkey="o">${enEsc(sw.o)}</textarea></div>
          <div class="en-quad-box"><strong>🌪️ 脅威 (T)</strong><textarea class="en-input-field" rows="2" data-swotkey="t">${enEsc(sw.t)}</textarea></div>
        </div>
      </div>
    `;
  }

  // 🛡️ リスク先回り(FMEA)（構造化追加フォーム＋個別削除）
  if (tid === 'risk') {
    return `
      <div class="card en-card">
        <div class="en-between"><div class="en-title">🛡️ リスク先回り（FMEA点数化）</div><div class="en-row">${pinBtn}${aiBtn}</div></div>
        ${d.risks.map((r, i) => {
          const score = (r.prob || 3) * (r.impact || 4);
          return `
            <div class="en-formula" style="${r.done?'opacity:0.58;':''}">
              <div class="en-between">
                <label class="en-row" style="cursor:pointer;gap:7px;"><input type="checkbox" ${r.done?'checked':''} data-riskck="${i}"> <strong>${enEsc(r.risk)}</strong></label>
                <span class="en-row" style="gap:4px;">
                  <span class="en-pill" style="${score>=15?'background:rgba(239,68,68,0.16);color:#ef4444;':''}">危険度 ${score}点</span>
                  <button type="button" class="en-del-x" data-delrisk="${i}">🗑️</button>
                </span>
              </div>
              <div class="en-meta">対策：${enEsc(r.prevent)}</div>
            </div>
          `;
        }).join('')}
        <div class="en-form-box">
          <div class="en-meta" style="font-weight:800;">＋ 想定リスクと予防対策を追加</div>
          <div class="en-form-grid-3">
            <input id="enRiskNameIn" class="en-input-field" placeholder="リスク内容（例：夏場の変色）">
            <select id="enRiskProbIn" class="en-input-field"><option value="5">発生:5(高)</option><option value="4">発生:4</option><option value="3" selected>発生:3(中)</option><option value="2">発生:2</option><option value="1">発生:1(低)</option></select>
            <select id="enRiskImpIn" class="en-input-field"><option value="5" selected>重大:5(大)</option><option value="4">重大:4</option><option value="3">重大:3</option><option value="2">重大:2</option><option value="1">重大:1</option></select>
          </div>
          <div class="en-row">
            <input id="enRiskPrevIn" class="en-input-field" placeholder="予防・回避策（例：遮光アルミ袋を採用）">
            <button type="button" class="en-act-btn primary" id="enRiskAdd">＋ 追加</button>
          </div>
        </div>
      </div>
    `;
  }

  // 🎯 優先順位マトリクス（4象限選択追加＋個別削除）
  if (tid === 'matrix') {
    const mx = d.matrix;
    const cols = [['now','🔥 今すぐやる',true],['plan','📅 計画する',false],['quick','⚡ スキマで',false],['later','💤 後回し',false]];
    return `
      <div class="card en-card">
        <div class="en-between"><div class="en-title">🎯 優先順位マトリクス</div><div class="en-row">${pinBtn}${aiBtn}</div></div>
        <div class="en-matrix-grid">
          ${cols.map(([k, lbl, isTop]) => `
            <div class="en-matrix-cell ${isTop?'top':''}">
              <strong>${lbl}</strong>
              ${mx[k].map((x, i) => `<div class="en-list-row-del"><span>・${enEsc(x)}</span><button type="button" class="en-del-x" data-delmx="${k}:${i}">✕</button></div>`).join('')}
            </div>
          `).join('')}
        </div>
        <div class="en-row">
          <select id="enMxQuad" class="en-input-field" style="width:125px;"><option value="now">🔥 今すぐやる</option><option value="plan">📅 計画する</option><option value="quick">⚡ スキマで</option><option value="later">💤 後回し</option></select>
          <input id="enMxIn" class="en-input-field" placeholder="項目を追加...">
          <button class="en-act-btn primary" id="enMxAdd">追加</button>
        </div>
      </div>
    `;
  }

  // 📋 食品表示・法規＆小ロット確認（中身常時表示＆直接編集＋自由追加＋削除！）
  if (tid === 'legal') {
    const doneCnt = d.legal.filter(x => x.done).length;
    return `
      <div class="card en-card">
        <div class="en-between">
          <div class="en-title">📋 食品表示・法規メモ（${doneCnt}/${d.legal.length} 確認済）</div>
          <div class="en-row">${pinBtn}${aiBtn}</div>
        </div>
        <div class="en-meta">表示文言・アレルゲン・成分値・許可根拠など「実際の中身」をここで直接編集＆確認できます</div>

        ${d.legal.map((item, i) => `
          <div class="en-legal-card ${item.done ? 'is-done' : ''}">
            <div class="en-legal-head">
              <label class="en-legal-check-lbl">
                <input type="checkbox" ${item.done ? 'checked' : ''} data-legalck="${i}">
                <span style="${item.done ? 'color:#10b981;' : ''}">${enEsc(item.label)}</span>
              </label>
              <span class="en-row" style="gap:4px;">
                <span class="en-pill" style="${item.done ? 'background:rgba(16,185,129,0.16);color:#10b981;' : ''}">${item.done ? '確認済' : '要確認'}</span>
                <button type="button" class="en-del-x" data-dellegal="${i}" title="この項目を削除">🗑️</button>
              </span>
            </div>
            <textarea class="en-legal-detail-in" rows="3" data-legaldetail="${i}" placeholder="ここに実際の一括表示文言・成分値・確認先メモを記入...">${enEsc(item.detail || '')}</textarea>
          </div>
        `).join('')}

        <div class="en-form-box">
          <div class="en-meta" style="font-weight:800;">＋ 法規・表示の確認項目を自由に追加</div>
          <input id="enLegalTitleIn" class="en-input-field" placeholder="項目名（例：冷凍便の温度帯表記 / 保健所相談ログ / 有機JAS確認）">
          <textarea id="enLegalDetailIn" class="en-input-field" rows="2" placeholder="中身・下書き・確認メモ（任意・あとから編集もOK）"></textarea>
          <button type="button" class="en-act-btn primary" style="align-self:flex-end;" id="enLegalAddBtn">＋ 項目を追加</button>
        </div>
      </div>
    `;
  }

  if (tid === 'promo') {
    const p = d.promo;
    return `
      <div class="card en-card">
        <div class="en-between"><div class="en-title">📣 販促・パッケージ計画</div><div class="en-row">${pinBtn}${aiBtn}</div></div>
        ${[['copy','✨ キャッチコピー'],['sns','📱 SNS告知スケジュール'],['pop','🏪 店頭POP・試食動線']].map(([k, lbl]) => `
          <div><div class="en-meta" style="font-weight:800;margin-bottom:3px;">${lbl}</div><textarea class="en-input-field" rows="2" data-promokey="${k}">${enEsc(p[k])}</textarea></div>
        `).join('')}
      </div>
    `;
  }

  // 📝 無制限カスタムボード（全項目削除＋ボード自体削除対応）
  const cb = (d.customBoards || []).find(x => x.id === tid);
  if (cb) {
    return `
      <div class="card en-card">
        <div class="en-between">
          <div class="en-title">${cb.icon} ${enEsc(cb.name)}</div>
          <div class="en-row">${pinBtn}${aiBtn}<button type="button" class="en-del-x" id="enDelCustomBoardBtn" title="このカスタムボードを削除">🗑️</button></div>
        </div>
        ${cb.items.length === 0 ? '<div class="en-meta">最初の項目を追加するか「✨ AI補完」を押してみてください！</div>' : cb.items.map((it, i) => `
          ${cb.kind === 'check' ? `
            <div class="en-between"><label class="en-row" style="cursor:pointer;font-size:13px;${it.done?'text-decoration:line-through;opacity:0.55;':''}"><input type="checkbox" ${it.done?'checked':''} data-cbck="${i}"> <span>${enEsc(it.text)}</span></label><button type="button" class="en-del-x" data-delcbitem="${i}">✕</button></div>
          ` : cb.kind === 'table' ? `
            <div class="en-formula" style="flex-direction:row;justify-content:space-between;align-items:center;"><strong>${enEsc(it.text)}</strong><span class="en-row" style="gap:6px;"><span>${enEsc(it.sub || '')}</span><button type="button" class="en-del-x" data-delcbitem="${i}">✕</button></span></div>
          ` : `<div class="en-formula en-list-row-del"><span>📝 ${enEsc(it.text)}</span><button type="button" class="en-del-x" data-delcbitem="${i}">✕</button></div>`}
        `).join('')}
        <div class="en-row">
          <input id="enCbIn" class="en-input-field" placeholder="${cb.kind==='table'?'項目名（例：A社見積り）':'メモ・項目を追加...'}">
          ${cb.kind==='table' ? `<input id="enCbSubIn" class="en-input-field" style="width:120px;" placeholder="値・価格">` : ''}
          <button class="en-act-btn primary" id="enCbAdd">追加</button>
        </div>
      </div>
    `;
  }
  return '';
}

window.togglePinCurrent = (labId, tid) => {
  const d = getRoomProData(labId);
  if (d.pinnedTools.includes(tid)) { d.pinnedTools = d.pinnedTools.filter(x => x !== tid); enToast('📌 ピン留め解除'); }
  else { d.pinnedTools.unshift(tid); enToast('📌 上部バーの先頭にピン留めしました！'); }
  saveRoomProStore(); renderEnRoomModal();
};
window.toggleProtoAdopt = (labId, idx) => {
  const d = getRoomProData(labId);
  d.protos.forEach((p, i) => p.adopted = (i === idx ? !p.adopted : false));
  saveRoomProStore(); renderEnRoomModal();
};

// =========================================================
// 🎉 巣立ちゲート
// =========================================================
function renderLaunchGateCard(lab, d) {
  const gate = getLaunchGateStatus(d);
  const l = d.launch;
  return `
    <div class="card en-card" style="border:1.5px solid var(--en-accent) !important;">
      <div class="en-between">
        <div class="en-title">🎉 巣立ち準備ゲート</div>
        <button class="en-pro-pill ${enAiProEnabled?'':'off'}" onclick="runAiToolAssist('${lab.id}','launch')">✨ AIに紹介文を書かせる</button>
      </div>
      <div class="en-gate-progress">
        <div class="en-gate-track"><div class="en-gate-fill" style="width:${gate.pct}%"></div></div>
        <strong style="font-size:12.5px;color:var(--en-accent);">${gate.pct}%</strong>
      </div>
      <div class="en-gate-check-row">
        <div class="en-gate-chip ${gate.cPhoto?'ok':''}">${gate.cPhoto?'✅':'⬜'} ① 完成写真(1枚)</div>
        <div class="en-gate-chip ${gate.cComment?'ok':''}">${gate.cComment?'✅':'⬜'} ② 開発コメント</div>
        <div class="en-gate-chip ${gate.cDetail?'ok':''}">${gate.cDetail?'✅':'⬜'} ③ 商品詳細</div>
        <div class="en-gate-chip ${gate.cChannel?'ok':''}">${gate.cChannel?'✅':'⬜'} ④ 販売先設定</div>
      </div>

      <div>
        <div class="en-meta" style="font-weight:800;margin-bottom:4px;">① 完成写真（1枚必須）</div>
        <label class="en-photo-drop" for="enLaunchPhotoFile">
          ${l.photo ? `<img src="${l.photo}" alt="">` : `<span>📷 タップして完成写真をアップロード</span><small>または下のサンプル写真を使用</small>`}
        </label>
        <input id="enLaunchPhotoFile" type="file" accept="image/*" style="display:none;">
        ${!l.photo ? `<button class="en-act-btn" style="margin-top:5px;font-size:11px;" id="enUseSamplePhotoBtn">🖼️ テスト用完成写真をセット</button>` : ''}
      </div>

      <div>
        <div class="en-meta" style="font-weight:800;margin-bottom:3px;">② 開発コメント・ストーリー（8文字以上）</div>
        <textarea id="enLaunchComment" class="en-input-field" rows="2" placeholder="例：枚方の完熟トマトと東大阪の加工技術が繋がり誕生！">${enEsc(l.comment)}</textarea>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1.6fr;gap:6px;">
        <div><div class="en-meta" style="font-weight:800;margin-bottom:3px;">③ 価格（円）</div><input id="enLaunchPrice" class="en-input-field" type="number" value="${enEsc(l.detailPrice)}"></div>
        <div><div class="en-meta" style="font-weight:800;margin-bottom:3px;">内容量・賞味期限</div><input id="enLaunchSpec" class="en-input-field" value="${enEsc(l.detailSpec)}"></div>
      </div>
      <div>
        <div class="en-meta" style="font-weight:800;margin-bottom:3px;">こだわり詳細・特徴</div>
        <textarea id="enLaunchPitch" class="en-input-field" rows="2" placeholder="例：砂糖・保存料ゼロ。低温乾燥で甘み濃縮！">${enEsc(l.detailPitch)}</textarea>
      </div>

      <div>
        <div class="en-meta" style="font-weight:800;margin-bottom:4px;">④ 販売先（自社EC・道の駅・店頭も複数選択OK）</div>
        <div class="en-channel-grid">
          ${EN_SALES_CHANNELS.map(ch => `<button type="button" class="en-tag-chip ${l.channels.includes(ch.id)?'active':''}" data-ch="${ch.id}">${ch.label}</button>`).join('')}
        </div>
        <input id="enLaunchUrl" class="en-input-field" style="margin-top:6px;" value="${enEsc(l.externalUrl)}" placeholder="自社EC URL・道の駅・販売店舗名（例：https://myshop.jp / 道の駅枚方）">
      </div>

      ${gate.ready ? `
        <div class="en-grad-banner" style="margin-top:4px;">
          <div style="font-size:16px;font-weight:900;">🎉 巣立ち準備OK！全条件クリア！</div>
          <button class="en-act-btn" style="background:#fff;color:#1c1917;justify-content:center;border:none;" onclick="completeProGraduation('${lab.id}')">🚀 マルシェ＆全販売先へ巣立ち公開！</button>
        </div>
      ` : `
        <button class="en-act-btn" style="justify-content:center;opacity:0.68;" onclick="enToast('あと ${4 - gate.count} 項目埋めると巣立ち準備OKになります！')">🔒 あと ${4 - gate.count} 項目で「巣立ち準備OK」解放</button>
      `}
    </div>
  `;
}

window.completeProGraduation = (labId) => {
  const lab = enViewState.labs.find(l => l.id === labId) || enViewState.labs[0];
  const d = getRoomProData(labId);
  const l = d.launch;
  const chNames = EN_SALES_CHANNELS.filter(c => l.channels.includes(c.id)).map(c => c.label).join('・');
  enViewState.marcheItems.unshift({
    id: 'grad-' + Date.now(), type: 'product', badge: `🎉 巣立ち新商品（${chNames}）`,
    title: lab.title, price: `¥${Number(l.detailPrice || 1280).toLocaleString()}`,
    maker: `${enViewState.profile.name} × コラボチーム${l.externalUrl ? '｜販路：' + l.externalUrl : ''}`,
    photo: l.photo || lab.photo
  });
  enViewState.graduatedIds[labId] = true;
  document.getElementById('en-room-modal')?.classList.remove('open');
  enViewState.marcheFilter = 'product';
  renderEnShop(); enGoTab('shop');
  enToast('🎉 巣立ちおめでとうございます！マルシェ＆全販売先へお披露目しました！');
};

window.openNewPollSheet = (labId) => {
  openEnSheetHtml('🗳️ 新しいルーム内多数決を立てる', 'メンバーやファンと意見をサクッと決めよう', `
    <input id="enPollTitleIn" class="en-input-field" placeholder="議題（例：初回販売価格をいくらにする？）">
    <input id="enPollOptA" class="en-input-field" placeholder="案A（例：¥480 ワンコイン以下）">
    <input id="enPollOptB" class="en-input-field" placeholder="案B（例：¥550 こだわりプレミアム感）">
    <button class="en-act-btn primary" style="justify-content:center;" id="enPollCreateBtn">多数決を開始する</button>
  `);
  document.getElementById('enPollCreateBtn').onclick = () => {
    const t = document.getElementById('enPollTitleIn').value.trim();
    const a = document.getElementById('enPollOptA').value.trim();
    const b = document.getElementById('enPollOptB').value.trim();
    if (!t || !a || !b) return enToast('⚠️ 議題と2つの案を入力してください');
    const d = getRoomProData(labId);
    d.polls.unshift({ id: 'poll-' + Date.now(), title: t, deadline: 'あと3日', myChoice: null, options: [{ key: 'A', label: a, votes: 0 }, { key: 'B', label: b, votes: 0 }] });
    saveRoomProStore(); closeEnSheet(); renderEnRoomModal();
    enToast('🗳️ 新しい多数決を作成しました！');
  };
};

// =========================================================
// 🌟 メイン：renderEnRoomModal
// =========================================================
window.renderEnRoomModal = function () {
  const modal = document.getElementById('en-room-modal');
  if (!modal) return;
  const lab = enViewState.labs.find(l => l.id === enViewState.roomOpenId) || enViewState.labs[0];
  const d = getRoomProData(lab.id);
  const rt = enViewState.roomTab;
  const fanMode = enViewState.roomViewAsFan;
  const guide = getAiCopilotGuidance(d);
  const gate = getLaunchGateStatus(d);
  const allBoards = getAllActiveBoardDefs(d);

  let content = '';
  if (fanMode) {
    const p0 = d.polls[0];
    const tot = p0 ? (p0.options.reduce((s, o) => s + o.votes, 0) || 1) : 1;
    content = `
      <div class="card en-card">
        <span class="en-pill" style="align-self:flex-start;">👀 外からの見え方（ファン公開画面）</span>
        <div class="en-title">${enEsc(lab.title)}</div>
        <p class="en-text">開発ストーリーを見守って投票に参加しよう！商品が巣立ったら先行早割が届きます。</p>
        <div class="en-formula">${enViewState.roomBoards[0].items.map(x => `<div>📌 ${enEsc(x)}</div>`).join('')}</div>
      </div>
      ${p0 ? `
        <div class="card en-card">
          <div class="en-between"><div class="en-title">🗳️ ${enEsc(p0.title)}</div><span class="en-badge">${p0.deadline}</span></div>
          ${p0.options.map(opt => {
            const pct = Math.round((opt.votes / tot) * 100);
            return `<button class="en-vote-opt ${p0.myChoice===opt.key?'selected':''}" data-pollid="${p0.id}" data-pollkey="${opt.key}"><span class="en-vote-bar" style="width:${pct}%"></span><span class="en-vote-inner"><span>${enEsc(opt.label)}</span><span>${pct}% (${opt.votes}票)</span></span></button>`;
          }).join('')}
          <button class="en-act-btn primary" style="justify-content:center;" onclick="enViewState.earlyBirdJoined=true;enToast('🎁 巣立ち時の先行早割通知をONにしました！');renderEnRoomModal();">
            ${enViewState.earlyBirdJoined ? '✅ 巣立ち早割通知 ON済' : '🎁 応援して巣立ち早割通知を受け取る'}
          </button>
        </div>
      ` : ''}
    `;
  } else if (rt === 'talk') {
    content = enViewState.roomMessages.map((m, i) => `
      <div class="en-chat-bubble ${m.me ? 'me' : ''}" data-msgaction="${i}">
        ${!m.me ? `<strong style="font-size:11px;opacity:0.8;">${enEsc(m.sender)}</strong><br>` : ''}${enEsc(m.text)}
      </div>
    `).join('') + `<div class="en-meta" style="text-align:center;margin-top:6px;">💡 発言タップ → ルーム内メモ / タスク / なぜなぜ分析へ転送（非公開）</div>`;
  } else if (rt === 'progress') {
    const visibleTasks = enTaskFilterPendingOnly ? enViewState.roomTasks.filter(t => !t.done) : enViewState.roomTasks;
    content = `
      <div class="card en-card" style="cursor:pointer;" onclick="enViewState.roomTab='detail';renderEnRoomModal();">
        <div class="en-between"><div class="en-title">🎉 巣立ち準備ゲート（${gate.count}/4完了）</div><span class="en-pill">${gate.ready ? '準備OK ➔' : '入力する ➔'}</span></div>
        <div class="en-gate-progress"><div class="en-gate-track"><div class="en-gate-fill" style="width:${gate.pct}%"></div></div><strong style="font-size:12px;">${gate.pct}%</strong></div>
      </div>

      <div class="card en-card">
        <div class="en-between"><div class="en-title">🗳️ ルーム内多数決（${d.polls.length}件）</div><button class="en-act-btn" style="padding:4px 9px;font-size:11px;" onclick="openNewPollSheet('${lab.id}')">＋ 新規多数決</button></div>
        ${d.polls.map((pl, pi) => {
          const tot = pl.options.reduce((s, o) => s + o.votes, 0) || 1;
          return `
            <div style="display:flex;flex-direction:column;gap:5px;padding-bottom:6px;border-bottom:1px solid var(--en-border);">
              <div class="en-between"><strong style="font-size:12.5px;">${enEsc(pl.title)}</strong><span class="en-row" style="gap:4px;"><span class="en-meta">${pl.deadline}</span><button type="button" class="en-del-x" data-delpoll="${pi}">✕</button></span></div>
              ${pl.options.map(opt => {
                const pct = Math.round((opt.votes / tot) * 100);
                return `<button class="en-vote-opt ${pl.myChoice===opt.key?'selected':''}" data-pollid="${pl.id}" data-pollkey="${opt.key}"><span class="en-vote-bar" style="width:${pct}%"></span><span class="en-vote-inner"><span>${enEsc(opt.label)}</span><span>${pct}% (${opt.votes}票)</span></span></button>`;
              }).join('')}
            </div>
          `;
        }).join('')}
      </div>

      <div class="card en-card">
        <div class="en-between">
          <div class="en-title">✅ やることリスト</div>
          <button class="en-act-btn" style="padding:4px 9px;font-size:11px;" onclick="enTaskFilterPendingOnly=!enTaskFilterPendingOnly;renderEnRoomModal();">${enTaskFilterPendingOnly?'未完了のみ':'すべて表示'}</button>
        </div>
        ${visibleTasks.map(t => {
          const realIdx = enViewState.roomTasks.indexOf(t);
          return `<div class="en-between"><label class="en-row" style="cursor:pointer;font-size:13px;${t.done?'text-decoration:line-through;opacity:0.55;':''}"><input type="checkbox" ${t.done?'checked':''} onchange="toggleRoomTask(${realIdx})"> <span>${enEsc(t.text)}</span></label><button type="button" class="en-del-x" data-deltask="${realIdx}">✕</button></div>`;
        }).join('')}
        <div class="en-row"><input id="enNewTaskIn" class="en-input-field" placeholder="新しいやることを追加..."><button class="en-act-btn primary" id="enNewTaskAdd">追加</button></div>
      </div>

      <div class="card en-card" style="cursor:pointer;" onclick="enViewState.roomCalExpanded=!enViewState.roomCalExpanded;renderEnRoomModal();">
        <div class="en-between"><div class="en-title">📅 ルーム1行カレンダー</div><span class="en-pill">${enViewState.roomCalExpanded ? '閉じる ▲' : '展開 ▼'}</span></div>
        <div class="en-meta">次：11/29(日) パッケージ決定 ／ 12/6(土) 枚方マルシェ</div>
        ${enViewState.roomCalExpanded ? `<div class="en-cal-grid" style="margin-top:6px;">${Array.from({length:14},(_,i)=>`<div class="en-cal-cell ${[6,13].includes(i+1)?'mark':''}">12/${i+1}</div>`).join('')}</div>` : ''}
      </div>
    `;
  } else if (rt === 'board') {
    content = `
      <div class="en-board-topbar">
        <button class="en-board-hub-btn" onclick="openBoardHubSheet('${lab.id}')">🗂️ 全${allBoards.length}</button>
        <div class="en-tool-strip">
          ${allBoards.map(t => {
            const isPin = d.pinnedTools.includes(t.id);
            return `<button class="en-tool-tab ${d.selectedTool===t.id?'active':''} ${isPin?'pinned':''}" data-seltool="${t.id}">${isPin?'<span class="en-tool-pin-mark">📌</span>':''}${t.icon} ${enEsc(t.name)}</button>`;
          }).join('')}
        </div>
        <button class="en-tool-add-btn" onclick="openToolPickerSheet('${lab.id}')">＋ 追加</button>
      </div>
      ${renderSelectedToolBody(lab.id, d)}
    `;
  } else {
    content = `
      ${renderLaunchGateCard(lab, d)}
      <div class="card en-card">
        <div class="en-between"><div class="en-title">📄 企画書・引き継ぎレポート</div><button class="en-act-btn primary" style="padding:5px 10px;font-size:11.5px;" onclick="openProjectReportSheet('${lab.id}')">1タップ生成 ➔</button></div>
        <div class="en-meta">原価・市場・試作・なぜなぜ・法規・販売先を1枚の企画書にまとめます</div>
      </div>
      <div class="card en-card">
        <div class="en-title">⚙️ ルーム設定（2階）</div>
        <div class="en-between"><span>✨ 実運用Proモード（AI伴走＆全ボード）</span><button class="en-pro-pill ${enAiProEnabled?'':'off'}" onclick="enAiProEnabled=!enAiProEnabled;renderEnRoomModal();">${enAiProEnabled?'Pro ON':'無料モード'}</button></div>
        <div class="en-between"><span>🌐 ファン公開（👀外からの見え方）</span><button class="en-act-btn ${lab.fanPublic?'primary':''}" onclick="toggleLabFanPublic('${lab.id}')">${lab.fanPublic ? '公開 ON' : '非公開 OFF'}</button></div>
        <div class="en-between"><span>🔗 元ネタつぶやきへワープ</span><button class="en-act-btn" onclick="document.getElementById('en-room-modal').classList.remove('open');enViewState.enSubTab='tweet';renderEnFeed();enGoTab('feed');">元ネタへ ➔</button></div>
      </div>
    `;
  }

  modal.innerHTML = `
    <div class="en-room-head">
      <button class="en-act-btn" onclick="document.getElementById('en-room-modal').classList.remove('open')">← 一覧</button>
      <strong style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;text-align:center;">${enEsc(lab.title)}</strong>
      <button class="en-act-btn" style="padding:6px 9px;" onclick="openProjectReportSheet('${lab.id}')" title="企画書出力">📄</button>
      <button class="en-act-btn ${fanMode?'primary':''}" onclick="enViewState.roomViewAsFan=!enViewState.roomViewAsFan;renderEnRoomModal();">${fanMode ? '🛠️ 開発室' : '👀 外見え'}</button>
    </div>

    ${!fanMode ? `
      <div class="en-ai-copilot">
        <div class="en-ai-copilot-text"><span class="en-pill" style="font-size:9px;padding:2px 6px;margin-right:4px;">🤖 ${guide.phase}</span><span>${guide.msg}</span></div>
        <button class="en-pro-pill" id="enCopilotGoBtn">${guide.btn} ➔</button>
      </div>
    ` : ''}

    <div class="en-room-body" id="enRoomBody">${content}</div>

    ${(!fanMode && rt === 'talk') ? `
      <div class="en-quick-chips">
        <button class="en-quick-chip ai" onclick="openAiTranscriptScan('${lab.id}')">✨ AI議事録スキャン</button>
        <button class="en-quick-chip" data-qmsg="📸 試作Ver.3の写真を共有します！味見どうですか？">📸 試作共有</button>
        <button class="en-quick-chip" data-qmsg="💰 包材と加工費の見積りを原価ボードに更新しました！">💰 原価確認</button>
        <button class="en-quick-chip" onclick="openNewPollSheet('${lab.id}')">🗳️ 多数決を立てる</button>
      </div>
      <div class="en-room-composer">
        <input id="enRoomInput" class="en-room-input" type="text" placeholder="トークを送信...">
        <button id="enRoomSend" class="en-act-btn primary">送信</button>
      </div>
    ` : ''}

    ${!fanMode ? `
      <div class="en-room-nav">
        ${[['talk','talk','💬','トーク'],['progress','progress','✅','進行'],['board','board','🧰',`ボード(${allBoards.length})`],['detail','detail','🎉','巣立ち・詳細']].map(([k,ic,em,lb]) => `
          <button class="en-room-tab ${rt===k?'active':''}" data-rtab="${k}">${enIconTag(ic,em)}<span>${lb}</span></button>
        `).join('')}
      </div>
    ` : ''}
  `;

  // --- イベント紐付け ---
  const copGo = document.getElementById('enCopilotGoBtn');
  if (copGo) copGo.onclick = () => {
    enViewState.roomTab = guide.tab;
    if (guide.tool) { if (!d.activeTools.includes(guide.tool)) d.activeTools.push(guide.tool); d.selectedTool = guide.tool; }
    renderEnRoomModal();
  };

  modal.querySelectorAll('[data-rtab]').forEach(b => b.onclick = () => { enViewState.roomTab = b.getAttribute('data-rtab'); renderEnRoomModal(); });
  modal.querySelectorAll('[data-seltool]').forEach(b => b.onclick = () => { d.selectedTool = b.getAttribute('data-seltool'); saveRoomProStore(); renderEnRoomModal(); });
  modal.querySelectorAll('[data-qmsg]').forEach(b => b.onclick = () => {
    enViewState.roomMessages.push({ sender: 'あなた', me: true, text: b.getAttribute('data-qmsg') });
    renderEnRoomModal();
    const body = document.getElementById('enRoomBody'); if (body) body.scrollTop = body.scrollHeight;
  });

  // 投票・削除（タスク/多数決/全ボード項目）
  modal.querySelectorAll('[data-pollid]').forEach(b => b.onclick = () => {
    const pl = d.polls.find(x => x.id === b.getAttribute('data-pollid'));
    const k = b.getAttribute('data-pollkey'); if (!pl) return;
    if (pl.myChoice) pl.options.find(o => o.key === pl.myChoice).votes--;
    pl.myChoice = k; pl.options.find(o => o.key === k).votes++;
    saveRoomProStore(); enToast(`🗳️ 案${k}に投票しました！`); renderEnRoomModal();
  });
  modal.querySelectorAll('[data-delpoll]').forEach(b => b.onclick = () => { d.polls.splice(Number(b.getAttribute('data-delpoll')), 1); saveRoomProStore(); renderEnRoomModal(); });
  modal.querySelectorAll('[data-deltask]').forEach(b => b.onclick = () => { enViewState.roomTasks.splice(Number(b.getAttribute('data-deltask')), 1); renderEnRoomModal(); });
  modal.querySelectorAll('[data-delstory]').forEach(b => b.onclick = () => { enViewState.roomBoards[0].items.splice(Number(b.getAttribute('data-delstory')), 1); renderEnRoomModal(); });
  modal.querySelectorAll('[data-delproto]').forEach(b => b.onclick = () => { d.protos.splice(Number(b.getAttribute('data-delproto')), 1); saveRoomProStore(); enToast('🗑️ 試作ログを削除しました'); renderEnRoomModal(); });
  modal.querySelectorAll('[data-delwhycard]').forEach(b => b.onclick = () => { d.whyList.splice(Number(b.getAttribute('data-delwhycard')), 1); saveRoomProStore(); enToast('🗑️ 課題を削除しました'); renderEnRoomModal(); });
  modal.querySelectorAll('[data-delwhystep]').forEach(b => b.onclick = () => { const [wi, si] = b.getAttribute('data-delwhystep').split(':').map(Number); d.whyList[wi].steps.splice(si, 1); saveRoomProStore(); renderEnRoomModal(); });
  modal.querySelectorAll('[data-delfish]').forEach(b => b.onclick = () => { const [k, i] = b.getAttribute('data-delfish').split(':'); d.fish[k].splice(Number(i), 1); saveRoomProStore(); renderEnRoomModal(); });
  modal.querySelectorAll('[data-deldec]').forEach(b => b.onclick = () => { d.decision.candidates.splice(Number(b.getAttribute('data-deldec')), 1); saveRoomProStore(); renderEnRoomModal(); });
  modal.querySelectorAll('[data-delscamp]').forEach(b => b.onclick = () => { d.scamper.splice(Number(b.getAttribute('data-delscamp')), 1); saveRoomProStore(); renderEnRoomModal(); });
  modal.querySelectorAll('[data-delrisk]').forEach(b => b.onclick = () => { d.risks.splice(Number(b.getAttribute('data-delrisk')), 1); saveRoomProStore(); renderEnRoomModal(); });
  modal.querySelectorAll('[data-delmx]').forEach(b => b.onclick = () => { const [k, i] = b.getAttribute('data-delmx').split(':'); d.matrix[k].splice(Number(i), 1); saveRoomProStore(); renderEnRoomModal(); });
  modal.querySelectorAll('[data-dellegal]').forEach(b => b.onclick = () => { d.legal.splice(Number(b.getAttribute('data-dellegal')), 1); saveRoomProStore(); enToast('🗑️ 法規項目を削除しました'); renderEnRoomModal(); });
  modal.querySelectorAll('[data-delcbitem]').forEach(b => b.onclick = () => {
    const custom = d.customBoards.find(x => x.id === d.selectedTool);
    if (custom) { custom.items.splice(Number(b.getAttribute('data-delcbitem')), 1); saveRoomProStore(); renderEnRoomModal(); }
  });
  const delCbBtn = document.getElementById('enDelCustomBoardBtn');
  if (delCbBtn) delCbBtn.onclick = () => {
    d.customBoards = d.customBoards.filter(x => x.id !== d.selectedTool);
    d.pinnedTools = d.pinnedTools.filter(x => x !== d.selectedTool);
    d.selectedTool = d.activeTools[0] || 'story';
    saveRoomProStore(); enToast('🗑️ カスタムボードを削除しました'); renderEnRoomModal();
  };

// トーク発言転送（引用符・改行でも壊れないイベントリスナー化）
  modal.querySelectorAll('[data-msgaction]').forEach(b => b.onclick = () => {
    const m = enViewState.roomMessages[Number(b.getAttribute('data-msgaction'))];
    if (!m) return;
    openEnSheetHtml('🔒 ルーム内ツールへメモ転送（非公開）', m.text, `
      <button type="button" class="en-sheet-item" id="enProToMemoBtn"><span>📌 ルーム内決定メモ（非公開）に送る</span><span>➔</span></button>
      <button type="button" class="en-sheet-item" id="enProToTaskBtn"><span>✅ やることリストに追加</span><span>➔</span></button>
      <button type="button" class="en-sheet-item" id="enProToWhyBtn"><span>❓ なぜなぜ分析に新しい課題として追加</span><span>➔</span></button>
    `);
    document.getElementById('enProToMemoBtn')?.addEventListener('click', () => { sendMsgToBoard(m.text); renderEnRoomModal(); });
    document.getElementById('enProToTaskBtn')?.addEventListener('click', () => { sendMsgToTask(m.text); renderEnRoomModal(); });
    document.getElementById('enProToWhyBtn')?.addEventListener('click', () => sendMsgToWhy(lab.id, m.text));
  });

  // リアルタイム保存入力（IME途切れ防止）
  modal.querySelectorAll('[data-costkey]').forEach(inp => inp.oninput = e => { d.cost[inp.getAttribute('data-costkey')] = Number(e.target.value) || 0; updateCostKpiDom(d); saveRoomProStore(); });
  modal.querySelectorAll('[data-mktkey]').forEach(inp => inp.oninput = e => { d.market[inp.getAttribute('data-mktkey')] = e.target.value; saveRoomProStore(); });
  modal.querySelectorAll('[data-vpckey]').forEach(inp => inp.oninput = e => { d.vpc[inp.getAttribute('data-vpckey')] = e.target.value; saveRoomProStore(); });
  modal.querySelectorAll('[data-swotkey]').forEach(inp => inp.oninput = e => { d.swot[inp.getAttribute('data-swotkey')] = e.target.value; saveRoomProStore(); });
  modal.querySelectorAll('[data-promokey]').forEach(inp => inp.oninput = e => { d.promo[inp.getAttribute('data-promokey')] = e.target.value; saveRoomProStore(); });
  modal.querySelectorAll('[data-whyprob]').forEach(inp => inp.oninput = e => { d.whyList[Number(inp.getAttribute('data-whyprob'))].problem = e.target.value; saveRoomProStore(); });
  modal.querySelectorAll('[data-whyact]').forEach(inp => inp.oninput = e => { d.whyList[Number(inp.getAttribute('data-whyact'))].action = e.target.value; saveRoomProStore(); });
  modal.querySelectorAll('[data-legaldetail]').forEach(inp => inp.oninput = e => { d.legal[Number(inp.getAttribute('data-legaldetail'))].detail = e.target.value; saveRoomProStore(); });
  const decTopicIn = document.getElementById('enDecTopicIn');
  if (decTopicIn) decTopicIn.oninput = e => { d.decision.topic = e.target.value; saveRoomProStore(); };

  modal.querySelectorAll('[data-decidx]').forEach(rng => rng.onchange = e => { d.decision.candidates[Number(rng.getAttribute('data-decidx'))][rng.getAttribute('data-deckey')] = Number(e.target.value); saveRoomProStore(); renderEnRoomModal(); });
  modal.querySelectorAll('[data-riskck]').forEach(cb => cb.onchange = () => { d.risks[Number(cb.getAttribute('data-riskck'))].done = cb.checked; saveRoomProStore(); renderEnRoomModal(); });
  modal.querySelectorAll('[data-legalck]').forEach(cb => cb.onchange = () => { d.legal[Number(cb.getAttribute('data-legalck'))].done = cb.checked; saveRoomProStore(); renderEnRoomModal(); });
  modal.querySelectorAll('[data-cbck]').forEach(cb => cb.onchange = () => { const c = d.customBoards.find(x => x.id === d.selectedTool); if (c) { c.items[Number(cb.getAttribute('data-cbck'))].done = cb.checked; saveRoomProStore(); renderEnRoomModal(); } });

  // 複数なぜなぜ：各カードへの深掘り追加 ＆ タスク転送
  modal.querySelectorAll('[data-addwhystep]').forEach(btn => btn.onclick = () => {
    const wi = Number(btn.getAttribute('data-addwhystep'));
    const inp = modal.querySelector(`[data-whystepin="${wi}"]`);
    const v = inp ? inp.value.trim() : ''; if (!v) return;
    d.whyList[wi].steps.push(v); saveRoomProStore(); renderEnRoomModal();
  });
  modal.querySelectorAll('[data-whytotask]').forEach(btn => btn.onclick = () => {
    const wi = Number(btn.getAttribute('data-whytotask'));
    const act = d.whyList[wi].action.trim();
    if (!act) return enToast('⚠️ 先に根本対策を入力してください');
    enViewState.roomTasks.unshift({ id: 't-' + Date.now(), text: act, done: false });
    enToast('✅ 根本対策をやることリストに送りました！'); renderEnRoomModal();
  });

  // 構造化追加ボタン類
  const newWhyBtn = document.getElementById('enNewWhyAddBtn');
  if (newWhyBtn) newWhyBtn.onclick = () => {
    const p = document.getElementById('enNewWhyProbIn')?.value.trim();
    if (!p) return enToast('⚠️ 課題を入力してください');
    d.whyList.push({ id: 'why-' + Date.now(), problem: p, steps: [], action: '' });
    saveRoomProStore(); enToast('❓ 新しいなぜなぜ課題を追加しました！'); renderEnRoomModal();
  };

  const protoBtn = document.getElementById('enProtoAdd');
  if (protoBtn) protoBtn.onclick = () => {
    const cond = document.getElementById('enProtoCondIn')?.value.trim();
    const cost = document.getElementById('enProtoCostIn')?.value.trim() || '計算中';
    const score = document.getElementById('enProtoScoreIn')?.value || '★★☆';
    const memo = document.getElementById('enProtoMemoIn')?.value.trim() || '試作メモ';
    if (!cond) return enToast('⚠️ 条件・配合を入力してください');
    d.protos.push({ ver: `Ver.${d.protos.length + 1}`, cond, cost, score, adopted: false, memo });
    saveRoomProStore(); enToast('🧪 試作パターンを記録しました！'); renderEnRoomModal();
  };

  const riskBtn = document.getElementById('enRiskAdd');
  if (riskBtn) riskBtn.onclick = () => {
    const risk = document.getElementById('enRiskNameIn')?.value.trim();
    const prob = Number(document.getElementById('enRiskProbIn')?.value || 3);
    const impact = Number(document.getElementById('enRiskImpIn')?.value || 4);
    const prevent = document.getElementById('enRiskPrevIn')?.value.trim() || '対策検討中';
    if (!risk) return enToast('⚠️ リスク内容を入力してください');
    d.risks.push({ risk, prob, impact, prevent, done: false });
    saveRoomProStore(); enToast('🛡️ リスクを追加しました！'); renderEnRoomModal();
  };

  const legalAddBtn = document.getElementById('enLegalAddBtn');
  if (legalAddBtn) legalAddBtn.onclick = () => {
    const label = document.getElementById('enLegalTitleIn')?.value.trim();
    const detail = document.getElementById('enLegalDetailIn')?.value.trim() || '';
    if (!label) return enToast('⚠️ 項目名を入力してください');
    d.legal.push({ id: 'lg-' + Date.now(), label, detail, done: false });
    saveRoomProStore(); enToast('📋 法規・表示項目を追加しました！'); renderEnRoomModal();
  };

  const bindAdd = (btnId, inId, fn) => {
    const btn = document.getElementById(btnId);
    if (btn) btn.onclick = () => { const v = document.getElementById(inId)?.value.trim(); if (!v) return; fn(v); saveRoomProStore(); renderEnRoomModal(); };
  };
  bindAdd('enNewTaskAdd', 'enNewTaskIn', v => { enViewState.roomTasks.unshift({ id: 't-'+Date.now(), text: v, done: false }); enToast('✅ タスクを追加しました！'); });
  bindAdd('enProStoryAdd', 'enProStoryIn', v => { enViewState.roomBoards[0].items.push(v); enToast('📌 ルーム内決定メモ（非公開）に追加！'); });
  bindAdd('enDecCandAdd', 'enDecCandIn', v => { d.decision.candidates.push({ name: v, taste: 3, cost: 3, look: 3, speed: 3 }); enToast('⚖️ 比較案を追加しました！'); });
  bindAdd('enScampAdd', 'enScampIn', v => { const k = document.getElementById('enScampKey')?.value || '✨ 自由'; d.scamper.push({ key: k, text: v }); enToast('💡 SCAMPERに追加！'); });
  bindAdd('enMxAdd', 'enMxIn', v => { const q = document.getElementById('enMxQuad')?.value || 'now'; d.matrix[q].unshift(v); enToast('🎯 マトリクスに追加！'); });
  bindAdd('enFishAdd', 'enFishIn', v => { const c = document.getElementById('enFishCat').value; d.fish[c].push(v); enToast('🐟 4M1Eに追加！'); });
  bindAdd('enCbAdd', 'enCbIn', v => {
    const custom = d.customBoards.find(x => x.id === d.selectedTool);
    const sub = document.getElementById('enCbSubIn')?.value.trim() || '';
    if (custom) { custom.items.push({ text: v, sub, done: false }); enToast('📝 カスタムボードに追加！'); }
  });

  // 巣立ちゲート入力
  const photoFile = document.getElementById('enLaunchPhotoFile');
  if (photoFile) photoFile.onchange = e => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => { d.launch.photo = ev.target.result; saveRoomProStore(); enToast('📷 完成写真をセットしました！'); renderEnRoomModal(); };
    reader.readAsDataURL(f);
  };
  const sampPhoto = document.getElementById('enUseSamplePhotoBtn');
  if (sampPhoto) sampPhoto.onclick = () => { d.launch.photo = lab.photo || EN_IMAGES.tomato; saveRoomProStore(); enToast('🖼️ 完成写真をセットしました！'); renderEnRoomModal(); };
  [['enLaunchComment','comment'],['enLaunchPrice','detailPrice'],['enLaunchSpec','detailSpec'],['enLaunchPitch','detailPitch'],['enLaunchUrl','externalUrl']].forEach(([id, k]) => {
    const el = document.getElementById(id); if (el) el.onchange = () => { d.launch[k] = el.value; saveRoomProStore(); renderEnRoomModal(); };
  });
  modal.querySelectorAll('[data-ch]').forEach(btn => btn.onclick = () => {
    const ch = btn.getAttribute('data-ch');
    if (d.launch.channels.includes(ch)) d.launch.channels = d.launch.channels.filter(x => x !== ch);
    else d.launch.channels.push(ch);
    saveRoomProStore(); renderEnRoomModal();
  });

  // トーク送信
  const sendBtn = document.getElementById('enRoomSend');
  if (sendBtn) {
    const send = () => {
      const v = document.getElementById('enRoomInput').value.trim(); if (!v) return;
      enViewState.roomMessages.push({ sender: 'あなた', me: true, text: v });
      renderEnRoomModal();
      const body = document.getElementById('enRoomBody'); if (body) body.scrollTop = body.scrollHeight;
    };
    sendBtn.onclick = send;
    document.getElementById('enRoomInput').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  }
  enSyncTheme();
};

window.sendMsgToWhy = (labId, text) => {
  const d = getRoomProData(labId);
  if (!d.activeTools.includes('why')) d.activeTools.push('why');
  d.whyList.unshift({ id: 'why-' + Date.now(), problem: text, steps: [], action: '' });
  d.selectedTool = 'why'; enViewState.roomTab = 'board';
  saveRoomProStore(); closeEnSheet(); enToast('❓ なぜなぜ分析に新しい課題として追加しました！'); renderEnRoomModal();
};

loadRoomProStore();