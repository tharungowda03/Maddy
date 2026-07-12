import { Theme } from "./theme.js";
import { User, initLogin, updateAccountUI } from "./login.js";
import { initSidebar } from "./sidebar.js";
import { ChatStore, initChat } from "./chat.js";
import { initModelSelector, ModelStore, getProviderForModel } from "./models.js";
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
  showChatScreen();
  sidebarUI.render();
}

function newChat() {
  const model = ModelStore.get();
  const chat = ChatStore.create({
    model,
    provider: getProviderForModel(model),
    userId: currentUser?.id || null,
  });
  ChatStore.setActive(chat.id);
  topbarTitle.textContent = "New chat";
  chatUI.renderMessages({ messages: [] });
  showChatScreen();
  sidebarUI.render();
}

async function handleSend(text) {
  let activeId = ChatStore.getActiveId();
  if (!activeId) {
    const c = ChatStore.create({
      model: ModelStore.get(),
      provider: getProviderForModel(ModelStore.get()),
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
  try {
    chat = await ensureBackendConversation(chat);
    const response = await API.chat({
      conversationId: chat.backendConversationId,
      prompt: text,
      signal: currentAbort.signal,
      onDelta: (piece) => {
        full += piece;
        stream.setContent(full);
      },
    });
    if (!full && response) {
      full = String(response);
      stream.setContent(full);
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      full = full || `**Error:** ${err.message || "Unable to get a response."}`;
    }
  } finally {
    stream.finalize(full);
    ChatStore.updateLastMessage(activeId, full);
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
initModelSelector();
const settingsCtl = initSettings({
  onCleared: () => {
    newChat();
    sidebarUI.render();
  },
});
initAccountMenu({
  onOpenSettings: () => settingsCtl.open(),
  onLogout: () => {
    currentAbort?.abort();
    currentAbort = null;
    currentUser = null;
    User.clear();
    updateAccountUI(null);
    showLoginScreen();
  },
});

initLogin({
  onLogin: async (user) => {
    syncUser(user);
    document.querySelector(".login-card")?.classList.add("login-hide");
    setTimeout(() => {
      const active = ChatStore.getActiveId();
      if (active && ChatStore.get(active)) openChat(active);
      else newChat();
    }, 180);
  },
});

async function bootstrap() {
  let user = User.get();
  if (user) {
    try {
      if (!user.id) {
        user = await API.continueUser(user);
        User.set(user);
      }
    } catch {
    }
  }

  syncUser(user);
  sidebarUI.render();

  if (user) {
    const active = ChatStore.getActiveId();
    if (active && ChatStore.get(active)) openChat(active);
    else {
      showChatScreen();
    }
  } else {
    showLoginScreen();
  }
}

bootstrap();
