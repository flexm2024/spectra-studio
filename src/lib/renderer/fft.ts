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
  for (let b = 0; b < numBands; b++) {
    const lo = Math.max(1, Math.round(Math.pow(half, b / numBands)))
    const hi = Math.max(lo + 1, Math.round(Math.pow(half, (b + 1) / numBands)))
    let sum = 0, count = 0
    for (let j = lo; j < hi && j < half; j++) {
      sum += Math.sqrt(re[j] * re[j] + im[j] * im[j])
      count++
    }
    bands[b] = count > 0 ? (sum / count) / fftSize : 0
  }
  return bands
}
