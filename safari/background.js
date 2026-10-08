// 随手收藏 - 后台脚本
// 负责右键菜单、存储管理和消息传递

const STORE_KEY = 'favorites';
const OLD_STORE_KEY = 'zhiHuFavorites';

async function getAll() {
  const result = await browser.storage.local.get(STORE_KEY);
  let items = result[STORE_KEY] || [];

  // 迁移旧数据（如果新 key 为空但旧 key 有数据）
  if (items.length === 0) {
    const oldResult = await browser.storage.local.get(OLD_STORE_KEY);
    const oldItems = oldResult[OLD_STORE_KEY] || [];
    if (oldItems.length > 0) {
      items = oldItems;
      await saveAll(items);
    }
  }

  return items;
}

async function saveAll(items) {
  await browser.storage.local.set({ [STORE_KEY]: items });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: 'favorite-quote',
    title: '收藏这句话',
    contexts: ['selection']
  });
  console.log('[随手收藏] 扩展已安装，右键菜单已创建');
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'favorite-quote') return;
  if (!info.selectionText || !info.selectionText.trim()) return;

  const quote = info.selectionText.trim();
  const pageUrl = tab.url || '';
  const pageTitle = tab.title || '';

  const item = {
    id: generateId(),
    quote,
    pageUrl,
    pageTitle,
    tags: [],
    note: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const items = await getAll();
    const duplicate = items.find(i => i.pageUrl === pageUrl && i.quote === quote);
    if (duplicate) {
      browser.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: '重复收藏',
        message: '这句话已经收藏过了，无需重复收藏。'
      });
      return;
    }

    items.unshift(item);
    await saveAll(items);

    browser.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: '收藏成功',
      message: `"${quote.slice(0, 30)}${quote.length > 30 ? '…' : ''}" 已保存。`
    });
  } catch (err) {
    console.error('[随手收藏] 保存失败:', err);
    browser.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: '保存失败',
      message: '无法保存收藏，请检查存储空间。'
    });
  }
});

browser.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'GET_ALL') {
    return getAll().then(items => ({ success: true, data: items }));
  }

  if (msg.type === 'SEARCH') {
    return getAll().then(items => {
      const kw = (msg.keyword || '').toLowerCase();
      const filtered = items.filter(item =>
        item.quote.toLowerCase().includes(kw) ||
        item.pageTitle.toLowerCase().includes(kw) ||
        item.tags.some(t => t.toLowerCase().includes(kw)) ||
        item.note.toLowerCase().includes(kw)
      );
      return { success: true, data: filtered };
    });
  }

  if (msg.type === 'UPDATE_ITEM') {
    return getAll().then(async items => {
      const idx = items.findIndex(i => i.id === msg.id);
      if (idx === -1) return { success: false, error: '未找到记录' };
      items[idx] = {
        ...items[idx],
        tags: msg.tags ?? items[idx].tags,
        note: msg.note ?? items[idx].note,
        updatedAt: new Date().toISOString()
      };
      await saveAll(items);
      return { success: true, data: items[idx] };
    });
  }

  if (msg.type === 'DELETE_ITEM') {
    return getAll().then(async items => {
      const filtered = items.filter(i => i.id !== msg.id);
      await saveAll(filtered);
      return { success: true };
    });
  }

  if (msg.type === 'EXPORT_MD') {
    return getAll().then(items => {
      const md = exportToMarkdown(items);
      return { success: true, data: md };
    });
  }

  return { success: false, error: '未知消息类型' };
});

function exportToMarkdown(items) {
  const lines = [];
  lines.push('# 随手收藏');
  lines.push('');
  if (!items.length) {
    lines.push('（空）');
    lines.push('');
    return lines.join('\n');
  }
  lines.push('> 共 ' + items.length + ' 条  |  导出时间：' + new Date().toLocaleString('zh-CN'));
  lines.push('');

  items.forEach((item, idx) => {
    lines.push('## ' + (idx + 1) + '. ' + (item.pageTitle || '无标题'));
    lines.push('');
    lines.push('**摘录：**');
    lines.push('> ' + item.quote);
    lines.push('');
    lines.push('**来源：** [' + item.pageUrl + '](' + item.pageUrl + ')');
    lines.push('**收藏时间：** ' + new Date(item.createdAt).toLocaleString('zh-CN'));
    if (item.tags && item.tags.length) {
      lines.push('**标签：** ' + item.tags.join('、'));
    }
    if (item.note) {
      lines.push('**备注：** ' + item.note);
    }
    lines.push('---');
    lines.push('');
  });

  return lines.join('\n');
}
