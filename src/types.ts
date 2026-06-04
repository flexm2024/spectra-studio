// 앱 전역 타입 정의

export type Track = {
  id: string
  title: string
  artist: string
  duration: string
  durationSec: number
  tag: string
  bpm: number
  src: string        // 서버 에셋 경로 (현재 미사용)
  waveform: number[]
  audioUrl?: string  // 사용자 업로드 파일의 Object URL (blob:...). 샘플 트랙은 undefined.
}

export type Background = {
  type: 'image' | 'gradient' | 'video'
  src?: string
}

export type ProjectState = {
  step: 1 | 2 | 3
  tracks: Track[]
  playingId: string | null
  background: Background
  logo?: string
  watermark?: string
  stickers: string[]
  loops: 1 | 2 | 3
  audioQuality: '96k' | '128k' | '192k'
  theme: 'midnight' | 'cyanwave' | 'sunset' | 'forest' | 'cream' | 'mono'
  visualizer: 'bars' | 'wave' | 'orb'
  visualizerIntensity: number
  visualizerOpacity: number
  effects: {
    visualizer: boolean
    crossfade: boolean
    autoLevel: boolean
    backgroundBlur: boolean
  }
  titleSize: number
  letterSpacing: number
  filename: string
  format: 'mp4' | 'webm' | 'mov'
  resolution: '720p' | '1080p' | '4k'
  generateThumbnail: boolean
  includeChapterMarkers: boolean
}

export interface Effects {
  vis: boolean
  crossfade: boolean
  ducking: boolean
  blur: boolean
}

export interface Visualizer {
  type: 'bars' | 'glow' | 'peak' | 'particle'
    | 'classic-bars' | 'mirror-bars' | 'neon-glow' | 'waveform-line'
    | 'circular-eq' | 'stacked-layers' | 'dot-matrix' | 'spectrum-fire'
    | '3d-perspective' | 'glitch-shift' | 'spiral-eq' | 'tunnel-rings'
    | 'frequency-mountain' | 'starburst' | 'block-steps' | 'aurora-curtains'
    | 'dna-helix' | 'vinyl-grooves' | 'laser-harp' | 'neon-cityscape'
    | 'prism-split' | 'lightning-bolt' | 'arcade-spectrum' | 'liquid-mercury'
  intensity: number
  opacity: number
  y: number     // 0–100, 스테이지 높이 대비 수직 중심 위치 (%)
  size: number  // 0–100, 높이 크기
  width: number // 0–100, 스테이지 너비 대비 가로 폭 (%)
  color: string // 비주얼라이저 색상 hex
}

export type TitleBaseStyle =
  | 'minimal' | 'modern' | 'bold' | 'underline' | 'card'
  | 'neon' | 'glitch' | 'outline' | 'vintage'

export type TitleDecoStyle =
  | 'none' | 'caption' | 'bar-left' | 'frame' | 'divider'
  | 'bg-word' | 'corner' | 'wave'

export type TitlePositionPreset =
  | 'tl' | 'tc' | 'tr'
  | 'ml' | 'mc' | 'mr'
  | 'bl' | 'bc' | 'br'

export interface Typography {
  titleSize: number
  letterSpacing: number
  titlePosition: { x: number; y: number }  // 0–100%, 프레임 기준
  subPosition: { x: number; y: number }    // 0–100%, 프레임 기준
  showTitle: boolean
  showSub: boolean
  subSize: number           // 트랙 서브텍스트 폰트 크기 (px, 640px 기준)
  subLetterSpacing: number  // 트랙 서브텍스트 자간 (milliems)
  // 타이틀 탭 신규 필드
  titleStyle: TitleBaseStyle
  titleDeco: TitleDecoStyle
  titleFont: string
  titlePositionPreset: TitlePositionPreset
  titleCaptionTop: string
  titleCaptionBottom: string
  titleAlign: 'left' | 'center' | 'right'
}

export interface ExportSettings {
  filename: string
  resolution: '720p' | '1080p' | '4k'
}

export interface LogoPosition {
  x: number  // 스테이지 너비 대비 %, 0–100
  y: number  // 스테이지 높이 대비 %, 0–100
}

export interface TrackMeta {
  id: string
  title: string
  artist: string
  duration: string
  durationSec: number
  tag: string
  bpm: number
  waveform: number[]
}

export interface ProjectSnapshot {
  theme: string
  effects: Effects
  visualizer: Visualizer
  typography: Typography
  exportSettings: ExportSettings
  loops: 1 | 2 | 3
  quality: '96k' | '128k' | '192k'
  background: Background
  logoPosition: LogoPosition
  logoSize: number
  tracks: TrackMeta[]
}

export interface SavedProject {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  snapshot: ProjectSnapshot
}
