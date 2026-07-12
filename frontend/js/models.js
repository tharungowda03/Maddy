export const MODELS = [
  { id: "gemini-2.5-flash", label: "Gemini", provider: "gemini" },
  { id: "llama-3.3-70b-versatile", label: "Groq", provider: "groq" },
  { id: "gpt-4o", label: "OpenAI", provider: "openai" },
  { id: "deepseek/deepseek-chat", label: "OpenRouter", provider: "openrouter" },
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

export function initModelSelector({ onChange } = {}) {
  const btn = document.getElementById("modelBtn");
  const menu = document.getElementById("modelMenu");
  const label = document.getElementById("modelLabel");

  const render = () => {
    const current = ModelStore.get();
    label.textContent = ModelStore.label(current);
    menu.querySelectorAll("li").forEach((li) => {
      li.classList.toggle("selected", li.dataset.model === current);
    });
  };

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
  });

  menu.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-model]");
    if (!li) return;
    ModelStore.set(li.dataset.model);
    render();
    menu.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    onChange && onChange(li.dataset.model);
  });

  document.addEventListener("click", () => {
    menu.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  });

  render();
}
