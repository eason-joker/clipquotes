// 知乎句子收藏夹 - Popup 主脚本

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── 状态 ──────────────────────────────────────────
let currentItems = [];
let currentKeyword = '';
let editingItem = null;

// ── DOM 引用 ──────────────────────────────────────
const elList = $('#list');
const elEmpty = $('#empty-state');
const elNonZhihu = $('#non-zhihu-tip');
const elLoading = $('#loading');
const elError = $('#error');
const elSearch = $('#search-input');
const elExportBtn = $('#btn-export');
const elModal = $('#edit-modal');
const elModalQuote = $('#modal-quote');
const elModalTags = $('#modal-tags');
const elModalNote = $('#modal-note');
const elModalClose = $('#modal-close');
const elModalCancel = $('#modal-cancel');
const elModalSave = $('#modal-save');
const elModalDelete = $('#modal-delete');

// ── API 封装 ──────────────────────────────────────
function api(type, data = {}) {
  return browser.runtime.sendMessage({ type, ...data });
}

async function loadItems() {
  elLoading.classList.remove('hidden');
  elError.classList.add('hidden');
  elEmpty.classList.add('hidden');

  try {
    const res = await api(currentKeyword ? 'SEARCH' : 'GET_ALL',
      currentKeyword ? { keyword: currentKeyword } : {});
    if (!res.success) throw new Error(res.error || '加载失败');

    currentItems = res.data || [];
    renderList();
  } catch (err) {
    showError('加载收藏失败：' + err.message);
  } finally {
    elLoading.classList.add('hidden');
  }
}

function renderList() {
  elList.innerHTML = '';

  if (!currentItems.length) {
    elEmpty.classList.remove('hidden');
    return;
  }

  elEmpty.classList.add('hidden');

  currentItems.forEach(item => {
    const card = createCard(item);
    elList.appendChild(card);
  });
}

function createCard(item) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.id = item.id;

  const quote = escapeHtml(item.quote);
  const title = escapeHtml(item.pageTitle || '无标题');
  const author = escapeHtml(item.author || '');
  const tags = (item.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  const note = escapeHtml(item.note || '');
  const time = formatTime(item.createdAt);

  card.innerHTML = `
    <div class="card-quote">${quote}</div>
    <div class="card-meta">
      ${author ? `<span>👤 ${author}</span>` : ''}
      <a href="${escapeHtml(item.pageUrl)}" target="_blank" title="${escapeHtml(item.pageUrl)}">${title}</a>
    </div>
    ${tags ? `<div class="card-tags">${tags}</div>` : ''}
    ${note ? `<div class="card-note">📝 ${note}</div>` : ''}
    <div class="card-time">🕐 ${time}</div>
  `;

  card.addEventListener('click', (e) => {
    // 如果点击的是链接，不打开编辑
    if (e.target.tagName === 'A') return;
    openEditModal(item);
  });

  return card;
}

function openEditModal(item) {
  editingItem = item;
  elModalQuote.textContent = item.quote;
  elModalTags.value = (item.tags || []).join(', ');
  elModalNote.value = item.note || '';
  elModal.classList.remove('hidden');
}

function closeEditModal() {
  editingItem = null;
  elModal.classList.add('hidden');
}

async function saveEdit() {
  if (!editingItem) return;

  const tagsStr = elModalTags.value || '';
  const tags = tagsStr.split(/[,，]/).map(t => t.trim()).filter(Boolean);
  const note = elModalNote.value.trim();

  try {
    const res = await api('UPDATE_ITEM', {
      id: editingItem.id,
      tags,
      note
    });
    if (!res.success) throw new Error(res.error);

    // 更新本地数据
    const idx = currentItems.findIndex(i => i.id === editingItem.id);
    if (idx !== -1) {
      currentItems[idx] = res.data;
    }

    closeEditModal();
    renderList();
  } catch (err) {
    showError('保存失败：' + err.message);
  }
}

async function deleteItem() {
  if (!editingItem) return;
  if (!confirm(`确定删除这条收藏？\n\n"${editingItem.quote.slice(0, 50)}…"`)) return;

  try {
    const res = await api('DELETE_ITEM', { id: editingItem.id });
    if (!res.success) throw new Error(res.error);

    currentItems = currentItems.filter(i => i.id !== editingItem.id);
    closeEditModal();
    renderList();
  } catch (err) {
    showError('删除失败：' + err.message);
  }
}

async function exportMarkdown() {
  try {
    const res = await api('EXPORT_MD');
    if (!res.success) throw new Error(res.error);

    const blob = new Blob([res.data], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `知乎收藏_${formatDateForFile(new Date())}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    showError('导出失败：' + err.message);
  }
}

// ── 辅助函数 ──────────────────────────────────────
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

function formatDateForFile(d) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function showError(msg) {
  elError.textContent = msg;
  elError.classList.remove('hidden');
  setTimeout(() => elError.classList.add('hidden'), 4000);
}

// ── 事件绑定 ──────────────────────────────────────
elSearch.addEventListener('input', () => {
  currentKeyword = elSearch.value.trim();
  loadItems();
});

elExportBtn.addEventListener('click', exportMarkdown);

elModalClose.addEventListener('click', closeEditModal);
elModalCancel.addEventListener('click', closeEditModal);
elModalSave.addEventListener('click', saveEdit);
elModalDelete.addEventListener('click', deleteItem);

// 点击弹窗背景关闭
elModal.addEventListener('click', (e) => {
  if (e.target === elModal) closeEditModal();
});

// ESC 关闭弹窗
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !elModal.classList.contains('hidden')) {
    closeEditModal();
  }
});

// ── 初始化 ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadItems);
