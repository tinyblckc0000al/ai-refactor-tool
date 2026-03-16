# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-03-16

### Added
- CLI 支持 `--graph` 选项输出 Mermaid 依赖图
- 支持 `analyze` 和 `circular` 子命令
- 新增 `graph` 命令作为 `analyze --graph` 的别名
- 添加函数调用关系分析（Call edges）

### Changed
- README 更新 CLI 使用说明

### Fixed
- 循环依赖检测逻辑修复

---

## [0.0.1] - 2025-03-06

### Added
- 项目初始化
- Python AST 解析器
- 依赖图提取（Import/Inherit）
- Mermaid 可视化
- VSCode 扩展脚手架
