// 샘플 트랙 데이터 및 파형 생성 유틸리티
import type { Track } from '../types'

export const waveformFor = (seed: number, count = 48): number[] => {
  const bars: number[] = []
  let s = seed * 9301 + 49297
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280
    const v = s / 233280
    const pos = i / (count - 1)
    const env = 0.45 + 0.55 * Math.sin(pos * Math.PI)
    bars.push(Math.min(1, Math.max(0, 0.25 + v * 0.7 * env)))
  }
  return bars
}

const parseDuration = (dur: string): number => {
  const [m, s] = dur.split(':').map(Number)
  return m * 60 + s
}

const RAW = [
  { id: '1',  title: '가을의 시작',             artist: 'Aria Sound',   dur: '2:11', tag: 'Acoustic',  bpm: 84  },
  { id: '2',  title: '단풍 길에서',             artist: 'Nuvo',         dur: '2:42', tag: 'Lo-fi',     bpm: 76  },
  { id: '3',  title: '스쳐간 바람처럼',         artist: 'Hana Lee',     dur: '2:38', tag: 'Acoustic',  bpm: 92  },
  { id: '4',  title: '밤하늘 별에게 쓰는 편지', artist: 'Moon Drift',   dur: '2:53', tag: 'Ambient',   bpm: 68  },
  { id: '5',  title: '잊혀지지 않는 향기',     artist: 'Soobin',       dur: '2:36', tag: 'Indie Pop', bpm: 102 },
  { id: '6',  title: '그리움 한 스푼',         artist: 'Café Lumière', dur: '2:37', tag: 'Jazz',      bpm: 88  },
  { id: '7',  title: '비 오는 날의 창가',     artist: 'Eunha',        dur: '2:16', tag: 'Piano',     bpm: 72  },
  { id: '8',  title: '다시 만날 계절',         artist: 'Aria Sound',   dur: '2:32', tag: 'Acoustic',  bpm: 96  },
  { id: '9',  title: '늦가을의 오후',          artist: 'Stillwater',   dur: '2:43', tag: 'Lo-fi',     bpm: 80  },
  { id: '10', title: '우리의 비밀 정원',       artist: 'Hana Lee',     dur: '3:24', tag: 'Indie Pop', bpm: 110 },
  { id: '11', title: '차가운 손을 잡고',       artist: 'Moon Drift',   dur: '2:09', tag: 'Ambient',   bpm: 64  },
  { id: '12', title: '시계태엽 감기',          artist: 'Soobin',       dur: '2:29', tag: 'Jazz',      bpm: 94  },
  { id: '13', title: '마지막 잎새의 고백',     artist: 'Eunha',        dur: '2:19', tag: 'Piano',     bpm: 70  },
  { id: '14', title: '편지를 부치고',          artist: 'Café Lumière', dur: '2:09', tag: 'Acoustic',  bpm: 86  },
  { id: '15', title: '다가올 겨울에게',        artist: 'Stillwater',   dur: '2:24', tag: 'Ambient',   bpm: 60  },
]

export const sampleTracks: Track[] = RAW.map((r, i) => ({
  id: r.id,
  title: r.title,
  artist: r.artist,
  duration: r.dur,
  durationSec: parseDuration(r.dur),
  tag: r.tag,
  bpm: r.bpm,
  src: '',
  waveform: waveformFor(i + 1),
}))
