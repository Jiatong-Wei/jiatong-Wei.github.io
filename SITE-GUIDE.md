# 个人主页 · 站点说明文档（Windows 修改指南）

> 写给稍后在 Windows 上继续改这个站点的你。读完这一份就能放心动手。
> 最后更新：2026-08-28（v5：全宽 wiki 版）

---

## 1. 这个站是什么

- **单屏面板式个人 wiki**：整页一屏（桌面端不滚动），左列常驻身份、右列标签切换视图（首页 / 文章 / 项目 / 关于）
- **零依赖零构建**：原生 HTML/CSS/JS 三件套，不需要 npm / webpack / 任何安装
- **托管**：GitHub Pages，`push main` 后 ~30 秒自动上线（Actions 自动部署）
- 线上地址：https://jiatong-wei.github.io
- 旧版设计保留在 `v1-archive` 分支，可随时回看/回滚

## 2. 文件地图

```
leo-nightcity/  (= GitHub 上的 jiatong-Wei.github.io 仓库)
├── index.html          页面骨架：所有区块的结构和静态文案
├── css/style.css       全部样式 + 设计变量（配色/字体/动效都在这）
├── js/app.js           交互：中英文字典、文章数据、动效逻辑
├── assets/
│   ├── media/          视频 (*.mp4) 与封面 (*.jpg，在 posters/ 子目录)
│   ├── img/            会议 logo (venue_*.png)、曲线图
│   └── fonts/          自托管字体 (Space Grotesk / JetBrains Mono, woff2)
├── .github/workflows/deploy.yml   push 自动部署（不用动）
├── README.md           简介与本地运行
└── SITE-GUIDE.md       本文档
```

## 3. Windows 上快速开始

```powershell
git clone https://github.com/Jiatong-Wei/jiatong-Wei.github.io.git
cd jiatong-Wei.github.io

# 本地预览（三选一）：
python -m http.server 8000        # 若 python 指向 v2 用 py -3 -m http.server 8000
# 或 VS Code 装 "Live Server" 插件，右键 index.html → Open with Live Server
# 浏览器打开 http://127.0.0.1:8000
```

改完 → `git add -A && git commit -m "说明" && git push` → 等 ~30 秒刷新线上。

> 换行符提示：仓库是 LF。Windows 下建议 `git config core.autocrlf input`，避免整文件 diff。

## 4. 只改文案（不动代码结构）

**90% 的文案都在 `js/app.js` 顶部的 `I18N` 字典里**，`zh` 和 `en` 各一份，键名对应：

| 键 | 控制什么 |
|---|---|
| `hero_line` | 左列一句话介绍 |
| `chip_1..3` | 左列方向标签 |
| `h_welcome` / `h_intro` | 首页问候与自我介绍段 |
| `isaac_title` / `isaac_p1` / `isaac_p2` | 项目卡片标题与两段正文 |
| `st1..st4` | 四个统计数字下的标签 |
| `tl1..tl5` | 时间线条目 |
| `a1_t` / `a1_s` / `a1_b` | 文章的标题 / 摘要 / 正文（见 §5） |

HTML 里带 `data-i18n="键名"` 的元素会被字典**覆盖**——改字典就生效，别去改 HTML 里的中文（那只是初始值/回退）。

**统计数字**在 `index.html` 的 `.stats` 区块：`data-count="0.094" data-dec="3"` 控制数值与小数位，`data-suffix="+"` 控制后缀，`<span class="stat__u">m</span>` 是单位。数字滚动动画只在首次进入项目视图触发一次。

## 5. 加一篇新文章

三步，全在 `js/app.js`：

1. `ART_KEYS` 数组加 `"a5"`（顺序即显示顺序）
2. `ART_DATES` 数组加对应日期字符串，如 `"2026.09.10"`
3. `I18N.zh` 和 `I18N.en` 各加三个键：`a5_t`（标题）、`a5_s`（一句话摘要）、`a5_b`（正文，纯文本可多句）

渲染和手风琴展开都是自动的。首页"文章"速览卡上的"4 篇"字样记得同步（字典键 `h_arts_n`）。

## 6. 换媒体素材

- **首页/项目视频**：替换 `assets/media/showcase_reel.mp4`（当前 1280×720 / h264 / ~2.3MB）和封面 `assets/media/posters/showcase_reel.jpg`。保持 16:9、体积 ≤5MB（加载速度）。视频是**点击播放**、`object-fit: contain` 完整显示，不会裁切
- **其他实验视频**（domain_rand_ep01.mp4 等）已在库中，未来做多视频时可参照 `.media-frame` 结构复制
- **会议 logo**：`assets/img/venue_*.png`，灰色滤镜是 CSS（`filter: grayscale(1)`），传彩图也会被压灰
- 新素材先压缩再入库（视频 ffmpeg crf 28、图 pngquant/squoosh）

## 7. 设计系统（改风格看这里）

### 配色——一处换全站

`css/style.css` 顶部 `:root` 变量（深色模式在 `[data-theme="dark"]` 里对应改）：

```css
--paper: #F7F4EC;   /* 背景：暖象牙纸 */
--ink:   #221E1A;   /* 正文墨色 */
--accent:#BC3B22;   /* 唯一强调色：朱砂红（改这一个就能全站换色相） */
--line:  #E2DCCC;   /* 发丝线/边框 */
--frame: #FFFFFF;   /* 视频卡纸（深色模式下保持浅色,白色仿真画面不突兀） */
```

想换墨绿/藏青：只改 `--accent`（浅色）和深色模式里的 `--accent` 即可。

### 字体

自托管两个 woff2（`assets/fonts/`），`@font-face` 在 style.css 顶部。中文走系统字体栈（Noto Sans SC → 苹方 → 雅黑），无需引入中文字体文件。

### 布局断点

- `>1080px`：标准单屏（首页 hub 左图右文）
- `880–1080px`：首页 hub 上下堆叠
- `<880px`：整站退化为常规滚动页（手机）
- 高度 `<720px`：压缩留白、隐藏 arxiarxi 长文案

## 8. 动效清单（在哪、怎么关）

| 动效 | 位置 | 关法 |
|---|---|---|
| 名字逐字浮现 | `@keyframes chRise` + js `splitName()` | 删 `splitName` 调用 |
| 标签方向性滑动 | `@keyframes viewIn/viewInBack` | 删 `.view.is-on.anim` 规则 |
| 指示条弹簧 | `.tab-ind` 的 `transition` + `--spring` | 改普通 `ease` |
| 主题交叉淡化 | `::view-transition-*` + js `startViewTransition` | js 里去掉分支 |
| 机械臂漂浮/视差 | `@keyframes armFloat` / js `parallax()` | 删对应段 |
| 按钮磁吸 | js `磁吸` 段 | 删 |
| 数字累加 | js `countUp()` | 删 |

系统级"减弱动态效果"开启时全部自动禁用（`prefers-reduced-motion`），无需处理。

## 9. 机械臂装饰（首页主视觉）

`index.html` 里 `id="armSvg"` 的整段 SVG 是手绘 Franka 线稿（连杆/关节/夹爪/虚线轨迹/目标方块/准星/坐标三轴/尺寸标注），配色跟随主题变量（`currentColor` + `var(--accent)`）。想调整姿势就是改几个 `path d` 的坐标；想换掉整个装饰，替换 `hub__arm` 里的 SVG 即可（保留外层 figure 和 caption）。

## 10. 部署与回滚

- **部署**：push `main` → GitHub Actions（.github/workflows/deploy.yml）→ Pages，约 30 秒
- **看部署状态**：仓库 Actions 页签，绿勾 = 上线
- **回滚单次改动**：`git revert <commit>` 再 push
- **回滚到旧版设计**：`git checkout v1-archive -- .` 后提交（赛博朋克旧版）

## 11. 常见坑

1. **改了 HTML 里的中文但线上没变** → 那段文案被 `data-i18n` 字典覆盖了，去 `app.js` 改
2. **视频黑屏** → poster 路径错了或 mp4 换成了非 h264 编码（重新 `ffmpeg -c:v libx264`）
3. **字体没生效** → @font-face 的相对路径 `../assets/fonts/` 是相对 css/ 的，挪 style.css 位置时要改
4. **宽屏两侧空白** → 检查是否有人给 `.stage` 加回了 `max-width`（v4 及以前有 1360px 帽，v5 已移除）
5. **手机上不能滚** → 只在 >880px 锁滚动；若手机卡住先查是否有元素高度溢出触发了锁
6. **线上缓存旧版** → Pages 部署后强刷（Ctrl+F5）；HTML/CSS 均无版本号参数，必要时给 `style.css` 链接加 `?v=6` 查询串

## 12. 与参考站（lvyovo-wiki）的功能对应

| 参考 | 本站对应 | 状态 |
|---|---|---|
| 问候 hero | 顶栏时段问候 + 时钟 | ✅ |
| 最新文章 | 首页"最新动态"3 条 + 文章页 | ✅（4 篇种子文） |
| 我的项目 | 项目视图（Isaac 旗舰 + arxiarxi） | ✅ |
| 日历/音乐播放器/看板娘 | — | 未做（与本站气质不符，建议不追） |
| 友链/推荐分享 | — | 可作为第五个标签页 future |

---

*本站与 Isaac 项目解耦：素材从 RA-apply 的 outputs 拷贝而来，文字数字需手动同步。*
