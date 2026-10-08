# ClipQuotes - 随手收藏

一款浏览器扩展，在任意网页选中文字，右键即可收藏。非常适合收集知乎、博客、文章中的精彩段落和人生感悟。

支持 Chrome、Edge 和 Safari 浏览器。

[![Stars](https://img.shields.io/github/stars/eason-joker/clipquotes?style=social)](https://github.com/eason-joker/clipquotes/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Chrome](https://img.shields.io/badge/Chrome-extensions-green.svg)](https://chrome.google.com/webstore)
[![Safari](https://img.shields.io/badge/Safari-extensions-blue.svg)]()

## 功能特性

| 功能 | 说明 |
|------|------|
| **右键收藏** | 在任意页面选中文字 → 右键 →「Save Quote」 |
| **来源记录** | 自动保存：页面标题、URL、收藏时间 |
| **标签管理** | 为每条收藏添加多个标签，方便分类 |
| **备注** | 写下你的感想或补充说明 |
| **搜索** | 支持按摘录、标题、标签、备注全文搜索 |
| **编辑/删除** | 点击按钮编辑标签、备注或删除 |
| **复制句子** | 一键复制原文 |
| **Markdown 导出** | 一键导出全部收藏为 Markdown 文件 |
| **本地存储** | 所有数据仅保存在本机，不上传、不登录 |

## 截图

### 主界面
![主界面](screenshots/popup-main.png)

### 编辑弹窗
![编辑弹窗](screenshots/popup-edit.png)

## 支持浏览器

| 浏览器 | 版本要求 | 下载 |
|--------|----------|------|
| Chrome / Edge | Manifest V3 支持 | [下载 ZIP](releases/clipquotes-chrome.zip) |
| Safari | macOS Safari 16+ | [下载 ZIP](releases/clipquotes-safari.zip) |

## 快速安装

### Chrome / Edge

1. 下载 [Chrome 版本](releases/clipquotes-chrome.zip)
2. 打开 `chrome://extensions/`
3. 开启右上角 **「开发者模式」**
4. 点击 **「加载已解压的扩展程序」**
5. 选择解压后的 `chrome/` 文件夹

### Safari

1. 下载 [Safari 版本](releases/clipquotes-safari.zip)
2. 打开 Safari → **偏好设置** → **扩展**
3. 如需导出功能，开启 **「允许扩展下载文件」**
4. 选中 "ClipQuotes" 并启用扩展

## 项目结构

```
ClipQuotes/
├── README.md              # 英文说明
├── README_zh-CN.md        # 中文说明
├── LICENSE                # MIT 许可证
├── chrome/                # Chrome/Edge 版本
├── safari/                # Safari 版本
├── releases/              # 安装包
│   ├── clipquotes-chrome.zip
│   └── clipquotes-safari.zip
└── screenshots/          # 截图
```

## 权限说明

| 权限 | 用途 |
|------|------|
| `contextMenus` | 创建右键菜单 "Save Quote" |
| `activeTab` | 获取当前页面信息（标题、URL） |
| `storage` | 将收藏记录保存在浏览器本地 |

**隐私承诺：** 本扩展不会收集、传输或分享任何用户数据。

## Markdown 导出示例

```markdown
# ClipQuotes

> 3 条  |  导出时间：2024/1/15 14:30

## 1. 什么是幸福

**摘录：**
> 人最宝贵的是生命，生命对每个人只有一次...

**来源：** [知乎 - 什么是幸福](https://www.zhihu.com/question/12345)
**收藏时间：** 2024/1/15 14:25
**标签：** 人生、感悟
**备注：** 经典名言

---
```

## 参与贡献

欢迎贡献代码！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解贡献指南。

## 开源协议

MIT License - 详见 [LICENSE](LICENSE)

---

⭐ 如果这个项目对你有帮助，请给我一个 Star！

📢 欢迎在社交媒体上分享这个项目！
