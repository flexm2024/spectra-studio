import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveProject, listProjects, getProject, deleteProject,
  getCurrentId, setCurrentId, exportSpectraFile, parseSpectraFile,
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
    typography: { titleSize: 20, letterSpacing: -15, titlePosition: { x: 50, y: 48 }, subPosition: { x: 50, y: 55 }, showTitle: true, showSub: true, subSize: 18, subLetterSpacing: 0, titleStyle: 'minimal' as const, titleDeco: 'none' as const, titleFont: 'inter', titlePositionPreset: 'bc' as const, titleCaptionTop: '', titleCaptionBottom: '', titleAlign: 'center' as const },
    exportSettings: { filename: 'test', resolution: '1080p' },
    loops: 1,
    quality: '192k',
    background: { type: 'gradient' },
    logoPosition: { x: 8, y: 8 },
    logoSize: 52,
    particleOverlay: {
      enabled: false,
      type: 'snow' as const,
      intensity: 50,
      speed: 50,
      size: 50,
      opacity: 70,
      color: 'rainbow',
    },
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

describe('file export/import', () => {
  it('exportSpectraFile은 JSON Blob을 반환한다', async () => {
    const blob = exportSpectraFile(sample, [])
    expect(blob.type).toBe('application/json')
    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsText(blob)
    })
    const data = JSON.parse(text)
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
