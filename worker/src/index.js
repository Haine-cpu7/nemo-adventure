const DEFAULT_ALLOWED_ORIGIN = 'https://haine-cpu7.github.io';
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

// NemoCollection2023 は OpenSea Shared Storefront (ERC-1155 / Polygon) 上にあります。
const NEMO_SHARED_CONTRACT = '0x2953399124f0cbb46d2cbacd8a89cf0599974963';
const NEMO_CREATOR_ADDRESS = '0xd9f57493574c8abc1651a9c0478bdf73324289f4';

// Shared Storefront の creator mint index を広めに走査します。
// 1024候補を128件ずつ balanceOfBatch するので、RPC呼び出しは通常8回です。
const MINT_SCAN_MAX = 1024;

// OpenSea Shared Storefront の Token ID 下位40bitには、mint時に設定した
// max supply（edition数）が入ります。v0.9.4 は 1 固定だったため、
// 1/1 以外の Nemo を取りこぼしていました。
// Nemo制作履歴で使われている edition 値を広めにカバーします。
const SUPPLY_CANDIDATES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20, 25, 30, 50, 100, 200, 300];

// balanceOfBatch は一度に大きくし過ぎると公開RPCに拒否されることがあるため
// 256件単位。4リクエストずつ並列化して待ち時間を抑えます。
const SCAN_CHUNK = 256;
const SCAN_CONCURRENCY = 4;

// 2026年現在、Polygon公式の公開RPCは常設前提にしづらいため、
// キー不要の第三者パブリックRPCを複数用意してフェイルオーバーします。
const DEFAULT_RPC_ENDPOINTS = [
  'https://polygon-bor-rpc.publicnode.com',
  'https://polygon.drpc.org/',
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'GET') {
      return json({ ok: false, error: 'method_not_allowed' }, 405, cors);
    }

    if (url.pathname === '/' || url.pathname === '/health') {
      return json({
        ok: true,
        service: 'nemo-holder-api',
        version: '0.9.5',
        mode: 'polygon-onchain',
        opensea: false,
        contract: NEMO_SHARED_CONTRACT,
        scanMax: MINT_SCAN_MAX,
        supplyCandidates: SUPPLY_CANDIDATES,
      }, 200, cors);
    }

    if (url.pathname !== '/nfts') {
      return json({ ok: false, error: 'not_found' }, 404, cors);
    }

    const address = String(url.searchParams.get('address') || '').trim();
    if (!ADDRESS_RE.test(address)) {
      return json({ ok: false, error: 'invalid_address' }, 400, cors);
    }

    try {
      const nfts = await getNemoNftsOnChain(address, env);
      return json({
        ok: true,
        address,
        chain: 'polygon',
        collection: 'nemocollection2023',
        source: 'polygon-onchain',
        nfts,
      }, 200, cors);
    } catch (error) {
      console.error('Nemo on-chain lookup failed', error);
      return json({
        ok: false,
        error: 'polygon_lookup_failed',
        message: safeError(error),
      }, 502, cors);
    }
  },
};

function corsHeaders(request, env) {
  const configured = String(env.ALLOWED_ORIGIN || DEFAULT_ALLOWED_ORIGIN)
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
  const origin = request.headers.get('Origin') || '';
  const allowOrigin = configured.includes(origin)
    ? origin
    : (configured[0] || DEFAULT_ALLOWED_ORIGIN);

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
  };
}

function json(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...extraHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function rpcEndpoints(env) {
  const custom = String(env.POLYGON_RPC_URLS || env.POLYGON_RPC_URL || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
  return [...custom, ...DEFAULT_RPC_ENDPOINTS]
    .filter((value, index, array) => array.indexOf(value) === index);
}

async function rpcCall(env, method, params) {
  let lastError = null;

  for (const endpoint of rpcEndpoints(env)) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`RPC ${response.status}: ${text.slice(0, 160)}`);
      }

      const payload = await response.json();
      if (payload?.error) {
        throw new Error(`RPC error ${payload.error.code}: ${payload.error.message}`);
      }
      if (payload?.result == null) {
        throw new Error('RPC result is empty');
      }
      return payload.result;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Polygon RPCへ接続できませんでした。');
}

async function getNemoNftsOnChain(address, env) {
  // 同じ mintIndex でも maxSupply が違えば Token ID は別物です。
  // supply=1 だけでなく、Nemoで使われ得るedition値をまとめて確認します。
  const candidates = [];
  for (let mintIndex = 0; mintIndex < MINT_SCAN_MAX; mintIndex += 1) {
    for (const supply of SUPPLY_CANDIDATES) {
      candidates.push(sharedStorefrontTokenId(NEMO_CREATOR_ADDRESS, mintIndex, supply));
    }
  }

  const ownedTokenIds = [];
  const chunks = [];
  for (let offset = 0; offset < candidates.length; offset += SCAN_CHUNK) {
    chunks.push(candidates.slice(offset, offset + SCAN_CHUNK));
  }

  // 公開RPCを一気に叩き過ぎないよう、少数ずつ並列処理します。
  for (let offset = 0; offset < chunks.length; offset += SCAN_CONCURRENCY) {
    const group = chunks.slice(offset, offset + SCAN_CONCURRENCY);
    const groupResults = await Promise.all(group.map(async chunk => {
      const balances = await erc1155BalanceOfBatch(address, chunk, env);
      const found = [];
      balances.forEach((balance, index) => {
        if (balance > 0n) found.push(chunk[index]);
      });
      return found;
    }));
    for (const found of groupResults) ownedTokenIds.push(...found);
  }

  if (!ownedTokenIds.length) return [];

  // 念のため重複排除。
  const uniqueOwnedTokenIds = [...new Map(
    ownedTokenIds.map(tokenId => [tokenId.toString(), tokenId])
  ).values()];

  // メタデータ取得を一気に投げすぎないよう、小さい並列単位にする。
  const results = [];
  const META_CONCURRENCY = 4;

  for (let offset = 0; offset < uniqueOwnedTokenIds.length; offset += META_CONCURRENCY) {
    const group = uniqueOwnedTokenIds.slice(offset, offset + META_CONCURRENCY);
    const found = await Promise.all(group.map(async tokenId => {
      try {
        const metadata = await getTokenMetadata(tokenId, env);
        if (!isNemoCollection2023Metadata(metadata)) return null;

        return {
          identifier: tokenId.toString(),
          name: metadata?.name || `Nemo ${tokenId.toString()}`,
          image: resolveAssetUrl(metadata?.image || metadata?.image_url || metadata?.animation_url || ''),
          image_url: resolveAssetUrl(metadata?.image || metadata?.image_url || metadata?.animation_url || ''),
          display_image_url: resolveAssetUrl(metadata?.image || metadata?.image_url || metadata?.animation_url || ''),
          contract: NEMO_SHARED_CONTRACT,
        };
      } catch (error) {
        console.warn(`metadata skipped: ${tokenId.toString()}`, safeError(error));
        return null;
      }
    }));

    results.push(...found.filter(Boolean));
  }

  // Nemo2023 #番号がある場合は番号順に並べる。
  results.sort((a, b) => extractNemoNumber(a.name) - extractNemoNumber(b.name));
  return results;
}

function sharedStorefrontTokenId(creatorAddress, mintIndex, supply = 1) {
  const creator = BigInt(creatorAddress);
  return (creator << 96n) | (BigInt(mintIndex) << 40n) | BigInt(supply);
}

async function erc1155BalanceOfBatch(address, tokenIds, env) {
  if (!tokenIds.length) return [];

  const selector = '4e1273f4'; // balanceOfBatch(address[],uint256[])
  const addressWord = address.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const word = value => BigInt(value).toString(16).padStart(64, '0');
  const count = tokenIds.length;

  const addressesOffset = 64;
  const idsOffset = 64 + (count + 1) * 32;
  const addressesPart = word(count) + Array.from({ length: count }, () => addressWord).join('');
  const idsPart = word(count) + tokenIds.map(id => word(id)).join('');
  const data = `0x${selector}${word(addressesOffset)}${word(idsOffset)}${addressesPart}${idsPart}`;

  const result = await rpcCall(env, 'eth_call', [
    { to: NEMO_SHARED_CONTRACT, data },
    'latest',
  ]);

  return decodeAbiUintArray(result);
}

function decodeAbiUintArray(hex) {
  const clean = String(hex || '').replace(/^0x/, '');
  if (clean.length < 128) {
    throw new Error('balanceOfBatchの結果を読み取れませんでした。');
  }

  const offsetBytes = Number.parseInt(clean.slice(0, 64), 16);
  const start = offsetBytes * 2;
  const length = Number.parseInt(clean.slice(start, start + 64), 16);
  const values = [];
  let cursor = start + 64;

  for (let i = 0; i < length; i += 1) {
    const chunk = clean.slice(cursor, cursor + 64);
    if (chunk.length !== 64) {
      throw new Error('balanceOfBatchの結果が途中で切れています。');
    }
    values.push(BigInt(`0x${chunk}`));
    cursor += 64;
  }

  return values;
}

async function getTokenMetadata(tokenId, env) {
  const selector = '0e89341c'; // uri(uint256)
  const tokenWord = tokenId.toString(16).padStart(64, '0');
  const result = await rpcCall(env, 'eth_call', [
    { to: NEMO_SHARED_CONTRACT, data: `0x${selector}${tokenWord}` },
    'latest',
  ]);

  let uri = decodeAbiString(result);
  uri = uri.replace(/\{id\}/gi, tokenWord.toLowerCase());
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

  const urls = metadataUrls(uri);
  let lastError = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) throw new Error(`metadata ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('NFT metadataを取得できませんでした。');
}

function metadataUrls(uri) {
  const value = String(uri || '').trim();
  if (value.startsWith('ipfs://')) {
    const path = value.slice(7).replace(/^ipfs\//, '');
    return [
      `https://ipfs.io/ipfs/${path}`,
      `https://dweb.link/ipfs/${path}`,
    ];
  }
  if (value.startsWith('ar://')) {
    return [`https://arweave.net/${value.slice(5)}`];
  }
  return [value];
}

function resolveAssetUrl(uri) {
  const value = String(uri || '').trim();
  if (value.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${value.slice(7).replace(/^ipfs\//, '')}`;
  }
  if (value.startsWith('ar://')) {
    return `https://arweave.net/${value.slice(5)}`;
  }
  return value;
}

function isNemoCollection2023Metadata(metadata) {
  if (!metadata) return false;
  const haystack = [
    metadata.name,
    metadata.description,
    metadata.external_url,
    metadata.external_link,
  ].filter(Boolean).join(' ');

  return /Nemo\s*2023\s*#?\s*\d+/i.test(haystack)
    || /NemoCollection2023/i.test(haystack);
}

function extractNemoNumber(name) {
  const match = String(name || '').match(/#\s*(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function safeError(error) {
  const text = String(error?.message || error || 'unknown_error');
  return text.length > 300 ? `${text.slice(0, 297)}...` : text;
}
