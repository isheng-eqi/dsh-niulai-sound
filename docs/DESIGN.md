# dsh-niulai-sound — 设计说明

> 记录关键设计决策与踩坑，便于维护者与贡献者理解。

## 为什么监听 `session/event` 而不是 `approval/request`

第一版曾监听 `approval/request` 瀑布流事件，结果**收不到**：

- `approval/request` 是 **Scoped 瀑布流事件**（`this: Scoped<ApprovalService>`），通过 `scopeTarget(service, agent)` 派发；
- 监听器必须挂在匹配的 agent 作用域（或其祖先链）上才能收到；普通插件 ctx 作用域不匹配时静默收不到；
- 实测：插件内直接调用 `approval.request()` 返回 `allowed-once`（事件确实发生），但监听器计数为 0。

改用 **`session/event`**（emit 审计流）：

- 审批的审计对 `approval/asked` / `approval/decided` 由 approval service **强制写入 session 日志**（`session.append`），随后触发 `session/event`（post-commit append feed）；
- emit 事件对监听器作用域要求宽松，实测可靠；
- 覆盖所有审批路径（文件沙箱升级、工具审批等），因为审计对是统一写入的。

## 播放实现

- **PowerShell + System.Media.SoundPlayer**（`PlaySync`）：Windows 原生，wav PCM 直播，零外部依赖；
- **掐断**：`SubprocessHandle.terminate()` 是树级终止（Windows 上 `taskkill /T`），批准瞬间杀掉正在播放的「妈妈」进程，「牛来！」立刻接上；
- **防叠加**：单实例持有当前播放句柄，新播放先 `terminate()` 旧进程，多审批并发不叠声。

## 音频来源

- 「妈妈」（6.2s）与「牛来！」（1.8s）取自《牛来》经典片段原声（抖音热门片段，@洋葱办刘主任）；
- 裁剪用 ffmpeg：`ffmpeg -i in.mp4 -ss <start> -to <end> -vn -acodec pcm_s16le -ar 44100 -ac 1 out.wav`；
- 素材版权归原作者/片方，本插件仅作梗文化传播用途。

## 已知限制

- 播放依赖 Windows（PowerShell + System.Media）；macOS/Linux 下 `resolveExecutable('powershell.exe')` 会失败并静默跳过（`failures` 记录在案）；
- 音频为固定内置 wav；可用环境变量 `NLW_MAMA_WAV` / `NLW_NIULAI_WAV` 覆盖路径（v1.1.0+）。
