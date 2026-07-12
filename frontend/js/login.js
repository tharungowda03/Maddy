import { API } from "./api.js";

const KEY = "chat.user";

export const User = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null");
    } catch {
      return null;
    }
  },
  set(user) {
    localStorage.setItem(KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(KEY);
  },
};

export function initLogin({ onLogin }) {
  const form = document.getElementById("loginForm");
  const nameInput = document.getElementById("loginName");
  const emailInput = document.getElementById("loginEmail");
  const errorEl = document.getElementById("loginError");
  const submitBtn = form.querySelector('button[type="submit"]');

  const existing = User.get();
  if (existing) {
    nameInput.value = existing.name || "";
    emailInput.value = existing.email || "";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    if (!name || !email || !/^\S+@\S+\.\S+$/.test(email)) {
      errorEl.textContent = "Enter a valid name and email address.";
      errorEl.hidden = false;
      emailInput.focus();
      return;
    }
    const user = { name, email };
    submitBtn.disabled = true;
    submitBtn.textContent = "Connecting...";
    try {
      const savedUser = await API.continueUser(user);
      if (!savedUser?.id) throw new Error("The backend did not return a user ID.");
      User.set(savedUser);
      onLogin?.(savedUser);
    } catch (err) {
      errorEl.textContent = `Cannot connect to the backend: ${err.message}`;
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Continue";
    }
  });
}

export function updateAccountUI(user) {
  const nameEl = document.getElementById("accountName");
  const emailEl = document.getElementById("accountEmail");
  const avatar = document.getElementById("accountAvatar");
  if (!user) {
    nameEl.textContent = "Guest";
    emailEl.textContent = "Sign in to continue";
    avatar.textContent = "U";
    return;
  }
  nameEl.textContent = user.name;
  emailEl.textContent = user.email;
  avatar.textContent = (user.name?.[0] || "U").toUpperCase();
}
