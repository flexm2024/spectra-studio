// VideoEncoder + AudioEncoder + mp4-muxer로 H.264 MP4를 생성하는 인코더

import { Muxer, ArrayBufferTarget } from 'mp4-muxer'
import { computeFrequencyBands } from './fft'
import { drawFrame } from './frameRenderer'
import type { DrawFrameInput } from './frameRenderer'
import type { Track } from '../../types'
import type { AudioProcessorOutput } from './audioProcessor'

const FPS = 30

const BITRATE: Record<string, number> = {
  '720p': 4_000_000,
  '1080p': 8_000_000,
  '4k': 25_000_000,
}

const RESOLUTION: Record<string, [number, number]> = {
  '720p': [1280, 720],
  '1080p': [1920, 1080],
  '4k': [3840, 2160],
}

export interface EncodeVideoInput {
  audioResult: AudioProcessorOutput
  frameInputBase: Omit<DrawFrameInput, 'canvas' | 'frequencyData' | 'currentTrack' | 'currentTrackIndex'>
  resolution: '720p' | '1080p' | '4k'
  tracks: Track[]
  onProgress: (pct: number) => void
}

export async function encodeVideo(input: EncodeVideoInput): Promise<Blob> {
  const { audioResult, frameInputBase, resolution, tracks } = input
  const [width, height] = RESOLUTION[resolution]
  const { audioBuffer, trackBoundaries, frameCount } = audioResult
  const pcmData = audioBuffer.getChannelData(0)

  const target = new ArrayBufferTarget()
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width, height },
    audio: {
      codec: 'aac',
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: 2,
    },
    fastStart: 'in-memory',
  })

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: e => { encoderError = e },
  })
  videoEncoder.configure({
    codec: 'avc1.640028',
    width,
    height,
    bitrate: BITRATE[resolution],
    framerate: FPS,
  })

  const audioEncoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: e => { encoderError = e },
  })
  audioEncoder.configure({
    codec: 'mp4a.40.2',
    sampleRate: audioBuffer.sampleRate,
    numberOfChannels: 2,
    bitrate: 192_000,
  })

  const canvas = new OffscreenCanvas(width, height)

  let encoderError: Error | null = null

  // 비디오 프레임 인코딩
  for (let fi = 0; fi < frameCount; fi++) {
    const timeSec = fi / FPS
    const sampleOffset = Math.floor(timeSec * audioBuffer.sampleRate)
    const frequencyData = computeFrequencyBands(pcmData, sampleOffset, 2048, 80)

    const trackIdx = findCurrentTrackIndex(trackBoundaries, timeSec)
    const currentTrack = tracks[trackIdx % tracks.length]

    drawFrame({ ...frameInputBase, canvas, frequencyData, currentTrack, currentTrackIndex: trackIdx % tracks.length })

    const videoFrame = new VideoFrame(canvas, {
      timestamp: Math.round(timeSec * 1_000_000),
      duration: Math.round((1 / FPS) * 1_000_000),
    })
    videoEncoder.encode(videoFrame, { keyFrame: fi % 60 === 0 })
    videoFrame.close()

    input.onProgress((fi / frameCount) * 80)
  }
  await videoEncoder.flush()
  if (encoderError) throw encoderError

  // 오디오 인코딩 (f32-planar: ch0 먼저, ch1 뒤)
  const ch0 = audioBuffer.getChannelData(0)
  const ch1 = audioBuffer.numberOfChannels >= 2
    ? audioBuffer.getChannelData(1)
    : audioBuffer.getChannelData(0)  // 모노 폴백
  const CHUNK = 4096
  const sr = audioBuffer.sampleRate
  for (let offset = 0; offset < audioBuffer.length; offset += CHUNK) {
    const end = Math.min(offset + CHUNK, audioBuffer.length)
    const size = end - offset
    const planar = new Float32Array(size * 2)
    planar.set(ch0.subarray(offset, end), 0)
    planar.set(ch1.subarray(offset, end), size)
    const audioData = new AudioData({
      format: 'f32-planar',
      sampleRate: sr,
      numberOfFrames: size,
      numberOfChannels: 2,
      timestamp: Math.round((offset / sr) * 1_000_000),
      data: planar,
    })
    audioEncoder.encode(audioData)
    audioData.close()
  }
  await audioEncoder.flush()

  input.onProgress(95)
  muxer.finalize()
  return new Blob([target.buffer], { type: 'video/mp4' })
}

function findCurrentTrackIndex(boundaries: number[], timeSec: number): number {
  let idx = 0
  for (let i = 0; i < boundaries.length; i++) {
    if (boundaries[i] <= timeSec) idx = i
    else break
  }
  return idx
}
