# 掌窗 Palmwin · 站点与文章

这个仓库只做两件事：

1. 托管**掌窗**的隐私政策，给应用市场提审和一个公开可查的地址。
2. 放一批开发笔记，写清楚做这个客户端过程中真正踩过的问题。

不包含应用源码。

## 目录

```
.
├── index.html              首页
├── privacy-policy.html     隐私政策（与应用内 assets/privacy-policy.html 逐字一致）
├── assets/style.css        全站样式（深浅两套，无外部依赖）
├── blog/
│   ├── index.html          文章列表
│   ├── *.md                文章正文（源文件，改这里）
│   └── *.html              由 md 生成（不要手改）
└── tools/mdgen.js          md → html 生成脚本
```

## 加一篇新文章

1. 在 `blog/` 下新建 `some-slug.md`，写普通的 Markdown：

```markdown
# 标题

> 第一段引用会自动成为页面的 meta description。

## 一节

正文。
```

2. 跑一下生成：

```bash
node tools/mdgen.js
```

3. 在 `blog/index.html` 与 `index.html` 的列表里各加一条链接。

生成器支持：一级到六级标题、段落、粗体、行内代码、有序/无序列表、引用、分隔线、管道表格。不支持代码块高亮、脚注、内嵌 HTML —— 这批文章用不到，为它们引入完整解析器不值得。

## 发布到 GitHub Pages

仓库设置 → Pages → Source 选 `Deploy from a branch`，分支 `main`、目录 `/ (root)`。保存后地址是：

```
https://<用户名>.github.io/<仓库名>/
```

隐私政策就是 `.../privacy-policy.html`，这个地址填到应用市场的提审表单里。

如果国内访问 Pages 不稳定，可以在 Gitee 建一个同名仓库做镜像，或者用任意静态托管把这三个文件放上去。**只要 `privacy-policy.html` 能公开访问即可**，其余是加分项。

## 同步隐私政策

应用内的那份在 `app/src/main/assets/privacy-policy.html`。两份必须逐字一致：一份给已安装的用户在应用内查证，一份给审核员和潜在用户在下载前阅读。

改的时候从应用仓库复制过来，不要各改各的：

```bash
cp ../windows-rdp-android/app/src/main/assets/privacy-policy.html ./privacy-policy.html
```

## 发到 CSDN

CSDN 的编辑器支持直接导入 Markdown。`blog/*.md` 就是为此准备的：不含 YAML front matter、不含相对链接、不含本地图片引用，复制粘贴即可。

一篇一贴，标题用文件里的 `# 标题`。表格与引用块 CSDN 都能正确渲染。

## 许可

文章文字内容版权归作者所有，转载注明出处。样式与生成脚本随意使用。
