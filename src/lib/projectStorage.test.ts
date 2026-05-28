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
