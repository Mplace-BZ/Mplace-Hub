// ══════════════════════════════════════════════════════════
// MPlace Hub — Cloudflare Worker (proxy AI + FootyStats + TTS)
// Deployowany jako: red-haze-5f37mplace-agent.contactmplace.workers.dev
// Auth: Firebase ID token (weryfikacja podpisu przez Google JWKS) + allowlista UID
//
// Sekrety (env) — ustaw przez dashboard lub `wrangler secret put <NAME>`:
//   ANTHROPIC_API_KEY, FOOTY_API_KEY, ELEVENLABS_API_KEY
// Historia: zastąpił skompromitowany token statyczny (był publiczny w index.html).
// ══════════════════════════════════════════════════════════

// ══ CONFIG ═══════════════════════════════════════════════
const FIREBASE_PROJECT_ID = 'mplace-hub';
const FIREBASE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

const ALLOWED_UIDS = [
  'XfNRdMBxstcJcZnkRo4n9Udxc9r1',   // Chris — właściciel
  // 'UID_PRACOWNIKA_1',            // dodaj UID pracownika ZANIM zacznie używać Huba
];

// ══ FIREBASE TOKEN VERIFICATION ══════════════════════════
async function verifyFirebaseToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) throw new Error('No auth');
  const token = authHeader.slice(7);

  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const [hB64, pB64, sB64] = parts;

  const b64d = s => atob(s.replace(/-/g, '+').replace(/_/g, '/')
    .padEnd(s.length + (4 - s.length % 4) % 4, '='));

  const header  = JSON.parse(b64d(hB64));
  const payload = JSON.parse(b64d(pB64));

  if (header.alg !== 'RS256') throw new Error('Bad alg');

  const now = Math.floor(Date.now() / 1000);
  if (payload.aud !== FIREBASE_PROJECT_ID) throw new Error('Bad aud');
  if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) throw new Error('Bad iss');
  if (payload.exp <= now) throw new Error('Token expired');
  if (payload.iat > now + 300) throw new Error('Token from future');
  if (!payload.sub) throw new Error('No sub');

  const jwksRes = await fetch(FIREBASE_JWKS_URL, { cf: { cacheEverything: true, cacheTtl: 3600 } });
  if (!jwksRes.ok) throw new Error('JWKS fetch failed');
  const { keys } = await jwksRes.json();

  const jwk = keys.find(k => k.kid === header.kid);
  if (!jwk) throw new Error('Unknown kid');

  const pubKey = await crypto.subtle.importKey(
    'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
  );

  const sigInput = new TextEncoder().encode(`${hB64}.${pB64}`);
  const signature = Uint8Array.from(b64d(sB64), c => c.charCodeAt(0));

  const ok = await crypto.subtle.verify(
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, pubKey, signature, sigInput
  );
  if (!ok) throw new Error('Invalid signature');

  return payload;
}

async function checkAuth(request) {
  const auth = request.headers.get('Authorization') || '';
  const payload = await verifyFirebaseToken(auth);
  if (!ALLOWED_UIDS.includes(payload.sub)) throw new Error('UID not allowed');
  return payload;
}

// ══ WORKER ═══════════════════════════════════════════════
export default {
  async fetch(request, env) {
    const CORS = {
      'Access-Control-Allow-Origin': 'https://mplace-bz.github.io',   // ← MUSI = origin Huba
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
      status, headers: { 'Content-Type': 'application/json', ...CORS }
    });

    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    // ── Auth ──
    try { await checkAuth(request); }
    catch (e) { return json({ error: 'Unauthorized: ' + e.message }, 401); }

    const url = new URL(request.url);

    // Bezpieczny parse JSON body (brak/malformed → undefined, nie wyjątek)
    const readBody = async () => { try { return await request.json(); } catch { return undefined; } };

    // ── Health ──
    if (url.pathname === '/health') {
      return json({
        ok: true,
        hasFootyKey: !!env.FOOTY_API_KEY,
        hasAnthropicKey: !!env.ANTHROPIC_API_KEY,
        hasElevenKey: !!env.ELEVENLABS_API_KEY,
        timestamp: Date.now()
      });
    }

    // ── FootyStats proxy ──
    if (url.pathname.startsWith('/footy/')) {
      try {
        if (!env.FOOTY_API_KEY) return json({ error: 'FOOTY_API_KEY missing in env' }, 500);
        const apiPath = url.pathname.slice('/footy/'.length);
        const params = new URLSearchParams(url.search);
        params.set('key', env.FOOTY_API_KEY);
        const fr = await fetch('https://api.football-data-api.com/' + apiPath + '?' + params.toString());
        return new Response(await fr.text(), { status: fr.status, headers: { 'Content-Type': 'application/json', ...CORS } });
      } catch (e) {
        return json({ error: 'Worker exception in /footy proxy', message: String(e) }, 500);
      }
    }

    // ── TTS (ElevenLabs) ──
    if (url.pathname === '/tts') {
      if (!env.ELEVENLABS_API_KEY) return json({ error: 'ELEVENLABS_API_KEY missing in env' }, 500);
      const body = await readBody();
      if (!body || !body.text) return json({ error: 'Invalid or missing JSON body (text required)' }, 400);
      const voiceId = body.voice_id || 'EXAVITQu4vr4xnSDxMaL';
      const ttsResp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: { 'xi-api-key': env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: body.text,
          model_id: body.model_id || 'eleven_multilingual_v2',
          voice_settings: body.voice_settings || { stability: 0.5, similarity_boost: 0.75 }
        })
      });
      if (!ttsResp.ok) return json({ error: 'ElevenLabs ' + ttsResp.status }, ttsResp.status);
      return new Response(ttsResp.body, { headers: { 'Content-Type': 'audio/mpeg', ...CORS } });
    }

    // ── Claude (default) ──
    if (!env.ANTHROPIC_API_KEY) return json({ error: 'ANTHROPIC_API_KEY missing in env' }, 500);
    const body = await readBody();
    if (!body || !body.messages) return json({ error: 'Invalid or missing JSON body (messages required)' }, 400);
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ ...body, stream: true })
    });
    return new Response(resp.body, {
      status: resp.status,
      headers: { 'Content-Type': 'text/event-stream', ...CORS, 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' }
    });
  }
};
