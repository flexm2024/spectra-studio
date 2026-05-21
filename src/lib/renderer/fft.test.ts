// FFT 유틸리티 테스트
import { describe, it, expect } from 'vitest'
import { computeFrequencyBands } from './fft'

describe('computeFrequencyBands', () => {
  it('numBands 길이의 Float32Array를 반환한다', () => {
    const signal = new Float32Array(2048)
    const result = computeFrequencyBands(signal, 0, 2048, 16)
    expect(result).toHaveLength(16)
    expect(result).toBeInstanceOf(Float32Array)
  })

  it('무음 신호는 모든 밴드가 0에 가깝다', () => {
    const silence = new Float32Array(2048)
    const bands = computeFrequencyBands(silence, 0, 2048, 16)
    bands.forEach(b => expect(b).toBeCloseTo(0, 5))
  })

  it('정현파는 해당 주파수 구간 밴드에서 에너지가 가장 높다', () => {
    // 440Hz 정현파 — fftSize=2048, sampleRate=48000 기준 bin ~19 → log 밴드 6-7 근방
    const fftSize = 2048
    const signal = new Float32Array(fftSize)
    for (let i = 0; i < fftSize; i++) {
      signal[i] = Math.sin(2 * Math.PI * 440 * i / 48000)
    }
    const bands = computeFrequencyBands(signal, 0, fftSize, 16)
    let maxBand = 0
    for (let i = 1; i < bands.length; i++) {
      if (bands[i] > bands[maxBand]) maxBand = i
    }
    expect(maxBand).toBeGreaterThanOrEqual(4)
    expect(maxBand).toBeLessThanOrEqual(9)
  })

  it('범위 밖 sampleOffset도 예외 없이 처리한다', () => {
    const signal = new Float32Array(100)
    expect(() => computeFrequencyBands(signal, 5000, 2048, 16)).not.toThrow()
  })
})
