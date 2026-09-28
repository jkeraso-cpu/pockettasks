import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  CircleDot,
  GripVertical,
  ListTodo,
  Moon,
  Pencil,
  Plus,
  Repeat2,
  Search,
  Sparkles,
  Sun,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { storage, type Theme } from "./storage";
import type { Priority, Recurrence, Status, Task, TaskDraft } from "./types";

type FocusView = "all" | "today" | "upcoming";
type SortMode = "manual" | "due" | "priority" | "newest" | "oldest";

const emptyDraft: TaskDraft = {
  title: "",
  description: "",
  priority: "medium",
  status: "todo",
  dueDate: null,
  tags: [],
  subtasks: [],
  recurrence: "none",
};

const statusLabel: Record<Status, string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  completed: "Completed",
};

const recurrenceLabel: Record<Recurrence, string> = {
  none: "",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const focusLabel: Record<FocusView, string> = {
  all: "all tasks",
  today: "today",
  upcoming: "upcoming",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value + (value.length === 10 ? "T12:00:00" : "")));
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isOverdue(task: Task) {
  if (!task.dueDate || task.status === "completed") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.dueDate + "T00:00:00").getTime() < today.getTime();
}

function getNextRecurringDate(task: Task) {
  const base = task.dueDate ? new Date(task.dueDate + "T12:00:00") : new Date();

  if (task.recurrence === "daily") base.setDate(base.getDate() + 1);
  if (task.recurrence === "weekly") base.setDate(base.getDate() + 7);
  if (task.recurrence === "monthly") base.setMonth(base.getMonth() + 1);

  return localDateKey(base);
}

export function App() {
  const [tasks, setTasks] = useState<Task[]>(() => storage.loadTasks());
  const [theme, setTheme] = useState<Theme>(() => storage.loadTheme());
  const [focusView, setFocusView] = useState<FocusView>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft);
  const [titleError, setTitleError] = useState("");
  const [tagText, setTagText] = useState("");
  const [subtaskText, setSubtaskText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    storage.saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    storage.saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const counts = useMemo(
    () => ({
      total: tasks.length,
      todo: tasks.filter((task) => task.status === "todo").length,
      progress: tasks.filter((task) => task.status === "in-progress").length,
      completed: tasks.filter((task) => task.status === "completed").length,
    }),
    [tasks],
  );

  const availableTags = useMemo(
    () => Array.from(new Set(tasks.flatMap((task) => task.tags))).sort((a, b) => a.localeCompare(b)),
    [tasks],
  );

  const filtered = useMemo(() => {
    const today = localDateKey(new Date());
    const query = search.trim().toLowerCase();
    const priorityWeight: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

    const visible = tasks.filter((task) => {
      const focusOk =
        focusView === "all" ||
        (focusView === "today" && Boolean(task.dueDate && task.dueDate <= today)) ||
        (focusView === "upcoming" && Boolean(task.dueDate && task.dueDate > today));

      const statusOk = statusFilter === "all" || task.status === statusFilter;
      const priorityOk = priorityFilter === "all" || task.priority === priorityFilter;
      const tagOk = tagFilter === "all" || task.tags.includes(tagFilter);

      const searchOk =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        task.subtasks.some((subtask) => subtask.title.toLowerCase().includes(query));

      return focusOk && statusOk && priorityOk && tagOk && searchOk;
    });

    return [...visible].sort((a, b) => {
      if (sortMode === "manual") return a.order - b.order;

      if (sortMode === "due") {
        if (!a.dueDate && !b.dueDate) return a.order - b.order;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate) || a.order - b.order;
      }

      if (sortMode === "priority") {
        return priorityWeight[a.priority] - priorityWeight[b.priority] || a.order - b.order;
      }

      if (sortMode === "newest") return b.createdAt.localeCompare(a.createdAt);
      return a.createdAt.localeCompare(b.createdAt);
    });
  }, [tasks, focusView, statusFilter, priorityFilter, tagFilter, search, sortMode]);

  const resetDraft = () => {
    setDraft(emptyDraft);
    setTagText("");
    setSubtaskText("");
    setTitleError("");
  };

  const openCreate = () => {
    setEditing(null);
    resetDraft();
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
      tags: task.tags,
      subtasks: task.subtasks,
      recurrence: task.recurrence,
    });
    setTagText(task.tags.join(", "));
    setSubtaskText("");
    setTitleError("");
    setModalOpen(true);
  };

  const addSubtask = () => {
    const title = subtaskText.trim();
    if (!title) return;

    setDraft({
      ...draft,
      subtasks: [
        ...draft.subtasks,
        { id: crypto.randomUUID(), title, completed: false },
      ],
    });
    setSubtaskText("");
  };

  const submitTask = (event: React.FormEvent) => {
    event.preventDefault();
    const title = draft.title.trim();

    if (!title) {
      setTitleError("Give your task a title first.");
      return;
    }

    const tags = Array.from(
      new Set(
        tagText
          .split(",")
          .map((tag) => tag.trim().replace(/^#/, ""))
          .filter(Boolean)
          .slice(0, 6),
      ),
    );

    const prepared = {
      ...draft,
      tags,
      title,
      description: draft.description.trim(),
    };

    if (editing) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editing.id ? { ...task, ...prepared } : task,
        ),
      );
      setToast("Task updated");
    } else {
      setTasks((current) => {
        const firstOrder = current.length
          ? Math.min(...current.map((task) => task.order)) - 1
          : 0;

        return [
          {
            ...prepared,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            order: firstOrder,
          },
          ...current,
        ];
      });
      setToast("Task added to your pocket");
    }

    setModalOpen(false);
    setEditing(null);
  };

  const toggleComplete = (task: Task) => {
    const nextStatus: Status = task.status === "completed" ? "todo" : "completed";

    setTasks((current) => {
      let next = current.map((item) =>
        item.id === task.id ? { ...item, status: nextStatus } : item,
      );

      if (nextStatus === "completed" && task.recurrence !== "none") {
        const nextDueDate = getNextRecurringDate(task);
        const alreadyExists = current.some(
          (item) =>
            item.id !== task.id &&
            item.title === task.title &&
            item.dueDate === nextDueDate &&
            item.recurrence === task.recurrence &&
            item.status !== "completed",
        );

        if (!alreadyExists) {
          const firstOrder = current.length
            ? Math.min(...current.map((item) => item.order)) - 1
            : 0;

          next = [
            {
              ...task,
              id: crypto.randomUUID(),
              status: "todo",
              dueDate: nextDueDate,
              createdAt: new Date().toISOString(),
              subtasks: task.subtasks.map((subtask) => ({
                ...subtask,
                id: crypto.randomUUID(),
                completed: false,
              })),
              order: firstOrder,
            },
            ...next,
          ];
        }
      }

      return next;
    });

    setToast(
      nextStatus === "completed"
        ? task.recurrence === "none"
          ? "Task completed 🎉"
          : "Task completed · next one scheduled"
        : "Task reopened",
    );
  };

  const toggleSubtask = (taskId: string, subtaskId: string, completed: boolean) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((subtask) =>
                subtask.id === subtaskId ? { ...subtask, completed } : subtask,
              ),
            }
          : task,
      ),
    );
  };

  const deleteTask = (task: Task) => {
    if (!window.confirm(`Delete “${task.title}”? This can’t be undone.`)) return;
    setTasks((current) => current.filter((item) => item.id !== task.id));
    setToast("Task deleted");
  };

  const reorderTasks = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;

    setTasks((current) => {
      const ordered = [...current].sort((a, b) => a.order - b.order);
      const sourceIndex = ordered.findIndex((task) => task.id === sourceId);
      const targetIndex = ordered.findIndex((task) => task.id === targetId);

      if (sourceIndex < 0 || targetIndex < 0) return current;

      const [moved] = ordered.splice(sourceIndex, 1);
      ordered.splice(targetIndex, 0, moved);

      return ordered.map((task, order) => ({ ...task, order }));
    });
  };

  const moveTask = (task: Task, direction: -1 | 1) => {
    setTasks((current) => {
      const ordered = [...current].sort((a, b) => a.order - b.order);
      const index = ordered.findIndex((item) => item.id === task.id);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return current;

      [ordered[index], ordered[nextIndex]] = [ordered[nextIndex], ordered[index]];
      return ordered.map((item, order) => ({ ...item, order }));
    });
  };

  const clearFilters = () => {
    setFocusView("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setTagFilter("all");
    setSearch("");
  };

  const hasFilters =
    focusView !== "all" ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    tagFilter !== "all" ||
    Boolean(search.trim());

  return (
    <main className="page">
      <div className="shell">
        <header className="header">
          <div className="brand">
            <div className="logo"><CheckCircle2 size={22} /></div>
            <div>
              <div className="brand-line">
                <p className="eyebrow">PocketTasks</p>
                <span className="version-badge">V2</span>
              </div>
              <h1>Keep today under control.</h1>
              <p className="subtitle">Plan the big thing, then tame it into smaller steps.</p>
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
            <button className="button primary" onClick={openCreate}>
              <Plus size={18} /> Add Task
            </button>
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
              <h2>{filtered.length} {filtered.length === 1 ? "task" : "tasks"} in {focusLabel[focusView]}</h2>
            </div>

            <div className="sort-wrap">
              <span>Sort</span>
              <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} aria-label="Sort tasks">
                <option value="manual">Manual order</option>
                <option value="due">Due date</option>
                <option value="priority">Priority</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>

          <div className="view-bar">
            <div className="view-tabs" role="tablist" aria-label="Task views">
              <button className={focusView === "all" ? "active" : ""} onClick={() => setFocusView("all")}>All</button>
              <button className={focusView === "today" ? "active" : ""} onClick={() => setFocusView("today")}>
                <CalendarDays size={15} /> Today
              </button>
              <button className={focusView === "upcoming" ? "active" : ""} onClick={() => setFocusView("upcoming")}>Upcoming</button>
            </div>
            {sortMode === "manual" && <span className="reorder-hint">Drag cards or use ↑ ↓ to reorder</span>}
          </div>

          <div className="toolbar">
            <div className="search-wrap">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks, tags or subtasks..."
                aria-label="Search tasks"
              />
            </div>

            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | Status)} aria-label="Filter by status">
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as "all" | Priority)} aria-label="Filter by priority">
              <option value="all">All Priorities</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>

            <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} aria-label="Filter by tag">
              <option value="all">All Tags</option>
              {availableTags.map((tag) => <option key={tag} value={tag}>#{tag}</option>)}
            </select>
          </div>

          {filtered.length > 0 ? (
            <div className="task-grid">
              {filtered.map((task) => {
                const completedSubtasks = task.subtasks.filter((subtask) => subtask.completed).length;
                const subtaskPercent = task.subtasks.length
                  ? Math.round((completedSubtasks / task.subtasks.length) * 100)
                  : 0;

                return (
                  <article
                    key={task.id}
                    className={`task-card ${task.status === "completed" ? "completed" : ""} ${sortMode === "manual" ? "reorderable" : ""}`}
                    draggable={sortMode === "manual"}
                    onDragStart={() => sortMode === "manual" && setDraggedId(task.id)}
                    onDragOver={(event) => sortMode === "manual" && event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (sortMode === "manual" && draggedId) reorderTasks(draggedId, task.id);
                      setDraggedId(null);
                    }}
                  >
                    <div className="task-top">
                      <div className="task-leading">
                        {sortMode === "manual" && <GripVertical size={17} className="grip" aria-hidden="true" />}
                        <button
                          className={`check-button ${task.status === "completed" ? "checked" : ""}`}
                          onClick={() => toggleComplete(task)}
                          aria-label={task.status === "completed" ? `Reopen ${task.title}` : `Mark ${task.title} complete`}
                        >
                          {task.status === "completed" ? <Check size={17} /> : <Circle size={17} />}
                        </button>
                      </div>

                      <div className="task-content">
                        <div className="task-title-row">
                          <h3>{task.title}</h3>
                          <div className="badges">
                            <span className={`badge priority-${task.priority}`}>{task.priority}</span>
                            <span className={`badge status-${task.status}`}>{statusLabel[task.status]}</span>
                          </div>
                        </div>

                        {task.description && <p className="task-description">{task.description}</p>}

                        {task.tags.length > 0 && (
                          <div className="tags">
                            <Tag size={14} />
                            {task.tags.map((tag) => <span key={tag}>#{tag}</span>)}
                          </div>
                        )}

                        {task.subtasks.length > 0 && (
                          <div className="subtasks">
                            <div className="subtask-summary">
                              <span>{completedSubtasks}/{task.subtasks.length} steps complete</span>
                              <span>{subtaskPercent}%</span>
                            </div>
                            <div className="progress-track">
                              <span style={{ width: `${subtaskPercent}%` }} />
                            </div>
                            <div className="subtask-list">
                              {task.subtasks.map((subtask) => (
                                <label className="subtask-row" key={subtask.id}>
                                  <input
                                    type="checkbox"
                                    checked={subtask.completed}
                                    onChange={(event) => toggleSubtask(task.id, subtask.id, event.target.checked)}
                                  />
                                  <span className={subtask.completed ? "subtask-done" : ""}>{subtask.title}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="meta">
                          {task.dueDate ? (
                            <span className={isOverdue(task) ? "overdue" : ""}>
                              {isOverdue(task) ? "Overdue · " : "Due "}{formatDate(task.dueDate)}
                            </span>
                          ) : <span>No due date</span>}

                          {task.recurrence !== "none" && (
                            <span><Repeat2 size={15} /> {recurrenceLabel[task.recurrence]}</span>
                          )}

                          <span>Created {formatDate(task.createdAt.slice(0, 10))}</span>
                        </div>
                      </div>
                    </div>

                    <div className="task-actions">
                      {sortMode === "manual" && (
                        <div className="move-actions">
                          <button className="button ghost icon-small" onClick={() => moveTask(task, -1)} aria-label={`Move ${task.title} up`}>
                            <ArrowUp size={15} />
                          </button>
                          <button className="button ghost icon-small" onClick={() => moveTask(task, 1)} aria-label={`Move ${task.title} down`}>
                            <ArrowDown size={15} />
                          </button>
                        </div>
                      )}

                      <div className="primary-actions">
                        <button className="button ghost small" onClick={() => openEdit(task)}>
                          <Pencil size={15} /> Edit
                        </button>
                        <button className="button ghost small" onClick={() => deleteTask(task)}>
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><ListTodo size={28} /></div>
              <h3>{tasks.length === 0 ? "Nothing here yet." : `Nothing in ${focusLabel[focusView]}.`}</h3>
              <p>
                {tasks.length === 0
                  ? "Add your first task and get moving."
                  : hasFilters
                    ? "Try another view or clear your filters."
                    : "You’re all clear here."}
              </p>

              {hasFilters ? (
                <button className="button outline" onClick={clearFilters}>Clear filters</button>
              ) : (
                <button className="button primary" onClick={openCreate}>
                  <Plus size={17} /> Add your first task
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      {modalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setModalOpen(false);
          }}
        >
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
            <button className="modal-close" aria-label="Close" onClick={() => setModalOpen(false)}>
              <X size={18} />
            </button>

            <div className="modal-head">
              <h2 id="task-modal-title">{editing ? "Edit task" : "Add a task"}</h2>
              <p>
                {editing
                  ? "Tune the details, tags, repeat schedule, or smaller steps."
                  : "Capture the task, then break it down only as much as you need."}
              </p>
            </div>

            <form onSubmit={submitTask} className="task-form">
              <label>
                <span>Task title</span>
                <input
                  autoFocus
                  value={draft.title}
                  onChange={(event) => {
                    setDraft({ ...draft, title: event.target.value });
                    if (titleError) setTitleError("");
                  }}
                  placeholder="What needs doing?"
                  aria-invalid={Boolean(titleError)}
                />
                {titleError && <small className="error">{titleError}</small>}
              </label>

              <label>
                <span>Description <em>Optional</em></span>
                <textarea
                  rows={3}
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  placeholder="Add a little context..."
                />
              </label>

              <div className="form-grid">
                <label>
                  <span>Priority</span>
                  <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as Priority })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>

                <label>
                  <span>Status</span>
                  <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Status })}>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
              </div>

              <div className="form-grid">
                <label>
                  <span>Due date <em>Optional</em></span>
                  <input
                    type="date"
                    value={draft.dueDate ?? ""}
                    onChange={(event) => setDraft({ ...draft, dueDate: event.target.value || null })}
                  />
                </label>

                <label>
                  <span>Repeat</span>
                  <select value={draft.recurrence} onChange={(event) => setDraft({ ...draft, recurrence: event.target.value as Recurrence })}>
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
              </div>

              <label>
                <span>Tags <em>Optional, comma separated</em></span>
                <input
                  value={tagText}
                  onChange={(event) => setTagText(event.target.value)}
                  placeholder="school, errands, work"
                />
              </label>

              <div className="subtask-editor">
                <label>
                  <span>Subtasks <em>Optional</em></span>
                </label>

                <div className="subtask-add">
                  <input
                    value={subtaskText}
                    onChange={(event) => setSubtaskText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addSubtask();
                      }
                    }}
                    placeholder="Add a smaller step..."
                  />
                  <button type="button" className="button outline" onClick={addSubtask} aria-label="Add subtask">
                    <Plus size={17} />
                  </button>
                </div>

                {draft.subtasks.length > 0 && (
                  <div className="draft-subtasks">
                    {draft.subtasks.map((subtask) => (
                      <div className="draft-subtask-row" key={subtask.id}>
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              subtasks: draft.subtasks.map((item) =>
                                item.id === subtask.id
                                  ? { ...item, completed: event.target.checked }
                                  : item,
                              ),
                            })
                          }
                          aria-label={`Mark ${subtask.title} complete`}
                        />
                        <span className={subtask.completed ? "subtask-done" : ""}>{subtask.title}</span>
                        <button
                          type="button"
                          className="button ghost icon-small"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              subtasks: draft.subtasks.filter((item) => item.id !== subtask.id),
                            })
                          }
                          aria-label={`Remove ${subtask.title}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
