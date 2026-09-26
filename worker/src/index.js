const COLLECTION_SLUG = 'nemocollection2023';
const OPENSEA_AUTH_URL = 'https://api.opensea.io/api/v2/auth/keys';
const OPENSEA_ACCOUNT_NFTS_URL = 'https://api.opensea.io/api/v2/chain/{chain}/account/{address}/nfts';
const DEFAULT_ALLOWED_ORIGIN = 'https://haine-cpu7.github.io';
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

// Streamlit版と同じ考え方：Instant API Keyを約6日使い回す。
const KEY_CACHE_SECONDS = 6 * 24 * 60 * 60;
const KEY_REFRESH_MARGIN_SECONDS = 60 * 60;
const DEFAULT_AUTH_COOLDOWN_SECONDS = 30 * 60;

// 同じWorker isolate内で同時リクエストが来ても、キー発行を1回にまとめる。
let instantKeyPromise = null;

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
      const cacheState = await getCacheState(request);
      return json({
        ok: true,
        service: 'nemo-holder-api',
        version: '0.9.3',
        collection: COLLECTION_SLUG,
        keyMode: String(env.OPENSEA_API_KEY || '').trim() ? 'worker-secret' : 'instant-key-cache',
        instantKeyCached: cacheState.keyCached,
        authCooldown: cacheState.cooldown,
      }, 200, cors);
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
        source: result.source,
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
  const configuredKey = String(env.OPENSEA_API_KEY || '').trim();

  if (configuredKey) {
    const result = await fetchAccountNfts(address, configuredKey);
    return { ...result, source: 'worker-secret' };
  }

  let apiKey = await getInstantApiKey(request);

  try {
    const result = await fetchAccountNfts(address, apiKey);
    return { ...result, source: 'instant-key-cache' };
  } catch (error) {
    const text = String(error?.message || error);

    // キャッシュしたInstant keyが期限切れ/無効になった時だけ、1回だけ再発行。
    if (/OpenSea .* (401|403)/.test(text)) {
      await clearCachedInstantKey(request);
      apiKey = await getInstantApiKey(request, true);
      const result = await fetchAccountNfts(address, apiKey);
      return { ...result, source: 'instant-key-refreshed' };
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

async function getInstantApiKey(request, forceRefresh = false) {
  if (!forceRefresh) {
    const cached = await readCachedInstantKey(request);
    if (cached) return cached;
  }

  const cooldown = await readAuthCooldown(request);
  if (cooldown) {
    throw new Error(`OpenSea auth cooldown: ${cooldown.message}`);
  }

  // 同一isolate内でキー発行リクエストをまとめる。
  if (!instantKeyPromise) {
    instantKeyPromise = createAndCacheInstantApiKey(request)
      .finally(() => {
        instantKeyPromise = null;
      });
  }

  return await instantKeyPromise;
}

async function createAndCacheInstantApiKey(request) {
  const response = await fetch(OPENSEA_AUTH_URL, {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    const text = await response.text();

    if (response.status === 429) {
      const retryAfter = parseRetryAfter(response.headers.get('Retry-After'));
      const cooldownSeconds = retryAfter || DEFAULT_AUTH_COOLDOWN_SECONDS;
      await writeAuthCooldown(
        request,
        cooldownSeconds,
        `OpenSea APIキー発行が一時制限中です。約${Math.ceil(cooldownSeconds / 60)}分後に再試行してください。`
      );
    }

    throw new Error(`OpenSea auth ${response.status}: ${text.slice(0, 180)}`);
  }

  const data = await response.json();
  const apiKey = String(data?.api_key || '').trim();
  if (!apiKey) throw new Error('OpenSea API keyを取得できませんでした。');

  const expiresMs = parseExpiration(data?.expires_at);
  const maxUsableSeconds = Math.max(
    300,
    Math.floor((expiresMs - Date.now()) / 1000) - KEY_REFRESH_MARGIN_SECONDS
  );
  const ttl = Math.max(300, Math.min(KEY_CACHE_SECONDS, maxUsableSeconds));

  const cache = caches.default;
  const cacheRequest = instantKeyCacheRequest(request);
  const payload = {
    api_key: apiKey,
    expires_at: new Date(expiresMs).toISOString(),
    cached_at: new Date().toISOString(),
  };

  await cache.put(cacheRequest, new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=${ttl}`,
    },
  }));

  await clearAuthCooldown(request);
  return apiKey;
}

async function readCachedInstantKey(request) {
  const cached = await caches.default.match(instantKeyCacheRequest(request));
  if (!cached) return '';

  try {
    const data = await cached.json();
    const apiKey = String(data?.api_key || '').trim();
    if (!apiKey) return '';

    const expiresMs = parseExpiration(data?.expires_at);
    if (expiresMs <= Date.now() + KEY_REFRESH_MARGIN_SECONDS * 1000) {
      await clearCachedInstantKey(request);
      return '';
    }

    return apiKey;
  } catch {
    await clearCachedInstantKey(request);
    return '';
  }
}

async function clearCachedInstantKey(request) {
  await caches.default.delete(instantKeyCacheRequest(request));
}

function instantKeyCacheRequest(request) {
  const origin = new URL(request.url).origin;
  return new Request(`${origin}/__internal/opensea-instant-key-v093`, { method: 'GET' });
}

function cooldownCacheRequest(request) {
  const origin = new URL(request.url).origin;
  return new Request(`${origin}/__internal/opensea-auth-cooldown-v093`, { method: 'GET' });
}

async function writeAuthCooldown(request, seconds, message) {
  await caches.default.put(cooldownCacheRequest(request), new Response(JSON.stringify({
    message,
    created_at: new Date().toISOString(),
  }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=${Math.max(60, seconds)}`,
    },
  }));
}

async function readAuthCooldown(request) {
  const response = await caches.default.match(cooldownCacheRequest(request));
  if (!response) return null;
  try {
    return await response.json();
  } catch {
    return { message: 'OpenSea APIキー発行の再試行を一時停止しています。' };
  }
}

async function clearAuthCooldown(request) {
  await caches.default.delete(cooldownCacheRequest(request));
}

async function getCacheState(request) {
  const keyResponse = await caches.default.match(instantKeyCacheRequest(request));
  const cooldown = await readAuthCooldown(request);
  return {
    keyCached: Boolean(keyResponse),
    cooldown: cooldown?.message || null,
  };
}

function parseExpiration(value) {
  if (value) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  // OpenSea Instant keyは期限付き。取得できない場合は安全側で6日として扱う。
  return Date.now() + KEY_CACHE_SECONDS * 1000;
}

function parseRetryAfter(value) {
  if (!value) return 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds);

  const when = Date.parse(value);
  if (Number.isFinite(when)) {
    return Math.max(0, Math.ceil((when - Date.now()) / 1000));
  }
  return 0;
}

function safeError(error) {
  const text = String(error?.message || error || 'unknown_error');
  return text.length > 300 ? `${text.slice(0, 297)}...` : text;
}
