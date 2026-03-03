# LinguaAI — Mode Selection, Topic/Script Modes & Dark/Light Theme Prompt

## Bağlam
Bu prompt, mevcut LinguaAI sistemine eklenti niteliğindedir. Önceki prompt ile kurulmuş olan proje iskeletine (Zustand store, WebSocket altyapısı, token-tabanlı CSS sistemi, React component yapısı) dokunmadan genişletme yapılacak. Mevcut `ConversationScreen` ve tüm hook'lar çalışır durumda; bu prompt yalnızca **yeni dosyaları** ve **değiştirilmesi gereken kısımları** tanımlar.

---

## Genel Akış Değişikliği

### Önceki akış:
```
App açılır → Direkt ConversationScreen
```

### Yeni akış:
```
App açılır → ModeSelectionScreen
                ↓ (mod seçilir + konfig tamamlanır)
             ConversationScreen (mod bilgisi ile)
                ↓ (konuşma biter veya "Back" tıklanır)
             ModeSelectionScreen (state sıfırlanır)
```

`App.jsx`'te `currentView: 'selection' | 'conversation'` ve `activeMode: ModeConfig | null` state'i tutulur. Bu ikisi Zustand store'a eklenir.

---

## Yeni & Değişen Dosyalar

```
frontend/src/
├── App.jsx                                  ← GÜNCELLE
├── store/
│   └── appStore.js                          ← GÜNCELLE (mode state ekle)
├── components/
│   ├── ModeSelection/
│   │   ├── index.jsx                        ← YENİ — Ana ekran
│   │   ├── ModeCard.jsx                     ← YENİ — Tek mod kartı
│   │   ├── TopicConfig.jsx                  ← YENİ — Topic mod konfigürasyonu
│   │   └── ScriptConfig.jsx                 ← YENİ — Script mod konfigürasyonu
│   ├── ConversationScreen/
│   │   ├── index.jsx                        ← GÜNCELLE (mod bilgisini al, back butonu ekle)
│   │   └── ScriptPrompt.jsx                 ← YENİ — Script modunda sıradaki satırı göster
│   └── shared/
│       └── ThemeToggle.jsx                  ← YENİ — Gün/gece geçişi
├── data/
│   ├── topics.js                            ← YENİ — Konu listesi
│   └── scripts.js                           ← YENİ — Hazır script'ler
└── styles/
    └── tokens.css                           ← GÜNCELLE (dark mode token'ları ekle)
```

Ayrıca backend'de:
```
backend/src/services/
└── prompt.js                                ← GÜNCELLE (3 mod için system prompt)
```

---

## 1. Store Güncellemesi (`appStore.js`)

Mevcut store'a şu alanlar eklenir:

```js
// ─── View & Mode ──────────────────────────────────────────
currentView: 'selection',        // 'selection' | 'conversation'
activeMode: null,                 // ModeConfig object (aşağıda tanımlı)
setView: (view) => ...,
setActiveMode: (mode) => ...,
startSession: (modeConfig) => ...,  // view'ı 'conversation' yapar, mode'u set eder
endSession: () => ...,              // view'ı 'selection' yapar, mesajları temizler

// ─── Theme ────────────────────────────────────────────────
theme: 'light',                   // 'light' | 'dark' — localStorage'dan başlatılır
toggleTheme: () => ...,
```

**ModeConfig tipi** (JSDoc ile belgelenecek):
```js
/**
 * @typedef {Object} ModeConfig
 * @property {'freestyle' | 'topic' | 'script'} type
 * @property {string} label           — Görünen isim
 * @property {Object} [topicConfig]   — Yalnızca type === 'topic' için
 * @property {string} topicConfig.topic        — Seçilen konu (ör. "Cinema")
 * @property {string} [topicConfig.subtopic]   — Opsiyonel alt konu (ör. "Hollywood")
 * @property {Object} [scriptConfig]  — Yalnızca type === 'script' için
 * @property {string} scriptConfig.scriptId    — Script ID'si
 * @property {string} scriptConfig.title       — Script başlığı
 * @property {Array}  scriptConfig.lines       — [{role: 'user'|'ai', text: string}]
 * @property {number} scriptConfig.currentLine — Şu an okunacak satır index'i
 */
```

---

## 2. Dark Mode Token Sistemi (`tokens.css`)

Mevcut `:root` token'larını koru. Bunlara ek olarak `[data-theme="dark"]` selector'ı ekle:

```css
[data-theme="dark"] {
  --color-bg: #0F0F14;
  --color-surface: #1A1A24;
  --color-surface-2: #24243A;       /* İkincil yüzeyler için */
  --color-primary: #F0F0F8;
  --color-accent: #7C73FF;          /* Hafif daha açık — dark'ta kontrast */
  --color-ai: #00DFA8;
  --color-user: #FF7A7A;
  --color-muted: #6E6E8A;
  --color-border: #2A2A40;
  --color-border-strong: #3A3A58;

  --shadow-sm: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.2);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.5);
}
```

`document.documentElement`'e `data-theme` attribute'u set edilir — CSS class değil attribute kullanılır. Bu sayede CSS selector spesifisitesi öngörülebilir kalır. Theme değişimi `localStorage`'a kaydedilir, `useEffect` ile sayfa yüklenişinde restore edilir.

Geçiş animasyonu: `html` elementine `transition: background-color 300ms var(--ease-out), color 300ms var(--ease-out)` ekle. Ancak bu geçiş yalnızca kullanıcı toggle'ladığında aktif olsun; sayfa ilk yüklenişinde (localStorage'dan restore ederken) flash'ı önlemek için `data-theme-loaded` attribute'u eklenene kadar transition'ı devre dışı bırak.

---

## 3. Theme Toggle Komponenti (`ThemeToggle.jsx`)

Header'ın sağ tarafına yerleştirilecek, settings ikonunun yanına.

**Tasarım:**
- Pill-shaped toggle switch (48x26px)
- **Light modda:** Sarı-turuncu gradient (`#FFB347` → `#FF8C00`), içinde ☀️ ikonuna benzer daire
- **Dark modda:** Derin mavi-mor gradient (`#2D2D5E` → `#1A1A3E`), içinde ay ikonu (lucide-react'tan `Moon` ve `Sun`)
- Toggle'ın hareketi: daire `translateX` ile kayar, `transition: transform 300ms var(--ease-out)`
- Hover efekti: hafif `box-shadow` büyümesi
- `aria-label="Toggle dark mode"`, `role="switch"`, `aria-checked={isDark}`

---

## 4. Mode Selection Ekranı

### `components/ModeSelection/index.jsx`

**Layout:**
```
┌─────────────────────────────────────────┐
│  [Logo]                    [⚙] [🌙/☀️] │  ← Header (mevcut ile aynı)
│                                         │
│   Welcome back.                         │  ← Fraunces display font, büyük
│   What shall we practice today?         │  ← DM Sans, muted renk
│                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │          │ │          │ │          ││
│  │   Free   │ │  Topic   │ │  Script  ││  ← Büyük kartlar
│  │  Style   │ │  Based   │ │  Based   ││
│  │          │ │          │ │          ││
│  └──────────┘ └──────────┘ └──────────┘│
│                                         │
│  [Konfigürasyon alanı — mod seçince açılır]│
│                                         │
└─────────────────────────────────────────┘
```

**Davranış:**
1. Sayfa yüklenince kartlar `fadeInUp` + staggered delay (0ms, 80ms, 160ms) ile gelir
2. Kart seçilince altında konfigürasyon paneli `expand` animasyonuyla açılır (height: 0 → auto, `overflow: hidden`, CSS transition)
3. Free Style seçilince konfigürasyon gerekmez → "Start Conversation" butonu hemen aktif olur
4. Topic veya Script seçilince konfigürasyon doldurulana kadar buton disabled kalır
5. "Start Conversation" tıklanınca → `store.startSession(modeConfig)` çağrılır → view 'conversation' olur
6. Yeni mod eklemek için `MODES` dizisine yeni obje eklemek yeterli (data-driven yaklaşım)

**MODES dizisi (genişletilebilir yapı):**
```js
const MODES = [
  {
    id: 'freestyle',
    label: 'Free Style',
    description: 'Open-ended conversation on any topic',
    icon: 'MessageCircle',   // lucide-react icon adı
    color: '--color-accent',
    hasConfig: false,
  },
  {
    id: 'topic',
    label: 'Topic Based',
    description: 'Deep dive into a specific subject',
    icon: 'BookOpen',
    color: '--color-ai',
    hasConfig: true,
    configComponent: 'TopicConfig',
  },
  {
    id: 'script',
    label: 'Script Based',
    description: 'Practice with structured dialogues',
    icon: 'FileText',
    color: '--color-user',
    hasConfig: true,
    configComponent: 'ScriptConfig',
  },
]
```

### `components/ModeSelection/ModeCard.jsx`

```
Props: { mode, isSelected, onSelect }
```

**Kart tasarımı:**
- Boyut: `min-height: 180px`, `flex: 1`, maksimum genişlik 280px
- **Seçilmemiş:** `var(--color-surface)` zemin, `var(--color-border)` kenarlık, `var(--shadow-sm)`
- **Seçili:** `var(--color-surface)` zemin, `2px solid` mod renginde kenarlık, `var(--shadow-md)`, hafif `translateY(-4px)`
- **Hover:** `var(--shadow-md)`, `translateY(-2px)`, geçiş `250ms var(--ease-out)`
- Üstte büyük ikon (32px, mod rengiyle)
- Ortada `var(--font-display)` ile mod adı (büyük, 1.5rem)
- Altında `var(--font-ui)` ile açıklama (küçük, muted)
- Seçili köşesinde küçük ✓ işareti (sağ üst, absolute pozisyon, mod rengiyle)
- Tüm geçişler `transition: all 250ms var(--ease-out)`

### `components/ModeSelection/TopicConfig.jsx`

**UI Yapısı:**
1. **Konu seçici** — Pill butonları grid'i (her biri tıklanabilir, seçilince `var(--color-ai)` arka plan)
2. **Alt konu input** (opsiyonel) — `placeholder="Add a focus area... (optional)"`, küçük ve sade
3. Konu seçilince parent'a `{ topic, subtopic }` callback

**`data/topics.js`'den beslenir:**
```js
export const TOPICS = [
  { id: 'cinema', label: 'Cinema', emoji: '🎬' },
  { id: 'technology', label: 'Technology', emoji: '💻' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'food', label: 'Food & Cuisine', emoji: '🍜' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'science', label: 'Science', emoji: '🔬' },
  { id: 'history', label: 'History', emoji: '📜' },
  { id: 'art', label: 'Art & Design', emoji: '🎨' },
  { id: 'business', label: 'Business', emoji: '💼' },
  { id: 'health', label: 'Health & Fitness', emoji: '🏃' },
  { id: 'environment', label: 'Environment', emoji: '🌿' },
]
```

Pill butonları: wrap eden bir `flex-wrap` container. Seçilen pill büyür (`scale(1.05)`), diğerleri hafif solar (`opacity: 0.6`).

### `components/ModeSelection/ScriptConfig.jsx`

**UI Yapısı:**
1. **Script listesi** — Kart formatında script'ler, her birinde başlık + kısa açıklama + süre tahmini + zorluk badge'i
2. Seçilen script'in ilk birkaç satırı önizleme olarak gösterilir (hafif blur overlay ile "Select to reveal")
3. Seçilince parent'a `scriptConfig` objesi callback

**`data/scripts.js` yapısı:**
```js
export const SCRIPTS = [
  {
    id: 'coffee-shop',
    title: 'At the Coffee Shop',
    description: 'Order your favorite drink and chat with the barista',
    difficulty: 'beginner',    // 'beginner' | 'intermediate' | 'advanced'
    estimatedMinutes: 5,
    lines: [
      { role: 'ai',   text: "Good morning! What can I get for you today?" },
      { role: 'user', text: "Hi! I'd like a large latte, please." },
      { role: 'ai',   text: "Sure! Would you like any flavor syrup with that?" },
      { role: 'user', text: "Yes, vanilla please. And can I get it to go?" },
      { role: 'ai',   text: "Of course! That'll be $5.50. Can I get a name for the order?" },
      { role: 'user', text: "It's Alex. Thanks!" },
    ]
  },
  {
    id: 'job-interview',
    title: 'Job Interview',
    description: 'Practice common interview questions and professional responses',
    difficulty: 'intermediate',
    estimatedMinutes: 10,
    lines: [
      { role: 'ai',   text: "Good afternoon, please have a seat. Tell me a bit about yourself." },
      { role: 'user', text: "Thank you for having me. I'm a software developer with five years of experience..." },
      { role: 'ai',   text: "Interesting! What made you apply for this position?" },
      { role: 'user', text: "I've been following your company for a while and I'm impressed by your work on..." },
      // ... devam eder
    ]
  },
  {
    id: 'travel-directions',
    title: 'Asking for Directions',
    description: 'Navigate an unfamiliar city with confidence',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    lines: [
      { role: 'user', text: "Excuse me, could you help me find the nearest metro station?" },
      { role: 'ai',   text: "Sure! Go straight for two blocks, then turn left at the traffic lights." },
      { role: 'user', text: "And how far is it from here?" },
      { role: 'ai',   text: "About a ten-minute walk. You can't miss the big red sign." },
    ]
  },
  {
    id: 'doctor-visit',
    title: 'Doctor Appointment',
    description: 'Describe symptoms and understand medical advice',
    difficulty: 'intermediate',
    estimatedMinutes: 8,
    lines: [
      { role: 'ai',   text: "Hello, what seems to be the problem today?" },
      { role: 'user', text: "I've had a headache for three days and I feel quite tired." },
      { role: 'ai',   text: "I see. Any fever or nausea along with that?" },
      // ...
    ]
  },
  {
    id: 'restaurant-reservation',
    title: 'Restaurant Reservation',
    description: 'Make and modify a restaurant booking over the phone',
    difficulty: 'beginner',
    estimatedMinutes: 5,
    lines: [
      { role: 'ai',   text: "Thank you for calling La Maison. How can I help you?" },
      { role: 'user', text: "Hi, I'd like to make a reservation for two people this Saturday evening." },
      // ...
    ]
  },
]
```

Zorluk badge renkleri:
- `beginner` → `var(--color-ai)` (yeşil)
- `intermediate` → `#FFB347` (turuncu)
- `advanced` → `var(--color-user)` (kırmızı)

---

## 5. ConversationScreen Güncellemeleri

### `components/ConversationScreen/index.jsx` — Değişiklikler

**Eklenenler:**
1. **Back butonu** — Header'da logo'nun yanında `← Back` (chevron + metin), tıklanınca `store.endSession()` çağrılır. Öncesinde küçük bir "Are you sure?" confirm modal açılır (devam eden bir konuşma varsa)
2. **Mod badge'i** — Header ortasında seçili modu gösteren küçük pill (ör. "📚 Topic: Cinema · Hollywood")
3. Script modunda **ScriptPrompt** komponenti mesaj alanının üstünde sabit görünür

**Script modu davranışı:**
- Konuşma AI'ın ilk satırı söylemesiyle başlar (script'ten `role: 'ai'` olan ilk satır otomatik gönderilir)
- Kullanıcının mikrofonu açıp söylemesi beklenir. Kullanıcı konuşunca STT transcript'i karşılaştırılmaz (kelimesi kelimesine değil, fikir bazlı); AI "Çok iyi! Şimdi şunu deneyelim:" tarzında devam eder
- `store.activeMode.scriptConfig.currentLine` sayacı ilerler
- Tüm satırlar bittinde "Script completed! 🎉" ekranı gösterilir

### `components/ConversationScreen/ScriptPrompt.jsx`

Script modunda aktif iken mesaj alanının üstünde, sabit bir "teleprompter" şeridi:

```
┌─────────────────────────────────────────────────┐
│ 📄 Your line:                          [2 / 6] │
│ "Hi! I'd like a large latte, please."           │
└─────────────────────────────────────────────────┘
```

- Arka plan: `var(--color-surface-2)` (dark modda belirginleşir)
- Sol kenarda ince `var(--color-accent)` çizgi (AI mesajlarındaki gibi ama accent rengiyle)
- Metin `var(--font-display)` ile italik — "sahne metni" hissiyatı
- Sağda `[mevcut / toplam]` sayacı
- User satırı değil de AI satırıysa: "AI is speaking..." gösterilir, mic disable

---

## 6. Backend Prompt Güncellemesi (`prompt.js`)

`buildSystemPrompt(modeConfig)` fonksiyonu 3 mod için farklı prompt üretir:

### Free Style
```
You are a warm, engaging English conversation partner. Your role:
- Speak naturally and with genuine curiosity
- Gently weave corrections into your responses naturally (never say "you made a mistake")
- Keep responses to 2-4 sentences to maintain conversation rhythm  
- Ask one follow-up question per response to keep the flow going
- Match the user's energy and vocabulary level
Current mode: Free Style — no topic constraints, follow the user's lead.
```

### Topic Based
```
You are an English conversation partner focused on a specific topic.
Topic: {topic}{subtopic ? ` (specifically: ${subtopic})` : ''}

Your role:
- Stay on topic but allow natural tangents
- Introduce relevant vocabulary naturally — use a new word in context, then explain it briefly
- Keep responses to 2-4 sentences
- Ask follow-up questions that deepen the discussion
- Share interesting facts about the topic to inspire the user
Current mode: Topic Based — guide the conversation around ${topic}.
```

### Script Based
```
You are a conversation partner helping someone practice a scripted dialogue.
Script: {scriptTitle}

Current script line expected from user: "{expectedUserLine}"

Your role:
- After the user speaks, acknowledge their attempt warmly (even if imperfect)
- Deliver the NEXT line from the script naturally, as if in real conversation
- If the user's response was very different from the script, gently bridge: "Nice! In the script you might also say: [correct line]. Now, [next AI line]"
- Never break character — stay in the scenario
- If the script is complete, congratulate the user enthusiastically

Script context:
{scriptLines.map((l, i) => `${l.role.toUpperCase()}: ${l.text}`).join('\n')}
Current position: line {currentLine + 1} of {totalLines}
```

WebSocket `message` olayında `modeConfig` da iletilir:
```js
// Client → Server (güncellenen format)
{ 
  type: 'message', 
  text: string, 
  sessionId: string,
  modeConfig: ModeConfig    // ← YENİ
}
```

---

## 7. Animasyon & Geçiş Detayları

### ModeSelection → ConversationScreen geçişi
- ModeSelection ekranı `fadeOut + slideUp` (500ms) ile çıkar
- ConversationScreen `fadeIn + slideUp` (500ms, 200ms delay) ile girer
- Bu geçiş `App.jsx`'te CSS class toggle ile yönetilir: `view-entering`, `view-leaving`

### Kart seçim animasyonu
- Kart seçilince: `scale(0.97)` → `scale(1.03)` → `scale(1)` (100ms içinde, spring-like)
- Seçilmeyen kartlar: `opacity: 1` → `opacity: 0.65` (200ms)
- Konfigürasyon paneli: `max-height: 0; overflow: hidden` → `max-height: 500px` (350ms ease)

### Theme geçişi
- `data-theme` değişince `html` element'indeki transition tüm token-kullanan elementleri kapsar
- İkon değişimi (Sun↔Moon): `rotate(180deg) + scale(0)` → `rotate(0deg) + scale(1)` (300ms)

---

## 8. Genişletilebilirlik Mimarisi

Yeni mod eklemek için yapılması gereken **sadece 2 şey**:

1. `data/topics.js` veya `data/scripts.js`'e veri ekle (script için)
2. `ModeSelection/index.jsx`'teki `MODES` dizisine yeni obje ekle:
```js
{
  id: 'roleplay',
  label: 'Role Play',
  description: 'Immersive scenario-based practice',
  icon: 'Drama',
  color: '--color-accent',
  hasConfig: true,
  configComponent: 'RolePlayConfig',  // yeni komponent
}
```
3. `components/ModeSelection/RolePlayConfig.jsx` yaz
4. `backend/src/services/prompt.js`'e yeni `case` ekle

Başka hiçbir dosyaya dokunmak gerekmez.

---

## Kalite Gereksinimleri (önceki prompttaki kuralların devamı)

- `tokens.css`'e eklenen her yeni token `[data-theme="dark"]` içinde de karşılığını almalı
- `ThemeToggle` ve `ModeCard` componentlerinin her ikisi de hem light hem dark modda test edilmeli
- Script data'sı şimdilik `data/scripts.js`'te statik; ileride API'den çekilebilir hale gelmesi için `ScriptConfig` içinde `async loadScripts()` pattern kullanılabilir (şimdilik sync import, ama yapı hazır olsun)
- `ModeSelection` ekranındaki tüm kartlar keyboard navigasyonu desteklemeli (`Tab` + `Enter`/`Space`)
- Dark modda `WaveAnimation` canvas renkleri de CSS token'lardan bağımsız olduğu için `getComputedStyle(document.documentElement).getPropertyValue('--color-ai')` ile dinamik okunmalı — tema değişince canvas renkleri de güncellenmelidir
- `ScriptConfig`'daki preview blur: ilk 2 satır görünür, kalanlar `filter: blur(4px)` ile, seçince tümü açılır

---

## Teslim Edilecek Dosyalar (tam liste)

Aşağıdaki her dosya eksiksiz, çalışır şekilde yazılmalı — hiçbir placeholder bırakılmayacak:

**Yeni dosyalar:**
1. `frontend/src/components/ModeSelection/index.jsx`
2. `frontend/src/components/ModeSelection/ModeCard.jsx`
3. `frontend/src/components/ModeSelection/TopicConfig.jsx`
4. `frontend/src/components/ModeSelection/ScriptConfig.jsx`
5. `frontend/src/components/ConversationScreen/ScriptPrompt.jsx`
6. `frontend/src/components/shared/ThemeToggle.jsx`
7. `frontend/src/data/topics.js`
8. `frontend/src/data/scripts.js`

**Güncellenen dosyalar:**
9. `frontend/src/App.jsx` — view routing + theme init
10. `frontend/src/store/appStore.js` — mode + theme state
11. `frontend/src/styles/tokens.css` — dark mode token'ları
12. `frontend/src/styles/animations.css` — yeni keyframe'ler (view geçişleri, card seçimi)
13. `frontend/src/components/ConversationScreen/index.jsx` — back butonu, mod badge, script desteği
14. `backend/src/services/prompt.js` — 3 mod için system prompt
15. `backend/src/websocket/handler.js` — modeConfig parametresi desteği