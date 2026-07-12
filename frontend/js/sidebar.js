import { ChatStore } from "./chat.js";

export function initSidebar({ onOpenChat, onNewChat, onRenameChat, onDeleteChat }) {
  const list = document.getElementById("chatHistory");
  const search = document.getElementById("searchInput");
  const newBtn = document.getElementById("newChatBtn");
  const mobileBtn = document.getElementById("mobileMenuBtn");
  const backdrop = document.getElementById("sidebarBackdrop");
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("sidebarToggleBtn");
  const app = document.getElementById("app");

  const openMobile = () => { sidebar.classList.add("open"); backdrop.classList.add("open"); };
  const closeMobile = () => { sidebar.classList.remove("open"); backdrop.classList.remove("open"); };

  mobileBtn.addEventListener("click", openMobile);
  backdrop.addEventListener("click", closeMobile);
  toggle.addEventListener("click", () => {
    if (window.innerWidth <= 768) closeMobile();
    else app.classList.toggle("sidebar-collapsed");
  });

  newBtn.addEventListener("click", async () => {
    await onNewChat?.();
    closeMobile();
    render();
  });

  search.addEventListener("input", () => render(search.value.trim().toLowerCase()));

  function render(query = "") {
    const chats = ChatStore.list();
    const active = ChatStore.getActiveId();
    const filtered = query
      ? chats.filter((c) => c.title.toLowerCase().includes(query))
      : chats;

    if (!filtered.length) {
      list.innerHTML = `<div class="history-empty">No chats yet</div>`;
      return;
    }

    list.innerHTML = filtered
      .map(
        (c) => `
      <div class="history-item ${c.id === active ? "active" : ""}" data-id="${c.id}">
        <span class="title">${escapeHtml(c.title)}</span>
        <span class="actions">
          <button data-act="rename" title="Rename" aria-label="Rename">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button data-act="delete" title="Delete" aria-label="Delete">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          </button>
        </span>
      </div>`
      )
      .join("");
  }

  list.addEventListener("click", async (e) => {
    const item = e.target.closest(".history-item");
    if (!item) return;
    const id = item.dataset.id;
    const actBtn = e.target.closest("button[data-act]");
    if (actBtn) {
      const act = actBtn.dataset.act;
      if (act === "delete") {
        if (confirm("Delete this chat?")) {
          await onDeleteChat?.(id);
          ChatStore.remove(id);
          if (ChatStore.getActiveId() === id) await onNewChat?.();
          render();
        }
      } else if (act === "rename") {
        openRename(id);
      }
      return;
    }
    onOpenChat && onOpenChat(id);
    closeMobile();
    render();
  });

  function openRename(id) {
    const chat = ChatStore.get(id);
    if (!chat) return;
    const modal = document.getElementById("renameModal");
    const input = document.getElementById("renameInput");
    input.value = chat.title;
    modal.hidden = false;
    input.focus();
    input.select();

    const close = () => { modal.hidden = true; };
    document.getElementById("renameCloseBtn").onclick = close;
    document.getElementById("renameCancelBtn").onclick = close;
    document.getElementById("renameSaveBtn").onclick = async () => {
      const t = input.value.trim();
      if (t) {
        await onRenameChat?.(id, t);
        ChatStore.rename(id, t);
        render();
      }
      close();
    };
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  return { render };
}
