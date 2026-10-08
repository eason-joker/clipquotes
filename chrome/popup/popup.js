// ClipQuotes - Popup Main Script

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── State ──────────────────────────────────────────
let currentItems = [];
let currentKeyword = '';
let editingItem = null;
let pendingDelete = null;

// ── DOM References ─────────────────────────────────
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

// ── API Wrapper ─────────────────────────────────────
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
    if (!res.success) throw new Error(res.error || 'Load failed');

    currentItems = res.data || [];
    renderList();
  } catch (err) {
    showError('Failed to load: ' + err.message);
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
  const title = escapeHtml(item.pageTitle || 'Untitled');
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
      <button class="btn btn-copy" data-quote="${encodeURIComponent(item.quote)}">Copy</button>
      <button class="btn btn-edit" data-id="${item.id}">Edit</button>
      <button class="btn btn-delete-card" data-id="${item.id}">Delete</button>
    </div>
  `;

  // Edit button
  card.querySelector('.btn-edit').addEventListener('click', (e) => {
    e.stopPropagation();
    openEditModal(item);
  });

  // Copy button
  card.querySelector('.btn-copy').addEventListener('click', (e) => {
    e.stopPropagation();
    const text = decodeURIComponent(e.currentTarget.dataset.quote);
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard');
    }).catch(() => {
      showError('Copy failed');
    });
  });

  // Delete button
  card.querySelector('.btn-delete-card').addEventListener('click', (e) => {
    e.stopPropagation();
    console.log('[popup] delete button clicked, item id:', item.id);
    showConfirm(`Delete this quote?\n\n"${item.quote.slice(0, 50)}…"`, () => {
      console.log('[popup] confirm OK, calling deleteItemById');
      deleteItemById(item.id);
    });
  });

  // Click card (non-button) to open source
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

    // Update local data
    const idx = currentItems.findIndex(i => i.id === editingItem.id);
    if (idx !== -1) {
      currentItems[idx] = res.data;
    }

    closeEditModal();
    renderList();
  } catch (err) {
    showError('Save failed: ' + err.message);
  }
}

async function deleteItem() {
  if (!editingItem) return;
  showConfirm(`Delete this quote?\n\n"${editingItem.quote.slice(0, 50)}…"`, async () => {
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
    if (!res.success) throw new Error(res.error || 'Unknown error');
    currentItems = currentItems.filter(i => i.id !== id);
    renderList();
  } catch (err) {
    console.error('[popup] delete error:', err);
    showError('Delete failed: ' + err.message);
  }
}

async function exportMarkdown() {
  try {
    const res = await api('EXPORT_MD');
    if (!res.success) throw new Error(res.error);

    const filename = `ClipQuotes_${formatDateForFile(new Date())}.md`;
    const markdown = res.data;

    // Create Blob and trigger download
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 100);

    showToast('Downloaded ' + filename);
  } catch (err) {
    showError('Export failed: ' + err.message);
  }
}

// ── Helpers ────────────────────────────────────────
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
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

// ── Event Bindings ─────────────────────────────────
elSearch.addEventListener('input', () => {
  currentKeyword = elSearch.value.trim();
  loadItems();
});

elExportBtn.addEventListener('click', exportMarkdown);

elModalClose.addEventListener('click', closeEditModal);
elModalCancel.addEventListener('click', closeEditModal);
elModalSave.addEventListener('click', saveEdit);
elModalDelete.addEventListener('click', deleteItem);

// Click backdrop to close
elModal.addEventListener('click', (e) => {
  if (e.target === elModal) closeEditModal();
});

// Confirm modal events
elConfirmCancel.addEventListener('click', closeConfirm);
elConfirmOk.addEventListener('click', () => {
  const cb = pendingDelete;
  closeConfirm();
  if (cb) cb();
});
elConfirmModal.addEventListener('click', (e) => {
  if (e.target === elConfirmModal) closeConfirm();
});

// ESC to close modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !elModal.classList.contains('hidden')) {
    closeEditModal();
  }
});

// ── Init ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadItems);
