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
  // Use FileReader API which is compatible with both browser and jsdom test environment
  const text = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })

  const data: SpectraFileFormat = JSON.parse(text)
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
