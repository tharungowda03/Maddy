export const MODELS = [
  { id: "gemini-2.5-flash", label: "Gemini (Flash)", provider: "gemini" },
  { id: "qwen/qwen3.8-27b", label: "Groq (Qwen 3.8)", provider: "groq" },
  { id: "openai/gpt-oss-120b", label: "Groq (GPT-OSS)", provider: "groq" },
  { id: "deepseek/deepseek-chat", label: "OpenRouter (DeepSeek)", provider: "openrouter" },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "OpenRouter (Llama 3.3)", provider: "openrouter" },
  { id: "gpt-4o", label: "OpenAI (GPT-4o)", provider: "openai" },
  { id: "llama-3.3-70b-versatile", label: "Groq (Legacy Llama)", provider: "groq" },
];

export function getModelConfig(id) {
  return MODELS.find((m) => m.id === id) || MODELS[0];
}

export function getProviderForModel(id) {
  return getModelConfig(id).provider;
}

const KEY = "chat.model";

export const ModelStore = {
  get() {
    return localStorage.getItem(KEY) || MODELS[0].id;
  },
  set(id) {
    localStorage.setItem(KEY, id);
  },
  label(id) {
    return getModelConfig(id).label || id;
  },
};

export function updateModelSelectorUI(modelId) {
  const current = modelId || ModelStore.get();
  const label = document.getElementById("modelLabel");
  const menu = document.getElementById("modelMenu");
  if (label) {
    label.textContent = ModelStore.label(current);
  }
  if (menu) {
    menu.querySelectorAll("li").forEach((li) => {
      li.classList.toggle("selected", li.dataset.model === current);
    });
  }
}

export function initModelSelector({ onChange } = {}) {
  const btn = document.getElementById("modelBtn");
  const menu = document.getElementById("modelMenu");

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
  });

  menu.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-model]");
    if (!li) return;
    const selectedModel = li.dataset.model;
    ModelStore.set(selectedModel);
    updateModelSelectorUI(selectedModel);
    menu.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    onChange && onChange(selectedModel);
  });

  document.addEventListener("click", () => {
    menu.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  });

  updateModelSelectorUI(ModelStore.get());
}
