/* =========================================================
   EN•joy マルシェ4本柱 本気モジュール（patch_marche_pro.js v1）
   ・4タブ固定（「すべて」廃止）：
     1) 商品棚(ECサイト)
     2) 巣立ち(予定：試作完了〜商品化寸前＆ラボ自動連動)
     3) 50:50(アフィリエイト交互切替＋つぶやきからの同時登録連携)
     4) マルシェ日程(EN•joy/en.dress公式イベント特別枠＋夜間リサーチJSON全国蚤の市)
   ・絵文字ゼロ（全SVG） / 1本スマート検索バー / 自動永続化
   ========================================================= */

(function () {
  const MARCHE_STORE_KEY = 'en_joy_marche_pro_v1';
  let marcheHooksInstalled = false;
  let dailyFeedStatus = { loaded: false, source: 'fallback', updatedAt: '' };

  const M_SVG = {
    bag:      `<path d="M6 7h12l1 13H5L6 7Z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>`,
    sparkle:  `<path d="M12 3l1.8 4.8L18.5 9.5l-4.7 1.7L12 16l-1.8-4.8L5.5 9.5l4.7-1.7L12 3z"/>`,
    scale:    `<path d="M12 3v18M5 7h14M6 7l-3 7h6l-3-7zm12 0-3 7h6l-3-7zM8 21h8"/>`,
    calendar: `<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>`,
    search:   `<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>`,
    sliders:  `<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>`,
    x:        `<path d="M18 6 6 18M6 6l12 12"/>`,
    plus:     `<path d="M12 5v14M5 12h14"/>`,
    bell:     `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`,
    eye:      `<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>`,
    cart:     `<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.4 11.2a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.5L22 7H6"/>`,
    link:     `<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.5-1.5"/>`,
    thumb:    `<path d="M7 10v11H3V10h4Zm0 0 4-7a2 2 0 0 1 3 1.7V10h5.2a2 2 0 0 1 2 2.3l-1.1 7A2 2 0 0 1 18.1 21H7"/>`,
    check:    `<path d="M20 6 9 17l-5-5"/>`,
    pin:      `<path d="M12 21s-6-5.7-6-10a6 6 0 1 1 12 0c0 4.3-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/>`,
    star:     `<polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"/>`,
    ext:      `<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>`,
    crown:    `<path d="m2 17 2-10 5 4 3-6 3 6 5-4 2 10H2Z"/><path d="M4 20h16"/>`,
    refresh:  `<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>`
  };

  function mSvg(name, cls = '') {
    return `<svg class="en-m-svg ${cls}" viewBox="0 0 24 24" aria-hidden="true">${M_SVG[name] || ''}</svg>`;
  }
  function esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function cleanText(str, max = 300) {
    return window.EN_SECURITY ? window.EN_SECURITY.sanitizePlainText(str, max) : String(str ?? '').slice(0, max);
  }
  function cleanUrl(u) {
    return window.EN_SECURITY ? window.EN_SECURITY.sanitizeUrl(u) : (/^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '');
  }

  const PREF_REGIONS = [
    { id: 'all', label: '全国すべて', prefs: [] },
    { id: 'hokkaido_tohoku', label: '北海道・東北', prefs: ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県'] },
    { id: 'kanto', label: '関東', prefs: ['茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県'] },
    { id: 'chubu', label: '中部', prefs: ['新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県'] },
    { id: 'kinki', label: '近畿', prefs: ['三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県'] },
    { id: 'chugoku_shikoku', label: '中国・四国', prefs: ['鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県'] },
    { id: 'kyushu_okinawa', label: '九州・沖縄', prefs: ['福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'] }
  ];

  // =========================================================
  // 💾 マルシェ専用ストア（永続化）
  // =========================================================
  function createInitialMarcheStore() {
    const imgs = (typeof EN_IMAGES !== 'undefined') ? EN_IMAGES : {};
    return {
      activeTab: 'shelf', // 'shelf' | 'hatching' | 'fifty' | 'events'
      query: '',
      shelfCat: 'all',
      fiftyCat: 'all',
      eventRegion: 'all',
      eventOfficialOnly: false,
      watchedHatchIds: {},
      shelfProducts: [
        {
          id: 'ec-p1',
          cat: 'food',
          badge: '巣立ち第1号',
          title: '枚方産・完熟ドライトマトのおつまみ（3袋セット）',
          price: 1280,
          maker: '山田農園 × カワチ乾燥加工所 × アトリエ木漏れ日',
          area: '大阪府 枚方市',
          photo: imgs.tomato || 'https://picsum.photos/seed/en-tomato/640/400',
          spec: '30g×3袋・完全無添加・賞味期限90日',
          story: '買い手の「無添加で子どもが食べられるチップスがほしい！」の声から、規格外完熟トマトと低温乾燥機が繋がり誕生しました。',
          channels: ['EN•マルシェ', '自社EC', '道の駅直売']
        },
        {
          id: 'ec-p2',
          cat: 'drink',
          badge: '先行販売中',
          title: '瀬戸内レモンの皮ごと無添加クラフトシロップ',
          price: 1480,
          maker: 'せとうち柑橘ラボ × みちのく発酵蔵',
          area: '広島県 尾道市',
          photo: imgs.citrus || 'https://picsum.photos/seed/en-citrus/640/400',
          spec: '200ml小瓶・炭酸割りで約7杯分',
          story: '減農薬レモンの規格外果実を皮ごと仕込み、米麹由来のやさしい甘さで仕上げた大人のクラフトシロップです。',
          channels: ['EN•マルシェ', '全国クール便EC']
        },
        {
          id: 'ec-p3',
          cat: 'food',
          badge: '冬季限定',
          title: '信州サンふじの低温サクサク・アップルチップス',
          price: 680,
          maker: '信州フルーツ乾燥工房 × TOKYOパッケージ企画室',
          area: '長野県 松本市',
          photo: imgs.snack || 'https://picsum.photos/seed/en-snack/640/400',
          spec: '45g・砂糖油不使用・窓付きクラフト袋',
          story: '降雹でキズがついた蜜入りサンふじを丸ごとスライス。噛むほど甘みが広がる手土産仕様に仕上げました。',
          channels: ['EN•マルシェ', '下北沢スタンド委託']
        },
        {
          id: 'ec-p4',
          cat: 'craft',
          badge: '作り手コラボ',
          title: '県産間伐材の折りたたみマルシェ3段ディスプレイ棚',
          price: 5800,
          maker: '加賀ウッドクラフト × 古民家カフェ en.茶寮',
          area: '石川県 金沢市',
          photo: imgs.package || 'https://picsum.photos/seed/en-craftpkg/640/400',
          spec: '幅45cm・工具不要30秒設営・軽自動車積載OK',
          story: 'マルシェ出店者の「軽くて映える棚がほしい」の声から生まれた、間伐材活用のクラフト什器です。',
          channels: ['EN•マルシェ', '全国発送']
        }
      ],
      hatchingSamples: [
        {
          id: 'hatch-s1',
          labId: 'lab-001',
          stageLabel: '試作完了・ラベル最終確認',
          pct: 85,
          eta: '12月中旬 発売予定',
          title: '無添加・濃厚ドライトマト（大人バジル味）',
          maker: '山田農園 × カワチ乾燥加工所',
          area: '大阪府 枚方市',
          estPrice: '予定 ¥520（単品）',
          photo: imgs.drying || 'https://picsum.photos/seed/en-factory/640/400',
          publicNote: '試作Ver.2の低温60℃仕上げが大好評！パッケージ投票を経て初回50袋テスト販売を予定しています。',
          cheers: 19
        },
        {
          id: 'hatch-s2',
          labId: 'lab-002',
          stageLabel: '瓶詰め試作完了・食品表示確認中',
          pct: 78,
          eta: '1月上旬 お披露目予定',
          title: '地域柑橘のクラフトシロップ（初回100本）',
          maker: 'たなか農園 × 菓子工房ハレ',
          area: '大阪府 高槻市',
          estPrice: '予定 ¥980（150ml）',
          photo: imgs.jam || 'https://picsum.photos/seed/en-jamjar/640/400',
          publicNote: '皮のほろ苦さを残した無添加レシピが確定！ラベル入稿と賞味期限確認が終われば予約開始します。',
          cheers: 14
        }
      ],
      fiftyItems: [
        {
          id: 'ff-pro-1',
          cat: 'gear',
          name: '業務用パワー家庭用真空シーラー（汁物対応モード付）',
          priceNote: '¥6,980目安',
          discoverer: 'カワチ乾燥加工所',
          url: 'https://www.amazon.co.jp/s?k=%E7%9C%9F%E7%A9%BA%E3%82%B7%E3%83%BC%E3%83%A9%E3%83%BC+%E6%B1%81%E7%89%A9%E5%AF%BE%E5%BF%9C',
          photo: imgs.gear || 'https://picsum.photos/seed/en-gear/640/400',
          pairing: '余った旬野菜の冷凍保存や小ロット試作サンプルの郵送に必須',
          stats: { op: 4, disc: 1, maker: 3 },
          lastRoute: '',
          reviews: [
            { id: 'rv-p1', author: 'カワチ乾燥加工所', text: '小ロット試作のサンプル発送で毎日使ってます。脱気が強くて割れにくい！', applied: 5 },
            { id: 'rv-p2', author: '山田農園', text: 'カット野菜の冷凍テストにも使えてロスが減りました。', applied: 2 }
          ]
        },
        {
          id: 'ff-pro-2',
          cat: 'pack',
          name: '窓付きクラフトスタンド袋 50枚＋耐水ラベル入門セット',
          priceNote: '¥2,480目安',
          discoverer: 'アトリエ木漏れ日',
          url: 'https://search.rakuten.co.jp/search/mall/%E7%AA%93%E4%BB%98%E3%81%8D+%E3%82%AF%E3%83%A9%E3%83%95%E3%83%88%E3%82%B9%E3%82%BF%E3%83%B3%E3%83%89%E8%A2%8B/',
          photo: imgs.package || 'https://picsum.photos/seed/en-craftpkg/640/400',
          pairing: 'チップス・焼き菓子・ドライフルーツの初回50袋テスト販売に最適',
          stats: { op: 2, disc: 1, maker: 2 },
          lastRoute: '',
          reviews: [
            { id: 'rv-p3', author: 'アトリエ木漏れ日', text: '初期版代ゼロで1袋あたり40円台に収まる神コスパ包材です。', applied: 6 }
          ]
        },
        {
          id: 'ff-pro-3',
          cat: 'food',
          name: '耐熱ガラス 120g六角ジャム小瓶（24本・ツイスト蓋付）',
          priceNote: '¥2,880目安',
          discoverer: '古民家カフェ en.茶寮',
          url: 'https://search.rakuten.co.jp/search/mall/120g+%E5%85%AD%E8%A7%92+%E3%82%B8%E3%83%A3%E3%83%A0%E7%93%B6/',
          photo: imgs.jam || 'https://picsum.photos/seed/en-jamjar/640/400',
          pairing: '常温手土産ジャム・シロップのマルシェ陳列で一番高見えする定番瓶',
          stats: { op: 3, disc: 1, maker: 1 },
          lastRoute: '',
          reviews: [
            { id: 'rv-p4', author: '古民家カフェ en.茶寮', text: '棚に並べたときの光り方が綺麗でギフト買いが1.5倍になりました。', applied: 4 }
          ]
        }
      ],
      events: [
        // ★公式・自分たちの主催イベント（en.dress / EN•joy）
        {
          id: 'ev-off-1',
          official: true,
          org: 'en.dress 主催（EN•joy公式）',
          date: '2026-12-13',
          dateText: '12/13(土) 11:00〜16:00',
          pref: '京都府',
          area: '京都府 京都市・古民家 en.dress 前',
          title: 'en.dress 冬のお披露目マルシェ ＆ 巣立ち試食会',
          kind: '公式マルシェ',
          note: 'EN•joy巣立ち商品優先出店枠あり・テスト販売＆試食ブース完備',
          url: '',
          source: '公式'
        },
        {
          id: 'ev-off-2',
          official: true,
          org: 'EN•joy コラボ企画',
          date: '2026-12-20',
          dateText: '12/20(土) 10:00〜15:30',
          pref: '大阪府',
          area: '大阪府 枚方市・ニッペパーク岡東中央',
          title: 'EN•joy 地域コラボ試作マーケット（北河内）',
          kind: '公式イベント',
          note: '初出店サポートあり・出店料¥3,000・電源共有OK',
          url: '',
          source: '公式'
        },
        // ★全国自動収集枠（夜間リサーチJSONで更新されるエリア）
        {
          id: 'ev-jp-1',
          official: false,
          org: '全国自動収集',
          date: '2026-12-06',
          dateText: '12/6(土) 09:00〜15:00',
          pref: '京都府',
          area: '京都府 京都市左京区・岡崎公園',
          title: '平安蚤の市 ＆ クラフト・手づくり市',
          kind: '蚤の市・クラフト',
          note: '全国からアンティーク・焼き菓子・農産加工品が集結',
          url: '',
          source: '夜間収集'
        },
        {
          id: 'ev-jp-2',
          official: false,
          org: '全国自動収集',
          date: '2026-12-14',
          dateText: '12/14(日) 10:00〜17:00',
          pref: '東京都',
          area: '東京都 渋谷区・青山国連大学前',
          title: '青山ファーマーズマーケット ＆ 冬のギフト市',
          kind: 'ファーマーズ',
          note: '全国の農家・小ロット食品メーカーが出店する大型市',
          url: '',
          source: '夜間収集'
        },
        {
          id: 'ev-jp-3',
          official: false,
          org: '全国自動収集',
          date: '2026-12-14',
          dateText: '12/14(日) 09:00〜16:00',
          pref: '神奈川県',
          area: '神奈川県 湘南T-SITE',
          title: '湘南 蚤の市（アンティーク＆こだわり食）',
          kind: '蚤の市',
          note: '焼き菓子・ジャム・雑貨の感度の高い買い手が集まる人気市',
          url: '',
          source: '夜間収集'
        },
        {
          id: 'ev-jp-4',
          official: false,
          org: '全国自動収集',
          date: '2026-12-20',
          dateText: '12/20(土) 10:00〜15:00',
          pref: '福岡県',
          area: '福岡県 糸島市・志摩中央公園',
          title: '糸島ウィンター農産クラフト＆蚤の市',
          kind: '蚤の市・農産',
          note: '九州の農家・加工所・木工作家が集う週末マーケット',
          url: '',
          source: '夜間収集'
        },
        {
          id: 'ev-jp-5',
          official: false,
          org: '全国自動収集',
          date: '2026-12-21',
          dateText: '12/21(日) 10:00〜16:00',
          pref: '長野県',
          area: '長野県 松本市・あがたの森公園',
          title: '信州・冬のクラフト＆無添加おやつマルシェ',
          kind: 'クラフト市',
          note: 'りんご・発酵・木工クラフトの出店枠あり',
          url: '',
          source: '夜間収集'
        },
        {
          id: 'ev-jp-6',
          official: false,
          org: '全国自動収集',
          date: '2026-12-27',
          dateText: '12/27(土) 10:00〜16:00',
          pref: '北海道',
          area: '北海道 札幌市・チ・カ・ホ広場',
          title: '北のクラフトフード＆年末手土産マルシェ',
          kind: '屋内マルシェ',
          note: '冬でも暖かい地下歩行空間開催・乳製品＆スイーツ人気',
          url: '',
          source: '夜間収集'
        }
      ]
    };
  }

  let mStore = (function loadMarcheStore() {
    try {
      const raw = JSON.parse(localStorage.getItem(MARCHE_STORE_KEY) || 'null');
      if (raw && Array.isArray(raw.shelfProducts)) return Object.assign(createInitialMarcheStore(), raw);
    } catch (e) {}
    return createInitialMarcheStore();
  })();

  function saveMarcheStore() {
    try { localStorage.setItem(MARCHE_STORE_KEY, JSON.stringify(mStore)); } catch (e) {}
  }

  // =========================================================
  // 🌙 夜間自動リサーチJSON（enjoy_daily_feed.json）自動ローダー
  // =========================================================
  async function tryLoadDailyResearchFeed() {
    const paths = ['./enjoy_daily_feed.json', './data/enjoy_daily_feed.json'];
    for (const p of paths) {
      try {
        const res = await fetch(p, { cache: 'no-store' });
        if (!res.ok) continue;
        const json = await res.json();
        if (!json || typeof json !== 'object') continue;

        const incomingEvents = json.marche_events || json.events || json.flea_markets || [];
        if (Array.isArray(incomingEvents) && incomingEvents.length) {
          incomingEvents.forEach((ev, idx) => {
            const title = cleanText(ev.title || ev.name || '', 80);
            if (!title || mStore.events.some(x => x.title === title)) return;
            mStore.events.push({
              id: 'ev-json-' + idx + '-' + Date.now(),
              official: false,
              org: cleanText(ev.organizer || '夜間自動収集', 30),
              date: cleanText(ev.date || '2026-12-31', 16),
              dateText: cleanText(ev.date_text || ev.date || '日程確認', 30),
              pref: cleanText(ev.pref || ev.prefecture || '', 10),
              area: cleanText(ev.area || ev.location || ev.pref || '全国', 60),
              title,
              kind: cleanText(ev.category || '蚤の市・マルシェ', 20),
              note: cleanText(ev.summary || ev.note || '', 140),
              url: cleanUrl(ev.url || ''),
              source: '夜間JSON'
            });
          });
        }

        dailyFeedStatus = {
          loaded: true,
          source: p,
          updatedAt: cleanText(json.updated_at || json.generated_at || '最新取得済', 30)
        };
        saveMarcheStore();
        if (typeof renderEnShop === 'function' && enViewState?.activeMainTab === 'shop') {
          window.renderEnShop();
        }
        return;
      } catch (e) {
        // 未配置時は静かにモックへフォールバック
      }
    }
  }

  // =========================================================
  // ⚖️ 50:50 登録＆統合ロジック（マルシェ画面＆つぶやき投稿の両方から呼べる）
  // =========================================================
  function registerFiftyItem({ name, url, reviewText, cat, priceNote, author }) {
    const cleanName = cleanText(name, 80).trim();
    const cleanReview = cleanText(reviewText, 240).trim();
    const safeUrl = cleanUrl(url);
    if (!cleanName) return null;

    const who = cleanText(author || (enViewState?.profile?.name !== 'マイ名刺' ? enViewState?.profile?.name : 'あなた'), 30);
    const existing = mStore.fiftyItems.find(x => x.name.trim().toLowerCase() === cleanName.toLowerCase());

    if (existing) {
      if (cleanReview) {
        existing.reviews.unshift({ id: 'rv-' + Date.now(), author: who, text: cleanReview, applied: 0 });
      }
      if (!existing.url && safeUrl) existing.url = safeUrl;
      saveMarcheStore();
      return { merged: true, item: existing };
    }

    const imgs = (typeof EN_IMAGES !== 'undefined') ? EN_IMAGES : {};
    const photoMap = { gear: imgs.gear, pack: imgs.package, food: imgs.jam };
    const created = {
      id: 'ff-' + Date.now(),
      cat: cat || 'gear',
      name: cleanName,
      priceNote: cleanText(priceNote || 'リンク先で確認', 20),
      discoverer: who,
      url: safeUrl,
      photo: photoMap[cat] || imgs.gear || 'https://picsum.photos/seed/en-fifty/400/400',
      pairing: 'つぶやき・現場の声から発掘されたおすすめアイテムです',
      stats: { op: 0, disc: 0, maker: 0 },
      lastRoute: '',
      reviews: cleanReview ? [{ id: 'rv-' + Date.now(), author: who, text: cleanReview, applied: 0 }] : []
    };
    mStore.fiftyItems.unshift(created);
    saveMarcheStore();
    return { merged: false, item: created };
  }

  function executeFiftyLinkRotation(itemId, viaAuthor) {
    const item = mStore.fiftyItems.find(x => x.id === itemId);
    if (!item) return;
    const r = Math.random() * 100;
    let routeLabel = '';
    if (viaAuthor) {
      if (r < 50) { item.stats.op++; routeLabel = 'EN•joy運営リンク（50%枠）'; }
      else if (r < 55) { item.stats.disc++; routeLabel = `初発掘者【${item.discoverer}】先見の明ボーナス（5%枠）`; }
      else { item.stats.maker++; routeLabel = `レビュー紹介者【${viaAuthor}】リンク（45%枠）`; }
    } else {
      if (r < 50) { item.stats.op++; routeLabel = 'EN•joy運営リンク（50%枠）'; }
      else if (r < 65) { item.stats.disc++; routeLabel = `初発掘者【${item.discoverer}】先見の明ボーナス（15%枠）`; }
      else {
        item.stats.maker++;
        const revs = item.reviews || [];
        let chosen = item.discoverer;
        if (revs.length) {
          const weights = revs.map(rv => 1 + (rv.applied || 0) * 3);
          let pick = Math.random() * weights.reduce((a, b) => a + b, 0);
          for (let i = 0; i < revs.length; i++) {
            pick -= weights[i];
            if (pick <= 0) { chosen = revs[i].author; break; }
          }
        }
        routeLabel = `現場愛用者【${chosen}】リンク（35%枠）`;
      }
    }
    item.lastRoute = `最新遷移先：${routeLabel}`;
    saveMarcheStore();
    enToast(`50:50自動切替 → ${routeLabel}`);
    if (item.url) {
      window.open(item.url, '_blank', 'noopener');
    }
    window.renderEnShop();
  }

  // =========================================================
  // 📝 登録シート群（50:50登録 / 公式・主催イベント掲載）
  // =========================================================
  function openAddFiftySheet() {
    openEnSheetHtml('50:50 に愛用品・おすすめ商品を登録', '最初に見つけた人は永続の先見の明ボーナス対象（同商品は1カード統合）', `
      <div>
        <div class="en-meta" style="font-weight:800;margin-bottom:3px;">商品名・資材名（必須）</div>
        <input id="enF50Name" class="en-input-field" placeholder="例：折りたたみ木製マルシェ棚（3段）">
      </div>
      <div class="en-form-grid-2">
        <div>
          <div class="en-meta" style="font-weight:800;margin-bottom:3px;">カテゴリ</div>
          <select id="enF50Cat" class="en-input-field">
            <option value="gear">現場ギア・道具</option>
            <option value="pack">包材・容器・ラベル</option>
            <option value="food">掛け合わせ食品</option>
          </select>
        </div>
        <div>
          <div class="en-meta" style="font-weight:800;margin-bottom:3px;">価格目安（任意）</div>
          <input id="enF50Price" class="en-input-field" placeholder="例：¥3,980目安">
        </div>
      </div>
      <div>
        <div class="en-meta" style="font-weight:800;margin-bottom:3px;">楽天・Amazon等のURL（https://〜）</div>
        <input id="enF50Url" class="en-input-field" type="url" placeholder="https://...">
      </div>
      <div>
        <div class="en-meta" style="font-weight:800;margin-bottom:3px;">現場で使った一言レビュー（必須）</div>
        <textarea id="enF50Rev" class="en-input-field" rows="2" placeholder="例：軽自動車に積めて設営30秒！小瓶ジャムがすごく映えます。"></textarea>
      </div>
      <label class="en-row" style="font-size:12px;font-weight:700;cursor:pointer;">
        <input type="checkbox" id="enF50AlsoTweet" checked>
        <span>同時につぶやきタイムラインにもシェアする</span>
      </label>
      <button type="button" class="en-act-btn primary" style="justify-content:center;" id="enF50SubmitBtn">${mSvg('scale','sm')} 50:50 へ登録する</button>
    `);

    document.getElementById('enF50SubmitBtn')?.addEventListener('click', () => {
      const name = document.getElementById('enF50Name')?.value.trim();
      const reviewText = document.getElementById('enF50Rev')?.value.trim();
      if (!name || !reviewText) return enToast('商品名と一言レビューを入力してください');

      const res = registerFiftyItem({
        name,
        cat: document.getElementById('enF50Cat')?.value || 'gear',
        priceNote: document.getElementById('enF50Price')?.value.trim() || '',
        url: document.getElementById('enF50Url')?.value.trim() || '',
        reviewText
      });

      if (document.getElementById('enF50AlsoTweet')?.checked && typeof enViewState !== 'undefined' && Array.isArray(enViewState.tweets)) {
        enViewState.tweets.unshift({
          id: 'tw-f50-' + Date.now(),
          category: 'idea',
          author: enViewState.profile?.name || 'マイ名刺',
          role: '50:50 愛用品シェア',
          area: enViewState.profile?.area || '全国',
          iconType: 'design',
          avatar: enViewState.profile?.photo || EN_IMAGES.userFarm,
          time: 'たった今',
          text: `【50:50おすすめ】${name}：${reviewText}`,
          photo: '',
          likes: 0,
          comments: 0
        });
      }

      closeEnSheet();
      mStore.activeTab = 'fifty';
      saveMarcheStore();
      enToast(res?.merged ? '既存カードに統合してレビューを追加しました' : '最初の発掘者として50:50へ登録しました');
      window.renderEnShop();
    });
  }

  function openAddEventSheet() {
    const allPrefs = PREF_REGIONS.flatMap(r => r.prefs);
    openEnSheetHtml('マルシェ・主催イベントを掲載する', '自分たちのマルシェ（en.dress主催など）を公式枠に載せられます', `
      <div>
        <div class="en-meta" style="font-weight:800;margin-bottom:3px;">イベント名（必須）</div>
        <input id="enEvTitleIn" class="en-input-field" placeholder="例：en.dress 春の古民家テスト販売マルシェ">
      </div>
      <div class="en-form-grid-2">
        <div>
          <div class="en-meta" style="font-weight:800;margin-bottom:3px;">開催日</div>
          <input id="enEvDateIn" class="en-input-field" type="date" value="2026-12-27">
        </div>
        <div>
          <div class="en-meta" style="font-weight:800;margin-bottom:3px;">都道府県</div>
          <select id="enEvPrefIn" class="en-input-field">
            ${allPrefs.map(p => `<option value="${p}" ${p === '大阪府' ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
      </div>
      <div>
        <div class="en-meta" style="font-weight:800;margin-bottom:3px;">会場・エリア詳細</div>
        <input id="enEvAreaIn" class="en-input-field" placeholder="例：大阪府 寝屋川市・香里園駅前広場">
      </div>
      <div>
        <div class="en-meta" style="font-weight:800;margin-bottom:3px;">見どころ・出店条件メモ</div>
        <textarea id="enEvNoteIn" class="en-input-field" rows="2" placeholder="例：EN•joyメンバー優先枠あり・試食提供OK"></textarea>
      </div>
      <label class="en-row" style="font-size:12px;font-weight:800;cursor:pointer;">
        <input type="checkbox" id="enEvOfficialChk" checked>
        <span>EN•joy / en.dress 公式・主催イベント枠として上部ピックアップ</span>
      </label>
      <button type="button" class="en-act-btn primary" style="justify-content:center;" id="enEvSaveBtn">${mSvg('calendar','sm')} 日程に掲載する</button>
    `);

    document.getElementById('enEvSaveBtn')?.addEventListener('click', () => {
      const title = cleanText(document.getElementById('enEvTitleIn')?.value.trim() || '', 80);
      if (!title) return enToast('イベント名を入力してください');
      const dateVal = document.getElementById('enEvDateIn')?.value || '2026-12-27';
      const pref = document.getElementById('enEvPrefIn')?.value || '大阪府';
      const area = cleanText(document.getElementById('enEvAreaIn')?.value.trim() || pref, 60);
      const note = cleanText(document.getElementById('enEvNoteIn')?.value.trim() || '参加者募集中', 140);
      const isOff = !!document.getElementById('enEvOfficialChk')?.checked;

      mStore.events.unshift({
        id: 'ev-user-' + Date.now(),
        official: isOff,
        org: isOff ? 'en.dress / EN•joy 主催' : (enViewState?.profile?.name || 'ユーザー掲載'),
        date: dateVal,
        dateText: `${dateVal.slice(5).replace('-', '/')} 開催`,
        pref,
        area,
        title,
        kind: isOff ? '公式マルシェ' : '地域イベント',
        note,
        url: '',
        source: isOff ? '公式' : '投稿'
      });
      saveMarcheStore();
      closeEnSheet();
      mStore.activeTab = 'events';
      enToast('マルシェ日程へ掲載しました');
      window.renderEnShop();
    });
  }

  // =========================================================
  // 🐣 巣立ち予定データ（サンプル ＋ 自分のラボで試作到達済みのものを自動合流）
  // =========================================================
  function collectHatchingItems() {
    const list = [];
    const seenLabIds = new Set();

    // 1) 自分の進行中ラボで STEP 3（試作: stage>=2）へ進んだ案件を自動連動（PUBLIC情報のみ！）
    if (typeof enViewState !== 'undefined' && Array.isArray(enViewState.labs) && typeof getRoomProData === 'function') {
      enViewState.labs.filter(l => l.mode === 'my_active' && !enViewState.graduatedIds?.[l.id]).forEach(l => {
        const d = getRoomProData(l.id);
        if (d && typeof d.stage === 'number' && d.stage >= 2) {
          seenLabIds.add(l.id);
          const gate = typeof getLaunchGateStatus === 'function' ? getLaunchGateStatus(d) : { pct: 50 };
          const stNames = ['タネ', '企画原価', '試作完了間近', '食品表示・法規確認中', '巣立ちお披露目直前'];
          list.push({
            id: 'hatch-live-' + l.id,
            labId: l.id,
            stageLabel: stNames[d.stage] || '商品化準備中',
            pct: Math.max(60, gate.pct || 65),
            eta: '商品化寸前（ラボ連動）',
            title: l.title,
            maker: `${enViewState.profile?.name || 'マイ名刺'} × 開発チーム`,
            area: enViewState.profile?.area || '全国',
            estPrice: d.launch?.detailPrice ? `予定 ¥${Number(d.launch.detailPrice).toLocaleString()}` : '価格調整中',
            photo: d.launch?.photo || l.photo || EN_IMAGES.tomato,
            // ★TEAM_ONLYは絶対に出さず、PUBLICのpublicStoryのみ使用
            publicNote: d.publicStory || '開発チームで試作を進めています！応援よろしくお願いします。',
            cheers: 12
          });
        }
      });
    }

    // 2) 既存の巣立ち予定サンプルを追加
    (mStore.hatchingSamples || []).forEach(h => {
      if (!seenLabIds.has(h.labId)) list.push(h);
    });

    return list;
  }

  // =========================================================
  // 🎪 メイン描画：renderEnShop（4本柱完全オーバーライド）
  // =========================================================
  function renderMarchePro() {
    const sec = document.getElementById('view-shop');
    if (!sec) return;

    // 既存タブキー互換
    if (!['shelf', 'hatching', 'fifty', 'events'].includes(mStore.activeTab)) {
      mStore.activeTab = 'shelf';
    }
    const tab = mStore.activeTab;

    // 各タブ専用の検索設定
    const searchConfigs = {
      shelf: {
        ph: '商品名・作り手・エリアで探す',
        lbl: 'カテゴリ',
        cur: mStore.shelfCat,
        chips: [['all', 'すべて'], ['food', '食品・おやつ'], ['drink', 'ドリンク・シロップ'], ['craft', '什器・クラフト']]
      },
      hatching: {
        ph: 'もうすぐ巣立つ商品を検索',
        lbl: '進捗',
        cur: 'all',
        chips: []
      },
      fifty: {
        ph: '愛用品・資材・レビューで探す',
        lbl: 'ジャンル',
        cur: mStore.fiftyCat,
        chips: [['all', 'すべて'], ['gear', '現場ギア'], ['pack', '包材・容器'], ['food', '掛け合わせ食品']]
      },
      events: {
        ph: '蚤の市・マルシェ名・都道府県で探す',
        lbl: PREF_REGIONS.find(r => r.id === mStore.eventRegion)?.label || '全国',
        cur: mStore.eventRegion,
        chips: PREF_REGIONS.map(r => [r.id, r.label])
      }
    };
    const sc = searchConfigs[tab];
    const hasCond = (tab === 'shelf' && mStore.shelfCat !== 'all')
      || (tab === 'fifty' && mStore.fiftyCat !== 'all')
      || (tab === 'events' && (mStore.eventRegion !== 'all' || mStore.eventOfficialOnly));

    sec.innerHTML = `
      <div class="en-wrap" id="enMarcheProWrap">
        <div class="en-sec-head">
          <h2 class="en-sec-h2">${mSvg('bag')} EN•マルシェ</h2>
          <span class="en-sec-sub">商品棚・巣立ち・50:50・全国日程</span>
        </div>

        <!-- 4本柱タブ（「すべて」廃止） -->
        <div class="en-marche-tabs">
          <button type="button" class="en-marche-tab ${tab==='shelf'?'active':''}" data-mtab="shelf">${mSvg('bag','sm')} 商品棚</button>
          <button type="button" class="en-marche-tab ${tab==='hatching'?'active':''}" data-mtab="hatching">${mSvg('sparkle','sm')} 巣立ち予定</button>
          <button type="button" class="en-marche-tab ${tab==='fifty'?'active':''}" data-mtab="fifty">${mSvg('scale','sm')} 50:50</button>
          <button type="button" class="en-marche-tab ${tab==='events'?'active':''}" data-mtab="events">${mSvg('calendar','sm')} 日程</button>
        </div>

        <!-- 統一1本スマート検索バー -->
        <div class="en-ssearch" id="enMarcheSmartSearch">
          <div class="en-ssearch-box">
            <span class="en-ssearch-ico">${mSvg('search')}</span>
            <input id="enMarcheSearchIn" class="en-ssearch-input" type="search" value="${esc(mStore.query)}" placeholder="${esc(sc.ph)}" autocomplete="off">
            <button type="button" class="en-ssearch-clear ${mStore.query ? 'show' : ''}" id="enMarcheClearQ">${mSvg('x','sm')}</button>
            ${sc.chips.length ? `<button type="button" class="en-ssearch-status ${hasCond ? 'has-cond' : ''}" id="enMarcheStatusBtn">${mSvg('sliders','sm')} <span>${esc(sc.lbl)}</span></button>` : ''}
          </div>
          ${sc.chips.length ? `
            <div class="en-ssearch-panel" id="enMarcheSearchPanel">
              <div class="en-ssearch-sec">
                <div class="en-ssearch-sec-lbl"><span>${tab === 'events' ? '地域ブロックで絞り込み（全国対応）' : 'カテゴリで絞り込み'}</span></div>
                <div class="en-ssearch-chips">
                  ${sc.chips.map(([val, lbl]) => `<button type="button" class="en-ssearch-chip ${sc.cur === val ? 'active' : ''}" data-mchip="${val}">${esc(lbl)}</button>`).join('')}
                </div>
              </div>
              ${tab === 'events' ? `
                <label class="en-row" style="font-size:11.5px;font-weight:800;cursor:pointer;">
                  <input type="checkbox" id="enEvOffOnlyChk" ${mStore.eventOfficialOnly ? 'checked' : ''}>
                  <span>EN•joy / en.dress 公式・主催イベントのみ表示</span>
                </label>
              ` : ''}
              <div class="en-ssearch-foot">
                <button type="button" class="en-act-btn" style="padding:4px 9px;font-size:11px;" id="enMarcheResetFilter">リセット</button>
                <button type="button" class="en-act-btn primary" style="padding:4px 12px;font-size:11px;" id="enMarcheClosePanel">閉じる</button>
              </div>
            </div>
          ` : ''}
        </div>

        <div id="enMarcheBodySlot" style="display:flex;flex-direction:column;gap:10px;"></div>
      </div>
    `;

    const sBox = sec.querySelector('#enMarcheSmartSearch');
    const sInp = sec.querySelector('#enMarcheSearchIn');
    const clrBtn = sec.querySelector('#enMarcheClearQ');
    const bodySlot = sec.querySelector('#enMarcheBodySlot');

    const renderBodyOnly = () => {
      const qWords = (mStore.query || '').trim().toLowerCase().split(/[\s ]+/).filter(Boolean);
      const matchQ = text => !qWords.length || qWords.every(w => String(text || '').toLowerCase().includes(w));

      // --- ① 商品棚（ECサイト） ---
      if (tab === 'shelf') {
        // ラボから巣立ち公開された新規商品も先頭へ自動合流
        const gradExtra = (enViewState?.marcheItems || [])
          .filter(x => x.type === 'product' && !mStore.shelfProducts.some(sp => sp.title === x.title))
          .map(x => ({
            id: x.id, cat: 'food', badge: x.badge || '新着巣立ち', title: x.title,
            price: Number(String(x.price || '1280').replace(/[^\d]/g, '')) || 1280,
            maker: x.maker || 'EN•joyコラボ', area: '全国発送', photo: x.photo,
            spec: '開発ルームから誕生した最新コラボ商品', story: 'EN•joy開発ルームで試作・検証を経て巣立ちました。', channels: ['EN•マルシェ']
          }));
        const allProds = [...gradExtra, ...mStore.shelfProducts];
        const filtered = allProds.filter(p =>
          (mStore.shelfCat === 'all' || p.cat === mStore.shelfCat) &&
          matchQ(`${p.title} ${p.maker} ${p.area} ${p.spec}`)
        );

        bodySlot.innerHTML = filtered.length ? `
          <div class="en-between" style="padding:0 2px;">
            <span class="en-meta" style="font-weight:800;">公式コラボEC棚（${filtered.length}商品）</span>
            <span class="en-meta">タップで誕生ストーリー＆購入</span>
          </div>
          <div class="en-ec-grid">
            ${filtered.map(p => `
              <div class="en-ec-item" data-openec="${p.id}">
                <div class="en-ec-thumb">
                  <img src="${p.photo}" alt="" loading="lazy">
                  <span class="en-ec-badge">${esc(p.badge)}</span>
                </div>
                <div class="en-ec-body">
                  <div class="en-ec-name">${esc(p.title)}</div>
                  <div class="en-ec-maker">${esc(p.maker)}</div>
                  <div class="en-ec-foot">
                    <span class="en-ec-price">¥${Number(p.price).toLocaleString()}</span>
                    <span class="en-pill" style="font-size:9.5px;padding:2px 7px;">詳細</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<div class="en-area-empty">条件に合う商品がまだありません</div>';

        bodySlot.querySelectorAll('[data-openec]').forEach(el => {
          el.onclick = () => {
            const p = allProds.find(x => x.id === el.getAttribute('data-openec'));
            if (!p) return;
            openEnSheetHtml(p.title, `${p.maker} ｜ ¥${Number(p.price).toLocaleString()}`, `
              <img class="en-feed-img" style="border-radius:14px;" src="${p.photo}" alt="">
              <div class="en-meta">仕様：${esc(p.spec)} ／ 地域：${esc(p.area)}</div>
              <div class="en-formula"><strong>誕生ストーリー</strong><div>${esc(p.story)}</div></div>
              <div class="en-row" style="flex-wrap:wrap;gap:5px;">
                ${(p.channels || []).map(c => `<span class="en-pill">${esc(c)}</span>`).join('')}
              </div>
              <button type="button" class="en-act-btn primary" style="justify-content:center;" id="enBuyShelfBtn">${mSvg('cart','sm')} 応援購入へ進む（¥${Number(p.price).toLocaleString()}）</button>
            `);
            document.getElementById('enBuyShelfBtn')?.addEventListener('click', () => {
              closeEnSheet();
              enToast(`「${p.title}」の購入手続き（テスト）を記録しました`);
            });
          };
        });
        return;
      }

      // --- ② 巣立ち（予定：商品化寸前） ---
      if (tab === 'hatching') {
        const list = collectHatchingItems().filter(h => matchQ(`${h.title} ${h.maker} ${h.area} ${h.publicNote}`));
        bodySlot.innerHTML = `
          <div class="en-meta" style="padding:0 2px;">試作が完了し商品化寸前のプロジェクトです。通知ONにすると発売・先行早割のお知らせが届きます。</div>
          ${list.length ? list.map(h => {
            const watched = !!mStore.watchedHatchIds[h.id];
            return `
              <div class="en-hatch-card">
                <div class="en-hatch-media">
                  <img src="${h.photo}" alt="" loading="lazy">
                  <span class="en-hatch-ribbon">${mSvg('sparkle','sm')} ${esc(h.stageLabel)}</span>
                  <span class="en-hatch-pct-pill">完成度 ${h.pct}%</span>
                </div>
                <div class="en-hatch-body">
                  <div class="en-between">
                    <span class="en-pill">${esc(h.eta)}</span>
                    <strong style="font-size:12.5px;color:var(--en-accent);">${esc(h.estPrice)}</strong>
                  </div>
                  <div class="en-title">${esc(h.title)}</div>
                  <div class="en-meta">${esc(h.maker)} ・ ${esc(h.area)}</div>
                  <div class="en-hatch-bar"><i style="width:${h.pct}%"></i></div>
                  <p class="en-text" style="font-size:12px;">${esc(h.publicNote)}</p>
                  <div class="en-actions">
                    <button type="button" class="en-act-btn ${watched ? 'primary' : ''}" data-watchhatch="${h.id}">
                      ${mSvg(watched ? 'check' : 'bell', 'sm')} <span>${watched ? '発売通知 ON済' : '発売・早割通知をうけとる'}</span>
                    </button>
                    <button type="button" class="en-act-btn" style="margin-left:auto;" data-peekhatch="${h.labId}">
                      ${mSvg('eye','sm')} <span>外見えをのぞく</span>
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('') : '<div class="en-area-empty">該当する巣立ち予定の商品はありません</div>'}
        `;

        bodySlot.querySelectorAll('[data-watchhatch]').forEach(btn => {
          btn.onclick = () => {
            const id = btn.getAttribute('data-watchhatch');
            mStore.watchedHatchIds[id] = !mStore.watchedHatchIds[id];
            saveMarcheStore();
            enToast(mStore.watchedHatchIds[id] ? '先行早割・発売通知をONにしました' : '発売通知をOFFにしました');
            renderBodyOnly();
          };
        });
        bodySlot.querySelectorAll('[data-peekhatch]').forEach(btn => {
          btn.onclick = () => {
            const lid = btn.getAttribute('data-peekhatch');
            if (typeof openEnRoomModal === 'function') openEnRoomModal(lid, 'progress', true);
          };
        });
        return;
      }

      // --- ③ 50:50（アフィリエイト商品紹介＋つぶやき連動） ---
      if (tab === 'fifty') {
        const list = mStore.fiftyItems.filter(it =>
          (mStore.fiftyCat === 'all' || it.cat === mStore.fiftyCat) &&
          matchQ(`${it.name} ${it.discoverer} ${it.pairing} ${(it.reviews || []).map(r => r.text).join(' ')}`)
        );

        bodySlot.innerHTML = `
          <div class="en-between">
            <span class="en-meta" style="font-weight:800;">現場の愛用品・掛け合わせ紹介（${list.length}件）</span>
            <button type="button" class="en-act-btn primary" style="padding:5px 10px;font-size:11px;" id="enOpenAddFiftyBtn">${mSvg('plus','sm')} 商品を紹介登録</button>
          </div>
          <div class="en-fifty-rule-box">
            <strong>50:50 リンク交互切替（つぶやき投稿からも登録OK）</strong><br>
            レビュー経由：<strong>初発掘者5%＋紹介者45%＋運営50%</strong> ／ 一覧直接：<strong>初発掘者15%＋現場愛用者35%＋運営50%</strong>
          </div>
          ${list.length ? list.map(it => {
            const tot = (it.stats?.op || 0) + (it.stats?.disc || 0) + (it.stats?.maker || 0);
            return `
              <div class="en-fifty-card">
                <div class="en-fifty-top">
                  <img class="en-fifty-img" src="${it.photo}" alt="" loading="lazy">
                  <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;">
                    <div class="en-between">
                      <span class="en-pill" style="font-size:9.5px;">${mSvg('crown','sm')} 発掘：${esc(it.discoverer)}</span>
                      <strong style="font-size:12px;color:var(--en-accent);">${esc(it.priceNote)}</strong>
                    </div>
                    <div class="en-title" style="font-size:13.5px;">${esc(it.name)}</div>
                    <div class="en-meta" style="font-size:11px;">${esc(it.pairing)}</div>
                  </div>
                </div>

                ${(it.reviews || []).map(rv => `
                  <div class="en-fifty-rev">
                    <div class="en-between">
                      <strong>${esc(rv.author)} の現場レビュー</strong>
                      <button type="button" class="en-act-btn" style="padding:3px 8px;font-size:10.5px;" data-f50app="${it.id}:${rv.id}">
                        ${mSvg('thumb','sm')} 活かした (${rv.applied || 0})
                      </button>
                    </div>
                    <div>${esc(rv.text)}</div>
                    <button type="button" class="en-act-btn primary" style="align-self:flex-start;padding:4.5px 10px;font-size:11px;" data-f50buy="${it.id}|${esc(rv.author)}">
                      ${mSvg('ext','sm')} このレビュー経由で見る
                    </button>
                  </div>
                `).join('')}

                <div class="en-actions">
                  <button type="button" class="en-act-btn primary" data-f50buy="${it.id}|">${mSvg('scale','sm')} 一覧から購入リンクを開く</button>
                  <button type="button" class="en-act-btn" style="margin-left:auto;" data-f50addrev="${it.id}">${mSvg('plus','sm')} レビュー追記</button>
                </div>

                ${tot > 0 ? `<div class="en-fifty-route-log">${esc(it.lastRoute)}<br>累計(${tot}回)：運営 ${it.stats.op} / 初発掘者 ${it.stats.disc} / 作り手 ${it.stats.maker}</div>` : ''}
              </div>
            `;
          }).join('') : '<div class="en-area-empty">該当する50:50商品はまだありません</div>'}
        `;

        bodySlot.querySelector('#enOpenAddFiftyBtn')?.addEventListener('click', openAddFiftySheet);
        bodySlot.querySelectorAll('[data-f50buy]').forEach(b => {
          b.onclick = () => {
            const [iid, via] = b.getAttribute('data-f50buy').split('|');
            executeFiftyLinkRotation(iid, via || '');
          };
        });
        bodySlot.querySelectorAll('[data-f50app]').forEach(b => {
          b.onclick = () => {
            const [iid, rvid] = b.getAttribute('data-f50app').split(':');
            const rv = mStore.fiftyItems.find(x => x.id === iid)?.reviews.find(r => r.id === rvid);
            if (rv) { rv.applied = (rv.applied || 0) + 1; saveMarcheStore(); enToast('現場で活かした！を記録（紹介リンク確率UP）'); renderBodyOnly(); }
          };
        });
        bodySlot.querySelectorAll('[data-f50addrev]').forEach(b => {
          b.onclick = () => {
            const item = mStore.fiftyItems.find(x => x.id === b.getAttribute('data-f50addrev'));
            if (!item) return;
            openEnSheetHtml('現場レビューを追記する', item.name, `
              <textarea id="enF50ExtraRev" class="en-input-field" rows="3" placeholder="実際に現場で使ってみた感想..."></textarea>
              <button type="button" class="en-act-btn primary" style="justify-content:center;" id="enF50ExtraSave">レビューを追加</button>
            `);
            document.getElementById('enF50ExtraSave')?.addEventListener('click', () => {
              const txt = cleanText(document.getElementById('enF50ExtraRev')?.value.trim() || '', 240);
              if (!txt) return enToast('レビューを入力してください');
              item.reviews.unshift({ id: 'rv-' + Date.now(), author: enViewState?.profile?.name || 'あなた', text: txt, applied: 0 });
              saveMarcheStore(); closeEnSheet(); enToast('レビューを追記しました'); renderBodyOnly();
            });
          };
        });
        return;
      }

      // --- ④ マルシェ日程（EN•joy/en.dress公式イベント ＋ 全国蚤の市・夜間収集） ---
      const regDef = PREF_REGIONS.find(r => r.id === mStore.eventRegion);
      const regionMatch = ev => {
        if (mStore.eventRegion === 'all' || !regDef || !regDef.prefs.length) return true;
        return regDef.prefs.some(p => (ev.pref || '').includes(p) || (ev.area || '').includes(p));
      };
      const allEvs = [...mStore.events].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      const matched = allEvs.filter(ev =>
        regionMatch(ev) &&
        (!mStore.eventOfficialOnly || ev.official) &&
        matchQ(`${ev.title} ${ev.area} ${ev.pref} ${ev.kind} ${ev.org} ${ev.note}`)
      );

      const officialEvs = matched.filter(ev => ev.official);
      const nationEvs = matched.filter(ev => !ev.official);

      const buildEvCard = ev => `
        <div class="en-ev-card ${ev.official ? 'is-official' : ''}">
          <div class="en-between">
            ${ev.official
              ? `<span class="en-ev-official-pill">${mSvg('star','sm filled')} ${esc(ev.org)}</span>`
              : `<span class="en-pill">${esc(ev.kind)}</span>`}
            <span class="en-ev-source-pill">${esc(ev.source || '全国収集')}</span>
          </div>
          <div class="en-title" style="font-size:14px;">${esc(ev.title)}</div>
          <div class="en-meta" style="font-weight:800;color:var(--en-text);">${mSvg('calendar','sm')} ${esc(ev.dateText)}</div>
          <div class="en-meta">${mSvg('pin','sm')} ${esc(ev.area)}</div>
          <div class="en-meta">${esc(ev.note)}</div>
          <div class="en-actions" style="padding-top:6px;">
            <button type="button" class="en-act-btn ${ev.official ? 'primary' : ''}" data-evcal="${esc(ev.title)}">${mSvg('calendar','sm')} カレンダーメモ</button>
            ${ev.url ? `<a class="en-act-btn" href="${esc(ev.url)}" target="_blank" rel="noopener" style="text-decoration:none;margin-left:auto;">${mSvg('ext','sm')} 公式詳細</a>` : ''}
          </div>
        </div>
      `;

      bodySlot.innerHTML = `
        <div class="en-ev-feed-banner">
          <span>${mSvg('refresh','sm')} 夜間リサーチ連動：<strong>${dailyFeedStatus.loaded ? `JSON同期済 (${dailyFeedStatus.updatedAt})` : '全国サンプル表示中（enjoy_daily_feed.json配置で自動切替）'}</strong></span>
          <button type="button" class="en-act-btn primary" style="padding:4.5px 9px;font-size:10.5px;" id="enOpenAddEvBtn">${mSvg('plus','sm')} 主催掲載</button>
        </div>

        ${officialEvs.length ? `
          <div class="en-ev-official-wrap">
            <div class="en-sec-head"><h3 class="en-sec-h2" style="font-size:13.5px;">${mSvg('star','sm')} EN•joy / en.dress 公式・主催イベント（${officialEvs.length}件）</h3></div>
            ${officialEvs.map(buildEvCard).join('')}
          </div>
        ` : ''}

        ${!mStore.eventOfficialOnly ? `
          <div class="en-sec-head" style="margin-top:4px;">
            <h3 class="en-sec-h2" style="font-size:13.5px;">${mSvg('calendar','sm')} 全国のマルシェ・蚤の市（${nationEvs.length}件）</h3>
            <span class="en-sec-sub">${esc(regDef?.label || '全国')}</span>
          </div>
          ${nationEvs.length ? nationEvs.map(buildEvCard).join('') : '<div class="en-area-empty">この地域のマルシェ日程はまだ見つかりません</div>'}
        ` : ''}
      `;

      bodySlot.querySelector('#enOpenAddEvBtn')?.addEventListener('click', openAddEventSheet);
      bodySlot.querySelectorAll('[data-evcal]').forEach(b => {
        b.onclick = () => enToast(`「${b.getAttribute('data-evcal')}」をメモしました`);
      });
    };

    // タブ切替
    sec.querySelectorAll('[data-mtab]').forEach(btn => {
      btn.onclick = () => {
        mStore.activeTab = btn.getAttribute('data-mtab');
        saveMarcheStore();
        renderMarchePro();
      };
    });

    // スマート検索バー開閉＆IME完全対応
    sInp?.addEventListener('focus', () => { if (sc.chips.length) sBox.classList.add('is-open'); });
    sec.querySelector('#enMarcheStatusBtn')?.addEventListener('click', () => sBox.classList.toggle('is-open'));
    sec.querySelector('#enMarcheClosePanel')?.addEventListener('click', () => sBox.classList.remove('is-open'));

    const onOut = e => {
      if (!document.body.contains(sBox)) { document.removeEventListener('pointerdown', onOut); return; }
      if (!sBox.contains(e.target)) sBox.classList.remove('is-open');
    };
    document.addEventListener('pointerdown', onOut);

    if (sInp) {
      let comp = false;
      const runQ = v => { mStore.query = v; clrBtn?.classList.toggle('show', !!v.trim()); renderBodyOnly(); };
      sInp.addEventListener('compositionstart', () => { comp = true; });
      sInp.addEventListener('compositionend', e => { comp = false; runQ(e.target.value); });
      sInp.addEventListener('input', e => { if (!comp) runQ(e.target.value); });
    }
    clrBtn?.addEventListener('click', () => { if (sInp) { sInp.value = ''; sInp.focus(); } mStore.query = ''; clrBtn.classList.remove('show'); renderBodyOnly(); });

    sec.querySelectorAll('[data-mchip]').forEach(b => {
      b.onclick = () => {
        const val = b.getAttribute('data-mchip');
        if (tab === 'shelf') mStore.shelfCat = val;
        else if (tab === 'fifty') mStore.fiftyCat = val;
        else if (tab === 'events') mStore.eventRegion = val;
        saveMarcheStore();
        sBox.classList.remove('is-open');
        renderMarchePro();
      };
    });
    sec.querySelector('#enEvOffOnlyChk')?.addEventListener('change', e => {
      mStore.eventOfficialOnly = e.target.checked;
      saveMarcheStore();
      renderMarchePro();
    });
    sec.querySelector('#enMarcheResetFilter')?.addEventListener('click', () => {
      mStore.query = '';
      if (tab === 'shelf') mStore.shelfCat = 'all';
      else if (tab === 'fifty') mStore.fiftyCat = 'all';
      else if (tab === 'events') { mStore.eventRegion = 'all'; mStore.eventOfficialOnly = false; }
      saveMarcheStore();
      renderMarchePro();
    });

    renderBodyOnly();
  }

  // =========================================================
  // 💬 つぶやき投稿 ➔ 50:50自動連動フック
  // =========================================================
  function enhanceTweetModalWithFifty() {
    const content = document.getElementById('en-sheet-content');
    const txtArea = document.getElementById('enNewTweetText');
    if (!content || !txtArea || content.querySelector('#enTw50Box')) return;

    const box = document.createElement('div');
    box.id = 'enTw50Box';
    box.className = 'en-tw50-box';
    box.innerHTML = `
      <label class="en-row" style="font-size:12px;font-weight:800;cursor:pointer;">
        <input type="checkbox" id="enTw50EnableChk">
        <span>${mSvg('scale','sm')} このつぶやきで「50:50おすすめ商品」も一緒に登録する（任意）</span>
      </label>
      <div class="en-tw50-fields">
        <input id="enTw50Name" class="en-input-field" placeholder="商品名・資材名（例：120g六角ジャム小瓶）">
        <input id="enTw50Url" class="en-input-field" type="url" placeholder="楽天・Amazon等のURL（https://〜）">
        <select id="enTw50Cat" class="en-input-field">
          <option value="gear">現場ギア・道具</option>
          <option value="pack">包材・容器・ラベル</option>
          <option value="food">掛け合わせ食品</option>
        </select>
      </div>
    `;
    txtArea.after(box);

    box.querySelector('#enTw50EnableChk')?.addEventListener('change', e => {
      box.classList.toggle('open', e.target.checked);
    });
  }

  function installMarcheHooksOnce() {
    if (marcheHooksInstalled) return;
    marcheHooksInstalled = true;

    // 1) renderEnShop を新・4本柱版へ完全差し替え
    window.renderEnShop = renderMarchePro;

    // 2) マルシェ画面の右下FABアクションも4本柱に合わせて最適化
    if (typeof window.updateActionFab === 'function') {
      const origFab = window.updateActionFab;
      window.updateActionFab = function () {
        const res = origFab.apply(this, arguments);
        const fab = document.getElementById('en-action-fab');
        if (fab && typeof enViewState !== 'undefined' && enViewState.activeMainTab === 'shop') {
          fab.innerHTML = `${mSvg('plus','sm')} <span>50:50・イベント</span>`;
          fab.onclick = () => openEnSheetHtml('マルシェへ登録する', '紹介商品や主催イベントを追加できます', `
            <button type="button" class="en-sheet-item" id="enFabAddF50"><span>${mSvg('scale','sm')} 50:50 おすすめ商品を登録</span><span>➔</span></button>
            <button type="button" class="en-sheet-item" id="enFabAddEv"><span>${mSvg('calendar','sm')} EN•joy / 主催マルシェ日程を掲載</span><span>➔</span></button>
          `);
          setTimeout(() => {
            document.getElementById('enFabAddF50')?.addEventListener('click', () => { closeEnSheet(); openAddFiftySheet(); });
            document.getElementById('enFabAddEv')?.addEventListener('click', () => { closeEnSheet(); openAddEventSheet(); });
          }, 0);
        }
        return res;
      };
    }

    // 3) つぶやき作成モーダル ➔ 50:50自動登録フック
    if (typeof window.openCreateTweetSheet === 'function') {
      const origOpenTw = window.openCreateTweetSheet;
      window.openCreateTweetSheet = function () {
        const res = origOpenTw.apply(this, arguments);
        enhanceTweetModalWithFifty();
        return res;
      };
    }
    if (typeof window.submitNewTweet === 'function') {
      const origSubTw = window.submitNewTweet;
      window.submitNewTweet = function () {
        const chk = document.getElementById('enTw50EnableChk')?.checked;
        const pName = document.getElementById('enTw50Name')?.value.trim() || '';
        const pUrl = document.getElementById('enTw50Url')?.value.trim() || '';
        const pCat = document.getElementById('enTw50Cat')?.value || 'gear';
        const twText = document.getElementById('enNewTweetText')?.value.trim() || '';

        if (chk && pName) {
          registerFiftyItem({ name: pName, url: pUrl, cat: pCat, reviewText: twText || `${pName}を現場で愛用中です！` });
          const txtEl = document.getElementById('enNewTweetText');
          if (txtEl && !txtEl.value.includes(pName)) {
            txtEl.value = `【50:50紹介：${pName}】\n${txtEl.value}`;
          }
        }
        const res = origSubTw.apply(this, arguments);
        if (chk && pName) {
          enToast(`つぶやき投稿＆50:50へ「${pName}」を自動登録しました`);
        }
        return res;
      };
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      installMarcheHooksOnce();
      renderMarchePro();
      tryLoadDailyResearchFeed();
    }, 420);
  });
})();