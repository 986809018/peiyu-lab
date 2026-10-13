<!--
 * @Author: {lipeiyu}
 * @Date: 2026-10-13 14:20:17
 * @LastEditTime: 2026-10-13 15:11:36
 * @LastEditors: {lipeiyu}
 * @Description: 个人技术实验室官网
-->
# Peiyu Lab

个人技术实验室官网 —— 单页站点，中英双语，纯静态部署。

线上地址：<https://peiyulab.top/>

## 技术栈

| 项 | 选择 |
| --- | --- |
| 框架 | React 19 |
| 语言 | TypeScript（`strict` + `erasableSyntaxOnly`） |
| 构建 | Vite 8 |
| 样式 | 原生 CSS，无 UI 框架 |
| 运行时依赖 | 仅 `react` / `react-dom` |

## 快速开始

```bash
npm install
npm run dev      # 开发服务器（HMR）
npm run build    # 类型检查 + 生产构建，输出到 dist/
npm run preview  # 本地预览构建产物
npm run lint     # ESLint
```

部署即把 `dist/` 整个目录上传到站点根目录即可，产物使用绝对路径（`/assets/...`）。

## 目录结构

```
index.html                 入口文档：SEO / Open Graph / 字体预连接 / favicon
public/
  favicon.svg              品牌图标（P. 标记）
  apple-touch-icon.png     iOS 主屏图标
  og-image.png             社交分享大图（1200x630）
scripts/
  make-brand-assets.py     重新生成上面两张 PNG（依赖 Pillow）
  screenshot.mjs           无头 Chrome 截图工具，用于视觉回归
src/
  main.tsx                 挂载入口
  index.css                设计令牌 + reset + 基础元素样式
  App.css                  布局与组件样式
  App.tsx                  页面结构 + 中英文案
```

## 样式约定

`src/index.css` 是唯一的令牌来源，改主题色或字号只需动这里：

- 颜色：`--bg`、`--text`、`--text-dim`、`--accent`、`--hairline` …
- 字号：`--fs-hero`、`--fs-h2`、`--fs-title`、`--fs-body`、`--fs-ui`、`--fs-mono`、`--fs-mono-sm`
- `--fs-mono-sm`（11px）是**可读性下限**：标签、标签云、图注都不低于此值。

`src/App.css` 按「Shell / Header / Hero / Projects / Project detail / Card artwork / About / Footer」分节，
每个选择器只出现一次，响应式集中在文件末尾（1400 / 900 / 600 三档），动效降级集中在最后一节。

> 注意 `.site-shell` 使用 `overflow-x: clip` 而非 `hidden`：`hidden` 会让它成为滚动容器，
> 从而破坏吸顶导航的 `position: sticky`；`clip` 既能裁掉装饰性光晕的横向溢出，又不创建滚动容器。

## 文案与国际化

所有可见文案（含项目卡片的分类、状态、详情标签「概述 / 目标 / 方法 / 当前进展」）都集中在
`src/App.tsx` 顶部的 `translations` 对象里，通过 `satisfies Record<Language, Copy>` 约束结构 ——
漏翻一个键会直接编译失败。

- 项目清单由 `projectOrder` 驱动，`Record<ProjectId, ProjectCopy>` 保证每个项目都有完整译文；
  「03 个方向 / 03 AREAS」由列表长度推导，新增项目不会漏改数字。
- 切换语言时会同步 `document.documentElement.lang`，并把选择写入 `localStorage`
  （`peiyu-language`，存储不可用时静默回退到中文）。

新增一个项目：在 `projectOrder` 里加 ID → 在两个语言的 `projects` 里补齐对应条目即可。

## 品牌资源

`public/og-image.png` 与 `public/apple-touch-icon.png` 由脚本生成，改了配色后重新生成：

```bash
python3 scripts/make-brand-assets.py    # 需要 Pillow 与 numpy
```

## 视觉回归

`scripts/screenshot.mjs` 通过 DevTools Protocol 驱动无头 Chrome 截图，支持整页捕获与点击后再截图：

```bash
npm run build
python3 -m http.server 4321 --directory dist &
node scripts/screenshot.mjs http://127.0.0.1:4321/ shot.png 1440
node scripts/screenshot.mjs http://127.0.0.1:4321/ open.png 1440 --click=.project-toggle
node scripts/screenshot.mjs http://127.0.0.1:4321/ mobile.png 390
```

输出末尾会打印一行 DOM 报告（`lang`、卡片数、展开数、是否横向溢出、最小字号），
可直接当作断言用。
