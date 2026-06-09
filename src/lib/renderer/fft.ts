// PCM 데이터에서 주파수 밴드 크기를 추출하는 Cooley-Tukey FFT 유틸리티

function fftInPlace(re: Float64Array, im: Float64Array): void {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len
    const wRe = Math.cos(ang)
    const wIm = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0
      for (let j = 0; j < len >> 1; j++) {
        const uRe = re[i + j], uIm = im[i + j]
        const vRe = re[i + j + (len >> 1)] * curRe - im[i + j + (len >> 1)] * curIm
        const vIm = re[i + j + (len >> 1)] * curIm + im[i + j + (len >> 1)] * curRe
        re[i + j] = uRe + vRe
        im[i + j] = uIm + vIm
        re[i + j + (len >> 1)] = uRe - vRe
        im[i + j + (len >> 1)] = uIm - vIm
        const tmp = curRe * wRe - curIm * wIm
        curIm = curRe * wIm + curIm * wRe
        curRe = tmp
      }
    }
  }
}

// Step2 AnalyserNode와 완전 동일한 파이프라인 — encodeWorker에서 사용
export function computeStep2Bands(
  pcmData: Float32Array,
  sampleOffset: number,
  sampleRate: number,
  numBands = 80,
  fftSize = 2048,
): Float32Array {
  const re = new Float64Array(fftSize)
  const im = new Float64Array(fftSize)
  for (let i = 0; i < fftSize; i++) {
    const idx = sampleOffset + i
    const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)))
    re[i] = (idx >= 0 && idx < pcmData.length ? pcmData[idx] : 0) * hann
  }
  fftInPlace(re, im)

  const bins = fftSize >> 1
  const nyq = sampleRate / 2
  const fMin = 30
  const fMax = Math.min(18000, nyq)

  const bands = new Float32Array(numBands)
  for (let b = 0; b < numBands; b++) {
    const lo = Math.max(0, Math.floor(fMin * Math.pow(fMax / fMin, b / numBands) / nyq * bins))
    const hi = Math.min(bins - 1, Math.ceil(fMin * Math.pow(fMax / fMin, (b + 1) / numBands) / nyq * bins))
    let s = 0, n = 0
    for (let j = lo; j <= hi; j++) {
      const mag = Math.sqrt(re[j] * re[j] + im[j] * im[j]) / fftSize
      const db = 20 * Math.log10(Math.max(1e-10, mag))
      // AnalyserNode 기본값(minDecibels=-100, maxDecibels=-30)과 동일 스케일
      s += Math.max(0, Math.min(1, (db + 100) / 70))
      n++
    }
    bands[b] = n > 0 ? s / n : 0
  }
  return bands
}

export function computeFrequencyBands(
  pcmData: Float32Array,
  sampleOffset: number,
  fftSize: number,
  numBands: number
): Float32Array {
  const re = new Float64Array(fftSize)
  const im = new Float64Array(fftSize)
  for (let i = 0; i < fftSize; i++) {
    const idx = sampleOffset + i
    const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)))
    re[i] = (idx >= 0 && idx < pcmData.length ? pcmData[idx] : 0) * hann
  }
  fftInPlace(re, im)

  const half = fftSize >> 1
  const bands = new Float32Array(numBands)

  // bin 2(~43Hz)부터 half-1까지 로그 스케일로 균등 분배
  // Math.pow(half, b/numBands) 방식은 저음 밴드 다수가 bin 1-2에 몰리는 문제가 있음
  const logMin = Math.log2(2)
  const logMax = Math.log2(half - 1)

  for (let b = 0; b < numBands; b++) {
    const lo = Math.max(2, Math.round(Math.pow(2, logMin + (logMax - logMin) * b / numBands)))
    const hi = Math.max(lo + 1, Math.round(Math.pow(2, logMin + (logMax - logMin) * (b + 1) / numBands)))
    // 평균 대신 최대값: 고음역 밴드는 bin 수백 개를 평균 내면 에너지가 희석됨
    let maxMag = 0
    for (let j = lo; j < hi && j < half; j++) {
      const mag = Math.sqrt(re[j] * re[j] + im[j] * im[j])
      if (mag > maxMag) maxMag = mag
    }
    const raw = maxMag / fftSize
    const db = 20 * Math.log10(Math.max(1e-10, raw))
    // AnalyserNode 기본값(minDecibels=-100, maxDecibels=-30)과 동일한 스케일로 정규화
    const norm = Math.max(0, Math.min(1, (db + 100) / 70))
    // 핑크 노이즈 보정: 고음역일수록 gain 강화 (1x→3x), max 전환으로 기존보다 작게
    const gain = 1 + (b / (numBands - 1)) * 2.5
    bands[b] = Math.min(1, norm * gain)
  }
  return bands
}
