const STORAGE = {
  history: 'nemoRogueHistoryV2',
  discoveredLoot: 'nemoRogueLootV2',
  titles: 'nemoRogueTitlesV2',
};

const NEMOS = [
  { id: 'curious', name: '好奇心ねも', icon: '🐱', desc: '未知のものが気になる。レア発見に少し強い。', perk: 'rare', badge: 'レア発見 +' },
  { id: 'careful', name: '慎重ねも', icon: '🧭', desc: '危ない気配に敏感。げんきが減りにくい。', perk: 'guard', badge: 'ダメージ軽減' },
  { id: 'foodie', name: '食いしん坊ねも', icon: '🥟', desc: '食べ物を見つけると、いつもより元気になる。', perk: 'food', badge: '食べ物回復 +' },
  { id: 'brave', name: 'がんばりねも', icon: '🎒', desc: '少しくらい怖くても奥へ進む。最大げんきが高い。', perk: 'stamina', badge: '最大げんき +' },
];

const DUNGEONS = [
  { id: 'forest', name: 'どんぐりの森', icon: '🌲', difficulty: 1, desc: 'やさしい森。落としものと小さな出会いが多い。' },
  { id: 'warehouse', name: '古い倉庫', icon: '📦', difficulty: 2, desc: '箱、ほこり、忘れもの。妙なものが眠っている。' },
  { id: 'onsen', name: '忘れられた温泉洞', icon: '♨️', difficulty: 3, desc: '湯気の向こうに古い道。ねもの世界の秘密に近い。' },
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
];

const TITLES = [
  { id: 'first-step', name: 'はじめの一歩', desc: 'はじめて冒険から帰ってきた。', test: s => s.runs >= 1 },
  { id: 'returner', name: '帰るのも冒険', desc: '自分の判断で途中帰還した。', test: s => s.manualReturns >= 1 },
  { id: 'deep', name: '奥まで行ったねも', desc: '8部屋を踏破した。', test: s => s.clears >= 1 },
  { id: 'collector', name: '拾いもの係', desc: 'おみやげを6種類見つけた。', test: s => s.discovered >= 6 },
  { id: 'archivist', name: '小さな記録者', desc: '冒険を10回記録した。', test: s => s.runs >= 10 },
  { id: 'mystery', name: '秘密に触れたねも', desc: '王家か記録者に関わる品を持ち帰った。', test: s => s.hasLoreLoot },
];

const COMMON_EVENTS = [
  {
    type: 'loot', icon: '🎁', kicker: '宝箱', title: '小さな箱を見つけた',
    text: 'ふたには古い傷がある。ねもは耳をぴんと立てた。',
    choices: [
      { label: 'そっと開ける', effect: 'loot' },
      { label: 'まわりを調べてから開ける', effect: 'safeLoot' },
    ]
  },
  {
    type: 'food', icon: '🥟', kicker: '休憩', title: '湯気の出る包みを発見',
    text: 'どう見ても肉まん。なぜここにあるのかは考えないことにした。',
    choices: [
      { label: '食べる', effect: 'heal' },
      { label: '持って帰る', effect: 'foodLoot' },
    ]
  },
  {
    type: 'hedgehog', icon: '🦔', kicker: '遭遇', title: '大きなハリネズミが道をふさいだ',
    text: '敵意はなさそうだが、退く気もなさそうだ。ねもと無言で見つめ合っている。',
    choices: [
      { label: 'そっと横を通る', effect: 'guard' },
      { label: 'どんぐりで気をそらす', effect: 'clever' },
    ]
  },
  {
    type: 'nap', icon: '💤', kicker: 'ひとやすみ', title: 'ちょうどいい場所がある',
    text: 'ここで少し休めば元気が戻りそう。でも奥も気になる。',
    choices: [
      { label: '3分だけ休む', effect: 'smallHeal' },
      { label: 'まだ進める', effect: 'pushOn' },
    ]
  },
];

const DUNGEON_EVENTS = {
  forest: [
    {
      type: 'forest-stream', icon: '💧', kicker: '小川', title: 'きれいな小川に出た',
      text: '水面に何か青いものが見える。石かもしれない。魚かもしれない。',
      choices: [
        { label: '手を入れて探す', effect: 'forestFind' },
        { label: '水だけ飲んで進む', effect: 'smallHeal' },
      ]
    },
    {
      type: 'forest-acorns', icon: '🌰', kicker: 'どんぐり', title: 'どんぐりが大量に落ちている',
      text: '拾う必要はない。でもねもは少しうれしそう。',
      choices: [
        { label: 'いちばん丸いのを拾う', effect: 'acorn' },
        { label: '写真だけ撮る', effect: 'forestPhoto' },
      ]
    },
    {
      type: 'forest-hole', icon: '🕳️', kicker: '寄り道', title: '木の根元に小さな穴がある',
      text: 'ねもなら入れそう。たぶん。ぎりぎり。',
      choices: [
        { label: 'のぞくだけ', effect: 'safeLoot' },
        { label: 'ちょっと入ってみる', effect: 'riskLoot' },
      ]
    },
  ],
  warehouse: [
    {
      type: 'warehouse-boxes', icon: '📦', kicker: '山積み', title: '古い箱が天井近くまで積まれている',
      text: '一番上の箱だけ、新しい紐で結ばれている。',
      choices: [
        { label: '下の箱から確認する', effect: 'safeLoot' },
        { label: '一番上が気になる', effect: 'riskLoot' },
      ]
    },
    {
      type: 'warehouse-clock', icon: '🕰️', kicker: '変な時計', title: '止まった時計が突然ひとつ鳴った',
      text: '時刻は23:17。ねもは時計と目を合わせないことにした。',
      choices: [
        { label: '裏側を調べる', effect: 'mystery' },
        { label: '何も見なかったことにする', effect: 'guard' },
      ]
    },
    {
      type: 'warehouse-dust', icon: '🫧', kicker: 'ほこり', title: 'ほこりの中に足跡がある',
      text: '新しい。しかも、ねもの足跡ではない。',
      choices: [
        { label: '足跡をたどる', effect: 'trail' },
        { label: '自分の道を進む', effect: 'guard' },
      ]
    },
  ],
  onsen: [
    {
      type: 'onsen-steam', icon: '♨️', kicker: '湯気', title: '壁の隙間から温かい湯気が出ている',
      text: '少し休めそう。でも奥には石造りの通路が続いている。',
      choices: [
        { label: '足湯する', effect: 'bigHeal' },
        { label: '奥の通路へ', effect: 'loreRisk' },
      ]
    },
    {
      type: 'onsen-wall', icon: '👑', kicker: '古い壁画', title: '壁に見覚えのない紋章が描かれている',
      text: '長い耳の人物と、小さな王冠。その横に文字が刻まれている。',
      choices: [
        { label: '文字を写しておく', effect: 'loreLoot' },
        { label: '触らず観察する', effect: 'mystery' },
      ]
    },
    {
      type: 'onsen-dark', icon: '🌘', kicker: '暗闇', title: '先がまったく見えない',
      text: '奥から、ぽたん、ぽたん、と水の音だけが聞こえる。',
      choices: [
        { label: '壁づたいに進む', effect: 'riskSmall' },
        { label: '今日はここまでにする', effect: 'return' },
      ]
    },
    {
      type: 'onsen-paper', icon: '📜', kicker: '紙片', title: '濡れていない紙片が落ちている',
      text: 'こんな湿った洞窟なのに、紙は不思議なくらい乾いている。',
      choices: [
        { label: '拾って持ち帰る', effect: 'loreLoot' },
        { label: 'その場で読む', effect: 'mystery' },
      ]
    },
  ],
};

const TRAITS = [
  '洞窟慣れ', '石ころ収集家', 'びっくり耐性', '慎重派', '寄り道名人',
  '肉まん鑑定士', '箱を見ると開けたい', '温泉好き', '帰る判断が早い', '暗いところ平気',
  '足跡が気になる', '拾いもの上手',
];

const state = {
  selectedNemo: null,
  selectedDungeon: null,
  hp: 10,
  maxHp: 10,
  room: 0,
  loot: [],
  traits: [],
  log: [],
  currentEvent: null,
  finished: false,
  eventMemory: [],
};

const $ = id => document.getElementById(id);
const rarityLabel = rarity => rarity === 3 ? 'VERY RARE' : rarity === 2 ? 'RARE' : 'COMMON';

function init() {
  renderSetup();
  bindStaticEvents();
  renderRoomProgress();
  showScreen('setupScreen');
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
  document.querySelectorAll('.archive-tab').forEach(btn => btn.addEventListener('click', () => switchArchiveTab(btn.dataset.tab)));
}

function renderSetup() {
  const stats = computeStats();
  $('playSummary').textContent = `冒険 ${stats.runs}回 · 図鑑 ${stats.discovered}/${LOOT.length}`;

  const nemoGrid = $('nemoGrid');
  nemoGrid.innerHTML = '';
  NEMOS.forEach(nemo => {
    const btn = document.createElement('button');
    btn.className = 'select-card';
    btn.dataset.id = nemo.id;
    btn.innerHTML = `<span class="card-icon">${nemo.icon}</span><span class="card-title">${nemo.name}</span><span class="card-desc">${nemo.desc}</span><span class="card-badge">${nemo.badge}</span>`;
    btn.addEventListener('click', () => {
      state.selectedNemo = nemo;
      document.querySelectorAll('#nemoGrid .select-card').forEach(el => el.classList.toggle('selected', el.dataset.id === nemo.id));
      updateSelectionSummary();
    });
    nemoGrid.appendChild(btn);
  });

  const dungeonGrid = $('dungeonGrid');
  dungeonGrid.innerHTML = '';
  DUNGEONS.forEach(d => {
    const btn = document.createElement('button');
    btn.className = 'select-card';
    btn.dataset.id = d.id;
    btn.innerHTML = `<span class="card-icon">${d.icon}</span><span class="card-title">${d.name}</span><span class="card-desc">難易度 ${'★'.repeat(d.difficulty)}${'☆'.repeat(3-d.difficulty)}<br>${d.desc}</span>`;
    btn.addEventListener('click', () => {
      state.selectedDungeon = d;
      document.querySelectorAll('#dungeonGrid .select-card').forEach(el => el.classList.toggle('selected', el.dataset.id === d.id));
      updateSelectionSummary();
    });
    dungeonGrid.appendChild(btn);
  });
}

function updateSelectionSummary() {
  if (state.selectedNemo && state.selectedDungeon) {
    $('selectionSummary').textContent = `${state.selectedNemo.name} × ${state.selectedDungeon.name}`;
    $('startBtn').disabled = false;
  } else {
    $('selectionSummary').textContent = 'ねもとダンジョンを選んでください';
    $('startBtn').disabled = true;
  }
}

function startAdventure() {
  state.maxHp = state.selectedNemo.perk === 'stamina' ? 12 : 10;
  state.hp = state.maxHp;
  state.room = 0;
  state.loot = [];
  state.traits = [];
  state.log = [];
  state.eventMemory = [];
  state.finished = false;
  $('adventureTitle').textContent = state.selectedDungeon.name;
  $('nemoName').textContent = state.selectedNemo.name;
  setDungeonTheme(state.selectedDungeon.id);
  addLog(`${state.selectedNemo.name}は${state.selectedDungeon.name}へ出発した。`);
  showScreen('adventureScreen');
  nextRoom();
}

function setDungeonTheme(id) {
  $('sceneCard').className = `scene-card dungeon-${id}`;
}

function renderRoomProgress() {
  const el = $('roomProgress');
  el.innerHTML = Array.from({ length: 8 }, (_, i) => `<span class="room-dot" data-room="${i + 1}"></span>`).join('');
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

  if (state.room > 8) {
    finishAdventure('clear');
    return;
  }

  const event = pickEvent();
  state.currentEvent = event;
  state.eventMemory.push(event.type);
  state.eventMemory = state.eventMemory.slice(-3);
  renderEvent(event);
}

function pickEvent() {
  let pool = [...COMMON_EVENTS, ...DUNGEON_EVENTS[state.selectedDungeon.id]];
  const fresh = pool.filter(event => !state.eventMemory.includes(event.type));
  if (fresh.length >= 3) pool = fresh;
  if (state.room >= 6 && state.selectedDungeon.id === 'onsen') {
    pool = [...pool, ...DUNGEON_EVENTS.onsen.filter(e => ['onsen-wall', 'onsen-paper'].includes(e.type))];
  }
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
    case 'safeLoot':
      if (Math.random() < .12) takeDamage(1);
      message = gainLoot(Math.random() < .18);
      break;
    case 'riskLoot':
      takeDamage(randomInt(0, 2));
      message = gainLoot(Math.random() < .32);
      maybeTrait('箱を見ると開けたい', .32);
      break;
    case 'foodLoot':
      state.loot.push({ id: 'bun', name: '肉まん', icon: '🥟', rarity: 1, desc: '食べる前提だったはずのおみやげ。' });
      message = '肉まんを大事にしまった。';
      maybeTrait('肉まん鑑定士', .45);
      break;
    case 'heal':
      heal(state.selectedNemo.perk === 'food' ? 4 : 3);
      message = 'ねもは肉まんを食べて、ちょっと元気になった。';
      maybeTrait('肉まん鑑定士', .35);
      break;
    case 'smallHeal':
      heal(2);
      message = 'ほんの少し休んだ。ねもの顔がゆるんだ。';
      break;
    case 'bigHeal':
      heal(state.selectedNemo.perk === 'food' ? 5 : 4);
      message = '足湯した。冒険中なのに、完全にくつろいでいる。';
      maybeTrait('温泉好き', .55);
      break;
    case 'pushOn':
      if (Math.random() < .25) takeDamage(1);
      message = '休まず進んだ。ちょっとだけ眠そう。';
      break;
    case 'guard':
      if (Math.random() < .16) takeDamage(1);
      message = '慎重に進んだ。大きな事故は起きなかった。';
      maybeTrait('慎重派', .35);
      break;
    case 'riskSmall':
      takeDamage(randomInt(0, 2));
      message = '暗闇をゆっくり進んだ。';
      maybeTrait('暗いところ平気', .28);
      break;
    case 'clever': {
      const acornIndex = state.loot.findIndex(x => x.id === 'acorn');
      if (acornIndex >= 0) {
        state.loot.splice(acornIndex, 1);
        message = 'どんぐり作戦は成功した。ハリネズミは満足そうだ。';
      } else {
        message = 'どんぐりは無かったので、ねもはゆっくり横を通った。';
      }
      maybeTrait('寄り道名人', .22);
      break;
    }
    case 'mystery':
      if (Math.random() < .48) message = gainLoot(true);
      else {
        takeDamage(1);
        message = '読み解こうとして考えすぎた。ねもは少し疲れた。';
      }
      break;
    case 'forestFind':
      if (Math.random() < .65) message = gainSpecificLoot(['blue-stone', 'star']);
      else {
        takeDamage(1);
        message = '袖だけ濡れた。ねもは納得していない。';
      }
      maybeTrait('石ころ収集家', .3);
      break;
    case 'acorn':
      message = gainSpecificLoot(['acorn']);
      break;
    case 'forestPhoto':
      message = 'どんぐりの山を記録した。持ち帰らない勇気もある。';
      maybeTrait('帰る判断が早い', .08);
      break;
    case 'trail':
      if (Math.random() < .55) message = gainLoot(true);
      else {
        takeDamage(1);
        message = '足跡は途中で消えていた。少しぞわっとした。';
      }
      maybeTrait('足跡が気になる', .5);
      break;
    case 'loreRisk':
      takeDamage(randomInt(0, 2));
      message = Math.random() < .55 ? gainLoreLoot() : '古い通路は途中で崩れていた。今日はここまで。';
      break;
    case 'loreLoot':
      message = gainLoreLoot();
      break;
    case 'return':
      finishAdventure('return');
      return;
  }

  addLog(message);
  maybeRandomTrait();
  renderAfterChoice(message);

  if (state.hp <= 0) setTimeout(() => finishAdventure('tired'), 250);
}

function renderAfterChoice(message) {
  $('sceneKicker').textContent = '結果';
  $('sceneTitle').textContent = message;
  $('sceneText').textContent = state.hp <= 0
    ? 'ねもは床にぺたんと座った。「今日はもう帰る」と顔に書いてある。'
    : getAfterText();
  $('choiceArea').innerHTML = '';
  $('continueBtn').disabled = state.hp <= 0;
  updateHUD();
}

function getAfterText() {
  const texts = [
    'ねもは次へ進むか、今日は帰るか考えている。',
    '少しだけ立ち止まって、持ち物を確認した。',
    '奥から何か音がする。でも気のせいかもしれない。',
    'ねもは一度だけ後ろを振り返った。帰り道はちゃんと覚えている。',
  ];
  return texts[Math.floor(Math.random() * texts.length)];
}

function gainLoot(forceRare = false) {
  let candidates;
  const rareBoost = state.selectedNemo.perk === 'rare' && Math.random() < .3;
  if (forceRare || rareBoost) candidates = LOOT.filter(x => x.rarity >= 2);
  else candidates = LOOT.filter(x => x.rarity <= 2);
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
  const item = { ...LOOT.filter(x => loreIds.includes(x.id))[Math.floor(Math.random() * loreIds.length)] };
  state.loot.push(item);
  return `${item.icon} ${item.name}を見つけた。なんだか普通の拾いものではなさそうだ。`;
}

function takeDamage(amount) {
  if (state.selectedNemo.perk === 'guard' && amount > 0 && Math.random() < .55) amount = Math.max(0, amount - 1);
  state.hp = Math.max(0, state.hp - amount);
}
function heal(amount) { state.hp = Math.min(state.maxHp, state.hp + amount); }
function maybeTrait(name, chance) { if (Math.random() < chance && !state.traits.includes(name)) state.traits.push(name); }
function maybeRandomTrait() {
  if (Math.random() < .11) {
    const candidates = TRAITS.filter(t => !state.traits.includes(t));
    if (candidates.length) state.traits.push(candidates[Math.floor(Math.random() * candidates.length)]);
  }
}
function addLog(text) {
  state.log.unshift(`ROOM ${Math.max(state.room, 1)}｜${text}`);
  state.log = state.log.slice(0, 10);
  renderMiniLog();
}

function updateHUD() {
  const ratio = Math.max(0, state.hp / state.maxHp) * 100;
  $('hpFill').style.width = `${ratio}%`;
  $('hpText').textContent = `${state.hp} / ${state.maxHp}`;
  $('nemoMood').textContent = state.hp >= state.maxHp * .7 ? 'ごきげん' : state.hp >= state.maxHp * .35 ? 'ちょっと不安' : '帰りたい';
  renderLoot();
  renderTraits();
}

function lootClass(item) { return item.rarity === 3 ? 'loot-item legendary' : item.rarity === 2 ? 'loot-item rare' : 'loot-item'; }
function renderLoot() {
  const el = $('lootList');
  if (!state.loot.length) {
    el.className = 'loot-list empty';
    el.textContent = 'まだ何も拾っていない';
    return;
  }
  el.className = 'loot-list';
  el.innerHTML = state.loot.map(x => `<div class="${lootClass(x)}">${x.icon} ${x.name}</div>`).join('');
}
function renderTraits() {
  const el = $('traitList');
  if (!state.traits.length) {
    el.className = 'tag-list empty';
    el.textContent = 'まだ特性はない';
    return;
  }
  el.className = 'tag-list';
  el.innerHTML = state.traits.map(x => `<span class="tag">${x}</span>`).join('');
}
function renderMiniLog() { $('miniLog').innerHTML = state.log.map(x => `<div class="log-item">${x}</div>`).join(''); }

function finishAdventure(reason) {
  if (state.finished) return;
  state.finished = true;

  let title = 'ねもは無事に帰ってきました';
  let text = 'きょうの冒険も、ちゃんと思い出になりました。';
  let icon = '🐾';

  if (reason === 'clear') {
    title = 'ねもは奥までたどり着いた！';
    text = 'ちょっと得意げな顔で帰ってきた。明日には忘れているかもしれない。';
    icon = '🏕️';
    maybeTrait('洞窟慣れ', .7);
  } else if (reason === 'tired') {
    title = 'ねもは疲れたので帰ってきました';
    text = '倒れたわけではない。今日はもう十分だっただけ。';
    icon = '🛌';
    maybeTrait('帰る判断が早い', .6);
  } else {
    title = 'ねもは自分の判断で帰ってきました';
    text = '冒険は、奥まで行くことだけが正解ではありません。';
    icon = '🏡';
    maybeTrait('帰る判断が早い', .25);
  }

  const record = {
    id: Date.now(),
    date: new Date().toLocaleString('ja-JP'),
    nemo: state.selectedNemo.name,
    nemoId: state.selectedNemo.id,
    dungeon: state.selectedDungeon.name,
    dungeonId: state.selectedDungeon.id,
    rooms: Math.min(state.room, 8),
    reason,
    loot: state.loot,
    traits: state.traits,
  };

  const oldTitles = new Set(getSavedArray(STORAGE.titles));
  saveRecord(record);
  saveDiscoveredLoot(state.loot);
  const newlyUnlocked = updateTitles();
  renderSetup();

  $('resultIcon').textContent = icon;
  $('resultTitle').textContent = title;
  $('resultText').textContent = text;
  $('resultLoot').innerHTML = state.loot.length
    ? state.loot.map(x => `<div class="${lootClass(x)}">${x.icon} ${x.name}</div>`).join('')
    : '<div class="empty">手ぶら。でも無事。</div>';
  $('resultTraits').innerHTML = state.traits.length
    ? state.traits.map(x => `<span class="tag">${x}</span>`).join('')
    : '<div class="empty">今回は新しい特性なし</div>';

  const badge = $('resultTitleBadge');
  const actualNew = newlyUnlocked.filter(id => !oldTitles.has(id));
  if (actualNew.length) {
    const unlockedTitle = TITLES.find(t => t.id === actualNew[0]);
    badge.textContent = `🏷️ 新しい称号「${unlockedTitle.name}」`;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  showScreen('resultScreen');
}

function saveRecord(record) {
  const records = getRecords();
  records.unshift(record);
  localStorage.setItem(STORAGE.history, JSON.stringify(records.slice(0, 80)));
}
function getRecords() { return getSavedArray(STORAGE.history); }
function getSavedArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function saveDiscoveredLoot(items) {
  const discovered = new Set(getSavedArray(STORAGE.discoveredLoot));
  items.filter(x => LOOT.some(l => l.id === x.id)).forEach(x => discovered.add(x.id));
  localStorage.setItem(STORAGE.discoveredLoot, JSON.stringify([...discovered]));
}

function computeStats() {
  const records = getRecords();
  const discovered = getSavedArray(STORAGE.discoveredLoot);
  const hasLoreLoot = discovered.some(id => ['crest', 'manuscript', 'moon-key', 'memory-glass'].includes(id));
  return {
    runs: records.length,
    clears: records.filter(r => r.reason === 'clear').length,
    manualReturns: records.filter(r => r.reason === 'return').length,
    deepest: records.reduce((m, r) => Math.max(m, Number(r.rooms) || 0), 0),
    discovered: discovered.length,
    hasLoreLoot,
  };
}

function updateTitles() {
  const stats = computeStats();
  const unlocked = new Set(getSavedArray(STORAGE.titles));
  TITLES.forEach(title => { if (title.test(stats)) unlocked.add(title.id); });
  localStorage.setItem(STORAGE.titles, JSON.stringify([...unlocked]));
  return [...unlocked];
}

function showArchive() {
  updateTitles();
  renderArchive();
  switchArchiveTab('treasure');
  showScreen('archiveScreen');
}

function renderArchive() {
  const stats = computeStats();
  $('statsGrid').innerHTML = [
    ['冒険した回数', `${stats.runs}回`],
    ['奥まで到達', `${stats.clears}回`],
    ['最深部', `ROOM ${stats.deepest}`],
    ['図鑑', `${stats.discovered}/${LOOT.length}`],
  ].map(([label, value]) => `<div class="stat-card"><strong>${value}</strong><span>${label}</span></div>`).join('');

  const discovered = new Set(getSavedArray(STORAGE.discoveredLoot));
  $('treasureGrid').innerHTML = LOOT.map(item => {
    const open = discovered.has(item.id);
    return `<article class="treasure-card ${open ? '' : 'locked'}">
      <div class="big-icon">${open ? item.icon : '❔'}</div>
      <div class="rarity">${rarityLabel(item.rarity)}</div>
      <strong>${open ? item.name : '？？？？？'}</strong>
      <small>${open ? item.desc : 'まだ見つけていないおみやげ。'}</small>
    </article>`;
  }).join('');

  const unlockedTitles = new Set(getSavedArray(STORAGE.titles));
  $('titlesGrid').innerHTML = TITLES.map(title => {
    const open = unlockedTitles.has(title.id);
    return `<article class="title-card ${open ? '' : 'locked'}">
      <strong>${open ? `🏷️ ${title.name}` : '🔒 未取得'}</strong>
      <small>${open ? title.desc : '条件を満たすと、この称号が記録されます。'}</small>
    </article>`;
  }).join('');

  renderHistory();
}

function switchArchiveTab(tab) {
  document.querySelectorAll('.archive-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  document.querySelectorAll('.archive-panel').forEach(panel => panel.classList.remove('active'));
  $(`${tab}Panel`).classList.add('active');
}

function renderHistory() {
  const records = getRecords();
  const el = $('historyList');
  if (!records.length) {
    el.innerHTML = '<div class="empty">まだ冒険記録がありません。</div>';
    return;
  }
  el.innerHTML = records.map(r => {
    const loot = r.loot?.length ? r.loot.map(x => `${x.icon}${x.name}`).join(' / ') : 'なし';
    const traits = r.traits?.length ? r.traits.map(x => `<span class="tag">${x}</span>`).join('') : '<span class="empty">特性なし</span>';
    const result = r.reason === 'clear' ? '奥まで到達' : r.reason === 'tired' ? '疲れて帰還' : '自分で帰還';
    return `<article class="history-card">
      <h3>${r.nemo} → ${r.dungeon}</h3>
      <div class="history-meta">${r.date}｜ROOM ${r.rooms}｜${result}</div>
      <p>戦利品：${loot}</p>
      <div class="history-tags">${traits}</div>
    </article>`;
  }).join('');
}

function resetRun() {
  state.selectedNemo = null;
  state.selectedDungeon = null;
  renderSetup();
  updateSelectionSummary();
  showScreen('setupScreen');
}

function resetAllData() {
  if (!confirm('冒険記録・図鑑・称号をすべて消しますか？')) return;
  Object.values(STORAGE).forEach(key => localStorage.removeItem(key));
  resetRun();
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

init();
