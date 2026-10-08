# 知乎句子收藏夹

一个 Safari Web Extension（Safari 网页扩展），帮助你在知乎收藏感兴趣的金句段落。

## 功能特性

| 功能 | 说明 |
|------|------|
| **右键收藏** | 在知乎页面选中任意文字 → 右键 →「收藏这句话」 |
| **来源记录** | 自动保存：原文、页面标题、链接、作者（如能识别）、收藏时间 |
| **标签管理** | 为每条收藏添加多个标签，方便分类 |
| **备注** | 写下你的感想或补充说明 |
| **搜索** | 支持按摘录、标题、标签、备注全文搜索 |
| **编辑/删除** | 点击任意收藏卡片即可编辑标签、备注或删除 |
| **Markdown 导出** | 一键导出全部收藏为 Markdown 文件 |
| **本地存储** | 所有数据仅保存在本机，不上传、不登录、不接入云服务 |

## 权限说明

| 权限 | 用途 |
|------|------|
| `contextMenus` | 创建右键菜单"收藏这句话" |
| `activeTab` | 获取当前页面信息（标题、URL）用于保存收藏记录 |
| `storage` | 将收藏记录保存在浏览器本地存储中 |
| `*://*.zhihu.com/*`（host权限） | 仅在知乎域名下注入内容脚本，尝试识别作者信息 |

**隐私承诺：** 本扩展不会收集、传输或分享任何用户数据。收藏数据存储在浏览器本地 storage 中，完全由用户控制。

## 目录结构

```
知乎句子收藏夹/
├── manifest.json        # 扩展配置（Manifest V3）
├── background.js        # 后台脚本：右键菜单、存储管理
├── content.js           # 内容脚本：注入知乎页面，尝试提取作者名
├── popup/
│   ├── popup.html       # 收藏管理页面
│   ├── popup.css        # 样式
│   └── popup.js         # 交互逻辑
├── icons/
│   └── icon-*.png       # 各尺寸图标
└── README.md            # 本文件
```

## 安装与测试（Safari）

> 由于当前环境没有安装 Xcode 和 Safari Web Extension Converter，以下提供手动打包步骤。

### 方式一：在 Mac 上用 Safari 开发者模式直接加载（推荐测试用）

1. **确认 Safari 开发者模式已开启**
   - 打开 Safari → 偏好设置 → 高级
   - 勾选「在菜单栏中显示开发菜单」
   - 菜单栏 → 开发 → 允许未签名扩展（如果可用）

2. **生成 Safari 扩展包**
   - 在项目目录下执行：
   ```bash
   cd /Users/easonwu/Desktop/firstplugin
   # 确认 Safari Web Extension Converter 可用后，可执行：
   # safari-web-extension-converter --project-name "知乎句子收藏夹" .
   ```
   - 若无 Converter，需要手动创建 `.safariextension` 包：
     ```bash
     mkdir -p "知乎句子收藏夹.safariextension"
     cp manifest.json background.js content.js "知乎句子收藏夹.safariextension/"
     cp -r popup "知乎句子收藏夹.safariextension/"
     cp -r icons "知乎句子收藏夹.safariextension/"
     ```

3. **加载扩展**
   - Safari → 菜单栏 → 开发 → 扩展设置（或 Safari → 偏好设置 → 扩展）
   - 将 `知乎句子收藏夹.safariextension` 文件夹拖入扩展列表
   - 启用扩展并授予必要权限

### 方式二：使用 Xcode + Safari Web Extension Converter（完整打包）

1. 在 Mac 上安装 Xcode（App Store 免费下载）

2. 在终端运行：
   ```bash
   safari-web-extension-converter --project-name "ZhiHuFavorites" \
     --app-id "com.example.zhihufavorites" \
     --output-dir ~/Projects/ZhiHuFavorites \
     /Users/easonwu/Desktop/firstplugin
   ```

3. Xcode 会生成一个完整的 Safari App Extension 项目

4. 在 Xcode 中打开项目，配置签名（个人团队即可），点击运行即可安装到 Safari

### 方式三：打包为 `.safariextz` 安装包（Xcode 项目中）

在 Xcode 项目中 Product → Archive → 导出为 `.safariextz`，可分发给其他人安装。

## 使用方法

1. **收藏句子**
   - 打开知乎文章或回答
   - 用鼠标选中任意一段话
   - 右键 →「收藏这句话」
   - 浏览器右上角会弹出收藏成功通知

2. **查看和管理收藏**
   - 点击 Safari 工具栏的扩展图标（📚）
   - 可以：搜索、点击卡片编辑标签/备注、删除、导出 Markdown

3. **编辑和删除**
   - 点击任意收藏卡片打开编辑弹窗
   - 修改标签（逗号分隔）和备注后保存
   - 点击红色「删除」按钮可删除该条收藏

4. **导出 Markdown**
   - 点击右上角「📥 导出」按钮
   - 会下载一个 `.md` 文件，包含所有收藏内容

## 已知限制

- **作者识别**：知乎页面结构可能变化，内容脚本会尝试提取作者名，但无法保证 100% 准确。识别不到时作者字段留空，不影响收藏功能。
- **非知乎页面**：右键菜单在非知乎页面不会显示「收藏这句话」，但扩展图标始终可以点击打开查看已有收藏。
- **数据备份**：收藏数据存储在浏览器本地，建议定期使用「导出 Markdown」功能备份重要内容。

## 技术栈

- Manifest V3（现代扩展规范）
- 原生 JavaScript（ES6+），无外部依赖
- CSS（原生特性，无预处理器）
- Safari Web Extension API

## 版本历史

- **v1.0.0** — 初始版本：右键收藏、标签备注管理、搜索、Markdown 导出
