import { defineCommand } from "citty";
import { createClient } from "../lib/api/client";
import type { Task } from "../lib/api/types";
import * as path from "node:path";
import * as os from "node:os";
import { mkdir, writeFile } from "node:fs/promises";
import { loadPendingTasks, mergeTasks, removePendingTask } from "../lib/task-cache";

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

function getConnectorPrefix(connectorId: string | null): string {
  if (!connectorId) return "";
  const connectorMap: Record<string, string> = {
    slack: "[Slack]",
    gmail: "[Gmail]",
    github: "[GitHub]",
    jira: "[Jira]",
    asana: "[Asana]",
    trello: "[Trello]",
    notion: "[Notion]",
    linear: "[Linear]",
  };
  return connectorMap[connectorId.toLowerCase()] ?? `[${connectorId}]`;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
}

export function getTaskDisplayTitle(task: Task, maxLength = 60): string {
  // 1. Use title if available
  if (task.title && task.title.trim()) {
    return task.title;
  }

  // 2. Use doc.original_message with connector prefix
  const originalMessage = task.doc?.original_message;
  if (typeof originalMessage === "string" && originalMessage.trim()) {
    const prefix = getConnectorPrefix(task.connector_id);
    const cleanedMessage = originalMessage.replace(/\n/g, " ").trim();
    const fullMessage = prefix ? `${prefix} ${cleanedMessage}` : cleanedMessage;
    return truncateText(fullMessage, maxLength);
  }

  // 3. Use description field
  if (task.description && task.description.trim()) {
    return truncateText(task.description.replace(/\n/g, " ").trim(), maxLength);
  }

  // 4. Last resort
  return "(No title)";
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
    const displayTitle = getTaskDisplayTitle(task, 50);

    return `${idStr}  ${statusStr}      ${displayTitle}`;
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
      title: getTaskDisplayTitle(task),
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
      const apiTasks = response.data;

      // Load pending tasks and merge with API response
      const pendingTasks = await loadPendingTasks();
      const tasks = mergeTasks(apiTasks, pendingTasks);

      // Clean up pending tasks that are now in API response
      const apiTaskIds = new Set(apiTasks.map((t) => t.id));
      for (const pending of pendingTasks) {
        if (apiTaskIds.has(pending.id)) {
          await removePendingTask(pending.id);
        }
      }

      const filteredTasks = filterTasks(tasks, options);

      if (options.json) {
        const output = JSON.stringify(filteredTasks, null, 2);
        await new Promise<void>((resolve, reject) => {
          process.stdout.write(output + '\n', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
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
