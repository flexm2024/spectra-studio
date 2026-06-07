// Step 3 — 영상 출력: 설정 요약, 내보내기 패널, 렌더링 진행 UI
import { useState, useEffect, useRef, useCallback } from 'react'
import './Step3.css'
import Icon from '../../../icons'
import Button from '../../shared/Button'
import SegmentedControl from '../../shared/SegmentedControl'
import { waveformFor } from '../../../data/sampleTracks'
import type { Track, Effects, Visualizer, ExportSettings, Background, LogoPosition, Typography, ParticleOverlay } from '../../../types'
import { renderVideo } from '../../../lib/renderer'

const LOOP_OPTIONS = [
  { value: 1 as const, label: '1회' },
  { value: 2 as const, label: '2회' },
  { value: 3 as const, label: '3회' },
]

const QUALITY_OPTIONS = [
  { value: '96k'  as const, label: '96k',  hint: '표준'   },
  { value: '128k' as const, label: '128k', hint: '권장'   },
  { value: '192k' as const, label: '192k', hint: '고음질' },
]

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

function hexHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  if (max === min) return 0
  const d = max - min
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0))
          : max === g ? (b - r) / d + 2
          : (r - g) / d + 4
  return h * 60
}

function previewBarColor(i: number, total: number, color: string): string {
  const hue = color === 'rainbow'
    ? (i / Math.max(total - 1, 1)) * 240
    : hexHue(color) + (i / Math.max(total - 1, 1) - 0.5) * 40
  return `hsl(${hue}, 100%, 65%)`
}

interface Step3Props {
  tracks: Track[]
  theme: string
  effects: Effects
  visualizer: Visualizer
  exportSettings: ExportSettings
  setExportSettings: (s: ExportSettings) => void
  loops: 1 | 2 | 3
  setLoops: (l: 1 | 2 | 3) => void
  quality: '96k' | '128k' | '192k'
  setQuality: (q: '96k' | '128k' | '192k') => void
  onBack: () => void
  background: Background
  logo?: string
  logoPosition: LogoPosition
  logoSize: number
  watermark?: string
  stickers: string[]
  typography: Typography
  particleOverlay?: ParticleOverlay
  onSave?: () => void
  autoStart?: boolean
  onAutoStartDone?: () => void
}

type RenderState = 'idle' | 'rendering' | 'done' | 'error'

export default function Step3({ tracks, theme, effects, visualizer, exportSettings, setExportSettings, loops, setLoops, quality, setQuality, onBack, background, logo, logoPosition, logoSize, watermark, stickers, typography, particleOverlay, onSave, autoStart, onAutoStartDone }: Step3Props) {
  const canRender = typeof VideoEncoder !== 'undefined'
    && typeof AudioEncoder !== 'undefined'
    && typeof OffscreenCanvas !== 'undefined'

  const [renderState, setRenderState] = useState<RenderState>('idle')
  const [progress, setProgress] = useState(0)
  const [renderError, setRenderError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const onPreview = useCallback((bitmap: ImageBitmap) => {
    const canvas = canvasRef.current
    if (!canvas) { bitmap.close(); return }
    const ctx = canvas.getContext('2d')
    if (!ctx) { bitmap.close(); return }
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()
  }, [])

  const totalSec = tracks.reduce((acc, t) => acc + t.durationSec, 0)
  const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
  const totalDur = fmt(totalSec)
  // 전체 구간에서 충분한 높이 보장: 0.45~1.0 사이에서 랜덤 변동
  const previewWaveData = Array.from({ length: 80 }, (_, i) => {
    const rng = waveformFor(i + 1, 1)[0]   // 0.25~0.95
    return Math.min(1, 0.45 + rng * 0.55)
  })
  const finalDur = fmt(totalSec * loops)
  const VIDEO_BPS = { '720p': 4_000_000, '1080p': 8_000_000, '4k': 25_000_000 } as const
  const AUDIO_BPS = { '96k': 96_000, '128k': 128_000, '192k': 192_000 } as const
  const encodedSec = totalSec * loops
  const sizeMb = Math.round((VIDEO_BPS[exportSettings.resolution] + AUDIO_BPS[quality]) * encodedSec / 8 / 1024 / 1024)
  const themeObj = THEMES.find(t => t.id === theme) ?? THEMES[0]

  const startRender = async () => {
    if (!canRender) return
    if (tracks.length === 0) return
    setRenderState('rendering')
    setRenderError(null)
    setProgress(0)
    try {
      const blob = await renderVideo(
        { tracks, theme, effects, visualizer, typography, background, logo, logoPosition, logoSize, watermark, stickers, exportSettings, loops, quality, particleOverlay },
        pct => setProgress(Math.round(pct)),
        onPreview,
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${exportSettings.filename}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      setRenderState('done')
    } catch (err) {
      console.error('렌더링 실패:', err)
      const msg = err instanceof Error ? err.message : String(err)
      setRenderError(msg)
      setRenderState('error')
    }
  }

  useEffect(() => {
    if (autoStart && canRender && tracks.length > 0) {
      onAutoStartDone?.()
      startRender()
    }
    // autoStart 값이 true로 바뀔 때 한 번만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart])

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
          <div className="s3-final__inner" style={{ background: background.src ? undefined : themeObj.bg }} data-testid="s3-preview">
            {background.src && (
              <img src={background.src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
            )}
            {effects.blur && <div className="s3-final__blur-overlay" />}
            <h2
              className="s3-final__title"
              style={{
                left: `${typography.titlePosition.x}%`,
                top: `${typography.titlePosition.y}%`,
                fontSize: `${typography.titleSize}px`,
                letterSpacing: `${typography.letterSpacing / 1000}em`,
              }}
            >
              {tracks.length > 0 ? tracks[0].title : '플레이리스트'}
            </h2>
            {typography.showSub && (
              <div
                className="s3-final__sub"
                style={{
                  left: `${typography.subPosition.x}%`,
                  top: `${typography.subPosition.y}%`,
                  fontSize: `${typography.subSize}px`,
                  letterSpacing: `${typography.subLetterSpacing / 1000}em`,
                }}
              >
                {tracks[0]?.artist && tracks[0].artist !== 'Unknown' ? `${tracks[0].artist} · ` : ''}Track 01 / {tracks.length}
              </div>
            )}
            {effects.vis && (
              <div
                className="s3-final__wave"
                style={{
                  top: `${visualizer.y}%`,
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: `${Math.max(10, visualizer.width)}%`,
                  height: `${Math.max(10, Math.round(visualizer.size * 0.8))}px`,
                  opacity: visualizer.opacity / 100,
                }}
              >
                <svg width="100%" height="100%" viewBox={`0 0 ${previewWaveData.length} 100`} preserveAspectRatio="none">
                  {previewWaveData.map((h, i) => {
                    const barH = Math.max(1, h * (visualizer.intensity / 100) * 80)
                    return (
                      <rect key={i} x={i + 0.08} y={80 - barH} width={0.84} height={barH}
                        fill={previewBarColor(i, previewWaveData.length, visualizer.color)} opacity="0.95" rx="0.35" />
                    )
                  })}
                  <rect x="0" y="80.4" width={previewWaveData.length} height="0.5" fill="rgba(255,255,255,0.09)" />
                </svg>
              </div>
            )}
            {(renderState === 'rendering' || renderState === 'done') && (
              <canvas
                ref={canvasRef}
                className="s3-preview-canvas"
                width={1920}
                height={1080}
              />
            )}
            {!logo && (
              <div className="s3-final__logo" style={{ left: `${logoPosition.x}%`, top: `${logoPosition.y}%` }}>
                <Icon name="logo" size={26} />
              </div>
            )}
            {logo && (
              <img
                src={logo}
                alt=""
                style={{
                  position: 'absolute',
                  left: `${logoPosition.x}%`,
                  top: `${logoPosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${logoSize}px`,
                  height: `${logoSize}px`,
                  borderRadius: '14px',
                  objectFit: 'contain',
                  zIndex: 4,
                }}
              />
            )}
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
          <div className="s3-filename-hint">{exportSettings.filename}.mp4</div>
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
          <div className="form-section__label">
            재생 반복
            <span className="form-section__hint">최종 길이 ≈ {finalDur}</span>
          </div>
          <SegmentedControl options={LOOP_OPTIONS} value={loops} onChange={setLoops} />
        </div>

        <div className="form-section">
          <div className="form-section__label">오디오 품질</div>
          <SegmentedControl options={QUALITY_OPTIONS} value={quality} onChange={setQuality} />
        </div>

        <div className="s3-estimate">
          <div className="s3-estimate__row">
            <span>MP4 · H.264 · AAC</span>
            <span className="s3-estimate__val">≈ {sizeMb} MB</span>
          </div>
        </div>

        <div className="s3-render">
          {!canRender && (
            <div className="s3-compat-warn">
              이 브라우저는 영상 인코딩을 지원하지 않습니다.
              Chrome 또는 Edge 94 이상을 사용해 주세요.
            </div>
          )}
          {canRender && tracks.length === 0 && (
            <div className="s3-no-tracks">
              트랙이 없습니다. Step 1에서 음원을 추가해 주세요.
            </div>
          )}
          {(renderState === 'idle' || renderState === 'error') && (
            <>
              <button
                type="button"
                className="s3-btn-render"
                onClick={startRender}
                disabled={!canRender || tracks.length === 0}
              >
                <Icon name="export" size={16} /> 렌더링 시작
              </button>
              {renderState === 'error' && renderError && (
                <div className="s3-render-error">
                  오류: {renderError}
                </div>
              )}
            </>
          )}
          {(renderState === 'idle' || renderState === 'error') && onSave && (
            <button type="button" className="s3-btn-save" onClick={onSave}>
              <Icon name="download" size={14} /> 프로젝트 저장
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
              <div className="render-done__msg">✓ 렌더링 완료 — 다운로드 폴더에서 확인하세요</div>
              <button
                type="button"
                className="s3-btn-full"
                onClick={() => { setRenderState('idle'); setProgress(0); setRenderError(null) }}
              >
                다시 내보내기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
