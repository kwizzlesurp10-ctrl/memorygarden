import '@testing-library/jest-dom'
import { vi } from 'vitest'

// React 19+ expects the test runner to opt into act() integration.
;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true

let blobNonce = 0
Object.defineProperty(URL, 'createObjectURL', {
  configurable: true,
  writable: true,
  value: vi.fn(() => `blob:vitest-mock-${(blobNonce += 1)}`),
})
Object.defineProperty(URL, 'revokeObjectURL', {
  configurable: true,
  writable: true,
  value: vi.fn(() => undefined),
})
