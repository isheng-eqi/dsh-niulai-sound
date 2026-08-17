/**
 * dsh-niulai-sound — 牛来确认音（DSH 审批音效，静态插件版）
 *
 * 梗源：国产动画电影《牛来》（信雨萌+妈妈孙丽芳两人手搓 5 年）。
 * 行为：当 DSH 需要用户确认时（审批弹窗出现）播放「妈妈」；
 *       用户批准瞬间掐断「妈妈」并直接播放「牛来！」——
 *       效果：妈妈~（还没说完）牛来！！点得越快衔接越干脆。
 *
 * 实现：
 * - 监听 session/event 审计流中的 approval/asked 与 approval/decided：
 *   注意不能用 approval/request 瀑布流事件——它是 Scoped 事件，
 *   插件 ctx 的作用域不匹配时收不到；session/event 是 emit 审计流，通用可靠。
 * - 播放：ctx.subprocess spawn powershell + System.Media.SoundPlayer（PlaySync），
 *   音频 wav 随包发布（assets/）。批准时 terminate() 掐断正在播放的进程（树级）。
 * - 零外部依赖，纯 Windows 原生（macOS/Linux 可自行扩展播放实现）。
 */
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const name = 'dsh-niulai-sound'

/** subprocess 为可选服务，apply 内用 ctx.get 读取，不声明硬依赖 */
export const inject = []

/** 本包根目录（lib/ 上一级；src 与安装后均适用） */
const PACKAGE_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))

/** 音频文件（随包发布，PlaySync 阻塞播放，wav PCM 兼容 SoundPlayer） */
const WAV = {
  ask: resolve(PACKAGE_ROOT, 'assets', 'mama.wav'),
  ok: resolve(PACKAGE_ROOT, 'assets', 'niulai.wav'),
}

export function apply(ctx, config) {
  const sub = ctx.get('subprocess')
  if (sub === undefined) return

  const diag = {
    approvalAsked: 0,
    approvalDecided: 0,
    plays: 0,
    interrupts: 0,
    failures: [],
    last: null,
  }

  // 当前播放句柄：批准时中断它（妈妈被掐断，牛来立刻顶上）
  let current = null

  const play = (wav, which) => {
    // 直接替换：若有正在播的，先掐断
    if (current) {
      try { current.handle.terminate() } catch { /* noop */ }
      diag.interrupts += 1
      current = null
    }
    sub.resolveExecutable('powershell.exe').then((exe) => {
      const script = `Add-Type -AssemblyName System.Media; $p = New-Object System.Media.SoundPlayer('${wav}'); $p.PlaySync()`
      const h = sub.spawn({
        argv: [exe, '-NoProfile', '-NonInteractive', '-Command', script],
        cwd: process.cwd(),
        stdio: { stdin: 'ignore', stdout: { maxBytes: 4096 }, stderr: { maxBytes: 4096 } },
        graceMs: 3000,
      })
      current = { handle: h, which }
      h.done.then((out) => {
        if (current && current.handle === h) current = null
        diag.plays += 1
        diag.last = { which, ok: true, exitCode: out.exitCode }
      }).catch((e) => {
        if (current && current.handle === h) current = null
        diag.failures.push(String((e && e.message) || e))
        diag.last = { which, ok: false, err: String((e && e.message) || e) }
        console.error(`[${name}] play failed:`, String((e && e.message) || e))
      })
    }).catch((e) => {
      diag.failures.push(String((e && e.message) || e))
      console.error(`[${name}] resolve failed:`, String((e && e.message) || e))
    })
  }

  const stop = () => {
    if (current) {
      try { current.handle.terminate() } catch { /* noop */ }
      diag.interrupts += 1
      current = null
    }
  }

  // 审批审计流：approval/asked -> 妈妈；approval/decided(allowed-once) -> 掐断妈妈 + 牛来
  ctx.on('session/event', (session, event) => {
    if (event && event.type === 'approval/asked') {
      diag.approvalAsked += 1
      diag.last = { which: 'asked', ok: null }
      play(WAV.ask, 'ask')
    } else if (event && event.type === 'approval/decided') {
      diag.approvalDecided += 1
      if (event.data && event.data.outcome === 'allowed-once') {
        stop()
        play(WAV.ok, 'ok')
      }
    }
  })
}

export default { name, inject, apply }
