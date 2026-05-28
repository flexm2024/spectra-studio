# Project Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모달 기반 프로젝트 관리 기능 추가 — 이름 편집, 다중 프로젝트 저장/불러오기/삭제, localStorage 자동저장, .spectra 파일 내보내기/불러오기

**Architecture:**
`projectStorage.ts`는 React 의존성 없는 순수 함수 모듈로 localStorage CRUD와 파일 직렬화를 담당한다. `ProjectModal.tsx`는 독립 컴포넌트로 prop 인터페이스로만 App과 통신한다. App.tsx는 프로젝트 상태(id, name, lastSaved)를 보유하고 1초 디바운스 자동저장 effect를 관리한다.

**Tech Stack:** React 18, TypeScript, localStorage API, FileReader API, URL.createObjectURL

---

## File Map

| 작업 | 파일 |
|------|------|
| Create | `src/types.ts` — TrackMeta, ProjectSnapshot, SavedProject 타입 추가 |
| Create | `src/lib/projectStorage.ts` — localStorage CRUD + 파일 직렬화 |
| Create | `src/lib/projectStorage.test.ts` — 위 테스트 |
| Create | `src/components/ProjectModal/ProjectModal.tsx` — 모달 UI |
| Create | `src/components/ProjectModal/ProjectModal.css` — 모달 스타일 |
| Create | `src/components/ProjectModal/ProjectModal.test.tsx` — 모달 테스트 |
| Modify | `src/App.tsx` — 프로젝트 상태, 자동저장, 핸들러, 모달 연결 |
| Modify | `src/components/Sidebar/Sidebar.tsx` — 클릭 핸들러 + 새 props |
| Modify | `src/components/Sidebar/Sidebar.css` — hover 스타일 |
| Modify | `src/components/Sidebar/Sidebar.test.tsx` — 새 props 반영 |

---

### Task 1: 타입 정의

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: types.ts에 타입 추가**

`src/types.ts` 파일 끝에 추가:

```typescript
export interface TrackMeta {
  id: string
  title: string
  artist: string
  duration: string
  durationSec: number
  tag: string
  bpm: number
  waveform: number[]
}

export interface ProjectSnapshot {
  theme: string
  effects: Effects
  visualizer: Visualizer
  typography: Typography
  exportSettings: ExportSettings
  loops: 1 | 2 | 3
  quality: '96k' | '128k' | '192k'
  background: Background
  logoPosition: LogoPosition
  logoSize: number
  tracks: TrackMeta[]
}

export interface SavedProject {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  snapshot: ProjectSnapshot
}
```

- [ ] **Step 2: 타입 체크**

```
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/types.ts
git commit -m "feat: ProjectSnapshot, SavedProject 타입 추가"
```

---

### Task 2: projectStorage — localStorage CRUD

**Files:**
- Create: `src/lib/projectStorage.ts`
- Create: `src/lib/projectStorage.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/projectStorage.test.ts` 생성:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveProject, listProjects, getProject, deleteProject,
  getCurrentId, setCurrentId,
} from './projectStorage'
import type { SavedProject } from '../types'

const sample: SavedProject = {
  id: 'test-1',
  name: '테스트 프로젝트',
  createdAt: 1000,
  updatedAt: 2000,
  snapshot: {
    theme: 'midnight',
    effects: { vis: true, crossfade: false, ducking: true, blur: true },
    visualizer: { type: 'bars', intensity: 70, opacity: 85, y: 75, size: 50, width: 100, color: 'rainbow' },
    typography: { titleSize: 20, letterSpacing: -15, titlePosition: { x: 50, y: 48 }, subPosition: { x: 50, y: 55 }, showTitle: true, showSub: true, subSize: 18, subLetterSpacing: 0 },
    exportSettings: { filename: 'test', resolution: '1080p' },
    loops: 1,
    quality: '192k',
    background: { type: 'gradient' },
    logoPosition: { x: 8, y: 8 },
    logoSize: 52,
    tracks: [],
  },
}

beforeEach(() => localStorage.clear())

describe('projectStorage CRUD', () => {
  it('저장 후 목록에 나타난다', () => {
    saveProject(sample)
    expect(listProjects()).toHaveLength(1)
    expect(listProjects()[0].name).toBe('테스트 프로젝트')
  })

  it('ID로 프로젝트를 가져온다', () => {
    saveProject(sample)
    expect(getProject('test-1')?.id).toBe('test-1')
  })

  it('없는 ID는 null 반환', () => {
    expect(getProject('missing')).toBeNull()
  })

  it('같은 ID 재저장 시 업데이트된다', () => {
    saveProject(sample)
    saveProject({ ...sample, name: '수정된 이름' })
    expect(listProjects()).toHaveLength(1)
    expect(listProjects()[0].name).toBe('수정된 이름')
  })

  it('삭제 후 목록에서 사라진다', () => {
    saveProject(sample)
    deleteProject('test-1')
    expect(listProjects()).toHaveLength(0)
  })

  it('currentId 저장/조회', () => {
    setCurrentId('abc')
    expect(getCurrentId()).toBe('abc')
  })

  it('localStorage 손상 시 빈 배열 반환', () => {
    localStorage.setItem('spectra_projects', 'invalid json')
    expect(listProjects()).toEqual([])
  })
})
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```
npm test -- --run src/lib/projectStorage.test.ts
```

Expected: FAIL (모듈 없음)

- [ ] **Step 3: projectStorage.ts 구현**

`src/lib/projectStorage.ts` 생성:

```typescript
// localStorage 기반 프로젝트 저장소 및 파일 직렬화
import type { SavedProject } from '../types'

const PROJECTS_KEY = 'spectra_projects'
const CURRENT_KEY = 'spectra_current_id'

export function listProjects(): SavedProject[] {
  try {
    return JSON.parse(localStorage.getItem(PROJECTS_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function getProject(id: string): SavedProject | null {
  return listProjects().find(p => p.id === id) ?? null
}

export function saveProject(project: SavedProject): void {
  const list = listProjects().filter(p => p.id !== project.id)
  localStorage.setItem(PROJECTS_KEY, JSON.stringify([...list, project]))
}

export function deleteProject(id: string): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(listProjects().filter(p => p.id !== id)))
}

export function getCurrentId(): string | null {
  return localStorage.getItem(CURRENT_KEY)
}

export function setCurrentId(id: string): void {
  localStorage.setItem(CURRENT_KEY, id)
}
```

- [ ] **Step 4: 테스트 실행 — PASS 확인**

```
npm test -- --run src/lib/projectStorage.test.ts
```

Expected: 7 passed

- [ ] **Step 5: 커밋**

```bash
git add src/lib/projectStorage.ts src/lib/projectStorage.test.ts
git commit -m "feat: projectStorage localStorage CRUD"
```

---

### Task 3: projectStorage — 파일 내보내기/불러오기

**Files:**
- Modify: `src/lib/projectStorage.ts`
- Modify: `src/lib/projectStorage.test.ts`

- [ ] **Step 1: 실패 테스트 추가**

`src/lib/projectStorage.test.ts` 끝에 추가:

```typescript
import { exportSpectraFile, parseSpectraFile } from './projectStorage'

describe('file export/import', () => {
  it('exportSpectraFile은 JSON Blob을 반환한다', async () => {
    const blob = exportSpectraFile(sample, [])
    expect(blob.type).toBe('application/json')
    const data = JSON.parse(await blob.text())
    expect(data.version).toBe(1)
    expect(data.project.id).toBe('test-1')
    expect(Array.isArray(data.audioTracks)).toBe(true)
  })

  it('parseSpectraFile은 project와 audioUrls Map을 반환한다', async () => {
    const blob = exportSpectraFile(sample, [{ id: 't1', audioBase64: 'data:audio/mpeg;base64,AA==' }])
    const file = new File([blob], 'test.spectra', { type: 'application/json' })
    const result = await parseSpectraFile(file)
    expect(result.project.id).toBe('test-1')
    expect(result.audioUrls).toBeInstanceOf(Map)
    expect(result.audioUrls.get('t1')).toBe('data:audio/mpeg;base64,AA==')
  })

  it('audioTracks 없을 때 빈 Map 반환', async () => {
    const blob = exportSpectraFile(sample, [])
    const file = new File([blob], 'test.spectra', { type: 'application/json' })
    const result = await parseSpectraFile(file)
    expect(result.audioUrls.size).toBe(0)
  })
})
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```
npm test -- --run src/lib/projectStorage.test.ts
```

Expected: FAIL (exportSpectraFile not exported)

- [ ] **Step 3: 파일 직렬화 함수 추가**

`src/lib/projectStorage.ts` 끝에 추가:

```typescript
interface SpectraFileFormat {
  version: 1
  project: SavedProject
  audioTracks: { id: string; audioBase64: string }[]
  logoBase64?: string
  watermarkBase64?: string
  backgroundBase64?: string
}

export function exportSpectraFile(
  project: SavedProject,
  audioTracks: { id: string; audioBase64: string }[],
  logoBase64?: string,
  watermarkBase64?: string,
  backgroundBase64?: string,
): Blob {
  const payload: SpectraFileFormat = {
    version: 1,
    project,
    audioTracks,
    logoBase64,
    watermarkBase64,
    backgroundBase64,
  }
  return new Blob([JSON.stringify(payload)], { type: 'application/json' })
}

export async function parseSpectraFile(file: File): Promise<{
  project: SavedProject
  audioUrls: Map<string, string>
  logoBase64?: string
  watermarkBase64?: string
  backgroundBase64?: string
}> {
  const data: SpectraFileFormat = JSON.parse(await file.text())
  const audioUrls = new Map<string, string>()
  for (const { id, audioBase64 } of data.audioTracks) {
    audioUrls.set(id, audioBase64)
  }
  return {
    project: data.project,
    audioUrls,
    logoBase64: data.logoBase64,
    watermarkBase64: data.watermarkBase64,
    backgroundBase64: data.backgroundBase64,
  }
}
```

- [ ] **Step 4: 테스트 실행 — PASS 확인**

```
npm test -- --run src/lib/projectStorage.test.ts
```

Expected: 10 passed

- [ ] **Step 5: 커밋**

```bash
git add src/lib/projectStorage.ts src/lib/projectStorage.test.ts
git commit -m "feat: projectStorage 파일 내보내기/불러오기"
```

---

### Task 4: App.tsx — 프로젝트 상태 + 자동저장 + 핸들러

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: import 추가**

`src/App.tsx` 상단 import 목록에 추가:

```typescript
import { saveProject, getProject, getCurrentId, setCurrentId, exportSpectraFile, parseSpectraFile } from './lib/projectStorage'
import type { ProjectSnapshot, SavedProject } from './types'
```

- [ ] **Step 2: 초기화 헬퍼 추가**

App 컴포넌트 바깥(파일 최상단, import 아래)에 추가:

```typescript
function loadInitialProject(): { id: string; name: string; snapshot: ProjectSnapshot | null } {
  try {
    const currentId = getCurrentId()
    if (currentId) {
      const project = getProject(currentId)
      if (project) return { id: project.id, name: project.name, snapshot: project.snapshot }
    }
  } catch { /* localStorage 접근 불가 환경 */ }
  return { id: crypto.randomUUID(), name: '새 프로젝트', snapshot: null }
}

async function blobUrlToBase64(url: string): Promise<string> {
  const resp = await fetch(url)
  const blob = await resp.blob()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
```

- [ ] **Step 3: 프로젝트 state 추가**

App 컴포넌트 내 `const [step, ...]` 앞에 추가:

```typescript
const _initRef = useRef<ReturnType<typeof loadInitialProject> | null>(null)
if (_initRef.current === null) _initRef.current = loadInitialProject()
const _init = _initRef.current

const [projectId, setProjectId] = useState(_init.id)
const [projectName, setProjectName] = useState(_init.name)
const [lastSaved, setLastSaved] = useState<number | null>(null)
const [projectModalOpen, setProjectModalOpen] = useState(false)
```

- [ ] **Step 4: 기존 useState를 초기값 복원으로 교체**

App.tsx의 기존 state 선언들을 아래로 교체 (`_init.snapshot`이 있으면 복원, 없으면 기본값):

```typescript
const [theme, setTheme] = useState(_init.snapshot?.theme ?? 'midnight')
const [effects, setEffects] = useState<Effects>(_init.snapshot?.effects ?? { vis: true, crossfade: false, ducking: true, blur: true })
const [visualizer, setVisualizer] = useState<Visualizer>(_init.snapshot?.visualizer ?? { type: 'bars', intensity: 70, opacity: 85, y: 75, size: 50, width: 100, color: 'rainbow' })
const [typography, setTypography] = useState<Typography>(_init.snapshot?.typography ?? { titleSize: 20, letterSpacing: -15, titlePosition: { x: 50, y: 48 }, subPosition: { x: 50, y: 55 }, showTitle: true, showSub: true, subSize: 18, subLetterSpacing: 0 })
const [exportSettings, setExportSettings] = useState<ExportSettings>(_init.snapshot?.exportSettings ?? { filename: 'my-playlist', resolution: '1080p' })
const [background, setBackground] = useState<Background>(_init.snapshot?.background ?? { type: 'gradient' })
const [loops, setLoops] = useState<1 | 2 | 3>(_init.snapshot?.loops ?? 1)
const [quality, setQuality] = useState<'96k' | '128k' | '192k'>(_init.snapshot?.quality ?? '192k')
const [logoPosition, setLogoPosition] = useState<LogoPosition>(_init.snapshot?.logoPosition ?? { x: 8, y: 8 })
const [logoSize, setLogoSize] = useState(_init.snapshot?.logoSize ?? 52)
const [tracks, setTracks] = useState<Track[]>(
  _init.snapshot?.tracks.map(t => ({ ...t, src: '', audioUrl: undefined })) ?? []
)
```

나머지 기존 state(`logo`, `watermark`, `stickers`, `audioCurrentTime`, `pendingExport`)는 변경 없이 유지.

- [ ] **Step 5: 자동저장 effect 추가**

`const [pendingExport, ...]` 아래에 추가:

```typescript
const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

useEffect(() => {
  if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
  saveTimerRef.current = setTimeout(() => {
    const snapshot: ProjectSnapshot = {
      theme, effects, visualizer, typography, exportSettings, loops, quality, background,
      logoPosition, logoSize,
      tracks: tracks.map(({ id, title, artist, duration, durationSec, tag, bpm, waveform }) =>
        ({ id, title, artist, duration, durationSec, tag, bpm, waveform })
      ),
    }
    const now = Date.now()
    const existing = getProject(projectId)
    const project: SavedProject = {
      id: projectId,
      name: projectName,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      snapshot,
    }
    saveProject(project)
    setCurrentId(projectId)
    setLastSaved(now)
  }, 1000)
  return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
}, [theme, effects, visualizer, typography, exportSettings, loops, quality, background, logoPosition, logoSize, tracks, projectId, projectName])
```

- [ ] **Step 6: handleLoadProject 추가**

`handleSave` 함수 아래에 추가:

```typescript
function handleLoadProject(id: string) {
  const project = getProject(id)
  if (!project) return
  const { snapshot } = project
  onPause()
  setProjectId(project.id)
  setProjectName(project.name)
  setTheme(snapshot.theme)
  setEffects(snapshot.effects)
  setVisualizer(snapshot.visualizer)
  setTypography(snapshot.typography)
  setExportSettings(snapshot.exportSettings)
  setLoops(snapshot.loops)
  setQuality(snapshot.quality)
  setBackground(snapshot.background)
  setLogoPosition(snapshot.logoPosition)
  setLogoSize(snapshot.logoSize)
  setTracks(snapshot.tracks.map(t => ({ ...t, src: '', audioUrl: undefined })))
  setLogo(undefined)
  setWatermark(undefined)
  setStickers([])
  setCurrentId(id)
  setLastSaved(project.updatedAt)
  setProjectModalOpen(false)
  setStep(1)
}
```

- [ ] **Step 7: handleNewProject 추가**

`handleLoadProject` 아래에 추가:

```typescript
function handleNewProject() {
  const newId = crypto.randomUUID()
  onPause()
  setProjectId(newId)
  setProjectName('새 프로젝트')
  setTheme('midnight')
  setEffects({ vis: true, crossfade: false, ducking: true, blur: true })
  setVisualizer({ type: 'bars', intensity: 70, opacity: 85, y: 75, size: 50, width: 100, color: 'rainbow' })
  setTypography({ titleSize: 20, letterSpacing: -15, titlePosition: { x: 50, y: 48 }, subPosition: { x: 50, y: 55 }, showTitle: true, showSub: true, subSize: 18, subLetterSpacing: 0 })
  setExportSettings({ filename: 'my-playlist', resolution: '1080p' })
  setLoops(1)
  setQuality('192k')
  setBackground({ type: 'gradient' })
  setLogoPosition({ x: 8, y: 8 })
  setLogoSize(52)
  setTracks([])
  setLogo(undefined)
  setWatermark(undefined)
  setStickers([])
  setCurrentId(newId)
  setLastSaved(null)
  setProjectModalOpen(false)
  setStep(1)
}
```

- [ ] **Step 8: handleExportFile 추가**

```typescript
async function handleExportFile() {
  const existing = getProject(projectId)
  if (!existing) return
  const audioTracks: { id: string; audioBase64: string }[] = []
  for (const track of tracks) {
    if (track.audioUrl) {
      audioTracks.push({ id: track.id, audioBase64: await blobUrlToBase64(track.audioUrl) })
    }
  }
  const [logoBase64, watermarkBase64, backgroundBase64] = await Promise.all([
    logo ? blobUrlToBase64(logo) : Promise.resolve(undefined),
    watermark ? blobUrlToBase64(watermark) : Promise.resolve(undefined),
    background.src ? blobUrlToBase64(background.src) : Promise.resolve(undefined),
  ])
  const blob = exportSpectraFile(existing, audioTracks, logoBase64, watermarkBase64, backgroundBase64)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectName}.spectra`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
```

- [ ] **Step 9: handleImportFile 추가**

```typescript
async function handleImportFile(file: File) {
  try {
    const { project, audioUrls, logoBase64, watermarkBase64, backgroundBase64 } = await parseSpectraFile(file)
    const { snapshot } = project

    function base64ToBlobUrl(b64: string): string {
      const arr = b64.split(',')
      const mime = arr[0].match(/:(.*?);/)?.[1] ?? 'application/octet-stream'
      const bstr = atob(arr[1])
      const ab = new ArrayBuffer(bstr.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < bstr.length; i++) ia[i] = bstr.charCodeAt(i)
      return URL.createObjectURL(new Blob([ab], { type: mime }))
    }

    onPause()
    setProjectId(project.id)
    setProjectName(project.name)
    setTheme(snapshot.theme)
    setEffects(snapshot.effects)
    setVisualizer(snapshot.visualizer)
    setTypography(snapshot.typography)
    setExportSettings(snapshot.exportSettings)
    setLoops(snapshot.loops)
    setQuality(snapshot.quality)
    setBackground({
      ...snapshot.background,
      src: backgroundBase64 ? base64ToBlobUrl(backgroundBase64) : undefined,
    })
    setLogoPosition(snapshot.logoPosition)
    setLogoSize(snapshot.logoSize)
    setTracks(snapshot.tracks.map(t => ({
      ...t, src: '',
      audioUrl: audioUrls.has(t.id) ? base64ToBlobUrl(audioUrls.get(t.id)!) : undefined,
    })))
    setLogo(logoBase64 ? base64ToBlobUrl(logoBase64) : undefined)
    setWatermark(watermarkBase64 ? base64ToBlobUrl(watermarkBase64) : undefined)
    setStickers([])
    setCurrentId(project.id)
    setLastSaved(project.updatedAt)
    setProjectModalOpen(false)
    setStep(1)
  } catch (err) {
    console.error('파일 불러오기 실패:', err)
  }
}
```

- [ ] **Step 10: 타입 체크**

```
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 11: 커밋**

```bash
git add src/App.tsx
git commit -m "feat: App에 프로젝트 state, 자동저장, load/new/export/import 핸들러 추가"
```

---

### Task 5: Sidebar — 클릭 핸들러 + 새 props

**Files:**
- Modify: `src/components/Sidebar/Sidebar.tsx`
- Modify: `src/components/Sidebar/Sidebar.css`
- Modify: `src/components/Sidebar/Sidebar.test.tsx`

- [ ] **Step 1: Sidebar.tsx 인터페이스 및 컴포넌트 수정**

`src/components/Sidebar/Sidebar.tsx` 전체 교체:

```typescript
// 좌측 사이드바 — 브랜드, 프로젝트 카드, 워크플로우, 빠른 액션, 유저 카드
import './Sidebar.css'
import { useEffect, useState } from 'react'
import Icon from '../../icons'
import type { Track } from '../../types'

interface SidebarProps {
  step: 1 | 2 | 3
  setStep: (n: 1 | 2 | 3) => void
  tracks: Track[]
  projectName: string
  lastSaved: number | null
  onOpenProjectModal: () => void
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

function formatTimeSince(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 10) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

export default function Sidebar({ step, setStep, tracks, projectName, lastSaved, onOpenProjectModal }: SidebarProps) {
  const [timeSince, setTimeSince] = useState('')

  useEffect(() => {
    if (!lastSaved) { setTimeSince(''); return }
    setTimeSince(formatTimeSince(lastSaved))
    const id = setInterval(() => setTimeSince(formatTimeSince(lastSaved)), 30_000)
    return () => clearInterval(id)
  }, [lastSaved])

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

      <div className="rail__project" role="button" tabIndex={0} onClick={onOpenProjectModal}
        onKeyDown={e => e.key === 'Enter' && onOpenProjectModal()}>
        <div className="rail__project-label">
          <span>현재 프로젝트</span>
          <Icon name="chevronDown" size={11} />
        </div>
        <div className="rail__project-name">{projectName}</div>
        <div className="rail__project-meta">
          <div className="rail__project-dot" />
          <span>{lastSaved ? `자동 저장 · ${timeSince}` : '저장 안 됨'}</span>
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
              type="button"
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
        <button type="button" className="rail__util-row">
          <Icon name="help" size={15} /><span className="util-label">사용자 가이드</span>
        </button>
        <button type="button" className="rail__util-row">
          <Icon name="keyboard" size={15} /><span className="util-label">키보드 단축키</span>
          <span className="kbd">?</span>
        </button>
        <button type="button" className="rail__util-row">
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

- [ ] **Step 2: Sidebar.css에 hover 스타일 추가**

`src/components/Sidebar/Sidebar.css`에서 `.rail__project` 관련 기존 스타일 뒤에 추가:

```css
.rail__project { border-radius: var(--r-m); cursor: pointer; transition: background 120ms; }
.rail__project:hover { background: rgba(0,0,0,0.04); }
```

- [ ] **Step 3: App.tsx에서 Sidebar에 새 props 전달**

`src/App.tsx`의 `<Sidebar>` 호출 수정:

```tsx
<Sidebar
  step={step}
  setStep={goToStep}
  tracks={tracks}
  projectName={projectName}
  lastSaved={lastSaved}
  onOpenProjectModal={() => setProjectModalOpen(true)}
/>
```

- [ ] **Step 4: Sidebar.test.tsx 수정**

`src/components/Sidebar/Sidebar.test.tsx`에서 컴포넌트 렌더 시 새 props 추가. 기존 render 호출을 찾아서:

```tsx
// 기존 render(<Sidebar step={...} setStep={...} tracks={...} />) 형태를 아래로 교체
render(
  <Sidebar
    step={1}
    setStep={vi.fn()}
    tracks={[]}
    projectName="테스트 프로젝트"
    lastSaved={null}
    onOpenProjectModal={vi.fn()}
  />
)
```

(여러 테스트에 render 호출이 있다면 모두 동일하게 수정)

- [ ] **Step 5: 테스트 실행**

```
npm test -- --run
```

Expected: 107+ passed

- [ ] **Step 6: 커밋**

```bash
git add src/components/Sidebar/ src/App.tsx
git commit -m "feat: 사이드바 프로젝트 섹션 클릭으로 모달 오픈"
```

---

### Task 6: ProjectModal 컴포넌트

**Files:**
- Create: `src/components/ProjectModal/ProjectModal.tsx`
- Create: `src/components/ProjectModal/ProjectModal.css`
- Create: `src/components/ProjectModal/ProjectModal.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`src/components/ProjectModal/ProjectModal.test.tsx` 생성:

```typescript
// 프로젝트 관리 모달 테스트
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, it, expect, beforeEach, describe } from 'vitest'
import ProjectModal from './ProjectModal'
import { saveProject } from '../../lib/projectStorage'
import type { SavedProject } from '../../types'

const defaultProps = {
  open: true,
  projectId: 'current-id',
  projectName: '현재 프로젝트',
  onClose: vi.fn(),
  onChangeName: vi.fn(),
  onLoadProject: vi.fn(),
  onNewProject: vi.fn(),
  onExportFile: vi.fn(),
  onImportFile: vi.fn(),
}

const otherProject: SavedProject = {
  id: 'other-id',
  name: '다른 프로젝트',
  createdAt: 1000,
  updatedAt: 2000,
  snapshot: {} as any,
}

beforeEach(() => { localStorage.clear(); vi.clearAllMocks() })

describe('ProjectModal', () => {
  it('open=true일 때 렌더링된다', () => {
    render(<ProjectModal {...defaultProps} />)
    expect(screen.getByText('프로젝트 관리')).toBeInTheDocument()
  })

  it('open=false일 때 렌더링되지 않는다', () => {
    render(<ProjectModal {...defaultProps} open={false} />)
    expect(screen.queryByText('프로젝트 관리')).not.toBeInTheDocument()
  })

  it('이름 입력 시 onChangeName 호출', () => {
    render(<ProjectModal {...defaultProps} />)
    fireEvent.change(screen.getByDisplayValue('현재 프로젝트'), { target: { value: '새 이름' } })
    expect(defaultProps.onChangeName).toHaveBeenCalledWith('새 이름')
  })

  it('저장된 다른 프로젝트가 목록에 보인다', () => {
    saveProject(otherProject)
    render(<ProjectModal {...defaultProps} />)
    expect(screen.getByText('다른 프로젝트')).toBeInTheDocument()
  })

  it('새 프로젝트 버튼 → onNewProject 호출', () => {
    render(<ProjectModal {...defaultProps} />)
    fireEvent.click(screen.getByText('+ 새 프로젝트'))
    expect(defaultProps.onNewProject).toHaveBeenCalled()
  })

  it('닫기 버튼 → onClose 호출', () => {
    render(<ProjectModal {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('현재 프로젝트에는 열기/삭제 버튼이 없고 현재 뱃지가 있다', () => {
    saveProject({ ...otherProject, id: 'current-id', name: '현재 프로젝트' })
    render(<ProjectModal {...defaultProps} />)
    expect(screen.getByText('현재')).toBeInTheDocument()
  })

  it('다른 프로젝트 열기 버튼 → onLoadProject 호출', () => {
    saveProject(otherProject)
    render(<ProjectModal {...defaultProps} />)
    fireEvent.click(screen.getByText('열기'))
    expect(defaultProps.onLoadProject).toHaveBeenCalledWith('other-id')
  })
})
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```
npm test -- --run src/components/ProjectModal/ProjectModal.test.tsx
```

Expected: FAIL (모듈 없음)

- [ ] **Step 3: ProjectModal.tsx 생성**

`src/components/ProjectModal/ProjectModal.tsx` 생성:

```tsx
// 프로젝트 관리 모달 — 이름 편집, 목록, 새 프로젝트, 파일 내보내기/불러오기
import { useEffect, useState } from 'react'
import './ProjectModal.css'
import { listProjects, deleteProject } from '../../lib/projectStorage'
import type { SavedProject } from '../../types'

interface Props {
  open: boolean
  projectId: string
  projectName: string
  onClose: () => void
  onChangeName: (name: string) => void
  onLoadProject: (id: string) => void
  onNewProject: () => void
  onExportFile: () => void
  onImportFile: (file: File) => void
}

export default function ProjectModal({
  open, projectId, projectName,
  onClose, onChangeName, onLoadProject, onNewProject, onExportFile, onImportFile,
}: Props) {
  const [projects, setProjects] = useState<SavedProject[]>([])

  useEffect(() => {
    if (open) setProjects(listProjects())
  }, [open])

  if (!open) return null

  function handleDelete(id: string) {
    deleteProject(id)
    setProjects(listProjects())
  }

  function handleImportClick() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.spectra,.json'
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) onImportFile(file)
    }
    input.click()
  }

  return (
    <div className="pm-backdrop" onClick={onClose}>
      <div className="pm-modal" onClick={e => e.stopPropagation()}>
        <div className="pm-header">
          <span className="pm-title">프로젝트 관리</span>
          <button type="button" className="pm-close" aria-label="닫기" onClick={onClose}>✕</button>
        </div>

        <div className="pm-section">
          <div className="pm-label">프로젝트 이름</div>
          <input
            className="pm-input"
            value={projectName}
            onChange={e => onChangeName(e.target.value)}
          />
        </div>

        <div className="pm-section">
          <div className="pm-label">저장된 프로젝트 ({projects.length})</div>
          {projects.length === 0 && <div className="pm-empty">저장된 프로젝트 없음</div>}
          <div className="pm-list">
            {projects.map(p => (
              <div key={p.id} className={`pm-item${p.id === projectId ? ' pm-item--current' : ''}`}>
                <span className="pm-item__name">{p.name}</span>
                <div className="pm-item__actions">
                  {p.id === projectId
                    ? <span className="pm-item__current-badge">현재</span>
                    : (
                      <>
                        <button type="button" className="pm-btn-sm" onClick={() => onLoadProject(p.id)}>열기</button>
                        <button type="button" className="pm-btn-sm pm-btn-sm--danger" onClick={() => handleDelete(p.id)}>삭제</button>
                      </>
                    )
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pm-section">
          <button type="button" className="pm-btn-full" onClick={onNewProject}>+ 새 프로젝트</button>
        </div>

        <div className="pm-divider" />

        <div className="pm-section">
          <button type="button" className="pm-btn-outline" onClick={onExportFile}>↓ 내보내기 (.spectra)</button>
          <button type="button" className="pm-btn-outline" onClick={handleImportClick}>↑ 불러오기 (.spectra…)</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: ProjectModal.css 생성**

`src/components/ProjectModal/ProjectModal.css` 생성:

```css
/* 프로젝트 관리 모달 */
.pm-backdrop {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0, 0, 0, 0.45);
  display: flex; align-items: center; justify-content: center;
}
.pm-modal {
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: var(--r-l);
  box-shadow: var(--shadow-pop);
  width: 400px;
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 80px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.pm-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--line-faint);
  flex-shrink: 0;
}
.pm-title { font-size: 15px; font-weight: 700; color: var(--ink); }
.pm-close {
  background: none; border: none; padding: 4px 8px;
  font-size: 16px; color: var(--ink-3); cursor: pointer;
  border-radius: var(--r-s); transition: background 120ms; line-height: 1;
}
.pm-close:hover { background: var(--bg-sunken); color: var(--ink); }

.pm-section {
  padding: 14px 18px;
  border-bottom: 1px solid var(--line-faint);
  display: flex; flex-direction: column; gap: 8px;
}
.pm-section:last-child { border-bottom: none; }

.pm-label {
  font-size: 11px; font-weight: 600; color: var(--ink-3);
  letter-spacing: 0.05em; text-transform: uppercase;
}
.pm-input {
  width: 100%; padding: 8px 10px;
  background: var(--bg-sunken); border: 1px solid var(--line);
  border-radius: var(--r-s); font-size: 13.5px; color: var(--ink);
  font-family: var(--f-sans); outline: none; box-sizing: border-box;
}
.pm-input:focus { border-color: var(--c); box-shadow: 0 0 0 2px var(--c-softer); }

.pm-empty { font-size: 12px; color: var(--ink-4); text-align: center; padding: 8px 0; }

.pm-list { display: flex; flex-direction: column; gap: 4px; max-height: 240px; overflow-y: auto; }
.pm-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 10px; border-radius: var(--r-m);
  border: 1px solid var(--line-faint); background: var(--bg); gap: 8px;
}
.pm-item--current { background: var(--c-softer); border-color: var(--c-soft); }
.pm-item__name {
  font-size: 13px; color: var(--ink); font-weight: 500;
  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
}
.pm-item__actions { display: flex; gap: 4px; flex-shrink: 0; align-items: center; }
.pm-item__current-badge {
  font-size: 11px; color: var(--c); font-weight: 600;
  padding: 2px 6px; background: var(--c-soft); border-radius: 4px;
}

.pm-btn-sm {
  font-size: 11.5px; padding: 3px 10px;
  background: var(--bg-sunken); border: 1px solid var(--line);
  border-radius: var(--r-s); cursor: pointer; color: var(--ink-2);
  transition: background 120ms;
}
.pm-btn-sm:hover { background: var(--bg-elev); color: var(--ink); }
.pm-btn-sm--danger { color: var(--danger); }
.pm-btn-sm--danger:hover { background: rgba(220,38,38,0.08); border-color: rgba(220,38,38,0.3); }

.pm-btn-full {
  width: 100%; padding: 9px; font-size: 13px; font-weight: 600;
  background: var(--c); color: white; border: none;
  border-radius: var(--r-m); cursor: pointer; transition: opacity 120ms;
}
.pm-btn-full:hover { opacity: 0.88; }

.pm-btn-outline {
  width: 100%; padding: 8px; font-size: 12.5px;
  background: transparent; color: var(--ink-2);
  border: 1px solid var(--line); border-radius: var(--r-m);
  cursor: pointer; transition: background 120ms; text-align: center;
}
.pm-btn-outline:hover { background: var(--bg-sunken); color: var(--ink); }

.pm-divider { height: 1px; background: var(--line-faint); }
```

- [ ] **Step 5: 테스트 실행 — PASS 확인**

```
npm test -- --run src/components/ProjectModal/ProjectModal.test.tsx
```

Expected: 8 passed

- [ ] **Step 6: 커밋**

```bash
git add src/components/ProjectModal/
git commit -m "feat: ProjectModal 컴포넌트"
```

---

### Task 7: App.tsx — ProjectModal 연결 + 전체 테스트

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: ProjectModal import 추가**

`src/App.tsx` 상단에 추가:

```typescript
import ProjectModal from './components/ProjectModal/ProjectModal'
```

- [ ] **Step 2: ProjectModal 렌더링 추가**

`src/App.tsx` return문의 `</div>` (최상위 div 닫기) 바로 앞에 추가:

```tsx
<ProjectModal
  open={projectModalOpen}
  projectId={projectId}
  projectName={projectName}
  onClose={() => setProjectModalOpen(false)}
  onChangeName={setProjectName}
  onLoadProject={handleLoadProject}
  onNewProject={handleNewProject}
  onExportFile={handleExportFile}
  onImportFile={handleImportFile}
/>
```

- [ ] **Step 3: 타입 체크**

```
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 4: 전체 테스트 실행**

```
npm test -- --run
```

Expected: 115+ passed (기존 107 + 새 8)

- [ ] **Step 5: 커밋**

```bash
git add src/App.tsx
git commit -m "feat: ProjectModal App에 연결"
```

---

### Task 8: 배포

- [ ] **Step 1: 전체 테스트 최종 확인**

```
npm test -- --run
```

Expected: all passed

- [ ] **Step 2: 빌드 확인**

```
npx tsc --noEmit && echo "OK"
```

Expected: OK

- [ ] **Step 3: Push**

```bash
git push origin master
```

---

## 구현 후 동작 확인 체크리스트

- [ ] 앱 첫 로드 시 "새 프로젝트" 이름과 기본 설정으로 시작
- [ ] 설정 변경 1초 후 localStorage에 자동저장, "자동 저장 · 방금 전" 표시
- [ ] 사이드바 "현재 프로젝트" 클릭 → 모달 열림
- [ ] 모달에서 이름 수정 → 사이드바 이름 즉시 반영
- [ ] 새 프로젝트 생성 → 초기화 후 Step 1으로 이동
- [ ] 다른 프로젝트 열기 → 해당 설정 복원 (트랙은 메타만, 오디오 없음)
- [ ] 프로젝트 삭제 → 목록에서 제거
- [ ] 내보내기 → .spectra 파일 다운로드
- [ ] 불러오기 → .spectra 파일에서 전체 상태 복원 (오디오 포함)
- [ ] 페이지 새로고침 후 마지막 프로젝트 상태 복원
