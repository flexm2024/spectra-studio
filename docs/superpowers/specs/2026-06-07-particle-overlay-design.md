# Particle Overlay — Design Spec

**Date**: 2026-06-07  
**Status**: Approved

## Summary

비주얼라이저와 독립된 파티클 오버레이 레이어를 Step2(비주얼 편집) 화면에 추가한다. 왼쪽 패널 비주얼라이저 슬라이더 아래에 "파티클" 섹션을 배치하고, 스테이지 풀프레임 캔버스로 렌더링한다.

## State

```ts
// types.ts 추가
export type ParticleType =
  | 'snow' | 'sparkle' | 'firefly' | 'stars'
  | 'petals' | 'dust' | 'smoke' | 'bubbles'
  | 'rain' | 'sparks'

export interface ParticleOverlay {
  enabled: boolean
  type: ParticleType
  intensity: number   // 밀도 0–100
  speed: number       // 속도 0–100
  size: number        // 크기 0–100
  opacity: number     // 불투명도 0–100
  color: string       // hex or 'rainbow'
}
```

기본값: `{ enabled: false, type: 'snow', intensity: 50, speed: 50, size: 50, opacity: 70, color: 'rainbow' }`

## Architecture

### 변경 파일

1. **`src/types.ts`** — `ParticleType`, `ParticleOverlay` 추가. `ProjectSnapshot`에 `particleOverlay` 필드 추가.
2. **`src/App.tsx`** — `particleOverlay` state 추가, Step2 props 전달, `projectStorage` 스냅샷 직렬화 포함.
3. **`src/components/steps/Step2/Step2.tsx`**
   - Props: `particleOverlay`, `setParticleOverlay` 추가
   - 왼쪽 패널: 비주얼라이저 슬라이더 아래 `<hr>` + 파티클 섹션 UI
   - 스테이지: 새 `particleOverlayCanvasRef` 추가, 독립 `useEffect`로 Canvas 2D 렌더
4. **`src/lib/renderer/frameRenderer.ts`** — 프레임 렌더링 시 파티클 오버레이 합성

### UI 섹션 (왼쪽 패널)

```
[파티클]  ●● ON/OFF 토글
--- (토글 ON일 때만 표시) ---
2열 그리드: 눈송이 / 반짝임 / 반딧불 / 별 / 꽃잎 / 빛먼지 / 연기 / 버블 / 빗방울 / 불꽃
슬라이더: 밀도 / 속도 / 크기 / 불투명도
색상 스와치: rainbow + VIS_COLORS 공유
```

### Canvas 렌더링

- `particleOverlayCanvasRef` — 풀프레임 canvas (`position: absolute, inset: 0`)
- 파티클 별도 `useRef` 배열로 상태 유지 (ref이므로 리렌더 없이 업데이트)
- `useEffect` 의존성: `[particleOverlay.enabled, particleOverlay.type]` — type 변경 시 파티클 배열 재초기화
- 매 프레임 RAF 루프: 파티클 물리 업데이트 → canvas draw

### 파티클 물리 (타입별 간략 스펙)

| 타입 | 이동 방향 | 특이사항 |
|------|-----------|---------|
| snow | 아래 + 좌우 흔들림 | 원형, 흰색 기본 |
| sparkle | 제자리 반짝 | 별 모양, opacity sine wave |
| firefly | 랜덤 방향 천천히 | 글로우, 느림 |
| stars | 거의 정지 | 깜빡임만 |
| petals | 아래 + 회전 | 타원형, 분홍 기본 |
| dust | 위로 천천히 | 작은 원, 고밀도 |
| smoke | 위로 퍼짐 | 크고 투명한 원 |
| bubbles | 위로 + 좌우 | 원형 외곽선 |
| rain | 아래 빠르게 + 우측 기울기 | 가늘고 긴 선분 |
| sparks | 위로 발산 후 중력 | 짧은 선분 |

### Export 합성

**v1 스코프 제외**: frameRenderer는 시간 기반 프레임 단위 렌더로 RAF 루프가 없어 파티클 물리 시뮬레이션 통합이 복잡합니다. v1에서는 스테이지 프리뷰만 지원하고 export에는 미합성합니다.

## Success Criteria

- [ ] 파티클 섹션 ON/OFF 토글 정상 동작
- [ ] 10종 타입 전환 시 각각 올바른 모션 렌더
- [ ] 슬라이더(밀도·속도·크기·불투명도) 즉각 반영
- [ ] 비주얼라이저와 동시 활성화 시 레이어 겹침 정상
- [ ] 프로젝트 저장/불러오기 시 파티클 상태 복원
- [ ] 기존 테스트 통과
- [ ] (v2) 내보내기 렌더에 파티클 오버레이 합성
