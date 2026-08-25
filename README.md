# LEO.WEI // NIGHT CITY

Leo Wei（@JIATONG-WEI）的个人主页 —— 赛博朋克（Cyberpunk: Edgerunners）美学的单屏应用式站点，现为**机器人学习方向作品集**。

**零依赖、零构建**：纯 HTML/CSS/原生 JS，用任意静态服务器即可运行：

```bash
cd leo-nightcity
python3 -m http.server 8623
# 打开 http://127.0.0.1:8623
```

```
leo-nightcity/
├── index.html              # 站点骨架（pane/卡结构，文案在 data.js）
├── css/style.css           # 完整设计系统（CSS 变量驱动）
├── js/
│   ├── data.js             # 内容数据层（项目/媒体/日志/时间线，改内容只动这里）
│   └── app.js              # 渲染 + 交互 + 动效（原生 JS，~250 行）
├── assets/
│   ├── fonts/
│   │   └── jbmono-wght.woff2   # JetBrains Mono 可变字体（本地自托管）
│   ├── img/                # 训练曲线图（learning_curve / act-day5-train-curve）
│   └── media/              # 演示视频（mp4）+ posters/（视频封面 jpg）
└── README.md               # 本文档
```

---

## 一、设计决策与理由

### 1. 为什么是"单屏 + Tab 切换"而不是滚动长页

滚动长页是商详页/营销页的语法；个人主页的访客（导师、合作者、招聘方）需要的是 **3 秒内建立"这个人技术可信"的判断**。因此整个站点是一个 1440×900 的单屏应用：左侧身份信息面板**始终在场**，右侧内容通过顶部分段 Tab（项目/写作/知识图谱/关于）切换，默认不滚轮。小屏（≤960px）自动降级为纵向滚动布局。

### 2. 为什么是赛博朋克，以及如何避免"压抑感"

视觉锚点是配色系统（黄/青/品红/绿四色霓虹），整套色板集中在 `:root`：

| Token | 值 | 职责 |
|---|---|---|
| `--yellow #FCEE0A` | 主权色 | 可交互元素、标题块、日期、CTA |
| `--cyan #00F0FF` | 次级 | 系统标签（`SYS://`）、技术栈 tag、边框高光 |
| `--magenta #FF2A6D` | 点缀 | 仅用于故障错位层、REC 红点 |
| `--green #4ADE80` | 语义 | 在线/运行状态 |

底色为**深石板蓝**（`#0C0E13`），暗角减弱、扫描线减半、辉光增强——赛博元素全部保留，画面是"夜晚的城市街道"而非"地下室"。**所有颜色集中在 `:root` 的 CSS 变量里，换肤只改一处。**

### 3. 字体策略

- **JetBrains Mono**（本地自托管可变字体）：所有标签、数据、英文。等宽体是"终端感"的来源。最初走 Google Fonts CDN，国内加载失败导致全线回退——故下载到 `assets/fonts/` 彻底离线化。
- **中文用系统栈**（PingFang SC / 微软雅黑）：Noto Sans SC 官方拆成 101 个 unicode 分包，全量自托管得不偿失；系统中文字体渲染已足够干净。

### 4. 设计语言词汇表

- **RGB 错位故障**：姓名/Logo 由青、品红、白三层叠加（`::before/::after` + `clip-path` 裁切），静态时轻微错位，hover 时抖动
- **黄块黑字标题**：边缘行者标题卡语法（`精选项目`、`全部文章`…）
- **警示纹切角**：项目卡右上角的黄黑斜纹三角（`repeating-linear-gradient` + `clip-path`）
- **终端语法**：`SYS://PROJECTS`、`LOG://WRITING`、`PROCESSES`、`$ whoami`、EOF 收尾
- **监控视角**：项目图上的 `CAM_01 · REC` 红点，把项目照片变成"监控 footage"
- **氛围层**：青色网格底纹 + 青/品红径向辉光 + 两侧 01 数据雨 + CRT 扫描线 + 轻微暗角

## 二、页面结构（作品集版 v4）

| Tab | 内容 |
|---|---|
| **01 项目** | ① 旗舰卡：**Isaac Sim × ACT 数据管线**（showcase_reel 视频 hero + 数字统计：12 演示/3600 帧/224² 腕部 RGB/SE(3) 动作/0.860 loss）② 第二卡：**PushT ACT 50k**（50k 步/0.448/0.993/0.95GB）③ **视频墙**：8 条媒体（点击播放，含 oracle 抓取、域随机化三联、闭环 eval 诚实记录、PushT 三档对比、两张曲线图） |
| **02 写作** | FEATURED 头条（今日管线记录）+ 8 篇日志（ACT/EVAL/3DGS/RL/ROS2/VLA 标签）+ EOF |
| **03 WIKI** | 知识图谱（ACT/SIM2REAL/VLA/ISAAC 节点）+ 相关统计 + RECENT 条目 |
| **04 关于** | EDU/FOCUS/TIMELINE/NOW/LINKS 六段，时间线含 2026 Isaac 全链路 |

## 三、内容维护指南

**所有内容都在 `js/data.js` 里编辑**（站点数据驱动），部分文案仍在 `index.html`：

| 要改什么 | 在哪里 |
|---|---|
| 旗舰项目数据（亮点/指标） | `js/data.js` → `ISAAC_PROJECT` / `PUSHT_PROJECT` |
| 视频墙条目（媒体/视频/图） | `js/data.js` → `MEDIA_WALL` |
| 日志列表 / 时间线 / 链接 | `js/data.js` → `POSTS` / `TIMELINE` / `LINKS` |
| 新增视频 | 放入 `assets/media/`，poster 放 `assets/media/posters/`，在 `MEDIA_WALL` 加一项 |
| 换肤 | `css/style.css` 的 `:root` 变量 |
