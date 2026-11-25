import { createFileRoute } from "@tanstack/react-router";
import { TaskApp } from "@/components/taskflow/task-app";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <TaskApp />;
}
