// Step 3 — 영상 출력: 설정 요약, 내보내기 패널, 렌더링 진행 UI
import { useState } from 'react'
import './Step3.css'
import Icon from '../../../icons'
import Button from '../../shared/Button'
import SegmentedControl from '../../shared/SegmentedControl'
import Switch from '../../shared/Switch'
import { waveformFor } from '../../../data/sampleTracks'
import type { Track, Effects, Visualizer, ExportSettings, Background, LogoPosition, Typography } from '../../../types'
import { renderVideo } from '../../../lib/renderer'

const THEMES = [
  { id: 'midnight', label: 'Midnight',  bg: 'linear-gradient(135deg, #0c1a2e, #050813)' },
  { id: 'cyanwave', label: 'Cyan Wave', bg: 'linear-gradient(135deg, #042f3f, #0a647a)' },
  { id: 'sunset',   label: 'Sunset',    bg: 'linear-gradient(135deg, #2a0f2e, #6d2c4a)' },
  { id: 'forest',   label: 'Forest',    bg: 'linear-gradient(135deg, #0c1e16, #1f3d2c)' },
  { id: 'cream',    label: 'Cream',     bg: 'linear-gradient(135deg, #f3ead8, #d9c7a3)' },
  { id: 'mono',     label: 'Mono',      bg: 'linear-gradient(135deg, #0a0a0a, #2a2a2a)' },
]

const RESOLUTION_MAP: Record<string, string> = {
  '720p': '1280 × 720',
  '1080p': '1920 × 1080',
  '4k': '3840 × 2160',
}

function logoPositionLabel(pos: LogoPosition): string {
  const x = pos.x < 40 ? '좌' : pos.x > 60 ? '우' : '중'
  const y = pos.y < 40 ? '상' : pos.y > 60 ? '하' : '중'
  return `${x}${y}단`
}

interface Step3Props {
  tracks: Track[]
  theme: string
  effects: Effects
  visualizer: Visualizer
  exportSettings: ExportSettings
  setExportSettings: (s: ExportSettings) => void
  loops: 1 | 2 | 3
  quality: '96k' | '128k' | '192k'
  onBack: () => void
  background: Background
  logo?: string
  logoPosition: LogoPosition
  logoSize: number
  watermark?: string
  stickers: string[]
  typography: Typography
}

type RenderState = 'idle' | 'rendering' | 'done'

export default function Step3({ tracks, theme, effects, visualizer, exportSettings, setExportSettings, loops, quality, onBack, background, logo, logoPosition, logoSize, watermark, stickers, typography }: Step3Props) {
  const [renderState, setRenderState] = useState<RenderState>('idle')
  const [progress, setProgress] = useState(0)

  const totalSec = tracks.reduce((acc, t) => acc + t.durationSec, 0)
  const totalDur = `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}`
  const sizeMb = Math.round(totalSec * (exportSettings.resolution === '4k' ? 1.5 : exportSettings.resolution === '1080p' ? 0.42 : 0.22))
  const themeObj = THEMES.find(t => t.id === theme) ?? THEMES[0]

  const startRender = async () => {
    setRenderState('rendering')
    setProgress(0)
    try {
      const blob = await renderVideo(
        { tracks, theme, effects, visualizer, typography, background, logo, logoPosition, logoSize, watermark, stickers, exportSettings, loops },
        pct => setProgress(Math.round(pct)),
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${exportSettings.filename}.mp4`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      setRenderState('done')
    } catch (err) {
      console.error('렌더링 실패:', err)
      setRenderState('idle')
    }
  }

  return (
    <div className="step3">
      <div className="page-head">
        <div>
          <h1 className="page-head__title">영상 출력</h1>
          <p className="page-head__sub">파일 포맷·해상도를 선택하고 렌더링을 시작하세요.</p>
        </div>
        <div className="page-head__progress">
          <div className="progress-track"><div className="progress-fill" style={{ width: '100%' }} /></div>
          <span>STEP 3 / 3</span>
        </div>
      </div>

      {/* 좌측 */}
      <div>
        <div className="s3-summary">
          <div className="s3-stat">
            <div className="s3-stat__label">트랙</div>
            <div className="s3-stat__value">{tracks.length}</div>
            <div className="s3-stat__sub">{tracks.length} / 50</div>
          </div>
          <div className="s3-stat">
            <div className="s3-stat__label">길이</div>
            <div className="s3-stat__value">{totalDur}</div>
            <div className="s3-stat__sub">반복 {loops}회</div>
          </div>
          <div className="s3-stat">
            <div className="s3-stat__label">해상도</div>
            <div className="s3-stat__value">{exportSettings.resolution.toUpperCase()}</div>
            <div className="s3-stat__sub">{RESOLUTION_MAP[exportSettings.resolution]}</div>
          </div>
          <div className="s3-stat">
            <div className="s3-stat__label">예상 크기</div>
            <div className="s3-stat__value">{sizeMb} <span className="s3-stat__unit">MB</span></div>
            <div className="s3-stat__sub">≈ {totalSec > 0 ? Math.round(sizeMb / (totalSec / 60)) : 0} MB/min</div>
          </div>
        </div>

        <div className="s3-final">
          <div className="s3-final__inner" style={{ background: themeObj.bg }}>
            <div className="s3-final__content">
              <div className="s3-final__logo"><Icon name="logo" size={26} /></div>
              <h2 className="s3-final__title">가을 산책 플레이리스트</h2>
              <div className="s3-final__meta">{tracks.length} TRACKS · {totalDur} · {exportSettings.resolution.toUpperCase()}</div>
            </div>
            <div className="s3-final__badge">SPECTRA</div>
            <div className="s3-final__wave">
              {waveformFor(11, 100).map((h, i) => (
                <div key={i} className="s3-final__wave-bar" style={{ height: `${h * 60}%` }} />
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card__head">
            <div className="card__title" style={{ fontSize: 13 }}>최종 설정 요약</div>
            <Button variant="ghost" onClick={onBack}>
              <Icon name="chevronLeft" size={14} /> 편집으로 돌아가기
            </Button>
          </div>
          <div>
            <div className="s3-form-row">
              <div className="s3-form-row__label">테마</div>
              <div className="s3-form-row__value">{themeObj.label} · 비주얼라이저 {visualizer.type} · 배경 블러 {effects.blur ? '24px' : '꺼짐'}</div>
            </div>
            <div className="s3-form-row">
              <div className="s3-form-row__label">오디오</div>
              <div className="s3-form-row__value">{quality.replace('k', ' kbps')} · AAC · 자동 레벨 {effects.ducking ? '−14 LUFS' : '꺼짐'}</div>
            </div>
            <div className="s3-form-row">
              <div className="s3-form-row__label">크로스페이드</div>
              <div className="s3-form-row__value">{effects.crossfade ? '켜짐' : '꺼짐'}</div>
            </div>
            <div className="s3-form-row">
              <div className="s3-form-row__label">로고 / 워터마크</div>
              <div className="s3-form-row__value">
                {logo ? `로고 · ${logoPositionLabel(logoPosition)}` : '로고 없음'} · 워터마크 {watermark ? '있음' : '없음'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 우측 — 내보내기 패널 */}
      <div className="s3-export card">
        <div className="card__head">
          <div className="card__title"><Icon name="export" size={16} /> 내보내기</div>
        </div>

        <div className="form-section">
          <div className="form-section__label">파일명</div>
          <input
            className="input"
            value={exportSettings.filename}
            onChange={e => setExportSettings({ ...exportSettings, filename: e.target.value })}
          />
          <div className="s3-filename-hint">{exportSettings.filename}.{exportSettings.format}</div>
        </div>

        <div className="form-section">
          <div className="form-section__label">파일 포맷</div>
          <SegmentedControl
            options={[
              { value: 'mp4'  as const, label: 'MP4',  hint: 'H.264'  },
              { value: 'webm' as const, label: 'WebM', hint: 'VP9'    },
              { value: 'mov'  as const, label: 'MOV',  hint: 'ProRes' },
            ]}
            value={exportSettings.format}
            onChange={format => setExportSettings({ ...exportSettings, format })}
          />
        </div>

        <div className="form-section">
          <div className="form-section__label">해상도</div>
          <SegmentedControl
            options={[
              { value: '720p'  as const, label: '720p',  hint: '빠름'   },
              { value: '1080p' as const, label: '1080p', hint: '권장'   },
              { value: '4k'    as const, label: '4K',    hint: '고해상' },
            ]}
            value={exportSettings.resolution}
            onChange={resolution => setExportSettings({ ...exportSettings, resolution })}
          />
        </div>

        <div className="form-section">
          <div className="form-section__label">옵션</div>
          <div className="s3-options">
            <label className="s3-option">
              <Switch
                on={exportSettings.thumbnail}
                onChange={() => setExportSettings({ ...exportSettings, thumbnail: !exportSettings.thumbnail })}
              />
              <div className="s3-option__meta">
                <div className="s3-option__title">썸네일 자동 생성</div>
                <div className="s3-option__sub">YouTube/Spotify용 1280×720</div>
              </div>
            </label>
            <label className="s3-option">
              <Switch
                on={exportSettings.chapters}
                onChange={() => setExportSettings({ ...exportSettings, chapters: !exportSettings.chapters })}
              />
              <div className="s3-option__meta">
                <div className="s3-option__title">챕터 마커 포함</div>
                <div className="s3-option__sub">각 트랙을 챕터로 분할</div>
              </div>
            </label>
          </div>
        </div>

        <div className="s3-estimate">
          <div className="s3-estimate__row">
            <span>예상 렌더링 시간</span>
            <span className="s3-estimate__val">≈ 2분 18초</span>
          </div>
          <div className="s3-estimate__row">
            <span>최종 파일 크기</span>
            <span className="s3-estimate__val">≈ {sizeMb} MB</span>
          </div>
        </div>

        <div className="s3-render">
          {renderState === 'idle' && (
            <button type="button" className="s3-btn-full" onClick={startRender}>
              <Icon name="export" size={15} /> 렌더링 시작
            </button>
          )}
          {renderState === 'rendering' && (
            <div className="render-progress">
              <div className="render-progress__bar">
                <div className="render-progress__fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="render-progress__text">렌더링 중... {progress}%</div>
            </div>
          )}
          {renderState === 'done' && (
            <div className="render-done">
              <div className="render-done__msg">✓ 렌더링 완료</div>
              <button
                type="button"
                className="s3-btn-full"
                onClick={() => { setRenderState('idle'); setProgress(0) }}
              >
                다시 내보내기
              </button>
            </div>
          )}
          <button type="button" className="s3-btn-full" style={{ marginTop: 8 }} disabled>
            <Icon name="folder" size={14} /> 프로젝트로 저장
          </button>
        </div>
      </div>
    </div>
  )
}
