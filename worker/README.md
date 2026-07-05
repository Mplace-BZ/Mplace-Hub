# MPlace Hub Worker

Cloudflare Worker: proxy dla Claude API, FootyStats i ElevenLabs TTS, używany przez Hub (`index.html`).

- **Deploy target:** `red-haze-5f37mplace-agent.contactmplace.workers.dev`
- **Auth:** Firebase ID token (weryfikacja podpisu przez Google JWKS) + allowlista UID (`ALLOWED_UIDS` w `index.js`).
- **Origin (CORS):** `https://mplace-bz.github.io` — zmień w `index.js`, jeśli Hub przejdzie na custom domenę.

## Sekrety (env)

Ustaw jako **Secret** (nie plaintext) — dashboard lub CLI:

| Nazwa | Do czego |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API (endpoint domyślny) |
| `FOOTY_API_KEY` | FootyStats (`/footy/*`) |
| `ELEVENLABS_API_KEY` | TTS (`/tts`) |

```bash
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put FOOTY_API_KEY
wrangler secret put ELEVENLABS_API_KEY
```

## Deploy

```bash
cd worker
wrangler deploy
```

## Endpointy (wszystkie za auth)

- `GET  /health` → `{ ok, hasAnthropicKey, hasFootyKey, hasElevenKey }`
- `GET  /footy/<path>` → proxy do football-data-api.com
- `POST /tts` → ElevenLabs (body: `{ text, voice_id?, model_id?, voice_settings? }`)
- `POST /` (default) → Claude (body: `{ messages, model, max_tokens, ... }`), odpowiedź SSE

## Testy

```bash
W=https://red-haze-5f37mplace-agent.contactmplace.workers.dev
curl -s -o /dev/null -w "no-token: %{http_code}\n" -X POST "$W/"                                  # 401
curl -s -o /dev/null -w "czucio:   %{http_code}\n" -X POST "$W/" -H "Authorization: Bearer x"      # 401
# token z Huba (zalogowany): await firebase.auth().currentUser.getIdToken()
curl -s -w "\nhealth: %{http_code}\n" "$W/health" -H "Authorization: Bearer <TOKEN>"               # 200
```
