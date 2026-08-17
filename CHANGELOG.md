# Changelog

## v1.1.0 (2026-08-17)

- feat: 音频路径可用环境变量覆盖（`NLW_MAMA_WAV` / `NLW_NIULAI_WAV`）
- build: 新增 `prepack-check.js` 发布健康检查（校验 bundle manifest / patch / wav 素材）
- docs: 新增 DESIGN.md（事件选择、播放实现、已知限制）与 VERIFICATION.md（测试清单）

## v1.0.0 (2026-08-17)

- 初始发布：审批音效「妈妈」/「牛来！」（电影《牛来》原声）
- `approval/asked` → 播放「妈妈」；`approval/decided` (allowed-once) → 掐断并播放「牛来！」
- 静态 bundle 形态（`dsh.bundle.patch`），`dsh plugin add` 一行安装
