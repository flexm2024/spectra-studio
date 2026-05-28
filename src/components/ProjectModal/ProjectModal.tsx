// 프로젝트 관리 모달 — 이름 편집, 목록, 새 프로젝트, 파일 내보내기/불러오기
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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

  return createPortal(
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
    </div>,
    document.body,
  )
}
