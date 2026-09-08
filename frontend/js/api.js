const DEFAULT_BASE_URL = "http://127.0.0.1:8000";

function getBaseUrl() {
  if (window.__API_BASE__) return window.__API_BASE__.replace(/\/$/, "");

  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    return window.location.origin;
  }
  return DEFAULT_BASE_URL;
}

export const API = {
  BASE_URL: getBaseUrl(),

  async getCurrentUser() {
    try {
      const res = await fetch(`${this.BASE_URL}/auth/me`, {
        credentials: "same-origin",
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async logout() {
    try {
      await fetch(`${this.BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "same-origin",
      });
    } catch (err) {
      console.warn("Logout request failed:", err);
    }
  },

  async getAuthConfig() {
    const res = await fetch(`${this.BASE_URL}/auth/config`, {
      credentials: "same-origin",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async googleLogin(credential) {
    const res = await fetch(`${this.BASE_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
      credentials: "same-origin",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const detail = data?.detail || `HTTP ${res.status}`;
      throw new Error(detail);
    }

    return res.json();
  },

  async continueUser(user) {
    const res = await fetch(`${this.BASE_URL}/auth/continue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
      credentials: "same-origin",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
  },

  async createConversation({ userId, provider, model }) {
    const res = await fetch(`${this.BASE_URL}/conversation/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, provider, model }),
      credentials: "same-origin",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
  },

  async getUserConversations(userId) {
    const res = await fetch(`${this.BASE_URL}/conversation/user/${userId}`, {
      credentials: "same-origin",
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  },

  async renameConversation(conversationId, title) {
    return this.updateConversation(conversationId, { title });
  },

  async updateConversation(conversationId, { title, model, provider } = {}) {
    const payload = {};
    if (title !== undefined) payload.title = title;
    if (model !== undefined) payload.model = model;
    if (provider !== undefined) payload.provider = provider;

    const res = await fetch(`${this.BASE_URL}/conversation/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "same-origin",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
  },

  async deleteConversation(conversationId) {
    const res = await fetch(`${this.BASE_URL}/conversation/${conversationId}`, {
      method: "DELETE",
      credentials: "same-origin",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
  },

  async chat({ conversationId, prompt, model, provider, onDelta, signal }) {
    const url = `${this.BASE_URL}/chat/`;
    const payload = { conversation_id: conversationId, prompt };
    if (model) payload.model = model;
    if (provider) payload.provider = provider;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "same-origin",
      signal,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const detail = data?.detail || data?.message || `HTTP ${res.status}`;
      throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    }

    const value = data?.response ?? data?.content ?? data?.message ?? data?.reply;
    const text = typeof value === "string"
      ? value
      : value == null
        ? ""
        : JSON.stringify(value, null, 2);

    if (!text) throw new Error("The backend returned an empty response.");
    onDelta?.(text);
    return {
      text,
      provider: data?.provider || provider,
      model: data?.model || model,
    };
  },
};
