# LinguaAI — Proje İskeleti & Frontend Build Prompt

## Görev
Aşağıdaki spesifikasyona göre **LinguaAI** adlı açık kaynak İngilizce konuşma pratiği uygulamasının **tam proje iskeletini** ve **eksiksiz frontend kodunu** yaz. Kod çalışır durumda, production-grade ve tutarlı olmalı.

---

## Proje Yapısı (oluşturulacak tüm dosyalar)

```
linguaai/
├── docker-compose.yml
├── docker-compose.override.yml       ← whisper servisi burada (opsiyonel)
├── .env.example
├── .gitignore
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── config.js
│       ├── routes/
│       │   ├── chat.js
│       │   ├── tts.js
│       │   └── stt.js
│       ├── providers/
│       │   ├── base.js
│       │   ├── gemini.js
│       │   ├── openai.js
│       │   ├── anthropic.js
│       │   ├── groq.js
│       │   ├── ollama.js
│       │   └── lmstudio.js
│       ├── services/
│       │   ├── conversation.js
│       │   └── prompt.js
│       └── websocket/
│           └── handler.js
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── components/
        │   ├── ConversationScreen/
        │   │   ├── index.jsx
        │   │   ├── WaveAnimation.jsx
        │   │   ├── MessageBubble.jsx
        │   │   └── MicButton.jsx
        │   ├── Settings/
        │   │   ├── index.jsx
        │   │   └── ProviderForm.jsx
        │   └── shared/
        │       ├── Logo.jsx
        │       └── StatusIndicator.jsx
        ├── hooks/
        │   ├── useConversation.js
        │   ├── useSTT.js
        │   └── useAudio.js
        ├── store/
        │   └── appStore.js            ← Zustand global state
        ├── lib/
        │   └── wsClient.js            ← WebSocket singleton
        └── styles/
            ├── globals.css
            ├── tokens.css             ← Design tokens (renkler, spacing, font)
            └── animations.css
```

---

## Backend Spesifikasyonu (iskelet + tam implementasyon)

### `backend/src/config.js`
Tüm environment variable'ları merkezi olarak okur ve validate eder:
```
STT_PROVIDER=webspeech|whisper
AI_PROVIDER=gemini|openai|anthropic|groq|ollama|lmstudio
GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, GROQ_API_KEY
OLLAMA_BASE_URL=http://localhost:11434
LMSTUDIO_BASE_URL=http://localhost:1234
KOKORO_URL=http://kokoro:8880
KOKORO_VOICE=af_heart
```

### `backend/src/providers/base.js`
Abstract Provider sınıfı. Her provider şu interface'i implement etmeli:
```js
class BaseProvider {
  async chat(messages, options) {}       // messages: [{role, content}]
  async *stream(messages, options) {}    // async generator, yields string chunks
  async isAvailable() {}                 // health check
}
```

### Provider implementasyonları
Her provider dosyası BaseProvider'ı extend etmeli:
- **gemini.js** → `@google/generative-ai` SDK, model: `gemini-1.5-flash`
- **openai.js** → `openai` SDK, model: `gpt-4o-mini` (configurable)
- **anthropic.js** → `@anthropic-ai/sdk`, model: `claude-3-haiku-20240307`
- **groq.js** → `groq-sdk`, model: `llama-3.1-8b-instant`
- **ollama.js** → fetch ile `http://OLLAMA_BASE_URL/api/chat`, model env'den
- **lmstudio.js** → OpenAI-compatible API, `LMSTUDIO_BASE_URL/v1/chat/completions`

### `backend/src/services/prompt.js`
System prompt builder. `freeStyle` modu için:
```
You are an English conversation partner. Your role is to:
- Speak naturally and encouragingly
- Gently correct grammar mistakes (don't be harsh, embed corrections naturally)
- Keep responses concise (2-4 sentences max) to maintain conversation flow
- Ask follow-up questions to keep the conversation going
- Adapt your vocabulary to the user's apparent level
Current mode: Free Style Conversation
```

### `backend/src/services/conversation.js`
- Her WebSocket session için ayrı conversation history tut (Map ile)
- `addMessage(sessionId, role, content)`
- `getHistory(sessionId)` → son 20 mesajı döner (context window yönetimi)
- `clearHistory(sessionId)`

### `backend/src/websocket/handler.js`
WebSocket mesaj tipleri:
```js
// Client → Server
{ type: 'message', text: string, sessionId: string }
{ type: 'clear', sessionId: string }
{ type: 'settings', provider: string, voice: string }

// Server → Client
{ type: 'chunk', text: string }          // streaming AI yanıt
{ type: 'done', fullText: string }       // stream bitti
{ type: 'audio', data: base64string }    // TTS ses verisi
{ type: 'error', message: string }
```

Akış: mesaj gelir → provider'a stream et → her chunk'ı client'a gönder → stream bitince fullText'i Kokoro'ya gönder → audio base64 olarak client'a gönder.

### `backend/src/routes/tts.js`
`POST /api/tts` → body: `{ text, voice }` → Kokoro'ya proxy, audio buffer döner.

### `backend/src/routes/stt.js`
`POST /api/stt` → multipart/form-data, audio file → Whisper API'ye proxy, `{ text }` döner.

### `backend/package.json` bağımlılıkları:
```json
{
  "dependencies": {
    "express": "^4.18",
    "ws": "^8.16",
    "cors": "^2.8",
    "dotenv": "^16",
    "multer": "^1.4",
    "form-data": "^4.0",
    "node-fetch": "^3.3",
    "@google/generative-ai": "^0.15",
    "openai": "^4.47",
    "@anthropic-ai/sdk": "^0.24",
    "groq-sdk": "^0.5"
  }
}
```

---

## Frontend Spesifikasyonu (tam implementasyon)

### Estetik Yön: "Organic Minimal"
LinguaAI'ın tasarım dili şu prensiplere dayanır:
- **Tema:** Açık zemin, derin kontrast — beyaz değil, hafif warm cream (#FAFAF7)
- **Tipografi:** Display için `Fraunces` (Google Fonts — serin, organik serif), UI için `DM Sans` (modern, okunabilir)
- **Renk paleti:**
  - Background: `#FAFAF7` (warm cream)
  - Surface: `#FFFFFF`
  - Primary: `#1A1A2E` (derin lacivert)
  - Accent: `#6C63FF` (canlı mor-mavi — konuşma aktifken)
  - AI Speaking: `#00C896` (canlı yeşil-teal)
  - User Speaking: `#FF6B6B` (coral — mikrofon aktifken)
  - Muted: `#8E8E9A`
  - Border: `#EBEBF0`
- **Animasyonlar:** Yavaş, akıcı, "nefes alan" hissiyat. Sert geçiş yok.
- **Boşluk:** Cömert padding. Elementler birbirini soluklandırsın.

### `frontend/src/styles/tokens.css`
Tüm renk, tipografi, spacing, shadow, border-radius, transition değerlerini CSS custom property olarak tanımla. Hiçbir component hardcoded değer kullanmayacak, her şey token üzerinden.

```css
:root {
  /* Colors */
  --color-bg: #FAFAF7;
  --color-surface: #FFFFFF;
  --color-primary: #1A1A2E;
  --color-accent: #6C63FF;
  --color-ai: #00C896;
  --color-user: #FF6B6B;
  --color-muted: #8E8E9A;
  --color-border: #EBEBF0;

  /* Typography */
  --font-display: 'Fraunces', Georgia, serif;
  --font-ui: 'DM Sans', sans-serif;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 2rem;

  /* Spacing */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;
  --space-12: 48px; --space-16: 64px;

  /* Radius */
  --radius-sm: 8px; --radius-md: 16px; --radius-lg: 24px; --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(26,26,46,0.06), 0 1px 2px rgba(26,26,46,0.04);
  --shadow-md: 0 4px 16px rgba(26,26,46,0.08), 0 2px 6px rgba(26,26,46,0.04);
  --shadow-lg: 0 12px 40px rgba(26,26,46,0.12);

  /* Transitions */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 500ms;
}
```

### `frontend/src/styles/animations.css`
Şu keyframe animasyonlarını tanımla:
- `@keyframes fadeInUp` — element aşağıdan yumuşakça gelir
- `@keyframes pulseRing` — mikrofon etrafında yayılan halka
- `@keyframes breathe` — AI avatar'ı nefes alır gibi scale
- `@keyframes slideInRight` / `slideInLeft` — mesaj balonları için
- `@keyframes shimmer` — yüklenme skeleton efekti
- `@keyframes waveBar` — dalga çubukları için (WaveAnimation'da kullanılır)

### `frontend/src/store/appStore.js` (Zustand)
```js
{
  // Conversation
  messages: [],          // { id, role: 'user'|'ai', text, timestamp, isStreaming }
  addMessage: fn,
  updateLastMessage: fn, // streaming için chunk ekleme
  clearMessages: fn,

  // Connection
  wsStatus: 'disconnected' | 'connecting' | 'connected',
  setWsStatus: fn,

  // Audio State
  isUserSpeaking: false,
  isAISpeaking: false,
  audioLevel: 0,         // 0-1 arası, wave animasyonu için
  setUserSpeaking: fn,
  setAISpeaking: fn,
  setAudioLevel: fn,

  // Settings
  settings: {
    aiProvider: 'gemini',
    sttProvider: 'webspeech',   // 'webspeech' | 'whisper'
    voice: 'af_heart',
    aiModel: '',                // opsiyonel override
  },
  updateSettings: fn,
  settingsOpen: false,
  toggleSettings: fn,

  // Session
  sessionId: string,     // uuid, app başlayınca üretilir
}
```

### `frontend/src/lib/wsClient.js`
WebSocket singleton. Şu metodları export et:
- `connect(url)` → bağlantı kur, store'u güncelle
- `send(type, payload)` → JSON stringify + gönder
- `disconnect()`
- `onMessage(handler)` → mesaj dinleyici ekle
Reconnect logic: bağlantı kopunca 1s, 2s, 4s, 8s (exponential backoff, max 30s) bekleyerek yeniden bağlanmayı dene.

### `frontend/src/hooks/useSTT.js`
STT provider'ı settings'den alır:

**Web Speech API modu:**
- `SpeechRecognition` API'yi kullan, `interimResults: true`
- Kullanıcı konuşmaya başlayınca `isUserSpeaking: true`, bitince `false` yap
- `audioLevel`'ı simüle et (interim result varken rastgele 0.3-0.9 arası)
- `onTranscript(text, isFinal)` callback'i çağır

**Whisper modu:**
- MediaRecorder ile ses kaydet
- Sessizlik tespiti: 1.5s boyunca ses seviyesi threshold altında kalırsa kaydı bitir
- `POST /api/stt` ile backend'e gönder, transcript'i al

Export: `{ isListening, startListening, stopListening, transcript, isSupported }`

### `frontend/src/hooks/useAudio.js`
- WebSocket'ten gelen `audio` mesajını (base64) yakala
- `AudioContext` ile çal
- Çalarken `isAISpeaking: true`, bitince `false` yap
- `AnalyserNode` ile gerçek zamanlı `audioLevel` hesapla ve store'a yaz
- Export: `{ isPlaying, playAudio, analyserNode }`

### `frontend/src/hooks/useConversation.js`
- WebSocket mesajlarını yönetir
- `chunk` gelince store'daki son mesajı güncelle (streaming)
- `done` gelince mesajı tamamla
- `audio` gelince `useAudio`'ya ilet
- `sendMessage(text)` → store'a user mesajı ekle + WS'e gönder
- Export: `{ sendMessage, isConnected, isAIThinking }`

---

## Komponent Spesifikasyonları

### `App.jsx`
```jsx
// Layout:
// - Tüm ekranı kaplar (100dvh)
// - Background: var(--color-bg)
// - Settings paneli bir overlay olarak gelir (portal ile)
// - ConversationScreen ana içerik
// - WS bağlantısını burada kur (useEffect)
```

### `components/ConversationScreen/index.jsx`
Ana konuşma ekranı. Layout (yukarıdan aşağıya):
1. **Header bar** — Logo solda, settings ikonu sağda, bağlantı durumu ortada (küçük dot)
2. **Mesaj alanı** — scroll edilebilir, mesajlar aşağıdan yukarı yığılır. Boşken "Start speaking to begin..." placeholder'ı göster
3. **WaveAnimation** — orta alan, AI veya kullanıcı konuşurken aktif olur
4. **MicButton** — en altta, ekranın merkezinde

**Detay:** Mesaj alanı dolunca otomatik en alta scroll et (`scrollIntoView`).

### `components/ConversationScreen/WaveAnimation.jsx`
**Canvas tabanlı, gerçek zamanlı ses dalgası animasyonu:**

```
Props: { isActive, color, audioLevel, mode: 'user'|'ai'|'idle' }
```

Implementasyon detayları:
- `<canvas>` elementi kullan, `requestAnimationFrame` ile sürekli çiz
- **Idle modu:** 5 çizgi, çok yavaş sinüs hareketi, renk: `var(--color-border)`
- **User Speaking modu:** 7-9 çizgi, `audioLevel` prop'u ile amplitüd değişir, renk: `var(--color-user)` → `#FF8E53` gradient
- **AI Speaking modu:** 7-9 çizgi, `audioLevel` ile amplitüd değişir, renk: `var(--color-ai)` → `#00E5B0` gradient
- Çizgiler: Her bar yuvarlak köşeli (`lineCap: 'round'`), aralarında eşit boşluk
- Animasyon: Her frame'de phase offset arttır → çizgiler "dans eder"
- `mode` değişince renk smooth geçiş yapar (CSS transition değil, interpolasyon ile)
- Canvas boyutunu `ResizeObserver` ile takip et, `devicePixelRatio`'yu hesaba kat (retina)

### `components/ConversationScreen/MessageBubble.jsx`
```
Props: { message: { role, text, isStreaming } }
```
- **AI mesajı:** Sola hizalı, `var(--color-surface)` arka plan, `var(--color-shadow-md)` gölge, sol kenarında ince `var(--color-ai)` accent çizgisi
- **User mesajı:** Sağa hizalı, `var(--color-accent)` arka plan, beyaz metin
- **Streaming modu:** Metnin sonuna titreyen cursor ekle (`|` karakteri, 500ms blink)
- **Giriş animasyonu:** `slideInLeft` (AI) veya `slideInRight` (user), `fadeInUp` ile kombine
- Timestamp: hover'da görünür, sağ alt köşe, küçük ve muted

### `components/ConversationScreen/MicButton.jsx`
```
Props: { }  ← store'dan state okur
```
- Boyut: 72x72px daire
- **Idle:** `var(--color-surface)` arka plan, `var(--color-border)` kenarlık, mikrofon ikonu (lucide-react'tan)
- **Listening:** `var(--color-user)` arka plan, beyaz ikon, dışında `pulseRing` animasyonu (2 halka)
- **AI konuşurken:** disabled, opaklık azalmış, küçük "AI is speaking..." text
- **Hover:** subtle scale(1.05) transform
- Tıklanınca: `useSTT`'den `startListening`/`stopListening` çağır
- Final transcript gelince `useConversation`'dan `sendMessage` çağır

### `components/Settings/index.jsx`
Sağdan kayan panel (slide-in, backdrop blur overlay):
- **Provider seçimi:** Dropdown — Gemini, OpenAI, Anthropic, Groq, Ollama, LMStudio
- **API Key inputu:** Provider seçimine göre göster/gizle, `type="password"`
- **STT seçimi:** Toggle — "Browser (Web Speech)" / "Whisper (Local)"
- **Voice seçimi:** Kokoro voice dropdown (af_heart, af_bella, af_sarah, am_adam)
- **Connection test butonu:** Seçili provider'a ping at, sonucu göster (✓ veya ✗)
- Ayarlar localStorage'a kaydedilir, sayfa yenilenince korunur

### `components/shared/Logo.jsx`
"LinguaAI" — "Lingua" kısmı `var(--font-display)` Fraunces ile, "AI" kısmı küçük bir badge görünümünde `var(--color-accent)` arka planlı.

### `components/shared/StatusIndicator.jsx`
```
Props: { status: 'connected'|'connecting'|'disconnected' }
```
- Küçük renkli nokta + metin
- connected: yeşil + "Connected"
- connecting: sarı, pulse animasyonu + "Connecting..."
- disconnected: kırmızı + "Disconnected"

---

## Docker & Altyapı

### `docker-compose.yml`
```yaml
version: '3.9'
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - VITE_WS_URL=ws://localhost:3001
    depends_on: [backend]

  backend:
    build: ./backend
    ports: ["3001:3001"]
    env_file: .env
    environment:
      - KOKORO_URL=http://kokoro:8880

  kokoro:
    image: ghcr.io/remsky/kokoro-fastapi-cpu:v0.2.2
    ports: ["8880:8880"]
    # GPU versiyonu için: ghcr.io/remsky/kokoro-fastapi-gpu:v0.2.2
```

### `docker-compose.override.yml` (opsiyonel Whisper)
```yaml
services:
  whisper:
    image: onerahmet/openai-whisper-asr-webservice:latest
    ports: ["9000:9000"]
    environment:
      - ASR_MODEL=base
      - ASR_ENGINE=openai_whisper
  backend:
    environment:
      - STT_PROVIDER=whisper
      - WHISPER_URL=http://whisper:9000
```

### `.env.example`
```env
# ─── AI Provider ───────────────────────────────
AI_PROVIDER=gemini
# Options: gemini | openai | anthropic | groq | ollama | lmstudio

# ─── API Keys (sadece seçili provider gerekli) ──
GEMINI_API_KEY=your_key_here
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GROQ_API_KEY=

# ─── Local Providers ───────────────────────────
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
LMSTUDIO_BASE_URL=http://localhost:1234
LMSTUDIO_MODEL=local-model

# ─── STT ───────────────────────────────────────
STT_PROVIDER=webspeech
# Options: webspeech | whisper
WHISPER_URL=http://whisper:9000

# ─── TTS ───────────────────────────────────────
KOKORO_URL=http://kokoro:8880
KOKORO_VOICE=af_heart
```

### `frontend/vite.config.js`
```js
// proxy: /api → http://backend:3001
// proxy: /ws  → ws://backend:3001
// host: true (docker içinden erişim için)
```

### `.gitignore`
```
node_modules/
.env
dist/
*.log
.DS_Store
```

---

## Kalite Gereksinimleri

### Kod Standartları
- Her dosya için JSDoc/comment açıklaması: modülün amacı, export edilen her fonksiyon/hook
- PropTypes yerine JSDoc @param ile tip açıklamaları (TypeScript değil, saf JS)
- Magic number yok: tüm sabitler üst kısımda `const` olarak tanımlanır
- Async/await kullan, `.then()` zinciri yok
- Her `useEffect`'in cleanup fonksiyonu var (WebSocket, AudioContext, AnimationFrame için kritik)

### Hata Yönetimi
- WebSocket bağlantısı kurulamazsa: kullanıcıya toast notification
- Mikrofon izni reddedilirse: modal açıkla, izin istemek için yönlendir
- Provider hatası (API key yanlış vb): settings'i otomatik aç, hatayı göster
- Kokoro TTS çalışmazsa: sadece text göster, sessiz devam et (graceful degradation)

### Erişilebilirlik
- Tüm interaktif elementlerin `aria-label`'ı var
- Klavye navigasyonu çalışır (Tab, Enter, Space)
- Renk kontrastı WCAG AA uyumlu

### README.md
Şunları içermeli:
1. Proje açıklaması + screenshot placeholder
2. **Hızlı başlangıç** (sadece 3 adım: clone, .env düzenle, docker compose up)
3. Provider yapılandırma tablosu
4. Geliştirme ortamı kurulumu (docker olmadan)
5. Mimari diyagramı (ASCII)
6. v2 yol haritası
7. Katkıda bulunma rehberi

---

## Önemli Notlar

1. **Tüm dosyaları yaz** — placeholder veya "// TODO" bırakma. Her dosya çalışır durumda olmalı.
2. **Import tutarlılığı** — relative import path'leri doğru ol. `../../hooks/useSTT` gibi.
3. **WaveAnimation performansı** — Canvas loop'unda gereksiz object allocation yapma. `requestAnimationFrame` ID'sini sakla, cleanup'ta `cancelAnimationFrame` çağır.
4. **Zustand store** — component içinde `useStore(state => state.specificField)` ile seçici kullan, tüm store'u subscribe etme.
5. **WebSocket reconnect** — backend yeniden başlatılınca frontend otomatik bağlanmalı, kullanıcı müdahalesi gerekmemeli.
6. **Kokoro API formatı** — `POST /v1/audio/speech` endpoint'i, body: `{ model: "kokoro", input: text, voice: voice, response_format: "mp3" }`