const DEFAULT_ALLOWED_ORIGIN = 'https://haine-cpu7.github.io';
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const TOKEN_ID_RE = /^\d+$/;

// NemoCollection2023: OpenSea Shared Storefront (ERC-1155 / Polygon)
const NEMO_SHARED_CONTRACT = '0x2953399124f0cbb46d2cbacd8a89cf0599974963';
const NEMO_CREATOR_ADDRESS = '0xd9f57493574c8abc1651a9c0478bdf73324289f4';
const MINT_SCAN_MAX = 1024;

// Cloudflare Workers Free は 1 invocation あたり外部 subrequest 50件まで。
// そのため edition 候補を4分割し、ブラウザから /scan を4回呼んで合流します。
const SUPPLY_GROUPS = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
  [11, 12, 15, 20, 25],
  [30, 50, 100, 200, 300],
];

// 1 part = 5 supplies x 1024 mint index = 5120候補。
// 512件ずつ balanceOfBatch => 通常10 subrequests / invocation。
const SCAN_CHUNK = 512;
const SCAN_CONCURRENCY = 4;
const METADATA_BATCH_MAX = 12;
const META_FETCH_CONCURRENCY = 4;

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
        version: '0.9.6',
        mode: 'polygon-onchain-paged',
        opensea: false,
        contract: NEMO_SHARED_CONTRACT,
        scanMax: MINT_SCAN_MAX,
        scanParts: SUPPLY_GROUPS.length,
        metadataBatchMax: METADATA_BATCH_MAX,
      }, 200, cors);
    }

    if (url.pathname === '/scan') {
      const address = String(url.searchParams.get('address') || '').trim();
      const part = Number.parseInt(String(url.searchParams.get('part') || ''), 10);

      if (!ADDRESS_RE.test(address)) {
        return json({ ok: false, error: 'invalid_address' }, 400, cors);
      }
      if (!Number.isInteger(part) || part < 0 || part >= SUPPLY_GROUPS.length) {
        return json({ ok: false, error: 'invalid_scan_part' }, 400, cors);
      }

      try {
        const tokenIds = await scanOwnedTokenIds(address, SUPPLY_GROUPS[part], env);
        return json({
          ok: true,
          address,
          chain: 'polygon',
          source: 'polygon-onchain-paged',
          part,
          parts: SUPPLY_GROUPS.length,
          supplies: SUPPLY_GROUPS[part],
          tokenIds: tokenIds.map(id => id.toString()),
        }, 200, cors);
      } catch (error) {
        console.error('Nemo scan failed', error);
        return json({
          ok: false,
          error: 'polygon_scan_failed',
          message: safeError(error),
        }, 502, cors);
      }
    }

    if (url.pathname === '/metadata') {
      const rawIds = String(url.searchParams.get('ids') || '').trim();
      const ids = [...new Set(rawIds.split(',').map(v => v.trim()).filter(Boolean))];

      if (!ids.length || ids.length > METADATA_BATCH_MAX || ids.some(id => !TOKEN_ID_RE.test(id))) {
        return json({
          ok: false,
          error: 'invalid_token_ids',
          max: METADATA_BATCH_MAX,
        }, 400, cors);
      }

      try {
        const tokenIds = ids.map(id => BigInt(id));
        const nfts = await getNemoMetadataBatch(tokenIds, env);
        return json({
          ok: true,
          chain: 'polygon',
          collection: 'nemocollection2023',
          source: 'polygon-onchain-paged',
          nfts,
        }, 200, cors);
      } catch (error) {
        console.error('Nemo metadata lookup failed', error);
        return json({
          ok: false,
          error: 'metadata_lookup_failed',
          message: safeError(error),
        }, 502, cors);
      }
    }

    // v0.9.6 からは1リクエストで全探索せず、Cloudflare Freeの50件制限を
    // 確実に避けるため /scan + /metadata の分割方式を使います。
    if (url.pathname === '/nfts') {
      return json({
        ok: false,
        error: 'paged_lookup_required',
        message: 'ゲームをv0.12.1以降へ更新してください。',
        version: '0.9.6',
      }, 409, cors);
    }

    return json({ ok: false, error: 'not_found' }, 404, cors);
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

async function rpcBatchEthCall(env, calls) {
  if (!calls.length) return [];
  let lastError = null;

  for (const endpoint of rpcEndpoints(env)) {
    try {
      const requests = calls.map((call, index) => ({
        jsonrpc: '2.0',
        id: index + 1,
        method: 'eth_call',
        params: [call, 'latest'],
      }));

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requests),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`RPC batch ${response.status}: ${text.slice(0, 160)}`);
      }

      const payload = await response.json();
      if (!Array.isArray(payload)) throw new Error('RPC batch result is not an array');

      const byId = new Map(payload.map(item => [Number(item.id), item]));
      return requests.map(req => {
        const item = byId.get(Number(req.id));
        if (!item) throw new Error(`RPC batch result missing: ${req.id}`);
        if (item.error) throw new Error(`RPC error ${item.error.code}: ${item.error.message}`);
        if (item.result == null) throw new Error('RPC result is empty');
        return item.result;
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Polygon RPC batchへ接続できませんでした。');
}

async function scanOwnedTokenIds(address, supplies, env) {
  const candidates = [];
  for (let mintIndex = 0; mintIndex < MINT_SCAN_MAX; mintIndex += 1) {
    for (const supply of supplies) {
      candidates.push(sharedStorefrontTokenId(NEMO_CREATOR_ADDRESS, mintIndex, supply));
    }
  }

  const chunks = [];
  for (let offset = 0; offset < candidates.length; offset += SCAN_CHUNK) {
    chunks.push(candidates.slice(offset, offset + SCAN_CHUNK));
  }

  const owned = [];
  for (let offset = 0; offset < chunks.length; offset += SCAN_CONCURRENCY) {
    const group = chunks.slice(offset, offset + SCAN_CONCURRENCY);
    const results = await Promise.all(group.map(async chunk => {
      const balances = await erc1155BalanceOfBatch(address, chunk, env);
      const found = [];
      balances.forEach((balance, index) => {
        if (balance > 0n) found.push(chunk[index]);
      });
      return found;
    }));
    results.forEach(found => owned.push(...found));
  }

  return [...new Map(owned.map(id => [id.toString(), id])).values()];
}

function sharedStorefrontTokenId(creatorAddress, mintIndex, supply = 1) {
  const creator = BigInt(creatorAddress);
  return (creator << 96n) | (BigInt(mintIndex) << 40n) | BigInt(supply);
}

async function erc1155BalanceOfBatch(address, tokenIds, env) {
  if (!tokenIds.length) return [];

  const selector = '4e1273f4';
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
  if (clean.length < 128) throw new Error('balanceOfBatchの結果を読み取れませんでした。');

  const offsetBytes = Number.parseInt(clean.slice(0, 64), 16);
  const start = offsetBytes * 2;
  const length = Number.parseInt(clean.slice(start, start + 64), 16);
  const values = [];
  let cursor = start + 64;

  for (let i = 0; i < length; i += 1) {
    const chunk = clean.slice(cursor, cursor + 64);
    if (chunk.length !== 64) throw new Error('balanceOfBatchの結果が途中で切れています。');
    values.push(BigInt(`0x${chunk}`));
    cursor += 64;
  }

  return values;
}

async function getNemoMetadataBatch(tokenIds, env) {
  const selector = '0e89341c'; // uri(uint256)
  const calls = tokenIds.map(tokenId => ({
    to: NEMO_SHARED_CONTRACT,
    data: `0x${selector}${tokenId.toString(16).padStart(64, '0')}`,
  }));

  const uriResults = await rpcBatchEthCall(env, calls);
  const entries = [];

  uriResults.forEach((result, index) => {
    try {
      const tokenId = tokenIds[index];
      const tokenWord = tokenId.toString(16).padStart(64, '0');
      let uri = decodeAbiString(result);
      uri = uri.replace(/\{id\}/gi, tokenWord.toLowerCase());
      entries.push({ tokenId, uri });
    } catch (error) {
      console.warn('metadata URI skipped', safeError(error));
    }
  });

  const output = [];
  for (let offset = 0; offset < entries.length; offset += META_FETCH_CONCURRENCY) {
    const group = entries.slice(offset, offset + META_FETCH_CONCURRENCY);
    const found = await Promise.all(group.map(async ({ tokenId, uri }) => {
      try {
        const metadata = await fetchJsonUri(uri);
        if (!isNemoCollection2023Metadata(metadata)) return null;
        const image = resolveAssetUrl(metadata?.image || metadata?.image_url || metadata?.animation_url || '');
        return {
          identifier: tokenId.toString(),
          name: metadata?.name || `Nemo ${tokenId.toString()}`,
          image,
          image_url: image,
          display_image_url: image,
          contract: NEMO_SHARED_CONTRACT,
        };
      } catch (error) {
        console.warn(`metadata skipped: ${tokenId.toString()}`, safeError(error));
        return null;
      }
    }));
    output.push(...found.filter(Boolean));
  }

  output.sort((a, b) => extractNemoNumber(a.name) - extractNemoNumber(b.name));
  return output;
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
