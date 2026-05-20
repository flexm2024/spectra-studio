# Step1 미디어 업로드 기능 구현 설계

**날짜:** 2026-05-20  
**범위:** Step1 배경/로고/워터마크/스티커 이미지 업로드, 프리뷰 반영, 진행바 연동

---

## 배경 및 목표

오디오 파일 업로드(F4)는 완료됨. 브랜딩 탭(배경/로고/스티커)의 drop-slot은 UI만 있고 실제 파일 업로드 기능이 없음. 프리뷰 진행바도 하드코딩된 상태. 이 기능들을 구현하고 Step2 프리뷰에도 연동함.

---

## 타입 변경 (types.ts)

`watermark?: string` 필드 추가.

```ts
export type ProjectState = {
  // 기존 필드들 유지
  watermark?: string   // 추가
  ...
}
```

---

## App.tsx 상태 추가

```ts
const [background, setBackground] = useState<Background>({ type: 'gradient' })
const [logo, setLogo] = useState<string | undefined>(undefined)
const [watermark, setWatermark] = useState<string | undefined>(undefined)
const [stickers, setStickers] = useState<string[]>([])
const [audioCurrentTime, setAudioCurrentTime] = useState(0)
```

`<audio>` 요소에 핸들러 추가.
```tsx
<audio
  ref={audioRef}
  onPlay={() => setIsPlaying(true)}
  onPause={() => setIsPlaying(false)}
  onEnded={handleTrackEnded}
  onTimeUpdate={e => setAudioCurrentTime(e.currentTarget.currentTime)}
/>
```

Step1과 Step2에 새 props 전달.

---

## Step1 변경

### Props 추가

```ts
interface Step1Props {
  // 기존 props 유지
  background: Background
  setBackground: (bg: Background) => void
  logo: string | undefined
  setLogo: (url: string | undefined) => void
  watermark: string | undefined
  setWatermark: (url: string | undefined) => void
  stickers: string[]
  setStickers: (s: string[] | ((prev: string[]) => string[])) => void
  currentTime: number
}
```

### 이미지 업로드 로직

drop-slot 각각에 숨김 `<input type="file">` ref 추가. 드래그앤드롭 + 클릭 모두 지원.

| 슬롯 | accept | 핸들러 | 상태 |
|------|--------|--------|------|
| 배경 | `image/*` | `handleBgFile` | `setBackground({ type: 'image', src: url })` |
| 로고 | `image/*,.svg` | `handleLogoFile` | `setLogo(url)` |
| 워터마크 | `image/*` | `handleWatermarkFile` | `setWatermark(url)` |
| 스티커 | `image/*,.gif` (multiple) | `handleStickerFiles` | `setStickers(prev => [...prev, ...urls].slice(0, 5))` |

파일 교체 시 기존 ObjectURL `revokeObjectURL` 처리.

### bgType 상태 제거

기존 내부 `bgType` 상태 제거. `background.type`을 SegmentedControl value로 사용.  
배경 타입 변경 시: `setBackground(prev => ({ ...prev, type: newType }))`.

### drop-slot 상태 시각화

업로드 전: 기존 아이콘 + 안내 텍스트.  
업로드 후: 썸네일 `<img>` 표시 + "변경" 텍스트 오버레이 (hover 시).  
스티커: 업로드된 이미지들을 작은 그리드로 표시, 각 항목에 삭제 버튼(×).

### 프리뷰 프레임 반영

```tsx
{/* 배경 */}
{background.src
  ? <img className="preview-frame__bg-img" src={background.src} />
  : <div className="preview-frame__bg" />
}

{/* 로고 */}
{logo
  ? <img className="preview-frame__logo-img" src={logo} />
  : <div className="preview-frame__logo"><Icon name="logo" size={22} /></div>
}
```

### 진행바

```tsx
<div
  className="preview-controls__fill"
  style={{ width: `${playingTrack ? (currentTime / playingTrack.durationSec) * 100 : 0}%` }}
/>
```

---

## Step2 변경 (최소)

Props에 `background`, `logo`, `watermark`, `stickers` 추가.  
스테이지 프리뷰에서 `background.src` 있으면 배경 이미지 표시, `logo` 있으면 로고 이미지 표시.

---

## ObjectURL 해제 규칙

- 배경/로고/워터마크: 새 파일 업로드 시 기존 URL `revokeObjectURL`
- 스티커: 개별 삭제 시 해당 URL `revokeObjectURL`
- 컴포넌트 언마운트: 해제 불필요 (App 레벨 상태이므로 앱 종료까지 유지)

---

## 테스트 계획

1. 배경 이미지 업로드 → drop-slot에 썸네일 표시, 프리뷰 프레임 배경 변경
2. 배경 타입 스위치(이미지→그라디언트→비디오) → 타입만 변경, src 유지
3. 로고 업로드 → 프리뷰 로고 위치에 이미지 표시
4. 스티커 5개 초과 업로드 → 5개로 제한, 뱃지 "5 / 5"
5. 스티커 개별 삭제 → 뱃지 카운트 감소
6. 오디오 재생 → 진행바 실시간 업데이트
7. Step2로 이동 → 배경/로고 반영 확인
