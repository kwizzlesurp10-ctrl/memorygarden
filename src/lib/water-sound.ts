/**
 * Procedural Web Audio synthesizer for watering and splash chimes.
 * Generates an organic water trickle and resonant bell chime without audio asset dependencies.
 */
class WaterSoundEngine {
  private ctx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    return this.ctx
  }

  playWaterSfx(opts?: { pitch?: number; volume?: number }): void {
    const ctx = this.getContext()
    if (!ctx) return

    if (ctx.state === 'suspended') {
      void ctx.resume()
    }

    const now = ctx.currentTime
    const vol = opts?.volume ?? 0.35
    const pitch = opts?.pitch ?? 1.0

    // 1. Water Trickle / Splash (Filtered noise burst)
    const bufferSize = Math.floor(ctx.sampleRate * 0.45)
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }

    const noiseSource = ctx.createBufferSource()
    noiseSource.buffer = noiseBuffer

    const bandpass = ctx.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.setValueAtTime(800 * pitch, now)
    bandpass.frequency.exponentialRampToValueAtTime(320 * pitch, now + 0.45)
    bandpass.Q.setValueAtTime(3.5, now)

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(vol * 0.4, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

    noiseSource.connect(bandpass)
    bandpass.connect(noiseGain)
    noiseGain.connect(ctx.destination)

    noiseSource.start(now)
    noiseSource.stop(now + 0.46)

    // 2. Crystalline Droplet Chimes (Two soft decaying sine oscillators)
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const toneGain = ctx.createGain()

    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(880 * pitch, now)
    osc1.frequency.exponentialRampToValueAtTime(1046 * pitch, now + 0.08)

    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1320 * pitch, now)

    toneGain.gain.setValueAtTime(0.001, now)
    toneGain.gain.linearRampToValueAtTime(vol * 0.25, now + 0.04)
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6)

    osc1.connect(toneGain)
    osc2.connect(toneGain)
    toneGain.connect(ctx.destination)

    osc1.start(now + 0.02)
    osc1.stop(now + 0.65)
    osc2.start(now + 0.02)
    osc2.stop(now + 0.65)
  }

  playDewHarvestSfx(opts?: { volume?: number }): void {
    const ctx = this.getContext()
    if (!ctx) return

    if (ctx.state === 'suspended') {
      void ctx.resume()
    }

    const now = ctx.currentTime
    const vol = opts?.volume ?? 0.32

    // 3-note arpeggiated celestial crystal chime (C6 -> E6 -> G6)
    const freqs = [1046.5, 1318.5, 1567.98]
    freqs.forEach((freq, idx) => {
      const startT = now + idx * 0.07
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startT)
      osc.frequency.exponentialRampToValueAtTime(freq * 1.015, startT + 0.15)

      gain.gain.setValueAtTime(0.0001, startT)
      gain.gain.linearRampToValueAtTime(vol * 0.22, startT + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, startT + 0.85)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startT)
      osc.stop(startT + 0.9)
    })
  }
}

export const waterAudio = new WaterSoundEngine()
export function playWaterSfx(opts?: { pitch?: number; volume?: number }): void {
  waterAudio.playWaterSfx(opts)
}

export function playDewHarvestSfx(opts?: { volume?: number }): void {
  waterAudio.playDewHarvestSfx(opts)
}
