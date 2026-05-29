# 타이틀 탭 디자인 스펙

**날짜:** 2026-05-29  
**범위:** Step2 비주얼 편집기 — 우측 패널 타이틀 탭 추가

---

## 1. 목표

Step2 우측 패널에 "타이틀" 탭을 추가해 곡 제목 표시의 기본 스타일(9종), 데코 스타일(7종), 폰트(17종), 위치, 크기를 사용자가 직접 구성할 수 있도록 한다. 선택한 스타일은 스테이지 프리뷰에 즉시 반영된다.

---

## 2. 데이터 모델

### 2.1 신규 타입 (types.ts)

```typescript
export type TitleBaseStyle =
  | 'minimal' | 'modern' | 'bold' | 'underline' | 'card'
  | 'neon' | 'glitch' | 'outline' | 'vintage'

export type TitleDecoStyle =
  | 'none' | 'caption' | 'bar-left' | 'frame' | 'divider'
  | 'bg-word' | 'corner' | 'wave'

export type TitlePositionPreset =
  | 'tl' | 'tc' | 'tr'
  | 'ml' | 'mc' | 'mr'
  | 'bl' | 'bc' | 'br'
```

### 2.2 Typography 확장 필드

기존 Typography 인터페이스에 다음 필드를 추가한다.

```typescript
titleStyle: TitleBaseStyle       // 기본 스타일 (기본: 'minimal')
titleDeco: TitleDecoStyle        // 데코 스타일 (기본: 'none')
titleFont: string                // 폰트 key (기본: 'inter')
titlePositionPreset: TitlePositionPreset  // 3x3 위치 (기본: 'bc')
titleCaptionTop: string          // 상단 캡션 텍스트 (기본: '')
titleCaptionBottom: string       // 하단 캡션 텍스트 (기본: '')
titleSubOffset: number           // 보조 텍스트 위치 0–100 (기본: 0)
titleAlwaysShow: boolean         // 영상 내내 항상 표시 (기본: true)
titleScale: number               // 크기 0–200 (기본: 100)
```

### 2.3 App.tsx 기본값

```typescript
typography: {
  // 기존 필드 유지
  titleStyle: 'minimal',
  titleDeco: 'none',
  titleFont: 'inter',
  titlePositionPreset: 'bc',
  titleCaptionTop: '',
  titleCaptionBottom: '',
  titleSubOffset: 0,
  titleAlwaysShow: true,
  titleScale: 100,
}
```

autosave 대상은 기존과 동일하게 `typography` 전체로 유지 (blob 없음).

---

## 3. UI 구조 — 우측 패널 탭화

현재 단일 헤더(`s2-panel__head`)를 탭 스위처로 교체한다.

```
┌───────────────────────────────┐
│  [효과]        [타이틀]       │  ← 탭 헤더
├───────────────────────────────┤
│  (선택된 탭 내용)             │
└───────────────────────────────┘
```

### 3.1 효과 탭 (기존 내용 그대로)
- 효과 칩 4개 (vis / crossfade / ducking / blur)
- 타이포그래피 섹션 (제목·트랙 토글, 크기·자간 슬라이더)
- 로고 슬라이더 (로고 있을 때)
- 이전/다음 버튼

### 3.2 타이틀 탭 (신규)

순서:
1. **곡 제목 표시** — showTitle 토글 + 체크마크
2. **기본 스타일** — 3열 버튼 그리드 (9개)
3. **데코 스타일** — 3열 버튼 그리드 (7개; none 버튼 없이 재클릭으로 해제)
4. **스타일별 입력** — titleDeco가 caption/divider/frame/bar-left일 때만 표시
   - 상단 캡션 텍스트 input
   - 하단 캡션 텍스트 input
   - 보조 텍스트 위치 슬라이더 (0–100)
5. **폰트** — 2열 폰트 버튼 그리드 (17개, 각 버튼에 해당 폰트 적용)
6. **위치** — 3×3 그리드 (현재 preset 강조)
7. **영상 내내 항상 표시** — 체크박스 토글
8. **크기** — 슬라이더 0–200%, 기본 100%

---

## 4. 스테이지 렌더링

### 4.1 CSS class 조합

```tsx
<h2
  className={`s2-frame__title title-style-${titleStyle} title-deco-${titleDeco}`}
  style={{
    fontFamily: FONT_MAP[titleFont],
    fontSize: `${typography.titleSize * (titleScale / 100)}px`,
    left: `${typography.titlePosition.x}%`,
    top: `${typography.titlePosition.y}%`,
  }}
>
  {playingTrack?.title}
</h2>
```

데코 캡션 텍스트는 CSS `content` 대신 별도 `<span>` 요소로 렌더링해 동적 텍스트를 지원한다.

### 4.2 기본 스타일 CSS

| 클래스 | 효과 |
|--------|------|
| `.title-style-minimal` | 기본 흰색, weight 500 |
| `.title-style-modern` | weight 300, letter-spacing 0.12em |
| `.title-style-bold` | weight 900 |
| `.title-style-underline` | border-bottom 2px |
| `.title-style-card` | 반투명 배경 박스 + padding |
| `.title-style-neon` | text-shadow glow (cyan) |
| `.title-style-glitch` | CSS animation, ::before/::after 오프셋 |
| `.title-style-outline` | -webkit-text-stroke 1px, color transparent |
| `.title-style-vintage` | 세리프 체감 + sepia(0.3) filter |

### 4.3 데코 스타일 CSS

| 클래스 | 효과 |
|--------|------|
| `.title-deco-divider` | ::before/::after 가로선 (위·아래) |
| `.title-deco-bar-left` | 좌측 4px 세로 컬러 바 |
| `.title-deco-frame` | 네 모서리 bracket 장식 |
| `.title-deco-caption` | 상단 캡션 `<span>` |
| `.title-deco-bg-word` | 배경 대형 반투명 텍스트 |
| `.title-deco-corner` | 우상단/좌하단 코너 선 |
| `.title-deco-wave` | 하단 SVG 웨이브 |

---

## 5. 폰트 목록

### 5.1 index.html Google Fonts 로드

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;700&family=DM+Serif+Display&family=Cormorant+Garamond:wght@300;400;600&family=Nunito:wght@400;700&family=Barlow+Condensed:wght@400;700&family=Orbitron:wght@400;700&family=Space+Mono&family=Dancing+Script:wght@400;700&family=Black+Han+Sans&family=Jua&family=Nanum+Gothic:wght@400;700&family=Nanum+Myeongjo:wght@400;700&family=Gowun+Batang:wght@400;700&family=Hi+Melody&family=Poor+Story&family=Noto+Sans+KR:wght@300;400;700&display=swap" rel="stylesheet">
```

### 5.2 FONT_MAP (Step2.tsx)

```typescript
const FONT_MAP: Record<string, string> = {
  inter:       'Inter, sans-serif',
  playfair:    '"Playfair Display", serif',
  dm_serif:    '"DM Serif Display", serif',
  cormorant:   '"Cormorant Garamond", serif',
  nunito:      'Nunito, sans-serif',
  barlow:      '"Barlow Condensed", sans-serif',
  orbitron:    'Orbitron, sans-serif',
  space_mono:  '"Space Mono", monospace',
  dancing:     '"Dancing Script", cursive',
  black_han:   '"Black Han Sans", sans-serif',
  jua:         'Jua, sans-serif',
  nanum_gothic:    '"Nanum Gothic", sans-serif',
  nanum_myeongjo:  '"Nanum Myeongjo", serif',
  gowun_batang:    '"Gowun Batang", serif',
  hi_melody:       '"Hi Melody", cursive',
  poor_story:      '"Poor Story", cursive',
  noto_sans_kr:    '"Noto Sans KR", sans-serif',
}
```

---

## 6. titlePositionPreset → titlePosition 변환

```typescript
const PRESET_COORDS: Record<TitlePositionPreset, { x: number; y: number }> = {
  tl: { x: 15, y: 15 }, tc: { x: 50, y: 15 }, tr: { x: 85, y: 15 },
  ml: { x: 15, y: 50 }, mc: { x: 50, y: 50 }, mr: { x: 85, y: 50 },
  bl: { x: 15, y: 80 }, bc: { x: 50, y: 80 }, br: { x: 85, y: 80 },
}
```

preset 클릭 시 `titlePositionPreset`과 `titlePosition` 동시 업데이트. 드래그 시에는 `titlePosition`만 업데이트 (preset 하이라이트는 유지되지 않음).

---

## 7. 변경 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `src/types.ts` | TitleBaseStyle, TitleDecoStyle, TitlePositionPreset 타입 추가; Typography 인터페이스 확장 |
| `src/App.tsx` | typography 기본값에 신규 필드 추가 |
| `src/components/steps/Step2/Step2.tsx` | 우측 패널 탭화; 타이틀 탭 UI; 스테이지 렌더링 수정; FONT_MAP 추가 |
| `src/components/steps/Step2/Step2.css` | 탭 스타일; 타이틀 탭 컴포넌트 스타일; title-style-* / title-deco-* CSS 클래스 |
| `index.html` | Google Fonts 링크 추가 |

---

## 8. 범위 외 (이번 스펙 제외)

- 렌더러(WebCodecs)에 타이틀 스타일 반영
- 데코별 캡션 애니메이션
- 스크린샷의 미등록 한국어 폰트 (길자꽃, 도련, 독도체 등)
