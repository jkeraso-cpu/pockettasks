# PocketTasks V2

PocketTasks is a polished, lightweight personal task manager built for quickly organizing what needs attention without unnecessary complexity.

Version 2 expands the original task dashboard with smarter planning, richer organization, and repeatable workflows while keeping everything local and private in the browser.

## V2 features

- **All / Today / Upcoming views**
- **Tags** with search and filtering
- **Subtasks** with completion state and visual progress
- **Recurring tasks**: daily, weekly, or monthly
- Completing a recurring task automatically schedules the next occurrence
- **Manual ordering** with drag-and-drop and accessible up/down controls
- Sorting by manual order, due date, priority, newest, or oldest
- Search across titles, descriptions, tags, and subtasks
- Safe migration of V1 localStorage tasks into the V2 data structure

## Existing core features

- Create, edit, complete, reopen, and delete tasks
- Priority levels: Low, Medium, High
- Statuses: To Do, In Progress, Completed
- Optional due dates with overdue highlighting
- Summary cards and live task counts
- Persistent tasks using `localStorage`
- Persistent light and dark themes
- Friendly filtered and empty states
- Responsive layout for desktop, tablet, and mobile
- Accessible labels and keyboard-friendly forms
- Lightweight toast feedback after task actions
- Delete confirmation

## Tech stack

- React
- TypeScript
- Vite
- Lucide React
- CSS
- localStorage

## Run locally

```bash
git clone https://github.com/jkeraso-cpu/pockettasks.git
cd pockettasks
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Project structure

```text
src/
  App.tsx        Main V2 UI, filtering, recurrence, ordering, and interactions
  main.tsx       React entry point
  storage.ts     localStorage persistence and V1 → V2 migration
  styles.css     Responsive light/dark design system
  types.ts       Shared V2 task, subtask, recurrence, and status types
```

## Data model

Each task can now contain a title, description, priority, status, optional due date, tags, subtasks, recurrence setting, manual order position, and creation timestamp.

The existing `pockettasks.tasks.v1` storage key is intentionally retained so V1 browser data can migrate forward safely.

## Future ideas

- Cloud sync and optional accounts
- Calendar view
- Notifications and reminders
- Saved custom filters
- Productivity analytics
- Task templates

## License

This project is currently provided for portfolio and personal use.
