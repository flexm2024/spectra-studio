# Step2 비주얼 컨트롤 스테이지 반영 설계

**날짜:** 2026-05-20  
**범위:** 타이포그래피·비주얼라이저·효과·타임코드 컨트롤을 스테이지 프리뷰에 실시간 반영

---

## 배경 및 목표

Step2의 컨트롤(슬라이더, 효과 토글, 비주얼라이저 타입)은 상태로 저장되지만 스테이지 프리뷰에 반영되지 않음. 이 기능들을 실시간으로 스테이지에 적용한다.

---

## 변경 파일

| 파일 | 역할 |
|------|------|
| `src/components/steps/Step2/Step2.tsx` | 컨트롤 → 스테이지 연결, currentTime prop 추가 |
| `src/components/steps/Step2/Step2.css` | Wave/Orb 비주얼라이저 CSS, blur 오버레이 |
| `src/components/steps/Step2/Step2.test.tsx` | currentTime prop 추가 |
| `src/App.tsx` | Step2에 currentTime prop 전달 |

---

## 세부 변경 사항

### 1. 타이포그래피 → 스테이지

`.s2-frame__title`에 인라인 스타일 적용.

```tsx
<h2
  className="s2-frame__title"
  style={{
    fontSize: typography.titleSize,
    letterSpacing: `${typography.letterSpacing / 1000}em`,
  }}
>
  {playingTrack?.title}
</h2>
```

- `titleSize`: 20~80 범위, px 단위
- `letterSpacing`: -50~50 → /1000 → em 단위 (-0.05em ~ 0.05em). 기본 -15 → -0.015em

---

### 2. 비주얼라이저 → 스테이지

#### 컨테이너 공통

기존 `.s2-frame__wave` div를 유지하되, 다음 인라인 스타일 적용:

```tsx
<div
  className="s2-frame__wave"
  style={{
    opacity: effects.vis ? visualizer.opacity / 100 : 0,
    display: effects.vis ? undefined : 'none',
  }}
>
  {/* type별 렌더링 */}
</div>
```

- `effects.vis === false` → `display: none`으로 숨김
- `visualizer.opacity` → 전체 opacity

#### Bars 타입 (기존 유지)

`intensity`로 막대 높이 스케일링:

```tsx
{visualizer.type === 'bars' && waveformFor(trackIdx + 1, 80).map((h, i) => (
  <div
    key={i}
    className="s2-frame__wave-bar"
    style={{ height: `${h * visualizer.intensity}%` }}
  />
))}
```

- `intensity` 0~100 → 막대 높이 0~100%

#### Wave 타입

SVG polyline으로 waveformFor 데이터를 파형 곡선으로 렌더링.

```tsx
{visualizer.type === 'wave' && (
  <svg className="s2-frame__wave-svg" viewBox="0 0 80 40" preserveAspectRatio="none">
    <polyline
      points={waveformFor(trackIdx + 1, 80)
        .map((h, i) => `${i},${40 - h * visualizer.intensity * 0.4}`)
        .join(' ')}
      className="s2-frame__wave-line"
    />
  </svg>
)}
```

CSS:
```css
.s2-frame__wave-svg {
  width: 100%;
  height: 100%;
}
.s2-frame__wave-line {
  fill: none;
  stroke: var(--c);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
```

#### Orb 타입

중앙 배치 동심원 3개. `.s2-frame__wave`의 position/size를 재정의.

```tsx
{visualizer.type === 'orb' && (
  <div className="s2-frame__orb">
    {[1, 0.65, 0.35].map((scale, i) => (
      <div
        key={i}
        className="s2-frame__orb-ring"
        style={{
          width:  `${scale * visualizer.intensity * 0.8}px`,
          height: `${scale * visualizer.intensity * 0.8}px`,
        }}
      />
    ))}
  </div>
)}
```

Orb일 때 `.s2-frame__wave`를 재활용하지 않고 별도 `.s2-frame__orb` div 사용.
`effects.vis`와 `visualizer.opacity` 동일하게 적용.

CSS:
```css
.s2-frame__orb {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  pointer-events: none;
}
.s2-frame__orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid var(--c);
  opacity: 0.6;
}
```

---

### 3. 효과 → 스테이지

#### blur 효과

`effects.blur === true`일 때 배경 이미지(또는 배경 그라디언트 위)에 blur 레이어 추가.

```tsx
{effects.blur && (
  <div className="s2-frame__blur-overlay" />
)}
```

CSS:
```css
.s2-frame__blur-overlay {
  position: absolute;
  inset: 0;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  z-index: 0;
  pointer-events: none;
}
```

배경 이미지 있을 때: 이미지 위에 blur overlay → 이미지가 흐릿하게 보임  
배경 없을 때: 그라디언트 위의 overlay → blur 효과는 미미하지만 구조 유지

#### vis 효과

비주얼라이저 렌더링 조건부 처리로 처리 (섹션 2에서 설명).

#### crossfade, ducking

출력 설정이므로 스테이지 시각 변화 없음. 토글 UI는 이미 동작함.

---

### 4. 타임코드 연결

#### App.tsx

Step2에 `currentTime` prop 추가:

```tsx
<Step2
  ...
  currentTime={audioCurrentTime}
/>
```

#### Step2Props

```ts
currentTime: number
```

#### 타임코드 표시

```tsx
const fmt = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
const totalSec = tracks.reduce((acc, t) => acc + t.durationSec, 0)
```

```tsx
<div className="s2-timecode">{fmt(currentTime)} / {fmt(totalSec)}</div>
```

---

## 테스트 계획

1. 제목 크기 슬라이더 → 스테이지 제목 폰트 즉시 변경
2. 자간 슬라이더 → 스테이지 제목 자간 즉시 변경
3. 비주얼라이저 Bars → Wave → Orb 전환 시 렌더링 변경
4. intensity 슬라이더 → 막대/파형 높이 변화
5. opacity 슬라이더 → 비주얼라이저 투명도 변화
6. 오디오 비주얼라이저 효과 OFF → 비주얼라이저 사라짐
7. 배경 블러 효과 ON → 스테이지 배경 흐림
8. 오디오 재생 → 타임코드 실시간 증가
