# 비주얼라이저 글로우 + 레인보우 스펙트럼 설계

**날짜:** 2026-05-25  
**대상 파일:** `src/lib/renderer/frameRenderer.ts`, `src/components/steps/Step2/Step2.tsx`

---

## 목표

현재 단색 정적 렌더링인 비주얼라이저를 두 가지 효과로 강화한다.

1. **글로우** — 주파수 에너지(음량)에 따라 발광 강도가 변하는 shadowBlur 효과
2. **레인보우 스펙트럼** — 저음(빨강) → 고음(파랑)으로 HSL 색상이 매핑된 per-element 색상

두 효과는 조합 적용된다. 사용자가 선택한 색상은 글로우 fallback(tunnel, pulse) 및 기준 채도/명도에만 사용된다.

---

## 색상 계산 공식

### 에너지 계산

```ts
// frequencyData: Float32Array (0~1 정규화)
const energy = frequencyData.reduce((s, v) => s + v, 0) / frequencyData.length
// energy: 0~1
```

### 레인보우 색상 (per-element)

```ts
function rainbowColor(i: number, total: number, energy: number): string {
  const hue = (i / total) * 240          // 0° (빨강/저음) → 240° (파랑/고음)
  const lightness = 50 + energy * 30     // 50% (조용) → 80% (최대)
  return `hsl(${hue}, 100%, ${lightness}%)`
}
```

### 글로우 강도

```ts
const glowPx = energy * (intensity / 100) * 40   // 0~40px
```

---

## frameRenderer.ts 변경

### 글로우 적용 패턴 (모든 타입 공통)

```ts
// drawVisualizer 함수 내, 타입 분기 전
const energy = frequencyData.reduce((s, v) => s + v, 0) / frequencyData.length
const glowPx = energy * intensity * 40
```

각 타입의 ctx.fill() / ctx.stroke() 직전에 설정:
```ts
ctx.shadowBlur = glowPx
ctx.shadowColor = /* 해당 요소의 rainbow 색상 또는 fallback color */
```

그리기 완료 후 반드시 리셋:
```ts
ctx.shadowBlur = 0
ctx.shadowColor = 'transparent'
```

### 타입별 rainbow 적용 방식

| 타입 | 적용 단위 | 색상 소스 |
|------|-----------|-----------|
| bars | 막대(i) | rainbowColor(i, numBars, energy) |
| mirror | 막대(i) | rainbowColor(i, numBars, energy) |
| waveform | 선 전체 | rainbowColor(freq 평균 인덱스, total, energy) — 단일 색상 |
| scope | 선 전체 | 단일 rainbow 색상 |
| led | 활성 셀(col) | rainbowColor(col, cols, energy) |
| rain | 열(col) | rainbowColor(col, cols, energy) |
| circular | 선(i) | rainbowColor(i, numBars, energy) |
| burst | 선(i) | rainbowColor(i, sparseData.length, energy) |
| galaxy | 점(i) | rainbowColor(i, numBars, energy) |
| prism | 삼각형(i) | rainbowColor(i, count, energy) |
| tunnel | 사각형(ring) | rainbowColor(ring, 5, energy) |
| pulse | 링(ring) | rainbowColor(ring, 4, energy) |

waveform, scope, tunnel, pulse는 분할이 자연스럽지 않으므로 에너지 기반 단일 색상 사용:
```ts
// energy가 높을수록 파랑→보라 계열로 이동
const hue = energy * 240
const singleColor = `hsl(${hue}, 100%, ${50 + energy * 30}%)`
```

---

## Step2.tsx 변경

### 글로우 (CSS filter)

`.s2-frame__wave` 컨테이너 인라인 스타일에 동적 추가:

```tsx
const energy = data.reduce((s, v) => s + v, 0) / data.length
const glowPx = energy * intensityScale * 20   // 프리뷰는 크기가 작아 40px → 20px

// waveContainerStyle 확장
style={{
  opacity: visualizer.opacity / 100,
  filter: `drop-shadow(0 0 ${glowPx}px ${visColor})`,
  ...waveContainerStyle(visualizer.y, visualizer.size)
}}
```

컴팩트 타입(circular, burst 등)은 현재 Canvas가 아닌 SVG 또는 별도 컴포넌트이므로 해당 컨테이너에도 동일하게 적용.

### 레인보우 색상 (SVG per-element)

bars: 각 `<div>` style의 background를 `rainbowColor(i, data.length, energy)`로 교체  
mirror: 각 `<rect>` fill을 rainbowColor로 교체  
waveform stroke: 에너지 기반 단일 색상  
scope: 에너지 기반 단일 색상  
led: 활성 셀 fill을 rainbowColor(col)로 교체  
rain: arc fill을 rainbowColor(col)로 교체  
컴팩트 타입(circular, burst, galaxy 등): 기존 SVG/Canvas 요소의 stroke/fill 교체

### 공용 헬퍼 함수

Step2.tsx 모듈 레벨에 추가:

```ts
function rainbowColor(i: number, total: number, energy: number): string {
  const hue = (i / Math.max(total - 1, 1)) * 240
  const lightness = 50 + energy * 30
  return `hsl(${hue}, 100%, ${lightness}%)`
}
```

frameRenderer.ts에도 동일 함수 추가 (모듈 레벨).

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/renderer/frameRenderer.ts` | `rainbowColor()` 헬퍼 추가, `drawVisualizer`에 energy 계산 + shadowBlur + per-type rainbow 색상 적용 |
| `src/components/steps/Step2/Step2.tsx` | `rainbowColor()` 헬퍼 추가, 컨테이너 CSS glow, SVG/div per-element rainbow 색상 |
| `src/types.ts` | 변경 없음 |
| `src/lib/renderer/frameRenderer.test.ts` | drawVisualizer 스냅샷 테스트 업데이트 (색상 변경 반영) |
| `src/components/steps/Step2/Step2.test.tsx` | 비주얼라이저 렌더링 테스트 업데이트 |

---

## 성공 기준

- Step2 스테이지에서 음악 재생 시 비주얼라이저가 빨강→파랑으로 색상 전환되며 발광
- 음량이 클수록 글로우 강도가 높아짐
- Step3에서 렌더링한 MP4 파일에도 동일한 효과 적용됨
- 기존 94개 테스트 통과 유지
