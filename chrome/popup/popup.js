// 知乎句子收藏夹 - Popup 主脚本

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── 状态 ──────────────────────────────────────────
let currentItems = [];
let currentKeyword = '';
let editingItem = null;
let pendingDelete = null; // 待确认删除的回调

// ── DOM 引用 ──────────────────────────────────────
const elList = $('#list');
const elEmpty = $('#empty-state');
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
const elConfirmModal = $('#confirm-modal');
const elConfirmMessage = $('#confirm-message');
const elConfirmCancel = $('#confirm-cancel');
const elConfirmOk = $('#confirm-ok');

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
      ${author ? `<span>${author}</span>` : ''}
      <a href="${escapeHtml(item.pageUrl)}" target="_blank" title="${escapeHtml(item.pageUrl)}">${title}</a>
    </div>
    ${tags ? `<div class="card-tags">${tags}</div>` : ''}
    ${note ? `<div class="card-note">${note}</div>` : ''}
    <div class="card-time">${time}</div>
    <div class="card-actions">
      <button class="btn btn-copy" data-quote="${encodeURIComponent(item.quote)}">复制句子</button>
      <button class="btn btn-edit" data-id="${item.id}">编辑</button>
      <button class="btn btn-delete-card" data-id="${item.id}">删除</button>
    </div>
  `;

  // 点击编辑按钮
  card.querySelector('.btn-edit').addEventListener('click', (e) => {
    e.stopPropagation();
    openEditModal(item);
  });

  // 点击复制按钮
  card.querySelector('.btn-copy').addEventListener('click', (e) => {
    e.stopPropagation();
    const text = decodeURIComponent(e.currentTarget.dataset.quote);
    navigator.clipboard.writeText(text).then(() => {
      showToast('已复制到剪贴板');
    }).catch(() => {
      showError('复制失败');
    });
  });

  // 点击删除按钮
  card.querySelector('.btn-delete-card').addEventListener('click', (e) => {
    e.stopPropagation();
    console.log('[popup] delete button clicked, item id:', item.id);
    showConfirm(`确定删除这条收藏？\n\n"${item.quote.slice(0, 50)}…"`, () => {
      console.log('[popup] confirm OK, calling deleteItemById');
      deleteItemById(item.id);
    });
  });

  // 点击卡片（非按钮区域）跳转到知乎原文
  card.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
    if (item.pageUrl) {
      browser.tabs.create({ url: item.pageUrl, active: false });
    }
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
  showConfirm(`确定删除这条收藏？\n\n"${editingItem.quote.slice(0, 50)}…"`, async () => {
    await deleteItemById(editingItem.id);
    closeEditModal();
  });
}

function showConfirm(message, onOk) {
  pendingDelete = onOk;
  elConfirmMessage.textContent = message;
  elConfirmModal.classList.remove('hidden');
}

function closeConfirm() {
  pendingDelete = null;
  elConfirmModal.classList.add('hidden');
}

async function deleteItemById(id) {
  console.log('[popup] deleteItemById called, id:', id);
  try {
    const res = await api('DELETE_ITEM', { id });
    console.log('[popup] delete response:', res);
    if (!res.success) throw new Error(res.error || '未知错误');
    currentItems = currentItems.filter(i => i.id !== id);
    renderList();
  } catch (err) {
    console.error('[popup] delete error:', err);
    showError('删除失败：' + err.message);
  }
}

async function exportMarkdown() {
  try {
    const res = await api('EXPORT_MD');
    if (!res.success) throw new Error(res.error);

    const filename = `随手收藏_${formatDateForFile(new Date())}.md`;
    const markdown = res.data;

    // 创建 Blob 并触发下载
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // 清理
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 100);

    showToast('已下载 ' + filename);
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

function showToast(msg) {
  const toast = $('#toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2000);
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

// 确认弹窗事件
elConfirmCancel.addEventListener('click', closeConfirm);
elConfirmOk.addEventListener('click', () => {
  const cb = pendingDelete;
  closeConfirm();
  if (cb) cb();
});
elConfirmModal.addEventListener('click', (e) => {
  if (e.target === elConfirmModal) closeConfirm();
});

// ESC 关闭弹窗
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !elModal.classList.contains('hidden')) {
    closeEditModal();
  }
});

// ── 初始化 ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadItems);
