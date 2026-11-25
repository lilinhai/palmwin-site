# 站点维护说明

给维护者看的，不是给访客看的。访客请读 [README.md](README.md)。

## 目录

```
.
├── index.html              首页
├── privacy-policy.html     隐私政策（与应用内 assets/privacy-policy.html 逐字一致）
├── assets/style.css        全站样式（深浅两套，无外部依赖）
├── img/                    产品图（来自应用仓库的 guide/images 与 drawable-nodpi）
├── blog/
│   ├── index.html          文章列表
│   ├── *.md                正文源文件，改这里
│   └── *.html              由 md 生成，不要手改
└── tools/mdgen.js          md → html 生成脚本
```

## 加一篇新文章

1. 在 `blog/` 下新建 `some-slug.md`：

```markdown
# 标题

> 第一段引用会自动成为该页的 meta description。

## 一节

正文。
```

2. 生成 HTML：

```bash
node tools/mdgen.js
```

3. 在 `blog/index.html` 与 `index.html` 的列表里各加一条链接。

生成器支持：一到六级标题、段落、粗体、行内代码、有序/无序列表、引用、分隔线、管道表格。
不支持代码块高亮、脚注、内嵌 HTML —— 这批文章用不到，为它们引入完整解析器不值得。

## 同步隐私政策

应用里的那份在 `app/src/main/assets/privacy-policy.html`。两份必须逐字一致：一份给已安装的用户在应用内查证，一份给审核员和潜在用户在下载前阅读。

改的时候从应用仓库复制过来，不要各改各的：

```bash
cp ../windows-rdp-android/app/src/main/assets/privacy-policy.html ./privacy-policy.html
```

改完跑一次校验，MD5 必须相同：

```bash
md5sum privacy-policy.html ../windows-rdp-android/app/src/main/assets/privacy-policy.html
```

## 部署

GitHub Pages 已开启：`Deploy from a branch`，分支 `main`、目录 `/`。

- 站点首页 <https://lilinhai.github.io/palmwin-site/>
- 隐私政策 <https://lilinhai.github.io/palmwin-site/privacy-policy.html>

push 到 `main` 后 Pages 自动重建，通常 30~60 秒。没有 Actions 工作流，用的是 GitHub 内置的静态发布。

**仓库名不要改。** 改了 Pages 地址就跟着变，旧地址不会跳转——这个 URL 已经填进应用市场的提审表单，一改审核员点开就是 404。

国内访问 Pages 不稳定时，可以在 Gitee 建同名仓库做镜像。只要 `privacy-policy.html` 能公开访问即可，其余是加分项。

## 发布 APK

APK **不进 git**。二十多个版本 × 21 MB 会把仓库撑到几个 G，clone 会变得没法忍受。
走 GitHub Release 附件，附件不占仓库体积，也没有单文件大小限制（Release 附件上限 2 GB）。

发一次：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\release.ps1 `
  -Tag 'v0.54.0' `
  -Apk 'D:\dev-env\workspace\windows-rdp-android\output\live\Palmwin-0.54.0-store-release.apk' `
  -NameFile '.\tools\release-name.tmp' `
  -BodyFile '.\tools\release-body-0.54.0.md'
```

`release-name.tmp` 是 UTF-8 的标题（一行），`release-body-0.54.0.md` 是发布说明。
脚本从 `git credential fill` 取 token，不需要 `gh` 登录；同名 release 与同名附件都会复用，重跑安全。

**只发 store 包。** owner 包有 `OWNER_BUILD=true`，等于把付费功能白送出去。脚本里有硬检查，
文件名含 `owner` 直接抛错退出。

下载地址固定形状：

```
https://github.com/lilinhai/palmwin-site/releases/download/v0.54.0/Palmwin-0.54.0-store-release.apk
```

发完一定要验一次 MD5，别只看脚本说成功：

```powershell
(Get-FileHash <下载的文件> -Algorithm MD5).Hash
```

## 发到 CSDN

`blog/*.md` 就是为了能直接粘贴到 CSDN 编辑器而写的：不含 YAML front matter、不含相对链接、不含本地图片引用。

一篇一贴，标题用文件里的 `# 标题`。表格与引用块 CSDN 都能正确渲染。

节奏比数量重要：每篇间隔 2~3 天，同一账号短时间批量发会压低推荐权重。

## 图片

`img/` 里的图来自应用仓库，换图时同步改两处：

| 站点 | 应用内 |
|---|---|
| `img/hero-pc.jpg` | `assets/guide/images/00-hero-pc-terminal.jpg` |
| `img/thin-client.jpg` | `assets/guide/images/00b-thin-client.jpg` |
| `img/dock.jpg` | `assets/guide/images/00d-dock.jpg` |
| `img/connect.jpg` | `assets/guide/images/01-connect-top.jpg` |
| `img/ime.jpg` | `assets/guide/images/04-ime.jpg` |
| `img/ime-menu.jpg` | `assets/guide/images/04a-ime-menu.jpg` |
| `img/pointer.jpg` | `assets/guide/images/06-pointer-mode.jpg` |

都是 JPEG，单张 60~170 KB。真机截图桌面版裁掉状态栏再用（应用内那批已经裁过）。

竖长的手机截图在 HTML 里要加 `class="tall"`，样式会限高 560px 并居中，否则一张就顶掉两屏。

## 许可

文章文字内容与产品图版权归作者所有，转载注明出处。样式与生成脚本随意使用。
