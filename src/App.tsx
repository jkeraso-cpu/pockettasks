import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  CircleDot,
  ListTodo,
  Moon,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { storage, type Theme } from "./storage";
import type { Priority, Status, Task, TaskDraft } from "./types";

const emptyDraft: TaskDraft = {
  title: "",
  description: "",
  priority: "medium",
  status: "todo",
  dueDate: null,
};

const statusLabel: Record<Status, string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  completed: "Completed",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(value + (value.length === 10 ? "T12:00:00" : "")),
  );
}

function isOverdue(task: Task) {
  if (!task.dueDate || task.status === "completed") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.dueDate + "T00:00:00").getTime() < today.getTime();
}

export function App() {
  const [tasks, setTasks] = useState<Task[]>(() => storage.loadTasks());
  const [theme, setTheme] = useState<Theme>(() => storage.loadTheme());
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft);
  const [titleError, setTitleError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    storage.saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    storage.saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const counts = useMemo(
    () => ({
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      progress: tasks.filter((t) => t.status === "in-progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    }),
    [tasks],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const statusOk = statusFilter === "all" || task.status === statusFilter;
      const priorityOk = priorityFilter === "all" || task.priority === priorityFilter;
      const queryOk = !q || task.title.toLowerCase().includes(q) || task.description.toLowerCase().includes(q);
      return statusOk && priorityOk && queryOk;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setTitleError("");
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setDraft({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
    });
    setTitleError("");
    setModalOpen(true);
  };

  const submitTask = (event: React.FormEvent) => {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) {
      setTitleError("Give your task a title first.");
      return;
    }

    if (editing) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editing.id ? { ...task, ...draft, title, description: draft.description.trim() } : task,
        ),
      );
      setToast("Task updated");
    } else {
      setTasks((current) => [
        {
          ...draft,
          title,
          description: draft.description.trim(),
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
      setToast("Task added to your pocket");
    }

    setModalOpen(false);
    setEditing(null);
  };

  const toggleComplete = (task: Task) => {
    const nextStatus: Status = task.status === "completed" ? "todo" : "completed";
    setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item)));
    setToast(nextStatus === "completed" ? "Task completed 🎉" : "Task reopened");
  };

  const deleteTask = (task: Task) => {
    if (!window.confirm(`Delete “${task.title}”? This can’t be undone.`)) return;
    setTasks((current) => current.filter((item) => item.id !== task.id));
    setToast("Task deleted");
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setSearch("");
  };

  return (
    <main className="page">
      <div className="shell">
        <header className="header">
          <div className="brand">
            <div className="logo"><CheckCircle2 size={22} /></div>
            <div>
              <p className="eyebrow">PocketTasks</p>
              <h1>Keep today under control.</h1>
              <p className="subtitle">A calm place for the things that need your attention.</p>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="icon-button"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="button primary" onClick={openCreate}><Plus size={18} /> Add Task</button>
          </div>
        </header>

        <section className="summary-grid" aria-label="Task summary">
          <SummaryCard icon={<ListTodo size={18} />} value={counts.total} label="Total Tasks" />
          <SummaryCard icon={<CircleDot size={18} />} value={counts.todo} label="To Do" />
          <SummaryCard icon={<Sparkles size={18} />} value={counts.progress} label="In Progress" />
          <SummaryCard icon={<CheckCircle2 size={18} />} value={counts.completed} label="Completed" />
        </section>

        <section className="task-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Your tasks</p>
              <h2>{filtered.length} {filtered.length === 1 ? "task" : "tasks"} in view</h2>
            </div>
          </div>

          <div className="toolbar">
            <div className="search-wrap">
              <Search size={17} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                aria-label="Search tasks"
              />
            </div>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | Status)} aria-label="Filter by status">
              <option value="all">All Tasks</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as "all" | Priority)} aria-label="Filter by priority">
              <option value="all">All Priorities</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          {filtered.length > 0 ? (
            <div className="task-grid">
              {filtered.map((task) => (
                <article key={task.id} className={`task-card ${task.status === "completed" ? "completed" : ""}`}>
                  <div className="task-top">
                    <button className={`check-button ${task.status === "completed" ? "checked" : ""}`} onClick={() => toggleComplete(task)} aria-label={task.status === "completed" ? `Reopen ${task.title}` : `Mark ${task.title} complete`}>
                      {task.status === "completed" ? <Check size={17} /> : <Circle size={17} />}
                    </button>

                    <div className="task-content">
                      <div className="task-title-row">
                        <h3>{task.title}</h3>
                        <div className="badges">
                          <span className={`badge priority-${task.priority}`}>{task.priority}</span>
                          <span className={`badge status-${task.status}`}>{statusLabel[task.status]}</span>
                        </div>
                      </div>

                      {task.description && <p className="task-description">{task.description}</p>}

                      <div className="meta">
                        {task.dueDate ? (
                          <span className={isOverdue(task) ? "overdue" : ""}>
                            {isOverdue(task) ? "Overdue · " : "Due "}{formatDate(task.dueDate)}
                          </span>
                        ) : <span>No due date</span>}
                        <span>Created {formatDate(task.createdAt.slice(0, 10))}</span>
                      </div>
                    </div>
                  </div>

                  <div className="task-actions">
                    <button className="button ghost small" onClick={() => openEdit(task)}><Pencil size={15} /> Edit</button>
                    <button className="button ghost small" onClick={() => deleteTask(task)}><Trash2 size={15} /> Delete</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><ListTodo size={28} /></div>
              <h3>{tasks.length === 0 ? "Nothing here yet." : "No tasks match that view."}</h3>
              <p>{tasks.length === 0 ? "Add your first task and get moving." : "Try clearing a filter or changing your search."}</p>
              {tasks.length === 0 ? (
                <button className="button primary" onClick={openCreate}><Plus size={17} /> Add your first task</button>
              ) : (
                <button className="button outline" onClick={clearFilters}>Clear filters</button>
              )}
            </div>
          )}
        </section>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => {
          if (e.currentTarget === e.target) setModalOpen(false);
        }}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
            <button className="modal-close" aria-label="Close" onClick={() => setModalOpen(false)}><X size={18} /></button>
            <div className="modal-head">
              <h2 id="task-modal-title">{editing ? "Edit task" : "Add a task"}</h2>
              <p>{editing ? "Update the details and keep moving." : "Capture it now so your brain doesn’t have to hold it."}</p>
            </div>

            <form onSubmit={submitTask} className="task-form">
              <label>
                <span>Task title</span>
                <input
                  autoFocus
                  value={draft.title}
                  onChange={(e) => {
                    setDraft({ ...draft, title: e.target.value });
                    if (titleError) setTitleError("");
                  }}
                  placeholder="What needs doing?"
                  aria-invalid={Boolean(titleError)}
                />
                {titleError && <small className="error">{titleError}</small>}
              </label>

              <label>
                <span>Description <em>Optional</em></span>
                <textarea rows={4} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Add a little context..." />
              </label>

              <div className="form-grid">
                <label>
                  <span>Priority</span>
                  <select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as Priority })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>

                <label>
                  <span>Status</span>
                  <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Status })}>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
              </div>

              <label>
                <span>Due date <em>Optional</em></span>
                <input type="date" value={draft.dueDate ?? ""} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value || null })} />
              </label>

              <div className="form-actions">
                <button type="button" className="button ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="button primary">{editing ? "Save changes" : "Create task"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

function SummaryCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="summary-card">
      <span className="summary-icon">{icon}</span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
