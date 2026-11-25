import { format, isBefore, isToday, isTomorrow, parseISO, startOfDay } from "date-fns";
import { z } from "zod";

export const STORAGE_KEY = "taskflow.tasks.v1";

export type Priority = "low" | "medium" | "high";
export type Status = "pending" | "completed";
export type Filter = "all" | "pending" | "completed";
export type Section = "overview" | "tasks";

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  status: Status;
  createdAt: number;
  updatedAt: number;
};

export type TaskDraft = {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
};

const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["pending", "completed"]),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const tasksSchema = z.array(taskSchema);

const priorityRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function localISODate(offsetDays: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const SAMPLE_TASKS: Task[] = [
  {
    id: "sample-sprint",
    title: "Finalize the sprint plan",
    description: "Align scope with design and engineering before Wednesday's planning session.",
    priority: "high",
    dueDate: localISODate(1),
    status: "pending",
    createdAt: 60,
    updatedAt: 60,
  },
  {
    id: "sample-renewal",
    title: "Follow up on the Northwind renewal",
    description: "Send the revised proposal and confirm their decision timeline.",
    priority: "medium",
    dueDate: localISODate(3),
    status: "pending",
    createdAt: 50,
    updatedAt: 50,
  },
  {
    id: "sample-budget",
    title: "Prepare the quarterly budget notes",
    description: "Pull last quarter's actuals and flag anything over ten percent.",
    priority: "high",
    dueDate: localISODate(-1),
    status: "pending",
    createdAt: 40,
    updatedAt: 40,
  },
  {
    id: "sample-onboarding",
    title: "Draft the onboarding email sequence",
    description: "Three notes: welcome, first week, and the resource list.",
    priority: "low",
    dueDate: localISODate(6),
    status: "pending",
    createdAt: 30,
    updatedAt: 30,
  },
  {
    id: "sample-archive",
    title: "Archive last month's meeting notes",
    description: "Move finished docs into the shared archive folder.",
    priority: "low",
    dueDate: localISODate(-2),
    status: "completed",
    createdAt: 20,
    updatedAt: 80,
  },
  {
    id: "sample-a11y",
    title: "Review the accessibility checklist",
    description: "Check keyboard focus, contrast, and labels on the settings panel.",
    priority: "medium",
    dueDate: localISODate(-1),
    status: "completed",
    createdAt: 10,
    updatedAt: 70,
  },
];

export function readTasks(): Task[] {
  if (typeof window === "undefined") return SAMPLE_TASKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      writeTasks(SAMPLE_TASKS);
      return SAMPLE_TASKS;
    }
    const parsed = tasksSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      writeTasks(SAMPLE_TASKS);
      return SAMPLE_TASKS;
    }
    return parsed.data;
  } catch {
    return SAMPLE_TASKS;
  }
}

export function writeTasks(tasks: Task[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Private mode or a full quota should not crash the UI.
  }
}

export function isOverdue(task: Task, today = new Date()): boolean {
  if (task.status !== "pending") return false;
  return isBefore(parseISO(task.dueDate), startOfDay(today));
}

export function dueLabel(dueDate: string): string {
  const date = parseISO(dueDate);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return format(date, sameYear ? "MMM d" : "MMM d, yyyy");
}

export function sortTasks(tasks: Task[], filter: Filter): Task[] {
  return [...tasks].sort((a, b) => {
    if (filter === "all" && a.status !== b.status) {
      return a.status === "pending" ? -1 : 1;
    }
    if (a.status === "completed" && b.status === "completed") {
      return b.updatedAt - a.updatedAt;
    }
    if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
    return priorityRank[a.priority] - priorityRank[b.priority];
  });
}

export function filterTasks(tasks: Task[], filter: Filter, query: string): Task[] {
  const needle = query.trim().toLowerCase();
  return sortTasks(
    tasks.filter((task) => {
      if (filter === "pending" && task.status !== "pending") return false;
      if (filter === "completed" && task.status !== "completed") return false;
      if (!needle) return true;
      return (
        task.title.toLowerCase().includes(needle) ||
        task.description.toLowerCase().includes(needle)
      );
    }),
    filter,
  );
}

export function defaultDueDate(): string {
  return localISODate(1);
}
