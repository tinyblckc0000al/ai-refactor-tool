# AI Refactor Tool

> VSCode 扩展：AI 驱动的代码重构工具

## 功能

- ✅ Python AST 解析（使用 Python 内置 ast 模块）
- ✅ 依赖图提取（导入、函数调用、类继承关系）
- ✅ Mermaid 可视化
- ✅ CLI 支持（`--graph` 输出 Mermaid）
- ⏳ AI 重写（待接入 Codex/Gemini）

## 快速开始

```bash
# 安装依赖
cd ai-refactor-tool
npm install

# 编译 TypeScript
npm run compile

# 打开 VSCode 调试
# 按 F5 启动扩展开发主机
```

## 使用方法

### CLI

```bash
# 分析依赖（默认文本输出）
node cli.js analyze ./my_project

# 输出 Mermaid 图表
node cli.js analyze ./my_project --graph

# 查找循环依赖
node cli.js circular ./my_project
```

### VSCode 扩展

1. 打开一个 Python 文件
2. 右键选择 `AI Refactor: Analyze Code` 或使用命令面板 (`Cmd+Shift+P`)
3. 在右侧面板查看 AST 和依赖图

## 项目结构

```
ai-refactor-tool/
├── src/
│   ├── cli.ts            # CLI 入口
│   ├── extension.ts      # 扩展入口
│   ├── parser/
│   │   └── pythonParser.ts  # Python AST 解析
│   ├── analyzer/
│   │   └── dependencyGraph.ts # 依赖图分析
│   └── webview/
│       └── provider.ts   # Webview UI
├── package.json
├── tsconfig.json
└── test_sample.py        # 测试文件
```

## 技术栈

- VSCode Extension (TypeScript)
- Python ast 模块
- Mermaid.js 可视化
- AI: Codex/Gemini (待接入)

## 状态

**Phase 1: MVP** - 完成 90%
- [x] VSCode 脚手架
- [x] Python AST 解析
- [x] 依赖图提取
- [x] Mermaid 可视化
- [x] CLI 支持
- [ ] AI 重写（Phase 2）
