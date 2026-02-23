'use strict';

// ── State ────────────────────────────────────────────────────────────────────
let isLoading = false;
const sessionForms = [];

// ── DOM refs ─────────────────────────────────────────────────────────────────
const promptInput   = document.getElementById('promptInput');
const sendBtn       = document.getElementById('sendBtn');
const messagesEl    = document.getElementById('messages');
const welcomeEl     = document.getElementById('welcome');
const chatArea      = document.getElementById('chatArea');
const historyList   = document.getElementById('historyList');
const sidebar       = document.getElementById('sidebar');
const overlay       = document.getElementById('overlay');
const modal         = document.getElementById('modal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalEdit     = document.getElementById('modalEdit');
const modalView     = document.getElementById('modalView');
const modalTitle    = document.getElementById('modalTitle');
const modalDesc     = document.getElementById('modalDesc');

// ── Textarea auto-resize ─────────────────────────────────────────────────────
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 180) + 'px';
}

// ── Keyboard shortcut ────────────────────────────────────────────────────────
function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// ── Sidebar toggle (mobile) ──────────────────────────────────────────────────
function toggleSidebar() {
  const open = sidebar.classList.toggle('open');
  overlay.classList.toggle('open', open);
}
function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
}

// ── New chat ─────────────────────────────────────────────────────────────────
function newChat() {
  messagesEl.innerHTML = '';
  welcomeEl.style.display = '';
  promptInput.value = '';
  autoResize(promptInput);
  promptInput.focus();
  closeSidebar();
}

// ── Use suggestion card ──────────────────────────────────────────────────────
function useSuggestion(card) {
  const title = card.querySelector('.suggestion-title').textContent;
  const desc  = card.querySelector('.suggestion-desc').textContent;
  promptInput.value = `Create a ${title.toLowerCase()} form: ${desc}`;
  autoResize(promptInput);
  promptInput.focus();
}

// ── Toast notification ───────────────────────────────────────────────────────
function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// ── Modal ────────────────────────────────────────────────────────────────────
function openModal(data) {
  modalTitle.textContent = data.title;
  modalDesc.textContent  = `"${data.title}" is live. Open it in Google Forms to review, customize, and share.`;
  modalEdit.href = data.editUrl;
  modalView.href = data.viewUrl;
  modal.classList.add('open');
  modalBackdrop.classList.add('open');
}
function closeModal() {
  modal.classList.remove('open');
  modalBackdrop.classList.remove('open');
}

// ── Append a message bubble ──────────────────────────────────────────────────
function appendMsg(role, contentEl) {
  welcomeEl.style.display = 'none';

  const row    = document.createElement('div');
  row.className = `msg ${role}`;

  const av = document.createElement('div');
  av.className = `avatar ${role}`;
  av.textContent = role === 'user' ? 'You' : '✦';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  if (typeof contentEl === 'string') {
    bubble.textContent = contentEl;
  } else {
    bubble.appendChild(contentEl);
  }

  row.appendChild(av);
  row.appendChild(bubble);
  messagesEl.appendChild(row);
  chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: 'smooth' });

  return bubble;
}

// ── Loading indicator ────────────────────────────────────────────────────────
function showLoading() {
  welcomeEl.style.display = 'none';
  const row = document.createElement('div');
  row.className = 'msg bot';
  row.id = 'loadingRow';

  const av = document.createElement('div');
  av.className = 'avatar bot';
  av.textContent = '✦';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;

  row.appendChild(av);
  row.appendChild(bubble);
  messagesEl.appendChild(row);
  chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: 'smooth' });
}
function removeLoading() {
  document.getElementById('loadingRow')?.remove();
}

// ── Build inline result card ─────────────────────────────────────────────────
function buildResultCard(data) {
  const wrap = document.createElement('div');

  const intro = document.createElement('p');
  intro.style.marginBottom = '12px';
  intro.style.fontSize = '14px';
  intro.textContent = `✦ I've created "${data.title}" — it's live on Google Forms.`;

  const card = document.createElement('div');
  card.className = 'result-card';

  const header = document.createElement('div');
  header.className = 'result-card-header';
  header.innerHTML = `
    <div class="result-status"></div>
    <div class="result-title-text">${data.title}</div>
    <div class="result-badge">LIVE</div>
  `;

  const body = document.createElement('div');
  body.className = 'result-card-body';

  const editBtn = document.createElement('a');
  editBtn.href = data.editUrl;
  editBtn.target = '_blank';
  editBtn.className = 'rc-btn primary';
  editBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit Form`;

  const viewBtn = document.createElement('a');
  viewBtn.href = data.viewUrl;
  viewBtn.target = '_blank';
  viewBtn.className = 'rc-btn secondary';
  viewBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>Preview`;

  const copyBtn = document.createElement('button');
  copyBtn.className = 'rc-btn copy';
  copyBtn.title = 'Copy edit link';
  copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`;
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(data.editUrl);
    showToast('Link copied to clipboard');
  };

  body.appendChild(editBtn);
  body.appendChild(viewBtn);
  body.appendChild(copyBtn);

  card.appendChild(header);
  card.appendChild(body);

  wrap.appendChild(intro);
  wrap.appendChild(card);

  return wrap;
}

// ── Update sidebar history ───────────────────────────────────────────────────
function addToHistory(data) {
  const empty = historyList.querySelector('.history-empty');
  if (empty) empty.remove();

  const item = document.createElement('a');
  item.className = 'history-item';
  item.href = data.editUrl;
  item.target = '_blank';
  item.title = data.title;
  item.innerHTML = `<div class="hi-dot"></div><span class="hi-label">${data.title}</span>`;
  historyList.prepend(item);
}

// ── Main: send message ───────────────────────────────────────────────────────
async function sendMessage() {
  if (isLoading) return;
  const prompt = promptInput.value.trim();
  if (!prompt) return;

  isLoading = true;
  sendBtn.disabled = true;
  promptInput.value = '';
  autoResize(promptInput);

  // Append user message
  appendMsg('user', prompt);

  // Show loading
  showLoading();

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();
    removeLoading();

    if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);

    // Inline card
    appendMsg('bot', buildResultCard(data));

    // Sidebar history
    sessionForms.unshift(data);
    addToHistory(data);

    // Open modal for emphasis
    openModal(data);

  } catch (err) {
    removeLoading();
    const errWrap = document.createElement('div');
    errWrap.innerHTML = `<div class="error-bubble"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Error: ${err.message}</div>`;
    appendMsg('bot', errWrap);
  } finally {
    isLoading = false;
    sendBtn.disabled = false;
    promptInput.focus();
  }
}

// ── Boot ─────────────────────────────────────────────────────────────────────
promptInput.focus();
