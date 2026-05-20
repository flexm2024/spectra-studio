// Step 1 — 미디어 준비: 트랙 리스트, 업로드, 라이브 프리뷰, 브랜딩, 인코딩
import { useState, useRef, useEffect } from 'react'
import './Step1.css'
import Icon from '../../../icons'
import Button from '../../shared/Button'
import SegmentedControl from '../../shared/SegmentedControl'
import { waveformFor } from '../../../data/sampleTracks'
import type { Track, Background } from '../../../types'

interface Step1Props {
  tracks: Track[]
  setTracks: (tracks: Track[] | ((prev: Track[]) => Track[])) => void
  playingId: string | null
  isPlaying: boolean
  loops: 1 | 2 | 3
  setLoops: (l: 1 | 2 | 3) => void
  quality: '96k' | '128k' | '192k'
  setQuality: (q: '96k' | '128k' | '192k') => void
  onPlay: (id: string) => void
  onPause: () => void
  onSkipNext: () => void
  onSkipPrev: () => void
  onNext: () => void
  background: Background
  setBackground: (bg: Background) => void
  logo: string | undefined
  setLogo: (url: string | undefined) => void
  watermark: string | undefined
  setWatermark: (url: string | undefined) => void
  stickers: string[]
  setStickers: (s: string[]) => void
  currentTime: number
}

const LOOP_OPTIONS = [
  { value: 1 as const, label: '1회' },
  { value: 2 as const, label: '2회' },
  { value: 3 as const, label: '3회' },
]

const QUALITY_OPTIONS = [
  { value: '96k' as const,  label: '96k',  hint: '표준' },
  { value: '128k' as const, label: '128k', hint: '권장' },
  { value: '192k' as const, label: '192k', hint: '고음질' },
]

const BG_OPTIONS = [
  { value: 'image' as const,    label: '이미지' },
  { value: 'gradient' as const, label: '그라디언트' },
  { value: 'video' as const,    label: '비디오' },
]

export default function Step1({
  tracks, setTracks,
  playingId, isPlaying,
  loops, setLoops,
  quality, setQuality,
  onPlay, onPause, onSkipNext, onSkipPrev,
  onNext,
  background, setBackground,
  logo, setLogo,
  watermark, setWatermark,
  stickers, setStickers,
  currentTime,
}: Step1Props) {
  const [activeTab, setActiveTab] = useState<'background' | 'logo' | 'stickers'>('background')
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const bgFileRef = useRef<HTMLInputElement>(null)
  const logoFileRef = useRef<HTMLInputElement>(null)
  const watermarkFileRef = useRef<HTMLInputElement>(null)
  const stickerFileRef = useRef<HTMLInputElement>(null)
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sortOpen) return
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sortOpen])

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const fileList = Array.from(files)
    const newTracks: Track[] = []
    for (const file of fileList) {
      const title = file.name.replace(/\.[^/.]+$/, '')
      if (newTracks.some(t => t.title === title)) continue
      const audioUrl = URL.createObjectURL(file)
      const durationSec = await new Promise<number>(resolve => {
        const audio = new Audio()
        audio.preload = 'metadata'
        const timer = setTimeout(() => resolve(0), 8000)
        audio.addEventListener('loadedmetadata', () => {
          clearTimeout(timer)
          const d = audio.duration
          resolve(isFinite(d) ? Math.round(d) : 0)
        })
        audio.addEventListener('error', () => { clearTimeout(timer); resolve(0) })
        audio.src = audioUrl
      })
      const minutes = Math.floor(durationSec / 60)
      const seconds = durationSec % 60
      const duration = `${minutes}:${String(seconds).padStart(2, '0')}`
      const id = `upload-${crypto.randomUUID()}`
      newTracks.push({
        id,
        title,
        artist: 'Unknown',
        duration,
        durationSec,
        tag: '기타',
        bpm: 0,
        src: '',
        audioUrl,
        waveform: waveformFor(newTracks.length + 1),
      })
    }
    if (newTracks.length === 0) return
    newTracks
      .filter(nt => tracks.some(t => t.title === nt.title))
      .forEach(nt => { if (nt.audioUrl) URL.revokeObjectURL(nt.audioUrl) })
    setTracks(prev => {
      const deduped = newTracks.filter(nt => !prev.some(t => t.title === nt.title))
      return deduped.length > 0 ? [...prev, ...deduped] : prev
    })
  }

  const handleBgFile = (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (background.src) URL.revokeObjectURL(background.src)
    setBackground({ type: 'image', src: URL.createObjectURL(files[0]) })
  }

  const handleLogoFile = (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (logo) URL.revokeObjectURL(logo)
    setLogo(URL.createObjectURL(files[0]))
  }

  const handleWatermarkFile = (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (watermark) URL.revokeObjectURL(watermark)
    setWatermark(URL.createObjectURL(files[0]))
  }

  const handleStickerFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const remaining = 5 - stickers.length
    if (remaining <= 0) return
    const urls = Array.from(files).slice(0, remaining).map(f => URL.createObjectURL(f))
    setStickers(prev => [...prev, ...urls])
  }

  const handleDeleteSticker = (url: string) => {
    URL.revokeObjectURL(url)
    setStickers(prev => prev.filter(s => s !== url))
  }

  const applySort = (key: 'titleAsc' | 'titleDesc' | 'bpmAsc' | 'bpmDesc') => {
    const sorted = [...tracks]
    if (key === 'titleAsc')  sorted.sort((a, b) => a.title.localeCompare(b.title, 'ko'))
    if (key === 'titleDesc') sorted.sort((a, b) => b.title.localeCompare(a.title, 'ko'))
    if (key === 'bpmAsc')    sorted.sort((a, b) => a.bpm - b.bpm)
    if (key === 'bpmDesc')   sorted.sort((a, b) => b.bpm - a.bpm)
    setTracks(sorted)
    setSortOpen(false)
  }

  const totalSec = tracks.reduce((acc, t) => acc + t.durationSec, 0)
  const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
  const totalDur = fmt(totalSec)
  const finalDur = fmt(totalSec * loops)

  const playingTrack = tracks.find(t => t.id === playingId) ?? tracks[0]

  const handleDelete = (id: string) => {
    const track = tracks.find(t => t.id === id)
    if (track?.audioUrl) URL.revokeObjectURL(track.audioUrl)
    const idx = tracks.findIndex(t => t.id === id)
    const next = tracks[idx + 1] ?? tracks[idx - 1]
    setTracks(tracks.filter(t => t.id !== id))
    if (playingId === id && next && isPlaying) onPlay(next.id)
  }

  const moveTrack = (fromId: string, toId: string) => {
    if (fromId === toId) return
    const from = tracks.findIndex(t => t.id === fromId)
    const to = tracks.findIndex(t => t.id === toId)
    if (from < 0 || to < 0) return
    const next = [...tracks]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setTracks(next)
  }

  return (
    <div className="step1">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
      />
      {/* 페이지 헤더 */}
      <div className="page-head">
        <div>
          <h1 className="page-head__title">미디어 준비</h1>
          <p className="page-head__sub">오디오 트랙·배경·로고를 업로드하고 인코딩 옵션을 선택하세요.</p>
        </div>
        <div className="page-head__progress">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.min(100, Math.round(tracks.length / 15 * 100))}%` }} />
          </div>
          <span>STEP 1 / 3</span>
        </div>
      </div>

      {/* 좌측 — 오디오 트랙 */}
      <div>
        <div className="card card--overflow">
          <div className="card__head">
            <div className="card__title">
              오디오 트랙
              <span className="card__count">{tracks.length}</span>
              <span className="card__sub">· 총 {totalDur}</span>
            </div>
            <div className="card__actions">
              <div ref={sortRef} style={{ position: 'relative' }}>
                  <Button variant="ghost" onClick={() => setSortOpen(o => !o)}>
                    <Icon name="sliders" size={14} /> 정렬
                  </Button>
                  {sortOpen && (
                    <div className="sort-menu">
                      {([
                        { key: 'titleAsc',  label: '제목 A → Z' },
                        { key: 'titleDesc', label: '제목 Z → A' },
                        { key: 'bpmAsc',    label: 'BPM 낮은 순' },
                        { key: 'bpmDesc',   label: 'BPM 높은 순' },
                      ] as const).map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          className="sort-menu__item"
                          onClick={() => applySort(key)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              <Button variant="danger-ghost" onClick={() => {
                tracks.forEach(t => { if (t.audioUrl) URL.revokeObjectURL(t.audioUrl) })
                setTracks([])
              }}>
                <Icon name="reset" size={14} /> 전체 비우기
              </Button>
            </div>
          </div>

          <div style={{ padding: 14 }}>
            <div
              className="upload"
              style={{ cursor: 'pointer' }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload__icon"><Icon name="cloud" size={28} /></div>
              <div className="upload__copy">
                <h3>오디오 파일을 여기에 끌어다 놓으세요</h3>
                <p>또는 <strong>클릭하여 선택</strong> · MP3, WAV, FLAC, M4A 지원</p>
              </div>
              <div className="upload__hint">최대 50개<br />각 파일 ≤ 50MB</div>
            </div>
          </div>

          <div className="tracklist">
            <div className="tracklist__head">
              <div style={{ textAlign: 'center' }}>#</div>
              <div />
              <div>트랙</div>
              <div>파형</div>
              <div style={{ textAlign: 'center' }}>장르</div>
              <div style={{ textAlign: 'right' }}>길이</div>
              <div />
            </div>

            {tracks.map((t, i) => (
              <div
                key={t.id}
                className={[
                  'track',
                  playingId === t.id ? 'track--playing' : '',
                  dragId === t.id ? 'track--dragging' : '',
                  overId === t.id && dragId !== t.id ? 'track--dragover' : '',
                ].filter(Boolean).join(' ')}
                draggable
                onDragStart={e => { setDragId(t.id); try { e.dataTransfer.setData('text/plain', t.id) } catch {} }}
                onDragOver={e => { e.preventDefault(); if (overId !== t.id) setOverId(t.id) }}
                onDrop={e => { e.preventDefault(); if (dragId) moveTrack(dragId, t.id); setDragId(null); setOverId(null) }}
                onDragEnd={() => { setDragId(null); setOverId(null) }}
                onClick={() => onPlay(t.id)}
              >
                <div className="track__lead">
                  <span className="track__num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="track__drag"><Icon name="grip" size={14} /></span>
                </div>
                <button
                  type="button"
                  className="track__play"
                  onClick={e => { e.stopPropagation(); playingId === t.id && isPlaying ? onPause() : onPlay(t.id) }}
                >
                  <Icon name={playingId === t.id && isPlaying ? 'pause' : 'play'} size={12} />
                </button>
                <div className="track__meta">
                  <div className="track__title">{t.title}</div>
                  <div className="track__sub">{t.artist} · {t.bpm} BPM</div>
                </div>
                <div className="track__wave">
                  {waveformFor(i + 1, 56).map((h, j) => (
                    <div key={j} className="track__wave-bar" style={{ height: `${h * 100}%` }} />
                  ))}
                </div>
                <div className="track__tag">{t.tag}</div>
                <div className="track__time">{t.duration}</div>
                <button
                  type="button"
                  className="track__del"
                  title="삭제"
                  onClick={e => { e.stopPropagation(); handleDelete(t.id) }}
                >
                  <Icon name="x" size={13} />
                </button>
              </div>
            ))}
          </div>

          <div className="tracklist__foot">
            <div>{tracks.length}개 트랙 · 약 {totalDur}</div>
            <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
              <Icon name="plus" size={14} /> 트랙 추가
            </Button>
          </div>
        </div>
      </div>

      {/* 우측 — 프리뷰 + 브랜딩 + 인코딩 */}
      <div className="rcol">
        {/* 라이브 프리뷰 */}
        <div className="card preview-card">
          <div className="preview-frame">
            {background.src
              ? <img className="preview-frame__bg-img" src={background.src} alt="" />
              : <div className="preview-frame__bg" />
            }
            <div className="preview-frame__content">
              {logo
                ? <img className="preview-frame__logo-img" src={logo} alt="" />
                : <div className="preview-frame__logo"><Icon name="logo" size={22} /></div>
              }
              <h2 className="preview-frame__title">{playingTrack?.title}</h2>
              <div className="preview-frame__sub">{playingTrack?.artist} · {playingTrack?.tag}</div>
            </div>
            <div className="preview-vis">
              {waveformFor(parseInt(playingTrack?.id ?? '1'), 64).map((h, i) => (
                <div key={i} className="preview-vis__bar" style={{ height: `${h * 100}%` }} />
              ))}
            </div>
          </div>
          <div className="preview-meta">
            <div className="preview-meta__nowplaying">
              <div className="preview-meta__dot" />
              지금 재생 중 · 트랙 {String((tracks.findIndex(t => t.id === playingId) + 1)).padStart(2, '0')}
            </div>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11 }}>1920 × 1080 · 30fps</span>
          </div>
          <div className="preview-controls">
            <Button variant="ghost" size="icon" onClick={() => onSkipPrev()}><Icon name="skipBack" size={14} /></Button>
            <button type="button" className="preview-play" onClick={() => { if (isPlaying) { onPause() } else if (playingTrack) { onPlay(playingTrack.id) } }}>
              <Icon name={isPlaying ? 'pause' : 'play'} size={14} />
            </button>
            <Button variant="ghost" size="icon" onClick={() => onSkipNext()}><Icon name="skipForward" size={14} /></Button>
            <div className="preview-controls__progress">
              <div
                className="preview-controls__fill"
                style={{ width: `${playingTrack ? (currentTime / Math.max(1, playingTrack.durationSec)) * 100 : 0}%` }}
              />
            </div>
            <span className="preview-controls__time">0:48 / {playingTrack?.duration}</span>
          </div>
        </div>

        {/* 브랜딩 카드 */}
        <div className="card">
          <div className="tabs">
            {(['background', 'logo', 'stickers'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                className={`tab${activeTab === tab ? ' tab--active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                <Icon name={tab === 'background' ? 'image' : tab === 'logo' ? 'layers' : 'sticker'} size={14} />
                {tab === 'background' ? '배경' : tab === 'logo' ? '로고' : <>스티커 <span className="tab__badge">{stickers.length} / 5</span></>}
              </button>
            ))}
          </div>
          {activeTab === 'background' && (
            <div style={{ padding: 14 }}>
              <div
                className={`drop-slot${background.src ? ' drop-slot--filled' : ''}`}
                onClick={() => bgFileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleBgFile(e.dataTransfer.files) }}
              >
                {background.src ? (
                  <>
                    <img className="drop-slot__thumb" src={background.src} alt="" />
                    <div className="drop-slot__change">변경</div>
                  </>
                ) : (
                  <>
                    <Icon name="image" size={22} />
                    <div>배경 이미지를 끌어다 놓거나 클릭</div>
                    <div className="drop-slot__hint">JPG · PNG · 최소 1920×1080</div>
                  </>
                )}
              </div>
              <input
                data-testid="bg-file-input"
                ref={bgFileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => { handleBgFile(e.target.files); e.target.value = '' }}
              />
              <div className="form-section" style={{ paddingLeft: 0, paddingRight: 0 }}>
                <div className="form-section__label">배경 타입</div>
                <SegmentedControl
                  options={BG_OPTIONS}
                  value={background.type}
                  onChange={type => setBackground({ ...background, type })}
                />
              </div>
            </div>
          )}
          {activeTab === 'logo' && (
            <div style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div
                className={`drop-slot${logo ? ' drop-slot--filled' : ''}`}
                onClick={() => logoFileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleLogoFile(e.dataTransfer.files) }}
              >
                {logo ? (
                  <>
                    <img className="drop-slot__thumb" src={logo} alt="" />
                    <div className="drop-slot__change">변경</div>
                  </>
                ) : (
                  <>
                    <Icon name="layers" size={20} />
                    <div style={{ fontSize: 11.5, fontWeight: 600 }}>로고</div>
                    <div className="drop-slot__hint">PNG · SVG</div>
                  </>
                )}
              </div>
              <input
                data-testid="logo-file-input"
                ref={logoFileRef}
                type="file"
                accept="image/*,.svg"
                style={{ display: 'none' }}
                onChange={e => { handleLogoFile(e.target.files); e.target.value = '' }}
              />
              <div
                className={`drop-slot${watermark ? ' drop-slot--filled' : ''}`}
                onClick={() => watermarkFileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleWatermarkFile(e.dataTransfer.files) }}
              >
                {watermark ? (
                  <>
                    <img className="drop-slot__thumb" src={watermark} alt="" />
                    <div className="drop-slot__change">변경</div>
                  </>
                ) : (
                  <>
                    <Icon name="sticker" size={20} />
                    <div style={{ fontSize: 11.5, fontWeight: 600 }}>워터마크</div>
                    <div className="drop-slot__hint">선택 · PNG</div>
                  </>
                )}
              </div>
              <input
                data-testid="watermark-file-input"
                ref={watermarkFileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => { handleWatermarkFile(e.target.files); e.target.value = '' }}
              />
            </div>
          )}
          {activeTab === 'stickers' && (
            <div style={{ padding: 14 }}>
              {stickers.length > 0 && (
                <div className="sticker-grid">
                  {stickers.map(url => (
                    <div key={url} className="sticker-item">
                      <img src={url} alt="" />
                      <button
                        type="button"
                        className="sticker-item__del"
                        onClick={() => handleDeleteSticker(url)}
                      >
                        <Icon name="x" size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {stickers.length < 5 && (
                <div
                  className="drop-slot"
                  onClick={() => stickerFileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleStickerFiles(e.dataTransfer.files) }}
                >
                  <Icon name="sticker" size={22} />
                  <div>스티커/GIF를 끌어다 놓으세요</div>
                  <div className="drop-slot__hint">GIF · PNG · 최대 5개</div>
                </div>
              )}
              <input
                data-testid="sticker-file-input"
                ref={stickerFileRef}
                type="file"
                accept="image/*,.gif"
                multiple
                style={{ display: 'none' }}
                onChange={e => { handleStickerFiles(e.target.files); e.target.value = '' }}
              />
            </div>
          )}
        </div>

        {/* 인코딩 설정 */}
        <div className="card">
          <div className="card__head">
            <div className="card__title" style={{ fontSize: 13 }}>
              <Icon name="settings" size={14} /> 인코딩 설정
            </div>
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
          <div className="foot-cta">
            <Button variant="danger-ghost" onClick={() => { setLoops(1); setQuality('192k') }}><Icon name="reset" size={14} /> 초기화</Button>
            <Button variant="primary" size="lg" onClick={onNext}>
              스튜디오 입장 <Icon name="arrowRight" size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
