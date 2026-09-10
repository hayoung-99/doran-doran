/**
 * 촬영장의 계산 부분.
 *
 * `docs/design/character-capture-studio.md` 5.1 절에 적힌 목록을 그대로 따른다.
 */

import { describe, it, expect } from 'vitest'
import {
  POSE_LIMITS,
  SHOT_MIN,
  SHOT_MAX,
  clampPose,
  clampSize,
  shotFileName,
  poseSnippet,
} from '../src/renderer/preview/studio-shot'

describe('clampPose', () => {
  it('경계값은 그대로 둔다', () => {
    expect(clampPose({ yaw: 90, pitch: 45, roll: 60 })).toEqual({ yaw: 90, pitch: 45, roll: 60 })
    expect(clampPose({ yaw: -90, pitch: -45, roll: -60 })).toEqual({
      yaw: -90,
      pitch: -45,
      roll: -60,
    })
  })

  it('좌우로 돌리기를 ±90° 에서 자른다', () => {
    expect(clampPose({ yaw: 120, pitch: 0, roll: 0 }).yaw).toBe(POSE_LIMITS.yaw)
    expect(clampPose({ yaw: -120, pitch: 0, roll: 0 }).yaw).toBe(-POSE_LIMITS.yaw)
  })

  it('위아래로 돌리기를 ±45° 에서 자른다', () => {
    expect(clampPose({ yaw: 0, pitch: 90, roll: 0 }).pitch).toBe(POSE_LIMITS.pitch)
    expect(clampPose({ yaw: 0, pitch: -90, roll: 0 }).pitch).toBe(-POSE_LIMITS.pitch)
  })

  it('기울이기를 ±60° 에서 자른다', () => {
    expect(clampPose({ yaw: 0, pitch: 0, roll: 200 }).roll).toBe(POSE_LIMITS.roll)
    expect(clampPose({ yaw: 0, pitch: 0, roll: -200 }).roll).toBe(-POSE_LIMITS.roll)
  })

  it('범위 안의 값은 그대로 둔다', () => {
    expect(clampPose({ yaw: 12, pitch: -8, roll: 33 })).toEqual({ yaw: 12, pitch: -8, roll: 33 })
  })
})

describe('clampSize', () => {
  it('64 아래를 64 로 올린다', () => {
    expect(clampSize(1, 10)).toEqual({ width: SHOT_MIN, height: SHOT_MIN })
  })

  it('4096 위를 4096 으로 내린다', () => {
    expect(clampSize(5000, 8000)).toEqual({ width: SHOT_MAX, height: SHOT_MAX })
  })

  it('소수를 정수로 반올림한다', () => {
    expect(clampSize(800.6, 999.4)).toEqual({ width: 801, height: 999 })
  })

  it('NaN·0·음수를 성한 정수로 만든다', () => {
    expect(clampSize(NaN, 0)).toEqual({ width: SHOT_MIN, height: SHOT_MIN })
    expect(clampSize(-50, -1)).toEqual({ width: SHOT_MIN, height: SHOT_MIN })
  })
})

describe('shotFileName', () => {
  const at = new Date(2026, 0, 1, 14, 32, 7)

  it('음수 각도를 부호와 함께 적는다', () => {
    const name = shotFileName({
      species: 'cat',
      action: 'shy',
      degrees: { yaw: -12, pitch: 0, roll: -20 },
      width: 1600,
      height: 2000,
      at,
    })
    expect(name).toBe('cat-shy_1600x2000_y-12_p0_r-20_143207.png')
  })

  it('0 인 각도는 그대로 0 으로 적는다', () => {
    const name = shotFileName({
      species: 'duck',
      action: 'still',
      degrees: { yaw: 0, pitch: 0, roll: 0 },
      width: 800,
      height: 1000,
      at: new Date(2026, 0, 1, 14, 32, 55),
    })
    expect(name).toBe('duck-still_800x1000_y0_p0_r0_143255.png')
  })

  it('−11.5° 를 -12 로, 절반은 0 에서 먼 쪽으로 반올림한다', () => {
    const name = shotFileName({
      species: 'cat',
      action: 'still',
      degrees: { yaw: -11.5, pitch: 0, roll: 0 },
      width: 800,
      height: 1000,
      at,
    })
    expect(name).toContain('_y-12_')
  })

  it('파일 이름에 못 쓰는 글자(공백·/·:)를 만들지 않는다', () => {
    const name = shotFileName({
      species: 'weird sp/ecies:name',
      action: 'still',
      degrees: { yaw: 0, pitch: 0, roll: 0 },
      width: 800,
      height: 1000,
      at,
    })
    expect(name).not.toMatch(/[\s/:]/)
  })
})

describe('poseSnippet', () => {
  it('위아래가 0 이면 두 줄만 낸다 (yaw · roll)', () => {
    const snippet = poseSnippet({ yaw: -12, pitch: 0, roll: -20 })
    expect(snippet.split('\n')).toEqual(['yaw: -0.2094,', 'roll: -0.3491,'])
  })

  it('위아래가 0 이 아니면 경고 주석과 세 줄을 낸다', () => {
    const snippet = poseSnippet({ yaw: -12, pitch: 12, roll: -20 })
    const lines = snippet.split('\n')
    expect(lines[0]).toBe('// site-assets.ts 의 LAYOUTS 에는 위아래 각도를 넣는 자리가 없습니다.')
    expect(lines[1]).toBe('// 옮기려면 그쪽에 pitch 항목을 하나 만들어야 합니다.')
    expect(lines.slice(2)).toEqual(['pitch: 0.2094,', 'yaw: -0.2094,', 'roll: -0.3491,'])
  })
})
