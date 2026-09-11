/**
 * 개발용 캐릭터 미리보기 실행기.
 *
 *   npm run preview            창을 띄운다 (나란히 보기)
 *   npm run preview -- --editor  키프레임 편집기로 바로 연다
 *   npm run preview -- --shot    .preview/characters.png 로 캡처하고 종료
 *   npm run image-capture-studio  촬영장 탭으로 바로 연다
 */

const path = require('node:path')
const fs = require('node:fs')
const { app, BrowserWindow, session } = require('electron')

const CAPTURE = process.argv.includes('--shot')
const EDITOR = process.argv.includes('--editor')
const STUDIO = process.argv.includes('--studio')
const HOP = process.argv.includes('--hop')
const DANCE = process.argv.includes('--dance')
const WAVE = process.argv.includes('--wave')
const OUTPUT = path.join(
  __dirname,
  '..',
  '.preview',
  EDITOR ? 'editor.png' : WAVE ? 'wave.png' : DANCE ? 'dance.png' : HOP ? 'hop.png' : 'characters.png',
)
const STUDIO_OUT = path.join(__dirname, '..', '.preview', 'studio')

void app.whenReady().then(async () => {
  // 촬영장이 만드는 PNG 는 이 창에서 일어나는 유일한 내려받기라, `--studio` 여부와
  // 상관없이 항상 걸어 둔다. 플래그로 갈라 두면 탭만 옮겨 연 사람에게 저장 대화상자가
  // 매번 떠서 여러 장 연달아 찍는 일이 막힌다. `session.defaultSession` 은 app 이
  // ready 여야 쓸 수 있으므로, 창을 만들기 전인 지금이 걸 수 있는 첫 자리다.
  session.defaultSession.on('will-download', (_event, item) => {
    fs.mkdirSync(STUDIO_OUT, { recursive: true })
    item.setSavePath(path.join(STUDIO_OUT, item.getFilename()))
    item.once('done', (_doneEvent, state) => {
      if (state === 'completed') console.log(`찍었습니다 → ${item.getSavePath()}`)
      else console.error(`저장하지 못했습니다 (${state})`)
    })
  })

  const window = new BrowserWindow({
    // 편집기·촬영장은 오른쪽에 패널이 붙으므로 나란히 보기보다 넓고 높아야 한다
    width: STUDIO ? 1440 : EDITOR ? 1500 : 1360,
    height: STUDIO ? 900 : EDITOR ? 820 : 560,
    backgroundColor: '#f5efe1',
    title: 'SimSim Friends 캐릭터 미리보기',
  })

  await window.loadFile(path.join(__dirname, '..', 'dist-renderer', 'preview', 'index.html'), {
    hash: STUDIO ? 'studio' : EDITOR ? 'editor' : '',
  })

  if (!CAPTURE) return

  // 첫 프레임이 그려지고 idle 애니메이션이 자리를 잡을 때까지 잠시 기다린다
  await new Promise((resolve) => setTimeout(resolve, 1500))

  if (HOP || DANCE || WAVE) {
    // 시간차로 움직이게 한 뒤 한 장에 동작의 여러 단계를 담는다
    const call = WAVE
      ? 'window.__waveAll(150)'
      : DANCE
        ? 'window.__danceAll(140)'
        : 'window.__hopAll(130)'
    await window.webContents.executeJavaScript(call)
    await new Promise((resolve) => setTimeout(resolve, WAVE ? 820 : DANCE ? 760 : 620))
  }
  const image = await window.capturePage()
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
  fs.writeFileSync(OUTPUT, image.toPNG())
  console.log(`captured → ${OUTPUT}`)
  app.quit()
})

app.on('window-all-closed', () => app.quit())
