// ClipQuotes - Background Script
// Handles context menu, storage, and message passing

const STORE_KEY = 'favorites';
const OLD_STORE_KEY = 'zhiHuFavorites';

async function getAll() {
  const result = await browser.storage.local.get(STORE_KEY);
  let items = result[STORE_KEY] || [];

  // Migrate old data if new key is empty but old key has data
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
    title: 'Save Quote',
    contexts: ['selection']
  });
  console.log('[ClipQuotes] Extension installed, context menu created');
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
        title: 'Duplicate',
        message: 'This quote has already been saved.'
      });
      return;
    }

    items.unshift(item);
    await saveAll(items);

    browser.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'Saved',
      message: `"${quote.slice(0, 30)}${quote.length > 30 ? '…' : ''}" has been saved.`
    });
  } catch (err) {
    console.error('[ClipQuotes] Save failed:', err);
    browser.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'Save Failed',
      message: 'Unable to save. Please check storage.'
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
      if (idx === -1) return { success: false, error: 'Item not found' };
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

  return { success: false, error: 'Unknown message type' };
});

function exportToMarkdown(items) {
  const lines = [];
  lines.push('# ClipQuotes');
  lines.push('');
  if (!items.length) {
    lines.push('(Empty)');
    lines.push('');
    return lines.join('\n');
  }
  lines.push('> ' + items.length + ' items  |  Exported: ' + new Date().toLocaleString('en-US'));
  lines.push('');

  items.forEach((item, idx) => {
    lines.push('## ' + (idx + 1) + '. ' + (item.pageTitle || 'Untitled'));
    lines.push('');
    lines.push('**Quote:**');
    lines.push('> ' + item.quote);
    lines.push('');
    lines.push('**Source:** [' + item.pageUrl + '](' + item.pageUrl + ')');
    lines.push('**Saved:** ' + new Date(item.createdAt).toLocaleString('en-US'));
    if (item.tags && item.tags.length) {
      lines.push('**Tags:** ' + item.tags.join(', '));
    }
    if (item.note) {
      lines.push('**Note:** ' + item.note);
    }
    lines.push('---');
    lines.push('');
  });

  return lines.join('\n');
}
