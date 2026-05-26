// Web Worker: OffscreenCanvas + WebCodecs + mp4-muxer 인코딩 실행 (메인 스레드 분리)

import { Muxer, StreamTarget } from 'mp4-muxer'
import { computeFrequencyBands } from './fft'
import { drawFrame } from './frameRenderer'
import type { DrawFrameInput } from './frameRenderer'
import type { Track } from '../../types'

const FPS = 30

const VIDEO_BITRATE: Record<string, number> = {
  '720p': 4_000_000,
  '1080p': 8_000_000,
  '4k': 25_000_000,
}

const AUDIO_BITRATE: Record<string, number> = {
  '96k': 96_000,
  '128k': 128_000,
  '192k': 192_000,
}

const RESOLUTION: Record<string, [number, number]> = {
  '720p': [1280, 720],
  '1080p': [1920, 1080],
  '4k': [3840, 2160],
}

interface WorkerInput {
  ch0: Float32Array
  ch1: Float32Array
  sampleRate: number
  audioLength: number
  frameCount: number
  trackBoundaries: number[]
  frameInputBase: Omit<DrawFrameInput, 'canvas' | 'frequencyData' | 'currentTrack' | 'currentTrackIndex'>
  resolution: '720p' | '1080p' | '4k'
  quality: '96k' | '128k' | '192k'
  tracks: Track[]
}

self.onmessage = async (e: MessageEvent<WorkerInput>) => {
  try {
    const blob = await encode(e.data, pct => self.postMessage({ type: 'progress', pct }))
    // Blob은 structured clone으로 전달 — ArrayBuffer 대형 할당 없음
    self.postMessage({ type: 'done', blob })
  } catch (err) {
    self.postMessage({ type: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}

async function encode(input: WorkerInput, onProgress: (pct: number) => void): Promise<Blob> {
  const { ch0, ch1, sampleRate, audioLength, frameCount, trackBoundaries, frameInputBase, resolution, quality, tracks } = input
  const [width, height] = RESOLUTION[resolution]

  // StreamTarget: 청크 단위 쓰기 — 대형 연속 ArrayBuffer 재할당 없음
  const chunks: Uint8Array[] = []
  const target = new StreamTarget({
    onData(data, _position) { chunks.push(new Uint8Array(data)) },
  })
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width, height },
    audio: { codec: 'aac', sampleRate, numberOfChannels: 2 },
    fastStart: false,  // moov를 파일 끝에 기록 — 다운로드용으로 문제없음
  })

  let encoderError: Error | null = null

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: e => { encoderError = e },
  })
  videoEncoder.configure({
    codec: 'avc1.640028',
    width,
    height,
    bitrate: VIDEO_BITRATE[resolution],
    framerate: FPS,
  })

  const audioEncoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: e => { encoderError = e },
  })
  audioEncoder.configure({
    codec: 'mp4a.40.2',
    sampleRate,
    numberOfChannels: 2,
    bitrate: AUDIO_BITRATE[quality],
  })

  const canvas = new OffscreenCanvas(width, height)

  try {
    for (let fi = 0; fi < frameCount; fi++) {
      const timeSec = fi / FPS
      const sampleOffset = Math.floor(timeSec * sampleRate)
      const frequencyData = computeFrequencyBands(ch0, sampleOffset, 2048, 80)

      const trackIdx = findTrackIndex(trackBoundaries, timeSec)
      const currentTrack = tracks[trackIdx % tracks.length]

      drawFrame({ ...frameInputBase, canvas, frequencyData, currentTrack, currentTrackIndex: trackIdx % tracks.length })

      const bitmap = canvas.transferToImageBitmap()
      const videoFrame = new VideoFrame(bitmap, {
        timestamp: Math.round(timeSec * 1_000_000),
        duration: Math.round((1 / FPS) * 1_000_000),
      })
      bitmap.close()
      videoEncoder.encode(videoFrame, { keyFrame: fi % 60 === 0 })
      videoFrame.close()

      // backpressure: 큐가 너무 크면 인코더가 따라올 때까지 대기 (flush는 마지막에만)
      while (videoEncoder.encodeQueueSize > 30) {
        await new Promise(r => setTimeout(r, 0))
      }

      if (fi % 60 === 0 || fi === frameCount - 1) {
        onProgress((fi / frameCount) * 76)
        await new Promise(r => setTimeout(r, 0))
      }
    }

    onProgress(78)
    await videoEncoder.flush()
    if (encoderError) throw encoderError
    onProgress(82)

    const CHUNK = 4096
    const totalChunks = Math.ceil(audioLength / CHUNK)
    let chunkIdx = 0
    for (let offset = 0; offset < audioLength; offset += CHUNK) {
      const end = Math.min(offset + CHUNK, audioLength)
      const size = end - offset
      const planar = new Float32Array(size * 2)
      planar.set(ch0.subarray(offset, end), 0)
      planar.set(ch1.subarray(offset, end), size)
      const audioData = new AudioData({
        format: 'f32-planar',
        sampleRate,
        numberOfFrames: size,
        numberOfChannels: 2,
        timestamp: Math.round((offset / sampleRate) * 1_000_000),
        data: planar,
      })
      audioEncoder.encode(audioData)
      audioData.close()
      chunkIdx++
      if (chunkIdx % 50 === 0) {
        onProgress(82 + (chunkIdx / totalChunks) * 13)
        await new Promise(r => setTimeout(r, 0))
      }
    }
    await audioEncoder.flush()
    if (encoderError) throw encoderError

    onProgress(96)
    muxer.finalize()
    return new Blob(chunks as BlobPart[], { type: 'video/mp4' })
  } finally {
    videoEncoder.close()
    audioEncoder.close()
  }
}

function findTrackIndex(boundaries: number[], timeSec: number): number {
  let idx = 0
  for (let i = 0; i < boundaries.length; i++) {
    if (boundaries[i] <= timeSec) idx = i
    else break
  }
  return idx
}
