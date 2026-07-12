import { API } from "./api.js";
import { Theme } from "./theme.js";
import { User, updateAccountUI } from "./login.js";
import { ChatStore } from "./chat.js";

export function initSettings({ onCleared } = {}) {
  const modal = document.getElementById("settingsModal");
  const openBtn = document.getElementById("settingsBtn");
  const closeBtn = document.getElementById("settingsCloseBtn");
  const themeBtns = modal.querySelectorAll(".theme-option");
  const nameInput = document.getElementById("settingsName");
  const emailInput = document.getElementById("settingsEmail");
  const saveBtn = document.getElementById("saveProfileBtn");
  const clearBtn = document.getElementById("clearHistoryBtn");

  const open = () => {
    modal.hidden = false;
    hydrate();
  };
  const close = () => { modal.hidden = true; };

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

  function hydrate() {
    const current = Theme.get();
    themeBtns.forEach((b) => b.classList.toggle("selected", b.dataset.theme === current));
    const user = User.get();
    nameInput.value = user?.name || "";
    emailInput.value = user?.email || "";
  }

  themeBtns.forEach((b) => {
    b.addEventListener("click", () => {
      Theme.set(b.dataset.theme);
      hydrate();
    });
  });

  saveBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    if (!name || !email) return;
    let savedUser = { name, email };
    try {
      savedUser = await API.continueUser(savedUser);
    } catch {
      savedUser = { name, email };
    }
    User.set(savedUser);
    updateAccountUI(savedUser);
    saveBtn.textContent = "Saved ✓";
    setTimeout(() => (saveBtn.textContent = "Save profile"), 1200);
  });

  clearBtn.addEventListener("click", () => {
    if (!confirm("Clear all chat history? This cannot be undone.")) return;
    ChatStore.clearAll();
    onCleared && onCleared();
    close();
  });

  return { open, close };
}

export function initAccountMenu({ onLogout, onOpenSettings }) {
  const btn = document.getElementById("accountBtn");
  const menu = document.getElementById("accountDropdown");

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("open");
  });
  document.addEventListener("click", () => menu.classList.remove("open"));

  menu.addEventListener("click", (e) => {
    const item = e.target.closest("[data-action]");
    if (!item) return;
    const act = item.dataset.action;
    menu.classList.remove("open");
    if (act === "logout") onLogout && onLogout();
    else if (act === "settings" || act === "profile") onOpenSettings && onOpenSettings();
  });
}
