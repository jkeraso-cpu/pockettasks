export type Priority = "low" | "medium" | "high";
export type Status = "todo" | "in-progress" | "completed";
export type Recurrence = "none" | "daily" | "weekly" | "monthly";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  dueDate: string | null;
  createdAt: string;
  tags: string[];
  subtasks: Subtask[];
  recurrence: Recurrence;
  order: number;
}

export type TaskDraft = Omit<Task, "id" | "createdAt" | "order">;
