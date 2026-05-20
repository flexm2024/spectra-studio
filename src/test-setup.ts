import '@testing-library/jest-dom'

// jsdom에는 URL.createObjectURL / revokeObjectURL이 없으므로 스텁 정의
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = () => ''
}
if (typeof URL.revokeObjectURL === 'undefined') {
  URL.revokeObjectURL = () => {}
}
