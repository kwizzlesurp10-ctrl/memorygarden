export interface Stick {
  x: number
  y: number
}

export interface KeyMotion {
  forward: number
  strafe: number
  turn: number
  sprint: boolean
  interact: boolean
}

const FORWARD_KEYS = new Set(['KeyW', 'ArrowUp', 'KeyZ'])
const BACK_KEYS = new Set(['KeyS', 'ArrowDown'])
const LEFT_KEYS = new Set(['KeyA', 'KeyQ'])
const RIGHT_KEYS = new Set(['KeyD'])
const TURN_LEFT = new Set(['ArrowLeft'])
const TURN_RIGHT = new Set(['ArrowRight'])
const SPRINT_KEYS = new Set(['ShiftLeft', 'ShiftRight'])
const INTERACT_KEYS = new Set(['KeyE', 'Enter'])

export function motionFromKeys(keys: ReadonlySet<string>): KeyMotion {
  let forward = 0
  let strafe = 0
  let turn = 0
  for (const code of keys) {
    if (FORWARD_KEYS.has(code)) forward += 1
    if (BACK_KEYS.has(code)) forward -= 1
    if (LEFT_KEYS.has(code)) strafe -= 1
    if (RIGHT_KEYS.has(code)) strafe += 1
    if (TURN_LEFT.has(code)) turn += 1
    if (TURN_RIGHT.has(code)) turn -= 1
  }
  return {
    forward: Math.max(-1, Math.min(1, forward)),
    strafe: Math.max(-1, Math.min(1, strafe)),
    turn: Math.max(-1, Math.min(1, turn)),
    sprint: [...SPRINT_KEYS].some((k) => keys.has(k)),
    interact: [...INTERACT_KEYS].some((k) => keys.has(k)),
  }
}

/** Merge keyboard + virtual stick. Stick y is forward (device up = +forward). */
export function mergeMotion(keys: KeyMotion, stick: Stick | null): KeyMotion {
  if (!stick) return keys
  return {
    forward: Math.max(-1, Math.min(1, keys.forward + stick.y)),
    strafe: Math.max(-1, Math.min(1, keys.strafe + stick.x)),
    turn: keys.turn,
    sprint: keys.sprint,
    interact: keys.interact,
  }
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}
