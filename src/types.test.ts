import { describe, it, expect } from 'vitest'
import type { Track, ProjectState } from './types'

describe('Track 타입', () => {
  it('필수 필드를 모두 가진 객체를 받아들인다', () => {
    const track: Track = {
      id: '1',
      title: '테스트 트랙',
      artist: '아티스트',
      duration: '2:30',
      durationSec: 150,
      tag: 'Pop',
      bpm: 120,
      src: '',
      waveform: [0.5, 0.3, 0.8],
    }
    expect(track.id).toBe('1')
    expect(track.durationSec).toBe(150)
  })
})
