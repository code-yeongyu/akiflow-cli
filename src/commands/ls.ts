import { defineCommand } from "citty";
import { createClient } from "../lib/api/client";
import type { Task } from "../lib/api/types";
import * as path from "node:path";
import * as os from "node:os";
import { mkdir, writeFile } from "node:fs/promises";

interface TaskContext {
  tasks: Array<{
    shortId: number;
    id: string;
    title: string;
  }>;
  timestamp: number;
}

interface LsOptions {
  inbox?: boolean;
  all?: boolean;
  done?: boolean;
  project?: string;
  json?: boolean;
  plain?: boolean;
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function filterTasks(tasks: Task[], options: LsOptions): Task[] {
  const today = getTodayDateString();

  if (options.all) {
    return tasks;
  }

  let filtered = tasks;

  if (options.done) {
    filtered = filtered.filter((task) => task.done);
  } else {
    filtered = filtered.filter((task) => !task.done);
  }

  if (options.inbox) {
    filtered = filtered.filter((task) => !task.date);
  } else if (!options.all && !options.done) {
    filtered = filtered.filter(
      (task) => task.date && task.date <= today
    );
  }

  if (options.project) {
    const projectName = options.project;
    filtered = filtered.filter((task) =>
      task.listId?.toLowerCase().includes(projectName.toLowerCase())
    );
  }

  return filtered;
}

function colorizeStatus(done: boolean): string {
  if (done) {
    return `\x1b[32m✓\x1b[0m`;
  }
  return `\x1b[31m✗\x1b[0m`;
}

function colorizeId(id: number): string {
  return `\x1b[36m${String(id).padStart(2, " ")}\x1b[0m`;
}

function formatTaskTable(
  tasks: Task[],
  showShortIds: boolean,
  useColors: boolean
): string {
  if (tasks.length === 0) {
    return "No tasks found.";
  }

  const header = useColors
    ? `${useColors ? "\x1b[1m" : ""}ID  Status  Title${useColors ? "\x1b[0m" : ""}`
    : "ID  Status  Title";

  const rows = tasks.map((task, index) => {
    const shortId = index + 1;
    const idStr = showShortIds
      ? useColors
        ? colorizeId(shortId)
        : String(shortId).padStart(2, " ")
      : "   ";
    const statusStr = useColors ? colorizeStatus(task.done) : (task.done ? "✓" : "✗");
    const title = task.title ?? "(No title)";
    const titleStr = title.length > 50
      ? `${title.substring(0, 47)}...`
      : title;

    return `${idStr}  ${statusStr}      ${titleStr}`;
  });

  return [header, ...rows].join("\n");
}

async function saveTaskContext(tasks: Task[]): Promise<void> {
  const homeDir = os.homedir();
  const cacheDir = path.join(homeDir, ".cache", "af");

  try {
    await mkdir(cacheDir, { recursive: true });
  } catch {
    // Directory might already exist
  }

  const contextFile = path.join(cacheDir, "last-list.json");

  const context: TaskContext = {
    tasks: tasks.map((task, index) => ({
      shortId: index + 1,
      id: task.id,
      title: task.title ?? "(No title)",
    })),
    timestamp: Date.now(),
  };

  await writeFile(contextFile, JSON.stringify(context, null, 2));
}

export const lsCommand = defineCommand({
  meta: {
    name: "ls",
    description: "List tasks with filters",
  },
  args: {
    inbox: {
      type: "boolean",
      description: "Show inbox tasks (no date)",
    },
    all: {
      type: "boolean",
      description: "Show all tasks",
    },
    done: {
      type: "boolean",
      description: "Show completed tasks",
    },
    project: {
      type: "string",
      description: "Filter by project name",
    },
    json: {
      type: "boolean",
      description: "Output as JSON",
    },
    plain: {
      type: "boolean",
      description: "Output without colors",
    },
  },
  run: async ({ args }) => {
    const options: LsOptions = {
      inbox: args.inbox as boolean,
      all: args.all as boolean,
      done: args.done as boolean,
      project: args.project as string,
      json: args.json as boolean,
      plain: args.plain as boolean,
    };

    const client = createClient();

    try {
      const response = await client.getTasks();
      const tasks = response.data;

      const filteredTasks = filterTasks(tasks, options);

      if (options.json) {
        console.log(JSON.stringify(filteredTasks, null, 2));
        return;
      }

      const useColors = !options.plain;
      const output = formatTaskTable(filteredTasks, true, useColors);

      console.log(output);

      await saveTaskContext(filteredTasks);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error("Unknown error occurred");
      }
      process.exit(1);
    }
  },
});
