# LEO.WEI // NIGHT CITY

Leo Wei 的个人主页 —— 赛博朋克（Cyberpunk: Edgerunners）美学的单屏应用式站点。

**零依赖、零构建**：三个核心文件 + 两个本地资产，用任意静态服务器即可运行：

```bash
cd leo-nightcity
python -m http.server 8623
# 打开 http://127.0.0.1:8623
```

```
leo-nightcity/
├── index.html              # 全部结构与内容
├── css/style.css           # 完整设计系统（CSS 变量驱动）
├── js/app.js               # 全部交互与动效（~130 行原生 JS）
├── assets/
│   ├── avatar.webp          # 头像（448×448 压缩版，页面引用；原图备份 avatar-src.png）
│   └── fonts/
│       └── jbmono-wght.woff2   # JetBrains Mono 可变字体（本地自托管）
└── README.md               # 本文档
```

---

## 一、设计决策与理由

### 1. 为什么是"单屏 + Tab 切换"而不是滚动长页

滚动长页是商详页/营销页的语法；个人主页的访客（导师、合作者、招聘方）需要的是 **3 秒内建立"这个人技术可信"的判断**。因此整个站点是一个 1440×900 的单屏应用：左侧身份信息面板**始终在场**，右侧内容通过顶部分段 Tab（项目/写作/Wiki/关于）切换，全程无需滚轮。小屏（≤960px）自动降级为纵向滚动布局。

### 2. 为什么是赛博朋克，以及如何避免"压抑感"

视觉锚点是头像（边缘行者的 Martinez：黄色高领、青/品红霓虹），整套色板从头像取色：

| Token | 值 | 职责 |
|---|---|---|
| `--yellow #FCEE0A` | 主权色 | 可交互元素、标题块、日期、CTA |
| `--cyan #00F0FF` | 次级 | 系统标签（`SYS://`）、技术栈 tag、边框高光 |
| `--magenta #FF2A6D` | 点缀 | 仅用于故障错位层、REC 红点 |
| `--green #4ADE80` | 语义 | 在线/运行状态 |

早期版本底色近黑（`#060609`），用户反馈"太压抑"。当前提亮为**深石板蓝**（`#0C0E13`），同时把暗角减弱 40%、扫描线减半、辉光增强——赛博元素全部保留，但画面从"地下室"变成"夜晚的城市街道"。**所有颜色集中在 `:root` 的 CSS 变量里，换肤只改一处。**

### 3. 字体策略

- **JetBrains Mono**（本地自托管可变字体）：所有标签、数据、英文。等宽体是"终端感"的来源。最初走 Google Fonts CDN，国内加载失败导致全线回退——这是"和画布差距大"的根因，故下载到 `assets/fonts/` 彻底离线化。
- **中文用系统栈**（PingFang SC / 微软雅黑）：Noto Sans SC 官方拆成 101 个 unicode 分包，全量自托管得不偿失；系统中文字体渲染已足够干净。

### 4. 设计语言词汇表

- **RGB 错位故障**：姓名/Logo 由青、品红、白三层叠加（`::before/::after` + `clip-path` 裁切），静态时轻微错位，hover 时抖动
- **黄块黑字标题**：边缘行者标题卡语法（`精选项目`、`全部文章`…）
- **警示纹切角**：项目卡右上角的黄黑斜纹三角（`repeating-linear-gradient` + `clip-path`）
- **终端语法**：`SYS://PROJECTS`、`LOG://WRITING`、`PROCESSES`、`$ whoami`、EOF 收尾
- **监控视角**：项目图上的 `CAM_01 · REC` 红点，把项目照片变成"监控 footage"
- **氛围层**：青色网格底纹 + 青/品红径向辉光 + 两侧 01 数据雨 + CRT 扫描线 + 轻微暗角

## 二、动效系统（设计原则：动效是"系统运行的证据"，不是装饰）

| 场景 | 效果 | 实现 |
|---|---|---|
| 开机 | 终端自检日志逐行打出（170ms/行）→ 黑场上滑揭示 → 四层内容错峰入场 → 姓名 scramble 解码 | JS 时序编排 + CSS transition |
| Tab 切换 | 旧面板左滑淡出（140ms，90ms 后新面板叠加浮入）→ **子元素级联**（50ms 间隔） | CSS keyframes + class 切换 |
| 霓虹抖动 | hover 姓名/Logo 时 RGB 层以**真随机间隔**（40~340ms）切换三种错位姿态，且有空态——匀速抖动是"AI 味"的来源，随机才像真实信号 | JS `setTimeout` 递归 + `.j1/.j2/.j3` 类 |
| 进程状态 | RUNNING 旋转加载环 / TRAINING 打点进度 / QUEUED 慢呼吸 | 纯 CSS |
| 常态 idle | 光标 1Hz 闪烁、锁定环 30s 旋转、数据雨缓降、标题块每 6~10s 随机"电压不稳"闪烁 | CSS + JS 随机间隔 |
| 时钟 | 底部状态栏显示"现实时间 + 51 年"的夜城时间 | JS `setInterval` |

**红线**：`prefers-reduced-motion: reduce` 时全部动效关闭、开机跳过、内容直接呈现（无障碍承诺）。

## 三、内容维护指南

所有内容都在 `index.html` 里直接编辑，无数据层：

| 要改什么 | 在哪里 |
|---|---|
| 头像 | 替换 `assets/avatar.webp`（448×448 WebP；原图备份 `assets/avatar-src.png`；裁切位置：CSS `.avatar__img img` 的 `object-position`） |
| 项目卡 | `#pane-projects` 里的三个 `<article class="card">`；配图替换 `.ph-img` 为 `<img>` |
| 文章列表 | `.log__row`（首页三条 / 写作页全量） |
| 进程列表 | `.procs`（PID/名称/状态，状态类：`st--run`/`st--train`/`st--queue`） |
| 在读论文 | `.side-stack` 的 READING 卡（进度改 `--p` 数值） |
| 关于页 | `#pane-about`（EDU/FOCUS/TIMELINE/NOW/QUOTE/LINKS 六段） |
| 换肤 | `style.css` 的 `:root` 变量 |
| 简历 PDF | 放到 `assets/cv.pdf`（DOWNLOAD CV 与 about 头部的 CV.PDF 均指向此路径） |
| 文章/入口链接 | MORE / ALL_POSTS / RSS / ALL_ENTRIES / about 的 RSS 已用 `<!-- TODO: 接博客后恢复 -->` 注释保留在 `index.html`，接博客后取消注释并指向真实路由 |

## 四、已知边界与后续路线

1. **当前是纯静态原型**（设计验证用）。生产化路线：把这套 HTML/CSS 平移进现有 Next.js 工程，文章内容接回原来的 markdown 渲染管线（`public/blogs/`），Wiki 图谱可复用旧代码库的 d3 引擎。
2. 项目配图是 CSS 占位（虚线框标注 `PROJECT_0X.PNG`），**实装务必换真实项目照片**——这直接决定"技术可信"的第一印象。
3. 文章链接、RSS、MORE 等入口已用 `<!-- TODO: 接博客后恢复 -->` 注释保留在 `index.html`（死链已清零），接博客系统时取消注释并指向真实路由。
4. 进程 PID、阅读进度、时间线内容均为示例数据，按真实情况改。

---

## 五、部署

本仓库通过 GitHub Actions 自动部署到 GitHub Pages：workflow 文件为 `.github/workflows/deploy.yml`（push 到 `main` 时自动触发，也支持在 Actions 页手动运行 `workflow_dispatch`）。纯静态、无构建步骤，直接打包仓库根目录，全站资源均为相对路径，根路径与子路径部署均兼容。

部署设置：仓库 **Settings → Pages → Source** 需选择 **GitHub Actions**（而非 Deploy from a branch）。

注意：`index.html` 中的 `og:url` / `og:image` 使用 `https://jiatong-wei.github.io/` 绝对地址——若仓库最终部署在子路径（`https://<user>.github.io/<repo>/`），需按实际部署 URL 校正这两处。

---

## 六、变更日志

### V5（2026-08-15 晚）

1. **新增 Logo**：SVG 图形标——切角方框（青色描边）+ 黄色 "L" 笔画 + 品红圆点，三色即全站色板；hover 旋转 90°；同一图形用作 favicon。页面 `<title>` 按用户要求简化为纯 `LEO.WEI`，删除中文副题。
2. **按钮升级**：主按钮（DOWNLOAD CV）加下载图标、右上 14px 切角、hover 斜向扫光 + 黄色辉光；次按钮（GITHUB）加章鱼图标、左下切角、hover 转青 + 内发光。两按钮从"色块+文字"升级为有造型语言的组件。
3. **修复大屏底部空白**：项目卡片区改为弹性填充（`.cards` flex:1 + 图片 `flex:1` 拉伸），任意视口高度下内容都能撑满——此前固定 300px 图高导致 1080p 屏幕下方留白（用户截图白圈区域）。
4. **写作页升级**：新增 FEATURED 头条卡（左侧黄色 accent 条 + 大标题 + 摘要 + 日期/标签/READ→），列表行增加右侧技术标签 chip（RL/ROS2/VLA），列表区 flex 拉伸填满。
5. **Wiki 页升级**：图谱节点加文字标注（3DGS/RL/VLA/ROS2 + 次级 dim 标签），底部新增 RECENT://ENTRIES 最新条目列表（类型/标题/日期三栏）。
6. **细节**：Logo 图标辉光与旋转 hover、按钮扫光。

### V4（2026-08-15 傍晚）

- 霓虹抖动改 JS 真随机（`.j1/.j2/.j3` + 空态，40~340ms 随机间隔），删除 CSS 匀速动画——匀速抖动是"AI 味"的来源。
- 进程状态动画：RUNNING 旋转加载环 / TRAINING 打点 / QUEUED 慢呼吸。
- 首页底部改双栏：日志 + READING（在读论文 + 进度条）/ TAGS 云。
- 关于页扩为六段：EDU/FOCUS/TIMELINE/NOW/QUOTE/LINKS。
- 卡片 hover 双色叠印、Tab 悬停下划线、头像裁切修正。

### V3（2026-08-15 傍晚）

- 色阶提亮（`#060609` → `#0C0E13` 深石板蓝），解决"太压抑"反馈；暗角/扫描线减弱，辉光增强。
- 开屏改终端自检日志（逐行打出 → 上滑揭示）；Tab 切换改滑出+级联浮入。
- 技能读条 → 进程列表（PROCESSES）；头像接入真实图片。
- JetBrains Mono 本地化（Google Fonts 国内不可达是字体失真根因）。

### V2（2026-08-15 下午）

- 初版实现：单屏骨架、四 Tab、开机/切换动效、数据雨、扫描线、夜城时钟。
