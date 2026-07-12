const DEFAULT_BASE_URL = "http://127.0.0.1:8000";

function getBaseUrl() {
  if (window.__API_BASE__) return window.__API_BASE__.replace(/\/$/, "");

  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    if (window.location.port === "8000") return window.location.origin;
  }
  return DEFAULT_BASE_URL;
}

export const API = {
  BASE_URL: getBaseUrl(),

  async continueUser(user) {
    const res = await fetch(`${this.BASE_URL}/auth/continue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
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
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
  },

  async renameConversation(conversationId, title) {
    const res = await fetch(`${this.BASE_URL}/conversation/${conversationId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
  },

  async deleteConversation(conversationId) {
    const res = await fetch(`${this.BASE_URL}/conversation/${conversationId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
  },

  async chat({ conversationId, prompt, onDelta, signal }) {
    const url = `${this.BASE_URL}/chat/`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: conversationId, prompt }),
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
    return text;
  },

  async _mockStream(prompt, onDelta) {
    const reply =
      `I received: "${prompt}"\n\nThis is a **demo** response because the backend isn't reachable. ` +
      `Once your FastAPI endpoint at \`/chat/\` is available, the real response will appear here.\n\n` +
      `- Markdown works\n- Code blocks work\n- Tables work\n\n\`\`\`js\nconsole.log("hello");\n\`\`\``;
    const tokens = reply.split(/(\s+)/);
    let full = "";
    for (const t of tokens) {
      await new Promise((r) => setTimeout(r, 18));
      full += t;
      onDelta && onDelta(t);
    }
    return full;
  },
};
