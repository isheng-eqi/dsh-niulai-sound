# 验证清单（VERIFICATION）

安装后按以下步骤验证插件工作。

## 环境

- Windows 10/11 + DeepSeek Harness Web profile
- `dsh plugin --profile web add github:isheng-eqi/dsh-niulai-sound` → 重启 dsh web

## 步骤

1. **确认插件已加载**：`dsh --profile web --dump-config | grep niulai-sound` 应出现该行。
2. **触发审批**：在会话中让模型执行一个需要用户确认的操作（如升级沙箱权限写文件）。
3. **预期**：
   - 审批弹窗出现时听到「妈妈」（6.2s 原声片段）；
   - 立即点允许 → 「妈妈」被掐断，听到「牛来！」（1.8s 原声片段）；
   - 点拒绝 → 无「牛来」。
4. **无声音排查**：
   - 系统音量/播放设备是否正常；
   - 日志中是否有 `[dsh-niulai-sound] play failed:`（查看 dsh web 进程输出）；
   - 确认运行在 Windows（PowerShell + System.Media 依赖）。

## 开发自检

```sh
node scripts/prepack-check.js   # 发布前健康检查
node scripts/smoke.js           # wav 素材校验
```
