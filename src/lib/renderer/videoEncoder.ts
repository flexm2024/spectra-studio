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
}

export async function encodeVideo(input: EncodeVideoInput): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const worker = new Worker(new URL('./encodeWorker.ts', import.meta.url), { type: 'module' })

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data as { type: string; pct?: number; buffer?: ArrayBuffer; message?: string }
      if (msg.type === 'progress' && msg.pct !== undefined) {
        input.onProgress(msg.pct)
      } else if (msg.type === 'done' && msg.buffer) {
        worker.terminate()
        resolve(new Blob([msg.buffer], { type: 'video/mp4' }))
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
    const transferables: Transferable[] = [input.ch0.buffer, input.ch1.buffer]
    const fib = input.frameInputBase
    if (fib.backgroundImage) transferables.push(fib.backgroundImage)
    if (fib.logoImage) transferables.push(fib.logoImage)
    if (fib.watermarkImage) transferables.push(fib.watermarkImage)
    fib.stickerImages.forEach(s => transferables.push(s))

    worker.postMessage(data, transferables)
  })
}
