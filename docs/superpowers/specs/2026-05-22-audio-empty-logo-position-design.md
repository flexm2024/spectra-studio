# 설계: 오디오 트랙 초기 빈 상태 + 로고 위치 드래그

**날짜:** 2026-05-22

## 개요

두 가지 독립적인 개선 사항.

1. **오디오 트랙 초기 상태 비우기** — 앱 시작 시 샘플 트랙 15개 자동 로드 제거
2. **로고 위치 드래그** — Step2 스테이지에서 로고를 마우스로 끌어 위치 조정

---

## 기능 1: 오디오 트랙 초기 빈 상태

### 변경 사항

- `App.tsx` line 15: `useState<Track[]>(sampleTracks)` → `useState<Track[]>([])`

### 영향

- 사용자는 직접 오디오 파일을 업로드해야 트랙 목록이 채워짐
- 샘플 데이터(`sampleTracks`)는 코드에 남겨두되 초기값으로 사용하지 않음

---

## 기능 2: 로고 위치 드래그

### 새 타입 (types.ts)

```ts
export interface LogoPosition {
  x: number  // 0–100, 스테이지 너비 대비 %
  y: number  // 0–100, 스테이지 높이 대비 %
}
```

### 상태 (App.tsx)

```ts
const [logoPosition, setLogoPosition] = useState<LogoPosition>({ x: 85, y: 8 })
```

- Step2, Step3에 `logoPosition` / `setLogoPosition` props 추가
- `frameRenderer`에도 전달

### Step2 드래그 동작

- 로고 요소: `position: absolute`, `left: ${x}%`, `top: ${y}%`, `transform: translate(-50%, -50%)`
- `onMouseDown` on 로고 → drag 시작, 마우스 offset 기록
- `onMouseMove` on 스테이지 프레임 → position 업데이트 (% 계산)
- `onMouseUp` on document → drag 종료
- 클램핑: x 5–95%, y 5–90% (로고가 프레임 밖으로 나가지 않도록)
- 호버 시 cursor: grab, 드래그 중 cursor: grabbing
- 로고 없는 상태(아이콘 플레이스홀더)에서는 드래그 비활성화

### Step3 요약 텍스트

"우상단" 같은 하드코딩된 문자열 대신 실제 좌표로 표시:
```
로고 · (85%, 8%)
```

혹은 좌표를 방향명으로 변환하는 헬퍼 사용 (선택):
- x < 40%: 좌, 40–60%: 중, > 60%: 우
- y < 40%: 상, 40–60%: 중, > 60%: 하

### frameRenderer.ts

로고 drawImage 호출 시 `logoPosition.x / 100 * canvasWidth`, `logoPosition.y / 100 * canvasHeight` 좌표 사용.

---

## 변경 파일 요약

| 파일 | 변경 내용 |
|---|---|
| `src/types.ts` | `LogoPosition` 인터페이스 추가 |
| `src/App.tsx` | 초기 트랙 `[]`, `logoPosition` 상태 + props 전달 |
| `src/components/steps/Step2/Step2.tsx` | 드래그 핸들러 + absolute 위치 렌더링 |
| `src/components/steps/Step2/Step2.css` | 로고 absolute 위치 + 커서 스타일 |
| `src/components/steps/Step3/Step3.tsx` | 위치 요약 반영 |
| `src/lib/renderer/frameRenderer.ts` | 로고 drawImage 좌표 반영 |
