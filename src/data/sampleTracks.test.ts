import { describe, it, expect } from 'vitest'
import { sampleTracks, waveformFor } from './sampleTracks'

describe('sampleTracks', () => {
  it('15개 트랙을 포함한다', () => {
    expect(sampleTracks).toHaveLength(15)
  })
  it('각 트랙이 0–1 범위의 waveform을 가진다', () => {
    sampleTracks.forEach(t => {
      expect(t.waveform.length).toBeGreaterThan(0)
      t.waveform.forEach(v => {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      })
    })
  })
})

describe('waveformFor', () => {
  it('기본 48개 바를 반환한다', () => {
    expect(waveformFor(1)).toHaveLength(48)
  })
  it('동일한 시드는 동일한 결과를 반환한다', () => {
    expect(waveformFor(7)).toEqual(waveformFor(7))
  })
})
