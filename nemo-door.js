/**
 * NEMO DOOR v0.1 — shared world doorway, trial implementation.
 * Self-contained; does not read or mutate game state or localStorage.
 * In this game, only index.html loads this script; the original game files remain untouched.
 */
(() => {
  'use strict';
  if (document.getElementById('nemo-door-widget')) return;

  const HOME = 'https://haine-cpu7.github.io/nemo-collection-home/';
  const PORTRAIT = HOME + 'assets/hero-nemo.png';
  const destinations = [
    {
      url: 'https://haine-cpu7.github.io/chibi-nemo-oturusuban/',
      icon: '🐾',
      title: 'ちびねもとあそぶ',
      sub: 'ちびねものおるすばん大作戦！'
    },
    {
      url: 'https://haine-cpu7.github.io/nemo-village/',
      icon: '🌱',
      title: 'ねもの村をのぞく',
      sub: 'ねもたちの、なんでもない日々'
    },
    {
      url: HOME,
      icon: '🏡',
      title: 'すべての世界を見る',
      sub: 'NEMO COLLECTION HOME'
    }
  ];

  const css = `
    #nemo-door-widget, #nemo-door-widget * { box-sizing: border-box; }
    #nemo-door-widget { font-family: -apple-system, BlinkMacSystemFont, 'Hiragino Maru Gothic ProN', 'Yu Gothic', Meiryo, sans-serif; color:#655360; }
    #nemo-door-widget .nd-launch {
      position: fixed; top: max(88px, calc(env(safe-area-inset-top, 0px) + 78px));
      right: max(12px, env(safe-area-inset-right, 0px));
      z-index: 8500; display: flex; align-items:center; justify-content:center;
      width: 48px; height:48px; padding:0; border: 2px solid #fff;
      border-radius: 999px; background: linear-gradient(145deg,#ffe4ef,#ffd5e5);
      color:#8e5875; box-shadow:0 5px 18px rgba(129,69,97,.25);
      cursor:pointer; font-size: 23px; line-height:1; transition:transform .18s,box-shadow .18s;
      -webkit-tap-highlight-color: transparent;
    }
    #nemo-door-widget .nd-launch:hover { transform: translateY(-2px); box-shadow:0 7px 22px rgba(129,69,97,.28); }
    #nemo-door-widget .nd-launch:focus-visible, #nemo-door-widget a:focus-visible,
    #nemo-door-widget .nd-close:focus-visible { outline:3px solid #9778d5; outline-offset:3px; }
    #nemo-door-widget .nd-backdrop { position:fixed; inset:0; z-index:9500; display:none;
      align-items:center; justify-content:center; padding: max(14px,env(safe-area-inset-top,0px)) 14px max(14px,env(safe-area-inset-bottom,0px));
      background:rgba(52,37,56,.48); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
    #nemo-door-widget .nd-backdrop.nd-open { display:flex; }
    #nemo-door-widget .nd-panel { position:relative; width:min(410px,100%); max-height:min(90dvh,700px);
      overflow-y:auto; overscroll-behavior:contain; padding:24px 20px 20px;
      background:linear-gradient(150deg,#fffafc 0%,#fff1f6 65%,#f8f5ff 100%);
      border:2px solid #fff; border-radius:26px; box-shadow:0 22px 70px rgba(43,27,45,.3);
      text-align:center; color:#655360; }
    #nemo-door-widget .nd-close {position:absolute; right:14px; top:14px; width:34px; height:34px; display:grid; place-items:center;
      border:1px solid #eed5e1; border-radius:50%; background:#fff; color:#9a6d84;
      font:700 23px/1 sans-serif; cursor:pointer; }
    #nemo-door-widget .nd-eyebrow {font-weight:800; font-size:10px; letter-spacing:.12em; color:#b3899d; margin:2px 0 14px; }
    #nemo-door-widget .nd-portrait { width:86px; height:86px; border-radius:27px; margin:0 auto 12px;
      position:relative; background:#ffe4eb; border:3px solid #fff; overflow:hidden; box-shadow:0 6px 16px rgba(156,94,123,.12);
      display:grid; place-items:center; }
    #nemo-door-widget .nd-portrait img { width:100%; height:100%; object-fit:cover; display:block; position:absolute; inset:0; z-index:1; }
    #nemo-door-widget .nd-portrait .nd-fallback { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:37px; }
    #nemo-door-widget .nd-title {font-size:22px; line-height:1.35; font-weight:800; color:#805c70; margin:0 0 10px; }
    #nemo-door-widget .nd-message { margin:0 0 4px; font-weight:700; font-size:14px; line-height:1.7; }
    #nemo-door-widget .nd-submsg {margin:0 0 19px; font-size:12px; color:#9c8994; line-height:1.6; }
    #nemo-door-widget .nd-links {display:grid; gap:9px; text-align:left; }
    #nemo-door-widget .nd-link {display:flex; align-items:center; gap:12px; padding:13px 12px;
      border-radius:16px; border:1px solid #f1dce6; background:rgba(255,255,255,.95);
      text-decoration:none; color:inherit; box-shadow:0 3px 10px rgba(173,126,148,.06);
      transition:transform .15s,border-color .15s; }
    #nemo-door-widget .nd-link:hover {transform:translateY(-2px);border-color:#dfb3c9;}
    #nemo-door-widget .nd-icon {font-size:22px; width:29px; flex-shrink:0; text-align:center;}
    #nemo-door-widget .nd-link-body {flex:1; min-width:0;}
    #nemo-door-widget .nd-link-title {display:block; font-size:14px; line-height:1.4; font-weight:800;}
    #nemo-door-widget .nd-link-sub {display:block; font-size:11px; color:#9a8792; line-height:1.45; margin-top:3px;}
    #nemo-door-widget .nd-arrow {font-size:17px;color:#bb93a6;}
    #nemo-door-widget .nd-return {margin:16px 0 0; border:0; background:none; color:#947185;
      font-family:inherit; font-weight:700; font-size:12px; line-height:1.6; cursor:pointer; text-decoration:underline; text-underline-offset:4px; }
    #nemo-door-widget .nd-note {margin:9px 0 0;font-size:10px;color:#ab9ba5;}
    @media (max-width:480px) {
      #nemo-door-widget .nd-launch { top: max(80px,calc(env(safe-area-inset-top, 0px) + 69px)); width:43px;height:43px;font-size:21px; }
      #nemo-door-widget .nd-panel {padding:21px 15px 17px; border-radius:22px;}
    }
    @media (prefers-reduced-motion:reduce){#nemo-door-widget .nd-launch,#nemo-door-widget .nd-link{transition:none;}}
  `;

  const root = document.createElement('div');
  root.id = 'nemo-door-widget';
  const style = document.createElement('style');
  style.textContent = css;
  root.appendChild(style);

  const launch = document.createElement('button');
  launch.className = 'nd-launch';
  launch.type = 'button';
  launch.setAttribute('aria-label', 'ねもの扉を開く');
  launch.setAttribute('aria-expanded', 'false');
  launch.setAttribute('aria-controls', 'nemo-door-dialog');
  launch.innerHTML = '<span aria-hidden="true">🐾</span>';

  const backdrop = document.createElement('div');
  backdrop.className = 'nd-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  const panel = document.createElement('section');
  panel.className = 'nd-panel';
  panel.id = 'nemo-door-dialog';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'nemo-door-title');
  panel.setAttribute('tabindex','-1');

  const close = document.createElement('button');
  close.className = 'nd-close';
  close.type = 'button';
  close.setAttribute('aria-label', 'ねもの扉を閉じる');
  close.textContent = '×';
  panel.appendChild(close);

  const heading = document.createElement('div');
  heading.className = 'nd-eyebrow';
  heading.textContent = 'NEMO COLLECTION · WORLDS';
  panel.appendChild(heading);

  const portrait = document.createElement('div');
  portrait.className = 'nd-portrait';
  const photo = document.createElement('img');
  photo.src = PORTRAIT;
  photo.alt = 'ねもちゃん';
  photo.loading = 'lazy';
  const fallback = document.createElement('span');
  fallback.className = 'nd-fallback';
  fallback.textContent = '🐈';
  fallback.setAttribute('aria-hidden', 'true');
  photo.addEventListener('error', () => { photo.style.display='none'; });
  portrait.append(photo, fallback);
  panel.appendChild(portrait);

  const title = document.createElement('h2');
  title.className = 'nd-title';
  title.id = 'nemo-door-title';
  title.textContent = '🐾 ねもの扉';
  const message = document.createElement('p');
  message.className = 'nd-message';
  message.textContent = '「ほかの世界も、のぞいてみる？」';
  const sub = document.createElement('p');
  sub.className = 'nd-submsg';
  sub.textContent = '好きなところへ、好きなときに。';
  panel.append(title, message, sub);

  const links = document.createElement('nav');
  links.className = 'nd-links';
  links.setAttribute('aria-label','ねもの世界への行き先');
  for (const destination of destinations) {
    const link = document.createElement('a');
    link.className = 'nd-link';
    link.href = destination.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const icon = document.createElement('span');
    icon.className = 'nd-icon';
    icon.textContent = destination.icon;
    icon.setAttribute('aria-hidden','true');
    const info = document.createElement('span');
    info.className = 'nd-link-body';
    const name = document.createElement('span');
    name.className = 'nd-link-title';
    name.textContent = destination.title;
    const detail = document.createElement('span');
    detail.className = 'nd-link-sub';
    detail.textContent = destination.sub;
    info.append(name, detail);
    const arrow = document.createElement('span');
    arrow.className = 'nd-arrow';
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden','true');
    link.append(icon, info, arrow);
    links.appendChild(link);
  }
  panel.appendChild(links);

  const returnBtn = document.createElement('button');
  returnBtn.className = 'nd-return';
  returnBtn.type = 'button';
  returnBtn.textContent = 'この世界に戻る';
  const note = document.createElement('p');
  note.className = 'nd-note';
  note.textContent = '行き先は別タブで開きます';
  panel.append(returnBtn, note);
  backdrop.appendChild(panel);
  root.append(launch, backdrop);
  document.body.appendChild(root);

  let oldFocus = null;
  const focusableSelector = 'button:not([disabled]),a[href]';
  function openDoor() {
    oldFocus = document.activeElement;
    backdrop.classList.add('nd-open');
    backdrop.setAttribute('aria-hidden','false');
    launch.setAttribute('aria-expanded','true');
    close.focus();
  }
  function closeDoor() {
    backdrop.classList.remove('nd-open');
    backdrop.setAttribute('aria-hidden','true');
    launch.setAttribute('aria-expanded','false');
    if (oldFocus && typeof oldFocus.focus === 'function') oldFocus.focus();
    else launch.focus();
  }
  launch.addEventListener('click', openDoor);
  close.addEventListener('click', closeDoor);
  returnBtn.addEventListener('click', closeDoor);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeDoor(); });
  // Keep the dialog usable with a keyboard, without modifying game-wide handlers.
  document.addEventListener('keydown', e => {
    if (!backdrop.classList.contains('nd-open')) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closeDoor(); return; }
    if (e.key !== 'Tab') return;
    const items = Array.from(panel.querySelectorAll(focusableSelector));
    if (!items.length) return;
    const first=items[0],last=items[items.length-1];
    if (e.shiftKey && document.activeElement===first) {e.preventDefault();last.focus();}
    else if (!e.shiftKey && document.activeElement===last) {e.preventDefault();first.focus();}
  }, true);
})();
