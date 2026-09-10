/**
 * 촬영장 — 캐릭터 한 마리를 회전판 위에 세워 두고, 각도와 동작을 골라 배경 없는 PNG
 * 로 찍는다. 랜딩·리드미·피그마에 쓸 그림을 앱이 쓰는 바로 그 코드로 찍는 개발자
 * 전용 도구다. 자세한 근거는 `docs/design/character-capture-studio.md` 를 보라.
 *
 * 무대(`character-stage.ts`)는 편집기와 함께 쓰는 것이라, 여기서 새로 만드는 것은
 * 이 패널과 아래 캡처 → 저장 흐름뿐이다.
 */

import { useEffect, useRef, useState } from 'react'
import { CHARACTERS } from '@simsim-friends/shared/characters'
import { PET_CAMERA } from '../pet/scene'
import type { TrackName } from '../pet/animations'
import { startCharacterStage } from './character-stage'
import type { CharacterStage, Pose } from './character-stage'
import { clampPose, clampSize, poseSnippet, shotFileName } from './studio-shot'
import type { PoseDegrees } from './studio-shot'
import { TRACKS, button, solid, ghost, panelLabel } from './panel'

/** 화소 크기 프리셋 — 쓰임은 `docs/design/character-capture-studio.md` 3.3 절에 있다 */
const SIZE_PRESETS = [
  { label: '800 × 1000', width: 800, height: 1000 },
  { label: '1600 × 2000', width: 1600, height: 2000 },
  { label: '1200 × 1200', width: 1200, height: 1200 },
  { label: '1600 × 900', width: 1600, height: 900 },
] as const

const DEFAULT_SIZE = SIZE_PRESETS[1]

/** 앱 창과 같은 구도가 곧 각도 손잡이의 시작값이다. `createStage()` 가 이미 이 값으로 세워 둔다. */
const INITIAL_POSE: PoseDegrees = { yaw: (PET_CAMERA.yaw * 180) / Math.PI, pitch: 0, roll: 0 }

const toRadians = (pose: PoseDegrees): Pose => ({
  yaw: (pose.yaw * Math.PI) / 180,
  pitch: (pose.pitch * Math.PI) / 180,
  roll: (pose.roll * Math.PI) / 180,
})

const CHECKER_BG =
  'repeating-conic-gradient(#d8d0c0 0% 25%, transparent 0% 50%) 0 0 / 22px 22px'

/** 배경 위에서 캐릭터가 읽히는지 보는 세 바탕. CSS 라 캡처에는 들어가지 않는다. */
const CANVAS_BACKGROUNDS = {
  checker: CHECKER_BG,
  light: '#f5efe1',
  dark: '#221c16',
} as const
type CanvasBackground = keyof typeof CANVAS_BACKGROUNDS

export function Studio() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const headRef = useRef<HTMLSpanElement>(null)
  const stageRef = useRef<CharacterStage | null>(null)

  const [species, setSpecies] = useState(CHARACTERS[0].key)
  const [pose, setPose] = useState<PoseDegrees>(INITIAL_POSE)
  const [framing, setFraming] = useState({ dolly: 0, lift: 0 })
  const [track, setTrack] = useState<TrackName>('wave')
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [at, setAt] = useState(0)
  const [durations, setDurations] = useState<Record<TrackName, number> | null>(null)
  const [groundVisible, setGroundVisible] = useState(false)
  const [propsVisible, setPropsVisible] = useState(true)
  const [size, setSize] = useState<{ width: number; height: number }>(DEFAULT_SIZE)
  const [background, setBackground] = useState<CanvasBackground>('checker')
  const [status, setStatus] = useState<string | null>(null)

  // onPlayEnd 는 무대를 만들 때 한 번만 건네므로, 그 안에서 최신 track·repeat 을
  // 읽으려면 매 렌더 값을 따라가는 ref 가 필요하다 — 그러지 않으면 mount 시점 값에 갇힌다.
  const trackRef = useRef(track)
  const repeatRef = useRef(repeat)
  useEffect(() => {
    trackRef.current = track
  }, [track])
  useEffect(() => {
    repeatRef.current = repeat
  }, [repeat])

  function setHead(t: number) {
    if (headRef.current) headRef.current.textContent = `${t.toFixed(2)}s`
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const stage = startCharacterStage({
      canvas,
      onPlayhead: setHead,
      onPlayEnd: () => {
        if (repeatRef.current) {
          stageRef.current?.play(trackRef.current)
          return
        }
        setPlaying(false)
      },
    })
    stageRef.current = stage
    setDurations(stage.durations())
    return () => {
      stageRef.current = null
      stage.dispose()
    }
  }, [])

  useEffect(() => {
    stageRef.current?.setPose(toRadians(pose))
  }, [pose])

  useEffect(() => {
    stageRef.current?.setFraming(framing)
  }, [framing])

  useEffect(() => {
    stageRef.current?.setPaused(paused)
  }, [paused])

  useEffect(() => {
    stageRef.current?.setGroundVisible(groundVisible)
  }, [groundVisible])

  useEffect(() => {
    stageRef.current?.setPropsVisible(propsVisible)
  }, [propsVisible])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    stage.setSpecies(species)
    // 종을 바꾸면 무대 안의 애니메이터가 새로 생긴다. 자세는 `stand` 에 남아 있어
    // 사실 다시 먹이지 않아도 유지되지만, 그 사실에 기대지 않고 명시적으로 맞춘다.
    stage.setPose(toRadians(pose))
    setPlaying(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [species])

  function playTrack(name: TrackName) {
    setTrack(name)
    setPlaying(true)
    setStatus(null)
    stageRef.current?.play(name)
  }

  function stopTrack() {
    setPlaying(false)
    stageRef.current?.stop()
  }

  function scrubTo(t: number) {
    setPlaying(false)
    setAt(t)
    setHead(t)
    stageRef.current?.scrub(track, t)
  }

  function updatePose(patch: Partial<PoseDegrees>) {
    setPose((current) => clampPose({ ...current, ...patch }))
  }

  async function shoot() {
    const stage = stageRef.current
    if (!stage) return
    setStatus('찍는 중…')
    const dataUrl = await stage.capture(size)
    const blob = await (await fetch(dataUrl)).blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = shotFileName({
      species,
      action: playing ? track : 'still',
      degrees: pose,
      width: size.width,
      height: size.height,
      at: new Date(),
    })
    a.click()
    URL.revokeObjectURL(objectUrl)
    setStatus(`찍었습니다 → ${a.download}`)
  }

  const maxTime = durations?.[track] ?? 0
  const snippet = poseSnippet(pose)

  return (
    <div className="flex-1 flex min-h-0">
      {/* ── 왼쪽: 캔버스 ── */}
      <div className="relative flex-1 min-h-0" style={{ background: CANVAS_BACKGROUNDS[background] }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {(['checker', 'light', 'dark'] as const).map((name) => (
            <button
              key={name}
              className={background === name ? solid : ghost}
              onClick={() => setBackground(name)}
            >
              {name === 'checker' ? '체커보드' : name === 'light' ? '밝은 바탕' : '어두운 바탕'}
            </button>
          ))}
        </div>
      </div>

      {/* ── 오른쪽: 패널 ── */}
      <aside className="w-[300px] shrink-0 border-l border-line overflow-y-auto p-5 flex flex-col gap-5">
        <section className="flex flex-col gap-2">
          <div className={panelLabel}>캐릭터</div>
          <div className="flex flex-wrap gap-1.5">
            {CHARACTERS.map((spec) => (
              <button
                key={spec.key}
                className={spec.key === species ? solid : ghost}
                onClick={() => setSpecies(spec.key)}
              >
                {spec.name}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className={panelLabel}>각도</div>
            <button className={`${button} bg-transparent text-ink-soft px-0`} onClick={() => setPose({ yaw: 0, pitch: 0, roll: 0 })}>
              가운데로
            </button>
          </div>
          <AngleRow label="좌우로 돌리기" value={pose.yaw} min={-90} max={90} onChange={(v) => updatePose({ yaw: v })} />
          <AngleRow label="위아래로 돌리기" value={pose.pitch} min={-45} max={45} onChange={(v) => updatePose({ pitch: v })} />
          <AngleRow label="기울이기" value={pose.roll} min={-60} max={60} onChange={(v) => updatePose({ roll: v })} />
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className={panelLabel}>틀 잡기</div>
            <button
              className={`${button} bg-transparent text-ink-soft px-0`}
              onClick={() => setFraming({ dolly: 0, lift: 0 })}
            >
              기본 구도로
            </button>
          </div>
          <AngleRow
            label="당기기"
            value={framing.dolly}
            min={-2}
            max={3}
            step={0.05}
            onChange={(v) => setFraming((c) => ({ ...c, dolly: v }))}
          />
          <AngleRow
            label="올리기"
            value={framing.lift}
            min={-0.6}
            max={0.9}
            step={0.02}
            onChange={(v) => setFraming((c) => ({ ...c, lift: v }))}
          />
          <p className="text-[11px] text-ink-soft leading-snug">
            발이 그림 아랫변에 걸리면 몸통이 평평한 가로선으로 잘려 보입니다. 얼굴만
            담고 싶어도 발끝까지는 들어오게 당기세요.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <div className={panelLabel}>동작</div>
          <div className="flex flex-wrap gap-1.5">
            <button className={!playing ? solid : ghost} onClick={stopTrack}>
              가만히
            </button>
            {TRACKS.map((item) => (
              <button
                key={item.name}
                className={playing && track === item.name ? solid : ghost}
                onClick={() => playTrack(item.name)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-[12px] mt-1">
            <input type="checkbox" checked={repeat} onChange={(event) => setRepeat(event.target.checked)} />
            반복
          </label>

          <div className="flex items-center gap-2">
            <button
              className={ghost}
              onClick={() => {
                const next = !paused
                setPaused(next)
              }}
            >
              {paused ? '▶ 이어서' : '❚❚ 멈춤'}
            </button>
            <span ref={headRef} className="font-code text-[12px] text-ink-soft">
              0.00s
            </span>
          </div>

          <input
            type="range"
            className="w-full accent-ink"
            min={0}
            max={maxTime || 1}
            step={0.005}
            value={at}
            onChange={(event) => scrubTo(Number(event.target.value))}
          />
          <p className="text-[11px] text-ink-soft leading-snug">
            시간 막대는 캐릭터 자세만 되돌립니다. 음표·하트까지 담으려면{' '}
            <b>재생 → 멈춤</b>을 쓰세요.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <div className={panelLabel}>찍기</div>
          <div className="flex flex-wrap gap-1.5">
            {SIZE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                className={size.width === preset.width && size.height === preset.height ? solid : ghost}
                onClick={() => setSize({ width: preset.width, height: preset.height })}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              className="w-20 font-code text-[12px] bg-card border border-line rounded-field px-2 py-1"
              value={size.width}
              onChange={(event) => setSize((c) => clampSize(Number(event.target.value), c.height))}
            />
            <span className="text-ink-soft">×</span>
            <input
              type="number"
              className="w-20 font-code text-[12px] bg-card border border-line rounded-field px-2 py-1"
              value={size.height}
              onChange={(event) => setSize((c) => clampSize(c.width, Number(event.target.value)))}
            />
          </div>

          <label className="flex items-center gap-2 text-[12px]">
            <input
              type="checkbox"
              checked={groundVisible}
              onChange={(event) => setGroundVisible(event.target.checked)}
            />
            바닥 그림자
          </label>
          <label className="flex items-center gap-2 text-[12px]">
            <input
              type="checkbox"
              checked={propsVisible}
              onChange={(event) => setPropsVisible(event.target.checked)}
            />
            연출 함께 담기
          </label>

          <button className={solid} onClick={() => void shoot()}>
            찍기
          </button>
          {status && <p className="text-[11px] text-ink-soft leading-snug">{status}</p>}
        </section>

        <section className="flex flex-col gap-2">
          <div className={panelLabel}>각도 옮겨 적기</div>
          <textarea
            readOnly
            className="font-code text-[11px] leading-relaxed bg-card border border-line rounded-card p-3 h-24 resize-none"
            value={snippet}
            onFocus={(event) => event.currentTarget.select()}
          />
          <button className={ghost} onClick={() => void navigator.clipboard.writeText(snippet)}>
            복사
          </button>
        </section>
      </aside>
    </div>
  )
}

/** 손잡이 하나(라벨 + 슬라이더 + 숫자 칸). 각도는 도(°) 단위로 보여 준다. */
function AngleRow({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-[11px] w-24 shrink-0 text-ink-soft">{label}</span>
      <input
        type="range"
        className="flex-1 accent-ink min-w-0"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <input
        type="number"
        className="w-[72px] shrink-0 font-code text-[12px] bg-card border border-line rounded-field px-2 py-1"
        step={step}
        value={Math.round(value * 100) / 100}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}
