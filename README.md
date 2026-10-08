# ClipQuotes

A browser extension that lets you select text on any page and save it with a right-click. Perfect for collecting inspiring quotes, passages, and insights from Zhihu, blogs, articles, and more.

Supports Chrome, Edge, and Safari browsers.

## Features

| Feature | Description |
|---------|-------------|
| **Right-click to save** | Select text → Right-click → "Save Quote" |
| **Source tracking** | Automatically saves: page title, URL, timestamp |
| **Tags** | Add multiple tags to organize your collection |
| **Notes** | Add your thoughts or comments |
| **Search** | Full-text search across quotes, titles, tags, and notes |
| **Edit/Delete** | Edit tags, notes, or delete items |
| **Copy text** | One-click copy to clipboard |
| **Markdown export** | Export all quotes as a Markdown file |
| **Local storage** | Data stays on your device — no cloud, no login |

## Supported Browsers

| Browser | Requirements | Installation |
|---------|--------------|--------------|
| Chrome / Edge | Manifest V3 support | Developer mode load |
| Safari | macOS Safari 16+ | Developer mode load |

## Installation

### Chrome / Edge

1. Download or clone this repo
2. Open `chrome://extensions/`
3. Enable **"Developer mode"** (top right)
4. Click **"Load unpacked"**
5. Select the `chrome/` folder

### Safari

1. Download or clone this repo
2. Open Safari → **Preferences** → **Extensions**
3. Enable **"Allow extensions to download files"** (if you need export)
4. Select "ClipQuotes" and enable the extension
5. For debugging: Safari menu → Develop → Show Extension Builder

## Project Structure

```
ClipQuotes/
├── README.md            # This file
├── LICENSE              # MIT License
├── chrome/              # Chrome/Edge version
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   └── icons/
└── safari/             # Safari version
    ├── manifest.json
    ├── background.js
    ├── content.js
    ├── popup/
    └── icons/
```

## Permissions

| Permission | Purpose |
|------------|---------|
| `contextMenus` | Create right-click menu "Save Quote" |
| `activeTab` | Get current page info (title, URL) |
| `storage` | Save quotes to browser local storage |

**Privacy:** This extension does not collect, transmit, or share any user data.

## Markdown Export Example

```markdown
# ClipQuotes

> 3 items  |  Exported: 1/15/2024, 2:30 PM

## 1. What is happiness

**Quote:**
> The most precious thing in life is time. Each person has only one life...

**Source:** [Zhihu - What is happiness](https://www.zhihu.com/question/12345)
**Saved:** 1/15/2024, 2:25 PM
**Tags:** life, wisdom
**Note:** Classic quote

---
```

## License

MIT License - see [LICENSE](LICENSE)
