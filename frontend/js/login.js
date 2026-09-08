import { API } from "./api.js";

let _currentUser = null;

export const User = {
  get() {
    return _currentUser;
  },
  set(user) {
    _currentUser = user || null;
    localStorage.removeItem("chat.user");
  },
  clear() {
    _currentUser = null;
    localStorage.removeItem("chat.user");
  },
};

export function initLogin({ onLogin }) {
  const form = document.getElementById("loginForm");
  const nameInput = document.getElementById("loginName");
  const emailInput = document.getElementById("loginEmail");
  const errorEl = document.getElementById("loginError");
  const submitBtn = form.querySelector('button[type="submit"]');
  const googleWrap = document.getElementById("googleAuthWrap");
  const googleBtn = document.getElementById("googleSignInBtn");

  const existing = User.get();
  if (existing) {
    nameInput.value = existing.name || "";
    emailInput.value = existing.email || "";
  }

  async function setupGoogleAuth() {
    try {
      const config = await API.getAuthConfig();
      if (!config?.google_client_id) {
        if (googleWrap) googleWrap.hidden = true;
        return;
      }

      const waitForGoogle = () =>
        new Promise((resolve) => {
          if (window.google?.accounts?.id) return resolve(window.google);
          const interval = setInterval(() => {
            if (window.google?.accounts?.id) {
              clearInterval(interval);
              resolve(window.google);
            }
          }, 100);
          setTimeout(() => {
            clearInterval(interval);
            resolve(window.google || null);
          }, 4000);
        });

      const google = await waitForGoogle();
      if (!google?.accounts?.id) {
        console.warn("Google Identity Services script did not load.");
        return;
      }

      google.accounts.id.initialize({
        client_id: config.google_client_id,
        callback: async (response) => {
          if (!response.credential) return;
          errorEl.hidden = true;
          submitBtn.disabled = true;
          submitBtn.textContent = "Connecting with Google...";
          try {
            const savedUser = await API.googleLogin(response.credential);
            if (!savedUser?.id) throw new Error("The backend did not return a user ID.");
            User.set(savedUser);
            onLogin?.(savedUser);
          } catch (err) {
            errorEl.textContent = `Google Sign-In failed: ${err.message}`;
            errorEl.hidden = false;
          } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Continue";
          }
        },
      });

      if (googleBtn) {
        google.accounts.id.renderButton(googleBtn, {
          type: "standard",
          shape: "rectangular",
          theme: "outline",
          text: "continue_with",
          size: "large",
          logo_alignment: "left",
          width: 320,
        });
      }
    } catch (err) {
      console.warn("Could not setup Google Sign-In:", err);
    }
  }

  setupGoogleAuth();

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
