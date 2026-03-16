# AI Refactor Tool

> VSCode 扩展：AI 驱动的代码重构工具

## 功能列表（完整）

| 命令 | 功能 | 说明 |
|------|------|------|
| `analyze` | 分析 Python 代码结构 | AST 解析，展示函数/类/导入 |
| `graph` | 依赖图 | Mermaid 格式输出 |
| `circular` | 循环依赖检测 | 检测模块间循环引用 |
| `rename` | 重命名 | AI 驱动重命名函数/变量/类 |
| `extract` | 提取变量 | AI 驱动提取表达式为变量 |

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

# 重命名函数/变量/类
node cli.js rename ./my_project old_name new_name

# 提取变量（AI 驱动）
node cli.js extract ./my_project --expression "x + y"
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

**Phase 1: MVP** - ✅ 完成
- [x] VSCode 脚手架
- [x] Python AST 解析
- [x] 依赖图提取
- [x] Mermaid 可视化
- [x] CLI 支持
- [x] AI 重写（rename/extract）
