import { Theme } from "./theme.js";
import { User, initLogin, updateAccountUI } from "./login.js";
import { initSidebar } from "./sidebar.js";
import { ChatStore, initChat } from "./chat.js";
import { initModelSelector, ModelStore, getProviderForModel, updateModelSelectorUI } from "./models.js";
import { initSettings, initAccountMenu } from "./settings.js";
import { API } from "./api.js";

Theme.init();

const loginScreen = document.getElementById("loginScreen");
const chatScreen = document.getElementById("chatScreen");
const topbarTitle = document.getElementById("topbarTitle");

let chatUI;
let sidebarUI;
let currentAbort = null;
let currentUser = null;

function syncUser(user) {
  currentUser = user || null;
  updateAccountUI(currentUser);
  return currentUser;
}

async function loadUserConversations(user) {
  const conversations = await API.getUserConversations(user.id);
  const chats = conversations.map((conversation) => ({
    id: `server-${conversation.id}`,
    backendConversationId: conversation.id,
    userId: conversation.user_id,
    title: conversation.title || "New Chat",
    provider: conversation.provider,
    model: conversation.model,
    messages: conversation.messages || [],
    createdAt: new Date(conversation.created_at).getTime() || Date.now(),
  }));
  const activeId = ChatStore.getActiveId();
  ChatStore.replace(chats);
  const keepActive = chats.find((c) => c.id === activeId);
  ChatStore.setActive(keepActive ? activeId : (chats[0]?.id || null));
  sidebarUI.render();
  return chats;
}

async function ensureBackendConversation(chat) {
  if (!chat || chat.backendConversationId || !currentUser?.id) {
    return chat;
  }

  const model = chat.model || ModelStore.get();
  const provider = chat.provider || getProviderForModel(model);
  const created = await API.createConversation({
    userId: currentUser.id,
    provider,
    model,
  });

  ChatStore.update(chat.id, {
    backendConversationId: created.id,
    provider: created.provider || provider,
    model: created.model || model,
  });

  return ChatStore.get(chat.id);
}

function showChatScreen() {
  document.body.classList.remove("logged-out");
  loginScreen.hidden = true;
  chatScreen.hidden = false;
  chatScreen.classList.add("slide-up");
  chatUI.focusInput();
}

function showLoginScreen() {
  document.body.classList.add("logged-out");
  settingsCtl?.close();
  document.getElementById("renameModal").hidden = true;
  document.getElementById("accountDropdown").classList.remove("open");
  document.querySelector(".login-card")?.classList.remove("login-hide");
  chatScreen.hidden = true;
  loginScreen.hidden = false;
}

function openChat(id) {
  ChatStore.setActive(id);
  const chat = ChatStore.get(id);
  topbarTitle.textContent = chat?.title || "New chat";
  chatUI.renderMessages(chat);

  const model = chat?.model || ModelStore.get();
  ModelStore.set(model);
  updateModelSelectorUI(model);

  showChatScreen();
  sidebarUI.render();
}

function newChat() {
  const model = ModelStore.get();
  const provider = getProviderForModel(model);
  const chat = ChatStore.create({
    model,
    provider,
    userId: currentUser?.id || null,
  });
  ChatStore.setActive(chat.id);
  topbarTitle.textContent = "New chat";
  updateModelSelectorUI(model);
  chatUI.renderMessages({ messages: [] });
  showChatScreen();
  sidebarUI.render();
}

async function handleSend(text) {
  let activeId = ChatStore.getActiveId();
  if (!activeId) {
    const defaultModel = ModelStore.get();
    const c = ChatStore.create({
      model: defaultModel,
      provider: getProviderForModel(defaultModel),
      userId: currentUser?.id || null,
    });
    activeId = c.id;
  }
  let chat = ChatStore.get(activeId);
  if (!chat) return;

  ChatStore.addMessage(activeId, { role: "user", content: text });
  chatUI.appendUser(text);
  sidebarUI.render();
  topbarTitle.textContent = ChatStore.get(activeId)?.title || "New chat";

  const stream = chatUI.appendAssistantStreaming();
  let full = "";
  ChatStore.addMessage(activeId, { role: "assistant", content: "" });

  currentAbort = new AbortController();
  let finalProvider = null;
  let finalModel = null;
  try {
    const currentModel = chat.model || ModelStore.get();
    const currentProvider = chat.provider || getProviderForModel(currentModel);
    finalProvider = currentProvider;
    finalModel = currentModel;
    chat = await ensureBackendConversation(chat);
    const response = await API.chat({
      conversationId: chat.backendConversationId,
      prompt: text,
      model: currentModel,
      provider: currentProvider,
      signal: currentAbort.signal,
      onDelta: (piece) => {
        full += piece;
        stream.setContent(full);
      },
    });
    if (response) {
      if (typeof response === "object") {
        if (response.provider) finalProvider = response.provider;
        if (response.model) finalModel = response.model;
        if (!full && response.text) {
          full = String(response.text);
          stream.setContent(full);
        }
      } else if (!full) {
        full = String(response);
        stream.setContent(full);
      }
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      full = full || `**Error:** ${err.message || "Unable to get a response."}`;
    }
  } finally {
    stream.finalize(full, finalProvider, finalModel);
    ChatStore.updateLastMessage(activeId, full, { provider: finalProvider, model: finalModel });
    currentAbort = null;
  }
}

async function handleRegenerate() {
  const id = ChatStore.getActiveId();
  if (!id) return;
  const chat = ChatStore.get(id);
  if (!chat || chat.messages.length < 2) return;
  chat.messages.pop();
  ChatStore.update(id, { messages: chat.messages });
  const lastUser = chat.messages[chat.messages.length - 1];
  if (!lastUser || lastUser.role !== "user") return;
  chat.messages.pop();
  ChatStore.update(id, { messages: chat.messages });
  chatUI.renderMessages(ChatStore.get(id));
  await handleSend(lastUser.content);
}

window.addEventListener("chat:regenerate", handleRegenerate);

chatUI = initChat({ onSend: handleSend });
sidebarUI = initSidebar({
  onOpenChat: openChat,
  onNewChat: newChat,
  onRenameChat: async (id, title) => {
    const chat = ChatStore.get(id);
    if (chat?.backendConversationId) {
      try {
        await API.renameConversation(chat.backendConversationId, title);
      } catch {
      }
    }
  },
  onDeleteChat: async (id) => {
    const chat = ChatStore.get(id);
    if (chat?.backendConversationId) {
      try {
        await API.deleteConversation(chat.backendConversationId);
      } catch {
      }
    }
  },
});
initModelSelector({
  onChange: async (modelId) => {
    const provider = getProviderForModel(modelId);
    const activeId = ChatStore.getActiveId();
    if (activeId) {
      ChatStore.update(activeId, { model: modelId, provider });
      const chat = ChatStore.get(activeId);
      if (chat?.backendConversationId) {
        try {
          await API.updateConversation(chat.backendConversationId, {
            model: modelId,
            provider,
          });
        } catch (err) {
          console.warn("Could not sync conversation model change with backend:", err);
        }
      }
    }
  },
});
const settingsCtl = initSettings({
  onCleared: () => {
    newChat();
    sidebarUI.render();
  },
});
initAccountMenu({
  onOpenSettings: () => settingsCtl.open(),
  onLogout: async () => {
    currentAbort?.abort();
    currentAbort = null;
    currentUser = null;
    try {
      await API.logout();
    } catch (e) {
      console.warn("Logout API error:", e);
    }
    User.clear();
    ChatStore.clearAll();
    updateAccountUI(null);
    showLoginScreen();
  },
});

initLogin({
  onLogin: async (user) => {
    syncUser(user);
    try {
      await loadUserConversations(user);
    } catch (err) {
      ChatStore.clearAll();
      console.error("Unable to load conversation history", err);
    }
    document.querySelector(".login-card")?.classList.add("login-hide");
    setTimeout(() => {
      const active = ChatStore.getActiveId();
      if (active && ChatStore.get(active)) openChat(active);
      else newChat();
    }, 180);
  },
});

async function bootstrap() {
  try {
    const user = await API.getCurrentUser();
    if (user?.id) {
      User.set(user);
      syncUser(user);
      try {
        await loadUserConversations(user);
      } catch (err) {
        console.error("Unable to load conversation history on refresh:", err);
      }
      const active = ChatStore.getActiveId();
      if (active && ChatStore.get(active)) {
        openChat(active);
      } else {
        newChat();
      }
      showChatScreen();
      return;
    }
  } catch (err) {
    console.warn("Session check error:", err);
  }

  User.clear();
  syncUser(null);
  sidebarUI.render();
  showLoginScreen();
}

bootstrap();
