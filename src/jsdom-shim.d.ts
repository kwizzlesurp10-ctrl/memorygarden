// Test-only helper (starter-mushroom-measure) uses jsdom without bundled types.
declare module 'jsdom' {
  export class JSDOM {
    constructor(html?: string, options?: Record<string, unknown>)
    window: Window & typeof globalThis
  }
}
