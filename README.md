# 🎵 Music Player

一个部署在 GitHub Pages 上的音乐播放器静态网页。

> **域名:** [music.19910724.xyz](https://music.19910724.xyz)

## ✨ 功能特性

- 🎧 完整的音乐播放控制（播放/暂停、上一首、下一首）
- 🔀 随机播放 & 循环模式（单曲循环/列表循环）
- 🎚️ 可拖拽的进度条 & 音量控制
- 📊 实时音频可视化（频率柱状图）
- 📋 播放列表（点击切换歌曲）
- 🎨 精美的深色渐变 UI（玻璃态设计）
- ⌨️ 键盘快捷键支持
- 📱 响应式设计（适配手机/平板/桌面）

## 🚀 快速开始

### 1. 添加音乐

将你的 MP3 文件放入 `music/` 文件夹，然后编辑 `js/player.js` 文件中的 `PLAYLIST` 数组：

```javascript
const PLAYLIST = [
  {
    title: '歌曲名称',
    artist: '艺术家',
    file: 'music/你的文件.mp3',
    cover: 'img/封面图片.svg'  // 可选，不填则使用默认封面
  },
  // 继续添加更多歌曲...
];
```

### 2. 自定义封面（可选）

将封面图片放入 `img/` 文件夹，支持 SVG、PNG、JPG 格式。

### 3. 本地预览

```bash
# 使用 Python 启动本地服务器
python3 -m http.server 8080

# 或使用 Node.js
npx serve .
```

然后浏览器打开 `http://localhost:8080`

### 4. 部署到 GitHub Pages

推送到 GitHub 仓库的 `main` 分支即可自动部署。

## ⌨️ 快捷键

| 按键 | 功能 |
|------|------|
| `Space` | 播放/暂停 |
| `←` / `→` | 快退/快进 5 秒 |
| `↑` / `↓` | 增加/减少音量 |
| `N` | 下一首 |
| `P` | 上一首 |
| `M` | 静音切换 |
| `S` | 随机播放切换 |
| `R` | 循环模式切换 |

## 📁 项目结构

```
music/
├── index.html          # 主页面
├── CNAME               # 自定义域名配置
├── README.md           # 项目说明
├── css/
│   └── style.css       # 样式表
├── js/
│   └── player.js       # 播放器核心逻辑
├── img/
│   └── default-cover.svg  # 默认专辑封面
└── music/              # 存放音乐文件
    └── .gitkeep
```

## 🛠️ 技术栈

- 原生 HTML5 / CSS3 / JavaScript
- [Font Awesome](https://fontawesome.com) 图标库
- Web Audio API（音频可视化）
- CSS Glassmorphism 设计
- 完全无依赖，开箱即用