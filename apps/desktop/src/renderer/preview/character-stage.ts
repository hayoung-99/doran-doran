/**
 * 미리보기·촬영장이 함께 쓰는 무대 — 캐릭터 한 마리를 앱 창과 **같은 카메라 구도**로
 * 세워 둔다.
 *
 * `createStage()` 를 그대로 쓰는 것이 핵심이다. 무대가 자기 나름의 구도를 만들면
 * 여기서 실루엣 밖으로 잘 나오던 팔이 실제 창에서는 잘리는 일이 생긴다. 값을 부위에
 * 바르는 일도 `createAnimator` 하나만 하므로, **여기서 보이는 움직임이 앱에서
 * 나오는 움직임이다.**
 *
 * 재생 중의 시각(playhead)은 이 무대가 셈한다. 애니메이터는 시간을 안으로만 굴리고
 * 밖으로 내주지 않기 때문이다. 그 값을 React 상태로 올리지 않고 콜백으로 흘리는
 * 이유는 초당 60번 도는 자리라서다 — 프레임마다 재조정을 돌릴 이유가 없다.
 *
 * **음표·먼지·인사 짝대기·하트 말풍선도 함께 띄운다.** 동작을 다듬는 도구인데 정작 그 동작을 완성하는
 * 연출이 안 보이면, 여기서 알맞아 보이던 것이 앱에서는 다르게 읽힌다. 박차는 순간을
 * 잡는 규칙도 캐릭터 창과 같은 것(`pet/takeoff.ts`)을 쓴다 — 두 벌로 두면 한쪽만
 * 고쳐져 조용히 어긋난다.
 *
 * 촬영장(`studio.tsx`)이 더한 `setPose`·`setFraming`·`setPaused`·`setGroundVisible`·
 * `setPropsVisible`·`capture` 여섯은 키프레임 편집기가 하나도 부르지 않으므로 편집기의
 * 동작은 그대로다. 자세한 근거는 `docs/design/character-capture-studio.md` 2장을 보라.
 */

import * as THREE from 'three'
import { getCharacter } from '@simsim-friends/shared/characters'
import { createCritter, disposeCritter, scaleToStandardHeight } from '../pet/critter'
import { createStage, PET_CAMERA } from '../pet/scene'
import { createAnimator, TRACK_UNITS } from '../pet/animations'
import { createNotes } from '../pet/notes'
import { createPuff } from '../pet/puff'
import { createGreet } from '../pet/greet'
import { createHeartBubble } from '../pet/heart-bubble'
import { createTakeoff } from '../pet/takeoff'
import type { TrackName } from '../pet/animations'
import type { Keyframe } from '../pet/tween'

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

export interface CharacterStage {
  /** 캐릭터를 갈아끼운다. 갈아끼워도 지금 편집 중인 트랙은 그대로 따라간다. */
  setSpecies: (key: string) => void
  setTrack: (name: TrackName, keys: Keyframe[]) => void
  /** 재생하지 않고 그 시각의 정지 포즈를 보여 준다 */
  scrub: (name: TrackName, t: number) => void
  play: (name: TrackName) => void
  stop: () => void
  durations: () => Record<TrackName, number>
  setPose: (pose: Pose) => void
  setFraming: (framing: Framing) => void
  /** 시간을 멈춘다. 그림은 계속 그린다 */
  setPaused: (paused: boolean) => void
  setGroundVisible: (visible: boolean) => void
  /** 음표·먼지·짝대기·하트 말풍선을 한꺼번에 켜고 끈다 */
  setPropsVisible: (visible: boolean) => void
  /** 지금 화면을 요청한 크기의 투명 PNG data URL 로 돌려준다 */
  capture: (size: { width: number; height: number }) => Promise<string>
  dispose: () => void
}

export function startCharacterStage({
  canvas,
  onPlayhead,
  onPlayEnd,
}: {
  canvas: HTMLCanvasElement
  /** 재생 중 매 프레임 불린다. React 상태 대신 DOM 을 직접 만지는 데 쓴다. */
  onPlayhead: (t: number) => void
  onPlayEnd: () => void
}): CharacterStage {
  const stage = createStage({ canvas })

  // 기울이기가 언제나 "완성된 그림 안에서 갸웃한 정도"로 읽히려면 기울이기(z)가
  // 가장 바깥이어야 한다. 기본값 'XYZ' 로 두면 좌우로 돌려 놓은 상태에서 기울이기가
  // 캐릭터 몸에 붙은 축이 되어, 화면 안에서 갸웃하지 않고 몸을 비튼다.
  stage.stand.rotation.order = 'ZYX'

  // 편집기가 갈아끼운 트랙. 캐릭터를 바꾸면 애니메이터가 새로 생기므로 여기 들고 있다가 다시 먹인다.
  const tracks: Partial<Record<TrackName, Keyframe[]>> = {}

  let critter = createCritter(getCharacter('cat'))
  let animator = createAnimator(critter)
  let notes: ReturnType<typeof createNotes> | null = null
  let puff: ReturnType<typeof createPuff> | null = null
  let greet: ReturnType<typeof createGreet> | null = null
  let heartBubble: ReturnType<typeof createHeartBubble> | null = null
  const takeoff = createTakeoff((strength) => puff?.burst(strength))

  // 음표·먼지·짝대기·말풍선을 한꺼번에 켜고 끌 수 있도록 끼워 둔 중간 그룹.
  // 변환이 없는 빈 그룹이라 끼워도 지금 보이는 것이 달라지지 않는다.
  let props = new THREE.Group()
  stage.stand.add(props)
  let propsVisible = true

  function mount() {
    const unit = critter.height * scaleToStandardHeight(critter)
    stage.stand.scale.setScalar(scaleToStandardHeight(critter))
    stage.stand.add(critter.root)
    animator = createAnimator(critter)
    for (const [name, keys] of Object.entries(tracks)) {
      animator.setTrack(name as TrackName, keys)
    }
    props.removeFromParent()
    props = new THREE.Group()
    props.visible = propsVisible
    stage.stand.add(props)
    notes?.dispose()
    notes = createNotes(props, unit)
    puff?.dispose()
    puff = createPuff(props, unit)
    greet?.dispose()
    greet = createGreet(props, unit)
    heartBubble?.dispose()
    heartBubble = createHeartBubble(props, unit)
    takeoff.reset()
  }
  mount()

  /** 재생 중인 동작과 그 안에서의 시각. 재생하지 않을 때는 null 이다. */
  let playing: TrackName | null = null
  let playhead = 0
  let paused = false

  function setSpecies(key: string) {
    const next = getCharacter(key)
    if (next.key === critter.spec.key) return
    disposeCritter(critter)
    critter = createCritter(next)
    mount()
    playing = null
  }

  function setTrack(name: TrackName, keys: Keyframe[]) {
    tracks[name] = keys
    animator.setTrack(name, keys)
  }

  function scrub(name: TrackName, t: number) {
    playing = null
    takeoff.reset()
    animator.scrub(name, t)
  }

  function play(name: TrackName) {
    playing = name
    playhead = 0
    takeoff.reset()
    animator.stop()
    animator[name]()
    // 앱에서 신호를 받았을 때와 같이, 춤에는 음표가 손 흔들기에는 짝대기가 함께 뜬다
    if (name === 'dance') notes?.burst({ count: 6 })
    if (name === 'wave') greet?.burst()
    if (name === 'shy') heartBubble?.burst()
  }

  function stop() {
    playing = null
    takeoff.reset()
    animator.stop()
  }

  function setPose(pose: Pose) {
    stage.stand.rotation.set(pose.pitch, pose.yaw, pose.roll)
  }

  function setFraming({ dolly, lift }: Framing) {
    const [px, py, pz] = PET_CAMERA.position
    const [tx, ty, tz] = PET_CAMERA.target
    const dir = new THREE.Vector3(tx - px, ty - py, tz - pz).normalize()
    stage.camera.position.set(px + dir.x * dolly, py + dir.y * dolly + lift, pz + dir.z * dolly)
    stage.camera.lookAt(tx, ty + lift, tz)
  }

  function setPaused(value: boolean) {
    paused = value
  }

  function setGroundVisible(visible: boolean) {
    stage.ground.visible = visible
  }

  function setPropsVisible(visible: boolean) {
    propsVisible = visible
    props.visible = visible
  }

  // 캡처는 "예약해 두고 루프가 처리" 하는 모양이다. `preserveDrawingBuffer` 를 켜지
  // 않았으므로(기본 false) 합성이 끝나면 그리기 버퍼가 비워진다 — 버튼 처리기에서
  // `canvas.toDataURL()` 을 부르면 빈 그림이 나온다.
  let pending: { width: number; height: number; resolve: (url: string) => void } | null = null

  function capture(size: { width: number; height: number }) {
    return new Promise<string>((resolve) => {
      pending = { ...size, resolve }
    })
  }

  function resize() {
    stage.resize()
  }
  window.addEventListener('resize', resize)

  const clock = new THREE.Clock()
  stage.renderer.setAnimationLoop(() => {
    // 멈춤 중에도 반드시 매 프레임 불러야 한다. 안 부르면 시간이 안에 쌓여 있다가
    // 멈춤을 풀 때 동작이 한 번에 튄다.
    const raw = clock.getDelta()
    const delta = paused ? 0 : raw

    if (playing) {
      playhead += delta
      const duration = animator.durations[playing]
      if (playhead >= duration) {
        playing = null
        onPlayEnd()
      } else {
        onPlayhead(playhead)
      }
    }

    animator.update(delta)
    // 스크럽으로 포즈만 보고 있을 때는 먼지가 터지지 않아야 한다
    takeoff.watch(critter.root.position.y, delta, Boolean(playing && animator.isHopping))
    notes?.update(delta)
    puff?.update(delta)
    greet?.update(delta)
    heartBubble?.update(delta)
    stage.render()

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
  })

  return {
    setSpecies,
    setTrack,
    scrub,
    play,
    stop,
    durations: () => animator.durations,
    setPose,
    setFraming,
    setPaused,
    setGroundVisible,
    setPropsVisible,
    capture,
    dispose() {
      stage.renderer.setAnimationLoop(null)
      window.removeEventListener('resize', resize)
      notes?.dispose()
      puff?.dispose()
      greet?.dispose()
      heartBubble?.dispose()
      disposeCritter(critter)
      stage.renderer.dispose()
      stage.renderer.forceContextLoss()
    },
  }
}

/** 편집기가 처음 열릴 때 채워 넣는 값 — 지금 소스에 적혀 있는 트랙 그대로다. */
export const initialTrack = (name: TrackName): Keyframe[] =>
  TRACK_UNITS[name].map((key) => ({ ...key }))
