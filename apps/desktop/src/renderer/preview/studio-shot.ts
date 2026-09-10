/**
 * 촬영장의 계산 부분.
 *
 * Three.js 도 DOM 도 부르지 않는 순수 함수만 둔다 — 각도를 자르고, 파일 이름을 짓고,
 * `site-assets.ts` 에 붙일 코드 조각을 만드는 일이 전부라서 브라우저 없이
 * `test/studio-shot.test.ts` 가 지킨다.
 */

import { round4 } from './keyframes'

/** 화면에 보여 주고 사람이 만지는 각도 — 도(°) 단위다. `Pose`(라디안)와는 다른 자리다. */
export interface PoseDegrees {
  yaw: number
  pitch: number
  roll: number
}

/** 손잡이가 허용하는 범위(도). 뒷모습은 찍지 않기로 해서 좌우가 ±90 에서 멈춘다. */
export const POSE_LIMITS = { yaw: 90, pitch: 45, roll: 60 } as const

export const SHOT_MIN = 64
export const SHOT_MAX = 4096

/**
 * 값을 `[min, max]` 사이로 자른다. `NaN` 은 0 으로 다룬다.
 *
 * 숫자 칸에 `-` 만 남기고 아직 다음 숫자를 안 적은 순간처럼, `Number(event.target.value)`
 * 가 `NaN` 을 내는 입력 도중 상태가 그대로 여기 들어올 수 있다. 가드가 없으면
 * `Math.max(min, NaN)` 이 그대로 `NaN` 을 돌려주고, 그 값이 `rotation.set()` 이나
 * 카메라 위치에 들어가는 순간 캐릭터가 화면에서 통째로 사라진다.
 */
export function clampNumber(value: number, min: number, max: number): number {
  const finite = Number.isFinite(value) ? value : 0
  return Math.min(max, Math.max(min, finite))
}

/** 범위 밖 값을 자른다. 슬라이더 옆 숫자 칸에 직접 적는 길이 있어서 필요하다. */
export function clampPose(degrees: PoseDegrees): PoseDegrees {
  return {
    yaw: clampNumber(degrees.yaw, -POSE_LIMITS.yaw, POSE_LIMITS.yaw),
    pitch: clampNumber(degrees.pitch, -POSE_LIMITS.pitch, POSE_LIMITS.pitch),
    roll: clampNumber(degrees.roll, -POSE_LIMITS.roll, POSE_LIMITS.roll),
  }
}

/** `NaN`·소수·범위 밖 값을 전부 64~4096 사이의 성한 정수로 만든다. */
function clampOneSize(value: number): number {
  // `NaN` 은 `clampNumber` 가 0 으로 다루지만, `Math.round(NaN)` 은 먼저 거치면 그대로
  // `NaN` 이라 순서를 지켜야 한다 — 자르고 나서 반올림한다.
  return Math.round(clampNumber(value, SHOT_MIN, SHOT_MAX))
}

/** 64~4096 정수로 자른다. `NaN`·0·음수도 여기서 걸린다 */
export function clampSize(width: number, height: number): { width: number; height: number } {
  return { width: clampOneSize(width), height: clampOneSize(height) }
}

/**
 * 절반 값을 0 에서 먼 쪽으로 반올림한다 (예: -11.5 → -12).
 *
 * `Math.round` 는 절반을 항상 +∞ 쪽으로 보내서(-11.5 → -11) 음수 각도가 화면에서
 * 보이는 크기보다 작게 찍힌다. 파일 이름은 "몇 도만큼 돌렸는지"를 그대로 옮겨 적는
 * 자리라 부호와 무관하게 크기가 커지는 쪽으로 반올림해야 한다.
 */
function roundAwayFromZero(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value)
}

/** 파일 이름에 쓰면 안 되는 글자(공백 · `/` · `:`)를 `-` 로 바꾼다 */
function safeToken(text: string): string {
  return text.replace(/[\s/:]+/g, '-')
}

/** 찍은 그림의 파일 이름 */
export function shotFileName(opts: {
  species: string
  action: string
  degrees: PoseDegrees
  width: number
  height: number
  at: Date
}): string {
  const yaw = roundAwayFromZero(opts.degrees.yaw)
  const pitch = roundAwayFromZero(opts.degrees.pitch)
  const roll = roundAwayFromZero(opts.degrees.roll)
  const hh = String(opts.at.getHours()).padStart(2, '0')
  const mm = String(opts.at.getMinutes()).padStart(2, '0')
  const ss = String(opts.at.getSeconds()).padStart(2, '0')
  const species = safeToken(opts.species)
  const action = safeToken(opts.action)
  return `${species}-${action}_${opts.width}x${opts.height}_y${yaw}_p${pitch}_r${roll}_${hh}${mm}${ss}.png`
}

/** 도(°) 를 라디안으로, 소수 넷째 자리까지 자른다. `preview/keyframes.ts` 의 `round4` 를 쓴다. */
function degreesToRadians4(degrees: number): number {
  return round4((degrees * Math.PI) / 180)
}

/** `site-assets.ts` 의 `LAYOUTS` 에 붙일 수 있는 라디안 코드 조각 */
export function poseSnippet(degrees: PoseDegrees): string {
  const yaw = degreesToRadians4(degrees.yaw)
  const pitch = degreesToRadians4(degrees.pitch)
  const roll = degreesToRadians4(degrees.roll)

  if (pitch === 0) {
    return [`yaw: ${yaw},`, `roll: ${roll},`].join('\n')
  }

  return [
    '// site-assets.ts 의 LAYOUTS 에는 위아래 각도를 넣는 자리가 없습니다.',
    '// 옮기려면 그쪽에 pitch 항목을 하나 만들어야 합니다.',
    `pitch: ${pitch},`,
    `yaw: ${yaw},`,
    `roll: ${roll},`,
  ].join('\n')
}
