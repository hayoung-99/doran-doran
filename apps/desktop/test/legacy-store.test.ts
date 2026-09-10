import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { legacyStorePaths } from '../src/main/legacy-store'

/**
 * 이름을 바꾸기 전 저장 파일을 찾아오는 자리.
 *
 * 이게 틀리면 이미 쓰던 사람이 세션을 잃고 방과 남남이 되는데, 그건 앱을 실제로
 * 배포해 봐야 드러난다. 그래서 자리를 정하는 계산만 따로 떼어 여기서 확인한다.
 */
describe('legacyStorePaths', () => {
  const APP_DATA = '/Users/x/Library/Application Support'

  it('옛 이름 세 자리를 가까운 것부터 가리킨다', () => {
    expect(legacyStorePaths(APP_DATA)).toEqual([
      path.join(APP_DATA, 'Buddling', 'buddling.json'),
      path.join(APP_DATA, 'buddling', 'buddling.json'),
      path.join(APP_DATA, 'tap-tap', 'tap-tap.json'),
    ])
  })

  it('개발용 프로필로 띄웠으면 옮겨 올 것이 없다', () => {
    expect(legacyStorePaths(APP_DATA, 'second')).toEqual([])
    expect(legacyStorePaths(APP_DATA, 'shot')).toEqual([])
  })

  it('프로필이 비어 있는 것은 프로필이 없는 것으로 본다', () => {
    for (const empty of ['', null, undefined]) {
      expect(legacyStorePaths('/tmp/appdata', empty)).not.toHaveLength(0)
    }
  })

  it('자리를 모르면 찾지 않는다', () => {
    expect(legacyStorePaths('')).toEqual([])
  })
})
