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

  it('현재 프로젝트에는 현재 뱃지가 있다', () => {
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
