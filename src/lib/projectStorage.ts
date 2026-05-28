// localStorage 기반 프로젝트 저장소
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
