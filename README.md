# ~wei@nwpu — 终端式个人主页

个人主页，做成一个假装成终端的交互应用：访客敲命令（或点按钮）浏览内容。架构致敬 [蒋炎岩的主页](https://jiangyy.github.io/)（jyy 的作业真香）。

线上：<https://jiatong-wei.github.io>

## 改内容

全部内容是 `content/` 下的纯 markdown，无 frontmatter；文件头部注释提供元数据：

```markdown
<!-- cert: hitl -->            ← Human in the loop 标识（或 human）
<!-- title: 文章标题 -->
<!-- date: 2026.08 -->
<!-- summary: 一句话，wiki 目录用 -->
```

- 首页四篇：`content/about.md`、`awards.md`、`news.md`、`links.md`
- 研究记录：`content/wiki/*.md`（文件名即命令名，`wiki/xxx`）
- 赛场照片：`public/images/gc/`；技术报告 PDF：`public/files/`
- 身份卡/开机日志/彩蛋文案：`src/apps/builtins.ts`、`src/apps/fun.ts`

详见 `docs/SITE-GUIDE.md`。

## 本地开发

```bash
npm install
npm run dev        # http://localhost:5173，改 content/ 热更新
npm run build      # 产物在 dist/
```

## 上线

`git push` 到 `main`，GitHub Actions 自动 `npm run build` 并发布 Pages，约 1 分钟。

## 技术栈

Vite + TypeScript + [xterm.js](https://xtermjs.org/)，自制小 shell（管道、历史、Tab 补全），markdown 经 marked 编译为 token 后渲染成 ANSI。旧版（leo-nightcity v5 与 AcadHomepage 中间层）保留在 git 历史与 `archive/jekyll/`。
