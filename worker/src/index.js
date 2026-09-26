const COLLECTION_SLUG = 'nemocollection2023';
const OPENSEA_AUTH_URL = 'https://api.opensea.io/api/v2/auth/keys';
const OPENSEA_ACCOUNT_NFTS_URL = 'https://api.opensea.io/api/v2/chain/{chain}/account/{address}/nfts';
const DEFAULT_ALLOWED_ORIGIN = 'https://haine-cpu7.github.io';
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

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

    if (url.pathname === '/health' || url.pathname === '/') {
      return json({ ok: true, service: 'nemo-holder-api', collection: COLLECTION_SLUG }, 200, cors);
    }

    if (url.pathname !== '/nfts') {
      return json({ ok: false, error: 'not_found' }, 404, cors);
    }

    const address = (url.searchParams.get('address') || '').trim();
    if (!ADDRESS_RE.test(address)) {
      return json({ ok: false, error: 'invalid_address' }, 400, cors);
    }

    try {
      const result = await getNemoNfts(request, env, address);
      return json({
        ok: true,
        address,
        collection: COLLECTION_SLUG,
        chain: result.chain,
        nfts: result.nfts,
      }, 200, cors);
    } catch (error) {
      console.error('Nemo NFT lookup failed', error);
      return json({
        ok: false,
        error: 'opensea_lookup_failed',
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
  const allowOrigin = configured.includes(origin) ? origin : configured[0] || DEFAULT_ALLOWED_ORIGIN;
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

async function getNemoNfts(request, env, address) {
  let apiKey = String(env.OPENSEA_API_KEY || '').trim();
  let usingInstantKey = false;
  if (!apiKey) {
    apiKey = await getInstantApiKey(request);
    usingInstantKey = true;
  }

  try {
    return await fetchAccountNfts(address, apiKey);
  } catch (error) {
    // Instant keyが期限切れ等だった場合はキャッシュを捨てて一度だけ作り直す。
    if (usingInstantKey && /OpenSea .* (401|403)/.test(String(error?.message || error))) {
      await clearCachedInstantKey(request);
      const freshKey = await getInstantApiKey(request);
      return await fetchAccountNfts(address, freshKey);
    }
    throw error;
  }
}

async function fetchAccountNfts(address, apiKey) {
  let lastError = null;

  for (const chain of ['polygon', 'matic']) {
    try {
      const all = [];
      let cursor = '';

      for (let page = 0; page < 10; page += 1) {
        const endpoint = OPENSEA_ACCOUNT_NFTS_URL
          .replace('{chain}', chain)
          .replace('{address}', address);
        const url = new URL(endpoint);
        url.searchParams.set('collection', COLLECTION_SLUG);
        url.searchParams.set('include_auto_hidden', 'true');
        url.searchParams.set('limit', '50');
        if (cursor) url.searchParams.set('next', cursor);

        const response = await fetch(url.toString(), {
          headers: {
            'X-API-KEY': apiKey,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`OpenSea ${chain} ${response.status}: ${text.slice(0, 180)}`);
        }

        const payload = await response.json();
        all.push(...(Array.isArray(payload.nfts) ? payload.nfts : []));
        cursor = payload.next || '';
        if (!cursor) break;
      }

      return { chain, nfts: all };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('OpenSeaからNFT一覧を取得できませんでした。');
}

async function getInstantApiKey(request) {
  const cache = caches.default;
  const origin = new URL(request.url).origin;
  const cacheRequest = new Request(`${origin}/__internal/opensea-key-cache`, { method: 'GET' });
  const cached = await cache.match(cacheRequest);

  if (cached) {
    const data = await cached.json();
    if (data?.api_key && (!data.expires_at || Date.parse(data.expires_at) > Date.now() + 60 * 60 * 1000)) {
      return data.api_key;
    }
  }

  const response = await fetch(OPENSEA_AUTH_URL, {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenSea auth ${response.status}: ${text.slice(0, 180)}`);
  }

  const data = await response.json();
  if (!data?.api_key) throw new Error('OpenSea API keyを取得できませんでした。');

  const expiresAt = data.expires_at ? Date.parse(data.expires_at) : Date.now() + 6 * 24 * 60 * 60 * 1000;
  const ttl = Math.max(300, Math.min(6 * 24 * 60 * 60, Math.floor((expiresAt - Date.now()) / 1000) - 3600));
  await cache.put(cacheRequest, new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `max-age=${ttl}`,
    },
  }));

  return data.api_key;
}

async function clearCachedInstantKey(request) {
  const cache = caches.default;
  const origin = new URL(request.url).origin;
  const cacheRequest = new Request(`${origin}/__internal/opensea-key-cache`, { method: 'GET' });
  await cache.delete(cacheRequest);
}

function safeError(error) {
  const text = String(error?.message || error || 'unknown_error');
  return text.length > 240 ? `${text.slice(0, 237)}...` : text;
}
