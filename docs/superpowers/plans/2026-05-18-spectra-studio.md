# Spectra Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** React+Vite+TS+Vanilla CSS로 Spectra Studio UI를 구현한다 — 사이드바·헤더·상태바 셸을 먼저 구축하고, Step1(미디어 준비) 화면을 완성한다.

**Architecture:** App.tsx가 전체 상태(tracks, step)를 보유하고 Sidebar/Header/StatusBar/Step 컴포넌트에 props로 전달. 각 화면은 독립 컴포넌트. CSS는 컴포넌트별 .css + 전역 design token(:root 변수).

**Tech Stack:** React 18, Vite 5, TypeScript 5, Vanilla CSS, Vitest + @testing-library/react

---

### Task 1: 프로젝트 부트스트랩

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/test-setup.ts`

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "spectra-studio",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.3",
    "typescript": "^5.7.3",
    "vite": "^5.4.11",
    "vitest": "^2.1.8",
    "jsdom": "^25.0.1"
  }
}
```

- [ ] **Step 2: vite.config.ts 작성**

```typescript
// Vite 설정 — React + Vitest 통합
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
  },
})
```

- [ ] **Step 3: tsconfig.json 작성**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: index.html 작성**

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
    <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <title>Spectra Studio</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: src/test-setup.ts + src/main.tsx 작성**

`src/test-setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

`src/main.tsx`:
```typescript
// 앱 진입점 — React 루트 마운트
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 6: npm install 실행**

```bash
npm install
```

Expected: `node_modules/` 생성, `package-lock.json` 생성, 오류 없음.

- [ ] **Step 7: 커밋**

```bash
git add package.json vite.config.ts tsconfig.json index.html src/main.tsx src/test-setup.ts
git commit -m "chore: React+Vite+TS 프로젝트 부트스트랩"
```

---

### Task 2: 디자인 토큰 + 글로벌 CSS

**Files:**
- Create: `src/index.css`

- [ ] **Step 1: src/index.css 작성**

```css
/* 글로벌 디자인 토큰 및 리셋 */
:root {
  --bg:           oklch(0.985 0.003 235);
  --bg-elev:      #ffffff;
  --bg-sunken:    oklch(0.965 0.005 235);
  --bg-rail:      oklch(0.978 0.004 235);

  --line:         oklch(0.92 0.006 235);
  --line-strong:  oklch(0.86 0.008 235);
  --line-faint:   oklch(0.955 0.004 235);

  --ink:    oklch(0.20 0.012 245);
  --ink-2:  oklch(0.42 0.012 245);
  --ink-3:  oklch(0.58 0.010 240);
  --ink-4:  oklch(0.72 0.008 240);

  --c:         oklch(0.66 0.16 230);
  --c-strong:  oklch(0.56 0.18 235);
  --c-soft:    oklch(0.93 0.05 230);
  --c-softer:  oklch(0.97 0.025 230);
  --c-ink:     oklch(0.35 0.14 235);

  --ok:      oklch(0.66 0.14 160);
  --warn:    oklch(0.74 0.14 75);
  --danger:  oklch(0.62 0.18 25);

  --r-s: 6px;
  --r-m: 10px;
  --r-l: 14px;

  --shadow-1:   0 1px 0 oklch(0.92 0.006 235);
  --shadow-2:   0 1px 2px rgba(13,20,35,0.04), 0 1px 1px rgba(13,20,35,0.03);
  --shadow-pop: 0 10px 32px -8px rgba(13,30,60,0.12), 0 2px 6px rgba(13,30,60,0.05);
  --focus:      0 0 0 3px var(--c-soft);

  --f-sans: 'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --f-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; }
body {
  font-family: var(--f-sans);
  font-size: 13.5px;
  line-height: 1.45;
  color: var(--ink);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
  font-feature-settings: 'ss01' on, 'cv11' on;
  letter-spacing: -0.005em;
}
button { font-family: inherit; color: inherit; cursor: pointer; }
input, textarea { font-family: inherit; }

.app {
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-rows: 56px 1fr 44px;
  grid-template-areas:
    "rail header"
    "rail main"
    "rail status";
  height: 100vh;
  min-height: 720px;
}
.main {
  grid-area: main;
  overflow: auto;
  background: var(--bg);
}

.kbd {
  font-family: var(--f-mono);
  font-size: 11px;
  font-weight: 500;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--bg-sunken);
  border: 1px solid var(--line);
  color: var(--ink-3);
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/index.css
git commit -m "style: 디자인 토큰 + 글로벌 CSS"
```

---

### Task 3: 타입 정의

**Files:**
- Create: `src/types.ts`
- Create: `src/types.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/types.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import type { Track, ProjectState } from './types'

describe('Track 타입', () => {
  it('필수 필드를 모두 가진 객체를 받아들인다', () => {
    const track: Track = {
      id: '1',
      title: '테스트 트랙',
      artist: '아티스트',
      duration: '2:30',
      durationSec: 150,
      tag: 'Pop',
      bpm: 120,
      src: '',
      waveform: [0.5, 0.3, 0.8],
    }
    expect(track.id).toBe('1')
    expect(track.durationSec).toBe(150)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test
```
Expected: FAIL — `Cannot find module './types'`

- [ ] **Step 3: src/types.ts 작성**

```typescript
// 앱 전역 타입 정의
export type Track = {
  id: string
  title: string
  artist: string
  duration: string
  durationSec: number
  tag: string
  bpm: number
  src: string
  waveform: number[]
}

export type Background = {
  type: 'image' | 'gradient' | 'video'
  src?: string
}

export type ProjectState = {
  step: 1 | 2 | 3
  tracks: Track[]
  playingId: string | null
  background: Background
  logo?: string
  stickers: string[]
  loops: 1 | 2 | 3
  audioQuality: '96k' | '128k' | '192k'
  theme: 'midnight' | 'cyanwave' | 'sunset' | 'forest' | 'cream' | 'mono'
  visualizer: 'bars' | 'wave' | 'orb'
  visualizerIntensity: number
  visualizerOpacity: number
  effects: {
    visualizer: boolean
    crossfade: boolean
    autoLevel: boolean
    backgroundBlur: boolean
  }
  titleSize: number
  letterSpacing: number
  filename: string
  format: 'mp4' | 'webm' | 'mov'
  resolution: '720p' | '1080p' | '4k'
  generateThumbnail: boolean
  includeChapterMarkers: boolean
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test
```
Expected: PASS — 1 test passed

- [ ] **Step 5: 커밋**

```bash
git add src/types.ts src/types.test.ts
git commit -m "feat: Track + ProjectState 타입 정의"
```

---

### Task 4: 샘플 데이터 + 파형 유틸리티

**Files:**
- Create: `src/data/sampleTracks.ts`
- Create: `src/data/sampleTracks.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/data/sampleTracks.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { sampleTracks, waveformFor } from './sampleTracks'

describe('sampleTracks', () => {
  it('15개 트랙을 포함한다', () => {
    expect(sampleTracks).toHaveLength(15)
  })
  it('각 트랙이 0–1 범위의 waveform을 가진다', () => {
    sampleTracks.forEach(t => {
      expect(t.waveform.length).toBeGreaterThan(0)
      t.waveform.forEach(v => {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      })
    })
  })
})

describe('waveformFor', () => {
  it('기본 48개 바를 반환한다', () => {
    expect(waveformFor(1)).toHaveLength(48)
  })
  it('동일한 시드는 동일한 결과를 반환한다', () => {
    expect(waveformFor(7)).toEqual(waveformFor(7))
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test
```
Expected: FAIL — `Cannot find module './sampleTracks'`

- [ ] **Step 3: src/data/sampleTracks.ts 작성**

```typescript
// 샘플 트랙 데이터 및 파형 생성 유틸리티
import type { Track } from '../types'

export const waveformFor = (seed: number, count = 48): number[] => {
  const bars: number[] = []
  let s = seed * 9301 + 49297
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280
    const v = s / 233280
    const pos = i / (count - 1)
    const env = 0.45 + 0.55 * Math.sin(pos * Math.PI)
    bars.push(Math.min(1, Math.max(0, 0.25 + v * 0.7 * env)))
  }
  return bars
}

const parseDuration = (dur: string): number => {
  const [m, s] = dur.split(':').map(Number)
  return m * 60 + s
}

const RAW = [
  { id: '1',  title: '가을의 시작',             artist: 'Aria Sound',   dur: '2:11', tag: 'Acoustic',  bpm: 84  },
  { id: '2',  title: '단풍 길에서',             artist: 'Nuvo',         dur: '2:42', tag: 'Lo-fi',     bpm: 76  },
  { id: '3',  title: '스쳐간 바람처럼',         artist: 'Hana Lee',     dur: '2:38', tag: 'Acoustic',  bpm: 92  },
  { id: '4',  title: '밤하늘 별에게 쓰는 편지', artist: 'Moon Drift',   dur: '2:53', tag: 'Ambient',   bpm: 68  },
  { id: '5',  title: '잊혀지지 않는 향기',     artist: 'Soobin',       dur: '2:36', tag: 'Indie Pop', bpm: 102 },
  { id: '6',  title: '그리움 한 스푼',         artist: 'Café Lumière', dur: '2:37', tag: 'Jazz',      bpm: 88  },
  { id: '7',  title: '비 오는 날의 창가',     artist: 'Eunha',        dur: '2:16', tag: 'Piano',     bpm: 72  },
  { id: '8',  title: '다시 만날 계절',         artist: 'Aria Sound',   dur: '2:32', tag: 'Acoustic',  bpm: 96  },
  { id: '9',  title: '늦가을의 오후',          artist: 'Stillwater',   dur: '2:43', tag: 'Lo-fi',     bpm: 80  },
  { id: '10', title: '우리의 비밀 정원',       artist: 'Hana Lee',     dur: '3:24', tag: 'Indie Pop', bpm: 110 },
  { id: '11', title: '차가운 손을 잡고',       artist: 'Moon Drift',   dur: '2:09', tag: 'Ambient',   bpm: 64  },
  { id: '12', title: '시계태엽 감기',          artist: 'Soobin',       dur: '2:29', tag: 'Jazz',      bpm: 94  },
  { id: '13', title: '마지막 잎새의 고백',     artist: 'Eunha',        dur: '2:19', tag: 'Piano',     bpm: 70  },
  { id: '14', title: '편지를 부치고',          artist: 'Café Lumière', dur: '2:09', tag: 'Acoustic',  bpm: 86  },
  { id: '15', title: '다가올 겨울에게',        artist: 'Stillwater',   dur: '2:24', tag: 'Ambient',   bpm: 60  },
]

export const sampleTracks: Track[] = RAW.map((r, i) => ({
  id: r.id,
  title: r.title,
  artist: r.artist,
  duration: r.dur,
  durationSec: parseDuration(r.dur),
  tag: r.tag,
  bpm: r.bpm,
  src: '',
  waveform: waveformFor(i + 1),
}))
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test
```
Expected: PASS — 4 tests passed

- [ ] **Step 5: 커밋**

```bash
git add src/data/sampleTracks.ts src/data/sampleTracks.test.ts
git commit -m "feat: 샘플 트랙 데이터 + 파형 유틸"
```

---

### Task 5: 아이콘 컴포넌트

**Files:**
- Create: `src/icons/index.tsx`
- Create: `src/icons/index.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`src/icons/index.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Icon from './index'

describe('Icon', () => {
  it('알려진 아이콘을 SVG로 렌더링한다', () => {
    const { container } = render(<Icon name="logo" />)
    expect(container.querySelector('svg')).toBeTruthy()
  })
  it('size prop이 width/height에 반영된다', () => {
    const { container } = render(<Icon name="play" size={20} />)
    expect(container.querySelector('svg')!.getAttribute('width')).toBe('20')
  })
  it('알 수 없는 이름은 빈 SVG를 반환한다', () => {
    const { container } = render(<Icon name="nonexistent" />)
    expect(container.querySelector('svg')).toBeTruthy()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test
```
Expected: FAIL — `Cannot find module './index'`

- [ ] **Step 3: src/icons/index.tsx 작성**

```typescript
// SVG 아이콘 컴포넌트 — lucide 스타일, 1.5px stroke
import type { CSSProperties } from 'react'

interface IconProps {
  name: string
  size?: number
  className?: string
  style?: CSSProperties
}

const PATHS: Record<string, React.ReactNode> = {
  logo:         <><path d="M3 12h2"/><path d="M7 8v8"/><path d="M11 5v14"/><path d="M15 8v8"/><path d="M19 11v2"/></>,
  upload:       <><path d="M12 16V4"/><path d="M6 10l6-6 6 6"/><path d="M4 20h16"/></>,
  cloud:        <><path d="M16 16h2a4 4 0 0 0 .8-7.92A6 6 0 0 0 7 6.05 5 5 0 0 0 6 16h2"/><path d="M12 12v9"/><path d="M9 15l3-3 3 3"/></>,
  music:        <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>,
  play:         <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none"/>,
  pause:        <><rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none"/><rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none"/></>,
  image:        <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>,
  grip:         <><circle cx="9" cy="6" r="1" fill="currentColor"/><circle cx="15" cy="6" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="18" r="1" fill="currentColor"/><circle cx="15" cy="18" r="1" fill="currentColor"/></>,
  more:         <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
  plus:         <><path d="M12 5v14"/><path d="M5 12h14"/></>,
  settings:     <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  keyboard:     <><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/></>,
  help:         <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12" y2="17"/></>,
  chevronDown:  <polyline points="6 9 12 15 18 9"/>,
  chevronRight: <polyline points="9 18 15 12 9 6"/>,
  chevronLeft:  <polyline points="15 18 9 12 15 6"/>,
  repeat:       <><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></>,
  waveform:     <><path d="M2 12h2"/><path d="M6 6v12"/><path d="M10 10v4"/><path d="M14 8v8"/><path d="M18 4v16"/><path d="M22 12h-2"/></>,
  sticker:      <><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/><path d="M15 3v6h6"/></>,
  layers:       <><path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 17 9 5 9-5"/><path d="m3 12 9 5 9-5"/></>,
  export:       <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  download:     <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  reset:        <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><polyline points="3 3 3 8 8 8"/></>,
  check:        <polyline points="20 6 9 17 4 12"/>,
  x:            <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  film:         <><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></>,
  hd:           <rect x="2" y="6" width="20" height="12" rx="2"/>,
  eye:          <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
  monitor:      <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
  sliders:      <><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></>,
  skipBack:     <><polygon points="19 20 9 12 19 4 19 20" fill="currentColor" stroke="none"/><line x1="5" y1="19" x2="5" y2="5"/></>,
  skipForward:  <><polygon points="5 4 15 12 5 20 5 4" fill="currentColor" stroke="none"/><line x1="19" y1="5" x2="19" y2="19"/></>,
  arrowRight:   <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  sparkles:     <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>,
  type:         <><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></>,
  info:         <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
  folder:       <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>,
  drag:         <path d="M8 5h.01M8 12h.01M8 19h.01M16 5h.01M16 12h.01M16 19h.01"/>,
}

export default function Icon({ name, size = 16, className, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {PATHS[name] ?? null}
    </svg>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test
```
Expected: PASS — 3 tests passed

- [ ] **Step 5: 커밋**

```bash
git add src/icons/index.tsx src/icons/index.test.tsx
git commit -m "feat: SVG 아이콘 컴포넌트"
```

---

### Task 6: 공용 컴포넌트 (Button, SegmentedControl, Switch)

**Files:**
- Create: `src/components/shared/Button.tsx`
- Create: `src/components/shared/Button.css`
- Create: `src/components/shared/SegmentedControl.tsx`
- Create: `src/components/shared/SegmentedControl.css`
- Create: `src/components/shared/Switch.tsx`
- Create: `src/components/shared/Switch.css`
- Create: `src/components/shared/shared.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`src/components/shared/shared.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from './Button'
import SegmentedControl from './SegmentedControl'
import Switch from './Switch'

describe('Button', () => {
  it('기본 variant로 렌더링된다', () => {
    render(<Button>저장</Button>)
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
  })
  it('primary variant에 btn--primary 클래스를 가진다', () => {
    render(<Button variant="primary">출력</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn--primary')
  })
  it('클릭 시 onClick이 호출된다', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>클릭</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('SegmentedControl', () => {
  const options = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
    { value: 'c', label: 'C' },
  ]
  it('모든 옵션을 렌더링한다', () => {
    render(<SegmentedControl options={options} value="a" onChange={vi.fn()} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })
  it('활성 옵션에 seg__opt--active 클래스가 붙는다', () => {
    render(<SegmentedControl options={options} value="b" onChange={vi.fn()} />)
    expect(screen.getByText('B').closest('button')).toHaveClass('seg__opt--active')
  })
  it('옵션 클릭 시 onChange가 값과 함께 호출된다', () => {
    const onChange = vi.fn()
    render(<SegmentedControl options={options} value="a" onChange={onChange} />)
    fireEvent.click(screen.getByText('C'))
    expect(onChange).toHaveBeenCalledWith('c')
  })
})

describe('Switch', () => {
  it('on=false일 때 switch--on 클래스가 없다', () => {
    const { container } = render(<Switch on={false} onChange={vi.fn()} />)
    expect(container.firstChild).not.toHaveClass('switch--on')
  })
  it('on=true일 때 switch--on 클래스가 있다', () => {
    const { container } = render(<Switch on={true} onChange={vi.fn()} />)
    expect(container.firstChild).toHaveClass('switch--on')
  })
  it('클릭 시 onChange(!on)이 호출된다', () => {
    const onChange = vi.fn()
    const { container } = render(<Switch on={false} onChange={onChange} />)
    fireEvent.click(container.firstChild!)
    expect(onChange).toHaveBeenCalledWith(true)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test
```
Expected: FAIL — `Cannot find module './Button'`

- [ ] **Step 3: Button.css + Button.tsx 작성**

`src/components/shared/Button.css`:
```css
/* 공용 버튼 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--line);
  background: var(--bg-elev);
  color: var(--ink);
  cursor: pointer;
  transition: all 120ms ease;
  white-space: nowrap;
  font-family: var(--f-sans);
}
.btn:hover { background: var(--bg-sunken); border-color: var(--line-strong); }
.btn--ghost { border-color: transparent; background: transparent; }
.btn--ghost:hover { background: var(--bg-sunken); border-color: transparent; }
.btn--primary { background: var(--c-strong); border-color: var(--c-strong); color: white; box-shadow: 0 1px 2px rgba(13,30,60,0.1); }
.btn--primary:hover { background: oklch(0.5 0.18 235); border-color: oklch(0.5 0.18 235); }
.btn--danger-ghost { color: var(--danger); border-color: transparent; background: transparent; }
.btn--danger-ghost:hover { background: oklch(0.97 0.03 25); }
.btn--lg { height: 40px; padding: 0 18px; font-size: 14px; }
.btn--icon { width: 32px; padding: 0; justify-content: center; }
```

`src/components/shared/Button.tsx`:
```typescript
// 공용 버튼 컴포넌트
import './Button.css'

type ButtonVariant = 'default' | 'ghost' | 'primary' | 'danger-ghost'
type ButtonSize = 'default' | 'lg' | 'icon'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export default function Button({ variant = 'default', size = 'default', className = '', children, ...rest }: ButtonProps) {
  const cls = [
    'btn',
    variant !== 'default' ? `btn--${variant}` : '',
    size !== 'default' ? `btn--${size}` : '',
    className,
  ].filter(Boolean).join(' ')
  return <button className={cls} {...rest}>{children}</button>
}
```

- [ ] **Step 4: SegmentedControl.css + SegmentedControl.tsx 작성**

`src/components/shared/SegmentedControl.css`:
```css
/* 세그먼티드 컨트롤 */
.seg {
  display: grid;
  gap: 4px;
  background: var(--bg-sunken);
  border: 1px solid var(--line);
  border-radius: 9px;
  padding: 3px;
}
.seg--3 { grid-template-columns: repeat(3, 1fr); }
.seg--2 { grid-template-columns: repeat(2, 1fr); }
.seg__opt {
  padding: 7px 8px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-3);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  white-space: nowrap;
  font-family: var(--f-sans);
}
.seg__opt:hover { color: var(--ink); }
.seg__opt--active { background: var(--bg-elev); color: var(--ink); font-weight: 600; box-shadow: var(--shadow-2); }
.seg__hint { font-family: var(--f-mono); font-size: 10px; color: var(--ink-4); font-weight: 500; }
.seg__opt--active .seg__hint { color: var(--c-ink); }
```

`src/components/shared/SegmentedControl.tsx`:
```typescript
// 세그먼티드 컨트롤 — 2~3개 옵션, hint 라벨 지원
import './SegmentedControl.css'

interface SegOption<T> {
  value: T
  label: string
  hint?: string
}

interface SegmentedControlProps<T extends string | number> {
  options: SegOption<T>[]
  value: T
  onChange: (v: T) => void
}

export default function SegmentedControl<T extends string | number>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div className={`seg seg--${options.length}`}>
      {options.map(opt => (
        <button
          key={String(opt.value)}
          className={`seg__opt${value === opt.value ? ' seg__opt--active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
          {opt.hint && <span className="seg__hint">{opt.hint}</span>}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Switch.css + Switch.tsx 작성**

`src/components/shared/Switch.css`:
```css
/* 토글 스위치 */
.switch {
  width: 32px;
  height: 18px;
  background: var(--line-strong);
  border-radius: 999px;
  position: relative;
  cursor: pointer;
  transition: background 120ms ease;
  flex-shrink: 0;
  border: none;
  padding: 0;
}
.switch::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  transition: left 120ms ease;
}
.switch--on { background: var(--c); }
.switch--on::after { left: 16px; }
```

`src/components/shared/Switch.tsx`:
```typescript
// 토글 스위치 컴포넌트 — 32×18, 시안
import './Switch.css'

interface SwitchProps {
  on: boolean
  onChange: (v: boolean) => void
}

export default function Switch({ on, onChange }: SwitchProps) {
  return (
    <button
      className={`switch${on ? ' switch--on' : ''}`}
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
    />
  )
}
```

- [ ] **Step 6: 테스트 통과 확인**

```bash
npm test
```
Expected: PASS — 9 tests passed

- [ ] **Step 7: 커밋**

```bash
git add src/components/shared/
git commit -m "feat: 공용 컴포넌트 Button, SegmentedControl, Switch"
```

---

### Task 7: Sidebar 컴포넌트

**Files:**
- Create: `src/components/Sidebar/Sidebar.tsx`
- Create: `src/components/Sidebar/Sidebar.css`
- Create: `src/components/Sidebar/Sidebar.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`src/components/Sidebar/Sidebar.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Sidebar from './Sidebar'
import { sampleTracks } from '../../data/sampleTracks'

const base = { step: 1 as const, setStep: vi.fn(), tracks: sampleTracks }

describe('Sidebar', () => {
  it('"Spectra" 워드마크를 렌더링한다', () => {
    render(<Sidebar {...base} />)
    expect(screen.getByText('Spectra')).toBeInTheDocument()
  })
  it('"STUDIO" 서브텍스트를 렌더링한다', () => {
    render(<Sidebar {...base} />)
    expect(screen.getByText('STUDIO')).toBeInTheDocument()
  })
  it('3개의 워크플로우 단계를 렌더링한다', () => {
    render(<Sidebar {...base} />)
    expect(screen.getByText('미디어 준비')).toBeInTheDocument()
    expect(screen.getByText('비주얼 편집')).toBeInTheDocument()
    expect(screen.getByText('영상 출력')).toBeInTheDocument()
  })
  it('단계 클릭 시 setStep이 호출된다', () => {
    const setStep = vi.fn()
    render(<Sidebar {...base} setStep={setStep} />)
    fireEvent.click(screen.getByText('비주얼 편집').closest('button')!)
    expect(setStep).toHaveBeenCalledWith(2)
  })
  it('활성 단계에 rail-step--active 클래스가 붙는다', () => {
    render(<Sidebar {...base} step={1} />)
    expect(screen.getByText('미디어 준비').closest('button')).toHaveClass('rail-step--active')
  })
  it('완료된 단계에 rail-step--done 클래스가 붙는다', () => {
    render(<Sidebar {...base} step={2} />)
    expect(screen.getByText('미디어 준비').closest('button')).toHaveClass('rail-step--done')
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- src/components/Sidebar/Sidebar.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Sidebar.css 작성**

`src/components/Sidebar/Sidebar.css`:
```css
/* 좌측 사이드바 레일 */
.rail {
  grid-area: rail;
  background: var(--bg-rail);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.rail__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--line-faint);
  flex-shrink: 0;
}
.rail__logo {
  width: 40px; height: 40px;
  border-radius: 11px;
  background: linear-gradient(140deg, var(--c) 0%, var(--c-strong) 100%);
  display: flex; align-items: center; justify-content: center;
  color: white;
  box-shadow: 0 4px 12px -3px oklch(0.66 0.16 230 / 0.4);
  flex-shrink: 0;
}
.rail__brand-text { display: flex; flex-direction: column; gap: 2px; line-height: 1.1; min-width: 0; }
.rail__wordmark { font-size: 17px; font-weight: 700; letter-spacing: -0.018em; color: var(--ink); }
.rail__wordmark-sub { font-size: 10px; letter-spacing: 0.16em; font-weight: 600; color: var(--ink-3); font-family: var(--f-mono); }
.rail__pro-badge {
  margin-left: auto;
  font-family: var(--f-mono); font-size: 9.5px; font-weight: 700;
  color: var(--c-ink); background: var(--c-softer); border: 1px solid var(--c-soft);
  padding: 2px 6px; border-radius: 4px; letter-spacing: 0.04em;
}

.rail__project {
  display: flex; flex-direction: column; gap: 5px;
  padding: 14px 16px; margin: 14px;
  border: 1px solid var(--line); background: var(--bg-elev);
  border-radius: 12px; box-shadow: var(--shadow-2); flex-shrink: 0;
}
.rail__project-label {
  font-size: 10px; font-weight: 600; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--ink-4);
  display: flex; align-items: center; justify-content: space-between;
}
.rail__project-name {
  font-size: 14px; font-weight: 600; color: var(--ink);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.012em;
}
.rail__project-meta { display: flex; align-items: center; gap: 6px; font-size: 11px; font-family: var(--f-mono); color: var(--ink-3); margin-top: 2px; }
.rail__project-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--ok); flex-shrink: 0; }

.rail__section { font-size: 10.5px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-4); padding: 10px 18px 8px; flex-shrink: 0; }

.rail__steps { display: flex; flex-direction: column; gap: 4px; padding: 0 14px; flex-shrink: 0; }
.rail-step {
  position: relative;
  display: grid;
  grid-template-columns: 32px 1fr auto;
  grid-template-rows: auto auto auto;
  align-items: center;
  column-gap: 12px;
  padding: 12px 14px;
  border-radius: 11px;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  transition: background 120ms ease, border-color 120ms ease;
  text-align: left;
  width: 100%;
}
.rail-step:hover { background: var(--bg-elev); }
.rail-step__num {
  grid-column: 1; grid-row: 1 / 3;
  width: 32px; height: 32px; border-radius: 9px;
  background: var(--bg-elev); border: 1px solid var(--line);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--f-mono); font-size: 12.5px; font-weight: 700; color: var(--ink-2);
  transition: all 120ms ease;
}
.rail-step__label { grid-column: 2; grid-row: 1; font-size: 13.5px; font-weight: 600; color: var(--ink); letter-spacing: -0.012em; white-space: nowrap; }
.rail-step__sub { grid-column: 2; grid-row: 2; font-size: 11.5px; color: var(--ink-3); font-family: var(--f-mono); white-space: nowrap; margin-top: 1px; }
.rail-step__caret { grid-column: 3; grid-row: 1 / 3; color: var(--ink-4); opacity: 0; transition: opacity 120ms ease; }
.rail-step:hover .rail-step__caret { opacity: 1; }

.rail-step--active { background: var(--bg-elev); border-color: var(--line); box-shadow: var(--shadow-2); }
.rail-step--active .rail-step__num { background: var(--c); border-color: var(--c); color: white; box-shadow: 0 2px 6px -1px oklch(0.66 0.16 230 / 0.45); }
.rail-step--active .rail-step__caret { opacity: 1; color: var(--c-ink); }

.rail-step--done .rail-step__num { background: var(--c-softer); border-color: var(--c-soft); color: var(--c-ink); font-size: 0; position: relative; }
.rail-step--done .rail-step__num::before {
  content: ""; display: block; width: 10px; height: 5px;
  border-left: 1.8px solid var(--c-ink); border-bottom: 1.8px solid var(--c-ink);
  transform: rotate(-45deg) translate(1px, -1px);
}
.rail-step--done .rail-step__label { color: var(--ink-2); }

.rail-step__bar { grid-column: 2 / 4; grid-row: 3; height: 4px; background: var(--bg-sunken); border-radius: 999px; overflow: hidden; margin-top: 8px; }
.rail-step__bar-fill { height: 100%; background: var(--c); border-radius: 999px; transition: width 200ms ease; }

.rail__spacer { flex: 1; }

.rail__util { padding: 10px 14px 14px; border-top: 1px solid var(--line-faint); display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; }
.rail__util-row {
  display: flex; align-items: center; gap: 12px;
  padding: 9px 12px; border-radius: 9px;
  cursor: pointer; background: transparent; border: none;
  color: var(--ink-2); font-size: 13px; font-weight: 500; text-align: left; width: 100%;
}
.rail__util-row:hover { background: var(--bg-elev); }
.rail__util-row .util-label { flex: 1; white-space: nowrap; }

.rail__user {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; margin: 6px 14px 14px;
  border-radius: 11px; border: 1px solid var(--line); background: var(--bg-elev); flex-shrink: 0;
}
.rail__avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: linear-gradient(135deg, oklch(0.7 0.16 200), oklch(0.6 0.18 260));
  color: white; display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; flex-shrink: 0;
}
.rail__user-info { min-width: 0; line-height: 1.25; flex: 1; }
.rail__user-name { font-size: 13px; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rail__user-plan { font-size: 11px; font-family: var(--f-mono); color: var(--ink-3); margin-top: 1px; }
.rail__user-menu { color: var(--ink-4); flex-shrink: 0; }
```

- [ ] **Step 4: Sidebar.tsx 작성**

`src/components/Sidebar/Sidebar.tsx`:
```typescript
// 좌측 사이드바 — 브랜드, 프로젝트 카드, 워크플로우, 빠른 액션, 유저 카드
import './Sidebar.css'
import Icon from '../../icons'
import type { Track } from '../../types'

interface SidebarProps {
  step: 1 | 2 | 3
  setStep: (n: 1 | 2 | 3) => void
  tracks: Track[]
}

const STEPS = [
  { num: 1 as const, label: '미디어 준비', sub: '오디오 · 배경 · 로고' },
  { num: 2 as const, label: '비주얼 편집', sub: '효과 · 테마 · 타이포' },
  { num: 3 as const, label: '영상 출력',   sub: 'MP4 · 렌더링' },
]

function calcProgress(stepNum: 1 | 2 | 3, currentStep: 1 | 2 | 3, trackCount: number): number {
  if (stepNum === 1) return Math.min(100, Math.round((trackCount / 15) * 100))
  if (stepNum === 2) return currentStep >= 2 ? 65 : 0
  return currentStep >= 3 ? 30 : 0
}

export default function Sidebar({ step, setStep, tracks }: SidebarProps) {
  return (
    <aside className="rail">
      <div className="rail__brand">
        <div className="rail__logo"><Icon name="logo" size={22} /></div>
        <div className="rail__brand-text">
          <div className="rail__wordmark">Spectra</div>
          <div className="rail__wordmark-sub">STUDIO</div>
        </div>
        <span className="rail__pro-badge">PRO</span>
      </div>

      <div className="rail__project">
        <div className="rail__project-label">
          <span>현재 프로젝트</span>
          <Icon name="chevronDown" size={11} />
        </div>
        <div className="rail__project-name">가을 산책 플레이리스트</div>
        <div className="rail__project-meta">
          <div className="rail__project-dot" />
          <span>자동 저장 · 1분 전</span>
        </div>
      </div>

      <div className="rail__section">워크플로우</div>
      <div className="rail__steps">
        {STEPS.map(s => {
          const isActive = step === s.num
          const isDone = step > s.num
          const progress = calcProgress(s.num, step, tracks.length)
          return (
            <button
              key={s.num}
              className={`rail-step${isActive ? ' rail-step--active' : ''}${isDone ? ' rail-step--done' : ''}`}
              onClick={() => setStep(s.num)}
            >
              <div className="rail-step__num">{s.num}</div>
              <div className="rail-step__label">{s.label}</div>
              <div className="rail-step__caret"><Icon name="chevronRight" size={14} /></div>
              <div className="rail-step__sub">{s.sub}</div>
              {isActive && (
                <div className="rail-step__bar">
                  <div className="rail-step__bar-fill" style={{ width: `${progress}%` }} />
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="rail__spacer" />

      <div className="rail__util">
        <button className="rail__util-row">
          <Icon name="help" size={15} /><span className="util-label">사용자 가이드</span>
        </button>
        <button className="rail__util-row">
          <Icon name="keyboard" size={15} /><span className="util-label">키보드 단축키</span>
          <span className="kbd">?</span>
        </button>
        <button className="rail__util-row">
          <Icon name="settings" size={15} /><span className="util-label">설정</span>
        </button>
      </div>

      <div className="rail__user">
        <div className="rail__avatar">하</div>
        <div className="rail__user-info">
          <div className="rail__user-name">하나 크리에이터</div>
          <div className="rail__user-plan">Pro · 12.4 / 50 GB</div>
        </div>
        <div className="rail__user-menu"><Icon name="more" size={16} /></div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
npm test -- src/components/Sidebar/Sidebar.test.tsx
```
Expected: PASS — 6 tests passed

- [ ] **Step 6: 커밋**

```bash
git add src/components/Sidebar/
git commit -m "feat: Sidebar 컴포넌트 구현"
```

---

### Task 8: Header 컴포넌트

**Files:**
- Create: `src/components/Header/Header.tsx`
- Create: `src/components/Header/Header.css`
- Create: `src/components/Header/Header.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`src/components/Header/Header.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Header from './Header'

const base = { step: 1 as const, setStep: vi.fn() }

describe('Header', () => {
  it('"플레이리스트 영상 만들기"를 표시한다', () => {
    render(<Header {...base} />)
    expect(screen.getByText('플레이리스트 영상 만들기')).toBeInTheDocument()
  })
  it('3개의 단계 알약을 표시한다', () => {
    render(<Header {...base} />)
    expect(screen.getByText('미디어 준비')).toBeInTheDocument()
    expect(screen.getByText('비주얼 편집')).toBeInTheDocument()
    expect(screen.getByText('영상 출력')).toBeInTheDocument()
  })
  it('활성 단계 알약에 step-pill--active 클래스가 붙는다', () => {
    render(<Header step={2} setStep={vi.fn()} />)
    expect(screen.getByText('비주얼 편집').closest('button')).toHaveClass('step-pill--active')
  })
  it('단계 알약 클릭 시 setStep이 호출된다', () => {
    const setStep = vi.fn()
    render(<Header step={1} setStep={setStep} />)
    fireEvent.click(screen.getByText('영상 출력').closest('button')!)
    expect(setStep).toHaveBeenCalledWith(3)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- src/components/Header/Header.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Header.css + Header.tsx 작성**

`src/components/Header/Header.css`:
```css
/* 상단 헤더 — 3컬럼 그리드 */
.header {
  grid-area: header;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid var(--line);
  background: var(--bg-elev);
  gap: 24px;
}
.header__left { display: flex; align-items: center; min-width: 0; }
.crumbs { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink-3); white-space: nowrap; }

.header__center {
  display: flex; align-items: center;
  background: var(--bg-sunken); border: 1px solid var(--line);
  border-radius: 999px; padding: 3px;
}
.step-pill {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 14px 6px 8px;
  border-radius: 999px; font-size: 12.5px; font-weight: 500;
  color: var(--ink-3); cursor: pointer; border: none; background: transparent;
  transition: all 120ms ease; white-space: nowrap; font-family: var(--f-sans);
}
.step-pill__num {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--bg-elev); border: 1px solid var(--line-strong);
  font-family: var(--f-mono); font-size: 10px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
}
.step-pill:hover { color: var(--ink); }
.step-pill--active { background: var(--bg-elev); color: var(--ink); font-weight: 600; box-shadow: var(--shadow-2); }
.step-pill--active .step-pill__num { background: var(--c); border-color: var(--c); color: white; }
.step-pill--done .step-pill__num { background: var(--c-softer); border-color: var(--c-soft); color: var(--c-ink); }

.header__right { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
```

`src/components/Header/Header.tsx`:
```typescript
// 상단 헤더 — 컨텍스트 + 단계 알약 + 액션 버튼
import './Header.css'
import Icon from '../../icons'
import Button from '../shared/Button'

interface HeaderProps {
  step: 1 | 2 | 3
  setStep: (n: 1 | 2 | 3) => void
}

const STEPS = [
  { num: 1 as const, label: '미디어 준비' },
  { num: 2 as const, label: '비주얼 편집' },
  { num: 3 as const, label: '영상 출력' },
]

export default function Header({ step, setStep }: HeaderProps) {
  return (
    <header className="header">
      <div className="header__left">
        <div className="crumbs">
          <Icon name="film" size={14} />
          <span>플레이리스트 영상 만들기</span>
        </div>
      </div>

      <div className="header__center">
        {STEPS.map(s => (
          <button
            key={s.num}
            className={`step-pill${step === s.num ? ' step-pill--active' : ''}${step > s.num ? ' step-pill--done' : ''}`}
            onClick={() => setStep(s.num)}
          >
            <span className="step-pill__num">{step > s.num ? '✓' : s.num}</span>
            {s.label}
          </button>
        ))}
      </div>

      <div className="header__right">
        <Button variant="ghost">
          <Icon name="eye" size={14} /> 미리보기 <span className="kbd">P</span>
        </Button>
        <Button><Icon name="download" size={14} /> 저장</Button>
        <Button variant="primary" onClick={() => setStep(3)}>
          <Icon name="export" size={14} /> 출력
        </Button>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- src/components/Header/Header.test.tsx
```
Expected: PASS — 4 tests passed

- [ ] **Step 5: 커밋**

```bash
git add src/components/Header/
git commit -m "feat: Header 컴포넌트 구현"
```

---

### Task 9: StatusBar + App.tsx 조립

**Files:**
- Create: `src/components/StatusBar/StatusBar.tsx`
- Create: `src/components/StatusBar/StatusBar.css`
- Create: `src/components/StatusBar/StatusBar.test.tsx`
- Create: `src/App.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`src/components/StatusBar/StatusBar.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBar from './StatusBar'
import { sampleTracks } from '../../data/sampleTracks'

describe('StatusBar', () => {
  it('트랙 수를 표시한다', () => {
    render(<StatusBar tracks={sampleTracks} />)
    expect(screen.getByText('15')).toBeInTheDocument()
  })
  it('총 길이를 계산해 표시한다', () => {
    render(<StatusBar tracks={sampleTracks} />)
    expect(screen.getByText(/^\d+:\d{2}$/)).toBeInTheDocument()
  })
  it('"다음 단계" 힌트를 표시한다', () => {
    render(<StatusBar tracks={sampleTracks} />)
    expect(screen.getByText('다음 단계')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- src/components/StatusBar/StatusBar.test.tsx
```
Expected: FAIL

- [ ] **Step 3: StatusBar.css + StatusBar.tsx 작성**

`src/components/StatusBar/StatusBar.css`:
```css
/* 하단 상태 바 */
.status {
  grid-area: status;
  border-top: 1px solid var(--line);
  background: var(--bg-elev);
  display: flex; align-items: center;
  padding: 0 20px; gap: 18px;
  font-size: 12px; color: var(--ink-3); white-space: nowrap;
}
.status__group { display: flex; align-items: center; gap: 6px; }
.status__num { font-family: var(--f-mono); font-weight: 500; color: var(--ink-2); font-size: 11.5px; }
.status__spacer { flex: 1; }
```

`src/components/StatusBar/StatusBar.tsx`:
```typescript
// 하단 상태 바 — 트랙 수, 총 길이, 해상도, 비트레이트, 단축키
import './StatusBar.css'
import Icon from '../../icons'
import type { Track } from '../../types'

interface StatusBarProps {
  tracks: Track[]
}

export default function StatusBar({ tracks }: StatusBarProps) {
  const totalSec = tracks.reduce((acc, t) => acc + t.durationSec, 0)
  const totalDur = `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}`

  return (
    <footer className="status">
      <div className="status__group">
        <Icon name="music" size={13} />
        <span className="status__num">{tracks.length}</span>
        <span>트랙</span>
      </div>
      <div className="status__group">
        <Icon name="film" size={13} />
        <span className="status__num">{totalDur}</span>
        <span>총 길이</span>
      </div>
      <div className="status__group">
        <Icon name="hd" size={13} />
        <span>1920 × 1080 · 30fps</span>
      </div>
      <div className="status__group">
        <Icon name="settings" size={13} />
        <span>192 kbps · AAC</span>
      </div>
      <div className="status__spacer" />
      <div className="status__group">
        <span>다음 단계</span>
        <span className="kbd">⌘</span><span className="kbd">→</span>
      </div>
    </footer>
  )
}
```

- [ ] **Step 4: App.tsx 작성**

`src/App.tsx`:
```typescript
// 앱 루트 — 전체 상태 관리 및 레이아웃 조합
import { useState } from 'react'
import type { Track } from './types'
import { sampleTracks } from './data/sampleTracks'
import Sidebar from './components/Sidebar/Sidebar'
import Header from './components/Header/Header'
import StatusBar from './components/StatusBar/StatusBar'

export default function App() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [tracks, setTracks] = useState<Track[]>(sampleTracks)

  return (
    <div className="app">
      <Sidebar step={step} setStep={setStep} tracks={tracks} />
      <Header step={step} setStep={setStep} />
      <main className="main">
        <p style={{ padding: 20, color: 'var(--ink-3)', fontFamily: 'var(--f-mono)' }}>
          Step {step} — 구현 예정
        </p>
      </main>
      <StatusBar tracks={tracks} />
    </div>
  )
}
```

- [ ] **Step 5: 전체 테스트 통과 확인**

```bash
npm test
```
Expected: PASS — 모든 테스트 통과

- [ ] **Step 6: npm run dev로 전체 셸 시각 확인**

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 열어 확인:
- 280px 사이드바가 왼쪽에 고정됨
- 상단 헤더에 단계 알약 3개 표시
- 하단 상태바에 트랙 수/길이 표시
- 단계 클릭 시 사이드바·헤더 상태 동기화

- [ ] **Step 7: 커밋**

```bash
git add src/App.tsx src/components/StatusBar/
git commit -m "feat: StatusBar + App 셸 조립 완료"
```

---

### Task 10: Step1 — 미디어 준비 화면

**Files:**
- Create: `src/components/steps/Step1/Step1.tsx`
- Create: `src/components/steps/Step1/Step1.css`
- Create: `src/components/steps/Step1/Step1.test.tsx`
- Modify: `src/App.tsx` (Step1 연결)

- [ ] **Step 1: 실패 테스트 작성**

`src/components/steps/Step1/Step1.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Step1 from './Step1'
import { sampleTracks } from '../../../data/sampleTracks'

const base = { tracks: sampleTracks, setTracks: vi.fn(), onNext: vi.fn() }

describe('Step1', () => {
  it('"미디어 준비" 제목을 렌더링한다', () => {
    render(<Step1 {...base} />)
    expect(screen.getByText('미디어 준비')).toBeInTheDocument()
  })
  it('트랙 목록에 첫 번째 트랙을 표시한다', () => {
    render(<Step1 {...base} />)
    expect(screen.getByText('가을의 시작')).toBeInTheDocument()
  })
  it('트랙 삭제 버튼 클릭 시 setTracks가 호출된다', () => {
    const setTracks = vi.fn()
    render(<Step1 {...base} setTracks={setTracks} />)
    const delButtons = screen.getAllByTitle('삭제')
    fireEvent.click(delButtons[0])
    expect(setTracks).toHaveBeenCalled()
    // 삭제 후 14개여야 함
    const newTracks = setTracks.mock.calls[0][0]
    expect(newTracks).toHaveLength(14)
  })
  it('"스튜디오 입장" CTA 클릭 시 onNext가 호출된다', () => {
    const onNext = vi.fn()
    render(<Step1 {...base} onNext={onNext} />)
    fireEvent.click(screen.getByText(/스튜디오 입장/))
    expect(onNext).toHaveBeenCalledTimes(1)
  })
  it('트랙 행 클릭 시 해당 트랙이 활성화된다', () => {
    render(<Step1 {...base} />)
    fireEvent.click(screen.getByText('단풍 길에서').closest('[class*="track"]')!)
    // 두 번째 트랙이 프리뷰에 표시돼야 함
    expect(screen.getAllByText('단풍 길에서').length).toBeGreaterThanOrEqual(1)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- src/components/steps/Step1/Step1.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Step1.css 작성**

`src/components/steps/Step1/Step1.css`:
```css
/* Step 1 — 미디어 준비 레이아웃 */
.step1 {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 480px;
  gap: 20px;
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}
.page-head {
  grid-column: 1 / -1;
  display: flex; align-items: flex-end; justify-content: space-between;
  padding-bottom: 4px;
}
.page-head__title { font-size: 22px; font-weight: 700; letter-spacing: -0.018em; color: var(--ink); margin: 0 0 4px; }
.page-head__sub { font-size: 13px; color: var(--ink-3); margin: 0; }
.page-head__progress { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--ink-3); font-family: var(--f-mono); }
.progress-track { width: 120px; height: 4px; background: var(--bg-sunken); border-radius: 999px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--c); border-radius: 999px; }

/* 카드 공통 */
.card { background: var(--bg-elev); border: 1px solid var(--line); border-radius: var(--r-l); box-shadow: var(--shadow-2); }
.card--overflow { overflow: hidden; }
.card__head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--line-faint); }
.card__title { display: flex; align-items: baseline; gap: 8px; font-size: 14px; font-weight: 600; color: var(--ink); letter-spacing: -0.01em; white-space: nowrap; }
.card__count { font-family: var(--f-mono); font-size: 11.5px; font-weight: 500; color: var(--ink-3); background: var(--bg-sunken); border-radius: 6px; padding: 2px 6px; }
.card__sub { font-size: 12.5px; color: var(--ink-3); font-weight: 400; }
.card__actions { display: flex; gap: 6px; align-items: center; }

/* 업로드 존 */
.upload {
  border: 1.5px dashed var(--line-strong);
  border-radius: var(--r-l);
  background: radial-gradient(ellipse 80% 60% at 50% 0%, var(--c-softer) 0%, transparent 70%), var(--bg-elev);
  padding: 28px 24px;
  display: grid; grid-template-columns: auto 1fr auto; gap: 18px; align-items: center;
  cursor: pointer; transition: all 120ms ease;
}
.upload:hover { border-color: var(--c); background: radial-gradient(ellipse 80% 60% at 50% 0%, var(--c-soft) 0%, transparent 70%), var(--bg-elev); }
.upload__icon { width: 56px; height: 56px; border-radius: 14px; background: var(--bg-elev); border: 1px solid var(--line); display: flex; align-items: center; justify-content: center; color: var(--c-strong); box-shadow: var(--shadow-2); }
.upload__copy h3 { margin: 0 0 4px; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
.upload__copy p { margin: 0; font-size: 12.5px; color: var(--ink-3); }
.upload__copy strong { color: var(--c-strong); font-weight: 600; }
.upload__hint { font-size: 11px; font-family: var(--f-mono); color: var(--ink-4); text-align: right; line-height: 1.5; }

/* 트랙 리스트 */
.tracklist { display: flex; flex-direction: column; }
.tracklist__head {
  display: grid;
  grid-template-columns: 28px 32px minmax(0, 1.4fr) minmax(80px, 1fr) 72px 56px 28px;
  gap: 10px; padding: 8px 12px;
  font-size: 11px; font-weight: 600; color: var(--ink-4);
  letter-spacing: 0.04em; text-transform: uppercase;
  border-bottom: 1px solid var(--line-faint);
}
.track {
  display: grid;
  grid-template-columns: 28px 32px minmax(0, 1.4fr) minmax(80px, 1fr) 72px 56px 28px;
  gap: 10px; align-items: center;
  padding: 9px 12px;
  border-bottom: 1px solid var(--line-faint);
  cursor: grab; transition: background 100ms ease;
}
.track:hover { background: var(--bg-sunken); }
.track:last-child { border-bottom: none; }
.track--playing { background: var(--c-softer); }
.track--playing:hover { background: var(--c-soft); }
.track--dragging { opacity: 0.45; }
.track--dragover { background: var(--c-softer); box-shadow: inset 0 2px 0 0 var(--c); }

.track__lead { display: flex; align-items: center; justify-content: center; color: var(--ink-4); }
.track__num { font-family: var(--f-mono); font-size: 11.5px; font-weight: 500; color: var(--ink-4); }
.track__drag { display: none; cursor: grab; }
.track:hover .track__num { display: none; }
.track:hover .track__drag { display: block; }

.track__play {
  width: 28px; height: 28px; border-radius: 7px;
  background: var(--bg-elev); border: 1px solid var(--line);
  display: flex; align-items: center; justify-content: center;
  color: var(--ink-2); cursor: pointer;
}
.track:hover .track__play { border-color: var(--line-strong); }
.track__play:hover, .track--playing .track__play { background: var(--c); border-color: var(--c); color: white; }

.track__meta { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.track__title { font-size: 13.5px; font-weight: 500; color: var(--ink); letter-spacing: -0.008em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.track__sub { font-size: 11px; color: var(--ink-4); font-family: var(--f-mono); }

.track__wave { height: 22px; display: flex; align-items: center; gap: 1.5px; }
.track__wave-bar { flex: 1; background: var(--ink-4); border-radius: 1px; opacity: 0.55; }
.track--playing .track__wave-bar { background: var(--c); opacity: 0.9; }

.track__tag { font-size: 10.5px; font-weight: 500; color: var(--ink-3); background: var(--bg-sunken); border: 1px solid var(--line-faint); border-radius: 4px; padding: 2px 5px; text-align: center; justify-self: center; white-space: nowrap; }
.track__time { font-family: var(--f-mono); font-size: 12px; color: var(--ink-2); text-align: right; font-variant-numeric: tabular-nums; }
.track__del { width: 24px; height: 24px; border-radius: 6px; background: transparent; border: none; color: var(--ink-4); cursor: pointer; display: flex; align-items: center; justify-content: center; visibility: hidden; }
.track:hover .track__del { visibility: visible; }
.track__del:hover { background: oklch(0.96 0.04 25); color: var(--danger); }

.tracklist__foot { padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--line-faint); font-size: 12px; color: var(--ink-3); }

/* 우측 컬럼 */
.rcol { display: flex; flex-direction: column; gap: 16px; min-width: 0; }

/* 프리뷰 카드 */
.preview-card { overflow: hidden; }
.preview-frame {
  aspect-ratio: 16 / 9; background: #0a0d14;
  position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center; color: white;
}
.preview-frame__bg {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 60% 80% at 20% 30%, oklch(0.6 0.18 240 / 0.6) 0%, transparent 60%),
    radial-gradient(ellipse 50% 70% at 80% 70%, oklch(0.5 0.2 280 / 0.5) 0%, transparent 60%),
    linear-gradient(135deg, #0c1a2e, #050813);
}
.preview-frame__content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 0 20px; text-align: center; width: 100%; }
.preview-frame__logo { width: 42px; height: 42px; border-radius: 11px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; color: var(--c); }
.preview-frame__title { font-size: 17px; font-weight: 700; letter-spacing: -0.018em; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.preview-frame__sub { font-size: 12.5px; color: rgba(255,255,255,0.65); font-family: var(--f-mono); }
.preview-vis { position: absolute; bottom: 24px; left: 0; right: 0; display: flex; justify-content: center; gap: 3px; height: 28px; align-items: flex-end; padding: 0 36px; }
.preview-vis__bar { flex: 1; background: linear-gradient(180deg, var(--c) 0%, oklch(0.5 0.18 240) 100%); border-radius: 1.5px; max-width: 4px; }

.preview-meta { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; font-size: 12px; color: var(--ink-3); background: var(--bg-elev); }
.preview-meta__nowplaying { display: flex; align-items: center; gap: 8px; color: var(--ink); font-weight: 500; white-space: nowrap; }
.preview-meta__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c); box-shadow: 0 0 0 3px var(--c-soft); animation: pulse 1.6s ease-in-out infinite; }
@keyframes pulse { 50% { box-shadow: 0 0 0 6px transparent; } }
.preview-controls { padding: 10px 14px; border-top: 1px solid var(--line-faint); display: flex; align-items: center; gap: 10px; }
.preview-controls__progress { flex: 1; height: 4px; background: var(--line-faint); border-radius: 999px; position: relative; cursor: pointer; overflow: hidden; }
.preview-controls__fill { position: absolute; left: 0; top: 0; bottom: 0; width: 22%; background: var(--c); border-radius: 999px; }
.preview-controls__time { font-family: var(--f-mono); font-size: 11px; color: var(--ink-3); font-variant-numeric: tabular-nums; }

/* 브랜딩 탭 */
.tabs { display: flex; border-bottom: 1px solid var(--line); padding: 0 12px; gap: 2px; }
.tab { padding: 10px 12px; font-size: 13px; font-weight: 500; color: var(--ink-3); border: none; background: transparent; cursor: pointer; position: relative; display: flex; align-items: center; gap: 6px; white-space: nowrap; font-family: var(--f-sans); }
.tab:hover { color: var(--ink); }
.tab--active { color: var(--ink); font-weight: 600; }
.tab--active::after { content: ""; position: absolute; bottom: -1px; left: 12px; right: 12px; height: 2px; background: var(--c); border-radius: 2px 2px 0 0; }
.tab__badge { font-family: var(--f-mono); font-size: 10px; color: var(--ink-3); background: var(--bg-sunken); border-radius: 999px; padding: 1px 6px; }

.drop-slot {
  border: 1.5px dashed var(--line-strong); border-radius: var(--r-m);
  padding: 18px 16px; display: flex; flex-direction: column; align-items: center; gap: 8px;
  background: var(--bg-sunken); color: var(--ink-3); font-size: 12px;
  cursor: pointer; transition: all 120ms ease; min-height: 110px; justify-content: center; text-align: center;
}
.drop-slot:hover { border-color: var(--c); background: var(--c-softer); color: var(--c-ink); }
.drop-slot__hint { font-family: var(--f-mono); font-size: 10.5px; color: var(--ink-4); }

.form-section { padding: 14px 16px; border-top: 1px solid var(--line-faint); }
.form-section:first-child { border-top: none; }
.form-section__label { font-size: 12px; font-weight: 600; color: var(--ink-2); margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; white-space: nowrap; gap: 8px; }
.form-section__hint { font-size: 11px; font-weight: 400; color: var(--ink-4); font-family: var(--f-mono); }

.foot-cta { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-top: 1px solid var(--line-faint); gap: 10px; }
```

- [ ] **Step 4: Step1.tsx 작성**

`src/components/steps/Step1/Step1.tsx`:
```typescript
// Step 1 — 미디어 준비: 트랙 리스트, 업로드, 라이브 프리뷰, 브랜딩, 인코딩
import { useState } from 'react'
import './Step1.css'
import Icon from '../../../icons'
import Button from '../../shared/Button'
import SegmentedControl from '../../shared/SegmentedControl'
import { waveformFor } from '../../../data/sampleTracks'
import type { Track } from '../../../types'

interface Step1Props {
  tracks: Track[]
  setTracks: (tracks: Track[]) => void
  onNext: () => void
}

const LOOP_OPTIONS = [
  { value: 1 as const, label: '1회' },
  { value: 2 as const, label: '2회' },
  { value: 3 as const, label: '3회' },
]

const QUALITY_OPTIONS = [
  { value: '96k' as const,  label: '96k',  hint: '표준' },
  { value: '128k' as const, label: '128k', hint: '권장' },
  { value: '192k' as const, label: '192k', hint: '고음질' },
]

const BG_OPTIONS = [
  { value: 'image' as const,    label: '이미지' },
  { value: 'gradient' as const, label: '그라디언트' },
  { value: 'video' as const,    label: '비디오' },
]

export default function Step1({ tracks, setTracks, onNext }: Step1Props) {
  const [playingId, setPlayingId] = useState<string>(tracks[2]?.id ?? tracks[0]?.id ?? '')
  const [activeTab, setActiveTab] = useState<'background' | 'logo' | 'stickers'>('background')
  const [loops, setLoops] = useState<1 | 2 | 3>(1)
  const [quality, setQuality] = useState<'96k' | '128k' | '192k'>('192k')
  const [bgType, setBgType] = useState<'image' | 'gradient' | 'video'>('gradient')
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const totalSec = tracks.reduce((acc, t) => acc + t.durationSec, 0)
  const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
  const totalDur = fmt(totalSec)
  const finalDur = fmt(totalSec * loops)

  const playingTrack = tracks.find(t => t.id === playingId) ?? tracks[0]

  const handleDelete = (id: string) => {
    const idx = tracks.findIndex(t => t.id === id)
    const next = tracks[idx + 1] ?? tracks[idx - 1]
    setTracks(tracks.filter(t => t.id !== id))
    if (playingId === id && next) setPlayingId(next.id)
  }

  const moveTrack = (fromId: string, toId: string) => {
    if (fromId === toId) return
    const from = tracks.findIndex(t => t.id === fromId)
    const to = tracks.findIndex(t => t.id === toId)
    if (from < 0 || to < 0) return
    const next = [...tracks]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setTracks(next)
  }

  return (
    <div className="step1">
      {/* 페이지 헤더 */}
      <div className="page-head">
        <div>
          <h1 className="page-head__title">미디어 준비</h1>
          <p className="page-head__sub">오디오 트랙·배경·로고를 업로드하고 인코딩 옵션을 선택하세요.</p>
        </div>
        <div className="page-head__progress">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.min(100, Math.round(tracks.length / 15 * 100))}%` }} />
          </div>
          <span>STEP 1 / 3</span>
        </div>
      </div>

      {/* 좌측 — 오디오 트랙 */}
      <div>
        <div className="card card--overflow">
          <div className="card__head">
            <div className="card__title">
              오디오 트랙
              <span className="card__count">{tracks.length}</span>
              <span className="card__sub">· 총 {totalDur}</span>
            </div>
            <div className="card__actions">
              <Button variant="ghost"><Icon name="sliders" size={14} /> 정렬</Button>
              <Button variant="danger-ghost" onClick={() => setTracks([])}>
                <Icon name="reset" size={14} /> 전체 비우기
              </Button>
            </div>
          </div>

          <div style={{ padding: 14 }}>
            <div className="upload">
              <div className="upload__icon"><Icon name="cloud" size={28} /></div>
              <div className="upload__copy">
                <h3>오디오 파일을 여기에 끌어다 놓으세요</h3>
                <p>또는 <strong>클릭하여 선택</strong> · MP3, WAV, FLAC, M4A 지원</p>
              </div>
              <div className="upload__hint">최대 50개<br />각 파일 ≤ 50MB</div>
            </div>
          </div>

          <div className="tracklist">
            <div className="tracklist__head">
              <div style={{ textAlign: 'center' }}>#</div>
              <div />
              <div>트랙</div>
              <div>파형</div>
              <div style={{ textAlign: 'center' }}>장르</div>
              <div style={{ textAlign: 'right' }}>길이</div>
              <div />
            </div>

            {tracks.map((t, i) => (
              <div
                key={t.id}
                className={[
                  'track',
                  playingId === t.id ? 'track--playing' : '',
                  dragId === t.id ? 'track--dragging' : '',
                  overId === t.id && dragId !== t.id ? 'track--dragover' : '',
                ].filter(Boolean).join(' ')}
                draggable
                onDragStart={e => { setDragId(t.id); try { e.dataTransfer.setData('text/plain', t.id) } catch (_) {} }}
                onDragOver={e => { e.preventDefault(); if (overId !== t.id) setOverId(t.id) }}
                onDrop={e => { e.preventDefault(); if (dragId) moveTrack(dragId, t.id); setDragId(null); setOverId(null) }}
                onDragEnd={() => { setDragId(null); setOverId(null) }}
                onClick={() => setPlayingId(t.id)}
              >
                <div className="track__lead">
                  <span className="track__num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="track__drag"><Icon name="grip" size={14} /></span>
                </div>
                <div
                  className="track__play"
                  onClick={e => { e.stopPropagation(); setPlayingId(playingId === t.id ? (tracks[0]?.id ?? '') : t.id) }}
                >
                  <Icon name={playingId === t.id ? 'pause' : 'play'} size={12} />
                </div>
                <div className="track__meta">
                  <div className="track__title">{t.title}</div>
                  <div className="track__sub">{t.artist} · {t.bpm} BPM</div>
                </div>
                <div className="track__wave">
                  {waveformFor(i + 1, 56).map((h, j) => (
                    <div key={j} className="track__wave-bar" style={{ height: `${h * 100}%` }} />
                  ))}
                </div>
                <div className="track__tag">{t.tag}</div>
                <div className="track__time">{t.duration}</div>
                <button
                  className="track__del"
                  title="삭제"
                  onClick={e => { e.stopPropagation(); handleDelete(t.id) }}
                >
                  <Icon name="x" size={13} />
                </button>
              </div>
            ))}
          </div>

          <div className="tracklist__foot">
            <div>{tracks.length}개 트랙 · 약 {totalDur}</div>
            <Button variant="ghost"><Icon name="plus" size={14} /> 트랙 추가</Button>
          </div>
        </div>
      </div>

      {/* 우측 — 프리뷰 + 브랜딩 + 인코딩 */}
      <div className="rcol">
        {/* 라이브 프리뷰 */}
        <div className="card preview-card">
          <div className="preview-frame">
            <div className="preview-frame__bg" />
            <div className="preview-frame__content">
              <div className="preview-frame__logo"><Icon name="logo" size={22} /></div>
              <h2 className="preview-frame__title">{playingTrack?.title}</h2>
              <div className="preview-frame__sub">{playingTrack?.artist} · {playingTrack?.tag}</div>
            </div>
            <div className="preview-vis">
              {waveformFor(parseInt(playingTrack?.id ?? '1'), 64).map((h, i) => (
                <div key={i} className="preview-vis__bar" style={{ height: `${h * 100}%` }} />
              ))}
            </div>
          </div>
          <div className="preview-meta">
            <div className="preview-meta__nowplaying">
              <div className="preview-meta__dot" />
              지금 재생 중 · 트랙 {String((tracks.findIndex(t => t.id === playingId) + 1)).padStart(2, '0')}
            </div>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11 }}>1920 × 1080 · 30fps</span>
          </div>
          <div className="preview-controls">
            <Button variant="ghost" size="icon"><Icon name="skipBack" size={14} /></Button>
            <button style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--c)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Icon name="pause" size={14} />
            </button>
            <Button variant="ghost" size="icon"><Icon name="skipForward" size={14} /></Button>
            <div className="preview-controls__progress">
              <div className="preview-controls__fill" />
            </div>
            <span className="preview-controls__time">0:48 / {playingTrack?.duration}</span>
          </div>
        </div>

        {/* 브랜딩 카드 */}
        <div className="card">
          <div className="tabs">
            {(['background', 'logo', 'stickers'] as const).map(tab => (
              <button
                key={tab}
                className={`tab${activeTab === tab ? ' tab--active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                <Icon name={tab === 'background' ? 'image' : tab === 'logo' ? 'layers' : 'sticker'} size={14} />
                {tab === 'background' ? '배경' : tab === 'logo' ? '로고' : <>스티커 <span className="tab__badge">0 / 5</span></>}
              </button>
            ))}
          </div>
          {activeTab === 'background' && (
            <div style={{ padding: 14 }}>
              <div className="drop-slot">
                <Icon name="image" size={22} />
                <div>배경 이미지를 끌어다 놓거나 클릭</div>
                <div className="drop-slot__hint">JPG · PNG · 최소 1920×1080</div>
              </div>
              <div className="form-section" style={{ paddingLeft: 0, paddingRight: 0 }}>
                <div className="form-section__label">배경 타입</div>
                <SegmentedControl options={BG_OPTIONS} value={bgType} onChange={setBgType} />
              </div>
            </div>
          )}
          {activeTab === 'logo' && (
            <div style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="drop-slot">
                <Icon name="layers" size={20} />
                <div style={{ fontSize: 11.5, fontWeight: 600 }}>로고</div>
                <div className="drop-slot__hint">PNG · SVG</div>
              </div>
              <div className="drop-slot">
                <Icon name="sticker" size={20} />
                <div style={{ fontSize: 11.5, fontWeight: 600 }}>워터마크</div>
                <div className="drop-slot__hint">선택 · PNG</div>
              </div>
            </div>
          )}
          {activeTab === 'stickers' && (
            <div style={{ padding: 14 }}>
              <div className="drop-slot">
                <Icon name="sticker" size={22} />
                <div>스티커/GIF를 끌어다 놓으세요</div>
                <div className="drop-slot__hint">GIF · PNG · 최대 5개</div>
              </div>
            </div>
          )}
        </div>

        {/* 인코딩 설정 */}
        <div className="card">
          <div className="card__head">
            <div className="card__title" style={{ fontSize: 13 }}>
              <Icon name="settings" size={14} /> 인코딩 설정
            </div>
          </div>
          <div className="form-section">
            <div className="form-section__label">
              재생 반복
              <span className="form-section__hint">최종 길이 ≈ {finalDur}</span>
            </div>
            <SegmentedControl options={LOOP_OPTIONS} value={loops} onChange={setLoops} />
          </div>
          <div className="form-section">
            <div className="form-section__label">오디오 품질</div>
            <SegmentedControl options={QUALITY_OPTIONS} value={quality} onChange={setQuality} />
          </div>
          <div className="foot-cta">
            <Button variant="danger-ghost"><Icon name="reset" size={14} /> 초기화</Button>
            <Button variant="primary" size="lg" onClick={onNext}>
              스튜디오 입장 <Icon name="arrowRight" size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: App.tsx에 Step1 연결**

`src/App.tsx`의 `<main>` 내부를 다음과 같이 수정:

```typescript
import Step1 from './components/steps/Step1/Step1'

// App 함수 내부 return의 <main> 부분:
<main className="main">
  {step === 1 && <Step1 tracks={tracks} setTracks={setTracks} onNext={() => setStep(2)} />}
  {step === 2 && <p style={{ padding: 20, color: 'var(--ink-3)' }}>Step 2 — 구현 예정</p>}
  {step === 3 && <p style={{ padding: 20, color: 'var(--ink-3)' }}>Step 3 — 구현 예정</p>}
</main>
```

- [ ] **Step 6: 테스트 통과 확인**

```bash
npm test
```
Expected: PASS — 모든 테스트 통과

- [ ] **Step 7: npm run dev로 Step1 시각 확인**

```bash
npm run dev
```

확인 항목:
- 트랙 리스트가 7컬럼 그리드로 올바르게 표시됨
- 트랙 행 hover 시 번호 → grip 아이콘 전환, X 버튼 노출
- 트랙 행 클릭 시 우측 프리뷰 트랙 제목 동기화
- 재생 버튼 클릭 시 행 배경 시안으로 변경
- 드래그&드롭으로 트랙 순서 변경 가능
- 업로드 존 hover 시 보더 시안으로 변경
- 세그먼티드 컨트롤 동작
- "스튜디오 입장" 클릭 시 Step 2 placeholder로 전환

- [ ] **Step 8: 커밋**

```bash
git add src/components/steps/Step1/ src/App.tsx
git commit -m "feat: Step1 미디어 준비 화면 구현"
```

---

> **다음 단계:** Step 2(비주얼 편집)와 Step 3(영상 출력) 구현은 `docs/superpowers/plans/2026-05-18-spectra-studio-step2-3.md` 별도 플랜으로 진행.
