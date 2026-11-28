/* =========================================================
   EN•joy 全画面統一SVGアイコンエンジン（patch_svg_icons.js v2）
   ・絵文字⇔SVGのリアルタイム往復切替対応（data-orig-emoji保持）
   ・enToast / showToast / switchView へ安全フック（FAB＆登録状態同期）
   ・MutationObserver不使用（フリーズゼロ）
   ========================================================= */

(function () {
  const P = {
    home:     `<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/>`,
    chat:     `<path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L4 20l1.1-4.2A8.5 8.5 0 1 1 21 11.5z"/>`,
    check:    `<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8.5 12 2.5 2.5 4.5-5"/>`,
    checkSim: `<path d="M20 6 9 17l-5-5"/>`,
    box:      `<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>`,
    tools:    `<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>`,
    settings: `<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>`,
    calendar: `<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>`,
    lock:     `<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>`,
    unlock:   `<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.6-1.5"/>`,
    lab:      `<path d="M9 3h6M10 3v6.5L5.2 18.2A2 2 0 0 0 7 21h10a2 2 0 0 0 1.8-2.8L14 9.5V3"/><path d="M8.5 14h7"/>`,
    sprout:   `<path d="M12 21V11"/><path d="M12 11C12 6.5 8.5 4 4 4c0 4.5 2.5 7 8 7z"/><path d="M12 13c0-4 3-6.5 7.5-6.5 0 4-2.5 6.5-7.5 6.5z"/>`,
    coin:     `<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.9 2.5 2-1 2-2.5 2-2.2-.6-2.7-1.6M12 6.5v11"/>`,
    chart:    `<path d="M3 3v18h18"/><path d="M7 16v-5M12 16V8M17 16v-8"/>`,
    clip:     `<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h4"/>`,
    doc:      `<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>`,
    map:      `<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z"/><path d="M9 3v15M15 6v15"/>`,
    pin:      `<path d="M12 21s-6-5.7-6-10a6 6 0 1 1 12 0c0 4.3-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/>`,
    pushpin:  `<path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a1 1 0 0 1 1-1V4H8v1a1 1 0 0 1 1 1z"/>`,
    sparkle:  `<path d="M12 3l1.8 4.8L18.5 9.5l-4.7 1.7L12 16l-1.8-4.8L5.5 9.5l4.7-1.7L12 3z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z"/>`,
    vote:     `<path d="M5 12h14v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7z"/><path d="M9 12V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7"/><path d="m10 8 1.5 1.5L14 7"/>`,
    party:    `<path d="M4 20 10 6l8 8-14 6Z"/><path d="M15 4v2M20 9h-2M18 4l-1.5 1.5"/>`,
    rocket:   `<path d="M4.5 16.5c-1.5 1.3-1.5 3.5-1.5 3.5s2.2 0 3.5-1.5L10 15l-2-2-3.5 3.5Z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z"/>`,
    bulb:     `<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V16h8v-1.3A7 7 0 0 0 12 2Z"/>`,
    shield:   `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,
    scale:    `<path d="M12 3v18M5 7h14M6 7l-3 7h6l-3-7zm12 0-3 7h6l-3-7zM8 21h8"/>`,
    target:   `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>`,
    compass:  `<circle cx="12" cy="12" r="9"/><polygon points="16.2 7.8 14.1 14.1 7.8 16.2 9.9 9.9 16.2 7.8"/>`,
    mega:     `<path d="m3 11 16-5v12L3 13v-2Z"/><path d="M7 14v4a2 2 0 0 0 2 2h1"/>`,
    help:     `<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.8.8c0 1.7-2.3 2.2-2.3 3.7"/><circle cx="12" cy="17.5" r=".6" fill="currentColor"/>`,
    alert:    `<path d="m12 3 9.5 17H2.5L12 3Z"/><path d="M12 9v5"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>`,
    bell:     `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`,
    search:   `<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>`,
    user:     `<circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/>`,
    users:    `<circle cx="9" cy="8" r="3.5"/><path d="M3 19a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a4.5 4.5 0 0 1 5 4.5"/>`,
    heart:    `<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.3l7.8-7.8 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>`,
    thumb:    `<path d="M7 10v11H3V10h4Zm0 0 4-7a2 2 0 0 1 3 1.7V10h5.2a2 2 0 0 1 2 2.3l-1.1 7A2 2 0 0 1 18.1 21H7"/>`,
    bookmark: `<path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1z"/>`,
    camera:   `<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>`,
    image:    `<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 15-5-5L5 20"/>`,
    trash:    `<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>`,
    pen:      `<path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="m13.5 6.5 4 4"/>`,
    palette:  `<circle cx="12" cy="12" r="9"/><circle cx="9.5" cy="9.5" r="1" fill="currentColor"/><circle cx="14.5" cy="9.5" r="1" fill="currentColor"/><circle cx="8.5" cy="14" r="1" fill="currentColor"/><path d="M15 14.5a2 2 0 1 0 0-4"/>`,
    eye:      `<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>`,
    eyeOff:   `<path d="M17.9 17.9A10 10 0 0 1 2 12a10 10 0 0 1 4.1-5.9M9.9 4.2A10 10 0 0 1 22 12a10 10 0 0 1-1.7 2.8M2 2l20 20"/>`,
    globe:    `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>`,
    link:     `<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.5-1.5"/>`,
    bot:      `<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 14h.01M15 14h.01M9 17h6"/>`,
    zap:      `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
    flame:    `<path d="M12 22c4.5 0 7-3.2 7-7.2 0-3.5-2.5-6.3-4.5-8.8-.2 2.2-1.5 3.3-2.5 3.8C12 6.5 10.5 4 9 2c-.4 3-3 5.5-3 9.5 0 5.5 2.5 10.5 6 10.5Z"/>`,
    shop:     `<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v8h14v-8"/>`,
    cart:     `<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.4 11.2a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.5L22 7H6"/>`,
    bag:      `<path d="M6 7h12l1 13H5L6 7Z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>`,
    gift:     `<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7M12 8H7.5a2.5 2.5 0 1 1 0-5C11 3 12 8 12 8Zm0 0h4.5a2.5 2.5 0 1 0 0-5C13 3 12 8 12 8Z"/>`,
    truck:    `<path d="M1 4h13v12H1zM14 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>`,
    factory:  `<path d="M3 21V10l6 4V10l6 4V6h6v15H3z"/><path d="M7 17h2M11 17h2M15 17h2"/>`,
    leaf:     `<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>`,
    utensils: `<path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M16 3v18M16 3c2.5 0 4 2 4 5s-1.5 5-4 5"/>`,
    fish:     `<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z"/><path d="M22 12l-3-3m3 3-3 3"/><circle cx="7.5" cy="11.5" r=".8" fill="currentColor"/>`,
    news:     `<path d="M4 22h16a2 2 0 0 0 2-2V4H6a2 2 0 0 0-2 2v16Z"/><path d="M10 8h8M10 12h8M10 16h5"/>`,
    tag:      `<path d="M12 2H2v10l9.3 9.3a2 2 0 0 0 2.8 0l7.2-7.2a2 2 0 0 0 0-2.8L12 2Z"/><circle cx="7" cy="7" r="1.2" fill="currentColor"/>`,
    clock:    `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
    mail:     `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>`,
    send:     `<path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/>`,
    share:    `<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>`,
    save:     `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>`,
    monitor:  `<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>`,
    phone:    `<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M12 18h.01"/>`,
    book:     `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>`,
    crown:    `<path d="m2 17 2-10 5 4 3-6 3 6 5-4 2 10H2Z"/><path d="M4 20h16"/>`,
    trophy:   `<path d="M6 9H4a2 2 0 0 1-2-2V5h4M18 9h2a2 2 0 0 0 2-2V5h-4M6 4h12v6a6 6 0 0 1-12 0V4ZM12 16v4M8 20h8"/>`,
    sun:      `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>`,
    snow:     `<path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9 4.9 19.1"/>`,
    recycle:  `<path d="M7 19H4.8a2 2 0 0 1-1.7-3l1.4-2.5M14 4l1.1-2M12 3l3 5-5 1M17 19h2.2a2 2 0 0 0 1.7-3l-2.6-4.5M12 21l-3-2 3-2"/>`,
    hand:     `<path d="M18 11V6a2 2 0 0 0-4 0v4M14 10V4a2 2 0 0 0-4 0v6M10 10V5a2 2 0 0 0-4 0v9l-1.5-1.5a2 2 0 0 0-2.8 2.8l5 5.2A5 5 0 0 0 10.3 22h3.2a6 6 0 0 0 6-6v-5a2 2 0 0 0-1.5-1.9"/>`,
    arrowUR:  `<path d="M7 17 17 7M8 7h9v9"/>`,
    rect:     `<rect x="4" y="4" width="16" height="16" rx="2"/>`,
    circle:   `<circle cx="12" cy="12" r="8"/>`,
    ruler:    `<path d="M4 20 20 4M14 6l2 2M10 10l2 2M6 14l2 2"/>`,
    undo:     `<path d="M9 14 4 9l5-5"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>`,
    erase:    `<path d="m7 21-4.3-4.3a2 2 0 0 1 0-2.8L12.6 4a2 2 0 0 1 2.8 0l5.6 5.6a2 2 0 0 1 0 2.8L13 21H7Z"/><path d="M13 21h8"/>`,
    star:     `<polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"/>`,
    idCard:   `<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5.5 16a3 3 0 0 1 5 0M14 10h5M14 14h4"/>`,
    puzzle:   `<path d="M19 11h-2a2 2 0 0 1 0-4h2V5a2 2 0 0 0-2-2h-4v2a2 2 0 0 1-4 0V3H5a2 2 0 0 0-2 2v4h2a2 2 0 0 1 0 4H3v4a2 2 0 0 0 2 2h4v-2a2 2 0 0 1 4 0v2h4a2 2 0 0 0 2-2v-6Z"/>`,
    brain:    `<path d="M9.5 3a3.5 3.5 0 0 0-3.4 4.3A3.5 3.5 0 0 0 5 14a3.5 3.5 0 0 0 4.5 5V3ZM14.5 3a3.5 3.5 0 0 1 3.4 4.3A3.5 3.5 0 0 1 19 14a3.5 3.5 0 0 1-4.5 5V3Z"/>`,
    handshake:`<path d="m11 17 2 2a1 1 0 1 0 3-3M14 14l2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8"/>`,
    drop:     `<path d="M12 2.7 5.6 10.6a7 7 0 1 0 12.8 0L12 2.7Z"/>`,
    therm:    `<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z"/>`,
    refresh:  `<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>`,
    citrus:   `<circle cx="12" cy="13" r="8"/><path d="M12 5V2M12 5c2-1 4-1 5 0"/>`,
    window:   `<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/>`,
    folder:   `<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>`
  };

  const EMOJI_MAP = {
    '🏠': 'home', '💬': 'chat', '🗣️': 'chat', '✅': 'check', '☑️': 'check', '✓': 'checkSim',
    '🧰': 'tools', '🛠️': 'tools', '🛠': 'tools', '⚙️': 'settings', '⚙': 'settings', '🔧': 'settings',
    '📅': 'calendar', '🗓': 'calendar', '🔒': 'lock', '🔓': 'unlock', '🔐': 'lock', '🧪': 'lab',
    '🌱': 'sprout', '🌾': 'sprout', '🌿': 'leaf', '🥬': 'leaf', '🍅': 'citrus', '🍊': 'citrus', '🍓': 'citrus', '🍯': 'citrus', '🍰': 'citrus',
    '💰': 'coin', '💴': 'coin', '🧮': 'coin', '📊': 'chart', '📋': 'clip', '📄': 'doc', '📝': 'pen', '✍️': 'pen', '✍': 'pen',
    '🗺': 'map', '📍': 'pin', '📌': 'pushpin', '✨': 'sparkle', '🌟': 'sparkle', '🗳': 'vote',
    '🎉': 'party', '🚀': 'rocket', '💡': 'bulb', '🛡️': 'shield', '🛡': 'shield',
    '⚖': 'scale', '🎯': 'target', '🧭': 'compass', '📣': 'mega', '❓': 'help', '⚠️': 'alert', '⚠': 'alert', '🆘': 'alert',
    '🔔': 'bell', '🔍': 'search', '👤': 'user', '👥': 'users', '🤝': 'handshake', '👋': 'hand', '🖐': 'hand',
    '❤️': 'heart', '❤': 'heart', '👍': 'thumb', '👏': 'thumb', '🙋': 'user', '🔖': 'bookmark',
    '📷': 'camera', '📸': 'camera', '🖼️': 'image', '🖼': 'image', '🗑️': 'trash', '🗑': 'trash',
    '✏️': 'pen', '✏': 'pen', '🎨': 'palette', '👀': 'eye', '👁': 'eye', '🙈': 'eyeOff',
    '🌐': 'globe', '🔗': 'link', '🤖': 'bot', '⚡': 'zap', '🔥': 'flame', '💪': 'flame',
    '🏪': 'shop', '🏬': 'shop', '🎪': 'shop', '🏕': 'shop', '🛒': 'cart', '🛍': 'bag', '🎁': 'gift',
    '📦': 'box', '🚚': 'truck', '🚜': 'truck', '🏭': 'factory', '🏢': 'factory', '🍳': 'utensils', '🍽': 'utensils', '🔪': 'utensils', '👩‍🍳': 'utensils',
    '🐟': 'fish', '📰': 'news', '🏷': 'tag', '⏰': 'clock', '⏱': 'clock', '🕒': 'clock',
    '✉️': 'mail', '✉': 'mail', '📩': 'send', '📤': 'share', '📥': 'save', '💾': 'save',
    '🖥️': 'monitor', '🖥': 'monitor', '💻': 'monitor', '📱': 'phone', '📞': 'phone', '📑': 'doc', '📒': 'book', '📓': 'book', '🗂': 'folder', '📁': 'folder',
    '👑': 'crown', '🏆': 'trophy', '☀️': 'sun', '☀': 'sun', '❄️': 'snow', '❄': 'snow', '♻': 'recycle',
    '↗': 'arrowUR', '⬜': 'rect', '⭕': 'circle', '📏': 'ruler', '↩': 'undo', '🧹': 'erase',
    '★': 'star', '⭐': 'star', '🪪': 'idCard', '🧩': 'puzzle', '🧠': 'brain', '🩸': 'drop', '🌡': 'therm',
    '🔄': 'refresh', '🪟': 'window', '🥚': 'citrus', '🐣': 'sparkle', '🐥': 'sparkle', '🕊': 'sparkle', '🪺': 'home', '🪵': 'leaf', '🎬': 'camera', '🎥': 'camera', '🫧': 'sparkle', '🖨': 'doc', '🔢': 'chart', '🥫': 'box', '😣': 'user', '💊': 'shield', '🌪': 'alert', '💤': 'clock', '🔴': 'circle', '🟡': 'circle', '🟢': 'circle', '🟠': 'circle', '🟣': 'circle', '🃏': 'window', '🧱': 'rect', '🌳': 'leaf', '🤤': 'heart', '📎': 'link', '➕': 'sparkle'
  };

  const normalizedMap = {};
  Object.keys(EMOJI_MAP).forEach(k => { normalizedMap[k.replace(/\uFE0F/g, '')] = EMOJI_MAP[k]; });
  const sortedKeys = Object.keys(normalizedMap).sort((a, b) => b.length - a.length);
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const EMOJI_RE = new RegExp(`(?:${sortedKeys.map(escRe).join('|')})\\uFE0F?`, 'g');
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'PRE', 'CODE', 'SVG', 'TITLE']);

  function buildSvgWrap(key, origEmoji) {
    const path = P[key];
    if (!path) return null;
    const span = document.createElement('span');
    span.className = 'en-ic-wrap';
    span.setAttribute('data-orig-emoji', origEmoji);
    span.innerHTML = `<svg class="en-svg-ic" viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
    return span;
  }

  function restoreEmojisInNode(root) {
    if (!root) return;
    root.querySelectorAll('.en-ic-wrap[data-orig-emoji]').forEach(el => {
      const txt = document.createTextNode(el.getAttribute('data-orig-emoji') || '');
      if (el.parentNode) el.parentNode.replaceChild(txt, el);
    });
  }

  function convertEmojisInNode(root) {
    if (!root) return;
    if (typeof enThemeState !== 'undefined' && enThemeState.icon === 'emoji') {
      restoreEmojisInNode(root);
      return;
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        let p = node.parentNode;
        while (p && p.nodeType === 1) {
          if (SKIP_TAGS.has(p.tagName) || p.classList?.contains('en-ic-wrap')) return NodeFilter.FILTER_REJECT;
          p = p.parentNode;
        }
        return EMOJI_RE.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    const targets = [];
    let cur;
    while ((cur = walker.nextNode())) targets.push(cur);

    targets.forEach(textNode => {
      const text = textNode.nodeValue;
      EMOJI_RE.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      let m;
      while ((m = EMOJI_RE.exec(text)) !== null) {
        if (m.index > lastIdx) frag.appendChild(document.createTextNode(text.slice(lastIdx, m.index)));
        const key = normalizedMap[m[0].replace(/\uFE0F/g, '')];
        const wrap = buildSvgWrap(key, m[0]);
        if (wrap) frag.appendChild(wrap);
        else frag.appendChild(document.createTextNode(m[0]));
        lastIdx = EMOJI_RE.lastIndex;
      }
      if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      if (textNode.parentNode) textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  let rafId = 0;
  function scheduleSvgSweep() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      convertEmojisInNode(document.body);
    });
  }

  function forceDefaultSvgTheme() {
    if (typeof enThemeState !== 'undefined' && !localStorage.getItem('en_svg_default_v1')) {
      enThemeState.icon = 'svg';
      localStorage.setItem('en_svg_default_v1', '1');
      localStorage.setItem('en_theme_v1', JSON.stringify(enThemeState));
    }
  }

  function installHooks() {
    forceDefaultSvgTheme();

    // switchView 同期ラップ（登録完了モーダル等からの遷移でもFAB＆登録状態を完全同期）
    if (typeof window.switchView === 'function' && !window.switchView._enSyncWrapped) {
      const origSw = window.switchView;
      const wrappedSw = function (viewName) {
        const res = origSw.apply(this, arguments);
        if (typeof enViewState !== 'undefined' && ['home', 'feed', 'en', 'tips', 'shop'].includes(viewName)) {
          enViewState.activeMainTab = viewName;
        }
        if (typeof syncRegisterOverlayState === 'function') syncRegisterOverlayState();
        if (typeof updateActionFab === 'function') updateActionFab();
        scheduleSvgSweep();
        return res;
      };
      wrappedSw._enSyncWrapped = true;
      window.switchView = wrappedSw;
    }

    ['applyEnTheme', 'goStep', 'v6RenderWorkDiagPanel', 'openEnSheetHtml', 'v6OpenModal', 'enToast', 'showToast'].forEach(fnName => {
      if (typeof window[fnName] === 'function' && !window[fnName]._enSvgWrapped) {
        const orig = window[fnName];
        const wrapped = function () {
          const res = orig.apply(this, arguments);
          scheduleSvgSweep();
          return res;
        };
        wrapped._enSvgWrapped = true;
        window[fnName] = wrapped;
      }
    });
  }

  document.addEventListener('click', () => setTimeout(scheduleSvgSweep, 40));

  window.addEventListener('DOMContentLoaded', () => {
    installHooks();
    scheduleSvgSweep();
    setTimeout(() => { installHooks(); scheduleSvgSweep(); }, 250);
  });
})();