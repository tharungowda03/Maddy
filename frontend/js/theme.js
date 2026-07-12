const KEY = "chat.theme";

export const Theme = {
  get() {
    return localStorage.getItem(KEY) || "system";
  },
  set(theme) {
    localStorage.setItem(KEY, theme);
    this.apply();
  },
  apply() {
    const theme = this.get();
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    document.documentElement.setAttribute("data-theme", resolved);
  },
  init() {
    this.apply();
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        if (this.get() === "system") this.apply();
      });
  },
};
