// Step 1 — 미디어 준비: 트랙 리스트, 업로드, 라이브 프리뷰, 브랜딩, 인코딩
import { useState, useRef } from 'react'
import './Step1.css'
import Icon from '../../../icons'
import Button from '../../shared/Button'
import SegmentedControl from '../../shared/SegmentedControl'
import { waveformFor } from '../../../data/sampleTracks'
import type { Track } from '../../../types'

interface Step1Props {
  tracks: Track[]
  setTracks: (tracks: Track[]) => void
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
}: Step1Props) {
  const [activeTab, setActiveTab] = useState<'background' | 'logo' | 'stickers'>('background')
  const [bgType, setBgType] = useState<'image' | 'gradient' | 'video'>('gradient')
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const newTracks: Track[] = []
    for (const file of Array.from(files)) {
      const title = file.name.replace(/\.[^/.]+$/, '')
      if (tracks.some(t => t.title === title) || newTracks.some(t => t.title === title)) continue
      const audioUrl = URL.createObjectURL(file)
      const durationSec = await new Promise<number>(resolve => {
        const audio = new Audio()
        audio.addEventListener('loadedmetadata', () => resolve(Math.round(audio.duration)))
        audio.addEventListener('error', () => resolve(0))
        audio.src = audioUrl
      })
      const minutes = Math.floor(durationSec / 60)
      const seconds = durationSec % 60
      const duration = `${minutes}:${String(seconds).padStart(2, '0')}`
      const id = `upload-${Date.now()}-${newTracks.length}`
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
        waveform: waveformFor(tracks.length + newTracks.length + 1),
      })
    }
    if (newTracks.length > 0) setTracks([...tracks, ...newTracks])
  }

  const totalSec = tracks.reduce((acc, t) => acc + t.durationSec, 0)
  const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
  const totalDur = fmt(totalSec)
  const finalDur = fmt(totalSec * loops)

  const playingTrack = tracks.find(t => t.id === playingId) ?? tracks[0]

  const handleDelete = (id: string) => {
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
        onChange={e => handleFiles(e.target.files)}
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
              <Button variant="ghost"><Icon name="sliders" size={14} /> 정렬</Button>
              <Button variant="danger-ghost" onClick={() => setTracks([])}>
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
            <div className="preview-frame__bg" />
            <div className="preview-frame__content">
              <div className="preview-frame__logo"><Icon name="logo" size={22} /></div>
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
            <Button variant="ghost" size="icon"><Icon name="skipBack" size={14} /></Button>
            <button type="button" className="preview-play">
              <Icon name="pause" size={14} />
            </button>
            <Button variant="ghost" size="icon"><Icon name="skipForward" size={14} /></Button>
            <div className="preview-controls__progress">
              <div className="preview-controls__fill" />
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
                {tab === 'background' ? '배경' : tab === 'logo' ? '로고' : <>스티커 <span className="tab__badge">0 / 5</span></>}
              </button>
            ))}
          </div>
          {activeTab === 'background' && (
            <div style={{ padding: 14 }}>
              <div className="drop-slot">
                <Icon name="image" size={22} />
                <div>배경 이미지를 끌어다 놓거나 클릭</div>
                <div className="drop-slot__hint">JPG · PNG · 최소 1920×1080</div>
              </div>
              <div className="form-section" style={{ paddingLeft: 0, paddingRight: 0 }}>
                <div className="form-section__label">배경 타입</div>
                <SegmentedControl options={BG_OPTIONS} value={bgType} onChange={setBgType} />
              </div>
            </div>
          )}
          {activeTab === 'logo' && (
            <div style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="drop-slot">
                <Icon name="layers" size={20} />
                <div style={{ fontSize: 11.5, fontWeight: 600 }}>로고</div>
                <div className="drop-slot__hint">PNG · SVG</div>
              </div>
              <div className="drop-slot">
                <Icon name="sticker" size={20} />
                <div style={{ fontSize: 11.5, fontWeight: 600 }}>워터마크</div>
                <div className="drop-slot__hint">선택 · PNG</div>
              </div>
            </div>
          )}
          {activeTab === 'stickers' && (
            <div style={{ padding: 14 }}>
              <div className="drop-slot">
                <Icon name="sticker" size={22} />
                <div>스티커/GIF를 끌어다 놓으세요</div>
                <div className="drop-slot__hint">GIF · PNG · 최대 5개</div>
              </div>
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
            <Button variant="danger-ghost"><Icon name="reset" size={14} /> 초기화</Button>
            <Button variant="primary" size="lg" onClick={onNext}>
              스튜디오 입장 <Icon name="arrowRight" size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
