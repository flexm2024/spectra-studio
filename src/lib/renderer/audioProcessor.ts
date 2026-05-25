// OfflineAudioContext로 트랙 오디오를 concat/loop 믹싱하는 오디오 프로세서

import type { Track } from '../../types'

const FPS = 30
const CROSSFADE_SEC = 1
const TARGET_DBFS = -14    // −14 LUFS 근사 기준
const MAX_NORM_GAIN = 4.0  // +12 dB 상한 (조용한 트랙 과증폭 방지)
const MIN_NORM_GAIN = 0.1  // −20 dB 하한

export function calcRMS(buffer: AudioBuffer): number {
  let sumSq = 0, count = 0
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < data.length; i++) {
      sumSq += data[i] * data[i]
      count++
    }
  }
  return count > 0 ? Math.sqrt(sumSq / count) : 0
}

export function calcNormGain(buffer: AudioBuffer): number {
  const rms = calcRMS(buffer)
  if (rms < 1e-6) return 1  // 무음 트랙은 건드리지 않음
  const dbFS = 20 * Math.log10(rms)
  const gainDB = TARGET_DBFS - dbFS
  return Math.min(MAX_NORM_GAIN, Math.max(MIN_NORM_GAIN, Math.pow(10, gainDB / 20)))
}

export interface AudioProcessorInput {
  tracks: Track[]
  loops: 1 | 2 | 3
  crossfade: boolean
  ducking: boolean
  sampleRate?: number
  onProgress?: (pct: number) => void
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
  const { tracks, loops, crossfade, ducking, onProgress } = input
  const sampleRate = input.sampleRate ?? 48000

  // Phase 1: 디코딩 전용 임시 컨텍스트
  const decodeCtx = new OfflineAudioContext(2, sampleRate, sampleRate)

  let decoded = 0
  const trackBuffers: AudioBuffer[] = await Promise.all(
    tracks.map(async t => {
      let buf: AudioBuffer
      if (t.audioUrl) {
        const resp = await fetch(t.audioUrl)
        const arr = await resp.arrayBuffer()
        buf = await decodeCtx.decodeAudioData(arr)
      } else {
        buf = decodeCtx.createBuffer(2, Math.ceil(t.durationSec * sampleRate), sampleRate)
      }
      decoded++
      // 디코딩 단계: 0→70%
      onProgress?.(Math.round((decoded / Math.max(tracks.length, 1)) * 70))
      return buf
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
      const startTime = boundaries[loop * tracks.length + i]

      // 체인: src → [normGain?] → [fadeGain?] → destination
      let outNode: AudioNode = src

      if (ducking) {
        const normGain = offline.createGain()
        normGain.gain.value = calcNormGain(buf)
        src.connect(normGain)
        outNode = normGain
      }

      if (crossfade) {
        const fadeGain = offline.createGain()
        outNode.connect(fadeGain)
        fadeGain.connect(offline.destination)
        if (i > 0) {
          fadeGain.gain.setValueAtTime(0, startTime)
          fadeGain.gain.linearRampToValueAtTime(1, startTime + CROSSFADE_SEC)
        }
        const endTime = startTime + buf.duration
        fadeGain.gain.setValueAtTime(1, endTime - CROSSFADE_SEC)
        fadeGain.gain.linearRampToValueAtTime(0, endTime)
      } else {
        outNode.connect(offline.destination)
      }

      src.start(startTime)
    })
  }

  const audioBuffer = await offline.startRendering()
  onProgress?.(100)
  return {
    audioBuffer,
    trackBoundaries: boundaries,
    frameCount: Math.ceil(totalDuration * FPS),
    durationSec: totalDuration,
  }

}
