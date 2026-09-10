/**
 * 이름을 바꾸기 전 (tap-tap → Buddling → SimSim Friends) 에 쓰던 저장 파일이
 * 어디 있었는지.
 *
 * Electron 은 userData 폴더를 **앱 이름으로** 잡는다. 그래서 이름을 바꾸면 폴더가
 * 통째로 새로 생기고, 그 안에 있던 것들 — 무엇보다 **세션** — 을 못 찾는다. 이 앱에서
 * 세션은 곧 신원이라, 잃으면 속해 있던 방과 남남이 되고 되찾는 길은 초대코드로 다시
 * 들어오는 것뿐이다. 이름 하나 바꾼 것치고는 너무 큰 값이다.
 *
 * 그래서 새 파일이 아직 없을 때 **딱 한 번** 옛 파일을 후보 목록에서 가까운 것부터
 * 읽어 새 자리에 옮겨 적는다. 그 뒤로는 새 파일만 본다.
 *
 * 개발용 프로필(`SIMSIM_PROFILE`)로 띄운 것은 `app.setPath` 로 아예 다른 자리를 쓰므로
 * 옮겨 올 것이 없다. 그때는 빈 배열을 돌려준다.
 */

import path from 'node:path'

/**
 * 이름을 바꿀 때마다 한 줄이 붙는다. **가까운 것부터** 적는다.
 *
 * 순서가 계약이다 — tap-tap → Buddling 을 거친 사람은 옛 폴더가 둘 다 있는데,
 * 최신 짐은 `Buddling` 쪽에 있다. 가까운 것부터 보지 않으면 옛 짐으로 덮어쓴다.
 */
const LEGACY_STORES: ReadonlyArray<readonly [directory: string, file: string]> = [
  // 포장한 앱이 쓰던 자리. `build.productName` 이 `Buddling` 이라 대문자다.
  ['Buddling', 'buddling.json'],
  // 개발로 띄운 앱이 쓰던 자리. 그때는 `package.json` 의 `name` 이 소문자였다.
  // macOS·Windows 는 위 줄과 같은 폴더지만 **리눅스는 구별한다.**
  ['buddling', 'buddling.json'],
  // 첫 이름.
  ['tap-tap', 'tap-tap.json'],
]

/**
 * @param appDataDir 운영체제가 앱마다 폴더를 만들어 주는 자리 (`app.getPath('appData')`)
 * @param profile 개발용 프로필 이름. 있으면 옮겨 올 것이 없다
 */
export function legacyStorePaths(appDataDir: string, profile?: string | null): string[] {
  if (!appDataDir) return []
  if (profile) return []

  return LEGACY_STORES.map(([directory, file]) => path.join(appDataDir, directory, file))
}
