# 캐릭터 캡쳐 스튜디오 — 개발 설계

랜딩 페이지·깃허브 리드미·피그마에 쓸 **캐릭터 그림을 앱이 쓰는 바로 그 코드로 찍어 내는
개발자용 촬영 모드**입니다. 각도를 세 방향으로 돌리고, 신호별 동작을 실행시킨 채로,
배경 없는 PNG 를 뽑습니다.

`docs/PRODUCT.md` 는 이 기능으로 갱신되지 않았습니다 — 최종 사용자가 겪는 제품의 뜻·경계를
바꾸지 않는 개발 도구이기 때문입니다(`npm run preview` · `npm run site-images` 도 기획서에
기능으로 정의되어 있지 않습니다). 근거로 삼은 것은 기획서에 이미 있는 **"앱 아이콘도 랜딩
그림도 같은 캐릭터 코드에서 나온다"** 는 원칙입니다.

---

## 1. 어디에 얹는가

**새 창이나 새 진입점을 만들지 않고, 이미 있는 `preview` 렌더러 진입점에 세 번째 탭으로
붙입니다.**

지금 `npm run preview` 는 한 창 안에 `나란히 보기`(`#`)와 `키프레임 편집`(`#editor`) 두 탭을
갖고 있고, 이 진입점은 이미 `package.json` 의 `build.files` 에서 제외되어 배포본에 들어가지
않습니다(`"!dist-renderer/preview/**"`). 촬영장이 필요한 것 — 앱과 같은 카메라 구도, 앱과 같은
애니메이터, 음표·먼지·인사 짝대기·하트 말풍선 — 은 **키프레임 편집기가 쓰는 무대가 이미
전부 갖고 있습니다**(`renderer/preview/editor-stage.ts`).

| 갈래 | 안 고른 이유 |
|---|---|
| 새 렌더러 진입점(`renderer/studio/`) + 새 실행 스크립트 | Vite 진입점·HTML·`build.files` 제외 규칙·실행 스크립트가 한 벌씩 늘어나는데, 정작 알맹이인 무대는 편집기 것을 그대로 가져다 씁니다. 폴더만 갈라 놓고 코드는 건너다 부르는 모양이 됩니다 |
| `make-site-images.js` 를 확대 | 저쪽은 **커밋되는 산출물**을 정해진 목록대로 다시 뜨는 자동 도구입니다. 사람이 손잡이를 돌려 보는 일과 성질이 다르고, 섞으면 "돌리면 랜딩 그림이 바뀐다" 는 위험한 도구가 됩니다 |

그래서 편집기의 무대를 **두 도구가 함께 쓰는 무대**로 승격시키고, 촬영장은 그 위에 얹는
다른 패널로 만듭니다.

### 1.1 손대는 파일

| 파일 | 무엇 |
|---|---|
| `apps/desktop/src/renderer/preview/editor-stage.ts` → `character-stage.ts` | **이름을 바꾸고** 메서드 여섯을 더한다 (2장) |
| `apps/desktop/src/renderer/preview/studio.tsx` | **새 파일** — 촬영장 패널과 캔버스 (4장) |
| `apps/desktop/src/renderer/preview/studio-shot.ts` | **새 파일** — 각도 자르기·파일 이름·코드 조각 (5장) |
| `apps/desktop/test/studio-shot.test.ts` | **새 파일** — 위 순수 함수 테스트 |
| `apps/desktop/src/renderer/preview/main.tsx` | 탭 하나 추가 · `#studio` 라우팅 · import 경로 |
| `apps/desktop/src/renderer/pet/scene.ts` | `createStage()` 가 그림자 받이를 돌려주게 (2.4) |
| `apps/desktop/src/renderer/site-assets/site-assets.ts` | 오일러 순서 한 줄 (6.2) |
| `apps/desktop/scripts/preview.js` | `--studio` 플래그 · 저장 경로 가로채기 (7장) |
| `apps/desktop/package.json` · 루트 `package.json` | `npm run studio` |
| `docs/DEVELOPMENT.md` | 명령 목록 · 새 절 · 설계 문서 인덱스 |

**앱이 실제로 도는 코드는 `scene.ts` 한 줄뿐이고 그것도 동작을 바꾸지 않습니다.**
`renderer/pet/pet.ts` 는 건드리지 않습니다 — 늘 켜져 있는 렌더 루프라 개발 도구를 위해
손댈 자리가 아닙니다(CLAUDE.md "렌더 루프에 무언가 더할 때는 절전을 지난다").

### 1.2 `editor-stage.ts` → `character-stage.ts` 이름 바꾸기

부르는 곳은 `preview/main.tsx` 한 곳뿐이고, 테스트는 이 파일을 부르지 않습니다
(`grep -rn "editor-stage" apps/desktop` 로 확인했습니다). 파일 맨 위 주석의 "편집 무대" 도
"미리보기·촬영장이 함께 쓰는 무대" 로 고칩니다. 이름을 그대로 두면 촬영장이 `editor-` 라는
파일을 부르게 되어, 다음 사람이 "편집기 전용인데 왜 여기서 부르지" 로 읽습니다.

`initialTrack()` 도 이 파일에 함께 있고 편집기만 씁니다 — 그대로 둡니다.

---

## 2. 무대 — `character-stage.ts`

지금 있는 것(`setSpecies` · `setTrack` · `scrub` · `play` · `stop` · `durations` · `dispose`)은
**그대로 두고** 아래 여섯을 더합니다. 편집기는 새 메서드를 하나도 부르지 않으므로 지금
동작이 달라지지 않습니다.

```ts
/** 캐릭터를 돌려 세운 각도. 전부 라디안이다. */
export interface Pose {
  /** 좌우로 돌리기 — 제자리에서 빙글. THREE 로는 y축이다 */
  yaw: number
  /** 위아래로 돌리기 — 고개를 들거나 숙인 것처럼. THREE 로는 x축이다 */
  pitch: number
  /** 기울이기 — 그림 안에서 갸웃. THREE 로는 z축이다 */
  roll: number
}

/** 카메라를 앱 구도에서 얼마나 비켜 놓을지 */
export interface Framing {
  /** 시선 방향으로 당기고(+) 물리는(−) 양. 0 이면 앱 창과 같은 구도 */
  dolly: number
  /** 카메라와 시선을 함께 올리는(+) 양 */
  lift: number
}

interface CharacterStage {
  // ...지금 있는 것...
  setPose: (pose: Pose) => void
  setFraming: (framing: Framing) => void
  /** 시간을 멈춘다. 그림은 계속 그린다 (2.3) */
  setPaused: (paused: boolean) => void
  setGroundVisible: (visible: boolean) => void
  /** 음표·먼지·짝대기·하트 말풍선을 한꺼번에 켜고 끈다 */
  setPropsVisible: (visible: boolean) => void
  /** 지금 화면을 요청한 크기의 투명 PNG data URL 로 돌려준다 (3장) */
  capture: (size: { width: number; height: number }) => Promise<string>
}
```

### 2.1 각도 — 오일러 순서를 `'ZYX'` 로 못 박는다

무대를 만든 직후, 어떤 회전값을 쓰기 전에 한 번 정합니다.

```ts
stage.stand.rotation.order = 'ZYX'
```

```ts
function setPose(pose: Pose) {
  stage.stand.rotation.set(pose.pitch, pose.yaw, pose.roll)
}
```

**왜 `'ZYX'` 인가.** THREE 의 `'ZYX'` 는 회전을 `Rz·Ry·Rx` 로 합성합니다 — 즉 **기울이기(z)가
가장 바깥**입니다. 그래야 좌우·위아래를 어떻게 돌려 놓았든 기울이기 손잡이가 언제나 **"완성된
그림 안에서 갸웃한 정도"** 로 읽힙니다. 이 도구로 만드는 그림에서 기울기는 마지막에 눈으로
맞추는 값이라(랜딩의 빼꼼 그림이 정확히 그 값 하나로 만들어졌습니다) 다른 두 값에 끌려다니면
안 됩니다. 기본값 `'XYZ'`(= `Rx·Ry·Rz`)로 두면 기울이기가 캐릭터 몸에 붙은 축이 되어, 좌우로
돌려 놓은 상태에서는 화면 안에서 갸웃하지 않고 몸을 비틉니다.

**초기 자세는 앱 창과 같은 구도입니다** — `{ yaw: PET_CAMERA.yaw, pitch: 0, roll: 0 }`
(`PET_CAMERA.yaw` 는 −0.2 rad ≈ −11.5°). `createStage()` 가 이미 그 값으로 `stand.rotation.y`
를 세워 두므로, 촬영장이 열릴 때 손잡이 초기값만 같은 값으로 맞추면 됩니다.

**손잡이 범위는 사용자가 확인해 정했습니다.**

| 손잡이 | 범위 | 근거 |
|---|---|---|
| 좌우로 돌리기 | −90° ~ +90° | **뒷모습은 찍지 않기로 했습니다.** 옆모습까지가 쓸 자리이고, 뒤로 넘기면 얼굴이 없는 그림이 나옵니다 |
| 위아래로 돌리기 | −45° ~ +45° | 그 이상 눕히면 발바닥이나 정수리만 보입니다 |
| 기울이기 | −60° ~ +60° | 빼꼼 그림이 쓰는 것이 ±20° 안팎이라 세 배쯤 여유를 둡니다 |

범위를 자르는 것은 순수 함수 `clampPose()` 가 합니다(5장) — UI 슬라이더의 `min`/`max` 만으로는
옆의 숫자 칸에 직접 적는 길이 막히지 않습니다.

### 2.2 틀 잡기 — 카메라

```ts
function setFraming({ dolly, lift }: Framing) {
  const [px, py, pz] = PET_CAMERA.position
  const [tx, ty, tz] = PET_CAMERA.target
  const dir = new THREE.Vector3(tx - px, ty - py, tz - pz).normalize()
  stage.camera.position.set(px + dir.x * dolly, py + dir.y * dolly + lift, pz + dir.z * dolly)
  stage.camera.lookAt(tx, ty + lift, tz)
}
```

`dolly` 0 · `lift` 0 이 곧 `PET_CAMERA` 이므로 **기본 상태가 앱 창과 똑같은 구도**입니다.
`Vector3` 를 매번 새로 만들지만 손잡이를 놓을 때만 불리는 자리라 문제가 되지 않습니다
(프레임마다 도는 곳이 아닙니다).

권장 범위는 `dolly` −2.0 ~ +3.0, `lift` −0.6 ~ +0.9 입니다. 당겨서 얼굴만 담고 싶어도
**발이 그림 아랫변에 걸리면 몸통이 평평한 가로선으로 잘려 보인다**는 것은 `site-assets.ts` 의
빼꼼 주석이 이미 겪어 적어 둔 것이니, 촬영장 패널에도 같은 취지의 한 줄을 둡니다.

### 2.3 멈춤 — 시간만 멈추고 그림은 계속 그린다

렌더 루프를 이렇게 고칩니다.

```ts
const raw = clock.getDelta()
const delta = paused ? 0 : raw
```

**`clock.getDelta()` 는 멈춤 중에도 반드시 매 프레임 불러야 합니다.** 안 부르면 시간이 안에
쌓여 있다가 멈춤을 풀 때 동작이 한 번에 튑니다.

`delta` 가 0 이면 `playhead += delta` 도, `animator.update(0)` 도, 음표·먼지·짝대기·말풍선의
`update(0)` 도 전부 제자리에 섭니다. **캐릭터와 연출이 같은 순간에 함께 얼어붙는다**는 것이
이 방식의 값입니다 — "하트를 보내는 중, 말풍선이 다 떠오른 순간" 을 그대로 몇 번이든 다시
찍을 수 있습니다.

`stage.render()` 는 멈춤 중에도 계속 부릅니다. 캡처가 루프 안에서 일어나기 때문입니다(3장).

### 2.4 그림자 받이와 연출 껐다 켜기

`createStage()` 가 그림자 받이를 안에서 만들어 `scene` 에 넣고 참조를 돌려주지 않습니다.
**반환값에 `ground` 를 하나 더합니다** — 이 한 줄이 앱 코드에 닿는 유일한 변경이고, 동작은
달라지지 않습니다.

```ts
// renderer/pet/scene.ts
const ground = createShadowCatcher()
scene.add(ground)
// ...
return { renderer, scene, camera, stand, ground, lights, resize, setShadowsLive, render }
```

```ts
function setGroundVisible(visible: boolean) {
  stage.ground.visible = visible
}
```

**촬영장의 기본값은 꺼짐입니다.** 배경 없는 그림에 옅은 바닥 그림자가 알파로 남으면, 그 위에
`drop-shadow` 를 얹는 순간 캐릭터가 아니라 **네모가 하나 떠오릅니다.** `site-assets.ts` 가 빼꼼
샷에서 그림자 받이를 아예 안 넣는 이유가 그것이고(`if (!shot.startsWith('peek-'))`), 같은
함정입니다.

연출을 껐다 켜려면 참조가 필요한데 지금은 넷 다 `stage.stand` 에 바로 붙습니다. `mount()` 에서
**중간 그룹 하나를 끼웁니다.**

```ts
props?.removeFromParent()
props = new THREE.Group()
stage.stand.add(props)
notes?.dispose(); notes = createNotes(props, unit)
puff?.dispose();  puff  = createPuff(props, unit)
greet?.dispose(); greet = createGreet(props, unit)
heartBubble?.dispose(); heartBubble = createHeartBubble(props, unit)
```

`props` 는 변환이 없는 빈 그룹이라 **끼워도 지금 보이는 것이 달라지지 않습니다**
(`stand` 의 scale 을 그대로 물려받습니다). `setPropsVisible(v)` 는 `props.visible = v` 한 줄입니다.
`dispose()` 에서 넷을 각각 `dispose()` 하는 지금 코드는 그대로 두고, `props.removeFromParent()`
만 더합니다.

**연출은 `stand` 안에 남습니다.** 즉 캐릭터를 눕히면 말풍선도 같이 눕습니다. 실제로 쓰는
기울기(±20° 안팎)에서는 어색하지 않고, 떼어 놓으려면 `pet.ts` 쪽 구조까지 함께 봐야 해서
이번 범위 밖으로 둡니다 — 거슬리면 연출을 끄고 찍습니다. `docs/BACKLOG.md` 에 적어 두었습니다.

---

## 3. 찍기 — 창이 아니라 캔버스에서 꺼낸다

**`window.capturePage()` 를 쓰지 않습니다.** 저장소의 다른 두 도구
(`make-site-images.js` · `make-app-icon.js`)는 투명한 프레임 없는 창을 띄워 창째로 찍는데,
촬영장에는 맞지 않습니다.

| | 창을 통째로 찍기 (`capturePage`) | **캔버스에서 꺼내기 (고름)** |
|---|---|---|
| 손잡이 패널 | 같이 찍히므로 캡처용 창을 따로 띄워야 한다 | 애초에 캔버스 밖이라 섞일 수 없다 |
| 크기 | 화면 배율에 끌려다녀 찍은 뒤 `resize()` 로 맞춰야 한다 | `setSize()` 로 **정확히 요청한 화소**가 나온다 |
| 신뢰성 | "창이 합성될 틈" 400ms 대기와 `image.isEmpty()` 방어가 필요하다 | 그린 직후 같은 태스크에서 꺼내므로 빌 수 없다 |
| 같은 자세 여러 크기 | 창을 다시 띄워야 한다 | 한 프레임에 한 장씩, 연달아 |

### 3.1 반드시 렌더 루프 **안에서** 꺼낸다

`createStage()` 의 `WebGLRenderer` 는 `preserveDrawingBuffer` 를 켜지 않았습니다(기본 false).
즉 **합성이 끝나면 그리기 버퍼가 비워지므로**, 버튼 클릭 처리기에서 `canvas.toDataURL()` 을
부르면 빈 그림이 나옵니다. 기계와 타이밍에 따라 어쩌다 되기도 해서 더 나쁩니다.

그래서 캡처는 "예약해 두고 루프가 처리" 하는 모양입니다.

```ts
let pending: { width: number; height: number; resolve: (url: string) => void } | null = null

function capture(size: { width: number; height: number }) {
  return new Promise<string>((resolve) => {
    pending = { ...size, resolve }
  })
}
```

루프 맨 끝, `stage.render()` **바로 다음**에:

```ts
if (pending) {
  const { width, height, resolve } = pending
  pending = null

  // 화면 배율을 1로 못 박아야 요청한 화소가 그대로 나온다.
  // updateStyle=false 라 캔버스의 CSS 크기는 건드리지 않는다.
  stage.renderer.setPixelRatio(1)
  stage.renderer.setSize(width, height, false)
  stage.camera.aspect = width / height
  stage.camera.updateProjectionMatrix()
  stage.renderer.render(stage.scene, stage.camera)

  const url = canvas.toDataURL('image/png')

  // 화면용 크기·배율·비율을 되돌리고 한 장 더 그린다 (안 그러면 한 프레임 찌그러져 보인다)
  stage.resize()
  stage.render()
  resolve(url)
}
```

`stage.resize()` 는 안에서 `setPixelRatio(Math.min(devicePixelRatio, pixelRatioCap))` 까지
되돌려 주므로 배율을 따로 복구할 필요가 없습니다.

**`preserveDrawingBuffer: true` 로 바꿔 클릭 처리기에서 꺼내는 쪽으로 "단순화" 하지 마세요.**
그 옵션은 매 프레임 값을 물게 하는 설정이고, 이 무대의 코드는 캐릭터 창과 공유되는 자리입니다.

### 3.2 배경이 비는 근거

`createStage()` 가 이미 `alpha: true` · `premultipliedAlpha: false` · `setClearColor(0x000000, 0)`
입니다. 즉 캔버스의 알파가 **곱해지지 않은 그대로**라 `toDataURL('image/png')` 가 곧 투명 PNG
입니다. 손댈 것이 없습니다 — 이 세 값이 바뀌면 캡처가 조용히 어두워지므로 그때 여기를 보세요.

### 3.3 크기

프리셋 넷과 자유 입력을 둡니다. `clampSize()` 가 64 ~ 4096 으로 자르고 정수로 만듭니다(5장).
상한 4096 은 WebGL 렌더버퍼 최대치의 안전선입니다 — 넘기면 렌더러가 조용히 작은 그림을 주거나
컨텍스트를 잃습니다.

| 프리셋 | 쓰임 |
|---|---|
| 800 × 1000 | 리드미에 그대로 거는 크기 |
| **1600 × 2000** (기본) | 화소 두 배 화면용. 랜딩 그림이 두 배로 뜨는 것과 같은 이유 |
| 1200 × 1200 | 정사각. 피그마·아바타 자리 |
| 1600 × 900 | 가로로 긴 배너 |

### 3.4 파일로 떨어뜨리기

렌더러에서 data URL 을 Blob 으로 바꿔 내려받기를 일으키고, 실행 스크립트가 저장 자리를
가로챕니다(7장). **preload 를 새로 만들지 않습니다** — `dist-preload/**` 는 배포본에 통째로
들어가는 자리라, 개발 도구용 preload 를 거기 놓고 싶지 않습니다.

```ts
const dataUrl = await stage.capture(size)
const blob = await (await fetch(dataUrl)).blob()
const objectUrl = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = objectUrl
a.download = shotFileName({ ... })
a.click()
URL.revokeObjectURL(objectUrl)
```

`preview/index.html` 에는 CSP 가 없어 `fetch('data:...')` 가 통합니다. data URL 을 `a.href` 에
바로 물려도 대개 되지만, 수 MB 짜리 URL 을 그대로 넘기는 것보다 Blob 이 확실합니다.

---

## 4. 화면 — `studio.tsx`

`main.tsx` 는 탭 하나와 라우팅만 더합니다.

```tsx
const [mode, setMode] = useState<'gallery' | 'editor' | 'studio'>(
  location.hash === '#editor' ? 'editor' : location.hash === '#studio' ? 'studio' : 'gallery',
)
```

버튼 이름은 `촬영장` 입니다. 패널은 `studio.tsx` 안에 통째로 두고 `main.tsx` 에는 넣지
않습니다 — 그 파일은 이미 600줄에 가깝습니다.

왼쪽이 캔버스, 오른쪽이 손잡이 패널(폭 300px 안팎)입니다. `Editor` 와 같은 레이아웃 규칙을
따르되, **캔버스 뒤에는 CSS 로 체커보드**를 깝니다 — 배경이 비어 있는 그림을 화면에서
판단하려면 "여기는 아무것도 없다" 가 보여야 합니다. 체커보드 · 밝은 바탕 · 어두운 바탕
셋을 토글로 두면 어느 색 위에 올려도 캐릭터가 읽히는지 그 자리에서 봅니다. **이 배경은
CSS 라 캡처에 들어가지 않습니다.**

패널 차례:

1. **캐릭터** — `CHARACTERS` 5종. `stage.setSpecies(key)`
2. **각도** — 슬라이더 셋(도 단위, 1° 눈금) + 옆에 숫자 칸 + `가운데로` 버튼.
   화면은 도(°)로 보여 주고 무대에는 라디안으로 넘깁니다 — 사람이 각도를 눈으로 가늠하는
   단위는 도이고, 옮겨 적을 코드는 라디안이기 때문입니다(6장)
3. **틀 잡기** — `당기기`·`올리기` 슬라이더 둘. `기본 구도로` 버튼
4. **동작** — 버튼 아홉: `가만히` + 여덟 트랙
   (`폴짝` `춤` `움찔` `손 흔들기` `수줍음` `앙탈` `잠들기` `깨어나기` — 이름은 `main.tsx` 의
   `TRACKS` 배열을 그대로 씁니다). `가만히` 는 `stage.stop()`
   - **반복** 체크박스 — `onPlayEnd` 에서 같은 트랙을 다시 `play()`
   - **멈춤 / 이어서** 토글 — `stage.setPaused()`
   - **시간 막대** — 0 ~ `durations()[track]`, 끌면 `stage.scrub(track, t)`
5. **찍기** — 크기 프리셋 넷 + 자유 입력 + `찍기` 버튼,
   체크박스 `바닥 그림자`(기본 끔) · `연출 함께 담기`(기본 켬)
6. **각도 옮겨 적기** — `poseSnippet()` 결과와 `복사` 버튼 (6장)

### 4.1 시간 막대와 멈춤은 서로 다른 도구다 — 화면에 적어 둔다

`scrub()` 은 애니메이터에게 "그 시각의 정지 포즈" 를 물어보는 것이라 **캐릭터의 자세만
되돌립니다. 음표·하트 말풍선·먼지는 따라오지 않습니다** — 그것들은 각자 수명을 가진 별개의
연출이고 `burst()` 로 터진 것만 살아 있습니다.

그래서 패널 아래에 회색 한 줄을 둡니다.

> 시간 막대는 캐릭터 자세만 되돌립니다. 음표·하트까지 담으려면 **재생 → 멈춤**을 쓰세요.

이 한 줄이 없으면 "하트 말풍선이 안 나온다" 를 고장으로 읽게 됩니다. 실제로 그렇게 읽힐
자리라 화면에 적습니다.

---

## 5. 순수 함수 — `studio-shot.ts` 와 그 테스트

CLAUDE.md 규칙 1("순수 함수로 빼서 테스트한다")에 따라, Electron 도 브라우저도 없이 돌릴 수
있는 계산은 전부 여기로 뺍니다.

```ts
/** 손잡이가 허용하는 범위(도). 뒷모습은 찍지 않기로 해서 좌우가 ±90 에서 멈춘다. */
export const POSE_LIMITS = { yaw: 90, pitch: 45, roll: 60 } as const

export const SHOT_MIN = 64
export const SHOT_MAX = 4096

/** 범위 밖 값을 자른다. 슬라이더 옆 숫자 칸에 직접 적는 길이 있어서 필요하다 */
export function clampPose(degrees: PoseDegrees): PoseDegrees

/** 64~4096 정수로 자른다. NaN·0·음수도 여기서 걸린다 */
export function clampSize(width: number, height: number): { width: number; height: number }

/** 찍은 그림의 파일 이름 */
export function shotFileName(opts: {
  species: string          // 'cat'
  action: string           // 'shy' | 'still'
  degrees: PoseDegrees
  width: number
  height: number
  at: Date
}): string

/** site-assets.ts 의 LAYOUTS 에 붙일 수 있는 라디안 코드 조각 */
export function poseSnippet(degrees: PoseDegrees): string
```

**파일 이름 규칙**

```
<종>-<동작>_<너비>x<높이>_y<좌우>_p<위아래>_r<기울기>_<HHmmss>.png

cat-shy_1600x2000_y-12_p0_r-20_143207.png
duck-still_800x1000_y0_p0_r0_143255.png
```

각도는 **도 단위 정수**로 반올림해 넣습니다. 소수를 넣으면 이름에 점이 섞여 읽기 나쁘고,
정수 한 자리면 스무 장을 늘어놓고 고를 때 충분합니다. 끝의 `HHmmss` 는 **같은 자세를 여러 번
찍어도 덮어쓰지 않게** 하는 자리입니다 — 촬영장은 같은 각도로 여러 장 찍어 고르는 도구라
덮어쓰기가 곧 손실입니다.

**코드 조각**은 라디안 소수 넷째 자리까지입니다(`preview/keyframes.ts` 의 `round4` 재사용).

```
yaw: -0.2094,
roll: -0.3491,
```

위아래 각도가 0 이 아니면 세 줄이 되고, 그 위에 **경고 주석**이 붙습니다.

```
// site-assets.ts 의 LAYOUTS 에는 위아래 각도를 넣는 자리가 없습니다.
// 옮기려면 그쪽에 pitch 항목을 하나 만들어야 합니다.
pitch: 0.2094,
yaw: -0.2094,
roll: -0.3491,
```

### 5.1 `test/studio-shot.test.ts` 가 볼 것

- `clampPose` 가 좌우 ±90 · 위아래 ±45 · 기울기 ±60 에서 자른다 (경계값과 그 바깥 각각)
- `clampSize` 가 64 아래·4096 위·소수·`NaN` 을 전부 성한 정수로 만든다
- `shotFileName` 이 음수 각도를 부호와 함께 적고, −11.5° 를 `-12` 로 반올림한다
- `shotFileName` 이 파일 이름에 못 쓰는 글자(`/` · 공백 · `:`)를 만들지 않는다
- `poseSnippet` 이 위아래 0 일 때 두 줄, 0 이 아닐 때 경고 주석과 세 줄을 낸다

---

## 6. 찾은 각도를 랜딩으로 옮기는 길

촬영장의 값이 큰 이유는 그림 파일만이 아닙니다. 지금 `site-assets.ts` 의 `LAYOUTS` 에 적힌
`yaw: 0` · `roll: -0.34` · `panX: 0.365` 같은 숫자는 **눈으로 맞춰 손으로 적어 넣은 값**입니다.
촬영장이 그 일을 화면 위에서 하게 해 줍니다.

### 6.1 옮길 수 있는 것과 아닌 것

| 촬영장의 값 | `LAYOUTS` 에 | |
|---|---|---|
| 좌우로 돌리기 | `yaw` | 그대로 |
| 기울이기 | `roll` | 그대로 |
| 위아래로 돌리기 | — | **자리가 없습니다.** 쓰려면 `site-assets.ts` 에 항목을 만들어야 합니다 |
| 당기기·올리기 | `headroom` · `lift` | **셈법이 다릅니다.** 저쪽은 담을 폭·높이에서 거리를 역산합니다 — 눈으로 다시 맞추세요 |

### 6.2 `site-assets.ts` 에도 같은 오일러 순서를 못 박는다

`site-assets.ts` 는 `stand.rotation.y = yaw; stand.rotation.z = roll` 을 기본 순서(`'XYZ'`)로
씁니다. 좌우와 기울기가 **둘 다 0 이 아니면** 순서에 따라 결과가 달라지므로, 촬영장에서 맞춘
자세가 랜딩 그림에서는 다르게 나옵니다.

그래서 `site-assets.ts` 에도 회전을 쓰기 전에 한 줄을 넣습니다.

```ts
// 촬영장(`preview` 의 촬영장 탭)과 같은 순서여야 거기서 맞춘 각도가 그대로 나온다.
stand.rotation.order = 'ZYX'
```

**지금 있는 그림은 하나도 바뀌지 않습니다.** 지금 `LAYOUTS` 여덟 개는 전부 `yaw` 와 `roll`
중 하나가 0 이고(빼꼼 넷은 `yaw: 0`, 나머지 넷은 `roll` 없음), 한쪽이 0 이면 두 순서의 결과가
같기 때문입니다. **구현할 때 이것을 말로 믿지 말고 증명하세요** — `npm run site-images` 를
돌린 뒤 `git status` 가 `apps/web/public/assets/` 아래에 아무 변경도 안 보이면 증명된 것입니다.
(WebP 인코딩이 결정적이지 않아 바이트가 흔들릴 수 있으므로, 다르면 그때 눈으로 견줍니다.)

---

## 7. 실행 — `scripts/preview.js`

```js
const STUDIO = process.argv.includes('--studio')
```

- 창 크기: 촬영장은 `1440 × 900` (편집기 1500×820, 나란히 보기 1360×560 옆에 나란히)
- `loadFile(..., { hash: STUDIO ? 'studio' : EDITOR ? 'editor' : '' })`
- `--shot` 캡처 경로는 지금 그대로 둡니다. 촬영장은 `--shot` 과 함께 쓰지 않습니다

### 7.1 저장 자리를 가로챈다

`app.whenReady()` 안에서, 창을 만들기 **전에** 겁니다.

```js
const { app, BrowserWindow, session } = require('electron')
const STUDIO_OUT = path.join(__dirname, '..', '.preview', 'studio')

session.defaultSession.on('will-download', (event, item) => {
  fs.mkdirSync(STUDIO_OUT, { recursive: true })
  item.setSavePath(path.join(STUDIO_OUT, item.getFilename()))
  item.once('done', (_event, state) => {
    if (state === 'completed') console.log(`찍었습니다 → ${item.getSavePath()}`)
    else console.error(`저장하지 못했습니다 (${state})`)
  })
})
```

**`--studio` 여부와 상관없이 항상 겁니다.** 이 창에서 내려받기가 일어나는 길은 촬영장 하나뿐이라
부작용이 없고, 플래그로 갈라 두면 `npm run preview` 로 열어 탭만 옮긴 사람에게는 매번 저장
대화상자가 떠서 스무 장 연달아 찍는 일이 통째로 막힙니다. 플래그가 정하는 것은 **창 크기와 첫
탭**뿐입니다.

`.preview/` 는 이미 `.gitignore` 에 있어 산출물이 저장소에 들어가지 않습니다.

### 7.2 명령

```json
// apps/desktop/package.json
"studio": "npm run ensure-electron && npm run build && electron scripts/preview.js --studio"
```

```json
// 루트 package.json
"studio": "npm run studio -w simsim-friends"
```

---

## 8. 확인하는 방법

CI 다섯(`npm test` · `typecheck` · `lint` · `build` · `check:site`)에 더해, 이 기능은 **눈으로
봐야 끝납니다.**

1. `npm run studio` 로 열어 다섯 종을 갈아 끼워 본다 — 캐릭터를 바꿔도 각도·동작 설정이
   유지되는지(`setSpecies` 뒤 `setPose` 를 다시 먹여야 합니다)
2. 세 손잡이를 끝까지 밀어 본다 — 잘리거나 사라지는 자세가 없는지
3. `수줍음` 을 재생하고 말풍선이 다 떠오른 순간에 **멈춤** → 찍기. 나온 PNG 를 어두운 바탕과
   밝은 바탕 위에 각각 올려 **네모가 안 보이는지**(그림자가 안 남았는지) 확인
4. 같은 자세를 `800×1000` 과 `1600×2000` 으로 연달아 찍어 **두 파일이 정확히 그 화소인지**
5. `잠들기` 를 재생해 웅크린 자세에서 멈추는지 — 이 트랙만 끝에서 자세를 유지합니다
6. `npm run preview` · `npm run preview -- --editor` 를 열어 **편집기가 그대로인지**
   (무대 파일을 고쳤으므로 이것이 회귀 확인입니다)
7. `npm run site-images` 를 돌려 랜딩 그림이 안 바뀌는지 (6.2)

---

## 9. 일부러 하지 않은 것

- **투명 여백 자동 잘라내기** — 피그마에 올릴 때 편하지만 요청에 없었고, 넣는 순간 "요청한
  크기가 그대로 나온다" 는 이 도구의 약속이 깨집니다. `docs/BACKLOG.md` 에 두었습니다
- **연속 촬영(GIF·스프라이트 시트)** — 요청은 정지 그림입니다. 만들려면 프레임을 모아 엮는
  전혀 다른 일이 붙습니다
- **각도 저장·불러오기(프리셋)** — 코드 조각 복사가 그 자리를 대신합니다. 실제로 여러 벌을
  오가게 되면 그때 만듭니다
- **`make-site-images.js` 와의 통합** — 저쪽은 커밋되는 산출물을 정해진 목록대로 다시 뜨는
  자동 도구이고, 촬영장은 사람이 손으로 고르는 자리입니다. 합치면 손잡이를 돌린 것이 랜딩
  그림을 바꿔 버립니다
- **`pet.ts` 리팩터링** — 캐릭터를 세우고 연출을 붙이는 같은 묶음이 `pet.ts` 와
  `character-stage.ts` 두 곳에 있습니다(이번에 세 번째가 생기지는 않습니다). 앱이 늘 켜져 있는
  렌더 루프라 개발 도구를 위해 건드릴 자리가 아닙니다. `docs/BACKLOG.md` 에 두었습니다
