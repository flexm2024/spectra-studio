// OfflineAudioContext로 트랙 오디오를 concat/loop 믹싱하는 오디오 프로세서

import type { Track } from '../../types'

const FPS = 30
const CROSSFADE_SEC = 1

export interface AudioProcessorInput {
  tracks: Track[]
  loops: 1 | 2 | 3
  crossfade: boolean
  sampleRate?: number
}

export interface AudioProcessorOutput {
  audioBuffer: AudioBuffer
  trackBoundaries: number[]  // 루프 포함 전체 트랙 시작 시각 (초)
  frameCount: number
  durationSec: number
}

export interface BoundaryResult {
  boundaries: number[]        // 루프 전체 포함
  singlePassDuration: number  // 루프 1회 길이
  totalDuration: number
}

export function computeTrackBoundaries(
  durations: number[],
  loops: number,
  crossfade: boolean
): BoundaryResult {
  const overlap = crossfade ? CROSSFADE_SEC : 0
  const perLoopBounds: number[] = []
  let cursor = 0
  for (let i = 0; i < durations.length; i++) {
    perLoopBounds.push(cursor)
    cursor += durations[i] - (i < durations.length - 1 ? overlap : 0)
  }
  const singlePassDuration = cursor
  const boundaries: number[] = []
  for (let loop = 0; loop < loops; loop++) {
    for (const b of perLoopBounds) {
      boundaries.push(loop * singlePassDuration + b)
    }
  }
  return { boundaries, singlePassDuration, totalDuration: singlePassDuration * loops }
}

export async function processAudio(input: AudioProcessorInput): Promise<AudioProcessorOutput> {
  const { tracks, loops, crossfade } = input
  const sampleRate = input.sampleRate ?? 48000

  // Phase 1: 디코딩 전용 임시 컨텍스트
  const decodeCtx = new OfflineAudioContext(2, sampleRate, sampleRate)

  const trackBuffers: AudioBuffer[] = await Promise.all(
    tracks.map(async t => {
      if (t.audioUrl) {
        const resp = await fetch(t.audioUrl)
        const arr = await resp.arrayBuffer()
        return decodeCtx.decodeAudioData(arr)
      }
      return decodeCtx.createBuffer(2, Math.ceil(t.durationSec * sampleRate), sampleRate)
    })
  )

  const durations = trackBuffers.map(b => b.duration)
  const { boundaries, totalDuration } = computeTrackBoundaries(durations, loops, crossfade)

  // Phase 2: 믹싱 컨텍스트
  const totalSamples = Math.ceil(totalDuration * sampleRate)
  const offline = new OfflineAudioContext(2, totalSamples, sampleRate)

  for (let loop = 0; loop < loops; loop++) {
    trackBuffers.forEach((buf, i) => {
      const src = offline.createBufferSource()
      src.buffer = buf
      const startTime = boundaries[loop * tracks.length + i]  // boundaries는 이미 절대 시각

      if (crossfade) {
        const gain = offline.createGain()
        src.connect(gain)
        gain.connect(offline.destination)
        if (i > 0) {
          gain.gain.setValueAtTime(0, startTime)
          gain.gain.linearRampToValueAtTime(1, startTime + CROSSFADE_SEC)
        }
        const endTime = startTime + buf.duration
        gain.gain.setValueAtTime(1, endTime - CROSSFADE_SEC)
        gain.gain.linearRampToValueAtTime(0, endTime)
      } else {
        src.connect(offline.destination)
      }
      src.start(startTime)
    })
  }

  const audioBuffer = await offline.startRendering()
  return {
    audioBuffer,
    trackBoundaries: boundaries,
    frameCount: Math.ceil(totalDuration * FPS),
    durationSec: totalDuration,
  }

}
