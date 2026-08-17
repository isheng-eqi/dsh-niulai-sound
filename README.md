# 🐂 dsh-niulai-sound

> **牛来确认音** — DeepSeek Harness 审批音效插件，梗源国产动画电影《**牛来**》（导演信雨萌 + 妈妈孙丽芳两人手搓 5 年、零投资的"草台班子"神作）。

当 DSH 需要用户确认时播放「**妈妈**」，用户点允许的瞬间**掐断**「妈妈」直接播放「**牛来！**」——妈妈~（还没说完）牛来！！点得越快衔接越干脆。

## ✨ 效果

| 时机 | 音频 |
|---|---|
| 审批弹窗出现（需要确认） | 「妈妈」（原声片段） |
| 用户批准（allowed-once） | **掐断**「妈妈」→「牛来！」（原声片段） |
| 用户拒绝 / 取消 | 不播放 |

音频取自《牛来》经典片段原声（抖音热门片段，122 万人在看的那条），随包内置，无需联网。

## 🚀 安装

```sh
# 从 GitHub
dsh plugin --profile web add github:isheng-eqi/dsh-niulai-sound

# 从 npm（发布后）
dsh plugin --profile web add dsh-niulai-sound
```

安装后**重启 dsh web** 即生效：所有会话自动加载，无需手动激活。

### 想先试试？

在任意会话让模型执行动态插件（`cordis_define` + `cordis_run`），或直接触发一次需要审批的操作（如升级沙箱权限写文件）即可听到效果。

## 🛠 实现要点

- **事件源**：监听 `session/event` 审计流中的 `approval/asked` / `approval/decided`（`outcome === 'allowed-once'` 判定批准）。
  > 为什么不用 `approval/request`？它是 **Scoped 瀑布流事件**（per-agent 作用域），普通插件 ctx 作用域不匹配时收不到；`session/event` 是 emit 审计流，任何审批路径（文件升级、工具审批）都强制写入，通用可靠。
- **播放**：Windows 原生 `powershell + System.Media.SoundPlayer`（wav PCM，零外部依赖）。
- **掐断**：批准瞬间对正在播放的进程执行树级 `terminate()`（taskkill /T），声音立即中断、「牛来！」立刻接上。
- **防叠加**：单实例持有当前播放句柄，新播放先掐断旧的，多审批并发不叠声。

## 📁 结构

```
dsh-niulai-sound/
├── package.json         # dsh.bundle.patch 声明（静态 bundle）
├── cordis.patch.yml     # 插件行 insert（id: niulai-sound）
├── lib/index.js         # Host 插件（session/event 监听 + 播放）
└── assets/
    ├── mama.wav         # 「妈妈」原声（6.2s）
    └── niulai.wav       # 「牛来！」原声（1.8s）
```

## 📋 Requirements

- DeepSeek Harness Web profile（`dsh web`）
- Windows（播放依赖 PowerShell + System.Media；macOS/Linux 可自行扩展播放实现）

## 🔧 疑难排查

| 现象 | 处理 |
|---|---|
| 弹窗出现但没声音 | 检查系统音量；查看 dsh web 进程输出有无 `[dsh-niulai-sound] play failed:`；确认在 Windows 上运行 |
| 想换自己的音频 | 设置环境变量 `NLW_MAMA_WAV` / `NLW_NIULAI_WAV` 指向 wav 文件路径（需为 PCM wav） |
| 发布前自检 | `node scripts/prepack-check.js`（manifest/patch/素材校验）+ `node scripts/smoke.js`（wav 格式与时长） |

## 📦 社区收录

DSH 社区生态的一部分。已收录进 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)。

## 📄 License

MIT
