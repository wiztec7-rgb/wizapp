import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SAMPLE_TASKS,
  isOverdue,
  readTasks,
  writeTasks,
  type Task,
  type TaskDraft,
} from "@/lib/tasks";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(SAMPLE_TASKS);

  useEffect(() => {
    setTasks(readTasks());
  }, []);

  const commit = useCallback((next: Task[]) => {
    writeTasks(next);
    setTasks(next);
  }, []);

  const addTask = useCallback(
    (draft: TaskDraft) => {
      const now = Date.now();
      const task: Task = {
        id: crypto.randomUUID(),
        title: draft.title.trim(),
        description: draft.description.trim(),
        priority: draft.priority,
        dueDate: draft.dueDate,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      };
      commit([task, ...tasks]);
    },
    [commit, tasks],
  );

  const updateTask = useCallback(
    (id: string, draft: TaskDraft) => {
      const now = Date.now();
      commit(
        tasks.map((task) =>
          task.id === id
            ? {
                ...task,
                title: draft.title.trim(),
                description: draft.description.trim(),
                priority: draft.priority,
                dueDate: draft.dueDate,
                updatedAt: now,
              }
            : task,
        ),
      );
    },
    [commit, tasks],
  );

  const toggleTask = useCallback(
    (id: string) => {
      const now = Date.now();
      commit(
        tasks.map((task) =>
          task.id === id
            ? {
                ...task,
                status: task.status === "completed" ? "pending" : "completed",
                updatedAt: now,
              }
            : task,
        ),
      );
    },
    [commit, tasks],
  );

  const deleteTask = useCallback(
    (id: string) => {
      commit(tasks.filter((task) => task.id !== id));
    },
    [commit, tasks],
  );

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.status === "completed").length;
    const pending = tasks.length - completed;
    const overdue = tasks.filter((task) => isOverdue(task)).length;
    return { total: tasks.length, completed, pending, overdue };
  }, [tasks]);

  return { tasks, stats, addTask, updateTask, toggleTask, deleteTask };
}
