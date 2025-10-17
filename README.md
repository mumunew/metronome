# 节拍器（Metronome）

一个简单的前端节拍器应用，使用 `HTML + CSS + JavaScript` 构建。项目为纯静态站点，适合托管在 GitHub Pages 或 Vercel。

## 项目结构

- `index.html`：主页面
- `script.js`：节拍器核心逻辑
- `需求说明.md`：需求与说明文档

## 本地预览

- 双击打开 `index.html` 即可在浏览器中运行。
- 或使用任意静态服务器进行预览，例如：
  - `npx serve .`
  - `npx http-server .`

## 推送到 GitHub（命令行）

1. 初始化仓库并提交（已在下方步骤执行）：
   ```bash
   git init
   git add .
   git commit -m "chore: initial commit"
   ```
2. 在 GitHub 上创建仓库（任一方式）：
   - 使用 GitHub CLI（推荐，需已登录）：
     ```bash
     gh repo create <YOUR_GITHUB_USERNAME>/metronome --public -y
     ```
   - 或用 PAT 调用 API（需设置环境变量 `GITHUB_TOKEN`）：
     ```bash
     curl -H "Authorization: token $env:GITHUB_TOKEN" -H "Accept: application/vnd.github+json" \
       https://api.github.com/user/repos -d '{"name":"metronome","private":false}'
     ```
3. 添加远程并推送：
   ```bash
   git branch -M main
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/metronome.git
   git push -u origin main
   ```

> 提示：若使用 HTTPS 推送并启用了双因素认证，请使用 **Personal Access Token (PAT)** 作为密码。

## 在 Vercel 部署（两种方式）

### 方式 A：通过 Vercel 控制台（零配置）

1. 打开 `https://vercel.com/new` 并登录。
2. 连接 GitHub 账号，选择刚推送的仓库（例如 `metronome`）。
3. 框架选择 `Other` 或自动识别为静态站点，保持默认配置。
4. 点击部署，完成后会得到一个形如 `https://metronome-xxx.vercel.app` 的地址。

### 方式 B：通过 Vercel CLI（可选）

1. 安装 CLI：`npm i -g vercel`
2. 登录：`vercel login`（或使用环境变量 `VERCEL_TOKEN`）
3. 在项目根目录执行：
   ```bash
   vercel --yes --prod
   ```

> 纯静态站点无需 `vercel.json`，Vercel 会自动将根目录静态文件部署。如果后续需要自定义路由或重写，可再添加配置文件。

## 许可证

此项目仅用于学习与演示用途，未设置许可证。