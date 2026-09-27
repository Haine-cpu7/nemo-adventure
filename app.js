const STORAGE = {
  history: 'nemoRogueHistoryV2',
  discoveredLoot: 'nemoRogueLootV2',
  titles: 'nemoRogueTitlesV2',
  holderRelicMissStreak: 'nemoRogueHolderRelicMissStreakV1',
};

const BAG_CAPACITY = 5;
const HOLDER_RELIC_PER_RUN = 1;
const HOLDER_RELIC_ATTEMPT_LIMIT = 3;
const HOLDER_RELIC_PITY_AFTER = 3;

const COLLECTION_SLUG = 'nemocollection2023';
const NEMO_API_BASE = String(window.NEMO_API_CONFIG?.baseUrl || '').replace(/\/+$/, '');
const OPENSEA_AUTH_URL = 'https://api.opensea.io/api/v2/auth/keys';
const OPENSEA_ACCOUNT_NFTS_URL = 'https://api.opensea.io/api/v2/chain/{chain}/account/{address}/nfts';
const NEMO_SHARED_CONTRACT = '0x2953399124f0cbb46d2cbacd8a89cf0599974963';
// OpenSea Shared StorefrontのToken ID上位96bitに入っているNemo作成者アドレス。
// 既知のNemoCollection2023 Token IDから一意に復元できる公開情報です。
const NEMO_CREATOR_ADDRESS = '0xd9f57493574c8abc1651a9c0478bdf73324289f4';
const NEMO_MINT_SCAN_MAX = 1024;
const NEMO_MINT_SCAN_CHUNK = 64;
const POLYGON_CHAIN_ID = '0x89';
const METAMASK_CONNECT_ESM = 'https://esm.sh/@metamask/connect-evm@2.1.1?bundle&target=es2022';
const WALLET_SESSION_KEY = 'nemoRogueWalletConnectedV1';
const SUPPORTED_NETWORKS = {
  '0x1': 'https://cloudflare-eth.com',
  '0x89': 'https://polygon-rpc.com',
};

let walletClient = null;
let walletProvider = null;
let walletMode = '';
let walletInitPromise = null;
let walletEventsBound = false;

const NEMOS = [
  { id: 'sakura', name: 'さくらねも', image: 'assets/sakura-nemo.webp', desc: 'おだやかで安定感のあるバランス型。休憩や回復が少し得意。', perk: 'balance', badge: '回復 +1 / げんき 11' },
  { id: 'mecha', name: 'メカねも', image: 'assets/mecha-nemo.webp', desc: '気になるものは分析したい探索型。珍しい拾いものに強い。', perk: 'rare', badge: 'レア発見 +' },
  { id: 'pink', name: 'ぴんくねも', image: 'assets/pink-nemo.webp', desc: 'なんとなく運がいい幸運型。ときどき追加のおみやげを見つける。', perk: 'lucky', badge: 'おまけ発見あり' },
  { id: 'cheerful', name: 'ちあふるねも', image: 'assets/cheerful-nemo.webp', desc: '元気いっぱいの前進型。少しくらい疲れてもまだ進める。', perk: 'stamina', badge: '最大げんき 12' },
  { id: 'quiet', name: 'しずかねも', image: 'assets/quiet-nemo.webp', desc: '周囲をよく見て進む安全型。危ない場面でダメージを抑えやすい。', perk: 'guard', badge: 'ダメージ軽減' },
];

const DUNGEONS = [
  {
    id: 'forest', name: 'どんぐりの森', icon: '🌲', difficulty: 1,
    desc: 'やさしい森。回復が多く、初めての探索や図鑑集め向き。',
    guestRooms: 5, holderRooms: 8, recovery: 1.25, pressure: 0.03, pressureDamage: [1, 1], safePressureFactor: 0.25,
    commonWeight: 2, dungeonWeight: 2, style: '回復多め・初心者向け'
  },
  {
    id: 'warehouse', name: '古い倉庫', icon: '📦', difficulty: 2,
    desc: '箱、罠、忘れもの。安全策と危険な宝箱の判断が重要。',
    guestRooms: 7, holderRooms: 10, recovery: 0.95, pressure: 0.18, pressureDamage: [1, 2], safePressureFactor: 0.55,
    commonWeight: 1, dungeonWeight: 4, style: '選択と罠・宝箱多め'
  },
  {
    id: 'onsen', name: '忘れられた温泉洞', icon: '♨️', difficulty: 3,
    desc: 'ROOM5から危険度が上がる。回復は弱く、深部ほど蒸気と岩場で消耗する。',
    guestRooms: 9, holderRooms: 12, recovery: 0.55, pressure: 0.42, pressureDamage: [1, 2], safePressureFactor: 0.75,
    commonWeight: 1, dungeonWeight: 5, style: '中盤から急に危険・深部は帰還前提'
  },
  {
    id: 'archive', name: '記録者の地下回廊', icon: '📚', difficulty: 5,
    desc: 'Nemo Holderだけに開く最深層。最奥到達は珍しく、途中帰還もひとつの記録になる。',
    holderRooms: 12, recovery: 0.40, pressure: 0.55, pressureDamage: [1, 3], safePressureFactor: 0.90,
    commonWeight: 0, dungeonWeight: 5, style: '極高危険・最奥到達はレア', holderOnly: true
  },
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

  // 星待館へつながる、まだ説明されない拾いもの。
  { id: 'inn-tag', name: '古びた旅館札', icon: '🏷️', rarity: 2, lore: 'inn', loreOnly: true, desc: '文字はかすれている。裏に小さく「星待」とだけ残っている。' },
  { id: 'wet-photo', name: '濡れた写真の切れ端', icon: '📷', rarity: 2, lore: 'inn', loreOnly: true, desc: '知らない建物と、ねもによく似た小さな影が写っている。' },
  { id: 'guestbook-fragment', name: '古い宿帳の紙片', icon: '📖', rarity: 2, lore: 'inn', loreOnly: true, desc: '宿泊客の名前が並ぶ中、一か所だけ黒く塗りつぶされている。' },
  { id: 'oldhall-sign', name: '旧館の案内札', icon: '🚧', rarity: 2, lore: 'inn', loreOnly: true, desc: '「この先 立入禁止」。ずいぶん昔に外されたようだ。' },
  { id: 'kurose-tag', name: '「黒瀬」と書かれた名札', icon: '📛', rarity: 3, lore: 'inn', loreOnly: true, desc: '名字だけが残っている。誰のものだったのだろう。' },
  { id: 'torn-letter', name: '宛名のない手紙', icon: '✉️', rarity: 3, lore: 'inn', loreOnly: true, desc: '「継いでほしかったわけじゃない」――その先は破れている。' },
  { id: 'clock-0451', name: '午前4時51分で止まった時計', icon: '⏱️', rarity: 3, lore: 'inn', loreOnly: true, desc: '壊れている。針は何度動かしても、なぜか4時51分に戻ってしまう。' },
  { id: 'naoto-note', name: '泥のついた紙片', icon: '📝', rarity: 3, lore: 'inn', loreOnly: true, desc: '泥でほとんど読めない。「直人へ」とだけ残っている。' },

  // 王家へつながる断片。ねも自身も意味を知らない。
  { id: 'crest', name: '王家の紋章片', icon: '👑', rarity: 3, lore: 'royal', loreOnly: true, desc: '古い紋章の一部。ねもは知らないはずなのに、しばらく目を離さなかった。' },
  { id: 'manuscript', name: '読めない古文書', icon: '📜', rarity: 3, lore: 'royal', loreOnly: true, desc: 'ほとんど読めない。「記録者」という文字だけが妙にはっきり見える。' },
  { id: 'moon-key', name: '月色の鍵', icon: '🌙', rarity: 3, lore: 'royal', loreOnly: true, desc: '月明かりの下でだけ輪郭がはっきりする。対応する鍵穴はまだ見つからない。' },
  { id: 'memory-glass', name: '記憶の硝子', icon: '💠', rarity: 3, lore: 'royal', loreOnly: true, desc: '覗くと、自分ではない誰かの景色が一瞬だけ見える。' },
  { id: 'burnt-map', name: '焼け焦げた地図', icon: '🗺️', rarity: 3, lore: 'royal', loreOnly: true, desc: '今は存在しない土地が描かれている。中央には、王城らしき印。' },
  { id: 'crown-ornament', name: '小さな冠の飾り', icon: '♛', rarity: 3, lore: 'royal', loreOnly: true, desc: 'ねもの頭には少し大きい。誰かがとても大切に保管していたようだ。' },
  { id: 'unreadable-diary', name: '読めない日記', icon: '📕', rarity: 3, lore: 'royal', loreOnly: true, desc: '文字は読めない。でも「ねも」という名前だけ、なぜか読める。' },
  { id: 'portrait-fragment', name: '古い肖像画の切れ端', icon: '🖼️', rarity: 3, lore: 'royal', loreOnly: true, desc: '顔の部分だけ破れている。衣装は、ねもが着るには少し立派すぎる。' },

  // Holder深層。1回の冒険で持ち帰れるHOLDER RELICは最大1個。
  // minRoomより浅い階層では出現せず、深部ほど発見率が上がる。
  { id: 'record-key', name: '記録者の鍵', icon: '🗝️', rarity: 4, holderOnly: true, lore: 'recorder', loreOnly: true, minRoom: 4, desc: '普通の扉には合わない。裏面に「第七記録」と刻まれている。' },
  { id: 'royal-thread', name: '王家の糸飾り', icon: '🎗️', rarity: 4, holderOnly: true, lore: 'recorder', loreOnly: true, minRoom: 5, desc: '色褪せているのに、青と桃色だけが不思議と残っている。' },
  { id: 'burned-photo', name: '焼けた集合写真', icon: '🖼️', rarity: 4, holderOnly: true, lore: 'recorder', loreOnly: true, minRoom: 6, desc: '端が焼けている。中央の小さな人物だけ、なぜか顔が残っていない。' },
  { id: 'star-seal', name: '星待ちの封蝋', icon: '✉️', rarity: 4, holderOnly: true, lore: 'recorder', loreOnly: true, minRoom: 7, desc: '封は切られている。誰かが一度、ここに辿り着いた。' },
  { id: 'erased-register', name: '名前の消された宿帳', icon: '📖', rarity: 4, holderOnly: true, lore: 'recorder', loreOnly: true, minRoom: 7, desc: '一行だけ丁寧に削られている。消した跡の横に小さな星印がある。' },
  { id: 'recorder-note', name: '記録者のメモ', icon: '🖋️', rarity: 4, holderOnly: true, lore: 'recorder', loreOnly: true, minRoom: 8, desc: '「今日も、彼女は何も知らず笑っていた。――それでいい。」' },
  { id: 'blue-hairpin', name: '青い髪飾り', icon: '🪞', rarity: 4, holderOnly: true, lore: 'recorder', loreOnly: true, minRoom: 8, desc: '古い意匠なのに傷が少ない。ねもが触ると、ほんの少しだけ温かい。' },
  { id: 'to-nemo-slip', name: '「ねもへ」と書かれた紙片', icon: '📝', rarity: 4, holderOnly: true, lore: 'recorder', loreOnly: true, minRoom: 9, desc: '本文は失われている。宛名だけが、今もはっきり残っている。' },
  { id: 'pocket-watch', name: '壊れた懐中時計', icon: '⌚', rarity: 4, holderOnly: true, lore: 'recorder', loreOnly: true, minRoom: 10, desc: '裏蓋に「王女が目覚めるまで」と刻まれている。時計は動かない。' },
  { id: 'record-seal', name: '記録者の封印札', icon: '🔖', rarity: 4, holderOnly: true, lore: 'recorder', loreOnly: true, minRoom: 10, desc: '「開封は継承者のみ」。誰の継承者なのかは書かれていない。' },
  { id: 'empty-crown-case', name: '空の王冠箱', icon: '👑', rarity: 4, holderOnly: true, lore: 'recorder', loreOnly: true, minRoom: 11, desc: '中身は空。柔らかな布に、小さな猫耳のような跡だけが残っている。' },
  { id: 'sealed-box', name: '封印された小箱', icon: '🎁', rarity: 4, holderOnly: true, lore: 'recorder', loreOnly: true, minRoom: 12, desc: '開かない。けれど近づけると、ねもの耳がほんの少し動く。' },
];

const INN_LORE_IDS = LOOT.filter(x => x.lore === 'inn').map(x => x.id);
const ROYAL_LORE_IDS = LOOT.filter(x => x.lore === 'royal').map(x => x.id);
const RECORDER_LORE_IDS = LOOT.filter(x => x.lore === 'recorder').map(x => x.id);


const TITLES = [
  { id: 'first-step', name: 'はじめの一歩', desc: 'はじめて冒険から帰ってきた。', test: s => s.runs >= 1 },
  { id: 'returner', name: '帰るのも冒険', desc: '自分の判断で途中帰還した。', test: s => s.manualReturns >= 1 },
  { id: 'deep', name: '奥まで行ったねも', desc: 'ひとつのダンジョンを最後まで踏破した。', test: s => s.clears >= 1 },
  { id: 'collector', name: '拾いもの係', desc: 'おみやげを6種類見つけた。', test: s => s.discovered >= 6 },
  { id: 'archivist', name: '小さな記録者', desc: '冒険を10回記録した。', test: s => s.runs >= 10 },
  { id: 'mystery', name: '秘密に触れたねも', desc: '説明のつかない古い品を持ち帰った。', test: s => s.hasLoreLoot },
  { id: 'star-inn-fragments', name: '星待ちの忘れもの', desc: '「星待」につながる品を3種類見つけた。', test: s => s.innLore >= 3 },
  { id: 'unknown-crest', name: '知らないはずの紋章', desc: '王家に関わる品を3種類見つけた。', test: s => s.royalLore >= 3 },
  { id: 'watched-record', name: '見守られていた記録', desc: '記録者に関わる品を2種類見つけた。', test: s => s.recorderLore >= 2 },
  { id: 'deep-archive-fragments', name: '深層の断片', desc: 'HOLDER RELICを6種類見つけた。', test: s => s.recorderLore >= 6 },
  { id: 'twelve-records', name: '十二の記録', desc: 'HOLDER RELICを12種類すべて見つけた。', test: s => s.recorderLore >= 12 },
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
    { type: 'forest-luggage-tag', icon: '🏷️', kicker: '落としもの', title: '苔の下から古い木札が出てきた', text: '旅館で使われていた札みたいだ。裏側には、消えかけた二文字がある。', choices: [{ label: '泥を払って持ち帰る', effect: 'item:inn-tag' }, { label: 'その場に戻しておく', effect: 'guard' }] },
  ],
  warehouse: [
    { type: 'warehouse-boxes', icon: '📦', kicker: '山積み', title: '古い箱が天井近くまで積まれている', text: '一番上の箱だけ、新しい紐で結ばれている。', choices: [{ label: '下の箱から確認する', effect: 'safeLoot' }, { label: '一番上が気になる', effect: 'riskLoot' }] },
    { type: 'warehouse-clock', icon: '🕰️', kicker: '変な時計', title: '止まった時計が突然ひとつ鳴った', text: '時刻は23:17。ねもは時計と目を合わせないことにした。', choices: [{ label: '裏側を調べる', effect: 'mystery' }, { label: '何も見なかったことにする', effect: 'guard' }] },
    { type: 'warehouse-dust', icon: '🫧', kicker: 'ほこり', title: 'ほこりの中に足跡がある', text: '新しい。しかも、ねもの足跡ではない。', choices: [{ label: '足跡をたどる', effect: 'trail' }, { label: '自分の道を進む', effect: 'guard' }] },
    { type: 'warehouse-ledger', icon: '📖', kicker: '古い帳面', title: '宿帳らしい帳面が箱の底にある', text: '名前が何列も並んでいる。でも、一か所だけ黒く塗りつぶされている。', choices: [{ label: '外れかけたページを拾う', effect: 'item:guestbook-fragment' }, { label: '黒い部分を光に透かす', effect: 'mystery' }] },
    { type: 'warehouse-oldhall-sign', icon: '🚧', kicker: '古い案内札', title: '壁の裏から「旧館」の文字が出てきた', text: 'その下には「立入禁止」。ずいぶん前に外された札らしい。', choices: [{ label: '札を持ち帰る', effect: 'item:oldhall-sign' }, { label: '裏側だけ確認する', effect: 'innLore' }] },
    { type: 'warehouse-clock-0451', icon: '⏱️', kicker: '小さな時計', title: '引き出しの中に旅行時計がある', text: '針は4時51分で止まっている。ねもが触ると一度だけ秒針が動いた。', choices: [{ label: '持ち帰る', effect: 'item:clock-0451' }, { label: '時刻だけ記録する', effect: 'mystery' }] },
    { type: 'warehouse-name-tag', icon: '📛', kicker: '名札', title: '古い制服のポケットに名札が残っている', text: '読める文字は名字だけ。「黒瀬」。', choices: [{ label: '名札を拾う', effect: 'item:kurose-tag' }, { label: '服はそのままにする', effect: 'guard' }] },
  ],
  onsen: [
    { type: 'onsen-steam', icon: '♨️', kicker: '湯気', title: '壁の隙間から温かい湯気が出ている', text: '少し休めそう。でも奥には石造りの通路が続いている。', choices: [{ label: '足湯する', effect: 'bigHeal' }, { label: '奥の通路へ', effect: 'loreRisk' }] },
    { type: 'onsen-wall', icon: '👑', kicker: '古い壁画', title: '壁に見覚えのない紋章が描かれている', text: '長い耳の人物と、小さな王冠。その横に文字が刻まれている。', choices: [{ label: '文字を写しておく', effect: 'royalLore' }, { label: '触らず観察する', effect: 'mystery' }] },
    { type: 'onsen-dark', icon: '🌘', kicker: '暗闇', title: '先がまったく見えない', text: '奥から、ぽたん、ぽたん、と水の音だけが聞こえる。', choices: [{ label: '壁づたいに進む', effect: 'riskSmall' }, { label: '今日はここまでにする', effect: 'return' }] },
    { type: 'onsen-paper', icon: '📜', kicker: '紙片', title: '濡れていない紙片が落ちている', text: 'こんな湿った洞窟なのに、紙は不思議なくらい乾いている。', choices: [{ label: '拾って持ち帰る', effect: 'loreLoot' }, { label: 'その場で読む', effect: 'mystery' }] },
    { type: 'onsen-photo', icon: '📷', kicker: '写真', title: '岩の隙間に写真の切れ端が挟まっている', text: '建物の前に、小さな影。輪郭だけなら、ねもに少し似ている。', choices: [{ label: '写真を持ち帰る', effect: 'item:wet-photo' }, { label: '裏面を見る', effect: 'innLore' }] },
    { type: 'onsen-letter', icon: '✉️', kicker: '破れた手紙', title: '水に濡れていない手紙が落ちている', text: '「継いでほしかったわけじゃない」。その一文だけが残っている。', choices: [{ label: 'そっとしまう', effect: 'item:torn-letter' }, { label: '続きを探す', effect: 'innLore' }] },
    { type: 'onsen-naoto', icon: '📝', kicker: '泥の跡', title: '通路の端に泥のついた紙片がある', text: 'ほとんど読めない。端に「直人へ」とだけ書かれている。', choices: [{ label: '拾っておく', effect: 'item:naoto-note' }, { label: '泥の足跡を調べる', effect: 'trail' }] },
    { type: 'onsen-map', icon: '🗺️', kicker: '地図', title: '壁の奥から焦げた地図が出てきた', text: '見たことのない土地。中央には、大きな建物の印がある。', choices: [{ label: '地図を持ち帰る', effect: 'item:burnt-map' }, { label: '中央の印だけ写す', effect: 'royalLore' }] },
  ],
  archive: [
    { type: 'archive-shelves', icon: '📚', kicker: '地下書庫', title: '壁一面に古い記録が並んでいる', text: '名前のない背表紙ばかり。そのうち一冊だけ、ねもの足元で少し開いている。', choices: [{ label: '開いてみる', effect: 'holderLoot' }, { label: 'まず棚番号を写す', effect: 'deepLore' }] },
    { type: 'archive-door', minRoom: 4, icon: '🚪', kicker: '封じた扉', title: '小さな王冠の刻印がある扉', text: '鍵穴はある。でも鍵の形が見たことのないものだ。', choices: [{ label: '鍵穴を調べる', effect: 'holderLoot' }, { label: '扉の文字を読む', effect: 'royalLore' }] },
    { type: 'archive-chair', minRoom: 4, icon: '🪑', kicker: '休憩室', title: '一脚だけ椅子が残っている', text: '埃が積もっていない。さっきまで誰かが座っていたみたいだ。', choices: [{ label: '少し休む', effect: 'deepRest' }, { label: '周囲を探す', effect: 'holderLoot' }] },
    { type: 'archive-thread', minRoom: 5, icon: '🎗️', kicker: '細い糸', title: '床に桃色と青の糸が落ちている', text: 'ねもはなぜか、それを見てしばらく動かなかった。', choices: [{ label: '大切に持ち帰る', effect: 'item:royal-thread' }, { label: '場所だけ覚えておく', effect: 'deepLore' }] },
    { type: 'archive-portrait', icon: '🖼️', kicker: '肖像画', title: '布をかぶった古い額縁がある', text: '顔の部分だけが破れている。でも衣装には小さな王冠の意匠がある。', choices: [{ label: '切れ端を拾う', effect: 'item:portrait-fragment' }, { label: '額縁の裏を調べる', effect: 'recorderLore' }] },
    { type: 'archive-diary', icon: '📕', kicker: '読めない本', title: '知らない文字で書かれた日記がある', text: '一行も読めないはずなのに、ねもは一か所だけ指を止めた。', choices: [{ label: 'その本を持ち帰る', effect: 'item:unreadable-diary' }, { label: '指を止めた行だけ写す', effect: 'royalLore' }] },
    { type: 'archive-note', minRoom: 8, icon: '🖋️', kicker: '走り書き', title: '机の引き出しに一枚だけメモがある', text: '「今日も、彼女は何も知らず笑っていた。」その下は墨で消されている。', choices: [{ label: 'メモを持ち帰る', effect: 'item:recorder-note' }, { label: '消された部分を見る', effect: 'recorderLore' }] },
    { type: 'archive-photo-burned', minRoom: 6, icon: '🖼️', kicker: '焦げた写真', title: '棚の裏から焼けた写真が滑り落ちた', text: '何人かが並んでいる。中央だけ、顔の部分が黒く失われている。', choices: [{ label: '写真を拾う', effect: 'item:burned-photo' }, { label: '裏面の文字を見る', effect: 'deepLore' }] },
    { type: 'archive-hairpin', minRoom: 8, icon: '🪞', kicker: '青い飾り', title: '記録箱の底に青い髪飾りがある', text: '誰かが何度も磨いたように、そこだけ埃がない。', choices: [{ label: '持ち帰る', effect: 'item:blue-hairpin' }, { label: '箱の番号を記録する', effect: 'deepLore' }] },
    { type: 'archive-nemo-slip', minRoom: 9, icon: '📝', kicker: '宛名', title: '破れた紙片に「ねもへ」とある', text: '本文はない。ただ、その二文字だけが残っている。', choices: [{ label: '紙片をしまう', effect: 'item:to-nemo-slip' }, { label: '周囲に続きがないか探す', effect: 'recorderLore' }] },
    { type: 'archive-box', minRoom: 12, icon: '🎁', kicker: '封印', title: '棚の奥に小さな箱がある', text: '鍵も継ぎ目もない。でも、ねもが近づくと耳がほんの少し動いた。', choices: [{ label: '箱を持ち帰る', effect: 'item:sealed-box' }, { label: '箱の周りを調べる', effect: 'holderLoot' }] },
  ],
};

const DEEP_EVENTS = [
  { type: 'deep-gate', icon: '🌌', kicker: '深層', title: '8つ目の部屋の先に、まだ道があった', text: 'ゲストねもには見えなかった扉。自分のねもは迷わずその先を見る。', choices: [{ label: 'さらに奥へ', effect: 'deepLore' }, { label: '扉のそばを探す', effect: 'holderLoot' }] },
  { type: 'deep-star', icon: '✦', kicker: '静かな部屋', title: '天井に星の形の穴がある', text: '差し込んだ光が床の古い印だけを照らしている。', choices: [{ label: '印を写す', effect: 'royalLore' }, { label: '光の下で休む', effect: 'deepRest' }] },
  { type: 'deep-whisper', icon: '🕯️', kicker: '深層', title: '誰もいないのに紙をめくる音がする', text: '怖くはない。ただ、ここに来るのを待たれていた気がする。', choices: [{ label: '音の方へ行く', effect: 'recorderLore' }, { label: '足跡を確認する', effect: 'deepLore' }] },
  { type: 'deep-watch', minRoom: 10, icon: '⌚', kicker: '深層の机', title: '壊れた懐中時計が一つだけ置かれている', text: '裏蓋には短い文字。ねもは読まずに、しばらく時計を見ている。', choices: [{ label: '時計を持ち帰る', effect: 'item:pocket-watch' }, { label: '裏蓋の文字だけ記録する', effect: 'recorderLore' }] },
  { type: 'deep-crown', icon: '♛', kicker: '小さな飾り', title: '布の上に小さな冠の飾りが置かれている', text: '誰かが「帰ってくるまで」ここに置いていたように見える。', choices: [{ label: 'そっと持ち帰る', effect: 'item:crown-ornament' }, { label: '触れずに観察する', effect: 'royalLore' }] },
  { type: 'deep-record', icon: '📜', kicker: '第七記録', title: '棚の一角だけ番号の振り方が違う', text: '「第七記録」。その文字を見たとき、ねもが一度だけ後ろを振り返った。', choices: [{ label: '記録を調べる', effect: 'recorderLore' }, { label: '鍵穴を探す', effect: 'item:record-key' }] },
];

const TRAITS = ['洞窟慣れ','石ころ収集家','びっくり耐性','慎重派','寄り道名人','肉まん鑑定士','箱を見ると開けたい','温泉好き','帰る判断が早い','暗いところ平気','足跡が気になる','拾いもの上手','深層を知っている'];

const state = {
  playMode: 'guest',
  walletAddress: '',
  holderNfts: [],
  holderNemoQuery: '',
  holderNemoExpanded: false,
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
  pendingLoot: null,
  pendingLootIsHolderRelic: false,
  holderRelicFound: false,
  holderRelicAttempts: 0,
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
  $('holderNemoSearch')?.addEventListener('input', event => {
    state.holderNemoQuery = String(event.target.value || '');
    state.holderNemoExpanded = false;
    renderHolderNemos();
  });
  $('holderNemoToggleBtn')?.addEventListener('click', () => {
    state.holderNemoExpanded = !state.holderNemoExpanded;
    renderHolderNemos();
  });
  document.querySelectorAll('.archive-tab').forEach(btn => btn.addEventListener('click', () => switchArchiveTab(btn.dataset.tab)));
}

function configureWalletAvailability() {
  // v0.5: Safariなど通常のモバイルブラウザからMetaMask Connectを使う。
  // window.ethereum が無くても接続ボタンは有効のままにする。
  $('connectWalletBtn').disabled = false;
  $('connectWalletBtn').textContent = 'MetaMaskを接続';
  $('openMetaMaskBtn')?.classList.add('hidden');
  $('nftScanStatus').textContent = 'Safariのまま接続できます。接続時だけMetaMaskアプリが開き、承認後はこのゲームへ戻れます。';
}

async function initWalletClient() {
  if (walletClient || walletProvider) return { client: walletClient, provider: walletProvider, mode: walletMode };
  if (walletInitPromise) return walletInitPromise;

  walletInitPromise = (async () => {
    try {
      const mod = await import(METAMASK_CONNECT_ESM);
      if (typeof mod.createEVMClient !== 'function') throw new Error('MetaMask Connectを読み込めませんでした。');
      walletClient = await mod.createEVMClient({
        dapp: {
          name: 'ねも死なないローグライク',
          url: `${location.origin}${location.pathname}`,
        },
        api: { supportedNetworks: SUPPORTED_NETWORKS },
      });
      walletProvider = walletClient.getProvider();
      walletMode = 'metamask-connect';
      bindWalletEvents(walletProvider);
      return { client: walletClient, provider: walletProvider, mode: walletMode };
    } catch (sdkError) {
      // デスクトップ等で拡張機能が注入されている場合の保険。
      if (window.ethereum?.request) {
        walletProvider = window.ethereum;
        walletMode = 'injected-fallback';
        bindWalletEvents(walletProvider);
        return { client: null, provider: walletProvider, mode: walletMode };
      }
      throw sdkError;
    } finally {
      walletInitPromise = null;
    }
  })();

  return walletInitPromise;
}

function bindWalletEvents(provider) {
  if (!provider?.on || walletEventsBound) return;
  walletEventsBound = true;
  provider.on('accountsChanged', accounts => {
    if (!accounts?.length) clearWalletUi();
    else handleWalletAccount(accounts[0], true);
  });
  provider.on('chainChanged', () => {
    if (state.walletAddress) setScanStatus('ネットワークが変更されました。Nemo NFTを再確認できます。');
  });
}

async function restoreAuthorizedWallet() {
  // 明示的に一度接続した端末だけ、既存セッションを静かに復元する。
  if (!localStorage.getItem(WALLET_SESSION_KEY)) return;
  try {
    const { client, provider } = await initWalletClient();
    const savedAccount = client?.getAccount?.();
    if (savedAccount) {
      handleWalletAccount(savedAccount, false);
      return;
    }
    if (provider?.request) {
      const accounts = await provider.request({ method: 'eth_accounts' });
      if (accounts?.[0]) handleWalletAccount(accounts[0], false);
    }
  } catch {
    // 復元に失敗してもゲストプレイには影響させない。
  }
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

function holderNemoFromNft(nft) {
  return {
    id: `nft-${nft.identifier}`,
    name: nft.name || `Nemo #${nft.identifier}`,
    image: nft.image || 'assets/sakura-nemo.webp',
    desc: 'あなたのウォレットで保有を確認したNemo NFT。深層12ROOMとHolder限定ルートに入れます。',
    perk: 'holder',
    badge: 'NFT HOLDER · 深層解放',
    tokenId: nft.identifier,
    contract: nft.contract || NEMO_SHARED_CONTRACT,
  };
}

function renderHolderNemoPreview() {
  const preview = $('holderNemoPreview');
  if (!preview) return;
  const nemo = state.playMode === 'holder' && state.selectedNemo?.perk === 'holder'
    ? state.selectedNemo
    : null;
  preview.classList.toggle('hidden', !nemo);
  if (!nemo) return;
  $('holderPreviewImage').src = nemo.image || 'assets/sakura-nemo.webp';
  $('holderPreviewImage').alt = `${nemo.name} - 選択中`;
  $('holderPreviewName').textContent = nemo.name;
  $('holderPreviewToken').textContent = `Token ID: ${shortToken(nemo.tokenId)}`;
}

function renderHolderNemos() {
  const grid = $('holderNemoGrid');
  const tools = $('holderNemoTools');
  const toggle = $('holderNemoToggleBtn');
  const search = $('holderNemoSearch');
  const meta = $('holderNemoResultMeta');
  const PAGE_SIZE = 12;

  if (!state.walletAddress) {
    tools?.classList.add('hidden');
    toggle?.classList.add('hidden');
    grid.innerHTML = '<div class="holder-empty">🔗 まずウォレットを接続してください。</div>';
    $('holderIntroText').textContent = 'ウォレットを接続すると、保有しているNemoCollection2023がここに並びます。';
    renderHolderNemoPreview();
    return;
  }
  if (!state.holderNfts.length) {
    tools?.classList.add('hidden');
    toggle?.classList.add('hidden');
    grid.innerHTML = '<div class="holder-empty">🐾 Nemo NFTの確認待ちです。</div>';
    renderHolderNemoPreview();
    return;
  }

  tools?.classList.remove('hidden');
  $('holderIntroText').textContent = `${state.holderNfts.length}人のねもを確認しました。冒険に連れていく子を選んでください。`;
  if (search && search.value !== state.holderNemoQuery) search.value = state.holderNemoQuery;

  const query = state.holderNemoQuery.trim().toLowerCase();
  const queryDigits = query.replace(/[^0-9]/g, '');
  const allNemos = state.holderNfts.map(holderNemoFromNft);
  const filtered = allNemos.filter(nemo => {
    if (!query) return true;
    const name = String(nemo.name || '').toLowerCase();
    const token = String(nemo.tokenId || '').toLowerCase();
    return name.includes(query) || token.includes(query) || (queryDigits && (name.includes(queryDigits) || token.includes(queryDigits)));
  });
  const visible = query || state.holderNemoExpanded ? filtered : filtered.slice(0, PAGE_SIZE);

  if (meta) {
    meta.textContent = query
      ? `${filtered.length}人見つかりました`
      : state.holderNfts.length > PAGE_SIZE
        ? `${Math.min(visible.length, filtered.length)} / ${filtered.length}人を表示`
        : `${filtered.length}人`;
  }

  grid.innerHTML = '';
  if (!filtered.length) {
    grid.innerHTML = '<div class="holder-empty">🔎 条件に合うねもが見つかりませんでした。</div>';
  } else {
    visible.forEach(nemo => {
      const btn = document.createElement('button');
      const selected = state.selectedNemo?.id === nemo.id;
      btn.className = `select-card holder-card holder-compact-card${selected ? ' selected' : ''}`;
      btn.dataset.id = nemo.id;
      btn.type = 'button';
      btn.title = `${nemo.name} / Token ID ${nemo.tokenId}`;
      btn.setAttribute('aria-label', `${nemo.name}を冒険に連れていく`);
      btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
      btn.innerHTML = `<span class="nemo-card-image-wrap"><img class="nemo-card-image" src="${escapeHtml(nemo.image)}" alt="${escapeHtml(nemo.name)}" loading="lazy" onerror="this.src='assets/sakura-nemo.webp'"></span><span class="holder-compact-name">${escapeHtml(nemo.name)}</span><span class="holder-selected-mark" aria-hidden="true">✓</span>`;
      btn.addEventListener('click', () => selectNemo(nemo, btn, '#holderNemoGrid .select-card'));
      grid.appendChild(btn);
    });
  }

  if (toggle) {
    const showToggle = !query && filtered.length > PAGE_SIZE;
    toggle.classList.toggle('hidden', !showToggle);
    if (showToggle) {
      toggle.textContent = state.holderNemoExpanded
        ? `最初の${PAGE_SIZE}人に戻す`
        : `すべて表示（${filtered.length}人）`;
    }
  }
  renderHolderNemoPreview();
}

function selectNemo(nemo, btn, selector) {
  state.selectedNemo = nemo;
  document.querySelectorAll(selector).forEach(el => {
    const selected = el === btn;
    el.classList.toggle('selected', selected);
    if (selector.includes('holderNemoGrid')) el.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });
  renderHolderNemoPreview();
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
    const maxStars = 5;
    const stars = `${'★'.repeat(d.difficulty)}${'☆'.repeat(Math.max(0, maxStars - d.difficulty))}`;
    const roomInfo = d.holderOnly
      ? `HOLDER ${d.holderRooms}ROOM`
      : `ゲスト ${d.guestRooms}ROOM / HOLDER ${d.holderRooms}ROOM`;
    btn.innerHTML = `${d.holderOnly ? '<span class="holder-ribbon">HOLDER ONLY</span>' : ''}<span class="card-icon">${d.icon}</span><span class="card-title">${d.name}</span><span class="card-desc">難易度 ${stars}<br><strong>${roomInfo}</strong> · ${d.style}<br>${d.desc}</span>`;
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
    const rooms = getDungeonMaxRooms(state.selectedDungeon, state.playMode);
    const suffix = ` · 最大${rooms}ROOM · ${state.selectedDungeon.style}`;
    $('selectionSummary').textContent = `${state.selectedNemo.name} × ${state.selectedDungeon.name}${suffix}`;
    $('startBtn').disabled = false;
  } else {
    $('selectionSummary').textContent = state.playMode === 'holder' && !state.walletAddress ? 'ウォレットを接続して、ねもを選んでください' : 'ねもとダンジョンを選んでください';
    $('startBtn').disabled = true;
  }
}

async function connectWallet() {
  const button = $('connectWalletBtn');
  button.disabled = true;
  button.textContent = 'MetaMaskを開いています…';
  setScanStatus('MetaMaskで接続を承認してください。承認後、このブラウザに戻ります。', 'loading');

  try {
    const { client, provider } = await initWalletClient();
    let accounts = [];

    if (client) {
      const result = await client.connect({ chainIds: [POLYGON_CHAIN_ID] });
      accounts = result?.accounts || [];
    } else if (provider?.request) {
      accounts = await provider.request({ method: 'eth_requestAccounts' });
    }

    if (!accounts?.[0]) throw new Error('アカウントを取得できませんでした。');
    localStorage.setItem(WALLET_SESSION_KEY, accounts[0]);
    handleWalletAccount(accounts[0], true);
  } catch (err) {
    setScanStatus(walletErrorText(err), 'error');
  } finally {
    if (!state.walletAddress) {
      button.disabled = false;
      button.textContent = 'MetaMaskを接続';
    }
  }
}

function handleWalletAccount(address, scan = true) {
  state.walletAddress = address;
  localStorage.setItem(WALLET_SESSION_KEY, address);
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

async function disconnectGameWallet() {
  try {
    if (walletClient?.disconnect) await walletClient.disconnect();
  } catch {}
  localStorage.removeItem(WALLET_SESSION_KEY);
  clearWalletUi();
}

function clearWalletUi() {
  state.walletAddress = '';
  state.holderNfts = [];
  state.holderNemoQuery = '';
  state.holderNemoExpanded = false;
  state.selectedNemo = null;
  state.selectedDungeon = null;
  $('walletStatusChip').textContent = '未接続';
  $('walletStatusChip').classList.remove('connected');
  $('walletConnectedBox').classList.add('hidden');
  $('connectWalletBtn').classList.remove('hidden');
  $('connectWalletBtn').disabled = false;
  $('connectWalletBtn').textContent = 'MetaMaskを接続';
  $('disconnectWalletBtn').classList.add('hidden');
  $('nftModeStatus').textContent = 'HOLDER';
  $('manualVerifyDetails').classList.add('hidden');
  $('manualVerifyStatus').textContent = '';
  setScanStatus('Safariのまま接続できます。接続時だけMetaMaskアプリが開きます。');
  renderHolderNemos();
  renderDungeons();
  updateSelectionSummary();
}

async function refreshHolderNfts() {
  if (!state.walletAddress) return;
  setScanStatus('NemoCollection2023を確認しています…', 'loading');
  $('refreshNftsBtn').disabled = true;
  $('manualVerifyStatus').textContent = '';

  try {
    if (!NEMO_API_BASE) throw new Error('Nemo Holder APIが未設定です。');
    setScanStatus('Nemo Holder API経由で保有NFTを確認しています…', 'loading');
    const backend = await fetchNemoNftsFromBackend(state.walletAddress);
    state.holderNfts = dedupeNfts((backend.nfts || []).map(normalizeOpenSeaNft).filter(Boolean));
    renderHolderNemos();

    if (state.holderNfts.length) {
      setScanStatus(`🔓 Nemo Holder ✓　${state.holderNfts.length}人のねもを確認しました。Holderルートが開きました。（Nemo Holder API）`, 'success');
    } else {
      setScanStatus('このウォレットではNemoCollection2023を確認できませんでした。別ウォレットの場合は接続先を変更してください。', 'warning');
    }
  } catch (err) {
    state.holderNfts = [];
    renderHolderNemos();
    setScanStatus('自動取得がうまくいきませんでした。下の「Token IDで確認」も使えます。', 'warning');
    $('manualVerifyStatus').textContent = `Nemo Holder API: ${friendlyNetworkError(err)}`;
  } finally {
    $('refreshNftsBtn').disabled = false;
  }
}

async function fetchNemoNftsFromBackend(address) {
  if (!NEMO_API_BASE) throw new Error('Nemo Holder API URLが未設定です。');

  // Worker v0.9.6: Cloudflare Freeのsubrequest上限を避けるため、
  // Token ID探索を4回に分割し、メタデータも小分けで取得する。
  try {
    const ownedIds = [];
    const scanParts = 4;

    for (let part = 0; part < scanParts; part += 1) {
      setScanStatus(`Polygon上の保有候補を確認しています… ${part + 1}/${scanParts}`, 'loading');
      const data = await fetchNemoApiJson('/scan', { address, part: String(part) });
      ownedIds.push(...(Array.isArray(data.tokenIds) ? data.tokenIds : []));
    }

    const uniqueIds = [...new Set(ownedIds.map(String))];
    if (!uniqueIds.length) {
      return { ok: true, nfts: [], source: 'polygon-onchain-paged' };
    }

    const nfts = [];
    const metadataBatch = 10;
    const totalBatches = Math.ceil(uniqueIds.length / metadataBatch);

    for (let offset = 0, batchNo = 1; offset < uniqueIds.length; offset += metadataBatch, batchNo += 1) {
      const ids = uniqueIds.slice(offset, offset + metadataBatch);
      setScanStatus(`NemoCollection2023を照合しています… ${batchNo}/${totalBatches}`, 'loading');
      const data = await fetchNemoApiJson('/metadata', { ids: ids.join(',') });
      nfts.push(...(Array.isArray(data.nfts) ? data.nfts : []));
    }

    return {
      ok: true,
      nfts: dedupeNfts(nfts.map(normalizeOpenSeaNft).filter(Boolean)),
      source: 'polygon-onchain-paged',
    };
  } catch (pagedError) {
    // v0.9.6未導入時だけ旧 /nfts を試す。v0.9.6側の実処理エラーはそのまま表示。
    if (!/not_found|404|paged_lookup_required/i.test(String(pagedError?.message || pagedError))) {
      throw pagedError;
    }

    const url = new URL(`${NEMO_API_BASE}/nfts`);
    url.searchParams.set('address', address);
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });
    let data = null;
    try { data = await response.json(); } catch {}
    if (!response.ok || !data?.ok) {
      throw new Error(data?.message || data?.error || `Nemo Holder API ${response.status}`);
    }
    return data;
  }
}

async function fetchNemoApiJson(path, params = {}) {
  const url = new URL(`${NEMO_API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    cache: 'no-store',
  });
  let data = null;
  try { data = await response.json(); } catch {}
  if (!response.ok || !data?.ok) {
    const error = new Error(data?.message || data?.error || `Nemo Holder API ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
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

async function fetchNemoNftsOnChain(address, onProgress = () => {}) {
  await ensurePolygonNetwork();

  const ownedTokenIds = [];
  const candidates = [];
  for (let mintIndex = 0; mintIndex < NEMO_MINT_SCAN_MAX; mintIndex += 1) {
    candidates.push(sharedStorefrontTokenId(NEMO_CREATOR_ADDRESS, mintIndex, 1));
  }

  for (let offset = 0; offset < candidates.length; offset += NEMO_MINT_SCAN_CHUNK) {
    const chunk = candidates.slice(offset, offset + NEMO_MINT_SCAN_CHUNK);
    const balances = await erc1155BalanceOfBatch(address, chunk);
    balances.forEach((balance, i) => {
      if (balance > 0n) ownedTokenIds.push(chunk[i]);
    });
    onProgress(Math.min(70, Math.round(((offset + chunk.length) / candidates.length) * 70)));
  }

  if (!ownedTokenIds.length) {
    onProgress(100);
    return [];
  }

  const nfts = [];
  for (let i = 0; i < ownedTokenIds.length; i += 1) {
    const tokenId = ownedTokenIds[i];
    try {
      const metadata = await getTokenMetadata(tokenId);
      if (!isNemoCollection2023Metadata(metadata)) continue;
      nfts.push({
        identifier: tokenId.toString(),
        name: metadata?.name || `Nemo ${shortToken(tokenId.toString())}`,
        image: resolveAssetUrl(metadata?.image || metadata?.image_url || metadata?.animation_url || ''),
        contract: NEMO_SHARED_CONTRACT,
      });
    } catch {
      // 同じ作成者の別作品や、一時的にメタデータ取得できないTokenは無視する。
    }
    onProgress(70 + Math.round(((i + 1) / ownedTokenIds.length) * 30));
  }

  return nfts;
}

function sharedStorefrontTokenId(creatorAddress, mintIndex, supply = 1) {
  const creator = BigInt(creatorAddress);
  return (creator << 96n) | (BigInt(mintIndex) << 40n) | BigInt(supply);
}

function isNemoCollection2023Metadata(metadata) {
  if (!metadata) return false;
  const haystack = [metadata.name, metadata.description, metadata.external_url, metadata.external_link]
    .filter(Boolean)
    .join(' ');
  return /Nemo\s*2023\s*#?\s*\d+/i.test(haystack) || /NemoCollection2023/i.test(haystack);
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

async function getWalletProvider() {
  if (walletProvider?.request) return walletProvider;
  const { provider } = await initWalletClient();
  if (!provider?.request) throw new Error('ウォレットに接続できませんでした。');
  return provider;
}

async function ensurePolygonNetwork() {
  const provider = await getWalletProvider();
  const current = await provider.request({ method: 'eth_chainId' });
  if (String(current).toLowerCase() === POLYGON_CHAIN_ID) return;

  if (walletClient?.switchChain) {
    await walletClient.switchChain({
      chainId: POLYGON_CHAIN_ID,
      chainConfiguration: {
        chainId: POLYGON_CHAIN_ID,
        chainName: 'Polygon',
        nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
        rpcUrls: [SUPPORTED_NETWORKS[POLYGON_CHAIN_ID]],
        blockExplorerUrls: ['https://polygonscan.com'],
      },
    });
    return;
  }

  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: POLYGON_CHAIN_ID }] });
  } catch (err) {
    if (err?.code !== 4902) throw err;
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [{ chainId: POLYGON_CHAIN_ID, chainName: 'Polygon', nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 }, rpcUrls: [SUPPORTED_NETWORKS[POLYGON_CHAIN_ID]], blockExplorerUrls: ['https://polygonscan.com'] }],
    });
  }
}

async function erc1155BalanceOf(address, tokenId) {
  const provider = await getWalletProvider();
  const selector = '00fdd58e';
  const addressWord = address.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const tokenWord = tokenId.toString(16).padStart(64, '0');
  const result = await provider.request({ method: 'eth_call', params: [{ to: NEMO_SHARED_CONTRACT, data: `0x${selector}${addressWord}${tokenWord}` }, 'latest'] });
  return BigInt(result || '0x0');
}

async function erc1155BalanceOfBatch(address, tokenIds) {
  if (!tokenIds.length) return [];
  const provider = await getWalletProvider();
  const selector = '4e1273f4';
  const addressWord = address.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const word = value => BigInt(value).toString(16).padStart(64, '0');

  // balanceOfBatch(address[],uint256[]) ABI encoding
  const n = tokenIds.length;
  const addressesOffset = 64;
  const idsOffset = 64 + (n + 1) * 32;
  const addressesPart = word(n) + Array.from({ length: n }, () => addressWord).join('');
  const idsPart = word(n) + tokenIds.map(id => word(id)).join('');
  const data = `0x${selector}${word(addressesOffset)}${word(idsOffset)}${addressesPart}${idsPart}`;

  const result = await provider.request({
    method: 'eth_call',
    params: [{ to: NEMO_SHARED_CONTRACT, data }, 'latest'],
  });
  return decodeAbiUintArray(result);
}

function decodeAbiUintArray(hex) {
  const clean = String(hex || '').replace(/^0x/, '');
  if (clean.length < 128) throw new Error('保有数の一括確認結果を読み取れませんでした。');
  const offsetBytes = Number.parseInt(clean.slice(0, 64), 16);
  const start = offsetBytes * 2;
  const length = Number.parseInt(clean.slice(start, start + 64), 16);
  const out = [];
  let cursor = start + 64;
  for (let i = 0; i < length; i += 1) {
    const chunk = clean.slice(cursor, cursor + 64);
    if (chunk.length !== 64) throw new Error('保有数の一括確認結果が途中で切れています。');
    out.push(BigInt(`0x${chunk}`));
    cursor += 64;
  }
  return out;
}

async function getTokenMetadata(tokenId) {
  const provider = await getWalletProvider();
  const selector = '0e89341c';
  const tokenWord = tokenId.toString(16).padStart(64, '0');
  const result = await provider.request({ method: 'eth_call', params: [{ to: NEMO_SHARED_CONTRACT, data: `0x${selector}${tokenWord}` }, 'latest'] });
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

function setScanStatus(text, type = '') {
  const el = $('nftScanStatus');
  el.textContent = text;
  el.className = `scan-status${type ? ` ${type}` : ''}`;
}

function walletErrorText(err) {
  const code = err?.rpcCode ?? err?.code;
  if (code === 4001) return 'ウォレット側でキャンセルされました。';
  if (code === -32002) return 'MetaMaskで接続確認が開いています。ウォレット側を確認してください。';
  const text = String(err?.message || err || '接続できませんでした。');
  if (/Failed to fetch|dynamically imported module|Importing a module script failed|Load failed/i.test(text)) {
    return 'MetaMask接続ライブラリを読み込めませんでした。通信状態を確認して、もう一度お試しください。';
  }
  return friendlyNetworkError(err);
}
function friendlyNetworkError(err) {
  const text = String(err?.message || err || '確認できませんでした。');
  if (/Failed to fetch|NetworkError/i.test(text)) return '通信できませんでした。少し待って再確認してください。';
  return text.length > 150 ? `${text.slice(0, 147)}…` : text;
}

function getDungeonRules() {
  return state.selectedDungeon || DUNGEONS[0];
}

function getDungeonMaxRooms(dungeon, mode) {
  if (!dungeon) return mode === 'holder' ? 8 : 6;
  if (mode === 'holder') return dungeon.holderRooms || dungeon.guestRooms || 8;
  return dungeon.guestRooms || dungeon.holderRooms || 6;
}

function repeatEvents(events, count) {
  const out = [];
  for (let i = 0; i < Math.max(0, count); i += 1) out.push(...events);
  return out;
}

function dungeonPressureChance() {
  const rules = getDungeonRules();
  let chance = Number(rules.pressure || 0);
  if (rules.id === 'warehouse' && state.room >= 6) chance += 0.08;
  if (rules.id === 'onsen') {
    if (state.room >= 5) chance += 0.08;
    if (state.room >= 8) chance += 0.12;
    if (state.room >= 11) chance += 0.08;
  }
  if (rules.id === 'archive') {
    if (state.room >= 4) chance += 0.08;
    if (state.room >= 7) chance += 0.10;
    if (state.room >= 10) chance += 0.10;
  }
  return Math.min(0.82, chance);
}

function dungeonEntryHazardMessage() {
  const rules = getDungeonRules();
  let chance = 0;
  let damageRange = [1, 1];
  let message = '';

  if (rules.id === 'warehouse' && state.room >= 6) {
    chance = 0.16;
    damageRange = [1, 1];
    message = '📦 足元の板が沈んだ。古い倉庫そのものが罠みたいだ。';
  }
  if (rules.id === 'onsen') {
    if (state.room >= 5) { chance = 0.24; damageRange = [1, 1]; }
    if (state.room >= 8) { chance = 0.42; damageRange = [1, 2]; }
    if (state.room >= 11) { chance = 0.58; damageRange = [1, 2]; }
    message = '♨️ 奥へ進むほど空気が熱い。立っているだけでも体力を使う。';
  }
  if (rules.id === 'archive') {
    if (state.room >= 4) { chance = 0.32; damageRange = [1, 1]; }
    if (state.room >= 7) { chance = 0.54; damageRange = [1, 2]; }
    if (state.room >= 10) { chance = 0.72; damageRange = [1, 2]; }
    message = '📚 深層へ下りるほど息が重い。ここは長く居る場所ではない。';
  }

  if (!chance || Math.random() >= chance) return '';
  const before = state.hp;
  takeDamage(randomInt(...damageRange));
  const actual = Math.max(0, before - state.hp);
  if (!actual) return `${message} でも、ねもはうまくやり過ごした。`;
  return `${message} げんき-${actual}。`;
}

function dungeonPressureMessage(effect) {
  const rules = getDungeonRules();
  // 高難易度では慎重に進んでも、環境そのものからは完全には逃れられない。
  const safer = ['heal', 'smallHeal', 'bigHeal', 'deepRest', 'guard', 'forestPhoto'].includes(effect);
  const safeFactor = Number(rules.safePressureFactor ?? 0.35);
  const chance = dungeonPressureChance() * (safer ? safeFactor : 1);
  if (Math.random() >= chance) return '';

  const [minDmg, maxDmg] = rules.pressureDamage || [1, 1];
  let damage = randomInt(minDmg, maxDmg);
  if (rules.id === 'onsen' && state.room >= 8 && Math.random() < 0.25) damage += 1;
  if (rules.id === 'archive' && state.room >= 10 && Math.random() < 0.50) damage += 1;
  const before = state.hp;
  takeDamage(damage);
  const actual = Math.max(0, before - state.hp);
  if (!actual) return '危ない場面だったが、ねもはうまく身をかわした。';

  if (rules.id === 'warehouse') return `📦 崩れた箱に足を取られ、げんき-${actual}。`;
  if (rules.id === 'onsen') return `♨️ 熱い蒸気と滑る岩場で、げんき-${actual}。`;
  if (rules.id === 'archive') return `📚 深層の空気が重い。ねもは少し消耗した。げんき-${actual}。`;
  return `🌿 小さな枝に引っかかった。げんき-${actual}。`;
}

function dungeonRareBonus() {
  const id = getDungeonRules().id;
  if (id === 'warehouse') return 0.14;
  if (id === 'onsen') return 0.08;
  if (id === 'archive') return 0.18;
  return 0;
}

function startAdventure() {
  if (!state.selectedNemo || !state.selectedDungeon) return;
  if (state.selectedDungeon.holderOnly && state.playMode !== 'holder') return;
  state.maxRooms = getDungeonMaxRooms(state.selectedDungeon, state.playMode);
  state.maxHp = state.selectedNemo.perk === 'stamina' ? 12 : state.selectedNemo.perk === 'balance' ? 11 : state.selectedNemo.perk === 'holder' ? 11 : 10;
  state.hp = state.maxHp;
  state.room = 0;
  state.loot = [];
  state.traits = [];
  state.log = [];
  state.eventMemory = [];
  state.pendingLoot = null;
  state.pendingLootIsHolderRelic = false;
  state.holderRelicFound = false;
  state.holderRelicAttempts = 0;
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

  const entryHazard = dungeonEntryHazardMessage();
  if (entryHazard) addLog(entryHazard);
  if (state.hp <= 0) {
    updateHUD();
    finishAdventure('tired');
    return;
  }

  const event = pickEvent();
  state.currentEvent = event;
  state.eventMemory.push(event.type);
  state.eventMemory = state.eventMemory.slice(-3);
  renderEvent(event, entryHazard);
}

function pickEvent() {
  const rules = getDungeonRules();
  const dungeonEvents = (DUNGEON_EVENTS[rules.id] || []).filter(event => !event.minRoom || state.room >= event.minRoom);
  let pool = [
    ...repeatEvents(COMMON_EVENTS, rules.commonWeight ?? 1),
    ...repeatEvents(dungeonEvents, rules.dungeonWeight ?? 2),
  ];

  // 「深層」は温泉洞と地下回廊だけ。倉庫の追加ROOMとは世界観を分ける。
  if (state.playMode === 'holder' && state.room >= 9 && ['onsen', 'archive'].includes(rules.id)) {
    pool = [...repeatEvents(DEEP_EVENTS.filter(event => !event.minRoom || state.room >= event.minRoom), 2), ...repeatEvents(dungeonEvents, 2)];
  }

  const fresh = pool.filter(event => !state.eventMemory.includes(event.type));
  if (fresh.length >= 3) pool = fresh;

  if (state.room >= 4 && rules.id === 'warehouse') {
    pool = [...pool, ...DUNGEON_EVENTS.warehouse.filter(e => ['warehouse-ledger', 'warehouse-oldhall-sign', 'warehouse-clock-0451', 'warehouse-name-tag'].includes(e.type))];
  }
  if (state.room >= 6 && rules.id === 'onsen') {
    pool = [...pool, ...DUNGEON_EVENTS.onsen.filter(e => ['onsen-wall', 'onsen-paper', 'onsen-letter', 'onsen-naoto', 'onsen-map'].includes(e.type))];
  }
  if (state.playMode === 'holder' && state.room >= 10 && ['onsen', 'archive'].includes(rules.id)) {
    pool = [...pool, ...DEEP_EVENTS.filter(e => ['deep-watch', 'deep-crown', 'deep-record'].includes(e.type) && (!e.minRoom || state.room >= e.minRoom))];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function renderEvent(event, entryHazard = '') {
  $('sceneIcon').textContent = event.icon;
  $('sceneKicker').textContent = event.kicker;
  $('sceneTitle').textContent = event.title;
  $('sceneText').textContent = entryHazard ? `${entryHazard}\n\n${event.text}` : event.text;
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
  if (typeof effect === 'string' && effect.startsWith('item:')) {
    const itemId = effect.slice(5);
    message = gainSpecificLoot([itemId]);
    const found = LOOT.find(x => x.id === itemId);
    if (found?.lore === 'inn') maybeTrait('足跡が気になる', .18);
    if (found?.lore === 'royal' || found?.lore === 'recorder') maybeTrait('深層を知っている', .22);
  } else switch (effect) {
    case 'loot': message = gainLoot(false); break;
    case 'safeLoot': if (Math.random() < (getDungeonRules().id === 'warehouse' ? .20 : .10)) takeDamage(1); message = gainLoot(Math.random() < (.18 + dungeonRareBonus())); break;
    case 'riskLoot': { const id = getDungeonRules().id; const dmg = id === 'warehouse' ? randomInt(1, 3) : id === 'onsen' ? randomInt(1, 2) : randomInt(0, 2); takeDamage(dmg); message = gainLoot(Math.random() < (.32 + dungeonRareBonus())); maybeTrait('箱を見ると開けたい', .32); break; }
    case 'foodLoot': message = addLootToBag({ id: 'bun', name: '肉まん', icon: '🥟', rarity: 1, desc: '食べる前提だったはずのおみやげ。' }, '肉まんを大事にしまった。'); maybeTrait('肉まん鑑定士', .45); break;
    case 'heal': heal(3 + (state.selectedNemo.perk === 'balance' ? 1 : 0)); message = 'ねもは肉まんを食べて、ちょっと元気になった。'; maybeTrait('肉まん鑑定士', .35); break;
    case 'smallHeal': heal(2 + (state.selectedNemo.perk === 'balance' ? 1 : 0)); message = 'ほんの少し休んだ。ねもの顔がゆるんだ。'; break;
    case 'bigHeal': heal(4 + (state.selectedNemo.perk === 'balance' ? 1 : 0)); message = '足湯した。冒険中なのに、完全にくつろいでいる。'; maybeTrait('温泉好き', .55); break;
    case 'deepRest': heal(3); message = '深層なのに不思議と落ち着く。ねもは少し元気を取り戻した。'; maybeTrait('深層を知っている', .22); break;
    case 'pushOn': if (Math.random() < .25) takeDamage(1); message = '休まず進んだ。ちょっとだけ眠そう。'; break;
    case 'guard': if (Math.random() < .16) takeDamage(1); message = '慎重に進んだ。大きな事故は起きなかった。'; maybeTrait('慎重派', .35); break;
    case 'riskSmall': takeDamage(randomInt(0, 2)); message = '暗闇をゆっくり進んだ。'; maybeTrait('暗いところ平気', .28); break;
    case 'clever': { const idx = state.loot.findIndex(x => x.id === 'acorn'); if (idx >= 0) { state.loot.splice(idx, 1); message = 'どんぐり作戦は成功した。ハリネズミは満足そうだ。'; } else message = 'どんぐりは無かったので、ねもはゆっくり横を通った。'; maybeTrait('寄り道名人', .22); break; }
    case 'mystery': { const success = getDungeonRules().id === 'warehouse' ? .52 : getDungeonRules().id === 'onsen' ? .58 : .48; if (Math.random() < success) message = gainLoot(true); else { takeDamage(getDungeonRules().id === 'archive' ? 2 : 1); message = '読み解こうとして考えすぎた。ねもは少し疲れた。'; } break; }
    case 'forestFind': if (Math.random() < .65) message = gainSpecificLoot(['blue-stone', 'star']); else { takeDamage(1); message = '袖だけ濡れた。ねもは納得していない。'; } maybeTrait('石ころ収集家', .3); break;
    case 'acorn': message = gainSpecificLoot(['acorn']); break;
    case 'forestPhoto': message = 'どんぐりの山を記録した。持ち帰らない勇気もある。'; maybeTrait('帰る判断が早い', .08); break;
    case 'trail': if (Math.random() < .55) message = gainLoot(true); else { takeDamage(1); message = '足跡は途中で消えていた。少しぞわっとした。'; } maybeTrait('足跡が気になる', .5); break;
    case 'loreRisk': { const id = getDungeonRules().id; takeDamage(id === 'onsen' ? randomInt(1, 3) : randomInt(0, 2)); message = Math.random() < (id === 'onsen' ? .68 : .58) ? gainLoreLoot() : '古い通路は途中で崩れていた。今日はここまで。'; break; }
    case 'loreLoot': message = gainLoreLoot(); break;
    case 'innLore': message = gainLoreByTier('inn'); break;
    case 'royalLore': message = gainLoreByTier('royal'); maybeTrait('深層を知っている', .16); break;
    case 'recorderLore': message = state.playMode === 'holder' ? gainLoreByTier('recorder') : gainLoreByTier('royal'); maybeTrait('深層を知っている', .3); break;
    case 'holderLoot': message = gainHolderLoot(); maybeTrait('深層を知っている', .28); break;
    case 'deepLore': message = Math.random() < .68 ? gainHolderLoot() : gainLoreByTier('royal'); maybeTrait('深層を知っている', .35); break;
    case 'return': finishAdventure('return'); return;
  }
  const pressureMessage = dungeonPressureMessage(effect);
  if (pressureMessage) message = `${message} ${pressureMessage}`.trim();
  addLog(message);
  if (state.pendingLoot) {
    renderBagSwap(message);
    return;
  }
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
  const last = state.loot[state.loot.length - 1];
  if (last?.lore && Math.random() < .7) {
    const loreTexts = [
      'ねもは拾ったものをもう一度見た。知らないはずなのに、少しだけ懐かしい気がする。',
      'ねもは何も言わず、その品を大切にしまった。',
      '説明できないけれど、これは捨ててはいけない気がした。',
      'ねもの耳が一度だけぴくりと動いた。本人は気づいていない。',
    ];
    return loreTexts[Math.floor(Math.random() * loreTexts.length)];
  }
  const texts = ['ねもは次へ進むか、今日は帰るか考えている。','少しだけ立ち止まって、持ち物を確認した。','奥から何か音がする。でも気のせいかもしれない。','ねもは一度だけ後ろを振り返った。帰り道はちゃんと覚えている。'];
  return texts[Math.floor(Math.random() * texts.length)];
}

function chooseLootCandidate(candidates) {
  if (!candidates.length) return null;
  const inRun = new Set(state.loot.map(x => x.id));
  const discovered = new Set(getSavedArray(STORAGE.discoveredLoot));
  const neverSeen = candidates.filter(x => !discovered.has(x.id) && !inRun.has(x.id));
  const noDuplicate = candidates.filter(x => !inRun.has(x.id));
  const pool = neverSeen.length && Math.random() < .72 ? neverSeen : noDuplicate.length ? noDuplicate : candidates;
  return { ...pool[Math.floor(Math.random() * pool.length)] };
}

function addLootToBag(item, successMessage = '') {
  if (!item) return '何も見つからなかった。';
  const copy = { ...item };
  if (state.loot.length < BAG_CAPACITY) {
    state.loot.push(copy);
    return successMessage || `${copy.icon} ${copy.name}を見つけた。`;
  }
  state.pendingLoot = copy;
  state.pendingLootIsHolderRelic = Boolean(copy.holderOnly);
  return `🎒 バッグがいっぱい。${copy.icon} ${copy.name}を見つけた。持ち帰るなら、何かひとつ置いていこう。`;
}

function renderBagSwap(message) {
  const item = state.pendingLoot;
  if (!item) return renderAfterChoice(message);
  $('sceneKicker').textContent = 'バッグ 5 / 5';
  $('sceneTitle').textContent = `${item.icon} ${item.name}を持ち帰る？`;
  $('sceneText').textContent = 'ねもが持ち帰れるのは5個まで。いま持っている物をひとつ置くか、新しく見つけた物を置いていこう。';
  const area = $('choiceArea');
  area.innerHTML = '';
  state.loot.forEach((oldItem, index) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.disabled = Boolean(oldItem.holderOnly);
    btn.textContent = oldItem.holderOnly
      ? `🔒 ${oldItem.icon} ${oldItem.name}（深層遺物は保護）`
      : `${oldItem.icon} ${oldItem.name}を置いて入れ替える`;
    if (!btn.disabled) btn.addEventListener('click', () => completeBagSwap(index));
    area.appendChild(btn);
  });
  const leaveBtn = document.createElement('button');
  leaveBtn.className = 'choice-btn';
  leaveBtn.textContent = `${item.icon} ${item.name}は置いていく`;
  leaveBtn.addEventListener('click', () => completeBagSwap(-1));
  area.appendChild(leaveBtn);
  $('continueBtn').disabled = true;
  updateHUD();
}

function completeBagSwap(index) {
  const item = state.pendingLoot;
  const pendingWasHolderRelic = state.pendingLootIsHolderRelic;
  if (!item) return;
  let message = '';
  if (index >= 0) {
    const removed = state.loot[index];
    state.loot.splice(index, 1, item);
    if (pendingWasHolderRelic) state.holderRelicFound = true;
    message = `${removed.icon} ${removed.name}を置いて、${item.icon} ${item.name}をバッグに入れた。`;
  } else {
    message = `${item.icon} ${item.name}は、その場所にそっと戻しておいた。`;
  }
  state.pendingLoot = null;
  state.pendingLootIsHolderRelic = false;
  addLog(message);
  maybeRandomTrait();
  renderAfterChoice(message);
  if (state.hp <= 0) setTimeout(() => finishAdventure('tired'), 250);
}

function gainLoot(forceRare = false) {
  let candidates;
  const dungeonBoost = dungeonRareBonus();
  const rareBoost = (state.selectedNemo.perk === 'rare' && Math.random() < .3) || (state.playMode === 'holder' && Math.random() < .12) || (dungeonBoost > 0 && Math.random() < dungeonBoost);
  if (forceRare || rareBoost) candidates = LOOT.filter(x => x.rarity >= 2 && !x.holderOnly && !x.loreOnly);
  else candidates = LOOT.filter(x => x.rarity <= 2 && !x.holderOnly && !x.loreOnly);
  const item = chooseLootCandidate(candidates);
  if (!item) return '何も見つからなかった。';
  maybeTrait('拾いもの上手', .16);
  return addLootToBag(item, `${item.icon} ${item.name}を見つけた。`);
}

function gainSpecificLoot(ids) {
  const candidates = LOOT.filter(x => ids.includes(x.id));
  const item = chooseLootCandidate(candidates);
  if (!item) return 'そこには何も残っていなかった。';
  if (item.holderOnly) return attemptHolderRelic(item);
  return addLootToBag(item, `${item.icon} ${item.name}を見つけた。`);
}

function gainLoreByTier(tier) {
  if (tier === 'recorder' && state.playMode === 'holder') return gainHolderLoot();
  let candidates = LOOT.filter(x => x.lore === tier && !x.holderOnly);
  if (tier === 'recorder') candidates = LOOT.filter(x => x.lore === 'royal' && !x.holderOnly);
  const item = chooseLootCandidate(candidates);
  if (!item) return '古い痕跡はあったが、持ち帰れるものはなかった。';
  return addLootToBag(item, `${item.icon} ${item.name}を見つけた。ねもは少しだけ、その場から動かなかった。`);
}

function gainLoreLoot() {
  let tier = 'royal';
  if (state.selectedDungeon?.id === 'warehouse') tier = 'inn';
  else if (state.selectedDungeon?.id === 'onsen') tier = Math.random() < .58 ? 'inn' : 'royal';
  else if (state.selectedDungeon?.id === 'archive') tier = state.playMode === 'holder' && Math.random() < .55 ? 'recorder' : 'royal';
  return gainLoreByTier(tier);
}

function getHolderRelicMissStreak() {
  const value = Number(localStorage.getItem(STORAGE.holderRelicMissStreak) || 0);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function setHolderRelicMissStreak(value) {
  localStorage.setItem(STORAGE.holderRelicMissStreak, String(Math.max(0, Math.floor(Number(value) || 0))));
}

function holderRelicDropChance() {
  if (state.room >= 12) return .50;
  if (state.room >= 11) return .40;
  if (state.room >= 9) return .32;
  if (state.room >= 7) return .25;
  if (state.room >= 4) return .18;
  return 0;
}

function attemptHolderRelic(specificItem = null) {
  if (state.playMode !== 'holder' || state.selectedDungeon?.id !== 'archive') {
    return gainLoreByTier('royal');
  }
  if (state.holderRelicFound) {
    return 'この冒険では、もうひとつ深層遺物を見つけている。ねもは欲張らず先へ進むことにした。';
  }
  if (state.holderRelicAttempts >= HOLDER_RELIC_ATTEMPT_LIMIT) {
    return '今日はもう、深層の記録は姿を見せなかった。別の日なら見つかるかもしれない。';
  }

  const discovered = new Set(getSavedArray(STORAGE.discoveredLoot));
  let candidates = LOOT.filter(item => item.holderOnly && (item.minRoom || 1) <= state.room && !discovered.has(item.id));
  if (specificItem) {
    if ((specificItem.minRoom || 1) > state.room) return 'まだ浅すぎる。ねもはその品に触れず、場所だけ覚えておいた。';
    if (discovered.has(specificItem.id)) return '以前にも見つけた記録だ。ねもはそっと元の場所へ戻した。';
    candidates = candidates.filter(item => item.id === specificItem.id);
  }
  if (!candidates.length) {
    return '棚には見覚えのある記録しか残っていなかった。';
  }

  state.holderRelicAttempts += 1;
  const pityActive = getHolderRelicMissStreak() >= HOLDER_RELIC_PITY_AFTER;
  const chance = pityActive ? 1 : holderRelicDropChance();
  if (Math.random() >= chance) {
    return '深層の痕跡はあった。でも、持ち帰れる形では残っていなかった。';
  }

  const item = specificItem ? { ...specificItem } : { ...candidates[Math.floor(Math.random() * candidates.length)] };
  const message = addLootToBag(item, `${item.icon} ${item.name}を見つけた。ここまで来たねもにだけ見つけられたものらしい。`);
  if (!state.pendingLoot) state.holderRelicFound = true;
  else state.pendingLootIsHolderRelic = true;
  return message;
}

function gainHolderLoot() {
  return attemptHolderRelic();
}

function maybeLuckyBonus() {
  if (state.selectedNemo?.perk !== 'lucky' || Math.random() >= .16) return;
  if (state.loot.length >= BAG_CAPACITY) {
    addLog('🍀 もうひとつ見つけたけれど、バッグがいっぱいなので置いてきた。');
    return;
  }
  const candidates = LOOT.filter(x => x.rarity === 1 && !x.loreOnly);
  const item = { ...candidates[Math.floor(Math.random() * candidates.length)] };
  state.loot.push(item);
  addLog(`🍀 幸運のおまけ：${item.icon} ${item.name}も見つけた。`);
}

function takeDamage(amount) { if (state.selectedNemo.perk === 'guard' && amount > 0 && Math.random() < .55) amount = Math.max(0, amount - 1); state.hp = Math.max(0, state.hp - amount); }
function heal(amount) {
  const recovery = Number(getDungeonRules().recovery || 1);
  const adjusted = Math.max(1, Math.round(amount * recovery));
  state.hp = Math.min(state.maxHp, state.hp + adjusted);
}
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
  const heading = $('lootHeading');
  if (heading) heading.innerHTML = `今回の戦利品 <span class="bag-count">${state.loot.length}/${BAG_CAPACITY}</span>`;
  if (!state.loot.length) { el.className = 'loot-list empty'; el.textContent = `まだ何も拾っていない（バッグ ${BAG_CAPACITY}枠）`; return; }
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
    title = ['onsen', 'archive'].includes(state.selectedDungeon.id) && state.maxRooms >= 12 ? 'ねもは深層から帰ってきた！' : 'ねもは奥までたどり着いた！';
    text = state.playMode === 'holder' && state.maxRooms > (state.selectedDungeon.guestRooms || 0) ? '自分のねもだから辿り着けた、その先の部屋。記録もちゃんと残った。' : 'ちょっと得意げな顔で帰ってきた。明日には忘れているかもしれない。';
    icon = state.playMode === 'holder' ? '🌌' : '🏕️';
    maybeTrait('洞窟慣れ', .7);
  } else if (reason === 'tired') {
    title = 'ねもは疲れたので帰ってきました'; text = '倒れたわけではない。今日はもう十分だっただけ。'; icon = '🛌'; maybeTrait('帰る判断が早い', .6);
  } else {
    title = 'ねもは自分の判断で帰ってきました'; text = '冒険は、奥まで行くことだけが正解ではありません。'; icon = '🏡'; maybeTrait('帰る判断が早い', .25);
  }

  if (state.playMode === 'holder' && state.selectedDungeon.id === 'archive' && reason === 'clear') {
    const carriedRelic = state.loot.some(item => item.holderOnly);
    if (carriedRelic) setHolderRelicMissStreak(0);
    else setHolderRelicMissStreak(getHolderRelicMissStreak() + 1);
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
  const loreItems = discovered.map(id => LOOT.find(item => item.id === id)).filter(item => item?.lore);
  const hasLoreLoot = loreItems.length > 0;
  const innLore = loreItems.filter(item => item.lore === 'inn').length;
  const royalLore = loreItems.filter(item => item.lore === 'royal').length;
  const recorderLore = loreItems.filter(item => item.lore === 'recorder').length;
  return {
    runs: records.length,
    clears: records.filter(r => r.reason === 'clear').length,
    manualReturns: records.filter(r => r.reason === 'return').length,
    deepest: records.reduce((m, r) => Math.max(m, Number(r.rooms) || 0), 0),
    discovered: discovered.length,
    hasLoreLoot,
    innLore,
    royalLore,
    recorderLore,
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
