# 个人主页编辑说明

站点模板来自 [AcadHomepage](https://github.com/RayeRen/acad-homepage.github.io)，版式对齐 [rayeren.github.io](https://rayeren.github.io/)。这是 Jekyll 站，不要再改已经删掉的 `index.html` / `js/data.js`。

## 日常改什么

| 想改的 | 文件 |
| --- | --- |
| 名字、邮箱、GitHub、城市、侧栏简介 | `_config.yml` 的 `author` |
| 自我介绍、项目摘要、教育 | `_pages/about.md` |
| 获奖 | `_pages/awards.md` |
| 链接卡片与名言 | `_pages/links.md` |
| 智能物流长文 | `_pages/gc-logistics.md` |
| Isaac / DAgger / PushT / git 短记 | `_pages/` 下对应 md |
| 技术报告 PDF | `files/Isaac_Grasping_Research_Report.pdf` |
| 赛场照片 | `images/gc/` |
| 侧栏头像 | `_config.yml` 的 `author.avatar`（现在留空；有证件照后放到 `images/avatar.jpg` 并填路径） |
| 顶栏目录 | `_data/navigation.yml` |
| 顶栏锚点失效 | 看 `_pages/about.md` 里 `h1`；Kramdown 会把 `# 📝 项目` 编成 `/#-项目` |

## 笔记标识

AI 起草、你 review 过的文章，文首保留：

```html
<span class="cert-hitl" title="本文使用了生成式AI工具，并且我进行了review">Human in the loop</span>
```

未使用生成式 AI 的，改成 `Human`，title 写成「本文未使用生成式AI工具」。

## 不要做的事

- 不要把 `website-material/GC/` 里的 4K 视频推进 GitHub（合计约 1.5 GB）。B 站 BV 号有了以后，再写回 `_pages/gc-logistics.md`。
- 不要往技术报告 PDF 里混入五日弧之后的实验。
- 没有 Google Scholar ID 就不要打开 `.github/workflows/google_scholar_crawler.yaml` 的定时任务。

## 本地预览

```bash
cd website-material/self-website
bundle install
bundle exec jekyll build
python3 -m http.server 4000 --directory _site
```

浏览器打开 http://127.0.0.1:4000 。模板自带的 `jekyll serve` 在较新的 Ruby 上会在 watch 阶段报错，用 build + 静态服务器即可。改 md 后重新 `jekyll build`。

## 上线

`git push` 到 `Jiatong-Wei/jiatong-Wei.github.io` 的 `main`。Actions 用 Jekyll 构建再发 Pages，仓库根目录不再当静态站上传。
