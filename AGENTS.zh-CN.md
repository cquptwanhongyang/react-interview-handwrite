# 仓库贡献指南

## 项目结构与模块划分

- `src/` — 应用源码。`main.tsx` 负责挂载应用，`App.tsx` 是根组件，`index.css` 与 `App.css` 存放全局样式和组件样式。
- `src/assets/` — 由组件 import 的打包资源（`hero.png`、`react.svg` 等）。
- `public/` — 原样拷贝的静态文件，通过 `/` 访问（`favicon.svg`、`icons.svg`）。
- `index.html` — Vite 的 HTML 入口。
- `vite.config.ts`、`eslint.config.js`、`tsconfig*.json` — 工具链配置。
- 目前没有测试目录，仅在引入测试时再创建。

## 构建、测试与开发命令

- `npm install` — 安装依赖。
- `npm run dev` — 启动带 HMR 的 Vite 开发服务器。
- `npm run build` — 先用 `tsc -b` 做类型检查，再打包输出到 `dist/`。
- `npm run preview` — 本地预览生产构建产物。
- `npm run lint` — 对整个仓库运行 ESLint。
- 项目没有 `test` 脚本，请把 `npm run lint` 与 `npm run build` 作为验收门槛。

## 代码风格与命名约定

- 沿用现有风格：2 空格缩进、单引号、不写分号。
- 组件及其文件名使用大驼峰（`App.tsx`）；Hook 与变量使用小驼峰（`useState`）；资源文件名保持小写（`hero.png`）。
- 已启用 `verbatimModuleSyntax`，类型导入请用 `import type`；`noUnusedLocals` / `noUnusedParameters` 会导致构建失败，请及时删除无用代码。
- 未配置 Prettier，请与相邻文件保持一致格式，并在提交前运行 `npm run lint`。

## 测试指南

- 暂未配置测试框架，请用 `npm run lint` 和 `npm run build` 验证改动。
- 如需新增测试，推荐 Vitest + React Testing Library，按 `src/**/*.test.tsx` 就近放置，并按测试验证的行为命名。

## 提交与 Pull Request 规范

- 当前工作区没有 `.git` 元数据，无法归纳历史提交信息。建议采用 Conventional Commits，例如 `feat(scope): ...`、`fix: ...`、`docs: ...`，使用祈使句，标题不超过 72 个字符。
- PR 需说明新增的题目或组件、关联相关 issue，附上 `lint` / `build` 结果，涉及 UI 改动时附截图。
