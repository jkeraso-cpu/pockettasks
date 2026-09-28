# PocketTasks

PocketTasks is a polished, lightweight personal task manager built for quickly organizing what needs attention without unnecessary complexity.

## Features

- Create, edit, complete, reopen, and delete tasks
- Priority levels: Low, Medium, High
- Statuses: To Do, In Progress, Completed
- Optional due dates with overdue highlighting
- Search by task title or description
- Filter by status and priority
- Summary cards and live task counts
- Persistent tasks using `localStorage`
- Persistent light and dark themes
- Friendly empty states
- Responsive layout for desktop, tablet, and mobile
- Accessible labels and keyboard-friendly forms
- Lightweight toast feedback after task actions

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

Then open the local Vite URL shown in your terminal.

## Production build

```bash
npm run build
npm run preview
```

## Project structure

```text
src/
  App.tsx        Main application UI and task interactions
  main.tsx       React entry point
  storage.ts     localStorage persistence
  styles.css     Responsive light/dark design system
  types.ts       Shared task types
```

## Version 2 ideas

- Drag-and-drop task ordering
- Tags and categories
- Subtasks
- Recurring tasks
- Today and Upcoming views
- Sort controls
- Cloud sync
- Optional user accounts
- Small productivity analytics dashboard

## License

This project is currently provided for portfolio and personal use.
