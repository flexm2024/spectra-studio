# Spectra Studio — 구현 설계 문서

**날짜:** 2026-05-18  
**스택:** React + Vite + TypeScript + Vanilla CSS  
**범위:** 플레이리스트 영상 제작 도구 UI (3단계 워크플로우)

---

## 1. 프로젝트 구조

```
spectra/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css                  ← 디자인 토큰 :root + 글로벌 리셋
│   ├── types.ts                   ← Track, ProjectState 타입
│   ├── data/
│   │   └── sampleTracks.ts        ← 샘플 데이터 (design/data.jsx 변환)
│   ├── icons/
│   │   └── index.tsx              ← lucide-react 래퍼 (커스텀 로고 포함)
│   └── components/
│       ├── Sidebar/
│       │   ├── Sidebar.tsx
│       │   └── Sidebar.css
│       ├── Header/
│       │   ├── Header.tsx
│       │   └── Header.css
│       ├── StatusBar/
│       │   ├── StatusBar.tsx
│       │   └── StatusBar.css
│       ├── shared/
│       │   ├── SegmentedControl.tsx
│       │   ├── Switch.tsx
│       │   ├── Slider.tsx
│       │   ├── Card.tsx
│       │   ├── Button.tsx
│       │   └── shared.css
│       └── steps/
│           ├── Step1/
│           │   ├── Step1.tsx
│           │   └── Step1.css
│           ├── Step2/
│           │   ├── Step2.tsx
│           │   └── Step2.css
│           └── Step3/
│               ├── Step3.tsx
│               └── Step3.css
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 2. 디자인 토큰 (index.css)

README의 OKLCH 색상 변수를 `:root`에 그대로 정의. Pretendard + JetBrains Mono CDN 임포트.

```css
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');

:root {
  --bg: oklch(0.985 0.003 235);
  --bg-elev: #ffffff;
  --bg-sunken: oklch(0.965 0.005 235);
  --bg-rail: oklch(0.978 0.004 235);
  --line: oklch(0.92 0.006 235);
  --line-strong: oklch(0.86 0.008 235);
  --line-faint: oklch(0.955 0.004 235);
  --ink: oklch(0.20 0.012 245);
  --ink-2: oklch(0.42 0.012 245);
  --ink-3: oklch(0.58 0.010 240);
  --ink-4: oklch(0.72 0.008 240);
  --c: oklch(0.66 0.16 230);
  --c-strong: oklch(0.56 0.18 235);
  --c-soft: oklch(0.93 0.05 230);
  --c-softer: oklch(0.97 0.025 230);
  --c-ink: oklch(0.35 0.14 235);
  --ok: oklch(0.66 0.14 160);
  --warn: oklch(0.74 0.14 75);
  --danger: oklch(0.62 0.18 25);
  --shadow-2: 0 1px 2px rgba(13,20,35,0.04), 0 1px 1px rgba(13,20,35,0.03);
  --shadow-pop: 0 10px 32px -8px rgba(13,30,60,0.12), 0 2px 6px rgba(13,30,60,0.05);
  --focus: 0 0 0 3px var(--c-soft);
  --f-sans: 'Pretendard Variable', 'Pretendard', system-ui, sans-serif;
  --f-mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
}
```

---

## 3. 타입 정의 (types.ts)

README의 `Track`과 `ProjectState` 타입을 그대로 사용. 추가 변경 없음.

---

## 4. 전체 레이아웃 (App.tsx)

CSS Grid 2컬럼:

```css
.app {
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-rows: 56px 1fr 44px;
  height: 100vh;
}
```

상태는 `useState`로 `App.tsx`에서 관리. 규모가 커지면 zustand 마이그레이션.

---

## 5. 사이드바 (Sidebar.tsx) — 1번째 구현 대상

Props:
```ts
interface SidebarProps {
  step: 1 | 2 | 3;
  setStep: (n: 1 | 2 | 3) => void;
  tracks: Track[];
}
```

섹션 구성 (위→아래):
1. **Brand** (56px) — 로고 + "Spectra" 워드마크 + "STUDIO" 서브 + PRO 배지
2. **Project Card** — "현재 프로젝트" 라벨 + 프로젝트명 + 자동 저장 상태
3. **Workflow Steps** — 3개 단계 카드 (활성/완료/비활성 상태, 진행률 바)
4. **Quick Actions** — 사용자 가이드 / 키보드 단축키 / 설정
5. **User Card** — 아바타 + 이름 + Plan/사용량

진행률 계산: `step 1 → tracks.length / 15 * 100`, `step 2 → 65%`, `step 3 → 30%`

상태 전환: 모두 `transition: 120ms ease` (배경/보더), `200ms ease` (진행률 바)

---

## 6. 헤더 (Header.tsx)

Props: `{ step, setStep }`

- 좌: Film 아이콘 + "플레이리스트 영상 만들기"
- 중: 단계 알약 3개 (활성/완료 상태)
- 우: 미리보기 [P] / 저장 / 출력 버튼

---

## 7. 상태바 (StatusBar.tsx)

Props: `{ tracks: Track[] }`

트랙 수 / 총 길이 / 해상도·fps / 비트레이트·코덱 / "다음 단계 ⌘→"

---

## 8. 공용 컴포넌트 (shared/)

| 컴포넌트 | Props | 설명 |
|---|---|---|
| `SegmentedControl` | `options, value, onChange` | 활성 옵션: 흰 배경 + 그림자 |
| `Switch` | `on, onChange` | 32×18, 시안 토글 |
| `Slider` | `min, max, value, onChange` | 4px 트랙 + 14px thumb |
| `Button` | `variant, size, onClick` | default/ghost/primary/danger-ghost |
| `Card` | `children, className` | 흰 배경 + --line 보더 + --shadow-2 |

---

## 9. 단계별 구현 순서

1. 프로젝트 세팅 (Vite + React + TS)
2. index.css (디자인 토큰)
3. types.ts + sampleTracks.ts
4. App.tsx (레이아웃 껍데기)
5. **Sidebar** ← 현재 작업
6. Header
7. StatusBar
8. shared 컴포넌트
9. Step1 (미디어 준비)
10. Step2 (비주얼 편집)
11. Step3 (영상 출력)

---

## 10. 아이콘

`lucide-react` 사용. 커스텀 로고(수직 파형 6 bars)는 `icons/index.tsx`에 인라인 SVG로 정의.
