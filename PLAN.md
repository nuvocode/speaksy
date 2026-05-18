# Plan: Speaksy Marketplace + Astro Landing Site

## Context

Speaksy (lingua-ai) has a script-based conversation mode with JSON import/export. A marketplace button exists in ScriptConfig.jsx currently calling `alert('Coming Soon!')`. The goal is to:
1. Create a `site/` directory with an Astro landing site for `speaksy.nuvo.page`
2. Store marketplace script data as static JSON served from the site
3. Wire up the marketplace button to a real modal that fetches and imports scripts

---

## Architecture

```
lingua-ai/
├── frontend/          ← React app (unchanged structure)
├── backend/           ← Node.js backend (unchanged)
├── site/              ← NEW: Astro landing + marketplace site
│   ├── public/
│   │   └── marketplace/
│   │       └── index.json                ← script data served as static file
│   ├── src/
│   │   └── pages/
│   │       ├── index.astro               ← landing page
│   │       └── marketplace.astro         ← script browser
│   ├── astro.config.mjs
│   └── package.json
└── .github/workflows/
    └── deploy-site.yml                   ← NEW: Cloudflare Pages deploy
```

**Data flow:** `site/public/marketplace/index.json` is:
- Served statically at `speaksy.nuvo.page/marketplace/index.json`
- Imported at build-time by Astro's marketplace page
- Fetched at runtime by the frontend app's marketplace modal

---

## Step 1 — Marketplace JSON Data

**File: `site/public/marketplace/index.json`**

Migrate all 5 scripts from `frontend/src/data/scripts.js` into JSON format, adding `author`, `language`, `tags` fields to each entry. Full script objects (including `lines`) — no separate per-script files.

Schema per entry:
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "difficulty": "beginner|intermediate|advanced",
  "estimatedMinutes": number,
  "author": "Speaksy Team",
  "language": "en",
  "tags": ["string"],
  "lines": [{ "role": "ai|user", "text": "string" }]
}
```

Tags per script:
- `coffee-shop` → `["daily-life", "ordering", "small-talk"]`
- `job-interview` → `["professional", "formal", "career"]`
- `travel-directions` → `["travel", "navigation"]`
- `doctor-visit` → `["health", "formal"]`
- `restaurant-reservation` → `["daily-life", "phone-call", "booking"]`

---

## Step 2 — Astro Site Package

**Files to create:**

### `site/package.json`
```json
{
  "name": "speaksy-site",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "astro": "^4.16.0"
  }
}
```
No UI framework — pure Astro with inline `<style>` blocks.

### `site/astro.config.mjs`
```js
import { defineConfig } from 'astro/config';
export default defineConfig({
  output: 'static',
  site: 'https://speaksy.nuvo.page',
});
```

### `site/src/pages/index.astro` — Landing Page

Sections:
1. **Hero**: "Speaksy" with gradient text (`linear-gradient(135deg, #a855f7, #ec4899)`), tagline, two CTA buttons → Docker Hub + `/marketplace`
2. **Feature cards** (3): Script Mode, Multi-Provider AI, Freestyle Practice
3. **Docker quickstart**: `<pre><code>` block with `docker pull nuvocode/speaksy && docker run...`
4. **Footer**: MIT · GitHub · Nuvo Code

Style: dark theme, `#09090b` bg, `#a855f7` accent, Inter + JetBrains Mono fonts via `<link>` (Google Fonts), all styles in scoped `<style>` block within the `.astro` file.

### `site/src/pages/marketplace.astro` — Script Browser

Build-time data import:
```js
// frontmatter
import scripts from '../../public/marketplace/index.json';
```

UI:
- Filter buttons: All / Beginner / Intermediate / Advanced (vanilla JS `<script>` tag toggles `display` on `<article data-difficulty="...">` cards)
- Script cards: title, difficulty badge (hex colors matching DIFFICULTY_COLORS), duration, author, tags as chips, description, line count
- "Contribute" section at bottom: link to GitHub PRs

---

## Step 3 — GitHub Actions Deploy (Cloudflare Pages)

**File: `.github/workflows/deploy-site.yml`**

```yaml
name: Deploy Astro Site

on:
  push:
    branches: [master]
    paths: ['site/**']
  workflow_dispatch:

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: site/package-lock.json
      - run: npm ci
        working-directory: site
      - run: npm run build
        working-directory: site
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: speaksy-site
          directory: site/dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

> **One-time Cloudflare setup required:**
> 1. Cloudflare Pages dashboard → Create project → `speaksy-site`
> 2. GitHub repo → Settings → Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
> 3. Cloudflare Pages project → Custom domains → `speaksy.nuvo.page`
>
> CNAME dosyası gerekmez — domain Cloudflare dashboard'dan yönetilir.

Trigger: only when `site/**` changes — Docker workflow is unaffected.

---

## Step 4 — Frontend Marketplace Modal

**File modified:** `frontend/src/components/ModeSelection/ScriptConfig.jsx`

### New state (add after existing state declarations):
```js
const [marketplaceOpen, setMarketplaceOpen] = useState(false);
const [marketplaceItems, setMarketplaceItems] = useState([]);
const [marketplaceLoading, setMarketplaceLoading] = useState(false);
const [marketplaceError, setMarketplaceError] = useState('');
const [importedIds, setImportedIds] = useState(
  () => new Set(loadCustomScripts().map(s => s.id))
);
```

### New handlers:
```js
const openMarketplace = async () => {
  setMarketplaceOpen(true);
  setMarketplaceError('');
  setMarketplaceLoading(true);
  try {
    const url = import.meta.env.VITE_MARKETPLACE_URL ?? 'https://speaksy.nuvo.page/marketplace/index.json';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!validateScripts(data)) throw new Error('Invalid marketplace data format.');
    setMarketplaceItems(data);
  } catch (err) {
    setMarketplaceError(err.message || 'Failed to load marketplace.');
  } finally {
    setMarketplaceLoading(false);
  }
};

const handleMarketplaceImport = (script) => {
  const existing = loadCustomScripts();
  const merged = [
    ...existing.filter(s => s.id !== script.id),
    { ...script, _imported: true, _source: 'marketplace' },
  ];
  saveCustomScripts(merged);
  setCustomScripts(merged);
  setImportedIds(prev => new Set([...prev, script.id]));
};
```

### Button change (single line):
```js
// BEFORE:
onClick={() => { alert('Coming Soon!'); }}
// AFTER:
onClick={openMarketplace}
```

### New style entries (add to `styles` object):
```js
marketplaceModal: {
  backgroundColor: 'var(--color-s1)',
  border: '1px solid var(--color-b2)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-6)',
  width: '100%',
  maxWidth: '52vw',
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  boxShadow: '0 24px 48px rgba(0,0,0,.25)',
},
marketplaceBody: {
  flex: 1,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
},
marketplaceCardFooter: {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 'var(--space-1)',
},
tagChip: {
  display: 'inline-flex',
  padding: '2px 6px',
  borderRadius: 'var(--radius-sm)',
  fontFamily: 'var(--font-mono)',
  fontSize: '8px',
  color: 'var(--color-t4)',
  backgroundColor: 'var(--color-s3)',
  border: '1px solid var(--color-b2)',
  letterSpacing: '0.04em',
},
importedBtn: {
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--weight-medium)',
  color: 'var(--color-green)',
  backgroundColor: 'rgba(74,222,128,.08)',
  border: '1px solid rgba(74,222,128,.2)',
  borderRadius: 'var(--radius-md)',
  padding: '4px 10px',
  minHeight: 'auto',
  cursor: 'default',
},
importBtn: {
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--weight-medium)',
  color: 'var(--color-purple)',
  backgroundColor: 'rgba(168,85,247,.08)',
  border: '1px solid rgba(168,85,247,.2)',
  borderRadius: 'var(--radius-md)',
  padding: '4px 10px',
  minHeight: 'auto',
  cursor: 'pointer',
  transition: 'background-color 150ms',
},
modalCloseBtn: {
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-t3)',
  background: 'transparent',
  border: 'none',
  minHeight: 'auto',
  minWidth: 'auto',
  cursor: 'pointer',
  padding: '2px 6px',
  lineHeight: 1,
},
skeletonCard: {
  height: 90,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-b2)',
  background: 'linear-gradient(90deg, var(--color-s2) 25%, var(--color-s3) 50%, var(--color-s2) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
},
marketplaceFooterRow: {
  flexShrink: 0,
  borderTop: '1px solid var(--color-b1)',
  paddingTop: 'var(--space-3)',
  display: 'flex',
  justifyContent: 'center',
},
```

> **Note:** `minHeight: 'auto'` overrides `globals.css`'s `button { min-height: 44px }`. Required for `importedBtn`, `importBtn`, and `modalCloseBtn`. The `importIconBtn` style already does this via explicit `width/height: 24px`.

### Marketplace modal JSX (add alongside existing `importOpen` modal block):
```jsx
{marketplaceOpen && (
  <div style={styles.backdrop} onClick={() => setMarketplaceOpen(false)}>
    <div style={styles.marketplaceModal} onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div style={styles.sectionLabelRow}>
        <span style={styles.modalTitle}>Marketplace</span>
        <button style={styles.modalCloseBtn} onClick={() => setMarketplaceOpen(false)}>✕</button>
      </div>

      {/* Body */}
      <div style={styles.marketplaceBody}>
        {marketplaceLoading && [0, 1, 2].map(i => (
          <div key={i} style={styles.skeletonCard} />
        ))}

        {marketplaceError && !marketplaceLoading && (
          <div style={{ ...styles.errorMsg, display: 'flex', alignItems: 'center', gap: 8 }}>
            {marketplaceError}
            <button style={styles.sampleBtn} onClick={openMarketplace}>Retry</button>
          </div>
        )}

        {!marketplaceLoading && !marketplaceError && marketplaceItems.map(script => {
          const isImported = importedIds.has(script.id);
          const diff = DIFFICULTY_COLORS[script.difficulty] || DIFFICULTY_COLORS.beginner;
          return (
            <div key={script.id} style={styles.marketplaceCard}>
              <div style={styles.scriptHeader}>
                <span style={styles.scriptTitle}>{script.title}</span>
                <div style={styles.scriptMeta}>
                  {script.difficulty && (
                    <span style={{ ...styles.badge, color: diff.color, backgroundColor: diff.bg, borderColor: diff.border }}>
                      {DIFFICULTY_LABELS[script.difficulty] ?? script.difficulty}
                    </span>
                  )}
                  {script.estimatedMinutes && (
                    <span style={styles.duration}>~{script.estimatedMinutes}m</span>
                  )}
                </div>
              </div>
              <span style={styles.scriptDescription}>{script.description}</span>
              {script.author && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-t4)' }}>
                  by {script.author}
                </span>
              )}
              {script.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {script.tags.map(tag => <span key={tag} style={styles.tagChip}>{tag}</span>)}
                </div>
              )}
              <div style={styles.marketplaceCardFooter}>
                <span style={{ ...styles.duration, fontSize: '9px' }}>{script.lines.length} lines</span>
                {isImported
                  ? <span style={styles.importedBtn}>Imported ✓</span>
                  : <button style={styles.importBtn} onClick={() => handleMarketplaceImport(script)}>Import</button>
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={styles.marketplaceFooterRow}>
        <a
          href="https://speaksy.nuvo.page/marketplace"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--color-purple)' }}
        >
          Browse at speaksy.nuvo.page/marketplace →
        </a>
      </div>
    </div>
  </div>
)}
```

Note: `styles.marketplaceCard` reuses `styles.scriptCard` visually but without cursor/hover/selected states (it's a display card, not selectable). Add to styles:
```js
marketplaceCard: {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  padding: 'var(--space-4)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-b2)',
  backgroundColor: 'var(--color-s2)',
},
```

---

## Step 5 — Environment Variables

**`frontend/.env.example`** (create):
```
VITE_MARKETPLACE_URL=https://speaksy.nuvo.page/marketplace/index.json
```

**Root `.env.example`** (append):
```
# Speaksy marketplace URL (frontend only)
VITE_MARKETPLACE_URL=https://speaksy.nuvo.page/marketplace/index.json
```

---

## Step 6 — .gitignore Update

Append to root `.gitignore`:
```
# Astro site
site/node_modules/
site/dist/
site/.astro/
```

---

## Implementation Order

1. `site/public/marketplace/index.json` — create JSON data first
2. `site/package.json` + `site/astro.config.mjs` + `site/public/CNAME`
3. `site/src/pages/index.astro` + `site/src/pages/marketplace.astro`
4. Run `npm install` in `site/` (generates `package-lock.json`, must commit it)
5. `frontend/src/components/ModeSelection/ScriptConfig.jsx` — add marketplace modal
6. `frontend/.env.example` + root `.env.example`
7. `.github/workflows/deploy-site.yml`
8. Root `.gitignore` update

---

## Critical Files

| File | Action |
|------|--------|
| `frontend/src/components/ModeSelection/ScriptConfig.jsx` | Modify — add modal |
| `frontend/src/data/scripts.js` | Read-only reference (lines copied to JSON) |
| `frontend/src/styles/animations.css` | Reference — `shimmer` keyframe exists, `animate-shimmer` class has broken vars; use inline style for skeleton |
| `frontend/src/styles/tokens.css` | Reference — design tokens for Astro site |
| `.env.example` | Modify — append new var |
| `.gitignore` | Modify — append site artifacts |
| `site/` | Create — entire directory |
| `.github/workflows/deploy-site.yml` | Create |

---

## Verification

### JSON data
```bash
cd site && npx astro build
# site/dist/marketplace/index.json should exist
python3 -m json.tool site/public/marketplace/index.json  # validates JSON
```

### Astro site locally
```bash
cd site && npm install && npm run dev
# http://localhost:4321 — landing page
# http://localhost:4321/marketplace — 5 script cards, filter works
```

### Frontend modal
```bash
cd frontend && npm run dev
# Select "Script Based" mode → click puzzle icon
# Modal opens, shows 5 cards
# Import a script → "Imported ✓" shows, closes modal → script appears in list with "Custom" badge
# Set VITE_MARKETPLACE_URL=https://invalid.invalid → error state + Retry button
```

### Docker build (must remain unaffected)
```bash
docker build -t speaksy-test .
# Should pass — Dockerfile only touches frontend/ and backend/
```

### Post-deploy
```bash
curl https://speaksy.nuvo.page/marketplace/index.json | python3 -m json.tool
```
