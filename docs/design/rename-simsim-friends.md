# 이름을 SimSim Friends 로 — 개발 설계

**근거 문서** [PRODUCT.md](../PRODUCT.md) 의 **"부르는 말은 언어마다 다르다"** 절
(제품 이름 표: 한국어·영어는 `SimSim Friends`, 일본어 `ひまとも`, 중국어 `闲闲朋友`)와
**"알고 둔 선택 → 이름을 바꿀 때는 사람 눈에 안 보이는 이름까지 바꾼다"** 절의 여섯
줄짜리 표. 이 문서는 그 정의를 **어떻게 만들지**만 적습니다. 왜 그렇게 정했는지는
기획서에 있고, 둘이 어긋나 보이면 **기획서가 이깁니다.**

읽는 순서는 [CLAUDE.md](../../CLAUDE.md) → [DEVELOPMENT.md](../DEVELOPMENT.md) →
[PRODUCT.md](../PRODUCT.md) → 이 문서입니다.

---

## 한 줄

**사람이 읽는 이름·컴퓨터만 보는 이름·워크스페이스 이름을 한 번에 새 이름으로
옮기고, 그 대가로 끊기는 유일한 것(쓰던 사람의 신원)은 `legacy-store.ts` 의 후보
목록을 한 칸 늘려 이어 줍니다.** 지난 기록(CHANGELOG·기능별 설계 문서)은 손대지
않습니다.

```
  이름이 붙어 있는 자리          이번에            근거
  ─────────────────────────────────────────────────────────────
  앱 안의 글씨 (네 언어)         전부 새 이름      기획서 "부르는 말은…"
  창 제목                        t('app.name')     같음 (ja·zh 가 갈리므로)
  홈페이지·받는 파일 이름        전부 새 이름      기획서 표 1행
  appId · productName            함께 바꿈         기획서 표 2행
  워크스페이스 이름 · 패키지     함께 바꿈         같음
  저장 폴더·저장 파일            함께 바뀜(자동)   ─
    └ 그 안의 신원               ★ 이어 준다       기획서 표 3행
  CHANGELOG · docs/design/*      그대로            기획서 표 4행
  DB 표·칸 이름                  그대로            기획서 표 5행
  옛 홈페이지 주소               살려 두지 않음    기획서 표 6행
```

### 저장 자리는 이렇게 이어집니다

```
  ~/Library/Application Support/
  ├── tap-tap/tap-tap.json        ← 첫 이름 (후보 ③)
  ├── Buddling/buddling.json      ← 포장한 앱이 쓰던 자리 (후보 ①)
  ├── buddling/buddling.json      ← 개발로 띄운 앱이 쓰던 자리 (후보 ②)
  ├── SimSim Friends/simsim-friends.json   ← 새 자리 (포장한 앱)
  └── simsim-friends/simsim-friends.json   ← 새 자리 (개발로 띄운 앱)

  load() 순서:  새 자리 → 후보 ① → 후보 ② → 후보 ③
                 └ 새 자리가 없을 때만 후보를 본다. 하나라도 읽히면
                   그 자리에서 새 자리로 옮겨 적고(write()) 끝낸다.
```

---

## 1. 새 이름들 — 확정된 값

**이 표가 이 문서의 계약입니다.** 아래 값 말고 다른 표기를 쓰지 마세요
(`simsim friends` · `SimsimFriends` · `simsim_friends` 전부 아닙니다).

| 자리 | 지금 | 새로 |
|---|---|---|
| 표시 이름 (ko·en) | `Buddling` | `SimSim Friends` |
| 표시 이름 (ja) | `Buddling` | `ひまとも` |
| 표시 이름 (zh) | `Buddling` | `闲闲朋友` |
| GitHub 레포 | `hayoung-99/buddling` | `hayoung-99/simsim-friends` |
| 홈페이지 주소 | `https://buddling.vercel.app` | `https://simsim-friends.vercel.app` |
| 루트 워크스페이스 | `buddling-workspace` | `simsim-friends-workspace` |
| 앱 워크스페이스 | `buddling` | `simsim-friends` |
| 랜딩 워크스페이스 | `@buddling/web` | `@simsim-friends/web` |
| 공유 패키지 | `@buddling/shared` | `@simsim-friends/shared` |
| `build.appId` | `com.taptap.desktop` | `com.simsimfriends.desktop` |
| `build.productName` | `Buddling` | `SimSim Friends` |
| 설치 파일 접두어 | `buddling-` | `simsim-friends-` |
| `electronApp.setName()` | `'Buddling'` | `'SimSim Friends'` |
| 저장 파일 이름 | `buddling.json` | `simsim-friends.json` |
| 환경변수 접두어 | `BUDDLING_` | `SIMSIM_` |
| 로그 접두어 | `[buddling]` | `[simsim-friends]` |
| 릴리스 제목 | `Buddling ${TAG}` | `SimSim Friends ${TAG}` |
| release-please `package-name` | `buddling` | `simsim-friends` |
| 자동 업데이트가 보는 레포 | `hayoung-99/buddling` | `hayoung-99/simsim-friends` |
| GitHub API user-agent | `buddling-desktop` | `simsim-friends-desktop` |
| pg_cron 작업 | `buddling-cleanup-*` | `simsim-friends-cleanup-*` |
| 방 이름 안전망 | `'buddling'` | `'simsim-friends'` |

### 1.1 `appId` 를 `com.simsimfriends.desktop` 으로 정한 이유

옛 값이 `com.taptap.desktop` 이었습니다. **`tap-tap` 의 하이픈을 뺀 형태**라, 같은
규칙을 그대로 이어 빈칸을 뺀 `simsimfriends` 로 갑니다. 하이픈을 넣은
`com.simsim-friends.desktop` 도 macOS 번들 식별자로는 유효하지만, 이 값은 Windows
설치 프로그램이 레지스트리 열쇠와 설치 폴더를 만들 때도 쓰이므로 **글자 종류를 늘리지
않는 편**이 안전하고, 무엇보다 옛 값이 이미 정해 둔 규칙과 어긋나면 다음 사람이 어느
쪽이 규칙인지 알 수 없습니다.

소유하지 않은 도메인을 역순으로 적는 것은 옛 값도 같았습니다(`taptap` 도 우리 것이
아니었습니다). 이 값은 도메인 소유를 주장하는 자리가 아니라 **한 컴퓨터 안에서 앱을
구별하는 열쇠**라, 관례만 지키면 됩니다.

### 1.2 환경변수 접두어를 `SIMSIM_` 으로 줄인 이유

`SIMSIM_FRIENDS_` 로 적으면 눈으로 확인할 때 쓰는 한 줄이 이렇게 됩니다.

```bash
SIMSIM_FRIENDS_PROFILE=shot SIMSIM_FRIENDS_FAKE_NET=1 SIMSIM_FRIENDS_CAPTURE=.preview/x ...
```

접두어만 화면 절반을 먹습니다. `BUDDLING_` 이 그랬듯 **제품 이름을 짧게 딴 접두어**로
충분하고, 이 저장소 안에서 `SIMSIM_` 과 다툴 이름은 없습니다.

**그리고 이 접두어는 반드시 이번에 함께 훑어야 합니다.** 지금 `.gitignore` 10번째 줄에
`TAPTAP_CAPTURE` 가 남아 있습니다 — 두 번째 이름으로 넘어올 때 아무도 훑지 않아서
**두 세대 전 이름이 아직 거기 있습니다.** 이번에는 훑고, 5장의 `grep` 관문으로 남은
것이 없음을 확인합니다.

---

## 2. 순서 — 무엇을 먼저 하는가

이 일은 순서를 틀리면 중간 상태가 컴파일되지 않거나, 코드가 존재하지 않는 이름을
가리키는 채로 `main` 에 들어갑니다.

```
 0. nvm use && npm ci                    ← 지나쳐 온 dependabot 커밋 맞추기
 1. gh repo rename simsim-friends        ← ★ 제일 먼저 (사용자 승인 받음)
    git remote set-url origin ...
 2. 브랜치: feat/rename-simsim-friends
 3. 워크스페이스·패키지 이름 + tsconfig paths + import 경로 (한 커밋)
    npm install  → package-lock.json 다시 만들어짐
 4. 신원 이사 (legacy-store.ts · store.ts · 테스트)
 5. 네 언어 사전 + 창 제목
 6. 눈에 안 보이는 이름 (appId · productName · setName · 환경변수 · 로그)
 7. 홈페이지 (주소·문구·구조화 데이터·llms.txt·robots)
 8. 문서 (README · DEVELOPMENT · RELEASE · SUPABASE_SETUP · release-notes · CLAUDE)
 9. 그림 (og.png 다시 뜨기 · 앱 창 사진 두 장 다시 찍기)
10. supabase/schema.sql 고치고 → 사용자에게 넘김
11. 검증 (5장) → PR
```

### 2.1 GitHub 레포 이름을 **제일 먼저** 바꾸는 이유

사용자가 이 실행을 명시적으로 허락했습니다. 그런데 **먼저 바꿔야** 하는 이유가 따로
있습니다.

- 코드 세 곳(`build.publish.repo` · `update-check.ts` 의 `REPO` · `lib/site.ts` 의
  `REPO`)이 레포 이름을 적어 둡니다. 이름을 나중에 바꾸면, 그 사이 `main` 에는
  **아직 없는 레포를 가리키는 코드**가 들어갑니다. 릴리스는 `--publish always` 로
  `build.publish.repo` 를 그대로 믿기 때문에, 그 상태로 태그가 밀리면 **설치 파일이
  어디로도 올라가지 않습니다.**
- 반대로 먼저 바꿔도 잃는 것이 없습니다. GitHub 은 옛 이름으로 오는 git 요청과
  웹 주소를 새 이름으로 이어 줍니다. 규칙셋(ruleset)도 레포에 붙어 있어서 이름과
  함께 따라오고, 필수 검사 이름(`check`)은 잡 이름이라 바뀌지 않습니다.

```bash
gh repo rename simsim-friends                      # hayoung-99/buddling → hayoung-99/simsim-friends
git remote set-url origin https://github.com/hayoung-99/simsim-friends.git
gh api repos/hayoung-99/simsim-friends/rulesets     # main protection 이 살아 있는지 확인
```

**`git remote set-url` 은 이 worktree 만의 일이 아닙니다.** worktree 는 본 저장소의
`.git` 을 함께 쓰므로 `remote.origin.url` 도 공유됩니다. 즉 이 한 줄이 본 저장소와
다른 worktree 에도 함께 걸립니다 — 그게 맞는 동작이고, 설령 다른 세션이 옛 주소를 든
채 밀어도 GitHub 이 이어 주므로 깨지지 않습니다.

### 2.2 워크스페이스 이름을 바꿀 때는 `npm install` 입니다 (여기만 예외)

CLAUDE.md 는 `npm install` 을 쓰지 말라고 합니다 — lockfile 을 다시 써서 손대지도
않은 줄이 커밋에 딸려 들어가기 때문입니다. **그런데 이번에는 패키지 이름 자체가
바뀌므로 lockfile 을 다시 쓰는 것이 목적입니다.** `npm ci` 는 옛 이름이 적힌 lockfile
그대로 설치하려 들어 실패합니다.

```bash
nvm use && node -v && npm -v     # 22.23.2 / 10.9.8 이어야 한다
npm install                      # 이름이 바뀐 워크스페이스 링크를 다시 건다
git diff --stat package-lock.json
```

**diff 를 눈으로 확인하세요.** `name` 과 워크스페이스 링크 줄만 바뀌어야 합니다.
optional 패키지의 `libc` 항목이 통째로 지워지는 식의 변화가 섞였으면 npm 버전이 다른
것이므로, `.nvmrc` 의 Node 로 다시 하세요.

끝에 **`rm -rf node_modules && npm ci`** 를 한 번 더 돌려, 새로 쓴 lockfile 만으로도
설치가 되는지 확인합니다(CI 가 하는 일과 같습니다).

---

## 3. 파일별로 무엇을 바꾸나

### 3.1 워크스페이스와 의존 관계

| 파일 | 무엇 |
|---|---|
| `package.json` (루트) | `name` · `description` · `repository.url` · `homepage`, 그리고 모든 스크립트의 `-w buddling` → `-w simsim-friends`, `-w @buddling/web` → `-w @simsim-friends/web` |
| `packages/shared/package.json` | `name` → `@simsim-friends/shared` |
| `apps/web/package.json` | `name` · `description` · 의존성 열쇠 `@buddling/shared` |
| `apps/desktop/package.json` | `name` · `repository.url` · `homepage` · devDependencies 열쇠, 스크립트의 `BUDDLING_PROFILE`, 그리고 `build` 블록 전체 (`appId` · `productName` · `publish[0].repo` · `mac`/`nsis`/`linux` 의 `artifactName` 세 개) |
| `tsconfig.base.json` | `paths` 의 `"@buddling/shared/*"` 열쇠 |
| `release-please-config.json` | `package-name`, 그리고 `//태그` 주석 안의 예시 `buddling-v0.1.0` |

**`electron` 의 정확한 버전 표기(`44.0.0`, 캐럿 없음)를 건드리지 마세요.** 캐럿을
붙이면 `npm run dist` 가 `Cannot compute electron version` 으로 통째로 멈춥니다.

**`@buddling/shared` 가 `devDependencies` 에 있는 것도 그대로입니다.** 번들에 녹아들어
런타임에 부르지 않기 때문입니다.

`release-please` 의 `package-name` 은 **PR 제목과 변경 목록에만** 쓰입니다. 태그는
`include-component-in-tag: false` 라 `v{버전}` 이고, 이전 릴리스는
`.release-please-manifest.json` 의 경로 열쇠(`apps/desktop`)로 찾으므로 이 값을 바꿔도
릴리스 계보가 끊기지 않습니다.

### 3.2 import 경로 (56개 파일)

`@buddling/shared` → `@simsim-friends/shared` 기계적 치환입니다. **`tsconfig.base.json`
의 `paths` 를 함께 고쳤다면 `npm run typecheck` 가 빠뜨린 것을 전부 잡습니다** — 옛
이름은 어디에도 해석되지 않으므로 조용히 넘어갈 수 없습니다. 이게 이 단계의 안전망이니
치환과 `paths` 수정을 같은 커밋에 두세요.

`packages/shared/package.json` 의 `exports` 하위 경로는 그대로입니다.

### 3.3 신원 이사 — `legacy-store.ts` · `store.ts`

**이 절이 이 작업에서 유일하게 되돌릴 수 없는 자리입니다.** 틀리면 쓰던 사람이 속해
있던 방과 남남이 되고, 되찾는 길은 초대코드를 다시 받는 것뿐입니다.

`legacy-store.ts` 를 **후보 하나에서 후보 목록으로** 넓힙니다.

```ts
/** 이름을 바꿀 때마다 한 줄이 붙는다. **가까운 것부터** 적는다. */
const LEGACY_STORES: ReadonlyArray<readonly [directory: string, file: string]> = [
  // 포장한 앱이 쓰던 자리. `build.productName` 이 `Buddling` 이라 대문자다.
  ['Buddling', 'buddling.json'],
  // 개발로 띄운 앱이 쓰던 자리. 그때는 `package.json` 의 `name` 이 소문자였다.
  // macOS·Windows 는 위 줄과 같은 폴더지만 **리눅스는 구별한다.**
  ['buddling', 'buddling.json'],
  // 첫 이름.
  ['tap-tap', 'tap-tap.json'],
]

export function legacyStorePaths(appDataDir: string, profile?: string | null): string[] {
  if (!appDataDir) return []
  if (profile) return []

  return LEGACY_STORES.map(([directory, file]) => path.join(appDataDir, directory, file))
}
```

- **함수 이름을 복수로 바꿉니다**(`legacyStorePath` → `legacyStorePaths`). 부르는 쪽이
  한 곳뿐이라 이름을 남겨 둘 이유가 없고, 이름이 단수로 남아 있으면 다음에 이름을 또
  바꿀 사람이 "한 자리만 보면 되는구나" 로 읽습니다.
- **순서가 계약입니다.** tap-tap → Buddling 을 거친 사람은 옛 폴더가 **둘 다** 있는데,
  최신 짐은 `Buddling` 쪽에 있습니다. 가까운 것부터 보지 않으면 옛 짐으로 덮어씁니다.
- **개발용 프로필이면 빈 배열**입니다(지금과 같음). `app.setPath` 로 아예 다른 자리를
  쓰므로 옮겨 올 것이 없습니다.

`store.ts` 의 `load()` 는 파일 이름과 후보 목록만 바뀝니다.

```ts
function load() {
  filePath = path.join(app.getPath('userData'), 'simsim-friends.json')

  const legacy = legacyStorePaths(app.getPath('appData'), process.env.SIMSIM_PROFILE)

  for (const candidate of [filePath, ...legacy]) {
    try {
      state = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(candidate, 'utf8')) }
      if (candidate !== filePath) write()
      return state
    } catch {
      // 다음 후보를 본다. 전부 없으면 처음 켠 것이다.
    }
  }

  state = { ...DEFAULTS }
  return state
}
```

`if (!candidate) continue` 는 이제 필요 없습니다(배열에 `null` 이 섞이지 않습니다).
`write()` 가 부르는 `writeJsonAtomically` 는 상위 폴더를 스스로 만듭니다.

**새 자리는 포장한 앱과 개발로 띄운 앱이 갈립니다** — `SimSim Friends` 와
`simsim-friends`. 지금은 `Buddling`·`buddling` 이라 macOS 에서 대소문자 구별이 없어
우연히 한 폴더였지만, 이제는 빈칸과 하이픈이 달라 **정말로 다른 폴더**가 됩니다.
잃는 것은 없습니다 — 둘 다 첫 실행 때 위 후보에서 짐을 옮겨 오고, 개발 자리는 어차피
버리는 자리입니다. 이걸 다시 겹치게 만들려면 `apps/desktop/package.json` 에 최상위
`productName` 을 넣는 길이 있는데, 그러면 `setName()` 이 필요한 이유
([quit-fully-terminates.md](quit-fully-terminates.md) 5장)가 통째로 달라지므로 **이번에
건드리지 않습니다.**

`test/legacy-store.test.ts` 를 다시 씁니다.

```ts
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
```

**순서를 `toEqual` 배열로 못 박는 것이 핵심입니다.** 순서가 곧 규칙이므로 집합으로
검사하면 이 테스트가 지킬 것이 없어집니다.

### 3.4 네 언어 사전

`packages/shared/src/i18n/{ko,en,ja,zh}.json` **네 개를 함께** 고칩니다. 브랜드가 든
열쇠는 네 개뿐입니다.

| 열쇠 | ko | en | ja | zh |
|---|---|---|---|---|
| `app.name` | `SimSim Friends` | `SimSim Friends` | `ひまとも` | `闲闲朋友` |
| `app.quit` | `SimSim Friends 종료` | `Quit SimSim Friends` | `ひまともを終了` | `退出闲闲朋友` |
| `settings.powerHint` | 첫 낱말만 교체 | 같음 | 같음 | 같음 |
| `settings.languageHint` | 첫 낱말만 교체 | 같음 | 같음 | 같음 |

**한국어는 조사를 붙여 씁니다** (사용자가 확정: 띄우지 않습니다).

```
"settings.powerHint":    "SimSim Friends는 컴퓨터를 끌 때까지 계속 떠 있어요. …"
"settings.languageHint": "SimSim Friends가 쓰는 말이에요. 멤버에게는 각자 고른 말로 보여요."
```

`은/는`·`이/가` 는 **적힌 글자가 아니라 읽는 소리**로 갈립니다. `Friends` 는
"프렌즈" 로 읽혀 모음으로 끝나므로 `는`·`가` 입니다 (`은`·`이` 가 아닙니다).

일본어·중국어 힌트 문장은 브랜드 자리만 새 이름으로 바꾸고 나머지 문장은 그대로
둡니다. `app.quit` 만 각 말의 꼴을 따릅니다 — 일본어는 조사 `を`, 중국어는 `退出` 이
앞에 옵니다.

`test/i18n.test.ts` 가 빠진 열쇠·남는 열쇠·`{빈칸}` 불일치·빈 문장을 잡습니다.
**브랜드 문자열을 직접 검사하는 테스트는 없습니다** — 새로 만들지도 않습니다. 사전에
무슨 이름이 들어가는지는 기획서가 정하는 값이고, 테스트가 그걸 못 박으면 다음에 이름을
바꿀 때 고칠 자리가 하나 늘어날 뿐입니다.

### 3.5 창 제목을 사전에서 가져옵니다

**이 변경은 이번 리네이밍이 만든 문제입니다.** 지금까지는 네 사전의 `app.name` 이 모두
`Buddling` 이라 `windows.ts` 에 박아 둔 `'Buddling'` 과 어긋날 일이 없었습니다. 이제
일본어·중국어가 갈리므로, 박아 두면 **일본어 사용자의 창 제목만 영어 이름**이 됩니다.

`apps/desktop/src/main/windows.ts` 의 여섯 자리를 `t('app.name')` 으로 바꿉니다.

```ts
import { t } from './i18n'
```

| 창 | 지금 | 새로 | 보이는가 |
|---|---|---|---|
| 캐릭터 | `'Buddling'` | `t('app.name')` | 안 보임 (프레임 없는 투명 창) |
| 크기 패널 | `'Buddling 크기'` | `t('app.name')` | 안 보임 (`frame: false` · `skipTaskbar`) |
| 설정 | `'Buddling'` | `t('app.name')` | Windows·Linux 만 |
| 알림 | `'Buddling'` | `t('app.name')` | 같음 |
| 방 목록 | `'Buddling'` | `t('app.name')` | 같음 |
| 방 상세 | `'Buddling'` | `t('app.name')` | 같음 |

- **크기 패널의 ` 크기` 접미어는 버립니다.** 이 창은 프레임이 없고 작업 표시줄에도
  안 나와서 그 글자가 보이는 자리가 없습니다. 유지하려면 네 언어에 열쇠를 하나 더
  만들어야 하는데, 아무도 못 보는 문장에 사전 네 줄을 쓰는 것은 값이 맞지 않습니다.
- **`windows.ts` → `./i18n` 은 순환이 아닙니다.** `i18n.ts` 는 `@simsim-friends/shared/i18n`
  만 부릅니다. 혹시 순환이 생기면 `oxlint` 의 `import/no-cycle` 이 잡습니다.
- **제목은 창을 만들 때 한 번만 정해집니다.** 앱을 켜 둔 채 설정에서 말을 바꾸면 이미
  열려 있는 창의 제목은 그대로 남고, 그다음에 새로 여는 창부터 바뀝니다. macOS 에서는
  이 제목이 아예 안 보이는 자리라 이 정도로 둡니다 — 8장에 남깁니다.

### 3.6 눈에 안 보이는 이름

**`apps/desktop/src/main/main.ts`**

```ts
// userData 를 못 박는 두 줄은 순서까지 그대로 둔다 (이름을 바꾸기 전에 못 박아야 한다)
const userDataDir = electronApp.getPath('userData')
electronApp.setPath(
  'userData',
  process.env.SIMSIM_PROFILE ? `${userDataDir}-${process.env.SIMSIM_PROFILE}` : userDataDir,
)

electronApp.setName('SimSim Friends')
```

**`setName()` 은 사전에서 가져오지 않습니다.** 이 줄은 모듈 최상위, 즉 `ready` 도 오기
전에 돕니다. 그 시점에는 아직 저장 파일을 읽지 않아 "이 사람이 무슨 말을 쓰는지" 를
모르고, `electronApp.getLocale()` 도 `ready` 전에는 믿을 수 없습니다. 알아내려고
`store.load()` 를 이 위로 끌어올리면 **위 두 줄과 순서가 얽혀 신원을 잃는 쪽으로
떨어질 수 있습니다** — 이 작업에서 가장 지켜야 할 것이라 손대지 않습니다.

그래서 macOS 메뉴 막대·About 창의 이름은 네 언어와 무관하게 `SimSim Friends` 입니다.
**플랫폼별로 보면 어긋나 보이지 않습니다** — macOS 는 창 제목이 숨겨져 있어 메뉴
막대만 보이고, Windows·Linux 에는 그 메뉴 막대가 없어 창 제목만 보입니다. 8장에
남깁니다.

같은 파일의 나머지: 주석 첫 줄, `SIMSIM_PROFILE`(3곳), `SIMSIM_METRICS`,
`SIMSIM_DEBUG`, `console.error('[simsim-friends] …')`,
`dialog.showErrorBox('SimSim Friends 오류', …)`.

오류 상자의 문구는 **사전으로 옮기지 않습니다.** `SIMSIM_DEBUG` 일 때만 뜨는
개발용이고, 개발자만 보는 문장에 네 언어를 만드는 것은 규칙 2 가 지키려던 것과 다릅니다.

**그 밖의 파일**

| 파일 | 무엇 |
|---|---|
| `src/main/update-check.ts` | `REPO = 'hayoung-99/simsim-friends'`, user-agent `simsim-friends-desktop` |
| `src/main/updates.ts` · `src/main/store.ts` | `console.error('[simsim-friends] …')` |
| `src/main/dev-capture.ts` | 환경변수 전부 (`SIMSIM_*`) — 맨 위 주석 목록까지 |
| `src/main/tray.ts` · `windows.ts` · `metrics.ts` · `legacy-store.ts` · `ipc.ts` | 환경변수·주석 |
| `src/services/net.ts` · `fake-net.ts` | `SIMSIM_FAKE_NET`, 주석 |
| `scripts/make-site-images.js` · `scripts/preview.js` | 주석의 환경변수, 창 제목 |
| `src/renderer/*/index.html` · `team/detail.html` (9개) | `<title>` |
| `src/renderer/assets/fonts/LICENSE-Hakgyoansim…txt` | 8번째 줄의 "Buddling 은 이 파일을…" |
| `test/updates.test.ts` | AppImage 경로 예시 문자열 |
| `.github/workflows/release.yml` | `gh release edit --title "SimSim Friends ${TAG}"` |
| `.gitignore` | 10번째 줄 주석의 `TAPTAP_CAPTURE` → `SIMSIM_CAPTURE` |

**이미 나간 0.9.0 은 옛 레포를 계속 봅니다.** GitHub 이 이어 주므로 새 버전 확인은
그대로 되지만, `appId` 가 달라졌으므로 **새 버전으로 갈아타지는 않습니다.** 기획서가
정한 값이고 지금은 쓰는 사람이 없어서 낼 수 있는 값입니다.

### 3.7 홈페이지

| 파일 | 무엇 |
|---|---|
| `apps/web/lib/site.ts` | `BRAND` · `SITE_URL` · `REPO`, 그리고 `BRAND` 위의 주석 |
| `apps/web/lib/copy.ko.tsx` · `copy.en.tsx` | 브랜드 문구, 그리고 **손으로 적어 둔 GitHub 주소** |
| `apps/web/components/SiteFooter.tsx` | **손으로 적어 둔 GitHub 주소** |
| `apps/web/app/(admin)/layout.tsx` · `components/admin/AdminApp.tsx` | 어드민 제목 (3곳) |
| `apps/web/app/globals.css` | 파일 머리 주석 첫 줄 |
| `apps/web/public/llms.txt` | 아래 3.7.2 |
| `apps/web/public/robots.txt` | 첫 줄 주석 · `llms.txt` 안내 · `Sitemap:` 주소 |
| `apps/web/DESIGN.md` · `apps/web/.impeccable/design.json` | 제목과 예시 파일 이름 |

**`'use client'` 를 새로 들이지 마세요.** 이번 변경에 자바스크립트가 필요한 자리는
없습니다. `scripts/check-site.js` 가 190KB 한도로 지킵니다.

#### 3.7.1 손으로 적어 둔 주소를 한 곳으로 모읍니다

`SiteFooter.tsx` 와 두 카피 파일이 `https://github.com/hayoung-99/buddling…` 을 문자
그대로 적어 두고 있습니다. `lib/site.ts` 는 **"도메인을 바꿀 때 고칠 곳은 여기 하나"**
라고 적어 두었는데 실제로는 세 곳이 더 있었던 것이고, **그래서 이번 리네이밍이 그
세 곳을 따로 찾아다녀야 합니다.** 이번에 상수로 바꿔 그 약속을 실제로 지키게 합니다.

```tsx
import { REPO_URL, RELEASES_PAGE } from '@/lib/site'   // 경로 별칭은 그 파일들이 쓰는 방식을 따르세요
```

이것은 리네이밍에 딸린 정리이지 별건이 아닙니다 — 그냥 두면 **다음에 이름을 바꿀 때
같은 자리를 또 찾아다니게** 됩니다.

#### 3.7.2 `llms.txt` 의 이름 문단은 옛 이름을 **적어 둡니다**

지금 이렇게 적혀 있습니다.

> The name is one coined word, always capitalised: Buddling (buddy + -ling, a small
> friend). It is written the same way in every language, and it was called tap-tap
> until August 2026.

세 가지가 전부 틀리게 됩니다 — 낱말 수, 말마다 같은 표기라는 것, 옛 이름 목록.
**여기는 옛 이름을 지우는 자리가 아닙니다.** 이 파일을 읽는 것은 기계이고, 옛 이름과
새 이름을 잇지 못하면 **예전에 색인해 둔 것과 이 제품이 남남**이 됩니다. 이렇게
고칩니다(뜻만 지키면 문장은 다듬어도 됩니다).

> The name is two capitalised words: SimSim Friends. Korean and English use it
> verbatim; Japanese and Chinese use names coined in those languages — ひまとも
> and 闲闲朋友 — rather than transliterations. It was called tap-tap until August
> 2026 and Buddling until September 2026.

`## Pages` · `## Source` 의 주소도 새 주소·새 레포로 바꿉니다.

#### 3.7.3 `BRAND` 주석은 근거가 달라집니다

지금은 *"만들어 낸 한 낱말이라 나라말마다 갈리지 않는다"* 라고 적혀 있습니다. 이제
갈립니다. 주석을 이렇게 고칩니다 — **값이 하나인 이유가 바뀌었을 뿐 값은 여전히
하나입니다.**

> 랜딩은 한국어와 영어뿐이고, 그 두 말은 같은 표기를 쓴다(기획서 "부르는 말은 언어마다
> 다르다"). 일본어·중국어 이름은 앱 안에만 있다. 여기서 갈라 두면 구조화 데이터와
> `og:site_name` 이 페이지마다 달라져 검색엔진이 둘로 잡는다.

### 3.8 그림 — 글씨를 고쳐서 되지 않는 자리

**앱 창 안에 이름이 실제로 그려져 있습니다.** `TeamList` · `TeamDetail` · `Settings` ·
`Notifications` 네 화면의 머리에 `t('app.name')` 이 들어갑니다. 그래서 랜딩에 걸린
방 목록 창 사진에 **옛 이름이 박혀 있습니다.**

| 그림 | 어떻게 |
|---|---|
| `apps/web/public/assets/og.png` | `src/renderer/site-assets/index.html` 의 `.mark` 를 새 이름으로 고친 뒤 `npm run site-images -- og` |
| `team-window.webp` · `team-window-en.webp` | **앱을 실제로 띄워 다시 찍습니다** (아래) |
| `hero-cat` · `characters` · `duo-*` · `peek-*` | 캐릭터만 그리므로 그대로 |
| `icon-32.png` · `icon-180.png` · `build/icon.*` | 이름을 그리지 않으므로 그대로 |

```bash
# 한국어
SIMSIM_FAKE_NET=1 SIMSIM_PROFILE=shot SIMSIM_CAPTURE=.preview/ko \
  SIMSIM_SEED="나오리와 친구들:나영" SIMSIM_LANG=ko npm start
cp .preview/ko/team.png apps/web/public/assets/team-window.png

# 영어
SIMSIM_FAKE_NET=1 SIMSIM_PROFILE=shot SIMSIM_CAPTURE=.preview/en \
  SIMSIM_SEED="Naori & friends:Nayoung" SIMSIM_LANG=en npm start
cp .preview/en/team.png apps/web/public/assets/team-window-en.png

npm run site-images -- --webp-only     # 랜딩이 거는 것은 WebP 다
rm apps/web/public/assets/team-window*.png
```

**두 장을 함께 찍어야 합니다.** 한쪽만 새로 찍으면 한국어 페이지와 영어 페이지가 서로
다른 이름의 앱을 보여 줍니다. 예시 방 이름 `나오리와 친구들` 은 그대로 둡니다(사용자
확정) — 새 이름과 "friends" 가 겹치는 것은 알고 두는 것입니다.

**끝나면 메인 프로세스를 먼저 죽이고 `.preview/` 를 지우세요.** 순서가 뒤바뀌면
예약된 저장이 사라진 폴더에 쓰려다 오류창이 뜹니다. `SIMSIM_PROFILE` 은
`app.setPath` 로 걸려 명령줄에 `--user-data-dir` 이 없으므로,
`pkill -f "simsim-friends/node_modules/electron"` 처럼 저장소 경로로 찾으세요.

### 3.9 자료를 보관하는 곳 — `supabase/schema.sql`

**이 파일은 이 worktree 안에 없습니다.** `.gitignore` 가 `supabase/` 를 통째로 막고
있어서 본 저장소에만 있습니다.

```
/Users/nahayeong/Desktop/alice/buddling/supabase/schema.sql
```

worktree 안에서 상대경로로 찾으면 없습니다. **본 저장소의 그 파일을 직접 고치고,
커밋하지 않습니다**(추적되지 않는 파일입니다).

고칠 곳 네 군데입니다.

1. **1번째 줄** — `-- Buddling 데이터베이스 스키마`
2. **287번째 줄 — 방 이름 안전망** `coalesce(nullif(trim(p_name), ''), 'buddling')` →
   `'simsim-friends'`. 앱은 언제나 이름을 채워 보내므로(`renderer/team/default-name.ts`)
   이 값은 **그 기능이 없던 옛 앱을 위한 안전망**이고 어느 나라 말도 아닙니다.
   **같은 값이 세 곳에 있습니다** — `schema.sql` · `services/fake-net.ts` ·
   `test/net.test.ts` 의 기대값. 셋을 함께 고치세요.
3. **1322~1361번째 줄 — 예약 작업 이름**. 아래 3.9.1.
4. **`raise notice '[buddling] …'` 두 줄** → `[simsim-friends]`

#### 3.9.1 예약 작업 이름 옮기기 — 옛 이름을 **둘 다** 걷어냅니다

지금 블록은 옛 이름 `tap-tap-cleanup-anonymous` 를 걷어내고 `buddling-*` 두 개를 새로
겁니다. 이제 **걷어낼 옛 이름이 셋**이 됩니다.

```sql
-- **예약 작업 이름을 `buddling-` 에서 `simsim-friends-` 로 옮긴다.** "새 이름을 하나 더
-- 거는 것" 이 아니라 **이름 옮기기**다 — 옛 이름을 먼저 걷어내지 않으면 옛 작업과
-- 새 작업이 둘 다 남아 같은 정리가 하루에 두 번 돈다. 이름을 두 번 바꿨으므로
-- 걷어낼 옛 이름도 두 세대다.
do $$
declare
  v_stale text;
begin
  begin
    execute 'create extension if not exists pg_cron';
  exception when others then
    raise notice '[simsim-friends] pg_cron 을 켜지 못해 자동 정리를 걸지 않았습니다 (%). 대시보드 Database → Extensions 에서 켠 뒤 이 파일을 다시 실행하세요. 나머지 설정은 모두 적용됐습니다.', sqlerrm;
    return;
  end;

  -- 1) 옛 이름을 세대별로 걷어낸다. 새 이름도 함께 걷어낸다 —
  --    이 파일은 여러 번 실행해도 안전해야 한다.
  foreach v_stale in array array[
    'tap-tap-cleanup-anonymous',
    'buddling-cleanup-anonymous',
    'buddling-cleanup-team-events',
    'simsim-friends-cleanup-anonymous',
    'simsim-friends-cleanup-team-events'
  ] loop
    if exists (select 1 from cron.job where jobname = v_stale) then
      perform cron.unschedule(v_stale);
    end if;
  end loop;

  -- 2) 새 이름으로 다시 건다. 도는 SQL 과 시각(하루 한 번, 한국 시간 새벽 3시 =
  --    UTC 18시)은 그대로다 — 바뀌는 것은 이름뿐이다.
  perform cron.schedule(
    'simsim-friends-cleanup-anonymous',
    '0 18 * * *',
    $cron$select public.cleanup_anonymous_users()$cron$
  );
  perform cron.schedule(
    'simsim-friends-cleanup-team-events',
    '0 18 * * *',
    $cron$select public.cleanup_team_events()$cron$
  );

  raise notice '[simsim-friends] 익명 계정·알림 자동 정리를 매일 UTC 18시에 걸었습니다.';
end;
$$;
```

`foreach … in array` 는 `declare` 가 필요하므로 블록 머리에 `v_stale text` 를
더했습니다. **`if exists` 검사를 빼지 마세요** — `cron.unschedule()` 은 없는 이름에
예외를 던지고, 이 블록은 파일 맨 마지막이라 여기서 멈추면 안내 문구도 안 나옵니다.

**옛 이름 다섯 줄을 앞으로도 지우지 마세요.** 어느 프로젝트에 어느 세대의 작업이
걸려 있는지 파일만 봐서는 알 수 없고, 하나라도 남으면 같은 정리가 하루에 두 번
돕니다.

#### 3.9.2 사용자에게 넘기는 것

이 저장소 규칙상 **에이전트가 대신 실행할 수 없습니다.** 이렇게 부탁합니다.

1. **Supabase 콘솔 → SQL Editor** 에 고친 `supabase/schema.sql` **전체**를 붙여넣고
   한 번 실행. 이 파일은 여러 번 실행해도 안전하게 되어 있습니다
   (`create or replace` · `if exists` · 예약 작업 걷어내기).
2. 실행 뒤 마지막 안내가 `[simsim-friends] 익명 계정·알림 자동 정리를 …` 로 나오는지
   확인. `pg_cron` 안내가 뜨면 **Database → Extensions** 에서 켠 뒤 다시 실행.
3. 예약 작업이 둘만 남았는지 확인.

```sql
select jobname, schedule, command from cron.job order by jobname;
-- simsim-friends-cleanup-anonymous   · 0 18 * * *
-- simsim-friends-cleanup-team-events · 0 18 * * *
-- 옛 이름이 하나라도 남아 있으면 같은 정리가 하루에 두 번 돕니다.
```

4. **Supabase 프로젝트 표시 이름**(대시보드 → Settings → General)도 새 이름으로.
   코드로는 할 수 없는 자리입니다. **표·칸 이름은 그대로 둡니다**(기획서 표 5행).

### 3.10 문서 — 지금 상태와 지난 기록을 가릅니다

**이 절의 규칙이 이 문서에서 가장 오래 남을 부분입니다.** 다음에 이름을 바꿀 사람이
문서를 어디까지 고쳐야 하는지 여기서 정합니다.

| 문서 | 원칙 |
|---|---|
| `README.md` · `docs/DEVELOPMENT.md` · `docs/RELEASE.md` · `docs/SUPABASE_SETUP.md` · `docs/release-notes.md` · `apps/web/DESIGN.md` | **지금 상태**를 적은 문서다 → 전부 새 이름으로 |
| `CLAUDE.md` | 갈라서 다룬다 (아래 3.10.1) |
| `docs/BACKLOG.md` | 이번 항목만 손댄다 (7장) |
| `apps/desktop/CHANGELOG.md` | **손대지 않는다.** 옛 이름으로 나간 릴리스의 기록이고, 안에 든 비교 링크도 GitHub 이 이어 준다 |
| `docs/design/*.md` (6개) | **손대지 않는다** (아래 3.10.2) |

macOS 앱 이름에 **빈칸이 들어갑니다.** `docs/release-notes.md` 와 `docs/RELEASE.md` 의
`xattr` 안내를 반드시 따옴표로 감싸세요.

```bash
xattr -cr "/Applications/SimSim Friends.app"     # 따옴표가 없으면 두 낱말로 갈린다
```

`docs/RELEASE.md` 213번째 줄은 지금 따옴표가 **없습니다** — 옛 이름에 빈칸이 없어서
아무 표도 안 났던 자리입니다. 그리고 `artifactName` 이 `${productName}` 을 쓰지 않는
이유(빈칸이 주소에서 `%20` 이 됨)가 이제 진짜로 성립합니다 — 그 문단을 새 이름 기준으로
다시 적으세요.

`docs/release-notes.md` 는 **릴리스 워크플로가 실제로 읽습니다**(`sed` 로 `{version}`
을 채워 릴리스 본문으로 씁니다). 설치 파일 이름 네 줄을 반드시 새 접두어로 고치세요.

#### 3.10.1 `CLAUDE.md` — 과거는 남기고 지금만 고칩니다

세 종류가 섞여 있습니다.

1. **지금의 관례** — `-w buddling`, 어드민 주소, `gh api …/rulesets` 경로, 환경변수
   예시, `pkill` 경로. → **새 이름으로 고칩니다.**
2. **과거 전환의 기록** — "밟기 쉬운 함정" 의 *"이름을 바꿔도 그대로 둔 것이 둘
   있습니다"* 표, pg_cron 이름을 옮긴 사례, release-please 로 shared 를 묶으려던 세
   시도. → **한 글자도 고치지 않습니다.** 고치면 일어나지 않은 일을 적는 셈입니다.
3. **이번 전환** — 2번 바로 뒤에 **이어 붙입니다.**

2번 표의 `appId` 줄은 이번에 **뜻이 뒤집힙니다.** 지우지 말고, 그 표는 그대로 둔 뒤
아래 내용을 이어 붙이세요(문장은 그 파일의 톤으로 다듬으세요).

- 2026-09 에 `Buddling` 에서 **SimSim Friends** 로 옮기면서, 그 표가 "바꾸지 말라"
  고 적어 두었던 `appId` 를 **실제로 바꿨습니다**(`com.taptap.desktop` →
  `com.simsimfriends.desktop`). 근거는 기획서의 "이름을 바꿀 때는 사람 눈에 안 보이는
  이름까지 바꾼다" 절이고, **쓰는 사람이 없을 때만 낼 수 있는 값**이라는 조건이
  거기 적혀 있습니다. 그래서 이미 깔린 앱은 새 버전을 업데이트가 아니라 다른 앱으로
  봅니다.
- `productName` 이 `Buddling` → `SimSim Friends` 가 되면서 userData 폴더가 또 새로
  생깁니다. `main/legacy-store.ts` 의 후보 목록이 **이제 세 자리**를 봅니다
  (`Buddling` · `buddling` · `tap-tap`). **이 파일을 지우면 그 이사가 사라집니다.**
- `productName` 에 **빈칸이 실제로 들어갔습니다.** `artifactName` 을 따로 정하는
  이유가 이제 진짜입니다. macOS 앱 경로를 명령줄에 적을 때는 따옴표가 필요합니다.
- `apps/desktop/CHANGELOG.md` 는 **이번에도 그대로 둡니다.**
- `docs/design/*.md` 안의 `BUDDLING_*` 환경변수와 `buddling-*` 파일 이름은
  **옛 이름입니다** (3.10.2).

#### 3.10.2 `docs/design/*.md` — 문서를 다시 쓰지 않고 안내 한 줄을 둡니다

여섯 문서에 `BUDDLING_*` 환경변수, `buddling-…AppImage` 같은 산출물 이름,
`npm install -w buddling` 같은 명령이 흩어져 있습니다. `notifications-screen.md`
1.5절은 **"예약 작업 이름을 `buddling-` 으로 옮깁니다"** 라는 제목의 절 자체입니다.

**손대지 않습니다.** 두 가지 이유입니다.

- 이 문서들은 "그때 이렇게 만들기로 했다" 는 기록입니다. 서술을 새 이름으로 덮으면
  `notifications-screen.md` 1.5절은 **일어나지 않은 일**을 적게 됩니다.
- 명령줄만 골라 고치는 것도 답이 아닙니다. 그러면 한 문서 안에서 서술은 옛 이름,
  명령은 새 이름이 되어 **읽는 사람이 어느 쪽을 믿어야 할지 모릅니다.**

대신 `docs/DEVELOPMENT.md` 의 설계 문서 목록 바로 아래에 **안내 한 줄**을 둡니다.
여섯 문서를 다시 쓰는 것보다 이 편이 정직하고, 다음에 이름을 바꿀 때도 이 한 줄만
손보면 됩니다.

---

## 4. 하지 않는 것

| 안 하는 것 | 왜 |
|---|---|
| `apps/desktop/CHANGELOG.md` 고치기 | 옛 이름으로 나간 릴리스의 기록. 고치면 역사를 바꾸는 셈 |
| `docs/design/*.md` 고치기 | 같음 (3.10.2) |
| DB 표·칸 이름 옮기기 | 기획서 표 5행. `teams`·`team_id` 는 그대로 — 사용자가 볼 일이 없고 옮기는 값만 크다 |
| 옛 홈페이지 주소 살려 두기 | 기획서 표 6행. 살려 두면 "두 이름" 이 주소에서 되살아난다 (사용자 확정) |
| 예시 방 이름 `나오리와 친구들` 바꾸기 | 사용자 확정. 새 이름과 "friends" 가 겹치는 것은 알고 둔다 |
| macOS 메뉴 막대 이름을 사전에서 가져오기 | 3.6. 알아내려면 신원을 잃을 위험이 있는 순서 변경이 따라온다 |
| 창 제목이 실시간으로 말을 따라가게 하기 | 3.5. macOS 에서는 안 보이는 자리 |
| `apps/desktop/package.json` 에 최상위 `productName` 넣기 | 3.3. 개발 자리와 포장 자리를 다시 겹치게 하지만, `setName()` 의 근거가 통째로 달라진다 |
| 카피 파일의 브랜드 문구를 `BRAND` 상수로 바꾸기 | 이 저장소는 **나라말을 카피 파일에만** 둔다. 문구는 거기 있는 것이 맞다 (주소는 다르다 — 3.7.1) |
| 사전의 브랜드 문자열을 검사하는 테스트 추가 | 3.4. 이름은 기획서가 정하는 값. 테스트가 못 박으면 다음 리네이밍에 고칠 자리가 하나 늘 뿐 |
| 릴리스를 내보내기 | 릴리스는 release-please 가 만든 PR 을 사람이 머지할 때 일어난다 |

---

## 5. 무엇을 검사하나

### 5.1 CI 가 미는 것마다 도는 다섯

```bash
npm test              # i18n 사전 정합성 · legacy-store 순서 · net 안전망 이름
npm run typecheck     # @simsim-friends/shared 로 안 바꾼 import 를 전부 잡는다
npm run lint          # 환경변수 이름을 바꾸다 남긴 것 (no-undef · overrides)
npm run build         # 화면 · preload · 메인 세 벌
npm run check:site    # canonical · robots · sitemap · CSP · 190KB 한도
```

**`npm run typecheck` 가 이 작업의 주 안전망입니다.** `tsconfig.base.json` 의 `paths`
를 새 이름으로 바꾸면 옛 이름은 어디에도 해석되지 않으므로, 56개 파일 중 하나라도
빠뜨리면 여기서 반드시 걸립니다.

**`npm test` 가 반드시 잡아야 하는 셋**

| 테스트 | 무엇을 지키나 |
|---|---|
| `test/i18n.test.ts` | 네 사전 중 하나만 고쳤을 때 |
| `test/legacy-store.test.ts` | 후보 순서가 뒤집혔을 때 (옛 짐으로 덮어씀) |
| `test/net.test.ts` | 방 이름 안전망이 세 곳에서 어긋났을 때 |
| `test/session.test.ts` | 흔적 남기는 주기와 어드민 측정 창의 1:2 짝 (건드리지 않으므로 그대로 통과해야 한다) |

### 5.2 lockfile 이 스스로 서는지

```bash
rm -rf node_modules && npm ci     # 새로 쓴 lockfile 만으로 설치가 되는지
```

CI 는 미는 것마다 새로 설치하므로 여기서 안 보면 **"CI 는 되는데 로컬만 깨진다"** 로
한참 뒤에 나타납니다.

### 5.3 옛 이름이 남았는지 — `grep` 관문

```bash
grep -ril "buddling" --exclude-dir=node_modules --exclude-dir=.next \
  --exclude-dir=dist-main --exclude-dir=dist-renderer --exclude-dir=dist-preload .
```

**아래 다섯 곳 말고 아무것도 나오지 않아야 합니다.** 하나라도 더 나오면 빠뜨린
것입니다.

| 남아도 되는 곳 | 왜 |
|---|---|
| `apps/desktop/CHANGELOG.md` | 릴리스 역사 (4장) |
| `docs/design/*.md` (이 문서 제외) | 그때의 설계 기록 (3.10.2) |
| `CLAUDE.md` | 과거 전환을 설명하는 문단 + 이번 전환이 옛 이름을 언급하는 자리 (3.10.1) |
| `apps/web/public/llms.txt` | 옛 이름 두 세대를 일부러 적어 둔다 (3.7.2) |
| `docs/BACKLOG.md` · `docs/design/rename-simsim-friends.md` | 이번 전환을 설명하는 자리 |

`package-lock.json` · `docs/PRODUCT.md` 에는 **하나도 남지 않아야** 합니다.

`BUDDLING_` 과 `taptap` 도 같은 방식으로 훑습니다. `tap-tap` 은 위 다섯 곳과
`legacy-store.ts`·`legacy-store.test.ts`(후보 ③) 에만 남습니다.

### 5.4 눈으로 하는 확인 — 이것 없이는 끝난 것이 아닙니다

```bash
SIMSIM_PROFILE=shot SIMSIM_FAKE_NET=1 SIMSIM_CAPTURE=.preview/rename \
  SIMSIM_SEED="나오리와 친구들:나영" SIMSIM_SETTINGS=1 SIMSIM_LANG=ko npm start
# 같은 줄을 SIMSIM_LANG=en · ja · zh 로 네 번
```

1. 네 언어로 **방 목록 · 방 상세 · 설정 · 알림** 네 화면의 머리에 그 말의 이름이
   나오는지 (`ko`·`en` → `SimSim Friends`, `ja` → `ひまとも`, `zh` → `闲闲朋友`).
2. 트레이 메뉴의 **종료 항목**이 그 말의 이름을 쓰는지 (`app.quit`).
3. 설정 화면의 절전·언어 설명 문장에서 이름이 새 이름인지, **한국어 조사가 붙어**
   있는지 (`SimSim Friends는`).
4. macOS 메뉴 막대의 앱 이름이 `SimSim Friends` 인지 (About/Hide/Quit 세 항목).
   **Dock 아이콘을 눌러서 확인하세요** — `open -a` 나 셸에서 직접 띄우면 `activate`
   가 그 시점에 오지 않아 고장이 재현되지 않습니다.
5. **신원이 이어졌는지.** 옛 자리를 만들어 두고 새 자리가 비어 있을 때 방 소속이
   그대로 보이는지 확인합니다.

```bash
# 옛 자리를 흉내 낸다 (실제로 쓰던 짐이 있으면 먼저 복사해 두세요)
ls -la ~/Library/Application\ Support/ | grep -i -E "buddling|tap-tap|simsim"
```

6. 랜딩을 띄워 **방 목록 창 사진 두 장**에 새 이름이 보이는지, 링크 미리보기 그림에
   새 이름이 그려졌는지.

**끝나면 메인 프로세스를 먼저 죽이고 프로필 폴더를 지우세요** (3.8 마지막 문단).

### 5.5 사용자가 돌려 주셔야 하는 것

```bash
npm run check         # 실제 Supabase 를 거치는 e2e. .env 가 필요하고 데이터를 지운다
```

`.env` 는 훅이 막아서 에이전트가 읽을 수 없습니다. **3.9.2 의 SQL 을 적용한 뒤**
돌려 주시면, 방 이름 안전망과 예약 작업이 실제 서버에서 맞는지 확인됩니다.

---

## 6. 브랜치와 PR

| | |
|---|---|
| 브랜치 | `feat/rename-simsim-friends` |
| PR 제목 | `feat: rename the product to SimSim Friends` |
| 머지 | **사람이 누릅니다.** 사용자에게 보이는 동작이 바뀌고, 되돌리기 어렵고, CI 만으로 판단이 안 되는 것 — 셋 다 걸립니다 |

`feat:` 인 이유: 사용자가 보는 이름이 바뀌므로 변경 목록에 나와야 합니다. 0.x 라
`bump-minor-pre-major` 로 minor 가 오릅니다.

`--admin` 을 쓰지 마세요. `git add -A` 를 쓰지 말고 파일을 하나씩 지정하세요 —
`supabase/schema.sql` 은 추적되지 않고, 이 저장소에는 사람이 병행해 고치는 파일이
늘 남아 있습니다.

---

## 7. 함께 고칠 문서

- **`docs/DEVELOPMENT.md`** — "기능별 설계 문서" 표에 이 문서 한 줄, 그리고 그 표
  아래에 3.10.2 의 안내 한 줄. 본문의 환경변수·앱 이름·주소도 새 이름으로.
- **`docs/BACKLOG.md`** — 이미 있는 `## 이름 바꾸기 — SimSim Friends (2026-09-10)`
  아래에, 이번 설계에서 **범위 밖으로 남긴 것** 두 줄을 더합니다 (8장).
- **`CLAUDE.md`** — 3.10.1.
- **`README.md`** · **`docs/RELEASE.md`** · **`docs/SUPABASE_SETUP.md`** ·
  **`docs/release-notes.md`** · **`apps/web/DESIGN.md`** — 3.10.

---

## 8. 이번 범위 밖으로 남긴 것

`docs/BACKLOG.md` 로 넘깁니다.

- **macOS 메뉴 막대의 앱 이름이 네 언어를 따라가지 않습니다.** 일본어·중국어를 쓰는
  사람은 그 자리만 `SimSim Friends` 로 봅니다. 알아내려면 저장 파일을 읽는 순서를
  `setName()` 앞으로 끌어와야 하는데, 그 순서가 곧 신원이 사는 자리를 정합니다
  (3.6). 플랫폼별로는 어긋나 보이지 않아서 이 정도로 두었습니다.
- **창 제목은 앱을 켜 둔 채 말을 바꿔도 그 자리에서 따라오지 않습니다.** 새로 여는
  창부터 바뀝니다 (3.5).
- **개발로 띄운 앱과 포장한 앱의 저장 자리가 이제 정말로 갈립니다**
  (`simsim-friends` vs `SimSim Friends`). 겹치게 만드는 길이 있지만
  `setName()` 의 근거가 달라지므로 두었습니다 (3.3).
