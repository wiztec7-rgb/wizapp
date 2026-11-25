import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Calendar,
  Check,
  CircleCheck,
  Clock,
  LayoutDashboard,
  ListTodo,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTasks } from "@/lib/use-tasks";
import {
  defaultDueDate,
  dueLabel,
  filterTasks,
  isOverdue,
  type Filter,
  type Priority,
  type Section,
  type Task,
  type TaskDraft,
} from "@/lib/tasks";
import { cn } from "@/lib/utils";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "completed", label: "Completed" },
];

const priorities: { id: Priority; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

type DialogState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; task: Task };

export function TaskApp() {
  const { tasks, stats, addTask, updateTask, toggleTask, deleteTask } = useTasks();
  const [section, setSection] = useState<Section>("overview");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);

  const visible = useMemo(() => filterTasks(tasks, filter, query), [tasks, filter, query]);
  const upcoming = useMemo(
    () => filterTasks(tasks, "pending", "").slice(0, 4),
    [tasks],
  );
  const recentDone = useMemo(
    () => filterTasks(tasks, "completed", "").slice(0, 3),
    [tasks],
  );

  function openCreate() {
    setDialog({ mode: "create" });
  }

  function showTasks(next: Filter) {
    setSection("tasks");
    setFilter(next);
  }

  function submitDraft(draft: TaskDraft) {
    if (dialog.mode === "edit") updateTask(dialog.task.id, draft);
    else addTask(draft);
    setDialog({ mode: "closed" });
    if (dialog.mode === "create") showTasks("all");
  }

  const completion = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-3 px-5">
          <Logo />
          <div>
            <p className="text-base font-semibold leading-none tracking-tight">TaskFlow</p>
            <p className="mt-1 text-xs text-muted-foreground">Personal tasks</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Primary">
          <NavButton
            active={section === "overview"}
            icon={<LayoutDashboard className="size-4" />}
            label="Overview"
            onClick={() => setSection("overview")}
          />
          <NavButton
            active={section === "tasks" && filter === "all"}
            icon={<ListTodo className="size-4" />}
            label="All tasks"
            count={stats.total}
            onClick={() => showTasks("all")}
          />
          <NavButton
            active={section === "tasks" && filter === "pending"}
            icon={<Clock className="size-4" />}
            label="Pending"
            count={stats.pending}
            onClick={() => showTasks("pending")}
          />
          <NavButton
            active={section === "tasks" && filter === "completed"}
            icon={<CircleCheck className="size-4" />}
            label="Completed"
            count={stats.completed}
            onClick={() => showTasks("completed")}
          />
        </nav>
        <div className="px-3 pb-3">
          <Button className="w-full" onClick={openCreate}>
            <Plus className="size-4" />
            New task
          </Button>
        </div>
        <p className="px-5 pb-5 text-xs text-muted-foreground">Saved in this browser</p>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="font-semibold tracking-tight">TaskFlow</span>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            New
          </Button>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8 lg:pb-10">
          {section === "overview" ? (
            <Overview
              stats={stats}
              completion={completion}
              upcoming={upcoming}
              recentDone={recentDone}
              onCreate={openCreate}
              onToggle={toggleTask}
              onEdit={(task) => setDialog({ mode: "edit", task })}
              onDelete={setPendingDelete}
              onViewPending={() => showTasks("pending")}
              onViewCompleted={() => showTasks("completed")}
            />
          ) : (
            <TaskBoard
              filter={filter}
              query={query}
              tasks={visible}
              onFilter={setFilter}
              onQuery={setQuery}
              onToggle={toggleTask}
              onEdit={(task) => setDialog({ mode: "edit", task })}
              onDelete={setPendingDelete}
              onCreate={openCreate}
            />
          )}
        </main>
      </div>

      <nav
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card lg:hidden"
        aria-label="Primary"
      >
        <div className="grid grid-cols-4">
          <MobileTab
            active={section === "overview"}
            label="Overview"
            icon={<LayoutDashboard className="size-5" />}
            onClick={() => setSection("overview")}
          />
          <MobileTab
            active={section === "tasks" && filter === "all"}
            label="All"
            icon={<ListTodo className="size-5" />}
            onClick={() => showTasks("all")}
          />
          <MobileTab
            active={section === "tasks" && filter === "pending"}
            label="Pending"
            icon={<Clock className="size-5" />}
            onClick={() => showTasks("pending")}
          />
          <MobileTab
            active={section === "tasks" && filter === "completed"}
            label="Done"
            icon={<CircleCheck className="size-5" />}
            onClick={() => showTasks("completed")}
          />
        </div>
      </nav>

      <TaskDialog
        state={dialog}
        onOpenChange={(open) => {
          if (!open) setDialog({ mode: "closed" });
        }}
        onSubmit={submitDraft}
      />

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete this task?</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingDelete
              ? `"${pendingDelete.title}" will be removed from this browser. This cannot be undone.`
              : "This task will be removed."}
          </AlertDialogDescription>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel className={buttonVariants({ variant: "outline" })}>Cancel</AlertDialogCancel>
            <button
              type="button"
              className={buttonVariants({ variant: "destructive" })}
              onClick={() => {
                if (pendingDelete) deleteTask(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete task
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Logo() {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="size-5" fill="none">
        <path
          d="M5 12.5 9.2 17 19 7"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function NavButton({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "transition-control flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium",
        active ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted",
      )}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined ? <span className="tabular-nums text-xs text-muted-foreground">{count}</span> : null}
    </button>
  );
}

function MobileTab({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "transition-control flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Overview({
  stats,
  completion,
  upcoming,
  recentDone,
  onCreate,
  onToggle,
  onEdit,
  onDelete,
  onViewPending,
  onViewCompleted,
}: {
  stats: { total: number; completed: number; pending: number; overdue: number };
  completion: number;
  upcoming: Task[];
  recentDone: Task[];
  onCreate: () => void;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onViewPending: () => void;
  onViewCompleted: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">What is open, finished, and coming due.</p>
      </div>

      <section className="grid grid-cols-3 gap-2 sm:gap-4" aria-label="Task statistics">
        <StatCard label="Total tasks" value={stats.total} hint="On your list" />
        <StatCard label="Completed" value={stats.completed} hint="Marked done" />
        <StatCard
          label="Pending"
          value={stats.pending}
          hint={stats.overdue > 0 ? `${stats.overdue} overdue` : "Still open"}
          hintTone={stats.overdue > 0 ? "danger" : "muted"}
        />
      </section>

      <section className="rounded-2xl border border-border bg-card px-4 py-4 sm:px-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium">Completion</h2>
          <p className="text-sm tabular-nums text-muted-foreground">
            {stats.completed} of {stats.total}
            <span className="ml-2 font-medium text-foreground">{completion}%</span>
          </p>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={completion}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Completion"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${completion}%` }} />
        </div>
      </section>

      {stats.total === 0 ? (
        <EmptyState
          title="No tasks yet"
          body="Add a task with a priority and a due date. Your list stays in this browser."
          action="New task"
          onAction={onCreate}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <section className="lg:col-span-3">
            <SectionHeader title="Up next" action="View pending" onAction={onViewPending} />
            <TaskList
              tasks={upcoming}
              emptyTitle="Nothing pending"
              emptyBody="Every open task is finished. Add another when you are ready."
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </section>
          <section className="lg:col-span-2">
            <SectionHeader title="Recently completed" action="View done" onAction={onViewCompleted} />
            <TaskList
              tasks={recentDone}
              emptyTitle="None finished yet"
              emptyBody="Completed tasks will collect here."
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </section>
        </div>
      )}
    </div>
  );
}

function TaskBoard({
  filter,
  query,
  tasks,
  onFilter,
  onQuery,
  onToggle,
  onEdit,
  onDelete,
  onCreate,
}: {
  filter: Filter;
  query: string;
  tasks: Task[];
  onFilter: (filter: Filter) => void;
  onQuery: (query: string) => void;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onCreate: () => void;
}) {
  const heading = filter === "pending" ? "Pending" : filter === "completed" ? "Completed" : "All tasks";
  const subtitle =
    filter === "pending"
      ? "Sorted by due date."
      : filter === "completed"
        ? "Most recently finished first."
        : "Open tasks first, then by due date.";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-lg bg-muted p-1" role="tablist" aria-label="Filter tasks">
          {filters.map((item) => {
            const selected = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onFilter(item.id)}
                className={cn(
                  "transition-control h-11 flex-1 rounded-md px-3 text-sm font-medium sm:flex-none sm:px-4",
                  selected ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            id="task-search"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search tasks"
            aria-label="Search tasks"
            className="h-11 w-full rounded-lg border border-input bg-card pr-3 pl-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title={query.trim() ? "No matching tasks" : "Nothing in this view"}
          body={
            query.trim()
              ? "Try a different word, or clear the search."
              : "Add a task, or switch filters to see the rest of your list."
          }
          action="New task"
          onAction={onCreate}
        />
      ) : (
        <TaskList tasks={tasks} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  hintTone = "muted",
}: {
  label: string;
  value: number;
  hint: string;
  hintTone?: "muted" | "danger";
}) {
  return (
    <article className="rounded-2xl border border-border bg-card px-3 py-4 sm:px-5">
      <h2 className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</h2>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className={cn("mt-1 text-xs", hintTone === "danger" ? "font-medium text-destructive" : "text-muted-foreground")}>
        {hint}
      </p>
    </article>
  );
}

function SectionHeader({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <button
        type="button"
        onClick={onAction}
        className="transition-control h-11 rounded-lg px-3 text-sm font-medium text-primary hover:bg-accent"
      >
        {action}
      </button>
    </div>
  );
}

function EmptyState({
  title,
  body,
  action,
  onAction,
}: {
  title: string;
  body: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>
      <Button className="mt-6" onClick={onAction}>
        <Plus className="size-4" />
        {action}
      </Button>
    </div>
  );
}

function TaskList({
  tasks,
  emptyTitle,
  emptyBody,
  onToggle,
  onEdit,
  onDelete,
}: {
  tasks: Task[];
  emptyTitle?: string;
  emptyBody?: string;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  if (tasks.length === 0 && emptyTitle && emptyBody) {
    return (
      <div className="rounded-2xl border border-border bg-card px-5 py-8">
        <p className="font-medium">{emptyTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{emptyBody}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  );
}

function TaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const done = task.status === "completed";
  const overdue = isOverdue(task);

  return (
    <li className="flex gap-1 px-2 py-2 sm:px-3" data-task-id={task.id}>
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        aria-pressed={done}
        aria-label={done ? `Mark pending: ${task.title}` : `Mark completed: ${task.title}`}
        className="pressable transition-control grid size-11 shrink-0 place-items-center rounded-lg hover:bg-muted"
      >
        <span
          className={cn(
            "grid size-6 place-items-center rounded-full border-2",
            done ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card",
          )}
        >
          {done ? <Check className="size-3.5" strokeWidth={3} /> : null}
        </span>
      </button>
      <div className="min-w-0 flex-1 py-1.5">
        <p className={cn("font-medium break-words", done && "text-muted-foreground line-through")}>{task.title}</p>
        {task.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <PriorityBadge priority={task.priority} />
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              overdue && "text-destructive",
              !overdue && !done && isDueToday(task) && "text-primary",
              (done || (!overdue && !isDueToday(task))) && "text-muted-foreground",
            )}
          >
            <Calendar className="size-3.5" aria-hidden="true" />
            {dueLabel(task.dueDate)}
            {overdue ? " · Overdue" : ""}
          </span>
          <span className="ml-auto flex">
            <Button variant="ghost" size="icon" aria-label={`Edit ${task.title}`} onClick={() => onEdit(task)}>
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label={`Delete ${task.title}`} onClick={() => onDelete(task)}>
              <Trash2 className="size-4" />
            </Button>
          </span>
        </div>
      </div>
    </li>
  );
}

function isDueToday(task: Task): boolean {
  return dueLabel(task.dueDate) === "Today";
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const label = priority === "high" ? "High" : priority === "medium" ? "Medium" : "Low";
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md px-2 text-xs font-medium",
        priority === "high" && "bg-danger-soft text-destructive",
        priority === "medium" && "bg-warning-soft text-warning",
        priority === "low" && "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

function TaskDialog({
  state,
  onOpenChange,
  onSubmit,
}: {
  state: DialogState;
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: TaskDraft) => void;
}) {
  const open = state.mode !== "closed";
  const initial = state.mode === "edit" ? state.task : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          const field = document.getElementById("task-title");
          if (field instanceof HTMLInputElement) field.focus();
        }}
      >
        {open ? (
          <TaskForm
            key={initial?.id ?? "new"}
            initial={initial}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function TaskForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: Task | null;
  onSubmit: (draft: TaskDraft) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? defaultDueDate());
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) {
      setError("Add a title to save this task.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      setError("Choose a due date.");
      return;
    }
    setError("");
    onSubmit({ title: nextTitle, description, priority, dueDate });
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{initial ? "Edit task" : "New task"}</DialogTitle>
        <DialogDescription>
          {initial ? "Update the details, then save." : "Give it a title, a priority, and a due date."}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-5 flex flex-col gap-4">
        <Field label="Title" htmlFor="task-title">
          <input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            required
            placeholder="What needs doing?"
            className={fieldClass}
          />
        </Field>
        <Field label="Description" htmlFor="task-description">
          <textarea
            id="task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={600}
            rows={4}
            placeholder="Add context, optional"
            className={cn(fieldClass, "h-auto py-3")}
          />
        </Field>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Priority</legend>
          <div className="grid grid-cols-3 gap-2">
            {priorities.map((item) => {
              const selected = priority === item.id;
              return (
                <label
                  key={item.id}
                  className={cn(
                    "transition-control flex h-11 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium focus-within:ring-2 focus-within:ring-ring",
                    selected
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border bg-card text-foreground hover:bg-muted",
                  )}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="priority"
                    value={item.id}
                    checked={selected}
                    onChange={() => setPriority(item.id)}
                  />
                  {item.label}
                </label>
              );
            })}
          </div>
        </fieldset>
        <Field label="Due date" htmlFor="task-due">
          <input
            id="task-due"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            required
            className={fieldClass}
          />
        </Field>
        {error ? (
          <p className="text-sm font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initial ? "Save changes" : "Save task"}</Button>
      </div>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring";
