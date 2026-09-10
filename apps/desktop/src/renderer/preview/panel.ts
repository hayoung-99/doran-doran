/**
 * `main.tsx`(편집기)와 `studio.tsx`(촬영장)가 함께 쓰는 자잘한 것들.
 *
 * 둘 다 서로를 부르면 순환 참조가 생기므로(`import/no-cycle`), 공유하는 상수는
 * 따로 뗀 이 파일에 둔다.
 */

import type { TrackName } from '../pet/animations'

/** 신호에 붙은 여덟 트랙. 이름이 어긋나면 안 되므로 편집기·촬영장이 이 목록 하나만 본다. */
export const TRACKS: { name: TrackName; label: string; constant: string }[] = [
  { name: 'hop', label: '폴짝', constant: 'HOP_UNIT' },
  { name: 'dance', label: '춤', constant: 'DANCE_UNIT' },
  { name: 'twitch', label: '움찔', constant: 'TWITCH_UNIT' },
  { name: 'wave', label: '손 흔들기', constant: 'WAVE_UNIT' },
  { name: 'shy', label: '수줍음', constant: 'SHY_UNIT' },
  { name: 'sulk', label: '앙탈', constant: 'SULK_UNIT' },
  { name: 'doze', label: '잠들기', constant: 'DOZE_UNIT' },
  { name: 'wake', label: '깨어나기', constant: 'WAKE_UNIT' },
]

export const button = 'font-ui text-[13px] px-4 py-[7px] rounded-full border-0 cursor-pointer'
export const solid = `${button} bg-ink text-cream`
export const ghost = `${button} bg-line text-ink`
export const panelLabel = 'text-[11px] uppercase tracking-[0.09em] text-ink-soft'
