import type { Task } from "./types";

const TASKS_KEY = "pockettasks.tasks.v1";
const THEME_KEY = "pockettasks.theme";

export type Theme = "light" | "dark";

export const storage = {
  loadTasks(): Task[] {
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  saveTasks(tasks: Task[]) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  },
  loadTheme(): Theme {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  },
  saveTheme(theme: Theme) {
    localStorage.setItem(THEME_KEY, theme);
  },
};
