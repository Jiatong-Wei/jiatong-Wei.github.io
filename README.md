# 魏佳桐

个人主页，基于 [AcadHomepage](https://github.com/RayeRen/acad-homepage.github.io)（[示例](https://rayeren.github.io/)）。

线上：<https://jiatong-wei.github.io>

## 改什么

- 身份、邮箱、GitHub：`_config.yml`
- 首页（关于我 / 项目 / 教育）：`_pages/about.md`
- 获奖：`_pages/awards.md`
- 链接卡片：`_pages/links.md`
- 项目长文：`_pages/*.md`
- 头像：有证件照后放到 `images/avatar.jpg`，并在 `_config.yml` 的 `author.avatar` 填路径（现在留空）

详见 `docs/SITE-GUIDE.md`。

## 本地预览

```bash
bundle install
bundle exec jekyll build
python3 -m http.server 4000 --directory _site
```

打开 <http://127.0.0.1:4000>。
