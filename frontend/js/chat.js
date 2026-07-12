import { API } from "./api.js";
import { ModelStore } from "./models.js";

const KEY = "chat.chats";
const ACTIVE_KEY = "chat.active";

export const ChatStore = {
  list() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch { return []; }
  },
  save(chats) { localStorage.setItem(KEY, JSON.stringify(chats)); },
  get(id) { return this.list().find((c) => c.id === id); },
  getActiveId() { return localStorage.getItem(ACTIVE_KEY); },
  setActive(id) { id ? localStorage.setItem(ACTIVE_KEY, id) : localStorage.removeItem(ACTIVE_KEY); },
  create(initial = {}) {
    const chat = {
      id: crypto.randomUUID(),
      title: initial.title || "New chat",
      messages: [],
      createdAt: Date.now(),
      backendConversationId: initial.backendConversationId || null,
      model: initial.model || null,
      provider: initial.provider || null,
      userId: initial.userId || null,
    };
    const chats = [chat, ...this.list()];
    this.save(chats);
    this.setActive(chat.id);
    return chat;
  },
  update(id, patch) {
    const chats = this.list().map((c) => (c.id === id ? { ...c, ...patch } : c));
    this.save(chats);
  },
  addMessage(id, msg) {
    const chats = this.list();
    const chat = chats.find((c) => c.id === id);
    if (!chat) return;
    chat.messages.push(msg);
    if (chat.messages.length === 1 && msg.role === "user") {
      chat.title = msg.content.slice(0, 48) || "New chat";
    }
    this.save(chats);
  },
  updateLastMessage(id, content) {
    const chats = this.list();
    const chat = chats.find((c) => c.id === id);
    if (!chat || !chat.messages.length) return;
    chat.messages[chat.messages.length - 1].content = content;
    this.save(chats);
  },
  rename(id, title) { this.update(id, { title }); },
  remove(id) {
    const chats = this.list().filter((c) => c.id !== id);
    this.save(chats);
    if (this.getActiveId() === id) this.setActive(null);
  },
  clearAll() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(ACTIVE_KEY);
  },
};

export function initChat({ onSend, onNewMessage }) {
  const composer = document.getElementById("composer");
  const input = document.getElementById("composerInput");
  const sendBtn = document.getElementById("sendBtn");
  const messagesEl = document.getElementById("chatMessages");
  const scrollEl = document.getElementById("chatScroll");
  const chatScreen = document.getElementById("chatScreen");

  const setEmptyState = (isEmpty) => {
    chatScreen.classList.toggle("is-empty", isEmpty);
  };

  const autoresize = () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 200) + "px";
  };
  input.addEventListener("input", autoresize);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      composer.requestSubmit();
    }
  });

  composer.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    autoresize();
    await onSend(text);
  });

  function renderMessages(chat) {
    messagesEl.innerHTML = "";
    const messages = chat?.messages || [];
    setEmptyState(messages.length === 0);
    if (!chat) return;
    for (const m of messages) {
      messagesEl.appendChild(renderMessage(m));
    }
    scrollToBottom();
  }

  function renderMessage(msg) {
    const wrap = document.createElement("div");
    wrap.className = `message ${msg.role}`;
    wrap.dataset.role = msg.role;

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    if (msg.role === "assistant") {
      bubble.innerHTML = renderMarkdown(msg.content || "");
    } else {
      bubble.textContent = msg.content;
    }
    wrap.appendChild(bubble);

    if (msg.role === "assistant" && msg.content) {
      wrap.appendChild(renderActions(bubble, msg));
    }
    return wrap;
  }

  function renderActions(bubble, msg) {
    const actions = document.createElement("div");
    actions.className = "msg-actions";
    actions.innerHTML = `
      <button class="msg-action-btn" data-act="copy">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
        Copy
      </button>
      <button class="msg-action-btn" data-act="regen">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>
        Regenerate
      </button>
    `;
    actions.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-act]");
      if (!btn) return;
      if (btn.dataset.act === "copy") {
        navigator.clipboard.writeText(msg.content);
        btn.innerHTML = "✓ Copied";
        setTimeout(() => renderActionsBack(actions, bubble, msg), 1200);
      } else if (btn.dataset.act === "regen") {
        window.dispatchEvent(new CustomEvent("chat:regenerate"));
      }
    });
    return actions;
  }
  function renderActionsBack(el, bubble, msg) {
    el.replaceWith(renderActions(bubble, msg));
  }

  function appendUser(text) {
    setEmptyState(false);
    const el = renderMessage({ role: "user", content: text });
    messagesEl.appendChild(el);
    scrollToBottom();
  }

  function appendAssistantStreaming() {
    const wrap = document.createElement("div");
    wrap.className = "message assistant";
    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);
    scrollToBottom();
    return {
      bubble,
      wrap,
      setContent(text) {
        bubble.innerHTML = renderMarkdown(text);
        scrollToBottom();
      },
      finalize(text) {
        bubble.innerHTML = renderMarkdown(text);
        wrap.appendChild(renderActions(bubble, { role: "assistant", content: text }));
        scrollToBottom();
      },
    };
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    });
  }

  function focusInput() { input.focus(); }

  return { renderMessages, appendUser, appendAssistantStreaming, focusInput, input, sendBtn };
}

export function renderMarkdown(src) {
  if (!src) return "";
  let s = typeof src === "string" ? src : JSON.stringify(src, null, 2);

  const esc = (t) => t.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  const codeBlocks = [];
  s = s.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    codeBlocks.push({ lang: lang || "", code });
    return `\u0000CODE${codeBlocks.length - 1}\u0000`;
  });

  s = esc(s);

  s = s.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  s = s.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  s = s.replace(/^# (.*)$/gm, "<h1>$1</h1>");

  s = s.replace(/((?:^\|.*\|\s*\n)+)/gm, (block) => {
    const rows = block.trim().split(/\n/).map((r) => r.trim());
    if (rows.length < 2 || !/^\|\s*-/.test(rows[1])) return block;
    const parseRow = (r) => r.slice(1, -1).split("|").map((c) => c.trim());
    const head = parseRow(rows[0]);
    const body = rows.slice(2).map(parseRow);
    return (
      "<table><thead><tr>" +
      head.map((h) => `<th>${h}</th>`).join("") +
      "</tr></thead><tbody>" +
      body.map((r) => "<tr>" + r.map((c) => `<td>${c}</td>`).join("") + "</tr>").join("") +
      "</tbody></table>"
    );
  });

  s = s.replace(/^&gt; (.*)$/gm, "<blockquote>$1</blockquote>");

  s = s.replace(/(?:^|\n)((?:[-*] .+\n?)+)/g, (m, block) => {
    const items = block.trim().split(/\n/).map((l) => l.replace(/^[-*] /, ""));
    return "\n<ul>" + items.map((i) => `<li>${i}</li>`).join("") + "</ul>";
  });
  s = s.replace(/(?:^|\n)((?:\d+\. .+\n?)+)/g, (m, block) => {
    const items = block.trim().split(/\n/).map((l) => l.replace(/^\d+\. /, ""));
    return "\n<ol>" + items.map((i) => `<li>${i}</li>`).join("") + "</ol>";
  });

  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|\W)\*([^*]+)\*/g, "$1<em>$2</em>");
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  s = s
    .split(/\n{2,}/)
    .map((chunk) => {
      if (/^\s*<(h\d|ul|ol|pre|blockquote|table|p)/.test(chunk)) return chunk;
      return `<p>${chunk.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");

  s = s.replace(/\u0000CODE(\d+)\u0000/g, (_, i) => {
    const { code } = codeBlocks[+i];
    return `<pre><code>${esc(code)}</code></pre>`;
  });

  return s;
}
