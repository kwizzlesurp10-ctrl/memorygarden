import type { Season, WeatherType } from './types'
import {
  type AmbientGardenParams,
  type DayPeriod,
  computeAmbientGardenParams,
} from './ambient-garden-params'

/**
 * Very quiet generative bed: brown-ish noise + two soft sines.
 * Designed to sit under the UI without demanding licensed audio assets.
 */
export class GardenAmbientEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noiseSource: AudioBufferSourceNode | null = null
  private noiseGain: GainNode | null = null
  private noiseFilter: BiquadFilterNode | null = null
  private oscA: OscillatorNode | null = null
  private oscB: OscillatorNode | null = null
  private toneGain: GainNode | null = null
  private running = false
  private built = false

  async start(params: AmbientGardenParams): Promise<boolean> {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return false
      this.ctx = new Ctx()
    }

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume()
      } catch {
        return false
      }
    }

    if (!this.built) {
      this.buildGraph()
    }

    this.running = true
    this.rampMaster(params.masterLinear, 2.8)
    this.applyParams(params, 2.4)
    return this.ctx.state === 'running'
  }

  stop(fadeSeconds = 1.2): void {
    this.running = false
    if (!this.ctx || !this.master) return
    const now = this.ctx.currentTime
    const g = this.master.gain
    g.cancelScheduledValues(now)
    g.setValueAtTime(g.value, now)
    g.linearRampToValueAtTime(0.0001, now + fadeSeconds)
  }

  update(params: AmbientGardenParams): void {
    if (!this.running || !this.ctx) return
    this.applyParams(params, 3.5)
    this.rampMaster(params.masterLinear, 3.5)
  }

  dispose(): void {
    this.stop(0.05)
    try {
      this.noiseSource?.stop()
    } catch {
      // ignore
    }
    this.noiseSource?.disconnect()
    this.noiseFilter?.disconnect()
    this.noiseGain?.disconnect()
    this.oscA?.stop()
    this.oscB?.stop()
    this.oscA?.disconnect()
    this.oscB?.disconnect()
    this.toneGain?.disconnect()
    this.master?.disconnect()
    void this.ctx?.close()

    this.ctx = null
    this.master = null
    this.noiseSource = null
    this.noiseGain = null
    this.noiseFilter = null
    this.oscA = null
    this.oscB = null
    this.toneGain = null
    this.built = false
    this.running = false
  }

  private buildGraph(): void {
    if (!this.ctx) return

    const ctx = this.ctx
    this.master = ctx.createGain()
    this.master.gain.value = 0

    const noiseBuf = this.makeBrownNoiseBuffer(ctx, 2)
    this.noiseSource = ctx.createBufferSource()
    this.noiseSource.buffer = noiseBuf
    this.noiseSource.loop = true

    this.noiseFilter = ctx.createBiquadFilter()
    this.noiseFilter.type = 'lowpass'
    this.noiseFilter.frequency.value = 1800

    this.noiseGain = ctx.createGain()
    this.noiseGain.gain.value = 0

    this.noiseSource.connect(this.noiseFilter)
    this.noiseFilter.connect(this.noiseGain)
    this.noiseGain.connect(this.master)

    this.oscA = ctx.createOscillator()
    this.oscB = ctx.createOscillator()
    this.oscA.type = 'sine'
    this.oscB.type = 'sine'
    this.oscA.frequency.value = 196
    this.oscB.frequency.value = 293.66

    this.toneGain = ctx.createGain()
    this.toneGain.gain.value = 0

    this.oscA.connect(this.toneGain)
    this.oscB.connect(this.toneGain)
    this.toneGain.connect(this.master)

    this.master.connect(ctx.destination)

    this.oscA.start()
    this.oscB.start()
    this.noiseSource.start()

    this.built = true
  }

  private makeBrownNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const sampleRate = ctx.sampleRate
    const frames = Math.floor(sampleRate * seconds)
    const buffer = ctx.createBuffer(1, frames, sampleRate)
    const data = buffer.getChannelData(0)
    let brown = 0
    for (let i = 0; i < frames; i++) {
      const white = Math.random() * 2 - 1
      brown = brown * 0.985 + white * 0.04
      data[i] = brown * 0.28
    }
    return buffer
  }

  private rampMaster(target: number, overSec: number): void {
    if (!this.ctx || !this.master) return
    const now = this.ctx.currentTime
    const g = this.master.gain
    const cleanTarget = Math.max(0.0001, target)
    g.cancelScheduledValues(now)
    g.setValueAtTime(g.value, now)
    g.linearRampToValueAtTime(cleanTarget, now + overSec)
  }

  private applyParams(p: AmbientGardenParams, overSec: number): void {
    if (!this.ctx || !this.noiseGain || !this.toneGain || !this.noiseFilter || !this.oscA || !this.oscB) return
    const now = this.ctx.currentTime
    const end = now + overSec

    this.ramp(this.noiseGain.gain, p.noiseGain, now, end)
    this.ramp(this.toneGain.gain, p.toneGain, now, end)
    this.ramp(this.noiseFilter.frequency, p.lowpassHz, now, end)
    this.ramp(this.oscA.frequency, p.rootHz, now, end)
    this.ramp(this.oscB.frequency, p.harmonicHz, now, end)
  }

  private ramp(param: AudioParam, value: number, t0: number, t1: number): void {
    param.cancelScheduledValues(t0)
    param.setValueAtTime(param.value, t0)
    param.linearRampToValueAtTime(value, t1)
  }
}

export function ambientParamsFromGarden(
  season: Season,
  period: DayPeriod,
  weather: WeatherType,
  memoryCount: number,
): AmbientGardenParams {
  const intensity01 = memoryCount <= 0 ? 0.15 : Math.min(1, memoryCount / 24)
  return computeAmbientGardenParams(season, period, weather, intensity01)
}
