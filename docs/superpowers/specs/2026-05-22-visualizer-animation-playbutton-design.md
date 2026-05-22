# 설계: 비주얼라이저 애니메이션 + 플레이 버튼 하단 이동

**날짜:** 2026-05-22

## 개요

두 가지 독립적인 UX 개선.

1. **비주얼라이저 애니메이션** — 재생 중 비주얼라이저가 실제 오디오 주파수 데이터에 반응해 움직임
2. **플레이 버튼 하단 배치** — 이전/재생/다음 버튼을 스테이지 상단에서 뷰포트 아래 컨트롤 바로 이동

---

## 기능 1: 비주얼라이저 애니메이션

### 현재 문제

`Step2.tsx`의 비주얼라이저가 `waveformFor(trackIdx + 1, 80)` 정적 시드값을 사용함.
재생 중에도 값이 변하지 않아 비주얼라이저가 고정된 것처럼 보임.

### 해결 방법: Web Audio AnalyserNode

**App.tsx 변경:**

```ts
const audioCtxRef = useRef<AudioContext | null>(null)
const analyserRef = useRef<AnalyserNode | null>(null)
```

`<audio>` 요소의 `onPlay` 이벤트 또는 `onPlay` 핸들러에서 한 번만 초기화:
```ts
function ensureAudioContext() {
  if (analyserRef.current) return
  const ctx = new AudioContext()
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 256  // 128개 주파수 빈
  if (audioRef.current) {
    const source = ctx.createMediaElementSource(audioRef.current)
    source.connect(analyser)
    analyser.connect(ctx.destination)
  }
  audioCtxRef.current = ctx
  analyserRef.current = analyser
}
```

`analyserRef`를 Step2에 전달 (ref 자체를 prop으로):
```ts
<Step2 ... analyserRef={analyserRef} />
```

**Step2.tsx 변경:**

새 prop:
```ts
analyserRef: React.RefObject<AnalyserNode | null>
```

컴포넌트 내 `requestAnimationFrame` 루프:
```ts
const freqDataRef = useRef<Uint8Array>(new Uint8Array(128))
const [freqData, setFreqData] = useState<number[]>([])
const rafRef = useRef<number>(0)

useEffect(() => {
  if (!isPlaying) {
    cancelAnimationFrame(rafRef.current)
    setFreqData([])  // idle 상태 → 정적 waveformFor로 fallback
    return
  }
  function tick() {
    const analyser = analyserRef.current
    if (analyser) {
      analyser.getByteFrequencyData(freqDataRef.current)
      // 128빈 → 80개로 다운샘플
      const bins = freqDataRef.current
      const step = bins.length / 80
      const normalized = Array.from({ length: 80 }, (_, i) =>
        bins[Math.floor(i * step)] / 255
      )
      setFreqData(normalized)
    }
    rafRef.current = requestAnimationFrame(tick)
  }
  rafRef.current = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(rafRef.current)
}, [isPlaying, analyserRef])
```

비주얼라이저 렌더링에서 `waveformFor()` 대신 `freqData.length ? freqData : waveformFor(...)` 사용.

- **Bars**: 각 막대 높이 = `freqData[i] * intensity / 100 * 100%`
- **Wave**: polyline 각 점 y = `freqData[i]` 기반
- **Orb**: `energy = freqData.reduce((a,v) => a+v, 0) / freqData.length` (평균 진폭 0-1). 링 크기 = `scale * (1 + energy * 0.5) * intensity * 0.8`. freqData 없으면 에너지 = 0 → 고정 크기

**동작 조건:**
- 재생 중: AnalyserNode에서 실시간 데이터 → bars/wave/orb 애니메이션
- 정지/idle: `freqData = []` → `waveformFor()` 정적 미리보기로 fallback
- 샘플 트랙 (audioUrl 없음): 오디오 없이 재생 시뮬레이션 → freqData 비어서 정적 fallback
- CORS: blob: URL은 항상 허용됨 (사용자 업로드 파일)

---

## 기능 2: 플레이 버튼 하단 배치

### 현재 구조

```
s2-stage__top: [스킵이전] [▶] [스킵다음] [타임코드] [레전드]
s2-stage__viewport: 스테이지 프레임
s2-timeline: 타임라인
```

### 변경 후 구조

```
s2-stage__top: [타임코드] [레전드]  ← 플레이 컨트롤 제거
s2-stage__viewport: 스테이지 프레임
s2-stage__controls: [스킵이전] [▶] [스킵다음]  ← 새 컨트롤 바
s2-timeline: 타임라인
```

**Step2.tsx JSX 변경:**
- `s2-stage__top`에서 skip-prev, play-btn, skip-next 버튼 제거
- `s2-stage__viewport` 아래, `s2-timeline` 위에 `s2-stage__controls` div 추가

**Step2.css 추가:**
```css
.s2-stage__controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid var(--line);
  flex-shrink: 0;
}
```

---

## 변경 파일 요약

| 파일 | 변경 내용 |
|---|---|
| `src/App.tsx` | `audioCtxRef`, `analyserRef` 추가. `ensureAudioContext()` 함수. `onPlay` 시 AudioContext 초기화. `analyserRef` Step2에 전달 |
| `src/components/steps/Step2/Step2.tsx` | `analyserRef` prop 추가. rAF 루프 + `freqData` state. 비주얼라이저 데이터 소스 교체. 플레이 버튼 위치 이동 |
| `src/components/steps/Step2/Step2.css` | `s2-stage__controls` 스타일 추가 |
| `src/components/steps/Step2/Step2.test.tsx` | `analyserRef` prop을 base fixture에 추가 |
