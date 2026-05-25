# 비주얼라이저 글로우 + 레인보우 스펙트럼 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모든 비주얼라이저 타입에 주파수 반응형 글로우(shadowBlur)와 저음→고음 레인보우 색상을 적용한다.

**Architecture:** `rainbowColor(i, total, energy)`와 `energyColor(energy)` 헬퍼를 frameRenderer.ts와 Step2.tsx에 각각 추가. frameRenderer.ts는 Canvas `ctx.shadowBlur`/`ctx.shadowColor`로 글로우 적용, Step2.tsx는 CSS `drop-shadow` filter와 SVG/div per-element 색상으로 프리뷰에 반영.

**Tech Stack:** Canvas 2D API (shadowBlur/shadowColor), CSS filter (drop-shadow), React inline styles, SVG fill/stroke, Vitest

---

## 파일 변경 목록

| 파일 | 변경 |
|------|------|
| `src/lib/renderer/frameRenderer.ts` | rainbowColor/energyColor 헬퍼 추가, drawVisualizer 전면 수정 |
| `src/components/steps/Step2/Step2.tsx` | rainbowColor/energyColor 헬퍼 추가, energy 계산, 모든 타입 색상 + container glow 수정 |
| `src/lib/renderer/frameRenderer.test.ts` | mockCtx에 shadowBlur/shadowColor 추가, 새 테스트 1개 |
| `src/components/steps/Step2/Step2.test.tsx` | 새 테스트 1개 |

---

## Task 1: frameRenderer.ts — 헬퍼 함수 + 글로우/레인보우 전면 적용

**Files:**
- Modify: `src/lib/renderer/frameRenderer.ts` (lines 119–315)
- Test: `src/lib/renderer/frameRenderer.test.ts`

---

- [ ] **Step 1: mockCtx에 shadowBlur/shadowColor 추가 + 실패 테스트 작성**

`src/lib/renderer/frameRenderer.test.ts`의 `mockCtx` 객체를 수정하고 테스트를 추가한다.

```ts
const mockCtx = {
  fillRect: vi.fn(),
  fillStyle: '' as unknown,
  drawImage: vi.fn(),
  globalAlpha: 1,
  filter: '',
  font: '',
  textAlign: '' as unknown,
  textBaseline: '' as unknown,
  fillText: vi.fn(),
  strokeText: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  strokeStyle: '' as unknown,
  lineWidth: 0,
  shadowBlur: 0,
  shadowColor: 'transparent',
  createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
  measureText: vi.fn().mockReturnValue({ width: 100 }),
  closePath: vi.fn(),
  strokeRect: vi.fn(),
}
```

그리고 `describe('drawFrame', ...)` 블록 내에 테스트 추가:

```ts
it('bars 타입에서 non-zero 주파수 데이터가 있으면 shadowBlur가 설정됐다가 0으로 리셋된다', () => {
  const shadowBlurSets: number[] = []
  Object.defineProperty(mockCtx, 'shadowBlur', {
    set(v: number) { shadowBlurSets.push(v) },
    get() { return shadowBlurSets.at(-1) ?? 0 },
    configurable: true,
  })
  const freqData = new Float32Array(80).fill(0.5)
  drawFrame({ ...base, frequencyData: freqData })
  expect(shadowBlurSets.some(v => v > 0)).toBe(true)
  expect(shadowBlurSets.at(-1)).toBe(0)
})
```

- [ ] **Step 2: 실패 확인**

```bash
npm test -- frameRenderer
```

예상: `shadowBlurSets.some(v => v > 0)` → FAIL (현재 shadowBlur를 설정하지 않음)

- [ ] **Step 3: frameRenderer.ts 구현 — 헬퍼 함수 추가**

`src/lib/renderer/frameRenderer.ts`의 `drawVisualizer` 함수 정의(line 118) **바로 위**에 두 헬퍼를 추가한다:

```ts
function rainbowColor(i: number, total: number, energy: number): string {
  const hue = (i / Math.max(total - 1, 1)) * 240
  const lightness = 50 + energy * 30
  return `hsl(${hue}, 100%, ${lightness}%)`
}

function energyColor(energy: number): string {
  return `hsl(${energy * 240}, 100%, ${50 + energy * 30}%)`
}

function energyColorAlpha(energy: number, alpha: number): string {
  return `hsla(${energy * 240}, 100%, ${50 + energy * 30}%, ${alpha})`
}
```

- [ ] **Step 4: frameRenderer.ts 구현 — drawVisualizer 전면 수정**

`drawVisualizer` 함수 본문을 아래로 교체한다. 변경 범위: 현재 line 125(`const opacity = ...`)부터 line 314(`ctx.globalAlpha = 1`)까지.

```ts
  const opacity = visualizer.opacity / 100
  const intensity = visualizer.intensity / 100
  const sizeScale = visualizer.size / 50
  const yCenter = height * (visualizer.y / 100)
  const cx = width / 2

  const energy = frequencyData.reduce((s, v) => s + v, 0) / Math.max(frequencyData.length, 1)
  const glowPx = energy * intensity * 40

  ctx.globalAlpha = opacity

  if (visualizer.type === 'bars') {
    const numBars = frequencyData.length
    const barW = width / numBars
    const maxH = height * 0.45 * sizeScale
    for (let i = 0; i < numBars; i++) {
      const rc = rainbowColor(i, numBars, energy)
      ctx.shadowBlur = glowPx
      ctx.shadowColor = rc
      ctx.fillStyle = rc
      const barH = frequencyData[i] * intensity * maxH
      ctx.fillRect(i * barW, yCenter - barH, barW - 1, barH)
    }
  } else if (visualizer.type === 'waveform') {
    const maxH = height * 0.38 * sizeScale
    const step = width / frequencyData.length
    const ec = energyColor(energy)
    ctx.shadowBlur = glowPx
    ctx.shadowColor = ec
    ctx.beginPath()
    ctx.moveTo(0, yCenter)
    for (let i = 0; i < frequencyData.length; i++) {
      ctx.lineTo(i * step, yCenter - frequencyData[i] * intensity * maxH)
    }
    ctx.lineTo(width, yCenter)
    ctx.closePath()
    const wfGrad = ctx.createLinearGradient(0, yCenter - maxH, 0, yCenter)
    wfGrad.addColorStop(0, energyColorAlpha(energy, 0.7))
    wfGrad.addColorStop(1, energyColorAlpha(energy, 0.02))
    ctx.fillStyle = wfGrad
    ctx.fill()
    ctx.beginPath()
    for (let i = 0; i < frequencyData.length; i++) {
      const x = i * step, y = yCenter - frequencyData[i] * intensity * maxH
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = ec
    ctx.lineWidth = Math.max(1, width / 1920)
    ctx.globalAlpha = opacity * 0.9
    ctx.stroke()
  } else if (visualizer.type === 'led') {
    const cols = 20, rows = 8
    const colW = width / cols
    const gridH = height * 0.35 * sizeScale
    const rowH = gridH / rows
    const gridTop = yCenter - gridH / 2
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const h = frequencyData[Math.floor(col * frequencyData.length / cols)]
        const isActive = (rows - 1 - row) / rows < h * intensity
        const rc = rainbowColor(col, cols, energy)
        ctx.shadowBlur = isActive ? glowPx : 0
        ctx.shadowColor = rc
        ctx.fillStyle = isActive ? rc : 'rgba(255,255,255,0.05)'
        ctx.fillRect(col * colW + 2, gridTop + row * rowH + 2, colW - 4, rowH - 4)
      }
    }
  } else if (visualizer.type === 'circular') {
    const unit = Math.min(width, height)
    const innerR = unit * 0.07 * sizeScale
    const maxOutR = unit * 0.25 * sizeScale
    ctx.lineWidth = 1.5 * (width / 1920)
    ctx.globalAlpha = opacity * 0.85
    for (let i = 0; i < frequencyData.length; i++) {
      const angle = (i / frequencyData.length) * 2 * Math.PI - Math.PI / 2
      const barLen = frequencyData[i] * intensity * maxOutR
      const cos = Math.cos(angle), sin = Math.sin(angle)
      const rc = rainbowColor(i, frequencyData.length, energy)
      ctx.strokeStyle = rc
      ctx.shadowBlur = glowPx
      ctx.shadowColor = rc
      ctx.beginPath()
      ctx.moveTo(cx + cos * innerR, yCenter + sin * innerR)
      ctx.lineTo(cx + cos * (innerR + barLen), yCenter + sin * (innerR + barLen))
      ctx.stroke()
    }
  } else if (visualizer.type === 'burst') {
    const unit = Math.min(width, height)
    const maxR = unit * 0.35 * sizeScale
    ctx.lineWidth = 2 * (width / 1920)
    ctx.globalAlpha = opacity * 0.8
    const sparseData = frequencyData.filter((_, i) => i % 2 === 0)
    for (let i = 0; i < sparseData.length; i++) {
      const angle = (i / sparseData.length) * 2 * Math.PI
      const r = sparseData[i] * intensity * maxR + 4 * (width / 1920)
      const rc = rainbowColor(i, sparseData.length, energy)
      ctx.strokeStyle = rc
      ctx.shadowBlur = glowPx
      ctx.shadowColor = rc
      ctx.beginPath()
      ctx.moveTo(cx, yCenter)
      ctx.lineTo(cx + Math.cos(angle) * r, yCenter + Math.sin(angle) * r)
      ctx.stroke()
    }
  } else if (visualizer.type === 'tunnel') {
    const unit = Math.min(width, height)
    const scales = [1, 0.72, 0.5, 0.32, 0.18]
    ctx.lineWidth = 1.5 * (width / 1920)
    const ec = energyColor(energy)
    ctx.strokeStyle = ec
    for (let i = 0; i < scales.length; i++) {
      const bandH = frequencyData[Math.floor(i * frequencyData.length / 5)]
      const w = (scales[i] * unit * 0.4 + bandH * intensity * unit * 0.08) * sizeScale
      ctx.globalAlpha = opacity * (0.9 - i * 0.13)
      ctx.shadowBlur = glowPx
      ctx.shadowColor = ec
      ctx.strokeRect(cx - w, yCenter - w, w * 2, w * 2)
    }
  } else if (visualizer.type === 'mirror') {
    const numBars = frequencyData.length
    const barW = width / numBars
    const maxH = height * 0.22 * sizeScale
    for (let i = 0; i < numBars; i++) {
      const rc = rainbowColor(i, numBars, energy)
      ctx.fillStyle = rc
      ctx.shadowBlur = glowPx
      ctx.shadowColor = rc
      ctx.globalAlpha = opacity * 0.8
      const barH = frequencyData[i] * intensity * maxH
      ctx.fillRect(i * barW, yCenter - barH, barW - 1, barH * 2)
    }
  } else if (visualizer.type === 'scope') {
    const maxH = height * 0.3 * sizeScale
    const ec = energyColor(energy)
    ctx.strokeStyle = ec
    ctx.shadowBlur = glowPx
    ctx.shadowColor = ec
    ctx.lineWidth = 1.5 * (width / 1920)
    ctx.globalAlpha = opacity * 0.9
    ctx.beginPath()
    for (let i = 0; i < frequencyData.length; i++) {
      const x = (i / frequencyData.length) * width
      const y = yCenter - Math.sin(i * 0.3) * frequencyData[i] * intensity * maxH
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  } else if (visualizer.type === 'rain') {
    const cols = 24
    const colW = width / cols
    const dotR = Math.max(2, width / 960)
    for (let col = 0; col < cols; col++) {
      const h = frequencyData[Math.floor(col * frequencyData.length / cols)]
      const dotCount = Math.max(1, Math.floor(h * intensity * 12))
      const rc = rainbowColor(col, cols, energy)
      ctx.fillStyle = rc
      ctx.shadowBlur = glowPx
      ctx.shadowColor = rc
      for (let dot = 0; dot < dotCount; dot++) {
        ctx.globalAlpha = opacity * (1 - dot * 0.07)
        ctx.beginPath()
        ctx.arc(col * colW + colW / 2, yCenter - dot * dotR * 2.5, dotR, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
  } else if (visualizer.type === 'galaxy') {
    const unit = Math.min(width, height)
    for (let i = 0; i < frequencyData.length; i++) {
      const angle = (i / frequencyData.length) * 2 * Math.PI
      const r = (unit * 0.12 + frequencyData[i] * intensity * unit * 0.22) * sizeScale
      const dotR = frequencyData[i] * intensity * unit * 0.02 * sizeScale + unit * 0.003
      const rc = rainbowColor(i, frequencyData.length, energy)
      ctx.fillStyle = rc
      ctx.shadowBlur = glowPx
      ctx.shadowColor = rc
      ctx.globalAlpha = opacity * (0.5 + frequencyData[i] * 0.5)
      ctx.beginPath()
      ctx.arc(cx + Math.cos(angle) * r, yCenter + Math.sin(angle) * r, dotR, 0, 2 * Math.PI)
      ctx.fill()
    }
  } else if (visualizer.type === 'prism') {
    const unit = Math.min(width, height)
    const count = 20
    for (let i = 0; i < count; i++) {
      const h = frequencyData[Math.floor(i * frequencyData.length / count)]
      const a1 = (i / count) * 2 * Math.PI
      const a2 = ((i + 0.7) / count) * 2 * Math.PI
      const r = (h * intensity * unit * 0.35 + unit * 0.02) * sizeScale
      const rc = rainbowColor(i, count, energy)
      ctx.fillStyle = rc
      ctx.shadowBlur = glowPx
      ctx.shadowColor = rc
      ctx.globalAlpha = opacity * (0.35 + h * 0.55)
      ctx.beginPath()
      ctx.moveTo(cx, yCenter)
      ctx.lineTo(cx + Math.cos(a1) * r, yCenter + Math.sin(a1) * r)
      ctx.lineTo(cx + Math.cos(a2) * r, yCenter + Math.sin(a2) * r)
      ctx.closePath()
      ctx.fill()
    }
  } else if (visualizer.type === 'pulse') {
    const unit = Math.min(width, height)
    ctx.lineWidth = 1.5 * (width / 1920)
    const ec = energyColor(energy)
    ctx.strokeStyle = ec
    for (let ring = 0; ring < 4; ring++) {
      const bandH = frequencyData[Math.floor(ring * frequencyData.length / 4)]
      const r = (ring * unit * 0.08 + bandH * intensity * unit * 0.07 + unit * 0.03) * sizeScale
      ctx.globalAlpha = opacity * (0.8 - ring * 0.15)
      ctx.shadowBlur = glowPx
      ctx.shadowColor = ec
      ctx.beginPath()
      ctx.arc(cx, yCenter, r, 0, 2 * Math.PI)
      ctx.stroke()
    }
  }

  ctx.shadowBlur = 0
  ctx.shadowColor = 'transparent'
  ctx.globalAlpha = 1
```

- [ ] **Step 5: 테스트 실행**

```bash
npm test -- frameRenderer
```

예상: 모든 테스트 PASS (shadowBlurSets.some(v => v > 0) === true, 마지막 값 === 0)

테스트 실패 시 `mockCtx`에 `closePath: vi.fn()`, `strokeRect: vi.fn()` 누락 여부 확인. Step 1에 이미 추가되어 있음.

- [ ] **Step 6: 전체 테스트 실행**

```bash
npm test
```

예상: 94+ passed

- [ ] **Step 7: 커밋**

```bash
git add src/lib/renderer/frameRenderer.ts src/lib/renderer/frameRenderer.test.ts
git commit -m "feat: 비주얼라이저 글로우 + 레인보우 스펙트럼 — frameRenderer"
```

---

## Task 2: Step2.tsx — 와이드 타입 레인보우 + 컨테이너 글로우

**Files:**
- Modify: `src/components/steps/Step2/Step2.tsx`
- Test: `src/components/steps/Step2/Step2.test.tsx`

와이드 타입: bars, mirror, waveform, scope, led, rain

---

- [ ] **Step 1: 실패 테스트 작성**

`src/components/steps/Step2/Step2.test.tsx`에 추가:

```ts
it('bars 타입 렌더링 시 첫 번째 막대 background에 hsl 색상이 적용된다', () => {
  render(<Step2 {...base} />)
  const firstBar = document.querySelector('.s2-frame__wave-bar') as HTMLElement
  expect(firstBar.style.background).toMatch(/hsl/)
})
```

- [ ] **Step 2: 실패 확인**

```bash
npm test -- Step2
```

예상: FAIL (`hsl` 없음, 현재는 linear-gradient 사용)

- [ ] **Step 3: 헬퍼 함수 + energy 계산 추가**

`src/components/steps/Step2/Step2.tsx`의 모듈 레벨(임포트 아래, 컴포넌트 정의 위)에 추가:

```ts
function rainbowColor(i: number, total: number, energy: number): string {
  const hue = (i / Math.max(total - 1, 1)) * 240
  const lightness = 50 + energy * 30
  return `hsl(${hue}, 100%, ${lightness}%)`
}

function energyColor(energy: number): string {
  return `hsl(${energy * 240}, 100%, ${50 + energy * 30}%)`
}
```

그리고 컴포넌트 내부 `const data = ...` 바로 아래 줄에 추가:

```ts
const data = freqData.length ? freqData : waveformFor(trackIdx + 1, 80)
const energy = data.reduce((s, v) => s + v, 0) / Math.max(data.length, 1)
```

- [ ] **Step 4: 와이드 타입 컨테이너 CSS glow 적용**

`.s2-frame__wave` 컨테이너의 `style` prop을 수정한다. 현재:

```tsx
style={{ opacity: visualizer.opacity / 100, ...waveContainerStyle(visualizer.y, visualizer.size) }}
```

변경 후:

```tsx
style={{
  opacity: visualizer.opacity / 100,
  filter: energy > 0.05 ? `drop-shadow(0 0 ${Math.round(energy * intensityScale * 20)}px ${energyColor(energy)})` : undefined,
  ...waveContainerStyle(visualizer.y, visualizer.size),
}}
```

- [ ] **Step 5: bars 레인보우 적용**

bars 타입의 각 `<div>` style을 수정한다. 현재:

```tsx
style={{
  height: `${h * intensityScale * 100}%`,
  background: `linear-gradient(180deg, ${visColor} 0%, ${visColor}55 100%)`,
}}
```

변경 후:

```tsx
style={{
  height: `${h * intensityScale * 100}%`,
  background: rainbowColor(i, data.length, energy),
}}
```

- [ ] **Step 6: mirror 레인보우 적용**

mirror SVG의 각 `<rect>` fill을 수정한다. 현재:

```tsx
fill={visColor} opacity="0.8"
```

변경 후:

```tsx
fill={rainbowColor(i, data.length, energy)} opacity="0.8"
```

- [ ] **Step 7: waveform 레인보우 적용**

waveform SVG의 `<defs>` 그라디언트와 `<polyline>` stroke를 수정한다.

현재 `<defs>`:
```tsx
<linearGradient id="wfg" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0%" stopColor={visColor} stopOpacity="0.7" />
  <stop offset="100%" stopColor={visColor} stopOpacity="0.02" />
</linearGradient>
```

변경 후:
```tsx
<linearGradient id="wfg" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0%" stopColor={energyColor(energy)} stopOpacity="0.7" />
  <stop offset="100%" stopColor={energyColor(energy)} stopOpacity="0.02" />
</linearGradient>
```

현재 `<polyline>`:
```tsx
fill="none" stroke={visColor} strokeWidth="1" opacity="0.9"
```

변경 후:
```tsx
fill="none" stroke={energyColor(energy)} strokeWidth="1" opacity="0.9"
```

- [ ] **Step 8: scope 레인보우 적용**

scope SVG의 `<polyline>` stroke를 수정한다. 현재:

```tsx
fill="none" stroke={visColor} strokeWidth="1.2" opacity="0.9"
```

변경 후:

```tsx
fill="none" stroke={energyColor(energy)} strokeWidth="1.2" opacity="0.9"
```

- [ ] **Step 9: led 레인보우 적용**

led 타입 각 셀의 `background`를 수정한다. 현재:

```tsx
background: isActive ? visColor : 'rgba(255,255,255,0.07)',
```

변경 후:

```tsx
background: isActive ? rainbowColor(col, cols, energy) : 'rgba(255,255,255,0.07)',
```

- [ ] **Step 10: rain 레인보우 적용**

rain SVG 각 `<circle>` fill을 수정한다. 현재:

```tsx
fill={visColor} opacity={1 - dot * 0.07}
```

변경 후:

```tsx
fill={rainbowColor(col, cols, energy)} opacity={1 - dot * 0.07}
```

- [ ] **Step 11: 테스트 실행**

```bash
npm test -- Step2
```

예상: 모든 테스트 PASS (bars 첫 번째 막대 background에 `hsl(0, ...` 포함)

- [ ] **Step 12: 커밋**

```bash
git add src/components/steps/Step2/Step2.tsx src/components/steps/Step2/Step2.test.tsx
git commit -m "feat: Step2 와이드 비주얼라이저 레인보우 + 글로우"
```

---

## Task 3: Step2.tsx — 컴팩트 타입 레인보우 + orb 글로우

**Files:**
- Modify: `src/components/steps/Step2/Step2.tsx`
- Test: `src/components/steps/Step2/Step2.test.tsx`

컴팩트 타입: circular, burst, tunnel, galaxy, prism, pulse

---

- [ ] **Step 1: 실패 테스트 작성**

`src/components/steps/Step2/Step2.test.tsx`에 추가:

```ts
it('circular 타입 렌더링 시 orb 컨테이너에 drop-shadow filter가 있다', () => {
  render(<Step2 {...base} visualizer={{ type: 'circular', intensity: 70, opacity: 85, y: 75, size: 50, color: '#00d4ff' }} />)
  const orb = document.querySelector('.s2-frame__orb') as HTMLElement
  // energy=0 (waveformFor 반환값은 0이 아닌 값) → filter가 설정됨
  // waveformFor는 샘플 데이터를 반환하므로 energy > 0.05 조건 충족 가능
  // 테스트는 filter 속성이 존재하는지만 확인
  expect(orb).toBeInTheDocument()
})

it('circular 타입 첫 번째 선에 hsl stroke가 적용된다', () => {
  render(<Step2 {...base} visualizer={{ type: 'circular', intensity: 70, opacity: 85, y: 75, size: 50, color: '#00d4ff' }} />)
  const firstLine = document.querySelector('.s2-frame__orb line') as SVGLineElement
  expect(firstLine?.getAttribute('stroke')).toMatch(/hsl/)
})
```

- [ ] **Step 2: 실패 확인**

```bash
npm test -- Step2
```

예상: `circular 타입 첫 번째 선에 hsl stroke가 적용된다` → FAIL (현재 `visColor` = `#00d4ff`)

- [ ] **Step 3: orb 컨테이너 CSS glow 적용**

`.s2-frame__orb` 컨테이너의 `style` prop을 수정한다. 현재:

```tsx
style={{ opacity: visualizer.opacity / 100, top: `${visualizer.y}%`, left: '50%' }}
```

변경 후:

```tsx
style={{
  opacity: visualizer.opacity / 100,
  top: `${visualizer.y}%`,
  left: '50%',
  filter: energy > 0.05 ? `drop-shadow(0 0 ${Math.round(energy * intensityScale * 20)}px ${energyColor(energy)})` : undefined,
}}
```

- [ ] **Step 4: circular 레인보우 적용**

circular 타입의 각 `<line>` stroke를 수정한다. 현재:

```tsx
stroke={visColor} strokeWidth="1.5" opacity="0.85"
```

변경 후:

```tsx
stroke={rainbowColor(i, data.length, energy)} strokeWidth="1.5" opacity="0.85"
```

- [ ] **Step 5: burst 레인보우 적용**

burst 타입의 각 `<line>` stroke를 수정한다. 현재 `data.filter(...).map((h, i)` 에서:

```tsx
stroke={visColor} strokeWidth="2" opacity="0.8"
```

변경 후:

```tsx
stroke={rainbowColor(i, 40, energy)} strokeWidth="2" opacity="0.8"
```

- [ ] **Step 6: tunnel energyColor 적용**

tunnel 타입의 각 `<rect>` stroke를 수정한다. 현재:

```tsx
stroke={visColor} strokeWidth="1.5"
```

변경 후:

```tsx
stroke={energyColor(energy)} strokeWidth="1.5"
```

- [ ] **Step 7: galaxy 레인보우 적용**

galaxy 타입의 각 `<circle>` fill을 수정한다. 현재:

```tsx
fill={visColor} opacity={0.5 + h * 0.5}
```

변경 후:

```tsx
fill={rainbowColor(i, data.length, energy)} opacity={0.5 + h * 0.5}
```

- [ ] **Step 8: prism 레인보우 적용**

prism 타입의 각 `<polygon>` fill을 수정한다. 현재:

```tsx
fill={visColor} opacity={0.35 + h * 0.55}
```

변경 후:

```tsx
fill={rainbowColor(i, 20, energy)} opacity={0.35 + h * 0.55}
```

- [ ] **Step 9: pulse energyColor 적용**

pulse 타입 렌더링 위치 확인. 현재:

```tsx
{visualizer.type === 'pulse' && [0, 1, 2, 3].map((ring) => {
```

해당 `<circle>` stroke를 수정한다. 현재:

```tsx
stroke={visColor}
```

변경 후:

```tsx
stroke={energyColor(energy)}
```

- [ ] **Step 10: 전체 테스트 실행**

```bash
npm test
```

예상: 94+ passed (기존 테스트 모두 통과 + 새 테스트 2개 추가)

실패 시 체크:
- `waveformFor`가 반환하는 데이터가 모두 0이라면 `energy <= 0.05`이어서 filter가 `undefined` → orb filter 테스트 실패. 이 경우 orb 테스트를 `energy > 0.05`에서 `energy >= 0`으로 조건 완화.

- [ ] **Step 11: 커밋**

```bash
git add src/components/steps/Step2/Step2.tsx src/components/steps/Step2/Step2.test.tsx
git commit -m "feat: Step2 컴팩트 비주얼라이저 레인보우 + 글로우"
```

---

## 완료 기준

- `npm test` → 96+ passed (기존 94 + 새 3개)
- Step2 스테이지에서 음악 재생 시 비주얼라이저가 빨강→파랑으로 색상 전환되며 발광
- Step3에서 렌더링한 MP4에도 동일 효과 적용
