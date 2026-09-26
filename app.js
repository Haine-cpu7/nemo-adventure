const STORAGE = {
  history: 'nemoRogueHistoryV2',
  discoveredLoot: 'nemoRogueLootV2',
  titles: 'nemoRogueTitlesV2',
};

const COLLECTION_SLUG = 'nemocollection2023';
const OPENSEA_AUTH_URL = 'https://api.opensea.io/api/v2/auth/keys';
const OPENSEA_ACCOUNT_NFTS_URL = 'https://api.opensea.io/api/v2/chain/{chain}/account/{address}/nfts';
const NEMO_SHARED_CONTRACT = '0x2953399124f0cbb46d2cbacd8a89cf0599974963';
const POLYGON_CHAIN_ID = '0x89';

const NEMOS = [
  { id: 'sakura', name: 'さくらねも', image: 'assets/sakura-nemo.webp', desc: 'おだやかで安定感のあるバランス型。休憩や回復が少し得意。', perk: 'balance', badge: '回復 +1 / げんき 11' },
  { id: 'mecha', name: 'メカねも', image: 'assets/mecha-nemo.webp', desc: '気になるものは分析したい探索型。珍しい拾いものに強い。', perk: 'rare', badge: 'レア発見 +' },
  { id: 'pink', name: 'ぴんくねも', image: 'assets/pink-nemo.webp', desc: 'なんとなく運がいい幸運型。ときどき追加のおみやげを見つける。', perk: 'lucky', badge: 'おまけ発見あり' },
  { id: 'cheerful', name: 'ちあふるねも', image: 'assets/cheerful-nemo.webp', desc: '元気いっぱいの前進型。少しくらい疲れてもまだ進める。', perk: 'stamina', badge: '最大げんき 12' },
  { id: 'quiet', name: 'しずかねも', image: 'assets/quiet-nemo.webp', desc: '周囲をよく見て進む安全型。危ない場面でダメージを抑えやすい。', perk: 'guard', badge: 'ダメージ軽減' },
];

const DUNGEONS = [
  { id: 'forest', name: 'どんぐりの森', icon: '🌲', difficulty: 1, desc: 'やさしい森。落としものと小さな出会いが多い。' },
  { id: 'warehouse', name: '古い倉庫', icon: '📦', difficulty: 2, desc: '箱、ほこり、忘れもの。妙なものが眠っている。' },
  { id: 'onsen', name: '忘れられた温泉洞', icon: '♨️', difficulty: 3, desc: '湯気の向こうに古い道。ねもの世界の秘密に近い。' },
  { id: 'archive', name: '記録者の地下回廊', icon: '📚', difficulty: 4, desc: 'Nemo Holderだけに開く深層。古い記録と王家の痕跡が眠る。', holderOnly: true },
];

const LOOT = [
  { id: 'acorn', name: 'どんぐり', icon: '🌰', rarity: 1, desc: '森でよく拾う。ねもはなぜか捨てない。' },
  { id: 'blue-stone', name: '青い石', icon: '🔹', rarity: 1, desc: '陽に透かすと、少しだけ青く光る。' },
  { id: 'button', name: '古いボタン', icon: '🔘', rarity: 1, desc: 'どこかの服についていたらしい。' },
  { id: 'ticket', name: '古い切符', icon: '🎫', rarity: 2, desc: '行き先の文字だけが消えている。' },
  { id: 'star', name: '星の欠片', icon: '✨', rarity: 2, desc: '石なのに、暗いところでかすかに光る。' },
  { id: 'key', name: '小さな鍵', icon: '🗝️', rarity: 2, desc: '何の鍵かはまだわからない。' },
  { id: 'bell', name: '錆びた鈴', icon: '🔔', rarity: 2, desc: '振ると、とても小さな音がする。' },
  { id: 'gold-bun', name: '黄金の肉まん', icon: '🥟', rarity: 3, desc: '食べていいのか飾るべきなのか、永遠の難題。' },
  { id: 'crest', name: '王家の紋章片', icon: '👑', rarity: 3, desc: '古い紋章の一部。どこの王家なのだろう。' },
  { id: 'manuscript', name: '読めない古文書', icon: '📜', rarity: 3, desc: '「記録者」という文字だけが読める。' },
  { id: 'moon-key', name: '月色の鍵', icon: '🌙', rarity: 3, desc: '月明かりの下でだけ輪郭がはっきりする。' },
  { id: 'memory-glass', name: '記憶の硝子', icon: '💠', rarity: 3, desc: '覗くと、自分ではない誰かの景色が一瞬見える。' },
  { id: 'record-key', name: '記録者の鍵', icon: '🗝️', rarity: 4, holderOnly: true, desc: '普通の扉には合わない。何かを「開く」ための鍵らしい。' },
  { id: 'royal-thread', name: '王家の糸飾り', icon: '🎗️', rarity: 4, holderOnly: true, desc: '色褪せているのに、青と桃色だけが不思議と残っている。' },
  { id: 'star-seal', name: '星待ちの封蝋', icon: '✉️', rarity: 4, holderOnly: true, desc: '封は切られている。誰かが一度、ここに辿り着いた。' },
];

const TITLES = [
  { id: 'first-step', name: 'はじめの一歩', desc: 'はじめて冒険から帰ってきた。', test: s => s.runs >= 1 },
  { id: 'returner', name: '帰るのも冒険', desc: '自分の判断で途中帰還した。', test: s => s.manualReturns >= 1 },
  { id: 'deep', name: '奥まで行ったねも', desc: '8部屋を踏破した。', test: s => s.clears >= 1 },
  { id: 'collector', name: '拾いもの係', desc: 'おみやげを6種類見つけた。', test: s => s.discovered >= 6 },
  { id: 'archivist', name: '小さな記録者', desc: '冒険を10回記録した。', test: s => s.runs >= 10 },
  { id: 'mystery', name: '秘密に触れたねも', desc: '王家か記録者に関わる品を持ち帰った。', test: s => s.hasLoreLoot },
  { id: 'holder-step', name: 'ねもと一緒に', desc: '自分のNFTねもで冒険した。', test: s => s.holderRuns >= 1 },
  { id: 'beyond-eight', name: '境界の向こう', desc: 'NFTねもでROOM 12まで到達した。', test: s => s.deep12 >= 1 },
  { id: 'underground-archive', name: '記録者の客人', desc: '記録者の地下回廊を踏破した。', test: s => s.archiveClears >= 1 },
];

const COMMON_EVENTS = [
  { type: 'loot', icon: '🎁', kicker: '宝箱', title: '小さな箱を見つけた', text: 'ふたには古い傷がある。ねもは耳をぴんと立てた。', choices: [{ label: 'そっと開ける', effect: 'loot' }, { label: 'まわりを調べてから開ける', effect: 'safeLoot' }] },
  { type: 'food', icon: '🥟', kicker: '休憩', title: '湯気の出る包みを発見', text: 'どう見ても肉まん。なぜここにあるのかは考えないことにした。', choices: [{ label: '食べる', effect: 'heal' }, { label: '持って帰る', effect: 'foodLoot' }] },
  { type: 'hedgehog', icon: '🦔', kicker: '遭遇', title: '大きなハリネズミが道をふさいだ', text: '敵意はなさそうだが、退く気もなさそうだ。ねもと無言で見つめ合っている。', choices: [{ label: 'そっと横を通る', effect: 'guard' }, { label: 'どんぐりで気をそらす', effect: 'clever' }] },
  { type: 'nap', icon: '💤', kicker: 'ひとやすみ', title: 'ちょうどいい場所がある', text: 'ここで少し休めば元気が戻りそう。でも奥も気になる。', choices: [{ label: '3分だけ休む', effect: 'smallHeal' }, { label: 'まだ進める', effect: 'pushOn' }] },
];

const DUNGEON_EVENTS = {
  forest: [
    { type: 'forest-stream', icon: '💧', kicker: '小川', title: 'きれいな小川に出た', text: '水面に何か青いものが見える。石かもしれない。魚かもしれない。', choices: [{ label: '手を入れて探す', effect: 'forestFind' }, { label: '水だけ飲んで進む', effect: 'smallHeal' }] },
    { type: 'forest-acorns', icon: '🌰', kicker: 'どんぐり', title: 'どんぐりが大量に落ちている', text: '拾う必要はない。でもねもは少しうれしそう。', choices: [{ label: 'いちばん丸いのを拾う', effect: 'acorn' }, { label: '写真だけ撮る', effect: 'forestPhoto' }] },
    { type: 'forest-hole', icon: '🕳️', kicker: '寄り道', title: '木の根元に小さな穴がある', text: 'ねもなら入れそう。たぶん。ぎりぎり。', choices: [{ label: 'のぞくだけ', effect: 'safeLoot' }, { label: 'ちょっと入ってみる', effect: 'riskLoot' }] },
  ],
  warehouse: [
    { type: 'warehouse-boxes', icon: '📦', kicker: '山積み', title: '古い箱が天井近くまで積まれている', text: '一番上の箱だけ、新しい紐で結ばれている。', choices: [{ label: '下の箱から確認する', effect: 'safeLoot' }, { label: '一番上が気になる', effect: 'riskLoot' }] },
    { type: 'warehouse-clock', icon: '🕰️', kicker: '変な時計', title: '止まった時計が突然ひとつ鳴った', text: '時刻は23:17。ねもは時計と目を合わせないことにした。', choices: [{ label: '裏側を調べる', effect: 'mystery' }, { label: '何も見なかったことにする', effect: 'guard' }] },
    { type: 'warehouse-dust', icon: '🫧', kicker: 'ほこり', title: 'ほこりの中に足跡がある', text: '新しい。しかも、ねもの足跡ではない。', choices: [{ label: '足跡をたどる', effect: 'trail' }, { label: '自分の道を進む', effect: 'guard' }] },
  ],
  onsen: [
    { type: 'onsen-steam', icon: '♨️', kicker: '湯気', title: '壁の隙間から温かい湯気が出ている', text: '少し休めそう。でも奥には石造りの通路が続いている。', choices: [{ label: '足湯する', effect: 'bigHeal' }, { label: '奥の通路へ', effect: 'loreRisk' }] },
    { type: 'onsen-wall', icon: '👑', kicker: '古い壁画', title: '壁に見覚えのない紋章が描かれている', text: '長い耳の人物と、小さな王冠。その横に文字が刻まれている。', choices: [{ label: '文字を写しておく', effect: 'loreLoot' }, { label: '触らず観察する', effect: 'mystery' }] },
    { type: 'onsen-dark', icon: '🌘', kicker: '暗闇', title: '先がまったく見えない', text: '奥から、ぽたん、ぽたん、と水の音だけが聞こえる。', choices: [{ label: '壁づたいに進む', effect: 'riskSmall' }, { label: '今日はここまでにする', effect: 'return' }] },
    { type: 'onsen-paper', icon: '📜', kicker: '紙片', title: '濡れていない紙片が落ちている', text: 'こんな湿った洞窟なのに、紙は不思議なくらい乾いている。', choices: [{ label: '拾って持ち帰る', effect: 'loreLoot' }, { label: 'その場で読む', effect: 'mystery' }] },
  ],
  archive: [
    { type: 'archive-shelves', icon: '📚', kicker: '地下書庫', title: '壁一面に古い記録が並んでいる', text: '名前のない背表紙ばかり。そのうち一冊だけ、ねもの足元で少し開いている。', choices: [{ label: '開いてみる', effect: 'holderLoot' }, { label: 'まず棚番号を写す', effect: 'deepLore' }] },
    { type: 'archive-door', icon: '🚪', kicker: '封じた扉', title: '小さな王冠の刻印がある扉', text: '鍵穴はある。でも鍵の形が見たことのないものだ。', choices: [{ label: '鍵穴を調べる', effect: 'holderLoot' }, { label: '扉の文字を読む', effect: 'mystery' }] },
    { type: 'archive-chair', icon: '🪑', kicker: '休憩室', title: '一脚だけ椅子が残っている', text: '埃が積もっていない。さっきまで誰かが座っていたみたいだ。', choices: [{ label: '少し休む', effect: 'deepRest' }, { label: '周囲を探す', effect: 'holderLoot' }] },
    { type: 'archive-thread', icon: '🎗️', kicker: '細い糸', title: '床に桃色と青の糸が落ちている', text: 'ねもはなぜか、それを見てしばらく動かなかった。', choices: [{ label: '大切に持ち帰る', effect: 'holderLoot' }, { label: '場所だけ覚えておく', effect: 'deepLore' }] },
  ],
};

const DEEP_EVENTS = [
  { type: 'deep-gate', icon: '🌌', kicker: '深層', title: '8つ目の部屋の先に、まだ道があった', text: 'ゲストねもには見えなかった扉。自分のねもは迷わずその先を見る。', choices: [{ label: 'さらに奥へ', effect: 'deepLore' }, { label: '扉のそばを探す', effect: 'holderLoot' }] },
  { type: 'deep-star', icon: '✦', kicker: '静かな部屋', title: '天井に星の形の穴がある', text: '差し込んだ光が床の古い印だけを照らしている。', choices: [{ label: '印を写す', effect: 'holderLoot' }, { label: '光の下で休む', effect: 'deepRest' }] },
  { type: 'deep-whisper', icon: '🕯️', kicker: '深層', title: '誰もいないのに紙をめくる音がする', text: '怖くはない。ただ、ここに来るのを待たれていた気がする。', choices: [{ label: '音の方へ行く', effect: 'holderLoot' }, { label: '足跡を確認する', effect: 'deepLore' }] },
];

const TRAITS = ['洞窟慣れ','石ころ収集家','びっくり耐性','慎重派','寄り道名人','肉まん鑑定士','箱を見ると開けたい','温泉好き','帰る判断が早い','暗いところ平気','足跡が気になる','拾いもの上手','深層を知っている'];

const state = {
  playMode: 'guest',
  walletAddress: '',
  holderNfts: [],
  selectedNemo: null,
  selectedDungeon: null,
  hp: 10,
  maxHp: 10,
  maxRooms: 8,
  room: 0,
  loot: [],
  traits: [],
  log: [],
  currentEvent: null,
  finished: false,
  eventMemory: [],
};

const $ = id => document.getElementById(id);
const rarityLabel = rarity => rarity === 4 ? 'HOLDER RELIC' : rarity === 3 ? 'VERY RARE' : rarity === 2 ? 'RARE' : 'COMMON';
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

async function init() {
  renderSetup();
  bindStaticEvents();
  showScreen('setupScreen');
  configureWalletAvailability();
  await restoreAuthorizedWallet();
}

function bindStaticEvents() {
  $('startBtn').addEventListener('click', startAdventure);
  $('continueBtn').addEventListener('click', nextRoom);
  $('returnBtn').addEventListener('click', () => finishAdventure('return'));
  $('againBtn').addEventListener('click', resetRun);
  $('archiveBtn').addEventListener('click', showArchive);
  $('resultArchiveBtn').addEventListener('click', showArchive);
  $('backBtn').addEventListener('click', () => showScreen('setupScreen'));
  $('resetBtn').addEventListener('click', resetAllData);
  $('guestModeBtn').addEventListener('click', () => setPlayMode('guest'));
  $('nftModeBtn').addEventListener('click', () => setPlayMode('holder'));
  $('connectWalletBtn').addEventListener('click', connectWallet);
  $('disconnectWalletBtn').addEventListener('click', disconnectGameWallet);
  $('refreshNftsBtn').addEventListener('click', refreshHolderNfts);
  $('manualVerifyBtn').addEventListener('click', verifyManualToken);
  $('openMetaMaskBtn').addEventListener('click', openInMetaMask);
  document.querySelectorAll('.archive-tab').forEach(btn => btn.addEventListener('click', () => switchArchiveTab(btn.dataset.tab)));
}

function configureWalletAvailability() {
  if (window.ethereum?.request) {
    $('openMetaMaskBtn').classList.add('hidden');
    if (window.ethereum.on) {
      window.ethereum.on('accountsChanged', accounts => {
        if (!accounts?.length) disconnectGameWallet();
        else handleWalletAccount(accounts[0], state.playMode === 'holder');
      });
    }
  } else {
    $('connectWalletBtn').disabled = true;
    $('connectWalletBtn').textContent = 'ブラウザウォレットが見つかりません';
    $('openMetaMaskBtn').classList.remove('hidden');
    $('nftScanStatus').textContent = 'スマホはMetaMaskアプリ内ブラウザで開くと接続できます。';
  }
}

async function restoreAuthorizedWallet() {
  if (!window.ethereum?.request) return;
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts?.[0]) handleWalletAccount(accounts[0], false);
  } catch {}
}

function renderSetup() {
  const stats = computeStats();
  $('playSummary').textContent = `冒険 ${stats.runs}回 · 図鑑 ${stats.discovered}/${LOOT.length}`;
  renderGuestNemos();
  renderHolderNemos();
  renderDungeons();
  updateSelectionSummary();
}

function renderGuestNemos() {
  const nemoGrid = $('nemoGrid');
  nemoGrid.innerHTML = '';
  NEMOS.forEach(nemo => {
    const btn = document.createElement('button');
    btn.className = 'select-card';
    btn.dataset.id = nemo.id;
    btn.innerHTML = `<span class="nemo-card-image-wrap"><img class="nemo-card-image" src="${nemo.image}" alt="${nemo.name}" loading="lazy"></span><span class="card-body"><span class="guest-label">GUEST NEMO</span><span class="card-title">${nemo.name}</span><span class="card-desc">${nemo.desc}</span><span class="card-badge">${nemo.badge}</span></span>`;
    btn.addEventListener('click', () => selectNemo(nemo, btn, '#nemoGrid .select-card'));
    nemoGrid.appendChild(btn);
  });
}

function renderHolderNemos() {
  const grid = $('holderNemoGrid');
  if (!state.walletAddress) {
    grid.innerHTML = '<div class="holder-empty">🔗 まずウォレットを接続してください。</div>';
    $('holderIntroText').textContent = 'ウォレットを接続すると、保有しているNemoCollection2023がここに並びます。';
    return;
  }
  if (!state.holderNfts.length) {
    grid.innerHTML = '<div class="holder-empty">🐾 Nemo NFTの確認待ちです。</div>';
    return;
  }

  $('holderIntroText').textContent = `${state.holderNfts.length}人のねもを確認しました。冒険に連れていく子を選んでください。`;
  grid.innerHTML = '';
  state.holderNfts.forEach(nft => {
    const nemo = {
      id: `nft-${nft.identifier}`,
      name: nft.name || `Nemo #${nft.identifier}`,
      image: nft.image || 'assets/sakura-nemo.webp',
      desc: 'あなたのウォレットで保有を確認したNemo NFT。深層12ROOMとHolder限定ルートに入れます。',
      perk: 'holder',
      badge: 'NFT HOLDER · 深層解放',
      tokenId: nft.identifier,
      contract: nft.contract || NEMO_SHARED_CONTRACT,
    };
    const btn = document.createElement('button');
    btn.className = 'select-card holder-card';
    btn.dataset.id = nemo.id;
    btn.innerHTML = `<span class="nemo-card-image-wrap"><img class="nemo-card-image" src="${escapeHtml(nemo.image)}" alt="${escapeHtml(nemo.name)}" loading="lazy" onerror="this.src='assets/sakura-nemo.webp'"></span><span class="card-body"><span class="guest-label holder-label">NEMO HOLDER</span><span class="card-title">${escapeHtml(nemo.name)}</span><span class="card-desc">Token ID: ${escapeHtml(shortToken(nemo.tokenId))}</span><span class="card-badge">${nemo.badge}</span></span>`;
    btn.addEventListener('click', () => selectNemo(nemo, btn, '#holderNemoGrid .select-card'));
    grid.appendChild(btn);
  });
}

function selectNemo(nemo, btn, selector) {
  state.selectedNemo = nemo;
  document.querySelectorAll(selector).forEach(el => el.classList.toggle('selected', el === btn));
  updateSelectionSummary();
}

function renderDungeons() {
  const grid = $('dungeonGrid');
  grid.innerHTML = '';
  DUNGEONS.forEach(d => {
    const locked = d.holderOnly && state.playMode !== 'holder';
    const btn = document.createElement('button');
    btn.className = `select-card${locked ? ' locked-dungeon' : ''}`;
    btn.dataset.id = d.id;
    btn.disabled = locked;
    const stars = d.difficulty <= 3 ? `${'★'.repeat(d.difficulty)}${'☆'.repeat(3-d.difficulty)}` : '★★★★';
    btn.innerHTML = `${d.holderOnly ? '<span class="holder-ribbon">HOLDER ONLY</span>' : ''}<span class="card-icon">${d.icon}</span><span class="card-title">${d.name}</span><span class="card-desc">難易度 ${stars}<br>${d.desc}</span>`;
    if (!locked) btn.addEventListener('click', () => {
      state.selectedDungeon = d;
      document.querySelectorAll('#dungeonGrid .select-card').forEach(el => el.classList.toggle('selected', el.dataset.id === d.id));
      updateSelectionSummary();
    });
    grid.appendChild(btn);
  });
}

function setPlayMode(mode) {
  state.playMode = mode;
  state.selectedNemo = null;
  state.selectedDungeon = null;
  $('guestModeBtn').classList.toggle('active', mode === 'guest');
  $('nftModeBtn').classList.toggle('active', mode === 'holder');
  $('guestModeBtn').setAttribute('aria-pressed', mode === 'guest' ? 'true' : 'false');
  $('nftModeBtn').setAttribute('aria-pressed', mode === 'holder' ? 'true' : 'false');
  $('guestNemoPanel').classList.toggle('hidden', mode !== 'guest');
  $('holderNemoPanel').classList.toggle('hidden', mode !== 'holder');
  $('walletPanel').classList.toggle('hidden', mode !== 'holder');
  $('modeTopChip').textContent = mode === 'holder' ? 'HOLDER ROUTE' : 'GUEST OPEN';
  $('modeTopChip').classList.toggle('holder-chip', mode === 'holder');
  renderDungeons();
  renderHolderNemos();
  updateSelectionSummary();
  if (mode === 'holder' && state.walletAddress && !state.holderNfts.length) refreshHolderNfts();
}

function updateSelectionSummary() {
  if (state.selectedNemo && state.selectedDungeon) {
    const suffix = state.playMode === 'holder' ? ' · 最大12ROOM' : ' · 最大8ROOM';
    $('selectionSummary').textContent = `${state.selectedNemo.name} × ${state.selectedDungeon.name}${suffix}`;
    $('startBtn').disabled = false;
  } else {
    $('selectionSummary').textContent = state.playMode === 'holder' && !state.walletAddress ? 'ウォレットを接続して、ねもを選んでください' : 'ねもとダンジョンを選んでください';
    $('startBtn').disabled = true;
  }
}

async function connectWallet() {
  if (!window.ethereum?.request) return;
  setScanStatus('ウォレットの接続を確認しています…', 'loading');
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts?.[0]) throw new Error('アカウントを取得できませんでした。');
    handleWalletAccount(accounts[0], true);
  } catch (err) {
    setScanStatus(walletErrorText(err), 'error');
  }
}

function handleWalletAccount(address, scan = true) {
  state.walletAddress = address;
  $('walletStatusChip').textContent = '接続済み';
  $('walletStatusChip').classList.add('connected');
  $('walletAddressText').textContent = shortAddress(address);
  $('walletConnectedBox').classList.remove('hidden');
  $('connectWalletBtn').classList.add('hidden');
  $('disconnectWalletBtn').classList.remove('hidden');
  $('nftModeStatus').textContent = 'CONNECTED';
  $('manualVerifyDetails').classList.remove('hidden');
  renderHolderNemos();
  updateSelectionSummary();
  if (scan) refreshHolderNfts();
}

function disconnectGameWallet() {
  state.walletAddress = '';
  state.holderNfts = [];
  state.selectedNemo = null;
  state.selectedDungeon = null;
  $('walletStatusChip').textContent = '未接続';
  $('walletStatusChip').classList.remove('connected');
  $('walletConnectedBox').classList.add('hidden');
  $('connectWalletBtn').classList.remove('hidden');
  $('disconnectWalletBtn').classList.add('hidden');
  $('nftModeStatus').textContent = 'HOLDER';
  $('manualVerifyDetails').classList.add('hidden');
  $('manualVerifyStatus').textContent = '';
  setScanStatus('ウォレットを接続すると、NemoCollection2023を自動で探します。');
  renderHolderNemos();
  renderDungeons();
  updateSelectionSummary();
}

async function refreshHolderNfts() {
  if (!state.walletAddress) return;
  setScanStatus('Polygon上のNemoCollection2023を確認しています…', 'loading');
  $('refreshNftsBtn').disabled = true;
  try {
    const nfts = await fetchNemoNftsFromOpenSea(state.walletAddress);
    state.holderNfts = dedupeNfts(nfts.map(normalizeOpenSeaNft).filter(Boolean));
    renderHolderNemos();
    if (state.holderNfts.length) {
      setScanStatus(`🔓 Nemo Holder ✓　${state.holderNfts.length}人のねもを確認しました。深層12ROOMが開きました。`, 'success');
    } else {
      setScanStatus('このウォレットではNemoCollection2023を確認できませんでした。別ウォレットの場合は接続先を変更してください。', 'warning');
    }
  } catch (err) {
    setScanStatus('自動取得がうまくいきませんでした。下の「Token IDで確認」を使えます。', 'warning');
    $('manualVerifyStatus').textContent = `自動取得エラー: ${friendlyNetworkError(err)}`;
  } finally {
    $('refreshNftsBtn').disabled = false;
  }
}

async function fetchNemoNftsFromOpenSea(address) {
  const authResponse = await fetch(OPENSEA_AUTH_URL, { method: 'POST', headers: { 'Accept': 'application/json' } });
  if (!authResponse.ok) throw new Error(`OpenSea auth ${authResponse.status}`);
  const auth = await authResponse.json();
  if (!auth.api_key) throw new Error('OpenSea API key unavailable');

  let lastError = null;
  for (const chain of ['polygon', 'matic']) {
    try {
      const all = [];
      let cursor = '';
      for (let page = 0; page < 5; page += 1) {
        const base = OPENSEA_ACCOUNT_NFTS_URL.replace('{chain}', chain).replace('{address}', address);
        const url = new URL(base);
        url.searchParams.set('collection', COLLECTION_SLUG);
        url.searchParams.set('include_auto_hidden', 'true');
        url.searchParams.set('limit', '50');
        if (cursor) url.searchParams.set('next', cursor);
        const response = await fetch(url.toString(), { headers: { 'X-API-KEY': auth.api_key, 'Accept': 'application/json' } });
        if (!response.ok) throw new Error(`OpenSea ${chain} ${response.status}`);
        const data = await response.json();
        all.push(...(Array.isArray(data.nfts) ? data.nfts : []));
        cursor = data.next || '';
        if (!cursor) break;
      }
      return all;
    } catch (err) { lastError = err; }
  }
  throw lastError || new Error('OpenSeaから取得できませんでした。');
}

function normalizeOpenSeaNft(nft) {
  if (!nft) return null;
  const identifier = String(nft.identifier || nft.token_id || '').trim();
  if (!/^\d+$/.test(identifier)) return null;
  return {
    identifier,
    name: nft.name || `Nemo ${shortToken(identifier)}`,
    image: nft.display_image_url || nft.image_url || nft.image || '',
    contract: nft.contract || NEMO_SHARED_CONTRACT,
  };
}

function dedupeNfts(nfts) {
  const seen = new Set();
  return nfts.filter(nft => {
    const key = `${String(nft.contract).toLowerCase()}:${nft.identifier}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function verifyManualToken() {
  const status = $('manualVerifyStatus');
  if (!state.walletAddress) {
    status.textContent = '先にウォレットを接続してください。';
    return;
  }
  const tokenId = parseTokenInput($('tokenIdInput').value);
  if (!tokenId) {
    status.textContent = 'OpenSea URLか、数字だけのToken IDを入力してください。';
    return;
  }
  $('manualVerifyBtn').disabled = true;
  status.textContent = 'Polygon上で保有状況を確認しています…';
  try {
    await ensurePolygonNetwork();
    const balance = await erc1155BalanceOf(state.walletAddress, tokenId);
    if (balance <= 0n) throw new Error('このウォレットはそのToken IDを保有していません。');
    const metadata = await getTokenMetadata(tokenId);
    const nftName = metadata?.name || `Nemo ${shortToken(tokenId.toString())}`;
    if (!/(Nemo\s*2023|NemoCollection2023)/i.test(nftName)) {
      throw new Error('保有は確認できましたが、NemoCollection2023として確認できませんでした。');
    }
    const image = resolveAssetUrl(metadata?.image || metadata?.image_url || '');
    const nft = { identifier: tokenId.toString(), name: nftName, image, contract: NEMO_SHARED_CONTRACT };
    state.holderNfts = dedupeNfts([...state.holderNfts, nft]);
    renderHolderNemos();
    setScanStatus(`🔓 Nemo Holder ✓　${state.holderNfts.length}人のねもを確認しました。`, 'success');
    status.textContent = `確認できました：${nftName}`;
  } catch (err) {
    status.textContent = walletErrorText(err);
  } finally {
    $('manualVerifyBtn').disabled = false;
  }
}

function parseTokenInput(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  let candidate = raw;
  try {
    if (/^https?:\/\//i.test(raw)) {
      const url = new URL(raw);
      candidate = url.pathname.split('/').filter(Boolean).pop() || '';
    }
  } catch {}
  candidate = candidate.replace(/\?.*$/, '').trim();
  if (!/^\d+$/.test(candidate)) return null;
  try { return BigInt(candidate); } catch { return null; }
}

async function ensurePolygonNetwork() {
  if (!window.ethereum?.request) throw new Error('ブラウザウォレットが見つかりません。');
  const current = await window.ethereum.request({ method: 'eth_chainId' });
  if (String(current).toLowerCase() === POLYGON_CHAIN_ID) return;
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: POLYGON_CHAIN_ID }] });
  } catch (err) {
    if (err?.code !== 4902) throw err;
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{ chainId: POLYGON_CHAIN_ID, chainName: 'Polygon', nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 }, rpcUrls: ['https://polygon-rpc.com'], blockExplorerUrls: ['https://polygonscan.com'] }]
    });
  }
}

async function erc1155BalanceOf(address, tokenId) {
  const selector = '00fdd58e';
  const addressWord = address.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const tokenWord = tokenId.toString(16).padStart(64, '0');
  const result = await window.ethereum.request({ method: 'eth_call', params: [{ to: NEMO_SHARED_CONTRACT, data: `0x${selector}${addressWord}${tokenWord}` }, 'latest'] });
  return BigInt(result || '0x0');
}

async function getTokenMetadata(tokenId) {
  const selector = '0e89341c';
  const tokenWord = tokenId.toString(16).padStart(64, '0');
  const result = await window.ethereum.request({ method: 'eth_call', params: [{ to: NEMO_SHARED_CONTRACT, data: `0x${selector}${tokenWord}` }, 'latest'] });
  const uri = decodeAbiString(result).replace(/\{id\}/gi, tokenWord.toLowerCase());
  return fetchJsonUri(uri);
}

function decodeAbiString(hex) {
  const clean = String(hex || '').replace(/^0x/, '');
  if (clean.length < 128) throw new Error('NFT metadata URIを読み取れませんでした。');
  const offset = Number.parseInt(clean.slice(0, 64), 16) * 2;
  const length = Number.parseInt(clean.slice(offset, offset + 64), 16);
  const start = offset + 64;
  const strHex = clean.slice(start, start + length * 2);
  const bytes = new Uint8Array(strHex.match(/.{1,2}/g)?.map(b => Number.parseInt(b, 16)) || []);
  return new TextDecoder().decode(bytes);
}

async function fetchJsonUri(uri) {
  if (!uri) throw new Error('NFT metadata URIが空です。');
  if (uri.startsWith('data:application/json;base64,')) {
    return JSON.parse(atob(uri.split(',')[1]));
  }
  if (uri.startsWith('data:application/json,')) {
    return JSON.parse(decodeURIComponent(uri.split(',').slice(1).join(',')));
  }
  const url = resolveAssetUrl(uri);
  const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!response.ok) throw new Error(`metadata ${response.status}`);
  return response.json();
}

function resolveAssetUrl(uri) {
  const value = String(uri || '').trim();
  if (value.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${value.slice(7).replace(/^ipfs\//, '')}`;
  if (value.startsWith('ar://')) return `https://arweave.net/${value.slice(5)}`;
  return value;
}

function openInMetaMask() {
  const dapp = `${location.host}${location.pathname}${location.search}`;
  location.href = `https://metamask.app.link/dapp/${dapp}`;
}

function setScanStatus(text, type = '') {
  const el = $('nftScanStatus');
  el.textContent = text;
  el.className = `scan-status${type ? ` ${type}` : ''}`;
}

function walletErrorText(err) {
  if (err?.code === 4001) return 'ウォレット側でキャンセルされました。';
  return friendlyNetworkError(err);
}
function friendlyNetworkError(err) {
  const text = String(err?.message || err || '確認できませんでした。');
  if (/Failed to fetch|NetworkError/i.test(text)) return '通信できませんでした。少し待って再確認してください。';
  return text.length > 150 ? `${text.slice(0, 147)}…` : text;
}

function startAdventure() {
  if (!state.selectedNemo || !state.selectedDungeon) return;
  state.maxRooms = state.playMode === 'holder' ? 12 : 8;
  if (state.selectedDungeon.holderOnly && state.playMode !== 'holder') return;
  state.maxHp = state.selectedNemo.perk === 'stamina' ? 12 : state.selectedNemo.perk === 'balance' ? 11 : state.selectedNemo.perk === 'holder' ? 11 : 10;
  state.hp = state.maxHp;
  state.room = 0;
  state.loot = [];
  state.traits = [];
  state.log = [];
  state.eventMemory = [];
  state.finished = false;
  $('adventureTitle').textContent = state.selectedDungeon.name;
  $('adventureModeLabel').textContent = state.playMode === 'holder' ? 'NFT NEMO · HOLDER ROUTE' : '探索中';
  $('nemoName').textContent = state.selectedNemo.name;
  $('activeNemoImage').src = state.selectedNemo.image;
  $('activeNemoImage').alt = state.selectedNemo.name;
  $('roomTotal').textContent = state.maxRooms;
  renderRoomProgress(state.maxRooms);
  setDungeonTheme(state.selectedDungeon.id);
  addLog(`${state.selectedNemo.name}は${state.selectedDungeon.name}へ出発した。`);
  showScreen('adventureScreen');
  nextRoom();
}

function setDungeonTheme(id) { $('sceneCard').className = `scene-card dungeon-${id}`; }
function renderRoomProgress(count = 8) {
  const el = $('roomProgress');
  el.style.gridTemplateColumns = `repeat(${count}, 1fr)`;
  el.innerHTML = Array.from({ length: count }, (_, i) => `<span class="room-dot" data-room="${i + 1}"></span>`).join('');
}
function updateRoomProgress() {
  document.querySelectorAll('.room-dot').forEach((dot, idx) => {
    const room = idx + 1;
    dot.classList.toggle('done', room < state.room);
    dot.classList.toggle('current', room === state.room);
  });
}

function nextRoom() {
  if (state.finished) return;
  state.room += 1;
  $('roomNumber').textContent = state.room;
  updateRoomProgress();
  if (state.room > state.maxRooms) { finishAdventure('clear'); return; }
  const event = pickEvent();
  state.currentEvent = event;
  state.eventMemory.push(event.type);
  state.eventMemory = state.eventMemory.slice(-3);
  renderEvent(event);
}

function pickEvent() {
  let pool = [...COMMON_EVENTS, ...(DUNGEON_EVENTS[state.selectedDungeon.id] || [])];
  if (state.playMode === 'holder' && state.room >= 9) pool = [...DEEP_EVENTS, ...DEEP_EVENTS, ...(DUNGEON_EVENTS[state.selectedDungeon.id] || [])];
  const fresh = pool.filter(event => !state.eventMemory.includes(event.type));
  if (fresh.length >= 3) pool = fresh;
  if (state.room >= 6 && state.selectedDungeon.id === 'onsen') pool = [...pool, ...DUNGEON_EVENTS.onsen.filter(e => ['onsen-wall', 'onsen-paper'].includes(e.type))];
  return pool[Math.floor(Math.random() * pool.length)];
}

function renderEvent(event) {
  $('sceneIcon').textContent = event.icon;
  $('sceneKicker').textContent = event.kicker;
  $('sceneTitle').textContent = event.title;
  $('sceneText').textContent = event.text;
  const area = $('choiceArea');
  area.innerHTML = '';
  event.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice.label;
    btn.addEventListener('click', () => resolveChoice(choice.effect));
    area.appendChild(btn);
  });
  $('continueBtn').disabled = true;
  updateHUD();
}

function resolveChoice(effect) {
  let message = '';
  switch (effect) {
    case 'loot': message = gainLoot(false); break;
    case 'safeLoot': if (Math.random() < .12) takeDamage(1); message = gainLoot(Math.random() < .18); break;
    case 'riskLoot': takeDamage(randomInt(0, 2)); message = gainLoot(Math.random() < .32); maybeTrait('箱を見ると開けたい', .32); break;
    case 'foodLoot': state.loot.push({ id: 'bun', name: '肉まん', icon: '🥟', rarity: 1, desc: '食べる前提だったはずのおみやげ。' }); message = '肉まんを大事にしまった。'; maybeTrait('肉まん鑑定士', .45); break;
    case 'heal': heal(3 + (state.selectedNemo.perk === 'balance' ? 1 : 0)); message = 'ねもは肉まんを食べて、ちょっと元気になった。'; maybeTrait('肉まん鑑定士', .35); break;
    case 'smallHeal': heal(2 + (state.selectedNemo.perk === 'balance' ? 1 : 0)); message = 'ほんの少し休んだ。ねもの顔がゆるんだ。'; break;
    case 'bigHeal': heal(4 + (state.selectedNemo.perk === 'balance' ? 1 : 0)); message = '足湯した。冒険中なのに、完全にくつろいでいる。'; maybeTrait('温泉好き', .55); break;
    case 'deepRest': heal(3); message = '深層なのに不思議と落ち着く。ねもは少し元気を取り戻した。'; maybeTrait('深層を知っている', .22); break;
    case 'pushOn': if (Math.random() < .25) takeDamage(1); message = '休まず進んだ。ちょっとだけ眠そう。'; break;
    case 'guard': if (Math.random() < .16) takeDamage(1); message = '慎重に進んだ。大きな事故は起きなかった。'; maybeTrait('慎重派', .35); break;
    case 'riskSmall': takeDamage(randomInt(0, 2)); message = '暗闇をゆっくり進んだ。'; maybeTrait('暗いところ平気', .28); break;
    case 'clever': { const idx = state.loot.findIndex(x => x.id === 'acorn'); if (idx >= 0) { state.loot.splice(idx, 1); message = 'どんぐり作戦は成功した。ハリネズミは満足そうだ。'; } else message = 'どんぐりは無かったので、ねもはゆっくり横を通った。'; maybeTrait('寄り道名人', .22); break; }
    case 'mystery': if (Math.random() < .48) message = gainLoot(true); else { takeDamage(1); message = '読み解こうとして考えすぎた。ねもは少し疲れた。'; } break;
    case 'forestFind': if (Math.random() < .65) message = gainSpecificLoot(['blue-stone', 'star']); else { takeDamage(1); message = '袖だけ濡れた。ねもは納得していない。'; } maybeTrait('石ころ収集家', .3); break;
    case 'acorn': message = gainSpecificLoot(['acorn']); break;
    case 'forestPhoto': message = 'どんぐりの山を記録した。持ち帰らない勇気もある。'; maybeTrait('帰る判断が早い', .08); break;
    case 'trail': if (Math.random() < .55) message = gainLoot(true); else { takeDamage(1); message = '足跡は途中で消えていた。少しぞわっとした。'; } maybeTrait('足跡が気になる', .5); break;
    case 'loreRisk': takeDamage(randomInt(0, 2)); message = Math.random() < .55 ? gainLoreLoot() : '古い通路は途中で崩れていた。今日はここまで。'; break;
    case 'loreLoot': message = gainLoreLoot(); break;
    case 'holderLoot': message = gainHolderLoot(); maybeTrait('深層を知っている', .28); break;
    case 'deepLore': message = Math.random() < .62 ? gainHolderLoot() : gainLoreLoot(); maybeTrait('深層を知っている', .35); break;
    case 'return': finishAdventure('return'); return;
  }
  addLog(message);
  maybeLuckyBonus();
  maybeRandomTrait();
  renderAfterChoice(message);
  if (state.hp <= 0) setTimeout(() => finishAdventure('tired'), 250);
}

function renderAfterChoice(message) {
  $('sceneKicker').textContent = '結果';
  $('sceneTitle').textContent = message;
  $('sceneText').textContent = state.hp <= 0 ? 'ねもは床にぺたんと座った。「今日はもう帰る」と顔に書いてある。' : getAfterText();
  $('choiceArea').innerHTML = '';
  $('continueBtn').disabled = state.hp <= 0;
  updateHUD();
}
function getAfterText() {
  const texts = ['ねもは次へ進むか、今日は帰るか考えている。','少しだけ立ち止まって、持ち物を確認した。','奥から何か音がする。でも気のせいかもしれない。','ねもは一度だけ後ろを振り返った。帰り道はちゃんと覚えている。'];
  return texts[Math.floor(Math.random() * texts.length)];
}

function gainLoot(forceRare = false) {
  let candidates;
  const rareBoost = (state.selectedNemo.perk === 'rare' && Math.random() < .3) || (state.playMode === 'holder' && Math.random() < .12);
  if (forceRare || rareBoost) candidates = LOOT.filter(x => x.rarity >= 2 && !x.holderOnly);
  else candidates = LOOT.filter(x => x.rarity <= 2 && !x.holderOnly);
  const item = { ...candidates[Math.floor(Math.random() * candidates.length)] };
  state.loot.push(item);
  maybeTrait('拾いもの上手', .16);
  return `${item.icon} ${item.name}を見つけた。`;
}
function gainSpecificLoot(ids) {
  const candidates = LOOT.filter(x => ids.includes(x.id));
  const item = { ...candidates[Math.floor(Math.random() * candidates.length)] };
  state.loot.push(item);
  return `${item.icon} ${item.name}を見つけた。`;
}
function gainLoreLoot() {
  const loreIds = ['crest', 'manuscript', 'moon-key', 'memory-glass'];
  const candidates = LOOT.filter(x => loreIds.includes(x.id));
  const item = { ...candidates[Math.floor(Math.random() * candidates.length)] };
  state.loot.push(item);
  return `${item.icon} ${item.name}を見つけた。なんだか普通の拾いものではなさそうだ。`;
}
function gainHolderLoot() {
  if (state.playMode !== 'holder') return gainLoreLoot();
  const candidates = LOOT.filter(x => x.holderOnly);
  const item = { ...candidates[Math.floor(Math.random() * candidates.length)] };
  state.loot.push(item);
  return `${item.icon} ${item.name}を見つけた。自分のねもだから辿り着けた場所にあった。`;
}
function maybeLuckyBonus() {
  if (state.selectedNemo?.perk !== 'lucky' || Math.random() >= .16) return;
  const candidates = LOOT.filter(x => x.rarity === 1);
  const item = { ...candidates[Math.floor(Math.random() * candidates.length)] };
  state.loot.push(item);
  addLog(`🍀 幸運のおまけ：${item.icon} ${item.name}も見つけた。`);
}
function takeDamage(amount) { if (state.selectedNemo.perk === 'guard' && amount > 0 && Math.random() < .55) amount = Math.max(0, amount - 1); state.hp = Math.max(0, state.hp - amount); }
function heal(amount) { state.hp = Math.min(state.maxHp, state.hp + amount); }
function maybeTrait(name, chance) { if (Math.random() < chance && !state.traits.includes(name)) state.traits.push(name); }
function maybeRandomTrait() { if (Math.random() < .11) { const candidates = TRAITS.filter(t => !state.traits.includes(t)); if (candidates.length) state.traits.push(candidates[Math.floor(Math.random() * candidates.length)]); } }
function addLog(text) { state.log.unshift(`ROOM ${Math.max(state.room, 1)}｜${text}`); state.log = state.log.slice(0, 10); renderMiniLog(); }

function updateHUD() {
  const ratio = Math.max(0, state.hp / state.maxHp) * 100;
  $('hpFill').style.width = `${ratio}%`;
  $('hpText').textContent = `${state.hp} / ${state.maxHp}`;
  $('nemoMood').textContent = state.hp >= state.maxHp * .7 ? 'ごきげん' : state.hp >= state.maxHp * .35 ? 'ちょっと不安' : '帰りたい';
  renderLoot(); renderTraits();
}
function lootClass(item) { return item.rarity === 4 ? 'loot-item holder-relic' : item.rarity === 3 ? 'loot-item legendary' : item.rarity === 2 ? 'loot-item rare' : 'loot-item'; }
function renderLoot() {
  const el = $('lootList');
  if (!state.loot.length) { el.className = 'loot-list empty'; el.textContent = 'まだ何も拾っていない'; return; }
  el.className = 'loot-list';
  el.innerHTML = state.loot.map(x => `<div class="${lootClass(x)}">${x.icon} ${x.name}</div>`).join('');
}
function renderTraits() {
  const el = $('traitList');
  if (!state.traits.length) { el.className = 'tag-list empty'; el.textContent = 'まだ特性はない'; return; }
  el.className = 'tag-list'; el.innerHTML = state.traits.map(x => `<span class="tag">${x}</span>`).join('');
}
function renderMiniLog() { $('miniLog').innerHTML = state.log.map(x => `<div class="log-item">${x}</div>`).join(''); }

function finishAdventure(reason) {
  if (state.finished) return;
  state.finished = true;
  let title = 'ねもは無事に帰ってきました';
  let text = 'きょうの冒険も、ちゃんと思い出になりました。';
  let icon = '🐾';
  if (reason === 'clear') {
    title = state.playMode === 'holder' && state.maxRooms === 12 ? 'ねもは深層から帰ってきた！' : 'ねもは奥までたどり着いた！';
    text = state.playMode === 'holder' ? '自分のねもだけが見た、8つ目の部屋の向こう側。その記録もちゃんと残った。' : 'ちょっと得意げな顔で帰ってきた。明日には忘れているかもしれない。';
    icon = state.playMode === 'holder' ? '🌌' : '🏕️';
    maybeTrait('洞窟慣れ', .7);
  } else if (reason === 'tired') {
    title = 'ねもは疲れたので帰ってきました'; text = '倒れたわけではない。今日はもう十分だっただけ。'; icon = '🛌'; maybeTrait('帰る判断が早い', .6);
  } else {
    title = 'ねもは自分の判断で帰ってきました'; text = '冒険は、奥まで行くことだけが正解ではありません。'; icon = '🏡'; maybeTrait('帰る判断が早い', .25);
  }

  const record = {
    id: Date.now(), date: new Date().toLocaleString('ja-JP'), nemo: state.selectedNemo.name, nemoId: state.selectedNemo.id,
    nemoImage: state.selectedNemo.image, tokenId: state.selectedNemo.tokenId || '', playMode: state.playMode,
    dungeon: state.selectedDungeon.name, dungeonId: state.selectedDungeon.id, rooms: Math.min(state.room, state.maxRooms), maxRooms: state.maxRooms,
    reason, loot: state.loot, traits: state.traits,
  };

  const oldTitles = new Set(getSavedArray(STORAGE.titles));
  saveRecord(record); saveDiscoveredLoot(state.loot); const newlyUnlocked = updateTitles(); renderSetup();
  $('resultNemoImage').src = state.selectedNemo.image; $('resultNemoImage').alt = state.selectedNemo.name;
  $('resultIcon').textContent = icon; $('resultTitle').textContent = title; $('resultText').textContent = text;
  $('resultLoot').innerHTML = state.loot.length ? state.loot.map(x => `<div class="${lootClass(x)}">${x.icon} ${x.name}</div>`).join('') : '<div class="empty">手ぶら。でも無事。</div>';
  $('resultTraits').innerHTML = state.traits.length ? state.traits.map(x => `<span class="tag">${x}</span>`).join('') : '<div class="empty">今回は新しい特性なし</div>';
  const badge = $('resultTitleBadge');
  const actualNew = newlyUnlocked.filter(id => !oldTitles.has(id));
  if (actualNew.length) { const unlockedTitle = TITLES.find(t => t.id === actualNew[0]); badge.textContent = `🏷️ 新しい称号「${unlockedTitle.name}」`; badge.classList.remove('hidden'); }
  else badge.classList.add('hidden');
  showScreen('resultScreen');
}

function saveRecord(record) { const records = getRecords(); records.unshift(record); localStorage.setItem(STORAGE.history, JSON.stringify(records.slice(0, 80))); }
function getRecords() { return getSavedArray(STORAGE.history); }
function getSavedArray(key) { try { const parsed = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function saveDiscoveredLoot(items) { const discovered = new Set(getSavedArray(STORAGE.discoveredLoot)); items.filter(x => LOOT.some(l => l.id === x.id)).forEach(x => discovered.add(x.id)); localStorage.setItem(STORAGE.discoveredLoot, JSON.stringify([...discovered])); }

function computeStats() {
  const records = getRecords();
  const discovered = getSavedArray(STORAGE.discoveredLoot);
  const hasLoreLoot = discovered.some(id => ['crest','manuscript','moon-key','memory-glass','record-key','royal-thread','star-seal'].includes(id));
  return {
    runs: records.length,
    clears: records.filter(r => r.reason === 'clear').length,
    manualReturns: records.filter(r => r.reason === 'return').length,
    deepest: records.reduce((m, r) => Math.max(m, Number(r.rooms) || 0), 0),
    discovered: discovered.length,
    hasLoreLoot,
    holderRuns: records.filter(r => r.playMode === 'holder').length,
    deep12: records.filter(r => r.playMode === 'holder' && Number(r.rooms) >= 12 && r.reason === 'clear').length,
    archiveClears: records.filter(r => r.dungeonId === 'archive' && r.reason === 'clear').length,
  };
}
function updateTitles() { const stats = computeStats(); const unlocked = new Set(getSavedArray(STORAGE.titles)); TITLES.forEach(title => { if (title.test(stats)) unlocked.add(title.id); }); localStorage.setItem(STORAGE.titles, JSON.stringify([...unlocked])); return [...unlocked]; }

function showArchive() { updateTitles(); renderArchive(); switchArchiveTab('treasure'); showScreen('archiveScreen'); }
function renderArchive() {
  const stats = computeStats();
  $('statsGrid').innerHTML = [['冒険した回数',`${stats.runs}回`],['奥まで到達',`${stats.clears}回`],['最深部',`ROOM ${stats.deepest}`],['図鑑',`${stats.discovered}/${LOOT.length}`]].map(([label,value]) => `<div class="stat-card"><strong>${value}</strong><span>${label}</span></div>`).join('');
  const discovered = new Set(getSavedArray(STORAGE.discoveredLoot));
  $('treasureGrid').innerHTML = LOOT.map(item => {
    const open = discovered.has(item.id);
    return `<article class="treasure-card ${open ? '' : 'locked'} ${item.holderOnly ? 'holder-treasure' : ''}">${item.holderOnly ? '<div class="holder-mini">HOLDER</div>' : ''}<div class="big-icon">${open ? item.icon : '❔'}</div><div class="rarity">${rarityLabel(item.rarity)}</div><strong>${open ? item.name : '？？？？？'}</strong><small>${open ? item.desc : item.holderOnly ? 'NFTねもで深層を探索すると見つかるかもしれません。' : 'まだ見つけていないおみやげ。'}</small></article>`;
  }).join('');
  const unlockedTitles = new Set(getSavedArray(STORAGE.titles));
  $('titlesGrid').innerHTML = TITLES.map(title => { const open = unlockedTitles.has(title.id); return `<article class="title-card ${open ? '' : 'locked'}"><strong>${open ? `🏷️ ${title.name}` : '🔒 未取得'}</strong><small>${open ? title.desc : '条件を満たすと、この称号が記録されます。'}</small></article>`; }).join('');
  renderHistory();
}
function switchArchiveTab(tab) { document.querySelectorAll('.archive-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab)); document.querySelectorAll('.archive-panel').forEach(panel => panel.classList.remove('active')); $(`${tab}Panel`).classList.add('active'); }
function renderHistory() {
  const records = getRecords(); const el = $('historyList');
  if (!records.length) { el.innerHTML = '<div class="empty">まだ冒険記録がありません。</div>'; return; }
  el.innerHTML = records.map(r => {
    const loot = r.loot?.length ? r.loot.map(x => `${x.icon}${x.name}`).join(' / ') : 'なし';
    const traits = r.traits?.length ? r.traits.map(x => `<span class="tag">${x}</span>`).join('') : '<span class="empty">特性なし</span>';
    const result = r.reason === 'clear' ? '奥まで到達' : r.reason === 'tired' ? '疲れて帰還' : '自分で帰還';
    const knownNemo = NEMOS.find(n => n.id === r.nemoId); const image = r.nemoImage || knownNemo?.image || '';
    const holder = r.playMode === 'holder' ? '<span class="history-holder">NFT HOLDER</span>' : '';
    return `<article class="history-card"><div class="history-head">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(r.nemo)}" class="history-nemo-image" onerror="this.style.display='none'">` : ''}<div><h3>${escapeHtml(r.nemo)} → ${escapeHtml(r.dungeon)} ${holder}</h3><div class="history-meta">${escapeHtml(r.date)}｜ROOM ${r.rooms}${r.maxRooms ? `/${r.maxRooms}` : ''}｜${result}</div></div></div><p>戦利品：${loot}</p><div class="history-tags">${traits}</div></article>`;
  }).join('');
}

function resetRun() {
  state.selectedNemo = null; state.selectedDungeon = null;
  renderSetup(); updateSelectionSummary(); showScreen('setupScreen');
}
function resetAllData() { if (!confirm('冒険記録・図鑑・称号をすべて消しますか？')) return; Object.values(STORAGE).forEach(key => localStorage.removeItem(key)); resetRun(); }
function showScreen(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shortAddress(address) { const s = String(address || ''); return s.length > 12 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s; }
function shortToken(token) { const s = String(token || ''); return s.length > 18 ? `${s.slice(0, 8)}…${s.slice(-7)}` : s; }

init();
