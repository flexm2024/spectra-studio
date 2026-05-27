// WebCodecs + mp4-muxer 인코딩을 Web Worker로 위임하는 셸

import type { DrawFrameInput } from './frameRenderer'
import type { Track } from '../../types'

export interface EncodeVideoInput {
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
  onProgress: (pct: number) => void
  onPreview?: (bitmap: ImageBitmap) => void
}

export async function encodeVideo(input: EncodeVideoInput): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const worker = new Worker(new URL('./encodeWorker.ts', import.meta.url), { type: 'module' })

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data as { type: string; pct?: number; blob?: Blob; message?: string }
      if (msg.type === 'progress' && msg.pct !== undefined) {
        input.onProgress(msg.pct)
      } else if (msg.type === 'preview' && msg.bitmap) {
        input.onPreview?.(msg.bitmap as ImageBitmap)
      } else if (msg.type === 'done' && msg.blob) {
        worker.terminate()
        resolve(msg.blob)
      } else if (msg.type === 'error') {
        worker.terminate()
        reject(new Error(msg.message ?? 'Worker 인코딩 오류'))
      }
    }

    worker.onerror = (e) => {
      worker.terminate()
      reject(new Error(e.message))
    }

    // onProgress는 직렬화 불가 → 제외하고 전송
    const { onProgress: _, ...data } = input

    // ImageBitmap + Float32Array 버퍼를 Worker로 소유권 이전 (zero-copy)
    // 모노 폴백 시 ch0.buffer === ch1.buffer — 중복 transfer 방지
    const transferables: Transferable[] = [input.ch0.buffer]
    if (input.ch1.buffer !== input.ch0.buffer) transferables.push(input.ch1.buffer)
    const fib = input.frameInputBase
    if (fib.backgroundImage) transferables.push(fib.backgroundImage)
    if (fib.logoImage) transferables.push(fib.logoImage)
    if (fib.watermarkImage) transferables.push(fib.watermarkImage)
    fib.stickerImages.forEach(s => transferables.push(s))

    worker.postMessage(data, transferables)
  })
}
