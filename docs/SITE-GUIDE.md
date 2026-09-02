# ~wei@nwpu · 站点说明（编辑指南）

> 写给以后改这个站的你（Windows / 本机都适用）。读完这一份就能放心动手。
> 最后更新：2026-09-02（终端版 v1）

## 1. 这个站是什么

- **假终端**：整站是一个 xterm.js 终端；首屏是 jyy 式 profile（ASCII 大名 + 可点击的命令链接行，点词即执行命令），往下敲命令继续逛；`help` 看全部命令
- **主题**：右上角 `☀ / ☾` 或 `theme` 命令切换深浅色；默认深色绿磷光，浅色纸白墨绿
- **灵感与架构致敬**：[jiangyy.github.io](https://jiangyy.github.io/)（jyy）
- **托管**：GitHub Pages，`push main` → Actions 自动 `npm run build` → 发 Pages，约 1 分钟
- 线上：<https://jiatong-wei.github.io>
- 回滚：`git revert` 一个 commit 即回到 AcadHomepage 层；更早是 leo-nightcity v5

## 2. 文件地图

```
self-website/ (= GitHub 上的 jiatong-Wei.github.io 仓库)
├── index.html              页面壳：顶栏、按钮栏、overlay、noscript 兜底
├── content/                ★ 全部内容（纯 markdown，无 frontmatter）
│   ├── about.md  awards.md  news.md  links.md
│   └── wiki/*.md           研究记录，文件名即命令名
├── public/
│   ├── images/gc/          赛场照片（grasp / prototype / venue）
│   └── files/              技术报告 PDF
├── scripts/build-content.ts   编译器：content/*.md → src/generated/content.ts
├── src/
│   ├── term/               xterm 封装、ANSI/markdown 渲染、按钮栏、灯箱
│   ├── shell/              行编辑器、管道解析、REPL
│   ├── apps/               命令实现（builtins 内建 / fun 彩蛋 / registry 注册表）
│   └── main.ts             入口：开机序列
├── .github/workflows/deploy.yml   push 自动部署（不用动）
└── archive/jekyll/         旧 AcadHomepage 层（留档，不再维护）
```

## 3. 日常改什么

| 想改的 | 文件 |
| --- | --- |
| 自我介绍 / 项目列表 / 教育 | `content/about.md` |
| 获奖 | `content/awards.md` |
| 首页 News（3–5 条带 emoji） | `content/news.md` |
| 友链与名言 | `content/links.md` |
| 研究记录 | `content/wiki/*.md` |
| 首屏（ASCII 大名 / 链接行 / Last update） | `src/apps/builtins.ts`（`profileScreen`、`ART_*`） |
| bring-up 日志（`boot` 命令） | `src/apps/builtins.ts`（`BOOT_LINES`） |
| neofetch 身份卡 / rostopic / 彩蛋 | `src/apps/fun.ts` |
| 深浅主题配色 | `src/term/ui.ts` 的 `DARK` / `LIGHT` |
| 首屏可点击的命令词 | `src/term/ui.ts` 的 `CMD_MAP` |
| `open` 命令目标 | `src/apps/env.ts` 的 `OPEN_TARGETS` |

## 4. 文章的元数据与标识

每篇 `content/*.md` 开头是 HTML 注释（编译器解析，不进正文）：

```markdown
<!-- cert: hitl -->          Human in the loop：用了生成式AI，并由我 review
<!-- cert: human -->         Human：本文未使用生成式AI工具
<!-- title: 标题 -->
<!-- date: 2026.08 -->
<!-- summary: 一句话摘要，wiki 目录用 -->
```

`ls wiki` / `wiki` 会显示 `[HITL]` / `[H]` 徽标，`cat` 时头部打印证书行。

文内引用别的文章用 `` `wiki/xxx` `` 代码格式（终端里显示为朱砂色码块）；外链直接写 markdown 链接（渲染成可点击链接）；图片提示用 `` `open gc-1` ``。

## 5. 本地预览

```bash
npm install          # 首次
npm run dev          # http://localhost:5173，改 content/ 自动重编译
npm run build && npm run preview   # 产物预览 http://localhost:4173
```

## 6. 上线

`git push` 到 `main` 即部署。若 Pages 报错，到仓库 Settings → Pages 确认 Source 是 **GitHub Actions**。

## 7. 不要做的事

- 不要把 `website-material/GC/` 的 4K 视频推进 git（约 1.5 GB）；等 B 站 BV 号，回填 `open bilibili` 的目标即可
- 不要手改 `src/generated/content.ts`（编译产物）
- 不要动 `archive/jekyll/`（留档回滚用）
- 没有 Google Scholar ID 就不要恢复 scholar 爬虫（已归档到 `archive/jekyll/google_scholar_crawler/`）

## 8. 已知边界

- 手机端：按钮是主导航；点终端区域可唤起软键盘直接敲命令
- 窄屏上敲超长单行命令时，视觉重绘可能残留上一行幽灵字符（xterm 行回绕限制）；按 Enter 或 `clear` 即恢复，不影响命令执行
- 窗口大幅缩放后，首屏 ASCII 大字会因终端重排错乱，刷新页面即恢复
- 中文 IME：主流浏览器（Chrome/Edge/Safari）实测路径正常；若某输入法组合异常，用按钮或英文命令可绕过
- `drive` 遥控小车命令是预留的 stretch goal，尚未实装
- emoji 宽度未做特殊处理：news 里的 emoji 显示正常，但未来若把 emoji 加进需要对齐的表格，列宽会歪
