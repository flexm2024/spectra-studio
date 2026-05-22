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
  type: 'bars' | 'wave' | 'orb' | 'mirror' | 'dots' | 'ring'
  intensity: number
  opacity: number
  y: number     // 0–100, 스테이지 높이 대비 수직 중심 위치 (%)
  size: number  // 0–100, UI 미리보기 기준 크기
}

export interface Typography {
  titleSize: number
  letterSpacing: number
}

export interface ExportSettings {
  filename: string
  format: 'mp4' | 'webm' | 'mov'
  resolution: '720p' | '1080p' | '4k'
  thumbnail: boolean
  chapters: boolean
}

export interface LogoPosition {
  x: number  // 스테이지 너비 대비 %, 0–100
  y: number  // 스테이지 높이 대비 %, 0–100
}
