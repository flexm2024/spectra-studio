// renderVideo() — 오디오 처리 → 이미지 로딩 → MP4 인코딩 진입점

import type { Track, Background, Effects, Visualizer, Typography, ExportSettings } from '../../types'
import { processAudio } from './audioProcessor'
import { encodeVideo } from './videoEncoder'
import { loadImageBitmap } from './frameRenderer'

const THEME_COLORS: Record<string, [string, string]> = {
  midnight: ['#0c1a2e', '#050813'],
  cyanwave: ['#042f3f', '#0a647a'],
  sunset:   ['#2a0f2e', '#6d2c4a'],
  forest:   ['#0c1e16', '#1f3d2c'],
  cream:    ['#f3ead8', '#d9c7a3'],
  mono:     ['#0a0a0a', '#2a2a2a'],
}

const RESOLUTION: Record<string, [number, number]> = {
  '720p': [1280, 720],
  '1080p': [1920, 1080],
  '4k': [3840, 2160],
}

export interface RenderInput {
  tracks: Track[]
  theme: string
  background: Background
  logo?: string
  watermark?: string
  stickers: string[]
  effects: Effects
  visualizer: Visualizer
  typography: Typography
  exportSettings: ExportSettings
  loops: 1 | 2 | 3
}

export async function renderVideo(input: RenderInput, onProgress: (pct: number) => void): Promise<Blob> {
  onProgress(0)

  const audioResult = await processAudio({
    tracks: input.tracks,
    loops: input.loops,
    crossfade: input.effects.crossfade,
  })
  onProgress(40)

  const [backgroundImage, logoImage, watermarkImage, ...stickerImages] = await Promise.all([
    input.background.src ? loadImageBitmap(input.background.src) : Promise.resolve(undefined),
    input.logo ? loadImageBitmap(input.logo) : Promise.resolve(undefined),
    input.watermark ? loadImageBitmap(input.watermark) : Promise.resolve(undefined),
    ...input.stickers.map(loadImageBitmap),
  ])

  const [width, height] = RESOLUTION[input.exportSettings.resolution]
  const themeGradient = THEME_COLORS[input.theme] ?? THEME_COLORS['midnight']

  const blob = await encodeVideo({
    audioResult,
    frameInputBase: {
      width,
      height,
      themeGradient,
      background: input.background,
      backgroundImage,
      logoImage,
      watermarkImage,
      stickerImages: stickerImages.filter((x): x is ImageBitmap => x !== undefined),
      effects: input.effects,
      visualizer: input.visualizer,
      typography: input.typography,
      totalTracks: input.tracks.length,
    },
    resolution: input.exportSettings.resolution,
    tracks: input.tracks,
    onProgress: pct => onProgress(40 + pct * 0.6),
  })

  onProgress(100)
  return blob
}
