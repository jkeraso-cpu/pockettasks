import type { Task } from "./types";

const TASKS_KEY = "pockettasks.tasks.v1";
const THEME_KEY = "pockettasks.theme";

export type Theme = "light" | "dark";

function normalizeTask(value: Partial<Task>, index: number): Task | null {
  if (!value.id || !value.title || !value.createdAt) return null;

  return {
    id: value.id,
    title: value.title,
    description: value.description ?? "",
    priority: value.priority ?? "medium",
    status: value.status ?? "todo",
    dueDate: value.dueDate ?? null,
    createdAt: value.createdAt,
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    subtasks: Array.isArray(value.subtasks)
      ? value.subtasks
          .filter((subtask) => subtask && typeof subtask.title === "string")
          .map((subtask) => ({
            id: subtask.id || crypto.randomUUID(),
            title: subtask.title,
            completed: Boolean(subtask.completed),
          }))
      : [],
    recurrence: value.recurrence ?? "none",
    order: typeof value.order === "number" ? value.order : index,
  };
}

export const storage = {
  loadTasks(): Task[] {
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((task, index) => normalizeTask(task, index))
        .filter((task): task is Task => Boolean(task));
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
